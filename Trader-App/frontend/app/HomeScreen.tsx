import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 px-6">
      <Text className="text-3xl font-bold text-gray-800 mb-5">
        📊 Live Stocks
      </Text>
      <Text className="text-gray-600 text-center mb-10">
        Stay updated with real-time market prices.
      </Text>

      <TouchableOpacity
        className="bg-blue-600 px-6 py-3 rounded-2xl shadow"
        onPress={() => router.push('/LiveStock')}
      >
        <Text className="text-white text-lg font-semibold">
          Show Live Stocks
        </Text>
      </TouchableOpacity>
    </View>
  );
}
