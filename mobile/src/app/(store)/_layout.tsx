import React, { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useCartStore, cartCount } from '@/stores/cart';
import { usePalette } from '@/design/theme';
import { AR_FONT } from '@/design/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';

function TabIcon({
  icon,
  focused,
  badge,
  activeColor,
  inactiveColor,
  badgeBg,
  badgeText,
}: {
  icon: IconName;
  focused: boolean;
  badge?: number;
  activeColor: string;
  inactiveColor: string;
  badgeBg: string;
  badgeText: string;
}) {
  return (
    <View style={styles.tabIconWrap}>
      <Icon
        name={icon}
        size={22}
        color={focused ? activeColor : inactiveColor}
        strokeWidth={focused ? 2.2 : 1.8}
      />
      {badge && badge > 0 ? (
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeText }]}>{badge > 99 ? '99+' : badge}</Text>
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
  const palette = usePalette();

  useEffect(() => {
    if (appReady && !selectedBranchId) {
      selectBranch(1);
    }
  }, [appReady, selectedBranchId, selectBranch]);

  // Match the main website gate: if neither logged in nor in guest mode, redirect cleanly to Login
  if (authReady && !token && !guest) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.canvas,
          borderTopColor: palette.surfaceLine,
          borderTopWidth: 1,
          // S2/V4: احترام شريط الإيماءات بالكامل (Arabic RTL + Android gesture bar)
          height: 66 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 7,
        },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarLabelStyle: {
          fontFamily: AR_FONT.bold,
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
            <TabIcon icon="store" focused={focused} activeColor={palette.primary} inactiveColor={palette.textFaint} badgeBg={palette.accent} badgeText={palette.onAccent} />
          ),
        }}
      />
      <Tabs.Screen
        name="packages"
        options={{
          title: 'الباقات',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="package" focused={focused} activeColor={palette.primary} inactiveColor={palette.textFaint} badgeBg={palette.accent} badgeText={palette.onAccent} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: token ? 'فاتورة الكاشير' : 'السلة',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="cart" focused={focused} badge={count} activeColor={palette.primary} inactiveColor={palette.textFaint} badgeBg={palette.accent} badgeText={palette.onAccent} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'المزيد',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="more" focused={focused} activeColor={palette.primary} inactiveColor={palette.textFaint} badgeBg={palette.accent} badgeText={palette.onAccent} />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: AR_FONT.bold,
    fontSize: 10,
    includeFontPadding: false,
  },
});
