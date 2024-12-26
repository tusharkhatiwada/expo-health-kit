# Library Development Prompt: React Native & Expo HealthKit Export Library

Create a comprehensive TypeScript library for React Native and Expo that enables exporting Apple HealthKit data in the same format as the Apple Health app. The library should be well-documented, type-safe, and follow modern best practices for React Native library development.

## Core Requirements

### 1. Library Structure

- Create a standalone npm package with proper TypeScript configuration
- Implement an Expo Config Plugin for native code installation
- Provide clear type definitions for all public APIs
- Follow a modular architecture separating concerns (authorization, data fetching, export, etc.)
- Include proper error handling with custom error types
- Support both Expo and bare React Native projects

### 2. Configuration System

- Allow users to specify which HealthKit identifiers they want to access
- Provide configuration options for export format and file naming
- Support custom date ranges for data export
- Enable customization of export file location
- Allow configuration of background fetch intervals if needed

### 3. Authorization System

Implement a robust authorization system that:

- Handles all necessary HealthKit permissions
- Provides granular control over which data types to request access to
- Includes proper error handling for denied permissions
- Supports checking current authorization status
- Allows revoking permissions
- Handles permission changes during runtime

### 4. Data Export Functionality

Implement comprehensive data export features:

- Support all relevant HealthKit data types
- Match Apple Health app's XML export format exactly
- Include all metadata (source, device, timestamps, etc.)
- Support incremental exports
- Handle large datasets efficiently
- Provide progress updates during export
- Support cancellation of ongoing exports

### 5. API Design

Create a well-designed, intuitive API that includes:

```typescript
interface HealthKitConfig {
  // Define configuration options
  selectedDataTypes: HealthKitDataType[];
  exportFormat: "xml" | "json";
  backgroundFetch?: boolean;
  exportLocation?: string;
  // Add other configuration options
}

interface ExportOptions {
  startDate: Date;
  endDate: Date;
  includeDataTypes?: HealthKitDataType[];
  progressCallback?: (progress: number) => void;
  // Add other export options
}

interface HealthKitExport {
  // Main methods
  configure(config: HealthKitConfig): Promise<void>;
  requestAuthorization(dataTypes?: HealthKitDataType[]): Promise<AuthorizationResult>;
  checkAuthorizationStatus(dataTypes?: HealthKitDataType[]): Promise<AuthorizationStatus>;
  exportData(options: ExportOptions): Promise<ExportResult>;
  cancelExport(): Promise<void>;

  // Utility methods
  getAvailableDataTypes(): HealthKitDataType[];
  isHealthKitAvailable(): boolean;
  // Add other utility methods
}
```

### 6. Error Handling

Implement comprehensive error handling:

```typescript
enum HealthKitErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  UNAVAILABLE = "UNAVAILABLE",
  INVALID_CONFIG = "INVALID_CONFIG",
  EXPORT_FAILED = "EXPORT_FAILED",
  // Add other error codes
}

class HealthKitError extends Error {
  code: HealthKitErrorCode;
  details?: any;
}
```

### 7. Documentation Requirements

Create comprehensive documentation including:

- Clear installation instructions for both Expo and bare React Native projects
- Step-by-step usage guides with code examples
- API reference with TypeScript types
- Troubleshooting guide
- Examples of common use cases
- Migration guide for version updates
- Contributing guidelines

## Technical Specifications

### 1. Native Module Implementation

```typescript
// Example native module interface
interface HealthKitNativeModule {
  isHealthKitAvailable(): Promise<boolean>;
  requestAuthorization(permissions: string[]): Promise<boolean>;
  fetchHealthData(
    dataType: string,
    startDate: string,
    endDate: string,
    options?: QueryOptions,
  ): Promise<HealthData[]>;
  // Add other native methods
}
```

### 2. Expo Config Plugin

```typescript
// Example config plugin structure
import { ConfigPlugin } from "@expo/config-plugins";

const withHealthKit: ConfigPlugin = (config) => {
  // Modify Info.plist
  // Add required frameworks
  // Configure necessary permissions
  // Return modified config
};

export default withHealthKit;
```

### 3. Data Type Definitions

```typescript
interface HealthData {
  type: HealthKitDataType;
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
  sourceName: string;
  sourceDevice?: string;
  metadata?: Record<string, any>;
}

enum HealthKitDataType {
  HEART_RATE = "HKQuantityTypeIdentifierHeartRate",
  STEPS = "HKQuantityTypeIdentifierStepCount",
  WEIGHT = "HKQuantityTypeIdentifierBodyMass",
  // Add all supported data types
}
```

## Implementation Requirements

1. Testing:

- Implement unit tests for all core functionality
- Add integration tests for native module interaction
- Include end-to-end tests for complete export workflow
- Add type testing using TypeScript's type system

2. Performance:

- Handle large datasets efficiently
- Implement proper memory management
- Support background processing for large exports
- Include progress tracking and cancellation

3. Security:

- Implement secure storage for temporary files
- Handle sensitive health data appropriately
- Follow Apple's privacy guidelines
- Include data sanitization

4. Maintenance:

- Set up CI/CD pipeline
- Include proper versioning strategy
- Add automated release process
- Implement changelog generation

## Deliverables

1. Source Code:

- Complete TypeScript implementation
- Native module code for iOS
- Expo config plugin
- Type definitions
- Tests

2. Documentation:

- README.md with installation and usage instructions
- API documentation
- TypeDoc-generated API reference
- Example projects for both Expo and bare React Native
- Contributing guidelines

3. Support Files:

- TypeScript configuration
- ESLint configuration
- Jest configuration
- GitHub Actions workflows
- Release scripts

Please implement this library following modern best practices, ensuring type safety, proper error handling, and comprehensive documentation. The library should be easy to use while providing powerful features for advanced use cases.
