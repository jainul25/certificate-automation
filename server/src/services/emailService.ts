import nodemailer, { Transporter } from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

interface EmailConfig {
  subject: string;
  body: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  attachmentPath?: string;
  attachmentName?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Check if email is configured
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('Email service is not configured. Please set SMTP environment variables.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587', 10),
        secure: false, // Use TLS
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.isConfigured = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if email service is properly configured
   */
  public isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Verify SMTP connection
   */
  public async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP verification failed:', error);
      return false;
    }
  }

  /**
   * Replace template variables in text
   */
  private replaceTemplateVariables(
    text: string,
    variables: Record<string, string>
  ): string {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  /**
   * Validate email address format
   */
  public validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Send a single email with optional attachment
   */
  public async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Email service is not configured',
      };
    }

    if (!this.validateEmail(options.to)) {
      return {
        success: false,
        error: 'Invalid email address',
      };
    }

    try {
      const mailOptions: any = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        text: options.body,
        html: options.body.replace(/\n/g, '<br>'),
      };

      // Add attachment if provided
      if (options.attachmentPath) {
        try {
          const attachmentExists = await fs
            .access(options.attachmentPath)
            .then(() => true)
            .catch(() => false);

          if (attachmentExists) {
            mailOptions.attachments = [
              {
                filename: options.attachmentName || path.basename(options.attachmentPath),
                path: options.attachmentPath,
              },
            ];
          } else {
            return {
              success: false,
              error: 'Attachment file not found',
            };
          }
        } catch (error) {
          return {
            success: false,
            error: 'Failed to access attachment file',
          };
        }
      }

      await this.transporter!.sendMail(mailOptions);

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send certificate email with template variables
   */
  public async sendCertificateEmail(
    recipientEmail: string,
    recipientName: string,
    certificatePath: string,
    emailConfig?: EmailConfig
  ): Promise<EmailResult> {
    const variables = {
      name: recipientName,
      email: recipientEmail,
      date: new Date().toLocaleDateString(),
      certificateName: 'Certificate',
    };

    const subject = emailConfig?.subject || process.env.EMAIL_SUBJECT_TEMPLATE || 'Your Certificate is Ready';
    const body = emailConfig?.body || process.env.EMAIL_BODY_TEMPLATE || 'Dear {name},\n\nPlease find attached your certificate.\n\nBest regards';

    const processedSubject = this.replaceTemplateVariables(subject, variables);
    const processedBody = this.replaceTemplateVariables(body, variables);

    return this.sendEmail({
      to: recipientEmail,
      subject: processedSubject,
      body: processedBody,
      attachmentPath: certificatePath,
      attachmentName: `${recipientName.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`,
    });
  }

  /**
   * Send test email
   */
  public async sendTestEmail(
    recipientEmail: string,
    emailConfig: EmailConfig
  ): Promise<EmailResult> {
    const variables = {
      name: 'Test User',
      email: recipientEmail,
      date: new Date().toLocaleDateString(),
      certificateName: 'Test Certificate',
    };

    const processedSubject = this.replaceTemplateVariables(emailConfig.subject, variables);
    const processedBody = this.replaceTemplateVariables(emailConfig.body, variables);

    return this.sendEmail({
      to: recipientEmail,
      subject: processedSubject,
      body: processedBody + '\n\n[This is a test email. No certificate is attached.]',
    });
  }

  /**
   * Send bulk emails with retry logic
   */
  public async sendBulkEmails(
    emails: Array<{
      to: string;
      name: string;
      certificatePath: string;
    }>,
    emailConfig: EmailConfig,
    onProgress?: (sent: number, failed: number, total: number) => void
  ): Promise<Array<{ email: string; success: boolean; error?: string }>> {
    const results: Array<{ email: string; success: boolean; error?: string }> = [];
    let sent = 0;
    let failed = 0;

    for (const emailData of emails) {
      let result: EmailResult;
      let attempts = 0;
      const maxAttempts = 3;

      // Retry logic
      while (attempts < maxAttempts) {
        result = await this.sendCertificateEmail(
          emailData.to,
          emailData.name,
          emailData.certificatePath,
          emailConfig
        );

        if (result.success) {
          sent++;
          results.push({ email: emailData.to, success: true });
          break;
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        } else {
          // Max attempts reached
          failed++;
          results.push({
            email: emailData.to,
            success: false,
            error: result.error,
          });
        }
      }

      // Call progress callback
      if (onProgress) {
        onProgress(sent, failed, emails.length);
      }

      // Small delay between emails to avoid rate limiting
      if (emails.indexOf(emailData) < emails.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
