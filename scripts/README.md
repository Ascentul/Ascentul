# Scripts Directory

This directory contains build and maintenance scripts for the application.

## Files

### `templates-config.json`

**Purpose**: Shared configuration for template preview generation scripts.

**Why it exists**: Prevents configuration drift between scripts and the canonical template definitions in `src/lib/templates/index.ts`. Previously, template definitions were hard-coded in scripts, which created maintenance burden and risk of drift when templates were added, removed, or modified.

**Structure**:
```json
[
  {
    "slug": "template-slug",
    "name": "Display Name",
    "description": "Short description for preview",
    "color": "#HEX_COLOR"
  }
]
```

**Maintenance**:
- When adding/removing templates in `src/lib/templates/index.ts`, update this file accordingly
- The `generate-preview-pngs.js` script validates sync and warns if drift is detected
- Run `node scripts/generate-preview-pngs.js` to verify configuration after changes

**Fields**:
- `slug`: Stable identifier matching the template slug in `src/lib/templates/index.ts`
- `name`: Human-readable name displayed in the preview image
- `description`: Short description shown in the preview image
- `color`: Hex color code used for branding elements in the preview SVG

### `generate-preview-pngs.js`

**Purpose**: Generate PNG preview images for resume templates.

**What it does**:
1. Validates that `templates-config.json` matches `src/lib/templates/index.ts`
2. Creates missing SVG files for templates defined in `templates-config.json`
3. Converts SVG previews to PNG format (340x440px)
4. Optimizes file sizes for web delivery

**Usage**:
```bash
npm install sharp
node scripts/generate-preview-pngs.js [--skip-existing]
```

**Options**:
- `--skip-existing`: Skip PNG generation for templates that already have PNG files
  - Use this for faster runs when you know the generateSVG() function hasn't changed
  - Default behavior (without this flag) regenerates all PNGs to ensure they're in sync

**When to run**:
- After adding new templates to the application
- After modifying `templates-config.json`
- After modifying the `generateSVG()` function in the script
- When preview images need to be regenerated

**Default behavior**:
The script always regenerates all PNG files by default. This ensures:
- PNGs stay in sync with any changes to the `generateSVG()` function
- Template colors, layouts, or branding updates are reflected
- No stale previews remain after template modifications

Use `--skip-existing` only when you're confident the PNG generation logic hasn't changed and want faster iteration.

**Output**: PNG files in `public/previews/` directory

## Best Practices

1. **Template Sync**: Always update `templates-config.json` when modifying templates in `src/lib/templates/index.ts`
2. **Validation**: Run the preview generation script after changes to catch drift early
3. **Version Control**: Commit both the config file and generated previews together
4. **Documentation**: Update this README when adding new scripts or configuration files
