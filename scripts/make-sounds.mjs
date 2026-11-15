// Génère les effets sonores (WAV mono 16 bits) dans assets/sounds. Lancer : node scripts/make-sounds.mjs
// Sons synthétisés ici même : aucun fichier tiers, aucune licence à gérer.
import { writeFileSync, mkdirSync } from 'node:fs';

const RATE = 22050;
const OUT = new URL('../assets/sounds/', import.meta.url);
mkdirSync(OUT, { recursive: true });

function wav(name, seconds, fn) {
  const n = Math.floor(RATE * seconds);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const fade = Math.min(1, i / 60, (n - i) / 200); // évite les clics en début et fin
    const v = Math.max(-1, Math.min(1, fn(t, seconds) * fade));
    buf.writeInt16LE(Math.round(v * 32767 * 0.8), 44 + i * 2);
  }
  writeFileSync(new URL(name + '.wav', OUT), buf);
  console.log(`${name}.wav  ${(buf.length / 1024).toFixed(1)} Ko`);
}
const sin = (f, t) => Math.sin(2 * Math.PI * f * t);
const env = (t, d) => Math.exp(-t / d);
// Note : fréquence f jouée à partir de l'instant `at`
const note = (f, t, at, d = 0.12) => (t < at ? 0 : (sin(f, t - at) + 0.3 * sin(f * 2, t - at)) * env(t - at, d));

wav('tap', 0.07, (t) => sin(900 - 4000 * t, t) * env(t, 0.02) * 0.6);
wav('open', 0.32, (t) => (sin(150 + 500 * t, t) * 0.5 + (Math.random() * 2 - 1) * 0.25) * env(t, 0.14));
wav('reveal', 0.45, (t) => (note(659, t, 0) + note(988, t, 0.09, 0.16)) * 0.5);
wav('rare', 1.0, (t) => (note(523, t, 0) + note(659, t, 0.1) + note(784, t, 0.2) + note(1047, t, 0.3, 0.3)) * 0.42);
wav('coin', 0.3, (t) => (note(1319, t, 0, 0.05) + note(1760, t, 0.06, 0.1)) * 0.4);
wav('upgrade', 0.4, (t) => (note(440, t, 0, 0.08) + note(587, t, 0.08, 0.08) + note(880, t, 0.16, 0.12)) * 0.45);
