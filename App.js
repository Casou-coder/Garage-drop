import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, FlatList, Modal, Animated, Easing,
  SafeAreaView, StatusBar, Platform, Alert, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

/* ---------- Thème ---------- */
const C = {
  bg: '#1C2128', surface: '#262D36', surface2: '#303844', line: '#3A4350',
  text: '#F2EFE6', muted: '#9AA3AE', yellow: '#FFC93C', red: '#E2463A', green: '#3FBF7F',
};
const DISPLAY = Platform.select({ ios: 'AvenirNextCondensed-Heavy', default: undefined });
const DISPLAY_B = Platform.select({ ios: 'AvenirNextCondensed-DemiBold', default: undefined });
const SAVE_KEY = 'garagedrop-save-v2';

/* DATA START */
const DAY = 24 * 3600 * 1000;

// Hasard reproductible : le catalogue est identique à chaque lancement
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RAR = [
  { label: 'Commune', color: '#9AA4B2', base: 900 },
  { label: 'Rare', color: '#3B82F6', base: 7000 },
  { label: 'Épique', color: '#A855F7', base: 50000 },
  { label: 'Légendaire', color: '#F59E0B', base: 350000 },
  { label: 'Mythique', color: '#E2463A', base: 2500000 },
  { label: 'Prototype', color: '#2DD4BF', base: 18000000 },
];

const REGIONS = { eu: 'Europe', na: 'Amérique du Nord', as: 'Asie', oc: 'Océanie' };
const COUNTRIES = {
  it: { label: 'Italie', flag: '🇮🇹', region: 'eu' },
  de: { label: 'Allemagne', flag: '🇩🇪', region: 'eu' },
  fr: { label: 'France', flag: '🇫🇷', region: 'eu' },
  uk: { label: 'Royaume-Uni', flag: '🇬🇧', region: 'eu' },
  se: { label: 'Suède', flag: '🇸🇪', region: 'eu' },
  us: { label: 'États-Unis', flag: '🇺🇸', region: 'na' },
  jp: { label: 'Japon', flag: '🇯🇵', region: 'as' },
  kr: { label: 'Corée du Sud', flag: '🇰🇷', region: 'as' },
  cn: { label: 'Chine', flag: '🇨🇳', region: 'as' },
  au: { label: 'Australie', flag: '🇦🇺', region: 'oc' },
};

const EPOCHS = {
  P: { label: 'Avant-guerre', from: 1910, to: 1944, bonus: 2, power: 0.25 },
  C: { label: 'Classique', from: 1945, to: 1969, bonus: 1, power: 0.45 },
  Y: { label: 'Youngtimer', from: 1970, to: 1989, bonus: 1, power: 0.6 },
  M: { label: 'Moderne', from: 1990, to: 2014, bonus: 0, power: 0.85 },
  A: { label: 'Actuelle', from: 2015, to: 2026, bonus: 0, power: 1 },
};
const EPOCH_ORDER = ['P', 'C', 'Y', 'M', 'A'];

const SEGMENTS = {
  city: { label: 'Citadine', tier: 0, hp: 75 },
  berline: { label: 'Berline', tier: 0, hp: 140 },
  wagon: { label: 'Break', tier: 0, hp: 130 },
  suv: { label: 'SUV', tier: 0, hp: 190 },
  pickup: { label: 'Pick-up', tier: 0, hp: 260 },
  offroad: { label: 'Tout-terrain', tier: 1, hp: 170 },
  electric: { label: 'Électrique', tier: 1, hp: 320 },
  muscle: { label: 'Muscle car', tier: 1, hp: 420 },
  roadster: { label: 'Roadster', tier: 1, hp: 190 },
  sport: { label: 'Sportive', tier: 1, hp: 320 },
  rally: { label: 'Rallye', tier: 2, hp: 300 },
  gt: { label: 'Grand tourisme', tier: 2, hp: 460 },
  limo: { label: 'Limousine', tier: 2, hp: 360 },
  super: { label: 'Supercar', tier: 3, hp: 680 },
  hyper: { label: 'Hypercar', tier: 4, hp: 1150 },
};

// Chaque modèle existe en 5 versions, de plus en plus rares
const VARIANTS = {
  s: { label: 'Standard', bump: 0 },
  e: { label: 'Édition spéciale', bump: 1 },
  c: { label: 'Finition carbone', bump: 2 },
  l: { label: 'Série limitée', bump: 2, serial: 500 },
  x: { label: 'Chrome', bump: 3, serial: 50 },
};
const VKEYS = ['s', 'e', 'c', 'l', 'x'];

const PAL = {
  rosso: ['#C1121F', '#FFBA08', '#F8F9FA', '#14213D', '#2A9D8F', '#E85D04'],
  sober: ['#ADB5BD', '#495057', '#F1F3F5', '#1D3557', '#6C757D', '#22223B'],
  pop: ['#E9C46A', '#E76F51', '#8ECAE6', '#F4F1DE', '#6B8F71', '#B5C9C3'],
  luxe: ['#1B263B', '#5C4033', '#E9E3D5', '#2D6A4F', '#6D2E46', '#C0C7CE'],
  us: ['#9D0208', '#003049', '#FCBF49', '#2B9348', '#F1FAEE', '#3A3A3A'],
  jp: ['#F1F1F1', '#4361EE', '#D00000', '#FFB703', '#7209B7', '#2B2D42'],
  nord: ['#8D99AE', '#3D405B', '#CAD2C5', '#52796F', '#EDF2F4', '#354F52'],
};

// Marques fictives. Format d'une gamme : "Nom:segment:époques" (P C Y M A)
// Pour agrandir le catalogue, il suffit d'ajouter des gammes ou des marques ici.
const BRANDS = [
  { id: 'vel', name: 'Vellano', country: 'it', prestige: 2, pal: 'rosso', lines: 'Furia:super:YMA|Inferno:hyper:A|Saetta:super:MA|Tempesta:super:Y|Alba:gt:CMA|Libeccio:sport:C|Lampo:hyper:M|Vento 250:gt:C' },
  { id: 'bra', name: 'Bravura', country: 'it', prestige: 1, pal: 'rosso', lines: 'Rally:rally:YM|Sprint:sport:CYA|Allegra:city:CYMA|Lido:roadster:CY|Montagna:suv:A|Bianca:berline:MA' },
  { id: 'str', name: 'Strada', country: 'it', prestige: 0, pal: 'pop', lines: 'Pico:city:CYMA|Campo:suv:MA|Famiglia:wagon:YM|Viale:berline:YMA|Mare:electric:A' },
  { id: 'kra', name: 'Kraußer', country: 'de', prestige: 1, pal: 'sober', lines: 'K4:berline:MA|Tourer:wagon:YMA|GT Turbo:sport:YMA|Nachtfalke:super:MA|Seeadler:gt:C|Bergsteiger:suv:MA|Donner:sport:C' },
  { id: 'ost', name: 'Ostwerk', country: 'de', prestige: 0, pal: 'pop', lines: 'Biene:city:CY|Kompakt:city:YMA|Reise:wagon:YM|Strom:electric:A|Vario:berline:YMA|Gelände:offroad:YM' },
  { id: 'hal', name: 'Halden', country: 'de', prestige: 2, pal: 'luxe', lines: 'Imperator:limo:PCM|Souverän:gt:CYMA|Silbermond:limo:A|Prinz:gt:P' },
  { id: 'mon', name: 'Montclair', country: 'fr', prestige: 1, pal: 'luxe', lines: 'Avenue:berline:YMA|Esterel:roadster:CYM|Grand Tourer:gt:MA|Céleste:gt:C|Belvédère:suv:A' },
  { id: 'riv', name: 'Rivière', country: 'fr', prestige: 0, pal: 'pop', lines: 'Pétale:city:YMA|Galopin:city:C|Rallye R:rally:YM|Volta:electric:A|Familiale:wagon:YM|Escapade:suv:MA|Croisière:berline:CYM' },
  { id: 'del', name: 'Delaroque', country: 'fr', prestige: 2, pal: 'luxe', lines: 'Type D:limo:P|Atlantide:gt:P|Majestic:limo:C|Renaissance:hyper:A' },
  { id: 'ash', name: 'Ashcombe', country: 'uk', prestige: 2, pal: 'luxe', lines: 'Windmere:limo:CMA|Regent:gt:YMA|Belgravia:gt:C|Henley:roadster:PC' },
  { id: 'kes', name: 'Kestrel', country: 'uk', prestige: 1, pal: 'nord', lines: 'Goshawk:roadster:CY|Merlin:sport:MA|Peregrine:super:A|Hobby:sport:Y|Kite:roadster:M' },
  { id: 'tho', name: 'Thornbury', country: 'uk', prestige: 1, pal: 'nord', lines: 'Fell:offroad:CYM|Moorland:suv:MA|Quarry:offroad:A|Ridgeback:offroad:A' },
  { id: 'nor', name: 'Nordvik', country: 'se', prestige: 0, pal: 'nord', lines: 'Fjord:berline:YMA|Ridge:suv:MA|Kombi:wagon:CYM|Norrsken:electric:A|Granit:berline:C' },
  { id: 'ban', name: 'Bannerman', country: 'us', prestige: 0, pal: 'us', lines: 'Homestead:pickup:CYMA|Interstate:berline:CYM|Pioneer:suv:MA|Thunderhead:muscle:CA' },
  { id: 'rid', name: 'Ridgeway', country: 'us', prestige: 0, pal: 'us', lines: 'Prospector:pickup:YMA|Badlands:offroad:CYM|Lodge:suv:MA|Drifter:wagon:CY' },
  { id: 'sta', name: 'Stallard', country: 'us', prestige: 1, pal: 'us', lines: 'Twister:muscle:CY|Hammerhead:muscle:A|Sidewinder:sport:YM|Thunder Road:muscle:C|Apex GT:super:A' },
  { id: 'hlr', name: 'Halloran', country: 'us', prestige: 2, pal: 'luxe', lines: 'Presidential:limo:PCYMA|Boulevard:gt:CY|Pinnacle:berline:MA|Coastline:roadster:C' },
  { id: 'vol', name: 'Voltaic', country: 'us', prestige: 1, pal: 'nord', lines: 'Arc:electric:A|Surge:electric:A|Ampere:hyper:A|Ohm:city:A|Coil:suv:A' },
  { id: 'hay', name: 'Hayashi', country: 'jp', prestige: 0, pal: 'jp', lines: 'Kei:city:YMA|Drift GT:sport:YM|Raijin:super:A|Hanami:berline:CYMA|Kumo:suv:MA|Tora:rally:YM' },
  { id: 'kaz', name: 'Kazane', country: 'jp', prestige: 1, pal: 'jp', lines: 'Shinden:sport:YMA|Tsukuyomi:gt:MA|Kamikaze R:super:MA|Hayate:sport:C|Ronin:roadster:YM' },
  { id: 'tsu', name: 'Tsurugi', country: 'jp', prestige: 2, pal: 'jp', lines: 'Raikiri:hyper:A|Masamune:super:MA|Daimyo:gt:A' },
  { id: 'miz', name: 'Mizuho', country: 'jp', prestige: 0, pal: 'pop', lines: 'Mame:city:CY|Hotaru:electric:A|Yama:suv:MA|Tanuki:city:MA|Kaze:wagon:YM' },
  { id: 'han', name: 'Hanbit', country: 'kr', prestige: 0, pal: 'sober', lines: 'Haneul:city:MA|Bada:berline:MA|Sanmaru:suv:MA|Bit:electric:A|Pado:sport:A' },
  { id: 'lon', name: 'Longhai', country: 'cn', prestige: 0, pal: 'sober', lines: 'Jade:electric:A|Longwei:suv:A|Qinghe:berline:MA|Feng:hyper:A' },
  { id: 'kur', name: 'Kurrajong', country: 'au', prestige: 0, pal: 'us', lines: 'Drover:pickup:CYMA|Bushranger:muscle:YM|Dingo:offroad:YM' },
];
const BRAND_MAP = Object.fromEntries(BRANDS.map((b) => [b.id, b]));

/* Génération du catalogue */
const CARS = [];
const MODELS = [];
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
const CAR_MAP = Object.fromEntries(CARS.map((c) => [c.id, c]));
const BY_RARITY = RAR.map((_, i) => CARS.filter((c) => c.rarity === i));
const MODELS_BY_BRAND = Object.fromEntries(BRANDS.map((b) => [b.id, MODELS.filter((m) => m.brand === b.id)]));

const THEMES = [
  { id: 'all', label: 'Tout le catalogue', f: null },
  { id: 'eu', label: 'Europe', f: (c) => c.region === 'eu' },
  { id: 'na', label: 'Amérique du Nord', f: (c) => c.region === 'na' },
  { id: 'as', label: 'Asie', f: (c) => c.region === 'as' },
  { id: 'oc', label: 'Océanie', f: (c) => c.region === 'oc' },
  { id: 'it', label: 'Italie', f: (c) => c.country === 'it' },
  { id: 'de', label: 'Allemagne', f: (c) => c.country === 'de' },
  { id: 'fr', label: 'France', f: (c) => c.country === 'fr' },
  { id: 'uk', label: 'Royaume-Uni', f: (c) => c.country === 'uk' },
  { id: 'us', label: 'États-Unis', f: (c) => c.country === 'us' },
  { id: 'jp', label: 'Japon', f: (c) => c.country === 'jp' },
  { id: 'hist', label: 'Historiques', f: (c) => c.epoch === 'P' || c.epoch === 'C' },
  { id: 'young', label: 'Youngtimers', f: (c) => c.epoch === 'Y' },
  { id: 'sport', label: 'Sportives', f: (c) => ['sport', 'rally', 'roadster', 'muscle'].includes(c.seg) },
  { id: 'lux', label: 'Luxe', f: (c) => ['gt', 'limo'].includes(c.seg) || BRAND_MAP[c.brand].prestige === 2 },
  { id: 'exo', label: 'Supercars', f: (c) => c.seg === 'super' || c.seg === 'hyper' },
  { id: 'ev', label: 'Électriques', f: (c) => c.seg === 'electric' },
  { id: 'tt', label: 'Tout-terrain', f: (c) => ['offroad', 'pickup', 'suv'].includes(c.seg) },
];

// Probabilités en % par rareté (Commune → Prototype), affichées aux joueurs
const BOXES = [
  { id: 'garage', name: 'Box Garage', price: 3200, color: '#7C8794', odds: [86, 12.5, 1.35, 0.14, 0.01, 0] },
  { id: 'sport', name: 'Box Sport', price: 19000, color: '#3B82F6', odds: [45, 45, 8.5, 1.4, 0.1, 0] },
  { id: 'luxe', name: 'Box Luxe', price: 110000, color: '#A855F7', odds: [0, 50, 40, 9, 0.95, 0.05] },
  { id: 'super', name: 'Box Supercar', price: 500000, color: '#F59E0B', odds: [0, 0, 55, 38, 6.6, 0.4] },
  { id: 'hyper', name: 'Box Hypercar', price: 2300000, color: '#E2463A', odds: [0, 0, 0, 60, 36, 4] },
  { id: 'proto', name: 'Box Prototype', price: 7000000, color: '#2DD4BF', odds: [0, 0, 0, 0, 80, 20] },
];
const THEME_MARKUP = 1.25;
// Une boîte thématique n'est disponible que si le thème contient sa rareté la plus basse
const boxAvailable = (box, theme) => !theme.f || BY_RARITY[box.odds.findIndex((o) => o > 0)].some(theme.f);
const boxPrice = (box, theme) => (theme.id === 'all' ? box.price : Math.round(box.price * THEME_MARKUP / 100) * 100);

function rollRarity(odds) {
  const r = Math.random() * 100;
  let acc = 0;
  for (let i = 0; i < odds.length; i++) { acc += odds[i]; if (r < acc) return i; }
  return odds.findLastIndex ? odds.findLastIndex((o) => o > 0) : odds.length - 1;
}
function pickCar(r, f) {
  const order = [r];
  for (let d = 1; d < 6; d++) { if (r - d >= 0) order.push(r - d); if (r + d < 6) order.push(r + d); }
  for (const k of order) {
    const pool = f ? BY_RARITY[k].filter(f) : BY_RARITY[k];
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return CARS[0];
}
/* DATA END */

/* ---------- Marché, économie ---------- */
const dayIndex = () => Math.floor(Date.now() / DAY);
function marketFactor(modelId, d) {
  const h = hash(modelId) % 1000;
  return 1 + 0.12 * Math.sin(d * 0.9 + h) + 0.05 * Math.sin(d * 2.3 + h * 0.7);
}
const quote = (car, d = dayIndex()) => Math.round(car.value * marketFactor(car.model, d));

const tapValue = (l) => Math.round(10 * Math.pow(l, 1.6));
const tapCost = (l) => Math.round(150 * Math.pow(1.55, l));
const idlePerSec = (l) => (l === 0 ? 0 : Math.round(8 * Math.pow(l, 1.7)));
const idleCost = (l) => Math.round(400 * Math.pow(1.6, l));
const garageValue = (g) => g.reduce((a, x) => a + (CAR_MAP[x.carId]?.value || 0), 0);
const showroomPerSec = (v) => v * 0.00002;
const brandComplete = (disc, bid) => MODELS_BY_BRAND[bid].every((m) => disc.has(m.id + '-s'));
const completedBrands = (disc) => BRANDS.filter((b) => brandComplete(disc, b.id)).length;
const accel = (hp) => Math.max(1.9, 221 * Math.pow(hp, -0.65));
const vmax = (hp) => Math.round(110 + hp * 0.27);

const INITIAL = { coins: 3500, tapLevel: 1, idleLevel: 0, garage: [], discovered: [], lastDaily: 0, streak: 0, lastSeen: Date.now(), opened: 0, fast: false };

/* ---------- Utilitaires ---------- */
function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace('.', ',') + ' Md €';
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace('.', ',') + ' M €';
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const carName = (c) => `${BRAND_MAP[c.brand].name} ${c.name}`;
const flagOf = (c) => COUNTRIES[c.country].flag;
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}
function hap(kind) {
  try {
    const p = kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : kind === 'big'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

/* ---------- Dessin des voitures ---------- */
const SHAPES = {
  city: { cl: 30, cw: 82, ct: 14, ch: 26, bt: 36, bh: 26, r1: 18, r2: 14 },
  berline: { cl: 38, cw: 74, ct: 18, ch: 22, bt: 38, bh: 22, r1: 16, r2: 12 },
  wagon: { cl: 26, cw: 96, ct: 18, ch: 22, bt: 38, bh: 22, r1: 4, r2: 14 },
  limo: { cl: 30, cw: 90, ct: 18, ch: 22, bt: 38, bh: 22, r1: 12, r2: 12 },
  suv: { cl: 24, cw: 104, ct: 10, ch: 28, bt: 36, bh: 28, r1: 6, r2: 10, ws: 28 },
  offroad: { cl: 26, cw: 92, ct: 8, ch: 30, bt: 36, bh: 28, r1: 3, r2: 4, ws: 30 },
  pickup: { cl: 66, cw: 52, ct: 12, ch: 26, bt: 36, bh: 28, r1: 4, r2: 10, ws: 28 },
  electric: { cl: 34, cw: 84, ct: 18, ch: 22, bt: 38, bh: 22, r1: 28, r2: 22 },
  muscle: { cl: 52, cw: 56, ct: 22, ch: 20, bt: 38, bh: 24, r1: 8, r2: 12 },
  roadster: { cl: 84, cw: 10, ct: 28, ch: 14, bt: 40, bh: 20, r1: 2, r2: 6, open: true },
  sport: { cl: 46, cw: 60, ct: 22, ch: 20, bt: 40, bh: 20, r1: 22, r2: 10 },
  rally: { cl: 44, cw: 64, ct: 20, ch: 22, bt: 40, bh: 20, r1: 14, r2: 10 },
  gt: { cl: 42, cw: 62, ct: 22, ch: 20, bt: 40, bh: 20, r1: 24, r2: 12 },
  super: { cl: 54, cw: 52, ct: 28, ch: 16, bt: 42, bh: 18, r1: 24, r2: 8 },
  hyper: { cl: 58, cw: 46, ct: 32, ch: 14, bt: 44, bh: 17, r1: 22, r2: 6, wing: true },
  prewar: { cl: 30, cw: 48, ct: 6, ch: 34, bt: 40, bh: 18, r1: 4, r2: 4, ws: 30, fenders: true },
};

function CarArt({ car, width = 160, ghost = false }) {
  const s = width / 160;
  const sh = SHAPES[car.epoch === 'P' ? 'prewar' : car.seg] || SHAPES.berline;
  const v = car.variant || 's';
  const paint = ghost ? C.line : v === 'c' ? '#2C3036' : v === 'x' ? '#D3D9DF' : car.color;
  const ws = sh.ws || 26;
  const wTop = (sh.bt + sh.bh - ws * 0.55) * s;
  const bodyR = (car.epoch === 'C' ? 14 : car.epoch === 'P' ? 5 : 10) * s;
  const hub = ghost ? C.surface2 : v === 'l' ? '#D4AF37' : v === 'x' ? '#FFFFFF' : '#B8BEC6';
  const accent = lum(car.color) > 0.6 ? '#1C2128' : '#F2EFE6';
  const wheels = [22, 160 - 22 - ws];

  return (
    <View style={{ width, height: 84 * s }}>
      <View style={{ position: 'absolute', left: 16 * s, right: 16 * s, top: 76 * s, height: 5 * s, borderRadius: 3 * s, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      {sh.wing && (
        <>
          <View style={{ position: 'absolute', left: 8 * s, top: (sh.bt - 9) * s, width: 26 * s, height: 4 * s, borderRadius: 2 * s, backgroundColor: paint }} />
          <View style={{ position: 'absolute', left: 18 * s, top: (sh.bt - 6) * s, width: 4 * s, height: 7 * s, backgroundColor: paint }} />
        </>
      )}
      {!sh.open && (
        <View style={{ position: 'absolute', left: sh.cl * s, top: sh.ct * s, width: sh.cw * s, height: (sh.ch + 6) * s, backgroundColor: paint, borderTopLeftRadius: sh.r1 * s, borderTopRightRadius: sh.r2 * s, overflow: 'hidden' }}>
          {!ghost && <View style={{ position: 'absolute', left: 6 * s, right: 6 * s, top: 5 * s, height: (sh.ch - 6) * s, backgroundColor: '#BFD7EA', opacity: 0.85, borderTopLeftRadius: Math.max(sh.r1 - 4, 1) * s, borderTopRightRadius: Math.max(sh.r2 - 4, 1) * s }} />}
        </View>
      )}
      {sh.open && !ghost && (
        <View style={{ position: 'absolute', left: sh.cl * s, top: sh.ct * s, width: sh.cw * s, height: (sh.ch + 4) * s, backgroundColor: '#BFD7EA', opacity: 0.8, borderTopRightRadius: sh.r2 * s }} />
      )}
      {sh.fenders && wheels.map((wl, i) => (
        <View key={'f' + i} style={{ position: 'absolute', left: (wl - 5) * s, top: wTop - 6 * s, width: (ws + 10) * s, height: ((ws + 10) / 2 + 4) * s, backgroundColor: paint, borderTopLeftRadius: ((ws + 10) / 2) * s, borderTopRightRadius: ((ws + 10) / 2) * s }} />
      ))}
      <View style={{ position: 'absolute', left: 4 * s, right: 4 * s, top: sh.bt * s, height: sh.bh * s, backgroundColor: paint, borderRadius: bodyR, overflow: 'hidden' }}>
        {!ghost && (
          <>
            {v === 'c' && Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: i * 13 * s, width: 6 * s, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            ))}
            {v === 'x' && <View style={{ position: 'absolute', left: 0, right: 0, top: 2 * s, height: sh.bh * 0.28 * s, backgroundColor: 'rgba(255,255,255,0.6)' }} />}
            {v === 'e' && <View style={{ position: 'absolute', left: 8 * s, right: 8 * s, top: sh.bh * 0.42 * s, height: 4 * s, backgroundColor: accent }} />}
            {v === 'l' && <View style={{ position: 'absolute', left: 8 * s, right: 8 * s, top: sh.bh * 0.62 * s, height: 1.5 * s, backgroundColor: '#D4AF37' }} />}
            <View style={{ position: 'absolute', right: 3 * s, top: 5 * s, width: 8 * s, height: 5 * s, borderRadius: 2 * s, backgroundColor: '#FFF3B0' }} />
            <View style={{ position: 'absolute', left: 3 * s, top: 5 * s, width: 6 * s, height: 5 * s, borderRadius: 2 * s, backgroundColor: '#E63946' }} />
            {sh.open && <View style={{ position: 'absolute', left: (sh.cl - 48) * s, width: 44 * s, top: 0, height: 4 * s, backgroundColor: 'rgba(0,0,0,0.45)' }} />}
            {car.seg === 'rally' && (
              <View style={{ position: 'absolute', left: 66 * s, top: (sh.bh / 2 - 7) * s, width: 14 * s, height: 14 * s, borderRadius: 7 * s, backgroundColor: '#F2EFE6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 9 * s, fontWeight: '800', color: '#1C2128' }}>{(hash(car.model) % 9) + 1}</Text>
              </View>
            )}
          </>
        )}
      </View>
      {wheels.map((wl, i) => (
        <View key={'w' + i} style={{ position: 'absolute', left: wl * s, top: wTop, width: ws * s, height: ws * s, borderRadius: (ws / 2) * s, backgroundColor: '#111418', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: ws * 0.42 * s, height: ws * 0.42 * s, borderRadius: ws * 0.21 * s, backgroundColor: hub }} />
        </View>
      ))}
    </View>
  );
}

function BoxArt({ color, size = 64 }) {
  const sq = size / 8;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.14, backgroundColor: color, overflow: 'hidden' }}>
      {[0, 1].map((row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ width: sq, height: sq, backgroundColor: (i + row) % 2 ? '#F2EFE6' : '#14171C' }} />
          ))}
        </View>
      ))}
      <View style={{ position: 'absolute', left: size / 2 - sq / 2, top: sq * 2, bottom: 0, width: sq, backgroundColor: 'rgba(0,0,0,0.22)' }} />
    </View>
  );
}

function RarityTag({ r }) {
  return (
    <View style={[st.tag, { borderColor: RAR[r].color }]}>
      <Text style={[st.tagText, { color: RAR[r].color }]}>{RAR[r].label}</Text>
    </View>
  );
}

function Chip({ label, active, onPress, color }) {
  return (
    <Pressable onPress={onPress} style={[st.chip, active && { backgroundColor: color || C.yellow, borderColor: color || C.yellow }]}>
      <Text style={[st.chipText, active && { color: '#1C2128' }]}>{label}</Text>
    </Pressable>
  );
}

function ChipRow({ children }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ flexGrow: 0, marginBottom: 10 }}>
      {children}
    </ScrollView>
  );
}

function Trend({ car }) {
  const d = dayIndex();
  const now = quote(car, d), before = quote(car, d - 1);
  const pct = ((now - before) / before) * 100;
  const up = pct >= 0;
  return <Text style={{ color: up ? C.green : C.red, fontSize: 12 }}>{up ? '▲' : '▼'} {Math.abs(pct).toFixed(1).replace('.', ',')} %</Text>;
}

/* ---------- App ---------- */
export default function App() {
  const [s, setS] = useState(INITIAL);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('home');
  const [reveal, setReveal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const disc = useMemo(() => new Set(s.discovered), [s.discovered]);
  const done = useMemo(() => completedBrands(disc), [disc]);
  const value = useMemo(() => garageValue(s.garage), [s.garage]);
  const perSec = (idlePerSec(s.idleLevel) + showroomPerSec(value)) * (1 + 0.05 * done);
  const perSecRef = useRef(perSec);
  perSecRef.current = perSec;

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        if (raw) {
          const saved = { ...INITIAL, ...JSON.parse(raw) };
          saved.garage = saved.garage.filter((x) => CAR_MAP[x.carId]);
          const elapsed = Math.min((Date.now() - saved.lastSeen) / 1000, 7200);
          const d = new Set(saved.discovered);
          const rate = (idlePerSec(saved.idleLevel) + showroomPerSec(garageValue(saved.garage))) * (1 + 0.05 * completedBrands(d));
          const earned = Math.floor(rate * elapsed * 0.5);
          if (earned > 0) {
            saved.coins += earned;
            setTimeout(() => showToast(`Pendant ton absence : +${fmt(earned)}`), 700);
          }
          setS(saved);
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, lastSeen: Date.now() })).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [s, loaded]);

  useEffect(() => {
    const id = setInterval(() => {
      const r = perSecRef.current;
      if (r > 0) setS((p) => ({ ...p, coins: p.coins + r }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* Actions */
  const tap = () => { hap('tap'); setS((p) => ({ ...p, coins: p.coins + tapValue(p.tapLevel) })); };

  const openBox = (box, theme, n) => {
    if (!boxAvailable(box, theme)) return;
    const price = boxPrice(box, theme) * n;
    if (s.coins < price) return showToast(`Il te manque ${fmt(price - s.coins)}`);
    const seen = new Set(s.discovered);
    const items = Array.from({ length: n }, () => {
      const car = pickCar(rollRarity(box.odds), theme.f);
      const isNew = !seen.has(car.id);
      seen.add(car.id);
      const V = VARIANTS[car.variant];
      return { key: uid(), carId: car.id, serial: V.serial ? 1 + Math.floor(Math.random() * V.serial) : null, isNew, keep: isNew || car.rarity >= 2 };
    });
    hap('open');
    setS((p) => ({ ...p, coins: p.coins - price, opened: p.opened + n }));
    setReveal({ id: uid(), items, color: box.color });
  };

  const finishReveal = (items) => {
    const d = dayIndex();
    let gain = 0;
    const add = [];
    items.forEach((it) => {
      const q = quote(CAR_MAP[it.carId], d);
      if (it.keep) add.push({ uid: uid(), carId: it.carId, serial: it.serial, paid: q, at: Date.now() });
      else gain += q;
    });
    setS((p) => {
      const ds = new Set(p.discovered);
      items.forEach((it) => ds.add(it.carId));
      return { ...p, coins: p.coins + gain, garage: [...p.garage, ...add], discovered: [...ds] };
    });
    if (gain > 0) showToast(`Vendu : +${fmt(gain)}`);
    setReveal(null);
  };

  const tradeUp = (r) => {
    const mine = s.garage.filter((x) => CAR_MAP[x.carId].rarity === r)
      .sort((a, b) => CAR_MAP[a.carId].value - CAR_MAP[b.carId].value);
    if (r >= 5 || mine.length < 5) return;
    const used = new Set(mine.slice(0, 5).map((x) => x.uid));
    const car = pickCar(r + 1, null);
    const V = VARIANTS[car.variant];
    setS((p) => ({ ...p, garage: p.garage.filter((x) => !used.has(x.uid)) }));
    hap('open');
    setReveal({ id: uid(), color: RAR[r + 1].color, items: [{ key: uid(), carId: car.id, serial: V.serial ? 1 + Math.floor(Math.random() * V.serial) : null, isNew: !disc.has(car.id), keep: true }] });
  };

  const sellUid = (u) => {
    const item = s.garage.find((x) => x.uid === u);
    if (!item) return;
    const q = quote(CAR_MAP[item.carId]);
    setS((p) => ({ ...p, garage: p.garage.filter((x) => x.uid !== u), coins: p.coins + q }));
    showToast(`Vendue : +${fmt(q)}`);
    setDetail(null);
  };

  const sellDuplicates = () => {
    const seen = new Set();
    let gain = 0;
    const keep = [];
    const d = dayIndex();
    [...s.garage].sort((a, b) => (a.serial || 1e9) - (b.serial || 1e9)).forEach((x) => {
      if (seen.has(x.carId)) gain += quote(CAR_MAP[x.carId], d);
      else { seen.add(x.carId); keep.push(x); }
    });
    if (gain === 0) return showToast('Aucun doublon à vendre');
    setS((p) => ({ ...p, garage: keep, coins: p.coins + gain }));
    showToast(`Doublons vendus : +${fmt(gain)}`);
  };

  const claimDaily = () => {
    const since = Date.now() - s.lastDaily;
    if (since < DAY) {
      const left = DAY - since;
      return showToast(`Prochaine récompense dans ${Math.floor(left / 3600000)} h ${Math.ceil((left % 3600000) / 60000)} min`);
    }
    const streak = since < 2 * DAY ? s.streak + 1 : 1;
    const gift = Math.round(Math.max(3000, tapValue(s.tapLevel) * 300) * (1 + 0.25 * (Math.min(streak, 7) - 1)));
    hap('big');
    setS((p) => ({ ...p, coins: p.coins + gift, lastDaily: Date.now(), streak }));
    showToast(`Jour ${streak} : +${fmt(gift)}`);
  };

  const upgrade = (kind) => {
    const cost = kind === 'tap' ? tapCost(s.tapLevel) : idleCost(s.idleLevel);
    if (s.coins < cost) return showToast(`Il te manque ${fmt(cost - s.coins)}`);
    hap('open');
    setS((p) => (kind === 'tap'
      ? { ...p, coins: p.coins - cost, tapLevel: p.tapLevel + 1 }
      : { ...p, coins: p.coins - cost, idleLevel: p.idleLevel + 1 }));
  };

  const reset = () => Alert.alert('Recommencer à zéro ?', 'Ton garage, ton carnet et ton argent seront effacés.', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Effacer', style: 'destructive', onPress: () => setS({ ...INITIAL, lastSeen: Date.now() }) },
  ]);

  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="light-content" />
      <View style={st.header}>
        <Text style={st.brand}>GarageDrop</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={st.coins}>{fmt(s.coins)}</Text>
          <Text style={st.rate}>+{fmt(perSec)} / s</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen s={s} value={value} disc={disc} onTap={tap} onDaily={claimDaily} onOpenDetail={setDetail} />}
        {tab === 'boxes' && <BoxesScreen coins={s.coins} onOpen={openBox} />}
        {tab === 'garage' && <GarageScreen s={s} onOpenDetail={setDetail} onDup={sellDuplicates} onTrade={tradeUp} />}
        {tab === 'carnet' && <CarnetScreen disc={disc} done={done} onOpenDetail={setDetail} />}
        {tab === 'upgrades' && <UpgradesScreen s={s} done={done} onUpgrade={upgrade} onReset={reset} onFast={(v) => setS((p) => ({ ...p, fast: v }))} />}
      </View>

      {toast && <View style={st.toast}><Text style={st.toastText}>{toast}</Text></View>}

      <View style={st.tabs}>
        {[['home', 'Showroom'], ['boxes', 'Boîtes'], ['garage', 'Garage'], ['carnet', 'Carnet'], ['upgrades', 'Atelier']].map(([k, label]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={st.tabBtn}>
            <Text style={[st.tabText, tab === k && { color: C.text }]}>{label}</Text>
            <View style={[st.tabBar, tab === k && { backgroundColor: C.yellow }]} />
          </Pressable>
        ))}
      </View>

      <RevealModal reveal={reveal} fast={s.fast} onFinish={finishReveal} />
      <DetailModal detail={detail} s={s} onClose={() => setDetail(null)} onSell={sellUid} />
    </SafeAreaView>
  );
}

/* ---------- Showroom ---------- */
function HomeScreen({ s, value, disc, onTap, onDaily, onOpenDetail }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [floats, setFloats] = useState([]);
  const dailyReady = Date.now() - s.lastDaily >= DAY;
  const best = s.garage.length ? [...s.garage].sort((a, b) => CAR_MAP[b.carId].value - CAR_MAP[a.carId].value)[0] : null;
  const bestCar = best ? CAR_MAP[best.carId] : null;
  const goal = BOXES.find((b) => b.price > s.coins);

  const press = () => {
    onTap();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    const f = { id: uid(), anim: new Animated.Value(0), x: Math.random() * 140 - 70, v: tapValue(s.tapLevel) };
    setFloats((p) => [...p.slice(-8), f]);
    Animated.timing(f.anim, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true })
      .start(() => setFloats((p) => p.filter((x) => x.id !== f.id)));
  };

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 20 }}>
      <Pressable onPress={press}>
        <Animated.View style={[st.turntable, { transform: [{ scale }] }]}>
          <View style={st.turntableInner}>
            {bestCar ? <CarArt car={bestCar} width={210} /> : <CarArt car={CARS[0]} width={210} ghost />}
          </View>
          {floats.map((f) => (
            <Animated.Text key={f.id} style={[st.float, {
              opacity: f.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [{ translateX: f.x }, { translateY: f.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -90] }) }],
            }]}>+{fmt(f.v)}</Animated.Text>
          ))}
        </Animated.View>
      </Pressable>

      {bestCar ? (
        <Pressable onPress={() => onOpenDetail({ uid: best.uid })}>
          <Text style={st.hint}>{flagOf(bestCar)} {carName(bestCar)} {bestCar.year}, ta plus belle pièce</Text>
        </Pressable>
      ) : (
        <Text style={st.hint}>Tape sur le plateau pour gagner de quoi ouvrir ta première boîte</Text>
      )}

      <View style={st.statsRow}>
        <Stat label="Par tap" value={fmt(tapValue(s.tapLevel))} />
        <Stat label="Valeur du garage" value={fmt(value)} />
        <Stat label="Carnet" value={`${disc.size}/${CARS.length}`} />
      </View>

      {goal && (
        <View style={st.goal}>
          <Text style={st.goalText}>{goal.name} dans {fmt(goal.price - s.coins)}</Text>
          <View style={st.barBg}><View style={[st.barFill, { width: `${Math.min(100, (s.coins / goal.price) * 100)}%` }]} /></View>
        </View>
      )}

      <Pressable onPress={onDaily} style={[st.cta, !dailyReady && st.ctaOff]}>
        <Text style={[st.ctaText, !dailyReady && { color: C.muted }]}>
          {dailyReady ? 'Récupérer la récompense du jour' : `Série de ${s.streak} jour${s.streak > 1 ? 's' : ''}, reviens demain`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

/* ---------- Boîtes ---------- */
function BoxesScreen({ coins, onOpen }) {
  const [theme, setTheme] = useState(THEMES[0]);
  return (
    <View style={{ flex: 1, paddingTop: 12 }}>
      <ChipRow>
        {THEMES.map((t) => <Chip key={t.id} label={t.label} active={theme.id === t.id} onPress={() => setTheme(t)} />)}
      </ChipRow>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12 }}>
        {theme.id !== 'all' && (
          <Text style={st.sectionHint}>Seules des voitures {theme.label === 'Europe' || theme.label === 'Asie' || theme.label === 'Océanie' ? `d'${theme.label}` : `de la catégorie ${theme.label}`} peuvent sortir. Ciblage facturé 25 % de plus.</Text>
        )}
        {BOXES.map((b) => {
          const price = boxPrice(b, theme);
          const ok1 = coins >= price, ok5 = coins >= price * 5;
          if (!boxAvailable(b, theme)) return (
            <View key={b.id} style={[st.boxRow, { opacity: 0.45 }]}>
              <BoxArt color={C.line} />
              <View style={{ flex: 1, marginLeft: 14, justifyContent: 'center' }}>
                <Text style={st.boxName}>{b.name}</Text>
                <Text style={st.carMeta}>Pas de voiture de cette gamme dans ce thème.</Text>
              </View>
            </View>
          );
          return (
            <View key={b.id} style={st.boxRow}>
              <BoxArt color={b.color} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={st.boxName}>{b.name}{theme.id !== 'all' ? ` ${theme.label}` : ''}</Text>
                <View style={st.oddsWrap}>
                  {b.odds.map((p, r) => p > 0 && (
                    <Text key={r} style={[st.odds, { color: RAR[r].color }]}>{RAR[r].label} {String(p).replace('.', ',')} %</Text>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => onOpen(b, theme, 1)} style={[st.buy, { flex: 2 }, !ok1 && st.buyOff]}>
                    <Text style={[st.buyText, !ok1 && { color: C.muted }]}>Ouvrir pour {fmt(price)}</Text>
                  </Pressable>
                  <Pressable onPress={() => onOpen(b, theme, 5)} style={[st.buy5, !ok5 && { opacity: 0.4 }]}>
                    <Text style={st.buy5Text}>×5</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ---------- Garage ---------- */
function GarageScreen({ s, onOpenDetail, onDup, onTrade }) {
  const [sort, setSort] = useState('value');
  const [rf, setRf] = useState(-1);
  const [reg, setReg] = useState('all');
  const d = dayIndex();

  const list = useMemo(() => {
    let l = s.garage.filter((x) => {
      const c = CAR_MAP[x.carId];
      return (rf < 0 || c.rarity === rf) && (reg === 'all' || c.region === reg);
    });
    if (sort === 'value') l = l.sort((a, b) => CAR_MAP[b.carId].value - CAR_MAP[a.carId].value);
    if (sort === 'rarity') l = l.sort((a, b) => CAR_MAP[b.carId].rarity - CAR_MAP[a.carId].rarity || CAR_MAP[b.carId].value - CAR_MAP[a.carId].value);
    if (sort === 'recent') l = l.sort((a, b) => b.at - a.at);
    if (sort === 'year') l = l.sort((a, b) => CAR_MAP[a.carId].year - CAR_MAP[b.carId].year);
    return l;
  }, [s.garage, sort, rf, reg]);

  const total = s.garage.reduce((a, x) => a + quote(CAR_MAP[x.carId], d), 0);
  const countBy = (r) => s.garage.filter((x) => CAR_MAP[x.carId].rarity === r).length;

  const header = (
    <View>
      <View style={[st.garageHead, { paddingHorizontal: 16 }]}>
        <View>
          <Text style={st.garageValue}>{fmt(total)}</Text>
          <Text style={st.statLabel}>{s.garage.length} voitures au cours du jour</Text>
        </View>
        <Pressable onPress={onDup} style={st.smallBtn}><Text style={st.smallBtnText}>Vendre les doublons</Text></Pressable>
      </View>

      <Text style={[st.section, { paddingHorizontal: 16 }]}>Échanges</Text>
      <Text style={[st.sectionHint, { paddingHorizontal: 16 }]}>Cinq voitures d'une rareté contre une de la rareté au-dessus. Les moins chères partent en premier.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ marginBottom: 18 }}>
        {RAR.slice(0, 5).map((R, r) => {
          const n = countBy(r);
          const ok = n >= 5;
          return (
            <Pressable key={r} onPress={() => onTrade(r)} disabled={!ok} style={[st.tradeCard, { borderColor: ok ? RAR[r + 1].color : C.line }, !ok && { opacity: 0.5 }]}>
              <Text style={[st.tradeText, { color: R.color }]}>{Math.min(n, 5)}/5 {R.label}</Text>
              <Text style={st.carMeta}>donne 1 {RAR[r + 1].label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ChipRow>
        {[['value', 'Valeur'], ['rarity', 'Rareté'], ['year', 'Année'], ['recent', 'Récentes']].map(([k, l]) => (
          <Chip key={k} label={l} active={sort === k} onPress={() => setSort(k)} />
        ))}
      </ChipRow>
      <ChipRow>
        <Chip label="Toutes raretés" active={rf < 0} onPress={() => setRf(-1)} />
        {RAR.map((R, r) => <Chip key={r} label={R.label} color={R.color} active={rf === r} onPress={() => setRf(r)} />)}
      </ChipRow>
      <ChipRow>
        <Chip label="Toutes régions" active={reg === 'all'} onPress={() => setReg('all')} />
        {Object.entries(REGIONS).map(([k, l]) => <Chip key={k} label={l} active={reg === k} onPress={() => setReg(k)} />)}
      </ChipRow>
      {list.length === 0 && (
        <Text style={[st.sectionHint, { paddingHorizontal: 16 }]}>
          {s.garage.length === 0 ? 'Ton garage est vide. Ouvre une boîte pour y garer ta première voiture.' : 'Aucune voiture ne correspond à ces filtres.'}
        </Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={list}
      keyExtractor={(x) => x.uid}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      initialNumToRender={12}
      windowSize={7}
      renderItem={({ item }) => {
        const car = CAR_MAP[item.carId];
        return (
          <Pressable onPress={() => onOpenDetail({ uid: item.uid })} style={[st.carRow, { borderLeftColor: RAR[car.rarity].color }]}>
            <CarArt car={car} width={90} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={st.carName} numberOfLines={1}>{flagOf(car)} {carName(car)}</Text>
              <Text style={st.carMeta} numberOfLines={1}>
                {car.year}{car.variant !== 's' ? `, ${VARIANTS[car.variant].label}` : ''}{item.serial ? ` n° ${item.serial}/${VARIANTS[car.variant].serial}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                <Text style={[st.carMeta, { color: C.text, marginTop: 0 }]}>{fmt(quote(car, d))}</Text>
                <Trend car={car} />
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

/* ---------- Carnet de collection ---------- */
const GROUPINGS = {
  brand: { label: 'Marques', key: (m) => m.brand, order: BRANDS.map((b) => b.id), title: (k) => `${COUNTRIES[BRAND_MAP[k].country].flag} ${BRAND_MAP[k].name}` },
  region: { label: 'Régions', key: (m) => m.region, order: Object.keys(REGIONS), title: (k) => REGIONS[k] },
  country: { label: 'Pays', key: (m) => m.country, order: Object.keys(COUNTRIES), title: (k) => `${COUNTRIES[k].flag} ${COUNTRIES[k].label}` },
  seg: { label: 'Catégories', key: (m) => m.seg, order: Object.keys(SEGMENTS), title: (k) => SEGMENTS[k].label },
  epoch: { label: 'Époques', key: (m) => m.epoch, order: EPOCH_ORDER, title: (k) => `${EPOCHS[k].label} (${EPOCHS[k].from}-${EPOCHS[k].to})` },
};

function CarnetScreen({ disc, done, onOpenDetail }) {
  const [mode, setMode] = useState('brand');
  const [group, setGroup] = useState(null);
  const G = GROUPINGS[mode];

  const groups = useMemo(() => G.order.map((k) => {
    const models = MODELS.filter((m) => G.key(m) === k);
    const got = models.reduce((a, m) => a + m.cars.filter((c) => disc.has(c.id)).length, 0);
    return { k, models, got, total: models.length * 5 };
  }).filter((g) => g.models.length), [mode, disc]);

  if (group) {
    const g = groups.find((x) => x.k === group);
    const models = [...g.models].sort((a, b) => (mode === 'brand' ? a.line - b.line || a.year - b.year : a.brand.localeCompare(b.brand) || a.year - b.year));
    return (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Pressable onPress={() => setGroup(null)}><Text style={{ color: C.yellow, fontSize: 15 }}>‹ {G.label}</Text></Pressable>
          <Text style={[st.garageValue, { marginTop: 6 }]}>{G.title(group)}</Text>
          <Text style={st.statLabel}>{g.got}/{g.total} versions découvertes, {g.models.length} modèles</Text>
          {mode === 'brand' && (
            <Text style={[st.sectionHint, { marginTop: 6 }]}>
              {brandComplete(disc, group) ? 'Marque complète : +5 % sur tes revenus passifs.' : 'Découvre la version standard de chaque modèle pour gagner +5 % de revenus passifs.'}
            </Text>
          )}
        </View>
        <FlatList
          data={models}
          keyExtractor={(m) => m.id}
          initialNumToRender={10}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item: m }) => {
            const found = m.cars.filter((c) => disc.has(c.id));
            const bestFound = found.sort((a, b) => b.rarity - a.rarity)[0];
            return (
              <Pressable onPress={() => onOpenDetail(bestFound ? { carId: bestFound.id } : { carId: m.cars[0].id, ghost: true })} style={[st.carRow, { borderLeftColor: bestFound ? RAR[bestFound.rarity].color : C.line }]}>
                <CarArt car={bestFound || m.cars[0]} width={90} ghost={!bestFound} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[st.carName, !bestFound && { color: C.muted }]} numberOfLines={1}>
                    {COUNTRIES[m.country].flag} {BRAND_MAP[m.brand].name} {bestFound ? m.name : '???'}
                  </Text>
                  <Text style={st.carMeta}>{m.year}, {SEGMENTS[m.seg].label}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    {m.cars.map((c) => (
                      <View key={c.id} style={[st.dot, { borderColor: RAR[c.rarity].color }, disc.has(c.id) && { backgroundColor: RAR[c.rarity].color }]} />
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: 12 }}>
      <ChipRow>
        {Object.entries(GROUPINGS).map(([k, g]) => <Chip key={k} label={g.label} active={mode === k} onPress={() => setMode(k)} />)}
      </ChipRow>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 8 }}>
        <Text style={st.sectionHint}>
          {CARS.length} versions à collectionner sur {MODELS.length} modèles et {BRANDS.length} marques. {done} marque{done > 1 ? 's' : ''} complète{done > 1 ? 's' : ''}.
        </Text>
        {groups.map((g) => (
          <Pressable key={g.k} onPress={() => setGroup(g.k)} style={st.groupRow}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={st.carName}>{G.title(g.k)}</Text>
              <Text style={st.carMeta}>
                {mode === 'brand' && brandComplete(disc, g.k) ? 'Complète  ' : ''}{g.got}/{g.total}
              </Text>
            </View>
            <View style={[st.barBg, { marginTop: 8 }]}>
              <View style={[st.barFill, { width: `${(g.got / g.total) * 100}%` }]} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------- Atelier ---------- */
function UpgradesScreen({ s, done, onUpgrade, onReset, onFast }) {
  const items = [
    { k: 'tap', title: 'Clé dynamométrique', desc: 'Augmente le gain par tap.', lvl: s.tapLevel, now: tapValue(s.tapLevel), next: tapValue(s.tapLevel + 1), cost: tapCost(s.tapLevel), unit: ' / tap' },
    { k: 'idle', title: 'Mécanos', desc: "Ton atelier rapporte de l'argent en continu, même app fermée (à 50 %, 2 h max).", lvl: s.idleLevel, now: idlePerSec(s.idleLevel), next: idlePerSec(s.idleLevel + 1), cost: idleCost(s.idleLevel), unit: ' / s' },
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {items.map((it) => (
        <View key={it.k} style={st.upCard}>
          <Text style={st.boxName}>{it.title}  <Text style={st.lvl}>niv. {it.lvl}</Text></Text>
          <Text style={st.sectionHint}>{it.desc}</Text>
          <Text style={st.upNums}>{fmt(it.now)}{it.unit}  ›  {fmt(it.next)}{it.unit}</Text>
          <Pressable onPress={() => onUpgrade(it.k)} style={[st.buy, s.coins < it.cost && st.buyOff]}>
            <Text style={[st.buyText, s.coins < it.cost && { color: C.muted }]}>Améliorer pour {fmt(it.cost)}</Text>
          </Pressable>
        </View>
      ))}
      <View style={st.upCard}>
        <Text style={st.boxName}>Showroom et collection</Text>
        <Text style={st.sectionHint}>
          Les voitures que tu gardes rapportent 0,12 % de leur valeur par minute. Chaque marque complète dans le carnet ajoute 5 % à tes revenus passifs. Bonus actuel : +{done * 5} %.
        </Text>
      </View>
      <View style={[st.upCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}>
          <Text style={st.carName}>Ouvertures rapides</Text>
          <Text style={st.carMeta}>Passe l'animation des boîtes.</Text>
        </View>
        <Switch value={s.fast} onValueChange={onFast} trackColor={{ true: C.yellow }} />
      </View>
      <Pressable onPress={onReset} style={{ alignSelf: 'center', padding: 16 }}>
        <Text style={{ color: C.red }}>Recommencer à zéro</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ---------- Ouverture ---------- */
function RevealModal({ reveal, fast, onFinish }) {
  const [stage, setStage] = useState('opening');
  const [items, setItems] = useState([]);
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const best = reveal ? Math.max(...reveal.items.map((it) => CAR_MAP[it.carId].rarity)) : 0;

  const show = () => {
    setStage('revealed');
    if (best >= 3) hap('big');
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    Animated.timing(flash, { toValue: 0, duration: 450, useNativeDriver: true }).start();
  };

  useEffect(() => {
    if (!reveal) return;
    setItems(reveal.items);
    flash.setValue(0);
    if (fast) { show(); return; }
    setStage('opening');
    shake.setValue(0);
    const seq = [];
    for (let i = 0; i < 7; i++) seq.push(Animated.timing(shake, { toValue: i % 2 ? -1 : 1, duration: 70 + i * 12, useNativeDriver: true }));
    seq.push(Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }));
    seq.push(Animated.timing(flash, { toValue: 1, duration: 220, useNativeDriver: true }));
    Animated.sequence(seq).start(({ finished }) => { if (finished) show(); });
  }, [reveal?.id]);

  const skip = () => {
    if (stage !== 'opening') return;
    shake.stopAnimation();
    flash.stopAnimation();
    show();
  };

  if (!reveal) return null;
  const toggle = (i) => setItems((p) => p.map((it, j) => (j === i ? { ...it, keep: !it.keep } : it)));
  const sellTotal = items.reduce((a, it) => a + (it.keep ? 0 : quote(CAR_MAP[it.carId])), 0);
  const cardAnim = { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => onFinish(items)}>
      <Pressable style={st.overlay} onPress={skip}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: RAR[best].color, opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }]} />
        {stage === 'opening' ? (
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ rotate: shake.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] }) }] }}>
              <BoxArt color={reveal.color} size={140} />
            </Animated.View>
            <Text style={[st.hint, { marginTop: 24 }]}>Touche pour passer</Text>
          </View>
        ) : items.length === 1 ? (
          <SingleReveal item={items[0]} anim={cardAnim} onDecide={(keep) => onFinish([{ ...items[0], keep }])} />
        ) : (
          <Animated.View style={[st.multiCard, cardAnim]}>
            <Text style={st.revealModel}>{items.length} voitures</Text>
            <Text style={st.sectionHint}>Les nouveautés et les épiques ou mieux sont gardées par défaut. Touche une ligne pour changer.</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {items.map((it, idx) => {
                const car = CAR_MAP[it.carId];
                return (
                  <Pressable key={it.key} onPress={() => toggle(idx)} style={[st.multiRow, { borderLeftColor: RAR[car.rarity].color }]}>
                    <CarArt car={car} width={76} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={st.carName} numberOfLines={1}>{carName(car)}</Text>
                      <Text style={[st.carMeta, { color: RAR[car.rarity].color }]} numberOfLines={1}>
                        {RAR[car.rarity].label}{car.variant !== 's' ? `, ${VARIANTS[car.variant].label}` : ''}{it.isNew ? ', nouvelle' : ''}
                      </Text>
                      <Text style={st.carMeta}>{fmt(quote(car))}</Text>
                    </View>
                    <View style={[st.pill, it.keep ? { backgroundColor: C.yellow, borderColor: C.yellow } : { borderColor: C.red }]}>
                      <Text style={[st.pillText, { color: it.keep ? '#1C2128' : C.red }]}>{it.keep ? 'Garder' : 'Vendre'}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => onFinish(items)} style={[st.cta, { alignSelf: 'stretch', alignItems: 'center', marginTop: 14 }]}>
              <Text style={st.ctaText}>{sellTotal > 0 ? `Valider et encaisser ${fmt(sellTotal)}` : 'Tout garder'}</Text>
            </Pressable>
          </Animated.View>
        )}
      </Pressable>
    </Modal>
  );
}

function SingleReveal({ item, anim, onDecide }) {
  const car = CAR_MAP[item.carId];
  const R = RAR[car.rarity];
  return (
    <Animated.View style={[st.revealCard, { borderColor: R.color, shadowColor: R.color }, anim]}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <RarityTag r={car.rarity} />
        {item.isNew && <View style={[st.tag, { borderColor: C.yellow }]}><Text style={[st.tagText, { color: C.yellow }]}>Nouvelle</Text></View>}
      </View>
      <Text style={st.revealBrand}>{flagOf(car)} {BRAND_MAP[car.brand].name}, {car.year}</Text>
      <Text style={st.revealModel}>{car.name}</Text>
      {car.variant !== 's' && (
        <Text style={st.carMeta}>{VARIANTS[car.variant].label}{item.serial ? `, n° ${item.serial}/${VARIANTS[car.variant].serial}` : ''}</Text>
      )}
      <View style={{ marginVertical: 18 }}><CarArt car={car} width={250} /></View>
      <Text style={st.carMeta}>{SEGMENTS[car.seg].label}, {car.hp} ch</Text>
      <Text style={st.revealValue}>{fmt(quote(car))}</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, alignSelf: 'stretch' }}>
        <Pressable onPress={() => onDecide(false)} style={[st.choice, { borderColor: C.red }]}>
          <Text style={[st.choiceText, { color: C.red }]}>Vendre</Text>
        </Pressable>
        <Pressable onPress={() => onDecide(true)} style={[st.choice, { backgroundColor: C.yellow, borderColor: C.yellow }]}>
          <Text style={[st.choiceText, { color: '#1C2128' }]}>Garder</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/* ---------- Fiche voiture ---------- */
function DetailModal({ detail, s, onClose, onSell }) {
  if (!detail) return null;
  const item = detail.uid ? s.garage.find((x) => x.uid === detail.uid) : null;
  const car = CAR_MAP[item ? item.carId : detail.carId];
  if (!car) return null;
  const ghost = !!detail.ghost;
  const q = quote(car);
  const specs = [
    ['Année', String(car.year)],
    ['Origine', `${flagOf(car)} ${COUNTRIES[car.country].label}`],
    ['Catégorie', SEGMENTS[car.seg].label],
    ['Époque', EPOCHS[car.epoch].label],
    ['Puissance', ghost ? '?' : `${car.hp} ch`],
    ['0 à 100 km/h', ghost ? '?' : `${accel(car.hp).toFixed(1).replace('.', ',')} s`],
    ['Vitesse max', ghost ? '?' : `${vmax(car.hp)} km/h`],
  ];
  const diff = item && item.paid ? ((q - item.paid) / item.paid) * 100 : null;

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={st.sheetWrap}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={st.sheet}>
          <View style={{ alignItems: 'center' }}>
            {!ghost && <RarityTag r={car.rarity} />}
            <Text style={st.revealBrand}>{BRAND_MAP[car.brand].name}</Text>
            <Text style={st.revealModel}>{ghost ? '???' : car.name}</Text>
            {!ghost && car.variant !== 's' && (
              <Text style={st.carMeta}>{VARIANTS[car.variant].label}{item?.serial ? `, n° ${item.serial}/${VARIANTS[car.variant].serial}` : ''}</Text>
            )}
            <View style={{ marginVertical: 14 }}><CarArt car={car} width={240} ghost={ghost} /></View>
          </View>
          {specs.map(([k, v]) => (
            <View key={k} style={st.specRow}><Text style={st.specK}>{k}</Text><Text style={st.specV}>{v}</Text></View>
          ))}
          {ghost ? (
            <Text style={[st.sectionHint, { marginTop: 12 }]}>Pas encore découverte. Cible les boîtes {COUNTRIES[car.country].label} ou {SEGMENTS[car.seg].label} pour augmenter tes chances.</Text>
          ) : (
            <>
              <View style={st.specRow}>
                <Text style={st.specK}>Cote du jour</Text>
                <View style={{ alignItems: 'flex-end' }}><Text style={st.specV}>{fmt(q)}</Text><Trend car={car} /></View>
              </View>
              {diff !== null && (
                <View style={st.specRow}>
                  <Text style={st.specK}>Obtenue à</Text>
                  <Text style={[st.specV, { color: diff >= 0 ? C.green : C.red }]}>{fmt(item.paid)} ({diff >= 0 ? '+' : ''}{diff.toFixed(1).replace('.', ',')} %)</Text>
                </View>
              )}
            </>
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {item && (
              <Pressable onPress={() => onSell(item.uid)} style={[st.choice, { borderColor: C.red }]}>
                <Text style={[st.choiceText, { color: C.red }]}>Vendre {fmt(q)}</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} style={[st.choice, { backgroundColor: C.surface2, borderColor: C.surface2 }]}>
              <Text style={[st.choiceText, { color: C.text }]}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- Styles ---------- */
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  brand: { fontFamily: DISPLAY, fontSize: 26, color: C.yellow, fontStyle: 'italic', letterSpacing: -0.5 },
  coins: { fontFamily: DISPLAY, fontSize: 22, color: C.text },
  rate: { fontSize: 12, color: C.green },

  turntable: { width: 300, height: 300, borderRadius: 150, backgroundColor: C.surface, borderWidth: 3, borderColor: C.yellow, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  turntableInner: { width: 250, height: 250, borderRadius: 125, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  float: { position: 'absolute', top: 110, fontFamily: DISPLAY, fontSize: 22, color: C.yellow },
  hint: { color: C.muted, fontSize: 14, marginTop: 16, textAlign: 'center', paddingHorizontal: 30 },
  statsRow: { flexDirection: 'row', marginTop: 24, paddingHorizontal: 10 },
  statValue: { fontFamily: DISPLAY_B, fontSize: 19, color: C.text },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 2 },
  goal: { alignSelf: 'stretch', marginHorizontal: 24, marginTop: 22 },
  goalText: { color: C.text, fontSize: 13, marginBottom: 6 },
  barBg: { height: 6, borderRadius: 3, backgroundColor: C.surface2, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: C.yellow },
  cta: { marginTop: 22, backgroundColor: C.yellow, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 6 },
  ctaOff: { backgroundColor: C.surface },
  ctaText: { fontFamily: DISPLAY_B, fontSize: 17, color: '#1C2128' },

  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: C.text, fontSize: 13 },

  boxRow: { flexDirection: 'row', backgroundColor: C.surface, padding: 14, borderRadius: 8 },
  boxName: { fontFamily: DISPLAY, fontSize: 20, color: C.text },
  oddsWrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 2, marginTop: 4, marginBottom: 10 },
  odds: { fontSize: 12 },
  buy: { backgroundColor: C.yellow, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  buyOff: { backgroundColor: C.surface2 },
  buyText: { fontFamily: DISPLAY_B, fontSize: 15, color: '#1C2128' },
  buy5: { flex: 1, borderWidth: 1.5, borderColor: C.yellow, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  buy5Text: { fontFamily: DISPLAY_B, fontSize: 16, color: C.yellow },

  garageHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  garageValue: { fontFamily: DISPLAY, fontSize: 28, color: C.text },
  smallBtn: { borderWidth: 1, borderColor: C.line, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6 },
  smallBtnText: { color: C.text, fontSize: 13 },
  section: { fontFamily: DISPLAY, fontSize: 20, color: C.text, marginBottom: 4 },
  sectionHint: { color: C.muted, fontSize: 13, marginBottom: 10, lineHeight: 18 },
  tradeCard: { backgroundColor: C.surface, padding: 12, borderRadius: 6, borderWidth: 1.5, minWidth: 130 },
  tradeText: { fontFamily: DISPLAY_B, fontSize: 16 },
  carRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, padding: 10, borderRadius: 6, marginBottom: 8, marginHorizontal: 16, borderLeftWidth: 4 },
  carName: { fontFamily: DISPLAY_B, fontSize: 17, color: C.text },
  carMeta: { color: C.muted, fontSize: 13, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  groupRow: { backgroundColor: C.surface, padding: 14, borderRadius: 6 },

  upCard: { backgroundColor: C.surface, padding: 16, borderRadius: 8 },
  lvl: { fontSize: 15, color: C.yellow },
  upNums: { color: C.text, fontSize: 15, marginBottom: 12 },

  tag: { borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'center' },
  tagText: { fontFamily: DISPLAY_B, fontSize: 14 },

  overlay: { flex: 1, backgroundColor: 'rgba(12,14,18,0.94)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  revealCard: { width: '100%', maxWidth: 360, alignItems: 'center', backgroundColor: C.surface, borderWidth: 2, borderRadius: 12, padding: 22, shadowOpacity: 0.7, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
  revealBrand: { color: C.muted, fontSize: 15, marginTop: 12 },
  revealModel: { fontFamily: DISPLAY, fontSize: 36, color: C.text, fontStyle: 'italic' },
  revealValue: { fontFamily: DISPLAY, fontSize: 30, color: C.yellow, marginTop: 4 },
  choice: { flex: 1, paddingVertical: 14, borderRadius: 6, borderWidth: 1.5, alignItems: 'center' },
  choiceText: { fontFamily: DISPLAY_B, fontSize: 17 },
  multiCard: { width: '100%', maxWidth: 400, backgroundColor: C.surface, borderRadius: 12, padding: 16 },
  multiRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface2, borderRadius: 6, padding: 8, marginBottom: 6, borderLeftWidth: 4 },
  pill: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, minWidth: 70, alignItems: 'center' },
  pillText: { fontFamily: DISPLAY_B, fontSize: 14 },

  sheetWrap: { flex: 1, backgroundColor: 'rgba(12,14,18,0.6)' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 34 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.line },
  specK: { color: C.muted, fontSize: 14 },
  specV: { color: C.text, fontSize: 14, fontWeight: '600' },

  toast: { position: 'absolute', bottom: 92, left: 20, right: 20, backgroundColor: C.text, padding: 12, borderRadius: 6 },
  toastText: { color: '#1C2128', textAlign: 'center', fontSize: 14 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg },
  tabBtn: { flex: 1, alignItems: 'center', paddingTop: 12, paddingBottom: 6 },
  tabText: { fontFamily: DISPLAY_B, fontSize: 15, color: C.muted },
  tabBar: { height: 3, width: 26, marginTop: 6, borderRadius: 2, backgroundColor: 'transparent' },
});
