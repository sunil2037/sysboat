import React, { useRef, useState } from 'react';
import { View, Text, Animated, PanResponder, Alert, StyleSheet, Dimensions } from 'react-native';
import { getFontSize } from '../Helper/Helper';

const SwipeRightComponent = () => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [unlocked, setUnlocked] = useState(false);
  const [opacity, setOpacity] = useState(new Animated.Value(0));
  const [showInstruction, setShowInstruction] = useState(true);
  const width = Dimensions.get('window').width;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(0, Math.min(gestureState.dx, 250));
        translateX.setValue(newX);

        // Show instruction when swiping back to the left
        if (gestureState.dx < 50) {
          setShowInstruction(true);
          Animated.timing(opacity, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }).start();
          setUnlocked(false);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > width - 80) {
          Animated.timing(opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start();
          setUnlocked(true);
          setShowInstruction(false);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start(() => setShowInstruction(true));
        }
      },
    })
  ).current;

  const backgroundWidth = translateX.interpolate({
    inputRange: [0, 250],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={{ width: '100%', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 40, borderTopRightRadius: 20, borderTopLeftRadius: 20 }}>
        <View style={styles.track}>
          <Animated.View style={[styles.background, { width: backgroundWidth }]}>
            <Animated.Text style={[styles.statusText, { opacity }]}>
              You are clocked in
            </Animated.Text>
          </Animated.View>
          {showInstruction && (
            <Text style={styles.statusText}>Swipe right to Punch in</Text>
          )}
          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.slider, { transform: [{ translateX }] }]}
          >
            <Text style={styles.sliderText}>{unlocked ? '✔️' : '➡️'}</Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#00000099',
    position: 'absolute',
    bottom: 0,
    height: '100%',
    zIndex: 1,
    width: '100%',
  },
  track: {
    width: '100%',
    height: 70,
    backgroundColor: '#CA282C',
    borderRadius: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'green',
    borderRadius: 50,
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 12,
    textAlign: 'center',
    color: 'white',
    fontFamily: 'Poppins-Medium',
    zIndex: 1,
  },
  slider: {
    width: 54,
    height: 54,
    backgroundColor: 'white',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    marginLeft: 10,
    top: 8,
    zIndex: 2,
  },
  sliderText: {
    color: '#000',
    fontSize: 15,
  },
});

export default SwipeRightComponent;
