# Template Preview Images

This directory contains preview images for resume templates used in the Template Picker UI.

## Naming Convention

Preview images must follow this pattern:
```
template-{slug}.png
```

For example:
- `template-modern-minimal.png`
- `template-professional.png`
- `template-creative.png`

## Image Specifications

- **Format:** PNG (preferred) or JPEG
- **Dimensions:** Recommended 400x520px (maintains aspect ratio for card display)
- **Size:** Keep under 100KB for optimal loading performance

## Generation

Use the preview generation script to create template previews:

```bash
node scripts/create-template-previews.js
```

This script uses Puppeteer/Playwright to render each template and capture a screenshot.

## CDN Hosting (Optional)

To serve previews from a CDN, set the environment variable:

```bash
NEXT_PUBLIC_PREVIEW_BASE_URL=https://your-cdn.com/previews
```

When this is set, the system will construct preview URLs as:
```
{NEXT_PUBLIC_PREVIEW_BASE_URL}/template-{slug}.png
```

If not set, the system defaults to serving from `/public/previews/`.

## Fallback Behavior

If a preview image is not found, the Template Picker will display a placeholder icon (FileText from lucide-react).
