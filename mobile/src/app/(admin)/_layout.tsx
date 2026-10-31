import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, Tabs } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isSuperAdmin, useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import { fetchBranches } from '@/api/branches';
import Chip from '@/components/ui/Chip';
import { FONT } from '@/lib/fonts';

/**
 * تخطيط لوحة الإدارة بالتبويبات السفلية (المرحلة 6).
 * يحمي المسارات بالتوكن ويعرض شريط نطاق الفروع للمدير الرئيسي.
 */
export default function AdminLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.ready);
  const logout = useAuthStore((s) => s.logout);

  const adminScopeBranchId = useAppStore((s) => s.adminScopeBranchId);
  const setAdminScopeBranch = useAppStore((s) => s.setAdminScopeBranch);
  const superAdmin = isSuperAdmin(user);

  const branches = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
    enabled: !!token && superAdmin,
  });

  useEffect(() => {
    if (authReady && !token) {
      router.replace('/login');
    }
  }, [authReady, token]);

  if (!authReady || !token) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f1724' }} edges={['top']}>
      {/* شريط علوي للوحة الإدارة */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: '#141e30',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => router.replace('/(store)')}
            style={topBtn}
            accessibilityLabel="العودة إلى المتجر"
          >
            <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 12 }}>
              ← المتجر
            </Text>
          </Pressable>
          <View>
            <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 14 }}>
              لوحة الإدارة
            </Text>
            <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 11 }}>
              {user?.username ?? 'موظف'} • {user?.role === 'admin' ? 'مدير' : 'موظف'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={async () => {
            await logout();
            router.replace('/(store)');
          }}
          style={[topBtn, { borderColor: 'rgba(239,68,68,0.35)' }]}
          accessibilityLabel="تسجيل الخروج"
        >
          <Text style={{ color: '#fca5a5', fontFamily: FONT.bold, fontSize: 12 }}>خروج</Text>
        </Pressable>
      </View>

      {/* محدد الفرع للأدمن الرئيسي فقط */}
      {superAdmin && branches.data && branches.data.length > 1 ? (
        <View style={{ backgroundColor: '#0b1220', paddingVertical: 6 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 14 }}
          >
            <Chip
              label="كل الفروع"
              active={adminScopeBranchId === 'all'}
              onPress={() => setAdminScopeBranch('all')}
            />
            {branches.data.map((b) => (
              <Chip
                key={b.id}
                label={b.name}
                active={adminScopeBranchId === b.id}
                onPress={() => setAdminScopeBranch(b.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#14b8a6',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: {
            backgroundColor: '#141e30',
            borderTopColor: 'rgba(255,255,255,0.08)',
          },
          tabBarLabelStyle: { fontFamily: FONT.bold, fontSize: 11 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'الفواتير' }} />
        <Tabs.Screen name="daily-report" options={{ title: 'الجرد اليومي' }} />
        <Tabs.Screen name="games" options={{ title: 'الألعاب' }} />
        <Tabs.Screen name="catalog" options={{ title: 'الأقسام' }} />
        <Tabs.Screen name="more" options={{ title: 'الإعدادات' }} />
      </Tabs>
    </SafeAreaView>
  );
}

const topBtn = {
  backgroundColor: '#0b1220',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  paddingHorizontal: 10,
  paddingVertical: 5,
} as const;
