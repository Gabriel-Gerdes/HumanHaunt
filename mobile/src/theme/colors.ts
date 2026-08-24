// Shared semantic color tokens for the app.
// Rebranding or adding dark-mode variants only requires swapping values here;
// screen styles must reference these tokens instead of hardcoded hex literals.
export const colors = {
  surface: '#eef2f7',
  cardSurface: '#ffffff',
  border: '#d7dde8',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textBody: '#475569',
  textMuted: '#64748b',
  accent: '#2563eb',
  warningBg: '#fffbeb',
  warningBorder: '#f59e0b',
  warningText: '#92400e',
} as const;

export type ColorToken = keyof typeof colors;