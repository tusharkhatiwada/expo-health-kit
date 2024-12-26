// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add any custom config here
config.resolver.blockList = [
  // Exclude all files in the plugin directory
  /plugin\/.*/,
  // Exclude config plugins from bundling
  /@expo\/config-plugins\/.*/,
  // Exclude app.plugin.js
  /app\.plugin\.js$/,
];

module.exports = config;
