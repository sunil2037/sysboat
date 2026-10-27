import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getFontSize } from './Helper';
export default function UploadResult({ result }) {
  return (
    <View style={styles.container}>
      <Text style={result.correct ? styles.correct : styles.incorrect}>
        {result.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20, padding: 10 },
  correct: { color: 'green', fontSize: 18 },
  incorrect: { color: 'red', fontSize: 18 },
});
