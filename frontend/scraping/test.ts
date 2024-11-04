import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as dotenv from "dotenv";
import { Id } from "../convex/_generated/dataModel.js";
import * as twitterApi from "./api.js";

// // TODO: relativize this somehow
// dotenv.config({ path: "/home/x/innominate/frontend/.env.local" });

// const client = new ConvexHttpClient(process.env["VITE_CONVEX_URL"]!);

// const testNote = await client.query(api.notes.get, {
//   noteId: "k57e3d0dtpbkhv8wwb2n56rcks73w00q" as Id<"notes">,
// });

// console.log(testNote);

// process.exit(0);

const userId = await twitterApi.userNameToId("poetengineer__");

const body = await twitterApi.fetchTweets(userId);

const instructions = body.data.user.result.timeline_v2.timeline.instructions;
console.log("instructions length", instructions.length);
const entries = instructions[2].entries;
console.log("entries length", entries.length);

entries.forEach((entry) => {
  const tweet = entry.content.itemContent.tweet_results.result.legacy.full_text;
  const firstLine = tweet.split("\n")[0];
  console.log(firstLine);
});
