import React from 'react';
import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { tapValue, tapCost, idlePerSec, idleCost } from '../economy';
import { C } from '../theme';
import { st } from '../styles';
import { fmt } from '../utils/format';

/* ---------- Atelier ---------- */
export function UpgradesScreen({ s, done, onUpgrade, onReset, onFast }) {
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
