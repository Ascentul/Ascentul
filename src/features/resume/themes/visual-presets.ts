import type { VisualTheme } from './visual-theme-types';

/**
 * Navy Sidebar - Dark navy sidebar with white content
 * Professional and modern with strong visual hierarchy
 */
export const NavySidebar: VisualTheme = {
  id: 'navy-sidebar',
  name: 'Navy Sidebar',
  slug: 'navy-sidebar',
  description: 'Professional navy sidebar with crisp white content area',
  palette: {
    primary: '#0B1F3B',
    primaryTextOn: 'dark',
    surface: '#FFFFFF',
    surfaceAlt: '#0B1F3B',
    text: '#1F2937',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    accent: '#0EA5E9',
  },
  typography: {
    headingFamily: 'Inter, ui-sans-serif, system-ui',
    bodyFamily: 'Inter, ui-sans-serif, system-ui',
    h1: 'text-3xl font-extrabold tracking-tight',
    h2: 'text-xl font-bold',
    h3: 'text-base font-semibold',
    body: 'text-[13px] leading-relaxed',
    small: 'text-xs text-gray-500',
  },
  components: {
    page: 'bg-white text-gray-800',
    sidebar: {
      enabled: true,
      width: 'medium',
      align: 'left',
      classes: 'bg-[#0B1F3B] text-white px-6 py-8 space-y-4',
      avatarStyle: 'circle',
      sectionTitle: 'uppercase text-xs tracking-wider text-white/80 font-semibold mb-2',
      item: 'text-sm text-white/95 leading-relaxed',
      divider: 'line',
    },
    sectionHeader: {
      title: 'text-xl font-bold text-gray-900',
      underline: true,
      underlineClass: 'mt-1 h-[2px] w-10 bg-[#0EA5E9]',
      gapClass: 'mt-3',
    },
    bullet: {
      style: 'disc',
      className: 'marker:text-[#0EA5E9]',
    },
    chip: {
      className: 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs border-gray-200 bg-gray-50 text-gray-700',
    },
    divider: { className: 'border-t border-gray-200 my-4' },
    link: { className: 'text-[#0EA5E9] underline decoration-1 underline-offset-2' },
  },
  a11y: { minContrast: 4.5 },
  isPublic: true,
};

/**
 * Emerald Sidebar - Green sidebar with off-white content
 * Fresh and approachable with serif headings
 */
export const EmeraldSidebar: VisualTheme = {
  id: 'emerald-sidebar',
  name: 'Emerald Sidebar',
  slug: 'emerald-sidebar',
  description: 'Elegant emerald sidebar with serif typography',
  palette: {
    primary: '#047857',
    primaryTextOn: 'dark',
    surface: '#FAFAF9',
    surfaceAlt: '#047857',
    text: '#1C1917',
    textMuted: '#78716C',
    border: '#E7E5E4',
    accent: '#10B981',
  },
  typography: {
    headingFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
    bodyFamily: 'system-ui, -apple-system, sans-serif',
    h1: 'text-3xl font-serif font-bold',
    h2: 'text-xl font-serif font-semibold',
    h3: 'text-base font-serif font-medium',
    body: 'text-sm leading-relaxed',
    small: 'text-xs text-stone-500',
  },
  components: {
    page: 'bg-stone-50 text-stone-900',
    sidebar: {
      enabled: true,
      width: 'medium',
      align: 'left',
      classes: 'bg-[#047857] text-white px-6 py-8 space-y-4',
      avatarStyle: 'rounded',
      sectionTitle: 'text-sm font-semibold text-white/90 mb-2',
      item: 'text-sm text-white/95 leading-relaxed',
      divider: 'spacer',
    },
    sectionHeader: {
      title: 'text-xl font-serif font-semibold text-stone-900',
      underline: false,
      gapClass: 'mt-2',
    },
    bullet: {
      style: 'dash',
      className: 'before:content-["–"] before:text-[#10B981] before:mr-2',
    },
    chip: {
      className: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-emerald-100 text-emerald-800 border border-emerald-200',
    },
    divider: { className: 'border-t border-stone-300 my-4' },
    link: { className: 'text-[#10B981] underline-offset-2 hover:underline' },
  },
  a11y: { minContrast: 4.5 },
  isPublic: true,
};

/**
 * Slate Band - Clean layout with slate vertical band
 * Minimal and sophisticated without sidebar
 */
export const SlateBand: VisualTheme = {
  id: 'slate-band',
  name: 'Slate Band',
  slug: 'slate-band',
  description: 'Minimal design with elegant slate accent band',
  palette: {
    primary: '#334155',
    primaryTextOn: 'dark',
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    accent: '#3B82F6',
  },
  typography: {
    headingFamily: 'system-ui, -apple-system, sans-serif',
    bodyFamily: 'system-ui, -apple-system, sans-serif',
    h1: 'text-2xl font-bold tracking-tight',
    h2: 'text-lg font-semibold',
    h3: 'text-base font-medium',
    body: 'text-sm leading-relaxed',
    small: 'text-xs text-slate-500',
  },
  components: {
    page: 'bg-white text-slate-900 border-l-4 border-[#334155] pl-8',
    sectionHeader: {
      title: 'text-lg font-semibold text-slate-900 uppercase tracking-wide',
      underline: true,
      underlineClass: 'mt-1 h-[1px] w-full bg-slate-300',
      gapClass: 'mt-3',
    },
    bullet: {
      style: 'dot',
      className: 'list-disc marker:text-[#3B82F6]',
    },
    chip: {
      className: 'inline-flex items-center px-2 py-0.5 text-xs border border-slate-200 bg-slate-50 text-slate-700 rounded',
    },
    divider: { className: 'border-t border-slate-200 my-3' },
    link: { className: 'text-[#3B82F6] hover:underline' },
  },
  a11y: { minContrast: 4.5 },
  isPublic: true,
};

/**
 * Taupe Grid - Warm neutral tones with subtle structure
 * Modern and approachable with rounded elements
 */
export const TaupeGrid: VisualTheme = {
  id: 'taupe-grid',
  name: 'Taupe Grid',
  slug: 'taupe-grid',
  description: 'Warm taupe palette with modern rounded elements',
  palette: {
    primary: '#78716C',
    primaryTextOn: 'light',
    surface: '#FAF8F5',
    surfaceAlt: '#F5F1ED',
    text: '#292524',
    textMuted: '#78716C',
    border: '#E7E5E4',
    accent: '#D97706',
  },
  typography: {
    headingFamily: 'system-ui, -apple-system, sans-serif',
    bodyFamily: 'system-ui, -apple-system, sans-serif',
    h1: 'text-2xl font-bold',
    h2: 'text-lg font-semibold',
    h3: 'text-base font-medium',
    body: 'text-sm leading-relaxed',
    small: 'text-xs text-stone-500',
  },
  components: {
    page: 'bg-[#FAF8F5] text-stone-900',
    sectionHeader: {
      title: 'text-lg font-semibold text-stone-900 bg-[#F5F1ED] px-3 py-1.5 rounded-lg inline-block',
      underline: false,
      gapClass: 'mt-3',
    },
    bullet: {
      style: 'square',
      className: 'list-square marker:text-[#D97706]',
    },
    chip: {
      className: 'inline-flex items-center rounded-full px-3 py-1 text-xs bg-stone-200 text-stone-800 border border-stone-300',
    },
    divider: { className: 'border-t border-stone-300 my-4' },
    link: { className: 'text-[#D97706] underline-offset-2 decoration-1 hover:underline' },
  },
  a11y: { minContrast: 4.5 },
  isPublic: true,
};

/**
 * Indigo Accent - Clean white with bold indigo highlights
 * Modern and professional with strong contrast
 */
export const IndigoAccent: VisualTheme = {
  id: 'indigo-accent',
  name: 'Indigo Accent',
  slug: 'indigo-accent',
  description: 'Clean design with bold indigo accents',
  palette: {
    primary: '#4F46E5',
    primaryTextOn: 'dark',
    surface: '#FFFFFF',
    surfaceAlt: '#F9FAFB',
    text: '#111827',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    accent: '#6366F1',
  },
  typography: {
    headingFamily: 'system-ui, -apple-system, sans-serif',
    bodyFamily: 'system-ui, -apple-system, sans-serif',
    h1: 'text-3xl font-extrabold text-[#4F46E5]',
    h2: 'text-xl font-bold text-[#4F46E5]',
    h3: 'text-base font-semibold text-gray-900',
    body: 'text-sm leading-relaxed',
    small: 'text-xs text-gray-500',
  },
  components: {
    page: 'bg-white text-gray-900',
    sectionHeader: {
      title: 'text-xl font-bold text-[#4F46E5]',
      underline: true,
      underlineClass: 'mt-1 h-[2px] w-12 bg-[#6366F1]',
      gapClass: 'mt-3',
    },
    bullet: {
      style: 'disc',
      className: 'list-disc marker:text-[#6366F1]',
    },
    chip: {
      className: 'inline-flex items-center rounded px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200',
    },
    divider: { className: 'border-t border-gray-200 my-4' },
    link: { className: 'text-[#4F46E5] underline decoration-2 underline-offset-2' },
  },
  a11y: { minContrast: 4.5 },
  isPublic: true,
};

/**
 * Gold Split - Elegant gold accents with top banner
 * Sophisticated and luxurious
 */
export const GoldSplit: VisualTheme = {
  id: 'gold-split',
  name: 'Gold Split',
  slug: 'gold-split',
  description: 'Elegant design with gold banner and subtle accents',
  palette: {
    primary: '#92400E',
    primaryTextOn: 'dark',
    surface: '#FFFBEB',
    surfaceAlt: '#FEF3C7',
    text: '#1C1917',
    textMuted: '#78716C',
    border: '#FDE68A',
    accent: '#D97706',
  },
  typography: {
    headingFamily: 'Georgia, Cambria, serif',
    bodyFamily: 'system-ui, -apple-system, sans-serif',
    h1: 'text-2xl font-serif font-bold text-[#92400E]',
    h2: 'text-lg font-serif font-semibold text-[#92400E]',
    h3: 'text-base font-medium',
    body: 'text-sm leading-relaxed',
    small: 'text-xs text-stone-600',
  },
  components: {
    page: 'bg-[#FFFBEB] text-stone-900 border-t-8 border-[#D97706]',
    sectionHeader: {
      title: 'text-lg font-serif font-semibold text-[#92400E]',
      underline: false,
      gapClass: 'mt-2 mb-3',
    },
    bullet: {
      style: 'dash',
      className: 'before:content-["•"] before:text-[#D97706] before:mr-2 before:font-bold',
    },
    chip: {
      className: 'inline-flex items-center rounded px-2.5 py-0.5 text-xs bg-amber-100 text-amber-900 border border-amber-300',
    },
    divider: { className: 'border-t border-amber-200 my-4' },
    link: { className: 'text-[#D97706] underline-offset-2' },
  },
  a11y: { minContrast: 4.5 },
  isPublic: true,
};

/**
 * All theme presets
 */
export const VISUAL_THEME_PRESETS: VisualTheme[] = [
  IndigoAccent, // Default first
  NavySidebar,
  EmeraldSidebar,
  SlateBand,
  TaupeGrid,
  GoldSplit,
];

/**
 * Get theme by ID
 */
export function getVisualThemeById(id: string): VisualTheme | undefined {
  return VISUAL_THEME_PRESETS.find((theme) => theme.id === id);
}

/**
 * Get theme by slug
 */
export function getVisualThemeBySlug(slug: string): VisualTheme | undefined {
  return VISUAL_THEME_PRESETS.find((theme) => theme.slug === slug);
}

/**
 * Default theme
 */
export const DEFAULT_VISUAL_THEME = IndigoAccent;
