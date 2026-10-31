/** إعدادات Babel القياسية لـ Expo SDK 55 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
