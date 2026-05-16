// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Manually wire @/ aliases so Metro and TypeScript stay in sync without
// needing the babel-plugin-module-resolver dependency.
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, 'src'),
  '@app': path.resolve(__dirname, 'app'),
  '@assets': path.resolve(__dirname, 'assets'),
};

config.resolver.unstable_enablePackageExports = true;

module.exports = config;
