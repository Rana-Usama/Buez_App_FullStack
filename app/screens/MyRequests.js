import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image, FlatList, Dimensions, Modal, Pressable } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Colors from "../config/Colors";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";
import MyAppButton from "../components/common/MyAppButton";

function MyRequests({ navigation }) {
  const [inputField, SetInputField] = useState([
    {
      placeholder: "Search",
      value: "",
    },
  ]);

  const [activeFilter, setActiveFilter] = useState("Active");
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const carts = [
    {
      images: [require("../../assets/Images/c1.png"), require("../../assets/Images/c1.png"), require("../../assets/Images/c1.png")],
      category: "Gardening",
      user: "Emma Stone",
      date: "Posted on: 07-08-2024",
      task: "Help in Gardening...",
      compensation: "25$",
      dp: require("../../assets/Images/dp.png"),
    },
    {
      images: [require("../../assets/Images/cover.png"), require("../../assets/Images/c1.png"), require("../../assets/Images/c1.png")],
      category: "Cleaning",
      user: "John Doe",
      date: "Posted on: 08-08-2024",
      task: "Help with Lawn...",
      compensation: "30$",
      dp: require("../../assets/Images/jhon.png"),
    },
  ];

  const [activeIndices, setActiveIndices] = useState(carts.map(() => 0));

  const handleChange = (text, i) => {
    let tempFields = [...inputField];
    tempFields[i].value = text;
    SetInputField(tempFields);
    setSearchQuery(text);
  };

  const filteredCarts = carts.filter((cart) => {
    const lowercasedQuery = searchQuery.toLowerCase();
    return cart.category.toLowerCase().includes(lowercasedQuery) || cart.user.toLowerCase().includes(lowercasedQuery) || cart.task.toLowerCase().includes(lowercasedQuery);
  });

  const FilterButton = ({ title, isActive, isFirst }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.filterButton, isActive ? styles.activeFilterButton : styles.inactiveFilterButton, isFirst && styles.firstFilterButton]}
      onPress={() => setActiveFilter(title)}
    >
      {isActive ? (
        <LinearGradient colors={[Colors.primary, "#4557B0"]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
          <Text style={styles.filterButtonTextActive}>{title}</Text>
        </LinearGradient>
      ) : (
        <Text style={styles.filterButtonTextInactive}>{title}</Text>
      )}
    </TouchableOpacity>
  );

  const handleScrollEnd = (event, cartIndex) => {
    const index = Math.floor(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
    const newActiveIndices = [...activeIndices];
    newActiveIndices[cartIndex] = index;
    setActiveIndices(newActiveIndices);
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Nav */}
        <Nav marginTop={RFPercentage(7.5)} leftLogo={false} navigation={navigation} title="My Requests" />

        {/* Filter Buttons */}
        <View
          style={{
            marginTop: RFPercentage(3.2),
            justifyContent: "flex-start",
            alignItems: "flex-start",
            flexDirection: "row",
            width: "90%",
          }}
        >
          {["Active", "Completed"].map((title, index) => (
            <FilterButton key={title} title={title} isActive={activeFilter === title} isFirst={index === 0} />
          ))}
        </View>

        {/* Carts */}
        {filteredCarts.map((cart, index) => (
          <View activeOpacity={0.8} key={index} style={[styles.cartContainer, { marginTop: index === 1 ? RFPercentage(3) : RFPercentage(3) }]}>
            <FlatList
              data={cart.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => handleScrollEnd(event, index)}
              renderItem={({ item }) => (
                <ImageBackground style={styles.cartImageBackground} imageStyle={styles.cartImage} source={item}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{cart.category}</Text>
                  </View>

                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "row",
                      position: "absolute",
                      left: RFPercentage(2),
                      top: RFPercentage(2),
                    }}
                  >
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("PostRequest", { title: "Edit Profile" })}>
                      <Image
                        style={{
                          width: RFPercentage(3.7),
                          height: RFPercentage(3.7),
                        }}
                        source={require("../../assets/Images/editRequest.png")}
                      />
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              )}
              keyExtractor={(item, index) => index.toString()}
            />

            <View style={styles.dotsContainer}>
              {cart.images.map((_, imageIndex) => (
                <View key={imageIndex} style={[styles.dot, imageIndex === activeIndices[index] ? styles.activeDot : styles.inactiveDot]} />
              ))}
            </View>

            {/* Info */}
            <View style={styles.cartInfoContainer}>
              <TouchableOpacity activeOpacity={0.8}>
                <Image style={styles.userImage} source={cart.dp} />
              </TouchableOpacity>

              <Text style={styles.userName}>{cart.user}</Text>
              <Text style={styles.postDate}>{cart.date}</Text>
            </View>
            <View style={styles.taskInfoContainer}>
              <Text style={styles.taskText}>{cart.task}</Text>
              <Text style={styles.compensationText}>
                Compensation: <Text style={styles.compensationAmount}>{cart.compensation}</Text>
              </Text>
            </View>
            <View style={{ width: "90%", flexDirection: "row", justifyContent: "flex-start", alignItems: "center", top: RFPercentage(-2.5) }}>
              <TouchableOpacity
                style={{
                  borderRadius: RFPercentage(1),
                  width: RFPercentage(14),
                  height: RFPercentage(5.5),
                  borderColor: Colors.primary,
                  borderWidth: RFPercentage(0.2),
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: Colors.primary }}>Mark as Done</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderRadius: RFPercentage(1),
                  width: RFPercentage(14),
                  height: RFPercentage(5.5),
                  borderColor: Colors.red,
                  borderWidth: RFPercentage(0.2),
                  justifyContent: "center",
                  alignItems: "center",
                  position: "absolute",
                  right: 0,
                }}
              >
                <Text style={{ color: Colors.red }}>Mark as Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Tab */}
      <CustomTabBar myRequests={true} navigation={navigation} />

      {/* Modal */}
      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <BlurView intensity={40} style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Are you sure you want to delete{"\n"}this request?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <MyAppButton title={"Yes"} marginTop={RFPercentage(0)} height={RFPercentage(5.8)} width={RFPercentage(17)} />
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  scrollView: {
    width: "100%",
  },
  scrollViewContent: {
    alignItems: "center",
  },
  filterButton: {
    width: RFPercentage(13),
    height: RFPercentage(4.8),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: RFPercentage(2),
    alignSelf: "flex-start",
  },
  activeFilterButton: {
    borderColor: "transparent",
  },
  inactiveFilterButton: {
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
  },
  firstFilterButton: {
    marginLeft: 0,
  },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    borderRadius: RFPercentage(1),
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  filterButtonTextInactive: {
    color: Colors.heading,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
  },
  cartContainer: {
    width: "90%",
    height: RFPercentage(50),
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(2),
    justifyContent: "flex-start",
    alignItems: "center",
    overflow: "hidden",
  },
  cartImageBackground: {
    width: RFPercentage(45.3),
    height: RFPercentage(24.5),
  },
  cartImage: {
    borderTopLeftRadius: RFPercentage(2),
    borderTopRightRadius: RFPercentage(2),
  },
  categoryBadge: {
    borderBottomLeftRadius: RFPercentage(1),
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: RFPercentage(0.8),
  },
  categoryText: {
    color: Colors.white,
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
  },
  dotsContainer: {
    flexDirection: "row",
    alignSelf: "center",
    top: RFPercentage(-9),
  },
  dot: {
    height: RFPercentage(0.9),
    width: RFPercentage(0.9),
    borderRadius: RFPercentage(0.5),
    margin: RFPercentage(0.5),
    marginTop: RFPercentage(3),
  },
  activeDot: {
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    backgroundColor: "#D3D3D3",
  },
  cartInfoContainer: {
    width: "92%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    top: RFPercentage(-7),
  },
  userImage: {
    width: RFPercentage(4.9),
    height: RFPercentage(4.9),
    borderColor: Colors.primary,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(100),
  },
  userName: {
    marginLeft: RFPercentage(1.4),
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  postDate: {
    fontSize: RFPercentage(1.6),
    position: "absolute",
    right: 0,
    fontFamily: "Poppins_400Regular",
  },
  taskInfoContainer: {
    width: "92%",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    top: RFPercentage(-5),
  },
  taskText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  compensationText: {
    fontSize: RFPercentage(1.8),
    position: "absolute",
    right: 0,
    fontFamily: "Poppins_500Medium",
  },
  compensationAmount: {
    color: Colors.primary,
    fontFamily: "Poppins_600SemiBold",
  },
  bottomSpacing: {
    marginBottom: RFPercentage(6),
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    alignItems: "center",
    height: RFPercentage(25),
    justifyContent: "center",
  },
  modalText: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: RFPercentage(4),
    lineHeight: RFPercentage(3.2),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "90%",
    alignItems: "center",
  },
  cancelButton: {
    width: RFPercentage(17),
    borderRadius: RFPercentage(10),
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: RFPercentage(2),
    height: RFPercentage(5.8),
  },
  cancelButtonText: {
    fontSize: RFPercentage(2),
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
  },
  confirmButton: {
    width: "45%",
    padding: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: RFPercentage(2),
    color: Colors.white,
    fontFamily: "Poppins_500Medium",
  },
});

export default MyRequests;
