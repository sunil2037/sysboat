package com.sysboat.name

import android.Manifest
import android.annotation.SuppressLint
import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.net.Uri
import android.os.*
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.location.*
import okhttp3.*
import okio.ByteString
import org.json.JSONObject
import java.io.File
import java.util.concurrent.TimeUnit
import io.socket.client.IO
import io.socket.client.Socket
import java.text.SimpleDateFormat
import java.util.*
import com.sysboat.BuildConfig

class LocationService : Service() {
    private val locationQueue = mutableListOf<JSONObject>()
    companion object {
        const val ACTION_RESTART_TRACKING = "com.sysboat.name.ACTION_RESTART_TRACKING"
        const val TAG = "LocationService"

        const val KEY_LOCATION_ACCESS = "location_access"
        const val KEY_WORKING_HOURS = "working_hours"
        const val KEY_PUNCH_IN = "punch_in_time"
        const val KEY_PUNCH_OUT = "punch_out_time"
        const val KEY_COMP_LAT = "company_lat"
        const val KEY_COMP_LON = "company_lon"
        const val KEY_COMP_RADIUS = "company_radius"
        const val KEY_INTERVAL_MS = "location_interval_ms"
        const val KEY_IS_TRACKING = "is_tracking"
        const val KEY_LAST_LAT = "last_lat"
        const val KEY_LAST_LON = "last_lon"
        const val KEY_USER_TOKEN = "user_data_token"

        const val OVERTIME_BUFFER_MS = 2 * 60 * 60 * 1000L

        const val MOVEMENT_THRESHOLD_M = 5f
    }

    private lateinit var fusedClient: FusedLocationProviderClient
    private lateinit var callback: LocationCallback
    private val channelId = "location_service_channel"
    private val notificationId = 1
    private var isTracking = false
    private var webSocket: WebSocket? = null

    // Handler for scheduled auto-stop
    private val autoStopHandler = Handler(Looper.getMainLooper())
    private var autoStopRunnable: Runnable? = null

    // safer data storage
    private val prefs by lazy { getSharedPreferences("LocationPrefs", Context.MODE_PRIVATE) }
    private val tokenFile by lazy { File(filesDir, "user_token.txt") }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        fusedClient = LocationServices.getFusedLocationProviderClient(this)
        setupLocationCallback()
        createNotificationChannel()
        checkBatteryOptimization()
        scheduleServiceMonitor()
        connectSocketSafely()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(
                locationModeReceiver,
                IntentFilter(LocationManager.PROVIDERS_CHANGED_ACTION).apply {
                    addAction(Intent.ACTION_PROVIDER_CHANGED)
                },
                Context.RECEIVER_EXPORTED
            )
        } else {
            registerReceiver(
                locationModeReceiver,
                IntentFilter(LocationManager.PROVIDERS_CHANGED_ACTION).apply {
                    addAction(Intent.ACTION_PROVIDER_CHANGED)
                }
            )
        }
    }

    private fun scheduleServiceMonitor() {
        try {
            val work = androidx.work.PeriodicWorkRequestBuilder<ServiceMonitorWorker>(
                15, java.util.concurrent.TimeUnit.MINUTES
            ).build()

            androidx.work.WorkManager.getInstance(this)
                .enqueueUniquePeriodicWork(
                    "ServiceMonitorWorker",
                    androidx.work.ExistingPeriodicWorkPolicy.KEEP,
                    work
                )
            Log.i(TAG, "Service monitor scheduled")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule monitor: ${e.message}")
        }
    }


    private var shouldBeSticky = true
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        shouldBeSticky = true  // reset on each start

        when (intent?.action) {
            ACTION_RESTART_TRACKING -> {
                val manuallyStopped = prefs.getBoolean("manually_stopped", false)
                if (!manuallyStopped) startServiceProperly()
                else { stopSelf(); return START_NOT_STICKY }
            }
            LocationModule.ACTION_STOP_TRACKING -> {
                stopForegroundTracking()
                return START_NOT_STICKY
            }
            else -> {
                val manuallyStopped = prefs.getBoolean("manually_stopped", false)
                if (!manuallyStopped) startServiceProperly()
                else { stopSelf(); return START_NOT_STICKY }
            }
        }
        return if (shouldBeSticky) START_STICKY else START_NOT_STICKY
    }

    private fun startServiceProperly() {
        startForegroundNotification()
        startTracking()
    }

    private fun setupLocationCallback() {
        callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { handleLocationUpdate(it) }
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun startTracking() {
        if (!hasLocationPermissions()) {
            Log.e(TAG, "Missing location permissions, stopping service")
            stopSelf()
            return
        }

        // Clear stale cached location when starting fresh
        prefs.edit().putFloat(KEY_LAST_LAT, 0f).putFloat(KEY_LAST_LON, 0f).apply()

        val interval = prefs.getLong("location_interval_ms", 60000L)
        Log.i(TAG, "Starting fresh location tracking with interval: $interval")

        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, interval)
            .setMinUpdateIntervalMillis(interval / 2)
            .setWaitForAccurateLocation(true)
            .setMaxUpdateDelayMillis(interval * 2)  // Add max delay
            .build()

        fusedClient.requestLocationUpdates(request, callback, Looper.getMainLooper())
        isTracking = true
        prefs.edit().putBoolean("is_tracking", true).apply()
        Log.i(TAG, "Started fresh location tracking")
        scheduleAutoStop()
    }

    private fun handleLocationUpdate(loc: Location) {
        val lastLat = prefs.getFloat(KEY_LAST_LAT, 0f)
        val lastLon = prefs.getFloat(KEY_LAST_LON, 0f)
        val lastLatD = lastLat.toDouble()
        val lastLonD = lastLon.toDouble()
        val locationAccess = prefs.getLong(KEY_LOCATION_ACCESS, 1L)

        if (locationAccess == 0L) {
            pauseLocationUpdates()
            // IMPORTANT: Clear cached location when stopping
            prefs.edit().putFloat(KEY_LAST_LAT, 0f).putFloat(KEY_LAST_LON, 0f).apply()
            return
        }

        val compLat = prefs.getFloat(KEY_COMP_LAT, 0f).toDouble()
        val compLon = prefs.getFloat(KEY_COMP_LON, 0f).toDouble()
        val radius = prefs.getFloat(KEY_COMP_RADIUS, 50f)

        if (compLat != 0.0 && compLon != 0.0) {
            val inside = false
            val wasInside = prefs.getBoolean("was_inside_company", false)
            if (inside && !wasInside) {
                prefs.edit().putBoolean("was_inside_company", true).apply()
                prefs.edit().putFloat(KEY_LAST_LAT, 0f).putFloat(KEY_LAST_LON, 0f).apply()
                Log.i(TAG, "Entered company radius — clearing cache and stopping")
                stopForegroundTracking()
                return
            } else if (!inside && wasInside) {
                prefs.edit().putBoolean("was_inside_company", false).apply()
                prefs.edit().putFloat(KEY_LAST_LAT, 0f).putFloat(KEY_LAST_LON, 0f).apply()
                Log.i(TAG, "Left company radius — clearing cache and resuming")
                if (prefs.getLong(KEY_LOCATION_ACCESS, 1L) != 0L) {
                    startServiceProperly()
                }
            }
        }

        if (!isLocationEnabled()) {
            Log.e(TAG, "Location disabled; sending location_off event and stopping")
            val extra = JSONObject().apply { put("status", "location_off") }
            sendLocationUnified(loc.latitude, loc.longitude, extra)
            prefs.edit().putFloat(KEY_LAST_LAT, 0f).putFloat(KEY_LAST_LON, 0f).apply()
            stopForegroundTracking()
            return
        }

        // Check if location is fresh (not older than 30 seconds)
        val locationAge = System.currentTimeMillis() - loc.time
        if (locationAge > 30000) {
            Log.w(TAG, "Location too old (${locationAge}ms), waiting for fresh data")
            return
        }

        prefs.edit().apply {
            putFloat(KEY_LAST_LAT, loc.latitude.toFloat())
            putFloat(KEY_LAST_LON, loc.longitude.toFloat())
            putLong("timestamp", loc.time)
            apply()
        }

        sendLocationUnified(loc.latitude, loc.longitude)
        LocationModule.getStaticContext()
            ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("locationUpdate", Arguments.createMap().apply {
                putDouble("latitude", loc.latitude)
                putDouble("longitude", loc.longitude)
                putDouble("accuracy", loc.accuracy.toDouble())
                putDouble("speed", loc.speed.toDouble())
                putDouble("timestamp", loc.time.toDouble())
            })
    }


    private val locationModeReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (!isLocationEnabled()) {
                val lastLat = prefs.getFloat(KEY_LAST_LAT, 0f).toDouble()
                val lastLon = prefs.getFloat(KEY_LAST_LON, 0f).toDouble()
                val extra = JSONObject().apply { put("status", "location_off") }
                sendLocationUnified(lastLat, lastLon, extra)
                stopForegroundTracking()
            } else {
                if (!isTracking) startServiceProperly()
            }
        }
    }


    private fun scheduleAutoStop() {
        cancelAutoStop()

        val punchIn = prefs.getLong(KEY_PUNCH_IN, 0L)
        val punchOut = prefs.getLong(KEY_PUNCH_OUT, 0L)
        val workingHours = prefs.getLong(KEY_WORKING_HOURS, 9L)

        if (punchIn == 0L) {
            Log.w(TAG, "No punch-in time set, skipping auto-stop")
            return
        }



        val now = System.currentTimeMillis()

        val stopTime = when {
            punchOut != 0L && punchOut > now -> {
                punchOut + OVERTIME_BUFFER_MS
            }
            else -> {
                val workingHoursMs = TimeUnit.HOURS.toMillis(workingHours)
                punchIn + workingHoursMs + OVERTIME_BUFFER_MS
            }
        }

        if (stopTime <= now) {
            Log.w(TAG, "Auto-stop time already passed, stopping service now")
            stopForegroundTracking()
            return
        }

        val delay = stopTime - now
        val hours = TimeUnit.MILLISECONDS.toHours(delay)
        val minutes = TimeUnit.MILLISECONDS.toMinutes(delay) % 60

        Log.e(
            "AUTO_STOP_DEBUG",
            """
            now=${Date(now)}
            punchIn=${Date(punchIn)}
            punchOut=${Date(punchOut)}
            workingHours=$workingHours
            stopTime=${Date(stopTime)}
            delayMinutes=${TimeUnit.MILLISECONDS.toMinutes(stopTime - now)}
            """.trimIndent()
        )

        autoStopRunnable = Runnable {
            Log.i(TAG, "Auto-stop triggered: Employee forgot to punch out")

            val lastLat = prefs.getFloat(KEY_LAST_LAT, 0f).toDouble()
            val lastLon = prefs.getFloat(KEY_LAST_LON, 0f).toDouble()
            val extra = JSONObject().apply {
                put("status", "auto_stopped")
                put("reason", "overtime_exceeded")
                put("buffer_hours", 2)
            }
            sendLocationUnified(lastLat, lastLon, extra)

            stopForegroundTracking()
        }

        autoStopRunnable?.let { autoStopHandler.postDelayed(it, delay) }

        prefs.edit().putLong("scheduled_auto_stop_time", stopTime).apply()
    }

    private fun cancelAutoStop() {
        autoStopRunnable?.let {
            autoStopHandler.removeCallbacks(it)
            autoStopRunnable = null
            Log.i(TAG, "Cancelled scheduled auto-stop")
        }
        prefs.edit().remove("scheduled_auto_stop_time").apply()
    }

    private fun isInsideCompanyRadius(lat: Double, lon: Double, compLat: Double, compLon: Double, radius: Float): Boolean {
        val results = FloatArray(1)
        Location.distanceBetween(lat, lon, compLat, compLon, results)
        return results[0] <= radius
    }

    private fun isLocationEnabled(): Boolean {
        val lm = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return lm.isProviderEnabled(LocationManager.GPS_PROVIDER) || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Location Service", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun startForegroundNotification() {
        val notif = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Sysboat is active")
            .setContentText("Tracking your location")
            .setSmallIcon(android.R.drawable.presence_online)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // Android 14+
            try {
                startForeground(
                    notificationId,
                    notif,
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                )
            } catch (e: Throwable) {
                startForeground(notificationId, notif)
            }
        } else {
            startForeground(notificationId, notif)
        }

    }

    private fun checkBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(intent)
                } catch (e: Exception) {
                    Log.e(TAG, "Battery optimization request failed: ${e.message}")
                }
            }
        }
    }

    private fun pauseLocationUpdates() {
        try {
            if (isTracking) {
                fusedClient.removeLocationUpdates(callback)
                isTracking = false
                // Clear cached location
                prefs.edit()
                    .putFloat(KEY_LAST_LAT, 0f)
                    .putFloat(KEY_LAST_LON, 0f)
                    .putBoolean(KEY_IS_TRACKING, false)
                    .apply()
                Log.i(TAG, "Location updates paused and cache cleared")
                cancelAutoStop()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error pausing location updates: ${e.message}", e)
        }
    }


    private fun stopForegroundTracking() {
        shouldBeSticky = false
        try {
            if (isTracking) fusedClient.removeLocationUpdates(callback)
            isTracking = false
            prefs.edit()
                .putFloat(KEY_LAST_LAT, 0f)
                .putFloat(KEY_LAST_LON, 0f)
                .putBoolean("is_tracking", false)
                .putBoolean("manually_stopped", true)
                .apply()
            cancelAutoStop()
            stopForeground(true)
            stopSelf()
            Log.i(TAG, "Foreground service stopped and cache cleared")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping tracking: ${e.message}", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isTracking) fusedClient.removeLocationUpdates(callback)
        cancelAutoStop()
        disconnectWebSocket()
        try { unregisterReceiver(locationModeReceiver) } catch (_: Exception) {}
        Log.i(TAG, "LocationService destroyed")
    }


    private fun hasLocationPermissions(): Boolean {
        val fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    private fun flushLocationQueue() {
        if (socket?.connected() == true && locationQueue.isNotEmpty()) {
            Log.i(TAG, "Flushing ${locationQueue.size} queued locations.")
            locationQueue.forEach { data ->
                socket?.emit("sendLocation", data)
                Log.d(TAG, "Flushed and Sent: $data")
            }
            locationQueue.clear()
        }
    }

    /** ────────────── WebSocket Handling ────────────── */
    private var socket: Socket? = null

    private fun connectSocketSafely() {
        if (socket?.connected() == true) return

        try {
            val options = IO.Options().apply {
                reconnection = true
                reconnectionAttempts = Int.MAX_VALUE
                reconnectionDelay = 1000
                forceNew = true
                transports = arrayOf("websocket")
                secure = true
            }

            socket = IO.socket(BuildConfig.API_BASE_URL, options)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.i(TAG, "Socket.IO connected ✅")

                val userId = prefs.getString("userId", null)
                Log.e(TAG, "userId: $userId")
                val companyId = prefs.getString("companyId", null)
                val userData = readUserToken()

                if (!userId.isNullOrEmpty() && !companyId.isNullOrEmpty()) {
                    val joinData = JSONObject().apply {
                        put("userId", userId)
                        put("company_id", companyId.toInt())
                    }

                    socket?.emit("join", joinData)
                    Log.i(TAG, "Emitted join event: $joinData")
                    flushLocationQueue()
                    socket?.emit("getProfile", JSONObject().apply {
                        put("CheckId", "")
                        put("folderName", "EmployeeProfileImg")
                        put("userData", userData)
                    })

                    socket?.on("profileResponse") { args ->
                        Log.i(TAG, "profileResponse event received: $args")
                        if (args.isNotEmpty()) {
                            try {
                                val res = JSONObject(args[0].toString())
                                Log.i(TAG, "profileResponse: $res")
                                val status = res.optBoolean("status", false)
                                if (status) {
                                    val data = JSONObject()
                                    val keys = res.keys()
                                    while (keys.hasNext()) {
                                        val key = keys.next()
                                        if (key != "data") {
                                            data.put(key, res.get(key))
                                        }
                                    }

                                    Log.i(TAG, "profileResponse top-level data: $data")
                                    applyProfileConfiguration(data)
                                } else {
                                    Log.w(TAG, "Profile response failed: ${res.optString("message")}")
                                }

                            } catch (e: Exception) {
                                Log.e(TAG, "profileResponse parse error: ${e.message}")
                            }
                        }
                    }

                    socket?.on("profileUpdated") { args ->
                        Log.i(TAG, "Profile updated event received from server: $args")
                        if (args.isNotEmpty()) {
                            try {
                                val res = JSONObject(args[0].toString())
                                val status = res.optBoolean("status", false)
                                if (status) {
                                    val data = JSONObject()
                                    val keys = res.keys()
                                    while (keys.hasNext()) {
                                        val key = keys.next()
                                        if (key != "data") {
                                            data.put(key, res.get(key))
                                        }
                                    }

                                    // Crucial step: Apply the new configuration
                                    applyProfileConfiguration(data)
                                } else {
                                    Log.w(TAG, "Profile update response failed: ${res.optString("message")}")
                                }
                            } catch (e: Exception) {
                                Log.e(TAG, "profileUpdated parse error: ${e.message}")
                            }
                        }
                    }

                    Log.i(TAG, "Emitted getProfile request")
                }

            }



            // Listen to server commands
            socket?.on("serverCommand") { args ->
                if (args.isNotEmpty()) {
                    handleServerCommand(args[0].toString())
                    handleServerCommand(args[0].toString())
                }
            }

            // Receive live updates from backend
//            socket?.on("receive-Location") { args ->
//                if (args.isNotEmpty()) {
//                    val data = JSONObject(args[0].toString())
//                    Log.d(TAG, "Received company location: $data")
//                }
//            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.w(TAG, "Socket.IO disconnected")
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                Log.e(TAG, "Socket.IO connection error: ${args.joinToString()}")
            }

            socket?.connect()

        } catch (e: Exception) {
            Log.e(TAG, "Socket.IO connection failed: ${e.message}", e)
            retrySocket()
        }
    }




    private fun parseIsoTime(iso: String?): Long {
        return try {
            if (iso.isNullOrEmpty()) 0L
            else {
                val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                sdf.timeZone = TimeZone.getTimeZone("UTC")
                sdf.parse(iso)?.time ?: 0L
            }
        } catch (e: Exception) {
            Log.e(TAG, "Time parse failed for $iso: ${e.message}")
            0L
        }
    }

    private fun applyProfileConfiguration(data: JSONObject) {
        try {
            val permissionObject = data.optJSONObject("permission")
            val locationAccess: Long? = permissionObject?.optLong("location_access", 0L)
            val punchIn = parseIsoTime(data.optString("in_time"))
            val punchOut = parseIsoTime(data.optString("out_time"))
            val compLat = data.optDouble("latitude", 0.0)
            val compLon = data.optDouble("longitude", 0.0)
            val radius = data.optDouble("radius", 50.0).toFloat()
            val workingHours = data.optDouble("working_hours", 0.0)
            val intervalMs = permissionObject?.optLong("interval_ms", prefs.getLong(KEY_INTERVAL_MS, 60000))

            prefs.edit()
                .putLong(KEY_LOCATION_ACCESS, locationAccess ?: 0L)
                .putLong(KEY_WORKING_HOURS, workingHours.toLong())
                .putLong(KEY_PUNCH_IN, punchIn)
                .putLong(KEY_PUNCH_OUT, punchOut)
                .putFloat(KEY_COMP_LAT, compLat.toFloat())
                .putFloat(KEY_COMP_LON, compLon.toFloat())
                .putFloat(KEY_COMP_RADIUS, radius)
                .putLong(KEY_INTERVAL_MS, intervalMs ?: 60000L)
                .apply()


            Log.i(TAG, "Applied profile config: punchIn=$punchIn punchOut=$punchOut interval=$intervalMs")

            if (locationAccess == 1L && !isTracking) {
                val manuallyStopped = prefs.getBoolean("manually_stopped", false)
                if (!manuallyStopped) {
                    startTracking()
                }
            } else if (locationAccess == 0L && isTracking) {
                pauseLocationUpdates()
            } else if (locationAccess == 1L && isTracking) {
                scheduleAutoStop()
            }

        } catch (e: Exception) {
            Log.e(TAG, "applyProfileConfiguration error: ${e.message}")
        }
    }


    private fun retrySocket() {
        Handler(Looper.getMainLooper()).postDelayed({
            if (socket == null || !socket!!.connected()) connectSocketSafely()
        }, 5000)
    }

    private fun sendLocationUnified(lat: Double, lon: Double, extra: JSONObject? = null) {
        val token = readUserToken()
        if (token.isNullOrBlank()) {
            Log.w(TAG, "Skipping sendLocation, token missing")
            return
        }

        try {

            val userId = prefs.getString("userId", null)
            val companyId = prefs.getString("companyId", null)

            if (userId.isNullOrEmpty() || companyId.isNullOrEmpty()) {
                Log.w(TAG, "Skipping sendLocation, userId or companyId missing")
                return
            }

            val data = JSONObject().apply {
                put("latitude", lat)
                put("longitude", lon)
                put("employee_id", userId.toInt())
                put("company_id", companyId.toInt())
                put("timestamp", System.currentTimeMillis())

                extra?.let {
                    val keys = it.keys()
                    while (keys.hasNext()) {
                        val k = keys.next()
                        put(k, it.get(k))
                    }
                }
            }

            // Buffer if not connected
            if (socket?.connected() == true) {
                socket?.emit("sendLocation", data)
                Log.d(TAG, "Sent via Socket.IO: $data")
            } else {
                // Add to queue if socket is not ready
                locationQueue.add(data)
                Log.w(TAG, "Socket not connected, location queued: ${locationQueue.size} pending.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "sendLocationUnified error: ${e.message}")
        }
    }


    private fun disconnectSocket() {
        try {
            socket?.disconnect()
            socket?.off()
            socket = null
            Log.i(TAG, "Socket.IO disconnected cleanly")
        } catch (e: Exception) {
            Log.e(TAG, "Error disconnecting Socket.IO: ${e.message}")
        }
    }
    private fun handleServerCommand(message: String) {
        try {
            val json = JSONObject(message)
            when (json.getString("action")) {
                "stopTracking" -> stopForegroundTracking()
                "updateInterval" -> {
                    val newInterval = json.getLong("interval_ms")
                    updateLocationInterval(newInterval)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Server command parse error: ${e.message}")
        }
    }



    private fun readUserToken(): String? {
        return prefs.getString("user_data_token", null)
    }


    private fun disconnectWebSocket() {
        webSocket?.close(1000, "Closing WS")
        webSocket = null
    }

    private fun updateLocationInterval(newIntervalMs: Long) {
        prefs.edit().putLong("location_interval_ms", newIntervalMs).apply()
        if (isTracking) {
            fusedClient.removeLocationUpdates(callback)
            startTracking()
            Log.i(TAG, "Updated location interval to $newIntervalMs ms")
        }
    }
}
