import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationHelper = ({ message }) => {
  const hasScheduled = useRef(false);
  const [companyInTime, setCompanyTime] = useState('');
  useEffect(() => {
    const loadData = async () => {
      const time = await AsyncStorage.getItem('CompanyInTime');
      setCompanyTime(time);
    };
    loadData();
  }, []);

  useEffect(() => {
  }, [companyInTime]);



  return null;
};

export default NotificationHelper;
