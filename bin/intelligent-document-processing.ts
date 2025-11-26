#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { IntelligentDocumentProcessingStack } from '../lib/intelligent-document-processing-stack';

const app = new cdk.App();
new IntelligentDocumentProcessingStack(app, 'IntelligentDocumentProcessingStack112620251146', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
