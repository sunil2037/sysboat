import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState } from 'react';
import { navigate } from '../navigation/NavigationRef';
export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [visibleForm, setVisibleForm] = useState(false);

  // const logout = async () => {
  //   try {
  //     await AsyncStorage.removeItem('token');
  //     await AsyncStorage.removeItem('type');
  //     setTimeout(() => {
  //       navigate('Signin');
  //     }, 100);
  //   } catch (error) {
  //     console.warn('Logout failed', error);
  //   }
  // };


  return (
    <AppContext.Provider value={{ visibleForm, setVisibleForm}}>
      {children}
    </AppContext.Provider>
  );
};
