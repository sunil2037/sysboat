import React, { useEffect, forwardRef } from 'react';
import {
    requireNativeComponent,
    NativeEventEmitter,
    NativeModules,
    View,
    Text,
    UIManager,
    findNodeHandle,
} from 'react-native';
import { bottomHeight, getFontSize } from '../../../Helper/Helper';

const COMPONENT_NAME = 'FaceRecognitionCameraViews';
const FaceRecognitionCameraNative = requireNativeComponent(COMPONENT_NAME);

const FaceRecognitionCameraView = forwardRef(({ onFaceRecognized }, ref) => {
    useEffect(() => {
        const eventEmitter = new NativeEventEmitter(NativeModules.DeviceEventManager);

        const sub = eventEmitter.addListener('onFaceRecognized', (event) => {
            if (onFaceRecognized && event) {
                onFaceRecognized(event);
            }
        });
        return () => sub.remove();
    }, [onFaceRecognized]);

    return (
        <View style={{ flex: 1, paddingBottom: bottomHeight() }}>
            <FaceRecognitionCameraNative
                ref={ref}
                style={{ flex: 1 }}
            />
            <Text style={{ position: 'absolute', top: 10, left: 10, color: '#fff', fontSize: 12 }}>
                Camera Active
            </Text>
        </View>
    );
});

FaceRecognitionCameraView.displayName = 'FaceRecognitionCameraView';

export default FaceRecognitionCameraView;