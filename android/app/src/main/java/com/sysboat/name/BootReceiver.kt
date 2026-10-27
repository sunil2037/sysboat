package com.sysboat.name

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            "com.htc.intent.action.QUICKBOOT_POWERON" -> {
                Log.i("BootReceiver", "Device booted - checking if location tracking should restart")

                // Check if we should restart tracking
                val prefs = context.getSharedPreferences("LocationPrefs", Context.MODE_PRIVATE)
                val isTracking = prefs.getBoolean("is_tracking", false)
                val manuallyStopped = prefs.getBoolean("manually_stopped", false)

                if (isTracking && !manuallyStopped) {
                    val serviceIntent = Intent(context, LocationService::class.java).apply {
                        action = LocationService.
                        ACTION_RESTART_TRACKING
                    }

                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            context.startForegroundService(serviceIntent)
                        } else {
                            context.startService(serviceIntent)
                        }
                        Log.i("BootReceiver", "Location service restarted after boot")
                    } catch (e: Exception) {
                        Log.e("BootReceiver", "Failed to restart location service after boot: ${e.message}")
                    }
                } else {
                    Log.i("BootReceiver", "No need to restart location service - was not tracking before boot")
                }
            }
        }
    }
}