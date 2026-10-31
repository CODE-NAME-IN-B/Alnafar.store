/** إعدادات Babel لـ NativeWind v4 (الإعداد الرسمي) — بدون إضافات من حلينا */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
