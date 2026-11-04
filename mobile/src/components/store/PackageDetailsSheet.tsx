import { Image } from 'expo-image';
import { Text, View, ScrollView } from 'react-native';
import ModalSheet from '@/components/ui/ModalSheet';
import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
import { FONT } from '@/lib/fonts';
import { colors } from '@/lib/colors';
import { formatDinar } from '@/lib/money';
import type { StorePackage } from '@/api/types';

interface Props {
  visible: boolean;
  pkg: StorePackage | null;
  onClose: () => void;
  /** مستخدم الباقة — الزبون يفتح محتوياتها قبل الشراء */
  onAdd: (pkg: StorePackage) => void;
}

/** نافذة «عرض الألعاب» — محتويات الباقة بتباين عالٍ وصور واضحة */
export default function PackageDetailsSheet({ visible, pkg, onClose, onAdd }: Props) {
  return (
    <ModalSheet visible={visible} onClose={onClose} title={pkg ? `محتويات: ${pkg.name}` : undefined}>
      {pkg ? (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.elevatedRaised,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <AppText style={{ color: colors.dim, fontFamily: FONT.bold, fontSize: 13 }}>
              عدد الألعاب: {pkg.packageGames.length}
            </AppText>
            <AppText style={{ color: colors.brandLight, fontFamily: FONT.bold, fontSize: 15 }}>
              السعر: {formatDinar(Number(pkg.price))}
            </AppText>
          </View>

          <ScrollView style={{ maxHeight: 340 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              {pkg.packageGames.map((pg) => (
                <View
                  key={pg.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: colors.elevatedRaised,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    padding: 10,
                  }}
                >
                  <Image
                    source={{ uri: pg.image }}
                    style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: colors.elevated }}
                    contentFit="cover"
                    accessibilityLabel={`غلاف ${pg.title}`}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: colors.text,
                        fontFamily: FONT.bold,
                        fontSize: 14,
                        textAlign: 'right',
                      }}
                    >
                      {pg.title}
                    </Text>
                    <Text
                      style={{
                        color: colors.brandLight,
                        fontFamily: FONT.medium,
                        fontSize: 12,
                        textAlign: 'right',
                        marginTop: 2,
                      }}
                    >
                      قيمة اللعبة منفردة: {formatDinar(Number(pg.price))}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={{ marginTop: 14 }}>
            <AppButton
              label="أضف الباقة كاملة إلى السلة"
              icon="cart"
              onPress={() => onAdd(pkg)}
            />
          </View>
        </>
      ) : null}
    </ModalSheet>
  );
}
