const { withInfoPlist, withEntitlementsPlist, withXcodeProject } = require('@expo/config-plugins');

const withHealthKitPlist = (config, props = {}) => {
  return withInfoPlist(config, config => {
    const {
      healthShareUsageDescription = 'Allow this app to access your health data',
      healthUpdateUsageDescription = 'Allow this app to save health data',
    } = props;

    config.modResults.NSHealthShareUsageDescription = healthShareUsageDescription;
    config.modResults.NSHealthUpdateUsageDescription = healthUpdateUsageDescription;

    return config;
  });
};

const withHealthKitEntitlements = config => {
  return withEntitlementsPlist(config, config => {
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = [];
    return config;
  });
};

const withHealthKitXcodeProject = config => {
  return withXcodeProject(config, async config => {
    const xcodeProject = config.modResults;

    // Add HealthKit framework
    xcodeProject.addFramework('HealthKit.framework', { weak: true });

    // Add HealthKit capability
    const pbxProject = xcodeProject.pbxProjectSection()[xcodeProject.getFirstProject().uuid];
    if (pbxProject) {
      const targetUuid = xcodeProject.getFirstTarget().uuid;
      const targetAttributes = pbxProject.attributes.TargetAttributes || {};
      const target = targetAttributes[targetUuid] || {};

      target.SystemCapabilities = target.SystemCapabilities || {};
      target.SystemCapabilities['com.apple.HealthKit'] = { enabled: 1 };

      targetAttributes[targetUuid] = target;
      pbxProject.attributes.TargetAttributes = targetAttributes;
    }

    return config;
  });
};

// Main plugin function
module.exports = (config, props = {}) => {
  if (!config.ios) {
    return config;
  }

  config = withHealthKitPlist(config, props);
  config = withHealthKitEntitlements(config);
  config = withHealthKitXcodeProject(config);

  return config;
};
