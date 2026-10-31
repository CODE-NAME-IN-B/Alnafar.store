import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/api/categories';
import { fetchActivePackages } from '@/api/packages';
import { useAppStore } from '@/stores/app';
import { addPackageToCart } from '@/features/cartActions';
import PackageDetailsSheet from '@/components/store/PackageDetailsSheet';
import Chip from '@/components/ui/Chip';
import AppText from '@/components/ui/AppText';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/StateView';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';
import type { StorePackage } from '@/api/types';

/** شاشة الباقات مع زر «عرض الألعاب» قبل الشراء */
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

  const packages = useQuery({
    queryKey: ['packages-active', activeCategoryId],
    queryFn: async () => {
      if (activeCategoryId == null) return [];
      return fetchActivePackages(activeCategoryId);
    },
    enabled: activeCategoryId != null,
  });

  // فئة أول افتراضية للمستخدم الجديد
  useEffect(() => {
    if (activeCategoryId == null && categories.data && categories.data.length) {
      setActiveCategory(categories.data[0].id);
    }
  }, [activeCategoryId, categories.data, setActiveCategory]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f1724' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <AppText style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 20 }}>
          الباقات
        </AppText>
        <AppText
          style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 13, marginTop: 4 }}
        >
          باقات اقتصادية — تستطيع رؤية ألعابها بالتفصيل قبل الشراء
        </AppText>
      </View>

      {categories.data && categories.data.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {categories.data.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.name}
              active={activeCategoryId === cat.id}
              onPress={() => setActiveCategory(cat.id)}
              accent="#8a5cff"
            />
          ))}
        </ScrollView>
      ) : null}

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
          renderItem={({ item }) => (
            <PackageCard pkg={item} onDetails={setDetails} onAdd={addPack} />
          )}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 6 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState message="لا باقات نشطة لهذه الفئة حالياً" icon="📦" />
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
    </View>
  );
}

const pkgCard = {
  backgroundColor: '#141e30',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  padding: 16,
  marginVertical: 6,
} as const;

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            backgroundColor: 'rgba(138,92,255,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 22 }}>📦</Text>
        </View>
        <View style={{ flex: 1 }}>
          {/* اسم الباقة */}
          <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 16 }}>
            {pkg.name}
          </Text>
          {/* وصف الباقة */}
          <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 12 }}>
            {gameCount} لعبة داخل الباقة
          </Text>
        </View>
        {/* سعر الباقة */}
        <Text style={{ color: '#a78bfa', fontFamily: FONT.bold, fontSize: 17 }}>
          {formatDinar(Number(pkg.price))}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Pressable
          onPress={() => onDetails(pkg)}
          style={{
            flex: 1,
            borderRadius: 10,
            backgroundColor: '#1b2740',
            paddingVertical: 11,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
          accessible
          accessibilityLabel={`عرض ألعاب الباقة ${pkg.name}`}
        >
          <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold }}>عرض الألعاب</Text>
        </Pressable>
        <Pressable
          onPress={() => onAdd(pkg)}
          style={{
            flex: 1,
            borderRadius: 10,
            backgroundColor: '#14b8a6',
            paddingVertical: 11,
            alignItems: 'center',
          }}
          accessible
          accessibilityLabel={`إضافة الباقة ${pkg.name} إلى السلة`}
        >
          <Text style={{ color: '#062b27', fontFamily: FONT.bold }}>أضف إلى السلة</Text>
        </Pressable>
      </View>
    </View>
  );
}
