import React, { createContext, useContext, useState, ReactNode } from "react";

type Theme = {
  isDark: boolean;
  colors: {
    background: string;
    text: string;
    button: string;
  };
  toggleTheme: () => void;
};

const ThemeContext = createContext<Theme | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const theme: Theme = {
    isDark,
    colors: {
      background: isDark ? "#121212" : "#ffffff",
      text: isDark ? "#ffffff" : "#121212",
      button: isDark ? "#333333" : "#dddddd",
    },
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

// custom hook for easier use
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
};
