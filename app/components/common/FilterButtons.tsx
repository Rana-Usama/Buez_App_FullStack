import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { FilterOption } from "../../types/home.types";
import Colors from "../../config/Colors";

interface FilterButtonsProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterPress: (filter: string) => void;
  theme: any;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({
  filters,
  activeFilter,
  onFilterPress,
  theme,
}) => {
  const getCategoryColors = (filterValue: string) => {
    const isDarkMode = theme.mode === "dark";

    if (isDarkMode) {
      // DARK THEME COLORS
      switch (filterValue.toLowerCase()) {
        case "all":
          return {
            backgroundColor: "#1e3b8a96", // Dark blue
            iconColor: "#385576ff", // Light blue
            borderColor: "#3c4c6640",
            backgroundColorHex: "#1f2c5058",
            iconColorHex: "#364352ff",
          };
        case "cleaning":
          return {
            backgroundColor: "#14532D", // Dark green
            iconColor: "#86EFAC", // Light green
            borderColor: "#50765240",
            backgroundColorHex: "#284e374c",
            iconColorHex: "#417254ff",
          };
        case "moving":
          return {
            backgroundColor: "#7C2D12", // Dark orange/brown
            iconColor: "#FDBA74", // Light orange
            borderColor: "#76675040",
            backgroundColorHex: "#422a235e",
            iconColorHex: "#634f38ff",
          };
        case "gardening":
          return {
            backgroundColor: "#365314", // Dark lime green
            iconColor: "#BBF7D0", // Light lime
            borderColor: "#59694540",
            backgroundColorHex: "#33491b4f",
            iconColorHex: "#235433ff",
          };
        case "gaming":
          return {
            backgroundColor: "#581C87", // Dark purple
            iconColor: "#D8B4FE", // Light purple
            borderColor: "#63416940",
            backgroundColorHex: "#36184c4d",
            iconColorHex: "#443355ff",
          };
        case "other":
          return {
            backgroundColor: "#374151", // Dark gray
            iconColor: "#D1D5DB", // Light gray
            borderColor: "#46414140",
            backgroundColorHex: "#3741514f",
            iconColorHex: "#3d4a5dff",
          };
        default:
          return {
            backgroundColor: theme.card || "#1F2937",
            iconColor: theme.text || "#F9FAFB",
            borderColor: theme.border,
            backgroundColorHex: theme.card || "#1F2937",
            iconColorHex: theme.text || "#F9FAFB",
          };
      }
    } else {
      switch (filterValue.toLowerCase()) {
        case "all":
          return {
            backgroundColor: "#E3F2FD", // Light blue
            iconColor: Colors.primary,
            borderColor: Colors.primary + "40",
            backgroundColorHex: "#E3F2FD",
            iconColorHex: Colors.primary,
          };
        case "cleaning":
          return {
            backgroundColor: "#E8F5E9", // Light green
            iconColor: "#4CAF50",
            borderColor: "#4CAF5040",
            backgroundColorHex: "#E8F5E9",
            iconColorHex: "#4CAF50",
          };
        case "moving":
          return {
            backgroundColor: "#FFF3E0", // Light orange
            iconColor: "#FF9800",
            borderColor: "#FF980040",
            backgroundColorHex: "#FFF3E0",
            iconColorHex: "#FF9800",
          };
        case "gardening":
          return {
            backgroundColor: "#F1F8E9", // Light lime green
            iconColor: "#8BC34A",
            borderColor: "#8BC34A40",
            backgroundColorHex: "#F1F8E9",
            iconColorHex: "#8BC34A",
          };
        case "gaming":
          return {
            backgroundColor: "#F3E5F5", // Light purple
            iconColor: "#9C27B0",
            borderColor: "#9C27B040",
            backgroundColorHex: "#F3E5F5",
            iconColorHex: "#9C27B0",
          };
        case "other":
          return {
            backgroundColor: "#E0E0E0", // Light gray
            iconColor: "#757575",
            borderColor: "#75757540",
            backgroundColorHex: "#E0E0E0",
            iconColorHex: "#757575",
          };
        default:
          return {
            backgroundColor: theme.grey || "#F5F5F5",
            iconColor: Colors.lightGrey,
            borderColor: theme.border,
            backgroundColorHex: theme.grey || "#F5F5F5",
            iconColorHex: Colors.lightGrey,
          };
      }
    }
  };

  const getIcon = (filter: FilterOption) => {
    const categoryColors = getCategoryColors(filter.value);
    const isActive = activeFilter === filter.label;

    const iconProps = {
      size: RFPercentage(2.5),
      color: isActive ? "white" : categoryColors.iconColorHex,
    };

    switch (filter.iconType) {
      case "ionicons":
        return <Ionicons name={filter.icon as any} {...iconProps} />;
      case "material":
        return <MaterialIcons name={filter.icon as any} {...iconProps} />;
      case "material-community":
        return (
          <MaterialCommunityIcons name={filter.icon as any} {...iconProps} />
        );
      case "fontawesome5":
        return <FontAwesome5 name={filter.icon as any} {...iconProps} />;
      default:
        return <MaterialIcons name="category" {...iconProps} />;
    }
  };

  const renderFilterButton = ({ item }: { item: FilterOption }) => {
    const isActive = activeFilter === item.label;
    const categoryColors = getCategoryColors(item.value);

    return (
      <TouchableOpacity
        onPress={() => onFilterPress(item.label)}
        style={styles.filterButtonContainer}
        activeOpacity={0.7}
      >
        {isActive ? (
          // Active state - all buttons use same gradient
          <LinearGradient
            colors={[Colors.primary, "#4557B0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, styles.filterButtonWithIcon]}
          >
            {getIcon(item)}
          </LinearGradient>
        ) : (
          // Inactive state - category-specific colors (dark/light theme)
          <View
            style={[
              styles.nonGradient,
              styles.filterButtonWithIcon,
              {
                backgroundColor: categoryColors.backgroundColorHex,
                borderColor: categoryColors.borderColor,
                borderWidth: 1,
              },
            ]}
          >
            {getIcon(item)}
          </View>
        )}
        <Text
          style={[
            styles.filterButtonText,
            {
              color: isActive ? Colors.primary : theme.lightGrey,
              fontWeight: isActive ? "600" : "400",
            },
          ]}
          numberOfLines={1}
        >
          {item.label.length > 6
            ? `${item.label.substring(0, 6)}..`
            : item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      horizontal
      data={filters}
      keyExtractor={(item) => item.value}
      keyboardShouldPersistTaps="always"
      contentContainerStyle={styles.filterButtonsContainer}
      showsHorizontalScrollIndicator={false}
      renderItem={renderFilterButton}
    />
  );
};

const styles = StyleSheet.create({
  filterButtonsContainer: {
    marginTop: RFPercentage(1.4),
    gap: 26,
    paddingHorizontal: RFPercentage(2),
  },
  filterButtonContainer: {
    alignItems: "center",
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RFPercentage(100),
    height: RFPercentage(7),
    width: RFPercentage(7),
  },
  nonGradient: {
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    height: RFPercentage(7),
    width: RFPercentage(7),
    borderWidth: 1,
  },
  filterButtonWithIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.5),
    textAlign: "center",
    marginTop: RFPercentage(0.7),
  },
});

export default memo(FilterButtons);
