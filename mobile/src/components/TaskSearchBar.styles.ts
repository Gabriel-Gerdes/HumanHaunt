import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  clearButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    color: '#0f172a',
    flex: 1,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  label: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  wrap: {
    backgroundColor: '#ffffff',
    borderColor: '#d7dde8',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
});
