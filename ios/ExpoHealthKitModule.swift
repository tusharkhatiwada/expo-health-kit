import ExpoModulesCore
import HealthKit

public class ExpoHealthKitModule: Module {
    public static let healthStore = HKHealthStore()
    private var observers: [String: HKObserverQuery] = [:]

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

        AsyncFunction("enableBackgroundDelivery") { (dataType: String, updateInterval: Double) async throws -> Bool in
            guard let type = try self.getSampleType(for: dataType) as? HKQuantityType else {
                throw ExpoHealthKitError.invalidType
            }

            let frequency: HKUpdateFrequency
            if updateInterval <= 3600 {
                frequency = .hourly
            } else if updateInterval <= 86400 {
                frequency = .daily
            } else {
                frequency = .weekly
            }

            do {
                try await healthStore.enableBackgroundDelivery(for: type, frequency: frequency)

                // Set up observer query
                let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] (query, completionHandler, error) in
                    if let error = error {
                        print("Background delivery error: \(error.localizedDescription)")
                        completionHandler()
                        return
                    }

                    // Handle the update
                    self?.sendEvent("healthKitUpdate", [
                        "type": dataType,
                        "timestamp": ISO8601DateFormatter().string(from: Date())
                    ])

                    completionHandler()
                }

                healthStore.execute(query)
                observers[dataType] = query

                return true
            } catch {
                throw ExpoHealthKitError.backgroundDeliveryFailed
            }
        }

        AsyncFunction("disableBackgroundDelivery") { (dataType: String) async throws -> Bool in
            guard let type = try self.getSampleType(for: dataType) as? HKQuantityType else {
                throw ExpoHealthKitError.invalidType
            }

            do {
                try await healthStore.disableBackgroundDelivery(for: type)

                if let query = observers[dataType] {
                    healthStore.stop(query)
                    observers.removeValue(forKey: dataType)
                }

                return true
            } catch {
                throw ExpoHealthKitError.backgroundDeliveryFailed
            }
        }

        // Add event emitter for background updates
        EventEmitter {
            Event("healthKitUpdate") { [String: Any] in }
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
        // Activity and Fitness
        case HKQuantityTypeIdentifier.stepCount.rawValue,
             HKQuantityTypeIdentifier.flightsClimbed.rawValue,
             HKQuantityTypeIdentifier.pushCount.rawValue,
             HKQuantityTypeIdentifier.swimmingStrokeCount.rawValue:
            return .count()

        case HKQuantityTypeIdentifier.distanceWalkingRunning.rawValue,
             HKQuantityTypeIdentifier.distanceCycling.rawValue,
             HKQuantityTypeIdentifier.distanceSwimming.rawValue,
             HKQuantityTypeIdentifier.height.rawValue,
             HKQuantityTypeIdentifier.waistCircumference.rawValue:
            return .meter()

        case HKQuantityTypeIdentifier.activeEnergyBurned.rawValue,
             HKQuantityTypeIdentifier.basalEnergyBurned.rawValue,
             HKQuantityTypeIdentifier.dietaryEnergyConsumed.rawValue:
            return .kilocalorie()

        case HKQuantityTypeIdentifier.appleExerciseTime.rawValue,
             HKQuantityTypeIdentifier.appleStandTime.rawValue,
             HKQuantityTypeIdentifier.workoutMinutes.rawValue,
             HKQuantityTypeIdentifier.mindfulMinutes.rawValue:
            return .minute()

        // Body Measurements
        case HKQuantityTypeIdentifier.bodyMass.rawValue,
             HKQuantityTypeIdentifier.leanBodyMass.rawValue:
            return .gramUnit(with: .kilo)

        case HKQuantityTypeIdentifier.bodyMassIndex.rawValue:
            return .count()

        case HKQuantityTypeIdentifier.bodyFatPercentage.rawValue,
             HKQuantityTypeIdentifier.oxygenSaturation.rawValue,
             HKQuantityTypeIdentifier.walkingAsymmetryPercentage.rawValue,
             HKQuantityTypeIdentifier.walkingDoubleSupportPercentage.rawValue,
             HKQuantityTypeIdentifier.appleWalkingSteadiness.rawValue:
            return .percent()

        // Heart and Fitness
        case HKQuantityTypeIdentifier.heartRate.rawValue,
             HKQuantityTypeIdentifier.restingHeartRate.rawValue,
             HKQuantityTypeIdentifier.walkingHeartRateAverage.rawValue,
             HKQuantityTypeIdentifier.respiratoryRate.rawValue:
            return .count().unitDivided(by: .minute())

        case HKQuantityTypeIdentifier.heartRateVariabilitySDNN.rawValue:
            return .secondUnit(with: .milli)

        case HKQuantityTypeIdentifier.vo2Max.rawValue:
            return HKUnit.literUnit(with: .milli).unitDivided(by: .gramUnit(with: .kilo)).unitMultiplied(by: .minute())

        case HKQuantityTypeIdentifier.walkingSpeed.rawValue,
             HKQuantityTypeIdentifier.stairAscentSpeed.rawValue,
             HKQuantityTypeIdentifier.stairDescentSpeed.rawValue:
            return .meter().unitDivided(by: .second())

        case HKQuantityTypeIdentifier.walkingStepLength.rawValue:
            return .meter()

        // Vitals
        case HKQuantityTypeIdentifier.bloodPressureSystolic.rawValue,
             HKQuantityTypeIdentifier.bloodPressureDiastolic.rawValue:
            return .millimeterOfMercury()

        case HKQuantityTypeIdentifier.bodyTemperature.rawValue,
             HKQuantityTypeIdentifier.basalBodyTemperature.rawValue,
             HKQuantityTypeIdentifier.waterTemperature.rawValue:
            return .degreeCelsius()

        case HKQuantityTypeIdentifier.bloodGlucose.rawValue:
            return HKUnit.gramUnit(with: .milli).unitDivided(by: .literUnit(with: .deci))

        case HKQuantityTypeIdentifier.bloodAlcoholContent.rawValue:
            return .percent()

        case HKQuantityTypeIdentifier.forcedVitalCapacity.rawValue,
             HKQuantityTypeIdentifier.forcedExpiratoryVolume1.rawValue:
            return .liter()

        case HKQuantityTypeIdentifier.peakExpiratoryFlowRate.rawValue:
            return .liter().unitDivided(by: .minute())

        case HKQuantityTypeIdentifier.environmentalAudioExposure.rawValue,
             HKQuantityTypeIdentifier.headphoneAudioExposure.rawValue:
            return .decibelAWeightedSoundPressureLevel()

        // Nutrition
        case HKQuantityTypeIdentifier.dietaryCarbohydrates.rawValue,
             HKQuantityTypeIdentifier.dietaryFiber.rawValue,
             HKQuantityTypeIdentifier.dietarySugar.rawValue,
             HKQuantityTypeIdentifier.dietaryFatTotal.rawValue,
             HKQuantityTypeIdentifier.dietaryFatSaturated.rawValue,
             HKQuantityTypeIdentifier.dietaryProtein.rawValue,
             HKQuantityTypeIdentifier.dietaryCholesterol.rawValue,
             HKQuantityTypeIdentifier.dietarySodium.rawValue,
             HKQuantityTypeIdentifier.dietaryPotassium.rawValue,
             HKQuantityTypeIdentifier.dietaryCalcium.rawValue,
             HKQuantityTypeIdentifier.dietaryIron.rawValue:
            return .gram()

        case HKQuantityTypeIdentifier.dietaryVitaminC.rawValue,
             HKQuantityTypeIdentifier.dietaryVitaminD.rawValue:
            return .gramUnit(with: .micro)

        case HKQuantityTypeIdentifier.dietaryWater.rawValue:
            return .liter()

        case HKQuantityTypeIdentifier.dietaryCaffeine.rawValue:
            return .gramUnit(with: .milli)

        // Sleep
        case HKQuantityTypeIdentifier.sleepDurationInBed.rawValue,
             HKQuantityTypeIdentifier.sleepCore.rawValue,
             HKQuantityTypeIdentifier.sleepDeep.rawValue,
             HKQuantityTypeIdentifier.sleepREM.rawValue,
             HKQuantityTypeIdentifier.sleepAwake.rawValue:
            return .hour()

        // Other
        case HKQuantityTypeIdentifier.insulinDelivery.rawValue:
            return .internationalUnit()

        case HKQuantityTypeIdentifier.timeInDaylight.rawValue:
            return .minute()

        case HKQuantityTypeIdentifier.uvExposure.rawValue:
            return .count()

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
        case HKUnit.minute():
            return "min"
        case HKUnit.hour():
            return "hr"
        case HKUnit.secondUnit(with: .milli):
            return "ms"
        case HKUnit.degreeCelsius():
            return "°C"
        case HKUnit.liter():
            return "L"
        case HKUnit.liter().unitDivided(by: .minute()):
            return "L/min"
        case HKUnit.decibelAWeightedSoundPressureLevel():
            return "dB"
        case HKUnit.gram():
            return "g"
        case HKUnit.gramUnit(with: .micro):
            return "µg"
        case HKUnit.gramUnit(with: .milli):
            return "mg"
        case HKUnit.internationalUnit():
            return "IU"
        case HKUnit.meter().unitDivided(by: .second()):
            return "m/s"
        case HKUnit.literUnit(with: .milli).unitDivided(by: .gramUnit(with: .kilo)).unitMultiplied(by: .minute()):
            return "mL/kg/min"
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
    case backgroundDeliveryFailed
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
        case .backgroundDeliveryFailed:
            return "Failed to configure background delivery"
        }
    }
}