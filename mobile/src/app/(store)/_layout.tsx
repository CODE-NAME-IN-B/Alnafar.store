import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useCartStore, cartCount } from '@/stores/cart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginScreen from '../login';
import Icon, { IconName } from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';

function TabIcon({
  icon,
  focused,
  badge,
}: {
  icon: IconName;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.tabIconWrap}>
      <Icon
        name={icon}
        size={22}
        color={focused ? '#2dd4bf' : '#94a3b8'}
        strokeWidth={focused ? 2.2 : 1.8}
      />
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function StoreLayout() {
  const selectedBranchId = useAppStore((s) => s.selectedBranchId);
  const selectBranch = useAppStore((s) => s.selectBranch);
  const appReady = useAppStore((s) => s.ready);
  const token = useAuthStore((s) => s.token);
  const guest = useAuthStore((s) => s.guest);
  const authReady = useAuthStore((s) => s.ready);
  const items = useCartStore((s) => s.items);
  const count = cartCount(items);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (appReady && !selectedBranchId) {
      selectBranch(1);
    }
  }, [appReady, selectedBranchId, selectBranch]);

  // Match the main website gate: if neither logged in nor in guest mode, show Login / Guest Gate
  if (authReady && !token && !guest) {
    return <LoginScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#090f1d',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          // S2/V4: احترام شريط الإيماءات بالكامل (Arabic RTL + Android gesture bar)
          height: 66 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 7,
        },
        tabBarActiveTintColor: '#2dd4bf',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontFamily: FONT.bold,
          fontSize: 12,
          includeFontPadding: false,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'المتجر',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="store" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="packages"
        options={{
          title: 'الباقات',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="package" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: token ? 'فاتورة الكاشير' : 'السلة',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="cart" focused={focused} badge={count} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 36,
    height: 28,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    paddingHorizontal: 4,
    backgroundColor: '#14b8a6',
    borderWidth: 1.5,
    borderColor: '#090f1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FONT.bold,
    color: '#042f2e',
    fontSize: 10,
    includeFontPadding: false,
  },
});
