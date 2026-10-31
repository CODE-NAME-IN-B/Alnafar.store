declare module 'qrcode' {
  /** مصفوفة وحدات QR النهائية (تتضمن أنماط التثبيت ومناطق الإصدار) */
  export interface QRBitMatrix {
    /** عدد الوحدات في جانب المصفوفة */
    size: number;
    /** بايت واحد لكل وحدة: 1 = مظلمة، 0 = فاتحة */
    data: Uint8Array;
  }

  export interface QRCodeResult {
    modules: QRBitMatrix;
    version: number;
    errorCorrectionLevel: {
      bit: number;
      formatBits: { left: number; right: number };
      name: string;
      ordinal: number;
    };
    maskPattern: number;
    segments: unknown[];
  }

  export interface QRCreateOptions {
    version?: number;
    /** يُقبل اسم أو رقم مستوى تصحيح الخطأ ('M' الافتراضي المُستخدم للطباعة الحرارية) */
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H' | number;
  }

  export interface QRCodeApi {
    create(text: string, options?: QRCreateOptions): QRCodeResult;
  }

  const QRCode: QRCodeApi;
  export default QRCode;
}
