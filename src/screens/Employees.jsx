import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import TopNavBar from '../navigation/TopNavBar';
import backgroundImage from '../../assets/Icon/background.png';
import MainScreen from '../components/Employees/MainScreen';
import { Back } from '../Helper/IconsLoad';
import { getFontSize, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
const Employees = ({ children, navigation }) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{ flex: 1, backgroundColor: '#F9F9F9', paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}>
        <View style={styles.container}>
          <View style={{ paddingBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
              }}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10, backgroundColor: '#CA282C', borderRadius: 50, }}>
                  <Back width={20} height={20} color={'#fcfcfcff'} />
                </TouchableOpacity>

                <Text
                  style={{
                    fontFamily: 'Poppins-Medium',
                    fontSize: 22,
                    color: '#293646',
                    lineHeight: 30,
                  }}>
                  Employee
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('PartsCrud')}>
                <Text
                  style={{
                    fontFamily: 'Poppins-Medium',
                    fontSize: 12,
                    color: '#CA282C',
                    lineHeight: 15,
                  }}>
                  Manage
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.content}>
            <MainScreen />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Employees;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },
});
