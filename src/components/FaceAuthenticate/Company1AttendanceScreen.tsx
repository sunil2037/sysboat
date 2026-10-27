import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native';
import FaceRecognition from './FaceRecognition';
import { bottomHeight, getFontSize, SCREEN_WIDTH } from '../../Helper/Helper';
import { useAuth } from '../../Context/AuthContext';
import FaceCameraViews from './FaceCameraView';
import FaceRecognitionEx from './FaceRecognition/FaceRecognitionEx';

type RecognitionStatus = 'initializing' | 'ready' | 'verifying' | 'verified' | 'error' | 'fake';

const Company1AttendanceScreen: React.FC = () => {
  const { profileData } = useAuth();
  const [status, setStatus] = useState<RecognitionStatus>('initializing');
  const [recognizedName, setRecognizedName] = useState<string>('');
  const [serverEmbeddings, setServerEmbeddings] = useState([]);

  useEffect(() => {
    if (profileData) {
      setServerEmbeddings([{ name: profileData?.data?.[0]?.first_name, embeddings: JSON.parse(profileData?.embeddings), employeeId: "105" }])
    }
  }, [profileData])



  // const initializeSystem = useCallback(async () => {
  //   try {
  //     setStatus('verifying');
  //     await FaceRecognition.initialize();
  //     setStatus('ready');
  //   } catch (error: any) {
  //     console.error('Initialization Error:', error);
  //     setStatus('error');
  //     Alert.alert('Initialization Failed', error?.message || 'Unable to initialize face recognition.');
  //   }
  // }, []);

  // useEffect(() => {
  //   initializeSystem();

  //   return () => {
  //     try {
  //       FaceRecognition.removeAllListeners?.();
  //     } catch (err) {
  //       console.warn('Cleanup error:', err);
  //     }
  //   };
  // }, [initializeSystem]);

  const handleFaceRecognized = useCallback((event: any) => {
    if (!event) return;

    const { recognized, distance, name } = event;

    if (!recognized) {
      setStatus('fake');
      return;
    }



    if (recognized && status !== 'verified') {
      Vibration.vibrate(100);
      setRecognizedName(name || 'Employee');
      setStatus('verified');

      setTimeout(() => setStatus('ready'), 3000);
    }
  }, [status]);


  // if (status === 'initializing' || status === 'verifying') {
  //   return (
  //     <View style={styles.centerContent}>
  //       <ActivityIndicator size="large" color="#007AFF" />
  //       <Text style={styles.statusText}>
  //         {status === 'initializing' ? 'Initializing Face Recognition...' : 'Setting things up...'}
  //       </Text>
  //     </View>
  //   );
  // }

  // Error state
  if (status === 'error') {
    return (
      <View style={styles.centerContent}>
        <Text style={[styles.statusText, { color: '#FF3B30' }]}>Initialization Failed</Text>
        <Text style={styles.retryText} onPress={initializeSystem}>
          Tap to Retry
        </Text>
      </View>
    );
  }

  // Main UI
  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>Face Recognition</Text>
        <Text style={styles.subtitle}>Please look into the camera and hold still</Text>
      </View> */}

      <View style={styles.cameraContainer}>
        {/* <FaceCameraViews
          cameraType="front"
          enableFaceDetection={true}
          onFaceRecognized={handleFaceRecognized}
          serverEmbeddings={serverEmbeddings}
          autoRecognize={true}
          recognitionInterval={1000}
        /> */}
        <FaceRecognitionEx serverEmbeddings={serverEmbeddings} />
      </View>

      <View style={[styles.statusContainer, { marginBottom: bottomHeight() }]}>
        {status === 'ready' && <StatusBadge color="#E3E3E3" text="Waiting for face..." />}
        {status === 'verified' && <StatusBadge color="#16ef1e" text={`Welcome, ${recognizedName}!`} />}
        {status === 'fake' && <StatusBadge color="#FF3B30" text="You are not authorized person." />}
        {status === 'verifying' && <StatusBadge color="#007AFF" text="Please wait..." />}
      </View>

    </View>
  );
};

const StatusBadge = ({ color, text }: { color: string; text: string }) => (
  <View style={[styles.statusBadge, { backgroundColor: color }]}>
    <Text style={styles.statusBadgeText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  statusText: {
    fontFamily: 'Poppins-Medium',
    color: '#555',
    fontSize: 16,
    marginTop: 16,
  },
  retryText: {
    fontFamily: 'Poppins-Medium',
    color: '#007AFF',
    fontSize: 14,
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 26,
    color: '#000',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    borderRadius: 50,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  statusBadgeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
  },
});

export default Company1AttendanceScreen;
