import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  ToastAndroid,
  StyleSheet,
  Modal,
  Image,
  Linking,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import DeviceInfo from 'react-native-device-info';
import InstagramIcon from '../../assets/Icon/instagram.png';
import FacebookIcon from '../../assets/Icon/facebook.png';
import LinkedinIcon from '../../assets/Icon/linkedin.png';


import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  WorkInfo,
  WorkWeek,
  RightIcon,
  LogoutIcon,
  PersonalInfoIcon,
  DocumentsIcon,
  Down,
  Pen,
  EditIcon,
} from '../Helper/IconsLoad';
import { useAuth } from '../Context/AuthContext';
import useApi from '../Apis/Services/ApiConfig';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import BottomSheetProfileImage from '../Helper/BottomSheetProfileImage';
import backgroundImage from '../../assets/Icon/background.png';
import { API_BASE_URL2 } from '../Apis/Services/ServerURL';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { toast } from '../Helper/ToastManager';
import { capitalizeFirstLetter } from '../Helper/StringHelpers';
import { useLogout } from '../components/Logout';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BOTTOM_TAB_HEIGHT, bottomHeight } from '../Helper/Helper';
import { LogoutLoadingPopup } from '../Helper/Popup';
import BottomSheetBase from '../Helper/BottomSheetBase';
import Skeleton from '../Helper/Skeleton';
import ThemedText from '../Helper/ThemedText';


const Profile = ({ navigation }) => {
  const [showLoadingBarOfLogout, setIsShowLoadingBarOfLogout] = useState(false);
  const { userType, profileData, permissions } = useAuth();
  const logout = useLogout();
  const [refreshing, setRefreshing] = useState(false);
  const [isLogoutPopupVisible, setIsLogoutPopupVisible] = useState(false);
  const { UploadLogo } = useApi();
  const { GetEmployeesProfile, DeleteLogo } = useApi();
  const { userdata } = useEncodedUserData();
  const [showSheet, setShowSheet] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [visible, setIsVisible] = useState(false);


  const handleImageSelect = res => {
    uploadImage(res?.file_path);
  };

  const handleEditProfile = () => {
    setShowSheet(!showSheet);
  };

  const handleImageDelete = () => {
    deleteImage({ userdata });
  };

  const {
    data: GetEmployeesProfileData,
    isError,
    isFetching,
    isLoading: profileDataLoading,
    refetch,
  } = useQuery({
    queryKey: ['GetEmployeesProfile', userdata],
    queryFn: () =>
      GetEmployeesProfile({
        type: 'Personal',
        UserId: '',
        folderName: 'EmployeesProfile',
        userData: userdata,
      }),
    enabled: !!userdata,
  });

  const {
    mutate: deleteImage,
    isPending: isDeleting,
    isError: isDeleteError,
  } = useMutation({
    mutationFn: async ({ userdata }) => {
      return await DeleteLogo({ userData: userdata });
    },
    onSuccess: async response => {
      toast.success(response.message);
      setImageUri(null);
      await refetch();
    },
    onError: error => {
      console.warn('Query failed with error:', error);
      toast.error(error.message);
    },
  });

  const profileImageUri = GetEmployeesProfileData?.data?.[0]?.profile_image
    ? API_BASE_URL2 + GetEmployeesProfileData?.data?.[0]?.profile_image
    : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';


  const showLogoutPopup = () => {
    setIsLogoutPopupVisible(true);
  };

  const hideLogoutPopup = () => {
    setIsLogoutPopupVisible(false);
  };

  const handleLogoutConfirm = async () => {
    hideLogoutPopup();
    setIsShowLoadingBarOfLogout(true);
    setTimeout(async () => {
      const status = await logout();
      setIsShowLoadingBarOfLogout(status)
    }, 1000);
  };

  const {
    mutate: uploadImage,
    isPending: isImageUploadPending,
    isError: isImageUploadError,
  } = useMutation({
    mutationFn: async (res) => {
      let payload = {
        userData: userdata,
        folderName: 'EmployeesProfileImg',
        logo: res
      }
      try {
        const response = await UploadLogo(payload);
        return response;
      } catch (error) {
        setShowSheet(false);
        throw error;
      }
    },
    onSuccess: async response => {
      ToastAndroid.show(
        response.message,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );

      await refetch();
    },
    onError: error => {
      ToastAndroid.show(error.message, ToastAndroid.SHORT, ToastAndroid.CENTER);
      console.warn('Image upload failed:', error);
      setShowSheet(false);
      toast.error(error.message);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const images = [{ url: profileImageUri }];
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <SafeAreaView style={{ flex: 1 }}>
        {/* <DocumentUploadComponent /> */}
        <BottomSheetProfileImage
          IsPending={isImageUploadPending || isFetching}
          onImageSelect={handleImageSelect}
          onImageDelete={handleImageDelete}
          data={GetEmployeesProfileData?.data?.[0]}
          visible={showSheet}
          isDeletingStatus={isDeleting}
          error={isImageUploadError}
          onClose={() => {
            setShowSheet(false);
          }}
        />

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 60,
            paddingBottom: BOTTOM_TAB_HEIGHT + 20,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['black']}
            />
          }>
          <View style={{ gap: 24 }}>
            <View style={{ alignItems: 'center', gap: 5 }}>
              <LogoutLoadingPopup isVisible={showLoadingBarOfLogout} />
              <BottomSheetBase
                visible={isLogoutPopupVisible}
                onClose={hideLogoutPopup}
                snapPoints={['40%']}
                isScrollView={false}>
                <View style={styles.logoutSheetContent}>
                  <View style={styles.logoutSheetIconContainer}>
                    <AlertIcon width={32} height={32} color="#CA282C" />
                  </View>

                  <ThemedText size="xl" weight="SemiBold" align="center" style={{ marginTop: 12 }}>
                    Log Out
                  </ThemedText>

                  <ThemedText
                    size="sm"
                    weight="Regular"
                    color="secondary"
                    align="center"
                    style={{ marginTop: 6, paddingHorizontal: 20, lineHeight: 20 }}>
                    Are you sure you want to log out? You will need to sign in again to access your account.
                  </ThemedText>

                  <View style={styles.logoutSheetBtnContainer}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.logoutConfirmBtn}
                      onPress={handleLogoutConfirm}>
                      <ThemedText customSize={15} weight="SemiBold" color="inverse">
                        Yes, Log Out
                      </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.logoutCancelBtn}
                      onPress={hideLogoutPopup}>
                      <ThemedText customSize={15} weight="Medium" color="secondary">
                        Cancel
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </BottomSheetBase>

              <Skeleton highlightColor={'#f5f5f5'} boneColor='#fff' animationType='pulse' isLoading={isFetching || isImageUploadPending || profileDataLoading} layout={[
                { key: "Profile-1", width: 96, height: 96, marginBottom: 10, borderRadius: 96, alignSelf: 'center' },
                { key: "Profile-2", width: 180, height: 30, marginBottom: 10, borderRadius: 120, alignSelf: 'center' },
                { key: "Profile-3", width: 180, height: 20, marginBottom: 6, borderRadius: 120, alignSelf: 'center' },
              ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setIsVisible(true);
                  }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 96,
                    backgroundColor: 'white'
                  }}>
                  <Image
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 96,
                    }}
                    source={{
                      uri: imageUri || profileImageUri,
                    }}
                    resizeMode={'cover'}
                  />




                  {!permissions?.block_edit_profile_button && (
                    <TouchableOpacity
                      disabled={
                        isFetching || isImageUploadPending || profileDataLoading
                      }
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: '#ffffffd8',
                        borderColor: '#787878ff',
                        borderWidth: 1,
                        borderRadius: 20,
                        padding: 5,
                      }}
                      onPress={handleEditProfile}
                    >
                      <EditIcon color={'#787878ff'} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                <ThemedText customSize={20} weight='Medium' align='center'>
                  {GetEmployeesProfileData?.data?.[0]?.first_name || 'John Doe'}
                </ThemedText>
                <ThemedText customSize={12} weight='Regular' align='center' color='secondary'>
                  {capitalizeFirstLetter(
                    GetEmployeesProfileData?.data?.[0]?.official_email_id
                      ? GetEmployeesProfileData?.data?.[0]?.official_email_id
                      : GetEmployeesProfileData?.data?.[0]?.email_id || '',
                  )}
                </ThemedText>
              </Skeleton>

            </View>
            <View style={{ gap: 5 }}>
              <View
                style={{
                  backgroundColor: '#F7F7F7',
                  padding: 12,
                  borderRadius: 20,
                }}>
                <Pressable
                  onPress={() => {
                    navigation.navigate('EditPersonalDetails');
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderColor: '#DCD7C9',
                    paddingBottom: 11,
                    paddingTop: 11,
                  }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <PersonalInfoIcon width={22} height={22} />
                    <ThemedText customSize={14} weight='Regular'>Personal</ThemedText>
                  </View>
                  <RightIcon width={22} height={22} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    navigation.navigate('WorkView');
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderColor: '#DCD7C9',
                    paddingBottom: 11,
                    paddingTop: 11,
                  }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <WorkInfo width={24} height={24} />
                    <ThemedText customSize={14} weight='Regular'>Work</ThemedText>
                  </View>
                  <RightIcon width={22} height={22} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    navigation.navigate(
                      userType == 'admin' ||
                        userType == 'ceo' ||
                        userType == 'company_admin' ||
                        userType == 'hr'
                        ? 'WorkWeekView'
                        : 'WorkWeekViewUserSide',
                    );
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 11,
                    paddingTop: 11,
                    borderBottomWidth: 1,
                    borderColor: '#DCD7C9',
                  }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <WorkWeek width={24} height={24} />
                    <ThemedText customSize={14} weight='Regular'>Work-Week</ThemedText>
                  </View>
                  <RightIcon width={22} height={22} />
                </Pressable>

                {/* {(userType == 'admin' || userType == 'ceo' || userType == 'company_admin' || userType == 'hr') && ( */}
                <Pressable
                  onPress={() => {
                    navigation.navigate('DocumentsScreen');
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 11,
                    paddingTop: 11,
                  }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <DocumentsIcon width={22} height={22} />
                    <ThemedText customSize={14} weight='Regular'>Documents</ThemedText>
                  </View>
                  <RightIcon width={22} height={22} />
                </Pressable>
                {/* )} */}
              </View>
              {Boolean(profileData?.permission?.branch_switch) && <BranchSwitch />}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={showLogoutPopup}
                style={styles.attractiveLogoutCard}>
                <View style={styles.attractiveLogoutLeft}>
                  <View style={styles.attractiveLogoutIconBadge}>
                    <LogoutIcon width={20} height={20} />
                  </View>
                  <View style={{ gap: 2 }}>
                    <ThemedText customSize={15} weight="SemiBold" customColor="#CA282C">
                      Log Out
                    </ThemedText>
                    <ThemedText customSize={11} weight="Regular" color="muted">
                      Sign out of your account
                    </ThemedText>
                  </View>
                </View>
                <RightIcon width={18} height={18} color="#CA282C" />
              </TouchableOpacity>
            </View>

          </View>
          {/* <View style={{ marginTop: 30, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Poppins-Regular', color: '#666666ff' }}>
              Version {versionName} ({versionCode}) </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => {
                Linking.openURL('https://www.instagram.com/sysboat_softwaresolutions/');
              }}>
                <Image source={InstagramIcon} style={{ width: 30, height: 30, marginRight: 10 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                Linking.openURL('https://www.facebook.com/Sysboat/');
              }}>
                <Image source={FacebookIcon} style={{ width: 30, height: 30, marginRight: 10 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                Linking.openURL('https://www.linkedin.com/in/sysboat-technology/');
              }}>
                <Image source={LinkedinIcon} style={{ width: 30, height: 30, marginRight: 10 }} />
              </TouchableOpacity>
            </View>
          </View> */}
        </ScrollView>
        {visible && (
          <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsVisible(false)}>
            <ImageViewer
              enablePreload={true}
              index={0}
              renderIndicator={() => null}
              imageUrls={images}
              enableSwipeDown={false}
              enableImageZoom={true}
              saveToLocalByLongPress={true}
            />
            <View style={{ position: 'absolute', bottom: bottomHeight(), alignSelf: 'center' }}>
              <TouchableOpacity onPress={() => setIsVisible(false)} style={{ paddingHorizontal: 20, paddingVertical: 15, borderRadius: 50, backgroundColor: '#CA282C' }}>
                <ThemedText customSize={14} weight='Regular' color='inverse'>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </View>
  );
};

const BranchSwitch = () => {
  const [branches, setBranches] = useState([
    { id: '1', name: 'Main Branch' },
    { id: '2', name: 'Downtown Branch' },
    { id: '3', name: 'Westside Branch' },
    { id: '4', name: 'Eastside Branch' },
  ]);
  const { userdata } = useEncodedUserData();
  const { CompanyBranchName, CompanychangeBranch } = useApi();
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const rotation = useSharedValue(0);
  const height = useSharedValue(60);

  const {
    data: CompanyBranchNameData,
    isError,
    isFetching,
    isLoading: CompanyBranchNameLoading,
    isRefetching: CompanyBranchNameRefetching,
    refetch,
  } = useQuery({
    queryKey: ['CompanyBranchName', userdata],
    queryFn: () =>
      CompanyBranchName({
        userData: userdata,
      }),
    enabled: !!userdata,
    staleTime: 5 * 60 * 1000,
  });

  useFocusEffect(
    useCallback(() => {
      if (!userdata) return;
      refetch();
    }, [refetch]),
  );

  const { mutate } = useMutation({
    mutationFn: async ({ branchId }) => {
      return await CompanychangeBranch({
        userData: userdata,
        branchId: branchId,
      });
    },
    onSuccess: async response => {
      toast.success(response.message);
      await refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const animatedArrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });


  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    };
  });

  const toggleExpand = () => {
    if (branches.length <= 1) return;

    setIsExpanded(!isExpanded);
    rotation.value = withSpring(isExpanded ? 0 : 180);
    height.value = withTiming(isExpanded ? 60 : 60 + branches.length * 50, {
      duration: 300,
    });
  };

  const handleBranchSelect = branch => {
    setSelectedBranch(branch.id);
    setIsExpanded(false);
    rotation.value = withSpring(0);
    height.value = withTiming(60, { duration: 300 });
    mutate({ branchId: branch.id });
  };

  const selectedBranchName =
    branches.find(b => b.id === selectedBranch)?.name || 'Select Branch';

  if (branches.length === 0) return null;

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        disabled={branches.length <= 1}>
        <View style={styles.headerContent}>
          <View style={styles.selectedBranchContainer}>
            {mutate.isLoading || mutate.isPending ? (
              <ActivityIndicator size={'large'} color={'black'} />
            ) : (
              <ThemedText customSize={14} weight='Regular' >
                {CompanyBranchNameData?.oldBranch[0]?.name ||
                  selectedBranchName}
              </ThemedText>
            )}
            {branches.length > 1 && (
              <Animated.Text style={[styles.arrow, animatedArrowStyle]}>
                <Down />
              </Animated.Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView nestedScrollEnabled={true}>
          {CompanyBranchNameLoading || CompanyBranchNameRefetching ? (
            <ActivityIndicator size="large" color="black" />
          ) : (
            CompanyBranchNameData?.records?.map(branch => (
              <TouchableOpacity
                key={branch?.id}
                style={[
                  styles.branchItem,
                  selectedBranch === branch?.id && styles.selectedBranchItem,
                ]}
                onPress={() => handleBranchSelect(branch)}>
                <ThemedText customSize={14} weight='Regular' >
                  {branch?.name}
                </ThemedText>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  attractiveLogoutCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#CA282C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  attractiveLogoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attractiveLogoutIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoutSheetIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutSheetBtnContainer: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  logoutConfirmBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CA282C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#CA282C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  logoutCancelBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 15,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    lineHeight: 20,
  },
  selectedBranchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  selectedBranchText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  arrow: {
    fontSize: 12,
    color: '#6C757D',
  },
  branchList: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  branchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  selectedBranchItem: {
    backgroundColor: '#FFF5F5',
  },
  branchText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#495057',
    flex: 1,
    textTransform: 'capitalize',
  },
  selectedBranchTextItem: {
    color: '#CA282C',
    fontFamily: 'Poppins-Medium',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CA282C',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Profile;
