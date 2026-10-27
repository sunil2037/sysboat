import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AlertIcon } from './IconsLoad';
import { getFontSize } from './Helper';
import ThemedText from './ThemedText';
import { SCREEN_WIDTH } from '@gorhom/bottom-sheet';
export const Popup = ({ isVisible, message, onConfirm, onCancel }) => {
  return (
    <Modal
      useNativeDriver backdropTransitionOutTiming={0} hideModalContentWhileAnimating={true}
      statusBarTranslucent={true}
      propagateSwipe={true}
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <AlertIcon width={70} height={70} color={'red'} />
          <ThemedText size='md' weight='Regular' align='center'>{message}</ThemedText>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <ThemedText size='sm' weight='Regular'>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <ThemedText size='sm' weight='Regular' color='inverse'>
                Confirm
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const LogoutLoadingPopup = ({ isVisible }) => {
  return (
    <Modal
      useNativeDriver backdropTransitionOutTiming={0} hideModalContentWhileAnimating={true}
      statusBarTranslucent={true}
      propagateSwipe={true}
      transparent={true}
      animationType="fade"
      visible={isVisible}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.LogoutLoadingPopupContainer}>
            <ActivityIndicator color={'black'} />
            <Text style={styles.buttonText}>Please wait...</Text>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  LogoutLoadingPopupContainer: {
    flexDirection: 'row',
    gap: 10
  },
  modalContainer: {
    width: SCREEN_WIDTH - 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    gap: 12
  },
  messageText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#ededed',
    flex: 1,
    margin: 5,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: 'black',
  },
  buttonText: {
    color: '#000',
    fontFamily: 'Poppins-Medium',
    lineHeight: 20,
  },
  confirmButtonText: {
    color: '#fff',
  },
});

