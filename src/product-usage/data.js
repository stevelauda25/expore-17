// Month values, labels, and ordering transcribed from Figma 3059:24284.
export const features = [
  { id: 'ai', name: 'AI Assistant', category: 'AI Agent', actions: 3240, users: 2890, time: '4m 12s', color: '#168830', art: '3059-24400' },
  { id: 'editor', name: 'Document Editor', category: 'Productivity', actions: 2870, users: 2410, time: '3m 28s', color: '#412daa', art: '3059-24630' },
  { id: 'analytics', name: 'Analytics Dashboard', category: 'Analytics', actions: 2340, users: 1980, time: '2m 46s', color: '#a16207', art: '3059-24855' },
  { id: 'settings', name: 'Settings', category: 'Settings', actions: 1890, users: 1620, time: '1m 52s', color: '#b84100', art: '3059-25079' },
  { id: 'support', name: 'Help & Support', category: 'Support', actions: 1140, users: 980, time: '1m 20s', color: '#bf337a', art: '3059-25315' },
  { id: 'other', name: 'Other', category: 'Other', actions: 1020, users: 860, time: '1m 05s', color: '#7d7d7d', art: '3059-25542' },
];
// Preserve the chart's five groups, colors, and legend geometry. Other includes
// the remaining two features so every table action is counted exactly once.
const distribution = [
  { id: 'ai', label: 'AI Assistant', featureIds: ['ai'], color: '#0c8631', legendWidth: 137 },
  { id: 'editor', label: 'Document Editor', featureIds: ['editor'], color: '#6473d8', legendWidth: 170 },
  { id: 'analytics', label: 'Analytics', featureIds: ['analytics'], color: '#ffd038', legendWidth: 121 },
  { id: 'settings', label: 'Settings', featureIds: ['settings'], color: '#b84100', legendWidth: 114 },
  { id: 'other', label: 'Other', featureIds: ['support', 'other'], color: '#ececec', legendWidth: 94 },
];
export const ranges = {
  Month: { divisor: 1, period: 'this month', users: 8320, sessions: 324, average: '2.8' },
  Week: { divisor: 4, period: 'this week', users: 2080, sessions: 81, average: '2.8' },
  Day: { divisor: 30, period: 'today', users: 277, sessions: 11, average: '2.8' },
};
export const number = value => value.toLocaleString('en-US');
export const scaleCount = (value, range) => Math.round(value / ranges[range].divisor);
// One settings object per mounted Product Usage page; source feature data stays intact.
export function createManageSettings() {
  return { actionLimit: 50000, alert1: 80, alert2: 100, resetCycle: 'Monthly',
    enabledFeatures: { ai: true, editor: true, analytics: true, settings: true, support: true } };
}
export function usageForRange(range, enabledFeatures = {}) {
  const usage = features.filter(f => f.id === 'other' || enabledFeatures[f.id] !== false)
    .map(f => ({ ...f, actions: scaleCount(f.actions, range), users: scaleCount(f.users, range) }));
  const total = usage.reduce((sum, feature) => sum + feature.actions, 0);
  return { total, features: usage.map(f => ({ ...f, share: `${(total ? f.actions / total * 100 : 0).toFixed(1)}%` })) };
}
export function visibleFeatures(query, category, range, enabledFeatures) {
  const term = query.trim().toLocaleLowerCase('en-US');
  return usageForRange(range, enabledFeatures).features.filter(f =>
    (!category || category === f.category) && `${f.name} ${f.category}`.toLocaleLowerCase('en-US').includes(term));
}
export function activityForRange(range, enabledFeatures) {
  // Scale/round once before grouping. Support and unmanaged Other share a track.
  const { total, features: usage } = usageForRange(range, enabledFeatures);
  const segments = distribution.map(group => ({
    ...group,
    actions: usage.filter(feature => group.featureIds.includes(feature.id)).reduce((sum, feature) => sum + feature.actions, 0),
  })).filter(segment => segment.actions > 0);
  return { total, segments: segments.map(segment => ({
    ...segment, share: `${(total ? segment.actions / total * 100 : 0).toFixed(1)}%`,
  })) };
}
export function monthlyUsage(settings) {
  // Monthly quota is independent of the selected analytics range or reset cycle.
  const { total } = usageForRange('Month', settings.enabledFeatures);
  const percentage = settings.actionLimit > 0 ? total / settings.actionLimit * 100 : 0;
  return { total, percentage, progress: Math.min(100, Math.max(0, percentage)) };
}
export function toCsv(rows) {
  const escape = value => `"${String(value).replaceAll('"', '""')}"`;
  return [['Feature', 'Category', 'Actions', 'Users', 'Avg. time', 'Share'], ...rows.map(f => [f.name, f.category, f.actions, f.users, f.time, f.share])]
    .map(row => row.map(escape).join(',')).join('\r\n') + '\r\n';
}
