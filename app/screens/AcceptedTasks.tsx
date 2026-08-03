import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from "react-native";
import Toast from "react-native-toast-message";
import ConfirmationModal from "../components/common/ConfirmationModal";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import Colors from "../config/Colors";
import CustomNav from "../components/common/CustomNav";
import NotFound from "../components/common/NotFound";
import AvatarInitials from "../components/common/DefaultAvatars";
import FounderBadgeById from "../components/common/FounderBadgeById";
import { useAppTheme } from "../contexts/themeContext";
import { useUser } from "../contexts/user.context";
import { useLocation } from "../utils/useLocation";
import { cachedTranslate } from "../utils/cachedTranslations";
import {
  fetchActiveTasksFromFirebase,
  fetchAllConfirmedTasksAsWorker,
} from "../services/Review.service";
import {
  cancelConfirmedTask,
  sendTaskCancellationNotification,
} from "../services/Post.service";
import { groupChatExists } from "../services/GroupChat.service";
import { createNewChat } from "../services/Chat.service";
import { getRelativeConfirmedTime } from "../services/Shared.service";
import {
  formatCurrency,
  convertCurrency,
  getCurrencyInfo,
} from "../utils/currencyChange";
import { ShareButton } from "../job-sharing/ShareButton";
import { Icons } from "../config/theme";
import { getCachedData, setCachedData } from "../utils/screenDataCache";

const { width: screenWidth } = Dimensions.get("window");

const DURATION_LABELS: Record<string, string> = {
  less_than_1: "< 1 hour",
  "1_2_hours": "1-2 hours",
  "2_4_hours": "2-4 hours",
  "4_6_hours": "4-6 hours",
  "6_8_hours": "6-8 hours",
  full_day: "Full day",
  multiple_days: "Multiple days",
};

export default function AcceptedTasks({ navigation }:any) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const currentUser = useUser();
  const currentUserId = getAuth().currentUser?.uid;
  const { location: currentLocation } = useLocation();

  const CACHE_KEY = `acceptedTasks_${currentUserId || "anon"}`;

  // Seed from the in-memory cache so re-entering the screen shows the last
  // data immediately (no loader / empty flash) while we refresh in background.
  const [records, setRecords] = useState<any[]>(
    () => getCachedData<any[]>(CACHE_KEY) ?? [],
  );
  const [loading, setLoading] = useState(
    () => getCachedData<any[]>(CACHE_KEY) === undefined,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [groupChatMap, setGroupChatMap] = useState<Record<string, boolean>>({});
  const [activeIndices, setActiveIndices] = useState<Record<number, number>>(
    {},
  );
  // Tracks which card is mid-cancellation so we can show a per-card spinner.
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  // The task pending cancellation confirmation (drives the confirm modal).
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);

  // ── Fetch accepted + confirmed-as-worker tasks ──
  const fetchAccepted = async () => {
    // No setLoading(true) here: the full-screen loader is shown only on the
    // very first load (seeded from cache state). Re-fetches happen silently.
    try {
      const acceptedTasks = await fetchActiveTasksFromFirebase();
      const confirmedWorkerTasks =
        await fetchAllConfirmedTasksAsWorker(currentUserId);

      const singleAcceptedMapped = (acceptedTasks || []).map((item: any) => ({
        ...item.taskDetails,
        acceptedBy: item?.acceptedBy,
        status: item?.status,
        completedTaskId: item.id,
        isWorkerConfirmed: false,
        isBulkRequest: false,
        workerStatus: "accepted",
      }));

      const bulkConfirmedMapped = (confirmedWorkerTasks || []).map(
        (item: any) => ({
          ...item,
          user: item.user || item.requester || { userName: "Unknown User" },
          isWorkerConfirmed: true,
          workerStatus: "confirmed",
          isBulkRequest: true,
          acceptedBy: null,
          confirmedAt: item.userConfirmation?.confirmedAt || item.createdAt,
          userId: item.userId || item.requester?.userId,
        }),
      );

      // Defensive guard: never surface a task that has already been completed
      // or cancelled here. The service queries should exclude these, but this
      // keeps the Accepted list consistent against any stale/cached entry.
      const activeOnly = [...singleAcceptedMapped, ...bulkConfirmedMapped].filter(
        (item: any) =>
          item?.status !== "Completed" && item?.status !== "Cancelled",
      );

      const translated = await Promise.all(
        activeOnly.map(async (item: any) => ({
          ...item,
          description: await cachedTranslate(item?.description || ""),
          taskType: await cachedTranslate(item?.taskType || ""),
          customTaskTitle: await cachedTranslate(item?.customTaskTitle || ""),
          otherCompensation: await cachedTranslate(
            item?.otherCompensation || "",
          ),
        })),
      );

      setRecords(translated);
      setCachedData(CACHE_KEY, translated);

      // Resolve group-chat existence for bulk confirmed tasks
      const map: Record<string, boolean> = {};
      await Promise.all(
        translated.map(async (task: any) => {
          if (task.isBulkRequest && task.id) {
            map[task.id] = await groupChatExists(task.id);
          }
        }),
      );
      setGroupChatMap(map);
    } catch (error) {
      console.log("Error loading accepted tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Keep showing cached data; refresh silently in the background.
      fetchAccepted();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAccepted();
    setRefreshing(false);
  };

  // ── Helpers ──
  const getConvertedCompensation = (item: any) => {
    if (item.compensationType !== "Monitarely") return null;
    try {
      const originalAmount = parseFloat(item.monitarily) || 0;
      if (!item.currencyInfo) {
        return formatCurrency(originalAmount, currentLocation);
      }
      const targetCurrency = getCurrencyInfo(currentLocation).code;
      const convertedAmount = convertCurrency(
        originalAmount,
        item.currencyInfo.code,
        targetCurrency,
      );
      return formatCurrency(convertedAmount, currentLocation);
    } catch {
      return formatCurrency(parseFloat(item.monitarily) || 0, currentLocation);
    }
  };

  const getDurationLabel = (task: any) => {
    if (task?.durationLabel) return task.durationLabel;
    if (task?.estimatedDuration)
      return DURATION_LABELS[task.estimatedDuration] || null;
    return null;
  };

  const formatScheduledDateTime = (task: any) => {
    if (!task?.scheduledDateTime) return null;
    const date = new Date(task.scheduledDateTime);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleImageScroll = (event: any, cardIndex: number) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    setActiveIndices((prev) => ({
      ...prev,
      [cardIndex]: Math.floor(offsetX / viewSize),
    }));
  };

  const handleStartChat = async (receiverUser: any, event?: any) => {
    if (event) event.stopPropagation();
    try {
      const chatId = await createNewChat(currentUserId, receiverUser?.userId);
      navigation.navigate("Chat", {
        chatId,
        senderId: currentUserId,
        senderName: currentUser?.userData?.userName,
        receiver: receiverUser,
      });
    } catch (err) {
      console.log("Chat start error:", err);
    }
  };

  const handleOpenGroupChat = (task: any, event?: any) => {
    if (event) event.stopPropagation();
    navigation.navigate("GroupChat", {
      groupChatId: task.id,
      currentUserId,
      currentUserName: currentUser?.userData?.userName,
      taskType: task.taskType,
      customTaskTitle: task.customTaskTitle,
    });
  };

  const navigateToOfferDetail = (task: any) => {
    navigation.navigate("OfferDetail", {
      postRequest: task,
      // Lets OfferDetail send its Back button here instead of Home — only
      // ever set on this navigation call, so every other route into
      // OfferDetail keeps its existing back behavior.
      fromAcceptedTasks: true,
    });
  };

  // ── Cancel / withdraw from a confirmed task ──
  const confirmCancel = async (cart: any) => {
    if (!currentUserId) return;
    setCancellingId(cart.id);
    try {
      const owner = {
        userId: cart.userId || cart.user?.userId,
        userName: cart.user?.userName,
        email: cart.user?.email,
        token: cart.user?.token,
        profileImage: cart.user?.profileImage,
      };

      await cancelConfirmedTask({ task: cart, userId: currentUserId });
      await sendTaskCancellationNotification({
        task: cart,
        owner,
        canceller: {
          userId: currentUserId,
          userName: currentUser?.userData?.userName,
          email: getAuth().currentUser?.email || "",
          token: currentUser?.userData?.token,
          profileImage: currentUser?.userData?.profileImage,
        },
      });

      // Optimistically drop the cancelled task from the list + cache so the UI
      // updates immediately.
      setRecords((prev) => {
        const next = prev.filter((r) => r !== cart);
        setCachedData(CACHE_KEY, next);
        return next;
      });

      Toast.show({
        type: "success",
        text1: t("acceptedTasks.cancelSuccess"),
      });
    } catch (err) {
      console.log("Cancel task error:", err);
      Toast.show({
        type: "error",
        text1: t("acceptedTasks.cancelError"),
      });
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  };

  // Open the confirmation modal for the chosen task.
  const handleCancelTask = (cart: any, event?: any) => {
    if (event) event.stopPropagation();
    setCancelTarget(cart);
  };

  // ── Card ──
  const renderCard = (cart: any, index: number) => {
    const isConfirmed = cart.workerStatus === "confirmed";
    const scheduledDateTime = formatScheduledDateTime(cart);
    const durationLabel = getDurationLabel(cart);
    const subTasks = cart.selectedSubTasks || [];
    const compensation =
      cart.compensationType === "Monitarely"
        ? getConvertedCompensation(cart)
        : cart.otherCompensation?.substr(0, 18) +
          (cart.otherCompensation?.length > 18 ? "..." : "");

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigateToOfferDetail(cart)}
        key={cart.id || index}
        style={[
          styles.card,
          {
            backgroundColor:
              theme.mode === "dark" ? theme.white : Colors.pureWhite,
            borderColor: theme.mode === "dark" ? theme.border : Colors.white2,
          },
        ]}
      >
        {/* Image carousel */}
        <FlatList
          data={cart.imageUrls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => handleImageScroll(e, index)}
          scrollEventThrottle={16}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <ImageBackground
              style={styles.cardImageBg}
              imageStyle={styles.cardImage}
              source={{ uri: item }}
              resizeMode="cover"
            >
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText} numberOfLines={1}>
                  {cart?.taskType === "Other"
                    ? cart.customTaskTitle
                    : cart?.taskType}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isConfirmed
                      ? Colors.statusAlertSuccess + "E6"
                      : Colors.primary + "E6",
                  },
                ]}
              >
                <Ionicons
                  name={isConfirmed ? "checkmark-circle" : "briefcase"}
                  size={RFPercentage(1.5)}
                  color={Colors.white}
                />
                <Text style={styles.statusText}>
                  {isConfirmed
                    ? t("offerDetail.confirmed") || "Confirmed"
                    : t("myRequests.txt10")}
                </Text>
              </View>
            </ImageBackground>
          )}
        />

        {cart.imageUrls?.length > 1 && (
          <View style={styles.dotsRow}>
            {cart.imageUrls.map((_: any, i: number) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      (activeIndices[index] ?? 0) === i
                        ? theme.primary
                        : theme.border,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Owner row */}
        <View style={styles.ownerRow}>
          <View style={styles.avatarWrapper}>
            {cart?.user?.profileImage ? (
              <Image
                style={styles.ownerAvatar}
                source={{ uri: cart.user.profileImage }}
              />
            ) : (
              <AvatarInitials
                name={cart?.user?.userName}
                textStyle={styles.avatarInitialsText}
                style={styles.ownerAvatar}
              />
            )}

            {/* Founder Badge for the task owner — resolved by id, since the
                embedded owner snapshot carries no isFounder. */}
            <FounderBadgeById
              userId={cart?.userId || cart?.user?.userId}
              size={RFPercentage(2.2)}
              style={styles.founderBadge}
            />
          </View>
          <View style={styles.view}>
            <Text
              style={[styles.ownerName, { color: theme.heading }]}
              numberOfLines={1}
            >
              {cart?.user?.userName || t("common.you")}
            </Text>
            {isConfirmed && cart?.confirmedAt && (
              <Text style={[styles.metaDate, { color: theme.darkGrey }]}>
                {t("offerDetail.confirmedOn")}{" "}
                {getRelativeConfirmedTime(cart.confirmedAt)}
              </Text>
            )}
          </View>
        </View>

        {/* Description */}
        {!!cart?.description && (
          <Text
            style={[styles.description, { color: theme.darkGrey }]}
            numberOfLines={2}
          >
            {cart.description}
          </Text>
        )}

        {/* Schedule / duration */}
        {(scheduledDateTime || durationLabel) && (
          <View style={styles.metaRow}>
            {scheduledDateTime && (
              <View style={styles.metaChip}>
                <Ionicons
                  name="calendar-outline"
                  size={RFPercentage(1.5)}
                  color={theme.mode === "dark" ? Colors.white : theme.primary}
                />
                <Text style={[styles.metaChipText, { color: theme.darkGrey }]}>
                  {scheduledDateTime}
                </Text>
              </View>
            )}
            {durationLabel && (
              <View style={styles.metaChip}>
                <Ionicons
                  name="time-outline"
                  size={RFPercentage(1.5)}
                  color={theme.mode === "dark" ? Colors.white : theme.primary}
                />
                <Text style={[styles.metaChipText, { color: theme.darkGrey }]}>
                  {durationLabel}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Sub-tasks */}
        {subTasks.length > 0 && (
          <View style={styles.subTasksRow}>
            {subTasks.slice(0, 4).map((st: any, i: number) => (
              <View
                key={st.id || i}
                style={[
                  styles.subTaskTag,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.whiteAlpha10
                        : `${Colors.primary}12`,
                  },
                ]}
              >
                <FontAwesome5
                  name={st.icon || "tag"}
                  size={RFPercentage(1.1)}
                  color={theme.mode === "dark" ? Colors.darkGrey : theme.primary}
                />
                <Text
                  style={[
                    styles.subTaskText,
                    {
                      color:
                        theme.mode === "dark" ? Colors.darkGrey : Colors.primary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {st.name}
                </Text>
              </View>
            ))}
            {subTasks.length > 4 && (
              <View
                style={[
                  styles.subTaskTag,
                  { backgroundColor: theme.darkGrey + "15" },
                ]}
              >
                <Text style={[styles.subTaskText, { color: theme.darkGrey }]}>
                  +{subTasks.length - 4}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Footer: compensation + actions */}
        <View style={styles.footerRow}>
          <Text
            style={[styles.compensation, { color: theme.heading }]}
            numberOfLines={1}
          >
            {`${t("home.txt10")}`}:{" "}
            <Text
              style={{
                color: theme.mode === "dark" ? Colors.darkGrey : Colors.primary,
                fontFamily: "Poppins_600SemiBold",
              }}
            >
              {compensation}
            </Text>
          </Text>

          <View style={styles.actions}>
            {cart.isBulkRequest && isConfirmed && groupChatMap[cart.id] ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.black2
                        : Colors.primary + "12",
                    borderColor:
                      theme.mode === "dark"
                        ? Colors.indigoAlpha20
                        : Colors.primary + "30",
                  },
                ]}
                onPress={(e) => handleOpenGroupChat(cart, e)}
              >
                <Ionicons
                  name="people"
                  size={RFPercentage(2.1)}
                  color={theme.mode === "dark" ? Colors.darkGrey : Colors.blueDark2}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.black2
                        : Colors.primary + "12",
                    borderColor:
                      theme.mode === "dark"
                        ? Colors.indigoAlpha20
                        : Colors.primary + "30",
                  },
                ]}
                onPress={(e) => handleStartChat(cart.user, e)}
              >
                <Image
                  source={Icons.messages}
                  resizeMode="contain"
                  style={styles.image}
                  tintColor={theme.mode === "dark" ? Colors.darkGrey : Colors.blueDark2}
                />
              </TouchableOpacity>
            )}

            <ShareButton
              jobId={cart.id}
              jobTitle={
                cart.taskType === "Other" ? cart.customTaskTitle : cart.taskType
              }
              jobDescription={cart.description}
              companyName="Buez"
              style={[
                styles.iconButton,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? Colors.black2
                      : Colors.primary + "12",
                  borderColor:
                    theme.mode === "dark"
                      ? Colors.indigoAlpha20
                      : Colors.primary + "30",
                },
              ]}
              showLabel={false}
              iconOnly
              color={theme.mode === "dark" ? Colors.darkGrey : Colors.blueDark2}
            />
          </View>
        </View>

        {/* Cancel / withdraw */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={cancellingId === cart.id}
          onPress={(e) => handleCancelTask(cart, e)}
          style={[
            styles.cancelButton,
            {
              borderColor: Colors.statusAlertError + "55",
              backgroundColor: Colors.statusAlertError + "12",
              opacity: cancellingId === cart.id ? 0.6 : 1,
            },
          ]}
        >
          {cancellingId === cart.id ? (
            <ActivityIndicator
              size="small"
              color={Colors.statusAlertError}
            />
          ) : (
            <>
              <Ionicons
                name="close-circle-outline"
                size={RFPercentage(2)}
                color={Colors.statusAlertError}
              />
              <Text
                style={[
                  styles.cancelButtonText,
                  styles.text,
                ]}
              >
                {t("acceptedTasks.cancelTask")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <CustomNav
        title={`${t("profile.txt5")}`}
        showBack
        // Back always lands on Home instead of just popping the stack —
        // AcceptedTasks can be reached from several places (drawer, OfferDetail
        // deep-link back, delete-account blocked modal CTA, etc.), so a plain
        // goBack() could land somewhere unexpected depending on how the user
        // got here.
        onBack={() => navigation.navigate("TabNavigator")}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.mode === "dark" ? Colors.darkGrey : Colors.primary}
          style={styles.activityIndicator}
        />
      ) : records.length === 0 ? (
        <NotFound title={`${t("home.txt11")}`} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {records.map((cart, index) => renderCard(cart, index))}
          <View style={styles.view2} />
        </ScrollView>
      )}

      <ConfirmationModal
        isVisible={!!cancelTarget}
        onClose={() => {
          // Block dismiss while the cancellation is in flight.
          if (cancellingId) return;
          setCancelTarget(null);
        }}
        onConfirm={() => cancelTarget && confirmCancel(cancelTarget)}
        title={t("acceptedTasks.cancelConfirmTitle")}
        message={t("acceptedTasks.cancelConfirmMessage")}
        theme={theme}
        t={t}
        loading={!!cancellingId}
        type="delete"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingTop: RFPercentage(1.5) },
  card: {
    marginHorizontal: RFPercentage(2),
    marginBottom: RFPercentage(1.8),
    borderRadius: RFPercentage(2.2),
    borderWidth: 1,
    padding: RFPercentage(1.6),
    shadowColor: Colors.blackSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    // elevation: 3,
  },
  cardImageBg: {
    width: screenWidth - RFPercentage(2 * 2) - RFPercentage(1.6 * 2),
    height: RFPercentage(20),
    justifyContent: "flex-start",
  },
  cardImage: { borderRadius: RFPercentage(1.6) },
  categoryBadge: {
    alignSelf: "flex-start",
    margin: RFPercentage(1),
    backgroundColor: Colors.blackAlpha55,
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(2),
    maxWidth: "70%",
  },
  categoryText: {
    color: Colors.white,
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
  },
  statusBadge: {
    position: "absolute",
    top: RFPercentage(1),
    right: RFPercentage(1),
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.4),
    paddingHorizontal: RFPercentage(1.1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(2),
  },
  statusText: {
    color: Colors.white,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_600SemiBold",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: RFPercentage(0.6),
    marginTop: RFPercentage(1),
  },
  dot: {
    width: RFPercentage(0.9),
    height: RFPercentage(0.9),
    borderRadius: RFPercentage(0.45),
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1.2),
    marginTop: RFPercentage(1.4),
  },
  avatarWrapper: {
    position: "relative",
  },
  founderBadge: {
    position: "absolute",
    right: -RFPercentage(0.5),
    bottom: -RFPercentage(0.3),
  },
  ownerAvatar: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
  },
  ownerName: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  metaDate: {
    fontSize: RFPercentage(1.25),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.2),
  },
  description: {
    fontSize: RFPercentage(1.45),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(1.2),
    lineHeight: RFPercentage(2.1),
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: RFPercentage(1),
    marginTop: RFPercentage(1.2),
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
  },
  metaChipText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
  },
  subTasksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: RFPercentage(0.8),
    marginTop: RFPercentage(1.2),
  },
  subTaskTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1.5),
  },
  subTaskText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_500Medium",
    maxWidth: RFPercentage(14),
  },
  divider: {
    height: 1,
    marginVertical: RFPercentage(1.4),
    opacity: 0.6,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compensation: {
    flex: 1,
    fontSize: RFPercentage(1.45),
    fontFamily: "Poppins_500Medium",
    marginRight: RFPercentage(1),
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1),
  },
  iconButton: {
    width: RFPercentage(4.6),
    height: RFPercentage(4.6),
    borderRadius: RFPercentage(1.4),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFPercentage(0.8),
    marginTop: RFPercentage(1.4),
    paddingVertical: RFPercentage(1.1),
    borderRadius: RFPercentage(1.4),
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  avatarInitialsText: {
                  fontSize: RFPercentage(1.8),
                  lineHeight: RFPercentage(4),
                },
  view: { flex: 1 },
  image: { width: RFPercentage(2.1), height: RFPercentage(2.1) },
  text: { color: Colors.statusAlertError },
  activityIndicator: { marginTop: RFPercentage(28) },
  view2: { height: RFPercentage(6) },
});
