import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { createGenre, createSeries, deleteGenre, deleteSeries } from '@/api/admin';
import Icon from '@/components/ui/Icon';
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
      <Text style={{ color: '#f8fafc', fontFamily: FONT.bold, fontSize: 15, textAlign: 'right' }}>
        الأنواع (Genres)
      </Text>
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
          <Icon name="plus" size={16} color="#ffffff" strokeWidth={2.4} />
          <Text style={{ color: '#ffffff', fontFamily: FONT.bold }}>إضافة</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {genres.map((g) => (
          <Pressable
            key={g}
            onPress={() => void runAction(() => deleteGenre(g), `حُذف النوع: ${g}`)}
            style={tagChip}
          >
            <Text style={{ color: '#f8fafc', fontFamily: FONT.medium, fontSize: 12 }}>{g}</Text>
            <Icon name="close" size={13} color="#fca5a5" />
          </Pressable>
        ))}
      </View>

      <Text
        style={{
          color: '#f8fafc',
          fontFamily: FONT.bold,
          fontSize: 15,
          marginTop: 12,
          textAlign: 'right',
        }}
      >
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
          <Icon name="plus" size={16} color="#ffffff" strokeWidth={2.4} />
          <Text style={{ color: '#ffffff', fontFamily: FONT.bold }}>إضافة</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {seriesList.map((s) => (
          <Pressable
            key={s}
            onPress={() => void runAction(() => deleteSeries(s), `حُذفت السلسلة: ${s}`)}
            style={tagChip}
          >
            <Text style={{ color: '#f8fafc', fontFamily: FONT.medium, fontSize: 12 }}>{s}</Text>
            <Icon name="close" size={13} color="#fca5a5" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const inputBox = {
  backgroundColor: '#141e30',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  color: '#f8fafc',
  fontFamily: FONT.regular,
  paddingHorizontal: 12,
  paddingVertical: 8,
} as const;

const addBtn = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 4,
  backgroundColor: '#14b8a6',
  borderWidth: 1,
  borderColor: '#2dd4bf',
  borderRadius: 10,
  paddingHorizontal: 14,
  justifyContent: 'center' as const,
};

const tagChip = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  backgroundColor: '#141e30',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
  paddingHorizontal: 12,
  paddingVertical: 7,
} as const;
