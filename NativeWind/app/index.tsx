import { Text, View } from "react-native";
import LittleLemonHeader from "./LittleLemonHeader";
import Footer from "./Footer";
import Welcome from "./Welcome";
import MenuItems from "./menuItems";

export default function App() {
  return (
    <View className="header">
      <LittleLemonHeader />
      <Welcome />
      {/* <MenuItems /> */}
      <Footer />
    </View>
  );
}