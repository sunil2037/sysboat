import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Image,
  Pressable,
  RefreshControl,
} from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import backgroundImage from '../../../assets/Icon/background.png';
import TopNavBar from '../../navigation/TopNavBar';
import {
  PunchInIcon,
  LocationIcon,
  HandIcon,
  DurationIcon,
  BreakIcon,
} from '../../Helper/IconsLoad';
import useApi from '../../Apis/Services/ApiConfig';
import { useInfiniteQuery } from '@tanstack/react-query';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import EmptyMessage from '../../Helper/EmptyMessage';
const SCREEN_WIDTH = Dimensions.get('window').width;
import { PulseIndicator } from 'react-native-indicators';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT } from '../../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAttendanceStore from '../../Context/useAttendanceStore';
import Skeleton, { getLayout } from '../../Helper/Skeleton';
import ThemedText from '../../Helper/ThemedText';


const AttendanceOverview = ({ navigation, route }) => {
  const { showType, date } = route.params;
  const { AttendanceTypeDetails } = useApi();
  const { userdata } = useEncodedUserData();
  const [refreshing, setRefreshing] = useState(false);
  const setIndex = useAttendanceStore((s) => s.setAttendanceTabIndex);

  const openInGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(err => console.warn("Couldn't load page", err));
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isFetching,
    isRefetching,
    isPending,
  } = useInfiniteQuery({
    queryKey: ['AttendanceTypeDetails', userdata],
    queryFn: ({ pageParam = 1 }) =>
      AttendanceTypeDetails({
        page: pageParam,
        limit: 20,
        type: showType || 'present',
        Date: date,
        userData: userdata,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetchedItems = allPages.flatMap(
        page => page.Attendanceemployees,
      ).length;
      if (totalFetchedItems < lastPage.total) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!userdata,
  });
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allAttendanceEmployees = useMemo(() => {
    return data?.pages.flatMap(page => page.Attendanceemployees) || [];
  }, [data]);

  const formatTime = timeString => {
    if (!timeString) {
      return '--:--';
    }

    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderEmployeeItem = ({ item }) => {
    return (
      <Pressable
        onPress={() => {
          setIndex(0);
          navigation.navigate('AttendanceMain', { employeeId: item?.id })
        }
        }
        style={{ paddingBottom: 15 }}>
        <View
          style={{
            backgroundColor: '#fff',
            padding: 15,
            borderRadius: 12,
          }}>
          <View
            style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row',
            }}>
            <ThemedText size='md' weight='Medium' transform='capitalize'>
              {item?.first_name}
            </ThemedText>
            <ThemedText size='xs' weight='Regular' align='capitalize' color='success' >
              {item?.status == 'P'
                ? 'Present'
                : item?.status == 'A'
                  ? 'Absent'
                  : item?.status == 'WO'
                    ? 'Work Off'
                    : item?.status == 'L'
                      ? 'Leave'
                      : item?.status == 'H'
                        ? 'Holiday'
                        : ''}
            </ThemedText>
          </View>
          <View
            style={{
              backgroundColor: '#f8f9fc',
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#EAECF0',
              marginTop: 10,
            }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ gap: 0 }}>
                <ThemedText size='xs' weight='Regular' color='secondary'>
                  Out Time
                </ThemedText>
                <ThemedText size='sm' weight='Medium' >
                  {formatTime(item.check_in_time)}
                </ThemedText>

              </View>
              <View style={{ gap: 0 }}>
                <ThemedText size='xs' weight='Regular' color='secondary'>
                  In Time
                </ThemedText>
                <ThemedText size='sm' weight='Medium' >
                  {formatTime(item.check_out_time)}
                </ThemedText>
              </View>
              <View style={{ gap: 0 }}>
                <ThemedText size='xs' weight='Regular' color='secondary'>
                  Duration
                </ThemedText>
                <ThemedText size='sm' weight='Medium' >
                  {item.duration || '--*--'}
                </ThemedText>
              </View>
            </View>
          </View>
          {item.check_in_time && (
            <View style={{ paddingTop: 20 }}>
              <ThemedText size='sm' weight='Medium' >
                Timeline
              </ThemedText>
              <View style={{ paddingTop: 10, gap: 15 }}>
                {item.check_in_time && (
                  <View style={{ flexDirection: 'row' }}>
                    <View
                      style={{ paddingRight: 15, alignItems: 'center', gap: 10 }}>
                      <ThemedText size='sm' weight='Medium' >
                        {formatTime(item.check_in_time)}
                      </ThemedText>
                      <View
                        style={{
                          backgroundColor: '#CA282C',
                          padding: 10,
                          borderRadius: 40,
                        }}>
                        <HandIcon width={25} height={25} color={'white'} />
                      </View>
                      <View
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <View
                          style={{
                            width: 2,
                            backgroundColor: '#E2E2E2',
                            flex: 1,
                            borderRadius: 2,
                          }}
                        />
                        {!item.check_out_time &&
                          !item.BreckDetails?.length > 0 && (
                            <PulseIndicator size={25} color="#5CB338" />
                          )}
                      </View>
                    </View>
                    <View
                      style={{
                        backgroundColor: '#f8f9fc',
                        flex: 1,
                        borderRadius: 10,
                        padding: 15,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                        <View>
                          <ThemedText size='sm' weight='Medium' >
                            Login
                          </ThemedText>
                          {item.daily_status_in && (
                            <ThemedText size='xs' weight='Regular' color='secondary' >
                              {item.daily_status_intime} {item.daily_status_in}
                            </ThemedText>

                          )}
                        </View>
                        <View>
                          <View>
                            <Image
                              style={{ width: 50, height: 50, borderRadius: 50 }}
                              source={{
                                uri: 'https://img.freepik.com/free-vector/isolated-young-handsome-man-different-poses-white-background-illustration_632498-859.jpg?t=st=1741779036~exp=1741782636~hmac=180c02db2ec9c3f432f1f8b5fa23c157ab65f7148a8fe76fb08a61b606ee36dc&w=900',
                              }}
                            />
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          openInGoogleMaps(
                            item.in_latitude,
                            item.in_longitude,
                            item.out_latitude,
                            item.out_longitude,
                          );
                        }}
                        style={{
                          height: 40,
                          borderRadius: 5,
                          backgroundColor: '#EAECF0',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexDirection: 'row',
                          marginTop: 10,
                          gap: 5,
                        }}>
                        <LocationIcon
                          width={17}
                          color={'#293646'}
                          height={17}
                        />
                        <ThemedText size='sm' weight='Regular'  >
                          View Location
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Break timeline item - placeholder */}
                {item.BreckDetails?.length > 0 &&
                  item.BreckDetails.map((breakItem, key) => (
                    <View key={key} style={{ flexDirection: 'row' }}>
                      <View
                        style={{
                          paddingRight: 15,
                          alignItems: 'center',
                          gap: 10,
                        }}>
                        <ThemedText size='sm' weight='Medium' >
                          {formatTime(breakItem?.start_time) || '--*--'}
                        </ThemedText>
                        <View
                          style={{
                            backgroundColor: '#CA282C',
                            padding: 10,
                            borderRadius: 40,
                          }}>
                          <BreakIcon width={25} color={'white'} height={25} />
                        </View>
                        <View
                          style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                          <View
                            style={{
                              width: 2,
                              backgroundColor: '#E2E2E2',
                              flex: 1,
                              borderRadius: 2,
                            }}
                          />
                          {!item.check_out_time &&
                            item?.BreckDetails?.length === key + 1 && (
                              <PulseIndicator size={25} color="#5CB338" />
                            )}
                        </View>
                      </View>
                      <View
                        style={{
                          backgroundColor: '#f8f9fc',
                          flex: 1,
                          borderRadius: 10,
                          padding: 15,
                        }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                          <View>
                            <ThemedText size='sm' weight='Medium' >
                              Break
                            </ThemedText>
                            <ThemedText size='xs' weight='Regular' color="secondary" >
                              {breakItem?.duration || '--*--'}
                            </ThemedText>
                          </View>
                          <View>
                            <View>
                              <Image
                                style={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: 50,
                                }}
                                source={{
                                  uri: 'https://img.freepik.com/free-vector/isolated-young-handsome-man-different-poses-white-background-illustration_632498-859.jpg?t=st=1741779036~exp=1741782636~hmac=180c02db2ec9c3f432f1f8b5fa23c157ab65f7148a8fe76fb08a61b606ee36dc&w=900',
                                }}
                              />
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            openInGoogleMaps(
                              breakItem?.in_latitude,
                              breakItem?.in_longitude,
                              breakItem?.out_latitude,
                              breakItem?.out_longitude,
                            );
                          }}
                          style={{
                            height: 40,
                            borderRadius: 5,
                            backgroundColor: '#EAECF0',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'row',
                            marginTop: 10,
                            gap: 5,
                          }}>
                          <LocationIcon
                            width={17}
                            color={'#293646'}
                            height={17}
                          />
                          <ThemedText size='sm' weight='Regular' >
                            View Location
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                {/* Check-out timeline item */}
                {item.check_out_time && (
                  <View style={{ flexDirection: 'row' }}>
                    <View
                      style={{ paddingRight: 15, alignItems: 'center', gap: 10 }}>
                      <ThemedText size='sm' weight='Medium' >
                        {formatTime(item.check_out_time)}
                      </ThemedText>
                      <View
                        style={{
                          backgroundColor: '#CA282C',
                          padding: 10,
                          borderRadius: 40,
                        }}>
                        <DurationIcon color={'white'} width={25} height={25} />
                      </View>
                    </View>
                    <View
                      style={{
                        backgroundColor: '#f8f9fc',
                        flex: 1,
                        borderRadius: 10,
                        padding: 15,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                        <View>
                          <ThemedText size='sm' weight='Medium' >
                            Logout
                          </ThemedText>
                          {item.daily_status_out && (
                            <ThemedText size='sm' weight='Regular' color="secondary" >
                              {item.daily_status_outtime}{' '}
                              {item.daily_status_out.toLowerCase()}
                            </ThemedText>
                          )}
                        </View>
                        <View>
                          <Image
                            style={{ width: 50, height: 50, borderRadius: 50 }}
                            source={{
                              uri: 'https://img.freepik.com/free-vector/isolated-young-handsome-man-different-poses-white-background-illustration_632498-859.jpg?t=st=1741779036~exp=1741782636~hmac=180c02db2ec9c3f432f1f8b5fa23c157ab65f7148a8fe76fb08a61b606ee36dc&w=900',
                            }}
                          />
                        </View>
                      </View>
                      <TouchableOpacity
                        style={{
                          height: 40,
                          borderRadius: 5,
                          backgroundColor: '#EAECF0',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexDirection: 'row',
                          marginTop: 10,
                          gap: 5,
                        }}>
                        <LocationIcon
                          width={17}
                          color={'#293646'}
                          height={17}
                        />
                        <ThemedText size='sm' weight='Regular' >
                          View Location
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={[styles.imageBackground, { paddingTop: STATUS_BAR_HEIGHT() }]}>
        <TopNavBar title="Attendance Overview" navigation={navigation} />
        <View style={{ paddingHorizontal: 20, flex: 1 }}>
          <Skeleton isLoading={isLoading || isPending || isRefetching} layout={getLayout({ length: showType == 'absent' ? 10 : 3, height: showType == 'absent' ? 121 : 305 })}>
            <FlatList
              data={allAttendanceEmployees}
              renderItem={renderEmployeeItem}
              keyExtractor={item => `${item.id}`}
              contentContainerStyle={{ paddingBottom: bottomHeight() }}
              onEndReached={loadMore}
              onEndReachedThreshold={0.9}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              showsVerticalScrollIndicator={false}
              windowSize={7}
              removeClippedSubviews={false}
              updateCellsBatchingPeriod={100}
              ListEmptyComponent={
                !isLoading || !isPending || isRefetching ? <EmptyMessage /> : null
              }
              ListFooterComponent={
                isLoading || isPending || isRefetching ? (
                  <ActivityIndicator size={30} color={'black'} />
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['black']}
                />
              }
              decelerationRate={'normal'}
            />
          </Skeleton>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default AttendanceOverview;

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    position: 'relative',
    ...StyleSheet.absoluteFillObject
  },
});
