import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import ModalSheet from '@/components/ui/ModalSheet';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
import Icon from '@/components/ui/Icon';
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
      title="تتبع الطلب"
    >
      <View style={{ gap: 12 }}>
        <AppInput
          label="رقم الفاتورة أو الطلب"
          placeholder="مثال: 15 أو 20261031-001"
          value={manualId}
          icon="invoice"
          onChangeText={(v) => {
            setManualId(v);
            if (scanError) setScanError(null);
          }}
          returnKeyType="done"
          onSubmitEditing={handleManualSubmit}
        />

        {scanError ? (
          <AppText style={{ color: '#f87171', fontFamily: FONT.medium, fontSize: 13 }}>
            {scanError}
          </AppText>
        ) : null}

        <AppButton label="تتبع بالرقم" icon="search" onPress={handleManualSubmit} />

        <View
          style={{
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            marginVertical: 4,
          }}
        />

        {!cameraOpen ? (
          <AppButton
            label="مسح رمز QR من الفاتورة الورقية"
            variant="secondary"
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
              style={{
                paddingVertical: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon name="close" size={16} color="#cbd5e1" />
              <Text style={{ color: '#cbd5e1', fontFamily: FONT.bold }}>إغلاق الكاميرا</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ModalSheet>
  );
}
