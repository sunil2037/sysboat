import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationState } from '@react-navigation/native';
import { Home, DashboardIcon, ProfileIcon } from '../Helper/IconsLoad';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const SLIDER_WIDTH = 70;
const NAVBAR_HEIGHT = 60;
const PADDING = 2;

const BottomNavigation = ({ hide_profile_tab, navigation, state }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const tabIndex = useSharedValue(0);
  const navigationState = useNavigationState(navState => navState);
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? 20 + insets.bottom : 20;

  const TAB_COUNT = hide_profile_tab ? 1 : 3;
  const containerWidth = TAB_COUNT * SLIDER_WIDTH + PADDING * 2;

  const tabPositions = {
    Home: 0,
    Dashboard: 1,
    Profile: 2,
  };

  // ✅ Animated indicator centered with 2px padding to outer bar
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const targetLeft = tabIndex.value * SLIDER_WIDTH;
    return {
      left: withTiming(targetLeft, {
        duration: 350,
        easing: Easing.out(Easing.exp),
      }),
      width: SLIDER_WIDTH,
    };
  });

  // ✅ Tab icon animation styles
  const homeTabStyle = useAnimatedStyle(() => {
    const isActive = Math.round(tabIndex.value) === 0;
    return {
      opacity: withTiming(isActive ? 1 : 0.7),
      transform: [{ scale: withTiming(isActive ? 1.15 : 0.95) }],
    };
  });

  const dashboardTabStyle = useAnimatedStyle(() => {
    const isActive = Math.round(tabIndex.value) === 1;
    return {
      opacity: withTiming(isActive ? 1 : 0.7),
      transform: [{ scale: withTiming(isActive ? 1.15 : 0.95) }],
    };
  });

  const profileTabStyle = useAnimatedStyle(() => {
    const isActive = Math.round(tabIndex.value) === 2;
    return {
      opacity: withTiming(isActive ? 1 : 0.7),
      transform: [{ scale: withTiming(isActive ? 1.15 : 0.95) }],
    };
  });

  // ✅ Track navigation route changes safely
  useEffect(() => {
    // 1. Direct tab navigator route from props if available
    let currentRouteName = state?.routes?.[state?.index]?.name;

    // 2. Fallback to navigationState if props.state is not available
    if (!currentRouteName && navigationState?.routes?.length > 0 && navigationState.index !== undefined) {
      let currentRoute = navigationState.routes[navigationState.index];
      while (currentRoute?.state && currentRoute.state.index !== undefined && currentRoute.state.routes) {
        currentRoute = currentRoute.state.routes[currentRoute.state.index];
      }
      currentRouteName = currentRoute?.name;
    }

    if (currentRouteName) {
      let newTab = null;
      if (currentRouteName === 'Home') {
        newTab = 'Home';
      } else if (currentRouteName === 'Dashboard') {
        newTab = 'Dashboard';
      } else if (
        currentRouteName === 'ProfileStack' ||
        currentRouteName === 'Profile' ||
        currentRouteName === 'ProfileMain'
      ) {
        newTab = 'Profile';
      }

      if (newTab && activeTab !== newTab) {
        setActiveTab(newTab);
        tabIndex.value = tabPositions[newTab];
      }
    }
  }, [state?.index, navigationState]);

  // ✅ Hide tabs dynamically
  useEffect(() => {
    if (hide_profile_tab && (activeTab === 'Profile' || activeTab === 'Dashboard')) {
      navigation.navigate('Home');
      setActiveTab('Home');
      tabIndex.value = tabPositions['Home'];
    }
  }, [hide_profile_tab]);

  const handleTabPress = tabName => {
    setActiveTab(tabName);
    const targetRoute = tabName === 'Profile' ? 'ProfileStack' : tabName;
    navigation.navigate(targetRoute);
    tabIndex.value = tabPositions[tabName];
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: containerWidth,
          height: NAVBAR_HEIGHT,
          bottom: bottomPadding,
        },
      ]}>
      <View style={[styles.tabTrack, { width: TAB_COUNT * SLIDER_WIDTH }]}>
        {/* Sliding active indicator */}
        <Animated.View style={[styles.activeIndicator, animatedIndicatorStyle]} />

        {/* Home */}
        <TouchableOpacity
          style={styles.tab}
          activeOpacity={0.8}
          onPress={() => handleTabPress('Home')}>
          <Animated.View style={[styles.iconWrapper, homeTabStyle]}>
            <Home color={'white'} width={24} height={24} />
          </Animated.View>
        </TouchableOpacity>

        {/* Dashboard + Profile (if allowed) */}
        {!hide_profile_tab && (
          <>
            <TouchableOpacity
              style={styles.tab}
              activeOpacity={0.8}
              onPress={() => handleTabPress('Dashboard')}>
              <Animated.View style={[styles.iconWrapper, dashboardTabStyle]}>
                <DashboardIcon color={'white'} width={24} height={24} />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              activeOpacity={0.8}
              onPress={() => handleTabPress('Profile')}>
              <Animated.View style={[styles.iconWrapper, profileTabStyle]}>
                <ProfileIcon color={'white'} width={24} height={24} />
              </Animated.View>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#CA282C',
    borderRadius: NAVBAR_HEIGHT / 2,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tabTrack: {
    flexDirection: 'row',
    height: NAVBAR_HEIGHT - PADDING * 2,
    alignItems: 'center',
    position: 'relative',
  },
  tab: {
    width: SLIDER_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    backgroundColor: '#AE181C',
    top: 0,
    bottom: 0,
    left: 0,
    width: SLIDER_WIDTH,
    borderRadius: (NAVBAR_HEIGHT - PADDING * 2) / 2,
  },
});

export default BottomNavigation;
