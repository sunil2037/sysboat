import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ImageBackground,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';

import backgroundImage from '../../../assets/Icon/background.png';
import {
    bottomHeight,
    calculateDuration,
    COLORS,
    DEFAULT_IMAGE,
    formatDate,
    STATUS_BAR_HEIGHT,
    SystemOS,
    timeToDate,
} from '../../Helper/Helper';
import TopNavBar from '../../navigation/TopNavBar';
import EmptyMessage from '../../Helper/EmptyMessage';
import ThemedText from '../../Helper/ThemedText';
import FormatTime from '../../Helper/FormatTime';
import { Back, Calendar, CalendarIcon, ClockIcon, Cross, EditIcon, FilterIcon, Pen } from '../../Helper/IconsLoad';
import { DateTimePickerComponent } from '../../Helper/DateTimePicker';
import ModalMultiSelect from '../../Helper/ModalMultiSelect';
import useApi from '../../Apis/Services/ApiConfig';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActionButton } from '../../utils/ActionButton';
import FilterHRAttendance from './FilterHRAttendance';
import Skeleton, { getLayout } from '../../Helper/Skeleton';
import DateRangePick from '../../Helper/DateRangePick';
import ToastManager, { toast } from '../../Helper/ToastManager';
import { useAuth } from '../../Context/AuthContext';
import { API_BASE_URL2 } from '../../Apis/Services/ServerURL';
import { capitalizeFirstLetter } from '../../Helper/StringHelpers';


const STATUS_MAP = {
    3: { color: COLORS.text_primary, label: 'Half-Day' },
    2: { color: COLORS.text_secondary, label: 'Work Off' },
    1: { color: COLORS.success, label: 'Present' },
    0: { color: COLORS.primary, label: 'Absent' },
};

const ATTENDANCE_OPTIONS = [
    {
        id: 'in',
        name: 'In'
    },
    {
        id: 'out',
        name: 'Out'
    },
    {
        id: 'Start_break',
        name: 'Start Break'
    },
    {
        id: 'End_break',
        name: 'End Break'
    },
];

const validationSchema = Yup.object().shape({
    employee_id: Yup.number().required(),
    type: Yup.string().required(),
    date: Yup.date().required('Date is required'),
    time: Yup.date().required('Time is required'),
    reason: Yup.string().required('Reason is required'),
});

const validationSchema2 = Yup.object().shape({
    inTime: Yup.date().required(),
    outTime: Yup.date().required(),
    branch_in_type: Yup.string().required(),
    branch_out_type: Yup.string().required(),
    late_coming_type: Yup.string().required(),
    short_leave_type: Yup.string().required(),
    attendance_status: Yup.string().required(),
    status: Yup.string().required(),
    reason: Yup.string().required('Reason is required'),
});

const FAKE_DATA = [
    {
        id: '1',
        name: 'Humza Ali Mazari',
        status: 1,
        check_in_time: '09:00',
        check_out_time: '17:30',
        duration: '08:30',
    },
    {
        id: '2',
        name: 'Yuvraj Soni',
        status: 1,
        check_in_time: '09:15',
        check_out_time: '18:00',
        duration: '08:45',
    },
    {
        id: '3',
        name: 'Mukesh Soni',
        status: 0,
        check_in_time: '00:00',
        check_out_time: '00:00',
        duration: '00:00',
    },
];

const TimeInfoBox = React.memo(({ duration, inTime, outTime }) => {
    const { formatIn, formatOut } = useMemo(() => {
        const formatIn =
            inTime && inTime !== '00:00' ? FormatTime(inTime) : '00:00';
        const formatOut =
            outTime && outTime !== '00:00' && outTime !== null
                ? FormatTime(outTime)
                : '00:00';
        return { formatIn, formatOut };
    }, [inTime, outTime]);

    return (
        <View style={styles.timeInfoBox}>
            <View style={styles.timeRow}>
                <View style={styles.timeColumn}>
                    <ThemedText size="xs" weight="Medium" color="secondary">
                        Total Hours
                    </ThemedText>
                    <ThemedText size="xs" weight="SemiBold">
                        {duration || '00:00'}
                    </ThemedText>
                </View>
                <View style={styles.timeColumn}>
                    <ThemedText size="xs" weight="Medium" color="secondary">
                        Clock In & Out
                    </ThemedText>
                    <ThemedText size="xs" weight="SemiBold">
                        {formatIn} — {formatOut}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
});

const AttendanceCard = React.memo(({ item, onPress }) => {
    let statusCode = 0;
    switch (item.status) {
        case "A":
            statusCode = 0;
            break;

        case "Present":
            statusCode = 1;
            break;

        case "P":
            statusCode = 1;
            break;

        case "WO":
            statusCode = 2;

        case "HF":
            statusCode = 3;
            break;
        default:
            break;
    }
    const status = STATUS_MAP[statusCode];
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            disabled={item.attendance_id == 0}
            onPress={() => onPress(item)}
            style={[styles.card, { opacity: item.attendance_id == 0 ? 0.7 : 1 }]}
        >
            {item?.attendance_date &&
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <CalendarIcon width={16} height={16} />
                    <ThemedText size="xs" weight="SemiBold" style={styles.cardName} transform='capitalize'>
                        {item?.attendance_date}
                    </ThemedText>
                </View>
            }
            <View style={styles.cardHeader}>
                <ThemedText size="md" weight="SemiBold" style={styles.cardName} transform='capitalize'>
                    {item.first_name}
                </ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: status?.color }]}>
                    <ThemedText size="xs" weight="Medium" color="inverse" align="center">
                        {status?.label}
                    </ThemedText>
                </View>
            </View>
            <TimeInfoBox
                duration={item.duration}
                inTime={item.check_in_time}
                outTime={item.check_out_time}
            />
        </TouchableOpacity>
    );
});

const InfoSection = ({ headerTitle, isEditable = false, rows, onPress }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <ThemedText size="md" weight="SemiBold">
                {headerTitle}
            </ThemedText>
            {isEditable && (
                <TouchableOpacity onPress={onPress}>
                    <EditIcon />
                </TouchableOpacity>
            )}
        </View>
        <View style={styles.divider} />
        <View style={styles.sectionRows}>
            {rows?.map((row, i) => (
                <View key={i} style={[styles.sectionRow, { flexDirection: row?.isReason ? 'column' : 'row', alignItems: row?.isReason ? 'flex-start' : 'center' }]}>
                    {row.label ? (
                        <ThemedText size="sm" weight="Medium">
                            {row.label}
                        </ThemedText>
                    ) : null}
                    {row.value ? (
                        <ThemedText size="sm" weight="Medium" color="secondary" italic={row?.isReason}>
                            {row.value}
                        </ThemedText>
                    ) : null}
                </View>
            ))}
        </View>
    </View>
);

const LocationSection = ({ headerTitle, isEditable = false, rows, onPress }) => {
    const openInGoogleMaps = () => {
        let url = "";
        if (!rows.OutLocation.lat && !rows.OutLocation.lng) {
            url = `https://www.google.com/maps?q=${rows.InLocation.lat},${rows.InLocation.lng}`;
        } else {
            url = `https://www.google.com/maps/dir/?api=1&origin=${rows.InLocation.lat},${rows.InLocation.lng}&destination=${rows.OutLocation.lat},${rows.OutLocation.lng}&travelmode=driving`;
        }
        Linking.openURL(url).catch(err => console.warn("Couldn't load page", err));
    };
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <ThemedText size="md" weight="SemiBold">
                    {headerTitle}
                </ThemedText>
                {isEditable && (
                    <TouchableOpacity onPress={onPress}>
                        <EditIcon />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.divider} />
            <View style={styles.sectionRows}>
                <View style={styles.sectionRow}>
                    <ActionButton text={'Show Location'} size={'medium'} onPress={openInGoogleMaps} extraStyle={{ width: '100%' }} />
                </View>
            </View>
        </View>
    )
};




const DetailsSheet = ({ visible, blockEditButton, onClose, data, setFormVisible }) => {
    const isLoading = data?.isLoading;
    const Items = data?.data?.data?.[0];
    const status = STATUS_MAP[Items?.status == "Present" ? 1 : Items?.status == "half-day" ? 3 : 0];

    const PROFILE_IMAGE = Items?.profile_image ? API_BASE_URL2 + Items.profile_image : DEFAULT_IMAGE;

    const ATTENDANCE_TIMING_ROWS = [
        { label: 'Attendance Date', value: Items?.attendance_date || 'N/A' },
        { label: 'Attendance Status', value: Items?.attendance_status == 0 ? 'Pending' : 'Approved' },
        { label: 'Check In Time', value: Items?.check_in_time || 'N/A' },
        { label: 'Check Out Time', value: Items?.check_out_time || 'N/A' },
        { label: 'Duration', value: Items?.duration || 'N/A' },
        { label: 'Daily Status In', value: Items?.daily_status_in || 'N/A' },
        { label: 'Daily Status In Time', value: Items?.daily_status_intime || 'N/A' },
        { label: 'Daily Status Out', value: Items?.daily_status_out || 'N/A' },
        { label: 'Daily Status Out Time', value: Items?.daily_status_outtime || 'N/A' },
        { label: 'Late Coming Leave', value: Items?.late_coming_leaving || 'N/A' },

    ];


    const SHORT_LEAVE = [
        { label: 'Short Leave', value: Items?.short_leave == 0 ? 'Not Applied' : 'Applied' },
        { label: 'Short Leave Reason', value: Items?.short_leave_reason, isReason: true },
    ]

    const EMPLOYEE_INFO_ROWS = [
        { label: 'Employee ID', value: Items?.employee_id || 'N/A' },
        { label: 'Reporting Manager', value: Items?.rm_name || 'N/A' },
        { label: 'Department Name', value: Items?.late_coming_leaving || 'N/A' },
        { label: 'Branch In', value: Items?.branch_in_name || 'N/A' },
        { label: 'Branch Out', value: Items?.branch_out_name || 'N/A' },
    ];

    const LOCATION_INFO_ROWS = { InLocation: { lat: Items?.in_latitude, lng: Items?.in_longitude }, OutLocation: { lat: Items?.out_latitude, lng: Items?.out_longitude } };

    const REASON = [{ label: '', value: Items?.reason }];
    const RM_REMARK = [{ label: '', value: Items?.reason_rm }];
    const ADMIN_REMARK = [{ label: '', value: Items?.reason_admin }];

    return (
        <Modal statusBarTranslucent visible={visible} onRequestClose={onClose} >
            <View style={[styles.modalHeader, { paddingTop: STATUS_BAR_HEIGHT() }]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton} >
                    <Back width={20} height={20} color="#fcfcfc" />
                </TouchableOpacity>
                <ThemedText size="lg" weight="Medium">
                    Attendance Details
                </ThemedText>
            </View>
            <Skeleton isLoading={isLoading} boneColor={COLORS.border} layout={getLayout({ length: 4, height: 200, })} >
                <ScrollView
                    contentContainerStyle={[styles.detailsScroll, { paddingBottom: bottomHeight() }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.profileBlock}>
                        <Image
                            source={{ uri: PROFILE_IMAGE }}
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                        <View style={styles.profileInfo}>
                            <ThemedText size="xl" weight="SemiBold" align='center' transform='capitalize'>
                                {Items?.employee_name}
                            </ThemedText>
                            <View style={[styles.statusBadge, { backgroundColor: status?.color }]}>
                                <ThemedText size="xs" weight="Medium" color="inverse" align="center">
                                    {status?.label}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <InfoSection headerTitle="Attendance Timing" rows={ATTENDANCE_TIMING_ROWS} isEditable={blockEditButton ? false : true} onPress={setFormVisible} />
                    {Items?.short_leave != 0 &&
                        <InfoSection headerTitle="Short Leave" rows={SHORT_LEAVE} />
                    }
                    <InfoSection headerTitle="Employee Information" rows={EMPLOYEE_INFO_ROWS} />
                    <LocationSection headerTitle="Location Information" rows={LOCATION_INFO_ROWS} />
                    {REASON.value &&
                        <InfoSection headerTitle="Reason" rows={REASON} />
                    }
                    {RM_REMARK.value &&
                        <InfoSection headerTitle="RM Remark" rows={RM_REMARK} />
                    }
                    {ADMIN_REMARK.value &&
                        <InfoSection headerTitle="Admin Remark" rows={ADMIN_REMARK} />
                    }
                </ScrollView>
            </Skeleton>
        </Modal >
    )
};


const HRFormFields = ({
    handleSubmit,
    values,
    setFieldValue,
    errors,
    touched,
    loading,
    EmployeeLists
}) => {
    const [visibleDate, setVisibleDate] = useState(false);
    const [visibleTime, setVisibleTime] = useState(false);

    return (
        <View style={styles.formContainer}>
            <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Pressable onPress={() => setVisibleDate(true)} style={{ gap: 6, width: '48%' }}>
                        <ThemedText size='sm' weight='SemiBold'>
                            Date
                        </ThemedText>
                        <View style={[styles.input, errors.date && touched.date ? styles.errorBorder : null]}>
                            <ThemedText size='sm' weight='Medium'>
                                {values.date ? new Date(values.date).toLocaleDateString() : '--*--'}
                            </ThemedText>
                            <View style={styles.inputIcon}>
                                {values.date ? (
                                    <TouchableOpacity onPress={() => setFieldValue('date', '')}>
                                        <Cross color={COLORS.text_secondary} width={22} height={22} />
                                    </TouchableOpacity>
                                ) : (
                                    <Calendar color={COLORS.text_secondary} width={22} height={22} />
                                )}
                            </View>
                        </View>

                        <DateTimePickerComponent
                            modetype="date"
                            visible={visibleDate}
                            setVisible={setVisibleDate}
                            value={values.date ? new Date(values.date) : new Date()}
                            onChange={(date) => setFieldValue('date', date)}
                            error={touched.date && errors.date}
                        />
                    </Pressable>

                    <Pressable onPress={() => setVisibleTime(true)} style={{ gap: 6, width: '48%' }}>
                        <ThemedText size='sm' weight='SemiBold'>
                            Time
                        </ThemedText>
                        <View style={[styles.input, errors.time && touched.time ? styles.errorBorder : null]}>
                            <ThemedText size='sm' weight='Medium'>
                                {values.time
                                    ? new Date(values.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '--*--'}
                            </ThemedText>
                            <View style={styles.inputIcon}>
                                {values.time ? (
                                    <TouchableOpacity onPress={() => setFieldValue('time', '')}>
                                        <Cross color={COLORS.text_secondary} width={22} height={22} />
                                    </TouchableOpacity>
                                ) : (
                                    <Calendar color={COLORS.text_secondary} width={22} height={22} />
                                )}
                            </View>
                        </View>
                        <DateTimePickerComponent
                            modetype="time"
                            visible={visibleTime}
                            setVisible={setVisibleTime}
                            value={values.time ? new Date(values.time) : new Date()}
                            onChange={(time) => setFieldValue('time', time)}
                            error={touched.time && errors.time}
                        />
                    </Pressable>
                </View>

                <ModalMultiSelect
                    items={EmployeeLists}
                    selectedItems={values.employee_id}
                    onSelectedItemsChange={(selected) => setFieldValue('employee_id', selected)}
                    placeholder='Select Employee'
                    isError={touched.employee_id && errors.employee_id}
                    single
                />

                <ModalMultiSelect
                    items={ATTENDANCE_OPTIONS}
                    placeholder='Select Type'
                    selectedItems={values.type}
                    onSelectedItemsChange={(selected) => setFieldValue('type', selected)}
                    isError={touched.type && errors.type}
                    single
                />
                <View style={{ gap: 6 }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Reason
                    </ThemedText>
                    <TextInput
                        multiline
                        numberOfLines={4}
                        placeholder=""
                        value={values.reason}
                        onChangeText={(text) => setFieldValue('reason', text)}
                        placeholderTextColor={COLORS.text_secondary}
                        style={[
                            styles.input,
                            styles.textArea,
                            errors.reason && touched.reason ? styles.errorBorder : null,
                        ]}
                    />
                    {touched.reason && errors.reason && (
                        <ThemedText color='error' size='xs' weight='Medium'>{errors.reason}</ThemedText>
                    )}
                </View>
            </View>
            <ActionButton size={"large"} text={'Submit'} onPress={handleSubmit} loading={loading} />

        </View>
    );
};

const FormFields = ({
    handleSubmit,
    values,
    setFieldValue,
    isOldAttendance,
    errors,
    BranchLists,
    touched,
    loading,
    EmployeeLists
}) => {
    const BRANCH_IN_TYPES = BranchLists?.data?.records;
    const BRANCH_OUT_TYPES = BranchLists?.data?.records;

    const LATE_COMING_TYPES = [
        { name: 'Early Leaving', id: '0' },
        { name: 'Late Leaving', id: '1' },
    ]

    const SHORT_LEAVE_TYPES = [
        { name: 'Not Applied', id: '0' },
        { name: 'Applied', id: '1' },
    ]

    const ATTENDANCE_STATUS = [
        { name: 'Approve', id: '1' },
        { name: 'Pending', id: '0' },
    ]

    const STATUS = [
        { name: 'Present', id: 'Present' },
        { name: 'Half-Day', id: 'half-day' },
        { name: 'Absent', id: 'Absent' },
        { name: 'Leave Without Pay', id: 'Leave Without Pay(LWP)' },
    ]
    const [visibleInTime, setVisibleInTime] = useState(false);
    const [visibleOutTime, setVisibleOutTime] = useState(false);

    const IN_TIME = new Date(values.inTime).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
    const OUT_TIME = new Date(values.outTime).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });

    useEffect(() => {
        if (values.inTime && values.outTime) {
            let d = calculateDuration(IN_TIME, OUT_TIME);
            setFieldValue('duration', d)
        }
    }, [IN_TIME, OUT_TIME])


    return (
        <View style={styles.formContainer}>
            <View style={{ gap: 14, }}>
                {isOldAttendance &&
                    <DateRangePick single maxDate selectedRange={values.attendanceDate} rangeDate={(date) => setFieldValue('attendanceDate', date)} />
                }
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Pressable onPress={() => setVisibleInTime(true)} style={{ gap: 6, width: '48%' }}>
                        <ThemedText size='sm' weight='SemiBold'>
                            In Time
                        </ThemedText>
                        <View style={[styles.input, errors.inTime && touched.inTime ? styles.errorBorder : null]}>
                            <ThemedText size='sm' weight='Medium'>
                                {values.inTime
                                    ? new Date(values.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '--*--'}
                            </ThemedText>
                            <View style={styles.inputIcon}>
                                <ClockIcon color={COLORS.text_secondary} width={22} height={22} />
                            </View>
                        </View>
                        <DateTimePickerComponent
                            modetype="time"
                            visible={visibleInTime}
                            setVisible={setVisibleInTime}
                            value={values.inTime ? new Date(values.inTime) : new Date()}
                            onChange={(time) => setFieldValue('inTime', time)}
                            error={touched.inTime && errors.inTime}
                        />
                    </Pressable>

                    <Pressable onPress={() => setVisibleOutTime(true)} style={{ gap: 6, width: '48%' }}>
                        <ThemedText size='sm' weight='SemiBold'>
                            Out Time
                        </ThemedText>
                        <View style={[styles.input, errors.outTime && touched.outTime ? styles.errorBorder : null]}>
                            <ThemedText size='sm' weight='Medium'>
                                {values.outTime
                                    ? new Date(values.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '--*--'}
                            </ThemedText>
                            <View style={styles.inputIcon}>
                                <ClockIcon color={COLORS.text_secondary} width={22} height={22} />
                            </View>
                        </View>
                        <DateTimePickerComponent
                            modetype="time"
                            visible={visibleOutTime}
                            setVisible={setVisibleOutTime}
                            value={values.outTime ? new Date(values.outTime) : new Date()}
                            onChange={(time) => setFieldValue('outTime', time)}
                            error={touched.outTime && errors.outTime}
                        />
                    </Pressable>
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Duration
                    </ThemedText>
                    <View style={[styles.input, errors.outTime && touched.outTime ? styles.errorBorder : null]}>
                        <ThemedText size='sm' weight='Medium'>
                            {(values.inTime && values.outTime) ?
                                calculateDuration(IN_TIME, OUT_TIME)
                                : '--*--'
                            }
                        </ThemedText>
                        <View style={styles.inputIcon}>
                            <ClockIcon color={COLORS.text_secondary} width={22} height={22} />
                        </View>
                    </View>
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Branch In
                    </ThemedText>
                    <ModalMultiSelect
                        items={BRANCH_IN_TYPES}
                        selectedItems={values.branch_in_type}
                        onSelectedItemsChange={(selected) => setFieldValue('branch_in_type', selected)}
                        placeholder='--*--'
                        isError={touched.branch_in_type && errors.branch_in_type}
                        single
                    />
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Branch Out
                    </ThemedText>
                    <ModalMultiSelect
                        items={BRANCH_OUT_TYPES}
                        selectedItems={values.branch_out_type}
                        onSelectedItemsChange={(selected) => setFieldValue('branch_out_type', selected)}
                        placeholder='--*--'
                        isError={touched.branch_out_type && errors.branch_out_type}
                        single
                    />
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Late Coming
                    </ThemedText>
                    <ModalMultiSelect
                        items={LATE_COMING_TYPES}
                        selectedItems={values.late_coming_type}
                        onSelectedItemsChange={(selected) => setFieldValue('late_coming_type', selected)}
                        placeholder='--*--'
                        isError={touched.late_coming_type && errors.late_coming_type}
                        single
                    />
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Short Leave
                    </ThemedText>
                    <ModalMultiSelect
                        items={SHORT_LEAVE_TYPES}
                        selectedItems={values.short_leave_type}
                        onSelectedItemsChange={(selected) => setFieldValue('short_leave_type', selected)}
                        placeholder='--*--'
                        isError={touched.short_leave_type && errors.short_leave_type}
                        single
                    />
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Attendance Status
                    </ThemedText>
                    <ModalMultiSelect
                        items={ATTENDANCE_STATUS}
                        selectedItems={values.attendance_status}
                        onSelectedItemsChange={(selected) => setFieldValue('attendance_status', selected)}
                        placeholder='--*--'
                        isError={touched.attendance_status && errors.attendance_status}
                        single
                    />
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Status
                    </ThemedText>
                    <ModalMultiSelect
                        items={STATUS}
                        selectedItems={values.status}
                        onSelectedItemsChange={(selected) => setFieldValue('status', selected)}
                        placeholder='--*--'
                        isError={touched.status && errors.status}
                        single
                    />
                </View>


                <View style={{ gap: 6 }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Reason
                    </ThemedText>
                    <TextInput
                        multiline
                        numberOfLines={4}
                        placeholder=""
                        value={values.reason}
                        onChangeText={(text) => setFieldValue('reason', text)}
                        placeholderTextColor={COLORS.text_secondary}
                        style={[
                            styles.input,
                            styles.textArea,
                            errors.reason && touched.reason ? styles.errorBorder : null,
                        ]}
                    />
                    {touched.reason && errors.reason && (
                        <ThemedText color='error' size='xs' weight='Medium'>{errors.reason}</ThemedText>
                    )}
                </View>
            </View>
            <ActionButton size={"large"} text={'Submit'} onPress={handleSubmit} loading={loading} />
        </View>
    );
};

const RequestSheetFormFields = ({
    handleSubmit,
    values,
    setFieldValue,
    errors,
    touched,
    loading,
    EmployeeLists
}) => {

    const ATTENDANCE_STATUS = [
        { name: 'Reject', id: '2' },
        { name: 'Approve', id: '1' },
        { name: 'Pending', id: '0' },
    ]

    const STATUS = [
        { name: 'Present', id: 'Present' },
        { name: 'Half-Day', id: 'half-day' },
        { name: 'Absent', id: 'Absent' },
        { name: 'Leave Without Pay', id: 'Leave Without Pay(LWP)' },
    ]
    const [visibleInTime, setVisibleInTime] = useState(false);
    const [visibleOutTime, setVisibleOutTime] = useState(false);


    return (
        <View style={styles.formContainer}>
            <View style={{ gap: 14, }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Pressable onPress={() => setVisibleInTime(true)} style={{ gap: 6, width: '48%' }}>
                        <ThemedText size='sm' weight='SemiBold'>
                            In Time
                        </ThemedText>
                        <View style={[styles.input, errors.in_time && touched.in_time ? styles.errorBorder : null]}>
                            <ThemedText size='sm' weight='Medium'>
                                {values.in_time
                                    ? new Date(values.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '--*--'}
                            </ThemedText>
                            <View style={styles.inputIcon}>
                                <ClockIcon color={COLORS.text_secondary} width={22} height={22} />
                            </View>
                        </View>
                        <DateTimePickerComponent
                            modetype="time"
                            visible={visibleInTime}
                            setVisible={setVisibleInTime}
                            value={values.in_time ? new Date(values.in_time) : new Date()}
                            onChange={(time) => setFieldValue('in_time', time)}
                            error={touched.in_time && errors.in_time}
                        />
                    </Pressable>

                    <Pressable onPress={() => setVisibleOutTime(true)} style={{ gap: 6, width: '48%' }}>
                        <ThemedText size='sm' weight='SemiBold'>
                            Out Time
                        </ThemedText>
                        <View style={[styles.input, errors.out_time && touched.out_time ? styles.errorBorder : null]}>
                            <ThemedText size='sm' weight='Medium'>
                                {values.out_time
                                    ? new Date(values.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '--*--'}
                            </ThemedText>
                            <View style={styles.inputIcon}>
                                <ClockIcon color={COLORS.text_secondary} width={22} height={22} />
                            </View>
                        </View>
                        <DateTimePickerComponent
                            modetype="time"
                            visible={visibleOutTime}
                            setVisible={setVisibleOutTime}
                            value={values.out_time ? new Date(values.out_time) : new Date()}
                            onChange={(time) => setFieldValue('out_time', time)}
                            error={touched.out_time && errors.out_time}
                        />
                    </Pressable>
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Request Type
                    </ThemedText>
                    <ModalMultiSelect
                        items={STATUS}
                        selectedItems={values.request_type}
                        onSelectedItemsChange={(selected) => setFieldValue('request_type', selected)}
                        placeholder='--*--'
                        isError={touched.request_type && errors.request_type}
                        single
                    />
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Select RM
                    </ThemedText>
                    <ModalMultiSelect
                        items={EmployeeLists}
                        selectedItems={values.rm_id}
                        onSelectedItemsChange={(selected) => setFieldValue('rm_id', selected)}
                        placeholder='--*--'
                        isError={touched.rm_id && errors.rm_id}
                        single
                    />
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        RM Status
                    </ThemedText>
                    <ModalMultiSelect
                        items={ATTENDANCE_STATUS}
                        selectedItems={values.rm_status}
                        onSelectedItemsChange={(selected) => setFieldValue('rm_status', selected)}
                        placeholder='--*--'
                        isError={touched.rm_status && errors.rm_status}
                        single
                    />
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Select Admin
                    </ThemedText>
                    <ModalMultiSelect
                        items={EmployeeLists}
                        selectedItems={values.admin_id}
                        onSelectedItemsChange={(selected) => setFieldValue('admin_id', selected)}
                        placeholder='--*--'
                        isError={touched.admin_id && errors.admin_id}
                        single
                    />
                </View>
                <View style={{ gap: 6, }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Admin Status
                    </ThemedText>
                    <ModalMultiSelect
                        items={ATTENDANCE_STATUS}
                        selectedItems={values.admin_status}
                        onSelectedItemsChange={(selected) => setFieldValue('admin_status', selected)}
                        placeholder='--*--'
                        isError={touched.admin_status && errors.admin_status}
                        single
                    />
                </View>

                <View style={{ gap: 6 }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Reason
                    </ThemedText>
                    <TextInput
                        multiline
                        numberOfLines={4}
                        placeholder=""
                        value={values.reason}
                        onChangeText={(text) => setFieldValue('reason', text)}
                        placeholderTextColor={COLORS.text_secondary}
                        style={[
                            styles.input,
                            styles.textArea,
                            errors.reason && touched.reason ? styles.errorBorder : null,
                        ]}
                    />
                    {touched.reason && errors.reason && (
                        <ThemedText color='error' size='xs' weight='Medium'>{errors.reason}</ThemedText>
                    )}
                </View>
                <View style={{ gap: 6 }}>
                    <ThemedText size='sm' weight='SemiBold'>
                        Hr Reason
                    </ThemedText>
                    <TextInput
                        multiline
                        numberOfLines={4}
                        placeholder=""
                        value={values.reason}
                        onChangeText={(text) => setFieldValue('reason', text)}
                        placeholderTextColor={COLORS.text_secondary}
                        style={[
                            styles.input,
                            styles.textArea,
                            errors.reason && touched.reason ? styles.errorBorder : null,
                        ]}
                    />
                    {touched.reason && errors.reason && (
                        <ThemedText color='error' size='xs' weight='Medium'>{errors.reason}</ThemedText>
                    )}
                </View>
            </View>
            <ActionButton size={"large"} text={'Submit'} onPress={handleSubmit} loading={loading} />
        </View>
    );
};

const HRAttendanceSheet = React.memo(({ visible, onClose, onSubmit, loading, EmployeeLists }) => {
    const formikRef = useRef(null);

    const handleCreateAttendance = (values) => {
        onSubmit?.(values);
    };

    return (
        <Modal statusBarTranslucent visible={visible} onRequestClose={onClose} >
            <ToastManager />
            <View style={[styles.modalHeader, { paddingTop: STATUS_BAR_HEIGHT() }]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Back width={20} height={20} color="#fcfcfc" />
                </TouchableOpacity>
                <ThemedText size="lg" weight="Medium">
                    Manual Attendance
                </ThemedText>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: bottomHeight(), flex: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <Formik
                    innerRef={formikRef}
                    initialValues={{ employee_id: '', type: '', date: '', time: '', reason: '' }}
                    validationSchema={validationSchema}
                    onSubmit={handleCreateAttendance}
                >
                    {({ handleSubmit, values, setFieldValue, errors, touched }) => {
                        return (
                            <HRFormFields
                                handleSubmit={handleSubmit}
                                values={values}
                                setFieldValue={setFieldValue}
                                errors={errors}
                                touched={touched}
                                loading={loading}
                                EmployeeLists={EmployeeLists}
                            />
                        )
                    }}
                </Formik>
            </ScrollView>
        </Modal>
    );
});


const AttendanceSheet = React.memo(({ visible, setItems, showEditRequestDetailsSheet, filter, setAttendanceDateFilter, HRSingleAttendanceDetails, BranchLists, AttendanceRequestsDetail, isOldAttendance, onClose, onSubmit, loading, EmployeeLists, setAttendanceReqId }) => {
    const formikRef = useRef(null);
    const REQUESTS_DETAILS = AttendanceRequestsDetail?.data?.data || [];
    const ATTENDANCE_DETAILS = HRSingleAttendanceDetails?.data?.data?.[0] || [];


    const initialValues = {
        inTime: timeToDate(ATTENDANCE_DETAILS.check_in_time) || '',
        outTime: timeToDate(ATTENDANCE_DETAILS.check_out_time) || '',
        branch_in_type: ATTENDANCE_DETAILS.branch_id_in || '',
        branch_out_type: ATTENDANCE_DETAILS.branch_id_out || '',
        late_coming_type: ATTENDANCE_DETAILS?.late_coming_leaving?.toString() || '',
        short_leave_type: ATTENDANCE_DETAILS.short_leave_type?.toString() || '',
        attendance_status: ATTENDANCE_DETAILS.attendance_status?.toString() || '',
        status: ATTENDANCE_DETAILS.status || '',
        reason: ATTENDANCE_DETAILS.reason || '',
        duration: ATTENDANCE_DETAILS.duration || '',
        attendance_id: ATTENDANCE_DETAILS.attendance_id || '',
        attendanceDate: filter?.dateRange || ''
    };


    const handleEdit = (item) => {
        setItems(item);
        showEditRequestDetailsSheet(true);
        // setInitialValues({
        //     inTime: item?.in_time||'',
        //     outTime: item?.out_time||'',
        //     branch_in_type: item?.in_time||'',
        //     branch_out_type: item?.in_time||'',
        //     late_coming_type: item?.in_time||'',
        //     short_leave_type: item?.in_time||'',
        //     attendance_status: item?.in_time||'',
        //     status: item?.in_time||'',
        //     reason: item?.in_time||'',
        //     duration: item?.in_time||''
        // })
    };

    const handleCreateAttendance = (values) => {
        onSubmit?.(values);
    };

    const renderItem = ({ item, index }) => (
        <View
            style={{
                width: 260,
                backgroundColor: '#fff',
                marginLeft: index === 0 ? 12 : 8,
                marginRight: 8,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: COLORS.border
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText size='sm' weight='SemiBold' >
                    {capitalizeFirstLetter(item.employee_name)}
                </ThemedText>
                <ThemedText size='xs' weight='Medium' color='secondary'>
                    {item.request_date}
                </ThemedText>

            </View>

            <View
                style={{
                    height: 1,
                    backgroundColor: '#eee',
                    marginVertical: 10,
                }}
            />

            <ThemedText size='xs' weight='Medium' color='secondary'>
                RM: <ThemedText size='xs' weight='SemiBold' >
                    {item.rm_name || "Not available"}
                </ThemedText>
            </ThemedText>

            <ThemedText size='xs' weight='Medium' color='secondary'>
                Admin: <ThemedText size='xs' weight='SemiBold'>
                    {item.admin_name || "Not available"}
                </ThemedText>
            </ThemedText>


            <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <View
                    style={{
                        backgroundColor: item.rm_status ? COLORS.success : COLORS.warning,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 20,
                        marginRight: 6,
                    }}
                >
                    <ThemedText size='xs' weight='Medium' color='inverse'>
                        RM {item.rm_status ? '✔' : '⏳'}
                    </ThemedText>

                </View>

                <View
                    style={{
                        backgroundColor: item.admin_status ? COLORS.success : COLORS.warning,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 20,
                        marginRight: 6,
                    }}
                >
                    <ThemedText size='xs' weight='Medium' color='inverse'>
                        Admin {item.admin_status ? '✔' : '⏳'}
                    </ThemedText>

                </View>

            </View>

            <ActionButton onPress={() => handleEdit(item)} text={'Edit'} extraStyle={{ marginTop: 20 }} />

        </View>
    );

    return (
        <Modal statusBarTranslucent visible={visible} onRequestClose={onClose} >
            <ToastManager />
            <View style={[styles.modalHeader, { paddingTop: STATUS_BAR_HEIGHT() }]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Back width={20} height={20} color="#fcfcfc" />
                </TouchableOpacity>
                <ThemedText size="lg" weight="Medium">
                    Manual Attendance
                </ThemedText>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: bottomHeight(), }}
                showsVerticalScrollIndicator={false}
            >
                {(isOldAttendance && REQUESTS_DETAILS.length > 0) &&
                    <View style={{ borderBottomWidth: 1, borderColor: COLORS.border, paddingVertical: 10, gap: 5 }}>
                        <ThemedText size='xs' weight='SemiBold' style={{ paddingLeft: 15 }}>Requests</ThemedText>
                        <FlatList
                            data={REQUESTS_DETAILS}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={renderItem}
                            showsHorizontalScrollIndicator={false}
                            horizontal
                        />
                    </View>
                }
                <Formik
                    innerRef={formikRef}
                    initialValues={initialValues}
                    validationSchema={validationSchema2}
                    enableReinitialize
                    onSubmit={handleCreateAttendance}
                >
                    {({ handleSubmit, values, setFieldValue, errors, touched }) => {
                        useEffect(() => {
                            if (values.attendanceDate) {
                                setAttendanceDateFilter(values.attendanceDate.startDate)
                            }
                        }, [values.attendanceDate])

                        return (
                            <FormFields
                                handleSubmit={handleSubmit}
                                values={values}
                                setFieldValue={setFieldValue}
                                isOldAttendance={isOldAttendance}
                                errors={errors}
                                touched={touched}
                                loading={loading}
                                BranchLists={BranchLists}
                                EmployeeLists={EmployeeLists?.data?.data}
                            />
                        )
                    }}
                </Formik>
            </ScrollView>
        </Modal>
    );
});


const RequestSheet = React.memo(({ visible, AttendanceRequestsDetail, onClose, onSubmit, loading, EmployeeLists }) => {
    const formikRef = useRef(null);

    //     {
    //     attendanceId: 22065,
    //     in_time: 09:42,
    //     out_time: 16:37,
    //     reason: testing by yashveer soni,
    //     request_type: present,
    //     rm_id: 10,
    //     admin_id: 10,
    //     admin_status: 1,
    //     rm_status: 1,
    //     request_id: 4338,
    // }



    // {
    //     "id": 4338,
    //     "employee_id": 10,
    //     "company_id": 6,
    //     "attendance_id": 22065,
    //     "rm_status": 0,
    //     "rm_id": 0,
    //     "rm_remark": null,
    //     "admin_id": 0,
    //     "admin_status": 0,
    //     "admin_remark": null,
    //     "request_type": "present",
    //     "request_date": "2026-03-21",
    //     "in_time": "09:42:44",
    //     "out_time": "16:37:27",
    //     "status": null,
    //     "reason": "Ookkk",
    //     "reason_admin": null,
    //     "reason_rm": null,
    //     "created": "2026-04-01T04:50:24.000Z",
    //     "employee_name": "yuvi rajput-id107",
    //     "rm_name": null,
    //     "admin_name": null
    // }

    const initialValues = {
        attendanceId: AttendanceRequestsDetail?.attendance_id || '',
        in_time: timeToDate(AttendanceRequestsDetail?.in_time) || '',
        out_time: timeToDate(AttendanceRequestsDetail?.out_time) || '',
        reason: AttendanceRequestsDetail?.reason || '',
        request_type: AttendanceRequestsDetail?.request_type || '',
        rm_id: AttendanceRequestsDetail?.rm_id?.toString() || '',
        admin_id: AttendanceRequestsDetail?.admin_id?.toString() || '',
        admin_status: AttendanceRequestsDetail?.admin_status || '',
        rm_status: AttendanceRequestsDetail?.rm_status || '',
        request_id: AttendanceRequestsDetail?.id || '',
    };


    const handleEdit = (item) => {
        // setInitialValues({
        //     inTime: item?.in_time||'',
        //     outTime: item?.out_time||'',
        //     branch_in_type: item?.in_time||'',
        //     branch_out_type: item?.in_time||'',
        //     late_coming_type: item?.in_time||'',
        //     short_leave_type: item?.in_time||'',
        //     attendance_status: item?.in_time||'',
        //     status: item?.in_time||'',
        //     reason: item?.in_time||'',
        //     duration: item?.in_time||''
        // })
    };

    const handleCreateAttendance = (values) => {
        onSubmit?.(values);
    };

    const renderItem = ({ item, index }) => (
        <View
            style={{
                width: 260,
                backgroundColor: '#fff',
                marginLeft: index === 0 ? 12 : 8,
                marginRight: 8,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: COLORS.border
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText size='sm' weight='SemiBold' >
                    {capitalizeFirstLetter(item.employee_name)}
                </ThemedText>
                <ThemedText size='xs' weight='Medium' color='secondary'>
                    {item.request_date}
                </ThemedText>

            </View>

            <View
                style={{
                    height: 1,
                    backgroundColor: '#eee',
                    marginVertical: 10,
                }}
            />

            <ThemedText size='xs' weight='Medium' color='secondary'>
                RM: <ThemedText size='xs' weight='SemiBold' >
                    {item.rm_name || "Not available"}
                </ThemedText>
            </ThemedText>

            <ThemedText size='xs' weight='Medium' color='secondary'>
                Admin: <ThemedText size='xs' weight='SemiBold'>
                    {item.admin_name || "Not available"}
                </ThemedText>
            </ThemedText>


            <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <View
                    style={{
                        backgroundColor: item.rm_status ? COLORS.success : COLORS.warning,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 20,
                        marginRight: 6,
                    }}
                >
                    <ThemedText size='xs' weight='Medium' color='inverse'>
                        RM {item.rm_status ? '✔' : '⏳'}
                    </ThemedText>

                </View>

                <View
                    style={{
                        backgroundColor: item.admin_status ? COLORS.success : COLORS.warning,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 20,
                        marginRight: 6,
                    }}
                >
                    <ThemedText size='xs' weight='Medium' color='inverse'>
                        Admin {item.admin_status ? '✔' : '⏳'}
                    </ThemedText>

                </View>

            </View>

            <ActionButton onPress={() => handleEdit(item)} text={'Edit'} extraStyle={{ marginTop: 20 }} />

        </View>
    );

    return (
        <Modal statusBarTranslucent visible={visible} onRequestClose={onClose} >
            <ToastManager />
            <View style={[styles.modalHeader, { paddingTop: STATUS_BAR_HEIGHT() }]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Back width={20} height={20} color="#fcfcfc" />
                </TouchableOpacity>
                <ThemedText size="lg" weight="Medium">
                    Manual Attendance
                </ThemedText>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: bottomHeight(), }}
                showsVerticalScrollIndicator={false}
            >
                <Formik
                    innerRef={formikRef}
                    initialValues={initialValues}
                    validationSchema={validationSchema2}
                    enableReinitialize
                    onSubmit={handleCreateAttendance}
                >
                    {({ handleSubmit, values, setFieldValue, errors, touched }) => {
                        return (
                            <RequestSheetFormFields
                                handleSubmit={handleSubmit}
                                values={values}
                                setFieldValue={setFieldValue}
                                errors={errors}
                                touched={touched}
                                loading={loading}
                                EmployeeLists={EmployeeLists?.data?.data}
                            />
                        )
                    }}
                </Formik>
            </ScrollView>
        </Modal>
    );
});


const HRAttendance = ({ navigation }) => {
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [showRequestSheet, setShowRequestSheet] = useState(false);
    const [formVisible2, setFormVisible2] = useState(false);
    const [isOldAttendance, setIsOldAttendance] = useState(false);
    const [AttendanceDateFilter, setAttendanceDateFilter] = useState('');
    const { userAuthData } = useAuth();

    const [Items, setItems] = useState(null);
    const [showFilter, setShowFilter] = useState(null);
    const [filter, setFilter] = useState({
        dateRange: {
            startDate: formatDate(new Date()),
            endDate: formatDate(new Date()),
        },
        employee_id: [],
        status: 'all',
        types: 'all'
    })


    const { CompanyEmployeeLists, AttendanceDirectory, fetchAttendanceData, HRAttendanceDetails, HRAttendanceMark, CompanyBranchName, HRAttendanceEdit, AttendanceRequestsDetails } = useApi();

    const { userdata } = useEncodedUserData();


    const handleView = (item) => {
        setItems(item);
        setDetailsVisible(true);
    };


    const renderItem = ({ item }) => (
        <AttendanceCard item={item} onPress={handleView} />
    );

    const BranchLists = useQuery({
        queryKey: ['CompanyBranchName', userdata],
        queryFn: () =>
            CompanyBranchName({
                userData: userdata,
            }),
        enabled: !!userdata,
    });

    const AttendanceRequestsDetail = useQuery({
        queryKey: ['AttendanceRequestsDetails', userdata, AttendanceDateFilter, filter.employee_id, filter.dateRange.startDate],
        queryFn: () =>
            AttendanceRequestsDetails({
                attendanceDate: AttendanceDateFilter || filter.dateRange.startDate,
                employeeId: filter.employee_id,
                userData: userdata,
            }),
        enabled: !!userdata && (Object.keys(filter.employee_id)?.length || filter.employee_id.toString().length) > 0,
    });


    const EmployeeLists = useQuery({
        queryKey: ['CompanyEmployeeLists', userdata],
        queryFn: () =>
            CompanyEmployeeLists({
                userData: userdata,
                type: '',
                UserId: '',
                platformType: Platform.OS,
            }),
        enabled: !!userdata,
    });


    const employeeRefreshedData = useMemo(() => {
        return EmployeeLists?.data?.data?.filter((e) => e.id !== userAuthData?.id) || [];
    }, [EmployeeLists, userAuthData]);



    const HRSingleAttendanceDetails = useQuery({
        queryKey: ['HRSingleAttendanceDetails', userdata, Items?.attendance_id],
        queryFn: () =>
            HRAttendanceDetails({
                userData: userdata,
                attendanceId: Items?.attendance_id || 0
            }),
        enabled: !!userdata && !!Items?.attendance_id,
    });



    const AttendanceDirectoryData = useInfiniteQuery({
        queryKey: ['AttendanceDirectory', userdata, filter],
        queryFn: ({ pageParam = 1 }) =>
            AttendanceDirectory({
                page: pageParam,
                limit: 20,
                date: filter.dateRange.startDate,
                filter: filter.status,
                search: '',
                userData: userdata,
            }),
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.reduce(
                (sum, page) => sum + (page?.Attendanceemployees?.length || 0),
                0,
            );

            if (totalFetched < lastPage.total) {
                return lastPage.page + 1;
            }

            return undefined;
        },

        enabled: !!userdata && !(Object.keys(filter.employee_id)?.length || filter.employee_id.toString().length) > 0,
        refetchInterval: false,
    });

    const AttendanceSingleDirectoryData = useQuery({
        queryKey: [
            'fetchAttendanceData',
            userdata,
            filter
        ],
        queryFn: () =>
            fetchAttendanceData({
                page: '1',
                limit: 31,
                startDate: filter.dateRange.startDate,
                filter: filter.status,
                endDate: filter.dateRange.endDate,
                UserId: filter.employee_id,
                userData: userdata,
            }),
        enabled: !!userdata && (Object.keys(filter.employee_id)?.length || filter.employee_id.toString().length) > 0,
    });

    const ATTENDANCE_DATA = useMemo(() => {
        return AttendanceDirectoryData.data?.pages.flatMap(page => page.Attendanceemployees) || [];
    }, [AttendanceDirectoryData.data]);


    const loadMore = useCallback(() => {
        if (filter.employee_id == "") {
            if (AttendanceDirectoryData.hasNextPage && !AttendanceDirectoryData.isFetchingNextPage) {
                AttendanceDirectoryData.fetchNextPage();
            }
        }
    }, [AttendanceDirectoryData.hasNextPage, AttendanceDirectoryData.isFetchingNextPage, AttendanceDirectoryData.fetchNextPage]);


    const AttendanceMark = useMutation({
        mutationFn: payload => HRAttendanceMark(payload),
        onSuccess: async response => {
            toast.success(response.message);
            if ((Object.keys(filter.employee_id)?.length || filter.employee_id.toString().length) > 0) {
                await AttendanceSingleDirectoryData.refetch();
            } else {
                await AttendanceDirectoryData.refetch();
            }
        },
        onError: error => {
            toast.error(error.message);
            console.warn('Error submitting leave:', error);
        },
    });

    const HRAttendanceEdits = useMutation({
        mutationFn: payload => HRAttendanceEdit(payload),
        onSuccess: async response => {
            toast.success(response.message);
            HRSingleAttendanceDetails.refetch();
            if ((Object.keys(filter.employee_id)?.length || filter.employee_id.toString().length) > 0) {
                await AttendanceSingleDirectoryData.refetch();
            } else {
                await AttendanceDirectoryData.refetch();
            }
        },
        onError: error => {
            toast.error(error.message);
            console.warn('Error submitting leave:', error);
        },
    });


    const handleFormSubmit = (values) => {
        if (values.employee_id) {
            const Payload = {
                type: values.type,
                attendanceTime: new Date(values.time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }),
                employeeId: values.employee_id,
                attendanceDate: formatDate(new Date(values.date)),
                reason: values.reason,
                attendanceType: "hr",
                latitude: "000000",
                longitude: "000000",
                userData: userdata
            };
            AttendanceMark.mutate(Payload);
        } else {
            const Payload = {
                attendanceId: Items?.attendance_id || values.attendance_id,
                checkInTime: new Date(values.inTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }),
                checkOutTime: new Date(values.outTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }),
                duration: values.duration,
                hrReason: values.reason,
                branchIdIn: values.branch_in_type,
                branchIdOut: values.branch_out_type,
                status: values.status,
                attendance_status: values.attendance_status,
                late_coming_leaving: values.late_coming_type,
                short_leave: values.short_leave_type,
                short_leave_reason: "",
                userData: userdata
            };
            HRAttendanceEdits.mutate(Payload);
        }
    };

    const handleRequestEdit = () => {

    }



    const handleFilter = (res) => {
        setFilter(res)
    }

    const handleOldAttendance = () => {
        setIsOldAttendance(true);
        setFormVisible2(true);
    }


    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ImageBackground
                source={backgroundImage}
                resizeMode="cover"
                style={[styles.bg, { paddingTop: STATUS_BAR_HEIGHT() }]}
            >
                <ToastManager />
                <TopNavBar title="HR Attendance" navigation={navigation} />

                <View style={styles.listWrapper}>
                    {(Object.keys(filter.employee_id)?.length || filter.employee_id.toString().length) > 0 && filter.employee_id !== userAuthData.id &&
                        <ActionButton text="Old Attendance" onPress={handleOldAttendance} />
                    }
                    <Skeleton isLoading={AttendanceSingleDirectoryData.isLoading || AttendanceDirectoryData.isLoading} layout={getLayout({ length: 8, height: 112 })}>
                        <FlatList
                            data={filter.employee_id == "" ? ATTENDANCE_DATA : AttendanceSingleDirectoryData?.data?.attendance}
                            keyExtractor={(item, index) => index}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={[
                                styles.listContent,
                                { paddingBottom: bottomHeight() * 5 },
                            ]}
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.8}
                            ListEmptyComponent={<EmptyMessage />}
                        />
                    </Skeleton>
                </View>
                <View style={{
                    position: 'absolute',
                    bottom: bottomHeight(),
                    right: 15,
                    gap: 10
                }} >
                    <TouchableOpacity
                        onPress={() => setShowFilter(true)}
                        style={{
                            backgroundColor: '#CA282C',
                            width: 50,
                            height: 50,
                            borderRadius: 50,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <FilterIcon width={25} height={25} color={'white'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFormVisible(true)}
                        style={{
                            backgroundColor: '#CA282C',
                            width: 50,
                            height: 50,
                            borderRadius: 50,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Pen width={25} height={25} color={'white'} />
                    </TouchableOpacity>
                </View>

                <DetailsSheet
                    visible={detailsVisible}
                    setFormVisible={() => setFormVisible2(true)}
                    data={HRSingleAttendanceDetails}
                    onClose={() => setDetailsVisible(false)}
                    blockEditButton={filter.employee_id == userAuthData.id}
                />

                <HRAttendanceSheet
                    visible={formVisible}
                    onClose={() => setFormVisible(false)}
                    onSubmit={handleFormSubmit}
                    loading={AttendanceMark.isPending}
                    EmployeeLists={employeeRefreshedData}

                />

                <RequestSheet
                    visible={showRequestSheet}
                    onClose={() => setShowRequestSheet(false)}
                    onSubmit={handleRequestEdit}
                    EmployeeLists={EmployeeLists}
                    AttendanceRequestsDetail={Items}
                />

                <AttendanceSheet
                    visible={formVisible2}
                    onClose={() => setFormVisible2(false)}
                    onSubmit={handleFormSubmit}
                    showEditRequestDetailsSheet={() => setShowRequestSheet(true)}
                    BranchLists={BranchLists}
                    HRSingleAttendanceDetails={HRSingleAttendanceDetails}
                    setItems={setItems}
                    filter={filter}
                    setAttendanceDateFilter={setAttendanceDateFilter}
                    isOldAttendance={isOldAttendance}
                    loading={HRAttendanceEdits.isPending}
                    AttendanceRequestsDetail={AttendanceRequestsDetail}
                    EmployeeLists={EmployeeLists}
                />
                <FilterHRAttendance
                    modalVisible={showFilter}
                    isAdmin={true}
                    selectableItems={EmployeeLists}
                    selectedEmployee={filter.employee_id}
                    filterData={handleFilter}
                    onModalClose={() => setShowFilter(false)}
                />
            </ImageBackground>
        </SafeAreaView>
    );
};

export default HRAttendance;


const styles = StyleSheet.create({
    bg: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
    },

    listWrapper: {
        paddingHorizontal: 15,
        flex: 1,
    },
    listContent: {
        gap: 10,
    },

    card: {
        backgroundColor: 'white',
        padding: 14,
        borderRadius: 10,
        gap: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardName: {
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        width: 90,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },

    timeInfoBox: {
        backgroundColor: '#f8f9fc',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EAECF0',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeColumn: {
        gap: 2,
    },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 16,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 10,
        backgroundColor: '#CA282C',
        borderRadius: 50,
    },

    detailsScroll: {
        paddingHorizontal: 15,
    },
    profileBlock: {
        alignItems: 'center',
        gap: 10,
        marginTop: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    profileInfo: {
        alignItems: 'center',
        gap: 4,
    },

    section: {
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 15,
        borderRadius: 10,
        gap: 16,
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
    },
    sectionRows: {
        gap: 10,
    },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    formContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 14,
        justifyContent: 'space-between',
        flex: 1
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        height: 57,
        justifyContent: 'center',
        fontFamily: 'Poppins-Medium'
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        lineHeight: SystemOS() ? 20 : 0,
    },
    inputText: {
        color: '#6A7D94',
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
    },
    inputIcon: {
        position: 'absolute',
        right: 12,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    errorBorder: {
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    errorText: {
        color: COLORS.primary,
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        marginTop: -8,
    },
    submitButton: {
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    submitText: {
        fontFamily: 'Poppins-Medium',
        color: 'white',
        fontSize: 15,
        lineHeight: SystemOS() ? 20 : 0,
    },
});