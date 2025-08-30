import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  RefreshControl,
  SectionList,
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
import { translateText } from "../translation/googleTranslation";
import { useAppTheme } from "../contexts/themeContext";
import { useTranslation } from "react-i18next";
import { cachedTranslate } from "../utils/cachedTranslations";

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
  [key: string]: any; // for other dynamic keys like reviewer info
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
          const translatedText = await cachedTranslate(
            review.reviewText || "",
            lang
          );
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
  const StarRating = ({ rating }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text
          key={i}
          style={{
            color: i <= rating ? "#FFD700" : "#E0E0E0",
            fontSize: RFPercentage(2),
          }}
        >
          ★
        </Text>
      );
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  const renderItem = ({ item }) => {
    const created = moment(item.createdAt).format("MMM-D-YYYY");
    const translatedReview =
      translations[item.id] || labels.translating || "Translating...";
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.white,
            borderColor: "rgba(211, 211, 211, 0.3)",
          },
        ]}
      >
        <View style={styles.textWrap}>
          <Text style={[styles.reviewText, { color: theme.heading }]}>
            {translatedReview}
          </Text>
          <StarRating rating={item.rating || 0} />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.reviewDate, { color: theme.darkGrey }]}>
            {labels.dated}: {created}
          </Text>
          <View style={styles.authorWrap}>
            <Text style={[styles.authorText, { color: theme.darkGrey }]}>
              {labels.by}:{" "}
              {item.reviewer?.userName.length > 10
                ? item.reviewer?.userName.substring(0, 10) + "..."
                : item.reviewer?.userName}
            </Text>
            <Image
              style={styles.avatar}
              source={
                item?.reviewer?.profileImage
                  ? { uri: item?.reviewer?.profileImage }
                  : Icons.dp
              }
            />
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = ({ section: { title } }) => (
    <View>
      <Text style={[styles.sectionHeader, { color: theme.heading }]}>
        {title}
      </Text>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <View style={{ width: "100%", alignSelf: "center" }}>
        <Nav
          dpNull
          marginTop={
            Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)
          }
          leftLogo={false}
          navigation={navigation}
          title={`${t("profile.txt3")}`}
        />
      </View>
      {averageRating && (
        <>
          <View style={styles.ratingBox}>
            <Text style={[styles.ratingLabel, { color: theme.heading }]}>
              {t("detail.txt14")} :
            </Text>
            <Text style={[styles.ratingValue, { color: theme.heading }]}>
              ⭐ {averageRating} ({totalReviews})
            </Text>
          </View>
        </>
      )}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: RFPercentage(8) }}
        />
      ) : sections.length === 0 ? (
        <NotFound title={labels.noReviews} />
      ) : (
        <View style={{ marginTop: RFPercentage(-2) }}>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderHeader}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            contentContainerStyle={{ paddingBottom: RFPercentage(6) }}
            stickySectionHeadersEnabled={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  ratingBox: {
    width: "97%",
    alignSelf: "center",
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(1),
    padding: RFPercentage(2),
    flexDirection: "row",

    alignItems: "center",
  },
  ratingLabel: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_500Medium",
    color: Colors.darkGrey2,
  },
  ratingValue: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.heading,
    marginLeft: RFPercentage(1.4),
  },
  separator: {
    width: "60%",
    height: RFPercentage(0.1),
    marginTop: RFPercentage(0.5),
    left: RFPercentage(2.3),
  },
  sectionHeader: {
    alignSelf: "flex-start",
    marginTop: RFPercentage(2),
    marginLeft: RFPercentage(3),
    backgroundColor: Colors.lightGrey + "30", // light tint
    paddingHorizontal: RFPercentage(2.5),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(2),
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },
  card: {
    width: "90%",
    alignSelf: "center",
    marginTop: RFPercentage(2),
    borderRadius: RFPercentage(1.5),
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    paddingBottom: RFPercentage(2),
    // height: RFPercentage(16),
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: "rgb(176,174,174)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
  },
  textWrap: { width: "90%", alignSelf: "center", marginTop: RFPercentage(1.6) },
  reviewText: {
    color: Colors.darkGrey2,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  footer: {
    width: "90%",
    alignSelf: "center",
    marginTop: RFPercentage(2),
    alignItems: "center",
    flexDirection: "row",
  },
  reviewDate: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  authorWrap: {
    position: "absolute",
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  authorText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  avatar: {
    marginLeft: RFPercentage(1),
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
  },
});
