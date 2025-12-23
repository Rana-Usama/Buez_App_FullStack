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

type Labels = {
  today: string;
  yesterday: string;
  dated: string;
  by: string;
  reviews: string;
  noReviews: string;
  translating: string;
};

type TranslationsMap = Record<string, string>;
type Review = {
  id: string;
  reviewText: string;
  rating: number;
  createdAt: Date;
  [key: string]: any;
};

type Section = {
  title: string;
  data: Review[];
};

export default function Reviews({ navigation }) {
  const { t } = useTranslation();
  const [sections, setSections] = useState<Section[]>([]);
  const [lang, setLang] = useState<string>("en");
  const [translations, setTranslations] = useState<TranslationsMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [averageRating, setAverageRating] = useState<string | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  const [labels, setLabels] = useState<Labels>({
    today: "Today",
    yesterday: "Yesterday",
    dated: "Dated",
    by: "By",
    reviews: "Reviews",
    noReviews: "No reviews yet",
    translating: "Translating...",
  });

  const { theme } = useAppTheme();
  useEffect(() => {
    (async () => {
      const userLang = await getTargetLanguage();
      setLang(userLang);
      const keys = Object.keys(labels);
      const translated = await Promise.all(
        keys.map((k) => cachedTranslate(labels[k]))
      );
      const newLabels = keys.reduce((obj, key, index) => {
        obj[key as keyof Labels] = translated[index] || labels[key];
        return obj;
      }, {} as Labels);
      setLabels(newLabels);
    })();
  }, []);

  const fetchMyReviews = async () => {
    setLoading(true);
    try {
      const data = await fetchMyReviewsFromFirebase();
      const translationMap = { ...translations };
      const grouped = new Map();
      for (const review of data) {
        const createdAt =
          review.createdAt?.toDate?.() ?? review.createdAt ?? new Date();
        const title = getSectionTitle(new Date(createdAt), lang);
        if (!translationMap[review.id]) {
          const translatedText = await cachedTranslate(review.reviewText || "");
          translationMap[review.id] = translatedText;
        }
        const arr = grouped.get(title) || [];
        arr.push({ ...review, createdAt });
        grouped.set(title, arr);
      }
      const finalSections = Array.from(grouped.entries())
        .map(([title, data]) => ({
          title,
          data: data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          ),
        }))
        .sort((a, b) => {
          const getPriority = (t: string) =>
            t === labels.today ? 0 : t === labels.yesterday ? 1 : 2;
          const pA = getPriority(a.title);
          const pB = getPriority(b.title);
          return (
            pA - pB ||
            new Date(b.data[0].createdAt).getTime() -
              new Date(a.data[0].createdAt).getTime()
          );
        });

      const ratings = data.map((r) => r.rating).filter(Boolean);
      const totalReviews = ratings.length;
      if (ratings.length > 0) {
        const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        setAverageRating(avg.toFixed(1));
      } else {
        setAverageRating(null);
      }
      setTotalReviews(totalReviews);
      setTranslations(translationMap);
      setSections(finalSections);
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
    }, [lang])
  );

  const StarRating = ({ rating, size = "medium" }) => {
    const starSize = size === "large" ? RFPercentage(2.8) : RFPercentage(1.8);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text
          style={{
            color: i <= rating ? Colors.star : theme.lightGrey,
            fontSize: starSize,
            lineHeight: RFPercentage(2.9),
          }}
        >
          ★
        </Text>
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const renderItem = ({ item, index }) => {
    const created = moment(item.createdAt).format("MMM D, YYYY");
    const translatedReview =
      translations[item.id] || labels.translating || "Translating...";

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.white,
            borderColor:
              theme.mode === "dark" ? theme.border : "rgba(236, 238, 251, 1)",
          },
        ]}
        activeOpacity={1}
      >
        {/* Header with avatar and rating */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Image
              style={styles.avatar}
              source={
                item?.reviewer?.profileImage
                  ? { uri: item?.reviewer?.profileImage }
                  : Icons.dp
              }
            />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: Colors.darkGrey }]}>
                {item.reviewer?.userName?.length > 12
                  ? item.reviewer?.userName.substring(0, 12) + "..."
                  : item.reviewer?.userName}
              </Text>
              <Text style={[styles.date, { color: Colors.lightGrey }]}>
                {created}
              </Text>
            </View>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={[styles.ratingNumber, { color: Colors.white }]}>
              {item.rating || 0}
            </Text>
            <Text style={[styles.ratingStar, { color: Colors.white }]}>★</Text>
          </View>
        </View>

        {/* Review Text */}
        <Text
          style={[
            styles.reviewText,
            { color: theme.heading, fontStyle: "italic" },
          ]}
        >
          "{translatedReview}"
        </Text>

        {/* Detailed Star Rating */}
        <View style={styles.detailedRating}>
          <Text
            style={[
              styles.ratingStar,
              {
                color: Colors.star,
                fontSize: RFPercentage(2),
                lineHeight: RFPercentage(2),
              },
            ]}
          >
            {"★".repeat(Math.round(item.rating))}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeaderContainer}>
      <View style={styles.sectionHeaderLine} />
      <Text
        style={[
          styles.sectionHeaderText,
          {
            color: theme.primary,
            backgroundColor:
              theme.mode === "dark"
                ? Colors.primary + "40"
                : Colors.primary + "15",
          },
        ]}
      >
        {title}
      </Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <CustomNav title={`${t("profile.txt3")}`} showBack />

      {/* Rating Overview */}
      {averageRating && (
        <View
          style={[
            styles.ratingOverview,
            {
              backgroundColor: theme.white,
              borderWidth: RFPercentage(0.1),
              borderColor:
                theme.mode === "dark" ? theme.border : "rgba(236, 238, 251, 1)",
            },
          ]}
        >
          <View style={styles.ratingMain}>
            <View
              style={[
                styles.ratingCircle,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? "rgba(241, 244, 254, 0.08)"
                      : "rgba(250, 250, 255, 1)",
                },
              ]}
            >
              <Text style={[styles.averageRating, { color: Colors.primary }]}>
                {averageRating}
              </Text>
              <Text style={[styles.ratingOutOf, { color: theme.lightGrey }]}>
                /5
              </Text>
            </View>
            <View style={styles.ratingInfo}>
              <Text style={[styles.ratingTitle, { color: Colors.primary }]}>
                {t("reviews.txt5")}
              </Text>
              <Text style={[styles.reviewCount, { color: theme.darkGrey }]}>
                {t("reviews.txt6")} {totalReviews}{" "}
                {totalReviews === 1
                  ? `${t("reviews.txt7")}`
                  : `${t("reviews.txt8")}`}
              </Text>
              <StarRating
                rating={Math.round(parseFloat(averageRating))}
                size="large"
              />
            </View>
          </View>
        </View>
      )}

      {/* Reviews List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : sections.length === 0 ? (
        <NotFound title={labels.noReviews} />
      ) : (
        <View style={styles.listContainer}>
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.lightWhite,
  },
  header: {
    width: "100%",
    alignSelf: "center",
  },
  ratingOverview: {
    margin: RFPercentage(2),
    padding: RFPercentage(2),
    borderRadius: RFPercentage(2),
    elevation: 8,
    shadowColor: Colors.primary + "40",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  ratingMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingCircle: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: Colors.lightPrimary,
    padding: RFPercentage(2),
    borderRadius: RFPercentage(3),
    marginRight: RFPercentage(2),
  },
  averageRating: {
    fontSize: RFPercentage(4),
    fontFamily: "Poppins_700Bold",
  },
  ratingOutOf: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
  },
  ratingInfo: {
    flex: 1,
  },
  ratingTitle: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  reviewCount: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginBottom: RFPercentage(1),
    opacity: 0.8,
  },
  loader: {
    marginTop: RFPercentage(28),
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: RFPercentage(20),
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionHeaderText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    marginHorizontal: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(0.4),
    borderRadius: RFPercentage(1),
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    marginBottom: RFPercentage(2),
    padding: RFPercentage(2),
    borderRadius: RFPercentage(2),
    elevation: 4,
    shadowColor: Colors.primary + "30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minHeight: RFPercentage(18),
    borderWidth: 1,
    width: "90%",
    alignSelf: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: RFPercentage(1.5),
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
    borderColor: Colors.primary,
    borderWidth: 2,
    marginRight: RFPercentage(1),
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.3),
  },
  date: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
  },
  ratingNumber: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    marginRight: RFPercentage(0.3),
  },
  ratingStar: {
    fontSize: RFPercentage(1.5),
    lineHeight: RFPercentage(1.5),
  },
  reviewText: {
    fontSize: RFPercentage(1.7),
    lineHeight: RFPercentage(2.2),
    marginBottom: RFPercentage(1.5),
    fontStyle: "italic",
  },
  detailedRating: {
    alignItems: "flex-start",
  },
  starsRow: {
    flexDirection: "row",
  },
  starContainer: {
    width: RFPercentage(2.8),
    height: RFPercentage(2.8),
    borderRadius: RFPercentage(0.7),
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: RFPercentage(0.2),
    borderWidth: 1,
  },
});
