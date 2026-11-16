import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Switch, TextInput, Share, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRANDS, CARS } from '../data';
import { PRIVACY, PRIVACY_UPDATED } from '../data/privacy';
import { C } from '../theme';
import { st } from '../styles';
import { fmt } from '../utils/format';
import { rankOf } from '../utils/rank';

const VERSION = require('../../app.json').expo.version;

function Row({ k, v }) {
  return <View style={st.specRow}><Text style={st.specK}>{k}</Text><Text style={st.specV}>{v}</Text></View>;
}

// Compte en ligne : connexion, création, synchronisation
function OnlineCard({ cloud }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState(null);
  const act = async (fn) => { setNote(null); const r = await fn(); setNote(r); if (r.ok) setPassword(''); };
  const valid = /\S+@\S+\.\S+/.test(email.trim());
  const need = (fn, withPassword = true) => () => {
    if (!valid) return setNote({ ok: false, message: 'Saisis ton adresse e-mail.' });
    if (withPassword && password.length < 6) return setNote({ ok: false, message: 'Mot de passe : 6 caractères minimum.' });
    act(fn);
  };
  const confirmDelete = () => {
    if (Platform.OS === 'web') return act(cloud.deleteOnline);
    Alert.alert('Effacer tes données en ligne ?', 'La partie enregistrée sur ton compte sera supprimée et tu seras déconnecté. La partie de cet appareil est conservée.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => act(cloud.deleteOnline) },
    ]);
  };

  return (
    <View style={st.card}>
      <Text style={st.cardTitle}>Compte en ligne</Text>
      {!cloud.enabled ? (
        <Text style={[st.sectionHint, { marginBottom: 0 }]}>Le compte en ligne n'est pas activé dans cette version. Ta partie est enregistrée sur cet appareil ; utilise le code de sauvegarde pour la transférer.</Text>
      ) : cloud.email ? (
        <>
          <Row k="Connecté" v={cloud.email} />
          <Row k="Dernière synchronisation" v={cloud.lastSync ? new Date(cloud.lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'en attente'} />
          <Text style={[st.sectionHint, { marginTop: 10 }]}>Ta partie est envoyée sur ton compte chaque minute et quand tu quittes l'app. Connecte-toi sur un autre appareil pour la retrouver.</Text>
          <Pressable onPress={() => act(cloud.syncNow)} disabled={cloud.busy} style={[st.buy, cloud.busy && st.buyOff]} accessibilityRole="button">
            <Text style={st.buyText}>{cloud.busy ? 'Un instant…' : 'Synchroniser maintenant'}</Text>
          </Pressable>
          <Pressable onPress={() => act(cloud.signOut)} disabled={cloud.busy} style={[st.outlineBtn, { marginTop: 10 }]} accessibilityRole="button">
            <Text style={st.outlineBtnText}>Se déconnecter</Text>
          </Pressable>
          <Pressable onPress={confirmDelete} disabled={cloud.busy} style={{ alignSelf: 'center', paddingTop: 14 }} accessibilityRole="button">
            <Text style={{ color: C.red, fontSize: 14 }}>Effacer mes données en ligne</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={st.sectionHint}>Facultatif. Crée un compte pour sauvegarder ta partie en ligne et la retrouver sur un autre appareil.</Text>
          <TextInput style={st.input} value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor={C.muted}
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" accessibilityLabel="E-mail" />
          <TextInput style={[st.input, { marginTop: 8 }]} value={password} onChangeText={setPassword} placeholder="Mot de passe" placeholderTextColor={C.muted}
            secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="password" textContentType="password" accessibilityLabel="Mot de passe" />
          <Pressable onPress={need(() => cloud.signIn(email, password))} disabled={cloud.busy} style={[st.buy, { marginTop: 12 }, cloud.busy && st.buyOff]} accessibilityRole="button">
            <Text style={st.buyText}>{cloud.busy ? 'Un instant…' : 'Se connecter'}</Text>
          </Pressable>
          <Pressable onPress={need(() => cloud.signUp(email, password))} disabled={cloud.busy} style={[st.outlineBtn, { marginTop: 10 }]} accessibilityRole="button">
            <Text style={st.outlineBtnText}>Créer un compte</Text>
          </Pressable>
          <Pressable onPress={need(() => cloud.recover(email), false)} disabled={cloud.busy} style={{ alignSelf: 'center', paddingTop: 14 }} accessibilityRole="button">
            <Text style={{ color: C.muted, fontSize: 14 }}>Mot de passe oublié ?</Text>
          </Pressable>
        </>
      )}
      {!!note && <Text style={[st.errorText, note.ok && { color: C.green }]}>{note.message}</Text>}
    </View>
  );
}

function Setting({ label, hint, value, onChange }) {
  return (
    <View style={st.settingRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={st.carName}>{label}</Text>
        {!!hint && <Text style={st.carMeta}>{hint}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.yellow, false: C.line }} accessibilityLabel={label} />
    </View>
  );
}

// Espace Compte : profil, statistiques, réglages, sauvegarde, aide
export function AccountModal({ visible, g, onClose }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState('main');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  if (!visible) return null;

  const { s, disc, done, value } = g;
  const rank = rankOf(disc.size);
  const since = s.createdAt ? new Date(s.createdAt).toLocaleDateString('fr-FR') : "aujourd'hui";
  const close = () => { setPage('main'); setCode(''); setError(null); onClose(); };

  const share = () => {
    Share.share({ message: g.exportCode() }).catch(() => {});
  };
  const restore = () => {
    if (!code.trim()) return setError('Colle ton code de sauvegarde ci-dessus.');
    const run = () => {
      const err = g.importCode(code);
      if (err) setError(err); else close();
    };
    if (Platform.OS === 'web') return run();
    Alert.alert('Restaurer cette partie ?', 'La partie en cours sur cet appareil sera remplacée.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Restaurer', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <Modal animationType="slide" visible onRequestClose={page === 'main' ? close : () => setPage('main')}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[st.root, { paddingTop: insets.top }]}>
        <View style={st.header}>
          <Pressable onPress={page === 'main' ? close : () => setPage('main')} hitSlop={12} accessibilityRole="button">
            <Text style={{ color: C.yellow, fontSize: 16 }}>‹ {page === 'main' ? 'Retour au jeu' : 'Compte'}</Text>
          </Pressable>
        </View>

        {page === 'privacy' ? (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 + insets.bottom }}>
            <Text style={st.screenTitle}>Confidentialité</Text>
            <Text style={st.statLabel}>Mise à jour : {PRIVACY_UPDATED}</Text>
            {PRIVACY.map(([title, text]) => (
              <View key={title} style={{ marginTop: 18 }}>
                <Text style={st.cardTitle}>{title}</Text>
                <Text style={[st.sectionHint, { fontSize: 14, lineHeight: 20 }]}>{text}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 + insets.bottom }} keyboardShouldPersistTaps="handled">
            <Text style={st.screenTitle}>Mon compte</Text>

            <View style={st.card}>
              <Text style={st.cardTitle}>Profil</Text>
              <TextInput
                style={st.input}
                value={s.name}
                onChangeText={g.setName}
                placeholder="Ton pseudo"
                placeholderTextColor={C.muted}
                maxLength={16}
                autoCorrect={false}
                returnKeyType="done"
                accessibilityLabel="Pseudo"
              />
              <View style={{ marginTop: 10 }}>
                <Row k="Rang" v={rank.label} />
                {rank.next !== null && <Row k={`Prochain rang : ${rank.nextLabel}`} v={`${disc.size}/${rank.next} versions`} />}
                <Row k="Joueur depuis le" v={since} />
              </View>
              <Text style={[st.sectionHint, { marginTop: 10, marginBottom: 0 }]}>Ton profil est enregistré sur cet appareil, et sur ton compte en ligne si tu es connecté.</Text>
            </View>

            <OnlineCard cloud={g.cloud} />

            <View style={st.card}>
              <Text style={st.cardTitle}>Statistiques</Text>
              <Row k="Argent" v={fmt(s.coins)} />
              <Row k="Valeur du garage" v={fmt(value)} />
              <Row k="Voitures au garage" v={String(s.garage.length)} />
              <Row k="Carnet" v={`${disc.size}/${CARS.length} (${((disc.size / CARS.length) * 100).toFixed(1).replace('.', ',')} %)`} />
              <Row k="Marques complètes" v={`${done}/${BRANDS.length}`} />
              <Row k="Boîtes ouvertes" v={String(s.opened)} />
              <Row k="Taps" v={String(s.taps)} />
              <Row k="Série quotidienne" v={`${s.streak} jour${s.streak > 1 ? 's' : ''}`} />
            </View>

            <View style={st.card}>
              <Text style={st.cardTitle}>Réglages</Text>
              <Setting label="Sons" value={s.sound} onChange={(v) => g.setSetting('sound', v)} />
              <Setting label="Vibrations" value={s.haptics} onChange={(v) => g.setSetting('haptics', v)} />
              <Setting label="Ouvertures rapides" hint="Passe l'animation des boîtes." value={s.fast} onChange={(v) => g.setSetting('fast', v)} />
            </View>

            <View style={st.card}>
              <Text style={st.cardTitle}>Sauvegarde</Text>
              <Text style={st.sectionHint}>Ta partie est enregistrée automatiquement sur cet appareil. Pour la transférer ou la mettre à l'abri, exporte ton code et garde-le (Notes, mail…).</Text>
              <Pressable onPress={share} style={st.buy} accessibilityRole="button">
                <Text style={st.buyText}>Exporter mon code de sauvegarde</Text>
              </Pressable>
              <TextInput
                style={[st.input, { marginTop: 14, minHeight: 70, fontSize: 13, textAlignVertical: 'top' }]}
                value={code}
                onChangeText={(t) => { setCode(t); setError(null); }}
                placeholder="Colle ici un code de sauvegarde (GD2…)"
                placeholderTextColor={C.muted}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Code de sauvegarde à restaurer"
              />
              {!!error && <Text style={st.errorText}>{error}</Text>}
              <Pressable onPress={restore} style={[st.outlineBtn, { marginTop: 10 }]} accessibilityRole="button">
                <Text style={st.outlineBtnText}>Restaurer depuis ce code</Text>
              </Pressable>
            </View>

            <View style={st.card}>
              <Text style={st.cardTitle}>Aide</Text>
              <Pressable onPress={g.replayTutorial} style={[st.linkRow, { borderTopWidth: 0 }]} accessibilityRole="button">
                <Text style={st.linkText}>Revoir le tutoriel  ›</Text>
              </Pressable>
              <Pressable onPress={() => setPage('privacy')} style={st.linkRow} accessibilityRole="button">
                <Text style={st.linkText}>Politique de confidentialité  ›</Text>
              </Pressable>
              <Text style={[st.sectionHint, { marginTop: 8, marginBottom: 0 }]}>Tout l'argent du jeu est virtuel : aucun achat, aucune valeur réelle. Les marques et modèles sont fictifs.</Text>
            </View>

            <Pressable onPress={g.reset} style={{ alignSelf: 'center', padding: 14 }} accessibilityRole="button">
              <Text style={{ color: C.red }}>Recommencer à zéro</Text>
            </Pressable>
            <Text style={[st.statLabel, { textAlign: 'center' }]}>GarageDrop {VERSION}</Text>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
