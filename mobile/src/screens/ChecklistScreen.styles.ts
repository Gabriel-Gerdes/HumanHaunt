import { StyleSheet } from 'react-native';

import { colors } from '../theme/colors';

// Shared card shell for empty-state banners; per-style overrides below supply colors.
const emptyCardBase = {
  borderRadius: 16,
  borderWidth: 1,
  marginBottom: 12,
  padding: 14,
};

export const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  device: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  emptyCategory: {
    ...emptyCardBase,
    backgroundColor: colors.cardSurface,
    borderColor: colors.border,
  },
  emptyCategoryText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    ...emptyCardBase,
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
  },
  emptyTitle: {
    color: colors.warningText,
    fontSize: 16,
    fontWeight: '800',
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  hero: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  playingAs: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  screen: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  subtitle: {
    color: colors.textBody,
    fontSize: 15,
    marginTop: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
  },
});
