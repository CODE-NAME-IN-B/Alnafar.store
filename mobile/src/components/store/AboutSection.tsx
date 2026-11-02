/**
 * قسم «حول التطبيق» — واجهة الزبون:
 * إصدار التطبيق الحالي، توسعه المطور، وزر تحديث يتحقق من
 * أحدث Release في مستودع GitHub ويتيح تحميل الـ APK مباشرة.
 */
import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import Icon from '@/components/ui/Icon';
import AppButton from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/motion';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

const REPO = 'CODE-NAME-IN-B/Alnafar.store';
const DEV_URL = 'https://github.com/CODE-NAME-IN-B';
const CURRENT_VERSION = Constants.expoConfig?.version ?? '0.0.0';

type ReleaseInfo = {
  tag: string;
  htmlUrl: string;
  apkUrl: string | null;
};

/** مقارنة رقمية تقريبية لأرقام إصدارات من الشكل v1.2.3 مع لاحقات بيتا */
function numericCore(version: string): string {
  const m = version.match(/(\d+(?:\.\d+){1,2})/);
  return m ? m[1] : '0.0.0';
}

function isNumericNewer(candidate: string, current: string): boolean {
  const [a = [0], b = [0]] = [candidate.split('.').map(Number), current.split('.').map(Number)];
  for (let i = 0; i < 3; i += 1) {
    const ca = a[i] ?? 0;
    const cb = b[i] ?? 0;
    if (ca > cb) return true;
    if (ca < cb) return false;
  }
  return false;
}

export default function AboutSection() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [checked, setChecked] = useState(false);

  const probe = async (): Promise<{ release: ReleaseInfo | null; newer: boolean }> => {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) return { release: null, newer: false };
      const data = (await res.json()) as {
        tag_name?: string;
        html_url?: string;
        assets?: { name: string; browser_download_url: string }[];
      };
      if (!data.tag_name) return { release: null, newer: false };
      const apkAsset = (data.assets ?? []).find((a) => a.name.endsWith('.apk'));
      const info: ReleaseInfo = {
        tag: data.tag_name,
        htmlUrl: data.html_url ?? `https://github.com/${REPO}/releases`,
        apkUrl: apkAsset?.browser_download_url ?? null,
      };
      return { release: info, newer: isNumericNewer(numericCore(info.tag), numericCore(CURRENT_VERSION)) };
    } catch {
      return { release: null, newer: false };
    }
  };

  /* فحص تلقائي خفيف عند الظهور */
  useEffect(() => {
    let alive = true;
    void probe().then((r) => {
      if (!alive) return;
      setRelease(r.release);
      setChecked(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const openUpdate = () => {
    const url = release?.apkUrl ?? release?.htmlUrl;
    if (url) Linking.openURL(url).catch(() => undefined);
  };

  const isNewer = release ? isNumericNewer(numericCore(release.tag), numericCore(CURRENT_VERSION)) : false;

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Icon name="settings" size={15} color="#2dd4bf" />
        <Text style={styles.title}>حول التطبيق</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>β</Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.appName}>الشاردة ستور</Text>
            <Text style={styles.versionText}>
              الإصدار {CURRENT_VERSION}
              {checked && release && !isNewer ? ' — محدّث لأحدث نسخة ✓' : ''}
            </Text>
          </View>
          <ScalePressable
            onPress={() => Linking.openURL(DEV_URL).catch(() => undefined)}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="صفحة المطور على GitHub"
            style={styles.devBtn}
          >
            <Icon name="user" size={14} color="#2dd4bf" />
            <Text style={styles.devText}>@CODE-NAME-IN-B</Text>
          </ScalePressable>
        </View>

        {checked && release && isNewer ? (
          <View style={styles.updateRow}>
            <View style={styles.flex1}>
              <Text style={styles.updateTitle}>تحديث متوفر — {release.tag}</Text>
              <Text style={styles.updateHint}>
                حمّل النسخة الجديدة وثبّتها (اسمح بالتثبيت من مصادر خارجية إن سأل النظام)
              </Text>
            </View>
            <AppButton
              label="تحديث"
              icon="refresh"
              onPress={openUpdate}
              style={{ minHeight: 40, paddingHorizontal: 14 }}
            />
          </View>
        ) : null}

        {checked && !release ? (
          <Text style={styles.noteText}>
            لا توجد حزمة منشورة بعد — سيُفعّل زر التحديث تلقائياً عند أول إصدار
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
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
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
  },
  badgeWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FONT.bold,
    color: '#2dd4bf',
    fontSize: 18,
    includeFontPadding: false,
  },
  flex1: { flex: 1 },
  appName: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  versionText: {
    fontFamily: FONT.regular,
    color: '#94a3b8',
    fontSize: 11.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginTop: 2,
  },
  devBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  devText: {
    fontFamily: FONT.semibold,
    color: '#2dd4bf',
    fontSize: 10.5,
    includeFontPadding: false,
  },
  updateRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  updateTitle: {
    fontFamily: FONT.bold,
    color: '#34d399',
    fontSize: 12.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  updateHint: {
    fontFamily: FONT.regular,
    color: '#94a3b8',
    fontSize: 10.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginTop: 2,
  },
  noteText: {
    fontFamily: FONT.regular,
    color: '#64748b',
    fontSize: 10.5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
