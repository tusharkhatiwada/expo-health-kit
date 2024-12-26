const { withInfoPlist, withEntitlementsPlist, withXcodeProject } = require('@expo/config-plugins');

const DEFAULT_SHARE_USAGE = 'Allow this app to access your health data';
const DEFAULT_UPDATE_USAGE = 'Allow this app to save health data';

const withHealthKitPlist = (config, props = {}) => {
  return withInfoPlist(config, config => {
    const {
      healthShareUsageDescription = DEFAULT_SHARE_USAGE,
      healthUpdateUsageDescription = DEFAULT_UPDATE_USAGE,
    } = props;

    // Add usage descriptions to Info.plist
    config.modResults.NSHealthShareUsageDescription = healthShareUsageDescription;
    config.modResults.NSHealthUpdateUsageDescription = healthUpdateUsageDescription;

    return config;
  });
};

const withHealthKitEntitlements = config => {
  return withEntitlementsPlist(config, config => {
    // Add HealthKit entitlement
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = [];

    return config;
  });
};

const withHealthKitXcodeProject = config => {
  return withXcodeProject(config, async config => {
    const xcodeProject = config.modResults;
    const targetUuid = xcodeProject.getFirstTarget().uuid;

    // Add HealthKit framework
    xcodeProject.addFramework('HealthKit.framework', { weak: true });

    // Add HealthKit capability
    if (xcodeProject.pbxProjectSection()) {
      const projectSection = xcodeProject.pbxProjectSection()[xcodeProject.getFirstProject().uuid];
      if (projectSection) {
        const attributes = projectSection.attributes || {};
        const targetAttributes = attributes.TargetAttributes || {};
        const mainTargetAttributes = targetAttributes[targetUuid] || {};
        const systemCapabilities = mainTargetAttributes.SystemCapabilities || {};

        mainTargetAttributes.SystemCapabilities = {
          ...systemCapabilities,
          'com.apple.HealthKit': {
            enabled: 1,
          },
        };

        targetAttributes[targetUuid] = mainTargetAttributes;
        attributes.TargetAttributes = targetAttributes;
        projectSection.attributes = attributes;
      }
    }

    return config;
  });
};

module.exports = (config, props = {}) => {
  if (!config.ios) {
    return config;
  }

  config = withHealthKitPlist(config, props);
  config = withHealthKitEntitlements(config);
  config = withHealthKitXcodeProject(config);
  return config;
};
