import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme } from "./colorTheme";


type ThemeType = typeof lightTheme;

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  toggleTheme: () => {},
});

/**
 * Pushes the in-app theme choice down to the native layer so OS-rendered UI
 * (keyboard, Alert dialogs, action sheets, date pickers, text selection menus,
 * WebView scrollbars) matches the JS theme. Without this the native chrome
 * stays light while the app renders dark.
 */
const syncNativeAppearance = (mode: ThemeType["mode"]) => {
  Appearance.setColorScheme(mode === "dark" ? "dark" : "light");
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem("appTheme");
      const initialTheme = storedTheme === "dark" ? darkTheme : lightTheme;
      setTheme(initialTheme);
      syncNativeAppearance(initialTheme.mode);
    };
    loadTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme.mode === "light" ? darkTheme : lightTheme;
    setTheme(newTheme);
    syncNativeAppearance(newTheme.mode);
    await AsyncStorage.setItem("appTheme", newTheme.mode);
  }, [theme.mode]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
