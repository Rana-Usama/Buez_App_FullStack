import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Feather from "@expo/vector-icons/Feather";
import Colors from '../../config/Colors';
import { useAppTheme } from '../../contexts/themeContext';

interface Props {
  value?: any;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  password?: boolean;
  keyboardType?: string;
  customStyle?: object;
  handleBlur?: (event: any) => void;
  maxLength?: number;
  editable? : boolean
}

const InputFieldNew = (props: Props) => {
  const [visible, setVisible] = useState<boolean>(props.password ?  false : true);
  const {theme} = useAppTheme()
  const togglePasswordVisibility = () => {
    setVisible(!visible);
  };

  return (
    <View style={[styles.container, props.customStyle]}>
      <TextInput
        placeholder={props.placeholder}
        style={[styles.textInput, {color:theme.black}]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholderTextColor={theme.darkGrey}
        secureTextEntry={!visible}
        keyboardType={props.keyboardType}
        onBlur={props.handleBlur}
        maxLength={props.maxLength}
        editable={props.editable}
        
      />
      {props.password && (
        <TouchableOpacity onPress={togglePasswordVisibility} style={{}}>
          <Feather
            name={visible ? 'eye' : 'eye-off'}
            size={RFPercentage(1.8)}
            color={theme.lightGrey}
            style={{right: RFPercentage(0.7)}}
          />
        </TouchableOpacity>
      )}

      {props.maxLength && (
        <Text style={styles.counterText}>
          {props.value?.length || 0}/{props.maxLength}
        </Text>
      )}
    </View>
  );
};

export default InputFieldNew;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    borderRadius: RFPercentage(1.6),
    marginTop: RFPercentage(2.5),
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: RFPercentage(1.3),
    height: RFPercentage(6.5),
  },
  textInput: {
    width: '95%',
    color: Colors.black,
    fontFamily: 'Poppins_400Regular',
    fontSize: RFPercentage(1.7),
    alignSelf: 'center',
    height: RFPercentage(5.7),
    justifyContent: 'center',
    paddingVertical:0,
    
  },
  counterText: {
    color: '#6B7280',
    fontSize: RFPercentage(1.3),
    fontFamily: 'Poppins_400Regular',
    right:RFPercentage(2)
  },
});
