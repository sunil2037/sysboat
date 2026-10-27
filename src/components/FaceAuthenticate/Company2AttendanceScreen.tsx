import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    FlatList,
    Animated,
    Platform,
    PermissionsAndroid,
    ActivityIndicator,
} from 'react-native';
import FaceRecognition, { RecognitionResult } from './FaceRecognition';
import { getFontSize } from '../../Helper/Helper';
/**
 * Company 2: Automatic Door Recognition System
 * Continuous face recognition for automatic attendance marking
 * Phone placed at door -> Employee walks by -> Auto punch in/out
 */

interface AttendanceLog {
    id: string;
    name: string;
    employeeId: string;
    timestamp: Date;
    action: 'IN' | 'OUT';
    confidence: number;
    distance: number;
}

interface SystemStats {
    totalToday: number;
    currentlyIn: number;
    punchIns: number;
    punchOuts: number;
}

export const Company2AttendanceScreen: React.FC = () => {
    const [isSystemActive, setIsSystemActive] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [currentRecognition, setCurrentRecognition] = useState<RecognitionResult | null>(null);
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
    const [recentlyProcessed, setRecentlyProcessed] = useState<Map<string, number>>(new Map());
    const [stats, setStats] = useState<SystemStats>({
        totalToday: 0,
        currentlyIn: 0,
        punchIns: 0,
        punchOuts: 0
    });
    const [registeredFaces, setRegisteredFaces] = useState<string[]>([]);
    const [hasPermission, setHasPermission] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;


    useEffect(() => {
        requestPermissions();
        loadRegisteredFaces();

        // Update clock every second
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        return () => {
            clearInterval(timer);
            if (isSystemActive) {
                stopSystem();
            }
        };
    }, []);

    useEffect(() => {
        if (isSystemActive) {
            startScanningAnimation();
        } else {
            stopScanningAnimation();
        }
    }, [isSystemActive]);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                ]);

                const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] ===
                    PermissionsAndroid.RESULTS.GRANTED;

                if (cameraGranted) {
                    await FaceRecognition.startCamera();
                    setHasPermission(true);
                } else {
                    Alert.alert('Permission Required', 'Camera permission is required for face recognition');
                }
            } catch (err) {
                console.warn(err);
            }
        } else {
            setHasPermission(true);
        }
    };

    const loadRegisteredFaces = async () => {
        try {
            const faces = await FaceRecognition.getAllFaces();
            const faceNames = faces.map((f: any) => f.name || f);
            setRegisteredFaces(faceNames);
        } catch (error) {
        }
    };

    const startScanningAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const stopScanningAnimation = () => {
        scanLineAnim.setValue(0);
        pulseAnim.setValue(1);
    };

    const startSystem = async () => {
        if (registeredFaces.length === 0) {
            Alert.alert(
                'No Registered Faces',
                'Please register at least one employee before starting the system.',
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            setIsInitializing(true);

            // Set cooldown period (30 seconds to prevent duplicate punches)
            await FaceRecognition.setRecognitionCooldown(50000);

            // Start continuous recognition
            await FaceRecognition.startContinuousRecognition();

            // Setup event listeners
            FaceRecognition.addListener('onFaceRecognized', handleFaceRecognized);
            FaceRecognition.addListener('onFaceDetected', handleFaceDetected);
            FaceRecognition.addListener('onNoFace', handleNoFace);
            FaceRecognition.addListener('onError', handleError);

            setIsSystemActive(true);

            Alert.alert(
                '✓ System Started',
                'Automatic face recognition is now active',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            Alert.alert('Error', `Failed to start system: ${error.message}`);
        } finally {
            setIsInitializing(false);
        }
    };

    const stopSystem = async () => {
        try {
            await FaceRecognition.stopContinuousRecognition();
            FaceRecognition.removeAllListeners();
            setIsSystemActive(false);
            setCurrentRecognition(null);

            Alert.alert(
                'System Stopped',
                'Automatic face recognition has been stopped',
                [{ text: 'OK' }]
            );
        } catch (error) {
        }
    };

    const handleFaceRecognized = async (result: RecognitionResult) => {

        if (!result.recognized) {
            return;
        }

        const employeeKey = result.employeeId || result.name;
        const currentTime = Date.now();
        const lastProcessedTime = recentlyProcessed.get(employeeKey) || 0;

        // Check cooldown (30 seconds)
        if (currentTime - lastProcessedTime < 30000) {
            return;
        }

        // Update recently processed
        setRecentlyProcessed(prev => new Map(prev).set(employeeKey, currentTime));

        // Show recognition animation
        setCurrentRecognition(result);
        animateRecognition();

        // Determine punch action (IN or OUT)
        const action = determinePunchAction(result.employeeId);

        // Auto punch
        await performAutoPunch(result, action);

        // Clear recognition after 3 seconds
        setTimeout(() => {
            setCurrentRecognition(null);
        }, 3000);
    };

    const handleFaceDetected = () => {
        // Face detected but not yet recognized - could show "scanning" state
    };

    const handleNoFace = () => {
        // No face in frame
        if (currentRecognition) {
            setCurrentRecognition(null);
        }
    };

    const handleError = (error: any) => {
    };

    const determinePunchAction = (employeeId: string): 'IN' | 'OUT' => {
        // Find the last log for this employee
        const lastLog = attendanceLogs.find(log => log.employeeId === employeeId);

        // If no previous log or last action was OUT, then punch IN
        if (!lastLog || lastLog.action === 'OUT') {
            return 'IN';
        }

        // Otherwise punch OUT
        return 'OUT';
    };

    const performAutoPunch = async (result: RecognitionResult, action: 'IN' | 'OUT') => {
        try {
            const endpoint = action === 'IN' ? 'punch-in' : 'punch-out';

            // Call your attendance API
            const response = await fetch(`YOUR_API_ENDPOINT/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_TOKEN', // Add your auth token
                },
                body: JSON.stringify({
                    employeeId: result.employeeId,
                    employeeName: result.name,
                    timestamp: new Date().toISOString(),
                    faceVerified: true,
                    confidence: 1 - result.distance,
                    automatic: true,
                    location: 'Main Entrance',
                    device: 'Door Terminal',
                }),
            });

            if (response.ok) {
                // Add to local logs
                const newLog: AttendanceLog = {
                    id: Date.now().toString(),
                    name: result.name,
                    employeeId: result.employeeId || '',
                    timestamp: new Date(),
                    action,
                    confidence: 1 - result.distance,
                    distance: result.distance,
                };

                setAttendanceLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs

                // Update stats
                setStats(prev => ({
                    totalToday: prev.totalToday + 1,
                    currentlyIn: action === 'IN' ? prev.currentlyIn + 1 : prev.currentlyIn - 1,
                    punchIns: action === 'IN' ? prev.punchIns + 1 : prev.punchIns,
                    punchOuts: action === 'OUT' ? prev.punchOuts + 1 : prev.punchOuts,
                }));

                // Show success notification
                showSuccessNotification(result.name, action);
            } else {
            }
        } catch (error) {
            // Optionally store failed punches for retry
        }
    };

    const animateRecognition = () => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(2500),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const showSuccessNotification = (name: string, action: 'IN' | 'OUT') => {
        const emoji = action === 'IN' ? '👋' : '👋';
        const message = action === 'IN' ? 'Welcome!' : 'Goodbye!';

        // Could use a toast library here for better UX
    };

    const toggleSystem = () => {
        if (isSystemActive) {
            stopSystem();
        } else {
            startSystem();
        }
    };

    const clearLogs = () => {
        Alert.alert(
            'Clear Logs',
            'Are you sure you want to clear all attendance logs?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        setAttendanceLogs([]);
                        setStats({ totalToday: 0, currentlyIn: 0, punchIns: 0, punchOuts: 0 });
                    },
                },
            ]
        );
    };

    const clearRecentlyProcessed = () => {
        Alert.alert(
            'Reset Cooldowns',
            'This will allow all employees to punch again immediately.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    onPress: () => {
                        setRecentlyProcessed(new Map());
                        Alert.alert('Success', 'All cooldowns have been reset');
                    },
                },
            ]
        );
    };

    if (!hasPermission) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text >📷</Text>
                <Text >Camera Permission Required</Text>
                <Text >
                    This system needs camera access to recognize faces
                </Text>
                <TouchableOpacity onPress={requestPermissions}>
                    <Text >Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with Clock */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Door Attendance System</Text>
                <Text style={styles.headerSubtitle}>Company 2 - Automatic Recognition</Text>
                <Text style={styles.clock}>{currentTime.toLocaleTimeString()}</Text>
                <Text style={styles.date}>{currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</Text>
                <View style={[
                    styles.statusBadge,
                    isSystemActive ? styles.statusActive : styles.statusInactive
                ]}>
                    <Text style={styles.statusText}>
                        {isSystemActive ? '● SYSTEM ACTIVE' : '○ SYSTEM INACTIVE'}
                    </Text>
                </View>
            </View>

            {/* Recognition Display Area */}
            <View style={styles.recognitionArea}>
                {isSystemActive ? (
                    currentRecognition ? (
                        <Animated.View
                            style={[
                                styles.recognitionCard,
                                {
                                    opacity: fadeAnim,
                                },
                            ]}
                        >
                            <View style={styles.recognitionBadge}>
                                <Text style={styles.recognitionIcon}>✓</Text>
                                <Text style={styles.recognitionName}>{currentRecognition.name}</Text>
                                <Text style={styles.recognitionId}>ID: {currentRecognition.employeeId}</Text>
                                <Text style={styles.recognitionConfidence}>
                                    {((1 - currentRecognition.distance) * 100).toFixed(1)}% Match
                                </Text>
                                <Text style={styles.recognitionAction}>
                                    {determinePunchAction(currentRecognition.employeeId || '') === 'IN' ? '→ Punching IN' : '← Punching OUT'}
                                </Text>
                            </View>
                        </Animated.View>
                    ) : (
                        <Animated.View
                            style={[
                                styles.scanningCard,
                                { transform: [{ scale: pulseAnim }] }
                            ]}
                        >
                            <Text style={styles.scanningIcon}>👁️</Text>
                            <Text style={styles.scanningText}>Scanning for faces...</Text>
                            <Animated.View
                                style={[
                                    styles.scanningLine,
                                    {
                                        opacity: scanLineAnim,
                                        transform: [{
                                            translateY: scanLineAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, 100],
                                            })
                                        }]
                                    }
                                ]}
                            />
                            <Text style={styles.scanningSubtext}>
                                Stand in front of the camera
                            </Text>
                        </Animated.View>
                    )
                ) : (
                    <View style={styles.inactiveCard}>
                        <Text style={styles.inactiveIcon}>⏸️</Text>
                        <Text style={styles.inactiveText}>System Inactive</Text>
                        <Text style={styles.inactiveSubtext}>
                            {registeredFaces.length > 0
                                ? 'Tap START to begin automatic recognition'
                                : 'Please register employees first'}
                        </Text>
                        <Text style={styles.registeredCount}>
                            {registeredFaces.length} faces registered
                        </Text>
                    </View>
                )}
            </View>

            {/* Statistics Dashboard */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalToday}</Text>
                    <Text style={styles.statLabel}>Total Today</Text>
                </View>
                <View style={[styles.statCard, styles.statCardSpecial]}>
                    <Text style={[styles.statValue, styles.statValueGreen]}>{stats.currentlyIn}</Text>
                    <Text style={styles.statLabel}>Currently In</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, styles.statValueBlue]}>{stats.punchIns}</Text>
                    <Text style={styles.statLabel}>Punch Ins</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, styles.statValueOrange]}>{stats.punchOuts}</Text>
                    <Text style={styles.statLabel}>Punch Outs</Text>
                </View>
            </View>

            {/* Control Buttons */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={[
                        styles.mainControlButton,
                        isSystemActive ? styles.stopButton : styles.startButton,
                        isInitializing && styles.buttonDisabled
                    ]}
                    onPress={toggleSystem}
                    disabled={isInitializing}
                >
                    {isInitializing ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.mainControlButtonText}>
                            {isSystemActive ? '⏹️ STOP SYSTEM' : '▶️ START SYSTEM'}
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={styles.secondaryControls}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={clearRecentlyProcessed}
                        disabled={isSystemActive}
                    >
                        <Text style={styles.secondaryButtonText}>Reset Cooldowns</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={loadRegisteredFaces}
                    >
                        <Text style={styles.secondaryButtonText}>Refresh Faces</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Activity Logs */}
            <View style={styles.logsContainer}>
                <View style={styles.logsHeader}>
                    <Text style={styles.logsTitle}>Recent Activity</Text>
                    {attendanceLogs.length > 0 && (
                        <TouchableOpacity onPress={clearLogs}>
                            <Text style={styles.clearText}>Clear All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {attendanceLogs.length === 0 ? (
                    <View style={styles.emptyLogs}>
                        <Text style={styles.emptyLogsIcon}>📋</Text>
                        <Text style={styles.emptyLogsText}>No activity yet</Text>
                        <Text style={styles.emptyLogsSubtext}>
                            Start the system to begin tracking
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={attendanceLogs}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.logCard}>
                                <View style={styles.logLeft}>
                                    <View style={[
                                        styles.logBadge,
                                    ]}>
                                        <Text >
                                            {item.action === 'IN' ? '→ IN' : '← OUT'}
                                        </Text>
                                    </View>
                                    <View >
                                        <Text >{item.name}</Text>
                                        <Text >ID: {item.employeeId}</Text>
                                    </View>
                                </View>
                                <View >
                                    <Text >
                                        {item.timestamp.toLocaleTimeString()}
                                    </Text>
                                    <Text >
                                        {(item.confidence * 100).toFixed(0)}% confidence
                                    </Text>
                                </View>
                            </View>
                        )}
                        style={styles.logsList}
                        showsVerticalScrollIndicator={true}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        backgroundColor: '#1a1a1a',
        padding: 20,
        paddingTop: 50,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: '#00ff88',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
        marginBottom: 12,
    },
    clock: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#00ff88',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    date: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
    },
    statusActive: {
        backgroundColor: '#00ff8833',
        borderWidth: 1,
        borderColor: '#00ff88',
    },
    statusInactive: {
        backgroundColor: '#33333333',
        borderWidth: 1,
        borderColor: '#555',
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
    recognitionArea: {
        padding: 16,
        minHeight: 220,
        justifyContent: 'center',
    },
    recognitionCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#00ff88',
        shadowColor: '#00ff88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    recognitionBadge: {
        alignItems: 'center',
    },
    recognitionIcon: {
        fontSize: 56,
        marginBottom: 12,
    },
    recognitionName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#00ff88',
        marginBottom: 4,
    },
    recognitionId: {
        fontSize: 16,
        color: '#888',
        marginBottom: 8,
    },
    recognitionConfidence: {
        fontSize: 14,
        color: '#00ff88',
        marginBottom: 12,
    },
    recognitionAction: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: '#00ff8833',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    scanningCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#333',
        minHeight: 180,
        justifyContent: 'center',
    },
    scanningIcon: {
        fontSize: 56,
        marginBottom: 16,
    },
    scanningText: {
        fontSize: 20,
        color: '#00ff88',
        fontWeight: '600',
        marginBottom: 16,
    },
    scanningLine: {
        width: '80%',
        height: 3,
        backgroundColor: '#00ff88',
        borderRadius: 2,
        marginVertical: 12,
    },
    scanningSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    inactiveCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#333',
    },
    inactiveIcon: {
        fontSize: 56,
        marginBottom: 16,
    },
    inactiveText: {
        fontSize: 24,
        color: '#666',
        fontWeight: '600',
        marginBottom: 8,
    },
    inactiveSubtext: {
        fontSize: 14,
        color: '#444',
        textAlign: 'center',
        marginBottom: 12,
    },
    registeredCount: {
        fontSize: 12,
        color: '#00ff88',
        marginTop: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 8,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    statCardSpecial: {
        borderColor: '#00ff88',
        backgroundColor: '#00ff8811',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statValueGreen: {
        color: '#00ff88',
    },
    statValueBlue: {
        color: '#4CAF50',
    },
    statValueOrange: {
        color: '#FF9800',
    },
    statLabel: {
        fontSize: 10,
        color: '#888',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    controlsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    mainControlButton: {
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    startButton: {
        backgroundColor: '#00ff88',
    },
    stopButton: {
        backgroundColor: '#ff4444',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    mainControlButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 1,
    },
    secondaryControls: {
        flexDirection: 'row',
        gap: 8,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#333',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    logsContainer: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    logsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    logsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    clearText: {
        color: '#ff4444',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyLogs: {
        padding: 40,
        alignItems: 'center',
    },
    emptyLogsIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyLogsText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    emptyLogsSubtext: {
        color: '#444',
        fontSize: 14,
    },
    logsList: {
        flex: 1,
    },
    logCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    logLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 12,
        minWidth: 60,
        alignItems: 'center',
    },
});
