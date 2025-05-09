import React, { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PdfTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };
  
  const testDirectExtraction = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/test-pdf-extract', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast({
          title: "PDF Extracted Successfully",
          description: `Extracted ${data.textLength} characters using ${data.method}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Extraction Failed",
          description: data.message || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const testRegularEndpoint = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/resumes/extract-text', formData, {
        processData: false,
        contentType: false
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setResult({
        success: true,
        method: 'regular-endpoint',
        textLength: data.text?.length || 0,
        textPreview: data.text?.substring(0, 200) || '',
        fullResponse: data
      });
      
      toast({
        title: "PDF Extracted Successfully",
        description: `Extracted ${data.text?.length || 0} characters via regular endpoint`,
        variant: "default"
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">PDF Extraction Test Tool</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload a PDF File</h2>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary/80"
            />
            {file && (
              <p className="mt-2 text-sm text-slate-700">
                Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={testDirectExtraction}
              disabled={isLoading || !file}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Test Direct Extraction'
              )}
            </Button>
            
            <Button 
              onClick={testRegularEndpoint}
              disabled={isLoading || !file}
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Test Regular Endpoint'
              )}
            </Button>
          </div>
        </div>
      </Card>
      
      {error && (
        <Card className="p-6 mb-6 border-destructive">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <pre className="bg-muted p-4 rounded whitespace-pre-wrap text-sm overflow-auto max-h-40">
            {error}
          </pre>
        </Card>
      )}
      
      {result && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Status:</h3>
              <p className={result.success ? "text-green-600" : "text-red-600"}>
                {result.success ? "Success" : "Failed"}
              </p>
            </div>
            
            {result.method && (
              <div>
                <h3 className="font-medium mb-1">Extraction Method:</h3>
                <p>{result.method}</p>
              </div>
            )}
            
            {result.textLength !== undefined && (
              <div>
                <h3 className="font-medium mb-1">Extracted Text Length:</h3>
                <p>{result.textLength} characters</p>
              </div>
            )}
            
            {result.textPreview && (
              <div>
                <h3 className="font-medium mb-1">Text Preview:</h3>
                <div className="bg-muted p-4 rounded">
                  <p className="whitespace-pre-wrap text-sm">
                    {result.textPreview}{result.textLength > 200 ? '...' : ''}
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-medium mb-1">Full Response:</h3>
              <pre className="bg-muted p-4 rounded whitespace-pre-wrap text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}