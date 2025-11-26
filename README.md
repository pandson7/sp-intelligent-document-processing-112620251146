# Intelligent Document Processing (IDP) Application

A complete AWS-based serverless application that automates document analysis through OCR extraction, AI-powered classification, and intelligent summarization.

## 🚀 Features

- **Document Upload**: Secure file upload supporting JPEG, PNG, and PDF formats
- **OCR Processing**: Extract text and data using Amazon Textract
- **AI Classification**: Categorize documents using Amazon Bedrock (Claude Sonnet 4)
- **Intelligent Summarization**: Generate concise summaries with key insights
- **Real-time Processing**: Track document processing status in real-time
- **Responsive UI**: Modern React TypeScript frontend
- **Serverless Architecture**: Fully serverless AWS infrastructure

## 🏗️ Architecture

### Backend (AWS CDK)
- **AWS Lambda**: Serverless processing functions
- **Amazon S3**: Document storage with CORS configuration
- **Amazon DynamoDB**: Metadata and results persistence
- **Amazon API Gateway**: REST API with CORS support
- **Amazon Textract**: OCR processing
- **Amazon Bedrock**: AI/ML processing with Claude Sonnet 4

### Frontend
- **React 18**: Modern React with TypeScript
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live processing status
- **File Upload**: Drag-and-drop file upload interface

## 📋 Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Access to Amazon Bedrock (Claude Sonnet 4 model)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd sp-intelligent-document-processing-112620251146
```

### 2. Install Dependencies
```bash
# Install CDK dependencies
npm install

# Install frontend dependencies
cd src/frontend
npm install
cd ../..
```

### 3. Configure AWS
```bash
# Configure AWS CLI if not already done
aws configure

# Bootstrap CDK (if first time using CDK in this account/region)
cdk bootstrap
```

### 4. Deploy Backend Infrastructure
```bash
# Deploy the CDK stack
cdk deploy
```

### 5. Start Frontend Development Server
```bash
cd src/frontend
npm start
```

The application will be available at `http://localhost:3000`

## 🎯 Usage

### Document Processing Workflow

1. **Upload Document**: Select or drag-and-drop a JPEG, PNG, or PDF file
2. **OCR Processing**: Text and data extraction using Amazon Textract
3. **Classification**: AI-powered categorization into predefined categories:
   - Dietary Supplement
   - Stationery
   - Kitchen Supplies
   - Medicine
   - Driver License
   - Invoice
   - W2
   - Other
4. **Summarization**: Generate intelligent summary with key insights
5. **View Results**: Real-time display of all processing results

### Supported File Formats
- **JPEG/JPG**: Image documents
- **PNG**: Image documents  
- **PDF**: Multi-page documents

### API Endpoints

The deployed API Gateway provides the following endpoints:

- `POST /upload` - Generate pre-signed S3 URL for file upload
- `POST /process/ocr` - Process document with OCR
- `POST /process/classify` - Classify document type
- `POST /process/summarize` - Generate document summary
- `GET /status/{documentId}` - Get processing status and results

## 🧪 Testing

### Sample Documents
The project includes sample documents for testing:
- PDF receipt (`Receipt_26Aug2025_084539.pdf`)
- JPEG driver's license (`DriversLicense.jpeg`)
- PNG invoice (`Invoice.png`)

### Running Tests
```bash
# Run CDK tests
npm test

# Run frontend tests
cd src/frontend
npm test
```

## 📁 Project Structure

```
sp-intelligent-document-processing-112620251146/
├── bin/                          # CDK app entry point
│   └── intelligent-document-processing.ts
├── lib/                          # CDK stack definition
│   └── intelligent-document-processing-stack.ts
├── src/
│   ├── frontend/                 # React TypeScript application
│   │   ├── public/
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   └── backend/                  # Lambda function source (inline in CDK)
├── specs/                        # Requirements and design documents
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── tasks/                        # Development task definitions
├── generated-diagrams/           # Architecture diagrams
├── pricing/                      # Cost analysis
├── package.json                  # CDK dependencies
├── tsconfig.json                 # TypeScript configuration
├── cdk.json                      # CDK configuration
├── PROJECT_SUMMARY.md           # Detailed project summary
└── README.md                    # This file
```

## 🔧 Configuration

### Environment Variables
The application uses the following configuration:
- AWS region: `us-east-1` (configurable in CDK)
- DynamoDB table: Auto-scaling enabled
- Lambda timeout: 30 seconds
- API Gateway: CORS enabled for all origins

### Customization
- Modify document categories in the classification Lambda function
- Adjust processing timeouts in CDK stack
- Update UI styling in React components
- Configure additional AWS services as needed

## 💰 Cost Optimization

The application is designed for cost efficiency:
- **Serverless Architecture**: Pay only for actual usage
- **Auto-scaling DynamoDB**: Scales based on demand
- **Efficient Lambda Functions**: Optimized memory and timeout settings
- **S3 Lifecycle Policies**: Automatic cleanup of temporary files

Estimated monthly cost for moderate usage: $10-50 USD

## 🔒 Security Features

- **IAM Roles**: Least privilege access for all services
- **Pre-signed URLs**: Secure file uploads without exposing credentials
- **CORS Configuration**: Proper browser security
- **Input Validation**: Server-side validation for all inputs
- **No Hardcoded Secrets**: Dynamic AWS account resolution

## 🚀 Deployment

### Production Deployment
1. Update environment-specific configurations
2. Deploy CDK stack: `cdk deploy --profile production`
3. Build frontend: `cd src/frontend && npm run build`
4. Deploy frontend to S3/CloudFront (optional)

### CI/CD Pipeline
Consider implementing:
- GitHub Actions or AWS CodePipeline
- Automated testing and deployment
- Environment-specific configurations
- Blue-green deployments

## 📊 Monitoring & Logging

The application includes:
- **CloudWatch Logs**: Automatic logging for all Lambda functions
- **API Gateway Logs**: Request/response logging
- **DynamoDB Metrics**: Performance monitoring
- **Error Handling**: Comprehensive error reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
1. Check the [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for detailed implementation notes
2. Review AWS service documentation
3. Check CloudWatch logs for debugging
4. Open an issue in the repository

## 🔄 Version History

- **v1.0.0** - Initial release with complete IDP pipeline
  - OCR processing with Amazon Textract
  - AI classification with Amazon Bedrock
  - Document summarization
  - React frontend with real-time updates
  - Full AWS CDK infrastructure

## 🎯 Roadmap

Future enhancements:
- [ ] User authentication and multi-tenancy
- [ ] Batch processing capabilities
- [ ] Document versioning and history
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] Additional file format support
- [ ] Custom classification categories
- [ ] Integration with external systems

---

**Built with ❤️ using AWS CDK, React, and TypeScript**
