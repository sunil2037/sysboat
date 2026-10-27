import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
    requireNativeComponent,
    UIManager,
    findNodeHandle,
    NativeEventEmitter,
    NativeModules,
    ViewStyle,
    StyleSheet,
    View,
} from 'react-native';

const { FaceRecognitionModule } = NativeModules;

interface FaceRecognitionCameraProps {
    style?: ViewStyle;
    cameraType?: 'front' | 'back';
    enableFaceDetection?: boolean;
    onFacesDetected?: (event: { faceCount: number }) => void;
}

export interface FaceRecognitionCameraRef {
    startCamera: () => void;
    stopCamera: () => void;
    switchCamera: () => void;
}

const NativeCameraView = requireNativeComponent<any>('FaceRecognitionCameraView');

const FaceRecognitionCamera = forwardRef<
    FaceRecognitionCameraRef,
    FaceRecognitionCameraProps
>((props, ref) => {
    const { style, cameraType = 'front', enableFaceDetection = true, onFacesDetected } = props;
    const cameraRef = useRef(null);

    // useEffect(() => {
    //     const eventEmitter = new NativeEventEmitter(FaceRecognitionModule);
    //     // const subscription = eventEmitter.addListener('onFacesDetected', (event) => {
    //     //     onFacesDetected?.(event);
    //     // });

    //     // return () => {
    //     //     subscription.remove();
    //     // };
    // }, [onFacesDetected]);

    useImperativeHandle(ref, () => ({
        startCamera: () => {
            UIManager.dispatchViewManagerCommand(
                findNodeHandle(cameraRef.current),
                'startCamera',
                []
            );
        },
        stopCamera: () => {
            UIManager.dispatchViewManagerCommand(
                findNodeHandle(cameraRef.current),
                'stopCamera',
                []
            );
        },
        switchCamera: () => {
            UIManager.dispatchViewManagerCommand(
                findNodeHandle(cameraRef.current),
                'switchCamera',
                []
            );
        },
    }));

    return (
        <View>
            <NativeCameraView
                ref={cameraRef}
                style={[styles.camera, style]}
                cameraType={cameraType}
                enableFaceDetection={enableFaceDetection}
            />
            {/* <CameraScreen /> */}
        </View>
    );
});

const styles = StyleSheet.create({
    camera: {
        flex: 1,
    },
});

export default FaceRecognitionCamera;