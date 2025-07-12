import { Text, View } from "react-native";
import LittleLemonHeader from "./LittleLemonHeader";
import Welcome from "./Welcome";
import Footer from "./footer";
export default function App() {
  return (
    <View className="header">
      <LittleLemonHeader />
      <Welcome />
      <Footer />
    </View>
  );
}