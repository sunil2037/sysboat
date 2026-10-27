package com.sysboat.name.DoubleClickExit
import android.widget.Toast
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DoubleClickExitModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var lastBackPressed: Long = 0
    private val EXIT_INTERVAL = 2000L // 2 seconds

    override fun getName(): String {
        return "DoubleClickExit"
    }

    @ReactMethod
    fun handleBackPress() {
        val activity = currentActivity ?: return
        val now = System.currentTimeMillis()

        if (now - lastBackPressed < EXIT_INTERVAL) {
            activity.finishAffinity()
        } else {
            lastBackPressed = now
            Toast.makeText(activity, "Press back again to exit", Toast.LENGTH_SHORT).show()
        }
    }
}