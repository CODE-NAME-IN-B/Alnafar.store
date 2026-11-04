/**
 * بطاقة الحساب الشخصي — أعلى تبويب «المزيد»:
 * أفاتار المرسل، اسم المتجر، رقم الإصدار وشارة β، وقائمة صفوف
 * (تتبع بمسح QR / تحديث التطبيق / المطور / فكرة التطبيق).
 * الحالة التفاعلية: فحص التحديث من GitHub Releases، توسيع نص الفكرة.
 */
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import QrScannerModal from '@/components/track/QrScannerModal';
import UpdateSheet from '@/components/store/UpdateSheet';
import Icon from '@/components/ui/Icon';
import { ScalePressable } from '@/components/ui/motion';
import { FONT } from '@/lib/fonts';
import { colors } from '@/lib/colors';
import { ROW } from '@/lib/rtl';
import {
  CURRENT_VERSION,
  DEV_URL,
  fetchUpdateProbe,
} from '@/lib/releases';
import { router } from 'expo-router';

export default function AccountCard() {
  const [checking, setChecking] = useState(true);
  const [newer, setNewer] = useState(false);
  const [updateTag, setUpdateTag] = useState<string | null>(null);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  /** نافذة التحديث الداخلية: تحميل + تثبيت — بلا مستودع؛ المفتاح يجدد التحميل بكل فتح */
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateEpoch, setUpdateEpoch] = useState(0);

  useEffect(() => {
    let alive = true;
    void fetchUpdateProbe().then((r) => {
      if (!alive) return;
      setChecking(false);
      setNewer(r.newer);
      setUpdateTag(r.release?.tag ?? null);
      setUpdateUrl(r.release?.apkUrl ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);

  const openDev = () => {
    Linking.openURL(DEV_URL).catch(() => undefined);
  };

  return (
    <>
      {/* ── البطاقة الرئيسية ── */}
      <View style={styles.card}>
        <View style={styles.head}>
          <View style={styles.avatar}>
            <Icon name="user" size={26} color={colors.brandLight} />
            <View style={styles.avatarDot} />
          </View>
          <View style={styles.headBody}>
            <Text style={styles.appName}>الشاردة ستور</Text>
            <View style={styles.versionRow}>
              <View style={styles.betaChip}>
                <Text style={styles.betaText}>β</Text>
              </View>
              <Text style={styles.versionText}>الإصدار {CURRENT_VERSION}</Text>
            </View>
          </View>
        </View>

        {/* ── الصفوف داخل البطاقة ── */}
        <View style={styles.rows}>
          <ScalePressable
            onPress={() => setQrOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="تتبع طلب بمسح رمز QR"
            style={styles.row}
          >
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(20, 184, 166, 0.14)' }]}>
              <Icon name="qr" size={16} color={colors.brandLight} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>تتبع طلباتي</Text>
              <Text style={styles.rowHint}>مسح QR على الفاتورة</Text>
            </View>
            <Icon name="chevron-left" size={14} color={colors.faint} />
          </ScalePressable>

          <ScalePressable
            onPress={
              newer && updateUrl
                ? () => {
                    setUpdateEpoch((n) => n + 1);
                    setUpdateOpen(true);
                  }
                : undefined
            }
            accessibilityRole="button"
            accessibilityLabel={newer ? 'تحميل التحديث' : 'فحص التحديث'}
            style={styles.row}
            disabled={!newer || !updateUrl}
          >
            <View
              style={[
                styles.rowIcon,
                newer ? styles.rowIconWarn : { backgroundColor: colors.brandSoft },
              ]}
            >
              <Icon name={newer ? 'refresh' : 'check'} size={16} color={newer ? colors.warningText : colors.brandLight} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>تحديث التطبيق</Text>
              <Text
                style={[styles.rowHint, newer && styles.rowHintWarn]}
                numberOfLines={1}
              >
                {checking
                  ? 'تُفحص وجود تحديث...'
                  : newer
                  ? `متوفر ${updateTag ?? ''} — اضغط للتحميل والتثبيت`
                  : 'محدّث لأحدث نسخة ✓'}
              </Text>
            </View>
            {newer ? <Icon name="chevron-left" size={14} color={colors.faint} /> : null}
          </ScalePressable>

          <ScalePressable
            onPress={openDev}
            accessibilityRole="link"
            accessibilityLabel="صفحة المطور على GitHub"
            style={styles.row}
          >
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(148, 163, 184, 0.12)' }]}>
              <Icon name="user" size={16} color={colors.faint} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>المطور</Text>
              <Text style={styles.rowHint}>
                <Text style={styles.mono}>CODE-NAME-IN-B@github</Text>
              </Text>
            </View>
            <Icon name="chevron-left" size={14} color={colors.faint} />
          </ScalePressable>

          <ScalePressable
            onPress={() => setIdeaOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="فكرة التطبيق"
            style={styles.row}
          >
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(239, 68, 68, 0.10)' }]}>
              <Icon name="sparkles" size={16} color={colors.dangerStrong} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>فكرة التطبيق</Text>
              <Text style={styles.rowHint}>لماذا وُجد الشاردة ستور</Text>
            </View>
            <Icon name={ideaOpen ? 'chevron-down' : 'chevron-left'} size={14} color={colors.faint} />
          </ScalePressable>

          {ideaOpen ? (
            <View style={styles.ideaBox}>
              <Text style={styles.ideaText}>
                صُمم الشاردة ستور ليطابق «أسرع» تجربة مثل متجر الألعاب:
                تختار لعبتك في سلة، تكتب اسمك، وتضغط إرسال — الكاشير يجهّز
                طلبك، وأنت تتابعه بمسح QR أو من طلباتك المحفوظة، وتصلك
                سبق تنبيه عند جاهزيته. لا حاجة للانتظار في الصف.
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* نافذة مسح QR */}
      <QrScannerModal
        visible={qrOpen}
        onClose={() => setQrOpen(false)}
        onResolved={(orderId) => {
          setQrOpen(false);
          router.push(`/track/${encodeURIComponent(orderId)}`);
        }}
      />

      {/* نافذة التحديث الداخلية: تحميل بخط تقدم ثم زر تثبيت */}
      <UpdateSheet
        key={updateEpoch}
        visible={updateOpen}
        onClose={() => setUpdateOpen(false)}
        apkUrl={updateUrl}
        tag={updateTag}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    backgroundColor: colors.elevatedRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
  },
  head: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: colors.brandSoft,
    borderWidth: 2,
    borderColor: colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.elevatedRaised,
  },
  headBody: { flex: 1 },
  appName: {
    fontFamily: FONT.bold,
    color: colors.text,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  versionRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  betaChip: {
    backgroundColor: 'rgba(20, 184, 166, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  betaText: {
    fontFamily: FONT.bold,
    color: '#042f2e',
    fontSize: 11,
    includeFontPadding: false,
  },
  versionText: {
    fontFamily: FONT.regular,
    color: colors.faint,
    fontSize: 12,
    includeFontPadding: false,
  },
  rows: { marginTop: 12, gap: 4 },
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconWarn: {
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontFamily: FONT.bold,
    color: colors.text,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  rowHint: {
    fontFamily: FONT.regular,
    color: colors.faint,
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    includeFontPadding: false,
  },
  rowHintWarn: {
    color: colors.warningText,
    fontFamily: FONT.bold,
  },
  mono: {
    fontFamily: FONT.regular,
    color: colors.faint,
  },
  ideaBox: {
    marginHorizontal: 8,
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderStartWidth: 3,
    borderStartColor: colors.dangerStrong,
  },
  ideaText: {
    fontFamily: FONT.regular,
    color: colors.dim,
    fontSize: 11.5,
    lineHeight: 19,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
