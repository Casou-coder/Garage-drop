import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { RAR, THEMES, BOXES, boxAvailable, boxPrice } from '../data';
import { BoxArt } from '../components/BoxArt';
import { Chip, ChipRow } from '../components/Chip';
import { C } from '../theme';
import { st } from '../styles';
import { fmt } from '../utils/format';

/* ---------- Boîtes ---------- */
export function BoxesScreen({ coins, onOpen }) {
  const [theme, setTheme] = useState(THEMES[0]);
  return (
    <View style={{ flex: 1, paddingTop: 12 }}>
      <ChipRow>
        {THEMES.map((t) => <Chip key={t.id} label={t.label} active={theme.id === t.id} onPress={() => setTheme(t)} />)}
      </ChipRow>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12 }}>
        {theme.id !== 'all' && (
          <Text style={st.sectionHint}>Seules des voitures {theme.label === 'Europe' || theme.label === 'Asie' || theme.label === 'Océanie' ? `d'${theme.label}` : `de la catégorie ${theme.label}`} peuvent sortir. Ciblage facturé 25 % de plus.</Text>
        )}
        {BOXES.map((b) => {
          const price = boxPrice(b, theme);
          const ok1 = coins >= price, ok5 = coins >= price * 5;
          if (!boxAvailable(b, theme)) return (
            <View key={b.id} style={[st.boxRow, { opacity: 0.45 }]}>
              <BoxArt color={C.line} />
              <View style={{ flex: 1, marginLeft: 14, justifyContent: 'center' }}>
                <Text style={st.boxName}>{b.name}</Text>
                <Text style={st.carMeta}>Pas de voiture de cette gamme dans ce thème.</Text>
              </View>
            </View>
          );
          return (
            <View key={b.id} style={st.boxRow}>
              <BoxArt color={b.color} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={st.boxName}>{b.name}{theme.id !== 'all' ? ` ${theme.label}` : ''}</Text>
                <View style={st.oddsWrap}>
                  {b.odds.map((p, r) => p > 0 && (
                    <Text key={r} style={[st.odds, { color: RAR[r].color }]}>{RAR[r].label} {String(p).replace('.', ',')} %</Text>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => onOpen(b, theme, 1)} style={[st.buy, { flex: 2 }, !ok1 && st.buyOff]}>
                    <Text style={[st.buyText, !ok1 && { color: C.muted }]}>Ouvrir pour {fmt(price)}</Text>
                  </Pressable>
                  <Pressable onPress={() => onOpen(b, theme, 5)} style={[st.buy5, !ok5 && { opacity: 0.4 }]}>
                    <Text style={st.buy5Text}>×5</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
