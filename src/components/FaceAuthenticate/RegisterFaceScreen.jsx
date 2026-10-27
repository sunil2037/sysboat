// RegisterFaceScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleSheet,
    SafeAreaView,
    TextInput,
    Alert,
} from 'react-native';
import { useFaceDetection } from '../../utils/faceDetection';
import useApi from '../../Apis/Services/ApiConfig';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import { toast } from '../../Helper/ToastManager';
import CameraCapture from '../../Helper/CameraCapture';
import { getFontSize } from '../../Helper/Helper';

export default function RegisterFaceScreen({ navigation }) {
    const { FaceRegister } = useApi({ header: 'multipart/form-data' });
    const { userdata } = useEncodedUserData();
    const [localImageUri, setLocalImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const { sessionLoaded, detectFace, extractFromFile } = useFaceDetection();
    const [openCamera, setOpenCamera] = useState(false);


    // Choose your capture/upload component or integrate existing CameraCapture.
    // For brevity this code expects `localImageUri` to be set (from a picker/camera).
    // You can plug your CameraCapture's onCapture to setLocalImageUri(uri).

    const handleUpload = useCallback(async () => {
        if (!localImageUri) return Alert.alert('Select or capture an image first');
        if (!userId) return Alert.alert('Please enter user id / employee id');

        setLoading(true);
        try {
            // Detect face locally to ensure valid face and (optional) send embedding to backend.
            const detectRes = await detectFace(localImageUri);
            console.log('Detected face result:', detectRes);
            if (!detectRes || !detectRes.embedding) {
                toast.error('No face detected in selected image.');
                setLoading(false);
                return;
            }

            // Prepare form data to register on your server
            const formData = new FormData();
            const fileName = `face_${userId}_${Date.now()}.jpg`;
            formData.append('face', {
                uri: localImageUri,
                name: fileName,
                type: 'image/jpeg',
            });
            // attach user id or encoded userdata as required by backend
            formData.append('userData', JSON.stringify({ userId, ...userdata }));

            // Optionally: If your backend accepts embeddings directly, send detectRes.embedding
            // formData.append('embedding', JSON.stringify(detectRes.embedding));

            await FaceRegister(formData);
            toast.success('Face registered successfully');

            // Optionally navigate back or to gate screen
            navigation.goBack();
        } catch (err) {
            console.warn('Register error', err);
            toast.error('Registration failed');
        } finally {
            setLoading(false);
        }
    }, [localImageUri, userId, detectFace, FaceRegister, userdata, navigation]);


    const handleCapture = async capturedImagePath => {
        setLocalImageUri(capturedImagePath);
        setOpenCamera(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Register Employee Face</Text>

            {openCamera && (
                <CameraCapture onCapture={handleCapture} />
            )}

            {/* Replace below with actual image picker / camera */}
            <TouchableOpacity
                style={styles.captureBox}
                onPress={() => {
                    /* trigger existing CameraCapture; setLocalImageUri(uri) */
                    setOpenCamera(true)
                }}>
                {localImageUri ? (
                    <Image source={{ uri: localImageUri }} style={styles.previewImage} />
                ) : (
                    <Text style={{ color: '#777' }}>Tap to select / capture image</Text>
                )}
            </TouchableOpacity>

            <TextInput
                placeholder="Employee ID"
                value={userId}
                onChangeText={setUserId}
                style={styles.input}
            />

            <TouchableOpacity
                style={[styles.button, { opacity: loading ? 0.8 : 1 }]}
                disabled={loading}
                onPress={handleUpload}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Register</Text>}
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
    captureBox: {
        height: 300,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    previewImage: { width: '100%', height: '100%', borderRadius: 10 },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#CA282C',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
