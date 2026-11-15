import React from 'react';
import { View, Text } from 'react-native';
import { hash } from '../data';
import { C } from '../theme';
import { lum } from '../utils/format';

/* ---------- Dessin des voitures ---------- */
const SHAPES = {
  city: { cl: 30, cw: 82, ct: 14, ch: 26, bt: 36, bh: 26, r1: 18, r2: 14 },
  berline: { cl: 38, cw: 74, ct: 18, ch: 22, bt: 38, bh: 22, r1: 16, r2: 12 },
  wagon: { cl: 26, cw: 96, ct: 18, ch: 22, bt: 38, bh: 22, r1: 4, r2: 14 },
  limo: { cl: 30, cw: 90, ct: 18, ch: 22, bt: 38, bh: 22, r1: 12, r2: 12 },
  suv: { cl: 24, cw: 104, ct: 10, ch: 28, bt: 36, bh: 28, r1: 6, r2: 10, ws: 28 },
  offroad: { cl: 26, cw: 92, ct: 8, ch: 30, bt: 36, bh: 28, r1: 3, r2: 4, ws: 30 },
  pickup: { cl: 66, cw: 52, ct: 12, ch: 26, bt: 36, bh: 28, r1: 4, r2: 10, ws: 28 },
  electric: { cl: 34, cw: 84, ct: 18, ch: 22, bt: 38, bh: 22, r1: 28, r2: 22 },
  muscle: { cl: 52, cw: 56, ct: 22, ch: 20, bt: 38, bh: 24, r1: 8, r2: 12 },
  roadster: { cl: 84, cw: 10, ct: 28, ch: 14, bt: 40, bh: 20, r1: 2, r2: 6, open: true },
  sport: { cl: 46, cw: 60, ct: 22, ch: 20, bt: 40, bh: 20, r1: 22, r2: 10 },
  rally: { cl: 44, cw: 64, ct: 20, ch: 22, bt: 40, bh: 20, r1: 14, r2: 10 },
  gt: { cl: 42, cw: 62, ct: 22, ch: 20, bt: 40, bh: 20, r1: 24, r2: 12 },
  super: { cl: 54, cw: 52, ct: 28, ch: 16, bt: 42, bh: 18, r1: 24, r2: 8 },
  hyper: { cl: 58, cw: 46, ct: 32, ch: 14, bt: 44, bh: 17, r1: 22, r2: 6, wing: true },
  prewar: { cl: 30, cw: 48, ct: 6, ch: 34, bt: 40, bh: 18, r1: 4, r2: 4, ws: 30, fenders: true },
};

export function CarArt({ car, width = 160, ghost = false }) {
  const s = width / 160;
  const sh = SHAPES[car.epoch === 'P' ? 'prewar' : car.seg] || SHAPES.berline;
  const v = car.variant || 's';
  const paint = ghost ? C.line : v === 'c' ? '#2C3036' : v === 'x' ? '#D3D9DF' : car.color;
  const ws = sh.ws || 26;
  const wTop = (sh.bt + sh.bh - ws * 0.55) * s;
  const bodyR = (car.epoch === 'C' ? 14 : car.epoch === 'P' ? 5 : 10) * s;
  const hub = ghost ? C.surface2 : v === 'l' ? '#D4AF37' : v === 'x' ? '#FFFFFF' : '#B8BEC6';
  const accent = lum(car.color) > 0.6 ? '#1C2128' : '#F2EFE6';
  const wheels = [22, 160 - 22 - ws];

  return (
    <View style={{ width, height: 84 * s }}>
      <View style={{ position: 'absolute', left: 16 * s, right: 16 * s, top: 76 * s, height: 5 * s, borderRadius: 3 * s, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      {sh.wing && (
        <>
          <View style={{ position: 'absolute', left: 8 * s, top: (sh.bt - 9) * s, width: 26 * s, height: 4 * s, borderRadius: 2 * s, backgroundColor: paint }} />
          <View style={{ position: 'absolute', left: 18 * s, top: (sh.bt - 6) * s, width: 4 * s, height: 7 * s, backgroundColor: paint }} />
        </>
      )}
      {!sh.open && (
        <View style={{ position: 'absolute', left: sh.cl * s, top: sh.ct * s, width: sh.cw * s, height: (sh.ch + 6) * s, backgroundColor: paint, borderTopLeftRadius: sh.r1 * s, borderTopRightRadius: sh.r2 * s, overflow: 'hidden' }}>
          {!ghost && <View style={{ position: 'absolute', left: 6 * s, right: 6 * s, top: 5 * s, height: (sh.ch - 6) * s, backgroundColor: '#BFD7EA', opacity: 0.85, borderTopLeftRadius: Math.max(sh.r1 - 4, 1) * s, borderTopRightRadius: Math.max(sh.r2 - 4, 1) * s }} />}
        </View>
      )}
      {sh.open && !ghost && (
        <View style={{ position: 'absolute', left: sh.cl * s, top: sh.ct * s, width: sh.cw * s, height: (sh.ch + 4) * s, backgroundColor: '#BFD7EA', opacity: 0.8, borderTopRightRadius: sh.r2 * s }} />
      )}
      {sh.fenders && wheels.map((wl, i) => (
        <View key={'f' + i} style={{ position: 'absolute', left: (wl - 5) * s, top: wTop - 6 * s, width: (ws + 10) * s, height: ((ws + 10) / 2 + 4) * s, backgroundColor: paint, borderTopLeftRadius: ((ws + 10) / 2) * s, borderTopRightRadius: ((ws + 10) / 2) * s }} />
      ))}
      <View style={{ position: 'absolute', left: 4 * s, right: 4 * s, top: sh.bt * s, height: sh.bh * s, backgroundColor: paint, borderRadius: bodyR, overflow: 'hidden' }}>
        {!ghost && (
          <>
            {v === 'c' && Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: i * 13 * s, width: 6 * s, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            ))}
            {v === 'x' && <View style={{ position: 'absolute', left: 0, right: 0, top: 2 * s, height: sh.bh * 0.28 * s, backgroundColor: 'rgba(255,255,255,0.6)' }} />}
            {v === 'e' && <View style={{ position: 'absolute', left: 8 * s, right: 8 * s, top: sh.bh * 0.42 * s, height: 4 * s, backgroundColor: accent }} />}
            {v === 'l' && <View style={{ position: 'absolute', left: 8 * s, right: 8 * s, top: sh.bh * 0.62 * s, height: 1.5 * s, backgroundColor: '#D4AF37' }} />}
            <View style={{ position: 'absolute', right: 3 * s, top: 5 * s, width: 8 * s, height: 5 * s, borderRadius: 2 * s, backgroundColor: '#FFF3B0' }} />
            <View style={{ position: 'absolute', left: 3 * s, top: 5 * s, width: 6 * s, height: 5 * s, borderRadius: 2 * s, backgroundColor: '#E63946' }} />
            {sh.open && <View style={{ position: 'absolute', left: (sh.cl - 48) * s, width: 44 * s, top: 0, height: 4 * s, backgroundColor: 'rgba(0,0,0,0.45)' }} />}
            {car.seg === 'rally' && (
              <View style={{ position: 'absolute', left: 66 * s, top: (sh.bh / 2 - 7) * s, width: 14 * s, height: 14 * s, borderRadius: 7 * s, backgroundColor: '#F2EFE6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 9 * s, fontWeight: '800', color: '#1C2128' }}>{(hash(car.model) % 9) + 1}</Text>
              </View>
            )}
          </>
        )}
      </View>
      {wheels.map((wl, i) => (
        <View key={'w' + i} style={{ position: 'absolute', left: wl * s, top: wTop, width: ws * s, height: ws * s, borderRadius: (ws / 2) * s, backgroundColor: '#111418', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: ws * 0.42 * s, height: ws * 0.42 * s, borderRadius: ws * 0.21 * s, backgroundColor: hub }} />
        </View>
      ))}
    </View>
  );
}
