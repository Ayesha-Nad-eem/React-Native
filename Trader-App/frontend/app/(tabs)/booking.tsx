import Constants from "expo-constants";
import * as Location from "expo-location";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useCars } from "../contexts/CarsContext";
import { useBookings } from "../contexts/BookingsContext";

const API_URL =
  (Constants?.expoConfig?.extra as any)?.API_URL || "http://192.168.0.101:3000";

type LatLng = { latitude: number; longitude: number };

export default function BookingTab() {
  const { cars, calculateFares } = useCars();
  const { addBooking } = useBookings();

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Trip Details
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [hours, setHours] = useState("1");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [transferType, setTransferType] = useState("one-way");
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Step 2: Vehicle Selection
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [calculatedFares, setCalculatedFares] = useState<any[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);

  // Step 3: Customer Info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Map & Route
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[] | null>(null);
  const mapRef = useRef<MapView | null>(null);

  // Loading states
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Invoice modal
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Parse input to coordinates
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
    } catch (err: any) {
      console.warn("Expo geocode failed, trying Google", err?.message);
    }

    try {
      const apiKey =
        (Constants?.expoConfig?.extra as any)?.GOOGLE_MAPS_API_KEY || "";
      if (!apiKey) return null;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(t)}&key=${apiKey}`;
      const res = await fetch(url);
      const j = await res.json();
      if (j.status === "OK" && j.results && j.results.length > 0) {
        const loc = j.results[0].geometry.location;
        return { latitude: loc.lat, longitude: loc.lng };
      }
    } catch (err) {
      console.warn("Google geocode failed", err);
    }
    return null;
  }

  // Decode polyline
  function decodePolyline(encoded: string): LatLng[] {
    const coords: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b = 0;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return coords;
  }

  // Step 1 -> Step 2: Calculate route and fares
  const handleStep1Next = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      Alert.alert("Missing Details", "Please enter pickup and dropoff locations.");
      return;
    }
    if (!time.trim()) {
      Alert.alert("Missing Details", "Please enter pickup time.");
      return;
    }
    if (Number(passengers) < 1) {
      Alert.alert("Invalid Input", "Passengers must be at least 1.");
      return;
    }

    setIsCalculating(true);
    try {
      const fromCoords = await parseInputToCoords(pickup);
      const toCoords = await parseInputToCoords(dropoff);

      if (!fromCoords || !toCoords) {
        Alert.alert("Invalid Locations", "Unable to geocode pickup or dropoff.");
        setIsCalculating(false);
        return;
      }

      // Get route from Google Directions API
      const apiKey =
        (Constants?.expoConfig?.extra as any)?.GOOGLE_MAPS_API_KEY || "";
      if (!apiKey) {
        Alert.alert("Error", "Google Maps API key missing.");
        setIsCalculating(false);
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromCoords.latitude},${fromCoords.longitude}&destination=${toCoords.latitude},${toCoords.longitude}&key=${apiKey}&mode=driving`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.status !== "OK" || !json.routes || json.routes.length === 0) {
        Alert.alert("Route Error", "No route found.");
        setIsCalculating(false);
        return;
      }

      const route = json.routes[0];
      const leg = route.legs && route.legs.length > 0 ? route.legs[0] : null;
      const meters: number = (leg && leg.distance && leg.distance.value) || 0;
      const seconds: number = (leg && leg.duration && leg.duration.value) || 0;
      const encoded = route.overview_polyline?.points || "";
      const coords = encoded ? decodePolyline(encoded) : [];

      const km = Number((meters / 1000).toFixed(2));
      const mins = Math.round(seconds / 60);

      setDistanceKm(km);
      setDurationMin(mins);
      setPickupCoords(fromCoords);
      setDropoffCoords(toCoords);
      setRouteCoords(coords.length > 0 ? coords : null);

      if (mapRef.current && coords && coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 60, bottom: 60, left: 40, right: 40 },
          animated: true,
        });
      }

      // Calculate fares
      const hrs = Math.max(0, Number(hours) || 0);
      const faresRes = await calculateFares({
        distanceKm: km,
        durationMin: mins,
        hours: hrs,
        pickup: fromCoords,
        dropoff: toCoords,
        encodedPolyline: encoded,
      });

      const mapped = faresRes.map((f) => ({
        carId: f.car.id,
        fare: f.fare,
        breakdown: f.breakdown,
        car: f.car,
      }));

      setCalculatedFares(mapped);
      setSelectedVehicleId(mapped.length > 0 ? mapped[0].carId : null);
      setCurrentStep(2);
    } catch (err: any) {
      console.error("Route calculation error:", err);
      Alert.alert("Error", err?.message || "Failed to calculate route.");
    } finally {
      setIsCalculating(false);
    }
  };

  // Step 2 -> Step 3
  const handleStep2Next = () => {
    if (!selectedVehicleId) {
      Alert.alert("Select Vehicle", "Please choose a vehicle.");
      return;
    }
    setCurrentStep(3);
  };

  // Step 3 -> Step 4 (Review)
  const handleStep3Next = () => {
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      Alert.alert("Missing Details", "Please fill in all customer details.");
      return;
    }
    setCurrentStep(4);
  };

  // Step 4: Confirm and Create Booking
  const handleConfirmBooking = async () => {
    const selectedFare = calculatedFares.find((f) => f.carId === selectedVehicleId);
    if (!selectedFare) {
      Alert.alert("Error", "No vehicle selected.");
      return;
    }

    setIsCreatingBooking(true);
    try {
      // Save booking locally using BookingsContext
      const newBooking = await addBooking({
        pickup,
        dropoff,
        hours: Number(hours),
        date: date,
        time,
        passengers: Number(passengers),
        transferType: transferType as "one-way" | "two-way",
        vehicleId: selectedFare.car.id,
        vehicleName: selectedFare.car.modelName,
        vehicleRate: selectedFare.car.perHourRate,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        distanceKm: distanceKm || 0,
        durationMin: durationMin || 0,
        baseFare: selectedFare.breakdown.hourFare + selectedFare.breakdown.distanceFare,
        totalFare: selectedFare.fare,
      });

      // Prepare invoice data for email
      const invoiceData = {
        bookingId: newBooking.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        pickup,
        dropoff,
        date: date.toLocaleDateString(),
        time,
        passengers: Number(passengers),
        transferType,
        hours: Number(hours),
        vehicleName: selectedFare.car.modelName,
        distanceKm: distanceKm || 0,
        durationMin: durationMin || 0,
        baseFare: selectedFare.breakdown.hourFare + selectedFare.breakdown.distanceFare,
        totalFare: selectedFare.fare,
      };

      let emailSent = false;

      // Try to send invoice email (optional - won't fail if backend is down)
      try {
        const invoiceRes = await fetch(`${API_URL}/api/booking/send-invoice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoiceData),
        });

        if (invoiceRes.ok) {
          const invoiceResData = await invoiceRes.json();
          console.log("✅ Invoice email sent successfully:", invoiceResData.emailMessageId);
          emailSent = true;
        } else {
          const errorData = await invoiceRes.json().catch(() => ({}));
          console.log("ℹ️  Email not sent - backend response:", invoiceRes.status, errorData);
        }
      } catch (emailErr: any) {
        console.log("ℹ️  Email service error:", emailErr?.message || emailErr);
      }

      setInvoiceData(invoiceData);
      setShowInvoice(true);

      Alert.alert(
        "Booking Created! 🎉",
        `Booking confirmed for ${customerName}.\n\nBooking ID: ${newBooking.id}\n${emailSent ? `\n✅ Invoice sent to ${customerEmail}` : `\nℹ️  Booking saved locally.`}`
      );
    } catch (err: any) {
      console.error("Booking creation error:", err);
      Alert.alert("Error", err?.message || "Failed to create booking.");
    } finally {
      setIsCreatingBooking(false);
    }
  };

  // Reset form
  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setPickup("");
    setDropoff("");
    setHours("1");
    setDate(new Date());
    setTime("");
    setPassengers("1");
    setTransferType("one-way");
    setSelectedVehicleId(null);
    setCalculatedFares([]);
    setDistanceKm(null);
    setDurationMin(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPickupCoords(null);
    setDropoffCoords(null);
    setRouteCoords(null);
    setShowInvoice(false);
    setInvoiceData(null);
  }, []);

  const selectedFare = calculatedFares.find((f) => f.carId === selectedVehicleId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView 
        className="flex-1 p-4" 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text className="text-2xl font-bold mb-2 text-gray-800">
          Create Booking
        </Text>
        <Text className="text-sm text-gray-600 mb-4">
          Admin - Create booking for any user
        </Text>

        {/* Step Indicator */}
        <View className="flex-row mb-4">
          {[1, 2, 3, 4].map((step) => (
            <View key={step} className="flex-1 flex-row items-center">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  currentStep >= step ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <Text className="text-white font-semibold">{step}</Text>
              </View>
              {step < 4 && (
                <View
                  className={`flex-1 h-1 ${
                    currentStep > step ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </View>
          ))}
        </View>

        <Text className="text-sm text-gray-700 mb-3">
          {currentStep === 1 && "Step 1: Trip Details"}
          {currentStep === 2 && "Step 2: Select Vehicle"}
          {currentStep === 3 && "Step 3: Customer Information"}
          {currentStep === 4 && "Step 4: Review & Confirm"}
        </Text>

        {/* STEP 1: Trip Details */}
        {currentStep === 1 && (
          <View>
            {/* Map */}
            <View style={{ height: 200, marginBottom: 12 }}>
              <MapView
                ref={mapRef}
                style={{ flex: 1, borderRadius: 12 }}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: 24.8607,
                  longitude: 67.0011,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
              >
                {pickupCoords && (
                  <Marker coordinate={pickupCoords} title="Pickup" pinColor="#2563eb" />
                )}
                {dropoffCoords && (
                  <Marker coordinate={dropoffCoords} title="Dropoff" pinColor="#ef4444" />
                )}
                {routeCoords && routeCoords.length > 0 && (
                  <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#2563eb" />
                )}
              </MapView>
            </View>

            <Text className="font-semibold text-gray-700 mb-1">Pickup Location</Text>
            <TextInput
              value={pickup}
              onChangeText={setPickup}
              placeholder="Address or lat, lon"
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />

            <Text className="font-semibold text-gray-700 mb-1">Dropoff Location</Text>
            <TextInput
              value={dropoff}
              onChangeText={setDropoff}
              placeholder="Address or lat, lon"
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />

            <Text className="font-semibold text-gray-700 mb-1">Hours Needed</Text>
            <TextInput
              value={hours}
              onChangeText={setHours}
              keyboardType="numeric"
              placeholder="e.g., 2"
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />

            <Text className="font-semibold text-gray-700 mb-1">Date</Text>
            <TextInput
              value={date.toLocaleDateString()}
              onChangeText={(text) => {
                // Simple text-based date input
                const parsed = new Date(text);
                if (!isNaN(parsed.getTime())) {
                  setDate(parsed);
                }
              }}
              placeholder="MM/DD/YYYY"
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />
            <Text className="font-semibold text-gray-700 mb-1">Time</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="e.g., 10:00 AM"
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />

            <Text className="font-semibold text-gray-700 mb-1">Passengers</Text>
            <TextInput
              value={passengers}
              onChangeText={setPassengers}
              keyboardType="numeric"
              placeholder="Number of passengers"
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />

            <Text className="font-semibold text-gray-700 mb-1">Transfer Type</Text>
            <View className="flex-row mb-4">
              <Pressable
                onPress={() => setTransferType("one-way")}
                className={`flex-1 py-2 rounded-l-md border ${
                  transferType === "one-way"
                    ? "bg-blue-600 border-blue-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    transferType === "one-way" ? "text-white" : "text-gray-700"
                  }`}
                >
                  One Way
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTransferType("two-way")}
                className={`flex-1 py-2 rounded-r-md border ${
                  transferType === "two-way"
                    ? "bg-blue-600 border-blue-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    transferType === "two-way" ? "text-white" : "text-gray-700"
                  }`}
                >
                  Two Way
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleStep1Next}
              disabled={isCalculating}
              className={`py-3 rounded-xl ${
                isCalculating ? "bg-gray-400" : "bg-blue-600"
              }`}
            >
              <Text className="text-white text-center font-semibold">
                {isCalculating ? "Calculating..." : "Next: Select Vehicle"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* STEP 2: Select Vehicle */}
        {currentStep === 2 && (
          <View>
            <Text className="text-sm text-gray-600 mb-2">
              Distance: {distanceKm ?? "-"} km • Duration: {durationMin ?? "-"} min
            </Text>

            <FlatList
              data={calculatedFares}
              keyExtractor={(item) => item.carId}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const selected = selectedVehicleId === item.carId;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedVehicleId(item.carId)}
                    className={`p-3 rounded-lg mb-3 ${
                      selected
                        ? "border-2 border-blue-600 bg-blue-50"
                        : "border border-gray-200 bg-gray-50"
                    }`}
                  >
                    {item.car.imageUri ? (
                      <Image
                        source={{ uri: item.car.imageUri }}
                        style={{
                          width: "100%",
                          height: 140,
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Text className="font-bold mb-1">
                      {item.car.modelName} ({item.car.modelYear})
                    </Text>
                    <Text className="text-gray-700">
                      Capacity: {item.car.capacity} people • Luggage:{" "}
                      {item.car.luggageSpace} bags
                    </Text>
                    <View className="mt-2">
                      <Text className="text-sm text-gray-600">
                        Hour charge: ${item.breakdown.hourFare.toFixed(2)}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Distance charge: ${item.breakdown.distanceFare.toFixed(2)}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Tolls: ${item.breakdown.tollFare.toFixed(2)}
                      </Text>
                      <Text className="mt-1 font-semibold text-gray-800">
                        Total Fare: ${item.fare}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text className="text-center mt-4 text-gray-500">
                  No vehicles available.
                </Text>
              }
            />

            <View className="flex-row mt-3">
              <Pressable
                onPress={() => setCurrentStep(1)}
                className="flex-1 mr-2 py-3 rounded-xl bg-gray-300"
              >
                <Text className="text-gray-800 text-center font-semibold">Back</Text>
              </Pressable>
              <Pressable
                onPress={handleStep2Next}
                className="flex-1 ml-2 py-3 rounded-xl bg-blue-600"
              >
                <Text className="text-white text-center font-semibold">
                  Next: Customer Info
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 3: Customer Info */}
        {currentStep === 3 && (
          <View>
            <Text className="font-semibold text-gray-700 mb-1">Full Name</Text>
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer full name"
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />

            <Text className="font-semibold text-gray-700 mb-1">Email</Text>
            <TextInput
              value={customerEmail}
              onChangeText={setCustomerEmail}
              placeholder="customer@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />

            <Text className="font-semibold text-gray-700 mb-1">Phone Number</Text>
            <TextInput
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="+1234567890"
              keyboardType="phone-pad"
              className="border border-gray-300 rounded-md px-3 py-2 mb-3"
            />

            <Text className="font-semibold text-gray-700 mb-1">Address</Text>
            <TextInput
              value={customerAddress}
              onChangeText={setCustomerAddress}
              placeholder="Customer address"
              multiline
              numberOfLines={2}
              className="border border-gray-300 rounded-md px-3 py-2 mb-4"
            />

            <View className="flex-row">
              <Pressable
                onPress={() => setCurrentStep(2)}
                className="flex-1 mr-2 py-3 rounded-xl bg-gray-300"
              >
                <Text className="text-gray-800 text-center font-semibold">Back</Text>
              </Pressable>
              <Pressable
                onPress={handleStep3Next}
                className="flex-1 ml-2 py-3 rounded-xl bg-blue-600"
              >
                <Text className="text-white text-center font-semibold">
                  Next: Review
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 4: Review & Confirm */}
        {currentStep === 4 && (
          <View>
            <View className="bg-gray-50 p-4 rounded-lg mb-4">
              <Text className="text-lg font-bold mb-2">Booking Summary</Text>

              <Text className="font-semibold text-gray-700 mt-2">Trip Details</Text>
              <Text className="text-gray-600">Pickup: {pickup}</Text>
              <Text className="text-gray-600">Dropoff: {dropoff}</Text>
              <Text className="text-gray-600">
                Date: {date.toLocaleDateString()} at {time}
              </Text>
              <Text className="text-gray-600">Hours: {hours}</Text>
              <Text className="text-gray-600">Passengers: {passengers}</Text>
              <Text className="text-gray-600">
                Transfer Type: {transferType === "one-way" ? "One Way" : "Two Way"}
              </Text>
              <Text className="text-gray-600">
                Distance: {distanceKm} km • Duration: {durationMin} min
              </Text>

              <Text className="font-semibold text-gray-700 mt-3">Vehicle</Text>
              {selectedFare && (
                <>
                  <Text className="text-gray-600">
                    {selectedFare.car.modelName} ({selectedFare.car.modelYear})
                  </Text>
                  <Text className="text-gray-600">
                    Capacity: {selectedFare.car.capacity} people
                  </Text>
                </>
              )}

              <Text className="font-semibold text-gray-700 mt-3">Customer</Text>
              <Text className="text-gray-600">{customerName}</Text>
              <Text className="text-gray-600">{customerEmail}</Text>
              <Text className="text-gray-600">{customerPhone}</Text>
              <Text className="text-gray-600">{customerAddress}</Text>

              <Text className="font-semibold text-gray-700 mt-3">Fare Breakdown</Text>
              {selectedFare && (
                <>
                  <Text className="text-gray-600">
                    Hour Charge: ${selectedFare.breakdown.hourFare.toFixed(2)}
                  </Text>
                  <Text className="text-gray-600">
                    Distance Charge: ${selectedFare.breakdown.distanceFare.toFixed(2)}
                  </Text>
                  <Text className="text-gray-600">
                    Tolls: ${selectedFare.breakdown.tollFare.toFixed(2)}
                  </Text>
                  <Text className="text-lg font-bold text-gray-800 mt-2">
                    Total: ${selectedFare.fare}
                  </Text>
                </>
              )}
            </View>

            <View className="flex-row">
              <Pressable
                onPress={() => setCurrentStep(3)}
                className="flex-1 mr-2 py-3 rounded-xl bg-gray-300"
              >
                <Text className="text-gray-800 text-center font-semibold">Back</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmBooking}
                disabled={isCreatingBooking}
                className={`flex-1 ml-2 py-3 rounded-xl ${
                  isCreatingBooking ? "bg-gray-400" : "bg-green-600"
                }`}
              >
                <Text className="text-white text-center font-semibold">
                  {isCreatingBooking ? "Creating..." : "Confirm & Send Invoice"}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={resetForm}
              className="mt-3 py-2 rounded-xl bg-red-100"
            >
              <Text className="text-red-700 text-center font-semibold">Cancel</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Invoice Modal */}
      <Modal
        visible={showInvoice}
        animationType="slide"
        onRequestClose={() => {
          setShowInvoice(false);
          resetForm();
        }}
      >
        <View className="flex-1 bg-white p-4">
          <Text className="text-2xl font-bold mb-4">Invoice</Text>
          {invoiceData && (
            <ScrollView>
              <Text className="text-lg font-semibold mb-2">
                Booking ID: {invoiceData.bookingId}
              </Text>
              <Text className="font-semibold text-gray-700 mt-3">Customer</Text>
              <Text className="text-gray-600">{invoiceData.customerName}</Text>
              <Text className="text-gray-600">{invoiceData.customerEmail}</Text>
              <Text className="text-gray-600">{invoiceData.customerPhone}</Text>
              <Text className="text-gray-600">{invoiceData.customerAddress}</Text>

              <Text className="font-semibold text-gray-700 mt-3">Trip Details</Text>
              <Text className="text-gray-600">Pickup: {invoiceData.pickup}</Text>
              <Text className="text-gray-600">Dropoff: {invoiceData.dropoff}</Text>
              <Text className="text-gray-600">
                Date: {invoiceData.date} at {invoiceData.time}
              </Text>
              <Text className="text-gray-600">Hours: {invoiceData.hours}</Text>
              <Text className="text-gray-600">Passengers: {invoiceData.passengers}</Text>
              <Text className="text-gray-600">
                Transfer: {invoiceData.transferType === "one-way" ? "One Way" : "Two Way"}
              </Text>

              <Text className="font-semibold text-gray-700 mt-3">Vehicle</Text>
              <Text className="text-gray-600">{invoiceData.vehicleName}</Text>

              <Text className="font-semibold text-gray-700 mt-3">Fare</Text>
              <Text className="text-gray-600">
                Base Fare: ${invoiceData.baseFare.toFixed(2)}
              </Text>
              <Text className="text-lg font-bold text-gray-800 mt-1">
                Total: ${invoiceData.totalFare.toFixed(2)}
              </Text>

              <Text className="text-sm text-green-600 mt-3">
                ✓ Invoice sent to {invoiceData.customerEmail}
              </Text>
            </ScrollView>
          )}

          <Pressable
            onPress={() => {
              setShowInvoice(false);
              resetForm();
            }}
            className="mt-4 py-3 rounded-xl bg-blue-600"
          >
            <Text className="text-white text-center font-semibold">Done</Text>
          </Pressable>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
