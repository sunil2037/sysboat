import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { SwitchCamera } from './IconsLoad';
import { getFontSize } from './Helper';

const CameraCapture = ({ onCapture }) => {
  const camera = useRef(null);
  const [cameraType, setCameraType] = useState(CameraType.Front);

  const handleCapture = async () => {
    try {
      if (camera.current) {
        const photo = await camera.current.capture();
        const fileUri = photo.uri;
        onCapture(fileUri);
      }
    } catch (error) {
      Alert.alert('Capture Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.roundedCameraWrapper}>
        <Camera
          ref={camera}
          style={styles.camera}
          cameraType={cameraType}
          flashMode="off"
          focusMode="off"
          zoomMode="off"
          maxPhotoQualityPrioritization="speed"
          shutterPhotoSound
        />
      </View>
      <View style={{ position: 'absolute', bottom: 20, left: '50%', transform: [{ translateX: '-50%' }] }}>
        <TouchableOpacity onPress={handleCapture} style={styles.captureButton}>
          <View style={{ width: 80, height: 80, borderRadius: 50, backgroundColor: 'transparent', borderWidth: 5, justifyContent: 'center', alignItems: 'center', borderColor: 'white' }}>
            <View style={{ width: 60, height: 60, borderRadius: 50, backgroundColor: 'white' }} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ position: 'absolute', bottom: 30, right: 20 }}>
        <TouchableOpacity onPress={() => {
          setCameraType(prevType =>
            prevType === CameraType.Back ? CameraType.Front : CameraType.Back
          );
        }} style={styles.switchbutton}>
          <SwitchCamera color={'white'} width={25} height={25} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CameraCapture;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundedCameraWrapper: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  captureButton: {
    marginTop: 20,
    borderRadius: 50,
    width: 70, height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchbutton: {
    marginTop: 20,
    backgroundColor: '#1C1C1C',
    borderRadius: 50,
    width: 50, height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
  },
});
