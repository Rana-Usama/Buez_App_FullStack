// useExitAppOnBack.ts
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import React from 'react';

export const useExitAppOnBack = () => {
  useFocusEffect(
    React.useCallback(() => {
      // Device back navigation is disabled app-wide. Swallow the hardware back
      // press (return true) so it neither pops the stack nor exits the app.
      const onBackPress = () => true;

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );
};
