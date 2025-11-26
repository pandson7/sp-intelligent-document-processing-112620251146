import React, { useState } from 'react';
import './App.css';

const API_BASE_URL = 'https://a2cmcy29mk.execute-api.us-east-1.amazonaws.com/prod';

interface ProcessingResult {
  documentId: string;
  fileName: string;
  processingStatus: string;
  ocrResults?: {
    extractedText: string;
    confidence: number;
  };
  classification?: string;
  summary?: string;
}

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a JPEG, PNG, or PDF file');
        setSelectedFile(null);
      }
    }
  };

  const uploadToS3 = async (uploadUrl: string, file: File) => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload file to S3');
    }
  };

  const processDocument = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      // Step 1: Get upload URL
      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { documentId, uploadUrl } = await uploadResponse.json();

      // Step 2: Upload file to S3
      await uploadToS3(uploadUrl, selectedFile);

      // Step 3: Process OCR
      const ocrResponse = await fetch(`${API_BASE_URL}/process/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!ocrResponse.ok) {
        throw new Error('OCR processing failed');
      }

      // Step 4: Classify document
      const classifyResponse = await fetch(`${API_BASE_URL}/process/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!classifyResponse.ok) {
        throw new Error('Classification failed');
      }

      // Step 5: Summarize document
      const summarizeResponse = await fetch(`${API_BASE_URL}/process/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!summarizeResponse.ok) {
        throw new Error('Summarization failed');
      }

      // Step 6: Get final results
      const statusResponse = await fetch(`${API_BASE_URL}/status/${documentId}`);
      if (!statusResponse.ok) {
        throw new Error('Failed to get results');
      }

      const finalResult = await statusResponse.json();
      setResult(finalResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Intelligent Document Processing</h1>
        
        <div className="upload-section">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            disabled={isProcessing}
          />
          
          {selectedFile && (
            <div className="file-info">
              <p>Selected: {selectedFile.name}</p>
              <p>Type: {selectedFile.type}</p>
              <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
          
          <button
            onClick={processDocument}
            disabled={!selectedFile || isProcessing}
            className="process-button"
          >
            {isProcessing ? 'Processing...' : 'Process Document'}
          </button>
        </div>

        {error && (
          <div className="error">
            <p>Error: {error}</p>
          </div>
        )}

        {isProcessing && (
          <div className="loading">
            <p>Processing document through IDP pipeline...</p>
            <div className="spinner"></div>
          </div>
        )}

        {result && (
          <div className="results">
            <h2>Processing Results</h2>
            
            <div className="result-section">
              <h3>Document Information</h3>
              <p><strong>File:</strong> {result.fileName}</p>
              <p><strong>Status:</strong> {result.processingStatus}</p>
            </div>

            {result.ocrResults && (
              <div className="result-section">
                <h3>OCR Results</h3>
                <p><strong>Confidence:</strong> {result.ocrResults.confidence.toFixed(2)}%</p>
                <div className="extracted-text">
                  <h4>Extracted Text:</h4>
                  <pre>{result.ocrResults.extractedText}</pre>
                </div>
              </div>
            )}

            {result.classification && (
              <div className="result-section">
                <h3>Document Classification</h3>
                <p><strong>Category:</strong> {result.classification}</p>
              </div>
            )}

            {result.summary && (
              <div className="result-section">
                <h3>Document Summary</h3>
                <p>{result.summary}</p>
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
