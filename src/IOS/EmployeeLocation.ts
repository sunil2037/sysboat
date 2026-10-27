import { NativeModules, NativeEventEmitter } from 'react-native';

const { EmployeeLocationModule } = NativeModules;

const emitter = new NativeEventEmitter(EmployeeLocationModule);

export function requestLocationPermission() {
    EmployeeLocationModule.requestTrackingPermission();
    EmployeeLocationModule.requestPermission();
}

export function startLocationTracking() {
    EmployeeLocationModule.startTracking();
}


export function startLiveLocationTracking(minute: number) {
    EmployeeLocationModule.startLiveLocation(minute);
}

export function stopLiveLocationTracking() {
    EmployeeLocationModule.stopLiveLocation();
}

export function stopLocationTracking() {
    EmployeeLocationModule.stopTracking();
}

export function subscribeToLocationUpdates(
    callback: (location: any) => void
) {
    return emitter.addListener('locationUpdate', callback);
}

export function startEmployeeLocationTracking(
    userId: string,
    companyId: string,
    punchInTime: string,
    punchOutTime: string,
    companyLat: number,
    companyLon: number,
    radius: number,
    intervalMs: number
) {
    EmployeeLocationModule.startTracking(
        userId,
        companyId,
        punchInTime,
        punchOutTime,
        companyLat,
        companyLon,
        radius,
        intervalMs
    );
}

