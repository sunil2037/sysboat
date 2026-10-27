import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import moment from 'moment';
import { useAuth } from '../Context/AuthContext';
import { DeleteIcon } from './IconsLoad';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useApi from '../Apis/Services/ApiConfig';
import useEncodedUserData, { storage } from '../hooks/useEncodedUserData';
import { toast } from './ToastManager';
import { getFontSize, SystemOS } from './Helper';
import ThemedText from './ThemedText';
export const Card3 = ({
  key,
  data,
  onSendData,
  hideBtn,
  isApprovingId,
  onDetailSheet,
}) => {
  const { deleteLeave } = useApi();
  const queryClient = useQueryClient();
  const { userdata } = useEncodedUserData();
  const { userType, permissions, userAuthData } = useAuth();

  const [buttonActionTitle, setButtonActionTitle] = useState('');
  const handleClick = () => {
    onDetailSheet([{ visible: true, leaveId: data.leave_id }]);
  };

  const handleFormModal = values => {
    const typeObj = values.find(item => item.hasOwnProperty('type'));
    const actionTitle = values[8].approvalStatus == 1 ? 'Approve' : 'Reject';
    setButtonActionTitle(actionTitle);
    if (typeObj) {
      if (
        values[3].rm_id !== 0 &&
        values[4].rm_status === 0 &&
        values[5].admin_id === 0
      ) {
        typeObj.type = 'Rm';
      } else if (
        (values[3].rm_id === 0 ||
          (values[3].rm_id !== 0 && values[4].rm_status === 1)) &&
        values[5].admin_id === 0
      ) {
        typeObj.type = 'Admin';
      } else {
        typeObj.type = '';
      }
    }

    onSendData(values);
  };

  const createdAt = new Date(data?.created);
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  const isWithin3Hours = createdAt > threeHoursAgo;

  const {
    mutate,
    isLoading: deleteLeaveLoading,
    isPending: deleteLeavePending,
    isError: isLeaveSubmitError,
  } = useMutation({
    mutationFn: id =>
      deleteLeave({
        userData: userdata,
        id: id?.id,
      }),
    onSuccess: async response => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ['FetchLeaveReviewLog'] });
    },
    onError: error => {
      console.warn('Query failed with error:', error);
      toast.error(error.message);
    },
  });

  return (
    <TouchableOpacity
      key={key}
      style={{ paddingBottom: 15 }}
      onPress={handleClick}>
      <View
        style={{
          backgroundColor: '#fff',
          padding: 15,
          borderRadius: 12,
          gap: 8
        }}>
        <View>
          <ThemedText size='md' weight='SemiBold' transform='capitalize'>
            {data.first_name || ''}
          </ThemedText>
        </View>
        <View
          style={{
            backgroundColor: '#f8f9fc',
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#EAECF0',
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ gap: 0 }}>
              <ThemedText size='xs' weight='Medium' color='secondary'>
                Start Date
              </ThemedText>
              <ThemedText size='xs' weight='SemiBold' >
                {data?.start_date ?? ''}
              </ThemedText>

            </View>
            <View style={{ gap: 0 }}>
              <ThemedText size='xs' weight='Medium' color='secondary'>
                End Date
              </ThemedText>
              <ThemedText size='xs' weight='SemiBold' >
                {data?.end_date ?? ''}
              </ThemedText>
            </View>
            <View style={{ gap: 0 }}>
              <ThemedText size='xs' weight='Medium' color='secondary'>
                Leaves
              </ThemedText>
              <ThemedText size='xs' weight='SemiBold' >
                {data?.leave_days ?? ''}
              </ThemedText>
            </View>
          </View>
        </View>

        {(
          userType == 'admin' ||
          userType == 'ceo' ||
          userType == 'company_admin' ||
          userType == 'hr' || (userType == 'employee' && data?.rm_id == userAuthData?.id && data?.rm_status == 0)) &&
          data?.admin_status != 2 && data?.id != userAuthData?.id &&
          data?.rm_status != 2 && (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  flex: 1,
                  marginTop: data?.admin_status != 1 && 10,
                  gap: 6,
                }}>
                {data?.admin_status != 1 && !permissions?.block_approve_leave && (
                  <TouchableOpacity
                    disabled={data?.admin_status == 1 ? true : false}
                    onPress={() =>
                      handleFormModal([
                        { leaveid: data?.leave_id },
                        { reason: data?.reason },
                        { leave_type: data?.leave_type },
                        { rm_id: data?.rm_id },
                        { rm_status: data?.rm_status },
                        { admin_id: data?.admin_id },
                        { employee_id: data?.employee_id },
                        { type: '' },
                        { approvalStatus: 1 },
                      ])
                    }
                    style={{
                      height: 35,
                      borderRadius: 50,
                      backgroundColor:
                        data?.admin_status == 1
                          ? '#EAECF0'
                          : data?.admin_status == 2
                            ? '#EAECF0'
                            : '#EAECF0',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      flex: 1,
                    }}>
                    {isApprovingId == data?.leave_id &&
                      buttonActionTitle == 'Approve' ? (
                      <ActivityIndicator color={'black'} />
                    ) : (
                      <ThemedText size='xs' weight='Medium' >
                        {data?.admin_status == 1
                          ? 'Approved'
                          : data?.admin_status == 2
                            ? 'Approve'
                            : 'Approve'}
                      </ThemedText>

                    )}
                  </TouchableOpacity>
                )}
                {(data?.admin_status != 1 && !permissions?.block_reject_leave || (isWithin3Hours === true && hideBtn)) && (
                  <TouchableOpacity
                    onPress={() =>
                      handleFormModal([
                        { leaveid: data?.leave_id },
                        { reason: data?.reason },
                        { leave_type: data?.leave_type },
                        { rm_id: data?.rm_id },
                        { rm_status: data?.rm_status },
                        { admin_id: data?.admin_id },
                        { employee_id: data?.employee_id },
                        { type: '' },
                        { approvalStatus: 2 },
                      ])
                    }
                    style={{
                      height: 35,
                      borderRadius: 50,
                      backgroundColor: '#293646',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      flex: 1,
                    }}>
                    {isApprovingId == data?.leave_id &&
                      buttonActionTitle == 'Reject' ? (
                      <ActivityIndicator color={'white'} />
                    ) : (
                      <ThemedText size='xs' weight='Medium' color='inverse'>
                        Reject
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                )}

                {data?.admin_status != 1 && !permissions?.block_delete_leave &&
                  (userType == 'admin' ||
                    userType == 'ceo' ||
                    userType == 'company_admin' ||
                    userType == 'hr') && (
                    <TouchableOpacity
                      disabled={deleteLeaveLoading || deleteLeavePending}
                      onPress={() => mutate({ id: data?.leave_id })}
                      style={{
                        height: 35,
                        width: 35,
                        borderRadius: 50,
                        backgroundColor: '#EAECF0',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 10,
                      }}>
                      {deleteLeaveLoading || deleteLeavePending ? (
                        <ActivityIndicator size={'small'} color={'black'} />
                      ) : (
                        <DeleteIcon color="#CA282C" />
                      )}
                    </TouchableOpacity>
                  )}
              </View>
            </>
          )}
      </View>
    </TouchableOpacity>
  );
};
