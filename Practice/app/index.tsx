
import { View, Text, TouchableOpacity } from "react-native";
import { useThemeStore } from "./themeStore";

export default function HomeScreen() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <View
      className={`flex-1 items-center justify-center ${
        isDark ? "bg-black" : "bg-white"
      }`}
    >
      <Text
        className={`text-2xl mb-5 ${isDark ? "text-white" : "text-black"}`}
      >
        {isDark ? "Dark Mode 🌙" : "Light Mode ☀️"}
      </Text>

      <TouchableOpacity
        className={`px-5 py-3 rounded-xl ${
          isDark ? "bg-neutral-800" : "bg-gray-300"
        }`}
        onPress={toggleTheme}
      >
        <Text className={`${isDark ? "text-white" : "text-black"}`}>
          Toggle Theme
        </Text>
      </TouchableOpacity>
    </View>
  );
}
