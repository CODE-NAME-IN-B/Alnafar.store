import * as Haptics from 'expo-haptics';

/**
 * رموز التصميم الموحّدة (Design Tokens) — المرحلة U1
 * لون علامة واحد (#14b8a6) للإجراءات والتفعيل، و3 مستويات للسطوح، وتباين >= 4.5:1 للنصوص.
 */
export const colors = {
  brand: '#14b8a6',
  brandLight: '#2dd4bf',
  brandBright: '#5eead4',
  brandSoft: 'rgba(20, 184, 166, 0.14)',
  brandBorder: 'rgba(45, 212, 191, 0.35)',
  brandDark: '#042f2e',
  accent: '#14b8a6',
  deep: '#090f1d',
  base: '#0f1724',
  elevated: '#141e30',
  /** سطور/بطاقات بين base و elevated (كانت #131d31/#121c2e/#0f1829 متفرقة) */
  elevatedRaised: '#131d31',
  /** شرائح وأزرار غير مفعّلة (دمجت #1b2b48 المتناثرة في 7 ملفات) */
  surfaceRaised: '#1b2b48',
  /** حقول الإدخال وشرائح الأحرف والكاميرا (كانت #0b1220) */
  surfaceInset: '#0b1220',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  text: '#f8fafc',
  dim: '#cbd5e1',
  faint: '#94a3b8',
  success: '#22c55e',
  successBright: '#34d399',
  successSoft: 'rgba(34, 197, 94, 0.14)',
  successBorder: 'rgba(34, 197, 94, 0.4)',
  danger: '#ef4444',
  dangerStrong: '#f87171',
  dangerText: '#fca5a5',
  dangerSoft: 'rgba(239, 68, 68, 0.14)',
  dangerBorder: 'rgba(252, 165, 165, 0.25)',
  warning: '#f59e0b',
  warningText: '#fbbf24',
  warningBorder: 'rgba(251, 191, 36, 0.4)',
  warningSoft: 'rgba(245, 158, 11, 0.16)',
  info: '#3b82f6',
  ps4Badge: '#0ea5e9',
  ps5Badge: '#a855f7',
} as const;

/** قالب الإيصال الورقي (سطح فاتح) — أزواج تباين مُحسوبة على الأبيض */
export const receiptColors = {
  bg: '#ffffff',
  muted: '#475569',
  divider: '#cbd5e1',
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
