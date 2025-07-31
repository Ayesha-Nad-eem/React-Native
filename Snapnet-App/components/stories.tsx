import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { ScrollView } from "react-native";
import Story from "./story";

const StoriesSection = () => {
  const { userId } = useAuth();
  const activeStories = useQuery(api.stories.getActiveStories) ?? [];
  const currentUserStory = useQuery(api.stories.getCurrentUserStory);
  const currentUser = useQuery(api.users.getUserByClerkId, userId ? { clerkId: userId } : "skip");

  // Combine current user's story with others
  const allStories = [
    // Always show current user's story slot first
    {
      id: "current-user",
      isCurrentUser: true,
      hasStory: !!currentUserStory,
      user: currentUser,
      story: currentUserStory,
    },
    // Then show other users' stories
    ...activeStories
      .filter((story) => story.user?.clerkId !== userId) // Exclude current user from this list
      .map((story) => ({
        id: story._id,
        isCurrentUser: false,
        hasStory: true,
        user: story.user,
        story,
      }))
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer}>
      {allStories.map((storyData) => (
        <Story key={storyData.id} storyData={storyData} />
      ))}
    </ScrollView>
  );
};

export default StoriesSection;