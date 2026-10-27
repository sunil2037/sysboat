import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { bottomHeight } from './Helper';
import { Correct, Cross } from './IconsLoad';
import showTimePicker from '../utils/TimePicker';

export const DateTimePickerComponent = ({
  visible,
  setVisible,
  onChange,
  modetype = 'date',
  value,
}) => {
  const [date, setDate] = useState(value || new Date());

  useEffect(() => {
    if (value) setDate(value);
  }, [value]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !visible) return;

    const show = async () => {
      try {
        if (modetype === 'time') {
          const result = await showTimePicker({
            title: 'Select Time',
            hour: date.getHours(),
            minute: date.getMinutes(),
            inputMode: 'clock',
            is24Hour: false,
          });

          if (result) {
            const updated = new Date(date);
            updated.setHours(result.hour);
            updated.setMinutes(result.minute);
            updated.setSeconds(0);
            setDate(updated);
            onChange(updated);
          }
        }
      } catch (e) {
        console.error('TimePicker error:', e);
      } finally {
        setVisible(false);
      }
    };

    if (modetype === 'time') show();
  }, [visible]);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setVisible(false);
        return;
      }
      if (selectedDate) {
        setDate(selectedDate);
        onChange(selectedDate);
      }
      setVisible(false);
      return;
    }

    if (selectedDate) setDate(selectedDate);
  };

  const handleConfirm = () => {
    onChange(date);
    setVisible(false);
  };

  if (Platform.OS === 'android' && modetype === 'time') return null;

  if (Platform.OS === 'android') {
    return visible ? (
      <DateTimePicker
        value={date}
        mode={modetype}
        display="default"
        onChange={onDateChange}
      />
    ) : null;
  }

  return (
    <Modal
      statusBarTranslucent
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.pickerContainer, { paddingBottom: bottomHeight() }]}>
          <TouchableOpacity
            style={{ backgroundColor: '#262626ff', padding: 12, borderRadius: 50 }}
            onPress={() => setVisible(false)}
          >
            <Cross color="white" width={25} height={25} />
          </TouchableOpacity>

          <DateTimePicker
            value={date}
            mode={modetype}
            display="compact"
            onChange={onDateChange}
            locale="en-US"
          />

          <TouchableOpacity
            style={{
              backgroundColor: '#CA282C',
              padding: 12,
              borderRadius: 50,
              opacity: !date ? 0.5 : 1,
            }}
            onPress={handleConfirm}
            disabled={!date}
          >
            <Correct color="white" width={25} height={25} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },
});