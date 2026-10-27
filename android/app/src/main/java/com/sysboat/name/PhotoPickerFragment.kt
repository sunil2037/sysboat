package com.sysboat.name

import android.net.Uri
import android.util.Log
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts.PickMultipleVisualMedia
import androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia
import androidx.fragment.app.Fragment
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableNativeArray


class PhotoPickerFragment : Fragment() {

    private var singlePromise: Promise? = null
    private var multiplePromise: Promise? = null

    private fun getMediaType(type: String) = when (type) {
        "ImageAndVideo" -> PickVisualMedia.ImageAndVideo
        "ImageOnly" -> PickVisualMedia.ImageOnly
        "VideoOnly" -> PickVisualMedia.VideoOnly
        else -> PickVisualMedia.SingleMimeType(type)
    }


    private val pickMedia = registerForActivityResult(PickVisualMedia()) { uri: Uri? ->
        val promise = singlePromise
        singlePromise = null

        if (uri != null) {
            Log.d("PhotoPicker", "Selected URI: $uri")
            promise?.resolve(uri.toString())
        } else {
            Log.d("PhotoPicker", "No media selected")
            promise?.resolve(null)
        }
    }

    private val pickMultipleMediaLauncher = registerForActivityResult(PickMultipleVisualMedia()) { uris: List<Uri> ->
        val promise = multiplePromise
        multiplePromise = null

        if (uris.isNotEmpty()) {
            Log.d("PhotoPicker", "Number of items selected: ${uris.size}")
            val uriArray: WritableArray = WritableNativeArray()
            uris.forEach { uriArray.pushString(it.toString()) }
            promise?.resolve(uriArray)
        } else {
            Log.d("PhotoPicker", "No media selected")
            promise?.resolve(WritableNativeArray())
        }
    }

    fun launchSinglePicker(mediaType: String, promise: Promise) {
        this.singlePromise = promise
        val request = PickVisualMediaRequest(getMediaType(mediaType))
        pickMedia.launch(request)
    }

    fun launchMultiplePicker(maxSelection: Int, mediaType: String, promise: Promise) {
        this.multiplePromise = promise
        val request = PickVisualMediaRequest(getMediaType(mediaType))
        pickMultipleMediaLauncher.launch(request)
    }
}
