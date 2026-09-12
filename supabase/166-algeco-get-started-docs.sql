-- ============================================================================
-- 166-algeco-get-started-docs.sql  -  the ten "Get started" documents for
-- ALGECO S.A.R.L, rewritten as documents: headings, steps, callouts, tables,
-- screenshots taken from Orbit on ALGECO's own data, links between the
-- departments, and a section in each on how it hands work to the others.
-- Replaces the plain-text versions from 165. Safe to re-run.
-- ============================================================================

delete from public.articles where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and category = 'Get started';

insert into public.articles (company_id, title, category, body, is_published) values

-- ---------------------------------------------------------------------------
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Management', 'Get started', $doc$
> Read this one first. It sets the numbers, the rhythm and the rules that every other department document relies on. It is written for the general manager and for whoever runs ALGECO day to day.

# What Orbit is for ALGECO

Orbit replaces Visual Dolphin as the one place the business lives. The customer and the tender, the take-off and the cost sheet, the purchase from SIDEM, the bar in the warehouse, the panel on the bench, the certificate on site, the invoice, the bill, the payment and the books: one record each, entered once, seen by everyone who needs it. Dolphin stays readable for history. Nothing new goes into it after the go-live date.

![The Orbit home for ALGECO: every app in its group](media:3456adcf-caf1-4bf3-a31f-8af84c5827eb)

The home is grouped the way the company is: Sales and Customers, Procurement and Finance, Execution, HR, Workspace, Specialty and Admin. A person sees the apps their role allows and nothing else. On a phone the same home has a quick bar at the bottom with My work, Search, Home, Alerts and Me.

# What is already set up

- **The company.** ALGECO S.A.R.L, books in US dollars, lira accepted at the counter at the day's rate from the rate table, VAT at 11 percent filed quarterly.
- **The group.** ALGECO BENIN (XOF) and ALGECO CAMEROON (XAF) are companies in the same organisation. Group figures roll up in dollars through the rate table. Contacts, chart of accounts and users are per company; the organisation sees all three.
- **Your own chart of accounts,** not a seeded one. Stock posts to 311, work in progress to 331, goods received not yet invoiced to 4018, cost of sales to 6111, stock adjustments to 6050. VAT on advances received sits on 4428 and paid on 4429.
- **101 suppliers** carried over from Dolphin with a supplier price list, and the Technal profile catalogue costed by weight at 12.01 dollars a kilo.
- **Two views of the same books:** statutory (what is filed) and management (statutory plus anything posted only for you). Every report asks which one.

>! Confirm two names with the bookkeeper before the first quarter closes: 4428 is named "VAT on advances received" and 4429 "VAT on advances paid". Dolphin's export had both as "Vat on advances". If it is the other way round, the two names swap and nothing else changes.

# Set up once, in this order

1. **Settings, Company profile.** Legal name, registration, address, logo, bank details. These print on every document, so a wrong one prints a hundred times.
2. **Settings, Document numbering.** Quote, order, invoice, certificate and purchase order sequences. Decide the prefixes now; changing them after a year of entries is painful. Start each sequence after the last Dolphin number so nothing overlaps.
3. **Settings, Users and roles.** One person per login, no shared logins. The details are in [[Get started: IT, Admin and Data]].
4. **Settings, Approval rules.** Who signs off a purchase order over a threshold, a quote below target margin, a credit note. A rule with nobody named does nothing. Write the thresholds in the table at the end of this document and keep it current.
5. **Opening balances from Dolphin.** Five reports at one cut-off date: trial balance, aged receivable, aged payable, stock valuation, bank balances with the reconciliations. Accounting owns the work ([[Get started: Accounting and Finance]]); you own the date. Pick a month end.
6. **Backups.** Settings, Backups. Take one, download it, put it on a drive that is not in the office. The reminder is monthly and goes to owners and admins.

![Approval rules: who signs a purchase order over the threshold, a quote below margin, a credit note](media:655d57f3-a0bc-402c-9a85-f82d4d74a5ff)

# The rhythm

## Every day
Open Insights. Cash today, quotes waiting for a customer, purchase orders waiting for your approval, bills due this week, work orders late against their site date. Ten minutes, before the first phone call.

![Insights: the numbers of the company on one page](media:c7f0bb5f-ee24-406e-a768-c6be07081456)

## Every week
- Pipeline review with sales: what was won, what was lost, and why. The lost reasons are the only number that improves the win rate.
- Production against site dates: what the saw cuts this week is decided by what site needs next week.
- Aged receivable: who is calling whom, and what was promised.

## Every month
- The month is closed by Accounting and signed by you.
- Project profitability by cost code against the estimate.
- Stock valuation against the ledger.
- VAT position.
- Backup taken and off site.

## Every quarter
VAT filed; group consolidation with Benin and Cameroon; margin by system (Technal series) and by client.

# How Management links to the other departments

Management does not enter data; it sets the numbers the others work to and reads what they produce. Sales works to the target margin you set in the approval rules ([[Get started: Sales and Estimation]]). Procurement works to the purchase threshold you set ([[Get started: Procurement and Suppliers]]). The warehouse and the bench work to the site dates that Projects carry ([[Get started: Warehouse and Inventory]], [[Get started: Fabrication]]). Site works to the certificate terms in each contract ([[Get started: Site and Installation]]). Accounting closes the month you sign and files the quarter ([[Get started: Accounting and Finance]]). HR runs the payroll whose journal lands in that month ([[Get started: HR and Payroll]]). Document control decides which drawing the bench is allowed to cut from ([[Get started: Drawings, Documents and Quality]]). The administrator keeps the logins, the roles and the backups that make all of it trustworthy ([[Get started: IT, Admin and Data]]).

# Rules that do not bend

- No quote leaves without a cost sheet behind it.
- No purchase order without an RFQ or a price-list price behind it.
- No material leaves the warehouse without a move against a project or a work order.
- No invoice without a certificate or a delivery note behind it.
- One person cannot both raise and approve the same purchase.
- Nothing is posted with a hand-typed exchange rate. The rate table is the only source.

# Numbers to watch

| Number | Where it lives | What good looks like |
| --- | --- | --- |
| Gross margin per project against the estimate | Contracting, Project P&L | Achieved within two points of quoted |
| Days sales outstanding | Accounting, Aged Receivable | Falling, and under the payment terms |
| Aluminium cost per kilo | Inventory, Recost from weight | Tracks SIDEM's invoice, not a guess |
| Work-order lead time, cut to install | Manufacturing, Work Orders | Known, and shorter each quarter |
| GRNI (4018) with no bill after 30 days | Accounting, Trial Balance | Close to zero |
| Days since the last backup | Settings, Backups | Under 31 |

# Thresholds in force

| Decision | Threshold | Who approves |
| --- | --- | --- |
| Purchase order | Above the amount set in Approval rules | General manager |
| Quote | Margin below target | General manager |
| Credit note | Any | General manager |
| Variation | Any | Client in writing, through Orbit |

# Owner

The general manager. Reviewed with the department heads every month and edited here, in Knowledge, when something changes. The other nine documents are in the same category and link from the bottom of this page.
$doc$, true),

-- ---------------------------------------------------------------------------
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Sales and Estimation', 'Get started', $doc$
> For the sales team, the estimator and whoever prices tenders. From the first call to the signed contract, and the handover to Projects.

# What you run

Leads, tenders, take-offs, cost sheets, quotes, the order, and the moment a won job becomes a project with a budget. Every project ALGECO builds starts as a record here, and the estimate frozen at the handover is the number the whole company is measured against afterwards.

# Where it lives in Orbit

- **CRM** for the pipeline and the leads. Leads carry the area and the contact person, and the search finds them by either.
- **Estimation** for the tenders being priced, the glass take-off per elevation, and the cost sheet by cost code.
- **Contracting, Tenders** for formal submissions with their documents.
- **Contacts** for the developers, contractors and architects, shared with Accounting, so the invoice goes to the same record you quoted.

![CRM, Pipeline: every opportunity by stage](media:b34ebc58-1276-4e3f-aa71-819e14e501d8)

![Estimation: the tenders and quotes being priced](media:4c8303e3-bd9e-4f32-ad96-d6b2d70eb159)

# What is already set up

- The take-off carries width, height and thickness as typed quantities, so a panel is a panel and not a number. The cut list and the glass order come from it later.
- Products are costed from weight: every Technal profile carries kilograms per metre and bar length, priced at the current aluminium rate. Change the rate once in Inventory, Recost from weight, and every cost sheet that is not frozen follows.
- Cost codes are shared with Contracting and Accounting, so the estimate and the actual are compared line for line.
- Customers and developers are in Contacts, one record each, with the person you deal with on it.

# Set up once

1. **CRM, Stages.** Make the pipeline match how you actually sell: enquiry, site visit, drawings received, tender, quoted, negotiation, won, lost. Lost needs a reason list: price, timing, specification, relationship, no decision.
2. **Cost codes** (Contracting, Cost Codes): aluminium, glass, gaskets and sealants, hardware, fabrication labour, installation labour, transport, scaffolding, subcontract, design, overhead, margin. Agree them with Finance once; they carry through Projects and Accounting.
3. **Quote templates** with the standard exclusions and the payment terms: advance, progress against certificates, retention and its release.
4. **Price lists** per customer tier if you sell frames to other installers.
5. **Terminology** (Settings): if the team says "elevation" and Orbit says "item", rename it once for everyone.

# The procedure, every opportunity

1. Create the lead the day the enquiry arrives: name, area, contact, source, expected value, expected date.
2. Site visit or drawings received: attach them to the lead from the phone. Photos go straight on.
3. Take-off: one line per opening, typed dimensions, system (Technal series), glass specification, quantity. Get it right here; the bench cuts from it later.
4. Cost sheet: pull the take-off in. Aluminium prices itself by weight; glass by square metre from the supplier price list; labour by hours from the routing; transport and scaffolding by the site. The margin line is visible at the bottom. A sheet below the target margin needs the approval named in Settings before it becomes a quote.
5. Quote from the cost sheet. Never type a price into a quote by hand. A quote is a revision of a cost sheet, and revisions are kept, not overwritten.
6. Tender submissions go through Contracting, Tenders with the bond, the programme and the drawings attached, and a follow-up date that shows up in your week.
7. Won: convert to an order. Orbit creates the project with its budget by cost code and freezes the estimate. Changes after that are variations, raised by Site, never edits.
8. Lost: mark it with the reason. This is the number the monthly review reads.

> The one habit that pays: the follow-up date. A quote with no follow-up date is a quote nobody chases.

# Every week

Pipeline review with the general manager. Everything older than its stage's expected age gets a call or a close. Quotes waiting more than 14 days get chased or expired. Tenders due next week are checked for bond and programme.

# How Sales links to the other departments

Sales opens the door for everyone else. The take-off you build becomes the cut list the warehouse reserves against and the work order the bench runs ([[Get started: Warehouse and Inventory]], [[Get started: Fabrication]]). The prices in your cost sheet come from Procurement's price lists and the aluminium rate the warehouse maintains ([[Get started: Procurement and Suppliers]]). The customer you create is the one Accounting invoices and chases ([[Get started: Accounting and Finance]]). The contract terms you put in the quote, retention, advance and payment days, are what Site certifies against ([[Get started: Site and Installation]]). The drawings you receive at tender stage start the register that Document Control keeps ([[Get started: Drawings, Documents and Quality]]). Management sets the target margin you work to ([[Get started: Management]]).

# Rules that do not bend

- One cost sheet per quote revision. Revisions are kept.
- Aluminium is never priced by hand; it is weight times rate.
- Payment terms and retention are in the quote, not in the email.
- A won job is frozen. Everything after is a variation.

# Numbers to watch

| Number | Where | What good looks like |
| --- | --- | --- |
| Win rate by client type | CRM, Pipeline | Known per type, rising |
| Quoted margin against achieved margin | Contracting, Project P&L | Within two points |
| Days from enquiry to quote | CRM, Leads | Under ten working days |
| Quotes older than 14 days with no follow-up | CRM, Pipeline | None |

# Owner

Head of sales, with the estimator. The cost codes are shared with Finance and changed only together.
$doc$, true),

-- ---------------------------------------------------------------------------
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Procurement and Suppliers', 'Get started', $doc$
> For the buyer, and for whoever receives goods at the gate. Aluminium comes from SIDEM and Technal France on long lead times; glass, hardware, gaskets and sealants come from local and regional suppliers on short ones. The two rhythms are different and Orbit handles both.

# What you run

Suppliers and their prices, requests for quotation, purchase orders and their approvals, receiving at the gate, the three-way match, and the bills that follow. Imports come in as shipments with their landed cost, so freight, customs and clearing on a container of profiles land on the bars, not in overhead.

# Where it lives in Orbit

- **Purchase, Vendors:** the 101 suppliers carried over from Dolphin, with what each can supply ticked under Services and Products.
- **Purchase, RFQ / Compare Quotes:** up to three quotes side by side, one awarded.
- **Purchase, Purchase Orders** and **Blanket Orders.**
- **Purchase, Cut List** and **Material Take-off:** where a job's shortfall becomes a requisition.
- **Purchase, 3-Way Match:** the order, the receipt and the bill must agree.
- **Purchase, Shipments:** the container, the bill of lading, and the landed cost.
- **Purchase, Vendor Scorecards:** who delivers late or short.

![Purchase, Vendors: the 101 suppliers carried over from Dolphin](media:7cee2b8e-ba96-49bc-b4cd-d721bb7d5665)

![Purchase, RFQ: up to three quotes side by side, one awarded](media:c803d53d-9a5d-4486-a3a1-157ebe505b92)

# What is already set up

- The supplier list, with website and notes on each, and a supplier price list so an order for a listed item starts from the agreed price.
- Receiving posts stock at cost and books goods received not yet invoiced to 4018 until the bill arrives.
- Approval rules for purchase orders above the threshold Management set ([[Get started: Management]]).
- Landed cost on shipments.

# Set up once

1. Check the top twenty suppliers: currency, payment terms, lead time, contact person, bank details for payment.
2. **Price lists.** Load SIDEM's current Technal list and the glass suppliers' rates, dated, because they change. The cost sheets in Estimation read them.
3. **Approval threshold.** Confirm the number with the general manager; it is written in [[Get started: Management]].
4. **Locations** (with the warehouse): main store, glass rack, offcuts, quarantine for rejects, and one site location per live project.
5. **Vendor scorecard** rules: what counts as late, what counts as short.

# The procedure

1. **The need** arises from a work order, a cut list or a minimum-stock alert. Cut lists reserve stock first; only what is short becomes a requisition.

![Cut list: bars reserved from stock, the shortfall becomes a requisition](media:83d40ef4-83a0-4cc5-bf1e-587b53295f20)

2. **Requisition to RFQ.** For anything not on a price list, or above the threshold, send an RFQ to at least two suppliers. Attach the drawing or the specification.
3. **Compare and award** in the RFQ. The awarded line becomes the purchase order.
4. **Purchase order:** the supplier's currency, the delivery date, the project or work order it serves, the incoterm for imports. Approval if the rule says so. Send it from Orbit; the PDF carries the numbering and the company details.

![Purchase orders: what is on order, from whom, for which job](media:8a4791bb-048f-4685-97ba-cc7ba228506c)

5. **Receiving.** Receive Goods against the order. Count. Check the mill certificate for aluminium and the label for glass. Short or damaged lines go to quarantine with a photo. The stock move and the 4018 entry post at this moment.
6. **The bill.** Accounting matches it to the receipt in 3-Way Match. A price difference shows as a variance, not as a silent change.

![Three-way match: the order, the receipt and the bill must agree](media:e31acb5b-1bc5-4c21-8f32-6ff11a6c45f5)

7. **Imports.** Create a shipment for the container, attach the bill of lading, add freight, customs and clearing as landed cost lines, and close it when the goods are received. The cost per bar then includes the sea.

# Every week

Open purchase orders past their delivery date; receipts with no bill after 30 days (the 4018 balance); the scorecard for late or short deliveries; SIDEM's next shipment date against the production plan.

# How Procurement links to the other departments

Procurement buys what Sales priced and the bench will cut. Your price lists are what the estimator's cost sheet reads ([[Get started: Sales and Estimation]]); a stale price list makes a wrong quote. The cut list you buy against was reserved by the warehouse, and what you receive is counted there ([[Get started: Warehouse and Inventory]]). The work orders that create the need belong to Fabrication ([[Get started: Fabrication]]), and their site dates decide how urgent an order is ([[Get started: Site and Installation]]). Every receipt becomes a bill Accounting matches, and every landed cost becomes part of the stock value on the balance sheet ([[Get started: Accounting and Finance]]). The mill certificate you file at the gate is part of the quality record Document Control keeps ([[Get started: Drawings, Documents and Quality]]).

# Rules that do not bend

- No purchase order without a project, a work order or a stock reason on it.
- No receipt without a count. The order is not the count.
- One buyer raises, another person approves.
- A price difference at the bill is a variance to explain, never a quiet edit.

# Numbers to watch

| Number | Where | What good looks like |
| --- | --- | --- |
| Lead time, SIDEM order to gate | Purchase, Shipments | Known per route, planned against |
| Aluminium cost per kilo landed | Inventory, Recost from weight | Tracks the last landed shipment |
| Receipts with a variance | Purchase, 3-Way Match | Under five percent |
| Open GRNI over 30 days | Accounting, Trial Balance | Close to zero |

# Owner

Head of procurement. The gate belongs to the storekeeper, who counts.
$doc$, true),

-- ---------------------------------------------------------------------------
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Warehouse and Inventory', 'Get started', $doc$
> For the storekeeper and whoever issues material to the workshop and to sites. Perpetual inventory: the ledger moves when the stock moves, so what you record is what the balance sheet says.

# What you run

Every bar, sheet, gasket, sealant tube and hardware box: where it is, what it cost, where it went. Receiving, issuing, offcuts, counts, and the aluminium rate that prices most of the catalogue.

# Where it lives in Orbit

- **Inventory, Overview:** what is on hand, where, and what it is worth.
- **Inventory, Products:** the catalogue with a family tree (Technal series and model) and a type tree (profile, glass, gasket, hardware, consumable). Profiles carry kilograms per metre and bar length.
- **Inventory, Stock Moves, Material Issues, Cycle Count, Scrap.**
- **Inventory, Recost from weight.**
- **Inventory, Warehouses and Locations.**

![Inventory overview: what is on hand, where, and what it is worth](media:519d6631-c1b8-40e1-b021-89e3c766a620)

![Inventory, Products: every profile with its cost and where that cost came from](media:08eddb2a-717e-4db8-a5da-be415e1878b8)

# What is already set up

- **Cost basis on every product:** from a purchase, an average of purchases, the weight model, or typed by a person. The list shows which, so an estimate never passes for a fact. 118 of 129 profiles are costed from weight. Eleven items still need a price: four gaskets, three sealants, three generic metals and one Lumeal clip. Filter the list to No cost yet and they are the only rows left.
- **Stock accounts on the company:** 311 stock, 331 work in progress, 6111 cost of sales, 6050 adjustments. A missing account says so instead of posting nothing.
- **Cut-list reservation:** a work order's cut list reserves bars and turns the shortfall into a requisition for Procurement.

![Recost from weight: one aluminium rate reprices every weight-costed profile](media:98f803b3-744c-416c-8cd5-d68c983cef00)

# Set up once

1. Walk the warehouse with the product list filtered to No cost yet and price the last eleven from their last invoice.
2. Set minimum stock on the consumables that stop a job when they run out: gaskets by profile, sealant by colour, screws, brackets. Replenishment then raises the requisition itself.
3. Locations: main store, glass rack, offcuts, quarantine, and one site location per live project.
4. **First count.** Inventory, Cycle Count, a full count at the cut-off date agreed with Accounting. This becomes the opening stock. Dolphin's valuation is checked against it, not copied.
5. Label the racks with the location names as Orbit has them, so a phone scan and a shelf agree.

# The daily procedure

1. **Receive** against the purchase order, counted, mill certificate attached. Damaged into quarantine with a photo.
2. **Issue** against a work order (to the bench) or an install job (to site). Nothing leaves on a verbal request. The move carries the project, so the cost lands on it.
3. **Offcuts** go back to the offcuts location with their length. A 2.4 metre offcut of a 6.5 metre bar is stock, not scrap.
4. **Glass** is received per order, racked by project, issued per panel. Breakage is a stock adjustment with a photo and a reason.
5. **Site stock** sits in the site location until the certificate or the completion closes it.

![Stock moves: every bar and sheet that came in or went out, with its reason](media:2a4d57f8-bc8c-4819-9a94-73f3a0dbfb2c)

# Every week and every month

- Weekly: cycle count one family; reconcile the offcuts rack; minimum-stock alerts to Procurement.
- Monthly: the stock valuation report against account 311 in the ledger. They must agree. If they do not, find the move, not the number.
- When the aluminium rate changes: Inventory, Recost from weight. It reprices the weight-costed profiles and touches nothing that came from a purchase or was typed.

# How the Warehouse links to the other departments

You are the middle of the chain. Procurement's orders arrive at your gate and become stock only when you count them ([[Get started: Procurement and Suppliers]]). Fabrication's cut lists reserve your bars, and your issues are what the work order consumes ([[Get started: Fabrication]]). Site's crates leave from your rack and sit in a site location until the job closes ([[Get started: Site and Installation]]). The aluminium rate you maintain is what Estimation prices every quote with ([[Get started: Sales and Estimation]]). Every move you make posts to 311 and 6111, so the balance sheet Accounting closes is the sum of your discipline ([[Get started: Accounting and Finance]]). The mill certificates you attach at the gate are part of the quality file ([[Get started: Drawings, Documents and Quality]]).

# Rules that do not bend

- Every move has a reason: purchase, work order, site, count, adjustment. No free moves.
- Counts are blind: count first, compare after.
- Nobody adjusts stock to make a report agree.

# Numbers to watch

| Number | Where | What good looks like |
| --- | --- | --- |
| Stock value by family | Inventory, Overview | Matches 311 to the cent at month end |
| Slow movers over 180 days | Inventory, Products | Falling |
| Offcut value | Inventory, Overview, offcuts location | Used before new bars are cut |
| Count accuracy | Inventory, Cycle Count | Above 98 percent |

# Owner

The storekeeper, reporting to the head of procurement. Accounting checks the valuation monthly.
$doc$, true),

-- ---------------------------------------------------------------------------
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Fabrication', 'Get started', $doc$
> For the workshop manager, the foreman and the quality inspector. The bench: from a frozen take-off to finished panels, labelled, inspected and crated for site.

# What you run

Bills of material, work orders with routing, cut lists, panel tracking by QR label, inspections at every step, and the plan that ties the bench to the site programme.

# Where it lives in Orbit

- **Manufacturing, Work Orders:** one per elevation or delivery batch, with routing steps and a site date.
- **Manufacturing, Bills of Materials:** per panel type, profiles by weight, gaskets by metre, hardware by piece, glass by panel.
- **Manufacturing, Panel Tracking:** every panel with its label, its step and its inspections.
- **Manufacturing, Production Runs** and **Dies.**
- **Purchase, Cut List** for the reservation and the shortfall.

![Manufacturing, Work orders: the bench, with routing and site dates](media:497bb68f-108b-47ab-a5ab-9d1de53f5367)

# What is already set up

- Routing steps: cutting, machining, assembly, gasketing, glazing, packing, with hours per panel type feeding the plan and the cost.
- Cut lists from the take-off that reserve bars and raise what is short.
- Panel tracking: each panel gets a QR label; scanning moves it through the steps and, later, onto the site.
- Inspection checklists per step, with a hold on failure that opens a rework line.
- Work in progress on 331, so the value on the bench is on the balance sheet.

![Panel tracking: every panel with its label, its step and its inspections](media:d827bd0f-af4b-4e42-b254-cc06679d4782)

# Set up once

1. **Routing:** your real steps and the hours each takes per panel type. Wrong hours make a wrong plan and a wrong cost.
2. **BOM templates** per Technal system you fabricate.
3. **Work centres:** saw, CNC, assembly benches, glazing bay, with their daily capacity.
4. **Inspection checklists:** cutting tolerance, drainage slots, sealant, gasket continuity, hardware torque, glass specification and orientation, label present.
5. **Label printer** for the QR labels, tested with the phone scanner.

# The procedure, every project

1. **Handover from Sales** with the frozen take-off, and the drawings marked approved for fabrication by Document Control. Nothing is cut from an unapproved revision; the register will not let it be picked.
2. **Work orders:** one per elevation or delivery batch, with the routing and the site date from Projects.
3. **Cut list:** generated from the take-off, optimised per bar length in Cut Nesting, reserved in the warehouse. Shortfall goes to Procurement with a date.
4. **Cutting:** bars issued against the work order; each cut recorded; offcuts returned with their length.
5. **Every step** scans the panel QR when it starts and when it passes inspection. A failed inspection holds the panel and opens a rework line. It does not disappear.
6. **Glazing:** glass issued per panel; breakage recorded against the panel and the reason.
7. **Packing:** panels grouped per crate with the crate list printed. The crate is what site receives and signs for.
8. **Close the work order:** hours booked, material consumed, panels counted. WIP moves to finished goods and then to the project on delivery.

> A panel with no scan at a step is a panel nobody can find when the client asks where it is. The scan is the job.

# Every day and every week

- Daily: the board, work orders late against the site date, panels on hold, hours booked to work orders today, not reconstructed on Friday.
- Weekly: the plan review with Site. What site needs next week decides what the saw cuts this week. Capacity against the plan; overtime decided here, not on the day.

# How Fabrication links to the other departments

The bench sits between the estimate and the site. Your work orders come from the take-off Sales froze ([[Get started: Sales and Estimation]]); if the take-off was wrong, the bench finds out first, and the finding goes back as a variation, not a quiet fix. Your cut lists reserve the warehouse's bars and your issues consume them ([[Get started: Warehouse and Inventory]]); what is short is Procurement's order with your date on it ([[Get started: Procurement and Suppliers]]). Your crates are what Site signs for and installs, and your site dates come from their programme ([[Get started: Site and Installation]]). Your hours, booked daily, are what HR pays and what the project P&L shows as labour ([[Get started: HR and Payroll]], [[Get started: Accounting and Finance]]). You cut only from revisions Document Control has marked approved for fabrication, and your inspections are part of the quality file ([[Get started: Drawings, Documents and Quality]]).

# Rules that do not bend

- No cut from a drawing that is not marked approved for fabrication.
- No panel leaves without a passed inspection and a label.
- Hours are booked to the work order daily.

# Numbers to watch

| Number | Where | What good looks like |
| --- | --- | --- |
| Panels per day per bench | Manufacturing, Production Runs | Steady, and rising with practice |
| First-pass yield | Manufacturing, Panel Tracking | Above 95 percent |
| Rework hours | Manufacturing, Work Orders | Falling |
| Material yield, kilos cut against kilos in the BOM | Purchase, Cut Nesting | Above 90 percent |
| Work orders late against the site date | Manufacturing, Work Orders | None without a reason |

# Owner

The workshop manager. The quality inspector signs the inspections and owns the checklists.
$doc$, true),

-- ---------------------------------------------------------------------------
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Site and Installation', 'Get started', $doc$
> For project managers, site engineers and installation foremen. From mobilisation to handover, and the money that follows the measurement.

# What you run

Install jobs, the site diary, drawings and submittals on site, progress measurement, certificates, variations, retention, subcontractors, snagging and handover. The site is where the project earns its money, one certificate at a time.

# Where it lives in Orbit

- **Contracting, Install Jobs:** the site side of every project.
- **Contracting, Site Diary, Snags, Inspections, Incidents.**
- **Contracting, Drawing Register, Submittals, RFIs, Transmittals** (shared with Document Control).
- **Contracting, Progress Certificates, Variations, Retention, WIP Schedule, Subcontracts.**
- **Contracting, Job Cost and Project P&L:** site spend against the estimate as it happens.
- **Contracting, Field (phone):** the site engineer's screen.

![Contracting, Install jobs: the site side of every project](media:29930e61-aa2f-4c83-8484-102742886d58)

# What is already set up

- Progress certificates with a claim sheet: cumulative, previous and this period, advance recovery, retention and tax, printed as the formal certificate.
- Subcontract certificates for installation gangs paid by measurement.
- Variations that carry a cost sheet and an approval before work starts.
- Projects with a budget by cost code from the frozen estimate.
- Panels arrive with QR labels; scanning at site receipt and at installation closes the loop from the bench.

![Progress certificates: cumulative, previous and this period, retention and advance on the sheet](media:a640d99f-ba2c-4c7e-a6ba-5d18745e6194)

# Set up once

1. **Project structure:** elevations or zones as items, matching the take-off, so measurement and certificates use the same lines the estimate used.
2. **Site locations** in the warehouse for each live project.
3. **Subcontractors** in Contacts with their rates, and the subcontract with its measurement basis.
4. **Site diary template:** weather, manpower, plant, deliveries, works done, instructions received, delays.
5. **Certificate terms** from the contract: advance percentage and its recovery, retention percentage and release, payment days.

# The procedure

1. **Mobilisation:** install job opened, drawings approved for construction attached, method statement and risk assessment in Documents, the programme dated.
2. **The diary, every day,** by the site engineer, from the phone, with photos. This is the record that wins a delay claim. A diary written a month later is worth nothing.

![Site diary: the record that wins a delay claim, written the same day](media:fa8916cb-87c2-4140-af97-0eb294b3303f)

3. **Deliveries:** crates received against the crate list; damaged panels photographed and raised to the workshop the same day.
4. **Installation:** panels scanned as installed; the percentage complete per elevation updates itself.
5. **Instructions and changes:** anything the consultant asks for that is not in the contract is an RFI or a variation, raised before the work, with a cost sheet, approved by the client in writing through Orbit.

![Variations: raised before the work, with a cost sheet and an approval](media:87802b18-99ab-4b78-9e47-ffab35971957)

6. **Monthly measurement:** agree quantities with the consultant, then the certificate from the claim sheet. Retention and advance recovery are on the sheet, not in someone's head.
7. **Subcontractor measurement** on the same day, certified and passed to Accounting for payment.
8. **Snagging:** the inspection workflow per elevation; each snag with a photo, an owner and a date. Handover when the list is closed and the client has signed in Orbit.
9. **Retention release** at the end of the defects period, from the certificate history.

# Every week

Progress against programme; certificates due; variations waiting for approval; snags open over seven days; site stock reconciled to the crate lists; next week's needs sent to the workshop.

# How Site links to the other departments

Site is where the estimate meets reality. The lines you measure against are the take-off Sales froze ([[Get started: Sales and Estimation]]), and the terms you certify against are in the contract they wrote. Your programme is what the bench cuts to, and your crate receipts close the panel's journey from the workshop ([[Get started: Fabrication]]). Your site locations are the warehouse's stock until the job closes ([[Get started: Warehouse and Inventory]]). Every certificate you issue becomes an invoice Accounting raises and chases, and every subcontractor measurement becomes a bill they pay ([[Get started: Accounting and Finance]]). Your hours and your gangs' hours are HR's payroll ([[Get started: HR and Payroll]]). The as-built revision at handover and the signed handover certificate belong to Document Control ([[Get started: Drawings, Documents and Quality]]).

# Rules that do not bend

- No work on a variation before the approval is in Orbit.
- No certificate without an agreed measurement attached.
- The diary is written the same day.
- A snag has a photo, an owner and a date, or it is not a snag.

# Numbers to watch

| Number | Where | What good looks like |
| --- | --- | --- |
| Percent complete against percent certified | Contracting, WIP Schedule | Certified keeps pace with installed |
| Days from certificate to payment | Accounting, Aged Receivable | Inside the contract terms |
| Variations approved against raised | Contracting, Variations | Every raised one answered within the month |
| Snags open over seven days | Contracting, Snags | None |

# Owner

The project manager per project; the head of contracting overall. The site engineer owns the diary.
$doc$, true),

-- ---------------------------------------------------------------------------
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Accounting and Finance', 'Get started', $doc$
> For the accountant and the bookkeeper, and for the general manager who signs the month. The books of ALGECO S.A.R.L in dollars, lira at the counter, VAT at 11 percent filed quarterly, and the group view across Benin and Cameroon.

# What you run

Invoices, bills, payments, the bank, stock and work in progress posting themselves from the other departments, the month-end close, the VAT quarter, and the reports the auditor and the bank ask for. Most of the ledger is written by other people's work; your job is to make sure it is right and to close it.

# Where it lives in Orbit

- **Accounting, Invoices, Credit Notes, Bills, Refunds, Payments.**
- **Accounting, Journal Entries, Bank Statements, Assets.**
- **Accounting, Chart of Accounts, Taxes, Exchange Rates, Period Lock.**
- **Accounting, Reporting:** Profit and Loss, Balance Sheet, General Ledger, Trial Balance, Partner Ledger, Aged Receivable and Payable, Cash Flow Forecast, VAT / Tax Report, Consolidation, Data Health Check, Traceability.

![Accounting, Invoices: every customer invoice with its payment state](media:6af7d225-063a-4268-90db-ab83867ac6e8)

![Chart of accounts: ALGECO's own, with the stock, WIP, GRNI and cost accounts pinned on the company](media:0a8764b3-cfb0-4739-901c-7fab708b132e)

# What is already set up

- **Your own chart of accounts.** Stock 311, WIP 331, GRNI 4018, cost of sales 6111, stock adjustments 6050. VAT on advances received 4428 and paid 4429; confirm those two names with the bookkeeper.
- **Books:** statutory and management. A book changes what a report adds up, never what is stored. Management-only entries go in the management book.
- **Multi-currency:** the rate table, conversion that refuses to guess (a missing rate stops the posting with a message), and the counter that takes lira and dollars on one bill and books the change as a negative tender.
- **Perpetual inventory** posting to 311 and 6111 from the warehouse; WIP from the workshop; GRNI from receiving.
- **Nineteen money checks** run nightly against the live books and say when a control account and its sub-ledger disagree.

# Set up once: the opening from Dolphin

Ask Dolphin for five reports at one cut-off date: trial balance, aged receivable by customer and invoice, aged payable by supplier and bill, stock valuation by item, bank balances with the reconciliations. Then, in this order:

1. The trial balance as the opening journal, dated the cut-off, in the statutory book.
2. Open invoices and bills as documents dated their original dates, so ageing and chasing work from day one. Their total must equal the control accounts in the opening journal; the nightly check tells you if it does not.
3. Stock from the physical count at the cut-off (see [[Get started: Warehouse and Inventory]]), valued, against 311.
4. Bank balances and the unpresented items, then the first statement import.
5. Lock the period. Dolphin becomes read-only from that date.

![Trial balance: the statutory book, the one the auditor reads](media:6fe4b9e1-0777-4c34-b329-4483b51cc465)

# The monthly close

1. All receipts have bills; all bills are matched or explained. The 4018 balance is aged and known.
2. Certificates issued equal invoices raised; retention held equals the retention account.
3. Bank reconciled to the last day; petty cash and the lira drawer counted and posted.

![Bank statements: import, match, reconcile to the last day](media:177e2e38-b611-4c23-870c-977b9ba3b2e8)

4. Payroll journal posted from HR; NSSF and tax accruals booked.
5. WIP review with the workshop: the value on the bench agrees with 331.
6. Stock valuation agrees with 311; adjustments explained.
7. Depreciation run. Accruals and prepayments.
8. Data Health: run the twelve checks; nothing red.

![Data Health: twelve checks that say when a control account and its ledger disagree](media:59423c44-8ada-4937-b9d8-78d4787a1066)

9. Reports: P&L by cost code and project, balance sheet, cash flow, aged AR and AP, VAT position. Statutory book for filing, management book for the meeting.
10. Close the period. The general manager signs.

# Every quarter and every year

VAT return from the VAT report; group consolidation in dollars with Benin and Cameroon at closing rates; year end with the auditor from the statutory book.

![VAT report: the quarter at 11 percent, ready to file](media:1235e200-68fd-4b16-b2d0-49b8b2098eb3)

# How Accounting links to the other departments

You write almost nothing yourself; you check what everyone else wrote. Sales' quotes set the customer, the terms and the retention you will collect ([[Get started: Sales and Estimation]]). Procurement's receipts are your GRNI and its bills are what you match ([[Get started: Procurement and Suppliers]]). The warehouse's moves are your 311 and 6111 ([[Get started: Warehouse and Inventory]]); the bench's hours and consumption are your 331 ([[Get started: Fabrication]]). Site's certificates are your invoices and its subcontractor measurements are your bills ([[Get started: Site and Installation]]). HR's payroll run is one journal a month ([[Get started: HR and Payroll]]). Management signs the month you close and sets the thresholds you enforce ([[Get started: Management]]). The administrator locks periods and keeps the backup that protects the books ([[Get started: IT, Admin and Data]]).

# Rules that do not bend

- Nothing is posted with a hand-typed exchange rate; the rate table is the only source.
- Control accounts are never journaled directly; the sub-ledger is fixed instead.
- Every adjustment has a reason and a document.
- A locked period stays locked; a correction is a new entry in the open one.

# Numbers to watch

| Number | Where | What good looks like |
| --- | --- | --- |
| Days sales outstanding | Aged Receivable | Under the payment terms |
| Overdue over 60 days | Collections | Falling, with a note on each |
| Cash forecast, 13 weeks | Cash Flow Forecast | Never below the payroll |
| Margin by project against estimate | Project P&L | Within two points |
| GRNI over 30 days | Trial Balance, 4018 | Close to zero |
| Red items in Data Health | Data Health Check | None at close |

# Owner

The head of finance. The bookkeeper runs the day; the accountant closes the month; the general manager signs it.
$doc$, true),

-- ---------------------------------------------------------------------------
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: HR and Payroll', 'Get started', $doc$
> For whoever keeps the people records and runs the payroll. Employees, contracts, attendance and timesheets against projects, leave, payroll runs and payslips, appraisals, and recruitment when a bench or a site needs hands.

# Where it lives in Orbit

- **HR, Employees, Departments, Job Positions, Contracts, Skills, Certifications, Onboarding.**
- **HR, Attendances, Roster, Shifts, Requests (leave), Allocations.**
- **HR, Payslip Runs, Payslips, Salary Structures, Salary Heads, End of Service, Payroll Consolidation, Expenses.**
- **Projects, Timesheets:** hours booked to the work order, the site or the office.
- **Recruitment** for positions and applicants.

![HR, Employees: contracts, departments, documents, one record each](media:e4137a4f-d104-4062-94fa-7b544bb7f351)

# What is already set up

- Employees with contracts, departments and positions; salary structures and heads for allowances, deductions and social contributions.
- Timesheets that post hours to a project or a work order, so labour lands on the job it was spent on.
- Payroll runs that produce payslips and the payroll journal for Accounting.
- Leave requests and approvals; appraisals; recruitment with positions and applicants.
- An employee can also be a contact of a company (a client's engineer, a subcontractor's foreman) without becoming staff.

# Set up once

1. **Departments:** management, sales and estimation, procurement, warehouse, fabrication, site, finance, admin. They drive the org chart and the labour reports.
2. **Salary structure for Lebanon:** basic, transport, family allowance, overtime, NSSF employee and employer shares, income tax bracket. Enter the current statutory rates from the official tables; when they change, change them here once, dated.
3. **Every employee:** contract type and dates, salary, bank details, ID and work-permit documents attached, emergency contact, department, manager, and the work email that links them to their Orbit login so My work opens on their own tasks.
4. **Leave types and balances** at the cut-off date from the old records.
5. **Roles in Orbit:** HR sees people and payroll; managers see their own team's leave and timesheets; nobody else sees salaries. Check this with the administrator ([[Get started: IT, Admin and Data]]).

# The procedure

## Every day
Attendance or timesheets. Workshop hours to the work order, site hours to the install job, office hours to overhead. The same day.

![Attendances: who was where, the same day](media:95c249d2-0508-4bbd-bb9d-28e4e6a8065d)

![Timesheets: hours booked to the work order, the site or the office](media:1be4937a-5fc4-4e9f-8e90-c60bbe363def)

## Every week
Leave requests approved by the manager; overtime approved before it is worked; the recruitment pipeline reviewed for open positions.

## Every month: the payroll
1. Lock the timesheets.
2. Import overtime and absences.
3. Run the payroll.
4. Check the exceptions the run flags: new starters, leavers, changes.
5. Payslips issued in Orbit.
6. Payment file to the bank.
7. Journal posted to Accounting.
8. NSSF and tax declarations from the run.

![Payslip runs: the month, its exceptions, the payslips and the journal](media:ef74d22b-42db-479b-8ea2-576dbbde455d)

## Every year
Appraisals; leave carry-over; contract renewals; statutory rate updates; end-of-service provisions reviewed.

# How HR links to the other departments

Every hour the company pays for is booked somewhere else first. The bench books to work orders ([[Get started: Fabrication]]), the gangs book to install jobs ([[Get started: Site and Installation]]), and those hours are the labour lines in the project P&L that Management reads ([[Get started: Management]]). The payroll journal you post is one line of Accounting's month-end close, and the NSSF and tax accruals sit in their books ([[Get started: Accounting and Finance]]). The roles and logins for every person you onboard or offboard are the administrator's, and the leaver's login is revoked the day you set the exit date ([[Get started: IT, Admin and Data]]). Certifications you keep, welding, working at height, first aid, are part of the quality file Document Control can show a client ([[Get started: Drawings, Documents and Quality]]).

# Rules that do not bend

- Salaries are seen by HR and the general manager only. Check the role before adding a user.
- No overtime paid that was not approved in Orbit before it was worked.
- Every leaver has an exit date, a final settlement and a revoked login the same day.
- Statutory rates are entered from the official table, dated, never from memory.

# Numbers to watch

| Number | Where | What good looks like |
| --- | --- | --- |
| Labour hours per panel and per square metre installed | Projects, Timesheets | Known, and falling with practice |
| Overtime as a share of basic | HR, Payslip Runs | Under the budget line |
| Absence rate | HR, Attendances | Known per department |
| Time to fill a position | Recruitment | Under six weeks |

# Owner

The HR and payroll officer, with the head of finance for the journal.
$doc$, true),

-- ---------------------------------------------------------------------------
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Drawings, Documents and Quality', 'Get started', $doc$
> For the design office, document control and the quality inspector. The register with revisions, submittals to the consultant, RFIs, transmittals, the documents every project carries, signatures, and the quality records that let a panel be traced from bar to building.

# Where it lives in Orbit

- **Contracting, Drawing Register:** number, title, revision, status, the file on each revision.
- **Contracting, Submittals, RFIs, Transmittals.**
- **Documents:** categories, version history, Search and OCR across every file.
- **Sign:** method statements, handovers, anything a client must sign.
- **Contracting, Inspections and Inspection Checklists; Manufacturing, Panel Tracking.**
- **Knowledge:** procedures like this one.

![Drawing register: number, revision and status, the file on each revision](media:3909e667-6503-466a-81f4-3d9ecf8e75c1)

# What is already set up

- The register with statuses: issued for approval, approved for fabrication, approved for construction, superseded. The workshop can only pick a revision marked approved for fabrication.
- Submittals and their responses, RFIs with due dates, transmittals that record what went to whom and when.
- Documents with categories and version history; Sign for anything a client must sign.
- Inspections in the workshop and on site, per checklist, with photos and a hold on failure.
- Panel tracking by QR: every panel knows its drawing revision, its work order, its inspections and its position on site.

![Submittals: what went to the consultant, when, and what came back](media:a757ee89-b066-4d38-94ad-f01dcc636f3c)

# Set up once

1. **Numbering:** drawing numbers by project, elevation and type; submittal and RFI sequences; document categories. Decide once, in Settings, Document Numbering and in the register.
2. **Revision rules:** a drawing is fabricated only from a revision marked approved for fabrication; the workshop cannot pick an older one.
3. **Distribution lists** per project: client, consultant, subcontractors.
4. **Quality checklists** per stage: incoming material, cutting, assembly, glazing, packing, site receipt, installation, handover.
5. **Templates** in Documents: method statement, risk assessment, inspection and test plan, handover certificate, warranty.

# The procedure

1. Drawings issued for approval as a submittal with a transmittal; the response recorded against the same submittal, with the consultant's comments attached.
2. The approved revision uploaded to the register with the status changed; the previous one marked superseded. The workshop and site see the change immediately.
3. RFIs raised with a due date and chased at the due date; the answer is attached to the RFI and, if it changes a drawing, to the next revision.
4. Every panel label carries the drawing and revision; an inspection at each stage checks against it.
5. Site: the as-built revision at handover, with the signed handover and the warranty in Sign.
6. Non-conformance: a failed inspection opens a record with cause, correction and prevention; closed by the inspector, not by the person who made it.

> The register is the only place a drawing status lives. An email saying "use rev C" is not a status. If it is not in the register, the bench does not cut it.

# Every week

Submittals overdue for response; RFIs past due; drawings issued for fabrication with no approved revision; open non-conformances; documents with no owner.

# How Document Control links to the other departments

You decide what the company is allowed to build from. Sales brings the tender drawings that open the register ([[Get started: Sales and Estimation]]). Fabrication cuts only from what you mark approved for fabrication, and its inspections and labels are part of your quality file ([[Get started: Fabrication]]). Site installs from approved for construction, raises the RFIs you chase, and hands over with the as-built and the signature you keep ([[Get started: Site and Installation]]). The mill certificates the warehouse files at the gate are yours too ([[Get started: Warehouse and Inventory]]). HR's certifications for welders and working at height complete the file a client audits ([[Get started: HR and Payroll]]). Management reads the non-conformance count as a measure of the company ([[Get started: Management]]).

# Rules that do not bend

- No drawing goes out except through a transmittal.
- No fabrication from anything not marked approved for fabrication.
- Photos on every inspection.
- A non-conformance is closed by the inspector, never by the person who made it.

# Numbers to watch

| Number | Where | What good looks like |
| --- | --- | --- |
| Submittal turnaround | Contracting, Submittals | Known per consultant, chased at the due date |
| RFIs overdue | Contracting, RFIs | None |
| Non-conformances per project | Contracting, Inspections | Falling |
| First-pass yield | Manufacturing, Panel Tracking | Above 95 percent |

# Owner

The document controller. The quality inspector owns the checklists and closes the non-conformances.
$doc$, true),

-- ---------------------------------------------------------------------------
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: IT, Admin and Data', 'Get started', $doc$
> For whoever administers Orbit for ALGECO: users, roles, settings, backups, data. Orbit is hosted; there is no server to look after, but there is an account to keep tidy and a company to keep safe.

# Where it lives in Orbit

- **Settings, Company Profile, Document Numbering, Terminology, Custom Fields, Automations.**
- **Settings, Users and Roles, Roles and Permissions, Portal Access.**
- **Settings, Approvals and Approval Rules.**
- **Settings, Backups, Privacy and data requests, Audit Log, Import Data.**
- **Accounting, Data Health Check** (with Finance).
- **The App Store,** in the Admin group on the home.

![Settings, Users and roles: one login per person, the right role, the right companies](media:b039eabf-c46e-49b6-bc78-e63c5a305551)

# What is already set up

- One organisation with three companies: ALGECO S.A.R.L, ALGECO BENIN, ALGECO CAMEROON. Members belong to the organisation and can be limited to some companies.
- Roles per app with view, write and manage; owner and admin roles; approval rules; document numbering; taxes at 11 percent; the company profile and print templates.
- **Backups:** a downloadable zip with every record, every attachment, the database schema and Orbit itself, so the company can be rebuilt from nothing. The reminder is monthly and goes to owners and admins.
- **Privacy:** export and erasure requests for a person's data, with a record of processing.
- **Data Health:** twelve reconciliation checks. **Search** across every app and the manual from the home page.
- **Orbit installs on a phone** like an app: Me menu, Install Orbit on this device.

![Roles and permissions: what each role can see, write and manage, per app](media:2e2f9c49-fbfb-443c-97a0-3c2e5d485580)

# Set up once

1. **Users:** one login per person, work email, the right role, the right companies. Nobody shares a login; the audit log names the person.
2. **Roles:** sales cannot approve purchases; the storekeeper cannot post journals; HR alone sees salaries. Test each role by signing in as a test user once.
3. **Approvals:** thresholds and approvers per document type, written down in [[Get started: Management]].
4. **Document numbering and taxes:** checked against the last Dolphin numbers so nothing overlaps.

![Document numbering: the sequences every quote, order, invoice and certificate follows](media:bdb40dd1-f418-4c14-89f0-486197524e65)

5. **Company profile:** logo and details that print on every document; test-print an invoice, a certificate and a purchase order.
6. **Phones:** the site engineers and the storekeeper use Orbit on a phone. Install it from the Me menu, show them the quick bar at the bottom, the search, and the camera on attachments.
7. **The App Store:** keep on the home only what ALGECO uses; the rest stays available from the store.

# The procedure

## When someone joins
User created, role set, companies set, shown this document and the one for their department.

## When someone leaves
Login removed the same day; their open records reassigned. HR sets the exit date; you revoke the login.

## Every month
Take the backup from Settings, Backups, download it, copy it to a drive outside the office, and open the zip once to see that it is not empty. Run Data Health with Finance; fix what is red with the department that owns it.

![Backups: one zip with every record, every attachment and Orbit itself](media:24394fa6-af66-4e44-aa68-e5169ffc9a96)

## Every quarter
Review roles and approval thresholds; review the user list against the payroll; review the audit log for anything odd.

## When a privacy request arrives
Settings, Privacy: log it, export or erase, keep the record.

> Two devices, one account: the company a person is scoped to is stored per user, so switching company on a laptop changes what a phone signed in to the same account can read. Until that rule is changed, one person keeps one company open at a time, and nobody shares a login.

# How Admin links to the other departments

Every department's document ends with "the administrator keeps the login". You create the person HR onboards and revoke the one HR offboards ([[Get started: HR and Payroll]]). You hold the approval thresholds Management decides and Procurement and Sales work to ([[Get started: Management]], [[Get started: Procurement and Suppliers]], [[Get started: Sales and Estimation]]). You lock the periods Accounting closes and keep the backup that protects their books ([[Get started: Accounting and Finance]]). The numbering you set is what Document Control's register and Site's certificates follow ([[Get started: Drawings, Documents and Quality]], [[Get started: Site and Installation]]). The phones you install are the ones the warehouse scans with and the bench scans with ([[Get started: Warehouse and Inventory]], [[Get started: Fabrication]]).

# Rules that do not bend

- One person, one login.
- The backup file leaves the building every month.
- Settings changes are made in Orbit, never asked for by chat or email without a record here.
- A leaver's login is revoked the same day.

# Numbers to watch

| Number | Where | What good looks like |
| --- | --- | --- |
| Days since the last backup | Settings, Backups | Under 31 |
| Users with no sign-in for 60 days | Settings, Users and Roles | None, or removed |
| Red items in Data Health | Accounting, Data Health Check | None at month end |
| Open privacy requests | Settings, Privacy | Answered inside the legal deadline |

# Owner

The administrator named by the general manager.
$doc$, true);
