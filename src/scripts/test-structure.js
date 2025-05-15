import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to check if a directory exists
const directoryExists = (dirPath) => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
};

// Function to check if a file exists
const fileExists = (filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
};

// Get project root directory (two levels up from this script)
const projectRoot = path.resolve(__dirname, '..', '..');

// Define the expected directory structure
const expectedDirectories = [
  'src/frontend',
  'src/backend',
  'src/config',
  'src/scripts',
  'src/utils',
  'src/types',
  'src/tests',
  'src/assets',
];

// Define some key files to check
const keyFiles = [
  'vite.config.ts',
  'package.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'src/frontend/index.html',
  'src/frontend/main.tsx',
  'src/backend/index.ts',
  'README.md',
];

console.log('Checking reorganized project structure...\n');

// Check directories
console.log('Checking directories:');
const missingDirectories = [];
for (const dir of expectedDirectories) {
  const fullPath = path.join(projectRoot, dir);
  const exists = directoryExists(fullPath);
  console.log(`- ${dir}: ${exists ? '✅' : '❌'}`);
  if (!exists) missingDirectories.push(dir);
}

// Check key files
console.log('\nChecking key files:');
const missingFiles = [];
for (const file of keyFiles) {
  const fullPath = path.join(projectRoot, file);
  const exists = fileExists(fullPath);
  console.log(`- ${file}: ${exists ? '✅' : '❌'}`);
  if (!exists) missingFiles.push(file);
}

// Summary
console.log('\nSummary:');
if (missingDirectories.length === 0 && missingFiles.length === 0) {
  console.log('✅ All directories and key files are present! The project structure looks good.');
} else {
  console.log('❌ Some issues were found:');
  if (missingDirectories.length > 0) {
    console.log(`  - Missing directories: ${missingDirectories.join(', ')}`);
  }
  if (missingFiles.length > 0) {
    console.log(`  - Missing files: ${missingFiles.join(', ')}`);
  }
}

console.log('\nDone!'); 