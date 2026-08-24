import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  cardCompleted: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.72,
  },
  claimButton: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  claimButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  claimButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  claimButtonTextDisabled: {
    color: '#64748b',
  },
  claimedBadge: {
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  claimedBadgeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  conflict: {
    color: '#92400e',
    fontSize: 12,
    marginTop: 10,
  },
  header: {
    gap: 4,
    marginBottom: 12,
  },
  open: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700',
  },
  points: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  textMuted: {
    color: '#64748b',
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  winner: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
});
