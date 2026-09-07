import { Platform } from 'react-native';

export const Colors = {
  primary: '#6C3FC5',
  primaryLight: '#EDE7F6',
  secondary: '#F4A261',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#F57C00',
  warningLight: '#FFF3E0',
  danger: '#C62828',
  dangerLight: '#FFEBEE',
  info: '#0277BD',
  infoLight: '#E1F5FE',
  background: '#F7F6FB',
  card: '#FFFFFF',
  border: '#E0E0E0',
  text: '#1A1A2E',
  textSecondary: '#6B6B8A',
  textMuted: '#9E9E9E',
  white: '#FFFFFF',
  slippers: '#6C3FC5',
  perfumes: '#E91E8C',
};

export const FontSize = {
  xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 30,
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24,
};

export const Radius = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 999,
};

// Web-safe shadows using boxShadow on web, elevation on native
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
