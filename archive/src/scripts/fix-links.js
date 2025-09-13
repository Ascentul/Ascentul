import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Ensure postcss.config.js is in the right location
const postcssConfigPath = path.join(projectRoot, 'postcss.config.js');
const postcssConfigSrcPath = path.join(projectRoot, 'src', 'config', 'postcss.config.js');

if (fs.existsSync(postcssConfigPath)) {

} else {

  if (fs.existsSync(postcssConfigSrcPath)) {
    fs.copyFileSync(postcssConfigSrcPath, postcssConfigPath);

  } else {

  }
}

// Create a .npmrc file to ensure packages install correctly
const npmrcPath = path.join(projectRoot, '.npmrc');
if (!fs.existsSync(npmrcPath)) {

  fs.writeFileSync(npmrcPath, 'legacy-peer-deps=true\n');

}

// Check the theme.json file
const themeJsonPath = path.join(projectRoot, 'theme.json');
if (fs.existsSync(themeJsonPath)) {

} else {

  const basicThemeJson = {
    colors: {
      primary: {
        DEFAULT: "#0284c7",
        foreground: "#ffffff"
      }
    }
  };
  fs.writeFileSync(themeJsonPath, JSON.stringify(basicThemeJson, null, 2));

}

// Check uploads directory
const uploadsPath = path.join(projectRoot, 'uploads');
if (fs.existsSync(uploadsPath)) {

} else {

  fs.mkdirSync(uploadsPath, { recursive: true });

}

