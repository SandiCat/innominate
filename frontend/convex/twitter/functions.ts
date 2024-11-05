import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const upsertUser = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    followersCount: v.number(),
    followingCount: v.number(),
    tweetCount: v.number(),
    createdAt: v.string(),
  },
  handler: async (ctx, user) => {
    const existing = await ctx.db
      .query("twitterUsers")
      .filter((q) => q.eq(q.field("userId"), user.userId))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, user);
    } else {
      return await ctx.db.insert("twitterUsers", user);
    }
  },
});

export const upsertTweet = mutation({
  args: {
    authorId: v.string(),
    tweetId: v.string(),
    text: v.string(),
    createdAt: v.string(),
    viewCount: v.number(),
    likeCount: v.number(),
    retweetCount: v.number(),
    replyCount: v.number(),
    quoteCount: v.number(),
    inReplyToTweetId: v.optional(v.string()),
    conversationId: v.string(),
    quotedTweetId: v.optional(v.string()),
  },
  handler: async (ctx, tweet) => {
    const existing = await ctx.db
      .query("tweets")
      .filter((q) => q.eq(q.field("tweetId"), tweet.tweetId))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, tweet);
    } else {
      return await ctx.db.insert("tweets", tweet);
    }
  },
});

export const upsertMedia = mutation({
  args: {
    tweetId: v.string(),
    url: v.string(),
    type: v.string(),
  },
  handler: async (ctx, media) => {
    const existing = await ctx.db
      .query("media")
      .filter((q) =>
        q.and(
          q.eq(q.field("tweetId"), media.tweetId),
          q.eq(q.field("url"), media.url)
        )
      )
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, media);
    } else {
      return await ctx.db.insert("media", media);
    }
  },
});
