import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { Home, DashboardIcon, ProfileIcon } from '../Helper/IconsLoad';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const SLIDER_WIDTH = 60;
const NAVBAR_HEIGHT = 55;
const PADDING = 2;

const BottomNavigation = ({ hide_profile_tab, navigation }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const tabIndex = useSharedValue(0);
  const navigationState = useNavigationState(state => state);

  const TAB_COUNT = hide_profile_tab ? 1 : 3;
  const containerWidth = TAB_COUNT * SLIDER_WIDTH + PADDING * 2;

  const tabPositions = {
    Home: 0,
    Dashboard: 1,
    Profile: 2,
  };

  // ✅ Animated indicator centered with 2px padding to outer bar
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const targetLeft = PADDING + tabIndex.value * SLIDER_WIDTH;
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
      justifyContent: 'center',
      alignItems: 'center',
    };
  });

  const dashboardTabStyle = useAnimatedStyle(() => {
    const isActive = Math.round(tabIndex.value) === 1;
    return {
      opacity: withTiming(isActive ? 1 : 0.7),
      transform: [{ scale: withTiming(isActive ? 1.15 : 0.95) }],
      justifyContent: 'center',
      alignItems: 'center',
    };
  });

  const profileTabStyle = useAnimatedStyle(() => {
    const isActive = Math.round(tabIndex.value) === 2;
    return {
      opacity: withTiming(isActive ? 1 : 0.7),
      transform: [{ scale: withTiming(isActive ? 1.15 : 0.95) }],
      justifyContent: 'center',
      alignItems: 'center',
    };
  });

  // ✅ Track navigation route changes
  useEffect(() => {
    if (navigationState?.routes?.length > 0) {
      let currentRoute = navigationState.routes[navigationState.index];
      if (currentRoute.state && currentRoute.state.index !== undefined) {
        currentRoute = currentRoute.state.routes[currentRoute.state.index];
      }

      if (currentRoute?.name) {
        const newTab =
          currentRoute.name === 'Home'
            ? 'Home'
            : currentRoute.name === 'Dashboard'
              ? 'Dashboard'
              : currentRoute.name === 'ProfileStack'
                ? 'Profile'
                : 'Home';

        if (activeTab !== newTab) {
          setActiveTab(newTab);
          tabIndex.value = tabPositions[newTab];
        }
      }
    }
  }, [navigationState]);

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
    navigation.navigate(tabName === 'Profile' ? 'ProfileStack' : tabName);
    tabIndex.value = tabPositions[tabName];
  };

  return (
    <View style={[styles.container, { width: containerWidth, height: NAVBAR_HEIGHT }]}>
      {/* 2px padded sliding indicator */}
      <Animated.View style={[styles.activeIndicator, animatedIndicatorStyle]} />

      {/* Home */}
      <TouchableOpacity
        style={styles.tab}
        activeOpacity={0.8}
        onPress={() => handleTabPress('Home')}>
        <Animated.View style={homeTabStyle}>
          <Home color={'white'} width={22} height={22} />
        </Animated.View>
      </TouchableOpacity>

      {/* Dashboard + Profile (if allowed) */}
      {!hide_profile_tab && (
        <>
          <TouchableOpacity
            style={styles.tab}
            activeOpacity={0.8}
            onPress={() => handleTabPress('Dashboard')}>
            <Animated.View style={dashboardTabStyle}>
              <DashboardIcon color={'white'} width={22} height={22} />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            activeOpacity={0.8}
            onPress={() => handleTabPress('Profile')}>
            <Animated.View style={profileTabStyle}>
              <ProfileIcon color={'white'} width={22} height={22} />
            </Animated.View>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: '#CA282C',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    alignSelf: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    width: SLIDER_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    backgroundColor: '#AE181C',
    top: PADDING,
    bottom: PADDING,
    borderRadius: 50,
  },
});

export default BottomNavigation;
