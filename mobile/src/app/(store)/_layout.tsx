import { Tabs } from 'expo-router';
import { cartCount, useCartStore } from '@/stores/cart';
import { useAppStore } from '@/stores/app';
import BranchGate from '@/components/store/BranchGate';
import { FONT } from '@/lib/fonts';

/**
 * تخطيط مجموعة المتجر:
 * قبل اختيار الفرع تظهر بوابة الفروع، وبعدها تبويبات سفلية (المتجر/الباقات/السلة).
 */
export default function StoreLayout() {
  const selectedBranchId = useAppStore((s) => s.selectedBranchId);
  const appReady = useAppStore((s) => s.ready);
  const items = useCartStore((s) => s.items);
  const count = cartCount(items);

  if (!appReady) {
    return null;
  }

  if (!selectedBranchId) {
    return <BranchGate />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#14b8a6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#141e30',
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarLabelStyle: { fontFamily: FONT.medium, fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'المتجر' }} />
      <Tabs.Screen name="packages" options={{ title: 'الباقات' }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'السلة',
          tabBarBadge: count > 0 ? count : undefined,
        }}
      />
    </Tabs>
  );
}
