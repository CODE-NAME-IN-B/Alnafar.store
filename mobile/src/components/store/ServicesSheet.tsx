import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import ModalSheet from '@/components/ui/ModalSheet';
import Icon from '@/components/ui/Icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { fetchServices } from '@/api/settings';
import { addServiceToCart } from '@/features/cartActions';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ROW } from '@/lib/rtl';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** نافذة الخدمات الإضافية في المتجر (مهام، حسابات، صيانة...) بنظام v5 */
export default function ServicesSheet({ visible, onClose }: Props) {
  const palette = usePalette();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-services'],
    queryFn: fetchServices,
    enabled: visible,
  });

  const services = data ?? [];

  return (
    <ModalSheet visible={visible} onClose={onClose} title="الخدمات المتاحة">
      {isLoading ? (
        <LoadingState message="جاري جلب الخدمات..." />
      ) : isError && !services.length ? (
        <ErrorState message="تعذر جلب الخدمات" onRetry={() => void refetch()} />
      ) : !services.length ? (
        <EmptyState message="لا توجد خدمات إضافية متاحة حالياً" icon="services" />
      ) : (
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 10 }}>
            {services.map((svc) => (
              <View
                key={svc.id}
                style={{
                  flexDirection: ROW,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: palette.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: palette.surfaceLine,
                  padding: 14,
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: palette.text,
                      fontFamily: AR_FONT.bold,
                      fontSize: 15,
                      textAlign: 'right',
                    }}
                  >
                    {svc.title}
                  </Text>
                  <Text
                    style={{
                      color: palette.money,
                      fontFamily: AR_FONT.bold,
                      fontSize: 13,
                      textAlign: 'right',
                      marginTop: 2,
                    }}
                  >
                    {formatDinar(Number(svc.price))}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    addServiceToCart(svc);
                    showToast(`أضيفت الخدمة: ${svc.title}`);
                  }}
                  style={{
                    backgroundColor: palette.primary,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    minHeight: 44,
                    justifyContent: 'center',
                    paddingVertical: 9,
                    flexDirection: ROW,
                    alignItems: 'center',
                    gap: 6,
                  }}
                  accessible
                  accessibilityLabel={`إضافة خدمة ${svc.title}`}
                >
                  <Icon name="plus" size={15} color={palette.onPrimary} strokeWidth={2.4} />
                  <Text
                    style={{
                      color: palette.onPrimary,
                      fontFamily: AR_FONT.bold,
                      fontSize: 13,
                    }}
                  >
                    أضف للسلة
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </ModalSheet>
  );
}
