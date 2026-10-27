import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  Pressable,
  Platform,
} from 'react-native';
import { LeafletView, LatLng, MapShapeType } from 'react-native-leaflet-view';
import { Cross, ExpandIcon, LocationIcon } from '../Helper/IconsLoad';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { SCREEN_WIDTH } from '@gorhom/bottom-sheet';
import { getFontSize, getSingleLocation, stopTracking, subscribeLocationUpdates, unsubscribeLocationUpdates } from '../Helper/Helper';
import { useLocation } from '../IOS/LocationModule';

const LEAFLET_HTML_SOURCE =
  Platform.OS === 'android'
    ? { uri: 'file:///android_asset/index.html' }
    : require('../../assets/leaflet/index.html');

const haversineDistance = (coord1: LatLng, coord2: LatLng) => {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
    Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const MiniMapCard = ({ data }: any) => {

  const { IOSLocation, loading, error, getLocation } = useLocation();


  useEffect(() => {
    getLocation();
  }, [getLocation]);


  const companyLatLong = {
    lat: data?.latitude,
    lng: data?.longitude,
  };
  const companyRadius = data?.radius ? data?.radius : 200;

  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [ShowMinimap, setShowMinimap] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS == 'android') {
      const subscribeLocationUpdates = async () => {
        const loc = await getSingleLocation();
        setCurrentLocation(loc);
        setLocationError(null);
        if (loc) {
          const d = haversineDistance(companyLatLong, loc);
          setDistance(d);
        }
      };
      subscribeLocationUpdates();
      setInterval(() => {
        subscribeLocationUpdates();
      }, 60000);

    } else {
      setCurrentLocation(IOSLocation)
      setLocationError(null);
      if (IOSLocation) {
        const d = haversineDistance(companyLatLong, IOSLocation);
        setDistance(d);
      }
    }

  }, []);

  const DEFAULT_COORDINATE: LatLng = useMemo(
    () => ({
      lat: currentLocation?.latitude || companyLatLong.lat,
      lng: currentLocation?.longitude || companyLatLong.lng,
    }),
    [currentLocation, companyLatLong],
  );


  const translateX = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      translateX.value = offsetX.value + event.translationX;
      translateY.value = offsetY.value + event.translationY;
    })
    .onEnd(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <>
      <Pressable
        onPress={() => setShowMinimap(!ShowMinimap)}
        style={{
          backgroundColor: 'white',
          position: 'absolute',
          zIndex: 999,
          padding: 10,
          right: 0,
          top: SCREEN_WIDTH / 2,
          borderTopLeftRadius: 50,
          borderBottomLeftRadius: 50,
        }}>
        {ShowMinimap ? <Cross /> : <LocationIcon />}
      </Pressable>

      <Modal
        visible={expanded}
        statusBarTranslucent={true}
        onRequestClose={() => setExpanded(false)}
        animationType="slide">
        <View style={styles.fullscreenContainer}>
          {DEFAULT_COORDINATE.lat && DEFAULT_COORDINATE.lng ? (
            <LeafletView
              mapCenterPosition={DEFAULT_COORDINATE}
              source={LEAFLET_HTML_SOURCE}
              zoom={16}
              mapMarkers={[
                {
                  id: 'me',
                  position: DEFAULT_COORDINATE,
                  icon: '👦🏻',
                  size: [25, 25],
                  title: 'You are here',
                },
                {
                  id: 'company',
                  position: companyLatLong,
                  icon: '🏢',
                  size: [30, 30],
                  title: 'Company Center',
                },
              ]}
              mapShapes={[
                {
                  shapeType: MapShapeType.CIRCLE,
                  color: 'rgba(255,0,0,0.3)',
                  center: companyLatLong,
                  radius: companyRadius,
                },
              ]}
            />
          ) : (
            <View style={styles.loadingFullscreen}>
              <Text style={styles.loadingText}>Loading map...</Text>
              {locationError && (
                <Text style={styles.errorText}>Error: {locationError}</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setExpanded(false)}>
            <Cross />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Mini Map */}
      {ShowMinimap && !expanded && (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[styles.stickyCard, animatedStyle, { top: SCREEN_WIDTH / 2 }]}>
            {currentLocation ? (
              <LeafletView
                mapCenterPosition={DEFAULT_COORDINATE}
                source={LEAFLET_HTML_SOURCE}
                zoom={17}
                mapMarkers={[
                  {
                    id: 'me',
                    position: DEFAULT_COORDINATE,
                    icon: '👦🏻',
                    size: [25, 25],
                    title: 'You are here',
                  },
                  {
                    id: 'company',
                    position: companyLatLong,
                    icon: '🏢',
                    size: [30, 30],
                    title: 'Company Center',
                  },
                ]}
                mapShapes={[
                  {
                    shapeType: MapShapeType.CIRCLE,
                    color: 'rgba(0,150,255,0.3)',
                    center: companyLatLong,
                    radius: companyRadius,
                  },
                ]}
              />
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Locating...</Text>
                {locationError && (
                  <Text style={styles.errorTextSmall}>
                    Error: {locationError}
                  </Text>
                )}
              </View>
            )}



            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => setExpanded(true)}>
              <ExpandIcon width={15} height={15} />
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  stickyCard: {
    position: 'absolute',
    right: 20,
    width: 120,
    height: 120,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    zIndex: 999,
  },
  expandBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#fcfcfcff',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  loadingFullscreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 12,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  errorTextSmall: {
    fontSize: 8,
    color: 'red',
    textAlign: 'center',
    marginTop: 4,
  },
  minimapStatus: {
    position: 'absolute',
    bottom: 28,
    left: 5,
    right: 5,
  },
  statusSmall: {
    fontSize: 9,
    color: '#333',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 25,
    zIndex: 999,
  },
});

export default MiniMapCard;
