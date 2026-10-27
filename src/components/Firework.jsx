// Firework.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange', 'cyan'];

const PARTICLE_COUNT = 500;

const Firework = () => {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: new Animated.Value(width / 2),
      y: new Animated.Value(height / 2),
      opacity: new Animated.Value(1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: Math.random() * 2 * Math.PI,
      distance: 200 + Math.random() * 100,
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map(p => {
      const dx = Math.cos(p.angle) * p.distance;
      const dy = Math.sin(p.angle) * p.distance;

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: width / 2 + dx,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: height / 2 + dy,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(50, animations).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {particles.map((p, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: p.color,
            opacity: p.opacity,
            zIndex:9999,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
            ],
          }}
        />
      ))}
    </View>
  );
};

export default Firework;
