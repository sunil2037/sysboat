package com.sysboat.name.BottomSheet

import android.content.Context
import android.util.Log
import android.widget.FrameLayout
import com.facebook.react.bridge.UiThreadUtil
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.facebook.react.bridge.ReactContext
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.uimanager.events.RCTEventEmitter

class BottomSheetView(context: Context) : FrameLayout(context) {

    var dialog: BottomSheetDialog? = null
    var isFullScreen: Boolean = false
    var isDismissible: Boolean = true
    var pendingVisible: Boolean = false

    // The container we hand to the dialog
    val sheetContainer = FrameLayout(context).apply {
        layoutParams = LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.WRAP_CONTENT
        )
    }

    fun dispatchDismissEvent() {
        val reactContext = context as? ReactContext ?: return
        reactContext
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(
                id,
                "onDismiss",
                null
            )
    }


    // RN calls addView on THIS view — redirect children into sheetContainer
    override fun addView(child: android.view.View, index: Int, params: android.view.ViewGroup.LayoutParams) {
        sheetContainer.addView(child, index, params)
        // Force RN to re-layout the child inside sheetContainer
        requestLayout()
        child.requestLayout()
    }

    override fun removeView(child: android.view.View) {
        sheetContainer.removeView(child)
    }

    override fun removeViewAt(index: Int) {
        sheetContainer.removeViewAt(index)
    }

    fun setVisible(visible: Boolean) {
        pendingVisible = visible
        if (visible) showSheet() else hideSheet()
    }

    fun showSheet() {
        val reactContext = context as? ReactContext
        val activity = reactContext?.currentActivity as? AppCompatActivity ?: run {
            Log.e("BottomSheetView", "Could not get AppCompatActivity")
            return
        }

        activity.runOnUiThread {
            if (dialog?.isShowing == true) return@runOnUiThread

            (sheetContainer.parent as? android.view.ViewGroup)?.removeView(sheetContainer)

            val d = BottomSheetDialog(activity)
            dialog = d

            d.setContentView(sheetContainer)
            d.setCancelable(isDismissible)
            d.setCanceledOnTouchOutside(isDismissible)

            d.setOnShowListener {
                val bottomSheet = d.findViewById<FrameLayout>(
                    com.google.android.material.R.id.design_bottom_sheet
                )
                bottomSheet?.let {
                    it.setBackgroundColor(android.graphics.Color.TRANSPARENT)
                    it.background = null
                    val b = BottomSheetBehavior.from(it)
                    if (isFullScreen) {
                        it.layoutParams.height = LayoutParams.MATCH_PARENT
                        b.state = BottomSheetBehavior.STATE_EXPANDED
                        b.peekHeight = BottomSheetBehavior.PEEK_HEIGHT_AUTO
                        b.skipCollapsed = true
                    } else {
                        b.state = BottomSheetBehavior.STATE_EXPANDED
                        b.skipCollapsed = true
                    }
                    sheetContainer.post {
                        sheetContainer.requestLayout()
                        for (i in 0 until sheetContainer.childCount) {
                            sheetContainer.getChildAt(i)?.requestLayout()
                        }
                    }
                }
            }

            d.setOnDismissListener {
                Log.d("BottomSheetView", "dismissed")
                dialog = null
                dispatchDismissEvent()
            }

            d.show()
        }
    }

    fun hideSheet() {
        dialog?.dismiss()
        dialog = null
    }
}