package com.sysboat.name

import android.app.Application
import android.util.Log
import androidx.work.Configuration
import androidx.work.WorkManager
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.sysboat.BuildConfig
import com.sysboat.name.InAppUpdate.InAppUpdatePackage
import com.sysboat.name.DoubleClickExit.DoubleClickExitPackage
import com.sysboat.name.BottomSheet.BottomSheetPackage
import com.sysboat.name.facerecognition.FaceRecognitionPackage
import com.sysboat.name.FaceRecognitionModule.FaceRecognitionPackage as ModuleFaceRecognitionPackage
import com.sysboat.name.storagemodule.StoragePackage
import com.sysboat.name.DatePicker.DateRangePickerPackage
import com.sysboat.name.TimePicker.TimePickerPackage

class MainApplication : Application(), ReactApplication, Configuration.Provider {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    add(MyAppPackage())
                    add(LocationPackage())
                    add(InAppUpdatePackage())
                    add(PhotoPickerPackage())
                    add(DoubleClickExitPackage())
                    add(BottomSheetPackage())
                    add(FaceRecognitionPackage())
                    add(ModuleFaceRecognitionPackage())
                    add(StoragePackage())
                    add(DateRangePickerPackage())
                    add(TimePickerPackage())
                }

            override fun getJSMainModuleName(): String = "index"
            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()

        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            load()
        }

        // ✅ Initialize WorkManager safely
        try {
            Log.i("MainApplication", "Initializing WorkManager manually...")
            WorkManager.initialize(
                this,
                workManagerConfiguration
            )
        } catch (e: Exception) {
            Log.e("MainApplication", "Failed to initialize WorkManager: ${e.message}")
        }
    }

    // ✅ Correct Implementation of Configuration.Provider
    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setMinimumLoggingLevel(Log.INFO)
            .build()
}
