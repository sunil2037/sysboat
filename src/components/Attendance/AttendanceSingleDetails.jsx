import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Animated,
    StatusBar,
    Image,
    RefreshControl,
    ToastAndroid,
} from 'react-native';
import { Back, } from '../../Helper/IconsLoad';
import { bottomHeight, COLORS, DEFAULT_IMAGE, getFontSize, STATUS_BAR_HEIGHT } from '../../Helper/Helper';
import useApi from '../../Apis/Services/ApiConfig';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import { useNavigation, useRoute } from '@react-navigation/native';
import EmptyMessage from '../../Helper/EmptyMessage';
import { API_BASE_URL2 } from '../../Apis/Services/ServerURL';
import BottomSheetGetApproved from '../../Helper/BottomSheetGetApproved';
import ToastManager, { toast } from '../../Helper/ToastManager';
import { useAuth } from '../../Context/AuthContext';
import { ActionButton } from '../../utils/ActionButton';
import useAttendanceStore from '../../Context/useAttendanceStore';



const Header = () => {
    const navigation = useNavigation();
    return (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: 'white', padding: 10, borderRadius: 50, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Back />
            </TouchableOpacity>
            <Text style={styles.statusValue}>Attendance Details</Text>
        </View>
    )
}

const Skeleton = ({ width, height, borderRadius = 8, style }) => {
    const animatedValue = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    backgroundColor: '#e2e8f0',
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

const SkeletonHeader = () => (
    <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT() }]}>
        <Header />
        <View style={styles.headerContent}>
            <Skeleton width={64} height={64} borderRadius={32} style={{ marginRight: 16 }} />
            <View>
                <Skeleton width={180} height={20} style={{ marginBottom: 8 }} />
                <Skeleton width={140} height={14} />
            </View>
        </View>

        <View style={styles.statusCard}>
            <View style={styles.statusRow}>
                <View>
                    <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
                    <Skeleton width={120} height={24} />
                </View>
                <View style={styles.dateContainer}>
                    <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
                    <Skeleton width={100} height={18} />
                </View>
            </View>
        </View>
    </View>
);

const SkeletonTabs = () => (
    <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
            {[1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.tab}>
                    <Skeleton width={60} height={16} />
                </View>
            ))}
        </View>
    </View>
);

const SkeletonAttendance = () => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Skeleton width={150} height={18} />
            <Skeleton width={80} height={28} borderRadius={20} />
        </View>

        <View style={styles.timeGrid}>
            <View style={[styles.timeCard, styles.checkInCard]}>
                <View style={styles.timeHeader}>
                    <Skeleton width={70} height={11} />
                </View>
                <Skeleton width={80} height={22} style={{ marginBottom: 8 }} />
                <Skeleton width={100} height={10} />
            </View>

            <View style={[styles.timeCard, styles.checkOutCard]}>
                <View style={styles.timeHeader}>
                    <Skeleton width={70} height={11} />
                </View>
                <Skeleton width={80} height={22} style={{ marginBottom: 8 }} />
                <Skeleton width={100} height={10} />
            </View>
        </View>

        <View style={styles.durationCard}>
            <View style={styles.durationContent}>
                <Skeleton width={120} height={14} style={{ marginBottom: 8 }} />
            </View>
            <Skeleton width={140} height={20} />
        </View>

        <View style={styles.locationSection}>
            <Skeleton width={20} height={20} borderRadius={10} style={{ marginRight: 12 }} />
            <View style={styles.locationContent}>
                <Skeleton width={70} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width='100%' height={13} style={{ marginBottom: 8 }} />
                <Skeleton width='90%' height={11} style={{ marginBottom: 4 }} />
                <Skeleton width='90%' height={11} />
            </View>
        </View>
    </View>
);

const SkeletonLeave = () => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Skeleton width={130} height={18} />
            <Skeleton width={90} height={28} borderRadius={20} />
        </View>

        <View style={styles.leaveDateCard}>
            <View style={styles.leaveDateItem}>
                <Skeleton width={70} height={11} style={{ marginBottom: 8 }} />
                <Skeleton width={100} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width={80} height={11} />
            </View>
            <View style={styles.leaveDateItem}>
                <Skeleton width={70} height={11} style={{ marginBottom: 8 }} />
                <Skeleton width={100} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width={80} height={11} />
            </View>
        </View>

        <View style={styles.infoRow}>
            <Skeleton width={80} height={14} />
            <Skeleton width={40} height={14} />
        </View>
        <View style={styles.infoRow}>
            <Skeleton width={70} height={14} />
            <Skeleton width={70} height={14} />
        </View>

        <View style={styles.remarkSection}>
            <Skeleton width={110} height={11} style={{ marginBottom: 8 }} />
            <View style={styles.remarkBox}>
                <Skeleton width='100%' height={13} />
            </View>
        </View>

        <View style={styles.remarkSection}>
            <Skeleton width={100} height={11} style={{ marginBottom: 8 }} />
            <View style={styles.adminRow}>
                <Skeleton width={20} height={20} borderRadius={10} />
                <View style={styles.adminContent}>
                    <Skeleton width={150} height={14} style={{ marginBottom: 8 }} />
                    <Skeleton width='100%' height={13} />
                </View>
            </View>
        </View>
    </View>
);

const SkeletonRequest = () => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Skeleton width={140} height={18} />
            <Skeleton width={90} height={28} borderRadius={20} />
        </View>

        <View style={styles.requestTypeCard}>
            <Skeleton width={90} height={11} style={{ marginBottom: 8 }} />
            <Skeleton width={120} height={20} style={{ marginBottom: 12 }} />
            <Skeleton width={100} height={13} />
        </View>

        <View style={styles.timeGrid}>
            <View style={[styles.timeCard, styles.checkInCard]}>
                <Skeleton width={60} height={11} style={{ marginBottom: 8 }} />
                <Skeleton width={70} height={22} />
            </View>
            <View style={[styles.timeCard, styles.checkOutCard]}>
                <Skeleton width={60} height={11} style={{ marginBottom: 8 }} />
                <Skeleton width={70} height={22} />
            </View>
        </View>

        <View style={styles.remarkSection}>
            <Skeleton width={120} height={11} style={{ marginBottom: 8 }} />
            <View style={styles.remarkBox}>
                <Skeleton width='100%' height={13} />
            </View>
        </View>

        <View style={styles.remarkSection}>
            <Skeleton width={110} height={11} style={{ marginBottom: 8 }} />
            <View style={styles.adminRow}>
                <Skeleton width={20} height={20} borderRadius={10} />
                <View style={styles.adminContent}>
                    <Skeleton width={150} height={14} style={{ marginBottom: 8 }} />
                    <Skeleton width='100%' height={13} />
                </View>
            </View>
        </View>
    </View>
);

const SkeletonHoliday = () => (
    <View style={styles.card}>
        <View style={styles.holidayHeader}>
            <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
            <View>
                <Skeleton width={100} height={18} style={{ marginBottom: 8 }} />
                <Skeleton width={110} height={13} />
            </View>
        </View>

        <View style={styles.holidayCard}>
            <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
            <Skeleton width={120} height={28} style={{ marginBottom: 8 }} />
            <Skeleton width={140} height={14} />
        </View>

        <View style={styles.noticeCard}>
            <Skeleton width={20} height={20} borderRadius={10} />
            <View style={styles.noticeContent}>
                <Skeleton width={110} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width='100%' height={12} />
            </View>
        </View>
    </View>
);

const PendingForText = (data) => {
    let Type = "";
    if (data?.rm_id > 0 && data?.admin_id == 0) {
        if (data?.rm_status == 0) {
            Type = 'Pending For Rm';
        } else if (data?.rm_status == 1) {
            Type = 'Approved For Rm';
        }
        else if (data?.rm_status == 2) {
            Type = 'Reject For Rm';
        }
    } else {
        if (data?.admin_id == 0) {
            Type = "Pending For Admin";
        } else if (data?.admin_status == 0) {
            Type = 'Pending For Admin';
        } else if (data?.rm_status == 1) {
            Type = 'Approved For Admin';
        }
        else if (data?.rm_status == 2) {
            Type = 'Reject For Admin';
        }
    }
    return Type;
}





const AttendanceSingleScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('attendance');
    const { userdata } = useEncodedUserData();
    const route = useRoute();
    const { AttendanceApprovalCheckViewDetails, AttendanceApprovalSubmit, AttendanceReqSubmit, AttendanceDelete } = useApi();
    const [visible, setIsVisible] = useState(false);
    const { userType, permissions, userAuthData } = useAuth();
    const [RefinedData, setRefinedData] = useState({});
    const queryClient = useQueryClient();
    const attendanceTabIndex = useAttendanceStore((s) => s.attendanceTabIndex);
    const [blockAutoOpenBottomSheet, setBlockAutoOpenBottomSheet] = useState(false);



    const UserTypeGet = (data) => {
        let usertype = 'employee';
        if (data.employee_id == userAuthData?.id) {
            usertype = 'employee';
        } else if (data.rm_id > 0 && data.rm_id == userAuthData?.id && data.rm_status == 0 && data.admin_id == 0) {
            // admin_status not greater than 0 if rm_status 0 and rm_id greater than 0
            usertype = 'rm';
        } else if (['admin', 'ceo', 'company_admin', 'hr'].includes(userAuthData?.type) && data?.admin_status == 0 && ((data.rm_id > 0 && data.rm_status == 1) || data.rm_id == 0)) {
            usertype = 'admin';
        }
        return usertype
    }


    const RefinedPayload = ({ RouteData, ViewDetailsData }) => {
        let payload = {};
        if (ViewDetailsData?.request?.request_id) {
            payload.ApprovalRequests_id = ViewDetailsData?.request?.request_id;
            payload.PendingFor = PendingForText(ViewDetailsData?.request);
            payload.employee_id = ViewDetailsData?.employee?.employee_id;
            payload.usertype = UserTypeGet(ViewDetailsData?.request);
            payload.admin_status = ViewDetailsData?.request?.admin_status;
            payload.rm_status = ViewDetailsData?.request?.rm_status;
        } else {
            payload.ApprovalRequests_id = RouteData?.ApprovalRequests_id;
            payload.PendingFor = RouteData?.PendingFor;
            payload.employee_id = RouteData?.employee_id;
            payload.usertype = RouteData?.usertype;
            payload.admin_status = RouteData?.admin_status;
            payload.rm_status = RouteData?.rm_status;
        }
        return payload
    }


    const ViewDetails = useQuery({
        queryKey: [
            'AttendanceApprovalCheckViewDetailss',
            userdata,
            route.params?.data?.employee_id
        ],
        queryFn: () =>
            AttendanceApprovalCheckViewDetails({
                employeeId: route.params?.data?.employee_id,
                attendanceDate: route.params?.data?.request_date || route.params?.data?.date,
                status: route.params?.data?.status,
                userData: userdata,
            }),
        enabled: !!userdata && !!route.params?.data?.employee_id,
        keepPreviousData: false,
    });

    let data = ViewDetails?.data;


    const tabs = ['attendance', 'leave', 'request', 'holiday'];

    const enabledTabs = tabs.filter(
        (tab) => ViewDetails?.data?.[tab] !== undefined && ViewDetails?.data?.[tab]
    );

    useEffect(() => {
        if (!blockAutoOpenBottomSheet && (route.params?.OpenApproveSheet || route.params?.OpenGetApproveSheet) && (!ViewDetails.isLoading || !ViewDetails.isRefetching || !ViewDetails.isPending)) {
            setTimeout(() => {
                setBlockAutoOpenBottomSheet(true);
                setIsVisible(true)
            }, 1000);
        }
    }, [route.params?.OpenApproveSheet, route.params?.OpenGetApproveSheet, ViewDetails.isPending, ViewDetails.isLoading, ViewDetails.isRefetching, blockAutoOpenBottomSheet])


    useEffect(() => {
        if (enabledTabs.length === 0) return;

        setActiveTab(prev => {
            if (prev && enabledTabs.includes(prev)) {
                return prev;
            }
            return enabledTabs[0];
        });
    }, [enabledTabs]);



    useEffect(() => {
        let data = RefinedPayload({ RouteData: route.params.data, ViewDetailsData: ViewDetails?.data });
        setRefinedData(data);
    }, [ViewDetails?.data]);




    const showGetApproveButton = useMemo(() =>
        (attendanceTabIndex == 0 && !ViewDetails?.data?.request?.request_id && userAuthData?.id === RefinedData?.employee_id) ||
        (!permissions?.block_get_approve_button &&
            !RefinedData?.ApprovalRequests_id &&
            RefinedData?.PendingFor === 'Get Approve' &&
            userAuthData?.id === RefinedData?.employee_id),
        [permissions, RefinedData, userAuthData?.id, attendanceTabIndex]
    );



    const showApproveButton = useMemo(() =>
        attendanceTabIndex != 0 &&
        (!permissions?.block_approve_button &&
            RefinedData?.ApprovalRequests_id &&
            (RefinedData?.usertype?.toUpperCase() == 'RM' || RefinedData?.usertype?.toUpperCase() == 'ADMIN') &&
            RefinedData?.PendingFor !== 'Get Approve' &&
            ['admin', 'ceo', 'company_admin', 'hr'].includes(userType) ||
            (userType === 'employee' && RefinedData?.usertype?.toUpperCase() === 'RM')),
        [permissions, RefinedData, userType, attendanceTabIndex]
    );




    const showDeleteButton = useMemo(() =>
        attendanceTabIndex != 0 &&
        (
            RefinedData?.ApprovalRequests_id &&
            (['admin', 'ceo', 'company_admin'].includes(userType) ||
                (userType === 'hr' && RefinedData?.admin_status !== 1 && RefinedData?.rm_status !== 1))),
        [RefinedData, userType]
    );


    const {
        mutate: AttendancesDelete,
    } = useMutation({
        mutationFn: selectedDeleteId =>
            AttendanceDelete({
                userData: userdata,
                requestId: selectedDeleteId,
            }),
        onSuccess: async response => {
            if (response.status == true) {
                ToastAndroid.show(response.message, ToastAndroid.SHORT);
                queryClient.invalidateQueries({ queryKey: ['AttendancePending'] });
                queryClient.invalidateQueries({ queryKey: ['AttendanceApprovalLog'] });
                navigation.goBack();
            } else {
                toast.warn(response.message);
            }

        },
        onError: error => {
            toast.error(error.message);
        },
    });

    const {
        mutate: AttendanceReqApply,
    } = useMutation({
        mutationFn: AttendanceReqSubmit,
        onSuccess: response => {
            if (response.status == true) {
                setIsVisible(false);
                ToastAndroid.show(response.message, ToastAndroid.SHORT);
                queryClient.invalidateQueries({ queryKey: ['AttendancePending'] });
                queryClient.invalidateQueries({ queryKey: ['AttendanceApprovalLog'] });
                ViewDetails.refetch();
            } else {
                ToastAndroid.show(response.message, ToastAndroid.SHORT);
            }
        },
        onError: error => {
            console.warn('Query failed with error:', error);
            ViewDetails.refetch();
            setIsVisible(false);
            ToastAndroid.show(error.message, ToastAndroid.SHORT);
        },
    });

    const {
        mutate: ApprovalSubmitting,
    } = useMutation({
        mutationFn: AttendanceApprovalSubmit,
        onSuccess: response => {
            if (response.status == true) {
                ToastAndroid.show(response.message, ToastAndroid.SHORT);
                setIsVisible(false);
                queryClient.invalidateQueries({ queryKey: ['AttendancePending'] });
                queryClient.invalidateQueries({ queryKey: ['AttendanceApprovalLog'] });
                ViewDetails.refetch();
            } else {
                ToastAndroid.show(response.message, ToastAndroid.SHORT);
            }
        },
        onError: error => {
            console.warn('Query failed with error:', error);
            ViewDetails.refetch();
            setIsVisible(false);
            ToastAndroid.show(error.message, ToastAndroid.SHORT);
        },
    });



    const getStatusColor = (status) => {
        if (status === 'Present' || status === 'Approved') return { bg: '#dcfce7', text: '#16a34a' };
        if (status === 'Late') return { bg: '#fed7aa', text: '#ea580c' };
        if (status === 'Absent') return { bg: '#fecaca', text: '#dc2626' };
        return { bg: '#dbeafe', text: '#2563eb' };
    };


    const renderAttendance = () => (
        <View style={styles.card}>
            {data?.attendance ? (
                <>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Attendance Details</Text>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(data.attendance.status).bg }]}>
                            {/* <StatusIcon status={data.attendance.status} size={16} color={getStatusColor(data.attendance.status).text} /> */}
                            <Text style={[styles.badgeText, { color: getStatusColor(data.attendance.status).text }]}>
                                {data.attendance.status}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.timeGrid}>
                        <View style={[styles.timeCard, styles.checkInCard]}>
                            <View style={styles.timeHeader}>
                                {/* <Clock size={16} color="#16a34a" /> */}
                                <Text style={styles.timeLabel}>Check In</Text>
                            </View>
                            <Text style={styles.timeValue}>{data.attendance.check_in_time}</Text>
                            <Text style={styles.timeStatus}>{data.attendance.daily_status_in} by {data.attendance.daily_status_intime}</Text>
                        </View>

                        <View style={[styles.timeCard, styles.checkOutCard]}>
                            <View style={styles.timeHeader}>
                                {/* <Clock size={16} color="#ea580c" /> */}
                                <Text style={styles.timeLabel}>Check Out</Text>
                            </View>
                            <Text style={styles.timeValue}>{data.attendance.check_out_time || '--*--'}</Text>
                            <Text style={styles.timeStatus}>{data.attendance.daily_status_out && (data.attendance.daily_status_out + ' by ' + data.attendance.daily_status_outtime)}</Text>
                        </View>
                    </View>

                    <View style={styles.durationCard}>
                        <View style={styles.durationContent}>
                            {/* <Calendar size={20} color="#7c3aed" /> */}
                            <Text style={styles.durationLabel}>Total Duration</Text>
                        </View>
                        <Text style={styles.durationValue}>{data.attendance.duration || 'Not Available'}</Text>
                    </View>

                    <View style={styles.locationSection}>
                        {/* <MapPin size={20} color="#2563eb" /> */}
                        <View style={styles.locationContent}>
                            <Text style={styles.locationTitle}>Location</Text>
                            <Text style={styles.locationBranch}>Branch In: {data.attendance.branch_in_name || 'Not available'}</Text>
                            <Text style={styles.locationBranch}>Branch Out: {data.attendance.branch_out_name || 'Not available'}</Text>
                            <Text style={styles.locationCoords}>In: {data.attendance.in_latitude}, {data.attendance.in_longitude}</Text>
                            <Text style={styles.locationCoords}>Out: {data.attendance.out_latitude ? data.attendance.out_latitude + ', ' + data.attendance.out_longitude : 'Not available'}</Text>
                        </View>
                    </View>
                </>
            ) : (
                <EmptyMessage />
            )}
        </View>
    );

    const renderLeave = () => (
        <View style={styles.card}>
            {data?.leave ? (
                <>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Leave Details</Text>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(data.leave.final_leave_status).bg }]}>
                            {/* <StatusIcon status={data.leave.final_leave_status} size={16} color={getStatusColor(data.leave.final_leave_status).text} /> */}
                            <Text style={[styles.badgeText, { color: getStatusColor(data.leave.final_leave_status).text }]}>
                                {data.leave.final_leave_status}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.leaveDateCard}>
                        <View style={styles.leaveDateItem}>
                            <Text style={styles.leaveDateLabel}>Start Date</Text>
                            <Text style={styles.leaveDateValue}>{new Date(data.leave.start_date).toLocaleDateString()}</Text>
                            <Text style={styles.leaveHalf}>{data.leave.start_half}</Text>
                        </View>
                        <View style={styles.leaveDateItem}>
                            <Text style={styles.leaveDateLabel}>End Date</Text>
                            <Text style={styles.leaveDateValue}>{new Date(data.leave.end_date).toLocaleDateString()}</Text>
                            <Text style={styles.leaveHalf}>{data.leave.end_half}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Leave Type</Text>
                        <Text style={styles.infoValue}>{data.leave.leave_rule_name?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Duration</Text>
                        <Text style={styles.infoValue}>{data.leave.leave_day_type}</Text>
                    </View>

                    <View style={styles.remarkSection}>
                        <Text style={styles.remarkLabel}>Employee Reason</Text>
                        <View style={styles.remarkBox}>
                            <Text style={styles.remarkText}>{data.leave.employee_reason}</Text>
                        </View>
                    </View>

                    <View style={styles.remarkSection}>
                        <Text style={styles.remarkLabel}>Admin Remark</Text>
                        <View style={styles.adminRow}>
                            {/* <User size={20} color="#2563eb" /> */}
                            <View style={styles.adminContent}>
                                <Text style={styles.adminName}>{data.leave.admin_name}</Text>
                                <Text style={styles.adminRemark}>{data.leave.admin_remark}</Text>
                            </View>
                        </View>
                    </View>
                </>
            ) : (
                <EmptyMessage />
            )}
        </View>
    );

    const renderRequest = () => (
        <View style={styles.card}>
            {data?.request ? (
                <>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Request Details</Text>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(data.request.final_request_status).bg }]}>
                            {/* <StatusIcon status={data.request.final_request_status} size={16} color={getStatusColor(data.request.final_request_status).text} /> */}
                            <Text style={[styles.badgeText, { color: getStatusColor(data.request.final_request_status).text }]}>
                                {data.request.final_request_status}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.requestTypeCard}>
                        <Text style={styles.requestTypeLabel}>Request Type</Text>
                        <Text style={styles.requestTypeValue}>{data.request.request_type?.toUpperCase()}</Text>
                        <Text style={styles.requestDate}>{new Date(data.request.request_date).toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.timeGrid}>
                        <View style={[styles.timeCard, styles.checkInCard]}>
                            <Text style={styles.timeLabel}>In Time</Text>
                            <Text style={styles.timeValue}>{data.request.check_in_time}</Text>
                        </View>
                        <View style={[styles.timeCard, styles.checkOutCard]}>
                            <Text style={styles.timeLabel}>Out Time</Text>
                            <Text style={styles.timeValue}>{data.request.check_out_time}</Text>
                        </View>
                    </View>

                    <View style={styles.remarkSection}>
                        <Text style={styles.remarkLabel}>Employee Reason</Text>
                        <View style={styles.remarkBox}>
                            <Text style={styles.remarkText}>{data.request.employee_reason}</Text>
                        </View>
                    </View>

                    <View style={styles.remarkSection}>
                        <Text style={styles.remarkLabel}>Admin Response</Text>
                        <View style={styles.adminRow}>
                            {/* <User size={20} color="#2563eb" /> */}
                            <View style={styles.adminContent}>
                                <Text style={styles.adminName}>{data.request.admin_name}</Text>
                                <Text style={styles.adminRemark}>{data.request.admin_remark}</Text>
                            </View>
                        </View>
                    </View>
                </>
            ) : (
                <EmptyMessage />
            )}
        </View>
    );

    const renderHoliday = () => (
        <View style={styles.card}>
            {data?.holiday ? (
                <>
                    <View style={styles.holidayHeader}>
                        <View style={styles.holidayIconCircle}>
                            {/* <Umbrella size={24} color="#fff" /> */}
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Holiday</Text>
                            <Text style={styles.holidaySubtitle}>Celebration Day</Text>
                        </View>
                    </View>

                    <View style={styles.holidayCard}>
                        <View style={styles.holidayIconLarge}>
                            {/* <Umbrella size={48} color="#f97316" /> */}
                        </View>
                        <Text style={styles.holidayName}>{data.holiday.holiday}</Text>
                        <Text style={styles.holidayMessage}>Enjoy your day off!</Text>
                    </View>

                    <View style={styles.noticeCard}>
                        {/* <AlertCircle size={20} color="#ca8a04" /> */}
                        <View style={styles.noticeContent}>
                            <Text style={styles.noticeTitle}>Holiday Notice</Text>
                            <Text style={styles.noticeText}>This is a scheduled holiday. No attendance required.</Text>
                        </View>
                    </View>
                </>
            ) : (
                <EmptyMessage />
            )}
        </View>
    );


    if (ViewDetails.isLoading || ViewDetails?.isRefetching || ViewDetails.isPending) {
        return (
            <View style={[styles.container]}>
                <StatusBar barStyle="light-content" />
                <SkeletonHeader />
                <SkeletonTabs />
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {activeTab === 'attendance' && <SkeletonAttendance />}
                    {activeTab === 'leave' && <SkeletonLeave />}
                    {activeTab === 'request' && <SkeletonRequest />}
                    {activeTab === 'holiday' && <SkeletonHoliday />}
                </ScrollView>
            </View>
        );
    }

    const handleRefresh = () => {
        ViewDetails.refetch();
    }
    const SubmitApproval = values => {
        const inTime = values.inTime;
        const outTime = values.outTime;
        const message = values.message;
        const requestType = values.requestType || 'approve';
        const requestDay = values.requestDay || 'present';
        const short_leave = values.short_leave ? 1 : 0 || 0;
        const short_leave_reason = values.short_leave_reason || '';
        const short_leave_type = values.short_leave_type || 0;
        let attendanceReqId = data?.request?.request_id;
        let attendanceId = data?.attendance?.attendance_id;
        let pendingApproveType = RefinedData?.usertype;
        let employeeIds = route?.params?.data?.employee_id;


        if (pendingApproveType?.toUpperCase() === 'RM' || pendingApproveType?.toUpperCase() == 'ADMIN') {
            // console.log({ 'employeeIds': employeeIds, 'inTime': inTime, 'outTime': outTime, 'message': message, 'status': status, 'pendingApproveType': pendingApproveType, 'attendanceReqId': attendanceReqId, 'requestDay': requestDay });
            const payload = {
                'ApprovalRequests_id': ViewDetails?.data?.request?.ApprovalRequests_id,
                'Type': RefinedData?.usertype,
                'ApprovalStatus': values.requestType == 'approve' ? 1 : 2,
                'employee_id': employeeIds,
                'in_time': inTime,
                'out_time': outTime,
                'reason': message,
                'request_date': route.params?.data?.request_date || route.params?.data?.date,
                'request_type': values.requestDay,
                'short_leave': short_leave,
                'short_leave_type': short_leave_type,
                'short_leave_reason': short_leave_reason,
                'userData': userdata,
            }
            ApprovalSubmitting(payload);
        } else {
            // console.log({ 'employeeIds': employeeIds, 'inTime': inTime, 'outTime': outTime, 'message': message, 'attendanceId': attendanceId, 'requestType': requestType });
            AttendanceReqApply({
                userData: userdata,
                attendance_id: attendanceId,
                employee_id: employeeIds,
                in_time: inTime,
                short_leave_type: short_leave_type,
                short_leave_reason: short_leave_reason,
                short_leave: short_leave,
                out_time: outTime,
                reason: message,
                request_type: requestType,
                request_date: route.params?.data?.request_date || route.params?.data?.date,
            });
        }
    };




    return (

        <View style={[styles.container]}>

            <StatusBar barStyle="light-content" />
            <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT() }]}>
                <Header />
                <View style={styles.headerContent}>
                    <View style={styles.profileCircle}>
                        <Image source={{ uri: data?.employee?.profile_image ? API_BASE_URL2 + data?.employee?.profile_image : DEFAULT_IMAGE }} width={'100%'} height={'100%'} borderRadius={32} />
                        {/* <User size={32} color="#fff" /> */}
                    </View>
                    <View>
                        <Text style={styles.headerName}>{data?.employee.name}</Text>
                        <Text style={styles.headerSubtitle}>Employee Dashboard</Text>
                    </View>
                </View>

                <View style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <View>
                            <Text style={styles.statusLabel}>Current Status</Text>
                            <Text
                                style={[
                                    styles.statusValue,
                                    {
                                        fontSize:
                                            ((data?.label?.length || 0) > 2 ||
                                                (RefinedData?.PendingFor?.length || 0) > 2)
                                                ? 18
                                                : 24,
                                    },
                                ]}
                            >
                                {(RefinedData?.PendingFor === 'Get Approve' || RefinedData?.PendingFor === '')
                                    ? data?.label
                                    : RefinedData?.PendingFor || 'Absent'}
                            </Text>

                        </View>
                        <View style={styles.dateContainer}>
                            <Text style={styles.statusLabel}>Date</Text>
                            <Text style={styles.dateValue}>{new Date(data?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                        </View>
                    </View>
                </View>
                <View style={{}}>
                    {showGetApproveButton && (
                        <ActionButton
                            onPress={() => setIsVisible(true)}
                            text="Get Approve"
                            variant="secondary"
                        />
                    )}

                    {showApproveButton && (
                        <ActionButton
                            onPress={() => setIsVisible(true)}
                            text="Approve"
                            variant="secondary"
                        />
                    )}

                    {showDeleteButton && (
                        <ActionButton
                            onPress={() => AttendancesDelete(RefinedData?.ApprovalRequests_id)}
                            text="Delete Request"
                            loading={AttendancesDelete.isLoading}
                            variant="secondary"
                        />
                    )}
                </View>
            </View>

            <View style={styles.tabsContainer}>
                <View style={styles.tabs}>
                    {enabledTabs.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            disabled={enabledTabs.length === 1}
                            style={[
                                styles.tab,
                                (activeTab === tab || enabledTabs.length === 1) && styles.activeTab
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    (activeTab === tab || enabledTabs.length === 1) && styles.activeTabText
                                ]}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <ScrollView refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={ViewDetails?.isLoading} />} contentContainerStyle={{ paddingBottom: bottomHeight() }} style={[styles.content]} showsVerticalScrollIndicator={false}>
                {activeTab === 'attendance' && renderAttendance()}
                {activeTab === 'leave' && renderLeave()}
                {activeTab === 'request' && renderRequest()}
                {activeTab === 'holiday' && renderHoliday()}
            </ScrollView>

            <BottomSheetGetApproved
                defaultData={route.params.data}
                ViewDetailsData={data}
                loading={
                    ApprovalSubmitting.isLoading || ApprovalSubmitting.isPending || AttendanceReqApply.isLoading
                }
                SubmitApproval={SubmitApproval}
                visible={visible}
                onClose={() => {
                    setIsVisible(false)
                }}
            />

        </View>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'white',
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        marginTop: 15
    },
    buttonText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16
    },
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        ...StyleSheet.absoluteFillObject
    },
    header: {
        backgroundColor: '#CA282C',
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 25
    },
    profileCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerName: {
        fontSize: 20,
        color: '#fff',
        fontFamily: 'Poppins-Medium',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'Poppins-Regular',
    },
    statusCard: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'Poppins-Regular',
        marginBottom: 4,
    },
    statusValue: {
        fontSize: 24,
        color: '#fff',
        fontFamily: 'Poppins-Medium',
    },
    dateContainer: {
        alignItems: 'flex-end',
    },
    dateValue: {
        fontSize: 18,
        color: '#fff',
        fontFamily: 'Poppins-Medium',
    },
    tabsContainer: {
        paddingHorizontal: 15,
        marginTop: 20,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 50,
        padding: 4,

    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 50,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#CA282C',
    },
    tabText: {
        fontSize: 10,
        fontSize: 11,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Medium',
    },
    activeTabText: {
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,

    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        color: COLORS.text_secondary,
        fontFamily: 'Poppins-Medium',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
    },
    badgeText: {
        fontSize: 11,
        fontFamily: 'Poppins-Regular'
    },
    timeGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    timeCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
    },
    checkInCard: {
        backgroundColor: COLORS.background,
    },
    checkOutCard: {
        backgroundColor: COLORS.background,
    },
    timeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    timeLabel: {
        fontSize: 11,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Medium',
    },
    timeValue: {
        fontSize: 22,
        color: COLORS.text_secondary,
        fontFamily: 'Poppins-Medium',
    },
    timeStatus: {
        fontSize: 10,
        color: COLORS.text_primary,
        marginTop: 4,
        fontFamily: 'Poppins-Medium',
    },
    durationCard: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    durationContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    durationLabel: {
        fontSize: 14,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Medium',
    },
    durationValue: {
        fontSize: 20,
        color: COLORS.text_secondary,
        fontFamily: 'Poppins-Medium',

    },
    locationSection: {
        flexDirection: 'row',
        gap: 12,
    },
    locationContent: {
        flex: 1,
    },
    locationTitle: {
        fontSize: 14,
        color: COLORS.text_secondary,
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    locationBranch: {
        fontSize: 13,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Regular',
        marginBottom: 8,
    },
    locationCoords: {
        fontSize: 11,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Regular',
        marginBottom: 2,
    },
    leaveDateCard: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    leaveDateItem: {
        flex: 1,
    },
    leaveDateLabel: {
        fontSize: 11,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    leaveDateValue: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        color: COLORS.text_secondary,
    },
    leaveHalf: {
        fontSize: 11,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Medium',
        marginTop: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Medium',
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.text_secondary,
        fontFamily: 'Poppins-Regular',
    },
    remarkSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    remarkLabel: {
        fontSize: 11,
        color: COLORS.text_primary,
        marginBottom: 8,
        fontFamily: 'Poppins-Medium'
    },
    remarkBox: {
        backgroundColor: COLORS.background,
        borderRadius: 10,
        padding: 12,
    },
    remarkText: {
        fontSize: 13,
        color: COLORS.text_secondary,
        fontFamily: 'Poppins-Regular'
    },
    adminRow: {
        flexDirection: 'row',
        gap: 12,
    },
    adminContent: {
        flex: 1,
    },
    adminName: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        color: COLORS.text_secondary,
        marginBottom: 4,
    },
    adminRemark: {
        fontSize: 13,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Regular',
    },
    requestTypeCard: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    requestTypeLabel: {
        fontSize: 11,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    requestTypeValue: {
        fontSize: 20,
        color: COLORS.text_secondary,
        fontFamily: 'Poppins-Medium',
    },
    requestDate: {
        fontSize: 13,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Medium',
        marginTop: 8,
    },
    holidayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    holidayIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.text_secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    holidaySubtitle: {
        fontSize: 13,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Regular',
    },
    holidayCard: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        marginBottom: 16,
    },
    holidayIconLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,

    },
    holidayName: {
        fontSize: 28,
        color: COLORS.text_secondary,
        fontFamily: 'Poppins-Medium',
        marginBottom: 8,
    },
    holidayMessage: {
        fontSize: 14,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Regular',
    },
    noticeCard: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.text_secondary,
    },
    noticeContent: {
        flex: 1,
    },
    noticeTitle: {
        fontSize: 14,
        color: COLORS.text_secondary,
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    noticeText: {
        fontSize: 12,
        color: COLORS.text_primary,
        fontFamily: 'Poppins-Regular',
    },
});

export default AttendanceSingleScreen;