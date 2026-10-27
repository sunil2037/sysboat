import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  NativeModules,
  View,
  Text,
  FlatList,
} from 'react-native';
import { LatLng, LeafletView } from 'react-native-leaflet-view';
import { API_BASE_URL, API_BASE_URL2 } from '../Apis/Services/ServerURL';
import { io } from 'socket.io-client';
import { useAuth } from '../Context/AuthContext';
import useApi from '../Apis/Services/ApiConfig';
import { useQuery } from '@tanstack/react-query';
import useEncodedUserData from '../hooks/useEncodedUserData';
import BottomSheetMapBox from '../Helper/BottomSheetMapBox';
import { FilterIcon } from '../Helper/IconsLoad';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bottomHeight, getFontSize, getSingleLocation, STATUS_BAR_HEIGHT, subscribeLocationUpdates } from '../Helper/Helper';
import { useLocation } from '../IOS/LocationModule';
import TopNavBar from '../navigation/TopNavBar';

// Move this outside the component or memoize it
interface LocationData {
  employee_id: any;
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  profile_image: string;
}

interface Locations {
  data: {
    [employee_id: string]: LocationData;
  };
}

const DEFAULT_MAP_LAYERS = [
  // Standard OpenStreetMap variants
  {
    baseLayerIsChecked: true,
    baseLayerName: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  {
    baseLayerName: 'OpenStreetMap HOT',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  },
  {
    baseLayerName: 'OpenStreetMap DE',
    url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
  },
  {
    baseLayerName: 'OpenStreetMap France',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
  },

  // CyclOSM (cycling oriented)
  {
    baseLayerName: 'CyclOSM',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
  },

  // Humanitarian style
  {
    baseLayerName: 'Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  },

  // Satellite/Imagery
  {
    baseLayerName: 'ESRI World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  {
    baseLayerName: 'USGS Topo',
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
  },

  // Minimalist/lightweight options
  {
    baseLayerName: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  },
  {
    baseLayerName: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  },

  // Terrain/topographic
  {
    baseLayerName: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  },
  {
    baseLayerName: 'Stamen Terrain',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
  },
];

const MAP_THEMES = [
  {
    id: '1',
    name: 'Standard',
    layer: {
      baseLayerIsChecked: true,
      baseLayerName: 'OpenStreetMap Standard',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    },
  },
  {
    id: '2',
    name: 'Dark',
    layer: {
      baseLayerName: 'CartoDB Dark',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    },
  },
  {
    id: '3',
    name: 'Satellite',
    layer: {
      baseLayerName: 'ESRI Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    },
  },
  {
    id: '4',
    name: 'Terrain',
    layer: {
      baseLayerName: 'OpenTopoMap',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    },
  },
];
const LEAFLET_HTML_SOURCE = Platform.select({
  android: { uri: 'file:///android_asset/index.html' },
});

const MapBox = ({ navigation }) => {
  const { IOSLocation, loading, error, getLocation } = useLocation();



  const socket = useMemo(() => io(API_BASE_URL, {
    transports: ["websocket"],
    reconnection: true,
  }), []);

  const [locations, setLocations] = useState<Record<string, LocationData>>({});
  const [focusedEmployeeId, setFocusedEmployeeId] = useState<string | null>(
    null,
  );
  const [focusedCoordinate, setFocusedCoordinate] = useState<LatLng | null>(
    null,
  );
  const [showSheet, setShowSheet] = useState(false);
  const [defaultCord, setDefaultCord] = useState<LatLng | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(MAP_THEMES[0]);
  const [availableThemes, setAvailableThemes] = useState(MAP_THEMES);
  const { userAuthData, currentLocation } = useAuth();
  const company_id = userAuthData?.company_id?.toString();
  const userId = userAuthData?.id?.toString();
  const { LocationGet } = useApi();
  const { userdata } = useEncodedUserData();



  useEffect(() => {
    if (Platform.OS === 'ios') {
      getLocation();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'ios' && IOSLocation?.latitude && IOSLocation?.longitude) {
      setDefaultCord({
        latitude: IOSLocation.latitude,
        longitude: IOSLocation.longitude,
      });
    }
  }, [IOSLocation]);



  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@map_theme');
        if (savedTheme) {
          const parsedTheme = JSON.parse(savedTheme);
          setSelectedTheme(parsedTheme);
        }
      } catch (error) {
        console.warn('Error loading theme:', error);
      }
    };
    loadSavedTheme();
  }, []);

  const currentMapLayers = useMemo(() => {
    return [selectedTheme.layer];
  }, [selectedTheme]);
  const handleThemeSelect = async theme => {
    setSelectedTheme(theme);
    try {
      await AsyncStorage.setItem('@map_theme', JSON.stringify(theme));
    } catch (error) {
      console.warn('Error saving theme:', error);
    }
  };

  useEffect(() => {
    const loadAndroidLocation = async () => {
      if (Platform.OS === 'android') {
        const loc = await getSingleLocation();
        if (loc?.latitude && loc?.longitude) {
          setDefaultCord(loc);
        }
      }
    };

    loadAndroidLocation();
  }, []);


  const DEFAULT_COORDINATE: LatLng = useMemo(() => {
    if (defaultCord?.latitude && defaultCord?.longitude) {
      return {
        lat: defaultCord.latitude,
        lng: defaultCord.longitude,
      };
    }
    return { lat: 26.9124, lng: 75.7873 };
  }, [defaultCord]);



  useEffect(() => {

    if (!company_id || !userId) {
      console.warn('⚠️ No company_id or userId');
      return;
    }

    const handleLocationUpdate = (locationData: LocationData) => {

      setLocations(prev => {
        const updated = {
          ...prev,
          [locationData.employee_id]: {
            ...(prev[locationData.employee_id] || {}),
            ...locationData,
          },
        };
        return updated;
      });
    };

    const handleConnect = () => {
      socket.emit('join', { userId, company_id });

      socket.on('receive-Location', handleLocationUpdate);
    };

    const handleDisconnect = (reason) => {
      socket.off('receive-Location', handleLocationUpdate);
    };

    const handleConnectError = (error) => {
      console.error('🔴 Connection ERROR:', error);
    };

    socket.onAny((eventName, ...args) => {
    });

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('receive-Location', handleLocationUpdate);
      socket.offAny();
    };
  }, [company_id, userId, socket]);

  const {
    data: LocationGetData,
    isLoading,
    isPending,
    isError: LocationGetDataError,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['FetchLeaveCount', userdata],
    queryFn: () => LocationGet({ userData: userdata, platformType: Platform.OS }),
    enabled: !!userdata,
  });



  const apiLocationsMap = useMemo(() => {
    if (!LocationGetData?.data || !Array.isArray(LocationGetData.data)) {
      return {};
    }

    const map = {};
    LocationGetData.data.forEach((employee) => {
      map[employee.employee_id] = employee;
    });

    return map;
  }, [LocationGetData]);


  const mergedLocations = useMemo(() => {
    const merged = { ...apiLocationsMap };

    Object.entries(locations).forEach(([id, loc]) => {
      if (id == merged[id]?.id) {
        merged[id] = {
          ...(merged[id] || {}),
          ...loc,
        };
      }
    });

    return merged;
  }, [apiLocationsMap, locations]);





  const mapMarkers = useMemo(() => {
    return Object.entries(mergedLocations)
      .map(([id, location]: any) => {
        const lat = location?.latitude ?? currentLocation?.latitude;
        const lng = location?.longitude ?? currentLocation?.longitude;

        if (!lat || !lng) {
          return null;
        }

        return {
          position: { lat, lng } as LatLng,
          icon: `${location.profile_image
            ? API_BASE_URL2 + location.profile_image
            : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
            }`,
          size: [50, 50],
          id: location.id,
          title: `${location.name}`,
          divIcon: true,
        };
      })
      .filter(Boolean);
  }, [mergedLocations, currentLocation]);

  const handleMapEvent = useCallback(
    (message: any) => {
      try {
        const data = JSON.parse(message.nativeEvent?.data);
        if (data?.event === 'onMarkerClicked') {
          const clickedMarkerId = data?.payload?.id;
          const markerLocation = mergedLocations[clickedMarkerId];
          if (markerLocation) {
            setFocusedCoordinate({
              lat: markerLocation.latitude,
              lng: markerLocation.longitude,
            });
          }
        }
      } catch (error) {
        console.warn('Map event error:', error);
      }
    },
    [mergedLocations],
  );

  useEffect(() => {
    if (focusedEmployeeId && mergedLocations[focusedEmployeeId]) {
      const userLocation = mergedLocations[focusedEmployeeId];
      setFocusedCoordinate({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });
    }
  }, [focusedEmployeeId, mergedLocations]);

  const focusOnUser = useCallback((employeeId: string) => {
    setFocusedEmployeeId(employeeId);
  }, []);

  const handleFocus = useCallback(
    (id: string) => {
      focusOnUser(id);
      setShowSheet(false);
    },
    [focusOnUser],
  );

  if (isLoading || isPending) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator size="large" color="black" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.themeSelectorContainer, { top: STATUS_BAR_HEIGHT() }]}>
        <View >
          <TopNavBar title={'Location'} navigation={navigation} />
        </View>
        <FlatList
          horizontal
          data={availableThemes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.themeItem,
                selectedTheme.id === item.id && styles.selectedThemeItem,
              ]}
              onPress={() => handleThemeSelect(item)}>
              <Text
                style={[
                  styles.themeText,
                  selectedTheme.id === item.id && styles.selectedThemeText,
                ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.themeListContent}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <MAPBOX
        mapMarkers={mapMarkers}
        currentMapLayers={currentMapLayers}
        focusedCoordinate={focusedCoordinate}
        DEFAULT_COORDINATE={DEFAULT_COORDINATE}
        handleMapEvent={handleMapEvent}
        handleFocus={handleFocus}
        mergedLocations={mergedLocations}
        showSheet={showSheet}
        setShowSheet={setShowSheet}
      />

      {/* <ScrollView
        horizontal
        style={styles.userScroll}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 15 }}
      >
        {Object.entries(mergedLocations).map(([id, loc]) => (
          <View key={id} style={styles.userButton}>
            <TouchableOpacity
              style={styles.userButtonInner}
              onPress={() => focusOnUser(id)}
            >
              <Text style={styles.userButtonText}>{loc.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView> */}
      <TouchableOpacity
        onPress={() => {
          setShowSheet(!showSheet);
        }}
        style={{
          backgroundColor: '#CA282C',
          position: 'absolute',
          bottom: bottomHeight(),
          right: 10,
          width: 50,
          height: 50,
          borderRadius: 50,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <FilterIcon width={25} height={25} color={'white'} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const MAPBOX = ({
  mapMarkers,
  currentMapLayers,
  focusedCoordinate,
  DEFAULT_COORDINATE,
  handleMapEvent,
  handleFocus,
  mergedLocations,
  showSheet,
  setShowSheet,
}: any) => {
  return (
    <>
      <BottomSheetMapBox
        handleFocus={handleFocus}
        data={mergedLocations}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
      />
      <LeafletView
        //@ts-ignore
        mapMarkers={mapMarkers}
        mapLayers={currentMapLayers}
        source={LEAFLET_HTML_SOURCE}
        mapCenterPosition={focusedCoordinate || DEFAULT_COORDINATE}
        onMessage={handleMapEvent}
        ownPositionMarker={{
          position: DEFAULT_COORDINATE,
          icon: '📍',
          size: [32, 32],
        }}
        mapShapes={[
          {
            id: 'circle-1',
            //@ts-ignore
            shapeType: 'CircleMarker',
            center: DEFAULT_COORDINATE,
            radius: 20,
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            weight: 2,
          },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  themeSelectorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 10,
  },
  themeListContent: {
    paddingHorizontal: 5,
  },
  themeItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedThemeItem: {
    backgroundColor: '#CA282C',
    borderColor: '#CA282C',
  },
  themeText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedThemeText: {
    color: 'white',
  },
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    position: 'relative',
  },
  userScroll: {
    position: 'absolute',
    bottom: 10,
    height: 60,
  },
  userButton: {
    minWidth: 100,
  },
  userButtonInner: {
    height: 40,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#CA282C',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  userButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    lineHeight: 20,
  },
});

export default React.memo(MapBox);



/**
 * EmployeeTrackingScreen.jsx
 *
 * React Native screen for real-time employee tracking.
 * Uses react-native-webview + Leaflet (loaded via CDN) to render
 * an interactive map with:
 *   - Live employee markers with status badges
 *   - Breadcrumb path trails (dots + polyline)
 *   - Employee detail bottom sheet
 *   - Filter / search panel
 *   - Status summary cards
 *
 * Dependencies (add to your project):
 *   npm install react-native-webview
 *   (Leaflet is loaded from CDN inside the WebView HTML)
 */

// import React, { useState, useRef, useCallback, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   TextInput,
//   Animated,
//   Dimensions,
//   SafeAreaView,
//   StatusBar,
//   Platform,
//   FlatList,
// } from "react-native";
// import { WebView } from "react-native-webview";

// const MOCK_EMPLOYEES = [
//   {
//     id: "E001",
//     name: "Aarav Sharma",
//     role: "Field Engineer",
//     avatar: "AS",
//     status: "active",      // active | idle | offline | sos
//     battery: 82,
//     speed: 24,             // km/h
//     lastSeen: "Just now",
//     location: { lat: 26.9124, lng: 75.7873 },
//     path: [
//       { lat: 26.9080, lng: 75.7820 },
//       { lat: 26.9095, lng: 75.7840 },
//       { lat: 26.9110, lng: 75.7855 },
//       { lat: 26.9124, lng: 75.7873 },
//     ],
//     zone: "Zone A",
//     taskProgress: 68,
//     phone: "+91 98765 43210",
//     checkIn: "09:15 AM",
//   },
//   {
//     id: "E002",
//     name: "Priya Verma",
//     role: "Site Inspector",
//     avatar: "PV",
//     status: "idle",
//     battery: 45,
//     speed: 0,
//     lastSeen: "3 min ago",
//     location: { lat: 26.9200, lng: 75.8000 },
//     path: [
//       { lat: 26.9170, lng: 75.7950 },
//       { lat: 26.9185, lng: 75.7970 },
//       { lat: 26.9200, lng: 75.8000 },
//     ],
//     zone: "Zone B",
//     taskProgress: 45,
//     phone: "+91 87654 32109",
//     checkIn: "08:30 AM",
//   },
//   {
//     id: "E003",
//     name: "Rohan Gupta",
//     role: "Delivery Agent",
//     avatar: "RG",
//     status: "active",
//     battery: 91,
//     speed: 38,
//     lastSeen: "Just now",
//     location: { lat: 26.9050, lng: 75.7780 },
//     path: [
//       { lat: 26.8990, lng: 75.7700 },
//       { lat: 26.9010, lng: 75.7730 },
//       { lat: 26.9030, lng: 75.7755 },
//       { lat: 26.9050, lng: 75.7780 },
//     ],
//     zone: "Zone A",
//     taskProgress: 80,
//     phone: "+91 76543 21098",
//     checkIn: "07:45 AM",
//   },
//   {
//     id: "E004",
//     name: "Meera Joshi",
//     role: "Safety Officer",
//     avatar: "MJ",
//     status: "offline",
//     battery: 12,
//     speed: 0,
//     lastSeen: "1h ago",
//     location: { lat: 26.9300, lng: 75.8100 },
//     path: [
//       { lat: 26.9280, lng: 75.8080 },
//       { lat: 26.9300, lng: 75.8100 },
//     ],
//     zone: "Zone C",
//     taskProgress: 30,
//     phone: "+91 65432 10987",
//     checkIn: "10:00 AM",
//   },
//   {
//     id: "E005",
//     name: "Kiran Patel",
//     role: "Technician",
//     avatar: "KP",
//     status: "sos",
//     battery: 55,
//     speed: 0,
//     lastSeen: "Just now",
//     location: { lat: 26.9160, lng: 75.7920 },
//     path: [
//       { lat: 26.9140, lng: 75.7890 },
//       { lat: 26.9160, lng: 75.7920 },
//     ],
//     zone: "Zone B",
//     taskProgress: 55,
//     phone: "+91 54321 09876",
//     checkIn: "09:00 AM",
//   },
// ];

// const STATUS_COLORS = {
//   active: "#00D97E",
//   idle: "#F6C000",
//   offline: "#8492A6",
//   sos: "#FF3B30",
// };

// const STATUS_LABELS = {
//   active: "Active",
//   idle: "Idle",
//   offline: "Offline",
//   sos: "SOS Alert",
// };

// const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// function buildLeafletHTML(employees, selectedId, showPaths, showDots) {
//   const employeesJson = JSON.stringify(employees);

//   return `<!DOCTYPE html>
// <html>
// <head>
// <meta charset="utf-8"/>
// <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
// <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
// <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
// <style>
//   * { margin:0; padding:0; box-sizing:border-box; }
//   html, body, #map { width:100%; height:100%; }
//   .emp-marker {
//     display:flex; align-items:center; justify-content:center;
//     border-radius:50%; color:#fff; font-weight:700; font-size:11px;
//     border:3px solid #fff;
//     box-shadow: 0 2px 8px rgba(0,0,0,0.35);
//     cursor:pointer; transition: transform 0.2s;
//   }
//   .emp-marker:hover { transform: scale(1.15); }
//   .emp-marker.sos { animation: sosPulse 0.8s infinite alternate; }
//   @keyframes sosPulse {
//     from { box-shadow: 0 0 0 0 rgba(255,59,48,0.7); }
//     to   { box-shadow: 0 0 0 10px rgba(255,59,48,0); }
//   }
//   .emp-marker.selected { border-color: #007AFF; box-shadow: 0 0 0 3px #007AFF55; }
//   .dot-marker { border-radius:50%; opacity:0.7; }
//   .leaflet-popup-content-wrapper {
//     border-radius:12px;
//     box-shadow: 0 4px 20px rgba(0,0,0,0.2);
//     padding:0; overflow:hidden;
//   }
//   .popup-inner { padding:12px 14px; min-width:160px; }
//   .popup-name { font-weight:700; font-size:14px; color:#1a1a2e; }
//   .popup-role { font-size:11px; color:#666; margin-top:2px; }
//   .popup-status { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:600; color:#fff; margin-top:6px; }
//   .popup-speed { font-size:11px; color:#444; margin-top:4px; }
// </style>
// </head>
// <body>
// <div id="map"></div>
// <script>
// (function(){
//   var employees = ${employeesJson};
//   var selectedId = ${selectedId ? `"${selectedId}"` : "null"};
//   var showPaths = ${showPaths};
//   var showDots  = ${showDots};

//   var statusColors = {
//     active: "#00D97E", idle: "#F6C000", offline: "#8492A6", sos: "#FF3B30"
//   };
//   var statusLabels = {
//     active: "Active", idle: "Idle", offline: "Offline", sos: "SOS"
//   };

//   // ── Catmull-Rom: insert smooth intermediate lat/lng points ──
//   // This generates extra points between each segment so L.polyline
//   // draws a smooth curve — no SVG overlay needed.
//   function catmullRomLatLng(points, numSegments) {
//     numSegments = numSegments || 20;
//     if (points.length < 2) return points;

//     var result = [];

//     for (var i = 0; i < points.length - 1; i++) {
//       var p0 = points[Math.max(i - 1, 0)];
//       var p1 = points[i];
//       var p2 = points[i + 1];
//       var p3 = points[Math.min(i + 2, points.length - 1)];

//       for (var t = 0; t < numSegments; t++) {
//         var tt = t / numSegments;
//         var tt2 = tt * tt;
//         var tt3 = tt2 * tt;

//         // Catmull-Rom formula
//         var lat =
//           0.5 * (
//             (2 * p1.lat) +
//             (-p0.lat + p2.lat) * tt +
//             (2*p0.lat - 5*p1.lat + 4*p2.lat - p3.lat) * tt2 +
//             (-p0.lat + 3*p1.lat - 3*p2.lat + p3.lat) * tt3
//           );
//         var lng =
//           0.5 * (
//             (2 * p1.lng) +
//             (-p0.lng + p2.lng) * tt +
//             (2*p0.lng - 5*p1.lng + 4*p2.lng - p3.lng) * tt2 +
//             (-p0.lng + 3*p1.lng - 3*p2.lng + p3.lng) * tt3
//           );

//         result.push([lat, lng]);
//       }
//     }

//     // Push the final point
//     var last = points[points.length - 1];
//     result.push([last.lat, last.lng]);

//     return result;
//   }

//   var map = L.map("map", {
//     center: [26.9124, 75.7873],
//     zoom: 13,
//     zoomControl: false,
//   });

//   L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}@2x.png', {
//     attribution: '',
//     subdomains: 'abcd',
//     maxZoom: 20,
//     detectRetina: true
//   }).addTo(map);

//   L.control.zoom({ position: "bottomright" }).addTo(map);

//   employees.forEach(function(emp) {
//     var color = statusColors[emp.status];

//     // ── Smooth path polyline ──
//     if (showPaths && emp.path.length > 1) {
//       var smoothLatLngs = catmullRomLatLng(emp.path, 24);
//       L.polyline(smoothLatLngs, {
//         color: color,
//         weight: emp.id === selectedId ? 5 : 3.5,
//         opacity: emp.status === "offline" ? 0.35 : 0.7,
//         dashArray: emp.status === "offline" ? "8,5" : null,
//         lineCap: "round",
//         lineJoin: "round",
//       }).addTo(map);
//     }

//     // ── Breadcrumb dots ──
//     if (showDots && emp.path.length > 1) {
//       emp.path.slice(0, -1).forEach(function(p, i) {
//         var size = 7 + i * 1.5;
//         var dotIcon = L.divIcon({
//           className: "dot-marker",
//           html: '<div style="width:'+size+'px;height:'+size+'px;background:'+color+';border-radius:50%;border:2px solid rgba(255,255,255,0.85);box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>',
//           iconSize: [size, size],
//           iconAnchor: [size/2, size/2],
//         });
//         L.marker([p.lat, p.lng], { icon: dotIcon }).addTo(map);
//       });
//     }

//     // ── Employee marker ──
//     var isSelected = emp.id === selectedId;
//     var markerSize = isSelected ? 46 : 38;
//     var extraClass = isSelected ? " selected" : "";
//     if (emp.status === "sos") extraClass += " sos";

//     var icon = L.divIcon({
//       className: "",
//       html: '<div class="emp-marker' + extraClass + '" style="width:'+markerSize+'px;height:'+markerSize+'px;background:'+color+';">'+emp.avatar+'</div>',
//       iconSize: [markerSize, markerSize],
//       iconAnchor: [markerSize/2, markerSize/2],
//     });

//     var marker = L.marker([emp.location.lat, emp.location.lng], { icon: icon }).addTo(map);

//     marker.bindPopup(
//       '<div class="popup-inner">' +
//         '<div class="popup-name">' + emp.name + '</div>' +
//         '<div class="popup-role">' + emp.role + '</div>' +
//         '<span class="popup-status" style="background:'+color+'">'+statusLabels[emp.status]+'</span>' +
//         '<div class="popup-speed">🚀 ' + (emp.speed > 0 ? emp.speed + ' km/h' : 'Stationary') + '</div>' +
//         '<div class="popup-speed">🔋 ' + emp.battery + '%</div>' +
//       '</div>'
//     );

//     marker.on("click", function() {
//       if (window.ReactNativeWebView) {
//         window.ReactNativeWebView.postMessage(JSON.stringify({ type: "selectEmployee", id: emp.id }));
//       }
//     });

//     if (isSelected) {
//       setTimeout(function(){ marker.openPopup(); }, 300);
//     }
//   });
// })();
// </script>
// </body>
// </html>`;
// }

// function StatusBadge({ status }) {
//   return (
//     <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] + "22", borderColor: STATUS_COLORS[status] }]}>
//       <View style={[styles.badgeDot, { backgroundColor: STATUS_COLORS[status] }]} />
//       <Text style={[styles.badgeText, { color: STATUS_COLORS[status] }]}>{STATUS_LABELS[status]}</Text>
//     </View>
//   );
// }

// function BatteryBar({ level }) {
//   const color = level > 50 ? "#00D97E" : level > 20 ? "#F6C000" : "#FF3B30";
//   return (
//     <View style={styles.batteryOuter}>
//       <View style={[styles.batteryInner, { width: `${level}%`, backgroundColor: color }]} />
//     </View>
//   );
// }

// function StatCard({ icon, label, value, accent }) {
//   return (
//     <View style={[styles.statCard, { borderLeftColor: accent }]}>
//       <Text style={styles.statIcon}>{icon}</Text>
//       <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
//       <Text style={styles.statLabel}>{label}</Text>
//     </View>
//   );
// }

// function EmployeeListItem({ emp, selected, onPress }) {
//   return (
//     <TouchableOpacity
//       style={[styles.listItem, selected && styles.listItemSelected]}
//       onPress={() => onPress(emp)}
//       activeOpacity={0.75}
//     >
//       <View style={[styles.listAvatar, { backgroundColor: STATUS_COLORS[emp.status] }]}>
//         <Text style={styles.listAvatarText}>{emp.avatar}</Text>
//       </View>
//       <View style={styles.listInfo}>
//         <Text style={styles.listName}>{emp.name}</Text>
//         <Text style={styles.listRole}>{emp.role}</Text>
//       </View>
//       <StatusBadge status={emp.status} />
//     </TouchableOpacity>
//   );
// }

// // ─────────────────────────────────────────────
// // Main Screen
// // ─────────────────────────────────────────────

// export default function MapBox() {
//   const webViewRef = useRef(null);
//   const bottomSheetAnim = useRef(new Animated.Value(0)).current;
//   const sidebarAnim = useRef(new Animated.Value(-300)).current;

//   const [employees] = useState(MOCK_EMPLOYEES);
//   const [selectedEmployee, setSelectedEmployee] = useState(null);
//   const [showPaths, setShowPaths] = useState(true);
//   const [showDots, setShowDots] = useState(true);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [mapHtml, setMapHtml] = useState(() =>
//     buildLeafletHTML(MOCK_EMPLOYEES, null, true, true)
//   );

//   // Rebuild HTML whenever settings change
//   useEffect(() => {
//     setMapHtml(buildLeafletHTML(employees, selectedEmployee?.id ?? null, showPaths, showDots));
//   }, [employees, selectedEmployee, showPaths, showDots]);

//   // Bottom sheet open/close
//   const openBottomSheet = useCallback(() => {
//     Animated.spring(bottomSheetAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
//   }, [bottomSheetAnim]);

//   const closeBottomSheet = useCallback(() => {
//     Animated.timing(bottomSheetAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() =>
//       setSelectedEmployee(null)
//     );
//   }, [bottomSheetAnim]);

//   // Sidebar open/close
//   const toggleSidebar = useCallback(() => {
//     Animated.spring(sidebarAnim, {
//       toValue: sidebarOpen ? -300 : 0,
//       useNativeDriver: true,
//       tension: 80,
//       friction: 12,
//     }).start();
//     setSidebarOpen((v) => !v);
//   }, [sidebarOpen, sidebarAnim]);

//   // Handle messages from WebView
//   const onWebViewMessage = useCallback(
//     (event) => {
//       try {
//         const msg = JSON.parse(event.nativeEvent.data);
//         if (msg.type === "selectEmployee") {
//           const emp = employees.find((e) => e.id === msg.id);
//           if (emp) {
//             setSelectedEmployee(emp);
//             openBottomSheet();
//           }
//         }
//       } catch (_) { }
//     },
//     [employees, openBottomSheet]
//   );

//   const handleSelectEmployee = useCallback(
//     (emp) => {
//       setSelectedEmployee(emp);
//       openBottomSheet();
//       if (sidebarOpen) toggleSidebar();
//     },
//     [openBottomSheet, sidebarOpen, toggleSidebar]
//   );

//   // Stats
//   const stats = {
//     active: employees.filter((e) => e.status === "active").length,
//     idle: employees.filter((e) => e.status === "idle").length,
//     offline: employees.filter((e) => e.status === "offline").length,
//     sos: employees.filter((e) => e.status === "sos").length,
//   };

//   const filteredEmployees = employees.filter((e) => {
//     const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       e.role.toLowerCase().includes(searchQuery.toLowerCase());
//     const matchStatus = filterStatus === "all" || e.status === filterStatus;
//     return matchSearch && matchStatus;
//   });

//   const bottomSheetTranslateY = bottomSheetAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [400, 0],
//   });

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#F4F6FC" />

//       {/* ── Header ── */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.headerBtn} onPress={toggleSidebar}>
//           <Text style={styles.headerBtnIcon}>☰</Text>
//         </TouchableOpacity>
//         <View>
//           <Text style={styles.headerTitle}>Field Tracker</Text>
//           <Text style={styles.headerSub}>{stats.active} active · {stats.sos > 0 ? `⚠️ ${stats.sos} SOS` : `${employees.length} employees`}</Text>
//         </View>
//         <TouchableOpacity style={styles.headerBtn}>
//           <Text style={styles.headerBtnIcon}>🔔</Text>
//           {stats.sos > 0 && <View style={styles.notifDot} />}
//         </TouchableOpacity>
//       </View>

//       {/* ── Stat Cards ── */}
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
//         <StatCard icon="🟢" label="Active" value={stats.active} accent="#00D97E" />
//         <StatCard icon="🟡" label="Idle" value={stats.idle} accent="#F6C000" />
//         <StatCard icon="⚫" label="Offline" value={stats.offline} accent="#8492A6" />
//         <StatCard icon="🔴" label="SOS" value={stats.sos} accent="#FF3B30" />
//         <StatCard icon="👷" label="Total" value={employees.length} accent="#007AFF" />
//       </ScrollView>

//       {/* ── Map Toggle Controls ── */}
//       <View style={styles.mapControls}>
//         <TouchableOpacity
//           style={[styles.toggleBtn, showPaths && styles.toggleBtnActive]}
//           onPress={() => setShowPaths((v) => !v)}
//         >
//           <Text style={styles.toggleBtnText}>{showPaths ? "🛤️" : "🛤️"} Paths</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.toggleBtn, showDots && styles.toggleBtnActive]}
//           onPress={() => setShowDots((v) => !v)}
//         >
//           <Text style={styles.toggleBtnText}>⚫ Breadcrumbs</Text>
//         </TouchableOpacity>
//       </View>

//       {/* ── Map ── */}
//       <View style={styles.mapContainer}>
//         <WebView
//           ref={webViewRef}
//           originWhitelist={["*"]}
//           source={{ html: mapHtml }}
//           onMessage={onWebViewMessage}
//           javaScriptEnabled
//           domStorageEnabled
//           style={styles.map}
//           scrollEnabled={false}
//         />
//       </View>

//       {/* ── Sidebar Overlay ── */}
//       {sidebarOpen && (
//         <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleSidebar} />
//       )}

//       {/* ── Sidebar ── */}
//       <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
//         <Text style={styles.sidebarTitle}>Employees</Text>

//         {/* Search */}
//         <View style={styles.searchRow}>
//           <Text style={styles.searchIcon}>🔍</Text>
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search by name or role…"
//             placeholderTextColor="#AAB"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />
//         </View>

//         {/* Status Filter */}
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
//           {["all", "active", "idle", "offline", "sos"].map((s) => (
//             <TouchableOpacity
//               key={s}
//               style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
//               onPress={() => setFilterStatus(s)}
//             >
//               <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
//                 {s.charAt(0).toUpperCase() + s.slice(1)}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* Employee List */}
//         <FlatList
//           data={filteredEmployees}
//           keyExtractor={(e) => e.id}
//           renderItem={({ item }) => (
//             <EmployeeListItem
//               emp={item}
//               selected={selectedEmployee?.id === item.id}
//               onPress={handleSelectEmployee}
//             />
//           )}
//           showsVerticalScrollIndicator={false}
//         />
//       </Animated.View>

//       {/* ── Bottom Sheet: Employee Detail ── */}
//       {selectedEmployee && (
//         <>
//           <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeBottomSheet} />
//           <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: bottomSheetTranslateY }] }]}>
//             {/* Handle */}
//             <View style={styles.sheetHandle} />

//             {/* Header */}
//             <View style={styles.sheetHeader}>
//               <View style={[styles.sheetAvatar, { backgroundColor: STATUS_COLORS[selectedEmployee.status] }]}>
//                 <Text style={styles.sheetAvatarText}>{selectedEmployee.avatar}</Text>
//               </View>
//               <View style={{ flex: 1, marginLeft: 14 }}>
//                 <Text style={styles.sheetName}>{selectedEmployee.name}</Text>
//                 <Text style={styles.sheetRole}>{selectedEmployee.role}</Text>
//                 <StatusBadge status={selectedEmployee.status} />
//               </View>
//               <TouchableOpacity onPress={closeBottomSheet} style={styles.closeBtn}>
//                 <Text style={styles.closeBtnText}>✕</Text>
//               </TouchableOpacity>
//             </View>

//             <ScrollView showsVerticalScrollIndicator={false}>
//               {/* Info Grid */}
//               <View style={styles.infoGrid}>
//                 <View style={styles.infoCell}>
//                   <Text style={styles.infoCellIcon}>⏰</Text>
//                   <Text style={styles.infoCellLabel}>Check-in</Text>
//                   <Text style={styles.infoCellValue}>{selectedEmployee.checkIn}</Text>
//                 </View>
//                 <View style={styles.infoCell}>
//                   <Text style={styles.infoCellIcon}>🚀</Text>
//                   <Text style={styles.infoCellLabel}>Speed</Text>
//                   <Text style={styles.infoCellValue}>{selectedEmployee.speed > 0 ? `${selectedEmployee.speed} km/h` : "Stationary"}</Text>
//                 </View>
//                 <View style={styles.infoCell}>
//                   <Text style={styles.infoCellIcon}>📍</Text>
//                   <Text style={styles.infoCellLabel}>Zone</Text>
//                   <Text style={styles.infoCellValue}>{selectedEmployee.zone}</Text>
//                 </View>
//                 <View style={styles.infoCell}>
//                   <Text style={styles.infoCellIcon}>👁️</Text>
//                   <Text style={styles.infoCellLabel}>Last Seen</Text>
//                   <Text style={styles.infoCellValue}>{selectedEmployee.lastSeen}</Text>
//                 </View>
//               </View>

//               {/* Battery */}
//               <View style={styles.section}>
//                 <View style={styles.sectionRow}>
//                   <Text style={styles.sectionLabel}>🔋 Battery</Text>
//                   <Text style={[styles.sectionValue, { color: selectedEmployee.battery > 50 ? "#00D97E" : selectedEmployee.battery > 20 ? "#F6C000" : "#FF3B30" }]}>
//                     {selectedEmployee.battery}%
//                   </Text>
//                 </View>
//                 <BatteryBar level={selectedEmployee.battery} />
//               </View>

//               {/* Task Progress */}
//               <View style={styles.section}>
//                 <View style={styles.sectionRow}>
//                   <Text style={styles.sectionLabel}>📋 Task Progress</Text>
//                   <Text style={styles.sectionValue}>{selectedEmployee.taskProgress}%</Text>
//                 </View>
//                 <View style={styles.progressOuter}>
//                   <View style={[styles.progressInner, { width: `${selectedEmployee.taskProgress}%`, backgroundColor: "#007AFF" }]} />
//                 </View>
//               </View>

//               {/* Path History */}
//               <View style={styles.section}>
//                 <Text style={styles.sectionLabel}>🛤️ Path History ({selectedEmployee.path.length} points)</Text>
//                 {selectedEmployee.path.map((p, i) => (
//                   <View key={i} style={styles.pathPoint}>
//                     <View style={[styles.pathDot, { backgroundColor: i === selectedEmployee.path.length - 1 ? STATUS_COLORS[selectedEmployee.status] : "#CBD0D8" }]} />
//                     <Text style={styles.pathCoord}>
//                       {i === selectedEmployee.path.length - 1 ? "📍 Current — " : `Point ${i + 1} — `}
//                       {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
//                     </Text>
//                   </View>
//                 ))}
//               </View>

//               {/* Action Buttons */}
//               <View style={styles.actionRow}>
//                 <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#007AFF" }]}>
//                   <Text style={styles.actionBtnText}>📞 Call</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#34C759" }]}>
//                   <Text style={styles.actionBtnText}>💬 Message</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#FF9500" }]}>
//                   <Text style={styles.actionBtnText}>📤 Share</Text>
//                 </TouchableOpacity>
//               </View>

//               {selectedEmployee.status === "sos" && (
//                 <TouchableOpacity style={styles.sosBtn}>
//                   <Text style={styles.sosBtnText}>🚨 Respond to SOS Alert</Text>
//                 </TouchableOpacity>
//               )}
//             </ScrollView>
//           </Animated.View>
//         </>
//       )}
//     </SafeAreaView>
//   );
// }

// // ─────────────────────────────────────────────
// // Styles
// // ─────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F4F6FC", marginTop: 50 },

//   // Header
//   header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
//   headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F4F6FC", alignItems: "center", justifyContent: "center", position: "relative" },
//   headerBtnIcon: { fontSize: 18 },
//   headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", textAlign: "center" },
//   headerSub: { fontSize: 12, color: "#8492A6", textAlign: "center" },
//   notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30", position: "absolute", top: 8, right: 8 },

//   // Stat Row
//   statRow: { paddingVertical: 12, flexGrow: 0 },
//   statCard: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", borderLeftWidth: 4, elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, minWidth: 80 },
//   statIcon: { fontSize: 18, marginBottom: 2 },
//   statValue: { fontSize: 22, fontWeight: "800" },
//   statLabel: { fontSize: 10, color: "#8492A6", fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },

//   // Map Controls
//   mapControls: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
//   toggleBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#E8EBF5", borderWidth: 1.5, borderColor: "transparent" },
//   toggleBtnActive: { backgroundColor: "#EAF2FF", borderColor: "#007AFF" },
//   toggleBtnText: { fontSize: 12, fontWeight: "600", color: "#1A1A2E" },

//   // Map
//   mapContainer: { flex: 1, marginHorizontal: 0, borderRadius: 0, overflow: "hidden" },
//   map: { flex: 1 },

//   // Overlay
//   overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 10 },

//   // Sidebar
//   sidebar: { position: "absolute", top: 0, left: 0, bottom: 0, width: 300, backgroundColor: "#fff", zIndex: 20, padding: 20, elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 4, height: 0 } },
//   sidebarTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A2E", marginBottom: 14, marginTop: Platform.OS === "ios" ? 44 : 16 },
//   searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F4F6FC", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
//   searchIcon: { fontSize: 14, marginRight: 8 },
//   searchInput: { flex: 1, fontSize: 14, color: "#1A1A2E" },
//   filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "#F4F6FC", marginRight: 6 },
//   filterChipActive: { backgroundColor: "#007AFF" },
//   filterChipText: { fontSize: 12, fontWeight: "600", color: "#8492A6" },
//   filterChipTextActive: { color: "#fff" },
//   listItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderRadius: 12, marginBottom: 4, paddingHorizontal: 8 },
//   listItemSelected: { backgroundColor: "#EAF2FF" },
//   listAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
//   listAvatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
//   listInfo: { flex: 1, marginLeft: 10 },
//   listName: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
//   listRole: { fontSize: 11, color: "#8492A6" },

//   // Badge
//   badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
//   badgeDot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
//   badgeText: { fontSize: 10, fontWeight: "700" },

//   // Bottom Sheet
//   bottomSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_HEIGHT * 0.75, zIndex: 20, elevation: 20, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, padding: 20 },
//   sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E4EF", alignSelf: "center", marginBottom: 16 },
//   sheetHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
//   sheetAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
//   sheetAvatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },
//   sheetName: { fontSize: 18, fontWeight: "800", color: "#1A1A2E" },
//   sheetRole: { fontSize: 13, color: "#8492A6", marginBottom: 4 },
//   closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F4F6FC", alignItems: "center", justifyContent: "center" },
//   closeBtnText: { fontSize: 12, color: "#8492A6", fontWeight: "700" },

//   // Info Grid
//   infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
//   infoCell: { flex: 1, minWidth: "45%", backgroundColor: "#F8F9FE", borderRadius: 14, padding: 12, alignItems: "center" },
//   infoCellIcon: { fontSize: 20, marginBottom: 4 },
//   infoCellLabel: { fontSize: 10, color: "#8492A6", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
//   infoCellValue: { fontSize: 13, fontWeight: "700", color: "#1A1A2E", marginTop: 2 },

//   // Section
//   section: { marginBottom: 14 },
//   sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
//   sectionLabel: { fontSize: 13, fontWeight: "600", color: "#1A1A2E" },
//   sectionValue: { fontSize: 13, fontWeight: "700" },

//   // Battery / Progress
//   batteryOuter: { height: 8, backgroundColor: "#E8EBF5", borderRadius: 4, overflow: "hidden" },
//   batteryInner: { height: "100%", borderRadius: 4 },
//   progressOuter: { height: 8, backgroundColor: "#E8EBF5", borderRadius: 4, overflow: "hidden" },
//   progressInner: { height: "100%", borderRadius: 4 },

//   // Path history
//   pathPoint: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
//   pathDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
//   pathCoord: { fontSize: 12, color: "#5A6680" },

//   // Action buttons
//   actionRow: { flexDirection: "row", gap: 8, marginVertical: 14 },
//   actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
//   actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

//   // SOS
//   sosBtn: { backgroundColor: "#FF3B30", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginBottom: 20 },
//   sosBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
// });