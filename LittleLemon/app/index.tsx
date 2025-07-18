import { Text, View } from "react-native";
import LittleLemonHeader from "./LittleLemonHeader";
import Welcome from "./Welcome";
import Footer from "./footer";
import Menu from "./menu";
import FeedbackForm from "./feedbackForm";
import LoginScreen from "./loginPage";
export default function App() {
  return (
    <View className="header">
      <LittleLemonHeader />
      <Welcome />
      {/* <Menu /> */}
      {/* <LoginScreen /> */}

      <Footer />
      {/* <FeedbackForm /> */}
    </View>
  );
}