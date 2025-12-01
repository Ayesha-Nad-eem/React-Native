import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 px-6">
      <Text className="text-3xl font-bold text-gray-800 mb-5 text-center">
        📊 Live Stocks and Location
      </Text>
      <Text className="text-gray-600 text-center mb-10">
        Stay updated with real-time market prices and your location.
      </Text>

      <TouchableOpacity
        className="bg-blue-600 px-6 py-3 rounded-2xl shadow mb-3 w-1/2"
        onPress={() => router.push('/(tabs)/livestock')}
      >
        <Text className="text-white text-lg font-semibold text-center">Live Stocks</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-green-600 px-6 py-3 rounded-2xl shadow w-1/2"
        onPress={() => router.push('/(tabs)/location')}
      >
        <Text className="text-white text-lg font-semibold text-center">Location</Text>
      </TouchableOpacity>
    </View>
  );
}
