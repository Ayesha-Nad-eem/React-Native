import { Slot } from "expo-router";
import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import CarsProvider from "./contexts/CarsContext";
import "./global.css";

export default function RootLayout() {
  const publishableKey =
    (Constants?.expoConfig?.extra as any)?.STRIPE_PUBLISHABLE_KEY || "";

  return (
    <StripeProvider publishableKey={publishableKey}>
      <CarsProvider>
        <Slot />
      </CarsProvider>
    </StripeProvider>
  );
}
