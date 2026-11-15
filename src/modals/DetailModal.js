import React from 'react';
import { View, Text, Pressable, Modal, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COUNTRIES, EPOCHS, SEGMENTS, VARIANTS, BRAND_MAP, CAR_MAP } from '../data';
import { quote } from '../economy';
import { accel, vmax } from '../utils/performance';
import { CarArt } from '../components/CarArt';
import { RarityTag } from '../components/RarityTag';
import { Trend } from '../components/Trend';
import { C } from '../theme';
import { st } from '../styles';
import { fmt, flagOf } from '../utils/format';

/* ---------- Fiche voiture ---------- */
export function DetailModal({ detail, s, onClose, onSell }) {
  const insets = useSafeAreaInsets();
  if (!detail) return null;
  const item = detail.uid ? s.garage.find((x) => x.uid === detail.uid) : null;
  const car = CAR_MAP[item ? item.carId : detail.carId];
  if (!car) return null;
  const ghost = !!detail.ghost;
  const q = quote(car);
  const specs = [
    ['Année', String(car.year)],
    ['Origine', `${flagOf(car)} ${COUNTRIES[car.country].label}`],
    ['Catégorie', SEGMENTS[car.seg].label],
    ['Époque', EPOCHS[car.epoch].label],
    ['Puissance', ghost ? '?' : `${car.hp} ch`],
    ['0 à 100 km/h', ghost ? '?' : `${accel(car.hp).toFixed(1).replace('.', ',')} s`],
    ['Vitesse max', ghost ? '?' : `${vmax(car.hp)} km/h`],
  ];
  // Confirmation avant de vendre une pièce rare (Légendaire ou mieux) ou numérotée
  const sell = () => {
    if (Platform.OS === 'web' || (car.rarity < 3 && !item.serial)) return onSell(item.uid);
    Alert.alert('Vendre cette voiture ?', `${BRAND_MAP[car.brand].name} ${car.name} pour ${fmt(q)}. Cette vente est définitive.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Vendre', style: 'destructive', onPress: () => onSell(item.uid) },
    ]);
  };
  const diff = item && item.paid ? ((q - item.paid) / item.paid) * 100 : null;

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={st.sheetWrap}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[st.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <View style={{ alignItems: 'center' }}>
            {!ghost && <RarityTag r={car.rarity} />}
            <Text style={st.revealBrand}>{BRAND_MAP[car.brand].name}</Text>
            <Text style={st.revealModel}>{ghost ? '???' : car.name}</Text>
            {!ghost && car.variant !== 's' && (
              <Text style={st.carMeta}>{VARIANTS[car.variant].label}{item?.serial ? `, n° ${item.serial}/${VARIANTS[car.variant].serial}` : ''}</Text>
            )}
            <View style={{ marginVertical: 14 }}><CarArt car={car} width={240} ghost={ghost} /></View>
          </View>
          {specs.map(([k, v]) => (
            <View key={k} style={st.specRow}><Text style={st.specK}>{k}</Text><Text style={st.specV}>{v}</Text></View>
          ))}
          {ghost ? (
            <Text style={[st.sectionHint, { marginTop: 12 }]}>Pas encore découverte. Cible les boîtes {COUNTRIES[car.country].label} ou {SEGMENTS[car.seg].label} pour augmenter tes chances.</Text>
          ) : (
            <>
              <View style={st.specRow}>
                <Text style={st.specK}>Cote du jour</Text>
                <View style={{ alignItems: 'flex-end' }}><Text style={st.specV}>{fmt(q)}</Text><Trend car={car} /></View>
              </View>
              {diff !== null && (
                <View style={st.specRow}>
                  <Text style={st.specK}>Obtenue à</Text>
                  <Text style={[st.specV, { color: diff >= 0 ? C.green : C.red }]}>{fmt(item.paid)} ({diff >= 0 ? '+' : ''}{diff.toFixed(1).replace('.', ',')} %)</Text>
                </View>
              )}
            </>
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {item && (
              <Pressable onPress={sell} style={[st.choice, { borderColor: C.red }]} accessibilityRole="button">
                <Text style={[st.choiceText, { color: C.red }]}>Vendre {fmt(q)}</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} style={[st.choice, { backgroundColor: C.surface2, borderColor: C.surface2 }]}>
              <Text style={[st.choiceText, { color: C.text }]}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
