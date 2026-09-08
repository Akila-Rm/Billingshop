import { Platform } from 'react-native';

export const Colors = {
  bg: '#EEE7D9',
  surface: '#FBF7EF',
  surface2: '#F3ECDD',
  ink: '#2E241B',
  inkSoft: '#6E5F4F',
  leather: '#6B3F2A',
  leatherDark: '#4A2B1B',
  tan: '#C98A45',
  olive: '#4C6B4A',
  line: '#DCD0B8',
  danger: '#A6412F',
  white: '#FFFFFF',
  
  // Mapping existing ones to new palette where applicable
  primary: '#6B3F2A', // leather
  secondary: '#C98A45', // tan
  background: '#EEE7D9',
  card: '#FBF7EF',
  border: '#DCD0B8',
  text: '#2E241B',
  textMuted: '#6E5F4F',
};

export const FontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 26,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const Radius = {
  sm: 9,
  md: 14,
  lg: 20,
  full: 999,
};

export const Shadow = {
  small: Platform.select({
    web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.10)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  }),
  medium: Platform.select({
    web: { boxShadow: '0px 3px 8px rgba(0,0,0,0.13)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  }),
};
