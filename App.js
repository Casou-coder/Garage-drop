import React, { useState } from 'react';
import { View, Text, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { useGame } from './src/state/useGame';
import { HomeScreen } from './src/screens/HomeScreen';
import { BoxesScreen } from './src/screens/BoxesScreen';
import { GarageScreen } from './src/screens/GarageScreen';
import { CarnetScreen } from './src/screens/CarnetScreen';
import { UpgradesScreen } from './src/screens/UpgradesScreen';
import { RevealModal } from './src/modals/RevealModal';
import { DetailModal } from './src/modals/DetailModal';
import { C } from './src/theme';
import { st } from './src/styles';
import { fmt } from './src/utils/format';

const TABS = [['home', 'Showroom'], ['boxes', 'Boîtes'], ['garage', 'Garage'], ['carnet', 'Carnet'], ['upgrades', 'Atelier']];

export default function App() {
  const g = useGame();
  const { s, disc, done, value, perSec, toast, reveal, detail, setDetail } = g;
  const [tab, setTab] = useState('home');

  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="light-content" />
      <View style={st.header}>
        <Text style={st.brand}>GarageDrop</Text>
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
        {tab === 'upgrades' && <UpgradesScreen s={s} done={done} onUpgrade={g.upgrade} onReset={g.reset} onFast={g.setFast} />}
      </View>

      {toast && <View style={st.toast}><Text style={st.toastText}>{toast}</Text></View>}

      <View style={st.tabs}>
        {TABS.map(([k, label]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={st.tabBtn}>
            <Text style={[st.tabText, tab === k && { color: C.text }]}>{label}</Text>
            <View style={[st.tabBar, tab === k && { backgroundColor: C.yellow }]} />
          </Pressable>
        ))}
      </View>

      <RevealModal reveal={reveal} fast={s.fast} onFinish={g.finishReveal} />
      <DetailModal detail={detail} s={s} onClose={() => setDetail(null)} onSell={g.sellUid} />
    </SafeAreaView>
  );
}
