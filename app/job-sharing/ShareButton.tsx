import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet,
  StyleProp,
  ViewStyle,
  View 
} from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { useShareJob } from './useShareJob';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '../config/Colors';
import { useAppTheme } from '../contexts/themeContext';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';

interface ShareButtonProps {
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
  companyName?: string;
  style?: StyleProp<ViewStyle>;
  showLabel?: boolean;
  iconOnly?: boolean;
  variant?: 'default' | 'light' | 'dark';
  color? : string
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  jobId,
  jobTitle,
  jobDescription,
  companyName,
  style,
  showLabel = false,
  iconOnly = true,
  variant = 'default',
  color = Colors.primary
}) => {
  const { shareJob, isSharing } = useShareJob();
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const handleShare = async () => {
    const result = await shareJob({
      jobId,
      jobTitle,
      jobDescription,
      companyName,
    });

    if (result.success) {
      console.log('Shared successfully!');
    }
  };

  const getButtonStyles = () => {
    let backgroundColor, borderColor, textColor;

    switch (variant) {
      case 'light':
        backgroundColor = Colors.backBtnBg;
        borderColor = Colors.white3;
        textColor = Colors.white;
        break;
      case 'dark':
        backgroundColor = Colors.primary + '20';
        borderColor = Colors.primary + '30';
        textColor = Colors.primary;
        break;
      default:
        backgroundColor = theme.mode === 'dark' 
          ? "rgba(87, 84, 121, 0.34)"
          : Colors.primary + '20';
        borderColor = theme.mode === 'dark' 
          ? Colors.backBtnBg 
          : Colors.primary + '30';
        textColor = theme.mode === 'dark' ? Colors.white : Colors.primary;
    }

    return { backgroundColor, borderColor, textColor };
  };

  const { backgroundColor, borderColor, textColor } = getButtonStyles();

  if (iconOnly) {
    return (
      <TouchableOpacity
        style={[
          styles.iconButton,
          { backgroundColor },
          style,
        ]}
        onPress={handleShare}
        disabled={isSharing}
        activeOpacity={0.7}
      >
        {isSharing ? (
          <ActivityIndicator 
            size="small" 
            color={color} 
          />
        ) : (
         <Feather
            name="share-2"
            size={RFPercentage(2.2)}
            color={color}
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth: 1,
        },
        style,
      ]}
      onPress={handleShare}
      disabled={isSharing}
      activeOpacity={0.7}
    >
      {isSharing ? (
        <ActivityIndicator 
          size="small" 
          color={textColor} 
        />
      ) : (
        <View style={styles.buttonContent}>
           <Feather
            name="share-2"
            size={RFPercentage(1.8)}
            color={textColor}
            style={styles.icon}
          />
          {showLabel && (
            <Text style={[styles.buttonText, { color: textColor }]}>
              {t('offerDetail.share') || 'Share'}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(100),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: RFPercentage(0.5),
  },
  buttonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: 'Poppins_500Medium',
  },
});