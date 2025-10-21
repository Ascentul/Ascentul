'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface HiddenBlockBadgeProps {
  onShow?: () => void;
  className?: string;
}

/**
 * Visual indicator for hidden blocks in the canvas.
 * Shows a ghost-styled badge with a Show control.
 *
 * Phase 4 Implementation Note:
 * This component provides the UI for the visibility feature.
 * To fully integrate:
 * 1. Add `isHidden?: boolean` to EditorBlockNode props
 * 2. Wire onShow to call `actions.updateBlockProps(blockId, { isHidden: false })`
 * 3. Apply ghost styling (opacity-50, dashed border) to parent block wrapper
 *
 * @example
 * {block.isHidden && (
 *   <HiddenBlockBadge onShow={() => actions.updateBlockProps(block.id, { isHidden: false })} />
 * )}
 */
export function HiddenBlockBadge({ onShow, className }: HiddenBlockBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className || ''}`}>
      <Badge variant="outline" className="opacity-50 border-dashed">
        Hidden
      </Badge>
      {onShow && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onShow}
          className="h-6 px-2 text-xs"
          title="Show block"
        >
          <Eye className="w-3 h-3 mr-1" />
          Show
        </Button>
      )}
    </div>
  );
}
