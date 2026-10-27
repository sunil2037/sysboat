import {
    FlatList,
    ImageBackground,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
    Image,
    RefreshControl,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import backgroundImage from '../../assets/Icon/background.png';
import TopNavBar from '../navigation/TopNavBar';
import { AdvancedCheckbox } from 'react-native-advanced-checkbox';
import useApi from '../Apis/Services/ApiConfig';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { useMutation, useQuery } from '@tanstack/react-query';
import { bottomHeight, DEFAULT_IMAGE, getFontSize, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import { API_BASE_URL, API_BASE_URL2 } from '../Apis/Services/ServerURL';
import { toast } from '../Helper/ToastManager';
import EmptyMessage from '../Helper/EmptyMessage';
import NetInfo from '@react-native-community/netinfo';

import { useAuth } from '../Context/AuthContext';
import Skeleton, { getLayout } from '../Helper/Skeleton';

const PERMISSIONS_MAP = {
    'Block App': 'block_app',
    'Location Access': 'location_access',
    'Interval ( Minute )': 'interval_ms',
    'Face Detection': 'face_detection',
    'Live Face Detection': 'live_face_detection',
    'Branch Switch': 'branch_switch',
    'Allow Re-Login': 'allow_relogin',
    'Block Punch In Out': 'block_punch_in_out',
    'Block Break In Out': 'block_break_in_out',
    'Hide Attendance': 'hide_attendance',
    'Hide Leaves': 'hide_leaves',
    'Hide Teams': 'hide_team',
    'Hide Register Face': 'hide_register_face',
    'Hide Payroll': 'hide_payroll',
    'Hide Holiday Calendar': 'hide_holiday_calendar',
    'Hide Id Card': 'hide_id_card',
    'Hide Expenses': 'hide_expenses',
    'Hide Employees': 'hide_employees',
    'Hide Chat': 'hide_chat',
    'Hide Permissions': 'hide_permissions',
    'Hide Get Approve Button': 'block_get_approve_button',
    'Hide Approve Button': 'block_approve_button',
    'Hide Delete Button': 'block_delete_button',
    'Hide Create Leave Button': 'block_create_leave_button',
    'Hide Approve Leave Button': 'block_approve_leave',
    'Hide Reject Leave Button': 'block_reject_leave',
    'Hide Delete Leave Button': 'block_delete_leave',
    'Hide Create Holiday Button': 'block_create_holiday',
    'Hide Create Expense Button': 'block_create_expense',
    'Hide Edit Employee Button': 'block_edit_employee',
    'Hide Edit Profile Button': 'block_edit_profile_button',
    'Hide Personal Info Edit Button': 'block_personal_info_edit',
    'Hide Work Week Edit Button': 'block_work_week_edit',
    'Hide Document Upload': 'block_document_upload',
    'Hide Profile Tab': 'hide_profile_tab',
    'Hide Work Week Details Edit Button': 'block_work_details_edit',
    'Hide Department Edit Button': 'block_department_edit',
    'Hide Sub Department Edit Button': 'block_subdepartment_edit',
    'Hide Track Employees': 'hide_track_employees',
};

const PERMISSIONS = Object.keys(PERMISSIONS_MAP);

const PermissionScreen = ({ navigation }) => {
    const [checked, setChecked] = useState({});
    const [expandedIndex, setExpandedIndex] = useState(null);
    const { CompanyEmployeeLists, PermissionsDetails, PermissionsUpdate, resetApiClient } = useApi();
    const { userdata } = useEncodedUserData();
    const [employeeId, setEmployeeId] = useState('');
    const [intervalValue, setIntervalValue] = useState('');
    const [refresh, setRefresh] = useState(false);
    const { refetchProfile, reloadAuthData } = useAuth();

    const handlePress = (item) => {
        setEmployeeId(item?.id);
        setExpandedIndex(prev => (prev === item?.id ? null : item?.id));
    };

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected) {
                resetApiClient();
            }
        });
        return unsubscribe;
    }, []);

    const { data: CompanyEmployeeListsData, isLoading } = useQuery({
        queryKey: ['CompanyEmployeeLists', userdata],
        queryFn: () =>
            CompanyEmployeeLists({
                userData: userdata,
                type: '',
                UserId: '',
                platformType: Platform.OS,
                type: 'permission',
            }),
        enabled: !!userdata,
    });

    const {
        data: PermissionsDetailsData,
        refetch: PermissionsDetailsRefetch,
    } = useQuery({
        queryKey: ['PermissionsDetails', userdata, employeeId],
        queryFn: () =>
            PermissionsDetails({
                userData: userdata,
                employee_id: employeeId,
            }),
        enabled: !!userdata && !!employeeId,
    });

    const { mutate: updatePermissions, isPending: isSaving } = useMutation({
        mutationFn: (payload) =>
            PermissionsUpdate({
                userData: userdata,
                employee_id: employeeId,
                ...payload,
            }),
        onSuccess: (response) => {
            if (response?.status) {
                toast.success('Permissions updated successfully!');
                PermissionsDetailsRefetch();
                refetchProfile();
                reloadAuthData();
            } else {
                refetchProfile();
                reloadAuthData();
                toast.error('Failed to update permissions.');
            }
        },
        onError: (error) => {
            toast.error('Something went wrong while saving.');
        },
    });

    useEffect(() => {
        if (PermissionsDetailsData?.data?.[0]) {
            const details = PermissionsDetailsData.data[0];
            const newChecked = {};
            Object.entries(PERMISSIONS_MAP).forEach(([perm, key]) => {
                if (key === 'interval_ms') {
                    setIntervalValue(String(details[key] ?? '0'));
                } else {
                    newChecked[perm] = details[key] === 1;
                }
            });
            setChecked(newChecked);
        }
    }, [PermissionsDetailsData]);

    const handleToggle = (perm) => {
        setChecked((prev) => ({
            ...prev,
            [perm]: !prev[perm],
        }));
    };

    const handleSave = () => {
        const payload = {};
        Object.entries(PERMISSIONS_MAP).forEach(([perm, key]) => {
            if (key === 'interval_ms') {
                payload[key] = Number(intervalValue) || 0;
            } else {
                payload[key] = checked[perm] ? 1 : 0;
            }
        });
        updatePermissions(payload);
    };

    const renderItem = ({ item }) => (
        <View>
            <TouchableOpacity onPress={() => handlePress(item)} style={styles.card}>
                <View>
                    <Image
                        source={{
                            uri: item?.profile_image ? API_BASE_URL2 + item?.profile_image : DEFAULT_IMAGE,
                        }}
                        resizeMode={'cover'}
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                        }}
                    />
                </View>
                <View style={{ flex: 1, paddingVertical: 15 }}>
                    <Text style={styles.heading}>{item.name}</Text>
                    <Text style={styles.subheading}>{item?.designation || 'Employee'}</Text>
                </View>
            </TouchableOpacity>

            {expandedIndex === item?.id && (
                <View style={{ paddingHorizontal: 5, paddingTop: 5 }}>
                    <View
                        style={{
                            backgroundColor: 'white',
                            paddingHorizontal: 10,
                            paddingVertical: 15,
                            gap: 10,
                            borderRadius: 10,
                            borderColor: '#E2E2E2',
                            borderWidth: 1,
                        }}
                    >
                        {PERMISSIONS.map((perm) => (
                            <View
                                key={perm}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#F6F6F6',
                                    paddingHorizontal: 10,
                                    borderRadius: 8,
                                    paddingVertical: 5,
                                }}
                            >
                                <Text style={{ fontFamily: 'Poppins-Medium', color: '#293646' }}>{perm}</Text>
                                {perm === 'Interval ( Minute )' ? (
                                    <TextInput
                                        cursorColor={'black'}
                                        keyboardType="numeric"
                                        maxLength={5}
                                        value={intervalValue}
                                        onChangeText={setIntervalValue}
                                        style={{
                                            borderWidth: 1.5,
                                            borderRadius: 10,
                                            width: 60,
                                            textAlign: 'center',
                                            color: 'black',
                                            height: 50,
                                            borderColor: '#6c757d',
                                        }}
                                    />
                                ) : (
                                    <AdvancedCheckbox
                                        value={!!checked[perm]}
                                        onValueChange={() => handleToggle(perm)}
                                        labelPosition="left"
                                        checkedColor="#28a745"
                                        uncheckedColor="#6c757d"
                                        size={25}
                                        animationType="bounce"
                                        checkBoxStyle={{ borderRadius: 8 }}
                                    />
                                )}
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSaving}
                            style={{
                                height: 52,
                                backgroundColor: isSaving ? '#999' : '#CA282C',
                                borderRadius: 8,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: 'Poppins-Medium',
                                    color: 'white',
                                    fontSize: 15,
                                }}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );

    const onRefresh = async () => {
        setRefresh(true);
        await PermissionsDetailsRefetch();
        setRefresh(false);
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ImageBackground
                source={backgroundImage}
                resizeMode="cover"
                style={{ flex: 1, backgroundColor: '#F9F9F9', paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}
            >
                <View style={{ flex: 1 }}>
                    <TopNavBar title={'Permission'} navigation={navigation} />
                    <View style={{ paddingHorizontal: 15, flex: 1, paddingBottom: 10 }}>
                        <Skeleton isLoading={isLoading} layout={getLayout({ length: 8, height: 93 })}>
                            <FlatList
                                data={CompanyEmployeeListsData?.data}
                                renderItem={renderItem}
                                refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={refresh} />}
                                keyExtractor={(item, index) => index.toString()}
                                showsVerticalScrollIndicator={false}
                                onEndReachedThreshold={0.7}
                                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                                contentContainerStyle={{ paddingBottom: bottomHeight() }}
                                ListEmptyComponent={<EmptyMessage />}
                            />
                        </Skeleton>
                    </View>
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
};

export default PermissionScreen;

const styles = StyleSheet.create({
    card: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'white',
        alignItems: 'center',
        borderRadius: 10,
        gap: 10,
        marginHorizontal: 5,
        paddingVertical: 10,
        borderColor: '#E2E2E2',
        borderWidth: 1,
        paddingLeft: 10,
    },
    heading: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        lineHeight: 20,
        color: '#293646',
        textTransform: 'capitalize',
    },
    subheading: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        lineHeight: 20,
        color: '#6A7D94',
        textTransform: 'capitalize',
    },
});
