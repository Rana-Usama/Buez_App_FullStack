import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import Nav from "../components/common/Nav";
import Colors from "../config/Colors";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";

function FAQ({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [faqSections, setFaqSections] = useState([
    {
      title: t("faqs.section1.title"),
      icon: "info-circle",
      iconType: "fontawesome",
      questions: [
        {
          question: t("faqs.section1.questions.q1"),
          answer: t("faqs.section1.questions.a1"),
        },
        {
          question: t("faqs.section1.questions.q2"),
          answer: t("faqs.section1.questions.a2"),
        },
        {
          question: t("faqs.section1.questions.q3"),
          answer: t("faqs.section1.questions.a3"),
        },
        {
          question: t("faqs.section1.questions.q4"),
          answer: t("faqs.section1.questions.a4"),
        },
      ],
    },
    {
      title: t("faqs.section2.title"),
      icon: "credit-card",
      iconType: "fontawesome",
      questions: [
        {
          question: t("faqs.section2.questions.q1"),
          answer: t("faqs.section2.questions.a1"),
        },
        {
          question: t("faqs.section2.questions.q2"),
          answer: t("faqs.section2.questions.a2"),
        },
        {
          question: t("faqs.section2.questions.q3"),
          answer: t("faqs.section2.questions.a3"),
        },
      ],
    },
    {
      title: t("faqs.section3.title"),
      icon: "tasks",
      iconType: "fontawesome",
      questions: [
        {
          question: t("faqs.section3.questions.q1"),
          answer: t("faqs.section3.questions.a1"),
        },
        {
          question: t("faqs.section3.questions.q2"),
          answer: t("faqs.section3.questions.a2"),
        },
        {
          question: t("faqs.section3.questions.q3"),
          answer: t("faqs.section3.questions.a3"),
        },
        {
          question: t("faqs.section3.questions.q4"),
          answer: t("faqs.section3.questions.a4"),
        },
      ],
    },
    {
      title: t("faqs.section4.title"),
      icon: "money-bill-wave",
      iconType: "fontawesome",
      questions: [
        {
          question: t("faqs.section4.questions.q1"),
          answer: t("faqs.section4.questions.a1"),
        },
        {
          question: t("faqs.section4.questions.q2"),
          answer: t("faqs.section4.questions.a2"),
        },
      ],
    },
    {
      title: t("faqs.section5.title"),
      icon: "shield-alt",
      iconType: "fontawesome",
      questions: [
        {
          question: t("faqs.section5.questions.q1"),
          answer: t("faqs.section5.questions.a1"),
        },
        {
          question: t("faqs.section5.questions.q2"),
          answer: t("faqs.section5.questions.a2"),
        },

        {
          question: t("faqs.section5.questions.q4"),
          answer: t("faqs.section5.questions.a4"),
        },
      ],
    },
    {
      title: t("faqs.section6.title"),
      icon: "tools",
      iconType: "fontawesome",
      questions: [
        {
          question: t("faqs.section6.questions.q1"),
          answer: t("faqs.section6.questions.a1"),
        },
        {
          question: t("faqs.section6.questions.q2"),
          answer: t("faqs.section6.questions.a2"),
        },
      ],
    },
    {
      title: t("faqs.section7.title"),
      icon: "rocket",
      iconType: "fontawesome",
      questions: [
        {
          question: t("faqs.section7.questions.q1"),
          answer: t("faqs.section7.questions.a1"),
        },
        {
          question: t("faqs.section7.questions.q2"),
          answer: t("faqs.section7.questions.a2"),
        },

        {
          question: t("faqs.section7.questions.q4"),
          answer: t("faqs.section7.questions.a4"),
        },
      ],
    },
  ]);

  const [expandedItems, setExpandedItems] = useState({});

  const toggleFAQ = (sectionIndex, questionIndex) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const key = `${sectionIndex}-${questionIndex}`;
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getIconComponent = (iconType, iconName, color, size) => {
    switch (iconType) {
      case "fontawesome":
        return <FontAwesome5 name={iconName} size={size} color={color} />;
      case "ionicons":
        return <Ionicons name={iconName} size={size} color={color} />;
      default:
        return <MaterialIcons name={iconName} size={size} color={color} />;
    }
  };

  // Get appropriate background color based on theme
  const getCardBackground = () => {
    return theme.mode === "light" ? theme.pureWhite : theme.lightWhite + 10;
  };

  // Get appropriate shadow color based on theme
  const getShadowColor = () => {
    return theme.mode === "light"
      ? "rgba(0, 0, 0, 0.1)"
      : "rgba(255, 255, 255, 0.1)";
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      {/* Navigation Header */}
      <Nav
        dpNull
        marginTop={RFPercentage(5)}
        navigation={navigation}
        title={`${t("settings.txt5")}`}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? Colors.primary + "40"
                    : Colors.primary + "15",
              },
            ]}
          >
            <Ionicons
              name="help-buoy"
              size={RFPercentage(4)}
              color={theme.primary}
            />
          </View>
          <Text style={[styles.headerTitle, { color: theme.heading }]}>
            {t("faqs.txt1")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.darkGrey }]}>
            {t("faqs.txt2")}
          </Text>
        </View>

        {/* FAQ Sections */}
        <View style={styles.faqContainer}>
          {faqSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  {getIconComponent(
                    section.iconType,
                    section.icon,
                    theme.primary,
                    RFPercentage(2.2)
                  )}
                  <Text style={[styles.sectionTitle, { color: theme.heading }]}>
                    {section.title}
                  </Text>
                </View>
                <View
                  style={[
                    styles.sectionDivider,
                    { backgroundColor: theme.stroke },
                  ]}
                />
              </View>

              {/* Questions */}
              {section.questions.map((item, questionIndex) => {
                const key = `${sectionIndex}-${questionIndex}`;
                const isExpanded = expandedItems[key];
                const shadowColor = getShadowColor();
                const cardBackground = getCardBackground();

                return (
                  <View
                    key={key}
                    style={[
                      styles.faqItem,
                      {
                        backgroundColor: cardBackground,
                        borderColor: theme.stroke,
                        shadowColor: shadowColor,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleFAQ(sectionIndex, questionIndex)}
                      style={styles.faqHeader}
                    >
                      <View style={styles.questionContainer}>
                        <View
                          style={[
                            styles.questionIcon,
                            {
                              backgroundColor:
                                theme.mode === "dark"
                                  ? Colors.primary + "40"
                                  : Colors.primary + "15",
                            },
                          ]}
                        >
                          <MaterialIcons
                            name="help-outline"
                            size={RFPercentage(2)}
                            color={theme.primary}
                          />
                        </View>
                        <Text
                          style={[
                            styles.questionText,
                            { color: theme.heading },
                          ]}
                        >
                          {item.question}
                        </Text>
                      </View>
                      <MaterialIcons
                        name={
                          isExpanded
                            ? "keyboard-arrow-up"
                            : "keyboard-arrow-down"
                        }
                        size={RFPercentage(2.5)}
                        color={theme.primary}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.answerContainer}>
                        <View
                          style={[
                            styles.answerDivider,
                            { backgroundColor: theme.stroke },
                          ]}
                        />
                        <Text
                          style={[styles.answerText, { color: theme.darkGrey }]}
                        >
                          {item.answer}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Support Footer */}
        <View
          style={[
            styles.supportSection,
            {
              backgroundColor:
                theme.mode === "dark"
                  ? Colors.primary + "40"
                  : Colors.primary + "15",
            },
          ]}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={RFPercentage(3)}
            color={theme.primary}
          />
          <Text style={[styles.supportTitle, { color: theme.heading }]}>
            {t("faqs.txt3")}
          </Text>
          <Text style={[styles.supportText, { color: theme.darkGrey }]}>
            {t("faqs.txt4")}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.contactButton, { backgroundColor: theme.primary }]}
            onPress={async () => {
              const email = "info@buezapp.com";
              const subject = "BUEZ App Support";
              const body =
                "Hello BUEZ Support Team,\n\nI need assistance with:";

              if (Platform.OS === "android") {
                const url = `mailto:${email}?subject=${encodeURIComponent(
                  subject
                )}&body=${encodeURIComponent(body)}`;

                try {
                  await Linking.openURL(url);
                } catch (err) {
                  console.log("Error opening email client:", err);
                }
              } else {
                const url = `mailto:${email}?subject=${encodeURIComponent(
                  subject
                )}&body=${encodeURIComponent(body)}`;
                try {
                  await Linking.openURL(url);
                } catch (err) {
                  console.log("Error opening email client:", err);
                }
              }
            }}
          >
            <Text style={styles.contactButtonText}> {t("faqs.txt5")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: RFPercentage(5),
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: RFPercentage(3),
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(4),
  },
  headerIcon: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(2),
  },
  headerTitle: {
    fontSize: RFPercentage(2.5),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: RFPercentage(0.5),
  },
  headerSubtitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  faqContainer: {
    paddingHorizontal: RFPercentage(2),
  },
  section: {
    marginBottom: RFPercentage(4),
  },
  sectionHeader: {
    marginBottom: RFPercentage(2),
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1),
    paddingHorizontal: RFPercentage(1),
  },
  sectionTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(1),
  },
  sectionDivider: {
    height: 1,
    opacity: 0.5,
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: RFPercentage(1.5),
    overflow: "hidden",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: RFPercentage(2),
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: RFPercentage(1),
  },
  questionIcon: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(1.5),
    justifyContent: "center",
    alignItems: "center",
    marginRight: RFPercentage(1.5),
  },
  questionText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    flex: 1,
    lineHeight: RFPercentage(2.2),
  },
  answerContainer: {
    padding: RFPercentage(2),
    paddingTop: 0,
  },
  answerDivider: {
    height: 1,
    marginBottom: RFPercentage(2),
    opacity: 0.3,
  },
  answerText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.2),
    textAlign: "left",
  },
  supportSection: {
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    padding: RFPercentage(3),
    borderRadius: 16,
    alignItems: "center",
  },
  supportTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    marginTop: RFPercentage(1),
    marginBottom: RFPercentage(0.5),
  },
  supportText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: RFPercentage(2),
  },
  contactButton: {
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(1.2),
    borderRadius: 8,
  },
  contactButtonText: {
    color: Colors.white,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },
});

export default FAQ;
