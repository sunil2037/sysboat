import { Alert, Dimensions, PermissionsAndroid, StatusBar, NativeModules, NativeEventEmitter, Platform, AppState, PixelRatio } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import { storage } from '../hooks/useEncodedUserData';
import { useEffect, useState } from 'react';
import base64 from 'base-64';
import { startEmployeeLocationTracking, startLiveLocationTracking, stopLiveLocationTracking, stopLocationTracking } from '../IOS/EmployeeLocation';



const { LocationModule } = NativeModules;
const locationEmitter = new NativeEventEmitter(LocationModule);
let locationListener = null;

const cache = new Map();

export const COLORS = {
  primary: '#CA282C',
  text_primary: '#64748b',
  text_secondary: '#1e293b',
  warning: '#e9c200',
  background: '#F8F9FA',
  success: '#10AC84',
  white: '#fff',
  border: '#f0efef'
}

export const getFontSize = (num) => {
  if (cache.has(num)) return cache.get(num);

  const sizedFont = num / PixelRatio.getFontScale();
  cache.set(num, sizedFont);
  return sizedFont;
};


export const currentAppState = () => {
  let currentAppState = 'active';
  AppState.addEventListener('change', (nextState) => {
    currentAppState = nextState;
  });
  return currentAppState;
}

export const bottomHeight = () => {
  const inset = useSafeAreaInsets();
  if (Platform.OS == 'android') {
    return inset.bottom == 0 ? 30 : inset.bottom
  } else {
    return inset.bottom;
  }
}
export const STATUS_BAR_HEIGHT = () => {
  const inset = useSafeAreaInsets();
  if (Platform.OS == 'android') {
    return inset.top == 0 ? 30 : inset.top + 10
  } else {
    return inset.top;
  }
}

export const StringLengthLimit = (str, limit) => {
  if (str.length <= limit) {
    return str;
  }
  return str.substring(0, limit) + '...';
}


export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const result = (R * c).toFixed(2);
  return result < 1 ? `${result} m` : `${result} km`;
};

export const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D';

export const SCREEN_WIDTH = Dimensions.get('window').width;

export const BOTTOM_TAB_HEIGHT = 60;


export const normalizePath = async (path) => {
  if (path.startsWith('content://')) {
    const destPath = `${RNFS.TemporaryDirectoryPath}${Math.random().toString(36).substring(7)}.jpg`;
    await RNFS.copyFile(path, destPath);
    return `file://${destPath}`;
  }
  return path.startsWith('file://') ? path : `file://${path}`;


};


export const requestLocationPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const grantedForeground = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Access Required",
          message: "The app needs access to your location for tracking.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );


      if (grantedForeground === PermissionsAndroid.RESULTS.GRANTED) {
        if (Platform.Version >= 29) {
          const grantedBackground = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
          );


          if (grantedBackground === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
          } else {
            return false;
          }
        }
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  if (Platform.OS === 'ios') {
    try {
      const whenInUseStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

      if (whenInUseStatus === RESULTS.GRANTED) {
        const alwaysStatus = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);

        if (alwaysStatus === RESULTS.GRANTED) {
          return true;
        }

        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  return true;
};




export const startTracking = async () => {
  try {
    const punchIn = Date.now();
    const punchOut = punchIn + 8.5 * 60 * 60 * 1000;
    const companyLat = 28.6139;
    const companyLon = 77.2090;
    const radius = 100;
    const intervalMs = 60000;
    const token = await storage.getString('token');
    const saveData = JSON.parse(await storage.getString('data'));
    const saveDataWithoutParse = await storage.getString('data');

    const userID = String(saveData?.id);
    const companyID = String(saveData?.company_id);
    const userData = base64.encode(saveDataWithoutParse);


    if (!token || !userID || !companyID || !userData) {
      return;
    }

    if (Platform.OS == 'android') {
      await LocationModule.startTracking(
        userID,
        companyID,
        userData,
        token,
        punchIn,
        punchOut,
        companyLat,
        companyLon,
        radius,
        intervalMs,
      );
    } else {
      startEmployeeLocationTracking(
        userID,
        companyID,
        userData,
        token,
        punchIn,
        punchOut,
        companyLat,
        companyLon,
        radius,
        intervalMs
      );
      startLiveLocationTracking(4);
    }

  } catch (e) {
  }
};

export const subscribeLocationUpdates = (callback) => {
  unsubscribeLocationUpdates();
  locationListener = locationEmitter.addListener('locationUpdate', (location) => {
    if (callback) callback(location);
  });
};

export const unsubscribeLocationUpdates = () => {
  if (locationListener) {
    locationListener.remove();
    locationListener = null;
  }
};

export const stopTracking = async () => {
  try {
    if (Platform.OS == 'android') {
      const result = await LocationModule.stopTracking();
      locationEmitter.removeAllListeners('locationUpdate');
    } else {
      stopLocationTracking();
      stopLiveLocationTracking();
    }
  } catch (e) {
  }
};

export const getSingleLocation = async () => {
  try {
    if (Platform.OS == 'android') {
      const location = await LocationModule.getSingleLocation();
      return location;
    } else {
      return "location ios"
    }
  } catch (e) {
  }
};

export const getLastKnownLocation = async () => {
  try {
    if (Platform.OS == 'android') {
      const location = await LocationModule.getLastKnownLocationFromStorage();
      return location;
    } else {
      return "location ios"
    }
  } catch (e) {
  }
};


export const SystemOS = () => {
  if (Platform.OS == 'android') {
    return true;
  } else {
    return false;
  }
}



export const useDebounce = (value) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [value, 1000]);

  return debouncedValue;
}


export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};


export const TOAST_MESSAGES = {
  block_app: 'Your access to the app is currently blocked by the manager.',

  location_access: 'Location access is disabled. Please enable it to continue.',
  intervalMs: 'Location tracking interval is restricted by admin.',
  face_detection: 'Face detection feature is disabled by admin.',
  liveFaceDetection: 'Live face detection is turned off by manager.',
  branchSwitch: 'Branch switching is restricted by admin.',
  reload: 'Reload function is blocked by admin.',
  allow_relogin: 'Re-login option is disabled by the manager.',

  block_punch_in_out: 'Your attendance punch in/out is blocked by the manager.',
  block_break_in_out: 'Break in/out is disabled by the manager.',

  hide_attendance: 'Attendance module is hidden by admin.',
  hide_leaves: 'Leave management is hidden by admin.',
  hide_team: 'Team view is disabled by the manager.',
  hide_register_face: 'Face registration is disabled by admin.',
  hide_payroll: 'Payroll section is hidden by admin.',
  hide_holiday_calendar: 'Holiday calendar is hidden by admin.',
  hide_id_card: 'ID card access is disabled by admin.',
  hide_expenses: 'Expense module is hidden by admin.',
  hide_employees: 'Employees list is hidden by manager.',
  hide_chat: 'Chat feature is disabled by admin.',
  hide_permissions: 'Permission settings are restricted by admin.',

  block_get_approve_button: 'Attendance approval request button is blocked.',
  block_approve_button: 'Attendance approval action is disabled.',
  block_create_leave_button: 'Creating new leave is restricted by HR.',
  block_approve_leave: 'Leave approval is disabled by the manager.',
  block_reject_leave: 'Rejecting leaves is restricted by HR.',
  block_delete_leave: 'Deleting leaves is disabled by the manager.',
  block_create_holiday: 'Creating holidays is restricted by admin.',
  block_create_expense: 'Adding new expenses is disabled by admin.',
  block_edit_employee: 'Editing employee details is restricted.',
  block_edit_profile_button: 'Editing your profile is blocked by admin.',
  block_personal_info_edit: 'Editing personal information is restricted.',
  block_work_week_edit: 'Creating or editing work week is disabled.',
  block_document_upload: 'Document upload is blocked by admin.',
  hide_profile_tab: 'Profile tab is hidden by manager.',
  block_work_details_edit: 'Editing work details is restricted.',
  block_department_edit: 'Editing or adding departments is restricted.',
  block_subdepartment_eidt: 'Editing or adding sub-departments is restricted.',
};


export const shiftMonth = (month, year, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
};

export const formatDate = (date) => {
  if (!date) return '0000-00-00';

  const d = new Date(date);

  if (isNaN(d.getTime())) return '0000-00-00';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};


export const calculateDuration = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return "";

  const [inH, inM] = checkIn.split(":").map(Number);
  const [outH, outM] = checkOut.split(":").map(Number);

  let start = inH * 60 + inM;
  let end = outH * 60 + outM;

  if (end < start) {
    end += 24 * 60;
  }

  const totalMinutes = end - start;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours} hour ${minutes} minute`;
};

export const timeToDate = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;

  const [hours, minutes, seconds] = timeString.split(':');
  const d = new Date();
  d.setHours(parseInt(hours, 10));
  d.setMinutes(parseInt(minutes, 10));
  d.setSeconds(parseInt(seconds, 10) || 0);
  d.setMilliseconds(0);

  return d;
};