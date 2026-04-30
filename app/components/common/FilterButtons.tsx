import React, { memo, useMemo } from "react";
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
  // ── GET CATEGORY COLORS ──
  const getCategoryColors = useMemo(() => {
    return (filterValue: string) => {
      const isDarkMode = theme.mode === "dark";
      const categoryKey = filterValue
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace("event setup", "eventSetup")
        .replace(
          "pet care",
          "petCare",
        ) as keyof typeof Colors.categoryColors.dark;

      const colorSet = isDarkMode
        ? Colors.categoryColors.dark[categoryKey]
        : Colors.categoryColors.light[categoryKey];

      return (
        colorSet || {
          backgroundColor: theme.card || "#3b4a5eff",
          iconColor: "#261249ff",
          borderColor: theme.border,
          backgroundColorHex: "#2e236525",
          iconColorHex: "#4c14a1ff",
        }
      );
    };
  }, [theme.mode, theme.card, theme.text, theme.border]);

  // ── GET ICON ──
  const getIcon = useMemo(
    () => (filter: FilterOption, categoryColors: any, isActive: boolean) => {
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
    },
    [],
  );

  // ── RENDER FILTER BUTTON ──
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
          <LinearGradient
            colors={Colors.filterActiveGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, styles.filterButtonWithIcon]}
          >
            {getIcon(item, categoryColors, isActive)}
          </LinearGradient>
        ) : (
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
            {getIcon(item, categoryColors, isActive)}
          </View>
        )}

        <Text
          style={[
            styles.filterButtonText,
            {
              color: isActive
                ? theme.mode === "dark"
                  ? Colors.white
                  : Colors.primary
                : theme.lightGrey,
            },
          ]}
          numberOfLines={2}
        >
          {item.label.length > 8
            ? `${item.label.substring(0, 8)}..`
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
