import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Formik } from 'formik';
import CustomNativeDropdown from './CustomNativeDropdown';
import { Cross } from './IconsLoad';
import useApi from '../Apis/Services/ApiConfig';
import { useQuery } from '@tanstack/react-query';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { getFontSize, SystemOS, useDebounce } from './Helper';
import ThemedText from './ThemedText';

const SCREEN_WIDTH = Dimensions.get('window').width;

const FilterStickyBox = ({ visible = false, onClose, onApply }) => {
    const translateY = useSharedValue(-150);
    const { CompanyEmployeeLists } = useApi();
    const { userdata } = useEncodedUserData();

    const selectData = [
        { key: 'Active', value: 'Active' },
        { key: 'In Active', value: 'In Active' },
        { key: 'Present', value: 'Present' },
        { key: 'Absent', value: 'Absent' },
    ];

    const getType = (value) => {
        switch (value) {
            case "Active":
                return 'active'
            case "In Active":
                return 'inactive'
            case "Present":
                return 'present'
            case "Absent":
                return 'absent'
            default:
                break;
        }
    }

    const {
        data: CompanyEmployeeListsData,
    } = useQuery({
        queryKey: ['CompanyEmployeeLists', userdata],
        queryFn: () =>
            CompanyEmployeeLists({
                userData: userdata,
                type: '',
                UserId: '',
                platformType: Platform.OS,
            }),
        enabled: !!userdata,
    });

    React.useEffect(() => {
        translateY.value = withTiming(visible ? 0 : -400, {
            duration: 300,
            easing: Easing.inOut(Easing.ease),
        });
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: visible ? translateY.value : -400 }],
        };
    });

    return (
        <Animated.View style={[
            filterStyles.container,
            animatedStyle,
        ]}>
            <Formik
                initialValues={{
                    search: '',
                    type: null,
                    reportingManager: null,
                }}
                enableReinitialize
                onSubmit={() => { }}
            >
                {({ values, setFieldValue, resetForm, handleSubmit }) => {
                    const debouncedSearch = useDebounce(values.search, 500);
                    React.useEffect(() => {
                        onApply?.({
                            type: getType(values.type),
                            reportingManager: values.reportingManager,
                            search: debouncedSearch,
                        });
                    }, [values.type, values.reportingManager, debouncedSearch, onApply]);




                    return (
                        <>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20 }}>
                                <ThemedText size='md' weight='Medium'>
                                    Filter
                                </ThemedText>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => resetForm()}>
                                        <ThemedText size='md' weight='Medium'>
                                            Reset
                                        </ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={filterStyles.closeBtn} onPress={onClose}>
                                        <Cross width={35} height={35} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={filterStyles.row}>
                                <TextInput
                                    style={filterStyles.input}
                                    placeholder="Search Employees"
                                    placeholderTextColor={'#45484D'}
                                    value={values.search}
                                    onChangeText={(text) => setFieldValue('search', text)}

                                />
                                <View style={{ flex: 1, justifyContent: 'space-between', gap: 10 }}>
                                    <CustomNativeDropdown
                                        datas={selectData}
                                        mode={true}
                                        placeholder="Select Type"
                                        keyField="key"
                                        valueField="value"
                                        value={values.type}
                                        onValueChange={item => setFieldValue('type', item)}
                                        defaultOption={{ key: '', value: '' }}
                                    />

                                    <CustomNativeDropdown
                                        mode={true}
                                        search={true}
                                        keyField="id"
                                        valueField="name"
                                        modeType="reportingManager"
                                        enableDefaultOption={true}
                                        placeholder={'Select Reporting Manager'}
                                        defaultOption={{ id: '', name: '' }}
                                        value={values.reportingManager}
                                        onValueChange={val => setFieldValue('reportingManager', val)}
                                        datas={CompanyEmployeeListsData?.data}
                                    />
                                </View>
                                {/* <TouchableOpacity
                                    onPress={handleSubmit}
                                    style={{
                                        height: 40,
                                        borderRadius: 10,
                                        flex: 1,
                                        flexDirection: 'row',
                                        backgroundColor: '#CA282C',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: 5,
                                        marginTop: 10,
                                    }}>
                                    <Text
                                        style={{
                                            color: 'white',
                                            fontSize: 12,
                                            fontFamily: 'Poppins-Medium',
                                            lineHeight: SystemOS() ? 20 : 0,
                                        }}>
                                        Apply Filter
                                    </Text>
                                </TouchableOpacity> */}
                            </View>
                        </>
                    );
                }}
            </Formik>
        </Animated.View>
    );
};

const filterStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: SCREEN_WIDTH,
        backgroundColor: '#F5F5F5',
        zIndex: 999,
        padding: 15,
        paddingTop: 40,
        paddingBottom: 15,
    },
    row: {
        gap: 10,
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        height: 60,
        borderRadius: 10,
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#45484D',
    },
    closeBtn: {
        padding: 8,
    },
});

export default FilterStickyBox;
