import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  createCategory,
  createService,
  deleteCategory,
  deletePackage,
  deleteService,
  fetchAdminPackages,
  fetchAllServices,
  updateCategory,
  updateService,
  type AdminPackage,
} from '@/api/admin';
import { fetchCategories, fetchGenres, fetchSeries } from '@/api/categories';
import { apiErrorText } from '@/api/client';
import PackageEditorModal from '@/components/admin/PackageEditorModal';
import TaxonomySection from '@/components/admin/TaxonomySection';
import Chip from '@/components/ui/Chip';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';

type SectionKey = 'packages' | 'categories' | 'services' | 'taxonomy';

/** تبويب إدارة الأقسام والباقات والخدمات والأنواع والسلاسل */
export default function AdminCatalogScreen() {
  const [section, setSection] = useState<SectionKey>('packages');
  const [editingPkg, setEditingPkg] = useState<AdminPackage | null>(null);
  const [pkgModalOpen, setPkgModalOpen] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newSvcTitle, setNewSvcTitle] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');

  const packagesQ = useQuery({ queryKey: ['admin-packages'], queryFn: fetchAdminPackages });
  const categoriesQ = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => fetchCategories(false),
  });
  const servicesQ = useQuery({ queryKey: ['admin-services'], queryFn: fetchAllServices });
  const genresQ = useQuery({ queryKey: ['genres'], queryFn: fetchGenres });
  const seriesQ = useQuery({ queryKey: ['series'], queryFn: fetchSeries });

  const runAction = async (fn: () => Promise<void>, msg: string) => {
    try {
      await fn();
      showToast(msg);
      await Promise.all([
        packagesQ.refetch(),
        categoriesQ.refetch(),
        servicesQ.refetch(),
        genresQ.refetch(),
        seriesQ.refetch(),
      ]);
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f1724' }}>
      <View style={{ padding: 12, backgroundColor: '#101929' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="📦 الباقات" active={section === 'packages'} onPress={() => setSection('packages')} />
          <Chip label="🏷️ التصنيفات" active={section === 'categories'} onPress={() => setSection('categories')} />
          <Chip label="🔧 الخدمات" active={section === 'services'} onPress={() => setSection('services')} />
          <Chip label="🗂️ الأنواع والسلاسل" active={section === 'taxonomy'} onPress={() => setSection('taxonomy')} />
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        {section === 'packages' ? (
          <>
            <Pressable
              onPress={() => {
                setEditingPkg(null);
                setPkgModalOpen(true);
              }}
              style={primaryBarBtn}
            >
              <Text style={{ color: '#062b27', fontFamily: FONT.bold }}>+ إنشاء باقة جديدة</Text>
            </Pressable>
            {(packagesQ.data ?? []).map((pkg) => {
              const count = (pkg.games ?? pkg.packageGames ?? []).length;
              return (
                <View key={pkg.id} style={cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 15 }}>
                      {pkg.name} {!pkg.is_active ? ' (مخفية)' : ''}
                    </Text>
                    <Text style={{ color: '#a78bfa', fontFamily: FONT.medium, fontSize: 12 }}>
                      {formatDinar(Number(pkg.price))} • {count} لعبة
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <SmallBtn
                      label="تعديل"
                      color="#14b8a6"
                      onPress={() => {
                        setEditingPkg(pkg);
                        setPkgModalOpen(true);
                      }}
                    />
                    <SmallBtn
                      label="حذف"
                      color="#ef4444"
                      onPress={() => void runAction(() => deletePackage(pkg.id), 'حُذفت الباقة')}
                    />
                  </View>
                </View>
              );
            })}
          </>
        ) : null}

        {section === 'categories' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="اسم تصنيف جديد (مثل PS5)..."
                placeholderTextColor="#64748b"
                textAlign="right"
                style={[inputBox, { flex: 1 }]}
              />
              <Pressable
                onPress={() => {
                  if (!newCatName.trim()) return;
                  const name = newCatName.trim();
                  setNewCatName('');
                  void runAction(async () => {
                    await createCategory(name, true);
                  }, 'أضيف التصنيف');
                }}
                style={addBtn}
              >
                <Text style={{ color: '#062b27', fontFamily: FONT.bold }}>+ إضافة</Text>
              </Pressable>
            </View>
            {(categoriesQ.data ?? []).map((cat) => (
              <View key={cat.id} style={cardRow}>
                <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, flex: 1 }}>
                  {cat.name} {!cat.is_visible ? ' (مخفي)' : ''}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <SmallBtn
                    label={cat.is_visible ? 'إخفاء' : 'إظهار'}
                    color="#f59e0b"
                    onPress={() =>
                      void runAction(
                        () => updateCategory(cat.id, { is_visible: !cat.is_visible }),
                        'حُدّث ظهور التصنيف'
                      )
                    }
                  />
                  <SmallBtn
                    label="حذف"
                    color="#ef4444"
                    onPress={() => void runAction(() => deleteCategory(cat.id), 'حُذف التصنيف')}
                  />
                </View>
              </View>
            ))}
          </>
        ) : null}

        {section === 'services' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={newSvcTitle}
                onChangeText={setNewSvcTitle}
                placeholder="عنوان الخدمة..."
                placeholderTextColor="#64748b"
                textAlign="right"
                style={[inputBox, { flex: 2 }]}
              />
              <TextInput
                value={newSvcPrice}
                onChangeText={setNewSvcPrice}
                placeholder="السعر"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                style={[inputBox, { flex: 1 }]}
              />
              <Pressable
                onPress={() => {
                  if (!newSvcTitle.trim()) return;
                  const t = newSvcTitle.trim();
                  const p = Number(newSvcPrice) || 0;
                  setNewSvcTitle('');
                  setNewSvcPrice('');
                  void runAction(async () => {
                    await createService({ title: t, price: p, is_active: true });
                  }, 'أضيفت الخدمة');
                }}
                style={addBtn}
              >
                <Text style={{ color: '#062b27', fontFamily: FONT.bold }}>+ إضافة</Text>
              </Pressable>
            </View>
            {(servicesQ.data ?? []).map((svc) => (
              <View key={svc.id} style={cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold }}>
                    {svc.title} {!svc.is_active ? ' (معطلة)' : ''}
                  </Text>
                  <Text style={{ color: '#2dd4bf', fontFamily: FONT.medium, fontSize: 12 }}>
                    {formatDinar(Number(svc.price))}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <SmallBtn
                    label={svc.is_active ? 'تعطيل' : 'تفعيل'}
                    color="#f59e0b"
                    onPress={() =>
                      void runAction(
                        () => updateService(svc.id, { is_active: !svc.is_active }),
                        'حُدّثت الخدمة'
                      )
                    }
                  />
                  <SmallBtn
                    label="حذف"
                    color="#ef4444"
                    onPress={() => void runAction(() => deleteService(svc.id), 'حُذفت الخدمة')}
                  />
                </View>
              </View>
            ))}
          </>
        ) : null}

        {section === 'taxonomy' ? (
          <TaxonomySection
            genres={genresQ.data ?? []}
            seriesList={seriesQ.data ?? []}
            runAction={runAction}
          />
        ) : null}
      </ScrollView>

      <PackageEditorModal
        visible={pkgModalOpen}
        pkg={editingPkg}
        categories={categoriesQ.data ?? []}
        onClose={() => setPkgModalOpen(false)}
        onSaved={() => {
          setPkgModalOpen(false);
          void packagesQ.refetch();
        }}
      />
    </View>
  );
}

function SmallBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#0b1220',
        borderWidth: 1,
        borderColor: color,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <Text style={{ color, fontFamily: FONT.bold, fontSize: 11 }}>{label}</Text>
    </Pressable>
  );
}

const cardRow = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  backgroundColor: '#141e30',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  padding: 12,
  gap: 8,
};

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

const primaryBarBtn = {
  backgroundColor: '#14b8a6',
  borderRadius: 10,
  paddingVertical: 11,
  alignItems: 'center' as const,
};
