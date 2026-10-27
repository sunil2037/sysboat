// LocationModule.ts
import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

const LINKING_ERROR =
  'The package \'com.sysboat.name\' doesn\'t seem to be linked. Make sure: \n\n' +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const LocationModule = NativeModules.LocationModule
  ? NativeModules.LocationModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const eventEmitter = new NativeEventEmitter(LocationModule);

export default {
  startTracking: (options) => {
    return LocationModule.startTracking();
  },
  stopTracking: () => {
    return LocationModule.stopTracking();
  },
  getSingleLocation: () => {
    return LocationModule.getSingleLocation();
  },
  getLastKnownLocationFromStorage: () => {
    return LocationModule.getLastKnownLocationFromStorage();
  },
  onLocationUpdate: (callback) => {
    const subscription = eventEmitter.addListener('locationUpdate', callback);
    return () => subscription.remove();
  },
};
