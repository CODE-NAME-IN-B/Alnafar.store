import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ScrollViewInstance } from 'react-native';
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
import { ENGLISH_LETTERS, sortGamesAlphabetically } from '@/lib/arabic';
import { fetchCategories, fetchGenres, fetchSeries } from '@/api/categories';
import { fetchBranches } from '@/api/branches';
import { fetchHealth } from '@/api/settings';
import { fetchPublicTopGames } from '@/api/stats';
import { Category, Game } from '@/api/types';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { addGameToCart } from '@/features/cartActions';
import { isPs4Game, mainPriceOf, ps5PriceOf } from '@/lib/gamePrices';
import { showToast } from '@/lib/toast';
import GuestBell from '@/components/store/GuestBell';
import VersionPickerModal from '@/components/store/VersionPickerModal';
import FilterSheet, {
  EMPTY_FILTERS,
  StoreFilters,
  applyFilters,
  countActiveFilters,
} from '@/components/store/FilterSheet';
import ServicesSheet from '@/components/store/ServicesSheet';
import QrScannerModal from '@/components/track/QrScannerModal';
import Icon from '@/components/ui/Icon';
import { useScreenEntrance, ScalePressable } from '@/components/ui/motion';
import { EmptyState, ErrorState } from '@/components/ui/StateView';
import { Animated } from 'react-native';
import { triggerLightHaptic } from '@/lib/colors';
import { ROW } from '@/lib/rtl';
import { usePalette, useThemeMode, useThemeName } from '@/design/theme';
import { AR_FONT, LAT_FONT } from '@/design/fonts';
import { EntryIn, SignalBeacon } from '@/design/motion-library';
import Skeleton from '@/design/Skeleton';
import GameCard from '@/design/GameCard';
import HeroCard from '@/design/HeroCard';
import PlatformChip from '@/design/PlatformChip';
import Chip from '@/components/ui/Chip';

/* الشعار: الكرمية بلا بلاقة على الداكن (تباين كامل)، وفي الفاتح أيضًا الكرمية بحرف حبري؟
   لا — على الكريمي نستخدم الشعار الكامل البلاقة. */
const LOGO_MARK = require('../../../assets/_brand/logo-mark.png');
const LOGO_FULL = require('../../../assets/_brand/logo.png');

export default function StoreHomeScreen() {
  const palette = usePalette();
  const setThemeMode = useThemeMode((s) => s.setMode);
  const themeName = useThemeName();
  const dark = themeName === 'dark';
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
  /* وضع عرض الكتالوج للكاشير: صفوف 72dp (III) أو شبكة أكبر */
  const [cashierGrid, setCashierGrid] = useState(false);

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

  const games = useMemo(() => sortGamesAlphabetically(gamesQ.data ?? []), [gamesQ.data]);
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
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const entranceStyle = useScreenEntrance({ durationMs: 260, dy: 14 });

  /* وضع الكتالوج (III): أي بحث/فلترة/تصنيف يحوّل الرئيسية إلى دفتر كتالوج
     بصفوف 72dp. الوضع الطبيعي = بطاقة البطل + رفوف التصنيفات (II). */
  const catalogMode = Boolean(query.trim()) || activeFilterCount > 0 || activeCategoryId !== null;

  /* الرفوف: كل تصنيف صفّه بأنقل عشرة مرتبة أبجدياً — والتخطي لإقسام فارغة */
  const shelves = useMemo(() => {
    if (catalogMode || !games.length) return [];
    return categories
      .map((c) => ({
        category: c,
        items: sortGamesAlphabetically(
          games.filter((g) => {
            const ids = Array.isArray(g.category_ids) ? g.category_ids : [];
            return g.category_id === c.id || ids.includes(c.id);
          })
        ).slice(0, 10),
      }))
      .filter((sh) => sh.items.length > 0);
  }, [categories, games, catalogMode]);

  /* إرجاع القائمة لأولها عند أي تغيير تصنيف/بحث/فلترة */
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [catalogMode, activeCategoryId, filters, query]);

  /* البطل: الأول من أكثر الطلبات — يُساوى بسجل لعبة كامل من القائمة */
  const heroTop = useMemo(() => {
    if (catalogMode) return null;
    const first = (topQ.data ?? [])[0];
    if (!first) return null;
    const found = games.find((g) => g.id === first.id);
    return found ? { game: found, orders: first.count, rank: 1 } : null;
  }, [topQ.data, games, catalogMode]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.canvas }]} edges={['top']}>
      {/* الترويسة الثابتة — كريمية على الفاتح بحرف forest، حبرية على الداكن */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: palette.canvas,
            borderBottomColor: palette.surfaceLine,
          },
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image source={dark ? LOGO_MARK : LOGO_FULL} style={styles.brandLogo} />
            <View style={styles.brandTextCol}>
              <Text style={[styles.brandTitle, { color: palette.text }]} numberOfLines={1}>
                الشاردة ستور
              </Text>
              <View style={styles.statusRow}>
                <SignalBeacon
                  size={7}
                  color={healthy ? palette.success : palette.warning}
                />
                <Text style={[styles.statusText, { color: palette.textFaint }]} numberOfLines={1}>
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
              style={[styles.headerActionBtn, { borderColor: palette.surfaceLine }]}
            >
              <Icon name="qr" size={17} color={palette.textSub} />
            </ScalePressable>

            <ScalePressable
              onPress={() => setServicesOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="الخدمات الإضافية"
              hitSlop={6}
              style={[styles.headerActionBtn, { borderColor: palette.surfaceLine }]}
            >
              <Icon name="sparkles" size={17} color={palette.textSub} />
            </ScalePressable>

            {/* زر التبديل السريع بين الوضع الفاتح والداكن */}
            <ScalePressable
              onPress={() => {
                triggerLightHaptic();
                const next = dark ? 'light' : 'dark';
                setThemeMode(next);
                showToast(next === 'light' ? 'تم تفعيل الوضع الفاتح (كريمي)' : 'تم تفعيل الوضع الداكن');
              }}
              accessibilityRole="button"
              accessibilityLabel={dark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
              hitSlop={6}
              style={[styles.headerActionBtn, { borderColor: palette.surfaceLine }]}
            >
              <Icon name={dark ? 'sun' : 'moon'} size={17} color={palette.textSub} />
            </ScalePressable>

            {token ? (
              <>
                <ScalePressable
                  onPress={() => router.push('/(admin)')}
                  accessibilityRole="button"
                  accessibilityLabel="لوحة الإدارة"
                  hitSlop={6}
                  style={[styles.headerActionBtn, { borderColor: palette.surfaceLine }]}
                >
                  <Icon name="settings" size={17} color={palette.textSub} />
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
                  <Icon name="logout" size={16} color={palette.danger} />
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
                  style={[styles.headerActionBtn, { borderColor: palette.surfaceLine }]}
                >
                  <Icon name="user" size={17} color={palette.textSub} />
                </ScalePressable>
              </>
            )}
          </View>
        </View>

        {/* البحث + الفلترة */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: palette.surfaceRaised,
              borderColor: palette.surfaceLine,
            },
          ]}
        >
          <Icon name="search" size={18} color={palette.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن لعبة أو سلسلة..."
            placeholderTextColor={palette.textFaint}
            textAlign="right"
            style={[styles.searchInput, { color: palette.text }]}
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
              <Icon name="close" size={20} color={palette.textFaint} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setFilterOpen(true)}
            style={[styles.filterBtn, activeFilterCount > 0 && { backgroundColor: palette.primary }]}
          >
            <Icon
              name="filter"
              size={14}
              color={activeFilterCount > 0 ? palette.onPrimary : palette.textSub}
            />
            <Text
              style={[
                styles.filterBtnText,
                {
                  color: activeFilterCount > 0 ? palette.onPrimary : palette.textSub,
                  fontFamily: AR_FONT.bold,
                },
              ]}
            >
              {activeFilterCount > 0 ? `فلترة (${activeFilterCount})` : 'فلترة'}
            </Text>
          </Pressable>
        </View>

        {/* شريط فئات الأجهزة والتصنيفات في الرئيسية */}
        {categories.length > 0 ? (
          <View style={styles.categoryStripRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryStripScroll}
            >
              <Chip
                label="الكل"
                active={activeCategoryId === null}
                onPress={() => {
                  triggerLightHaptic();
                  setActiveCategory(null);
                }}
              />
              {categories.map((cat) => (
                <Chip
                  key={String(cat.id)}
                  label={cat.name}
                  active={activeCategoryId === cat.id}
                  onPress={() => {
                    triggerLightHaptic();
                    setActiveCategory(activeCategoryId === cat.id ? null : cat.id);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* شريط الفهرس الأبجدي A–Z السريع للألعاب */}
        <View style={styles.alphaStripRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.alphaScroll}
          >
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                setFilters((f) => ({ ...f, letter: null }));
              }}
              style={[
                styles.letterBtn,
                {
                  backgroundColor: filters.letter === null ? palette.primary : palette.surfaceRaised,
                  borderColor: filters.letter === null ? palette.primary : palette.surfaceLine,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="عرض كل الألعاب بالحروف"
            >
              <Text
                style={[
                  styles.letterText,
                  {
                    color: filters.letter === null ? palette.onPrimary : palette.textSub,
                    fontFamily: AR_FONT.bold,
                  },
                ]}
              >
                A–Z
              </Text>
            </Pressable>
            {ENGLISH_LETTERS.map((ltr) => {
              const active = filters.letter === ltr;
              return (
                <Pressable
                  key={ltr}
                  onPress={() => toggleLetter(ltr)}
                  style={[
                    styles.letterBtn,
                    {
                      backgroundColor: active ? palette.primary : palette.surfaceRaised,
                      borderColor: active ? palette.primary : palette.surfaceLine,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`تصفية بحرف ${ltr}`}
                >
                  <Text
                    style={[
                      styles.letterText,
                      {
                        color: active ? palette.onPrimary : palette.textSub,
                        fontFamily: AR_FONT.bold,
                      },
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

      {gamesQ.isLoading ? (
        <LoadingSkeleton />
      ) : gamesQ.isError ? (
        <ErrorState
          message="تعذر تحميل قائمة الألعاب"
          onRetry={() => gamesQ.refetch()}
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={gamesQ.isFetching}
              onRefresh={() => {
                gamesQ.refetch();
                topQ.refetch();
                branchesQ.refetch();
              }}
              tintColor={palette.textFaint}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={entranceStyle}>
            {catalogMode ? (
              <CatalogView
                items={filtered}
                grid={Boolean(token) && cashierGrid}
                cashier={Boolean(token)}
                onCashierGrid={setCashierGrid}
                onOpenGame={handlePressGame}
                categories={categories}
                onAllGames={() => {
                  setFilters(EMPTY_FILTERS);
                  setQuery('');
                  setActiveCategory(null);
                }}
              />
            ) : (
              <>
                {/* بطاقة البطل — فتحة واحدة أعلى الصفحة (قرار §4.3) */}
                {heroTop ? (
                  <EntryIn index={0}>
                    <View style={styles.heroWrap}>
                      <HeroCard
                        game={heroTop.game}
                        orders={heroTop.orders}
                        rank={heroTop.rank}
                        platform={isPs4Game(heroTop.game, categories) ? 'PS4' : 'PS5'}
                        onPress={handlePressGame}
                      />
                    </View>
                  </EntryIn>
                ) : null}

                {/* اختيار الفرع — يظل وظيفتًا في بطاقة صغيرة أعلى الرفوف */}
                {branches.length > 0 && branches.length > 1 ? (
                  <EntryIn index={1}>
                    <View style={styles.branchRow}>
                      {branches.map((b) => (
                        <PlatformChip
                          key={b.id}
                          label={b.name}
                          active={selectedBranchId === b.id}
                          onPress={() => selectBranch(b.id)}
                          style={styles.branchChip}
                        />
                      ))}
                    </View>
                  </EntryIn>
                ) : null}

                {/* رفوف التصنيفات (قرار §4.3 — فكرة II) */}
                {shelves.length === 0 ? (
                  <EmptyState
                    message="لا توجد ألعاب في المتجر بعد"
                    icon="gamepad"
                  />
                ) : (
                  shelves.map((sh, i) => (
                    <EntryIn key={String(sh.category.id)} index={Math.min(i + 1, 8)}>
                      <View style={styles.shelf}>
                        <View style={styles.shelfHead}>
                          <Text style={[styles.shelfTitle, { color: palette.text }]} numberOfLines={1}>
                            {sh.category.name}
                          </Text>
                          <Text style={[styles.shelfCount, { color: palette.textFaint }]}>
                            {sh.items.length}+
                          </Text>
                          <Pressable
                            onPress={() => {
                              triggerLightHaptic();
                              setActiveCategory(sh.category.id);
                            }}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={`عرض كل ألعاب ${sh.category.name}`}
                            style={styles.shelfAll}
                          >
                            <Text style={[styles.shelfAllTxt, { color: palette.accent }]}>
                              عرض الكل
                            </Text>
                            <Icon name="chevron-left" size={13} color={palette.accent} />
                          </Pressable>
                        </View>
                        {/* FlatList مقلوبة: أول لعبة يبدأ من اليمين حرفيًا (نمط TopList المجرَّب) */}
                        <FlatList
                          data={sh.items}
                          keyExtractor={(g) => String(g.id)}
                          horizontal
                          inverted
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.shelfScroll}
                          ItemSeparatorComponent={() => <View style={styles.shelfSep} />}
                          renderItem={({ item: g }) => (
                            <View style={styles.shelfCard}>
                              <GameCard
                                game={g}
                                hasVersions={isPs4Game(g, categories)}
                                onPress={handlePressGame}
                              />
                            </View>
                          )}
                        />
                      </View>
                    </EntryIn>
                  ))
                )}
              </>
            )}
          </Animated.View>
        </ScrollView>
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

/* ============================================================
 * CatalogView — دفتر الكتالوج (فكرة III): صفوف 72dp بغلاف مصغّر
 * + اسم/منصة/حجم + زر السعر lime — للبحث والفلترة و«عرض الكل».
 * ============================================================ */
function CatalogView({
  items,
  grid,
  cashier,
  onCashierGrid,
  onOpenGame,
  categories,
  onAllGames,
}: {
  items: Game[];
  grid: boolean;
  cashier: boolean;
  onCashierGrid: (v: boolean) => void;
  onOpenGame: (g: Game) => void;
  categories: Category[];
  onAllGames: () => void;
}) {
  const palette = usePalette();
  return (
    <View style={styles.catalog}>
      <View style={styles.catalogHead}>
        <View style={styles.catalogTitleWrap}>
          <Icon name="gamepad" size={14} color={palette.textFaint} />
          <Text style={[styles.catalogTitle, { color: palette.text }]}>الألعاب</Text>
          <View style={[styles.catalogCount, { backgroundColor: palette.surfaceRaised }]}>
            <Text style={[styles.catalogCountTxt, { color: palette.textSub }]}>{items.length}</Text>
          </View>
          {cashier ? (
            <View style={styles.gridToggle}>
              <Pressable
                onPress={() => onCashierGrid(false)}
                accessibilityRole="button"
                accessibilityState={{ selected: !grid }}
                style={styles.gridToggleBtn}
              >
                <Text
                  style={[
                    styles.gridToggleTxt,
                    { color: !grid ? palette.primary : palette.textFaint, fontFamily: AR_FONT.bold },
                  ]}
                >
                  صفوف
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onCashierGrid(true)}
                accessibilityRole="button"
                accessibilityState={{ selected: grid }}
                style={styles.gridToggleBtn}
              >
                <Text
                  style={[
                    styles.gridToggleTxt,
                    { color: grid ? palette.primary : palette.textFaint, fontFamily: AR_FONT.bold },
                  ]}
                >
                  شبكة
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {items.length === 0 ? (
        <EmptyState
          message="لا توجد ألعاب مطابقة — جرّب تغيير البحث أو فلترة النافذة"
          icon="gamepad"
          actionLabel="رجوع لرفوف المتجر"
          onAction={onAllGames}
        />
      ) : grid ? (
        <View style={styles.gridWrap}>
          {items.map((g) => (
            <View key={String(g.id)} style={styles.gridCell}>
              <GameCard
                game={g}
                hasVersions={isPs4Game(g, categories)}
                onPress={onOpenGame}
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.rowsWrap}>
          {items.map((g) => (
            <View key={String(g.id)} style={styles.rowCell}>
              <GameCard
                compact
                game={g}
                hasVersions={isPs4Game(g, categories)}
                onPress={onOpenGame}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/* هيكل عظمي للتحميل الأول — ثلاثة رفوف ثم بطل */
function LoadingSkeleton() {
  return (
    <ScrollView contentContainerStyle={styles.skeletonWrap} showsVerticalScrollIndicator={false}>
      <Skeleton height={140} radius={20} />
      {Array.from({ length: 3 }).map((_, r) => (
        <View key={String(r)} style={styles.skeletonShelf}>
          <Skeleton width={120} height={16} />
          <View style={styles.skeletonRows}>
            {Array.from({ length: 2 }).map((__, c) => (
              <View key={String(c)} style={styles.skeletonRowPair}>
                <Skeleton height={64} radius={14} />
                <Skeleton height={64} radius={14} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
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
    /* علامة الشعار الكريمية — أكبر بلا إطار على الداكن (قرار الترويسة) */
    width: 46,
    height: 46,
  },
  brandTextCol: {
    alignItems: 'flex-end',
  },
  brandTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 15,
    includeFontPadding: false,
  },
  statusRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontFamily: AR_FONT.medium,
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
    borderWidth: 1,
  },
  headerActionDanger: {
    opacity: 0.9,
  },
  searchBar: {
    flexDirection: ROW,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: AR_FONT.medium,
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
  },
  filterBtnText: {
    fontSize: 11,
    includeFontPadding: false,
  },
  categoryStripRow: {
    marginTop: 6,
    marginBottom: 4,
  },
  categoryStripScroll: {
    flexDirection: ROW,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  alphaStripRow: {
    marginTop: 2,
    marginBottom: 4,
  },
  alphaScroll: {
    flexDirection: ROW,
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  letterBtn: {
    minWidth: 32,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 11.5,
    includeFontPadding: false,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 28,
  },
  heroWrap: {
    marginTop: 12,
  },
  branchRow: {
    flexDirection: ROW,
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  branchChip: {},
  shelf: {
    marginTop: 16,
  },
  shelfHead: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  shelfTitle: {
    flexShrink: 1,
    fontFamily: AR_FONT.bold,
    fontSize: 16,
    lineHeight: 22,
    includeFontPadding: false,
  },
  shelfCount: {
    fontFamily: LAT_FONT.medium,
    fontSize: 12,
    includeFontPadding: false,
  },
  shelfAll: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 3,
    minHeight: 34,
    paddingHorizontal: 6,
  },
  shelfAllTxt: {
    fontFamily: AR_FONT.semibold,
    fontSize: 12.5,
    includeFontPadding: false,
  },
  shelfScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  shelfSep: {
    width: 10,
  },
  shelfCard: {
    width: 210,
  },
  /* الكتالوج */
  catalog: {
    marginTop: 12,
  },
  catalogHead: {
    flexDirection: ROW,
    marginBottom: 10,
  },
  catalogTitleWrap: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    gap: 7,
  },
  catalogTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 14,
    includeFontPadding: false,
  },
  catalogCount: {
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  catalogCountTxt: {
    fontFamily: LAT_FONT.semibold,
    fontSize: 11,
    includeFontPadding: false,
  },
  gridToggle: {
    flexDirection: ROW,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    padding: 2,
    gap: 2,
  },
  gridToggleBtn: {
    paddingHorizontal: 10,
    minHeight: 34,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridToggleTxt: {
    fontSize: 11,
    includeFontPadding: false,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCell: {
    width: '47.6%',
    flexGrow: 1,
  },
  rowsWrap: {
    gap: 8,
  },
  rowCell: {},
  /* هيكل التحميل */
  skeletonWrap: {
    padding: 14,
    gap: 18,
  },
  skeletonShelf: {
    gap: 8,
  },
  skeletonRows: {
    gap: 8,
  },
  skeletonRowPair: {
    flexDirection: ROW,
    gap: 10,
  },
});
