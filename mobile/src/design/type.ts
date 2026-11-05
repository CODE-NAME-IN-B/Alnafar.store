/**
 * type.ts — سلّم الخطوط (خمسة مستويات كحد أقصى وفق PLAN §3)
 * - عربي: IBM Plex Sans Arabic مع line-height ≥ 1.5 (القاعدة العربية)، بلا تباعد أحرف.
 * - الأرقام والمبالغ: tabular-nums دائماً.
 * - LAT للشعار اللاتيني والأرقام «01» المعزولة بـ direction:ltr.
 */
import { TextStyle } from 'react-native';
import { AR_FONT, LAT_FONT } from './fonts';

export const TYPE = {
  /** رقم بطول اليوم/الحالة الكبيرة */
  display: {
    fontFamily: AR_FONT.bold,
    fontSize: 32,
    lineHeight: 40,
  } as TextStyle,

  title: {
    fontFamily: AR_FONT.bold,
    fontSize: 20,
    lineHeight: 28,
  } as TextStyle,

  body: {
    fontFamily: AR_FONT.regular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  label: {
    fontFamily: AR_FONT.medium,
    fontSize: 13,
    lineHeight: 20,
  } as TextStyle,

  /** أصغر مقاس مسموح — سقف صارم 12sp (لا نص أصغر أبداً) */
  micro: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
} as const;

/** variant جاهز للأرقام الجدولية (مبالغ/هواتف/أرقام فواتير) */
export const TABULAR: TextStyle = {
  fontVariant: ['tabular-nums'],
};

/** شعار ALNAFAR لاتيني (معزول LTR تنسيقياً) */
export const LAT = {
  brand: {
    fontFamily: LAT_FONT.bold,
    fontSize: 15,
    letterSpacing: 0.06 * 15,
    writingDirection: 'ltr',
  } as TextStyle,
  kicker: {
    fontFamily: LAT_FONT.bold,
    fontSize: 10,
    letterSpacing: 0.13 * 10,
    writingDirection: 'ltr',
  } as TextStyle,
  step: {
    fontFamily: LAT_FONT.bold,
    fontSize: 12,
    writingDirection: 'ltr',
  } as TextStyle,
} as const;
