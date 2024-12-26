export enum HealthKitDataType {
  // Activity and Fitness
  STEPS = 'HKQuantityTypeIdentifierStepCount',
  DISTANCE_WALKING_RUNNING = 'HKQuantityTypeIdentifierDistanceWalkingRunning',
  DISTANCE_CYCLING = 'HKQuantityTypeIdentifierDistanceCycling',
  DISTANCE_SWIMMING = 'HKQuantityTypeIdentifierDistanceSwimming',
  ACTIVE_ENERGY_BURNED = 'HKQuantityTypeIdentifierActiveEnergyBurned',
  BASAL_ENERGY_BURNED = 'HKQuantityTypeIdentifierBasalEnergyBurned',
  FLIGHTS_CLIMBED = 'HKQuantityTypeIdentifierFlightsClimbed',
  NIKE_FUEL = 'HKQuantityTypeIdentifierNikeFuel',
  APPLE_EXERCISE_TIME = 'HKQuantityTypeIdentifierAppleExerciseTime',
  APPLE_STAND_TIME = 'HKQuantityTypeIdentifierAppleStandTime',
  SWIMMING_STROKE_COUNT = 'HKQuantityTypeIdentifierSwimmingStrokeCount',
  PUSH_COUNT = 'HKQuantityTypeIdentifierPushCount',
  WORKOUT_MINUTES = 'HKQuantityTypeIdentifierWorkoutMinutes',

  // Body Measurements
  HEIGHT = 'HKQuantityTypeIdentifierHeight',
  BODY_MASS = 'HKQuantityTypeIdentifierBodyMass',
  BODY_MASS_INDEX = 'HKQuantityTypeIdentifierBodyMassIndex',
  BODY_FAT_PERCENTAGE = 'HKQuantityTypeIdentifierBodyFatPercentage',
  LEAN_BODY_MASS = 'HKQuantityTypeIdentifierLeanBodyMass',
  WAIST_CIRCUMFERENCE = 'HKQuantityTypeIdentifierWaistCircumference',

  // Heart
  HEART_RATE = 'HKQuantityTypeIdentifierHeartRate',
  RESTING_HEART_RATE = 'HKQuantityTypeIdentifierRestingHeartRate',
  WALKING_HEART_RATE = 'HKQuantityTypeIdentifierWalkingHeartRateAverage',
  HEART_RATE_VARIABILITY_SDNN = 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  HEART_RATE_RECOVERY_ONE_MINUTE = 'HKQuantityTypeIdentifierHeartRateRecoveryOneMinute',
  ATRIALFIBRILLATION_BURDEN = 'HKQuantityTypeIdentifierAtrialFibrillationBurden',
  PERIPHERAL_PERFUSION_INDEX = 'HKQuantityTypeIdentifierPeripheralPerfusionIndex',
  VO2_MAX = 'HKQuantityTypeIdentifierVO2Max',
  WALKING_SPEED = 'HKQuantityTypeIdentifierWalkingSpeed',
  WALKING_STEP_LENGTH = 'HKQuantityTypeIdentifierWalkingStepLength',
  WALKING_ASYMMETRY_PERCENTAGE = 'HKQuantityTypeIdentifierWalkingAsymmetryPercentage',
  WALKING_DOUBLE_SUPPORT_PERCENTAGE = 'HKQuantityTypeIdentifierWalkingDoubleSupportPercentage',
  STAIR_ASCENT_SPEED = 'HKQuantityTypeIdentifierStairAscentSpeed',
  STAIR_DESCENT_SPEED = 'HKQuantityTypeIdentifierStairDescentSpeed',

  // Vitals
  BLOOD_PRESSURE_SYSTOLIC = 'HKQuantityTypeIdentifierBloodPressureSystolic',
  BLOOD_PRESSURE_DIASTOLIC = 'HKQuantityTypeIdentifierBloodPressureDiastolic',
  RESPIRATORY_RATE = 'HKQuantityTypeIdentifierRespiratoryRate',
  BODY_TEMPERATURE = 'HKQuantityTypeIdentifierBodyTemperature',
  BASAL_BODY_TEMPERATURE = 'HKQuantityTypeIdentifierBasalBodyTemperature',
  BLOOD_GLUCOSE = 'HKQuantityTypeIdentifierBloodGlucose',
  OXYGEN_SATURATION = 'HKQuantityTypeIdentifierOxygenSaturation',
  BLOOD_ALCOHOL_CONTENT = 'HKQuantityTypeIdentifierBloodAlcoholContent',
  FORCED_VITAL_CAPACITY = 'HKQuantityTypeIdentifierForcedVitalCapacity',
  FORCED_EXPIRATORY_VOLUME1 = 'HKQuantityTypeIdentifierForcedExpiratoryVolume1',
  PEAK_EXPIRATORY_FLOW_RATE = 'HKQuantityTypeIdentifierPeakExpiratoryFlowRate',
  ENVIRONMENTAL_AUDIO_EXPOSURE = 'HKQuantityTypeIdentifierEnvironmentalAudioExposure',
  HEADPHONE_AUDIO_EXPOSURE = 'HKQuantityTypeIdentifierHeadphoneAudioExposure',

  // Nutrition
  DIETARY_ENERGY_CONSUMED = 'HKQuantityTypeIdentifierDietaryEnergyConsumed',
  DIETARY_CARBOHYDRATES = 'HKQuantityTypeIdentifierDietaryCarbohydrates',
  DIETARY_FIBER = 'HKQuantityTypeIdentifierDietaryFiber',
  DIETARY_SUGAR = 'HKQuantityTypeIdentifierDietarySugar',
  DIETARY_FAT_TOTAL = 'HKQuantityTypeIdentifierDietaryFatTotal',
  DIETARY_FAT_SATURATED = 'HKQuantityTypeIdentifierDietaryFatSaturated',
  DIETARY_PROTEIN = 'HKQuantityTypeIdentifierDietaryProtein',
  DIETARY_CHOLESTEROL = 'HKQuantityTypeIdentifierDietaryCholesterol',
  DIETARY_SODIUM = 'HKQuantityTypeIdentifierDietarySodium',
  DIETARY_POTASSIUM = 'HKQuantityTypeIdentifierDietaryPotassium',
  DIETARY_CALCIUM = 'HKQuantityTypeIdentifierDietaryCalcium',
  DIETARY_VITAMIN_C = 'HKQuantityTypeIdentifierDietaryVitaminC',
  DIETARY_VITAMIN_D = 'HKQuantityTypeIdentifierDietaryVitaminD',
  DIETARY_IRON = 'HKQuantityTypeIdentifierDietaryIron',
  DIETARY_WATER = 'HKQuantityTypeIdentifierDietaryWater',
  DIETARY_CAFFEINE = 'HKQuantityTypeIdentifierDietaryCaffeine',

  // Sleep
  SLEEP_ANALYSIS = 'HKCategoryTypeIdentifierSleepAnalysis',
  SLEEP_DURATION = 'HKQuantityTypeIdentifierSleepDurationInBed',
  SLEEP_CORE = 'HKQuantityTypeIdentifierSleepCore',
  SLEEP_DEEP = 'HKQuantityTypeIdentifierSleepDeep',
  SLEEP_REM = 'HKQuantityTypeIdentifierSleepREM',
  SLEEP_AWAKE = 'HKQuantityTypeIdentifierSleepAwake',

  // Mindfulness and Symptoms
  MINDFUL_SESSION = 'HKCategoryTypeIdentifierMindfulSession',
  MINDFUL_MINUTES = 'HKQuantityTypeIdentifierMindfulMinutes',
  SYMPTOMS = 'HKCategoryTypeIdentifierSymptoms',
  MOOD = 'HKCategoryTypeIdentifierMood',

  // Workouts
  WORKOUT = 'HKWorkoutTypeIdentifier',
  WORKOUT_ROUTE = 'HKWorkoutRouteTypeIdentifier',

  // Reproductive Health
  MENSTRUATION = 'HKCategoryTypeIdentifierMenstrualFlow',
  SPOTTING = 'HKCategoryTypeIdentifierIntermenstrualBleeding',
  CERVICAL_MUCUS_QUALITY = 'HKCategoryTypeIdentifierCervicalMucusQuality',
  OVULATION_TEST_RESULT = 'HKCategoryTypeIdentifierOvulationTestResult',
  PREGNANCY_TEST = 'HKCategoryTypeIdentifierPregnancyTestResult',
  PROGESTERONE_TEST = 'HKQuantityTypeIdentifierProgesteroneTestResult',
  SEXUAL_ACTIVITY = 'HKCategoryTypeIdentifierSexualActivity',

  // Other
  ELECTROCARDIOGRAM = 'HKDataTypeIdentifierElectrocardiogram',
  HANDWASHING = 'HKCategoryTypeIdentifierHandwashingEvent',
  TOOTH_BRUSHING = 'HKCategoryTypeIdentifierToothbrushingEvent',
  FALLS = 'HKCategoryTypeIdentifierAppleWalkingSteadinessEvent',
  GAIT_STEADINESS = 'HKQuantityTypeIdentifierAppleWalkingSteadiness',
  INHALER_USAGE = 'HKCategoryTypeIdentifierInhalerUsage',
  INSULIN_DELIVERY = 'HKQuantityTypeIdentifierInsulinDelivery',
  TIME_IN_DAYLIGHT = 'HKQuantityTypeIdentifierTimeInDaylight',
  UV_EXPOSURE = 'HKQuantityTypeIdentifierUVExposure',
  WATER_TEMPERATURE = 'HKQuantityTypeIdentifierWaterTemperature',
}

export enum HealthKitErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNAVAILABLE = 'UNAVAILABLE',
  INVALID_CONFIG = 'INVALID_CONFIG',
  EXPORT_FAILED = 'EXPORT_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  BACKGROUND_DELIVERY_FAILED = 'BACKGROUND_DELIVERY_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
}

export interface HealthKitConfig {
  selectedDataTypes: HealthKitDataType[];
  exportFormat: 'xml' | 'json';
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
  [key in HealthKitDataType]?: 'authorized' | 'denied' | 'notDetermined' | 'sharingDenied';
};

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  totalRecords?: number;
}

export interface BackgroundDeliveryConfig {
  dataType: HealthKitDataType;
  updateInterval: number; // in seconds
}

export interface HealthKitUpdateEvent {
  type: HealthKitDataType;
  timestamp: string;
}

export class HealthKitError extends Error {
  constructor(
    public code: HealthKitErrorCode,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'HealthKitError';
    Object.setPrototypeOf(this, HealthKitError.prototype);
  }
}

export interface QueryOptions {
  limit?: number;
  ascending?: boolean;
  metadata?: Record<string, any>;
}
