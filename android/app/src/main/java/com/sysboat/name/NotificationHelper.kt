    package com.sysboat.name

    import android.app.NotificationChannel
    import android.app.NotificationManager
    import android.content.Context
    import android.os.Build

    object NotificationHelper {
        fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channelId = "location_low_priority"
                val channelName = "Location Updates"
                val channelDescription = "Background location updates"
                val importance = NotificationManager.IMPORTANCE_LOW

                val channel = NotificationChannel(channelId, channelName, importance).apply {
                    description = channelDescription
                }

                val notificationManager =
                    context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.createNotificationChannel(channel)
            }
        }
    }
