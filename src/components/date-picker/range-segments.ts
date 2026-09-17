import { isInRange, sameDay } from './date-utils.ts'
import type { DateRange } from './date-utils.ts'

interface RangeRow {
  rowIndex: number
  startColumn: number
  endColumn: number
}

export interface RangeSegment extends RangeRow {
  corners: ReturnType<typeof rangeSegmentCorners>
}

/** Round only the outer corners exposed beyond neighboring visible rows. */
export function rangeSegmentCorners(current: RangeRow, previous?: RangeRow, next?: RangeRow) {
  return {
    topLeft: !previous || current.startColumn < previous.startColumn ? 8 : 0,
    topRight: !previous || current.endColumn > previous.endColumn ? 8 : 0,
    bottomLeft: !next || current.startColumn < next.startColumn ? 8 : 0,
    bottomRight: !next || current.endColumn > next.endColumn ? 8 : 0,
  }
}

/** One inclusive rectangle per touched row of the visible seven-column grid. */
export function rangeSegments(days: readonly Date[], range: DateRange | null): RangeSegment[] {
  if (!range || sameDay(range.start, range.end)) return []

  const rows: RangeRow[] = []
  days.forEach((date, index) => {
    if (!isInRange(date, range)) return
    const rowIndex = Math.floor(index / 7)
    const column = index % 7
    const previous = rows.at(-1)
    if (previous?.rowIndex === rowIndex) previous.endColumn = column
    else rows.push({ rowIndex, startColumn: column, endColumn: column })
  })

  return rows.map((row, index) => ({
    ...row,
    corners: rangeSegmentCorners(row, rows[index - 1], rows[index + 1]),
  }))
}
