import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, FlatList } from 'react-native';
import { RAR, REGIONS, COUNTRIES, EPOCHS, EPOCH_ORDER, SEGMENTS, BRANDS, BRAND_MAP, CARS, MODELS } from '../data';
import { brandComplete } from '../economy';
import { CarArt } from '../components/CarArt';
import { Chip, ChipRow } from '../components/Chip';
import { C } from '../theme';
import { st } from '../styles';

/* ---------- Carnet de collection ---------- */
const GROUPINGS = {
  brand: { label: 'Marques', key: (m) => m.brand, order: BRANDS.map((b) => b.id), title: (k) => `${COUNTRIES[BRAND_MAP[k].country].flag} ${BRAND_MAP[k].name}` },
  region: { label: 'Régions', key: (m) => m.region, order: Object.keys(REGIONS), title: (k) => REGIONS[k] },
  country: { label: 'Pays', key: (m) => m.country, order: Object.keys(COUNTRIES), title: (k) => `${COUNTRIES[k].flag} ${COUNTRIES[k].label}` },
  seg: { label: 'Catégories', key: (m) => m.seg, order: Object.keys(SEGMENTS), title: (k) => SEGMENTS[k].label },
  epoch: { label: 'Époques', key: (m) => m.epoch, order: EPOCH_ORDER, title: (k) => `${EPOCHS[k].label} (${EPOCHS[k].from}-${EPOCHS[k].to})` },
};

export const CarnetScreen = React.memo(function CarnetScreen({ disc, done, onOpenDetail }) {
  const [mode, setMode] = useState('brand');
  const [group, setGroup] = useState(null);
  const G = GROUPINGS[mode];

  const groups = useMemo(() => G.order.map((k) => {
    const models = MODELS.filter((m) => G.key(m) === k);
    const got = models.reduce((a, m) => a + m.cars.filter((c) => disc.has(c.id)).length, 0);
    return { k, models, got, total: models.length * 5 };
  }).filter((g) => g.models.length), [mode, disc]);

  if (group) {
    const g = groups.find((x) => x.k === group);
    const models = [...g.models].sort((a, b) => (mode === 'brand' ? a.line - b.line || a.year - b.year : a.brand.localeCompare(b.brand) || a.year - b.year));
    return (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Pressable onPress={() => setGroup(null)}><Text style={{ color: C.yellow, fontSize: 15 }}>‹ {G.label}</Text></Pressable>
          <Text style={[st.garageValue, { marginTop: 6 }]}>{G.title(group)}</Text>
          <Text style={st.statLabel}>{g.got}/{g.total} versions découvertes, {g.models.length} modèles</Text>
          {mode === 'brand' && (
            <Text style={[st.sectionHint, { marginTop: 6 }]}>
              {brandComplete(disc, group) ? 'Marque complète : +5 % sur tes revenus passifs.' : 'Découvre la version standard de chaque modèle pour gagner +5 % de revenus passifs.'}
            </Text>
          )}
        </View>
        <FlatList
          data={models}
          keyExtractor={(m) => m.id}
          initialNumToRender={10}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item: m }) => {
            const found = m.cars.filter((c) => disc.has(c.id));
            const bestFound = found.sort((a, b) => b.rarity - a.rarity)[0];
            return (
              <Pressable onPress={() => onOpenDetail(bestFound ? { carId: bestFound.id } : { carId: m.cars[0].id, ghost: true })} style={[st.carRow, { borderLeftColor: bestFound ? RAR[bestFound.rarity].color : C.line }]}>
                <CarArt car={bestFound || m.cars[0]} width={90} ghost={!bestFound} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[st.carName, !bestFound && { color: C.muted }]} numberOfLines={1}>
                    {COUNTRIES[m.country].flag} {BRAND_MAP[m.brand].name} {bestFound ? m.name : '???'}
                  </Text>
                  <Text style={st.carMeta}>{m.year}, {SEGMENTS[m.seg].label}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    {m.cars.map((c) => (
                      <View key={c.id} style={[st.dot, { borderColor: RAR[c.rarity].color }, disc.has(c.id) && { backgroundColor: RAR[c.rarity].color }]} />
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: 12 }}>
      <ChipRow>
        {Object.entries(GROUPINGS).map(([k, g]) => <Chip key={k} label={g.label} active={mode === k} onPress={() => setMode(k)} />)}
      </ChipRow>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 8 }}>
        <Text style={st.sectionHint}>
          {CARS.length} versions à collectionner sur {MODELS.length} modèles et {BRANDS.length} marques. {done} marque{done > 1 ? 's' : ''} complète{done > 1 ? 's' : ''}.
        </Text>
        {groups.map((g) => (
          <Pressable key={g.k} onPress={() => setGroup(g.k)} style={st.groupRow}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={st.carName}>{G.title(g.k)}</Text>
              <Text style={st.carMeta}>
                {mode === 'brand' && brandComplete(disc, g.k) ? 'Complète  ' : ''}{g.got}/{g.total}
              </Text>
            </View>
            <View style={[st.barBg, { marginTop: 8 }]}>
              <View style={[st.barFill, { width: `${(g.got / g.total) * 100}%` }]} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});
