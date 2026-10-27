import React, { useMemo, useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    Modal,
    TouchableOpacity,
    Text,
    ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getFontSize } from './Helper';

interface LocationPoint {
    latitude: number;
    longitude: number;
    name?: string;
}

interface GoogleMapsModalProps {
    visible: boolean;
    onClose: () => void;
    origin: LocationPoint;
    destination: LocationPoint;
}

const GoogleMapsModal: React.FC<GoogleMapsModalProps> = ({
    visible,
    onClose,
    origin,
    destination,
}) => {
    const [loading, setLoading] = useState(true);
    const hasLoadedOnce = useRef(false);

    // Google Maps directions URL (NO iframe, NO HTML)
    const mapsUrl = useMemo(() => {
        const originCoords = `${origin.latitude},${origin.longitude}`;
        const destCoords = `${destination.latitude},${destination.longitude}`;

        return `https://www.google.com/maps/dir/?api=1&origin=${originCoords}&destination=${destCoords}&travelmode=driving`;
    }, [origin, destination]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Directions</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Route Info */}
                <View style={styles.routeInfo}>
                    <View style={styles.routePoint}>
                        <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                        <Text style={styles.routeText} numberOfLines={1}>
                            {origin.name || `${origin.latitude}, ${origin.longitude}`}
                        </Text>
                    </View>

                    <View style={styles.routePoint}>
                        <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
                        <Text style={styles.routeText} numberOfLines={1}>
                            {destination.name ||
                                `${destination.latitude}, ${destination.longitude}`}
                        </Text>
                    </View>
                </View>

                {/* Map */}
                <View style={styles.webViewContainer}>
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#CA282C" />
                            <Text style={styles.loadingText}>Loading map...</Text>
                        </View>
                    )}

                    <WebView
                        source={{ uri: mapsUrl }}
                        style={styles.webView}
                        javaScriptEnabled
                        domStorageEnabled
                        bounces={false}
                        onLoadEnd={() => {
                            if (!hasLoadedOnce.current) {
                                hasLoadedOnce.current = true;
                                setLoading(false);
                            }
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default GoogleMapsModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EAECF0',
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-SemiBold',
        color: '#1F2937',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#6B7280',
        fontWeight: '600',
    },
    routeInfo: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#EAECF0',
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    routeText: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#374151',
    },
    webViewContainer: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#6B7280',
    },
});
