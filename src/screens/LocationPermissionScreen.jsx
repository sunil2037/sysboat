import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet, Platform, StatusBar, AppState, Modal } from "react-native";
import { check, request, PERMISSIONS, RESULTS, openSettings } from "react-native-permissions";
import { SafeAreaView } from "react-native-safe-area-context";
import ImageViewer from 'react-native-image-zoom-viewer';
import { getFontSize } from "../Helper/Helper";


const LocationPermissionScreen = ({ onPermissionUpdate }) => {
    const [status, setStatus] = useState("");
    const [visible, setIsVisible] = useState(false);
    const images = [
        { props: { source: require('../../assets/LocationScreenshot.png') } }
    ];


    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'active') {
                await checkCurrentPermissions();
            }
        });

        checkCurrentPermissions();

        return () => {
            subscription.remove();
        };
    }, []);

    const checkCurrentPermissions = async () => {
        try {
            let locationStatus;

            if (Platform.OS === "android") {
                locationStatus = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);

                if (locationStatus === RESULTS.GRANTED) {
                    const bgStatus = await check(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
                    setStatus(bgStatus);

                    if (bgStatus === RESULTS.GRANTED && onPermissionUpdate) {
                        onPermissionUpdate(true);
                    }
                } else {
                    setStatus(locationStatus);
                }
            } else {
                locationStatus = await check(PERMISSIONS.IOS.LOCATION_ALWAYS);
                setStatus(locationStatus);

                if (locationStatus === RESULTS.GRANTED && onPermissionUpdate) {
                    onPermissionUpdate(true);
                }
            }
        } catch (e) {
        }
    };

    const requestLocation = async () => {
        try {
            let result;

            if (Platform.OS === "android") {
                result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
                if (result === RESULTS.GRANTED) {
                    const bgResult = await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
                    setStatus(bgResult);

                    if (bgResult === RESULTS.GRANTED && onPermissionUpdate) {
                        onPermissionUpdate(true);
                    }
                } else {
                    setStatus(result);
                }
            } else {
                result = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
                setStatus(result);

                if (result === RESULTS.GRANTED && onPermissionUpdate) {
                    onPermissionUpdate(true);
                }
            }
        } catch (e) {
        }
    };

    const openAppSettings = () => {
        Linking.openSettings();
    };

    return (
        <>
            <StatusBar barStyle={'default'} />
            <View style={styles.container}>
                <Text style={styles.title}>Enable Location Services for Accurate Time & Attendance</Text>
                <Text style={styles.description}>
                    We use your location to enable accurate shift attendance, geofencing checks (clocking in/out from designated sites), and ensure reliable location-based tracking as required by your role. Your location is monitored only during scheduled work hours and check-ins to maintain the integrity of our HR system.
                </Text>


                <TouchableOpacity style={styles.button} onPress={requestLocation}>
                    <Text style={styles.buttonText}>Enable Location</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{}} onPress={() => setIsVisible(true)}>
                    <Text style={{ textDecorationLine: 'underline', fontFamily: 'Poppins-Regular' }}>How to enable location</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={openAppSettings}>
                    <Text style={styles.secondaryText}>Open Settings</Text>
                </TouchableOpacity>

                {status !== "" && (
                    <Text style={[
                        styles.status,
                        status === RESULTS.GRANTED ? styles.statusGranted : styles.statusDenied
                    ]}>
                        Status: {status}
                    </Text>
                )}
            </View>
            {visible && (
                <Modal
                    visible={visible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsVisible(false)}>
                    <ImageViewer
                        enablePreload={true}
                        index={0}
                        renderIndicator={() => null}
                        imageUrls={images}
                        enableSwipeDown={false}
                        enableImageZoom={true}
                        saveToLocalByLongPress={true}
                    />
                </Modal>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: 'white' },
    title: { fontSize: 20, fontFamily: 'Poppins-Medium', marginBottom: 10, textAlign: "center" },
    description: { fontSize: 12, color: "#555", marginBottom: 20, textAlign: "center", fontFamily: 'Poppins-Regular' },
    image: { width: 250, height: 200, marginBottom: 20 },
    button: {
        backgroundColor: "#007bff",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 10,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: { color: "#fff", fontSize: 16, fontFamily: 'Poppins-Medium' },
    secondaryButton: { padding: 10 },
    secondaryText: { fontSize: 14, color: "#007bff", fontFamily: 'Poppins-Medium' },
    status: { marginTop: 15, fontSize: 14, fontFamily: 'Poppins-Medium' },
    statusGranted: { color: "green" },
    statusDenied: { color: "red" },
});

export default LocationPermissionScreen;