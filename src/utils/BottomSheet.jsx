import React, { useEffect, useRef } from 'react';
import {
    requireNativeComponent,
    UIManager,
    findNodeHandle,
    StyleSheet,
    View,
    Platform,
} from 'react-native';

// ✅ Connects to RNBottomSheet ViewManager
const RNBottomSheet = requireNativeComponent('RNBottomSheet');

const BottomSheet = ({
    visible = false,
    fullScreen = false,
    dismissible = true,
    onDismiss,
    children,
}) => {
    if (Platform.OS !== 'android') return null;

    return (
        <RNBottomSheet
            style={styles.nativeSheet}
            visible={visible}
            fullScreen={fullScreen}
            dismissible={dismissible}
            onDismiss={onDismiss}
        >
            {/* ✅ Any RN content goes here */}
            <View style={styles.contentWrapper}>
                {children}
            </View>
        </RNBottomSheet>
    );
};

const styles = StyleSheet.create({
    nativeSheet: {
        // Must have some dimension for RN layout system
        width: 500,
        height: 500,
    },
    contentWrapper: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 32,
    },
});

export default BottomSheet;