import { ActivityIndicator, Dimensions, ImageBackground, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import base64 from 'base-64';
import backgroundImage from '../../../../assets/Icon/background.png';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useApi from '../../../Apis/Services/ApiConfig';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopNavBar from '../../../navigation/TopNavBar';
import useEncodedUserData from '../../../hooks/useEncodedUserData';
import { getFontSize } from '../../../Helper/Helper';
import Skeleton, { getLayout } from '../../../Helper/Skeleton';
const colorMap = {
    green: '#5CB338',
    orange: '#FFC145',
    red: '#CA282C',
};
const transformWorkWeekData = (data) => {
    const statusMap = { 1: 'green', 2: 'orange', 3: 'red' };

    let transformedData = [];

    data.forEach((item) => {
        for (let i = 1; i <= 5; i++) {
            if (item[`mon${i}`] !== undefined) {
                transformedData.push({
                    week: `${item.id}-W${i}`,
                    days: [
                        statusMap[item[`mon${i}`]],
                        statusMap[item[`tue${i}`]],
                        statusMap[item[`wed${i}`]],
                        statusMap[item[`thu${i}`]],
                        statusMap[item[`fri${i}`]],
                        statusMap[item[`sat${i}`]],
                        statusMap[item[`sun${i}`]],
                    ],
                });
            }
        }
    });

    return transformedData;
};
const WorkWeekViewUserSide = ({ navigation }) => {
    const { userdata } = useEncodedUserData();
    const { WorkWeekDetailsFetch } = useApi();
    const [refreshing, setRefreshing] = useState(false);

    const {
        data: WorkWeekDetailsFetchData,
        refetch,
        isLoading,
        isPending,
    } = useQuery({
        queryKey: ['WorkWeekDetailsFetch', userdata],
        queryFn: () => WorkWeekDetailsFetch({ userData: userdata, type: 'WorkWeek', Id: '' }),
        enabled: !!userdata,
    });


    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <ImageBackground source={backgroundImage} resizeMode="cover" style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
                    <ScrollView refreshControl={<RefreshControl refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['black']} />}>
                        <View style={{
                            flex: 1, paddingTop: 40,

                        }}>
                            <TopNavBar title={'Work Week'} navigation={navigation} />
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 20, borderRadius: 10, marginTop: 10 }}>
                                    <Skeleton isLoading={isPending || isLoading} layout={getLayout({ length: 1, height: 300 })}>
                                        <>
                                            <View style={{}}>
                                                <Text style={{ fontFamily: 'Poppins-Medium', color: '#293646' }}>Rule Name</Text>
                                                <Text style={{ fontFamily: 'Poppins-Medium', color: '#6A7D94' }}>
                                                    {WorkWeekDetailsFetchData?.data?.length > 0 ? WorkWeekDetailsFetchData.data[0]?.rule_name || 'N/A' : 'N/A'}
                                                </Text>

                                            </View>
                                            <View style={{ paddingTop: 15, paddingBottom: 20 }}>
                                                <Text style={{ fontFamily: 'Poppins-Medium', color: '#293646' }}>Description</Text>
                                                <Text style={{ fontFamily: 'Poppins-Medium', color: '#6A7D94' }}>
                                                    {WorkWeekDetailsFetchData?.data?.length > 0 ? WorkWeekDetailsFetchData.data[0]?.description || 'N/A' : 'N/A'}
                                                </Text>
                                            </View>
                                            <View style={styles.headerRow}>
                                                <Text style={styles.headerText}>Week</Text>
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                                    <Text key={index} style={styles.headerText}>{day}</Text>
                                                ))}
                                            </View>
                                            {WorkWeekDetailsFetchData?.data?.length > 0 ? (
                                                <View style={{ width: '100%', paddingTop: 5 }}>
                                                    {WorkWeekDetailsFetchData?.data ? (
                                                        transformWorkWeekData(WorkWeekDetailsFetchData.data).map((item, index) => (
                                                            <View key={index} style={styles.row}>
                                                                <Text style={[styles.weekText]}>{index + 1}</Text>
                                                                {item.days.map((color, i) => (
                                                                    <View key={i} style={[styles.dot, { backgroundColor: colorMap[color] }]} />
                                                                ))}
                                                            </View>
                                                        ))
                                                    ) : (
                                                        <Text style={{ textAlign: 'center', padding: 10, color: 'red' }}>No Data Available</Text>
                                                    )}
                                                </View>
                                            ) : (
                                                <Text>N/A</Text>

                                            )}
                                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, paddingTop: 20 }}>
                                                <Text style={[styles.subtitle, { backgroundColor: colorMap.green, color: 'white' }]}>Working Day</Text>
                                                <Text style={[styles.subtitle, { backgroundColor: colorMap.orange, color: 'black' }]}>Half Day</Text>
                                                <Text style={[styles.subtitle, { backgroundColor: colorMap.red, color: 'white' }]}>Weekly off</Text>
                                            </View>
                                        </>
                                    </Skeleton>
                                </View>
                            </View>

                        </View>
                    </ScrollView>
                </ImageBackground>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default WorkWeekViewUserSide;

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E2E2',
        alignItems: 'center',
    },
    subtitle: { fontSize: 10, fontFamily: 'Poppins-Medium', paddingVertical: 5, paddingHorizontal: 13, borderRadius: 20, lineHeight: 15 },
    headerText: {
        fontSize: 12,
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        justifyContent: 'space-between',
    },
    weekText: {
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
        color: '#CA282C',
        flex: 1,
        paddingHorizontal: 7,
        textAlign: 'center',
        lineHeight: 15,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
    },
});
