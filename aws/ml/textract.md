# Amazon Textract

## Overview
- **Purpose**: Extract text and data from scanned documents using ML
- **Category**: Machine Learning (Document AI)
- **Use Case**: Document processing, data extraction, OCR

## Key Features

### Text Detection
- **Printed Text**: Typed documents
- **Handwriting**: Handwritten text recognition
- **Multi-language**: Support for multiple languages
- **Layout**: Preserve document structure

### Forms Extraction
- **Key-Value Pairs**: Extract form fields
- **Checkboxes**: Detect selection state
- **Tables**: Extract tabular data
- **Relationships**: Maintain field relationships

### Tables Extraction
- **Cell Detection**: Individual cell recognition
- **Row/Column Structure**: Preserve table layout
- **Merged Cells**: Handle complex tables
- **Multi-page**: Tables spanning pages

### Queries
- **Natural Language**: Ask questions about documents
- **Specific Data**: Extract targeted information
- **Custom Fields**: Define extraction patterns
- **Confidence Scores**: Quality metrics

### Document Analysis
- **Invoices**: Standardized invoice data
- **Receipts**: Receipt field extraction
- **ID Documents**: Passport, license extraction
- **Forms**: W-2, 1040, etc.

## APIs

### Synchronous Operations
- **DetectDocumentText**: Simple text extraction
- **AnalyzeDocument**: Forms and tables
- **AnalyzeExpense**: Invoices and receipts
- **AnalyzeID**: Identity documents

### Asynchronous Operations
- **StartDocumentTextDetection**: Large documents
- **StartDocumentAnalysis**: Forms/tables at scale
- **StartExpenseAnalysis**: Batch invoice processing
- **GetDocumentTextDetection**: Retrieve results

## Input Sources
- **S3**: Documents in S3 buckets
- **Direct Upload**: Inline document bytes
- **Supported Formats**: PDF, PNG, JPEG, TIFF
- **Size Limits**: 5 MB sync, 500 MB async

## Output Format
- **JSON**: Structured extraction results
- **Bounding Boxes**: Coordinate locations
- **Confidence Scores**: Accuracy metrics
- **Relationships**: Entity connections

## Common Use Cases

### Financial Services
- Invoice processing
- Loan application extraction
- Tax document processing
- Receipt management

### Healthcare
- Patient form digitization
- Medical record extraction
- Insurance claim processing
- Prescription analysis

### Legal
- Contract analysis
- Legal document processing
- Case file digitization
- Compliance documentation

### Government
- ID verification
- Form processing
- Records digitization
- Compliance checks

## Integration Patterns

### Lambda Integration
```python
textract = boto3.client('textract')
response = textract.analyze_document(
    Document={'S3Object': {'Bucket': bucket, 'Name': key}},
    FeatureTypes=['FORMS', 'TABLES']
)
```

### Step Functions
- Orchestrate multi-step workflows
- Combine with other AI services
- Error handling and retries
- Human review integration

### A2I (Augmented AI)
- Human review for low confidence
- Quality assurance workflows
- Training data collection
- Continuous improvement

## Best Practices
- Use async APIs for large documents
- Implement retry logic
- Cache results when possible
- Monitor confidence scores
- Use specific APIs (AnalyzeExpense vs generic)
- Optimize image quality
- Handle multi-page documents properly
- Set up human review for edge cases

## Performance Optimization
- Pre-process images (deskew, denoise)
- Use appropriate resolution (150-300 DPI)
- Convert to grayscale if possible
- Compress images efficiently
- Batch processing for scale
- Use CloudFront for S3 access

## Pricing Model
- Per-page charges
- Different rates for different APIs
- Higher cost for tables/forms vs text-only
- Bulk pricing available
- Free tier: 1,000 pages/month (12 months)

## Accuracy Considerations
- Image quality affects results
- Handwriting less accurate than print
- Complex layouts may need custom logic
- Always validate extracted data
- Use confidence scores to flag review
- Test with representative samples

## SAP-C02 Exam Tips
- Know Textract extracts text, forms, and tables from documents
- Understand sync vs async operations
- Remember use cases: invoices, receipts, IDs, forms
- Know integration with A2I for human review
- Understand AnalyzeExpense for invoice/receipt processing
- Remember AnalyzeID for identity documents
- Know Queries feature for natural language extraction
- Recognize document processing automation scenarios
