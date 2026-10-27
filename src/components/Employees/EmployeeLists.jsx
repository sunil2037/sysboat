import {
  Dimensions,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import React, { useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL, API_BASE_URL2 } from '../../Apis/Services/ServerURL';
import { Pen } from '../../Helper/IconsLoad';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { bottomHeight, getFontSize } from '../../Helper/Helper';
import Skeleton, { getLayout } from '../../Helper/Skeleton';
import EmptyMessage from '../../Helper/EmptyMessage';
const { width, height } = Dimensions.get('window');

const EmployeeLists = ({
  data,
  loadMore,
  onRefresh,
  refreshing,
  loading,
  onReachedBottom,
  onLiftDown,
}) => {
  const { userdata } = useEncodedUserData();
  const navigation = useNavigation();
  const handleEndReached = () => {
    if (loadMore) {
      loadMore();
    }
  };

  const lastItemWidth = useSharedValue(width - 40);
  const scrollY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    width: lastItemWidth.value,
  }));

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;

      const contentHeight = event.contentSize.height;
      const layoutHeight = event.layoutMeasurement.height;
      const offset = event.contentOffset.y;

      const isBottomReached = offset + layoutHeight >= contentHeight - 20;

      if (isBottomReached) {
        lastItemWidth.value = withTiming(width - 80, { duration: 400 });
      } else if (offset < contentHeight) {
        lastItemWidth.value = withTiming(width - 20, { duration: 400 });
      }
    },
  });

  const renderItem = ({ item, index }) => {
    const isLastItem = index === data.length - 1;

    return (
      <Animated.View style={isLastItem ? animatedStyle : { width: '100%' }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('EmployeesView', { id: item.id })}
          style={[styles.card]}>
          <View>
            <View
              style={{
                position: 'absolute',
                zIndex: 10,
                right: 5,
                width: 10,
                height: 10,
                borderRadius: 50,
                backgroundColor: `${item.employee_status == 1 ? '#5CB338' : '#FFA725'
                  }`,
              }}
            />
            <Image
              source={{
                uri: item.profile_image
                  ? API_BASE_URL2 + item.profile_image
                  : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                headers: { Authorization: 'someAuthToken' },
              }}
              resizeMode={'cover'}
              style={{
                paddingVertical: 15,
                width: 50,
                height: 50,
                borderRadius: 25,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            />
          </View>
          <View style={{ flex: 1, paddingVertical: 15 }}>
            <Text style={styles.heading}>
              {item.first_name} {item.last_name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'space-between',
              }}>
              <View style={{ flexDirection: 'row', gap: 0 }}>
                <Text style={styles.subheading}>
                  {item.designation || 'Employee'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('EmployeesEdit', {
                id: item.id,
                userdata: userdata,
              })
            }
            style={{
              backgroundColor: '#CA282C',
              width: 50,
              height: '100%',
              borderTopRightRadius: 10,
              borderBottomRightRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Pen color={'white'} width={30} height={30} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  const EmployeeListSection = ({ loading, onScroll }) => (
    <View style={[styles.summaryContainer]}>
      <Skeleton isLoading={loading} layout={getLayout({ length: 8, height: 70 })}>
        <Animated.FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: bottomHeight() }}
          onEndReached={handleEndReached}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.2}
          removeClippedSubviews={false}
          onScroll={onScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['black']}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={<EmptyMessage />}
        />
      </Skeleton>
    </View>
  );

  return <EmployeeListSection loading={loading} onScroll={onScroll} />;
};

export default EmployeeLists;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    alignItems: 'center',
    borderRadius: 10,
    gap: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    borderColor: '#E2E2E2',
    borderWidth: 1,
    paddingLeft: 10,
    position: 'relative',
  },
  summaryContainer: {
    padding: 10,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    flex: 1,
  },

  row: {
    justifyContent: 'space-between',
    padding: 0,
    margin: 0,
  },
  heading: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#293646',
    textTransform: 'capitalize',
  },
  subheading: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 20,
    color: '#293646',
  },
});
