import { Platform } from 'react-native';

/* ---------- Thème ---------- */
export const C = {
  bg: '#1C2128', surface: '#262D36', surface2: '#303844', line: '#3A4350',
  text: '#F2EFE6', muted: '#9AA3AE', yellow: '#FFC93C', red: '#E2463A', green: '#3FBF7F',
};
// Titres : police condensée. iOS a Avenir Next Condensed, Android sa police condensée système.
export const F = {
  heavy: Platform.select({
    ios: { fontFamily: 'AvenirNextCondensed-Heavy' },
    android: { fontFamily: 'sans-serif-condensed', fontWeight: '700' },
    default: { fontWeight: '800' },
  }),
  demi: Platform.select({
    ios: { fontFamily: 'AvenirNextCondensed-DemiBold' },
    android: { fontFamily: 'sans-serif-condensed', fontWeight: '700' },
    default: { fontWeight: '600' },
  }),
};
