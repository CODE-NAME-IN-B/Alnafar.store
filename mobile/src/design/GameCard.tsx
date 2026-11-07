import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { Layout } from 'react-native-reanimated';
import { Game } from '@/api/types';
import { mainPriceOf } from '@/lib/gamePrices';
import { classifyGameHeuristic, formatGenreLabel } from '@/lib/arabic';
import { useCartStore } from '@/stores/cart';
import { ScalePressable } from '@/components/ui/motion';
import Icon from '@/components/ui/Icon';
import { AR_FONT, LAT_FONT } from './fonts';
import { DUR, EASE } from './motion';
import { usePalette } from './theme';
import PriceButton from './PriceButton';

const SPLIT_PATTERNS = [/split/i, /شاشة\s*مقسومة/, /لاعبين/, /2\s*player/i, /co-?op/i];

export function hasSplitScreen(game: Game): boolean {
  const hay = `${game.genre ?? ''} ${game.description ?? ''} ${game.series ?? ''} ${game.features ?? ''}`;
  return SPLIT_PATTERNS.some((re) => re.test(hay));
}

interface Props {
  game: Game;
  /** تحديد المنصة يدوياً: يتحوّل زر السعر إلى محدد «فور/فايف» داخل البطاقة */
  hasVersions?: boolean;
  onPress?: (game: Game) => void;
  /** وضع صف الكتالوج 72dp (دفتر الكتالوج — فكرة III) */
  compact?: boolean;
}

/**
 * GameCard — بطاقة اللعبة بلغة الهوية (§5):
 * غلاف expo-image مكيّش على الذاكرة والقرص + شارات نصية رفيع فوق scrim
 * + زر السعر lime. معزولة عن الاشتراك الشامل في السلة لسرعة استجابة فورية.
 */
function GameCardComponent({ game, hasVersions, onPress, compact }: Props) {
  const palette = usePalette();
  const platform: 'PS4' | 'PS5' = hasVersions ? 'PS4' : 'PS5';
  const gameId = Number(game.id);
  const key = `g:${gameId}:${platform}`;

  // الاشتراك الدقيق في كمية هذه اللعبة فقط: يمنع إعادة رندر البطاقات الأخرى
  const quantity = useCartStore(
    useCallback(
      (s) => {
        for (let i = 0; i < s.items.length; i++) {
          const it = s.items[i];
          if (it.type === 'game' && it.refId === gameId && it.platform === platform) {
            return it.quantity;
          }
        }
        return 0;
      },
      [gameId, platform]
    )
  );

  const subtitle = useMemo(() => {
    const { genre, series } = classifyGameHeuristic(game);
    const gLabel = formatGenreLabel(game.genre) || genre;
    const sLabel = (game.series || '').trim() || series;
    if (sLabel && gLabel && sLabel !== gLabel) return `${sLabel} • ${gLabel}`;
    return sLabel || gLabel || '';
  }, [game]);

  const split = useMemo(() => hasSplitScreen(game), [game]);
  const main = mainPriceOf(game);

  if (compact) {
    /* صف الكتالوج 72dp: غلاف مصغّر + اسم/تصنيف/حجم + زر السعر lime */
    return (
      <ScalePressable
        onPress={() => onPress?.(game)}
        accessibilityRole="button"
        style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.surfaceLine }]}
      >
        <View style={[styles.rowThumb, { backgroundColor: palette.surfaceRaised }]}>
          {game.image ? (
            <Image
              source={{ uri: game.image }}
              style={styles.rowThumbImg}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={String(game.id)}
            />
          ) : (
            <Icon name="gamepad" size={20} color={palette.textFaint} />
          )}
        </View>
        <View style={styles.rowBody}>
          <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text }]}>
            {game.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.rowSub, { color: palette.textSub }]}
          >
            {[
              subtitle || null,
              game.size_gb ? `${Math.round(Number(game.size_gb))} GB` : null,
              hasVersions ? 'فور • فايف' : null,
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>
        </View>
        <PriceButton
          compact
          price={main}
          quantity={quantity}
          onAdd={() => onPress?.(game)}
          onIncrement={() => useCartStore.getState().addGame({ id: Number(game.id), title: game.title, price: main, sizeGb: game.size_gb != null ? Number(game.size_gb) : null, platform })}
          onDecrement={() => (quantity <= 1 ? useCartStore.getState().removeItem(key) : useCartStore.getState().decrement(key))}
        />
      </ScalePressable>
    );
  }

  return (
    <ScalePressable
      onPress={() => onPress?.(game)}
      accessibilityRole="button"
      accessibilityLabel={`لعبة ${game.title}`}
    >
      <StaticCard paletteBorder={palette.surfaceLine} paletteSurface={palette.surface}>
        <View style={styles.cover}>
          {game.image ? (
            <Image
              source={{ uri: game.image }}
              style={styles.coverImg}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={String(game.id)}
              transition={DUR.quick}
            />
          ) : (
            <View style={[styles.coverFallback, { backgroundColor: palette.surfaceRaised }]}>
              <Icon name="gamepad" size={30} color={palette.textFaint} />
            </View>
          )}

          {/* شارات نصية رفيع فوق scrim — بلا ألوان منصات */}
          <View style={styles.badgeLayer} pointerEvents="none">
            <View
              style={[
                styles.badgesRow,
                { backgroundColor: 'rgba(18, 22, 16, 0.65)' },
              ]}
            >
              {hasVersions ? <Text style={styles.badgeTxt}>فور / فايف</Text> : null}
              {game.size_gb ? (
                <Text style={styles.badgeLat}>{`${Math.round(Number(game.size_gb))}GB`}</Text>
              ) : null}
              {split ? <Text style={styles.badgeTxt}>شاشة مقسومة</Text> : null}
            </View>
          </View>
        </View>

        {/* معلومات + زر السعر */}
        <View style={styles.info}>
          <Text numberOfLines={1} style={[styles.title, { color: palette.text }]}>
            {game.title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={[styles.sub, { color: palette.textSub }]}>
              {subtitle}
            </Text>
          ) : null}
          <View style={styles.priceRow}>
            <PriceButton
              price={main}
              quantity={quantity}
              onAdd={() => onPress?.(game)}
              onIncrement={() => useCartStore.getState().addGame({ id: Number(game.id), title: game.title, price: main, sizeGb: game.size_gb != null ? Number(game.size_gb) : null, platform })}
              onDecrement={() => (quantity <= 1 ? useCartStore.getState().removeItem(key) : useCartStore.getState().decrement(key))}
            />
          </View>
        </View>
      </StaticCard>
    </ScalePressable>
  );
}

/** غلاف البطاقة: رسوم تبادلية 200ms عبر layout transition (حركة 2 بلا قلب) */
function StaticCard({
  children,
  paletteSurface,
  paletteBorder,
}: {
  children: React.ReactNode;
  paletteSurface: string;
  paletteBorder: string;
}) {
  return (
    <Animated.View layout={Layout.duration(DUR.quick).easing(EASE.signature)} style={[styles.card, { backgroundColor: paletteSurface, borderColor: paletteBorder }]}>
      {children}
    </Animated.View>
  );
}

export const GameCard = React.memo(GameCardComponent);
export default GameCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    aspectRatio: 0.78,
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLayer: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  badgesRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeTxt: {
    fontFamily: AR_FONT.medium,
    fontSize: 11,
    color: '#F5F1E8',
    letterSpacing: 0,
    includeFontPadding: false,
  },
  /* الأرقام (حجم GB) بالخط اللاتيني الممايز LTR */
  badgeLat: {
    fontFamily: LAT_FONT.medium,
    fontSize: 11,
    color: '#F5F1E8',
    letterSpacing: 0,
    includeFontPadding: false,
  },
  info: {
    padding: 10,
    gap: 3,
  },
  title: {
    fontFamily: AR_FONT.bold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  sub: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  priceRow: {
    marginTop: 4,
    alignItems: 'flex-start',
  },
  /* صف الكتالوج 72dp */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 72,
  },
  rowThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowThumbImg: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  rowSub: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
});
