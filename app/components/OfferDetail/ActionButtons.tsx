import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../config/Colors";

type Props = {
  isAccepted: boolean;
  isBulkRequest: boolean;
  isPostOwner: boolean;
  hasGroupChat: boolean;
  confirmed: boolean;
  hasApplied: boolean;
  canApply?: () => boolean;
  handleStartChat?: () => void;
  handleOpenGroupChat?: () => void;
  handleApply?: () => void;
  handleAccept?: () => void;
  navigation?: any;
  postRequest?: any;
  t: any;
  theme: any;
  loading?: boolean;
};

export default function ActionButtons({
  isAccepted,
  isBulkRequest,
  isPostOwner,
  hasGroupChat,
  confirmed,
  hasApplied,
  canApply = () => false,
  handleStartChat,
  handleOpenGroupChat,
  handleApply,
  handleAccept,
  navigation,
  postRequest,
  t,
  theme,
}: Props) {
  // If not bulk and post owner -> no actions
  if (!isBulkRequest && isPostOwner) return null;

  // Helper: button style
  const primaryStyle = {
    flex: 1,
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(100),
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: Colors.primary,
  };
  const secondaryStyle = {
    flex: 1,
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(100),
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: theme.mode === "dark" ? theme.white + "10" : Colors.white + "10",
  };
  const disabledStyle = {
    ...secondaryStyle,
    opacity: 0.5,
  };

  // BULK REQUESTS
  if (isBulkRequest) {
    // Post owner: show group chat (if any) + view applicants
    if (isPostOwner) {
      return (
        <View style={{ flexDirection: "row", gap: RFPercentage(1.5), marginTop: RFPercentage(1), marginBottom: RFPercentage(4) }}>
          <TouchableOpacity
            onPress={() => handleOpenGroupChat && handleOpenGroupChat()}
            style={secondaryStyle}
            activeOpacity={0.8}
          >
            <Text style={{color: "#fff", fontFamily:"Poppins_400Regular"}}>{t("taskApplicants.group")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation?.navigate("TaskApplicantsScreen", { taskId: postRequest?.id })}
            style={primaryStyle}
            activeOpacity={0.85}
          >
            <Text style={{ color: "#fff" , fontFamily:"Poppins_400Regular"}}>{t("offerDetail.viewApplications")}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Not post owner (worker view)
    // If confirmed and hasGroupChat -> show group chat + confirmed status
    if (confirmed && hasGroupChat) {
      return (
        <View style={{ flexDirection: "row", gap: RFPercentage(1.5), marginTop: RFPercentage(1), marginBottom: RFPercentage(4) }}>
          <TouchableOpacity onPress={() => handleOpenGroupChat && handleOpenGroupChat()} style={primaryStyle} activeOpacity={0.85}>
            <Text style={{ color: "#fff", fontFamily:"Poppins_400Regular" }}>{t("taskApplicants.group")}</Text>
          </TouchableOpacity>

          <View style={{ ...secondaryStyle, backgroundColor: "#4CAF5020" }}>
            <Text style={{ color: "#4CAF50", fontFamily:"Poppins_400Regular"}}>{t("profile.confirmed") || "Confirmed"}</Text>
          </View>
        </View>
      );
    }

    // Not confirmed
    // Show group chat button (disabled until confirmed) and second button for apply / status
    return (
      <View style={{ flexDirection: "row", gap: RFPercentage(1.5), marginTop: RFPercentage(1), marginBottom: RFPercentage(4) }}>
        <TouchableOpacity
          onPress={() => {
            if (confirmed && handleOpenGroupChat) handleOpenGroupChat();
          }}
          style={confirmed ? primaryStyle : disabledStyle}
          activeOpacity={0.8}
          disabled={!confirmed}
        >
          <Text style={{ color: confirmed ? "#fff" : theme.darkGrey , fontFamily:"Poppins_400Regular"}}>{t("taskApplicants.group")}</Text>
        </TouchableOpacity>

        {/* Second control: either applied status or "I'm available" / apply button */}
        {hasApplied ? (
          <View style={{ ...secondaryStyle, backgroundColor: Colors.primary + "10" }}>
            <Text style={{ color: Colors.primary, fontWeight: "600" }}>{t("offerDetail.applied") || "Applied"}</Text>
          </View>
        ) : canApply() ? (
          <TouchableOpacity onPress={() => handleApply && handleApply()} style={primaryStyle} activeOpacity={0.85}>
            <Text style={{ color: "#fff", fontFamily:"Poppins_400Regular" }}>{t("offerDetail.imAvailable") || "I'm available"}</Text>
          </TouchableOpacity>
        ) : (
          <View style={disabledStyle}>
            <Text style={{ color: Colors.red }}>{t("offerDetail.cannotApply") || "Cannot apply"}</Text>
          </View>
        )}
      </View>
    );
  }

  // NON-BULK REQUESTS (single)
  // If accepted -> show only start chat (if not post owner)
  if (isAccepted || /* confirmed flag may also represent acceptance */ false) {
    if (isPostOwner) return null;
    return (
      <View style={{ flexDirection: "row", gap: RFPercentage(1.5), marginTop: RFPercentage(1), marginBottom: RFPercentage(4) }}>
        <TouchableOpacity onPress={() => handleStartChat && handleStartChat()} style={primaryStyle} activeOpacity={0.85}>
          <Text style={{ color: "#fff", fontFamily:"Poppins_400Regular" }}>{t("details.txt9")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Not accepted and not bulk
  if (!isPostOwner) {
    return (
      <View style={{ flexDirection: "row", gap: RFPercentage(1.5), marginTop: RFPercentage(1), marginBottom: RFPercentage(4) }}>
        <TouchableOpacity onPress={() => handleStartChat && handleStartChat()} style={secondaryStyle} activeOpacity={0.8}>
          <Text style={{ color :  Colors.primary , fontFamily:"Poppins_400Regular" }}>{t("details.txt9")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleAccept && handleAccept()} style={primaryStyle} activeOpacity={0.85}>
          <Text style={{ color: "#fff" }}>{t("details.txt12")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}