import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useContext,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import base64 from 'base-64';
import useFaceGet from './useFaceGet';

import { storage } from '../hooks/useEncodedUserData';
import { useSocket } from '../Apis/Services/SocketContext';

const AuthContext = createContext();



export const AuthProvider = ({ children }) => {
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const reconnectSocket = socketContext?.reconnectSocket;

  const [permissions, setPermissions] = useState({});


  const [data, setData] = useState('');
  const [startLocationTracking, setStartLocationTracking] = useState('');

  const [authToken, setAuthToken] = useState(null);
  const [userType, setUserType] = useState('employee');
  const [loading, setLoading] = useState(true);

  const [userAuthData, setUserAuthData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([]);
  const [companyInTime, setCompanyInTime] = useState(null);
  const [companyOutTime, setCompanyOutTime] = useState(null);
  const [companyRadius, setCompanyRadius] = useState(100);
  const [companyHalfTime, setCompanyHalfTime] = useState(null);
  const [companyMaxTime, setCompanyMaxTime] = useState(null);
  const [companyLatLong, setCompanyLatLong] = useState([]);

  const [checkOutTimeAuth, setCheckOutTimeAuth] = useState(null);

  // AttendanceScreen Variables
  const [visible, setIsVisible] = useState(false);
  const [employeeIds, setEmployeeId] = useState('');
  const [attendanceId, setAttendanceId] = useState('');
  const [reload, setReload] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [attendanceReqId, setattendanceReqId] = useState('');
  const [type, setType] = useState('');
  const [pendingApproveType, setPendingApproveType] = useState('');
  const [preInTime, setPreInTime] = useState('');
  const [preOutTime, setPreOutTime] = useState('');
  const [requestDay, setrequestDay] = useState('');
  const [preMessage, setPreMessage] = useState('');
  const [viewApprovalData, setApprovalData] = useState([]);
  const [showApprovalDetails, setShowApprovalDetails] = useState(false);
  const [loadingView, setLoadingView] = useState(false);
  //session expired
  const [isSessionExpired, setisSessionExpired] = useState(false);
  //face data
  const [isFaceRegister, setIsFaceRegister] = useState(false);
  const [FacePath, setFacePath] = useState('');
  const [faceAuthenticated, setFaceAuthenticated] = useState(false);
  const [isCompanyEnableFaceDetection, setIsCompanyEnableFaceDetection] =
    useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileDataLoading, setProfileDataLoading] = useState(false);


  const [permissionGranted, setPermissionGranted] = useState(false);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const hasEmittedRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await storage.getString('token');
        const saveData = await storage.getString('data');


        if (!token || !saveData) {
          setLoading(false);
          setIsDataLoaded(true);
          setAuthToken(null);
          setUserAuthData(null);
          return;
        }

        const encodedData = base64.encode(saveData);
        const parsedData = JSON.parse(saveData);

        setData(encodedData);
        setAuthToken(token);
        setUserAuthData(parsedData);
        setIsDataLoaded(true);
        setLoading(false);

        hasEmittedRef.current = false;
      } catch (error) {
        setLoading(false);
        setIsDataLoaded(true);
        setAuthToken(null);
        setUserAuthData(null);
      }
    };
    checkToken();
  }, [refreshTrigger]);

  useEffect(() => {
    if (
      !socket ||
      !isDataLoaded ||
      !userAuthData?.id ||
      !userAuthData?.company_id ||
      !data
    ) {

      return;
    }


    const handleProfileResponse = (result) => {
      console.log('Received profileResponse:', result);
      setProfileData(result);
      setPermissions(result?.permission || {});
      setProfileDataLoading(false);
      hasEmittedRef.current = true;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    socket.on('profileResponse', handleProfileResponse);

    const emitData = () => {
      setProfileDataLoading(true);

      socket.emit('join', {
        userId: userAuthData.id,
        company_id: userAuthData.company_id,
      });

      setTimeout(() => {
        socket.emit('getProfile', {
          CheckId: '',
          folderName: 'EmployeesProfileImg',
          userData: data,
        });
      }, 300);

      // ✅ Timeout safeguard: stop loading if no response within 8 seconds
      retryTimeoutRef.current = setTimeout(() => {
        setProfileDataLoading(false); // ✅ Ensure it never stays true forever
      }, 8000);
    };

    if (socket.connected) {
      emitData();
    } else {
      const handleConnect = () => {
        emitData();
      };
      socket.once('connect', handleConnect);

      setTimeout(() => {
        if (!socket.connected) {
          socket.connect();
        }
      }, 2000);
    }

    return () => {
      socket.off('profileResponse', handleProfileResponse);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [socket, isDataLoaded, userAuthData?.id, userAuthData?.company_id, data]);

  const { GetFacialImage, error: error2 } = useFaceGet(
    authToken ? data : null,
    authToken ? authToken : null,
  );

  useEffect(() => {
    if (GetFacialImage?.image_path) {
      setIsFaceRegister(true);
      setFacePath(GetFacialImage?.image_path);
    }
    if (authToken && profileData?.data?.[0]?.type) {
      setUserType(profileData?.data[0]?.type);
      setCompanyInTime(profileData?.in_time);
      AsyncStorage.setItem('CompanyInTime', profileData?.in_time);
      setCompanyOutTime(profileData?.out_time);
      setCompanyRadius(
        profileData?.radius ? profileData?.radius : 200,
      );

      setCompanyHalfTime(profileData?.half_day_time);
      setCompanyMaxTime(profileData?.working_hours);
      setCompanyLatLong({
        lat: profileData?.latitude,
        lng: profileData?.longitude,
      });
      if (profileData?.permission?.face_detection) {
        setIsCompanyEnableFaceDetection(profileData?.permission?.face_detection);
      }
    }
    if (error2?.status == 401 || error2?.status == 403) {
      setisSessionExpired(true);
    } else {
      setisSessionExpired(false);
    }
  }, [authToken, profileData, GetFacialImage]);

  const refetchProfile = () => {
    if (!socket || !socket.connected || !data || !userAuthData?.id) {
      return;
    }

    setProfileDataLoading(true);

    socket.emit('getProfile', {
      CheckId: '',
      folderName: 'EmployeesProfileImg',
      userData: data,
    });
  };

  const reloadAuthData = () => {
    setRefreshTrigger(prev => prev + 1);

    if (reconnectSocket) {
      setTimeout(() => {
        reconnectSocket();
      }, 500);
    }
  };

  const value = useMemo(
    () => ({
      profileData,
      setAuthToken,
      setUserType,
      setCurrentLocation,
      setCheckOutTimeAuth,
      setIsFaceRegister,
      setFacePath,
      setFaceAuthenticated,
      setStartLocationTracking,
      setIsVisible,
      setAttendanceId,
      setEmployeeId,
      setReload,
      setRequestDate,
      setType,
      setattendanceReqId,
      setPendingApproveType,
      setPreInTime,
      setPreOutTime,
      setrequestDay,
      setPreMessage,
      setShowApprovalDetails,
      setApprovalData,
      setLoadingView,
      userAuthData,
      authToken,
      userType,
      loading,
      checkOutTimeAuth,
      currentLocation,
      companyInTime,
      companyOutTime,
      companyHalfTime,
      companyMaxTime,
      companyLatLong,
      companyRadius,
      visible,
      employeeIds,
      attendanceId,
      reload,
      requestDate,
      attendanceReqId,
      type,
      pendingApproveType,
      preInTime,
      preOutTime,
      preMessage,
      requestDay,
      showApprovalDetails,
      viewApprovalData,
      loadingView,
      isSessionExpired,
      isFaceRegister,
      FacePath,
      faceAuthenticated,
      isCompanyEnableFaceDetection,
      startLocationTracking,
      profileDataLoading,
      setPermissionGranted,
      permissionGranted,
      refetchProfile, // Add manual refetch function
      reloadAuthData, // Add reload function

      permissions
    }),
    [
      userAuthData,
      authToken,
      userType,
      loading,
      checkOutTimeAuth,
      currentLocation,
      companyInTime,
      companyOutTime,
      companyHalfTime,
      companyMaxTime,
      visible,
      employeeIds,
      attendanceId,
      reload,
      requestDate,
      attendanceReqId,
      type,
      pendingApproveType,
      preInTime,
      preOutTime,
      preMessage,
      requestDay,
      showApprovalDetails,
      viewApprovalData,
      loadingView,
      isSessionExpired,
      isFaceRegister,
      FacePath,
      faceAuthenticated,
      isCompanyEnableFaceDetection,
      startLocationTracking,
      profileData,
      profileDataLoading,
      permissionGranted,
      setPermissionGranted,
      permissions
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);