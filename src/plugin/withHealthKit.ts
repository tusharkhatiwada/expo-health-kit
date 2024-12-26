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

    // Add HealthKit capability
    const capabilities =
      xcodeProject.pbxProjectSection()[xcodeProject.getFirstProject().uuid].attributes
        .TargetAttributes[xcodeProject.getFirstTarget().uuid].SystemCapabilities;

    capabilities['com.apple.HealthKit'] = {
      enabled: 1,
    };

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
