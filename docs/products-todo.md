# Products Frontend Todo

Purpose: implement a safe unseeded workflow for Products while preserving the staged dispatch UX and restoring the center-input quantity control using local shadcn primitives.

## Current Problem
- Products currently hits Convex listProducts immediately.
- In unseeded or org-not-ready environments, Convex throws Active organization required.
- Result: Products page crashes before users can work with the UI.

## Decisions
- Use mock data as primary source until seed/setup is complete.
- In mock mode, dispatch submit uses local mock submit behavior.
- Keep Convex path available behind a source switch for later re-enable.
- Skip build checks for now; use diagnostics and runtime/manual checks.

## Constraints
- Do not remove Convex integration code; keep it switchable.
- Keep increment/decrement deterministic: increment adds, decrement reduces, zero removes.
- Any increment must appear instantly in Dispatch Slip.
- Dispatch Slip must remain grouped by category.
- Keep search and category filtering behavior unchanged for users.

## Phase 1: Data Source Mode (Mock vs Convex)
- [ ] Add a single source-of-truth mode switch in features/products/hooks/use-products-list-data.ts.
- [ ] Default mode to mock for now (unseeded-safe).
- [ ] Ensure Convex useQuery path is not called when mode is mock.
- [ ] Keep returned shape identical across both modes:
  - categories
  - activeCategory
  - isLoading
  - products
  - totalCatalogProducts
- [ ] Add brief in-file comments explaining why mock default exists.

### Acceptance Criteria
- [ ] Products page loads without Convex org-context crash in unseeded environment.
- [ ] Search/category still works from hook outputs.

## Phase 2: Mock Product Catalog
- [ ] Add/restore mock products list in features/products/data/mock-data.ts.
- [ ] Include required fields used by product cards and draft state:
  - id
  - name
  - category
  - availability
  - imageSrc
  - baseUnit
- [ ] Keep mock categories aligned with filter UI labels.
- [ ] Keep mock data export structure clear and discoverable.

### Acceptance Criteria
- [ ] Hook filters correctly by category and search term in mock mode.
- [ ] Empty-state logic still behaves correctly.

## Phase 3: Mock Local Submit Behavior
- [ ] In features/products/components/products-dispatch-workspace.tsx, branch submit logic by data source mode.
- [ ] Mock mode submit behavior:
  - generate local transaction id and timestamp
  - clear draft state
  - show local success status in slip UI
  - do not call Convex mutation
- [ ] Convex mode submit behavior:
  - keep existing createDispatch mutation flow unchanged
- [ ] Add an explicit mode/status label in features/products/components/dispatch-slip-sheet.tsx (Draft, Mock, Live).

### Acceptance Criteria
- [ ] Mock submit works end-to-end without network mutation.
- [ ] Draft clears after successful mock submit.
- [ ] Slip status visibly indicates mock mode.

## Phase 4: Restore Center Input Quantity Control (shadcn)
- [ ] Extend features/products/hooks/use-dispatch-draft-state.ts with setQuantity(product, qty).
- [ ] setQuantity rules:
  - qty > 0: upsert item with quantity
  - qty <= 0: remove item
- [ ] Replace card footer quantity UI in features/products/components/product-card.tsx with InputGroup primitives from components/ui/input-group.tsx:
  - InputGroup
  - InputGroupAddon inline-start and inline-end
  - InputGroupButton for decrement/increment
  - InputGroupInput as centered numeric field
- [ ] Keep decrement/increment click handlers.
- [ ] Add direct typing support (numeric only, non-negative clamp behavior).
- [ ] Keep disabled behavior when product is unavailable.
- [ ] Ensure every quantity change updates draft immediately.

### Acceptance Criteria
- [ ] Increment appears in Dispatch Slip immediately.
- [ ] Decrement reduces/removes correctly.
- [ ] Manual numeric input updates draft and sheet immediately.
- [ ] Category grouping in slip remains intact.

## Phase 5: Props and Flow Wiring
- [ ] Add onSetQuantity prop to features/products/components/product-dispatch.tsx.
- [ ] Pass onSetQuantity from features/products/components/products-dispatch-workspace.tsx into ProductsDispatch and ProductsCardGrid.
- [ ] Keep existing search/category/total props unchanged.

### Acceptance Criteria
- [ ] No broken prop chains.
- [ ] No regressions in existing filters and card rendering.

## Phase 6: Client/Server Boundary Hardening
- [ ] Keep features/products/hooks/use-products-list-data.ts client-only.
- [ ] Review exports in features/products/index.ts to avoid leaking client hooks through server-safe import paths.
- [ ] Ensure Products page imports only component entry points needed for rendering.

### Acceptance Criteria
- [ ] No client-boundary runtime errors from products import chain.

## Phase 7: Verification (No Build)
- [ ] Run diagnostics with get_errors for all touched products files.
- [ ] Manual runtime checks on Products page:
  - page renders in unseeded environment
  - no Active organization required crash
  - search and category filtering work
  - increment/decrement/manual input update sheet instantly
  - sheet grouped by category
  - mock submit creates local transaction feedback and clears draft
- [ ] Confirm no unintended regressions in Add Product dialog flow.

## File Checklist
- [ ] features/products/hooks/use-products-list-data.ts
- [ ] features/products/data/mock-data.ts
- [ ] features/products/hooks/use-products-dispatch.ts
- [ ] features/products/hooks/use-dispatch-draft-state.ts
- [ ] features/products/components/product-card.tsx
- [ ] features/products/components/product-dispatch.tsx
- [ ] features/products/components/products-dispatch-workspace.tsx
- [ ] features/products/components/dispatch-slip-sheet.tsx
- [ ] features/products/index.ts

## Done Definition
- [ ] Products page is usable before seeding.
- [ ] Mock mode is explicit and stable.
- [ ] Quantity control is restored to center-input UX with shadcn primitives.
- [ ] Dispatch slip reflects changes immediately and stays category-grouped.
- [ ] Convex path remains available for later re-enable after seed/setup.

## After Seeding (Follow-up)
- [ ] Flip source mode from mock to convex.
- [ ] Re-test submit through real createDispatch mutation.
- [ ] Validate org context assumptions under real tenant data.
