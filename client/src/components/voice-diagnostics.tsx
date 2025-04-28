import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { analyzeAudioCapabilities, checkMicrophoneAccess, testAudioCapture, logVoiceEvent } from '@/lib/voice-debug';

interface DiagnosticResults {
  error?: string;
  tests?: {
    capabilities?: {
      status: 'pass' | 'warning' | 'fail';
      hasMediaRecorder: boolean;
      preferredMimeType: string;
      supportedFormats: string[];
    };
    microphoneAccess?: {
      status: 'pass' | 'warning' | 'fail';
      available: boolean;
      error?: string;
      deviceInfo?: MediaDeviceInfo[];
    };
    audioCapture?: {
      status: 'pass' | 'warning' | 'fail';
      success: boolean;
      error?: string;
      recordingStats?: {
        durationMs: number;
        blobSize?: number;
        format: string;
      };
    };
    api?: {
      transcribe: {
        success: boolean;
        response?: any;
        error?: string;
      };
      tts: {
        success: boolean;
        response?: any;
        error?: string;
      };
    };
  };
}

export function VoiceDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [apiTest, setApiTest] = useState<{
    transcribe: { success: boolean; response?: any; error?: string };
    tts: { success: boolean; response?: any; error?: string };
  }>({
    transcribe: { success: false },
    tts: { success: false }
  });
  
  // Run diagnostics on capabilities, microphone access, audio recording, and API connectivity
  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);
    
    const diagnosticResults: DiagnosticResults = {
      tests: {
        api: {
          transcribe: { success: false },
          tts: { success: false }
        }
      }
    };
    
    try {
      // Test 1: Browser capabilities
      logVoiceEvent('Diagnostics', 'Testing browser audio capabilities');
      setProgress(10);
      const capabilities = analyzeAudioCapabilities();
      diagnosticResults.tests!.capabilities = {
        status: capabilities.hasMediaRecorder ? 'pass' : 'fail',
        hasMediaRecorder: capabilities.hasMediaRecorder,
        preferredMimeType: capabilities.preferredMimeType,
        supportedFormats: capabilities.supportedFormats
      };
      setProgress(25);
      
      // Test 2: Microphone access
      logVoiceEvent('Diagnostics', 'Testing microphone access');
      try {
        const micAccess = await checkMicrophoneAccess();
        diagnosticResults.tests!.microphoneAccess = {
          status: micAccess.available ? 'pass' : 'fail',
          available: micAccess.available,
          deviceInfo: micAccess.devices,
          error: micAccess.error
        };
      } catch (e) {
        diagnosticResults.tests!.microphoneAccess = {
          status: 'fail',
          available: false,
          error: e instanceof Error ? e.message : 'Unknown error accessing microphone'
        };
      }
      setProgress(50);
      
      // Test 3: Audio recording (if microphone is available)
      if (diagnosticResults.tests!.microphoneAccess?.available) {
        logVoiceEvent('Diagnostics', 'Testing audio recording');
        try {
          const captureTest = await testAudioCapture(1000);
          diagnosticResults.tests!.audioCapture = {
            status: captureTest.success ? 'pass' : 'fail',
            success: captureTest.success,
            error: captureTest.error,
            recordingStats: captureTest.recordingStats
          };
        } catch (e) {
          diagnosticResults.tests!.audioCapture = {
            status: 'fail',
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error during recording test'
          };
        }
      }
      setProgress(75);
      
      // Test 4: API connectivity (if recording was successful)
      if (diagnosticResults.tests!.audioCapture?.success) {
        logVoiceEvent('Diagnostics', 'Testing API connectivity');
        
        const apiResults = {
          transcribe: { success: false },
          tts: { success: false }
        };
        
        try {
          // Do a longer recording for API testing
          logVoiceEvent('Diagnostics', 'Testing 5 second audio recording for API tests');
          const testRecording = await testAudioCapture(5000);
          
          if (testRecording.success) {
            // Extract the base64 data to test API endpoints
            if (testRecording.recordingStats && testRecording.recordingStats.blobSize && testRecording.recordingStats.blobSize > 0) {
              const blob = new Blob([new Uint8Array(10)], { type: 'audio/webm' }); // Create a small test blob
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              
              const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => {
                  const base64String = reader.result as string;
                  // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
                  const base64Data = base64String.split(",")[1] || "";
                  resolve(base64Data);
                };
              });
              
              const base64Data = await base64Promise;
              
              // Test transcribe endpoint
              try {
                const transcribeResponse = await fetch('/api/interview/transcribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ audio: base64Data })
                });
                
                const transcribeData = await transcribeResponse.json();
                
                apiResults.transcribe = {
                  success: transcribeResponse.ok,
                  response: transcribeData,
                  error: !transcribeResponse.ok ? `HTTP ${transcribeResponse.status}: ${transcribeResponse.statusText}` : undefined
                };
              } catch (transcribeError: any) {
                apiResults.transcribe.error = transcribeError.message;
              }
              
              // Test text-to-speech endpoint
              try {
                const ttsResponse = await fetch('/api/interview/text-to-speech', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    text: "This is a test of the text to speech API endpoint.",
                    voice: "nova" 
                  })
                });
                
                const ttsData = await ttsResponse.json();
                
                apiResults.tts = {
                  success: ttsResponse.ok,
                  response: ttsData,
                  error: !ttsResponse.ok ? `HTTP ${ttsResponse.status}: ${ttsResponse.statusText}` : undefined
                };
              } catch (ttsError: any) {
                apiResults.tts.error = ttsError.message;
              }
            }
          }
        } catch (apiTestError: any) {
          console.error('Error during API tests:', apiTestError);
        }
        
        setApiTest(apiResults);
        diagnosticResults.tests!.api = apiResults;
      }
      
      // Complete diagnostics
      setProgress(100);
      setResults(diagnosticResults);
      
      // Log the complete diagnostics results
      logVoiceEvent('Diagnostics', 'Completed diagnostics', diagnosticResults);
      
      // Save to localStorage for later reference
      try {
        localStorage.setItem('voice_diagnostics_results', JSON.stringify(diagnosticResults));
      } catch (e) {
        console.error('Could not save diagnostics to localStorage', e);
      }
    } catch (e) {
      console.error('Error running diagnostics:', e);
      setResults({
        error: e instanceof Error ? e.message : 'Unknown error during diagnostics'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'pass') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pass</Badge>;
    } else if (status === 'fail') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Fail</Badge>;
    } else if (status === 'warning') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Warning</Badge>;
    } else {
      return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Voice Practice Diagnostics
        </CardTitle>
        <CardDescription>
          Diagnose issues with voice recording and playback functionality
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isRunning && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Running diagnostics...</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {!isRunning && !results && (
          <div className="py-8 text-center text-muted-foreground">
            <p>Click the button below to run diagnostics on your voice recording capabilities.</p>
          </div>
        )}
        
        {!isRunning && results && !results.error && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Capabilities Test */}
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Browser Audio Support</h3>
                  <StatusBadge status={results.tests?.capabilities?.status || 'fail'} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {results.tests?.capabilities?.status === 'pass' 
                    ? 'Your browser supports audio recording.' 
                    : 'Your browser has limited support for audio recording.'}
                </p>
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Media Recorder:</span>
                      <span>{results.tests?.capabilities?.hasMediaRecorder ? 'Available' : 'Not available'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Preferred Format:</span>
                      <span className="font-mono text-xs">{results.tests?.capabilities?.preferredMimeType}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Microphone Access Test */}
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Microphone Access</h3>
                  <StatusBadge status={results.tests?.microphoneAccess?.status || 'fail'} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {results.tests?.microphoneAccess?.available 
                    ? `Found ${results.tests?.microphoneAccess?.deviceInfo?.length || 0} audio input device(s)` 
                    : `Could not access microphone: ${results.tests?.microphoneAccess?.error}`}
                </p>
              </div>
              
              {/* Audio Capture Test (if mic was available) */}
              {results.tests?.audioCapture && (
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Audio Recording</h3>
                    <StatusBadge status={results.tests.audioCapture.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {results.tests.audioCapture.success 
                      ? `Successfully recorded ${results.tests.audioCapture.recordingStats?.durationMs ? results.tests.audioCapture.recordingStats.durationMs / 1000 : 0}s audio (${results.tests.audioCapture.recordingStats?.blobSize || 0} bytes)` 
                      : `Failed to record audio: ${results.tests.audioCapture.error}`}
                  </p>
                </div>
              )}
              
              {/* API Tests (if recording was successful) */}
              {apiTest && (
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">API Endpoints</h3>
                    <div className="flex gap-1">
                      {apiTest.transcribe.success && apiTest.tts.success ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">All Passed</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Mixed Results</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="min-w-[100px]">Transcription:</span>
                      {apiTest.transcribe.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {apiTest.transcribe.error && `Error: ${apiTest.transcribe.error}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="min-w-[100px]">Text-to-Speech:</span>
                      {apiTest.tts.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {apiTest.tts.error && `Error: ${apiTest.tts.error}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Technical Details Collapsible */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {showDetails ? "Hide Technical Details" : "Show Technical Details"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-60">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Recommendations based on results */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Recommendations
              </h3>
              <ul className="space-y-2 text-sm">
                {results.tests?.capabilities && !results.tests.capabilities.hasMediaRecorder && (
                  <li>Your browser doesn't support the MediaRecorder API. Try using Chrome, Firefox, or Edge.</li>
                )}
                
                {results.tests?.microphoneAccess && !results.tests.microphoneAccess.available && (
                  <li>Grant microphone permissions to this site in your browser settings.</li>
                )}
                
                {results.tests?.audioCapture && results.tests.audioCapture.status === 'fail' && (
                  <li>Check that your microphone is properly connected and working with other applications.</li>
                )}
                
                {apiTest && (!apiTest.transcribe.success || !apiTest.tts.success) && (
                  <li>There may be an issue with the server APIs. Please try again later or contact support.</li>
                )}
                
                {/* Generic recommendations */}
                <li>Use a headset or external microphone for better audio quality.</li>
                <li>Use Chrome or Edge browsers for the best compatibility with audio recording.</li>
                <li>Ensure your browser is up to date to benefit from the latest Web Audio features.</li>
              </ul>
            </div>
          </div>
        )}
        
        {!isRunning && results && results.error && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Error Running Diagnostics</span>
            </div>
            <p className="text-sm text-muted-foreground">{results.error}</p>
          </div>
        )}
        
        <div className="mt-6">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running...' : results ? 'Run Diagnostics Again' : 'Run Diagnostics'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}