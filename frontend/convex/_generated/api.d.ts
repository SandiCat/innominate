/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as canvasItems from "../canvasItems.js";
import type * as canvases from "../canvases.js";
import type * as embeddings from "../embeddings.js";
import type * as human_hash_human_hash from "../human_hash/human_hash.js";
import type * as human_hash_words from "../human_hash/words.js";
import type * as migrations from "../migrations.js";
import type * as noteUIStates from "../noteUIStates.js";
import type * as notes from "../notes.js";
import type * as scripts from "../scripts.js";
import type * as twitter_functions from "../twitter/functions.js";
import type * as types from "../types.js";
import type * as users from "../users.js";
import type * as wrapper from "../wrapper.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  canvasItems: typeof canvasItems;
  canvases: typeof canvases;
  embeddings: typeof embeddings;
  "human_hash/human_hash": typeof human_hash_human_hash;
  "human_hash/words": typeof human_hash_words;
  migrations: typeof migrations;
  noteUIStates: typeof noteUIStates;
  notes: typeof notes;
  scripts: typeof scripts;
  "twitter/functions": typeof twitter_functions;
  types: typeof types;
  users: typeof users;
  wrapper: typeof wrapper;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
