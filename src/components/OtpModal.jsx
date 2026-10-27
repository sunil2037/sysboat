import React, { useRef, useState, useEffect } from 'react';
import { Alert, Modal, StyleSheet, Text, Pressable, View, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { Cross, Icon1, Icon2, Password } from '../Helper/IconsLoad';
import { VerifyPassword } from '../Helper/Validation';
import { Formik } from 'formik';
import ToastManager from '../Helper/ToastManager';
import { getFontSize } from '../Helper/Helper';

const OtpModal = ({ modalVisible, setModalVisible, email, onVerifyOtp, onResendOtp, loading, resendLoading, seconds, isVerified, handleForgotUpdatePassword, finalReset }) => {
  const [otp, setOtp] = useState('');
  const isResendDisabled = seconds > 0 ? true : false;
  useEffect(() => {

  }, [seconds]);


  return (
    <>
      {modalVisible && (
        <ScrollView>
          <Modal
            style={{ margin: 0 }}
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={() => {
              Alert.alert('Modal has been closed.');
              setModalVisible(false);
            }}
          >
            <ToastManager />
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{ position: 'absolute', left: 20, top: 20 }}
                >
                  <Cross width={30} height={30} />
                </TouchableOpacity>
                {!isVerified ? (
                  <>
                    <Text style={styles.modalText}>Verify Your Email</Text>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 15 }}>
                      Enter code we've sent to your inbox
                    </Text>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 15 }}>
                      {email}
                    </Text>
                    <View style={{ paddingVertical: 40, paddingHorizontal: 50 }}>
                      <OtpInput
                        numberOfDigits={4}
                        focusColor="green"
                        autoFocus={false}
                        hideStick={true}
                        placeholder="****"
                        blurOnFilled={true}
                        disabled={false}
                        type="numeric"
                        secureTextEntry={false}
                        focusStickBlinkingDuration={500}
                        onFocus={() => console.warn('Focused')}
                        onBlur={() => console.warn('Blurred')}
                        onTextChange={(text) => setOtp(text)}
                        onFilled={(text) => console.warn(`OTP is ${text}`)}
                        textInputProps={{
                          accessibilityLabel: 'One-Time Password',
                        }}
                        theme={{
                          containerStyle: styles.container,
                          pinCodeContainerStyle: styles.pinCodeContainer,
                          pinCodeTextStyle: styles.pinCodeText,
                          focusStickStyle: styles.focusStick,
                          focusedPinCodeContainerStyle: styles.activePinCodeContainer,
                          placeholderTextStyle: styles.placeholderText,
                          filledPinCodeContainerStyle: styles.filledPinCodeContainer,
                          disabledPinCodeContainerStyle: styles.disabledPinCodeContainer,
                        }}
                      />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      <Text style={{ fontFamily: 'Poppins-Regular' }}>Don't get the code? </Text>
                      <Pressable onPress={() => onResendOtp()} disabled={resendLoading || seconds > 0}>
                        {resendLoading ? (
                          <ActivityIndicator size={25} color="black" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
                        ) : (
                          <Text style={{ fontFamily: 'Poppins-Regular', color: isResendDisabled ? 'grey' : 'blue' }}>{isResendDisabled ? `Resend in ${seconds} seconds` : 'Resend it.'}</Text>
                        )}

                      </Pressable>
                    </View>
                    <View style={{ paddingHorizontal: 15, width: '100%' }}>
                      <TouchableOpacity
                        disabled={otp.length !== 4 || loading}
                        onPress={() => { onVerifyOtp(otp); }}
                        style={{
                          height: 60,
                          width: '100%',
                          borderRadius: 10,
                          backgroundColor: '#CA282C',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginTop: 60,
                        }}
                      >
                        {loading ? (
                          <ActivityIndicator size="large" color="white" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
                        ) : (
                          <Text style={{
                            color: 'white', fontSize: 18,
                            fontFamily: 'Poppins-Medium',
                            lineHeight: 35,
                          }}>
                            Verify</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View>
                    <Text style={styles.modalText}>Enter New Password</Text>
                    <Formik
                      initialValues={{ password: '', retypePassword: '' }}
                      validationSchema={VerifyPassword}
                      onSubmit={(values) => handleForgotUpdatePassword({ otp, ...values })}
                    >
                      {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <View>
                          <View style={{ position: 'relative' }}>
                            <TextInput
                              // editable={isLoading ? false : true}
                              style={[styles.input, touched.password && errors.password && styles.errorInput]}
                              placeholder="Password"
                              placeholderTextColor="#000"
                              secureTextEntry={false}
                              onChangeText={handleChange('password')}
                              onBlur={handleBlur('password')}
                              value={values.password}
                            />
                            <View style={{ position: 'absolute', left: 10, top: 35 }}>
                              <Password color={'#CA282C'} />
                            </View>
                            {/* <TouchableOpacity
                              style={{ position: 'absolute', right: 10, top: 38 }}
                              onPress={() => {
                                setShowPassword(!showPassword);
                              }}
                            >
                              {showPassword ? <Icon1 color={'#CA282C'} width={20} /> : <Icon2 color={'#CA282C'} width={20} />}
                            </TouchableOpacity> */}
                            {touched.password && errors.password && (
                              <Text style={{ color: 'red', width: '200', textAlign: 'left' }}>
                                {errors.password}
                              </Text>
                            )}
                          </View>
                          <View style={{ position: 'relative' }}>
                            <TextInput
                              // editable={isLoading ? false : true}
                              style={[styles.input, touched.retypePassword && errors.retypePassword && styles.errorInput]}
                              placeholder="Re-Enter Password"
                              placeholderTextColor="#000"
                              secureTextEntry={false}
                              onChangeText={handleChange('retypePassword')}
                              onBlur={handleBlur('retypePassword')}
                              value={values.retypePassword}
                            />
                            <View style={{ position: 'absolute', left: 10, top: 35 }}>
                              <Password color={'#CA282C'} />
                            </View>
                            {/* <TouchableOpacity
                              style={{ position: 'absolute', right: 10, top: 38 }}
                              onPress={() => {
                                setShowPassword(!showPassword);
                              }}
                            >
                              {showPassword ? <Icon1 color={'#CA282C'} width={20} /> : <Icon2 color={'#CA282C'} width={20} />}
                            </TouchableOpacity> */}
                            {touched.retypePassword && errors.retypePassword && (
                              <Text style={{ color: 'red', width: '200', textAlign: 'left' }}>
                                {errors.retypePassword}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={finalReset ? true : false}
                            style={{
                              height: 60,
                              width: '100%',
                              borderRadius: 10,
                              backgroundColor: '#CA282C',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginTop: 30,

                            }}>
                            {finalReset ? (
                              <ActivityIndicator size="large" color="white" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
                            ) : (
                              <Text style={{
                                color: 'white', fontSize: 18,
                                fontFamily: 'Poppins-Medium',
                                lineHeight: 35,
                              }}>
                                Submit</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </Formik>
                  </View>
                )}

              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    textAlign: 'center',
    fontSize: 30,
    fontFamily: 'Poppins-Bold',
  },
  input: {
    color: 'black',
    height: 55,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 20,
    fontSize: 16,
    backgroundColor: '#F7F7F7',
    fontFamily: 'Poppins-Regular',
  },
});

export default OtpModal;
