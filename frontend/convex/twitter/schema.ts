import { defineTable } from "convex/server";
import { v } from "convex/values";

export const twitterTables = {
  twitterUsers: defineTable({
    userId: v.string(),
    username: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    followersCount: v.number(),
    followingCount: v.number(),
    tweetCount: v.number(),
    createdAt: v.string(),
  }).index("byUsername", ["username"]),

  tweets: defineTable({
    authorId: v.string(),
    tweetId: v.string(),
    text: v.string(),
    createdAt: v.string(),

    // Engagement metrics
    viewCount: v.number(),
    likeCount: v.number(),
    retweetCount: v.number(),
    replyCount: v.number(),
    quoteCount: v.number(),

    // Thread handling
    inReplyToTweetId: v.optional(v.string()),
    conversationId: v.string(),

    quotedTweetId: v.optional(v.string()),
  })
    .index("byAuthorId", ["authorId"])
    .index("byConversationId", ["conversationId"]),
  media: defineTable({
    tweetId: v.string(),
    url: v.string(),
    type: v.string(), // "photo", "video", etc
  }).index("byTweetId", ["tweetId"]),
};
