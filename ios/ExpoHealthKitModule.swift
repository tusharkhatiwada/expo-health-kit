import ExpoModulesCore
import HealthKit

public class ExpoHealthKitModule: Module {
    public static let healthStore = HKHealthStore()

    // Define the module's name
    public func definition() -> ModuleDefinition {
        Name("ExpoHealthKit")

        AsyncFunction("isHealthKitAvailable") { () -> Bool in
            return HKHealthStore.isHealthDataAvailable()
        }

        AsyncFunction("requestAuthorization") { (permissions: [String]) async throws -> Bool in
            let types = try self.getHealthKitTypes(from: permissions)
            let typesToRead = Set(types.readTypes)
            let typesToWrite = Set(types.writeTypes)

            do {
                try await healthStore.requestAuthorization(toShare: typesToWrite, read: typesToRead)
                return true
            } catch {
                throw error
            }
        }

        AsyncFunction("getAuthorizationStatus") { (permissions: [String]) -> [String: String] in
            var status: [String: String] = [:]
            let types = try self.getHealthKitTypes(from: permissions)

            for type in types.readTypes {
                let authStatus = healthStore.authorizationStatus(for: type)
                status[type.identifier] = self.stringFromAuthStatus(authStatus)
            }

            return status
        }

        AsyncFunction("queryHealthData") { (dataType: String, startDate: String, endDate: String, options: [String: Any]?) async throws -> [[String: Any]] in
            guard let type = try self.getSampleType(for: dataType) else {
                throw ExpoHealthKitError.invalidType
            }

            let start = ISO8601DateFormatter().date(from: startDate) ?? Date.distantPast
            let end = ISO8601DateFormatter().date(from: endDate) ?? Date()

            let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
            let limit = options?["limit"] as? Int ?? HKObjectQueryNoLimit
            let ascending = options?["ascending"] as? Bool ?? false

            return try await withCheckedThrowingContinuation { continuation in
                let query = HKSampleQuery(sampleType: type,
                                        predicate: predicate,
                                        limit: limit,
                                        sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: ascending)]) { (_, samples, error) in
                    if let error = error {
                        continuation.resume(throwing: error)
                        return
                    }

                    let results = samples?.map { sample -> [String: Any] in
                        var result: [String: Any] = [
                            "type": sample.sampleType.identifier,
                            "startDate": ISO8601DateFormatter().string(from: sample.startDate),
                            "endDate": ISO8601DateFormatter().string(from: sample.endDate),
                            "sourceName": sample.sourceRevision.source.name,
                            "uuid": sample.uuid.uuidString
                        ]

                        if let device = sample.device {
                            result["sourceDevice"] = device.name
                        }

                        if let quantitySample = sample as? HKQuantitySample {
                            let unit = self.getUnit(for: type.identifier)
                            result["value"] = quantitySample.quantity.doubleValue(for: unit)
                            result["unit"] = self.getUnitString(for: unit)
                        }

                        if !sample.metadata.isEmpty {
                            result["metadata"] = sample.metadata
                        }

                        return result
                    } ?? []

                    continuation.resume(returning: results)
                }

                healthStore.execute(query)
            }
        }

        AsyncFunction("exportHealthData") { (options: [String: Any]) async throws -> [String: Any] in
            guard let startDate = ISO8601DateFormatter().date(from: options["startDate"] as? String ?? ""),
                  let endDate = ISO8601DateFormatter().date(from: options["endDate"] as? String ?? ""),
                  let dataTypes = options["dataTypes"] as? [String],
                  let format = options["format"] as? String else {
                throw ExpoHealthKitError.invalidParameters
            }

            let types = try self.getHealthKitTypes(from: dataTypes)
            var allData: [[String: Any]] = []

            for type in types.readTypes {
                guard let sampleType = type as? HKSampleType else { continue }

                let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)

                let samples: [HKSample] = try await withCheckedThrowingContinuation { continuation in
                    let query = HKSampleQuery(sampleType: sampleType,
                                            predicate: predicate,
                                            limit: HKObjectQueryNoLimit,
                                            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { (_, samples, error) in
                        if let error = error {
                            continuation.resume(throwing: error)
                            return
                        }
                        continuation.resume(returning: samples ?? [])
                    }
                    healthStore.execute(query)
                }

                let exportData = samples.map { sample -> [String: Any] in
                    var data: [String: Any] = [
                        "type": sample.sampleType.identifier,
                        "startDate": ISO8601DateFormatter().string(from: sample.startDate),
                        "endDate": ISO8601DateFormatter().string(from: sample.endDate),
                        "sourceName": sample.sourceRevision.source.name,
                        "uuid": sample.uuid.uuidString
                    ]

                    if let quantitySample = sample as? HKQuantitySample {
                        let unit = self.getUnit(for: type.identifier)
                        data["value"] = quantitySample.quantity.doubleValue(for: unit)
                        data["unit"] = self.getUnitString(for: unit)
                    }

                    if let device = sample.device {
                        data["sourceDevice"] = device.name
                    }

                    if !sample.metadata.isEmpty {
                        data["metadata"] = sample.metadata
                    }

                    return data
                }

                allData.append(contentsOf: exportData)
            }

            // Convert to the requested format
            let exportPath = options["exportPath"] as? String ?? NSTemporaryDirectory().appending("healthkit_export.\(format)")

            if format == "xml" {
                try self.exportToXML(data: allData, to: exportPath)
            } else {
                try self.exportToJSON(data: allData, to: exportPath)
            }

            return [
                "success": true,
                "filePath": exportPath,
                "totalRecords": allData.count
            ]
        }
    }

    // MARK: - Helper Methods

    private func getHealthKitTypes(from identifiers: [String]) throws -> (readTypes: [HKObjectType], writeTypes: [HKObjectType]) {
        var readTypes: [HKObjectType] = []
        var writeTypes: [HKObjectType] = []

        for identifier in identifiers {
            guard let type = getSampleType(for: identifier) else {
                throw ExpoHealthKitError.invalidType
            }
            readTypes.append(type)
            if type is HKQuantityType {
                writeTypes.append(type)
            }
        }

        return (readTypes, writeTypes)
    }

    private func getSampleType(for identifier: String) -> HKObjectType? {
        if let quantityType = HKQuantityType.quantityType(forIdentifier: HKQuantityTypeIdentifier(rawValue: identifier)) {
            return quantityType
        }
        return nil
    }

    private func getUnit(for identifier: String) -> HKUnit {
        switch identifier {
        case HKQuantityTypeIdentifier.stepCount.rawValue:
            return .count()
        case HKQuantityTypeIdentifier.distanceWalkingRunning.rawValue:
            return .meter()
        case HKQuantityTypeIdentifier.heartRate.rawValue:
            return .count().unitDivided(by: .minute())
        case HKQuantityTypeIdentifier.activeEnergyBurned.rawValue:
            return .kilocalorie()
        case HKQuantityTypeIdentifier.bodyMass.rawValue:
            return .gramUnit(with: .kilo)
        case HKQuantityTypeIdentifier.height.rawValue:
            return .meter()
        case HKQuantityTypeIdentifier.bodyMassIndex.rawValue:
            return .count()
        case HKQuantityTypeIdentifier.bodyFatPercentage.rawValue:
            return .percent()
        case HKQuantityTypeIdentifier.bloodPressureSystolic.rawValue,
             HKQuantityTypeIdentifier.bloodPressureDiastolic.rawValue:
            return .millimeterOfMercury()
        case HKQuantityTypeIdentifier.respiratoryRate.rawValue:
            return .count().unitDivided(by: .minute())
        case HKQuantityTypeIdentifier.oxygenSaturation.rawValue:
            return .percent()
        case HKQuantityTypeIdentifier.bloodGlucose.rawValue:
            return HKUnit.gramUnit(with: .milli).unitDivided(by: .literUnit(with: .deci))
        default:
            return .count()
        }
    }

    private func getUnitString(for unit: HKUnit) -> String {
        switch unit {
        case HKUnit.count():
            return "count"
        case HKUnit.meter():
            return "m"
        case HKUnit.count().unitDivided(by: .minute()):
            return "count/min"
        case HKUnit.kilocalorie():
            return "kcal"
        case HKUnit.gramUnit(with: .kilo):
            return "kg"
        case HKUnit.percent():
            return "%"
        case HKUnit.millimeterOfMercury():
            return "mmHg"
        case HKUnit.gramUnit(with: .milli).unitDivided(by: .literUnit(with: .deci)):
            return "mg/dL"
        default:
            return unit.unitString
        }
    }

    private func stringFromAuthStatus(_ status: HKAuthorizationStatus) -> String {
        switch status {
        case .notDetermined:
            return "notDetermined"
        case .sharingDenied:
            return "sharingDenied"
        case .sharingAuthorized:
            return "authorized"
        @unknown default:
            return "unknown"
        }
    }

    private func exportToXML(data: [[String: Any]], to path: String) throws {
        var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
        xml += "<HealthData>\n"

        for record in data {
            xml += "  <Record type=\"\(record["type"] as? String ?? "")\">\n"
            for (key, value) in record {
                if key != "type" {
                    xml += "    <\(key)>\(value)</\(key)>\n"
                }
            }
            xml += "  </Record>\n"
        }

        xml += "</HealthData>"

        try xml.write(toFile: path, atomically: true, encoding: .utf8)
    }

    private func exportToJSON(data: [[String: Any]], to path: String) throws {
        let jsonData = try JSONSerialization.data(withJSONObject: ["records": data], options: .prettyPrinted)
        try jsonData.write(to: URL(fileURLWithPath: path))
    }
}

enum ExpoHealthKitError: Error {
    case invalidType
    case invalidParameters
    case exportFailed
}

// MARK: - Error Handling
extension ExpoHealthKitError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .invalidType:
            return "Invalid HealthKit type specified"
        case .invalidParameters:
            return "Invalid parameters provided"
        case .exportFailed:
            return "Failed to export health data"
        }
    }
}