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
  Dimensions,
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
import { BOTTOM_TAB_HEIGHT, bottomHeight, getFontSize, STATUS_BAR_HEIGHT, } from '../Helper/Helper';
import { Popup, LogoutLoadingPopup } from '../Helper/Popup';
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

  const profileImageUri = GetEmployeesProfileData?.data[0]?.profile_image
    ? API_BASE_URL2 + GetEmployeesProfileData?.data[0]?.profile_image
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
    <SafeAreaView style={{ flex: 1 }}>
      {/* <DocumentUploadComponent /> */}
      <BottomSheetProfileImage
        IsPending={isImageUploadPending || isFetching}
        onImageSelect={handleImageSelect}
        onImageDelete={handleImageDelete}
        data={GetEmployeesProfileData?.data[0]}
        visible={showSheet}
        isDeletingStatus={isDeleting}
        error={isImageUploadError}
        onClose={() => {
          setShowSheet(false);
        }}
      />

      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{
          ...StyleSheet.absoluteFillObject,
          flex: 1,
          paddingHorizontal: 20,
          paddingBottom: BOTTOM_TAB_HEIGHT + 30,
          paddingTop: STATUS_BAR_HEIGHT()
        }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: STATUS_BAR_HEIGHT() }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['black']}
            />
          }>
          <View style={{ flex: 1, gap: 50 }}>
            <View style={{ alignItems: 'center', gap: 5 }}>
              <LogoutLoadingPopup isVisible={showLoadingBarOfLogout} />
              <Popup
                isVisible={isLogoutPopupVisible}
                message={'Are you sure you want to logout?'}
                onConfirm={handleLogoutConfirm}
                onCancel={hideLogoutPopup}
              />

              <Skeleton highlightColor={'#f5f5f5'} boneColor='#fff' animationType='pulse' isLoading={isFetching || isImageUploadPending || profileDataLoading} layout={[
                { key: "Profile-1", width: 120, height: 120, marginBottom: 15, borderRadius: 120, alignSelf: 'center' },
                { key: "Profile-2", width: 180, height: 30, marginBottom: 10, borderRadius: 120, alignSelf: 'center' },
                { key: "Profile-3", width: 180, height: 20, marginBottom: 6, borderRadius: 120, alignSelf: 'center' },
              ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setIsVisible(true);
                  }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 120,
                    backgroundColor: 'white'
                  }}>
                  <Image
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 120,
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
                <ThemedText size='2xl' weight='Medium' align='center'>
                  {GetEmployeesProfileData?.data[0]?.first_name || 'John Doe'}
                </ThemedText>
                <ThemedText size='sm' weight='Regular' align='center' color='secondary'>
                  {capitalizeFirstLetter(
                    GetEmployeesProfileData?.data[0]?.official_email_id
                      ? GetEmployeesProfileData?.data[0]?.official_email_id
                      : GetEmployeesProfileData?.data[0]?.email_id || '',
                  )}
                </ThemedText>
              </Skeleton>

            </View>
            <View style={{ gap: 5 }}>
              <View
                style={{
                  backgroundColor: '#F7F7F7',
                  padding: 15,
                  borderRadius: 25,
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
                    paddingBottom: 15,
                    paddingTop: 15,
                  }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <PersonalInfoIcon width={25} height={25} />
                    <ThemedText size='md' weight='Regular'  >Personal</ThemedText>
                  </View>
                  <RightIcon width={25} height={25} />
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
                    paddingBottom: 15,
                    paddingTop: 15,
                  }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <WorkInfo width={30} height={30} />
                    <ThemedText size='md' weight='Regular'>Work</ThemedText>
                  </View>
                  <RightIcon width={25} height={25} />
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
                    paddingBottom: 10,
                    paddingTop: 15,
                    borderBottomWidth: 1,
                    borderColor: '#DCD7C9',
                  }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <WorkWeek width={30} height={30} />
                    <ThemedText size='md' weight='Regular'>Work-Week</ThemedText>
                  </View>
                  <RightIcon width={25} height={25} />
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
                    paddingBottom: 10,
                    paddingTop: 15,
                  }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <DocumentsIcon width={25} height={25} />
                    <ThemedText size='md' weight='Regular'>Documents</ThemedText>
                  </View>
                  <RightIcon width={25} height={25} />
                </Pressable>
                {/* )} */}
              </View>
              {profileData?.permission?.branch_switch && <BranchSwitch />}
              <View
                style={{
                  backgroundColor: '#F7F7F7',
                  padding: 15,
                  borderRadius: 25,
                }}>
                {/* <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 15,
                  paddingTop: 15,
                  borderBottomWidth: 1,
                  borderColor: '#DCD7C9',
                }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <Notification2 width={25} height={25}></Notification2>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: 16,
                      lineHeight: 20,
                    }}>
                    Push Notification
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: '#B2A5FF', true: '#B2A5FF' }}
                  thumbColor={isEnabled ? '#493D9E' : '#493D9E'}
                  ios_backgroundColor="#3e3e3e"
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                  onValueChange={toggleSwitch}
                  value={isEnabled}
                />
              </Pressable> */}
                <TouchableOpacity
                  onPress={showLogoutPopup}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 10,
                    paddingTop: 15,
                  }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <LogoutIcon width={25} height={25} />
                    <ThemedText size='md' weight='Regular'>Log Out</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
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
      </ImageBackground>
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
              <ThemedText size='md' weight='Regular' color='inverse'>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </SafeAreaView>
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
              <ThemedText size='md' weight='Regular' >
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
                <ThemedText size='md' weight='Regular' >
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
