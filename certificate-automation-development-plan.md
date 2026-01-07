# Certificate Automation Web App - Development Plan

## Project Overview

A web application that automates the generation of personalized certificates by overlaying participant names onto PDF certificate templates while maintaining the original design and format.

---

## Technical Stack Recommendation

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui components
- **PDF Rendering**: react-pdf for preview
- **File Upload**: react-dropzone
- **Excel Parsing**: xlsx (SheetJS)
- **State Management**: React Context API or Zustand
- **Form Handling**: React Hook Form

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **PDF Generation**: pdf-lib (for PDF manipulation)
- **File Storage**: Local file system (initial) / AWS S3 (production)
- **Excel Processing**: xlsx on backend
- **Archive Creation**: archiver (for zip downloads)

### Optional Enhancements
- **Database**: PostgreSQL (if you want to save templates/history)
- **Queue System**: Bull/BullMQ (for batch processing)
- **OCR**: Tesseract.js (for auto-detecting name field position)

---

## Core Features & User Flow

### 1. Template Upload Flow
```
User uploads PDF → Preview displayed → User clicks to mark name position → 
Position coordinates saved → Template ready for use
```

### 2. Participant Input Flow
```
Option A: Manual text input (comma-separated or line-by-line)
Option B: Excel upload → Parse names → Display preview list
```

### 3. Certificate Generation Flow
```
Review participants list → Click "Generate Certificates" → 
Backend processes each name → ZIP file created → Download all certificates
```

---

## Detailed Feature Specifications

### Feature 1: Template Management

**Upload Certificate Template**
- Accept PDF files only (max 10MB)
- Validate PDF format
- Generate thumbnail preview
- Store template with unique ID

**Mark Name Field Position**
- Display PDF in interactive canvas
- User clicks/drags to mark rectangular area for name placement
- Store coordinates: `{x, y, width, height, page}`
- Visual feedback showing marked area
- Allow repositioning before saving

**Template Settings**
- Font family selection (common fonts + custom upload)
- Font size (adjustable, default: 36px)
- Font color (color picker, default: #000000)
- Text alignment (left/center/right)
- Preview text transformation

### Feature 2: Participant Name Input

**Manual Text Input**
- Text area accepting:
  - Comma-separated: `John Doe, Jane Smith, Alice Brown`
  - Line-by-line:
    ```
    John Doe
    Jane Smith
    Alice Brown
    ```
- Real-time validation
- Display count of valid names

**Excel Bulk Upload**
- Accept `.xlsx` and `.xls` files
- Expected format: Column A = Names (with header)
- Parse and validate names
- Show preview table with:
  - Row number
  - Name
  - Validation status
  - Remove option
- Handle errors (empty cells, invalid formats)

**Name Validation Rules**
- Minimum 2 characters
- Maximum 100 characters
- Allow alphabets, spaces, hyphens, apostrophes
- Trim whitespace
- Remove duplicates (optional setting)

### Feature 3: Certificate Generation

**Preview Before Generation**
- Show first 3 certificates as preview
- Allow font/position adjustment
- Display total count

**Batch Processing**
- Process certificates in background
- Show progress bar (X of Y completed)
- Handle errors gracefully
- Generate individual PDFs with naming: `Certificate_[Name]_[Timestamp].pdf`

**Download Options**
- Download all as ZIP: `Certificates_[Date].zip`
- Download individual certificate (from preview)
- Auto-name ZIP with timestamp

### Feature 4: Additional Features

**Template Library**
- Save templates for reuse
- Name and tag templates
- Quick load saved templates

**History/Logs** (Optional)
- Track generation sessions
- Show date, template used, participant count
- Re-download previous batches

---

## Technical Implementation Details

### Frontend Structure

```
src/
├── components/
│   ├── TemplateUpload/
│   │   ├── TemplateUploader.tsx
│   │   ├── PDFPreview.tsx
│   │   └── PositionMarker.tsx
│   ├── ParticipantInput/
│   │   ├── ManualInput.tsx
│   │   ├── ExcelUpload.tsx
│   │   └── ParticipantList.tsx
│   ├── CertificateGeneration/
│   │   ├── PreviewCertificates.tsx
│   │   ├── GenerationProgress.tsx
│   │   └── DownloadManager.tsx
│   └── common/
│       ├── Button.tsx
│       ├── FileUpload.tsx
│       └── Modal.tsx
├── contexts/
│   └── AppContext.tsx
├── hooks/
│   ├── useTemplateUpload.ts
│   ├── useParticipants.ts
│   └── useCertificateGeneration.ts
├── services/
│   ├── api.ts
│   ├── pdfService.ts
│   └── excelService.ts
├── types/
│   └── index.ts
├── utils/
│   ├── validation.ts
│   └── formatters.ts
└── App.tsx
```

### Backend Structure

```
server/
├── controllers/
│   ├── templateController.js
│   ├── participantController.js
│   └── certificateController.js
├── services/
│   ├── pdfService.js
│   ├── excelService.js
│   └── zipService.js
├── middleware/
│   ├── upload.js
│   ├── validation.js
│   └── errorHandler.js
├── utils/
│   ├── fileHelpers.js
│   └── pdfHelpers.js
├── routes/
│   └── index.js
├── uploads/ (temp storage)
├── outputs/ (generated certificates)
└── server.js
```

---

## Data Models

### Template Schema
```typescript
interface Template {
  id: string;
  name: string;
  filename: string;
  filePath: string;
  thumbnailPath?: string;
  nameFieldPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  };
  fontSettings: {
    family: string;
    size: number;
    color: string;
    alignment: 'left' | 'center' | 'right';
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Participant Schema
```typescript
interface Participant {
  id: string;
  name: string;
  email?: string; // optional for future email sending
  status: 'pending' | 'processed' | 'error';
  certificatePath?: string;
  errorMessage?: string;
}
```

### Generation Session Schema
```typescript
interface GenerationSession {
  id: string;
  templateId: string;
  participants: Participant[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  outputZipPath?: string;
  createdAt: Date;
  completedAt?: Date;
}
```

---

## API Endpoints

### Template Management
```
POST   /api/templates/upload
  - Body: multipart/form-data (PDF file)
  - Response: { templateId, previewUrl }

POST   /api/templates/:id/position
  - Body: { x, y, width, height, page, fontSettings }
  - Response: { success: true }

GET    /api/templates/:id
  - Response: Template object

GET    /api/templates
  - Response: Array of templates
```

### Participant Management
```
POST   /api/participants/manual
  - Body: { names: string[] }
  - Response: { participants: Participant[], count: number }

POST   /api/participants/excel
  - Body: multipart/form-data (Excel file)
  - Response: { participants: Participant[], count: number, errors: [] }
```

### Certificate Generation
```
POST   /api/certificates/generate
  - Body: { templateId, participants: Participant[] }
  - Response: { sessionId, status }

GET    /api/certificates/session/:sessionId/status
  - Response: { status, progress, completedCount, totalCount }

GET    /api/certificates/session/:sessionId/download
  - Response: ZIP file stream

GET    /api/certificates/:sessionId/:participantId/download
  - Response: Individual PDF file
```

---

## Key Implementation Details

### PDF Name Overlay (Backend)

```javascript
// Using pdf-lib
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function addNameToCertificate(templatePath, name, position, fontSettings) {
  // Load template PDF
  const existingPdfBytes = await fs.readFile(templatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  // Get the page
  const pages = pdfDoc.getPages();
  const page = pages[position.page];
  
  // Embed font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Calculate text positioning for center alignment
  const textWidth = font.widthOfTextAtSize(name, fontSettings.size);
  let xPos = position.x;
  
  if (fontSettings.alignment === 'center') {
    xPos = position.x + (position.width - textWidth) / 2;
  } else if (fontSettings.alignment === 'right') {
    xPos = position.x + position.width - textWidth;
  }
  
  // Draw text
  page.drawText(name, {
    x: xPos,
    y: position.y,
    size: fontSettings.size,
    font: font,
    color: rgb(0, 0, 0), // Parse from fontSettings.color
  });
  
  // Save modified PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
```

### Excel Parsing (Frontend)

```typescript
import * as XLSX from 'xlsx';

function parseExcelFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extract names (assuming column A, skip header)
        const names = jsonData
          .slice(1) // Skip header
          .map(row => row[0]) // Get first column
          .filter(name => name && typeof name === 'string')
          .map(name => name.trim());
        
        resolve(names);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}
```

### ZIP Creation (Backend)

```javascript
const archiver = require('archiver');

async function createZipArchive(certificatePaths, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => resolve(outputPath));
    archive.on('error', reject);
    
    archive.pipe(output);
    
    // Add each certificate
    certificatePaths.forEach(({ path, name }) => {
      archive.file(path, { name });
    });
    
    archive.finalize();
  });
}
```

---

## UI/UX Specifications

### Step-by-Step Wizard Layout

```
┌─────────────────────────────────────────────┐
│  Certificate Generator                       │
│  ┌────┬────┬────┐                           │
│  │ 1  │ 2  │ 3  │   Step Indicator          │
│  └────┴────┴────┘                           │
│                                              │
│  [Step Content Area]                         │
│                                              │
│  [Back]              [Next/Generate]         │
└─────────────────────────────────────────────┘
```

### Step 1: Upload Template
- Large dropzone with PDF icon
- Preview panel (right side)
- Font customization panel (collapsible)

### Step 2: Mark Name Position
- PDF canvas with click-to-mark
- Visual rectangle overlay
- Font preview overlay
- Adjustment controls (drag, resize)

### Step 3: Add Participants
- Two tabs: "Manual Entry" | "Excel Upload"
- Preview table with edit capabilities
- Participant count badge

### Step 4: Review & Generate
- Certificate preview carousel (first 3)
- Participant summary
- Generate button with loading state
- Progress bar during generation
- Download button when complete

---

## Error Handling

### Frontend
- File upload validation (size, type)
- Network error handling with retry
- User-friendly error messages
- Loading states for all async operations

### Backend
- Input validation middleware
- Try-catch blocks for PDF operations
- Graceful degradation
- Detailed error logging
- Clean up temp files on error

---

## Testing Requirements

### Unit Tests
- Excel parsing logic
- Name validation
- PDF coordinate calculations
- File upload validation

### Integration Tests
- Template upload flow
- Certificate generation pipeline
- ZIP creation
- API endpoints

### E2E Tests (Optional)
- Complete user journey
- Bulk certificate generation (100+ names)
- Error scenarios

---

## Performance Considerations

1. **Batch Processing**: Process certificates in chunks of 50
2. **Async Operations**: Use worker threads for PDF generation
3. **File Cleanup**: Auto-delete files older than 24 hours
4. **Memory Management**: Stream large files instead of loading into memory
5. **Rate Limiting**: Limit concurrent generations per user

---

## Security Considerations

1. **File Upload**:
   - Validate file types server-side
   - Scan for malicious content
   - Limit file size (10MB max)

2. **Input Sanitization**:
   - Sanitize participant names
   - Prevent PDF injection attacks

3. **File Storage**:
   - Use unique identifiers for files
   - Implement access controls
   - Auto-delete temporary files

---

## Deployment Checklist

### Environment Variables
```env
PORT=3000
NODE_ENV=production
UPLOAD_DIR=/tmp/uploads
OUTPUT_DIR=/tmp/outputs
MAX_FILE_SIZE=10485760
CLEANUP_INTERVAL=86400000
```

### Production Setup
- [ ] Set up file storage (S3/local)
- [ ] Configure CORS
- [ ] Set up logging (Winston/Pino)
- [ ] Add monitoring (Sentry)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL certificate
- [ ] Implement backups
- [ ] Add rate limiting
- [ ] Set up CI/CD pipeline

---

## Future Enhancements (Phase 2)

1. **Email Integration**: Send certificates directly to participants
2. **QR Code**: Add verification QR codes to certificates
3. **Batch Templates**: Support multiple certificate designs
4. **Analytics Dashboard**: Track generation statistics
5. **User Accounts**: Save templates and history
6. **API Access**: Allow programmatic certificate generation
7. **Webhook Support**: Notify on completion
8. **Custom Fonts**: Upload and use custom fonts
9. **Multiple Fields**: Support for date, course name, etc.
10. **OCR Auto-Detection**: Automatically detect name field position

---

## Estimated Development Timeline

- **Phase 1** (MVP - 2-3 weeks):
  - Basic template upload and position marking
  - Manual name input
  - Single certificate generation
  
- **Phase 2** (Full Features - 1-2 weeks):
  - Excel bulk upload
  - Batch processing
  - ZIP download
  
- **Phase 3** (Polish - 1 week):
  - UI/UX improvements
  - Error handling
  - Testing
  
**Total**: 4-6 weeks for full-featured application

---

## Getting Started Commands

### Initialize Frontend
```bash
# Create React app with TypeScript
npx create-react-app certificate-generator --template typescript
cd certificate-generator

# Install frontend dependencies
npm install react-pdf pdf-lib xlsx react-dropzone react-hook-form
npm install -D tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-progress

# Initialize Tailwind CSS
npx tailwindcss init -p
```

### Initialize Backend
```bash
# Create backend directory
mkdir server
cd server
npm init -y

# Install backend dependencies
npm install express multer pdf-lib xlsx archiver cors dotenv
npm install -D nodemon

# Create directory structure
mkdir -p controllers services middleware utils routes uploads outputs
```

### Project Scripts (package.json)
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "react-scripts start",
    "dev:backend": "cd server && nodemon server.js",
    "build": "react-scripts build",
    "start:backend": "cd server && node server.js"
  }
}
```

---

## Implementation Priority

### Phase 1 - Core Functionality (Week 1-2)
1. Set up project structure (Frontend + Backend)
2. Implement PDF template upload
3. Create name position marker with visual feedback
4. Build basic PDF generation with name overlay
5. Test single certificate generation

### Phase 2 - Bulk Processing (Week 3)
1. Implement manual text input for names
2. Add Excel file parsing
3. Build batch processing logic
4. Create ZIP file generation
5. Add progress tracking

### Phase 3 - Polish & Features (Week 4)
1. Improve UI/UX with step wizard
2. Add font customization options
3. Implement template library (optional)
4. Add error handling and validation
5. Create comprehensive testing suite

### Phase 4 - Deployment (Week 5-6)
1. Set up production environment
2. Configure file storage
3. Add security measures
4. Performance optimization
5. Documentation and training

---

## Critical Success Factors

1. **Accurate PDF Positioning**: Ensure name placement is pixel-perfect
2. **Performance**: Handle 100+ certificates without timeout
3. **User Experience**: Simple 3-step process with clear feedback
4. **Error Recovery**: Graceful handling of invalid inputs
5. **File Management**: Automatic cleanup to prevent storage issues

---

## Support & Maintenance

### Monitoring
- Track generation success rates
- Monitor file storage usage
- Log processing times
- Track error rates

### Maintenance Tasks
- Regular cleanup of old files
- Database backups (if used)
- Update dependencies
- Security patches

---

## Additional Resources

### Documentation Links
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [SheetJS Documentation](https://docs.sheetjs.com/)
- [React PDF Documentation](https://react-pdf.org/)
- [Archiver Documentation](https://www.archiverjs.com/)

### Sample Test Data
Create a test Excel file with:
- Column A header: "Participant Name"
- 5-10 sample names for testing
- Include edge cases (long names, special characters)

---

## Developer Handoff Notes

This plan is structured to be implemented incrementally. Start with Phase 1 to get a working prototype, then iterate based on user feedback. The architecture supports future scaling and feature additions.

**Key Decision Points:**
- Database: Start without, add PostgreSQL if history/templates needed
- Queue System: Add Bull/BullMQ if processing >100 certificates at once
- Cloud Storage: Move to S3 for production scale

**Recommended First Task:**
Begin with the PDF upload and position marking feature as it's the foundation for everything else. Test thoroughly with various PDF templates before proceeding to name overlay.

---

## Questions for Clarification

Before starting development, confirm:
1. Expected volume: How many certificates per batch typically?
2. PDF complexity: Single page or multi-page certificates?
3. Name field: Always same position or varies by template?
4. Deployment: Self-hosted or cloud platform?
5. Authentication: Single user or multi-user system?

---

*This development plan is ready to be used with Cursor/Claude Code for implementation. Each section provides enough detail for autonomous development while maintaining flexibility for adjustments based on specific requirements.*
