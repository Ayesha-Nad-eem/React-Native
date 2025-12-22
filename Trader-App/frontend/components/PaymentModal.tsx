import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  CardField,
  useStripe,
  CardFieldInput,
} from "@stripe/stripe-react-native";
import Constants from "expo-constants";

const API_URL =
  (Constants?.expoConfig?.extra as any)?.API_URL || "http://192.168.0.101:3000";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  bookingDetails: {
    customerName: string;
    customerPhone: string;
    carModel: string;
    distanceKm: number | null;
    durationMin: number | null;
    pickup: { latitude: number; longitude: number } | null;
    dropoff: { latitude: number; longitude: number } | null;
  };
}

export default function PaymentModal({
  visible,
  onClose,
  onSuccess,
  amount,
  bookingDetails,
}: PaymentModalProps) {
  const { confirmPayment } = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(
    null
  );

  const handlePay = async () => {
    if (!cardDetails?.complete) {
      Alert.alert("Invalid Card", "Please enter a valid card number.");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create Payment Intent on backend
      const response = await fetch(
        `${API_URL}/api/payment/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amount,
            customerName: bookingDetails.customerName,
            customerPhone: bookingDetails.customerPhone,
            carModel: bookingDetails.carModel,
            distanceKm: bookingDetails.distanceKm,
            durationMin: bookingDetails.durationMin,
            pickup: bookingDetails.pickup,
            dropoff: bookingDetails.dropoff,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.clientSecret) {
        throw new Error("No client secret received from server");
      }

      // Step 2: Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await confirmPayment(
        data.clientSecret,
        {
          paymentMethodType: "Card",
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === "Succeeded") {
        Alert.alert(
          "Payment Successful! 🎉",
          `Your payment of $${amount.toFixed(2)} has been processed successfully.`,
          [
            {
              text: "OK",
              onPress: () => {
                onSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        throw new Error("Payment was not completed");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      Alert.alert(
        "Payment Failed",
        error.message || "Unable to process payment. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Complete Payment</Text>
              <TouchableOpacity onPress={onClose} disabled={isProcessing}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amount}>${amount.toFixed(2)}</Text>
            </View>

            <View style={styles.bookingInfo}>
              <Text style={styles.infoLabel}>Booking Details</Text>
              <Text style={styles.infoText}>
                {bookingDetails.carModel} • {bookingDetails.distanceKm} km
              </Text>
              <Text style={styles.infoText}>
                Customer: {bookingDetails.customerName}
              </Text>
              <Text style={styles.infoText}>
                Phone: {bookingDetails.customerPhone}
              </Text>
            </View>

            <View style={styles.cardContainer}>
              <Text style={styles.cardLabel}>Card Information</Text>
              <CardField
                postalCodeEnabled={false}
                placeholders={{
                  number: "4242 4242 4242 4242",
                }}
                cardStyle={{
                  backgroundColor: "#FFFFFF",
                  textColor: "#000000",
                  borderWidth: 1,
                  borderColor: "#E0E0E0",
                  borderRadius: 8,
                }}
                style={styles.cardField}
                onCardChange={(cardDetails) => {
                  setCardDetails(cardDetails);
                }}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.payButton,
                (!cardDetails?.complete || isProcessing) &&
                  styles.payButtonDisabled,
              ]}
              onPress={handlePay}
              disabled={!cardDetails?.complete || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.payButtonText}>
                  Pay ${amount.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.testCardInfo}>
              💡 Test Card: 4242 4242 4242 4242
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeButton: {
    fontSize: 28,
    color: "#6B7280",
    fontWeight: "300",
  },
  amountContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#059669",
  },
  bookingInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  cardField: {
    width: "100%",
    height: 50,
    marginVertical: 30,
  },
  payButton: {
    backgroundColor: "#059669",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  payButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  testCardInfo: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
});
