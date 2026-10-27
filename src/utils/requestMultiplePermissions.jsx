import { PermissionsAndroid, Platform } from 'react-native';

async function requestMultiplePermissions() {
  try {
    if (Platform.Version >= 33) {
      const notifGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      notificationsGranted =
        notifGranted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      notificationsGranted = true;
    }


    return (
      notificationsGranted
    );
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
}

export default requestMultiplePermissions;
