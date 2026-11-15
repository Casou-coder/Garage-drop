import { Platform } from 'react-native';

/* ---------- Thème ---------- */
export const C = {
  bg: '#1C2128', surface: '#262D36', surface2: '#303844', line: '#3A4350',
  text: '#F2EFE6', muted: '#9AA3AE', yellow: '#FFC93C', red: '#E2463A', green: '#3FBF7F',
};
export const DISPLAY = Platform.select({ ios: 'AvenirNextCondensed-Heavy', default: undefined });
export const DISPLAY_B = Platform.select({ ios: 'AvenirNextCondensed-DemiBold', default: undefined });
