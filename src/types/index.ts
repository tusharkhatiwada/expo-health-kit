export enum HealthKitDataType {
  // Activity and Fitness
  STEPS = "HKQuantityTypeIdentifierStepCount",
  DISTANCE_WALKING_RUNNING = "HKQuantityTypeIdentifierDistanceWalkingRunning",
  ACTIVE_ENERGY_BURNED = "HKQuantityTypeIdentifierActiveEnergyBurned",
  FLIGHTS_CLIMBED = "HKQuantityTypeIdentifierFlightsClimbed",

  // Body Measurements
  HEIGHT = "HKQuantityTypeIdentifierHeight",
  BODY_MASS = "HKQuantityTypeIdentifierBodyMass",
  BODY_MASS_INDEX = "HKQuantityTypeIdentifierBodyMassIndex",
  BODY_FAT_PERCENTAGE = "HKQuantityTypeIdentifierBodyFatPercentage",

  // Heart
  HEART_RATE = "HKQuantityTypeIdentifierHeartRate",
  RESTING_HEART_RATE = "HKQuantityTypeIdentifierRestingHeartRate",
  HEART_RATE_VARIABILITY = "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",

  // Other
  BLOOD_PRESSURE_SYSTOLIC = "HKQuantityTypeIdentifierBloodPressureSystolic",
  BLOOD_PRESSURE_DIASTOLIC = "HKQuantityTypeIdentifierBloodPressureDiastolic",
  RESPIRATORY_RATE = "HKQuantityTypeIdentifierRespiratoryRate",
  OXYGEN_SATURATION = "HKQuantityTypeIdentifierOxygenSaturation",
  BLOOD_GLUCOSE = "HKQuantityTypeIdentifierBloodGlucose",
}

export enum HealthKitErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  UNAVAILABLE = "UNAVAILABLE",
  INVALID_CONFIG = "INVALID_CONFIG",
  EXPORT_FAILED = "EXPORT_FAILED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  BACKGROUND_DELIVERY_FAILED = "BACKGROUND_DELIVERY_FAILED",
  QUERY_FAILED = "QUERY_FAILED",
}

export interface HealthKitConfig {
  selectedDataTypes: HealthKitDataType[];
  exportFormat: "xml" | "json";
  backgroundFetch?: boolean;
  exportLocation?: string;
  backgroundDeliveryInterval?: number;
}

export interface ExportOptions {
  startDate: Date;
  endDate: Date;
  includeDataTypes?: HealthKitDataType[];
  progressCallback?: (progress: number) => void;
  cancelToken?: { isCancelled: boolean };
}

export interface HealthData {
  type: HealthKitDataType;
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
  sourceName: string;
  sourceDevice?: string;
  metadata?: Record<string, any>;
  uuid?: string;
}

export interface AuthorizationResult {
  success: boolean;
  deniedTypes?: HealthKitDataType[];
  error?: string;
}

export type AuthorizationStatus = {
  [key in HealthKitDataType]?:
    | "authorized"
    | "denied"
    | "notDetermined"
    | "sharingDenied";
};

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  totalRecords?: number;
}

export class HealthKitError extends Error {
  constructor(public code: HealthKitErrorCode, message: string, public details?: any) {
    super(message);
    this.name = "HealthKitError";
    Object.setPrototypeOf(this, HealthKitError.prototype);
  }
}

export interface QueryOptions {
  limit?: number;
  ascending?: boolean;
  metadata?: Record<string, any>;
}
