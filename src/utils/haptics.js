import * as Haptics from 'expo-haptics';

export function hap(kind) {
  try {
    const p = kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : kind === 'big'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}
