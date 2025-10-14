# Template Preview Images

This directory contains preview thumbnail images for resume templates.

## Required Files

The following PNG files are required (340x440px, 8.5:11 aspect ratio):

1. **modern-clean.png** - Clean, minimalist template preview
2. **modern-two-col.png** - Two-column layout preview
3. **grid-compact.png** - Compact grid layout preview
4. **timeline.png** - Timeline-style layout preview
5. **minimal-serif.png** - Elegant serif typography preview
6. **product-designer.png** - Creative/designer-focused preview

## Image Specifications

- **Dimensions**: 340px × 440px (8.5:11 aspect ratio for US Letter portrait)
- **Format**: PNG with transparency support
- **File size**: Recommended <100KB per image (optimize with tools like TinyPNG)
- **Content**: Screenshot or mockup of the template layout
- **Background**: Use light gray (#F3F4F6) or transparent background

## Creating Preview Images

### Option 1: Screenshot from PDF renderer
1. Render the template with sample data
2. Capture screenshot at 340x440px
3. Optimize the PNG file
4. Save with the correct filename

### Option 2: Design mockup
1. Create mockup in Figma/Sketch at 340x440px
2. Export as PNG with 2x resolution (680x880px)
3. Optimize the file
4. Save with the correct filename

### Option 3: Placeholder generation
For development/testing, you can use simple placeholder images:
```bash
# Using ImageMagick (if available)
convert -size 340x440 xc:#F3F4F6 \
  -gravity center -pointsize 24 -fill '#6B7280' \
  -annotate +0+0 'Template Name' \
  template-name.png
```

## Remote Previews (Optional)

Instead of local files, you can host previews on a CDN/storage service:

1. Upload PNG files to your storage (S3, Supabase Storage, etc.)
2. Set environment variable:
   ```
   NEXT_PUBLIC_PREVIEW_BASE_URL=https://your-cdn.com/previews
   ```
3. The system will automatically construct URLs: `{base}/{template-slug}.png`

## Troubleshooting

### Images not showing?
1. Verify files exist: `ls public/previews/`
2. Check filename matches exactly (case-sensitive)
3. Test direct URL: `http://localhost:3000/previews/modern-clean.png`
4. Restart dev server if files were added while running

### 404 errors?
- Ensure files are in `public/previews/` (not `src/previews/`)
- File names must match template slugs exactly
- No capital letters in filenames

### Remote images not loading?
- Add domain to `next.config.js`:
  ```js
  images: {
    domains: ['your-cdn.com'],
  }
  ```
- Ensure bucket/storage is publicly accessible
- Check CORS settings if hosting on different domain
