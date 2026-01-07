# Certificate Automation Web App

A web application that automates the generation of personalized certificates by overlaying participant names onto PDF certificate templates.

## Features

- **PDF Template Upload**: Upload your certificate template as a PDF file
- **Visual Position Marking**: Click and drag to mark exactly where names should appear
- **Font Customization**: Choose font family, size, color, and alignment
- **Flexible Name Input**: Add names manually or import from Excel files
- **Batch Generation**: Generate certificates for multiple participants at once
- **ZIP Download**: Download all generated certificates in a single ZIP file

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- react-pdf for PDF preview
- react-dropzone for file uploads
- xlsx (SheetJS) for Excel parsing

### Backend
- Node.js 18+
- Express.js
- pdf-lib for PDF manipulation
- archiver for ZIP creation
- multer for file uploads

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

### Step 1: Upload Template
1. Drag and drop your PDF certificate template
2. Or click to browse and select a file
3. Maximum file size: 10MB

### Step 2: Mark Name Position
1. Click on the PDF where you want names to appear
2. Drag the blue rectangle to adjust position and size
3. Customize font settings in the sidebar:
   - Font family (Helvetica, Times, Courier)
   - Font size (12-72px)
   - Font color (hex color picker)
   - Text alignment (left, center, right)

### Step 3: Add Participants
**Manual Entry:**
- Enter names separated by commas or new lines
- Example: `John Doe, Jane Smith, Bob Wilson`

**Excel Upload:**
- Upload .xlsx or .xls file
- Names should be in Column A
- First row is treated as header if it contains keywords like "name"

### Step 4: Generate & Download
1. Review the summary of template and participants
2. Click "Generate Certificates"
3. Wait for progress to complete
4. Click "Download All Certificates (ZIP)"

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
```

## License

MIT

