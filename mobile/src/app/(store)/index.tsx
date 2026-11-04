import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import { ENGLISH_LETTERS } from '@/lib/arabic';
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
import GuestBell from '@/components/store/GuestBell';
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
import { useScreenEntrance, ScalePressable } from '@/components/ui/motion';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { FONT } from '@/lib/fonts';
import { colors, triggerLightHaptic } from '@/lib/colors';
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
  /* U4: وضع القائمة المضغوطة للكاشير — 7-8 ألعاب في الشاشة الواحدة */
  const [cashierCompact, setCashierCompact] = useState(false);
  const compactMode = Boolean(token) && cashierCompact;

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

  /** تبديل حرف سريع من الشريط — ضغطة على الحرف تفعّله وضغطته الثانية تُلغيه */
  const toggleLetter = (ltr: string) => {
    triggerLightHaptic();
    setFilters((f) => ({ ...f, letter: f.letter === ltr ? null : ltr }));
  };

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
  const listRef = useRef<FlatList<Game> | null>(null);
  const entranceStyle = useScreenEntrance({ durationMs: 260, dy: 14 });

  /* الحياة في الفلاتر: أي تغيير تصنيف/بحث يُرجع القائمة لأولها
     وإلا تبدو «الكل» كأنها لا تفعل شيئاً (أبقت المستخدم في منتصف القائمة) */
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [activeCategoryId, filters, query, compactMode]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Compact Sticky Header */}
      <View style={styles.header}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image source={LOGO} style={styles.brandLogo} />
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle} numberOfLines={1}>
                الشاردة ستور
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: healthy ? colors.success : colors.warningText },
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
            <ScalePressable
              onPress={() => setTrackOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="تتبع الطلب بمسح QR"
              hitSlop={6}
              style={styles.headerActionBtn}
            >
              <Icon name="qr" size={17} color={colors.dim} />
            </ScalePressable>

            <ScalePressable
              onPress={() => setServicesOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="الخدمات الإضافية"
              hitSlop={6}
              style={styles.headerActionBtn}
            >
              <Icon name="sparkles" size={17} color={colors.dim} />
            </ScalePressable>

            {token ? (
              <>
                <ScalePressable
                  onPress={() => router.push('/(admin)')}
                  accessibilityRole="button"
                  accessibilityLabel="لوحة الإدارة"
                  hitSlop={6}
                  style={styles.headerActionBtn}
                >
                  <Icon name="settings" size={17} color={colors.dim} />
                </ScalePressable>
                <ScalePressable
                  onPress={async () => {
                    await logout();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="تسجيل الخروج"
                  hitSlop={6}
                  style={[styles.headerActionBtn, styles.headerActionDanger]}
                >
                  <Icon name="logout" size={16} color={colors.dangerText} />
                </ScalePressable>
              </>
            ) : (
              <>
                <GuestBell style={styles.headerActionBtn} />
                <ScalePressable
                  onPress={() => router.push('/login')}
                  accessibilityRole="button"
                  accessibilityLabel="تسجيل الدخول"
                  hitSlop={6}
                  style={styles.headerActionBtn}
                >
                  <Icon name="user" size={17} color={colors.dim} />
                </ScalePressable>
              </>
            )}
          </View>
        </View>

        {/* Search + Filter Row */}
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={colors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن لعبة أو سلسلة..."
            placeholderTextColor={colors.faint}
            textAlign="right"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                setQuery('');
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="مسح البحث"
            >
              <Icon name="close" size={22} color={colors.faint} />
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
              color={activeFilterCount > 0 ? colors.brandDark : colors.dim}
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

        {/* شريط الأحرف السريع — خارج زر «فلترة»: بضغطة واحدة على حرف تُصفّى
            القائمة فوراً (أ بـLatin); والضغط على الحرف المفعّل يُلغيه */}
        <View style={styles.letterStripRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.letterStripScroll}
          >
            {ENGLISH_LETTERS.map((ltr) => {
              const active = filters.letter === ltr;
              return (
                <Pressable
                  key={ltr}
                  onPress={() => toggleLetter(ltr)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`تصفية الألعاب التي تبدأ بـ ${ltr}`}
                  accessibilityState={{ selected: active }}
                  style={[styles.letterPill, active && styles.letterPillOn]}
                >
                  <Text style={[styles.letterPillText, active && styles.letterPillTextOn]}>
                    {ltr}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          <Chip
            label="الكل"
            active={activeCategoryId === null}
            onPress={() => setActiveCategory(null)}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
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
        <Animated.View style={{ flex: 1, ...entranceStyle }}>
        <FlatList
          ref={listRef}
          data={filtered}
          // إعادة بناء صفوف القائمة عند التبديل بين الشبكة والمضغوطة (U4)
          key={compactMode ? 'compact-list' : 'grid'}
          keyExtractor={(g) => String(g.id)}
          numColumns={compactMode ? 1 : 2}
          columnWrapperStyle={compactMode ? undefined : styles.gridRow}
          contentContainerStyle={compactMode ? styles.listCompact : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={gamesQ.isFetching}
              onRefresh={() => {
                gamesQ.refetch();
                topQ.refetch();
                branchesQ.refetch();
              }}
              tintColor={colors.faint}
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

              {/* رأس قسم الألعاب: العدّاد + مفتاح الشبكة/القائمة المضغوطة للكاشير (U4)
                  ملاحظة: فلتر الأحرف A-Z انتقل إلى نافذة الفلترة (قرار معتمد) */}
              <View style={styles.gamesHeadRow}>
                <View style={styles.gamesHeadTitle}>
                  <Icon name="gamepad" size={15} color={colors.faint} />
                  <Text style={styles.gamesHeadText}>الألعاب</Text>
                  <Text style={styles.gamesHeadCount}>{filtered.length}</Text>
                </View>
                {Boolean(token) ? (
                  <View style={styles.viewToggle}>
                    <Pressable
                      onPress={() => setCashierCompact(false)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: !cashierCompact }}
                      style={[styles.viewToggleBtn, !cashierCompact && styles.viewToggleOn]}
                    >
                      <Icon
                        name="grid"
                        size={13}
                        color={!cashierCompact ? colors.brandDark : colors.faint}
                      />
                      <Text
                        style={[
                          styles.viewToggleText,
                          !cashierCompact && styles.viewToggleTextOn,
                        ]}
                      >
                        شبكة
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setCashierCompact(true)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: cashierCompact }}
                      style={[styles.viewToggleBtn, cashierCompact && styles.viewToggleOn]}
                    >
                      <Icon
                        name="list"
                        size={13}
                        color={cashierCompact ? colors.brandDark : colors.faint}
                      />
                      <Text
                        style={[
                          styles.viewToggleText,
                          cashierCompact && styles.viewToggleTextOn,
                        ]}
                      >
                        مضغوطة
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              message="لا توجد ألعاب مطابقة — جرّب تغيير البحث أو فلترة النافذة"
              icon="gamepad"
            />
          }
          renderItem={({ item }) => (
            <View style={compactMode ? styles.compactCell : styles.cardCell}>
              <GameCard
                game={item}
                categories={categories}
                onPress={handlePressGame}
                compact={compactMode}
              />
            </View>
          )}
        />
        </Animated.View>
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
    backgroundColor: colors.deep,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.deep,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
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
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  brandTextCol: {
    alignItems: 'flex-end',
  },
  brandTitle: {
    fontFamily: FONT.bold,
    color: colors.text,
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
    color: colors.faint,
    fontSize: 12,
    includeFontPadding: false,
  },
  actionsRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevatedRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  headerActionDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSoft,
  },
  searchBar: {
    flexDirection: ROW,
    alignItems: 'center',
    backgroundColor: colors.elevatedRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT.medium,
    color: colors.text,
    fontSize: 13,
    paddingVertical: 6,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  filterBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterBtnActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brandBorder,
  },
  filterBtnText: {
    fontFamily: FONT.bold,
    color: colors.dim,
    fontSize: 11,
    includeFontPadding: false,
  },
  filterBtnTextActive: {
    color: colors.brandDark,
  },
  letterStripRow: {
    marginTop: 10,
  },
  letterStripScroll: {
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 2,
  },
  letterPill: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  letterPillOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brandBorder,
  },
  letterPillText: {
    color: colors.dim,
    fontFamily: FONT.bold,
    fontSize: 12.5,
    includeFontPadding: false,
  },
  letterPillTextOn: {
    color: colors.brandDark,
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
  gamesHeadRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
    marginBottom: 10,
  },
  gamesHeadTitle: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  gamesHeadText: {
    fontFamily: FONT.bold,
    color: colors.text,
    fontSize: 13,
    includeFontPadding: false,
  },
  gamesHeadCount: {
    fontFamily: FONT.bold,
    color: colors.dim,
    fontSize: 11,
    includeFontPadding: false,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  viewToggle: {
    flexDirection: ROW,
    alignItems: 'center',
    backgroundColor: colors.elevatedRaised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 2,
    gap: 2,
  },
  viewToggleBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 40,
    borderRadius: 8,
  },
  viewToggleOn: {
    backgroundColor: colors.brand,
  },
  viewToggleText: {
    fontFamily: FONT.bold,
    color: colors.faint,
    fontSize: 11,
    includeFontPadding: false,
  },
  viewToggleTextOn: {
    color: colors.brandDark,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  cardCell: {
    flex: 1,
    maxWidth: '50%',
  },
  compactCell: {
    width: '100%',
    marginBottom: 8,
  },
  listCompact: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 28,
  },
});
