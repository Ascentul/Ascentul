'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';

interface RightInspectorProps {
  block: any | null;
  onBlockUpdate: (updates: any) => void;
}

export function RightInspector({ block, onBlockUpdate }: RightInspectorProps) {
  if (!block) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a block to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Block Info */}
        <div>
          <h3 className="font-semibold text-lg mb-1 capitalize">{block.type} Block</h3>
          <p className="text-xs text-muted-foreground">
            Edit block properties and styling
          </p>
        </div>

        <Separator />

        {/* Content Fields */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Content</h4>
          <p className="text-xs text-muted-foreground">
            Edit content directly in the canvas for better control
          </p>
        </div>

        <Separator />

        {/* Styling */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Styling</h4>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-xs">Font Size</Label>
            <Select defaultValue="normal">
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spacing */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Spacing</Label>
              <span className="text-xs text-muted-foreground">Normal</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
          </div>

          {/* Text Alignment */}
          <div className="space-y-2">
            <Label className="text-xs">Alignment</Label>
            <Select defaultValue="left">
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="justify">Justify</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Advanced */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Advanced</h4>

          {/* Margins */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Top Margin</Label>
              <Input type="number" defaultValue="0" className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bottom Margin</Label>
              <Input type="number" defaultValue="0" className="h-8" />
            </div>
          </div>

          {/* Lock */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Lock Block</Label>
            <input
              type="checkbox"
              checked={block.locked || false}
              onChange={(e) => onBlockUpdate({ locked: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
