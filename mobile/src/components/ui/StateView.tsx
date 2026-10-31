import { ActivityIndicator, Text, View, Pressable } from 'react-native';
import { FONT } from '@/lib/fonts';
import Icon, { type IconName } from './Icon';

interface BaseProps {
  message?: string;
}

/** حالة تحميل موحدة */
export function LoadingState({ message = 'جاري التحميل...' }: BaseProps) {
  return (
    <View style={[center, { padding: 32 }]} accessibilityRole="status">
      <ActivityIndicator color="#14b8a6" size="large" />
      <Text style={{ color: '#cbd5e1', fontFamily: FONT.medium, marginTop: 12, fontSize: 14 }}>
        {message}
      </Text>
    </View>
  );
}

interface ErrorStateProps extends BaseProps {
  onRetry?: () => void;
  hint?: string;
}

/** حالة خطأ مع زر إعادة المحاولة وأيقونة SVG */
export function ErrorState({ message = 'حدث خطأ', hint, onRetry }: ErrorStateProps) {
  return (
    <View style={[center, { padding: 32 }]}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: 'rgba(239,68,68,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(239,68,68,0.3)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Icon name="alert" size={28} color="#f87171" />
      </View>
      <Text style={{ color: '#f87171', fontFamily: FONT.bold, fontSize: 16, marginBottom: 6 }}>
        تعذر إكمال العملية
      </Text>
      <Text style={{ color: '#cbd5e1', fontFamily: FONT.medium, textAlign: 'center', fontSize: 14 }}>
        {message}
      </Text>
      {hint ? (
        <Text
          style={{
            color: '#94a3b8',
            fontFamily: FONT.regular,
            fontSize: 12,
            marginTop: 6,
            textAlign: 'center',
          }}
        >
          {hint}
        </Text>
      ) : null}
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderRadius: 12,
            marginTop: 18,
            backgroundColor: '#1b2b48',
            paddingHorizontal: 22,
            paddingVertical: 11,
            borderWidth: 1,
            borderColor: 'rgba(45,212,191,0.35)',
          }}
        >
          <Icon name="refresh" size={16} color="#2dd4bf" />
          <Text style={{ color: '#f8fafc', fontFamily: FONT.bold, fontSize: 14 }}>
            إعادة المحاولة
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface EmptyStateProps extends BaseProps {
  icon?: IconName | string;
  actionLabel?: string;
  onAction?: () => void;
}

const VALID_ICONS = new Set<string>([
  'gamepad',
  'invoice',
  'report',
  'package',
  'cart',
  'search',
  'services',
  'store',
  'alert',
  'qr',
]);

/** حالة فارغة بأيقونة SVG نظيفة وتباين عالٍ */
export function EmptyState({
  message,
  icon = 'gamepad',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const iconName: IconName = VALID_ICONS.has(icon) ? (icon as IconName) : 'gamepad';

  return (
    <View style={[center, { padding: 36 }]}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: 'rgba(20,184,166,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(20,184,166,0.28)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Icon name={iconName} size={30} color="#2dd4bf" />
      </View>
      <Text
        style={{
          color: '#cbd5e1',
          fontFamily: FONT.medium,
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 22,
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={{
            borderRadius: 12,
            marginTop: 18,
            backgroundColor: '#14b8a6',
            borderWidth: 1,
            borderColor: '#2dd4bf',
            paddingHorizontal: 24,
            paddingVertical: 11,
          }}
        >
          <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const center = { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const };
