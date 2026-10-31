import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { createGenre, createSeries, deleteGenre, deleteSeries } from '@/api/admin';
import { FONT } from '@/lib/fonts';

interface Props {
  genres: string[];
  seriesList: string[];
  runAction: (fn: () => Promise<void>, msg: string) => Promise<void>;
}

/** قسم إدارة الأنواع والسلاسل في تبويب الأقسام */
export default function TaxonomySection({ genres, seriesList, runAction }: Props) {
  const [newGenre, setNewGenre] = useState('');
  const [newSeries, setNewSeries] = useState('');

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 15 }}>الأنواع (Genres)</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={newGenre}
          onChangeText={setNewGenre}
          placeholder="نوع جديد (مثل رعب، تقسيم الشاشة)..."
          placeholderTextColor="#64748b"
          textAlign="right"
          style={[inputBox, { flex: 1 }]}
        />
        <Pressable
          onPress={() => {
            if (!newGenre.trim()) return;
            const g = newGenre.trim();
            setNewGenre('');
            void runAction(() => createGenre(g), 'أضيف النوع');
          }}
          style={addBtn}
        >
          <Text style={{ color: '#062b27', fontFamily: FONT.bold }}>+ إضافة</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {genres.map((g) => (
          <Pressable
            key={g}
            onPress={() => void runAction(() => deleteGenre(g), `حُذف النوع: ${g}`)}
            style={tagChip}
          >
            <Text style={{ color: '#f1f5f9', fontFamily: FONT.medium, fontSize: 12 }}>
              {g}  ✕
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 15, marginTop: 12 }}>
        السلاسل (Series)
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={newSeries}
          onChangeText={setNewSeries}
          placeholder="سلسلة جديدة (مثل Resident Evil)..."
          placeholderTextColor="#64748b"
          textAlign="right"
          style={[inputBox, { flex: 1 }]}
        />
        <Pressable
          onPress={() => {
            if (!newSeries.trim()) return;
            const s = newSeries.trim();
            setNewSeries('');
            void runAction(() => createSeries(s), 'أضيفت السلسلة');
          }}
          style={addBtn}
        >
          <Text style={{ color: '#062b27', fontFamily: FONT.bold }}>+ إضافة</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {seriesList.map((s) => (
          <Pressable
            key={s}
            onPress={() => void runAction(() => deleteSeries(s), `حُذفت السلسلة: ${s}`)}
            style={tagChip}
          >
            <Text style={{ color: '#f1f5f9', fontFamily: FONT.medium, fontSize: 12 }}>
              {s}  ✕
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const inputBox = {
  backgroundColor: '#141e30',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  color: '#f1f5f9',
  fontFamily: FONT.regular,
  paddingHorizontal: 10,
  paddingVertical: 8,
} as const;

const addBtn = {
  backgroundColor: '#14b8a6',
  borderRadius: 8,
  paddingHorizontal: 14,
  justifyContent: 'center' as const,
};

const tagChip = {
  backgroundColor: '#141e30',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  paddingHorizontal: 10,
  paddingVertical: 6,
} as const;
