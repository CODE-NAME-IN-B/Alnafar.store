import { Pressable, Text, View } from 'react-native';
import type { CartItem } from '@/stores/cart';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';

interface Props {
  item: CartItem;
  onDecrement: () => void;
  onRemove: () => void;
}

/** صف عنصر داخل شاشة السلة */
export default function CartRow({ item, onDecrement, onRemove }: Props) {
  return (
    <View style={rowBox}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold }}>
          {item.title}
          <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 12 }}>
            {item.type === 'game'
              ? `  ${item.platform ?? ''}`
              : item.type === 'service'
                ? '  •خدمة'
                : '  •باقة'}
          </Text>
        </Text>
        {item.sizeGb ? (
          <Text style={{ color: '#64748b', fontFamily: FONT.regular, fontSize: 12 }}>
            {Math.round(Number(item.sizeGb))} GB
          </Text>
        ) : null}
        <Text style={{ color: '#2dd4bf', fontFamily: FONT.medium, marginTop: 4 }}>
          {formatDinar(item.price * item.quantity)}
        </Text>
      </View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={onDecrement} accessibilityLabel="نقص الكمية" style={qtyBtn}>
            <Text style={{ color: '#f1f5f9', fontSize: 18 }}>−</Text>
          </Pressable>
          <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, minWidth: 20, textAlign: 'center' }}>
            {item.quantity}
          </Text>
        </View>
        <Pressable onPress={onRemove} accessibilityLabel="حذف من السلة">
          <Text style={{ color: '#ef4444', fontFamily: FONT.regular, fontSize: 12 }}>حذف</Text>
        </Pressable>
      </View>
    </View>
  );
}

const rowBox = {
  backgroundColor: '#141e30',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  padding: 14,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
} as const;

const qtyBtn = {
  width: 30,
  height: 30,
  borderRadius: 8,
  backgroundColor: '#1b2740',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
} as const;
