import { BaseToast, ErrorToast } from 'react-native-toast-message';
import { View, Text } from 'react-native';
import React from 'react';
import { getFontSize } from '../Helper/Helper';

const ToastConfig = {

  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#3A7D44',
        borderLeftWidth: 5,
        zIndex: 9999,
        elevation: 10,
      }}
      contentContainerStyle={{}}
      text1Style={{
        fontSize: 15,
        fontFamily: 'PoppinsMedium',
      }}
    />
  ),

  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        zIndex: 9999,
        elevation: 10,
      }}
      contentContainerStyle={{}}
      text1Style={{
        fontFamily: 'PoppinsMedium',
        fontSize: 15,
      }}

    />
  ),

  tomatoToast: ({ text1, props }) => (
    <View style={{ height: 60, width: '100%' }}>
      <Text>{text1}</Text>
      <Text>{props.uuid}</Text>
    </View>
  ),
};

export default ToastConfig;
