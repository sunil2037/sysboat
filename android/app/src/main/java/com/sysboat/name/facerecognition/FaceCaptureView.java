package com.sysboat.name.facerecognition;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.pm.PackageManager;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.YuvImage;
import android.media.Image;
import android.os.Handler;
import android.os.Looper;
import android.util.AttributeSet;
import android.util.Log;
import android.util.Size;
import android.view.LayoutInflater;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.OptIn;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ExperimentalGetImage;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LifecycleOwner;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.face.Face;
import com.google.mlkit.vision.face.FaceDetection;
import com.google.mlkit.vision.face.FaceDetector;
import com.google.mlkit.vision.face.FaceDetectorOptions;
import com.sysboat.R;

import org.tensorflow.lite.Interpreter;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public class FaceCaptureView extends FrameLayout {

    private static final String TAG = "FaceCaptureView";

    // UI Elements
    private PreviewView previewView;
    private ImageView capturedFaceImage;
    private TextView statusText;
    private TextView instructionText;

    // Camera
    private ProcessCameraProvider cameraProvider;
    private ListenableFuture<ProcessCameraProvider> cameraProviderFuture;
    private final Executor cameraExecutor = Executors.newSingleThreadExecutor();
    private final Executor analysisExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean isFrontCamera = true;  // NEW: Track camera facing

    // Face Detection & Recognition
    private FaceDetector detector;
    private Interpreter tfLite;
    private final int inputSize = 112;
    private final float IMAGE_MEAN = 128.0f;
    private final float IMAGE_STD = 128.0f;
    private final int OUTPUT_SIZE = 192;

    // Capture State
    private boolean isCapturing = false;
    private boolean autoCapture = false;
    private int captureDelayMs = 500;
    private long lastCaptureTime = 0;
    private Bitmap lastCapturedFace = null;
    private Bitmap lastDetectedFace = null;  // NEW: Store last detected face
    private float[] lastEmbedding = null;

    private CameraSelector cameraSelector;  // CHANGED: Remove initialization here

    public FaceCaptureView(@NonNull Context context) {
        super(context);
        init(context);
    }

    public FaceCaptureView(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init(context);
    }

    private void init(Context context) {
        Log.d(TAG, "init: Initializing FaceCaptureView");

        // Inflate layout
        LayoutInflater.from(context).inflate(R.layout.face_capture_view, this, true);

        // Get UI references
        previewView = findViewById(R.id.capturePreviewView);
        capturedFaceImage = findViewById(R.id.capturedFaceImage);
        statusText = findViewById(R.id.captureStatusText);
        instructionText = findViewById(R.id.captureInstructionText);

        // Initialize camera selector with front camera
        cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
                .build();

        setupDetector();
        loadModel();
        startCamera();

        updateStatus("Ready to capture", "#00FF00");
    }

    private void setupDetector() {
        Log.d(TAG, "setupDetector: Setting up ML Kit Face Detector");
        FaceDetectorOptions opts = new FaceDetectorOptions.Builder()
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
                .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
                .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
                .build();
        detector = FaceDetection.getClient(opts);
    }

    private void loadModel() {
        Log.d(TAG, "loadModel: Loading TFLite model");
        try {
            tfLite = new Interpreter(loadModelFile(getContext(), "mobile_face_net.tflite"));
            Log.d(TAG, "Model loaded successfully");
        } catch (IOException e) {
            Log.e(TAG, "Error loading TFLite model", e);
        }
    }

    private void startCamera() {
        Log.d(TAG, "startCamera: Starting camera");

        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "Camera permission not granted");
            updateStatus("Camera permission required", "#FF0000");
            return;
        }

        cameraProviderFuture = ProcessCameraProvider.getInstance(getContext());
        cameraProviderFuture.addListener(() -> {
            try {
                cameraProvider = cameraProviderFuture.get();
                bindCameraUseCases();
            } catch (ExecutionException | InterruptedException e) {
                Log.e(TAG, "Camera init failed", e);
                updateStatus("Camera initialization failed", "#FF0000");
            }
        }, ContextCompat.getMainExecutor(getContext()));
    }

    private void bindCameraUseCases() {
        Log.d(TAG, "bindCameraUseCases");

        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        ImageAnalysis analysis = new ImageAnalysis.Builder()
                .setTargetResolution(new Size(640, 480))
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        analysis.setAnalyzer(analysisExecutor, this::processImageProxy);

        Activity activity = getActivityFromContext(getContext());
        if (activity == null) {
            Log.e(TAG, "No Activity found!");
            return;
        }

        cameraProvider.unbindAll();
        cameraProvider.bindToLifecycle((LifecycleOwner) activity, cameraSelector, preview, analysis);
        Log.d(TAG, "Camera bound successfully");
    }

    @OptIn(markerClass = ExperimentalGetImage.class)
    private void processImageProxy(@NonNull ImageProxy imageProxy) {
        if (!isCapturing) {
            imageProxy.close();
            return;
        }

        try {
            Image mediaImage = imageProxy.getImage();
            if (mediaImage == null) {
                imageProxy.close();
                return;
            }

            InputImage inputImage = InputImage.fromMediaImage(
                    mediaImage,
                    imageProxy.getImageInfo().getRotationDegrees()
            );

            detector.process(inputImage)
                    .addOnSuccessListener(analysisExecutor, faces -> {
                        if (!faces.isEmpty()) {
                            Log.d(TAG, "processImageProxy: Detected " + faces.size() + " face(s)");
                            Face face = faces.get(0);

                            // Check face quality
                            boolean goodQuality = checkFaceQuality(face);
                            Log.d(TAG, "processImageProxy: Face quality = " + goodQuality);

                            if (goodQuality) {
                                Bitmap bitmap = toBitmap(mediaImage);
                                Bitmap rotated = rotateBitmap(
                                        bitmap,
                                        imageProxy.getImageInfo().getRotationDegrees(),
                                        isFrontCamera  // Flip only for front camera
                                );

                                RectF box = new RectF(face.getBoundingBox());
                                Bitmap cropped = cropFace(rotated, box);

                                if (cropped != null) {
                                    Log.d(TAG, "processImageProxy: Face cropped successfully, size=" +
                                            cropped.getWidth() + "x" + cropped.getHeight());

                                    // Store for manual capture
                                    lastDetectedFace = cropped.copy(Bitmap.Config.ARGB_8888, true);
                                    Log.d(TAG, "processImageProxy: lastDetectedFace stored");

                                    updateLivePreview(cropped);

                                    // Auto-capture if enabled and enough time has passed
                                    if (autoCapture) {
                                        long currentTime = System.currentTimeMillis();
                                        if (currentTime - lastCaptureTime > captureDelayMs) {
                                            lastCaptureTime = currentTime;
                                            Log.d(TAG, "processImageProxy: Auto-capturing...");
                                            captureFaceInternal(cropped);
                                        }
                                    }
                                } else {
                                    Log.w(TAG, "processImageProxy: Failed to crop face");
                                }

                                updateStatus("Face detected - Good quality ✓", "#00FF00");
                            } else {
                                Log.d(TAG, "processImageProxy: Poor face quality");
                                updateStatus("Face detected - Align face properly", "#FFCC00");
                            }
                        } else {
                            Log.v(TAG, "processImageProxy: No faces detected");
                            updateStatus("No face detected", "#FF6600");
                        }
                    })
                    .addOnFailureListener(analysisExecutor, e -> {
                        Log.e(TAG, "Face detection failed", e);
                    })
                    .addOnCompleteListener(analysisExecutor, task -> imageProxy.close());

        } catch (Exception e) {
            Log.e(TAG, "Error processing image", e);
            imageProxy.close();
        }
    }

    private boolean checkFaceQuality(Face face) {
        // Check if face is roughly frontal
        Float headEulerAngleY = face.getHeadEulerAngleY(); // Yaw
        Float headEulerAngleZ = face.getHeadEulerAngleZ(); // Roll

        if (headEulerAngleY != null && Math.abs(headEulerAngleY) > 15) {
            return false; // Face too rotated left/right
        }

        if (headEulerAngleZ != null && Math.abs(headEulerAngleZ) > 15) {
            return false; // Face too tilted
        }

        // Check if face is large enough
        Rect bounds = face.getBoundingBox();
        if (bounds.width() < 150 || bounds.height() < 150) {
            return false; // Face too small
        }

        return true;
    }

    private void updateLivePreview(Bitmap faceBitmap) {
        mainHandler.post(() -> {
            if (capturedFaceImage != null) {
                capturedFaceImage.setImageBitmap(faceBitmap);
            }
        });
    }

    private void updateStatus(String message, String colorHex) {
        mainHandler.post(() -> {
            if (statusText != null) {
                statusText.setText(message);
                try {
                    statusText.setTextColor(android.graphics.Color.parseColor(colorHex));
                } catch (Exception e) {
                    // Fallback to white if color parsing fails
                }
            }
        });
    }

    // Public methods for React Native
    public void setAutoCapture(boolean auto) {
        Log.d(TAG, "setAutoCapture: " + auto);
        this.autoCapture = auto;
    }

    public void setCaptureDelay(int delayMs) {
        Log.d(TAG, "setCaptureDelay: " + delayMs);
        this.captureDelayMs = delayMs;
    }

    public void startCapture() {
        Log.d(TAG, "startCapture");
        isCapturing = true;
        updateStatus("Capturing... Look at camera", "#00FF00");
        mainHandler.post(() -> {
            if (instructionText != null) {
                instructionText.setText("Position your face in the center");
            }
        });
    }

    public void stopCapture() {
        Log.d(TAG, "stopCapture");
        isCapturing = false;
        updateStatus("Capture stopped", "#FFCC00");
    }

    public void switchCamera() {
        Log.d(TAG, "switchCamera: Switching from " + (isFrontCamera ? "front" : "back") + " to " + (isFrontCamera ? "back" : "front"));

        isFrontCamera = !isFrontCamera;

        // Update camera selector
        cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(isFrontCamera ? CameraSelector.LENS_FACING_FRONT : CameraSelector.LENS_FACING_BACK)
                .build();

        // Rebind camera
        if (cameraProvider != null) {
            bindCameraUseCases();
            updateStatus("Camera switched to " + (isFrontCamera ? "front" : "back"), "#00FF00");
        } else {
            Log.w(TAG, "Camera provider is null, cannot switch");
        }
    }

    public void captureFace() {
        Log.d(TAG, "captureFace: Manual capture triggered");

        if (lastDetectedFace != null) {
            Log.d(TAG, "captureFace: Processing last detected face");
            captureFaceInternal(lastDetectedFace);
        } else {
            Log.w(TAG, "No face detected yet - start capture first");
            updateStatus("No face detected - start capture first", "#FF6600");
        }
    }

    private void captureFaceInternal(Bitmap faceBitmap) {
        Log.d(TAG, "captureFaceInternal: Processing face");

        lastCapturedFace = faceBitmap.copy(Bitmap.Config.ARGB_8888, true);

        // Scale to model input size
        Bitmap scaled = Bitmap.createScaledBitmap(faceBitmap, inputSize, inputSize, true);

        // Generate embedding
        float[] embedding = generateEmbedding(scaled);
        lastEmbedding = embedding;

        // Emit to React Native
        emitFaceCaptured(embedding, faceBitmap);

        updateStatus("Face captured successfully! ✓", "#00FF00");
    }

    private float[] generateEmbedding(Bitmap bitmap) {
        Log.d(TAG, "generateEmbedding: Starting TFLite inference");

        ByteBuffer imgData = ByteBuffer.allocateDirect(inputSize * inputSize * 3 * 4);
        imgData.order(ByteOrder.nativeOrder());
        int[] intValues = new int[inputSize * inputSize];
        bitmap.getPixels(intValues, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());

        for (int val : intValues) {
            imgData.putFloat((((val >> 16) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
            imgData.putFloat((((val >> 8) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
            imgData.putFloat(((val & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
        }

        Object[] inputArray = {imgData};
        Map<Integer, Object> outputMap = new HashMap<>();
        float[][] embeddings = new float[1][OUTPUT_SIZE];
        outputMap.put(0, embeddings);

        tfLite.runForMultipleInputsOutputs(inputArray, outputMap);

        Log.d(TAG, "Embedding generated: length=" + embeddings[0].length);
        return embeddings[0];
    }

    private void emitFaceCaptured(float[] embedding, Bitmap faceBitmap) {
        Log.d(TAG, "emitFaceCaptured: Sending to React Native");

        ReactContext reactContext = (ReactContext) getContext();
        if (reactContext == null) {
            Log.w(TAG, "ReactContext is null");
            return;
        }

        WritableMap map = Arguments.createMap();

        // Add embedding array
        WritableArray embArray = Arguments.createArray();
        for (float f : embedding) {
            embArray.pushDouble(f);
        }
        map.putArray("embedding", embArray);

        // Add face bitmap info
        map.putInt("faceWidth", faceBitmap.getWidth());
        map.putInt("faceHeight", faceBitmap.getHeight());
        map.putString("timestamp", String.valueOf(System.currentTimeMillis()));
        map.putBoolean("success", true);

        // Convert preview (face) bitmap to Base64
        try {
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            faceBitmap.compress(Bitmap.CompressFormat.JPEG, 90, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream.toByteArray();
            String base64Image = android.util.Base64.encodeToString(byteArray, android.util.Base64.NO_WRAP);
            map.putString("previewImage", "data:image/jpeg;base64," + base64Image);
            Log.d(TAG, "emitFaceCaptured: Added preview image Base64, size=" + base64Image.length());
        } catch (Exception e) {
            Log.e(TAG, "emitFaceCaptured: Failed to encode preview image", e);
            map.putString("previewImage", null);
        }

        // Emit event to React Native
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onFaceCaptured", map);
    }


    // Utility methods
    private static Activity getActivityFromContext(Context context) {
        while (context instanceof ContextWrapper) {
            if (context instanceof Activity) return (Activity) context;
            context = ((ContextWrapper) context).getBaseContext();
        }
        return null;
    }

    private static Bitmap rotateBitmap(Bitmap bitmap, int rotationDegrees, boolean flipX) {
        Matrix matrix = new Matrix();
        matrix.postRotate(rotationDegrees);
        if (flipX) matrix.postScale(-1f, 1f);
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
    }

    private Bitmap cropFace(Bitmap source, RectF boundingBox) {
        int x = (int) Math.max(boundingBox.left, 0);
        int y = (int) Math.max(boundingBox.top, 0);
        int width = (int) boundingBox.width();
        int height = (int) boundingBox.height();

        if (x + width > source.getWidth()) {
            width = source.getWidth() - x;
        }
        if (y + height > source.getHeight()) {
            height = source.getHeight() - y;
        }

        if (width <= 0 || height <= 0) {
            return null;
        }

        return Bitmap.createBitmap(source, x, y, width, height);
    }

    private static Bitmap toBitmap(Image image) {
        byte[] nv21 = YUV420toNV21(image);
        YuvImage yuvImage = new YuvImage(nv21, ImageFormat.NV21, image.getWidth(), image.getHeight(), null);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        yuvImage.compressToJpeg(new Rect(0, 0, image.getWidth(), image.getHeight()), 75, out);
        byte[] bytes = out.toByteArray();
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
    }

    private static byte[] YUV420toNV21(Image image) {
        int width = image.getWidth();
        int height = image.getHeight();

        Image.Plane yPlane = image.getPlanes()[0];
        Image.Plane uPlane = image.getPlanes()[1];
        Image.Plane vPlane = image.getPlanes()[2];

        ByteBuffer yBuffer = yPlane.getBuffer();
        ByteBuffer uBuffer = uPlane.getBuffer();
        ByteBuffer vBuffer = vPlane.getBuffer();

        int position = 0;
        byte[] nv21 = new byte[width * height * 3 / 2];

        int yRowStride = yPlane.getRowStride();
        int yPixelStride = yPlane.getPixelStride();
        byte[] yRow = new byte[yRowStride];

        // Copy Y plane
        for (int row = 0; row < height; row++) {
            yBuffer.position(row * yRowStride);
            yBuffer.get(yRow, 0, Math.min(yRowStride, yBuffer.remaining()));
            for (int col = 0; col < width; col++) {
                nv21[position++] = yRow[col * yPixelStride];
            }
        }

        int uvRowStride = uPlane.getRowStride();
        int uvPixelStride = uPlane.getPixelStride();
        byte[] uRow = new byte[uvRowStride];
        byte[] vRow = new byte[vPlane.getRowStride()];

        int uvHeight = height / 2;
        int uvWidth = width / 2;

        // Copy interleaved VU for NV21 format
        for (int row = 0; row < uvHeight; row++) {
            int rowStartU = row * uvRowStride;
            int rowStartV = row * vPlane.getRowStride();
            uBuffer.position(rowStartU);
            vBuffer.position(rowStartV);
            uBuffer.get(uRow, 0, Math.min(uvRowStride, uBuffer.remaining()));
            vBuffer.get(vRow, 0, Math.min(vPlane.getRowStride(), vBuffer.remaining()));

            for (int col = 0; col < uvWidth; col++) {
                nv21[position++] = vRow[col * uvPixelStride];
                nv21[position++] = uRow[col * uvPixelStride];
            }
        }

        return nv21;
    }

    private MappedByteBuffer loadModelFile(Context context, String modelFile) throws IOException {
        AssetFileDescriptor fd = context.getAssets().openFd(modelFile);
        FileInputStream inputStream = new FileInputStream(fd.getFileDescriptor());
        FileChannel fileChannel = inputStream.getChannel();
        long startOffset = fd.getStartOffset();
        long declaredLength = fd.getDeclaredLength();
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
    }
}