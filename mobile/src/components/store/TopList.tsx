import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ResolvedTopGame } from '@/api/stats';
import { formatDinar } from '@/lib/money';
import { mainPriceOf } from '@/lib/gamePrices';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

interface Props {
  items: ResolvedTopGame[];
  onSelect: (game: ResolvedTopGame) => void;
}

export default function TopList({ items, onSelect }: Props) {
  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.fireIconWrap}>
            <Icon name="fire" size={16} color="#fb923c" />
          </View>
          <Text style={styles.heading}>الأكثر طلباً</Text>
        </View>
        <Text style={styles.subHeading}>أعلى الألعاب مبيعاً</Text>
      </View>
      <FlatList
        data={items}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => onSelect(item)} style={styles.card}>
            <View style={styles.thumbWrap}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.thumbFallback}>
                  <Icon name="gamepad" size={20} color="#475569" />
                </View>
              )}
              <View style={[styles.rankBadge, index < 3 && styles.rankBadgeTop]}>
                <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>
                  #{index + 1}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text numberOfLines={1} style={styles.title}>
                {item.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.price}>{formatDinar(mainPriceOf(item))}</Text>
                <Text style={styles.countText}>{item.count} طلب</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleWrap: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  fireIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(251, 146, 60, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 16,
    includeFontPadding: false,
  },
  subHeading: {
    fontFamily: FONT.medium,
    color: '#64748b',
    fontSize: 11,
    includeFontPadding: false,
  },
  listContent: {
    paddingVertical: 2,
  },
  sep: { width: 10 },
  card: {
    width: 215,
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#131d31',
    borderRadius: 14,
    padding: 9,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  thumbWrap: {
    width: 56,
    height: 68,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#090f1d',
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rankBadgeTop: {
    backgroundColor: '#f59e0b',
    borderColor: '#fbbf24',
  },
  rankText: {
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    fontSize: 10,
    includeFontPadding: false,
  },
  rankTextTop: {
    color: '#090f1d',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },
  title: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  metaRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontFamily: FONT.bold,
    color: '#2dd4bf',
    fontSize: 12,
    includeFontPadding: false,
  },
  countText: {
    fontFamily: FONT.medium,
    color: '#94a3b8',
    fontSize: 11,
    includeFontPadding: false,
  },
});
