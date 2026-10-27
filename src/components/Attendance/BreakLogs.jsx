import {
    ImageBackground,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    Linking,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    FlatList,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import backgroundImage from '../../../assets/Icon/background.png';
import TopNavBar from '../../navigation/TopNavBar';
import { useQuery } from '@tanstack/react-query';
import useApi from '../../Apis/Services/ApiConfig';
import { CalendarIcon, DurationIcon, LocationIcon, StartTimeIcon, StopTimeIcon } from '../../Helper/IconsLoad';
import EmptyMessage from '../../Helper/EmptyMessage';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import { getFontSize, STATUS_BAR_HEIGHT } from '../../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Skeleton, { getLayout } from '../../Helper/Skeleton';

const SCREEN_WIDTH = Dimensions.get('window').width;

const BreakLogs = ({ navigation, route }) => {
    const attendance_id = route.params;
    const { fetchBreak } = useApi();
    const { userdata } = useEncodedUserData();
    const [refreshing, setRefreshing] = useState(false);

    const { data, isLoading, isPending, isError, refetch } = useQuery({
        queryKey: ['fetchBreak', userdata, attendance_id],
        queryFn: () =>
            fetchBreak({
                attendance_id: attendance_id.id,
                userData: userdata,
            }),
        enabled: !!userdata,
    });

    const BreakLogData = useMemo(() => data?.data || [], [data]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const openInGoogleMaps = (inLat, inLng, outLat, outLng) => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${inLat},${inLng}&destination=${outLat},${outLng}&travelmode=driving`;
        Linking.openURL(url).catch(err => console.warn("Couldn't load page", err));
    };

    const renderCard = ({ item, index }) => (
        <View style={[styles.card, { marginVertical: index >= 0 && 5 }]}>
            <Text style={styles.title}>Break #{item.srno}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <StartTimeIcon width={20} height={20} color={'#293646'} />
                <Text style={styles.text}>Start Time - <Text style={{ fontFamily: 'Poppins-Regular', color: '#6A7D94' }}>{item.start_time}</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <StopTimeIcon width={20} height={20} color={'#293646'} />
                <Text style={styles.text}>End Time - <Text style={{ fontFamily: 'Poppins-Regular', color: '#6A7D94' }}>{item.end_time}</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <DurationIcon width={20} height={20} color={'#293646'} />
                <Text style={styles.text}>Duration - <Text style={{ fontFamily: 'Poppins-Regular', color: '#6A7D94' }}>{item.duration || '00:00'}</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <CalendarIcon width={20} height={20} color={'#293646'} />
                <Text style={styles.text}>Date - <Text style={{ fontFamily: 'Poppins-Regular', color: '#6A7D94' }}>{new Date(item.created).toLocaleString()}</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity style={{
                    height: 40,
                    flex: 1,
                    borderRadius: 5,
                    backgroundColor: '#EAECF0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    marginTop: 10,
                    gap: 5,

                }} onPress={() => { openInGoogleMaps(item.in_latitude, item.in_longitude, item.out_latitude, item.out_longitude); }}>
                    <LocationIcon width={20} color={'#293646'} height={20} />
                    <Text style={{
                        fontSize: 14,
                        fontFamily: 'Poppins-Medium',
                        lineHeight: 20,
                    }}>View Location</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ImageBackground source={backgroundImage} resizeMode="cover" style={[styles.bgImage, { paddingTop: STATUS_BAR_HEIGHT() }]}>
                <TopNavBar title={'Break Logs'} navigation={navigation} />
                <View style={styles.container}>
                    <Skeleton isLoading={isLoading || isPending} layout={getLayout({ length: 6, height: 100 })}>
                        <FlatList
                            data={BreakLogData}
                            keyExtractor={(item) => item.break_id.toString()}
                            renderItem={renderCard}
                            contentContainerStyle={{ paddingBottom: 15 }}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={['black']}
                                />
                            }
                            ListEmptyComponent={() => (
                                <EmptyMessage />
                            )}
                            removeClippedSubviews={false}
                        />
                    </Skeleton>

                </View>
            </ImageBackground>
        </SafeAreaView>
    );
};

export default BreakLogs;

const styles = StyleSheet.create({
    bgImage: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 15,
        padding: 16,
        gap: 5,
    },
    title: {
        fontSize: 18,
        marginBottom: 2,
        color: '#293646',
        fontFamily: 'Poppins-Medium',
    },
    text: {
        fontSize: 13,
        color: '#293646',
        fontFamily: 'Poppins-Medium',
        lineHeight: 20,
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
});
