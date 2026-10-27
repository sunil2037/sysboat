import { useState, useCallback, useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useAuth } from '../Context/AuthContext';
import { requestLocationPermissions } from '../Helper/Helper';

/**
 * useLocation
 * - Returns: { location, loading, error, getLocation, startWatching, stopWatching }
 * - location is null until a valid coordinate object is set: { latitude, longitude, ... }
 */
export const useLocation = (opts = {}) => {
    const { permissionGranted: externalPermission } = useAuth();

    const {
        enableHighAccuracy = true,
        timeout = 15000,
        maximumAge = 10000,
    } = opts;

    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const watchIdRef = useRef(null);

    // const requestLocationPermission = useCallback(async () => {
    //     console.log("Im from here")
    //     try {
    //         if (Platform.OS === 'ios') {
    //             const status = await Geolocation.requestAuthorization('whenInUse');
    //             return status === 'granted';
    //         } else {
    //             const granted = await PermissionsAndroid.request(
    //                 PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    //                 {
    //                     title: 'Location Permission',
    //                     message: 'This app needs access to your location.',
    //                     buttonNeutral: 'Ask Me Later',
    //                     buttonNegative: 'Cancel',
    //                     buttonPositive: 'OK',
    //                 }
    //             );
    //             return granted === PermissionsAndroid.RESULTS.GRANTED;
    //         }
    //     } catch (err) {
    //         console.warn('requestLocationPermission error:', err);
    //         setError('Permission request failed.');
    //         return false;
    //     }
    // }, []);

    const getLocation = useCallback(
        async (forceRequestPermission = false) => {
            setLoading(true);
            setError('');

            try {
                let hasPermission = externalPermission === true;

                if (!hasPermission || forceRequestPermission) {
                    hasPermission = await requestLocationPermissions();
                }

                if (!hasPermission) {
                    setError('Location permission not granted.');
                    setLoading(false);
                    return null;
                }

                Geolocation.getCurrentPosition(
                    (pos) => {
                        if (pos && pos.coords) {
                            setLocation(pos.coords);
                        }
                        setLoading(false);
                    },
                    (err) => {
                        console.warn('Geolocation.getCurrentPosition error:', err);
                        setError(err?.message || 'Failed to get location.');
                        setLoading(false);
                    },
                    { enableHighAccuracy, timeout, maximumAge }
                );
            } catch (err) {
                console.warn('getLocation unexpected error:', err);
                setError('An unexpected error occurred while getting location.');
                setLoading(false);
            }
        },
        [externalPermission, requestLocationPermissions, enableHighAccuracy, timeout, maximumAge]
    );

    const startWatching = useCallback(
        async (watchOptions = {}) => {
            const hasPermission =
                externalPermission === true || (await requestLocationPermissions());
            if (!hasPermission) {
                setError('Location permission not granted.');
                return;
            }

            if (watchIdRef.current !== null) {
                return watchIdRef.current;
            }

            const id = Geolocation.watchPosition(
                (pos) => {
                    if (pos && pos.coords) {
                        setLocation(pos.coords);
                    }
                },
                (err) => {
                    console.warn('Geolocation.watchPosition error:', err);
                    setError(err?.message || 'Failed to watch location.');
                },
                {
                    enableHighAccuracy,
                    distanceFilter: watchOptions.distanceFilter ?? 0,
                    interval: watchOptions.interval ?? 5000,
                    fastestInterval: watchOptions.fastestInterval ?? 2000,
                    showLocationDialog: true,
                }
            );

            watchIdRef.current = id;
            return id;
        },
        [externalPermission, requestLocationPermissions, enableHighAccuracy]
    );

    const stopWatching = useCallback(() => {
        if (watchIdRef.current != null) {
            Geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (externalPermission === true) {
            getLocation();
        }
    }, [externalPermission, getLocation]);

    useEffect(() => {
        return () => {
            stopWatching();
        };
    }, [stopWatching]);

    return {
        IOSLocation: location,
        loading,
        error,
        getLocation,
        startWatching,
        stopWatching,
    };
};
