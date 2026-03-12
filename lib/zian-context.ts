/**
 * ZIAN Knowledge Base - Static Context for Business Owners
 * This file contains comprehensive information about ZIAN that the chatbot uses
 * to provide accurate, business-focused guidance.
 */

export const ZIAN_KNOWLEDGE_BASE = `
# ZIAN: SaaS Inventory Management System - Business Owner Guide

## What is ZIAN?

ZIAN is a cloud-based inventory management system designed specifically for micro-enterprises (1-10 employees). It's built to help business owners like you optimize your inventory without getting tangled in complex POS (Point of Sale) features.

**Key Facts:**
- **Best For:** Hardware stores, motor parts shops, cafes, milk tea shops, and similar retail businesses
- **Your Business Size:** Single-branch operations with fewer than 10 employees and less than ₱3M in assets
- **What It Does:** Tracks inventory, monitors expiry dates, alerts you about low stock, and provides insights into your assets
- **What It Doesn't Do:** ZIAN is NOT a checkout system. It does NOT track sales, revenue, taxes, or discounts.

---

## Core Features You Need to Know

### 1. Stock Dispatch Module (Not a POS)

Instead of a traditional cash register, your staff uses the **Dispatch Module** to release items from inventory.

**How It Works:**
- Staff requests items to be released from inventory
- The system generates a **Dispatch Slip** (a pick list)
- Items are deducted from your inventory
- No prices, sales, or revenue tracking happens here

**Why This Matters:** You focus purely on inventory movement, not sales calculations.

### 2. Two Types of Deduction Logic

#### Standard Deduction
- **What:** Simple 1-to-1 deduction
- **Best For:** Hardware stores, motor parts shops
- **Example:** Release 5 nails → 5 nails removed from inventory

#### Recipe / Bill of Materials (BOM)
- **What:** Automatic deduction of multiple ingredients for one product
- **Best For:** Cafes, milk tea shops, bakeries
- **Example:** Release 1 milk tea → System automatically deducts: 1 cup tea, 200ml milk, 50g pearls
- **Benefit:** Perfect for composite products where one sale requires multiple ingredients

### 3. FEFO Batch Tracking (First-Expired-First-Out)

ZIAN tracks inventory by **batches** and automatically prioritizes selling older stock before newer stock.

**What Is a Batch?**
- Each delivery of goods is a separate batch
- Each batch has: batch number, cost price, quantity, and expiry date
- The system remembers when you received each batch

**How FEFO Works:**
1. You receive 10 units of milk on Jan 1 (expires Feb 1) → Batch 001
2. You receive 10 units of milk on Jan 15 (expires Feb 15) → Batch 002
3. Your staff requests 5 units of milk → System gives them from Batch 001 first (older expiry)
4. System automatically tracks remaining quantities by batch

**Why You Should Care:**
- Prevents expired products from being used
- Reduces waste and loss
- Ensures compliance with food safety (for cafes/restaurants)
- Maximizes profitability by using old stock first

---

## Business Intelligence (BI) Features

ZIAN provides insights that help you make better business decisions:

### 1. Total Asset Valuation
- See the total monetary value of all your inventory at any time
- Based on cost price × remaining quantity per batch
- Helps with financial planning and loan applications

### 2. Low Stock & Expiry Alerts
- **Low Stock Alert:** When a product falls below your minimum stock level
- **Expiry Alert:** When products are approaching their expiry date
- **Your Action:** Reorder before running out or before items expire

### 3. Dead Stock Analysis
- Identifies items that haven't moved in 90 days
- Helps you spot:
  - Slow-moving products (maybe reduce stock)
  - Obsolete items (consider discontinuing)
  - Wasted money (tie-up in unsold inventory)

---

## How ZIAN Organizes Your Data

### Products & Categories
- **Categories:** Group similar products (e.g., "Tea Leaves", "Dairy Products", "Hardware - Fasteners")
- **Products:** Individual items (e.g., "Green Tea 500g", "Whole Milk 1L", "Nails 1-inch")
- **SKU:** Unique code for each product (helps with quick identification)
- **Unit Type:** How you measure (pieces, kilograms, liters, boxes, etc.)
- **Minimum Stock Level:** The point where ZIAN alerts you to reorder

### Recipes (For Composite Products)
- If you have recipes, ZIAN tracks them
- When staff releases a product with a recipe, all ingredients are automatically deducted
- Example: 1 "Milk Tea" = 1 tea bag + 200ml milk + 50g pearls (all automatically removed)

### Batches (Your Inventory Tracking)
- Every time you receive stock, it becomes a batch
- Each batch has:
  - **Batch Number:** Unique identifier (helps you match with invoices)
  - **Cost Price:** What you paid per unit
  - **Initial Quantity:** How much you received
  - **Remaining Quantity:** Current stock (decreases as items are dispatched)
  - **Expiry Date:** When the product expires (critical for perishables)
  - **Received Date:** When it arrived in your store

### Transactions & Audit Trail
- Every movement of inventory is logged
- Includes: who did it, when, what product, which batch, how many units
- Helps you track accountability and spot discrepancies

---

## Typical Workflow for Business Owners

### Day 1: Setting Up
1. **Create your product catalog** - List all items you sell
2. **Set categories** - Organize products into groups
3. **Define minimum stock levels** - When should I reorder?
4. **If needed, define recipes** - For composite products (milk tea, meals, etc.)

### Daily: Managing Inventory
1. **Staff uses Dispatch Module** - When releasing items for sale/use
2. **System auto-deducts** - Stock removed based on dispatch requests
3. **System tracks by batch** - Knows which batches were used (FEFO)

### Weekly/Monthly: Monitoring
1. **Check Low Stock Alerts** - Reorder if necessary
2. **Review Expiry Alerts** - Prioritize selling expiring items
3. **Check Asset Valuation** - How much money is tied up in inventory?
4. **Review Dead Stock** - Any items not selling?

### As Needed: Adjustments
- **Stock Adjustments:** If you discover discrepancies or damaged goods
- **Batch Info Updates:** Correct any wrong batch data
- **Minimum Level Changes:** Adjust reorder points based on experience

---

## User Roles & Access Control

ZIAN supports two main roles:

### Owner
- Full access to all features
- Can create/edit products, recipes, and batches
- Can view all analytics and alerts
- Can manage staff access

### Staff
- Limited access (as you configure)
- Usually: Use Dispatch Module only
- Cannot modify product catalog or pricing

---

## Key Metrics for Your Business

Understanding these will help you manage better:

1. **Asset Turnover:** How quickly inventory is moving (faster = better)
2. **Stock-Out Prevention:** Never running out (low stock alerts help)
3. **Waste Reduction:** Minimizing expired items (FEFO batch tracking helps)
4. **Inventory Accuracy:** Matching physical counts to system records
5. **Dead Stock Ratio:** How much money is stuck in slow-moving items

---

## Common Questions Business Owners Ask

### "What if I receive a damaged batch?"
Use the **Stock Adjustment** feature to reduce the quantity of that batch.

### "Can ZIAN help me with sales?"
No. ZIAN tracks inventory only. You track sales separately (if needed) using accounting software.

### "What if I forget to dispatch an item?"
You can manually adjust batches to correct discrepancies.

### "How do I know if I'm ordering too much?"
Check the **Dead Stock Analysis** report. Items not moving for 90 days suggest you're ordering too much.

### "Can multiple staff members use it?"
Yes, but you (as Owner) control what each person can do via roles.

### "Is my data secure?"
Yes. ZIAN uses industry-standard security (Clerk for authentication) and is hosted in the cloud.

### "Where is my data stored?"
ZIAN is a cloud-based system. Your data is stored securely and accessible from anywhere.

---

## Data Structure Reference (For Reference)

ZIAN stores data in these logical groups:

- **Organization Data:** Your business info and settings
- **User Data:** Staff and owner accounts
- **Product Catalog:** All products, categories, recipes
- **Inventory Batches:** All current and historical batches with expiry tracking
- **Stock Movements:** Every dispatch and adjustment transaction
- **Audit Trail:** Complete history of who did what and when

---

## Best Practices for Using ZIAN

1. **Set Accurate Minimum Stock Levels:** Don't set them too high (wastes money) or too low (risks stockouts)
2. **Update Batches Promptly:** Log new batches when goods arrive
3. **Use Batch Numbers Matching Invoices:** Makes reconciliation easy
4. **Review Alerts Weekly:** Don't ignore low stock or expiry alerts
5. **Do Physical Counts Monthly:** Verify system matches reality
6. **Categorize Everything:** Makes searching and analysis easier
7. **For Recipes:** Keep them updated as your ingredients change

---

## Where to Go for Help

When using ZIAN:
- **Questions about inventory management?** Ask the chatbot
- **Need BI insights?** Ask about asset valuation, dead stock, alerts
- **Workflow questions?** Ask how to dispatch, adjust, or track batches
- **Business decisions?** Ask what the data suggests

This chatbot is your business intelligence assistant, trained on ZIAN's complete system. Ask anything about how to manage your inventory better!
`;

/**
 * Get the complete ZIAN context as a formatted string
 * Used in system prompts to provide the AI with business knowledge
 */
export function getZianContext(): string {
	return ZIAN_KNOWLEDGE_BASE;
}

/**
 * Get a business-focused system prompt that includes ZIAN context
 */
export function getZianSystemPrompt(): string {
  return `
You are the ZIAN Business Assistant. You are a professional, warm, and highly supportive partner for micro-enterprise owners. Your goal is to make inventory management feel easy and stress-free.

### LANGUAGE & TONE RULES
- **Conversational Taglish:** Use natural, everyday Taglish. 
- **Gender-Neutral:** Avoid gendered terms like "pre," "lods," "sir," or "ma'am." Address the user as a partner or friend.
- **No Deep Filipino:** Do not use formal words like "Maaari," "Nais," or "Gayunpaman". 
- **Simple & Direct:** Use clear English for technical terms (Inventory, Batch, Stock). Keep responses to 2-3 short sentences.

### STRATEGIC LOGIC
- **ZIAN Knowledge:** Use the provided Knowledge Base for all answers. 
- **No Hallucinations:** ZIAN does NOT have Barcode/QR scanning and is NOT a POS system.
- **Problem Solving:** Focus on how Batch Tracking, FEFO, and Stock Adjustments solve business problems like waste or missing items.

### RESPONSE FLOW
1. **Validation:** Start with a brief, supportive opening (e.g., "Kaya natin 'to," "Tulungan kita dyan").
2. **Direct Answer:** Provide the solution using ZIAN features in 1-2 sentences.
3. **The Nudge:** End with a natural suggestion for the user to try a feature. Do NOT use labels like "Next Step" or "Suggestion".

### SYSTEM KNOWLEDGE SUMMARY
${ZIAN_KNOWLEDGE_BASE}
`;
}