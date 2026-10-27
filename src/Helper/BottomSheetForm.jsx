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
  TextInput,
  BackHandler,
} from 'react-native';
import * as Yup from 'yup';
import CustomDropdown from './CustomDropdown';
import { DateTimePickerComponent } from './DateTimePicker';
import { getFontSize } from './Helper';
const { height } = Dimensions.get('window');

const validationSchema = Yup.object().shape({
  requestType: Yup.string().required('Request type is required'),
  inTime: Yup.string().required('In time is required'),
  outTime: Yup.string().required('Out time is required'),
  reason: Yup.string().required('Reason for attendance is required'),
});

const GridData = ({ handleSubmit, values, setFieldValue, errors, touched }) => {
  const [visibleInTime, setVisibleInTime] = useState(false);
  const [visibleOutTime, setVisibleOutTime] = useState(false);

  return (
    <ScrollView style={{ width: '100%' }}>
      <View style={{ paddingBottom: 30, paddingHorizontal: 20 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Medium',
            fontSize: 14,
            color: '#293646',
            paddingBottom: 10,
          }}>
          Request Type
        </Text>
        <CustomDropdown
          value={values.requestType}
          onValueChange={value => setFieldValue('requestType', value)}
          error={touched.requestType && errors.requestType}
          data={['', 'Present', 'Absent', 'WO']}
        />
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
        <View style={{ flex: 1 }}>
          <Pressable onPress={() => setVisibleInTime(true)}>
            <View
              style={[styles.input, errors.inTime ? styles.errorBorder : null]}>
              <Text
                style={{
                  color: '#6A7D94',
                  fontFamily: 'Poppins-Regular',
                  fontSize: 14,
                }}>
                {values.inTime ? values.inTime : 'From Date'}
              </Text>
              {values.inTime ? (
                <TouchableOpacity
                  onPress={() => setFieldValue('inTime', '')}
                  style={styles.clearIcon}>
                  {/* <Cross color={'#6A7D94'} width={25} height={25} /> */}
                </TouchableOpacity>
              ) : (
                <View style={styles.calendarIcon}>
                  {/* Add Calendar Icon Here */}
                </View>
              )}
            </View>
            <DateTimePickerComponent
              modetype={'time'}
              error={touched.inTime && errors.inTime}
              visible={visibleInTime}
              setVisible={setVisibleInTime}
              value={new Date(values.inTime)}
              onChange={date =>
                setFieldValue('inTime', date.toLocaleTimeString())
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
          Out Time
        </Text>
        <View style={{ flex: 1 }}>
          <Pressable onPress={() => setVisibleOutTime(true)}>
            <View
              style={[
                styles.input,
                errors.outTime ? styles.errorBorder : null,
              ]}>
              <Text
                style={{
                  color: '#6A7D94',
                  fontFamily: 'Poppins-Regular',
                  fontSize: 14,
                }}>
                {values.outTime ? values.outTime : 'outTime'}
              </Text>
              {values.outTime ? (
                <TouchableOpacity
                  onPress={() => setFieldValue('outTime', '')}
                  style={styles.clearIcon}>
                  {/* <Cross color={'#6A7D94'} width={25} height={25} /> */}
                </TouchableOpacity>
              ) : (
                <View style={styles.calendarIcon}>
                  {/* Add Calendar Icon Here */}
                </View>
              )}
            </View>
            <DateTimePickerComponent
              modetype={'time'}
              error={touched.outTime && errors.outTime}
              visible={visibleOutTime}
              setVisible={setVisibleOutTime}
              onChange={date =>
                setFieldValue('outTime', date.toLocaleTimeString())
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
          Reason
        </Text>
        <TextInput
          multiline={true}
          numberOfLines={10}
          value={values.reason}
          onChangeText={text => setFieldValue('reason', text)}
          placeholderTextColor="#6A7D94"
          style={[
            styles.input,
            errors.reason ? styles.errorInput : null,
            { height: 120, textAlignVertical: 'top' },
          ]}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          style={{
            height: 52,
            backgroundColor: '#CA282C',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 40,
          }}>
          <Text
            style={{
              fontFamily: 'Poppins-Medium',
              color: 'white',
              fontSize: 15,
              lineHeight: 15,
            }}>
            SUBMIT
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const BottomSheetForm = ({
  visible,
  onClose,
  message,
  description,
  buttons = [],
}) => {
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    const backAction = () => {
      if (visible) {
        closeSheet();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [visible]);

  const openSheet = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose?.());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeSheet();
        } else {
          openSheet();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      openSheet();
    } else {
      closeSheet();
    }
  }, [visible]);

  return (
    <>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: translateY.interpolate({
              inputRange: [0, height],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }),
            display: visible || translateY._value !== height ? 'flex' : 'none',
          },
        ]}>
        <Pressable onPress={closeSheet} style={styles.backdrop} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}>
          <View style={styles.handle} />
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.description}>{description}</Text>
            <Formik
              initialValues={{
                requestType: '',
                inTime: '',
                outTime: '',
                reason: '',
              }}
              validationSchema={validationSchema}
              onSubmit={values => {
                setShow(true);
              }}>
              {formikProps => (
                <GridData
                  handleSubmit={formikProps.handleSubmit}
                  values={formikProps.values}
                  setFieldValue={formikProps.setFieldValue}
                  errors={formikProps.errors}
                  touched={formikProps.touched}
                />
              )}
            </Formik>
          </View>
        </Animated.View>
      </Animated.View>
    </>
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
    lineHeight: 15,
    justifyContent: 'center',
    width: '100%',
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
    padding: 16,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  content: {
    paddingBottom: 20,
    alignItems: 'center',
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

export default BottomSheetForm;
