import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('🔍 Fixing backend import references...');

// Function to recursively find all .ts files in backend directory
function findBackendFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          findBackendFiles(filePath, fileList);
        } else if (filePath.endsWith('.ts') && !filePath.includes('node_modules')) {
          fileList.push(filePath);
        }
      } catch (err) {
        console.error(`Skipping file ${file}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
  }

  return fileList;
}

// Function to update imports in a file
function updateBackendImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace "@/utils/schema" with "../../utils/schema" for backend files
    let updatedContent = content.replace(
      /from\s+["']@\/utils\/schema["']/g, 
      'from "../../utils/schema"'
    );
    
    // Replace "../utils/schema" with "../../utils/schema" for backend files
    updatedContent = updatedContent.replace(
      /from\s+["']\.\.\/utils\/schema["']/g, 
      'from "../../utils/schema"'
    );
    
    // For files in subdirectories, use deeper path
    if (filePath.includes('src/backend/routes/') || filePath.includes('src/backend/services/')) {
      updatedContent = updatedContent.replace(
        /from\s+["']\.\.\/\.\.\/utils\/schema["']/g, 
        'from "../../../utils/schema"'
      );
    }
    
    // Replace any remaining @shared references
    updatedContent = updatedContent.replace(
      /from\s+["']@shared\/schema["']/g, 
      'from "../../utils/schema"'
    );
    
    // Save if content was modified
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`❌ Error updating imports in ${filePath}:`, err.message);
    return false;
  }
}

// Find all TypeScript files in backend
console.log('Finding TypeScript files in src/backend directory...');
const backendDir = path.join(projectRoot, 'src', 'backend');
const backendFiles = findBackendFiles(backendDir);
console.log(`Found ${backendFiles.length} backend TypeScript files to check`);

// Update imports in all backend files
let updatedCount = 0;
for (const filePath of backendFiles) {
  try {
    const isUpdated = updateBackendImports(filePath);
    if (isUpdated) {
      updatedCount++;
      console.log(`✅ Updated imports in: ${path.relative(projectRoot, filePath)}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
}

console.log(`\n🔄 Backend import updates complete: ${updatedCount} files updated`);
console.log('📝 Please run the app to verify all imports are working correctly.'); 