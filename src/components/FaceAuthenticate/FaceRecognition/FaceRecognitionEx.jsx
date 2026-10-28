import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  findNodeHandle,
  UIManager,
  Alert,
  Modal,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ToastAndroid,
  ImageBackground,
} from 'react-native';
import FaceRecognitionCameraView from './FaceRecognitionCameraViews';
import { useAuth } from '../../../Context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import useEncodedUserData from '../../../hooks/useEncodedUserData';
import useApi from '../../../Apis/Services/ApiConfig';
import { DEFAULT_IMAGE, STATUS_BAR_HEIGHT, StringLengthLimit } from '../../../Helper/Helper';
import { Cross, ReloadIcon } from '../../../Helper/IconsLoad';
import { API_BASE_URL2 } from '../../../Apis/Services/ServerURL';
import backgroundImage from '../../../../assets/Icon/background.png';
import ThemedText from '../../../Helper/ThemedText';
import {
  getFaceRecognitionMode,
  parseFaceEmbeddings,
} from '../../../screens/attendanceValidation';


const COMPONENT_NAME = 'FaceRecognitionCameraViews';

const sendCommand = (ref, commandName, args = []) => {
  try {
    const node = findNodeHandle(ref.current);
    if (!node) {
      console.warn("Could not find node");
      return;
    }

    const config = UIManager.getViewManagerConfig(COMPONENT_NAME);
    const commandId = config?.Commands?.[commandName];

    if (commandId !== undefined) {
      UIManager.dispatchViewManagerCommand(node, commandId, args);
    } else {
      console.warn(`Command ${commandName} not found in manager`);
    }
  } catch (error) {
  }
};

const ACTION_TYPES = {
  PUNCH_IN: 'in',
  PUNCH_OUT: 'out',
  BREAK_IN: 'Start_break',
  BREAK_OUT: 'End_break',
};

export default function FaceRecognitionEx({ onFaceRecognized, navigation }) {
  const cameraRef = useRef(null);
  const { profileData, profileDataLoading } = useAuth();
  const name = profileData?.data?.[0]?.first_name;
  const [refresh, setRefresh] = useState(false);
  const { userdata } = useEncodedUserData();
  const { FaceDetails } = useApi();

  const faceDetection = profileData?.permission?.face_detection;
  const liveFace = profileData?.permission?.live_face_detection;
  const recognitionMode = getFaceRecognitionMode(faceDetection, liveFace);
  const parsedEmbeddings = parseFaceEmbeddings(profileData?.embeddings);

  const {
    data: FaceDetailsData,
    isLoading,
    isPending
  } = useQuery({
    queryKey: ['FaceDetails', userdata],
    queryFn: () => FaceDetails({ userData: userdata }),
    enabled: !!userdata,
  });


  const handleEnrollAllFacesOptimized = async () => {
    setRefresh(true);
    ToastAndroid.show('Refreshing...', ToastAndroid.SHORT);

    try {
      if (!FaceDetailsData?.data || !Array.isArray(FaceDetailsData.data)) {
        ToastAndroid.show('No face data found!', ToastAndroid.SHORT);
        setRefresh(false);
        return;
      }

      const enrollmentResults = await Promise.all(
        FaceDetailsData.data.map(async (faceRecord) => {
          try {
            const { name, embeddings, id } = faceRecord;
            if (!name || !embeddings) {
              console.warn(`Skipping face ID: ${id} — missing data.`);
              return false;
            }

            const parsedEmbeddings =
              typeof embeddings === 'string' ? JSON.parse(embeddings) : embeddings;

            sendCommand(cameraRef, 'addEmbedding', [name, parsedEmbeddings]);
            return true;
          } catch (error) {
            return false;
          }
        })
      );

      const successCount = enrollmentResults.filter(Boolean).length;

      sendCommand(cameraRef, 'save', []);
      ToastAndroid.show(`${successCount} faces saved successfully.`, ToastAndroid.SHORT);

    } catch (error) {
      ToastAndroid.show('Something went wrong during enrollment.', ToastAndroid.SHORT);
    } finally {
      setRefresh(false);
    }
  };

  const handleRefreshFace = async () => {
    setRefresh(true);
    ToastAndroid.show('Refreshing...', ToastAndroid.SHORT);
    try {
      if (recognitionMode === 'offline') {
        if (!name || !parsedEmbeddings) {
          ToastAndroid.show('Face data is incomplete. Please register your face again.', ToastAndroid.SHORT);
          return;
        }
        sendCommand(cameraRef, 'addEmbedding', [name, parsedEmbeddings]);
        sendCommand(cameraRef, 'save', []);
        ToastAndroid.show(`${name}'s embedding updated successfully.`, ToastAndroid.SHORT);
      } else {
        await handleEnrollAllFacesOptimized();
      }
    } catch (error) {
      ToastAndroid.show('Failed to refresh face data.', ToastAndroid.SHORT);
    } finally {
      setRefresh(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 15 }}>
      {profileDataLoading || !profileData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6A7D94" />
          <Text style={{ marginTop: 12, fontFamily: 'Poppins-Medium' }}>
            Loading your profile…
          </Text>
        </View>
      ) : <>
      {profileData?.isFaceRegistered && (
        <TouchableOpacity disabled={refresh} onPress={handleRefreshFace} style={{ position: 'absolute', top: -STATUS_BAR_HEIGHT(), right: 25 }}>
          {refresh ? (
            <ActivityIndicator color={'black'} size={30} />
          ) : (
            <ReloadIcon width={30} height={30} />
          )}
        </TouchableOpacity>
      )}

      {!profileData?.isFaceRegistered ? (
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <View style={{ gap: 20 }}>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 16, textAlign: 'center' }}>There is no face registered on your profile.</Text>
            <TouchableOpacity onPress={() => navigation.push('FaceRecognitionScreen')} style={{ backgroundColor: '#CA282C', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 50, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Poppins-Medium', color: 'white', }}>Register Face</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        recognitionMode === 'offline' ? (
          <FaceRecognitionOfflineComponent cameraRef={cameraRef} onFaceRecognized={onFaceRecognized} />
        ) : (
          <LiveRecognitionComponent cameraRef={cameraRef} FaceDetailsData={FaceDetailsData} isLoading={isLoading || isPending} />
        )
      )}
      </>}

    </View>
  )
}


const FaceRecognitionOfflineComponent = ({ cameraRef, onFaceRecognized }) => {
  const { profileData } = useAuth();
  const parsedEmbeddings = parseFaceEmbeddings(profileData?.embeddings);
  const name = profileData?.data?.[0]?.first_name;


  const handleFaceRecognized = useCallback((event) => {
    if (event?.name && event.name !== 'Unknown') {
      onFaceRecognized();
    } else {
      // onFaceRecognized(false);
    }
  }, [onFaceRecognized]);


  const handleEnrollAllFacesOptimized = async () => {
    try {
      if (!name || !parsedEmbeddings) {
        console.warn('Skipping face enrollment because profile data is incomplete.');
        return false;
      }

      sendCommand(cameraRef, 'addEmbedding', [name, parsedEmbeddings]);
      sendCommand(cameraRef, 'save', []);


    } catch (error) {
    }
  };

  useEffect(() => {
    handleEnrollAllFacesOptimized();
  }, [])

  return (
    <View style={{ overflow: 'hidden', flex: 1 }}>
      <FaceRecognitionCameraView
        ref={cameraRef}
        onFaceRecognized={handleFaceRecognized}
      />
    </View>
  )
}


const LiveRecognitionComponent = ({ cameraRef, isLoading, FaceDetailsData }) => {
  const { FaceDelete, FaceDetails, FaceAttendance, EmployeesProfile } = useApi();
  const { userdata } = useEncodedUserData();


  const [lastEmbedding, setLastEmbedding] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);

  const [recognitionModalVisible, setRecognitionModalVisible] = useState(false);
  const [recognizedFaceData, setRecognizedFaceData] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [cameraFrozen, setCameraFrozen] = useState(false);
  const [lastRecognizedId, setLastRecognizedId] = useState(null);
  const [selectedActionType, setSelectedActionType] = useState(null);

  const {
    data,
    isLoading: Loading,
    isPending,
    refetch
  } = useQuery({
    queryKey: ['EmployeesProfile', userdata, recognizedFaceData?.id],
    queryFn: () => EmployeesProfile({ employeeId: recognizedFaceData?.id, userData: userdata }),
    enabled: !!userdata && !!String(recognizedFaceData?.id),
  });


  const PROFILE_PHOTO = data?.data?.profile_image ? API_BASE_URL2 + data?.data?.profile_image : DEFAULT_IMAGE;
  const NAME = data?.data?.name;
  const EMPLOYEE_ID = data?.data?.employee_id;
  const BRANCH_NAME = data?.data?.branch_name;
  const CLOCK_IN = data?.data?.attendance_in;
  const CLOCK_OUT = data?.data?.attendance_out;
  const BREAK_IN = data?.data?.break_in;
  const BREAK_OUT = data?.data?.break_out;


  const DISABLE_CLOCK_IN = isLoading || attendanceLoading && selectedActionType == ACTION_TYPES.PUNCH_IN || CLOCK_IN?.length > 0 || BREAK_IN?.length > 0 && !BREAK_OUT?.length > 0;

  const DISABLE_CLOCK_OUT = isLoading || attendanceLoading && selectedActionType == ACTION_TYPES.PUNCH_OUT || CLOCK_OUT?.length > 0 || BREAK_IN?.length > 0 || BREAK_OUT?.length > 0 && BREAK_OUT != '00:00:00' || !CLOCK_IN?.length > 0;

  const DISABLE_BREAK_IN = isLoading || attendanceLoading && selectedActionType == ACTION_TYPES.BREAK_IN || BREAK_IN?.length > 0 || !CLOCK_IN?.length > 0 || CLOCK_OUT?.length > 0;

  const DISABLE_BREAK_OUT = isLoading || attendanceLoading && selectedActionType == ACTION_TYPES.BREAK_OUT || BREAK_OUT?.length > 0 && BREAK_OUT != '00:00:00' || !BREAK_IN?.length > 0 || !CLOCK_IN?.length > 0 || CLOCK_OUT?.length > 0;






  const attendanceMutation = useMutation({
    mutationFn: async (attendanceData) => {
      const response = await FaceAttendance(attendanceData);
      if (response?.message) {
        ToastAndroid.show(response?.message, ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(response?.message, ToastAndroid.SHORT);
      }
      return response;
    },
    onSuccess: (data) => {
      refetch();
      setAttendanceLoading(false);

      const actionLabels = {
        [ACTION_TYPES.PUNCH_IN]: 'in',
        [ACTION_TYPES.PUNCH_OUT]: 'out',
        [ACTION_TYPES.BREAK_IN]: 'Start_break',
        [ACTION_TYPES.BREAK_OUT]: 'End_break',
      };


      setTimeout(() => {
        setRecognitionModalVisible(false);
        setRecognizedFaceData(null);
        unfreezeCamera();
        setLastRecognizedId(null);
        setSelectedActionType(null);
        setCurrentMatch(null);
      }, 3000);
    },
    onError: (error) => {
      refetch();
      setAttendanceLoading(false);
      unfreezeCamera();
      setTimeout(() => {
        setRecognitionModalVisible(false);
        setRecognizedFaceData(null);
        setLastRecognizedId(null);
        setSelectedActionType(null);
        setCurrentMatch(null);
      }, 2000);
    },
  });

  const freezeCamera = useCallback(() => {
    sendCommand(cameraRef, 'freezeCamera', []);
    setCameraFrozen(true);
  }, []);

  const unfreezeCamera = useCallback(() => {
    sendCommand(cameraRef, 'unfreezeCamera', []);
    setCameraFrozen(false);
  }, []);

  const handleFaceRecognized = useCallback((event) => {

    if (event?.embedding) setLastEmbedding(event.embedding);

    if (event?.name && event.name !== 'Unknown' && !cameraFrozen) {

      if (FaceDetailsData?.data) {
        const matchedFace = FaceDetailsData.data.find(
          face => face.name.toLowerCase() === event.name.toLowerCase()
        );

        if (matchedFace && lastRecognizedId !== matchedFace.id) {
          setRecognizedFaceData(matchedFace);
          setLastRecognizedId(matchedFace.id);
          setRecognitionModalVisible(true);
          freezeCamera();
        }
      }

      setCurrentMatch(event.name);
    } else {
      setCurrentMatch(null);
    }
  }, [FaceDetailsData, cameraFrozen, lastRecognizedId, freezeCamera]);

  const handleAttendanceAction = async (actionType) => {
    setSelectedActionType(actionType);
    setAttendanceLoading(true);

    try {
      await attendanceMutation.mutateAsync({
        employeeId: recognizedFaceData.id,
        attendanceType: 'hr',
        liveFaceRecognition: true,
        type: actionType,
        latitude: '00',
        longitude: '00',
        userData: userdata,
      });
    } catch (error) {
      setAttendanceLoading(false);
      unfreezeCamera();
    }
  };

  const handleCloseModal = () => {
    if (!attendanceLoading) {
      setRecognitionModalVisible(false);
      setRecognizedFaceData(null);
      unfreezeCamera();
      setLastRecognizedId(null);
      setSelectedActionType(null);
    }
  };

  const handleEnrollAllFacesOptimized = async () => {
    try {
      if (!FaceDetailsData || !Array.isArray(FaceDetailsData.data)) {
        return;
      }


      const enrollmentPromises = FaceDetailsData.data.map(async (faceRecord) => {
        try {
          const { name, embeddings, id } = faceRecord;

          if (!name || !embeddings) {
            console.warn(`Skipping - missing data for employee: ${id}`);
            return false;
          }

          const parsedEmbeddings = typeof embeddings === 'string'
            ? JSON.parse(embeddings)
            : embeddings;

          sendCommand(cameraRef, 'addEmbedding', [name, parsedEmbeddings]);

          return true;
        } catch (error) {
          return false;
        }
      });

      await Promise.all(enrollmentPromises);

      sendCommand(cameraRef, 'save', []);


    } catch (error) {
    }
  };



  useEffect(() => {
    if (FaceDetailsData && !isLoading) {
      handleEnrollAllFacesOptimized();
    }
  }, [FaceDetailsData, isLoading]);

  return (
    <View style={{ flex: 1, borderRadius: 20 }}>
      <View style={{ overflow: 'hidden', flex: 1 }}>
        <FaceRecognitionCameraView
          ref={cameraRef}
          onFaceRecognized={handleFaceRecognized}
        />
      </View>

      <Modal
        animationType="fade"
        statusBarTranslucent
        visible={recognitionModalVisible}
        onRequestClose={handleCloseModal}
      >
        <ImageBackground source={backgroundImage}
          resizeMode="cover"
          style={{ ...StyleSheet.absoluteFillObject, flex: 1, paddingTop: STATUS_BAR_HEIGHT(), }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 }}>
            <TouchableOpacity onPress={handleCloseModal} style={{ borderRadius: 50, backgroundColor: 'white', position: 'absolute', top: 0, right: 15, padding: 8 }}>
              <Cross width={30} height={30} />
            </TouchableOpacity>
            <View style={{ borderRadius: 15, backgroundColor: 'white', width: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: "center", gap: 10, backgroundColor: '#CA282C', padding: 20, borderTopRightRadius: 15, borderTopLeftRadius: 15 }}>
                <Image source={{ uri: PROFILE_PHOTO }} style={{ width: 60, height: 60, borderRadius: 100 }} />
                <View>
                  <ThemedText size='xl' weight='SemiBold' color='inverse'>
                    {NAME}
                  </ThemedText>
                  <ThemedText size='sm' weight='Regular' color='inverse'>
                    React Native Developer
                  </ThemedText>
                </View>
              </View>
              <View style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15 }}>
                  <View>
                    <ThemedText size='sm' weight='Regular' color='secondary'>
                      EMPLOYEE ID
                    </ThemedText>
                    <ThemedText size='md' weight='SemiBold' transform='capitalize'>
                      {EMPLOYEE_ID}
                    </ThemedText>
                  </View>
                  <View style={{ height: '100%', width: 1.5, backgroundColor: '#d1d7df' }} />
                  <View>
                    <ThemedText size='sm' weight='Regular' align='right' color='secondary'>
                      BRANCH
                    </ThemedText>
                    <ThemedText size='md' weight='SemiBold' align='right' transform='capitalize'>
                      {BRANCH_NAME && StringLengthLimit(BRANCH_NAME, 15)}
                    </ThemedText>
                  </View>
                </View>
                <View style={{ height: 1, width: '100%', marginVertical: 20, backgroundColor: '#d1d7df' }} />
                <View style={{ gap: 8, flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, DISABLE_CLOCK_IN ? styles.inactive : styles.active]}
                    onPress={() => handleAttendanceAction(ACTION_TYPES.PUNCH_IN)}
                    disabled={DISABLE_CLOCK_IN}
                  >
                    {attendanceLoading && selectedActionType == ACTION_TYPES.PUNCH_IN ? (
                      <ActivityIndicator size={20} color={attendanceLoading && selectedActionType == ACTION_TYPES.PUNCH_IN ? '#CA282C' : '#fff'} />
                    ) : (
                      <>
                        <ThemedText size="md" weight='Medium' color={DISABLE_CLOCK_IN ? 'primary' : 'inverse'}>
                          Punch In
                        </ThemedText>
                        <ThemedText size="sm" weight='Regular' color={DISABLE_CLOCK_IN ? 'primary' : 'inverse'}>
                          {CLOCK_IN || '-'}
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, DISABLE_CLOCK_OUT ? styles.inactive : styles.active]}
                    onPress={() => handleAttendanceAction(ACTION_TYPES.PUNCH_OUT)}
                    disabled={DISABLE_CLOCK_OUT}
                  >
                    {attendanceLoading && selectedActionType == ACTION_TYPES.PUNCH_OUT ? (
                      <ActivityIndicator size={20} color={attendanceLoading && selectedActionType == ACTION_TYPES.PUNCH_OUT ? '#CA282C' : '#fff'} />
                    ) : (
                      <>
                        <ThemedText size="md" weight='Medium' color={DISABLE_CLOCK_OUT ? 'primary' : 'inverse'}>
                          Punch Out
                        </ThemedText>
                        <ThemedText size="sm" weight='Regular' color={DISABLE_CLOCK_OUT ? 'primary' : 'inverse'}>
                          {CLOCK_OUT || '-'}
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 8, flexDirection: 'row', marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, DISABLE_BREAK_IN ? styles.inactive : styles.active]}
                    onPress={() => handleAttendanceAction(ACTION_TYPES.BREAK_IN)}
                    disabled={DISABLE_BREAK_IN}
                  >
                    {attendanceLoading && selectedActionType == ACTION_TYPES.BREAK_IN ? (
                      <ActivityIndicator size={20} color={attendanceLoading && selectedActionType == ACTION_TYPES.BREAK_IN ? '#CA282C' : '#fff'} />
                    ) : (
                      <>
                        <ThemedText size="md" weight='Medium' color={DISABLE_BREAK_IN ? 'primary' : 'inverse'}>
                          Break In
                        </ThemedText>
                        <ThemedText size="sm" weight='Regular' color={DISABLE_BREAK_IN ? 'primary' : 'inverse'}>
                          {BREAK_IN || '-'}
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, DISABLE_BREAK_OUT ? styles.inactive : styles.active]}
                    onPress={() => handleAttendanceAction(ACTION_TYPES.BREAK_OUT)}
                    disabled={DISABLE_BREAK_OUT}
                  >
                    {attendanceLoading && selectedActionType == ACTION_TYPES.BREAK_OUT ? (
                      <ActivityIndicator size={20} color={attendanceLoading && selectedActionType == ACTION_TYPES.BREAK_OUT ? '#CA282C' : '#fff'} />
                    ) : (
                      <>
                        <ThemedText size="md" weight='Medium' color={DISABLE_BREAK_OUT ? 'primary' : 'inverse'}>
                          Break Out
                        </ThemedText>
                        <ThemedText size="sm" weight='Regular' color={DISABLE_BREAK_OUT ? 'primary' : 'inverse'}>
                          {BREAK_OUT || '-'}
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </View>
        </ImageBackground>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  recognitionModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%'
  },
  recognitionHeader: {
    backgroundColor: '#34C759',
    padding: 16,
    alignItems: 'center',
  },
  processingHeader: {
    backgroundColor: '#FF9500',
  },
  recognitionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  faceImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 0.4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 0.6,
    textAlign: 'right',
  },
  statusText: {
    color: '#34C759',
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 10,
    backgroundColor: '#f9f9f9',
  },
  actionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    width: '49%'
  },
  active: {
    backgroundColor: '#CA282C',
  },
  inactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e6e6',
    opacity: 0.5
  },
  actionBtnText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins-Medium'
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
