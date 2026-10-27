import React, { useEffect, useState } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import backgroundImage from '../../../assets/Icon/background.png';
import BottomSheetForm from '../../Helper/BottomSheetForm';
import TabViewComponent from '../../Helper/TabViewComponent';
import TopNavBar from '../../navigation/TopNavBar';
import BottomSheetGetApproved from '../../Helper/BottomSheetGetApproved';
import { useMutation } from '@tanstack/react-query';
import useApi from '../../Apis/Services/ApiConfig';
import useEncodedUserData, { storage } from '../../hooks/useEncodedUserData';
import { toast } from '../../Helper/ToastManager';
import { Filter } from '../Filter';
import { getFontSize, STATUS_BAR_HEIGHT } from '../../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAttendanceStore from '../../Context/useAttendanceStore';

export const AttendanceMain = ({ navigation, route }) => {
  const { userdata } = useEncodedUserData();
  const [openModal, setOpenModal] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const { employeeId, initialScreen } = route.params || '';
  const visible = useAttendanceStore((s) => s.visible);
  const employeeIds = useAttendanceStore((s) => s.employeeIds);
  const attendanceId = useAttendanceStore((s) => s.attendanceId);
  const requestDate = useAttendanceStore((s) => s.requestDate);
  const pendingApproveType = useAttendanceStore((s) => s.pendingApproveType);
  const attendanceReqId = useAttendanceStore((s) => s.attendanceReqId);


  const [leavedatefilter, setleavedatefilter] = useState([]);
  const { AttendanceReqSubmit, AttendanceApprovalSubmit } = useApi();



  // if (!employeeId) {
  //     navigation.goBack();
  // }

  const handleFormVisibility = value => {
    setOpenForm(value);
  };

  const {
    mutate: AttendanceReqApply,
    isLoading: AttendanceReqSubmitLoading,
    isError: AttendanceReqSubmitError,
    isPending,
  } = useMutation({
    mutationFn: ({
      attendanceId,
      employeeIds,
      inTime,
      outTime,
      message,
      requestType,
    }) =>
      AttendanceReqSubmit({
        userData: userdata,
        attendance_id: attendanceId,
        employee_id: employeeIds,
        in_time: inTime,
        out_time: outTime,
        reason: message,
        request_type: requestType,
        request_date: requestDate,
      }),
    onSuccess: response => {
      toast.success(response.message);
      useAttendanceStore.getState().setIsVisible(false);
      useAttendanceStore.getState().setReload(true);
    },
    onError: error => {
      console.warn('Query failed with error:', error);
      useAttendanceStore.getState().setReload(false);
      toast.error(error.message);
    },
  });

  const {
    mutate: ApprovalSubmitting,
    isLoading: ApprovalSubmitLoading,
    isError: ApprovalSubmitError,
    isPending: ApprovalSubmitPending,
  } = useMutation({
    mutationFn: ({
      employeeIds,
      inTime,
      outTime,
      message,
      status,
      pendingApproveType,
      attendanceReqId,
      requestDay,
    }) =>
      AttendanceApprovalSubmit({
        userData: userdata,
        ApprovalRequests_id: attendanceReqId,
        ApprovalStatus: status,
        Type: pendingApproveType,
        employee_id: employeeIds,
        in_time: inTime,
        out_time: outTime,
        reason: message,
        request_date: '',
        request_type: requestDay,
      }),
    onSuccess: response => {
      toast.success(response.message);
      useAttendanceStore.getState().setIsVisible(false);
      useAttendanceStore.getState().setReload(true);
    },
    onError: error => {
      useAttendanceStore.getState().setReload(false);
      console.warn('Query failed with error:', error);
      toast.error(error.message);
    },
  });

  const SubmitApproval = values => {
    const inTime = values.inTime;
    const outTime = values.outTime;
    const message = values.message;
    const requestType = values.requestType || 'approve';
    const requestDay = values.requestDay || 'present';
    // setPreInTime(inTime);
    // setPreOutTime(outTime);
    // setPreMessage(message);

    if (pendingApproveType === 'Rm' || pendingApproveType === 'Admin') {
      var status = '';
      if (requestType == 'approve') {
        status = '1';
      } else {
        status = '2';
      }

      ApprovalSubmitting({
        employeeIds,
        inTime,
        outTime,
        message,
        status,
        pendingApproveType,
        attendanceReqId,
        requestDay,
      });
    } else {
      AttendanceReqApply({
        attendanceId,
        employeeIds,
        inTime,
        outTime,
        message,
        requestType,
      });
    }
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          style={{ ...StyleSheet.absoluteFillObject, flex: 1, paddingTop: STATUS_BAR_HEIGHT(), }}>
          <TopNavBar title={'Attendance'} navigation={navigation} />
          <View style={{ flex: 1, paddingHorizontal: 15 }}>
            <TabViewComponent
              onSendData={handleFormVisibility}
              employeeId={employeeId}
              leavedatefilter={leavedatefilter}
              initialKey={initialScreen}
              routes={[
                { key: 'attendance', title: 'Attendance' },
                { key: 'pending', title: 'Pending' },
                { key: 'approval', title: 'Approval' },
              ]}
            />
            {/* <TouchableOpacity onPress={() => { setOpenModal(!openModal) }} style={{ backgroundColor: '#CA282C', position: 'absolute', bottom: 10, right: 10, width: 50, height: 50, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>
                            <FilterIcon width={25} height={25} color={'white'} />
                        </TouchableOpacity> */}
          </View>
        </ImageBackground>
        {/* <Filter
          hideFilterLeaveTypeSection={true}
          filterDate={filterDate}
          modalVisible={openModal}
          onModalClose={() => {
            setOpenModal(!openModal);
          }}
        /> */}
        <BottomSheetGetApproved
          loading={
            AttendanceReqSubmitLoading ||
            isPending ||
            ApprovalSubmitPending ||
            ApprovalSubmitLoading
          }
          SubmitApproval={SubmitApproval}
          visible={visible}
          onClose={() => {
            useAttendanceStore.getState().setIsVisible(false);
            useAttendanceStore.getState().setReload(false);
          }}
        />
        <BottomSheetForm
          onSendData={handleFormVisibility}
          visible={openForm}
          onClose={value => {
            setOpenForm(false);
          }}
        />
      </SafeAreaView>

    </>
  );
};
const styles = StyleSheet.create({
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
});
