import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useCars } from '../contexts/CarsContext';

// Backend API URL - adjust this to your backend server
const API_URL = (Constants?.expoConfig?.extra as any)?.API_URL || 'http://192.168.1.100:3000';

type LatLng = { latitude: number; longitude: number };

export default function UserTab() {
  const { calculateFares } = useCars();

  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [hours, setHours] = useState('1');
  const [fetching, setFetching] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[] | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<LatLng | null>(null);
  const [fares, setFares] = useState<{ carId: string; fare: number; breakdown: any; car: any }[]>([]);
  const [showFaresModal, setShowFaresModal] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const resetBookingForm = useCallback(() => {
    setCustomerName('');
    setCustomerPhone('');
    setFromText('');
    setToText('');
    setHours('1');
    setDistanceKm(null);
    setDurationMin(null);
    setRouteCoords(null);
    setPickupCoords(null);
    setDropoffCoords(null);
    setFares([]);
    setSelectedCarId(null);
    setIsProcessingPayment(false);
  }, []);

  const verifyPayment = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/payment/verify-payment/${sessionId}`);
      const data = await response.json();

      if (data.status === 'paid') {
        Alert.alert(
          'Booking Confirmed! 🎉',
          `Payment of $${data.amountTotal} received successfully.\n\nWe will contact you at ${data.metadata?.customerPhone || customerPhone} with driver details.`
        );
        setShowFaresModal(false);
        resetBookingForm();
      } else {
        Alert.alert('Payment Pending', 'Your payment is still being processed. Please wait.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      Alert.alert('Booking Confirmed! 🎉', 'Your payment was successful. We will contact you shortly.');
      setShowFaresModal(false);
      resetBookingForm();
    }
  }, [customerPhone, resetBookingForm]);

  // Handle deep link for payment success/cancel
  useEffect(() => {
    const handleUrl = async (event: { url: string }) => {
      const { url } = event;
      if (url.includes('payment-success')) {
        // Extract session_id from URL if needed
        const sessionId = url.match(/session_id=([^&]+)/)?.[1];
        if (sessionId) {
          await verifyPayment(sessionId);
        } else {
          Alert.alert('Booking Confirmed! 🎉', 'Your payment was successful. We will contact you shortly with driver details.');
          setShowFaresModal(false);
          resetBookingForm();
        }
      } else if (url.includes('payment-cancel')) {
        Alert.alert('Payment Cancelled', 'Your booking was not completed. Please try again.');
        setIsProcessingPayment(false);
      }
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => {
      subscription.remove();
    };
  }, [verifyPayment, resetBookingForm]);

  const handleConfirmBooking = async () => {
    if (!selectedCarId) {
      Alert.alert('Select a car', 'Please choose a vehicle to book.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Missing details', 'Please enter your name and phone.');
      return;
    }

    const chosen = fares.find(f => f.carId === selectedCarId);
    if (!chosen) {
      Alert.alert('Error', 'Selected car not found.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Create app deep links for success/cancel
      const successUrl = Linking.createURL('payment-success');
      const cancelUrl = Linking.createURL('payment-cancel');

      // Call backend to create Stripe checkout session
      const response = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: chosen.fare,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          carModel: chosen.car.modelName,
          distanceKm,
          durationMin,
          pickup: pickupCoords,
          dropoff: dropoffCoords,
          successUrl,
          cancelUrl,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        // Open Stripe checkout in browser
        const result = await WebBrowser.openBrowserAsync(data.url, {
          dismissButtonStyle: 'cancel',
          showTitle: true,
          toolbarColor: '#2563eb',
        });

        // Handle browser close
        if (result.type === 'cancel' || result.type === 'dismiss') {
          // User closed the browser, check if payment was completed
          // The deep link handler will take care of successful payments
          setIsProcessingPayment(false);
        }
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Payment Error', error.message || 'Unable to process payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  async function parseInputToCoords(input: string): Promise<LatLng | null> {
    const t = input.trim();
    if (!t) return null;
    const parts = t.split(',').map((s) => s.trim());
    if (parts.length === 2) {
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      if (!Number.isNaN(a) && !Number.isNaN(b)) return { latitude: a, longitude: b };
    }

    // First try expo-location geocoding. If it fails (e.g., permission denied on some platforms)
    // fall back to Google's Geocoding API using the app's API key from expo.extra
    try {
      const geocoded = await Location.geocodeAsync(t);
      if (geocoded && geocoded.length > 0) return { latitude: geocoded[0].latitude, longitude: geocoded[0].longitude };
    } catch (err: any) {
      console.warn('Expo geocode failed, falling back to Google Geocoding:', err?.message || err);
      // continue to Google fallback
    }

    try {
      const apiKey = (Constants?.expoConfig?.extra as any)?.GOOGLE_MAPS_API_KEY || (Constants?.manifest?.extra as any)?.GOOGLE_MAPS_API_KEY || '';
      if (!apiKey) return null;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(t)}&key=${apiKey}`;
      const res = await fetch(url);
      const j = await res.json();
      if (j.status === 'OK' && j.results && j.results.length > 0) {
        const loc = j.results[0].geometry.location;
        return { latitude: loc.lat, longitude: loc.lng };
      }
      console.warn('Google geocode returned no results for:', t, j.status, j.error_message);
    } catch (err) {
      console.warn('Google geocode failed', err);
    }
    return null;
  }

  async function onCalculate() {
    if (fetching) return;
    setFares([]);
    setDistanceKm(null);
    setDurationMin(null);

    try {
      setFetching(true);
      const fromCoords = await parseInputToCoords(fromText);
      const toCoords = await parseInputToCoords(toText);
      if (!fromCoords || !toCoords) {
        Alert.alert('Invalid Input', 'Please enter valid From and To locations (address or lat,lon).');
        return;
      }
      // Use Google Directions API instead of OSRM.
      const apiKey = (Constants?.expoConfig?.extra as any)?.GOOGLE_MAPS_API_KEY || (Constants?.manifest?.extra as any)?.GOOGLE_MAPS_API_KEY || '';
      if (!apiKey) throw new Error('Google Maps API key not found. Please set GOOGLE_MAPS_API_KEY in .env and restart the app.');

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromCoords.latitude},${fromCoords.longitude}&destination=${toCoords.latitude},${toCoords.longitude}&key=${apiKey}&mode=driving`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status !== 'OK' || !json.routes || json.routes.length === 0) {
        console.warn('Google Directions response', json);
        throw new Error(json.error_message || 'No route found via Google Directions');
      }

      const route = json.routes[0];
      // distance and duration are per-leg; sum legs for full route
      const leg = route.legs && route.legs.length > 0 ? route.legs[0] : null;
      const meters: number = (leg && leg.distance && leg.distance.value) || 0;
      const seconds: number = (leg && leg.duration && leg.duration.value) || 0;
      const encoded = route.overview_polyline?.points || '';
      const coords = encoded ? decodePolyline(encoded) : [];
      setRouteCoords(coords.length > 0 ? coords : null);
      setPickupCoords(fromCoords);
      setDropoffCoords(toCoords);

      const km = Number((meters / 1000).toFixed(2));
      const mins = Math.round(seconds / 60);
      setDistanceKm(km);
      setDurationMin(mins);

      if (mapRef.current && coords && coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 80, bottom: 200, left: 40, right: 40 }, animated: true });
      }

      const hrs = Math.max(0, Number(hours) || 0);
      // calculateFares is async now and may call TollGuru if coords are present
      const faresRes = await calculateFares({ distanceKm: km, durationMin: mins, hours: hrs, pickup: fromCoords, dropoff: toCoords, encodedPolyline: encoded });
      // map to simple shape for list
      const mapped = faresRes.map((f) => ({ carId: f.car.id, fare: f.fare, breakdown: f.breakdown, car: f.car }));
      // If TollGuru returned an opaque error like {"message":null}, show a friendly alert suggesting to verify the key
      const firstRaw = (mapped[0]?.breakdown as any)?.rawTollResponse;
      let opaqueMessageNull = false;
      if (firstRaw) {
        if (typeof firstRaw === 'string' && firstRaw.includes('"message":null')) opaqueMessageNull = true;
        else if (typeof firstRaw === 'object' && Object.prototype.hasOwnProperty.call(firstRaw, 'message') && firstRaw.message === null) opaqueMessageNull = true;
      }
      if (opaqueMessageNull) {
        Alert.alert('Toll estimation unavailable', 'TollGuru returned an opaque error. Please verify your TOLLGURU_KEY in `.env` or your EAS secrets and restart the app.');
      }
      setFares(mapped);
      // show modal form with fares
      setSelectedCarId(mapped.length > 0 ? mapped[0].carId : null);
      setShowFaresModal(true);
    } catch (err: any) {
      console.error('Route error', err);
      Alert.alert('Error', err?.message || 'Unable to calculate route');
    } finally {
      setFetching(false);
    }
  }

  // request and set current location on mount so we can center the map
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentLocation(c);
        // center map initially
        if (mapRef.current) {
          mapRef.current.animateToRegion({ ...c, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);
        }
      } catch (e) {
        console.warn('Failed to fetch current location', e);
      }
    })();
  }, []);

  // Polyline decoder for Google encoded polylines
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
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return coords;
  }

  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-xl font-bold mb-3 text-gray-800">Book a Chauffeur</Text>

      <View style={{ height: 260, marginBottom: 12 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
          provider={PROVIDER_GOOGLE}
          initialRegion={currentLocation ? { ...currentLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 } : { latitude: 24.8607, longitude: 67.0011, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
        >
          {currentLocation && <Marker coordinate={currentLocation} title="You" pinColor="#34d399" />}
          {pickupCoords && <Marker coordinate={pickupCoords} title="Pickup" pinColor="#2563eb" />}
          {dropoffCoords && <Marker coordinate={dropoffCoords} title="Dropoff" pinColor="#ef4444" />}
          {routeCoords && routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#2563eb" />
          )}
        </MapView>
      </View>

      <View className="mb-4 bg-gray-50 p-3 rounded-lg">
        <Text className="font-semibold text-gray-700">Pickup</Text>
        <TextInput value={fromText} onChangeText={setFromText} placeholder="Address or lat, lon" className="border border-gray-200 rounded-md px-3 py-2 mb-2" />

        <Text className="font-semibold text-gray-700">Dropoff</Text>
        <TextInput value={toText} onChangeText={setToText} placeholder="Address or lat, lon" className="border border-gray-200 rounded-md px-3 py-2 mb-2" />

        <Text className="font-semibold text-gray-700">Hours needed</Text>
        <TextInput value={hours} onChangeText={setHours} keyboardType="numeric" placeholder="e.g. 2" className="border border-gray-200 rounded-md px-3 py-2 mb-3" />

        <Pressable onPress={onCalculate} disabled={fetching} className={`py-3 rounded-xl ${fetching ? 'bg-gray-400' : 'bg-blue-600'}`}>
          <Text className="text-white text-center font-semibold">{fetching ? 'Calculating...' : 'Show Fares'}</Text>
        </Pressable>

        {distanceKm !== null && durationMin !== null ? (
          <Text className="mt-3 text-center text-gray-800 font-semibold">🚗 {distanceKm} km • ⏱ {durationMin} min</Text>
        ) : null}
      </View>

      <Modal visible={showFaresModal} animationType="slide" onRequestClose={() => setShowFaresModal(false)}>
        <View className="flex-1 bg-white p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-bold">Select a Vehicle</Text>
            <TouchableOpacity onPress={() => setShowFaresModal(false)}>
              <Text className="text-blue-600">Close</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-gray-600 mb-2">Distance: {distanceKm ?? '-'} km • Duration: {durationMin ?? '-'} min</Text>
          {fares && fares.length > 0 && typeof fares[0].breakdown?.tollFare === 'number' ? (
            <Text className="text-sm text-gray-700 mb-3">Estimated route tolls: ${fares[0].breakdown.tollFare}</Text>
          ) : null}
          {/* Removed toll API debug display for production builds */}

          <FlatList
            data={fares}
            keyExtractor={(i) => i.carId}
            renderItem={({ item }) => {
              const selected = selectedCarId === item.carId;
              return (
                <TouchableOpacity onPress={() => setSelectedCarId(item.carId)} className={`p-3 rounded-lg mb-3 ${selected ? 'border-2 border-blue-600 bg-blue-50' : 'border border-gray-100 bg-gray-50'}`}>
                  {item.car.imageUri ? (
                    <Image source={{ uri: item.car.imageUri }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
                  ) : null}
                  <Text className="font-bold mb-1">{item.car.modelName} ({item.car.modelYear})</Text>
                  <Text className="text-gray-700">Capacity: {item.car.capacity} people</Text>
                  <Text className="text-gray-700">Luggage: {item.car.luggageSpace} bags</Text>
                  <View className="mt-2">
                    <Text className="text-sm text-gray-600">Hour charge: ${item.breakdown?.hourFare?.toFixed ? item.breakdown.hourFare.toFixed(2) : (item.breakdown?.hourFare ?? '0.00')}</Text>
                    <Text className="text-sm text-gray-600">Distance charge: ${item.breakdown?.distanceFare?.toFixed ? item.breakdown.distanceFare.toFixed(2) : (item.breakdown?.distanceFare ?? '0.00')}</Text>
                    <Text className="text-sm text-gray-600">Tolls: ${item.breakdown?.tollFare?.toFixed ? item.breakdown.tollFare.toFixed(2) : (item.breakdown?.tollFare ?? '0.00')}</Text>
                    <Text className="mt-1 font-semibold text-gray-800">Total Estimated Fare: ${item.fare}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text className="text-center mt-4 text-gray-500">No cars available yet.</Text>}
          />

          <View className="mt-3">
            <Text className="font-semibold mb-1">Your name</Text>
            <TextInput value={customerName} onChangeText={setCustomerName} placeholder="Full name" className="border border-gray-200 rounded-md px-3 py-2 mb-2" />
            <Text className="font-semibold mb-1">Phone</Text>
            <TextInput value={customerPhone} onChangeText={setCustomerPhone} placeholder="Phone number" keyboardType="phone-pad" className="border border-gray-200 rounded-md px-3 py-2 mb-3" />

            <Pressable
              onPress={handleConfirmBooking}
              disabled={isProcessingPayment}
              className={`py-3 rounded-xl ${isProcessingPayment ? 'bg-gray-400' : 'bg-green-600'}`}
            >
              {isProcessingPayment ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white text-center font-semibold ml-2">Processing...</Text>
                </View>
              ) : (
                <Text className="text-white text-center font-semibold">Pay & Confirm Booking</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
