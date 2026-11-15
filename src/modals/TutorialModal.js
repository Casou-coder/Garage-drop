import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { CAR_MAP, BOXES } from '../data';
import { CarArt } from '../components/CarArt';
import { BoxArt } from '../components/BoxArt';
import { C } from '../theme';
import { st } from '../styles';

const STEPS = [
  { title: 'Bienvenue au garage', text: 'Tape sur le plateau du Showroom pour gagner tes premiers euros. Chaque tap rapporte.', art: 'car', car: 'bra-2-C-s' },
  { title: 'Ouvre des boîtes', text: "Dans l'onglet Boîtes, chaque boîte cache une voiture. Les chances de chaque rareté sont affichées : plus la boîte est chère, plus les raretés montent.", art: 'box' },
  { title: 'Garde ou revends', text: "Garde les voitures qui te plaisent : elles rapportent de l'argent en continu. Revends les autres à la cote du jour, qui monte et descend.", art: 'car', car: 'kes-0-C-e' },
  { title: 'Complète ton carnet', text: '1 185 versions à découvrir. Chaque marque complétée augmente tes revenus. Ton compte et tes réglages sont en haut à gauche.', art: 'car', car: 'vel-0-Y-x' },
];

// Tutoriel du premier lancement (rejouable depuis le compte)
export function TutorialModal({ visible, initialName, onDone }) {
  const [i, setI] = useState(0);
  const [name, setName] = useState(initialName || '');
  useEffect(() => { if (visible) { setI(0); setName(initialName || ''); } }, [visible]);
  if (!visible) return null;

  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => onDone(name)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={st.overlay}>
        <View style={st.tutoCard}>
          <View style={{ height: 120, justifyContent: 'center' }}>
            {step.art === 'box'
              ? <View style={{ flexDirection: 'row', gap: 12 }}>{BOXES.slice(0, 3).map((b) => <BoxArt key={b.id} color={b.color} size={64} />)}</View>
              : <CarArt car={CAR_MAP[step.car]} width={210} />}
          </View>
          <Text style={st.tutoTitle}>{step.title}</Text>
          <Text style={st.tutoText}>{step.text}</Text>

          {last && (
            <TextInput
              style={[st.input, { alignSelf: 'stretch', marginTop: 16, textAlign: 'center' }]}
              value={name}
              onChangeText={setName}
              placeholder="Choisis un pseudo (facultatif)"
              placeholderTextColor={C.muted}
              maxLength={16}
              autoCorrect={false}
              returnKeyType="done"
              accessibilityLabel="Pseudo"
            />
          )}

          <View style={st.tutoDots}>
            {STEPS.map((_, k) => <View key={k} style={[st.tutoDot, k === i && { backgroundColor: C.yellow }]} />)}
          </View>

          <Pressable onPress={() => (last ? onDone(name) : setI(i + 1))} style={[st.cta, { alignSelf: 'stretch', alignItems: 'center' }]} accessibilityRole="button">
            <Text style={st.ctaText}>{last ? "C'est parti" : 'Suivant'}</Text>
          </Pressable>
          {!last && (
            <Pressable onPress={() => onDone(name)} hitSlop={10} style={{ marginTop: 14 }} accessibilityRole="button">
              <Text style={{ color: C.muted, fontSize: 14 }}>Passer</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
