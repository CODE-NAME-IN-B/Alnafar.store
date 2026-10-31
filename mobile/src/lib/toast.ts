/**
 * توست بسيط عبر Host في جذر التطبيق + دالة show من أي مكان.
 * بديل utils/toast.js في الواجهة (success/error فقط).
 */
import { Alert } from 'react-native';

export type ToastKind = 'error' | 'success';

let handler: ((message: string, kind: ToastKind) => void) | null = null;

export function registerToast(fn: (message: string, kind: ToastKind) => void): void {
  handler = fn;
}

export function showToast(message: string, kind: ToastKind = 'success'): void {
  if (handler) {
    handler(message, kind);
    return;
  }
  // قبل تسجيل الـ Host نستخدم تنبيه النظام كاحتياط
  if (kind === 'error') Alert.alert('تنبيه', message);
}
