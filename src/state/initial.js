// État initial d'une partie. Tout nouveau champ doit avoir sa valeur par défaut ici :
// les anciennes sauvegardes sont fusionnées dessus au chargement.
export const SAVE_KEY = 'garagedrop-save-v2';

export const INITIAL = {
  coins: 3500, tapLevel: 1, idleLevel: 0, garage: [], discovered: [], lastDaily: 0, streak: 0, lastSeen: Date.now(), opened: 0, fast: false,
  // Compte et réglages (ajoutés après le prototype)
  name: '', createdAt: 0, taps: 0, sound: true, haptics: true, tutorialDone: false,
};
