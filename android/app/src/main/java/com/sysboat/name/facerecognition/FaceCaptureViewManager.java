package com.sysboat.name.facerecognition;

import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.HashMap;
import java.util.Map;

public class FaceCaptureViewManager extends SimpleViewManager<FaceCaptureView> {

    public static final String REACT_CLASS = "FaceCaptureView";
    private static final String TAG = "FaceCaptureManager";

    // Command IDs
    private static final int CMD_CAPTURE_FACE = 1;
    private static final int CMD_START_CAPTURE = 2;
    private static final int CMD_STOP_CAPTURE = 3;
    private static final int CMD_SWITCH_CAMERA = 4;  // NEW

    @NonNull
    @Override
    public String getName() {
        Log.d(TAG, "getName: " + REACT_CLASS);
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected FaceCaptureView createViewInstance(@NonNull ThemedReactContext reactContext) {
        Log.d(TAG, "createViewInstance");
        return new FaceCaptureView(reactContext);
    }

    @Nullable
    @Override
    public Map<String, Integer> getCommandsMap() {
        Log.d(TAG, "getCommandsMap");
        Map<String, Integer> map = new HashMap<>();
        map.put("captureFace", CMD_CAPTURE_FACE);
        map.put("startCapture", CMD_START_CAPTURE);
        map.put("stopCapture", CMD_STOP_CAPTURE);
        map.put("switchCamera", CMD_SWITCH_CAMERA);  // NEW
        return map;
    }

    @ReactProp(name = "autoCapture")
    public void setAutoCapture(FaceCaptureView view, boolean autoCapture) {
        view.setAutoCapture(autoCapture);
    }

    @ReactProp(name = "captureDelay")
    public void setCaptureDelay(FaceCaptureView view, int delayMs) {
        view.setCaptureDelay(delayMs);
    }

    // Integer-based receiveCommand method
    @Override
    public void receiveCommand(@NonNull FaceCaptureView root, int commandId, @Nullable ReadableArray args) {
        Log.d(TAG, "receiveCommand (int): " + commandId);
        handleCommand(root, commandId, args);
    }

    // String-based receiveCommand method
    @Override
    public void receiveCommand(@NonNull FaceCaptureView root, String commandId, @Nullable ReadableArray args) {
        Log.d(TAG, "receiveCommand (String): " + commandId);

        int commandIdInt = -1;
        switch (commandId) {
            case "captureFace":
                commandIdInt = CMD_CAPTURE_FACE;
                break;
            case "startCapture":
                commandIdInt = CMD_START_CAPTURE;
                break;
            case "stopCapture":
                commandIdInt = CMD_STOP_CAPTURE;
                break;
            case "switchCamera":  // NEW
                commandIdInt = CMD_SWITCH_CAMERA;
                break;
        }

        if (commandIdInt != -1) {
            handleCommand(root, commandIdInt, args);
        } else {
            Log.w(TAG, "Unknown command: " + commandId);
        }
    }

    private void handleCommand(@NonNull FaceCaptureView root, int commandId, @Nullable ReadableArray args) {
        Log.d(TAG, "handleCommand: " + commandId);

        switch (commandId) {
            case CMD_CAPTURE_FACE:
                Log.d(TAG, "CMD_CAPTURE_FACE");
                root.captureFace();
                break;

            case CMD_START_CAPTURE:
                Log.d(TAG, "CMD_START_CAPTURE");
                root.startCapture();
                break;

            case CMD_STOP_CAPTURE:
                Log.d(TAG, "CMD_STOP_CAPTURE");
                root.stopCapture();
                break;

            case CMD_SWITCH_CAMERA:  // NEW
                Log.d(TAG, "CMD_SWITCH_CAMERA");
                root.switchCamera();
                break;

            default:
                Log.w(TAG, "Unknown command ID: " + commandId);
        }
    }
}