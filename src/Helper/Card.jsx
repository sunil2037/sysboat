import React from 'react';
import { View, Text, Image } from 'react-native';
import { Calendar, Correct } from './IconsLoad';
import { getFontSize } from './Helper';
export const Card = ({ key }) => {
  return (
    <View key={key || 1}>
      <View style={{ backgroundColor: '#fff', padding: 15, borderRadius: 12, shadowOpacity: 0.1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Calendar size={18} />
          <Text style={{ marginLeft: 6, fontSize: 14, color: '#293646', fontFamily: 'Poppins-Medium', lineHeight: 20 }}>
            18 September 2024
          </Text>
        </View>

        <View style={{ backgroundColor: '#f8f9fc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EAECF0' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ gap: 0 }}>
              <Text style={{ color: '#6A7D94', fontSize: 12, fontFamily: 'Poppins-Medium', lineHeight: 20 }}>Leave Date</Text>
              <Text style={{ fontSize: 16, color: '#45484D', fontFamily: 'Poppins-Medium', lineHeight: 20 }}>20 Sept - 22 Sept</Text>
            </View>
            <View style={{ gap: 0 }}>
              <Text style={{ color: '#6A7D94', fontSize: 12, fontFamily: 'Poppins-Medium', lineHeight: 20 }}>Total Leave</Text>
              <Text style={{ fontSize: 16, color: '#45484D', fontFamily: 'Poppins-Medium', lineHeight: 20 }}>2 Days</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <View style={{ width: 18, height: 18, backgroundColor: '#19B36E', alignItems: 'center', justifyContent: 'center', borderRadius: 50 }}>
              <Correct width={10} height={10} color={'white'} />
            </View>
            <Text style={{ color: '#19B36E', marginLeft: 6, fontSize: 12, fontFamily: 'Poppins-Regular', lineHeight: 19 }}>Approved at 19 Sept 2024</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#45484D', fontSize: 12, marginRight: 6, fontFamily: 'Poppins-Regular', lineHeight: 19 }}>By</Text>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
              style={{ width: 22, height: 22, borderRadius: 11 }}
            />
            <Text style={{ marginLeft: 6, fontSize: 12, fontFamily: 'Poppins-Regular', lineHeight: 19, color: '#45484D' }}>Elaine</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
