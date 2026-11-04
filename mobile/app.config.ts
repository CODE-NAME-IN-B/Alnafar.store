import type { ExpoConfig } from 'expo/config';

/**
 * إعدادات تطبيق «الشاردة ستور» — المصدر الوحيد (لا app.json ثابت).
 * لا أسرار هنا إطلاقاً — المتغير الوحيد المعروف للتطبيق هو EXPO_PUBLIC_API_BASE.
 */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://alnafar-store.vercel.app/api';

const config: ExpoConfig = {
  name: 'الشاردة ستور',
  slug: 'alsharida-store',
  version: '1.0.7-beta',
  orientation: 'portrait',
  scheme: 'alsharida',
  userInterfaceStyle: 'dark',
  description:
    'تطبيق الشاردة ستور — متجر ألعاب النفار: استعراض الألعاب والباقات وإرسال الطلبات وتتبعها',
  icon: './assets/_brand/icon.png',
  primaryColor: '#0f1724',
  android: {
    package: 'com.inb.alsharda',
    versionCode: 7,
    adaptiveIcon: {
      foregroundImage: './assets/_brand/icon-maskable.png',
      backgroundColor: '#0f1724',
    },
    softwareKeyboardLayoutMode: 'resize',
  },
  ios: {
    bundleIdentifier: 'com.inb.alsharda',
    supportsTablet: true,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  assetBundlePatterns: ['assets/**'],
  plugins: [
    'expo-router',
    'expo-asset',
    [
      /**
       * تقليص حجم APK: الإعداد الافتراضي يضمّن 4 بنيات معالجة
       * (arm64 + v7a + x86 + x86_64) ≈ 123MB — نحتفظ بالبنيتين الواقعيتين
       * للهواتف فقط، فينزل الحجم للنصف تقريباً.
       */
      'expo-build-properties',
      {
        android: {
          buildArchs: ['arm64-v8a', 'armeabi-v7a'],
        },
      },
    ],
    [
      'expo-localization',
      {
        // التطبيق عربي بالكامل: إجبار اتجاه RTL (سلوك SDK 58)
        forcesRTL: true,
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/_brand/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#0f1724',
      },
    ],
    [
      'expo-notifications',
      {
        /* أيقونة شريط الإشعارات: ظليّة بيضاء-شفافة (النظام يلوّنها) —
           الأيقونة الملونة كاملة لا تظهر جيدة على الشريط */
        icon: './assets/android-icon-monochrome.png',
        largeIcon: './assets/_brand/icon.png',
        color: '#14b8a6',
        androidMode: 'default',
      },
    ],
  ],
  experiments: {
    tsconfigPaths: true,
  },
  extra: {
    apiBase: API_BASE,
    /** projectId لـ Expo Push — ثابت لكل البنى (أنشئ عبر eas init) */
    eas: {
      projectId: '8962809d-2820-4cbc-992d-f7e2b5ef61f7',
    },
  },
};

export default config;
