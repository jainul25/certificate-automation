import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '../middleware/errorHandler.js';
import { getTemplateById } from './templateController.js';
import { generateCertificatePdf } from '../services/pdfService.js';
import { emailService } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailParticipant {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'sent' | 'failed';
  certificatePath?: string;
  errorMessage?: string;
}

interface EmailSession {
  id: string;
  templateId: string;
  participants: EmailParticipant[];
  emailConfig: {
    subject: string;
    body: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  completedAt?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

// In-memory storage
const emailSessions = new Map<string, EmailSession>();
const emailTemplates = new Map<string, EmailTemplate>();

/**
 * Send bulk emails with certificates
 */
export async function sendBulkEmails(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { templateId, participants, emailConfig } = req.body;

    // Validation
    if (!templateId) {
      return next(createError('Template ID is required', 400, 'MISSING_TEMPLATE_ID'));
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return next(createError('Participants array is required', 400, 'MISSING_PARTICIPANTS'));
    }

    if (!emailConfig || !emailConfig.subject || !emailConfig.body) {
      return next(
        createError('Email configuration (subject and body) is required', 400, 'MISSING_EMAIL_CONFIG')
      );
    }

    // Check if email service is configured
    if (!emailService.isReady()) {
      return next(
        createError(
          'Email service is not configured. Please set SMTP environment variables.',
          503,
          'EMAIL_NOT_CONFIGURED'
        )
      );
    }

    // Verify SMTP connection
    const isConnected = await emailService.verifyConnection();
    if (!isConnected) {
      return next(
        createError('Failed to connect to email server', 503, 'EMAIL_CONNECTION_FAILED')
      );
    }

    // Get template
    const template = getTemplateById(templateId);
    if (!template) {
      return next(createError('Template not found', 404, 'TEMPLATE_NOT_FOUND'));
    }

    if (!template.position || !template.fontSettings) {
      return next(
        createError('Template position not configured', 400, 'TEMPLATE_NOT_CONFIGURED')
      );
    }

    // Validate participant emails
    const validatedParticipants = participants.map((p: any) => {
      const isValidEmail = emailService.validateEmail(p.email);
      return {
        id: p.id || uuidv4(),
        name: p.name,
        email: p.email,
        status: isValidEmail ? 'pending' : 'failed',
        errorMessage: isValidEmail ? undefined : 'Invalid email address',
      };
    });

    // Create email session
    const sessionId = uuidv4();
    const session: EmailSession = {
      id: sessionId,
      templateId,
      participants: validatedParticipants as EmailParticipant[],
      emailConfig: {
        subject: emailConfig.subject,
        body: emailConfig.body,
      },
      status: 'processing',
      progress: 0,
      sentCount: 0,
      failedCount: validatedParticipants.filter((p: any) => p.status === 'failed').length,
      createdAt: new Date().toISOString(),
    };

    emailSessions.set(sessionId, session);

    // Start email sending process (async)
    processEmailSending(session, template).catch(console.error);

    res.json({
      sessionId,
      status: 'processing',
      totalCount: participants.length,
      validCount: validatedParticipants.filter((p: any) => p.status !== 'failed').length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Process email sending with certificate generation
 */
async function processEmailSending(session: EmailSession, template: any) {
  const outputDir = path.resolve(__dirname, '../../outputs', session.id);
  await fs.mkdir(outputDir, { recursive: true });

  // Filter only valid participants
  const validParticipants = session.participants.filter((p) => p.status === 'pending');

  for (let i = 0; i < validParticipants.length; i++) {
    const participant = validParticipants[i];

    try {
      // Generate certificate
      const pdfBytes = await generateCertificatePdf(
        template.filePath,
        participant.name,
        template.position,
        template.fontSettings
      );

      const safeFileName = participant.name
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);

      const fileName = `Certificate_${safeFileName}_${Date.now()}.pdf`;
      const filePath = path.join(outputDir, fileName);

      await fs.writeFile(filePath, pdfBytes);
      participant.certificatePath = filePath;

      // Send email
      const emailResult = await emailService.sendCertificateEmail(
        participant.email,
        participant.name,
        filePath,
        session.emailConfig
      );

      if (emailResult.success) {
        participant.status = 'sent';
        session.sentCount++;
      } else {
        participant.status = 'failed';
        participant.errorMessage = emailResult.error;
        session.failedCount++;
      }
    } catch (error) {
      console.error(`Error processing email for ${participant.name}:`, error);
      participant.status = 'failed';
      participant.errorMessage = error instanceof Error ? error.message : 'Processing failed';
      session.failedCount++;
    }

    // Update progress
    const totalProcessed = session.sentCount + session.failedCount;
    const totalParticipants = session.participants.length;
    session.progress = Math.round((totalProcessed / totalParticipants) * 100);
    emailSessions.set(session.id, session);
  }

  // Mark session as completed
  session.status = session.failedCount === 0 ? 'completed' : 'completed';
  session.completedAt = new Date().toISOString();
  emailSessions.set(session.id, session);
}

/**
 * Get email session status
 */
export async function getEmailSessionStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { sessionId } = req.params;
    const session = emailSessions.get(sessionId);

    if (!session) {
      return next(createError('Email session not found', 404, 'SESSION_NOT_FOUND'));
    }

    res.json({
      status: session.status,
      progress: session.progress,
      sentCount: session.sentCount,
      failedCount: session.failedCount,
      totalCount: session.participants.length,
      participants: session.participants,
      emailConfig: session.emailConfig,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, emailConfig } = req.body;

    if (!email) {
      return next(createError('Email address is required', 400, 'MISSING_EMAIL'));
    }

    if (!emailConfig || !emailConfig.subject || !emailConfig.body) {
      return next(
        createError('Email configuration (subject and body) is required', 400, 'MISSING_EMAIL_CONFIG')
      );
    }

    // Check if email service is configured
    if (!emailService.isReady()) {
      return next(
        createError(
          'Email service is not configured. Please set SMTP environment variables.',
          503,
          'EMAIL_NOT_CONFIGURED'
        )
      );
    }

    // Validate email
    if (!emailService.validateEmail(email)) {
      return next(createError('Invalid email address', 400, 'INVALID_EMAIL'));
    }

    // Send test email
    const result = await emailService.sendTestEmail(email, emailConfig);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
      });
    } else {
      return next(createError(result.error || 'Failed to send test email', 500, 'EMAIL_SEND_FAILED'));
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Save email template
 */
export async function saveEmailTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
      return next(
        createError('Template name, subject, and body are required', 400, 'MISSING_TEMPLATE_DATA')
      );
    }

    const templateId = uuidv4();
    const template: EmailTemplate = {
      id: templateId,
      name,
      subject,
      body,
      createdAt: new Date().toISOString(),
    };

    emailTemplates.set(templateId, template);

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all email templates
 */
export async function getEmailTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = Array.from(emailTemplates.values());
    res.json({ templates });
  } catch (error) {
    next(error);
  }
}

/**
 * Check email service configuration status
 */
export async function checkEmailConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const isReady = emailService.isReady();
    
    if (!isReady) {
      res.json({
        configured: false,
        message: 'Email service is not configured. Please set SMTP environment variables.',
      });
      return;
    }

    const isConnected = await emailService.verifyConnection();
    
    res.json({
      configured: true,
      connected: isConnected,
      message: isConnected ? 'Email service is ready' : 'Failed to connect to SMTP server',
    });
  } catch (error) {
    next(error);
  }
}
