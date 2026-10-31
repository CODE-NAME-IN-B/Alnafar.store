import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import ModalSheet from '@/components/ui/ModalSheet';
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
        <EmptyState message="لا توجد خدمات إضافية متاحة حالياً" icon="🔧" />
      ) : (
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 8 }}>
            {services.map((svc) => (
              <View
                key={svc.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#0b1220',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  padding: 12,
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 14 }}>
                    {svc.title}
                  </Text>
                  <Text style={{ color: '#2dd4bf', fontFamily: FONT.medium, fontSize: 13 }}>
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
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                  accessible
                  accessibilityLabel={`إضافة خدمة ${svc.title}`}
                >
                  <Text style={{ color: '#062b27', fontFamily: FONT.bold, fontSize: 13 }}>
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
