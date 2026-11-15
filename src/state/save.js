// Sauvegarde locale (AsyncStorage). La clé ne doit pas changer : les joueurs perdraient leur partie.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CAR_MAP } from '../data';

export const SAVE_KEY = 'garagedrop-save-v2';

export const INITIAL = { coins: 3500, tapLevel: 1, idleLevel: 0, garage: [], discovered: [], lastDaily: 0, streak: 0, lastSeen: Date.now(), opened: 0, fast: false };

// Renvoie l'état sauvegardé (complété par INITIAL), ou null s'il n'y a pas de sauvegarde
export async function loadGame() {
  const raw = await AsyncStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  const saved = { ...INITIAL, ...JSON.parse(raw) };
  saved.garage = saved.garage.filter((x) => CAR_MAP[x.carId]);
  return saved;
}

export const saveGame = (state) =>
  AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSeen: Date.now() })).catch(() => {});
