import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import useApi from '../Apis/Services/ApiConfig';
import BottomSheetBase from './BottomSheetBase';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { bottomHeight, SCREEN_WIDTH, SystemOS } from './Helper';
import ThemedText from './ThemedText';

const colorMap = {
  green: '#5CB338',
  yellow: '#FFC145',
  red: '#CA282C',
};
const colorKeys = Object.keys(colorMap);
const STATUS = { green: 1, yellow: 2, red: 3 };
const WeekDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const validationSchema = Yup.object().shape({
  ruleName: Yup.string().required('Rule Type is required'),
});

const BottomSheetEditWorkWeek = ({
  visible,
  onClose,
  updateRuleData,
  isPending,
  selectedRuleId,
}) => {
  const { WorkWeekDetailsFetch } = useApi();
  const { userdata } = useEncodedUserData();

  const [grid, setGrid] = useState(
    Array(5)
      .fill(null)
      .map(() => Array(7).fill('green')),
  );

  useEffect(() => { }, [isPending, selectedRuleId]);

  const handlePress = (week, day) => {
    Vibration.vibrate(100);
    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      const currentIndex = colorKeys.indexOf(newGrid[week][day]);
      const nextIndex = (currentIndex + 1) % colorKeys.length;
      newGrid[week][day] = colorKeys[nextIndex];
      console.warn(
        `Week: ${week + 1}, Day: ${day + 1}, Status: ${STATUS[newGrid[week][day]]
        }`,
      );
      return [...newGrid];
    });
  };

  const transformGridData = () => {
    return grid.map((week, weekIndex) => {
      const weekData = { week: weekIndex + 1 };
      week.forEach((dayStatus, dayIndex) => {
        weekData[WeekDay[dayIndex]] = STATUS[dayStatus];
      });
      return weekData;
    });
  };

  const handleSubmit = values => {
    const transformedGrid = transformGridData();
    const payload = {
      description: values.description,
      Week: JSON.stringify(transformedGrid),
      rule_name: values.ruleName,
    };
    updateRuleData(payload);
  };

  const {
    isPending: WorkWeekDetailsFetchDataPending,
    isLoading: WorkWeekDetailsFetchDataLoading,
    data: WorkWeekDetailsFetchData,
    refetch,
  } = useQuery({
    queryKey: ['WorkWeekDetailsFetch', userdata, selectedRuleId],
    queryFn: () =>
      WorkWeekDetailsFetch({
        userData: userdata,
        type: 'WorkWeek',
        Id: selectedRuleId,
      }),
    enabled: !!userdata && !!selectedRuleId && !!visible,
  });

  useEffect(() => {
    if (WorkWeekDetailsFetchData?.data?.[0]) {
      const fetchedData = WorkWeekDetailsFetchData.data[0];
      const newGrid = Array(5)
        .fill(null)
        .map((_, weekIndex) => {
          return WeekDay.map((day, dayIndex) => {
            const key = `${day.toLowerCase()}${weekIndex + 1}`;
            const statusValue = fetchedData[key];
            const colorKey = Object.keys(STATUS).find(
              k => STATUS[k] === statusValue,
            );
            return colorKey || 'green';
          });
        });
      setGrid(newGrid);
    }
  }, [WorkWeekDetailsFetchData]);

  return (
    <BottomSheetBase visible={visible} onClose={onClose}>
      <Formik
        enableReinitialize
        initialValues={{
          ruleName: WorkWeekDetailsFetchData?.data[0]?.rule_name || '',
          description: WorkWeekDetailsFetchData?.data[0]?.description || '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}>
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <View style={{ gap: 5, paddingBottom: bottomHeight() }}>
            <ThemedText size='md' weight='Medium'>
              Rule Type
            </ThemedText>
            <TextInput
              placeholder="Rule Name"
              value={values.ruleName}
              onChangeText={handleChange('ruleName')}
              onBlur={handleBlur('ruleName')}
              placeholderTextColor="#6A7D94"
              style={[styles.input, { lineHeight: SystemOS() ? 15 : 0 }]}
            />
            {touched.ruleName && errors.ruleName && (
              <ThemedText size='xs' weight='Regular' color='error'>
                {errors.ruleName}
              </ThemedText>
            )}
            <ThemedText size='md' weight='Medium' style={{ marginTop: 10 }}>
              Description
            </ThemedText>
            <TextInput
              multiline={true}
              numberOfLines={10}
              placeholder="Description"
              value={values.description}
              onChangeText={handleChange('description')}
              onBlur={handleBlur('description')}
              placeholderTextColor="#6A7D94"
              style={[styles.input, { height: 120, textAlignVertical: 'top', lineHeight: SystemOS() ? 8 : 0 }]}
            />
            <View
              style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              {WorkWeekDetailsFetchDataLoading ||
                WorkWeekDetailsFetchDataPending ? (
                <ActivityIndicator size={30} color={'black'} />
              ) : (
                grid.map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.row}>
                    {week.map((color, dayIndex) => (
                      <View key={dayIndex}>
                        {weekIndex < 1 && (
                          <ThemedText size='xs' align='center' weight='SemiBold'>
                            {WeekDay[dayIndex]}
                          </ThemedText>
                        )}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                          {/* {dayIndex < 1 && (
                            <Text
                              style={{
                                textAlign: 'center',
                                fontFamily: 'Poppins-Regular',
                                paddingRight: 10,
                              }}>
                              {weekIndex + 1}
                            </Text>
                          )} */}
                          <TouchableOpacity
                            style={[
                              styles.box,
                              {
                                backgroundColor: colorMap[color],
                                width: SCREEN_WIDTH / 10,
                                height: SCREEN_WIDTH / 10,
                              },
                            ]}
                            onPress={() => handlePress(weekIndex, dayIndex)}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 20,
                paddingTop: 20,
              }}>
              <View style={[
                styles.subtitle,
                { backgroundColor: colorMap.green, },
              ]}>
                <ThemedText size='xs' align='center' weight='Medium' color="inverse">
                  Working Day
                </ThemedText>
              </View>
              <View style={[
                styles.subtitle,
                { backgroundColor: colorMap.yellow, },
              ]}>
                <ThemedText size='xs' align='center' weight='Medium'>
                  Half Day
                </ThemedText>
              </View>
              <View style={[
                styles.subtitle,
                { backgroundColor: colorMap.red, },
              ]}>
                <ThemedText size='xs' align='center' weight='Medium' color='inverse'>
                  Weekly off
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              disabled={isPending}
              style={styles.submitButton}
              onPress={handleSubmit}>
              {isPending ? (
                <ActivityIndicator size={25} color={'white'} />
              ) : (
                <ThemedText size='md' align='center' weight='Medium' color='inverse'>
                  Save
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </BottomSheetBase >
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
  subtitle: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 20,
    lineHeight: 15,
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
    marginTop: 70,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  input: {
    position: 'relative',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderColor: '#E2E2E2',
    height: 57,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6A7D94',
    justifyContent: 'center',
    width: '100%',
  },
  content: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  box: {
    borderRadius: 5,
  },
  submitButton: {
    height: 52,
    backgroundColor: '#CA282C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  submitText: {
    fontFamily: 'Poppins-Medium',
    color: 'white',
    fontSize: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default BottomSheetEditWorkWeek;
