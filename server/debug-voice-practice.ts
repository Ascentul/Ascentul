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
export function logRequest(endpoint: string, message: string, data?: any) {
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
        } else {
          console.log('Request data:', data);
        }
      } else {
        console.log('Request data:', data);
      }
    } catch (e) {
      console.error('Error logging data:', e);
    }
  }
}

// Log response details for debugging
export function logResponse(endpoint: string, status: number, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${endpoint}] [${status}] ${message}`;
  
  console.log(logMessage);
  
  if (data) {
    try {
      if (typeof data === 'object') {
        console.log('Response data:', data);
      } else {
        console.log('Response data:', data);
      }
    } catch (e) {
      console.error('Error logging data:', e);
    }
  }
}

// Save audio to file for debugging
export function saveAudioForDebugging(audio: string, endpoint: string) {
  try {
    // Ensure audio is a base64 string
    if (!audio || typeof audio !== 'string') {
      console.error('Invalid audio data received');
      return;
    }
    
    // Create a filename with timestamp
    const timestamp = Date.now();
    const filename = path.join(uploadsDir, `debug_${endpoint}_${timestamp}.webm`);
    
    // Convert base64 to buffer and save
    const buffer = Buffer.from(audio, 'base64');
    fs.writeFileSync(filename, buffer);
    
    console.log(`Saved debug audio to ${filename}`);
    return filename;
  } catch (e) {
    console.error('Error saving audio for debugging:', e);
    return null;
  }
}