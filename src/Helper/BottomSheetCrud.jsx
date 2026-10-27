import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    Animated,
    PanResponder,
    Pressable,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    BackHandler,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CustomDropdown from './CustomDropdown';
import BottomSheetBase from './BottomSheetBase';
import CustomNativeDropdown from './CustomNativeDropdown';
import { getFontSize } from './Helper';

const { height } = Dimensions.get('window');

const BottomSheetCrud = ({ visible, onClose, fields, onSubmit, initialValues, validationSchema, loading, dropdown, dropdowndata, modeName, employeeData }) => {
    const dropdowndatalist = dropdowndata?.map(record => record.rule_name) || [];
    const employeedatalist = employeeData?.data?.map(record => record.first_name) || [];

    useEffect(() => {
    }, [loading, dropdowndata, modeName]);

    const getSelectedId = (selectedName) => {
        const selectedItem = dropdowndata.find(item => item.rule_name === selectedName);
        return selectedItem ? selectedItem.id : null;
    };

    const getSelectedEmployeeId = (selectedName) => {
        const selectedItem = employeeData?.data?.find(item => item.first_name === selectedName);
        console.warn('sfsdfsdf', selectedItem);
        return selectedItem ? selectedItem.id : null;
    };

    return (
        <BottomSheetBase snapPoints={['100%']} isSnapPoint={true} visible={visible} onClose={onClose}>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                enableReinitialize
                onSubmit={(values) => {
                    if (modeName === 'assignRule') {
                        const selectedId = getSelectedId(values.workWeekTypes);
                        const getSelectedEmployeeIds = getSelectedEmployeeId(values.employeeRule);
                        onSubmit({ ...values, workWeekTypesId: selectedId, employee: getSelectedEmployeeIds });
                    } else {
                        onSubmit(values);
                    }
                }}
            >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                    <View style={{ flex: 1, justifyContent: 'space-between' }}>
                        <View style={[{ gap: modeName == 'assignRule' ? 30 : 0, }]}>
                            {modeName == 'assignRule' && (
                                <View style={{ gap: 30 }}>
                                    <View>
                                        <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#6A7D94' }}>Rule Name</Text>
                                        <CustomNativeDropdown
                                            enableDefaultOption={true}
                                            placeholder={'Select Rule Type'}
                                            value={values.workWeekTypes}
                                            onValueChange={(value) => setFieldValue('workWeekTypes', value)}
                                            error={touched.workWeekTypes && errors.workWeekTypes}
                                            datas={['', ...dropdowndatalist]}
                                        />
                                        {/* <CustomDropdown
                                        key="workWeekTypes"
                                        value={values.workWeekTypes}
                                        onValueChange={(value) => setFieldValue("workWeekTypes", value)}
                                        error={touched.workWeekTypes && errors.workWeekTypes}
                                        data={['', ...dropdowndatalist]}
                                        border={true}
                                        placeholder="Select Rule Type"
                                    /> */}
                                    </View>
                                    <View>
                                        <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#6A7D94' }}>Employee</Text>
                                        <CustomNativeDropdown
                                            enableDefaultOption={true}
                                            placeholder={'Select Employee Type'}
                                            value={values.employeeRule}
                                            onValueChange={(value) => setFieldValue('employeeRule', value)}
                                            error={touched.employeeRule && errors.employeeRule}
                                            datas={['', ...employeedatalist]}
                                        />
                                        {/* <CustomDropdown
                                        key="employeeRule"
                                        value={values.employeeRule}
                                        onValueChange={(value) => setFieldValue("employeeRule", value)}
                                        error={touched.employeeRule && errors.employeeRule}
                                        data={['', ...employeedatalist]}
                                        border={true}
                                        placeholder="Select Employee Type"
                                    /> */}
                                    </View>

                                </View>
                            )}
                            {modeName != 'assignRule' && (
                                fields.map((field, index) => (
                                    <View key={index}>
                                        {React.cloneElement(field, {
                                            onChangeText: handleChange(field.props.name),
                                            onBlur: handleBlur(field.props.name),
                                            value: values[field.props.name],
                                        })}
                                        {errors[field.props.name] && touched[field.props.name] && (
                                            <Text style={styles.errorText}>{errors[field.props.name]}</Text>
                                        )}
                                    </View>
                                ))
                            )}



                        </View>
                        <TouchableOpacity disabled={loading ? true : false} style={styles.button} onPress={handleSubmit}>
                            {loading ? (
                                <ActivityIndicator size={25} color={'white'} />
                            ) : (
                                <Text style={styles.buttonText}>Submit</Text>
                            )}

                        </TouchableOpacity>
                    </View>
                )}
            </Formik>
        </BottomSheetBase>

    );
};

const styles = StyleSheet.create({
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
    button: {
        height: 52,
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
});

export default BottomSheetCrud;
