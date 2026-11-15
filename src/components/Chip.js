import React from 'react';
import { Text, Pressable, ScrollView } from 'react-native';
import { C } from '../theme';
import { st } from '../styles';

export function Chip({ label, active, onPress, color }) {
  return (
    <Pressable onPress={onPress} style={[st.chip, active && { backgroundColor: color || C.yellow, borderColor: color || C.yellow }]}>
      <Text style={[st.chipText, active && { color: '#1C2128' }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ flexGrow: 0, marginBottom: 10 }}>
      {children}
    </ScrollView>
  );
}
