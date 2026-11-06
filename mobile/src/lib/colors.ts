import * as Haptics from 'expo-haptics';

/**
 * رموز التصميم الموحّدة (Design Tokens) — متوافقة مع v4 Modern Minimalism
 * أخضر الغابة (#2D6A4F) للعلامة والإجراءات، والليمي (#C5DE8F) للتمييز،
 * وأسطح هادئة خالية من التيل والكحلي القديمين.
 */
export const colors = {
  brand: '#2D6A4F',
  brandLight: '#3D8C68',
  brandBright: '#C5DE8F',
  brandSoft: 'rgba(45, 106, 79, 0.12)',
  brandBorder: 'rgba(45, 106, 79, 0.28)',
  brandDark: '#1B2A21',
  accent: '#2D6A4F',
  deep: '#121610',
  base: '#1A2018',
  elevated: '#232B20',
  /** سطور/بطاقات بين base و elevated */
  elevatedRaised: '#2C3529',
  /** شرائح وأزرار غير مفعّلة */
  surfaceRaised: '#242C21',
  /** حقول الإدخال وشرائح الأحرف */
  surfaceInset: '#121610',
  borderSubtle: 'rgba(227, 221, 203, 0.15)',
  text: '#F5F1E8',
  dim: '#9AA596',
  faint: '#7E8A7F',
  success: '#7FBF8E',
  successBright: '#A2D9AE',
  successSoft: 'rgba(127, 191, 142, 0.15)',
  successBorder: 'rgba(127, 191, 142, 0.35)',
  danger: '#E57A66',
  dangerStrong: '#F08C78',
  dangerText: '#F08C78',
  dangerSoft: 'rgba(229, 122, 102, 0.15)',
  dangerBorder: 'rgba(229, 122, 102, 0.35)',
  warning: '#E8B64C',
  warningText: '#F0C76B',
  warningBorder: 'rgba(232, 182, 76, 0.35)',
  warningSoft: 'rgba(232, 182, 76, 0.15)',
  info: '#6BA4B8',
  ps4Badge: '#5E6F63',
  ps5Badge: '#7A877C',
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
