import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,

} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import BottomSheetBase from './BottomSheetBase';
import { getFontSize } from './Helper';


const validationSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    message: Yup.string().required('Message is required'),
});

const BottomSheetNotification = ({ visible, onClose, handleSend, loading, viewData, mode = '', markAsRead }) => {
    const handleSubmit = (values) => {
        handleSend(values);
    };
    return (
        <BottomSheetBase visible={visible} onClose={onClose}>
            {mode == 'view' ? (
                <View style={{ gap: 20 }}>
                    <View>
                        <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 15, color: '#293646' }}>Title</Text>
                        <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#6A7D94' }}>{viewData?.title}</Text>
                    </View>
                    <View>
                        <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 15, color: '#293646' }}>Message</Text>
                        <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#6A7D94' }}>{viewData?.message}</Text>
                    </View>
                    <View>
                        <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 15, color: '#293646' }}>Created At</Text>
                        <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#6A7D94' }}>{new Date(viewData?.created_at).toLocaleDateString()}</Text>
                    </View>
                    {viewData.is_read == false && (
                        <TouchableOpacity onPress={() => markAsRead(viewData.id)} style={styles.submitButton}>
                            <Text style={styles.submitText}>Mark As Read</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <Formik
                    enableReinitialize
                    initialValues={{
                        title: '',
                        message: '',
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <View style={{ gap: 10, paddingBottom: 20 }}>
                            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 15, color: '#6A7D94', lineHeight: 17 }}>Title</Text>
                            <TextInput
                                placeholder="Title"
                                value={values.title}
                                onChangeText={handleChange('title')}
                                onBlur={handleBlur('title')}
                                placeholderTextColor="#6A7D94"
                                style={[styles.input]}
                            />
                            {touched.title && errors.title && (
                                <Text style={styles.errorText}>{errors.title}</Text>
                            )}
                            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 15, color: '#6A7D94', lineHeight: 17, paddingTop: 10 }}>Message</Text>
                            <TextInput
                                multiline={true}
                                numberOfLines={10}
                                placeholder="Message"
                                value={values.message}
                                onChangeText={handleChange('message')}
                                onBlur={handleBlur('message')}
                                placeholderTextColor="#6A7D94"
                                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                            />
                            <TouchableOpacity disabled={loading} style={styles.submitButton} onPress={handleSubmit}>
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.submitText}>Send</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </Formik>
            )
            }
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
    subtitle: { fontSize: 10, fontFamily: 'Poppins-Medium', paddingVertical: 5, paddingHorizontal: 13, borderRadius: 20, lineHeight: 15 },
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
        lineHeight: 15,
        justifyContent: 'center',
        width: '100%',
    },
    content: {
        paddingTop: 20,
        paddingBottom: 20,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    box: {
        width: 40,
        height: 40,
        margin: 2,
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
        lineHeight: 15,
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

export default BottomSheetNotification;
