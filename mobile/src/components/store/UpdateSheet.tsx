/**
 * نافذة تحديث التطبيق داخلية — لا تفتح المستودع:
 * فحص ← تحميل APK بخطِ تقدّم (بايتات) ← زر «تثبيت» يشغّل مثبّت أندرويد.
 */
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import ModalSheet from '@/components/ui/ModalSheet';
import AppButton from '@/components/ui/AppButton';
import Icon from '@/components/ui/Icon';
import { colors } from '@/lib/colors';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';
import { showToast } from '@/lib/toast';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** رابط APK من آخر Release */
  apkUrl: string | null;
  tag: string | null;
}

/** مكان التخزين: مجلد مؤشرات التطبيق — يُستبدل في كل تحميل */
const APK_PATH = `${FileSystem.cacheDirectory ?? ''}alsharda-update.apk`;
/** ACTION_VIEW على حزم التثبيت — غير مضمّن في ثوابت المكتبة */
const ACTION_VIEW_INSTALL_PACKAGES = 'android.intent.action.VIEW_INSTALL_PACKAGES';
const FLAG_ACTIVITY_NEW_TASK = 0x10000000;

const fmtMb = (n: number): string => `${(n / (1024 * 1024)).toFixed(1)} MB`;

/** جولة تحميل واحدة — تُركَّب من جديد بكل فتح/محاولة (key) فتبدأ الحالة ك↓سابقة طازجة */
function UpdateRun({ apkUrl, onRetry, onClose }: { apkUrl: string; onRetry: () => void; onClose: () => void }) {
  const [phase, setPhase] = useState<'downloading' | 'done' | 'error'>('downloading');
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState('');
  const [error, setError] = useState<string | null>(null);

  /* تحميل واحد لكل ركوبة — الحالات الأولية في البناء، لا تضعية SYNC داخل التأثير */
  useEffect(() => {
    let alive = true;
    /* في SDK 58 لا يتقبّل downloadAsync ردّ تقدّم — المسار الرسمي: DownloadResumable */
    const resumable = FileSystem.createDownloadResumable(
      apkUrl,
      APK_PATH,
      {},
      (data) => {
        if (!alive) return;
        const { totalBytesWritten, totalBytesExpectedToWrite } = data;
        if (totalBytesExpectedToWrite > 0) {
          setProgress(totalBytesWritten / totalBytesExpectedToWrite);
        }
        setBytes(
          `${fmtMb(totalBytesWritten)} من ${
            totalBytesExpectedToWrite > 0 ? fmtMb(totalBytesExpectedToWrite) : '?'
          }`
        );
      }
    );
    resumable
      .downloadAsync()
      .then((res) => {
        if (!alive || res == null) return;
        if (res.status >= 200 && res.status < 300) {
          setProgress(1);
          setPhase('done');
        } else {
          setPhase('error');
          setError(`تعذّر التحميل (رمز ${res.status}) — تحقق من الشبكة ثم أعد المحاولة`);
        }
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setPhase('error');
        setError(err instanceof Error ? err.message : 'فشل التحميل');
      });
    return () => {
      alive = false;
      void resumable.cancelAsync().catch(() => undefined);
    };
  }, [apkUrl]);

  const install = async (): Promise<void> => {
    try {
      const contentUri = await FileSystem.getContentUriAsync(APK_PATH);
      const res = await IntentLauncher.startActivityAsync(ACTION_VIEW_INSTALL_PACKAGES, {
        data: contentUri,
        type: 'application/vnd.android.package-archive',
        flags: FLAG_ACTIVITY_NEW_TASK,
      });
      if (res.resultCode !== -1) {
        onClose();
        return;
      }
      showToast('جاري تثبيت التحديث', 'success');
      onClose();
    } catch {
      showToast('تعذّر فتح المثبّت — اسمح بالتثبيت من إعدادات الجهاز', 'error');
      /* احتياط: افتح صف الإعدادات للسماح بتثبيت التطبيقات غير المتجر */
      Linking.openSettings().catch(() => undefined);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Icon
          name={phase === 'error' ? 'close' : phase === 'done' ? 'check' : 'refresh'}
          size={18}
          color={
            phase === 'error'
              ? colors.dangerStrong
              : phase === 'done'
                ? colors.successBright
                : colors.brandLight
          }
        />
        <Text style={styles.info}>
          {phase === 'downloading' && 'جاري تحميل النسخة الجديدة...'}
          {phase === 'done' && 'تم التحميل — تقدر تثبته الآن'}
          {phase === 'error' && (error ?? 'خطأ')}
        </Text>
      </View>

      {phase === 'downloading' ? (
        <View style={styles.barWrap}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.max(4, progress * 100)}%` }]} />
          </View>
          <Text style={styles.bytes}>{bytes || '...'}</Text>
        </View>
      ) : null}

      {phase === 'error' ? (
        <AppButton label="إعادة المحاولة" icon="refresh" variant="secondary" onPress={onRetry} />
      ) : null}

      {phase === 'done' ? (
        <AppButton label="تثبيت" icon="check" onPress={() => void install()} />
      ) : null}

      <Text style={styles.hint}>
        سيطلب أندرويد السماح بتثبيت «مصادر غير معروفة» أول مرة — اقبل فتكتمل النافذة
      </Text>
    </View>
  );
}

export default function UpdateSheet({ visible, onClose, apkUrl, tag }: Props) {
  /** عدّاد المحاولات — إعادته يعيد ركوب UpdateRun من الصفر (تحميل جديد) */
  const [attempt, setAttempt] = useState(0);

  return (
    <ModalSheet visible={visible} onClose={onClose} title={`تحديث التطبيق ${tag ?? ''}`}>
      {apkUrl ? (
        <UpdateRun
          key={attempt}
          apkUrl={apkUrl}
          onRetry={() => setAttempt((n) => n + 1)}
          onClose={onClose}
        />
      ) : (
        <Text style={styles.hint}>لا يوجد تحميل متاح حالياً — تحقق من الشبكة وأعد الفحص لاحقاً</Text>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceInset,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
  },
  info: {
    flex: 1,
    color: colors.text,
    fontFamily: FONT.bold,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  barWrap: { gap: 6 },
  barBg: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  bytes: {
    color: colors.faint,
    fontFamily: FONT.regular,
    fontSize: 12,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  hint: {
    color: colors.faint,
    fontFamily: FONT.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
