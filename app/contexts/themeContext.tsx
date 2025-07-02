import React, { createContext, useState, useContext } from "react";
import { lightTheme, darkTheme } from "./colorTheme";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);

  const toggleTheme = () => {
    setTheme((prev) => (prev.mode === "light" ? darkTheme : lightTheme));
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);



