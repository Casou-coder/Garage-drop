// Récompenses : cadeau quotidien et gains hors-ligne.
import { DAY } from './market.js';
import { tapValue } from './income.js';

// Série : +1 si on revient en moins de 48 h, sinon retour à 1
export const nextStreak = (sinceLastDaily, streak) => (sinceLastDaily < 2 * DAY ? streak + 1 : 1);
// Cadeau du jour : 300 taps (3 000 € minimum), +25 % par jour de série jusqu'au 7e jour
export const dailyGift = (tapLevel, streak) =>
  Math.round(Math.max(3000, tapValue(tapLevel) * 300) * (1 + 0.25 * (Math.min(streak, 7) - 1)));

// Hors-ligne : 50 % du revenu passif, plafonné à 2 h d'absence
export const OFFLINE_CAP_SEC = 7200;
export const OFFLINE_RATIO = 0.5;
export const offlineEarnings = (rate, elapsedMs) =>
  Math.floor(rate * Math.min(elapsedMs / 1000, OFFLINE_CAP_SEC) * OFFLINE_RATIO);
