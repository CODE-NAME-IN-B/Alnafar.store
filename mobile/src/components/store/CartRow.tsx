import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CartItem, useCartStore } from '@/stores/cart';
import { formatDinar } from '@/lib/money';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';
import { colors, triggerLightHaptic } from '@/lib/colors';

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
          color={colors.faint}
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
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            handleIncrement();
          }}
          accessibilityRole="button"
          accessibilityLabel="زيادة الكمية"
          hitSlop={6}
          style={styles.qtyBtn}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
        <Text style={styles.qtyVal}>{item.quantity}</Text>
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            onDecrement();
          }}
          accessibilityRole="button"
          accessibilityLabel="إنقاص الكمية"
          hitSlop={6}
          style={styles.qtyBtn}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => {
          triggerLightHaptic();
          onRemove();
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`حذف ${item.title} من السلة`}
        style={styles.delBtn}
      >
        <Icon name="trash" size={15} color={colors.dangerText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.elevatedRaised,
    borderRadius: 16,
    padding: 11,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  thumbPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surfaceInset,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: FONT.bold,
    color: colors.text,
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
    fontSize: 11,
    lineHeight: 17,
    fontFamily: FONT.bold,
    includeFontPadding: false,
  },
  ps5Text: { color: '#c4b5fd' },
  ps4Text: { color: colors.brandBright },
  sizeText: {
    fontFamily: FONT.regular,
    color: colors.faint,
    fontSize: 11,
    includeFontPadding: false,
  },
  priceText: {
    fontFamily: FONT.semibold,
    color: colors.text,
    fontSize: 13,
    includeFontPadding: false,
  },
  qtyWrap: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceInset,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: FONT.bold,
    includeFontPadding: false,
  },
  qtyVal: {
    fontFamily: FONT.bold,
    color: colors.text,
    fontSize: 13,
    minWidth: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  delBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
