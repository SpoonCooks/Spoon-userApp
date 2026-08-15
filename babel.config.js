/** @type {import('@babel/core').ConfigFunction} */
module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin must be listed last (required by react-native-reanimated 4).
    plugins: ['react-native-worklets/plugin'],
  };
};
