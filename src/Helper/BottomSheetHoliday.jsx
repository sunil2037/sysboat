import { Formik } from 'formik';
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import * as Yup from 'yup';
import CustomDropdown from './CustomDropdown';
import { DateTimePickerComponent } from './DateTimePicker';
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import useApi from '../Apis/Services/ApiConfig';
import useEncodedUserData from '../hooks/useEncodedUserData';
import BottomSheetBase from './BottomSheetBase';
import { toast } from './ToastManager';
import { getFontSize, SystemOS } from './Helper';
import { TextInput } from 'react-native-gesture-handler';
const { height } = Dimensions.get('window');

const validationSchema = Yup.object().shape({
  date: Yup.string().required('Date is required'),
  message: Yup.string().required('Reason for attendance is required'),
});

const GridData = ({
  status,
  isPending2,
  handleSubmit,
  values,
  setFieldValue,
  errors,
  touched,
  isPending,
  updateValues,
}) => {
  const [visibleOutTime, setVisibleOutTime] = useState(false);

  return (
    <ScrollView style={{ width: '100%', }}>
      <View>
        <Text
          style={{
            fontFamily: 'Poppins-Medium',
            fontSize: 14,
            color: '#293646',
            paddingBottom: 10,
          }}>
          Select Date
        </Text>
        <View style={{ flex: 1 }}>
          <Pressable onPress={() => setVisibleOutTime(true)}>
            <View
              style={[styles.input, errors.date ? styles.errorBorder : null, { lineHeight: SystemOS() ? 15 : 0 }]}>
              <Text
                style={{
                  color: '#6A7D94',
                  fontFamily: 'Poppins-Regular',
                  fontSize: 14,
                }}>
                {values.date ? values.date : ''}
              </Text>
            </View>
            <DateTimePickerComponent
              initialDate={updateValues.date || ''}
              modetype={'date'}
              error={touched.date && errors.date}
              visible={visibleOutTime}
              setVisible={setVisibleOutTime}
              value={values.date ? new Date(values.date) : new Date()}
              onChange={date =>
                setFieldValue('date', date.toLocaleDateString('en-CA'))
              }
            />
          </Pressable>
        </View>
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
          cursorColor={'#6A7D94'}
          value={values.message}
          onChangeText={text => setFieldValue('message', text)}
          placeholderTextColor="#6A7D94"
          style={[
            styles.input,
            errors.message ? styles.errorInput : null,
            { height: 120, textAlignVertical: 'top', lineHeight: SystemOS() ? 15 : 0 },
          ]}
        />
        {status == 'update' ? (
          <TouchableOpacity
            disabled={isPending2 ? true : false}
            onPress={handleSubmit}
            style={{
              height: 52,
              backgroundColor: '#CA282C',
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 40,
            }}>
            {isPending2 ? (
              <ActivityIndicator color={'white'} />
            ) : (
              <Text
                style={{
                  fontFamily: 'Poppins-Medium',
                  color: 'white',
                  fontSize: 15,
                  lineHeight: SystemOS() ? 15 : 0,
                }}>
                UPDATE
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            disabled={isPending ? true : false}
            onPress={handleSubmit}
            style={{
              height: 52,
              backgroundColor: '#CA282C',
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 40,
            }}>
            {isPending ? (
              <ActivityIndicator color={'white'} />
            ) : (
              <Text
                style={{
                  fontFamily: 'Poppins-Medium',
                  color: 'white',
                  fontSize: 15,
                  lineHeight: SystemOS() ? 15 : 0,
                }}>
                SUBMIT
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const BottomSheetHoliday = ({
  status,
  updateValues,
  visible,
  onClose,
  message,
  description,
  buttons = [],
}) => {
  const { AddHoliday, UpdateHoliday } = useApi();
  const { userdata } = useEncodedUserData();

  const {
    mutate: submitHoliday,
    isError,
    data,
    error,
    isPending,
  } = useMutation({
    mutationFn: holidayData => AddHoliday(holidayData),
    onSuccess: response => {
      console.warn(response);
      toast.success(response.message);
    },
    onError: error => {
      console.warn(error);
      toast.error(error.message);
      console.warn('Error submitting leave:', error);
    },
  });

  const {
    mutate: updateHoliday,
    isError: isError2,
    error: error2,
    isPending: isPending2,
  } = useMutation({
    mutationFn: holidayData => UpdateHoliday(holidayData),
    onSuccess: response => {
      toast.success(response.message);
    },
    onError: error => {
      console.warn(error);
      toast.error(error.message);
      console.warn('Error submitting leave:', error);
    },
  });

  return (
    <BottomSheetBase visible={visible} snapPoints={['90%']} isSnapPoint={true} onClose={onClose}>
      <Formik
        initialValues={{
          date: status == 'update' ? updateValues.date : '',
          message: status == 'update' ? updateValues.title : '',
        }}
        validationSchema={validationSchema}
        onSubmit={values => {
          if (status == 'add') {
            submitHoliday({
              date: values.date,
              holiday: values.message,
              userData: userdata,
            });
          } else {
            console.warn('iim in update');
            updateHoliday({
              date: values.date,
              holiday: values.message,
              id: updateValues.id,
              userData: userdata,
            });
          }
        }}>
        {formikProps => (
          <GridData
            handleSubmit={formikProps.handleSubmit}
            values={formikProps.values}
            setFieldValue={formikProps.setFieldValue}
            errors={formikProps.errors}
            touched={formikProps.touched}
            isPending={isPending}
            isPending2={isPending2}
            updateValues={updateValues}
            status={status}
          />
        )}
      </Formik>
    </BottomSheetBase>
  );
};

const styles = StyleSheet.create({
  input: {
    position: 'relative',
    borderWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#ffffffff',
    height: 57,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6A7D94',
    justifyContent: 'center',
    width: '100%',
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
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
});

export default BottomSheetHoliday;
