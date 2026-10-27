package com.sysboat.name.storagemodule

import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.facebook.react.bridge.*

class NativeStorageModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {


    private val sharedPrefs: SharedPreferences by lazy {
        val masterKey = MasterKey.Builder(reactContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            reactContext,
            "secure_app_prefs", // File name
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    override fun getName(): String = "NativeStorage"

    @ReactMethod
    fun setString(key: String, value: String?, promise: Promise) {
        try {
            if (value == null) {
                sharedPrefs.edit().remove(key).apply()
            } else {
                sharedPrefs.edit().putString(key, value).apply()
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getString(key: String, promise: Promise) {
        try {
            val value = sharedPrefs.getString(key, null)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("GET_ERROR", e.message)
        }
    }

    @ReactMethod
    fun remove(key: String, promise: Promise) {
        try {
            sharedPrefs.edit().remove(key).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REMOVE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun clearAll(promise: Promise) {
        try {
            sharedPrefs.edit().clear().apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLEAR_ERROR", e.message)
        }
    }
}