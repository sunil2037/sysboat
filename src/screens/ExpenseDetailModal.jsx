import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import BottomSheet from '../Helper/BottomSheet';
import BottomSheetBase from '../Helper/BottomSheetBase';
import ThemedText from '../Helper/ThemedText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');


const formatINR = value =>
    Number(value).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const formatDate = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const formatDateTime = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    return (
        d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }) +
        '  ·  ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
};

const capitalize = str =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ') : '—';


const resolveStatus = code => {
    if (code === 1) return { label: 'Approved', color: '#00C57A', bg: '#E6FBF3' };
    if (code === 2) return { label: 'Rejected', color: '#FF4D6A', bg: '#FFF0F3' };
    return { label: 'Pending', color: '#F5A623', bg: '#FFF8EC' };
};

const paymentStatusMap = code => {
    if (code === 1) return { label: 'Released', color: '#00C57A', bg: '#E6FBF3' };
    return { label: 'Pending', color: '#F5A623', bg: '#FFF8EC' };
};


const StatusPill = ({ code, kind }) => {
    const s = resolveStatus(code);
    return (
        <View style={[pill.wrap, { backgroundColor: s.bg }]}>
            <View style={[pill.dot, { backgroundColor: s.color }]} />
            <ThemedText size='xs' weight='Bold' style={{ color: s.color }}>
                {s.label}
            </ThemedText>
        </View>
    );
};

const pill = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
    label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});

const InfoRow = ({ icon, label, value, valueColor }) => (
    <View style={row.wrap}>
        <View style={row.iconBox}>
            <Text style={row.icon}>{icon}</Text>
        </View>
        <View style={row.body}>
            <ThemedText size='xs' weight='Regular' color='secondary'>
                {label}
            </ThemedText>
            <ThemedText size='sm' weight='SemiBold' >
                {value ?? '—'}
            </ThemedText>
        </View>
    </View>
);

const row = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 11,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F5F7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 1,
    },
    icon: { fontSize: 16 },
    body: { flex: 1 },
    label: { fontSize: 11, color: '#9EA8B8', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' },
    value: { fontSize: 14, color: '#1A2240', fontWeight: '600' },
});

const SectionCard = ({ title, children }) => (
    <View style={sec.card}>
        <ThemedText size='sm' weight='SemiBold'>
            {title}
        </ThemedText>
        {children}
    </View>
);

const sec = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 4,
    },
    title: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.2,
        color: '#8C97B2',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
});


const ExpenseDetailModal = ({ visible, onClose, data }) => {
    if (!data) return null;
    const payS = paymentStatusMap(data.payment_status);

    const overallApproved = data.admin_status === 1 && (data.rm_id > 0 ? data.rm_status === 1 : true);
    const overallRejected = data.admin_status === 2 || data.rm_status === 2;
    const accentColor = overallApproved ? '#00C57A' : overallRejected ? '#FF4D6A' : '#F5A623';
    const accentBg = overallApproved ? '#E6FBF3' : overallRejected ? '#FFF0F3' : '#FFF8EC';

    return (
        <BottomSheetBase snapPoints={['100%']} isSnapPoint={true} visible={visible} onClose={onClose}  >
            <View style={{ flex: 1, gap: 20 }}>
                <View >
                    <ThemedText size='xl' weight='Bold'>
                        {data.employee_name}
                    </ThemedText>
                </View>
                <View style={[s.amountBanner, { borderLeftColor: accentColor, }]}>
                    <ThemedText weight='Medium'>
                        Total Amount
                    </ThemedText>
                    <ThemedText weight='Bold' size='lg' color='success'>
                        ₹{formatINR(data.amount)}
                    </ThemedText>
                </View>

                <SectionCard title="Expense Details">
                    <InfoRow icon="🗂️" label="Expense Type" value={capitalize(data.expense_type)} />
                    <InfoRow icon="📅" label="Expense Date" value={formatDate(data.expense_date)} />
                    <InfoRow icon="💬" label="Reason" value={data.reason} />
                    <InfoRow icon="📎" label="Document" value={data.document?.length ? `${data.document.length} file(s) attached` : 'No document'} />
                </SectionCard>

                <SectionCard title="People">
                    <InfoRow icon="👤" label="Added By" value={data.added_by_name} />
                    {data.rm_name && (
                        <InfoRow icon="🧑‍💼" label="Reporting Manager" value={data.rm_name} />
                    )}
                    {data.admin_name && (
                        <InfoRow icon="🏢" label="Admin" value={data.admin_name} />
                    )}
                </SectionCard>

                <SectionCard title="Approval Status">
                    {data.rm_id > 0 && (
                        <View style={approval.row}>
                            <View style={approval.left}>
                                <Text style={approval.roleIcon}>🧑‍💼</Text>
                                <View style={{ gap: 10 }}>
                                    <ThemedText size='sm' weight='SemiBold' >
                                        RM Approval
                                    </ThemedText>
                                    {data.rm_remark &&
                                        <ThemedText size='xs' weight='Regular' color='secondary' italic={true} >
                                            {data.rm_remark}
                                        </ThemedText>
                                    }
                                </View>
                            </View>
                            <StatusPill code={data.rm_status} />
                        </View>
                    )}
                    <View style={[approval.row, { borderBottomWidth: 0 }]}>
                        <View style={approval.left}>
                            <Text style={approval.roleIcon}>🏢</Text>
                            <View>
                                <ThemedText size='sm' weight='SemiBold' >
                                    Admin Approval
                                </ThemedText>
                                {data.admin_remark &&
                                    <ThemedText size='xs' weight='Regular' color='secondary' italic={true} >
                                        {data.admin_remark}
                                    </ThemedText>
                                }
                            </View>
                        </View>
                        <StatusPill code={data.admin_status} />
                    </View>
                </SectionCard>

                <SectionCard title="Payment">
                    <View style={[approval.row, { borderBottomWidth: 0 }]}>
                        <View style={approval.left}>
                            <Text style={approval.roleIcon}>💳</Text>
                            <View>
                                <Text style={approval.roleLabel}>Payment Status</Text>
                                {data.scheduled_pay_date ? (
                                    <Text style={approval.remark}>
                                        Scheduled: {formatDate(data.scheduled_pay_date)}
                                    </Text>
                                ) : null}
                                {data.payment_released_at ? (
                                    <Text style={approval.remark}>
                                        Released: {formatDateTime(data.payment_released_at)}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                        <View style={[pill.wrap, { backgroundColor: payS.bg }]}>
                            <View style={[pill.dot, { backgroundColor: payS.color }]} />
                            <Text style={[pill.label, { color: payS.color }]}>{payS.label}</Text>
                        </View>
                    </View>
                </SectionCard>

                <SectionCard title="Timestamps">
                    <InfoRow icon="🕐" label="Created At" value={formatDateTime(data.created_at)} />
                    <InfoRow icon="🔄" label="Last Updated" value={formatDateTime(data.updated_at)} />
                </SectionCard>

            </View>
        </BottomSheetBase>
    );
};

const approval = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F4F8',
    },
    left: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 8 },
    roleIcon: { fontSize: 18, marginRight: 10, marginTop: 1 },
    roleLabel: { fontSize: 13, fontWeight: '700', color: '#1A2240' },
    remark: { fontSize: 11, color: '#9EA8B8', marginTop: 2, fontStyle: 'italic', maxWidth: 180 },
});

const s = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 15, 40, 0.55)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#F5F7FA',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: SCREEN_HEIGHT * 0.91,
        overflow: 'hidden',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D8DCE8',
        alignSelf: 'center',
        marginBottom: 6,
    },

    // hero
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
        marginTop: 4,
        borderRadius: 18,
    },
    heroLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: { fontSize: 22, fontWeight: '800' },
    employeeName: { fontSize: 16, fontWeight: '800', color: '#1A2240', letterSpacing: 0.2 },
    expenseId: { fontSize: 12, color: '#9EA8B8', fontWeight: '600', marginTop: 1 },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: { fontSize: 13, color: '#555', fontWeight: '700' },

    amountBanner: {
        marginTop: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    amountLabel: { fontSize: 13, color: '#9EA8B8', fontWeight: '700', letterSpacing: 0.3 },
    amountValue: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },

    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
    },
});

export default ExpenseDetailModal;