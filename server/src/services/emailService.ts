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
  private provider: 'sendgrid' | 'smtp' | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Prefer SendGrid (HTTP-based, works on Railway)
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (sendgridApiKey) {
      sgMail.setApiKey(sendgridApiKey);
      this.isConfigured = true;
      this.provider = 'sendgrid';
      console.log('Email service initialized with SendGrid');
      return;
    }

    // Fallback to SMTP
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('Email service is not configured. Please set SENDGRID_API_KEY or SMTP environment variables.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
      this.isConfigured = true;
      this.provider = 'smtp';
      console.log(`Email service initialized with SMTP (${smtpHost}:${smtpPort})`);
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  public isReady(): boolean {
    return this.isConfigured;
  }

  public async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('SMTP verification timed out')), 10000)
      );
      await Promise.race([this.transporter.verify(), timeoutPromise]);
      return true;
    } catch (error) {
      console.error('SMTP verification failed:', error);
      return false;
    }
  }

  private replaceTemplateVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return result;
  }

  public validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  public async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.isReady()) {
      return { success: false, error: 'Email service is not configured' };
    }

    if (!this.validateEmail(options.to)) {
      return { success: false, error: 'Invalid email address' };
    }

    try {
      if (this.provider === 'sendgrid') {
        return await this.sendViaSendGrid(options);
      }
      return await this.sendViaSMTP(options);
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }

  private async sendViaSendGrid(options: SendEmailOptions): Promise<EmailResult> {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
    const body: any = {
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: from.match(/<(.+)>/) ? from.match(/<(.+)>/)![1] : from, name: from.match(/^(.+?)\s*</) ? from.match(/^(.+?)\s*</)?.[1]?.trim() : undefined },
      subject: options.subject,
      content: [
        { type: 'text/plain', value: options.body },
        { type: 'text/html', value: options.body.replace(/\n/g, '<br>') },
      ],
    };

    if (options.attachmentPath) {
      const exists = await fs.access(options.attachmentPath).then(() => true).catch(() => false);
      if (!exists) return { success: false, error: 'Attachment file not found' };
      const content = await fs.readFile(options.attachmentPath);
      body.attachments = [{
        content: content.toString('base64'),
        filename: options.attachmentName || path.basename(options.attachmentPath),
        type: 'application/pdf',
        disposition: 'attachment',
      }];
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', response.status, errorText);
      return { success: false, error: `SendGrid error: ${response.status}` };
    }
    return { success: true };
  }

  private async sendViaSMTP(options: SendEmailOptions): Promise<EmailResult> {
    const mailOptions: any = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.body.replace(/\n/g, '<br>'),
    };

    if (options.attachmentPath) {
      const exists = await fs.access(options.attachmentPath).then(() => true).catch(() => false);
      if (!exists) return { success: false, error: 'Attachment file not found' };
      mailOptions.attachments = [{
        filename: options.attachmentName || path.basename(options.attachmentPath),
        path: options.attachmentPath,
      }];
    }

    await this.transporter!.sendMail(mailOptions);
    return { success: true };
  }

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

    const subject = this.replaceTemplateVariables(
      emailConfig?.subject || process.env.EMAIL_SUBJECT_TEMPLATE || 'Your Certificate is Ready',
      variables
    );
    const body = this.replaceTemplateVariables(
      emailConfig?.body || process.env.EMAIL_BODY_TEMPLATE || 'Dear {name},\n\nPlease find attached your certificate.\n\nBest regards',
      variables
    );

    return this.sendEmail({
      to: recipientEmail,
      subject,
      body,
      attachmentPath: certificatePath,
      attachmentName: `${recipientName.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`,
    });
  }

  public async sendTestEmail(recipientEmail: string, emailConfig: EmailConfig): Promise<EmailResult> {
    const variables = {
      name: 'Test User',
      email: recipientEmail,
      date: new Date().toLocaleDateString(),
      certificateName: 'Test Certificate',
    };

    return this.sendEmail({
      to: recipientEmail,
      subject: this.replaceTemplateVariables(emailConfig.subject, variables),
      body: this.replaceTemplateVariables(emailConfig.body, variables) + '\n\n[This is a test email. No certificate is attached.]',
    });
  }

  public async sendBulkEmails(
    emails: Array<{ to: string; name: string; certificatePath: string }>,
    emailConfig: EmailConfig,
    onProgress?: (sent: number, failed: number, total: number) => void
  ): Promise<Array<{ email: string; success: boolean; error?: string }>> {
    const results: Array<{ email: string; success: boolean; error?: string }> = [];
    let sent = 0;
    let failed = 0;

    for (const emailData of emails) {
      let result: EmailResult = { success: false };
      let attempts = 0;

      while (attempts < 3) {
        result = await this.sendCertificateEmail(emailData.to, emailData.name, emailData.certificatePath, emailConfig);
        if (result.success) {
          sent++;
          results.push({ email: emailData.to, success: true });
          break;
        }
        attempts++;
        if (attempts < 3) await new Promise((r) => setTimeout(r, 1000 * attempts));
        else {
          failed++;
          results.push({ email: emailData.to, success: false, error: result.error });
        }
      }

      if (onProgress) onProgress(sent, failed, emails.length);
      if (emails.indexOf(emailData) < emails.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return results;
  }
}

export const emailService = new EmailService();
export default emailService;
