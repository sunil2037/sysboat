import {
  Button, StyleSheet, Text, View, requireNativeComponent,
  UIManager,
  Platform,
  TextInput,
} from 'react-native'
import React, { useEffect, useState } from 'react'


const LINKING_ERROR =
  `The package 'react-native-android-bottomsheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

type AndroidBottomsheetProps = {
  'visible': boolean;
  'onDismiss'?: () => void;
  'peekHeight'?: number;
  'maxHeight'?: number;
  'children': React.ReactNode;
  'aria-label'?: string;
  'backdropDimAmount'?: number;
  'cancelable'?: boolean;
};

const ComponentName = 'AndroidBottomsheetView';

export const AndroidBottomsheetView: React.ComponentType<AndroidBottomsheetProps> =
  UIManager.getViewManagerConfig(ComponentName) != null
    ? (requireNativeComponent(ComponentName) as unknown as React.ComponentType<AndroidBottomsheetProps>)
    : (() => {
      throw new Error(LINKING_ERROR);
    });

export const BottomSheet = (props: AndroidBottomsheetProps) => {
  return (
    <AndroidBottomsheetView
      {...props}
    >
      {props.children}
    </AndroidBottomsheetView>
  );
};
