import { NativeModulesProxy } from 'expo-modules-core';

// Import only the types, not the implementation
import type { HealthKitDataType, HealthKitConfig, ExportOptions, ExportResult } from '../types';

const ExpoHealthKitModule = NativeModulesProxy.ExpoHealthKit;

export class ExpoHealthKit {
  private config: HealthKitConfig | null = null;

  async configure(config: HealthKitConfig): Promise<void> {
    this.config = config;
  }

  async isHealthKitAvailable(): Promise<boolean> {
    return await ExpoHealthKitModule.isHealthKitAvailable();
  }

  async requestAuthorization(
    dataTypes: HealthKitDataType[],
  ): Promise<{ success: boolean; deniedTypes?: HealthKitDataType[] }> {
    if (!dataTypes.length) {
      throw new Error('At least one data type must be specified');
    }
    return await ExpoHealthKitModule.requestAuthorization(dataTypes);
  }

  async exportData(options: ExportOptions): Promise<ExportResult> {
    if (!this.config) {
      throw new Error('ExpoHealthKit must be configured before exporting data');
    }
    return await ExpoHealthKitModule.exportHealthData(options);
  }

  async queryHealthData(
    dataType: HealthKitDataType,
    startDate: Date,
    endDate: Date,
    options?: { limit?: number; ascending?: boolean },
  ): Promise<any[]> {
    return await ExpoHealthKitModule.queryHealthData(
      dataType,
      startDate.toISOString(),
      endDate.toISOString(),
      options,
    );
  }
}
