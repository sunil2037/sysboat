import { FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useState } from 'react'
import EmptyMessage from '../../Helper/EmptyMessage';
import { AttendanceIcon } from '../../Helper/IconsLoad';
import { bottomHeight, getFontSize } from '../../Helper/Helper';
import useApi from '../../Apis/Services/ApiConfig';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL2 } from '../../Apis/Services/ServerURL';
import useNotificationStore from '../../Context/useNotificationStore';

const Grid = ({ data, handleViewData }) => (
    <FlatList
        data={data}
        ListEmptyComponent={
            <View style={{}}>
                <EmptyMessage />
            </View>
        }
        contentContainerStyle={{ paddingBottom: bottomHeight() }}
        renderItem={({ item }) => (
            <TouchableOpacity
                onPress={() => handleViewData('announcement', item)}
                style={styles.itemContainer}>
                <Image style={{ width: 50, height: 50, borderRadius: 100 }} source={{ uri: API_BASE_URL2 + item?.profile_image }} />
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                        <Text style={styles.item}>
                            {item.title.length > 20
                                ? item.title.slice(0, 20) + '...'
                                : item.title}
                        </Text>
                        <View
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Text
                                style={{
                                    fontFamily: 'Poppins-Regular',
                                    fontSize: 12,
                                    alignItems: 'center',
                                }}>
                                {new Date(item.created_at).toLocaleDateString()}{' '}
                            </Text>

                        </View>
                    </View>
                    <Text
                        style={[
                            styles.item,
                            { fontFamily: 'Poppins-Regular', fontSize: 12 },
                        ]}>
                        Created by {item?.first_name + ' ' + item?.last_name}
                    </Text>
                </View>
            </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
    />
);

const Announcement = () => {
    const { userdata } = useEncodedUserData();
    const { AnnouncementGet } = useApi();
    const { setMode, setViewData } = useNotificationStore();

    const { data, isLoading, isPending, isError, refetch, isRefetching } = useQuery({
        queryKey: ['AnnouncementGet', userdata],
        queryFn: () => AnnouncementGet({ userData: userdata, notification_type: "message" }),
        enabled: !!userdata,
    });

    const handleViewData = (type, data) => {
        setViewData(type, data);
    }

    const onRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);


    return (
        <ScrollView refreshControl={
            <RefreshControl
                refreshing={isRefetching}
                onRefresh={onRefresh}
                colors={['black']}
            />
        }>
            <Grid data={data?.data} handleViewData={handleViewData} />
        </ScrollView>
    )
}

export default Announcement

const styles = StyleSheet.create({
    itemContainer: {
        backgroundColor: 'white',
        padding: 10,
        paddingVertical: 15,
        borderRadius: 10,
        flexDirection: 'row',
        marginVertical: 5,
    },
    item: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#293646',
        textTransform: 'capitalize'
    },

    date: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#293646',
        marginTop: 5,
    },
    time: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#293646',
        marginTop: 5,
    },
});