package com.sysboat.name

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class ServiceMonitorWorker(context: Context, workerParams: WorkerParameters) :
    Worker(context, workerParams) {

    companion object {
        private const val TAG = "ServiceMonitorWorker"
        private const val OVERTIME_BUFFER_MS = 2 * 60 * 60 * 1000L // 2 hours

    }

    override fun doWork(): Result {
        return try {
            val prefs = applicationContext.getSharedPreferences("LocationPrefs", Context.MODE_PRIVATE)
            val isTracking = prefs.getBoolean("is_tracking", false)

            if (isTracking) {
                // Check if we should auto-stop due to overtime
                if (shouldAutoStop(prefs)) {
                    Log.w(TAG, "Auto-stop condition met - stopping service")
                    stopLocationService()

                    // Clear tracking state
                    prefs.edit()
                        .putBoolean("is_tracking", false)
                        .putFloat(LocationService.KEY_LAST_LAT, 0f)
                        .putFloat(LocationService.KEY_LAST_LON, 0f)
                        .apply()

                    return Result.success()
                }

                if (!isServiceRunning(LocationService::class.java)) {
                    val manuallyStopped = prefs.getBoolean("manually_stopped", false)
                    if (!manuallyStopped) {
                        Log.w(TAG, "LocationService not running — restarting")
                        val intent = Intent(applicationContext, LocationService::class.java)
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                            applicationContext.startForegroundService(intent)
                        } else {
                            applicationContext.startService(intent)
                        }
                    }
                }
            }

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error checking service: ${e.message}")
            Result.retry()
        }
    }

    /**
     * Checks if the service should be auto-stopped based on:
     * 1. Punch out time + 2 hours buffer
     * 2. Punch in time + working hours + 2 hours buffer
     */
    private fun shouldAutoStop(prefs: android.content.SharedPreferences): Boolean {
        val punchIn = prefs.getLong(LocationService.KEY_PUNCH_IN, 0L)
        val punchOut = prefs.getLong(LocationService.KEY_PUNCH_OUT, 0L)
        val workingHours = prefs.getLong(LocationService.KEY_WORKING_HOURS, 9L)

        if (punchIn == 0L) {
            return false // No punch-in time set
        }

        val now = System.currentTimeMillis()

        // Calculate when service should stop
        val stopTime = when {
            // If punch out is set and in the past, check if we're past the buffer
            punchOut != 0L && punchOut < now -> {
                punchOut + OVERTIME_BUFFER_MS
            }
            // Otherwise use punch in + working hours + buffer
            else -> {
                val workingHoursMs = TimeUnit.HOURS.toMillis(workingHours)
                punchIn + workingHoursMs + OVERTIME_BUFFER_MS
            }
        }

        val shouldStop = now >= stopTime

        if (shouldStop) {
            val hoursOvertime = TimeUnit.MILLISECONDS.toHours(now - (punchOut.takeIf { it > 0 } ?: (punchIn + TimeUnit.HOURS.toMillis(workingHours))))
            Log.i(TAG, "Auto-stop triggered: $hoursOvertime hours past end time")
        }

        return shouldStop
    }

    private fun stopLocationService() {
        try {
            val intent = Intent(applicationContext, LocationService::class.java).apply {
                action = LocationModule.ACTION_STOP_TRACKING
            }
            applicationContext.startService(intent)
            Log.i(TAG, "Sent stop command to LocationService")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping LocationService: ${e.message}")
        }
    }

    private fun isServiceRunning(serviceClass: Class<*>): Boolean {
        val manager = applicationContext.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        return manager.getRunningServices(Int.MAX_VALUE).any {
            it.service.className == serviceClass.name
        }
    }
}