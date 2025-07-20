import { Link } from "expo-router";
import { Text, View } from "react-native";
import LittleLemonHeader from "./LittleLemonHeader";
import Welcome from "./Welcome";
import Footer from "./footer";
import Login from "./login";
import Register from "./register";

export default function App() {
  return (
    // <View className="header">
    //   <LittleLemonHeader />
    //   <Welcome />
    //   {/* <Menu /> */}
    //   {/* <LoginScreen /> */}
    //   <Footer />
    //   {/* <FeedbackForm /> */}
    // </View>

    <View className="header">
      {/* <Login /> */}
      <Register />
    </View>
  );
}