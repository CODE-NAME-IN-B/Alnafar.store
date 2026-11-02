import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '@/components/ui/Screen';
import Icon from '@/components/ui/Icon';
import AboutSection from '@/components/store/AboutSection';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

/**
 * تبويب «المزيد» — بعد السلة: حول التطبيق + زر التحديث + معلومات المتجر.
 */
export default function MoreScreen() {
  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headRow}>
          <Icon name="more" size={15} color="#2dd4bf" />
          <Text style={styles.title}>المزيد</Text>
        </View>

        {/* حول التطبيق: الإصدار + زر التحديث + المطور */}
        <AboutSection />

        {/* معلومات المتجر */}
        <View style={styles.headRow}>
          <Icon name="store" size={15} color="#2dd4bf" />
          <Text style={styles.title}>عن المتجر</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.rowText}>
            الشاردة ستور — متجر ألعاب النفار: أحدث ألعاب PS4/PS5، باقات
            وشحن أرصدة، إرسال الطلبات مباشرة وتتبعها برقم الطلب أو بمسح
            رمز QR على الفاتورة.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.rowText}>
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
    paddingVertical: 10,
    gap: 6,
  },
  headRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  title: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 13.5,
    includeFontPadding: false,
  },
  card: {
    marginHorizontal: 14,
    backgroundColor: '#0d1629',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 10,
  },
  rowText: {
    fontFamily: FONT.regular,
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
