import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import AppButton from '@/components/ui/AppButton';
import Icon from '@/components/ui/Icon';
import KeyboardScroll from '@/components/ui/KeyboardScroll';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';

type SectionKey = 'packages' | 'categories' | 'services' | 'taxonomy';

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
    <View style={styles.screen}>
      <View style={styles.tabsHeader}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          <Chip
            label="الباقات"
            active={section === 'packages'}
            onPress={() => setSection('packages')}
          />
          <Chip
            label="التصنيفات"
            active={section === 'categories'}
            onPress={() => setSection('categories')}
          />
          <Chip
            label="الخدمات"
            active={section === 'services'}
            onPress={() => setSection('services')}
          />
          <Chip
            label="الأنواع والسلاسل"
            active={section === 'taxonomy'}
            onPress={() => setSection('taxonomy')}
          />
        </ScrollView>
      </View>

      <KeyboardScroll contentStyle={{ padding: 14, gap: 10 }} extraBottomPadding={36}>
        {section === 'packages' ? (
          <>
            <AppButton
              label="إنشاء باقة جديدة"
              icon="plus"
              onPress={() => {
                setEditingPkg(null);
                setPkgModalOpen(true);
              }}
            />

            {packagesQ.isLoading ? (
              <LoadingState message="جاري جلب الباقات..." />
            ) : packagesQ.isError ? (
              <ErrorState
                message="تعذر جلب الباقات"
                onRetry={() => void packagesQ.refetch()}
              />
            ) : !(packagesQ.data ?? []).length ? (
              <EmptyState message="لا توجد باقات حالياً" icon="package" />
            ) : (
              (packagesQ.data ?? []).map((pkg) => {
                const pkgGames = pkg.games ?? pkg.packageGames ?? [];
                const count = pkgGames.length;
                return (
                  <View key={pkg.id} style={styles.pkgCard}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.flex1}>
                        <Text style={styles.cardTitle}>
                          {pkg.name} {!pkg.is_active ? ' (مخفية)' : ''}
                        </Text>
                        <Text style={styles.pkgPrice}>
                          {formatDinar(Number(pkg.price))} • {count} لعبة
                        </Text>
                      </View>
                      <View style={styles.btnGroup}>
                        <SmallBtn
                          label="تعديل"
                          color="#2dd4bf"
                          onPress={() => {
                            setEditingPkg(pkg);
                            setPkgModalOpen(true);
                          }}
                        />
                        <SmallBtn
                          label="حذف"
                          color="#fca5a5"
                          onPress={() =>
                            void runAction(() => deletePackage(pkg.id), 'حُذفت الباقة')
                          }
                        />
                      </View>
                    </View>
                    {pkgGames.length > 0 ? (
                      <View style={styles.gamesTagsWrap}>
                        {pkgGames.slice(0, 6).map((g) => (
                          <View key={g.id} style={styles.gameTag}>
                            <Text style={styles.gameTagText} numberOfLines={1}>
                              {g.title}
                            </Text>
                          </View>
                        ))}
                        {pkgGames.length > 6 ? (
                          <View style={styles.gameTag}>
                            <Text style={styles.gameTagText}>
                              +{pkgGames.length - 6} أخرى
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </>
        ) : null}

        {section === 'categories' ? (
          <>
            <View style={styles.addRow}>
              <TextInput
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="اسم تصنيف جديد (مثل PS5)..."
                placeholderTextColor="#94a3b8"
                textAlign="right"
                style={[styles.inputBox, styles.flex1]}
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
                style={styles.addBtn}
              >
                <Icon name="plus" size={16} color="#042f2e" strokeWidth={2.4} />
                <Text style={styles.addBtnText}>إضافة</Text>
              </Pressable>
            </View>
            {categoriesQ.isError ? (
              <ErrorState
                message="تعذر جلب التصنيفات"
                onRetry={() => void categoriesQ.refetch()}
              />
            ) : (categoriesQ.data ?? []).map((cat) => (
              <View key={cat.id} style={styles.cardRow}>
                <Text style={[styles.cardTitle, styles.flex1]}>
                  {cat.name} {!cat.is_visible ? ' (مخفي)' : ''}
                </Text>
                <View style={styles.btnGroup}>
                  <SmallBtn
                    label={cat.is_visible ? 'إخفاء' : 'إظهار'}
                    color="#fbbf24"
                    onPress={() =>
                      void runAction(
                        () => updateCategory(cat.id, { is_visible: !cat.is_visible }),
                        'حُدّث ظهور التصنيف'
                      )
                    }
                  />
                  <SmallBtn
                    label="حذف"
                    color="#fca5a5"
                    onPress={() =>
                      void runAction(() => deleteCategory(cat.id), 'حُذف التصنيف')
                    }
                  />
                </View>
              </View>
            ))}
          </>
        ) : null}

        {section === 'services' ? (
          <>
            <View style={styles.addRow}>
              <TextInput
                value={newSvcTitle}
                onChangeText={setNewSvcTitle}
                placeholder="عنوان الخدمة..."
                placeholderTextColor="#94a3b8"
                textAlign="right"
                style={[styles.inputBox, { flex: 2 }]}
              />
              <TextInput
                value={newSvcPrice}
                onChangeText={setNewSvcPrice}
                placeholder="السعر"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                textAlign="right"
                style={[styles.inputBox, styles.flex1]}
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
                style={styles.addBtn}
              >
                <Icon name="plus" size={16} color="#042f2e" strokeWidth={2.4} />
                <Text style={styles.addBtnText}>إضافة</Text>
              </Pressable>
            </View>
            {servicesQ.isError ? (
              <ErrorState
                message="تعذر جلب الخدمات"
                onRetry={() => void servicesQ.refetch()}
              />
            ) : (servicesQ.data ?? []).map((svc) => (
              <View key={svc.id} style={styles.cardRow}>
                <View style={styles.flex1}>
                  <Text style={styles.cardTitle}>
                    {svc.title} {!svc.is_active ? ' (معطلة)' : ''}
                  </Text>
                  <Text style={styles.svcPrice}>
                    {formatDinar(Number(svc.price))}
                  </Text>
                </View>
                <View style={styles.btnGroup}>
                  <SmallBtn
                    label={svc.is_active ? 'تعطيل' : 'تفعيل'}
                    color="#fbbf24"
                    onPress={() =>
                      void runAction(
                        () => updateService(svc.id, { is_active: !svc.is_active }),
                        'حُدّثت الخدمة'
                      )
                    }
                  />
                  <SmallBtn
                    label="حذف"
                    color="#fca5a5"
                    onPress={() =>
                      void runAction(() => deleteService(svc.id), 'حُذفت الخدمة')
                    }
                  />
                </View>
              </View>
            ))}
          </>
        ) : null}

        {section === 'taxonomy' ? (
          genresQ.isError || seriesQ.isError ? (
            <ErrorState
              message="تعذر جلب الأنواع والسلاسل"
              onRetry={() => {
                void genresQ.refetch();
                void seriesQ.refetch();
              }}
            />
          ) : (
            <TaxonomySection
              genres={genresQ.data ?? []}
              seriesList={seriesQ.data ?? []}
              runAction={runAction}
            />
          )
        ) : null}
      </KeyboardScroll>

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

function SmallBtn({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.smallBtn, { borderColor: color }]}>
      <Text style={[styles.smallBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  flex1: { flex: 1 },
  tabsHeader: {
    padding: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabsScroll: {
    flexDirection: ROW,
    gap: 8,
  },
  pkgCard: {
    backgroundColor: '#131c2e',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131c2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    color: '#f8fafc',
    fontFamily: FONT.bold,
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  pkgPrice: {
    color: '#2dd4bf',
    fontFamily: FONT.bold,
    fontSize: 12.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    includeFontPadding: false,
  },
  svcPrice: {
    color: '#2dd4bf',
    fontFamily: FONT.bold,
    fontSize: 12.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    includeFontPadding: false,
  },
  gamesTagsWrap: {
    flexDirection: ROW,
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  gameTag: {
    backgroundColor: '#0b1324',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 160,
  },
  gameTagText: {
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    fontSize: 11,
    includeFontPadding: false,
  },
  btnGroup: {
    flexDirection: ROW,
    gap: 6,
  },
  smallBtn: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  smallBtnText: {
    fontFamily: FONT.bold,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  addRow: {
    flexDirection: ROW,
    gap: 8,
  },
  inputBox: {
    backgroundColor: '#131c2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    color: '#f8fafc',
    fontFamily: FONT.medium,
    paddingHorizontal: 12,
    paddingVertical: 9,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  addBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#14b8a6',
    borderWidth: 1,
    borderColor: '#2dd4bf',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  addBtnText: {
    color: '#042f2e',
    fontFamily: FONT.bold,
    fontSize: 13,
    includeFontPadding: false,
  },
});
