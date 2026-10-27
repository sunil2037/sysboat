import {
  Image,
  ImageBackground,
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ToastAndroid,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BgCard, BgCard2 } from '../Helper/IconsLoad';
import TopNavBar from '../navigation/TopNavBar';
import ViewShot from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import useApi from '../Apis/Services/ApiConfig';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, API_BASE_URL2 } from '../Apis/Services/ServerURL';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { toast } from '../Helper/ToastManager';
import { DEFAULT_IMAGE, getFontSize, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import Skeleton, { getLayout } from '../Helper/Skeleton';


const VisitingIdScreen = ({ navigation }) => {
  const { width } = Dimensions.get('window');
  const cardHeight = width * (400 / 268);
  const { IdCard } = useApi();
  const card1Ref = useRef();
  const { userdata } = useEncodedUserData();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: IdCardData,
    isLoading,
    refetch,
    isFetching,
    isPending,
  } = useQuery({
    queryKey: ['IdCard', userdata],
    queryFn: () =>
      IdCard({
        userData: userdata,
      }),
    enabled: !!userdata,
  });

  const downloadCard = async (cardRef, cardName) => {
    try {
      if (!cardRef.current) {
        throw new Error('Card reference not found');
      }
      const uri = await cardRef.current.capture();
      await CameraRoll.save(uri, { type: 'photo' });
      ToastAndroid.show('ID Card saved to gallery', ToastAndroid.SHORT);
      toast.success('ID Card saved to gallery');
    } catch (error) {
      console.warn('Download failed:', error);
      ToastAndroid.show('Download failed', ToastAndroid.SHORT);
      toast.error('Failed to save');
    }
  };

  console.warn('IdCardData', IdCardData);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const WrapperComponent = isLoading || isPending ? View : ScrollView;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/Icon/background.png')}
        resizeMode="cover"
        style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}>
        <TopNavBar title={'Visiting ID'} navigation={navigation} />
        <WrapperComponent
          style={{ flex: 1 }}
          contentContainerStyle={{
            backgroundColor: 'transparent',
            paddingBottom: 20,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['black']}
            />
          }>
          <Skeleton isLoading={isLoading || isPending} layout={getLayout({ length: 1, height: 537 })}>
            <ViewShot
              ref={card1Ref}
              options={{ format: 'jpg', quality: 5 }}
              style={{ flex: 1, gap: 30, backgroundColor: 'transparent' }}>
              {/* First Card */}
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  position: 'relative',
                  backgroundColor: 'transparent',
                }}>
                <View style={{ backgroundColor: 'white', borderRadius: 15 }}>
                  <View
                    style={{
                      width: width - 20,
                      height: cardHeight,
                      overflow: 'hidden',
                      borderRadius: 15,
                    }}>
                    <BgCard
                      width={width - 20}
                      height={cardHeight}
                      style={{ borderRadius: 5, overflow: 'hidden' }}
                    />
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      justifyContent: 'center',
                      alignItems: 'center',
                      top: 20,
                      left: '50%',
                      transform: [{ translateX: '-50%' }],
                    }}>
                    <View>
                      <Image
                        style={{
                          aspectRatio: 1.5,
                          width: '100%',
                          height: 80,
                          marginBottom: 10
                        }}
                        source={{
                          uri: IdCardData?.data[0]?.logo
                            ? API_BASE_URL2 + IdCardData?.data[0]?.logo
                            : DEFAULT_IMAGE,
                        }}
                        resizeMode={'contain'}
                      />
                      {/* <Text style={{ textAlign: 'center' }}>{IdCardData?.data[0]?.company_name || 'N/A'}</Text> */}
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Image
                        style={{ width: 100, height: 100, borderRadius: 50 }}
                        source={{
                          uri:
                            API_BASE_URL2 +
                            IdCardData?.data[0]?.profile_image,
                        }}
                        resizeMode={'cover'}
                      />

                      <Text
                        style={{
                          fontSize: 25,
                          lineHeight: 30,
                          paddingTop: 20,
                          fontFamily: 'Poppins-Bold',
                          textAlign: 'center',
                          color: '#293646',
                        }}>
                        {IdCardData?.data[0]?.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Poppins-Regular',
                          textTransform: 'capitalize',
                          color: '#293646',
                        }}>
                        {IdCardData?.data[0]?.designation}
                      </Text>
                    </View>
                    <View style={{ width: width - 100, paddingTop: 30 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 80,
                        }}>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Medium',
                            color: '#293646',
                            fontSize: 13,
                            flex: 1,
                            textAlign: 'right',
                          }}>
                          Id No
                        </Text>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Regular',
                            color: '#6A7D94',
                            fontSize: 13,
                            flex: 1,
                          }}>
                          {IdCardData?.data[0]?.employee_id}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 80,
                        }}>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Medium',
                            color: '#293646',
                            fontSize: 13,
                            flex: 1,
                            textAlign: 'right',
                          }}>
                          DOB
                        </Text>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Regular',
                            color: '#6A7D94',
                            fontSize: 13,
                            flex: 1,
                          }}>
                          {new Date(
                            IdCardData?.data[0]?.dob,
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 80,
                        }}>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Medium',
                            color: '#293646',
                            fontSize: 13,
                            flex: 1,
                            textAlign: 'right',
                          }}>
                          Gender
                        </Text>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Regular',
                            color: '#6A7D94',
                            fontSize: 13,
                            flex: 1,
                          }}>
                          {IdCardData?.data[0]?.gender}
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 80,
                        }}>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Medium',
                            color: '#293646',
                            fontSize: 13,
                            flex: 1,
                            textAlign: 'right',
                          }}>
                          Phone
                        </Text>
                        <Text
                          style={{
                            fontFamily: 'Poppins-Regular',
                            color: '#6A7D94',
                            fontSize: 13,
                            flex: 1,
                          }}>
                          {IdCardData?.data[0]?.contact_number
                            ? IdCardData?.data[0]?.contact_number || 'N/A'
                            : IdCardData?.data[0]?.alternate_phone || 'N/A'}
                        </Text>
                      </View>
                      {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Text style={{ fontFamily: 'Poppins-Medium', color: '#293646', fontSize: 13, flex: 1 }}>E-mail</Text>
                                                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#6A7D94', fontSize: 13, textAlign: 'left', flex: 1 }}>
                                                            {IdCardData?.data[0]?.official_email_id ? IdCardData?.data[0]?.official_email_id : IdCardData?.data[0]?.email_id || 'N/A'}

                                                        </Text>
                                                    </View> */}
                    </View>
                  </View>
                </View>
              </View>

              {/* Second Card */}
              {/* <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, position: 'relative' }}>
                                        <View >
                                            <View style={{ width: width - 20, height: cardHeight, backgroundColor: 'white' }}>
                                                <BgCard2 width={width - 20} height={cardHeight} />
                                            </View>
                                            <View style={{
                                                position: 'absolute',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                top: 50,
                                                left: '50%',
                                                transform: [{ translateX: '-50%' }],
                                                gap: 40,
                                            }}>
                                                <View style={{ width: width - 100, gap: 20 }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                                                        <View style={{ width: 15, height: 15, marginTop: 5, backgroundColor: '#CA282C', borderRadius: 50 }}></View>
                                                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#6A7D94', fontSize: 13, textAlign: 'left', flex: 1 }}>Lorem ipsum dolor sit amet, consectetul adipicing elit, sad diam nonummy nibh eulsmod.</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                                                        <View style={{ width: 15, height: 15, marginTop: 5, backgroundColor: '#CA282C', borderRadius: 50 }}></View>
                                                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#6A7D94', fontSize: 13, textAlign: 'left', flex: 1 }}>Lorem ipsum dolor sit amet, consectetul adipicing elit, sad diam nonummy nibh eulsmod.</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                    </View> */}
            </ViewShot>
            <View style={{ paddingHorizontal: 15 }}>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => downloadCard(card1Ref, 'Side Card')}>
                <Text style={styles.downloadButtonText}>
                  Download Id Card
                </Text>
              </TouchableOpacity>
            </View>
          </Skeleton>
        </WrapperComponent>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  downloadButton: {
    marginTop: 20,
    backgroundColor: '#CA282C',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
});

export default VisitingIdScreen;


// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
// } from 'react-native';
// import BottomSheet from '../utils/BottomSheet';

// const DATA = Array.from({ length: 20 }, (_, i) => ({
//   id: String(i),
//   title: `Item ${i + 1}`,
// }));

// const VisitingIdScreen = () => {
//   const [visible, setVisible] = useState(false);

//   return (
//     <View style={styles.container}>

//       {/* Trigger button */}
//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => setVisible(true)}>
//         <Text style={styles.buttonText}>Open Bottom Sheet</Text>
//       </TouchableOpacity>

//       {/* ✅ Bottom sheet with any content */}
//       <BottomSheet
//         visible={visible}
//         dismissible={true}
//         fullScreen={false}
//         onDismiss={() => setVisible(false)}>

//         {/* ── Example 1: Header + paragraph ── */}
//         <View style={styles.section}>
//           <Text style={styles.sheetTitle}>Sheet Title</Text>
//           <Text style={styles.paragraph}>
//             Any paragraph text goes here. Scroll down to see more content.
//           </Text>
//         </View>

//         {/* ── Example 2: FlatList ── */}
//         <FlatList
//           data={DATA}
//           keyExtractor={item => item.id}
//           scrollEnabled={true}
//           renderItem={({ item }) => (
//             <View style={styles.listItem}>
//               <Text style={styles.listText}>{item.title}</Text>
//             </View>
//           )}
//         />

//         {/* ── Example 3: Buttons ── */}
//         <View style={styles.buttonRow}>
//           <TouchableOpacity
//             style={[styles.sheetButton, { backgroundColor: '#F5F5F5' }]}
//             onPress={() => setVisible(false)}>
//             <Text style={[styles.sheetButtonText, { color: '#293646' }]}>
//               Cancel
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.sheetButton, {}]}
//             onPress={() => {
//               // handle confirm
//               setVisible(false);
//             }}>
//             <Text style={[styles.sheetButtonText, { color: '#FFFFFF' }]}>
//               Confirm
//             </Text>
//           </TouchableOpacity>
//         </View>

//       </BottomSheet>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   button: {
//     paddingVertical: 14,
//     paddingHorizontal: 32,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontFamily: 'Poppins-Medium',
//     fontSize: 15,
//   },
//   section: {
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 10,
//   },
//   sheetTitle: {
//     fontFamily: 'Poppins-Medium',
//     fontSize: 18,
//     color: '#293646',
//     marginBottom: 8,
//   },
//   paragraph: {
//     fontFamily: 'Poppins-Regular',
//     fontSize: 14,
//     color: '#666666',
//     lineHeight: 22,
//   },
//   listItem: {
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//   },
//   listText: {
//     fontFamily: 'Poppins-Regular',
//     fontSize: 14,
//     color: '#293646',
//   },
//   buttonRow: {
//     flexDirection: 'row',
//     gap: 12,
//     paddingHorizontal: 20,
//     paddingTop: 20,
//   },
//   sheetButton: {
//     height: 48,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   sheetButtonText: {
//     fontFamily: 'Poppins-Medium',
//     fontSize: 15,
//   },
// });

// export default VisitingIdScreen;

