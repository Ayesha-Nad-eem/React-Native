import { View, Text } from "react-native";

export default function LittleLemonHeader() {
    return (
        <View className="lemon-header">
            <Text className="lemon-header-text">
               Welcome to
               <Text className="font-bold"> Little Lemon</Text> {' '}
            </Text>
        </View>
    )
}
