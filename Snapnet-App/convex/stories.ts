import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new story
export const createStory = mutation({
  args: {
    imageUrl: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Find the user by clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Stories expire after 24 hours
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    // Delete any existing story by this user first
    const existingStory = await ctx.db
      .query("stories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingStory) {
      await ctx.db.delete(existingStory._id);
    }

    // Create new story
    const storyId = await ctx.db.insert("stories", {
      userId: user._id,
      imageUrl: args.imageUrl,
      storageId: args.storageId,
      expiresAt,
    });

    return storyId;
  },
});

// Get all active stories (not expired)
export const getActiveStories = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentTime = Date.now();

    // Get all stories that haven't expired
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_expires", (q) => q.gt("expiresAt", currentTime))
      .collect();

    // Get user info for each story
    const storiesWithUsers = await Promise.all(
      stories.map(async (story) => {
        const user = await ctx.db.get(story.userId);
        return {
          ...story,
          user,
        };
      })
    );

    return storiesWithUsers;
  },
});

// Get current user's story
export const getCurrentUserStory = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Find the user by clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const currentTime = Date.now();

    // Get user's active story
    const story = await ctx.db
      .query("stories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gt(q.field("expiresAt"), currentTime))
      .first();

    if (!story) {
      return null;
    }

    return {
      ...story,
      user,
    };
  },
});

// Delete expired stories (cleanup function)
export const cleanupExpiredStories = mutation({
  handler: async (ctx) => {
    const currentTime = Date.now();
    
    const expiredStories = await ctx.db
      .query("stories")
      .withIndex("by_expires", (q) => q.lt("expiresAt", currentTime))
      .collect();

    for (const story of expiredStories) {
      await ctx.db.delete(story._id);
    }

    return expiredStories.length;
  },
});

// Delete user's story
export const deleteUserStory = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Find the user by clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Find and delete user's story
    const story = await ctx.db
      .query("stories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (story) {
      await ctx.db.delete(story._id);
    }

    return { success: true };
  },
});
