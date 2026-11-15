// État du jeu : argent, garage, carnet, améliorations, et toutes les actions du joueur.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { RAR, VARIANTS, CAR_MAP, boxAvailable, boxPrice, rollRarity, pickCar } from '../data';
import {
  DAY, dayIndex, quote, tapValue, tapCost, idleCost, garageValue, completedBrands, passiveRate,
  nextStreak, dailyGift, offlineEarnings,
} from '../economy';
import { fmt, uid } from '../utils/format';
import { hap } from '../utils/haptics';
import { INITIAL, loadGame, saveGame } from './save';

const rollSerial = (car) => {
  const V = VARIANTS[car.variant];
  return V.serial ? 1 + Math.floor(Math.random() * V.serial) : null;
};

export function useGame() {
  const [s, setS] = useState(INITIAL);
  const [loaded, setLoaded] = useState(false);
  const [reveal, setReveal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const disc = useMemo(() => new Set(s.discovered), [s.discovered]);
  const done = useMemo(() => completedBrands(disc), [disc]);
  const value = useMemo(() => garageValue(s.garage), [s.garage]);
  const perSec = passiveRate(s.idleLevel, value, done);
  const perSecRef = useRef(perSec);
  perSecRef.current = perSec;

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  // Chargement de la sauvegarde + gains hors-ligne
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadGame();
        if (saved) {
          const rate = passiveRate(saved.idleLevel, garageValue(saved.garage), completedBrands(new Set(saved.discovered)));
          const earned = offlineEarnings(rate, Date.now() - saved.lastSeen);
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

  // Sauvegarde automatique (différée de 500 ms)
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => saveGame(s), 500);
    return () => clearTimeout(t);
  }, [s, loaded]);

  // Revenus passifs, une fois par seconde
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
      return { key: uid(), carId: car.id, serial: rollSerial(car), isNew, keep: isNew || car.rarity >= 2 };
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

  // Échange : 5 voitures d'une rareté (les moins chères) contre 1 de la rareté au-dessus
  const tradeUp = (r) => {
    const mine = s.garage.filter((x) => CAR_MAP[x.carId].rarity === r)
      .sort((a, b) => CAR_MAP[a.carId].value - CAR_MAP[b.carId].value);
    if (r >= 5 || mine.length < 5) return;
    const used = new Set(mine.slice(0, 5).map((x) => x.uid));
    const car = pickCar(r + 1, null);
    setS((p) => ({ ...p, garage: p.garage.filter((x) => !used.has(x.uid)) }));
    hap('open');
    setReveal({ id: uid(), color: RAR[r + 1].color, items: [{ key: uid(), carId: car.id, serial: rollSerial(car), isNew: !disc.has(car.id), keep: true }] });
  };

  const sellUid = (u) => {
    const item = s.garage.find((x) => x.uid === u);
    if (!item) return;
    const q = quote(CAR_MAP[item.carId]);
    setS((p) => ({ ...p, garage: p.garage.filter((x) => x.uid !== u), coins: p.coins + q }));
    showToast(`Vendue : +${fmt(q)}`);
    setDetail(null);
  };

  // Garde un exemplaire de chaque voiture (le plus petit numéro de série) et vend le reste
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
    const streak = nextStreak(since, s.streak);
    const gift = dailyGift(s.tapLevel, streak);
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

  const setFast = (v) => setS((p) => ({ ...p, fast: v }));

  const reset = () => Alert.alert('Recommencer à zéro ?', 'Ton garage, ton carnet et ton argent seront effacés.', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Effacer', style: 'destructive', onPress: () => setS({ ...INITIAL, lastSeen: Date.now() }) },
  ]);

  return {
    s, disc, done, value, perSec, toast, reveal, detail, setDetail,
    tap, openBox, finishReveal, tradeUp, sellUid, sellDuplicates, claimDaily, upgrade, setFast, reset,
  };
}
