import { COLORS } from "@/constants/Theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Dimensions, Modal, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { CustomAlert } from "./CustomAlert";

const { width, height } = Dimensions.get("window");

type StoryData = {
  id: string;
  isCurrentUser: boolean;
  hasStory: boolean;
  user: any;
  story?: any;
};

export default function Story({ storyData }: { storyData: StoryData }) {
  const [isUploading, setIsUploading] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const createStory = useMutation(api.stories.createStory);
  const deleteStory = useMutation(api.stories.deleteUserStory);
  const generateUploadUrl = useMutation(api.http.generateUploadUrl);

  const handleStoryPress = async () => {
    if (storyData.isCurrentUser && !storyData.hasStory) {
      // Current user wants to create a story
      await handleCreateStory();
    } else if (storyData.hasStory) {
      // View existing story
      setShowStoryModal(true);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return "Just now";
    }
  };

  const handleDeleteStory = async () => {
    setShowDeleteAlert(true);
  };

  const confirmDeleteStory = async () => {
    try {
      await deleteStory();
      setShowStoryModal(false);
      setShowSuccessAlert(true);
    } catch (error) {
      setErrorMessage("Failed to delete story");
      setShowErrorAlert(true);
      console.error("Error deleting story:", error);
    }
  };

  const handleCreateStory = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Please grant camera roll permissions to upload a story.");
        setShowErrorAlert(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16], // Story aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        await uploadStory(result.assets[0].uri);
      }
    } catch (error) {
      setErrorMessage("Failed to pick image");
      setShowErrorAlert(true);
      console.error("Error picking image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadStory = async (imageUri: string) => {
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!result.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await result.json();

      // Create story in database
      await createStory({
        imageUrl: imageUri,
        storageId,
      });

      setShowSuccessAlert(true);
    } catch (error) {
      setErrorMessage("Failed to upload story");
      setShowErrorAlert(true);
      console.error("Error uploading story:", error);
    }
  };

  const getDisplayContent = () => {
    if (storyData.isCurrentUser) {
      if (storyData.hasStory) {
        // Current user has a story
        return {
          image: storyData.story?.imageUrl || storyData.user?.image,
          username: "Your Story",
          showRing: true
        };
      } else {
        // Current user doesn't have a story - show "+" to create
        return {
          image: storyData.user?.image,
          username: "Your Story",
          showRing: false,
          showPlusIcon: true
        };
      }
    } else {
      // Other user's story
      return {
        image: storyData.story?.imageUrl || storyData.user?.image,
        username: storyData.user?.username || "User",
        showRing: true
      };
    }
  };

  const { image, username, showRing, showPlusIcon } = getDisplayContent();

  return (
    <>
      <TouchableOpacity 
        style={styles.storyWrapper} 
        onPress={handleStoryPress}
        disabled={isUploading}
      >
        <View style={[styles.storyRing, !showRing && styles.noStory]}>
          <Image 
            source={{ uri: image }} 
            style={styles.storyAvatar}
            contentFit="cover"
          />
          {showPlusIcon && (
            <View style={styles.storyPlusIcon}>
              <Ionicons name="add" size={16} color={COLORS.white} />
            </View>
          )}
          {isUploading && (
            <View style={styles.storyLoadingOverlay}>
              <Ionicons name="hourglass" size={16} color={COLORS.white} />
            </View>
          )}
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {username}
        </Text>
      </TouchableOpacity>

      {/* Story Viewer Modal */}
      <Modal
        visible={showStoryModal}
        animationType="fade"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => setShowStoryModal(false)}
      >
        <StatusBar hidden />
        <View style={storyViewerStyles.container}>
          {/* Header with user info and close button */}
          <View style={storyViewerStyles.header}>
            <View style={storyViewerStyles.userInfo}>
              <Image
                source={{ uri: storyData.user?.image }}
                style={storyViewerStyles.userAvatar}
                contentFit="cover"
              />
              <View style={storyViewerStyles.userDetails}>
                <Text style={storyViewerStyles.username}>
                  {storyData.user?.username || "User"}
                </Text>
                <Text style={storyViewerStyles.timeAgo}>
                  {storyData.story?._creationTime ? formatTimeAgo(storyData.story._creationTime) : ""}
                </Text>
              </View>
            </View>
            <View style={storyViewerStyles.headerActions}>
              {storyData.isCurrentUser && (
                <TouchableOpacity
                  style={storyViewerStyles.deleteButton}
                  onPress={handleDeleteStory}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.white} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={storyViewerStyles.closeButton}
                onPress={() => setShowStoryModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Story Image */}
          <View style={storyViewerStyles.imageContainer}>
            <Image
              source={{ uri: storyData.story?.imageUrl }}
              style={storyViewerStyles.storyImage}
              contentFit="contain"
            />
          </View>

          {/* Progress bar (optional - shows story duration) */}
          <View style={storyViewerStyles.progressContainer}>
            <View style={storyViewerStyles.progressBar} />
          </View>
        </View>
      </Modal>

      {/* Custom Alerts */}
      <CustomAlert
        visible={showDeleteAlert}
        title="Delete Story"
        message="Are you sure you want to delete your story?"
        buttons={[
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {}
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: confirmDeleteStory
          }
        ]}
        onClose={() => setShowDeleteAlert(false)}
      />

      <CustomAlert
        visible={showErrorAlert}
        title="Error"
        message={errorMessage}
        buttons={[
          {
            text: "OK",
            style: "default",
            onPress: () => {}
          }
        ]}
        onClose={() => setShowErrorAlert(false)}
      />
    </>
  );
}

// Styles for the story viewer modal
const storyViewerStyles = {
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    position: "absolute" as const,
    top: 20,
    left: 0,
    right: 0,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  userInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  headerActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  userDetails: {
    flexDirection: "column" as const,
  },
  username: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.white,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.grey,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  storyImage: {
    width: width,
    height: height,
  },
  progressContainer: {
    position: "absolute" as const,
    top: 10,
    left: 16,
    right: 16,
    height: 2,
  },
  progressBar: {
    height: 2,
    backgroundColor: COLORS.white,
    borderRadius: 1,
    opacity: 0.8,
  },
};