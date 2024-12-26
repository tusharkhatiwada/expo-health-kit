# expo-health-kit

A comprehensive TypeScript library for React Native and Expo that enables exporting Apple HealthKit data in the same format as the Apple Health app.

## Features

- 🏃‍♂️ Complete access to all HealthKit data types
- 📊 Activity and Fitness tracking
- ❤️ Heart and Health metrics
- 💪 Workouts and Exercise
- 😴 Sleep Analysis
- 🥗 Nutrition tracking
- 📱 Background delivery support
- 🔄 Real-time health updates
- 📤 Export data in XML/JSON formats
- 🔒 Robust permission handling
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

## Supported Data Types

### Activity and Fitness

- Steps
- Distance (Walking, Running, Cycling, Swimming)
- Energy (Active, Basal)
- Flights Climbed
- Exercise Time
- Stand Time
- Swimming Strokes
- Workout Minutes

### Body Measurements

- Height
- Body Mass
- BMI
- Body Fat Percentage
- Lean Body Mass
- Waist Circumference

### Heart and Cardiovascular

- Heart Rate
- Resting Heart Rate
- Walking Heart Rate
- Heart Rate Variability (SDNN)
- Heart Rate Recovery
- Atrial Fibrillation
- VO2 Max
- Walking Speed/Steadiness
- Stair Speed (Ascent/Descent)

### Vitals

- Blood Pressure (Systolic/Diastolic)
- Respiratory Rate
- Body Temperature
- Blood Glucose
- Oxygen Saturation
- Blood Alcohol Content
- Lung Function (FVC, FEV1)
- Audio Exposure

### Nutrition

- Energy Consumed
- Macronutrients (Carbs, Protein, Fat)
- Micronutrients (Vitamins, Minerals)
- Water Intake
- Caffeine

### Sleep

- Sleep Analysis
- Sleep Stages (Core, Deep, REM)
- Time Awake
- Sleep Duration

### Other Categories

- Mindfulness
- Symptoms and Mood
- Workouts
- Reproductive Health
- Environmental Metrics
- Mobility and Gait

## Usage Examples

### Basic Setup

```typescript
import { ExpoHealthKit, HealthKitDataType } from 'expo-health-kit';

const healthKit = new ExpoHealthKit();

// Configure with desired data types
await healthKit.configure({
  selectedDataTypes: [
    HealthKitDataType.STEPS,
    HealthKitDataType.HEART_RATE,
    HealthKitDataType.SLEEP_ANALYSIS,
    // Add more data types as needed
  ],
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

### Querying Heart Rate Data

```typescript
// Get heart rate data
const heartRateData = await healthKit.queryHealthData(
  HealthKitDataType.HEART_RATE,
  new Date('2024-01-01'),
  new Date(),
  { limit: 100, ascending: true },
);

console.log('Heart Rate Samples:', heartRateData);
// Output:
// [{
//   type: "HKQuantityTypeIdentifierHeartRate",
//   value: 72,
//   unit: "count/min",
//   startDate: "2024-01-01T10:00:00Z",
//   endDate: "2024-01-01T10:00:00Z",
//   sourceName: "Apple Watch",
//   metadata: { ... }
// }, ...]
```

### Sleep Analysis

```typescript
// Get sleep data
const sleepData = await healthKit.queryHealthData(
  HealthKitDataType.SLEEP_ANALYSIS,
  new Date('2024-01-01'),
  new Date(),
);

// Get detailed sleep stages
const sleepStages = await Promise.all([
  healthKit.queryHealthData(HealthKitDataType.SLEEP_CORE, startDate, endDate),
  healthKit.queryHealthData(HealthKitDataType.SLEEP_REM, startDate, endDate),
  healthKit.queryHealthData(HealthKitDataType.SLEEP_DEEP, startDate, endDate),
]);
```

### Workout Data

```typescript
// Query workout data
const workouts = await healthKit.queryHealthData(
  HealthKitDataType.WORKOUT,
  new Date('2024-01-01'),
  new Date(),
);

// Get associated metrics
const workoutMetrics = await healthKit.queryHealthData(
  HealthKitDataType.ACTIVE_ENERGY_BURNED,
  workouts[0].startDate,
  workouts[0].endDate,
);
```

### Real-time Updates

```typescript
// Subscribe to real-time heart rate updates
healthKit.subscribeToUpdates(HealthKitDataType.HEART_RATE, event => {
  console.log('New heart rate reading:', event);
});

// Enable background delivery
await healthKit.enableBackgroundDelivery({
  dataType: HealthKitDataType.HEART_RATE,
  updateInterval: 3600, // hourly updates
});
```

### Exporting Data

```typescript
// Export health data
const result = await healthKit.exportData({
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  includeDataTypes: [
    HealthKitDataType.STEPS,
    HealthKitDataType.HEART_RATE,
    HealthKitDataType.SLEEP_ANALYSIS,
  ],
  progressCallback: progress => {
    console.log(`Export progress: ${progress}%`);
  },
});

console.log('Export successful:', result.filePath);
```

## Error Handling

The library uses custom `HealthKitError` class for comprehensive error handling:

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
      case HealthKitErrorCode.INVALID_PARAMETERS:
        console.error('Invalid parameters:', error.message);
        break;
      case HealthKitErrorCode.BACKGROUND_DELIVERY_FAILED:
        console.error('Background delivery failed:', error.message);
        break;
    }
  }
}
```

## Data Units

The library automatically handles unit conversions. Here are some common units:

- Steps: count
- Distance: meters (m)
- Heart Rate: beats per minute (count/min)
- Energy: kilocalories (kcal)
- Weight: kilograms (kg)
- Height: meters (m)
- Blood Pressure: millimeters of mercury (mmHg)
- Blood Glucose: milligrams per deciliter (mg/dL)
- Temperature: degrees Celsius (°C)
- Sleep: hours (hr)
- VO2 Max: milliliters per kilogram per minute (mL/kg/min)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
