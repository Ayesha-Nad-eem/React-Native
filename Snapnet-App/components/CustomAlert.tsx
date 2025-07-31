import { COLORS } from "@/constants/Theme";
import React from "react";
import { Dimensions, Modal, Text, TouchableOpacity, View } from "react-native";

const { width, height } = Dimensions.get("window");

interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: CustomAlertButton[];
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onClose,
}) => {
  const handleButtonPress = (button: CustomAlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case "destructive":
        return { color: "#FF3B30" };
      case "cancel":
        return { color: COLORS.grey };
      default:
        return { color: COLORS.primary };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  index < buttons.length - 1 && styles.buttonBorder
                ]}
                onPress={() => handleButtonPress(button)}
              >
                <Text style={[styles.buttonText, getButtonStyle(button.style)]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 40,
  },
  alertContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    width: width - 80,
    maxWidth: 300,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: COLORS.grey,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: COLORS.white,
    textAlign: "center" as const,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  message: {
    fontSize: 13,
    color: COLORS.white,
    textAlign: "center" as const,
    lineHeight: 18,
    opacity: 0.8,
  },
  buttonContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.grey,
    flexDirection: "row" as const,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  buttonBorder: {
    borderRightWidth: 1,
    borderRightColor: COLORS.grey,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "400" as const,
  },
};
