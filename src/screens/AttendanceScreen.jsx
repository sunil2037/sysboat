import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Dimensions,
  Text,
  ImageBackground,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
} from 'react-native';
import backgroundImage from '../../assets/Icon/background.png';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import useApi from '../Apis/Services/ApiConfig';
import { DateTimePickerComponent } from '../Helper/DateTimePicker';
import TopNavBar from '../navigation/TopNavBar';
import EmptyMessage from '../Helper/EmptyMessage';
import { useAuth } from '../Context/AuthContext';
import LinearGradient from 'react-native-linear-gradient';
import useEncodedUserData from '../hooks/useEncodedUserData';

import { API_BASE_URL, API_BASE_URL2 } from '../Apis/Services/ServerURL';
import FilterStickyBox from '../Helper/FilterStickyBox';
import { FilterIcon } from '../Helper/IconsLoad';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAttendanceStore from '../Context/useAttendanceStore';
import Skeleton, { getLayout } from '../Helper/Skeleton';
import ThemedText from '../Helper/ThemedText';
const CurrentTime = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AttendanceScreen = ({ navigation }) => {
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const { userType } = useAuth();
  const { AttendanceDirectory, EmployeeUnderRmData, AttendanceRequestCount } = useApi();
  const [refreshing, setRefreshing] = useState(false);
  const [filterData, setFilterData] = useState(CurrentTime(new Date()));
  const [openDate, setOpenDate] = useState(false);
  const { userdata } = useEncodedUserData();
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [status, setStatus] = useState('active');
  const setIndex = useAttendanceStore((s) => s.setAttendanceTabIndex);

  const [filterValues, setFilterValues] = useState({
    type: 'active',
    reportingManager: null,
    search: '',
  });

  const handleApply = useCallback(filters => {
    setFilterValues(filters);
  }, []);


  const {
    data: AttendanceDirectoryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isFetching,
    isPending,
  } = useInfiniteQuery({
    queryKey: ['AttendanceDirectory', userdata, filterData, filterValues],
    queryFn: ({ pageParam = 1 }) =>
      AttendanceDirectory({
        page: pageParam,
        limit: 20,
        date: filterData,
        filter: filterValues.type,
        search: filterValues.search,
        reportingManager: filterValues?.reportingManager?.key,
        userData: userdata,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce(
        (sum, page) => sum + (page?.Attendanceemployees?.length || 0),
        0,
      );

      if (totalFetched < lastPage.total) {
        return lastPage.page + 1;
      }

      return undefined;
    },

    enabled: !!userdata,
    refetchInterval: false,
  });



  const getDateRange = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(lastMonth),
      endDate: formatDate(today),
    };
  };

  const { startDate, endDate } = getDateRange();

  const {
    data: AttendanceRequestCountData,
    fetchNextPage: AttendanceRequestCountFetchNextPage,
    hasNextPage: AttendanceRequestCountHasNextPage,
    isFetchingNextPage: AttendanceRequestCountIsFetchingNextPage,
    isLoading: AttendanceRequestCountIsLoading,
    refetch: AttendanceRequestCountRefetch,
    isFetching: AttendanceRequestCountIsFetching,
    isPending: AttendanceRequestCountIsPending,
  } = useInfiniteQuery({
    queryKey: ['AttendanceRequestCount', userdata],
    queryFn: ({ pageParam = 1 }) =>
      AttendanceRequestCount({
        page: pageParam,
        limit: 1,
        search: "",
        startDate: startDate,
        endDate: endDate,
        userData: userdata,
      }),

    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce(
        (sum, page) => sum + (page?.Attendanceemployees?.length || 0),
        0,
      );

      if (totalFetched < lastPage.total) {
        return lastPage.page + 1;
      }

      return undefined;
    },
    refetchInterval: false,
  });


  console.log("AttendanceRequestCountData", AttendanceRequestCountData)



  const {
    data: EmployeeUnderRmDatas,
    isLoading: EmployeeUnderRmDatasLoading,
    isPending: EmployeeUnderRmDatasPending,
    isError: EmployeeUnderRmDatasError,
    refetch: EmployeeUnderRmDatasRefetch,
  } = useQuery({
    queryKey: ['EmployeeUnderRmData', userdata],
    queryFn: () => EmployeeUnderRmData({ userData: userdata }),
    enabled: !!userdata && userType == 'employee',
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
  });

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userType === 'employee') {
      await EmployeeUnderRmDatasRefetch();
    } else {
      await refetch();
    }
    setRefreshing(false);
  }, [refetch, EmployeeUnderRmDatasRefetch, userType]);

  const SummarySection = ({ summary, pendingRequests, loading, navigation, usertype }) => {
    const HIDE_CARD = usertype == 'employee' ? true : false;

    const VALUE = HIDE_CARD ? 40 : 60;
    const CARD_WIDTH = SCREEN_WIDTH - VALUE;
    const SPACING = 15;
    const summaryCards = [
      {
        id: '1',
        title: 'Pending Requests',
        value: pendingRequests,
        hide: false,
        onPress: () => {
          setIndex(1);
          navigation.navigate('PendingRequests')
        }
      },

      {
        id: '2',
        title: 'Attendance Count',
        value: summary?.attendanceCount,
        hide: HIDE_CARD,
        onPress: () =>
          navigation.navigate('AttendanceOverview', {
            showType: 'present',
            date: filterData,
          }),
      },
      {
        id: '3',
        title: 'Leave Count',
        value: summary?.leaveCount,
        hide: HIDE_CARD,
        onPress: () => navigation.navigate('LeaveScreen'),
      },
      {
        id: '4',
        title: 'Absentees',
        value: summary?.absentees,
        hide: HIDE_CARD,
        onPress: () =>
          navigation.navigate('AttendanceOverview', {
            showType: 'absent',
            date: filterData,
          }),
      },
      {
        id: '5',
        title: 'Total Employees',
        value: summary?.totalEmployees,
        hide: HIDE_CARD,
        onPress: null,
      },

    ];

    return (
      <View style={styles.summaryContainer}>
        <FlatList
          data={summaryCards}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + SPACING}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: 10,
          }}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                disabled={!item.onPress}
                onPress={item.onPress}
                style={{
                  width: CARD_WIDTH,
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  padding: 20,
                  marginHorizontal: SPACING / 2,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  display: 'none' ? (item.hide ? 'none' : 'flex') : 'flex',
                  flexDirection: 'row'
                }}
              >
                <ThemedText size='md' weight='Medium'>
                  {item.title}
                </ThemedText>
                {loading ? (
                  <ActivityIndicator size={30} color={'black'} />
                ) : (
                  <ThemedText size='2xl' weight='SemiBold'>
                    {item.value}
                  </ThemedText>
                )}

              </TouchableOpacity>
            )
          }
          }
        />
      </View>
    );
  };


  const formatDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={[styles.imageBackground, { paddingTop: STATUS_BAR_HEIGHT() }]}>
        <FilterStickyBox
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          onApply={handleApply}
          onSearch={setSearchValue}
          onStatusChange={setStatus}
          status={status}
          searchValue={searchValue}
        />
        <TopNavBar title="Attendance" navigation={navigation} />
        {userType !== 'employee' && (
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
        )}

        <View style={{ flex: 1 }}>
          {
            AttendanceDirectoryData &&
            AttendanceDirectoryData.pages[0]?.status && (
              <>
                <View style={{}}>
                  <>
                    <SummarySection
                      loading={isLoading || isPending || AttendanceRequestCountIsPending || AttendanceRequestCountIsLoading}
                      summary={AttendanceDirectoryData.pages[0]?.summary}
                      navigation={navigation}
                      pendingRequests={AttendanceRequestCountData?.pages?.[0]?.totalReq}
                      usertype={userType}
                    />
                    {userType !== 'employee' && (
                      <View style={{ paddingHorizontal: 15 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setOpenDate(true);
                          }}
                          style={{
                            height: 50,
                            backgroundColor: '#CA282C',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 10,
                            marginBottom: 20,
                          }}>
                          <ThemedText size='md' weight='Medium' color='inverse'>
                            {filterData || 'Select Date'}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    )}

                  </>

                  <DateTimePickerComponent
                    visible={openDate}
                    setVisible={setOpenDate}
                    value={new Date(filterData)}
                    onChange={async date => {
                      const formattedDate = formatDate(date);
                      console.warn('formated', formattedDate);
                      setFilterData(formattedDate);
                    }}
                  />
                </View>
              </>
            )}

          {userType == 'employee' ? (
            <Grid2
              setIndex={() => setIndex(0)}
              refreshing={refreshing}
              onRefresh={onRefresh}
              loadMore={loadMore}
              fetching={isFetchingNextPage || isFetching}
              loading={
                EmployeeUnderRmDatasPending || EmployeeUnderRmDatasLoading
              }
              navigation={navigation}
              data={EmployeeUnderRmDatas}
            />
          ) : (
            <Grid
              refreshing={refreshing}
              setIndex={() => setIndex(0)}
              onRefresh={onRefresh}
              loadMore={loadMore}
              loading={isLoading || isPending}
              fetching={isFetchingNextPage || isFetching}
              navigation={navigation}
              data={AttendanceDirectoryData}
            />
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const Grid = React.memo(
  ({ data, navigation, loading, onRefresh, refreshing, loadMore, fetching, setIndex }) => {
    const SCREEN_WIDTH = Dimensions.get('window').width;
    const AttendanceItem = React.memo(({ item, navigation }) => (
      <TouchableOpacity
        onPress={() => {
          setIndex();
          navigation.navigate('AttendanceMain', { employeeId: item?.employee_id })
        }
        }
        style={{
          flex: 1,
          backgroundColor: 'white',
          justifyContent: 'center',
          borderRadius: 20,
          paddingVertical: 30,
          alignItems: 'center',

        }}>
        <LinearGradient
          colors={['rgba(237, 33, 58, 1)', 'rgba(147, 41, 30, 1)']}
          style={{
            borderRadius: 20,
            position: 'absolute',
            width: '100%',
            top: 0,
          }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          locations={[0.2, 1]}>
          <View style={{ width: 100, height: 80 }} />
        </LinearGradient>
        <Image
          defaultSource={{
            uri: 'https://img.freepik.com/free-vector/isolated-young-handsome-man-different-poses-white-background-illustration_632498-859.jpg?t=st=1741779036~exp=1741782636~hmac=180c02db2ec9c3f432f1f8b5fa23c157ab65f7148a8fe76fb08a61b606ee36dc&w=900',
          }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 7,
            borderColor: 'white',
          }}
          source={{
            uri: item?.profile_image
              ? API_BASE_URL2 + item?.profile_image
              : 'https://img.freepik.com/free-vector/isolated-young-handsome-man-different-poses-white-background-illustration_632498-859.jpg?t=st=1741779036~exp=1741782636~hmac=180c02db2ec9c3f432f1f8b5fa23c157ab65f7148a8fe76fb08a61b606ee36dc&w=900',

          }}
          resizeMode={'cover'}
        />
        <View style={{ paddingHorizontal: 8, gap: 2 }}>
          <ThemedText size='sm' weight='Medium' align='center' transform='capitalize' >
            {(item?.first_name || '')}
          </ThemedText>
          <ThemedText size='xs' weight='Regular' align='center' transform='capitalize' color='secondary'>
            {item?.status == 'P'
              ? 'Present'
              : item?.status == 'A'
                ? 'Absent'
                : item?.status == 'WO'
                  ? 'Work Off'
                  : item?.status == 'L'
                    ? 'Leave'
                    : item?.status == 'HF'
                      ? 'Half Day'
                      : item?.status == 'H'
                        ? 'Holiday'
                        : ''}
          </ThemedText>
        </View>
      </TouchableOpacity>
    ));

    const allAttendanceEmployees = useMemo(() => {
      return data?.pages.flatMap(page => page.Attendanceemployees) || [];
    }, [data?.pages]);

    const renderItem = useCallback(
      ({ item }) => <AttendanceItem item={item} navigation={navigation} />,
      [navigation],
    );
    const keyExtractor = useCallback(item => item.id, []);
    useEffect(() => {
    }, [keyExtractor, allAttendanceEmployees]);

    return (
      <Skeleton layout={getLayout({ length: 4, width: SCREEN_WIDTH / 2 - 20, height: SCREEN_WIDTH / 2 })} type='Square' isLoading={loading}>
        <FlatList
          data={allAttendanceEmployees}
          contentContainerStyle={{
            gap: 10,
            paddingBottom: bottomHeight(),
            paddingHorizontal: 15,
          }}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: 10 }}
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
          numColumns={2}
          ListFooterComponent={
            fetching && <ActivityIndicator size="large" color="black" />
          }
        />
      </Skeleton>
    );
  },
);

const Grid2 = React.memo(
  ({ data, navigation, loading, onRefresh, refreshing, loadMore, fetching, setIndex }) => {
    const SCREEN_WIDTH = Dimensions.get('window').width;
    const EmployeeItem = React.memo(({ item, navigation }) => (
      <TouchableOpacity
        onPress={() => {
          setIndex();
          navigation.navigate('AttendanceMain', { employeeId: item?.id })
        }
        }
        style={{
          flex: 1,
          backgroundColor: 'white',
          justifyContent: 'center',
          borderRadius: 20,
          paddingVertical: 30,
          alignItems: 'center',
        }}>
        <LinearGradient
          colors={['rgba(237, 33, 58, 1)', 'rgba(147, 41, 30, 1)']}
          style={{
            borderRadius: 20,
            position: 'absolute',
            width: '100%',
            top: 0,
          }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          locations={[0.2, 1]}>
          <View style={{ width: 100, height: 80 }} />
        </LinearGradient>
        <Image
          source={{
            uri: item?.profile_image
              ? API_BASE_URL2 + item?.profile_image
              : 'https://img.freepik.com/free-vector/isolated-young-handsome-man-different-poses-white-background-illustration_632498-859.jpg?t=st=1741779036~exp=1741782636~hmac=180c02db2ec9c3f432f1f8b5fa23c157ab65f7148a8fe76fb08a61b606ee36dc&w=900',
          }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 7,
            borderColor: 'white',
          }}
        />
        {item?.name && (
          <ThemedText size='sm' weight='Medium' align='center' transform='capitalize' >
            {(item?.name || '')}
          </ThemedText>
        )}
        {/* <Text style={{ textAlign: 'center', color: '#6A7D94', fontFamily: 'Poppins-Regular', textTransform: 'capitalize', paddingTop: 0, fontSize: 10 }}>
                            {item?.status == 'P' ? 'Present' : item?.status == 'A' ? 'Absent' : item?.status == 'WO' ? 'Work Off' : item?.status == 'L' ? 'Leave' : item?.status == 'H' ? 'Holiday' : ''}
                        </Text> */}
      </TouchableOpacity>
    ));


    const employeeData = useMemo(() => data?.data || [], [data]);
    const renderItem = useCallback(
      ({ item }) => <EmployeeItem item={item} navigation={navigation} />,
      [navigation],
    );
    const keyExtractor = useCallback(item => item.id.toString(), []);

    return (
      <Skeleton layout={getLayout({ length: 4, width: SCREEN_WIDTH / 2 - 20, height: SCREEN_WIDTH / 2 })} type='Square' isLoading={loading}>
        <FlatList
          data={employeeData}
          contentContainerStyle={{
            gap: 10,
            paddingBottom: bottomHeight(),
            paddingHorizontal: 15,
          }}
          columnWrapperStyle={{ gap: 10 }}
          onEndReached={loadMore}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.2}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['black']}
            />
          }
          renderItem={renderItem}
          ListEmptyComponent={<EmptyMessage />}
          keyExtractor={keyExtractor}
          initialNumToRender={8}
          numColumns={2}
          windowSize={5}
          ListFooterComponent={
            fetching && <ActivityIndicator size="large" color="black" />
          }
        />
      </Skeleton>
    );
  },
);

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    position: 'relative',
    ...StyleSheet.absoluteFillObject
  },


  card: {
    backgroundColor: '#ffffffff',
    borderRadius: 10,
    marginHorizontal: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  subheading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },

  summaryContainer: {
    paddingBottom: 20,
    borderRadius: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
  },
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
    lineHeight: 15,
    justifyContent: 'center',
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
  },
  heading: {
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    lineHeight: 20,
    color: '#293646',
  },
  subheading: {
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    lineHeight: 20,
    color: '#293646',
  },
  card: {
    width: '45%',
  },
});
