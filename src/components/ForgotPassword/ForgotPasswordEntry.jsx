import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Button, ScrollView, ActivityIndicator, SafeAreaView, ToastAndroid } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import OtpModal from '../OtpModal';
import { Email, Back } from '../../Helper/IconsLoad';

import { ForgotPasswordValidation } from '../../Helper/Validation';
import { useMutation, useQuery } from '@tanstack/react-query';
import useApi from '../../Apis/Services/ApiConfig';
import { toast } from '../../Helper/ToastManager';
import { getFontSize, STATUS_BAR_HEIGHT } from '../../Helper/Helper';

const ForgotPasswordEntry = ({ navigation }) => {
    const { ForgotPasswordSendOTP, ForgotPasswordVerifyOTP, ForgotPasswordResetPassword } = useApi();
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [tempEmail, setTempEmail] = useState('');
    const [loginError, setLoginError] = useState('');
    const [seconds, setSeconds] = useState(60);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [resendTime, setResendTime] = useState(false);

    const { mutate: sendOtp, isLoading: sendOtpIsLoading, isPending: sendOtpIsPending, isError: sendOtpIsError } = useMutation({
        mutationFn: (email) =>
            ForgotPasswordSendOTP({
                email: email,
            }),
        onSuccess: (response) => {
            toast.success(response.message);
            setShowOtpModal(true);
        },
        onError: (error) => {
            console.warn('Query failed with error:', error);
            toast.error(error.message);
            setShowOtpModal(false);
        },
    });

    const { mutate: verifyOtp, isLoading: verifyOtpIsLoading, isPending: verifyOtpIsPending, isError: verifyOtpIsError } = useMutation({
        mutationFn: ({ tempEmail, otp }) =>
            ForgotPasswordVerifyOTP({
                email: tempEmail,
                otp: otp,
            }),
        onSuccess: (response) => {
            toast.success(response.message);
            setIsOtpVerified(true);
        },
        onError: (error) => {
            console.warn('Query failed with error:', error);
            toast.error(error.message);
            setIsOtpVerified(false);
        },
    });

    const { mutate: FinalAction, isLoading: FinalActionLoading, isPending: FinalActionPending, isError: FinalActionError } = useMutation({
        mutationFn: ({ tempEmail, otp, Password, confirmPassword }) =>
            ForgotPasswordResetPassword({
                email: tempEmail,
                otp: otp,
                confirmPassword: confirmPassword,
                newPassword: Password,
            }),
        onSuccess: (response) => {
            toast.success(response.message);
            navigation.navigate('Signin');
        },
        onError: (error) => {
            console.warn('Query failed with error:', error);
            toast.error(error.message);
        },
    });


    const handleForgotAction = (values) => {
        const email = values.email;
        setTempEmail(email);
        sendOtp(email);
    };

    useEffect(() => {
        let interval;
        console.warn(seconds);
        if (showOtpModal) {
            interval = setInterval(() => {
                setSeconds((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [showOtpModal, resendTime]);


    const onVerifyOtp = async (otp) => {
        verifyOtp({ tempEmail, otp });
    };

    const onResendOtp = async () => {
        sendOtp(tempEmail);
        setResendTime(true);
        setSeconds(60);
    };

    const handleForgotUpdatePassword = (values) => {
        console.warn('values', values);
        const otp = values.otp;
        const Password = values.password;
        const confirmPassword = values.retypePassword;
        FinalAction({ tempEmail, otp, Password, confirmPassword });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ flex: 1, paddingHorizontal: 15 }}>
                <TouchableOpacity onPress={() => { navigation.goBack(); }} style={{ position: 'absolute', left: 8, top: STATUS_BAR_HEIGHT() }}>
                    <Back />
                </TouchableOpacity>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.title}>Forget Password</Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular' }}>Always keep your account secure and don't forget to update it</Text>
                    <Formik
                        initialValues={{ email: '' }}
                        validationSchema={ForgotPasswordValidation}
                        onSubmit={handleForgotAction}
                    >
                        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                            <View>
                                <View style={{ position: 'relative' }}>

                                    <TextInput
                                        style={[styles.input, touched.email && errors.email && styles.errorInput]}
                                        placeholder="Your Email Acount"
                                        placeholderTextColor="#000"
                                        keyboardType="email-address"
                                        onChangeText={handleChange('email')}
                                        onBlur={handleBlur('email')}
                                        value={values.email}
                                    />
                                    {touched.email && errors.email && (
                                        <Text style={{ color: 'red' }}>{errors.email}</Text>
                                    )}
                                    <View style={{ position: 'absolute', left: 10, top: 35 }}>
                                        <Email color={'#CA282C'} />
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={handleSubmit}
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
                                    {sendOtpIsLoading || sendOtpIsPending ? (
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

                <OtpModal
                    email={tempEmail}
                    modalVisible={showOtpModal}
                    setModalVisible={setShowOtpModal}
                    onVerifyOtp={onVerifyOtp}
                    onResendOtp={onResendOtp}
                    loading={verifyOtpIsLoading || verifyOtpIsPending}
                    resendLoading={sendOtpIsLoading || sendOtpIsPending}
                    seconds={seconds}
                    isVerified={isOtpVerified}
                    handleForgotUpdatePassword={handleForgotUpdatePassword}
                    finalReset={FinalActionLoading || FinalActionPending}
                />

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 0,
        backgroundColor: 'white',
    },
    signupText: {
        marginTop: 20,
    },
    signupLink: {
        color: 'blue',
    },
    title: {
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
    radioButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 40,
    },
    radioButton: {
        height: 24,
        width: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    radioButtonInner: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: 'black',
    },

});

export default ForgotPasswordEntry;
