/**
 * Debugging utilities for voice practice features on the client side
 */
/**
 * Log voice practice events with context specific to voice practice
 */
export function logVoiceEvent(event, message, data) {
    const timestamp = new Date().toISOString();
    // Create a base log message that shows the event and timestamp
    let logMessage = `[Voice Practice][${timestamp}][${event}] ${message}`;
    // Log to the console
    console.log(logMessage);
    // If there's additional data, log it as well
    if (data) {
        console.log(`[Voice Practice Data]`, data);
    }
}
/**
 * Format large base64 strings to be more readable in logs
 */
export function formatBase64ForLogging(base64String) {
    if (!base64String)
        return 'Empty string';
    const length = base64String.length;
    // Only show the first and last few characters if string is large
    if (length > 100) {
        return {
            preview: `${base64String.substring(0, 50)}...${base64String.substring(length - 50)}`,
            length,
            firstBytes: base64String.substring(0, 20)
        };
    }
    return base64String;
}
/**
 * Check microphone access and capabilities
 */
export async function checkMicrophoneAccess() {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Get device info
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        // Stop the stream immediately
        stream.getTracks().forEach(track => track.stop());
        return {
            available: true,
            deviceInfo: audioDevices
        };
    }
    catch (error) {
        logVoiceEvent('MicCheck', 'Microphone access error', error);
        return {
            available: false,
            error: error instanceof Error ? error.message : 'Unknown error accessing microphone'
        };
    }
}
/**
 * Test audio recording and encoding
 */
export async function testAudioCapture(durationMs = 1000) {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Create MediaRecorder
        const mimeType = 'audio/webm';
        const recorder = new MediaRecorder(stream, {
            mimeType,
            audioBitsPerSecond: 128000
        });
        const chunks = [];
        recorder.addEventListener('dataavailable', (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        });
        // Start recording
        recorder.start();
        logVoiceEvent('TestRecording', 'Started test recording', { mimeType, durationMs });
        // Stop after specified duration
        return new Promise((resolve) => {
            setTimeout(() => {
                recorder.stop();
                logVoiceEvent('TestRecording', 'Stopped test recording');
                // When recording is stopped and data is available
                recorder.addEventListener('stop', async () => {
                    // Stop the stream 
                    stream.getTracks().forEach(track => track.stop());
                    if (chunks.length === 0) {
                        resolve({
                            success: false,
                            error: 'No audio data was captured'
                        });
                        return;
                    }
                    // Create blob from chunks
                    const blob = new Blob(chunks, { type: mimeType });
                    // Get file size
                    const blobSize = blob.size;
                    // Convert to base64 for testing the full pipeline
                    let base64Length = undefined;
                    try {
                        const reader = new FileReader();
                        const base64Promise = new Promise((resolveBase64) => {
                            reader.onloadend = () => {
                                resolveBase64(reader.result);
                            };
                        });
                        reader.readAsDataURL(blob);
                        const base64 = await base64Promise;
                        base64Length = base64.length;
                    }
                    catch (base64Error) {
                        logVoiceEvent('TestRecording', 'Error converting to base64', base64Error);
                    }
                    // Return results
                    resolve({
                        success: true,
                        recordingStats: {
                            durationMs,
                            blobSize,
                            base64Length,
                            mimeType
                        }
                    });
                });
            }, durationMs);
        });
    }
    catch (error) {
        logVoiceEvent('TestRecording', 'Audio capture test failed', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error testing audio capture'
        };
    }
}
/**
 * Analyze browser audio capabilities
 */
export function analyzeAudioCapabilities() {
    const audioContext = window.AudioContext || window.webkitAudioContext;
    const mediaRecorder = window.MediaRecorder;
    const supportedMimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg',
        'audio/ogg;codecs=opus',
        'audio/wav',
        'audio/mp4'
    ].filter(mimeType => MediaRecorder.isTypeSupported(mimeType));
    return {
        hasAudioContext: !!audioContext,
        hasMediaRecorder: !!mediaRecorder,
        supportedMimeTypes,
        preferredMimeType: supportedMimeTypes.includes('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : supportedMimeTypes[0] || 'No supported audio MIME types found',
        getUserMediaSupported: !!navigator.mediaDevices?.getUserMedia
    };
}
/**
 * Write a debugging message to localStorage
 */
export function saveDebugData(key, data) {
    try {
        // Use a prefix to avoid collisions with other localStorage items
        const storageKey = `voice_debug_${key}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
    }
    catch (error) {
        console.error('Error saving debug data to localStorage:', error);
        return false;
    }
}
