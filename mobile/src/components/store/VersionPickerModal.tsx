import { Pressable, Text, View } from 'react-native';
import ModalSheet from '@/components/ui/ModalSheet';
import AppText from '@/components/ui/AppText';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import type { Game } from '@/api/types';
import { ps5PriceOf } from '@/lib/gamePrices';

interface Props {
  visible: boolean;
  game: Game | null;
  onClose: () => void;
  /** اختيار نسخة — الكمية تزيد تلقائياً مع العنصر نفسه في السلة */
  onPick: (platform: 'PS4' | 'PS5') => void;
}

/** نافذة اختيار النسخة: الفور (PS4) / الفايف (PS5) بتباين واضح وأزرار بارزة */
export default function VersionPickerModal({ visible, game, onClose, onPick }: Props) {
  if (!game) return null;

  return (
    <ModalSheet visible={visible} onClose={onClose} title="اختر نسخة اللعبة">
      <AppText
        style={{ color: '#cbd5e1', fontFamily: FONT.bold, marginBottom: 14, fontSize: 15 }}
      >
        {game.title}
      </AppText>

      <Pressable
        onPress={() => onPick('PS4')}
        style={{
          ...row('#141e30', 'rgba(255, 255, 255, 0.08)'),
          borderRadius: 14,
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#f8fafc', fontFamily: FONT.bold, fontSize: 16, textAlign: 'right' }}>
            نسخة الفور (PS4)
          </Text>
          <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 14, textAlign: 'right', marginTop: 2 }}>
            {formatDinar(Number(game.price))}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: '#14b8a6',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Icon name="plus" size={15} color="#ffffff" strokeWidth={2.4} />
          <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 }}>أضف</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => onPick('PS5')}
        style={{
          ...row('#141e30', 'rgba(255, 255, 255, 0.08)'),
          borderRadius: 14,
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#f8fafc', fontFamily: FONT.bold, fontSize: 16, textAlign: 'right' }}>
              نسخة الفايف (PS5)
            </Text>
            {game.price_ps5 != null && Number(game.price_ps5) > 0 ? (
              <View
                style={{
                  backgroundColor: 'rgba(138,92,255,0.22)',
                  borderRadius: 6,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ color: '#c4b5fd', fontFamily: FONT.bold, fontSize: 10 }}>
                  سعر خاص
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={{ color: '#c4b5fd', fontFamily: FONT.bold, fontSize: 14, textAlign: 'right', marginTop: 2 }}>
            {formatDinar(ps5PriceOf(game))}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: '#8a5cff',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Icon name="plus" size={15} color="#ffffff" strokeWidth={2.4} />
          <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 }}>أضف</Text>
        </View>
      </Pressable>
    </ModalSheet>
  );
}

const row = (bg: string, border: string) =>
  ({
    backgroundColor: bg,
    borderWidth: 1.5,
    borderColor: border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  }) as const;
