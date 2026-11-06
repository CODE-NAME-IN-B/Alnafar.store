import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Game, Category } from '@/api/types';
import { HeroCard } from '@/design/HeroCard';
import { usePalette } from '@/design/theme';
import { AR_FONT } from '@/design/fonts';
import Icon from '@/components/ui/Icon';
import { ROW } from '@/lib/rtl';

export interface TopSlideItem {
  game: Game;
  orders?: number;
  rank: number;
}

interface Props {
  items: TopSlideItem[];
  categories: Category[];
  onPress: (game: Game) => void;
}

export default function TopSlideshow({ items, categories, onPress }: Props) {
  const palette = usePalette();
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = Math.max(windowWidth - 28, 280);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const userInteracted = useRef(false);

  // تدوير تلقائي للسلايد شو كل 4.5 ثوانٍ
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      if (userInteracted.current) {
        userInteracted.current = false;
        return;
      }
      setCurrentIndex((prev) => {
        const next = (prev + 1) % items.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [items.length]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offset / slideWidth);
    if (idx >= 0 && idx < items.length) {
      setCurrentIndex(idx);
    }
  };

  const isPs4Game = (g: Game) => {
    const cat = categories.find((c) => c.id === g.category_id);
    const catName = (cat?.name ?? '').toLowerCase();
    const title = (g.title ?? '').toLowerCase();
    return catName.includes('ps4') || title.includes('ps4') || Boolean(g.price_ps5);
  };

  if (!items.length) return null;

  return (
    <View style={styles.container}>
      {/* عنوان قسم الأكثر تحميلاً */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: palette.surfaceRaised, borderColor: palette.surfaceLine },
            ]}
          >
            <Icon name="fire" size={15} color={palette.accent} />
          </View>
          <Text style={[styles.headerTitle, { color: palette.text }]}>الأكثر تحميلاً وطلباً</Text>
        </View>

        {/* مؤشر ترقيم السلايدات */}
        <View style={styles.counterBadge}>
          <Text style={[styles.counterText, { color: palette.textSub }]}>
            {currentIndex + 1} / {items.length}
          </Text>
        </View>
      </View>

      {/* شريط السلايدات */}
      <FlatList
        ref={flatListRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth}
        decelerationRate="fast"
        onScrollBeginDrag={() => {
          userInteracted.current = true;
        }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(item) => String(item.game.id)}
        getItemLayout={(_, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={{ width: slideWidth }}>
            <HeroCard
              game={item.game}
              orders={item.orders ?? 0}
              rank={item.rank}
              platform={isPs4Game(item.game) ? 'PS4' : 'PS5'}
              onPress={onPress}
            />
          </View>
        )}
      />

      {/* نقاط التنقل Pagination Dots */}
      {items.length > 1 ? (
        <View style={styles.dotsRow}>
          {items.map((_, idx) => {
            const active = idx === currentIndex;
            return (
              <Pressable
                key={String(idx)}
                onPress={() => {
                  userInteracted.current = true;
                  setCurrentIndex(idx);
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true });
                }}
                hitSlop={6}
                style={[
                  styles.dot,
                  active
                    ? [styles.dotActive, { backgroundColor: palette.primary }]
                    : [styles.dotInactive, { backgroundColor: palette.surfaceLine }],
                ]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  titleWrap: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 7,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 14,
    includeFontPadding: false,
  },
  counterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  counterText: {
    fontFamily: AR_FONT.medium,
    fontSize: 11,
    includeFontPadding: false,
  },
  dotsRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
  },
  dotInactive: {
    width: 6,
  },
});
