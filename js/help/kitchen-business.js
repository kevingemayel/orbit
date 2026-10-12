/* Orbit screen help: Kitchen, the business side (Estate, Operations, Loss
 * prevention, Roastery, Guests, Delivery and Franchise).
 *
 * One page per screen, keyed by the screen's menu action. js/app.js loads this
 * file the first time help is opened (loadScreenHelp) and renders a page with
 * screenHelpHTML. Plain English, written for someone doing the job for the
 * first time. Never an em dash.
 *
 * The shape of a page (every part except title and what is optional):
 *   title     the screen name as the menu shows it
 *   what      what the screen is for, in two to four sentences (HTML)
 *   when      [the situations in which you open it]
 *   how       [the numbered steps of one worked example, with what you should see]
 *   fields    [[label as on screen, what to enter and what it drives, "required" | "optional" | "auto"]]
 *   buttons   [[label as on screen, what pressing it does]]
 *   after     what saving or posting changes in the books and in other apps (HTML)
 *   links     [{ name, how, to: "menu.action" }]   to makes the name a link
 *   mistakes  [[the message or symptom exactly as shown, why it happens and the fix]]
 *   tips      [short extras worth knowing]
 * HTML inside the strings uses single-quoted attributes, for example
 * <span class='man-key'>Save</span> for a button name.
 *
 * Almost every screen here is a simple list with a pop-up form (fnbCfg in
 * app.js), so they share the same buttons and the same save messages:
 * "(label) is required" for a field marked required on the form, "Saved",
 * "Deleted", and the database messages translated by errMsg.
 */
orbitScreenHelp({

  "estate.stores": {
    title: "Stores",
    what: "A <b>store</b> is one place you trade from: a shop, a kiosk, a central kitchen, a roastery, a warehouse, a pop-up or a truck. This screen lists every store in the company and holds its code, type, ownership, address and size. Other Kitchen screens (tables, bookings, waste, counts, audits, deliveries and more) ask you to pick a store, and only <b>active</b> stores appear in those pickers.",
    when: [
      "You are setting Orbit up for a business with more than one branch, or you open a new one.",
      "A branch is run by a franchisee and you want that recorded against the store.",
      "An address or phone number changes. The Floor reads them for the printed bill.",
      "A branch closes. Set <b>Active</b> to No rather than deleting it."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Estate &rsaquo; Stores</b> and click <span class='man-key'>New</span>. For this example a bakery with a few branches is adding its harbour shop.",
      "Type <i>Harbour Street Bakery</i> in <b>Store name</b> and <i>HSB</i> in <b>Code</b>. The code must be different from every other store's.",
      "Choose <b>Outlet</b> in <b>Type</b> and <b>COCO - company owned, company operated</b> in <b>Ownership</b>. Leave <b>Franchisee</b> on (none), because you run this shop yourself.",
      "Fill in <b>City</b>, <b>Country</b>, <b>Address</b> and <b>Phone</b>. The Floor uses these when it prints a bill for this branch.",
      "Set <b>Opened</b> to the opening date, <b>Seats</b> to 24 and <b>Area m2</b> to 60.",
      "Set <b>Delivery</b> to Yes and <b>Delivery radius km</b> to 3. Leave <b>Drive-thru</b> on No.",
      "Type 28 in <b>Target food cost %</b> and 30 in <b>Target labour %</b> if you want the targets kept with the store.",
      "Leave <b>Active</b> on Yes and click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and the store in the list with a green <b>COCO</b> badge.",
      "Open <b>Service &rsaquo; Floor</b>. Once you have two or more active stores, a store picker appears at the top so each branch sees its own tables."
    ],
    fields: [
      ["Store name", "The name staff and reports use for the branch.", "required"],
      ["Code", "A short code, unique in the company, such as HSB. It shows in the list beside the name.", "required"],
      ["Type", "Outlet, Kiosk, Central kitchen, Roastery, Warehouse, Pop-up or Truck / cart. Used to group the list.", "required"],
      ["Ownership", "COCO (you own and run it), FOFO (a franchisee owns and runs it), FOCO (a franchisee owns it, you run it) or Managed under contract. It sets the badge and the Company owned and Franchised filters.", "required"],
      ["Franchisee", "Only for a franchised store: the franchisee from Franchise &rsaquo; Franchisees.", "optional"],
      ["City", "Shown in the list and used by Group By City.", "optional"],
      ["Country", "Where the store is.", "optional"],
      ["Address", "The street address. The Floor reads it for the printed bill.", "optional"],
      ["Phone", "The branch phone. The Floor reads it for the printed bill.", "optional"],
      ["Opened", "The date the store opened.", "optional"],
      ["Seats", "How many covers the store seats, as a whole number.", "optional"],
      ["Area m2", "The trading area in square metres.", "optional"],
      ["Drive-thru", "Yes if the store has a drive-thru lane.", "optional"],
      ["Delivery", "Yes if the store delivers.", "optional"],
      ["Delivery radius km", "How far the store delivers.", "optional"],
      ["Target food cost %", "The food cost you aim for, as a percentage of sales. It is kept on the store; at present no Orbit report reads it.", "optional"],
      ["Target labour %", "The labour cost you aim for, as a percentage of sales. Kept on the store in the same way.", "optional"],
      ["Active", "Yes by default. No hides the store from every store picker, including the Floor and The book, while old records keep it.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank store form. Only shown to people who can manage the Kitchen app."],
      ["Save", "Checks the required fields, saves the store and refreshes every store picker."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "On an existing store, for people who can manage the Kitchen app. Asks <i>Delete this record?</i> and removes it for good (see What changes)."],
      ["Filters", "<b>Company owned</b> shows COCO stores; <b>Franchised</b> shows every store that is not COCO."],
      ["Group By", "Groups the list by <b>Type</b> or by <b>City</b>."],
      ["Export", "Downloads the list as it is shown, as a CSV file."]
    ],
    after: "A store is a label other records carry. Saving one posts nothing to the accounts. Pickers on the other Kitchen screens are refreshed after every save. <b>Deleting</b> a store also deletes its tables, its 86 availability flags, its labour standards and its sales forecasts; records such as bookings, waste entries, audits and deliveries stay but lose their store. That is why setting <b>Active</b> to No is the safer way to close a branch.",
    links: [
      { name: "Tables", how: "Each table belongs to a store, and the Floor shows the tables of the store picked at the top.", to: "estate.tables" },
      { name: "Floor", how: "Shows a store picker when there is more than one active store, and prints the store's address on the bill.", to: "kitchen.floor" },
      { name: "The book", how: "Bookings are read one day and one store at a time.", to: "kitchen.book" },
      { name: "Franchisees", how: "A franchised store names its franchisee.", to: "fr.franchisees" },
      { name: "Availability (86)", how: "Items are taken off per store.", to: "sc.availability" },
      { name: "Aggregator accounts", how: "One delivery platform account per store.", to: "dlv.accounts" }
    ],
    mistakes: [
      ["Store name is required", "The name is blank. Type one and save again."],
      ["Code is required", "Every store needs a short code. Type one, for example HSB."],
      ["A record with Code HSB already exists. Use a different one.", "Another store already uses that code. Codes are unique in the company, so pick a different one."],
      ["The new store is missing from a picker on another screen", "Its <b>Active</b> is set to No, or the other screen was already open. Check Active, then reopen the screen."],
      ["You don&rsquo;t have permission to do that.", "Your access to this company is read-only. Ask an administrator for manage rights on the Kitchen app."],
      ["The branch's tables disappeared", "The store was deleted, which deletes its tables too. Recreate the tables under Estate &rsaquo; Tables, and next time set Active to No instead."]
    ],
    tips: [
      "Give every store a code before you add tables and bookings, so lists stay readable as the estate grows.",
      "A single-site business can have one store or none: the Floor and The book work without one."
    ]
  },

  "estate.brands": {
    title: "Brands",
    what: "A <b>brand</b> is a trading name the group runs, for example a coffee concept and a bakery concept inside the same company. This screen keeps the list of brands. Today the list is used by <b>Approved suppliers</b>, where a supplier can be approved for one brand only.",
    when: [
      "Your group runs more than one concept and you want supplier approvals per concept.",
      "A brand is retired and should stop appearing in the Approved suppliers picker."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Estate &rsaquo; Brands</b> and click <span class='man-key'>New</span>. In this example a restaurant group runs a grill and a coffee bar.",
      "Type <i>Ember Grill</i> in <b>Name</b> and <i>EG</i> in <b>Code</b>.",
      "Leave <b>Active</b> on Yes and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the brand in the list.",
      "Click <span class='man-key'>New</span> again and add <i>Corner Coffee</i> with code <i>CC</i>.",
      "Open <b>Franchise &rsaquo; Approved suppliers</b> and click <span class='man-key'>New</span>. You should see both brands in the <b>Brand</b> picker."
    ],
    fields: [
      ["Name", "The brand as customers know it.", "required"],
      ["Code", "A short code shown in the list. Orbit does not check that it is unique.", "optional"],
      ["Active", "Yes by default. No removes the brand from the Approved suppliers picker.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank brand form. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the brand."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the brand after <i>Delete this record?</i>. Its approved-supplier rows are deleted with it."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. Deleting a brand also deletes every approved-supplier row that was limited to that brand.",
    links: [
      { name: "Approved suppliers", how: "A supplier approval can be limited to one brand.", to: "fr.suppliers" },
      { name: "Stores", how: "The store form does not have a brand field, so brands are not attached to stores from these screens.", to: "estate.stores" }
    ],
    mistakes: [
      ["Name is required", "The name is blank. Type the brand name."],
      ["The brand is missing from the Approved suppliers picker", "Its Active is set to No. Set it back to Yes."]
    ],
    tips: [
      "If you want to stop using a brand but keep its supplier approvals, set Active to No instead of deleting it."
    ]
  },

  "estate.regions": {
    title: "Regions",
    what: "A <b>region</b> is a name for a country or an area, such as <i>North Coast</i> or <i>Capital</i>. This screen keeps the list of regions with their country. At present no other screen reads regions and the store form has no region field, so the list is for your own reference.",
    when: [
      "You want an agreed list of area names before the estate grows.",
      "You are tidying up and want to retire a region name."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Estate &rsaquo; Regions</b> and click <span class='man-key'>New</span>. In this example a coffee chain groups its shops into two areas.",
      "Type <i>North Coast</i> in <b>Name</b> and the country in <b>Country</b>.",
      "Leave <b>Active</b> on Yes and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the region in the list.",
      "Add <i>Capital</i> the same way.",
      "To retire a region later, open it, set <b>Active</b> to No and save. The Active column shows No."
    ],
    fields: [
      ["Name", "The region's name.", "required"],
      ["Country", "The country it is in.", "optional"],
      ["Active", "Yes by default. Shown in the Active column.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank region form. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the region."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the region after <i>Delete this record?</i>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing else changes. A region is not linked to stores, access rights or reports from these screens.",
    links: [
      { name: "Stores", how: "Use the store's City and Country to group branches by place today.", to: "estate.stores" }
    ],
    mistakes: [
      ["Name is required", "The name is blank. Type the region name."]
    ],
    tips: [
      "Stores can already be grouped by City in their own list, which covers most area reporting needs."
    ]
  },

  "estate.tables": {
    title: "Tables",
    what: "The <b>tables</b> a waiter serves, one row per table. The Floor draws its floor plan from this list: tables grouped by <b>zone</b>, in the <b>Order</b> you set, showing their seats and their state. The book offers these tables when a party is seated.",
    when: [
      "You are setting up table service for the first time. The Kitchen tutorial asks for at least four tables.",
      "The room changes: a terrace opens, tables are joined permanently or taken out.",
      "A table is stuck in the wrong state on the Floor and needs setting back to Free."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Estate &rsaquo; Tables</b> and click <span class='man-key'>New</span>. In this example a restaurant sets out two tables inside and two on the terrace.",
      "Type <i>T1</i> in <b>Name</b>, the name staff already use.",
      "Pick the <b>Store</b>. If the company has any active store, do not leave this blank: the Floor only shows the tables of the store picked at its top.",
      "Type <i>Inside</i> in <b>Zone</b> and 4 in <b>Seats</b>.",
      "Leave <b>Status</b> on (none): a new table starts as Free. Type 10 in <b>Order</b> (a blank Order would also be 10) so the next tables can go 20, 30 and 40.",
      "Leave <b>Active</b> on Yes and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and T1 in the list.",
      "Add <i>T2</i> (Inside, 2 seats, Order 20), then <i>Terrace 1</i> and <i>Terrace 2</i> with Zone <i>Terrace</i> and Order 30 and 40.",
      "Open <b>Service &rsaquo; Floor</b>. You should see two groups, Inside and Terrace, each table showing its seats, all coloured Free."
    ],
    fields: [
      ["Name", "What staff call the table: T1, Terrace 3, Bar 2.", "required"],
      ["Store", "The store the table is in. The Floor filters tables by the store picked at its top, so a table with no store does not show there once you have active stores.", "optional"],
      ["Zone", "The area of the room, such as Inside, Terrace or Bar. The Floor groups tables by zone; a blank zone is grouped as Floor.", "optional"],
      ["Seats", "How many people the table seats. Shown on the table on the Floor.", "optional"],
      ["Status", "Free, Seated, Ordered, Bill or Needs clearing. Service changes it as the table is used; set it here only to correct a table. Left on (none), a new table starts as Free.", "optional"],
      ["Order", "The position of the table on the Floor and in this list, lowest first. Use steps of 10 so you can slot tables in later. Left blank, a new table gets 10.", "optional"],
      ["Active", "Yes by default. No takes the table off the Floor and out of The book.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank table form. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the table. The Floor shows it the next time it is opened."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the table after <i>Delete this record?</i>. Bookings that named it keep the booking but lose the table."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. The Floor reads active tables, and during service it updates each table's status as parties are seated, order, ask for the bill and leave. The book reads the same tables when it offers somewhere to seat a party.",
    links: [
      { name: "Floor", how: "The floor plan is drawn from this list, grouped by zone.", to: "kitchen.floor" },
      { name: "The book", how: "Seating a booking offers the free tables that are big enough.", to: "kitchen.book" },
      { name: "Stores", how: "Each table belongs to a store; deleting a store deletes its tables.", to: "estate.stores" },
      { name: "All bookings", how: "Shows the table a booking was given.", to: "dlv.reservations" }
    ],
    mistakes: [
      ["Name is required", "The table has no name. Type the one staff use."],
      ["Fill in Status. It is required.", "An existing table had its Status set back to (none). Choose a status, such as Free, and save again."],
      ["Fill in Sort. It is required.", "The <b>Order</b> box of an existing table was emptied. Type a number such as 10."],
      ["No tables set up for this store yet.", "Shown on the Floor. Either no table exists, or the tables have no Store or belong to a different store than the one picked. Open each table and set its Store."],
      ["A table stays Seated after the party left", "Open it here, set Status to Free and save."]
    ],
    tips: [
      "Model what a waiter would call a table, not every stool.",
      "Numbering Order in tens keeps the Floor in room order when you add a table in the middle later."
    ]
  },

  "estate.docs": {
    title: "Licences and documents",
    what: "A register of the papers that keep a store open: licences, permits, insurance, leases and certificates, each with its expiry date. The list is sorted with the soonest expiry at the top and colours each date, so anything close to lapsing stands out.",
    when: [
      "A licence, permit, insurance policy or lease is issued or renewed.",
      "You open the register each month to see what expires soon.",
      "An inspector or landlord asks when a document runs out."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Estate &rsaquo; Licences and documents</b> and click <span class='man-key'>New</span>. In this example a bakery records its food business licence.",
      "Type <i>Food business licence</i> in <b>Name</b> and choose <b>Licence</b> in <b>Kind</b>.",
      "Pick the <b>Store</b> it covers, for example Harbour Street Bakery.",
      "Type the licence number in <b>Reference</b> and the authority in <b>Issued by</b>.",
      "Set <b>Issued</b> to 2026-04-01 and <b>Expires</b> to 2027-03-31.",
      "Change <b>Warn me N days before</b> from 30 to 60, because renewal takes a while.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the document with a green expiry date.",
      "From 2027-01-30 the same date turns amber, and after 2027-03-31 it turns red. Use <span class='man-key'>Filters</span> &rsaquo; <b>Expiring or expired</b> to see only those."
    ],
    fields: [
      ["Name", "What the document is, as you would say it.", "required"],
      ["Kind", "Licence, Permit, Insurance, Lease or Certificate. Shown as a badge.", "optional"],
      ["Store", "The store it applies to. Leave blank for a company-wide document.", "optional"],
      ["Reference", "The number printed on the document.", "optional"],
      ["Issued by", "The authority, insurer or landlord.", "optional"],
      ["Issued", "The date it was issued.", "optional"],
      ["Expires", "The date it runs out. It orders the list and decides the colour: green, amber within the warning days, red once past.", "optional"],
      ["Warn me N days before", "How many days before expiry the date turns amber. 30 unless you change it; left blank on a new document it is also 30. It colours the list; it does not send an email.", "optional"],
      ["Note", "Anything worth keeping, such as who handles the renewal.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank document form. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the document."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the document after <i>Delete this record?</i>."],
      ["Filters", "<b>Expiring or expired</b> shows documents whose expiry is within their warning days or already past."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted and no reminder is sent. The register is only as good as the dates in it, so update the record the day a renewal arrives.",
    links: [
      { name: "Stores", how: "Each document can be tied to one store.", to: "estate.stores" },
      { name: "Store audits", how: "A food safety audit often checks that licences are current.", to: "ops.audits" }
    ],
    mistakes: [
      ["Name is required", "The document has no name. Type one."],
      ["Fill in Reminder days. It is required.", "The <b>Warn me N days before</b> box of an existing document was emptied. Type a number, such as 30."],
      ["A document with no colour on its date", "Expires is blank, so Orbit cannot tell when it lapses. Fill it in."]
    ],
    tips: [
      "When a document is renewed, edit the same record with the new dates rather than adding a second one, so the list shows one line per document.",
      "Open the Expiring or expired filter at the start of each month."
    ]
  },

  "ops.checkruns": {
    title: "Checklist runs",
    what: "A <b>checklist run</b> is one time a checklist was done: the opening round on Monday at the harbour shop, the closing clean on Friday night. Each run records which checklist, where, which shift, who completed it, a score and whether it passed. <b>Fill in the round</b> asks the template's questions one by one: a yes or no, a reading with the range it must stay inside, or a line of text, each with room to say what was done about a failure. Saving them scores the round and fails it outright when a critical check fails.",
    when: [
      "A shift finishes its opening, closing, cleaning or food safety round.",
      "A round failed and you want it on record with a note of what went wrong.",
      "A manager or inspector asks to see which rounds were done, and when."
    ],
    how: [
      "Make sure the checklist exists and is active under <b>Operations &rsaquo; Checklist templates</b>.",
      "Open <b>Kitchen &rsaquo; Operations &rsaquo; Checklist runs</b> and click <span class='man-key'>New</span>. In this example a coffee shop records this morning's opening round.",
      "Leave <b>Date</b> on today and pick <i>Opening checks</i> in <b>Checklist</b>.",
      "Pick the <b>Store</b> and type <i>Morning</i> in <b>Shift</b>.",
      "Choose <b>Complete</b> in <b>Status</b>. Left on (none), a new run starts as Open.",
      "Type 18 in <b>Score</b> if you score the round, and the barista's name in <b>Completed by</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the run at the top of the list with a green Complete badge.",
      "If a round fails, save it with Status <b>Failed</b> and say why in <b>Note</b>. <span class='man-key'>Filters</span> &rsaquo; <b>Failed</b> then lists every failed round."
    ],
    fields: [
      ["Date", "The day the round was done. Today unless you change it.", "required"],
      ["Checklist", "Which checklist was run. Only active templates are listed.", "required"],
      ["Store", "Where it was done.", "optional"],
      ["Shift", "Free text, such as Morning or Close.", "optional"],
      ["Status", "Open (started, not finished), Complete or Failed. Left on (none), a new run starts as Open.", "optional"],
      ["Score", "A number you give the round, if you score it. Shown in the Score column.", "optional"],
      ["Completed by", "Who did the round.", "optional"],
      ["Note", "What went wrong, or anything worth recording.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank run. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the run."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the run after <i>Delete this record?</i>."],
      ["Filters", "<b>Failed</b> shows failed runs; <b>Open</b> shows runs still open."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. The run is a dated record that the round happened. Deleting the checklist template later leaves the run in place, with the Checklist column blank.",
    links: [
      { name: "Checklist templates", how: "Every run names one active template.", to: "ops.checktpl" },
      { name: "Stores", how: "A run can be tied to the store where it was done.", to: "estate.stores" },
      { name: "Store audits", how: "An audit judges a visit; runs show the routine rounds between audits.", to: "ops.audits" }
    ],
    mistakes: [
      ["Checklist is required", "There is no active template to choose. Create one, or set an existing one to Active, in Checklist templates."],
      ["Date is required", "The date box was cleared. Pick the day of the round."],
      ["Fill in Status. It is required.", "An existing run had its Status set back to (none). Choose Open, Complete or Failed."]
    ],
    tips: [
      "Record a run as soon as the round is done. A run typed up days later proves much less."
    ]
  },

  "ops.checktpl": {
    title: "Checklist templates",
    what: "A <b>checklist template</b> names a routine round that every store runs the same way: opening checks, closing clean, fridge temperatures, a brand audit. Each template has a kind and how often it is due. Checklist runs pick from the active templates. Its questions live on it too, under <b>The questions</b>: one line each, with a type (yes/no, a number with its allowed range, or free text), the section it belongs to and the order they are asked in.",
    when: [
      "You introduce a new routine, such as an hourly toilet check.",
      "You want every branch to record the same rounds under the same names.",
      "A routine is dropped and should no longer be offered in Checklist runs."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Operations &rsaquo; Checklist templates</b> and click <span class='man-key'>New</span>. In this example a bakery chain sets up its opening round.",
      "Type <i>Opening checks</i> in <b>Name</b>.",
      "Choose <b>Opening</b> in <b>Kind</b> and <b>Daily</b> in <b>Frequency</b>.",
      "Leave <b>Active</b> on Yes and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the template with an Opening badge.",
      "Add <i>Fridge temperatures</i> with Kind <b>HACCP / food safety</b> and Frequency <b>Per shift</b>.",
      "Open <b>Checklist runs</b> and click <span class='man-key'>New</span>. You should see both templates in the <b>Checklist</b> picker."
    ],
    fields: [
      ["Name", "What the round is called, as staff will see it when they record a run.", "required"],
      ["Kind", "Opening, Closing, Hourly, Shift handover, Cleaning, HACCP / food safety or Audit. Shown as a badge.", "required"],
      ["Frequency", "Daily, Per shift, Weekly or Monthly. For your information; Orbit does not schedule runs from it.", "optional"],
      ["Active", "Yes by default. No removes the template from the Checklist runs picker.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank template. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the template."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the template after <i>Delete this record?</i>. Runs recorded against it stay, with a blank Checklist."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. Active templates appear in the Checklist runs picker straight after saving.",
    links: [
      { name: "Checklist runs", how: "Each run records one completed round of a template.", to: "ops.checkruns" }
    ],
    mistakes: [
      ["Name is required", "The template has no name. Type one."],
      ["The template is not offered in Checklist runs", "Its Active is No. Set it to Yes."]
    ],
    tips: [
      "Retire a template by setting Active to No rather than deleting it, so past runs keep their checklist name."
    ]
  },

  "ops.equipment": {
    title: "Equipment",
    what: "The machines the business owns: espresso machines, grinders, ovens, fridges, freezers, ice machines and till hardware. Each record says where the machine is, who supplied it, its serial number, when the warranty ends and whether it is running. Maintenance schedules are set against these records.",
    when: [
      "A new machine is delivered.",
      "A machine goes in for repair, comes back, or is retired.",
      "You need a serial number or warranty date when calling an engineer."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Operations &rsaquo; Equipment</b> and click <span class='man-key'>New</span>. In this example a coffee chain records a new espresso machine.",
      "Type <i>Bar espresso machine</i> in <b>Name</b> and <i>EQ-014</i> in <b>Asset code</b>.",
      "Choose <b>Espresso machine</b> in <b>Category</b> and pick the <b>Store</b>.",
      "Fill in <b>Make</b>, <b>Model</b> and <b>Serial no</b> from the plate on the machine.",
      "Pick the <b>Supplier</b>, and set <b>Purchased</b> to 2026-09-01 and <b>Warranty until</b> to 2028-08-31.",
      "Choose <b>Active</b> in <b>Status</b>, or leave it on (none): a new machine starts as Active.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the machine in the list.",
      "When it breaks down, open it, set Status to <b>In repair</b> and save. <span class='man-key'>Filters</span> &rsaquo; <b>In repair</b> lists every machine that is out."
    ],
    fields: [
      ["Name", "What the team calls the machine.", "required"],
      ["Asset code", "Your own tag number for it.", "optional"],
      ["Category", "Espresso machine, Grinder, Oven, Fridge, Freezer, Ice machine, POS hardware or Other. Used by Group By.", "optional"],
      ["Store", "Where the machine is.", "optional"],
      ["Make", "The manufacturer.", "optional"],
      ["Model", "The model name or number.", "optional"],
      ["Serial no", "The serial number from the plate.", "optional"],
      ["Supplier", "Who sold or services it. Any contact can be chosen.", "optional"],
      ["Purchased", "The purchase date.", "optional"],
      ["Warranty until", "When the warranty ends. Shown in the list.", "optional"],
      ["Status", "Active, In repair or Retired. Left on (none), a new machine starts as Active.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank machine form. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the machine and refreshes the Equipment picker in Maintenance."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the machine after <i>Delete this record?</i>. Its maintenance schedules are deleted with it."],
      ["Filters", "<b>In repair</b> shows machines whose status is In repair."],
      ["Group By", "Groups the list by <b>Category</b> or by <b>Store</b>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted to the accounts: this is a register, not a fixed asset. Every machine, whatever its status, can be chosen in Maintenance.",
    links: [
      { name: "Maintenance", how: "Each schedule belongs to one machine from this list.", to: "ops.maintenance" },
      { name: "Stores", how: "A machine is placed in one store.", to: "estate.stores" }
    ],
    mistakes: [
      ["Name is required", "The machine has no name. Type one."],
      ["Fill in Status. It is required.", "An existing machine had its Status set back to (none). Choose Active, In repair or Retired."],
      ["A machine's maintenance schedules vanished", "The machine was deleted, which deletes its schedules. Set Status to Retired instead of deleting."]
    ],
    tips: [
      "Photograph the serial plate when the machine arrives and type it in straight away; plates wear off."
    ]
  },

  "ops.maintenance": {
    title: "Maintenance",
    what: "The routine jobs each machine needs and when they are next due: backflush, descale, filter change, annual service. The list is sorted with the next job first, and a due date that has already passed is shown in red, so overdue work is visible at a glance.",
    when: [
      "A new machine arrives and its routine jobs need setting up.",
      "A job has just been done and the next due date should move on.",
      "You check at the start of the week what is overdue."
    ],
    how: [
      "Make sure the machine exists under <b>Operations &rsaquo; Equipment</b>.",
      "Open <b>Kitchen &rsaquo; Operations &rsaquo; Maintenance</b> and click <span class='man-key'>New</span>. In this example the bar espresso machine is backflushed once a week.",
      "Pick <i>Bar espresso machine</i> in <b>Equipment</b> and type <i>backflush</i> in <b>Task</b>.",
      "Type 7 in <b>Every N days</b> and set <b>Last done</b> to the day it was last backflushed.",
      "Leave <b>Next due</b> empty and click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and Next due is 7 days after Last done.",
      "The next time the job is done, open the schedule, change <b>Last done</b> to that day and save. Next due moves to 7 days after it by itself.",
      "Use <span class='man-key'>Filters</span> &rsaquo; <b>Overdue</b> to see every job whose next due date has passed."
    ],
    fields: [
      ["Equipment", "The machine the job is for, from Equipment.", "required"],
      ["Task", "The job, for example backflush, descale or filter change.", "required"],
      ["Every N days", "How often the job is done, in days.", "optional"],
      ["Last done", "When the job was last done.", "optional"],
      ["Next due", "When the job is next due. Orbit works it out as Last done plus Every N days when you save a new schedule, or when you change Last done or Every N days. A date you type here in the same save is kept.", "auto"],
      ["Active", "Yes by default. Kept on the schedule; the list shows active and inactive schedules alike.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank schedule. Only for people who can manage the Kitchen app."],
      ["Save", "Works out Next due from Last done and Every N days when either changed or Next due is empty, unless you typed Next due yourself, then saves."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the schedule after <i>Delete this record?</i>."],
      ["Filters", "<b>Overdue</b> shows schedules whose Next due is before today."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted and no reminder is sent. The red Next due badge is the reminder, so the list only helps if Last done and Next due are kept up to date.",
    links: [
      { name: "Equipment", how: "Every schedule belongs to a machine; deleting the machine deletes its schedules.", to: "ops.equipment" }
    ],
    mistakes: [
      ["Equipment is required", "No machine exists yet. Add it under Equipment first."],
      ["Task is required", "The job has no name. Type what is done."],
      ["Next due did not move after I changed Last done", "Every N days is empty, or Next due was changed in the same save, which keeps the date you typed. Fill Every N days, or put Next due back, and save again."]
    ],
    tips: [
      "Put the supplier's recommended interval in Every N days, then adjust it once you see how the machine behaves."
    ]
  },

  "ops.audits": {
    title: "Store audits",
    what: "A <b>store audit</b> is a visit that judges a store: brand standards, food safety or a mystery shopper. Each audit records the store, the auditor, the score out of a maximum and a summary. The findings that need fixing are recorded as <b>Audit actions</b>, each linked to its audit.",
    when: [
      "An area manager, a head office auditor or a mystery shopper has visited a store.",
      "You want to compare scores between branches or over time.",
      "An audit's actions are all done and the audit can be closed."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Operations &rsaquo; Store audits</b> and click <span class='man-key'>New</span>. In this example a franchise brand records a brand standards visit.",
      "Leave <b>Date</b> on the day of the visit and pick the <b>Store</b>.",
      "Choose <b>Brand standards</b> in <b>Kind</b> and type the auditor's name in <b>Auditor</b>.",
      "Type 84 in <b>Score</b> and 100 in <b>Out of</b>.",
      "Choose <b>Issued</b> in <b>Status</b> and write the headline findings in <b>Summary</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the audit with an amber <b>84%</b> score badge.",
      "Open <b>Audit actions</b> and add one action for each finding, choosing this audit in <b>Audit</b>.",
      "When every action is done, come back, set Status to <b>Closed</b> and save."
    ],
    fields: [
      ["Date", "The day of the visit. Today unless you change it.", "required"],
      ["Store", "The store audited. Only active stores are listed.", "required"],
      ["Kind", "Brand standards, Food safety or Mystery shopper.", "required"],
      ["Auditor", "Who carried out the audit.", "optional"],
      ["Score", "The points scored.", "optional"],
      ["Out of", "The maximum possible. With both filled in, the list shows the score as a percentage: green at 90% or more, amber from 75%, red below. Without it, the score itself is shown as the percentage.", "optional"],
      ["Status", "Draft, Issued, Actioned or Closed. Left on (none), a new audit starts as Draft.", "optional"],
      ["Summary", "The headline findings in a few lines.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank audit. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the audit and makes it available in the Audit actions picker."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the audit after <i>Delete this record?</i>. Its audit actions are deleted with it."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. The audit appears in the <b>Audit</b> picker of Audit actions as its date and kind, for example <i>2026-09-14 Brand standards</i>. Deleting an audit deletes all of its actions.",
    links: [
      { name: "Audit actions", how: "Each finding that needs fixing is an action linked to this audit.", to: "ops.auditactions" },
      { name: "Stores", how: "Every audit is of one store.", to: "estate.stores" },
      { name: "Licences and documents", how: "Food safety visits often check licence dates.", to: "estate.docs" }
    ],
    mistakes: [
      ["Store is required", "There is no active store to choose. Add or reactivate one under Estate &rsaquo; Stores."],
      ["Fill in Status. It is required.", "An existing audit had its Status set back to (none). Choose Draft, Issued, Actioned or Closed."],
      ["A score badge over 100%", "Out of is smaller than Score, or blank while Score is a raw points total. Fill in Out of correctly."]
    ],
    tips: [
      "Always fill in Out of, so audits with different scoring sheets can be compared as percentages."
    ]
  },

  "ops.auditactions": {
    title: "Audit actions",
    what: "Every finding from a store audit that someone has to fix, with how serious it is, who owns it, when it is due and where it has got to. The list is sorted by due date, and a due date that has passed on an action not yet done or verified turns red.",
    when: [
      "An audit has just been issued and its findings need owners.",
      "An owner reports that a fix is done, or a manager checks it and verifies it.",
      "You review what is overdue across the estate."
    ],
    how: [
      "Make sure the audit is saved under <b>Operations &rsaquo; Store audits</b>.",
      "Open <b>Kitchen &rsaquo; Operations &rsaquo; Audit actions</b> and click <span class='man-key'>New</span>. In this example the brand standards visit found a broken fridge seal.",
      "Pick the audit in <b>Audit</b>. It is listed by its date and kind.",
      "Type <i>Walk-in fridge door seal torn</i> in <b>Finding</b> and choose <b>Major</b> in <b>Severity</b>.",
      "Type the store manager in <b>Owner</b> and set <b>Due</b> to a week from today.",
      "Choose <b>Open</b> in <b>Status</b> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the action with a grey due date.",
      "When the seal is replaced, set Status to <b>Done</b>; once someone has checked it, set <b>Verified</b>.",
      "Use <span class='man-key'>Filters</span> &rsaquo; <b>Overdue</b> each week to chase anything past its date."
    ],
    fields: [
      ["Audit", "The audit the finding came from. The latest 200 audits are listed.", "required"],
      ["Finding", "What is wrong, in plain words.", "required"],
      ["Severity", "Critical, Major or Minor. Shown as a badge.", "required"],
      ["Owner", "Who is responsible for fixing it.", "optional"],
      ["Due", "When it must be fixed. Red once past, unless the action is Done or Verified.", "optional"],
      ["Status", "Open, In progress, Done or Verified. Left on (none), a new action starts as Open.", "optional"],
      ["Note", "What was done, or why it is late.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank action. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the action."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the action after <i>Delete this record?</i>."],
      ["Filters", "<b>Open</b> shows Open and In progress actions; <b>Overdue</b> shows actions past their due date that are not Done or Verified."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. The audit's own Status does not change by itself when its actions are done; update it on the audit.",
    links: [
      { name: "Store audits", how: "Every action belongs to one audit, and is deleted if the audit is deleted.", to: "ops.audits" }
    ],
    mistakes: [
      ["Audit is required", "No audit exists yet. Save the audit first under Store audits."],
      ["Finding is required", "Describe the problem before saving."],
      ["Fill in Status. It is required.", "An existing action had its Status set back to (none). Choose Open, In progress, Done or Verified."]
    ],
    tips: [
      "One finding per action, each with a single owner, makes the Overdue filter meaningful.",
      "The list does not show which store an action belongs to; putting the store name at the start of Finding makes search work."
    ]
  },

  "ops.exceptions": {
    title: "Exception report",
    what: "A report of recorded <b>exceptions</b>: voids, discounts, refunds, comps, no-sales and price overrides, grouped by the cashier who rang them. For each cashier it shows how many, their total value and how that value compares with the average cashier in the period, so an outlier stands out. It points a manager at a pattern; it does not prove anything by itself.",
    when: [
      "At the end of a week or month, to see whose exceptions are well above the average.",
      "A till is short and you want to know who voided or refunded most.",
      "You want a printed or spreadsheet copy for a loss prevention meeting."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Loss prevention &rsaquo; Exception report</b>. In this example a restaurant group reviews last month.",
      "Choose <b>This month</b> in the period box at the top, or <b>Custom range&hellip;</b> and set the From and To dates.",
      "You should see one row per cashier, sorted with the highest value first, and a <b>Total</b> row at the bottom.",
      "Read <b>vs average</b>. 100% is an average cashier. A figure above 130% is shown amber and above 200% red. A cashier at 240% has rung more than twice the value of the average cashier.",
      "Read <b>Breakdown</b> to see what kind the exceptions were, for example <i>Void 6, Discount 2</i>.",
      "Change the period to <b>Last year</b> or <b>This quarter</b> to see whether the same person is at the top every time.",
      "Click <span class='man-key'>Export</span> for a CSV copy, or <span class='man-key'>Print</span>."
    ],
    fields: [
      ["Period", "This year, This quarter, This month, Last year, All time or Custom range. The report counts exceptions that happened inside it.", "optional"],
      ["From and To", "Only with Custom range: the first and last day to include. To defaults to today.", "optional"],
      ["Cashier", "The name recorded with the exception; <i>(unknown)</i> when none was recorded.", "auto"],
      ["Count and Value", "How many exceptions the cashier has in the period and their total amount.", "auto"],
      ["vs average", "The cashier's value as a percentage of the average value per cashier in the period.", "auto"],
      ["Breakdown", "How many of each kind: Void, Discount, Refund, Comp, No sale, Price override.", "auto"]
    ],
    buttons: [
      ["Period box", "Recalculates the report for the chosen period."],
      ["Export", "Downloads the table as a CSV file."],
      ["Print", "Opens the browser's print window, where you can also save a PDF."]
    ],
    after: "A report only: nothing is saved or changed. It reads up to the 2,000 most recent exceptions in the period, with their reason code and store.",
    links: [
      { name: "Reason codes", how: "Each exception can carry a reason code of the matching kind.", to: "ops.reasons" },
      { name: "Counter", how: "The counter screen where sales are rung.", to: "kitchen.counter" },
      { name: "Floor", how: "The table service screen.", to: "kitchen.floor" }
    ],
    mistakes: [
      ["No exceptions recorded in this period. Once the till records voids, discounts and refunds with a reason code, this ranks them by cashier so an outlier stands out.", "Nothing was recorded for the period chosen. Try All time. In this version the Counter, the Floor and the Register do not yet write exception records themselves, so outside sample data the report can stay empty."],
      ["Nothing to export yet", "Export was pressed on an empty report. There is no table to copy."],
      ["One cashier is always top", "They may simply work the busiest shifts. Compare Count with the hours they work before drawing a conclusion."]
    ],
    tips: [
      "Being at the top once means little. Being well above the average week after week is worth a quiet conversation."
    ]
  },

  "ops.reasons": {
    title: "Reason codes",
    what: "The list of reasons a void, discount, refund, comp, no-sale or price override can be given, such as <i>Wrong item rung</i> or <i>Staff discount</i>. Each reason belongs to one kind, has a short code, and says whether a manager is needed. The Exception report shows the reason recorded with each exception.",
    when: [
      "You are setting up loss prevention and want an agreed list of reasons.",
      "Staff keep using a reason that is too vague, and it should be split or retired.",
      "A new discount, such as a loyalty reward, is introduced."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Loss prevention &rsaquo; Reason codes</b>. Companies that existed when this feature was added were given a starter set, such as Wrong item rung, Staff discount and Change given.",
      "Click <span class='man-key'>New</span>. In this example a coffee chain adds a reason for spilt drinks.",
      "Choose <b>Comp</b> in <b>Applies to</b>.",
      "Type <i>spill</i> in <b>Code</b> and <i>Drink spilt, remade</i> in <b>Reason</b>.",
      "Set <b>Needs a manager</b> to No, because a remade drink is routine.",
      "Type 20 in <b>Order</b> and leave <b>Active</b> on Yes.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the reason in the list under its kind.",
      "Use <span class='man-key'>Group By</span> &rsaquo; <b>Applies to</b> to see the reasons for each kind together."
    ],
    fields: [
      ["Applies to", "Void, Discount, Refund, Comp, No sale or Price override: which kind of exception the reason is for.", "required"],
      ["Code", "A short code, unique within its kind.", "required"],
      ["Reason", "The wording staff will recognise.", "required"],
      ["Needs a manager", "Yes by default. Records that a manager should approve this reason. In this version no screen enforces it.", "optional"],
      ["Order", "The position of the reason within its kind, lowest first. Left blank, a new reason gets 10.", "optional"],
      ["Active", "Yes by default. Set No to retire a reason while keeping it on past exceptions.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank reason. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the reason."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the reason after <i>Delete this record?</i>. Exceptions that used it keep their amount but lose the reason."],
      ["Group By", "Groups the list by <b>Applies to</b>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. The reason is available to be recorded with exceptions and is shown by the Exception report.",
    links: [
      { name: "Exception report", how: "Ranks recorded exceptions by cashier and shows their reasons.", to: "ops.exceptions" }
    ],
    mistakes: [
      ["Code is required", "Type a short code, for example spill."],
      ["Reason is required", "Type the wording staff will see."],
      ["Fill in Sort. It is required.", "The <b>Order</b> box of an existing reason was emptied. Type a number such as 10."],
      ["A record with Kind comp and Code spill already exists. Use a different one.", "That kind already has a reason with the same code. Change the code, or edit the existing reason."]
    ],
    tips: [
      "Keep the list short. Six clear reasons get used; twenty get guessed."
    ]
  },

  "rst.lots": {
    title: "Green lots",
    what: "A <b>green lot</b> is one delivery of unroasted coffee from one origin. The record keeps where it came from (origin, farm, region, varietal, process, harvest, altitude), its quality (moisture, screen size, cupping score), how much arrived, how much is left and what it cost per kilo. Roast batches name the lot they used.",
    when: [
      "A sack or container of green coffee arrives at the roastery.",
      "You cup a lot and want its score on record.",
      "You check how much of a lot is left before planning roasts."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Roastery &rsaquo; Green lots</b> and click <span class='man-key'>New</span>. In this example a coffee chain's roastery receives a washed lot.",
      "Type <i>LOT-2609-01</i> in <b>Lot code</b>. Every lot in the company needs its own code.",
      "Pick the green coffee item in <b>Green product</b> and the importer in <b>Supplier</b>.",
      "Fill in <b>Origin</b>, <b>Farm / station</b>, <b>Region</b> and <b>Varietal</b>, and choose <b>Washed</b> in <b>Process</b>.",
      "Type 2026 in <b>Harvest year</b>, 1900 in <b>Altitude m</b>, 10.5 in <b>Moisture %</b> and <i>15/16</i> in <b>Screen</b>.",
      "Type 86.5 in <b>Cupping score</b>.",
      "Type 600 in both <b>Received kg</b> and <b>Remaining kg</b>, 7.40 in <b>Cost per kg</b>, and set <b>Arrived</b> to today.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the lot at the top of the list, showing 600 kg left.",
      "After each roast, open the lot and lower <b>Remaining kg</b> by the green weight used. Orbit does not do this for you."
    ],
    fields: [
      ["Lot code", "Your code for the lot, unique in the company. Roast batches pick lots by this code.", "required"],
      ["Green product", "The green coffee item in your item list, if you keep one.", "optional"],
      ["Supplier", "Who sold you the lot. Any contact can be chosen.", "optional"],
      ["Origin", "The country of origin. Used by Group By.", "optional"],
      ["Farm / station", "The farm or washing station.", "optional"],
      ["Region", "The growing region.", "optional"],
      ["Varietal", "The coffee variety.", "optional"],
      ["Process", "Washed, Natural, Honey or Anaerobic.", "optional"],
      ["Harvest year", "The harvest, as a year.", "optional"],
      ["Altitude m", "The growing altitude in metres.", "optional"],
      ["Moisture %", "The moisture reading on arrival.", "optional"],
      ["Screen", "The bean screen size, as text.", "optional"],
      ["Cupping score", "The score from your cupping.", "optional"],
      ["Received kg", "How much arrived.", "optional"],
      ["Remaining kg", "How much is left. You keep it up to date; roast batches do not reduce it.", "optional"],
      ["Cost per kg", "What one kilo cost. Shown in the list.", "optional"],
      ["Arrived", "The arrival date. The list is sorted newest first by it.", "optional"],
      ["Notes", "Tasting notes, certifications or anything else.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank lot. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the lot and adds it to the Green lot picker in Roast batches."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the lot after <i>Delete this record?</i>. Roast batches that used it stay, without the lot."],
      ["Group By", "Groups the list by <b>Origin</b> or by <b>Process</b>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "A green lot is a traceability record. Saving one does not receive stock, does not create a bill and posts nothing to the accounts; record the purchase itself through Purchase and Accounting as usual.",
    links: [
      { name: "Roast batches", how: "Each batch names the green lot it was roasted from.", to: "rst.batches" },
      { name: "Items", how: "The Green product is an item from your item list.", to: "products" },
      { name: "Bills", how: "The supplier's invoice for the lot is recorded as a bill.", to: "inv.in" }
    ],
    mistakes: [
      ["Lot code is required", "Every lot needs a code. Type one."],
      ["A record with Lot code LOT-2609-01 already exists. Use a different one.", "Another lot already has that code. Add a suffix, or open the existing lot."],
      ["Remaining kg never goes down", "Orbit does not reduce it when you roast. Lower it yourself after each batch."]
    ],
    tips: [
      "Use a lot code that already appears on the sack or the importer's paperwork, so the physical lot and the record match."
    ]
  },

  "rst.batches": {
    title: "Roast batches",
    what: "A <b>roast batch</b> is one run of the roaster: how many kilos of green coffee went in, how many roasted kilos came out, which lot and profile were used and the roaster's readings. Orbit works out the <b>roast loss</b> for you, and shows it red when it falls outside 10 to 20 per cent, which is the quickest sign that a profile has drifted.",
    when: [
      "A batch has just come out of the roaster.",
      "You want to trace a bag back to its roast date and green lot.",
      "Loss figures look wrong and you want to compare batches of the same profile."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Roastery &rsaquo; Roast batches</b> and click <span class='man-key'>New</span>. In this example the roastery roasts a house espresso batch.",
      "Type <i>R-0914-1</i> in <b>Batch code</b> and leave <b>Roast date</b> on today.",
      "Pick <i>LOT-2609-01</i> in <b>Green lot</b>, the roasted bag item in <b>Roasted product</b> and the roastery store in <b>Roastery</b>.",
      "Type 15.0 in <b>Green kg in</b> and 12.6 in <b>Roasted kg out</b>.",
      "Type <i>House espresso</i> in <b>Profile</b> and the roaster's name in <b>Roasted by</b>.",
      "Type the readings: 200 in <b>Charge temp</b>, 221 in <b>Drop temp</b> and 1.8 in <b>Development min</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the batch with a green <b>16%</b> loss badge: (15.0 minus 12.6) divided by 15.0.",
      "Cup the batch later, then open it and add the <b>Cupping score</b> and <b>QC notes</b>.",
      "Use <span class='man-key'>Group By</span> &rsaquo; <b>Profile</b> to compare the loss of every House espresso batch."
    ],
    fields: [
      ["Batch code", "Your code for the batch, as printed on the bags.", "optional"],
      ["Roast date", "The day of the roast. Today unless you change it.", "required"],
      ["Green lot", "The lot the green coffee came from, newest arrivals first.", "optional"],
      ["Roasted product", "The roasted item the batch produces.", "optional"],
      ["Roastery", "The store where it was roasted.", "optional"],
      ["Green kg in", "The green weight loaded.", "required"],
      ["Roasted kg out", "The roasted weight that came out. It cannot be more than the green weight.", "required"],
      ["Loss", "Shown in the list, not on the form: green minus roasted, as a percentage of green, to two decimals. Red below 10% or above 20%, green otherwise.", "auto"],
      ["Profile", "The roast profile name. Used by Group By.", "optional"],
      ["Roasted by", "Who ran the roaster.", "optional"],
      ["Charge temp", "The temperature when the beans went in.", "optional"],
      ["Drop temp", "The temperature when the beans came out.", "optional"],
      ["Development min", "Development time in minutes.", "optional"],
      ["Cupping score", "The score when the batch was cupped.", "optional"],
      ["QC notes", "What the cupping found.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank batch. Only for people who can manage the Kitchen app."],
      ["Save", "Checks the weights, saves the batch and calculates the loss."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the batch after <i>Delete this record?</i>."],
      ["Group By", "Groups the list by <b>Profile</b> or by <b>Month</b>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "The batch is a production record. Saving it does not move stock, does not reduce the green lot's Remaining kg and posts nothing to the accounts.",
    links: [
      { name: "Green lots", how: "Lower the lot's Remaining kg by the green weight used.", to: "rst.lots" },
      { name: "Items", how: "The Roasted product is an item from your item list.", to: "products" },
      { name: "Grinder dial-in", how: "A new batch in the shops usually needs the grinder dialled in again.", to: "rst.grinder" }
    ],
    mistakes: [
      ["Roasted weight cannot exceed green weight", "Roasted kg out is bigger than Green kg in, usually two boxes swapped. Correct them and save."],
      ["Green kg in is required", "Type the green weight loaded."],
      ["Roasted kg out is required", "Type the roasted weight that came out."],
      ["Loss column is blank", "Green kg in is 0, so no percentage can be worked out."]
    ],
    tips: [
      "Weigh green and roasted on the same scale, every time. A loss that jumps by two points is more often a scale than a roaster."
    ]
  },

  "rst.grinder": {
    title: "Grinder dial-in",
    what: "A log of each time a grinder was dialled in: the grind setting, the dose, the yield, the shot time and whether it tasted right. Orbit works out the <b>ratio</b> (yield divided by dose) for you. A ratio that drifts from one session to the next is often the first sign of a worn burr or a change in the beans.",
    when: [
      "Every morning, when the first shots are pulled and the grinder is adjusted.",
      "A new roast batch or a new coffee goes into the hopper.",
      "Drinks taste sour or bitter and you want to see what changed."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Roastery &rsaquo; Grinder dial-in</b> and click <span class='man-key'>New</span>. In this example a barista dials in the house espresso at opening.",
      "Leave <b>Date</b> on today and type <i>Morning</i> in <b>Shift</b>.",
      "Pick the <b>Store</b> and the coffee in <b>Coffee</b>.",
      "Type the dial position, for example <i>4.2</i>, in <b>Grind setting</b>.",
      "Type 18 in <b>Dose g</b>, 36 in <b>Yield g</b>, 28 in <b>Time sec</b> and 93 in <b>Temp C</b>.",
      "Type the barista's name in <b>Tasted by</b> and <i>balanced</i> in <b>Verdict</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the log with a <b>Ratio</b> of 2."
    ],
    fields: [
      ["Date", "The day of the session. Today unless you change it.", "required"],
      ["Shift", "Free text, such as Morning.", "optional"],
      ["Store", "Where the grinder is.", "optional"],
      ["Coffee", "The coffee being ground, from your item list.", "optional"],
      ["Grind setting", "The dial position, as text.", "optional"],
      ["Dose g", "Ground coffee in the basket, in grams.", "optional"],
      ["Yield g", "Espresso in the cup, in grams.", "optional"],
      ["Time sec", "Shot time in seconds.", "optional"],
      ["Temp C", "Brew temperature.", "optional"],
      ["Ratio", "Shown in the list: Yield divided by Dose, to two decimals. Blank when there is no dose.", "auto"],
      ["Tasted by", "Who tasted the shot.", "optional"],
      ["Verdict", "How it tasted, for example balanced, sour or bitter.", "optional"],
      ["Note", "Anything else, such as a burr change.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank log. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the log and calculates the ratio."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the log after <i>Delete this record?</i>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted and no stock moves. The log is a quality record.",
    links: [
      { name: "Roast batches", how: "A fresh batch in the hopper is the usual reason to dial in again.", to: "rst.batches" },
      { name: "Equipment", how: "Record the grinder itself, and its burr changes, under Equipment.", to: "ops.equipment" }
    ],
    mistakes: [
      ["Date is required", "The date box was cleared. Pick the day."],
      ["Ratio is blank", "Dose g is empty or 0. Type the dose."]
    ],
    tips: [
      "Log the first dial-in of every shift, not just the problem days, or a slow drift is invisible."
    ]
  },

  "rst.wholesale": {
    title: "Wholesale accounts",
    what: "The terms you agree with a <b>wholesale customer</b>: an office that takes your coffee, a hotel or a cafe that buys your beans or bread. Each account names the customer and records the price tier, delivery day and route, credit limit, how they are billed, any equipment on loan and the volume they committed to. It is the sheet a delivery round is planned from.",
    when: [
      "A new office, hotel or cafe signs up to buy from you.",
      "You plan the week's delivery rounds by day and route.",
      "A machine is lent to a customer and you need a record of it."
    ],
    how: [
      "Make sure the customer exists as a contact in Orbit.",
      "Open <b>Kitchen &rsaquo; Roastery &rsaquo; Wholesale accounts</b> and click <span class='man-key'>New</span>. In this example a bakery supplies bread and coffee to a hotel.",
      "Pick the hotel in <b>Customer</b>.",
      "Type <i>Trade B</i> in <b>Price tier</b>, choose <b>Tuesday</b> in <b>Delivery day</b> and type <i>Coast route</i> in <b>Route</b>.",
      "Type 2000 in <b>Credit limit</b> and choose <b>Monthly</b> in <b>Billing</b>. Left on (none), a new account is billed Monthly.",
      "Type <i>1 filter brewer, serial FB-2231</i> in <b>Equipment on loan</b> and 40 in <b>Volume commitment kg</b>.",
      "Leave <b>Active</b> on Yes and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the hotel in the list with <i>tue</i> in the Day column."
    ],
    fields: [
      ["Customer", "The business you supply. Any contact can be chosen.", "required"],
      ["Price tier", "The name of the price level agreed, as text.", "optional"],
      ["Delivery day", "Monday to Saturday. The list shows it as a short code such as tue.", "optional"],
      ["Route", "The delivery round the account is on.", "optional"],
      ["Credit limit", "The most they may owe. Kept for reference; Orbit does not block sales against it from here.", "optional"],
      ["Billing", "Monthly or Per delivery. Left on (none), a new account is billed Monthly.", "optional"],
      ["Equipment on loan", "Anything of yours at their premises.", "optional"],
      ["Volume commitment kg", "The volume they agreed to take.", "optional"],
      ["Active", "Yes by default. Shown in the Active column.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank account. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the account."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the account after <i>Delete this record?</i>."],
      ["Export", "Downloads the list, for example to plan a round, as a CSV file."]
    ],
    after: "The account is a record of terms. It does not create orders or invoices and posts nothing. Invoice the customer through Sales and Accounting as usual.",
    links: [
      { name: "Customers", how: "Every wholesale account belongs to a contact.", to: "contacts" },
      { name: "Invoices", how: "Deliveries to the account are invoiced as customer invoices.", to: "inv.out" }
    ],
    mistakes: [
      ["Customer is required", "No contact exists to choose. Add the customer under Customers first."],
      ["Fill in Billing. It is required.", "An existing account had its Billing set back to (none). Choose Monthly or Per delivery."]
    ],
    tips: [
      "Group rounds by exporting the list and sorting it by Day and Route in a spreadsheet."
    ]
  },

  "rst.courses": {
    title: "Training academy",
    what: "The <b>courses</b> you run, such as a barista foundation course or a latte art class: their level, length and price, whether the public can book them, and whether they are still running. The same list serves courses you sell and courses you use to train your own staff.",
    when: [
      "You launch a new course or change its price.",
      "A course is withdrawn.",
      "Someone asks what courses you offer and at what price."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Roastery &rsaquo; Training academy</b> and click <span class='man-key'>New</span>. In this example a coffee chain lists its entry course.",
      "Type <i>Barista foundations</i> in <b>Name</b> and <i>Level 1</i> in <b>Level</b>.",
      "Type 6 in <b>Hours</b> and 120 in <b>Price</b>.",
      "Leave <b>Sold to the public</b> on Yes and <b>Active</b> on Yes.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the course in the list with Public: Yes.",
      "For a staff-only course, set <b>Sold to the public</b> to No."
    ],
    fields: [
      ["Name", "The course title.", "required"],
      ["Level", "The level, as text, such as Level 1 or Advanced.", "optional"],
      ["Hours", "How long the course lasts.", "optional"],
      ["Price", "What a place costs.", "optional"],
      ["Sold to the public", "Yes by default. No for a course only for your own staff.", "optional"],
      ["Active", "Yes by default. No for a course you no longer run.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank course. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the course."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the course after <i>Delete this record?</i>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "The course is a catalogue entry. Bookings and payments are not taken on this screen and nothing is posted; invoice a paid place through Sales and Accounting.",
    links: [
      { name: "Invoices", how: "A place sold to the public is invoiced as a customer invoice.", to: "inv.out" },
      { name: "Employees", how: "Staff who attend are your employees.", to: "hr.emp" }
    ],
    mistakes: [
      ["Name is required", "The course has no title. Type one."]
    ],
    tips: [
      "Keep old courses with Active set to No, so you can see what used to be offered."
    ]
  },

  "gst.loyalty": {
    title: "Loyalty programmes",
    what: "A description of a <b>loyalty programme</b>: points, a stamp card, spend tiers or visit tiers, with how points are earned and what they are worth, how many stamps earn a reward, the reward item, a birthday reward and the dates it runs. <b>Important:</b> the points the Register gives and redeems today are set in <b>Settings &rsaquo; Company Profile</b> (<i>Loyalty points per 100 spent</i> and <i>Loyalty value per point</i>), not by the programmes on this screen.",
    when: [
      "You are designing a scheme and want its rules written down in one place.",
      "A programme starts, changes or ends.",
      "Staff ask what the stamp card rules are."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Guests &rsaquo; Loyalty programmes</b> and click <span class='man-key'>New</span>. In this example a coffee chain runs a buy nine, get one free card.",
      "Type <i>Coffee card</i> in <b>Name</b> and choose <b>Stamp card</b> in <b>Kind</b>.",
      "Type 9 in <b>Stamps for a reward</b>. Buy 9 get 1 free means 9.",
      "Pick a regular coffee item in <b>Reward item</b>.",
      "Type <i>Free pastry in birthday week</i> in <b>Birthday reward</b>.",
      "Set <b>Starts</b> to the launch date and leave <b>Ends</b> blank.",
      "Leave <b>Active</b> on Yes and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the programme with a Stamp badge and 9 in the Stamps column.",
      "If the Register should also give points, open <b>Settings &rsaquo; Company Profile</b> and set <b>Loyalty points per 100 spent</b> and <b>Loyalty value per point</b> there."
    ],
    fields: [
      ["Name", "What customers call the programme.", "required"],
      ["Kind", "Points, Stamp card, Spend tiers or Visit tiers.", "required"],
      ["Points per 1 spent", "For a points programme: points earned for each 1 of currency spent. Shown in the Earn column.", "optional"],
      ["Value per point", "What one point is worth when redeemed.", "optional"],
      ["Stamps for a reward", "For a stamp card: stamps needed for the reward. Buy 9 get 1 free means 9.", "optional"],
      ["Reward item", "The item given as the reward.", "optional"],
      ["Birthday reward", "What a member gets on their birthday, as text.", "optional"],
      ["Starts", "When the programme starts.", "optional"],
      ["Ends", "When it ends. Blank for no end.", "optional"],
      ["Active", "Yes by default.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank programme. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the programme."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the programme after <i>Delete this record?</i>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Saving a programme posts nothing and does not change what the Register does. The Register earns and redeems points on the customer record using the two Company Profile settings, and stores each customer's balance on their contact.",
    links: [
      { name: "Company Profile", how: "Holds the points-per-100 and value-per-point settings the Register uses.", to: "settings.profile" },
      { name: "Register", how: "Earns and redeems points at checkout for a customer with points.", to: "pos.terminal" },
      { name: "Customers", how: "A customer's points balance is kept on their contact.", to: "contacts" }
    ],
    mistakes: [
      ["Name is required", "The programme has no name. Type one."],
      ["Customers are not earning points at the Register", "Loyalty points per 100 spent in Company Profile is 0, which turns loyalty off. A programme on this screen does not switch it on."]
    ],
    tips: [
      "Start with a stamp card: it is the easiest scheme to explain at the counter."
    ]
  },

  "gst.storedvalue": {
    title: "Gift cards and wallets",
    what: "A register of <b>stored value</b>: gift cards, customer wallets and corporate accounts. Money loaded onto a card is money you owe the holder until they spend it, so it sits on the balance sheet as a liability and not as income. The balance on this screen is never typed: it is what the movements add up to, and every card carries its own history of loads, spends and corrections.",
    when: [
      "A gift card is sold or a corporate account is opened.",
      "A customer wants to put money on a wallet.",
      "A card is lost and should be frozen, or has expired.",
      "A complaint ends in a goodwill top-up, or a balance has to be written off.",
      "Month end, to tie the cards with a balance against what the ledger says you owe on them."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Guests &rsaquo; Gift cards and wallets</b> and click <span class='man-key'>New</span>. In this example a restaurant sells a gift card for 50.",
      "Type the number printed on the card, <i>GC-100245</i>, in <b>Card number</b>. It is what the cashier will type or scan, so it has to be unique enough to find.",
      "Choose <b>Gift card</b> in <b>Kind</b>, leave <b>Holder</b> on <i>Bearer</i> for a card anyone can use, and set <b>Expires</b> to a year out, or leave it empty for a card that never expires.",
      "Click <span class='man-key'>Save</span>. The card appears with a balance of 0.00, because nothing has been paid onto it yet.",
      "Open it again and click <span class='man-key'>Load</span>. Type 50 in <b>Amount</b>, choose the till the money went into, and save. You should see <i>50.00 loaded. It is on the balance sheet as owed, not as income.</i>",
      "Open the card once more. The four figures across the top read 50.00 on the card, 50.00 loaded in total, nothing spent and one movement, with that movement listed underneath.",
      "When the guest comes in and spends 18 of it: at the register, press <span class='man-key'>Charge</span> and set the tender to <b>Wallet / gift card</b>. A <b>Card</b> box appears under it; pick GC-100245 and it shows what is left. Take the payment as usual.",
      "Back on the card, the balance is 32.00 and there is a <b>Spent</b> movement against that sale. Nobody typed it.",
      "For a goodwill top-up or a write-off, click <span class='man-key'>Correct the balance</span>, put in the amount (a minus to take it off) and the reason."
    ],
    fields: [
      ["Card number", "The number on the card. It is what gets typed or scanned at the till.", "required"],
      ["Kind", "Wallet, Gift card or Corporate account.", "required"],
      ["Holder", "The customer or company it belongs to. A wallet or a corporate account has one; a gift card usually does not.", "optional"],
      ["Status", "Active, Frozen, Expired or Closed. Only an active card can pay for anything, which is what makes Frozen the right answer to a lost card.", "required"],
      ["Issued", "The day it was given out.", "optional"],
      ["Expires", "Leave it empty and the card never expires. With a date, anything left unspent becomes income as breakage the morning after it passes.", "optional"],
      ["Balance", "Not a field. It is what the movements add up to, which is why it can be trusted.", "auto"]
    ],
    buttons: [
      ["Load", "Puts money on the card and posts it: the till or the bank up, what you owe on cards up. This is not a sale."],
      ["Correct the balance", "A goodwill top-up, which posts as a cost, or a write-off, which posts as breakage. The reason is kept on both the movement and the ledger entry."],
      ["Delete", "Only a card with no balance and no history at all."],
      ["Filters", "<b>With a balance</b>, <b>Expiring in 30 days</b> and <b>Past its date</b>."],
      ["Export", "Downloads the list, which is the figure to tie against the ledger at month end."]
    ],
    after: "<p><b>Loading</b> posts the money into the till or the bank and the same amount onto <b>4198 Gift cards and wallets</b>. Nothing is income yet: you are holding somebody else's money.</p><p><b>Spending</b> it at a till moves the balance as the tender is taken, through the database rather than a screen, so no till can take a card payment and forget to spend it, and a card without the balance refuses the payment instead of going quietly negative. The night's posting sends that tender to 4198, so what you owe comes down exactly as the revenue is earned.</p><p><b>Expiry</b> is the only point at which an unspent balance becomes yours. A nightly job writes off every card past its date: 4198 down, <b>7580 Gift card breakage</b> up, the card zeroed and marked expired. It is the one entry an auditor will ask about, so it is a posting with a date and a card number rather than a judgement.</p>",
    links: [
      { name: "Register", how: "Where a card is spent: set the tender to Wallet / gift card and pick the card.", to: "pos.terminal" },
      { name: "Chart of Accounts", how: "4198 Gift cards and wallets, and 7580 Gift card breakage, created for every company.", to: "accounts" },
      { name: "Balance Sheet", how: "What you owe on cards appears here, which is the whole reason loading posts.", to: "rep.bs" },
      { name: "Vouchers", how: "A different thing: a code redeemed for a discount, with no balance and no liability.", to: "pos.vouchers" },
      { name: "Customers", how: "The holder is a contact.", to: "contacts" }
    ],
    mistakes: [
      ["Which card is paying?", "The tender is set to Wallet / gift card but no card was picked. The sale will not go through without one, because the money has to come off something."],
      ["Card GC-100245 has only 32.00 on it", "The tender is for more than the balance. Take the rest in cash or on a card: add a second tender line."],
      ["Card GC-100245 is frozen. It cannot be used to pay.", "Somebody froze it, usually because it was reported lost. Unfreeze it on the card, or issue a new one."],
      ["Card GC-100245 expired on 2026-09-30.", "The balance has already been written off as breakage. A goodwill gesture here is a new card, or a correction with the reason written down."],
      ["That card is expired. Only an active card can be loaded.", "Loading a dead card would recreate a liability that was already written off. Issue a new card."],
      ["Give the card a number", "Card number is empty."],
      ["This company has no gift card account.", "Only if the account was deleted. Create one and point at it in Settings, Companies, Accounting accounts."]
    ],
    tips: [
      "Freeze a lost card straight away by setting Status to Frozen. The balance stays, and the till refuses it.",
      "Export <b>With a balance</b> at month end and compare the total with 4198 on the balance sheet. They are built to agree; a gap means somebody corrected a balance outside Orbit.",
      "A card with no expiry date is a liability you carry forever. Most places give a year, which is also the point at which it becomes income if nobody comes back."
    ]
  },

  "gst.subs": {
    title: "Subscription plans",
    what: "The <b>subscription plans</b> you offer: an unlimited coffee pass, a monthly bean box, a corporate plan. Each plan has a price, how often it is billed, the item it includes and the limits that stop a pass eating the margin. This screen defines the plans; it does not sign customers up, bill them or enforce the limits at the till.",
    when: [
      "You design or launch a subscription.",
      "A price or limit changes.",
      "A plan is withdrawn."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Guests &rsaquo; Subscription plans</b> and click <span class='man-key'>New</span>. In this example a coffee chain offers a monthly pass.",
      "Type <i>Daily coffee pass</i> in <b>Name</b> and choose <b>Unlimited pass</b> in <b>Kind</b>.",
      "Type 45 in <b>Price</b> and choose <b>Monthly</b> in <b>Billed</b>. Left on (none), a new plan is billed Monthly.",
      "Pick the filter coffee item in <b>Included item</b>.",
      "Type 2 in <b>Daily limit</b> and 40 in <b>Limit per period</b>.",
      "Leave <b>Active</b> on Yes and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the plan with its price and a daily limit of 2."
    ],
    fields: [
      ["Name", "The plan's name as customers see it.", "required"],
      ["Kind", "Unlimited pass, Subscription box or Corporate.", "required"],
      ["Price", "What the plan costs for one period.", "required"],
      ["Billed", "Weekly, Monthly or Quarterly. Left on (none), a new plan is billed Monthly.", "optional"],
      ["Included item", "The item the plan covers.", "optional"],
      ["Daily limit", "The most a subscriber may redeem in a day.", "optional"],
      ["Limit per period", "The most a subscriber may redeem in one billing period.", "optional"],
      ["Active", "Yes by default.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank plan. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the plan."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the plan after <i>Delete this record?</i>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. The plan is a definition: bill subscribers through Sales and Accounting, and tell staff the limits, because the till does not check them.",
    links: [
      { name: "Items", how: "The Included item comes from your item list.", to: "products" },
      { name: "Invoices", how: "Subscribers are billed with customer invoices.", to: "inv.out" }
    ],
    mistakes: [
      ["Price is required", "Type what one period costs."],
      ["Fill in Period. It is required.", "<b>Billed</b> on an existing plan was set back to (none). Choose Weekly, Monthly or Quarterly."]
    ],
    tips: [
      "Always set a daily limit on an unlimited pass."
    ]
  },

  "gst.feedback": {
    title: "Feedback and complaints",
    what: "Every score and comment a guest gives, and every complaint, with the store, where it came from, who owns it and whether it is resolved. Scores are shown as a coloured badge (NPS 9 to 10 green, 7 to 8 amber, 0 to 6 red), and filters pick out what is still open and who the unhappy guests are.",
    when: [
      "A guest complains in person, by phone or in a review.",
      "Survey or receipt scores come in.",
      "A manager checks each morning what is still open."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Guests &rsaquo; Feedback and complaints</b> and click <span class='man-key'>New</span>. In this example a restaurant logs a complaint about a cold main course.",
      "Pick the <b>Store</b> and, if the guest is a known contact, the <b>Customer</b>.",
      "Choose <b>In person</b> in <b>Source</b>. Left on (none), a new entry is recorded as Receipt.",
      "Type 4 in <b>NPS 0-10</b>, and <i>Main course arrived cold, remade after 20 minutes</i> in <b>Comment</b>.",
      "Type <i>Food temperature</i> in <b>Category</b>.",
      "Choose <b>New</b> in <b>Status</b> and type the duty manager in <b>Owner</b>.",
      "Type 25 in <b>Compensation</b> if you gave something back, then click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the entry with a red <b>4</b> badge.",
      "When the owner has called the guest, set Status to <b>Resolved</b>. <span class='man-key'>Filters</span> &rsaquo; <b>Open</b> then no longer lists it."
    ],
    fields: [
      ["Store", "The store the feedback is about.", "optional"],
      ["Customer", "The guest, if they are a contact in Orbit.", "optional"],
      ["Source", "Receipt, App, the review-site option, Aggregator or In person. Left on (none), a new entry is recorded as Receipt.", "optional"],
      ["NPS 0-10", "How likely they are to recommend you, as a whole number from 0 to 10. Drives the badge colour and the Detractors filter.", "optional"],
      ["Rating", "A star or other rating. Shown in the Score column when there is no NPS.", "optional"],
      ["Comment", "What the guest said. The list shows the first 70 characters.", "optional"],
      ["Category", "Your own label, such as Food temperature or Service speed.", "optional"],
      ["Status", "New, Acknowledged, Resolved or Closed. Left on (none), a new entry starts as New.", "optional"],
      ["Owner", "Who will deal with it.", "optional"],
      ["Compensation", "The value of anything given back, for your records.", "optional"],
      ["When", "Shown in the list: the date and time the entry was saved.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank entry. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the entry."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the entry after <i>Delete this record?</i>."],
      ["Filters", "<b>Open</b> shows New and Acknowledged entries; <b>Detractors</b> shows NPS scores of 6 or less."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. Compensation is a note of the amount only: a refund or a free meal is not recorded in the accounts from here.",
    links: [
      { name: "Customers", how: "Link feedback to the guest's contact to see their history.", to: "contacts" },
      { name: "Store audits", how: "A pattern of complaints at one store is worth an audit.", to: "ops.audits" }
    ],
    mistakes: [
      ["Fill in Source. It is required.", "An existing entry had its Source set back to (none). Choose where the feedback came from."],
      ["Fill in Status. It is required.", "An existing entry had its Status set back to (none). Choose New, Acknowledged, Resolved or Closed."],
      ["A complaint never leaves the Open filter", "Its Status is still New or Acknowledged. Set it to Resolved or Closed once it is dealt with."]
    ],
    tips: [
      "Give every complaint an Owner the moment it is logged. An entry with no owner is the one nobody calls back."
    ]
  },

  "dlv.payouts": {
    title: "Aggregator payouts",
    what: "A <b>payout</b> is one statement from a delivery platform: the period it covers, what it says your orders were worth, the commission and other deductions it took, and the net it actually paid. You also type what <b>you expected</b> to receive. Orbit works out the <b>difference</b> (net actually paid minus expected net) so a short payment stands out and can be disputed.",
    when: [
      "A platform's weekly or monthly statement arrives.",
      "The money lands in the bank and you want to check it against what the platform owes you.",
      "You chase a platform for a short payment and want the figures in one place."
    ],
    how: [
      "Make sure the platform account exists under <b>Delivery &rsaquo; Aggregator accounts</b>.",
      "Open <b>Kitchen &rsaquo; Delivery &rsaquo; Aggregator payouts</b> and click <span class='man-key'>New</span>. In this example a restaurant group checks one week's statement.",
      "Pick the platform in <b>Account</b> and type the statement number in <b>Statement ref</b>.",
      "Set <b>From</b> to 2026-09-01 and <b>To</b> to 2026-09-07.",
      "Type 3,060 in <b>Expected net</b>: what your own orders say the platform owes you after its commission.",
      "From the statement, type 3,600 in <b>Statement gross</b>, 540 in <b>Their commission</b>, 60 in <b>Other deductions</b> and 3,000 in <b>Net actually paid</b>.",
      "Set <b>Received</b> to the day the money arrived. Leave <b>Status</b> on (none): a new payout starts as Draft.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a red <b>-60.00</b> in the Difference column: they paid 60 less than you expected.",
      "Ask the platform about the 60, set Status to <b>Disputed</b> and note what they said in <b>Note</b>. When it is sorted, set <b>Settled</b>."
    ],
    fields: [
      ["Account", "The platform account the statement is for. The picker shows the platform name only.", "required"],
      ["Statement ref", "The number on the platform's statement.", "optional"],
      ["From", "The first day the statement covers.", "required"],
      ["To", "The last day the statement covers. The list is sorted by it, newest first.", "required"],
      ["Expected net", "What your own orders say the platform owes you for the period. You type it; Orbit does not add it up from orders.", "optional"],
      ["Statement gross", "The order value the statement shows.", "optional"],
      ["Their commission", "The commission the statement shows.", "optional"],
      ["Other deductions", "Refunds, promotions, fees and anything else taken off.", "optional"],
      ["Net actually paid", "What the platform paid you.", "optional"],
      ["Difference", "Shown in the list: Net actually paid minus Expected net, a blank counting as 0. 0 shows <b>Matches</b>; less than 0 is red, more than 0 is amber.", "auto"],
      ["Received", "The day the money arrived.", "optional"],
      ["Status", "Draft, Matched, Disputed or Settled. Left on (none), a new payout starts as Draft.", "optional"],
      ["Note", "What was queried and what the platform answered.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank payout. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the payout and calculates the difference."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the payout after <i>Delete this record?</i>."],
      ["Filters", "<b>Short paid</b> shows payouts with a difference below 0; <b>Unmatched</b> shows payouts still in Draft."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "The payout is a check, not a posting. Nothing reaches the ledger: record the money received in Accounting as usual, and the commission as an expense.",
    links: [
      { name: "Aggregator accounts", how: "Every payout is for one platform account.", to: "dlv.accounts" },
      { name: "Channels", how: "The aggregator channel carries its own markup and commission for pricing.", to: "menu.channels" }
    ],
    mistakes: [
      ["Account is required", "No platform account exists yet. Add one under Aggregator accounts first."],
      ["From is required", "Set the first day of the statement period."],
      ["To is required", "Set the last day of the statement period."],
      ["Fill in Status. It is required.", "An existing payout had its Status set back to (none). Choose Draft, Matched, Disputed or Settled."],
      ["Difference shows the whole amount paid", "Expected net is blank, so it counts as 0. Type what you expected."]
    ],
    tips: [
      "If you use the same platform at two stores, the Account picker shows the same name twice. Put the store in Statement ref to tell them apart."
    ]
  },

  "dlv.accounts": {
    title: "Aggregator accounts",
    what: "One row for each delivery platform at each store, with the platform's own id for your store and the <b>commission</b> the platform charges. Payouts are recorded against these accounts.",
    when: [
      "A store starts selling through a delivery platform.",
      "A platform changes its commission rate.",
      "A store stops using a platform."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Delivery &rsaquo; Aggregator accounts</b> and click <span class='man-key'>New</span>. In this example a coffee chain lists one store on a delivery platform.",
      "Choose the platform in <b>Platform</b>, or <b>Other</b> if it is not listed.",
      "Pick the <b>Store</b>. Only active stores are listed.",
      "Pick the delivery channel in <b>Channel</b> if you price that channel separately.",
      "Type the id the platform gives your store in <b>Their store id</b>.",
      "Type 18 in <b>Commission %</b>.",
      "Leave <b>Active</b> on Yes and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the account with <b>18%</b> in the Commission column.",
      "Open <b>Aggregator payouts</b> and click <span class='man-key'>New</span>. You should see the platform in the <b>Account</b> picker."
    ],
    fields: [
      ["Platform", "The delivery platform, from the list, or Other.", "required"],
      ["Store", "The store the account belongs to.", "required"],
      ["Channel", "The sales channel for this platform, from Menu &rsaquo; Channels. Only active channels are listed.", "optional"],
      ["Their store id", "The id the platform uses for your store, handy when reading its statements.", "optional"],
      ["Commission %", "The commission the platform charges, as a percentage.", "required"],
      ["Active", "Yes by default. Shown in the Active column.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank account. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the account and adds it to the Aggregator payouts picker."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the account after <i>Delete this record?</i>. Its payouts stay but lose their platform."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. The commission is kept for reference: the payout difference is worked out from Expected net and Net actually paid, not from this rate.",
    links: [
      { name: "Aggregator payouts", how: "Each statement is recorded against one of these accounts.", to: "dlv.payouts" },
      { name: "Channels", how: "The channel sets prices and commission for selling through the platform.", to: "menu.channels" },
      { name: "Stores", how: "Every account belongs to an active store.", to: "estate.stores" }
    ],
    mistakes: [
      ["Store is required", "There is no active store to choose. Add one under Estate &rsaquo; Stores."],
      ["Commission % is required", "Type the platform's commission, for example 18."],
      ["Payouts show no platform", "Their account was deleted. Set Active to No instead next time."]
    ],
    tips: [
      "When a platform changes its rate, update Commission % here and note the date in your payout notes."
    ]
  },

  "dlv.deliveries": {
    title: "Own deliveries",
    what: "Deliveries made by <b>your own riders</b>: which store sent it, which rider took it, the address and phone, the delivery fee, any <b>cash collected</b> at the door, whether that cash has been handed in, and where the delivery has got to. The <b>Cash not settled</b> filter shows every delivery where a rider still holds the customer's money.",
    when: [
      "An order goes out with one of your riders.",
      "A rider comes back and hands in the cash.",
      "At the end of a shift, to check that no cash is still out."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Delivery &rsaquo; Own deliveries</b> and click <span class='man-key'>New</span>. In this example a bakery sends a cash-on-delivery order.",
      "Pick the <b>Store</b> and the rider in <b>Rider</b>.",
      "Type the <b>Address</b> and the customer's <b>Phone</b>.",
      "Type 3 in <b>Delivery fee</b>. Left blank, a new delivery has a fee of 0.",
      "Type 27 in <b>Cash collected</b>, leave <b>Cash settled</b> on No, and choose <b>Assigned</b> in <b>Status</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the delivery with Settled: No.",
      "When the rider is back, open it, set <b>Status</b> to <b>Delivered</b> and, once the 27 is in the till, <b>Cash settled</b> to Yes.",
      "Before closing, use <span class='man-key'>Filters</span> &rsaquo; <b>Cash not settled</b>. It should be empty."
    ],
    fields: [
      ["Store", "The store that sent the order.", "optional"],
      ["Rider", "The employee delivering it, from your employee list.", "optional"],
      ["Address", "Where it is going.", "optional"],
      ["Phone", "The customer's phone number.", "optional"],
      ["Delivery fee", "The fee charged for delivery. Left blank, a new delivery has a fee of 0.", "optional"],
      ["Cash collected", "Money the rider takes at the door.", "optional"],
      ["Cash settled", "No by default. Yes once the rider has handed the cash in.", "optional"],
      ["Status", "Pending, Assigned, Picked up, Delivered or Failed. Left on (none), a new delivery starts as Pending.", "optional"],
      ["Note", "Directions, or what went wrong.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank delivery. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the delivery."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the delivery after <i>Delete this record?</i>."],
      ["Filters", "<b>Cash not settled</b> shows deliveries with cash collected above 0 and Cash settled on No."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. Marking cash settled does not put money in a till or bank account in Orbit; count it into the till or record it in Accounting as usual.",
    links: [
      { name: "Employees", how: "Riders are picked from your employee list.", to: "hr.emp" },
      { name: "Stores", how: "Each delivery can name the store that sent it.", to: "estate.stores" }
    ],
    mistakes: [
      ["Fill in Fee. It is required.", "The Delivery fee box of an existing delivery was emptied. Type the fee, or 0."],
      ["Fill in Status. It is required.", "An existing delivery had its Status set back to (none). Choose a status, such as Delivered."],
      ["The rider is not in the Rider list", "They are not set up as an employee. Add them under Employees."]
    ],
    tips: [
      "Settle cash per delivery, not per shift, so a missing amount points to one address."
    ]
  },

  "dlv.reservations": {
    title: "All bookings",
    what: "Every <b>booking</b> in one searchable list, newest date first: the guest, party size, store, table and status, including the waitlist, no-shows and cancellations. It is the history behind <b>Service &rsaquo; The book</b>, which shows one day at a time and is the better screen during service.",
    when: [
      "You need to find a past or future booking by the guest's name.",
      "You want to see how many no-shows a period had.",
      "A booking needs correcting and you are not on The book."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Delivery &rsaquo; All bookings</b> and click <span class='man-key'>New</span>. In this example a restaurant takes a phone booking for Friday.",
      "Type the guest's name in <b>Guest</b> and their <b>Phone</b>.",
      "Change <b>Party size</b> from 2 to 4.",
      "Type the date and time in <b>Date and time</b> exactly in this shape: <i>2026-09-18T19:30</i> (year-month-day, a capital T, then the time).",
      "Pick the <b>Store</b> and leave <b>Status</b> on (none): a new booking starts as Booked.",
      "Type <i>Window table if possible</i> in <b>Note</b> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the booking in the list, with <i>2026-09-18 19:30</i> in the When column.",
      "Open <b>Service &rsaquo; The book</b> and go to 2026-09-18. You should see the booking there, ready to seat.",
      "Type a guest's name in <b>Search</b> to find any booking later."
    ],
    fields: [
      ["Guest", "The name the booking is under.", "required"],
      ["Phone", "How to reach the guest.", "optional"],
      ["Party size", "How many people. 2 unless you change it; left blank on a new booking it is also 2.", "optional"],
      ["Date and time", "When they are due, typed as 2026-09-18T19:30.", "required"],
      ["Store", "Which store the booking is for. The book shows one store at a time.", "optional"],
      ["Status", "Booked, Seated, No show, Cancelled or Waitlist. Left on (none), a new booking starts as Booked.", "optional"],
      ["Note", "Allergies, occasions or requests.", "optional"],
      ["Table", "Shown in the list only: the table given when the party was seated from The book.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank booking. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the booking."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the booking after <i>Delete this record?</i>. To keep the record of a no-show, set Status to No show instead."],
      ["Search", "Finds bookings by guest, party, store, table or status."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. The booking appears on The book for its day and store, where covers are counted and the party can be seated. Cancelled and no-show bookings are left out of the covers count there.",
    links: [
      { name: "The book", how: "The day-by-day screen for the same bookings, with New booking and Seat.", to: "kitchen.book" },
      { name: "Tables", how: "Seating a booking gives it a table from this list.", to: "estate.tables" },
      { name: "Floor", how: "A seated party is served from the Floor.", to: "kitchen.floor" }
    ],
    mistakes: [
      ["Guest is required", "Type the name the booking is under."],
      ["Date and time is required", "Type when they are due, as 2026-09-18T19:30."],
      ["One of the values is in the wrong format.", "The date and time was not typed in the shape 2026-09-18T19:30. Retype it that way."],
      ["Fill in Party size. It is required.", "The Party size box of an existing booking was emptied. Type the number of guests."],
      ["Fill in Status. It is required.", "An existing booking had its Status set back to (none). Choose Booked, Seated, No show, Cancelled or Waitlist."],
      ["The booking is not on The book", "The book is set to a different day or store. Change the day or the store picker at the top."]
    ],
    tips: [
      "Take bookings on The book during service: it has the occasion, source and seating that this list does not."
    ]
  },

  "fr.franchisees": {
    title: "Franchisees",
    what: "A <b>franchisee</b> is a business that runs one or more of your stores under your name. The record holds who they are, their agreement reference and dates, their territory and exclusivity radius, and their status. The list colours each agreement end date so renewals are seen coming: amber within six months, red once past.",
    when: [
      "A new franchise agreement is signed.",
      "An agreement is renewed, transferred or ended.",
      "You review which agreements come up for renewal in the next six months."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Franchise &rsaquo; Franchisees</b> and click <span class='man-key'>New</span>. In this example a coffee franchise brand signs a partner for a new city.",
      "Type the company name in <b>Name</b> and <i>FR-07</i> in <b>Code</b>.",
      "Pick their contact in <b>Contact record</b> if they already exist in Orbit, and type the owners in <b>Principals</b>.",
      "Type the contract number in <b>Agreement ref</b>, set <b>Starts</b> to 2026-10-01, <b>Ends</b> to 2031-09-30 and <b>Renewal due</b> to 2031-03-31.",
      "Type the city in <b>Territory</b> and 2 in <b>Exclusivity radius km</b>.",
      "Choose <b>Active</b> in <b>Status</b>, or leave it on (none): a new franchisee starts as Active.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the franchisee with a green agreement end date.",
      "Open <b>Estate &rsaquo; Stores</b>, open their store, set <b>Ownership</b> to FOFO and pick them in <b>Franchisee</b>.",
      "Add their royalty terms under <b>Royalty schemes</b>."
    ],
    fields: [
      ["Name", "The franchisee's business name.", "required"],
      ["Code", "Your own short code for them.", "optional"],
      ["Contact record", "Their contact in Orbit, for invoices and addresses. Any contact can be chosen.", "optional"],
      ["Principals", "The people behind the business.", "optional"],
      ["Portal email", "An email address kept on the record.", "optional"],
      ["Agreement ref", "The agreement's reference number.", "optional"],
      ["Starts", "When the agreement began.", "optional"],
      ["Ends", "When it ends. Drives the colour of the date and the renewal filter.", "optional"],
      ["Renewal due", "When renewal talks must start.", "optional"],
      ["Territory", "The area they may trade in. Shown in the list.", "optional"],
      ["Exclusivity radius km", "How far around their store no other franchise may open.", "optional"],
      ["Status", "Prospect, Active, Terminated or Transferred. Left on (none), a new franchisee starts as Active.", "optional"],
      ["Note", "Anything else worth keeping.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank franchisee. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the franchisee and adds them to the Franchisee pickers on Stores, Royalty schemes and Reported sales."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the franchisee after <i>Delete this record?</i>. Their royalty schemes and reported sales are deleted too."],
      ["Filters", "<b>Renewal within 6 months</b> shows agreements ending within 180 days, including any already past."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. Deleting a franchisee deletes their royalty schemes and every sales report they submitted, and their stores lose the franchisee link. Set Status to Terminated instead to keep the history.",
    links: [
      { name: "Stores", how: "A franchised store names its franchisee.", to: "estate.stores" },
      { name: "Royalty schemes", how: "A scheme can apply to one franchisee.", to: "fr.schemes" },
      { name: "Reported sales", how: "Each sales report belongs to a franchisee.", to: "fr.sales" },
      { name: "Development pipeline", how: "Where applicants are followed before they become franchisees.", to: "fr.pipeline" }
    ],
    mistakes: [
      ["Name is required", "Type the franchisee's business name."],
      ["Fill in Status. It is required.", "An existing franchisee had its Status set back to (none). Choose Active, or Prospect."],
      ["Their royalty schemes and sales reports are gone", "The franchisee was deleted, which deletes both. Use Status Terminated in future."]
    ],
    tips: [
      "Fill in Ends for every agreement; without it the renewal filter cannot warn you."
    ]
  },

  "fr.schemes": {
    title: "Royalty schemes",
    what: "A <b>royalty scheme</b> is how a franchisee's royalty is worked out from their net sales: a percentage, a fixed fee, a percentage with a minimum, or tiered. It can also carry a <b>marketing fund</b> percentage. A scheme can be for one franchisee, or left without a franchisee to apply to everyone who has no scheme of their own. The Royalty run uses these schemes.",
    when: [
      "A franchise agreement is signed and its royalty terms need setting up.",
      "Terms change at renewal.",
      "You set a standard scheme for all franchisees."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Franchise &rsaquo; Royalty schemes</b> and click <span class='man-key'>New</span>. In this example a bakery franchise charges 6% of net sales with a monthly minimum of 2,000, plus 2% to the marketing fund.",
      "Type <i>Standard 6% with minimum</i> in <b>Name</b> and pick the franchisee in <b>Franchisee</b>.",
      "Choose <b>Percent with a minimum</b> in <b>Kind</b>.",
      "Type 6 in <b>Percent</b>, 2000 in <b>Minimum</b> and 2 in <b>Marketing fund %</b>. Leave <b>Fixed amount</b> empty.",
      "Choose <b>Monthly</b> in <b>Period</b>. Left on (none), a new scheme is Monthly.",
      "Leave <b>Active</b> on Yes and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the scheme with 6% in Rate, 2,000.00 in Minimum and 2% in Ad fund.",
      "On net sales of 42,000 the royalty is 2,520, because 6% is above the minimum. On net sales of 30,000, 6% would be 1,800, so the minimum of 2,000 is charged instead.",
      "Check the result in <b>Royalty run</b> once the franchisee's sales are reported."
    ],
    fields: [
      ["Name", "A name that says what the terms are.", "required"],
      ["Franchisee", "The franchisee the scheme is for. Leave on (none) for a scheme that applies to every franchisee without their own; the list then shows All.", "optional"],
      ["Kind", "Percent of net sales, Fixed fee, Tiered, or Percent with a minimum.", "required"],
      ["Percent", "The royalty rate for Percent and Percent with a minimum. For Tiered, the rate charged above the last band.", "optional"],
      ["Fixed amount", "The fee charged for a Fixed fee scheme, whatever the sales.", "optional"],
      ["Minimum", "The least royalty charged. It applies whenever it is filled in, whatever the kind.", "optional"],
      ["Marketing fund %", "The marketing fund contribution, as a percentage of net sales, added on top of the royalty.", "optional"],
      ["Period", "Monthly, Quarterly or Weekly: how often the terms are charged. Left on (none), a new scheme is Monthly. The Royalty run does not use it; it uses the period you pick on the run.", "optional"],
      ["Active", "Yes by default. The Royalty run only uses active schemes.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank scheme. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the scheme."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the scheme after <i>Delete this record?</i>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. The Royalty run picks, for each sales report, an active scheme for that franchisee, or failing that an active scheme with no franchisee, and calculates: Fixed fee charges the fixed amount; Percent and Percent with a minimum charge net sales times Percent; the Minimum then lifts the result if it is lower; the answer is rounded to two decimals. The marketing fund is net sales times Marketing fund %.",
    links: [
      { name: "Royalty run", how: "Applies these schemes to reported sales.", to: "fr.royaltyrun" },
      { name: "Franchisees", how: "A scheme can be for one franchisee; deleting the franchisee deletes it.", to: "fr.franchisees" },
      { name: "Reported sales", how: "The net sales the royalty is charged on.", to: "fr.sales" }
    ],
    mistakes: [
      ["Name is required", "Type a name for the scheme."],
      ["Fill in Period. It is required.", "An existing scheme had its Period set back to (none). Choose Monthly, Quarterly or Weekly."],
      ["A Tiered scheme charges a flat rate", "The bands of a tiered scheme cannot be entered on this screen, so with no bands the whole of net sales is charged at Percent. Use Percent or Percent with a minimum until bands can be set."],
      ["The Royalty run uses the wrong scheme", "The franchisee has more than one active scheme, or has none and several All schemes are active. Keep one active scheme per franchisee and set the rest to Active No."]
    ],
    tips: [
      "Keep old terms as inactive schemes rather than deleting them, so you can see what was charged before a renewal."
    ]
  },

  "fr.sales": {
    title: "Reported sales",
    what: "What each franchisee reports as their <b>net sales</b> for a period, store by store. This is the figure royalty is charged on. Each report records where the figure came from (declared by the franchisee, or captured from their till) and whether you have <b>verified</b> it. The Royalty run marks anything not yet verified as provisional.",
    when: [
      "A franchisee sends their monthly sales figures.",
      "You have checked a figure against their till reports and want to mark it verified.",
      "A figure looks wrong and you are disputing it."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Franchise &rsaquo; Reported sales</b> and click <span class='man-key'>New</span>. In this example a franchisee reports August.",
      "Pick the franchisee in <b>Franchisee</b> and their store in <b>Store</b>.",
      "Set <b>From</b> to 2026-08-01 and <b>To</b> to 2026-08-31.",
      "Type 42000 in <b>Net sales</b>, 46200 in <b>Gross sales</b> and 5,310 in <b>Transactions</b>.",
      "Choose <b>Declared by franchisee</b> in <b>Source</b> and <b>Submitted</b> in <b>Status</b>. Left on (none), a new report is Declared by franchisee and Submitted anyway.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the report with a Submitted badge.",
      "Once you have checked the figure, open it, set Status to <b>Verified</b> and save. <span class='man-key'>Filters</span> &rsaquo; <b>Unverified</b> lists what is still to check.",
      "Open <b>Royalty run</b> for August to see the royalty on this report."
    ],
    fields: [
      ["Franchisee", "Who is reporting.", "required"],
      ["Store", "Which of their stores the figure is for.", "optional"],
      ["From", "The first day of the period.", "required"],
      ["To", "The last day of the period. The list is sorted by it, newest first.", "required"],
      ["Net sales", "Sales after discounts and before royalty: the figure royalty is charged on.", "required"],
      ["Gross sales", "Sales before discounts, if reported.", "optional"],
      ["Transactions", "The number of sales, as a whole number.", "optional"],
      ["Source", "Declared by franchisee, or Captured from their POS. Left on (none), a new report is Declared by franchisee.", "optional"],
      ["Status", "Submitted, Verified or Disputed. Left on (none), a new report starts as Submitted. Anything other than Verified shows as unverified in the Royalty run.", "optional"],
      ["Note", "What was checked, or what is disputed.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank report. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the report."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the report after <i>Delete this record?</i>."],
      ["Filters", "<b>Unverified</b> shows reports still Submitted."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. The report is picked up by the Royalty run for any period that contains both its From and To dates.",
    links: [
      { name: "Royalty run", how: "Turns each report into a royalty and marketing figure.", to: "fr.royaltyrun" },
      { name: "Franchisees", how: "Every report belongs to a franchisee; deleting the franchisee deletes their reports.", to: "fr.franchisees" },
      { name: "Royalty schemes", how: "Decide how much royalty the net sales produce.", to: "fr.schemes" }
    ],
    mistakes: [
      ["Franchisee is required", "No franchisee exists yet. Add them under Franchisees first."],
      ["Net sales is required", "Type the net sales figure."],
      ["Fill in Source. It is required.", "An existing report had its Source set back to (none). Choose Declared by franchisee or Captured from their POS."],
      ["Fill in Status. It is required.", "An existing report had its Status set back to (none). Choose Submitted, Verified or Disputed."],
      ["A record with Period start 2026-08-01 and Period end 2026-08-31 and Source declared already exists. Use a different one.", "That store already has a declared report for exactly this period. Open and correct the existing one instead of adding another."]
    ],
    tips: [
      "Put one report per store per period. A month with no report is the gap worth chasing."
    ]
  },

  "fr.royaltyrun": {
    title: "Royalty run",
    what: "A report that works out what each franchisee owes for a period. It takes every sales report whose dates fall inside the period, finds the franchisee's active royalty scheme, and shows the net sales, the royalty, the marketing fund contribution and the total due, with a total row. Reports not yet verified are marked <b>unverified</b>, so treat their figures as provisional.",
    when: [
      "At month or quarter end, before you invoice franchisees.",
      "A franchisee questions their royalty and you want to show the working.",
      "You change a scheme and want to see its effect."
    ],
    how: [
      "Make sure sales are entered under <b>Reported sales</b> and each franchisee has an active scheme under <b>Royalty schemes</b>.",
      "Open <b>Kitchen &rsaquo; Franchise &rsaquo; Royalty run</b>. In this example a franchise brand works out August.",
      "Choose <b>Custom range&hellip;</b> in the period box, then set From to 2026-08-01 and To to 2026-08-31.",
      "You should see one row per sales report, highest total first. For a franchisee with net sales of 42,000 on 6% with a 2,000 minimum and 2% marketing: Royalty 2,520.00, Marketing 840.00, Total due 3,360.00.",
      "Look for the <b>unverified</b> badge beside a franchisee. Verify that report under Reported sales before you bill it.",
      "Look for <b>(no scheme)</b> in the Scheme column. That franchisee has no active scheme and no All scheme applies, so their royalty is 0.",
      "Click <span class='man-key'>Export</span> for a CSV copy, or <span class='man-key'>Print</span>.",
      "Raise each franchisee's invoice for the Total due in <b>Invoices</b>."
    ],
    fields: [
      ["Period", "This year, This quarter, This month, Last year, All time or Custom range. A report is included when its From and To both fall inside. <b>All time</b> includes every report, and a custom range with no From date includes every report up to its end date.", "optional"],
      ["From and To", "Only with Custom range: the first and last day of the run.", "optional"],
      ["Franchisee and Store", "From the sales report.", "auto"],
      ["Scheme", "The franchisee's active scheme, or an active scheme with no franchisee, or (no scheme).", "auto"],
      ["Net sales", "From the sales report.", "auto"],
      ["Royalty", "Calculated from the scheme: fixed fee, or net sales times the percent, lifted to the minimum if one is set, rounded to two decimals.", "auto"],
      ["Marketing", "Net sales times the scheme's Marketing fund %.", "auto"],
      ["Total due", "Royalty plus marketing.", "auto"]
    ],
    buttons: [
      ["Period box", "Recalculates the run for the chosen period."],
      ["Export", "Downloads the table as a CSV file."],
      ["Print", "Opens the browser's print window, where you can also save a PDF."]
    ],
    after: "A calculation only: nothing is saved, no invoice is raised and nothing is posted. Invoice each franchisee yourself from the figures.",
    links: [
      { name: "Reported sales", how: "The net sales the run is based on.", to: "fr.sales" },
      { name: "Royalty schemes", how: "Decide the royalty and marketing rates.", to: "fr.schemes" },
      { name: "Invoices", how: "Bill each franchisee the Total due.", to: "inv.out" }
    ],
    mistakes: [
      ["No sales reported for this period yet.", "No sales report has both dates inside the period. Pick a wider period, or All time to see every report."],
      ["(no scheme) and a royalty of 0.00", "The franchisee has no active scheme and there is no active scheme without a franchisee. Add or reactivate one under Royalty schemes."],
      ["A month's report is missing from the run", "Its dates run past the end of the period, for example a report to 2026-09-02 in an August run. Widen the range or correct the report's dates."],
      ["Nothing to export yet", "Export was pressed on an empty run."]
    ],
    tips: [
      "Verify every report before you invoice from the run, so no one is billed on a provisional figure."
    ]
  },

  "fr.pipeline": {
    title: "Development pipeline",
    what: "Every would-be franchisee from first enquiry to open door, with where they want to trade, their finances, the <b>stage</b> they have reached and who on your team owns them. The stages run from Lead through Application, Financial vetting, Approved, Site selection, Lease, Design, Construction, Equipment, Training and Opening to Open, or Rejected.",
    when: [
      "Someone enquires about opening a franchise.",
      "An applicant passes a stage, such as financial vetting or signing a lease.",
      "You review the pipeline by stage or by country."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Franchise &rsaquo; Development pipeline</b> and click <span class='man-key'>New</span>. In this example a restaurant franchise logs a new enquiry.",
      "Type the applicant's name in <b>Applicant</b>, with their <b>Email</b> and <b>Phone</b>.",
      "Type the area in <b>Territory</b>, and fill in <b>City</b> and <b>Country</b>.",
      "Choose <b>Lead</b> in <b>Stage</b>.",
      "Type 800000 in <b>Net worth</b> and 250000 in <b>Liquid capital</b> if they have told you.",
      "Set <b>Target open</b> to the date they hope to open and type your team member in <b>Owner</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the applicant at the top of the list with a Lead badge.",
      "As they progress, open the record and move <b>Stage</b> on. Use <span class='man-key'>Group By</span> &rsaquo; <b>Stage</b> to see how many are at each step.",
      "When they open, set Stage to <b>Open</b>, fill in <b>Actually opened</b>, and add them under <b>Franchisees</b>."
    ],
    fields: [
      ["Applicant", "The person or company applying.", "required"],
      ["Email", "Their email address.", "optional"],
      ["Phone", "Their phone number.", "optional"],
      ["Territory", "The area they want.", "optional"],
      ["City", "The city they want to open in.", "optional"],
      ["Country", "The country. Used by Group By.", "optional"],
      ["Stage", "Where they are, from Lead to Open, or Rejected. Used by Group By.", "required"],
      ["Net worth", "Their declared net worth.", "optional"],
      ["Liquid capital", "Cash they can put in.", "optional"],
      ["Target open", "When they aim to open.", "optional"],
      ["Actually opened", "The real opening date.", "optional"],
      ["Owner", "Who on your team is responsible for them.", "optional"],
      ["Notes", "Vetting notes and next steps.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank applicant. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the applicant."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the applicant after <i>Delete this record?</i>."],
      ["Group By", "Groups the list by <b>Stage</b> or by <b>Country</b>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing is posted. Moving an applicant to Open does not create a franchisee or a store; add those under Franchisees and Stores.",
    links: [
      { name: "Franchisees", how: "An applicant who signs becomes a franchisee there.", to: "fr.franchisees" },
      { name: "Stores", how: "Their new site is added as a store.", to: "estate.stores" },
      { name: "Contacts", how: "Keep the applicant as a contact once talks are serious.", to: "contacts" }
    ],
    mistakes: [
      ["Applicant is required", "Type the applicant's name."],
      ["An applicant sits at one stage for months", "Nobody owns them. Fill in Owner and review Group By Stage every week."]
    ],
    tips: [
      "Record rejected applicants with Stage Rejected rather than deleting them, so a second enquiry from the same person is spotted."
    ]
  },

  "fr.suppliers": {
    title: "Approved suppliers",
    what: "The list of who franchisees may buy from: a supplier approved for one item or for everything, for one brand or all brands, whether buying from them is <b>mandatory</b>, any <b>rebate</b> percentage the supplier pays back, and the dates the approval is valid. It is a reference list for your brand standards.",
    when: [
      "You approve a supplier for franchisees to use.",
      "An item must be bought from one supplier, such as the house coffee.",
      "A supplier agrees a rebate, or an approval ends."
    ],
    how: [
      "Make sure the supplier exists as a contact in Orbit.",
      "Open <b>Kitchen &rsaquo; Franchise &rsaquo; Approved suppliers</b> and click <span class='man-key'>New</span>. In this example a coffee franchise makes its roasted beans mandatory.",
      "Pick the roaster in <b>Supplier</b>.",
      "Pick the house espresso beans in <b>Item</b>. Leave Item empty to approve the supplier for everything.",
      "Pick the brand in <b>Brand</b>, or leave it empty for all brands.",
      "Set <b>Must buy from here</b> to Yes and type 3 in <b>Rebate %</b>.",
      "Set <b>From</b> to 2026-10-01 and <b>To</b> to 2027-09-30, and add a <b>Note</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the supplier with Mandatory: Yes and 3% in Rebate."
    ],
    fields: [
      ["Supplier", "The supplier being approved. Any contact can be chosen.", "required"],
      ["Item", "The item they are approved for. Leave blank to approve them for everything; the list then shows All items.", "optional"],
      ["Brand", "The brand the approval is for. Only active brands are listed. Blank shows All.", "optional"],
      ["Must buy from here", "Yes if franchisees must buy this item from this supplier.", "optional"],
      ["Rebate %", "The rebate the supplier pays back, as a percentage.", "optional"],
      ["From", "When the approval starts.", "optional"],
      ["To", "When it ends.", "optional"],
      ["Note", "Terms or conditions of the approval.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank approval. Only for people who can manage the Kitchen app."],
      ["Save", "Saves the approval."],
      ["Cancel", "Closes the form without saving."],
      ["Delete", "Removes the approval after <i>Delete this record?</i>."],
      ["Export", "Downloads the list, for example to send to franchisees, as a CSV file."]
    ],
    after: "Nothing is posted and nothing is enforced: purchase orders are not checked against this list and rebates are not calculated. Share the export with franchisees, and record rebates received in Accounting.",
    links: [
      { name: "Vendors", how: "Suppliers are contacts; vendors are the ones you buy from.", to: "vend" },
      { name: "Items", how: "An approval can be limited to one item.", to: "products" },
      { name: "Brands", how: "An approval can be limited to one brand; deleting the brand deletes its approvals.", to: "estate.brands" },
      { name: "Purchase Orders", how: "Where the buying itself is recorded.", to: "po.list" }
    ],
    mistakes: [
      ["Supplier is required", "No contact exists to choose. Add the supplier as a contact first."],
      ["That already exists.", "This supplier is already approved for this item. Open the existing approval and change it instead."]
    ],
    tips: [
      "Put a To date on every approval, so the list can be reviewed when approvals lapse."
    ]
  },

  "gst.accounts": {
    title: "Loyalty accounts",
    what: "One account per customer, opened by their first sale. It holds their points, their stamps, the tier they have reached, what they have spent with you and how many times they have been in, and under it every movement that got them there. The running total you see on a contact is a copy of the points here; this is the side with the history behind it.",
    when: [
      "A customer says they should have more points than the till shows, and you want to see what actually happened.",
      "Somebody has a full stamp card and you are giving them the free one.",
      "You want the list of people who have a reward waiting, or who have not been in for three months.",
      "You are deciding whether the programme is worth running, and want to see spend per customer against visits."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Guests &rsaquo; Loyalty accounts</b>. Every customer who has ever been rung up with their name on the sale is here, most recently seen first.",
      "There is no <span class='man-key'>New</span> button, and that is deliberate: an account is opened by the first sale, so it can never exist for somebody who has never been in.",
      "Click <b>A reward is waiting</b> under Filters to see only the full cards.",
      "Open one. The four figures across the top are points, stamps out of what makes a reward, what they have spent with you and how many visits. Under them is every movement: earned, spent, a stamp, a reward given, and anything taken back on a refund, each with the sale it came from.",
      "For a full card: ring the free item up at the till at zero, the same as any other giveaway, then come back here and click <span class='man-key'>Give the reward</span>. You should see <i>Given. 0 still waiting.</i> and a <b>Reward given</b> line in the movements.",
      "To see where the rules come from, open <b>Loyalty programmes</b>: whichever programme is active is the one the till is using, and what is in force is read fresh at the start of every shift."
    ],
    fields: [
      ["Customer", "Who the account belongs to. It cannot be changed; the account follows the contact.", "auto"],
      ["Programme", "The programme that was live when the account was opened.", "auto"],
      ["Points", "What they can spend. The same number the till shows and the contact carries.", "auto"],
      ["Stamps", "How far along the card they are, out of the number the programme says makes a reward.", "auto"],
      ["Reward due", "How many full cards are waiting to be claimed. A card that fills starts again, so somebody who never claims does not lose them.", "auto"],
      ["Tier", "Moved on what they have spent with you, at the thresholds the programme sets.", "auto"],
      ["Spent with you", "Everything rung up against them since the account opened, before any refund.", "auto"],
      ["Visits", "How many sales carried their name.", "auto"],
      ["Last seen", "The last movement of any kind.", "auto"]
    ],
    buttons: [
      ["Give the reward", "Uses up one full card and records that it was given. The free item itself is rung up at the till at zero."]
    ],
    after: "<p>Nothing on this screen is typed, which is the point of it. Only the till writes to an account, and it writes through one call that earns, redeems, counts the stamp, fills the card, moves the tier and copies the points onto the contact in the same breath, so the two can never drift apart.</p><p>Every movement is its own line. That is what lets a refund take back exactly what its own sale gave, instead of recalculating from today's rules and taking back a different number because the programme changed last month.</p><p>Loyalty does not post to the ledger. Points are a discount you have promised, not money, and the discount reaches the books when it is spent, as a discount on that sale.</p>",
    links: [
      { name: "Loyalty programmes", how: "Where points per unit, the value of a point, the stamps for a reward and the tiers are set. The newest active programme is the one in force.", to: "gst.loyalty" },
      { name: "Register", how: "Where the account is written. The charge screen shows what a point is worth and offers to spend them.", to: "pos.terminal" },
      { name: "Returns", how: "Refunding a sale takes back exactly the loyalty that sale gave.", to: "pos.returns" },
      { name: "Customers", how: "The contact carries a copy of the points, for the screens that only need the number.", to: "contacts" }
    ],
    mistakes: [
      ["That card is not full yet.", "There is no reward waiting. Check the stamps figure against what the programme asks for."],
      ["That customer has 120 points, not 300.", "The till was asked to spend more than the account holds. Points can only be spent down to nothing."],
      ["The customer's loyalty could not be recorded, so correct it on their account", "The sale went through but the loyalty call did not, usually a connection drop mid-sale. Open the account and see what the last movement was; a missing earn is the only thing to put right."],
      ["Nothing on the account, but they have been in", "The sale was rung up without their name on it. Loyalty needs the customer chosen at the till before the payment is taken."],
      ["Points earned but the programme looks wrong", "Whichever programme is active and inside its dates wins, newest first. Switch the old one off rather than leaving two live."]
    ],
    tips: [
      "Start with a stamp card. It is the easiest to explain at a counter and the only kind a customer can check themselves.",
      "Filter to <b>Not seen in 90 days</b> for the list worth a message. People with points sitting unspent are the cheapest custom to win back.",
      "A programme switched off mid-month does not wipe anybody's balance: the accounts stay, and the next sale earns on whatever is live then."
    ]
  },

  "rst.bookings": {
    title: "Course bookings",
    what: "A place on one of your courses: who is on it, when, what they were charged, whether it has been invoiced and paid, and whether they walked away with a certificate. A paying guest is invoiced from here, once. Your own staff are on the same list and are not charged, because training your own people is a cost, not a sale.",
    when: [
      "Somebody books a place, by phone, in person or through the website.",
      "A course has run and you are invoicing the places on it.",
      "Certificates are going out.",
      "You want to know which places are still unpaid, or which courses actually fill."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Roastery &rsaquo; Course bookings</b> and click <span class='man-key'>New</span>. In this example a cafe sells a place on a 6-hour latte art course for 120.",
      "Pick the course in <b>Course</b>. The list shows each course with its price. Set <b>When</b> to the session date.",
      "Choose the customer in <b>A paying guest</b>, and leave <b>Or our own staff</b> empty. Pick one or the other, never both.",
      "Leave <b>Fee</b> empty to use the course price, or type a different figure for a discount you have agreed.",
      "Click <span class='man-key'>Save</span>. The booking shows as <b>Booked</b> and <b>Not yet</b> invoiced.",
      "Click <span class='man-key'>Invoice the place</span>. A draft customer invoice is raised for the fee, with the course name and the session date on the line, and the booking records which invoice it was. You should see <i>Invoice raised as a draft. Post it when you are ready.</i>",
      "Open the invoice from <b>Invoices</b>, check it and post it. Register the payment there as usual, then tick <b>Paid</b> on the booking if you track it here as well.",
      "After the course, set <b>Status</b> to <i>Attended</i> and save. Click <span class='man-key'>Issue the certificate</span> and a reference is filled in with today's date.",
      "For your own staff: pick them in <b>Or our own staff</b> and leave the guest empty. The fee column reads <i>internal</i> and there is nothing to invoice."
    ],
    fields: [
      ["Course", "Which course. Set them up in Training academy.", "required"],
      ["When", "The session date.", "required"],
      ["A paying guest", "Somebody outside the business, who gets invoiced.", "optional"],
      ["Or our own staff", "One of your own people, who does not. One or the other, not both.", "optional"],
      ["Fee", "What they are being charged. Left empty, the course price is used when the place is invoiced.", "optional"],
      ["Status", "Booked, Attended, Did not turn up or Cancelled. Attended is what unlocks the certificate.", "required"],
      ["Paid", "Your own note that the money is in. The invoice is the record that counts.", "optional"],
      ["Certificate reference", "Filled in by Issue the certificate, or typed if you number them your own way.", "optional"],
      ["Note", "Anything worth remembering about the place.", "optional"]
    ],
    buttons: [
      ["Invoice the place", "Raises a draft customer invoice for the fee and ties it to this booking, so a place cannot be invoiced twice."],
      ["Issue the certificate", "Only once the status is Attended. Fills in a reference and today's date."],
      ["Delete", "Only a booking with no invoice behind it."]
    ],
    after: "<p><b>Invoice the place</b> creates a real draft invoice in Accounting: customer, one line naming the course and the session date, and the fee. It is a draft on purpose, so somebody can look at it before it goes out. Posting it, taking the payment and chasing it all happen there, and the booking keeps the link so the same place is never invoiced twice.</p><p>Nothing else posts. A certificate is a reference and a date; a place for your own staff costs nothing and raises nothing.</p>",
    links: [
      { name: "Training academy", how: "The courses, their length and their price.", to: "rst.courses" },
      { name: "Invoices", how: "Where the invoice this screen raises is posted, sent and chased.", to: "inv.out" },
      { name: "Customers", how: "A paying guest is a contact.", to: "contacts" },
      { name: "Certifications", how: "Where a qualification is recorded against one of your own people, for good.", to: "hr.certs" }
    ],
    mistakes: [
      ["Which course?", "No course is chosen."],
      ["Who is on it? Either a paying guest or one of our own staff.", "Both are empty. A booking belongs to somebody."],
      ["One or the other, not both", "A guest and a staff member are both filled in. A place is either sold or internal; it cannot be both."],
      ["There is no fee on this booking or on the course, so there is nothing to invoice", "The course is free, or its price is empty. Put the fee on the booking, or on the course."],
      ["Invoice the place is not there", "It is either a staff place or already invoiced. The Invoiced column says which."],
      ["Issue the certificate is not there", "The status is not Attended yet, or a reference is already filled in."]
    ],
    tips: [
      "Filter to <b>Still to invoice</b> after a course has run: it is the list of money you have earned and not asked for.",
      "<b>Attended, no certificate</b> is the other list worth clearing, because a certificate nobody sent is the thing a guest remembers.",
      "Group by <b>Course</b> to see which ones actually fill. A course that never fills is a price problem or a day problem, and the bookings tell you which."
    ]
  },

  "gst.passes": {
    title: "Passes and subscriptions",
    what: "Who holds one of your passes: which plan, since when, how much of it they have used this period, and when it bills again. This is the half that acts. The till reads it, honours the daily and the period limit, refuses past them with a sentence a cashier can read out, and a nightly job raises and posts the next period's invoice.",
    when: [
      "Somebody buys an unlimited pass or a subscription box.",
      "A pass is being cancelled.",
      "Month end, to see which passes are due to bill and which are not being used.",
      "A customer says the till would not let them have their coffee and you want to see why."
    ],
    how: [
      "Set the plan up first in <b>Subscription plans</b>: the price, how often it bills, the item it includes and the limits. For this example, an unlimited-coffee pass at 40 a month, 2 a day, 40 a period.",
      "Open <b>Kitchen &rsaquo; Guests &rsaquo; Passes and subscriptions</b> and click <span class='man-key'>New</span>. Pick the pass and the customer, leave <b>Since</b> on today and <b>Next bill</b> on today, and save.",
      "Click <span class='man-key'>Bill it now</span>. The first month's invoice is raised and posted, the billing date moves on a month, and the period count resets to nothing.",
      "Now the till. Open the register, choose that customer, ring up the coffee and press <span class='man-key'>Charge</span>. A box reads <b>On their pass</b>: <i>Yes, Flat white on the Unlimited coffee</i>, and under it <i>Unlimited coffee, 2 left today, 40 left this period</i>.",
      "Choose yes. The coffee comes off the bill and the total drops to nothing. Take the payment as usual and the sale completes with <i>on the Unlimited coffee, 1 left today</i>.",
      "Try a third coffee the same day and the sale is charged in full with the reason: <i>That pass covers 2 a day and 2 has already been taken today.</i>",
      "Back on this screen, the pass shows <b>2 / 40</b> used this period and every use is listed when you open it.",
      "Nothing needs pressing each month: the nightly run bills every pass that is due. <span class='man-key'>Bill everything due</span> on this screen does the same thing now, when you want to see it happen."
    ],
    fields: [
      ["Pass", "Which plan. The plan carries the price, the period, the included item and the limits.", "required"],
      ["Who", "The customer who holds it. One active pass per customer per plan.", "required"],
      ["Since", "When they started.", "required"],
      ["Next bill", "The nightly run bills every active pass on or past this date, then moves it on by the plan's period. Empty means it never bills again.", "optional"],
      ["Status", "Active or Paused. Use Cancel the pass rather than setting this, so the reason and the date are recorded.", "required"],
      ["Used this period", "Kept by the till. Change it only to correct something.", "auto"],
      ["Note", "Anything worth remembering.", "optional"]
    ],
    buttons: [
      ["Bill it now", "Raises and posts the invoice for this period and moves the billing date on."],
      ["Bill everything due", "On the list: the same thing for every pass whose date has come, which is what the nightly run does."],
      ["Cancel the pass", "Stops it billing and stops the till honouring it. What they have already paid for stands."],
      ["Delete", "Only a pass that has never been used."]
    ],
    after: "<p>Billing raises a <b>posted</b> customer invoice for the plan's price, one line naming the plan and the period, then advances the billing date and resets the period count. It is posted rather than drafted because it is a price agreed in advance for a period that has started, and a nightly job cannot ask anyone to check it. The invoice number comes from the same Document Numbering settings the rest of Orbit uses.</p><p>Using a pass at the till writes a line against it and takes one off the day's and the period's count, in the database, at the moment the sale goes through. So an abandoned sale does not spend it, and no till can honour a pass and forget to count it. Cancelling clears the billing date, which is what stops it.</p>",
    links: [
      { name: "Subscription plans", how: "The price, the period, the included item and the limits.", to: "gst.subs" },
      { name: "Register", how: "Where a pass is used: pick the customer and the charge screen offers it.", to: "pos.terminal" },
      { name: "Invoices", how: "Where the billing invoices land, posted.", to: "inv.out" },
      { name: "Customers", how: "Who can hold one.", to: "contacts" }
    ],
    mistakes: [
      ["That pass covers 2 a day and 2 has already been taken today.", "The daily limit. The sale is charged in full; the pass starts again tomorrow."],
      ["That pass covers 40 this period and 40 have been taken. It starts again on 2026-11-11.", "The period limit, which resets when the pass next bills."],
      ["That pass is cancelled. It cannot be used.", "It was cancelled. Sell them a new one; the old one stays as history."],
      ["That customer already has an active pass on this plan.", "One active pass per customer per plan, so a double sale cannot happen by accident. Open the existing one."],
      ["On their pass is not offered at the till", "Either nothing on the cart is the item the plan includes, or the limit is already used up for today. Open the pass here and the counts say which."],
      ["Which pass? / Whose pass is it?", "The plan or the customer is empty."]
    ],
    tips: [
      "Filter to <b>Due to be billed</b> before the first of the month if you want to see what the nightly run will do.",
      "<b>Used it all this period</b> is the list of your heaviest users, which is the figure that tells you whether the pass is priced right.",
      "A pass with no daily limit is genuinely unlimited. If that is not what you meant, the limit belongs on the plan."
    ]
  },

  "rst.standing": {
    title: "Standing orders",
    what: "What a wholesale account takes every week without being asked: the item, the quantity, how often, and the date it next comes round. <span class='man-key'>Raise what is due</span> turns every line whose date has come into a draft sales order, one per account, and moves the dates on.",
    when: [
      "A wholesale customer agrees a weekly quantity.",
      "Every delivery day, to raise the orders for the round.",
      "A customer is closed for a fortnight and the line should pause.",
      "You want to see what the round is worth before you load the van."
    ],
    how: [
      "The account comes first: <b>Kitchen &rsaquo; Roastery &rsaquo; Wholesale accounts</b>, with its contact, price tier, round and delivery day.",
      "Open <b>Standing orders</b> and click <span class='man-key'>New</span>. For this example a cafe takes 20 kg of house blend every week.",
      "Pick the account, pick the item, type 20 in <b>Quantity each time</b> and <i>kg</i> in <b>Unit</b>, leave <b>How often</b> on <i>Every week</i> and set <b>Next due</b> to the next delivery day.",
      "Click <span class='man-key'>Save</span>. The row shows what it is worth at the item's price and when it is next due.",
      "On the delivery day, click <span class='man-key'>Raise what is due</span>. You should see <i>1 order(s) raised with 1 line(s). They are drafts in Quotations.</i>",
      "Open <b>Sales &rsaquo; Quotations</b>: a draft order for that account with the line on it. Check it, confirm it and deliver it the way you would any order.",
      "Back here, <b>Next</b> has moved on a week and <b>Last raised</b> shows today. Pressing the button again the same day raises nothing.",
      "Nothing needs pressing at all if you leave it: a nightly job does the same thing."
    ],
    fields: [
      ["Account", "The wholesale account. The order is raised for that account's contact.", "required"],
      ["Item", "What they take.", "required"],
      ["Quantity each time", "How much, per delivery.", "required"],
      ["Unit", "kg, cases, bags. It goes onto the order line.", "optional"],
      ["How often", "Every day, week, fortnight or month.", "required"],
      ["Next due", "The date it next comes round. Raise what is due picks up every line on or past this date.", "required"],
      ["Running", "Pause it over a holiday rather than deleting it, so the history and the agreement stay.", "optional"],
      ["Note", "Anything worth remembering.", "optional"]
    ],
    buttons: [
      ["Raise what is due", "One draft sales order per account, with a line per standing order that has come round, and the dates moved on."],
      ["Delete", "Removes the agreement. Pausing it keeps the history."],
      ["Filters", "<b>Due now</b> and <b>Paused</b>."],
      ["Group By", "<b>Account</b> or <b>Round</b>, which is how a van is actually loaded."]
    ],
    after: "<p>An order is raised as a <b>draft</b>, not confirmed: a standing order is an agreement about quantity, not permission to invoice without anybody looking. It carries a line per due standing order, priced at the item's list price, and a note saying where it came from. Confirm it, deliver it and invoice it the way you would any other order.</p><p>A line nobody has looked at for months raises <b>one</b> order, today, and its date lands on the next one in the future. It does not raise an order for every week that was missed: those deliveries did not happen, and a stack of invoices for them would be worse than nothing.</p>",
    links: [
      { name: "Wholesale accounts", how: "The accounts, their rounds and their delivery days.", to: "rst.wholesale" },
      { name: "Quotations", how: "Where the raised orders land, as drafts.", to: "so.list" },
      { name: "Items", how: "Where the price on the line comes from.", to: "products" }
    ],
    mistakes: [
      ["Which account? / Which item? / How much, each time?", "One of the three required fields is empty."],
      ["Nothing is due today", "No line has a date on or before today. The <b>Due now</b> filter shows which, if any."],
      ["It raised an order I did not expect", "A line was due. Check <b>Next</b> on the row: a line left running over a closure keeps coming round. Pause it instead."],
      ["The order has no price on a line", "The item has no list price. Set one on the item, or price the order by hand before confirming it."],
      ["Two orders for the same account", "Only if the account has two sets of lines with different due dates. Each run raises one order per account for whatever is due that day."]
    ],
    tips: [
      "Group by <b>Round</b> and the list reads like a loading sheet.",
      "Set <b>Next due</b> to the real delivery day, not today: it is the date the whole schedule steps from.",
      "Pause rather than delete. A paused line still says what was agreed, which is what you want when somebody rings up in three months."
    ]
  },

  "dlv.zones": {
    title: "Delivery zones",
    what: "Where you deliver, what it costs and the smallest order you will take there. A delivery picks its zone and the fee comes from here, so a rider is not deciding it at the door and two customers in the same street are not charged differently.",
    when: [
      "Setting delivery up for the first time.",
      "A zone's fee changes, or fuel does.",
      "You stop delivering somewhere: switch the zone off rather than deleting it.",
      "A branch delivers to a different set of areas from the others."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Delivery &rsaquo; Delivery zones</b> and click <span class='man-key'>New</span>.",
      "Type <i>Gemmayze</i> in <b>Zone</b>, leave <b>Store</b> empty for a zone every branch delivers to, and put 3 in <b>Delivery fee</b>.",
      "Put 15 in <b>Smallest order</b> and 30 in <b>Should take (minutes)</b>, then save.",
      "Now open <b>Own deliveries</b> and click <span class='man-key'>New</span>. Choose <i>Gemmayze</i> in <b>Zone</b> and leave <b>Delivery fee</b> empty: on saving it fills in as 3.00 from the zone.",
      "Where a fee was agreed differently, type it and it is left alone.",
      "When you stop delivering to a zone, set <b>Delivering there</b> to No. It disappears from the list a delivery can choose and the old deliveries keep their zone."
    ],
    fields: [
      ["Zone", "What you call the area. It is what a rider and a cashier will say.", "required"],
      ["Store", "One branch, or empty for a zone every branch delivers to.", "optional"],
      ["Delivery fee", "What you charge to deliver there. A delivery with no fee typed takes this one.", "optional"],
      ["Smallest order", "The order value below which you would rather not go. Recorded, not enforced: somebody may have agreed it.", "optional"],
      ["Should take (minutes)", "What you promise. It is the number to measure the real delivery times against.", "optional"],
      ["Delivering there", "No takes it off the list a new delivery can choose.", "optional"]
    ],
    buttons: [
      ["New", "Adds a zone."],
      ["Filters", "<b>Not delivering</b>."],
      ["Group By", "<b>Store</b>, where branches deliver to different areas."]
    ],
    after: "<p>Nothing posts. A zone is read by a delivery when it is saved: a delivery with a zone and no fee takes the zone's fee, and one with a fee already typed keeps it.</p><p>The map polygon is not drawn on this screen. A zone here is a name, a fee and a minimum, which is what the till and the rider actually need; drawing boundaries is a mapping feature and is not pretended at.</p>",
    links: [
      { name: "Own deliveries", how: "Where a zone is used, and where its fee lands.", to: "dlv.deliveries" },
      { name: "Stores", how: "The branches a zone can belong to.", to: "estate.stores" }
    ],
    mistakes: [
      ["Zone is required", "Give it a name."],
      ["A delivery took the wrong fee", "The fee was already typed on the delivery, so the zone was not used. Clear it and save again."],
      ["A zone is missing from the delivery form", "It is switched off. Set Delivering there back to Yes."]
    ],
    tips: [
      "Name zones the way your riders already name them, not the way a map does.",
      "Set <b>Should take</b> honestly. It is the only number that makes the delivery times on the Service times screen mean anything.",
      "A minimum order is worth recording even if nobody enforces it: it is the conversation you have with the branch, not with the customer."
    ]
  },

  "fr.fund": {
    title: "Marketing fund",
    what: "What each franchisee has contributed to the marketing fund, what has been spent out of it, and what is left. The balance is the only figure a franchisee ever asks about, and it is money the brand is holding on their behalf rather than its own.",
    when: [
      "A levy is charged for the period.",
      "A campaign has been paid for out of the fund.",
      "A franchisee asks what is left, which they will.",
      "Year end, when the fund has to be accounted for to the network."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Franchise &rsaquo; Marketing fund</b>. The three figures along the top are the whole network: levied, spent, and held on their behalf.",
      "The table under them is one row per franchisee with their own balance, and under that is every entry in date order.",
      "Click <span class='man-key'>New entry</span>. For a levy: pick the franchisee, leave <b>What</b> on <i>A levy they contributed</i>, type the amount and save.",
      "For a national campaign: leave <b>Franchisee</b> empty, choose <i>Money spent out of the fund</i>, type the amount and name the campaign, for example <i>Ramadan radio</i>.",
      "The balance updates straight away. A franchisee's row shows what they have put in, what has been spent against them, and the difference.",
      "Click <span class='man-key'>Print</span> for a copy on your letterhead, which is what to hand over at a network meeting, or <span class='man-key'>Export</span> for the figures."
    ],
    fields: [
      ["Franchisee", "Whose levy it is, or who the spend is for. Empty means the whole network, which is the usual shape of a national campaign.", "optional"],
      ["When", "The date it belongs to.", "required"],
      ["What", "A levy they contributed, or money spent out of the fund.", "required"],
      ["Amount", "Always a positive number. What it is decides which way it counts.", "required"],
      ["Campaign", "What the money went on. It is how the spend reads back to a franchisee.", "optional"],
      ["Description", "Anything worth saying.", "optional"]
    ],
    buttons: [
      ["New entry", "Records a levy charged or money spent."],
      ["Print", "The fund on your letterhead."],
      ["Export", "The figures as a CSV file."]
    ],
    after: "<p>Nothing here posts to the ledger, and that is deliberate: the levy reaches the books as an <b>invoice</b> to the franchisee, raised in Sales, and the spend reaches them as a <b>supplier bill</b>. This screen is the fund's own record of who contributed what and what it was spent on, which is the thing the brand owes the network an answer about.</p><p>A levy is money in; anything else is money out. The balance is what you are holding and have not yet spent on their behalf.</p>",
    links: [
      { name: "Royalty run", how: "Works out the royalty and the marketing levy due on reported sales, which is where the levy figure comes from.", to: "fr.royaltyrun" },
      { name: "Franchisees", how: "Who can appear here.", to: "fr.franchisees" },
      { name: "Invoices", how: "Where a levy becomes real money owed.", to: "inv.out" },
      { name: "Bills", how: "Where the agency's invoice belongs.", to: "inv.in" }
    ],
    mistakes: [
      ["How much?", "The amount is empty or zero."],
      ["A spend made the balance negative", "More has been spent than was contributed. It is allowed, because it happens, but it is worth knowing: the brand is funding the difference."],
      ["Nothing in the fund yet", "No entries. New entry records the first one."],
      ["The balance does not match the ledger", "It is not meant to. This is the fund's own record; the ledger has the invoices and the bills. Link the invoice on the entry when you raise it."]
    ],
    tips: [
      "Record the levy for every period, even when nothing is spent. A fund with contributions and no spend is a conversation waiting to happen.",
      "Name the campaign, always. <i>Ramadan radio</i> reads back to a franchisee; <i>marketing</i> does not.",
      "Print it before a network meeting rather than during one."
    ]
  }

});
