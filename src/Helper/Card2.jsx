import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { CalendarIcon, DeleteIcon } from './IconsLoad';
import { useNavigation } from '@react-navigation/native';
import FormatTime from './FormatTime';
import { useAuth } from '../Context/AuthContext';
import { getFontSize, haversineDistance, SystemOS } from './Helper';
import ThemedText from './ThemedText';

// Memoized sub-components to prevent unnecessary re-renders
const DateDisplay = React.memo(({ date, type }) => {
  const displayDate = useMemo(() => {
    if (type === 'created') return new Date(date).toDateString();
    return date;
  }, [date, type]);

  return (
    <View style={styles.dateContainer}>
      <CalendarIcon color="#293646" size={18} />
      <ThemedText size='sm' weight='Medium'>
        {displayDate}
      </ThemedText>
    </View>
  );
});

const StatusBadge = React.memo(({ status }) => {
  const statusColor = useMemo(() => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'present') return 'green';
    if (lowerStatus === 'absent') return 'red';
    return 'black';
  }, [status]);

  return (
    <ThemedText size='sm' weight='Medium' style={{ color: statusColor, marginBottom: 8, textTransform: 'capitalize' }}>{status || ''}</ThemedText>
  );
});

const TimeInfoBox = React.memo(({ duration, inTime, outTime, tabName }) => {
  const formattedTimes = useMemo(() => {
    const isAttendanceTab = tabName === 'attendance';
    const checkIn = isAttendanceTab ? inTime : inTime;
    const checkOut = isAttendanceTab ? outTime : outTime;

    const formatIn = checkIn && checkIn !== '00:00' ? FormatTime(checkIn) : '00:00';
    const formatOut = checkOut && checkOut !== '00:00' && checkOut !== null
      ? FormatTime(checkOut)
      : '00:00';

    return { formatIn, formatOut };
  }, [inTime, outTime, tabName]);

  return (
    <View style={styles.timeInfoBox}>
      <View style={styles.timeRow}>
        <View style={styles.timeColumn}>
          <ThemedText size='xs' weight='Medium' color='secondary'>
            Total Hours
          </ThemedText>
          <ThemedText size='xs' weight='SemiBold' >
            {duration || '00:00'}
          </ThemedText>
        </View>
        <View style={styles.timeColumn}>
          <ThemedText size='xs' weight='Medium' color='secondary'>
            Clock in & Out
          </ThemedText>
          <ThemedText size='xs' weight='SemiBold' >
            {formattedTimes.formatIn} — {formattedTimes.formatOut}
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

const LocationButton = React.memo(({
  latitude,
  longitude,
  label,
  disabled = false,
  officeLatitude = 26.9132885972103,
  officeLongitude = 75.73996468884121
}) => {
  const distance = useMemo(() => {
    if (!latitude || !longitude) return 'Location';
    return haversineDistance(officeLatitude, officeLongitude, latitude, longitude);
  }, [latitude, longitude, officeLatitude, officeLongitude]);

  const handlePress = useCallback(() => {
    if (!disabled && latitude && longitude) {
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(url).catch(err => console.warn("Couldn't load page", err));
    }
  }, [latitude, longitude, disabled]);

  return (
    <TouchableOpacity
      disabled={disabled}
      style={[
        styles.locationButton,
        disabled && styles.locationButtonDisabled
      ]}
      onPress={handlePress}>
      <ThemedText size='xs' weight='SemiBold' >
        {label} {distance}
      </ThemedText>
    </TouchableOpacity>
  );
});

export const ActionButton = React.memo(({
  onPress,
  text,
  disabled = false,
  loading = false,
  variant = 'primary'
}) => {
  const buttonStyle = useMemo(() => {
    if (variant === 'secondary') return styles.secondaryButton;
    if (variant === 'danger') return styles.dangerButton;
    return styles.primaryButton;
  }, [variant]);

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.actionButton, buttonStyle]}>
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          {variant === 'danger' && <DeleteIcon width={20} height={20} color="white" />}
          <ThemedText size='sm' weight='Medium' color='inverse' >
            {text}
          </ThemedText>
        </>
      )}
    </TouchableOpacity>
  );
});

export const Card2 = React.memo(({
  deleteLoading,
  data,
  isLoading,
  loadingID,
  onSendData,
  hideBtn,
  onSendID,
  tabName,
  deleteRecord,
}) => {
  const navigation = useNavigation();
  const [selectedDeleteId, setSelectedDeleteID] = useState(null);
  const { userType, permissions, userAuthData } = useAuth();

  const currentId = useMemo(() => {
    if (tabName === 'pending') {
      return data?.attendance_id || data?.date;
    }
    if (tabName === 'attendance') {
      return data?.attendance_date;
    }
    return data?.id;
  }, [tabName, data]);

  const isCardLoading = useMemo(() =>
    isLoading && currentId === loadingID,
    [isLoading, currentId, loadingID]
  );




  const disableLocationButton = useMemo(() =>
    !data?.out_latitude || !data?.out_longitude,
    [data?.out_latitude, data?.out_longitude]
  );

  const dateInfo = useMemo(() => {
    if (data?.attendance_date) return { date: data.attendance_date, type: 'attendance' };
    if (data?.date) return { date: data.date, type: 'date' };
    if (data?.request_date) return { date: data.request_date, type: 'request' };
    if (data?.created) return { date: data.created, type: 'created' };
    return null;
  }, [data?.attendance_date, data?.date, data?.request_date, data?.created]);

  // Permission checks
  const showGetApproveButton = useMemo(() =>
    hideBtn &&
    !permissions?.block_get_approve_button &&
    !data?.ApprovalRequests_id &&
    data?.PendingFor === 'Get Approve' &&
    tabName === 'pending' &&
    userAuthData?.id === data?.Id,
    [hideBtn, permissions, data, tabName, userAuthData?.id]
  );

  const showApproveButton = useMemo(() =>
    hideBtn &&
    !permissions?.block_approve_button &&
    data?.ApprovalRequests_id &&
    (data?.usertype === 'Rm' || data?.usertype === 'Admin') &&
    tabName === 'pending' &&
    data?.PendingFor !== 'Get Approve' &&
    ['admin', 'ceo', 'company_admin', 'hr'].includes(userType) ||
    (userType === 'employee' && data?.usertype === 'Rm'),
    [hideBtn, permissions, data, tabName, userType]
  );

  const showDeleteButton = false;
  // const showDeleteButton = useMemo(() =>
  //   (tabName === 'pending' && data?.ApprovalRequests_id) ||
  //   (tabName === 'Approval' &&
  //     data?.ApprovalRequests_id &&
  //     (['admin', 'ceo', 'company_admin'].includes(userType) ||
  //       (userType === 'hr' && data?.admin_status !== 1 && data?.rm_status !== 1))),
  //   [tabName, data, userType]
  // );

  const showLocationButtons = useMemo(() =>
    tabName === 'attendance' && data?.status !== 'Absent',
    [tabName, data?.status]
  );


  // Callbacks
  const handleViewDetails = useCallback(() => {
    navigation.navigate('AttendanceSingleDetails', { data: data });
    // onSendID(data);
  }, [data, onSendID]);

  const handleGetApprove = useCallback(() => {
    navigation.navigate('AttendanceSingleDetails', { data: data, OpenGetApproveSheet: true });
    // onSendData(true);
    // onSendID({
    //   attendanceid: data?.attendance_id || '',
    //   id: data?.Id,
    //   requestDate: data?.date,
    //   type: '',
    //   inTime: data?.check_in_time,
    //   outTime: data?.check_out_time,
    // });
  }, [data, onSendData, onSendID]);

  const handleApprove = useCallback(() => {
    navigation.navigate('AttendanceSingleDetails', { data: data, OpenApproveSheet: true });
    // onSendData(true);
    // onSendID({
    //   requestId: data?.ApprovalRequests_id,
    //   type: data?.usertype,
    //   inTime: data?.check_in_time,
    //   outTime: data?.check_out_time,
    //   requestDay: data?.request_type,
    // });
  }, [data, onSendData, onSendID]);

  const handleDelete = useCallback(() => {
    setSelectedDeleteID(data?.ApprovalRequests_id);
    deleteRecord(data?.ApprovalRequests_id);
  }, [data?.ApprovalRequests_id, deleteRecord]);

  const handleBreakLogs = useCallback(() => {
    navigation.navigate('BreakLogsScreen', {
      id: data?.attendance_id,
    });
  }, [navigation, data?.attendance_id]);

  const isDeleteLoading = useMemo(() =>
    deleteLoading && selectedDeleteId === data?.ApprovalRequests_id,
    [deleteLoading, selectedDeleteId, data?.ApprovalRequests_id]
  );

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      disabled={isCardLoading || tabName == 'attendance' && (data?.status == 'A' || data?.status == 'wo' || data?.status == 'lwp' || data?.PendingFor == 'Get Approve')}
      onPress={handleViewDetails}>
      {isCardLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="black" size={20} />
          <ThemedText size='sm' weight='Medium' >
            Please wait...
          </ThemedText>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.header}>
          {dateInfo && <DateDisplay date={dateInfo.date} type={dateInfo.type} />}
          <StatusBadge status={data?.status} />
        </View>

        <ThemedText size='md' weight='SemiBold' >{data?.name || ''}</ThemedText>

        <TimeInfoBox
          duration={data?.duration}
          inTime={tabName === 'attendance' ? data?.check_in_time : data?.in_time}
          outTime={tabName === 'attendance' ? data?.check_out_time : data?.out_time}
          tabName={tabName}
        />

        {/* Location Buttons */}
        {showLocationButtons && (
          <View style={styles.locationButtonsRow}>
            {data?.in_latitude && data?.in_longitude && (
              <LocationButton
                latitude={data.in_latitude}
                longitude={data.in_longitude}
                label="In"
              />
            )}
            {data?.out_latitude && data?.out_longitude && (
              <LocationButton
                latitude={data.out_latitude}
                longitude={data.out_longitude}
                label="Out"
                disabled={disableLocationButton}
              />
            )}
            {data?.in_latitude && data?.in_longitude && (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleBreakLogs}>
                <ThemedText size='xs' weight='SemiBold' >Break Logs</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {data?.PendingFor !== 'Get Approve' && tabName === 'pending' && (
            <TouchableOpacity disabled style={styles.pendingButton}>
              <ThemedText size='xs' weight='SemiBold' >{data?.PendingFor || 'Pending'}</ThemedText>
            </TouchableOpacity>
          )}

          {showGetApproveButton && (
            <ActionButton
              onPress={handleGetApprove}
              text="Get Approve"
              variant="primary"
            />
          )}

          {showApproveButton && (
            <ActionButton
              onPress={handleApprove}
              text="Approve"
              variant="primary"
            />
          )}
        </View>

        {/* Delete Button */}
        {showDeleteButton && (
          <ActionButton
            onPress={handleDelete}
            text="Delete Request"
            variant="danger"
            loading={isDeleteLoading}
            disabled={deleteLoading}
          />
        )}
      </View>
    </TouchableOpacity>
  );
});

// Styles
const styles = {
  cardContainer: {
    marginBottom: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: '100%',
    width: '100%',
    left: 0,
    backgroundColor: '#e2e2e2a6',
    borderRadius: 12,
    zIndex: 999,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    gap: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4
  },
  dateText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#293646',
    fontFamily: 'Poppins-Medium',
    lineHeight: SystemOS() ? 20 : 0,
  },
  statusText: {
    marginLeft: 6,
    textTransform: 'capitalize',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    lineHeight: SystemOS() ? 20 : 0,
  },
  nameText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    lineHeight: SystemOS() ? 20 : 0,
    paddingBottom: 5,
    textTransform: 'capitalize',
  },
  timeInfoBox: {
    backgroundColor: '#f8f9fc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeColumn: {
    gap: 0,
  },
  timeLabel: {
    color: '#6A7D94',
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    lineHeight: SystemOS() ? 15 : 0,
  },
  timeValue: {
    fontSize: 12,
    color: '#45484D',
    fontFamily: 'Poppins-Medium',
    lineHeight: SystemOS() ? 15 : 0,
  },
  locationButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationButton: {
    height: 35,
    flex: 1,
    borderRadius: 5,
    backgroundColor: '#EAECF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  locationButtonDisabled: {
    backgroundColor: '#F9F9F9',
  },
  locationButtonText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    lineHeight: SystemOS() ? 20 : 0,
  },
  locationButtonTextDisabled: {
    color: '#EAECF0',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    height: 40,
    flex: 1,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#CA282C',
  },
  secondaryButton: {
    backgroundColor: '#E5E8ED',
  },
  dangerButton: {
    backgroundColor: '#CA282C',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    lineHeight: SystemOS() ? 20 : 0,
  },
  pendingButton: {
    height: 40,
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#E5E8ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  pendingButtonText: {
    color: '#293646',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    lineHeight: SystemOS() ? 20 : 0,
  },
};