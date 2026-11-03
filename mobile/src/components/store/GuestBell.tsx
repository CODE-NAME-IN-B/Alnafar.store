/**
 * جرس إشعارات الضيف — يظهر فقط لغير المسجّلين (الضيف)، ويختفي للكاشير/الإدارة.
 * الشارة = عدد الألعاب المضافة بعد آخر فتح للجرس (تحفظ التاريخ محلياً).
 * الضغط عليه يفتح درجاً بأحدث الألعاب ويعلّمها كمقروءة.
 */
import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchGames } from '@/api/games';
import { fetchCategories } from '@/api/categories';
import ModalSheet from '@/components/ui/ModalSheet';
import Icon from '@/components/ui/Icon';
import { ScalePressable } from '@/components/ui/motion';
import { EmptyState } from '@/components/ui/StateView';
import { jsonGet, jsonSet } from '@/lib/storage';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';
import type { Game } from '@/api/types';

const LAST_SEEN_KEY = 'notif.games_last_seen';
/** الأميز الزمني لتسجيل الألعاب الجديدة: آخر 30 يوماً */
const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type NewGame = { game: Game; date: Date };

function gameCreatedAt(game: Game): Date | null {
  const raw = game.created_at;
  if (!raw) return null;
  /* صيغة MySQL «2026-11-02 14:05:00» لا تُقبل مباشرة — نستبدل الفراغ بـ T */
  return new Date(raw.replace(' ', 'T'));
}

export default function GuestBell({ style }: { style?: StyleProp<ViewStyle> }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  /* «الآن» تُثبت في الحالة بدل استدعاء Date.now() أثناء العرض */
  const [now, setNow] = useState(0);

  useEffect(() => {
    let alive = true;
    void jsonGet<string | null>(LAST_SEEN_KEY, null).then((raw) => {
      if (!alive) return;
      // أول تشغيل: نعتبر كل الموجود مقروءاً حتى لا تمتلئ الشارة بكل الألعاب
      const seen = raw ? new Date(raw) : new Date();
      if (!raw) void jsonSet(LAST_SEEN_KEY, seen.toISOString());
      setLastSeen(seen);
      setNow(Date.now());
    });
    return () => {
      alive = false;
    };
  }, []);

  const gamesQ = useQuery({
    queryKey: ['games', 'all'],
    queryFn: () => fetchGames({ limit: 1000 }),
  });
  const categoriesQ = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(true),
  });

  const newGames: NewGame[] = (() => {
    const boundary = Math.max(lastSeen?.getTime() ?? 0, now - NEW_WINDOW_MS);
    return (gamesQ.data ?? [])
      .map((game) => ({ game, date: gameCreatedAt(game) }))
      .filter((row): row is NewGame => row.date instanceof Date && !Number.isNaN(row.date.getTime()))
      .filter((row) => row.date.getTime() > boundary)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  })();

  const categoryName = (game: Game): string => {
    const id = typeof game.category_id === 'number' ? game.category_id : null;
    const cat = categoriesQ.data?.find((c) => c.id === id);
    return cat?.name ?? 'عام';
  };

  const openSheet = () => {
    setSheetOpen(true);
    const now = Date.now();
    void jsonSet(LAST_SEEN_KEY, new Date(now).toISOString());
    setLastSeen(new Date(now));
    setNow(now);
  };

  return (
    <>
      <ScalePressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel="إشعارات الألعاب الجديدة"
        hitSlop={6}
        style={[styles.pressable, style]}
      >
        <Icon name="bell" size={17} color="#5eead4" />
        {newGames.length > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{newGames.length > 9 ? '9+' : newGames.length}</Text>
          </View>
        ) : null}
      </ScalePressable>

      <ModalSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="الألعاب الجديدة"
      >
        {newGames.length === 0 ? (
          <EmptyState message="لا توجد ألعاب جديدة — تفقّد لاحقاً" icon="bell" />
        ) : (
          newGames.map(({ game }) => (
            <View key={game.id} style={styles.item}>
              <Icon name="gamepad" size={14} color="#2dd4bf" />
              <View style={styles.itemBody}>
                <Text numberOfLines={1} style={styles.itemTitle}>
                  {game.title}
                </Text>
                <Text style={styles.itemMeta}>{categoryName(game)}</Text>
              </View>
            </View>
          ))
        )}
      </ModalSheet>
    </>
  );
}

const styles = StyleSheet.create({
  pressable: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 17,
    height: 17,
    borderRadius: 999,
    paddingHorizontal: 3,
    backgroundColor: '#14b8a6',
    borderWidth: 1.5,
    borderColor: '#090f1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FONT.bold,
    color: '#042f2e',
    fontSize: 9,
    includeFontPadding: false,
  },
  item: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  itemBody: { flex: 1 },
  itemTitle: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  itemMeta: {
    fontFamily: FONT.regular,
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 1,
  },
});
