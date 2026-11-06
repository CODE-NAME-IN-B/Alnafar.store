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
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ROW } from '@/lib/rtl';
import {
  CURRENT_VERSION,
  DEV_URL,
  fetchUpdateProbe,
} from '@/lib/releases';
import { router } from 'expo-router';

export default function AccountCard() {
  const palette = usePalette();
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
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.surfaceLine,
          },
        ]}
      >
        <View style={styles.head}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: palette.surfaceRaised,
                borderColor: palette.primary,
              },
            ]}
          >
            <Icon name="user" size={26} color={palette.primary} />
            <View
              style={[
                styles.avatarDot,
                {
                  backgroundColor: palette.success,
                  borderColor: palette.surface,
                },
              ]}
            />
          </View>
          <View style={styles.headBody}>
            <Text style={[styles.appName, { color: palette.text }]}>الشاردة ستور</Text>
            <View style={styles.versionRow}>
              <View
                style={[
                  styles.betaChip,
                  {
                    backgroundColor: palette.surfaceRaised,
                    borderColor: palette.primary,
                  },
                ]}
              >
                <Text style={[styles.betaText, { color: palette.primary }]}>β</Text>
              </View>
              <Text style={[styles.versionText, { color: palette.textSub }]}>
                الإصدار {CURRENT_VERSION}
              </Text>
            </View>
          </View>
        </View>

        {/* ── الصفوف داخل البطاقة ── */}
        <View style={styles.rows}>
          <ScalePressable
            onPress={() => setQrOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="تتبع طلب بمسح رمز QR"
            style={[styles.row, { borderBottomColor: palette.surfaceLine }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: palette.surfaceRaised }]}>
              <Icon name="qr" size={16} color={palette.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>تتبع طلباتي</Text>
              <Text style={[styles.rowHint, { color: palette.textFaint }]}>مسح QR على الفاتورة</Text>
            </View>
            <Icon name="chevron-left" size={14} color={palette.textFaint} />
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
            style={[styles.row, { borderBottomColor: palette.surfaceLine }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: palette.surfaceRaised }]}>
              <Icon name="refresh" size={16} color={palette.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>
                {checking
                  ? 'جاري فحص التحديثات...'
                  : newer
                  ? `تحديث جديد متاح (${updateTag ?? ''})`
                  : 'التطبيق محدث لأحدث إصدار'}
              </Text>
              <Text style={[styles.rowHint, { color: palette.textFaint }]}>
                {newer ? 'اضغط للتحميل والتثبيت الفوري' : 'v' + CURRENT_VERSION}
              </Text>
            </View>
            {newer ? (
              <View style={[styles.newBadge, { backgroundColor: palette.primary }]}>
                <Text style={[styles.newBadgeText, { color: palette.onPrimary }]}>جديد</Text>
              </View>
            ) : null}
          </ScalePressable>

          <ScalePressable
            onPress={openDev}
            accessibilityRole="button"
            accessibilityLabel="عن المطور"
            style={[styles.row, { borderBottomColor: palette.surfaceLine }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: palette.surfaceRaised }]}>
              <Icon name="user" size={16} color={palette.textSub} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>المطور والمشروع</Text>
              <Text style={[styles.rowHint, { color: palette.textFaint }]}>مكتبة ألعاب الشاردة ستور</Text>
            </View>
            <Icon name="chevron-left" size={14} color={palette.textFaint} />
          </ScalePressable>

          <ScalePressable
            onPress={() => setIdeaOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityLabel="فكرة التطبيق"
            style={styles.row}
          >
            <View style={[styles.rowIcon, { backgroundColor: palette.surfaceRaised }]}>
              <Icon name="sparkles" size={16} color={palette.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: palette.text }]}>فكرة التطبيق</Text>
              <Text style={[styles.rowHint, { color: palette.textFaint }]}>لماذا وُجد الشاردة ستور</Text>
            </View>
            <Icon name={ideaOpen ? 'chevron-down' : 'chevron-left'} size={14} color={palette.textFaint} />
          </ScalePressable>

          {ideaOpen ? (
            <View
              style={[
                styles.ideaBox,
                {
                  backgroundColor: palette.surfaceRaised,
                  borderColor: palette.surfaceLine,
                },
              ]}
            >
              <Text style={[styles.ideaText, { color: palette.textSub }]}>
                صُمم الشاردة ستور ليطابق «أسرع» تجربة مثل متجر الألعاب:
                تختار لعبتك في سلة، وتطلب مباشرة — الكاشير يجهّز
                طلبك، وأنت تتابعه بمسح QR أو من طلباتك المحفوظة، وتصلك
                تنبيهات عند جاهزيته بدون انتظار في الطابور.
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  head: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 999,
    borderWidth: 2,
  },
  headBody: { flex: 1 },
  appName: {
    fontFamily: AR_FONT.bold,
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
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  betaText: {
    fontFamily: AR_FONT.bold,
    fontSize: 11,
    includeFontPadding: false,
  },
  versionText: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    includeFontPadding: false,
  },
  rows: {
    marginTop: 14,
    gap: 4,
  },
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 13.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  rowHint: {
    fontFamily: AR_FONT.regular,
    fontSize: 11.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    includeFontPadding: false,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  newBadgeText: {
    fontFamily: AR_FONT.bold,
    fontSize: 11,
    includeFontPadding: false,
  },
  ideaBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  ideaText: {
    fontFamily: AR_FONT.regular,
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
