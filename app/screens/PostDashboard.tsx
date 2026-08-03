import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import Nav from "../components/common/Nav";
import MyAppButton from "../components/common/MyAppButton";
import TaskDonutChart from "../components/common/TaskDonutChart";
import { useAppTheme } from "../contexts/themeContext";
import { getMyRequestCounts } from "../services/Post.service";

type Counts = {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
};

export default function PostDashboard({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const isDark = theme.mode === "dark";

  const [counts, setCounts] = useState<Counts>({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCounts = async () => {
    try {
      const result = await getMyRequestCounts();
      setCounts(result);
    } catch (e) {
      console.log("PostDashboard counts error:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCounts();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCounts();
    setRefreshing(false);
  };

  const goCreate = () => navigation.navigate("PostRequest");
  const goMyRequests = () => navigation.navigate(`${t("bottomTab.txt1")}`);
  const goCompleted = () => navigation.navigate("CompletedTasks");

  const cardBg = isDark ? theme.white : Colors.pureWhite;
  const cardBorder = isDark ? theme.border : Colors.white2;

  // ── Chart colours (theme-aware) ──
  const ACTIVE_COLOR = "#b390d1ff";
  const COMPLETED_COLOR = "#83c1baff";
  const CANCELLED_COLOR = "#e36056ff";
  const trackColor = isDark ? Colors.whiteAlpha08 : Colors.white2;


  // Tasks that are neither active/completed/cancelled (e.g. expired-but-active)
  // so the ring always sums to the total.
  const otherCount = Math.max(
    0,
    counts.total - counts.active - counts.completed - counts.cancelled,
  );

  const chartSegments = [
    { value: counts.active, color: ACTIVE_COLOR },
    { value: counts.completed, color: COMPLETED_COLOR },
    { value: counts.cancelled, color: CANCELLED_COLOR },
    ...(otherCount > 0
      ? [
          {
            value: otherCount,
            color: isDark ? Colors.whiteAlpha18 : "#D8DCEC",
          },
        ]
      : []),
  ];

  const completionRate =
    counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

  // ── Legend row ──
  const LegendRow = ({
    color,
    label,
    value,
    onPress,
  }: {
    color: string;
    label: string;
    value: number;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      onPress={onPress}
      style={styles.legendRow}
    >
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text
        style={[styles.legendLabel, { color: theme.darkGrey }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text style={[styles.legendValue, { color: theme.heading }]}>
        {value}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <Nav
        gradient
        gradientColors={[Colors.primary, Colors.blueDark3]}
        title={`${t("postDashboard.header")}`}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={isDark ? Colors.darkGrey : Colors.primary}
          style={styles.activityIndicator}
        />
      ) : counts?.total === 0 ? (
        // ── State 1: New user (empty state) ──
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          <View
            style={[
              styles.emptyIllustrationWrap,
              { backgroundColor: isDark ? theme.lightWhite : Colors.white12 },
            ]}
          >
            <Image
              source={Icons.empty}
              style={styles.emptyIllustration}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.heading }]}>
            {t("postDashboard.emptyTitle")}
          </Text>
          <Text style={[styles.emptyText, { color: theme.darkGrey }]}>
            {t("postDashboard.emptyText")}
          </Text>
          <MyAppButton
            title={t("postDashboard.emptyCta")}
            onPress={goCreate}
            width="90%"
            marginTop={RFPercentage(3)}
          />
        </ScrollView>
      ) : (
        // ── State 2: Existing user (dashboard) ──
        <>
          <ScrollView
            contentContainerStyle={styles.dashContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          >
            <Text style={[styles.sectionTitle, { color: theme.heading }]}>
              {t("postDashboard.overview")}
            </Text>

            {/* Consolidated task breakdown chart */}
            <View
              style={[
                styles.chartCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.chartRow}>
                <TaskDonutChart
                  segments={chartSegments}
                  total={counts.total}
                  size={RFPercentage(20)}
                  centerValue={counts.total}
                  centerLabel={t("postDashboard.allTasks")}
                  valueColor={theme.heading}
                  labelColor={theme.darkGrey}
                  trackColor={trackColor}
                />

                <View style={styles.legend}>
                  <LegendRow
                    color={ACTIVE_COLOR}
                    label={t("postDashboard.active")}
                    value={counts.active}
                    onPress={goMyRequests}
                  />
                  <LegendRow
                    color={COMPLETED_COLOR}
                    label={t("postDashboard.completed")}
                    value={counts.completed}
                    onPress={goCompleted}
                  />
                  {counts.cancelled > 0 && (
                    <LegendRow
                      color={CANCELLED_COLOR}
                      label={t("postDashboard.cancelled")}
                      value={counts.cancelled}
                      onPress={goMyRequests}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Completion rate insight */}
            <View
              style={[
                styles.insightCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.insightHeader}>
                <View style={styles.insightTitleWrap}>
                  <View
                    style={[
                      styles.insightIcon,
                      {
                        backgroundColor:
                          COMPLETED_COLOR + (isDark ? "26" : "1A"),
                      },
                    ]}
                  >
                    <Ionicons
                      name="trending-up"
                      size={RFPercentage(2.2)}
                      color={COMPLETED_COLOR}
                    />
                  </View>
                  <Text style={[styles.insightTitle, { color: theme.heading }]}>
                    {t("postDashboard.completionRate")}
                  </Text>
                </View>
                <Text style={[styles.insightPct, { color: COMPLETED_COLOR }]}>
                  {completionRate}%
                </Text>
              </View>

              <View
                style={[styles.progressTrack, { backgroundColor: trackColor }]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${completionRate}%`,
                      backgroundColor: COMPLETED_COLOR,
                    },
                  ]}
                />
              </View>

              <Text style={[styles.insightSub, { color: theme.darkGrey }]}>
                {t("postDashboard.completionSummary", {
                  completed: counts.completed,
                  total: counts.total,
                })}
              </Text>
            </View>
          </ScrollView>

          {/* Floating "Post New Task" CTA */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={goCreate}
            style={[styles.fab, styles.touchableOpacity]}
          >
            <Ionicons name="add" size={RFPercentage(2.6)} color={Colors.white} />
            <Text style={styles.fabText} numberOfLines={1}>
              {t("postDashboard.newCta")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Empty state
  emptyContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: RFPercentage(4),
    paddingVertical: RFPercentage(6),
    paddingBottom: RFPercentage(15),
  },
  emptyIllustrationWrap: {
    width: RFPercentage(24),
    height: RFPercentage(24),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: RFPercentage(3),
  },
  emptyIllustration: {
    width: RFPercentage(15),
    height: RFPercentage(15),
  },
  emptyTitle: {
    fontSize: RFPercentage(2.4),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: RFPercentage(1.2),
  },
  emptyText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: RFPercentage(2.4),
    paddingHorizontal: RFPercentage(1),
  },

  // Dashboard
  dashContent: {
    padding: RFPercentage(2),
  },
  sectionTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(1.6),
    marginTop: RFPercentage(1),
  },
  statRow: {
    flexDirection: "row",
    gap: RFPercentage(1.6),
    marginTop: RFPercentage(1.6),
  },
  statCard: {
    borderRadius: RFPercentage(2.2),
    borderWidth: 1,
    padding: RFPercentage(2),
    shadowColor: Colors.blackSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    // elevation: 3,
  },
  statCardBig: {
    width: "100%",
  },
  statCardHalf: {
    flex: 1,
  },
  statIcon: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(1.5),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: RFPercentage(1.2),
  },
  statValue: {
    fontSize: RFPercentage(3.2),
    fontFamily: "Poppins_700Bold",
  },
  statLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    marginTop: RFPercentage(0.3),
  },

  // Consolidated chart card
  chartCard: {
    borderRadius: RFPercentage(2.2),
    borderWidth: 1,
    padding: RFPercentage(2.2),
    marginTop: RFPercentage(0.5),
    shadowColor: Colors.blackSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legend: {
    flex: 1,
    marginLeft: RFPercentage(2),
    gap: RFPercentage(1.2),
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: RFPercentage(1.4),
    height: RFPercentage(1.4),
    borderRadius: RFPercentage(0.7),
    marginRight: RFPercentage(1),
  },
  legendLabel: {
    flex: 1,
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
  },
  legendValue: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_700Bold",
    marginLeft: RFPercentage(0.8),
  },

  // Completion-rate insight
  insightCard: {
    borderRadius: RFPercentage(2.2),
    borderWidth: 1,
    padding: RFPercentage(2.2),
    marginTop: RFPercentage(1.6),
    shadowColor: Colors.blackSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: RFPercentage(1.4),
  },
  insightTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  insightIcon: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(1.2),
    alignItems: "center",
    justifyContent: "center",
    marginRight: RFPercentage(1.2),
  },
  insightTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  insightPct: {
    fontSize: RFPercentage(2.4),
    fontFamily: "Poppins_700Bold",
  },
  progressTrack: {
    height: RFPercentage(1.1),
    borderRadius: 100,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 100,
  },
  insightSub: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(1),
  },

  // Quick action cards
  actionCard: {
    flex: 1,
    borderRadius: RFPercentage(2.2),
    borderWidth: 1,
    padding: RFPercentage(2),
    alignItems: "flex-start",
    shadowColor: Colors.blackSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  actionIcon: {
    width: RFPercentage(4.6),
    height: RFPercentage(4.6),
    borderRadius: RFPercentage(1.4),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: RFPercentage(1.2),
  },
  actionLabel: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
  },

  // Floating CTA
  fab: {
    position: "absolute",
    bottom: RFPercentage(6),
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.8),
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(1.8),
    borderRadius: RFPercentage(2),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    width: "90%",
    justifyContent: "center",
    // elevation: 8,
  },
  fabText: {
    color: Colors.white,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  activityIndicator: { marginTop: RFPercentage(28) },
  touchableOpacity: { backgroundColor: Colors.primary },
});
