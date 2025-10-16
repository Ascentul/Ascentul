#!/usr/bin/env node

/**
 * Generate simple placeholder preview images for templates
 * This creates basic SVG files that can be used until real screenshots are available
 */

const fs = require('fs');
const path = require('path');

const previewsDir = path.join(__dirname, '../public/previews');

// Ensure directory exists
if (!fs.existsSync(previewsDir)) {
  fs.mkdirSync(previewsDir, { recursive: true });
}

const templates = [
  {
    slug: 'modern-clean',
    name: 'Modern Clean',
    description: 'Clean, minimalist design',
    color: '#3B82F6',
  },
  {
    slug: 'modern-two-col',
    name: 'Modern Two Column',
    description: 'Maximize space utilization',
    color: '#8B5CF6',
  },
  {
    slug: 'grid-compact',
    name: 'Grid Compact',
    description: 'Compact grid layout',
    color: '#10B981',
  },
  {
    slug: 'timeline',
    name: 'Timeline',
    description: 'Career progression focus',
    color: '#F59E0B',
  },
  {
    slug: 'minimal-serif',
    name: 'Minimal Serif',
    description: 'Elegant typography',
    color: '#EF4444',
  },
  {
    slug: 'product-designer',
    name: 'Product Designer',
    description: 'Creative portfolio focus',
    color: '#EC4899',
  },
];

function generateSVG(template) {
  if (
    !template ||
    typeof template !== 'object' ||
    !template.slug ||
    !template.name ||
    !template.description ||
    !template.color ||
    !/^#[0-9A-Fa-f]{6}$/.test(template.color)
  ) {
    throw new Error('Invalid template object: missing required properties or invalid color format');
  }

  const escapeXml = (value) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const safeName = escapeXml(template.name);
  const safeDescription = escapeXml(template.description);
  const safeTitle = 'JANE ANDERSON';
  const safeSubtitle = 'Product Designer • San Francisco, CA';

  return `<svg width="340" height="440" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="340" height="440" fill="#F9FAFB"/>

  <!-- Border -->
  <rect x="0.5" y="0.5" width="339" height="439" fill="none" stroke="#E5E7EB" stroke-width="1"/>

  <!-- Title area -->
  <rect x="0" y="0" width="340" height="80" fill="${template.color}" opacity="0.05"/>
  <text x="170" y="35" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#111827" text-anchor="middle" font-weight="600">
    ${safeName}
  </text>
  <text x="170" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#6B7280" text-anchor="middle">
    ${safeDescription}
  </text>

  <!-- Resume mockup content -->
  <g transform="translate(30, 100)">
    <!-- Header section -->
    <rect x="0" y="0" width="280" height="50" fill="${template.color}" opacity="0.1" rx="4"/>
    <text x="10" y="22" font-size="12" fill="#111827" font-weight="600">${safeTitle}</text>
    <text x="10" y="38" font-size="9" fill="#6B7280">${safeSubtitle}</text>

    <!-- Section 1 -->
    <text x="0" y="75" font-size="10" fill="${template.color}" font-weight="600">EXPERIENCE</text>
    <line x1="0" y1="80" x2="280" y2="80" stroke="#E5E7EB" stroke-width="1"/>

    <rect x="0" y="90" width="200" height="6" fill="#D1D5DB" rx="2"/>
    <rect x="0" y="100" width="180" height="4" fill="#E5E7EB" rx="1"/>
    <rect x="0" y="108" width="240" height="4" fill="#E5E7EB" rx="1"/>
    <rect x="0" y="116" width="220" height="4" fill="#E5E7EB" rx="1"/>

    <rect x="0" y="130" width="200" height="6" fill="#D1D5DB" rx="2"/>
    <rect x="0" y="140" width="190" height="4" fill="#E5E7EB" rx="1"/>
    <rect x="0" y="148" width="230" height="4" fill="#E5E7EB" rx="1"/>

    <!-- Section 2 -->
    <text x="0" y="180" font-size="10" fill="${template.color}" font-weight="600">EDUCATION</text>
    <line x1="0" y1="185" x2="280" y2="185" stroke="#E5E7EB" stroke-width="1"/>

    <rect x="0" y="195" width="180" height="6" fill="#D1D5DB" rx="2"/>
    <rect x="0" y="205" width="160" height="4" fill="#E5E7EB" rx="1"/>

    <!-- Section 3 -->
    <text x="0" y="235" font-size="10" fill="${template.color}" font-weight="600">SKILLS</text>
    <line x1="0" y1="240" x2="280" y2="240" stroke="#E5E7EB" stroke-width="1"/>

    <g transform="translate(0, 250)">
      <rect x="0" y="0" width="60" height="18" fill="${template.color}" opacity="0.15" rx="9"/>
      <rect x="65" y="0" width="75" height="18" fill="${template.color}" opacity="0.15" rx="9"/>
      <rect x="145" y="0" width="55" height="18" fill="${template.color}" opacity="0.15" rx="9"/>
      <rect x="0" y="23" width="70" height="18" fill="${template.color}" opacity="0.15" rx="9"/>
      <rect x="75" y="23" width="65" height="18" fill="${template.color}" opacity="0.15" rx="9"/>
    </g>
  </g>

  <!-- Watermark -->
  <text x="170" y="425" font-family="system-ui, -apple-system, sans-serif" font-size="8" fill="#9CA3AF" text-anchor="middle" opacity="0.5">
    Template Preview
  </text>
</svg>`;
}

// Create SVG files
console.log('Creating template preview images...\n');

templates.forEach(template => {
  const filename = `${template.slug}.svg`;
  const filepath = path.join(previewsDir, filename);
  const svg = generateSVG(template);

  try {
    fs.writeFileSync(filepath, svg, 'utf8');
    console.log(`✓ Created ${filename}`);
  } catch (error) {
    console.error(`✗ Failed to create ${filename}: ${error.message}`);
    process.exit(1);
  }
});

console.log('\n✅ All template previews created successfully!');
console.log('\nNote: These are SVG placeholders. Replace with actual PNG screenshots');
console.log('of rendered templates at 340x440px for production use.');
console.log('\nTo view: http://localhost:3000/previews/modern-clean.svg');
