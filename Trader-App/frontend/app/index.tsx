import { useState } from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Trader() {
 

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text>Trader Screen</Text>
      <TextInput className="border border-gray-300 rounded p-2 w-3/4" placeholder="Search" />
      <TouchableOpacity className="bg-blue-500 rounded p-2 mt-2 w-1/5">
        <Text className="text-white text-center">Buy</Text>
      </TouchableOpacity>
      <TouchableOpacity className="bg-red-500 rounded p-2 mt-2 w-1/5">
        <Text className="text-white text-center">Sell</Text>
      </TouchableOpacity>
    </View>
  );
}
