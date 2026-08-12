# Spacework ERP - Full Feature Catalog

The complete build-spec: every module broken into buildable sub-features. Nothing summarized.
Priority tags: **[Core]** build first (v1) · **[P2]** phase 2 · **[Later]** · **[Wedge]** our differentiator vs generic ERP.

Each feature is a real, checkable deliverable. This is the master list we build and track against.

---

## 0. Platform & Foundation
The layer every module sits on.

- **[Core]** Multi-tenant isolation (org = customer account; hard data separation via Row-Level Security)
- **[Core]** Multi-company (many legal entities per org; per-company books; switch active company)
- **[Core]** Users, invites, roles & permission groups (owner / admin / accountant / manager / member / viewer)
- **[Core]** Per-company access control (a user can be limited to specific companies)
- **[Core]** Record-level security rules + field-level visibility (hide sensitive fields by role)
- **[Core]** Audit trail (who changed what, when, before/after) on every record
- **[Core]** Activity / chatter log per record (messages, internal notes, followers, @mentions)
- **[Core]** Scheduled activities (to-dos, reminders, next-action per record)
- **[Core]** Documents & attachments (upload, version, link to any record)
- **[Core]** Sequences & numbering (per journal / doc type, gapless option for legal compliance)
- **[Core]** Approvals & workflow engine (multi-step approvals, thresholds, delegation)
- **[Core]** Import / export (CSV/XLSX), data templates, deduplication
- **[Core]** REST API + webhooks + API keys
- **[Core]** Notifications (in-app + email); email templates
- **[Core]** Dashboards & KPIs; saved filters, group-by, pivot & graph views
- **[Core]** Company settings (logo, address, fiscal setup, defaults) & branding
- **[P2]** No-code customization: custom fields, custom views, automation rules (survives upgrades)
- **[P2]** Report designer (PDF layouts for invoices, quotes, statements)
- **[P2]** e-Signature (send docs for signature, track status)
- **[P2]** Customer & vendor portal (self-service access, scoped by RLS)
- **[Later]** Multi-language / localization framework; translations
- **[Later]** Marketplace / installable modules architecture

---

## 1. Master Data
Shared references every transaction points to. Never duplicated.

### 1.1 Partners (Contacts) **[Core]**
- Customers, vendors, contacts, and companies-with-child-contacts
- Multiple addresses (invoice / delivery / other), contact roles
- Categories / tags, industry, salesperson, sales team
- Payment terms & payment methods per partner
- Credit limit + credit control / hold
- Bank accounts (for payments / direct debit)
- Tax ID / VAT, fiscal position
- Default accounts (receivable / payable) override per partner
- Intercompany link (a partner that is one of our own companies)
- GDPR: consent, data export, right-to-erasure **[Core]**

### 1.2 Products & Services **[Core]**
- Product types: storable / consumable / **service** / digital
- Variants (attributes: size, finish, colour) & variant matrix **[P2]**
- Categories & product tags
- Units of measure + UoM conversions (buy in box, stock in unit) **[P2]**
- Sales price, cost price, margins; multiple price lists / currency price lists
- Purchase info (vendors, lead time, min qty, vendor price lists)
- Accounting: income / expense / stock accounts per product or category
- Taxes (sales / purchase) per product
- Bill of Materials link (for kits / manufacturing) **[Later]**
- Barcodes / internal reference / SKU

### 1.3 Chart of Accounts **[Core]**
- Multi-level accounts (parent / child), account groups
- Account types driving Balance Sheet vs P&L classification
- Reconcilable flag, currency-restricted accounts (foreign-currency accounts)
- Account tags (for tax / custom reports)
- Chart template + one-click localized chart setup per company

### 1.4 Currencies & FX **[Core / Wedge]**
- Currencies, symbols, decimal precision, rounding
- Exchange rates: manual + **automatic feed** (ECB / provider) **[P2]**
- Rate types: spot / average / closing (for consolidation) **[Wedge]**
- Per-company functional currency; group reporting currency

### 1.5 Taxes & Fiscal **[Core]**
- Tax rates (percentage / fixed), tax groups, compound taxes
- Sales vs purchase taxes; tax accounts (collected / paid)
- Fiscal positions (auto-swap taxes/accounts by partner region) **[P2]**
- Withholding tax **[P2]**; reverse-charge / intra-EU **[P2]**

### 1.6 Analytic / Cost Accounting **[Core]**
- Analytic accounts (cost centres, projects, departments)
- Analytic plans (multiple dimensions at once) **[P2]**
- Analytic distribution models (auto-split by rule) **[P2]**

---

## 2. Finance / Accounting (Record-to-Report)
The deepest module. The single source of financial truth.

### 2.1 General Ledger **[Core]**
- Journals: sales, purchase, bank, cash, general, miscellaneous
- Journal entries: manual, posted/draft states, **balance-enforced** posting
- Journal items (lines) with analytic distribution, partner, tax, due date
- Recurring / templated entries; auto-reversing accruals **[P2]**
- Entry lock once posted (immutable; unpost with audit) **[Core]**
- Opening balances / opening entry

### 2.2 Accounts Receivable **[Core]**
- Customer invoices (from sales order, project, manual)
- Credit notes / refunds; pro-forma invoices
- Down-payment / deposit invoices
- Installment / payment plans **[P2]**
- Recurring invoices / subscriptions billing **[P2]**
- Customer statements
- Follow-up / dunning (multi-level reminder sequences, automated) **[P2]**
- Aged receivable report; expected payment date

### 2.3 Accounts Payable **[Core]**
- Vendor bills (from PO, manual)
- Vendor refunds / debit notes
- Bill digitization / OCR capture **[Later]**
- Aged payable report; payment scheduling / due-date management

### 2.4 Payments & Bank **[Core]**
- Register payment (inbound / outbound), partial payments
- Batch / bulk payments **[P2]**
- Payment methods (cash, cheque, wire, card, SEPA, local rails)
- Outstanding receipts/payments accounts, payment matching
- Bank accounts & journals
- **Bank statement import** (CSV / OFX / QIF / camt) **[P2]**
- Bank feeds (auto sync) **[Later]**
- **Reconciliation** workbench; reconciliation model rules (auto-match) **[Core]**
- Realized FX gain/loss on settlement **[Wedge]**

### 2.5 Taxes / VAT **[Core]**
- Tax computation on invoices/bills (lines + summary)
- Tax report / VAT return per period
- EC sales list / intrastat **[Later]**
- Tax audit report (tax by account / by tax)

### 2.6 Fixed Assets **[P2]**
- Asset models & categories
- Depreciation methods (straight-line, declining, units-of-production)
- Depreciation board (schedule), automated depreciation entries
- Asset disposal / sale / revaluation; gross value increase
- Asset reporting (net book value)

### 2.7 Deferrals & Revenue Recognition **[P2]**
- Deferred revenue (spread income over time)
- Deferred expense (spread prepaid costs)
- Revenue recognition schedules (milestone / time / delivery based) **[Wedge]**
- IFRS 15 / ASC 606 multi-performance-obligation allocation **[Later]**

### 2.8 Budgets & Planning **[P2]**
- Budgets & budget lines (by account / analytic / period)
- Budget vs actual reporting
- Rolling forecasts **[Later]**

### 2.9 Period Control & Close **[Core]**
- Fiscal years & periods; period states (open / closed / locked)
- Lock dates (per company; tax lock, global lock)
- Year-end closing; carry-forward to retained earnings
- Current-year-earnings auto account

### 2.10 Financial Reporting **[Core]**
- Trial balance
- General ledger report (drill-down to entries)
- Profit & Loss (Income statement)
- Balance sheet
- Cash flow statement **[P2]**
- Aged receivable / payable
- Executive summary / KPI report **[P2]**
- Custom report builder (define statement lines) **[P2]**
- Export to Excel / PDF

### 2.11 Multi-Company & Consolidation **[Core / Wedge]**
- Per-company books, per-company chart & journals
- **Intercompany transactions** (auto-mirror sale↔purchase between own companies) **[P2]**
- Consolidation groups & ownership tree
- **Consolidated statements** (map local→group accounts, currency translation) **[Wedge]**
- **Intercompany elimination** (stored, auditable adjustments) **[Wedge]**
- Currency translation adjustment (CTA), minority interest **[Wedge]**

### 2.12 Multi-Currency **[Core / Wedge]**
- Transaction-currency amount preserved on every line
- Functional-currency ledger; foreign-currency accounts
- **Unrealized FX revaluation run** (period-end) posting to FX accounts **[P2]**

---

## 3. Sales / CRM (Order-to-Cash)

### 3.1 CRM **[P2]**
- Leads → opportunities; pipeline (kanban by stage)
- Lead scoring / assignment rules **[Later]**
- Activities, next actions, expected close & revenue
- Lost reasons, win/loss reporting
- Email integration & templates **[Later]**

### 3.2 Quotations & Sales Orders **[Core]**
- Quotation builder (lines, products/services, description, qty, price, tax, discount)
- Quotation templates; optional/upsell lines **[P2]**
- Send by email; **online quote + e-sign acceptance** **[Wedge]**
- Convert quote → sales order → invoice (traceable chain)
- Order status workflow (draft / sent / confirmed / done / cancelled)
- Down payments; delivery & invoicing policy (ordered vs delivered)

### 3.3 Pricing **[Core]**
- Price lists (per customer / currency / quantity breaks)
- Discounts (line, global), promotions **[Later]**
- Margin display

### 3.4 Customer Invoicing **[Core]**
- Invoice from order / on milestone / on delivery / on time-and-material
- Consolidated invoicing (multiple orders → one invoice) **[P2]**
- Credit notes

### 3.5 Subscriptions / Recurring **[P2]**
- Subscription plans, recurring billing, upsell/renew, MRR reporting

### 3.6 Sales Reporting **[Core]**
- Sales by customer / product / salesperson / period; forecast; commissions **[Later]**

---

## 4. Purchasing (Procure-to-Pay)

- **[Core]** Purchase requisitions / internal requests
- **[Core]** RFQ (request for quotation) → compare vendor offers **[P2]**
- **[Core]** Purchase orders + approval thresholds
- **[Core]** Vendor price lists / catalogs, lead times
- **[Core]** Goods receipt; **3-way match** (PO ↔ receipt ↔ bill) **[P2]**
- **[Core]** Vendor bills & payments
- **[P2]** Landed costs (freight/duty into product cost)
- **[P2]** Blanket orders / call-offs
- **[Core]** Purchase reporting (spend by vendor / category)

---

## 5. Inventory / Supply Chain **[P2]**
Core for product businesses; Phase 2 for consulting.

- Warehouses, locations (multi-level), storage categories
- Operations: receipts, deliveries, internal transfers, returns
- Stock moves & move lines; picking / packing
- Lots / serial numbers, expiry tracking
- **Valuation** methods (FIFO / average / standard) + automated valuation entries → GL
- Landed cost integration
- Reordering rules (min/max), replenishment, procurement routes
- **MRP** (multi-level demand planning) **[Later]**
- Inventory adjustments / cycle counts; scrap
- Barcode operations **[Later]**
- Delivery methods / carriers / shipping **[Later]**
- Drop-shipping, cross-docking **[Later]**

---

## 6. Manufacturing **[Later]**

- Bills of Materials (multi-level, phantom/kits, by-products)
- Routings & work centres (capacity, cost/hour)
- Manufacturing orders & work orders (shop-floor)
- Subcontracting
- Quality control (checks, alerts) 
- Maintenance (preventive / corrective)
- PLM (engineering changes, versions)
- MPS / master production schedule

---

## 7. Projects / Services (PSA) **[Core]**
Central for the consulting business.

- Projects (per customer), stages, kanban / list / gantt views
- Tasks, sub-tasks, dependencies, deadlines, assignees
- **Timesheets** (log hours to task/project; timer) 
- Planning / resource scheduling & capacity **[P2]**
- Milestones **[Wedge]**
- **Project invoicing**: fixed-price, time-and-material, milestone/progress **[Wedge]**
- Expenses on project; purchases on project
- **Project profitability** (revenue vs analytic cost: labour + expenses + purchases) **[Wedge]**
- Deliverables / documents per project (calculation notes, drawings) **[Wedge]**
- Project templates; recurring project setup **[P2]**
- Customer sign-off on milestones **[Wedge]**

---

## 8. HR **[P2]**

- **[P2]** Employees (records, contracts, org chart, departments, job positions)
- **[P2]** Attendance (check-in/out) & work entries
- **[P2]** Time off / leave (requests, approvals, balances, calendar)
- **[Core]** Expenses (submit, approve, reimburse, post to accounting) - useful now
- **[Later]** Payroll (localized rules, payslips, salary journal)
- **[Later]** Recruitment (job posts, applicants, pipeline)
- **[Later]** Appraisals, skills, training

---

## 9. Construction / Facade Vertical **[Wedge]**
Where we beat generic ERPs for Kevin's niche. Not in Odoo cleanly.

- **BOQ / take-off** (bill of quantities, schedule of values)
- **Progress / interim payment certificates (IPC)** - percent-complete billing per line
- **Retention** (hold %, release schedule, retention receivable/payable)
- **Variations / change orders** (VO register, approval, impact on contract value)
- **Advance payment & recovery** (down payment recovered across certificates)
- **Calculation notes & drawings** management (versioned deliverables, approval status)
- **Subcontractor management** (subcontract packages, back-to-back billing, retention)
- Contract value tracking (original + variations = revised contract)
- Cost value reconciliation (CVR): cost vs value per package
- Material supply + manufacturing + installation line items (mixed service/goods)

---

## Build order (v1 spine)
1. Platform foundation + Master data
2. Finance / GL core (double-entry, multi-company, multi-currency) - **done: `accounting-core.sql`**
3. Sales (O2C) → Customer invoicing → posts to GL
4. Purchasing (P2P) → Vendor bills → posts to GL
5. Projects + Timesheets + project invoicing + profitability
6. Reporting (TB, P&L, Balance sheet, aged) + consolidation
7. Then Phase 2: Inventory, Fixed assets, HR, Subscriptions, CRM depth
8. Vertical (construction/facade) woven in as the differentiator

_Living document. We check items off and add detail as we build._
