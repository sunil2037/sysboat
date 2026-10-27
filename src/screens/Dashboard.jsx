import React, { useMemo } from 'react';
import {
  View,
  ImageBackground,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import backgroundImage from '../../assets/Icon/background.png';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AttendanceIcon,
  CalendarIcon,
  EmployeesIcon,
  ExpenseIcon,
  HRAttendanceIcon,
  IdCardIcon,
  LeavesIcon,
  PayrollIcon,
  PermissionIcon,
  RegisterFaceIcon,
  TeamsIcon,
  TrackLocationIcon,
} from '../Helper/IconsLoad';

import { useAuth } from '../Context/AuthContext';
import {
  BOTTOM_TAB_HEIGHT,
  STATUS_BAR_HEIGHT,
  SystemOS,
} from '../Helper/Helper';
import ThemedText from '../Helper/ThemedText';



const DASHBOARD_MODULES = [
  {
    id: 'attendance',
    label: 'Attendance',
    icon: AttendanceIcon,
    screen: 'AttendanceScreen',
    permissionKey: 'hide_attendance',
  },
  {
    id: 'leaves',
    label: 'Leaves',
    icon: LeavesIcon,
    screen: 'LeaveScreen',
    permissionKey: 'hide_leaves',
  },
  {
    id: 'hr_attendance',
    label: 'HR Attendance',
    icon: HRAttendanceIcon,
    screen: 'HRAttendance',
    permissionKey: 'hide_hrattendance',
    customCondition: ({ userType, profileData }) => {
      const HIDE_HRATTENDANCE =
        (userType === 'employee' &&
          (profileData?.isFaceRegisterd === true ||
            profileData?.permission?.hr_attendance !== 1)) ||
        !(userType === 'hr' || userType === 'ceo' || userType === 'admin');
      return (
        HIDE_HRATTENDANCE
      );
    },
  },
  {
    id: 'team',
    label: 'Team',
    icon: TeamsIcon,
    screen: 'TeamScreen',
    permissionKey: 'hide_team',
  },
  {
    id: 'face',
    label: 'Register Faces',
    icon: RegisterFaceIcon,
    screen: 'FaceRecognitionScreen',
    customCondition: ({ userType, profileData }) => {
      const HIDE_FACE_RECOGNITION =
        (userType === 'employee' &&
          (profileData?.isFaceRegisterd === true ||
            profileData?.permission?.face_detection !== 1)) ||
        !(userType === 'hr' || userType === 'ceo' || userType === 'admin');
      return (
        SystemOS() && !profileData?.permission?.hide_register_face &&
        HIDE_FACE_RECOGNITION
      );
    },
  },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: PayrollIcon,
    screen: 'PayrollScreen',
    permissionKey: 'hide_payroll',
  },
  {
    id: 'holiday',
    label: 'Holiday Calendar',
    icon: CalendarIcon,
    screen: 'HolidayScreen',
    permissionKey: 'hide_holiday_calendar',
  },
  {
    id: 'idcard',
    label: 'Id Card',
    icon: IdCardIcon,
    screen: 'VisitingIdScreen',
    permissionKey: 'hide_id_card',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: ExpenseIcon,
    screen: 'ExpensesScreen',
    permissionKey: 'hide_expenses',
  },
  {
    id: 'track',
    label: 'Track Employees',
    icon: TrackLocationIcon,
    screen: 'EmployeeLocator',
    permissionKey: 'hide_track_employees',
  },
  {
    id: 'permission',
    label: 'Permission',
    icon: PermissionIcon,
    screen: 'Permission',
    roles: ['admin', 'ceo', 'company_admin', 'hr'],
    permissionKey: 'hide_permissions',
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: EmployeesIcon,
    screen: 'Employees',
    roles: ['admin', 'ceo', 'company_admin', 'hr'],
    permissionKey: 'hide_employees',
  },
];



const filterModules = (modules, context) => {
  const { permissions, userType } = context;

  return modules.filter(module => {
    if (module.permissionKey && permissions?.[module.permissionKey]) {
      return false;
    }

    if (module.roles && !module.roles.includes(userType)) {
      return false;
    }

    if (module.customCondition && module.customCondition(context)) {
      return false;
    }

    return true;
  });
};



const Dashboard = ({ navigation }) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={styles.bg}
      >
        <View style={{ paddingTop: STATUS_BAR_HEIGHT() }}>
          <View style={styles.header}>
            <ThemedText size="xl" weight="Medium">
              Dashboard
            </ThemedText>
          </View>

          <View style={styles.gridWrapper}>
            <Grid navigation={navigation} />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};



const Grid = React.memo(({ navigation }) => {
  const { userType, profileData, permissions } = useAuth();

  const data = useMemo(() => {
    const modules = filterModules(DASHBOARD_MODULES, {
      userType,
      profileData,
      permissions,
    });

    return modules.map(item => ({
      id: item.id,
      value: item.label,
      icon: (
        <item.icon color="#CA282C" width={30} height={30} />
      ),
      screenName: item.screen,
    }));
  }, [userType, profileData, permissions]);

  const screenWidth = Dimensions.get('window').width - 40;
  const numColumns = 2;
  const gap = 8;

  const itemSize = (screenWidth - gap) / numColumns;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate(item.screenName)}
      style={[styles.itemContainer, { width: itemSize, height: itemSize }]}
    >
      <View style={styles.iconWrapper}>
        {item.icon}
      </View>

      <ThemedText size="sm" weight="Medium" style={styles.label}>
        {item.value}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      numColumns={numColumns}
      columnWrapperStyle={{ gap }}
      contentContainerStyle={{ gap, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    />
  );
});



const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  gridWrapper: {
    marginTop: 20,
    alignItems: 'center',
    paddingBottom: BOTTOM_TAB_HEIGHT * 2,
  },
  itemContainer: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    padding: 10,
  },
  iconWrapper: {
    backgroundColor: '#FFF2F2',
    height: 60,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 10,
  },
  label: {
    textAlign: 'center',
  },
});

export default Dashboard;