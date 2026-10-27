import React, { useCallback } from 'react';
import {
    FlatList,
    RefreshControl,
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import EmptyMessage from '../../Helper/EmptyMessage';
import { bottomHeight } from '../../Helper/Helper';
import Card from './ui/Card';


export const Loader = () => (
    <View style={styles.centered}>
        <ActivityIndicator size="large" color="#CA282C" />
    </View>
);

const ErrorMessage = ({ onRetry }) => (
    <View style={styles.centered}>
        <Text style={styles.errorText}>Something went wrong.</Text>
        <Text style={styles.retryText} onPress={onRetry}>
            Tap to retry
        </Text>
    </View>
);

const ListContent = ({ data, tabKey, handleViewData, isRefetching, onRefresh }) => {
    const isNotificationTab = tabKey === 'notification';
    const cardType = 'full';

    return (
        <FlatList
            data={data}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) =>
                isNotificationTab ? (
                    <Card item={item} handleViewData={handleViewData} />
                ) : (
                    <Card item={item} cardType={cardType} handleViewData={handleViewData} />
                )
            }
            ListEmptyComponent={
                <View style={styles.emptyWrapper}>
                    <EmptyMessage />
                </View>
            }
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomHeight(), }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={!!isRefetching}
                    onRefresh={onRefresh}
                    colors={['#CA282C']}
                    tintColor="#CA282C"
                />
            }
        />
    );
};


const NotificationRoot = ({
    activeTab,
    notifications = [],
    announcementData,
    onViewDetails,
    handleViewData: handleViewDataProp,
}) => {
    const tabKey = activeTab?.key;
    const isNotificationTab = tabKey === 'notification';

    const data = isNotificationTab
        ? notifications
        : announcementData?.data?.posts ?? announcementData?.data ?? [];


    const isLoading = isNotificationTab
        ? false
        : (announcementData?.isLoading || announcementData?.isPending);

    const isError = isNotificationTab ? false : announcementData?.isError;

    const isRefetching = isNotificationTab ? false : announcementData?.isRefetching;

    const refetch = isNotificationTab
        ? () => { }
        : announcementData?.refetch ?? (() => { });

    const onRefresh = useCallback(() => refetch(), [refetch]);

    const handleViewData = useCallback(
        item => {
            if (isNotificationTab) {
                if (handleViewDataProp) handleViewDataProp('notification', item);
                return;
            }
            if (onViewDetails) onViewDetails(item);
        },
        [isNotificationTab, handleViewDataProp, onViewDetails],
    );

    if (isLoading) return <Loader />;
    if (isError) return <ErrorMessage onRetry={refetch} />;

    return (
        <View style={styles.container}>
            <ListContent
                data={data}
                tabKey={tabKey}
                handleViewData={handleViewData}
                isRefetching={isRefetching}
                onRefresh={onRefresh}
            />
        </View>
    );
};

export default NotificationRoot;


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyWrapper: {
        marginTop: 40,
    },
    listContent: {

        paddingHorizontal: 2,
    },
    errorText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 6,
    },
    retryText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: '#CA282C',
        textDecorationLine: 'underline',
    },
});