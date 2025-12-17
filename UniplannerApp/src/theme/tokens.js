import { Platform } from 'react-native';

export const colors = {
  ink: '#1F1A1A',
  inkMuted: '#5B5454',
  inkSubtle: '#8A8282',
  background: '#F7F5F2',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF7F5',
  primary: '#9F2F2F',
  primaryBright: '#B33A3A',
  accent: '#B65A3A',
  accentSoft: '#F6E4DE',
  info: '#1F4E7A',
  success: '#2F7D4C',
  warning: '#B7791F',
  danger: '#B42318',
  border: '#E4DDDA',
  borderStrong: '#D5CDCA',
  chip: '#F1ECE8',
  chipText: '#4E4747',
  tabBar: '#FFFFFF',
  nav: '#F7F4F2',
  glowTeal: '#F3E5E5',
  glowPeach: '#F5E2D8',
  glowSky: '#E9EDF4',
};

export const fonts = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semibold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  mono: Platform.select({
    ios: 'Menlo',
    default: 'monospace',
  }),
};

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const shadows = {
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  float: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
};
