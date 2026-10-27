package com.sysboat.name

import android.content.Context
import android.util.Base64
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import com.sysboat.BuildConfig

class SendLocationWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "SendLocationWorker"
        private const val SERVER_URL = BuildConfig.API_BASE_URL+"/NotificationApi/SendLocation"
    }

    override suspend fun doWork(): Result {
        val lat = inputData.getDouble("latitude", 0.0)
        val lon = inputData.getDouble("longitude", 0.0)
        val token = inputData.getString("token")
        val userDataToken = inputData.getString("userDataToken")

        return try {
            if (userDataToken != null && lat != 0.0 && lon != 0.0) {
                sendLocationToServer(userDataToken, token, lat, lon)
                Log.i(TAG, "✅ Location sent to server successfully")
                Result.success()
            } else {
                Log.w(TAG, "⚠️ Missing data for server report")
                Result.failure()
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Network error: ${e.message}", e)
            Result.retry()
        }
    }

    private fun sendLocationToServer(userDataToken: String, token: String?, lat: Double, lon: Double) {
        val safeUserDataToken = Base64.encodeToString(userDataToken.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
        val jsonPayload = """
            {
                "userData": "$safeUserDataToken",
                "latitude": "$lat",
                "longitude": "$lon"
            }
        """.trimIndent()

        val url = URL(SERVER_URL)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15000
            readTimeout = 15000
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            token?.let { setRequestProperty("Authorization", "Bearer $it") }
        }

        OutputStreamWriter(conn.outputStream).use { it.write(jsonPayload) }

        val responseCode = conn.responseCode
        val responseText = try {
            conn.inputStream.bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            conn.errorStream?.bufferedReader()?.use { it.readText() } ?: "No response"
        }

        Log.i(TAG, "📡 Server response: $responseCode - $responseText")

        conn.disconnect()
    }
}
