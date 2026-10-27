import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidGroupAlertBehavior, AndroidImportance, AuthorizationStatus, EventType } from '@notifee/react-native';
import { currentAppState } from '../../Helper/Helper';
import { navigate } from '../../navigation/NavigationRef';

// Register background event handler at top level (MUST be outside any function)
notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
        // The actual navigation will be handled by getInitialNotification
    }
});

const CHANNEL_GROUPS = [
    { id: 'default', name: 'Default Group' },
    { id: 'missed_punch', name: 'Missed Punch Alerts' },
    { id: 'chat_message', name: 'Chat Messages' },
    { id: 'recent_posts', name: 'Recent Posts' },
    { id: 'warnings', name: 'Warning Notices' },
    { id: 'updates', name: 'System Updates' },
    { id: 'recent_notifications', name: 'General Notifications' },
];

const CHANNELS = {
    DEFAULT: {
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.DEFAULT,
        groupId: 'default',
        sound: 'noti'
    },
    MISSED_PUNCH: {
        id: 'missed_punch',
        name: 'Missed Punch Alerts',
        importance: AndroidImportance.HIGH,
        groupId: 'missed_punch',
        sound: 'noti'
    },
    CHAT_MESSAGE: {
        id: 'chat_message',
        name: 'Chat Messages',
        importance: AndroidImportance.HIGH,
        groupId: 'chat_message',
        sound: 'noti'
    },
    RECENT_POSTS: {
        id: 'recent_posts',
        name: 'Recent Posts',
        importance: AndroidImportance.DEFAULT,
        groupId: 'recent_posts',
        sound: 'noti'
    },
    WARNINGS: {
        id: 'warnings',
        name: 'Warning Notices',
        importance: AndroidImportance.HIGH,
        groupId: 'warnings',
        sound: 'noti'
    },
    UPDATES: {
        id: 'updates',
        name: 'System Updates',
        importance: AndroidImportance.LOW,
        groupId: 'updates',
        sound: 'noti'
    },
    NOTIFICATIONS: {
        id: 'recent_notifications',
        name: 'General Notifications',
        importance: AndroidImportance.DEFAULT,
        groupId: 'recent_notifications',
        sound: 'noti'
    }
};

function handleNavigation(data) {

    if (!data?.screen) {
        return;
    }

    switch (data.screen) {
        case 'ChatScreen':
            navigate('ChatScreen', { chatId: data?.chatId });
            break;

        case 'PostDetail':
            navigate('PostDetail', { postId: data?.postId });
            break;

        case 'PendingRequests':
            navigate('PendingRequests');
            break;

        // case 'AttendanceMain':
        //     navigate('AttendanceMain', { employeeId: data?.employeeId });
        //     break;

        // case 'AttendanceOverview':
        //     navigate('AttendanceMain', { employeeId: data?.employeeId });
        //     break;

        default:
            navigate('Home');
    }
}

export async function requestPermissions() {
    const firebaseStatus = await messaging().requestPermission();
    const notifeeStatus = await notifee.requestPermission();

    const granted =
        firebaseStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        firebaseStatus === messaging.AuthorizationStatus.PROVISIONAL;

    const notifeeGranted =
        notifeeStatus.authorizationStatus === AuthorizationStatus.AUTHORIZED;

    return granted && notifeeGranted;
}

// Handle foreground notification taps (when app is open)
export function handleNotifeeEvents() {
    return notifee.onForegroundEvent(({ type, detail }) => {

        if (type === EventType.PRESS) {
            const data = detail.notification?.data;
            handleNavigation(data);
        } else if (type === EventType.DELIVERED) {
        }
    });
}

export async function getFcmToken() {
    const token = await messaging().getToken();
    return token;
}

export async function createAllNotificationChannels() {
    try {
        for (const group of CHANNEL_GROUPS) {
            await notifee.createChannelGroup(group);
        }

        for (const config of Object.values(CHANNELS)) {
            try {
                await notifee.createChannel({
                    id: config.id,
                    name: config.name,
                    importance: config.importance,
                    vibration: true,
                    badge: true,
                    vibrationPattern: [300, 500],
                    groupId: config.groupId,
                    sound: config.sound,
                });
            } catch (error) {
            }
        }
    } catch (e) {
    }
}

export async function displayNotification(remoteMessage) {
    const title = remoteMessage.data?.title;
    const body = remoteMessage.data?.body;
    const type = remoteMessage.data?.type;

    if (!title || !body) {
        return;
    }

    const channelConfig = CHANNELS[type?.toUpperCase()] || CHANNELS.DEFAULT;
    const settings = await notifee.getNotificationSettings();

    if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
        await notifee.openNotificationSettings();
        return;
    }

    if (currentAppState() === 'active' && type === 'chat_message') {
        return;
    }

    await notifee.displayNotification({
        title: title,
        body: body,
        data: remoteMessage.data,
        android: {
            channelId: channelConfig.id,
            smallIcon: 'ic_launcher',
            pressAction: {
                id: 'default',
                launchActivity: 'default',
            },
            vibrationPattern: [300, 500],
            color: '#CA282C',
            groupId: channelConfig.groupId,
            timestamp: Date.now(),
            showTimestamp: true,
            sound: 'noti',
            groupSummary: true,
            groupAlertBehavior: AndroidGroupAlertBehavior.ALL
        },
    });
}

export function handleForegroundNotification() {
    return messaging().onMessage(async remoteMessage => {
        await displayNotification(remoteMessage);
    });
}

export function handleBackgroundNotificaiton() {
    return messaging().setBackgroundMessageHandler(async remoteMessage => {
        await displayNotification(remoteMessage);
    });
}

export function onTokenRefreshListener(callback) {
    return messaging().onTokenRefresh(token => {
        callback?.(token);
    });
}

// Handle notification taps when app is background or killed
export function handleNotificationOpenEvents() {

    // Handle Firebase: app opened from background state
    const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
        setTimeout(() => {
            handleNavigation(remoteMessage?.data);
        }, 300);
    });

    // Handle Firebase: app opened from killed/closed state
    messaging()
        .getInitialNotification()
        .then(remoteMessage => {
            if (remoteMessage) {
                setTimeout(() => {
                    handleNavigation(remoteMessage?.data);
                }, 500);
            }
        });

    // Handle Notifee: app opened from killed/closed state
    notifee.getInitialNotification().then(initialNotification => {
        if (initialNotification) {
            setTimeout(() => {
                handleNavigation(initialNotification.notification?.data);
            }, 500);
        }
    });

    return unsubscribeBackground;
}