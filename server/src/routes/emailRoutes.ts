import { Router } from 'express';
import {
  sendBulkEmails,
  getEmailSessionStatus,
  sendTestEmail,
  saveEmailTemplate,
  getEmailTemplates,
  checkEmailConfig,
} from '../controllers/emailController.js';

const router = Router();

// Send bulk emails with certificates
router.post('/send', sendBulkEmails);

// Get email session status
router.get('/session/:sessionId/status', getEmailSessionStatus);

// Send test email
router.post('/test', sendTestEmail);

// Save email template
router.post('/templates/save', saveEmailTemplate);

// Get all email templates
router.get('/templates', getEmailTemplates);

// Check email configuration status
router.get('/config/check', checkEmailConfig);

export default router;
