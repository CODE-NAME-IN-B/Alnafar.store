/**
 * tokens.ts — طبقة الرموز للثيمين (المصدر الوحيد للألوان)
 *
 * بنية ثلاثية وفق ui-atelier: primitives (مستخرجة من PLAN §3 + موقع التحميل 00b §B)
 * → semantic Palette (ثيمان بنفس الأسماء) → استهلاك في theme.tsx.
 *
 * قواعد PLAN الصارمة:
 * - الثيم الفاتح الكريمي هو الافتراضي (يطابق الموقع).
 * - lime تعبئة خلف نص غامق فقط (لا نص lime على الكريمي)، ولا تظهر بأكثر من 2-3 مواضع.
 * - إجراء رئيسي واحد لكل شاشة: فاتح = forest بنص أبيض، داكن = lime بنص ink.
 * - المبالغ بلون النص دائماً (money) — ليست ملونة.
 * - المنصات PS4/PS5/PS3/PC: حد رفيع أحادي (surfaceLine) + تسمية نصية — لا ألوان هويات (قرار §12.4).
 */

/** PRIM = القيم الخام فقط. ممنوع استيرادها من الشاشات — استعمل usePalette() */
export const PRIM = {
  // فاتح (كريمي — من PLAN §3 والموقع #f4efe4/#fffdf8/#ded8ca family)
  creamBg: '#F5F1E8',
  creamGrad: '#EFEADD',
  surface: '#FBF9F3',
  paperSoft: '#F7F3EA', // surfaceRaised للفاتح — من الموقع (--paper-soft)
  line: '#E3DDCB',
  inkText: '#1B2A21',
  mutedLight: '#5E6F63',
  faintLight: '#7A877C',
  forest: '#2D6A4F',
  forestDeep: '#244F43',
  gradEnd: '#9CAF6C', // نهاية تدرج العناوين (من الموقع: #9caf6c عند 49%)
  lime: '#C5DE8F',
  dangerL: '#C0473A',
  warningL: '#A8732A',
  successL: '#2F7D46',
  white: '#FFFFFF',

  // داكن (من PLAN §3)
  ink: '#121610',
  surfaceD: '#1A2018',
  raised: '#232B20',
  creamText: '#F5F1E8',
  mutedD: '#9AA596',
  faintD: '#7E8A7F',
  dangerD: '#E57A66',
  warningD: '#E8B64C',
  successD: '#7FBF8E',
} as const;

/** المجموعة الدلالية — نفس الأسماء في الثيمين دائماً */
export interface Palette {
  name: 'light' | 'dark';

  /** خلفيات وسطوح */
  canvas: string;
  /** تدرج خلفية ناعم (فاتح فقط؛ الداكن يبقى سطحاً صلباً بلا تدرج) */
  canvasGrad: string | null;
  surface: string;
  /** حقول الإدخال، chips خاملة، أزرار ثانوية */
  surfaceRaised: string;
  /** حدود 1px */
  surfaceLine: string;

  /** نصوص */
  text: string;
  textSub: string;
  textFaint: string;

  /** الإجراء الرئيسي: فاتح = forest بنص أبيض، داكن = lime بنص ink */
  primary: string;
  onPrimary: string;
  primaryPressed: string;

  /** التمييز (lime): نقاط نشطة، شارات بعتبة نص غامق، خط edge */
  accent: string;
  onAccent: string;

  /** تدرج العناوين الكبيرة (نمط الموقع: green-dark→green→#9caf6c) */
  headlineGrad: readonly [string, string, string];

  /** المبالغ — لون النص دائماً، ليست ملونة */
  money: string;

  /** دلالية (نص/حدّ فقط، لا تعبئة قرب الإجراءات) */
  danger: string;
  warning: string;
  success: string;

  /** خلفية الإيصال المطبوع/المعروض (ورق أبيض دائماً) */
  receiptPaper: string;

  /** scrim فوق الغلافات والصور */
  scrim: string;
}

export const LIGHT: Palette = {
  name: 'light',
  canvas: PRIM.creamBg,
  canvasGrad: PRIM.creamGrad,
  surface: PRIM.surface,
  surfaceRaised: PRIM.paperSoft,
  surfaceLine: PRIM.line,
  text: PRIM.inkText,
  textSub: PRIM.mutedLight,
  textFaint: PRIM.faintLight,
  primary: PRIM.forest,
  onPrimary: PRIM.white,
  primaryPressed: PRIM.forestDeep,
  accent: PRIM.lime,
  onAccent: PRIM.inkText,
  headlineGrad: [PRIM.forestDeep, PRIM.forest, PRIM.gradEnd],
  money: PRIM.inkText,
  danger: PRIM.dangerL,
  warning: PRIM.warningL,
  success: PRIM.successL,
  receiptPaper: PRIM.white,
  scrim: 'rgba(11, 13, 9, 0.45)',
};

export const DARK: Palette = {
  name: 'dark',
  canvas: PRIM.ink,
  canvasGrad: null,
  surface: PRIM.surfaceD,
  surfaceRaised: PRIM.raised,
  surfaceLine: 'rgba(245, 241, 232, 0.10)',
  text: PRIM.creamText,
  textSub: PRIM.mutedD,
  textFaint: PRIM.faintD,
  primary: PRIM.lime,
  onPrimary: PRIM.ink,
  primaryPressed: PRIM.forestDeep,
  accent: PRIM.lime,
  onAccent: PRIM.ink,
  headlineGrad: [PRIM.lime, PRIM.gradEnd, PRIM.forest],
  money: PRIM.creamText,
  danger: PRIM.dangerD,
  warning: PRIM.warningD,
  success: PRIM.successD,
  receiptPaper: PRIM.white,
  scrim: 'rgba(0, 0, 0, 0.50)',
};
