import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from './src/state/useGame';
import { HomeScreen } from './src/screens/HomeScreen';
import { BoxesScreen } from './src/screens/BoxesScreen';
import { GarageScreen } from './src/screens/GarageScreen';
import { CarnetScreen } from './src/screens/CarnetScreen';
import { UpgradesScreen } from './src/screens/UpgradesScreen';
import { RevealModal } from './src/modals/RevealModal';
import { DetailModal } from './src/modals/DetailModal';
import { AccountModal } from './src/modals/AccountModal';
import { TutorialModal } from './src/modals/TutorialModal';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { C } from './src/theme';
import { st } from './src/styles';
import { fmt } from './src/utils/format';

const TABS = [['home', 'Showroom'], ['boxes', 'Boîtes'], ['garage', 'Garage'], ['carnet', 'Carnet'], ['upgrades', 'Atelier']];

function Game() {
  const g = useGame();
  const { s, loaded, disc, done, value, perSec, toast, reveal, detail, setDetail } = g;
  const [tab, setTab] = useState('home');
  const insets = useSafeAreaInsets();

  // Tant que la sauvegarde n'est pas lue, on n'affiche rien (évite un flash de partie vide)
  if (!loaded) return <View style={st.root} />;

  return (
    <View style={[st.root, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <View style={st.header}>
        <Pressable onPress={() => g.setAccount(true)} hitSlop={8} style={st.avatar} accessibilityRole="button" accessibilityLabel="Mon compte">
          <Text style={st.avatarText}>{s.name ? s.name[0].toUpperCase() : '☰'}</Text>
        </Pressable>
        <Text style={[st.brand, { flex: 1 }]} numberOfLines={1}>GarageDrop</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={st.coins}>{fmt(s.coins)}</Text>
          <Text style={st.rate}>+{fmt(perSec)} / s</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen s={s} value={value} disc={disc} onTap={g.tap} onDaily={g.claimDaily} onOpenDetail={setDetail} />}
        {tab === 'boxes' && <BoxesScreen coins={s.coins} onOpen={g.openBox} />}
        {tab === 'garage' && <GarageScreen s={s} onOpenDetail={setDetail} onDup={g.sellDuplicates} onTrade={g.tradeUp} />}
        {tab === 'carnet' && <CarnetScreen disc={disc} done={done} onOpenDetail={setDetail} />}
        {tab === 'upgrades' && <UpgradesScreen s={s} done={done} onUpgrade={g.upgrade} />}
      </View>

      {toast && <View style={[st.toast, { bottom: 72 + insets.bottom }]} pointerEvents="none"><Text style={st.toastText}>{toast}</Text></View>}

      <View style={[st.tabs, { paddingBottom: insets.bottom }]}>
        {TABS.map(([k, label]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={st.tabBtn} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} accessibilityLabel={label}>
            <Text style={[st.tabText, tab === k && { color: C.text }]} numberOfLines={1}>{label}</Text>
            <View style={[st.tabBar, tab === k && { backgroundColor: C.yellow }]} />
          </Pressable>
        ))}
      </View>

      <RevealModal reveal={reveal} fast={s.fast} onFinish={g.finishReveal} />
      <DetailModal detail={detail} s={s} onClose={() => setDetail(null)} onSell={g.sellUid} />
      <AccountModal visible={g.account} g={g} onClose={() => g.setAccount(false)} />
      <TutorialModal visible={!s.tutorialDone} initialName={s.name} onDone={g.finishTutorial} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary>
        <Game />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
