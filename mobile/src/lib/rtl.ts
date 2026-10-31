import { I18nManager, TextStyle, ViewStyle } from 'react-native';

/**
 * In Expo Go on LTR Android/iOS devices, I18nManager.isRTL is false until a native reload
 * (which Expo Go doesn't always persist on first open).
 * Using ROW ('row-reverse' when LTR, 'row' when RTL) guarantees that Arabic horizontal
 * layouts ALWAYS flow Right-to-Left (first child on the RIGHT, last child on the LEFT).
 */
export const isSystemRTL = I18nManager.isRTL;

export const ROW: ViewStyle['flexDirection'] = isSystemRTL ? 'row' : 'row-reverse';
export const ROW_REV: ViewStyle['flexDirection'] = isSystemRTL ? 'row-reverse' : 'row';

export const ALIGN_START: ViewStyle['alignItems'] = isSystemRTL ? 'flex-start' : 'flex-end';
export const ALIGN_END: ViewStyle['alignItems'] = isSystemRTL ? 'flex-end' : 'flex-start';

export const SELF_START: ViewStyle['alignSelf'] = isSystemRTL ? 'flex-start' : 'flex-end';
export const SELF_END: ViewStyle['alignSelf'] = isSystemRTL ? 'flex-end' : 'flex-start';

export const TXT_RTL: TextStyle = {
  textAlign: 'right',
  writingDirection: 'rtl',
  includeFontPadding: false,
};
