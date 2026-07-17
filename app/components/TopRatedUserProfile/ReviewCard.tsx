import React from "react";
import { View, Text, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import AvatarInitials from "../common/DefaultAvatars";

const formatDate = (createdAt: any) =>
  createdAt?.seconds
    ? new Date(createdAt.seconds * 1000).toLocaleDateString()
    : "";

const Stars = ({ rating, size }: { rating: number; size: number }) => (
  <View style={{ flexDirection: "row" }}>
    {[...Array(5)].map((_, i) => (
      <Ionicons
        key={i}
        name="star"
        size={size}
        color={i < rating ? "#FFD700" : "#DDD"}
      />
    ))}
  </View>
);

// Renders ONE card per reviewer. `group` = { reviewer, reviews[] } — the
// reviewer's profile (avatar, name, rating) is shown once; all of their
// reviews are listed beneath it in the existing sort order. A reviewer with
// a single review renders exactly as before.
export default function ReviewCard({
  group,
  translatedMap = {},
  theme,
  t,
}: any) {
  const reviews = group?.reviews || [];
  const reviewer = group?.reviewer;
  const isMulti = reviews.length > 1;
  const headerRating = isMulti
    ? Math.round(
        reviews.reduce((sum: number, r: any) => sum + (r?.rating || 0), 0) /
          reviews.length,
      )
    : reviews[0]?.rating || 0;

  return (
    <View
      style={{
        padding: RFPercentage(2),
        borderRadius: 16,
        marginBottom: RFPercentage(1.5),
        borderWidth: 1,
        width: "90%",
        alignSelf: "center",
        borderColor:
          theme.mode === "dark"
            ? "rgba(255,255,255,0.10)"
            : "rgba(17,24,39,0.08)",
        backgroundColor:
          theme.mode === "dark" ? "rgba(255,255,255,0.04)" : "#FFFFFF",
      }}
    >
      {/* Reviewer profile — rendered once per user */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: RFPercentage(1),
        }}
      >
        {reviewer?.profileImage ? (
          <Image
            source={{ uri: reviewer.profileImage }}
            style={{
              width: RFPercentage(5),
              height: RFPercentage(5),
              borderRadius: RFPercentage(1.5),
              marginRight: RFPercentage(1),
            }}
          />
        ) : (
          <AvatarInitials
            name={reviewer?.userName}
            textStyle={{ fontSize: RFPercentage(2) }}
            style={{
              width: RFPercentage(5),
              height: RFPercentage(5),
              borderRadius: RFPercentage(1.5),
              marginRight: RFPercentage(1),
            }}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: RFPercentage(1.4),
              fontFamily: "Poppins_600SemiBold",
              color: theme.heading,
            }}
          >
            {reviewer?.userName}
          </Text>
          <View style={{ marginTop: RFPercentage(0.5) }}>
            <Stars rating={headerRating} size={RFPercentage(1.4)} />
          </View>
        </View>
        <Text
          style={{
            color: theme.darkGrey,
            fontSize: 11,
            fontFamily: "Poppins_400Regular",
          }}
        >
          {isMulti
            ? `${reviews.length} ${t?.("profile.txt3") || "Reviews"}`
            : formatDate(reviews[0]?.createdAt)}
        </Text>
      </View>

      {/* All of this user's reviews, in the existing order */}
      {isMulti ? (
        reviews.map((item: any, idx: number) => (
          <View
            key={item?.id || idx}
            style={{ marginTop: idx > 0 ? RFPercentage(1.4) : 0 }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: RFPercentage(0.3),
              }}
            >
              <Text
                style={{
                  color: theme.darkGrey,
                  fontSize: 11,
                  fontFamily: "Poppins_400Regular",
                }}
              >
                {formatDate(item?.createdAt)}
              </Text>
              <Stars rating={item?.rating || 0} size={RFPercentage(1.2)} />
            </View>
            <Text style={{ color: theme.darkGrey }}>
              {translatedMap[item?.id] ?? item?.reviewText}
            </Text>
          </View>
        ))
      ) : (
        <Text style={{ color: theme.darkGrey }}>
          {translatedMap[reviews[0]?.id] ?? reviews[0]?.reviewText}
        </Text>
      )}
    </View>
  );
}
