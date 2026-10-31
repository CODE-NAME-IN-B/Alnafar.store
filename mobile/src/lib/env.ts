/** عنوان الـ API الوحيد المعروف للتطبيق — يُقرأ من EXPO_PUBLIC_API_BASE */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? 'https://alnafar-store.vercel.app/api';

/** عنوان الموقع (بدون /api) لبناء روابط تتبع الطلب والـ QR */
export const WEB_BASE = API_BASE.replace(/\/api\/?$/, '');
