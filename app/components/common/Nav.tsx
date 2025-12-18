// components/Nav.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  TextInput,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
// config
import Colors from "../../config/Colors";
import { Icons } from "../../config/theme";
import { useNotifications } from "../../contexts/notification.context";
import { useAppTheme } from "../../contexts/themeContext";

const { width } = Dimensions.get("window");

interface NavProps {
  dpNull?: boolean;
  crown?: boolean;
  marginTop?: number;
  title: string;
  onPress?: () => void;
  leftLogo?: boolean;
  post?: boolean;
  profileImage?: string | null;
  showSearch?: boolean;
  onSearchPress?: () => void;
  onSearch?: (query: string) => void;
  onSearchClose?: () => void;
  gradient?: boolean;
  gradientColors?: string[];
  curvedBottom?: boolean;
  showWave?: boolean;
  titleCenter?: boolean;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  subtitle?: string;
  searchPlaceholder?: string;
  autoFocusSearch?: boolean;
}

const Nav: React.FC<NavProps> = ({
  dpNull = false,
  crown = false,
  title,
  leftLogo = true,
  post = false,
  profileImage,
  showSearch = false,
  onSearchPress,
  onSearch,
  onSearchClose,
  onPress,
  gradient = true,
  gradientColors = [
    Colors.gradient1 || "#667eea",
    Colors.gradient2 || "#764ba2",
  ],
  curvedBottom = true,
  showWave = false,
  titleCenter = true,
  rightAction,
  leftAction,
  subtitle,
  searchPlaceholder = "Search...",
  autoFocusSearch = false,
}) => {
  const { unreadCount } = useNotifications();
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.95)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      showWave &&
        Animated.loop(
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          { iterations: -1 }
        ),
    ]).start();
  }, []);

  const handleSearchToggle = () => {
    if (isSearchOpen) {
      // Close search
      Animated.parallel([
        Animated.timing(searchAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsSearchOpen(false);
        setSearchQuery("");
        if (onSearchClose) onSearchClose();
        if (onSearch) onSearch("");
      });
    } else {
      // Open search
      setIsSearchOpen(true);
      if (onSearchPress) {
        onSearchPress();
      } else {
        Animated.parallel([
          Animated.timing(searchAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(contentAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (onSearch) onSearch(text);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (onSearch) onSearch("");
  };

  const handleCloseSearch = () => {
    handleSearchToggle();
  };

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleBack = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  const handleNavigate = (screen: string) => {
    navigation.navigate(screen);
  };

  const NotificationBadge = () => {
    if (unreadCount <= 0) return null;

    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </Text>
      </View>
    );
  };



  const WaveEffect = () => (
    <Animated.View
      style={[
        styles.wave,
        {
          opacity: waveAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 0.6, 0.3],
          }),
          transform: [
            {
              translateX: waveAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-width, width],
              }),
            },
          ],
        },
      ]}
    />
  );

  // Search Bar Component
  const SearchBar = () => (
    <Animated.View
      style={[
        styles.searchContainer,
        {
          opacity: searchAnim,
          transform: [
            {
              translateX: searchAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [width, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.searchBar, { backgroundColor: theme.white + "20" }]}>
        <TouchableOpacity
          onPress={handleCloseSearch}
          activeOpacity={0.7}
          style={styles.searchBackButton}
        >
          <Ionicons name="arrow-back" size={RFPercentage(2.5)} color="white" />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={RFPercentage(2)}
            color="white"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus={autoFocusSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
            selectionColor="rgba(255,255,255,0.5)"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              activeOpacity={0.7}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={RFPercentage(2)}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );

  // Main Header Content
  const HeaderContent = () => (
    <Animated.View
      style={[
        styles.headerContent,
        {
          opacity: contentAnim,
          transform: [
            {
              translateX: contentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-width * 0.3, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Left Section */}
      <View style={[styles.leftSection, !titleCenter && { flex: 1 }]}>
        {leftAction ||
          (leftLogo ? (
            <TouchableOpacity
              onPress={handleOpenDrawer}
              activeOpacity={0.7}
              style={styles.menuButton}
            >
              <Ionicons name="menu" size={RFPercentage(3)} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={RFPercentage(2.8)}
                color="white"
              />
            </TouchableOpacity>
          ))}
        {!titleCenter && (
          <Animated.Text
            style={[styles.title, styles.leftTitle]}
            numberOfLines={1}
          >
            {title}
          </Animated.Text>
        )}
      </View>

      {/* Center Section */}
      {titleCenter && (
        <View style={styles.centerSection}>
          <Animated.Text
            style={[
              styles.title,
              {
                transform: [{ scale: titleScale }],
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Animated.Text>
          {subtitle && (
            <Animated.Text
              style={[
                styles.subtitle,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-5, 0],
                      }),
                    },
                  ],
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Animated.Text>
          )}
        </View>
      )}

      {/* Right Section */}
      <View style={styles.rightSection}>
        {rightAction || (
          <>
            {showSearch && (
              <TouchableOpacity
                onPress={handleSearchToggle}
                activeOpacity={0.7}
                style={styles.iconButton}
              >
                <Ionicons
                  name="search"
                  size={RFPercentage(2.5)}
                  color="white"
                />
              </TouchableOpacity>
            )}

            {post ? (
              <TouchableOpacity
                onPress={() => handleNavigate("PostRequest")}
                activeOpacity={0.7}
                style={styles.postButton}
              >
                <Ionicons
                  name="add-circle"
                  size={RFPercentage(2.8)}
                  color="white"
                />
              </TouchableOpacity>
            ) : (
              !dpNull && (
                <TouchableOpacity
                  onPress={() => handleNavigate("Notifications")}
                  activeOpacity={0.7}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={RFPercentage(2.5)}
                    color="white"
                  />
                  <NotificationBadge />
                </TouchableOpacity>
              )
            )}
          </>
        )}
      </View>
    </Animated.View>
  );

  const HeaderWrapper = () => {
    if (gradient) {
      return (
        <View style={styles.container}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientHeader, curvedBottom && styles.curvedBottom]}
          >
            {showWave && <WaveEffect />}
            {isSearchOpen ? <SearchBar /> : <HeaderContent />}
          </LinearGradient>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.plainHeader,
          curvedBottom && styles.curvedBottom,
          { backgroundColor: theme.white },
        ]}
      >
        {isSearchOpen ? <SearchBar /> : <HeaderContent />}
      </View>
    );
  };

  return <HeaderWrapper />;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    elevation: 12,
    shadowColor: "#0b1544ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    zIndex: 100,
  },
  gradientHeader: {
    paddingTop: Platform.OS === "ios" ? RFPercentage(5) : RFPercentage(3),
    paddingBottom: RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
    overflow: "hidden",
    position: "relative",
  },
  plainHeader: {
    paddingTop: Platform.OS === "ios" ? RFPercentage(5) : RFPercentage(3),
    paddingBottom: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  curvedBottom: {
    // borderBottomLeftRadius: 30,
    // borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    zIndex: 2,
    paddingTop: RFPercentage(3),
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  centerSection: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: RFPercentage(1.5),
    flex: 1,
  },
  menuButton: {
    padding: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  backButton: {
    padding: RFPercentage(0.8),
    borderRadius: RFPercentage(100),
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  title: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
    color: "white",
    letterSpacing: 0.3,
  },
  leftTitle: {
    marginLeft: RFPercentage(1.5),
    fontSize: RFPercentage(2.2),
  },
  subtitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: RFPercentage(0.5),
  },
  iconButton: {
    padding: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
    backgroundColor: "rgba(255,255,255,0.15)",
    position: "relative",
  },
  postButton: {
    padding: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  badge: {
    position: "absolute",
    top: RFPercentage(0.2),
    right: RFPercentage(0.2),
    backgroundColor: "#FF4757",
    minWidth: RFPercentage(1.6),
    height: RFPercentage(1.6),
    borderRadius: RFPercentage(0.8),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "white",
  },
  badgeText: {
    color: "white",
    fontSize: RFPercentage(0.9),
    fontFamily: "Poppins_700Bold",
    paddingHorizontal: RFPercentage(0.2),
  },
  profileContainer: {
    position: "relative",
  },
  profileWrapper: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    borderWidth: 2,
    borderColor: "white",
    overflow: "hidden",
  },
  profile: {
    width: "100%",
    height: "100%",
  },
  crownBadge: {
    position: "absolute",
    bottom: -RFPercentage(0.5),
    right: -RFPercentage(0.5),
    backgroundColor: "#8B6914",
    borderRadius: RFPercentage(1),
    padding: RFPercentage(0.2),
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  wave: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.1)",
    transform: [{ skewX: "-20deg" }],
  },
  // Search Bar Styles
  searchContainer: {
    position: "absolute",
    top: RFPercentage(3),
    left: 0,
    right: 0,
    paddingHorizontal: RFPercentage(2),
    zIndex: 3,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RFPercentage(2),
    paddingHorizontal: RFPercentage(1),
    height: RFPercentage(5.5),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  searchBackButton: {
    padding: RFPercentage(0.5),
    marginRight: RFPercentage(0.5),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    marginRight: RFPercentage(1),
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    paddingVertical: RFPercentage(1),
  },
  clearButton: {
    padding: RFPercentage(0.5),
  },
});

export default Nav;
