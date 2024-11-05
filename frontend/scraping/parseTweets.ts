import { P, match } from "ts-pattern";

export function parseUser(userData: unknown) {
  return match(userData)
    .with(
      {
        legacy: P.select("legacy"),
        rest_id: P.select("userId"),
      },
      ({ legacy, userId }) => ({
        userId,
        username: legacy.screen_name,
        displayName: legacy.name,
        description: legacy.description,
        profileImageUrl: legacy.profile_image_url_https,
        followersCount: legacy.followers_count,
        followingCount: legacy.friends_count,
        tweetCount: legacy.statuses_count,
        createdAt: legacy.created_at,
      })
    )
    .otherwise(() => null);
}

export function parseTweet(tweetData: unknown) {
  return match(tweetData)
    .with(
      {
        content: {
          itemContent: {
            tweet_results: {
              result: {
                legacy: P.select("legacy"),
                core: {
                  user_results: {
                    result: P.select("user"),
                  },
                },
                views: {
                  count: P.select("viewCount"),
                },
              },
            },
          },
        },
      },
      ({ legacy, user, viewCount }) => ({
        tweet: {
          tweetId: legacy.id_str!,
          authorId: user.rest_id!,
          text: legacy.full_text!,
          createdAt: legacy.created_at!,
          viewCount: Number(viewCount!),
          likeCount: legacy.favorite_count!,
          retweetCount: legacy.retweet_count!,
          replyCount: legacy.reply_count!,
          quoteCount: legacy.quote_count!,
          inReplyToTweetId: legacy.in_reply_to_status_id_str,
          conversationId: legacy.conversation_id_str!,
          quotedTweetId: legacy.quoted_status_id_str,
        },
        media:
          legacy.extended_entities?.media?.map((m) => ({
            tweetId: legacy.id_str,
            url: m.media_url_https,
            type: m.type,
          })) ?? [],
        user: parseUser(user),
      })
    )
    .otherwise(() => null);
}
