// Thèmes de boîtes : f filtre les voitures éligibles (null = tout le catalogue).
import { BRAND_MAP } from './brands.js';

export const THEMES = [
  { id: 'all', label: 'Tout le catalogue', f: null },
  { id: 'eu', label: 'Europe', f: (c) => c.region === 'eu' },
  { id: 'na', label: 'Amérique du Nord', f: (c) => c.region === 'na' },
  { id: 'as', label: 'Asie', f: (c) => c.region === 'as' },
  { id: 'oc', label: 'Océanie', f: (c) => c.region === 'oc' },
  { id: 'it', label: 'Italie', f: (c) => c.country === 'it' },
  { id: 'de', label: 'Allemagne', f: (c) => c.country === 'de' },
  { id: 'fr', label: 'France', f: (c) => c.country === 'fr' },
  { id: 'uk', label: 'Royaume-Uni', f: (c) => c.country === 'uk' },
  { id: 'us', label: 'États-Unis', f: (c) => c.country === 'us' },
  { id: 'jp', label: 'Japon', f: (c) => c.country === 'jp' },
  { id: 'hist', label: 'Historiques', f: (c) => c.epoch === 'P' || c.epoch === 'C' },
  { id: 'young', label: 'Youngtimers', f: (c) => c.epoch === 'Y' },
  { id: 'sport', label: 'Sportives', f: (c) => ['sport', 'rally', 'roadster', 'muscle'].includes(c.seg) },
  { id: 'lux', label: 'Luxe', f: (c) => ['gt', 'limo'].includes(c.seg) || BRAND_MAP[c.brand].prestige === 2 },
  { id: 'exo', label: 'Supercars', f: (c) => c.seg === 'super' || c.seg === 'hyper' },
  { id: 'ev', label: 'Électriques', f: (c) => c.seg === 'electric' },
  { id: 'tt', label: 'Tout-terrain', f: (c) => ['offroad', 'pickup', 'suv'].includes(c.seg) },
];
