'use client';

import { ChevronLeft, ChevronRight, Copy, Plus } from 'lucide-react';

interface PageControlsProps {
  page: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDuplicate: () => void;
  onAddPage: () => void;
}

export function PageControls({
  page,
  total,
  onPrev,
  onNext,
  onDuplicate,
  onAddPage,
}: PageControlsProps) {
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-40">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 shadow-lg border px-3 py-2">
        {/* Previous Page */}
        <button
          onClick={onPrev}
          disabled={page <= 1}
          aria-label="Previous page"
          title="Previous page"
          className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Indicator */}
        <div className="px-2 text-sm font-medium text-gray-700 min-w-[80px] text-center">
          Page {page} of {total}
        </div>

        {/* Next Page */}
        <button
          onClick={onNext}
          disabled={page >= total}
          aria-label="Next page"
          title="Next page"
          className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300" />

        {/* Duplicate Page */}
        <button
          onClick={onDuplicate}
          aria-label="Duplicate current page"
          title="Duplicate current page"
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Add Page */}
        <button
          onClick={onAddPage}
          aria-label="Add new page"
          title="Add new page"
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
