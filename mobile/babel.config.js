/**
 * إعدادات Babel القياسية لـ Expo SDK 58
 * إضافة إلزامية: Worklets Babel plugin — يلزم لكل worklets المواضيع التي تصنعها
 * مكتبة الحركة (react-native-reanimated 4 / react-native-worklets). يجب أن يكون آخر plugin.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
