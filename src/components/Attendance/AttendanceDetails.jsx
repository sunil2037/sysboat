import { View, Text, ImageBackground, SafeAreaView } from 'react-native';
import React from 'react';
import backgroundImage from '../../../assets/Icon/background.png';
import { getFontSize } from '../../Helper/Helper';
// import { OpenMap } from './OpenMap';
const AttendanceDetails = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground source={backgroundImage} resizeMode="cover" style={{ flex: 1, paddingTop: 40, paddingHorizontal: 20, position: 'relative' }} >
        <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 22, color: '#293646' }}>Details</Text>
        <View style={{ backgroundColor: 'white' }}>
          <View>
            <Text>27 September 2024</Text>
          </View>
          {/* <OpenMap /> */}
        </View>
      </ImageBackground>
    </SafeAreaView>

  );
};

export default AttendanceDetails;
