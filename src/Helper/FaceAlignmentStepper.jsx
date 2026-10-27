import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { CameraType } from 'react-native-camera-kit';
import { getFontSize } from './Helper';
const { width } = Dimensions.get('window');

const FaceAlignmentStepper = ({ visible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [cameraType, setCameraType] = useState(CameraType.Front);

  const steps = [
    {
      title: 'Position Your Face',
      description: 'Make sure your face is centered within the frame',
      visual: <View style={styles.faceOutline} />,
    },
    {
      title: 'Align Horizontally',
      description: 'Keep your eyes level with the horizontal guide',
      visual: (
        <View style={styles.guideContainer}>
          <View style={styles.horizontalLine} />
          <View style={styles.faceOutline} />
        </View>
      ),
    },
    {
      title: 'Proper Distance',
      description: 'Move closer until the oval fits your face',
      visual: <View style={[styles.faceOutline, { borderColor: 'yellow' }]} />,
    },
    {
      title: 'Good Lighting',
      description: 'Ensure your face is evenly lit without shadows',
      visual: <View style={styles.faceOutline} />,
    },
  ];

  const toggleCamera = () => {
    setCameraType(prev =>
      prev === CameraType.Back ? CameraType.Front : CameraType.Back
    );
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      console.warn('sdfsdf');
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera Preview Area */}
      <View style={styles.cameraContainer}>
        {steps[currentStep].visual}

        {/* Camera Switch Button */}
        {/* <TouchableOpacity
          onPress={toggleCamera}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {cameraType === CameraType.Back ? '↻ Front' : '↻ Back'}
          </Text>
        </TouchableOpacity> */}
      </View>

      <View style={styles.stepperContainer}>
        <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
        <Text style={styles.stepDescription}>{steps[currentStep].description}</Text>

        <View style={styles.progressBar}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.activeDot,
                index < currentStep && styles.completedDot,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={prevStep} style={styles.navButton}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={nextStep}
            style={[
              styles.navButton,
              styles.primaryButton,
              currentStep === steps.length - 1 && { backgroundColor: 'green' },
            ]}
          >
            <Text style={styles.buttonText}>
              {currentStep === steps.length - 1 ? 'Start Verification' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    height: '100%',
    width: '100%',
    paddingHorizontal: 15,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOutline: {
    width: width * 0.7,
    height: width * 0.9,
    borderRadius: width * 0.45,
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
    marginTop: 100,
  },
  guideContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalLine: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    position: 'absolute',
    top: '50%',
  },
  switchButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
  },
  switchText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  stepperContainer: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
  },
  stepTitle: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    marginBottom: 5,
  },
  stepDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'Poppins-Medium',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: 'white',
    transform: [{ scale: 1.3 }],
  },
  completedDot: {
    backgroundColor: '#4CAF50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: 'rgba(206, 206, 206, 0.74)',
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    lineHeight: 20,
  },
});

export default FaceAlignmentStepper;
