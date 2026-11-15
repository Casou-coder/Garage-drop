// Nettoyage des sauvegardes et « code de sauvegarde » pour transférer une partie d'un appareil à l'autre.
// Fichier pur (sans React) : testé par scripts/verify.mjs.
import { hash } from '../data/random.js';
import { CAR_MAP } from '../data/catalog.js';
import { INITIAL } from './initial.js';

const num = (v, def, min = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, v) : def);
const int = (v, def, min = 0) => Math.floor(num(v, def, min));

// Rend une sauvegarde sûre à charger, quelle que soit sa provenance (ancienne version, code collé, fichier abîmé)
export function sanitizeSave(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const garage = (Array.isArray(o.garage) ? o.garage : [])
    .filter((x) => x && typeof x.carId === 'string' && CAR_MAP[x.carId])
    .map((x, i) => ({
      uid: typeof x.uid === 'string' && x.uid ? x.uid : `r${i}${Date.now().toString(36)}`,
      carId: x.carId,
      serial: typeof x.serial === 'number' ? x.serial : null,
      paid: num(x.paid, 0),
      at: num(x.at, 0),
    }));
  const seenUid = new Set();
  garage.forEach((x, i) => { if (seenUid.has(x.uid)) x.uid = `${x.uid}-${i}`; seenUid.add(x.uid); });
  const discovered = [...new Set((Array.isArray(o.discovered) ? o.discovered : []).filter((id) => typeof id === 'string' && CAR_MAP[id]))];
  return {
    ...INITIAL,
    coins: num(o.coins, INITIAL.coins),
    tapLevel: int(o.tapLevel, 1, 1),
    idleLevel: int(o.idleLevel, 0),
    garage,
    discovered,
    lastDaily: num(o.lastDaily, 0),
    streak: int(o.streak, 0),
    lastSeen: num(o.lastSeen, Date.now()),
    opened: int(o.opened, 0),
    fast: !!o.fast,
    name: typeof o.name === 'string' ? o.name.slice(0, 16) : '',
    createdAt: num(o.createdAt, 0),
    taps: int(o.taps, 0),
    sound: o.sound !== false,
    haptics: o.haptics !== false,
    // Une partie déjà entamée n'a pas besoin du tutoriel
    tutorialDone: !!o.tutorialDone || int(o.opened, 0) > 0,
  };
}

/* Base64 (UTF-8), sans dépendre de btoa/atob */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function toBytes(str) {
  const esc = encodeURIComponent(str);
  const out = [];
  for (let i = 0; i < esc.length; i++) {
    if (esc[i] === '%') { out.push(parseInt(esc.slice(i + 1, i + 3), 16)); i += 2; } else out.push(esc.charCodeAt(i));
  }
  return out;
}
function fromBytes(bytes) {
  let esc = '';
  for (const b of bytes) esc += '%' + (b < 16 ? '0' : '') + b.toString(16);
  return decodeURIComponent(esc);
}
function b64encode(str) {
  const b = toBytes(str);
  let out = '';
  for (let i = 0; i < b.length; i += 3) {
    const n = (b[i] << 16) | ((b[i + 1] || 0) << 8) | (b[i + 2] || 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < b.length ? B64[(n >> 6) & 63] : '') + (i + 2 < b.length ? B64[n & 63] : '');
  }
  return out;
}
function b64decode(s) {
  const bytes = [];
  for (let i = 0; i < s.length; i += 4) {
    const c = [0, 1, 2, 3].map((k) => (i + k < s.length ? B64.indexOf(s[i + k]) : -1));
    if (c[0] < 0 || c[1] < 0) throw new Error('code invalide');
    const n = (c[0] << 18) | (c[1] << 12) | ((c[2] < 0 ? 0 : c[2]) << 6) | (c[3] < 0 ? 0 : c[3]);
    bytes.push((n >> 16) & 255);
    if (c[2] >= 0) bytes.push((n >> 8) & 255);
    if (c[3] >= 0) bytes.push(n & 255);
  }
  return fromBytes(bytes);
}

const PREFIX = 'GD2';
// Code de sauvegarde : GD2.<données>.<contrôle>
export function encodeSave(state) {
  const body = b64encode(JSON.stringify({ ...state, lastSeen: Date.now() }));
  return `${PREFIX}.${body}.${hash(body).toString(36)}`;
}
// Renvoie l'état restauré, ou lève une erreur si le code est incomplet ou invalide
export function decodeSave(code) {
  const parts = String(code || '').replace(/\s+/g, '').split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) throw new Error('Ce code ne vient pas de GarageDrop.');
  if (hash(parts[1]).toString(36) !== parts[2]) throw new Error('Code incomplet ou modifié. Copie-le en entier.');
  let data;
  try { data = JSON.parse(b64decode(parts[1])); } catch (e) { throw new Error('Code illisible.'); }
  return sanitizeSave(data);
}
