import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import ModalSheet from '@/components/ui/ModalSheet';
import Icon from '@/components/ui/Icon';
import { EmptyState, LoadingState } from '@/components/ui/StateView';
import { fetchServices } from '@/api/settings';
import { addServiceToCart } from '@/features/cartActions';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** نافذة الخدمات الإضافية في المتجر (مهام، حسابات، صيانة...) */
export default function ServicesSheet({ visible, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['public-services'],
    queryFn: fetchServices,
    enabled: visible,
  });

  const services = data ?? [];

  return (
    <ModalSheet visible={visible} onClose={onClose} title="الخدمات المتاحة">
      {isLoading ? (
        <LoadingState message="جاري جلب الخدمات..." />
      ) : !services.length ? (
        <EmptyState message="لا توجد خدمات إضافية متاحة حالياً" icon="services" />
      ) : (
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 10 }}>
            {services.map((svc) => (
              <View
                key={svc.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#0f1829',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  padding: 14,
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#f8fafc',
                      fontFamily: FONT.bold,
                      fontSize: 15,
                      textAlign: 'right',
                    }}
                  >
                    {svc.title}
                  </Text>
                  <Text
                    style={{
                      color: '#2dd4bf',
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
                    backgroundColor: '#14b8a6',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                  accessible
                  accessibilityLabel={`إضافة خدمة ${svc.title}`}
                >
                  <Icon name="plus" size={15} color="#ffffff" strokeWidth={2.4} />
                  <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 }}>
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
