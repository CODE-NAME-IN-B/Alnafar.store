/**
 * نافذة تحديث التطبيق داخلية — معالجة التثبيت والتحميل التلقائي:
 * فحص ← تحميل APK بخطِ تقدّم ← زر «تثبيت» يشغّل نية أندرويد القياسية.
 */
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Linking, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import ModalSheet from '@/components/ui/ModalSheet';
import AppButton from '@/components/ui/AppButton';
import Icon from '@/components/ui/Icon';
import { usePalette } from '@/design/theme';
import { AR_FONT } from '@/design/fonts';
import { ROW } from '@/lib/rtl';
import { showToast } from '@/lib/toast';

interface Props {
  visible: boolean;
  onClose: () => void;
  apkUrl: string | null;
  tag: string | null;
}

const APK_PATH = `${FileSystem.cacheDirectory ?? ''}alsharda-update.apk`;

/* نوايا أندرويد القياسية لتثبيت الحزم وإذن المصادر غير المعروفة */
const ACTION_VIEW = 'android.intent.action.VIEW';
const FLAG_ACTIVITY_NEW_TASK = 0x10000000;
const FLAG_GRANT_READ_URI_PERMISSION = 0x00000001;
const ACTION_MANAGE_UNKNOWN_APP_SOURCES = 'android.settings.MANAGE_UNKNOWN_APP_SOURCES';
const APP_PACKAGE = 'com.inb.alsharda';

const fmtMb = (n: number): string => `${(n / (1024 * 1024)).toFixed(1)} MB`;

function UpdateRun({
  apkUrl,
  onRetry,
  onClose,
}: {
  apkUrl: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  const palette = usePalette();
  const [phase, setPhase] = useState<'downloading' | 'done' | 'error'>('downloading');
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const waitingForPermission = useRef(false);

  useEffect(() => {
    let alive = true;
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

  const openPermissionSettings = async () => {
    waitingForPermission.current = true;
    try {
      await IntentLauncher.startActivityAsync(ACTION_MANAGE_UNKNOWN_APP_SOURCES, {
        data: `package:${APP_PACKAGE}`,
      });
    } catch {
      Linking.openSettings().catch(() => undefined);
    }
  };

  const install = async (): Promise<void> => {
    try {
      const contentUri = await FileSystem.getContentUriAsync(APK_PATH);
      await IntentLauncher.startActivityAsync(ACTION_VIEW, {
        data: contentUri,
        type: 'application/vnd.android.package-archive',
        flags: FLAG_ACTIVITY_NEW_TASK | FLAG_GRANT_READ_URI_PERMISSION,
      });
      showToast('جاري فتح مثبّت التحديث', 'success');
      onClose();
    } catch (e: unknown) {
      setNeedsPermission(true);
      showToast('يرجى السماح بالتثبيت من إعدادات النظام', 'error');
    }
  };

  /* مراقبة عودة التطبيق من الإعدادات لإعادة محاولة التثبيت تلقائياً */
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && waitingForPermission.current && phase === 'done') {
        waitingForPermission.current = false;
        void install();
      }
    });
    return () => sub.remove();
  }, [phase]);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.row,
          { backgroundColor: palette.surfaceRaised, borderColor: palette.surfaceLine },
        ]}
      >
        <Icon
          name={phase === 'error' ? 'close' : phase === 'done' ? 'check' : 'refresh'}
          size={18}
          color={
            phase === 'error'
              ? palette.danger
              : phase === 'done'
                ? palette.success
                : palette.accent
          }
        />
        <Text style={[styles.info, { color: palette.text }]}>
          {phase === 'downloading' && 'جاري تحميل النسخة الجديدة...'}
          {phase === 'done' && 'تم التحميل بنجاح — جاهز للتثبيت'}
          {phase === 'error' && (error ?? 'خطأ في التحميل')}
        </Text>
      </View>

      {phase === 'downloading' ? (
        <View style={styles.barWrap}>
          <View
            style={[
              styles.barBg,
              { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
            ]}
          >
            <View
              style={[
                styles.barFill,
                { width: `${Math.max(4, progress * 100)}%`, backgroundColor: palette.primary },
              ]}
            />
          </View>
          <Text style={[styles.bytes, { color: palette.textSub }]}>{bytes || '...'}</Text>
        </View>
      ) : null}

      {phase === 'error' ? (
        <AppButton label="إعادة المحاولة" icon="refresh" variant="secondary" onPress={onRetry} />
      ) : null}

      {phase === 'done' ? (
        needsPermission ? (
          <View style={styles.permWrap}>
            <Text style={[styles.permText, { color: palette.text }]}>
              يتطلب أندرويد تفعيل خيار «تثبيت التطبيقات غير المعروفة» لتطبيق الشاردة ستور.
            </Text>
            <AppButton
              label="تفعيل الإذن من الإعدادات"
              icon="settings"
              onPress={() => void openPermissionSettings()}
            />
          </View>
        ) : (
          <AppButton label="تثبيت الآن" icon="check" onPress={() => void install()} />
        )
      ) : null}

      <Text style={[styles.hint, { color: palette.textFaint }]}>
        يتم تنزيل الحزمة مباشرة وتثبيتها فوق الإصدار الحالي مع الحفاظ على كافة البيانات المحفوظة.
      </Text>
    </View>
  );
}

export default function UpdateSheet({ visible, onClose, apkUrl, tag }: Props) {
  const palette = usePalette();
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
        <Text style={[styles.hint, { color: palette.textFaint }]}>
          لا يوجد تحميل متاح حالياً — تحقق من الشبكة وأعد الفحص لاحقاً
        </Text>
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  info: {
    flex: 1,
    fontFamily: AR_FONT.bold,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  barWrap: { gap: 6 },
  barBg: {
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  bytes: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  permWrap: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eab30840',
    backgroundColor: '#eab30810',
  },
  permText: {
    fontFamily: AR_FONT.medium,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  hint: {
    fontFamily: AR_FONT.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
