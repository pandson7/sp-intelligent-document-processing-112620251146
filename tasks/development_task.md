# Development Task for Intelligent Document Processing Application

## Project Details
- **Project Folder**: /home/pandson/echo-architect-artifacts/sp-intelligent-document-processing-112620251146
- **Project Owner**: sp

## Original User Requirements

You need to build Intelligent Document Processing (IDP) application. Provide a simple user interface for uploading the documents. Once the document is uploaded, store it in AWS storage and trigger IDP pipeline. IDP pipeline needs to perform these 3 tasks in the order specified here:

1. **Run OCR to extract the contents as key-value pair in JSON format** (handle markdown-wrapped JSON correctly). It should support JPEG, PNG and PDF file formats.

2. **Document Classification** (Available categories - Dietary Supplement, Stationery, Kitchen Supplies, Medicine, Driver License, Invoice, W2, Other).

3. **Document Summarization**.

Store the results of each task in the DynamoDB and also display the results in the user interface once all 3 tasks are complete. Keep the User interface simple. Ensure it works end to end, test frontend actions with backend processing and display the results in the frontend.

## Testing Requirements
The sample documents are available in "~/ea_sample_docs/idp_docs" folder, ONLY use these documents to perform end to end test starting with:
1. File upload from the frontend
2. Data Extraction in JSON format  
3. Classification
4. Summarization

Make sure file upload from frontend, data extraction, Classification and Summarization are working correctly with JPEG, PDF and PNG file formats available in sample documents provided at "~/ea_sample_docs/idp_docs". Ensure all file formats are working before marking the status as complete.

## Technical Considerations
Check AWS documentation for each file format before implementing. Different services handle formats differently: Bedrock Claude: PDF as `document`, images as `image`.

Once done, Start the development server and launch the webapp.

## Specification Files Available
- requirements.md: /home/pandson/echo-architect-artifacts/sp-intelligent-document-processing-112620251146/specs/requirements.md
- design.md: /home/pandson/echo-architect-artifacts/sp-intelligent-document-processing-112620251146/specs/design.md  
- tasks.md: /home/pandson/echo-architect-artifacts/sp-intelligent-document-processing-112620251146/specs/tasks.md

## Critical Requirements
- Build complete AWS solution using CDK for infrastructure as code
- Ensure end-to-end functionality with all file formats (JPEG, PNG, PDF)
- Test with sample documents in ~/ea_sample_docs/idp_docs
- Create PROJECT_SUMMARY.md file in project root when complete
- Start development server and launch webapp after completion
