import React, { lazy, useState, useCallback, memo, Suspense, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import useAttendanceStore from '../Context/useAttendanceStore';
import AttendanceView from '../components/Attendance/AttendanceView';
import PendingView from '../components/Attendance/PendingView';
import ApprovalView from '../components/Attendance/ApprovalView';

import PaySlip from '../components/Payroll/PaySlip';
import SalarySlip from '../components/Payroll/SalarySlip';
import SalarySlipDocument from '../components/Payroll/SalarySlipDocument';

import LeaveRejected from '../components/Leave/LeaveRejected';
import LeaveReview from '../components/Leave/LeaveReview';
import LeaveApproved from '../components/Leave/LeaveApproved';
import ThemedText from './ThemedText';


const COMPONENT_MAP = {
  review: LeaveReview,
  approved: LeaveApproved,
  rejected: LeaveRejected,
  attendance: AttendanceView,
  approval: ApprovalView,
  pending: PendingView,
  payslip: PaySlip,
  salaryslip: SalarySlip,
  salaryslipdetails: SalarySlipDocument,
};

const ActiveSceneRenderer = memo(({ route, ...props }) => {
  const Component = COMPONENT_MAP[route?.key];

  if (!Component) return null;

  const componentProps = ['attendance', 'approval', 'pending'].includes(route.key)
    ? { ...props, tabName: route.key }
    : props;

  return (
    <Component {...componentProps} />
  );
});

const TabBar = memo(({ index, routes, onIndexChange }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: 'transparent',
        borderRadius: 25,
        paddingHorizontal: 0,
        marginBottom: 15,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          height: 40,
          gap: 10,
        }}
      >
        {routes.map((route, i) => {
          const isSelected = index === i;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => onIndexChange(i)}
              style={{
                paddingHorizontal: 20,
                borderRadius: 50,
                backgroundColor: isSelected ? '#CA282C' : 'transparent',
                display: 'flex',
                borderWidth: isSelected ? 0 : 1,
                borderColor: '#dbdbdbff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ThemedText color={isSelected ? 'inverse' : 'primary'} size='xs' weight='Medium'>
                {route.title}
              </ThemedText>

            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const TabViewComponent = ({
  routes,
  initialKey,
  onSendData,
  onDetailSheet,
  leavetypefilter,
  leavedatefilter,
  employeeId,
  ...props
}) => {
  const index = useAttendanceStore((s) => s.attendanceTabIndex);
  const setIndex = useAttendanceStore((s) => s.setAttendanceTabIndex);

  const [visitedTabs, setVisitedTabs] = useState(new Set([index]));

  const hasAppliedInitialKey = React.useRef(false);

  useEffect(() => {
    if (!hasAppliedInitialKey.current && initialKey) {
      const newIndex = routes.findIndex(r => r.key === initialKey);
      if (newIndex >= 0) {
        setIndex(newIndex);
        hasAppliedInitialKey.current = true;
      }
    }
  }, [initialKey, routes, setIndex]);


  useEffect(() => {
    setVisitedTabs(prev => new Set([...prev, index]));
  }, [index]);

  const handleIndexChange = useCallback((newIndex) => {
    setIndex(newIndex);
  }, [setIndex]);

  const activeRoute = routes[index];

  const sceneProps = React.useMemo(() => ({
    onSendData,
    onDetailSheet,
    leavetypefilter,
    leavedatefilter,
    employeeId,
    ...props,
  }), [onSendData, onDetailSheet, leavetypefilter, leavedatefilter, employeeId, props]);

  return (
    <View style={{ flex: 1 }}>
      <TabBar
        index={index}
        routes={routes}
        onIndexChange={handleIndexChange}
      />

      <View style={{ flex: 1 }}>
        <ActiveSceneRenderer
          key={activeRoute?.key}
          route={activeRoute}
          {...sceneProps}
        />
      </View>
    </View>
  );
};

export default memo(TabViewComponent);