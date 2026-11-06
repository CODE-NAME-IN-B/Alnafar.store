import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Game } from '@/api/types';
import { mainPriceOf } from '@/lib/gamePrices';
import { classifyGameHeuristic, formatGenreLabel } from '@/lib/arabic';
import { useCartStore } from '@/stores/cart';
import Icon from '@/components/ui/Icon';
import { AR_FONT, LAT_FONT } from './fonts';
import { usePalette } from './theme';
import PriceButton from './PriceButton';
import { ROW } from '@/lib/rtl';

/**
 * HeroCard — بطاقة البطل (قرار المالك §4.3): فتحة واحدة أعلى الرئيسية
 * تُظهر الأكثر طلباً بنبرة الإيصال: رقم المرتبة الكبير tabular + سعر
 * زر lime يتحول لعداد +/−. لا تكسر إيقاع الرفوف بعدها.
 */

interface Props {
  game: Game;
  /** عدد الطلبات الفعلي من إحصائيات «الأكثر طلباً» */
  orders: number;
  /** 1..10 */
  rank: number;
  /** منصة الزر (فايف الافتراضية — فور عند لعبة النسختين) */
  platform?: 'PS4' | 'PS5';
  onPress?: (game: Game) => void;
}

export function HeroCard({ game, orders, rank, platform: platformIn = 'PS5', onPress }: Props) {
  const palette = usePalette();
  const main = mainPriceOf(game);
  const platform = platformIn;
  const key = `g:${Number(game.id)}:${platform}`;
  const quantity = useCartStore(
    (s) =>
      s.items.find(
        (it) => it.type === 'game' && it.refId === Number(game.id) && it.platform === platform,
      )?.quantity ?? 0,
  );

  const subtitle = useMemo(() => {
    const { genre, series } = classifyGameHeuristic(game);
    const gLabel = formatGenreLabel(game.genre) || genre;
    if (game.series || series) return (game.series || '').trim() || series;
    return gLabel || '';
  }, [game]);

  return (
    <View
      style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.surfaceLine }]}
    >
      <Pressable
        onPress={() => onPress?.(game)}
        accessibilityRole="button"
        accessibilityLabel={`أكثر طلباً: ${game.title}`}
        style={styles.coverBtn}
      >
        <View style={[styles.cover, { backgroundColor: palette.surfaceRaised }]}>
          {game.image ? (
            <Image source={{ uri: game.image }} style={styles.coverImg} contentFit="cover" />
          ) : (
            <Icon name="gamepad" size={30} color={palette.textFaint} />
          )}
        </View>
      </Pressable>

      <View style={styles.body}>
        <View style={styles.rankRow}>
          {/* رقم المرتبة: الخط اللاتيني الممايز LTR بلون accent */}
          <Text style={[styles.rankNum, { color: palette.accent }]}>
            {String(rank).padStart(2, '0')}
          </Text>
          <View style={[styles.rankLine, { backgroundColor: palette.surfaceLine }]} />
          <Text style={[styles.rankLabel, { color: palette.textSub }]}>الأكثر طلباً</Text>
        </View>

        <Pressable onPress={() => onPress?.(game)} hitSlop={4}>
          <Text numberOfLines={2} style={[styles.title, { color: palette.text }]}>
            {game.title}
          </Text>
        </Pressable>

        <View style={[styles.metaRow, { gap: 10 }]}>
          {subtitle ? (
            <Text numberOfLines={1} style={[styles.meta, { color: palette.textFaint }]}>
              {subtitle}
            </Text>
          ) : null}
          <Text style={[styles.meta, { color: palette.textFaint }]}>
            {`${orders} طلب`}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <PriceButton
            price={main}
            quantity={quantity}
            onAdd={() => onPress?.(game)}
            onIncrement={() =>
              useCartStore.getState().addGame({
                id: Number(game.id),
                title: game.title,
                price: main,
                sizeGb: game.size_gb != null ? Number(game.size_gb) : null,
                platform,
              })
            }
            onDecrement={() =>
              quantity <= 1
                ? useCartStore.getState().removeItem(key)
                : useCartStore.getState().decrement(key)
            }
          />
        </View>
      </View>
    </View>
  );
}

export default HeroCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: ROW,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    alignItems: 'stretch',
  },
  coverBtn: {
    flexShrink: 0,
  },
  cover: {
    width: 112,
    height: 122,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
    gap: 6,
    paddingTop: 2,
  },
  rankRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  rankNum: {
    fontFamily: LAT_FONT.bold,
    fontSize: 26,
    lineHeight: 30,
  },
  rankLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth + 0.5,
  },
  rankLabel: {
    fontFamily: AR_FONT.semibold,
    fontSize: 12,
    letterSpacing: 0,
    includeFontPadding: false,
  },
  title: {
    fontFamily: AR_FONT.bold,
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  metaRow: {
    flexDirection: ROW,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  meta: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
    includeFontPadding: false,
  },
  priceRow: {
    marginTop: 2,
    alignItems: 'flex-start',
  },
});
