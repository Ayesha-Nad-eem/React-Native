import { useEffect, useState } from 'react';
import { Alert, View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';

const API_URL = (Constants?.expoConfig?.extra as any)?.API_URL || 'http://192.168.0.101:3000';

export default function PaymentSuccessScreen() {
  const { session_id } = useLocalSearchParams<{ session_id?: string }>();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    async function run() {
      try {
        if (session_id) {
          const res = await fetch(`${API_URL}/api/payment/verify-payment/${session_id}`);
          const data = await res.json();

          if (data?.status === 'paid') {
            Alert.alert(
              'Booking Confirmed! 🎉',
              `Payment of $${data.amountTotal} received successfully.\n\nWe'll contact you at ${data.metadata?.customerPhone ?? data.customerEmail ?? ''}.`,
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(tabs)/user'),
                },
              ]
            );
          } else {
            Alert.alert(
              'Payment Pending',
              'Payment is still being processed. Please wait a moment and check again.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(tabs)/user'),
                },
              ]
            );
          }
        } else {
          Alert.alert(
            'Booking Confirmed! 🎉',
            'Your payment was successful.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(tabs)/user'),
              },
            ]
          );
        }
      } catch (e) {
        console.error('verify-payment error', e);
        Alert.alert(
          'Booking Confirmed! 🎉',
          'Your payment was successful. We will contact you shortly.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)/user'),
            },
          ]
        );
      } finally {
        setVerifying(false);
      }
    }
    run();
  }, [session_id]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {verifying && <ActivityIndicator size="large" />}
    </View>
  );
}
