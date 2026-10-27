import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    ScrollView,
    ImageBackground
} from 'react-native';
import backgroundImage from '../../assets/Icon/background.png';
import BottomSheetBase from './BottomSheetBase';
import { bottomHeight, DEFAULT_IMAGE, getFontSize, SCREEN_WIDTH, STATUS_BAR_HEIGHT } from './Helper';
import { API_BASE_URL2 } from '../Apis/Services/ServerURL';
import { Formik } from 'formik';
import { AnnouncementValidationSchema, validationSchema } from './Validation';
import CustomNativeDropdown from './CustomNativeDropdown';
import DocumentUploadComponent from '../hooks/DocumentUploadComponent';
import ToastManager from './ToastManager';
import useNotificationStore from '../Context/useNotificationStore';
import { Cross, FileUploadIcon } from './IconsLoad';
import TopNavBar from '../navigation/TopNavBar';

const BottomSheetAnnouncement = ({
    visible,
    onClose,
    handleSend,
    mode,
    viewData,
    loading,
    employeeList,
}) => {
    const IS_COMPANY_UPDATES = Array.isArray(viewData?.employeesId);
    const imageUri = API_BASE_URL2 + (viewData?.img_url || viewData?.image) || DEFAULT_IMAGE;

    const [showUploader, setShowUploader] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [showEmployees, setShowEmployees] = useState(false);

    const handleUploadComplete = useCallback((_, file) => {
        setUploadedFile(file);
        setShowUploader(false);
    }, []);

    const EmployeesLists = () => {
        return (
            <BottomSheetBase isSnapPoint
                snapPoints={['80%']}
                visible={showEmployees}
                onClose={() => setShowEmployees(false)}>
                <View style={{ gap: 10 }}>
                    {viewData?.employeesId?.map((e, i) => (
                        <View key={i} style={{ borderWidth: 1, borderColor: '#d3d3d3', borderRadius: 10, padding: 10 }}>
                            <Text style={{ fontFamily: 'Poppins-Medium' }}>{e.label}</Text>
                        </View>
                    ))}
                </View>
            </BottomSheetBase>
        )
    }


    if (mode === 'view') {
        return (
            <BottomSheetBase
                isSnapPoint
                snapPoints={['100%']}
                visible={visible}
                onClose={onClose}
                contentContainerStyle={{ padding: 0, }}

            >
                <View style={{ gap: 20 }}>
                    {imageUri && (
                        <Image
                            source={{ uri: imageUri }}
                            style={{
                                width: '100%',
                                height: SCREEN_WIDTH / 1.2,
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                backgroundColor: '#dadadaff',
                            }}
                        />
                    )}
                </View>
                <View style={{ padding: 15, flex: 1 }}>
                    <Text style={styles.title}>{viewData?.title}</Text>
                    <Text style={styles.message}>{viewData?.message || viewData?.content}</Text>
                    {IS_COMPANY_UPDATES &&
                        <TouchableOpacity onPress={() => setShowEmployees(true)} style={{ backgroundColor: '#CA282C', padding: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 100, marginTop: 15, position: 'absolute', alignSelf: 'center', width: '100%', bottom: bottomHeight() }}>
                            <Text style={{ color: 'white', fontFamily: 'Poppins-Medium' }}>{`See All (${viewData?.employeesId.length}) Employees`}</Text>
                        </TouchableOpacity>}
                    {showEmployees && (
                        <EmployeesLists />
                    )}
                </View>
            </BottomSheetBase>
        );
    }


    return (
        <Modal visible={visible} onRequestClose={onClose} animationType="fade" statusBarTranslucent >
            <ToastManager />
            <ScrollView contentContainerStyle={{ flex: 1 }}>
                <ImageBackground
                    source={backgroundImage}
                    resizeMode="cover"
                    style={{ flex: 1, ...StyleSheet.absoluteFillObject }}
                >
                    <View style={[{ paddingTop: STATUS_BAR_HEIGHT(), gap: 0, flex: 1, paddingBottom: bottomHeight() }]}>
                        <TopNavBar title={'Notification'} navigation={onClose} />
                        <View style={styles.modalContainer}>
                            <Formik
                                enableReinitialize
                                initialValues={{
                                    title: '',
                                    message: '',
                                    receiver_id: '',
                                    img_url: '',
                                    notification_type: 'announcement',
                                    page_url: '/messages',
                                }}
                                validationSchema={AnnouncementValidationSchema}
                                onSubmit={(values) => {
                                    handleSend({
                                        ...values,
                                        img_url: uploadedFile?.file_path || '',
                                    });
                                }}
                            >
                                {({
                                    handleChange,
                                    handleBlur,
                                    handleSubmit,
                                    values,
                                    errors,
                                    setValues,
                                    touched,
                                    setFieldValue
                                }) => {
                                    return (
                                        <View style={styles.formWrapper}>
                                            <View style={{ gap: 10 }}>
                                                <View style={{ gap: 6 }}>
                                                    <Text style={styles.label}>Title</Text>
                                                    <View>
                                                        <TextInput
                                                            placeholder="Title"
                                                            value={values.title}
                                                            onChangeText={handleChange('title')}
                                                            onBlur={handleBlur('title')}
                                                            placeholderTextColor="#6A7D94"
                                                            style={styles.input}
                                                        />
                                                        {touched.title && errors.title && (
                                                            <Text style={styles.errorText}>{errors.title}</Text>
                                                        )}
                                                    </View>
                                                </View>
                                                <View>
                                                    <Text style={styles.label}>
                                                        Employees
                                                    </Text>
                                                    <CustomNativeDropdown
                                                        datas={employeeList?.data}
                                                        onValueChange={(e) => setFieldValue('receiver_id', e.join(', '))}
                                                        isMultipleSelect
                                                    />
                                                </View>
                                                <View style={{ gap: 6 }}>
                                                    <Text style={[styles.label]}>
                                                        Message
                                                    </Text>
                                                    <View>
                                                        <TextInput
                                                            multiline
                                                            numberOfLines={6}
                                                            placeholder="Message"
                                                            value={values.message}
                                                            onChangeText={handleChange('message')}
                                                            onBlur={handleBlur('message')}
                                                            placeholderTextColor="#6A7D94"
                                                            style={[styles.input, styles.textArea]}
                                                        />
                                                        {touched.message && errors.message && (
                                                            <Text style={styles.errorText}>{errors.message}</Text>
                                                        )}
                                                    </View>
                                                </View>

                                                {/* Document Upload */}
                                                <TouchableOpacity
                                                    disabled={loading}
                                                    style={[styles.uploadButton, { backgroundColor: 'white', borderRadius: 6, gap: 6 }]}
                                                    onPress={() => setShowUploader(true)}
                                                >
                                                    <FileUploadIcon />
                                                    <Text style={[styles.submitText, { color: 'black' }]}>
                                                        {uploadedFile ? 'Document Selected' : 'Select Document'}
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* Employee Selector */}


                                                <DocumentUploadComponent
                                                    visible={showUploader}
                                                    maxFiles={1}
                                                    onClose={() => setShowUploader(false)}
                                                    onUploadComplete={handleUploadComplete}
                                                />
                                            </View>

                                            <TouchableOpacity
                                                disabled={loading || !uploadedFile}
                                                style={[
                                                    styles.submitButton,
                                                    { opacity: uploadedFile ? 1 : 0.5 },
                                                ]}
                                                onPress={handleSubmit}
                                            >
                                                {loading ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Text style={styles.submitText}>Send</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    )
                                }}
                            </Formik>
                        </View>
                    </View>
                </ImageBackground>
            </ScrollView >
        </Modal >
    );
};

export default BottomSheetAnnouncement;

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        paddingHorizontal: 15,
    },
    formWrapper: {
        flex: 1,
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    label: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: '#6A7D94',
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 20,
    },
    message: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: '#4f4f4fff',
    },
    input: {
        borderColor: '#E2E2E2',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#6A7D94',
        height: 57,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    uploadButton: {
        height: 52,
        backgroundColor: '#CA282C',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    submitButton: {
        height: 52,
        backgroundColor: '#CA282C',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    submitText: {
        fontFamily: 'Poppins-Medium',
        color: '#fff',
        fontSize: 15,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
});
