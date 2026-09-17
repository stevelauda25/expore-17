export type DateRange = { start: Date; end: Date }

export type PresetId =
  | 'today'
  | 'yesterday'
  | 'last-3'
  | 'last-7'
  | 'last-14'
  | 'last-30'
  | 'last-90'

export const PRESETS: readonly { id: PresetId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last-3', label: 'Last 3 days' },
  { id: 'last-7', label: 'Last 7 days' },
  { id: 'last-14', label: 'Last 14 days' },
  { id: 'last-30', label: 'Last 30 days' },
  { id: 'last-90', label: 'Last 90 days' },
]

const presetLengths: Record<PresetId, number> = {
  today: 1,
  yesterday: 1,
  'last-3': 3,
  'last-7': 7,
  'last-14': 14,
  'last-30': 30,
  'last-90': 90,
}

function atLocalNoon(date: Date): Date {
  const result = new Date(date)
  result.setHours(12, 0, 0, 0)
  return result
}

export function todayLocal(): Date {
  return atLocalNoon(new Date())
}

export function dateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function sameDay(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate()
}

export function addDays(date: Date, amount: number): Date {
  const result = atLocalNoon(date)
  // Calendar arithmetic keeps noon stable across 23- and 25-hour days.
  result.setDate(result.getDate() + amount)
  return result
}

export function startOfMonth(date: Date): Date {
  const result = atLocalNoon(date)
  result.setDate(1)
  return result
}

/** Returns day 1 of the target display month, avoiding end-of-month overflow. */
export function shiftMonth(date: Date, amount: number): Date {
  const result = startOfMonth(date)
  result.setMonth(result.getMonth() + amount)
  return result
}

export function calendarDays(month: Date): Date[] {
  const firstDay = startOfMonth(month)
  const gridStart = addDays(firstDay, -firstDay.getDay())
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

export function orderedRange(first: Date, second: Date): DateRange {
  const firstDay = atLocalNoon(first)
  const secondDay = atLocalNoon(second)
  return firstDay <= secondDay
    ? { start: firstDay, end: secondDay }
    : { start: secondDay, end: firstDay }
}

export function isInRange(date: Date, range: DateRange): boolean {
  const day = atLocalNoon(date)
  const { start, end } = orderedRange(range.start, range.end)
  return day >= start && day <= end
}

/** Relative presets include today; Yesterday is the preceding calendar day. */
export function presetRange(id: PresetId, today: Date): DateRange {
  const end = addDays(today, id === 'yesterday' ? -1 : 0)
  return { start: addDays(end, 1 - presetLengths[id]), end }
}
