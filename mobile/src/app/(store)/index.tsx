import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { fetchGames } from '@/api/games';
import { fetchCategories, fetchGenres, fetchSeries } from '@/api/categories';
import { healthCheck } from '@/api/auth';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { isPs4Game, mainPriceOf, ps5PriceOf } from '@/lib/gamePrices';
import { addGameToCart } from '@/features/cartActions';
import GameCard from '@/components/GameCard';
import TopList from '@/components/store/TopList';
import ServicesSheet from '@/components/store/ServicesSheet';
import VersionPickerModal from '@/components/store/VersionPickerModal';
import FilterSheet, {
  EMPTY_FILTERS,
  applyFilters,
  type Filters,
} from '@/components/store/FilterSheet';
import QrScannerModal from '@/components/track/QrScannerModal';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/StateView';
import Chip from '@/components/ui/Chip';
import { FONT } from '@/lib/fonts';
import { showToast } from '@/lib/toast';
import type { Game } from '@/api/types';

const header = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 14,
  paddingTop: 10,
  paddingBottom: 8,
} as const;

const searchBox = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#10203a',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  paddingHorizontal: 12,
} as const;

const actionBtn = {
  backgroundColor: '#141e30',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  paddingHorizontal: 10,
  paddingVertical: 6,
} as const;

/** شاشة المتجر: رأس + شريط الأكثر طلباً + فئات + بحث + فلاتر + شبكة ألعاب */
export default function StoreHome() {
  const activeCategoryId = useAppStore((s) => s.activeCategoryId);
  const setActiveCategory = useAppStore((s) => s.setActiveCategory);
  const clearBranch = useAppStore((s) => s.clearBranch);
  const token = useAuthStore((s) => s.token);
  const editingInvoice = useCartStore((s) => s.editingInvoice);
  const cancelEditingInvoice = useCartStore((s) => s.cancelEditingInvoice);

  const [queryInput, setQueryInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [pickerGame, setPickerGame] = useState<Game | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQ(queryInput.trim()), 450);
    return () => clearTimeout(timer);
  }, [queryInput]);

  const games = useQuery({
    queryKey: ['games', { q: searchQ, category: activeCategoryId }],
    queryFn: () => fetchGames({ q: searchQ || undefined, category: activeCategoryId }),
  });

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(true),
  });
  const genres = useQuery({ queryKey: ['genres'], queryFn: fetchGenres });
  const seriesList = useQuery({ queryKey: ['series'], queryFn: fetchSeries });
  const health = useQuery({
    queryKey: ['health'],
    queryFn: healthCheck,
    staleTime: 5 * 60_000,
  });

  const visible = useMemo(() => {
    if (!games.data) return [];
    return applyFilters(games.data, filters, searchQ);
  }, [games.data, filters, searchQ]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleOpenGame = (game: Game) => {
    const cats = categories.data ?? [];
    if (isPs4Game(game, cats)) {
      setPickerGame(game);
    } else {
      addGameToCart(game, 'PS5', mainPriceOf(game));
      showToast('أضيفت اللعبة للسلة');
    }
  };

  const onPickVersion = (platform: 'PS4' | 'PS5') => {
    const game = pickerGame;
    setPickerGame(null);
    if (!game) return;
    const price = platform === 'PS4' ? Number(game.price) : ps5PriceOf(game);
    addGameToCart(game, platform, price);
    showToast('أضيفت اللعبة للسلة');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f1724' }}>
      {/* رأس الشاشة */}
      <View style={header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Image
            source={require('../../../assets/_brand/logo.png')}
            style={{ width: 38, height: 38, borderRadius: 10 }}
            contentFit="contain"
            accessibilityLabel="شعار النفار"
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 16 }}>
              الشارده ستور
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: health.data?.ok ? '#22c55e' : '#64748b',
                }}
              />
              <Text style={{ color: '#64748b', fontFamily: FONT.regular, fontSize: 11 }}>
                {health.data?.ok ? 'الخدمة متصلة' : 'جاري الاتصال...'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable onPress={() => setQrOpen(true)} style={actionBtn} accessibilityLabel="تتبع طلب">
            <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 12 }}>تتبع / QR</Text>
          </Pressable>
          <Pressable onPress={() => setServicesOpen(true)} style={actionBtn} accessibilityLabel="الخدمات">
            <Text style={{ color: '#a78bfa', fontFamily: FONT.bold, fontSize: 12 }}>الخدمات</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(token ? '/(admin)' : '/login')}
            style={actionBtn}
            accessibilityLabel={token ? 'لوحة الإدارة' : 'دخول العاملين'}
          >
            <Text style={{ color: '#f1f5f9', fontFamily: FONT.medium, fontSize: 12 }}>
              {token ? 'الإدارة' : 'دخول'}
            </Text>
          </Pressable>
          <Pressable onPress={clearBranch} style={actionBtn} accessibilityLabel="تغيير الفرع">
            <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 11 }}>الفرع</Text>
          </Pressable>
        </View>
      </View>

      {/* شريط تعديل فاتورة قائمة للموظف */}
      {editingInvoice ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(138,92,255,0.18)',
            borderColor: 'rgba(138,92,255,0.4)',
            borderWidth: 1,
            marginHorizontal: 14,
            marginBottom: 6,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#e9d5ff', fontFamily: FONT.bold, fontSize: 12 }}>
            وضع تعديل الفاتورة #{editingInvoice.invoice_number}
          </Text>
          <Pressable onPress={cancelEditingInvoice}>
            <Text style={{ color: '#fca5a5', fontFamily: FONT.bold, fontSize: 12 }}>إلغاء</Text>
          </Pressable>
        </View>
      ) : null}

      {/* بحث + زر فلاتر + فئات */}
      <View style={{ paddingHorizontal: 14, gap: 8 }}>
        <View style={searchBox}>
          <TextInput
            value={queryInput}
            onChangeText={setQueryInput}
            placeholder="ابحث عن لعبة..."
            placeholderTextColor="#64748b"
            textAlign="right"
            style={{ flex: 1, color: '#f1f5f9', fontFamily: FONT.regular, paddingVertical: 8 }}
          />
          {queryInput ? (
            <Pressable onPress={() => setQueryInput('')} accessibilityLabel="مسح البحث">
              <Text style={{ color: '#64748b', paddingHorizontal: 8 }}>✕</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setFilterSheetOpen(true)}
            accessibilityLabel="فتح الفلاتر"
            style={{
              backgroundColor: activeFilterCount ? '#14b8a6' : '#1b2740',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginStart: 8,
            }}
          >
            <Text
              style={{
                color: activeFilterCount ? '#062b27' : '#94a3b8',
                fontFamily: FONT.bold,
                fontSize: 13,
              }}
            >
              فلترة{activeFilterCount ? ` ${activeFilterCount}` : ''}
            </Text>
          </Pressable>
        </View>

        {categories.data && categories.data.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
          >
            <Chip
              label="الكل"
              active={!activeCategoryId}
              onPress={() => setActiveCategory(null)}
              accent="#8a5cff"
            />
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
      </View>

      {/* شبكة الألعاب */}
      {games.isLoading ? (
        <LoadingState message="جاري جلب الألعاب..." />
      ) : games.isError ? (
        <ErrorState
          message="تعذر جلب مكتبة الألعاب"
          hint="تحقق من الاتصال بالإنترنت ثم حاول"
          onRetry={() => games.refetch()}
        />
      ) : visible.length ? (
        <FlashList
          data={visible}
          numColumns={2}
          keyExtractor={(game) => String(game.id)}
          ListHeaderComponent={!searchQ && !activeFilterCount ? <TopList onSelectGame={handleOpenGame} /> : null}
          renderItem={({ item }) => (
            <GameCard game={item} categories={categories.data ?? []} onOpen={handleOpenGame} />
          )}
          contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            message="لا ألعاب مطابقة — جرّب فئة أخرى أو امسح الفلاتر"
            icon="🕹️"
            actionLabel={filters !== EMPTY_FILTERS ? 'مسح الفلاتر' : undefined}
            onAction={() => setFilters(EMPTY_FILTERS)}
          />
        </View>
      )}

      <VersionPickerModal
        visible={!!pickerGame}
        game={pickerGame}
        onClose={() => setPickerGame(null)}
        onPick={onPickVersion}
      />

      <FilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        value={filters}
        onChange={setFilters}
        genres={genres.data ?? []}
        seriesList={seriesList.data ?? []}
        games={games.data ?? []}
      />

      <ServicesSheet visible={servicesOpen} onClose={() => setServicesOpen(false)} />

      <QrScannerModal
        visible={qrOpen}
        onClose={() => setQrOpen(false)}
        onResolved={(orderId) => {
          setQrOpen(false);
          router.push(`/track/${encodeURIComponent(orderId)}`);
        }}
      />
    </View>
  );
}
