# 1. Introduction
## 1.1 Purpose
This document provides a comprehensive description of the functional and non-functional requirements for the Zian Inventory Management System. It is intended for project stakeholders, the development team, and the academic evaluation panel.

## 1.2 Project Scope
Zian is a cloud-based, multi-tenant SaaS platform designed for micro-enterprises (Hardware stores, Cafes). Its primary objective is to manage the logistical lifecycle of stock using **FEFO (First-Expired-First-Out)** and **BOM (Bill of Materials)** logic while strictly excluding Point-of-Sale (POS) financial computations.

## 1.3 Definitions, Acronyms, and Abbreviations
*   **MSME:** Micro, Small, and Medium Enterprises.
*   **FEFO:** First-Expired-First-Out (Deduction based on proximity to expiry).
*   **BOM:** Bill of Materials (Recipe-based ingredient deduction).
*   **Tenant:** A specific MSME organization with isolated data.
*   **OLTP:** Online Transactional Processing (Daily operations).

---

# 2. Overall Description
## 2.1 Product Perspective
Zian is an autonomous SaaS platform that interfaces with external providers for Identity Management (Clerk) and Proactive Notifications (Firebase/Resend). It serves as a back-office logistical engine rather than a front-office sales tool.

## 2.2 Functional Constraints (The "No POS" Rule)
The system is architecturally prohibited from:
1.  Calculating selling prices, discounts, or taxes (VAT).
2.  Interfacing with cash drawers or processing customer payments.
3.  Generating financial invoices (only logistical dispatch slips are permitted).

## 2.3 User Classes and Characteristics
*   **Super Admin (NEUST IMO):** Responsible for tenant provisioning, subscription status, and platform-wide usage metrics.
*   **ME Owner:** Tenant administrator responsible for catalog setup, staff management, and reviewing organizational audit logs and analytics.
*   **ME Staff:** Operational user responsible for recording batch deliveries, processing dispatches, and logging stock adjustments (spoilage/damage).

---

# 3. System Requirements

## 3.1 Functional Requirements (FR)

### 3.1.1 Identity and Access Management
*   **FR-1.1:** The system shall permit the ME Owner to register a new organization via the external Auth Provider.
*   **FR-1.2:** The system shall authenticate users and provide an `org_id` context to enforce multi-tenant data isolation.
*   **FR-1.3:** The system shall allow the ME Owner to manage staff accounts and roles within their specific organization.

### 3.1.2 Catalog and Setup
*   **FR-2.1:** The system shall allow the ME Owner to maintain a product catalog including SKUs, categories, and base units.
*   **FR-2.2:** The system shall support a Bill of Materials (BOM) extension for composite items (e.g., Cafe recipes).
*   **FR-2.3:** The system shall maintain a registry of suppliers linked to specific inventory batches.

### 3.1.3 Inbound and Outbound Logistics
*   **FR-3.1:** The system shall record batch arrivals including procurement cost, batch codes, and mandatory expiry dates (where applicable).
*   **FR-3.2:** The system shall execute stock dispatches using a FEFO algorithm, prioritizing the oldest or nearest-to-expiry batches.
*   **FR-3.3:** The system shall generate a "Physical Dispatch Slip" containing only item names, quantities, and units.

### 3.1.4 Inventory Adjustments
*   **FR-4.1:** The system shall allow users to perform manual stock corrections for spoilage, theft, damage, or logistical corrections.
*   **FR-4.2:** Every adjustment must be associated with a mandatory reason code for audit purposes.

### 3.1.5 Analytics and Dashboards
*   **FR-5.1:** The system shall provide an ME Owner Dashboard that aggregates logistical data into Asset Valuation (at cost) and Dead Stock analysis.
*   **FR-5.2:** The system shall provide a Super Admin Dashboard for monitoring platform usage and tenant health.
*   **FR-5.3:** The system shall maintain an immutable audit trail of all data mutations, viewable by the ME Owner and Super Admin.

## 3.2 Non-Functional Requirements (NFR)

*   **NFR-1 (Security):** Data isolation must be enforced at the database level; no tenant shall access another tenant's data.
*   **NFR-2 (Availability):** The system shall target 99.9% uptime leveraging serverless architecture.
*   **NFR-3 (Performance):** FEFO batch retrieval must be optimized via composite indexing to ensure sub-second response times.
*   **NFR-4 (Integrity):** Transactional history must be immutable; errors must be corrected via new transactions, never by editing historical logs.

---

# 4. Data Requirements (Logical Schema)
The system uses an atomized, 3NF/BCNF compliant logical schema optimized for both transactional operations and subsequent analytical ingestion.

### 4.1 Schema Definition

| Table Name | Attributes (PK/FK and Logical Fields) |
| :--- | :--- |
| **organizations** | **pk** id, string clerk_org_id, string name, enum plan, enum status, timestamp created_at, timestamp updated_at, timestamp archived_at |
| **users** | **pk** id, **fk** org_id, string clerk_user_id, string first_name, string last_name, string email, enum role, timestamp created_at, timestamp updated_at |
| **suppliers** | **pk** id, **fk** org_id, string name, string contact_first_name, string contact_last_name, string phone_number, timestamp created_at, timestamp updated_at |
| **categories** | **pk** id, **fk** org_id, **fk** parent_category_id, string name, timestamp created_at, timestamp updated_at |
| **products** | **pk** id, **fk** org_id, **fk** category_id, string sku, string name, string base_unit, boolean is_bom, float min_stock_level, timestamp created_at, timestamp updated_at, timestamp archived_at |
| **recipes** | **pk** id, **fk** org_id, **fk** parent_product_id, **fk** ingredient_product_id, float quantity_required, timestamp created_at, timestamp updated_at |
| **batches** | **pk** id, **fk** org_id, **fk** product_id, **fk** supplier_id, string batch_code, float cost_price, float initial_qty, float remaining_qty, timestamp expiry_date, timestamp received_at, timestamp created_at, timestamp updated_at |
| **transactions** | **pk** id, **fk** org_id, **fk** user_id, enum movement_type, enum event_reason, timestamp created_at |
| **transaction_items** | **pk** id, **fk** org_id, **fk** transaction_id, **fk** product_id, **fk** batch_id, float quantity, float cost_at_event, timestamp created_at |
| **audit_logs** | **pk** id, **fk** org_id, **fk** user_id, enum action_type, string entity_affected, string record_id, json change_log, timestamp created_at |

