import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

type LatLng = { latitude: number; longitude: number };
const KEYBOARD_VERTICAL_OFFSET = Platform.OS === "ios" ? 100 : 80;

const LocationScreen: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [routeCoords, setRouteCoords] = useState<LatLng[] | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [fetching, setFetching] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const fetchCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      setFromText(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching location:", err);
      Alert.alert("Error", "Unable to fetch location. Please try again.");
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCurrentLocation();
    }, [])
  );

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates?.height || KEYBOARD_VERTICAL_OFFSET);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  async function parseInputToCoords(input: string): Promise<LatLng | null> {
    const t = input.trim();
    if (!t) return null;
    const parts = t.split(",").map((s) => s.trim());
    if (parts.length === 2) {
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      if (!Number.isNaN(a) && !Number.isNaN(b))
        return { latitude: a, longitude: b };
    }

    try {
      const geocoded = await Location.geocodeAsync(t);
      if (geocoded && geocoded.length > 0)
        return {
          latitude: geocoded[0].latitude,
          longitude: geocoded[0].longitude,
        };
    } catch (err) {
      console.warn("Geocode failed", err);
    }

    return null;
  }

  async function onDone() {
    Keyboard.dismiss();
    if (fetching) return;
    setRouteCoords(null);
    setDistanceKm(null);

    const fromCoords = fromText.trim()
      ? await parseInputToCoords(fromText)
      : currentLocation;
    const toCoords = await parseInputToCoords(toText);

    if (!fromCoords || !toCoords) {
      Alert.alert("Invalid Input", "Please enter valid From and To locations.");
      return;
    }

    try {
      setFetching(true);
      const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords.longitude},${fromCoords.latitude};${toCoords.longitude},${toCoords.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.routes || json.routes.length === 0) throw new Error("No route found");

      const geom: number[][] = json.routes[0].geometry.coordinates;
      const coords: LatLng[] = geom.map(([lon, lat]) => ({
        latitude: lat,
        longitude: lon,
      }));

      setRouteCoords(coords);
      const meters: number = json.routes[0].distance || 0;
      setDistanceKm(Number((meters / 1000).toFixed(2)));

      if (mapRef.current && coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, bottom: 220, left: 40, right: 40 },
          animated: true,
        });
      }
    } catch (err: any) {
      console.error("Route error", err);
      Alert.alert("Route Error", err?.message || "Unable to fetch route");
    } finally {
      setFetching(false);
    }
  }

  if (loading || !currentLocation) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-3 text-gray-700">Fetching current location...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-gray-50" behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET} >
      <View className="flex-1">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          <Marker coordinate={currentLocation} title="Current Location" />
          {routeCoords && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={4}
              strokeColor="#2563eb"
            />
          )}
        </MapView>

        {/* Input Card */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
          style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 24 + keyboardHeight,
            }}
        >
          <View className="m-4 bg-white p-4 rounded-2xl shadow-lg">
            <View className="flex-row items-center mb-3">
              <Text className="w-14 font-semibold text-gray-700">From:</Text>
              <TextInput
                className="flex-1 border border-gray-300 rounded-xl px-3 h-11"
                value={fromText}
                onChangeText={setFromText}
                placeholder="Address or lat, lon"
              />
            </View>

            <View className="flex-row items-center mb-3">
              <Text className="w-14 font-semibold text-gray-700">To:</Text>
              <TextInput
                className="flex-1 border border-gray-300 rounded-xl px-3 h-11"
                value={toText}
                onChangeText={setToText}
                placeholder="Address or lat, lon"
              />
            </View>

            <Pressable
              className={`mt-2 py-3 rounded-xl ${
                fetching ? "bg-gray-400" : "bg-blue-600"
              }`}
              onPress={onDone}
              disabled={fetching}
            >
              <Text className="text-white font-semibold text-center">
                {fetching ? "Loading..." : "Done"}
              </Text>
            </Pressable>

            {distanceKm !== null && (
              <Text className="mt-3 text-center text-gray-800 font-semibold">
                🚗 Total Distance: {distanceKm} km
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LocationScreen;
