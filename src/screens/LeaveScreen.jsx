import React, { useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import backgroundImage from '../../assets/Icon/background.png';
import TabViewComponent from '../Helper/TabViewComponent';
import { Pen, FilterIcon } from '../Helper/IconsLoad';
import { Filter } from '../components/Filter';
import LeaveDetails from '../components/Leave/LeaveDetails';
import { useAuth } from '../Context/AuthContext';
import TopNavBar from '../navigation/TopNavBar';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import useApi from '../Apis/Services/ApiConfig';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { useQuery } from '@tanstack/react-query';

const LeaveScreen = ({ navigation }) => {
  const [openModal, setOpenModal] = useState(false);
  const [openDetailsSheet, setOpenDetailsSheet] = useState(false);
  const [leaveId, setleaveId] = useState(null);
  const [leavetypefilter, setleavetypefilter] = useState('');
  const [leavedatefilter, setleavedatefilter] = useState([]);
  const { permissions } = useAuth();
  const { SingleLeaveRequest } = useApi()
  const { userdata } = useEncodedUserData();

  const handleOpenLeaveDetails = value => {
    setOpenDetailsSheet(value[0].visible);
    setleaveId(value[0].leaveId);
  };

  const {
    data: leaveSingleData,
    isLoading: isLeaveSingleLoading,
    isError: isLeaveSingleError,
    isPending,
  } = useQuery({
    queryKey: ['SingleLeaveRequest', userdata, leaveId],
    queryFn: () =>
      SingleLeaveRequest({ Logid: '', leave_id: leaveId, userData: userdata }),
    enabled: !!userdata && !!leaveId,
  });


  console.log("leaveSingleData", leaveSingleData)

  const filterLeaveType = value => {
    setleavetypefilter(value);
  };

  const filterDate = value => {
    setleavedatefilter(value);
  };

  const handleCloseLeaveDetails = () => {
    setOpenDetailsSheet(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{ ...StyleSheet.absoluteFillObject, flex: 1, paddingTop: STATUS_BAR_HEIGHT() }}>

        <TopNavBar title={'Leave Summary'} navigation={navigation} />
        {/* <View style={{backgroundColor:'white',paddingHorizontal:20,paddingVertical:15,borderRadius:15,marginTop:20}}>
                    <View>
                        <Text style={{color:'#293646',fontFamily:'Poppins-Medium',fontSize:15}}>Total Leave</Text>
                        <Text style={{color:'#6A7D94',fontFamily:'Poppins-Regular',fontSize:10}}>Period 1 Jan 2024 - 30 Dec 2024</Text>
                    </View>
                    <View style={{flexDirection:'row',gap:10,marginTop:10}}>
                        <View style={{borderWidth:1,borderColor:'#EBECEE',borderRadius:10,flex:1,paddingHorizontal:10,gap:20,paddingVertical:20}}>
                            <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
                                <View style={{width:14,height:14,borderRadius:50,backgroundColor:'#19B36E'}}></View>
                                <Text style={{color:'#293646',fontFamily:'Poppins-Medium',fontSize:14,lineHeight:12}}>Available</Text>
                            </View>
                            <Text style={{color:'#293646',fontFamily:'Poppins-Medium',fontSize:25,lineHeight:20}}>
                                20
                            </Text>
                        </View>
  onSendData,
                        <View style={{borderWidth:1,borderColor:'#EBECEE',borderRadius:10,flex:1,paddingHorizontal:10,gap:20,paddingVertical:20}}>
                            <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
                                <View style={{width:14,height:14,borderRadius:50,backgroundColor:'#7A5AF8'}}></View>
                                <Text style={{color:'#293646',fontFamily:'Poppins-Medium',fontSize:14,lineHeight:12}}>Leave Used</Text>
                            </View>
                            <Text style={{color:'#293646',fontFamily:'Poppins-Medium',fontSize:25,lineHeight:20}}>
                                20
                            </Text>
                        </View>
                    </View>
                </View> */}
        <LeaveDetails
          visible={openDetailsSheet}
          onClose={handleCloseLeaveDetails}
          leaveSingleData={leaveSingleData}
          isLeaveSingleLoading={isLeaveSingleLoading}
          isPending={isPending}
        />
        <View style={{ flex: 1, paddingHorizontal: 15, }}>
          <TabViewComponent
            leavetypefilter={leavetypefilter}
            leavedatefilter={leavedatefilter}
            routes={[
              { key: 'review', title: 'Review' },
              { key: 'approved', title: 'Approved' },
              { key: 'rejected', title: 'Rejected' },
            ]}
            onDetailSheet={handleOpenLeaveDetails}
          />
          {!permissions?.block_create_leave_button && (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('CreateLeave');
              }}
              style={{
                backgroundColor: '#CA282C',
                position: 'absolute',
                bottom: bottomHeight(),
                right: 10,
                width: 50,
                height: 50,
                borderRadius: 50,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Pen width={25} height={25} color={'white'} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => {
            setOpenModal(!openModal);
          }}
          style={{
            backgroundColor: '#CA282C',
            position: 'absolute',
            bottom: bottomHeight() + bottomHeight() + bottomHeight(),
            right: 10,
            width: 50,
            height: 50,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <FilterIcon width={25} height={25} color={'white'} />
        </TouchableOpacity>
        <Filter
          filterMaxDate={true}
          filterDate={filterDate}
          filterLeaveType={filterLeaveType}
          modalVisible={openModal}
          onModalClose={() => {
            setOpenModal(!openModal);
          }}
        />
      </ImageBackground>
    </SafeAreaView>
  );
};

export default LeaveScreen;
