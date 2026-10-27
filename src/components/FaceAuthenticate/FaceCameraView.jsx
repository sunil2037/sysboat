// import React, { useEffect, useRef, useState } from 'react';
// import {
//     requireNativeComponent,
//     UIManager,
//     findNodeHandle,
//     NativeModules,
//     NativeEventEmitter,
//     Platform,
//     View,
//     StyleSheet,
//     Text,
// } from 'react-native';
// import { Button } from 'react-native-paper';
// import { SCREEN_WIDTH } from '../../Helper/Helper';
// import FaceRecognition from './FaceRecognition';

// const COMPONENT_NAME = 'FaceRecognitionCameraView';
// const FaceRecognitionCameraViewNative = requireNativeComponent(COMPONENT_NAME);
// const { FaceRecognitionModule } = NativeModules;
// const eventEmitter = new NativeEventEmitter(FaceRecognitionModule);

// export default function FaceCameraViews({
//     style,
//     cameraType = 'front',
//     enableFaceDetection = true,
//     onFaceDetected,
//     onFaceRecognized,
//     serverEmbeddings = [],
//     autoRecognize = true,
//     recognitionInterval = 1000,
//     distanceThreshold = 1.0,
// }) {
//     const ref = useRef(null);
//     const [isRecognizing, setIsRecognizing] = useState(false);
//     const [recognitionResult, setRecognitionResult] = useState(null);
//     const isLoadedRef = useRef(false);

//     useEffect(() => {
//         const loadServerEmbeddings = async () => {
//             if (serverEmbeddings.length === 0 || isLoadedRef.current) return;

//             try {
//                 console.log('Loading server embeddings...');

//                 await FaceRecognition.clearAllFaces();

//                 await FaceRecognition.setDistance(distanceThreshold);
//                 console.log(`Distance threshold set to: ${distanceThreshold}`);

//                 for (const face of serverEmbeddings) {
//                     await FaceRecognition.addFaceFromServer(
//                         face.name,
//                         face.employeeId,
//                         face.embeddings
//                     );
//                 }

//                 isLoadedRef.current = true;
//                 console.log(`Loaded ${serverEmbeddings.length} faces from server`);
//             } catch (error) {
//                 console.error('Error loading server embeddings:', error);
//             }
//         };

//         loadServerEmbeddings();
//     }, [serverEmbeddings, distanceThreshold]);

//     useEffect(() => {
//         const recognitionListener = eventEmitter.addListener('onFaceRecognized', (event) => {
//             console.log('✅ Face Recognized Event:', event);
//             setRecognitionResult(event);
//             if (onFaceRecognized) {
//                 onFaceRecognized(event);
//             }
//         });

//         const notRecognizedListener = eventEmitter.addListener('onFaceNotRecognized', (event) => {
//             console.log('❌ Face Not Recognized Event:', event);
//             setRecognitionResult({ recognized: false });
//         });

//         const noFaceListener = eventEmitter.addListener('onNoFace', () => {
//             console.log('👤 No Face Detected');
//             setRecognitionResult(null);
//         });

//         return () => {
//             recognitionListener.remove();
//             notRecognizedListener.remove();
//             noFaceListener.remove();
//         };
//     }, [onFaceRecognized]);


//     useEffect(() => {
//         console.log('Commands available:', UIManager.getViewManagerConfig(COMPONENT_NAME)?.Commands);
//     }, []);

//     useEffect(() => {
//         const sub = eventEmitter.addListener('onFacesDetected', (event) => {
//             console.log("Face Detected", event);
//             if (onFaceDetected) onFaceDetected(event);
//         });
//         return () => sub.remove();
//     }, [onFaceDetected]);

//     const sendCommand = (command) => {
//         const viewId = findNodeHandle(ref.current);
//         if (!viewId) return;
//         const commands = UIManager.getViewManagerConfig(COMPONENT_NAME).Commands;

//         switch (command) {
//             case 'start':
//                 UIManager.dispatchViewManagerCommand(viewId, commands.startCamera, []);
//                 break;
//             case 'stop':
//                 UIManager.dispatchViewManagerCommand(viewId, commands.stopCamera, []);
//                 break;
//             case 'switch':
//                 UIManager.dispatchViewManagerCommand(viewId, commands.switchCamera, []);
//                 break;
//         }
//     };

//     const startCamera = () => sendCommand('start');
//     const stopCamera = () => sendCommand('stop');
//     const switchCamera = () => sendCommand('switch');

//     useEffect(() => {
//         if (Platform.OS === 'android') setTimeout(() => startCamera(), 300);
//         return () => stopCamera();
//     }, []);

//     return (
//         <View style={[styles.wrapper, style]}>
//             <View style={styles.cameraContainer}>
//                 <FaceRecognitionCameraViewNative
//                     ref={ref}
//                     style={styles.cameraView}
//                     cameraType={cameraType}
//                     enableFaceDetection={enableFaceDetection}
//                 />

//                 {/* Recognition Status Overlay */}
//                 {/* {recognitionResult && (
//                     <View style={styles.overlay}>
//                         {recognitionResult.recognized ? (
//                             <View style={styles.recognizedBox}>
//                                 <Text style={styles.recognizedText}>
//                                     ✓ {recognitionResult.name}
//                                 </Text>
//                                 {recognitionResult.employeeId && (
//                                     <Text style={styles.employeeIdText}>
//                                         ID: {recognitionResult.employeeId}
//                                     </Text>
//                                 )}
//                                 <Text style={styles.distanceText}>
//                                     Confidence: {(1 - recognitionResult.distance).toFixed(2)}
//                                 </Text>
//                             </View>
//                         ) : (
//                             <View style={styles.notRecognizedBox}>
//                                 <Text style={styles.notRecognizedText}>
//                                     ✗ Not Recognized
//                                 </Text>
//                             </View>
//                         )}
//                     </View>
//                 )} */}

//                 {isRecognizing && !recognitionResult && (
//                     <View style={styles.scanningOverlay}>
//                         <Text style={styles.scanningText}>Scanning...</Text>
//                     </View>
//                 )}
//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     wrapper: {
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     cameraContainer: {
//         width: SCREEN_WIDTH - 100,
//         height: SCREEN_WIDTH - 100,
//         borderRadius: (SCREEN_WIDTH - 100) / 2,
//         overflow: 'hidden',
//         backgroundColor: '#000',
//     },
//     cameraView: {
//         ...StyleSheet.absoluteFillObject,
//     },
//     overlay: {
//         position: 'absolute',
//         bottom: 20,
//         left: 0,
//         right: 0,
//         alignItems: 'center',
//     },
//     recognizedBox: {
//         backgroundColor: 'rgba(76, 175, 80, 0.9)',
//         paddingHorizontal: 20,
//         paddingVertical: 12,
//         borderRadius: 8,
//         alignItems: 'center',
//     },
//     recognizedText: {
//         color: '#fff',
//         fontSize: 18,
//         fontWeight: 'bold',
//     },
//     employeeIdText: {
//         color: '#fff',
//         fontSize: 14,
//         marginTop: 4,
//     },
//     distanceText: {
//         color: '#fff',
//         fontSize: 12,
//         marginTop: 4,
//         opacity: 0.9,
//     },
//     notRecognizedBox: {
//         backgroundColor: 'rgba(244, 67, 54, 0.9)',
//         paddingHorizontal: 20,
//         paddingVertical: 12,
//         borderRadius: 8,
//     },
//     notRecognizedText: {
//         color: '#fff',
//         fontSize: 16,
//         fontWeight: 'bold',
//     },
//     scanningOverlay: {
//         position: 'absolute',
//         top: 20,
//         left: 0,
//         right: 0,
//         alignItems: 'center',
//     },
//     scanningText: {
//         color: '#fff',
//         fontSize: 14,
//         backgroundColor: 'rgba(33, 150, 243, 0.8)',
//         paddingHorizontal: 16,
//         paddingVertical: 8,
//         borderRadius: 20,
//     },
// });

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const FaceCameraView = () => {
    return (
        <View>
            <Text>FaceCameraView</Text>
        </View>
    )
}

export default FaceCameraView

const styles = StyleSheet.create({})