import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import backgroundImage from '../../../assets/Icon/background.png';
import { Back, Calendar, Cross } from '../../Helper/IconsLoad';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { DateTimePickerComponent } from '../../Helper/DateTimePicker';
import BottomSheet from '../../Helper/BottomSheet';
import { useMutation, useQuery } from '@tanstack/react-query';
import useApi from '../../Apis/Services/ApiConfig';
import CustomNativeDropdown from '../../Helper/CustomNativeDropdown';
import TopNavBar from '../../navigation/TopNavBar';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import ToastManager, { toast } from '../../Helper/ToastManager';
import { useFocusEffect } from '@react-navigation/native';
import { getFontSize, STATUS_BAR_HEIGHT, SystemOS } from '../../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';

const validationSchema = Yup.object().shape({
  leaveType: Yup.string().required('Leave type is required'),
  fromDate: Yup.date().required('From date is required'),
  toDate: Yup.date().required('To date is required'),
  reason: Yup.string().required('Reason for leave is required'),
  fromHalf: Yup.string().required('From half is required'),
  toHalf: Yup.string().required('To half is required'),
});

const GridData = ({
  handleSubmit,
  resetTrigger,
  values,
  setFieldValue,
  errors,
  touched,
  leaveCountData,
  loading,
  setSelectedLeaveType,
  selectedLeavetype,
}) => {
  const [visibleFromDate, setVisibleFromDate] = useState(false);
  const [visibleToDate, setVisibleToDate] = useState(false);
  const leaveTypes =
    leaveCountData?.records?.map(record => ({
      key: record?.leave_rule_id?.toString(),
      value: !record?.leave_number_hide
        ? `${record?.leave_type} (${record?.monthly_balance_leave})`
        : record?.leave_type,
      disabled: false,
    })) || [];

  const [dayLeftTypes, setDayLeftTypes] = useState([
    { id: '', name: '', disabled: false },
    { id: '2', name: 'First Half', disabled: false },
    { id: '3', name: 'Second Half', disabled: false },
  ]);
  const [dayRightTypes, setDayRightTypes] = useState([
    { id: '1', name: '', disabled: false },
    { id: '2', name: 'First Half', disabled: false },
    { id: '3', name: 'Second Half', disabled: false },
  ]);

  const handleLeftHalfChange = value => {
    setFieldValue('fromHalf', value);

    if (value === 'Second Half') {
      setDayRightTypes(prev =>
        prev.map(item => ({
          ...item,
          disabled: item.name === 'First Half',
        })),
      );
    } else {
      setDayRightTypes(prev => prev.map(item => ({ ...item, disabled: false })));
    }
  };

  const handleRightHalfChange = value => {
    setFieldValue('toHalf', value);

    if (value === 'Second Half') {
      setDayLeftTypes(prev =>
        prev.map(item => ({
          ...item,
          disabled: item.name === 'First Half',
        })),
      );
    } else if (value === 'First Half') {
      setDayLeftTypes(prev =>
        prev.map(item => ({
          ...item,
          disabled: item.name === 'Second Half',
        })),
      );
    } else {
      setDayLeftTypes(prev => prev.map(item => ({ ...item, disabled: false })));
    }
  };

  const calculateDuration = (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const fromHalf = values.fromHalf;
    const toHalf = values.toHalf;
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);

    const differenceInTime = to.getTime() - from.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    var result = null;
    if (
      (fromHalf == 'First Half' && toHalf == 'First Half') ||
      (fromHalf == 'Second Half' && toHalf == 'Second Half')
    ) {
      if (differenceInDays == 0) {
        result = 0.5;
      }
    } else {
      result = differenceInDays + 1;
    }
    return result;
  };

  return (
    <ScrollView>
      <View style={{ paddingBottom: 30, paddingHorizontal: 20 }}>
        <View>
          <CustomNativeDropdown
            mode={true}
            keyField="key"
            modeType={'leaveType'}
            valueField="value"
            placeholder={'Select Leave Type'}
            enableDefaultOption={false}
            value={values.leaveType ? values.leaveType : ''}
            onValueChange={value => {
              if (value?.key) {
                setFieldValue('leaveType', value?.key);
                setSelectedLeaveType(value?.value);
              } else {
                setFieldValue('leaveType', '');
                setSelectedLeaveType('');
              }
            }}
            error={touched.leaveType && errors.leaveType}
            datas={leaveTypes}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingVertical: 20,
          }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Pressable
              onPress={() => {
                setVisibleFromDate(!visibleFromDate);
              }}>
              <View
                style={[
                  styles.input,
                  errors.fromDate ? styles.errorBorder : null,
                  { lineHeight: SystemOS() ? 15 : 0, }
                ]}>
                <Text
                  style={{
                    color: '#6A7D94',
                    fontFamily: 'Poppins-Regular',
                    fontSize: 14,
                    lineHeight: SystemOS() ? 15 : 0,
                  }}>
                  {values.fromDate
                    ? values.fromDate.toLocaleDateString()
                    : 'From Date'}
                </Text>
                {values.fromDate ? (
                  <TouchableOpacity
                    onPress={() => {
                      setFieldValue('fromDate', '');
                    }}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      zIndex: 9999,
                      transform: [{ translateY: '-12%' }],
                    }}>
                    <Cross color={'#6A7D94'} width={25} height={25} />
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: [{ translateY: '-12%' }],
                    }}>
                    <View>
                      <Calendar color={'#6A7D94'} width={25} height={25} />
                    </View>
                  </View>
                )}
              </View>
              <DateTimePickerComponent
                error={touched.fromDate && errors.fromDate}
                visible={visibleFromDate}
                setVisible={setVisibleFromDate}
                value={values.fromDate ? new Date(values.fromDate) : new Date()}
                onChange={date => setFieldValue('fromDate', date)}
              />
            </Pressable>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Pressable
              style={{ opacity: 1 }}
              onPress={() => {
                setVisibleToDate(!visibleToDate);
              }}>
              <View
                style={[
                  styles.input,
                  errors.toDate ? styles.errorBorder : null,
                  { lineHeight: SystemOS() ? 15 : 0, }
                ]}>
                <Text
                  style={{
                    color: '#6A7D94',
                    fontFamily: 'Poppins-Regular',
                    fontSize: 14,
                    lineHeight: SystemOS() ? 15 : 0,
                  }}>
                  {values.toDate
                    ? values.toDate.toLocaleDateString()
                    : 'To Date'}
                </Text>
                {values.toDate ? (
                  <TouchableOpacity
                    onPress={() => {
                      setFieldValue('toDate', '');
                    }}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      zIndex: 9999,
                      transform: [{ translateY: '-12%' }],
                    }}>
                    <Cross color={'#6A7D94'} width={25} height={25} />
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: [{ translateY: '-12%' }],
                    }}>
                    <View>
                      <Calendar color={'#6A7D94'} width={25} height={25} />
                    </View>
                  </View>
                )}
              </View>
              <DateTimePickerComponent
                error={touched.toDate && errors.toDate}
                visible={visibleToDate}
                setVisible={setVisibleToDate}
                value={values.toDate ? new Date(values.toDate) : new Date()}
                onChange={date => {
                  setFieldValue('toDate', date);
                }}
              />
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flex: 1 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <CustomNativeDropdown
              mode={true}
              keyField="id"
              valueField="name"
              enableDefaultOption={true}
              value={values.fromHalf}
              onValueChange={handleLeftHalfChange}
              error={touched.fromHalf && errors.fromHalf}
              datas={dayLeftTypes}
              placeholder={'From Half'}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <CustomNativeDropdown
              mode={true}
              modeType="halfDay"
              keyField="id"
              valueField="name"
              enableDefaultOption={true}
              value={values.toHalf}
              onValueChange={handleRightHalfChange}
              error={touched.toHalf && errors.toHalf}
              datas={dayRightTypes}
              placeholder={'To Half'}
            />
          </View>
        </View>

        <View style={{ paddingVertical: 20 }}>
          <TextInput
            readOnly
            placeholder="Duration"
            placeholderTextColor="#6A7D94"
            value={
              values.fromDate && values.toDate
                ? `${calculateDuration(values.fromDate, values.toDate)} days`
                : ''
            }
            style={[styles.input, { lineHeight: SystemOS() ? 15 : 0, }]}
          />
        </View>
        {/* <View style={{ paddingVertical: 20 }}>
                    <SegmentedControl segments={['Full day', 'AN', 'FN']} />
                </View> */}
        <View>
          <TextInput
            multiline={true}
            numberOfLines={4}
            placeholder="Reason for leave"
            value={values.reason}
            onChangeText={text => setFieldValue('reason', text)}
            placeholderTextColor="#6A7D94"
            style={[
              styles.input,
              errors.reason ? styles.errorBorder : null,
              {
                lineHeight: SystemOS() ? 15 : 0,
                height: 150,
                textAlignVertical: 'top',
              },
            ]}
          />
        </View>

        <TouchableOpacity
          disabled={loading ? true : false}
          onPress={handleSubmit}
          style={{
            height: 52,
            backgroundColor: '#CA282C',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 30,
          }}>
          {loading ? (
            <ActivityIndicator color={'white'} size={30} />
          ) : (
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                color: 'white',
                fontSize: 15,
                lineHeight: SystemOS() ? 20 : 0,
              }}>
              SUBMIT
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const CreateLeave = ({ navigation }) => {
  const [selectedLeavetype, setSelectedLeaveType] = useState('');

  const { userdata } = useEncodedUserData();
  const [show, setShow] = useState(false);
  const [submit, setSubmit] = useState('');
  const valueRef = useRef(null);
  const { LeaveSubmit, FetchLeaveCount } = useApi();
  const formikRef = useRef();
  const [resetCount, setResetCount] = useState(0);

  const {
    data: leaveCountData,
    isLoading: isLeaveCountLoading,
    isError: isLeaveCountError,
    isPending: isLeaveCountPending,
    refetch,
    isRefetching: isLeaveCountRefetching,
  } = useQuery({
    queryKey: ['FetchLeaveCount', userdata],
    queryFn: () => FetchLeaveCount({ userData: userdata }),
    enabled: !!userdata,
  });


  const {
    mutate,
    isLoading: isLeaveSubmitLoading,
    isPending,
    isError: isLeaveSubmitError,
  } = useMutation({
    mutationFn: ({ fromDate, toDate, leaveType, reason, startHalf, endHalf }) =>
      LeaveSubmit({
        userData: userdata,
        end_date: toDate,
        leave_type: leaveType,
        reason: reason,
        start_date: fromDate,
        start_half: startHalf,
        end_half: endHalf,
        leaveCount: leaveCountData?.records[0]?.monthly_balance_leave,
      }),
    onSuccess: async response => {
      toast.success(response.message);
      await refetch();
      if (formikRef.current) {
        formikRef.current.resetForm({
          values: {
            leaveType: '',
            fromDate: '',
            toDate: '',
            reason: '',
            fromHalf: 'First Half',
            toHalf: 'Second Half',
          },
        });
        setResetCount(prev => prev + 1);
        setSelectedLeaveType('');
      }
    },
    onError: error => {
      console.warn('Query failed with error:', error);
      toast.error(error.message);
    },
  });

  const handleCreateLeave = value => {
    const fromDate = new Date(value.fromDate).toLocaleDateString('en-CA');
    const toDate = new Date(value.toDate).toLocaleDateString('en-CA');
    if (toDate < fromDate) {
      toast.error('Date is not valid');
      return null;
    }
    valueRef.current = value;
    setShow(!show);
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{ ...StyleSheet.absoluteFillObject, flex: 1, paddingTop: STATUS_BAR_HEIGHT() }}>
        <ToastManager />
        <BottomSheet
          message="Submit Leave"
          description="Double-check your leave details to ensure everything is correct. Do you want to proceed?"
          buttons={[
            {
              title: 'Yes, Submit',
              onPress: () => {
                setShow(false);
                setSubmit(true);
                var leaveType = valueRef.current.leaveType;
                var reason = valueRef.current.reason;
                var fromDate = new Date(
                  valueRef.current.fromDate,
                ).toLocaleDateString('en-CA');
                var toDate = new Date(
                  valueRef.current.toDate,
                ).toLocaleDateString('en-CA');
                var startHalf = valueRef.current.fromHalf;
                var endHalf = valueRef.current.toHalf;
                var leaveRecord = leaveCountData?.records?.find(
                  record => record.leave_rule_id == leaveType,
                );
                var leaveId = leaveRecord?.leave_rule_id;

                mutate({
                  fromDate,
                  toDate,
                  leaveType: leaveId,
                  reason,
                  startHalf,
                  endHalf,
                });
              },
            },
            {
              title: 'No, Let me check',
              onPress: () => {
                setShow(false);
                setSubmit(false);
              },
              outline: true,
            },
          ]}
          visible={show}
          onClose={() => setShow(false)}
        />
        <View style={{ flex: 1 }}>
          <TopNavBar title={'Leave Request'} navigation={navigation} />
          <View style={{ flex: 1 }}>
            <Formik
              innerRef={formikRef}
              initialValues={{
                leaveType: '',
                fromDate: '',
                toDate: '',
                reason: '',
                fromHalf: 'First Half',
                toHalf: 'Second Half',
              }}
              validationSchema={validationSchema}
              onSubmit={handleCreateLeave}>
              {formikProps => (
                <GridData
                  handleSubmit={formikProps.handleSubmit}
                  values={formikProps.values}
                  setFieldValue={formikProps.setFieldValue}
                  errors={formikProps.errors}
                  touched={formikProps.touched}
                  leaveCountData={leaveCountData}
                  setSelectedLeaveType={setSelectedLeaveType}
                  selectedLeavetype={selectedLeavetype}
                  loading={
                    isLeaveSubmitLoading ||
                    isLeaveCountLoading ||
                    isLeaveCountRefetching ||
                    isPending
                  }
                  resetTrigger={resetCount}
                />
              )}
            </Formik>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  input: {
    position: 'relative',
    borderWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#fff',
    height: 57,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6A7D94',
    justifyContent: 'center',
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
  },
});

export default CreateLeave;
