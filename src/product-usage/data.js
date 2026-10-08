// Month values, labels, and ordering transcribed from Figma 3059:24284.
export const features = [
  { id: 'ai', name: 'AI Assistant', category: 'AI Agent', actions: 3240, users: 2890, time: '4m 12s', share: '25.9%', color: '#168830', art: '3059-24400' },
  { id: 'editor', name: 'Document Editor', category: 'Productivity', actions: 2870, users: 2410, time: '3m 28s', share: '23.0%', color: '#412daa', art: '3059-24630' },
  { id: 'analytics', name: 'Analytics Dashboard', category: 'Analytics', actions: 2340, users: 1980, time: '2m 46s', share: '18.7%', color: '#a16207', art: '3059-24855' },
  { id: 'settings', name: 'Settings', category: 'Settings', actions: 1890, users: 1620, time: '1m 52s', share: '15.1%', color: '#b84100', art: '3059-25079' },
  { id: 'support', name: 'Help & Support', category: 'Support', actions: 1140, users: 980, time: '1m 20s', share: '9.1%', color: '#bf337a', art: '3059-25315' },
  { id: 'other', name: 'Other', category: 'Other', actions: 1020, users: 860, time: '1m 05s', share: '8.2%', color: '#7d7d7d', art: '3059-25542' },
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
export function visibleFeatures(query, category, range) {
  const term = query.trim().toLocaleLowerCase('en-US');
  return features.filter(f => (!category || category === f.category) && `${f.name} ${f.category}`.toLocaleLowerCase('en-US').includes(term))
    .map(f => ({ ...f, actions: scaleCount(f.actions, range), users: scaleCount(f.users, range) }));
}
export function activityForRange(range) {
  // Scale and round individual feature counts first, exactly as the table does.
  const usage = visibleFeatures('', '', range);
  const segments = distribution.map(group => ({
    ...group,
    actions: usage.filter(feature => group.featureIds.includes(feature.id)).reduce((sum, feature) => sum + feature.actions, 0),
  }));
  const total = segments.reduce((sum, segment) => sum + segment.actions, 0);
  return {
    total,
    segments: segments.map(segment => ({
      ...segment,
      share: `${(total ? segment.actions / total * 100 : 0).toFixed(1)}%`,
    })),
  };
}
export function toCsv(rows) {
  const escape = value => `"${String(value).replaceAll('"', '""')}"`;
  return [['Feature', 'Category', 'Actions', 'Users', 'Avg. time', 'Share'], ...rows.map(f => [f.name, f.category, f.actions, f.users, f.time, f.share])]
    .map(row => row.map(escape).join(',')).join('\r\n') + '\r\n';
}
