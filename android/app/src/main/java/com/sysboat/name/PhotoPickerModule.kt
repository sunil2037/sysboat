package com.sysboat.name

import android.net.Uri
import android.util.Log
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts.PickMultipleVisualMedia
import androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class PhotoPickerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var pickerFragment: PhotoPickerFragment? = null

    override fun getName(): String = "PhotoPickerModule"

    private fun getPickerFragment(activity: FragmentActivity): PhotoPickerFragment {
        val fragmentManager = activity.supportFragmentManager
        var fragment = fragmentManager.findFragmentByTag("PhotoPickerFragment") as? PhotoPickerFragment
        if (fragment == null) {
            fragment = PhotoPickerFragment()
            fragmentManager.beginTransaction()
                .add(fragment, "PhotoPickerFragment")
                .commitNow()
        }
        return fragment
    }

    @ReactMethod
    fun pickSingleMedia(mediaType: String, promise: Promise) {
        val activity = currentActivity
        if (activity !is FragmentActivity) {
            promise.reject("E_ACTIVITY_ERROR", "Activity is not a FragmentActivity.")
            return
        }

        UiThreadUtil.runOnUiThread {
            try {
                pickerFragment = getPickerFragment(activity)
                pickerFragment?.launchSinglePicker(mediaType, promise)
            } catch (e: Exception) {
                promise.reject("E_MAIN_THREAD_FAIL", "Failed to launch picker on main thread", e)
            }
        }
    }

    @ReactMethod
    fun pickMultipleMedia(maxSelection: Int, mediaType: String, promise: Promise) {
        val activity = currentActivity
        if (activity !is FragmentActivity) {
            promise.reject("E_ACTIVITY_ERROR", "Activity is not a FragmentActivity.")
            return
        }

        UiThreadUtil.runOnUiThread {
            try {
                pickerFragment = getPickerFragment(activity)
                pickerFragment?.launchMultiplePicker(maxSelection, mediaType, promise)
            } catch (e: Exception) {
                promise.reject("E_MAIN_THREAD_FAIL", "Failed to launch picker on main thread", e)
            }
        }
    }
}