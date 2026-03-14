import React from "react";
import { View, Text, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../config/Colors";
import { Icons } from "../../config/theme";

type Props = {
  translatedReviews: any[];
  averageRating: any;
  t: any;
  theme: any;
  showAll: boolean;
  onShowAll: () => void;
};

export default function ReviewsCard({ translatedReviews = [], averageRating, t, theme, showAll, onShowAll }: Props) {
  const visible = showAll ? translatedReviews : translatedReviews.slice(0, 3);
  const hiddenCount = Math.max(0, translatedReviews.length - 3);

  if (translatedReviews.length === 0 && !averageRating) return null;

  return (
    <View style={{ borderRadius: 16, padding: RFPercentage(2), marginBottom: RFPercentage(2), borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", backgroundColor: theme.mode === "dark" ? theme.white + "10" : "#FFF8E1" }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: RFPercentage(1.5) }}>
        <Ionicons name="star" size={RFPercentage(2.2)} color="#FFD700" />
        <Text style={{ marginLeft: RFPercentage(0.5), fontSize: RFPercentage(1.6), fontFamily: "Poppins_600SemiBold", color: theme.heading }}>{t("profile.txt3")}{averageRating ? <Text style={{ fontSize: RFPercentage(1.4), color: theme.darkGrey }}> ({averageRating} ⭐)</Text> : null}</Text>
      </View>

      {visible.map((review, i) => (
        <View key={review.id || i} style={{ borderRadius: 12, padding: RFPercentage(1.2), marginBottom: RFPercentage(1.2), backgroundColor: theme.mode === "dark" ? theme.white + "08" : "rgba(255,255,255,0.7)" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: RFPercentage(0.8) }}>
            <Image source={review?.reviewer?.profileImage ? { uri: review.reviewer.profileImage } : Icons.dp} style={{ width: RFPercentage(4), height: RFPercentage(4), borderRadius: RFPercentage(2), marginRight: RFPercentage(1) }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: RFPercentage(1.4), fontFamily: "Poppins_600SemiBold", color: theme.heading }}>{review?.reviewer?.userName}</Text>
              <Text style={{ fontSize: RFPercentage(1.1), color: theme.darkGrey }}>{new Date(review?.createdAt || Date.now()).toLocaleDateString()}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 2 }}>
              {[1,2,3,4,5].map(st => <Ionicons key={st} name="star" size={RFPercentage(1.4)} color={st <= (review.rating||0) ? "#FFD700" : theme.border} />)}
            </View>
          </View>
          <Text style={{ color: theme.darkGrey }}>{review.translatedText}</Text>
        </View>
      ))}

      {!showAll && hiddenCount > 0 && (
        <Text onPress={onShowAll} style={{ color: Colors.primary, marginTop: RFPercentage(0.5) }}>{`+${hiddenCount} ${t("details.txt11")}`}</Text>
      )}
    </View>
  );
}