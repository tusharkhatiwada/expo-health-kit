import { EventSubscription, requireNativeModule } from 'expo-modules-core';
import {
  HealthKitConfig,
  ExportOptions,
  HealthData,
  AuthorizationResult,
  AuthorizationStatus,
  ExportResult,
  HealthKitDataType,
  QueryOptions,
  HealthKitError,
  HealthKitErrorCode,
  BackgroundDeliveryConfig,
  HealthKitUpdateEvent,
} from './types';

interface ExpoHealthKitInterface {
  readonly isHealthKitAvailable: () => Promise<boolean>;
  readonly requestAuthorization: (permissions: string[]) => Promise<boolean>;
  readonly getAuthorizationStatus: (permissions: string[]) => Promise<Record<string, string>>;
  readonly exportHealthData: (options: {
    startDate: string;
    endDate: string;
    dataTypes: string[];
    format: string;
    exportPath?: string;
  }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  readonly cancelExport: () => Promise<void>;
  readonly queryHealthData: (
    dataType: string,
    startDate: string,
    endDate: string,
    options?: QueryOptions,
  ) => Promise<HealthData[]>;
  readonly enableBackgroundDelivery: (dataType: string, updateInterval: number) => Promise<boolean>;
  readonly disableBackgroundDelivery: (dataType: string) => Promise<boolean>;
  addListener: (eventName: string, listener: (event: any) => void) => EventSubscription;
}

const NativeModule = requireNativeModule('ExpoHealthKit') as ExpoHealthKitInterface;

export class ExpoHealthKit {
  private config: HealthKitConfig | null = null;
  private eventSubscriptions: { [key: string]: (event: HealthKitUpdateEvent) => void } = {};
  private subscription: EventSubscription | null = null;

  constructor() {
    this.subscription = NativeModule.addListener(
      'healthKitUpdate',
      (event: HealthKitUpdateEvent) => {
        const callback = this.eventSubscriptions[event.type];
        if (callback) {
          callback(event);
        }
      },
    );
  }

  async configure(config: HealthKitConfig): Promise<void> {
    this.config = config;

    // Set up background delivery if configured
    if (config.backgroundFetch && config.backgroundDeliveryInterval) {
      for (const dataType of config.selectedDataTypes) {
        try {
          await this.enableBackgroundDelivery({
            dataType,
            updateInterval: config.backgroundDeliveryInterval,
          });
        } catch (error) {
          if (error instanceof Error) {
            console.warn(`Failed to enable background delivery for ${dataType}: ${error.message}`);
          }
        }
      }
    }
  }

  async isHealthKitAvailable(): Promise<boolean> {
    try {
      return await NativeModule.isHealthKitAvailable();
    } catch (error) {
      throw new HealthKitError(
        HealthKitErrorCode.UNAVAILABLE,
        'Failed to check HealthKit availability',
        error,
      );
    }
  }

  async requestAuthorization(dataTypes?: HealthKitDataType[]): Promise<AuthorizationResult> {
    try {
      const typesToRequest = dataTypes || this.config?.selectedDataTypes;
      if (!typesToRequest?.length) {
        throw new HealthKitError(
          HealthKitErrorCode.INVALID_PARAMETERS,
          'No data types specified for authorization',
        );
      }

      const granted = await NativeModule.requestAuthorization(typesToRequest);
      return {
        success: granted,
        deniedTypes: granted ? undefined : typesToRequest,
      };
    } catch (error) {
      throw new HealthKitError(
        HealthKitErrorCode.UNAUTHORIZED,
        'Failed to request HealthKit authorization',
        error,
      );
    }
  }

  async checkAuthorizationStatus(dataTypes?: HealthKitDataType[]): Promise<AuthorizationStatus> {
    try {
      const typesToCheck = dataTypes || this.config?.selectedDataTypes;
      if (!typesToCheck?.length) {
        throw new HealthKitError(
          HealthKitErrorCode.INVALID_PARAMETERS,
          'No data types specified for status check',
        );
      }

      const status = await NativeModule.getAuthorizationStatus(typesToCheck);
      return Object.entries(status).reduce(
        (acc, [type, value]) => ({
          ...acc,
          [type]: value,
        }),
        {},
      );
    } catch (error) {
      throw new HealthKitError(
        HealthKitErrorCode.QUERY_FAILED,
        'Failed to check authorization status',
        error,
      );
    }
  }

  async exportData(options: ExportOptions): Promise<ExportResult> {
    if (!this.config) {
      throw new HealthKitError(
        HealthKitErrorCode.INVALID_CONFIG,
        'ExpoHealthKit must be configured before exporting data',
      );
    }

    try {
      const result = await NativeModule.exportHealthData({
        startDate: options.startDate.toISOString(),
        endDate: options.endDate.toISOString(),
        dataTypes: options.includeDataTypes || this.config.selectedDataTypes,
        format: this.config.exportFormat,
        exportPath: this.config.exportLocation,
      });

      if (!result.success) {
        throw new HealthKitError(HealthKitErrorCode.EXPORT_FAILED, result.error || 'Export failed');
      }

      return result;
    } catch (error) {
      if (error instanceof HealthKitError) {
        throw error;
      }
      throw new HealthKitError(
        HealthKitErrorCode.EXPORT_FAILED,
        'Failed to export health data',
        error,
      );
    }
  }

  async cancelExport(): Promise<void> {
    try {
      await NativeModule.cancelExport();
    } catch (error) {
      throw new HealthKitError(HealthKitErrorCode.EXPORT_FAILED, 'Failed to cancel export', error);
    }
  }

  async queryHealthData(
    dataType: HealthKitDataType,
    startDate: Date,
    endDate: Date,
    options?: QueryOptions,
  ): Promise<HealthData[]> {
    try {
      return await NativeModule.queryHealthData(
        dataType,
        startDate.toISOString(),
        endDate.toISOString(),
        options,
      );
    } catch (error) {
      throw new HealthKitError(
        HealthKitErrorCode.QUERY_FAILED,
        'Failed to query health data',
        error,
      );
    }
  }

  getAvailableDataTypes(): HealthKitDataType[] {
    return Object.values(HealthKitDataType);
  }

  async enableBackgroundDelivery(config: BackgroundDeliveryConfig): Promise<boolean> {
    try {
      return await NativeModule.enableBackgroundDelivery(config.dataType, config.updateInterval);
    } catch (error) {
      throw new HealthKitError(
        HealthKitErrorCode.BACKGROUND_DELIVERY_FAILED,
        'Failed to enable background delivery',
        error,
      );
    }
  }

  async disableBackgroundDelivery(dataType: HealthKitDataType): Promise<boolean> {
    try {
      return await NativeModule.disableBackgroundDelivery(dataType);
    } catch (error) {
      throw new HealthKitError(
        HealthKitErrorCode.BACKGROUND_DELIVERY_FAILED,
        'Failed to disable background delivery',
        error,
      );
    }
  }

  subscribeToUpdates(
    dataType: HealthKitDataType,
    callback: (event: HealthKitUpdateEvent) => void,
  ): void {
    this.eventSubscriptions[dataType] = callback;
  }

  unsubscribeFromUpdates(dataType: HealthKitDataType): void {
    delete this.eventSubscriptions[dataType];
    if (Object.keys(this.eventSubscriptions).length === 0 && this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}
