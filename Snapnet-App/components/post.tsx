import { COLORS } from '@/constants/Theme'
import { api } from "@/convex/_generated/api"
import { Id } from '@/convex/_generated/dataModel'
import { styles } from '@/styles/feed.styles'
import { useUser } from '@clerk/clerk-react'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery } from "convex/react"
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import * as FileSystem from 'expo-file-system'
import { Image } from 'expo-image'
import * as MediaLibrary from 'expo-media-library'
import { Link } from 'expo-router'
import * as Sharing from 'expo-sharing'
import React, { useState } from 'react'
import { Alert, Modal, Platform, Share, Text, TouchableOpacity, View } from 'react-native'
import CommentsModel from './commentsmodel'


type PostProp = {
  post: {
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
      image: string
    };
  };
};

export default function Post({ post }: PostProp) {

  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [showComments, setShowComments] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const { user } = useUser();
  const currentUser = useQuery(api.users.getUserByClerkId, user ? { clerkId: user?.id } : "skip");

  const toggleLike = useMutation(api.posts.toggleLike);
  const toggleBookmark = useMutation(api.bookmarks.toggleBookmark);
  const deletePost =useMutation(api.posts.deletePost);

  const handleLike = async () => {
    try {
      const newIsLiked = await toggleLike({ postId: post._id });
      setIsLiked(newIsLiked);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleBookmark = async () => {
    const newIsBookmarked = await toggleBookmark({ postId: post._id });
    setIsBookmarked(newIsBookmarked);
  };

  const handleDeletePost = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost({ postId: post._id });
            } catch (error) {
              console.error("Error deleting post: ", error);
            }
          },
        },
      ]
    );
  };

  const handleDownloadImage = async () => {
    try {
      // Request permission to access media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save images to your gallery');
        return;
      }

      // Download the image
      const fileUri = FileSystem.documentDirectory + `post_${post._id}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(post.imageUrl, fileUri);
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      await MediaLibrary.createAlbumAsync('Snapnet', asset, false);
      
      Alert.alert('Success', 'Image saved to your gallery!');
      setShowOptionsModal(false);
    } catch (error) {
      console.error('Error downloading image:', error);
      Alert.alert('Error', 'Failed to download image');
    }
  };

  const handleSharePost = async () => {
    try {
      // Download the image to a temporary location
      const fileUri = FileSystem.documentDirectory + `temp_share_${post._id}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(post.imageUrl, fileUri);
      
      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          // Use expo-sharing for better image sharing support
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'image/jpeg',
            dialogTitle: `Post by ${post.author.username}${post.caption ? `: ${post.caption}` : ''}`,
          });
        } else {
          // Fallback to React Native Share API
          const shareOptions = {
            message: `Check out this post by ${post.author.username}${post.caption ? `:\n\n"${post.caption}"` : ''}`,
            url: Platform.OS === 'ios' ? downloadResult.uri : `file://${downloadResult.uri}`,
          };
          await Share.share(shareOptions);
        }
        
        // Clean up the temporary file after sharing
        setTimeout(async () => {
          try {
            await FileSystem.deleteAsync(downloadResult.uri);
          } catch (error) {
            console.log('Error cleaning up temp file:', error);
          }
        }, 5000);
        
      } else {
        // Fallback to text-only sharing if image download fails
        const shareOptions = {
          message: `Check out this post by ${post.author.username}${post.caption ? `: ${post.caption}` : ''}\n\nImage: ${post.imageUrl}`,
        };
        await Share.share(shareOptions);
      }
      
      setShowOptionsModal(false);
    } catch (error) {
      console.error('Error sharing post:', error);
      // Final fallback to text-only sharing
      try {
        const shareOptions = {
          message: `Check out this post by ${post.author.username}${post.caption ? `: ${post.caption}` : ''}\n\nImage: ${post.imageUrl}`,
        };
        await Share.share(shareOptions);
        setShowOptionsModal(false);
      } catch (fallbackError) {
        console.error('Error with fallback sharing:', fallbackError);
        Alert.alert('Error', 'Failed to share post');
      }
    }
  };

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Link href={currentUser?._id === post.author._id ? "/(tabs)/profile" : `/user/${post.author._id}`} asChild>
          <TouchableOpacity style={styles.postHeaderLeft}>
            <Image
              source={post.author.image}
              style={styles.postAvatar}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <Text style={styles.postUsername}>{post.author.username}</Text>
          </TouchableOpacity>
        </Link>

        {String(post.author._id) === String(currentUser?._id) ? (
          <TouchableOpacity onPress={handleDeletePost} accessibilityLabel="Delete post">
            <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowOptionsModal(true)}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}

      </View>

      {/*Image*/}
      <Image
        source={post.imageUrl}
        style={styles.postImage}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />

      {/*Post Actions*/}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity onPress={handleLike}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? COLORS.primary : COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowComments(true)}>
            <Ionicons name="chatbubble-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleBookmark}>
          <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={22} color={isBookmarked ? COLORS.primary : COLORS.white} />
        </TouchableOpacity>
      </View>
      {/*Post Info*/}
      <View style={styles.postInfo}>
        <Text style={styles.likesText}>{(post.likes > 0) ? `${post.likes} likes` : "Be the first to like this post"}</Text>
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionUsername}>{post.author.username} </Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>
        )}

        {post.comments > 0 && (
          <TouchableOpacity onPress={() => setShowComments(true)}>
            <Text style={styles.commentText}>View all {post.comments} comments</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timeAgo}>{formatDistanceToNow(post._creationTime, { addSuffix: true })}</Text>

        <CommentsModel
          postId={post._id}
          visible={showComments}
          onClose={() => setShowComments(false)}
         
        />
      </View>

      {/* Options Modal for other users' posts */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.optionsModal}>
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={handleDownloadImage}
            >
              <Ionicons name="download-outline" size={24} color={COLORS.white} />
              <Text style={styles.optionText}>Download Image</Text>
            </TouchableOpacity>
            
            <View style={styles.optionDivider} />
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={handleSharePost}
            >
              <Ionicons name="share-outline" size={24} color={COLORS.white} />
              <Text style={styles.optionText}>Share Post</Text>
            </TouchableOpacity>
            
            <View style={styles.optionDivider} />
            
            <TouchableOpacity 
              style={[styles.optionItem, styles.cancelOption]}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={[styles.optionText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}