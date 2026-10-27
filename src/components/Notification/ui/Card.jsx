import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { API_BASE_URL2 } from '../../../Apis/Services/ServerURL'
import { SCREEN_WIDTH, StringLengthLimit } from '../../../Helper/Helper'
import ThemedText from '../../../Helper/ThemedText'

const Card = ({ item, cardType, handleViewData }) => {

    const IMAGE = API_BASE_URL2 + item?.image
    const TITLE = item?.title
    const DATE = item?.date || new Date(item?.created_at).toLocaleDateString()
    const FULL_NAME = `${item?.first_name || ''} ${item?.last_name || ''}`
    const PRIORITY = item?.priority

    const renderCard = () => {

        switch (cardType) {

            case 'full':
                return (
                    <View style={styles.fullCard}>

                        <Image
                            style={styles.fullImage}
                            source={{ uri: IMAGE }}
                        />

                        <View style={styles.contentContainer}>

                            <View style={styles.rowBetween}>
                                <Text style={styles.title}>
                                    {StringLengthLimit(TITLE, 40)}
                                </Text>

                                <Text style={styles.date}>
                                    {DATE}
                                </Text>
                            </View>

                            <Text style={styles.creator}>
                                Created by {FULL_NAME}
                            </Text>

                            {PRIORITY &&
                                <View style={styles.priorityBadge}>
                                    <Text style={styles.priorityText}>
                                        {PRIORITY}
                                    </Text>
                                </View>
                            }

                        </View>
                    </View>
                )

            case 'horizontal':
                return (
                    <View style={styles.horizontalCard}>

                        <Image
                            style={styles.avatar}
                            source={{ uri: IMAGE }}
                        />

                        <View style={styles.horizontalContent}>

                            <View style={styles.rowBetween}>
                                <Text style={styles.title}>
                                    {StringLengthLimit(TITLE, 25)}
                                </Text>

                                <Text style={styles.date}>
                                    {DATE}
                                </Text>
                            </View>

                            <Text style={styles.creator}>
                                Created by {FULL_NAME}
                            </Text>

                        </View>

                    </View>
                )

            default:
                return null
        }
    }

    return (
        <TouchableOpacity
            onPress={() => handleViewData(item)}
            style={styles.cardWrapper}
        >
            {renderCard()}
        </TouchableOpacity>
    )
}

export default Card


const styles = StyleSheet.create({

    cardWrapper: {
        marginVertical: 8
    },

    /* FULL CARD */

    fullCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',

    },

    fullImage: {
        width: '100%',
        height: SCREEN_WIDTH / 2.2
    },

    contentContainer: {
        padding: 14
    },

    /* HORIZONTAL CARD */

    horizontalCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',

    },

    avatar: {
        width: 55,
        height: 55,
        borderRadius: 100
    },

    horizontalContent: {
        flex: 1,
        marginLeft: 12
    },

    /* COMMON */

    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: '#1B2A3A',
        flex: 1,
        marginRight: 10
    },

    creator: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4
    },

    date: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: '#9CA3AF'
    },

    /* PRIORITY */

    priorityBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 6
    },

    priorityText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 10,
        color: '#000000'
    }

})