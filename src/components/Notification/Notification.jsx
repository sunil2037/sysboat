import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import EmptyMessage from '../../Helper/EmptyMessage';
import { AttendanceIcon } from '../../Helper/IconsLoad';
import { bottomHeight, getFontSize } from '../../Helper/Helper';
import useNotificationStore from '../../Context/useNotificationStore';

const Grid = ({ data, handleViewData }) => (
    <FlatList
        data={data}
        ListEmptyComponent={
            <View style={{}}>
                <EmptyMessage />
            </View>
        }
        contentContainerStyle={{ paddingBottom: bottomHeight() }}
        renderItem={({ item }) => (
            <TouchableOpacity
                onPress={() => handleViewData('notification', item)}
                style={styles.itemContainer}>
                <View
                    style={{
                        backgroundColor: '#FFF2F2',
                        height: 40,
                        width: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 10,
                    }}>
                    <AttendanceIcon />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                        <Text style={styles.item}>
                            {item.title.length > 20
                                ? item.title.slice(0, 20) + '...'
                                : item.title}
                        </Text>
                        <View
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Text
                                style={{
                                    fontFamily: 'Poppins-Regular',
                                    fontSize: 12,
                                    alignItems: 'center',
                                }}>
                                {new Date(item.created_at).toLocaleDateString()}{' '}
                            </Text>
                            {item.is_read == false && (
                                <View
                                    style={{
                                        width: 10,
                                        height: 10,
                                        backgroundColor: 'red',
                                        borderRadius: 50,
                                    }}
                                />
                            )}
                        </View>
                    </View>
                    <Text
                        style={[
                            styles.item,
                            { fontFamily: 'Poppins-Regular', fontSize: 12 },
                        ]}>
                        {item.message.length > 20
                            ? item.message.slice(0, 80) + '...'
                            : item.message}
                    </Text>
                </View>
            </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
    />
);
const Notification = () => {
    const { notifications } = useNotificationStore();
    const handleViewData = () => {

    }
    return (
        <View>
            <Grid data={notifications} handleViewData={handleViewData} />
        </View>
    )
}

export default Notification

const styles = StyleSheet.create({
    itemContainer: {
        backgroundColor: 'white',
        padding: 10,
        paddingVertical: 15,
        borderRadius: 10,
        flexDirection: 'row',
        marginVertical: 5,
    },
    item: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#293646',
    },

    date: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#293646',
        marginTop: 5,
    },
    time: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#293646',
        marginTop: 5,
    },
});