import test from 'node:test';
import assert from 'node:assert/strict';
import { features, visibleFeatures, toCsv, activityForRange, scaleCount, createManageSettings, monthlyUsage } from './data.js';

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

test('enablement composes with ranges, queries and categories without deleting source data', () => {
  const original = structuredClone(features);
  for (const range of ['Day', 'Week', 'Month']) {
    const disabled = { settings: false, support: false };
    const enabled = visibleFeatures('', '', range, disabled);
    const activity = activityForRange(range, disabled);
    assert.equal(activity.total, enabled.reduce((sum, f) => sum + f.actions, 0));
    assert.equal(activity.segments.some(s => s.id === 'settings'), false);
    assert.equal(activity.segments.find(s => s.id === 'other').actions, scaleCount(1020, range));
    assert.equal(enabled.some(f => ['settings', 'support'].includes(f.id)), false);
    assert.deepEqual(visibleFeatures('settings', '', range, disabled), []);
    assert.deepEqual(visibleFeatures('', 'Settings', range, disabled), []);
    for (const feature of enabled) assert.equal(feature.share, `${(feature.actions / activity.total * 100).toFixed(1)}%`);
    assert.ok(Math.abs(activity.segments.reduce((sum, s) => sum + s.actions / activity.total, 0) - 1) < 1e-12);
  }
  assert.deepEqual(features, original);
});

test('monthly quota derives from enabled usage independently of analytics range and reset cycle', () => {
  const settings = createManageSettings();
  assert.deepEqual(monthlyUsage(settings), { total: 12500, percentage: 25, progress: 25 });
  settings.actionLimit = 60000;
  assert.equal(monthlyUsage(settings).percentage, 12500 / 60000 * 100);
  settings.enabledFeatures.settings = false;
  assert.equal(monthlyUsage(settings).total, 10610);
  assert.equal(monthlyUsage(settings).percentage, 10610 / 60000 * 100);
  settings.resetCycle = 'Daily';
  assert.equal(monthlyUsage(settings).total, 10610);
  assert.equal(settings.actionLimit, 60000);
  settings.actionLimit = 1;
  assert.equal(monthlyUsage(settings).progress, 100);
  settings.actionLimit = 0;
  assert.equal(monthlyUsage(settings).percentage, 0);
  assert.deepEqual(createManageSettings(), { actionLimit: 50000, alert1: 80, alert2: 100, resetCycle: 'Monthly', enabledFeatures: { ai: true, editor: true, analytics: true, settings: true, support: true } });
});

test('all manageable features off leaves only unmanaged Other with finite full-width shares', () => {
  const enabled = Object.fromEntries(['ai', 'editor', 'analytics', 'settings', 'support', 'other'].map(id => [id, false]));
  for (const range of ['Day', 'Week', 'Month']) {
    const activity = activityForRange(range, enabled);
    assert.equal(activity.total, scaleCount(1020, range));
    assert.deepEqual(activity.segments.map(s => [s.id, s.share]), [['other', '100.0%']]);
    assert.deepEqual(visibleFeatures('', '', range, enabled).map(f => [f.id, f.share]), [['other', '100.0%']]);
  }
});
