/* eslint-disable no-undef */
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn().mockResolvedValue(true),
  isVisible: jest.fn().mockResolvedValue(false),
  useHideAnimation: jest.fn().mockReturnValue({ container: {}, logo: {}, brand: {} }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => () => ({
  getToken: jest.fn().mockResolvedValue('test-token'),
  onMessage: jest.fn(),
  onNotificationOpenedApp: jest.fn(),
  getInitialNotification: jest.fn().mockResolvedValue(null),
  setBackgroundMessageHandler: jest.fn(),
  requestPermission: jest.fn().mockResolvedValue(1),
}));

jest.mock('@react-native-firebase/crashlytics', () => () => ({
  recordError: jest.fn(),
  log: jest.fn(),
}));

jest.mock('@react-native-firebase/perf', () => () => ({
  newTrace: jest.fn(),
}));

jest.mock('@notifee/react-native', () => {
  const notifeeMock = {
    displayNotification: jest.fn().mockResolvedValue('notification-id'),
    createChannel: jest.fn().mockResolvedValue('channel-id'),
    onForegroundEvent: jest.fn(),
    onBackgroundEvent: jest.fn(),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    setBadgeCount: jest.fn().mockResolvedValue(undefined),
  };
  return {
    __esModule: true,
    default: notifeeMock,
    ...notifeeMock,
    EventType: {
      DISMISSED: 0,
      PRESS: 1,
      ACTION_PRESS: 2,
      DELIVERED: 3,
      APP_BLOCKED: 4,
      CHANNEL_BLOCKED: 5,
      CHANNEL_GROUP_BLOCKED: 6,
      TRIGGER_NOTIFICATION_CREATED: 7,
    },
    AndroidImportance: {
      DEFAULT: 3,
      HIGH: 4,
    },
    AndroidColor: {
      RED: '#ff0000',
    },
  };
});

jest.mock('react-native-reanimated', () => {
  try {
    return require('react-native-reanimated/mock');
  } catch (e) {
    return {};
  }
});

jest.mock('@react-native-community/geolocation', () => ({
  addListener: jest.fn(),
  getCurrentPosition: jest.fn(),
  removeListeners: jest.fn(),
  requestAuthorization: jest.fn(),
  setConfiguration: jest.fn(),
  startObserving: jest.fn(),
  stopObserving: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
  addEventListener: jest.fn(),
}));

jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn().mockReturnValue('1.0'),
  getBuildNumber: jest.fn().mockReturnValue('1'),
}));

jest.mock('react-native-permissions', () => {
  try {
    return require('react-native-permissions/mock');
  } catch (e) {
    return {
      check: jest.fn().mockResolvedValue('granted'),
      request: jest.fn().mockResolvedValue('granted'),
      PERMISSIONS: {},
      RESULTS: {},
    };
  }
});

jest.mock('react-native-fs', () => ({
  mkdir: jest.fn(),
  moveFile: jest.fn(),
  copyFile: jest.fn(),
  unlink: jest.fn(),
  exists: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue(''),
  writeFile: jest.fn().mockResolvedValue(true),
  readDir: jest.fn().mockResolvedValue([]),
  MainBundlePath: 'test-path',
  CachesDirectoryPath: 'test-path',
  DocumentDirectoryPath: 'test-path',
  ExternalDirectoryPath: 'test-path',
  ExternalStorageDirectoryPath: 'test-path',
  TemporaryDirectoryPath: 'test-path',
  PicturesDirectoryPath: 'test-path',
  RNFSFileTypeRegular: 'regular',
}));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  save: jest.fn(),
  getPhotos: jest.fn().mockResolvedValue({ edges: [] }),
}));

jest.mock('@bam.tech/react-native-image-resizer', () => ({
  createResizedImage: jest.fn().mockResolvedValue({ uri: 'test-uri' }),
}));

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  isCancel: jest.fn(),
}));

jest.mock('@react-native-ml-kit/face-detection', () => ({
  detect: jest.fn().mockResolvedValue([]),
}));

jest.mock('@react-native-ml-kit/text-recognition', () => ({
  recognize: jest.fn().mockResolvedValue({ text: '' }),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn().mockResolvedValue('test-uri'),
}));

jest.mock('react-native-webview', () => 'WebView');
jest.mock('react-native-video', () => 'Video');
jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('react-native-camera-kit', () => ({
  Camera: 'Camera',
  CameraType: { Back: 'back', Front: 'front' },
}));
jest.mock('react-native-leaflet-view', () => ({
  LeafletView: 'LeafletView',
}));
jest.mock('@openspacelabs/react-native-zoomable-view', () => 'ReactNativeZoomableView');
jest.mock('@openspacelabs/react-native-zoomable-view/src/ReactNativeZoomableView', () => 'ReactNativeZoomableView');
jest.mock('react-native-share', () => ({
  open: jest.fn().mockResolvedValue(true),
}));
jest.mock('react-native-offline', () => ({
  NetworkProvider: ({ children }) => children,
  NetworkConsumer: ({ children }) => children({ isConnected: true }),
}));

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: {
      DocumentDir: 'test-doc-dir',
      CacheDir: 'test-cache-dir',
      MainBundleDir: 'test-bundle-dir',
    },
  },
}));

jest.mock('react-native-pdf', () => 'Pdf');
jest.mock('react-native-pdf-to-image', () => ({}));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-pager-view', () => 'PagerView');
jest.mock('react-native-background-actions', () => ({
  start: jest.fn(),
  stop: jest.fn(),
}));
jest.mock('react-native-background-timer', () => ({
  runBackgroundTimer: jest.fn(),
  stopBackgroundTimer: jest.fn(),
}));
jest.mock('react-native-get-location', () => ({
  getCurrentPosition: jest.fn(),
}));
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
}));
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));
jest.mock('react-native-udp', () => ({}));
jest.mock('react-native-svg', () => 'Svg');
jest.mock('react-native-progress', () => ({
  Bar: 'ProgressBar',
  Circle: 'ProgressCircle',
  Pie: 'ProgressPie',
  CircleSnail: 'ProgressCircleSnail',
}));
jest.mock('@react-native-masked-view/masked-view', () => 'MaskedView');
jest.mock('@react-native-vector-icons/common', () => ({}));
jest.mock('@react-native-vector-icons/fontawesome', () => 'Icon');
jest.mock('@react-native-vector-icons/fontawesome6', () => 'Icon');
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModal: 'BottomSheetModal',
  BottomSheetView: 'BottomSheetView',
  BottomSheetTextInput: 'BottomSheetTextInput',
  BottomSheetModalProvider: ({ children }) => children,
  default: 'BottomSheet',
}));

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
