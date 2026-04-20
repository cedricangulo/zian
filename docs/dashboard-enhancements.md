# Dashboard Enhancements - Backend Queries Plan

## Overview
This document outlines the backend query additions needed to support comprehensive dashboard metrics for the owner dashboard, including analytics, cost trends, reorder management, and expiry monitoring.

**Scope:** Backend Convex queries only  
**Focus:** 5 new queries to power future dashboard features  
**No:** Frontend changes, schema modifications, or mock data updates

---

## 1. Backend Queries to Add (Convex)

### 1.1 `getDispatchValue()` Query
**File:** `convex/analytics.ts`
- **Purpose:** Calculate total dispatch transaction value
- **Returns:** 
  ```typescript
  {
    total_dispatch_value: number;
    dispatch_count: number;
    breakdown: {
      product_id: Id<"products">;
      product_name: string;
      sku: string;
      quantity: number;
      total_value: number;
    }[];
  }
  ```
- **Logic:** Sum `transaction_items.cost_at_event * quantity` where `transactions.movement_type = "dispatch"`
- **Optional Args:** `time_range` (today, week, month, all), `limit`

### 1.2 `getManualAdjustmentsSummary()` Query
**File:** `convex/adjustments.ts`
- **Purpose:** Get summary of manual adjustments for KPI card
- **Returns:**
  ```typescript
  {
    total_adjustments_today: number;
    total_adjustments_this_week: number;
    total_adjustments_this_month: number;
    recent_logs: {
      batch_code: string;
      product_name: string;
      adjusted_qty: number;
      reason: string;
      created_at: number;
      user_name: string;
    }[];
  }
  ```
- **Logic:** Query `transactions` where `movement_type = "adjustment"` and filter by date
- **Optional Args:** `limit`, `days`

### 1.3 `getExpiringBatches()` Query
**File:** `convex/analytics.ts`
- **Purpose:** Get batches expiring soon for "Critical Expiry Watch"
- **Returns:**
  ```typescript
  {
    batches_expiring_soon: {
      batch_id: Id<"batches">;
      batch_code: string;
      product_id: Id<"products">;
      product_name: string;
      sku: string;
      remaining_qty: number;
      base_unit: string;
      expiry_date: number;
      days_until_expiry: number;
      urgency: "critical" | "warning" | "watch"; // critical: 0-2 days, warning: 3-7 days, watch: 8-14 days
    }[];
    count_critical: number;
    count_warning: number;
    count_watch: number;
  }
  ```
- **Logic:** Filter batches where `expiry_date` is within next 14 days and `remaining_qty > 0`
- **Optional Args:** `days_threshold` (default 14), `limit`

### 1.4 `getLowStockItems()` Query
**File:** `convex/inventory.ts` or new file
- **Purpose:** Get items below min_stock_level for "Items to Order"
- **Returns:**
  ```typescript
  {
    low_stock_items: {
      product_id: Id<"products">;
      product_name: string;
      sku: string;
      base_unit: string;
      current_stock_qty: number;
      min_stock_level: number;
      stock_deficit: number;
    }[];
    total_items: number;
  }
  ```
- **Logic:** 
  - Sum all `batches.remaining_qty` per product
  - Compare against `products.min_stock_level`
  - Include only products where current < min_level
- **Optional Args:** `limit`, `sort_by` (deficit_amount, product_name)

### 1.5 `getProcurementCostTrends()` Query
**File:** `convex/analytics.ts`
- **Purpose:** Track cost price changes for products month-over-month
- **Returns:**
  ```typescript
  {
    trends: {
      product_id: Id<"products">;
      product_name: string;
      sku: string;
      current_cost_price: number;
      previous_month_cost_price: number;
      cost_change: number; // positive = price increase
      cost_change_percent: number;
      price_trend: "increased" | "decreased" | "stable";
    }[];
    date_range: {
      current_month: string; // "YYYY-MM"
      previous_month: string;
    };
  }
  ```
- **Logic:**
  - Get most recent batch received in current month per product → current price
  - Get most recent batch received in previous month per product → previous price
  - Calculate delta and percentage
  - Only include products that have batches in both months (or at least one month)
- **Optional Args:** `months_back` (default 1), `limit`, `min_price_change_percent` (to filter noise)

---

## 2. Data Dependencies & Schema Changes

### No Schema Changes Required
All data is already available in existing tables:
- `batches` - Has expiry_date, received_at, remaining_qty, cost_price
- `products` - Has min_stock_level, sku, name, base_unit
- `transactions` - Has movement_type, created_at, cost tracking via transaction_items
- `transaction_items` - Has cost_at_event for cost tracking
- `audit_logs` - Can track adjustments (already tracked in transactions)

### Optional: Add to Schema for Better Performance
If querying becomes slow:
- Add index on `batches`: `by_org_id_and_expiry_date_and_remaining_qty`
- Add index on `products`: `by_org_id_and_min_stock_level`
- Consider denormalizing adjustment count on transactions table

---

## 3. Implementation Order (Priority)

### Phase 1: Core KPI Queries
- [ ] Implement `getDispatchValue()` query in `convex/analytics.ts`
- [ ] Implement `getManualAdjustmentsSummary()` query in `convex/adjustments.ts`

### Phase 2: Critical Business Queries
- [ ] Implement `getExpiringBatches()` query in `convex/analytics.ts`
- [ ] Implement `getLowStockItems()` query in `convex/inventory.ts`

### Phase 3: Cost Analysis Query
- [ ] Implement `getProcurementCostTrends()` query in `convex/analytics.ts`

### Phase 4: Testing & Validation
- [ ] Write unit tests for each query in `.test.ts` files
- [ ] Test edge cases: No data, expired batches, cost changes with decimals
- [ ] Validate performance with Convex insights

---

## 4. Testing Strategy

### Backend Query Testing
- Mock organizations and test data in `test-utils.test.ts`
- Write unit tests for each query: `.test.ts` files
- Test edge cases: No data, expired batches, cost changes with decimals
- Verify no N+1 queries using Convex insights

---

## 5. Success Criteria

✅ All 5 queries implemented and tested
✅ `getDispatchValue()` returns accurate transaction sums
✅ `getManualAdjustmentsSummary()` filters by date correctly
✅ `getExpiringBatches()` categorizes urgency levels properly
✅ `getLowStockItems()` correctly identifies items below min threshold
✅ `getProcurementCostTrends()` calculates month-over-month changes
✅ All queries follow Convex guidelines and best practices
✅ No N+1 queries or performance issues
✅ Unit tests pass with 100% coverage
