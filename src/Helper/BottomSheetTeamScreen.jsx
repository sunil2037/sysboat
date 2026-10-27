import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import BottomSheetBase from './BottomSheetBase';
import Skeleton, { getLayout } from './Skeleton';
import ThemedText from './ThemedText';

const getInitials = (name = '') =>
    name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

const formatDate = (dateStr) => {
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch {
        return 'N/A';
    }
};

const InfoCard = ({ label, value }) => (
    <View style={styles.infoCard}>
        <ThemedText size='xs' transform='uppercase' weight='Light' color='secondary'>
            {label}
        </ThemedText>
        <ThemedText numberOfLines={2} size='xs' weight='Medium' >
            {value || 'N/A'}
        </ThemedText>
    </View>
);

const BottomSheetTeamScreen = ({ detailsData, loading, visible, onClose }) => {
    const initials = getInitials(detailsData?.first_name);

    return (
        <BottomSheetBase visible={visible} onClose={onClose}>
            <Skeleton isLoading={loading} layout={getLayout({ length: 1, height: 400 })}>
                <View style={styles.header}>
                    <ThemedText size='md' weight='Medium'>
                        Team details
                    </ThemedText>
                </View>
                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <ThemedText size='xl' weight='Medium'>
                            {initials || '?'}
                        </ThemedText>
                    </View>
                    <View style={styles.profileInfo}>
                        <ThemedText size='md' weight='Medium'>
                            {detailsData?.first_name || 'N/A'}
                        </ThemedText>
                        <ThemedText size='sm' weight='Regular' color='secondary'>
                            {detailsData?.designation || '—'}
                        </ThemedText>

                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.grid}>
                    <InfoCard label="Department" value={detailsData?.department_name} />
                    <InfoCard label="Sub-department" value={detailsData?.sub_department_name} />
                    <InfoCard label="Reporting to" value={detailsData?.reporting_manager_name} />
                    <InfoCard label="Date of joining" value={formatDate(detailsData?.date_of_Joining)} />
                </View>
                <View style={[styles.infoCard, styles.infoCardFull]}>
                    <ThemedText size='xs' transform='uppercase' weight='Light' color='secondary'>
                        Designation
                    </ThemedText>
                    <ThemedText size='xs' weight='Medium' >
                        {detailsData?.designation || 'N/A'}
                    </ThemedText>
                </View>

            </Skeleton>
        </BottomSheetBase>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 4,
    },
    headerTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#1A1A2E',
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F4F6FC',
        borderWidth: 0.5,
        borderColor: '#D0D5DD',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: {
        fontSize: 11,
        color: '#8492A6',
        fontFamily: 'Poppins-Medium',
    },

    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 20,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e2e2e2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 18,
        color: '#0C447C',
    },
    profileInfo: {
        flex: 1,
        gap: 1
    },
    name: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#1A1A2E',
        marginBottom: 2,
    },
    designation: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#8492A6',
        marginBottom: 6,
    },
    activeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E1F5EE',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    activeBadgeText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 11,
        color: '#0F6E56',
    },

    // Divider
    divider: {
        height: 0.5,
        backgroundColor: '#e2e2e2',
        marginHorizontal: 20,
    },

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingTop: 16,
    },
    infoCard: {
        width: '47%',
        backgroundColor: '#e2e2e2',
        borderRadius: 10,
        padding: 12,
    },
    infoCardFull: {
        width: 'auto',
        marginTop: 12,
        marginBottom: 8,
    },
    infoLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: '#8492A6',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    infoValue: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: '#1A1A2E',
    },
});

export default React.memo(BottomSheetTeamScreen);