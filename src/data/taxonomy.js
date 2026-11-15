// Référentiels du catalogue : régions, pays, époques, segments, variantes, palettes.
export const REGIONS = { eu: 'Europe', na: 'Amérique du Nord', as: 'Asie', oc: 'Océanie' };
export const COUNTRIES = {
  it: { label: 'Italie', flag: '🇮🇹', region: 'eu' },
  de: { label: 'Allemagne', flag: '🇩🇪', region: 'eu' },
  fr: { label: 'France', flag: '🇫🇷', region: 'eu' },
  uk: { label: 'Royaume-Uni', flag: '🇬🇧', region: 'eu' },
  se: { label: 'Suède', flag: '🇸🇪', region: 'eu' },
  us: { label: 'États-Unis', flag: '🇺🇸', region: 'na' },
  jp: { label: 'Japon', flag: '🇯🇵', region: 'as' },
  kr: { label: 'Corée du Sud', flag: '🇰🇷', region: 'as' },
  cn: { label: 'Chine', flag: '🇨🇳', region: 'as' },
  au: { label: 'Australie', flag: '🇦🇺', region: 'oc' },
};

export const EPOCHS = {
  P: { label: 'Avant-guerre', from: 1910, to: 1944, bonus: 2, power: 0.25 },
  C: { label: 'Classique', from: 1945, to: 1969, bonus: 1, power: 0.45 },
  Y: { label: 'Youngtimer', from: 1970, to: 1989, bonus: 1, power: 0.6 },
  M: { label: 'Moderne', from: 1990, to: 2014, bonus: 0, power: 0.85 },
  A: { label: 'Actuelle', from: 2015, to: 2026, bonus: 0, power: 1 },
};
export const EPOCH_ORDER = ['P', 'C', 'Y', 'M', 'A'];

export const SEGMENTS = {
  city: { label: 'Citadine', tier: 0, hp: 75 },
  berline: { label: 'Berline', tier: 0, hp: 140 },
  wagon: { label: 'Break', tier: 0, hp: 130 },
  suv: { label: 'SUV', tier: 0, hp: 190 },
  pickup: { label: 'Pick-up', tier: 0, hp: 260 },
  offroad: { label: 'Tout-terrain', tier: 1, hp: 170 },
  electric: { label: 'Électrique', tier: 1, hp: 320 },
  muscle: { label: 'Muscle car', tier: 1, hp: 420 },
  roadster: { label: 'Roadster', tier: 1, hp: 190 },
  sport: { label: 'Sportive', tier: 1, hp: 320 },
  rally: { label: 'Rallye', tier: 2, hp: 300 },
  gt: { label: 'Grand tourisme', tier: 2, hp: 460 },
  limo: { label: 'Limousine', tier: 2, hp: 360 },
  super: { label: 'Supercar', tier: 3, hp: 680 },
  hyper: { label: 'Hypercar', tier: 4, hp: 1150 },
};

// Chaque modèle existe en 5 versions, de plus en plus rares
export const VARIANTS = {
  s: { label: 'Standard', bump: 0 },
  e: { label: 'Édition spéciale', bump: 1 },
  c: { label: 'Finition carbone', bump: 2 },
  l: { label: 'Série limitée', bump: 2, serial: 500 },
  x: { label: 'Chrome', bump: 3, serial: 50 },
};
export const VKEYS = ['s', 'e', 'c', 'l', 'x'];

export const PAL = {
  rosso: ['#C1121F', '#FFBA08', '#F8F9FA', '#14213D', '#2A9D8F', '#E85D04'],
  sober: ['#ADB5BD', '#495057', '#F1F3F5', '#1D3557', '#6C757D', '#22223B'],
  pop: ['#E9C46A', '#E76F51', '#8ECAE6', '#F4F1DE', '#6B8F71', '#B5C9C3'],
  luxe: ['#1B263B', '#5C4033', '#E9E3D5', '#2D6A4F', '#6D2E46', '#C0C7CE'],
  us: ['#9D0208', '#003049', '#FCBF49', '#2B9348', '#F1FAEE', '#3A3A3A'],
  jp: ['#F1F1F1', '#4361EE', '#D00000', '#FFB703', '#7209B7', '#2B2D42'],
  nord: ['#8D99AE', '#3D405B', '#CAD2C5', '#52796F', '#EDF2F4', '#354F52'],
};
