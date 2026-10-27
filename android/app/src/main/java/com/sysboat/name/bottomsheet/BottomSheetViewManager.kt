package com.sysboat.name.BottomSheet

import android.util.Log
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

class BottomSheetViewManager : ViewGroupManager<BottomSheetView>() {

    override fun getName(): String = "RNBottomSheet"

    override fun createViewInstance(context: ThemedReactContext): BottomSheetView {
        return BottomSheetView(context)
    }

    // ✅ Props must be set BEFORE visible — RN batches prop updates but
    //    order isn't guaranteed, so read them lazily in showSheet()
    @ReactProp(name = "fullScreen")
    fun setFullScreen(view: BottomSheetView, fullScreen: Boolean) {
        view.isFullScreen = fullScreen
    }

    @ReactProp(name = "dismissible")
    fun setDismissible(view: BottomSheetView, dismissible: Boolean) {
        view.isDismissible = dismissible
    }

    @ReactProp(name = "visible")
    fun setVisible(view: BottomSheetView, visible: Boolean) {
        Log.d("BottomSheetViewManager", "setVisible: $visible")
        // Post to next frame so fullScreen/dismissible props are applied first
        view.post { view.setVisible(visible) }
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
        return MapBuilder.builder<String, Any>()
            .put("onDismiss", MapBuilder.of("registrationName", "onDismiss"))
            .build()
    }

    override fun needsCustomLayoutForChildren(): Boolean = true
}