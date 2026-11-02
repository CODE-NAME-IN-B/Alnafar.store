import * as Haptics from 'expo-haptics';

/**
 * رموز التصميم الموحّدة (Design Tokens) — المرحلة U1
 * لون علامة واحد (#14b8a6) للإجراءات والتفعيل، و3 مستويات للسطوح، وتباين >= 4.5:1 للنصوص.
 */
export const colors = {
  brand: '#14b8a6',
  brandLight: '#2dd4bf',
  brandSoft: 'rgba(20, 184, 166, 0.14)',
  brandDark: '#042f2e',
  accent: '#14b8a6',
  deep: '#090d16',
  base: '#0f1724',
  elevated: '#141e30',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  text: '#f8fafc',
  dim: '#cbd5e1',
  faint: '#94a3b8',
  success: '#22c55e',
  successSoft: 'rgba(34, 197, 94, 0.14)',
  danger: '#ef4444',
  dangerSoft: 'rgba(239, 68, 68, 0.14)',
  warning: '#f59e0b',
  warningSoft: 'rgba(245, 158, 11, 0.16)',
  info: '#3b82f6',
  ps4Badge: '#0ea5e9',
  ps5Badge: '#a855f7',
} as const;

export const tokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    control: 12,
    card: 16,
    sheet: 24,
    pill: 999,
  },
  touch: {
    button: 48,
    iconMin: 44,
  },
  type: {
    pageTitle: { fontSize: 22, lineHeight: 30 },
    cardTitle: { fontSize: 16, lineHeight: 24 },
    body: { fontSize: 15, lineHeight: 24 },
    secondary: { fontSize: 13, lineHeight: 20 },
    caption: { fontSize: 12, lineHeight: 18 },
  },
} as const;

/** استجابة اهتزازية خفيفة وفورية عند الضغط (تحترم الأجهزة التي لا تدعم الاهتزاز) */
export function triggerLightHaptic(): void {
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore on unsupported devices
  }
}

/** إشعار نجاح مزدوج: صوت + اهتزاز — عند إضافة عنصر للسلة أو إتمام إجراء مهم */
export function triggerSuccessFeedback(playSound: () => void): void {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {
    // ignore on unsupported devices
  }
  playSound();
}
