import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from '@expo-google-fonts/cairo';

/** أسماء عائلة خط Cairo كما توفرها @expo-google-fonts/cairo */
export const FONT = {
  regular: 'Cairo_400Regular',
  medium: 'Cairo_500Medium',
  semibold: 'Cairo_600SemiBold',
  bold: 'Cairo_700Bold',
} as const;

/** تُمرّر مباشرة إلى useFonts في الجذر */
export const CAIRO_FONTS = {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} as const;
