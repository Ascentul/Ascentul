import React, { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Upload, Check, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

interface PdfTestResult {
  success: boolean;
  file: {
    filename: string;
    size: number;
    mimetype: string;
    path: string;
  };
  pdfLib: {
    success: boolean;
    pageCount?: number;
    message: string;
    error?: string;
    stack?: string;
  };
  pdfParse: {
    success: boolean;
    numpages?: number;
    numrender?: number;
    info?: any;
    metadata?: any;
    textPreview?: string;
    textLength?: number;
    message: string;
    error?: string;
    errorName?: string;
    errorStack?: string;
  };
}

export default function PdfTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<PdfTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== 'application/pdf') {
        setError('Please drop a PDF file');
        return;
      }
      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('pdfFile', file);

      const response = await fetch('/test-pdf-extract', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error uploading PDF:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">PDF Extraction Test Tool</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept="application/pdf" 
                className="hidden" 
              />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-semibold">Drag and drop or click to upload</p>
              <p className="text-sm text-gray-500">Only PDF files are accepted</p>
            </div>
            
            {file && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <div className="flex-1 truncate">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <Button variant="outline" size="sm" onClick={resetForm}>Change</Button>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? 'Testing PDF...' : 'Test PDF Extraction'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {result.success ? (
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                Test Result: {result.success ? 'Success' : 'Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="pdflib">PDF-Lib</TabsTrigger>
                  <TabsTrigger value="pdfparse">PDF-Parse</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary">
                  <div className="space-y-4 mt-4">
                    <div>
                      <p className="font-medium">File</p>
                      <p className="text-sm">{result.file.filename}</p>
                      <p className="text-sm text-gray-500">
                        {(result.file.size / 1024).toFixed(2)} KB - {result.file.mimetype}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-md ${result.pdfLib.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="font-medium">
                        {result.pdfLib.success ? (
                          <span className="text-green-700">PDF-Lib: Success</span>
                        ) : (
                          <span className="text-red-700">PDF-Lib: Failed</span>
                        )}
                      </p>
                      <p className="text-sm">{result.pdfLib.message}</p>
                      {result.pdfLib.pageCount && (
                        <p className="text-sm">Pages: {result.pdfLib.pageCount}</p>
                      )}
                    </div>
                    
                    <div className={`p-3 rounded-md ${result.pdfParse.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="font-medium">
                        {result.pdfParse.success ? (
                          <span className="text-green-700">PDF-Parse: Success</span>
                        ) : (
                          <span className="text-red-700">PDF-Parse: Failed</span>
                        )}
                      </p>
                      <p className="text-sm">{result.pdfParse.message}</p>
                      {result.pdfParse.textLength && (
                        <p className="text-sm">Extracted text: {result.pdfParse.textLength} characters</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="pdflib">
                  <div className="space-y-4 mt-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-medium">Status: {result.pdfLib.success ? 'Success' : 'Failed'}</p>
                      <p>{result.pdfLib.message}</p>
                      
                      {result.pdfLib.pageCount && (
                        <div className="mt-2">
                          <Label>Page Count</Label>
                          <p>{result.pdfLib.pageCount}</p>
                        </div>
                      )}
                      
                      {result.pdfLib.error && (
                        <div className="mt-4">
                          <Label className="text-red-600">Error</Label>
                          <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-40 whitespace-pre-wrap">
                            {result.pdfLib.error}
                          </pre>
                        </div>
                      )}
                      
                      {result.pdfLib.stack && (
                        <div className="mt-2">
                          <Label className="text-red-600">Stack Trace</Label>
                          <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-40 whitespace-pre-wrap">
                            {result.pdfLib.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="pdfparse">
                  <div className="space-y-4 mt-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-medium">Status: {result.pdfParse.success ? 'Success' : 'Failed'}</p>
                      <p>{result.pdfParse.message}</p>
                      
                      {result.pdfParse.success && (
                        <>
                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div>
                              <Label>Page Count</Label>
                              <p>{result.pdfParse.numpages}</p>
                            </div>
                            <div>
                              <Label>Rendered Pages</Label>
                              <p>{result.pdfParse.numrender}</p>
                            </div>
                          </div>
                          
                          {result.pdfParse.textPreview && (
                            <div className="mt-4">
                              <Label>Text Preview</Label>
                              <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-40 whitespace-pre-wrap">
                                {result.pdfParse.textPreview}
                              </pre>
                            </div>
                          )}
                          
                          {result.pdfParse.info && (
                            <div className="mt-4">
                              <Label>Document Info</Label>
                              <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-40 whitespace-pre-wrap">
                                {JSON.stringify(result.pdfParse.info, null, 2)}
                              </pre>
                            </div>
                          )}
                        </>
                      )}
                      
                      {result.pdfParse.error && (
                        <div className="mt-4">
                          <Label className="text-red-600">Error ({result.pdfParse.errorName})</Label>
                          <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-40 whitespace-pre-wrap">
                            {result.pdfParse.error}
                          </pre>
                        </div>
                      )}
                      
                      {result.pdfParse.errorStack && (
                        <div className="mt-2">
                          <Label className="text-red-600">Stack Trace</Label>
                          <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-40 whitespace-pre-wrap">
                            {result.pdfParse.errorStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}