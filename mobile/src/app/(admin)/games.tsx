import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { fetchGames } from '@/api/games';
import { fetchCategories, fetchGenres, fetchSeries } from '@/api/categories';
import { deleteGame } from '@/api/admin';
import { apiErrorText } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import GameEditorModal from '@/components/admin/GameEditorModal';
import Chip from '@/components/ui/Chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { mainPriceOf } from '@/lib/gamePrices';
import { showToast } from '@/lib/toast';
import type { Game } from '@/api/types';

/** تبويب إدارة الألعاب في لوحة الإدارة */
export default function AdminGamesScreen() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [searchQ, setSearchQ] = useState('');
  const [catFilter, setCatFilter] = useState<number | null>(null);
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
    <View style={{ flex: 1, backgroundColor: '#0f1724' }}>
      <View style={{ padding: 12, gap: 8, backgroundColor: '#101929' }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="ابحث عن لعبة في المكتبة..."
            placeholderTextColor="#64748b"
            textAlign="right"
            style={{
              flex: 1,
              backgroundColor: '#141e30',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              color: '#f1f5f9',
              fontFamily: FONT.regular,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          />
          <Pressable
            onPress={() => {
              setEditingGame(null);
              setModalOpen(true);
            }}
            style={{
              backgroundColor: '#14b8a6',
              borderRadius: 10,
              paddingHorizontal: 14,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#062b27', fontFamily: FONT.bold, fontSize: 13 }}>
              + إضافة لعبة
            </Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip label="الكل" active={!catFilter} onPress={() => setCatFilter(null)} />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={catFilter === c.id}
              onPress={() => setCatFilter(c.id)}
            />
          ))}
        </ScrollView>
      </View>

      {gamesQuery.isLoading ? (
        <LoadingState message="جاري جلب الألعاب..." />
      ) : gamesQuery.isError ? (
        <ErrorState message="تعذر جلب الألعاب" onRetry={() => gamesQuery.refetch()} />
      ) : !gamesQuery.data?.length ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState message="لا توجد ألعاب مطابقة" icon="🎮" />
        </View>
      ) : (
        <FlashList
          data={gamesQuery.data}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: '#141e30',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
                padding: 10,
                marginBottom: 8,
              }}
            >
              <Image
                source={{ uri: item.image }}
                style={{ width: 52, height: 64, borderRadius: 8, backgroundColor: '#0b1220' }}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 14 }}>
                  {item.title}
                </Text>
                <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 12 }}>
                  {formatDinar(mainPriceOf(item))}
                  {item.price_ps5 ? ` • فايف: ${formatDinar(Number(item.price_ps5))}` : ''}
                </Text>
                <Text style={{ color: '#64748b', fontFamily: FONT.regular, fontSize: 11 }}>
                  {item.genre || 'بدون نوع'}
                  {item.size_gb ? ` • ${Math.round(Number(item.size_gb))} GB` : ''}
                </Text>
              </View>
              <View style={{ gap: 6 }}>
                <Pressable
                  onPress={() => {
                    setEditingGame(item);
                    setModalOpen(true);
                  }}
                  style={rowBtn('#14b8a6')}
                >
                  <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 11 }}>تعديل</Text>
                </Pressable>
                {isAdmin ? (
                  <Pressable onPress={() => void handleDelete(item)} style={rowBtn('#ef4444')}>
                    <Text style={{ color: '#fca5a5', fontFamily: FONT.bold, fontSize: 11 }}>حذف</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
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

const rowBtn = (border: string) =>
  ({
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: border,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  }) as const;
