/**
 * نافذة تقويم خفيفة: اختيار يوم واحد أو مدى (من يوم إلى يوم).
 * كل الشاشات الإدارية تستخدمه بدل كتابة التاريخ يدوياً كنص.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ModalSheet from '@/components/ui/ModalSheet';
import AppButton from '@/components/ui/AppButton';
import { colors } from '@/lib/colors';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

/** أسماء أيام الأسبوع — الأحد أول الأسبوع (المعتمد في الليبيا) */
const WEEKDAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function toIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** لمود «مدى» يختار من/إلى — الافتراضي يوم واحد */
  range?: boolean;
  initialFrom?: string | null;
  initialTo?: string | null;
  onApply: (from: string | null, to: string | null) => void;
}

export default function DatePickerSheet({
  visible,
  onClose,
  range = false,
  initialFrom,
  initialTo,
  onApply,
}: Props) {
  const [cursor, setCursor] = useState(() => new Date());
  const [from, setFrom] = useState<string | null>(initialFrom ?? null);
  const [to, setTo] = useState<string | null>(initialTo ?? null);

  /* كل فتح يعيد التهيئة — نموذج نافذة مقصودة */
  const reset = (): void => {
    setCursor(new Date());
    setFrom(initialFrom ?? null);
    setTo(initialTo ?? null);
  };

  const pick = (iso: string): void => {
    if (!range) {
      setFrom(iso);
      setTo(null);
      return;
    }
    /* في مود المدى: أول اختيار = البداية، الثاني = النهاية (طرفان صفّى يبدلان) */
    if (from != null && to == null) {
      if (iso < from) {
        setTo(from);
        setFrom(iso);
      } else {
        setTo(iso);
      }
      return;
    }
    setFrom(iso);
    setTo(null);
  };

  const apply = (): void => {
    onApply(from, from != null ? (to ?? from) : null);
    onClose();
  };

  /* شبكة الشهر الحالي — الأسبوع يبدأ أحداً */
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const inRange = (iso: string): boolean => {
    if (!range || from == null || to == null) return false;
    return iso > from && iso < to;
  };

  const shiftMonth = (delta: number): void => {
    setCursor(new Date(year, month + delta, 1));
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title={range ? 'اختر المدى' : 'اختر اليوم'}>
      {/* رأس التنقل بين الأشهر */}
      <View style={styles.monthRow}>
        <Pressable
          onPress={() => shiftMonth(1)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="الشهر التالي"
          style={styles.monthBtn}
        >
          <Text style={styles.monthBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable
          onPress={() => shiftMonth(-1)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="الشهر السابق"
          style={styles.monthBtn}
        >
          <Text style={styles.monthBtnText}>›</Text>
        </Pressable>
      </View>

      {/* صف أسماء الأيام */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekDay}>
            {w}
          </Text>
        ))}
      </View>

      {/* شبكة الأيام */}
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.cell} />;
          const iso = toIso(d);
          const selected = iso === from || iso === to;
          return (
            <Pressable
              key={iso}
              onPress={() => pick(iso)}
              accessibilityRole="button"
              accessibilityLabel={`${d.getDate()} ${MONTHS[month]}`}
              accessibilityState={{ selected }}
              style={[styles.cell, inRange(iso) && styles.cellInRange, selected && styles.cellSelected]}
            >
              <Text style={[styles.cellText, selected && styles.cellTextSel]}>
                {d.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ملخص الاختيار + أزرار النهاية */}
      <Text style={styles.summary}>
        {from == null
          ? 'لم تختر يوماً بعد'
          : range
            ? `من ${from} إلى ${to ?? from}`
            : from}
      </Text>
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <AppButton label="كل التواريخ" variant="secondary" onPress={reset} />
        </View>
        <View style={{ flex: 1 }}>
          <AppButton label="اعتماد" onPress={apply} disabled={from == null} />
        </View>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthBtn: { paddingHorizontal: 16, paddingVertical: 4 },
  monthBtnText: { color: colors.dim, fontFamily: FONT.bold, fontSize: 20 },
  monthLabel: { color: colors.text, fontFamily: FONT.bold, fontSize: 14 },
  weekRow: {
    flexDirection: ROW,
    gap: 2,
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    color: colors.faint,
    fontFamily: FONT.medium,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: ROW,
    flexWrap: 'wrap',
    gap: 2,
  },
  cell: {
    width: '13.2%',
    aspectRatio: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { color: colors.dim, fontFamily: FONT.semibold, fontSize: 13 },
  cellTextSel: { color: colors.brandDark, fontFamily: FONT.bold },
  cellToday: { backgroundColor: colors.surfaceRaised },
  cellInRange: { backgroundColor: colors.brandSoft },
  cellSelected: { backgroundColor: colors.brand },
  summary: {
    marginTop: 12,
    marginBottom: 10,
    color: colors.faint,
    fontFamily: FONT.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  actions: { flexDirection: ROW, gap: 10 },
});
