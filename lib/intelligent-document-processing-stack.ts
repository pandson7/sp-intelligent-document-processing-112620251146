import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IntelligentDocumentProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const suffix = '112620251146';

    // S3 Bucket for document storage
    const documentBucket = new s3.Bucket(this, `DocumentBucket${suffix}`, {
      bucketName: `idp-documents-${suffix}`,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Table for storing processing results
    const documentsTable = new dynamodb.Table(this, `DocumentsTable${suffix}`, {
      tableName: `IDPDocuments${suffix}`,
      partitionKey: { name: 'documentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Enable auto scaling
    documentsTable.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });
    documentsTable.autoScaleWriteCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });

    // IAM Role for Lambda functions
    const lambdaRole = new iam.Role(this, `LambdaRole${suffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [documentBucket.arnForObjects('*')],
            }),
          ],
        }),
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem'],
              resources: [documentsTable.tableArn],
            }),
          ],
        }),
        TextractAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['textract:DetectDocumentText', 'textract:AnalyzeDocument'],
              resources: ['*'],
            }),
          ],
        }),
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['bedrock:InvokeModel'],
              resources: [
                'arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-20250514-v1:0',
                'arn:aws:bedrock:*:*:inference-profile/global.anthropic.claude-sonnet-4-20250514-v1:0'
              ],
            }),
          ],
        }),
      },
    });

    // Upload Handler Lambda
    const uploadHandler = new lambda.Function(this, `UploadHandler${suffix}`, {
      functionName: `idp-upload-handler-${suffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({});
const dynamodb = new DynamoDBClient({});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const { fileName, fileType } = body;
    
    const documentId = crypto.randomUUID();
    const key = \`uploads/\${documentId}.\${fileType.split('/')[1]}\`;
    
    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });
    
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    // Store initial record in DynamoDB
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        documentId: { S: documentId },
        fileName: { S: fileName },
        fileType: { S: fileType },
        uploadTimestamp: { N: Date.now().toString() },
        processingStatus: { S: 'UPLOADED' },
        s3Key: { S: key }
      }
    }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ documentId, uploadUrl })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};`),
      environment: {
        BUCKET_NAME: documentBucket.bucketName,
        TABLE_NAME: documentsTable.tableName,
      },
      role: lambdaRole,
    });

    // OCR Processor Lambda
    const ocrProcessor = new lambda.Function(this, `OCRProcessor${suffix}`, {
      functionName: `idp-ocr-processor-${suffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(`
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { TextractClient, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const s3 = new S3Client({});
const textract = new TextractClient({});
const dynamodb = new DynamoDBClient({});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { documentId } = JSON.parse(event.body);
    
    // Get document info from DynamoDB to find the S3 key
    const getResponse = await dynamodb.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { documentId: { S: documentId } }
    }));
    
    if (!getResponse.Item) {
      throw new Error('Document not found');
    }
    
    const s3Key = getResponse.Item.s3Key.S;
    
    // Get document from S3
    const getObjectResponse = await s3.send(new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: s3Key
    }));
    
    const documentBytes = await getObjectResponse.Body.transformToByteArray();
    
    // Perform OCR with Textract
    const textractResponse = await textract.send(new DetectDocumentTextCommand({
      Document: { Bytes: documentBytes }
    }));
    
    // Extract text and create key-value pairs
    const extractedText = textractResponse.Blocks
      .filter(block => block.BlockType === 'LINE')
      .map(block => block.Text)
      .join('\\n');
    
    const ocrResults = {
      extractedText,
      confidence: textractResponse.Blocks
        .filter(block => block.BlockType === 'LINE')
        .reduce((avg, block) => avg + (block.Confidence || 0), 0) / 
        textractResponse.Blocks.filter(block => block.BlockType === 'LINE').length
    };
    
    // Update DynamoDB
    await dynamodb.send(new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { documentId: { S: documentId } },
      UpdateExpression: 'SET ocrResults = :ocr, processingStatus = :status',
      ExpressionAttributeValues: {
        ':ocr': { S: JSON.stringify(ocrResults) },
        ':status': { S: 'OCR_COMPLETE' }
      }
    }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, ocrResults })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};`),
      environment: {
        BUCKET_NAME: documentBucket.bucketName,
        TABLE_NAME: documentsTable.tableName,
      },
      role: lambdaRole,
    });

    // Document Classifier Lambda
    const documentClassifier = new lambda.Function(this, `DocumentClassifier${suffix}`, {
      functionName: `idp-document-classifier-${suffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(`
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const bedrock = new BedrockRuntimeClient({});
const dynamodb = new DynamoDBClient({});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { documentId } = JSON.parse(event.body);
    
    // Get OCR results from DynamoDB
    const getResponse = await dynamodb.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { documentId: { S: documentId } }
    }));
    
    const ocrResults = JSON.parse(getResponse.Item.ocrResults.S);
    
    const prompt = \`Classify this document into one of these categories: Dietary Supplement, Stationery, Kitchen Supplies, Medicine, Driver License, Invoice, W2, Other.
    
Document text: \${ocrResults.extractedText}

Respond with only the category name.\`;

    const response = await bedrock.send(new InvokeModelCommand({
      modelId: 'global.anthropic.claude-sonnet-4-20250514-v1:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      })
    }));
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const classification = responseBody.content[0].text.trim();
    
    // Update DynamoDB
    await dynamodb.send(new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { documentId: { S: documentId } },
      UpdateExpression: 'SET classification = :class, processingStatus = :status',
      ExpressionAttributeValues: {
        ':class': { S: classification },
        ':status': { S: 'CLASSIFIED' }
      }
    }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, classification })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};`),
      environment: {
        TABLE_NAME: documentsTable.tableName,
      },
      role: lambdaRole,
    });

    // Document Summarizer Lambda
    const documentSummarizer = new lambda.Function(this, `DocumentSummarizer${suffix}`, {
      functionName: `idp-document-summarizer-${suffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(`
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const bedrock = new BedrockRuntimeClient({});
const dynamodb = new DynamoDBClient({});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { documentId } = JSON.parse(event.body);
    
    // Get OCR results from DynamoDB
    const getResponse = await dynamodb.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { documentId: { S: documentId } }
    }));
    
    const ocrResults = JSON.parse(getResponse.Item.ocrResults.S);
    
    const prompt = \`Provide a concise summary of this document:

\${ocrResults.extractedText}

Summary:\`;

    const response = await bedrock.send(new InvokeModelCommand({
      modelId: 'global.anthropic.claude-sonnet-4-20250514-v1:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    }));
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const summary = responseBody.content[0].text.trim();
    
    // Update DynamoDB
    await dynamodb.send(new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { documentId: { S: documentId } },
      UpdateExpression: 'SET summary = :summary, processingStatus = :status',
      ExpressionAttributeValues: {
        ':summary': { S: summary },
        ':status': { S: 'COMPLETE' }
      }
    }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, summary })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};`),
      environment: {
        TABLE_NAME: documentsTable.tableName,
      },
      role: lambdaRole,
    });

    // Status Handler Lambda
    const statusHandler = new lambda.Function(this, `StatusHandler${suffix}`, {
      functionName: `idp-status-handler-${suffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient({});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const documentId = event.pathParameters.documentId;
    
    const response = await dynamodb.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { documentId: { S: documentId } }
    }));
    
    if (!response.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Document not found' })
      };
    }
    
    const item = {
      documentId: response.Item.documentId.S,
      fileName: response.Item.fileName.S,
      processingStatus: response.Item.processingStatus.S,
      ocrResults: response.Item.ocrResults ? JSON.parse(response.Item.ocrResults.S) : null,
      classification: response.Item.classification ? response.Item.classification.S : null,
      summary: response.Item.summary ? response.Item.summary.S : null
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(item)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};`),
      environment: {
        TABLE_NAME: documentsTable.tableName,
      },
      role: lambdaRole,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, `IDPAPI${suffix}`, {
      restApiName: `idp-api-${suffix}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      },
    });

    // API Gateway Resources and Methods
    const uploadResource = api.root.addResource('upload');
    uploadResource.addMethod('POST', new apigateway.LambdaIntegration(uploadHandler));

    const processResource = api.root.addResource('process');
    
    const ocrResource = processResource.addResource('ocr');
    ocrResource.addMethod('POST', new apigateway.LambdaIntegration(ocrProcessor));
    
    const classifyResource = processResource.addResource('classify');
    classifyResource.addMethod('POST', new apigateway.LambdaIntegration(documentClassifier));
    
    const summarizeResource = processResource.addResource('summarize');
    summarizeResource.addMethod('POST', new apigateway.LambdaIntegration(documentSummarizer));

    const statusResource = api.root.addResource('status');
    const statusDocumentResource = statusResource.addResource('{documentId}');
    statusDocumentResource.addMethod('GET', new apigateway.LambdaIntegration(statusHandler));

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: documentBucket.bucketName,
      description: 'S3 Bucket Name',
    });
  }
}
