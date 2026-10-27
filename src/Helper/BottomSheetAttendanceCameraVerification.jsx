import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import BottomSheetBase from './BottomSheetBase';
import { API_BASE_URL, API_BASE_URL2 } from '../Apis/Services/ServerURL';
import { Correct, CorrectIcon, Cross } from './IconsLoad';
import { getFontSize } from './Helper';
const BottomSheetAttendanceCameraVerification = ({
  visible,
  onClose,
  loading,
  data,
  isFaceRegister,
  registerFace,
  FacePath,
}) => {
  return (
    <BottomSheetBase freeze={loading} visible={visible} onClose={onClose}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="black" />
            <Text style={styles.loadingText}>Verifying face...</Text>
          </View>
        ) : (
          <>
            <View style={{ flex: 1, width: '100%', gap: 60 }}>
              {FacePath && (
                <>
                  <View style={styles.imageContainer}>
                    <Text style={styles.title}>Registerd Image</Text>
                    <Image
                      style={styles.image}
                      source={{
                        uri: API_BASE_URL2 + FacePath,
                      }}
                    />
                  </View>
                  <View
                    style={{ justifyContent: 'center', alignItems: 'center' }}>
                    {data?.matchResult?.includes('success') ? (
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: 'green',
                          borderRadius: 50,
                          padding: 15,
                        }}>
                        <Correct width={50} height={50} color={'white'} />
                      </View>
                    ) : (
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: 'red',
                          borderRadius: 50,
                          padding: 10,
                        }}>
                        <Cross width={60} height={60} color={'white'} />
                      </View>
                    )}
                  </View>
                </>
              )}
              {data?.imageUri && (
                <View style={styles.imageContainer}>
                  <Text style={styles.title}>Current Image</Text>
                  <Image
                    style={styles.image}
                    source={{
                      uri: data.imageUri,
                    }}
                  />
                </View>
              )}
            </View>
            {isFaceRegister ? (
              <View style={styles.resultContainer}>
                {/* <Text style={[
                  styles.resultText,
                  data?.matchResult?.includes('success') ? styles.successText : styles.errorText
                ]}>
                  {data?.matchResult || 'Verification completed'}
                </Text> */}

                {/* {data?.similarityScore && (
                  <Text style={styles.similarityText}>
                    Similarity: {Math.round(data.similarityScore * 100)}%
                  </Text>
                )} */}
              </View>
            ) : (
              <TouchableOpacity
                disabled={loading}
                onPress={() => {
                  registerFace(data?.imageUri);
                }}
                style={{
                  height: 60,
                  width: '100%',
                  borderRadius: 10,
                  backgroundColor: '#CA282C',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 20,
                }}>
                {loading ? (
                  <ActivityIndicator size={30} color={'white'} />
                ) : (
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 18,
                      fontFamily: 'Poppins-Medium',
                      lineHeight: 35,
                    }}>
                    Register Face
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </BottomSheetBase>
  );
};

export default BottomSheetAttendanceCameraVerification;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    flex: 1,
    gap: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    maxHeight: 500,
    flex: 1,
    marginBottom: 20,
    borderRadius: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    resizeMode: 'cover',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  successText: {
    color: 'green',
  },
  errorText: {
    color: 'red',
  },
  similarityText: {
    fontSize: 16,
    color: '#555',
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: 'black',
    paddingBottom: 10,
  },
});
