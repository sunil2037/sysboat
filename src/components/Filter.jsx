import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Cross } from '../Helper/IconsLoad';
import { Card } from '../Helper/Card';
import DateRangePick from '../Helper/DateRangePick';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import base64 from 'base-64';
import useApi from '../Apis/Services/ApiConfig';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT, SystemOS } from '../Helper/Helper';
import CustomCalendar from '../utils/CustomCalendar';

export const Filter = ({
  filterMaxDate = false,
  modalVisible,
  onModalClose,
  filterDate,
  filterLeaveType,
  hideFilterLeaveTypeSection,
}) => {
  const { userdata } = useEncodedUserData();
  const [selectedId, setSelectedId] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [totalActiveFilter, setTotalActiveFilter] = useState(0);
  const { FetchLeaveCount } = useApi();

  const updateTotalActiveFilter = () => {
    let activeFilterCount = 0;

    if (dateRange.startDate || dateRange.endDate) {
      activeFilterCount += 1;
    }

    if (selectedId !== null) {
      activeFilterCount += 1;
    }

    setTotalActiveFilter(activeFilterCount);
  };

  useEffect(() => {
    updateTotalActiveFilter();
  }, [dateRange, selectedId]);

  const handleApplyFilters = async () => {
    if (!hideFilterLeaveTypeSection) {
      filterLeaveType(selectedId);
    }
    filterDate(dateRange);
    await saveFiltersToStorage();
    onModalClose();
  };

  const saveFiltersToStorage = async () => {
    try {
      const filterData = {
        selectedId,
        dateRange,
      };
      await AsyncStorage.setItem('selectedFilters', JSON.stringify(filterData));
    } catch (error) {
      console.warn('Error saving filters to AsyncStorage:', error);
    }
  };

  const loadFiltersFromStorage = async () => {
    try {
      const storedFilters = await AsyncStorage.getItem('selectedFilters');
      if (storedFilters) {
        const { selectedId, dateRange } = JSON.parse(storedFilters);
        setSelectedId(selectedId);
        setDateRange(dateRange);
      }
    } catch (error) {
      console.warn('Error loading filters from AsyncStorage:', error);
    }
  };

  const handleClearFilters = async () => {
    setSelectedId(null);
    setDateRange([]);
    try {
      await AsyncStorage.removeItem('selectedFilters');
    } catch (error) {
      console.warn('Error clearing filters from AsyncStorage:', error);
    }
  };

  const handlePress = id => {
    setSelectedId(id);
  };

  const handleDateRange = value => {
    setDateRange(value);
  };

  const {
    data: leaveCountData,
    isLoading: isLeaveCountLoading,
    isError: isLeaveCountError,
  } = useQuery({
    queryKey: ['FetchLeaveCount', userdata],
    queryFn: () => FetchLeaveCount({ userData: userdata }),
    enabled: !!userdata,
  });

  useEffect(() => {
    const removeFiltersOnAppClose = () => {
      handleClearFilters();
    };
    return () => {
      removeFiltersOnAppClose();
    };
  }, []);

  return (
    <View>
      <Modal
        statusBarTranslucent={true}
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          onModalClose(false);
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: STATUS_BAR_HEIGHT(),
            paddingHorizontal: 15,
            paddingBottom: 15,
          }}>
          <TouchableOpacity
            onPress={() => {
              onModalClose(false);
            }}>
            <Cross width={25} height={25} />
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: 'Poppins-Medium',
              color: '#293646',
              fontSize: 20,
              lineHeight: SystemOS() ? 20 : 0,
            }}>
            Filters
          </Text>
          <TouchableOpacity onPress={handleClearFilters}>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                color: '#293646',
                fontSize: 15,
                lineHeight: 20,
              }}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 15, paddingBottom: bottomHeight(), flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ gap: 30 }}>

            <View>
              {Platform.OS == 'android' ? (

                <DateRangePick
                  maxDate={filterMaxDate}
                  rangeDate={handleDateRange}
                  selectedRange={dateRange}
                />
              ) : (
                <CustomCalendar maxDate={filterMaxDate}
                  rangeDate={handleDateRange}
                  selectedRange={dateRange} />
              )}

            </View>
            {!hideFilterLeaveTypeSection && (
              <View>
                <Text style={styles.header}>Select leave type</Text>
                <View style={{ paddingTop: 15 }}>
                  {leaveCountData?.records?.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.columnStyle,
                        selectedId === item.leave_rule_id && styles.selectedStyle,
                      ]}
                      onPress={() => handlePress(item.leave_rule_id)}>
                      <Text style={styles.title}>{item.leave_type || ''}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity
            onPress={handleApplyFilters}
            style={{
              height: 52,
              backgroundColor: '#CA282C',
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 25,
            }}>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                color: 'white',
                fontSize: 15,
                lineHeight: SystemOS() ? 15 : 0,
              }}>
              Apply Filter
              {totalActiveFilter != 0 && ` (${totalActiveFilter})`}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    color: '#293646',
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    color: '#293646',
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  columnStyle: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E2E2',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  selectedStyle: {
    backgroundColor: '#FFF2F2',
  },
});
