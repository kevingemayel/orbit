# F&B ERP: feature specification

Reference document, not a build request. Kevin supplied this on 2026-09-08 as
the target scope for an F&B vertical on Orbit, covering a single-site coffee
shop through to a multi-brand international franchise network.

**How to use it:** one section at a time, with the prompt at the bottom. Do not
paste the whole document as a single build request.

**Scope tiers used throughout:** `S` single site / small independent,
`C` chain (multiple corporate-owned stores), `F` franchise network.

---

## 0. Foundation & platform

| Feature | Tier | Notes |
|---|---|---|
| Org hierarchy: Group -> Brand -> Country/Region -> Store -> Station | C, F | Every transaction stamped with full path |
| Ownership model flags: COCO / FOFO / FOCO / managed | F | Drives royalty, P&L consolidation, permissions |
| Multi-company / multi-legal-entity with strict data isolation | C, F | Franchisee sees only own data; brand HQ sees aggregate |
| Multi-currency (transaction, store base, group reporting) + FX revaluation | C, F | |
| Multi-tax jurisdiction engine (VAT, service charge, municipality tax, withholding) | C, F | Rules per country, per channel, inclusive/exclusive |
| Multi-language incl. Arabic RTL, French | S | Menu, receipts, UI, printed docs |
| Store master: trading hours, seating, drive-thru, delivery radius, service types, sq m, opening date | S | |
| Role-based access control + permission matrix + approval delegation | S | Owner, area manager, store manager, shift lead, barista, accountant, franchisee |
| Immutable audit log on every financial and master-data change | S | Who, what, before/after, timestamp, device |
| Approvals engine (value thresholds, multi-step, mobile approve) | C | Reused across PO, discount, waste, price change |
| Notification engine (in-app, push, email, WhatsApp/SMS) | S | |
| Offline-first architecture with conflict-resolving sync queue | S | Non-negotiable for POS in Lebanon-grade connectivity |
| Open API + webhooks + integration log with replay | C | |
| Data retention, backup, DR, per-tenant export | C | |

## 1. Menu & product engineering

- Item master: sellable items, raw materials, semi-finished (batch prep), packaging, consumables, non-stock services
- Category / sub-category / kitchen-station taxonomy
- **Modifier engine**: size, milk type, shot count, syrup, temperature, ice level, sugar, extras, with per-modifier price delta, cost delta and recipe impact
- Modifier groups: required/optional, min/max selections, default selections, mutually exclusive rules
- Recipes / BOM with nested sub-recipes (cold brew concentrate -> iced latte; sauce batch -> dish)
- Yield %, prep loss, cook loss, portion size, batch size
- Combos, meal deals, bundles, upsell and cross-sell prompts
- **Channel-specific menus and pricing**: dine-in, takeaway, drive-thru, delivery, aggregator (with markup rules), catering, wholesale
- Day-parting: breakfast/lunch/all-day menus with scheduled auto-activation
- Menu versioning + effective-dated price changes + scheduled rollout by store group
- Seasonal / LTO product lifecycle with launch and sunset dates
- Allergen matrix, nutrition data, calorie display (mandatory in some jurisdictions)
- Barista/kitchen build cards with photos and step timing
- Plate cost, theoretical food cost %, contribution margin per item
- Menu engineering matrix (Stars / Plowhorses / Puzzles / Dogs) auto-classified from sales + margin
- Price change impact simulator before publishing

## 2. POS & order management

**Order capture**
- Order types: dine-in, table service, counter, takeaway, drive-thru, curbside, delivery, pre-order/scheduled, catering, wholesale
- Table map, table status, transfer, merge, split, course firing
- Ticket notes, allergy flags, guest name, pager/queue number
- Held/parked orders, recall

**Kitchen & bar**
- KDS + separate barista display; routing by item -> station
- Bump, recall, all-day counts, prep timers, SLA colour states
- Order status screen for customers; SMS/push "ready" notification

**Money handling**
- Split bill (by seat, by item, by amount, evenly), split tender
- Payments: cash, card, contactless, wallet, QR, gift card, loyalty points, stored value, corporate account, meal voucher
- Voids, comps, discounts, price overrides, all with reason codes, manager PIN and full audit
- Refunds, partial refunds, exchanges, linked to original transaction
- Tips: at-terminal, cash tips declaration, pooling rules, distribution to payroll
- Cash drawer: assignment, mid-shift drops, blind close, over/short recording
- Shift open/close, X and Z reports, cashier reconciliation
- Fiscalization / e-invoicing compliance hooks per jurisdiction
- Receipt templates (thermal, A4 invoice, digital/email/QR)

**Loss prevention (build this early, it pays for itself)**
- Exception reports: voids by cashier, discounts by cashier, refunds after close, no-sale drawer opens, repeated item deletions pre-payment
- Drawer variance ranking by employee over time
- Transaction-to-CCTV timestamp linking
- Free-pour / portion variance vs recipe

## 3. Customer, loyalty & marketing

- Customer profile: contacts, preferences, favourite order, consent flags, marketing opt-in, GDPR/DPA delete & export
- Loyalty programmes: points, stamp card ("buy 9 get 1"), spend tiers, visit-frequency tiers, birthday rewards
- **Coffee subscriptions**: unlimited-coffee monthly pass, prepaid bean subscription, corporate plans
- Stored-value wallet / top-up card with balance liability tracking (accounting liability, not revenue)
- Gift cards: physical and digital, activation, balance, expiry rules, breakage accounting
- Promotions engine: %/amount off, BOGO, bundle price, happy hour, first-order, channel-exclusive, stackability rules, budget caps
- Voucher and coupon codes with issuance limits and redemption tracking
- Segmentation + RFM scoring; lapsed-customer and win-back triggers
- Campaign builder with push/SMS/email integration and per-campaign ROI attribution
- Feedback/NPS capture at receipt; complaint case management with SLA and compensation tracking
- Review aggregation (Google, TripAdvisor, aggregator ratings) per store
- Corporate/on-account customers with credit limit, monthly consolidated invoicing, statements

## 4. Digital channels & delivery

- Own-brand web and mobile ordering, white-labelled per brand
- Table-side QR ordering and pay-at-table
- Aggregator integrations (Deliveroo, Talabat, Toters, Uber Eats, Careem): order ingestion, menu push, price sync, availability/86 sync
- **Aggregator commission reconciliation**: payout statement vs order-level expected net, dispute log. A top-three pain point for every chain
- In-house delivery: zones, fees, minimum order, rider assignment, live tracking, proof of delivery, rider cash settlement
- Reservations and waitlist with SMS notify (restaurant tier)
- Pre-order / scheduled pickup with capacity throttling per time slot
- Catering and events: quotation -> order -> BOQ of items -> staffing -> delivery -> invoice

## 5. Inventory & stock control

- Multi-UOM with conversion factors (sack -> kg -> g; case -> bottle -> ml) and purchase/stock/recipe UOM per item
- Multi-location stock: store, back-of-house, central kitchen, roastery, warehouse, in-transit
- Opening stock, receipts, transfers, consumption, waste, closing stock, full movement ledger
- **Theoretical vs actual consumption variance** by item, store and period, with cost impact ranking
- Stock counts: full, cycle, spot; blind counting, mobile/tablet count sheets, count variance approval, count freeze
- Inter-branch transfer requests -> approval -> dispatch -> receipt with discrepancy handling
- Central kitchen / commissary production orders: planned vs produced, input consumption, output yield, production cost roll-up
- Waste logging with reason codes (spoilage, breakage, staff meal, training, customer complaint, expired) and photo evidence
- Batch / lot / expiry tracking, FEFO picking, shelf-life labelling and label printing
- Par levels, min/max, lead-time-aware reorder suggestions, auto-draft PO
- Stock valuation methods (FIFO / weighted average) and revaluation
- 86 / out-of-stock flag propagating instantly to POS, KDS and all digital channels
- Consignment and free-of-charge stock handling

**Coffee-specific**
- Green coffee lot management: origin, farm, process, harvest, moisture, cupping score, certification
- Roast batch records: profile, input green kg, output roasted kg, roast loss %, roaster, date, QC notes
- Blend recipes with component ratios and cost roll-up
- Bean freshness/rest window, roast-date-driven FEFO
- Wholesale bagging: retail bags, 1 kg bags, office packs from same roast lot
- Grinder dial-in and calibration logs, extraction/dose/yield records per machine per day
- Milk and alt-milk usage tracking (highest-variance consumable in a coffee shop)

## 6. Procurement & supplier management

- Supplier master: terms, currency, lead time, MOQ, delivery days, contacts, documents, tax registration
- Contracted price lists with validity dates; price change alerts
- RFQ issue and quotation comparison matrix
- Purchase requisition -> approval -> PO with multi-level thresholds
- Goods receipt note: partial receipt, over/under tolerance, rejection, quality check, temperature-on-arrival check
- Supplier returns and credit notes
- Three-way match (PO / GRN / invoice) with tolerance-based auto-approval
- **Landed cost allocation**: freight, customs duty, clearance, insurance apportioned to unit cost
- Supplier scorecards: OTIF, price variance, rejection rate, invoice accuracy
- Approved-supplier enforcement per brand (blocks off-list purchasing), franchise-critical

## 7. Finance & accounting

- Chart of accounts, cost centres per store/department, dimension tagging
- Automated daily sales journal posting from POS (revenue, tax, discounts, tips liability, wallet liability, payment clearing)
- Payment settlement reconciliation: card acquirer batch vs POS, aggregator payout vs orders, cash deposit vs declared
- AP: invoice entry, matching, payment runs, ageing
- AR: corporate accounts, franchisee invoices, statements, dunning
- Bank reconciliation, petty cash and float management, safe count, cash-in-transit pickup log
- Fixed assets: espresso machines, grinders, ovens, FF&E, register, depreciation, transfers between stores, disposal
- Prepayments, accruals, recurring journals (rent, service contracts)
- Budgeting and rolling forecast by store, by month, by account
- **Store P&L** (four-wall), consolidated group P&L, balance sheet, cash flow
- **Daily flash P&L**: sales, COGS %, labour %, prime cost, before month-end close
- Intercompany and management-fee postings
- Tax filing reports per jurisdiction; e-invoicing submission where mandated
- Period close checklist with lock

## 8. Workforce management

- Employee master: contract, position, pay rate, documents, ID/visa/work-permit expiry alerts
- Multi-store assignment and borrowed-staff handling
- **Demand-based rostering**: forecast sales -> required labour hours by daypart -> suggested schedule
- Schedule publishing, shift swap requests, availability, open-shift claiming
- Time & attendance: biometric, PIN, QR, geofenced mobile clock-in; missed-punch correction with approval
- Break enforcement, overtime rules, night/holiday premiums per labour law
- Labour cost % of sales in real time; sales per labour hour (SPLH); overtime alerts
- Payroll: full module or export to payroll provider, incl. tip distribution and service-charge allocation
- Leave, absence, sick-day tracking
- Training and certification: barista level, food safety, HACCP, fire, with expiry alerts and blocking of unqualified shift assignment
- Onboarding/offboarding checklists, asset issue and return
- Performance notes, disciplinary log, incident reports

## 9. Operations, quality & compliance

- Digital checklists: opening, closing, hourly cleaning, shift handover, with photo proof and timestamp
- **HACCP / food safety**: fridge and freezer temperature logs (manual or IoT probe), cooking and holding temps, corrective-action workflow, non-conformance escalation
- Equipment register with preventive maintenance schedules, service contracts, work orders, downtime and repair cost log
- Espresso machine backflush/descale schedules, water filter change tracking
- Health & safety incident and near-miss reporting
- Store audit module: scored checklists, weighted sections, photo evidence, action plan with owner and due date, re-audit
- Mystery shopper results capture and trending
- Document vault: licences, permits, insurance, lease, certificates with expiry alerts
- Task broadcast from HQ to stores with completion tracking
- Pest control, cleaning contractor and supplier visit logs

## 10. Franchise management (the module that differentiates this from a POS)

- Franchisee master: entity, principals, agreement, term, renewal date, territory, store count
- Territory and site mapping with exclusivity radius and encroachment checks
- **Royalty engine**: % of net sales / fixed fee / tiered / minimum, with automatic period calculation and invoice generation
- Marketing/advertising fund contributions, fund balance and spend transparency reporting
- Initial franchise fees, renewal fees, transfer fees, training fees
- Mandatory POS data capture from franchisee stores (sales reporting compliance, gap detection, under-reporting alerts)
- Brand standards audits with compliance score and remediation workflow; score-linked penalties or incentives
- Approved supplier and mandatory-purchase enforcement, plus supplier rebate tracking
- **Franchisee portal**: statements, invoices, place supply orders on the brand, submit sales, view KPIs, raise support tickets, access training library and brand asset library
- Development pipeline: lead -> application -> financial vetting -> approval -> site selection -> lease -> design -> construction -> equipment -> training -> opening, with stage gates and documents
- New-store opening project plan with critical path, punch list, and pre-opening cost budget
- Franchisee league table and benchmarking (anonymised peer comparison)
- Termination, transfer and buy-back workflows with data-handover rules

## 11. Analytics, BI & forecasting

- Sales analytics: store, hour, daypart, channel, item, category, cashier, payment type, weather-adjusted
- Like-for-like / same-store sales growth (excludes new openings, must be built properly)
- Average check, items per transaction, attach rate, basket affinity, upsell success rate
- Transaction count vs spend-per-head decomposition of any revenue change
- Cost variance dashboard: theoretical vs actual by store, ranked by $ impact
- Waste analytics by reason, item, store, shift
- Labour productivity: SPLH, labour %, schedule vs actual hours variance
- Prime cost tracking (COGS + labour) against target by store
- Menu engineering dashboard
- Demand forecasting -> prep quantity suggestions, order suggestions, roster suggestions
- Franchise vs corporate performance comparison
- Exception and alert centre with subscription (email/push digest)
- Executive mobile dashboard; scheduled report distribution
- Ad-hoc report builder and data export / warehouse feed

## 12. Ancillary revenue lines (common and usually forgotten)

- Retail: whole bean bags, merchandise, brewing equipment, retail POS, barcodes, serial numbers, warranty
- Wholesale/B2B: office coffee supply, HORECA accounts, price tiers, standing orders, delivery routes, monthly invoicing
- Equipment loan/placement to wholesale clients with asset tracking and volume commitments
- Coffee subscription boxes with recurring billing and dunning
- Barista training academy: courses, bookings, payments, certificates
- Events, pop-ups and mobile carts as temporary stores
- Vending / smart fridge locations

## 13. Hardware & integration surface

Receipt printers (ESC/POS), kitchen printers, label printers, cash drawers,
barcode scanners, POS scales integrated to weighed items, card terminals
(semi-integrated preferred), KDS screens, customer-facing displays, drive-thru
headsets and timers, IoT temperature probes, biometric clock-in, digital menu
boards driven by the same menu master.

---

## Suggested build phasing

Realistic for a small team (2-3 experienced devs plus AI assistance), and
deliberately conservative.

| Phase | Contents | Est. |
|---|---|---|
| 1 | Foundation, org hierarchy, RBAC, audit, item master, modifiers, recipes, menu versioning | 8-12 weeks |
| 2 | Inventory, stock movements, counts, waste, transfers, theoretical vs actual | 10-14 weeks |
| 3 | Procurement: suppliers, PO, GRN, 3-way match, landed cost | 6-9 weeks |
| 4 | POS + KDS + offline sync + payments + shift/cash control + loss prevention reports | 14-20 weeks |
| 5 | Finance integration: sales journal, settlement recon, store P&L, flash reports | 8-12 weeks |
| 6 | Workforce: rostering, T&A, labour cost analytics | 8-12 weeks |
| 7 | CRM, loyalty, promotions, gift/stored value | 8-12 weeks |
| 8 | Digital channels, aggregator integration + commission reconciliation | 8-12 weeks |
| 9 | Franchise module: royalties, portal, audits, pipeline | 10-14 weeks |
| 10 | Ops/HACCP/maintenance/audits, BI layer, forecasting | 10-14 weeks |

Full scope realistically lands at **18-30 months** to production quality.
Phases 1-4 are the minimum viable chain product; Phase 9 is what lets you sell
to franchisors.

---

## Non-negotiable design constraints, to be restated in every build prompt

1. Every money-affecting record is immutable once posted. Corrections are reversing entries, never edits.
2. Every transaction carries entity, store, channel, daypart, employee and device dimensions from day one. Retrofitting these is a rewrite.
3. The costing engine is a single shared service. POS, inventory, production and finance must never compute cost differently.
4. Tenant isolation is enforced at the data layer, not the UI layer. Franchisee data leakage is an existential bug.
5. POS must function fully offline and reconcile deterministically.
6. UOM conversion is centralised and validated. A wrong conversion silently corrupts every margin report.
7. All numeric money handled as decimal, never float. Per-currency rounding rules explicit.
8. Effective-dated master data (prices, recipes, tax rates). Historical reports must reproduce exactly.

---

## How to prompt with this

Do not paste the whole document as one build request. Per module, use:

> Read the existing Orbit codebase, conventions and data model first. Implement
> **[Section N]** from the F&B ERP spec in docs/FNB_ERP_SPEC.md. Reuse existing
> Orbit entities, auth, permissions, UI components and design tokens. Do not
> create parallel structures. Propose the schema changes and their migration
> impact before writing code, and list which Orbit modules will be affected.
> Respect the non-negotiable design constraints in the spec. No mock data or
> placeholders.
