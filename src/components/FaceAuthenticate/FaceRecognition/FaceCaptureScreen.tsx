import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Camera, CameraType, type CameraApi } from 'react-native-camera-kit';
import { CameraIcon } from '../../../Helper/IconsLoad';
import FaceRecognition from '../FaceRecognition';

interface FaceCaptureData {
    embedding: number[];
    faceWidth: number;
    faceHeight: number;
    timestamp: string;
    success: boolean;
    previewImage: string;
}

interface FaceCaptureScreenProps {
    onFaceCaptured?: (data: FaceCaptureData) => void;
    autoCapture?: boolean;
    captureDelay?: number;
}

export default function FaceCaptureScreen({
    onFaceCaptured,
    autoCapture = false,
    captureDelay = 1000,
}: FaceCaptureScreenProps) {
    const cameraRef = useRef<CameraApi>(null);
    const captureInProgress = useRef(false);
    const [cameraType, setCameraType] = useState(CameraType.Front);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('Camera ready');
    const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

    const captureFace = useCallback(async () => {
        if (captureInProgress.current || !cameraRef.current) return;

        captureInProgress.current = true;
        setIsProcessing(true);
        setStatus('Capturing face…');
        let capturedResult: FaceCaptureData | null = null;

        try {
            const photo = await cameraRef.current.capture();
            const faceData = await FaceRecognition.extractEmbeddingsFromUri(photo.uri);
            if (!faceData?.embeddings?.length || !faceData.faceImage) {
                throw new Error('No face found. Center your face and try again.');
            }

            const previewImage = faceData.faceImage.startsWith('data:image/')
                ? faceData.faceImage
                : `data:image/jpeg;base64,${faceData.faceImage}`;
            const result: FaceCaptureData = {
                embedding: faceData.embeddings,
                faceWidth: photo.width,
                faceHeight: photo.height,
                timestamp: String(Date.now()),
                success: true,
                previewImage,
            };

            setCapturedPreview(previewImage);
            setStatus('Face captured successfully');
            capturedResult = result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not capture face';
            setStatus(message);
        } finally {
            captureInProgress.current = false;
            setIsProcessing(false);
        }

        if (capturedResult) onFaceCaptured?.(capturedResult);
    }, [onFaceCaptured]);

    useEffect(() => {
        if (!autoCapture || !isCapturing) return;
        const timer = setInterval(captureFace, Math.max(captureDelay, 500));
        return () => clearInterval(timer);
    }, [autoCapture, captureDelay, captureFace, isCapturing]);

    return (
        <View style={styles.container}>
            <View style={styles.cameraStage}>
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    cameraType={cameraType}
                    resizeMode="cover"
                    focusMode="on"
                    onError={({ nativeEvent }) => setStatus(nativeEvent.errorMessage || 'Camera unavailable')}
                />

                <View pointerEvents="none" style={styles.instruction}>
                    <Text style={styles.instructionText}>Position your face in the center</Text>
                </View>
                <View pointerEvents="none" style={styles.faceGuide} />

                <View style={styles.statusBox} pointerEvents="none">
                    <Text style={styles.statusText}>{status}</Text>
                </View>

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Switch camera"
                    style={styles.switchButton}
                    onPress={() => setCameraType(current => (
                        current === CameraType.Front ? CameraType.Back : CameraType.Front
                    ))}
                >
                    <CameraIcon />
                </TouchableOpacity>

             
            </View>

            <View style={styles.controlPanel}>
                <TouchableOpacity
                    style={[styles.button, styles.startButton]}
                    onPress={() => {
                        setIsCapturing(current => !current);
                        setStatus(isCapturing ? 'Capture paused' : 'Position your face and capture');
                    }}
                >
                    <Text style={styles.buttonText}>{isCapturing ? 'Stop Capture' : 'Start Capture'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.captureButton, (!isCapturing || isProcessing) && styles.disabledButton]}
                    onPress={captureFace}
                    disabled={!isCapturing || isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Capture Now</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraStage: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    instruction: {
        position: 'absolute',
        top: 26,
        left: 64,
        right: 64,
        alignItems: 'center',
    },
    instructionText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    faceGuide: {
        position: 'absolute',
        top: '19%',
        bottom: '22%',
        width: '68%',
        alignSelf: 'center',
        borderWidth: 5,
        borderColor: '#00e600',
        borderStyle: 'dashed',
        borderRadius: 999,
    },
    statusBox: {
        position: 'absolute',
        top: 67,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    statusText: {
        color: '#00e600',
        fontSize: 16,
        textAlign: 'center',
    },
    switchButton: {
        position: 'absolute',
        top: 16,
        right: 18,
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    capturedPreview: {
        position: 'absolute',
        bottom: 14,
        alignSelf: 'center',
        alignItems: 'center',
    },
    previewTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    previewImage: {
        width: 120,
        height: 120,
        backgroundColor: '#333',
    },
    emptyPreview: {
        width: 120,
        height: 120,
        backgroundColor: '#333',
    },
    previewCaption: {
        color: '#aaa',
        fontSize: 13,
        marginTop: 6,
    },
    controlPanel: {
        minHeight: 108,
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    button: {
        width: '42%',
        minHeight: 58,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    startButton: {
        backgroundColor: '#CA282C',
    },
    captureButton: {
        backgroundColor: '#000',
    },
    disabledButton: {
        opacity: 0.45,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
