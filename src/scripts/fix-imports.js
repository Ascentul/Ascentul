import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('🔍 Checking and updating import references...');

// Function to recursively find all .ts and .tsx files
function findFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          findFiles(filePath, fileList);
        } else if (
          (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) && 
          !filePath.includes('node_modules')
        ) {
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
function updateImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace direct imports from "../shared/schema"
    let updatedContent = content.replace(
      /from\s+["']\.\.\/shared\/schema["']/g, 
      'from "../utils/schema"'
    );
    
    // Replace aliased imports from "@shared/schema"
    updatedContent = updatedContent.replace(
      /from\s+["']@shared\/schema["']/g, 
      'from "@/utils/schema"'
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

// Create a fixed update for db.ts which needs special handling
function fixDbImport() {
  const dbFilePath = path.join(projectRoot, 'src', 'backend', 'db.ts');
  
  try {
    if (fs.existsSync(dbFilePath)) {
      const content = fs.readFileSync(dbFilePath, 'utf8');
      const updatedContent = content.replace(
        /import \* as schema from "@shared\/schema"/g,
        'import * as schema from "../utils/schema"'
      );
      
      if (content !== updatedContent) {
        fs.writeFileSync(dbFilePath, updatedContent);
        console.log('✅ Fixed special import in db.ts');
        return true;
      }
    }
  } catch (err) {
    console.error(`❌ Error fixing db.ts: ${err.message}`);
  }
  return false;
}

// Find all TypeScript files
console.log('Finding TypeScript files in src directory...');
const allFiles = findFiles(path.join(projectRoot, 'src'));
console.log(`Found ${allFiles.length} TypeScript files to check`);

// Update imports in all files
let updatedCount = 0;
for (const filePath of allFiles) {
  try {
    const isUpdated = updateImports(filePath);
    if (isUpdated) {
      updatedCount++;
      console.log(`✅ Updated imports in: ${path.relative(projectRoot, filePath)}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
}

// Special fix for db.ts
fixDbImport();

console.log(`\n🔄 Import updates complete: ${updatedCount} files updated`);

// Update vite.config.ts paths
console.log('\n📝 Ensuring vite.config.ts paths are correct');
const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
try {
  let viteContent = fs.readFileSync(viteConfigPath, 'utf8');
  
  if (viteContent.includes('@shared') && !viteContent.includes('@shared: path.resolve')) {
    console.log('⚠️ Need to update vite.config.ts paths');
    // Update already done in earlier steps
  } else {
    console.log('✓ vite.config.ts paths are already updated');
  }
} catch (err) {
  console.error('❌ Error checking vite.config.ts:', err.message);
}

console.log('\n✅ All import paths have been checked and updated!');
console.log('📝 Please run the app to verify all imports are working correctly.'); 