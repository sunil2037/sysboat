import React, { useRef } from 'react';
import {
    View,
    Text,
    Animated,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import useApi from '../Apis/Services/ApiConfig';
import { useQuery } from '@tanstack/react-query';
import BottomSheetBase from './BottomSheetBase';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { getFontSize } from './Helper';
import ThemedText from './ThemedText';
import EmptyMessage from './EmptyMessage';
import { SCREEN_WIDTH } from '@gorhom/bottom-sheet';

const { height } = Dimensions.get('window');

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

const BottomSheetWorkWeek = ({ visible, onClose, selectedId }) => {
    const translateY = useRef(new Animated.Value(height)).current;
    const { WorkWeekDetailsFetch } = useApi();
    const { userdata } = useEncodedUserData();

    const {
        data: WorkWeekDetailsFetchData,
        refetch,
        isLoading,
        isPending,
    } = useQuery({
        queryKey: ['WorkWeekDetailsFetch', userdata, selectedId],
        queryFn: () => WorkWeekDetailsFetch({ userData: userdata, type: 'WorkWeek', Id: selectedId }),
        enabled: !!userdata && !!selectedId && !!visible,
    });



    return (
        <BottomSheetBase visible={visible} onClose={onClose}>
            {isPending || isLoading ? (
                <ActivityIndicator size={25} color={'black'} />
            ) : (
                <>
                    <View >
                        <ThemedText size='md' weight='Medium'>
                            Rule Name
                        </ThemedText>
                        <ThemedText size='sm' weight='Regular' color='secondary'>
                            {WorkWeekDetailsFetchData?.data?.length > 0 ? WorkWeekDetailsFetchData.data[0]?.rule_name || 'N/A' : 'N/A'}
                        </ThemedText>

                    </View>
                    <View style={{ paddingTop: 15, marginBottom: 8 }}>
                        <ThemedText size='md' weight='Medium'>
                            Description
                        </ThemedText>
                        <ThemedText size='sm' weight='Regular' color='secondary'>
                            {WorkWeekDetailsFetchData?.data?.length > 0 ? WorkWeekDetailsFetchData.data[0]?.description || 'N/A' : 'N/A'}
                        </ThemedText>
                    </View>
                    {WorkWeekDetailsFetchData?.data?.length > 0 ? (
                        <View style={{ width: '100%', paddingTop: 5, }}>
                            <View style={styles.headerRow}>
                                <ThemedText size='xs' weight='Medium' align='center' style={{ width: SCREEN_WIDTH / 8 - 10 }}>
                                    Week
                                </ThemedText>
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                    <ThemedText key={index} size='xs' weight='Medium' align='center' style={{ width: SCREEN_WIDTH / 8 - 10 }}>
                                        {day}
                                    </ThemedText>
                                ))}
                            </View>
                            {WorkWeekDetailsFetchData?.data ? (
                                transformWorkWeekData(WorkWeekDetailsFetchData.data).map((item, index) => (
                                    <View key={index} style={styles.row}>
                                        <ThemedText size='xs' weight='Medium' align='center' color='error' style={{ width: SCREEN_WIDTH / 8 - 10 }}>
                                            {index + 1}
                                        </ThemedText>
                                        {item.days.map((color, i) => (
                                            <View key={i} style={[styles.dot, { backgroundColor: colorMap[color], width: SCREEN_WIDTH / 8 - 10, height: SCREEN_WIDTH / 8 - 10 }]} />
                                        ))}
                                    </View>
                                ))
                            ) : (
                                <ThemedText size='xs' weight='Medium' align='center' color='error'>
                                    No Data Available
                                </ThemedText>
                            )}
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, paddingTop: 20 }}>
                                <View style={[styles.subtitle, { backgroundColor: colorMap.green, color: 'white' }]}>
                                    <ThemedText size='xs' weight='Regular' align='center' color='inverse'>
                                        Working Day
                                    </ThemedText>
                                </View>
                                <View style={[styles.subtitle, { backgroundColor: colorMap.orange, color: 'white' }]}>
                                    <ThemedText size='xs' weight='Regular' align='center'>
                                        Half Day
                                    </ThemedText>
                                </View>
                                <View style={[styles.subtitle, { backgroundColor: colorMap.red, color: 'white' }]}>
                                    <ThemedText size='xs' weight='Regular' align='center' color='inverse'>
                                        Weekly off
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <EmptyMessage />

                    )}
                </>
            )}
        </BottomSheetBase>
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
        paddingTop: 20,
        paddingBottom: 20,
        alignItems: 'center',
    },
    input: {
        height: 50,
        borderWidth: 2,
        borderColor: '#F4F4F4',
        color: '#F1F1F1',
        padding: 10,
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        lineHeight: 18,
        borderRadius: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E2E2',
        alignItems: 'center',
    },
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
        gap: 8
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
        borderRadius: 8,
        flex: 1,
    },
});

export default BottomSheetWorkWeek;
