import fs from 'fs';
/**
 * Ensures that a directory exists, creating it and any parent directories if needed
 * @param dirPath The directory path to ensure exists
 * @returns void
 */
export function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
