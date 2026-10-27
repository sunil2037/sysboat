import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import useApi from '../../Apis/Services/ApiConfig';
import { useQuery } from '@tanstack/react-query';
import { Filter } from '../Filter';
import { FilterIcon } from '../../Helper/IconsLoad';
import EmptyMessage from '../../Helper/EmptyMessage';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import { bottomHeight } from '../../Helper/Helper';
import { Card2 } from '../../Helper/Card2';
import useAttendanceStore from '../../Context/useAttendanceStore';
import Skeleton, { getLayout } from '../../Helper/Skeleton';


const AttendanceView = ({ employeeId, tabName }) => {
  const { userdata } = useEncodedUserData();
  const [refreshing, setRefreshing] = useState(false);
  const { fetchAttendanceData, AttendanceApprovalCheckViewDetails } = useApi();
  const [leavedatefilter, setleavedatefilter] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedApprovalRequestId, setSelectedApprovalRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingID, setLoadingID] = useState(null);

  useEffect(() => { }, [employeeId]);

  const {
    data: AttendanceApprovalCheckViewDetailsdata,
    isLoading: AttendanceApprovalCheckViewDetailsLoading,
    isRefetching: AttendanceApprovalCheckViewDetailsRefetching,
    isPending: AttendanceApprovalCheckViewDetailsPending,
  } = useQuery({
    queryKey: [
      'AttendanceApprovalCheckViewDetailss',
      userdata,
      selectedApprovalRequestId,
    ],
    queryFn: () =>
      AttendanceApprovalCheckViewDetails({
        Logid: 0,
        attendanceId: selectedApprovalRequestId,
        userData: userdata,
      }),
    enabled: !!userdata && !!selectedApprovalRequestId,
    keepPreviousData: false,
  });


  useEffect(() => {
    useAttendanceStore.getState().setLoadingView(
      AttendanceApprovalCheckViewDetailsLoading ||
      AttendanceApprovalCheckViewDetailsPending,
    );
    if (AttendanceApprovalCheckViewDetailsdata) {
      useAttendanceStore.getState().setApprovalData(AttendanceApprovalCheckViewDetailsdata?.data || '');
    }
  }, [
    AttendanceApprovalCheckViewDetailsdata,
    AttendanceApprovalCheckViewDetailsLoading,
    AttendanceApprovalCheckViewDetailsPending,
  ]);


  const { data, isLoading, refetch, isPending } = useQuery({
    queryKey: [
      'attendance',
      userdata,
      employeeId,
      leavedatefilter.startDate || '',
      leavedatefilter.endDate || '',
    ],
    queryFn: () =>
      fetchAttendanceData({
        page: '1',
        limit: 31,
        startDate: leavedatefilter.startDate,
        endDate: leavedatefilter.endDate,
        UserId: employeeId,
        userData: userdata,
      }),
    enabled: !!userdata,
  });

  const attendanceLogData = useMemo(() => data?.attendance || [], [data]);

  const filterDate = async value => {
    if (value) {
      setleavedatefilter(value);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);


  const handleViewApprovalDetails = data => {
    let id = data?.attendance_date;
    setLoading(true);
    setLoadingID(id);
    setTimeout(() => {
      useAttendanceStore.setState({
        showApprovalDetails: true,
        visible: true,
        requestDate: data?.attendance_date || '',
        preOutTime: AttendanceApprovalCheckViewDetailsdata?.data?.check_out_time,
        preInTime: AttendanceApprovalCheckViewDetailsdata?.data?.check_in_time,
        isFromAttendanceViewInBottomSheetGetApproved: true,
      });

      if (data?.attendance_id) {
        setSelectedApprovalRequestId(data?.attendance_id || '');
      } else {
        useAttendanceStore.getState().setShowApprovalDetails(false);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <View style={{ flex: 1 }}>
      <Skeleton isLoading={isLoading || isPending} layout={getLayout({ length: 5, height: 155 })}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={attendanceLogData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Card2
              tabName={tabName}
              onSendID={handleViewApprovalDetails}
              data={item}
              hideBtn={false}
              isLoading={loading}
              loadingID={loadingID}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['black']}
            />
          }
          ListEmptyComponent={() => <EmptyMessage />}
          removeClippedSubviews={false}
        />
      </Skeleton>
      <TouchableOpacity
        onPress={() => {
          setOpenModal(!openModal);
        }}
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
        <FilterIcon width={25} height={25} color={'white'} />
      </TouchableOpacity>
      <Filter
        filterMaxDate={true}
        hideFilterLeaveTypeSection={true}
        filterDate={filterDate}
        modalVisible={openModal}
        onModalClose={async () => {
          setOpenModal(!openModal);
          await refetch();
        }}
      />
    </View>
  );
};

export default AttendanceView;
