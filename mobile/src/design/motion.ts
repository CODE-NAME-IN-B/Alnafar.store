/**
 * motion.ts — ثوابت الحركة الموحدة (PLAN §5: مدد ومنحنيان فقط)
 *
 * المنحنى التوقيعي مأخوذ حرفياً من موقع التحميل: cubic-bezier(.18,.7,.25,1)
 * (00b-web-reference §D — «المنحنى التوقيعي»). مدد: ضغط/سريع/سطوح كبيرة.
 *
 * تحوّل أزمنة الموقع (حرفياً حيث استُخدمت):
 * - دخول stagger: 720–820ms بتأخير 80ms متتالٍ (copy-arrive).
 * - طفو الهاتف: 4.3s∞ (نصف كل اتجاه 2.15s).
 * - مسح edge lime: 8s linear ∞.
 * - نقطة الشارة: 2.4s ∞.
 * - الحلقتان: 23s / 31s linear ∞.
 */
import { Easing } from 'react-native-reanimated';

export const DUR = {
  /** ضغط/تغذية راجعة فورية */
  press: 120,
  /** انتقالات سريعة: underline، chips، تبديل قائمة */
  quick: 200,
  /** سطوح كبيرة: sheets، انتقالات شاشة */
  sheet: 320,
  /** دخول عناصر (نمط copy-arrive من الموقع) */
  entry: 720,
  entrySlow: 820,
  /** فاصل متتالٍ بين عناصر الدخول */
  stagger: 80,
} as const;

export const EASE = {
  /** توقيع الموقع: cubic-bezier(0.18, 0.7, 0.25, 1) */
  signature: Easing.bezier(0.18, 0.7, 0.25, 1),
  linear: Easing.linear,
} as const;

/** أزمنة الحركات الدورية المنقولة من الموقع (ملي ثانية) */
export const SITE = {
  floatPeriod: 4300,
  floatHalf: 2150,
  beaconPeriod: 2400,
  sweepPeriod: 8000,
  orbitShort: 23000,
  orbitLong: 31000,
} as const;
