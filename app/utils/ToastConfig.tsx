// toastConfig.js
import React from 'react';
import {Text, View, StyleSheet, Dimensions} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Colors from '../config/Colors';

const {width} = Dimensions.get('window');

const baseToastStyle = {
  borderLeftWidth: RFPercentage(1.5),
  paddingHorizontal: RFPercentage(2),
  paddingVertical: RFPercentage(2),
  borderRadius: RFPercentage(1),
  marginHorizontal: RFPercentage(2),
};

export const toastConfig = {
  success: ({text1, text2}) => (
    <View style={[styles.toastContainer, styles.success]}>
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
  error: ({text1, text2}) => (
    <View style={[styles.toastContainer, styles.error]}>
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
  info: ({text1, text2}) => (
    <View style={[styles.toastContainer, styles.info]}>
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    ...baseToastStyle,
    width: width * 0.85,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightWhite,
    borderRightWidth: 1,
    borderRightColor: Colors.lightWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.lightWhite,
  },
  success: {
    backgroundColor: 'white',
    borderLeftColor: Colors.primary,
  },
  error: {
    backgroundColor: 'white',
    borderLeftColor: '#dc3545',
  },
  info: {
    backgroundColor: 'white',
    borderLeftColor: '#17a2b8',
  },
  text1: {
    fontFamily: 'Poppins_500Medium',
    fontSize: RFPercentage(1.7),
    color: '#000',
  },
  text2: {
    fontFamily: 'Poppins_400Regular',
    fontSize: RFPercentage(1.5),
    color: '#000',
  },
});
