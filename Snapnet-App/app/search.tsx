import { COLORS } from "@/constants/Theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { styles } from "../styles/search.styles";

type User = {
  _id: string;
  username: string;
  fullname: string;
  image: string;
  followers: number;
  following: number;
  posts: number;
};

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const { userId } = useAuth();
  
  // Get all users
  const allUsers = useQuery(api.users.getAllUsers) ?? [];

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers([]);
    } else {
      const filtered = allUsers.filter(
        (user) =>
          user.clerkId !== userId && // Exclude current user
          (user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.fullname.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, allUsers, userId]);

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item._id)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.userAvatar}
        contentFit="cover"
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.fullname}>{item.fullname}</Text>
        <View style={styles.userStats}>
          <Text style={styles.statsText}>
            {item.posts} posts • {item.followers} followers
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (searchQuery.trim() === "") {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color={COLORS.grey} />
          <Text style={styles.emptyTitle}>Search Users</Text>
          <Text style={styles.emptySubtitle}>
            Search for users by username or full name
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color={COLORS.grey} />
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching with different keywords
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.grey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={COLORS.grey}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.grey} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}
