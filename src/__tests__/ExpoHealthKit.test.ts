import type { HealthKitDataType } from '../types';
import { ExpoHealthKit } from '../ExpoHealthKit';

jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({
    isHealthKitAvailable: jest.fn().mockResolvedValue(true),
    requestAuthorization: jest.fn().mockResolvedValue(true),
    getAuthorizationStatus: jest.fn().mockResolvedValue({
      HKQuantityTypeIdentifierStepCount: 'authorized',
      HKQuantityTypeIdentifierHeartRate: 'authorized',
    }),
    exportHealthData: jest.fn().mockResolvedValue({
      success: true,
      filePath: '/path/to/export.xml',
    }),
    cancelExport: jest.fn().mockResolvedValue(undefined),
    queryHealthData: jest.fn().mockResolvedValue([
      {
        type: 'HKQuantityTypeIdentifierStepCount',
        value: 1000,
        unit: 'count',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-01T23:59:59.999Z',
        sourceName: 'iPhone',
      },
    ]),
  }),
}));

describe('ExpoHealthKit', () => {
  let healthKit: ExpoHealthKit;

  beforeEach(() => {
    healthKit = new ExpoHealthKit();
  });

  describe('configure', () => {
    it('should set configuration correctly', async () => {
      const config = {
        selectedDataTypes: ['HKQuantityTypeIdentifierStepCount'] as HealthKitDataType[],
        exportFormat: 'xml' as const,
      };

      await healthKit.configure(config);
      expect(healthKit['config']).toEqual(config);
    });
  });

  describe('isHealthKitAvailable', () => {
    it('should return true when HealthKit is available', async () => {
      const result = await healthKit.isHealthKitAvailable();
      expect(result).toBe(true);
    });
  });

  describe('requestAuthorization', () => {
    it('should throw error when no data types are specified', async () => {
      await expect(healthKit.requestAuthorization([])).rejects.toThrowError();
    });

    it('should return success when authorization is granted', async () => {
      const result = await healthKit.requestAuthorization([
        'HKQuantityTypeIdentifierStepCount',
      ] as HealthKitDataType[]);
      expect(result).toEqual({
        success: true,
        deniedTypes: undefined,
      });
    });
  });

  describe('exportData', () => {
    beforeEach(async () => {
      await healthKit.configure({
        selectedDataTypes: ['HKQuantityTypeIdentifierStepCount'] as HealthKitDataType[],
        exportFormat: 'xml',
      });
    });

    it('should throw error when not configured', async () => {
      const unconfiguredHealthKit = new ExpoHealthKit();
      await expect(
        unconfiguredHealthKit.exportData({
          startDate: new Date(),
          endDate: new Date(),
        }),
      ).rejects.toThrowError();
    });

    it('should return export result when successful', async () => {
      const result = await healthKit.exportData({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
      });

      expect(result).toEqual({
        success: true,
        filePath: '/path/to/export.xml',
      });
    });
  });

  describe('queryHealthData', () => {
    it('should return health data when query is successful', async () => {
      const result = await healthKit.queryHealthData(
        'HKQuantityTypeIdentifierStepCount' as HealthKitDataType,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'HKQuantityTypeIdentifierStepCount',
        value: 1000,
        unit: 'count',
      });
    });
  });
});
