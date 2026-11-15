// Boîtes : prix, probabilités et tirage. Ne pas modifier sans relancer `npm run verify`.
import { CARS, BY_RARITY } from './catalog.js';

// Probabilités en % par rareté (Commune → Prototype), affichées aux joueurs
export const BOXES = [
  { id: 'garage', name: 'Box Garage', price: 3200, color: '#7C8794', odds: [86, 12.5, 1.35, 0.14, 0.01, 0] },
  { id: 'sport', name: 'Box Sport', price: 19000, color: '#3B82F6', odds: [45, 45, 8.5, 1.4, 0.1, 0] },
  { id: 'luxe', name: 'Box Luxe', price: 110000, color: '#A855F7', odds: [0, 50, 40, 9, 0.95, 0.05] },
  { id: 'super', name: 'Box Supercar', price: 500000, color: '#F59E0B', odds: [0, 0, 55, 38, 6.6, 0.4] },
  { id: 'hyper', name: 'Box Hypercar', price: 2300000, color: '#E2463A', odds: [0, 0, 0, 60, 36, 4] },
  { id: 'proto', name: 'Box Prototype', price: 7000000, color: '#2DD4BF', odds: [0, 0, 0, 0, 80, 20] },
];
export const THEME_MARKUP = 1.25;
// Une boîte thématique n'est disponible que si le thème contient sa rareté la plus basse
export const boxAvailable = (box, theme) => !theme.f || BY_RARITY[box.odds.findIndex((o) => o > 0)].some(theme.f);
export const boxPrice = (box, theme) => (theme.id === 'all' ? box.price : Math.round(box.price * THEME_MARKUP / 100) * 100);

export function rollRarity(odds) {
  const r = Math.random() * 100;
  let acc = 0;
  for (let i = 0; i < odds.length; i++) { acc += odds[i]; if (r < acc) return i; }
  return odds.findLastIndex ? odds.findLastIndex((o) => o > 0) : odds.length - 1;
}
export function pickCar(r, f) {
  const order = [r];
  for (let d = 1; d < 6; d++) { if (r - d >= 0) order.push(r - d); if (r + d < 6) order.push(r + d); }
  for (const k of order) {
    const pool = f ? BY_RARITY[k].filter(f) : BY_RARITY[k];
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return CARS[0];
}
