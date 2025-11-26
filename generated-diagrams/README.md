# Intelligent Document Processing - AWS Architecture Diagrams

This directory contains AWS architecture diagrams for the Intelligent Document Processing (IDP) application.

## Generated Diagrams

### 1. Main Architecture Overview (`idp_main_architecture.png`)
- **Purpose**: High-level system architecture showing all major components
- **Components**: 
  - React Frontend with User interface
  - API Gateway for REST endpoints
  - Lambda functions for processing logic
  - S3 for document storage
  - DynamoDB for results and metadata
  - AWS Textract for OCR processing
  - AWS Bedrock (Claude model) for classification and summarization
- **Flow**: Shows the complete data flow from user upload to results retrieval

### 2. Processing Pipeline Flow (`idp_processing_pipeline.png`)
- **Purpose**: Detailed step-by-step processing workflow
- **Features**: 
  - Sequential processing steps numbered 1-23
  - Shows async processing chain: OCR → Classification → Summarization
  - Illustrates status tracking and results retrieval
  - Demonstrates how each step updates DynamoDB with progress
- **Use Case**: Understanding the complete document processing lifecycle

### 3. Data Storage Architecture (`idp_data_storage.png`)
- **Purpose**: Data organization and storage structure
- **S3 Structure**:
  - `uploads/` folder for original documents
  - `processed/` folder for processing artifacts
- **DynamoDB Schema**:
  - Primary key: documentId
  - Attributes: fileName, fileType, processingStatus, ocrResults, classification, summary
- **Flow**: Shows how data moves between storage systems

### 4. API Architecture (`idp_api_architecture.png`)
- **Purpose**: API design and endpoint interactions
- **Endpoints**:
  - `POST /upload` - Document upload and processing trigger
  - `GET /status/{id}` - Processing status check
  - `GET /results/{id}` - Retrieve processing results
- **Features**: Shows async processing chain and Lambda function responsibilities

## Key Architecture Principles

### Serverless Design
- All compute using AWS Lambda functions
- No server management required
- Automatic scaling based on demand

### Asynchronous Processing
- Upload triggers async processing pipeline
- Each processing step chains to the next
- Status tracking allows real-time progress monitoring

### Data Persistence
- S3 for document storage (original and processed files)
- DynamoDB for metadata, status, and results
- Separation of concerns between file storage and structured data

### AI/ML Integration
- AWS Textract for OCR across multiple file formats (JPEG, PNG, PDF)
- AWS Bedrock Claude model for intelligent classification and summarization
- No custom ML model training required

### Security & Best Practices
- API Gateway for secure REST endpoints
- IAM roles with least privilege access
- Encrypted storage in DynamoDB
- File validation and size limits

## File Format Support
- **JPEG/PNG**: Direct image processing via Textract
- **PDF**: Document processing via Textract
- All formats supported by both OCR and AI processing steps

## Processing States
1. `UPLOADED` - Document stored in S3
2. `OCR_COMPLETE` - Text extraction finished
3. `CLASSIFIED` - Document classification complete
4. `SUMMARIZED` - Document summarization complete
5. `COMPLETE` - All processing finished

## Deployment
- Infrastructure as Code using AWS CDK
- Single stack deployment
- Environment-specific configurations supported
