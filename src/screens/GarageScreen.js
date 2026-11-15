import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, FlatList } from 'react-native';
import { RAR, REGIONS, VARIANTS, CAR_MAP } from '../data';
import { dayIndex, quote } from '../economy';
import { CarArt } from '../components/CarArt';
import { Chip, ChipRow } from '../components/Chip';
import { Trend } from '../components/Trend';
import { C } from '../theme';
import { st } from '../styles';
import { fmt, carName, flagOf } from '../utils/format';

/* ---------- Garage ---------- */
export function GarageScreen({ s, onOpenDetail, onDup, onTrade }) {
  const [sort, setSort] = useState('value');
  const [rf, setRf] = useState(-1);
  const [reg, setReg] = useState('all');
  const d = dayIndex();

  const list = useMemo(() => {
    let l = s.garage.filter((x) => {
      const c = CAR_MAP[x.carId];
      return (rf < 0 || c.rarity === rf) && (reg === 'all' || c.region === reg);
    });
    if (sort === 'value') l = l.sort((a, b) => CAR_MAP[b.carId].value - CAR_MAP[a.carId].value);
    if (sort === 'rarity') l = l.sort((a, b) => CAR_MAP[b.carId].rarity - CAR_MAP[a.carId].rarity || CAR_MAP[b.carId].value - CAR_MAP[a.carId].value);
    if (sort === 'recent') l = l.sort((a, b) => b.at - a.at);
    if (sort === 'year') l = l.sort((a, b) => CAR_MAP[a.carId].year - CAR_MAP[b.carId].year);
    return l;
  }, [s.garage, sort, rf, reg]);

  const total = s.garage.reduce((a, x) => a + quote(CAR_MAP[x.carId], d), 0);
  const countBy = (r) => s.garage.filter((x) => CAR_MAP[x.carId].rarity === r).length;

  const header = (
    <View>
      <View style={[st.garageHead, { paddingHorizontal: 16 }]}>
        <View>
          <Text style={st.garageValue}>{fmt(total)}</Text>
          <Text style={st.statLabel}>{s.garage.length} voitures au cours du jour</Text>
        </View>
        <Pressable onPress={onDup} style={st.smallBtn}><Text style={st.smallBtnText}>Vendre les doublons</Text></Pressable>
      </View>

      <Text style={[st.section, { paddingHorizontal: 16 }]}>Échanges</Text>
      <Text style={[st.sectionHint, { paddingHorizontal: 16 }]}>Cinq voitures d'une rareté contre une de la rareté au-dessus. Les moins chères partent en premier.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ marginBottom: 18 }}>
        {RAR.slice(0, 5).map((R, r) => {
          const n = countBy(r);
          const ok = n >= 5;
          return (
            <Pressable key={r} onPress={() => onTrade(r)} disabled={!ok} style={[st.tradeCard, { borderColor: ok ? RAR[r + 1].color : C.line }, !ok && { opacity: 0.5 }]}>
              <Text style={[st.tradeText, { color: R.color }]}>{Math.min(n, 5)}/5 {R.label}</Text>
              <Text style={st.carMeta}>donne 1 {RAR[r + 1].label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ChipRow>
        {[['value', 'Valeur'], ['rarity', 'Rareté'], ['year', 'Année'], ['recent', 'Récentes']].map(([k, l]) => (
          <Chip key={k} label={l} active={sort === k} onPress={() => setSort(k)} />
        ))}
      </ChipRow>
      <ChipRow>
        <Chip label="Toutes raretés" active={rf < 0} onPress={() => setRf(-1)} />
        {RAR.map((R, r) => <Chip key={r} label={R.label} color={R.color} active={rf === r} onPress={() => setRf(r)} />)}
      </ChipRow>
      <ChipRow>
        <Chip label="Toutes régions" active={reg === 'all'} onPress={() => setReg('all')} />
        {Object.entries(REGIONS).map(([k, l]) => <Chip key={k} label={l} active={reg === k} onPress={() => setReg(k)} />)}
      </ChipRow>
      {list.length === 0 && (
        <Text style={[st.sectionHint, { paddingHorizontal: 16 }]}>
          {s.garage.length === 0 ? 'Ton garage est vide. Ouvre une boîte pour y garer ta première voiture.' : 'Aucune voiture ne correspond à ces filtres.'}
        </Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={list}
      keyExtractor={(x) => x.uid}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      initialNumToRender={12}
      windowSize={7}
      renderItem={({ item }) => {
        const car = CAR_MAP[item.carId];
        return (
          <Pressable onPress={() => onOpenDetail({ uid: item.uid })} style={[st.carRow, { borderLeftColor: RAR[car.rarity].color }]}>
            <CarArt car={car} width={90} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={st.carName} numberOfLines={1}>{flagOf(car)} {carName(car)}</Text>
              <Text style={st.carMeta} numberOfLines={1}>
                {car.year}{car.variant !== 's' ? `, ${VARIANTS[car.variant].label}` : ''}{item.serial ? ` n° ${item.serial}/${VARIANTS[car.variant].serial}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                <Text style={[st.carMeta, { color: C.text, marginTop: 0 }]}>{fmt(quote(car, d))}</Text>
                <Trend car={car} />
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
}
