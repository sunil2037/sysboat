import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useApi from '../../Apis/Services/ApiConfig';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import Skeleton, { getLayout } from '../../Helper/Skeleton';
import ThemedText from '../../Helper/ThemedText';

const SalarySlip = () => {
    const { SalarySlip } = useApi();
    const [refreshing, setRefreshing] = useState(false);
    const { userdata } = useEncodedUserData();

    const {
        data,
        isLoading,
        isPending,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['SalarySlip', userdata],
        queryFn: () => SalarySlip({ userData: userdata }),
        enabled: !!userdata,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);


    return (
        <ScrollView
            refreshControl={<RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['black']}
            />}>

            <Skeleton isLoading={isPending || isLoading} layout={getLayout({ length: 1, height: 400 })} >
                <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
                    <View style={styles.row}>
                        <View style={[styles.cell, styles.headerCell]}>
                            <ThemedText size='sm' weight='Bold'>
                                Component
                            </ThemedText>
                        </View>
                        <View style={[styles.cell, styles.headerCell]}>
                            <ThemedText size='sm' weight='Bold'>
                                Monthly
                            </ThemedText>
                        </View>
                        <View style={[styles.cell, styles.headerCell]}>
                            <ThemedText size='sm' weight='Bold'>
                                Yearly
                            </ThemedText>
                        </View>
                    </View>
                    {data?.data.map((item, index) => (
                        <View key={index} style={styles.row}>
                            <View style={styles.cell}>
                                <ThemedText size='sm' style={{ width: '100%' }} weight='Medium'>
                                    {item.component_name}
                                </ThemedText>
                            </View>
                            <View style={styles.cell}>
                                <ThemedText size='sm' style={{ width: '100%' }} weight='Regular' color='secondary'>
                                    {item.Monthly_Amount}
                                </ThemedText>
                            </View>
                            <View style={styles.cell}>
                                <ThemedText size='sm' style={{ width: '100%' }} weight='Regular' color='secondary'>
                                    {item.Yearly_Amount}
                                </ThemedText>
                            </View>
                        </View>
                    ))}
                </View>
            </Skeleton>
        </ScrollView>
    );
};

export default SalarySlip;

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
});
