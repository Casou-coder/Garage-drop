import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { CARS, CAR_MAP, BOXES } from '../data';
import { DAY, tapValue } from '../economy';
import { CarArt } from '../components/CarArt';
import { C } from '../theme';
import { st } from '../styles';
import { fmt, uid, carName, flagOf } from '../utils/format';

/* ---------- Showroom ---------- */
export function HomeScreen({ s, value, disc, onTap, onDaily, onOpenDetail }) {
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
      <Pressable onPress={press} accessibilityRole="button" accessibilityLabel="Plateau : tape pour gagner de l'argent">
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

      <Pressable onPress={onDaily} style={[st.cta, !dailyReady && st.ctaOff]} accessibilityRole="button">
        <Text style={[st.ctaText, !dailyReady && { color: C.muted }]}>
          {dailyReady ? 'Récupérer la récompense du jour' : `Série de ${s.streak} jour${s.streak > 1 ? 's' : ''}, reviens demain`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
      <Text style={st.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}
