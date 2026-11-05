/**
 * motion.ts — ثوابت الحركة الموحدة (PLAN §5: مدد ومنحنيان فقط)
 *
 * الروح من موقع التحميل (مرجع هوية وإحساس): المنحنى التوقيعي
 * cubic-bezier(.18,.7,.25,1) + إيقاع هادئ. الحركات نفسها **أصلية للتطبيق**
 * (01-design-plan §4.2 المعتمدة 8/8) — لا زخرفة منقولة لا تقليد.
 * الدوريات المبرَّرة بمكان محدد: طفو شاشة الترحيب (4.3s) + نقطة الاتصال (2.4s).
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

/** أزمنة الحركات الدورية المبرَّرة لمكان محدد (ملّي ثانية) */
export const SITE = {
  /** طفو العنصر البطل — شاشة الترحيب حصراً (phone-float مثقل بالقيم الأصلية، 4.3s بدورة) */
  floatPeriod: 4300,
  floatHalf: 2150,
  /** نقطة الحالة النابضة — مؤشر الاتصال (2.4s) */
  beaconPeriod: 2400,
} as const;
