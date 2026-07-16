import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  claimMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  colorDot: {
    borderRadius: 6,
    height: 12,
    marginRight: 10,
    width: 12,
  },
  hint: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
  },
  label: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  rankBadge: {
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    height: 28,
    justifyContent: 'center',
    marginRight: 10,
    width: 28,
  },
  rankText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
  },
  score: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  teamMeta: {
    flex: 1,
  },
  teamName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
});
