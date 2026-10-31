import { Text, View, ScrollView, Pressable } from 'react-native';
import type { ReactNode } from 'react';
import ModalSheet from '@/components/ui/ModalSheet';
import Chip from '@/components/ui/Chip';
import AppText from '@/components/ui/AppText';
import { FONT } from '@/lib/fonts';
import type { Game } from '@/api/types';
import { hasSplitScreen } from '@/components/GameCard';
import { ARABIC_LETTERS, matchesLetter } from '@/lib/arabic';

export interface Filters {
  genre: string | null;
  series: string | null;
  letter: string | null;
  splitScreenOnly: boolean;
}

export const EMPTY_FILTERS: Filters = {
  genre: null,
  series: null,
  letter: null,
  splitScreenOnly: false,
};

interface Props {
  visible: boolean;
  onClose: () => void;
  value: Filters;
  onChange: (next: Filters) => void;
  genres: string[];
  seriesList: string[];
  games: Game[];
}

/**
 * ورقة الفلاتر: النوع، السلسلة، الحروف (أ–ي مع «#»)، وتقسيم الشاشة —
 * بنفس خيارات المتجر الويب.
 */
export default function FilterSheet({
  visible,
  onClose,
  value,
  onChange,
  genres,
  seriesList,
  games,
}: Props) {
  const toggle = (key: keyof Filters, next: unknown) => {
    onChange({ ...value, [key]: next as never });
  };

  const activeCount = [
    value.genre ? 1 : 0,
    value.series ? 1 : 0,
    value.letter ? 1 : 0,
    value.splitScreenOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <ModalSheet visible={visible} onClose={onClose} title="ترتيب وفلترة">
      <Section title="النوع">
        <Chips
          items={genres}
          selected={value.genre}
          onSelect={(g) => toggle('genre', g === value.genre ? null : g)}
          allLabel="الكل"
        />
      </Section>

      <Section title="السلسلة">
        <Chips
          items={seriesList}
          selected={value.series}
          onSelect={(s) => toggle('series', s === value.series ? null : s)}
          allLabel="الكل"
        />
      </Section>

      <Section title="ترتيب بالحرف">
        <Chips
          items={[...ARABIC_LETTERS]}
          selected={value.letter}
          onSelect={(l) => toggle('letter', l === value.letter ? null : l)}
          allLabel="الكل"
        />
      </Section>

      <Section title="الألعاب الجماعية">
        <Pressable
          onPress={() => toggle('splitScreenOnly', !value.splitScreenOnly)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 8,
          }}
        >
          <View
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              backgroundColor: value.splitScreenOnly ? '#14b8a6' : '#1b2740',
              padding: 3,
              alignItems: value.splitScreenOnly ? 'flex-start' : 'flex-end',
              flexDirection: 'row',
            }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: value.splitScreenOnly ? '#062b27' : '#64748b' }} />
          </View>
          <Text style={{ color: '#f1f5f9', fontFamily: FONT.medium }}>
            ألعاب تدعم تقسيم الشاشة فقط
          </Text>
        </Pressable>
      </Section>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        <Pressable
          onPress={() => onChange(EMPTY_FILTERS)}
          style={{
            flex: 1,
            borderRadius: 10,
            backgroundColor: '#1b2740',
            paddingVertical: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold }}>مسح الترشيح{activeCount ? ` (${activeCount})` : ''}</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          style={{
            flex: 1,
            borderRadius: 10,
            backgroundColor: '#14b8a6',
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#062b27', fontFamily: FONT.bold }}>اعرض النتيجة</Text>
        </Pressable>
      </View>
    </ModalSheet>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <AppText style={{ color: '#94a3b8', fontFamily: FONT.bold, fontSize: 13, marginBottom: 8 }}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Chips({
  items,
  selected,
  onSelect,
  allLabel,
}: {
  items: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  allLabel: string;
}) {
  if (!items.length) {
    return (
      <Text style={{ color: '#64748b', fontFamily: FONT.regular, paddingVertical: 6 }}>
        لا خيارات متاحة
      </Text>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      <Chip label={allLabel} active={!selected} onPress={() => onSelect('')} />
      {items.map((item) => (
        <Chip key={item} label={item} active={selected === item} onPress={() => onSelect(item)} />
      ))}
    </ScrollView>
  );
}

/** تطبيق الفلاتر على قائمة الألعاب محلياً (الخادم يفلتر فقط بالبحث والفئة والسعر) */
export function applyFilters(games: Game[], filters: Filters, query: string): Game[] {
  return games.filter((g) => {
    if (filters.genre && g.genre !== filters.genre) return false;
    if (filters.series && g.series !== filters.series) return false;
    if (filters.letter && !matchesLetter(g.title, filters.letter)) return false;
    if (filters.splitScreenOnly && !hasSplitScreen(g)) return false;
    return true;
  });
}
