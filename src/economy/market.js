// Cote du marché : chaque modèle fluctue jour après jour autour de sa valeur de base.
// La cote est déterministe (hash du modèle + numéro du jour), donc identique pour tous les joueurs.
import { hash } from '../data/random.js';

export const DAY = 24 * 3600 * 1000;
export const dayIndex = () => Math.floor(Date.now() / DAY);

// Facteur entre 0,83 et 1,17 autour de la valeur de base
export function marketFactor(modelId, d) {
  const h = hash(modelId) % 1000;
  return 1 + 0.12 * Math.sin(d * 0.9 + h) + 0.05 * Math.sin(d * 2.3 + h * 0.7);
}
export const quote = (car, d = dayIndex()) => Math.round(car.value * marketFactor(car.model, d));
