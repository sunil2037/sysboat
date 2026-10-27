import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  Button,
} from 'react-native';
import { CameraIcon, DeleteIcon, GalleryIcon } from './IconsLoad';
import { API_BASE_URL, API_BASE_URL2 } from '../Apis/Services/ServerURL';
import BottomSheetBase from './BottomSheetBase';
import DocumentUploadComponent from '../hooks/DocumentUploadComponent';
import Skeleton, { getLayout } from './Skeleton';
import { DEFAULT_IMAGE } from './Helper';
import ThemedText from './ThemedText';


const BottomSheetProfileImage = ({
  visible,
  onClose,
  data,
  handleUploadImage,
  onImageSelect,
  IsPending,
  onImageDelete,
  isDeletingStatus,
  error,
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [profileData, setProfileData] = useState([]);
  const [sizeTarget, setSizeTarget] = useState(1000);
  const [showDocumentUploadSheet, setShowDocumentUploadSheet] = useState(false);
  useEffect(() => {
    setProfileData(data);
  }, [data, error]);

  const profileImageUri = useMemo(() => {
    if (profileData?.profile_image && selectedImage?.uri) {
      return selectedImage.uri;
    }

    if (profileData?.profile_image) {
      return API_BASE_URL2 + profileData.profile_image;
    }

    return DEFAULT_IMAGE;
  }, [profileData?.profile_image, selectedImage?.uri]);

  const handleDeletePhoto = () => {
    onImageDelete();
    setSelectedImage(null);
  };


  const onUploadComplete = (document, data) => {
    onImageSelect?.(data);
    setShowDocumentUploadSheet(false);
  }
  const onUploadError = (document, error) => {
    toast.error(error?.message)
  }

  if (showDocumentUploadSheet) {
    return (
      <DocumentUploadComponent folder='ProfilePhoto' allowedTypes={['jpg', 'jpeg', 'png']} onUploadComplete={onUploadComplete} onUploadError={onUploadError} visible={showDocumentUploadSheet} onClose={() => setShowDocumentUploadSheet(false)} />
    )
  }

  return (
    <>

      <BottomSheetBase visible={visible} onClose={onClose}>
        <View style={styles.profileContainer}>
          <Skeleton isLoading={IsPending} layout={getLayout({ length: 1, height: 100, width: 100, borderRadius: 100 })}>
            <Image
              style={styles.profileImage}
              source={{
                uri: profileImageUri,
              }}
              resizeMode={'cover'}
            />
          </Skeleton>

        </View>
        <TouchableOpacity style={styles.option} onPress={() => setShowDocumentUploadSheet(true)}>
          <GalleryIcon width={22} height={22} />
          <ThemedText size='md' weight='Medium'>
            Pick Image
          </ThemedText>
        </TouchableOpacity>
        {/* <TouchableOpacity style={styles.option} onPress={handleTakePhoto}>
          <CameraIcon width={22} height={22} />
          <Text style={styles.title}>Take photo</Text>
        </TouchableOpacity> */}
        <TouchableOpacity disabled={isDeletingStatus ? true : false} style={styles.option} onPress={handleDeletePhoto}>
          <DeleteIcon width={22} height={22} />
          <ThemedText size='md' weight='Medium'>
            Delete
          </ThemedText>
          {isDeletingStatus && (
            <ActivityIndicator color={'black'} size={18} />
          )}
        </TouchableOpacity>
      </BottomSheetBase>
    </>

  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: -999,
  },
  option: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  backdrop: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 0,
    zIndex: -999,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 16,
    position: 'absolute',
    bottom: 0,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    borderRadius: 5,
    marginBottom: 10,

  },
  profileContainer: {
    alignItems: 'center',
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderColor: '#E2E2E2',
    marginBottom: 25,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    lineHeight: 18,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 100,
  },
});

export default BottomSheetProfileImage;
