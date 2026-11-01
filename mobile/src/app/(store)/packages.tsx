import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/api/categories';
import { fetchActivePackages } from '@/api/packages';
import { useAppStore } from '@/stores/app';
import { addPackageToCart } from '@/features/cartActions';
import PackageDetailsSheet from '@/components/store/PackageDetailsSheet';
import Screen from '@/components/ui/Screen';
import Icon from '@/components/ui/Icon';
import Chip from '@/components/ui/Chip';
import AppText from '@/components/ui/AppText';
import { useScreenEntrance, useEntrance } from '@/components/ui/motion';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/StateView';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';
import type { StorePackage } from '@/api/types';

/** شاشة الباقات مع زر «عرض الألعاب» قبل الشراء — متباينة وواضحة بالكامل */
export default function PackagesScreen() {
  const activeCategoryId = useAppStore((s) => s.activeCategoryId);
  const setActiveCategory = useAppStore((s) => s.setActiveCategory);
  const [details, setDetails] = useState<StorePackage | null>(null);

  const addPack = (pkg: StorePackage) => {
    addPackageToCart(pkg);
    showToast('أضيفت الباقة للسلة');
  };

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(true),
  });

  const entranceStyle = useScreenEntrance({ durationMs: 240, dy: 12 });

  const packages = useQuery({
    queryKey: ['packages-active', activeCategoryId],
    queryFn: async () => {
      if (activeCategoryId == null) return [];
      return fetchActivePackages(activeCategoryId);
    },
    enabled: activeCategoryId != null,
  });

  useEffect(() => {
    if (activeCategoryId == null && categories.data && categories.data.length) {
      setActiveCategory(categories.data[0].id);
    }
  }, [activeCategoryId, categories.data, setActiveCategory]);

  return (
    <Screen edges={['top']}>
      <Animated.View
        style={[
          {
            backgroundColor: '#0f172a',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.08)',
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: 12,
            gap: 10,
          },
          entranceStyle,
        ]}
      >
        <View>
          <AppText style={{ color: '#f8fafc', fontFamily: FONT.bold, fontSize: 18 }}>
            الباقات الاقتصادية
          </AppText>
          <AppText
            style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 12.5, marginTop: 2 }}
          >
            باقات مختارة — عاين جميع الألعاب داخل الباقة قبل إضافتها للسلة
          </AppText>
        </View>

        {categories.data && categories.data.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {categories.data.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                active={activeCategoryId === cat.id}
                onPress={() => setActiveCategory(cat.id)}
              />
            ))}
          </ScrollView>
        ) : null}
      </Animated.View>

      {activeCategoryId == null ? (
        <LoadingState message="جاري جلب الفئات..." />
      ) : packages.isLoading ? (
        <LoadingState message="جاري جلب الباقات..." />
      ) : packages.isError ? (
        <ErrorState
          message="تعذر جلب الباقات"
          hint="تحقق من الاتصال بالإنترنت ثم حاول"
          onRetry={() => packages.refetch()}
        />
      ) : packages.data && packages.data.length ? (
        <FlashList
          data={packages.data}
          keyExtractor={(pkg) => String(pkg.id)}
          renderItem={({ item, index }) => (
            <EntranceItem delay={(index % 8) * 55}>
              <PackageCard pkg={item} onDetails={setDetails} onAdd={addPack} />
            </EntranceItem>
          )}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState message="لا باقات نشطة لهذه الفئة حالياً" icon="package" />
        </View>
      )}

      <PackageDetailsSheet
        visible={!!details}
        pkg={details}
        onClose={() => setDetails(null)}
        onAdd={(pkg) => {
          addPack(pkg);
          setDetails(null);
        }}
      />
    </Screen>
  );
}

const pkgCard = {
  backgroundColor: '#141e30',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.08)',
  padding: 14,
  marginVertical: 6,
} as const;

/** بطاقة باقة بدخول متدرج — يجعل الشاشة تتنفس عند التحميل وفي البدايات */
function EntranceItem({ children, delay }: { children: ReactNode; delay: number }) {
  const { style } = useEntrance({ durationMs: 200, dy: 10, delayMs: delay });
  return <Animated.View style={style}>{children}</Animated.View>;
}

function PackageCard({
  pkg,
  onDetails,
  onAdd,
}: {
  pkg: StorePackage;
  onDetails: (pkg: StorePackage) => void;
  onAdd: (pkg: StorePackage) => void;
}) {
  const gameCount = pkg.packageGames?.length ?? 0;
  return (
    <View style={pkgCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            backgroundColor: 'rgba(20,184,166,0.14)',
            borderWidth: 1,
            borderColor: 'rgba(45,212,191,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="package" size={22} color="#2dd4bf" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#f8fafc',
              fontFamily: FONT.bold,
              fontSize: 15,
              textAlign: 'right',
            }}
          >
            {pkg.name}
          </Text>
          <Text
            style={{
              color: '#94a3b8',
              fontFamily: FONT.regular,
              fontSize: 12,
              textAlign: 'right',
              marginTop: 2,
            }}
          >
            تحتوي على {gameCount} لعبة مختارة
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 14 }}>
            {formatDinar(Number(pkg.price))}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Pressable
          onPress={() => onDetails(pkg)}
          android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: false }}
          style={{
            flex: 1,
            minHeight: 44,
            borderRadius: 11,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
          accessible
          accessibilityLabel={`عرض ألعاب الباقة ${pkg.name}`}
        >
          <Icon name="eye" size={16} color="#e2e8f0" />
          <Text style={{ color: '#f8fafc', fontFamily: FONT.bold, fontSize: 13.5 }}>
            عرض الألعاب
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onAdd(pkg)}
          android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: false }}
          style={{
            flex: 1,
            minHeight: 44,
            borderRadius: 11,
            backgroundColor: '#14b8a6',
            borderWidth: 1,
            borderColor: '#14b8a6',
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          accessible
          accessibilityLabel={`إضافة الباقة ${pkg.name} إلى السلة`}
        >
          <Icon name="plus" size={16} color="#ffffff" strokeWidth={2.3} />
          <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 13.5 }}>
            أضف إلى السلة
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
