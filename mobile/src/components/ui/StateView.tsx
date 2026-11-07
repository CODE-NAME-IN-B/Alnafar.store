import { ActivityIndicator, Text, View, Pressable } from 'react-native';
import Icon, { type IconName } from './Icon';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { tokens } from '@/lib/colors';

interface BaseProps {
  message?: string;
}

/** حالة تحميل موحدة */
export function LoadingState({ message = 'جاري التحميل...' }: BaseProps) {
  const palette = usePalette();
  return (
    <View style={[center, { padding: 32 }]} accessibilityRole="status">
      <ActivityIndicator color={palette.primary} size="large" />
      <Text style={{ color: palette.textSub, fontFamily: AR_FONT.medium, marginTop: 12, fontSize: 14 }}>
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
  const palette = usePalette();
  return (
    <View style={[center, { padding: 32 }]}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: palette.danger,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Icon name="alert" size={28} color={palette.danger} />
      </View>
      <Text style={{ color: palette.danger, fontFamily: AR_FONT.bold, fontSize: 16, marginBottom: 6 }}>
        تعذر إكمال العملية
      </Text>
      <Text style={{ color: palette.textSub, fontFamily: AR_FONT.medium, textAlign: 'center', fontSize: 14 }}>
        {message}
      </Text>
      {hint ? (
        <Text
          style={{
            color: palette.textFaint,
            fontFamily: AR_FONT.regular,
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
            paddingHorizontal: 22,
            paddingVertical: 11,
            borderWidth: 1,
            borderColor: palette.surfaceLine,
            backgroundColor: palette.surface,
          }}
        >
          <Icon name="refresh" size={16} color={palette.primary} />
          <Text style={{ color: palette.text, fontFamily: AR_FONT.bold, fontSize: 14 }}>
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
  const palette = usePalette();
  const iconName: IconName = VALID_ICONS.has(icon) ? (icon as IconName) : 'gamepad';

  return (
    <View style={[center, { padding: 36 }]}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: palette.surfaceLine,
          backgroundColor: palette.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Icon name={iconName} size={30} color={palette.textFaint} />
      </View>
      <Text
        style={{
          color: palette.textSub,
          fontFamily: AR_FONT.medium,
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
          style={({ pressed }) => ({
            borderRadius: tokens.radius.pill,
            marginTop: 18,
            backgroundColor: pressed ? palette.primaryPressed : palette.primary,
            paddingHorizontal: 26,
            paddingVertical: 12,
            minHeight: 46,
            alignItems: 'center',
            justifyContent: 'center',
          })}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text
            style={{
              color: palette.onPrimary,
              fontFamily: AR_FONT.bold,
              fontSize: 14,
              lineHeight: 22,
              textAlign: 'center',
              writingDirection: 'rtl',
              includeFontPadding: false,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const center = { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const };
