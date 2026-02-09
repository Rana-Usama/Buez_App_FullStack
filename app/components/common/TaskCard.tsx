import React, { useState, memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Task } from "../../types/home.types";
import { getFormatedDate } from "../../services/Shared.service";
import { Icons } from "../../config/theme";
import Colors from "../../config/Colors";

const { width } = Dimensions.get("window");

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

  const handleScroll = useCallback(
    (e: any) => {
      const slideIndex = Math.round(
        e.nativeEvent.contentOffset.x / (width * 0.9)
      );
      setLocalActiveIndex(slideIndex);
      onImageScroll(index, slideIndex);
    },
    [index, onImageScroll]
  );

  const compensation = getConvertedCompensation(task);


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
      <>
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
      </>

      {/* Bulk Request Badge */}

      <View
        style={[styles.bulkBadge, { backgroundColor: Colors.primary + "20" }]}
      >
        <Text style={[styles.bulkBadgeText, { color: Colors.primary }]}>
          {task.taskType}
        </Text>
      </View>

      <View style={styles.infoWrapper}>
        {/* User Info */}
        <View style={styles.cartInfoContainer}>
          <Image
            style={styles.userImage}
            source={
              task.user?.profileImage
                ? { uri: task.user.profileImage }
                : Icons.dp
            }
            defaultSource={Icons.dp}
          />
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
                styles.postDate,
                {
                  color: theme.darkGrey,
                  fontFamily: "Poppins_400Regular",
                  marginTop: 4,
                },
              ]}
            >
              {task?.address?.name}
            </Text>
          </View>
        </View>

        <View style={styles.taskInfoContainer}>
          <Text style={[styles.postDate, { color: theme.darkGrey }]}>
            {t("myRequests.txt4")}{" "}
            <Text style={{ fontFamily: "Poppins_400Regular" }}>
              {getFormatedDate(task.createdAt)}
            </Text>
          </Text>
        </View>

        {/* Task Info */}
        <View style={styles.taskInfoContainer}>
          <Text
            style={[
              styles.taskText,
              { color: theme.darkGrey2, marginTop: RFPercentage(1) },
            ]}
            numberOfLines={3}
          >
            {task.description?.substr(0, 90) +
              (task.description?.length > 90 ? "..." : "")}
          </Text>

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
                  marginVertical: 20,
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
                      size={RFPercentage(1.4)}
                      color={Colors.primary}
                    />
                  </View>
                  <View>
                    <Text
                      numberOfLines={1}
                      style={[styles.statLabel, { color: theme.darkGrey }]}
                    >
                      {t("offerDetail.helpersNeeded")}
                    </Text>
                    <Text style={[styles.statValue, { color: theme.heading }]}>
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
                      size={RFPercentage(1.4)}
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
                          theme.mode === "dark"
                            ? Colors.primary + "35"
                            : Colors.primary + "20",
                      },
                    ]}
                  >
                    <Ionicons
                      name={remainingSlots <= 0 ? "close-circle" : "time"}
                      size={RFPercentage(1.4)}
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

          {/* Compensation */}
          <View style={styles.compensationWrapper}>
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
                style={[styles.compensationAmount, { color: theme.primary }]}
              >
                {task.compensationType === "Monitarely"
                  ? compensation ||
                    `$${parseFloat(task.monitarily || "0").toLocaleString()}`
                  : task.otherCompensation?.substr(0, 20) +
                    (task.otherCompensation?.length > 20 ? "..." : "")}
              </Text>
            </Text>
          </View>
        </View>
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
  userImage: {
    width: RFPercentage(6.2),
    height: RFPercentage(6.2),
    borderColor: "#3B82F6",
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(100),
  },
  userName: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
  },
  postDate: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
  },
  taskInfoContainer: {
    width: "90%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  taskText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.2),
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    zIndex: 10,
  },
  bulkBadgeText: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_600SemiBold",
    lineHeight: RFPercentage(1.3),
  },
  bulkStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    // marginTop: RFPercentage(1.5),
    marginBottom: RFPercentage(1),
    paddingHorizontal: RFPercentage(1),
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
    fontSize: RFPercentage(1),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  statValue: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginTop: 5,
  },
  slotStatusBadge: {
    position: "absolute",
    bottom: RFPercentage(2),
    right: RFPercentage(2),
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.4),
    borderRadius: RFPercentage(1),
  },
  slotStatusText: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_600SemiBold",
  },
});

// Memoize with custom comparison
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
