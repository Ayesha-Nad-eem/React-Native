import { useEffect } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';

export default function PaymentCancelScreen() {
  useEffect(() => {
    Alert.alert(
      'Payment Cancelled',
      'Your booking was not completed. Please try again.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/user'),
        },
      ]
    );
  }, []);

  return <View style={{ flex: 1 }} />;
}
