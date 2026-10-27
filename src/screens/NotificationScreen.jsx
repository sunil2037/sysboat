import React, { useEffect, useCallback, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import backgroundImage from '../../assets/Icon/background.png';
import TopNavBar from '../navigation/TopNavBar';
import BottomSheetNotification from '../Helper/BottomSheetNotification';
import BottomSheetAnnouncement from '../Helper/BottomSheetAnnouncement';
import { Pen } from '../Helper/IconsLoad';
import useEncodedUserData from '../hooks/useEncodedUserData';
import useApi from '../Apis/Services/ApiConfig';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '../Helper/ToastManager';
import { useAuth } from '../Context/AuthContext';
import { bottomHeight, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import Tabs from '../components/Notification/Tabs';
import useNotificationStore from '../Context/useNotificationStore';
import { useSocket } from '../Apis/Services/SocketContext';


const SCREEN_WIDTH = Dimensions.get('window').width;

const ROUTES = [
  { key: 'notification', title: 'Notification' },
  { key: 'announcement', title: 'Announcement' },
  { key: 'policy', title: 'Policy' },
  { key: 'updates', title: 'Updates' },
  { key: 'maintenance', title: 'Maintenance' },
  { key: 'holiday', title: 'Holiday' },
  { key: 'payroll', title: 'Payroll' },
  { key: 'compliance', title: 'Compliance' },
];


const NotificationScreen = ({ navigation }) => {
  const { userType } = useAuth();
  const { userdata } = useEncodedUserData();
  const queryClient = useQueryClient();
  const socketContext = useSocket();
  const socket = socketContext?.socket;

  const [visible, setVisible] = useState(false);

  const {
    NotificationGet,
    NotificationRead,
    CompanyEmployeeLists,
    AnnouncementSend,
    NotificationSend,
    GetAnnouncements,
  } = useApi();

  const {
    notifications,
    currentIndex,
    type,
    mode,
    viewData,
    setNotifications,
    addNotification,
    markAsReadLocal,
    setCurrentIndex,
    setViewData,
    setType,
    setMode,
    resetType,
  } = useNotificationStore();


  useEffect(() => {
    if (!socket || !userdata) return;
    socket.on('receive-notification', notification => addNotification(notification));
    return () => socket.off('receive-notification');
  }, [socket, userdata]);


  const { isLoading: notificationsLoading, isPending: notificationsPending } = useQuery({
    queryKey: ['NotificationGet', userdata],
    queryFn: () => NotificationGet({ userData: userdata }),
    enabled: !!userdata,
    onSuccess: res => setNotifications(res?.status ? res.data : []),
  });

  const announcementData = useQuery({
    queryKey: ['GetAnnouncements', userdata, currentIndex],
    queryFn: () => GetAnnouncements({ userData: userdata, category: ROUTES[currentIndex]?.key, platformType: "mobile" }),
    enabled: !!userdata,
  });

  const { data: employeeList } = useQuery({
    queryKey: ['CompanyEmployeeLists', userdata],
    queryFn: () => CompanyEmployeeLists({ userData: userdata }),
    enabled: !!userdata,
  });


  const { mutate: sendAnnouncement, isLoading: sendingAnnouncement } = useMutation({
    mutationFn: payload => AnnouncementSend({ userData: userdata, ...payload }),
    onSuccess: res => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['GetAnnouncements'] });
      resetType();
    },
    onError: err => toast.error(err.message),
  });


  const markAsRead = useCallback(async id => {
    try {
      const res = await NotificationRead({ id, userData: userdata });
      if (res.status) {
        markAsReadLocal(id);
        resetType();
        toast.success('Notification marked as read');
      }
    } catch {
      toast.error('Failed to mark as read');
    }
  }, [userdata]);

  const handleSend = useCallback(values => {
    if (type === 'announcement') sendAnnouncement(values);
  }, [type, sendAnnouncement]);

  const handleViewData = useCallback((sheetType, item) => {
    setType(sheetType);
    setMode('view');
    setViewData(item);
  }, []);

  const onViewDetails = useCallback(item => {
    setVisible(true);
    setViewData('announcement', item, 'view');
  }, []);


  const handleOnChangeTabs = useCallback(tabIndex => {
    setCurrentIndex(tabIndex);
  }, [setCurrentIndex]);


  const initialLoading = notificationsLoading || notificationsPending;

  const canCompose =
    userType === 'admin' ||
    userType === 'ceo' ||
    userType === 'company_admin' ||
    userType === 'hr';


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}
      >
        <TopNavBar title="Notification" navigation={navigation} />

        <View style={{ flex: 1, paddingHorizontal: 15 }}>
          <Tabs
            routes={ROUTES}
            notifications={notifications}
            announcementData={announcementData}
            onChangeTabs={handleOnChangeTabs}
            onViewDetails={onViewDetails}
            handleViewData={handleViewData}
          />
        </View>

        {(canCompose && currentIndex == 0) && (
          <TouchableOpacity
            onPress={() => { setType(currentIndex === 0 ? 'notification' : 'announcement'); setVisible(true) }}
            style={[styles.fab, { bottom: bottomHeight(), }]}
          >
            <Pen width={25} height={25} color="white" />
          </TouchableOpacity>
        )}
      </ImageBackground>

      {type === 'notification' && (
        <BottomSheetNotification
          visible={visible}
          mode={mode}
          viewData={viewData}
          loading={initialLoading}
          markAsRead={markAsRead}
          handleSend={handleSend}
          onClose={resetType}
        />
      )}

      {type === 'announcement' && (
        <BottomSheetAnnouncement
          visible={visible}
          mode={mode}
          viewData={viewData}
          employeeList={employeeList}
          loading={sendingAnnouncement}
          handleSend={handleSend}
          onClose={resetType}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;


const styles = StyleSheet.create({
  fab: {
    backgroundColor: '#CA282C',
    position: 'absolute',

    right: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});