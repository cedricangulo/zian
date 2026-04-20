import { v } from "convex/values";
import { type QueryCtx, query } from "./_generated/server";
import { requireOwnerContext } from "./helpers/context";

// ---------------------------------------------------------------------------
// Queries – restricted to owners / admins
// ---------------------------------------------------------------------------

export const listAuditLogs = query({
	args: {
		entity_affected: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const limit = Math.min(args.limit ?? 50, 200);

		if (args.entity_affected) {
			const logs = await ctx.db
				.query("audit_logs")
				.withIndex("by_org_id_and_entity_affected", (q) =>
					q
						.eq("org_id", organization._id)
						.eq("entity_affected", args.entity_affected!),
				)
				.order("desc")
				.take(limit);

			return await enrichWithUserNames(ctx, logs);
		}

		const logs = await ctx.db
			.query("audit_logs")
			.withIndex("by_org_id_and_created_at", (q) =>
				q.eq("org_id", organization._id),
			)
			.order("desc")
			.take(limit);

		return await enrichWithUserNames(ctx, logs);
	},
});

export const getAuditLogsByRecord = query({
	args: {
		record_id: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const limit = Math.min(args.limit ?? 50, 200);

		const logs = await ctx.db
			.query("audit_logs")
			.withIndex("by_org_id_and_record_id", (q) =>
				q.eq("org_id", organization._id).eq("record_id", args.record_id),
			)
			.order("desc")
			.take(limit);

		return await enrichWithUserNames(ctx, logs);
	},
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function enrichWithUserNames<T extends { user_id: string }>(
	ctx: QueryCtx,
	logs: T[],
): Promise<Array<T & { user_name: string; user_email: string }>> {
	const userCache = new Map<
		string,
		{ first_name: string; last_name: string; email: string }
	>();

	return await Promise.all(
		logs.map(async (log) => {
			let userData = userCache.get(log.user_id);
			if (!userData) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const user = await ctx.db.get(log.user_id as any);
				if (user && "first_name" in user) {
					userData = {
						first_name: user.first_name as string,
						last_name: user.last_name as string,
						email: user.email as string,
					};
				} else {
					userData = { first_name: "Unknown", last_name: "User", email: "" };
				}
				userCache.set(log.user_id, userData);
			}

			return {
				...log,
				user_name: `${userData.first_name} ${userData.last_name}`,
				user_email: userData.email,
			};
		}),
	);
}
