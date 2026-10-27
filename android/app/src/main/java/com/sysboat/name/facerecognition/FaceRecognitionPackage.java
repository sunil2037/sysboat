package com.sysboat.name.facerecognition;


import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class FaceRecognitionPackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(com.facebook.react.bridge.ReactApplicationContext reactContext) {
        return new ArrayList<>();
    }

    @Override
    public List<ViewManager> createViewManagers(com.facebook.react.bridge.ReactApplicationContext reactContext) {
        List<ViewManager> managers = new ArrayList<>();
        managers.add(new FaceRecognitionCameraViewManager());
        managers.add(new FaceCaptureViewManager());
        return managers;
    }
}