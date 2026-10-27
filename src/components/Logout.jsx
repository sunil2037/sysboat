import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../Context/AuthContext';
import { ToastAndroid } from 'react-native';
import useEncodedUserData, { storage } from '../hooks/useEncodedUserData';
import messaging from '@react-native-firebase/messaging';
import { useCallback } from 'react';
import { useSocket } from '../Apis/Services/SocketContext';
import { stopTracking } from '../Helper/Helper';
import crashlytics from '@react-native-firebase/crashlytics';


export function useLogout() {
  const { setAuthToken } = useAuth();
  const navigation = useNavigation();
  const { userdata } = useEncodedUserData();
  const { disconnectSocket } = useSocket();
  // const { FCMUPdate } = useApi();

  // const { mutate } = useMutation({
  //   mutationFn: async () => {
  //     return FCMUPdate({ userData: userdata, fcm: '' });
  //   },
  //   onSuccess: res => console.log('FCM update success:', res),
  //   onError: err => console.log('FCM update error:', err),
  // });

  const logout = useCallback(async () => {
    try {
      // mutate();
      try {
        await messaging().deleteToken();
      } catch (e) {
        console.warn('FCM deleteToken failed', e);
      }
      disconnectSocket();
      await AsyncStorage.multiRemove(['token', 'type']);
      setAuthToken(null);
      await storage.clearAll();
      await stopTracking();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Signin' }],
      });

      ToastAndroid.showWithGravity(
        'Your session has expired. Please log back in to continue',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      crashlytics().log('Logout successfully.');
      return false;
    } catch (error) {
      crashlytics().recordError(error);
      return false
    }
  }, [userdata, setAuthToken]);

  return logout;
}
