/**
 * @format
 */

import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import MainApp from './src/Context/MainApp';
import messaging from '@react-native-firebase/messaging';
import { displayNotification } from './src/components/Notification/NotifService';

messaging().setBackgroundMessageHandler(async remoteMessage => {
    await displayNotification(remoteMessage);
});


AppRegistry.registerComponent(appName, () => MainApp);
