import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import nothing from '../../assets/Icon/nothing.png';
import { getFontSize } from './Helper';

const EmptyMessage = () => {
    return (
        <View style={styles.container}>
            <Image source={nothing} style={styles.image} />
            <Text style={styles.text}>
                Nothing Here Yet!
            </Text>
            <Text style={styles.subText}>
                Look like there's no content here right now.
            </Text>
        </View>
    );
};

export default EmptyMessage;

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        borderRadius: 10,
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
        textAlign: 'center',
    },
    subText: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        color: '#6A7D94',
        textAlign: 'center',
    },
});
