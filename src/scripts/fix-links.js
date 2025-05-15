import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('🔍 Checking configuration files for correct paths...');

// Ensure postcss.config.js is in the right location
const postcssConfigPath = path.join(projectRoot, 'postcss.config.js');
const postcssConfigSrcPath = path.join(projectRoot, 'src', 'config', 'postcss.config.js');

if (fs.existsSync(postcssConfigPath)) {
  console.log('✓ postcss.config.js found in root directory');
} else {
  console.log('⚠️ postcss.config.js not found in root directory, copying from src/config');
  if (fs.existsSync(postcssConfigSrcPath)) {
    fs.copyFileSync(postcssConfigSrcPath, postcssConfigPath);
    console.log('✓ postcss.config.js copied to root directory');
  } else {
    console.log('❌ postcss.config.js not found in src/config directory');
  }
}

// Create a .npmrc file to ensure packages install correctly
const npmrcPath = path.join(projectRoot, '.npmrc');
if (!fs.existsSync(npmrcPath)) {
  console.log('⚠️ .npmrc not found, creating one for better dependency management');
  fs.writeFileSync(npmrcPath, 'legacy-peer-deps=true\n');
  console.log('✓ .npmrc created');
}

// Check the theme.json file
const themeJsonPath = path.join(projectRoot, 'theme.json');
if (fs.existsSync(themeJsonPath)) {
  console.log('✓ theme.json found in root directory');
} else {
  console.log('⚠️ theme.json not found, creating a basic one');
  const basicThemeJson = {
    colors: {
      primary: {
        DEFAULT: "#0284c7",
        foreground: "#ffffff"
      }
    }
  };
  fs.writeFileSync(themeJsonPath, JSON.stringify(basicThemeJson, null, 2));
  console.log('✓ Basic theme.json created');
}

// Check uploads directory
const uploadsPath = path.join(projectRoot, 'uploads');
if (fs.existsSync(uploadsPath)) {
  console.log('✓ uploads directory exists');
} else {
  console.log('⚠️ uploads directory not found, creating it');
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✓ uploads directory created');
}

console.log('\n✅ All configuration files and directories have been checked and fixed!');
console.log('📝 The project structure is now clean and ready to use.'); 