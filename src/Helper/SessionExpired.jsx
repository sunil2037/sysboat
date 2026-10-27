import { Image, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import React from 'react';
import sessionexpiredimg from '../../assets/Icon/Sessionexpired.png';
import { getFontSize } from './Helper';
const SessionExpired = ({ visible, trigger }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.container}>
                <View style={styles.smallContainer}>
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <Image source={sessionexpiredimg} style={styles.image} />
                    </View>
                    <Text style={styles.messageText}>
                        Your session has expired.{'\n'}Please log back in to continue.
                    </Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => { trigger(); }}
                    >
                        <Text style={styles.loginButtonText}>Log Back In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default SessionExpired;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 20,
    },
    smallContainer: {
        backgroundColor: 'white',
        paddingVertical: 30,
        paddingHorizontal: 25,
        borderRadius: 15,
        alignItems: 'center',
        width: '90%',
        gap: 20,
    },
    image: {
        width: 150,
        height: 150,
    },
    messageText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    loginButton: {
        backgroundColor: '#CA282C',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        width: '100%',
    },
    loginButtonText: {
        color: 'white',
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
    },
});
