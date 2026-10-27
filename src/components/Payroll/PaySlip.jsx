import React, { Activity, memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    ScrollView,
    Text,
    TouchableOpacity,
    Modal,
    RefreshControl,
    ImageBackground,
    PixelRatio,
    FlatList,
    Linking,
    Alert,
    Button,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import CustomNativeDropdown from '../../Helper/CustomNativeDropdown';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import useApi from '../../Apis/Services/ApiConfig';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import { isEmptyArray } from 'formik';
import EmptyMessage from '../../Helper/EmptyMessage';
import { bottomHeight, COLORS, getFontSize, SCREEN_WIDTH, shiftMonth, STATUS_BAR_HEIGHT, StringLengthLimit, useDebounce } from '../../Helper/Helper';
import { Correct, Cross, LogoutIcon, SalaryPayableIcon, TotalHoldIcon, TotalPaidIcon, TotalPendingIcon, TotalSalaryIcon, User } from '../../Helper/IconsLoad';
import Skeleton, { getLayout } from '../../Helper/Skeleton';
import backgroundImage from '../../../assets/Icon/background.png';
import { ActionButton } from '../../utils/ActionButton';
import BottomSheetBase from '../../Helper/BottomSheetBase';
import { SCREEN_HEIGHT } from '@gorhom/bottom-sheet';
import { useAuth } from '../../Context/AuthContext';
import ThemedText from '../../Helper/ThemedText';

const BUTTON_NAMES = ['Check Outstanding Penalties', 'View Detained Reports', 'Initiate Employee Payment'];

const MONTH_NAMES = [
    { name: 'January', id: '1' },
    { name: 'February', id: '2' },
    { name: 'March', id: '3' },
    { name: 'April', id: '4' },
    { name: 'May', id: '5' },
    { name: 'June', id: '6' },
    { name: 'July', id: '7' },
    { name: 'August', id: '8' },
    { name: 'September', id: '9' },
    { name: 'October', id: '10' },
    { name: 'November', id: '11' },
    { name: 'December', id: '12' },
];

const payWithSpecificApp = async (appScheme, upiId, name, amount) => {
    const baseUrl = `pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    const fullUrl = `${appScheme}${baseUrl}`;

    try {
        const supported = await Linking.canOpenURL(fullUrl);
        if (supported) {
            await Linking.openURL(fullUrl);
        } else {
            Alert.alert("App not found", "This payment app is not installed on your device.");
        }
    } catch (err) {
        Alert.alert("Error", "Could not launch the payment app.");
    }
};

const PaySlip = () => {
    const { userType } = useAuth();
    return (
        <View>
            {renderUI(userType)}
        </View >
    );
};


const renderUI = (userType) => {
    if (userType != "employee") {
        return <AdminPayDetails />
    } else {
        return <EmployeePayDetails />
    }
}


const getUiCards = (res) => {
    const style = StyleSheet.create({
        card: {
            width: SCREEN_WIDTH / 2,
            height: 70,
            backgroundColor: COLORS.white,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#dbdbdbff',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: "space-between",
            paddingHorizontal: 15,
            paddingVertical: 20
        },
        title: {
            fontSize: getFontSize(14),
            fontFamily: 'Poppins-Regular'
        },
        description: {
            fontSize: getFontSize(22),
            fontFamily: 'Poppins-SemiBold'
        },
        textColor: {
            color: COLORS.text_secondary
        }
    })
    return (
        <View style={style.card}>
            <View>
                <ThemedText size='sm' weight='Regular' color='secondary'>
                    {res.title}
                </ThemedText>
                <ThemedText size='lg' weight='SemiBold' >
                    ₹{Math.floor(res.amount).toLocaleString()}
                </ThemedText>
            </View>
            {res.icon}
        </View>
    )
}

const getTableUI = ({ item, handleDetails }) => {
    const res = item?.item;
    return (
        <View style={uiStyles.card}>
            <View style={uiStyles.headerRow}>
                <ThemedText size='lg' weight='SemiBold' style={{ width: '70%' }}>
                    {res.employee_name}
                </ThemedText>
                <View style={[uiStyles.badge, res.payment_status === 'done' ? uiStyles.paidBadge : uiStyles.pendingBadge]}>
                    <ThemedText size='xs' weight='Medium' transform='uppercase' color='inverse'>
                        {res.payment_status}
                    </ThemedText>
                </View>
            </View>

            <View style={uiStyles.divider} />
            <View style={{ gap: 8 }}>
                <View style={uiStyles.statsGrid}>
                    <StatBox label="Present" value={res.present_count} />
                    <StatBox label="Absents" value={res.absents_count} />
                </View>

                <View style={[uiStyles.statsGrid,]}>
                    <StatBox label="Leaves" value={res.leave_count} />
                    <StatBox label="Half Day" value={res.half_day} />
                </View>
                <View style={[uiStyles.statsGrid,]}>
                    <StatBox label="Leave Count" value={res.half_day} />
                    <StatBox label="Leave Req Count" value={res.half_day} />
                </View>
                <View style={[uiStyles.statsGrid,]}>
                    <StatBox label="Absents Count" value={res.half_day} />
                    <StatBox label="Present Count" value={res.half_day} />
                </View>
                <View style={[uiStyles.statsGrid,]}>
                    <StatBox label="Holiday Count" value={res.half_day} />
                </View>
            </View>
            <View style={uiStyles.salaryContainer}>
                <View>
                    <ThemedText size='xs' weight='Medium' color='secondary'>
                        Monthly Salary
                    </ThemedText>
                    <ThemedText size='md' weight='SemiBold' >
                        ₹{res.monthly_salary.toLocaleString()}
                    </ThemedText>
                </View>
                <View style={uiStyles.rightAlign}>
                    <ThemedText size='xs' weight='Medium' color='secondary' align='right'>
                        Final Payout
                    </ThemedText>
                    <ThemedText size='md' weight='SemiBold' align='right' color='success'>
                        ₹{res.final_monthly_salary.toLocaleString()}
                    </ThemedText>
                </View>
            </View>

            {res.penalty === "yes" && (
                <View style={uiStyles.penaltyBanner}>
                    <ThemedText size='xs' weight='Medium' color='error' >
                        ⚠️ Penalty Applied
                    </ThemedText>
                </View>
            )}

            <View>
                {BUTTON_NAMES.map((e) =>
                    <ActionButton key={e} text={e} variant="secondary" onPress={() => handleDetails({ type: e, data: res })} />
                )}
            </View>

        </View>
    );
};

const StatBox = ({ label, value, color }) => (
    <View style={uiStyles.statBox}>
        <ThemedText size='sm' weight='SemiBold' align='center' >
            {value}
        </ThemedText>
        <ThemedText size='xs' weight='Medium' color='secondary' align='center'>
            {label}
        </ThemedText>
    </View>
);

const uiStyles = StyleSheet.create({
    btn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 50,
    },
    btnText: {
        fontFamily: 'Poppins-Medium',
        fontSize: getFontSize(12),
        color: COLORS.white,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    employeeName: {
        fontSize: getFontSize(20),
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text_secondary,
        maxWidth: '80%'
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 50,
    },
    paidBadge: { backgroundColor: COLORS.success },
    pendingBadge: { backgroundColor: COLORS.primary },
    badgeText: { fontSize: getFontSize(10), fontFamily: 'Poppins-SemiBold', color: COLORS.white },
    divider: {
        height: 1,
        backgroundColor: COLORS.background,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    statBox: {
        width: SCREEN_WIDTH / 2 - 35,
        backgroundColor: COLORS.background,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    statValue: { fontSize: getFontSize(16), fontFamily: 'Poppins-SemiBold', textAlign: 'center', color: COLORS.text_secondary },
    statLabel: { fontSize: getFontSize(11), color: COLORS.text_primary, marginTop: 2, fontFamily: 'Poppins-Medium', textAlign: 'center' },
    salaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    salaryLabel: { fontSize: getFontSize(12), color: COLORS.text_primary, fontFamily: 'Poppins-Medium' },
    salaryLabelSmall: { fontSize: getFontSize(12), color: COLORS.text_primary, textAlign: 'right', fontFamily: 'Poppins-Medium' },
    salaryValue: { fontSize: getFontSize(16), color: COLORS.text_secondary, fontFamily: 'Poppins-SemiBold' },
    finalSalary: { fontSize: getFontSize(18), color: COLORS.success, fontFamily: 'Poppins-SemiBold' },
    rightAlign: { alignItems: 'flex-end' },
    penaltyBanner: {
        marginTop: 12,
        backgroundColor: '#FFF3E0',
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    penaltyText: { color: COLORS.primary, fontSize: getFontSize(12), fontWeight: '600' },
});


const MyHeader = (props) => {
    return (
        <ScrollView showsHorizontalScrollIndicator={false} horizontal contentContainerStyle={{ gap: 10, }}>
            {props.data?.map((res) => getUiCards(res))}
        </ScrollView>
    )
}

const CheckOutstandingPenaltiesSheet = memo(({ data, loading, visible, setVisible }) => {

    const DATA = useMemo(() => {
        const sourceList = data;
        if (!sourceList || !Array.isArray(sourceList)) return [];

        return sourceList.map((e, i) => ({
            id: i,
            type: e.penalty_type,
            name: e.penalty_name,
            count: e.penalty_count,
            amount: Number(e.penalty_amount).toLocaleString(),
            reason: e.penalty_reason,
            remark: e.remarks
        }));
    }, [data]);

    const styles = StyleSheet.create({
        container: { flex: 1, },
        header: { fontSize: getFontSize(22), color: COLORS.text_secondary, marginBottom: 20, marginTop: 10, fontFamily: 'Poppins-SemiBold' },
        listContent: { paddingBottom: 40 },
        card: {
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#F0F0F0',
        },
        cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
        badge: { backgroundColor: COLORS.primary, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
        badgeText: { color: COLORS.primary, fontSize: getFontSize(10), color: COLORS.white, fontFamily: 'Poppins-Bold' },
        amount: { fontSize: getFontSize(18), color: COLORS.primary, fontFamily: 'Poppins-SemiBold' },
        penaltyName: { fontSize: getFontSize(16), fontWeight: '600', color: COLORS.text_secondary, marginBottom: 12 },
        divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },
        detailRow: { marginBottom: 8 },
        label: { fontSize: getFontSize(12), color: COLORS.text_primary, marginBottom: 2 },
        value: { fontSize: getFontSize(14), color: COLORS.text_secondary, lineHeight: 20 },
        italic: { fontStyle: 'italic', color: COLORS.text_secondary },
        cardFooter: { marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#F5F5F5' },
        countText: { fontSize: getFontSize(12), color: COLORS.text_secondary }
    });

    return (
        <BottomSheetBase
            snapPoints={['85%', '100%']}
            isSnapPoint={true}
            visible={visible}
            onClose={() => setVisible(false)}
        >
            <View style={styles.container}>
                <ThemedText size="lg" weight="SemiBold" style={{ marginBottom: 10 }}>Outstanding Penalties</ThemedText>
                <Skeleton isLoading={loading} layout={getLayout({ length: 2, height: 251 })}>
                    {!isEmptyArray(DATA) ? DATA.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.badge}>
                                    <ThemedText size="xs" weight="Medium" color="inverse">
                                        {item.type.toUpperCase()}
                                    </ThemedText>
                                </View>
                                <ThemedText size="lg" weight="SemiBold" color="primary">₹{item.amount.toLocaleString()}</ThemedText>
                            </View>

                            <ThemedText size="md" weight="SemiBold" color="primary" style={{ marginBottom: 8 }}>{item.name}</ThemedText>

                            <View style={styles.divider} />

                            <View style={styles.detailRow}>
                                <ThemedText size="sm" weight="Medium" >Reason:</ThemedText>
                                <ThemedText size="sm" weight="Medium" color='secondary' italic >{item.reason}</ThemedText>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText size="sm" weight="Medium" >Remark:</ThemedText>
                                <ThemedText size="sm" weight="Medium" color='secondary' italic >"{item.remark}"</ThemedText>
                            </View>

                            <View style={styles.cardFooter}>
                                <ThemedText size="sm" weight="Medium" color='secondary' italic >Occurrence Count: **{item.count}**</ThemedText>
                            </View>
                        </View>
                    )) : <EmptyMessage />}
                </Skeleton>
            </View>
        </BottomSheetBase>
    );
});

const ViewDetailedReportsSheet = memo(({ data, visible, setVisible }) => {
    const totalComponentsAmount = data?.components && data?.components?.reduce((acc, comp) => {
        return acc + Number(comp.amount || 0);
    }, 0);
    const styles = StyleSheet.create({
        container: { flex: 1 },
        mainTitle: { fontSize: getFontSize(24), color: COLORS.text_secondary, marginBottom: 20, fontFamily: 'Poppins-SemiBold' },
        reportWrapper: { marginBottom: 30 },
        headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, marginBottom: 15, },
        empName: { fontSize: getFontSize(18), color: COLORS.text_secondary, fontFamily: 'Poppins-SemiBold', },
        dateText: { fontSize: getFontSize(13), color: COLORS.text_primary, marginTop: 2, fontFamily: 'Poppins-Regular' },
        statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, },
        statusText: { fontSize: getFontSize(11), fontFamily: 'Poppins-SemiBold' },
        statsRow: { flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, marginBottom: 20 },
        statBox: { flex: 1, alignItems: 'center' },
        borderLeft: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' },
        statLabel: { color: COLORS.white, opacity: 0.8, fontSize: getFontSize(12), marginBottom: 4, fontFamily: 'Poppins-Regular' },
        statValue: { color: COLORS.white, fontSize: getFontSize(20), fontFamily: 'Poppins-SemiBold' },
        tableContainer: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0', overflow: 'hidden' },
        tableHeader: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', justifyContent: 'space-between' },
        headerCell: { flex: 1, fontSize: getFontSize(12), color: COLORS.white, textTransform: 'uppercase', fontFamily: 'Poppins-SemiBold' },
        tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', justifyContent: 'space-between' },
        totalRow: { backgroundColor: COLORS.primary, borderBottomWidth: 0 },
        rowText: { flex: 1, fontSize: getFontSize(14), color: COLORS.text_secondary, fontFamily: 'Poppins-Regular' },
        amountText: { textAlign: 'right', fontFamily: 'Poppins-Medium', },
        boldText: { color: COLORS.white, fontFamily: 'Poppins-SemiBold' }
    });

    return (
        <BottomSheetBase
            snapPoints={['85%', '100%']}
            isSnapPoint={true}
            visible={visible}
            onClose={() => setVisible(false)}
        >
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <ThemedText size='lg' weight='SemiBold' style={{ marginBottom: 10 }}>Payroll Report</ThemedText>
                <View style={styles.reportWrapper}>
                    <View style={styles.headerCard}>
                        <View style={{ width: '70%', gap: 6 }}>
                            <ThemedText size='md' weight='Medium' >{data?.employee_name}</ThemedText>
                            <ThemedText size='sm' weight='Regular' color='secondary'>Issued: {data?.date}</ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: data?.payment_status === 'done' ? COLORS.success : COLORS.primary }]}>
                            <ThemedText size='xs' weight='Regular' color='inverse'>{data?.payment_status?.toUpperCase()}</ThemedText>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <ThemedText size='xs' weight='Medium' color='inverse'>Annual CTC</ThemedText>
                            <ThemedText size='xl' weight='SemiBold' color='inverse'>₹{(data?.ctc / 1000)?.toFixed(0)}k</ThemedText>
                        </View>
                        <View style={[styles.statBox, styles.borderLeft]}>
                            <ThemedText size='xs' weight='Medium' color='inverse'>Monthly</ThemedText>
                            <ThemedText size='xl' weight='SemiBold' color='inverse'>₹{data?.monthly_salary?.toLocaleString()}</ThemedText>
                        </View>
                    </View>

                    <View style={styles.tableContainer}>
                        <View style={styles.tableHeader}>
                            <ThemedText size='xs' weight='Medium' color='inverse' >EARNINGS COMPONENTS</ThemedText>
                            <ThemedText size='xs' weight='Medium' color='inverse' align='right' >AMOUNT</ThemedText>
                        </View>

                        {data?.components?.map((comp, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.tableRow,
                                ]}
                            >
                                <ThemedText size='sm' weight='Regular' >{comp?.component_name}</ThemedText>
                                <ThemedText size='sm' weight='Medium'>₹{Number(comp?.amount)?.toLocaleString()}</ThemedText>
                            </View>
                        ))}
                        <View
                            style={[
                                styles.tableRow,
                                styles.totalRow
                            ]}
                        >
                            <ThemedText size='sm' weight='Regular' color='inverse' >Total Salary</ThemedText>
                            <ThemedText size='sm' weight='Medium' color='inverse' >₹{totalComponentsAmount?.toLocaleString()}</ThemedText>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </BottomSheetBase>
    );
});

const ConfirmationSheet = memo(({
    visible,
    setVisible,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    type = "primary" // 'primary', 'danger', 'warning'
}) => {

    const getStatusColor = () => {
        if (type === 'danger') return '#FF4D4F';
        if (type === 'warning') return '#FAAD14';
        return COLORS.primary;
    };


    const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', paddingTop: 10 }, iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }, innerCircle: { width: 24, height: 24, borderRadius: 12 }, title: { fontSize: getFontSize(20), fontFamily: 'Poppins-Bold', color: COLORS.text_secondary, marginBottom: 8, textAlign: 'center' }, desc: { fontSize: getFontSize(14), fontFamily: 'Poppins-Regular', color: COLORS.text_primary, textAlign: 'center', marginBottom: 30 }, buttonContainer: { flexDirection: 'row', gap: 12, width: '100%' }, cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' }, cancelText: { fontSize: getFontSize(14), fontFamily: 'Poppins-SemiBold', color: COLORS.text_primary }, confirmBtn: { flex: 2, paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowOpacity: 0.2, elevation: 3 }, confirmText: { fontSize: getFontSize(14), fontFamily: 'Poppins-Bold', color: COLORS.white } });

    return (
        <BottomSheetBase
            snapPoints={['40%']}
            isSnapPoint={true}
            visible={visible}
            onClose={() => setVisible(false)}
        >
            <View style={styles.container}>
                <View style={[styles.iconCircle, { backgroundColor: `${getStatusColor()}15` }]}>
                    <View style={[styles.innerCircle, { backgroundColor: getStatusColor() }]} />
                </View>
                <ThemedText size='lg' weight='Bold' align='center' style={{ marginVertical: 8 }} >
                    {title}
                </ThemedText>
                <ThemedText size='sm' weight='Regular' align='center' color='secondary' style={{ marginBottom: 12 }}>
                    {description}
                </ThemedText>

                <View style={styles.buttonContainer}>
                    <ActionButton size={'large'} variant={'secondary'} extraStyle={{ width: '49%' }} onPress={() => setVisible(false)} text={cancelText} />
                    <ActionButton size={'large'} onPress={onConfirm} extraStyle={{ width: '49%' }} text={confirmText} />
                </View>
            </View>
        </BottomSheetBase>
    );
});

const InitiateEmployeePaymentSheet = memo(({ totalSalary, loading, data, visible, setVisible }) => {
    const [isPayVisible, setIsPayVisible] = useState(false);
    const [PaymentMethodSchema, setPaymentMethodSchema] = useState('upi://pay?');
    const [PaymentMethodName, setPaymentMethodName] = useState('GPay');
    const TOTAL_SALARY = Math.floor(Number(totalSalary)).toLocaleString();
    const BankData = {
        last_working_day: data?.date_of_Joining || 'N/A',
        contact_number: data?.contact_number || 'N/A',
        account_holder_name: data?.account_holder_name || 'N/A',
        bank: data?.bank || 'N/A',
        Branch: data?.branch || 'N/A',
        city: data?.city || 'N/A',
        IFSC: data?.ifsc || 'N/A',
        account_number: data?.account_number || '000000000000',
        upi: data?.upi || 'N/A'
    };



    const BUTTON_TEXT = BankData.upi == 'N/A' ? 'UPI not available' : 'Pay ₹' + TOTAL_SALARY + ' Amount';

    const styles = StyleSheet.create({
        container: { flex: 1, },
        mainTitle: { fontSize: getFontSize(24), color: COLORS.text_secondary, marginBottom: 20, fontFamily: 'Poppins-SemiBold' },
        bankCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, marginBottom: 25, gap: 10 },
        bankName: { color: COLORS.white, fontSize: getFontSize(16), fontFamily: 'Poppins-SemiBold', opacity: 0.9 },
        accNumber: { color: COLORS.white, fontFamily: 'Poppins-Bold', marginVertical: 10, letterSpacing: 2 },
        cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
        cardLabel: { color: COLORS.white, fontSize: getFontSize(10), fontFamily: 'Poppins-Regular', opacity: 0.7 },
        cardValue: { color: COLORS.white, fontSize: getFontSize(13), fontFamily: 'Poppins-Medium' },
        infoSection: { backgroundColor: COLORS.white, borderRadius: 15, padding: 15, marginBottom: 25 },
        infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
        label: { fontSize: getFontSize(13), color: COLORS.text_primary, fontFamily: 'Poppins-Regular' },
        value: { fontSize: getFontSize(13), color: COLORS.text_secondary, fontFamily: 'Poppins-SemiBold', },
        payButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
        payButtonText: { color: COLORS.white, fontSize: getFontSize(16), fontFamily: 'Poppins-Bold' },
        payOptionContainer: { marginTop: 20, marginBottom: 20, gap: 10 },
        sectionLabel: { fontSize: getFontSize(14), color: COLORS.text_primary, fontFamily: 'Poppins-SemiBold', marginBottom: 10 },
        appRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
        appButton: { flex: 1, alignItems: 'center', backgroundColor: COLORS.white, paddingVertical: 15, borderRadius: 15, borderWidth: 2, },
        iconPlaceholder: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
        iconLetter: { color: '#FFF', fontSize: getFontSize(18), fontFamily: 'Poppins-Bold' },
        appName: { fontSize: getFontSize(12), color: COLORS.text_secondary, fontFamily: 'Poppins-Medium' },
        activeMethod: { borderColor: COLORS.primary },
        deactiveMethod: { borderColor: COLORS.white },
    });

    return (
        <BottomSheetBase
            snapPoints={['100%']}
            isSnapPoint={true}
            visible={visible}
            onClose={() => setVisible(false)}
        >
            <ThemedText size='lg' weight='SemiBold' style={{ marginBottom: 8 }}>
                Initiate Payment
            </ThemedText>
            <Skeleton isLoading={loading} layout={getLayout({ length: 4, height: 182 })}>
                <View style={styles.bankCard}>
                    <ThemedText size='sm' transform='uppercase' weight='Medium' color='inverse'>
                        {BankData.bank}
                    </ThemedText>
                    <ThemedText size={BankData.account_number?.length < 12 ? '2xl' : 'xl'} weight='SemiBold' color='inverse'>
                        {BankData.account_number.replace(/(\d{4})(?=\d)/g, '$1 ')}
                    </ThemedText>

                    <View style={styles.cardFooter}>
                        <View style={{ gap: 4 }}>
                            <ThemedText size='xs' transform='uppercase' weight='Light' color='inverse'>
                                HOLDER NAME
                            </ThemedText>
                            <ThemedText size='sm' weight='Medium' color='inverse'>
                                {BankData.account_holder_name}
                            </ThemedText>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <ThemedText size='xs' transform='uppercase' weight='Light' color='inverse'>
                                IFSC CODE
                            </ThemedText>
                            <ThemedText size='sm' weight='Medium' color='inverse'>
                                {BankData.IFSC}
                            </ThemedText>
                        </View>
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <ThemedText size='sm' weight='Regular' color='secondary' >
                            UPI ID
                        </ThemedText>
                        <ThemedText size='sm' weight='Medium' >
                            {BankData.upi}
                        </ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                        <ThemedText size='sm' weight='Regular' color='secondary' >
                            Branch
                        </ThemedText>
                        <ThemedText size='sm' weight='Medium' >
                            {BankData.Branch}
                        </ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                        <ThemedText size='sm' weight='Regular' color='secondary' >
                            City
                        </ThemedText>
                        <ThemedText size='sm' weight='Medium' >
                            {BankData.city}
                        </ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                        <ThemedText size='sm' weight='Regular' color='secondary' >
                            Contact Number
                        </ThemedText>
                        <ThemedText size='sm' weight='Medium' >
                            +91 {BankData.contact_number}
                        </ThemedText>
                    </View>
                    <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                        <ThemedText size='sm' weight='Regular' color='secondary' >
                            Joining Day
                        </ThemedText>
                        <ThemedText size='sm' weight='Medium' >
                            {BankData.last_working_day}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.payOptionContainer}>
                    <ThemedText size='md' weight='Medium' >
                        Select Payment App
                    </ThemedText>
                    <View style={styles.appRow}>
                        {[
                            { id: 'gpay', name: 'GPay', scheme: 'upi://pay?', color: '#4285F4' },
                            { id: 'phonepe', name: 'PhonePe', scheme: 'phonepe://pay?', color: '#6739B7' },
                            { id: 'paytm', name: 'Paytm', scheme: 'paytmmp://pay?', color: '#00BAF2' },
                        ].map((app) => (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                key={app.id}
                                style={[styles.appButton, PaymentMethodSchema == app.scheme ? styles.activeMethod : styles.deactiveMethod]}
                                onPress={() => { setPaymentMethodSchema(app.scheme); setPaymentMethodName(app.name) }}
                            >
                                <View style={[styles.iconPlaceholder, { backgroundColor: app.color }]}>
                                    <ThemedText size='lg' weight='Regular' color='inverse' >
                                        {app.name[0]}
                                    </ThemedText>
                                </View>
                                <ThemedText size='sm' weight='Medium' >
                                    {app.name}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <ConfirmationSheet
                    visible={isPayVisible}
                    setVisible={setIsPayVisible}
                    title="Confirm Payment"
                    description={`You are about to pay ₹${TOTAL_SALARY} to ${data?.account_holder_name}.`}
                    confirmText="Pay Now"
                    onConfirm={() => {
                        setIsPayVisible(false);
                    }}
                />
                <ActionButton size={'large'} disabled={BankData.upi == 'N/A'} variant={'secondary'} onPress={() => payWithSpecificApp(PaymentMethodSchema, BankData.upi, BankData.account_holder_name, Math.floor(Number(totalSalary)))} text={BUTTON_TEXT} />
                <ActionButton size={'large'} onPress={setIsPayVisible} text={'Confirm Now'} />
            </Skeleton>
        </BottomSheetBase>
    );
});

const AdminPayDetails = () => {
    const { userdata } = useEncodedUserData();
    const { EmployeeCompleteSalaryDetails, EmployeePanaltyDetails, BankDetails } = useApi();
    const [visible, setVisible] = useState(null);
    const [PayrollData, setPayrollData] = useState([]);
    const [TempData, setTemData] = useState({});
    const [YEARS, SETYEARS] = useState([]);
    const latest_years = new Date().getFullYear();
    const [date, setDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
    const [searchQuery, setSearchQuery] = useState('');
    const debounceSearchQuery = useDebounce(searchQuery);

    const totalComponentsAmount = PayrollData?.components && PayrollData?.components?.reduce((acc, comp) => {
        return acc + Number(comp.amount || 0);
    }, 0);


    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['EmployeeCompleteSalaryDetails', userdata, date, debounceSearchQuery],
        queryFn: ({ pageParam = 1 }) =>
            EmployeeCompleteSalaryDetails({
                userData: userdata,
                page: pageParam,
                limit: 20,
                data: {
                    search: debounceSearchQuery,
                    month: date.month,
                    year: date.year,
                }
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const currentPage = Number(lastPage.page);
            const limit = Number(lastPage.limit);
            const total = Number(lastPage.total);

            const loadedAmount = currentPage * limit;
            console.log("limit", limit)
            console.log("total", total)
            console.log("currentPage", currentPage)
            console.log("loadedAmount", loadedAmount)

            return loadedAmount < total ? currentPage + 1 : undefined;
        },
    });
    const DATA = data?.pages?.flatMap(page => page.data) || [];
    const SALARY_DATA = data?.pages?.[0]?.salary?.[0] || [];



    const OUTSTANDING_PANALTY_DATA = useQuery({
        queryKey: ['EmployeePanaltyDetailss', userdata, TempData.employee_id, TempData.month, TempData.year],
        queryFn: () => EmployeePanaltyDetails({
            employee_id: TempData.employee_id,
            month: TempData.month,
            year: TempData.year,
            userData: userdata,
        }),
        enabled: !!TempData.employee_id,
        keepPreviousData: false,
    });


    const BANK_INFO = useQuery({
        queryKey: ['Bank_Info', userdata, TempData],
        queryFn: () => BankDetails({
            EmployeeId: TempData.employee_id,
            userData: userdata,
        }),
        enabled: !!TempData.employee_id,
    });



    const TABLE_DATA = useMemo(() => {
        const sourceList = DATA || [];
        if (!sourceList || !Array.isArray(sourceList)) return [];
        return sourceList.map((e) => ({
            employee_name: e.employee_name,
            leave_count: e.leave_days,
            leave_req_count: e.leave_requests,
            absents_count: e.absentee_days,
            present_count: e.present_days,
            holiday_count: e.holidays,
            half_day: e.half_days,
            work_off: e.work_off,
            work_duration: e.working_days,
            ctc: Number(e.ctc_yearly),
            monthly_salary: Number(e.monthly_salary),
            final_monthly_salary: Number(e.total_monthly_salary),
            payment_status: e?.paymentStatus || "pending",
            penalty: e?.isPanalty || "No",
            add_stamp: e.add_stamp,
            components: e.components,
            employee_id: e.employee_id,
            month: e.month,
            year: e.year
        }));
    }, [DATA]);




    const HEADER_DATA = [
        { id: 1, title: "Total Salary", amount: Number(SALARY_DATA?.total_salary), icon: <TotalSalaryIcon color={COLORS.primary} width={30} height={30} /> },
        { id: 2, title: "Salary Payable", amount: Number(SALARY_DATA?.salary_pay), icon: <SalaryPayableIcon color={COLORS.primary} width={30} height={30} /> },
        { id: 3, title: "Total Paid", amount: Number(SALARY_DATA?.total_paid), icon: <TotalPaidIcon color={COLORS.primary} width={30} height={30} /> },
        { id: 4, title: "Total Hold", amount: Number(SALARY_DATA?.total_hold), icon: <TotalHoldIcon color={COLORS.primary} width={30} height={30} /> },
        { id: 5, title: "Total Pending", amount: Number(SALARY_DATA?.total_pending), icon: <TotalPendingIcon color={COLORS.primary} width={30} height={30} /> },
    ]

    const handleDetails = async (props) => {
        const payload = {
            employee_id: props.data.employee_id, month: props.data.month, year: props.data.year
        }
        setTemData(payload);
        setPayrollData({
            date: new Date(props.data?.add_stamp).toLocaleDateString(),
            employee_name: props.data?.employee_name,
            ctc: Number(props.data?.ctc),
            monthly_salary: Number(props.data?.monthly_salary),
            payment_status: props.data?.payment_status || 'pending',
            components: props.data?.components
        });
        setVisible(props.type)
    }



    useEffect(() => {
        const loadYears = () => {
            const yearsArray = [];
            for (let i = 2025; i <= latest_years; i++) {
                if (i < 2040) {
                    yearsArray.push({ id: i, name: i?.toString() });
                }
            }
            SETYEARS(yearsArray);
            // props.setDate(prev => ({
            //     ...prev,
            //     year: latest_years
            // }));
        };

        loadYears();

        // const currentMonthObj = MONTH_NAMES.find(m => parseInt(m.id) === currentMonth);
        // props.setDate(prev => ({
        //     ...prev,
        //     month: currentMonthObj?.id
        // }));
    }, [latest_years]);

    return (
        <View style={{ gap: 15, }}>
            <View >
                <TextInput
                    onChange={e => setSearchQuery(e.nativeEvent.text)}
                    value={searchQuery}
                    placeholderTextColor={'black'}
                    cursorColor={'black'}
                    placeholder="Search..."
                    style={{
                        backgroundColor: 'white',
                        paddingHorizontal: 15,
                        height: 50,
                        borderRadius: 10,
                        fontFamily: 'Poppins-Regular',
                        fontSize: 13,
                        color: 'black',
                    }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, }}>

                <View style={{ flex: 1 }}>
                    <CustomNativeDropdown
                        mode={true}
                        keyField="id"
                        valueField="name"
                        modeType={'reportingManager'}
                        enableDefaultOption={true}
                        placeholder={'Select Month'}
                        value={date.month}
                        onValueChange={val => {
                            setDate(prev => ({
                                ...prev,
                                month: val?.key
                            }));
                        }}
                        datas={MONTH_NAMES}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <CustomNativeDropdown
                        mode={true}
                        keyField="id"
                        valueField="name"
                        modeType={'reportingManager'}
                        enableDefaultOption={true}
                        placeholder={'Select Year'}
                        value={date.year}
                        onValueChange={val => {
                            setDate(prev => ({
                                ...prev,
                                year: val?.key
                            }));
                        }}
                        datas={YEARS}
                    />
                </View>
            </View>
            <Skeleton isLoading={isLoading} layout={getLayout({ length: 2, height: 566 })}>
                <FlatList
                    data={TABLE_DATA}
                    ListHeaderComponent={<MyHeader data={HEADER_DATA} />}
                    renderItem={(item) => getTableUI({ item, handleDetails })}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ gap: 15, paddingBottom: bottomHeight() + 300, }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={refetch}
                            colors={['black']}
                        />
                    }
                    ListEmptyComponent={<EmptyMessage />}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <ActivityIndicator size="large" color="black" style={{ marginVertical: 20 }} />
                        ) : null
                    }
                />
            </Skeleton>

            <CheckOutstandingPenaltiesSheet data={OUTSTANDING_PANALTY_DATA?.data?.data} loading={OUTSTANDING_PANALTY_DATA.isLoading} visible={visible == BUTTON_NAMES[0]} setVisible={() => setVisible(null)} />

            <ViewDetailedReportsSheet data={PayrollData || []} visible={visible == BUTTON_NAMES[1]} setVisible={() => setVisible(null)} />

            <InitiateEmployeePaymentSheet totalSalary={totalComponentsAmount} loading={BANK_INFO.isLoading} data={BANK_INFO?.data?.data[0]} visible={visible == BUTTON_NAMES[2]} setVisible={() => setVisible(null)} />

        </View>
    )
}

const EmployeePayDetails = () => {
    const { EmployeeSalaryDetails, EmployeePanaltyDetails } = useApi();
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [YEARS, SETYEARS] = useState([]);
    const { userdata } = useEncodedUserData();
    const [showPanaltyDetails, setShowPanaltyDetails] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const latest_years = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const {
        data,
        isLoading,
        isRefetching,
        isPending,
        refetch
    } = useQuery({
        enabled: !!selectedMonth && !!selectedYear,
        queryKey: [
            'EmployeeSalaryDetails',
            userdata,
            selectedMonth || selectedMonth?.id,
            selectedYear || selectedYear?.id
        ],
        queryFn: () =>
            EmployeeSalaryDetails({
                month: selectedMonth || selectedMonth?.id,
                year: selectedYear || selectedYear?.id,
                userData: userdata,
            }),

    });

    const {
        data: PanaltyData,
        isLoading: PanaltyDataLoading,
        isRefetching: PanaltyDataFetching,
        isPending: PanaltyDataIsLoading,
    } = useQuery({
        enabled: !!selectedMonth && !!selectedYear && !!showPanaltyDetails,
        queryKey: [
            'EmployeePanaltyDetails',
            userdata,
            selectedMonth || selectedMonth?.id,
            selectedYear || selectedYear?.id
        ],
        queryFn: () =>
            EmployeePanaltyDetails({
                month: selectedMonth || selectedMonth?.id,
                year: selectedYear || selectedYear?.id,
                userData: userdata,
            }),
    });


    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    useEffect(() => {
        const loadYears = () => {
            const yearsArray = [];
            for (let i = 2025; i <= latest_years; i++) {
                if (i < 2040) {
                    yearsArray.push({ id: i, name: i?.toString() });
                }
            }
            SETYEARS(yearsArray);

            setSelectedYear(latest_years);
        };

        loadYears();

        const currentMonthObj = MONTH_NAMES.find(m => parseInt(m.id) === currentMonth);
        setSelectedMonth(currentMonthObj?.id);
    }, [latest_years]);
    return (
        <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['black']} />}
            contentContainerStyle={{ paddingBottom: bottomHeight() }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                    <CustomNativeDropdown
                        mode={true}
                        keyField="id"
                        valueField="name"
                        modeType={'reportingManager'}
                        enableDefaultOption={true}
                        placeholder={'Select Month'}
                        value={selectedMonth}
                        onValueChange={val => { setSelectedMonth(val?.key) }}
                        datas={MONTH_NAMES}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <CustomNativeDropdown
                        mode={true}
                        keyField="id"
                        valueField="name"
                        modeType={'reportingManager'}
                        enableDefaultOption={true}
                        placeholder={'Select Year'}
                        value={selectedYear}
                        onValueChange={val => { setSelectedYear(val?.key) }}
                        datas={YEARS}
                    />
                </View>
            </View>

            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    marginTop: 20,
                }}
            >

                <Skeleton isLoading={isLoading} layout={getLayout({ length: 1, height: 400 })} >
                    {!isEmptyArray(data?.data) ? (
                        data?.data?.map((res, index) => (
                            <View key={index} style={{ width: '100%' }} >
                                <View style={styles.row}>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='SemiBold'>
                                            Absent Days
                                        </ThemedText>
                                    </View>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='Bold' color='secondary'>
                                            {res?.absentee_days}
                                        </ThemedText>

                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='SemiBold'>
                                            Half Days
                                        </ThemedText>
                                    </View>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='Bold' color='secondary'>
                                            {res?.half_days}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='SemiBold'>
                                            Holidays
                                        </ThemedText>
                                    </View>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='Bold' color='secondary'>
                                            {res?.holidays}
                                        </ThemedText>

                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='SemiBold'>
                                            Leave Days
                                        </ThemedText>

                                    </View>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='Bold' color='secondary'>
                                            {res?.leave_days}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='SemiBold'>
                                            Leave Requests
                                        </ThemedText>

                                    </View>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='Bold' color='secondary'>
                                            {res?.leave_requests}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='SemiBold'>
                                            Present Days
                                        </ThemedText>
                                    </View>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='Bold' color='secondary'>
                                            {res?.present_days}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='SemiBold'>
                                            Work Off
                                        </ThemedText>

                                    </View>
                                    <View style={styles.cell}>
                                        <ThemedText size='sm' weight='Bold' color='secondary'>
                                            {res?.work_off}
                                        </ThemedText>
                                    </View>
                                </View>

                            </View>
                        ))
                    ) : (
                        <View>
                            <EmptyMessage />
                        </View>
                    )}
                </Skeleton>


                {data?.data?.length > 0 && (
                    <ActionButton text="View Panalty" size="medium" extraStyle={{ marginTop: 20 }} onPress={() => setShowPanaltyDetails(true)} />
                )}
            </View>
            <Modal
                statusBarTranslucent
                visible={showPanaltyDetails}
                onRequestClose={() => setShowPanaltyDetails(false)}
            >
                <ImageBackground source={backgroundImage}
                    resizeMode="cover"
                    style={{ flex: 1, }}>
                    <View style={{ paddingTop: STATUS_BAR_HEIGHT(), paddingHorizontal: 15, gap: 20, flex: 1 }}>
                        <TouchableOpacity
                            onPress={() => setShowPanaltyDetails(false)}
                            style={{
                                backgroundColor: 'rgb(255, 255, 255)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 50,
                                width: 50,
                                height: 50,
                            }}
                        >
                            <Cross width={30} height={30} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Skeleton isLoading={PanaltyDataLoading} layout={getLayout({ length: 4, height: 300 })} >
                                <FlatList
                                    data={PanaltyData?.data}
                                    contentContainerStyle={{ gap: 10, paddingBottom: bottomHeight() }}
                                    showsVerticalScrollIndicator={false}
                                    renderItem={(res, i) => {
                                        return (
                                            <View
                                                key={i}
                                                style={{
                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                    borderRadius: 10,
                                                    padding: 15,
                                                    gap: 10,
                                                }}
                                            >
                                                <View>
                                                    <ThemedText size='sm' weight='SemiBold'>
                                                        Panalty Name
                                                    </ThemedText>
                                                    <ThemedText size='sm' weight='Regular' color='secondary'>
                                                        {res?.item?.penalty_name}
                                                    </ThemedText>
                                                </View>

                                                <View>
                                                    <ThemedText size='sm' weight='SemiBold'>
                                                        Panalty Amount
                                                    </ThemedText>
                                                    <ThemedText size='sm' weight='Regular' color='secondary'>
                                                        {res?.item?.penalty_amount}
                                                    </ThemedText>
                                                </View>

                                                <View>
                                                    <ThemedText size='sm' weight='SemiBold'>
                                                        Panalty Type
                                                    </ThemedText>
                                                    <ThemedText size='sm' weight='Regular' color='secondary'>
                                                        {res?.item?.penalty_type}
                                                    </ThemedText>
                                                </View>

                                                <View>
                                                    <ThemedText size='sm' weight='SemiBold'>
                                                        Panalty Remarks
                                                    </ThemedText>
                                                    <ThemedText size='sm' weight='Regular' color='secondary'>
                                                        {res?.item?.remarks}
                                                    </ThemedText>
                                                </View>

                                                <View>
                                                    <ThemedText size='sm' weight='SemiBold'>
                                                        Panalty Reason
                                                    </ThemedText>
                                                    <ThemedText size='sm' weight='Regular' color='secondary'>
                                                        {res?.item?.penalty_reason}
                                                    </ThemedText>
                                                </View>

                                                <View>
                                                    <ThemedText size='sm' weight='SemiBold'>
                                                        Panalty Status
                                                    </ThemedText>
                                                    <ThemedText size='sm' color={res?.item?.status == 1 ? 'warning' : res?.item?.status == 2 ? 'success' : res?.item?.status == 3 ? 'secondary' : 'primary'} weight='Regular' >
                                                        {res?.item?.status == 1
                                                            ? 'Pending'
                                                            : res?.item?.status == 2
                                                                ? 'Approved'
                                                                : res?.item?.status == 3 && 'Resolved'}
                                                    </ThemedText>
                                                </View>
                                            </View>
                                        )
                                    }
                                    }
                                    ListEmptyComponent={<EmptyMessage />}
                                />

                            </Skeleton>
                        </View>
                    </View>
                </ImageBackground>
            </Modal>
        </ScrollView >
    )
}


const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignSelf: 'stretch',
    },
    cell: {
        flex: 1,
        alignSelf: 'stretch',
        borderWidth: 1,
        borderColor: '#E2E2E2',
        padding: 10,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCell: {
        backgroundColor: 'transparent',
    },
    headerText: {
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        color: '#293646',
    },
});

export default PaySlip;
