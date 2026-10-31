/** تطبيع رقم الهاتف/الواتساب إلى صيغة كود ليبيا 218 (مثل الواجهة) */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // 218XXXXXXXXX جاهزة
  if (digits.startsWith('218')) return digits.slice(0, 12);
  // 00218XXXXXXXXX → احذف الصفرين
  if (digits.startsWith('00218')) return '218' + digits.slice(5, 5 + 9);
  // 0XX → بدون الصفر
  if (digits.startsWith('0')) return '218' + digits.slice(1, 1 + 9);
  // رقم محلي بلا كود
  return '218' + digits.slice(0, 9);
}
