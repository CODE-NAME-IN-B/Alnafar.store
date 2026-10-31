import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CartItem, useCartStore } from '@/stores/cart';
import { formatDinar } from '@/lib/money';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

interface Props {
  item: CartItem;
  onDecrement: () => void;
  onRemove: () => void;
}

export default function CartRow({ item, onDecrement, onRemove }: Props) {
  const addGame = useCartStore((s) => s.addGame);
  const addService = useCartStore((s) => s.addService);
  const addPackage = useCartStore((s) => s.addPackage);

  const handleIncrement = () => {
    if (item.type === 'game') {
      addGame({
        id: item.refId,
        title: item.title,
        price: item.price,
        sizeGb: item.sizeGb ?? null,
        platform: item.platform ?? 'PS4',
      });
    } else if (item.type === 'service') {
      addService({ id: item.refId, title: item.title, price: item.price });
    } else {
      addPackage({
        id: item.refId,
        name: item.title,
        price: item.price,
        sizeGb: item.sizeGb ?? null,
        packageGames: item.packageGames,
      });
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.thumbPlaceholder}>
        <Icon
          name={
            item.type === 'package'
              ? 'package'
              : item.type === 'service'
              ? 'services'
              : 'gamepad'
          }
          size={20}
          color="#2dd4bf"
        />
      </View>

      <View style={styles.infoCol}>
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          {item.platform ? (
            <View
              style={[
                styles.platformBadge,
                item.platform === 'PS5' ? styles.ps5Badge : styles.ps4Badge,
              ]}
            >
              <Text
                style={[
                  styles.platformText,
                  item.platform === 'PS5' ? styles.ps5Text : styles.ps4Text,
                ]}
              >
                {item.platform === 'PS5' ? 'فايف' : 'فور'}
              </Text>
            </View>
          ) : null}
          {item.sizeGb ? (
            <Text style={styles.sizeText}>{Math.round(item.sizeGb)} GB</Text>
          ) : null}
          <Text style={styles.priceText}>
            {formatDinar(item.price * item.quantity)}
          </Text>
        </View>
      </View>

      <View style={styles.qtyWrap}>
        <Pressable onPress={handleIncrement} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
        <Text style={styles.qtyVal}>{item.quantity}</Text>
        <Pressable onPress={onDecrement} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>−</Text>
        </Pressable>
      </View>

      <Pressable onPress={onRemove} hitSlop={8} style={styles.delBtn}>
        <Icon name="trash" size={15} color="#fca5a5" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#131d31',
    borderRadius: 16,
    padding: 11,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  thumbPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 13.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  metaRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  platformBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ps5Badge: { backgroundColor: 'rgba(139, 92, 246, 0.2)' },
  ps4Badge: { backgroundColor: 'rgba(20, 184, 166, 0.2)' },
  platformText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    includeFontPadding: false,
  },
  ps5Text: { color: '#c4b5fd' },
  ps4Text: { color: '#5eead4' },
  sizeText: {
    fontFamily: FONT.regular,
    color: '#94a3b8',
    fontSize: 11,
    includeFontPadding: false,
  },
  priceText: {
    fontFamily: FONT.bold,
    color: '#2dd4bf',
    fontSize: 13,
    includeFontPadding: false,
  },
  qtyWrap: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0b1324',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#f8fafc',
    fontSize: 14,
    fontFamily: FONT.bold,
    includeFontPadding: false,
  },
  qtyVal: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 13,
    minWidth: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  delBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#2a1215',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
