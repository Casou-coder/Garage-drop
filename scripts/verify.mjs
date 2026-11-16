// Vérifie les invariants du catalogue et de l'économie. Lancer avec : npm run verify
// Sort en erreur (code 1) si une valeur attendue ne correspond plus.
import { createHash } from 'node:crypto';
import { INITIAL } from '../src/state/initial.js';
import { sanitizeSave, encodeSave, decodeSave } from '../src/state/transfer.js';
import { createCloud, needsRefresh } from '../src/cloud/client.js';
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

console.log('\n— Sauvegarde —');
{
  const state = { ...INITIAL, coins: 123456.7, name: 'Pilote é🚗', tapLevel: 4, opened: 3, discovered: [CARS[0].id, CARS[7].id],
    garage: [{ uid: 'a1', carId: CARS[7].id, serial: 12, paid: 900, at: 5 }] };
  const code = encodeSave(state);
  const back = decodeSave(code);
  check('Code de sauvegarde : aller-retour', ['coins', 'name', 'tapLevel', 'opened'].every((k) => back[k] === state[k])
    && JSON.stringify(back.garage) === JSON.stringify(state.garage) && back.discovered.length === 2 ? 'ok' : 'différent', 'ok');
  let rejected = false;
  try { decodeSave(code.slice(0, -8) + 'AAAAAAAA'); } catch (e) { rejected = true; }
  try { decodeSave(code.replace('.', '.x')); rejected = false; } catch (e) { /* attendu */ }
  check('Code modifié ou tronqué refusé', rejected ? 'ok' : 'accepté', 'ok');
  // Sauvegarde du prototype (sans les nouveaux champs) et données abîmées
  const old = sanitizeSave({ coins: 10, tapLevel: 2, idleLevel: 1, garage: [{ uid: 'x', carId: 'vel-0-Y-s' }, { uid: 'y', carId: 'inconnue' }], discovered: ['vel-0-Y-s', 'nope'], opened: 1 });
  check('Ancienne sauvegarde reprise', old.garage.length === 1 && old.discovered.length === 1 && old.sound === true && old.tutorialDone === true ? 'ok' : 'cassée', 'ok');
  const junk = sanitizeSave({ coins: 'abc', tapLevel: -4, garage: 'x', discovered: null });
  check('Sauvegarde abîmée tolérée', junk.coins === INITIAL.coins && junk.tapLevel === 1 && junk.garage.length === 0 ? 'ok' : 'cassée', 'ok');
}

console.log('\n— Compte en ligne (faux serveur Supabase en mémoire) —');
{
  // Imite les réponses de Supabase (auth + table gd_saves avec RLS par utilisateur)
  const users = new Map(); const rows = new Map(); let n = 0;
  const reply = (status, body) => ({ ok: status < 300, status, text: async () => (body === undefined ? '' : JSON.stringify(body)) });
  const sessionOf = (u) => ({ access_token: 'at-' + u.id + '-' + (++n), refresh_token: 'rt-' + u.id, expires_in: 3600, user: { id: u.id, email: u.email } });
  const fetchImpl = async (url, { method, headers, body }) => {
    const u = new URL(url); const b = body ? JSON.parse(body) : {};
    if (headers.apikey !== 'cle') return reply(401, { message: 'Invalid API key' });
    const who = [...users.values()].find((x) => headers.Authorization.startsWith('Bearer at-' + x.id + '-'));
    if (u.pathname === '/auth/v1/signup') {
      if (users.has(b.email)) return reply(422, { error_code: 'user_already_exists', msg: 'User already registered' });
      if (b.password.length < 6) return reply(422, { error_code: 'weak_password', msg: 'Password should be at least 6 characters' });
      const user = { id: 'u' + (users.size + 1), email: b.email, password: b.password }; users.set(b.email, user);
      return reply(200, sessionOf(user));
    }
    if (u.pathname === '/auth/v1/token') {
      if (u.searchParams.get('grant_type') === 'refresh_token') {
        const user = [...users.values()].find((x) => 'rt-' + x.id === b.refresh_token);
        return user ? reply(200, sessionOf(user)) : reply(400, { error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
      }
      const user = users.get(b.email);
      return user && user.password === b.password ? reply(200, sessionOf(user)) : reply(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    }
    if (u.pathname === '/rest/v1/gd_saves') {
      if (!who) return reply(401, { message: 'JWT expired' });
      if (method === 'POST') {
        if (b.user_id !== who.id) return reply(403, { message: 'new row violates row-level security policy' });
        rows.set(who.id, { ...b, updated_at: b.updated_at.replace('Z', '+00:00') }); return reply(201, [rows.get(who.id)]);
      }
      if (method === 'DELETE') { rows.delete(who.id); return reply(204); }
      return reply(200, rows.has(who.id) ? [{ data: rows.get(who.id).data, updated_at: rows.get(who.id).updated_at }] : []);
    }
    return reply(404, { message: 'not found' });
  };
  const cloud = createCloud({ url: 'http://faux/', key: 'cle', fetchImpl });
  const msg = async (p) => { try { await p; return 'aucune erreur'; } catch (e) { return e.message; } };

  const { session } = await cloud.signUp('a@b.fr', 'secret1');
  check('Création de compte', session && session.user.email, 'a@b.fr');
  check('Compte déjà existant', await msg(cloud.signUp('a@b.fr', 'secret1')), 'Un compte existe déjà avec cet e-mail. Connecte-toi.');
  check('Mauvais mot de passe', await msg(cloud.signIn('a@b.fr', 'faux')), 'E-mail ou mot de passe incorrect.');
  const s1 = await cloud.signIn('a@b.fr', 'secret1');
  check('Aucune partie en ligne au départ', await cloud.getSave(s1), null);
  const state = { ...INITIAL, coins: 777, name: 'Pilote', discovered: [CARS[0].id, CARS[1].id] };
  const stamp = await cloud.putSave(s1, state);
  const row = await cloud.getSave(s1);
  check('Envoi puis relecture de la partie', row.data.coins === 777 && row.updated_at === stamp && sanitizeSave(row.data).discovered.length === 2 ? 'ok' : 'différent', 'ok');
  const s2 = await cloud.refresh({ ...s1, lastPushed: stamp });
  check('Renouvellement de session', s2.access_token !== s1.access_token && s2.lastPushed === stamp ? 'ok' : 'cassé', 'ok');
  check('Session expirée détectée', needsRefresh({ expires_at: Date.now() / 1000 - 5 }) && !needsRefresh(s2) ? 'ok' : 'cassé', 'ok');
  check('Jeton invalide refusé', await msg(cloud.getSave({ ...s1, access_token: 'at-inconnu' })), 'JWT expired');
  await cloud.deleteSave(s2);
  check('Suppression des données en ligne', await cloud.getSave(s2), null);
  const down = createCloud({ url: 'http://faux', key: 'cle', fetchImpl: async () => { throw new Error('offline'); } });
  check('Hors connexion', await msg(down.signIn('a@b.fr', 'secret1')), 'Pas de connexion. Vérifie ton réseau et réessaie.');
}

console.log(failed ? '\n✗ Vérification ÉCHOUÉE' : '\n✓ Tout correspond');
process.exit(failed ? 1 : 0);
