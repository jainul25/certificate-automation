# Document Automation Web App

A comprehensive web application for automating document creation, including personalized certificates and professional letterhead documents.

## Features

### Certificate Generation
- **PDF Template Upload**: Upload your certificate template as a PDF file
- **Visual Position Marking**: Click and drag to mark exactly where names should appear
- **Font Customization**: Choose font family, size, color, and alignment
- **Flexible Name Input**: Add names manually or import from Excel files (with email addresses)
- **Batch Generation**: Generate certificates for multiple participants at once
- **Email Delivery**: Send certificates directly via email with custom templates
- **ZIP Download**: Download all generated certificates in a single ZIP file

### Letterhead Documents (NEW!)
- **Template Support**: Upload PDF or DOCX letterhead templates
- **Rich Text Editor**: Format content with bold, italic, underline, lists, tables, and images
- **File Upload**: Upload DOCX files with pre-written content
- **Flexible Output**: Generate documents as PDF or DOCX
- **Auto Formatting**: Content automatically flows with letterhead template
- See [LETTERHEAD_FEATURE.md](LETTERHEAD_FEATURE.md) for detailed documentation

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- react-pdf for PDF preview
- react-dropzone for file uploads
- xlsx (SheetJS) for Excel parsing
- Tiptap for rich text editing
- Lucide React for icons

### Backend
- Node.js 18+
- Express.js
- pdf-lib for PDF manipulation
- docx for DOCX file creation and manipulation
- mammoth for DOCX parsing
- libreoffice-convert for format conversion
- archiver for ZIP creation
- multer for file uploads
- nodemailer for email delivery

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

1. Clone the repository:
```bash
cd "Certificate Automation"
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file for the server:
```bash
cp .env.example server/.env
```

4. Start the development servers:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Usage

### Certificate Generation

#### Step 1: Upload Template
1. Select "Certificates" tab in the navigation
2. Drag and drop your PDF certificate template
3. Or click to browse and select a file
4. Maximum file size: 10MB

#### Step 2: Mark Name Position
1. Click on the PDF where you want names to appear
2. Drag the blue rectangle to adjust position and size
3. Customize font settings in the sidebar:
   - Font family (Helvetica, Times, Courier)
   - Font size (12-72px)
   - Font color (hex color picker)
   - Text alignment (left, center, right)

#### Step 3: Add Participants
**Manual Entry:**
- Enter names separated by commas or new lines
- Example: `John Doe, Jane Smith, Bob Wilson`

**Excel Upload:**
- Upload .xlsx or .xls file
- Names should be in Column A
- Email addresses in Column B (optional, required for email delivery)
- First row is treated as header if it contains keywords like "name" or "email"

#### Step 4: Generate & Deliver
**Download Method:**
1. Review the summary of template and participants
2. Click "Generate Certificates"
3. Wait for progress to complete
4. Click "Download All Certificates (ZIP)"

**Email Delivery Method:**
1. Switch to "Email Delivery" tab
2. Review participants with email addresses
3. Customize email subject and body (supports template variables like `{name}`)
4. Send test email (optional)
5. Click "Send Emails" to deliver certificates to all participants
6. Monitor sending progress and view delivery report

### Letterhead Documents

#### Step 1: Upload Letterhead Template
1. Select "Letterhead" tab in the navigation
2. Upload your letterhead (PDF or DOCX)
3. Maximum file size: 10MB

#### Step 2: Add Content
Choose your input method:
- **Text Editor**: Use rich formatting tools to write content
- **Upload File**: Upload a DOCX file with your content

#### Step 3: Generate & Download
1. Select output format (PDF or DOCX)
2. Wait for document generation
3. Download your completed letterhead document

For detailed letterhead feature documentation, see [LETTERHEAD_FEATURE.md](LETTERHEAD_FEATURE.md)

## Project Structure

```
certificate-automation/
├── client/                    # React frontend
│   └── src/
│       ├── components/        # UI components
│       │   ├── TemplateUpload/
│       │   ├── ParticipantInput/
│       │   ├── CertificateGeneration/
│       │   └── common/
│       ├── contexts/          # React context for state
│       ├── hooks/             # Custom hooks
│       ├── services/          # API client
│       ├── types/             # TypeScript types
│       └── utils/             # Utility functions
├── server/                    # Express backend
│   └── src/
│       ├── controllers/       # Route handlers
│       ├── services/          # Business logic
│       ├── middleware/        # Express middleware
│       └── routes/            # API routes
└── package.json               # Root package.json
```

## API Endpoints

### Templates
- `POST /api/templates/upload` - Upload PDF template
- `POST /api/templates/:id/position` - Save name position and font settings
- `GET /api/templates/:id` - Get template details
- `GET /api/templates` - List all templates

### Participants
- `POST /api/participants/manual` - Parse manual name input
- `POST /api/participants/excel` - Parse Excel file

### Certificates
- `POST /api/certificates/generate` - Start certificate generation
- `GET /api/certificates/session/:id/status` - Get generation progress
- `GET /api/certificates/session/:id/download` - Download ZIP file
- `POST /api/certificates/preview` - Preview single certificate

### Letterhead
- `POST /api/letterhead/upload-template` - Upload letterhead template (PDF/DOCX)
- `POST /api/letterhead/upload-content` - Upload content DOCX file
- `POST /api/letterhead/generate` - Generate merged document
- `GET /api/letterhead/:id` - Get document details
- `GET /api/letterhead/:id/download` - Download generated document

### Email
- `POST /api/email/send` - Send bulk emails with certificates
- `GET /api/email/session/:id/status` - Get email sending progress
- `POST /api/email/test` - Send test email
- `POST /api/email/templates/save` - Save custom email template
- `GET /api/email/templates` - Get saved email templates
- `GET /api/email/config/check` - Check email service configuration

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Starting Production Server
```bash
npm run start
```

## Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3001
NODE_ENV=development
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
MAX_FILE_SIZE=10485760
CLEANUP_INTERVAL=86400000

# Email Configuration (Optional - for email delivery feature)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Your Name <your-email@gmail.com>
EMAIL_SUBJECT_TEMPLATE=Your Certificate is Ready
EMAIL_BODY_TEMPLATE=Dear {name},\n\nPlease find attached your certificate.\n\nBest regards
```

### Email Setup (Gmail)

To use email delivery with Gmail:

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Under "2-Step Verification", click "App passwords"
   - Generate a new app password for "Mail"
3. Use the generated password as `SMTP_PASS` in your `.env` file
4. Set `SMTP_USER` to your Gmail address

**Note:** The email feature is optional. If not configured, only the ZIP download option will be available.

## License

MIT

