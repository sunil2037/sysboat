import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Text,
  FlatList,
} from 'react-native';
import { Card2 } from '../../Helper/Card2';
import useApi from '../../Apis/Services/ApiConfig';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Filter } from '../Filter';
import { FilterIcon } from '../../Helper/IconsLoad';
import EmptyMessage from '../../Helper/EmptyMessage';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import BottomSheet from '../../Helper/BottomSheet';
import { toast } from '../../Helper/ToastManager';
import useAttendanceStore from '../../Context/useAttendanceStore';
import Skeleton, { getLayout } from '../../Helper/Skeleton';


const PendingView = ({ employeeId, tabName }) => {
  const { userdata } = useEncodedUserData();
  const [refreshing, setRefreshing] = useState(false);
  const {
    AttendancePending,
    AttendanceApprovalCheckViewDetails,
    AttendanceDelete,
  } = useApi();

  const [leavedatefilter, setleavedatefilter] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedApprovalRequestId, setSelectedApprovalRequestId] = useState(null);
  const [show, setShow] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingID, setLoadingID] = useState(null);
  // const reload = useAttendanceStore((s) => s.reload);

  // useEffect(() => {
  //   if (reload) {
  //     refetch();
  //   }
  // }, [reload]);

  const {
    data: AttendancePendingData,
    isLoading,
    refetch,
    isPending,
  } = useQuery({
    queryKey: [
      'AttendancePending',
      userdata,
      employeeId,
      leavedatefilter?.startDate || '',
      leavedatefilter?.endDate || '',
    ],
    queryFn: () =>
      AttendancePending({
        // startDate: '2025-02-20',
        // endDate: '2025-02-24',
        startDate: leavedatefilter?.startDate,
        endDate: leavedatefilter?.endDate,
        searchData: '',
        EmployeeId: employeeId,
        userData: userdata,
      }),
    enabled: !!userdata,
  });

  const AttendancePendingLogData = useMemo(
    () => AttendancePendingData?.ApprovalLog || [],
    [AttendancePendingData],
  );

  const {
    data: AttendanceApprovalCheckViewDetailsdata,
    isLoading: AttendanceApprovalCheckViewDetailsLoading,
  } = useQuery({
    queryKey: [
      'AttendanceApprovalCheckViewDetails',
      userdata,
      selectedApprovalRequestId,
    ],
    queryFn: () =>
      AttendanceApprovalCheckViewDetails({
        Logid: selectedApprovalRequestId,
        attendanceId: 0,
        userData: userdata,
      }),
    enabled: !!userdata && !!selectedApprovalRequestId,
  });


  useEffect(() => {
    useAttendanceStore.getState().setLoadingView(
      AttendanceApprovalCheckViewDetailsLoading
    );
    if (AttendanceApprovalCheckViewDetailsdata) {
      useAttendanceStore.getState().setApprovalData(AttendanceApprovalCheckViewDetailsdata?.data || '');
    }
  }, [
    AttendanceApprovalCheckViewDetailsdata,
    AttendanceApprovalCheckViewDetailsLoading,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filterDate = async value => {
    if (value) {
      setleavedatefilter(value);
    }
  };

  const handleUpdatePendingRequests = (data) => {
    let id = data?.attendance_id || data?.attendanceid || data?.requestDate;
    setLoading(true);
    setLoadingID(id);
    setTimeout(() => {
      const showDetails = !!data?.PendingFor;
      useAttendanceStore.setState({
        showApprovalDetails: showDetails,
        visible: true,
        attendanceId: data?.attendanceid || '',
        employeeId,
        requestDate: data?.requestDate || '',
        attendanceReqId: data?.requestId || '',
        type: data?.type || '',
        preOutTime: data?.outTime || '',
        preInTime: data?.inTime || '',
        requestDay: data?.requestDay || '',
        pendingApproveType:
          data?.type === 'Rm'
            ? 'Rm'
            : data?.type === 'Admin'
              ? 'Admin'
              : '',
      });

      if (data?.ApprovalRequests_id) {
        setSelectedApprovalRequestId(data.ApprovalRequests_id);
      }
      setLoading(false);
    }, 1000);

  };


  const {
    mutate,
    isLoading: AttendanceDeleteLoading,
    isPending: AttendanceDeletePending,
    isError: isLeaveSubmitError,
  } = useMutation({
    mutationFn: selectedDeleteId =>
      AttendanceDelete({
        userData: userdata,
        requestId: selectedDeleteId,
      }),
    onSuccess: async response => {
      toast.success(response.message);
      await refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const deleteRecord = id => {
    setSelectedDeleteId(id);
    setShow(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Skeleton isLoading={isLoading || isPending} layout={getLayout({ length: 5, height: 155 })}>
        <FlatList
          data={AttendancePendingLogData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Card2
              deleteLoading={AttendanceDeleteLoading || AttendanceDeletePending}
              deleteRecord={deleteRecord}
              onSendID={handleUpdatePendingRequests}
              tabName={tabName}
              data={item}
              hideBtn={true}
              onSendData={value =>
                console.warn('onSendData called with:', value)
              }
              isLoading={loading}
              loadingID={loadingID}
            />
          )}
          estimatedItemSize={100}
          showsVerticalScrollIndicator={false}
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
          bottom: 10,
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
        hideFilterLeaveTypeSection={true}
        filterDate={filterDate}
        modalVisible={openModal}
        onModalClose={async () => {
          setOpenModal(!openModal);
        }}
      />
      <BottomSheet
        message="Confirm Deletion"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        buttons={[
          {
            title: 'Yes, Delete',
            onPress: () => {
              if (selectedDeleteId) {
                mutate(selectedDeleteId);
                setShow(false);
                setSelectedDeleteId(null);
              }
            },
          },
          {
            title: 'No, Let me check',
            onPress: () => {
              setShow(false);
              setSelectedDeleteId(null);
            },
            outline: true,
          },
        ]}
        visible={show}
        onClose={() => setShow(false)}
      />
    </View>
  );
};

export default PendingView;
