const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Agregar .csv a las extensiones de assets
config.resolver.assetExts.push('csv');

// Deshabilitar package exports para compatibilidad con victory-native
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './global.css' });
