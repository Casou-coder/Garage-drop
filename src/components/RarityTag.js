import React from 'react';
import { View, Text } from 'react-native';
import { RAR } from '../data';
import { st } from '../styles';

export function RarityTag({ r }) {
  return (
    <View style={[st.tag, { borderColor: RAR[r].color }]}>
      <Text style={[st.tagText, { color: RAR[r].color }]}>{RAR[r].label}</Text>
    </View>
  );
}
