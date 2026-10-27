import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  ImageBackground,
  Image,
  PixelRatio,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import { Formik } from 'formik';
import { useMutation } from '@tanstack/react-query';
import { validationSchema } from '../Helper/Validation';
import { Email, Icon1, Icon2, Password } from '../Helper/IconsLoad';
import useApi from '../Apis/Services/ApiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../Context/AuthContext';
import { toast } from '../Helper/ToastManager';
import { storage } from '../hooks/useEncodedUserData';
import crashlytics from '@react-native-firebase/crashlytics';
import ThemedText from '../Helper/ThemedText';
import backgroundImage from '../../assets/Icon/background.png';
import { bottomHeight, COLORS, STATUS_BAR_HEIGHT } from '../Helper/Helper';


const Signin = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { Signin: signinApi, resetApiClient } = useApi();
  const { setAuthToken, setUserType, reloadAuthData } = useAuth();
  const versionName = DeviceInfo.getVersion();
  const versionCode = DeviceInfo.getBuildNumber();


  const { mutateAsync, isPending } = useMutation({
    mutationFn: signinApi,
    onSuccess: async data => {
      if (data.status == false) {
        toast.success(data.message);
        return;
      }
      toast.success('Login successful!');
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('data', JSON.stringify(data.Data));
      await storage.setString('data', JSON.stringify(data.Data));
      await storage.setString('token', data.token);
      await resetApiClient();
      reloadAuthData();
      setAuthToken(data.token);
      setUserType(data.Data.type);
      // setTimeout(() => {
      //   navigation.navigate('Main');
      // }, 500);
    },
    onError: error => {
      toast.error(error.message || 'Login failed. Please try again.');
    },
  });

  const handleLogin = async (values) => {
    try {
      const data = await mutateAsync({ username: values.email, password: values.password });
      if (data.status) {
        const [uniqueId, manufacturer, model, deviceName, systemName, systemVersion, brand, isEmulator] = await Promise.all([
          DeviceInfo.getUniqueId(),
          DeviceInfo.getManufacturer(),
          DeviceInfo.getModel(),
          DeviceInfo.getDeviceName(),
          DeviceInfo.getSystemName(),
          DeviceInfo.getSystemVersion(),
          DeviceInfo.getBrand(),
          DeviceInfo.isEmulator(),
        ]);

        await crashlytics().setUserId(values.email);
        await crashlytics().setUserProperties({
          email: values.email,
          username: data.Data.username || values.email,
          appVersion: versionName,
          buildNumber: versionCode,
          deviceId: uniqueId,
          deviceModel: model,
          deviceBrand: brand,
          manufacturer: manufacturer,
          deviceName: deviceName,
          os: systemName,
          osVersion: systemVersion,
          isEmulator: String(isEmulator),
        });

      }
    } catch (error) {
      crashlytics().recordError(error);
    }
  };

  const initialValues = React.useRef({
    email: '',
    password: '',
  }).current;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={[styles.imageBackground, { paddingTop: STATUS_BAR_HEIGHT() }]}>
        <View style={{ justifyContent: 'space-between', flex: 1, padding: 15, paddingBottom: bottomHeight() }}>
          <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
            <Image
              source={require('../../assets/logo2.png')}
              style={{ width: PixelRatio.getPixelSizeForLayoutSize(60), height: PixelRatio.getPixelSizeForLayoutSize(60) }}
              resizeMode="contain"
            />
          </View>
          <ScrollView style={{ backgroundColor: 'white', borderRadius: 40, paddingTop: 20 }} showsVerticalScrollIndicator={false} >
            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
              <ThemedText size='lg' weight='SemiBold' align='center'>
                Welcome to
              </ThemedText>
              <ThemedText size='lg' weight='SemiBold' align='center'>
                Sysboat login now!
              </ThemedText>
              <Formik
                onSubmit={handleLogin}
                initialValues={initialValues}
                validationSchema={validationSchema}>
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                }) => (
                  <View style={{ paddingTop: 50, gap: 20 }}>
                    <View style={{ position: 'relative', gap: 20 }}>
                      <View style={{ gap: 0 }}>
                        <View style={[styles.main, touched.email && errors.email ? styles.errorInput : styles.successInput, { display: 'flex', flexDirection: 'row', width: '100%', gap: 10 }]}>
                          <TextInput
                            editable={isPending ? false : true}
                            style={[
                              styles.input,
                              (touched.email && errors.email) && styles.errorInput
                            ]}
                            selectionHandleColor={COLORS.text_secondary}
                            placeholder="Email"
                            placeholderTextColor={COLORS.text_secondary}
                            cursorColor={COLORS.text_secondary}
                            keyboardType="email-address"
                            onChangeText={handleChange('email')}
                            onBlur={handleBlur('email')}
                            value={values.email}
                          />
                        </View>
                        {/* {touched.email && errors.email && (
                          <ThemedText size='xs' weight='Regular' color='error'>
                            {errors.email}
                          </ThemedText>
                        )} */}
                      </View>

                      <View style={{ gap: 10 }}>
                        <View style={[styles.main, (touched.password && errors.password) ? styles.errorInput : styles.successInput, { display: 'flex', flexDirection: 'row', width: '100%', gap: 10, position: 'relative', }]}>
                          <TextInput
                            editable={isPending ? false : true}
                            placeholder="Password"
                            placeholderTextColor={COLORS.text_secondary}
                            selectionHandleColor={COLORS.text_secondary}
                            cursorColor={COLORS.text_secondary}
                            secureTextEntry={showPassword ? false : true}
                            onChangeText={handleChange('password')}
                            onBlur={handleBlur('password')}
                            value={values.password}
                            style={[
                              styles.input,
                            ]}

                          />
                          <TouchableOpacity
                            style={{
                              position: 'absolute',
                              right: 20,
                              top: '50%',
                              transform: [{ translateY: '-30%' }],
                            }}

                            onPress={() => {
                              setShowPassword(!showPassword);
                            }}>
                            {showPassword ? (
                              <Icon1 color={'#CA282C'} width={20} />
                            ) : (
                              <Icon2 color={'#CA282C'} width={20} />
                            )}
                          </TouchableOpacity>
                        </View>
                        {/* {touched.password && errors.password && (
                          <Text style={{ color: 'red' }}>{errors.password}</Text>
                        )} */}
                      </View>
                    </View>

                    <TouchableOpacity
                      disabled={isPending ? true : false}
                      onPress={handleSubmit}
                      style={{
                        height: 60,
                        width: '100%',
                        borderRadius: 100,
                        backgroundColor: '#CA282C',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 20,
                      }}>
                      {isPending ? (
                        <ActivityIndicator size="large" color="white" />
                      ) : (
                        <Text
                          style={{
                            color: 'white',
                            fontSize: 18,
                            fontFamily: 'Poppins-Medium',
                            lineHeight: 35,
                          }}>
                          Login
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('ForgotPassword')}>
                      <Text
                        style={{
                          textAlign: 'center',
                          color: '#CA282C',
                          paddingTop: 5,
                          fontSize: 12,
                          fontFamily: 'Poppins-Regular',
                          paddingTop: 20,
                        }}>
                        Forgot Password
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Formik>


            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  errorInput: {
    borderColor: 'red',
  },
  successInput: {
    borderColor: 'white',
  },
  signupText: {
    fontFamily: 'Poppins-Regular',
  },
  signupLink: {
    color: 'blue',
    fontFamily: 'Poppins-Regular',
  },
  title: {
    fontSize: 25,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  main: {
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: 'white'
  },
  input: {
    color: 'black',
    width: '100%',
    fontSize: 16,
    height: 50,
    fontFamily: 'Poppins-Regular',
  },
  imageBackground: {
    flex: 1,
    position: 'relative',
    ...StyleSheet.absoluteFillObject
  },
});



export default Signin;



