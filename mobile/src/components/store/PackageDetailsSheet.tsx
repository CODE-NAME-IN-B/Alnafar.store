import React from 'react';
import { Image } from 'expo-image';
import { Text, View, ScrollView } from 'react-native';
import ModalSheet from '@/components/ui/ModalSheet';
import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { formatDinar } from '@/lib/money';
import type { StorePackage } from '@/api/types';

interface Props {
  visible: boolean;
  pkg: StorePackage | null;
  onClose: () => void;
  /** مستخدم الباقة — الزبون يفتح محتوياتها قبل الشراء */
  onAdd: (pkg: StorePackage) => void;
}

/** نافذة «عرض الألعاب» — محتويات الباقة بتباين عالٍ وصور واضحة بهوية v5 */
export default function PackageDetailsSheet({ visible, pkg, onClose, onAdd }: Props) {
  const palette = usePalette();

  return (
    <ModalSheet visible={visible} onClose={onClose} title={pkg ? `محتويات: ${pkg.name}` : undefined}>
      {pkg ? (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: palette.surface,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: palette.surfaceLine,
            }}
          >
            <AppText style={{ color: palette.textSub, fontFamily: AR_FONT.bold, fontSize: 13 }}>
              عدد الألعاب: {pkg.packageGames.length}
            </AppText>
            <AppText style={{ color: palette.money, fontFamily: AR_FONT.bold, fontSize: 16 }}>
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
                    backgroundColor: palette.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: palette.surfaceLine,
                    padding: 10,
                  }}
                >
                  <Image
                    source={{ uri: pg.image }}
                    style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: palette.surfaceRaised }}
                    contentFit="cover"
                    accessibilityLabel={`غلاف ${pg.title}`}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: palette.text,
                        fontFamily: AR_FONT.bold,
                        fontSize: 14,
                        textAlign: 'right',
                      }}
                    >
                      {pg.title}
                    </Text>
                    <Text
                      style={{
                        color: palette.textSub,
                        fontFamily: AR_FONT.medium,
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
