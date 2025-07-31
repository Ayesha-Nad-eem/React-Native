import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot, Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import InitialLayout from '@/components/InitialLayout';
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import {useFonts} from "expo-font";
import { useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf") });


   const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; 
  }

  // update the native navigation bar on Android.
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#000000");
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);


  return (
    <ClerkProvider tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}> 
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} onLayout={onLayoutRootView}>
          <InitialLayout />
          <Slot />
        </SafeAreaView>
      </SafeAreaProvider>
      <StatusBar style="light" />
      </ConvexProviderWithClerk>
    </ClerkProvider>

  );
}
