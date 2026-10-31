import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const LOGO_MODULE = require('../../assets/_brand/logo.png');
const HEADER_MODULE = require('../../assets/_brand/invoice-header.png');

export interface PrintImageAssets {
  /** شعار دائري صغير (يُستخدم أعلى الفاتورة المطبوعة) */
  logoDataUri?: string;
  /** لافتة ترويسة الفاتورة العريضة */
  headerDataUri?: string;
}

/**
 * تحويل ملف مصدر داخل الحزمة إلى صورة بصيغة Data-URI (Base64).
 * الملاحظة الرسمية في وثائق expo-print: الصور المحلية يجب تضمينها كـ Base64
 * لأن WebView الطباعة لا يدعم روابط `file://` داخلياً.
 */
async function toDataUri(moduleRef: number, fallbackType: 'png' | 'jpg'): Promise<string | undefined> {
  try {
    const asset = Asset.fromModule(moduleRef);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) return undefined;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (!base64) return undefined;
    const mime = fallbackType === 'jpg' ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${base64}`;
  } catch {
    return undefined;
  }
}

let cachePromise: Promise<PrintImageAssets> | null = null;

/** تحميل مرة واحدة مع تخزين مؤقت — يُعيد غرضاً فارغاً عند فشل أي تحميل (لا يعطّل الطباعة) */
export function loadPrintImageAssets(): Promise<PrintImageAssets> {
  if (!cachePromise) {
    cachePromise = (async () => {
      const [logoDataUri, headerDataUri] = await Promise.all([
        toDataUri(LOGO_MODULE, 'png'),
        toDataUri(HEADER_MODULE, 'png'),
      ]);
      return { logoDataUri, headerDataUri };
    })();
  }
  return cachePromise;
}
