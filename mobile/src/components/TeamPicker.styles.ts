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
  prompt: {
    color: '#b45309',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
  },
  selectedTeamText: {
    color: '#ffffff',
  },
  teamButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  teamButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  teamGrid: {
    flexDirection: 'row',
    gap: 8,
  },
});
