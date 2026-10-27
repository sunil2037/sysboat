import * as React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Button, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Link } from '@react-navigation/native';
import { Formik } from 'formik';
import { validationSignup } from '../Helper/Validation';
import Toast from 'react-native-toast-message';
import { Icon1, Icon2, Email, Password, User } from '../Helper/IconsLoad';
import { getFontSize } from '../Helper/Helper';

const Signup = ({ navigation }) => {
    const [selectedOption, setSelectedOption] = React.useState(false);
    const [visible, setVisible] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={{ flex: 1 }}>
                    <Toast />
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.title}>Get Started with Us</Text>
                        <Formik
                            initialValues={{ email: '', password: '', confirmPassword: '' }}
                            validationSchema={validationSignup}
                            onSubmit={values => {
                                console.warn(values);
                                Toast.show({
                                    type: 'success',
                                    text1: 'Success',
                                    text2: 'Successfuly login 👋',
                                });
                            }}
                        >
                            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                <View>
                                    <View>
                                        <View style={{ position: 'relative' }}>
                                            <TextInput
                                                style={[styles.input, touched.name && errors.name && styles.errorInput]}
                                                placeholder="Your Name"
                                                placeholderTextColor="#000"
                                                onChangeText={handleChange('name')}
                                                onBlur={handleBlur('name')}
                                                value={values.name}
                                            />
                                            <View style={{ position: 'absolute', left: 10, top: 35 }}>
                                                <User />
                                            </View>
                                            {touched.name && errors.name && (
                                                <Text style={{ color: 'red' }}>{errors.name}</Text>
                                            )}
                                        </View>
                                        <View style={{ position: 'relative' }}>
                                            <TextInput
                                                style={[styles.input, touched.email && errors.email && styles.errorInput]}
                                                placeholder="Email"
                                                placeholderTextColor="#000"
                                                keyboardType="email-address"
                                                onChangeText={handleChange('email')}
                                                onBlur={handleBlur('email')}
                                                value={values.email}
                                            />
                                            <View style={{ position: 'absolute', left: 10, top: 35 }}>
                                                <Email />
                                            </View>
                                            {touched.email && errors.email && (
                                                <Text style={{ color: 'red' }}>{errors.email}</Text>
                                            )}
                                        </View>

                                        <View style={{ display: 'flex', position: 'relative' }}>
                                            <TextInput
                                                style={[styles.input, touched.password && errors.password && styles.errorInput]}
                                                placeholder="Password"
                                                placeholderTextColor="#000"
                                                secureTextEntry={showPassword ? false : true}
                                                onChangeText={handleChange('password')}
                                                onBlur={handleBlur('password')}
                                                value={values.password}
                                            />
                                            <TouchableOpacity style={{ position: 'absolute', right: 10, top: 38 }} onPress={() => { setShowPassword(!showPassword); }}>
                                                {showPassword ? (
                                                    <Icon1 width={20} />
                                                ) : (
                                                    <Icon2 width={20} />
                                                )}
                                            </TouchableOpacity>
                                            <View style={{ position: 'absolute', left: 10, top: 35 }}>
                                                <Password />
                                            </View>
                                        </View>
                                        {touched.password && errors.password && (
                                            <Text style={{ color: 'red' }}>{errors.password}</Text>
                                        )}

                                        <View style={{ display: 'flex', position: 'relative' }}>
                                            <TextInput
                                                style={[styles.input, touched.password && errors.password && styles.errorInput]}
                                                placeholder="Re-Enter Password"
                                                placeholderTextColor="#000"
                                                secureTextEntry={showConfirmPassword ? false : true}
                                                onChangeText={handleChange('confirmPassword')}
                                                onBlur={handleBlur('confirmPassword')}
                                                value={values.confirmPassword}
                                            />
                                            <TouchableOpacity style={{ position: 'absolute', right: 10, top: 38 }} onPress={() => { setShowConfirmPassword(!showConfirmPassword); }}>
                                                {showConfirmPassword ? (
                                                    <Icon1 width={20} />
                                                ) : (
                                                    <Icon2 width={20} />
                                                )}
                                            </TouchableOpacity>
                                            <View style={{ position: 'absolute', left: 10, top: 35 }}>
                                                <Password />
                                            </View>
                                        </View>

                                        {touched.confirmPassword && errors.confirmPassword && <Text style={{ color: 'red' }}>{errors.confirmPassword}</Text>}
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleSubmit}
                                        style={{
                                            height: 60,
                                            width: '100%',
                                            borderRadius: 10,
                                            backgroundColor: 'black',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginTop: 30,

                                        }}>
                                        <Text style={{
                                            color: 'white', fontSize: 18,
                                            fontFamily: 'Poppins-Medium',
                                            lineHeight: 35,
                                        }}>Create Account</Text>
                                    </TouchableOpacity>
                                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
                                        <Text style={styles.signupText}>
                                            Already have an account?
                                        </Text>
                                        <Pressable onPress={() => navigation.navigate('Signin')}>
                                            <Text style={styles.signupLink}> Signin</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                        </Formik>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 0,
        backgroundColor: 'white',
    },
    signupText: {
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
    },
    signupLink: {
        color: 'blue',
        fontFamily: 'Poppins-Regular',

    },
    title: {
        fontSize: 40,
        marginBottom: 20,
        lineHeight: 50,
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

export default Signup;
