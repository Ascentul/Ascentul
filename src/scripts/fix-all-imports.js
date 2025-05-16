import replaceInFile from 'replace-in-file';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('🔍 Running comprehensive import fix...');

async function fixAllImports() {
  try {
    // Fix all imports in backend files
    const backendResults = await replaceInFile({
      files: [
        path.join(projectRoot, 'src', 'backend', '**', '*.ts')
      ],
      from: [
        /from\s+["']@\/utils\/schema["']/g,
        /from\s+["']@shared\/schema["']/g,
        /from\s+["']\.\.\/shared\/schema["']/g,
        /from\s+["']\.\.\/utils\/schema["']/g,
        /from\s+["']\.\.\/\.\.\/utils\/schema["']/g,
        /from\s+["']\.\.\/\.\.\/shared\/schema["']/g
      ],
      to: 'from "../utils/schema"',
      countMatches: true,
      dry: false,
    });

    // Fix imports in subdirectories (routes, services, etc)
    const subDirResults = await replaceInFile({
      files: [
        path.join(projectRoot, 'src', 'backend', 'routes', '**', '*.ts'),
        path.join(projectRoot, 'src', 'backend', 'services', '**', '*.ts'),
        path.join(projectRoot, 'src', 'backend', 'utils', '**', '*.ts')
      ],
      from: [
        /from\s+["']\.\.\/utils\/schema["']/g
      ],
      to: 'from "../../utils/schema"',
      countMatches: true,
      dry: false,
    });

    // Fix deep imports in routes/services/utils
    const deepSubDirResults = await replaceInFile({
      files: [
        path.join(projectRoot, 'src', 'backend', 'routes', '**', '**', '*.ts'),
        path.join(projectRoot, 'src', 'backend', 'services', '**', '**', '*.ts'),
        path.join(projectRoot, 'src', 'backend', 'utils', '**', '**', '*.ts')
      ],
      from: [
        /from\s+["']\.\.\/\.\.\/utils\/schema["']/g
      ],
      to: 'from "../../../utils/schema"',
      countMatches: true,
      dry: false,
    });

    console.log('✅ Backend imports updated successfully');
    
    // Fix frontend files to use the correct import path
    const frontendResults = await replaceInFile({
      files: [
        path.join(projectRoot, 'src', 'frontend', '**', '*.ts'),
        path.join(projectRoot, 'src', 'frontend', '**', '*.tsx')
      ],
      from: [
        /from\s+["']@shared\/schema["']/g
      ],
      to: 'from "@/utils/schema"',
      countMatches: true,
      dry: false,
    });

    console.log('✅ Frontend imports updated successfully');
    
    // Count total changes
    const totalChanges = [
      ...backendResults,
      ...subDirResults,
      ...deepSubDirResults,
      ...frontendResults
    ].reduce((sum, result) => sum + (result.hasChanged ? 1 : 0), 0);
    
    console.log(`\n🎉 Fixed imports in ${totalChanges} files`);
    return totalChanges;
    
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
}

// Run the fix
fixAllImports().then(totalChanges => {
  console.log(`\n✅ Import paths update complete with ${totalChanges} files changed`);
  console.log('📝 Please try running the app now to verify all imports are working correctly.');
}); 