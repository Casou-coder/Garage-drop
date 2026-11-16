// Compte en ligne : connexion par e-mail et synchronisation de la partie avec Supabase.
// Le jeu reste jouable sans compte et hors connexion ; la sauvegarde locale fait toujours foi en cas d'échec réseau.
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY, CLOUD_ENABLED } from '../config';
import { createCloud, needsRefresh } from '../cloud/client';
import { sanitizeSave } from './transfer';

const SESSION_KEY = 'garagedrop-session';
const PUSH_EVERY_MS = 60000;
const cloud = CLOUD_ENABLED ? createCloud({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY }) : null;

const hasProgress = (s) => s.opened > 0 || s.garage.length > 0 || s.discovered.length > 0 || s.tapLevel > 1 || s.idleLevel > 0;

export function useCloud({ s, loaded, replaceState, showToast }) {
  const [session, setSessionState] = useState(null);
  const [ready, setReady] = useState(!CLOUD_ENABLED);
  const [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState(0);
  const sessionRef = useRef(null);
  const sRef = useRef(s);
  sRef.current = s;
  const pushedRef = useRef(null); // dernier état envoyé, pour ne pas renvoyer une partie inchangée

  const setSession = (next) => {
    sessionRef.current = next;
    setSessionState(next);
    if (next) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next)).catch(() => {});
    else AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  };

  // Exécute un appel authentifié, en renouvelant le jeton si besoin
  const withSession = async (fn) => {
    let cur = sessionRef.current;
    if (!cur) throw new Error('Non connecté.');
    if (needsRefresh(cur)) { cur = await cloud.refresh(cur); setSession(cur); }
    try {
      return await fn(cur);
    } catch (e) {
      if (e.status !== 401) throw e;
      cur = await cloud.refresh(cur);
      setSession(cur);
      return fn(cur);
    }
  };

  const push = async (state = sRef.current) => {
    const stamp = await withSession((cur) => cloud.putSave(cur, { ...state, lastSeen: Date.now() }));
    pushedRef.current = state;
    setSession({ ...sessionRef.current, lastPushed: stamp });
    setLastSync(Date.now());
  };

  const adopt = (row) => {
    const restored = sanitizeSave(row.data);
    replaceState({ ...restored, lastSeen: Date.now(), createdAt: restored.createdAt || Date.now(), tutorialDone: true });
    pushedRef.current = null;
    setSession({ ...sessionRef.current, lastPushed: row.updated_at });
    setLastSync(Date.now());
  };

  // Au lancement : reprise de la session, puis de la partie si un autre appareil a joué entre-temps
  useEffect(() => {
    if (!CLOUD_ENABLED || !loaded) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved && saved.refresh_token && saved.user) {
            sessionRef.current = saved;
            setSessionState(saved);
            const row = await withSession((cur) => cloud.getSave(cur));
            if (row && row.updated_at !== sessionRef.current.lastPushed) {
              adopt(row);
              showToast('Partie synchronisée depuis ton compte');
            } else {
              setLastSync(Date.now());
            }
          }
        }
      } catch (e) {
        // Jeton révoqué : on déconnecte. Simple panne réseau : on garde la session et on réessaiera.
        if (e.status === 400 || e.status === 401 || e.status === 403) setSession(null);
      }
      setReady(true);
    })();
  }, [loaded]);

  // Envoi régulier, et à la mise en arrière-plan
  useEffect(() => {
    if (!CLOUD_ENABLED || !ready) return;
    const tryPush = () => {
      if (sessionRef.current && pushedRef.current !== sRef.current) push().catch(() => {});
    };
    const id = setInterval(tryPush, PUSH_EVERY_MS);
    const sub = AppState.addEventListener('change', (st) => { if (st !== 'active') tryPush(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [ready]);

  // Après connexion : choisir entre la partie en ligne et celle de l'appareil
  const reconcile = async () => {
    const row = await withSession((cur) => cloud.getSave(cur));
    if (!row) { await push(); return 'Compte connecté. Ta partie est sauvegardée en ligne.'; }
    if (!hasProgress(sRef.current) || Platform.OS === 'web') { adopt(row); return 'Compte connecté. Partie en ligne chargée.'; }
    const cars = Array.isArray(row.data && row.data.discovered) ? row.data.discovered.length : 0;
    return new Promise((resolve) => {
      Alert.alert(
        'Deux parties existent',
        `Ton compte contient déjà une partie (${cars} versions découvertes). Cet appareil en contient une autre (${sRef.current.discovered.length} versions). Laquelle garder ?`,
        [
          { text: 'Celle du compte', onPress: () => { adopt(row); resolve('Partie en ligne chargée.'); } },
          { text: 'Celle de cet appareil', style: 'destructive', onPress: () => { push().then(() => resolve('Partie de cet appareil envoyée sur ton compte.'), () => resolve("Connecté, mais l'envoi a échoué. Nouvel essai automatique.")); } },
        ],
        { cancelable: false },
      );
    });
  };

  // Chaque action renvoie { ok, message }
  const run = async (fn) => {
    if (!cloud) return { ok: false, message: 'Compte en ligne indisponible dans cette version.' };
    setBusy(true);
    try {
      return { ok: true, message: await fn() };
    } catch (e) {
      return { ok: false, message: e.message || 'Une erreur est survenue.' };
    } finally {
      setBusy(false);
    }
  };

  const signIn = (email, password) => run(async () => {
    setSession(await cloud.signIn(email.trim(), password));
    return reconcile();
  });

  const signUp = (email, password) => run(async () => {
    const res = await cloud.signUp(email.trim(), password);
    if (res.needsConfirm) return 'Compte créé. Ouvre le lien reçu par e-mail pour le confirmer, puis connecte-toi ici.';
    setSession(res.session);
    return reconcile();
  });

  const recover = (email) => run(async () => {
    await cloud.recover(email.trim());
    return 'Si un compte existe avec cet e-mail, un lien de réinitialisation vient de partir.';
  });

  const syncNow = () => run(async () => { await push(); return 'Partie sauvegardée en ligne.'; });

  const signOut = () => run(async () => {
    try { await push(); } catch (e) { /* on déconnecte quand même */ }
    const cur = sessionRef.current;
    setSession(null);
    if (cur) await cloud.signOut(cur);
    return 'Déconnecté. Ta partie reste sur cet appareil.';
  });

  // Efface la partie en ligne puis déconnecte (la partie locale est conservée)
  const deleteOnline = () => run(async () => {
    await withSession((cur) => cloud.deleteSave(cur));
    const cur = sessionRef.current;
    setSession(null);
    if (cur) await cloud.signOut(cur);
    return 'Tes données GarageDrop en ligne sont effacées.';
  });

  return { enabled: CLOUD_ENABLED, ready, busy, email: session ? session.user.email : null, lastSync, signIn, signUp, recover, syncNow, signOut, deleteOnline };
}
