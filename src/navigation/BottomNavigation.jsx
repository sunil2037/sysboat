import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { Home, Attendance, ProfileIcon, DashboardIcon } from '../Helper/IconsLoad';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BOTTOM_TAB_HEIGHT } from '../Helper/Helper';

const BottomNavigation = ({ hide_profile_tab, navigation }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const tabIndex = useSharedValue(0);
  const navigationState = useNavigationState(state => state);
  const { width } = Dimensions.get('window');
  const TAB_COUNT = hide_profile_tab ? 1 : 3;
  const totalWidth = width * 0.9;
  const tabWidth = hide_profile_tab ? totalWidth : totalWidth / TAB_COUNT;

  const tabPositions = {
    Home: 0,
    Dashboard: 1,
    Profile: 2,
  };

  // ✅ Animated indicator
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const targetLeft = hide_profile_tab
      ? (totalWidth - tabWidth) / 2
      : tabIndex.value * tabWidth;
    return {
      left: withTiming(targetLeft, {
        duration: 800,
        easing: Easing.out(Easing.exp),
      }),
      width: withTiming(tabWidth, {
        duration: 800,
        easing: Easing.out(Easing.exp),
      }),
    };
  });

  // ✅ Hook calls OUTSIDE render (not dynamically created)
  const homeTabStyle = useAnimatedStyle(() => {
    const isActive = Math.round(tabIndex.value) === 0;
    return {
      opacity: withTiming(isActive ? 1 : 0.7),
      transform: [{ scale: withTiming(isActive ? 1.2 : 0.9) }],
    };
  });

  const dashboardTabStyle = useAnimatedStyle(() => {
    const isActive = Math.round(tabIndex.value) === 1;
    return {
      opacity: withTiming(isActive ? 1 : 0.7),
      transform: [{ scale: withTiming(isActive ? 1.2 : 0.9) }],
    };
  });

  const profileTabStyle = useAnimatedStyle(() => {
    const isActive = Math.round(tabIndex.value) === 2;
    return {
      opacity: withTiming(isActive ? 1 : 0.7),
      transform: [{ scale: withTiming(isActive ? 1.2 : 0.9) }],
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
    tabIndex.value = withTiming(tabPositions[tabName]);
  };

  return (
    <View style={[styles.container, { height: BOTTOM_TAB_HEIGHT }]}>
      <Animated.View style={[styles.activeIndicator, animatedIndicatorStyle]} />

      {/* Home */}
      <TouchableOpacity style={styles.tab} onPress={() => handleTabPress('Home')}>
        <Animated.View style={homeTabStyle}>
          <Home color={'white'} width={25} height={25} />
        </Animated.View>
      </TouchableOpacity>

      {/* Dashboard + Profile (if allowed) */}
      {!hide_profile_tab && (
        <>
          <TouchableOpacity style={styles.tab} onPress={() => handleTabPress('Dashboard')}>
            <Animated.View style={dashboardTabStyle}>
              <DashboardIcon color={'white'} width={25} height={25} />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => handleTabPress('Profile')}>
            <Animated.View style={profileTabStyle}>
              <ProfileIcon color={'white'} width={25} height={25} />
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
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 50,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 50,
  },
  activeIndicator: {
    position: 'absolute',
    backgroundColor: '#AE181C',
    height: '100%',
    borderRadius: 50,
  },
});

export default BottomNavigation;
