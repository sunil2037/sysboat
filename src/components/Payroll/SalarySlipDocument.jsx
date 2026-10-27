import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    ScrollView,
    Text,
    TouchableOpacity,
    Modal,
    RefreshControl,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import CustomNativeDropdown from '../../Helper/CustomNativeDropdown';
import { API_BASE_URL } from '../../Apis/Services/ServerURL';
import { useQuery } from '@tanstack/react-query';
import useApi from '../../Apis/Services/ApiConfig';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import { isEmptyArray } from 'formik';
import EmptyMessage from '../../Helper/EmptyMessage';
import { bottomHeight, getFontSize, SCREEN_WIDTH, STATUS_BAR_HEIGHT } from '../../Helper/Helper';
import ReactNativeZoomableView from '@openspacelabs/react-native-zoomable-view/src/ReactNativeZoomableView';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { toast } from '../../Helper/ToastManager';
import { useAuth } from '../../Context/AuthContext';
import Skeleton, { getLayout } from '../../Helper/Skeleton';

const MONTH_NAMES = [
    { name: 'January', id: '1' },
    { name: 'February', id: '2' },
    { name: 'March', id: '3' },
    { name: 'April', id: '4' },
    { name: 'May', id: '5' },
    { name: 'June', id: '6' },
    { name: 'July', id: '7' },
    { name: 'August', id: '8' },
    { name: 'September', id: '9' },
    { name: 'October', id: '10' },
    { name: 'November', id: '11' },
    { name: 'December', id: '12' },
];

const SalarySlipDocument = () => {
    const { EmployeeSalaryDoc, CompanyEmployeeLists } = useApi();
    const { userAuthData, userType } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [YEARS, SETYEARS] = useState([]);
    const { userdata } = useEncodedUserData();
    const [refreshing, setRefreshing] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState({})
    const zoomableViewRef = useRef(null);

    const latest_years = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const {
        data,
        isLoading,
        isRefetching,
        isPending,
        refetch,
        isError,
    } = useQuery({
        enabled: !!selectedMonth && !!selectedYear,
        queryKey: [
            'EmployeeSalaryDoc',
            userdata,
            selectedMonth,
            selectedYear,
            selectedEmployee?.key
        ],
        queryFn: async () => {
            const response = await EmployeeSalaryDoc({
                month: selectedMonth,
                year: selectedYear,
                employeeId: selectedEmployee?.key || userAuthData?.id,
                userData: userdata,
            });

            if (response instanceof Blob) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(response);
                });
            }

            if (typeof response === 'string') {
                return response;
            }

            if (response instanceof ArrayBuffer) {
                const blob = new Blob([response], { type: 'image/jpeg' });
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            return response;
        },
        enabled: !!userAuthData?.id || !!selectedEmployee?.key
    });

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
        enabled: !!userdata,
    });

    useEffect(() => {
        if (data) {
            if (data.startsWith('data:image')) {
                setImageUri(data);
            }
            else if (data.startsWith('http')) {
                setImageUri(data);
            }
            else {
                setImageUri(`${data}`);
            }
        }

        console.log("ImagteUri", imageUri)
    }, [data]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    useEffect(() => {
        const loadYears = () => {
            const yearsArray = [];
            for (let i = 2025; i <= latest_years; i++) {
                if (i < 2040) {
                    yearsArray.push({ id: i, name: i?.toString() });
                }
            }
            SETYEARS(yearsArray);

            setSelectedYear(latest_years);
        };

        loadYears();

        const currentMonthObj = MONTH_NAMES.find(m => parseInt(m.id) === currentMonth);
        setSelectedMonth(currentMonthObj?.id);
    }, [latest_years]);

    // Request storage permission for Android
    const requestStoragePermission = async () => {
        if (Platform.OS === 'android') {
            try {
                if (Platform.Version >= 33) {
                    // Android 13+ doesn't require storage permission for downloads
                    return true;
                }
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission',
                        message: 'App needs access to your storage to download salary slip',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const downloadSalarySlip = async () => {
        console.log("image uri", imageUri);
        if (!imageUri) {
            Alert.alert('Error', 'No salary slip to download');
            return;
        }

        setIsDownloading(true);

        try {
            const hasPermission = await requestStoragePermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Storage permission is required to download files');
                setIsDownloading(false);
                return;
            }

            const monthName = MONTH_NAMES.find(m => m.id === selectedMonth)?.name || selectedMonth;
            const fileName = `SalarySlip_${monthName}_${selectedYear}.jpg`;

            let filePath;
            let base64Data = imageUri;

            // Handle different URI formats
            if (imageUri.includes('base64,')) {
                // Extract base64 data regardless of the mime type (data:image or data:application/octet-stream)
                base64Data = imageUri.split('base64,')[1];
                console.log("Extracted base64 data length:", base64Data?.length);
            } else if (imageUri.startsWith('http')) {
                // Download from URL first
                const downloadResult = await RNFS.downloadFile({
                    fromUrl: imageUri,
                    toFile: `${RNFS.DocumentDirectoryPath}/${fileName}`,
                }).promise;

                if (downloadResult.statusCode === 200) {
                    filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
                } else {
                    throw new Error('Failed to download image');
                }
            } else {
                // Direct file path or URL without protocol
                base64Data = imageUri;
            }

            // If base64, write to file
            if (!filePath && base64Data) {
                filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
                console.log("Writing to file path:", filePath);

                try {
                    await RNFS.writeFile(filePath, base64Data, 'base64');
                    console.log("File written successfully");

                    // Verify file was created
                    const fileExists = await RNFS.exists(filePath);
                    console.log("File exists:", fileExists);

                    if (!fileExists) {
                        throw new Error('File was not created');
                    }
                } catch (writeError) {
                    console.error('Write error:', writeError);
                    throw new Error(`Failed to write file: ${writeError.message}`);
                }
            }

            // For Android, copy to Downloads folder
            if (Platform.OS === 'android') {
                const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
                console.log("Copying to:", destPath);

                try {
                    await RNFS.copyFile(filePath, destPath);
                    console.log("File copied to Downloads");
                    filePath = destPath;
                } catch (copyError) {
                    console.error('Copy error:', copyError);
                    // If copy fails, keep the original path
                    console.log("Using original path:", filePath);
                }
            }

            setIsDownloading(false);
            toast.success(`Salary slip downloaded successfully!\nSaved to: ${Platform.OS === 'android' ? 'Downloads folder' : 'Documents folder'}`)
            // Alert.alert(
            //     'Success',
            //     `Salary slip downloaded successfully!\nSaved to: ${Platform.OS === 'android' ? 'Downloads folder' : 'Documents folder'}`,
            //     [
            //         {
            //             text: 'OK',
            //             style: 'default',
            //         },
            //         {
            //             text: 'Share',
            //             onPress: () => shareSalarySlip(filePath),
            //         },
            //     ]
            // );

        } catch (error) {
            console.error('Download error:', error);
            setIsDownloading(false);
            toast.error(`Failed to download salary slip.\nError: ${error.message || 'Unknown error'}\n\nPlease try again.`)
            // Alert.alert(
            //     'Download Failed',
            //     `Failed to download salary slip.\nError: ${error.message || 'Unknown error'}\n\nPlease try again.`
            // );
        }
    };

    const shareSalarySlip = async (filePath) => {
        try {
            console.log("Sharing file from:", filePath);

            const fileExists = await RNFS.exists(filePath);
            if (!fileExists) {
                Alert.alert('Error', 'File not found. Please download again.');
                return;
            }

            const shareOptions = {
                title: 'Share Salary Slip',
                url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
                type: 'image/jpeg',
            };

            await Share.open(shareOptions);
        } catch (error) {
            console.error('Share error:', error);
            if (error.message !== 'User did not share') {
                Alert.alert('Share Failed', 'Failed to share salary slip.');
            }
        }
    };

    return (
        <ScrollView
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['black']}
                />
            }
            contentContainerStyle={{ paddingBottom: bottomHeight() }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                    <CustomNativeDropdown
                        mode={true}
                        keyField="id"
                        valueField="name"
                        modeType={'reportingManager'}
                        enableDefaultOption={true}
                        placeholder={'Select Month'}
                        value={selectedMonth}
                        onValueChange={val => { setSelectedMonth(val?.key) }}
                        datas={MONTH_NAMES}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <CustomNativeDropdown
                        mode={true}
                        keyField="id"
                        valueField="name"
                        modeType={'reportingManager'}
                        enableDefaultOption={true}
                        placeholder={'Select Year'}
                        value={selectedYear}
                        onValueChange={val => { setSelectedYear(val?.key) }}
                        datas={YEARS}
                    />
                </View>
            </View>
            {userType != 'employee' && (
                <View style={{ flex: 1, marginTop: 15 }}>
                    <CustomNativeDropdown
                        mode={true}
                        keyField="id"
                        valueField="name"
                        modeType={'reportingManager'}
                        enableDefaultOption={true}
                        placeholder={'Select Employee'}
                        value={selectedEmployee}
                        onValueChange={val => {
                            setSelectedEmployee(val);
                        }}
                        datas={CompanyEmployeeListsData?.data}
                    />
                </View>
            )}

            {imageUri && !isLoading && (
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={downloadSalarySlip}
                    disabled={isDownloading}
                >
                    {isDownloading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.downloadButtonText}>
                            Download Salary Slip
                        </Text>
                    )}
                </TouchableOpacity>
            )}

            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    marginTop: 20,
                }}
            >
                <Skeleton isLoading={isPending || isLoading} layout={getLayout({ length: 1, height: 400 })} >
                    {!imageUri ? (
                        <View>
                            <EmptyMessage />
                        </View>
                    ) : (
                        <View style={styles.imageContainer}>
                            <ReactNativeZoomableView
                                ref={zoomableViewRef}
                                maxZoom={3}
                                minZoom={1}
                                zoomStep={0.5}
                                initialZoom={1}
                                bindToBorders={true}
                                style={styles.zoomableView}
                            >
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.salarySlipImage}
                                    resizeMode="contain"
                                />
                            </ReactNativeZoomableView>

                            {/* Zoom Instructions */}
                            <View style={styles.zoomInstructions}>
                                <Text style={styles.instructionText}>
                                    Pinch to zoom • Double tap to reset
                                </Text>
                            </View>
                        </View>
                    )}
                </Skeleton>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignSelf: 'stretch',
    },
    cell: {
        flex: 1,
        alignSelf: 'stretch',
        borderWidth: 1,
        borderColor: '#E2E2E2',
        padding: 10,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCell: {
        backgroundColor: 'transparent',
    },
    headerText: {
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        color: '#293646',
    },
    imageContainer: {
        width: SCREEN_WIDTH - 30,
        minHeight: 400,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    zoomableView: {
        width: '100%',
        height: 600,
    },
    salarySlipImage: {
        width: '100%',
        height: 600,
    },
    downloadButton: {
        backgroundColor: '#CA282C',
        padding: 15,
        borderRadius: 10,
        marginTop: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    downloadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
    },
    zoomInstructions: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    instructionText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
});

export default SalarySlipDocument;