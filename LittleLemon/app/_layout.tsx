import { Stack } from "expo-router";
import { View } from "react-native";
import LittleLemonFooter from "./footer";
import "./global.css";
import LittleLemonHeader from "./LittleLemonHeader";

export default function RootLayout() {
  return (
    <View className="flex-1">
      <LittleLemonHeader />
      <Stack screenOptions={{ headerShown: false }} initialRouteName="loginPage">
        <Stack.Screen name="Welcome" />
        <Stack.Screen name="loginPage" />
      </Stack>
      <LittleLemonFooter />
    </View>
  );
}