import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  BackHandler,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Vibration,
  ImageBackground,
  Platform,
  PixelRatio,
} from 'react-native';
import {
  ReloadIcon,
  HandIcon,
  TotalHoursIcon,
  PunchInIcon,
  PunchOutIcon,
  DurationIcon,
  Notification2,
} from '../Helper/IconsLoad';
import LinearGradient from 'react-native-linear-gradient';
import TimeAndDate from '../components/TimeAndDate';
import CircularProgress from '../Helper/CircularProgress';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useApi from '../Apis/Services/ApiConfig';

import CircularProgressBreak from '../Helper/CircularProgressBreak';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import NotificationHelper from '../Helper/NotificationHelper';
import breakInImage from '../../assets/Icon/breakin.png';
import breakOutImage from '../../assets/Icon/breakout.png';
import { API_BASE_URL, API_BASE_URL2 } from '../Apis/Services/ServerURL';
import backgroundImage from '../../assets/Icon/background.png';
import { useAuth } from '../Context/AuthContext';
import useEncodedUserData, { storage } from '../hooks/useEncodedUserData';
import moment from 'moment';
import { useFocusEffect, useNavigationState, useRoute } from '@react-navigation/native';

import { toast } from '../Helper/ToastManager';
import { capitalizeFirstLetter } from '../Helper/StringHelpers';
import MiniMapCard from '../components/MiniMapCard';
import UploadScreen from './UploadScreen';
import {
  getFontSize,
  getSingleLocation,
  startTracking,
  STATUS_BAR_HEIGHT,
  stopTracking,
  StringLengthLimit,
  TOAST_MESSAGES
} from '../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DoubleClickExit from '../utils/DoubleClickExit';
import { useLocation } from '../IOS/LocationModule';
import Skeleton from '../Helper/Skeleton';
import BirthdayWishCard from '../components/BirthdayWishCard';
import ThemedText, { Caption } from '../Helper/ThemedText';
import PunchConfirmationSheet from '../components/PunchConfirmationSheet';
import { getPunchVerificationMode } from './punchVerificationPolicy';
import {
  getPunchAction,
  getPunchConfirmationDecision,
} from './attendanceValidation';

const HomeScreen = ({ navigation }) => {
  const { IOSLocation, loading, error, getLocation } = useLocation();
  const [showCard, setShowCard] = useState(false);
  const employee = {
    name: 'Rahul Gupta',
    role: 'Backend Engineer',
    department: 'Engineering',
    yearsAtCompany: 3,
  };



  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const queryClient = useQueryClient();
  const route = useRoute();

  const {
    fetchAttendance,
    clockInApi,
    clockOutApi,
    breakInApi,
    breakOutApi,
    fetchBreak,
    GetEmployeesProfile,
    NotificationGet,
  } = useApi();

  const {
    setUserType,
    authToken,
    setFaceAuthenticated,
    faceAuthenticated,
    setStartLocationTracking,
    setCheckOutTimeAuth,
    refetchProfile,
    profileDataLoading,
    profileData,
    permissions
  } = useAuth();



  const { userdata } = useEncodedUserData();

  const rotateValue = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);
  const comingFromUploadRef = useRef(false);
  const locationTimeoutRef = useRef(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalAction, setUploadModalAction] = useState(null);
  const [showPunchConfirmation, setShowPunchConfirmation] = useState(false);
  const [isFront, setIsFront] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  const [loadingStates, setLoadingStates] = useState({
    main: false,
    clockIn: false,
    reload: false,
  });
  const attendanceUpdateLock = useRef(false);
  const punchConfirmationLock = useRef(false);
  const [attendanceData, setAttendanceData] = useState({
    inTime: '',
    checkOutTime: '',
    duration: '',
    punchInTime: '',
    punchOutTime: '',
    totalHours: '',
    attendanceId: null,
  });

  const [breakData, setBreakData] = useState({
    breakTime: '',
    endBreakTime: '',
    breakDuration: '',
    formattedBreakTime: '',
    formattedEndBreakTime: '',
    formattedBreakDuration: '',
  });

  const [uiState, setUiState] = useState({
    blockPunchOut: false,
    message: '',
  });

  const currentTabRouteName = useNavigationState(state => {
    const tabIndex = state.index;
    return state.routes[tabIndex].name;
  });




  const formatTime = useCallback(timeString => {
    if (!timeString) return '--:--';

    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return '--:--';

      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `${formattedHours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')} ${period}`;
    } catch (error) {
      return '--:--';
    }
  }, []);

  const formatDuration = useCallback(duration => {
    if (!duration) return '';

    try {
      const regex = /(\d+)\s*hour\s*(\d+)\s*minute/;
      const matches = duration.match(regex);

      if (!matches) return duration;

      const hours = parseInt(matches[1], 10);
      const minutes = parseInt(matches[2], 10);

      return hours === 0
        ? `${minutes} minute`
        : `${hours} hour ${minutes} minute`;
    } catch (error) {
      return duration;
    }
  }, []);

  const { data: notificationData, refetch: refetchNotification } = useQuery({
    queryKey: ['NotificationGet', userdata],
    queryFn: () => NotificationGet({ userData: userdata }),
    enabled: !!userdata,
    refetchOnWindowFocus: false,
  });

  const isNotification = useMemo(() => {
    return notificationData?.data?.some(item => item.is_read === 0);
  }, [notificationData]);

  const prefetchEmployeeProfile = async (userdata) => {
    if (!userdata) return;

    await queryClient.prefetchQuery({
      queryKey: ['GetEmployeesProfile', userdata],
      queryFn: () =>
        GetEmployeesProfile({
          type: 'Personal',
          UserId: '',
          folderName: 'EmployeesProfile',
          userData: userdata,
        }),
      staleTime: 1000 * 60 * 5,
    });
  };

  const {
    data: GetEmployeesProfileData,
    isLoading: profileDataLoadings,
    refetch: GetEmployeesProfileDataRefetch,
  } = useQuery({
    queryKey: ['GetEmployeesProfile', userdata],
    queryFn: () =>
      GetEmployeesProfile({
        type: 'Personal',
        UserId: '',
        folderName: 'EmployeesProfile',
        userData: userdata,
      }),
    enabled: !!userdata,
  });

  const punchVerificationMode = getPunchVerificationMode(
    profileData,
    profileDataLoading || profileDataLoadings,
  );
  const punchAction = getPunchAction(attendanceData);

  const profileImageUri = useMemo(() => {
    return GetEmployeesProfileData?.data[0]?.profile_image
      ? API_BASE_URL2 + GetEmployeesProfileData?.data[0]?.profile_image
      : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  }, [GetEmployeesProfileData]);

  const {
    data: fetchBreakDetails,
    isLoading: fetchBreakDetailsLoading,
    refetch: fetchBreakRefetch,
  } = useQuery({
    queryKey: ['fetchBreak', userdata, attendanceData.attendanceId],
    queryFn: async () => {
      const response = await fetchBreak({
        attendance_id: attendanceData.attendanceId,
        userData: userdata,
      });

      if (response.data?.length > 0) {
        const latestEntry =
          response.data.length > 1
            ? response.data[response.data.length - 1]
            : response.data[0];

        setBreakData({
          breakTime: latestEntry.start_time || '',
          endBreakTime: latestEntry.end_time || '',
          breakDuration: latestEntry.duration || '',
          formattedBreakTime: formatTime(latestEntry.start_time || ''),
          formattedEndBreakTime:
            latestEntry.end_time !== '00:00:00'
              ? formatTime(latestEntry.end_time || '')
              : '',
          formattedBreakDuration: formatDuration(latestEntry.duration || ''),
        });
      }

      return response;
    },
    enabled: !!userdata && !!attendanceData.attendanceId,
  });

  const {
    data: fetchAttendances,
    isLoading: fetchAttendanceDataLoading,
    refetch: fetchAttendanceRefetch,
  } = useQuery({
    queryKey: ['fetchAttendance', userdata],
    queryFn: async () => {
      if (attendanceUpdateLock.current) return;
      attendanceUpdateLock.current = true;
      try {
        const response = await fetchAttendance({
          TypeCheck: 'TimeGet',
          userData: userdata,
        });
        if (response?.status) {
          const duration = response.duration || '';
          const formattedDuration = formatDuration(duration);
          setAttendanceData(prev => ({
            ...prev,
            duration,
            inTime: response?.InTime || '',
            checkOutTime: response?.check_out_time || '',
            attendanceId: String(response.attendance_id),
            punchInTime: response?.check_in_time,
            punchOutTime: response?.check_out_time,
            totalHours: formattedDuration,
          }));

          setCheckOutTimeAuth(response?.check_out_time);

          if (response?.InTime && !response?.check_out_time) {
            setStartLocationTracking(true);
            startTracking();
          } else if (response?.check_out_time) {
            setStartLocationTracking(false);
            stopTracking();
          }

          if (response.attendance_id) {
            await AsyncStorage.setItem(
              'attendanceId',
              String(response.attendance_id),
            );
          }

          return response;
        } else {
          stopTracking();
        }
        return null;
      } finally {
        setTimeout(() => {
          attendanceUpdateLock.current = false;
        }, 300);
      }
    },

    enabled: !!userdata,
  });

  console.log("Yashveer soni", attendanceData)


  // Effects
  useEffect(() => {
    isMounted.current = true;

    const fetchAttendanceId = async () => {
      if (!isMounted.current) return;

      try {
        const id = await AsyncStorage.getItem('attendanceId');
        setUserType(GetEmployeesProfileData?.data[0]?.type);
        setAttendanceData(prev => ({ ...prev, attendanceId: id }));
      } catch (error) {
        console.error('Error fetching attendance ID:', error);
      }
    };

    fetchAttendanceId();

    return () => {
      isMounted.current = false;
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, [GetEmployeesProfileData]);

  useEffect(() => {
    if (!attendanceData.inTime || !GetEmployeesProfileData?.out_time) return;

    try {
      refetchProfile();
      const companyOutTimeLocal = moment
        .utc(GetEmployeesProfileData?.out_time)
        .local();
      const createdAt = moment.utc(attendanceData.inTime).local();
      const minimumPunchOutTime = createdAt.clone().add(1, 'hours');
      const companyCloseTime = moment
        .utc(GetEmployeesProfileData?.out_time)
        .local();
      const now = moment();

      const isBeforeMinimumTime = now.isBefore(minimumPunchOutTime);
      const isBeforeCloseTime = now.isBefore(companyCloseTime);
      const durations = moment.duration(now.diff(companyOutTimeLocal));
      const hours = Math.abs(Math.floor(durations.asHours()));

      const shouldBlockPunchOut =
        hours < 1 ? false : isBeforeMinimumTime && isBeforeCloseTime;

      setUiState(prev => ({ ...prev, blockPunchOut: shouldBlockPunchOut }));
    } catch (error) {
      console.error('Error calculating punch out status:', error);
    }
  }, [attendanceData.inTime, GetEmployeesProfileData?.out_time]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        DoubleClickExit.handleBackPress();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (!isMounted.current) return;
      refetchNotification();
    }, [refetchNotification]),
  );


  const checkIn = useCallback(async () => {
    try {
      await startTracking();
      setLoadingStates(prev => ({ ...prev, clockIn: true }));
      let location;
      try {
        if (Platform.OS === 'ios') {
          location = IOSLocation;
        } else {
          location = await getSingleLocation();
        }
      } catch (error) {
        toast.error(
          'Unable to get your current location. Please try again or restart the app',
        );
        return;
      }

      if (!location?.latitude || !location?.longitude) {
        toast.error(
          'Unable to get your current location. Please try again or restart the app',
        );
        return;
      }

      const response = await clockInApi({
        type: 'in',
        dateTime: new Date().toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        userData: userdata,
      });

      if (response?.status) {

        if (!attendanceUpdateLock.current) {
          fetchAttendanceRefetch();
        }
        await startTracking();
        setUiState(prev => ({ ...prev, blockPunchOut: true }));
        setStartLocationTracking(true);
        toast.success(response.message);
        // resetAttendanceAndBreakData();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to clock in');
    } finally {
      setLoadingStates(prev => ({ ...prev, clockIn: false }));
    }
  }, [userdata, authToken, getSingleLocation, IOSLocation]);

  const checkOut = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, clockIn: true }));

      let location;
      try {
        if (Platform.OS === 'ios') {
          location = IOSLocation;
        } else {
          location = await getSingleLocation();
        }
      } catch (error) {
        toast.error(
          'Unable to get your current location. Please try again or restart the app',
        );
        return;
      }

      if (!location?.latitude || !location?.longitude) {
        toast.error(
          'Unable to get your current location. Please try again or restart the app',
        );
        return;
      }

      const response = await clockOutApi({
        type: 'out',
        dateTime: new Date().toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        userData: userdata,
      });

      if (response?.status) {
        await stopTracking();
        setStartLocationTracking(false);
        toast.success(response.message);
        // resetAttendanceAndBreakData();
        if (!attendanceUpdateLock.current) {
          fetchAttendanceRefetch();
        }

      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to clock out');
    } finally {
      setLoadingStates(prev => ({ ...prev, clockIn: false }));
    }
  }, [userdata, getSingleLocation, IOSLocation]);

  const handleClockIn = useCallback(async () => {
    Vibration.vibrate(100);
    const decision = getPunchConfirmationDecision({
      ...attendanceData,
      verificationMode: punchVerificationMode,
      faceAuthenticated,
      blocked: permissions?.block_punch_in_out,
    });

    if (decision === 'blocked') {
      toast.info(TOAST_MESSAGES.block_punch_in_out);
      return;
    }
    if (decision === 'profile_loading') {
      toast.info('Loading your profile. Please try again in a moment.');
      return;
    }
    if (decision === 'profile_unavailable') {
      toast.error('Could not confirm your face verification settings. Please retry.');
      return;
    }
    if (decision === 'verify_face') {
      comingFromUploadRef.current = true;
      setUploadModalAction('clockin');
      setShowUploadModal(true);
      return;
    }
    if (decision === 'clock_in') {
      await checkIn();
      setFaceAuthenticated(false);
    } else if (decision === 'clock_out') {
      await checkOut();
      setFaceAuthenticated(false);
    } else if (decision === 'no_action') {
      toast.error('Access Denied!');
    }
  }, [
    punchVerificationMode,
    faceAuthenticated,
    attendanceData.inTime,
    attendanceData.checkOutTime,
    checkIn,
    checkOut,
    permissions,
    authToken,

  ]);

  const confirmPunch = useCallback(async () => {
    if (punchConfirmationLock.current) return;
    punchConfirmationLock.current = true;
    setShowPunchConfirmation(false);
    try {
      await handleClockIn();
    } finally {
      punchConfirmationLock.current = false;
    }
  }, [handleClockIn]);

  const breakInAction = useCallback(async () => {
    try {
      await startTracking();
      setLoadingStates(prev => ({ ...prev, main: true }));

      let location;
      try {
        if (Platform.OS === 'ios') {
          location = IOSLocation;
        } else {
          location = await getSingleLocation();
        }
      } catch (error) {
        toast.error(
          'Unable to get your current location. Please try again or restart the app',
        );
        return;
      }

      if (!location?.latitude || !location?.longitude) {
        toast.error(
          'Unable to get your current location. Please try again or restart the app',
        );
        return;
      }

      const response = await breakInApi({
        type: 'Start_break',
        dateTime: new Date().toISOString(),
        latitude: location?.latitude,
        longitude: location?.longitude,
        userData: userdata,
      });

      setBreakData(prev => ({
        ...prev,
        formattedBreakTime: '',
        formattedBreakDuration: '',
        formattedEndBreakTime: '',
      }));

      if (response?.status) {
        toast.success(response.message);
      } else {
        toast.error(response?.message || 'Break in failed');
      }

      if (!attendanceUpdateLock.current) {
        fetchAttendanceRefetch();
      }
      fetchBreakRefetch();
    } catch (error) {
      toast.error(error.message || 'Failed to start break');
    } finally {
      setLoadingStates(prev => ({ ...prev, main: false }));
    }
  }, [userdata, getSingleLocation, IOSLocation]);

  const breakOutAction = useCallback(async () => {
    try {
      await startTracking();
      setLoadingStates(prev => ({ ...prev, main: true }));
      let location;
      try {
        if (Platform.OS === 'ios') {
          location = IOSLocation;
        } else {
          location = await getSingleLocation();
        }
      } catch (error) {
        toast.error(
          'Unable to get your current location. Please try again or restart the app',
        );
        return;
      }

      if (!location?.latitude || !location?.longitude) {
        toast.error(
          'Unable to get your current location. Please try again or restart the app',
        );
        return;
      }

      const response = await breakOutApi({
        type: 'End_break',
        dateTime: new Date().toISOString(),
        latitude: location?.latitude,
        longitude: location?.longitude,
        userData: userdata,
      });

      setBreakData({
        formattedBreakTime: '',
        formattedBreakDuration: '',
        formattedEndBreakTime: '',
      });

      if (response?.status) {
        toast.success(response.message || 'Break ended successfully');
      } else {
        toast.error(response?.message || 'Failed to end break');
      }

      await Promise.all([fetchBreakRefetch(), fetchAttendanceRefetch()]);
    } catch (error) {
      toast.error(error.message || 'Error ending break');
    } finally {
      setLoadingStates(prev => ({ ...prev, main: false }));
    }
  }, [userdata, getSingleLocation, IOSLocation]);

  const handleBreakIn = useCallback(() => {
    Vibration.vibrate(100);

    if (permissions?.block_break_in_out) {
      toast.info(TOAST_MESSAGES.block_break_in_out);
      return;
    }

    if (!attendanceData.inTime || attendanceData.checkOutTime) {
      toast.error('Please clock in first.');
      return;
    }

    if (!faceAuthenticated && GetEmployeesProfileData?.permission?.face_detection) {
      comingFromUploadRef.current = true;
      setUploadModalAction('break');
      setShowUploadModal(true);
    } else if (
      breakData.breakTime &&
      (breakData.endBreakTime === '00:00:00' || !breakData.endBreakTime)
    ) {
      breakOutAction();
      setFaceAuthenticated(false);
    } else if (breakData.endBreakTime || !breakData.breakTime) {
      breakInAction();
      setFaceAuthenticated(false);
    }
  }, [
    attendanceData.inTime,
    attendanceData.checkOutTime,
    breakData.breakTime,
    breakData.endBreakTime,
    faceAuthenticated,
    GetEmployeesProfileData?.permission?.face_detection,
    breakOutAction,
    breakInAction,
    permissions,
    authToken,
  ]);

  const handleClockInSuccess = useCallback(async () => {
    if (!attendanceData.inTime && !attendanceData.checkOutTime) {
      await checkIn();
      setFaceAuthenticated(false);
    }
    if (attendanceData.inTime && !attendanceData.checkOutTime) {
      await checkOut();
      setFaceAuthenticated(false);
    }
  }, [checkIn, checkOut, attendanceData]);

  const handleBreakSuccess = useCallback(async () => {
    if (
      breakData.breakTime &&
      (breakData.endBreakTime === '00:00:00' || !breakData.endBreakTime)
    ) {
      await breakOutAction();
    } else if (breakData.endBreakTime || !breakData.breakTime) {
      await breakInAction();
    }
    setFaceAuthenticated(false);
  }, [breakData, breakInAction, breakOutAction]);

  const handleModalClose = useCallback(() => {
    setShowUploadModal(false);
    setUploadModalAction(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    if (uploadModalAction === 'clockin') {
      handleClockInSuccess();
    } else if (uploadModalAction === 'break') {
      handleBreakSuccess();
    }
    setShowUploadModal(false);
    setUploadModalAction(null);
  }, [uploadModalAction, handleClockInSuccess, handleBreakSuccess]);

  const resetAttendanceAndBreakData = useCallback(() => {
    setAttendanceData({
      inTime: '',
      checkOutTime: '',
      duration: '',
      punchInTime: '',
      punchOutTime: '',
      totalHours: '',
      attendanceId: null,
    });

    setBreakData({
      breakTime: '',
      endBreakTime: '',
      breakDuration: '',
      formattedBreakTime: '',
      formattedEndBreakTime: '',
      formattedBreakDuration: '',
    });

    setUiState(prev => ({ ...prev, message: '' }));
  }, []);

  const handleReloadHome = useCallback(
    async (fullReload = false) => {
      if (loadingStates.reload) return;

      try {
        setLoadingStates(prev => ({ ...prev, reload: true }));
        if (fullReload) {
          resetAttendanceAndBreakData();
        }
        if (!attendanceUpdateLock.current) {
          fetchAttendanceRefetch();
        }
        fetchBreakRefetch();
        GetEmployeesProfileDataRefetch();
        queryClient.invalidateQueries({ queryKey: ['GetEmployeesProfile'] });
      } finally {
        setLoadingStates(prev => ({ ...prev, reload: false }));
      }
    },
    [loadingStates.reload],
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const { translationX } = event;

      if (translationX < -50 && isFront) {
        flipToFront();
      }
      else if (translationX > 50 && !isFront) {
        flipToBack();
      }
    })
    .runOnJS(true);

  const flipToFront = useCallback(() => {
    Animated.timing(rotateValue, {
      toValue: 180,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => setIsFront(false));
  }, [rotateValue]);

  const flipToBack = useCallback(() => {
    Animated.timing(rotateValue, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => setIsFront(true));
  }, [rotateValue]);

  const rotateY = rotateValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const frontOpacity = rotateValue.interpolate({
    inputRange: [0, 90],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const backOpacity = rotateValue.interpolate({
    inputRange: [90, 180],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderProfileSection = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProfileStack')}
        disabled={permissions?.hide_profile_tab == 1}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        <Image
          style={{ width: 40, height: 40, borderRadius: 20 }}
          source={{ uri: profileImageUri }}
          resizeMode={'cover'}
          onError={() => { }}
        />
        <View style={{ flex: 1 }}>
          <ThemedText size='md' weight='SemiBold' numberOfLines={1}>
            {capitalizeFirstLetter(
              StringLengthLimit(
                GetEmployeesProfileData?.data?.[0]?.full_name ||
                'Sysboat',
                18
              )
            )}
          </ThemedText>
          <ThemedText size='xs' weight='Regular' color='secondary' numberOfLines={1}>
            {capitalizeFirstLetter(
              StringLengthLimit(
                GetEmployeesProfileData?.data?.[0]?.official_email_id ||
                GetEmployeesProfileData?.data?.[0]?.email_id ||
                '--',
                28
              )
            )}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderActionButtons = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <TouchableOpacity
        disabled={loadingStates.reload}
        onPress={handleReloadHome}
        style={{ padding: 6, justifyContent: 'center', alignItems: 'center' }}>
        {loadingStates.reload ? (
          <ActivityIndicator color={'#CA282C'} size={18} />
        ) : (
          <ReloadIcon width={20} height={20} color={'#CA282C'} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('NotificationScreen')}
        style={{ padding: 6, justifyContent: 'center', alignItems: 'center' }}>
        <Notification2 width={22} height={22} color={'#CA282C'} />
        {isNotification && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E89C1E',
              position: 'absolute',
              top: 3,
              right: 3,
            }}
          />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderFrontCard = () => (
    <Animated.View
      style={{
        position: 'absolute',
        opacity: frontOpacity,
        zIndex: isFront ? 1 : 0,
      }}>
      <TouchableOpacity
        disabled={
          !punchAction ||
          attendanceData.duration !== '' ||
          uiState.blockPunchOut ||
          loadingStates.clockIn ||
          fetchAttendanceDataLoading ||
          profileDataLoadings ||
          profileDataLoading
        }
        onPress={() => setShowPunchConfirmation(true)}
        accessibilityRole="button"
        accessibilityLabel={
          punchAction === 'out'
            ? 'Punch out'
            : 'Punch in'
        }
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          gap: 8,
          opacity:
            attendanceData.duration !== '' || uiState.blockPunchOut ? 0.8 : 1,
        }}>
        <View style={styles.upperShadow}>
          <LinearGradient
            colors={['rgba(228,231,237,1)', 'rgba(255,255,255,1)']}
            style={[styles.shadow2]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            locations={[0.2, 0.6]}>
            {fetchAttendanceDataLoading || profileDataLoadings || profileDataLoading ? (
              <ActivityIndicator size={50} color={'#6A7D94'} />
            ) : (
              <>
                {loadingStates.clockIn ? (
                  <ActivityIndicator size={50} color={'#6A7D94'} />
                ) : (
                  <>
                    {attendanceData.inTime === '' &&
                      attendanceData.checkOutTime === '' && (
                        <>
                          <HandIcon width={34} height={52} color={'#CA282C'} />
                          <ThemedText size='sm' weight='SemiBold' style={{ marginTop: 8 }}>
                            Punch In
                          </ThemedText>
                        </>
                      )}
                    {attendanceData.inTime !== '' &&
                      attendanceData.checkOutTime === '' && (
                        <>
                          <HandIcon width={34} height={52} color={'#6FAB55'} />
                          <ThemedText size='sm' weight='SemiBold' style={{ marginTop: 8 }}>
                            Punch Out
                          </ThemedText>
                        </>
                      )}
                    {attendanceData.duration !== '' && (
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 5,
                        }}>
                        <DurationIcon color={'#CA282C'} width={45} height={45} />
                        <ThemedText size='sm' weight='SemiBold'>
                          {attendanceData.duration}
                        </ThemedText>
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </LinearGradient>

          <LinearGradient
            colors={['#F1F1F1', '#F1F1F1', '#EAEDF3']}
            style={[styles.background]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            locations={[0.2, 0.6]}
          />

          {Boolean(attendanceData.inTime) && fetchAttendanceDataLoading === false && (
            <CircularProgress
              message={message =>
                setUiState(prev => ({
                  ...prev,
                  message: message,
                }))
              }
              data={GetEmployeesProfileData}
              inTime={attendanceData.inTime}
              outTime={attendanceData.checkOutTime}
            />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBackCard = () => (
    <Animated.View
      style={{
        position: 'absolute',
        transform: [{ rotateY: '180deg' }],
        opacity: backOpacity,
        zIndex: !isFront ? 1 : 0,
      }}>
      <TouchableOpacity
        disabled={
          attendanceData.duration !== '' ||
          fetchBreakDetailsLoading ||
          profileDataLoadings ||
          profileDataLoading ||
          loadingStates.main
        }
        onLongPress={handleBreakIn}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          gap: 8,
          opacity: attendanceData.duration !== '' ? 0.8 : 1,
        }}>
        <View style={styles.upperShadow}>
          <LinearGradient
            colors={['rgba(228,231,237,1)', 'rgba(255,255,255,1)']}
            style={[styles.shadow2]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            locations={[0.2, 0.6]}
          >
            {fetchBreakDetailsLoading || profileDataLoadings || profileDataLoading || loadingStates.main ? (
              <ActivityIndicator size={50} color={'#6A7D94'} />
            ) : (
              <>
                {Boolean(breakData.endBreakTime) &&
                  breakData.endBreakTime !== '00:00:00' &&
                  (breakData.breakTime || breakData.breakTime === '') && (
                    <>
                      <Image
                        style={{ width: 60, height: 50, marginBottom: 8 }}
                        resizeMode={'center'}
                        source={breakInImage}
                      />
                      <ThemedText size='sm' weight='SemiBold'>
                        Take A Break
                      </ThemedText>
                    </>
                  )}
                {Boolean(breakData.breakTime) &&
                  breakData.breakTime !== '' &&
                  (breakData.endBreakTime === '' ||
                    breakData.endBreakTime === '00:00:00') && (
                    <>
                      <Image
                        style={{ width: 60, height: 50, marginBottom: 8 }}
                        resizeMode={'center'}
                        source={breakOutImage}
                      />
                      <ThemedText size='sm' weight='SemiBold'>
                        Back To Work
                      </ThemedText>

                    </>
                  )}
                {breakData.breakTime === '' && breakData.endBreakTime === '' && (
                  <>
                    <Image
                      style={{ width: 60, height: 50, marginBottom: 8 }}
                      resizeMode={'center'}
                      source={breakInImage}
                    />
                    <ThemedText size='sm' weight='SemiBold'>
                      Take A Break
                    </ThemedText>
                  </>
                )}
              </>
            )}
          </LinearGradient>
          <LinearGradient
            colors={['#F1F1F1', '#F1F1F1', '#EAEDF3']}
            style={[styles.background]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            locations={[0.2, 0.6]}
          />
          <CircularProgressBreak
            breakInTime={breakData.breakTime}
            breakOutTime={breakData.endBreakTime}
            data={GetEmployeesProfileData}
            message={message =>
              setUiState(prev => ({ ...prev, message: message }))
            }
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBottomStats = () => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        alignItems: 'flex-end',
        paddingBottom: 150,
      }}>
      {isFront ? (
        <View style={{ alignItems: 'center', }}>
          <PunchInIcon width={32} height={36} />
          <ThemedText size='sm' weight='SemiBold' style={{ marginTop: 8 }}>
            {attendanceData.punchInTime || '--*--'}
          </ThemedText>
          <ThemedText size='xs' color='secondary' weight='Regular'>
            Punch In
          </ThemedText>
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <PunchInIcon width={32} height={36} />
          <ThemedText size='sm' weight='SemiBold' style={{ marginTop: 8 }}>
            {breakData.formattedBreakTime || '--*--'}
          </ThemedText>
          <ThemedText size='xs' color='secondary' weight='Regular'>
            Break In
          </ThemedText>
        </View>
      )}

      {isFront ? (
        <View style={{ alignItems: 'center' }}>
          <PunchOutIcon width={32} height={36} />
          <ThemedText size='sm' weight='SemiBold' style={{ marginTop: 8 }}>
            {attendanceData.punchOutTime || '--*--'}
          </ThemedText>
          <ThemedText size='xs' color='secondary' weight='Regular'>
            Punch Out
          </ThemedText>
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <PunchOutIcon width={32} height={36} />
          <ThemedText size='sm' weight='SemiBold' style={{ marginTop: 8 }}>
            {breakData.formattedEndBreakTime || '--*--'}
          </ThemedText>
          <ThemedText size='xs' color='secondary' weight='Regular'>
            Break Out
          </ThemedText>
        </View>
      )}

      {isFront ? (
        <View style={{ alignItems: 'center' }}>
          <TotalHoursIcon width={32} height={36} />
          <ThemedText size='sm' weight='SemiBold' style={{ marginTop: 8 }}>
            {attendanceData.totalHours || '--*--'}
          </ThemedText>
          <ThemedText size='xs' color='secondary' weight='Regular'>
            Total Hours
          </ThemedText>
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <TotalHoursIcon width={32} height={36} />
          <ThemedText size='sm' weight='SemiBold' style={{ marginTop: 8 }}>
            {breakData.breakDuration || '--*--'}
          </ThemedText>
          <ThemedText size='xs' color='secondary' weight='Regular'>
            Total Hours
          </ThemedText>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>

      <MiniMapCard data={GetEmployeesProfileData} />

      {!attendanceData.punchInTime && (
        <NotificationHelper
          message={
            "You haven't clocked in yet! It's 9:30 AM, please clock in as soon as possible."
          }
        />
      )}

      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{ ...StyleSheet.absoluteFillObject, flex: 1 }}>
        <UploadScreen
          visible={showUploadModal}
          onClose={handleModalClose}
          onSuccessAction={handleModalSuccess}
          navigation={navigation}
        />

        {showPunchConfirmation && (
          <PunchConfirmationSheet
            visible
            onCancel={() => setShowPunchConfirmation(false)}
            action={punchAction}
            currentTime={moment().format('hh:mm A')}
            onConfirm={confirmPunch}
          />
        )}

        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingBottom: 0, gap: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: STATUS_BAR_HEIGHT(),
                paddingHorizontal: 15,
              }}>
              <Skeleton isLoading={profileDataLoadings || profileDataLoading} highlightColor={'#f5f5f5'} boneColor='#fff' animationType='pulse' layout={[
                { key: "Profile-2", width: 40, height: 40, marginBottom: 10, borderRadius: 120, },
              ]}>
                {renderProfileSection()}
              </Skeleton>
              <View>{renderActionButtons()}</View>
            </View>

            <View>
              <TimeAndDate />
            </View>

            <GestureHandlerRootView
              style={{
                flex: 1,
                position: 'relative',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <GestureDetector gesture={panGesture}>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Animated.View
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      flex: 1,
                      transform: [{ rotateY }],
                    }}>
                    {renderFrontCard()}
                    {renderBackCard()}
                  </Animated.View>

                  {Boolean(uiState.message) && (
                    <View
                      style={{
                        justifyContent: 'center',
                        paddingTop: 30,
                        width: '100%',
                        alignItems: 'center',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          backgroundColor: '#F7F7F7',
                          height: 50,
                          borderRadius: 50,
                          paddingHorizontal: 15,
                        }}>
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: '#E89C1E',
                            borderRadius: 10,
                          }}
                        />
                        <ThemedText size='xs' weight='Medium'>
                          Minimum half day time reached
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>
              </GestureDetector>
            </GestureHandlerRootView>

            {renderBottomStats()}
          </View>
        </View>
        {showCard && (
          <BirthdayWishCard
            employee={employee}
            visible={showCard}
            onClose={() => setShowCard(false)}
            onSendWish={(msg) => console.log('Wish sent:', msg)}
          />
        )}
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  background: {
    width: PixelRatio.roundToNearestPixel(180),
    height: PixelRatio.roundToNearestPixel(180),
    borderRadius: 200,
    position: 'absolute',
  },
  shadow2: {
    width: PixelRatio.roundToNearestPixel(157),
    height: PixelRatio.roundToNearestPixel(157),
    borderRadius: 100,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  innerShadow: {
    width: PixelRatio.roundToNearestPixel(179),
    height: PixelRatio.roundToNearestPixel(179),
    borderRadius: 500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 200,
    backgroundColor: '#fff',
    borderWidth: 10,
    borderColor: '#f0f0f0',
  },
  upperShadow: {
    width: PixelRatio.roundToNearestPixel(227),
    overflow: 'hidden',
    height: PixelRatio.roundToNearestPixel(227),
    backgroundColor: '#E2E6EA',
    borderRadius: 500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
    position: 'relative',
  },
});

export default HomeScreen;
