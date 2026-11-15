// Sauvegarde locale (AsyncStorage). La clé ne doit pas changer : les joueurs perdraient leur partie.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAVE_KEY, INITIAL } from './initial.js';
import { sanitizeSave } from './transfer.js';

export { SAVE_KEY, INITIAL };

// Renvoie l'état sauvegardé (nettoyé et complété par INITIAL), ou null s'il n'y a pas de sauvegarde
export async function loadGame() {
  const raw = await AsyncStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  return sanitizeSave(JSON.parse(raw));
}

export const saveGame = (state) =>
  AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSeen: Date.now() })).catch(() => {});
