module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Path aliases (@/, @app/, @assets/) are resolved by Metro via the
    // tsconfig "paths" field — no Babel plugin required when running on
    // Expo SDK 51 with TypeScript.
    plugins: [
      // Reanimated MUST be the last plugin in the list.
      'react-native-reanimated/plugin',
    ],
  };
};
