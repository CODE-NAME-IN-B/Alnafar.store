/**
 * الخطوط الجديدة للهوية (قرار §12.1 المعتمد):
 * - عربي: IBM Plex Sans Arabic — نفس عائلة موقع التحميل حرفياً (00b-web-reference §C)
 * - لاتيني/أرقام/شعار: Space Grotesk — للـ brand ALNAFAR والأرقام «01» المعزولة LTR
 * يُحمَّلون في الجذر (src/app/_layout.tsx) مع Cairo القديم حتى اكتمال ترحيل الشاشات.
 */
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

/** أسماء العائلة العربية استعمالاً في styles */
export const AR_FONT = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

/** أسماء العائلة اللاتينية (الشعار/الأرقام المعزولة LTR) */
export const LAT_FONT = {
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
} as const;

/** يُمرَّر مباشرة إلى useFonts في الجذر */
export const DESIGN_FONTS = {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} as const;
