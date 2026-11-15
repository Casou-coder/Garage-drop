// Rang du joueur, d'après le nombre de versions découvertes dans le carnet
const RANKS = [
  [0, 'Débutant'], [10, 'Amateur'], [50, 'Collectionneur'], [150, 'Connaisseur'],
  [400, 'Expert'], [800, 'Conservateur'], [1100, 'Légende du garage'],
];
export function rankOf(found) {
  let i = 0;
  while (i + 1 < RANKS.length && found >= RANKS[i + 1][0]) i++;
  return { label: RANKS[i][1], next: RANKS[i + 1] ? RANKS[i + 1][0] : null, nextLabel: RANKS[i + 1] ? RANKS[i + 1][1] : null };
}
