'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  Search,
  Briefcase,
  Target,
  FileText,
  PenLine,
  Users,
  FolderKanban,
  Plus,
  ArrowRight,
  Command,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Type icons mapping
const TYPE_ICONS: Record<string, React.ElementType> = {
  application: Briefcase,
  goal: Target,
  resume: FileText,
  cover_letter: PenLine,
  contact: Users,
  project: FolderKanban,
}

const TYPE_COLORS: Record<string, string> = {
  application: 'bg-blue-100 text-blue-600',
  goal: 'bg-indigo-100 text-indigo-600',
  resume: 'bg-slate-100 text-slate-600',
  cover_letter: 'bg-rose-100 text-rose-600',
  contact: 'bg-amber-100 text-amber-600',
  project: 'bg-teal-100 text-teal-600',
}

const TYPE_LABELS: Record<string, string> = {
  application: 'Application',
  goal: 'Goal',
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  contact: 'Contact',
  project: 'Project',
}

interface SearchResult {
  id: string
  type: 'application' | 'goal' | 'resume' | 'cover_letter' | 'contact' | 'project'
  title: string
  subtitle?: string
  href: string
  matchedField?: string
}

interface QuickAction {
  id: string
  label: string
  href: string
  shortcut: string
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Fetch search results
  const searchResults = useQuery(
    api.search.globalSearch,
    query.length >= 2 ? { query, limit: 10 } : 'skip'
  )

  // Fetch quick actions
  const quickActionsData = useQuery(api.search.getQuickActions)

  const results = searchResults?.results || []
  const quickActions = quickActionsData?.actions || []
  const isSearching = query.length >= 2 && searchResults === undefined

  // Show quick actions when no query, search results when there's a query
  const showQuickActions = query.length < 2
  const items = showQuickActions ? quickActions : results

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (items[selectedIndex]) {
            const item = items[selectedIndex]
            router.push(item.href)
            onClose()
            setQuery('')
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          setQuery('')
          break
      }
    },
    [isOpen, items, selectedIndex, router, onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          onClose()
          setQuery('')
        }}
      />

      {/* Command Palette */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search applications, goals, resumes, contacts..."
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {showQuickActions ? (
              <>
                {/* Quick Actions Section */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-slate-500">Quick Actions</p>
                </div>
                {quickActions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      router.push(action.href)
                      onClose()
                      setQuery('')
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      selectedIndex === index
                        ? 'bg-[#5371FF]/10 text-[#5371FF]'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {action.id.startsWith('new-') ? (
                      <Plus className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    <span className="flex-1 text-sm">{action.label}</span>
                    <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500">
                      <Command className="h-2.5 w-2.5" />
                      {action.shortcut}
                    </kbd>
                  </button>
                ))}
              </>
            ) : results.length > 0 ? (
              <>
                {/* Search Results */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-slate-500">
                    {results.length} result{results.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {results.map((result, index) => {
                  const Icon = TYPE_ICONS[result.type] || FileText
                  const colorClass = TYPE_COLORS[result.type] || 'bg-slate-100 text-slate-600'

                  return (
                    <button
                      key={result.id}
                      onClick={() => {
                        router.push(result.href)
                        onClose()
                        setQuery('')
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        selectedIndex === index
                          ? 'bg-[#5371FF]/10'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          colorClass
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium truncate',
                            selectedIndex === index ? 'text-[#5371FF]' : 'text-slate-900'
                          )}
                        >
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs text-slate-500 truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {TYPE_LABELS[result.type]}
                      </span>
                    </button>
                  )
                })}
              </>
            ) : query.length >= 2 && !isSearching ? (
              <div className="py-8 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No results found</p>
                <p className="mt-1 text-xs text-slate-400">
                  Try a different search term
                </p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-200 bg-slate-100 px-1 font-mono">↑</kbd>
                <kbd className="rounded border border-slate-200 bg-slate-100 px-1 font-mono">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-200 bg-slate-100 px-1 font-mono">↵</kbd>
                to select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-slate-100 px-1 font-mono">esc</kbd>
              to close
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Hook to manage global search state and keyboard shortcut
 */
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }
}
