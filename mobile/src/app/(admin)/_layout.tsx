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
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ROW } from '@/lib/rtl';

export default function AdminLayout() {
  const palette = usePalette();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.canvas }]} edges={['top']}>
      {/* شريط علوي مدمج للوحة الإدارة */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: palette.canvas,
            borderBottomColor: palette.surfaceLine,
          },
        ]}
      >
        <View style={styles.userRow}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: palette.surfaceRaised,
                borderColor: palette.surfaceLine,
              },
            ]}
          >
            <Icon name="user" size={16} color={palette.primary} />
          </View>
          <View style={styles.userTextCol}>
            <Text style={[styles.title, { color: palette.text }]}>لوحة الإدارة</Text>
            <Text style={[styles.subtitle, { color: palette.textSub }]}>
              {user?.username ?? 'موظف'} • {user?.role === 'admin' ? 'مدير' : 'موظف'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => router.replace('/(store)')}
            style={({ pressed }) => [
              styles.topBtn,
              {
                backgroundColor: pressed ? palette.surfaceLine : palette.surfaceRaised,
                borderColor: palette.surfaceLine,
              },
            ]}
            accessibilityLabel="العودة إلى المتجر (وضع الكاشير)"
          >
            <Icon name="store" size={14} color={palette.primary} />
            <Text style={[styles.storeBtnText, { color: palette.text }]}>كاشير المتجر</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              await logout();
              router.replace('/(store)');
            }}
            style={({ pressed }) => [
              styles.topBtn,
              {
                backgroundColor: pressed ? palette.danger + '25' : palette.danger + '14',
                borderColor: palette.danger + '40',
              },
            ]}
            accessibilityLabel="تسجيل الخروج"
          >
            <Icon name="logout" size={14} color={palette.danger} />
            <Text style={[styles.logoutBtnText, { color: palette.danger }]}>خروج</Text>
          </Pressable>
        </View>
      </View>

      {/* محدد الفرع للأدمن الرئيسي فقط */}
      {superAdmin && branches.data && branches.data.length > 1 ? (
        <View
          style={[
            styles.branchBar,
            {
              backgroundColor: palette.canvas,
              borderBottomColor: palette.surfaceLine,
            },
          ]}
        >
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
                key={String(b.id)}
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
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.textFaint,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: palette.surface,
            borderTopColor: palette.surfaceLine,
            borderTopWidth: 1,
            height: 56 + bottomPad,
            paddingBottom: bottomPad,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontFamily: AR_FONT.bold,
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
  },
  topBar: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTextCol: {
    justifyContent: 'center',
  },
  title: {
    fontFamily: AR_FONT.bold,
    fontSize: 15,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: AR_FONT.medium,
    fontSize: 11,
    marginTop: 1,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  storeBtnText: {
    fontFamily: AR_FONT.bold,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  logoutBtnText: {
    fontFamily: AR_FONT.bold,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  branchBar: {
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  branchScroll: {
    flexDirection: ROW,
    gap: 6,
    paddingHorizontal: 14,
  },
});
