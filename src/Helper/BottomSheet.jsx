import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import BottomSheetBase from './BottomSheetBase';
import { getFontSize } from './Helper';

const { height } = Dimensions.get('window');

const BottomSheet = ({ visible, onClose, message, description, buttons = [] }) => {
  return (
    <BottomSheetBase visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.description}>{description}</Text>
        {buttons.map((btn, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.button, btn.outline && styles.outlineButton]}
            onPress={() => {
              btn.onPress?.();
            }}
          >
            <Text style={[styles.buttonText, btn.outline && styles.outlineText]}>{btn.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheetBase>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  backdrop: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  message: {
    fontFamily: 'Poppins-Bold',
    fontSize: 25,
    color: '#293646',
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#6A7D94',
    textAlign: 'center',
    paddingTop: 5,
  },
  button: {
    height: 52,
    width: '90%',
    backgroundColor: '#CA282C',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'Poppins-Medium',
    color: 'white',
    fontSize: 15,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: '#CA282C',
    borderWidth: 1,
  },
  outlineText: {
    color: '#CA282C',
  },
});

export default BottomSheet;
