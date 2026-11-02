import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import { CAIRO_FONTS } from '@/lib/fonts';
import { colors } from '@/lib/colors';
import { registerForPushNotifications, useForegroundNotifications } from '@/lib/notifications';
import TrackedOrderWatcher from '@/components/track/TrackedOrderWatcher';
import { setTokenGetter, setUnauthorizedHandler } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import ToastHost from '@/components/ui/ToastHost';

// نمنع إخفاء شاشة البدء حتى تجهز الخطوط
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** جذر التطبيق: الخطوط، المزودون، والمسارات */
export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts(CAIRO_FONTS);

  useEffect(() => {
    // قراءة الجلسة والحالة المحفوظة مرة واحدة عند الإقلاع + لون خلفية النظام
    void useAuthStore.getState().hydrate();
    void useAppStore.getState().hydrate();
    void SystemUI.setBackgroundColorAsync('#0f1724');
    // طلب صلاحية الإشعارات وتسجيل الجهاز (فشل صامت في Expo Go)
    void registerForPushNotifications();
  }, []);

  // إشعارات الواجهة الأمامية → Toast داخل التطبيق
  useForegroundNotifications();

  useEffect(() => {
    // خطاطيف عميل الـ API: التوكن من مخزن الجلسة، والـ 401 يطرد للدخول
    setTokenGetter(() => useAuthStore.getState().token);
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().clearAuth();
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.base },
            }}
          >
            <Stack.Screen name="(store)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="track/[id]" />
          </Stack>
          {/* مراقب الطلبات المحفوظة محلياً — إشعار «جاهز للاستلام» حتى خارج شاشة التتبع */}
          <TrackedOrderWatcher />
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
