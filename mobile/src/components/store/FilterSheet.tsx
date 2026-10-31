import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Game } from '@/api/types';
import ModalSheet from '@/components/ui/ModalSheet';
import Chip from '@/components/ui/Chip';
import AppButton from '@/components/ui/AppButton';
import {
  ENGLISH_LETTERS,
  classifyGameHeuristic,
  formatGenreLabel,
  matchesLetter,
  sortGamesAlphabetically,
} from '@/lib/arabic';
import { hasSplitScreen } from '@/components/GameCard';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

export interface StoreFilters {
  genre: string | null;
  series: string | null;
  splitScreenOnly: boolean;
  letter: string | null;
}

export const EMPTY_FILTERS: StoreFilters = {
  genre: null,
  series: null,
  splitScreenOnly: false,
  letter: null,
};

export function countActiveFilters(f: StoreFilters): number {
  let c = 0;
  if (f.genre) c += 1;
  if (f.series) c += 1;
  if (f.splitScreenOnly) c += 1;
  if (f.letter) c += 1;
  return c;
}

export function applyFilters(
  games: Game[],
  filters: StoreFilters,
  activeCategoryId: number | null,
  query: string
): Game[] {
  const q = query.trim().toLowerCase();
  const filtered = games.filter((g) => {
    if (activeCategoryId != null) {
      const ids = Array.isArray(g.category_ids) ? g.category_ids : [];
      if (g.category_id !== activeCategoryId && !ids.includes(activeCategoryId)) {
        return false;
      }
    }
    const { genre, series } = classifyGameHeuristic(g);
    if (filters.genre) {
      const gGenre = formatGenreLabel(g.genre) || genre;
      if (gGenre !== filters.genre && (g.genre || '').trim() !== filters.genre) {
        return false;
      }
    }
    if (filters.series) {
      const gSeries = (g.series || '').trim() || series;
      if (gSeries !== filters.series) return false;
    }
    if (filters.splitScreenOnly && !hasSplitScreen(g)) return false;
    if (filters.letter && !matchesLetter(g.title, filters.letter)) return false;
    if (q) {
      const hay = `${g.title ?? ''} ${g.genre ?? ''} ${g.series ?? ''} ${genre} ${series}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return sortGamesAlphabetically(filtered);
}

interface Props {
  visible: boolean;
  onClose: () => void;
  games: Game[];
  filters: StoreFilters;
  onChange: (next: StoreFilters) => void;
  extraGenres?: string[];
  extraSeries?: string[];
}

export default function FilterSheet({
  visible,
  onClose,
  games,
  filters,
  onChange,
  extraGenres = [],
  extraSeries = [],
}: Props) {
  const genres = useMemo(() => {
    const s = new Set<string>();
    for (const x of extraGenres) if (x?.trim()) s.add(formatGenreLabel(x.trim()));
    for (const g of games) {
      const { genre } = classifyGameHeuristic(g);
      if (genre) s.add(genre);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [games, extraGenres]);

  const seriesList = useMemo(() => {
    const s = new Set<string>();
    for (const x of extraSeries) if (x?.trim()) s.add(x.trim());
    for (const g of games) {
      const { series } = classifyGameHeuristic(g);
      if (series) s.add(series);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [games, extraSeries]);

  const set = (patch: Partial<StoreFilters>) => onChange({ ...filters, ...patch });

  return (
    <ModalSheet visible={visible} onClose={onClose} title="تصفية المكتبة">
      <Pressable
        onPress={() => set({ splitScreenOnly: !filters.splitScreenOnly })}
        style={[
          styles.splitRow,
          filters.splitScreenOnly ? styles.splitActive : styles.splitIdle,
        ]}
      >
        <Text style={styles.splitLabel}>شاشة مقسومة (لاعبان)</Text>
        <View
          style={[
            styles.checkbox,
            filters.splitScreenOnly ? styles.checkboxOn : styles.checkboxOff,
          ]}
        >
          {filters.splitScreenOnly ? <Text style={styles.check}>✓</Text> : null}
        </View>
      </Pressable>

      {genres.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>النوع</Text>
          <View style={styles.chipWrap}>
            <Chip
              label="الكل"
              active={filters.genre === null}
              onPress={() => set({ genre: null })}
            />
            {genres.map((g) => (
              <Chip
                key={g}
                label={g}
                active={filters.genre === g}
                onPress={() => set({ genre: filters.genre === g ? null : g })}
              />
            ))}
          </View>
        </View>
      ) : null}

      {seriesList.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>السلسلة</Text>
          <View style={styles.chipWrap}>
            <Chip
              label="الكل"
              active={filters.series === null}
              onPress={() => set({ series: null })}
            />
            {seriesList.map((sr) => (
              <Chip
                key={sr}
                label={sr}
                active={filters.series === sr}
                onPress={() => set({ series: filters.series === sr ? null : sr })}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الحرف الأول (A – Z)</Text>
        <View style={styles.letterGrid}>
          <Chip
            label="الكل"
            active={filters.letter === null}
            onPress={() => set({ letter: null })}
          />
          {ENGLISH_LETTERS.map((ltr) => {
            const active = filters.letter === ltr;
            return (
              <Pressable
                key={ltr}
                onPress={() => set({ letter: active ? null : ltr })}
                style={[styles.letterBtn, active ? styles.letterOn : styles.letterOff]}
              >
                <Text
                  style={[
                    styles.letterText,
                    active ? styles.letterTextOn : styles.letterTextOff,
                  ]}
                >
                  {ltr}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.flex1}>
          <AppButton
            label="إعادة ضبط"
            variant="secondary"
            onPress={() => onChange(EMPTY_FILTERS)}
          />
        </View>
        <View style={styles.flex1}>
          <AppButton label="تطبيق" onPress={onClose} />
        </View>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  splitRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  splitActive: {
    backgroundColor: '#042f2e',
    borderColor: '#14b8a6',
  },
  splitIdle: {
    backgroundColor: '#0b1324',
    borderColor: '#334155',
  },
  splitLabel: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 13,
    includeFontPadding: false,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: '#14b8a6',
    borderColor: '#5eead4',
  },
  checkboxOff: {
    borderColor: '#475569',
  },
  check: {
    color: '#042f2e',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  chipWrap: {
    flexDirection: ROW,
    flexWrap: 'wrap',
    gap: 8,
  },
  letterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  letterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterOn: {
    backgroundColor: '#14b8a6',
    borderColor: '#5eead4',
  },
  letterOff: {
    backgroundColor: '#0b1324',
    borderColor: '#334155',
  },
  letterText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    includeFontPadding: false,
  },
  letterTextOn: { color: '#042f2e' },
  letterTextOff: { color: '#e2e8f0' },
  footerRow: {
    flexDirection: ROW,
    gap: 8,
    marginTop: 4,
  },
});
