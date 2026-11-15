import React from 'react';
import { Text } from 'react-native';
import { dayIndex, quote } from '../economy';
import { C } from '../theme';

// Variation de la cote entre hier et aujourd'hui
export function Trend({ car }) {
  const d = dayIndex();
  const now = quote(car, d), before = quote(car, d - 1);
  const pct = ((now - before) / before) * 100;
  const up = pct >= 0;
  return <Text style={{ color: up ? C.green : C.red, fontSize: 12 }}>{up ? '▲' : '▼'} {Math.abs(pct).toFixed(1).replace('.', ',')} %</Text>;
}
