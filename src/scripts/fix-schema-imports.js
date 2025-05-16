import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('🔍 Running comprehensive import fix...');

function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findTsFiles(filePath, fileList);
      } else if (
        (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) &&
        !filePath.includes('node_modules')
      ) {
        fileList.push(filePath);
      }
    } catch (err) {
      console.error(`Error with file ${filePath}: ${err.message}`);
    }
  }
  return fileList;
}

function fixImport(file, level = 1) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Determine relative path prefix based on directory level
    let relativePath = '../'.repeat(level) + 'utils/schema';
    
    // For files in the main backend directory
    let newContent = content
      .replace(/(['"])@\/utils\/schema\1/g, `$1${relativePath}$1`)
      .replace(/(['"])@shared\/schema\1/g, `$1${relativePath}$1`)
      .replace(/(['"])\.\.\/shared\/schema\1/g, `$1${relativePath}$1`)
      .replace(/(['"])\.\.\/\.\.\/shared\/schema\1/g, `$1${relativePath}$1`)
      .replace(/(['"])\.\.\/\.\.\/utils\/schema\1/g, `$1${relativePath}$1`)
      .replace(/(['"])\.\.\/utils\/schema\1/g, `$1${relativePath}$1`);
    
    // Check if the content was modified
    if (content !== newContent) {
      fs.writeFileSync(file, newContent);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Error fixing imports in ${file}: ${err.message}`);
    return false;
  }
}

async function processBackendFiles() {
  const backendDir = path.join(projectRoot, 'src', 'backend');
  const backendFiles = findTsFiles(backendDir);
  console.log(`Found ${backendFiles.length} TypeScript files in backend`);
  
  let changedFiles = 0;
  
  for (const file of backendFiles) {
    const relativePath = path.relative(backendDir, file);
    const level = relativePath.split(path.sep).length;
    
    const updated = fixImport(file, level);
    if (updated) {
      changedFiles++;
      console.log(`✅ Updated imports in: ${path.relative(projectRoot, file)}`);
    }
  }
  
  console.log(`\n🎉 Fixed imports in ${changedFiles} backend files`);
  return changedFiles;
}

// Run the script
processBackendFiles().then(count => {
  console.log('\n✅ All import paths have been updated!');
  console.log('📝 Please try running the app now to verify all imports are working correctly.');
}); 