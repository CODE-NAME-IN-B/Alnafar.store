import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '@/components/ui/Screen';
import Icon from '@/components/ui/Icon';
import AccountCard from '@/components/store/AccountCard';
import TrackedOrdersList from '@/components/store/TrackedOrdersList';
import { AR_FONT } from '@/design/fonts';
import { usePalette, useThemeMode } from '@/design/theme';
import { triggerLightHaptic } from '@/lib/colors';
import { ROW } from '@/lib/rtl';

/**
 * تبويب «المزيد» — بعد السلة: بطاقة الحساب + تتبع الطلبات + معلومات المتجر بهوية v5.
 */
export default function MoreScreen() {
  const palette = usePalette();
  const mode = useThemeMode((s) => s.mode);
  const setMode = useThemeMode((s) => s.setMode);

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headRow}>
          <Icon name="more" size={16} color={palette.primary} />
          <Text style={[styles.title, { color: palette.text }]}>المزيد</Text>
        </View>

        {/* مظهر التطبيق (السمة) */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.surfaceLine,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Icon name="sparkles" size={16} color={palette.primary} />
            <Text style={[styles.cardTitle, { color: palette.text }]}>مظهر التطبيق</Text>
          </View>
          <View style={styles.themeOptionsRow}>
            {(['light', 'dark', 'system'] as const).map((opt) => {
              const active = mode === opt;
              const labels = {
                light: 'كريمي فاتح',
                dark: 'داكن حبري',
                system: 'تلقائي النظام',
              };
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    triggerLightHaptic();
                    setMode(opt);
                  }}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: active ? palette.primary : palette.surfaceRaised,
                      borderColor: active ? palette.primary : palette.surfaceLine,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={labels[opt]}
                >
                  <Text
                    style={[
                      styles.themeBtnText,
                      {
                        color: active ? palette.onPrimary : palette.textSub,
                        fontFamily: AR_FONT.bold,
                      },
                    ]}
                  >
                    {labels[opt]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* بطاقة الحساب: تتبع + تحديث + المطور + فكرة التطبيق */}
        <AccountCard />

        {/* تتبع طلباتي — الأوامر المسحوبة بـ QR محفوظة على الجهاز */}
        <View style={[styles.headRow, { marginTop: 14 }]}>
          <Icon name="invoice" size={16} color={palette.primary} />
          <Text style={[styles.title, { color: palette.text }]}>تتبع طلباتي</Text>
        </View>
        <TrackedOrdersList />

        {/* معلومات المتجر */}
        <View style={[styles.headRow, { marginTop: 14 }]}>
          <Icon name="store" size={16} color={palette.primary} />
          <Text style={[styles.title, { color: palette.text }]}>عن المتجر</Text>
        </View>
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.surfaceLine,
            },
          ]}
        >
          <Text style={[styles.rowText, { color: palette.textSub }]}>
            الشاردة ستور — متجر ألعاب النفار: أحدث ألعاب PS4/PS5، باقات
            وشحن أرصدة، إرسال الطلبات مباشرة وتتبعها برقم الطلب أو بمسح
            رمز QR على الفاتورة.
          </Text>
          <View style={[styles.divider, { backgroundColor: palette.surfaceLine }]} />
          <Text style={[styles.rowText, { color: palette.textSub }]}>
            للاستفسار عن طلبك مرّر من شريط QR في أعلى الصفحة الرئيسية، أو
            تواصل مع فرعنا الأقرب عبر درج الفروع.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 12,
    gap: 8,
  },
  headRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: AR_FONT.bold,
    fontSize: 15,
    includeFontPadding: false,
  },
  cardHeaderRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 14,
    includeFontPadding: false,
  },
  themeOptionsRow: {
    flexDirection: ROW,
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnText: {
    fontSize: 12,
    includeFontPadding: false,
  },
  card: {
    marginHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  rowText: {
    fontFamily: AR_FONT.regular,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
  },
});
