/**
 * design-probe.tsx — screen مؤقتة للفحص على الجهاز (تُحذف عند دمج المكونات في المرحلة 3)
 * تعرض: مبدّل السمة (فاتح/داكن/النظام)، عيّنة الرموز الدلالية، السلم المطبوعي بأرقام جدولية،
 * وحركات الموقع المنقولة (شارة نبض + underline + edge lime + طفو).
 * كل ألوانها من usePalette() فقط — لا لون hex واحداً هنا.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import {
  AnimatedUnderline,
  EntryIn,
  SignalBeacon,
  useFloatMotion,
} from '@/design/motion-library';
import { usePalette, useThemeName, useThemeMode, type ThemeModeName } from '@/design/theme';
import { TABULAR, TYPE, LAT } from '@/design/type';

const MODES: readonly ThemeModeName[] = ['light', 'dark', 'system'] as const;
const MODE_LABEL: Record<ThemeModeName, string> = {
  light: 'فاتح',
  dark: 'داكن',
  system: 'النظام',
};

export default function DesignProbe() {
  const palette = usePalette();
  const themeName = useThemeName();
  const mode = useThemeMode((s) => s.mode);
  const setMode = useThemeMode((s) => s.setMode);
  const [underlineOn, setUnderlineOn] = useState(true);
  const floatStyle = useFloatMotion();

  const swatchKeys = [
    'canvas',
    'surface',
    'surfaceRaised',
    'surfaceLine',
    'text',
    'textSub',
    'textFaint',
    'primary',
    'onPrimary',
    'accent',
    'onAccent',
    'money',
    'danger',
    'warning',
    'success',
    'receiptPaper',
  ] as const;

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: palette.canvas,
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <EntryIn index={0}>
          <Text style={[styles.heading, TYPE.title, { color: palette.text }]}>
            شاشة فحص طبقة التصميم
          </Text>
          <Text style={[styles.sub, TYPE.label, { color: palette.textSub }]}>
            الثيم المحلول: {themeName === 'dark' ? 'داكن' : 'فاتح'}
          </Text>
        </EntryIn>

        {/* مبدّل النمط */}
        <EntryIn index={1}>
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
            ]}
          >
            <Text style={[TYPE.label, { color: palette.textSub }]}>نمط السمة</Text>
            <View style={styles.modeRow}>
              {MODES.map((m) => (
                <View
                  key={m}
                  style={[
                    styles.modeChip,
                    { backgroundColor: mode === m ? palette.primary : palette.surfaceRaised },
                  ]}
                >
                  <Text
                    style={[
                      TYPE.label,
                      { color: mode === m ? palette.onPrimary : palette.textSub },
                    ]}
                    onPress={() => setMode(m)}
                  >
                    {MODE_LABEL[m]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </EntryIn>

        {/* عيّنة الرموز */}
        <EntryIn index={2}>
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
            ]}
          >
            <Text style={[TYPE.label, { color: palette.textSub }]}>الرموز الدلالية</Text>
            <View style={styles.swatches}>
              {swatchKeys.map((k) => (
                <View key={k} style={styles.swatch}>
                  <View
                    style={[
                      styles.swatchColor,
                      { backgroundColor: palette[k], borderColor: palette.surfaceLine },
                    ]}
                  />
                  <Text style={[styles.swatchName, TYPE.micro, { color: palette.textSub }]}>{k}</Text>
                </View>
              ))}
            </View>
          </View>
        </EntryIn>

        {/* السلم المطبوعي */}
        <EntryIn index={3}>
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
            ]}
          >
            <Text style={[TYPE.label, { color: palette.textSub }]}>
              السلم المطبوعي (IBM Plex Sans Arabic)
            </Text>
            <Text style={[TYPE.display, { color: palette.text }]}>الشاردة ستور</Text>
            <Text style={[TYPE.title, { color: palette.text }]}>عنوان متوسط 20/28</Text>
            <Text style={[TYPE.body, { color: palette.text }]}>
              نص عربي بحجم 16/24 وارتفاع سطر 1.5.
            </Text>
            <Text style={[TYPE.label, { color: palette.textSub }]}>
              تسمية 13/20 ثانوية واضحة.
            </Text>
            <Text style={[TYPE.micro, { color: palette.textFaint }]}>
              أصغر مقاس 12/16 — السقف الصارم.
            </Text>
            <Text style={[TYPE.display, TABULAR, LAT.brand, { color: palette.money, marginTop: 8 }]}>
              1,234,567 د.ل
            </Text>
            <Text style={[TYPE.label, TABULAR, { color: palette.textSub }]}>
              فواتير: 0910000001 / 0910000002
            </Text>
          </View>
        </EntryIn>

        {/* حركة الأساس */}
        <EntryIn index={4}>
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
            ]}
          >
            <Text style={[TYPE.label, { color: palette.textSub }]}>حركة الأساس المعتمدة</Text>

            <View style={styles.rowBeacon}>
              <Text style={[TYPE.body, { color: palette.text }]}>نقطة نبض الشارة</Text>
              <SignalBeacon color={palette.primary} size={8} />
            </View>

            {/* مربع الأساس المعتمد */}
            <View
              style={[
                styles.edgeDemo,
                { backgroundColor: palette.surfaceRaised },
              ]}
            >
              <Text style={[TYPE.body, { color: palette.text }]}>
                الأساس: EntryIn + SignalBeacon + underline + طفو
              </Text>
              <Text style={[TYPE.label, { color: palette.textSub, marginTop: 4 }]}>
                الحركات الزخرفية المنقولة حُذفت — التطبيق تصميم أصلي
              </Text>
            </View>

            {/* demo: underline من ينطفئ/يشتغل */}
            <View style={styles.underlineRow}>
              <Text style={[TYPE.body, { color: palette.text }]}>
                underline متحرك — أغلق/افتح:
              </Text>
              <Text
                style={[TYPE.label, { color: palette.primary }]}
                onPress={() => setUnderlineOn((v) => !v)}
              >
                {underlineOn ? 'مفعل ✓' : 'مغلق'}
              </Text>
            </View>
            <AnimatedUnderline active={underlineOn} color={palette.primary} height={3} />

            {/* طفو */}
            <Animated.View style={[styles.floatBox, { backgroundColor: palette.primary }, floatStyle]}>
              <Text style={[TYPE.label, { color: palette.onPrimary }]}>
                طفو 4.3s ±2° — شاشة الترحيب حصراً
              </Text>
            </Animated.View>
          </View>
        </EntryIn>

        {/* شارات دلالية */}
        <EntryIn index={5}>
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
            ]}
          >
            <Text style={[TYPE.label, { color: palette.textSub }]}>الحالات الدلالية</Text>
            <View style={[styles.modeRow, { flexWrap: 'wrap', rowGap: 8 }]}>
              {(
                [
                  ['success', 'مدفوعة / جاهز'],
                  ['warning', 'آجل / جزئي'],
                  ['danger', 'مرتجع'],
                ] as const
              ).map(([k, label]) => (
                <View
                  key={k}
                  style={[
                    styles.statusPill,
                    { backgroundColor: palette.surfaceRaised, borderColor: palette.surfaceLine },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: palette[k] }]} />
                  <Text style={[TYPE.label, { color: palette.text }]}>{label}</Text>
                </View>
              ))}
            </View>
            <Text style={[TYPE.micro, { color: palette.textFaint, marginTop: 8 }]}>
              نصوص البادجات ≥ 4.5:1 على أسطح بادجاتها — يُحسب في المراجعة النهائية.
            </Text>
          </View>
        </EntryIn>

        <Text style={[styles.footerNote, TYPE.micro, { color: palette.textFaint }]}>
          شاشة مؤقتة للتحقق من طبقة التصميم — تُحذف عند اكتمال نظام المكونات (المرحلة 3).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const EDGE = 16;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: EDGE, gap: 12, paddingBottom: 40 },
  heading: { marginTop: 8 },
  sub: { marginTop: 4 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  modeRow: { flexDirection: 'row', columnGap: 8, marginTop: 8 },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  swatch: { width: 72 },
  swatchColor: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
  },
  swatchName: { marginTop: 4 },
  rowBeacon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  edgeDemo: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  underlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  floatBox: {
    marginTop: 16,
    alignSelf: 'center',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  footerNote: { textAlign: 'center', paddingBottom: 8 },
});
