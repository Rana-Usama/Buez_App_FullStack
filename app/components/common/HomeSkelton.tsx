import React from "react";
import { View, ScrollView, Dimensions } from "react-native";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import { RFPercentage } from "react-native-responsive-fontsize";

const { width } = Dimensions.get("window");

const HomeSkeleton = () => {
  return (
    <ScrollView
      contentContainerStyle={{
        alignItems: "center",
        paddingBottom: RFPercentage(10),
        marginTop: RFPercentage(4),
      }}
    >
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item>
        {/* Nav + Profile Image */}
        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" marginBottom={20}>
          <SkeletonPlaceholder.Item width={40} height={40} borderRadius={20} />
          <SkeletonPlaceholder.Item marginLeft={20} width={120} height={20} borderRadius={4} />
        </SkeletonPlaceholder.Item>

        {/* Input Fields */}
        {[...Array(2)].map((_, i) => (
          <SkeletonPlaceholder.Item
            key={i}
            width={width * 0.9}
            height={RFPercentage(6)}
            borderRadius={10}
            marginBottom={20}
          />
        ))}

        {/* Filter Buttons */}
        <SkeletonPlaceholder.Item flexDirection="row" marginBottom={20}>
          {[...Array(3)].map((_, i) => (
            <SkeletonPlaceholder.Item
              key={i}
              width={80}
              height={40}
              borderRadius={20}
              marginRight={15}
            />
          ))}
        </SkeletonPlaceholder.Item>

        {/* Cards */}
        {[...Array(2)].map((_, i) => (
          <SkeletonPlaceholder.Item
            key={i}
            width={width * 0.9}
            height={RFPercentage(42)}
            borderRadius={10}
            marginBottom={30}
          />
        ))}
         </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    </ScrollView>
  );
};

export default HomeSkeleton;
