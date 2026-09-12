-- ============================================================================
-- 165-algeco-get-started.sql  -  one "Get started" document per department for
-- ALGECO S.A.R.L, in its Knowledge app. Each is a standard operating procedure
-- for that department to set itself up on Orbit and then run on it, written
-- from what Orbit already holds about ALGECO: Technal systems bought through
-- SIDEM and Technal France, profiles costed from weight, a supplier list
-- carried over from Dolphin, its own chart of accounts, USD books with lira at
-- the till, and sister companies in Benin and Cameroon.
-- Safe to re-run: it replaces the Get started category for this company only.
-- ============================================================================

delete from public.articles where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and category = 'Get started';

insert into public.articles (company_id, title, category, body, is_published) values
('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Management', 'Get started', $doc$
WHO THIS IS FOR
The general manager and whoever runs the company day to day. Read this one first; every other Get started document assumes it.

1. WHAT ORBIT IS FOR ALGECO
Orbit replaces Visual Dolphin as the one place the business lives: the customer and the tender, the take-off and the cost sheet, the purchase from SIDEM, the bar in the warehouse, the panel on the bench, the certificate on site, the invoice, the bill, the payment and the books. One record each, entered once. Dolphin stays readable for history; nothing new goes into it after go-live.

2. WHAT IS ALREADY SET UP
- The company: ALGECO S.A.R.L, books in US dollars, lira accepted at the counter at the day's rate, VAT at 11 percent filed quarterly.
- The group: ALGECO BENIN (XOF) and ALGECO CAMEROON (XAF) are companies in the same organisation, so group figures roll up in dollars through the rate table. Contacts, chart of accounts and users are per company; the group sees all three.
- Your own chart of accounts, not a seeded one. Stock posts to 311, work in progress to 331, goods received not yet invoiced to 4018, cost of sales to 6111, stock adjustments to 6050. VAT on advances received sits on 4428 and paid on 4429; confirm those two names with the bookkeeper before the first quarter closes.
- 101 suppliers carried over from Dolphin, with a supplier price list, and the Technal profile catalogue costed by weight.
- Two views of the same books: statutory (what is filed) and management (statutory plus anything posted only for you). Reports ask which one.

3. SETUP, ONCE, IN THIS ORDER
a. Settings > Company profile: legal name, registration, address, logo, bank details. These print on every document.
b. Settings > Document numbering: quote, order, invoice, certificate and purchase order sequences. Decide the prefixes now; changing them after a year of entries is painful.
c. Settings > Users and roles: one person per role, no shared logins. See Get started: IT, Admin and Data.
d. Settings > Approvals: who signs off a purchase order over a threshold, a quote below target margin, a credit note. A rule with nobody named does nothing.
e. Opening balances from Dolphin: trial balance, aged receivable, aged payable, stock valuation, bank balances with reconciliations, all at the same cut-off date. Accounting owns this; you own the date.
f. Backups: Settings > Backups. Take one, download it, put it on a drive that is not in the office. Monthly is the default reminder.

4. THE RHYTHM
- Daily: Insights home. Cash today, quotes waiting, purchase orders waiting for your approval, bills due this week, work orders late.
- Weekly: pipeline review with sales (won, lost, why); production plan against site dates; aged receivable and who is calling whom.
- Monthly: close the month (Accounting owns it, you sign it); project profitability by cost code; stock valuation against the ledger; VAT position; backup taken.
- Quarterly: VAT filed; group consolidation; margin by system (Technal series) and by client.

5. RULES THAT DO NOT BEND
- No quote leaves without a cost sheet behind it.
- No purchase order without an RFQ or a price-list price behind it.
- No material leaves the warehouse without a move against a project or a work order.
- No invoice without a certificate or a delivery note behind it.
- One person cannot both raise and approve the same purchase.

6. NUMBERS TO WATCH
Gross margin per project against the estimate; days sales outstanding; aluminium cost per kilo against 12.01; work-order lead time from cut to install; value of GRNI (4018) that has no bill after 30 days.

7. OWNER
General manager. Reviewed with department heads every month, edited here when something changes.
$doc$, true),

('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Sales and Estimation', 'Get started', $doc$
WHO THIS IS FOR
The sales team, the estimator and the person who prices tenders.

1. WHAT YOU RUN
From the first call to the signed contract: leads, tenders, take-offs, cost sheets, quotes, the order, and the handover to Projects. Every project ALGECO builds starts as a record here.

2. WHAT IS ALREADY SET UP
- CRM with pipeline stages. Leads carry the area and the contact person, and the search finds them by either.
- Estimation with a glass take-off per elevation and a cost sheet by cost code. The take-off carries width, height and thickness as typed quantities, so a panel is a panel and not a number.
- Tenders in Contracting for formal submissions, with the documents attached.
- Products costed from weight: every Technal profile carries kilograms per metre and bar length, priced at the current aluminium rate. Change the rate once in Inventory > Recost from weight and every cost sheet that is not yet frozen follows.
- Customers and developers in Contacts, shared with Accounting, so the invoice goes to the same record you quoted.

3. SETUP, ONCE
a. CRM > Configuration: pipeline stages that match how you actually sell (enquiry, site visit, tender, quoted, negotiation, won, lost). Lost needs a reason list.
b. Estimation > Cost codes: aluminium, glass, gaskets and sealants, hardware, fabrication labour, installation labour, transport, scaffolding, subcontract, design, overhead, margin. These same codes carry through Projects and Accounting, so agree them with Finance once.
c. Quote templates with the standard exclusions and payment terms (advance, progress, retention).
d. Price lists per customer tier if you sell frames to other installers.

4. THE PROCEDURE, EVERY OPPORTUNITY
1. Create the lead the day the enquiry arrives. Name, area, contact, source, expected value.
2. Site visit or drawings received: attach them to the lead. Photos from the phone go straight on.
3. Take-off: one line per opening, typed dimensions, system (Technal series), glass spec. The cut list and the glass order come from this later, so get it right here.
4. Cost sheet: pull the take-off in, price aluminium by weight, glass by square metre from the supplier price list, labour by hours. Margin line visible. A sheet with a margin under target needs the approval named in Settings.
5. Quote from the cost sheet. Never type prices into a quote by hand.
6. Tender submissions go through Contracting > Tenders with the bond, the programme and the drawings attached, and a follow-up date.
7. Won: convert to an order, which creates the project with its budget by cost code. The estimate is frozen at that moment; changes after that are variations, not edits.
8. Lost: mark it with the reason. This is the number the monthly review reads.

5. WEEKLY
Pipeline review: everything older than its stage's expected age gets a call or a close. Quotes waiting more than 14 days get chased or expired.

6. RULES
- One cost sheet per quote revision. Revisions are kept, not overwritten.
- Aluminium is never priced by hand; it is weight times rate.
- Payment terms and retention are in the quote, not in the email.

7. NUMBERS TO WATCH
Win rate by client type; quoted margin against achieved margin on finished projects; days from enquiry to quote.

8. OWNER
Head of sales, with the estimator.
$doc$, true),

('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Procurement and Suppliers', 'Get started', $doc$
WHO THIS IS FOR
The buyer, and whoever receives goods at the gate.

1. WHAT YOU RUN
Suppliers, their prices, requests for quotation, purchase orders, receiving, and the bills that follow. Aluminium comes from SIDEM and Technal France on long lead times; glass, hardware, gaskets and sealants come from local and regional suppliers on short ones. The two rhythms are different and Orbit handles both.

2. WHAT IS ALREADY SET UP
- 101 suppliers from Dolphin, with what each can supply ticked under Services and Products, their website and notes.
- A supplier price list, so a purchase order for a listed item starts from the agreed price.
- RFQs that compare up to three quotes side by side and award one.
- Receiving that posts stock at cost and books goods received not yet invoiced to 4018 until the bill arrives.
- Landed cost on shipments, so freight, customs and clearing on a container of profiles land on the bars, not in overhead.

3. SETUP, ONCE
a. Check the top twenty suppliers: currency, payment terms, lead time, contact person, bank details for payment.
b. Purchase > Price lists: load SIDEM's current Technal list and the glass suppliers' rates. Dated, because they change.
c. Settings > Approvals: purchase orders above your threshold need the general manager; below it, the buyer alone. Write the number down here.
d. Inventory > Locations: main warehouse, glass rack, site stock per project, and a quarantine location for rejects.

4. THE PROCEDURE
1. Need arises from a work order, a cut list or a minimum stock alert. Cut lists reserve stock first; what is short becomes a requisition automatically.
2. Requisition to RFQ: for anything not on a price list or above the threshold, send an RFQ to at least two suppliers. Attach the drawing or the spec.
3. Compare and award in the RFQ. The awarded line becomes the purchase order.
4. Purchase order: currency of the supplier, delivery date, project or work order it serves, incoterm for imports. Approval if the rule says so. Send it from Orbit; the PDF carries the numbering and the company details.
5. Receiving: Receive Goods against the order. Count, check the mill certificate for aluminium and the label for glass, put short or damaged lines into quarantine with a photo. Stock moves and 4018 post at this moment.
6. Supplier bill: Accounting matches it to the receipt. Price differences show up as a variance, not as a silent change.
7. Imports: create a shipment for the container, attach the bill of lading, add freight, customs and clearing as landed costs, and close it when the goods are received.

5. WEEKLY
Open purchase orders past their delivery date; receipts with no bill after 30 days (the 4018 balance); supplier scorecard for late or short deliveries.

6. RULES
- No purchase order without a project, a work order or a stock reason on it.
- No receipt without a count. The order is not the count.
- One buyer raises, another person approves.

7. NUMBERS TO WATCH
Lead time SIDEM order to gate; aluminium cost per kilo landed; percent of receipts with a variance; open GRNI.

8. OWNER
Head of procurement.
$doc$, true),

('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Warehouse and Inventory', 'Get started', $doc$
WHO THIS IS FOR
The storekeeper and whoever issues material to the workshop and to sites.

1. WHAT YOU RUN
Every bar, sheet, gasket, sealant tube and hardware box, where it is, what it cost, and where it went. Perpetual inventory: the ledger moves when the stock moves.

2. WHAT IS ALREADY SET UP
- The product catalogue with a family tree (Technal series and model) and a type tree (profile, glass, gasket, hardware, consumable). Profiles carry kilograms per metre and bar length.
- Cost basis on every product: from a purchase, an average of purchases, the weight model, or typed by a person. The list shows which, so an estimate never passes for a fact. 118 of 129 profiles are costed from weight; 11 items (four gaskets, three sealants, three generic metals, one Lumeal clip) still need a price from you or from a purchase.
- Stock accounts on the company: 311 stock, 331 work in progress, 6111 cost of sales, 6050 adjustments. A missing account says so instead of posting nothing.
- Cut-list reservation: a work order's cut list reserves bars and turns the shortfall into a requisition.
- Locations, moves, counts, and receive goods.

3. SETUP, ONCE
a. Walk the warehouse with the product list filtered to No cost yet and price the last 11.
b. Set minimum stock on the consumables that stop a job when they run out: gaskets by profile, sealant by colour, screws, brackets.
c. Locations: main store, glass rack, offcuts, quarantine, and one site location per live project.
d. First count: Inventory > Counts, a full count at the cut-off date agreed with Accounting. This becomes the opening stock; Dolphin's valuation is checked against it, not copied.

4. THE DAILY PROCEDURE
1. Receive: against the purchase order, counted, mill certificate attached. Damaged into quarantine.
2. Issue: against a work order (to the bench) or an install job (to site). Nothing leaves on a verbal request. The move carries the project, so the cost lands on it.
3. Offcuts: returned to the offcuts location with their length. A 2.4 metre offcut of a 6.5 metre bar is stock, not scrap.
4. Glass: received per order, racked by project, issued per panel. Breakage is a stock adjustment with a photo and a reason.
5. Site stock: material sent to site sits in the site location until the certificate or the completion closes it.

5. WEEKLY AND MONTHLY
- Weekly: cycle count one family; reconcile the offcuts rack; minimum-stock alerts to Procurement.
- Monthly: stock valuation report against account 311 in the ledger. They must agree; if they do not, find the move, not the number.
- When the aluminium rate changes: Inventory > Recost from weight, which reprices the weight-costed profiles and touches nothing that came from a purchase.

6. RULES
- Every move has a reason: purchase, work order, site, count, adjustment. No free moves.
- Counts are blind: count first, compare after.
- Nobody adjusts stock to make a report agree.

7. NUMBERS TO WATCH
Stock value by family; slow movers over 180 days; offcut value; count accuracy.

8. OWNER
Storekeeper, reporting to Procurement.
$doc$, true),

('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Fabrication', 'Get started', $doc$
WHO THIS IS FOR
The workshop manager, the foreman, and the quality inspector.

1. WHAT YOU RUN
The bench: from a take-off to finished panels ready for site. Bills of material, work orders with routing, cut lists, panel tracking by QR, inspections, and the plan that ties it to the site programme.

2. WHAT IS ALREADY SET UP
- Manufacturing with BOMs per panel type, work orders with routing steps (cutting, machining, assembly, gasketing, glazing, packing), and a planning board with critical path across projects.
- Cut lists from the take-off that reserve bars and raise what is short.
- Panel tracking: each panel gets a QR label; scanning it moves it through the steps and to the site.
- Inspection workflow with a checklist per step and a hold on failure.
- Work in progress on 331, so the value on the bench is on the balance sheet.

3. SETUP, ONCE
a. Manufacturing > Routing: your real steps and the hours each takes per panel type. These feed the plan and the cost.
b. BOM templates per Technal system you fabricate: profiles by weight, gaskets by metre, hardware by piece, glass by panel.
c. Work centres: saw, CNC, assembly benches, glazing bay, with their daily capacity.
d. Inspection checklists: cutting tolerance, drainage slots, sealant, gasket continuity, hardware torque, glass spec and orientation, label present.
e. Label printer for the QR labels, tested.

4. THE PROCEDURE, EVERY PROJECT
1. Project handed over from Sales with the frozen take-off and the drawings approved for fabrication (see Drawings, Documents and Quality; nothing is cut from an unapproved revision).
2. Work orders: one per elevation or per delivery batch, with the routing and the site date.
3. Cut list: generated from the take-off, optimised per bar length, reserved in the warehouse. Shortfall to Procurement with a date.
4. Cutting: bars issued against the work order; each cut recorded; offcuts returned.
5. Each step scans the panel QR when it starts and when it passes inspection. A failed inspection holds the panel and opens a rework line; it does not disappear.
6. Glazing: glass issued per panel; breakage recorded against the panel.
7. Packing: panels grouped per crate with the crate list printed; the crate is what site receives.
8. Close the work order: hours booked, material consumed, panels counted. WIP moves to finished goods and then to the project on delivery.

5. DAILY AND WEEKLY
- Daily: the board, work orders late against the site date, panels on hold.
- Weekly: plan review with Site: what site needs next week decides what the saw cuts this week. Capacity against the plan; overtime decided here, not on the day.

6. RULES
- No cut from a drawing that is not marked approved for fabrication.
- No panel leaves without a passed inspection and a label.
- Hours are booked to the work order daily, not reconstructed on Friday.

7. NUMBERS TO WATCH
Panels per day per bench; first-pass yield; rework hours; material yield (kilos cut against kilos in the BOM); work orders late.

8. OWNER
Workshop manager. Quality inspector signs the inspections.
$doc$, true),

('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Site and Installation', 'Get started', $doc$
WHO THIS IS FOR
Project managers, site engineers and installation foremen.

1. WHAT YOU RUN
Contracting: the project from mobilisation to handover. Install jobs, the site diary, drawings and submittals on site, progress measurement, certificates, variations, retention, subcontractors, snagging and handover.

2. WHAT IS ALREADY SET UP
- Contracting with install jobs per project, a site diary, and the document flow (drawings, submittals, RFIs, transmittals).
- Progress certificates (IPC) with a claim sheet: cumulative, previous and this period, advance recovery, retention and tax, printed as the formal certificate.
- Subcontract certificates for installation gangs paid by measurement.
- Variations that carry a cost sheet and an approval before work starts.
- Projects with a budget by cost code, so site spend is visible against the estimate as it happens.
- Panels arrive with QR labels; scanning at site receipt and at install closes the loop from the bench.

3. SETUP, ONCE
a. Project structure: elevations or zones as items, matching the take-off, so measurement and certificates use the same lines.
b. Site locations in the warehouse for each live project.
c. Subcontractors in Contacts with their rates, and the subcontract with its measurement basis.
d. Site diary template: weather, manpower, plant, deliveries, works done, instructions received, delays.
e. Certificate terms from the contract: advance percentage and its recovery, retention percentage and release, payment days.

4. THE PROCEDURE
1. Mobilisation: install job opened, drawings approved for construction attached, method statement and risk assessment in Documents, the programme dated.
2. Daily diary, every day, by the site engineer, from the phone. Photos attached. This is the record that wins a delay claim; a diary written a month later is worth nothing.
3. Deliveries: crates received against the crate list; damaged panels photographed and raised to the workshop the same day.
4. Installation: panels scanned as installed; the percentage complete per elevation updates itself.
5. Instructions and changes: anything the consultant asks for that is not in the contract is an RFI or a variation, raised before the work, with a cost sheet, approved by the client in writing through Orbit.
6. Monthly measurement: agree quantities with the consultant, then the certificate from the claim sheet. Retention and advance recovery are on the sheet, not in someone's head.
7. Subcontractor measurement on the same day, certified and passed to Accounting for payment.
8. Snagging: the inspection workflow per elevation; each snag has a photo, an owner and a date. Handover when the list is closed and the client has signed in Orbit.
9. Retention release at the end of the defects period, from the certificate history.

5. WEEKLY
Progress against programme; certificate due dates; variations waiting for approval; snags open over seven days; site stock reconciled to the crate lists.

6. RULES
- No work on a variation before the approval is in Orbit.
- No certificate without an agreed measurement attached.
- The diary is written the same day.

7. NUMBERS TO WATCH
Percent complete against percent certified; days from certificate to payment; variations approved against variations raised; snags per elevation.

8. OWNER
Project manager per project; head of contracting overall.
$doc$, true),

('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Accounting and Finance', 'Get started', $doc$
WHO THIS IS FOR
The accountant and the bookkeeper, and the general manager who signs the month.

1. WHAT YOU RUN
The books of ALGECO S.A.R.L in dollars, with lira at the counter, VAT at 11 percent filed quarterly, and the group view across Benin and Cameroon. Invoices, bills, payments, bank, stock and work in progress posting themselves, month-end close, and the reports the auditor and the bank ask for.

2. WHAT IS ALREADY SET UP
- Your own chart of accounts. Stock 311, WIP 331, GRNI 4018, cost of sales 6111, stock adjustments 6050. VAT on advances received 4428 and paid 4429; confirm those two names.
- Books: statutory and management. A book changes what a report adds up, never what is stored. Post management-only entries in the management book.
- Multi-currency: the rate table, conversion that refuses to guess (a missing rate stops the posting with a message), and the counter that takes lira and dollars on one bill and books the change as a negative tender.
- Perpetual inventory posting to 311 and 6111 from the warehouse moves; WIP from the workshop; GRNI from receiving.
- Bank statements: import, match, reconcile. Aged receivable and payable. VAT report by quarter. Fixed assets with depreciation.
- Nineteen money checks run nightly against the live books and say when a control account and its sub-ledger disagree.

3. SETUP, ONCE: THE OPENING FROM DOLPHIN
Ask Dolphin for five reports at one cut-off date: trial balance, aged receivable by customer and invoice, aged payable by supplier and bill, stock valuation by item, bank balances with the reconciliations. Then, in this order:
a. Trial balance as the opening journal, dated the cut-off, in the statutory book.
b. Open invoices and bills as documents dated their original dates, so ageing and chasing work from day one. Their total must equal the control accounts in the opening journal; the nightly check will tell you if it does not.
c. Stock from the physical count at the cut-off (see Warehouse), valued, against 311.
d. Bank balances and the unpresented items, then the first statement import.
e. Lock the period. Dolphin becomes read-only from that date.

4. THE MONTHLY PROCEDURE
1. All receipts have bills; all bills are matched or explained (4018 aged).
2. Certificates issued equal invoices raised; retention held equals the retention account.
3. Bank reconciled to the last day; petty cash and lira drawer counted and posted.
4. Payroll journal posted from HR; NSSF and tax accruals booked.
5. WIP review with the workshop: value on the bench agrees with 331.
6. Stock valuation agrees with 311; adjustments explained.
7. Depreciation run. Accruals and prepayments.
8. Data Health: run the twelve checks; nothing red.
9. Reports: P&L by cost code and project, balance sheet, cash flow, aged AR and AP, VAT position. Statutory book for filing, management book for the meeting.
10. Close the period. The general manager signs.

5. QUARTERLY AND YEARLY
VAT return from the VAT report; group consolidation in dollars with Benin and Cameroon at closing rates; year-end with the auditor from the statutory book.

6. RULES
- Nothing is posted with a hand-typed exchange rate; the rate table is the only source.
- Control accounts are never journaled directly; the sub-ledger is fixed instead.
- Every adjustment has a reason and a document.

7. NUMBERS TO WATCH
Days sales outstanding; overdue over 60 days; cash forecast 13 weeks; margin by project against estimate; GRNI over 30 days.

8. OWNER
Head of finance. Bookkeeper runs the day; the accountant closes the month.
$doc$, true),

('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: HR and Payroll', 'Get started', $doc$
WHO THIS IS FOR
Whoever keeps the people records and runs the payroll.

1. WHAT YOU RUN
Employees, contracts, departments, attendance and timesheets against projects, leave, payroll runs and payslips, appraisals, and recruitment when a bench or a site needs hands.

2. WHAT IS ALREADY SET UP
- Employees with contracts, departments and positions; salary structures and heads for allowances, deductions and social contributions.
- Timesheets that post hours to a project or a work order, so labour lands on the job it was spent on.
- Payroll runs that produce payslips and the payroll journal for Accounting.
- Leave requests and approvals; appraisals; recruitment with positions and applicants.
- Employees can also be contacts of a company (a client's engineer, a subcontractor's foreman) without becoming staff.

3. SETUP, ONCE
a. Departments: management, sales and estimation, procurement, warehouse, fabrication, site, finance, admin. They drive the org chart and the labour reports.
b. Salary structure for Lebanon: basic, transport, family allowance, overtime, NSSF employee and employer shares, income tax bracket. Enter the current statutory rates from the official tables; when they change, change them here once, dated.
c. Every employee: contract type and dates, salary, bank details, ID and work-permit documents attached, emergency contact, department, manager.
d. Leave types and balances at the cut-off date from the old records.
e. Roles in Orbit: HR sees people and payroll; managers see their own team's leave and timesheets; nobody else sees salaries.

4. THE PROCEDURE
- Daily: attendance or timesheets. Workshop hours to the work order, site hours to the install job, office hours to overhead. The same day.
- Weekly: leave requests approved by the manager; overtime approved before it is worked; recruitment pipeline reviewed for open positions.
- Monthly payroll: 1. lock timesheets; 2. import overtime and absences; 3. run the payroll; 4. check the exceptions the run flags (new starters, leavers, changes); 5. payslips issued in Orbit; 6. payment file to the bank; 7. journal posted to Accounting; 8. NSSF and tax declarations from the run.
- Yearly: appraisals; leave carry-over; contract renewals; statutory rate updates.

5. RULES
- Salaries are seen by HR and the general manager only. Check the role before adding a user.
- No overtime paid that was not approved in Orbit before it was worked.
- Every leaver has an exit date, a final settlement and a revoked login the same day.

6. NUMBERS TO WATCH
Labour hours per panel and per square metre installed; overtime as a share of basic; absence rate; time to fill a position.

7. OWNER
HR and payroll officer, with the head of finance for the journal.
$doc$, true),

('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: Drawings, Documents and Quality', 'Get started', $doc$
WHO THIS IS FOR
The design office, document control, and the quality inspector.

1. WHAT YOU RUN
The drawing register with revisions, submittals to the consultant, RFIs, transmittals, the documents every project carries, electronic signature, and the quality records that let a panel be traced from bar to building.

2. WHAT IS ALREADY SET UP
- Drawing register: number, title, revision, status (issued for approval, approved for fabrication, approved for construction, superseded), with the file on each revision.
- Submittals and their responses, RFIs with due dates, transmittals that record what went to whom and when.
- Documents with categories and version history; Sign for method statements, handovers and anything a client must sign.
- Inspections in the workshop and on site, per checklist, with photos and a hold on failure.
- Panel tracking by QR: every panel knows its drawing revision, its work order, its inspections and its position on site.
- Knowledge, this app, for procedures like this one.

3. SETUP, ONCE
a. Numbering: drawing numbers by project, elevation and type; submittal and RFI sequences; document categories. Decide once, in Settings > Document numbering and in the register.
b. Revision rules: a drawing is fabricated only from a revision marked approved for fabrication; the workshop cannot pick an older one.
c. Distribution lists per project: client, consultant, subcontractors.
d. Quality checklists per stage: incoming material, cutting, assembly, glazing, packing, site receipt, installation, handover.
e. Templates in Documents: method statement, risk assessment, ITP, handover certificate, warranty.

4. THE PROCEDURE
1. Drawings issued for approval as a submittal with a transmittal; the response recorded against the same submittal, with the consultant's comments attached.
2. Approved revision uploaded to the register with the status changed; the previous one marked superseded. The workshop and site see the change immediately.
3. RFIs raised with a due date and chased at the due date; the answer is attached to the RFI and, if it changes a drawing, to the next revision.
4. Every panel label carries the drawing and revision; an inspection at each stage checks against it.
5. Site: the as-built revision at handover, with the signed handover and the warranty in Sign.
6. Non-conformance: a failed inspection opens a record with cause, correction and prevention; closed by the inspector, not by the person who made it.

5. WEEKLY
Submittals overdue for response; RFIs past due; drawings issued for fabrication with no approved revision; open non-conformances.

6. RULES
- No drawing goes out except through a transmittal.
- No fabrication from anything not marked approved for fabrication.
- Photos on every inspection.

7. NUMBERS TO WATCH
Submittal turnaround; RFIs overdue; non-conformances per project; first-pass yield.

8. OWNER
Document controller; the quality inspector owns the checklists.
$doc$, true),

('a12b6b6c-e821-4b7e-8c64-2504c2c807e1', 'Get started: IT, Admin and Data', 'Get started', $doc$
WHO THIS IS FOR
Whoever administers Orbit for ALGECO: users, roles, settings, backups, data.

1. WHAT YOU RUN
The company's setup in Orbit, who can do what, the numbering and taxes, approvals, backups, privacy requests, and the health of the data. Orbit is hosted; there is no server to look after, but there is an account to keep tidy.

2. WHAT IS ALREADY SET UP
- One organisation with three companies: ALGECO S.A.R.L, ALGECO BENIN, ALGECO CAMEROON. Members belong to the organisation and can be limited to some companies.
- Roles per app with view, write and manage; owner and admin roles; approval rules; document numbering; taxes (VAT 11 percent); company profile and print templates.
- Backups: a downloadable zip with every record, every attachment, the database schema and Orbit itself, so the company can be rebuilt from nothing. The reminder is monthly and goes to owners and admins.
- Privacy: export and erasure requests for a person's data, with a record of processing.
- Data Health: twelve reconciliation checks. The App Store per company: turn apps on and off the home without changing what they can do.
- Search across every app and the manual from the home page.

3. SETUP, ONCE
a. Users: one login per person, work email, the right role, the right companies. Nobody shares a login; the audit log names the person.
b. Roles: sales cannot approve purchases; the storekeeper cannot post journals; HR alone sees salaries. Test each role by signing in as a test user once.
c. Approvals: thresholds and approvers per document type, written down in Get started: Management.
d. Document numbering and taxes: checked against the last Dolphin numbers so nothing overlaps.
e. Company profile: logo and details that print on every document; test-print an invoice, a certificate and a purchase order.
f. Phones: the site engineers and the storekeeper use Orbit on a phone. Show them the quick bar at the bottom, the search, and the camera on attachments.
g. The App Store: keep on the home only what ALGECO uses; the rest stays available from the store.

4. THE PROCEDURE
- When someone joins: user created, role set, companies set, shown this document and the one for their department.
- When someone leaves: login removed the same day; their open records reassigned.
- Monthly: take the backup from Settings > Backups, download it, copy it to a drive outside the office, check it opens. Run Data Health; fix what is red with the department that owns it.
- Quarterly: review roles and approval thresholds; review the user list against the payroll.
- When a privacy request arrives: Settings > Privacy, log it, export or erase, keep the record.

5. RULES
- One person, one login.
- The backup file leaves the building every month.
- Settings changes are made in Orbit, never asked for by chat or email without a record here.

6. NUMBERS TO WATCH
Days since the last backup; users with no sign-in for 60 days; red items in Data Health.

7. OWNER
The administrator named by the general manager.
$doc$, true);
