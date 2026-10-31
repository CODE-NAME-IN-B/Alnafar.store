import { Pressable, Text, View } from 'react-native';
import ModalSheet from '@/components/ui/ModalSheet';
import AppText from '@/components/ui/AppText';
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

/** نافذة اختيار النسخة: الفور (PS4) / الفايف (PS5) بنفس عناوين الواجهة */
export default function VersionPickerModal({ visible, game, onClose, onPick }: Props) {
  if (!game) return null;

  return (
    <ModalSheet visible={visible} onClose={onClose} title="اختر نسخة اللعبة">
      <AppText
        style={{ color: '#94a3b8', fontFamily: FONT.medium, marginBottom: 12, fontSize: 13 }}
      >
        {game.title}
      </AppText>

      <Pressable
        onPress={() => onPick('PS4')}
        style={{ ...row('#0b1220', 'rgba(20,184,166,0.25)'), borderRadius: 12, marginBottom: 12 }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 15 }}>
            الفور (PS4)
          </Text>
          <Text style={{ color: '#2dd4bf', fontFamily: FONT.medium, fontSize: 13 }}>
            {formatDinar(Number(game.price))}
          </Text>
        </View>
        <Text style={{ color: '#14b8a6', fontFamily: FONT.bold }}>أضف</Text>
      </Pressable>

      <Pressable
        onPress={() => onPick('PS5')}
        style={{ ...row('#0b1220', 'rgba(138,92,255,0.25)'), borderRadius: 12 }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 15 }}>
              الفايف (PS5)
            </Text>
            {game.price_ps5 != null && Number(game.price_ps5) > 0 ? (
              <View
                style={{
                  backgroundColor: 'rgba(138,92,255,0.2)',
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ color: '#a78bfa', fontFamily: FONT.medium, fontSize: 11 }}>
                  فايف (معدّل)
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={{ color: '#a78bfa', fontFamily: FONT.medium, fontSize: 13 }}>
            {formatDinar(ps5PriceOf(game))}
          </Text>
        </View>
        <Text style={{ color: '#8a5cff', fontFamily: FONT.bold }}>أضف</Text>
      </Pressable>

      <View style={{ height: 10 }} />
      <Pressable onPress={onClose}>
        <Text
          style={{
            color: '#64748b',
            fontFamily: FONT.regular,
            textAlign: 'center',
            paddingVertical: 8,
          }}
        >
          إلغاء
        </Text>
      </Pressable>
    </ModalSheet>
  );
}

const row = (bg: string, border: string) =>
  ({
    backgroundColor: bg,
    borderWidth: 1,
    borderColor: border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  }) as const;
