import { useAuth } from "@clerk/clerk-expo";
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from "react";
import { Stack } from "expo-router";


export default function InitialLayout() {
    const { isLoaded, isSignedIn } = useAuth();

    const segments = useSegments();
    const router = useRouter();
    useEffect(() => {
        if (!isLoaded) return;

        const authScreens = ["login"];
        const isAuthScreen = segments.some(seg => authScreens.includes(seg));


        if (!isSignedIn && !isAuthScreen)
            router.replace("/(auth)/login");
        else if (isSignedIn && isAuthScreen)
            router.replace("/(tabs)");

    }, [isLoaded, isSignedIn, segments])


    if (!isLoaded) return null;

    return null;
}
