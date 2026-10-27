import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore

@main
class AppDelegate: RCTAppDelegate {

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
  ) -> Bool {

    // ----------------------------------------------------
    // 🔥 Firebase Initialization
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }
    // ----------------------------------------------------

    self.moduleName = "sysboat"
    self.dependencyProvider = RCTAppDependencyProvider()
    self.initialProps = [:]

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // MARK: - React Native Bundle
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings()
      .jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

  // MARK: - 🔁 Background URL Session (CRITICAL)
  override func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    // iOS wakes the app to finish background uploads
    completionHandler()
  }

  // MARK: - 🔔 Silent Push Handler
  override func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable : Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {

    // if let command = userInfo["command"] as? String {
    //   // Forward command to location module
    //   EmployeeLocationModule.shared?.handleServerCommand(command)
    // }

    completionHandler(.newData)
  }
}
