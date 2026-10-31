import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import ModalSheet from '@/components/ui/ModalSheet';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
import { FONT } from '@/lib/fonts';

interface Props {
  visible: boolean;
  onClose: () => void;
  onResolved: (orderId: string) => void;
}

/** استخراج رقم الفاتورة/الطلب من رابط QR أو نص مباشر */
export function extractTrackingId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // روابط مثل https://.../#/track/20261031-001 أو /t/12 أو alsharida://track/12
  const trackMatch = trimmed.match(/(?:\/track\/|\/t\/)([^/?#\s]+)/i);
  if (trackMatch?.[1]) {
    try {
      return decodeURIComponent(trackMatch[1]);
    } catch {
      return trackMatch[1];
    }
  }

  // رقم فاتورة مباشر مثل 20261031-001 أو 15
  if (/^[A-Za-z0-9_-]{1,32}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/** نافذة تتبع الطلب عبر مسح رمز QR من الفاتورة أو إدخال الرقم يدوياً */
export default function QrScannerModal({ visible, onClose, onResolved }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualId, setManualId] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleManualSubmit = () => {
    const id = extractTrackingId(manualId);
    if (!id) {
      setScanError('أدخل رقم فاتورة أو طلب صحيحاً');
      return;
    }
    setScanError(null);
    setManualId('');
    setCameraOpen(false);
    onResolved(id);
  };

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
      title="تتبع الطلب / مسح QR"
    >
      <View style={{ gap: 12 }}>
        <AppInput
          label="رقم الفاتورة أو الطلب"
          placeholder="مثال: 15 أو 20261031-001"
          value={manualId}
          onChangeText={(v) => {
            setManualId(v);
            if (scanError) setScanError(null);
          }}
        />

        {scanError ? (
          <AppText style={{ color: '#ef4444', fontFamily: FONT.regular, fontSize: 13 }}>
            {scanError}
          </AppText>
        ) : null}

        <AppButton label="تتبع بالرقم" onPress={handleManualSubmit} />

        <View
          style={{
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.08)',
            marginVertical: 4,
          }}
        />

        {!cameraOpen ? (
          <Pressable
            onPress={() => {
              void handleOpenCamera();
            }}
            style={{
              backgroundColor: '#1b2740',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(20,184,166,0.35)',
              paddingVertical: 14,
              alignItems: 'center',
            }}
            accessible
            accessibilityLabel="مسح رمز QR بالكاميرا"
          >
            <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 15 }}>
              📷 مسح رمز QR من الفاتورة الورقية
            </Text>
          </Pressable>
        ) : (
          <View style={{ gap: 10 }}>
            <View
              style={{
                height: 230,
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#14b8a6',
                backgroundColor: '#0b1220',
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
            </View>
            <Pressable
              onPress={() => setCameraOpen(false)}
              style={{ paddingVertical: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#94a3b8', fontFamily: FONT.medium }}>إغلاق الكاميرا</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ModalSheet>
  );
}
