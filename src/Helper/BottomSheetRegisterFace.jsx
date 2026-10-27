import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import BottomSheetBase from './BottomSheetBase'
import { getFontSize, SCREEN_WIDTH, STATUS_BAR_HEIGHT } from './Helper';
import CustomNativeDropdown from './CustomNativeDropdown';
import { useQuery } from '@tanstack/react-query';
import useEncodedUserData from '../hooks/useEncodedUserData';
import useApi from '../Apis/Services/ApiConfig';
import ThemedText from './ThemedText';

const BottomSheetRegisterFace = ({ visible, onClose, selectedImage, handleAddFace, isUploading, ADMIN, EMPLOYEE_ID }) => {
    const [newFaceName, setNewFaceName] = useState('');
    const [newEmployeeId, setNewEmployeeId] = useState('');
    const [employeeId, setEmployeeId] = useState();
    const { userdata } = useEncodedUserData();
    const [error, setError] = useState(false)

    const {
        CompanyEmployeeLists,
    } = useApi();

    const OnAddFace = (id) => {
        handleAddFace(id)
    }

    const {
        data: CompanyEmployeeListsData,
        isLoading: CompanyEmployeeListsDataIsLoading,
        isError: CompanyEmployeeListsDataIsError,
        isPending: CompanyEmployeeListsDataisPending,
        refetch: CompanyEmployeeListsDataRefetch,
    } = useQuery({
        queryKey: ['CompanyEmployeeLists', userdata],
        queryFn: () =>
            CompanyEmployeeLists({
                userData: userdata,
                type: '',
                UserId: '',
                platformType: Platform.OS,
            }),
        enabled: !!userdata && !!(ADMIN == 'ceo' || ADMIN == 'hr'),
    });
    return (
        <Modal visible={visible} onRequestClose={onClose} transparent statusBarTranslucent>
            <ScrollView style={{ flex: 1, backgroundColor: '#f0f0f0ff', paddingTop: STATUS_BAR_HEIGHT(), paddingHorizontal: 15 }}>
                <View style={{ flex: 1, }}>
                    <View style={{ flex: 1, }}>
                        <ThemedText size='md' weight='Medium'>
                            Register New Face
                        </ThemedText>
                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                style={{ width: '100%', height: SCREEN_WIDTH, borderRadius: 10, marginVertical: 20 }}
                            />
                        )}
                    </View>

                    <View style={{ gap: 12, flex: 1 }}>
                        {(ADMIN == 'ceo' || ADMIN == 'hr') && (
                            <CustomNativeDropdown
                                mode={true}
                                keyField="id"
                                valueField="name"
                                modeType="reportingManager"
                                enableDefaultOption={true}
                                placeholder={'Select Employee'}
                                value={employeeId?.value}
                                onValueChange={val => {
                                    setEmployeeId(val);
                                    setError(false);
                                }}
                                datas={CompanyEmployeeListsData?.data}
                                error={error}
                            />
                        )}
                        <TouchableOpacity
                            disabled={isUploading}
                            style={[styles.primaryButton]}
                            onPress={() => OnAddFace((ADMIN == 'ceo' || ADMIN == 'hr') ? employeeId : EMPLOYEE_ID)}

                        >
                            {isUploading ? (
                                <ActivityIndicator color={'white'} />
                            ) : (
                                <ThemedText size='sm' weight='Regular' color='inverse'>
                                    Register
                                </ThemedText>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: '#e2e2e2ff' }]}
                            onPress={() => {
                                onClose();
                                setNewFaceName('');
                                setNewEmployeeId('');
                            }}
                            disabled={!newFaceName.trim()}
                        >
                            <ThemedText size='sm' weight='Regular' >
                                Cancel
                            </ThemedText>

                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </Modal>
    )
}

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
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#CA282C',
        paddingVertical: 12,
        borderRadius: 50,
        alignItems: 'center',

    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});

export default BottomSheetRegisterFace

