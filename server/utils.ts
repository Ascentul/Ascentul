import fs from 'fs';
import path from 'path';

/**
 * Ensures that a directory exists, creating it and any parent directories if needed
 * @param dirPath The directory path to ensure exists
 * @returns void
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}