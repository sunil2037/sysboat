import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import img1 from '../../assets/Icon/NoConnection.png';
import img2 from '../../assets/Icon/EmptyState.png';
import { getFontSize } from './Helper';

const InternetStatus = () => {
    const netInfo = useNetInfo();
    const [showMessage, setShowMessage] = useState(false);
    const fadeAnim = new Animated.Value(1);

    useEffect(() => {
        if (netInfo.isConnected === false) {
            setShowMessage(true);
        } else if (netInfo.isConnected === true) {
            // Delay fade-out to avoid unnecessary flashes
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start(() => setShowMessage(false));
            }, 2000);
        }
    }, [netInfo.isConnected]);

    if (!showMessage) { return null; }

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Image source={netInfo.isConnected ? img1 : img2} style={styles.image} />
            <Text style={styles.text}>
                {netInfo.isConnected ? 'Internet Connected' : 'No Internet Connection'}
            </Text>
            <Text style={styles.subText}>
                {netInfo.isConnected ? 'Your internet is working fine.' : 'Please check your internet connection.'}
            </Text>
        </Animated.View>
    );
};

export default InternetStatus;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        height: '100%',
        width: '100%',
    },
    image: {
        width: 400,
        height: 200,
        resizeMode: 'contain',
    },
    text: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
        color: '#293646',
    },
    subText: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        color: '#6A7D94',
    },
});
