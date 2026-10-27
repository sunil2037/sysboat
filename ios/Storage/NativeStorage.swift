//
//  NativeStorage.swift
//  sysboat
//
//  Created by Sunil Sharma on 19/12/25.
//

import Foundation
import Security
import React

@objc(NativeStorage)
class NativeStorage: NSObject {

  private let service = Bundle.main.bundleIdentifier ?? "NativeStorage"

  // MARK: - React Native Setup
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // MARK: - Set String
  @objc(setString:value:)
  func setString(_ key: String, value: String?) {
    if let value = value {
      save(key: key, value: value)
    } else {
      delete(key: key)
    }
  }

  // MARK: - Get String
  @objc(getString:resolver:rejecter:)
  func getString(
    _ key: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let value = load(key: key)
    resolve(value)
  }

  // MARK: - Remove Key
  @objc(remove:)
  func remove(_ key: String) {
    delete(key: key)
  }

  // MARK: - Clear All
  @objc
  func clearAll() {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service
    ]
    SecItemDelete(query as CFDictionary)
  }

  // MARK: - Keychain Helpers
  private func save(key: String, value: String) {
    let data = value.data(using: .utf8)!

    delete(key: key)

    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
      kSecValueData as String: data
    ]

    SecItemAdd(query as CFDictionary, nil)
  }

  private func load(key: String) -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne
    ]

    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)

    guard
      status == errSecSuccess,
      let data = result as? Data,
      let value = String(data: data, encoding: .utf8)
    else {
      return nil
    }

    return value
  }

  private func delete(key: String) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key
    ]

    SecItemDelete(query as CFDictionary)
  }
}
