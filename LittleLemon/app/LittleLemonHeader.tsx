import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

export default function LittleLemonHeader() {
    const navigation = useNavigation();

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        <View className="lemon-header flex-row items-center justify-between px-4 py-2">
            <TouchableOpacity onPress={openDrawer} className="p-2">
                <Ionicons name="menu" size={28} color="#F4CE14" />
            </TouchableOpacity>
            <Text className="lemon-header-text font-bold flex-1 text-center"> Little Lemon</Text>
            <View className="w-8" />
        </View>
    )
}
