import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import ModalSheet from '@/components/ui/ModalSheet';
import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { colors } from '@/lib/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onResolved: (orderId: string) => void;
}

/** استخراج رقم الفاتورة/الطلب من رابط QR أو نص مباشر */
export function extractTrackingId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const trackMatch = trimmed.match(/(?:\/track\/|\/t\/)([^/?#\s]+)/i);
  if (trackMatch?.[1]) {
    try {
      return decodeURIComponent(trackMatch[1]);
    } catch {
      return trackMatch[1];
    }
  }

  if (/^[A-Za-z0-9_-]{1,32}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * نافذة تتبع الطلب — عبر مسح رمز QR على الفاتورة حصراً.
 * لا إدخال يدوي بالرقم: بهذا يستطيع الزبون تتبع طلبِه فقط (خصوصية) —
 * وبعد أول مسح يُحفظ الطلب في «تتبع طلباتي» على الجهاز فيبقى متاحاً
 * دون إعادة المسح، مع إشعار محلي عند جاهزيته.
 */
export default function QrScannerModal({ visible, onClose, onResolved }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleOpenCamera = async () => {
    setScanError(null);
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        setScanError('يرجى السماح بصلاحية الكاميرا لمسح رمز QR');
        return;
      }
    }
    setCameraOpen(true);
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={() => {
        setCameraOpen(false);
        setScanError(null);
        onClose();
      }}
      title="تتبع الطلب"
    >
      <View style={{ gap: 12 }}>
        <AppText style={{ color: colors.dim, fontFamily: FONT.medium, fontSize: 12.5 }}>
          وجّه الكاميرا نحو رمز QR المطبوع على فاتورتك لحسابك — التتبع متاح
          لطلباتك أنت فقط.
        </AppText>

        {scanError ? (
          <AppText style={{ color: colors.dangerStrong, fontFamily: FONT.medium, fontSize: 13 }}>
            {scanError}
          </AppText>
        ) : null}

        {!cameraOpen ? (
          <AppButton
            label="مسح رمز QR من الفاتورة"
            icon="camera"
            onPress={() => {
              void handleOpenCamera();
            }}
          />
        ) : (
          <View style={{ gap: 10 }}>
            <View
              style={{
                height: 230,
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: colors.brand,
                backgroundColor: colors.surfaceInset,
              }}
            >
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={(result) => {
                  const id = extractTrackingId(result.data);
                  if (id) {
                    setCameraOpen(false);
                    onResolved(id);
                  } else {
                    setScanError('الرمز الممسوح لا يحتوي على رقم طلب صالح');
                  }
                }}
              />
              {/* إطار رؤية: تعتيم المحيط + زوايا تُخبر المستخدم أين يضع الرمز */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 170,
                    height: 170,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: colors.brandLight,
                    backgroundColor: 'rgba(2, 6, 23, 0.45)',
                  }}
                />
              </View>
            </View>
            <AppText
              style={{
                color: colors.faint,
                fontFamily: FONT.medium,
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              ضع الرمز داخل الإطار — سيُفتح التتبع تلقائياً
            </AppText>
            <Pressable
              onPress={() => setCameraOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="إغلاق الكاميرا"
              style={{
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon name="close" size={16} color={colors.dim} />
              <Text style={{ color: colors.dim, fontFamily: FONT.bold }}>إغلاق الكاميرا</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ModalSheet>
  );
}
