import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { RFPercentage } from 'react-native-responsive-fontsize';
import Colors from '../../config/Colors';


interface TopRatedExploreProps {
  t: (key: string) => string;
  navigation: any;
}

const TopRatedExplore: React.FC<TopRatedExploreProps> = ({ t, navigation }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('TopRatedUsers')}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.text}>{t('profileRank.txt45')}</Text>
        <FontAwesome6
          name="arrow-right"
          size={RFPercentage(1.8)}
          color={Colors.primary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: RFPercentage(2),
    width: '90%',
    alignSelf: 'flex-start',
    marginLeft: RFPercentage(2.2),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(2),
    borderColor: Colors.primary + '30',
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.primary + '08',
  },
  text: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: RFPercentage(1.6),
    marginRight: RFPercentage(1),
    color: Colors.primary,
  },
});

export default React.memo(TopRatedExplore);