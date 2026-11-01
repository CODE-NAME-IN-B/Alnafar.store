import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Category, Game } from '@/api/types';
import { formatDinar } from '@/lib/money';
import { isPs4Game, mainPriceOf, ps5PriceOf } from '@/lib/gamePrices';
import { classifyGameHeuristic, formatGenreLabel } from '@/lib/arabic';
import { useCartStore } from '@/stores/cart';
import Icon from './ui/Icon';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

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
    return sLabel || gLabel || 'أكشن ومغامرة';
  }, [game]);

  const compactPriceLine = useMemo(() => {
    if (!isPs4) return formatDinar(mainPriceOf(game));
    return `فور ${formatDinar(mainPriceOf(game))} • فايف ${formatDinar(ps5PriceOf(game))}`;
  }, [game, isPs4]);

  if (compact) {
    return (
      <Pressable
        onPress={() => onPress(game)}
        accessibilityRole="button"
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
              <Icon name="gamepad" size={22} color="#334155" />
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

        <View style={[styles.rowAddBtn, inCart && styles.rowAddBtnInCart]}>
          <Icon
            name={inCart ? 'check' : 'plus'}
            size={18}
            color={inCart ? '#042f2e' : '#2dd4bf'}
          />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => onPress(game)}
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
            <Icon name="gamepad" size={32} color="#334155" />
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

      <View style={[styles.addBtn, inCart && styles.addBtnInCart]}>
        <Icon
          name={inCart ? 'check' : 'plus'}
          size={15}
          color={inCart ? '#042f2e' : '#2dd4bf'}
        />
        <Text style={[styles.addBtnText, inCart && styles.addBtnTextInCart]}>
          {inCart ? 'في السلة ✓' : 'أضف للسلة'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /* ==== الوضع المضغوط: صف أفقي ~68dp === */
  cardRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#131d31',
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
    backgroundColor: '#090f1d',
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
    color: '#5eead4',
    fontSize: 12,
    writingDirection: 'ltr',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  rowAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17253e',
    borderWidth: 1,
    borderColor: '#2dd4bf44',
  },
  rowAddBtnInCart: {
    backgroundColor: '#14b8a6',
    borderColor: '#2dd4bf',
  },
  /* ==== بطاقة الشبكة 3:4 ==== */
  card: {
    flex: 1,
    backgroundColor: '#131d31',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-between',
  },
  cardInCart: {
    borderColor: '#14b8a6',
    backgroundColor: '#0d2229',
  },
  coverWrap: {
    width: '100%',
    aspectRatio: 0.78,
    backgroundColor: '#090f1d',
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
    color: '#cbd5e1',
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
    color: '#cbd5e1',
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
    color: '#042f2e',
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
    color: '#f8fafc',
    fontSize: 13.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
    marginBottom: 2,
  },
  subText: {
    fontFamily: FONT.regular,
    color: '#94a3b8',
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
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.4)',
  },
  priceLabelPs4: {
    fontFamily: FONT.semibold,
    color: '#5eead4',
    fontSize: 10,
    includeFontPadding: false,
  },
  priceValPs4: {
    fontFamily: FONT.bold,
    color: '#2dd4bf',
    fontSize: 11,
    includeFontPadding: false,
    textAlign: 'left',
  },
  priceBadgePs5: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.5)',
  },
  priceLabelPs5: {
    fontFamily: FONT.semibold,
    color: '#5eead4',
    fontSize: 10,
    includeFontPadding: false,
  },
  priceValPs5: {
    fontFamily: FONT.bold,
    color: '#2dd4bf',
    fontSize: 11,
    includeFontPadding: false,
    textAlign: 'left',
  },
  priceSingleWrap: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.4)',
    alignItems: 'center',
  },
  priceSingle: {
    fontFamily: FONT.bold,
    color: '#2dd4bf',
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
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#17253e',
    borderWidth: 1,
    borderColor: '#2dd4bf44',
  },
  addBtnInCart: {
    backgroundColor: '#14b8a6',
    borderColor: '#2dd4bf',
  },
  addBtnText: {
    fontFamily: FONT.bold,
    color: '#5eead4',
    fontSize: 12,
    includeFontPadding: false,
  },
  addBtnTextInCart: {
    color: '#042f2e',
  },
});
