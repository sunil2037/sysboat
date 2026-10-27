import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { showDateRangePicker } from '../utils/DateRangePicker';
import { Calendar, CalendarIcon } from './IconsLoad';
const DateRangePick = ({ rangeDate, selectedRange, single = false, maxDate = false }) => {

  const hasRange =
    selectedRange &&
    !Array.isArray(selectedRange) &&
    selectedRange.startDate &&
    selectedRange.endDate;

  const openPicker = async () => {
    try {
      const options = {
        title: 'Select Date Range',
        inputMode: 'calendar',
      };
      if (hasRange) {
        options.startDate = selectedRange.startDateMs;
        options.endDate = selectedRange.endDateMs;
      }
      if (single) {
        options.single = true;
      }

      if (maxDate) {
        options.maxDate = Date.now();
      }

      const result = await showDateRangePicker(options);
      rangeDate(result);
    } catch (e) {
      if (e.code !== 'CANCELLED') {
        console.error('DateRangePicker error:', e);
      }
    }
  };

  const handleClear = () => {
    rangeDate([]);
  };

  return (
    <View>
      <Text style={styles.header}>Select date range</Text>

      <TouchableOpacity style={styles.pickerButton} onPress={openPicker}>
        <Text style={hasRange ? styles.pickerTextFilled : styles.pickerTextPlaceholder}>
          {hasRange
            ? `${selectedRange.startDate}  /  ${selectedRange.endDate}`
            : 'Tap to select dates'}
        </Text>
        <CalendarIcon />
      </TouchableOpacity>

      {hasRange && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear dates</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    color: '#293646',
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    marginBottom: 10,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
  },
  pickerTextPlaceholder: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#AAAAAA',
    flex: 1,
  },
  pickerTextFilled: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#293646',
    flex: 1,
  },
  icon: {
    fontSize: 18,
    marginLeft: 8,
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  clearText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#CA282C',
  },
});

export default DateRangePick;