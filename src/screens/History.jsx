import React from 'react';
import { View, Text, SafeAreaView, ScrollView, ImageBackground, TouchableOpacity, FlatList } from 'react-native';
import backgroundImage from '../../assets/Icon/background.png';
import DateRangePick from '../Helper/DateRangePick';
import { DotsIcon } from '../Helper/IconsLoad';
import { getFontSize } from '../Helper/Helper';
const History = () => {
  const data = [
    { id: '1', date: '06', weekday: 'MON', title1: 'Punch In', title2: 'Punch Out', title3: 'Total Hours', time1: '09:08 AM', time2: '09:08 AM', time3: '09:08' },
    { id: '2', date: '06', weekday: 'MON', title1: 'Punch In', title2: 'Punch Out', title3: 'Total Hours', time1: '09:08 AM', time2: '09:08 AM', time3: '09:08' },
    { id: '3', date: '06', weekday: 'MON', title1: 'Punch In', title2: 'Punch Out', title3: 'Total Hours', time1: '09:08 AM', time2: '09:08 AM', time3: '09:08' },
    { id: '4', date: '06', weekday: 'MON', title1: 'Punch In', title2: 'Punch Out', title3: 'Total Hours', time1: '09:08 AM', time2: '09:08 AM', time3: '09:08' },
    { id: '5', date: '06', weekday: 'MON', title1: 'Punch In', title2: 'Punch Out', title3: 'Total Hours', time1: '09:08 AM', time2: '09:08 AM', time3: '09:08' },
    { id: '6', date: '06', weekday: 'MON', title1: 'Punch In', title2: 'Punch Out', title3: 'Total Hours', time1: '09:08 AM', time2: '09:08 AM', time3: '09:08' },

  ];

  const Grid = () => (
    <FlatList
      data={data}
      nestedScrollEnabled={true}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F6F6F6', marginTop: 20, height: 73, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, gap: 10 }}>
          <View style={{
            backgroundColor: '#E89C1E', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10,
          }}>
            <Text style={{ textAlign: 'center', fontSize: 19, fontFamily: 'Poppins-Medium', lineHeight: 18 }}>{item.date}</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', lineHeight: 12, paddingTop: 2 }}>{item.weekday}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: '#293646', textAlign: 'center' }}>{item.time1}</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#6A7D94', lineHeight: 12, textAlign: 'center' }}>{item.title1}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: '#293646', textAlign: 'center' }}>{item.time2}</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#6A7D94', lineHeight: 12, textAlign: 'center' }}>{item.title2}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, fontFamily: 'Poppins-Medium', color: '#293646', textAlign: 'center' }}>{item.time3}</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#6A7D94', lineHeight: 12, textAlign: 'center' }}>{item.title3}</Text>
          </View>
        </View>
      )}
      keyExtractor={(item) => item.id}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1 }} >
      <ImageBackground source={backgroundImage} resizeMode="cover" style={{ flex: 1, paddingBottom: 120 }} >
        <View style={{ paddingHorizontal: 20, paddingTop: 50, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 22, color: '#293646' }}>
              Attendance History
            </Text>
            <TouchableOpacity>
              <DotsIcon color={'#CA282C'} width={25} height={25} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 15, backgroundColor: 'white', borderRadius: 10, marginTop: 20 }}>
            <DateRangePick />
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#F6F6F6',
                    marginTop: 10,
                    marginBottom: 10,
                    height: 73,
                    borderRadius: 8,
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: '#E89C1E',
                      paddingHorizontal: 10,
                      paddingVertical: 10,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: 'center',
                        fontSize: 19,
                        fontFamily: 'Poppins-Medium',
                        lineHeight: 18,
                      }}
                    >
                      {item.date}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-Regular',
                        lineHeight: 12,
                        paddingTop: 2,
                      }}
                    >
                      {item.weekday}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Medium',
                        color: '#293646',
                        textAlign: 'center',
                      }}
                    >
                      {item.time1}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-Regular',
                        color: '#6A7D94',
                        lineHeight: 12,
                        textAlign: 'center',
                      }}
                    >
                      {item.title1}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Medium',
                        color: '#293646',
                        textAlign: 'center',
                      }}
                    >
                      {item.time2}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-Regular',
                        color: '#6A7D94',
                        lineHeight: 12,
                        textAlign: 'center',
                      }}
                    >
                      {item.title2}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Poppins-Medium',
                        color: '#293646',
                        textAlign: 'center',
                      }}
                    >
                      {item.time3}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'Poppins-Regular',
                        color: '#6A7D94',
                        lineHeight: 12,
                        textAlign: 'center',
                      }}
                    >
                      {item.title3}
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );

};

export default History;
