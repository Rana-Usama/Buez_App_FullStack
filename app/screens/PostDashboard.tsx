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
  const cardBorder = isDark ? theme.border : "#ECEFF9";

  // ── Summary card ──
  const StatCard = ({
    icon,
    label,
    value,
    accent,
    onPress,
    big,
  }: {
    icon: any;
    label: string;
    value: number;
    accent: string;
    onPress: () => void;
    big?: boolean;
  }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.statCard,
        big ? styles.statCardBig : styles.statCardHalf,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: theme.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : accent + "1A" }]}>
        <Ionicons name={icon} size={RFPercentage(2.6)} color={accent} />
      </View>
      <Text style={[styles.statValue, { color: theme.heading }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.darkGrey }]}>{label}</Text>
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
        gradientColors={[Colors.primary, "#0b1544ff"]}
        title={`${t("postDashboard.header")}`}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={isDark ? Colors.darkGrey : Colors.primary}
          style={{ marginTop: RFPercentage(28) }}
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
              { backgroundColor: isDark ? theme.lightWhite : "#EEF1FB" },
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

            <StatCard
              icon="albums"
              label={t("postDashboard.total")}
              value={counts.total}
              accent={theme.mode === "dark" ? Colors.white : Colors.primary}
              onPress={goMyRequests}
              big
            />

            <View style={styles.statRow}>
              <StatCard
                icon="time"
                label={t("postDashboard.active")}
                value={counts.active}
                accent="#3B82F6"
                onPress={goMyRequests}
              />
              <StatCard
                icon="checkmark-done-circle"
                label={t("postDashboard.completed")}
                value={counts.completed}
                accent={Colors.statusAlertSuccess}
                onPress={goCompleted}
              />
            </View>

            <View style={{ height: RFPercentage(10) }} />
          </ScrollView>

          {/* Floating "Post New Task" CTA */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={goCreate}
            style={[styles.fab, { backgroundColor: Colors.primary }]}
          >
            <Ionicons name="add" size={RFPercentage(2.6)} color="#FFF" />
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
    paddingBottom:RFPercentage(15)
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
    shadowColor: "#000",
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
    width:"90%",
    justifyContent:"center"
    // elevation: 8,
  },
  fabText: {
    color: "#FFF",
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
});
