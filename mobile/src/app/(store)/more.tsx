import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '@/components/ui/Screen';
import Icon from '@/components/ui/Icon';
import AccountCard from '@/components/store/AccountCard';
import TrackedOrdersList from '@/components/store/TrackedOrdersList';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ROW } from '@/lib/rtl';

/**
 * تبويب «المزيد» — بعد السلة: بطاقة الحساب + تتبع الطلبات + معلومات المتجر بهوية v5.
 */
export default function MoreScreen() {
  const palette = usePalette();

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
