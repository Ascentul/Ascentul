'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TemplatePicker } from './TemplatePicker';
import { ThemePanel } from './ThemePanel';
import type { Id } from '../../../../convex/_generated/dataModel';
import {
  FileText,
  Palette,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';

interface LeftSidebarProps {
  resume: any;
  blocks: any[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onBlocksReorder: (blocks: any[]) => void;
}

export function LeftSidebar({
  resume,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onBlocksReorder,
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState('layers');

  const handleToggleVisibility = (blockId: string) => {
    // Implementation would update block visibility
    console.log('Toggle visibility:', blockId);
  };

  const handleToggleLock = (blockId: string) => {
    // Implementation would update block lock status
    console.log('Toggle lock:', blockId);
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 m-2">
          <TabsTrigger value="template" className="gap-1">
            <FileText className="w-3 h-3" />
            <span className="hidden lg:inline">Template</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-1">
            <Palette className="w-3 h-3" />
            <span className="hidden lg:inline">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="layers" className="gap-1">
            <Layers className="w-3 h-3" />
            <span className="hidden lg:inline">Layers</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <TemplatePicker
              currentTemplate={resume.templateSlug}
              onTemplateChange={(slug) => console.log('Change template:', slug)}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="theme" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <ThemePanel
              currentThemeId={resume.themeId}
              onThemeChange={(themeId) => console.log('Change theme:', themeId)}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="layers" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-sm mb-3">Resume Blocks</h3>
              {blocks.map((block, index) => (
                <Card
                  key={block._id}
                  className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                    selectedBlockId === block._id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => onSelectBlock(block._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      <span className="text-sm font-medium capitalize">
                        {block.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(block._id);
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {block.visible !== false ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLock(block._id);
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {block.locked ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <Unlock className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
