import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * تخزين مساعد: التوكن في SecureStore، والبقية في AsyncStorage.
 * مطابقة localStorage في الواجهة لكن بأدوات أصلية.
 */
export async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // المحاكيات قد لا تدعم SecureStore — نجرب AsyncStorage كخطة أخيرة
    await AsyncStorage.setItem(key, value);
  }
}

export async function secureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // تجاهل — المفتاح غير موجود
  }
}

export async function jsonGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function jsonSet(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // تخزين ممتلئ أو غير متاح — نتجاهل بصمت
  }
}
