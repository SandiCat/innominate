import * as fs from "fs";
import * as path from "path";
import * as twitterApi from "./api.js";

const OUTPUT_FOLDER = "../data/twitter/scraped";

const followingListPath = "/home/x/innominate/data/following.txt";

const followingList = fs.readFileSync(followingListPath, "utf-8").split("\n");

// Exponential backoff retry wrapper
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 10,
  baseDelay = 5000,
  maxDelay = 5 * 60000
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Should not reach here");
}

for (const username of followingList) {
  const outputPath = path.join(OUTPUT_FOLDER, `${username}.json`);

  if (fs.existsSync(outputPath)) {
    console.log(`Skipping @${username} - already scraped`);
    continue;
  }

  console.log("******************************");
  console.log(`Scraping @${username}`);

  try {
    const userId = await withRetry(() => twitterApi.userNameToId(username));
    if (userId === null) {
      console.log(`Account deleted: @${username}`);
      continue;
    }

    const tweets = await withRetry(() => twitterApi.fetchTweets(userId));

    try {
      const instructions =
        tweets.data.user.result.timeline_v2.timeline.instructions;
      const numInstructions = instructions.length;

      let entries = undefined;

      if (numInstructions == 4) entries = instructions[2].entries;
      else if (numInstructions == 3) entries = instructions[1].entries;
      else
        throw new Error(
          `Unexpected number of instructions: ${numInstructions}`
        );

      console.log(`Received ${entries.length} tweets for ${username}`);
    } catch (error) {
      console.error(`Unexpected entries format @${username}: ${error}`);
    }

    fs.writeFileSync(outputPath, JSON.stringify(tweets, null, 2));
  } catch (error) {
    console.log(`Error scraping @${username}: ${error}`);
  }

  // Base delay between users
  await new Promise((resolve) => setTimeout(resolve, 500));
}
