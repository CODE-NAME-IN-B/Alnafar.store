import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { fetchGames } from '@/api/games';
import { fetchCategories, fetchGenres, fetchSeries } from '@/api/categories';
import { deleteGame } from '@/api/admin';
import { apiErrorText } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import GameEditorModal from '@/components/admin/GameEditorModal';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import {
  ENGLISH_LETTERS,
  classifyGameHeuristic,
  formatGenreLabel,
  matchesLetter,
  sortGamesAlphabetically,
} from '@/lib/arabic';
import { FONT } from '@/lib/fonts';
import { colors } from '@/lib/colors';
import { formatDinar } from '@/lib/money';
import { mainPriceOf } from '@/lib/gamePrices';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';
import type { Game } from '@/api/types';

export default function AdminGamesScreen() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [searchQ, setSearchQ] = useState('');
  const [catFilter, setCatFilter] = useState<number | null>(null);
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const gamesQuery = useQuery({
    queryKey: ['admin-games', { q: searchQ, category: catFilter }],
    queryFn: () =>
      fetchGames({
        q: searchQ.trim() || undefined,
        category: catFilter,
        limit: 1000,
      }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => fetchCategories(false),
  });
  const genresQuery = useQuery({ queryKey: ['genres'], queryFn: fetchGenres });
  const seriesQuery = useQuery({ queryKey: ['series'], queryFn: fetchSeries });

  const sortedGames = useMemo(() => {
    const raw = gamesQuery.data ?? [];
    const byLetter = letterFilter
      ? raw.filter((g) => matchesLetter(g.title, letterFilter))
      : raw;
    return sortGamesAlphabetically(byLetter);
  }, [gamesQuery.data, letterFilter]);

  const handleDelete = async (game: Game) => {
    try {
      await deleteGame(game.id);
      showToast(`حُذفت اللعبة: ${game.title}`);
      await gamesQuery.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    }
  };

  const categories = categoriesQuery.data ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color="colors.faint" />
            <TextInput
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder="ابحث عن لعبة في المكتبة..."
              placeholderTextColor="colors.faint"
              textAlign="right"
              style={styles.searchInput}
            />
            {searchQ ? (
              <Pressable onPress={() => setSearchQ('')} hitSlop={8}>
                <Icon name="close" size={15} color="colors.faint" />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              setEditingGame(null);
              setModalOpen(true);
            }}
            style={styles.addBtn}
          >
            <Icon name="plus" size={15} color="colors.brandDark" strokeWidth={2.4} />
            <Text style={styles.addBtnText}>إضافة لعبة</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          <Chip
            label={`الكل (${sortedGames.length})`}
            compact
            active={!catFilter}
            onPress={() => setCatFilter(null)}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              compact
              active={catFilter === c.id}
              onPress={() => setCatFilter(catFilter === c.id ? null : c.id)}
            />
          ))}
        </ScrollView>

        {/* فهرس أبجدي بالإنجليزية A - Z */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.alphaScroll}
        >
          <Pressable
            onPress={() => setLetterFilter(null)}
            style={[
              styles.letterBtn,
              letterFilter === null && styles.letterBtnActive,
            ]}
          >
            <Text
              style={[
                styles.letterText,
                letterFilter === null && styles.letterTextActive,
              ]}
            >
              A–Z
            </Text>
          </Pressable>
          {ENGLISH_LETTERS.map((ltr) => {
            const active = letterFilter === ltr;
            return (
              <Pressable
                key={ltr}
                onPress={() => setLetterFilter(active ? null : ltr)}
                style={[styles.letterBtn, active && styles.letterBtnActive]}
              >
                <Text
                  style={[styles.letterText, active && styles.letterTextActive]}
                >
                  {ltr}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {gamesQuery.isLoading ? (
        <LoadingState message="جاري جلب الألعاب..." />
      ) : gamesQuery.isError ? (
        <ErrorState
          message="تعذر جلب الألعاب"
          onRetry={() => gamesQuery.refetch()}
        />
      ) : !sortedGames.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState message="لا توجد ألعاب مطابقة" icon="gamepad" />
        </View>
      ) : (
        <FlashList
          data={sortedGames}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const { genre: hGenre } = classifyGameHeuristic(item);
            const gLabel = formatGenreLabel(item.genre) || hGenre;
            return (
              <View style={styles.gameRow}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={styles.infoCol}>
                  <Text numberOfLines={1} style={styles.gameTitle}>
                    {item.title}
                  </Text>
                  <Text style={styles.gamePrice}>
                    {formatDinar(mainPriceOf(item))}
                    {item.price_ps5
                      ? ` • فايف: ${formatDinar(Number(item.price_ps5))}`
                      : ''}
                  </Text>
                  <Text style={styles.gameMeta}>
                    {gLabel}
                    {item.size_gb
                      ? ` • ${Math.round(Number(item.size_gb))} GB`
                      : ''}
                  </Text>
                </View>
                <View style={styles.actionsCol}>
                  <Pressable
                    onPress={() => {
                      setEditingGame(item);
                      setModalOpen(true);
                    }}
                    style={[styles.rowBtn, styles.editBtn]}
                  >
                    <Icon name="edit" size={13} color="colors.brandLight" />
                    <Text style={styles.editBtnText}>تعديل</Text>
                  </Pressable>
                  {isAdmin ? (
                    <Pressable
                      onPress={() => void handleDelete(item)}
                      style={[styles.rowBtn, styles.delBtn]}
                    >
                      <Icon name="trash" size={13} color="colors.dangerText" />
                      <Text style={styles.delBtnText}>حذف</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}

      <GameEditorModal
        visible={modalOpen}
        game={editingGame}
        categories={categories}
        genres={genresQuery.data ?? []}
        seriesList={seriesQuery.data ?? []}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          void gamesQuery.refetch();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.deep,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: colors.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  searchRow: {
    flexDirection: ROW,
    gap: 8,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 10,
    height: 42,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: FONT.medium,
    fontSize: 13,
    paddingVertical: 4,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  addBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
  },
  addBtnText: {
    color: colors.brandDark,
    fontFamily: FONT.bold,
    fontSize: 12.5,
    includeFontPadding: false,
  },
  catScroll: {
    flexDirection: ROW,
    gap: 6,
  },
  alphaScroll: {
    flexDirection: 'row',
    gap: 5,
    paddingTop: 2,
  },
  letterBtn: {
    minWidth: 32,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBtnActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brandBorder,
  },
  letterText: {
    fontFamily: FONT.bold,
    color: colors.dim,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  letterTextActive: {
    color: colors.brandDark,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  gameRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 10,
    marginBottom: 8,
  },
  thumb: {
    width: 54,
    height: 68,
    borderRadius: 10,
    backgroundColor: colors.deep,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  gameTitle: {
    color: colors.text,
    fontFamily: FONT.bold,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  gamePrice: {
    color: colors.brandLight,
    fontFamily: FONT.bold,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  gameMeta: {
    color: colors.faint,
    fontFamily: FONT.regular,
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  actionsCol: {
    gap: 6,
  },
  rowBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editBtn: {
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderColor: 'rgba(45,212,191,0.35)',
  },
  editBtnText: {
    color: colors.brandLight,
    fontFamily: FONT.bold,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  delBtn: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(248,113,113,0.35)',
  },
  delBtnText: {
    color: colors.dangerText,
    fontFamily: FONT.bold,
    fontSize: 11.5,
    includeFontPadding: false,
  },
});
