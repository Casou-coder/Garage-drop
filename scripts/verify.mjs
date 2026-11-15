// Vérifie les invariants du catalogue et de l'économie. Lancer avec : npm run verify
// Sort en erreur (code 1) si une valeur attendue ne correspond plus.
import { createHash } from 'node:crypto';
import { RAR, BRANDS, MODELS, CARS, BY_RARITY, THEMES, BOXES, boxAvailable, boxPrice } from '../src/data/index.js';

const EXPECTED = {
  brands: 25,
  models: 237,
  cars: 1185,
  // Rendement = valeur moyenne obtenue / prix
  yields: { garage: 1.09, sport: 0.92, luxe: 0.92, super: 0.92, hyper: 0.92, proto: 0.92 },
  yieldTolerance: 0.01,
  // Empreinte des identifiants, raretés et valeurs de toutes les voitures.
  // Si elle change, les sauvegardes existantes ou l'équilibrage sont touchés :
  // ne la mettre à jour que pour un changement de catalogue voulu (ajout de marque ou de gamme).
  fingerprint: '72d469bb25ae54a7',
};

let failed = false;
const check = (label, got, want, ok = got === want) => {
  console.log(`${ok ? '✓' : '✗'} ${label} : ${got}${ok ? '' : `  (attendu : ${want})`}`);
  if (!ok) failed = true;
};
const fr = (n, d = 2) => n.toFixed(d).replace('.', ',');
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

console.log('— Catalogue —');
check('Marques', BRANDS.length, EXPECTED.brands);
check('Modèles', MODELS.length, EXPECTED.models);
check('Versions', CARS.length, EXPECTED.cars);
check('Identifiants uniques', new Set(CARS.map((c) => c.id)).size, CARS.length);
check('Format des identifiants', CARS.every((c) => /^[a-z]{3}-\d+-[PCYMA]-[seclx]$/.test(c.id)) ? 'ok' : 'invalide', 'ok');
const fingerprint = createHash('sha256').update(CARS.map((c) => `${c.id}:${c.rarity}:${c.value}`).join('|')).digest('hex').slice(0, 16);
check('Empreinte du catalogue', fingerprint, EXPECTED.fingerprint);

console.log('\n— Répartition par rareté —');
RAR.forEach((R, r) => {
  const n = BY_RARITY[r].length;
  console.log(`  ${R.label.padEnd(11)} ${String(n).padStart(4)}  (${fr((n / CARS.length) * 100, 1).padStart(4)} %)  valeur moyenne ${Math.round(mean(BY_RARITY[r].map((c) => c.value))).toLocaleString('fr-FR')} €`);
});

console.log('\n— Boîtes : rendement moyen (valeur moyenne obtenue / prix) —');
const avgValue = RAR.map((_, r) => mean(BY_RARITY[r].map((c) => c.value)));
BOXES.forEach((b) => {
  const total = b.odds.reduce((s, o) => s + o, 0);
  check(`${b.name} : somme des probabilités`, Math.round(total * 1000) / 1000, 100);
  const ev = b.odds.reduce((s, o, r) => s + (o / 100) * avgValue[r], 0);
  const y = ev / b.price;
  const want = EXPECTED.yields[b.id];
  check(`${b.name} (${b.price.toLocaleString('fr-FR')} €) : rendement`, fr(y, 3), `≈ ${fr(want)}`, Math.abs(y - want) <= EXPECTED.yieldTolerance);
});

console.log('\n— Boîtes thématiques (prix +25 %) —');
const off = [];
THEMES.forEach((t) => BOXES.forEach((b) => { if (!boxAvailable(b, t)) off.push(`${b.name} ${t.label}`); }));
console.log(`  ${THEMES.length} thèmes, ${off.length} combinaisons désactivées${off.length ? ' : ' + off.join(', ') : ''}`);
check('Box Garage thématique', boxPrice(BOXES[0], THEMES[1]), 4000);

console.log(failed ? '\n✗ Vérification ÉCHOUÉE' : '\n✓ Tout correspond');
process.exit(failed ? 1 : 0);
