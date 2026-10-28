/**
 * @format
 */

import 'react-native-gesture-handler';

import { AppRegistry, Text, TextInput } from 'react-native';

// Stop system text scaling app-wide
if (Text.defaultProps == null) {
    Text.defaultProps = {};
}
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) {
    TextInput.defaultProps = {};
}
TextInput.defaultProps.allowFontScaling = false;
import { name as appName } from './app.json';
import MainApp from './src/Context/MainApp';
import messaging from '@react-native-firebase/messaging';
import { displayNotification } from './src/components/Notification/NotifService';

messaging().setBackgroundMessageHandler(async remoteMessage => {
    await displayNotification(remoteMessage);
});


AppRegistry.registerComponent(appName, () => MainApp);
