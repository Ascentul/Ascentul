/**
 * Debug utilities for voice practice feature
 */
import fs from 'fs';
import path from 'path';
// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'recordings');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
// Log request details for debugging
export function logRequest(endpoint, message, data) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${endpoint}] ${message}`;
    console.log(logMessage);
    if (data) {
        try {
            if (typeof data === 'object') {
                // Don't log the full audio data which could be large
                if (data.audio && typeof data.audio === 'string' && data.audio.length > 100) {
                    const sanitizedData = { ...data, audio: `<base64_data_length:${data.audio.length}>` };
                    console.log('Request data:', sanitizedData);
                }
                else {
                    console.log('Request data:', data);
                }
            }
            else {
                console.log('Request data:', data);
            }
        }
        catch (e) {
            console.error('Error logging data:', e);
        }
    }
}
// Log response details for debugging
export function logResponse(endpoint, status, message, data) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${endpoint}] [${status}] ${message}`;
    console.log(logMessage);
    if (data) {
        try {
            if (typeof data === 'object') {
                console.log('Response data:', data);
            }
            else {
                console.log('Response data:', data);
            }
        }
        catch (e) {
            console.error('Error logging data:', e);
        }
    }
}
// Save audio to file for debugging
export function saveAudioForDebugging(audio, endpoint) {
    try {
        // Ensure audio is a string
        if (!audio || typeof audio !== 'string') {
            console.error('Invalid audio data received');
            return;
        }
        // Clean the data URL prefix if present
        let cleanedAudio = audio;
        let fileExtension = 'webm';
        if (audio.includes('base64,')) {
            // Extract the MIME type and base64 data
            const matches = audio.match(/^data:([^;]+);base64,(.+)$/);
            if (matches && matches.length >= 3) {
                const mimeType = matches[1];
                cleanedAudio = matches[2];
                // Set file extension based on MIME type
                if (mimeType.includes('mp3'))
                    fileExtension = 'mp3';
                else if (mimeType.includes('wav'))
                    fileExtension = 'wav';
                else if (mimeType.includes('ogg'))
                    fileExtension = 'ogg';
                else if (mimeType.includes('webm'))
                    fileExtension = 'webm';
                console.log(`Extracted MIME type: ${mimeType} for debug audio`);
            }
            else {
                // If no proper match but there's a comma, split at the comma
                cleanedAudio = audio.split(',')[1] || audio;
                console.log('Could not extract MIME type for debug audio but split at comma');
            }
        }
        // Make sure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log(`Created uploads directory: ${uploadsDir}`);
        }
        // Create a filename with timestamp
        const timestamp = Date.now();
        const filename = path.join(uploadsDir, `debug_${endpoint}_${timestamp}.${fileExtension}`);
        // Convert base64 to buffer and save
        try {
            const buffer = Buffer.from(cleanedAudio, 'base64');
            fs.writeFileSync(filename, buffer);
            console.log(`Saved debug audio to ${filename}, size: ${buffer.length} bytes`);
            return filename;
        }
        catch (bufferError) {
            console.error('Error converting debug audio to buffer:', bufferError);
            return null;
        }
    }
    catch (e) {
        console.error('Error saving audio for debugging:', e);
        return null;
    }
}
