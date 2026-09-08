import { StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from './index';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: Colors.leatherDark,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 14,
  },
  h2: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 16.8, // ~1.05rem
    color: Colors.leatherDark,
    marginBottom: 12,
  },
  field: {
    marginBottom: 11,
  },
  label: {
    fontSize: 11.8, // ~0.74rem
    color: Colors.inkSoft,
    marginBottom: 5,
    fontFamily: 'WorkSans_600SemiBold',
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface2,
    fontFamily: 'WorkSans_400Regular',
    fontSize: 14.7, // ~0.92rem
    color: Colors.ink,
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  row3: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  btnPrimary: {
    width: '100%',
    padding: 12,
    borderRadius: Radius.sm,
    backgroundColor: Colors.leather,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  btnPrimaryText: {
    color: '#F8EEDF',
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 14.7,
  },
  btnPrimaryDisabled: {
    backgroundColor: '#B9AC97',
  },
  btnGhost: {
    padding: 10,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: Radius.sm,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    color: Colors.inkSoft,
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 13.1, // ~0.82rem
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  stat: {
    width: '48%', // Approx 1fr 1fr with gap
    backgroundColor: Colors.surface,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 14,
  },
  statLabel: {
    fontSize: 11.5, // ~0.72rem
    color: Colors.inkSoft,
    fontFamily: 'WorkSans_600SemiBold',
  },
  statValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 24, // ~1.5rem
    color: Colors.leatherDark,
    marginTop: 4,
  },
  statValueProfit: {
    color: Colors.olive,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 10,
    color: Colors.inkSoft,
    fontSize: 13.6,
    fontFamily: 'WorkSans_400Regular',
  },
});
