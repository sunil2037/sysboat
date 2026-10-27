// GateCameraScreen.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import useApi from '../Apis/Services/ApiConfig';
import { useFaceDetection } from '../../utils/faceDetection';
import { API_BASE_URL, API_BASE_URL2 } from '../../Apis/Services/ServerURL';
import { toast } from '../../Helper/ToastManager';
import { getFontSize } from '../../Helper/Helper';
// THRESHOLD: tune this between 0.6 - 0.8
const SIMILARITY_THRESHOLD = 0.72;
// FRAME interval for processing (ms)
const PROCESS_INTERVAL = 300; // 300ms => ~3-4 checks per second

export default function GateCameraScreen({ navigation }) {
    const devices = useCameraDevices();
    const device = devices.back || devices.front;
    const cameraRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const { sessionLoaded, detectFace, cosineSimilarity } = useFaceDetection();
    const { FaceGet } = useApi();

    // cached embeddings: [{ userId, embedding, meta }]
    const cachedEmbeddingsRef = useRef([]);
    const lastProcessedAtRef = useRef(0);
    const processingRef = useRef(false);

    useEffect(() => {
        const init = async () => {
            try {
                // 1) permission check (vision-camera handles permissions), get devices
                // 2) fetch registered users and precompute embeddings
                const resp = await FaceGet({ /* fetch all registered users */ });
                // adapt if resp structure: expected resp.data => array with image_path & userId
                const users = resp?.data || [];
                const embeddings = [];
                for (let u of users) {
                    try {
                        // If backend already returns embedding, use it directly
                        if (u.embedding) {
                            embeddings.push({ userId: u.userId || u.id, embedding: u.embedding, meta: u });
                        } else if (u.image_path) {
                            // Detect face once for each registered user image (store embedding)
                            const url = API_BASE_URL2 + u.image_path;
                            const det = await detectFace(url);
                            if (det && det.embedding) {
                                embeddings.push({ userId: u.userId || u.id, embedding: det.embedding, meta: u });
                            } else {
                                console.warn('No face detected in registered image for', u);
                            }
                        }
                    } catch (e) {
                        console.warn('Embedding load fail for user', u, e);
                    }
                }
                cachedEmbeddingsRef.current = embeddings;
            } catch (err) {
                console.warn('Failed loading registered faces', err);
                toast.error('Failed loading registered faces');
            } finally {
                setLoading(false);
            }
        };
        if (sessionLoaded) init();
    }, [FaceGet, detectFace, sessionLoaded]);

    // Basic matcher: compares one embedding -> cached embeddings and returns best match
    const findBestMatch = useCallback((embedding) => {
        const db = cachedEmbeddingsRef.current;
        let best = { score: -1, userId: null, meta: null };
        for (const rec of db) {
            const score = cosineSimilarity(embedding, rec.embedding);
            if (score > best.score) {
                best = { score, userId: rec.userId, meta: rec.meta };
            }
        }
        return best;
    }, [cosineSimilarity]);

    // Frame processing (fallback approach using takePhoto if frame-processor not setup)
    // This example uses takePhoto every PROCESS_INTERVAL ms to keep things simple and portable.
    // If you implement a VisionCamera frame processor that returns image buffers/frames,
    // call detectFace on the frame buffer instead (faster, lower-latency).
    useEffect(() => {
        let stop = false;

        const loop = async () => {
            while (!stop) {
                const now = Date.now();
                if (processingRef.current || now - lastProcessedAtRef.current < PROCESS_INTERVAL) {
                    // small sleep
                    await new Promise((r) => setTimeout(r, 50));
                    continue;
                }
                processingRef.current = true;
                lastProcessedAtRef.current = now;

                try {
                    if (!cameraRef.current) {
                        processingRef.current = false;
                        await new Promise((r) => setTimeout(r, 100));
                        continue;
                    }
                    // takePhoto - use quality and format as needed
                    const photo = await cameraRef.current.takePhoto({
                        qualityPrioritization: 'speed',
                        skipMetadata: true,
                    });

                    // convert to uri (photo.path) for detectFace (vision-camera returns file path)
                    const uri = 'file://' + photo.path;

                    const det = await detectFace(uri);
                    if (det && det.embedding) {
                        // find best match
                        const best = findBestMatch(det.embedding);
                        if (best.score >= SIMILARITY_THRESHOLD) {
                            // Matched
                            toast.success(`Welcome: ${best.userId} (${Math.round(best.score * 100)}%)`);
                            // TODO: mark attendance via API call if required
                            // await markAttendance(best.userId);

                            // If many employees entering in quick succession, you may want
                            // to add a short ignore window for the same detected user.
                        } else {
                            // optionally show red unauthorized
                        }
                    } else {
                        // no face detected
                        // console.log('no face in frame');
                    }
                } catch (err) {
                    console.warn('Gate loop error', err);
                } finally {
                    processingRef.current = false;
                }
            }
        };

        if (!loading) {
            stop = false;
            loop();
        }

        return () => {
            stop = true;
        };
    }, [loading, detectFace, findBestMatch]);

    if (loading || !device) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Loading gate system...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                ref={cameraRef}
                photo={true}
            />
            <View style={styles.overlay}>
                <Text style={styles.title}>Gate Camera</Text>
                <Text style={styles.subtitle}>Detecting faces — threshold {SIMILARITY_THRESHOLD}</Text>

                <TouchableOpacity
                    onPress={() => {
                        // simple refresh embeddings from server
                        Alert.alert('Reload embeddings', 'Reloading registered face embeddings not implemented in UI.');
                    }}
                    style={styles.reloadBtn}>
                    <Text style={{ color: 'white' }}>Reload Embeddings</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    overlay: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 10,
    },
    title: { color: 'white', fontSize: 22, fontWeight: '700' },
    subtitle: { color: 'white', marginTop: 6, opacity: 0.9 },
    reloadBtn: {
        marginTop: 12,
        backgroundColor: '#CA282C',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
});
