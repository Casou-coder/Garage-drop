// Revenus : tap, mécanos (passif), showroom (valeur du garage) et bonus de collection.
import { BRANDS } from '../data/brands.js';
import { CAR_MAP, MODELS_BY_BRAND } from '../data/catalog.js';

export const tapValue = (l) => Math.round(10 * Math.pow(l, 1.6));
export const tapCost = (l) => Math.round(150 * Math.pow(1.55, l));
export const idlePerSec = (l) => (l === 0 ? 0 : Math.round(8 * Math.pow(l, 1.7)));
export const idleCost = (l) => Math.round(400 * Math.pow(1.6, l));

// Valeur de base (hors cote du jour) des voitures gardées
export const garageValue = (g) => g.reduce((a, x) => a + (CAR_MAP[x.carId]?.value || 0), 0);
// 0,002 % de la valeur du garage par seconde (soit 0,12 % par minute)
export const showroomPerSec = (v) => v * 0.00002;

// Une marque est complète quand la version standard de chacun de ses modèles est découverte
export const brandComplete = (disc, bid) => MODELS_BY_BRAND[bid].every((m) => disc.has(m.id + '-s'));
export const completedBrands = (disc) => BRANDS.filter((b) => brandComplete(disc, b.id)).length;
export const BRAND_BONUS = 0.05;

// Revenu passif total par seconde
export const passiveRate = (idleLevel, garageVal, brandsDone) =>
  (idlePerSec(idleLevel) + showroomPerSec(garageVal)) * (1 + BRAND_BONUS * brandsDone);
