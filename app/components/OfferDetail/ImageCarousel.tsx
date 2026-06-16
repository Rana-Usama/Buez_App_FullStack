import React from "react";
import {
  FlatList,
  TouchableOpacity,
  Image,
  View,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";

const { width } = Dimensions.get("window");

type Props = {
  imageUrls?: string[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onOpenViewer: () => void;
};

export default function ImageCarousel({
  imageUrls = [],
  activeIndex,
  setActiveIndex,
  onOpenViewer,
}: Props) {
  return (
    <>
      {imageUrls.length > 0 ? (
        <FlatList
          data={imageUrls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x /
                event.nativeEvent.layoutMeasurement.width,
            );
            setActiveIndex(index);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onOpenViewer}
              style={{ width, height: "100%" }}
            >
              <Image
                source={{ uri: item }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              {/* Top scrim for back button / badge legibility */}
              <LinearGradient
                colors={["rgba(0,0,0,0.35)", "transparent"]}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "22%",
                }}
              />
              {/* Bottom scrim for dots + content overlap */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.45)"]}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "40%",
                }}
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LinearGradient
            colors={[Colors.primary + "22", Colors.primary + "08"]}
            style={{
              width: "100%",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="image-outline"
              size={RFPercentage(6)}
              color={Colors.primary + "55"}
            />
          </LinearGradient>
        </View>
      )}
    </>
  );
}
