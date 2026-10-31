/**
 * زمن التركيب التقديري كما في الواجهة:
 * دقائق = أكبر(10, تقريب لأعلى إجمالي الحجم / 50 × 10)
 */
export function estimateMinutes(totalSizeGb: number): number {
  if (!totalSizeGb || totalSizeGb <= 0) return 10;
  return Math.max(10, Math.ceil(totalSizeGb / 50) * 10);
}
