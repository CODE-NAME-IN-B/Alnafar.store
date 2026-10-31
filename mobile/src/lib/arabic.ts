/** أدوات الفلترة الأبجدية العربية كما في الواجهة (أ–ي مع خانة «#») */
export const ARABIC_LETTERS = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز',
  'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق',
  'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي', '#',
] as const;

/** الحرف الأول لعنوان لعبة (مع تطبيع «أ/إ/آ» إلى «أ») */
export function firstLetterOf(title: string): string {
  const t = title.trim();
  if (!t) return '#';
  const c = t[0];
  if (/[A-Za-z]/.test(c)) return '#';
  const normalized = c.replace(/[إآٱ]/g, 'أ').replace(/ى/g, 'ي');
  let key = normalized;
  if (normalized === 'ا') key = 'أ';
  if (normalized === 'ه') key = 'هـ';
  return ARABIC_LETTERS.includes(key as (typeof ARABIC_LETTERS)[number]) ? key : '#';
}

/** هل العنوان يطابق الحرف المختار؟ (الحرف الفارغ = الكل) */
export function matchesLetter(title: string, letter: string | null): boolean {
  if (!letter) return true;
  return firstLetterOf(title) === letter;
}
