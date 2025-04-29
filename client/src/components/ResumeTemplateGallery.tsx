import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ResumeTemplateStyle } from './ResumeTemplates';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Layout, Layers, Sparkles } from 'lucide-react';

// Define template categories for filtering
export type TemplateCategory = 'modern' | 'traditional' | 'simple' | 'creative';

// Map our existing template styles to categories
const templateCategoryMap: Record<TemplateCategory, ResumeTemplateStyle[]> = {
  modern: ['modern'],
  traditional: ['classic', 'professional'],
  simple: ['minimal'],
  creative: ['modern'], // In the future, we can add more creative templates
};

// Template gallery item that shows a thumbnail preview of a template
interface TemplateGalleryItemProps {
  style: ResumeTemplateStyle;
  name: string;
  selected: boolean;
  onClick: () => void;
}

function TemplateGalleryItem({ style, name, selected, onClick }: TemplateGalleryItemProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 cursor-pointer transition-all duration-200 group",
        "hover:scale-[1.01]"
      )}
      onClick={onClick}
    >
      {/* Template thumbnail with class matching style */}
      <div 
        className={cn(
          "w-full aspect-[3/4] border rounded-md overflow-hidden relative",
          selected && "ring-2 ring-primary",
          "hover:shadow-md transition-shadow"
        )}
      >
        <div 
          className={cn(
            "w-full h-full p-2 flex flex-col",
            style === 'modern' && "border-t-4 border-t-primary",
            style === 'professional' && "border-l-4 border-l-primary",
            style === 'classic' && "border-2 border-neutral-200",
            style === 'minimal' && "bg-white"
          )}
        >
          {/* Simplified preview content */}
          <div className={cn(
            "w-full flex flex-col items-center justify-center p-1",
            style === 'modern' && "text-center",
            style === 'classic' && "border-b border-neutral-700",
            style === 'professional' && "border-b border-neutral-300",
            style === 'minimal' && ""
          )}>
            <div className="w-1/2 h-2 bg-neutral-800 rounded mb-1"></div>
            <div className="w-full flex items-center justify-center gap-1 mt-1">
              <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
              <div className="w-10 h-1 bg-neutral-400 rounded"></div>
              <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
              <div className="w-10 h-1 bg-neutral-400 rounded"></div>
            </div>
          </div>
          <div className="w-full p-1">
            <div className={cn(
              "w-20 h-2 bg-neutral-800 rounded mb-2",
              style === 'modern' && "bg-primary",
              style === 'professional' && "border-b border-neutral-200"
            )}></div>
            <div className="flex flex-wrap gap-1 mb-2">
              <div className="w-8 h-1.5 bg-neutral-200 rounded-full"></div>
              <div className="w-8 h-1.5 bg-neutral-200 rounded-full"></div>
              <div className="w-8 h-1.5 bg-neutral-200 rounded-full"></div>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded mb-1"></div>
            <div className="w-full h-1.5 bg-neutral-200 rounded mb-1"></div>
            <div className="w-3/4 h-1.5 bg-neutral-200 rounded"></div>
          </div>
          <div className="w-full p-1 mt-1">
            <div className={cn(
              "w-20 h-2 bg-neutral-800 rounded mb-2",
              style === 'modern' && "bg-primary",
              style === 'professional' && "border-b border-neutral-200"
            )}></div>
            <div className="flex justify-between items-center mb-1">
              <div className="w-20 h-1.5 bg-neutral-200 rounded"></div>
              <div className="w-12 h-1.5 bg-neutral-200 rounded"></div>
            </div>
            <div className="w-16 h-1.5 bg-neutral-300 rounded mb-1"></div>
            <div className="w-full h-1.5 bg-neutral-200 rounded mb-1"></div>
            <div className="w-full h-1.5 bg-neutral-200 rounded mb-1"></div>
          </div>
          
          {/* Selected checkmark overlay */}
          {selected && (
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className={cn(
        "text-sm text-center font-medium",
        selected ? "text-primary" : "text-neutral-700"
      )}>
        {name}
      </p>
    </div>
  );
}

// Category filter for templates
interface CategoryFilterProps {
  category: TemplateCategory;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function CategoryFilter({ category, label, icon, active, onClick }: CategoryFilterProps) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      className={cn(
        "h-auto py-2 px-3 flex gap-2 items-center",
        active && "bg-primary text-primary-foreground",
        !active && "hover:bg-primary/10 hover:text-primary"
      )}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

interface ResumeTemplateGalleryProps {
  selectedTemplate: ResumeTemplateStyle;
  onSelectTemplate: (template: ResumeTemplateStyle) => void;
}

export default function ResumeTemplateGallery({ 
  selectedTemplate,
  onSelectTemplate
}: ResumeTemplateGalleryProps) {
  // State for filter category
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  
  // Filter templates based on selected category
  const filteredTemplates: ResumeTemplateStyle[] = 
    activeCategory === 'all' 
      ? ['modern', 'classic', 'minimal', 'professional'] 
      : templateCategoryMap[activeCategory as TemplateCategory];

  // Template category icons
  const categoryIcons = {
    modern: <Layout size={18} />,
    traditional: <Briefcase size={18} />,
    simple: <Layers size={18} />,
    creative: <Sparkles size={18} />,
  };
  
  // Category filters
  const categories: {id: TemplateCategory | 'all', label: string, icon: React.ReactNode}[] = [
    { id: 'all', label: 'All Templates', icon: <Layers size={18} /> },
    { id: 'modern', label: 'Modern', icon: categoryIcons.modern },
    { id: 'traditional', label: 'Traditional', icon: categoryIcons.traditional },
    { id: 'simple', label: 'Simple', icon: categoryIcons.simple },
    { id: 'creative', label: 'Creative', icon: categoryIcons.creative },
  ];

  // Template name mapping
  const templateNames: Record<ResumeTemplateStyle, string> = {
    modern: 'Modern',
    classic: 'Classic',
    minimal: 'Minimal',
    professional: 'Professional',
  };

  return (
    <div className="space-y-6">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <CategoryFilter
            key={category.id}
            category={category.id as TemplateCategory}
            label={category.label}
            icon={category.icon}
            active={activeCategory === category.id}
            onClick={() => setActiveCategory(category.id)}
          />
        ))}
      </div>
      
      {/* Template gallery */}
      <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredTemplates.map((template) => (
            <motion.div
              key={template}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <TemplateGalleryItem
                style={template}
                name={templateNames[template]}
                selected={selectedTemplate === template}
                onClick={() => onSelectTemplate(template)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}