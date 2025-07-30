import { Loader } from "@/components/loader";
import { COLORS } from "@/constants/Theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { View, Text, ScrollView, TouchableOpacity, Modal, SafeAreaView } from "react-native";
import { useState } from "react";
import Post from "@/components/post";
import { Ionicons } from "@expo/vector-icons";
import { Id } from "@/convex/_generated/dataModel";

type PostWithInfo = {
  _id: Id<"posts">;
  imageUrl: string;
  caption?: string;
  likes: number;
  comments: number;
  _creationTime: number;
  isLiked: boolean;
  isBookmarked: boolean;
  author: {
    _id: string;
    username: string;
    image: string;
  };
};


export default function Bookmarks() {
   const bookmarkedPosts = useQuery(api.bookmarks.getBookmarkedPosts);
   const [selectedPost, setSelectedPost] = useState<PostWithInfo | null>(null);
   const [showPostModal, setShowPostModal] = useState<boolean>(false);

  const handlePostPress = (post: PostWithInfo) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const handleCloseModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };

  if (bookmarkedPosts === undefined) return <Loader />;
  if (bookmarkedPosts.length === 0) return <NoBookmarksFound />;

  return (
    <View style={styles.container}>
       <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
      </View>

      {/* POSTS */}
      <ScrollView
        contentContainerStyle={{
          padding: 8,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {bookmarkedPosts.map((post) => {
          if (!post) return null;
          return (
            <TouchableOpacity 
              key={post._id} 
              style={{ width: "33.33%", padding: 1 }}
              onPress={() => handlePostPress(post)}
            >
              <Image
                source={post.imageUrl}
                style={{ width: "100%", aspectRatio: 1 }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Full Post Modal */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseModal}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Post</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={{ flex: 1 }}>
            {selectedPost && <Post post={selectedPost} />}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

function NoBookmarksFound() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
      }}
    >
      <Text style={{ color: COLORS.primary, fontSize: 22 }}>No bookmarked posts yet</Text>
    </View>
  );
}