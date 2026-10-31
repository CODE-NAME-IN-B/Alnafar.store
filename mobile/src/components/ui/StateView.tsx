import { ActivityIndicator, Text, View, Pressable } from 'react-native';
import { FONT } from '@/lib/fonts';

interface BaseProps {
  message?: string;
}

/** حالة تحميل موحدة */
export function LoadingState({ message = 'جاري التحميل...' }: BaseProps) {
  return (
    <View style={[center, { padding: 32 }]} accessibilityRole="status">
      <ActivityIndicator color="#14b8a6" size="large" />
      <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, marginTop: 12 }}>{message}</Text>
    </View>
  );
}

interface ErrorStateProps extends BaseProps {
  onRetry?: () => void;
  hint?: string;
}

/** حالة خطأ مع زر إعادة المحاولة */
export function ErrorState({ message = 'حدث خطأ', hint, onRetry }: ErrorStateProps) {
  return (
    <View style={[center, { padding: 32 }]}>
      <Text style={{ color: '#ef4444', fontFamily: FONT.bold, fontSize: 16, marginBottom: 8 }}>
        عذراً
      </Text>
      <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, textAlign: 'center' }}>
        {message}
      </Text>
      {hint ? (
        <Text style={{ color: '#64748b', fontFamily: FONT.regular, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
          {hint}
        </Text>
      ) : null}
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={{
            borderRadius: 10,
            marginTop: 20,
            backgroundColor: '#1b2740',
            paddingHorizontal: 22,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold }}>إعادة المحاولة</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface EmptyStateProps extends BaseProps {
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** حالة فارغة (لا ألعاب، سللة خالية...) */
export function EmptyState({ message, icon = '🕹️', actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={[center, { padding: 40 }]}>
      <Text style={{ fontSize: 42, marginBottom: 12 }}>{icon}</Text>
      <Text style={{ color: '#94a3b8', fontFamily: FONT.medium, textAlign: 'center' }}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={{ borderRadius: 10, marginTop: 20, backgroundColor: '#14b8a6', paddingHorizontal: 22, paddingVertical: 10 }}
        >
          <Text style={{ color: '#062b27', fontFamily: FONT.bold }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const center = { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const };
