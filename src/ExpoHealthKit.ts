import { requireNativeModule } from "expo-modules-core";
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
} from "./types";

interface ExpoHealthKitInterface {
  readonly isHealthKitAvailable: () => Promise<boolean>;
  readonly requestAuthorization: (permissions: string[]) => Promise<boolean>;
  readonly getAuthorizationStatus: (
    permissions: string[],
  ) => Promise<Record<string, string>>;
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
}

const NativeModule = requireNativeModule("ExpoHealthKit") as ExpoHealthKitInterface;

export class ExpoHealthKit {
  private config: HealthKitConfig | null = null;

  async configure(config: HealthKitConfig): Promise<void> {
    this.config = config;
  }

  async isHealthKitAvailable(): Promise<boolean> {
    try {
      return await NativeModule.isHealthKitAvailable();
    } catch (error) {
      throw new HealthKitError(
        HealthKitErrorCode.UNAVAILABLE,
        "Failed to check HealthKit availability",
        error,
      );
    }
  }

  async requestAuthorization(
    dataTypes?: HealthKitDataType[],
  ): Promise<AuthorizationResult> {
    try {
      const typesToRequest = dataTypes || this.config?.selectedDataTypes;
      if (!typesToRequest?.length) {
        throw new HealthKitError(
          HealthKitErrorCode.INVALID_PARAMETERS,
          "No data types specified for authorization",
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
        "Failed to request HealthKit authorization",
        error,
      );
    }
  }

  async checkAuthorizationStatus(
    dataTypes?: HealthKitDataType[],
  ): Promise<AuthorizationStatus> {
    try {
      const typesToCheck = dataTypes || this.config?.selectedDataTypes;
      if (!typesToCheck?.length) {
        throw new HealthKitError(
          HealthKitErrorCode.INVALID_PARAMETERS,
          "No data types specified for status check",
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
        "Failed to check authorization status",
        error,
      );
    }
  }

  async exportData(options: ExportOptions): Promise<ExportResult> {
    if (!this.config) {
      throw new HealthKitError(
        HealthKitErrorCode.INVALID_CONFIG,
        "ExpoHealthKit must be configured before exporting data",
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
        throw new HealthKitError(
          HealthKitErrorCode.EXPORT_FAILED,
          result.error || "Export failed",
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HealthKitError) {
        throw error;
      }
      throw new HealthKitError(
        HealthKitErrorCode.EXPORT_FAILED,
        "Failed to export health data",
        error,
      );
    }
  }

  async cancelExport(): Promise<void> {
    try {
      await NativeModule.cancelExport();
    } catch (error) {
      throw new HealthKitError(
        HealthKitErrorCode.EXPORT_FAILED,
        "Failed to cancel export",
        error,
      );
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
        "Failed to query health data",
        error,
      );
    }
  }

  getAvailableDataTypes(): HealthKitDataType[] {
    return Object.values(HealthKitDataType);
  }
}
