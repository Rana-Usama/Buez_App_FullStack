// src/screens/CompletedTasks.js
import React, { useEffect, useState, useCallback, useTransition } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Platform, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";

import Nav from "../components/common/Nav";
import MyAppButton from "../components/common/MyAppButton";
import NotFound from "../components/common/NotFound";

import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { getFormatedDate } from "../services/Shared.service";
import { fetchCompletedTasksFromFirebase } from "../services/Review.service";
import { translateText } from "../translation/googleTranslation";
import { useTranslation } from "react-i18next";

const getTargetLanguage = async () => {
  try {
    const stored = await SecureStore.getItemAsync("appLanguage");
    return stored || Localization.locale.split("-")[0] || "en";
  } catch {
    return "en";
  }
};

export default function CompletedTasks({ navigation }) {
  const [lang, setLang] = useState("en");
  const [tr, setTr] = useState({});
  const { t } = useTranslation();

  const [tasks, setTasks] = useState([]);
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* 1️⃣  Load language + static phrase translations */
  useEffect(() => {
    (async () => {
      const l = await getTargetLanguage();
      setLang(l);

      const base = {
        completedTasks: "Completed Tasks",
        category: "Category",
        completedOn: "Completed on",
        review: "Review",
        reviewed: "Reviewed",
        noTasks: "No completed tasks",
        translating: "Translating...",
      };
      const vals = await Promise.all(Object.values(base).map((txt) => translateText(txt)));
      const mapped = Object.keys(base).reduce((obj, k, i) => {
        obj[k] = vals[i] || base[k];
        return obj;
      }, {});
      setTr(mapped);
    })();
  }, []);

  const fetchCompletedTasks = async () => {
    setLoading(true);
    try {
      const records = await fetchCompletedTasksFromFirebase();

      const newCache = { ...cache };
      await Promise.all(
        records.map(async (task) => {
          if (newCache[task.id]) return;

          const originalDesc = task.taskDetails?.description || "";
          const originalCat = task.taskDetails?.taskType || "";

          const [descTr, catTr] = await Promise.all([originalDesc ? translateText(originalDesc) : "", originalCat ? translateText(originalCat) : ""]);

          newCache[task.id] = {
            desc: descTr || originalDesc,
            category: catTr || originalCat,
          };
        })
      );

      setCache(newCache);
      setTasks(records);
    } catch (e) {
      console.log("Task fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  /* pull-to-refresh */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompletedTasks();
    setRefreshing(false);
  };

  /* load on focus */
  useFocusEffect(
    useCallback(() => {
      fetchCompletedTasks();
    }, [])
  );

  /* ---------- list item ---------- */
  const renderItem = ({ item }) => {
    const details = item.taskDetails || {};
    const owner = details.user || {};
    const doneOn = item.completedAt || item.acceptedAt || new Date().toISOString();

    const cached = cache[item.id] || {};
    const desc = cached.desc ?? tr.translating;
    const catName = cached.category ?? tr.translating;

    const shortDesc = desc && desc.length > 30 ? desc.slice(0, 30) + "…" : desc || "-";

    return (
      <View style={styles.card}>
        {/* header */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image style={styles.avatar} source={owner.profileImage ? { uri: owner.profileImage } : Icons.dp} />
            <Text style={styles.userName}>{owner.userName || "User"}</Text>
          </View>
          <Text style={styles.category}>{`${tr.category || "Category"}: ${catName}`}</Text>
        </View>

        {/* description & date */}
        <View style={{ marginLeft: RFPercentage(2.6), marginTop: RFPercentage(1.5) }}>
          <Text style={styles.desc}>{shortDesc}</Text>
          <Text style={styles.date}>{`${tr.completedOn || "Completed on"}: ${getFormatedDate(doneOn, lang)}`}</Text>
        </View>

        {/* Review / Reviewed */}
        <View style={{ position: "absolute", right: RFPercentage(1.6), bottom: RFPercentage(2) }}>
          {item.reviewed ? (
            <Text style={styles.reviewed}>{tr.reviewed || "Reviewed"}</Text>
          ) : (
            <MyAppButton title={tr.review || "Review"} height={RFPercentage(4)} width={RFPercentage(12)} onPress={() => navigation.navigate("AddReview", { task: item })} />
          )}
        </View>
      </View>
    );
  };

  /* ---------- ui ---------- */
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
      >
        {/* Nav */}
        <View style={{ marginLeft: RFPercentage(2.5) }}>
          <Nav dpNull marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title={`${t("profile.txt4")}`} />
        </View>

        {/* Header */}
        <View style={styles.headerWrap}>
          <Text style={styles.headerText}>{`${t("profile.txt4")}`}</Text>
          <View style={styles.separator} />
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: RFPercentage(8) }} />
        ) : tasks.length === 0 ? (
          <NotFound title={tr.noTasks || "No completed tasks"} />
        ) : (
          <FlatList data={tasks} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: RFPercentage(5) }} />
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  scrollView: { width: "100%" },

  headerWrap: {
    width: "90%",
    alignSelf: "center",
    marginTop: RFPercentage(3.5),
  },
  headerText: {
    color: Colors.grey,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_400Regular",
  },
  separator: {
    width: "75%",
    height: RFPercentage(0.1),
    backgroundColor: "rgb(211,211,211)",
    marginTop: RFPercentage(1),
  },

  /* card */
  card: {
    width: "90%",
    alignSelf: "center",
    marginTop: RFPercentage(3),
    height: RFPercentage(20),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    elevation: 5,
    shadowColor: "rgb(96,94,94)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerRow: {
    width: "90%",
    alignSelf: "center",
    marginTop: RFPercentage(1.8),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: {
    width: RFPercentage(5.5),
    height: RFPercentage(5.5),
    borderRadius: RFPercentage(100),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
  },
  userName: {
    color: Colors.darkGrey2,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.9),
  },
  category: {
    color: Colors.darkGrey2,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },
  desc: {
    color: Colors.darkGrey,
    fontFamily: "Poppins_400Regular",
  },
  date: {
    color: Colors.darkGrey,
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.6),
    top: RFPercentage(0.4),
  },
  reviewed: {
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
    right: RFPercentage(1),
  },
});
