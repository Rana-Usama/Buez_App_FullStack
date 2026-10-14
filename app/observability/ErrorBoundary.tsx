import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Sentry from "@sentry/react-native";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../contexts/themeContext";

interface ErrorFallbackProps {
  resetError: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const themed = useMemo(
    () => ({
      container: { backgroundColor: theme.white },
      title: { color: theme.black },
      message: { color: theme.desc },
      button: { backgroundColor: theme.primary },
      buttonText: { color: theme.pureWhite },
    }),
    [theme],
  );

  return (
    <View style={[styles.container, themed.container]}>
      <Text style={[styles.title, themed.title]}>{t("errorBoundary.title")}</Text>
      <Text style={[styles.message, themed.message]}>{t("errorBoundary.message")}</Text>
      <TouchableOpacity
        style={[styles.button, themed.button]}
        onPress={resetError}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, themed.buttonText]}>{t("errorBoundary.retry")}</Text>
      </TouchableOpacity>
    </View>
  );
};

export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Sentry.ErrorBoundary
    fallback={({ resetError }) => <ErrorFallback resetError={resetError} />}
  >
    {children}
  </Sentry.ErrorBoundary>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
});
