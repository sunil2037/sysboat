import React, { useEffect, useState } from 'react';

import ForgotPasswordEntry from '../components/ForgotPassword/ForgotPasswordEntry';
import base64 from 'base-64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useEncodedUserData from '../hooks/useEncodedUserData';

const ForgotPasswordScreen = ({ navigation }) => {
    const {userdata} = useEncodedUserData();
    return (
        <ForgotPasswordEntry navigation={navigation} userdata={userdata} />
    );
};


export default ForgotPasswordScreen;
