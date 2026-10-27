package com.sysboat.name
import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import android.app.ActivityManager

class LocationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val fusedClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(reactContext)

    companion object {
        private var staticReactContext: ReactApplicationContext? = null
        fun getStaticContext(): ReactApplicationContext? = staticReactContext
        fun setStaticContext(context: ReactApplicationContext?) { staticReactContext = context }

        const val ACTION_START_TRACKING = "com.sysboat.ACTION_START_TRACKING"
        const val ACTION_STOP_TRACKING = "com.sysboat.ACTION_STOP_TRACKING"
        private const val TAG = "LocationModule"
    }

    init { setStaticContext(reactContext) }

    override fun getName(): String {
        return "LocationModule"
    }

    override fun onCatalystInstanceDestroy() { setStaticContext(null); super.onCatalystInstanceDestroy() }


    @ReactMethod
    fun startTracking(userId:String, companyId:String, userData: String, token: String, punchInTime: Double, punchOutTime: Double, companyLat: Double, companyLon: Double, radius: Float, intervalMs: Double, promise: Promise) {

        val context = reactApplicationContext.applicationContext
        if (!hasLocationPermissions(context)) { promise.reject("MISSING_PERMISSION","Location permission not granted."); return }

        if (isServiceRunning(context, LocationService::class.java)) {
            promise.resolve("Tracking already active."); return
        }

        val intent = Intent(context, LocationService::class.java).setAction(ACTION_START_TRACKING)
        reactApplicationContext.getSharedPreferences("LocationPrefs", Context.MODE_PRIVATE).edit().apply {
            putString("userId", userId)
            putString("companyId", companyId)
            putString("user_data_token", userData)
            putString("token", token)
            putBoolean("is_tracking", true)
            putLong("punch_in_time", punchInTime.toLong())
            putLong("punch_out_time", punchOutTime.toLong())
            putFloat("company_lat", companyLat.toFloat())
            putFloat("company_lon", companyLon.toFloat())
            putFloat("company_radius", radius)
            putLong("location_interval_ms", intervalMs.toLong())
            putBoolean("manually_stopped", false)
            apply()
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent) else context.startService(intent)
        Log.i(TAG,"Start tracking command sent")
        promise.resolve("Location tracking started")
    }

    @ReactMethod
    fun stopTracking(promise: Promise) {
        val context = reactApplicationContext.applicationContext
        if (!isServiceRunning(context, LocationService::class.java)) { promise.resolve("Tracking not active"); return }
        val stopIntent = Intent(context, LocationService::class.java).setAction(ACTION_STOP_TRACKING)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(stopIntent) else context.startService(stopIntent)
        Log.i(TAG,"Stop tracking command sent")
        promise.resolve("Location tracking stop command sent")
    }


    @ReactMethod
    fun getSingleLocation(promise: Promise) {
        if (!hasLocationPermissions(reactApplicationContext)) {
            promise.reject(
                "PERMISSION_DENIED",
                "Location permission is required for single location request."
            )
            return
        }

        fusedClient.lastLocation.addOnSuccessListener { location: Location? ->
            if (location != null) {
                val map = Arguments.createMap().apply {
                    putDouble("latitude", location.latitude)
                    putDouble("longitude", location.longitude)
                    putDouble("accuracy", location.accuracy.toDouble())
                    putDouble("timestamp", location.time.toDouble())
                }
                promise.resolve(map)
            } else {
                promise.reject(
                    "NO_LOCATION",
                    "Could not retrieve current location. Location is null."
                )
            }
        }.addOnFailureListener { e ->
            promise.reject("LOCATION_FAILED", "Failed to get location: ${e.message}")
        }
    }

    @ReactMethod
    fun getLastKnownLocation(promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences("LocationPrefs", Context.MODE_PRIVATE)
        val lat = prefs.getFloat("latitude",0f).toDouble()
        val lon = prefs.getFloat("longitude",0f).toDouble()
        val time = prefs.getLong("timestamp",0L)
        if (time != 0L) {
            promise.resolve(Arguments.createMap().apply{ putDouble("latitude",lat); putDouble("longitude",lon); putDouble("timestamp",time.toDouble()) })
        } else promise.reject("NO_LOCATION","No stored location found")
    }

    @ReactMethod
    fun isTrackingActive(promise: Promise) {
        val isTracking = reactApplicationContext.getSharedPreferences("LocationPrefs", Context.MODE_PRIVATE).getBoolean("is_tracking",false)
        promise.resolve(isTracking)
    }

    private fun hasLocationPermissions(context: Context): Boolean {
        val hasFineLocation = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val hasCoarseLocation = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val hasBasicLocation = hasFineLocation || hasCoarseLocation

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val hasBackgroundLocation = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_BACKGROUND_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

            if (!hasBackgroundLocation) {
                Log.w(TAG, "ACCESS_BACKGROUND_LOCATION not granted. Service may be limited.")
            }
        }

        return hasBasicLocation
    }

    private fun isServiceRunning(context: Context, serviceClass: Class<*>): Boolean {
        val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return manager.getRunningServices(Int.MAX_VALUE).any { it.service.className == serviceClass.name }
    }
}
