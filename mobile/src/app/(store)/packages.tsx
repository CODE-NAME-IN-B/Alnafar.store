import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useScreenEntrance, useEntrance } from '@/components/ui/motion';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/StateView';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';
import type { StorePackage } from '@/api/types';

/** شاشة الباقات مع زر «عرض الألعاب» قبل الشراء — بالهوية والتصميم العصري الموحد */
export default function PackagesScreen() {
  const palette = usePalette();
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
            backgroundColor: palette.canvas,
            borderBottomWidth: 1,
            borderBottomColor: palette.surfaceLine,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            gap: 12,
          },
          entranceStyle,
        ]}
      >
        <View>
          <Text
            style={{
              color: palette.text,
              fontFamily: AR_FONT.bold,
              fontSize: 20,
              textAlign: 'right',
              writingDirection: 'rtl',
              includeFontPadding: false,
            }}
          >
            باقات الألعاب والتوفير
          </Text>
          <Text
            style={{
              color: palette.textSub,
              fontFamily: AR_FONT.regular,
              fontSize: 12.5,
              marginTop: 3,
              textAlign: 'right',
              writingDirection: 'rtl',
              includeFontPadding: false,
            }}
          >
            باقات مختارة — عاين جميع الألعاب داخل الباقة قبل إضافتها للسلة
          </Text>
        </View>

        {categories.data && categories.data.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: ROW, gap: 8 }}
          >
            {categories.data.map((cat) => (
              <Chip
                key={String(cat.id)}
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
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 32 }}
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

/** بطاقة باقة بدخول متدرج */
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
  const palette = usePalette();
  const gameCount = pkg.packageGames?.length ?? 0;

  return (
    <View
      style={[
        styles.pkgCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.surfaceLine,
        },
      ]}
    >
      <View style={{ flexDirection: ROW, alignItems: 'center', gap: 12 }}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: palette.surfaceRaised,
              borderColor: palette.surfaceLine,
            },
          ]}
        >
          <Icon name="package" size={22} color={palette.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: palette.text,
              fontFamily: AR_FONT.bold,
              fontSize: 15,
              textAlign: 'right',
              writingDirection: 'rtl',
              includeFontPadding: false,
            }}
          >
            {pkg.name}
          </Text>
          <Text
            style={{
              color: palette.textSub,
              fontFamily: AR_FONT.regular,
              fontSize: 12,
              textAlign: 'right',
              writingDirection: 'rtl',
              marginTop: 2,
              includeFontPadding: false,
            }}
          >
            تحتوي على {gameCount} لعبة مختارة
          </Text>
        </View>
        <View
          style={[
            styles.priceBadge,
            {
              backgroundColor: palette.surfaceRaised,
              borderColor: palette.surfaceLine,
            },
          ]}
        >
          <Text
            style={{
              color: palette.money,
              fontFamily: AR_FONT.bold,
              fontSize: 14,
            }}
          >
            {formatDinar(Number(pkg.price))}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: ROW, gap: 10, marginTop: 14 }}>
        <Pressable
          onPress={() => onDetails(pkg)}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: pressed ? palette.surfaceLine : palette.surfaceRaised,
              borderColor: palette.surfaceLine,
            },
          ]}
          accessible
          accessibilityLabel={`عرض ألعاب الباقة ${pkg.name}`}
        >
          <Icon name="eye" size={16} color={palette.text} />
          <Text style={{ color: palette.text, fontFamily: AR_FONT.bold, fontSize: 13 }}>
            عرض الألعاب
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onAdd(pkg)}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: pressed ? palette.primaryPressed : palette.primary,
              borderColor: palette.primary,
            },
          ]}
          accessible
          accessibilityLabel={`إضافة الباقة ${pkg.name} إلى السلة`}
        >
          <Icon name="plus" size={16} color={palette.onPrimary} strokeWidth={2.3} />
          <Text style={{ color: palette.onPrimary, fontFamily: AR_FONT.bold, fontSize: 13 }}>
            أضف إلى السلة
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pkgCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginVertical: 6,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
});
