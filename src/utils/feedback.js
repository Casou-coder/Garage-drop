// Retours haptiques et sonores. Tout est protégé : un échec audio ne doit jamais gêner le jeu.
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const SOURCES = {
  tap: require('../../assets/sounds/tap.wav'),
  open: require('../../assets/sounds/open.wav'),
  reveal: require('../../assets/sounds/reveal.wav'),
  rare: require('../../assets/sounds/rare.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  upgrade: require('../../assets/sounds/upgrade.wav'),
};
const VOLUME = { tap: 0.35, open: 0.7, reveal: 0.7, rare: 0.8, coin: 0.6, upgrade: 0.7 };

const prefs = { sound: true, haptics: true };
export function setFeedbackPrefs({ sound, haptics }) {
  prefs.sound = sound !== false;
  prefs.haptics = haptics !== false;
}

export function hap(kind) {
  if (!prefs.haptics) return;
  try {
    const p = kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : kind === 'big'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

const players = {};
let modeSet = false;
let lastTap = 0;

export function sfx(name) {
  if (!prefs.sound || !SOURCES[name]) return;
  try {
    if (!modeSet) {
      modeSet = true;
      // Respecte le mode silencieux et ne coupe pas la musique de l'utilisateur
      const p = setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
      if (p && p.catch) p.catch(() => {});
    }
    if (name === 'tap') {
      const now = Date.now();
      if (now - lastTap < 60) return;
      lastTap = now;
    }
    let pl = players[name];
    if (!pl) {
      pl = players[name] = createAudioPlayer(SOURCES[name]);
      pl.volume = VOLUME[name];
    } else {
      const s = pl.seekTo(0);
      if (s && s.catch) s.catch(() => {});
    }
    pl.play();
  } catch (e) {}
}
