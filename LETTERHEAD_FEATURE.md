# Letterhead Document Creation Feature

## Overview

The Letterhead Document Creation feature allows users to create professional documents by combining their company letterhead with custom content. This feature supports both PDF and DOCX letterhead templates and provides flexible content input options.

## Features

### 1. Template Upload
- **Supported Formats**: PDF and DOCX
- **Max File Size**: 10MB
- Upload your company's letterhead template with existing branding, headers, and footers

### 2. Content Input Options

#### Text Editor
- Rich text editor powered by Tiptap
- Formatting options:
  - Bold, Italic, Underline
  - Text alignment (left, center, right)
  - Bullet and numbered lists
  - Tables with customizable rows and columns
  - Image insertion via URL
  - Font size selection (Normal, Heading 1-3)
- Real-time preview of formatting

#### File Upload
- Upload DOCX files containing your content
- Preserves original formatting from the uploaded document
- Supports text, tables, and basic formatting

### 3. Output Formats
- **PDF**: Universal format, suitable for distribution and printing
- **DOCX**: Editable format for further modifications

### 4. Automatic Merging
- Content is automatically positioned below the letterhead
- Multi-page support for longer content
- Format preservation from editor or uploaded files

## How to Use

### Step 1: Upload Letterhead Template
1. Switch to the "Letterhead" tab in the navigation
2. Drag and drop your letterhead file (PDF or DOCX)
3. Or click to browse and select a file
4. Wait for the upload to complete

### Step 2: Add Content
1. Choose your content input method:
   - **Text Editor**: Type or paste content directly with rich formatting
   - **Upload File**: Upload a DOCX file with your prepared content
2. For Text Editor:
   - Use the toolbar to format your text
   - Add lists, tables, or images as needed
   - Content is automatically saved
3. For Upload File:
   - Drag and drop your DOCX file
   - Or click to browse and select

### Step 3: Generate & Download
1. Select your preferred output format (PDF or DOCX)
2. The system will automatically generate your document
3. Wait for the generation progress to complete
4. Click "Download Document" to save your file
5. Optionally create another letterhead document

## Technical Details

### Backend Services

#### Letterhead Service (`letterheadService.ts`)
- Handles the merging of letterhead templates with content
- Supports both PDF and DOCX letterhead processing
- Manages multi-page content flow

#### DOCX Service (`docxService.ts`)
- Parses and manipulates DOCX files
- Converts HTML content to DOCX paragraphs
- Extracts content from uploaded DOCX files

#### Conversion Service (`conversionService.ts`)
- Converts between PDF and DOCX formats
- Uses LibreOffice for high-quality conversions
- Fallback options for systems without LibreOffice

### Frontend Components

- **LetterheadWizard**: Main workflow orchestrator
- **TemplateUpload**: Handles letterhead template upload
- **ContentInput**: Toggles between editor and file upload
- **ContentEditor**: Rich text editor with formatting toolbar
- **ContentUpload**: DOCX file upload interface
- **PreviewDownload**: Generation progress and download interface

### API Endpoints

```
POST /api/letterhead/upload-template    - Upload letterhead template
POST /api/letterhead/upload-content     - Upload content DOCX file
POST /api/letterhead/generate           - Generate merged document
GET  /api/letterhead/:id                - Get document details
GET  /api/letterhead/:id/download       - Download generated document
```

## Requirements

### Server Requirements
- Node.js 18+
- LibreOffice (optional, for DOCX to PDF conversion)
  - macOS: `brew install libreoffice`
  - Ubuntu: `apt-get install libreoffice`
  - Windows: Download from libreoffice.org

### Browser Requirements
- Modern browser with JavaScript enabled
- Support for HTML5 file APIs
- Recommended: Chrome, Firefox, Safari, Edge (latest versions)

## Limitations

### Current Version
1. **Single Document Creation**: One document at a time (no batch processing)
2. **Content Positioning**: Automatic positioning only (no manual placement)
3. **Format Preservation**: Basic formatting supported (complex layouts may be simplified)
4. **File Size**: 10MB limit for uploaded files

### PDF Letterheads
- Content is overlaid on PDF letterhead pages
- Limited formatting options compared to DOCX
- Best for simple text content

### DOCX Letterheads
- Supports richer content formatting
- Table and image support
- Better for complex documents

## Troubleshooting

### Document Generation Fails
- **Check LibreOffice Installation**: Required for DOCX to PDF conversion
- **File Size**: Ensure files are under 10MB
- **File Format**: Verify letterhead is PDF or DOCX
- **Content**: Ensure content is not empty

### Formatting Issues
- **Text Overflow**: Long content automatically flows to new pages
- **Fonts**: System fonts are used; custom fonts may not be available
- **Tables**: Complex table styling may be simplified
- **Images**: Images in uploaded DOCX files may not render in PDF output

### Performance
- Large files (>5MB) may take longer to process
- DOCX to PDF conversion requires additional processing time
- Complex content with many images/tables increases generation time

## Future Enhancements

Potential features for future versions:
- Batch letterhead generation with mail merge
- Template variable substitution ({{name}}, {{date}}, etc.)
- Manual content positioning
- Multiple content zones (header, body, footer)
- Cloud storage integration
- Template library and reuse
- Collaborative editing
- Version history

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in the application
3. Check browser console for technical errors
4. Ensure all dependencies are installed
5. Verify LibreOffice installation for conversions

## Examples

### Use Case 1: Business Letter
1. Upload company letterhead (PDF with logo and contact info)
2. Use text editor to write the letter body
3. Format with appropriate spacing and alignment
4. Generate as PDF for professional appearance

### Use Case 2: Report
1. Upload letterhead template (DOCX with company branding)
2. Upload pre-written report content (DOCX file)
3. Generate as DOCX for further editing
4. Convert to PDF when finalized

### Use Case 3: Memo
1. Upload letterhead (PDF or DOCX)
2. Use text editor with table for structured information
3. Add bullet points for key items
4. Generate as PDF for distribution
