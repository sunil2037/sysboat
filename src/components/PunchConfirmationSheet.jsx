import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import BottomSheetBase from '../Helper/BottomSheetBase';
import ThemedText from '../Helper/ThemedText';

const PunchConfirmationSheet = ({
  visible,
  action,
  currentTime,
  onConfirm,
  onCancel,
}) => {
  const isPunchOut = action === 'out';
  const actionLabel = isPunchOut ? 'punch out' : 'punch in';

  return (
    <BottomSheetBase
      visible={visible}
      onClose={onCancel}
      isSnapPoint
      isScrollView={false}
      snapPoints={['48%']}
    >
      <View testID="punch-confirmation-content" style={styles.content}>
        <View style={styles.indicator} />
        <ThemedText size="lg" weight="SemiBold" align="center">
          Confirm {actionLabel}
        </ThemedText>
        <ThemedText size="sm" weight="Regular" color="secondary" align="center">
          {isPunchOut
            ? 'You are about to stop your work time.'
            : 'You are about to start your work time.'}
        </ThemedText>
        <ThemedText size="sm" weight="Medium" align="center">
          {currentTime}
        </ThemedText>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Confirm ${actionLabel}`}
          onPress={onConfirm}
          style={styles.confirmButton}
        >
          <ThemedText size="sm" weight="SemiBold" color="inverse">
            Confirm {actionLabel}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cancel punch"
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <ThemedText size="sm" weight="Medium">Cancel</ThemedText>
        </TouchableOpacity>
      </View>
    </BottomSheetBase>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  indicator: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7C7C7',
    marginBottom: 4,
  },
  confirmButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#CA282C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PunchConfirmationSheet;
