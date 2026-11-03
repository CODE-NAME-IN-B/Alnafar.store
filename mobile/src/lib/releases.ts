/**
 * فحص أحدث Release في GitHub لإصدار التطبيق — مشترك بين
 * بطاقة الحساب في «المزيد» وأي مكان يحتاج فحص تحديث.
 */
import Constants from 'expo-constants';

export const REPO = 'CODE-NAME-IN-B/Alnafar.store';
export const DEV_URL = 'https://github.com/CODE-NAME-IN-B';

export const CURRENT_VERSION = Constants.expoConfig?.version ?? '0.0.0';

export interface ReleaseInfo {
  tag: string;
  htmlUrl: string;
  apkUrl: string | null;
}

/** مقارنة رقمية تقريبية لأرقام إصدارات من الشكل v1.2.3 مع لاحقات بيتا */
export function numericCore(version: string): string {
  const m = version.match(/(\d+(?:\.\d+){1,2})/);
  return m ? m[1] : '0.0.0';
}

export function isNumericNewer(candidate: string, current: string): boolean {
  const a = candidate.split('.');
  const b = current.split('.');
  for (let i = 0; i < 3; i += 1) {
    const ca = Number(a[i] ?? 0);
    const cb = Number(b[i] ?? 0);
    if (ca > cb) return true;
    if (ca < cb) return false;
  }
  return false;
}

type ProbeResult = { release: ReleaseInfo | null; newer: boolean };

async function probeRelease(): Promise<ProbeResult> {
  try {
    /** مهلة 8 ثوان: منع علوق صف «تحديث التطبيق» على شبكة متقطعة */
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(8_000),
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
}

/**
 * فحص تلقائي خفيف (يُستدعى من useEffect)
 * بدون استدعاءات دخلية impure أثناء العرض.
 */
export async function fetchUpdateProbe(): Promise<ProbeResult> {
  return probeRelease();
}
