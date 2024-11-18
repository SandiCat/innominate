import { myMutation } from "../wrapper";
import { v } from "convex/values";

export const upsertUser = myMutation({
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

export const upsertTweets = myMutation({
  args: {
    tweets: v.array(
      v.object({
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
      })
    ),
  },
  handler: async (ctx, { tweets }) => {
    const results = await Promise.all(
      tweets.map(async (tweet) => {
        const existing = await ctx.db
          .query("tweets")
          .filter((q) => q.eq(q.field("tweetId"), tweet.tweetId))
          .first();

        if (existing) {
          return await ctx.db.patch(existing._id, tweet);
        } else {
          return await ctx.db.insert("tweets", tweet);
        }
      })
    );
    return results;
  },
});

export const upsertMediaBatch = myMutation({
  args: {
    media: v.array(
      v.object({
        tweetId: v.string(),
        url: v.string(),
        type: v.string(),
      })
    ),
  },
  handler: async (ctx, { media }) => {
    const results = await Promise.all(
      media.map(async (item) => {
        const existing = await ctx.db
          .query("media")
          .filter((q) =>
            q.and(
              q.eq(q.field("tweetId"), item.tweetId),
              q.eq(q.field("url"), item.url)
            )
          )
          .first();

        if (existing) {
          return await ctx.db.patch(existing._id, item);
        } else {
          return await ctx.db.insert("media", item);
        }
      })
    );
    return results;
  },
});
