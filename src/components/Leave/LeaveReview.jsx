import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { Card3 } from '../../Helper/Card3';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import useApi from '../../Apis/Services/ApiConfig';
import EmptyMessage from '../../Helper/EmptyMessage';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import { useAuth } from '../../Context/AuthContext';
import { toast } from '../../Helper/ToastManager';
import { bottomHeight, getFontSize } from '../../Helper/Helper';
import Skeleton, { getLayout } from '../../Helper/Skeleton';


const LeaveReview = ({ onDetailSheet, leavetypefilter, leavedatefilter }) => {
  const { userdata } = useEncodedUserData();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { userType } = useAuth();
  const queryClient = useQueryClient();
  const { FetchLeaveReviewLog, ApprovalSubmit } =
    useApi();
  const onEndReachedCalledDuringMomentum = useRef(false);

  const {
    data: approvalLogData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isPending,
  } = useInfiniteQuery({
    queryKey: [
      'FetchLeaveReviewLog',
      searchQuery,
      userdata,
      leavetypefilter,
      leavedatefilter,
    ],
    queryFn: ({ pageParam = 1 }) =>
      FetchLeaveReviewLog({
        page: pageParam,
        limit: 20,
        userData: userdata,
        StartDate: leavedatefilter.startDate || '',
        EndDate: leavedatefilter.endDate || '',
        LeaveType: leavetypefilter || '',
        Search: searchQuery,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce(
        (total, page) => total + page.requests.length,
        0,
      );
      return totalFetched < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: !!userdata,
  });

  const approvedLogDatas = useMemo(() => {
    return approvalLogData?.pages?.flatMap(page => page.requests) || [];
  }, [approvalLogData]);

  const [approvingId, setApprovingId] = useState(null);
  const [approvingMessage, setApprovingMessage] = useState('');
  const {
    mutate: submitLeave,
    isError,
    data,
    error,
    isPending: isApproving,
  } = useMutation({
    mutationFn: leaveData => ApprovalSubmit(leaveData),
    onSuccess: async response => {
      setApprovingMessage(response.message);
      toast.success(response.message);
      setApprovingId(null);
      queryClient.invalidateQueries({ queryKey: ['FetchLeaveApprovalLog'] });
      queryClient.invalidateQueries({ queryKey: ['FetchLeaveRejectedLog'] });
      await refetch();
    },
    onError: error => {
      console.warn(error);
      toast.error(error.message);
      setApprovingId(null);
      setApprovingMessage(error.message);
      console.warn('Error submitting leave:', error);
    },
  });
  const handleGetApproved = async values => {
    setApprovingId(values[0].leaveid);
    const leaveData = {
      userData: userdata,
      ApprovalRequests_id: values[0].leaveid,
      ApprovalStatus: values[8].approvalStatus,
      reason: values[1].reason,
      Type: values[7].type,
    };
    submitLeave(leaveData);
  };

  const loadMore = useCallback(() => {
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      !onEndReachedCalledDuringMomentum.current
    ) {
      onEndReachedCalledDuringMomentum.current = true;
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={{ flex: 1 }}>
      {(approvalLogData?.pages[0]?.requests.length > 0 ||
        searchQuery?.length > 0) &&
        (userType == 'admin' ||
          userType == 'ceo' ||
          userType == 'company_admin' ||
          userType == 'hr') && (
          <View style={{ marginBottom: 10 }}>
            <TextInput
              onChange={e => setSearchQuery(e.nativeEvent.text)}
              value={searchQuery}
              placeholderTextColor={'black'}
              placeholder="Enter Search Query"
              style={{
                backgroundColor: 'white',
                paddingHorizontal: 15,
                height: 50,
                borderRadius: 10,
                fontFamily: 'Poppins-Regular',
                fontSize: 13,
                color: 'black',
              }}
            />
          </View>
        )}

      <Skeleton isLoading={isLoading || isPending} layout={getLayout({ length: 6, height: 172 })}>
        <FlatList
          data={approvedLogDatas}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: bottomHeight() }}
          renderItem={({ item }) => (
            <Card3
              onDetailSheet={onDetailSheet}
              data={item}
              approvingMessage={approvingMessage}
              isApprovingId={approvingId}
              onSendData={handleGetApproved}
              hideBtn={false}
            />
          )}
          estimatedItemSize={100}
          onEndReached={loadMore}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.7}
          onMomentumScrollBegin={() => {
            onEndReachedCalledDuringMomentum.current = false;
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['black']}
            />
          }
          ListEmptyComponent={() => <EmptyMessage />}
          ListFooterComponent={
            isFetchingNextPage && (
              <ActivityIndicator size="large" color="black" />
            )
          }
        />
      </Skeleton>
    </View>
  );
};
export default LeaveReview;
