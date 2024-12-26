# expo-health-kit

A comprehensive TypeScript library for React Native and Expo that enables exporting Apple HealthKit data in the same format as the Apple Health app.

## Features

- 🏃‍♂️ Access to various HealthKit data types (steps, heart rate, etc.)
- 📤 Export data in XML/JSON formats
- 🔒 Robust permission handling
- 📱 Background delivery support
- 🎯 Type-safe TypeScript implementation
- 📦 Easy integration with Expo

## Installation

```bash
npx expo install expo-health-kit
```

### Configuration

1. Add the Expo config plugin to your app.json/app.config.js:

```json
{
  "expo": {
    "plugins": ["expo-health-kit"]
  }
}
```

2. Rebuild your app:

```bash
npx expo prebuild
```

## Usage

### Basic Setup

```typescript
import { ExpoHealthKit, HealthKitDataType } from 'expo-health-kit';

const healthKit = new ExpoHealthKit();

// Configure the library
await healthKit.configure({
  selectedDataTypes: [HealthKitDataType.STEPS, HealthKitDataType.HEART_RATE],
  exportFormat: 'xml',
});

// Check availability
const isAvailable = await healthKit.isHealthKitAvailable();
if (!isAvailable) {
  console.error('HealthKit is not available on this device');
  return;
}

// Request permissions
const authResult = await healthKit.requestAuthorization();
if (!authResult.success) {
  console.error('Failed to get permissions', authResult.deniedTypes);
  return;
}
```

### Exporting Data

```typescript
try {
  const result = await healthKit.exportData({
    startDate: new Date('2023-01-01'),
    endDate: new Date(),
    progressCallback: progress => {
      console.log(`Export progress: ${progress}%`);
    },
  });

  console.log('Export successful:', result.filePath);
} catch (error) {
  console.error('Export failed:', error);
}
```

### Querying Specific Data

```typescript
try {
  const heartRateData = await healthKit.queryHealthData(
    HealthKitDataType.HEART_RATE,
    new Date('2023-01-01'),
    new Date(),
    { limit: 100, ascending: true },
  );

  console.log('Heart rate data:', heartRateData);
} catch (error) {
  console.error('Query failed:', error);
}
```

## API Reference

### ExpoHealthKit Class

#### Methods

- `configure(config: HealthKitConfig): Promise<void>`
- `isHealthKitAvailable(): Promise<boolean>`
- `requestAuthorization(dataTypes?: HealthKitDataType[]): Promise<AuthorizationResult>`
- `checkAuthorizationStatus(dataTypes?: HealthKitDataType[]): Promise<AuthorizationStatus>`
- `exportData(options: ExportOptions): Promise<ExportResult>`
- `cancelExport(): Promise<void>`
- `queryHealthData(dataType: HealthKitDataType, startDate: Date, endDate: Date, options?: QueryOptions): Promise<HealthData[]>`
- `getAvailableDataTypes(): HealthKitDataType[]`

### Types

```typescript
interface HealthKitConfig {
  selectedDataTypes: HealthKitDataType[];
  exportFormat: 'xml' | 'json';
  backgroundFetch?: boolean;
  exportLocation?: string;
  backgroundDeliveryInterval?: number;
}

interface ExportOptions {
  startDate: Date;
  endDate: Date;
  includeDataTypes?: HealthKitDataType[];
  progressCallback?: (progress: number) => void;
  cancelToken?: { isCancelled: boolean };
}
```

For a complete list of types and interfaces, refer to the TypeScript definitions in the package.

## Error Handling

The library uses custom `HealthKitError` class for error handling:

```typescript
try {
  await healthKit.exportData(options);
} catch (error) {
  if (error instanceof HealthKitError) {
    switch (error.code) {
      case HealthKitErrorCode.UNAUTHORIZED:
        console.error('Permission denied:', error.message);
        break;
      case HealthKitErrorCode.EXPORT_FAILED:
        console.error('Export failed:', error.message, error.details);
        break;
      // Handle other error codes
    }
  }
}
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
