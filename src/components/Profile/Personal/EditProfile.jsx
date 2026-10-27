import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Back, Pen } from '../../../Helper/IconsLoad';
import CustomDropdown from '../../../Helper/CustomDropdown';
import { DateTimePickerComponent } from '../../../Helper/DateTimePicker';
import { getFontSize } from '../../../Helper/Helper';
const EditProfile = ({ navigation }) => {
  const [text, onChangeText] = React.useState('Useless Text');
  const [number, onChangeNumber] = React.useState('');
  const [maritalStatus, setMaritalStatus] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [bloodGroup, setBloodGroup] = React.useState('');

  return (
    <SafeAreaView>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 15 }}
        style={{ backgroundColor: 'white', height: '100%' }}>
        <View style={{ paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
              }}>
              <Back />
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 16,
                lineHeight: 18,
              }}>
              Edit Profile
            </Text>
          </View>
          <View>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: 'black',
                  width: 120,
                  height: 120,
                  borderRadius: 100,
                  position: 'relative',
                }}>
                <View
                  style={{
                    backgroundColor: 'white',
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 50,
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    borderWidth: 1,
                    borderColor: '#F1F1F1',
                  }}>
                  <Pen width={25} height={25} />
                </View>
              </View>
            </View>
            <View>
              <Text
                style={{
                  fontFamily: 'Poppins-Medium',
                  paddingTop: 40,
                  fontSize: 15,
                }}>
                Your Information
              </Text>
              <View style={{ gap: 20, paddingTop: 20 }}>
                <TextInput
                  placeholderTextColor="#717171"
                  style={styles.input}
                  onChangeText={onChangeNumber}
                  value={number}
                  placeholder="Your Name"
                  keyboardType="string"
                />
                <CustomDropdown
                  options={['None', 'Single', 'Married', 'Divorced', 'Widowed']}
                  selectedValue={maritalStatus}
                  title={'Select Marital Status'}
                  onSelect={setMaritalStatus}
                />
                <CustomDropdown
                  options={['None', 'Men', 'Women', 'Transgender']}
                  title={'Select Gender'}
                  selectedValue={gender}
                  onSelect={setGender}
                />
                <CustomDropdown
                  title={'Select Blood Group'}
                  options={[
                    'None',
                    'A+',
                    'A-',
                    'B+',
                    'B-',
                    'AB+',
                    'AB-',
                    'O+',
                    'O-',
                  ]}
                  selectedValue={bloodGroup}
                  onSelect={setBloodGroup}
                />
                <DateTimePickerComponent />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderWidth: 2,
    borderColor: '#F4F4F4',
    color: '#F1F1F1',
    padding: 10,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    borderRadius: 10,
  },
});

export default EditProfile;
