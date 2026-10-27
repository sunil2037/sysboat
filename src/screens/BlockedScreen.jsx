import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Password } from '../Helper/IconsLoad';
import LottieView from 'lottie-react-native';
import { getFontSize, SCREEN_WIDTH, stopTracking } from '../Helper/Helper';
import { useAuth } from '../Context/AuthContext';

const BlockedScreen = ({ onRetry, onLogout }) => {
    const { permissions } = useAuth();

    useEffect(() => {
        const BlockedApp = async () => {
            if (permissions?.block_app) {
                await stopTracking();
            }
        }
        BlockedApp();
    }, [permissions])
    return (
        <View style={styles.container}>
            <LottieView source={require('../../assets/warning.json')} autoPlay loop style={{ width: SCREEN_WIDTH / 2, height: SCREEN_WIDTH / 2 }} />

            <Text style={styles.title}>Access Restricted</Text>
            <Text style={styles.message}>
                Your access to the application has been blocked by the admin.
            </Text>

            {onRetry && (
                <TouchableOpacity style={styles.button} onPress={onRetry}>
                    <Text style={styles.buttonText}>Retry</Text>
                </TouchableOpacity>
            )}

            {onLogout && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#555' }]}
                    onPress={onLogout}>
                    <Text style={styles.buttonText}>Logout</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        backgroundColor: '#fdecef',
        borderRadius: 100,
        padding: 25,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        color: '#CA282C',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#e63946',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginVertical: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BlockedScreen;
