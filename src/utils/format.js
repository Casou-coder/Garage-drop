import { BRAND_MAP } from '../data/brands.js';
import { COUNTRIES } from '../data/taxonomy.js';

export function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace('.', ',') + ' Md €';
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace('.', ',') + ' M €';
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
}
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const carName = (c) => `${BRAND_MAP[c.brand].name} ${c.name}`;
export const flagOf = (c) => COUNTRIES[c.country].flag;
export function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}
