import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Tabs } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { isSuperAdmin, useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import { fetchBranches } from '@/api/branches';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
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

  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* شريط علوي مدمج للوحة الإدارة */}
      <View style={styles.topBar}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Icon name="user" size={16} color="#2dd4bf" />
          </View>
          <View style={styles.userTextCol}>
            <Text style={styles.title}>لوحة الإدارة</Text>
            <Text style={styles.subtitle}>
              {user?.username ?? 'موظف'} • {user?.role === 'admin' ? 'مدير' : 'موظف'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => router.replace('/(store)')}
            style={[styles.topBtn, styles.storeBtn]}
            accessibilityLabel="العودة إلى المتجر (وضع الكاشير)"
          >
            <Icon name="store" size={14} color="#2dd4bf" />
            <Text style={styles.storeBtnText}>كاشير المتجر</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              await logout();
              router.replace('/(store)');
            }}
            style={[styles.topBtn, styles.logoutBtn]}
            accessibilityLabel="تسجيل الخروج"
          >
            <Icon name="logout" size={14} color="#fca5a5" />
            <Text style={styles.logoutBtnText}>خروج</Text>
          </Pressable>
        </View>
      </View>

      {/* محدد الفرع للأدمن الرئيسي فقط */}
      {superAdmin && branches.data && branches.data.length > 1 ? (
        <View style={styles.branchBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.branchScroll}
          >
            <Chip
              label="كل الفروع"
              compact
              active={adminScopeBranchId === 'all'}
              onPress={() => setAdminScopeBranch('all')}
            />
            {branches.data.map((b) => (
              <Chip
                key={b.id}
                label={b.name}
                compact
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
          tabBarActiveTintColor: '#2dd4bf',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1e293b',
            borderTopWidth: 1,
            height: 58 + bottomPad,
            paddingBottom: bottomPad,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontFamily: FONT.bold,
            fontSize: 11,
            includeFontPadding: false,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'الفواتير',
            tabBarIcon: ({ color }) => <Icon name="invoice" size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="daily-report"
          options={{
            title: 'الجرد اليومي',
            tabBarIcon: ({ color }) => <Icon name="report" size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="games"
          options={{
            title: 'الألعاب',
            tabBarIcon: ({ color }) => <Icon name="gamepad" size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="catalog"
          options={{
            title: 'الأقسام',
            tabBarIcon: ({ color }) => <Icon name="tag" size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'الإعدادات',
            tabBarIcon: ({ color }) => <Icon name="settings" size={20} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  topBar: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  userRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(20,184,166,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTextCol: {
    alignItems: 'flex-end',
  },
  title: {
    color: '#f8fafc',
    fontFamily: FONT.bold,
    fontSize: 15,
    includeFontPadding: false,
  },
  subtitle: {
    color: '#94a3b8',
    fontFamily: FONT.medium,
    fontSize: 11,
    includeFontPadding: false,
  },
  actionsRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  topBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  storeBtn: {
    borderColor: 'rgba(45,212,191,0.45)',
    backgroundColor: 'rgba(20,184,166,0.14)',
  },
  storeBtnText: {
    color: '#5eead4',
    fontFamily: FONT.bold,
    fontSize: 12,
    includeFontPadding: false,
  },
  logoutBtn: {
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  logoutBtnText: {
    color: '#fca5a5',
    fontFamily: FONT.bold,
    fontSize: 12,
    includeFontPadding: false,
  },
  branchBar: {
    backgroundColor: '#090d16',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  branchScroll: {
    flexDirection: ROW,
    gap: 8,
    paddingHorizontal: 12,
  },
});
