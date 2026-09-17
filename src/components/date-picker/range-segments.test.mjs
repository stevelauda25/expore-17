import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays, calendarDays, dateKey, presetRange } from './date-utils.ts'
import { rangeSegmentCorners, rangeSegments } from './range-segments.ts'

// Node 24: node --test src/components/date-picker/range-segments.test.mjs
const local = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour)
const corners = (topLeft, topRight, bottomLeft, bottomRight) => ({ topLeft, topRight, bottomLeft, bottomRight })
// Expected corner arrays consistently use TL, TR, BL, BR order.
const segment = (rowIndex, startColumn, endColumn, expectedCorners) => ({
  rowIndex, startColumn, endColumn, corners: corners(...expectedCorners),
})
const september = Object.freeze(calendarDays(local(2026, 9, 1)))

function coveredIndices(segments) {
  return segments.flatMap(({ rowIndex, startColumn, endColumn }) =>
    Array.from({ length: endColumn - startColumn + 1 }, (_, offset) => rowIndex * 7 + startColumn + offset),
  )
}

function assertSegmentStructure(segments, context) {
  assert.equal(new Set(segments.map(item => item.rowIndex)).size, segments.length, `${context}: one segment per row`)
  segments.forEach((item, index) => {
    assert.ok(Number.isInteger(item.rowIndex) && item.rowIndex >= 0 && item.rowIndex < 6, `${context}: grid row`)
    assert.ok(Number.isInteger(item.startColumn) && item.startColumn >= 0, `${context}: start column`)
    assert.ok(Number.isInteger(item.endColumn) && item.endColumn <= 6, `${context}: end column`)
    assert.ok(item.startColumn <= item.endColumn, `${context}: nonempty segment`)
    const previous = segments[index - 1]
    const next = segments[index + 1]
    const expectedCorners = corners(
      !previous || item.startColumn < previous.startColumn ? 8 : 0,
      !previous || item.endColumn > previous.endColumn ? 8 : 0,
      !next || item.startColumn < next.startColumn ? 8 : 0,
      !next || item.endColumn > next.endColumn ? 8 : 0,
    )
    assert.deepEqual(item.corners, expectedCorners, `${context}: each corner follows its neighboring edge`)
    assert.equal(Object.hasOwn(item, 'role'), false, `${context}: no position-only role remains`)
    if (index) {
      assert.equal(item.rowIndex, segments[index - 1].rowIndex + 1, `${context}: ordered consecutive rows`)
      assert.equal(item.startColumn, 0, `${context}: subsequent rows start Sunday`)
      assert.equal(segments[index - 1].endColumn, 6, `${context}: preceding rows end Saturday`)
    }
  })
}

test('every pair of 42 visible dates, including reverse order, produces exact endpoint-inclusive coverage', () => {
  const timestamps = september.map(day => day.getTime())
  assert.equal(september.length, 42)
  assert.equal(september[0].getDay(), 0)
  assert.equal(september.at(-1).getDay(), 6)

  for (let first = 0; first < 42; first++) {
    for (let second = 0; second < 42; second++) {
      const context = `cell ${first} to cell ${second}`
      const segments = rangeSegments(september, { start: september[first], end: september[second] })
      if (first === second) {
        assert.deepEqual(segments, [], `${context}: same-day selection has no range background`)
        continue
      }
      const start = Math.min(first, second)
      const end = Math.max(first, second)
      const expectedIndices = Array.from({ length: end - start + 1 }, (_, offset) => start + offset)
      assert.deepEqual(coveredIndices(segments), expectedIndices, `${context}: no missing, extra, or duplicated cells`)
      assert.equal(segments.length, Math.floor(end / 7) - Math.floor(start / 7) + 1, `${context}: touched row count`)
      assertSegmentStructure(segments, context)
    }
  }

  assert.deepEqual(september.map(day => day.getTime()), timestamps, 'input dates remain unchanged')
})

test('isolated segments round all corners while aligned neighboring edges remain flush', () => {
  const current = Object.freeze({ rowIndex: 1, startColumn: 2, endColumn: 4 })
  const previous = Object.freeze({ rowIndex: 0, startColumn: 2, endColumn: 4 })
  const next = Object.freeze({ rowIndex: 2, startColumn: 2, endColumn: 4 })
  assert.deepEqual(rangeSegmentCorners(current), corners(8, 8, 8, 8))
  assert.deepEqual(rangeSegmentCorners(current, previous, next), corners(0, 0, 0, 0))
  assert.deepEqual(rangeSegmentCorners(current, undefined, next), corners(8, 8, 0, 0))
  assert.deepEqual(rangeSegmentCorners(current, previous), corners(0, 0, 8, 8))
})

test('left, right, and both-side expansion round only the exposed neighboring corners', () => {
  const previous = Object.freeze({ rowIndex: 0, startColumn: 2, endColumn: 4 })
  const next = Object.freeze({ rowIndex: 2, startColumn: 2, endColumn: 4 })
  for (const [startColumn, endColumn, expected] of [
    [1, 4, corners(8, 0, 8, 0)],
    [2, 5, corners(0, 8, 0, 8)],
    [1, 5, corners(8, 8, 8, 8)],
    [3, 3, corners(0, 0, 0, 0)],
  ]) {
    const current = Object.freeze({ rowIndex: 1, startColumn, endColumn })
    assert.deepEqual(rangeSegmentCorners(current, previous, next), expected)
  }
  const current = { rowIndex: 1, startColumn: 1, endColumn: 5 }
  assert.deepEqual(rangeSegmentCorners(current, previous, { rowIndex: 2, startColumn: 0, endColumn: 6 }), corners(8, 8, 0, 0))
  assert.deepEqual(rangeSegmentCorners(current, { rowIndex: 0, startColumn: 0, endColumn: 6 }, next), corners(0, 0, 8, 8))
})

test('the requested three-row 5–7, 1–7, 1–6 shape rounds both step transitions', () => {
  const rows = [
    { rowIndex: 0, startColumn: 4, endColumn: 6 },
    { rowIndex: 1, startColumn: 0, endColumn: 6 },
    { rowIndex: 2, startColumn: 0, endColumn: 5 },
  ]
  const expected = [corners(8, 8, 0, 0), corners(8, 0, 0, 8), corners(0, 0, 8, 8)]
  assert.deepEqual(rows.map((row, index) => rangeSegmentCorners(row, rows[index - 1], rows[index + 1])), expected)
  assert.deepEqual(rangeSegments(september, { start: september[4], end: september[19] }), [
    segment(0, 4, 6, [8, 8, 0, 0]),
    segment(1, 0, 6, [8, 0, 0, 8]),
    segment(2, 0, 5, [0, 0, 8, 8]),
  ])
})

test('null, same local calendar day, and wholly off-grid selections have no segments', () => {
  assert.deepEqual(rangeSegments(september, null), [])
  assert.deepEqual(rangeSegments(september, {
    start: local(2026, 9, 17, 0),
    end: local(2026, 9, 17, 23),
  }), [])
  assert.deepEqual(rangeSegments(september, {
    start: local(2026, 9, 17, 23),
    end: local(2026, 9, 17, 0),
  }), [])
  const before = { start: addDays(september[0], -8), end: addDays(september[0], -1) }
  const after = { start: addDays(september.at(-1), 1), end: addDays(september.at(-1), 8) }
  for (const range of [before, after]) {
    assert.deepEqual(rangeSegments(september, range), [])
    assert.deepEqual(rangeSegments(september, { start: range.end, end: range.start }), [])
  }
})

test('partial rows retain actual endpoints, including Saturday-only and Sunday-only segments', () => {
  for (const [start, end, expected] of [
    [6, 7, [segment(0, 6, 6, [8, 8, 0, 8]), segment(1, 0, 0, [8, 0, 8, 8])]],
    [5, 8, [segment(0, 5, 6, [8, 8, 0, 8]), segment(1, 0, 1, [8, 0, 8, 8])]],
    [6, 21, [segment(0, 6, 6, [8, 8, 0, 0]), segment(1, 0, 6, [8, 0, 0, 0]), segment(2, 0, 6, [0, 0, 0, 8]), segment(3, 0, 0, [0, 0, 8, 8])]],
    [7, 13, [segment(1, 0, 6, [8, 8, 8, 8])]],
    [24, 26, [segment(3, 3, 5, [8, 8, 8, 8])]],
  ]) {
    assert.deepEqual(rangeSegments(september, { start: september[start], end: september[end] }), expected)
    assert.deepEqual(rangeSegments(september, { start: september[end], end: september[start] }), expected)
  }
})

test('clipping compares visible neighboring edges, even when both true endpoints are off-grid', () => {
  const before = addDays(september[0], -10)
  const after = addDays(september.at(-1), 10)
  const cases = [
    [{ start: before, end: september[3] }, [segment(0, 0, 3, [8, 8, 8, 8])]],
    [{ start: september[38], end: after }, [segment(5, 3, 6, [8, 8, 8, 8])]],
    [{ start: before, end: september[0] }, [segment(0, 0, 0, [8, 8, 8, 8])]],
    [{ start: september[41], end: after }, [segment(5, 6, 6, [8, 8, 8, 8])]],
    [{ start: before, end: after }, [
      segment(0, 0, 6, [8, 8, 0, 0]),
      segment(1, 0, 6, [0, 0, 0, 0]),
      segment(2, 0, 6, [0, 0, 0, 0]),
      segment(3, 0, 6, [0, 0, 0, 0]),
      segment(4, 0, 6, [0, 0, 0, 0]),
      segment(5, 0, 6, [0, 0, 8, 8]),
    ]],
  ]
  for (const [range, expected] of cases) {
    assert.deepEqual(rangeSegments(september, range), expected)
    assert.deepEqual(rangeSegments(september, { start: range.end, end: range.start }), expected)
  }
})

test('adjacent-month dates share their actual calendar row instead of breaking at month boundaries', () => {
  assert.equal(dateKey(september[0]), '2026-08-30')
  assert.equal(dateKey(september.at(-1)), '2026-10-10')
  assert.deepEqual(rangeSegments(september, {
    start: local(2026, 9, 29), end: local(2026, 10, 2),
  }), [segment(4, 2, 5, [8, 8, 8, 8])])
  assert.deepEqual(rangeSegments(september, {
    start: local(2026, 8, 31), end: local(2026, 9, 6),
  }), [segment(0, 1, 6, [8, 8, 0, 8]), segment(1, 0, 0, [8, 0, 8, 8])])
})

test('year rollover and leap-day ranges use continuous Sunday–Saturday geometry', () => {
  const december = calendarDays(local(2026, 12, 1))
  assert.deepEqual(rangeSegments(december, {
    start: local(2026, 12, 30), end: local(2027, 1, 4),
  }), [segment(4, 3, 6, [8, 8, 0, 8]), segment(5, 0, 1, [8, 0, 8, 8])])
  const february = calendarDays(local(2024, 2, 1))
  assert.deepEqual(rangeSegments(february, {
    start: local(2024, 2, 28), end: local(2024, 3, 1),
  }), [segment(4, 3, 5, [8, 8, 8, 8])])
})

test('Last 30 and Last 90 days produce clipped runs when navigating between covered months', () => {
  const today = local(2026, 9, 17)
  const last30 = presetRange('last-30', today)
  const last90 = presetRange('last-90', today)
  assert.deepEqual([dateKey(last30.start), dateKey(last30.end)], ['2026-08-19', '2026-09-17'])
  assert.deepEqual([dateKey(last90.start), dateKey(last90.end)], ['2026-06-20', '2026-09-17'])

  const visibleEnd = [segment(0, 0, 6, [8, 8, 0, 0]), segment(1, 0, 6, [0, 0, 0, 8]), segment(2, 0, 4, [0, 0, 8, 8])]
  assert.deepEqual(rangeSegments(september, last30), visibleEnd)
  assert.deepEqual(rangeSegments(september, last90), visibleEnd)
  assert.deepEqual(rangeSegments(calendarDays(last30.start), last30), [
    segment(3, 3, 6, [8, 8, 0, 0]), segment(4, 0, 6, [8, 0, 0, 0]), segment(5, 0, 6, [0, 0, 8, 8]),
  ])
  assert.deepEqual(rangeSegments(calendarDays(last90.start), last90), [
    segment(2, 6, 6, [8, 8, 0, 0]), segment(3, 0, 6, [8, 0, 0, 0]), segment(4, 0, 6, [0, 0, 0, 0]), segment(5, 0, 6, [0, 0, 8, 8]),
  ])
})

test('non-noon selection boundaries use local calendar days and remain unmodified', () => {
  const start = local(2026, 9, 9, 23)
  const end = local(2026, 9, 24, 0)
  const timestamps = [start.getTime(), end.getTime()]
  assert.deepEqual(rangeSegments(september, { start, end }), [
    segment(1, 3, 6, [8, 8, 0, 0]), segment(2, 0, 6, [8, 0, 0, 8]), segment(3, 0, 4, [0, 0, 8, 8]),
  ])
  assert.deepEqual([start.getTime(), end.getTime()], timestamps)
})
