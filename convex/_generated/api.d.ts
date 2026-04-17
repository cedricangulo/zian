/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bootstrap from "../bootstrap.js";
import type * as catalog from "../catalog.js";
import type * as categories from "../categories.js";
import type * as dispatch from "../dispatch.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as helpers_context from "../helpers/context.js";
import type * as helpers_tenant from "../helpers/tenant.js";
import type * as inventory from "../inventory.js";
import type * as recipes from "../recipes.js";
import type * as suppliers from "../suppliers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bootstrap: typeof bootstrap;
  catalog: typeof catalog;
  categories: typeof categories;
  dispatch: typeof dispatch;
  "helpers/auth": typeof helpers_auth;
  "helpers/context": typeof helpers_context;
  "helpers/tenant": typeof helpers_tenant;
  inventory: typeof inventory;
  recipes: typeof recipes;
  suppliers: typeof suppliers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
