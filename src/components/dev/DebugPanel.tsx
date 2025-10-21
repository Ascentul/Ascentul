'use client';

import { useState } from 'react';
import { useDebugToggle } from './useDebugToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Copy, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface DebugPanelProps {
  documentId: string;
  pageCount: number;
  selectedBlockId: string | null;
  templateId?: string;
  themeId?: string;
  lastAIAction?: string | null;
  lastSaveAt?: number;
}

/**
 * Debug Panel - Development-only overlay for inspecting editor state
 *
 * Features:
 * - Toggle with Cmd/Ctrl + Backtick
 * - Displays read-only state values
 * - Click-to-copy for IDs and values
 * - Collapsible interface
 *
 * @example
 * <DebugPanel
 *   documentId={resumeId}
 *   pageCount={pageOrder.length}
 *   selectedBlockId={selectedBlockId}
 *   templateId={templateSlug}
 *   themeId={themeId}
 *   lastAIAction={isGenerating ? 'generating' : null}
 *   lastSaveAt={localUpdatedAt}
 * />
 */
export function DebugPanel({
  documentId,
  pageCount,
  selectedBlockId,
  templateId,
  themeId,
  lastAIAction,
  lastSaveAt,
}: DebugPanelProps) {
  const { isOpen, toggle } = useDebugToggle();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: 'Copied',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  const debugItems = [
    { label: 'Document ID', value: documentId },
    { label: 'Page Count', value: String(pageCount) },
    { label: 'Selected Block', value: selectedBlockId || 'None' },
    { label: 'Template', value: templateId || 'Not set' },
    { label: 'Theme', value: themeId || 'Not set' },
    { label: 'Last AI Action', value: lastAIAction || 'None' },
    { label: 'Last Save', value: formatTimestamp(lastSaveAt) },
  ];

  return (
    <Card
      className="fixed bottom-4 right-4 w-80 shadow-2xl border-2 border-primary z-50 bg-background/95 backdrop-blur"
      style={{ maxHeight: '80vh', overflow: 'auto' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Debug Panel
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Cmd/Ctrl + Backtick to toggle
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={toggle}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-2 pt-0">
          {debugItems.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
                <div className="text-xs font-mono truncate" title={value}>
                  {value}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(value, label)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
