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
import type * as auth from "../auth.js";
import type * as canvasItems from "../canvasItems.js";
import type * as canvases from "../canvases.js";
import type * as counters from "../counters.js";
import type * as http from "../http.js";
import type * as human_hash_human_hash from "../human_hash/human_hash.js";
import type * as human_hash_words from "../human_hash/words.js";
import type * as notes from "../notes.js";
import type * as types from "../types.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  canvasItems: typeof canvasItems;
  canvases: typeof canvases;
  counters: typeof counters;
  http: typeof http;
  "human_hash/human_hash": typeof human_hash_human_hash;
  "human_hash/words": typeof human_hash_words;
  notes: typeof notes;
  types: typeof types;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
