import React, { useEffect, useMemo } from 'react';
import { Animated, Image, StyleSheet, Text, View, useAnimatedValue } from 'react-native';
import { Category, Game } from '@/api/types';
import { formatDinar } from '@/lib/money';
import { isPs4Game, mainPriceOf, ps5PriceOf } from '@/lib/gamePrices';
import { classifyGameHeuristic, formatGenreLabel } from '@/lib/arabic';
import { useCartStore } from '@/stores/cart';
import Icon from './ui/Icon';
import { ScalePressable } from './ui/motion';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';
import { colors } from '@/lib/colors';

interface Props {
  game: Game;
  categories?: Category[];
  onPress: (game: Game) => void;
  /** وضع القائمة المضغوطة للكاشير (7–8 ألعاب في الشاشة) */
  compact?: boolean;
}

const SPLIT_PATTERNS = [/split/i, /شاشة\s*مقسومة/, /لاعبين/, /2\s*player/i, /co-?op/i];

export function hasSplitScreen(game: Game): boolean {
  const hay = `${game.genre ?? ''} ${game.description ?? ''} ${game.series ?? ''} ${game.features ?? ''}`;
  return SPLIT_PATTERNS.some((re) => re.test(hay));
}

export default function GameCard({ game, categories = [], onPress, compact = false }: Props) {
  const cartItems = useCartStore((s) => s.items);

  const inCart = useMemo(
    () => cartItems.some((it) => it.type === 'game' && it.refId === Number(game.id)),
    [cartItems, game.id]
  );

  const isPs4 = isPs4Game(game, categories);
  const split = hasSplitScreen(game);

  const catLabels = useMemo(() => {
    if (!categories.length) return [];
    const ids = new Set<number>();
    if (game.category_id) ids.add(Number(game.category_id));
    if (Array.isArray(game.category_ids)) {
      for (const id of game.category_ids) ids.add(Number(id));
    }
    return categories.filter((c) => ids.has(Number(c.id))).map((c) => c.name);
  }, [categories, game.category_id, game.category_ids]);

  const subtitle = useMemo(() => {
    const { genre, series } = classifyGameHeuristic(game);
    const gLabel = formatGenreLabel(game.genre) || genre;
    const sLabel = (game.series || '').trim() || series;
    if (sLabel && gLabel && sLabel !== gLabel) return `${sLabel} • ${gLabel}`;
    return sLabel || gLabel || '';
  }, [game]);

  /* نبضة نجاح: عندما تدخل اللعبة للسلة تنبض أيقونة الإضافة لتأكيد الحدث */
  const pop = useAnimatedValue(1);
  useEffect(() => {
    if (inCart) {
      Animated.sequence([
        Animated.timing(pop, { toValue: 1.28, duration: 110, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
    } else {
      pop.setValue(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inCart]);

  const compactPriceLine = useMemo(() => {
    if (!isPs4) return formatDinar(mainPriceOf(game));
    return `فور ${formatDinar(mainPriceOf(game))} • فايف ${formatDinar(ps5PriceOf(game))}`;
  }, [game, isPs4]);

  if (compact) {
    return (
      <ScalePressable
        onPress={() => onPress(game)}
        accessibilityRole="button"
        android_ripple={{ color: 'rgba(255,255,255,0.10)', borderless: false, foreground: true }}
        style={[styles.cardRow, inCart && styles.cardInCart]}
      >
        <View style={styles.rowThumbWrap}>
          {game.image ? (
            <Image
              source={{ uri: game.image }}
              style={styles.rowThumbImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.rowThumbFallback}>
              <Icon name="gamepad" size={22} color={colors.faint} />
            </View>
          )}
        </View>

        <View style={styles.rowInfo}>
          <Text numberOfLines={1} style={styles.title}>
            {game.title}
          </Text>
          <Text numberOfLines={1} style={styles.rowPriceLine}>
            {compactPriceLine}
          </Text>
        </View>

        <Animated.View
          style={[styles.rowAddBtn, inCart && styles.rowAddBtnInCart, { transform: [{ scale: pop }] }]}
        >
          <Icon
            name={inCart ? 'check' : 'plus'}
            size={18}
            color={inCart ? colors.brandDark : colors.brandLight}
          />
        </Animated.View>
      </ScalePressable>
    );
  }

  return (
    <ScalePressable
      onPress={() => onPress(game)}
      android_ripple={{ color: 'rgba(255,255,255,0.10)', borderless: false, foreground: true }}
      style={[styles.card, inCart && styles.cardInCart]}
    >
      <View style={styles.coverWrap}>
        {game.image ? (
          <Image
            source={{ uri: game.image }}
            style={styles.coverImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverFallback}>
            <Icon name="gamepad" size={32} color={colors.faint} />
          </View>
        )}

        {/* Top-right category pills */}
        {catLabels.length > 0 ? (
          <View style={styles.catBadgesWrap}>
            {catLabels.slice(0, 2).map((lbl) => (
              <View
                key={lbl}
                style={[
                  styles.catBadge,
                  /PS5|فايف/.test(lbl) && styles.catBadgePs5,
                ]}
              >
                <Text
                  style={[
                    styles.catBadgeText,
                    !/PS5|فايف/.test(lbl) && styles.catBadgeNeutral,
                  ]}
                >
                  {lbl}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Top-left size badge */}
        {game.size_gb ? (
          <View style={styles.sizeBadge}>
            <Text style={styles.sizeBadgeText}>
              {Math.round(Number(game.size_gb))} GB
            </Text>
          </View>
        ) : null}

        {/* Split-screen badge */}
        {split ? (
          <View style={styles.splitBadge}>
            <Text style={styles.splitText}>شاشة مقسومة</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.infoArea}>
        <Text numberOfLines={1} style={styles.title}>
          {game.title}
        </Text>

        <Text numberOfLines={1} style={styles.subText}>
          {subtitle}
        </Text>

        <View style={styles.priceContainer}>
          {isPs4 ? (
            <>
              <View style={styles.priceBadgePs4}>
                <Text style={styles.priceLabelPs4}>فور</Text>
                <Text style={styles.priceValPs4}>
                  {formatDinar(mainPriceOf(game))}
                </Text>
              </View>
              <View style={styles.priceBadgePs5}>
                <Text style={styles.priceLabelPs5}>فايف</Text>
                <Text style={styles.priceValPs5}>
                  {formatDinar(ps5PriceOf(game))}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.priceSingleWrap}>
              <Text style={styles.priceSingle}>
                {formatDinar(mainPriceOf(game))}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Animated.View style={[styles.addBtn, inCart && styles.addBtnInCart, { transform: [{ scale: pop }] }]}>
        <Icon
          name={inCart ? 'check' : 'plus'}
          size={15}
          color={inCart ? colors.brandDark : colors.brandLight}
        />
        <Text style={[styles.addBtnText, inCart && styles.addBtnTextInCart]}>
          {inCart ? 'في السلة ✓' : 'أضف للسلة'}
        </Text>
      </Animated.View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  /* ==== الوضع المضغوط: صف أفقي ~68dp === */
  cardRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.elevatedRaised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 8,
  },
  rowThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.deep,
  },
  rowThumbImg: {
    width: '100%',
    height: '100%',
  },
  rowThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 3,
  },
  rowPriceLine: {
    fontFamily: FONT.semibold,
    color: colors.text,
    fontSize: 12,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  rowAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rowAddBtnInCart: {
    backgroundColor: colors.brand,
    borderColor: colors.brandBorder,
  },
  /* ==== بطاقة الشبكة 3:4 ==== */
  card: {
    flex: 1,
    backgroundColor: colors.elevatedRaised,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-between',
  },
  cardInCart: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  coverWrap: {
    width: '100%',
    aspectRatio: 0.78,
    backgroundColor: colors.deep,
    position: 'relative',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBadgesWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  catBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  catBadgePs5: {
    borderColor: 'rgba(139, 92, 246, 0.55)',
  },
  catBadgeNeutral: {
    color: colors.dim,
  },
  catBadgeText: {
    fontFamily: FONT.bold,
    color: '#ddd6fe',
    fontSize: 10,
    includeFontPadding: false,
  },
  sizeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  sizeBadgeText: {
    fontFamily: FONT.semibold,
    color: colors.dim,
    fontSize: 10,
    includeFontPadding: false,
  },
  splitBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(20, 184, 166, 0.92)',
  },
  splitText: {
    fontFamily: FONT.bold,
    color: colors.brandDark,
    fontSize: 10,
    includeFontPadding: false,
  },
  infoArea: {
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 8,
  },
  title: {
    fontFamily: FONT.bold,
    color: colors.text,
    fontSize: 13.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: 2,
  },
  subText: {
    fontFamily: FONT.regular,
    color: colors.faint,
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
  },
  priceBadgePs4: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  priceLabelPs4: {
    fontFamily: FONT.semibold,
    color: colors.faint,
    fontSize: 10,
    includeFontPadding: false,
  },
  priceValPs4: {
    fontFamily: FONT.bold,
    color: colors.text,
    fontSize: 11,
    includeFontPadding: false,
  },
  priceBadgePs5: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  priceLabelPs5: {
    fontFamily: FONT.semibold,
    color: colors.faint,
    fontSize: 10,
    includeFontPadding: false,
  },
  priceValPs5: {
    fontFamily: FONT.bold,
    color: colors.text,
    fontSize: 11,
    includeFontPadding: false,
  },
  priceSingleWrap: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
  },
  priceSingle: {
    fontFamily: FONT.bold,
    color: colors.text,
    fontSize: 12,
    includeFontPadding: false,
  },
  addBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 10,
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  addBtnInCart: {
    backgroundColor: colors.brand,
    borderColor: colors.brandBorder,
  },
  addBtnText: {
    fontFamily: FONT.bold,
    color: colors.text,
    fontSize: 12,
    includeFontPadding: false,
  },
  addBtnTextInCart: {
    color: colors.brandDark,
  },
});
