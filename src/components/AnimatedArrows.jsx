import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated,Image } from 'react-native';
import { RightIcon } from '../Helper/IconsLoad';
import vector1 from '../../assets/Icon/Vector1.png';
import vector2 from '../../assets/Icon/Vector2.png';
import vector3 from '../../assets/Icon/Vector3.png';


const AnimatedArrows = () => {
  const arrow1Opacity = useRef(new Animated.Value(0.1)).current;
  const arrow2Opacity = useRef(new Animated.Value(0.2)).current;
  const arrow3Opacity = useRef(new Animated.Value(0.3)).current;

  const arrow1TranslateX = useRef(new Animated.Value(-10)).current; // Initial offset
  const arrow2TranslateX = useRef(new Animated.Value(-5)).current;  // Initial offset
  const arrow3TranslateX = useRef(new Animated.Value(0)).current;   // No initial offset

  useEffect(() => {
    const animateArrows = () => {
      const createFadeIn = (opacityValue, translateValue) => {
        return Animated.parallel([
          Animated.timing(opacityValue, {
            toValue: 1,
            duration: 300,  // Adjust timing as needed
            useNativeDriver: true, // For performance
          }),
          Animated.timing(translateValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]);
      };

      const createFadeOut = (opacityValue, translateValue) => {
          return Animated.parallel([
            Animated.timing(opacityValue, {
              toValue: 0,
              duration: 300, // Adjust timing as needed
              useNativeDriver: true,
            }),
            Animated.timing(translateValue, {
              toValue: 10,  // Move off-screen to reset
              duration: 300,
              useNativeDriver: true,
            }),
          ]);
      };

      Animated.loop(
        Animated.sequence([
          createFadeIn(arrow1Opacity, arrow1TranslateX),
          createFadeOut(arrow1Opacity, arrow1TranslateX),

          createFadeIn(arrow2Opacity, arrow2TranslateX),
          createFadeOut(arrow2Opacity, arrow2TranslateX),

          createFadeIn(arrow3Opacity, arrow3TranslateX),
          createFadeOut(arrow3Opacity, arrow3TranslateX),
        ])
      ).start();
    };

    animateArrows(); // Start the animation on mount
  }, []);

  const arrowStyle = {
    width: 10, // Adjust as needed
    height: 10, // Adjust as needed
    resizeMode: 'contain', // If using images
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[arrowStyle, { opacity: arrow1Opacity, transform: [{ translateX: arrow1TranslateX }] }]}>
         <Image source={ vector1 } style={{  }} />
      </Animated.View>
      <Animated.View style={[arrowStyle, { opacity: arrow2Opacity, transform: [{ translateX: arrow2TranslateX }] }]}>
      <Image source={vector3 } style={{  }} />

      </Animated.View>
      <Animated.View style={[arrowStyle, { opacity: arrow3Opacity, transform: [{ translateX: arrow3TranslateX }] }]}>
      <Image source={ vector2 } style={{  }} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // Arrange arrows horizontally
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
    height:54,
    width:54,
    borderRadius:50,
  },
  arrow: { // Basic arrow styling - replace with your arrows
    backgroundColor: 'gray',
    marginHorizontal: 5,
  },
  arrow1: { backgroundColor: 'lightgray' },
  arrow2: { backgroundColor: 'gray' },
  arrow3: { backgroundColor: 'darkgray' },
});

export default AnimatedArrows;
