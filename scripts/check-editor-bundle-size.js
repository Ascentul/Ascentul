#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const buildDir = path.join(projectRoot, '.next', 'server', 'app', '(studio)', 'resume');
const targetFiles = [
  path.join(buildDir, '[resumeId]', 'page.js'),
  path.join(buildDir, 'layout.js'),
];

const thresholdKb = Number(process.env.EDITOR_BUNDLE_THRESHOLD_KB || 380);
if (isNaN(thresholdKb)) {
  console.error('[bundle-check] Invalid EDITOR_BUNDLE_THRESHOLD_KB value. Must be a number.');
  process.exit(1);
}
if (isNaN(thresholdKb) || thresholdKb <= 0) {
  console.error(
    `[bundle-check] Invalid EDITOR_BUNDLE_THRESHOLD_KB="${process.env.EDITOR_BUNDLE_THRESHOLD_KB}". ` +
    'Must be a positive number. Defaulting to 380kB would be misleading, so aborting.'
  );
  process.exitCode = 1;
  process.exit(1);
}

function getFileSizeBytes(filePath) {
  if (!fs.existsSync(filePath)) {
    return 0;
  }
  return fs.statSync(filePath).size;
}

const totalBytes = targetFiles.reduce((sum, file) => sum + getFileSizeBytes(file), 0);
const totalKb = totalBytes / 1024;

if (totalBytes === 0) {
  console.warn('[bundle-check] Editor assets not found. Did you run `next build` first?');
  process.exit(0);
}

if (totalKb > thresholdKb) {
  console.error(
    `[bundle-check] Editor bundle ${totalKb.toFixed(1)}kB exceeds threshold ${thresholdKb}kB. ` +
      'Investigate large dependencies or split chunks.'
  );
  process.exit(1);
} else {
  console.log(
    `[bundle-check] Editor bundle size ${totalKb.toFixed(1)}kB within threshold ${thresholdKb}kB.`
  );
}
