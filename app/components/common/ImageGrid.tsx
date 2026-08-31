import React, { useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../../app/config/Colors";

const { width } = Dimensions.get("window");

type Props = {
  imageUris: (string | null)[];
  onPick: (index: number) => void;
  onDelete: (index: number) => void;
  theme: any;
  t: (key: string) => string;
};

function ImageGrid({ imageUris, onPick, onDelete, theme, t }: Props) {
  const data = [0, 1, 2];

  const renderItem = useCallback(
    ({ item: index }) => {
      const uri = imageUris[index];
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onPick(index)}
          style={[
            styles.imageContainer,
            {
              backgroundColor: theme.white,
              borderColor: uri ? theme.primary : theme.border,
              borderWidth: uri ? 1.5 : 1,
            },
          ]}
        >
          {uri ? (
            <>
              <Image style={styles.selectedImage} source={{ uri }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
              <TouchableOpacity
                onPress={() => onDelete(index)}
                style={[styles.deleteButton, styles.touchableOpacity]}
              >
                <MaterialIcons name="close" size={RFPercentage(1.8)} color={theme.white} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onPick(index)}
                style={[styles.editButton, { backgroundColor: theme.primary }]}
              >
                <MaterialIcons name="edit" size={RFPercentage(1.5)} color={theme.white} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.placeholder}>
              <MaterialIcons name="add-a-photo" size={RFPercentage(3)} color={theme.heading} />
              <Text style={[styles.addPhotoText, { color: theme.heading }]}>{t("postRequest.photo")}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [imageUris, onPick, onDelete, theme, t],
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(i) => i.toString()}
      horizontal={false}
      numColumns={3}
      scrollEnabled={false}
      renderItem={renderItem}
      contentContainerStyle={styles.flatListContentContainer}
    />
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: (width - RFPercentage(8)) / 3,
    height: (width - RFPercentage(8)) / 3,
    borderRadius: RFPercentage(1.2),
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: RFPercentage(1),
    marginRight: RFPercentage(1),
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  deleteButton: {
    position: "absolute",
    top: RFPercentage(0.5),
    right: RFPercentage(0.5),
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
    borderRadius: RFPercentage(100),
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    position: "absolute",
    top: RFPercentage(0.5),
    left: RFPercentage(0.5),
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
    borderRadius: RFPercentage(1.25),
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(1),
  },
  touchableOpacity: { backgroundColor: Colors.red },
  flatListContentContainer: { justifyContent: "space-between" },
});

export default React.memo(ImageGrid);