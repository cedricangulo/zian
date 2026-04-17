import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type ActionType = "create" | "update" | "archive" | "adjust" | "delete";

/**
 * Compute the delta between previous and next state for UX-friendly audit logs.
 * Only includes fields that actually changed.
 */
export function computeDelta(
	previous: Record<string, unknown>,
	next: Record<string, unknown>,
): { previous: Record<string, unknown>; next: Record<string, unknown> } | null {
	const prevDiff: Record<string, unknown> = {};
	const nextDiff: Record<string, unknown> = {};

	for (const key of Object.keys(next)) {
		// Skip internal Convex fields
		if (key === "_id" || key === "_creationTime" || key === "org_id") continue;

		const oldVal = previous[key];
		const newVal = next[key];

		if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
			prevDiff[key] = oldVal;
			nextDiff[key] = newVal;
		}
	}

	if (Object.keys(nextDiff).length === 0) return null;

	return { previous: prevDiff, next: nextDiff };
}

/**
 * Append an immutable audit log entry. This should be called from within a
 * mutation so it is part of the same atomic Convex transaction.
 */
export async function writeAuditLog(
	ctx: MutationCtx,
	opts: {
		orgId: Id<"organizations">;
		userId: Id<"users">;
		actionType: ActionType;
		entityAffected: string;
		recordId: string;
		changeLog: unknown;
	},
) {
	await ctx.db.insert("audit_logs", {
		org_id: opts.orgId,
		user_id: opts.userId,
		action_type: opts.actionType,
		entity_affected: opts.entityAffected,
		record_id: opts.recordId,
		change_log: opts.changeLog,
		created_at: Date.now(),
	});
}
