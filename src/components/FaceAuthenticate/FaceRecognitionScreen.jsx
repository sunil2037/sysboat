import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  Image,
  Modal,
  ScrollView,
  ToastAndroid,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import FaceRecognition from './FaceRecognition';
import TopNavBar from '../../navigation/TopNavBar';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT } from '../../Helper/Helper';
import EmployeeFaceLists from './EmployeeFaceLists';
import { PlusIcon, DeleteIcon, FileUploadIcon, CorrectIcon } from '../../Helper/IconsLoad';
import BottomSheetRegisterFace from '../../Helper/BottomSheetRegisterFace';
import useApi from '../../Apis/Services/ApiConfig';
import { useMutation, useQuery } from '@tanstack/react-query';
import useEncodedUserData from '../../hooks/useEncodedUserData';
import FaceCaptureScreen from './FaceRecognition/FaceCaptureScreen';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../Context/AuthContext';
import { toast } from '../../Helper/ToastManager';
import useUploadFile from '../../hooks/useUploadFile';
import ThemedText from '../../Helper/ThemedText';

const FaceRecognitionScreen = () => {
  const navigation = useNavigation();
  const { profileData, userAuthData } = useAuth();
  const ADMIN = profileData?.data?.[0]?.type;
  const EMPLOYEE_ID = userAuthData?.id;
  console.log("EMPLOYEE_ID",EMPLOYEE_ID)

  const [hasPermission, setHasPermission] = useState(true);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [registeredFaces, setRegisteredFaces] = useState([]);
  const [showAddFaceModal, setShowAddFaceModal] = useState(false);
  const [showEmployeeLists, setShowEmployeeLists] = useState(false);
  const [distance, setDistance] = useState(0.8);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const { userdata } = useEncodedUserData();
  const [showCamera, setShowCamera] = useState(false);
  const [Embedding, setEmbedding] = useState(null);
  const [SelectedDeleteId, setSelectedDeleteId] = useState(null);
  // Cloud upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [cloudUploadComplete, setCloudUploadComplete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCloudPath, setUploadedCloudPath] = useState('');
  const [showUploadProgress, setShowUploadProgress] = useState(false);

  const { FaceDelete, FaceDetails, FaceRegister } = useApi();
  const { uploadFile } = useUploadFile();

  useEffect(() => {
    requestPermissions();
    loadRegisteredFaces();
    loadDistance();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Main');
        }
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => subscription.remove();
    }, [])
  );

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);

        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (allGranted) {
          const cameraStarted = await FaceRecognition.startCamera();
          setHasPermission(cameraStarted);
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      setHasPermission(true);
    }
  };

  const loadRegisteredFaces = async () => {
    try {
      const faces = await FaceRecognition.getAllFaces();
      setRegisteredFaces(faces);
    } catch (error) {
    }
  };

  const loadDistance = async () => {
    try {
      const currentDistance = await FaceRecognition.getDistance();
      setDistance(currentDistance);
    } catch (error) {
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'front',
        quality: 1,
        saveToPhotos: false,
      });

      if (result?.assets?.[0]?.uri) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setSelectedFile({
          uri: imageUri,
          type: result.assets[0].type || 'image/jpeg',
          name: result.assets[0].fileName || `face_${Date.now()}.jpg`,
        });
        setShowBottomSheet(false);
        setCloudUploadComplete(false);
        setUploadedCloudPath('');
      }
    } catch (error) {
      setShowBottomSheet(true);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      if (result?.assets?.[0]?.uri) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setSelectedFile({
          uri: imageUri,
          type: result.assets[0].type || 'image/jpeg',
          name: result.assets[0].fileName || `face_${Date.now()}.jpg`,
        });
        setShowBottomSheet(false);
        setCloudUploadComplete(false);
        setUploadedCloudPath('');
      }
    } catch (error) {
      setShowBottomSheet(true);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const {
    data: FaceDetailsData,
    isLoading: FaceDetailsDataIsLoading,
    isError: FaceDetailsDataIsError,
    isPending: FaceDetailsDataIsPending,
    refetch: FaceDetailsDataRefetch,
  } = useQuery({
    queryKey: ['FaceDetails', userdata],
    queryFn: () =>
      FaceDetails({
        userData: userdata,
      }),
    enabled: !!userdata,
  });

  const { mutate: RegisterFace, isPending: isUploading } = useMutation({
    mutationFn: async (formData) => {
      const response = await FaceRegister(formData);
      return response;
    },
    onSuccess: async (response) => {
      ToastAndroid.show(response?.message || 'Face registered successfully', ToastAndroid.SHORT);
      await FaceDetailsDataRefetch();
      setShowAddFaceModal(false);
      handleClearSelection();
    },
    onError: (error) => {
      ToastAndroid.show(error?.message || 'Upload failed', ToastAndroid.SHORT);
    },
  });
  "/authentication/faceDelete"

  const { mutate: DeleteFace, isPending: DeleteFacePending } = useMutation({
    mutationFn: async (formData) => {
      const response = await FaceDelete(formData);
      return response;
    },
    onSuccess: async (response) => {
      ToastAndroid.show(response?.message || 'Face deleted successfully', ToastAndroid.SHORT);
      await FaceDetailsDataRefetch();
    },
    onError: (error) => {
      ToastAndroid.show(error?.message || 'Upload failed', ToastAndroid.SHORT);
    },
  });

  const handleUploadToCloud = () => {
    if (!selectedFile) {
      toast.error('No image selected');
      return;
    }

    setIsUploadingToCloud(true);
    setShowUploadProgress(true);
    const folder = 'faces';

    uploadFile(
      { file: selectedFile, folder },
      {
        onSuccess: async (data) => {
          toast.success('Face image uploaded to cloud successfully!');
          setUploadedCloudPath(data?.url || data?.file_path);
          setCloudUploadComplete(true);
          setIsUploadingToCloud(false);
          setUploadProgress(1);
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to upload to cloud');
          setIsUploadingToCloud(false);
          setShowUploadProgress(false);
        },
        onUploadProgress: (progress) => {
          setUploadProgress(progress);
        },
      }
    );
  };

  const handleClearSelection = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setUploadedCloudPath('');
    setCloudUploadComplete(false);
    setIsUploadingToCloud(false);
    setUploadProgress(0);
    setShowUploadProgress(false);
    setEmbedding(null);
  };

  const handleAddFace = async (employeeId) => {
    try {
      if (!uploadedCloudPath) {
        Alert.alert('Error', 'Please upload the image to cloud first');
        return;
      }
      let formData = {
        userData: userdata,
      }
      formData.face = uploadedCloudPath;
      if (ADMIN == 'ceo' || ADMIN == 'hr') {
        if (!employeeId?.key) {
          Alert.alert('Something Error Occured. Please Restart The App.');
          return;
        }
        formData.employeeId = employeeId?.key;
      } else {
        if (!EMPLOYEE_ID) {
          Alert.alert('Something Error Occured. Please Restart The App.');
          return;
        }
        formData.employeeId = EMPLOYEE_ID;
      }

      if (Embedding) {
        formData.embeddings = JSON.stringify(Embedding);
      }
      console.log("formData", formData)
      RegisterFace(formData);
    } catch (error) {
      Alert.alert('Error', 'Failed to add face. Please try again.');
    }
  };

  const onFaceCaptured = (data) => {
    setSelectedImage(data?.previewImage);
    setEmbedding(data?.embedding);

    setSelectedFile({
      uri: data?.previewImage,
      type: 'image/jpeg',
      name: `face_capture_${Date.now()}.jpg`,
    });

    setCloudUploadComplete(false);
    setUploadedCloudPath('');
    setShowCamera(false)
  };

  const handleDeleteFace = (item) => {
    setSelectedDeleteId(item?.id);
    if (!item?.id) {
      toast.warn('Something error occured');
    } else {
      const payload = {
        id: item?.id,
        userData: userdata,
      }
      DeleteFace(payload)
    }

  }

  if (!hasPermission) {
    return (
      <View style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT() }}>
        <TopNavBar navigation={navigation} title={'Face Management'} />
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, gap: 20, marginBottom: bottomHeight() }}>
          <ThemedText size='md' weight='Medium' align='center'>
            Please grant camera and storage permissions
          </ThemedText>
          <TouchableOpacity style={{ backgroundColor: '#CA282C', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 100, }} onPress={requestPermissions}>
            <ThemedText size='sm' weight='Regular' color='inverse' >
              Request Permissions
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: STATUS_BAR_HEIGHT() }]}>
      <TopNavBar navigation={navigation} title={'Face Management'} />

      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 30 }}>
        <View style={styles.previewContainer}>

          {selectedImage ? (
            <>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />

              {cloudUploadComplete && (
                <View style={styles.uploadSuccessOverlay}>
                  <View style={styles.uploadSuccessBadge}>
                    <CorrectIcon width={16} height={16} color={'white'} />
                    <ThemedText size='sm' weight='Regular' color='inverse'>
                      Upload to Cloud
                    </ThemedText>
                  </View>
                </View>
              )}

              {recognitionResult?.recognized && (
                <View style={styles.resultOverlay}>
                  <ThemedText size='md' weight='Medium'>
                    {recognitionResult.name || 'Unknown'}
                  </ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={styles.deleteButtonCircle}
                onPress={handleClearSelection}
                disabled={isUploadingToCloud}
              >
                <DeleteIcon width={20} height={20} color={'white'} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <ThemedText size='2xl' align='center' weight='Medium'>
                📷
              </ThemedText>
              <ThemedText size='md' align='center' weight='Medium'>
                No image selected
              </ThemedText>
              <ThemedText size='sm' align='center' weight='Regular' color='secondary'>
                Take a photo or choose from gallery
              </ThemedText>
            </View>
          )}
        </View>

        {/* Upload Progress */}
        {selectedImage && showUploadProgress && (
          <View style={styles.progressCard}>
            {isUploadingToCloud && uploadProgress < 1 && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <ThemedText size='sm' weight='Medium'>
                    Uploading to cloud...
                  </ThemedText>
                  <ThemedText size='sm' weight='Medium'>
                    {Math.round(uploadProgress * 100)}%
                  </ThemedText>
                </View>
                <Progress.Bar
                  progress={uploadProgress}
                  width={null}
                  height={6}
                  color={'#CA282C'}
                  unfilledColor={'#F5F5F5'}
                  borderWidth={0}
                  borderRadius={3}
                />
              </View>
            )}

            {cloudUploadComplete && (
              <View style={styles.successSection}>
                <CorrectIcon width={20} height={20} color={'#51B625'} />
                <ThemedText size='sm' weight='Regular' color='success' style={{ paddingRight: 20 }}>
                  Image uploaded successfully! You can now register this face.
                </ThemedText>

              </View>
            )}
          </View>
        )}

        {selectedImage && !cloudUploadComplete && !isUploadingToCloud && (
          <TouchableOpacity
            style={styles.uploadToCloudButton}
            onPress={handleUploadToCloud}
            disabled={isUploadingToCloud}
          >
            <FileUploadIcon width={20} height={20} color={'#CA282C'} />
            <ThemedText size='sm' weight='Medium' color='error'>
              Upload to Cloud
            </ThemedText>
          </TouchableOpacity>
        )}

        <View style={styles.mainActions}>
          <TouchableOpacity
            style={[styles.primaryButton, isRecognizing && styles.buttonDisabled]}
            onPress={() => setShowCamera(true)}
          >
            <ThemedText size='sm' weight='Medium' color='inverse' >
              {isRecognizing ? 'Processing...' : 'Capture Face'}
            </ThemedText>

          </TouchableOpacity>


          {cloudUploadComplete && (
            <TouchableOpacity
              style={[styles.registerButton]}
              onPress={() => setShowAddFaceModal(true)}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <PlusIcon width={20} height={20} color={'white'} />
                  <ThemedText size='sm' weight='Medium' color='inverse'>
                    Register Face
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          )}

          {(ADMIN == 'ceo' || ADMIN == 'hr') && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#e2e2e2' }]}
              onPress={() => setShowEmployeeLists(true)}
            >
              <ThemedText size='sm' weight='Medium' >
                Show All Faces
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal statusBarTranslucent visible={showCamera} onRequestClose={() => setShowCamera(false)}>
        <View style={{ paddingTop: STATUS_BAR_HEIGHT(), flex: 1 }}>
          <FaceCaptureScreen onFaceCaptured={onFaceCaptured} />
        </View>
      </Modal>

      {/* <BottomSheetCapture
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        handleChooseFromLibrary={handlePickImage}
        handleTakePhoto={handleTakePhoto}
      /> */}

      <BottomSheetRegisterFace
        visible={showAddFaceModal}
        onClose={() => setShowAddFaceModal(false)}
        handleAddFace={handleAddFace}
        selectedImage={selectedImage}
        isLoading={isUploading}
        ADMIN={ADMIN}
        EMPLOYEE_ID={EMPLOYEE_ID}
      />

      <Modal
        visible={showEmployeeLists}
        animationType="fade"
        onRequestClose={() => setShowEmployeeLists(false)}
        statusBarTranslucent
        transparent
      >
        <EmployeeFaceLists loading={DeleteFacePending} SelectedDeleteId={SelectedDeleteId} hideModal={() => setShowEmployeeLists(false)} data={FaceDetailsData} handleDeleteFace={handleDeleteFace} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  previewContainer: {
    borderRadius: 12,
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: 350, borderRadius: 12 },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
    height: 350,
  },
  placeholderIcon: { fontSize: 64, marginBottom: 16 },
  placeholderText: { fontSize: 18, color: '#333', fontFamily: 'Poppins-Medium' },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  mainActions: { marginTop: 20, gap: 12 },
  primaryButton: {
    backgroundColor: '#CA282C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  secondaryButton: {
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#CA282C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#CA282C',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  registerButton: {
    backgroundColor: '#51B625',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  buttonDisabled: { opacity: 0.6 },
  resultOverlay: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    width: '100%',
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  resultName: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
  deleteButtonCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#CA282C',
    padding: 10,
    borderRadius: 50,
    elevation: 3,
  },
  uploadSuccessOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  uploadSuccessBadge: {
    backgroundColor: '#51B625',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadSuccessText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#45484D',
  },
  progressPercentage: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#CA282C',
  },
  successSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#F0F9EC',
    borderRadius: 6,
    flex: 1
  },
  successText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#51B625',
    flex: 1,
  },
  uploadToCloudButton: {
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#CA282C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  uploadToCloudButtonText: {
    color: '#CA282C',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
});

export default FaceRecognitionScreen;