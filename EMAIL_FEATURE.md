# Email Delivery Feature

This document describes the email delivery feature for the Certificate Automation application.

## Overview

The email delivery feature allows users to send generated certificates directly to participants via email, instead of just downloading them as a ZIP file. This feature integrates seamlessly with the existing certificate generation workflow.

## Features

### Core Functionality
- **Bulk Email Sending**: Send certificates to multiple participants at once
- **Email Address Support**: Parse email addresses from Excel Column B
- **Custom Email Templates**: Customize subject and body with template variables
- **Real-time Progress Tracking**: Monitor email sending progress
- **Error Handling**: Automatic retry logic and detailed error reporting
- **Delivery Reports**: View which emails were sent successfully and which failed

### Email Template Variables
Users can personalize emails using these variables:
- `{name}` - Participant's name
- `{email}` - Participant's email address
- `{date}` - Current date
- `{certificateName}` - Template name

### SMTP Configuration
The system uses Nodemailer with Gmail SMTP by default, but can be configured for any SMTP server:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Your Name <your-email@gmail.com>
EMAIL_SUBJECT_TEMPLATE=Your Certificate is Ready
EMAIL_BODY_TEMPLATE=Dear {name},\n\nPlease find attached your certificate.\n\nBest regards
```

## Architecture

### Backend Components

#### Email Service (`server/src/services/emailService.ts`)
- Handles SMTP connection and configuration
- Manages email sending with attachments
- Implements retry logic (3 attempts with exponential backoff)
- Validates email addresses
- Replaces template variables

#### Email Controller (`server/src/controllers/emailController.ts`)
- Manages email sending sessions
- Generates certificates for each participant
- Tracks sending progress and status
- Provides session status API
- Handles test email sending

#### Email Routes (`server/src/routes/emailRoutes.ts`)
- `POST /api/email/send` - Start bulk email sending
- `GET /api/email/session/:id/status` - Get sending progress
- `POST /api/email/test` - Send test email
- `POST /api/email/templates/save` - Save email template
- `GET /api/email/templates` - Get saved templates
- `GET /api/email/config/check` - Check SMTP configuration

### Frontend Components

#### Email Composer (`client/src/components/Email/EmailComposer.tsx`)
- Email subject and body input fields
- Template variable helper
- Test email functionality
- Template variable preview

#### Email Recipients (`client/src/components/Email/EmailRecipients.tsx`)
- Displays participants with email validation
- Shows valid/invalid email counts
- Highlights participants with missing emails
- Warning messages for missing email addresses

#### Email Sending (`client/src/components/Email/EmailSending.tsx`)
- Real-time progress tracking
- Success/failure statistics
- Detailed error logs for failed emails
- Delivery report with expandable details

#### Generate Download Component (Updated)
- Dual-mode interface (Download ZIP / Email Delivery)
- Tab-based delivery method selector
- Integrated email workflow
- SMTP configuration status check

### State Management

Email-related state is managed through the existing `AppContext`:

```typescript
interface AppState {
  // ... existing state
  deliveryMethod: 'download' | 'email'
  emailConfig: EmailConfig
  emailSession: EmailSession | null
}
```

### Type Definitions

New types added in `client/src/types/index.ts`:

```typescript
interface EmailConfig {
  subject: string
  body: string
  templateId?: string
}

interface EmailParticipant {
  id: string
  name: string
  email: string
  status: 'pending' | 'sent' | 'failed'
  certificatePath?: string
  errorMessage?: string
}

interface EmailSession {
  id: string
  templateId: string
  participants: EmailParticipant[]
  emailConfig: EmailConfig
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  sentCount: number
  failedCount: number
  createdAt: string
  completedAt?: string
}
```

## User Workflow

### 1. Excel Upload with Emails
Users upload an Excel file with:
- Column A: Participant names
- Column B: Email addresses (optional)

### 2. Choose Delivery Method
In the final step, users can choose between:
- **Download ZIP**: Traditional download method
- **Email Delivery**: Send via email

### 3. Configure Email (Email Method Only)
- Customize email subject and body
- Preview template variables
- Send test email (optional)
- Review participants with valid emails

### 4. Send Emails
- Click "Send Emails" button
- Monitor real-time progress
- View success/failure statistics
- Download delivery report

## Security Considerations

### Email Validation
- Format validation using regex
- Invalid emails are skipped with warnings
- Sanitization of email content

### SMTP Security
- Credentials stored in environment variables
- Support for TLS/SSL connections
- Recommended to use App Passwords (Gmail)
- No credentials exposed to client

### Rate Limiting
- Small delay (500ms) between emails to avoid rate limiting
- Configurable batch processing
- Automatic retry with exponential backoff

## Error Handling

### Email Service Errors
- **Not Configured**: Clear warning if SMTP not set up
- **Connection Failed**: SMTP connection verification before sending
- **Invalid Email**: Skipped with warning message
- **Send Failed**: Retry 3 times, then log error

### User Feedback
- Real-time progress updates
- Success/failure counts
- Detailed error messages for failed emails
- Retry option for failed sends

## Performance

### Optimization
- Asynchronous email sending
- Progress polling (1.5s intervals)
- Efficient certificate generation
- Batch processing support

### Scalability
- In-memory session storage (can be upgraded to database)
- Configurable chunk sizes for large batches
- Non-blocking operations
- Background processing

## Testing

### Manual Testing Checklist
1. ✓ Upload Excel with names and emails
2. ✓ Validate email format detection
3. ✓ Switch between download and email modes
4. ✓ Customize email subject/body
5. ✓ Send test email
6. ✓ Send bulk emails
7. ✓ Monitor sending progress
8. ✓ View delivery report
9. ✓ Handle failed emails
10. ✓ Test without SMTP configuration

### API Testing
- Test email configuration check endpoint
- Test bulk email sending with valid data
- Test with invalid email addresses
- Test session status polling
- Test error handling

## Configuration Examples

### Gmail Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=Certificate System <your-email@gmail.com>
```

### Outlook/Office 365
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=Certificate System <your-email@outlook.com>
```

### Custom SMTP Server
```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=Certificate System <noreply@yourdomain.com>
```

## Limitations

- Maximum of 3 retry attempts per email
- No email scheduling (future enhancement)
- No email tracking (read receipts, opens)
- Attachment size limited by SMTP server settings
- In-memory session storage (not persistent across restarts)

## Future Enhancements

Potential improvements for future releases:
- Email scheduling
- Email templates library
- Delivery tracking and analytics
- Database-backed session storage
- Multiple attachment support
- Email queuing system
- Webhook support for delivery notifications
- OAuth2 authentication for Gmail
- Custom sender domains
- HTML email templates with rich formatting
