import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AntDesign, FontAwesome6 } from "@expo/vector-icons";

// Components
import Nav from "../components/common/Nav";
import InputField from "../components/common/AuthInputField";
import NotFound from "../components/common/NotFound";
import FilterButtons from "../components/common/FilterButtons";
import TopRatedUserCard from "../components/common/TopRatedUserCard";
import TaskCard from "../components/common/TaskCard";
import TopRatedExplore from "../components/common/TopRatedExplore";
// Hooks & Context
import { useHomeScreen } from "../hooks/useHomeScreen";
import { useExitAppOnBack } from "../utils/appBack";
import { usePostContext } from "../contexts/PostContext";

// Utils & Config
import {
  formatCurrency,
  getCurrencyInfo,
  convertCurrency,
} from "../utils/currencyChange";
import Colors from "../config/Colors";

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { refreshing } = usePostContext();
  useExitAppOnBack();

  const {
    t,
    theme,
    filterOptions,
    activeFilter,
    searchQuery,
    setSearchQuery,
    setActiveFilter,
    topRatedUsers,
    displayTasks,
    activeIndices,
    setActiveIndices,
    selectedLocation,
    loading,
    handleRefresh,
    handleClearLocation,
    currentLocation,
  } = useHomeScreen();

  // Memoized currency conversion function
  const getConvertedCompensation = useCallback(
    (task: any) => {
      if (task.compensationType !== "Monitarely") return null;

      try {
        const originalAmount = parseFloat(task.monitarily) || 0;

        if (!currentLocation) {
          return task.currencyInfo
            ? `${task.currencyInfo.symbol}${originalAmount.toLocaleString()}`
            : `$${originalAmount.toLocaleString()}`;
        }

        if (!task.currencyInfo) {
          return formatCurrency(originalAmount, currentLocation);
        }

        const targetCurrency = getCurrencyInfo(currentLocation).code;
        const convertedAmount = convertCurrency(
          originalAmount,
          task.currencyInfo.code,
          targetCurrency,
        );

        return formatCurrency(convertedAmount, currentLocation);
      } catch (error) {
        console.error("Currency conversion error:", error);
        return task.currencyInfo
          ? `${task.currencyInfo.symbol}${parseFloat(task.monitarily) || 0}`
          : `$${parseFloat(task.monitarily) || 0}`;
      }
    },
    [currentLocation],
  );

  // Handle task press
  const handleTaskPress = useCallback(
    (task: any) => {
      navigation.navigate("OfferDetail", { postRequest: task });
    },
    [navigation],
  );

  // Handle top rated user press
  const handleUserPress = useCallback(
    (user: any) => {
      navigation.navigate("TopRatedUserProfile", {
        user,
        applier: false,
        postRequest: {},
      });
    },
    [navigation],
  );

  // Handle image scroll
  const handleImageScroll = useCallback((index: number, slideIndex: number) => {
    setActiveIndices((prev) => ({ ...prev, [index]: slideIndex }));
  }, []);

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.primary }]}>
        {t("home.txt12")}
      </Text>
    </View>
  );

  // Render task list
  const renderTaskList = () => (
    <FlatList
      data={displayTasks}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      scrollEventThrottle={16}
      renderItem={({ item, index }) => (
        <TaskCard
          task={item}
          index={index}
          onPress={handleTaskPress}
          activeIndex={activeIndices[index] || 0}
          onImageScroll={handleImageScroll}
          getConvertedCompensation={getConvertedCompensation}
          theme={theme}
          t={t}
        />
      )}
      ListEmptyComponent={
        !loading && (
          <View style={styles.notFoundContainer}>
            <NotFound title={t("home.txt11")} />
          </View>
        )
      }
    />
  );


  return (
    <View style={{ backgroundColor: theme.white, flex: 1 }}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Navigation Header */}
      <Nav
        gradient
        gradientColors={[Colors.primary, "#0b1544ff"]}
        title={t("home.txt1")}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.white }]}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={[styles.screen, { backgroundColor: theme.white }]}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <InputField
                placeholder={t("home.txt2")}
                placeholderColor={theme.grey}
                height={RFPercentage(6)}
                backgroundColor={
                  theme.mode === "dark" ? "#131214ff" : "#F1F3F5"
                }
                borderWidth={0}
                borderRadius={10}
                color={theme.heading}
                handleFeild={setSearchQuery}
                value={searchQuery}
                icon={true}
                fontSize={RFPercentage(1.7)}
                width="97%"
              />
            </View>

            {/* Categories Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.heading }]}>
                {t("home.txt3")}
              </Text>
            </View>

            {/* Filter Buttons */}
            <FilterButtons
              filters={filterOptions}
              activeFilter={activeFilter}
              onFilterPress={setActiveFilter}
              theme={theme}
            />

            {/* Top Rated Users Section */}
            {topRatedUsers?.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.heading }]}>
                    {t("profileRank.txt1")}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("TopRatedUsers")}
                  >
                    <Text style={[styles.seeAllText, { color: theme.primary }]}>
                      {t("profileRank.txt2")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  horizontal
                  data={topRatedUsers}
                  keyExtractor={(item, index) => `${item.userId}-${index}`}
                  contentContainerStyle={styles.topRatedContainer}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TopRatedUserCard
                      user={item}
                      onPress={() => handleUserPress(item)}
                      // onPress={()=> {navigation.navigate("InterestSelection")}}
                      darkMode={theme.mode === "dark"}
                      t={t}
                    />
                  )}
                />
              </>
            ) : (
              <TopRatedExplore t={t} navigation={navigation} />
            )}

            {/* Recent Requests Section */}
            <View style={[styles.sectionHeader, styles.recentRequestsHeader]}>
              <Text style={[styles.sectionTitle, { color: theme.heading }]}>
                {t("home.txt9")}
              </Text>

              <View style={styles.locationContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("Location", { home: true })
                  }
                >
                  <Text style={[styles.locationText, { color: theme.primary }]}>
                    {selectedLocation.name2
                      ? selectedLocation.name2.length > 15
                        ? `${selectedLocation.name2.slice(0, 15)}...`
                        : selectedLocation.name2
                      : t("location.by")}
                  </Text>
                </TouchableOpacity>

                {selectedLocation.name2 && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.clearLocationButton}
                    onPress={handleClearLocation}
                  >
                    <AntDesign
                      name="closecircle"
                      size={RFPercentage(2.5)}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tasks List */}
            {loading ? renderLoading() : renderTaskList()}

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  scrollView: {
    width: "100%",
  },
  searchContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: RFPercentage(2),
  },
  sectionHeader: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: RFPercentage(2),
  },
  recentRequestsHeader: {
    marginTop: RFPercentage(2.5),
  },
  sectionTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
  },
  seeAllText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  topRatedContainer: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1),
    alignItems: "flex-start",
    justifyContent: "flex-start",
    alignSelf:"flex-start",
    // backgroundColor:"red",
    // flex:1,
    // width:"100%"
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.8),
  },
  clearLocationButton: {
    marginLeft: RFPercentage(1),
  },
  loadingContainer: {
    marginTop: RFPercentage(18),
    alignItems: "center",
  },
  loadingText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(0.5),
  },
  notFoundContainer: {
    bottom: RFPercentage(9),
  },
  bottomSpacing: {
    marginBottom: RFPercentage(6),
  },
});

export default HomeScreen;
