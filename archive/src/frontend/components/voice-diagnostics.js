import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { analyzeAudioCapabilities, checkMicrophoneAccess, testAudioCapture, logVoiceEvent } from '@/lib/voice-debug';
export function VoiceDiagnostics() {
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [apiTest, setApiTest] = useState({
        transcribe: { success: false, response: undefined, error: '' },
        tts: { success: false, response: undefined, error: '' }
    });
    // Run diagnostics on capabilities, microphone access, audio recording, and API connectivity
    const runDiagnostics = async () => {
        setIsRunning(true);
        setProgress(0);
        setResults(null);
        const diagnosticResults = {
            tests: {
                api: {
                    transcribe: { success: false, response: undefined, error: '' },
                    tts: { success: false, response: undefined, error: '' }
                }
            }
        };
        try {
            // Test 1: Browser capabilities
            logVoiceEvent('Diagnostics', 'Testing browser audio capabilities');
            setProgress(10);
            const capabilities = analyzeAudioCapabilities();
            diagnosticResults.tests.capabilities = {
                status: capabilities.hasMediaRecorder ? 'pass' : 'fail',
                hasMediaRecorder: capabilities.hasMediaRecorder,
                preferredMimeType: capabilities.preferredMimeType,
                supportedFormats: capabilities.supportedMimeTypes
            };
            setProgress(25);
            // Test 2: Microphone access
            logVoiceEvent('Diagnostics', 'Testing microphone access');
            try {
                const micAccess = await checkMicrophoneAccess();
                diagnosticResults.tests.microphoneAccess = {
                    status: micAccess.available ? 'pass' : 'fail',
                    available: micAccess.available,
                    deviceInfo: micAccess.deviceInfo,
                    error: micAccess.error
                };
            }
            catch (e) {
                diagnosticResults.tests.microphoneAccess = {
                    status: 'fail',
                    available: false,
                    error: e instanceof Error ? e.message : 'Unknown error accessing microphone'
                };
            }
            setProgress(50);
            // Test 3: Audio recording (if microphone is available)
            if (diagnosticResults.tests.microphoneAccess?.available) {
                logVoiceEvent('Diagnostics', 'Testing audio recording');
                try {
                    const captureTest = await testAudioCapture(1000);
                    diagnosticResults.tests.audioCapture = {
                        status: captureTest.success ? 'pass' : 'fail',
                        success: captureTest.success,
                        error: captureTest.error,
                        recordingStats: captureTest.recordingStats ? {
                            durationMs: captureTest.recordingStats.durationMs,
                            blobSize: captureTest.recordingStats.blobSize,
                            format: captureTest.recordingStats.mimeType || 'audio/webm'
                        } : undefined
                    };
                }
                catch (e) {
                    diagnosticResults.tests.audioCapture = {
                        status: 'fail',
                        success: false,
                        error: e instanceof Error ? e.message : 'Unknown error during recording test'
                    };
                }
            }
            setProgress(75);
            // Test 4: API connectivity (if recording was successful)
            if (diagnosticResults.tests.audioCapture?.success) {
                logVoiceEvent('Diagnostics', 'Testing API connectivity');
                const apiResults = {
                    transcribe: { success: false, response: undefined, error: '' },
                    tts: { success: false, response: undefined, error: '' }
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
                            const base64Promise = new Promise((resolve) => {
                                reader.onloadend = () => {
                                    const base64String = reader.result;
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
                                    error: !transcribeResponse.ok ? `HTTP ${transcribeResponse.status}: ${transcribeResponse.statusText}` : ''
                                };
                            }
                            catch (transcribeError) {
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
                                    error: !ttsResponse.ok ? `HTTP ${ttsResponse.status}: ${ttsResponse.statusText}` : ''
                                };
                            }
                            catch (ttsError) {
                                apiResults.tts.error = ttsError.message;
                            }
                        }
                    }
                }
                catch (apiTestError) {
                    console.error('Error during API tests:', apiTestError);
                }
                setApiTest(apiResults);
                diagnosticResults.tests.api = apiResults;
            }
            // Complete diagnostics
            setProgress(100);
            setResults(diagnosticResults);
            // Log the complete diagnostics results
            logVoiceEvent('Diagnostics', 'Completed diagnostics', diagnosticResults);
            // Save to localStorage for later reference
            try {
                localStorage.setItem('voice_diagnostics_results', JSON.stringify(diagnosticResults));
            }
            catch (e) {
                console.error('Could not save diagnostics to localStorage', e);
            }
        }
        catch (e) {
            console.error('Error running diagnostics:', e);
            setResults({
                error: e instanceof Error ? e.message : 'Unknown error during diagnostics'
            });
        }
        finally {
            setIsRunning(false);
        }
    };
    // Status badge component
    const StatusBadge = ({ status }) => {
        if (status === 'pass') {
            return _jsx(Badge, { variant: "outline", className: "bg-green-50 text-green-700 border-green-200", children: "Pass" });
        }
        else if (status === 'fail') {
            return _jsx(Badge, { variant: "outline", className: "bg-red-50 text-red-700 border-red-200", children: "Fail" });
        }
        else if (status === 'warning') {
            return _jsx(Badge, { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200", children: "Warning" });
        }
        else {
            return _jsx(Badge, { variant: "outline", children: "Unknown" });
        }
    };
    return (_jsxs(Card, { className: "w-full max-w-lg mx-auto", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Info, { className: "h-5 w-5" }), "Voice Practice Diagnostics"] }), _jsx(CardDescription, { children: "Diagnose issues with voice recording and playback functionality" })] }), _jsxs(CardContent, { children: [isRunning && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Loader2, { className: "h-5 w-5 animate-spin text-primary" }), _jsx("span", { children: "Running diagnostics..." })] }), _jsx(Progress, { value: progress, className: "h-2" })] })), !isRunning && !results && (_jsx("div", { className: "py-8 text-center text-muted-foreground", children: _jsx("p", { children: "Click the button below to run diagnostics on your voice recording capabilities." }) })), !isRunning && results && !results.error && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 gap-4", children: [_jsxs("div", { className: "border rounded-md p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-medium", children: "Browser Audio Support" }), _jsx(StatusBadge, { status: results.tests?.capabilities?.status || 'fail' })] }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: results.tests?.capabilities?.status === 'pass'
                                                    ? 'Your browser supports audio recording.'
                                                    : 'Your browser has limited support for audio recording.' }), _jsx("div", { className: "mt-2", children: _jsxs("div", { className: "text-xs text-muted-foreground", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Media Recorder:" }), _jsx("span", { children: results.tests?.capabilities?.hasMediaRecorder ? 'Available' : 'Not available' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Preferred Format:" }), _jsx("span", { className: "font-mono text-xs", children: results.tests?.capabilities?.preferredMimeType })] })] }) })] }), _jsxs("div", { className: "border rounded-md p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-medium", children: "Microphone Access" }), _jsx(StatusBadge, { status: results.tests?.microphoneAccess?.status || 'fail' })] }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: results.tests?.microphoneAccess?.available
                                                    ? `Found ${results.tests?.microphoneAccess?.deviceInfo?.length || 0} audio input device(s)`
                                                    : `Could not access microphone: ${results.tests?.microphoneAccess?.error}` })] }), results.tests?.audioCapture && (_jsxs("div", { className: "border rounded-md p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-medium", children: "Audio Recording" }), _jsx(StatusBadge, { status: results.tests.audioCapture.status })] }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: results.tests.audioCapture.success
                                                    ? `Successfully recorded ${results.tests.audioCapture.recordingStats?.durationMs ? results.tests.audioCapture.recordingStats.durationMs / 1000 : 0}s audio (${results.tests.audioCapture.recordingStats?.blobSize || 0} bytes)`
                                                    : `Failed to record audio: ${results.tests.audioCapture.error}` })] })), apiTest && (_jsxs("div", { className: "border rounded-md p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-medium", children: "API Endpoints" }), _jsx("div", { className: "flex gap-1", children: apiTest.transcribe.success && apiTest.tts.success ? (_jsx(Badge, { variant: "outline", className: "bg-green-50 text-green-700 border-green-200", children: "All Passed" })) : (_jsx(Badge, { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200", children: "Mixed Results" })) })] }), _jsxs("div", { className: "mt-2 space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "min-w-[100px]", children: "Transcription:" }), apiTest.transcribe.success ? (_jsx(CheckCircle2, { className: "h-4 w-4 text-green-600" })) : (_jsx(XCircle, { className: "h-4 w-4 text-red-600" })), _jsx("span", { className: "text-xs text-muted-foreground", children: apiTest.transcribe.error && `Error: ${apiTest.transcribe.error}` })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "min-w-[100px]", children: "Text-to-Speech:" }), apiTest.tts.success ? (_jsx(CheckCircle2, { className: "h-4 w-4 text-green-600" })) : (_jsx(XCircle, { className: "h-4 w-4 text-red-600" })), _jsx("span", { className: "text-xs text-muted-foreground", children: apiTest.tts.error && `Error: ${apiTest.tts.error}` })] })] })] }))] }), _jsxs(Collapsible, { open: showDetails, onOpenChange: setShowDetails, children: [_jsx(CollapsibleTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", size: "sm", className: "w-full", children: showDetails ? "Hide Technical Details" : "Show Technical Details" }) }), _jsx(CollapsibleContent, { className: "mt-4", children: _jsx("div", { className: "bg-muted p-3 rounded-md", children: _jsx("pre", { className: "text-xs overflow-auto whitespace-pre-wrap max-h-60", children: JSON.stringify(results, null, 2) }) }) })] }), _jsxs("div", { className: "border-t pt-4", children: [_jsxs("h3", { className: "font-medium mb-2 flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "h-4 w-4 text-amber-500" }), "Recommendations"] }), _jsxs("ul", { className: "space-y-2 text-sm", children: [results.tests?.capabilities && !results.tests.capabilities.hasMediaRecorder && (_jsx("li", { children: "Your browser doesn't support the MediaRecorder API. Try using Chrome, Firefox, or Edge." })), results.tests?.microphoneAccess && !results.tests.microphoneAccess.available && (_jsx("li", { children: "Grant microphone permissions to this site in your browser settings." })), results.tests?.audioCapture && results.tests.audioCapture.status === 'fail' && (_jsx("li", { children: "Check that your microphone is properly connected and working with other applications." })), apiTest && (!apiTest.transcribe.success || !apiTest.tts.success) && (_jsx("li", { children: "There may be an issue with the server APIs. Please try again later or contact support." })), _jsx("li", { children: "Use a headset or external microphone for better audio quality." }), _jsx("li", { children: "Use Chrome or Edge browsers for the best compatibility with audio recording." }), _jsx("li", { children: "Ensure your browser is up to date to benefit from the latest Web Audio features." })] })] })] })), !isRunning && results && results.error && (_jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-red-600", children: [_jsx(XCircle, { className: "h-5 w-5" }), _jsx("span", { className: "font-medium", children: "Error Running Diagnostics" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: results.error })] })), _jsx("div", { className: "mt-6", children: _jsx(Button, { onClick: runDiagnostics, disabled: isRunning, className: "w-full", children: isRunning ? 'Running...' : results ? 'Run Diagnostics Again' : 'Run Diagnostics' }) })] })] }));
}
