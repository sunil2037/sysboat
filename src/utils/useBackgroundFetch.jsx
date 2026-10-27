// // useBackgroundFetch.js
// import {useCallback, useEffect, useRef} from 'react';
// import BackgroundFetch from 'react-native-background-fetch';
// import {NativeModules} from 'react-native';

// export default function useBackgroundFetch(
//   startLocationTracking,
//   checkOutTimeAuth,
//   requestMultiplePermissions,
// ) {
//   const hasStarted = useRef(false);

//   const initBackgroundFetch = useCallback(async () => {
//     const hasPermission = await requestMultiplePermissions();
//     if (!hasPermission) return;

//     if (startLocationTracking) {
//       const onEvent = async taskId => {
//         console.log('[BackgroundFetch] task: ', taskId);
//         BackgroundFetch.finish(taskId);
//       };

//       const onTimeout = async taskId => {
//         console.log('[BackgroundFetch] TIMEOUT task: ', taskId);
//         BackgroundFetch.finish(taskId);
//       };

//       const status = await BackgroundFetch.configure(
//         {
//           minimumFetchInterval: 15,
//           stopOnTerminate: false,
//           startOnBoot: true,
//           enableHeadless: true,
//           forceAlarmManager: false,
//           requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
//           requiresCharging: false,
//           requiresDeviceIdle: false,
//           requiresBatteryNotLow: false,
//           requiresStorageNotLow: false,
//         },
//         onEvent,
//         onTimeout,
//       );

//       await BackgroundFetch.scheduleTask({
//         taskId: 'com.sysboat.fetch',
//         delay: 1000,
//         periodic: true,
//         forceAlarmManager: true,
//         stopOnTerminate: false,
//         enableHeadless: true,
//       });

//       console.log('[BackgroundFetch] configure status: ', status);
//     } else if (checkOutTimeAuth && !startLocationTracking) {
//       try {
//         await BackgroundFetch.stop('com.sysboat.fetch');
//         await stopCurrentLocation();
//         console.log('stoppped');
//       } catch (error) {
//         console.log('Error in clock out:', error);
//       }
//     }
//   }, [startLocationTracking, checkOutTimeAuth, requestMultiplePermissions]);

//   useEffect(() => {
//     initBackgroundFetch();
//     if (hasStarted.current || !startLocationTracking) return;

//     hasStarted.current = true;

//     const timer = setTimeout(() => {
//       initBackgroundFetch();
//     }, 10000);

//     return () => clearTimeout(timer);
//   }, [initBackgroundFetch, startLocationTracking]);
// }
