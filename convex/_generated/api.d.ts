/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adjustments from "../adjustments.js";
import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as audit from "../audit.js";
import type * as bootstrap from "../bootstrap.js";
import type * as catalog from "../catalog.js";
import type * as categories from "../categories.js";
import type * as dispatch from "../dispatch.js";
import type * as helpers_audit from "../helpers/audit.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as helpers_context from "../helpers/context.js";
import type * as helpers_tenant from "../helpers/tenant.js";
import type * as helpers_validators from "../helpers/validators.js";
import type * as inventory from "../inventory.js";
import type * as onboarding from "../onboarding.js";
import type * as recipes from "../recipes.js";
import type * as suppliers from "../suppliers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adjustments: typeof adjustments;
  admin: typeof admin;
  analytics: typeof analytics;
  audit: typeof audit;
  bootstrap: typeof bootstrap;
  catalog: typeof catalog;
  categories: typeof categories;
  dispatch: typeof dispatch;
  "helpers/audit": typeof helpers_audit;
  "helpers/auth": typeof helpers_auth;
  "helpers/context": typeof helpers_context;
  "helpers/tenant": typeof helpers_tenant;
  "helpers/validators": typeof helpers_validators;
  inventory: typeof inventory;
  onboarding: typeof onboarding;
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
