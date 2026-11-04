import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { createGenre, createSeries, deleteGenre, deleteSeries } from '@/api/admin';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { colors } from '@/lib/colors';

interface Props {
  genres: string[];
  seriesList: string[];
  runAction: (fn: () => Promise<void>, msg: string) => Promise<void>;
}

/** قسم إدارة الأنواع والسلاسل في تبويب الأقسام */
export default function TaxonomySection({ genres, seriesList, runAction }: Props) {
  const [newGenre, setNewGenre] = useState('');
  const [newSeries, setNewSeries] = useState('');

  /* الحذف عبر X المخصص للوسم — لا حذف عند نقر الوسم نفسه (ضغطة متعطلة)؛
     والوسم هنا يمكن أن يُضغط لاحقاً لشيء مفيد دون مخاطرة */
  const Chip = ({ label, onDelete }: { label: string; onDelete: () => void }) => (
    <View style={tagChip}>
      <Text style={{ color: colors.text, fontFamily: FONT.medium, fontSize: 12 }}>{label}</Text>
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`حذف ${label}`}
        style={chipDeleteBtn}
      >
        <Icon name="close" size={13} color={colors.dangerText} />
      </Pressable>
    </View>
  );

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.text, fontFamily: FONT.bold, fontSize: 15, textAlign: 'right' }}>
        الأنواع (Genres)
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={newGenre}
          onChangeText={setNewGenre}
          placeholder="نوع جديد (مثل رعب، تقسيم الشاشة)..."
          placeholderTextColor={colors.faint}
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
          <Icon name="plus" size={16} color={colors.brandDark} strokeWidth={2.4} />
          <Text style={{ color: colors.brandDark, fontFamily: FONT.bold }}>إضافة</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {genres.map((g) => (
          <Chip
            key={g}
            label={g}
            onDelete={() => void runAction(() => deleteGenre(g), `حُذف النوع: ${g}`)}
          />
        ))}
      </View>

      <Text
        style={{
          color: colors.text,
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
          placeholderTextColor={colors.faint}
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
          <Icon name="plus" size={16} color={colors.brandDark} strokeWidth={2.4} />
          <Text style={{ color: colors.brandDark, fontFamily: FONT.bold }}>إضافة</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {seriesList.map((s) => (
          <Chip
            key={s}
            label={s}
            onDelete={() => void runAction(() => deleteSeries(s), `حُذفت السلسلة: ${s}`)}
          />
        ))}
      </View>
    </View>
  );
}

const inputBox = {
  backgroundColor: colors.surfaceInset,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: colors.borderSubtle,
  color: colors.text,
  fontFamily: FONT.regular,
  paddingHorizontal: 12,
  minHeight: 44,
  paddingVertical: 10,
} as const;

const addBtn = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 4,
  backgroundColor: colors.brand,
  borderWidth: 1,
  borderColor: colors.brandBorder,
  borderRadius: 10,
  paddingHorizontal: 14,
  minHeight: 44,
  justifyContent: 'center' as const,
};

const tagChip = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  backgroundColor: colors.elevated,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: colors.borderSubtle,
  paddingHorizontal: 12,
  paddingVertical: 7,
} as const;

/* هدف الحذف في الوسم: مساحة كافية للإصبع (44×44) مع الشكل الأصغر */
const chipDeleteBtn = {
  width: 30,
  height: 30,
  marginEnd: -8,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
} as const;
