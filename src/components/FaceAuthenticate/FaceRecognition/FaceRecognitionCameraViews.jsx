import React, { useEffect, useState, forwardRef } from 'react';
import {
    requireNativeComponent,
    NativeEventEmitter,
    NativeModules,
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { bottomHeight } from '../../../Helper/Helper';

const COMPONENT_NAME = 'FaceRecognitionCameraViews';
const FaceRecognitionCameraNative = requireNativeComponent(COMPONENT_NAME);

const FaceRecognitionCameraView = forwardRef(({ onFaceRecognized }, ref) => {
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        const eventEmitter = new NativeEventEmitter(NativeModules.DeviceEventManager);

        const sub = eventEmitter.addListener('onFaceRecognized', (event) => {
            if (onFaceRecognized && event) {
                onFaceRecognized(event);
            }
        });

        const readySub = eventEmitter.addListener('onCameraReady', () => {
            setIsCameraReady(true);
        });

        // Fallback timer: ensure overlay dismisses even if native event timing races
        const fallbackTimer = setTimeout(() => {
            setIsCameraReady(true);
        }, 2500);

        return () => {
            sub.remove();
            readySub.remove();
            clearTimeout(fallbackTimer);
        };
    }, [onFaceRecognized]);

    return (
        <View style={{ flex: 1, paddingBottom: bottomHeight(), position: 'relative' }}>
            <FaceRecognitionCameraNative
                ref={ref}
                style={{ flex: 1, width: '100%', height: '100%' }}
            />
            {!isCameraReady && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#CA282C" />
                    <Text style={styles.loadingText}>Starting Camera…</Text>
                    <Text style={styles.loadingSubText}>Please wait a moment</Text>
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        zIndex: 20,
    },
    loadingText: {
        marginTop: 16,
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
        fontWeight: '600',
    },
    loadingSubText: {
        marginTop: 6,
        color: '#9E9E9E',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
});

FaceRecognitionCameraView.displayName = 'FaceRecognitionCameraView';

export default FaceRecognitionCameraView;
