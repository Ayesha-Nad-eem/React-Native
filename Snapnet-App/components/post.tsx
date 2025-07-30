import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { styles } from '@/styles/feed.styles'
import { Link } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/Theme'
import { Id } from '@/convex/_generated/dataModel'
import { useState } from 'react'
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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

  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);

  const toggleLike = useMutation(api.posts.toggleLike);
  const handleLike = async () => {
    try {
      const newIsLiked = await toggleLike({ postId: post._id });
      setIsLiked(newIsLiked);
      setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };
  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Link href={"/(tabs)/notifications"}>
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

        {/* <TouchableOpacity>
                <Ionicons name ="ellipsis-horizontal" size={20} color={COLORS.white} />
            </TouchableOpacity> */}

        <TouchableOpacity>
          <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>

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

        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      {/*Post Info*/}
      <View style={styles.postInfo}>
        <Text style={styles.likesText}>{(likesCount > 0) ? `${likesCount} likes` : "Be the first to like this post"}</Text>
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionUsername}>{post.author.username} </Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>
        )}

        <TouchableOpacity>
          <Text style={styles.commentText}>View all 2 comments</Text>
        </TouchableOpacity>
        <Text style={styles.timeAgo}>2 hours ago</Text>

        <CommentsModel 
          postId={post._id}
          visible={showComments}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => {
            setCommentsCount((prev) => prev + 1);
          }}
        />
      </View>
    </View>
  )
}