import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Animated,
    ActivityIndicator,
    ToastAndroid,
    Platform,
    StatusBar,
    SafeAreaView,
    TouchableOpacity,
    Linking,
    Modal,
    Dimensions,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import useApi from '../Apis/Services/ApiConfig';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../Context/AuthContext';
import { Cross, LeftIcon } from '../Helper/IconsLoad';
import FaceRecognitionEx from '../components/FaceAuthenticate/FaceRecognition/FaceRecognitionEx';
import { Company2AttendanceScreen } from '../components/FaceAuthenticate/Company2AttendanceScreen';
import { getFontSize } from '../Helper/Helper';

const { width, height } = Dimensions.get('window');

export default function UploadScreen({ visible, onClose, onSuccessAction, navigation }) {
    const [cameraPermission, setCameraPermission] = useState(null);
    const [matchResult, setMatchResult] = useState(null);
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [similarityScore, setSimilarityScore] = useState(0);
    const [liveFaceVerified, setLiveFaceVerified] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
    const [showStepper, setshowStepper] = useState(false);
    const [cancelCapture, setCancelCapture] = useState(false);
    const { FaceGet } = useApi();
    const { FaceRegister } = useApi({ header: 'multipart/form-data' });
    const { userdata } = useEncodedUserData();
    const {
        isFaceRegister,
        FacePath,
        setFacePath,
        setIsFaceRegister,
        setFaceAuthenticated,
        faceAuthenticated,
    } = useAuth();

    const statusBarHeight = StatusBar.currentHeight;

    useEffect(() => {
        if (!visible) {
            return undefined;
        }

        let active = true;
        const checkPermission = async () => {
            try {
                const permission = Platform.OS === 'ios'
                    ? PERMISSIONS.IOS.CAMERA
                    : PERMISSIONS.ANDROID.CAMERA;
                const result = await check(permission);
                if (!active) return;
                setCameraPermission(result);
                if (result !== RESULTS.GRANTED) {
                    const requestedResult = await request(permission);
                    if (active) setCameraPermission(requestedResult);
                }
            } catch (error) {
                if (active) setCameraPermission(RESULTS.UNAVAILABLE);
            }
        };
        setCameraPermission(null);
        checkPermission();
        return () => {
            active = false;
        };
    }, [visible]);

    const { data, isError, isFetching, isLoading, refetch } = useQuery({
        queryKey: ['FaceGet', userdata],
        queryFn: () =>
            FaceGet({
                userData: userdata,
            }),
        enabled: !!userdata && visible,
    });

    useEffect(() => {
        if (visible) {
            setIsFaceRegister(false);
            setFacePath(null);
            if (data?.data[0]?.image_path) {
                setIsFaceRegister(true);
                setFacePath(data?.data[0]?.image_path);
            }
            if (faceAuthenticated) {
                setBottomSheetVisible(false);
            }
            setshowStepper(isFaceRegister);
        }
    }, [data, faceAuthenticated, isFaceRegister, visible]);






    const handleClose = () => {
        setBottomSheetVisible(false);
        setCancelCapture(true);
        setMatchResult(null);
        setImageUri(null);
        setSimilarityScore(0);
        onClose();
    };


    if (cameraPermission === RESULTS.BLOCKED || cameraPermission === RESULTS.DENIED) {
        return (
            <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
                <SafeAreaView
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text
                        style={{
                            color: 'black',
                            fontSize: 16,
                            marginBottom: 16,
                            textAlign: 'center',
                            fontFamily: 'Poppins-Medium',
                        }}>
                        Camera permission is permanently blocked. Please enable it from
                        settings.
                    </Text>
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#CA282C',
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 5,
                            marginBottom: 20,
                        }}
                        onPress={() => Linking.openSettings()}>
                        <Text
                            style={{
                                color: 'white',
                                fontSize: 14,
                                fontFamily: 'Poppins-Regular',
                            }}>
                            Open Settings
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        );
    }

    if (cameraPermission !== RESULTS.GRANTED) {
        return (
            <Modal visible={visible} animationType="slide" transparent={false}>
                <SafeAreaView
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="black" />
                    <Text
                        style={{
                            marginTop: 16,
                            color: 'black',
                            fontSize: 14,
                            fontFamily: 'Poppins-Regular',
                        }}>
                        Checking camera permission...
                    </Text>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        );
    }

    return (
        <>
            <Modal
                visible={visible && !bottomSheetVisible}
                animationType="fade"
                statusBarTranslucent
                onRequestClose={onClose}
                transparent={true}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={[styles.container, { paddingTop: statusBarHeight + 10, gap: 20 }]}>
                        <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#e9e9e9ff', borderRadius: 50, padding: 10, width: 40, height: 40, marginLeft: 15 }}>
                            <LeftIcon />
                        </TouchableOpacity>
                        {cameraPermission === RESULTS.GRANTED && (
                            // <CameraCapture onCapture={handleCapture} />
                            <FaceRecognitionEx onFaceRecognized={onSuccessAction} navigation={navigation} />
                        )}
                    </View>
                </SafeAreaView>
            </Modal>

        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Medium',
        color: '#333',
    },
    closeButton: {
        paddingHorizontal: 20,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    closeButtonText: {
        fontSize: 12,
        color: '#333',
        fontFamily: 'Poppins-Medium'
    },
    loader: { alignItems: 'center', marginTop: 20 },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
    preview: {
        alignItems: 'center',
        marginTop: 20,
    },
    image: {
        width: 250,
        height: 250,
        borderRadius: 10,
        marginBottom: 10,
    },
    resultText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'green',
    },
});
