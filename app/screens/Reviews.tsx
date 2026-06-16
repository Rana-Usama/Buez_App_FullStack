import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  SectionList,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useFocusEffect } from "@react-navigation/native";
import moment from "moment";
import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";
import Nav from "../components/common/Nav";
import NotFound from "../components/common/NotFound";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { fetchMyReviewsFromFirebase } from "../services/Review.service";
import { useAppTheme } from "../contexts/themeContext";
import { useTranslation } from "react-i18next";
import { cachedTranslate } from "../utils/cachedTranslations";
import CustomNav from "../components/common/CustomNav";
import AvatarInitials from "../components/common/DefaultAvatars";
import { getAvatarColors } from "../config/avatarColors";
import { LinearGradient } from "expo-linear-gradient";
import { getCachedData, setCachedData } from "../utils/screenDataCache";

const sameDay = (d1, d2) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

const getTargetLanguage = async () => {
  const stored = await SecureStore.getItemAsync("appLanguage");
  return stored || Localization.locale.split("-")[0] || "en";
};

const getSectionTitle = (date, lang) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Sentiment-based accent so card colour reflects the rating instead of a
// random rotation — cleaner and more professional.
const getRatingColor = (rating: number) => {
  if (rating >= 4) return Colors.green;
  if (rating === 3) return Colors.secondary;
  return Colors.primary;
};

const REVIEWS_CACHE_KEY = "reviewsSections";

export default function Reviews({ navigation }) {
  const { t } = useTranslation();
  // Seed from cache → instant render on re-entry; refresh silently after.
  const [sections, setSections] = useState(
    () => getCachedData<any[]>(REVIEWS_CACHE_KEY) ?? [],
  );
  const [lang, setLang] = useState("en");
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(
    () => getCachedData<any[]>(REVIEWS_CACHE_KEY) === undefined,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [averageRating, setAverageRating] = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState([0, 0, 0, 0, 0]);

  const [labels, setLabels] = useState({
    today: "Today",
    yesterday: "Yesterday",
    dated: "Dated",
    by: "By",
    reviews: "Reviews",
    noReviews: "No reviews yet",
    translating: "Translating...",
  });

  const { theme } = useAppTheme();
  const isDark = theme.mode === "dark";

  useEffect(() => {
    (async () => {
      const userLang = await getTargetLanguage();
      setLang(userLang);
      const keys = Object.keys(labels);
      const translated = await Promise.all(
        keys.map((k) => cachedTranslate(labels[k])),
      );
      const newLabels = keys.reduce((obj, key, i) => {
        obj[key] = translated[i] || labels[key];
        return obj;
      }, {});
      setLabels(newLabels);
    })();
  }, []);

  const fetchMyReviews = async () => {
    // Loader only on first-ever load (seeded from cache); refreshes are silent.
    try {
      const data = await fetchMyReviewsFromFirebase();
      const translationMap = { ...translations };
      const grouped = new Map();
      for (const review of data) {
        const createdAt =
          review.createdAt?.toDate?.() ?? review.createdAt ?? new Date();
        const title = getSectionTitle(new Date(createdAt), lang);
        if (!translationMap[review.id]) {
          translationMap[review.id] = await cachedTranslate(
            review.reviewText || "",
          );
        }
        const arr = grouped.get(title) || [];
        arr.push({ ...review, createdAt });
        grouped.set(title, arr);
      }
      const finalSections = Array.from(grouped.entries())
        .map(([title, data]) => ({
          title,
          data: data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          ),
        }))
        .sort((a, b) => {
          const p = (t) =>
            t === labels.today ? 0 : t === labels.yesterday ? 1 : 2;
          return (
            p(a.title) - p(b.title) ||
            new Date(b.data[0].createdAt).getTime() -
              new Date(a.data[0].createdAt).getTime()
          );
        });

      const ratings = data.map((r) => r.rating).filter(Boolean);
      // rating distribution [5,4,3,2,1]
      const dist = [5, 4, 3, 2, 1].map(
        (star) => ratings.filter((r) => Math.round(r) === star).length,
      );
      setRatingDistribution(dist);
      setTotalReviews(ratings.length);
      if (ratings.length > 0) {
        setAverageRating(
          (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1),
        );
      } else {
        setAverageRating(null);
      }
      setTranslations(translationMap);
      setSections(finalSections);
      setCachedData(REVIEWS_CACHE_KEY, finalSections);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyReviews();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyReviews();
    }, [lang]),
  );

  const StarRow = ({ rating, size = RFPercentage(1.8) }) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text
          key={i}
          style={{
            fontSize: size,
            color: i <= rating ? Colors.star : isDark ? "#e0e0feff" : "#E2E8F0",
          }}
        >
          ★
        </Text>
      ))}
    </View>
  );

  const RatingBars = () => {
    const max = Math.max(...ratingDistribution, 1);
    return (
      <View style={styles.barsContainer}>
        {[5, 4, 3, 2, 1].map((star, i) => {
          let barColor;
          if (star === 5) {
            barColor = Colors.green;
          } else if (star === 4 || star === 3) {
            barColor = Colors.secondary;
          } else {
            barColor = Colors.primary;
          }

          return (
            <View key={star} style={styles.barRow}>
              <Text
                style={[
                  styles.barLabel,
                  { color: isDark ? Colors.darkGrey : Colors.detailsText },
                ]}
              >
                {star}
              </Text>
              <View
                style={[
                  styles.barTrack,
                  { backgroundColor: isDark ? "#1f202cff" : "#F1F3F5" },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(ratingDistribution[i] / max) * 100}%`,
                      opacity: 1 - i * 0.15,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.barCount,
                  { color: isDark ? Colors.darkGrey : Colors.detailsText },
                ]}
              >
                {ratingDistribution[i]}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    const created = moment(item.createdAt).format("MMM D, YYYY");
    const translatedReview = translations[item.id] || labels.translating;
    const firstLetter = item?.reviewer?.userName?.trim()?.[0] ?? "?";
    const [, groupTextColor] = getAvatarColors(firstLetter, isDark);
    const accentColor = getRatingColor(Math.round(item.rating || 0));

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.white,
            borderColor: isDark ? theme.border : Colors.cardBorderLight,
          },
        ]}
      >
        <View style={styles.cardBody}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              {item?.reviewer?.profileImage ? (
                <Image
                  style={[styles.avatar, { borderColor: accentColor + "50" }]}
                  source={{ uri: item.reviewer.profileImage }}
                />
              ) : (
                <AvatarInitials
                  name={item.reviewer?.userName}
                  style={[styles.avatar, { borderColor: groupTextColor }]}
                  textStyle={{
                    fontSize: RFPercentage(1.8),
                    lineHeight: RFPercentage(5),
                  }}
                />
              )}
              <View style={styles.userDetails}>
                <Text
                  style={[
                    styles.userName,
                    { color: isDark ? Colors.white : Colors.darkGrey2 },
                  ]}
                >
                  {item.reviewer?.userName?.length > 14
                    ? item.reviewer.userName.substring(0, 14) + "…"
                    : item.reviewer?.userName}
                </Text>
                <Text style={[styles.date, { color: Colors.lightGrey }]}>
                  {created}
                </Text>
              </View>
            </View>

            {/* Rating badge */}
            <View
              style={[styles.ratingBadge, { backgroundColor: accentColor }]}
            >
              <Text style={styles.ratingNumber}>{item.rating || 0}</Text>
              <Text style={styles.ratingStar}>★</Text>
            </View>
          </View>

          {/* Quote */}
          <View
            style={[styles.quoteBlock, { borderLeftColor: accentColor + "80" }]}
          >
            <Text
              style={[
                styles.reviewText,
                { color: isDark ? Colors.darkGrey : Colors.detailsText },
              ]}
              numberOfLines={3}
            >
              "{translatedReview}"
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <StarRow rating={Math.round(item.rating || 0)} />
           
          </View>
        </View>
      </View>
    );
  };

  // ── Section header ────────────────────────────────────────────────────────
  const renderHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeaderContainer}>
      
      <Text
        style={[
          styles.sectionHeaderText,
          {
            color: isDark ? Colors.darkGrey : Colors.primary,
            backgroundColor: isDark
              ? Colors.white + "20"
              : Colors.primary + "12",
          },
        ]}
      >
        {title}
      </Text>
     
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <CustomNav title={`${t("profile.txt3")}`} showBack />

      {/* ── Rating overview ── */}
      {averageRating && (
        <View
          style={[
            styles.overviewCard,
            {
              backgroundColor: theme.white,
              borderColor: isDark ? theme.border : Colors.cardBorderLight,
            },
          ]}
        >
          <View style={styles.overviewRow}>
            {/* Score column */}
            <View style={styles.scoreCol}>
              <LinearGradient
                colors={[Colors.primary, Colors.primary2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scoreBox}
              >
                <Text style={styles.scoreNum}>{averageRating}</Text>
                <Text style={styles.scoreDenom}>/ 5</Text>
              </LinearGradient>

              <View style={styles.scoreStars}>
                <StarRow
                  rating={Math.round(parseFloat(averageRating))}
                  size={RFPercentage(1.9)}
                />
              </View>
              <Text
                style={[
                  styles.overviewSub,
                  { color: isDark ? Colors.darkGrey : Colors.detailsText },
                ]}
              >
                {t("reviews.txt6")} {totalReviews}{" "}
                {totalReviews === 1 ? t("reviews.txt7") : t("reviews.txt8")}
              </Text>
            </View>

            {/* Vertical divider */}
            <View
              style={[
                styles.vDivider,
                { backgroundColor: isDark ? "#2a2d45" : Colors.detailsBorder },
              ]}
            />

            {/* Distribution column */}
            <View style={styles.barsCol}>
              <Text
                style={[
                  styles.overviewTitle,
                  { color: isDark ? Colors.white : Colors.primary },
                ]}
              >
                {t("reviews.txt5")}
              </Text>
              <RatingBars />
            </View>
          </View>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={isDark ? Colors.darkGrey : Colors.primary}
          style={styles.loader}
        />
      ) : sections.length === 0 ? (
        <NotFound title={labels.noReviews} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary, Colors.secondary]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Overview card
  overviewCard: {
    margin: RFPercentage(2),
    borderRadius: RFPercentage(2.4),
    borderWidth: 1,
    padding: RFPercentage(2.2),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  overviewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreCol: {
    alignItems: "center",
    width: RFPercentage(17),
  },
  scoreBox: {
    borderRadius: RFPercentage(1.8),
    paddingHorizontal: RFPercentage(2.2),
    paddingVertical: RFPercentage(1.4),
    alignItems: "center",
    justifyContent: "center",
    minWidth: RFPercentage(11),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreNum: {
    fontSize: RFPercentage(4),
    fontFamily: "Poppins_700Bold",
    color: "#fff",
    lineHeight: RFPercentage(4.8),
  },
  scoreDenom: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    color: "rgba(255,255,255,0.75)",
    marginTop: -RFPercentage(0.4),
  },
  scoreStars: {
    marginTop: RFPercentage(1),
  },
  overviewRight: { flex: 1 },
  overviewTitle: {
    fontSize: RFPercentage(1.75),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
  },
  overviewSub: {
    fontSize: RFPercentage(1.35),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: RFPercentage(0.6),
  },
  vDivider: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: RFPercentage(2),
  },
  barsCol: {
    flex: 1,
  },
  starsRow: { flexDirection: "row", gap: 0 },
  divider: { height: 0.5, marginVertical: RFPercentage(1.5) },

  // Rating bars
  barsContainer: { gap: RFPercentage(0.7) },
  barRow: { flexDirection: "row", alignItems: "center", gap: RFPercentage(1) },
  barLabel: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    width: RFPercentage(1.5),
    textAlign: "right",
  },
  barTrack: {
    flex: 1,
    height: RFPercentage(0.6),
    borderRadius: 100,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 100,
    backgroundColor: Colors.primary,
  },
  barCount: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    width: RFPercentage(2),
    textAlign: "right",
  },

  // Section header
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },
  sectionHeaderLine: { flex: 1, height: 0.5 },
  sectionHeaderText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    marginHorizontal: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(1.8),
    paddingVertical: RFPercentage(0.4),
    borderRadius: 100,
  },

  // Card
  card: {
    marginHorizontal: RFPercentage(2),
    marginBottom: RFPercentage(1.6),
    borderRadius: RFPercentage(2.2),
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    // elevation: 3,
  },
  cardAccentBar: { height: 3, width: "100%" },
  cardBody: { padding: RFPercentage(2) },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFPercentage(1.4),
  },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: RFPercentage(5.4),
    height: RFPercentage(5.4),
    borderRadius: RFPercentage(100),
    borderWidth: 2,
    marginRight: RFPercentage(1.3),
  },
  userDetails: { flex: 1 },
  userName: {
    fontSize: RFPercentage(1.75),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.2),
  },
  date: { fontSize: RFPercentage(1.35), fontFamily: "Poppins_400Regular" },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.3),
    paddingHorizontal: RFPercentage(1.3),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
  },
  ratingNumber: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_700Bold",
    color: "#fff",
    lineHeight: RFPercentage(2.4),
  },
  ratingStar: { fontSize: RFPercentage(1.4), color: "#FFD700" },

  // Quote block
  quoteBlock: {
    borderLeftWidth: RFPercentage(0.4),
    borderRadius: RFPercentage(0.4),
    paddingLeft: RFPercentage(1.4),
    paddingVertical: RFPercentage(0.2),
    marginBottom: RFPercentage(1.5),
  },
  reviewText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.5),
    fontStyle: "italic",
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.4),
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.45),
    borderRadius: 100,
  },
  verifiedText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_500Medium",
    lineHeight: RFPercentage(1.6),
  },

  listContent: { paddingBottom: RFPercentage(12) },
  loader: { marginTop: RFPercentage(28) },
});
