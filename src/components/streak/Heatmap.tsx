'use client'

import { useMemo, useState, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HeatmapDay } from 'convex/activity'

type Props = {
  data: HeatmapDay[]
  startOnMonday?: boolean
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MS_PER_DAY = 24 * 60 * 60 * 1000
const CELL_WIDTH_CLASS = 'w-3.5'
const CELL_HEIGHT_CLASS = 'h-3.5'
const CELL_CLASS = `${CELL_WIDTH_CLASS} ${CELL_HEIGHT_CLASS}`
const CELL_GAP_CLASS = 'gap-1'

// Map action count to intensity level (0-4)
function getIntensityLevel(actionCount: number, didLogin: boolean, didAction: boolean): number {
  if (!didLogin && !didAction) return 0 // No activity
  if (actionCount <= 1) return 1
  if (actionCount <= 3) return 2
  if (actionCount <= 6) return 3
  return 4
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00Z')
  const day = DAYS[date.getUTCDay()]
  const month = MONTHS[date.getUTCMonth()]
  const dayNum = date.getUTCDate()
  return `${day} ${month} ${dayNum}`
}

export function Heatmap({ data, startOnMonday = true }: Props) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [focusedCell, setFocusedCell] = useState<number>(-1)

  // Organize data by ISO date for O(1) lookup
  const dataByDate = useMemo(() => {
    const map = new Map<string, HeatmapDay>()
    data.forEach((day) => map.set(day.date, day))
    return map
  }, [data])

  const dayLabelStrings = useMemo(
    () => (startOnMonday ? ['Mon', '', 'Wed', '', 'Fri', '', ''] : ['Sun', '', 'Tue', '', 'Thu', '', 'Sat']),
    [startOnMonday]
  )
  const primaryDayLabel = dayLabelStrings.find((label) => label) ?? ''

  const handleCellClick = useCallback((day: HeatmapDay) => {
    if (window.analytics) {
      window.analytics.track('streak_cell_click', {
        date: day.date,
        actionCount: day.actionCount,
        didAction: day.didAction,
        didLogin: day.didLogin,
      })
    }
  }, [])

  const handleCellHover = useCallback(
    (day: HeatmapDay) => {
      if (hoveredCell !== day.date) {
        setHoveredCell(day.date)
        if (window.analytics) {
          window.analytics.track('streak_cell_hover', {
            date: day.date,
            actionCount: day.actionCount,
          })
        }
      }
    },
    [hoveredCell]
  )

  // Compute today's date once for consistent use throughout the component
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], [])

  const { weeks, monthLabels, stats, flattenedDays } = useMemo(() => {
    if (data.length === 0) {
      return {
        weeks: [] as { days: (HeatmapDay | null)[] }[],
        monthLabels: [] as Array<{ month: string; weekIndex: number }>,
        stats: { currentStreak: 0, longestStreak: 0, totalDays: 0 },
        flattenedDays: [] as (HeatmapDay | null)[]
      }
    }

    const firstDayOfWeek = startOnMonday ? 1 : 0
    const sortedAsc = [...data].sort((a, b) => a.date.localeCompare(b.date))
    const sortedDesc = [...sortedAsc].reverse()

    const lastDate = new Date(sortedAsc[sortedAsc.length - 1].date + 'T00:00:00Z')
    const targetYear = lastDate.getUTCFullYear()
    const startOfYear = new Date(Date.UTC(targetYear, 0, 1))
    const endOfYear = new Date(Date.UTC(targetYear, 11, 31))
    const startOfYearIso = `${targetYear}-01-01`
    const endOfYearIso = `${targetYear}-12-31`

    const startOfGrid = new Date(startOfYear)
    while ((startOfGrid.getUTCDay() + 7 - firstDayOfWeek) % 7 !== 0) {
      startOfGrid.setUTCDate(startOfGrid.getUTCDate() - 1)
    }

    const endOfGrid = new Date(endOfYear)
    while ((endOfGrid.getUTCDay() + 7 - firstDayOfWeek) % 7 !== 6) {
      endOfGrid.setUTCDate(endOfGrid.getUTCDate() + 1)
    }

    const totalDays = Math.floor((endOfGrid.getTime() - startOfGrid.getTime()) / MS_PER_DAY) + 1
    const weeks: { days: (HeatmapDay | null)[] }[] = []

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const currentDate = new Date(startOfGrid.getTime() + dayIndex * MS_PER_DAY)
      const weekIndex = Math.floor(dayIndex / 7)
      if (!weeks[weekIndex]) {
        weeks[weekIndex] = { days: new Array<HeatmapDay | null>(7).fill(null) }
      }

      const dayOfWeek = (currentDate.getUTCDay() + 7 - firstDayOfWeek) % 7
      const iso = currentDate.toISOString().split('T')[0]

      if (iso >= startOfYearIso && iso <= endOfYearIso) {
        const entry =
          dataByDate.get(iso) ??
          ({
            date: iso,
            actionCount: 0,
            didAction: false,
            didLogin: false
          } as HeatmapDay)

        weeks[weekIndex].days[dayOfWeek] = entry
      } else {
        weeks[weekIndex].days[dayOfWeek] = null
      }
    }

    const monthLabels = MONTHS.map((month, monthIndex) => {
      const monthStart = new Date(Date.UTC(targetYear, monthIndex, 1))
      const diffDays = Math.floor((monthStart.getTime() - startOfGrid.getTime()) / MS_PER_DAY)
      const weekIndex = Math.floor(diffDays / 7)
      return { month, weekIndex }
    }).filter((label) => label.weekIndex >= 0 && label.weekIndex < weeks.length)

    const todayDate = new Date(todayIso + 'T00:00:00Z')
    const yesterdayIso = new Date(todayDate.getTime() - MS_PER_DAY).toISOString().split('T')[0]

    let currentStreak = 0
    const recentDay = sortedDesc[0]
    const hasRecentActivity =
      recentDay?.didAction && (recentDay.date === todayIso || recentDay.date === yesterdayIso)

    if (hasRecentActivity) {
      for (let i = 0; i < sortedDesc.length; i++) {
        const day = sortedDesc[i]
        if (!day.didAction) break
        currentStreak++

        if (i < sortedDesc.length - 1) {
          const currDate = new Date(day.date + 'T00:00:00Z')
          const nextDate = new Date(sortedDesc[i + 1].date + 'T00:00:00Z')
          const dayDiff = (currDate.getTime() - nextDate.getTime()) / MS_PER_DAY
          if (dayDiff > 1) break
        }
      }
    }

    let longestStreak = 0
    let tempStreak = 0
    for (let i = 0; i < sortedAsc.length; i++) {
      const day = sortedAsc[i]
      if (day.didAction) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)

        if (i < sortedAsc.length - 1) {
          const currDate = new Date(day.date + 'T00:00:00Z')
          const nextDate = new Date(sortedAsc[i + 1].date + 'T00:00:00Z')
          const dayDiff = (nextDate.getTime() - currDate.getTime()) / MS_PER_DAY
          if (dayDiff > 1) tempStreak = 0
        }
      } else {
        tempStreak = 0
      }
    }

    const totalActionDays = data.filter((d) => d.didAction).length
    const flattenedDays = weeks.flatMap((week) => week.days)

    return {
      weeks,
      monthLabels,
      stats: { currentStreak, longestStreak, totalDays: totalActionDays },
      flattenedDays
    }
  }, [data, dataByDate, startOnMonday, todayIso])

  const monthLabelLookup = useMemo(() => {
    const map = new Map<number, string>()
    monthLabels.forEach(({ month, weekIndex }) => {
      map.set(weekIndex, month)
    })
    return map
  }, [monthLabels])

  const firstFocusable = useMemo(() => flattenedDays.findIndex((day) => day !== null), [flattenedDays])
  const firstInteractiveIndex = firstFocusable === -1 ? 0 : firstFocusable

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, cellIndex: number) => {
      const totalCells = flattenedDays.length
      if (totalCells === 0) {
        return
      }

      const findValid = (start: number, direction: 1 | -1) => {
        let idx = Math.max(0, Math.min(start, totalCells - 1))
        while (idx >= 0 && idx < totalCells && !flattenedDays[idx]) {
          idx += direction
        }
        if (idx < 0 || idx >= totalCells || !flattenedDays[idx]) {
          return -1
        }
        return idx
      }

      const ensureFocus = (candidate: number, direction: 1 | -1) => {
        const next = findValid(candidate, direction)
        return next === -1 ? cellIndex : next
      }

      let newFocus = cellIndex

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          newFocus = ensureFocus(cellIndex + 7, 1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          newFocus = ensureFocus(cellIndex - 7, -1)
          break
        case 'ArrowDown':
          e.preventDefault()
          newFocus = ensureFocus(cellIndex + 1, 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          newFocus = ensureFocus(cellIndex - 1, -1)
          break
        case 'Home': {
          e.preventDefault()
          const first = findValid(0, 1)
          if (first !== -1) {
            newFocus = first
          }
          break
        }
        case 'End': {
          e.preventDefault()
          const last = findValid(totalCells - 1, -1)
          if (last !== -1) {
            newFocus = last
          }
          break
        }
        default:
          return
      }

      setFocusedCell(newFocus)
      const cell = document.querySelector(`[data-cell-index="${newFocus}"]`) as HTMLButtonElement
      cell?.focus()
    },
    [flattenedDays]
  )

  // Empty state
  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <div className={`${CELL_WIDTH_CLASS} ${CELL_HEIGHT_CLASS}`} />
          <div className={`flex ${CELL_GAP_CLASS}`}>
            {Array.from({ length: 52 }).map((_, i) => (
              <div key={i} className={`flex flex-col ${CELL_GAP_CLASS}`}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className={`${CELL_CLASS} rounded-md bg-neutral-100 border border-neutral-200`} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-neutral-500 text-center py-4">
          No activity yet. Complete an action to start your streak.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="flex gap-6 text-base -mt-1 mb-1">
        <div>
          <span className="text-neutral-500">Current streak: </span>
          <span className="font-semibold text-neutral-900">{stats.currentStreak} days</span>
        </div>
        <div>
          <span className="text-neutral-500">Longest streak: </span>
          <span className="font-semibold text-neutral-900">{stats.longestStreak} days</span>
        </div>
        <div>
          <span className="text-neutral-500">Total: </span>
          <span className="font-semibold text-neutral-900">{stats.totalDays} days</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="grid grid-cols-[auto_1fr] gap-1.5 -mb-0.5">
        <div className="flex items-end pr-3 text-sm text-transparent select-none">
          <span>{primaryDayLabel}</span>
        </div>
        <div className={`flex ${CELL_GAP_CLASS} items-end`}>
          {weeks.map((_, weekIdx) => (
            <div key={weekIdx} className={`flex justify-center ${CELL_WIDTH_CLASS}`}>
              {monthLabelLookup.get(weekIdx) ? (
                <span className="text-sm leading-none text-neutral-400">
                  {monthLabelLookup.get(weekIdx)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap grid with day labels */}
      <TooltipProvider delayDuration={0}>
        <div className="grid grid-cols-[auto_1fr] gap-1.5">
          {/* Day labels */}
        <div className="flex flex-col gap-1 pr-3 text-sm text-neutral-400">
          {dayLabelStrings.map((day, idx) => (
            <div key={idx} className={`${CELL_HEIGHT_CLASS} flex items-center justify-end`}>
              {day}
            </div>
          ))}
        </div>

        {/* Activity cells */}
        <div className={`flex ${CELL_GAP_CLASS}`} role="grid" aria-label="Activity heatmap">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className={`flex flex-col ${CELL_GAP_CLASS}`}>
              {week.days.map((day, dayIdx) => {
                const cellIndex = weekIdx * 7 + dayIdx

                if (!day) {
                  return <div key={dayIdx} className={CELL_CLASS} />
                }

                  const level = getIntensityLevel(day.actionCount, day.didLogin, day.didAction)
                  const isToday = day.date === todayIso
                  const hasLoginOnly = day.didLogin && !day.didAction

                  const tooltipText = `${formatDate(day.date)} • ${day.actionCount} action${
                    day.actionCount !== 1 ? 's' : ''
                  }${day.didLogin ? ' • login ✓' : ''}`

                  return (
                    <Tooltip key={dayIdx}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          role="gridcell"
                          data-cell-index={cellIndex}
                          data-lvl={level}
                          tabIndex={
                            cellIndex === focusedCell ||
                            (focusedCell === -1 && cellIndex === firstInteractiveIndex)
                              ? 0
                              : -1
                          }
                          aria-label={tooltipText}
                          aria-pressed={day.didAction}
                          onClick={() => handleCellClick(day)}
                          onMouseEnter={() => handleCellHover(day)}
                          onKeyDown={(e) => handleKeyDown(e, cellIndex)}
                          className={`
                            ${CELL_CLASS} rounded-md transition-all
                            ${level === 0 ? 'bg-neutral-100 border border-neutral-200' : ''}
                            ${level === 1 ? 'bg-indigo-100' : ''}
                            ${level === 2 ? 'bg-indigo-200' : ''}
                            ${level === 3 ? 'bg-indigo-300' : ''}
                            ${level === 4 ? 'bg-indigo-500' : ''}
                            ${hasLoginOnly ? 'ring-1 ring-neutral-400' : ''}
                            ${isToday ? 'ring-1 ring-indigo-400 ring-opacity-50' : ''}
                            hover:ring-2 hover:ring-indigo-400 hover:ring-opacity-70
                            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-70
                          `}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p>{tooltipText}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex items-center gap-3 text-sm text-neutral-400 pt-3">
        <span>Less</span>
        <div className={`flex ${CELL_GAP_CLASS}`}>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              data-lvl={level}
              className={`
                ${CELL_CLASS} rounded-md
                ${level === 0 ? 'bg-neutral-100 border border-neutral-200' : ''}
                ${level === 1 ? 'bg-indigo-100' : ''}
                ${level === 2 ? 'bg-indigo-200' : ''}
                ${level === 3 ? 'bg-indigo-300' : ''}
                ${level === 4 ? 'bg-indigo-500' : ''}
              `}
              title={
                level === 0
                  ? 'No activity'
                  : level === 1
                    ? '1 action'
                    : level === 2
                      ? '2-3 actions'
                      : level === 3
                        ? '4-6 actions'
                        : '7+ actions'
              }
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
