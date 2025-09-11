import fs from 'fs';
import path from 'path';

// Directories to search
const searchDirs = [
  './src',
  './api'
];

// File extensions to process
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Console methods to remove
const consoleMethods = [
  'console.log',
  'console.warn', 
  'console.info',
  'console.debug',
  'console.trace',
  'console.table',
  'console.group',
  'console.groupEnd',
  'console.groupCollapsed',
  'console.time',
  'console.timeEnd',
  'console.count',
  'console.countReset',
  'console.assert'
];

let totalFilesProcessed = 0;
let totalLinesRemoved = 0;

function shouldProcessFile(filePath) {
  return extensions.some(ext => filePath.endsWith(ext));
}

function removeConsoleLogs(content) {
  const lines = content.split('\n');
  const filteredLines = [];
  let linesRemoved = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip lines that are only console statements
    const isConsoleStatement = consoleMethods.some(method => {
      // Match various console statement patterns
      const patterns = [
        new RegExp(`^\\s*${method.replace('.', '\\.')}\\s*\\(`),
        new RegExp(`^\\s*//.*${method.replace('.', '\\.')}`),
        new RegExp(`^\\s*\\/\\*.*${method.replace('.', '\\.')}`),
      ];
      return patterns.some(pattern => pattern.test(line));
    });

    // Also remove debugging blocks
    const isDebuggingBlock = 
      trimmedLine.includes('=========== ALL INTERVIEW STAGES DEBUGGING ===========') ||
      trimmedLine.includes('============== END DEBUGGING ==============') ||
      trimmedLine.includes('Found 0 total stages in ALL storages') ||
      trimmedLine.includes('Found 0 upcoming scheduled interviews') ||
      trimmedLine.includes('Local count:') ||
      trimmedLine.includes('Combined') && trimmedLine.includes('followups') ||
      trimmedLine.includes('Using Supabase JWT token for') ||
      trimmedLine.includes('API Request to');

    if (isConsoleStatement || isDebuggingBlock) {
      linesRemoved++;
    } else {
      // Remove inline console statements but keep the rest of the line
      let cleanedLine = line;
      consoleMethods.forEach(method => {
        const regex = new RegExp(`${method.replace('.', '\\.')}\\([^;]*\\);?`, 'g');
        if (regex.test(cleanedLine)) {
          cleanedLine = cleanedLine.replace(regex, '');
          linesRemoved++;
        }
      });
      
      // Only add non-empty lines or lines that still have content after cleaning
      if (cleanedLine.trim() !== '' || line.trim() === '') {
        filteredLines.push(cleanedLine);
      }
    }
  }

  return {
    content: filteredLines.join('\n'),
    linesRemoved
  };
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory ${dirPath} does not exist, skipping...`);
    return;
  }

  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other common directories
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
        processDirectory(fullPath);
      }
    } else if (stat.isFile() && shouldProcessFile(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const result = removeConsoleLogs(content);
        
        if (result.linesRemoved > 0) {
          fs.writeFileSync(fullPath, result.content, 'utf8');
          console.log(`✓ ${fullPath}: Removed ${result.linesRemoved} console statements`);
          totalLinesRemoved += result.linesRemoved;
        }
        
        totalFilesProcessed++;
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error.message);
      }
    }
  }
}

console.log('🧹 Starting console.log cleanup...\n');

// Process each directory
searchDirs.forEach(dir => {
  console.log(`Processing directory: ${dir}`);
  processDirectory(dir);
});

console.log('\n📊 Cleanup Summary:');
console.log(`Files processed: ${totalFilesProcessed}`);
console.log(`Console statements removed: ${totalLinesRemoved}`);
console.log('✅ Console cleanup completed!');
