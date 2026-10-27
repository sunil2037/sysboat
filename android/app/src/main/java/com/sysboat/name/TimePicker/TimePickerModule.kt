package com.sysboat.name.TimePicker

import android.text.format.DateFormat
import com.facebook.react.bridge.*
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat

class TimePickerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MaterialTimePicker"

    /**
     * Options (JS object):
     *   title        String   – dialog title (default: "Select Time")
     *   hour         Int      – initial hour 0-23 (default: 12)
     *   minute       Int      – initial minute 0-59 (default: 0)
     *   inputMode    String   – "clock" | "keyboard" (default: system)
     *   is24Hour     Boolean  – override system 24h setting (default: follows device)
     */
    @ReactMethod
    fun show(options: ReadableMap, promise: Promise) {
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }

        val title = if (options.hasKey("title")) options.getString("title") ?: "Select Time"
        else "Select Time"

        val hour   = if (options.hasKey("hour"))   options.getInt("hour")   else 12
        val minute = if (options.hasKey("minute")) options.getInt("minute") else 0

        val use24Hour = if (options.hasKey("is24Hour")) options.getBoolean("is24Hour")
        else DateFormat.is24HourFormat(reactContext)
        val clockFormat = if (use24Hour) TimeFormat.CLOCK_24H else TimeFormat.CLOCK_12H

        val inputModeStr = if (options.hasKey("inputMode")) options.getString("inputMode") else null
        val inputMode = when (inputModeStr?.lowercase()) {
            "clock"    -> MaterialTimePicker.INPUT_MODE_CLOCK
            "keyboard" -> MaterialTimePicker.INPUT_MODE_KEYBOARD
            else       -> if (use24Hour) MaterialTimePicker.INPUT_MODE_KEYBOARD
            else           MaterialTimePicker.INPUT_MODE_CLOCK
        }

        val picker = MaterialTimePicker.Builder()
            .setTitleText(title)
            .setHour(hour)
            .setMinute(minute)
            .setTimeFormat(clockFormat)
            .setInputMode(inputMode)
            .build()

        picker.addOnPositiveButtonClickListener {
            val result = Arguments.createMap().apply {
                putInt("hour",   picker.hour)
                putInt("minute", picker.minute)
                putString("time", "%02d:%02d".format(picker.hour, picker.minute))
            }
            promise.resolve(result)
        }

        val dismissCallback = { promise.resolve(null) }
        picker.addOnNegativeButtonClickListener { dismissCallback() }
        picker.addOnCancelListener             { dismissCallback() }

        activity.runOnUiThread {
            val fm = (activity as? androidx.fragment.app.FragmentActivity)?.supportFragmentManager
                ?: run {
                    promise.reject("NO_FRAGMENT_MANAGER", "Activity does not support fragments")
                    return@runOnUiThread
                }
            picker.show(fm, "MaterialTimePicker")
        }
    }
}