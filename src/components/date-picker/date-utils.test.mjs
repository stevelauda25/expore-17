import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import {
  PRESETS,
  addDays,
  calendarDays,
  dateKey,
  isInRange,
  orderedRange,
  presetRange,
  sameDay,
  shiftMonth,
  startOfMonth,
  todayLocal,
} from './date-utils.ts'

// Execute with Node 24: node --test src/components/date-picker/date-utils.test.mjs
const local = (year, month, day, hour = 12, minute = 0) => new Date(year, month - 1, day, hour, minute)
const keys = (range) => [dateKey(range.start), dateKey(range.end)]
const assertNoon = (date) => assert.deepEqual(
  [date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()],
  [12, 0, 0, 0],
)

test('local keys and sameDay use calendar fields rather than hours or UTC dates', () => {
  assert.equal(dateKey(local(2026, 1, 2, 0, 5)), '2026-01-02')
  assert.equal(sameDay(local(2026, 1, 2, 0), local(2026, 1, 2, 23, 59)), true)
  assert.equal(sameDay(local(2026, 1, 2), local(2026, 2, 2)), false)
  assert.equal(sameDay(local(2026, 1, 2), local(2027, 1, 2)), false)
  const before = new Date()
  const today = todayLocal()
  const after = new Date()
  assert.ok(sameDay(today, before) || sameDay(today, after))
  assertNoon(today)
})

test('day arithmetic handles year boundaries and Gregorian leap years without mutation', () => {
  const input = local(2024, 2, 28, 23, 45)
  const original = input.getTime()
  assert.equal(dateKey(addDays(input, 1)), '2024-02-29')
  assert.equal(dateKey(addDays(input, 2)), '2024-03-01')
  assert.equal(dateKey(addDays(local(2025, 2, 28), 1)), '2025-03-01')
  assert.equal(dateKey(addDays(local(2000, 2, 28), 1)), '2000-02-29')
  assert.equal(dateKey(addDays(local(2100, 2, 28), 1)), '2100-03-01')
  assert.equal(dateKey(addDays(local(2026, 12, 31), 1)), '2027-01-01')
  assert.equal(dateKey(addDays(local(2026, 1, 1), -1)), '2025-12-31')
  assertNoon(addDays(input, 0))
  assert.equal(input.getTime(), original)
  assert.notEqual(addDays(input, 0), input)
})

test('month navigation always chooses day 1, including from the 31st', () => {
  const input = local(2026, 1, 31, 23)
  assert.equal(dateKey(startOfMonth(input)), '2026-01-01')
  assert.equal(dateKey(shiftMonth(input, 1)), '2026-02-01')
  assert.equal(dateKey(shiftMonth(input, -1)), '2025-12-01')
  assert.equal(dateKey(shiftMonth(local(2026, 12, 31), 1)), '2027-01-01')
  assert.equal(dateKey(shiftMonth(input, 13)), '2027-02-01')
  assertNoon(shiftMonth(input, 1))
  assert.equal(dateKey(input), '2026-01-31')
  assert.equal(input.getHours(), 23)
})

test('calendar grids contain 42 distinct consecutive local days, Sunday through Saturday', () => {
  for (const [month, expectedFirst, expectedLast, targetDays] of [
    [local(2026, 3, 19), '2026-03-01', '2026-04-11', 31],
    [local(2024, 2, 29), '2024-01-28', '2024-03-09', 29],
    [local(2026, 8, 1), '2026-07-26', '2026-09-05', 31],
    [local(2026, 12, 12), '2026-11-29', '2027-01-09', 31],
  ]) {
    const days = calendarDays(month)
    assert.equal(days.length, 42)
    assert.equal(new Set(days.map(dateKey)).size, 42)
    assert.equal(new Set(days).size, 42)
    assert.equal(dateKey(days[0]), expectedFirst)
    assert.equal(dateKey(days.at(-1)), expectedLast)
    assert.equal(days[0].getDay(), 0)
    assert.equal(days.at(-1).getDay(), 6)
    assert.equal(days.filter(day => day.getMonth() === month.getMonth()).length, targetDays)
    days.forEach((day, index) => {
      assertNoon(day)
      if (index) assert.equal(dateKey(day), dateKey(addDays(days[index - 1], 1)))
    })
  }
})

test('ranges include both boundaries, normalize reversed selections, and allow one day', () => {
  const early = local(2026, 9, 3, 23, 59)
  const late = local(2026, 9, 7, 0)
  const range = orderedRange(late, early)
  assert.deepEqual(keys(range), ['2026-09-03', '2026-09-07'])
  assert.equal(isInRange(local(2026, 9, 3, 0), range), true)
  assert.equal(isInRange(local(2026, 9, 5), range), true)
  assert.equal(isInRange(local(2026, 9, 7, 23, 59), range), true)
  assert.equal(isInRange(local(2026, 9, 2), range), false)
  assert.equal(isInRange(local(2026, 9, 8), range), false)
  assert.equal(isInRange(local(2026, 9, 5), { start: late, end: early }), true)
  const oneDay = orderedRange(early, local(2026, 9, 3, 0))
  assert.deepEqual(keys(oneDay), ['2026-09-03', '2026-09-03'])
  assert.equal(isInRange(local(2026, 9, 3, 8), oneDay), true)
  assert.equal(isInRange(local(2026, 9, 4), oneDay), false)
  assertNoon(range.start)
  assertNoon(range.end)
  assert.notEqual(range.start, early)
  assert.notEqual(range.end, late)
  assert.equal(early.getHours(), 23)
  assert.equal(late.getHours(), 0)
})

test('all presets have exact inclusive lengths and cross month/year boundaries', () => {
  const today = local(2026, 1, 2, 0, 5)
  const expected = {
    today: ['2026-01-02', '2026-01-02'],
    yesterday: ['2026-01-01', '2026-01-01'],
    'last-3': ['2025-12-31', '2026-01-02'],
    'last-7': ['2025-12-27', '2026-01-02'],
    'last-14': ['2025-12-20', '2026-01-02'],
    'last-30': ['2025-12-04', '2026-01-02'],
    'last-90': ['2025-10-05', '2026-01-02'],
  }
  assert.deepEqual(PRESETS.map(preset => preset.id), Object.keys(expected))
  for (const { id, label } of PRESETS) {
    assert.ok(label.length)
    const range = presetRange(id, today)
    assert.deepEqual(keys(range), expected[id])
    assertNoon(range.start)
    assertNoon(range.end)
    const length = id.startsWith('last-') ? Number(id.slice(5)) : 1
    assert.equal(dateKey(addDays(range.start, length - 1)), dateKey(range.end))
  }
  assert.deepEqual(keys(presetRange('last-3', local(2024, 3, 1))), ['2024-02-28', '2024-03-01'])
  assert.equal(today.getHours(), 0)
})

test('calendar arithmetic stays local through DST in New York and Los Angeles', () => {
  const moduleUrl = new URL('./date-utils.ts', import.meta.url).href
  const source = `
    import assert from 'node:assert/strict';
    import { addDays, calendarDays, dateKey, presetRange, todayLocal } from ${JSON.stringify(moduleUrl)};
    const local = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour);
    const spring = local(2026, 3, 7);
    const springNext = addDays(spring, 1);
    assert.equal(dateKey(springNext), '2026-03-08');
    assert.equal(springNext.getHours(), 12);
    assert.equal((springNext - spring) / 3600000, 23);
    const fall = local(2026, 10, 31);
    const fallNext = addDays(fall, 1);
    assert.equal(dateKey(fallNext), '2026-11-01');
    assert.equal(fallNext.getHours(), 12);
    assert.equal((fallNext - fall) / 3600000, 25);
    assert.equal(dateKey(addDays(springNext, -1)), '2026-03-07');
    assert.equal(dateKey(addDays(fallNext, -1)), '2026-10-31');
    assert.equal(dateKey(local(2026, 1, 2, 23)), '2026-01-02');
    assert.equal(local(2026, 1, 2, 23).toISOString().slice(0, 10), '2026-01-03');
    for (const month of [local(2026, 3, 1), local(2026, 11, 1)]) {
      const days = calendarDays(month);
      assert.equal(days.length, 42);
      assert.equal(new Set(days.map(dateKey)).size, 42);
      assert.ok(days.every(day => day.getHours() === 12));
    }
    const springRange = presetRange('last-3', local(2026, 3, 9));
    assert.deepEqual([dateKey(springRange.start), dateKey(springRange.end)], ['2026-03-07', '2026-03-09']);
    const fallRange = presetRange('last-3', local(2026, 11, 2));
    assert.deepEqual([dateKey(fallRange.start), dateKey(fallRange.end)], ['2026-10-31', '2026-11-02']);
    assert.equal(todayLocal().getHours(), 12);
  `
  for (const timezone of ['America/New_York', 'America/Los_Angeles']) {
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', source], {
      env: { ...process.env, TZ: timezone },
      encoding: 'utf8',
    })
    assert.equal(result.status, 0, `${timezone}: ${result.stderr || result.error || result.stdout}`)
  }
})
