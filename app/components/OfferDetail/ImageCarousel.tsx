import React from "react";
import { FlatList, TouchableOpacity, Image, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";

const { width } = Dimensions.get("window");

type Props = {
  imageUrls?: string[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onOpenViewer: () => void;
};

export default function ImageCarousel({ imageUrls = [], activeIndex, setActiveIndex, onOpenViewer }: Props) {
  return (
    <>
      {imageUrls.length > 0 ? (
        <FlatList
          data={imageUrls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
            setActiveIndex(index);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.9} onPress={onOpenViewer} style={{ width, height: "100%" }}>
              <Image source={{ uri: item }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.3)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%" }} />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      ) : (
        <View style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
          <LinearGradient colors={[Colors.primary + "20", Colors.primary + "05"]} style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
            {/* Icon + text left intentionally minimal so main file still controls translations */}
          </LinearGradient>
        </View>
      )}
    </>
  );
}