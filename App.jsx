import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Text,
  StatusBar,
  AppState,
  Platform,
  ActivityIndicator,
  View,
  PermissionsAndroid
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BootSplash from 'react-native-bootsplash';
import {
  useFocusEffect,
  useIsFocused,
} from '@react-navigation/native';
import HomeScreen from './src/screens/HomeScreen';
import SigninScreen from './src/screens/Signin';
import SignupScreen from './src/screens/Signup';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import Profile from './src/screens/Profile';
import EditProfile from './src/components/Profile/Personal/EditProfile';
import BottomNavigation from './src/navigation/BottomNavigation';
import History from './src/screens/History';
import Dashboard from './src/screens/Dashboard';
import LeaveScreen from './src/screens/LeaveScreen';
import { NavigationRef, getCurrentRouteName } from './src/navigation/NavigationRef';
import CreateLeave from './src/components/Leave/CreateLeave';
import { AttendanceScreen } from './src/screens/AttendanceScreen';
import HolidayScreen from './src/screens/HolidayScreen';
import AttendanceDetails from './src/components/Attendance/AttendanceDetails';
import { useAuth } from './src/Context/AuthContext';
import { AttendanceMain } from './src/components/Attendance/AttendanceMain';
import TeamScreen from './src/screens/TeamScreen';
import ProfileView from './src/components/Profile/Personal/ProfileView';
import EditPersonalDetails from './src/components/Profile/Personal/EditPersonalDetails';
import WorkView from './src/components/Profile/Work/WorkView';
import WorkWeekView from './src/components/Profile/WorkWeek/WorkWeekView';
import WorkWeekViewUserSide from './src/components/Profile/WorkWeek/WorkWeekViewUserSide';
import PayrollScreen from './src/screens/PayrollScreen';
import { NetworkProvider } from 'react-native-offline';
import InternetStatus from './src/Helper/InternetStatus';
import VisitingIdScreen from './src/screens/VisitingIdScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import ChatScreen from './src/screens/ChatScreen';
import ChatMessage from './src/components/Chat/ChatMessage';
import BreakLogs from './src/components/Attendance/BreakLogs';
import UploadScreen from './src/screens/UploadScreen';
import AttendanceOverview from './src/components/Attendance/AttendanceOverview';
import SessionExpired from './src/Helper/SessionExpired';
import MapBox from './src/utils/MapBox';
import NotificationScreen from './src/screens/NotificationScreen';
import ToastManager from './src/Helper/ToastManager';
import Employees from './src/screens/Employees';
import EmployeesView from './src/components/Employees/EmployeesView';
import Designations from './src/components/Employees/Parts/Designations';
import EmployeeEdit from './src/components/Employees/EmployeeEdit';
import PartsCrud from './src/components/Employees/Parts/PartsCrud';
import Department from './src/components/Employees/Parts/Department';
import SubDepartment from './src/components/Employees/Parts/SubDepartment';
import PermissionScreen from './src/screens/PermissionScreen';
import useEncodedUserData, { storage } from './src/hooks/useEncodedUserData';
import ExpensesScreen from './src/screens/ExpensesScreen';
import { requestLocationPermissions, stopTracking } from './src/Helper/Helper';
import PendingRequests from './src/components/Attendance/PendingRequests';
import { checkAndStartImmediateUpdate } from './src/utils/UpdateService';
import LocationPermissionScreen from './src/screens/LocationPermissionScreen';
import {
  requestPermissions,
  getFcmToken,
  createAllNotificationChannels,
  handleForegroundNotification,
  handleNotificationOpenEvents,
  onTokenRefreshListener,
  handleBackgroundNotificaiton,
  handleNotifeeEvents,
} from './src/components/Notification/NotifService';
import GroupChat from './src/components/Chat/GroupChat';
import ProfileDetailsScreen from './src/components/Chat/ProfileDetailsScreen';
import useApi from './src/Apis/Services/ApiConfig';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import FaceRecognitionScreen from './src/components/FaceAuthenticate/FaceRecognitionScreen';
import BlockedScreen from './src/screens/BlockedScreen';
import AttendanceSingleDetails from './src/components/Attendance/AttendanceSingleDetails';
import HRAttendance from './src/screens/HRAttendance/HRAttendance';
import PasswordUpdateScreen from './src/screens/PasswordUpdateScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();

const UnmountOnBlur = React.memo(({ children }) => {
  const isFocused = useIsFocused();
  return isFocused ? children : null;
});

const ProfileStackScreen = React.memo(() => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={Profile} />
  </ProfileStack.Navigator>
));

const TabNavigator = React.memo(({ hide_profile_tab }) => (
  <Tab.Navigator
    detachInactiveScreens
    screenOptions={{ headerShown: false }}
    tabBar={props => <BottomNavigation hide_profile_tab={hide_profile_tab} {...props} />}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="History" component={History} />
    <Tab.Screen
      name="Dashboard"
      component={(props) => <UnmountOnBlur><Dashboard {...props} /></UnmountOnBlur>}
    />
    <Tab.Screen name="ProfileStack" component={ProfileStackScreen} />
  </Tab.Navigator>
));

const COMMON_SCREENS = [
  { name: 'LeaveScreen', component: LeaveScreen },
  { name: 'FaceRecognitionScreen', component: FaceRecognitionScreen },
  { name: 'CreateLeave', component: CreateLeave },
  { name: 'EditProfile', component: EditProfile },
  { name: 'HolidayScreen', component: HolidayScreen },
  { name: 'AttendanceDetails', component: AttendanceDetails },
  { name: 'AttendanceOverview', component: AttendanceOverview },
  { name: 'AttendanceMain', component: AttendanceMain },
  { name: 'PendingRequests', component: PendingRequests },
  { name: 'ProfileView', component: ProfileView },
  { name: 'EditPersonalDetails', component: EditPersonalDetails },
  { name: 'WorkView', component: WorkView },
  { name: 'PayrollScreen', component: PayrollScreen },
  { name: 'VisitingIdScreen', component: VisitingIdScreen },
  { name: 'DocumentsScreen', component: DocumentsScreen },
  { name: 'ChatScreen', component: ChatScreen },
  { name: 'ChatMessage', component: ChatMessage },
  { name: 'GroupChat', component: GroupChat },
  { name: 'AttendanceSingleDetails', component: AttendanceSingleDetails },
  { name: 'HRAttendance', component: HRAttendance },
  { name: 'ProfileDetailsScreen', component: ProfileDetailsScreen },
  { name: 'AttendanceScreen', component: AttendanceScreen },
  { name: 'BreakLogsScreen', component: BreakLogs },
  { name: 'EmployeeLocator', component: MapBox },
  { name: 'UploadScreen', component: UploadScreen },
  { name: 'NotificationScreen', component: NotificationScreen },
  { name: 'Employees', component: Employees },
  { name: 'EmployeesView', component: EmployeesView },
  { name: 'EmployeesEdit', component: EmployeeEdit },
  { name: 'PartsCrud', component: PartsCrud },
  { name: 'Designations', component: Designations },
  { name: 'Department', component: Department },
  { name: 'SubDepartment', component: SubDepartment },
  { name: 'ExpensesScreen', component: ExpensesScreen },
  { name: 'Permission', component: PermissionScreen },
  { name: 'TeamScreen', component: TeamScreen },
];

const ADMIN_USER_TYPES = ['admin', 'ceo', 'hr', 'company_admin'];

const LoadingScreen = ({ message = 'Loading...' }) => (
  <>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#CA282C" />
      <Text style={{ marginTop: 10, fontFamily: 'Poppins-Medium', color: '#CA282C' }}>
        {message}
      </Text>
    </View>
    <InternetStatus />

  </>
);

const App = ({ onStateChange }) => {
  const queryClient = useQueryClient();
  const { userdata } = useEncodedUserData();
  const { FCMUPdate } = useApi();

  const isInitialized = useRef(false);
  const wasInBackground = useRef(false);
  const permissionCheckTimeout = useRef(null);

  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    setAuthToken,
    authToken,
    userType,
    isSessionExpired,
    setPermissionGranted,
    profileData,
    permissions,
  } = useAuth();
  const currentRouteName = getCurrentRouteName();

  const hasPermissionsLoaded =
    currentRouteName !== 'Signin' &&
    currentRouteName !== 'ForgotPasswordScreen' &&
    authToken &&
    (!permissions || Object.keys(permissions).length === 0);



  const { mutate: updateFCMToken } = useMutation({
    mutationFn: newToken =>
      FCMUPdate({
        userData: userdata,
        fcm: newToken,
      }),
    onSuccess: response => {
      console.log('FCM token updated successfully');
    },
    onError: error => {
      console.error('FCM token update failed:', error);
    },
  });

  const checkPermissionsOnly = useCallback(async () => {
    try {
      if (Platform.OS !== 'android') return true;

      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      );

      setPermissionStatus(granted);
      setPermissionGranted(granted);

      if (!granted) {
        await stopTracking();
      }

      return granted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }, [setPermissionGranted]);



  const handlePermissionUpdate = useCallback(async (fromScreen = false) => {
    if (permissionCheckTimeout.current) {
      clearTimeout(permissionCheckTimeout.current);
    }

    if (fromScreen) {
      permissionCheckTimeout.current = setTimeout(async () => {
        const recheckStatus = await checkPermissionsOnly();
      }, 1000);
    }
  }, [checkPermissionsOnly]);

  useEffect(() => {
    const init = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        const token = await storage.getString('token');
        if (token) {
          setAuthToken(token);
          await checkPermissionsOnly();
          checkAndStartImmediateUpdate();
        }
      } catch (e) {
        setError('Failed to initialize app');
        await stopTracking();
      } finally {
        await BootSplash.hide({ fade: true });
        setIsLoading(false);
      }
    };
    setTimeout(() => {
      init();
    }, 1000);
  }, [checkPermissionsOnly, setAuthToken]);

  useEffect(() => {
    if (profileData?.reload) {
      queryClient.invalidateQueries({ queryKey: ['fetchAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['GetEmployeesProfile'] });
    }
  }, [profileData?.reload, queryClient]);

  useEffect(() => {
    if (!onStateChange) return;

    const wrappedStateChange = async () => {
      let currentRoute = getCurrentRouteName();
      if (currentRoute && authToken) {
        await checkPermissionsOnly();
      }
    };

    onStateChange.current = wrappedStateChange;
  }, [onStateChange, authToken, checkPermissionsOnly]);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        await requestPermissions();
        await createAllNotificationChannels();
        await getFcmToken();
        handleNotifeeEvents();
        handleNotificationOpenEvents();
        handleBackgroundNotificaiton();
      } catch (err) {
        console.error('Error in initNotifications:', err);
      }
    };

    if (authToken) {
      initNotifications();
    }

    const unsubscribe = handleForegroundNotification();
    return () => unsubscribe?.();
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;

    const unsubscribeRefresh = onTokenRefreshListener(newToken => {
      if (newToken) {
        updateFCMToken(newToken);
      }
    });

    return () => {
      if (typeof unsubscribeRefresh === 'function') {
        unsubscribeRefresh();
      } else if (unsubscribeRefresh?.unsubscribe) {
        unsubscribeRefresh.unsubscribe();
      }
    };
  }, [authToken, updateFCMToken]);

  useEffect(() => {
    const handleRefreshToken = async () => {
      try {
        const fcmToken = await getFcmToken();
        if (fcmToken) {
          updateFCMToken(fcmToken);
        }
      } catch (err) {
        console.error('Error refreshing FCM token:', err);
      }
    };

    if (authToken) {
      handleRefreshToken();
    }
  }, [authToken, updateFCMToken]);

  useEffect(() => {
    const runPostLoginTasks = async () => {
      if (authToken) {
        await checkPermissionsOnly();
        checkAndStartImmediateUpdate();
      }
    };

    runPostLoginTasks();
  }, [authToken, checkPermissionsOnly]);

  useFocusEffect(
    useCallback(() => {
      const checkOnFocus = async () => {
        if (
          currentRouteName !== 'Signin' &&
          currentRouteName !== 'ForgotPasswordScreen' &&
          authToken
        ) {
          await checkPermissionsOnly();
        }
      };

      checkOnFocus();
    }, [checkPermissionsOnly, currentRouteName, authToken])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state === 'background') {
        wasInBackground.current = true;
      }

      if (state === 'active' && wasInBackground.current) {
        wasInBackground.current = false;

        if (authToken) {
          await checkPermissionsOnly();

          setTimeout(async () => {
            await checkPermissionsOnly();
          }, 500);
        }
      }
    });

    return () => {
      sub.remove();
      if (permissionCheckTimeout.current) {
        clearTimeout(permissionCheckTimeout.current);
      }
    };
  }, [authToken, checkPermissionsOnly]);


  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <Text style={{ padding: 20, textAlign: 'center' }}>{error}</Text>;
  }

  if (permissionGranted === false && Platform.OS === 'android' && authToken && !permissions?.block_app && permissions?.location_access) {
    return <LocationPermissionScreen onPermissionUpdate={() => handlePermissionUpdate(true)} />;
  }

  if (hasPermissionsLoaded) {
    return <LoadingScreen message="Loading permissions..." />;
  }

  const initialRoute = authToken ? 'Main' : 'Signin';

  return (
    <NetworkProvider>
      <ToastManager />

      <StatusBar backgroundColor="transparent" translucent />

      {permissions?.block_app ? (
        <BlockedScreen />
      ) : (
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}>
          {authToken ? (
            <>
              <Stack.Screen name="Main">
                {() => <TabNavigator hide_profile_tab={permissions?.hide_profile_tab} />}
              </Stack.Screen>

              {COMMON_SCREENS.map(screen => (
                <Stack.Screen
                  key={screen.name}
                  name={screen.name}
                  component={screen.component}
                />
              ))}

              {ADMIN_USER_TYPES.includes(userType) ? (
                <Stack.Screen name="WorkWeekView" component={WorkWeekView} />
              ) : (
                <Stack.Screen name="WorkWeekViewUserSide" component={WorkWeekViewUserSide} />
              )}
            </>
          ) : (
            <>
              <Stack.Screen name="Signin" component={SigninScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          )}
        </Stack.Navigator>
      )}

      <InternetStatus />
      {(permissions?.forcePasswordUpdate && !isSessionExpired && authToken && !hasPermissionsLoaded) && <PasswordUpdateScreen />}
      {isSessionExpired && <SessionExpired visible={true} />}
    </NetworkProvider>
  );
};

export default App;