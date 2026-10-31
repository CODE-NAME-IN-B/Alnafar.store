import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { fetchGames } from '@/api/games';
import { fetchCategories, fetchGenres, fetchSeries } from '@/api/categories';
import { fetchBranches } from '@/api/branches';
import { fetchHealth } from '@/api/settings';
import { fetchPublicTopGames } from '@/api/stats';
import { Game } from '@/api/types';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { addGameToCart } from '@/features/cartActions';
import { isPs4Game, mainPriceOf, ps5PriceOf } from '@/lib/gamePrices';
import { showToast } from '@/lib/toast';
import GameCard from '@/components/GameCard';
import VersionPickerModal from '@/components/store/VersionPickerModal';
import TopList from '@/components/store/TopList';
import HeroSection from '@/components/store/HeroSection';
import FilterSheet, {
  EMPTY_FILTERS,
  StoreFilters,
  applyFilters,
  countActiveFilters,
} from '@/components/store/FilterSheet';
import ServicesSheet from '@/components/store/ServicesSheet';
import QrScannerModal from '@/components/track/QrScannerModal';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { ENGLISH_LETTERS } from '@/lib/arabic';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

const LOGO = require('../../../assets/_brand/logo.png');

export default function StoreHomeScreen() {
  const selectedBranchId = useAppStore((s) => s.selectedBranchId);
  const selectBranch = useAppStore((s) => s.selectBranch);
  const activeCategoryId = useAppStore((s) => s.activeCategoryId);
  const setActiveCategory = useAppStore((s) => s.setActiveCategory);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<StoreFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [pickingGame, setPickingGame] = useState<Game | null>(null);

  const gamesQ = useQuery({
    queryKey: ['games', 'all'],
    queryFn: () => fetchGames({ limit: 1000 }),
  });
  const categoriesQ = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(true),
  });
  const branchesQ = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
  });
  const topQ = useQuery({
    queryKey: ['public-top-games'],
    queryFn: fetchPublicTopGames,
  });
  const genresQ = useQuery({
    queryKey: ['games-genres'],
    queryFn: fetchGenres,
  });
  const seriesQ = useQuery({
    queryKey: ['games-series'],
    queryFn: fetchSeries,
  });
  const healthQ = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 60_000,
  });

  const games = useMemo(() => gamesQ.data ?? [], [gamesQ.data]);
  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);
  const branches = useMemo(() => branchesQ.data ?? [], [branchesQ.data]);

  const filtered = useMemo(
    () => applyFilters(games, filters, activeCategoryId, query),
    [games, filters, activeCategoryId, query]
  );

  const handlePressGame = (game: Game) => {
    if (isPs4Game(game, categories)) {
      setPickingGame(game);
    } else {
      addGameToCart(game, 'PS5', mainPriceOf(game));
      showToast(`أضيفت: ${game.title}`);
    }
  };

  const activeFilterCount = countActiveFilters(filters);
  const healthy = Boolean(healthQ.data?.ok);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Compact Sticky Header */}
      <View style={styles.header}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image source={LOGO} style={styles.brandLogo} />
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle} numberOfLines={1}>
                الشارده ستور
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: healthy ? '#22c55e' : '#eab308' },
                  ]}
                />
                <Text style={styles.statusText} numberOfLines={1}>
                  {token && user
                    ? `كاشير: ${user.username}`
                    : healthy
                    ? 'متصل بالخادم'
                    : 'جاري الاتصال...'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setTrackOpen(true)}
              style={styles.actionPill}
            >
              <Icon name="qr" size={14} color="#2dd4bf" />
              <Text style={styles.actionPillText}>تتبع</Text>
            </Pressable>

            <Pressable
              onPress={() => setServicesOpen(true)}
              style={[styles.actionPill, styles.actionPillPurple]}
            >
              <Icon name="sparkles" size={14} color="#c4b5fd" />
              <Text style={styles.actionPillTextPurple}>الخدمات</Text>
            </Pressable>

            {token ? (
              <>
                <Pressable
                  onPress={() => router.push('/(admin)')}
                  style={[styles.actionPill, styles.actionPillTeal]}
                >
                  <Icon name="settings" size={14} color="#2dd4bf" />
                  <Text style={styles.actionPillText}>الإدارة</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    await logout();
                  }}
                  style={styles.logoutIconBtn}
                >
                  <Icon name="logout" size={15} color="#fda4af" />
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => router.push('/login')}
                style={[styles.actionPill, styles.actionPillTeal]}
              >
                <Icon name="user" size={14} color="#2dd4bf" />
                <Text style={styles.actionPillText}>دخول</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Search + Filter Row */}
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#64748b" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن لعبة أو سلسلة..."
            placeholderTextColor="#64748b"
            textAlign="right"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close" size={16} color="#94a3b8" />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setFilterOpen(true)}
            style={[
              styles.filterBtn,
              activeFilterCount > 0 && styles.filterBtnActive,
            ]}
          >
            <Icon
              name="filter"
              size={14}
              color={activeFilterCount > 0 ? '#042f2e' : '#e2e8f0'}
            />
            <Text
              style={[
                styles.filterBtnText,
                activeFilterCount > 0 && styles.filterBtnTextActive,
              ]}
            >
              {activeFilterCount > 0 ? `فلترة (${activeFilterCount})` : 'فلترة'}
            </Text>
          </Pressable>
        </View>

        {/* Category Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          <Chip
            label="الكل"
            accent="purple"
            active={activeCategoryId === null}
            onPress={() => setActiveCategory(null)}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              accent="purple"
              active={activeCategoryId === c.id}
              onPress={() =>
                setActiveCategory(activeCategoryId === c.id ? null : c.id)
              }
            />
          ))}
        </ScrollView>
      </View>

      {gamesQ.isLoading ? (
        <LoadingState message="جاري تحميل الألعاب..." />
      ) : gamesQ.isError ? (
        <ErrorState
          message="تعذر تحميل قائمة الألعاب"
          onRetry={() => gamesQ.refetch()}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(g) => String(g.id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={gamesQ.isFetching}
              onRefresh={() => {
                gamesQ.refetch();
                topQ.refetch();
                branchesQ.refetch();
              }}
              tintColor="#14b8a6"
            />
          }
          ListHeaderComponent={
            <View>
              {/* Hero Promotional Banner & Branches/Cashier Section */}
              <HeroSection
                branches={branches}
                selectedBranchId={selectedBranchId}
                onSelectBranch={(id) => selectBranch(id)}
                isCashier={Boolean(token)}
                onOpenAdmin={() => router.push('/(admin)')}
              />

              {/* Top 10 Games */}
              {!query && activeFilterCount === 0 && activeCategoryId === null ? (
                <TopList
                  items={topQ.data ?? []}
                  onSelect={(topItem) => {
                    const found = games.find((g) => g.id === topItem.id) ?? {
                      id: topItem.id,
                      title: topItem.title,
                      image: topItem.image,
                      price: topItem.price,
                      price_ps5: topItem.price_ps5,
                      category_id: topItem.category_id,
                      size_gb: topItem.size_gb,
                    };
                    handlePressGame(found);
                  }}
                />
              ) : null}

              {/* English Alphabetical Index Bar (# A B C ... Z) */}
              <View style={styles.alphaBarWrap}>
                <View style={styles.alphaHeadRow}>
                  <View style={styles.alphaTitleRow}>
                    <Icon name="gamepad" size={15} color="#2dd4bf" />
                    <Text style={styles.alphaTitle}>
                      قائمة الألعاب (مرتبة أبجدياً A – Z)
                    </Text>
                  </View>
                  <Text style={styles.alphaCount}>{filtered.length} لعبة</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.alphaScroll}
                >
                  <Pressable
                    onPress={() => setFilters((f) => ({ ...f, letter: null }))}
                    style={[
                      styles.letterPill,
                      filters.letter === null && styles.letterPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.letterPillText,
                        filters.letter === null && styles.letterPillTextActive,
                      ]}
                    >
                      الكل
                    </Text>
                  </Pressable>
                  {ENGLISH_LETTERS.map((ltr) => {
                    const active = filters.letter === ltr;
                    return (
                      <Pressable
                        key={ltr}
                        onPress={() =>
                          setFilters((f) => ({
                            ...f,
                            letter: active ? null : ltr,
                          }))
                        }
                        style={[
                          styles.letterPill,
                          active && styles.letterPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.letterPillText,
                            active && styles.letterPillTextActive,
                          ]}
                        >
                          {ltr}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              message="لا توجد ألعاب مطابقة — جرّب تغيير البحث أو اختيار حرف آخر"
              icon="gamepad"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardCell}>
              <GameCard
                game={item}
                categories={categories}
                onPress={handlePressGame}
              />
            </View>
          )}
        />
      )}

      <VersionPickerModal
        visible={Boolean(pickingGame)}
        game={pickingGame}
        onClose={() => setPickingGame(null)}
        onPick={(platform) => {
          if (!pickingGame) return;
          const unitPrice =
            platform === 'PS5' ? ps5PriceOf(pickingGame) : mainPriceOf(pickingGame);
          addGameToCart(pickingGame, platform, unitPrice);
          showToast(`أضيفت: ${pickingGame.title}`);
          setPickingGame(null);
        }}
      />

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        games={games}
        filters={filters}
        onChange={setFilters}
        extraGenres={genresQ.data ?? []}
        extraSeries={seriesQ.data ?? []}
      />

      <ServicesSheet
        visible={servicesOpen}
        onClose={() => setServicesOpen(false)}
      />

      <QrScannerModal
        visible={trackOpen}
        onClose={() => setTrackOpen(false)}
        onResolved={(orderId) => {
          setTrackOpen(false);
          router.push(`/track/${encodeURIComponent(orderId)}`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#090f1d',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#090f1d',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 10,
  },
  topBar: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 9,
    flexShrink: 1,
  },
  brandLogo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#14b8a6',
  },
  brandTextCol: {
    alignItems: 'flex-end',
  },
  brandTitle: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 15,
    includeFontPadding: false,
  },
  statusRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: FONT.medium,
    color: '#94a3b8',
    fontSize: 10,
    includeFontPadding: false,
  },
  actionsRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
  },
  actionPill: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#131d31',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  actionPillPurple: {
    borderColor: 'rgba(139, 92, 246, 0.45)',
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
  },
  actionPillTeal: {
    borderColor: 'rgba(20, 184, 166, 0.45)',
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
  },
  actionPillText: {
    fontFamily: FONT.bold,
    color: '#5eead4',
    fontSize: 11,
    includeFontPadding: false,
  },
  actionPillTextPurple: {
    fontFamily: FONT.bold,
    color: '#ddd6fe',
    fontSize: 11,
    includeFontPadding: false,
  },
  logoutIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#2a1215',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: ROW,
    alignItems: 'center',
    backgroundColor: '#131d31',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT.medium,
    color: '#f8fafc',
    fontSize: 13,
    paddingVertical: 6,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  filterBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterBtnActive: {
    backgroundColor: '#14b8a6',
    borderColor: '#2dd4bf',
  },
  filterBtnText: {
    fontFamily: FONT.bold,
    color: '#e2e8f0',
    fontSize: 11,
    includeFontPadding: false,
  },
  filterBtnTextActive: {
    color: '#042f2e',
  },
  catScroll: {
    flexDirection: ROW,
    gap: 8,
    paddingVertical: 2,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 28,
  },
  alphaBarWrap: {
    backgroundColor: '#0e1729',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  alphaHeadRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alphaTitleRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
  },
  alphaTitle: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 13,
    includeFontPadding: false,
  },
  alphaCount: {
    fontFamily: FONT.semibold,
    color: '#2dd4bf',
    fontSize: 11,
    includeFontPadding: false,
  },
  alphaScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  letterPill: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#131d31',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterPillActive: {
    backgroundColor: '#14b8a6',
    borderColor: '#2dd4bf',
  },
  letterPillText: {
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    fontSize: 12,
    includeFontPadding: false,
  },
  letterPillTextActive: {
    color: '#042f2e',
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  cardCell: {
    flex: 1,
    maxWidth: '50%',
  },
});
