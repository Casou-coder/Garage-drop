import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Animated } from 'react-native';
import { RAR, VARIANTS, SEGMENTS, BRAND_MAP, CAR_MAP } from '../data';
import { quote } from '../economy';
import { CarArt } from '../components/CarArt';
import { BoxArt } from '../components/BoxArt';
import { RarityTag } from '../components/RarityTag';
import { C } from '../theme';
import { st } from '../styles';
import { fmt, carName, flagOf } from '../utils/format';
import { hap, sfx } from '../utils/feedback';

/* ---------- Ouverture ---------- */
export function RevealModal({ reveal, fast, onFinish }) {
  const [stage, setStage] = useState('opening');
  const [items, setItems] = useState([]);
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const best = reveal ? Math.max(...reveal.items.map((it) => CAR_MAP[it.carId].rarity)) : 0;

  const show = () => {
    setStage('revealed');
    if (best >= 3) hap('big');
    sfx(best >= 3 ? 'rare' : 'reveal');
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
