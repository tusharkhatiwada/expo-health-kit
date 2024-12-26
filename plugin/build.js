const { withPlugins } = require('@expo/config-plugins');

// This file is used during the build process and not bundled with the app
module.exports = function withHealthKit(config, props = {}) {
  if (!config.ios) {
    return config;
  }

  return withPlugins(config, [
    [
      require('../build/plugin/withHealthKit').default,
      {
        healthShareUsageDescription: props.healthShareUsageDescription,
        healthUpdateUsageDescription: props.healthUpdateUsageDescription,
        requiredDataTypes: props.requiredDataTypes,
      },
    ],
  ]);
};
