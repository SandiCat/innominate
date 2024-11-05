import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { parseTweet } from "./parseTweets";

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

      let insertedUser = false;

      for (const entry of entries) {
        const parsed = parseTweet(entry);
        if (!parsed) continue;

        const { tweet, media, user } = parsed;

        // Only insert user once
        if (user && !insertedUser) {
          await client.mutation(api.twitter.functions.upsertUser, user);
          insertedUser = true;
        }

        // Insert tweet
        await client.mutation(api.twitter.functions.upsertTweet, tweet);

        // Insert media
        for (const m of media) {
          await client.mutation(api.twitter.functions.upsertMedia, m);
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
}

// Run the import
importTwitterData().catch(console.error);
