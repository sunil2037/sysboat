package com.sysboat.name.FaceRecognitionModule

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.*
import android.net.Uri
import android.util.Base64
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.common.util.concurrent.ListenableFuture
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import org.tensorflow.lite.Interpreter
import java.io.*
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.util.concurrent.Executors
import android.util.Log
import android.content.ContentValues
import android.os.Build
import android.provider.MediaStore
import java.io.File
import java.io.FileOutputStream

class FaceRecognitionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var detector: FaceDetector? = null
    private var tfLite: Interpreter? = null
    private var cameraProviderFuture: ListenableFuture<ProcessCameraProvider>? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var imageAnalysis: ImageAnalysis? = null

    private var camFace = CameraSelector.LENS_FACING_FRONT
    private var flipX = true
    private var isRecognizing = false
    private var isContinuousMode = false
    private var distance = 1.0f
    private var recognitionCooldown = 30000L
    private val lastRecognitionTime = HashMap<String, Long>()

    private val inputSize = 112
    private val outputSize = 192
    private val imageMean = 128.0f
    private val imageStd = 128.0f
    private val isModelQuantized = false
    private val modelFile = "mobile_face_net.tflite"

    private var preview: Preview? = null

    private var registered = HashMap<String, EmployeeRecognition>()
    private val executor = Executors.newSingleThreadExecutor()
    private var lastEmbeddings: Array<FloatArray>? = null
    private var lastFaceBitmap: Bitmap? = null // Store the last detected face image

    companion object {
        private const val MODULE_NAME = "FaceRecognitionModule"
        private const val EVENT_FACE_RECOGNIZED = "onFaceRecognized"
        private const val EVENT_FACE_DETECTED = "onFaceDetected"
        private const val EVENT_NO_FACE = "onNoFace"
        private const val EVENT_ERROR = "onError"
    }

    override fun getName(): String = MODULE_NAME

    init {
        initializeFaceDetector()
        loadModel()
        loadRegisteredFaces()
    }

    private fun initializeFaceDetector() {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
            .build()
        detector = FaceDetection.getClient(options)
    }

    private fun loadModel() {
        try {
            tfLite = Interpreter(loadModelFile(reactApplicationContext, modelFile))
        } catch (e: IOException) {
            sendEvent(EVENT_ERROR, Arguments.createMap().apply {
                putString("error", "Failed to load model: ${e.message}")
            })
        }
    }

    private fun loadModelFile(context: Context, modelFile: String): MappedByteBuffer {
        val fileDescriptor = context.assets.openFd(modelFile)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    @ReactMethod
    fun requestCameraPermission(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED) {
            promise.resolve(true)
        } else {
            promise.reject("PERMISSION_DENIED", "Camera permission not granted")
        }
    }

    @ReactMethod
    fun startCamera(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        cameraProviderFuture = ProcessCameraProvider.getInstance(activity)
        cameraProviderFuture?.addListener({
            try {
                cameraProvider = cameraProviderFuture?.get()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("CAMERA_ERROR", "Failed to start camera: ${e.message}")
            }
        }, ContextCompat.getMainExecutor(activity))
    }

    @ReactMethod
    fun switchCamera(promise: Promise) {
        camFace = if (camFace == CameraSelector.LENS_FACING_BACK) {
            flipX = true
            CameraSelector.LENS_FACING_FRONT
        } else {
            flipX = false
            CameraSelector.LENS_FACING_BACK
        }

        if (isContinuousMode) {
            val activity = currentActivity
            if (activity != null) {
                activity.runOnUiThread {
                    restartContinuousRecognition()
                }
            }
        }

        promise.resolve(Arguments.createMap().apply {
            putString("facing", if (camFace == CameraSelector.LENS_FACING_BACK) "back" else "front")
        })
    }

    @ReactMethod
    fun startRecognition(promise: Promise) {
        isRecognizing = true
        promise.resolve(true)
    }

    @ReactMethod
    fun stopRecognition(promise: Promise) {
        isRecognizing = false
        promise.resolve(true)
    }

    @ReactMethod
    fun startContinuousRecognition(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        if (activity !is LifecycleOwner) {
            promise.reject("NO_LIFECYCLE", "Activity does not implement LifecycleOwner")
            return
        }

        try {
            isContinuousMode = true
            activity.runOnUiThread {
                try {
                    setupContinuousRecognition(activity)
                    promise.resolve(true)
                } catch (e: Exception) {
                    promise.reject("CONTINUOUS_ERROR", "Failed to start continuous recognition: ${e.message}")
                }
            }
        } catch (e: Exception) {
            promise.reject("CONTINUOUS_ERROR", "Failed to start continuous recognition: ${e.message}")
        }
    }

    @ReactMethod
    fun stopContinuousRecognition(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        try {
            isContinuousMode = false
            activity.runOnUiThread {
                try {
                    cameraProvider?.unbindAll()
                    imageAnalysis = null
                    promise.resolve(true)
                    preview = null
                } catch (e: Exception) {
                    promise.reject("STOP_ERROR", "Failed to stop continuous recognition: ${e.message}")
                }
            }
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", "Failed to stop continuous recognition: ${e.message}")
        }
    }

    @ReactMethod
    fun setRecognitionCooldown(milliseconds: Int, promise: Promise) {
        recognitionCooldown = milliseconds.toLong()
        promise.resolve(true)
    }

    private fun setupContinuousRecognition(lifecycleOwner: LifecycleOwner) {
        val cameraSelector = CameraSelector.Builder()
            .requireLensFacing(camFace)
            .build()

        // IMPORTANT: Add Preview use case
        preview = Preview.Builder()
            .build()

        imageAnalysis = ImageAnalysis.Builder()
            .setTargetAspectRatio(AspectRatio.RATIO_16_9)
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()

        imageAnalysis?.setAnalyzer(Executors.newSingleThreadExecutor()) { imageProxy ->
            processContinuousFrame(imageProxy)
        }

        try {
            cameraProvider?.unbindAll()

            // Bind BOTH preview and imageAnalysis
            if (preview != null && imageAnalysis != null) {
                cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,  // Add preview here
                    imageAnalysis
                )

                // Send preview surface provider to React Native
                sendEvent("onPreviewReady", Arguments.createMap().apply {
                    putBoolean("ready", true)
                })
            }
        } catch (e: Exception) {
            sendEvent(EVENT_ERROR, Arguments.createMap().apply {
                putString("error", "Failed to bind camera: ${e.message}")
            })
        }
    }




    private fun restartContinuousRecognition() {
        if (isContinuousMode) {
            val activity = currentActivity
            if (activity is LifecycleOwner) {
                setupContinuousRecognition(activity)
            }
        }
    }

    private var lastProcessTime = 0L
    private val MIN_PROCESS_INTERVAL = 2000L
    private var frameCounter = 0
    private val FRAME_SKIP_COUNT = 10

    private fun processContinuousFrame(imageProxy: ImageProxy) {
        frameCounter++

        if (frameCounter % FRAME_SKIP_COUNT != 0) {
            imageProxy.close()
            return
        }

        val currentTime = System.currentTimeMillis()

        if (currentTime - lastProcessTime < MIN_PROCESS_INTERVAL) {
            imageProxy.close()
            return
        }

        lastProcessTime = currentTime

        try {
            val mediaImage = imageProxy.image
            if (mediaImage == null) {
                imageProxy.close()
                return
            }

            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

            detector?.process(image)
                ?.addOnSuccessListener { faces ->
                    if (faces.isEmpty()) {
                        sendEvent(EVENT_NO_FACE, null)
                    } else {
                        sendEvent(EVENT_FACE_DETECTED, null)

                        val face = faces[0]
                        val boundingBox = face.boundingBox

                        // Check minimum face size
                        if (boundingBox.width() < 100 || boundingBox.height() < 100) {
                            imageProxy.close()
                            return@addOnSuccessListener
                        }

                        try {
                            val bitmap = imageProxyToBitmap(imageProxy)
                            if (bitmap == null) {
                                imageProxy.close()
                                return@addOnSuccessListener
                            }

                            // Use SAME preprocessing (no margin for consistency)
                            val processedFace = preprocessFace(bitmap, RectF(boundingBox), addMargin = false)

                            // Store for potential registration
                            lastFaceBitmap?.recycle()
                            lastFaceBitmap = processedFace.copy(Bitmap.Config.ARGB_8888, false)

                            val result = recognizeImage(processedFace)

                            if (!result.getBoolean("recognized")) {
                                lastRecognitionTime.clear()
                            }

                            if (result.getBoolean("recognized")) {
                                val employeeId = result.getString("employeeId") ?: ""
                                val lastTime = lastRecognitionTime[employeeId] ?: 0L

                                if (currentTime - lastTime >= recognitionCooldown) {
                                    lastRecognitionTime[employeeId] = currentTime
                                    val eventData = createRecognitionEventData(result, currentTime)
                                    sendEvent(EVENT_FACE_RECOGNIZED, eventData)
                                    Log.d("FaceRecognition", "Face recognized: ${result.getString("name")}")
                                }
                            } else {
                                val eventData = createRecognitionEventData(result, currentTime)
                                sendEvent("onFaceNotRecognized", eventData)
                            }

                            bitmap.recycle()
                            processedFace.recycle()

                        } catch (e: Exception) {
                            Log.e("FaceRecognition", "Error processing face: ${e.message}")
                        }
                    }
                    imageProxy.close()
                }
                ?.addOnFailureListener { e ->
                    Log.e("FaceRecognition", "Face detection failed: ${e.message}")
                    imageProxy.close()
                }
        } catch (e: Exception) {
            Log.e("FaceRecognition", "Error processing frame: ${e.message}")
            imageProxy.close()
        }
    }

    private fun createRecognitionEventData(recognitionResult: WritableMap, timestamp: Long): WritableMap {
        val eventData = Arguments.createMap()

        eventData.putString("name", recognitionResult.getString("name"))
        eventData.putDouble("distance", recognitionResult.getDouble("distance"))
        eventData.putBoolean("recognized", recognitionResult.getBoolean("recognized"))

        val employeeId = recognitionResult.getString("employeeId")
        if (employeeId != null) {
            eventData.putString("employeeId", employeeId)
        }

        val secondNearest = recognitionResult.getString("secondNearest")
        if (secondNearest != null) {
            eventData.putString("secondNearest", secondNearest)
        }

        val secondDistance = recognitionResult.getDouble("secondDistance")
        if (secondDistance != null) {
            eventData.putDouble("secondDistance", secondDistance)
        }

        eventData.putDouble("timestamp", timestamp.toDouble())

        return eventData
    }

    /**
     * NEW: Add face with image and embeddings export
     */
    @ReactMethod
    fun addFace(name: String, employeeId: String?, promise: Promise) {
        if (lastEmbeddings == null) {
            promise.reject("NO_EMBEDDINGS", "No face detected to save")
            return
        }

        val recognition = EmployeeRecognition("0", name, -1f, employeeId ?: "")
        recognition.extra = lastEmbeddings

        registered[name] = recognition
        saveFacesToPreferences()

        // Convert embeddings to array for export
        val embeddingsArray = Arguments.createArray()
        lastEmbeddings?.get(0)?.forEach { value ->
            embeddingsArray.pushDouble(value.toDouble())
        }

        // Convert face image to base64
        val imageBase64 = lastFaceBitmap?.let { bitmapToBase64(it) } ?: ""

        promise.resolve(Arguments.createMap().apply {
            putString("name", name)
            putString("employeeId", employeeId)
            putBoolean("success", true)
            putArray("embeddings", embeddingsArray)
            putString("faceImage", imageBase64)
            putInt("embeddingSize", outputSize)
        })
    }

    /**
     * NEW: Get current face data without saving
     */
    @ReactMethod
    fun getCurrentFaceData(promise: Promise) {
        if (lastEmbeddings == null) {
            promise.reject("NO_FACE_DETECTED", "No face detected")
            return
        }

        val embeddingsArray = Arguments.createArray()
        lastEmbeddings?.get(0)?.forEach { value ->
            embeddingsArray.pushDouble(value.toDouble())
        }

        val imageBase64 = lastFaceBitmap?.let { bitmapToBase64(it) } ?: ""

        promise.resolve(Arguments.createMap().apply {
            putArray("embeddings", embeddingsArray)
            putString("faceImage", imageBase64)
            putInt("embeddingSize", outputSize)
        })
    }

    /**
     * NEW: Add face from server data (embeddings + metadata)
     */
    @ReactMethod
    fun addFaceFromServer(name: String, employeeId: String?, embeddingsArray: ReadableArray, promise: Promise) {
        try {
            // Convert ReadableArray to FloatArray
            val embeddings = FloatArray(embeddingsArray.size()) { index ->
                embeddingsArray.getDouble(index).toFloat()
            }

            if (embeddings.size != outputSize) {
                promise.reject("INVALID_EMBEDDINGS", "Embeddings size must be $outputSize, got ${embeddings.size}")
                return
            }

            val recognition = EmployeeRecognition("0", name, -1f, employeeId ?: "")
            recognition.extra = arrayOf(embeddings)

            registered[name] = recognition
            saveFacesToPreferences()

            promise.resolve(Arguments.createMap().apply {
                putString("name", name)
                putString("employeeId", employeeId)
                putBoolean("success", true)
            })
        } catch (e: Exception) {
            promise.reject("ADD_FACE_ERROR", "Failed to add face from server: ${e.message}")
        }
    }

    /**
     * NEW: Recognize using embeddings from server
     */
    @ReactMethod
    fun recognizeWithEmbeddings(embeddingsArray: ReadableArray, promise: Promise) {
        try {
            val embeddings = FloatArray(embeddingsArray.size()) { index ->
                embeddingsArray.getDouble(index).toFloat()
            }

            if (embeddings.size != outputSize) {
                promise.reject("INVALID_EMBEDDINGS", "Embeddings size must be $outputSize")
                return
            }

            val result = Arguments.createMap()

            if (registered.size > 0) {
                val nearest = findNearest(embeddings)

                if (nearest.isNotEmpty() && nearest[0] != null) {
                    val recognition = nearest[0].first
                    val distanceLocal = nearest[0].second

                    result.putString("name", if (distanceLocal < distance) recognition.title else "Unknown")
                    result.putString("employeeId", if (distanceLocal < distance) recognition.employeeId else "")
                    result.putDouble("distance", distanceLocal.toDouble())
                    result.putBoolean("recognized", distanceLocal < distance)

                    if (nearest.size > 1) {
                        result.putString("secondNearest", nearest[1].first.title)
                        result.putDouble("secondDistance", nearest[1].second.toDouble())
                    }
                } else {
                    result.putString("name", "Unknown")
                    result.putBoolean("recognized", false)
                    result.putDouble("distance", 2.0)
                }
            } else {
                result.putString("name", "No registered faces")
                result.putBoolean("recognized", false)
                result.putDouble("distance", 0.0)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("RECOGNITION_ERROR", "Failed to recognize: ${e.message}")
        }
    }

    /**
     * NEW: Extract embeddings from image URI
     */
    @ReactMethod
    fun extractEmbeddingsFromUri(imageUri: String, promise: Promise) {
        try {
            val uri = Uri.parse(imageUri)
            val bitmap = getBitmapFromUri(uri)
            val inputImage = InputImage.fromBitmap(bitmap, 0)

            detector?.process(inputImage)
                ?.addOnSuccessListener { faces ->
                    if (faces.isNotEmpty()) {
                        val face = faces[0]
                        val boundingBox = RectF(face.boundingBox)

                        // Check face size
                        if (boundingBox.width() < 100 || boundingBox.height() < 100) {
                            promise.reject("FACE_TOO_SMALL", "Face is too small")
                            bitmap.recycle()
                            return@addOnSuccessListener
                        }

                        // Use consistent preprocessing
                        val processedFace = preprocessFace(bitmap, boundingBox, addMargin = false)

                        // Extract embeddings
                        val embeddings = extractEmbeddings(processedFace)

                        val embeddingsArray = Arguments.createArray()
                        embeddings.forEach { value ->
                            embeddingsArray.pushDouble(value.toDouble())
                        }

                        val imageBase64 = bitmapToBase64(processedFace)

                        promise.resolve(Arguments.createMap().apply {
                            putArray("embeddings", embeddingsArray)
                            putString("faceImage", imageBase64)
                            putInt("embeddingSize", outputSize)
                        })

                        processedFace.recycle()
                    } else {
                        promise.reject("NO_FACE", "No face detected in image")
                    }
                    bitmap.recycle()
                }
                ?.addOnFailureListener { e ->
                    promise.reject("EXTRACTION_ERROR", e.message)
                    bitmap.recycle()
                }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

//    private fun extractEmbeddings(bitmap: Bitmap): FloatArray {
//        val imgData = ByteBuffer.allocateDirect(1 * inputSize * inputSize * 3 * 4)
//        imgData.order(ByteOrder.nativeOrder())
//
//        val intValues = IntArray(inputSize * inputSize)
//        bitmap.getPixels(intValues, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
//        imgData.rewind()
//
//        for (i in 0 until inputSize) {
//            for (j in 0 until inputSize) {
//                val pixelValue = intValues[i * inputSize + j]
//                imgData.putFloat((((pixelValue shr 16) and 0xFF) - imageMean) / imageStd)
//                imgData.putFloat((((pixelValue shr 8) and 0xFF) - imageMean) / imageStd)
//                imgData.putFloat(((pixelValue and 0xFF) - imageMean) / imageStd)
//            }
//        }
//
//        val inputArray = arrayOf<Any>(imgData)
//        val outputMap = HashMap<Int, Any>()
//        val embeddings = Array(1) { FloatArray(outputSize) }
//        outputMap[0] = embeddings
//        tfLite?.runForMultipleInputsOutputs(inputArray, outputMap)
//
//        return embeddings[0]
//    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        val byteArrayOutputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 90, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }

    @ReactMethod
    fun deleteFace(name: String, promise: Promise) {
        if (registered.containsKey(name)) {
            registered.remove(name)
            saveFacesToPreferences()
            promise.resolve(true)
        } else {
            promise.reject("NOT_FOUND", "Face not found")
        }
    }

    @ReactMethod
    fun getAllFaces(promise: Promise) {
        val faces = Arguments.createArray()
        registered.values.forEach { recognition ->
            val faceInfo = Arguments.createMap().apply {
                putString("name", recognition.title)
                putString("employeeId", recognition.employeeId)
            }
            faces.pushMap(faceInfo)
        }
        promise.resolve(faces)
    }


    @ReactMethod
    fun extractEmbeddingsFromBase64(base64String: String, promise: Promise) {
        try {
            Log.d("FaceRecognition", "Extracting embeddings from base64 image")

            // Remove data URL prefix if present
            val cleanBase64 = base64String.replace("data:image/jpeg;base64,", "")
                .replace("data:image/png;base64,", "")

            val imageBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)

            if (bitmap == null) {
                promise.reject("INVALID_IMAGE", "Could not decode base64 image")
                return
            }

            val inputImage = InputImage.fromBitmap(bitmap, 0)

            detector?.process(inputImage)
                ?.addOnSuccessListener { faces ->
                    if (faces.isNotEmpty()) {
                        val face = faces[0]
                        val boundingBox = RectF(face.boundingBox)

                        if (boundingBox.width() < 100 || boundingBox.height() < 100) {
                            promise.reject("FACE_TOO_SMALL", "Face is too small")
                            bitmap.recycle()
                            return@addOnSuccessListener
                        }

                        val processedFace = preprocessFace(bitmap, boundingBox, addMargin = false)
                        val embeddings = extractEmbeddings(processedFace)

                        val embeddingsArray = Arguments.createArray()
                        embeddings.forEach { value ->
                            embeddingsArray.pushDouble(value.toDouble())
                        }

                        val faceImageBase64 = bitmapToBase64(processedFace)

                        promise.resolve(Arguments.createMap().apply {
                            putArray("embeddings", embeddingsArray)
                            putString("faceImage", faceImageBase64)
                            putInt("embeddingSize", outputSize)
                        })

                        processedFace.recycle()
                    } else {
                        promise.reject("NO_FACE", "No face detected in the image")
                    }
                    bitmap.recycle()
                }
                ?.addOnFailureListener { e ->
                    promise.reject("FACE_DETECTION_ERROR", "Face detection failed: ${e.message}")
                    bitmap.recycle()
                }
        } catch (e: Exception) {
            promise.reject("EXTRACTION_ERROR", "Failed to extract embeddings: ${e.message}")
        }
    }

    private fun extractEmbeddings(bitmap: Bitmap): FloatArray {
        val imgData = ByteBuffer.allocateDirect(1 * inputSize * inputSize * 3 * 4)
        imgData.order(ByteOrder.nativeOrder())

        // Get pixels from bitmap
        val intValues = IntArray(inputSize * inputSize)
        bitmap.getPixels(intValues, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
        imgData.rewind()

        // Normalize pixel values properly
        for (i in 0 until inputSize) {
            for (j in 0 until inputSize) {
                val pixelValue = intValues[i * inputSize + j]

                // Extract RGB channels
                val r = ((pixelValue shr 16) and 0xFF).toFloat()
                val g = ((pixelValue shr 8) and 0xFF).toFloat()
                val b = (pixelValue and 0xFF).toFloat()

                // Normalize to [-1, 1] range for better embeddings
                imgData.putFloat((r - 127.5f) / 127.5f)
                imgData.putFloat((g - 127.5f) / 127.5f)
                imgData.putFloat((b - 127.5f) / 127.5f)
            }
        }

        val inputArray = arrayOf<Any>(imgData)
        val outputMap = HashMap<Int, Any>()
        val embeddings = Array(1) { FloatArray(outputSize) }
        outputMap[0] = embeddings
        tfLite?.runForMultipleInputsOutputs(inputArray, outputMap)

        // L2 normalize the embeddings for consistency
        val embedding = embeddings[0]
        var norm = 0f
        for (value in embedding) {
            norm += value * value
        }
        norm = kotlin.math.sqrt(norm)

        if (norm > 0) {
            for (i in embedding.indices) {
                embedding[i] = embedding[i] / norm
            }
        }

        return embedding
    }

    private fun saveBitmapToGallery(bitmap: Bitmap): String? {
        return try {
            val filename = "Face_${System.currentTimeMillis()}.jpg"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Images.Media.DISPLAY_NAME, filename)
                    put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
                    put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/FaceRecognition")
                }

                val uri = reactApplicationContext.contentResolver.insert(
                    MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                    values
                )

                if (uri != null) {
                    reactApplicationContext.contentResolver.openOutputStream(uri)?.use { outputStream ->
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 95, outputStream)
                        Log.d("FaceRecognition", "Bitmap saved to gallery: $uri")
                        return@saveBitmapToGallery uri.toString()
                    }
                }
            } else {
                val picturesDir = File(
                    reactApplicationContext.getExternalFilesDir(null),
                    "FaceRecognition"
                )

                if (!picturesDir.exists()) {
                    picturesDir.mkdirs()
                }

                val file = File(picturesDir, filename)
                FileOutputStream(file).use { outputStream ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 95, outputStream)
                    Log.d("FaceRecognition", "Bitmap saved to: ${file.absolutePath}")
                    return@saveBitmapToGallery file.absolutePath
                }
            }

            null
        } catch (e: Exception) {
            Log.e("FaceRecognition", "Error saving bitmap to gallery: ${e.message}")
            null
        }
    }

    @ReactMethod
    fun extractEmbeddingsFromImage(imagePath: String, promise: Promise) {
        try {
            Log.d("FaceRecognition", "Extracting embeddings from: $imagePath")

            // Handle both file paths and content URIs
            val uri = if (imagePath.startsWith("content://") || imagePath.startsWith("file://")) {
                Uri.parse(imagePath)
            } else {
                Uri.fromFile(File(imagePath))
            }

            val bitmap = getBitmapFromUri(uri)
            if (bitmap == null) {
                promise.reject("INVALID_IMAGE", "Could not load image from path: $imagePath")
                return
            }

            Log.d("FaceRecognition", "Original bitmap size: ${bitmap.width}x${bitmap.height}")

            val inputImage = InputImage.fromBitmap(bitmap, 0)

            detector?.process(inputImage)
                ?.addOnSuccessListener { faces ->
                    if (faces.isNotEmpty()) {
                        val face = faces[0]
                        val boundingBox = RectF(face.boundingBox)

                        Log.d("FaceRecognition", "Face detected: ${boundingBox.width()}x${boundingBox.height()}")
                        Log.d("FaceRecognition", "Face location: left=${boundingBox.left}, top=${boundingBox.top}")

                        // Check face size
                        if (boundingBox.width() < 100 || boundingBox.height() < 100) {
                            promise.reject("FACE_TOO_SMALL", "Face is too small. Minimum size: 100x100 pixels. Got: ${boundingBox.width().toInt()}x${boundingBox.height().toInt()}")
                            bitmap.recycle()
                            return@addOnSuccessListener
                        }

                        // Preprocess face with improved quality
                        val processedFace = preprocessFace(bitmap, boundingBox, addMargin = false)

                        Log.d("FaceRecognition", "Processed face size: ${processedFace.width}x${processedFace.height}")

                        // Extract embeddings with L2 normalization
                        val embeddings = extractEmbeddings(processedFace)

                        // Log embedding stats
                        var embeddingNorm = 0f
                        for (value in embeddings) {
                            embeddingNorm += value * value
                        }
                        embeddingNorm = kotlin.math.sqrt(embeddingNorm)
                        Log.d("FaceRecognition", "Embedding norm: $embeddingNorm (should be close to 1.0)")
                        Log.d("FaceRecognition", "First 5 embeddings: ${embeddings.slice(0..4)}")

                        // Convert embeddings to React Native array
                        val embeddingsArray = Arguments.createArray()
                        embeddings.forEach { value ->
                            embeddingsArray.pushDouble(value.toDouble())
                        }

                        // Convert processed face to base64
                        val faceImageBase64 = bitmapToBase64(processedFace)

                        // Save bitmap to gallery
                        val savedImagePath = saveBitmapToGallery(processedFace)

                        promise.resolve(Arguments.createMap().apply {
                            putArray("embeddings", embeddingsArray)
                            putString("faceImage", faceImageBase64)
                            putInt("embeddingSize", outputSize)
                            putInt("originalWidth", bitmap.width)
                            putInt("originalHeight", bitmap.height)
                            putInt("faceWidth", processedFace.width)
                            putInt("faceHeight", processedFace.height)
                            if (savedImagePath != null) {
                                putString("savedImagePath", savedImagePath)
                            }
                        })

                        processedFace.recycle()
                    } else {
                        promise.reject("NO_FACE", "No face detected in the image")
                    }
                    bitmap.recycle()
                }
                ?.addOnFailureListener { e ->
                    promise.reject("FACE_DETECTION_ERROR", "Face detection failed: ${e.message}")
                    bitmap.recycle()
                }
        } catch (e: Exception) {
            promise.reject("EXTRACTION_ERROR", "Failed to extract embeddings: ${e.message}")
        }
    }

    @ReactMethod
    fun clearAllFaces(promise: Promise) {
        registered.clear()
        lastRecognitionTime.clear()
        saveFacesToPreferences()
        promise.resolve(true)
    }

    @ReactMethod
    fun setDistance(newDistance: Double, promise: Promise) {
        distance = newDistance.toFloat()
        val sharedPref = reactApplicationContext.getSharedPreferences("Distance", Context.MODE_PRIVATE)
        sharedPref.edit().putFloat("distance", distance).apply()
        promise.resolve(distance.toDouble())
    }

    @ReactMethod
    fun getDistance(promise: Promise) {
        promise.resolve(distance.toDouble())
    }

    @ReactMethod
    fun checkCameraPermission(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        val hasPermission = ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED

        promise.resolve(hasPermission)
    }

    @ReactMethod
    fun initialize(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        try {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "Camera permission required")
                return
            }

            startCamera(promise)
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", "Initialization failed: ${e.message}")
        }
    }

    private fun preprocessFace(bitmap: Bitmap, boundingBox: RectF, addMargin: Boolean = false): Bitmap {
        var adjustedBox = RectF(boundingBox)

        if (addMargin) {
            // Add margin for context
            val margin = 0.2f
            val expandX = boundingBox.width() * margin
            val expandY = boundingBox.height() * margin

            adjustedBox.left = (boundingBox.left - expandX).coerceAtLeast(0f)
            adjustedBox.top = (boundingBox.top - expandY).coerceAtLeast(0f)
            adjustedBox.right = (boundingBox.right + expandX).coerceAtMost(bitmap.width.toFloat())
            adjustedBox.bottom = (boundingBox.bottom + expandY).coerceAtMost(bitmap.height.toFloat())
        } else {
            // For no margin, still ensure we get the full face
            adjustedBox = RectF(
                boundingBox.left.coerceAtLeast(0f),
                boundingBox.top.coerceAtLeast(0f),
                boundingBox.right.coerceAtMost(bitmap.width.toFloat()),
                boundingBox.bottom.coerceAtMost(bitmap.height.toFloat())
            )
        }

        // Crop face with better boundary handling
        val croppedFace = getCropBitmapByCPU(bitmap, adjustedBox)

        // Resize to model input size with high quality
        val scaled = getResizedBitmapHighQuality(croppedFace, inputSize, inputSize)

        // Clean up
        if (!croppedFace.isRecycled && croppedFace != scaled) {
            croppedFace.recycle()
        }

        return scaled
    }

    private fun getResizedBitmapHighQuality(bm: Bitmap, newWidth: Int, newHeight: Int): Bitmap {
        val width = bm.width
        val height = bm.height

        // Calculate scaling
        val scaleWidth = newWidth.toFloat() / width
        val scaleHeight = newHeight.toFloat() / height

        val matrix = Matrix()
        matrix.postScale(scaleWidth, scaleHeight)

        // Use filtering for better quality
        val resizedBitmap = Bitmap.createBitmap(
            bm, 0, 0, width, height, matrix, true
        )

        if (bm != resizedBitmap) {
            bm.recycle()
        }

        return resizedBitmap
    }

    @ReactMethod
    fun recognizeFromUri(imageUri: String, promise: Promise) {
        try {
            val uri = Uri.parse(imageUri)
            val bitmap = getBitmapFromUri(uri)
            val inputImage = InputImage.fromBitmap(bitmap, 0)

            detector?.process(inputImage)
                ?.addOnSuccessListener { faces ->
                    if (faces.isNotEmpty()) {
                        val face = faces[0]
                        val boundingBox = RectF(face.boundingBox)

                        // IMPORTANT: Check face size like in continuous recognition
                        if (boundingBox.width() < 100 || boundingBox.height() < 100) {
                            promise.reject("FACE_TOO_SMALL", "Face is too small. Please use a closer image.")
                            bitmap.recycle()
                            return@addOnSuccessListener
                        }

                        // Use SAME preprocessing as continuous recognition
                        val processedFace = preprocessFace(bitmap, boundingBox, addMargin = false)

                        // Store for potential registration
                        lastFaceBitmap?.recycle()
                        lastFaceBitmap = processedFace.copy(Bitmap.Config.ARGB_8888, false)

                        val result = recognizeImage(processedFace)

                        Log.d("FaceRecognition", "=== RECOGNIZE FROM URI ===")
                        Log.d("FaceRecognition", "Result: ${result.getString("name")}")
                        Log.d("FaceRecognition", "Distance: ${result.getDouble("distance")}")
                        Log.d("FaceRecognition", "Recognized: ${result.getBoolean("recognized")}")

                        promise.resolve(result)

                        processedFace.recycle()
                    } else {
                        promise.reject("NO_FACE", "No face detected in image")
                    }
                    bitmap.recycle()
                }
                ?.addOnFailureListener { e ->
                    promise.reject("RECOGNITION_ERROR", e.message)
                    bitmap.recycle()
                }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun imageProxyToBitmap(imageProxy: ImageProxy): Bitmap? {
        val mediaImage = imageProxy.image ?: return null

        val yBuffer = mediaImage.planes[0].buffer
        val uvBuffer = mediaImage.planes[2].buffer
        val ySize = yBuffer.remaining()
        val uvSize = uvBuffer.remaining()

        val nv21 = ByteArray(ySize + uvSize)
        yBuffer.get(nv21, 0, ySize)
        uvBuffer.get(nv21, ySize, uvSize)

        val yuvImage = YuvImage(nv21, ImageFormat.NV21, mediaImage.width, mediaImage.height, null)
        val out = ByteArrayOutputStream()
        yuvImage.compressToJpeg(Rect(0, 0, mediaImage.width, mediaImage.height), 100, out)
        val imageBytes = out.toByteArray()
        var bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)

        val rotationDegrees = imageProxy.imageInfo.rotationDegrees
        if (rotationDegrees != 0) {
            val matrix = Matrix()
            matrix.postRotate(rotationDegrees.toFloat())
            val rotatedBitmap = Bitmap.createBitmap(
                bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true
            )
            bitmap.recycle()
            bitmap = rotatedBitmap
        }

        return bitmap
    }

    private fun recognizeImage(bitmap: Bitmap): WritableMap {
        val imgData = ByteBuffer.allocateDirect(1 * inputSize * inputSize * 3 * 4)
        imgData.order(ByteOrder.nativeOrder())

        val intValues = IntArray(inputSize * inputSize)
        bitmap.getPixels(intValues, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)

        imgData.rewind()

        for (i in 0 until inputSize) {
            for (j in 0 until inputSize) {
                val pixelValue = intValues[i * inputSize + j]
                if (isModelQuantized) {
                    imgData.put(((pixelValue shr 16) and 0xFF).toByte())
                    imgData.put(((pixelValue shr 8) and 0xFF).toByte())
                    imgData.put((pixelValue and 0xFF).toByte())
                } else {
                    imgData.putFloat((((pixelValue shr 16) and 0xFF) - imageMean) / imageStd)
                    imgData.putFloat((((pixelValue shr 8) and 0xFF) - imageMean) / imageStd)
                    imgData.putFloat(((pixelValue and 0xFF) - imageMean) / imageStd)
                }
            }
        }

        val inputArray = arrayOf<Any>(imgData)
        val outputMap = HashMap<Int, Any>()
        val currentEmbeddings = Array(1) { FloatArray(outputSize) }
        lastEmbeddings = currentEmbeddings

        outputMap[0] = currentEmbeddings
        tfLite?.runForMultipleInputsOutputs(inputArray, outputMap)

        val result = Arguments.createMap()

        if (registered.size > 0) {
            val nearest = findNearest(currentEmbeddings[0])

            if (nearest.isNotEmpty() && nearest[0] != null) {
                val recognition = nearest[0].first
                val distanceLocal = nearest[0].second

                Log.d("FaceRecognition", "=== RECOGNITION RESULT ===")
                Log.d("FaceRecognition", "Calculated distance: $distanceLocal")
                Log.d("FaceRecognition", "Current threshold: $distance")
                Log.d("FaceRecognition", "Should recognize: ${distanceLocal < distance}")
                Log.d("FaceRecognition", "Best match: ${recognition.title}")

                result.putString("name", if (distanceLocal < distance) recognition.title else "Unknown")
                result.putString("employeeId", if (distanceLocal < distance) recognition.employeeId else "")
                result.putDouble("distance", distanceLocal.toDouble())
                result.putBoolean("recognized", distanceLocal < distance)

                if (nearest.size > 1) {
                    result.putString("secondNearest", nearest[1].first.title)
                    result.putDouble("secondDistance", nearest[1].second.toDouble())
                }
            } else {
                result.putString("name", "Unknown")
                result.putBoolean("recognized", false)
                result.putDouble("distance", 2.0)
            }
        } else {
            result.putString("name", "No registered faces")
            result.putBoolean("recognized", false)
            result.putDouble("distance", 0.0)
        }

        return result
    }

    private fun findNearest(emb: FloatArray): List<android.util.Pair<EmployeeRecognition, Float>> {
        val neighbourList = ArrayList<android.util.Pair<EmployeeRecognition, Float>>()
        var ret: android.util.Pair<EmployeeRecognition, Float>? = null
        var prevRet: android.util.Pair<EmployeeRecognition, Float>? = null

        for ((_, recognition) in registered) {
            val knownEmb = (recognition.extra as Array<FloatArray>)[0]
            var distance = 0f

            for (i in emb.indices) {
                val diff = emb[i] - knownEmb[i]
                distance += diff * diff
            }
            distance = kotlin.math.sqrt(distance)

            if (ret == null || distance < ret.second) {
                prevRet = ret
                ret = android.util.Pair(recognition, distance)
            }
        }

        if (prevRet == null) prevRet = ret
        ret?.let { neighbourList.add(it) }
        prevRet?.let { neighbourList.add(it) }

        return neighbourList
    }

    private fun saveFacesToPreferences() {
        val jsonString = Gson().toJson(registered)
        val sharedPreferences = reactApplicationContext.getSharedPreferences("HashMap", Context.MODE_PRIVATE)
        sharedPreferences.edit().putString("map", jsonString).apply()
    }

    private fun loadRegisteredFaces() {
        val sharedPreferences =
            reactApplicationContext.getSharedPreferences("HashMap", Context.MODE_PRIVATE)
        val defValue = Gson().toJson(HashMap<String, EmployeeRecognition>())
        val json = sharedPreferences.getString("map", defValue) ?: defValue

        val token = object : TypeToken<HashMap<String, EmployeeRecognition>>() {}
        val retrievedMap: HashMap<String, EmployeeRecognition> = Gson().fromJson(json, token.type)

        for ((_, recognition) in retrievedMap) {
            val output = Array(1) { FloatArray(outputSize) }
            val arrayList = recognition.extra as? ArrayList<*>
            val innerList = arrayList?.get(0) as? ArrayList<*>

            innerList?.forEachIndexed { index, value ->
                output[0][index] = (value as Double).toFloat()
            }
            recognition.extra = output
        }

        registered = retrievedMap

        val sharedPref =
            reactApplicationContext.getSharedPreferences("Distance", Context.MODE_PRIVATE)
        distance = sharedPref.getFloat("distance", 1.00f)
    }

    private fun getBitmapFromUri(uri: Uri): Bitmap {
        val parcelFileDescriptor = reactApplicationContext.contentResolver.openFileDescriptor(uri, "r")
        val fileDescriptor = parcelFileDescriptor?.fileDescriptor
        val image = BitmapFactory.decodeFileDescriptor(fileDescriptor)
        parcelFileDescriptor?.close()
        return image
    }

    fun cleanup() {
        try {
            cameraProvider?.unbindAll()
            imageAnalysis = null
            detector?.close()
            tfLite?.close()
            preview = null
            lastFaceBitmap?.recycle()
            lastFaceBitmap = null
        } catch (e: Exception) {
            Log.e("FaceRecognition", "Cleanup error: ${e.message}")
        }
    }

    private fun getResizedBitmap(bm: Bitmap, newWidth: Int, newHeight: Int): Bitmap {
        val width = bm.width
        val height = bm.height
        val scaleWidth = newWidth.toFloat() / width
        val scaleHeight = newHeight.toFloat() / height
        val matrix = Matrix()
        matrix.postScale(scaleWidth, scaleHeight)
        val resizedBitmap = Bitmap.createBitmap(bm, 0, 0, width, height, matrix, false)
        bm.recycle()
        return resizedBitmap
    }

    private fun getCropBitmapByCPU(source: Bitmap, cropRectF: RectF): Bitmap {
        val left = cropRectF.left.toInt().coerceAtLeast(0)
        val top = cropRectF.top.toInt().coerceAtLeast(0)
        val width = cropRectF.width().toInt().coerceAtMost(source.width - left)
        val height = cropRectF.height().toInt().coerceAtMost(source.height - top)

        if (width <= 0 || height <= 0) {
            throw IllegalArgumentException("Invalid crop dimensions: width=$width, height=$height")
        }

        val resultBitmap = Bitmap.createBitmap(source, left, top, width, height)

        if (source != resultBitmap) {
            source.recycle()
        }

        return resultBitmap
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    data class EmployeeRecognition(
        val id: String,
        val title: String,
        val distance: Float,
        val employeeId: String = ""
    ) {
        var extra: Any? = null
    }
}
