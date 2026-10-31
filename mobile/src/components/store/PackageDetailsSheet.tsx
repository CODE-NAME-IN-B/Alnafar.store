import { Image } from 'expo-image';
import { Text, View, ScrollView } from 'react-native';
import ModalSheet from '@/components/ui/ModalSheet';
import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import type { StorePackage } from '@/api/types';

interface Props {
  visible: boolean;
  pkg: StorePackage | null;
  onClose: () => void;
  /** مستخدم الباقة — الزبون يفتح محتوياتها قبل الشراء */
  onAdd: (pkg: StorePackage) => void;
}

/** نافذة «عرض الألعاب» — محتويات الباقة كما في فكرة المتجر */
export default function PackageDetailsSheet({ visible, pkg, onClose, onAdd }: Props) {
  return (
    <ModalSheet visible={visible} onClose={onClose} title={pkg ? `محتويات: ${pkg.name}` : undefined}>
      {pkg ? (
        <>
          <AppText
            style={{ color: '#94a3b8', fontFamily: FONT.medium, marginBottom: 12 }}
          >
            {pkg.packageGames.length} لعبة — السعر {formatDinar(Number(pkg.price))}
          </AppText>
          <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              {pkg.packageGames.map((pg) => (
                <View
                  key={pg.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: '#0b1220',
                    borderRadius: 10,
                    padding: 8,
                  }}
                >
                  <Image
                    source={{ uri: pg.image }}
                    style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#10203a' }}
                    contentFit="cover"
                    accessibilityLabel={`غلاف ${pg.title}`}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{ color: '#f1f5f9', fontFamily: FONT.medium }}
                    >
                      {pg.title}
                    </Text>
                    <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 12 }}>
                      {formatDinar(Number(pg.price))}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={{ marginTop: 14 }}>
            <AppButton label="أضف الباقة إلى السلة" onPress={() => onAdd(pkg)} />
          </View>
        </>
      ) : null}
    </ModalSheet>
  );
}
