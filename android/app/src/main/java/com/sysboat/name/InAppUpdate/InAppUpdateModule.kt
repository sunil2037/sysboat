package com.sysboat.name.InAppUpdate

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability

class InAppUpdateModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val appUpdateManager: AppUpdateManager = AppUpdateManagerFactory.create(reactContext)

    override fun getName(): String = "InAppUpdateModule"

    @ReactMethod
    fun checkForUpdate(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("E_NO_ACTIVITY", "No current activity available")
            return
        }

        val appUpdateInfoTask = appUpdateManager.appUpdateInfo

        appUpdateInfoTask.addOnSuccessListener { appUpdateInfo ->
            val updateAvailable =
                appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE

            val immediateAllowed = appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)
            val flexibleAllowed = appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)

            if (updateAvailable && (immediateAllowed || flexibleAllowed)) {
                try {
                    val updateType = if (immediateAllowed) AppUpdateType.IMMEDIATE else AppUpdateType.FLEXIBLE

                    val appUpdateOptions = AppUpdateOptions.newBuilder(updateType).build()

                    appUpdateManager.startUpdateFlowForResult(
                        appUpdateInfo,
                        activity,
                        appUpdateOptions,
                        123
                    )
                    promise.resolve(true)
                } catch (e: Exception) {
                    promise.reject("E_UPDATE_START_FAILED", "Could not start update flow", e)
                }
            } else {
                promise.resolve(false)
            }
        }.addOnFailureListener { exception ->
            promise.reject("E_UPDATE_CHECK_FAILED", "In-App Update check failed", exception)
        }
    }
}