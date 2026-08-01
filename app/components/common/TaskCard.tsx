import React, { useState, memo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import { FontAwesome5 } from "@expo/vector-icons";
import { Task } from "../../types/home.types";
import { getFormatedDate } from "../../services/Shared.service";
import { Icons } from "../../config/theme";
import Colors from "../../config/Colors";
import AvatarInitials from "./DefaultAvatars";
import FounderBadgeById from "./FounderBadgeById";

const { width } = Dimensions.get("window");

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TaskCardProps {
  task: Task;
  index: number;
  onPress: (task: Task) => void;
  activeIndex: number;
  onImageScroll: (index: number, slideIndex: number) => void;
  getConvertedCompensation: (task: Task) => string | null;
  theme: any;
  t: (key: string) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  onPress,
  activeIndex,
  onImageScroll,
  getConvertedCompensation,
  theme,
  t,
}) => {
  const [localActiveIndex, setLocalActiveIndex] = useState(0);
  const [showAllSubTasks, setShowAllSubTasks] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Animation values - separate for native and JS drivers
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const contentHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate chevron rotation (useNativeDriver: true)
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true, // Can use native driver for transforms
    }).start();

    // Animate content height (useNativeDriver: false)
    Animated.timing(contentHeight, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // Must use false for layout properties
    }).start();

    // Use LayoutAnimation for smooth container expansion
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [expanded]);

  const handleScroll = useCallback(
    (e: any) => {
      const slideIndex = Math.round(
        e.nativeEvent.contentOffset.x / (width * 0.9),
      );
      setLocalActiveIndex(slideIndex);
      onImageScroll(index, slideIndex);
    },
    [index, onImageScroll],
  );

  const toggleExpand = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  const compensation = getConvertedCompensation(task);

  // Format scheduled date and time
  const formatScheduledDateTime = () => {
    if (task.scheduledDateTime) {
      const date = new Date(task.scheduledDateTime);
      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (task.selectedDate && task.selectedTime) {
      const date = new Date(task.selectedDate);
      const time = new Date(task.selectedTime);
      date.setHours(time.getHours(), time.getMinutes());
      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return getFormatedDate(task.createdAt);
  };

  // Format duration
  const getDurationLabel = () => {
    if (task.durationLabel) {
      return task.durationLabel;
    }
    if (task.estimatedDuration) {
      const durationOptions = [
        { value: "less_than_1", label: "< 1 hour" },
        { value: "1_2_hours", label: "1-2 hours" },
        { value: "2_4_hours", label: "2-4 hours" },
        { value: "4_6_hours", label: "4-6 hours" },
        { value: "6_8_hours", label: "6-8 hours" },
        { value: "full_day", label: "Full day" },
        { value: "multiple_days", label: "Multiple days" },
      ];
      const duration = durationOptions.find(
        (d) => d.value === task.estimatedDuration,
      );
      return duration?.label || "Duration not specified";
    }
    return "Duration not specified";
  };

  // Check if it's a bulk request
  const isBulkRequest =
    (task.numberOfWorkers && task.numberOfWorkers > 1) || false;
  const numberOfWorkers = task.numberOfWorkers || 1;
  const confirmedWorkers = task.confirmedWorkers || [];
  const confirmedCount = confirmedWorkers.length;
  const appliedWorkers = task.appliedWorkers || [];
  const appliedCount = appliedWorkers.length;
  const remainingSlots = Math.max(0, numberOfWorkers - confirmedCount);

  // Get slot status
  const getSlotStatus = () => {
    if (remainingSlots <= 0) {
      return {
        text: t("offerDetail.full") || "Full",
        color: Colors.red,
        bgColor: Colors.red + "10",
      };
    }
    return {
      text: `${remainingSlots} ${t("offerDetail.slotsAvailable") || "slots"}`,
      color: Colors.primary,
      bgColor: Colors.primary + "10",
    };
  };

  const slotStatus = getSlotStatus();

  // Get sub-tasks to display
  const selectedSubTasks = task.selectedSubTasks || [];
  const displaySubTasks = showAllSubTasks
    ? selectedSubTasks
    : selectedSubTasks.slice(0, 3);
  const hasMoreSubTasks = selectedSubTasks.length > 3;

  // Chevron rotation interpolation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <TouchableOpacity
      onPress={() => onPress(task)}
      activeOpacity={0.8}
      style={[
        styles.cartContainer,
        { borderColor: theme.border, backgroundColor: theme.white },
      ]}
    >
      {/* Image Carousel */}
      <View>
        <FlatList
          data={task.imageUrls}
          keyExtractor={(_, imgIndex) => imgIndex.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}
          onScroll={handleScroll}
          renderItem={({ item: imageUrl }) => (
            <Image
              resizeMode="cover"
              source={{ uri: imageUrl }}
              style={styles.img}
            />
          )}
        />

        {/* Dots Indicator */}
        {task.imageUrls.length > 1 && (
          <View style={styles.dotsContainer}>
            {task.imageUrls.map((_, dotIndex) => (
              <View
                key={dotIndex}
                style={[
                  styles.dot,
                  dotIndex ===
                  (activeIndex !== undefined ? activeIndex : localActiveIndex)
                    ? styles.activeDot
                    : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Task Type Badge */}
      <View style={[styles.bulkBadge, { backgroundColor: Colors.primary }]}>
        <Text
          style={[styles.bulkBadgeText, { color: Colors.white }]}
          numberOfLines={1}
        >
          {task.taskType}
        </Text>
      </View>

      <View style={styles.infoWrapper}>
        {/* User Info - Always Visible */}
        <View style={styles.cartInfoContainer}>
          <View style={styles.avatarWrapper}>
            {task.user?.profileImage ? (
              <Image
                style={styles.userImage}
                source={{ uri: task.user.profileImage }}
              />
            ) : (
              <AvatarInitials
                name={task.user?.userName}
                style={[styles.userImage, { borderWidth: 0 }]}
                textStyle={{
                  fontSize: RFPercentage(2.5),
                  lineHeight: RFPercentage(3.5),
                }}
              />
            )}

            {/* Founder Badge for the task poster. task.user is a snapshot
                taken at post time, so its isFounder (if any) can be stale —
                resolve by the authoritative task.userId instead. */}
            <FounderBadgeById
              userId={task.userId || task.user?.userId}
              size={RFPercentage(2.4)}
              style={styles.founderBadge}
            />
          </View>

          <View style={styles.userInfoContainer}>
            <Text
              style={[styles.userName, { color: theme.heading }]}
              numberOfLines={1}
            >
              {task.user?.userName?.length > 12
                ? `${task.user.userName.substring(0, 12)}...`
                : task.user?.userName}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.locationText,
                {
                  color: theme.darkGrey,
                  fontFamily: "Poppins_400Regular",
                  marginTop: 4,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={RFPercentage(1.2)}
                color={theme.darkGrey}
              />{" "}
              {task?.address?.name}
            </Text>
          </View>

          {/* Expand/Collapse Button */}
          <TouchableOpacity
            onPress={toggleExpand}
            style={[
              styles.expandButton,
              {
                backgroundColor:
                  theme.mode === "light"
                    ? "rgba(215, 215, 215, 0.48)"
                    : "rgba(53, 51, 64, 0.82)",
              },
            ]}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons
                name="chevron-down"
                size={RFPercentage(2)}
                color={theme.mode === "dark" ? Colors.darkGrey : Colors.primary}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Always Visible Content - Scheduled Date and Time */}
        <View style={styles.scheduledContainer}>
          <View style={styles.scheduledItem}>
            <Ionicons
              name="calendar-outline"
              size={RFPercentage(1.6)}
              color={theme.mode === "dark" ? Colors.white : Colors.primary}
            />
            <Text
              style={[styles.scheduledText, { color: theme.darkGrey }]}
              numberOfLines={1}
            >
              {formatScheduledDateTime()}
            </Text>
          </View>

          <View style={styles.scheduledItem}>
            <Ionicons
              name="time-outline"
              size={RFPercentage(1.6)}
              color={theme.mode === "dark" ? Colors.white : Colors.primary}
            />
            <Text
              style={[styles.scheduledText, { color: theme.darkGrey }]}
              numberOfLines={1}
            >
              {getDurationLabel()}
            </Text>
          </View>
        </View>

        {/* Always Visible Content - Brief Description (1 line) */}
        <View style={styles.briefDescriptionContainer}>
          <Text style={[styles.briefDescription, { color: theme.darkGrey2 }]}>
            {task.description}
          </Text>
        </View>

        {!expanded && (
          <View
            style={[
              styles.compensationWrapper,
              { width: "90%", alignSelf: "center" },
            ]}
          >
            <Image
              tintColor={theme.darkGrey}
              style={styles.compensationIcon}
              source={require("../../../assets/Images/compensation.png")}
            />
            <Text
              style={[styles.compensationText, { color: theme.darkGrey2 }]}
              numberOfLines={1}
            >
              {`${t("home.txt10")}`}:{" "}
              <Text
                style={[
                  styles.compensationAmount,
                  {
                    color:
                      theme.mode === "dark" ? Colors.darkGrey : Colors.primary,
                  },
                ]}
              >
                {task.compensationType === "Monitarely"
                  ? compensation ||
                    `$${parseFloat(task.monitarily || "0").toLocaleString()}`
                  : task.otherCompensation?.substr(0, 20) +
                    (task.otherCompensation?.length > 20 ? "..." : "")}
              </Text>
            </Text>
          </View>
        )}

        {/* Expandable Content - Conditionally rendered with animation */}
        {expanded && (
          <Animated.View
            style={[
              styles.expandableContent,
              {
                opacity: contentHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            {/* Sub-Tasks Section */}
            {selectedSubTasks.length > 0 && (
              <View style={styles.subTasksContainer}>
                <View style={styles.subTasksHeader}>
                  <Ionicons
                    name="list"
                    size={RFPercentage(1.6)}
                    color={
                      theme.mode === "dark" ? Colors.white : Colors.primary
                    }
                  />
                  <Text
                    style={[styles.subTasksTitle, { color: theme.darkGrey }]}
                  >
                    {"Sub-tasks"}:
                  </Text>
                </View>
                <View style={styles.subTasksList}>
                  {displaySubTasks.map((subTask, idx) => (
                    <View
                      key={subTask.id || idx}
                      style={[
                        styles.subTaskTag,
                        { backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.1)" :  `${theme.primary}15` },
                      ]}
                    >
                      <FontAwesome5
                        name={"tag"}
                        size={RFPercentage(1.2)}
                        color={
                          theme.mode === "dark"
                            ? Colors.darkGrey
                            : Colors.primary
                        }
                      />
                      <Text
                        style={[
                          styles.subTaskText,
                          {
                            color:
                              theme.mode === "dark"
                                ? Colors.darkGrey
                                : Colors.primary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {subTask.name}
                      </Text>
                    </View>
                  ))}
                  {hasMoreSubTasks && !showAllSubTasks && (
                    <TouchableOpacity
                      onPress={() => setShowAllSubTasks(true)}
                      style={[
                        styles.subTaskTag,
                        { backgroundColor: theme.darkGrey + "10" },
                      ]}
                    >
                      <Text
                        style={[styles.subTaskText, { color: theme.darkGrey }]}
                      >
                        +{selectedSubTasks.length - 3} more
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Bulk Request Stats */}
            {isBulkRequest && (
              <>
                <View
                  style={{
                    width: "100%",
                    height: RFPercentage(0.1),
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.lightGrey + "30"
                        : Colors.primary + "20",
                    alignSelf: "center",
                    marginVertical: 15,
                  }}
                />
                <View style={styles.bulkStatsContainer}>
                  {/* Total Workers Needed */}
                  <View style={styles.bulkStat}>
                    <View
                      style={[
                        styles.statIconContainer,
                        {
                          backgroundColor:
                            theme.mode === "dark"
                              ? Colors.primary + "35"
                              : Colors.primary + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name="people-outline"
                        size={RFPercentage(1.7)}
                        color={
                          theme.mode === "dark"
                            ? Colors.darkGrey
                            : Colors.primary
                        }
                      />
                    </View>
                    <View>
                      <Text
                        numberOfLines={1}
                        style={[styles.statLabel, { color: theme.darkGrey }]}
                      >
                        {t("offerDetail.helpersNeeded")}
                      </Text>
                      <Text
                        style={[styles.statValue, { color: theme.heading }]}
                      >
                        {numberOfWorkers}
                      </Text>
                    </View>
                  </View>

                  {/* Confirmed Workers */}
                  <View style={styles.bulkStat}>
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: "#4CAF50" + "15" },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={RFPercentage(1.7)}
                        color="#4CAF50"
                      />
                    </View>
                    <View>
                      <Text
                        numberOfLines={1}
                        style={[styles.statLabel, { color: theme.darkGrey }]}
                      >
                        {t("offerDetail.confirmed")}
                      </Text>
                      <Text style={[styles.statValue, { color: "#4CAF50" }]}>
                        {confirmedCount}
                      </Text>
                    </View>
                  </View>

                  {/* Slots Available */}
                  <View style={styles.bulkStat}>
                    <View
                      style={[
                        styles.statIconContainer,
                        {
                          backgroundColor:
                            remainingSlots <= 0
                              ? Colors.red + "10"
                              : theme.mode === "dark"
                                ? Colors.primary + "35"
                                : Colors.primary + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={remainingSlots <= 0 ? "close-circle" : "time"}
                        size={RFPercentage(1.7)}
                        color={slotStatus.color}
                      />
                    </View>
                    <View>
                      <Text
                        numberOfLines={1}
                        style={[styles.statLabel, { color: theme.darkGrey }]}
                      >
                        {t("offerDetail.avl")}
                      </Text>
                      <Text
                        style={[styles.statValue, { color: slotStatus.color }]}
                      >
                        {remainingSlots}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            <View style={[styles.compensationWrapper]}>
              <Image
                tintColor={theme.darkGrey}
                style={styles.compensationIcon}
                source={require("../../../assets/Images/compensation.png")}
              />
              <Text
                style={[styles.compensationText, { color: theme.darkGrey2 }]}
                numberOfLines={1}
              >
                {`${t("home.txt10")}`}:{" "}
                <Text
                  style={[
                    styles.compensationAmount,
                    {
                      color:
                        theme.mode === "dark"
                          ? Colors.darkGrey
                          : Colors.primary,
                    },
                  ]}
                >
                  {task.compensationType === "Monitarely"
                    ? compensation ||
                      `$${parseFloat(task.monitarily || "0").toLocaleString()}`
                    : task.otherCompensation?.substr(0, 20) +
                      (task.otherCompensation?.length > 20 ? "..." : "")}
                </Text>
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cartContainer: {
    width: width * 0.9,
    borderColor: "#E5E7EB",
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(1),
    paddingBottom: RFPercentage(2),
    marginTop: 20,
    position: "relative",
    overflow: "hidden",
  },
  img: {
    width: width * 0.895,
    height: RFPercentage(25),
    borderTopLeftRadius: RFPercentage(1),
    borderTopRightRadius: RFPercentage(1),
  },
  dotsContainer: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    marginHorizontal: RFPercentage(0.3),
  },
  activeDot: {
    backgroundColor: "#3B82F6",
  },
  inactiveDot: {
    backgroundColor: "#D1D5DB",
  },
  infoWrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cartInfoContainer: {
    width: "92%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    marginVertical: RFPercentage(2),
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: RFPercentage(2),
  },
  avatarWrapper: {
    position: "relative",
  },
  founderBadge: {
    position: "absolute",
    right: -RFPercentage(0.5),
    bottom: -RFPercentage(0.3),
  },
  userImage: {
    width: RFPercentage(6.2),
    height: RFPercentage(6.2),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(100),
  },
  userName: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
  },
  locationText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
  },

  expandButton: {
    padding: RFPercentage(0.3),
    backgroundColor: "rgba(215, 215, 215, 0.48)",
    borderRadius: RFPercentage(100),
    bottom: 5,
  },

  scheduledContainer: {
    width: "92%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFPercentage(1),
    paddingHorizontal: RFPercentage(0.5),
  },
  scheduledItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  scheduledText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    marginLeft: RFPercentage(0.5),
    flex: 1,
  },
  briefDescriptionContainer: {
    width: "92%",
    paddingHorizontal: RFPercentage(0.5),
    marginBottom: RFPercentage(1),
  },
  briefDescription: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    top: RFPercentage(0.8),
  },
  expandableContent: {
    width: "92%",
  },
  fullDescriptionContainer: {
    width: "100%",
    paddingHorizontal: RFPercentage(0.5),
    marginBottom: RFPercentage(1.5),
  },
  fullDescription: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },
  subTasksContainer: {
    width: "100%",
    // marginBottom: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(0.5),
    marginTop: RFPercentage(1),
  },
  subTasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  subTasksTitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.5),
  },
  subTasksList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  subTaskTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1.5),
    marginRight: RFPercentage(1),
    marginBottom: RFPercentage(0.8),
  },
  subTaskText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.5),
  },
  bulkStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(0.5),
  },
  bulkStat: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    borderRadius: RFPercentage(1.6),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(0.5),
  },
  statLabel: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  statValue: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginTop: 3,
  },
  compensationWrapper: {
    marginTop: RFPercentage(1),
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  compensationIcon: {
    width: RFPercentage(2),
    height: RFPercentage(2),
  },
  compensationText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
    flex: 1,
    marginLeft: RFPercentage(1),
  },
  compensationAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: RFPercentage(1.6),
  },
  bulkBadge: {
    position: "absolute",
    top: RFPercentage(1.5),
    right: RFPercentage(1.5),
    alignItems: "center",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.7),
    borderRadius: RFPercentage(100),
    zIndex: 10,
    justifyContent: "center",
  },
  bulkBadgeText: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_600SemiBold",
    lineHeight: RFPercentage(1.5),
  },
});

const areEqual = (prevProps: TaskCardProps, nextProps: TaskCardProps) => {
  // Also check bulk request properties
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.activeIndex === nextProps.activeIndex &&
    prevProps.theme.mode === nextProps.theme.mode &&
    prevProps.task.numberOfWorkers === nextProps.task.numberOfWorkers &&
    prevProps.task.confirmedWorkers?.length ===
      nextProps.task.confirmedWorkers?.length &&
    prevProps.task.appliedWorkers?.length ===
      nextProps.task.appliedWorkers?.length
  );
};

export default memo(TaskCard, areEqual);
