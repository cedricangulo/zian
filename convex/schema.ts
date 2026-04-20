import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
	businessAgeRange,
	businessSector,
	onboardingStatus,
	profileSex,
} from "./helpers/validators";

const organizationStatus = v.union(
	v.literal("active"),
	v.literal("suspended"),
	v.literal("archived"),
);

const userRole = v.union(
	v.literal("super_admin"),
	v.literal("owner"),
	v.literal("staff"),
);

const productType = v.union(
	v.literal("raw_material"),
	v.literal("packaging"),
	v.literal("sellable"),
	v.literal("composite"),
);

const movementType = v.union(
	v.literal("inbound"),
	v.literal("dispatch"),
	v.literal("adjustment"),
	v.literal("transfer"),
);

const eventReason = v.union(
	v.literal("purchase"),
	v.literal("sale"),
	v.literal("spoilage"),
	v.literal("damage"),
	v.literal("theft"),
	v.literal("correction"),
	v.literal("recipe_consumption"),
	v.literal("inventory_transfer"),
);

const actionType = v.union(
	v.literal("create"),
	v.literal("update"),
	v.literal("archive"),
	v.literal("adjust"),
	v.literal("delete"),
);

export default defineSchema({
	organizations: defineTable({
		clerk_org_id: v.string(),
		name: v.string(),
		status: organizationStatus,
		onboarding_status: v.optional(onboardingStatus),
		business_name: v.optional(v.string()),
		business_sector: v.optional(businessSector),
		business_type: v.optional(v.string()),
		business_age_range: v.optional(businessAgeRange),
		business_address: v.optional(v.string()),
		business_logo_file_id: v.optional(v.string()),
		archived_at: v.optional(v.number()),
	})
		.index("by_clerk_org_id", ["clerk_org_id"])
		.index("by_status", ["status"])
		.index("by_status_and_onboarding_status", ["status", "onboarding_status"])
		.index("by_business_sector", ["business_sector"])
		.index("by_archived_at", ["archived_at"]),

	users: defineTable({
		org_id: v.id("organizations"),
		token_identifier: v.string(),
		clerk_user_id: v.string(),
		first_name: v.string(),
		middle_name: v.optional(v.string()),
		last_name: v.string(),
		contact_number: v.optional(v.string()),
		sex: v.optional(profileSex),
		email: v.string(),
		role: userRole,
	})
		.index("by_org_id", ["org_id"])
		.index("by_org_id_and_role", ["org_id", "role"])
		.index("by_org_id_and_contact_number", ["org_id", "contact_number"])
		.index("by_org_id_and_token_identifier", ["org_id", "token_identifier"])
		.index("by_clerk_user_id", ["clerk_user_id"])
		.index("by_org_id_and_email", ["org_id", "email"]),

	suppliers: defineTable({
		org_id: v.id("organizations"),
		name: v.string(),
		contact_first_name: v.optional(v.string()),
		contact_last_name: v.optional(v.string()),
		phone_number: v.optional(v.string()),
	})
		.index("by_org_id", ["org_id"])
		.index("by_org_id_and_name", ["org_id", "name"]),

	categories: defineTable({
		org_id: v.id("organizations"),
		parent_category_id: v.optional(v.id("categories")),
		name: v.string(),
	})
		.index("by_org_id", ["org_id"])
		.index("by_org_id_and_parent_category_id", ["org_id", "parent_category_id"])
		.index("by_org_id_and_name", ["org_id", "name"]),

	products: defineTable({
		org_id: v.id("organizations"),
		category_id: v.optional(v.id("categories")),
		sku: v.string(),
		name: v.string(),
		image_url: v.optional(v.string()),
		base_unit: v.string(),
		product_type: productType,
		sellable: v.boolean(),
		stock_tracked: v.boolean(),
		track_expiry: v.boolean(),
		is_bom: v.boolean(),
		min_stock_level: v.number(),
		archived_at: v.optional(v.number()),
	})
		.index("by_org_id", ["org_id"])
		.index("by_org_id_and_category_id", ["org_id", "category_id"])
		.index("by_org_id_and_sku", ["org_id", "sku"])
		.index("by_org_id_and_product_type", ["org_id", "product_type"])
		.index("by_org_id_and_archived_at", ["org_id", "archived_at"]),

	recipes: defineTable({
		org_id: v.id("organizations"),
		parent_product_id: v.id("products"),
		ingredient_product_id: v.id("products"),
		quantity_required: v.number(),
	})
		.index("by_org_id", ["org_id"])
		.index("by_org_id_and_parent_product_id", ["org_id", "parent_product_id"])
		.index("by_org_id_and_ingredient_product_id", [
			"org_id",
			"ingredient_product_id",
		])
		.index("by_org_id_and_parent_product_id_and_ingredient_product_id", [
			"org_id",
			"parent_product_id",
			"ingredient_product_id",
		]),

	batches: defineTable({
		org_id: v.id("organizations"),
		product_id: v.id("products"),
		supplier_id: v.optional(v.id("suppliers")),
		batch_code: v.string(),
		cost_price: v.number(),
		initial_qty: v.number(),
		remaining_qty: v.number(),
		expiry_date: v.optional(v.number()),
		received_at: v.number(),
	})
		.index("by_org_id", ["org_id"])
		.index("by_org_id_and_product_id", ["org_id", "product_id"])
		.index("by_org_id_and_product_id_and_expiry_date", [
			"org_id",
			"product_id",
			"expiry_date",
		])
		.index("by_org_id_and_received_at", ["org_id", "received_at"])
		.index("by_org_id_and_supplier_id", ["org_id", "supplier_id"])
		.index("by_org_id_and_batch_code", ["org_id", "batch_code"]),

	transactions: defineTable({
		org_id: v.id("organizations"),
		user_id: v.id("users"),
		movement_type: movementType,
		event_reason: eventReason,
		created_at: v.number(),
	})
		.index("by_org_id", ["org_id"])
		.index("by_org_id_and_user_id", ["org_id", "user_id"])
		.index("by_org_id_and_created_at", ["org_id", "created_at"])
		.index("by_org_id_and_movement_type", ["org_id", "movement_type"])
		.index("by_org_id_and_event_reason", ["org_id", "event_reason"]),

	transaction_items: defineTable({
		org_id: v.id("organizations"),
		transaction_id: v.id("transactions"),
		product_id: v.id("products"),
		batch_id: v.optional(v.id("batches")),
		product_name_snapshot: v.string(),
		base_unit_snapshot: v.string(),
		quantity: v.number(),
		cost_at_event: v.number(),
		created_at: v.number(),
	})
		.index("by_org_id", ["org_id"])
		.index("by_org_id_and_transaction_id", ["org_id", "transaction_id"])
		.index("by_org_id_and_product_id", ["org_id", "product_id"])
		.index("by_org_id_and_batch_id", ["org_id", "batch_id"]),

	audit_logs: defineTable({
		org_id: v.id("organizations"),
		user_id: v.id("users"),
		action_type: actionType,
		entity_affected: v.string(),
		record_id: v.string(),
		change_log: v.any(),
		created_at: v.number(),
	})
		.index("by_org_id", ["org_id"])
		.index("by_org_id_and_user_id", ["org_id", "user_id"])
		.index("by_org_id_and_created_at", ["org_id", "created_at"])
		.index("by_org_id_and_record_id", ["org_id", "record_id"])
		.index("by_org_id_and_entity_affected", ["org_id", "entity_affected"]),
});
