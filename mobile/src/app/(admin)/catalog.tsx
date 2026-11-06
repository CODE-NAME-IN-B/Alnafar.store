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
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';

type SectionKey = 'packages' | 'categories' | 'services' | 'taxonomy';

export default function AdminCatalogScreen() {
  const palette = usePalette();
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
    <View style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <View
        style={[
          styles.tabsHeader,
          {
            backgroundColor: palette.canvas,
            borderBottomColor: palette.surfaceLine,
          },
        ]}
      >
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
                  <View
                    key={String(pkg.id)}
                    style={[
                      styles.pkgCard,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.surfaceLine,
                      },
                    ]}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={styles.flex1}>
                        <Text style={[styles.cardTitle, { color: palette.text }]}>
                          {pkg.name} {!pkg.is_active ? ' (مخفية)' : ''}
                        </Text>
                        <Text style={[styles.pkgPrice, { color: palette.money }]}>
                          {formatDinar(Number(pkg.price))} • {count} لعبة
                        </Text>
                      </View>
                      <View style={styles.btnGroup}>
                        <SmallBtn
                          label="تعديل"
                          onPress={() => {
                            setEditingPkg(pkg);
                            setPkgModalOpen(true);
                          }}
                        />
                        <SmallBtn
                          label="حذف"
                          danger
                          onPress={() =>
                            void runAction(() => deletePackage(pkg.id), 'حُذفت الباقة')
                          }
                        />
                      </View>
                    </View>
                    {pkgGames.length > 0 ? (
                      <View
                        style={[
                          styles.gamesTagsWrap,
                          { borderTopColor: palette.surfaceLine },
                        ]}
                      >
                        {pkgGames.slice(0, 6).map((g) => (
                          <View
                            key={String(g.id)}
                            style={[
                              styles.gameTag,
                              {
                                backgroundColor: palette.surfaceRaised,
                                borderColor: palette.surfaceLine,
                              },
                            ]}
                          >
                            <Text
                              style={[styles.gameTagText, { color: palette.textSub }]}
                              numberOfLines={1}
                            >
                              {g.title}
                            </Text>
                          </View>
                        ))}
                        {pkgGames.length > 6 ? (
                          <View
                            style={[
                              styles.gameTag,
                              {
                                backgroundColor: palette.surfaceRaised,
                                borderColor: palette.surfaceLine,
                              },
                            ]}
                          >
                            <Text style={[styles.gameTagText, { color: palette.textSub }]}>
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
                placeholder="اسم تصنيف جديد..."
                placeholderTextColor={palette.textFaint}
                textAlign="right"
                style={[
                  styles.inputBox,
                  styles.flex1,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.surfaceLine,
                    color: palette.text,
                  },
                ]}
              />
              <Pressable
                onPress={() => {
                  if (!newCatName.trim()) return;
                  void runAction(async () => {
                    await createCategory(newCatName.trim());
                    setNewCatName('');
                  }, 'أضيف التصنيف');
                }}
                style={({ pressed }) => [
                  styles.addBtn,
                  {
                    backgroundColor: pressed ? palette.primaryPressed : palette.primary,
                    borderColor: palette.primary,
                  },
                ]}
              >
                <Icon name="plus" size={15} color={palette.onPrimary} />
                <Text style={[styles.addBtnText, { color: palette.onPrimary }]}>إضافة</Text>
              </Pressable>
            </View>

            {categoriesQ.isLoading ? (
              <LoadingState message="جاري جلب التصنيفات..." />
            ) : categoriesQ.isError ? (
              <ErrorState
                message="تعذر جلب التصنيفات"
                onRetry={() => void categoriesQ.refetch()}
              />
            ) : !(categoriesQ.data ?? []).length ? (
              <EmptyState message="لا توجد تصنيفات بعد" icon="tag" />
            ) : (
              (categoriesQ.data ?? []).map((cat) => (
                <View
                  key={String(cat.id)}
                  style={[
                    styles.cardRow,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.surfaceLine,
                    },
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{cat.name}</Text>
                  <View style={styles.btnGroup}>
                    <SmallBtn
                      label={cat.is_active ? 'تعطيل' : 'تفعيل'}
                      onPress={() =>
                        void runAction(
                          () => updateCategory(cat.id, { is_visible: !cat.is_active }),
                          'تم تحديث الحالة'
                        )
                      }
                    />
                    <SmallBtn
                      label="حذف"
                      danger
                      onPress={() =>
                        void runAction(() => deleteCategory(cat.id), 'حُذف التصنيف')
                      }
                    />
                  </View>
                </View>
              ))
            )}
          </>
        ) : null}

        {section === 'services' ? (
          <>
            <View style={{ gap: 8 }}>
              <TextInput
                value={newSvcTitle}
                onChangeText={setNewSvcTitle}
                placeholder="عنوان الخدمة الجديدة..."
                placeholderTextColor={palette.textFaint}
                textAlign="right"
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.surfaceLine,
                    color: palette.text,
                  },
                ]}
              />
              <View style={styles.addRow}>
                <TextInput
                  value={newSvcPrice}
                  onChangeText={setNewSvcPrice}
                  placeholder="السعر (د.ل)"
                  placeholderTextColor={palette.textFaint}
                  keyboardType="numeric"
                  textAlign="right"
                  style={[
                    styles.inputBox,
                    styles.flex1,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.surfaceLine,
                      color: palette.text,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => {
                    const price = Number(newSvcPrice);
                    if (!newSvcTitle.trim() || isNaN(price)) {
                      showToast('أدخل عنواناً وسعراً صالحين', 'error');
                      return;
                    }
                    void runAction(async () => {
                      await createService({ title: newSvcTitle.trim(), price });
                      setNewSvcTitle('');
                      setNewSvcPrice('');
                    }, 'أضيفت الخدمة');
                  }}
                  style={({ pressed }) => [
                    styles.addBtn,
                    {
                      backgroundColor: pressed ? palette.primaryPressed : palette.primary,
                      borderColor: palette.primary,
                    },
                  ]}
                >
                  <Icon name="plus" size={15} color={palette.onPrimary} />
                  <Text style={[styles.addBtnText, { color: palette.onPrimary }]}>إضافة</Text>
                </Pressable>
              </View>
            </View>

            {servicesQ.isLoading ? (
              <LoadingState message="جاري جلب الخدمات..." />
            ) : servicesQ.isError ? (
              <ErrorState
                message="تعذر جلب الخدمات"
                onRetry={() => void servicesQ.refetch()}
              />
            ) : !(servicesQ.data ?? []).length ? (
              <EmptyState message="لا توجد خدمات إضافية" icon="sparkles" />
            ) : (
              (servicesQ.data ?? []).map((svc) => (
                <View
                  key={String(svc.id)}
                  style={[
                    styles.cardRow,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.surfaceLine,
                    },
                  ]}
                >
                  <View style={styles.flex1}>
                    <Text style={[styles.cardTitle, { color: palette.text }]}>{svc.title}</Text>
                    <Text style={[styles.svcPrice, { color: palette.money }]}>
                      {formatDinar(Number(svc.price))}
                    </Text>
                  </View>
                  <View style={styles.btnGroup}>
                    <SmallBtn
                      label={svc.is_active ? 'تعطيل' : 'تفعيل'}
                      onPress={() =>
                        void runAction(
                          () => updateService(svc.id, { is_active: !svc.is_active }),
                          'تم تحديث الحالة'
                        )
                      }
                    />
                    <SmallBtn
                      label="حذف"
                      danger
                      onPress={() =>
                        void runAction(() => deleteService(svc.id), 'حُذفت الخدمة')
                      }
                    />
                  </View>
                </View>
              ))
            )}
          </>
        ) : null}

        {section === 'taxonomy' ? (
          <TaxonomySection
            genres={genresQ.data ?? []}
            seriesList={seriesQ.data ?? []}
            runAction={runAction}
          />
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
  danger,
  onPress,
}: {
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallBtn,
        {
          backgroundColor: danger
            ? pressed ? palette.danger + '25' : palette.danger + '14'
            : pressed ? palette.surfaceLine : palette.surfaceRaised,
          borderColor: danger ? palette.danger + '40' : palette.surfaceLine,
        },
      ]}
    >
      <Text
        style={[
          styles.smallBtnText,
          { color: danger ? palette.danger : palette.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex1: { flex: 1 },
  tabsHeader: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabsScroll: {
    flexDirection: ROW,
    gap: 8,
    paddingHorizontal: 14,
  },
  pkgCard: {
    borderRadius: 16,
    borderWidth: 1,
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
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  pkgPrice: {
    fontFamily: AR_FONT.bold,
    fontSize: 12.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    includeFontPadding: false,
  },
  svcPrice: {
    fontFamily: AR_FONT.bold,
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
    paddingTop: 8,
  },
  gameTag: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 160,
  },
  gameTagText: {
    fontFamily: AR_FONT.medium,
    fontSize: 11,
    includeFontPadding: false,
  },
  btnGroup: {
    flexDirection: ROW,
    gap: 6,
  },
  smallBtn: {
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  smallBtnText: {
    fontFamily: AR_FONT.bold,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  addRow: {
    flexDirection: ROW,
    gap: 8,
  },
  inputBox: {
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: AR_FONT.medium,
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
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  addBtnText: {
    fontFamily: AR_FONT.bold,
    fontSize: 13,
    includeFontPadding: false,
  },
});
