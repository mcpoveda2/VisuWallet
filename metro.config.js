// metro.config.js (VERSIÓN CORRECTA)

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Agregar soporte para archivos .cjs
config.resolver.sourceExts.push('cjs');

// IMPORTANTE: Aplicar configuración de NativeWind
module.exports = withNativeWind(config, { input: './global.css' });