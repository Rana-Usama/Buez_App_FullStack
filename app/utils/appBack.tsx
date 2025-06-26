// useExitAppOnBack.ts
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import React from 'react';

export const useExitAppOnBack = () => {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp(); 
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove(); 
    }, [])
  );
};
