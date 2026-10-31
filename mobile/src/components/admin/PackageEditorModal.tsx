import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import ModalSheet from '@/components/ui/ModalSheet';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import Chip from '@/components/ui/Chip';
import { createPackage, updatePackage, type AdminPackage } from '@/api/admin';
import { fetchGames } from '@/api/games';
import { apiErrorText } from '@/api/client';
import { FONT } from '@/lib/fonts';
import { showToast } from '@/lib/toast';
import type { Category } from '@/api/types';

interface Props {
  visible: boolean;
  pkg: AdminPackage | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

/** نافذة إنشاء وتعديل باقة واختيار الألعاب المرتبطة بها */
export default function PackageEditorModal({
  visible,
  pkg,
  categories,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState('');
  const [priceText, setPriceText] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [busy, setBusy] = useState(false);

  const gamesQuery = useQuery({
    queryKey: ['pkg-editor-games', categoryId],
    queryFn: () => fetchGames({ category: categoryId, limit: 1000 }),
    enabled: visible,
  });

  useEffect(() => {
    if (!visible) return;
    setName(pkg?.name ?? '');
    setPriceText(pkg?.price != null ? String(pkg.price) : '');
    setCategoryId(Number(pkg?.category_id ?? categories[0]?.id ?? 1));
    setIsActive(pkg?.is_active == null ? true : !!pkg.is_active);
    const initialGames = pkg?.games ?? pkg?.packageGames ?? [];
    setSelectedIds(initialGames.map((g) => Number(g.id)));
    setSearchQ('');
  }, [visible, pkg, categories]);

  const toggleGame = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !priceText.trim()) {
      showToast('اسم الباقة والسعر مطلوبان', 'error');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(priceText) || 0,
        category_id: categoryId,
        is_active: isActive,
        gameIds: selectedIds,
      };
      if (pkg?.id) {
        await updatePackage(pkg.id, payload);
        showToast('تم تحديث الباقة');
      } else {
        await createPackage(payload);
        showToast('تم إنشاء الباقة');
      }
      onSaved();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const filteredGames = (gamesQuery.data ?? []).filter((g) => {
    if (!searchQ.trim()) return true;
    return g.title.toLowerCase().includes(searchQ.trim().toLowerCase());
  });

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={pkg ? `تعديل باقة: ${pkg.name}` : 'إنشاء باقة جديدة'}
    >
      <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 10 }}>
          <AppInput label="اسم الباقة *" placeholder="باقة كرة القدم" value={name} onChangeText={setName} />
          <AppInput
            label="سعر الباقة (د.ل) *"
            placeholder="25"
            keyboard="numeric"
            value={priceText}
            onChangeText={setPriceText}
          />

          <Text style={{ color: '#94a3b8', fontFamily: FONT.bold, fontSize: 12 }}>الفئة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                active={Number(categoryId) === Number(c.id)}
                onPress={() => setCategoryId(Number(c.id))}
                accent="#8a5cff"
              />
            ))}
          </ScrollView>

          <Pressable
            onPress={() => setIsActive((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                backgroundColor: isActive ? '#22c55e' : '#1b2740',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#062b27', fontFamily: FONT.bold }}>
                {isActive ? '✓' : ''}
              </Text>
            </View>
            <Text style={{ color: '#f1f5f9', fontFamily: FONT.medium }}>الباقة نشطة وظاهرة في المتجر</Text>
          </Pressable>

          <Text style={{ color: '#94a3b8', fontFamily: FONT.bold, fontSize: 12 }}>
            ألعاب الباقة المختارة ({selectedIds.length})
          </Text>
          <TextInput
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="ابحث داخل ألعاب الفئة..."
            placeholderTextColor="#64748b"
            textAlign="right"
            style={{
              backgroundColor: '#0b1220',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              color: '#f1f5f9',
              fontFamily: FONT.regular,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          />

          <View style={{ maxHeight: 160, gap: 6 }}>
            <ScrollView nestedScrollEnabled>
              {filteredGames.slice(0, 60).map((g) => {
                const chosen = selectedIds.includes(Number(g.id));
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => toggleGame(Number(g.id))}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: chosen ? 'rgba(20,184,166,0.18)' : '#0b1220',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        color: chosen ? '#2dd4bf' : '#f1f5f9',
                        fontFamily: chosen ? FONT.bold : FONT.regular,
                        fontSize: 12,
                      }}
                    >
                      {g.title}
                    </Text>
                    <Text style={{ color: chosen ? '#2dd4bf' : '#64748b', fontFamily: FONT.bold }}>
                      {chosen ? '✓ مضافة' : '+'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <AppButton label="حفظ الباقة" onPress={handleSave} loading={busy} />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}
