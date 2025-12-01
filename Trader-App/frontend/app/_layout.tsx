import { Slot } from "expo-router";
import CarsProvider from "./contexts/CarsContext";
import "./global.css";

export default function RootLayout() {
  return (
    <CarsProvider>
      <Slot />
    </CarsProvider>
  );
}