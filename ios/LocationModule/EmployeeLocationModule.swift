//
//  EmployeeLocationModule.swift
//  sysboat
//

import CoreLocation
import Foundation
import React
import UIKit

// import AppTrackingTransparency
// import AdSupport

@objc(EmployeeLocationModule)
class EmployeeLocationModule: RCTEventEmitter,
  CLLocationManagerDelegate,
  URLSessionTaskDelegate
{

  // MARK: - Singleton
  static var shared: EmployeeLocationModule?

  // MARK: - Core
  private let locationManager = CLLocationManager()
  private var hasListeners = false
  private var isTracking = false
  private var isLiveMode = false
  private var isUploading = false

  // MARK: - Config
  private var punchOutTime: TimeInterval = 0
  private var companyLat: Double = 0
  private var companyLon: Double = 0
  private var companyRadius: Double = 0

  // MARK: - Constants (WhatsApp-style)
  private let MIN_DISTANCE_METERS: Double = 100  // meaningful movement
  private let BG_SESSION_ID = "com.sysboat.location.bg"

  // MARK: - Storage Keys
  private let LAST_LOCATION_KEY = "LAST_LOCATION"
  private let TRACKING_KEY = "IS_TRACKING"
  private let USER_ID_KEY = "USER_ID"
  private let COMPANY_ID_KEY = "COMPANY_ID"
  private let USER_DATA_KEY = "USER_DATA"
  private let AUTH_TOKEN_KEY = "AUTH_TOKEN"

  // MARK: - Background Session
  // private lazy var bgSession: URLSession = {
  //   let config = URLSessionConfiguration.background(withIdentifier: BG_SESSION_ID)
  //   config.waitsForConnectivity = true
  //   config.sessionSendsLaunchEvents = true
  //   return URLSession(configuration: config, delegate: self, delegateQueue: nil)
  // }()

  private lazy var bgSession: URLSession = {
    let config = URLSessionConfiguration.default
    return URLSession(configuration: config)
  }()

  // MARK: - Init
  override init() {
    super.init()
    EmployeeLocationModule.shared = self

    locationManager.delegate = self
    locationManager.allowsBackgroundLocationUpdates = false
    // locationManager.allowsBackgroundLocationUpdates = true
    // locationManager.pausesLocationUpdatesAutomatically = true

    // WhatsApp default (battery-safe)
    locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    locationManager.distanceFilter = MIN_DISTANCE_METERS
    locationManager.activityType = .other

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(appDidBecomeActive),
      name: UIApplication.didBecomeActiveNotification,
      object: nil
    )
  }

  // MARK: - React
  override static func requiresMainQueueSetup() -> Bool { true }

  override func supportedEvents() -> [String]! {
    [
      "locationUpdate",
      "trackingStopped",
      "regionEvent",
      "locationPermissionRequired",
    ]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  // MARK: - Permissions
  @objc
  func requestPermission() {
    // locationManager.requestAlwaysAuthorization()
    locationManager.requestWhenInUseAuthorization()

  }

  @objc
  func getLocationPermissionStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    switch locationManager.authorizationStatus {
    case .authorizedAlways: resolve("always")
    case .authorizedWhenInUse: resolve("when_in_use")
    case .denied: resolve("denied")
    case .restricted: resolve("restricted")
    case .notDetermined: resolve("not_determined")
    @unknown default: resolve("unknown")
    }
  }

  // MARK: - Start Tracking (NORMAL MODE)
  @objc
  func startTracking(
    _ userId: String,
    companyId: String,
    userData: NSDictionary,
    token: String,
    punchIn: Double,
    punchOut: Double,
    compLat: Double,
    compLon: Double,
    radius: Double,
    intervalMs: Double
  ) {

    // Persist context
    UserDefaults.standard.set(userId, forKey: USER_ID_KEY)
    UserDefaults.standard.set(companyId, forKey: COMPANY_ID_KEY)
    UserDefaults.standard.set(userData, forKey: USER_DATA_KEY)
    UserDefaults.standard.set(token, forKey: AUTH_TOKEN_KEY)

    companyLat = compLat
    companyLon = compLon
    companyRadius = radius
    punchOutTime = punchOut

    let status = locationManager.authorizationStatus

    if status == .notDetermined {
      requestPermission()
      return
    }

    if status != .authorizedWhenInUse {
      sendEventIfNeeded(
        "locationPermissionRequired",
        body: ["required": "when_in_use"]
      )
      return
    }

    // if status != .authorizedAlways {
    //   sendEventIfNeeded(
    //     "locationPermissionRequired",
    //     body: ["required": "always"]
    //   )
    //   return
    // }

    isTracking = true
    UserDefaults.standard.set(true, forKey: TRACKING_KEY)

    // startGeofenceIfNeeded()

    // WhatsApp-style: only significant changes
    // locationManager.startMonitoringSignificantLocationChanges()

    // Send last known location immediately (cheap + instant)
    if let last = locationManager.location {
      handleLocation(last)
    }

    scheduleAutoStop()
  }

  // MARK: - Live Location Mode (TEMPORARY)
  @objc
  func startLiveLocation(_ minutes: Double) {
    guard isTracking else { return }

    isLiveMode = true
    locationManager.desiredAccuracy = kCLLocationAccuracyBest
    locationManager.distanceFilter = 10
    // locationManager.pausesLocationUpdatesAutomatically = false
    locationManager.activityType = .automotiveNavigation
    locationManager.startUpdatingLocation()

    DispatchQueue.main.asyncAfter(deadline: .now() + minutes * 60) {
      self.stopLiveLocation()
    }
  }

  @objc
  func stopLiveLocation() {
    guard isLiveMode else { return }
    isLiveMode = false

    locationManager.stopUpdatingLocation()
    locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    locationManager.distanceFilter = MIN_DISTANCE_METERS
    locationManager.activityType = .other
  }

  // MARK: - Stop Tracking
  @objc
  func stopTracking() {
    isTracking = false
    isLiveMode = false

    locationManager.stopUpdatingLocation()
    locationManager.stopMonitoringSignificantLocationChanges()

    locationManager.monitoredRegions.forEach {
      locationManager.stopMonitoring(for: $0)
    }

    UserDefaults.standard.set(false, forKey: TRACKING_KEY)
    sendEventIfNeeded("trackingStopped", body: nil)
  }

  // MARK: - Location Delegate
  func locationManager(
    _ manager: CLLocationManager,
    didUpdateLocations locations: [CLLocation]
  ) {
    guard let loc = locations.last, isTracking else { return }

    // Ignore stale
    if abs(loc.timestamp.timeIntervalSinceNow) > 30 { return }

    // Meaningful movement filter (WhatsApp style)
    if !isLiveMode && !isMeaningfulMovement(loc) {
      return
    }

    handleLocation(loc)
  }

  private func handleLocation(_ loc: CLLocation) {
    let payload: [String: Any] = [
      "userId": UserDefaults.standard.string(forKey: USER_ID_KEY) ?? "",
      "companyId": UserDefaults.standard.string(forKey: COMPANY_ID_KEY) ?? "",
      "userData": UserDefaults.standard.dictionary(forKey: USER_DATA_KEY) ?? [:],
      "latitude": loc.coordinate.latitude,
      "longitude": loc.coordinate.longitude,
      "accuracy": loc.horizontalAccuracy,
      "timestamp": loc.timestamp.timeIntervalSince1970,
    ]

    saveLastLocation(payload)
    enqueueOffline(payload)
    uploadQueuedFilesIfNeeded()

    sendEventIfNeeded("locationUpdate", body: payload)
  }

  // MARK: - Meaningful Movement
  private func isMeaningfulMovement(_ loc: CLLocation) -> Bool {
    guard
      let last = UserDefaults.standard.dictionary(forKey: LAST_LOCATION_KEY),
      let lat = last["latitude"] as? Double,
      let lon = last["longitude"] as? Double
    else { return true }

    let lastLoc = CLLocation(latitude: lat, longitude: lon)
    return loc.distance(from: lastLoc) >= MIN_DISTANCE_METERS
  }

  // MARK: - Offline Queue
  private func queueDir() -> URL {
    let dir = FileManager.default
      .urls(for: .documentDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("location_queue")

    if !FileManager.default.fileExists(atPath: dir.path) {
      try? FileManager.default.createDirectory(
        at: dir,
        withIntermediateDirectories: true
      )
    }
    return dir
  }

  private func enqueueOffline(_ payload: [String: Any]) {
    let file = queueDir()
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension("json")

    if let data = try? JSONSerialization.data(withJSONObject: payload) {
      try? data.write(to: file)
    }
  }

  // MARK: - Background Upload (SAFE)
  private func uploadQueuedFilesIfNeeded() {
    if isUploading { return }
    isUploading = true

    let files =
      (try? FileManager.default.contentsOfDirectory(
        at: queueDir(),
        includingPropertiesForKeys: nil
      )) ?? []

    if files.isEmpty {
      isUploading = false
      return
    }

    var payloads: [[String: Any]] = []

    for file in files {
      guard
        let data = try? Data(contentsOf: file),
        let json = try? JSONSerialization.jsonObject(with: data)
          as? [String: Any]
      else { continue }
      payloads.append(json)
    }

    guard !payloads.isEmpty else {
      isUploading = false
      return
    }

    let bulkFile = queueDir()
      .appendingPathComponent("bulk-\(UUID().uuidString).json")

    do {
      let bulkData = try JSONSerialization.data(withJSONObject: payloads)
      try bulkData.write(to: bulkFile)
    } catch {
      isUploading = false
      return
    }

    let token = UserDefaults.standard.string(forKey: AUTH_TOKEN_KEY) ?? ""

    var request = URLRequest(
      url: URL(string: "https://api.sysboat.com/location/bulk")!
    )
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

    let task = bgSession.uploadTask(with: request, fromFile: bulkFile)
    task.taskDescription = bulkFile.lastPathComponent
    task.resume()
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didCompleteWithError error: Error?
  ) {
    guard let name = task.taskDescription else {
      isUploading = false
      return
    }

    let bulkFile = queueDir().appendingPathComponent(name)
    try? FileManager.default.removeItem(at: bulkFile)

    if error == nil {
      let files =
        (try? FileManager.default.contentsOfDirectory(
          at: queueDir(),
          includingPropertiesForKeys: nil
        )) ?? []

      for file in files where !file.lastPathComponent.hasPrefix("bulk-") {
        try? FileManager.default.removeItem(at: file)
      }
    }

    isUploading = false
  }

  // MARK: - Geofence
  private func startGeofenceIfNeeded() {
    guard companyLat != 0, companyLon != 0, companyRadius > 0 else { return }

    let region = CLCircularRegion(
      center: CLLocationCoordinate2D(latitude: companyLat, longitude: companyLon),
      radius: companyRadius,
      identifier: "COMPANY_REGION"
    )
    region.notifyOnEntry = true
    region.notifyOnExit = true
    locationManager.startMonitoring(for: region)
  }

  func locationManager(
    _ manager: CLLocationManager,
    didEnterRegion region: CLRegion
  ) {
    sendEventIfNeeded("regionEvent", body: ["event": "enter"])
  }

  func locationManager(
    _ manager: CLLocationManager,
    didExitRegion region: CLRegion
  ) {
    sendEventIfNeeded("regionEvent", body: ["event": "exit"])
  }

  // MARK: - Auto Stop
  private func scheduleAutoStop() {
    guard punchOutTime > 0 else { return }
    let delay = punchOutTime - Date().timeIntervalSince1970
    if delay <= 0 { return }

    DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
      self.stopTracking()
    }
  }

  // MARK: - Persistence
  private func saveLastLocation(_ data: [String: Any]) {
    UserDefaults.standard.set(data, forKey: LAST_LOCATION_KEY)
  }

  // MARK: - Events
  private func sendEventIfNeeded(_ name: String, body: Any?) {
    if hasListeners {
      sendEvent(withName: name, body: body)
    }
  }

  // MARK: - Silent Push Hook
  // @objc
  // func handleServerCommand(_ command: String) {
  //   if command == "syncLocation" {
  //     if let last = locationManager.location {
  //       handleLocation(last)
  //     }
  //   } else if command == "stopTracking" {
  //     stopTracking()
  //   }
  // }

  @objc
  private func appDidBecomeActive() {
    if let last = locationManager.location {
      handleLocation(last)
    }
  }
}
