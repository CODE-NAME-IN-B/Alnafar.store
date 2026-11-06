import React from 'react';
import { Pressable, Text, View } from 'react-native';
import ModalSheet from '@/components/ui/ModalSheet';
import AppText from '@/components/ui/AppText';
import Icon from '@/components/ui/Icon';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
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
  const palette = usePalette();
  if (!game) return null;

  return (
    <ModalSheet visible={visible} onClose={onClose} title="اختر نسخة اللعبة">
      <AppText
        style={{
          color: palette.textSub,
          fontFamily: AR_FONT.bold,
          marginBottom: 16,
          fontSize: 15,
          textAlign: 'right',
        }}
      >
        {game.title}
      </AppText>

      {/* خيار نسخة PS4 */}
      <Pressable
        onPress={() => onPick('PS4')}
        accessibilityRole="button"
        accessibilityLabel="اختيار نسخة الفور PS4"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          backgroundColor: pressed ? palette.surfaceRaised : palette.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: palette.surfaceLine,
          marginBottom: 12,
        })}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: palette.text,
              fontFamily: AR_FONT.bold,
              fontSize: 16,
              textAlign: 'right',
            }}
          >
            نسخة الفور (PS4)
          </Text>
          <Text
            style={{
              color: palette.money,
              fontFamily: AR_FONT.bold,
              fontSize: 14,
              textAlign: 'right',
              marginTop: 4,
            }}
          >
            {formatDinar(Number(game.price))}
          </Text>
        </View>
        <Icon
          name="chevron-left"
          size={18}
          color={palette.textFaint}
          strokeWidth={2.2}
        />
      </Pressable>

      {/* خيار نسخة PS5 */}
      <Pressable
        onPress={() => onPick('PS5')}
        accessibilityRole="button"
        accessibilityLabel="اختيار نسخة الفايف PS5"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          backgroundColor: pressed ? palette.surfaceRaised : palette.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: palette.surfaceLine,
        })}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
            <Text
              style={{
                color: palette.text,
                fontFamily: AR_FONT.bold,
                fontSize: 16,
                textAlign: 'right',
              }}
            >
              نسخة الفايف (PS5)
            </Text>
            {game.price_ps5 != null && Number(game.price_ps5) > 0 ? (
              <View
                style={{
                  backgroundColor: palette.surfaceRaised,
                  borderRadius: 6,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: palette.primary,
                }}
              >
                <Text
                  style={{
                    color: palette.primary,
                    fontFamily: AR_FONT.bold,
                    fontSize: 11,
                  }}
                >
                  سعر خاص
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={{
              color: palette.money,
              fontFamily: AR_FONT.bold,
              fontSize: 14,
              textAlign: 'right',
              marginTop: 4,
            }}
          >
            {formatDinar(ps5PriceOf(game))}
          </Text>
        </View>
        <Icon
          name="chevron-left"
          size={18}
          color={palette.textFaint}
          strokeWidth={2.2}
        />
      </Pressable>
    </ModalSheet>
  );
}
