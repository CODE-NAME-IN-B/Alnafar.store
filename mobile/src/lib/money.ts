/** تنسيق المبالغ بالدينار الليبي مثل الواجهة: 1,200 د.ل */
export function formatDinar(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const formatted = rounded.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return `${formatted} د.ل`;
}
