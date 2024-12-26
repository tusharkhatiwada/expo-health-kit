const { withPlugins } = require('@expo/config-plugins');
const withHealthKit = require('./build/plugin/withHealthKit').default;

module.exports = config => {
  return withPlugins(config, [
    // Add HealthKit capabilities to Info.plist
    [
      withHealthKit,
      {
        // Optional: Allow customizing the usage description
        healthShareUsageDescription:
          'This app requires access to Apple Health data to export your health and fitness information.',
        healthUpdateUsageDescription:
          'This app requires write access to Apple Health to save your health and fitness information.',
        // Optional: Specify which data types to request by default
        requiredDataTypes: [],
      },
    ],
  ]);
};
