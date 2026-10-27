import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import EmployeeLists from './EmployeeLists';
import { Cross, FilterIcon, Pen, ViewAllIcon } from '../../Helper/IconsLoad';
import { useNavigation } from '@react-navigation/native';
import FilterEmployees from '../FilterEmployees';
import useApi from '../../Apis/Services/ApiConfig';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import { bottomHeight, getFontSize } from '../../Helper/Helper';
import { useAuth } from '../../Context/AuthContext';
const SCREEN_WIDTH = Dimensions.get('window').width;

const DATA = [
  { title: 'Active', value: 20 },
  { title: 'In Active', value: 20 },
  { title: 'Provision Period', value: 20 },
  { title: 'Resigned Status', value: 20 },
];

const MainScreen = () => {
  const [loading, setLoading] = useState(false);
  const { permissions } = useAuth();
  const { Employees } = useApi();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [filterData, setFilterData] = useState(null);
  const { userdata } = useEncodedUserData();
  const [isLifted, setIsLifted] = useState(false);
  const liftAnim = React.useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: EmployeesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: EmployeesDataLoading,
    refetch: EmployeesDataRefetch,
    isPending: EmployeesDataisPending,
  } = useInfiniteQuery({
    queryKey: ['EmployeesData', userdata],
    queryFn: ({ pageParam = 1 }) =>
      Employees({
        page: pageParam,
        id: '',
        limit: 20,
        userData: userdata,
        type: 'view',
        platformType: Platform.OS,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetchedItems = allPages.length * lastPage.limit;
      if (totalFetchedItems < lastPage.total) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!userdata,
  });

  const employeeLogDatas = useMemo(() => {
    return EmployeesData?.pages.flatMap(page => page.employees) || [];
  }, [EmployeesData]);

  console.log("employeeLogDatas", employeeLogDatas)

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await EmployeesDataRefetch();
    setRefreshing(false);
  }, [EmployeesDataRefetch]);

  const handleFilterData = selected => {
    setFilterData(selected);
  };

  const renderItem = ({ item, index }) => (
    <>
      <View style={styles.card}>
        <Text style={styles.heading}>{item.title}</Text>
        <Text style={styles.subheading}>{item.value}</Text>
      </View>
      {DATA.length === index + 1 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('PartsCrud')}
          style={styles.card}>
          <Text style={styles.heading}>View All</Text>
          <ViewAllIcon width={20} height={20} color={'#293646'} />
        </TouchableOpacity>
      )}
    </>
  );

  const SummarySection = ({ loading }) => (
    <View style={styles.summaryContainer}>

      <FlatList
        data={DATA}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ gap: 10 }}
        style={{ padding: 0, margin: 0 }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* <SummarySection loading={loading} /> */}
      {filterData && (
        <View style={{ paddingHorizontal: 25 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: 10,
              backgroundColor: 'white',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#E2E2E2',
            }}>
            <FilterIcon width={25} height={25} color={'#293646'} />
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 15,
                lineHeight: 20,
                color: '#293646',
                marginLeft: 10,
              }}>
              Filter (5)
            </Text>
            <TouchableOpacity
              onPress={() => {
                setFilterData(null);
              }}>
              <Cross width={25} height={25} color={'#293646'} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <EmployeeLists
        loadMore={loadMore}
        onRefresh={onRefresh}
        refreshing={refreshing}
        loading={EmployeesDataLoading}
        data={employeeLogDatas}
      />
      <FilterEmployees
        filterData={handleFilterData}
        modalVisible={modalVisible}
        onModalClose={() => setModalVisible(false)}
      />
      {!permissions?.block_edit_employee && (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('EmployeesEdit', { id: null, userdata: userdata })
          }
          style={{
            backgroundColor: '#CA282C',
            position: 'absolute',
            bottom: bottomHeight(),
            right: 10,
            width: 50,
            height: 50,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Pen width={25} height={25} color={'white'} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => setModalVisible(!modalVisible)}
        style={{
          backgroundColor: '#CA282C',
          position: 'absolute',
          bottom: bottomHeight() + bottomHeight() + bottomHeight(),
          right: 10,
          width: 50,
          height: 50,
          borderRadius: 50,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <FilterIcon width={25} height={25} color={'white'} />
      </TouchableOpacity>
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  heading: {
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    textTransform: 'capitalize',
    fontSize: 14,
    lineHeight: 20,
    color: '#293646',
  },
  subheading: {
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 20,
    color: '#293646',
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 15,
    gap: 5,
    marginHorizontal: 5,
    alignItems: 'center',
    borderRadius: 10,
    borderColor: '#E2E2E2',
    borderWidth: 1,
  },
  summaryContainer: {
    padding: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0)',
  },
  row: {
    justifyContent: 'space-between',
    padding: 0,
    margin: 0,
  },
});
