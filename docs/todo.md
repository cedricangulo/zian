# Backend Todo

Scope: Convex backend and database only. Do not start frontend work until this list is done.

## 1) Foundation
- [x] Define the Convex schema in `convex/schema.ts` using a Convex-friendly, mostly normalized model.
- [x] Add/verify `convex/auth.config.ts` for Clerk JWT auth.
- [x] Add shared backend helpers for tenant scoping, role checks, and safe document access.
- [x] Set up indexes for all high-use queries, especially FEFO batch lookup and tenant-scoped listing.

## 2) Identity and Tenancy
- [x] Create organization provisioning flow tied to Clerk org creation.
- [x] Create user profile sync for authenticated users.
- [x] Store and enforce `org_id` on every tenant-owned table.
- [x] Add organization status and archive support.
- [x] Add role-based access control for Super Admin, ME Owner, and ME Staff.

## 3) Master Data
- [ ] Implement supplier CRUD.
- [ ] Implement category CRUD with parent-child support.
- [x] Implement product CRUD with SKU, base unit, product type, sellable flag, stock tracking, expiry tracking, and archived flag.
- [ ] Implement BOM/recipe storage for composite products.
- [x] Treat `products` as the single master catalog for raw materials, packaging, sellable goods, and composite items.

## 4) Inventory Intake
- [ ] Implement batch creation for inbound stock receipts.
- [ ] Store procurement cost, batch code, expiry date, received date, supplier, and quantities.
- [ ] Validate required expiry dates where applicable.
- [ ] Record inbound transactions and transaction items immutably.

## 5) Dispatch and FEFO
- [ ] Implement FEFO batch selection logic.
- [ ] Deduct stock across batches in the correct expiry/age order.
- [ ] Support composite item deduction through BOM recipe expansion.
- [ ] Generate dispatch data for a physical slip with only item names, quantities, and units.
- [ ] Make composite sales deduct ingredient stock from recipes instead of treating the finished item as a separate stock bucket.

## 6) Stock Adjustments
- [ ] Implement manual stock adjustment mutation.
- [ ] Require a reason code for every adjustment.
- [ ] Support spoilage, theft, damage, and correction reasons.
- [ ] Keep adjustment history immutable and traceable.

## 7) Audit and History
- [ ] Write audit log entries for every mutation that changes business data.
- [ ] Ensure audit logs are append-only.
- [ ] Add queries for owner/admin audit history views.

## 8) Analytics and Dashboards
- [ ] Add backend queries for asset valuation at cost.
- [ ] Add backend queries for dead stock analysis.
- [ ] Add platform usage and tenant health queries for Super Admin.
- [ ] Keep analytics queries tenant-safe and bounded.

## 9) Safety and Constraints
- [ ] Enforce the "no POS" rule in backend code paths.
- [ ] Block pricing, discounts, VAT, payments, and invoice generation logic.
- [ ] Prevent cross-tenant reads and writes in every function.
- [ ] Keep historical transactions immutable; create corrective records instead of edits.
- [ ] Avoid storing large nested arrays in documents; use child tables for repeating data.

## 10) Testing
- [x] Set up `vitest`, `convex-test`, and `@edge-runtime/vm` for Convex tests.
- [ ] Write tests for auth/tenant isolation.
- [ ] Write tests for FEFO batch deduction.
- [ ] Write tests for BOM deduction.
- [ ] Write tests for stock adjustments and audit logs.
- [ ] Write tests for dashboard queries and bounded results.

## 11) Backend Delivery
- [ ] Run backend tests and fix failures.
- [ ] Review schema and indexes for performance and integrity.
- [ ] Document backend APIs and function names for the frontend team.

## Edge Cases
- [ ] Prevent a user from accessing data after their organization is archived or suspended.
- [ ] Reject any write that omits `org_id` or tries to mix records from different tenants.
- [ ] Handle duplicate Clerk user/org sync events without creating duplicate users or organizations.
- [ ] Prevent negative stock after dispatches, adjustments, or concurrent writes.
- [ ] Define what happens when FEFO batches are expired, partially depleted, or have the same expiry date.
- [ ] Handle products that require expiry dates versus products that do not.
- [ ] Handle batch receipts with zero or fractional quantities only if the domain allows them.
- [ ] Reject dispatches when available stock cannot satisfy the full requested quantity.
- [ ] Handle BOMs with missing ingredients, circular references, or duplicate recipe lines.
- [ ] Prevent edits to past transactions, batches, and audit logs; use corrective transactions instead.
- [ ] Handle deleted/archived suppliers, categories, and products still referenced by historical records.
- [ ] Ensure audit logs are written even when a downstream business mutation partially fails.
- [ ] Keep dashboard queries bounded so large tenants do not cause unbounded reads.
- [ ] Handle concurrent stock deductions that target the same batch.
- [ ] Prevent accidental POS-like fields such as price, discount, tax, or payment from entering backend models.
