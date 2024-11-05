import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { parseTweet } from "./parseTweets";
import { json } from "stream/consumers";

// Load environment variables
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

async function importTwitterData() {
  const scrapedDir = path.join("../data/twitter/scraped");
  const files = fs.readdirSync(scrapedDir);

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const filePath = path.join(scrapedDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    try {
      const instructions =
        data.data.user.result.timeline_v2.timeline.instructions;
      const entries = instructions.find(
        (i: any) => i.type === "TimelineAddEntries"
      )?.entries;

      if (!entries) {
        console.warn(`No entries found in ${file}`);
        continue;
      }

      // Collect all entries for this user
      let tweets = [];
      const allMedia = [];
      let user = null;

      for (const entry of entries) {
        const parsed = parseTweet(entry);
        if (!parsed) continue;

        const { tweet, media, user: parsedUser } = parsed;
        if (parsedUser && !user) user = parsedUser;

        tweets.push(tweet);
        allMedia.push(...media);
      }

      if (!user || tweets.length === 0) continue;

      //   console.log(tweets);

      tweets = tweets.slice(0, 3);
      tweets = JSON.parse(JSON.stringify(tweets));
      console.log(tweets);

      // Batch insert all data for this user
      await client.mutation(api.twitter.functions.upsertUser, user);
      await client.mutation(api.twitter.functions.upsertTweets, { tweets });
      if (allMedia.length > 0) {
        await client.mutation(api.twitter.functions.upsertMediaBatch, {
          media: allMedia,
        });
      }

      console.log(
        `Processed ${tweets.length} tweets and ${allMedia.length} media items for ${user.username}`
      );
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
}

// Run the import
importTwitterData().catch(console.error);
