import {
  ConfigPlugin,
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
} from '@expo/config-plugins';

const HEALTHKIT_USAGE_DESCRIPTION =
  'Allow this app to access your health data for exporting and analysis';

const withHealthKit: ConfigPlugin = config => {
  // Add HealthKit entitlements
  config = withEntitlementsPlist(config, config => {
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = ['health-records'];
    return config;
  });

  // Add required Info.plist entries
  config = withInfoPlist(config, config => {
    config.modResults.NSHealthShareUsageDescription = HEALTHKIT_USAGE_DESCRIPTION;
    config.modResults.NSHealthUpdateUsageDescription = HEALTHKIT_USAGE_DESCRIPTION;
    return config;
  });

  // Add HealthKit capability to Xcode project
  config = withXcodeProject(config, async config => {
    const xcodeProject = config.modResults;
    const targetUUID = xcodeProject.getFirstTarget().uuid;

    xcodeProject.addCapability(targetUUID, 'HealthKit', {
      purposeStrings: {
        NSHealthShareUsageDescription: HEALTHKIT_USAGE_DESCRIPTION,
        NSHealthUpdateUsageDescription: HEALTHKIT_USAGE_DESCRIPTION,
      },
    });

    return config;
  });

  return config;
};

export default withHealthKit;
