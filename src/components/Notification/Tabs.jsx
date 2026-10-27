import React, { useCallback, memo, useEffect, useState, Suspense, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Platform,
    ScrollView,
} from 'react-native';
import { TabView } from 'react-native-tab-view';
import NotificationRoot, { Loader } from './NotificationRoot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TabBar = memo(({ index, routes, onIndexChange }) => {
    const scrollRef = useRef(null);
    const tabLayouts = useRef([]);

    const centerTab = i => {
        const layout = tabLayouts.current[i];
        if (!layout) return;

        const offset = layout.x + layout.width / 2 - SCREEN_WIDTH / 2;

        scrollRef.current?.scrollTo({
            x: Math.max(0, offset),
            animated: true,
        });
    };

    useEffect(() => {
        centerTab(index);
    }, [index]);

    return (
        <View
            style={{
                flexDirection: 'row',
                backgroundColor: 'transparent',
                borderRadius: 25,
                marginBottom: 15,
            }}
        >
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ height: 40, gap: 10 }}
            >
                {routes.map((route, i) => {
                    const isSelected = index === i;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onLayout={e => {
                                tabLayouts.current[i] = e.nativeEvent.layout;
                            }}
                            onPress={() => onIndexChange(i)}
                            style={{
                                paddingHorizontal: 20,
                                borderRadius: 100,
                                backgroundColor: isSelected ? '#CA282C' : 'transparent',
                                borderWidth: isSelected ? 0 : 1,
                                borderColor: '#dbdbdbff',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                numberOfLines={2}
                                style={{
                                    color: isSelected ? '#fff' : '#293646',
                                    fontSize: 12,
                                    fontFamily: 'Poppins-Medium',
                                    textAlign: 'center',
                                }}
                            >
                                {route.title}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
});

const Tabs = ({
    routes,
    notifications,
    announcementData,
    initialKey,
    onViewDetails,
    handleViewData,
    onChangeTabs,
}) => {
    const layout = Dimensions.get('window');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipeEnabled, setSwipeEnabled] = useState(true);

    useEffect(() => {
        if (!initialKey) return;

        const newIndex = routes.findIndex(r => r.key === initialKey);

        if (newIndex >= 0 && newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
        }
    }, [initialKey, routes]);

    const onIndexChange = useCallback(
        i => {
            setCurrentIndex(i);
            if (onChangeTabs) onChangeTabs(i);
        },
        [onChangeTabs],
    );

    const renderTabBar = useCallback(
        tabProps => (
            <TabBar
                index={tabProps.navigationState.index}
                routes={tabProps.navigationState.routes}
                onIndexChange={onIndexChange}
            />
        ),
        [onIndexChange],
    );

    const renderScene = ({ route }) => (
        <Suspense fallback={<Loader />}>
            <NotificationRoot
                activeTab={route}
                notifications={notifications}
                announcementData={announcementData}
                onViewDetails={onViewDetails}
                handleViewData={handleViewData}
                setSwipeEnabled={setSwipeEnabled}
            />
        </Suspense>
    );

    return (
        <TabView
            navigationState={{ index: currentIndex, routes }}
            renderScene={renderScene}
            onIndexChange={onIndexChange}
            initialLayout={{ width: layout.width }}
            renderTabBar={renderTabBar}
            swipeEnabled={swipeEnabled}
            lazy
            lazyPreloadDistance={1}
            removeClippedSubviews={Platform.OS === 'android'}
        />
    );
};

export default memo(Tabs);