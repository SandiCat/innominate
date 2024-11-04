import * as fs from "fs";
import * as path from "path";
import * as twitterApi from "./api.js";

const OUTPUT_FOLDER = "../data/twitter/scraped";

const followingListPath = "/home/x/innominate/data/following.txt";

const followingList = fs.readFileSync(followingListPath, "utf-8").split("\n");

for (const username of followingList) {
  console.log("******************************");
  console.log(`Scraping @${username}`);

  try {
    const userId = await twitterApi.userNameToId(username);
    const tweets = await twitterApi.fetchTweets(userId);

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

    const outputPath = path.join(OUTPUT_FOLDER, `${username}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(tweets, null, 2));
  } catch (error) {
    console.log(`Error scraping @${username}: ${error}`);
  }

  // Wait 200ms before next request
  await new Promise((resolve) => setTimeout(resolve, 200));
}
