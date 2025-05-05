import fs from 'fs';
import path from 'path';

/**
 * Utility functions for logging and debugging the voice practice feature
 * These functions help track API calls, performance, and issues
 */

// Debug flag - set to false in production
const DEBUG_ENABLED = true;
const SAVE_DEBUG_AUDIO = false; // Set to true only when debugging audio issues

// Log request data for tracking and debugging
export function logRequest(endpoint: string, action: string, data?: any) {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  console.log(`[Voice Practice][${timestamp}][${endpoint}] ${action}`);
  
  if (data) {
    console.log(`[Voice Practice][${timestamp}][${endpoint}] Data:`, 
      typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  }
}

// Log response data for tracking and debugging
export function logResponse(endpoint: string, statusCode: number, message: string, data?: any) {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  console.log(`[Voice Practice][${timestamp}][${endpoint}] Response: ${statusCode} - ${message}`);
  
  if (data) {
    console.log(`[Voice Practice][${timestamp}][${endpoint}] Response data:`, 
      typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  }
}

// Save audio data for debugging purposes
export function saveAudioForDebugging(audioData: string | Buffer, prefix: string): string | null {
  if (!DEBUG_ENABLED || !SAVE_DEBUG_AUDIO) return null;
  
  try {
    // Create debug directory if it doesn't exist
    const debugDir = path.join(__dirname, '../debug-audio');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    // Convert string to Buffer if needed
    const buffer = Buffer.isBuffer(audioData) ? audioData : Buffer.from(audioData);
    
    // Save the audio file with timestamp
    const timestamp = new Date().getTime();
    const filePath = path.join(debugDir, `${prefix}-${timestamp}.webm`);
    fs.writeFileSync(filePath, audioData);
    
    console.log(`[Voice Practice] Debug audio saved to ${filePath}`);
  } catch (error) {
    console.error('[Voice Practice] Error saving debug audio:', error);
  }
}