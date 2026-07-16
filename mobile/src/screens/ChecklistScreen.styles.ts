import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: '#eef2f7',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  device: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 10,
  },
  emptyBody: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  emptyCategory: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  emptyCategoryText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  emptyTitle: {
    color: '#92400e',
    fontSize: 16,
    fontWeight: '800',
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  hero: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  loadingText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '700',
  },
  playingAs: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  screen: {
    backgroundColor: '#eef2f7',
    flex: 1,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    marginTop: 8,
  },
  title: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
  },
});
