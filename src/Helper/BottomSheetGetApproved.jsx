import { Formik, useFormikContext } from 'formik';
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';

import * as Yup from 'yup';
import { DateTimePickerComponent } from './DateTimePicker';
import SegmentedControl from './SegmentedControl';
import moment from 'moment';
import useAttendanceStore from '../Context/useAttendanceStore';
import ActionRadioButton from '../utils/ActionRadioButton';
import { COLORS, } from './Helper';


const BottomSheetGetApproved = ({
  ViewDetailsData,
  defaultData,
  status,
  visible,
  onClose,
  SubmitApproval,
  loading,
}) => {

  const preInTime = defaultData?.check_in_time;
  const preOutTime = defaultData?.check_out_time;
  const loadingView = useAttendanceStore((s) => s.loadingView);
  const requestDay = defaultData?.request_type;
  const pendingApproveType = defaultData?.usertype;
  const formikRef = useRef(null);



  const GridData = ({
    loading,
    handleSubmit,
    values,
    setFieldValue,
    errors,
    touched,
    preInTime,
    preOutTime,
  }) => {
    const [openInTime, setOpenInTime] = useState(false);
    const [openOutTime, setOpenOutTime] = useState(false);
    const [FakeInTime, setFakeInTime] = useState(new Date());
    const [FakeOutTime, setFakeOutTime] = useState(new Date());


    let disableClockInClockOut = Boolean(values?.requestType == 'LWP' || values?.requestType == 'absent');

    const options = {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    };
    const selectedInTime = values.inTime
      ? moment(values.inTime, 'HH:mm:ss')
        .set({
          year: moment().year(),
          month: moment().month(),
          date: moment().date(),
        })
        .toDate()
      : new Date();

    const selectedOutTime = values.outTime
      ? moment(values.outTime, 'HH:mm:ss')
        .set({
          year: moment().year(),
          month: moment().month(),
          date: moment().date(),
        })
        .toDate()
      : new Date();

    useEffect(() => {
      setFakeInTime(selectedInTime);
      setFakeOutTime(selectedOutTime);
      if (disableClockInClockOut) {
        setFieldValue('inTime', '00:00');
        setFieldValue('outTime', '00:00');
      }
    }, [disableClockInClockOut]);

    return (
      <View style={{ width: '100%' }}>
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center',
          }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 14,
                color: '#293646',
                paddingBottom: 10,
                paddingTop: 15,
              }}>
              In Time
            </Text>
            <Pressable disabled={disableClockInClockOut} onPress={() => setOpenInTime(true)}>
              <View
                style={[
                  styles.input,
                  errors.inTime ? styles.errorBorder : null,
                  disableClockInClockOut ? styles.opacityDown : null
                ]}>
                <Text
                  style={{
                    color: values.inTime ? '#6A7D94' : '#CCCCCC',
                    fontFamily: 'Poppins-Regular',
                    fontSize: 14,
                  }}>
                  {values.inTime || ''}
                </Text>
              </View>
              <View
                style={[
                  styles.dateTimePickerContainer,
                  errors.inTime && touched.inTime ? styles.errorInput : null,
                ]}>
                <DateTimePickerComponent
                  initialDate={preInTime || ''}
                  modetype={'time'}
                  error={touched.inTime && errors.inTime}
                  visible={openInTime}
                  setVisible={setOpenInTime}
                  onChange={inTime => {
                    setFieldValue(
                      'inTime',
                      inTime
                        .toLocaleTimeString('en-CA', options)
                        .replace(/\./g, ':'),
                    );
                    setFakeInTime(inTime);
                  }}
                  value={FakeInTime}
                />
              </View>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 14,
                color: '#293646',
                paddingBottom: 10,
                paddingTop: 15,
              }}>
              Out Time
            </Text>
            <Pressable disabled={disableClockInClockOut} onPress={() => setOpenOutTime(true)}>
              <View
                style={[
                  styles.input,
                  errors.outTime ? styles.errorBorder : null,
                  disableClockInClockOut ? styles.opacityDown : null
                ]}>
                <Text
                  style={{
                    color: '#6A7D94',
                    fontFamily: 'Poppins-Regular',
                    fontSize: 14,
                  }}>
                  {values.outTime || ''}
                </Text>
              </View>
              <View
                style={[
                  styles.dateTimePickerContainer,
                  errors.outTime && touched.outTime ? styles.errorInput : null,
                ]}>
                <DateTimePickerComponent
                  initialDate={preOutTime || ''}
                  modetype={'time'}
                  error={touched.outTime && errors.outTime}
                  visible={openOutTime}
                  setVisible={setOpenOutTime}
                  value={FakeOutTime}
                  onChange={outTime => {
                    setFieldValue(
                      'outTime',
                      outTime
                        .toLocaleTimeString('en-CA', options)
                        .replace(/\./g, ':'),
                    );
                    setFakeOutTime(outTime);
                  }}
                />
              </View>
            </Pressable>
          </View>
        </View>
        <View style={{ paddingTop: 20, gap: 15, }}>
          {ViewDetailsData?.sl_eligible == true && (
            <View style={{ gap: 10 }}>
              <ActionRadioButton onPress={() => setFieldValue('short_leave', !values.short_leave)} checked={values.short_leave} label='Short Leave' />
              {values.short_leave && (
                <>
                  <ActionRadioButton onPress={() => setFieldValue('short_leave_type', 1)} checked={values.short_leave_type == 1} label='Late Come' />
                  <ActionRadioButton onPress={() => setFieldValue('short_leave_type', 2)} checked={values.short_leave_type == 2} label='Early Go' />
                </>
              )}
            </View>
          )}
          {pendingApproveType === 'Admin' || pendingApproveType == 'Rm' ? (
            <View style={{ gap: 20 }}>
              <SegmentedControl
                selected={
                  requestDay == 'present' ? 0 : requestDay == 'half-day' ? 1 : 2
                }
                onSelect={data => {
                  setFieldValue('requestDay', data);
                }}
                segments={['present', 'half-day', 'absent']}
              />
              <SegmentedControl
                onSelect={data => {
                  setFieldValue('requestType', data || 'approve');
                }}
                segments={['approve', 'disapprove']}
              />
            </View>
          ) : (
            <SegmentedControl
              onSelect={data => {
                setFieldValue('requestType', data);
              }}
              segments={['present', 'half-day', 'absent', 'LWP']}
            />
          )}
        </View>
        <View>
          <Text
            style={{
              fontFamily: 'Poppins-Medium',
              fontSize: 14,
              color: '#293646',
              paddingBottom: 10,
              paddingTop: 15,
            }}>
            Message
          </Text>
          <TextInput
            multiline={true}
            numberOfLines={10}
            value={values.message}
            onChangeText={text => setFieldValue('message', text)}
            placeholderTextColor="#6A7D94"
            style={[
              styles.input,
              errors.message ? styles.errorInput : null,
              { height: 120, textAlignVertical: 'top' },
            ]}
          />
        </View>
        {values.short_leave && (
          <View>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 14,
                color: '#293646',
                paddingBottom: 10,
                paddingTop: 15,
              }}>
              Short Leave Reason
            </Text>
            <TextInput
              multiline={true}
              numberOfLines={10}
              editable={!ViewDetailsData?.request?.short_leave} selectTextOnFocus={!ViewDetailsData?.request?.short_leave}
              value={values.short_leave_reason}
              onChangeText={text => setFieldValue('short_leave_reason', text)}
              placeholderTextColor="#6A7D94"
              style={[
                styles.input,
                errors.short_leave_reason ? styles.errorInput : null,
                { height: 120, textAlignVertical: 'top' },
              ]}
            />
          </View>
        )}

        <TouchableOpacity
          disabled={loading ? true : false}
          onPress={handleSubmit}
          style={{
            height: 52,
            backgroundColor: '#CA282C',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 40,
          }}>
          {loading ? (
            <ActivityIndicator size={30} color={'white'} />
          ) : (
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                color: 'white',
                fontSize: 15,
                lineHeight: 15,
              }}>
              SUBMIT
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => { }, [loading, preInTime, preOutTime, loadingView]);

  const padTime = time => {
    if (!time) {
      return '00:00:00';
    }
    const parts = time.split(':');
    if (parts.length === 2) {
      return `${parts[0]}:${parts[1]}:00`;
    }
    if (parts.length === 1) {
      return `${parts[0]}:00:00`;
    }
    return time;
  };

  const handleSubmit = values => {
    if (Boolean(values?.requestType == 'LWP' || values?.requestType == 'absent')) {
      SubmitApproval(values);
      return;
    } else {
      if (!values?.inTime || !values?.outTime) {
        toast.error('Please select time');
        return;
      }

      const inTime = padTime(values.inTime);
      const outTime = padTime(values.outTime);

      if (inTime && outTime) {
        const today = new Date().toISOString().split('T')[0];
        const inDateStr = `${today}T${inTime}`;
        const outDateStr = `${today}T${outTime}`;

        const inDate = new Date(inDateStr);
        const outDate = new Date(outDateStr);

        if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
          toast.error('Invalid time format');
          return;
        }

        if (outDate <= inDate) {
          toast.error('Out Time must be greater than In Time');
          return;
        }
      }
      SubmitApproval(values);

    }
  };

  const handleGetApproved = () => {
    useAttendanceStore.getState().setShowApprovalDetails(false);
  }

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      statusBarTranslucent
      animationType="fade"
    >

      <TouchableOpacity
        activeOpacity={1}
        style={styles.backdrop}
        onPress={onClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
            >
              <View style={styles.content}>
                <Formik
                  enableReinitialize
                  innerRef={formikRef}
                  initialValues={{
                    message: '',
                    inTime: preInTime ? preInTime : '',
                    outTime: preOutTime ? preOutTime : '',
                    requestType:
                      pendingApproveType === 'Admin' || pendingApproveType === 'Rm'
                        ? 'approve'
                        : 'present',
                    requestDay: requestDay || '',
                    sl_eligible: ViewDetailsData?.sl_eligible,

                    ...(((ViewDetailsData?.attendance?.short_leave ||
                      ViewDetailsData?.request?.short_leave) &&
                      ViewDetailsData?.sl_eligible)
                      ? {
                        short_leave_reason:
                          ViewDetailsData?.attendance?.short_leave_reason ||
                          ViewDetailsData?.request?.short_leave_reason ||
                          '',
                        short_leave_type:
                          ViewDetailsData?.attendance?.short_leave_type ||
                          ViewDetailsData?.request?.short_leave_type ||
                          1,
                        short_leave:
                          ViewDetailsData?.attendance?.short_leave ||
                          ViewDetailsData?.request?.short_leave ||
                          false,
                      }
                      : {}),
                  }}

                  validationSchema={Yup.object().shape({
                    message: Yup.string().required('Reason for attendance is required'),

                    sl_eligible: Yup.boolean(),

                    short_leave: Yup.boolean().when('sl_eligible', {
                      is: true,
                      then: schema => schema.notRequired(),
                      otherwise: schema => schema.notRequired(),
                    }),

                    short_leave_reason: Yup.string().when(
                      ['short_leave', 'sl_eligible'],
                      {
                        is: (short_leave, sl_eligible) => short_leave === true && sl_eligible === true,
                        then: schema =>
                          schema.required('Reason for short leave is required'),
                        otherwise: schema => schema.notRequired(),
                      }
                    ),

                    short_leave_type: Yup.number().when(
                      ['short_leave', 'sl_eligible'],
                      {
                        is: (short_leave, sl_eligible) => short_leave === true && sl_eligible === true,
                        then: schema => schema.required(),
                        otherwise: schema => schema.notRequired(),
                      }
                    ),

                    // inTime: Yup.string().required('In Time is required'),
                    // outTime: Yup.string().required('Out Time is required'),
                  })}

                  onSubmit={handleSubmit}>
                  {formikProps => (
                    <GridData
                      handleSubmit={formikProps.handleSubmit}
                      values={formikProps.values}
                      setFieldValue={formikProps.setFieldValue}
                      errors={formikProps.errors}
                      touched={formikProps.touched}
                      preInTime={preInTime}
                      preOutTime={preOutTime}
                      status={status}
                      loading={loading}
                    />
                  )}
                </Formik>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 15,
  },
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
    lineHeight: 15,
    justifyContent: 'center',
    width: '100%',
  },
  opacityDown: {
    opacity: 0.5
  },
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
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    borderRadius: 5,
  },
  content: {
    alignItems: 'center',
    padding: 0,
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
  errorInput: {
    borderColor: 'red',
    borderWidth: 1,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
});

export default BottomSheetGetApproved;
