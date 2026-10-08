// Popup-only content from the six variants in Figma 3076:12187.
// Shared title, summary, unique users, and average time come from data.js.
export const featureDetails = {
  ai: {
    nodeId: '3073:7791',
    orb: '/product-usage/assets/popovers/ai-orb.png',
    change: '+12%', badgeWidth: 152, sessions: 324,
    description: 'AI Assistant is the most-used feature this month, helping users generate content, ask questions, and complete tasks faster.',
    actions: [
      { label: 'Draft content', count: 1240, icon: '/product-usage/assets/3060-4264-7fd48.svg' },
      { label: 'Summarize document', count: 980, icon: '/product-usage/assets/3060-4264-789df.svg' },
      { label: 'Ask AI', count: 760, icon: '/product-usage/assets/3060-4264-c58c3.svg' },
    ],
  },
  editor: {
    nodeId: '3076:9205',
    orb: '/product-usage/assets/popovers/editor-orb.png',
    change: '+8%', badgeWidth: 146, sessions: 286,
    description: 'Document Editor is one of the most-used features this month, helping users create, edit, and refine content.',
    actions: [
      { label: 'Create document', count: 1080, icon: '/product-usage/assets/popovers/editor-action-1.svg' },
      { label: 'Edit content', count: 840, icon: '/product-usage/assets/popovers/editor-action-2.svg' },
      { label: 'Format document', count: 620, icon: '/product-usage/assets/popovers/editor-action-1.svg' },
    ],
  },
  analytics: {
    nodeId: '3073:8061',
    orb: '/product-usage/assets/popovers/analytics-orb.png',
    change: '+15%', badgeWidth: 152, sessions: 248,
    description: 'Analytics Dashboard helps users monitor performance, explore key metrics, and uncover trends across their activity.',
    actions: [
      { label: 'View dashboard', count: 920, icon: '/product-usage/assets/popovers/analytics-action-1.svg' },
      { label: 'Explore metrics', count: 680, icon: '/product-usage/assets/popovers/analytics-action-2.svg' },
      { label: 'Apply filters', count: 470, icon: '/product-usage/assets/popovers/analytics-action-3.svg' },
    ],
  },
  settings: {
    nodeId: '3076:10638',
    orb: '/product-usage/assets/popovers/settings-orb.png',
    change: '+4%', badgeWidth: 146, sessions: 192,
    description: 'Users visit Settings to manage their workspace, customize preferences, and update account or product configurations.',
    actions: [
      { label: 'Update preferences', count: 680, icon: '/product-usage/assets/popovers/settings-action-1.svg' },
      { label: 'Manage workspace', count: 510, icon: '/product-usage/assets/popovers/settings-action-2.svg' },
      { label: 'Account settings', count: 420, icon: '/product-usage/assets/popovers/settings-action-3.svg' },
    ],
  },
  support: {
    nodeId: '3076:11141',
    orb: '/product-usage/assets/popovers/support-orb.png',
    change: '-3%', badgeWidth: 144, sessions: 126,
    description: 'Help & Support gives users quick access to product guidance, common questions, and assistance when they need it.',
    actions: [
      { label: 'Search help', count: 390, icon: '/product-usage/assets/popovers/support-action-1.svg' },
      { label: 'View help article', count: 310, icon: '/product-usage/assets/popovers/support-action-2.svg' },
      { label: 'Contact support', count: 210, icon: '/product-usage/assets/popovers/support-action-1.svg' },
    ],
  },
  other: {
    nodeId: '3076:11635',
    orb: '/product-usage/assets/popovers/other-orb.png',
    change: '+2%', badgeWidth: 146, sessions: 104,
    description: 'Other activity includes lower-frequency features and supporting interactions across the product.',
    actions: [
      { label: 'Open notifications', count: 330, icon: '/product-usage/assets/popovers/other-action-1.svg' },
      { label: 'View profile', count: 270, icon: '/product-usage/assets/popovers/other-action-2.svg' },
      { label: 'Other actions', count: 220, icon: '/product-usage/assets/popovers/other-action-3.svg' },
    ],
  },
};
