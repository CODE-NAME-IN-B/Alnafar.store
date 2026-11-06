import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { formatDinar } from '@/lib/money';
import { mainPriceOf } from '@/lib/gamePrices';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';
import type { Game } from '@/api/types';

export default function AdminGamesScreen() {
  const palette = usePalette();
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

  const confirmDelete = (game: Game) => {
    Alert.alert(
      'تأكيد حذف اللعبة',
      `هل أنت متأكد من حذف لعبة "${game.title}" نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائياً',
          style: 'destructive',
          onPress: () => void handleDelete(game),
        },
      ]
    );
  };

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
    <View style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: palette.canvas,
            borderBottomColor: palette.surfaceLine,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: palette.surface,
                borderColor: palette.surfaceLine,
              },
            ]}
          >
            <Icon name="search" size={16} color={palette.textFaint} />
            <TextInput
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder="ابحث عن لعبة في المكتبة..."
              placeholderTextColor={palette.textFaint}
              textAlign="right"
              style={[
                styles.searchInput,
                {
                  color: palette.text,
                  fontFamily: AR_FONT.medium,
                },
              ]}
            />
            {searchQ ? (
              <Pressable onPress={() => setSearchQ('')} hitSlop={8}>
                <Icon name="close" size={15} color={palette.textFaint} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              setEditingGame(null);
              setModalOpen(true);
            }}
            style={({ pressed }) => [
              styles.addBtn,
              {
                backgroundColor: pressed ? palette.primaryPressed : palette.primary,
                borderColor: palette.primary,
              },
            ]}
          >
            <Icon name="plus" size={15} color={palette.onPrimary} strokeWidth={2.4} />
            <Text style={[styles.addBtnText, { color: palette.onPrimary, fontFamily: AR_FONT.bold }]}>
              إضافة لعبة
            </Text>
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
              key={String(c.id)}
              label={c.name}
              compact
              active={catFilter === c.id}
              onPress={() => setCatFilter(catFilter === c.id ? null : c.id)}
            />
          ))}
        </ScrollView>

        {/* فهرس أبجدي A - Z */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.alphaScroll}
        >
          <Pressable
            onPress={() => setLetterFilter(null)}
            style={[
              styles.letterBtn,
              {
                backgroundColor: letterFilter === null ? palette.primary : palette.surface,
                borderColor: letterFilter === null ? palette.primary : palette.surfaceLine,
              },
            ]}
          >
            <Text
              style={[
                styles.letterText,
                {
                  color: letterFilter === null ? palette.onPrimary : palette.textSub,
                  fontFamily: AR_FONT.bold,
                },
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
                style={[
                  styles.letterBtn,
                  {
                    backgroundColor: active ? palette.primary : palette.surface,
                    borderColor: active ? palette.primary : palette.surfaceLine,
                  },
                ]}
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
              <Pressable
                onPress={() => {
                  setEditingGame(item);
                  setModalOpen(true);
                }}
                style={({ pressed }) => [
                  styles.gameRow,
                  {
                    backgroundColor: pressed ? palette.surfaceRaised : palette.surface,
                    borderColor: palette.surfaceLine,
                  },
                ]}
              >
                <Image
                  source={{ uri: item.image }}
                  style={[styles.thumb, { backgroundColor: palette.surfaceRaised }]}
                  contentFit="cover"
                />
                <View style={styles.infoCol}>
                  <Text numberOfLines={1} style={[styles.gameTitle, { color: palette.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.gamePrice, { color: palette.money }]}>
                    {formatDinar(mainPriceOf(item))}
                    {item.price_ps5
                      ? ` • فايف: ${formatDinar(Number(item.price_ps5))}`
                      : ''}
                  </Text>
                  <Text style={[styles.gameMeta, { color: palette.textSub }]}>
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
                    style={({ pressed }) => [
                      styles.rowBtn,
                      {
                        backgroundColor: pressed ? palette.surfaceLine : palette.surfaceRaised,
                        borderColor: palette.surfaceLine,
                      },
                    ]}
                  >
                    <Icon name="edit" size={13} color={palette.text} />
                    <Text style={[styles.editBtnText, { color: palette.text }]}>تعديل</Text>
                  </Pressable>
                  {isAdmin ? (
                    <Pressable
                      onPress={() => confirmDelete(item)}
                      style={({ pressed }) => [
                        styles.rowBtn,
                        {
                          backgroundColor: pressed ? palette.danger + '25' : palette.danger + '14',
                          borderColor: palette.danger + '40',
                        },
                      ]}
                    >
                      <Icon name="trash" size={13} color={palette.danger} />
                      <Text style={[styles.delBtnText, { color: palette.danger }]}>حذف</Text>
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
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
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
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
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 42,
    gap: 6,
  },
  searchInput: {
    flex: 1,
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
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
  },
  addBtnText: {
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 11.5,
    includeFontPadding: false,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  gameRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  thumb: {
    width: 52,
    height: 66,
    borderRadius: 10,
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  gameTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  gamePrice: {
    fontFamily: AR_FONT.bold,
    fontSize: 12.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  gameMeta: {
    fontFamily: AR_FONT.regular,
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
    paddingVertical: 5,
    minHeight: 30,
  },
  editBtnText: {
    fontFamily: AR_FONT.bold,
    fontSize: 11,
    includeFontPadding: false,
  },
  delBtnText: {
    fontFamily: AR_FONT.bold,
    fontSize: 11,
    includeFontPadding: false,
  },
});
