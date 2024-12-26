import {
  ConfigPlugin,
  withInfoPlist,
  withEntitlementsPlist,
  withXcodeProject,
} from '@expo/config-plugins';

interface HealthKitPluginProps {
  healthShareUsageDescription?: string;
  healthUpdateUsageDescription?: string;
  requiredDataTypes?: string[];
}

const DEFAULT_SHARE_USAGE = 'Allow this app to access your health data';
const DEFAULT_UPDATE_USAGE = 'Allow this app to save health data';

const withHealthKitPlist: ConfigPlugin<HealthKitPluginProps> = (config, props = {}) => {
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

const withHealthKitEntitlements: ConfigPlugin = config => {
  return withEntitlementsPlist(config, config => {
    // Add HealthKit entitlement
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = [];

    return config;
  });
};

const withHealthKitXcodeProject: ConfigPlugin = config => {
  return withXcodeProject(config, async config => {
    const xcodeProject = config.modResults;
    const targetUuid = xcodeProject.getFirstTarget().uuid;

    xcodeProject.addBuildProperty(
      'SYSTEM_FRAMEWORK_SEARCH_PATHS',
      '$(SDKROOT)/System/Library/Frameworks',
      'Debug',
    );
    xcodeProject.addBuildProperty(
      'SYSTEM_FRAMEWORK_SEARCH_PATHS',
      '$(SDKROOT)/System/Library/Frameworks',
      'Release',
    );

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

const withHealthKit: ConfigPlugin<HealthKitPluginProps> = (config, props = {}) => {
  config = withHealthKitPlist(config, props);
  config = withHealthKitEntitlements(config);
  config = withHealthKitXcodeProject(config);
  return config;
};

export default withHealthKit;
