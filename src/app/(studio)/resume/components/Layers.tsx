'use client';

import { useState } from 'react';
import type { Block } from '@/lib/resume-types';
import { GripVertical, Lock } from 'lucide-react';

interface LayersProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelect: (blockId: string | null) => void;
  onReorder: (newBlocks: Block[]) => void;
}

export function Layers({
  blocks,
  selectedBlockId,
  onSelect,
  onReorder,
}: LayersProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getBlockLabel = (block: Block): string => {
    switch (block.type) {
      case 'header':
        return 'Header';
      case 'summary':
        return 'Summary';
      case 'experience':
        return 'Experience';
      case 'education':
        return 'Education';
      case 'skills':
        return 'Skills';
      case 'projects':
        return 'Projects';
      case 'custom':
        return 'Custom Section';
      default:
        return 'Unknown';
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    // Reorder blocks locally
    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(dropIndex, 0, removed);

    // Update local state
    onReorder(newBlocks);
    setDraggedIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, block: Block) => {
    // Enter or Space to select
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(block._id);
      return;
    }

    // Arrow keys for reordering (if not locked)
    if (block.locked) return;

    if (e.key === 'ArrowUp' && index > 0 && !blocks[index - 1].locked) {
      e.preventDefault();
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      onReorder(newBlocks);
    } else if (e.key === 'ArrowDown' && index < blocks.length - 1 && !blocks[index + 1].locked) {
      e.preventDefault();
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      onReorder(newBlocks);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium mb-4 text-foreground">Layers</h3>

      {blocks.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-12">
          No blocks yet
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map((block, index) => (
            <div
              key={block._id}
              draggable={!block.locked}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onSelect(block._id)}
              onKeyDown={(e) => handleKeyDown(e, index, block)}
              role="button"
              tabIndex={0}
              aria-selected={selectedBlockId === block._id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                selectedBlockId === block._id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm'
              } ${draggedIndex === index ? 'opacity-50' : ''} ${
                block.locked ? 'cursor-not-allowed opacity-60' : ''
              }`}
            >
              {/* Drag handle */}
              {!block.locked && (
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 transition-colors hover:text-foreground" />
              )}
              {block.locked && (
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-label="Locked block" />
              )}

              {/* Block label */}
              <span className="text-sm font-medium flex-1 truncate">{getBlockLabel(block)}</span>

              {/* Block order */}
              <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{index + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
