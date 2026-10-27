package com.sysboat.name.FaceRecognitionModule

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.*
import android.hardware.camera2.*
import android.media.Image
import android.media.ImageReader
import android.os.Handler
import android.os.HandlerThread
import android.util.AttributeSet
import android.util.Log
import android.view.*
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import org.tensorflow.lite.Interpreter
import java.io.*
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import android.graphics.ImageFormat
import android.util.Size
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

class FaceRecognitionCameraView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr), SurfaceHolder.Callback {

    companion object {
        private const val TAG = "FaceRecognitionCamera"
        private const val MIN_PROCESS_INTERVAL = 1000L
        private const val MIN_FACE_SIZE = 150
    }

    // Camera / preview
    private var cameraId = "1"
    private val cameraManager: CameraManager =
        context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    private var cameraDevice: CameraDevice? = null
    private var captureSession: CameraCaptureSession? = null
    private var previewRequestBuilder: CaptureRequest.Builder? = null
    private var imageReader: ImageReader? = null
    private var backgroundThread: HandlerThread? = null
    private var backgroundHandler: Handler? = null
    private var isCameraActive = false
    private val previewSurfaceView: SurfaceView = SurfaceView(context)
    private var faceDetectedListener: ((List<Rect>) -> Unit)? = null
    private var recognitionListener: ((WritableMap) -> Unit)? = null
    private var lastProcessTime = 0L
    private var frameCounter = 0
    private val FRAME_SKIP_COUNT = 10 // Match the module's frame skipping

    // ML Kit face detector
    private val detector: FaceDetector by lazy {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE) // Match module
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
            .build()
        FaceDetection.getClient(options)
    }

    // TFLite - FIXED: Match the module's normalization
    private var tfLite: Interpreter? = null
    private val inputSize = 112
    private val outputSize = 192
    private val imageMean = 128.0f // FIXED: Changed from 127.5f
    private val imageStd = 128.0f
    private val isModelQuantized = false
    private val modelFile = "mobile_face_net.tflite"
    private var distance = 1.0f // Match module's default
    private var registered = HashMap<String, EmployeeRecognition>()

    init {
        addView(previewSurfaceView)
        previewSurfaceView.holder.addCallback(this)
        fixLayoutForReactNative()

        loadModel()
        loadRegisteredFaces()
    }

    fun setFaceDetectedListener(listener: ((List<Rect>) -> Unit)?) {
        faceDetectedListener = listener
    }

    fun setRecognitionListener(listener: ((WritableMap) -> Unit)?) {
        recognitionListener = listener
    }

    private fun startBackgroundThread() {
        backgroundThread = HandlerThread("Camera2Background").also { it.start() }
        backgroundHandler = Handler(backgroundThread!!.looper)
    }

    private fun stopBackgroundThread() {
        backgroundThread?.quitSafely()
        backgroundThread = null
        backgroundHandler = null
    }

    private fun fixLayoutForReactNative() {
        viewTreeObserver.addOnGlobalLayoutListener {
            for (i in 0 until childCount) {
                val child = getChildAt(i)
                child.layout(0, 0, width, height)
            }
        }
    }

    @SuppressLint("MissingPermission")
    fun startCamera() {
        if (isCameraActive) {
            Log.w(TAG, "Camera already active")
            return
        }

        try {
            startBackgroundThread()
            cameraManager.openCamera(cameraId, object : CameraDevice.StateCallback() {
                override fun onOpened(camera: CameraDevice) {
                    cameraDevice = camera
                    createCameraPreviewSession()
                    isCameraActive = true
                }

                override fun onDisconnected(camera: CameraDevice) {
                    camera.close()
                    cameraDevice = null
                }

                override fun onError(camera: CameraDevice, error: Int) {
                    Log.e(TAG, "Camera error: $error")
                    camera.close()
                    cameraDevice = null
                }
            }, backgroundHandler)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening camera", e)
        }
    }

    fun stopCamera() {
        try {
            captureSession?.close()
            captureSession = null
            imageReader?.close()
            imageReader = null
            cameraDevice?.close()
            cameraDevice = null
            stopBackgroundThread()
            isCameraActive = false
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping camera", e)
        }
    }

    fun switchCamera() {
        cameraId = if (cameraId == "1") "0" else "1"
        stopCamera()
        postDelayed({ startCamera() }, 500)
    }

    private fun createCameraPreviewSession() {
        try {
            val characteristics = cameraManager.getCameraCharacteristics(cameraId)
            val map = characteristics.get(
                CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP
            ) ?: throw Exception("Can't get stream config map")

            val supportedSizes = map.getOutputSizes(ImageFormat.YUV_420_888)
            val bestSize = supportedSizes.firstOrNull { it.width == 640 && it.height == 480 }
                ?: supportedSizes.firstOrNull()
                ?: Size(640, 480)

            val previewSurface = previewSurfaceView.holder.surface
            val previewSize = bestSize

            imageReader = ImageReader.newInstance(
                previewSize.width,
                previewSize.height,
                ImageFormat.YUV_420_888,
                2
            )
            imageReader?.setOnImageAvailableListener({ reader ->
                val image = reader.acquireLatestImage() ?: return@setOnImageAvailableListener
                processImage(image)
                image.close()
            }, backgroundHandler)

            previewRequestBuilder =
                cameraDevice?.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW)?.apply {
                    addTarget(previewSurface)
                    addTarget(imageReader!!.surface)
                    set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)
                }

            cameraDevice?.createCaptureSession(
                listOf(previewSurface, imageReader!!.surface),
                object : CameraCaptureSession.StateCallback() {
                    override fun onConfigured(session: CameraCaptureSession) {
                        captureSession = session
                        val previewRequest = previewRequestBuilder?.build()
                        try {
                            session.setRepeatingRequest(previewRequest!!, null, backgroundHandler)
                        } catch (e: Exception) {
                            Log.e(TAG, "setRepeatingRequest failed", e)
                        }
                    }

                    override fun onConfigureFailed(session: CameraCaptureSession) {
                        Log.e(TAG, "Camera2 configuration failed")
                    }
                },
                backgroundHandler
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start preview", e)
        }
    }

    private fun processImage(image: Image) {
        frameCounter++

        // FIXED: Add frame skipping like the module
        if (frameCounter % FRAME_SKIP_COUNT != 0) {
            return
        }

        val currentTime = System.currentTimeMillis()
        if (currentTime - lastProcessTime < MIN_PROCESS_INTERVAL) {
            return
        }
        lastProcessTime = currentTime

        try {
            // Convert to bitmap with improved method
            var bitmap = imageToBitmap(image) ?: return

            // FIXED: Add rotation handling
            val characteristics = cameraManager.getCameraCharacteristics(cameraId)
            val sensorOrientation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0

            // Apply rotation
            if (sensorOrientation != 0) {
                val matrix = Matrix()
                matrix.postRotate(sensorOrientation.toFloat())
                val rotatedBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                if (!bitmap.isRecycled) bitmap.recycle()
                bitmap = rotatedBitmap
            }

            // Mirror if front camera
            if (cameraId == "1") {
                val matrix = Matrix()
                matrix.preScale(-1f, 1f)
                val mirrored = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, false)
                if (!bitmap.isRecycled) bitmap.recycle()
                bitmap = mirrored
            }

            val inputImage = InputImage.fromBitmap(bitmap, 0)

            detector.process(inputImage)
                .addOnSuccessListener { faces ->
                    // FIXED: Use same filtering as module
                    val validFaces = faces.filter { face ->
                        face.boundingBox.width() >= MIN_FACE_SIZE &&
                                face.boundingBox.height() >= MIN_FACE_SIZE
                    }

                    val rects = validFaces.map { it.boundingBox }
                    faceDetectedListener?.invoke(rects)

                    if (validFaces.isNotEmpty()) {
                        val face = validFaces[0]
                        val boundingBox = RectF(face.boundingBox)

                        // FIXED: Remove padding to match module behavior
                        // The module doesn't add explicit padding

                        val croppedFace = getCropBitmapByCPU(bitmap, boundingBox)
                        val scaled = getResizedBitmap(croppedFace, inputSize, inputSize)

                        val result = recognizeImage(scaled)

                        Log.d(TAG, "=== RECOGNITION RESULT ===")
                        Log.d(TAG, "Name: ${result.getString("name")}")
                        Log.d(TAG, "Distance: ${result.getDouble("distance")}")
                        Log.d(TAG, "Recognized: ${result.getBoolean("recognized")}")
                        Log.d(TAG, "Threshold: $distance")

                        recognitionListener?.invoke(result)

                        if (!croppedFace.isRecycled) croppedFace.recycle()
                        if (!scaled.isRecycled) scaled.recycle()
                    }

                    if (!bitmap.isRecycled) bitmap.recycle()
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Face detection failed: ${e.message}")
                    if (!bitmap.isRecycled) bitmap.recycle()
                }
        } catch (e: Exception) {
            Log.e(TAG, "processImage failed: ${e.message}", e)
        }
    }

    // FIXED: Improved YUV to Bitmap conversion
    private fun imageToBitmap(image: Image): Bitmap? {
        try {
            val yBuffer = image.planes[0].buffer
            val uBuffer = image.planes[1].buffer
            val vBuffer = image.planes[2].buffer

            val ySize = yBuffer.remaining()
            val uSize = uBuffer.remaining()
            val vSize = vBuffer.remaining()

            val nv21 = ByteArray(ySize + uSize + vSize)

            yBuffer.get(nv21, 0, ySize)

            // Simplified UV handling
            val uvPixelStride = image.planes[1].pixelStride
            if (uvPixelStride == 1) {
                vBuffer.get(nv21, ySize, vSize)
                uBuffer.get(nv21, ySize + vSize, uSize)
            } else {
                // Interleaved UV
                val uvWidth = image.width / 2
                val uvHeight = image.height / 2
                var pos = ySize

                for (row in 0 until uvHeight) {
                    for (col in 0 until uvWidth) {
                        val vIndex = row * image.planes[2].rowStride + col * uvPixelStride
                        val uIndex = row * image.planes[1].rowStride + col * uvPixelStride

                        if (vIndex < vSize && uIndex < uSize && pos + 1 < nv21.size) {
                            nv21[pos++] = vBuffer.get(vIndex)
                            nv21[pos++] = uBuffer.get(uIndex)
                        }
                    }
                }
            }

            val yuvImage = YuvImage(nv21, ImageFormat.NV21, image.width, image.height, null)
            val out = ByteArrayOutputStream()
            yuvImage.compressToJpeg(Rect(0, 0, image.width, image.height), 100, out)
            val jpegBytes = out.toByteArray()

            return BitmapFactory.decodeByteArray(jpegBytes, 0, jpegBytes.size)
        } catch (e: Exception) {
            Log.e(TAG, "Error converting image to bitmap: ${e.message}", e)
            return null
        }
    }

    private fun loadModel() {
        try {
            tfLite = Interpreter(loadModelFile(context, modelFile))
        } catch (e: IOException) {
            Log.e(TAG, "Failed to load model: ${e.message}")
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
                    // FIXED: Use correct normalization matching the module
                    imgData.putFloat((((pixelValue shr 16) and 0xFF) - imageMean) / imageStd)
                    imgData.putFloat((((pixelValue shr 8) and 0xFF) - imageMean) / imageStd)
                    imgData.putFloat(((pixelValue and 0xFF) - imageMean) / imageStd)
                }
            }
        }

        val inputArray = arrayOf<Any>(imgData)
        val outputMap = HashMap<Int, Any>()
        val currentEmbeddings = Array(1) { FloatArray(outputSize) }
        outputMap[0] = currentEmbeddings
        tfLite?.runForMultipleInputsOutputs(inputArray, outputMap)

        val result = Arguments.createMap()

        if (registered.size > 0) {
            val nearest = findNearest(currentEmbeddings[0])

            if (nearest.isNotEmpty() && nearest[0] != null) {
                val recognition = nearest[0].first
                val distanceLocal = nearest[0].second

                Log.d(TAG, "Best match: ${recognition.title}, distance: $distanceLocal, threshold: $distance")

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

    private fun findNearest(emb: FloatArray): List<Pair<EmployeeRecognition, Float>> {
        val neighbourList = ArrayList<Pair<EmployeeRecognition, Float>>()
        var ret: Pair<EmployeeRecognition, Float>? = null
        var prevRet: Pair<EmployeeRecognition, Float>? = null

        for ((_, recognition) in registered) {
            val knownEmbAny = recognition.extra
            if (knownEmbAny == null) continue

            val knownEmb = when (knownEmbAny) {
                is Array<*> -> {
                    @Suppress("UNCHECKED_CAST")
                    (knownEmbAny as Array<FloatArray>)[0]
                }
                is ArrayList<*> -> {
                    val first = knownEmbAny.getOrNull(0)
                    when (first) {
                        is ArrayList<*> -> {
                            val inner = first as ArrayList<*>
                            FloatArray(outputSize) { idx ->
                                val v = inner.getOrNull(idx)
                                when (v) {
                                    is Double -> v.toFloat()
                                    is Float -> v
                                    is Number -> v.toFloat()
                                    else -> 0f
                                }
                            }
                        }
                        else -> FloatArray(outputSize) { 0f }
                    }
                }
                else -> FloatArray(outputSize) { 0f }
            }

            var distance = 0f
            for (i in emb.indices) {
                val diff = emb[i] - knownEmb[i]
                distance += diff * diff
            }
            distance = sqrt(distance)

            if (ret == null || distance < ret.second) {
                prevRet = ret
                ret = Pair(recognition, distance)
            }
        }

        if (prevRet == null) prevRet = ret
        ret?.let { neighbourList.add(it) }
        prevRet?.let { neighbourList.add(it) }

        return neighbourList.sortedBy { it.second }
    }

    private fun loadRegisteredFaces() {
        try {
            val sharedPreferences = context.getSharedPreferences("HashMap", Context.MODE_PRIVATE)
            val defValue = Gson().toJson(HashMap<String, EmployeeRecognition>())
            val json = sharedPreferences.getString("map", defValue) ?: defValue

            val token = object : TypeToken<HashMap<String, EmployeeRecognition>>() {}
            val retrievedMap: HashMap<String, EmployeeRecognition> = Gson().fromJson(json, token.type)

            for ((_, recognition) in retrievedMap) {
                val maybeExtra = recognition.extra
                if (maybeExtra == null) continue

                if (maybeExtra is ArrayList<*>) {
                    val first = maybeExtra.getOrNull(0)
                    if (first is ArrayList<*>) {
                        val innerList = first
                        val output = Array(1) { FloatArray(outputSize) }
                        for (i in 0 until min(innerList.size, outputSize)) {
                            val v = innerList[i]
                            output[0][i] = when (v) {
                                is Double -> v.toFloat()
                                is Float -> v
                                is Number -> v.toFloat()
                                else -> 0f
                            }
                        }
                        recognition.extra = output
                    }
                }
            }

            registered = retrievedMap

            val sharedPref = context.getSharedPreferences("Distance", Context.MODE_PRIVATE)
            distance = sharedPref.getFloat("distance", 1.0f) // FIXED: Match module default

            Log.d(TAG, "Loaded ${registered.size} registered faces with distance threshold: $distance")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load registered faces: ${e.message}", e)
        }
    }

    private fun getResizedBitmap(bm: Bitmap, newWidth: Int, newHeight: Int): Bitmap {
        val width = bm.width
        val height = bm.height
        val scaleWidth = newWidth.toFloat() / width
        val scaleHeight = newHeight.toFloat() / height
        val matrix = Matrix()
        matrix.postScale(scaleWidth, scaleHeight)
        return Bitmap.createBitmap(bm, 0, 0, width, height, matrix, false)
    }

    private fun getCropBitmapByCPU(source: Bitmap, cropRectF: RectF): Bitmap {
        val left = max(0, cropRectF.left.toInt())
        val top = max(0, cropRectF.top.toInt())
        val right = min(source.width, cropRectF.right.toInt())
        val bottom = min(source.height, cropRectF.bottom.toInt())
        val width = max(1, right - left)
        val height = max(1, bottom - top)

        val resultBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(resultBitmap)
        val paint = Paint(Paint.FILTER_BITMAP_FLAG)

        val srcRect = Rect(left, top, right, bottom)
        val dstRect = Rect(0, 0, width, height)
        canvas.drawBitmap(source, srcRect, dstRect, paint)

        return resultBitmap
    }

    data class EmployeeRecognition(
        val id: String,
        val title: String,
        val distance: Float,
        val employeeId: String = ""
    ) {
        var extra: Any? = null
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        startCamera()
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        stopCamera()
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {}

    fun cleanup() {
        stopCamera()
        try {
            detector.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error closing detector", e)
        }
        try {
            tfLite?.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error closing tfLite", e)
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        cleanup()
    }
}