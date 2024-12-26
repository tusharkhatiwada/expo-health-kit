const { withPlugins } = require('@expo/config-plugins');

// This is the main plugin function that Expo will call
module.exports = (config, props = {}) => {
  // Ensure we only run this plugin for iOS
  if (!config.ios) {
    return config;
  }

  return withPlugins(config, [
    // Add HealthKit capabilities to Info.plist
    [
      require('./plugin/withHealthKit'),
      {
        healthShareUsageDescription:
          props.healthShareUsageDescription ||
          'This app requires access to Apple Health data to export your health and fitness information.',
        healthUpdateUsageDescription:
          props.healthUpdateUsageDescription ||
          'This app requires write access to Apple Health to save your health and fitness information.',
        requiredDataTypes: props.requiredDataTypes || [],
      },
    ],
  ]);
};
