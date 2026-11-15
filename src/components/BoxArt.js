import React from 'react';
import { View } from 'react-native';

export function BoxArt({ color, size = 64 }) {
  const sq = size / 8;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.14, backgroundColor: color, overflow: 'hidden' }}>
      {[0, 1].map((row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ width: sq, height: sq, backgroundColor: (i + row) % 2 ? '#F2EFE6' : '#14171C' }} />
          ))}
        </View>
      ))}
      <View style={{ position: 'absolute', left: size / 2 - sq / 2, top: sq * 2, bottom: 0, width: sq, backgroundColor: 'rgba(0,0,0,0.22)' }} />
    </View>
  );
}
