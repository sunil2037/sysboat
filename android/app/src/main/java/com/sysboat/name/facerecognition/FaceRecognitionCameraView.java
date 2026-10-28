package com.sysboat.name.facerecognition;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.view.View;
import android.view.ViewOutlineProvider;
import android.graphics.Outline;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.util.Arrays;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.YuvImage;
import android.media.Image;
import android.util.AttributeSet;
import android.util.Log;
import android.util.Pair;
import android.util.Size;
import android.view.LayoutInflater;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import com.sysboat.R;

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
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.face.Face;
import com.google.mlkit.vision.face.FaceDetection;
import com.google.mlkit.vision.face.FaceDetector;
import com.google.mlkit.vision.face.FaceDetectorOptions;
import com.google.mlkit.vision.face.FaceLandmark;

import org.tensorflow.lite.Interpreter;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import android.content.ContentValues;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class FaceRecognitionCameraView extends FrameLayout {

    private static final String TAG = "FaceRecognitionCamera";

    private float[] lastEmbedding = null;
    private Bitmap lastFaceBitmap = null;
    private final Executor cameraExecutor = Executors.newSingleThreadExecutor();
    private final Executor recognitionExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean isCameraFrozen = false;
    private int analyzedFrameCount = 0;
    // Camera
    private PreviewView previewView;
    private ProcessCameraProvider cameraProvider;
    private ListenableFuture<ProcessCameraProvider> cameraProviderFuture;
    private CameraSelector cameraSelector = new CameraSelector.Builder()
            .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
            .build();

    // Preview UI elements
    private ImageView facePreviewImage;
    private TextView previewStatus;
    private TextView previewLabel;

    // ML Kit + TFLite
    private FaceDetector detector;
    private Interpreter tfLite;
    private int inputSize = 112;
    private float IMAGE_MEAN = 128.0f;
    private float IMAGE_STD = 128.0f;
    private int OUTPUT_SIZE = 192;

    private float THRESHOLD = 1.0f;

    private boolean isModelQuantized = false;
    private float[][] embeddings;
    private HashMap<String, SimilarityClassifier.Recognition> registered = new HashMap<>();

    public FaceRecognitionCameraView(@NonNull Context context) {
        super(context);
        Log.d(TAG, "FaceRecognitionCameraView: Constructor 1");
        init(context);
    }

    public FaceRecognitionCameraView(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        Log.d(TAG, "FaceRecognitionCameraView: Constructor 2");
        init(context);
    }

    private void init(Context context) {
        Log.d(TAG, "init: Initializing view");

        // Load threshold from SharedPreferences
        SharedPreferences sharedPref = context.getSharedPreferences("face_recognition", Context.MODE_PRIVATE);
        THRESHOLD = sharedPref.getFloat("threshold", 1.0f);
        Log.d(TAG, "init: Loaded threshold = " + THRESHOLD);

        // Inflate the layout
        LayoutInflater.from(context).inflate(R.layout.face_recognition_camera_view, this, true);

        // --- Rounded Camera Preview Fix ---
        FrameLayout cameraContainer = findViewById(R.id.cameraContainer);
        if (cameraContainer != null) {
            cameraContainer.setClipToOutline(true);
            cameraContainer.setOutlineProvider(new ViewOutlineProvider() {
                @Override
                public void getOutline(View view, Outline outline) {
                    float radius = 40f; // match radius in rounded_shape.xml (e.g. 40dp)
                    outline.setRoundRect(0, 0, view.getWidth(), view.getHeight(), radius);
                }
            });
        }
        // ----------------------------------

        // Get references to UI elements
        previewView = findViewById(R.id.previewView);
        facePreviewImage = findViewById(R.id.facePreviewImage);
        previewStatus = findViewById(R.id.previewStatus);
        previewLabel = findViewById(R.id.previewLabel);

        setupDetector();
        loadModel();
        loadRecognitionsNative();
    }

    @Override
    public void requestLayout() {
        super.requestLayout();
        post(() -> {
            if (getWidth() > 0 && getHeight() > 0) {
                measure(
                    MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY)
                );
                layout(getLeft(), getTop(), getRight(), getBottom());
            }
        });
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        post(() -> {
            if (isAttachedToWindow()) {
                measure(
                    MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY)
                );
                layout(getLeft(), getTop(), getRight(), getBottom());
                startCamera();
            }
        });
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        analyzedFrameCount = 0;
        if (cameraProvider != null) {
            cameraProvider.unbindAll();
        }
    }


    private void setupDetector() {
        Log.d(TAG, "setupDetector: Setting up ML Kit Face Detector with landmark detection");
        FaceDetectorOptions opts = new FaceDetectorOptions.Builder()
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL) // Enable landmark detection
                .build();
        detector = FaceDetection.getClient(opts);
    }

    private boolean hasBothEyesDetected(Face face) {
        boolean hasLeftEye = face.getLandmark(FaceLandmark.LEFT_EYE) != null;
        boolean hasRightEye = face.getLandmark(FaceLandmark.RIGHT_EYE) != null;

        Log.v(TAG, "hasBothEyesDetected: Left eye = " + hasLeftEye + ", Right eye = " + hasRightEye);

        return hasLeftEye && hasRightEye;
    }
    private void loadModel() {
        Log.d(TAG, "loadModel: Loading TFLite model");
        try {
            tfLite = new Interpreter(loadModelFile(getContext(), "mobile_face_net.tflite"));
        } catch (IOException e) {
            Log.e(TAG, "Error loading TFLite model", e);
        }
    }

    public interface SimilarityClassifier {
        class Recognition {
            private final String id;
            private final String title;
            private final Float distance;
            private final RectF location;
            private final Bitmap crop;
            private final float[] embeddings;

            public Recognition(String id, String title, Float distance, RectF location, Bitmap crop, float[] embeddings) {
                this.id = id;
                this.title = title;
                this.distance = distance;
                this.location = location;
                this.crop = crop;
                this.embeddings = embeddings;
            }

            public String getId() { return id; }
            public String getTitle() { return title; }
            public Float getDistance() { return distance; }
            public RectF getLocation() { return location; }
            public Bitmap getCrop() { return crop; }
            public float[] getEmbeddings() { return embeddings; }
        }
    }

    // -------------------- CAMERA --------------------
    private void startCamera() {
        if (!isAttachedToWindow()) return;
        if (getWidth() <= 0 || getHeight() <= 0) {
            post(() -> {
                if (isAttachedToWindow()) {
                    startCamera();
                }
            });
            return;
        }

        Log.d(TAG, "startCamera: Starting camera");
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "startCamera: Camera permission not granted");
            if (getContext() instanceof Activity) {
                ((Activity) getContext()).requestPermissions(new String[]{Manifest.permission.CAMERA}, 101);
            }
            return;
        }

        cameraProviderFuture = ProcessCameraProvider.getInstance(getContext());
        cameraProviderFuture.addListener(() -> {
            try {
                if (!isAttachedToWindow()) return;
                cameraProvider = cameraProviderFuture.get();
                bindCameraUseCases();
            } catch (ExecutionException | InterruptedException e) {
                Log.e(TAG, "Camera init failed", e);
            }
        }, ContextCompat.getMainExecutor(getContext()));
    }

    private void bindCameraUseCases() {
        Log.d(TAG, "bindCameraUseCases: Binding camera use cases");
        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        ImageAnalysis analysis = new ImageAnalysis.Builder()
                .setTargetResolution(new Size(640, 480))
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        analysis.setAnalyzer(cameraExecutor, this::processImageProxy);

        Activity activity = getActivityFromContext(getContext());
        if (activity == null) {
            Log.e(TAG, "No Activity found to bind camera lifecycle!");
            return;
        }

        cameraProvider.unbindAll();
        cameraProvider.bindToLifecycle((LifecycleOwner) activity, cameraSelector, preview, analysis);
        Log.d(TAG, "bindCameraUseCases: Camera is bound");
    }

    private static Activity getActivityFromContext(Context context) {
        Log.v(TAG, "getActivityFromContext: searching for activity");
        while (context instanceof ContextWrapper) {
            if (context instanceof Activity) return (Activity) context;
            context = ((ContextWrapper) context).getBaseContext();
        }
        return null;
    }

    public void freezeCamera(boolean freeze) {
        Log.d(TAG, "freezeCamera: " + freeze);
        isCameraFrozen = freeze;

        if (freeze) {
            Log.d(TAG, "🔒 Camera recognition FROZEN");
            updatePreview(null, false);
            mainHandler.post(() -> {
                if (previewStatus != null) {
                    previewStatus.setText("Camera Frozen");
                    previewStatus.setTextColor(Color.parseColor("#FF6600"));
                }
            });
        } else {
            Log.d(TAG, "🔓 Camera recognition UNFROZEN");
            mainHandler.post(() -> {
                if (previewStatus != null) {
                    previewStatus.setText("Camera Active");
                    previewStatus.setTextColor(Color.parseColor("#00FF00"));
                }
            });
        }
    }

    public boolean isCameraFrozen() {
        return isCameraFrozen;
    }
    private void updatePreviewWithMessage(String message, int color) {
        mainHandler.post(() -> {
            if (previewStatus == null) return;
            previewStatus.setText(message);
            previewStatus.setTextColor(color);
        });
    }

    // -------------------- IMAGE PROCESSING --------------------
    @OptIn(markerClass = ExperimentalGetImage.class)
    private void processImageProxy(@NonNull ImageProxy imageProxy) {
        if (analyzedFrameCount == 0) {
            analyzedFrameCount++;
            Context context = getContext();
            if (context instanceof ReactContext) {
                ((ReactContext) context).getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onCameraReady", Arguments.createMap());
            }
        }
        Log.v(TAG, "processImageProxy: New frame received");

        // CHECK IF CAMERA IS FROZEN
        if (isCameraFrozen) {
            Log.v(TAG, "processImageProxy: Camera is frozen, skipping frame");
            imageProxy.close();
            return;
        }

        try {
            Image mediaImage = imageProxy.getImage();
            if (mediaImage == null) {
                Log.w(TAG, "processImageProxy: MediaImage is null");
                imageProxy.close();
                return;
            }

            InputImage inputImage =
                    InputImage.fromMediaImage(mediaImage, imageProxy.getImageInfo().getRotationDegrees());

            detector.process(inputImage)
                    .addOnSuccessListener(recognitionExecutor, faces -> {
                        Log.v(TAG, "processImageProxy: Face detection success, " + faces.size() + " faces found.");

                        if (!faces.isEmpty()) {
                            Face face = faces.get(0);

                            // Check if both eyes are detected
                            if (!hasBothEyesDetected(face)) {
                                Log.d(TAG, "processImageProxy: Both eyes not detected, skipping recognition");
                                updatePreviewWithMessage("Position face properly", Color.parseColor("#FFA500"));
                                imageProxy.close();
                                return;
                            }

                            Log.d(TAG, "processImageProxy: Both eyes detected, proceeding with recognition");

                            Bitmap bitmap = toBitmap(mediaImage);
                            Bitmap rotated = rotateBitmap(bitmap, imageProxy.getImageInfo().getRotationDegrees(), true);

                            RectF box = new RectF(face.getBoundingBox());
                            Bitmap cropped = cropFace(rotated, box);

                            if (cropped != null) {
                                updatePreview(cropped, true);
                                Bitmap scaled = Bitmap.createScaledBitmap(cropped, inputSize, inputSize, true);
                                recognizeFace(scaled);
                            } else {
                                Log.w(TAG, "processImageProxy: Cropped bitmap is null, skipping face.");
                                updatePreview(null, false);
                            }
                        } else {
                            updatePreview(null, false);
                        }
                    })
                    .addOnFailureListener(recognitionExecutor, e -> {
                        Log.e(TAG, "Face detection failed", e);
                        updatePreview(null, false);
                    })
                    .addOnCompleteListener(recognitionExecutor, task -> imageProxy.close());
        } catch (Exception e) {
            Log.e(TAG, "processImageProxy error", e);
            imageProxy.close();
        }
    }

    // -------------------- PREVIEW UPDATE --------------------
    private void updatePreview(Bitmap faceBitmap, boolean faceDetected) {
        mainHandler.post(() -> {
            if (facePreviewImage == null || previewStatus == null) return;

            if (faceDetected && faceBitmap != null) {
                facePreviewImage.setImageBitmap(faceBitmap);
                previewStatus.setText("Face detected ✓");
                previewStatus.setTextColor(Color.parseColor("#00FF00"));
            } else {
                facePreviewImage.setImageResource(android.R.color.transparent);
                previewStatus.setText("No face detected");
                previewStatus.setTextColor(Color.parseColor("#FFCC00"));
            }
        });
    }

    private void updatePreviewWithName(String name, float distance) {
        mainHandler.post(() -> {
            if (previewStatus == null || previewLabel == null) return;

            if (name.equals("Unknown")) {
                previewLabel.setText("Face Preview");
                previewStatus.setText("Unknown face");
                previewStatus.setTextColor(Color.parseColor("#FF6600"));
            } else {
                previewLabel.setText(name);
                previewStatus.setText(String.format("Distance: %.3f", distance));
                previewStatus.setTextColor(Color.parseColor("#00FF00"));
            }
        });
    }

    private void saveFaceImageToGallery(Bitmap faceBitmap, String name) {
        if (faceBitmap == null) {
            Log.e(TAG, "❌ Cannot save image: faceBitmap is null");
            return;
        }

        try {
            // Create a bitmap with name label
            Bitmap labeledBitmap = Bitmap.createBitmap(
                    faceBitmap.getWidth(),
                    faceBitmap.getHeight() + 50, // Extra space for text
                    Bitmap.Config.ARGB_8888
            );

            Canvas canvas = new Canvas(labeledBitmap);
            canvas.drawColor(Color.BLACK);

            // Draw the face
            canvas.drawBitmap(faceBitmap, 0, 0, null);

            // Draw the name
            Paint paint = new Paint();
            paint.setColor(Color.WHITE);
            paint.setTextSize(30);
            paint.setAntiAlias(true);
            canvas.drawText(name, 10, faceBitmap.getHeight() + 35, paint);

            // Generate filename with timestamp
            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
            String fileName = "Face_" + name + "_" + timeStamp + ".jpg";

            // Save based on Android version
//            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
//                saveBitmapToGalleryQ(labeledBitmap, fileName, name);
//            } else {
//                saveBitmapToGalleryLegacy(labeledBitmap, fileName, name);
//            }

            Log.d(TAG, "✅ Face image saved to gallery: " + fileName);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error saving face image to gallery", e);
        }
    }

    @SuppressLint("WrongThread")
    private void saveBitmapToGalleryQ(Bitmap bitmap, String fileName, String name) {
        try {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/FaceRecognition");
            values.put(MediaStore.Images.Media.DESCRIPTION, "Face: " + name);

            Uri uri = getContext().getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);

            if (uri != null) {
                OutputStream outputStream = getContext().getContentResolver().openOutputStream(uri);
                if (outputStream != null) {
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 95, outputStream);
                    outputStream.close();
                    Log.d(TAG, "✅ Saved to: " + uri.toString());
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error in saveBitmapToGalleryQ", e);
        }
    }

    private void saveBitmapToGalleryLegacy(Bitmap bitmap, String fileName, String name) {
        try {
            File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
            File faceRecognitionDir = new File(picturesDir, "FaceRecognition");

            if (!faceRecognitionDir.exists()) {
                faceRecognitionDir.mkdirs();
            }

            File imageFile = new File(faceRecognitionDir, fileName);
            FileOutputStream outputStream = new FileOutputStream(imageFile);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 95, outputStream);
            outputStream.close();

            // Notify gallery
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DATA, imageFile.getAbsolutePath());
            values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            values.put(MediaStore.Images.Media.DESCRIPTION, "Face: " + name);
            getContext().getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);

            Log.d(TAG, "✅ Saved to: " + imageFile.getAbsolutePath());
        } catch (Exception e) {
            Log.e(TAG, "❌ Error in saveBitmapToGalleryLegacy", e);
        }
    }

    private void saveFaceWithEmbeddingInfo(String name, float[] embedding) {
        if (lastFaceBitmap == null) {
            Log.e(TAG, "❌ Cannot save: lastFaceBitmap is null");
            return;
        }

        try {
            // Create a larger bitmap with embedding info
            int width = 400;
            int height = 400 + 200; // Extra space for info
            Bitmap infoBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(infoBitmap);
            canvas.drawColor(Color.BLACK);

            // Draw the face (scaled to 400x400)
            Bitmap scaledFace = Bitmap.createScaledBitmap(lastFaceBitmap, 400, 400, true);
            canvas.drawBitmap(scaledFace, 0, 0, null);

            // Draw info text
            Paint paint = new Paint();
            paint.setColor(Color.WHITE);
            paint.setTextSize(18);
            paint.setAntiAlias(true);

            int textY = 420;
            canvas.drawText("Name: " + name, 10, textY, paint);
            textY += 25;
            canvas.drawText("Embedding Length: " + embedding.length, 10, textY, paint);
            textY += 25;
            canvas.drawText("First 3 values:", 10, textY, paint);
            textY += 25;
            canvas.drawText(String.format("  %.4f, %.4f, %.4f",
                    embedding[0], embedding[1], embedding[2]), 10, textY, paint);
            textY += 25;
            canvas.drawText("Timestamp: " + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss",
                    Locale.getDefault()).format(new Date()), 10, textY, paint);

            // Generate filename
            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
            String fileName = "Face_DEBUG_" + name + "_" + timeStamp + ".jpg";

            // Save to gallery
//            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
//                saveBitmapToGalleryQ(infoBitmap, fileName, name);
//            } else {
//                saveBitmapToGalleryLegacy(infoBitmap, fileName, name);
//            }

            Log.d(TAG, "✅ Debug face image saved: " + fileName);

            // Also emit to JS
            emitImageSavedToJS(name, fileName);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error saving face with embedding info", e);
        }
    }

    private void emitImageSavedToJS(String name, String fileName) {
        ReactContext reactContext = (ReactContext) getContext();
        if (reactContext == null) return;

        var map = Arguments.createMap();
        map.putString("name", name);
        map.putString("fileName", fileName);
        map.putString("message", "Face image saved to gallery");

        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onImageSaved", map);
    }

    private void recognizeFace(Bitmap bitmap) {
        Log.v(TAG, "recognizeFace: Starting TFLite inference");

        // Save the face bitmap for debugging and preview
        lastFaceBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true);

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
        embeddings = new float[1][OUTPUT_SIZE];
        outputMap.put(0, embeddings);
        tfLite.runForMultipleInputsOutputs(inputArray, outputMap);

        lastEmbedding = embeddings[0].clone();
        evaluateRecognition(lastEmbedding);
    }

    private void evaluateRecognition(float[] emb) {
        Log.d(TAG, "evaluateRecognition: Registered faces count: " + registered.size());

        if (isCameraFrozen) {
            Log.d(TAG, "evaluateRecognition: Camera is frozen, skipping recognition");
            return;
        }

        if (registered.size() == 0) {
            Log.d(TAG, "evaluateRecognition: No registered faces");
            updatePreviewWithName("Unknown", Float.MAX_VALUE);
            emitRecognitionToJS("Unknown", Float.MAX_VALUE, emb);
            return;
        }

        List<Pair<String, Float>> nearest = findNearest(emb);

        if (nearest.isEmpty() || nearest.get(0) == null) {
            Log.d(TAG, "evaluateRecognition: No matches found");
            updatePreviewWithName("Unknown", Float.MAX_VALUE);
            emitRecognitionToJS("Unknown", Float.MAX_VALUE, emb);
            return;
        }

        String matchedName = nearest.get(0).first;
        float distance = nearest.get(0).second;

        String secondBestName = nearest.size() > 1 && nearest.get(1) != null ? nearest.get(1).first : "None";
        float secondBestDistance = nearest.size() > 1 && nearest.get(1) != null ? nearest.get(1).second : Float.MAX_VALUE;

        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "RECOGNITION RESULT:");
        Log.d(TAG, "  Best Match: " + matchedName + " (distance: " + String.format("%.4f", distance) + ")");
        Log.d(TAG, "  Second Best: " + secondBestName + " (distance: " + String.format("%.4f", secondBestDistance) + ")");
        Log.d(TAG, "  Threshold: " + String.format("%.4f", THRESHOLD));
        Log.d(TAG, "  Status: " + (distance <= THRESHOLD ? "✓ ACCEPTED" : "✗ REJECTED (too far)"));
        Log.d(TAG, "═══════════════════════════════════════");

        if (distance > THRESHOLD) {
            Log.d(TAG, "evaluateRecognition: Distance exceeds threshold - Unknown");
            matchedName = "Unknown";
        }

        Log.d(TAG, "evaluateRecognition: Final match: " + matchedName + " with distance " + distance);
        updatePreviewWithName(matchedName, distance);
        emitRecognitionToJS(matchedName, distance, emb);
    }

    private List<Pair<String, Float>> findNearest(float[] emb) {
        List<Pair<String, Float>> neighbourList = new ArrayList<>();
        Pair<String, Float> ret = null;
        Pair<String, Float> prevRet = null;

        for (Map.Entry<String, SimilarityClassifier.Recognition> entry : registered.entrySet()) {
            final String name = entry.getKey();
            final float[] knownEmb = entry.getValue().getEmbeddings();

            float distance = 0;
            for (int i = 0; i < emb.length; i++) {
                float diff = emb[i] - knownEmb[i];
                distance += diff * diff;
            }
            distance = (float) Math.sqrt(distance);

            if (ret == null || distance < ret.second) {
                prevRet = ret;
                ret = new Pair<>(name, distance);
            }
        }

        if (prevRet == null) prevRet = ret;
        neighbourList.add(ret);
        neighbourList.add(prevRet);

        return neighbourList;
    }

    // -------------------- BRIDGE: EVENTS --------------------
    private void emitRecognitionToJS(String name, float distance, float[] embedding) {
        Log.d(TAG, "emitRecognitionToJS: Emitting 'onFaceRecognized' event for: " + name);
        ReactContext reactContext = (ReactContext) getContext();
        if (reactContext == null) {
            Log.w(TAG, "emitRecognitionToJS: ReactContext is null");
            return;
        }

        var map = Arguments.createMap();
        map.putString("name", name);
        map.putDouble("distance", distance);

        var arr = Arguments.createArray();
        for (float f : embedding) arr.pushDouble(f);
        map.putArray("embedding", arr);

        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onFaceRecognized", map);
    }

    // -------------------- BRIDGE: COMMANDS --------------------

    public void setThreshold(float threshold) {
        Log.d(TAG, "setThreshold: Setting threshold to " + threshold);
        this.THRESHOLD = threshold;

        SharedPreferences sharedPref = getContext().getSharedPreferences("face_recognition", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putFloat("threshold", threshold);
        editor.apply();
    }

    public float getThreshold() {
        return this.THRESHOLD;
    }

    public void addCurrentEmbeddingAs(String name) {
        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "addCurrentEmbeddingAs: ENROLLMENT STARTED");
        Log.d(TAG, "  Name: " + name);
        Log.d(TAG, "  lastEmbedding null? " + (lastEmbedding == null));

        if (lastEmbedding == null) {
            Log.e(TAG, "❌ ERROR: lastEmbedding is null, cannot save");
            return;
        }

//        if (lastFaceBitmap != null) {
//            saveFaceWithEmbeddingInfo(name, lastEmbedding);
//        } else {
//            Log.w(TAG, "⚠️ WARNING: lastFaceBitmap is null, cannot save image");
//        }

        Log.d(TAG, "  Embedding length: " + lastEmbedding.length);
        Log.d(TAG, "  First 5 values: " +
                String.format("%.4f, %.4f, %.4f, %.4f, %.4f",
                        lastEmbedding[0], lastEmbedding[1], lastEmbedding[2],
                        lastEmbedding[3], lastEmbedding[4]));

        float[] embeddingClone = lastEmbedding.clone();

        SimilarityClassifier.Recognition recognition =
                new SimilarityClassifier.Recognition("0", name, -1f, null, null, embeddingClone);

        registered.put(name, recognition);

        Log.d(TAG, "✓ Added to registered map. Total faces: " + registered.size());
        Log.d(TAG, "  Registered keys: " + registered.keySet());

        if (registered.containsKey(name)) {
            float[] savedEmb = registered.get(name).getEmbeddings();
            Log.d(TAG, "✓ Verification: Face saved successfully");
            Log.d(TAG, "  Saved embedding length: " + savedEmb.length);
            Log.d(TAG, "  Saved first 5 values: " +
                    String.format("%.4f, %.4f, %.4f, %.4f, %.4f",
                            savedEmb[0], savedEmb[1], savedEmb[2], savedEmb[3], savedEmb[4]));

            boolean match = Arrays.equals(lastEmbedding, savedEmb);
            Log.d(TAG, "  Embedding integrity check: " + (match ? "✓ PASS" : "✗ FAIL"));

            float selfDistance = 0;
            for (int i = 0; i < lastEmbedding.length; i++) {
                float diff = lastEmbedding[i] - savedEmb[i];
                selfDistance += diff * diff;
            }
            selfDistance = (float) Math.sqrt(selfDistance);
            Log.d(TAG, "  Self-distance check: " + String.format("%.6f", selfDistance) + " (should be ~0.0)");

            if (selfDistance > 0.001f) {
                Log.e(TAG, "❌ WARNING: Self-distance is too high! Embedding may be corrupted!");
            }
        } else {
            Log.e(TAG, "❌ ERROR: Face was NOT added to registered map!");
        }

        saveRecognitionsNative();
        Log.d(TAG, "═══════════════════════════════════════");
    }

    public void addEmbeddingFromJS(String name, float[] emb) {
        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "addEmbeddingFromJS: ENROLLMENT FROM JS STARTED");
        Log.d(TAG, "  Name: " + name);
        Log.d(TAG, "  Embedding null? " + (emb == null));

        if (emb == null) {
            Log.e(TAG, "❌ ERROR: Embedding from JS is null");
            return;
        }

//        if (lastFaceBitmap != null) {
//            saveFaceWithEmbeddingInfo(name, emb);
//        } else {
//            Log.w(TAG, "⚠️ WARNING: lastFaceBitmap is null, cannot save image");
//        }

        Log.d(TAG, "  Embedding length: " + emb.length);
        Log.d(TAG, "  Expected length: " + OUTPUT_SIZE);

        if (emb.length != OUTPUT_SIZE) {
            Log.e(TAG, "❌ ERROR: Embedding length mismatch! Expected " + OUTPUT_SIZE + ", got " + emb.length);
            return;
        }

        Log.d(TAG, "  First 5 values: " +
                String.format("%.4f, %.4f, %.4f, %.4f, %.4f",
                        emb[0], emb[1], emb[2], emb[3], emb[4]));

        float[] embeddingClone = emb.clone();

        SimilarityClassifier.Recognition recognition =
                new SimilarityClassifier.Recognition("0", name, -1f, null, null, embeddingClone);

        registered.put(name, recognition);

        Log.d(TAG, "✓ Added to registered map. Total faces: " + registered.size());
        Log.d(TAG, "  Registered keys: " + registered.keySet());

        if (registered.containsKey(name)) {
            float[] savedEmb = registered.get(name).getEmbeddings();
            Log.d(TAG, "✓ Verification: Face saved successfully");
            Log.d(TAG, "  Saved embedding length: " + savedEmb.length);

            boolean match = Arrays.equals(emb, savedEmb);
            Log.d(TAG, "  Embedding integrity check: " + (match ? "✓ PASS" : "✗ FAIL"));

            float selfDistance = 0;
            for (int i = 0; i < emb.length; i++) {
                float diff = emb[i] - savedEmb[i];
                selfDistance += diff * diff;
            }
            selfDistance = (float) Math.sqrt(selfDistance);
            Log.d(TAG, "  Self-distance check: " + String.format("%.6f", selfDistance) + " (should be ~0.0)");
        } else {
            Log.e(TAG, "❌ ERROR: Face was NOT added to registered map!");
        }

        saveRecognitionsNative();
        testEnrolledFace(name, emb);
        Log.d(TAG, "═══════════════════════════════════════");
    }

    private void testEnrolledFace(String name, float[] originalEmbedding) {
        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "TESTING ENROLLED FACE: " + name);

        if (!registered.containsKey(name)) {
            Log.e(TAG, "❌ Face not found in registered map!");
            return;
        }

        float[] savedEmbedding = registered.get(name).getEmbeddings();

        float distance = 0;
        for (int i = 0; i < originalEmbedding.length; i++) {
            float diff = originalEmbedding[i] - savedEmbedding[i];
            distance += diff * diff;
        }
        distance = (float) Math.sqrt(distance);

        Log.d(TAG, "  Distance to original: " + String.format("%.6f", distance));
        Log.d(TAG, "  Status: " + (distance < 0.001f ? "✓ IDENTICAL" : "❌ DIFFERENT!"));

        List<Pair<String, Float>> nearest = findNearest(originalEmbedding);
        if (!nearest.isEmpty() && nearest.get(0) != null) {
            String matchedName = nearest.get(0).first;
            float matchDistance = nearest.get(0).second;
            Log.d(TAG, "  Recognition result: " + matchedName + " (distance: " + String.format("%.6f", matchDistance) + ")");
            Log.d(TAG, "  Status: " + (matchedName.equals(name) ? "✓ CORRECT" : "❌ WRONG!"));
        }

        Log.d(TAG, "═══════════════════════════════════════");
    }

    public void saveRecognitionsNative() {
        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "saveRecognitionsNative: SAVING TO SHAREDPREFERENCES");
        Log.d(TAG, "  Total faces to save: " + registered.size());
        Log.d(TAG, "  Keys: " + registered.keySet());

        SharedPreferences prefs = getContext().getSharedPreferences("face_recognition", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        int savedCount = 0;
        for (String key : registered.keySet()) {
            SimilarityClassifier.Recognition rec = registered.get(key);
            if (rec == null) {
                Log.e(TAG, "❌ ERROR: Recognition object is null for key: " + key);
                continue;
            }

            float[] e = rec.getEmbeddings();
            if (e == null) {
                Log.e(TAG, "❌ ERROR: Embeddings are null for key: " + key);
                continue;
            }

            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < e.length; i++) {
                sb.append(e[i]);
                if (i < e.length - 1) sb.append(",");
            }

            String embeddingString = sb.toString();
            editor.putString(key, embeddingString);
            savedCount++;

            Log.d(TAG, "  ✓ Saved: " + key);
            Log.d(TAG, "    Embedding length: " + e.length);
            Log.d(TAG, "    String length: " + embeddingString.length());
            Log.d(TAG, "    First values: " + String.format("%.4f, %.4f, %.4f", e[0], e[1], e[2]));
        }

        boolean committed = editor.commit();
        Log.d(TAG, "  Commit result: " + (committed ? "✓ SUCCESS" : "✗ FAILED"));
        Log.d(TAG, "  Saved " + savedCount + " faces to SharedPreferences");

        verifySharedPreferences();
        Log.d(TAG, "═══════════════════════════════════════");
    }

    private void verifySharedPreferences() {
        SharedPreferences prefs = getContext().getSharedPreferences("face_recognition", Context.MODE_PRIVATE);
        Map<String, ?> all = prefs.getAll();

        Log.d(TAG, "  VERIFICATION: Reading from SharedPreferences");
        Log.d(TAG, "    Total entries: " + all.size());

        for (Map.Entry<String, ?> entry : all.entrySet()) {
            if (entry.getKey().equals("threshold")) continue;

            String value = entry.getValue().toString();
            String[] parts = value.split(",");
            Log.d(TAG, "    ✓ " + entry.getKey() + ": " + parts.length + " values");
        }
    }

    public void loadRecognitionsNative() {
        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "loadRecognitionsNative: LOADING FROM SHAREDPREFERENCES");

        registered.clear();
        Log.d(TAG, "  Cleared existing registered map");

        SharedPreferences prefs = getContext().getSharedPreferences("face_recognition", Context.MODE_PRIVATE);
        Map<String, ?> all = prefs.getAll();

        Log.d(TAG, "  Total entries in SharedPreferences: " + all.size());

        int loadedCount = 0;
        for (Map.Entry<String, ?> entry : all.entrySet()) {
            String key = entry.getKey();

            if (key.equals("threshold")) {
                Log.d(TAG, "  Skipping threshold entry");
                continue;
            }

            String value = entry.getValue().toString();
            String[] parts = value.split(",");

            Log.d(TAG, "  Loading: " + key);
            Log.d(TAG, "    Parts count: " + parts.length);
            Log.d(TAG, "    Expected: " + OUTPUT_SIZE);

            if (parts.length < OUTPUT_SIZE) {
                Log.e(TAG, "❌ ERROR: Incomplete embedding for " + key + ". Got " + parts.length + ", expected " + OUTPUT_SIZE);
                continue;
            }

            float[] emb = new float[OUTPUT_SIZE];
            boolean parseError = false;

            for (int i = 0; i < OUTPUT_SIZE && i < parts.length; i++) {
                try {
                    emb[i] = Float.parseFloat(parts[i]);
                } catch (NumberFormatException e) {
                    Log.e(TAG, "❌ ERROR: Failed to parse float at index " + i + " for " + key);
                    parseError = true;
                    break;
                }
            }

            if (parseError) {
                Log.e(TAG, "❌ Skipping " + key + " due to parse errors");
                continue;
            }

            Log.d(TAG, "    First 5 values: " +
                    String.format("%.4f, %.4f, %.4f, %.4f, %.4f",
                            emb[0], emb[1], emb[2], emb[3], emb[4]));

            SimilarityClassifier.Recognition recognition =
                    new SimilarityClassifier.Recognition("0", key, -1f, null, null, emb);

            registered.put(key, recognition);
            loadedCount++;
            Log.d(TAG, "    ✓ Loaded successfully");
        }

        Log.d(TAG, "  Loaded " + loadedCount + " recognitions");
        Log.d(TAG, "  Registered keys: " + registered.keySet());
        Log.d(TAG, "═══════════════════════════════════════");
    }

    public void clearRecognitionsNative() {
        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "clearRecognitionsNative: CLEARING ALL RECOGNITIONS");
        Log.d(TAG, "  Before clear: " + registered.size() + " faces");

        registered.clear();

        SharedPreferences prefs = getContext().getSharedPreferences("face_recognition", Context.MODE_PRIVATE);
        float savedThreshold = prefs.getFloat("threshold", 1.0f);

        boolean cleared = prefs.edit().clear().putFloat("threshold", savedThreshold).commit();
        Log.d(TAG, "  Clear result: " + (cleared ? "✓ SUCCESS" : "✗ FAILED"));
        Log.d(TAG, "  After clear: " + registered.size() + " faces");
        Log.d(TAG, "  Preserved threshold: " + savedThreshold);
        Log.d(TAG, "═══════════════════════════════════════");
    }

    // -------------------- UTILS --------------------

    private static Bitmap rotateBitmap(Bitmap bitmap, int rotationDegrees, boolean flipX) {
        Log.v(TAG, "rotateBitmap");
        Matrix matrix = new Matrix();
        matrix.postRotate(rotationDegrees);
        if (flipX) matrix.postScale(-1f, 1f);
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
    }

    private Bitmap cropFace(Bitmap source, RectF boundingBox) {
        Log.v(TAG, "cropFace");
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
            Log.w(TAG, "Invalid face crop bounds, skipping crop.");
            return null;
        }

        return Bitmap.createBitmap(source, x, y, width, height);
    }

    private static Bitmap toBitmap(Image image) {
        Log.v(TAG, "toBitmap: Converting Image to Bitmap (slow)");
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

        int ySize = yBuffer.remaining();
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
                nv21[position++] = vRow[col * uvPixelStride]; // V
                nv21[position++] = uRow[col * uvPixelStride]; // U
            }
        }

        return nv21;
    }


    private MappedByteBuffer loadModelFile(Context context, String modelFile) throws IOException {
        Log.d(TAG, "loadModelFile: Loading model " + modelFile);
        AssetFileDescriptor fd = context.getAssets().openFd(modelFile);
        FileInputStream inputStream = new FileInputStream(fd.getFileDescriptor());
        FileChannel fileChannel = inputStream.getChannel();
        long startOffset = fd.getStartOffset();
        long declaredLength = fd.getDeclaredLength();
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
    }
}
