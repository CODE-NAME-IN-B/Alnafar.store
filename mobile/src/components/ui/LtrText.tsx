import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { FONT } from '@/lib/fonts';
import { colors } from '@/lib/colors';

const LRI = '\u2066'; // Left-to-Right Isolate
const PDI = '\u2069'; // Pop Directional Isolate

/** عزل سلسلة نصية لاتينية أو رقمية (مثل رقم فاتورة أو هاتف) داخل جملة عربية */
export function ltrIsolate(value: string | number | null | undefined): string {
  const str = String(value ?? '').trim();
  if (!str) return '';
  return `${LRI}${str}${PDI}`;
}

/** توحيد صيغة رقم الفاتورة وعزل اتجاهه في كل مكان (#20261029-001) */
export function formatInvoiceCode(raw: string | number | null | undefined): string {
  const clean = String(raw ?? '').trim().replace(/^#+/, '');
  if (!clean) return `${LRI}#—${PDI}`;
  return `${LRI}#${clean}${PDI}`;
}

const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

/** تحويل تاريخ ISO (مثل 2026-10-31) إلى صيغة عربية مقروءة (31 أكتوبر 2026) */
export function formatArabicDate(iso?: string | null): string {
  if (!iso) return '';
  const datePart = iso.slice(0, 10);
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const monthIdx = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    if (year > 2000 && monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
      return `${day} ${AR_MONTHS[monthIdx]} ${year}`;
    }
  }
  return datePart;
}

/**
 * مكوّن LtrText لعزل أرقام الفواتير والهواتف والأحجام والأكواد
 * بحيث لا تنعكس الأرقام أو الواصلات (-) داخل واجهة RTL.
 */
export function LtrText({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.ltr, style]}>
      {LRI}
      {children}
      {PDI}
    </Text>
  );
}

export default LtrText;

const styles = StyleSheet.create({
  ltr: {
    fontFamily: FONT.bold,
    color: colors.text,
    writingDirection: 'ltr',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
