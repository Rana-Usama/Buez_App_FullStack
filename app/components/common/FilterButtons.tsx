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
    const value = filterValue.toLowerCase();

    if (isDarkMode) {
      switch (value) {
        case "all":
          return {
            backgroundColor: "#1e3b8a96",
            iconColor: "#385576ff",
            borderColor: "#3c4c6640",
            backgroundColorHex: "#1f2c5058",
            iconColorHex: "#364352ff",
          };
        case "cleaning":
          return {
            backgroundColor: "#14532D",
            iconColor: "#86EFAC",
            borderColor: "#50765240",
            backgroundColorHex: "#284e374c",
            iconColorHex: "#417254ff",
          };
        case "moving":
          return {
            backgroundColor: "#7C2D12",
            iconColor: "#FDBA74",
            borderColor: "#76675040",
            backgroundColorHex: "#422a235e",
            iconColorHex: "#634f38ff",
          };
        case "gardening":
          return {
            backgroundColor: "#365314",
            iconColor: "#BBF7D0",
            borderColor: "#59694540",
            backgroundColorHex: "#33491b4f",
            iconColorHex: "#235433ff",
          };
        case "gaming":
          return {
            backgroundColor: "#581C87",
            iconColor: "#D8B4FE",
            borderColor: "#63416940",
            backgroundColorHex: "#36184c4d",
            iconColorHex: "#443355ff",
          };
        case "plumbing":
          return {
            backgroundColor: "#0B3D91",
            iconColor: "#82CFFF",
            borderColor: "#37567640",
            backgroundColorHex: "#0a2b6f4f",
            iconColorHex: "#4195FF",
          };
        case "electrical":
          return {
            backgroundColor: "#5C3D00",
            iconColor: "#FFD86B",
            borderColor: "#66554040",
            backgroundColorHex: "#4b2f004f",
            iconColorHex: "#FFBF00",
          };
        case "carpentry":
          return {
            backgroundColor: "#3E2723",
            iconColor: "#FFAB91",
            borderColor: "#5a3f3840",
            backgroundColorHex: "#3a1f194f",
            iconColorHex: "#FF7A55",
          };
        case "painting":
          return {
            backgroundColor: "#4A148C",
            iconColor: "#E1BEE7",
            borderColor: "#5f2c5f40",
            backgroundColorHex: "#3d0f764f",
            iconColorHex: "#CE93D8",
          };
        case "delivery":
          return {
            backgroundColor: "#263238",
            iconColor: "#90A4AE",
            borderColor: "#455A6440",
            backgroundColorHex: "#1b2a304f",
            iconColorHex: "#78909C",
          };
        case "tutoring":
          return {
            backgroundColor: "#1A237E",
            iconColor: "#8C9EFF",
            borderColor: "#2f3f7640",
            backgroundColorHex: "#151b504f",
            iconColorHex: "#536DFE",
          };
        case "event setup":
          return {
            backgroundColor: "#004D40",
            iconColor: "#80CBC4",
            borderColor: "#2b5e5640",
            backgroundColorHex: "#00332f4f",
            iconColorHex: "#4DB6AC",
          };
        case "photography":
          return {
            backgroundColor: "#311B92",
            iconColor: "#B39DDB",
            borderColor: "#4a2b7f40",
            backgroundColorHex: "#220f6f4f",
            iconColorHex: "#9575CD",
          };
        case "pet care":
          return {
            backgroundColor: "#2E7D32",
            iconColor: "#A5D6A7",
            borderColor: "#41764b40",
            backgroundColorHex: "#1f4d1f4f",
            iconColorHex: "#81C784",
          };
        case "other":
          return {
            backgroundColor: "#374151",
            iconColor: "#D1D5DB",
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
      // Light theme
      switch (value) {
        case "all":
          return {
            backgroundColor: "#E3F2FD",
            iconColor: Colors.primary,
            borderColor: Colors.primary + "40",
            backgroundColorHex: "#E3F2FD",
            iconColorHex: Colors.primary,
          };
        case "cleaning":
          return {
            backgroundColor: "#E8F5E9",
            iconColor: "#4CAF50",
            borderColor: "#4CAF5040",
            backgroundColorHex: "#E8F5E9",
            iconColorHex: "#4CAF50",
          };
        case "moving":
          return {
            backgroundColor: "#FFF3E0",
            iconColor: "#FF9800",
            borderColor: "#FF980040",
            backgroundColorHex: "#FFF3E0",
            iconColorHex: "#FF9800",
          };
        case "gardening":
          return {
            backgroundColor: "#F1F8E9",
            iconColor: "#8BC34A",
            borderColor: "#8BC34A40",
            backgroundColorHex: "#F1F8E9",
            iconColorHex: "#8BC34A",
          };
        case "gaming":
          return {
            backgroundColor: "#F3E5F5",
            iconColor: "#9C27B0",
            borderColor: "#9C27B040",
            backgroundColorHex: "#F3E5F5",
            iconColorHex: "#9C27B0",
          };
        case "plumbing":
          return {
            backgroundColor: "#E3F2FD",
            iconColor: "#2196F3",
            borderColor: "#2196F340",
            backgroundColorHex: "#E3F2FD",
            iconColorHex: "#2196F3",
          };
        case "electrical":
          return {
            backgroundColor: "#FFF8E1",
            iconColor: "#FFB300",
            borderColor: "#FFB30040",
            backgroundColorHex: "#FFF8E1",
            iconColorHex: "#FFB300",
          };
        case "carpentry":
          return {
            backgroundColor: "#FBE9E7",
            iconColor: "#FF5722",
            borderColor: "#FF572240",
            backgroundColorHex: "#FBE9E7",
            iconColorHex: "#FF5722",
          };
        case "painting":
          return {
            backgroundColor: "#F3E5F5",
            iconColor: "#AB47BC",
            borderColor: "#AB47BC40",
            backgroundColorHex: "#F3E5F5",
            iconColorHex: "#AB47BC",
          };
        case "delivery":
          return {
            backgroundColor: "#E0F7FA",
            iconColor: "#00ACC1",
            borderColor: "#00ACC140",
            backgroundColorHex: "#E0F7FA",
            iconColorHex: "#00ACC1",
          };
        case "tutoring":
          return {
            backgroundColor: "#E8EAF6",
            iconColor: "#3F51B5",
            borderColor: "#3F51B540",
            backgroundColorHex: "#E8EAF6",
            iconColorHex: "#3F51B5",
          };
        case "event setup":
          return {
            backgroundColor: "#E0F2F1",
            iconColor: "#00796B",
            borderColor: "#00796B40",
            backgroundColorHex: "#E0F2F1",
            iconColorHex: "#00796B",
          };
        case "photography":
          return {
            backgroundColor: "#F3E5F5",
            iconColor: "#8E24AA",
            borderColor: "#8E24AA40",
            backgroundColorHex: "#F3E5F5",
            iconColorHex: "#8E24AA",
          };
        case "pet care":
          return {
            backgroundColor: "#E8F5E9",
            iconColor: "#43A047",
            borderColor: "#43A04740",
            backgroundColorHex: "#E8F5E9",
            iconColorHex: "#43A047",
          };
        case "other":
          return {
            backgroundColor: "#E0E0E0",
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
