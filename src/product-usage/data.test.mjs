import test from 'node:test';
import assert from 'node:assert/strict';
import { features, visibleFeatures, toCsv, activityForRange, scaleCount } from './data.js';

test('activity totals include every feature exactly once in each period', () => {
  assert.equal(features.reduce((sum, row) => sum + row.actions, 0), 12500);
  for (const [range, counts, total] of [
    ['Day', [108, 96, 78, 63, 72], 417],
    ['Week', [810, 718, 585, 473, 540], 3126],
    ['Month', [3240, 2870, 2340, 1890, 2160], 12500],
  ]) {
    const activity = activityForRange(range);
    assert.deepEqual(activity.segments.map(segment => segment.actions), counts);
    assert.equal(activity.total, total);
    assert.equal(activity.total, visibleFeatures('', '', range).reduce((sum, row) => sum + row.actions, 0));
    assert.deepEqual(activity.segments.flatMap(segment => segment.featureIds), features.map(feature => feature.id));
    assert.ok(Math.abs(activity.segments.reduce((sum, segment) => sum + segment.actions / activity.total, 0) - 1) < 1e-12);
    assert.ok(activity.segments.every(segment => !Object.hasOwn(segment, 'width')));
  }
});
test('search and category filters combine without altering source data', () => {
  assert.deepEqual(visibleFeatures('  DOCUMENT  ', 'Productivity', 'Month').map(f => f.id), ['editor']);
  assert.deepEqual(visibleFeatures('document', 'AI Agent', 'Month'), []);
  assert.deepEqual(visibleFeatures('support', '', 'Month').map(f => f.id), ['support']);
  assert.equal(features[1].actions, 2870);
});
test('time-range mock counts are deterministic and Month restores source values', () => {
  assert.equal(scaleCount(3240, 'Day'), 108);
  assert.equal(scaleCount(3240, 'Week'), 810);
  assert.equal(scaleCount(3240, 'Month'), 3240);
  assert.equal(activityForRange('Day').total, 417);
});
test('CSV exports only filtered rows, preserves numeric values, and escapes quotes', () => {
  const csv = toCsv(visibleFeatures('AI Assistant', '', 'Month'));
  assert.equal(csv.split('\r\n').length, 3);
  assert.ok(csv.includes('"AI Assistant","AI Agent","3240","2890","4m 12s","25.9%"'));
  assert.ok(!csv.includes('Document Editor'));
  assert.ok(toCsv([{ ...features[0], name: 'A "quoted", feature' }]).includes('"A ""quoted"", feature"'));
});
