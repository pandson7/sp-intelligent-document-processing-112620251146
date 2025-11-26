# Design Document

## Introduction

The Intelligent Document Processing (IDP) application follows a serverless architecture using AWS services. The system consists of a React frontend, API Gateway for REST endpoints, Lambda functions for processing logic, S3 for document storage, and DynamoDB for results persistence.

## System Architecture

### High-Level Architecture

```
[React Frontend] → [API Gateway] → [Lambda Functions] → [AWS Services]
                                                     ↓
[DynamoDB] ← [Processing Pipeline] ← [S3 Storage]
```

### Component Overview

1. **Frontend Layer**: React application for user interface
2. **API Layer**: API Gateway with REST endpoints
3. **Processing Layer**: Lambda functions for business logic
4. **Storage Layer**: S3 for documents, DynamoDB for metadata
5. **AI/ML Layer**: AWS Bedrock for OCR, classification, and summarization

## Detailed Design

### Frontend Architecture

**Technology Stack:**
- React.js for UI components
- Axios for API communication
- Local development server

**Key Components:**
- DocumentUpload: File upload interface with validation
- ProcessingStatus: Real-time processing progress display
- ResultsDisplay: Formatted display of OCR, classification, and summary results

### Backend Architecture

**API Gateway Endpoints:**
- POST /upload - Document upload and processing trigger
- GET /status/{documentId} - Processing status check
- GET /results/{documentId} - Retrieve processing results

**Lambda Functions:**

1. **UploadHandler**
   - Validates file format (JPEG, PNG, PDF)
   - Uploads document to S3
   - Triggers processing pipeline
   - Returns document ID

2. **OCRProcessor**
   - Handles different file formats appropriately
   - Uses AWS Textract for OCR extraction
   - Formats results as JSON key-value pairs
   - Stores results in DynamoDB

3. **DocumentClassifier**
   - Uses AWS Bedrock Claude model for classification
   - Classifies into predefined categories
   - Stores classification results in DynamoDB

4. **DocumentSummarizer**
   - Uses AWS Bedrock Claude model for summarization
   - Generates concise document summaries
   - Stores summary results in DynamoDB

5. **StatusHandler**
   - Retrieves processing status from DynamoDB
   - Returns current progress to frontend

6. **ResultsHandler**
   - Retrieves complete processing results
   - Formats response for frontend display

### Data Storage Design

**S3 Bucket Structure:**
```
idp-documents/
├── uploads/
│   ├── {documentId}.{extension}
└── processed/
    └── {documentId}/
        ├── ocr-results.json
        ├── classification.json
        └── summary.json
```

**DynamoDB Table Schema:**
```
Table: IDPDocuments
Primary Key: documentId (String)
Attributes:
- fileName (String)
- fileType (String)
- uploadTimestamp (Number)
- processingStatus (String) // UPLOADED, OCR_COMPLETE, CLASSIFIED, SUMMARIZED, COMPLETE
- ocrResults (Map)
- classification (String)
- summary (String)
- errorMessages (List)
```

### Processing Pipeline Flow

```
1. Document Upload
   ↓
2. S3 Storage
   ↓
3. OCR Processing (Textract)
   ↓
4. Classification (Bedrock Claude)
   ↓
5. Summarization (Bedrock Claude)
   ↓
6. Results Display
```

### File Format Handling

**JPEG/PNG Files:**
- Use AWS Textract with image input
- Pass as base64 encoded image to Bedrock Claude

**PDF Files:**
- Use AWS Textract with document input
- Pass as document object to Bedrock Claude

### Error Handling Strategy

1. **Upload Validation**: Client-side and server-side file format validation
2. **Processing Errors**: Graceful degradation with partial results
3. **Retry Logic**: Automatic retry for transient failures
4. **Error Logging**: CloudWatch logs for debugging
5. **User Feedback**: Clear error messages in UI

### Security Considerations

1. **File Upload**: Size limits and format validation
2. **API Access**: Basic request validation
3. **S3 Access**: Least privilege IAM roles
4. **DynamoDB**: Encrypted at rest
5. **Lambda**: VPC configuration if needed

### Performance Considerations

1. **Concurrent Processing**: Asynchronous Lambda execution
2. **Caching**: DynamoDB for fast result retrieval
3. **File Size Limits**: Reasonable limits for processing time
4. **Timeout Handling**: Appropriate Lambda timeout settings

### Deployment Architecture

**Infrastructure as Code:**
- AWS CDK for resource provisioning
- Single stack deployment
- Environment-specific configurations

**Resource Configuration:**
- Lambda: Node.js runtime, appropriate memory allocation
- API Gateway: REST API with CORS enabled
- S3: Versioning disabled, lifecycle policies
- DynamoDB: On-demand billing, point-in-time recovery

### Integration Points

**AWS Services Integration:**
- Textract: OCR processing for all file formats
- Bedrock: Claude model for classification and summarization
- S3: Document storage and retrieval
- DynamoDB: Metadata and results storage
- CloudWatch: Logging and monitoring

**External Dependencies:**
- React development server for frontend
- AWS SDK for service integration
- CDK for infrastructure deployment
