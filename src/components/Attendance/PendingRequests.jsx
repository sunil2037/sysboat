import {
    ActivityIndicator,
    FlatList,
    ImageBackground,
    RefreshControl,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal,
    TextInput,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNavBar from '../../navigation/TopNavBar';
import backgroundImage from '../../../assets/Icon/background.png';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT, useDebounce } from '../../Helper/Helper';
import useApi from '../../Apis/Services/ApiConfig';
import { useInfiniteQuery } from '@tanstack/react-query';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import EmptyMessage from '../../Helper/EmptyMessage';
import { Filter } from '../Filter';
import { FilterIcon } from '../../Helper/IconsLoad';
import DateRangePick from '../../Helper/DateRangePick';
import Skeleton, { getLayout } from '../../Helper/Skeleton';
import ThemedText from '../../Helper/ThemedText';

const PendingRequests = ({ navigation }) => {
    const { AttendanceRequestCount } = useApi();
    const { userdata } = useEncodedUserData();
    const [refreshing, setRefreshing] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const debounceSearchQuery = useDebounce(searchQuery);


    const [filterVisible, setFilterVisible] = useState(false);

    const [filterDates, setFilterDates] = useState([]);


    const {
        data: AttendanceRequestCountData,
        fetchNextPage: AttendanceRequestCountFetchNextPage,
        hasNextPage: AttendanceRequestCountHasNextPage,
        isFetchingNextPage: AttendanceRequestCountIsFetchingNextPage,
        isLoading: AttendanceRequestCountIsLoading,
        refetch: AttendanceRequestCountRefetch,
        isFetching: AttendanceRequestCountIsFetching,
    } = useInfiniteQuery({
        queryKey: ['AttendanceRequestCount', userdata, filterDates?.startDate, filterDates?.endDate, debounceSearchQuery],
        queryFn: ({ pageParam = 1 }) =>
            AttendanceRequestCount({
                page: pageParam,
                limit: 20,
                search: debounceSearchQuery,
                startDate: filterDates?.startDate,
                endDate: filterDates?.endDate,
                userData: userdata,
            }),
        getNextPageParam: (lastPage) => {
            if (
                lastPage.currentPage * lastPage.limit <
                lastPage.totalRecords
            ) {
                return lastPage.currentPage + 1;
            }
            return undefined;
        },
        refetchInterval: false,
    });

    const loadMore = useCallback(() => {
        if (AttendanceRequestCountHasNextPage && !AttendanceRequestCountIsFetchingNextPage) {
            AttendanceRequestCountFetchNextPage();
        }
    }, [AttendanceRequestCountHasNextPage, AttendanceRequestCountIsFetchingNextPage, AttendanceRequestCountFetchNextPage]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await AttendanceRequestCountRefetch();
        setRefreshing(false);
    }, [AttendanceRequestCountRefetch]);

    const keyExtractor = useCallback((item) => item.id.toString(), []);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AttendanceMain', { employeeId: item?.id, initialScreen: 'pending' })}
            style={styles.card}>
            <ThemedText size='md' weight='Medium' transform='capitalize'>
                {item.name}
            </ThemedText>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <ThemedText size='sm' weight='Regular' transform='capitalize' color='secondary'>
                    {item.userId}
                </ThemedText>
                <ThemedText size='md' weight='Medium' transform='capitalize'>
                    {item.request_count}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );

    const allRequests =
        AttendanceRequestCountData?.pages.flatMap((page) => page?.data || []) || [];


    const filterDate = async value => {
        if (value) {
            setFilterDates(value);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ImageBackground
                source={backgroundImage}
                resizeMode="cover"
                style={[styles.imageBackground, { paddingTop: STATUS_BAR_HEIGHT() }]}>
                <TopNavBar title="Pending Requests" navigation={navigation} />

                <View style={{ marginBottom: 10, paddingHorizontal: 15 }}>
                    <TextInput
                        onChange={e => setSearchQuery(e.nativeEvent.text)}
                        value={searchQuery}
                        placeholderTextColor={'black'}
                        cursorColor={'black'}
                        placeholder="Search..."
                        style={{
                            backgroundColor: 'white',
                            paddingHorizontal: 15,
                            height: 50,
                            borderRadius: 10,
                            fontFamily: 'Poppins-Regular',
                            fontSize: 13,
                            color: 'black',
                        }} />
                </View>

                <Skeleton isLoading={AttendanceRequestCountIsLoading} layout={getLayout({ length: 8, height: 81 })}>
                    <FlatList
                        data={allRequests}
                        contentContainerStyle={{
                            gap: 15,
                            paddingBottom: bottomHeight(),
                            paddingHorizontal: 15,
                            paddingTop: 10,
                        }}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.6}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['black']}
                            />
                        }
                        removeClippedSubviews
                        renderItem={renderItem}
                        ListEmptyComponent={<EmptyMessage />}
                        keyExtractor={keyExtractor}
                        numColumns={1}
                        ListFooterComponent={
                            AttendanceRequestCountIsFetching && (
                                <ActivityIndicator size="small" color="black" style={{ marginVertical: 10 }} />
                            )
                        }
                    />
                </Skeleton>
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        top: STATUS_BAR_HEIGHT(),
                        right: 20,
                        zIndex: 101,
                    }}
                    onPress={() => setFilterVisible(true)}>
                    <FilterIcon width={25} height={25} />
                </TouchableOpacity>


                <Filter filterDate={filterDate} hideFilterLeaveTypeSection={true} modalVisible={filterVisible} onModalClose={() => setFilterVisible(false)} />


            </ImageBackground>
        </SafeAreaView>
    );
};



export default PendingRequests;

const styles = StyleSheet.create({
    imageBackground: {
        flex: 1,
        position: 'relative',
        ...StyleSheet.absoluteFillObject,
    },
    card: {
        flex: 1,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
    },
    name: {
        fontSize: 16,
        color: '#222',
        textTransform: 'capitalize',
        fontFamily: 'Poppins-Medium'
    },
    subText: {
        fontSize: 14,
        color: '#555',
        textTransform: 'capitalize',
        fontFamily: 'Poppins-Regular'
    },
});
