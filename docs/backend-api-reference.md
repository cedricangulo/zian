# Backend API Reference

Scope: Convex backend functions exposed to the frontend team.

## Reading Guide

- Responses are the direct values returned by Convex `query`, `mutation`, and `action` functions.
- IDs are Convex `Id<"...">` values. In client code they are serialized as strings.
- Timestamps are Unix epoch milliseconds.
- Optional fields may be omitted entirely instead of being returned as `null`.
- Errors are thrown as plain `Error` messages. There is no custom HTTP envelope.

## Access Model

| Helper | Purpose | Typical endpoints |
| --- | --- | --- |
| `requireCurrentContext` | Authenticated tenant member with an active org | list/get queries and tenant-scoped writes |
| `requireOwnerContext` | Tenant owner/admin only | catalog, recipes, audit, analytics |
| `requireSuperAdminContext` | Platform-wide super admin only | platform usage |

## Shared Response Models

### Product

```json
{
	"_id": "products_01",
	"_creationTime": 1710000000000,
	"org_id": "organizations_01",
	"category_id": "categories_01",
	"sku": "SUGAR-1KG",
	"name": "Sugar 1kg",
	"base_unit": "kg",
	"product_type": "raw_material",
	"sellable": false,
	"stock_tracked": true,
	"track_expiry": false,
	"is_bom": false,
	"min_stock_level": 10,
	"archived_at": 1710001234567
}
```

- `archived_at` is omitted until the product is archived.
- `category_id` is optional and omitted for uncategorized products.

### Category

```json
{
	"_id": "categories_01",
	"_creationTime": 1710000000000,
	"org_id": "organizations_01",
	"parent_category_id": "categories_00",
	"name": "Dry Goods"
}
```

- Root categories omit `parent_category_id`.

### Supplier

```json
{
	"_id": "suppliers_01",
	"_creationTime": 1710000000000,
	"org_id": "organizations_01",
	"name": "Metro Wholesale",
	"contact_first_name": "Ava",
	"contact_last_name": "Reyes",
	"phone_number": "+1-555-0100"
}
```

### RecipeLine

```json
{
	"_id": "recipes_01",
	"_creationTime": 1710000000000,
	"org_id": "organizations_01",
	"parent_product_id": "products_10",
	"ingredient_product_id": "products_11",
	"quantity_required": 2.5
}
```

### Batch

```json
{
	"_id": "batches_01",
	"_creationTime": 1710000000000,
	"org_id": "organizations_01",
	"product_id": "products_01",
	"supplier_id": "suppliers_01",
	"batch_code": "BATCH-2026-001",
	"cost_price": 12.5,
	"initial_qty": 100,
	"remaining_qty": 82,
	"expiry_date": 1712592000000,
	"received_at": 1710000000000
}
```

### Transaction

```json
{
	"_id": "transactions_01",
	"_creationTime": 1710000000000,
	"org_id": "organizations_01",
	"user_id": "users_01",
	"movement_type": "dispatch",
	"event_reason": "sale",
	"created_at": 1710000000000
}
```

### TransactionItem

```json
{
	"_id": "transaction_items_01",
	"_creationTime": 1710000000000,
	"org_id": "organizations_01",
	"transaction_id": "transactions_01",
	"product_id": "products_01",
	"batch_id": "batches_01",
	"product_name_snapshot": "Sugar 1kg",
	"base_unit_snapshot": "kg",
	"quantity": 18,
	"cost_at_event": 12.5,
	"created_at": 1710000000000
}
```

### AuditLog

```json
{
	"_id": "audit_logs_01",
	"_creationTime": 1710000000000,
	"org_id": "organizations_01",
	"user_id": "users_01",
	"action_type": "create",
	"entity_affected": "products",
	"record_id": "products_01",
	"change_log": {
		"next": {
			"sku": "SUGAR-1KG"
		}
	},
	"created_at": 1710000000000,
	"user_name": "Ava Reyes",
	"user_email": "ava@example.com"
}
```

- `change_log` is arbitrary JSON and may contain `previous`, `next`, or both.
- Audit responses are enriched with `user_name` and `user_email`.

### DispatchSlipItem

```json
{
	"product_name": "Sugar 1kg",
	"base_unit": "kg",
	"quantity": 18
}
```

### AssetValuationItem

```json
{
	"product_id": "products_01",
	"product_name": "Sugar 1kg",
	"sku": "SUGAR-1KG",
	"base_unit": "kg",
	"remaining_qty": 82,
	"total_value": 1025
}
```

### DispatchValueItem

```json
{
	"product_id": "products_01",
	"product_name": "Sugar 1kg",
	"sku": "SUGAR-1KG",
	"base_unit": "kg",
	"quantity": 18,
	"total_value": 225
}
```

### ExpiringBatchItem

```json
{
	"batch_id": "batches_01",
	"batch_code": "BATCH-2026-001",
	"product_id": "products_01",
	"product_name": "Milk",
	"sku": "MILK-500ML",
	"base_unit": "L",
	"remaining_qty": 82,
	"expiry_date": 1712592000000,
	"days_until_expiry": 2,
	"urgency": "critical"
}
```

### ProcurementTrendItem

```json
{
	"product_id": "products_01",
	"product_name": "Arabica Coffee",
	"sku": "COF-ARAB-1KG",
	"current_cost_price": 120,
	"previous_month_cost_price": 100,
	"cost_change": 20,
	"cost_change_percent": 20,
	"price_trend": "increased"
}
```

### LowStockItem

```json
{
	"product_id": "products_01",
	"product_name": "Sugar",
	"sku": "SUGAR-1KG",
	"base_unit": "kg",
	"current_stock_qty": 4,
	"min_stock_level": 10,
	"stock_deficit": 6
}
```

### ManualAdjustmentLog

```json
{
	"transaction_id": "transactions_01",
	"batch_code": "BATCH-2026-001",
	"product_name": "Tomatoes",
	"adjusted_qty": -5,
	"reason": "spoilage",
	"created_at": 1710000000000,
	"user_name": "Ava Reyes"
}
```

### DeadStockItem

```json
{
	"batch_id": "batches_01",
	"batch_code": "BATCH-2026-001",
	"product_id": "products_01",
	"product_name": "Sugar 1kg",
	"sku": "SUGAR-1KG",
	"base_unit": "kg",
	"remaining_qty": 82,
	"cost_price": 12.5,
	"dead_stock_value": 1025,
	"received_at": 1710000000000,
	"days_in_stock": 120,
	"expiry_date": 1712592000000
}
```

### InventoryProductItem

```json
{
	"product_id": "products_01",
	"product_name": "Egg",
	"sku": "RAW-EGG-01",
	"category": "Food",
	"product_type": "raw_material",
	"base_unit": "pcs",
	"current_stock_qty": 89,
	"asset_value": 1180,
	"status": "good",
	"batch_count": 2,
	"min_stock_level": 20
}
```

- `status` is one of: `"good"`, `"low_stock"`, `"out_of_stock"`, `"expiring"`, `"expired"`
- `category` prioritizes the user-assigned category over the product type.

### BatchDetail

```json
{
	"batch_id": "batches_01",
	"batch_code": "BCH-01",
	"quantity": 89,
	"base_unit": "pcs",
	"batch_value": 480,
	"status": "expiring",
	"expiry_date": 1712592000000,
	"received_at": 1710000000000,
	"cost_price": 5.4
}
```

- `status` is one of: `"good"`, `"expiring"`, `"expired"`, `"depleted"`
- `expiry_date` and `received_at` are timestamps; omitted if not tracked.
- A batch is `"expiring"` if its expiry date is within 7 days.

### InventoryTotals

```json
{
	"total_asset_value": 50000,
	"total_skus": 45,
	"total_dispatch_value": 12500
}
```

### PlatformTenantSummary

```json
{
	"org_id": "organizations_01",
	"clerk_org_id": "org_abc123",
	"name": "Metro Cafe",
	"status": "active",
	"user_count": 4
}
```

## Endpoint Reference

### Bootstrap

#### `api.bootstrap.syncCurrentClerkOrg`

- Type: mutation
- Access: authenticated user with an active Clerk org
- Args: `{}`
- Returns: `Id<"organizations">`
- Success response example:

```json
"organizations_01"
```

- Behavior:
	- Reuses an existing active organization when `clerk_org_id` already exists.
	- Creates `organizations` and `users` rows if they do not exist.
	- Maps Clerk org admin role to `owner`; all other members become `staff`.
- Errors:
	- `Active organization required`
	- auth errors when the Clerk identity is missing

### Catalog

#### `api.catalog.listProducts`

- Type: query
- Access: tenant-scoped via `requireCurrentContext`
- Args: `{}`
- Returns: `Product[]`
- Response shape: up to 100 raw `products` documents
- Notes:
	- Archived products are included because the query does not filter on `archived_at`.
	- Uses `products.by_org_id`.

#### `api.catalog.getProductById`

- Type: query
- Access: tenant-scoped via `requireCurrentContext`
- Args:
	- `product_id: Id<"products">`
- Returns: `Product`
- Response shape: one raw `products` document
- Errors:
	- `Product not found in your organization`

#### `api.catalog.createProduct`

- Type: mutation
- Access: owner/admin only
- Args:
	- `category_id?: Id<"categories">`
	- `sku: string`
	- `name: string`
	- `base_unit: string`
	- `product_type: "raw_material" | "packaging" | "sellable" | "composite"`
	- `sellable: boolean`
	- `stock_tracked: boolean`
	- `track_expiry: boolean`
	- `is_bom: boolean`
	- `min_stock_level: number`
- Returns: `Id<"products">`
- Success response example:

```json
"products_01"
```

- Errors:
	- `Category not found in your organization`
	- `SKU already exists in your organization`

#### `api.catalog.updateProduct`

- Type: mutation
- Access: owner/admin only
- Args: same shape as `createProduct`, plus `product_id: Id<"products">`
- Returns: `Id<"products">`
- Success response example:

```json
"products_01"
```

- Notes:
	- A `category_id` value of `null` clears the category.
	- Audit logs are written only when the computed delta is non-empty.
- Errors:
	- `Product not found in your organization`
	- `Category not found in your organization`
	- `SKU already exists in your organization`

#### `api.catalog.archiveProduct`

- Type: mutation
- Access: owner/admin only
- Args:
	- `product_id: Id<"products">`
- Returns: `Id<"products">`
- Success response example:

```json
"products_01"
```

- Notes:
	- This is a soft archive. The record stays in place and `archived_at` is set.
	- The response is just the archived product id.

### Categories

#### `api.categories.listCategories`

- Type: query
- Access: tenant-scoped via `requireCurrentContext`
- Args: `{}`
- Returns: `Category[]`
- Response shape: up to 100 raw `categories` documents

#### `api.categories.getCategoryById`

- Type: query
- Access: tenant-scoped via `requireCurrentContext`
- Args:
	- `category_id: Id<"categories">`
- Returns: `Category`
- Errors:
	- `Category not found in your organization`

#### `api.categories.createCategory`

- Type: mutation
- Access: owner/admin only
- Args:
	- `name: string`
	- `parent_category_id?: Id<"categories">`
- Returns: `Id<"categories">`
- Success response example:

```json
"categories_01"
```

- Errors:
	- `Parent category not found in your organization`

#### `api.categories.updateCategory`

- Type: mutation
- Access: owner/admin only
- Args:
	- `category_id: Id<"categories">`
	- `name: string`
	- `parent_category_id: Id<"categories"> | null`
- Returns: `Id<"categories">`
- Notes:
	- `null` clears the parent category.
	- The function rejects self-parenting and cycles.
- Errors:
	- `Category not found in your organization`
	- `Category cannot be its own parent`
	- `Category hierarchy cannot contain cycles`
	- `Parent category not found in your organization`

#### `api.categories.archiveCategory`

- Type: mutation
- Access: owner/admin only
- Args:
	- `category_id: Id<"categories">`
- Returns: `Id<"categories">`
- Notes:
	- Current implementation performs a hard delete after referential checks.
	- It rejects categories referenced by products or child categories.

#### `api.categories.deleteCategory`

- Type: mutation
- Access: owner/admin only
- Args:
	- `category_id: Id<"categories">`
- Returns: `Id<"categories">`
- Notes:
	- Identical delete behavior to `archiveCategory` in the current implementation.

### Suppliers

#### `api.suppliers.listSuppliers`

- Type: query
- Access: tenant-scoped via `requireCurrentContext`
- Args: `{}`
- Returns: `Supplier[]`
- Response shape: up to 100 raw `suppliers` documents

#### `api.suppliers.getSupplierById`

- Type: query
- Access: tenant-scoped via `requireCurrentContext`
- Args:
	- `supplier_id: Id<"suppliers">`
- Returns: `Supplier`
- Errors:
	- `Supplier not found in your organization`

#### `api.suppliers.createSupplier`

- Type: mutation
- Access: owner/admin only
- Args:
	- `name: string`
	- `contact_first_name?: string`
	- `contact_last_name?: string`
	- `phone_number?: string`
- Returns: `Id<"suppliers">`
- Success response example:

```json
"suppliers_01"
```

#### `api.suppliers.updateSupplier`

- Type: mutation
- Access: owner/admin only
- Args: same shape as `createSupplier`, plus `supplier_id: Id<"suppliers">`
- Returns: `Id<"suppliers">`
- Errors:
	- `Supplier not found in your organization`

#### `api.suppliers.archiveSupplier`

- Type: mutation
- Access: owner/admin only
- Args:
	- `supplier_id: Id<"suppliers">`
- Returns: `Id<"suppliers">`
- Notes:
	- Current implementation performs a hard delete after referential checks.
	- It rejects suppliers referenced by batches.

#### `api.suppliers.deleteSupplier`

- Type: mutation
- Access: owner/admin only
- Args:
	- `supplier_id: Id<"suppliers">`
- Returns: `Id<"suppliers">`
- Notes:
	- Identical delete behavior to `archiveSupplier` in the current implementation.

### Recipes

#### `api.recipes.listRecipeLines`

- Type: query
- Access: tenant-scoped via `requireCurrentContext`
- Args:
	- `parent_product_id: Id<"products">`
- Returns: `RecipeLine[]`
- Response shape: up to 200 raw `recipes` documents for one parent product
- Errors:
	- `Parent product not found in your organization`

#### `api.recipes.addRecipeLine`

- Type: mutation
- Access: owner/admin only
- Args:
	- `parent_product_id: Id<"products">`
	- `ingredient_product_id: Id<"products">`
	- `quantity_required: number`
- Returns: `Id<"recipes">`
- Success response example:

```json
"recipes_01"
```

- Errors:
	- `Parent product cannot reference itself as an ingredient`
	- `Quantity required must be greater than zero`
	- `Parent product not found in your organization`
	- `Parent product is not recipe-capable`
	- `Ingredient product not found in your organization`
	- `Ingredient already exists in this recipe`
	- `Recipe cannot create BOM cycles`

#### `api.recipes.updateRecipeLine`

- Type: mutation
- Access: owner/admin only
- Args:
	- `recipe_id: Id<"recipes">`
	- `quantity_required: number`
- Returns: `Id<"recipes">`
- Errors:
	- `Quantity required must be greater than zero`
	- `Recipe line not found in your organization`

#### `api.recipes.removeRecipeLine`

- Type: mutation
- Access: owner/admin only
- Args:
	- `recipe_id: Id<"recipes">`
- Returns: `Id<"recipes">`
- Errors:
	- `Recipe line not found in your organization`

#### `api.recipes.replaceRecipeLines`

- Type: mutation
- Access: owner/admin only
- Args:
	- `parent_product_id: Id<"products">`
	- `lines: Array<{ ingredient_product_id: Id<"products">; quantity_required: number }>`
- Returns:
	- `parent_product_id: Id<"products">`
	- `replaced_count: number`
- Success response example:

```json
{
	"parent_product_id": "products_10",
	"replaced_count": 3
}
```

- Notes:
	- Validates duplicates, self-reference, positive quantities, and BOM cycles.
	- Deletes all existing lines for the parent before inserting the replacement set.
- Errors:
	- `Too many recipe lines`
	- `Parent product not found in your organization`
	- `Parent product is not recipe-capable`
	- `Duplicate ingredient found in recipe lines`
	- `Ingredient product not found in your organization`
	- `Recipe cannot create BOM cycles`

### Inventory Intake

#### `api.inventory.createInboundReceipt`

- Type: mutation
- Access: authenticated tenant member
- Args:
	- `product_id: Id<"products">`
	- `supplier_id?: Id<"suppliers">`
	- `batch_code: string`
	- `cost_price: number`
	- `quantity: number`
	- `expiry_date?: number`
	- `received_at?: number`
- Returns:
	- `transaction_id: Id<"transactions">`
	- `batch_id: Id<"batches">`
	- `batch_code: string`
	- `received_at: number`
- Success response example:

```json
{
	"transaction_id": "transactions_01",
	"batch_id": "batches_01",
	"batch_code": "BATCH-2026-001",
	"received_at": 1710000000000
}
```

- Behavior:
	- Creates one batch, one inbound transaction, one transaction item, and one audit log entry.
	- Requires an expiry date when the product tracks expiry.
	- Normalizes the batch code by trimming whitespace.
- Errors:
	- `Batch code is required`
	- `Cost price must be greater than zero`
	- `Quantity must be greater than zero`
	- `Received date is invalid`
	- `Expiry date is invalid`
	- `Product not found in your organization`
	- `Expiry date required for this product`
	- `Supplier not found in your organization`
	- `Batch code already exists in your organization`

#### `api.inventory.getLowStockItems`

- Type: query
- Access: owner/admin only
- Args:
	- `limit?: number`
- Returns:
	- `low_stock_items: LowStockItem[]`
	- `total_items: number`
- Success response example:

```json
{
	"low_stock_items": [
		{
			"product_id": "products_01",
			"product_name": "Sugar",
			"sku": "SUGAR-1KG",
			"base_unit": "kg",
			"current_stock_qty": 4,
			"min_stock_level": 10,
			"stock_deficit": 6
		}
	],
	"total_items": 1
}
```

- Notes:
	- The query only returns stocked, non-archived products with `min_stock_level > 0`.
	- `limit` defaults to 50 and is capped at 200.

#### `api.inventory.listInventoryProducts`

- Type: query
- Access: owner/admin only
- Args:
	- `limit?: number` (defaults to 200, capped at 500)
	- `status?: "good" | "low_stock" | "out_of_stock" | "expiring" | "expired"`
- Returns:
	- `totals: InventoryTotals`
	- `items: InventoryProductItem[]`
- Success response example:

```json
{
	"totals": {
		"total_asset_value": 50000,
		"total_skus": 45,
		"total_dispatch_value": 12500
	},
	"items": [
		{
			"product_id": "products_01",
			"product_name": "Egg",
			"sku": "RAW-EGG-01",
			"category": "Food",
			"product_type": "raw_material",
			"base_unit": "pcs",
			"current_stock_qty": 89,
			"asset_value": 1180,
			"status": "good",
			"batch_count": 2,
			"min_stock_level": 20
		}
	]
}
```

- Behavior:
	- Returns all stocked, non-archived products with stock tracking enabled.
	- Includes dispatch value aggregation and asset valuation.
	- Status considers min stock level, expiry dates, and current stock.
	- Optional status filter narrows results to products matching that status.
- Notes:
	- Batches with `remaining_qty <= 0` are excluded from aggregation.
	- A product is `"expiring"` if any batch expires within 7 days.
	- A product is `"expired"` if any batch has passed expiry.

#### `api.inventory.getProductBatches`

- Type: query
- Access: owner/admin only
- Args:
	- `product_id: Id<"products">`
	- `limit?: number` (defaults to 100, capped at 500)
	- `include_depleted?: boolean` (defaults to false)
- Returns:
	- `product: { product_id, product_name, sku, category, product_type, base_unit, min_stock_level }`
	- `batches: BatchDetail[]`
	- `total_batches: number`
	- `total_batch_value: number`
- Success response example:

```json
{
	"product": {
		"product_id": "products_01",
		"product_name": "Egg",
		"sku": "RAW-EGG-01",
		"category": "Food",
		"product_type": "raw_material",
		"base_unit": "pcs",
		"min_stock_level": 20
	},
	"batches": [
		{
			"batch_id": "batches_01",
			"batch_code": "BCH-01",
			"quantity": 89,
			"base_unit": "pcs",
			"batch_value": 480,
			"status": "expiring",
			"expiry_date": 1712592000000,
			"received_at": 1710000000000,
			"cost_price": 5.4
		}
	],
	"total_batches": 2,
	"total_batch_value": 979
}
```

- Behavior:
	- Returns all batches for a product ordered by expiry date (FEFO: earliest first).
	- Excludes depleted batches (`remaining_qty <= 0`) unless `include_depleted=true`.
	- Includes batch values and expiry/status information.
- Errors:
	- `Product not found in your organization` (cross-tenant access attempted or product archived)

### Dispatch

#### `api.dispatch.createDispatch`

- Type: mutation
- Access: authenticated tenant member
- Args:
	- `items: Array<{ product_id: Id<"products">; quantity: number }>`
	- `event_reason?: "sale" | "recipe_consumption"`
- Returns:
	- `transaction_id: Id<"transactions">`
	- `dispatched_at: number`
	- `slip: DispatchSlipItem[]`
- Success response example:

```json
{
	"transaction_id": "transactions_01",
	"dispatched_at": 1710000000000,
	"slip": [
		{
			"product_name": "Sugar 1kg",
			"base_unit": "kg",
			"quantity": 18
		}
	]
}
```

- Behavior:
	- Expands composite products into ingredient requirements before stock deduction.
	- Deducts batches in FEFO order.
	- Aggregates the slip by product so the frontend sees a physical dispatch list only.
	- Does not include pricing, discounts, VAT, or payment data.
- Errors:
	- `Dispatch must contain at least one item`
	- `Too many items in a single dispatch`
	- `Dispatch quantity must be greater than zero`
	- `Product not found in your organization`
	- `Product "..." is archived`
	- `Composite product "..." has no recipe lines`
	- `Ingredient not found for recipe of "..."`
	- `Insufficient stock for product "...". Short by ...`

#### `api.dispatch.getDispatchSlip`

- Type: query
- Access: tenant-scoped via `requireCurrentContext`
- Args:
	- `transaction_id: Id<"transactions">`
- Returns:
	- `transaction_id: Id<"transactions">`
	- `movement_type: "dispatch"`
	- `event_reason: "sale" | "recipe_consumption"`
	- `created_at: number`
	- `slip: DispatchSlipItem[]`
- Success response example:

```json
{
	"transaction_id": "transactions_01",
	"movement_type": "dispatch",
	"event_reason": "sale",
	"created_at": 1710000000000,
	"slip": [
		{
			"product_name": "Sugar 1kg",
			"base_unit": "kg",
			"quantity": 18
		}
	]
}
```

- Errors:
	- `Transaction not found in your organization`
	- `Transaction is not a dispatch`

### Adjustments

#### `api.adjustments.createAdjustment`

- Type: mutation
- Access: authenticated tenant member
- Args:
	- `batch_id: Id<"batches">`
	- `adjusted_qty: number`
	- `reason: "spoilage" | "damage" | "theft" | "correction"`
	- `notes?: string`
- Returns:
	- `transaction_id: Id<"transactions">`
	- `batch_id: Id<"batches">`
	- `previous_qty: number`
	- `adjusted_qty: number`
	- `delta: number`
- Success response example:

```json
{
	"transaction_id": "transactions_01",
	"batch_id": "batches_01",
	"previous_qty": 82,
	"adjusted_qty": 75,
	"delta": -7
}
```

- Notes:
	- `delta` is positive when stock increases and negative when stock decreases.
	- The whole transaction is atomic; batch stock, transaction rows, and audit log stay in sync.
- Errors:
	- `Adjusted quantity must be a non-negative number`
	- `Batch not found in your organization`
	- `Adjusted quantity matches current stock; no adjustment needed`
	- `Product not found in your organization`

#### `api.adjustments.listAdjustments`

- Type: query
- Access: tenant-scoped via `requireCurrentContext`
- Args:
	- `batch_id?: Id<"batches">`
	- `limit?: number`
- Returns:
	- When `batch_id` is provided: `TransactionItem[]`
	- When `batch_id` is omitted: `Transaction[]` filtered to `movement_type = "adjustment"`
- Response shape:
	- Batch-scoped view returns transaction items for that batch, ordered newest first.
	- Org-wide view returns adjustment transactions, ordered newest first.
- Notes:
	- `limit` defaults to 50 and is capped at 200.
	- The batch-scoped branch currently returns all transaction items for the batch, not a separate adjustment envelope.

#### `api.adjustments.getManualAdjustmentsSummary`

- Type: query
- Access: owner/admin only
- Args:
	- `limit?: number`
- Returns:
	- `total_adjustments_today: number`
	- `total_adjustments_this_week: number`
	- `total_adjustments_this_month: number`
	- `recent_logs: ManualAdjustmentLog[]`
- Success response example:

```json
{
	"total_adjustments_today": 2,
	"total_adjustments_this_week": 5,
	"total_adjustments_this_month": 12,
	"recent_logs": [
		{
			"transaction_id": "transactions_01",
			"batch_code": "BATCH-2026-001",
			"product_name": "Tomatoes",
			"adjusted_qty": -5,
			"reason": "spoilage",
			"created_at": 1710000000000,
			"user_name": "Ava Reyes"
		}
	]
}
```

- Notes:
	- The summary is built from adjustment transactions and their linked transaction items.
	- `limit` defaults to 25 and is capped at 100.

### Audit

#### `api.audit.listAuditLogs`

- Type: query
- Access: owner/admin only
- Args:
	- `entity_affected?: string`
	- `limit?: number`
- Returns: `EnrichedAuditLog[]`
- Response shape: audit log rows enriched with `user_name` and `user_email`
- Notes:
	- `limit` defaults to 50 and is capped at 200.
	- When `entity_affected` is provided, the query uses the entity index.
	- When it is omitted, the query returns the most recent logs by `created_at`.

#### `api.audit.getAuditLogsByRecord`

- Type: query
- Access: owner/admin only
- Args:
	- `record_id: string`
	- `limit?: number`
- Returns: `EnrichedAuditLog[]`
- Response shape: audit log rows for one record, enriched with user display data
- Notes:
	- `limit` defaults to 50 and is capped at 200.

### Analytics

#### `api.analytics.getAssetValuation`

- Type: query
- Access: owner/admin only
- Args:
	- `limit?: number`
- Returns:
	- `grand_total_value: number`
	- `active_batch_count: number`
	- `product_count: number`
	- `breakdown: AssetValuationItem[]`
- Success response example:

```json
{
	"grand_total_value": 1025,
	"active_batch_count": 18,
	"product_count": 7,
	"breakdown": [
		{
			"product_id": "products_01",
			"product_name": "Sugar 1kg",
			"sku": "SUGAR-1KG",
			"base_unit": "kg",
			"remaining_qty": 82,
			"total_value": 1025
		}
	]
}
```

- Notes:
	- The response is a bounded snapshot, not an unbounded warehouse valuation scan.
	- `limit` defaults to 1000 and is capped at 1000.

#### `api.analytics.getDispatchValue`

- Type: query
- Access: owner/admin only
- Args:
	- `range?: "today" | "week" | "month" | "all"`
	- `limit?: number`
- Returns:
	- `range: "today" | "week" | "month" | "all"`
	- `from_timestamp: number | null`
	- `total_dispatch_value: number`
	- `dispatch_count: number`
	- `item_count: number`
	- `breakdown: DispatchValueItem[]`
- Success response example:

```json
{
	"range": "all",
	"from_timestamp": null,
	"total_dispatch_value": 225,
	"dispatch_count": 1,
	"item_count": 1,
	"breakdown": [
		{
			"product_id": "products_01",
			"product_name": "Sugar 1kg",
			"sku": "SUGAR-1KG",
			"base_unit": "kg",
			"quantity": 18,
			"total_value": 225
		}
	]
}
```

- Notes:
	- The query sums `transaction_items.quantity * transaction_items.cost_at_event` for dispatch transactions.
	- `range` is applied against `transactions.created_at`.
	- `limit` defaults to 1000 and is capped at 2000.

#### `api.analytics.getExpiringBatches`

- Type: query
- Access: owner/admin only
- Args:
	- `days_threshold?: number`
	- `limit?: number`
- Returns:
	- `days_threshold: number`
	- `batches_expiring_soon: ExpiringBatchItem[]`
	- `count_critical: number`
	- `count_warning: number`
	- `count_watch: number`
- Success response example:

```json
{
	"days_threshold": 14,
	"batches_expiring_soon": [
		{
			"batch_id": "batches_01",
			"batch_code": "BATCH-2026-001",
			"product_id": "products_01",
			"product_name": "Milk",
			"sku": "MILK-500ML",
			"base_unit": "L",
			"remaining_qty": 82,
			"expiry_date": 1712592000000,
			"days_until_expiry": 2,
			"urgency": "critical"
		}
	],
	"count_critical": 1,
	"count_warning": 0,
	"count_watch": 0
}
```

- Notes:
	- `days_threshold` defaults to 14 and is capped at 90.
	- The query excludes depleted batches and batches without an expiry date.

#### `api.analytics.getProcurementCostTrends`

- Type: query
- Access: owner/admin only
- Args:
	- `months_back?: number`
	- `limit?: number`
	- `min_price_change_percent?: number`
- Returns:
	- `months_back: number`
	- `date_range: { current_month: string; previous_month: string }`
	- `trends: ProcurementTrendItem[]`
- Success response example:

```json
{
	"months_back": 1,
	"date_range": {
		"current_month": "2026-04",
		"previous_month": "2026-03"
	},
	"trends": [
		{
			"product_id": "products_01",
			"product_name": "Arabica Coffee",
			"sku": "COF-ARAB-1KG",
			"current_cost_price": 120,
			"previous_month_cost_price": 100,
			"cost_change": 20,
			"cost_change_percent": 20,
			"price_trend": "increased"
		}
	]
}
```

- Notes:
	- The query compares the latest batch received in the current month to the latest batch received in the comparison month.
	- `months_back` defaults to 1 and is capped at 12.
	- `min_price_change_percent` filters out small changes.

#### `api.analytics.getDeadStock`

- Type: query
- Access: owner/admin only
- Args:
	- `days_threshold?: number`
	- `limit?: number`
- Returns:
	- `dead_stock: DeadStockItem[]`
	- `total_dead_stock_value: number`
- Success response example:

```json
{
	"dead_stock": [
		{
			"batch_id": "batches_01",
			"batch_code": "BATCH-2026-001",
			"product_id": "products_01",
			"product_name": "Sugar 1kg",
			"sku": "SUGAR-1KG",
			"base_unit": "kg",
			"remaining_qty": 82,
			"cost_price": 12.5,
			"dead_stock_value": 1025,
			"received_at": 1710000000000,
			"days_in_stock": 120,
			"expiry_date": 1712592000000
		}
	],
	"total_dead_stock_value": 1025
}
```

- Notes:
	- `days_threshold` defaults to 90.
	- `limit` defaults to 200 and is capped at 500.
	- The query evaluates the oldest stock first using `batches.by_org_id_and_received_at`.

### Admin

#### `api.admin.getPlatformUsage`

- Type: query
- Access: super admin only
- Args:
	- `limit?: number`
- Returns:
	- `total_organizations: number`
	- `active_organizations: number`
	- `suspended_organizations: number`
	- `archived_organizations: number`
	- `total_users: number`
	- `tenants: PlatformTenantSummary[]`
- Success response example:

```json
{
	"total_organizations": 12,
	"active_organizations": 10,
	"suspended_organizations": 1,
	"archived_organizations": 1,
	"total_users": 37,
	"tenants": [
		{
			"org_id": "organizations_01",
			"clerk_org_id": "org_abc123",
			"name": "Metro Cafe",
			"status": "active",
			"user_count": 4
		}
	]
}
```

- Notes:
	- `limit` defaults to 500 and is capped at 500.
	- `user_count` is bounded by the implementation's `take(201)` guard. A count of `201` means the tenant has at least 201 users.

## Backend Notes For Frontend

- There are no backend pricing, discount, VAT, payment, or invoice functions.
- Dispatch slips intentionally omit pricing data.
- All list and detail calls are tenant-scoped; the frontend should never pass org identifiers for authorization.
- `api.adjustments.listAdjustments` has two response shapes depending on whether `batch_id` is provided.
- `archiveCategory` and `archiveSupplier` currently perform referentially safe hard deletes because those tables do not have archive flags.
- The main dashboard queries are `getAssetValuation`, `getDispatchValue`, `getExpiringBatches`, `getProcurementCostTrends`, `getDeadStock`, and `getManualAdjustmentsSummary`.

## Schema And Index Review

- `products.by_org_id_and_sku` supports tenant-local SKU uniqueness checks.
- `batches.by_org_id_and_product_id_and_expiry_date` supports FEFO dispatch ordering.
- `batches.by_org_id_and_received_at` supports dead-stock analysis by evaluating oldest stock first.
- `audit_logs.by_org_id_and_record_id` supports direct per-record audit lookup.
- `audit_logs.by_org_id_and_entity_affected` supports entity-filtered audit browsing.