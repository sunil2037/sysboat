package com.sysboat.name.BottomSheet

import android.os.Parcel
import android.os.Parcelable
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.UIManagerModule
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog

class BottomSheetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "BottomSheet"

    private var currentDialog: BottomSheetDialog? = null

    @ReactMethod
    fun show(options: ReadableMap, promise: Promise) {
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No current activity found")
            return
        }

        val isDismissible = if (options.hasKey("dismissible")) options.getBoolean("dismissible") else true
        val isFullScreen  = if (options.hasKey("fullScreen"))  options.getBoolean("fullScreen")  else false

        Log.d("BottomSheet", "show() called — dismissible=$isDismissible fullScreen=$isFullScreen")

        activity.runOnUiThread {
            val dialog = BottomSheetDialog(activity)
            currentDialog = dialog

            // ✅ Container that React Native will render into
            val container = FrameLayout(activity).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
                )
            }

            dialog.setContentView(container)
            dialog.setCancelable(isDismissible)
            dialog.setCanceledOnTouchOutside(isDismissible)

            // ✅ Expand to full screen if requested
            dialog.setOnShowListener {
                val bottomSheet = dialog.findViewById<FrameLayout>(
                    com.google.android.material.R.id.design_bottom_sheet
                )
                bottomSheet?.let {
                    val behavior = BottomSheetBehavior.from(it)
                    if (isFullScreen) {
                        behavior.state     = BottomSheetBehavior.STATE_EXPANDED
                        behavior.peekHeight = BottomSheetBehavior.PEEK_HEIGHT_AUTO
                        it.layoutParams.height = FrameLayout.LayoutParams.MATCH_PARENT
                    } else {
                        behavior.state = BottomSheetBehavior.STATE_EXPANDED
                    }
                }
            }

            dialog.setOnDismissListener {
                Log.d("BottomSheet", "dismissed")
                promise.resolve("dismissed")
                currentDialog = null
            }

            dialog.show()
            Log.d("BottomSheet", "BottomSheetDialog shown")
        }
    }

    @ReactMethod
    fun hide(promise: Promise) {
        currentActivity?.runOnUiThread {
            currentDialog?.let {
                it.dismiss()
                promise.resolve("hidden")
                Log.d("BottomSheet", "hide() called — dialog dismissed")
            } ?: promise.reject("NO_SHEET", "No bottom sheet is currently shown")
        }
    }
}