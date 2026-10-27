import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import BottomSheetBase from '../../Helper/BottomSheetBase';
import { formatDate, SystemOS } from '../../Helper/Helper';
import Skeleton, { getLayout } from '../../Helper/Skeleton';


const STATUS_COLORS = {
  pending: { bg: '#F59E0B', label: 'Pending' },
  approved: { bg: '#10B981', label: 'Approved' },
  rejected: { bg: '#EF4444', label: 'Rejected' },
};

function resolveStatus(code) {
  if (code === 1) return STATUS_COLORS.approved;
  if (code === 2) return STATUS_COLORS.rejected;
  return STATUS_COLORS.pending;
}

function getRmStatusInfo(record) {
  if (!record?.rm_id || record.rm_id <= 0) return null;
  return resolveStatus(record.rm_status);
}

function getAdminStatusInfo(record) {
  const noRm = !record?.rm_id || record.rm_id <= 0;
  const rmApproved = record?.rm_status === 1;
  if (!noRm && !rmApproved) return null;
  return resolveStatus(record?.admin_status);
}


const StatusBadge = ({ label, color }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || 'N/A'}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const formatDateRange = (start, end) => {
  const fmt = (d) =>
    d
      ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date(d))
      : 'N/A';
  return `${fmt(start)} — ${fmt(end)}`;
};


const LeaveDetails = ({ visible, onClose, leaveSingleData, isLeaveSingleLoading, isPending }) => {
  const record = leaveSingleData?.records?.[0];

  const rmStatus = getRmStatusInfo(record);
  const adminStatus = getAdminStatusInfo(record);

  const fullName = [record?.employee_first_name, record?.employee_last_name]
    .filter(Boolean)
    .join(' ') || 'N/A';

  return (
    <BottomSheetBase visible={visible} onClose={onClose}>
      <Skeleton
        isLoading={isLeaveSingleLoading || isPending}
        layout={getLayout({ length: 1, height: 300 })}
      >
        <View style={styles.container}>

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.employeeName}>{fullName}</Text>
              <Text style={styles.leaveType}>{record?.leave_type || 'N/A'}</Text>
            </View>

            <View style={styles.badgesColumn}>
              {rmStatus && (
                <View style={styles.badgeGroup}>
                  <Text style={styles.badgeGroupLabel}>RM</Text>
                  <StatusBadge label={rmStatus.label} color={rmStatus.bg} />
                </View>
              )}
              {adminStatus && (
                <View style={styles.badgeGroup}>
                  <Text style={styles.badgeGroupLabel}>Admin</Text>
                  <StatusBadge label={adminStatus.label} color={adminStatus.bg} />
                </View>
              )}
            </View>
          </View>

          <Divider />

          <View style={styles.details}>
            <InfoRow
              label="Applied on"
              value={formatDate(record?.created)}
            />
            <InfoRow
              label="Duration"
              value={
                record?.start_date && record?.end_date
                  ? formatDateRange(record.start_date, record.end_date)
                  : null
              }
            />
            <InfoRow
              label="Total days"
              value={record?.leave_days ? `${record.leave_days} day${record.leave_days > 1 ? 's' : ''}` : null}
            />
          </View>

          <Divider />

          {record?.reason ? (
            <View style={styles.reasonBlock}>
              <Text style={styles.reasonLabel}>Reason</Text>
              <Text style={styles.reasonText}>{record.reason}</Text>
            </View>
          ) : (
            <Text style={styles.noReason}>No reason provided.</Text>
          )}

        </View>
      </Skeleton>
    </BottomSheetBase>
  );
};


const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
    gap: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  employeeName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#1A2535',
    lineHeight: 30,
    textTransform: 'capitalize',
  },
  leaveType: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#6A7D94',
    textTransform: 'capitalize',
  },

  badgesColumn: {
    gap: 8,
    alignItems: 'flex-end',
  },
  badgeGroup: {
    alignItems: 'flex-end',
    gap: 2,
  },
  badgeGroupLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#9AABB8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 50,
    minWidth: 80,
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#fff',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E8EDF2',
    marginVertical: 2,
  },

  // Info rows
  details: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#1A2535',
    minWidth: 90,
  },
  infoValue: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#6A7D94',
    flex: 1,
    flexWrap: 'wrap',
  },

  // Reason
  reasonBlock: {
    backgroundColor: '#F3F6F9',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  reasonLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#9AABB8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  reasonText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#4A5E72',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  noReason: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#9AABB8',
    fontStyle: 'italic',
  },
});

export default LeaveDetails;