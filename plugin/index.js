// @ts-nocheck
const { withPlugins } = require('@expo/config-plugins');
const withHealthKit = require('./withHealthKit');

module.exports = config => {
  return withPlugins(config, [
    [
      withHealthKit,
      {
        healthShareUsageDescription:
          'This app requires access to Apple Health data to export your health and fitness information.',
        healthUpdateUsageDescription:
          'This app requires write access to Apple Health to save your health and fitness information.',
      },
    ],
  ]);
};
