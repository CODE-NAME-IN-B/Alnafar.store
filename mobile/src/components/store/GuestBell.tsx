/**
 * جرس إشعارات الألعاب الجديدة — للأعضاء والضيوف على السواء.
 * يفحص قائمة الألعاب كل 5 دقائق؛ أي لعبة أُضيفت بعد آخر فتح للجرس:
 * ترفع الشارة، ويظهر إشعار (Toast) باسمها وسعرها وجهازها (الفئة = الجهاز).
 * الضغط يفتح درجاً بأحدث الألعاب ويكمّل تعليمها كمقروءة.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchGames } from '@/api/games';
import { fetchCategories } from '@/api/categories';
import ModalSheet from '@/components/ui/ModalSheet';
import Icon from '@/components/ui/Icon';
import { ScalePressable } from '@/components/ui/motion';
import { EmptyState } from '@/components/ui/StateView';
import { colors } from '@/lib/colors';
import { jsonGet, jsonSet } from '@/lib/storage';
import { showToast } from '@/lib/toast';
import { formatDinar } from '@/lib/money';
import { mainPriceOf } from '@/lib/gamePrices';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';
import type { Game } from '@/api/types';

const LAST_SEEN_KEY = 'notif.games_last_seen';
/** الأميز الزمني لتسجيل الألعاب الجديدة: آخر 30 يوماً */
const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
/** فحص دوري أثناء عملية النشر: لعبة جديدة تظهر خلال ~5 دقائق */
const POLL_MS = 5 * 60 * 1000;

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
  /** منع تكرار نخب اللعبة نفسها عبر الجلبات المتتالية */
  const notifiedIds = useRef<Set<number>>(new Set());
  /** أول جلب لا نخب الزبون بألعاب كانت موجودة قبل فتح التطبيق */
  const warmedUp = useRef(false);

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
    refetchInterval: POLL_MS,
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

  /* إشعار حيّ: كلما ظهرت لعبة جديدة على القائمة نخبنا باسمها وسعرها وجهازها */
  useEffect(() => {
    if (gamesQ.isLoading || gamesQ.data == null || lastSeen == null) return;
    if (!warmedUp.current) {
      warmedUp.current = true;
      return;
    }
    const boundary = Math.max(lastSeen.getTime(), now - NEW_WINDOW_MS);
    const fresh = (gamesQ.data as Game[])
      .map((game) => ({ game, date: gameCreatedAt(game) }))
      .filter(
        (row): row is NewGame =>
          row.date instanceof Date && !Number.isNaN(row.date.getTime())
      )
      .filter((row) => row.date.getTime() > boundary);
    for (const { game } of fresh) {
      if (notifiedIds.current.has(game.id)) continue;
      notifiedIds.current.add(game.id);
      showToast(
        `لعبة جديدة: ${game.title} — ${formatDinar(mainPriceOf(game))} · ${categoryName(game)}`,
        'success'
      );
    }
    // الشارة نفسها تستنتج من newGames — لا حاجة لإعادة إنشائها هنا
  }, [gamesQ.data, gamesQ.isLoading, lastSeen, now, categoryName]);

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
        <Icon name="bell" size={17} color={colors.brandLight} />
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
              <Icon name="gamepad" size={14} color={colors.brandLight} />
              <View style={styles.itemBody}>
                <Text numberOfLines={1} style={styles.itemTitle}>
                  {game.title}
                </Text>
                {/* الجهاز = الفئة (فور/فايف) + السعر والاسم والوقت */}
                <Text style={styles.itemMeta} numberOfLines={1}>
                  {categoryName(game)} • {formatDinar(mainPriceOf(game))}
                </Text>
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
    color: colors.faint,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 1,
  },
});
