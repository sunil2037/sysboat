import { Formik } from 'formik';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import * as Yup from 'yup';
import BottomSheetBase from './BottomSheetBase';
import CustomNativeDropdown from './CustomNativeDropdown';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

const getValidationSchema = (actionType) => Yup.object().shape({
    department: Yup.string().when([], {
        is: () => actionType === 'DepartmentEdit' || actionType == 'AddDepartment' || actionType === 'SubDepartmentEdit' || actionType == 'AddSubDepartment' || actionType == '',
        then: schema => schema.required('Department is required'),
        otherwise: schema => schema.notRequired(),
    }),
    sub_department: Yup.string().when([], {
        is: () => actionType === 'SubDepartmentEdit' || actionType == 'AddSubDepartment' || actionType == '',
        then: schema => schema.required('Sub department is required'),
        otherwise: schema => schema.notRequired(),
    }),
    designation: Yup.string().notRequired(),
});



const GridData = ({ parentDepartments, handleSubmit, values, setFieldValue, errors, touched, actionType, loading }) => {
    return (
        <ScrollView style={{ width: '100%' }}>
            <View style={{ paddingTop: 20 }}>
                {actionType === 'DepartmentEdit' || actionType === 'AddDepartment' ? (
                    <View style={{ paddingVertical: 20, gap: 10 }}>
                        <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#293646' }}>Department</Text>
                        <View>
                            <TextInput
                                multiline={false}
                                numberOfLines={4}
                                placeholder=""
                                value={values.department}
                                onChangeText={(text) => setFieldValue('department', text)}
                                placeholderTextColor="#6A7D94"
                                style={[styles.input, errors.department ? styles.errorBorder : null, {
                                }]}
                            />

                        </View>
                    </View>
                ) : actionType === 'SubDepartmentEdit' || actionType === 'AddSubDepartment' ? (
                    <>
                        <View style={{ paddingVertical: 20, gap: 10 }}>
                            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#293646' }}>Department</Text>
                            <CustomNativeDropdown
                                modeType={'reportingManager'}
                                mode={true}
                                keyField="id"
                                valueField="name"
                                value={values.department}
                                onValueChange={(value) => setFieldValue('department', value.key)}
                                error={touched.department && errors.department}
                                datas={parentDepartments}
                            />
                        </View>

                        <View style={{ gap: 10 }}>
                            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#293646' }}>Sub Department</Text>
                            <View>
                                <TextInput
                                    multiline={false}
                                    numberOfLines={4}
                                    placeholder=""
                                    value={values.sub_department}
                                    onChangeText={(text) => setFieldValue('sub_department', text)}
                                    placeholderTextColor="#6A7D94"
                                    style={[styles.input, errors.sub_department ? styles.errorBorder : null, {
                                    }]}
                                />
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={{ gap: 10 }}>
                            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#293646' }}>Department</Text>
                            <View>
                                <TextInput
                                    multiline={false}
                                    numberOfLines={4}
                                    placeholder=""
                                    value={values.department}
                                    onChangeText={(text) => setFieldValue('department', text)}
                                    placeholderTextColor="#6A7D94"
                                    style={[styles.input, errors.department ? styles.errorBorder : null, {
                                    }]}
                                />
                            </View>
                        </View>
                        <View style={{ gap: 10 }}>
                            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#293646' }}>Sub Department</Text>
                            <View>
                                <TextInput
                                    multiline={false}
                                    numberOfLines={4}
                                    placeholder=""
                                    value={values.sub_department}
                                    onChangeText={(text) => setFieldValue('sub_department', text)}
                                    placeholderTextColor="#6A7D94"
                                    style={[styles.input, errors.sub_department ? styles.errorBorder : null, {
                                    }]}
                                />
                            </View>
                        </View>
                    </>
                )}

                <TouchableOpacity disabled={loading} onPress={handleSubmit} style={{ height: 52, backgroundColor: '#CA282C', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={{ fontFamily: 'Poppins-Medium', color: 'white', fontSize: 15, lineHeight: 15 }}>SUBMIT</Text>
                    )}

                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const BottomSheetDesignation = ({ multipleSelect = false, visible, onClose, actionType, isDesignation = false, parentDepartments, actionData, loading, editableData }) => {
    return (
        <BottomSheetBase snapPoints={['100%']} isSnapPoint={true} visible={visible} onClose={onClose} >
            <View style={styles.content}>
                {!isDesignation ? (
                    <Formik
                        enableReinitialize
                        initialValues={{
                            designation: '',
                            department: editableData?.parent_id ? editableData?.parent_id || '' : editableData?.name,
                            sub_department: editableData?.parent_id !== null ? editableData?.name || '' : '',
                            sub_department_id: editableData?.id || '',
                        }}
                        validationSchema={getValidationSchema(actionType)}
                        onSubmit={(values) => {
                            actionData(values);
                        }}
                    >
                        {(formikProps) => (
                            <GridData
                                handleSubmit={formikProps.handleSubmit}
                                values={formikProps.values}
                                setFieldValue={formikProps.setFieldValue}
                                errors={formikProps.errors}
                                touched={formikProps.touched}
                                actionType={actionType}
                                parentDepartments={parentDepartments}
                                loading={loading}
                            />
                        )}
                    </Formik>
                ) : (
                    <View style={{ width: '100%', flex: 1, height: '100%' }}>
                        <View style={{ paddingVertical: 20, gap: 10 }}>
                            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#293646' }}>Designation</Text>
                            <View>
                                <BottomSheetTextInput
                                    placeholder=""
                                    placeholderTextColor="#6A7D94"
                                    style={[styles.input]}
                                />

                            </View>
                        </View>
                        <CustomNativeDropdown datas={editableData} isMultipleSelect={true} />
                        <TouchableOpacity style={{ height: 52, backgroundColor: '#CA282C', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 40, }}>
                            <Text style={{ fontFamily: 'Poppins-Medium', color: 'white', fontSize: 15, lineHeight: 15 }}>SUBMIT</Text>
                        </TouchableOpacity>
                    </View>

                )}
            </View>
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
        backgroundColor: '#fff',
        height: 57,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#6A7D94',
        lineHeight: 15,
        justifyContent: 'center',
        width: '100%',
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
    },
    errorBorder: {
        borderWidth: 1,
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
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
        flex: 1
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

export default BottomSheetDesignation;
