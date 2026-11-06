import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CartItem, useCartStore } from '@/stores/cart';
import { formatDinar } from '@/lib/money';
import Icon from '@/components/ui/Icon';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ROW } from '@/lib/rtl';
import { triggerLightHaptic } from '@/lib/colors';

interface Props {
  item: CartItem;
  onDecrement: () => void;
  onRemove: () => void;
}

export default function CartRow({ item, onDecrement, onRemove }: Props) {
  const palette = usePalette();
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
    <View
      style={[
        styles.row,
        { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
      ]}
    >
      <View
        style={[
          styles.thumbPlaceholder,
          { backgroundColor: palette.surfaceRaised, borderColor: palette.surfaceLine },
        ]}
      >
        <Icon
          name={
            item.type === 'package'
              ? 'package'
              : item.type === 'service'
              ? 'services'
              : 'gamepad'
          }
          size={20}
          color={palette.textFaint}
        />
      </View>

      <View style={styles.infoCol}>
        <Text numberOfLines={1} style={[styles.title, { color: palette.text }]}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          {item.platform ? (
            <View
              style={[
                styles.platformBadge,
                { backgroundColor: palette.surfaceRaised, borderColor: palette.surfaceLine },
              ]}
            >
              <Text
                style={[
                  styles.platformText,
                  { color: palette.primary, fontFamily: AR_FONT.bold },
                ]}
              >
                {item.platform === 'PS5' ? 'فايف' : 'فور'}
              </Text>
            </View>
          ) : null}
          {item.sizeGb ? (
            <Text style={[styles.sizeText, { color: palette.textFaint }]}>
              {Math.round(item.sizeGb)} GB
            </Text>
          ) : null}
          <Text style={[styles.priceText, { color: palette.text }]}>
            {formatDinar(item.price * item.quantity)}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.qtyWrap,
          { backgroundColor: palette.surfaceRaised, borderColor: palette.surfaceLine },
        ]}
      >
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            handleIncrement();
          }}
          accessibilityRole="button"
          accessibilityLabel="زيادة الكمية"
          hitSlop={6}
          style={[styles.qtyBtn, { backgroundColor: palette.surface }]}
        >
          <Text style={[styles.qtyBtnText, { color: palette.text }]}>+</Text>
        </Pressable>
        <Text style={[styles.qtyVal, { color: palette.text }]}>{item.quantity}</Text>
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            onDecrement();
          }}
          accessibilityRole="button"
          accessibilityLabel="إنقاص الكمية"
          hitSlop={6}
          style={[styles.qtyBtn, { backgroundColor: palette.surface }]}
        >
          <Text style={[styles.qtyBtnText, { color: palette.text }]}>−</Text>
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
        style={[styles.delBtn, { backgroundColor: palette.surfaceRaised }]}
      >
        <Icon name="trash" size={15} color={palette.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 11,
    marginBottom: 10,
    borderWidth: 1,
  },
  thumbPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: AR_FONT.bold,
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
    borderWidth: 1,
  },
  platformText: {
    fontSize: 11,
    lineHeight: 17,
    includeFontPadding: false,
  },
  sizeText: {
    fontFamily: AR_FONT.regular,
    fontSize: 11,
    includeFontPadding: false,
  },
  priceText: {
    fontFamily: AR_FONT.bold,
    fontSize: 13,
    includeFontPadding: false,
  },
  qtyWrap: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderWidth: 1,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    fontFamily: AR_FONT.bold,
    includeFontPadding: false,
  },
  qtyVal: {
    fontFamily: AR_FONT.bold,
    fontSize: 13,
    minWidth: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  delBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

