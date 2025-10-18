# Template Preview Images

This directory contains preview images for resume templates used in the Template Picker UI.

## Supported Formats

The preview system supports multiple image formats:
- **PNG** (recommended for photos/screenshots)
- **SVG** (recommended for vector graphics)
- **WEBP** (recommended for modern browsers, best compression)
- **JPEG/JPG** (fallback for compatibility)

## Naming Convention

Preview images should be named using the template slug with appropriate extension:
```
{slug}.{extension}
```

Examples:
- `grid-compact.png`
- `modern-sidebar.svg`
- `minimal-serif.webp`

## Image Specifications

- **Dimensions:** Recommended 340x440px (PNG/JPEG/WEBP) or equivalent 17:22 aspect ratio (SVG)
- **Size:** Keep under 100KB for optimal loading performance
- **Compression:** Use tools like `sharp` (PNG), `svgo` (SVG), or `cwebp` (WEBP)

### Tool Installation

```bash
# sharp (Node.js image processing - for PNG/JPEG/WEBP)
npm install --save-dev sharp

# svgo (SVG optimizer)
npm install -g svgo
# or: brew install svgo (macOS)

# cwebp (WebP encoder - part of libwebp)
brew install webp           # macOS
apt-get install webp        # Ubuntu/Debian
choco install webp          # Windows
```

## Generation

### Generate PNG Previews

```bash
# Ensure sharp is installed (see Tool Installation section above)
node scripts/generate-preview-pngs.js
```

This creates PNG files from SVG sources and ensures all templates have preview images.

### Generate SVG Placeholders

```bash
# Ensure svgo is installed (see Tool Installation section above)
node scripts/create-template-previews.js
```

Creates basic SVG placeholders for templates without preview images.

## Validation

### Validate Preview Images Exist

Before deployment, verify that all preview images referenced in template definitions exist:

```bash
npm run validate:previews
```

This script:
- Checks each template in `TEMPLATE_DEFINITIONS` for missing preview images
- Reports file sizes for existing previews
- Exits with code 1 if any images are missing (useful for CI/CD)
- Skips external URLs (CDN-hosted previews)

**Integration with CI/CD:**

Add to your build pipeline to catch missing assets early:

```yaml
# Example: GitHub Actions
- name: Validate preview images
  run: npm run validate:previews

# Example: Vercel build command
"build": "npm run validate:previews && next build"
```

## Usage in Code

The `getPreviewSrc()` function automatically resolves preview paths with flexible extension support.

### Function Signature

```typescript
type PreviewExtension = 'png' | 'jpg' | 'jpeg' | 'webp' | 'svg' | 'gif';

interface PreviewSourceInput {
  /** Preview value from template config (can be filename, path, or URL) */
  preview: string | null | undefined;

  /** Non-empty asset identifier used to build preview paths */
  previewAssetId: string;

  /** File extension for preview images. Defaults to 'png'. Must be a supported image format without the dot. */
  extension?: PreviewExtension;
}

function getPreviewSrc(input: PreviewSourceInput): string;
```

### Examples

```typescript
// Using filename with extension (most common)
getPreviewSrc({
  preview: "grid-compact.png",
  previewAssetId: "grid-compact"
})
// → "/previews/grid-compact.png"

// Using SVG format
getPreviewSrc({
  preview: "modern-sidebar.svg",
  previewAssetId: "modern-sidebar"
})
// → "/previews/modern-sidebar.svg"

// Fallback with custom extension
getPreviewSrc({
  preview: null,
  previewAssetId: "timeline",
  extension: "webp"
})
// → "/previews/timeline.webp"

// Absolute URLs (for CDN hosting)
getPreviewSrc({
  preview: "https://cdn.example.com/template.png",
  previewAssetId: "modern"
})
// → "https://cdn.example.com/template.png"
```

## CDN Hosting (Optional)

To serve previews from a CDN, set the environment variable:

```bash
NEXT_PUBLIC_PREVIEW_BASE_URL=https://your-cdn.com/previews
```

When configured, the system constructs URLs with the specified extension:
```
{NEXT_PUBLIC_PREVIEW_BASE_URL}/{previewAssetId}.{extension}
```

Default extension is `png` unless specified otherwise.

## Fallback Behavior

If a preview image is not found, the Template Picker will display a placeholder icon (FileText from lucide-react).

## Migration Guide

### From PNG-only to Multi-format

If you want to migrate from PNG to a more efficient format like WEBP:

**Prerequisites:** Install the `cwebp` tool first (see [Tool Installation](#tool-installation) above).

1. Convert existing PNGs to WEBP:
   ```bash
   for file in *.png; do
     cwebp -q 90 "$file" -o "${file%.png}.webp"
   done
   ```

2. Update template definitions to reference WEBP files:
   ```typescript
   {
     preview: "grid-compact.webp"  // changed from .png
   }
   ```

3. Or use the extension parameter for automatic resolution:
   ```typescript
   getPreviewSrc({
     preview: null,
     previewAssetId: "grid-compact",
     extension: "webp"
   })
   ```
