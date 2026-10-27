import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import React, { Suspense, useRef } from 'react';
import App from '../../App';
import { AppProvider } from './AppProvider';
import { AuthProvider } from './AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ErrorBoundary from 'react-native-error-boundary';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { getCurrentRouteName, NavigationRef } from '../navigation/NavigationRef';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SocketProvider } from '../Apis/Services/SocketContext';

const queryClient = new QueryClient();
const MainApp = () => {
  const onStateChange = useRef(() => { });

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <SocketProvider>
          <StatusBar translucent={true} barStyle={"dark-content"} />
          <BottomSheetModalProvider>
            <NavigationContainer onStateChange={() => onStateChange.current && onStateChange.current()}
              ref={NavigationRef}>
              <AuthProvider>
                <QueryClientProvider client={queryClient}>
                  <App onStateChange={onStateChange} />
                </QueryClientProvider>
              </AuthProvider>
            </NavigationContainer>
          </BottomSheetModalProvider>
        </SocketProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default MainApp;

const styles = StyleSheet.create({});
