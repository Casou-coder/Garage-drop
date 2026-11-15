// Génération déterministe du catalogue à partir de BRANDS.
// Identifiants : modèle = marque-gamme-époque, voiture = marque-gamme-époque-variante.
// Ces identifiants sont stockés dans les sauvegardes : ils ne doivent jamais changer.
import { hash, rng } from './random.js';
import { RAR } from './rarities.js';
import { COUNTRIES, EPOCHS, SEGMENTS, VARIANTS, VKEYS, PAL } from './taxonomy.js';
import { BRANDS } from './brands.js';

export const CARS = [];
export const MODELS = [];
BRANDS.forEach((b) => {
  b.lines.split('|').forEach((ln, li) => {
    const [name, seg, eps] = ln.split(':');
    const S = SEGMENTS[seg];
    eps.split('').forEach((ep) => {
      const E = EPOCHS[ep];
      const mid = `${b.id}-${li}-${ep}`;
      const r = rng(hash(mid));
      const year = E.from + Math.floor(r() * (E.to - E.from + 1));
      const pal = PAL[b.pal];
      const color = pal[Math.floor(r() * pal.length)];
      const hp = Math.max(12, Math.round(S.hp * E.power * (0.8 + r() * 0.45)));
      const base = Math.max(0, Math.min(S.tier + b.prestige + E.bonus - 1, 4));
      const model = { id: mid, brand: b.id, name, seg, epoch: ep, year, color, country: b.country, region: COUNTRIES[b.country].region, line: li, cars: [] };
      VKEYS.forEach((vk) => {
        const rarity = Math.min(5, base + VARIANTS[vk].bump);
        const vr = rng(hash(mid + vk));
        const value = Math.round((RAR[rarity].base * (0.6 + vr() * 1.1)) / 10) * 10;
        const car = {
          id: `${mid}-${vk}`, model: mid, brand: b.id, name, seg, epoch: ep, year, color,
          country: b.country, region: model.region, variant: vk, rarity, value,
          hp: vk === 'c' || vk === 'x' ? Math.round(hp * 1.1) : hp,
        };
        CARS.push(car);
        model.cars.push(car);
      });
      MODELS.push(model);
    });
  });
});
export const CAR_MAP = Object.fromEntries(CARS.map((c) => [c.id, c]));
export const BY_RARITY = RAR.map((_, i) => CARS.filter((c) => c.rarity === i));
export const MODELS_BY_BRAND = Object.fromEntries(BRANDS.map((b) => [b.id, MODELS.filter((m) => m.brand === b.id)]));
