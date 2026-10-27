import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { Card2 } from '../../Helper/Card2';
import useApi from '../../Apis/Services/ApiConfig';
import { useMutation, useQuery } from '@tanstack/react-query';
import EmptyMessage from '../../Helper/EmptyMessage';
import useEncodedUserData, { storage } from '../../hooks/useEncodedUserData';
import BottomSheet from '../../Helper/BottomSheet';
import { toast } from '../../Helper/ToastManager';
import useAttendanceStore from '../../Context/useAttendanceStore';
import Skeleton, { getLayout } from '../../Helper/Skeleton';


const ApprovalView = ({ employeeId }) => {
  const { userdata } = useEncodedUserData();
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);
  const {
    AttendanceApprovalLog,
    AttendanceApprovalCheckViewDetails,
    AttendanceDelete,
  } = useApi();


  const [selectedApprovalRequestId, setSelectedApprovalRequestId] = useState(null);
  const [show, setShow] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingID, setLoadingID] = useState(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const { data, isLoading, isRefetching, isPending, refetch } = useQuery({
    queryKey: ['AttendanceApprovalLog', userdata, employeeId || ''],
    queryFn: () =>
      AttendanceApprovalLog({
        EmployeeId: employeeId,
        userData: userdata,
      }),
    enabled: !!userdata,
  });
  const AttendanceApprovalLogData = useMemo(() => data?.requests || [], [data]);


  const {
    data: AttendanceApprovalCheckViewDetailsdata,
    isLoading: AttendanceApprovalCheckViewDetailsLoading,
    isRefetching: AttendanceApprovalCheckViewDetailsRefetching,
    isPending: AttendanceApprovalCheckViewDetailsPending,
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
    keepPreviousData: false,
  });

  useEffect(() => {
    useAttendanceStore.getState().setLoadingView(
      AttendanceApprovalCheckViewDetailsLoading ||
      AttendanceApprovalCheckViewDetailsPending,
    );
    if (AttendanceApprovalCheckViewDetailsdata) {
      useAttendanceStore.getState().setApprovalData(AttendanceApprovalCheckViewDetailsdata?.data);
    }
  }, [
    AttendanceApprovalCheckViewDetailsdata,
    AttendanceApprovalCheckViewDetailsLoading,
    AttendanceApprovalCheckViewDetailsPending,
  ]);

  const handleViewApprovalDetails = data => {
    setLoading(true);
    setLoadingID(data?.id);

    setTimeout(() => {
      useAttendanceStore.getState().setIsVisible(true);

      if (data?.ApprovalRequests_id) {
        setSelectedApprovalRequestId(data?.ApprovalRequests_id || '');
        useAttendanceStore.getState().setShowApprovalDetails(true);
      } else {
        useAttendanceStore.getState().setShowApprovalDetails(false);
      }
      setLoading(false);
    }, 1000);

  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const {
    mutate,
    isLoading: AttendanceDeleteLoading,
    isPending: AttendanceDeletePending,
    isError: isLeaveSubmitError,
  } = useMutation({
    mutationFn: id =>
      AttendanceDelete({
        userData: userdata,
        requestId: id,
      }),
    onSuccess: async response => {
      toast.success(response.message);
      await refetch();
    },
    onError: error => {
      console.warn('Query failed with error:', error);
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
          data={AttendanceApprovalLogData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <Card2
              deleteLoading={AttendanceDeleteLoading || AttendanceDeletePending}
              deleteRecord={deleteRecord}
              onSendID={handleViewApprovalDetails}
              tabName={'Approval'}
              data={item}
              key={index}
              hideBtn={false}
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

export default ApprovalView;
