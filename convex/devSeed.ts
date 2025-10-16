import { mutation, query } from "./_generated/server";

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("builder_resume_templates").collect();
    if (existing.length > 0) return { inserted: 0, message: "Templates already exist" };

    const letter = "Letter";
    const a4 = "A4";
    const tight = { top: 54, right: 42, bottom: 54, left: 42 };
    const standard = { top: 72, right: 54, bottom: 72, left: 54 };
    const now = Date.now();

    const templates = [
      {
        slug: "modern-clean",
        name: "Modern Clean",
        description: "A clean, minimalist template perfect for any industry",
        thumbnailUrl: "/previews/modern-clean.svg",
        pageSize: letter,
        margins: standard,
        allowedBlocks: ["header", "summary", "experience", "education", "skills"],
        isPublic: true,
        createdAt: now,
      },
      {
        slug: "modern-two-col",
        name: "Modern Two Column",
        description: "Two-column layout that maximizes space utilization",
        thumbnailUrl: "/previews/modern-two-col.svg",
        pageSize: letter,
        margins: standard,
        allowedBlocks: ["header", "summary", "skills", "experience", "education", "projects"],
        isPublic: true,
        createdAt: now,
      },
      {
        slug: "grid-compact",
        name: "Grid Compact",
        description: "Compact grid layout for fitting more content on one page",
        thumbnailUrl: "/previews/grid-compact.svg",
        pageSize: a4,
        margins: tight,
        allowedBlocks: ["header", "summary", "experience", "skills", "education"],
        isPublic: true,
        createdAt: now,
      },
      {
        slug: "timeline",
        name: "Timeline",
        description: "Timeline-style layout emphasizing career progression",
        thumbnailUrl: "/previews/timeline.svg",
        pageSize: letter,
        margins: standard,
        allowedBlocks: ["header", "summary", "experience", "projects", "education", "skills"],
        isPublic: true,
        createdAt: now,
      },
      {
        slug: "minimal-serif",
        name: "Minimal Serif",
        description: "Elegant serif typography for a professional look",
        thumbnailUrl: "/previews/minimal-serif.svg",
        pageSize: a4,
        margins: standard,
        allowedBlocks: ["header", "summary", "experience", "education", "skills"],
        isPublic: true,
        createdAt: now,
      },
      {
        slug: "product-designer",
        name: "Product Designer",
        description: "Designed specifically for product designers and creatives",
        thumbnailUrl: "/previews/product-designer.svg",
        pageSize: letter,
        margins: standard,
        allowedBlocks: ["header", "summary", "projects", "experience", "education", "skills"],
        isPublic: true,
        createdAt: now,
      },
    ];

    await Promise.all(
      templates.map(t => ctx.db.insert("builder_resume_templates", t))
    );

    return { inserted: templates.length, message: "Templates seeded" };
  },
});

export const seedThemes = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("builder_resume_themes").collect();
    if (existing.length > 0) return { inserted: 0, message: "Themes already exist" };

    const now = Date.now();
    const commonFonts = { heading: "Inter", body: "Inter" };
    const commonFontSizes = { heading: 16, body: 11 };
    const commonSpacing = { section: 16, item: 8 };

    const themes = [
      {
        slug: "modern-blue",
        name: "Modern Blue",
        fonts: { ...commonFonts },
        fontSizes: { ...commonFontSizes },
        colors: { primary: "#5271ff", text: "#111111", accent: "#00C092" },
        spacing: { ...commonSpacing },
        isPublic: true,
        createdAt: now,
      },
      {
        slug: "neutral-gray",
        name: "Neutral Gray",
        fonts: { ...commonFonts },
        fontSizes: { ...commonFontSizes },
        colors: { primary: "#111111", text: "#111111", accent: "#6B7280" },
        spacing: { ...commonSpacing },
        isPublic: true,
        createdAt: now,
      },
      {
        slug: "professional-navy",
        name: "Professional Navy",
        fonts: { ...commonFonts },
        fontSizes: { ...commonFontSizes },
        colors: { primary: "#0c29ab", text: "#111111", accent: "#1C1F27" },
        spacing: { ...commonSpacing },
        isPublic: true,
        createdAt: now,
      },
      {
        slug: "minimal-black",
        name: "Minimal Black",
        fonts: { ...commonFonts },
        fontSizes: { ...commonFontSizes },
        colors: { primary: "#000000", text: "#111111", accent: "#4B5563" },
        spacing: { ...commonSpacing },
        isPublic: true,
        createdAt: now,
      },
    ];

    await Promise.all(
      themes.map(t => ctx.db.insert("builder_resume_themes", t))
    );

    return { inserted: themes.length, message: "Themes seeded" };
  },
});

export const hasCatalog = query({
  args: {},
  handler: async (ctx) => {
    const [templates, themes] = await Promise.all([
      ctx.db.query("builder_resume_templates").collect(),
      ctx.db.query("builder_resume_themes").collect(),
    ]);
    return { templates: templates.length, themes: themes.length };
  },
});
