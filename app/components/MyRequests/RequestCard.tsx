import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
  FlatList,
  Animated,
  LayoutAnimation,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons, Feather } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import Colors from "../../config/Colors";
import { REQUEST_STATUS } from "../../utils/gloabals";
import { ShareButton } from "../../job-sharing/ShareButton";
import { Icons } from "../../config/theme";

type Props = {
  task: any;
  index: number;
  t: any;
  theme: any;
  currentUserId: string | null;
  onEdit: (task: any, e?: any) => void;
  onMarkComplete: (index: number, task: any) => void;
  onCancel: (index: number, task: any) => void;
  onRepost: (index: number, task: any) => void;
  onStartChat: (user: any, e?: any) => void;
  onOpenGroupChat: (task: any, e?: any) => void;
  onNavigateToApplicants: (taskId: string, e?: any) => void;
  navigateToOfferDetail: (task: any) => void;
  getConvertedCompensation: (task: any) => string | null;
  isConfirmedWorker: boolean;
  isAppliedWorker: boolean;
};

function RequestCard({
  task,
  index,
  t,
  theme,
  currentUserId,
  onEdit,
  onMarkComplete,
  onCancel,
  onRepost,
  onStartChat,
  onOpenGroupChat,
  onNavigateToApplicants,
  navigateToOfferDetail,
  getConvertedCompensation,
  isConfirmedWorker,
  isAppliedWorker,
}: Props) {
  const [imageIndex, setImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isTaskOwner = task.userId === currentUserId;
  const isBulkRequest = task.isBulkRequest || task.numberOfWorkers > 1;
  const selectedSubTasks = task.selectedSubTasks || [];

  const toggleExpand = useCallback(
    (ev?: any) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      const next = !expanded;
      setExpanded(next);
      Animated.timing(rotateAnim, {
        toValue: next ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    },
    [expanded, rotateAnim],
  );

  const onImageScroll = useCallback((e) => {
    const idx = Math.floor(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
    setImageIndex(idx);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const briefDescription = useMemo(() => {
    const desc = task.description || "";
    return desc.length > 60 ? desc.substr(0, 60) + "..." : desc;
  }, [task.description]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigateToOfferDetail(task)}
      style={[{ width: "100%", borderColor: theme.border, borderWidth: 0.2, borderRadius: 10, overflow: "hidden", paddingBottom: RFPercentage(2), marginTop: RFPercentage(3.6) }]}
    >
      <FlatList
        data={task.imageUrls || []}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onImageScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <ImageBackground style={{ width: "100%", height: RFPercentage(24.5) }} imageStyle={{ borderTopLeftRadius: RFPercentage(2), borderTopRightRadius: RFPercentage(2) }} source={{ uri: item }}>
            <View style={{ position: "absolute", right: 0, top: 0, backgroundColor: Colors.primary, padding: RFPercentage(0.8) }}>
              <Text style={{ color: "#fff", fontSize: RFPercentage(1.5) }} numberOfLines={1}>
                {task?.taskType === "Other" ? task.customTaskTitle : task?.taskType}
              </Text>
            </View>
            {task.status === REQUEST_STATUS.Active && !isConfirmedWorker && !isAppliedWorker && isTaskOwner && (
              <View style={{ position: "absolute", left: RFPercentage(2), top: RFPercentage(2) }}>
                <TouchableOpacity onPress={(e) => onEdit(task, e)}>
                  <Image style={{ width: RFPercentage(3.7), height: RFPercentage(3.7) }} source={Icons.editRequest} />
                </TouchableOpacity>
              </View>
            )}
          </ImageBackground>
        )}
        keyExtractor={(it, i) => `${task.id || index}-${i}`}
      />

      {task.imageUrls?.length > 1 && (
        <View style={{ flexDirection: "row", alignSelf: "center", marginTop: RFPercentage(1) }}>
          {(task.imageUrls || []).map((_, imgIdx) => (
            <View key={imgIdx} style={{ height: RFPercentage(0.9), width: RFPercentage(0.9), borderRadius: RFPercentage(0.5), margin: RFPercentage(0.5), backgroundColor: imageIndex === imgIdx ? theme.primary : theme.border }} />
          ))}
        </View>
      )}

      <View style={{ width: "92%", flexDirection: "row", alignItems: "center", marginVertical: RFPercentage(2), marginTop: RFPercentage(1) }}>
        <TouchableOpacity activeOpacity={0.8}>
          <Image style={{ width: RFPercentage(4.9), height: RFPercentage(4.9), borderRadius: RFPercentage(100), borderWidth: RFPercentage(0.1), borderColor: Colors.primary }} source={task?.user?.profileImage ? { uri: task?.user?.profileImage } : Icons.dp} />
        </TouchableOpacity>
        <Text style={{ marginLeft: RFPercentage(1.4), fontSize: RFPercentage(1.8), flex: 1, color: theme.heading }} numberOfLines={1}>
          {task?.user?.userName?.substr(0, 10) + (task?.user?.userName?.length > 10 ? "..." : "")}
        </Text>

        <TouchableOpacity onPress={toggleExpand} style={{ padding: RFPercentage(0.2), backgroundColor: theme.mode === "light" ? "rgba(215,215,215,0.48)" : "rgba(52,51,51,0.48)", borderRadius: RFPercentage(100) }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={RFPercentage(2.2)} color={theme.primary} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={{ width: "92%", marginBottom: RFPercentage(0.3), paddingHorizontal: RFPercentage(0.5) }}>
        <Text style={{ fontSize: RFPercentage(1.4), color: theme.darkGrey }}>{briefDescription}</Text>
      </View>

      {expanded && (
        <View style={{ width: "92%", marginTop: RFPercentage(1) }}>
          {/* Scheduled / Duration simplified */}
          {task.scheduledDateTime && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: RFPercentage(0.5) }}>
              <Ionicons name="calendar-outline" size={RFPercentage(1.5)} color={theme.primary} />
              <Text style={{ marginLeft: RFPercentage(0.8), color: theme.darkGrey }}>{new Date(task.scheduledDateTime).toLocaleString()}</Text>
            </View>
          )}
          {task.durationLabel && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: RFPercentage(0.5) }}>
              <Ionicons name="time-outline" size={RFPercentage(1.5)} color={theme.primary} />
              <Text style={{ marginLeft: RFPercentage(0.8), color: theme.darkGrey }}>{task.durationLabel}</Text>
            </View>
          )}

          {/* Subtasks */}
          {selectedSubTasks.length > 0 && (
            <View style={{ marginBottom: RFPercentage(1.5) }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: RFPercentage(0.8) }}>
                <Ionicons name="list" size={RFPercentage(1.5)} color={theme.primary} />
                <Text style={{ marginLeft: RFPercentage(0.5), color: theme.darkGrey }}>Sub-tasks:</Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
                {selectedSubTasks.slice(0, 3).map((st, si) => (
                  <View key={st.id || si} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: RFPercentage(0.8), paddingVertical: RFPercentage(0.4), borderRadius: RFPercentage(1.2), marginRight: RFPercentage(0.8), marginBottom: RFPercentage(0.5), backgroundColor: Colors.primary + "15" }}>
                    <FontAwesome5 name={st.icon || "tag"} size={RFPercentage(1.1)} color={Colors.primary} />
                    <Text style={{ marginLeft: RFPercentage(0.4), color: Colors.primary }}>{st.name}</Text>
                  </View>
                ))}
                {selectedSubTasks.length > 3 && (
                  <View style={{ paddingHorizontal: RFPercentage(0.8), paddingVertical: RFPercentage(0.4), borderRadius: RFPercentage(1.2), marginRight: RFPercentage(0.8), marginBottom: RFPercentage(0.5), backgroundColor: theme.darkGrey + "10" }}>
                    <Text style={{ color: theme.darkGrey }}>+{selectedSubTasks.length - 3} more</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Bulk info */}
          {(isBulkRequest) && (
            <View style={{ marginVertical: RFPercentage(1), padding: RFPercentage(1), borderRadius: RFPercentage(1), backgroundColor: theme.mode === "dark" ? theme.white + "10" : Colors.primary + "08" }}>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                <Ionicons name="people" size={RFPercentage(1.5)} color={theme.darkGrey} />
                <Text style={{ marginLeft: RFPercentage(0.4), color: theme.darkGrey }}>Helpers needed: {task.numberOfWorkers || 1}</Text>
                <Ionicons name="checkmark-circle" size={RFPercentage(1.5)} color="#4CAF50" style={{ marginLeft: RFPercentage(1) }} />
                <Text style={{ marginLeft: RFPercentage(0.4), color: "#4CAF50" }}>Confirmed: {task.confirmedWorkers?.length || 0}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Footer actions (compensation, repost, chat/share) */}
      <View style={{ width: "92%", flexDirection: "row", alignItems: "center", marginTop: RFPercentage(0.5) }}>
        <Text style={{ fontSize: RFPercentage(1.6), marginTop: RFPercentage(0.7), color: theme.heading }}>
          {`${t("home.txt10")}`}:{" "}
          <Text style={{ color: theme.primary, fontSize: RFPercentage(1.5) }}>
            {task.compensationType === "Monitarely" ? getConvertedCompensation(task) : (task.otherCompensation?.substr(0, 15) + (task.otherCompensation?.length > 15 ? "..." : ""))}
          </Text>
        </Text>

        {/* Repost */}
        <View style={{ marginLeft: "auto" }}>
          <TouchableOpacity onPress={(e) => { e.stopPropagation(); onRepost(index, task); }} disabled={false} style={{ backgroundColor: Colors.primary, flexDirection: "row", alignItems: "center", borderRadius: RFPercentage(100), paddingHorizontal: RFPercentage(1.5), height: RFPercentage(2.8) }}>
            <Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: RFPercentage(1.4), marginRight: RFPercentage(0.5) }}>{t("myRequests.txt9")}</Text>
            <Feather name="repeat" size={RFPercentage(1.3)} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Accepted tab actions simplified: chat / group chat / share */}
      { (task.acceptedBy || isConfirmedWorker) && t && (
        <View style={{ width: "92%", marginTop: RFPercentage(1.5), flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: theme.heading, width: "45%" }}>{isConfirmedWorker ? t("offerDetail.youAreConfirmed") : `${t("myRequests.txt11")} ${task?.acceptedBy?.userName || t("common.you")}`}</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isBulkRequest && isConfirmedWorker ? (
              <>
                <TouchableOpacity onPress={(e) => onOpenGroupChat(task, e)} style={{ padding: RFPercentage(1.2) }}>
                  <Ionicons name="people" size={RFPercentage(2.3)} color={Colors.primary} />
                  <Text style={{ color: Colors.primary, fontSize: RFPercentage(1.5) }}>{t("details.txt9")}</Text>
                </TouchableOpacity>
                <ShareButton jobId={task.id} jobTitle={task.taskType === "Other" ? task.customTaskTitle : task.taskType} jobDescription={task.description} companyName="Buez" showLabel={false} iconOnly />
              </>
            ) : (
              <>
                <TouchableOpacity onPress={(e) => onStartChat(task.user, e)} style={{ padding: RFPercentage(1.2) }}>
                  <Image source={Icons.messages} resizeMode="contain" style={{ width: RFPercentage(2.3), height: RFPercentage(2.3) }} />
                  <Text style={{ color: Colors.primary, fontSize: RFPercentage(1.5) }}>{t("details.txt9")}</Text>
                </TouchableOpacity>
                <ShareButton jobId={task.id} jobTitle={task.taskType === "Other" ? task.customTaskTitle : task.taskType} jobDescription={task.description} companyName="Buez" showLabel={false} iconOnly />
              </>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default React.memo(RequestCard);