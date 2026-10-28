import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheetBase from '../Helper/BottomSheetBase';
import { AlertIcon } from '../Helper/IconsLoad';
import ThemedText from '../Helper/ThemedText';

const LogoutBottomSheet = ({ visible, onClose, onConfirm }) => {
  return (
    <BottomSheetBase
      visible={visible}
      onClose={onClose}
      snapPoints={['40%']}
      isScrollView={false}>
      <View style={styles.logoutSheetContent} testID="logout-bottom-sheet-content">
        <View style={styles.logoutSheetIconContainer}>
          <AlertIcon width={32} height={32} color="#CA282C" />
        </View>

        <ThemedText size="xl" weight="SemiBold" align="center" style={{ marginTop: 12 }}>
          Log Out
        </ThemedText>

        <ThemedText
          size="sm"
          weight="Regular"
          color="secondary"
          align="center"
          style={{ marginTop: 6, paddingHorizontal: 20, lineHeight: 20 }}>
          Are you sure you want to log out? You will need to sign in again to access your account.
        </ThemedText>

        <View style={styles.logoutSheetBtnContainer}>
          <TouchableOpacity
            testID="logout-confirm-btn"
            activeOpacity={0.8}
            style={styles.logoutConfirmBtn}
            onPress={onConfirm}>
            <ThemedText customSize={15} weight="SemiBold" color="inverse">
              Yes, Log Out
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            testID="logout-cancel-btn"
            activeOpacity={0.8}
            style={styles.logoutCancelBtn}
            onPress={onClose}>
            <ThemedText customSize={15} weight="Medium" color="secondary">
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetBase>
  );
};

export default LogoutBottomSheet;

const styles = StyleSheet.create({
  logoutSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoutSheetIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutSheetBtnContainer: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  logoutConfirmBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CA282C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#CA282C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  logoutCancelBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

