import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import ModalSheet from '@/components/ui/ModalSheet';
import Icon from '@/components/ui/Icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { fetchServices } from '@/api/settings';
import { addServiceToCart } from '@/features/cartActions';
import { FONT } from '@/lib/fonts';
import { colors } from '@/lib/colors';
import { ROW } from '@/lib/rtl';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** نافذة الخدمات الإضافية في المتجر (مهام، حسابات، صيانة...) */
export default function ServicesSheet({ visible, onClose }: Props) {
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
                  backgroundColor: colors.elevatedRaised,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  padding: 14,
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: FONT.bold,
                      fontSize: 15,
                      textAlign: 'right',
                    }}
                  >
                    {svc.title}
                  </Text>
                  {/* المبلغ لون نص لا لون إجراء */}
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: FONT.bold,
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
                    backgroundColor: colors.brand,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    minHeight: 44,
                    justifyContent: 'center',
                    paddingVertical: 9,
                    flexDirection: ROW,
                    alignItems: 'center',
                    gap: 5,
                  }}
                  accessible
                  accessibilityLabel={`إضافة خدمة ${svc.title}`}
                >
                  <Icon name="plus" size={15} color={colors.brandDark} strokeWidth={2.4} />
                  <Text style={{ color: colors.brandDark, fontFamily: FONT.bold, fontSize: 13 }}>
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
