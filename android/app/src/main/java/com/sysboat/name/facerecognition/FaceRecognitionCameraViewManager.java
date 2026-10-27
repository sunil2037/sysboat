package com.sysboat.name.facerecognition;

import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

import java.util.HashMap;
import java.util.Map;

public class FaceRecognitionCameraViewManager extends SimpleViewManager<FaceRecognitionCameraView> {

    public static final String REACT_CLASS = "FaceRecognitionCameraViews";
    private static final String TAG = "FaceRecognitionManager";

    // command ids
    private static final int CMD_ADD_CURRENT = 1;
    private static final int CMD_ADD_EMBEDDING = 2;
    private static final int CMD_SAVE = 3;
    private static final int CMD_LOAD = 4;
    private static final int CMD_CLEAR = 5;
    private static final int CMD_FREEZE_CAMERA = 6;
    private static final int CMD_UNFREEZE_CAMERA = 7;


    @NonNull
    @Override
    public String getName() {
        Log.d(TAG, "getName: " + REACT_CLASS);
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected FaceRecognitionCameraView createViewInstance(@NonNull ThemedReactContext reactContext) {
        Log.d(TAG, "createViewInstance");
        return new FaceRecognitionCameraView(reactContext);
    }

    @Nullable
    @Override
    public Map<String, Integer> getCommandsMap() {
        Log.d(TAG, "getCommandsMap");
        Map<String, Integer> map = new HashMap<>();
        map.put("addCurrent", CMD_ADD_CURRENT);
        map.put("addEmbedding", CMD_ADD_EMBEDDING);
        map.put("save", CMD_SAVE);
        map.put("load", CMD_LOAD);
        map.put("clear", CMD_CLEAR);
        map.put("freezeCamera", CMD_FREEZE_CAMERA);     // NEW
        map.put("unfreezeCamera", CMD_UNFREEZE_CAMERA); // NEW
        return map;
    }

    // Integer-based receiveCommand method
    @Override
    public void receiveCommand(@NonNull FaceRecognitionCameraView root, int commandId, @Nullable ReadableArray args) {
        Log.d(TAG, "receiveCommand (int): " + commandId);
        handleCommand(root, commandId, args);
    }

    // String-based receiveCommand method for newer architectures
    @Override
    public void receiveCommand(@NonNull FaceRecognitionCameraView root, String commandId, @Nullable ReadableArray args) {
        Log.d(TAG, "receiveCommand (String): " + commandId);

        int commandIdInt = -1;
        switch (commandId) {
            case "addCurrent":
                commandIdInt = CMD_ADD_CURRENT;
                break;
            case "addEmbedding":
                commandIdInt = CMD_ADD_EMBEDDING;
                break;
            case "save":
                commandIdInt = CMD_SAVE;
                break;
            case "load":
                commandIdInt = CMD_LOAD;
                break;
            case "clear":
                commandIdInt = CMD_CLEAR;
                break;
            case "freezeCamera":       // NEW
                commandIdInt = CMD_FREEZE_CAMERA;
                break;
            case "unfreezeCamera":     // NEW
                commandIdInt = CMD_UNFREEZE_CAMERA;
                break;
        }

        if (commandIdInt != -1) {
            handleCommand(root, commandIdInt, args);
        } else {
            Log.w(TAG, "Unknown command: " + commandId);
        }
    }

    // Common method to handle both command types
    private void handleCommand(@NonNull FaceRecognitionCameraView root, int commandId, @Nullable ReadableArray args) {
        Log.d(TAG, "handleCommand: " + commandId + " with args: " + (args != null ? args.size() : 0));

        switch (commandId) {
            case CMD_ADD_CURRENT:
                if (args != null && args.size() > 0) {
                    String name = args.getString(0);
                    Log.d(TAG, "CMD_ADD_CURRENT: " + name);
                    root.addCurrentEmbeddingAs(name);
                }
                break;

            case CMD_ADD_EMBEDDING:
                if (args != null && args.size() > 1) {
                    String name = args.getString(0);
                    ReadableArray arr = args.getArray(1);
                    if (arr != null) {
                        float[] emb = new float[arr.size()];
                        for (int i = 0; i < arr.size(); i++) {
                            emb[i] = (float) arr.getDouble(i);
                        }
                        Log.d(TAG, "CMD_ADD_EMBEDDING: " + name + " with " + emb.length + " embeddings");
                        root.addEmbeddingFromJS(name, emb);
                    }
                }
                break;

            case CMD_SAVE:
                Log.d(TAG, "CMD_SAVE");
                root.saveRecognitionsNative();
                break;

            case CMD_LOAD:
                Log.d(TAG, "CMD_LOAD");
                root.loadRecognitionsNative();
                break;

            case CMD_CLEAR:
                Log.d(TAG, "CMD_CLEAR");
                root.clearRecognitionsNative();
                break;

            case CMD_FREEZE_CAMERA:  // NEW
                Log.d(TAG, "CMD_FREEZE_CAMERA");
                root.freezeCamera(true);
                break;

            case CMD_UNFREEZE_CAMERA: // NEW
                Log.d(TAG, "CMD_UNFREEZE_CAMERA");
                root.freezeCamera(false);
                break;

            default:
                Log.w(TAG, "Unknown command ID: " + commandId);
        }
    }
}