/* Orbit screen help: Plot, building and property management.
 *
 * One page per screen, keyed by the screen's menu action. js/app.js loads this
 * file the first time help is opened (loadScreenHelp) and renders a page with
 * screenHelpHTML. Plain English, written for a first-time building manager or
 * committee member. Never an em dash.
 *
 * The shape of a page (every part except title and what is optional):
 *   title     the screen name as the menu shows it
 *   what      what the screen is for, in two to four sentences (HTML)
 *   when      [the situations in which you open it]
 *   how       [the numbered steps of one worked example, with what you should see]
 *   fields    [[label as on screen, what to enter and what it drives, "required" | "optional" | "auto"]]
 *   buttons   [[label as on screen, what pressing it does]]
 *   after     what saving changes in the books and in other apps (HTML)
 *   links     [{ name, how, to: "menu.action" }]   to makes the name a link
 *   mistakes  [[the message or symptom exactly as shown, why it happens and the fix]]
 *   tips      [short extras worth knowing]
 * HTML inside the strings uses single-quoted attributes, for example
 * <span class='man-key'>Save</span> for a button name.
 *
 * The charge split described on these pages is plotBudgetCalc in js/app.js.
 */
orbitScreenHelp({

  "plot.dash": {
    title: "Overview",
    what: "The <b>Overview</b> is the home of Plot. It shows one building at a time: the cash in its fund, its units and owners, what it bills each month, what owners still owe and what it owes suppliers. It is also where the money jobs start: generating the period's charges, recording a payment, raising a special assessment, printing an owner statement and giving surplus cash back to owners. With no building yet, it offers to set one up in one sitting.",
    when: [
      "You are new to Plot and have no building yet. <span class='man-key'>Set up a building</span> creates the building, its units, owners and running costs in one window.",
      "At the start of each month, to generate the charges owners pay.",
      "An owner or tenant hands over a payment and wants a receipt.",
      "The building needs a one-off sum for works, or holds more cash than it needs to keep.",
      "Before a committee meeting, to check the fund balance and what is still owed."
    ],
    how: [
      "Open <b>Plot &rsaquo; Overview</b>. With no building you see <b>No buildings yet</b>. Click <span class='man-key'>Set up a building</span>. For this example: Cedar Court, a residential building with two shops on the ground floor and four flats above.",
      "Type <i>Cedar Court</i> in <b>Name</b>. Change <b>Shares total</b> to 1000, because the owners count shares in milliemes, and set <b>Reserve uplift %</b> to 5.",
      "Under <b>Units and shares</b>, enter unit <i>S1</i> with its owner's name and share 120, then <i>S2</i> with 80. Click <span class='man-key'>Add unit</span> for flats <i>1A</i>, <i>1B</i>, <i>2A</i> and <i>2B</i> at 200 each. You should see <b>Shares so far: 1000 of 1000</b>; the figure turns red while the shares do not add up.",
      "Under <b>What it costs to run, each month</b>, type 600 for Concierge. Leave the amounts of Electricity, Generator and Cleaning empty (a cost with no amount is not saved), then click <span class='man-key'>Add cost</span> and enter <i>Insurance</i>, category Insurance, 200.",
      "Click <span class='man-key'>Save</span>. You should see <i>Cedar Court is set up with 6 unit(s)</i>, and the Overview shows <b>Units</b> 6, <b>Owners</b> 6 and <b>Monthly charges</b> 840.00: the 800.00 of costs plus the 5% reserve.",
      "Click <span class='man-key'>Generate this period's charges</span>. The <b>Period</b> is this month (for example 2026-09) and the <b>Due date</b> the last day of the month. Check the table: S1 100.80, S2 67.20 and each flat 168.00. Every unit pays 800.00 times its share out of 1000, plus 5%.",
      "Click <span class='man-key'>Save</span>. You should see <i>6 draft invoice(s) created - review and post them in Accounting</i>, and the Invoices list opens.",
      "Post the six draft invoices in Accounting. Back on the Overview, <b>Billed (posted)</b> and <b>Outstanding</b> both show 840.00.",
      "When the owner of flat 1A pays, click <span class='man-key'>Record a payment</span> and pick the 1A charge. <b>Amount received</b> fills with 168.00. Choose <b>How</b> Cash and click <span class='man-key'>Save</span>. You should see <i>Payment recorded</i>, a receipt opens to print, and <b>Outstanding</b> drops to 672.00."
    ],
    fields: [
      ["Building", "The picker at the top. Everything on the Overview is for this building, and Arrears, Expenses, Annual budget, Reports and Today's round open on the same building.", "optional"],
      ["Name (Set up a building)", "The building's name as it appears on invoices, letters and reports.", "required"],
      ["City (Set up a building)", "Where the building is. Shown next to the name in the building picker.", "optional"],
      ["Shares total (Set up a building)", "What the units' shares should add up to: 100 if owners think in percentages, 1000 for milliemes. It starts at 100 here. The split itself uses the shares actually entered on the units; this total is only used to warn you when they do not add up.", "optional"],
      ["Reserve uplift % (Set up a building)", "An extra percentage added to every unit's charge to build up the building's reserve fund.", "optional"],
      ["Unit, Owner and Share (Set up a building)", "One row per unit: its code, the owner's name and its share. A row with no unit code is ignored. An owner whose name matches an existing contact is linked to that contact; otherwise a new customer contact is created. Each unit is created as an apartment; change the type later in Units.", "required"],
      ["Cost, Category and Per month (Set up a building)", "The building's monthly running costs. Each row with a name and an amount above zero becomes a monthly charge. At least one unit is needed; costs are optional.", "optional"],
      ["Charge being paid (Record a payment)", "Lists every posted charge invoice of this building with money still owing, as unit, owner, invoice number and what is left.", "required"],
      ["Amount received (Record a payment)", "Fills with what is left on the chosen charge. Type less for a part payment.", "required"],
      ["Date (Record a payment)", "The day the money was received. Today unless you change it.", "auto"],
      ["Paid by and Their name (Record a payment)", "Whether the owner, the tenant or someone else paid, and their name. The name fills with the invoice's contact. Both print on the receipt.", "optional"],
      ["How and Reference (Record a payment)", "Cash, bank transfer, cheque, card or other, and a cheque or transfer reference. Both print on the receipt.", "optional"],
      ["What is it for (Special assessment)", "The purpose of the levy, for example <i>Lift motor replacement</i>. It becomes the invoice line, the invoice reference and the name of the run in Billing runs.", "required"],
      ["Total to raise (Special assessment)", "The whole sum the building needs. It is shared across the units, not charged to each.", "required"],
      ["Split (Special assessment)", "<b>By share (milliemes)</b> shares the total in proportion to each unit's shares; <b>Equally per unit</b> divides it by the number of units.", "optional"],
      ["Due date (Special assessment)", "When the levy is due. The last day of this month unless you change it.", "auto"],
      ["Only one block? (Special assessment)", "Shown only when units have a block. Pick a block to raise the levy from that block's units alone.", "optional"],
      ["Owner (Owner statement)", "Any current owner of a unit in this building. The statement lists their posted charges and credit notes on this building and the payments they made for it.", "required"],
      ["Amount to give back (Give back to owners)", "Fills with the surplus Orbit works out: cash on hand, less the reserve to keep, less what has already been given back. It stays empty while the building still owes suppliers.", "auto"]
    ],
    buttons: [
      ["Set up a building", "Shown when there is no building. Opens the one-window setup: the building, its units and owners, and its monthly costs."],
      ["Just add it manually", "Shown when there is no building. Opens the plain building form, the same as Buildings &rsaquo; New."],
      ["Edit building", "Opens the chosen building's settings, the same form as the Buildings screen."],
      ["Generate this period's charges", "Opens the charge preview for this building: what each unit pays, which units have no owner, and a Save that creates one draft invoice per billed unit. See Billing runs for the detail."],
      ["Record a payment", "Records money received against one posted charge: posts it to the ledger through the Cash or Bank journal, matches it to that invoice so what is left goes down, and opens a receipt to print."],
      ["Special assessment", "Raises a one-off levy outside the regular charges: one draft invoice per unit with an owner, grouped as a run in Billing runs. A unit with no owner is not billed: Orbit asks before going ahead, and the levy then raises that much less."],
      ["Owner statement", "Pick an owner and click Save: a statement of account opens to print, with a running balance and the balance due."],
      ["Give back to owners", "Shows cash on hand, reserve to keep, what was already given back and the surplus, then creates one draft credit note per unit with an owner, split by share. A unit with no owner gets nothing: Orbit asks before going ahead, and its share stays in the fund."],
      ["Units, Charges, Meetings", "Shortcuts to those screens."],
      ["Add unit and Add cost", "Add a row to the setup window. The small cross removes a row."],
      ["Save and Cancel", "In every window: Save does the job, Cancel closes without changing anything."]
    ],
    after: "<b>Set up a building</b> creates the building, its units, a contact and an ownership for every owner name, and a monthly charge for every cost. The building's income account is set to the first income account in your chart of accounts. <b>Generating charges</b> and a <b>special assessment</b> create <b>draft</b> customer invoices tagged to the building and the unit; drafts are not money yet, which is why <b>Billed (posted)</b> ignores them until they are posted in Accounting. <b>Give back to owners</b> creates draft customer credit notes the same way. <b>Record a payment</b> posts the receipt to the ledger (cash or bank against what the owner owes), keeps the method and payer on the payment, and lowers the invoice's balance so it shows as partly paid or paid in Arrears, the portal and reports. The <b>Fund balance</b> card is the building's opening balance, plus the payments received for this building, less what has been paid on bills tagged to this building. A payment counts for the building when it paid one of the building's charge invoices or credit notes, or when it was taken on account from an owner whose units are all in this building; payments for other buildings or other business in the company are left out.",
    links: [
      { name: "Buildings", how: "Where a building's reserve, opening balance, income account and letter details are set.", to: "plot.buildings" },
      { name: "Units", how: "The shares entered there decide what each unit pays.", to: "plot.units" },
      { name: "Charges", how: "The running costs that Generate this period's charges splits.", to: "plot.charges" },
      { name: "Billing runs", how: "Every generation and assessment is listed there by period.", to: "plot.runs" },
      { name: "Invoices", how: "Where the draft charge invoices are reviewed and posted.", to: "inv.out" },
      { name: "Credit Notes", how: "Where the draft give-back credit notes are reviewed and posted.", to: "inv.outr" },
      { name: "Arrears", how: "Posted charges past their due date, per unit, with the notice to send.", to: "plot.arrears" },
      { name: "Resident portal access", how: "Invite owners so they can see their charges and vote online.", to: "portal.admin" }
    ],
    mistakes: [
      ["Name the building", "The setup window has no building name. Type one in Name."],
      ["Add at least one unit", "Every unit row is missing its unit code. Fill in the Unit column of at least one row."],
      ["(n) charge invoice(s) are still draft and are not counted above", "A run created invoices that nobody has posted. Post them in Accounting, Invoices, so they become real amounts owed."],
      ["Unit shares add up to (x), but this building is set to a total of (y)", "The shares on the units do not match the building's Shares total. Charges still split in proportion, but a share is probably mistyped. Check the units, or correct Shares total on the building."],
      ["(n) charge(s) are scoped to a block that no unit belongs to", "A charge names a block no active unit has, so nobody can be billed for it and it is left out of the figures. Correct the block on the charge or on the units."],
      ["This building has no units yet / This building has no charges to bill", "Generate this period's charges needs at least one active unit and one active charge. Add them in Units and Charges."],
      ["(n) unit(s) have no owner on file and will be skipped", "Those units have no owner link, so no invoice can be addressed. Add the owner in Owners, then generate again for them."],
      ["(building) has already been billed for (period)", "A run for the same building and period exists. Click Cancel unless you really want a second set of invoices for that period."],
      ["Nothing outstanding on this building", "Record a payment only offers posted charges with a balance. Post the draft invoices first, or the charge is already paid."],
      ["That is more than the (amount) outstanding on this charge. Record (amount) here, and any advance as a separate receipt.", "The amount typed is higher than what is left on the invoice. Record up to what is left, then apply the rest to the owner's other charges one at a time."],
      ["Say what the levy is for / Enter the total to raise", "The special assessment needs a purpose and a total above zero."],
      ["No units with an owner to bill", "No unit in the chosen scope has an owner link. Add owners in Owners first."],
      ["No owners on file", "Owner statement lists the current owners of this building's units only. Link owners to units in Owners."],
      ["This building still owes suppliers (amount)", "Bills tagged to this building are not fully paid. Settle them first; you can still continue after the question, but the cash may be needed."],
      ["Units have no shares to split by / No owners to give back to", "A give-back is split by unit shares and addressed to unit owners. Enter shares in Units and owners in Owners."],
      ["(n) unit(s) have no owner on file (codes), so their share of (amount) is not billed and the levy raises (amount) instead of (amount)", "Seen when raising a special assessment; a give-back asks the same, saying the share is not given back and stays in the fund. Those units have no owner link, so nobody can be invoiced or credited for them. Click Cancel, add the owners in Owners and try again, or click OK to go ahead without them."],
      ["An owner's advance is not in the Fund balance", "Money taken on account, not paid against a charge, counts for a building only when all of the owner's units are in that building, because otherwise Orbit cannot tell which building it is for. Record it against a charge with Record a payment instead."]
    ],
    tips: [
      "Record a payment puts the receipt in the books, the same as Register Payment on the invoice in Accounting. Use one or the other for each payment, never both.",
      "In a special assessment or a give-back, the cents lost in rounding go onto the unit with the largest amount, so the documents add up exactly. A unit with no owner is left out entirely: Orbit asks before going ahead, and its share is neither billed nor given back to anyone else, so link every owner first.",
      "Already given back counts every credit note tagged to the building, drafts included.",
      "The owner statement lists that owner's charges on this building and the payments they made for it: payments against the building's charges, and money on account when all their units are in this building."
    ]
  },

  "plot.buildings": {
    title: "Buildings",
    what: "A <b>building</b> is a record inside your company, so one company can manage many buildings and still bill, budget and report on each one separately. This screen lists them and holds each building's settings: how its shares are counted, the reserve uplift, the cash it held before Orbit, the income account its charges post to, and the officer names and legal references its letters print.",
    when: [
      "You take on a new building and want to add it by hand rather than with Set up a building.",
      "The committee changes the reserve percentage or the cash it wants to keep on hand.",
      "Before sending arrears letters, to fill in the committee head, treasurer, property number and payment instructions they quote.",
      "You stop managing a building and want to archive it without losing its history."
    ],
    how: [
      "Open <b>Plot &rsaquo; Buildings</b> and click <span class='man-key'>New</span>. For this example: Harbour House, a small office block with four offices, taken over from a previous managing agent.",
      "Type <i>Harbour House</i> in <b>Name</b>, <i>HH</i> in <b>Code</b>, and fill in <b>City</b>, <b>Country</b> and <b>Address</b>. Leave <b>Type</b> on Building.",
      "Leave <b>Shares total (milliemes)</b> at 1000 and <b>Reserve fund uplift %</b> at 0, since the owners have agreed no reserve for now.",
      "Type 2500.00 in <b>Opening balance</b>, the cash handed over by the previous agent, and 1000.00 in <b>Reserve to keep on hand</b>.",
      "In <b>Charges income account</b>, pick the income account your service charges should post to, or leave <b>(default)</b> to use the company's default income account. A charge can name an income account of its own, which it then posts to instead.",
      "Under <b>Officers &amp; documents</b>, type the names of the committee head and the treasurer exactly as they should sign letters, and the <b>Property number</b>, <b>Cadastral zone</b> and <b>Bylaws reference</b>.",
      "In <b>How owners pay</b>, type the bank details owners should use. Leave <b>Notice language</b> on English.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and Harbour House in the list with Shares total 1000 and Reserve 0%. It is now the building the Overview shows, with the 2,500.00 opening balance counted in its Fund balance."
    ],
    fields: [
      ["Name", "The building's name, shown in every picker and printed on letters, receipts and reports.", "required"],
      ["Code", "A short code shown next to the name in the list and searchable.", "optional"],
      ["Type", "Building, Compound, Villa, Tower or Mixed. Shown in the list.", "auto"],
      ["City, Country, Address", "Where the building is. The city shows in the Overview's building picker.", "optional"],
      ["Shares total (milliemes)", "What the units' shares should add up to, 1000 unless you change it. It does not change the split, which always uses the shares on the units; the Overview warns when the units do not add up to it, and the Units &amp; shares report quotes it.", "auto"],
      ["Reserve fund uplift %", "Added on top of every unit's regular charge. 5 means each owner pays 5% more than their share of the costs.", "optional"],
      ["Opening balance", "Cash the building already held before Orbit. It is the starting point of the Fund balance, the give-back surplus and the Fund movement report.", "optional"],
      ["Reserve to keep on hand", "The cash the building should always keep. Give back to owners only offers what is above it.", "optional"],
      ["Manager (contact)", "The contact who manages the building. Kept on the building record.", "optional"],
      ["Charges income account", "The income account for generated charge lines whose charge names no income account of its own, and for special assessments and give-back credit notes. Left on (default), the company's default income account is used when the invoice is posted.", "optional"],
      ["Committee head and Treasurer", "The names printed under the signature lines of arrears letters. The treasurer's name also appears at the foot of printed building reports.", "optional"],
      ["Property number, Cadastral zone, Bylaws reference", "The legal references an arrears letter quotes near its end.", "optional"],
      ["Also show amounts in and at this rate", "A second currency and its rate per company currency unit, for example LBP. When a rate is set, the charge preview adds a column in that currency. Invoices are still raised in the company currency.", "optional"],
      ["How owners pay", "Bank details or where to hand cash in. Printed under How to pay on arrears letters.", "optional"],
      ["Notice language", "English, Arabic, or Both (Arabic first, English on the following page). The language an arrears letter opens with; you can still change it on the letter.", "auto"],
      ["Footer / disclaimer on documents", "A short text printed at the foot of arrears letters.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank building form."],
      ["Save", "Saves the building. A new building becomes the one the Overview and other Plot screens open on."],
      ["Cancel", "Closes the form without saving."],
      ["Archive building", "On an existing building. Hides it from every Plot picker and screen but keeps all its records and invoices. The list still shows it, and the button then reads Restore building."],
      ["Restore building", "Brings an archived building back into the pickers."],
      ["Search, Columns, Export", "Find a building by name, city or code; choose columns; download the list as a CSV file."],
      ["Select", "Tick buildings to Export selected, Archive them, or Delete them. Delete is refused for a building that has units, charges, charge runs, invoices or payments, because deleting a building also deletes its units, owners, charges, meetings and budgets. Orbit offers to archive it instead."]
    ],
    after: "A building's settings feed the rest of Plot: the reserve percentage goes into every charge and the Monthly charges figure, the opening balance and reserve to keep drive the Fund balance and the give-back, the income account goes onto generated invoice lines whose charge names none, and the officer names, references, payment instructions, language and footer go onto arrears letters. Archiving only sets the building inactive: its units, owners, invoices and history stay.",
    links: [
      { name: "Overview", how: "Shows the building chosen here, with its fund balance and the money actions.", to: "plot.dash" },
      { name: "Units", how: "Each unit belongs to a building and carries its share.", to: "plot.units" },
      { name: "Notices", how: "Arrears letters print the officer names, references and payment instructions set here.", to: "plot.notices" },
      { name: "Charges", how: "Each running cost belongs to a building.", to: "plot.charges" }
    ],
    mistakes: [
      ["Enter a name", "The building has no name. Type one in Name."],
      ["Could not save: (message)", "The database refused the change, for example because you only have read access to this company. Ask an administrator for write access."],
      ["The building has vanished from the Overview and other screens", "It is archived. Open it from this list and click Restore building."],
      ["A formal notice prints without signatures or legal references", "Committee head, Treasurer, Property number, Cadastral zone and Bylaws reference are empty on the building. Fill them in and print the letter again."],
      ["The building (name) has units, so it can't be deleted. Deleting a building also deletes its units, owners, charges, meetings and budgets.", "The building has history (units, charges, charge runs, invoices or payments). Click OK to archive it instead: it leaves the pickers and keeps everything."]
    ],
    tips: [
      "To retire a building, use Archive building. Select then Delete removes the building permanently together with its units, charges, meetings, budgets and other records.",
      "Milliemes are simply shares out of 1000. A building that splits by floor area can enter each unit's area as its share instead; the split works the same way."
    ]
  },

  "plot.units": {
    title: "Units",
    what: "A <b>unit</b> is anything in a building that has an owner and pays towards the running costs: an apartment, a shop, an office, a parking space, a storage room. Its <b>share</b> decides how much of every cost it pays, and its <b>block</b> decides whether it shares in costs that belong to only part of the building. Opening a unit also shows who has owned and rented it, and is where a sale is recorded.",
    when: [
      "You add the units of a new building, or correct a share that was mistyped.",
      "Some costs belong to only part of the building, such as a lift the ground-floor shops never use, so units need a block.",
      "A unit is sold or inherited and the new owner must take over from a given date.",
      "The bylaws exclude a unit from owner votes."
    ],
    how: [
      "Open <b>Plot &rsaquo; Register &rsaquo; Units</b>. For this example, Cedar Court already has units S1, S2, 1A, 1B, 2A and 2B from Set up a building, and the committee wants the lift cost paid by the flats alone, with the second floor paying twice as much as the first.",
      "Click <b>S1</b>. Set <b>Type</b> to Shop, <b>Floor</b> to Ground and <b>Block / entrance</b> to <i>Shops</i>. Leave <b>Shares (milliemes)</b> at 120. Click <span class='man-key'>Save</span>; you should see <i>Saved</i>. Do the same for S2.",
      "Click <b>1A</b>. Set <b>Floor</b> to 1, <b>Block / entrance</b> to <i>Flats</i>, <b>Area (m2)</b> to 110, <b>Bedrooms</b> to 3 and <b>Block shares</b> to 1. Save.",
      "Give <b>1B</b> the block <i>Flats</i> and block shares 1, and give <b>2A</b> and <b>2B</b> the block <i>Flats</i> and block shares 2. Save each one.",
      "Click <span class='man-key'>Group By</span> and choose Block. You should see <b>Flats (4)</b> and <b>Shops (2)</b>.",
      "In Charges, a lift charge scoped to <i>Flats</i> will now be split 1 : 1 : 2 : 2 between the flats, while whole-building costs are still split 120 : 80 : 200 : 200 : 200 : 200 across all six units.",
      "Click <b>2B</b> again and scroll down. You should see <b>Ownership history</b> with the owner, the date they became owner, <b>present</b>, 100% and a <b>billed</b> badge."
    ],
    fields: [
      ["Building", "Which building the unit belongs to. Opens on the building you last worked on.", "required"],
      ["Unit code", "The unit's name, for example <i>A-12</i> or <i>P-04</i>. It appears on invoice lines, arrears letters and reports.", "required"],
      ["Type", "Apartment, Parking, Storage, Shop, Office or Common. Used for grouping; it does not change the split.", "auto"],
      ["Floor", "Which floor, as you want it written.", "optional"],
      ["Block / entrance", "Only for buildings where some costs belong to part of the building. A charge scoped to a block is shared by the units whose block has exactly the same text. Leave it blank if every cost is shared by the whole building.", "optional"],
      ["Area (m2)", "The unit's floor area, for reference and the Units &amp; shares report.", "optional"],
      ["Shares (milliemes)", "The unit's share of the building. A whole-building cost is split in proportion to the shares of all active units in the building. A blank share counts as 0, so the unit pays nothing of a whole-building cost unless no unit has any share, in which case the cost is divided equally.", "optional"],
      ["Block shares", "Only if a block splits its own costs by a different key. When any unit in a block has block shares, the block's costs are split by block shares within that block. When none do, the block's costs are split by the units' ordinary shares within the block.", "optional"],
      ["Bedrooms", "For reference.", "optional"],
      ["Lot number", "The cadastral lot. Printed on the certificate of clearance after a transfer.", "optional"],
      ["Voting", "<b>Votes normally</b> or <b>Excluded from voting</b>. An excluded unit still pays charges, but its shares count for nothing in owner votes and are left out of the building's total voting weight.", "auto"],
      ["Notes", "Anything worth keeping about the unit.", "optional"],
      ["New owner (Transfer unit)", "The contact buying or inheriting the unit.", "required"],
      ["Sale date (Transfer unit)", "The day ownership changes. The outgoing owner's link ends on this date and the new one starts on it. Today unless you change it.", "auto"],
      ["Sale price (Transfer unit)", "Kept on the outgoing owner's history line.", "optional"],
      ["Outstanding on this unit (Transfer unit)", "What is still unpaid on posted charge invoices for this unit. Read only.", "auto"],
      ["Who carries the (amount) outstanding? (Transfer unit)", "Shown only when something is unpaid. <b>The seller clears it</b> leaves the invoices with the seller. <b>It passes to the buyer</b> moves every unpaid posted invoice of the unit to the new owner.", "optional"],
      ["Note (Transfer unit)", "For example <i>sold</i> or <i>inherited</i>. Kept on both history lines.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank unit form."],
      ["Save", "Saves the unit. The change counts from the next time charges are generated."],
      ["Delete", "On an existing unit. Moves it to the Archive, from where it can be restored."],
      ["Sell / transfer this unit", "Under the history of an existing unit. Opens the transfer window."],
      ["Save (Transfer unit)", "Ends every current owner link of the unit on the sale date, starts the new owner at 100% as the billed owner, moves the unpaid invoices if the buyer carries them, and opens a certificate of clearance to print. When something is still unpaid on the unit it opens a statement of the balance at transfer instead, naming who carries it, because the unit is not clear."],
      ["Group By", "Group the list by Building, Block or Type."],
      ["Select", "Tick units to Export selected, Archive (the unit stops being billed and counted), or Delete permanently."],
      ["Search, Columns, Export", "Search by unit code, block or building; choose columns; download a CSV."]
    ],
    after: "Shares and blocks are read each time charges are generated, a special assessment is raised, a give-back is split or a vote is counted, so a corrected share changes the next run, never an invoice already created. Charges, assessments and give-backs only use active units that are not deleted. A transfer keeps the old owner in the unit's history with an end date, sale price and note, makes the new owner the billed owner, and records the transfer in the Activity log.",
    links: [
      { name: "Buildings", how: "A unit belongs to a building; the building's Shares total is what the units should add up to.", to: "plot.buildings" },
      { name: "Owners", how: "Links each unit to the contact who receives its charges.", to: "plot.owners" },
      { name: "Charges", how: "A charge scoped to a block is shared by that block's units.", to: "plot.charges" },
      { name: "Meetings", how: "Unit shares weight each owner's vote on a motion.", to: "plot.meetings" },
      { name: "Archive", how: "A deleted unit waits there to be restored.", to: "plot.archive" }
    ],
    mistakes: [
      ["Add a building first", "Units belong to a building. Add one in Buildings or with Set up a building on the Overview."],
      ["Enter a unit code", "The unit has no code. Type one, for example A-12."],
      ["Pick the new owner", "The transfer window needs the contact taking over. Add them in Contacts first if they are not in the list."],
      ["A block charge is billed to nobody", "The block on the charge does not match the block on any unit, letter for letter. The Overview names such charges; correct the spelling on the unit or pick the block again on the charge."],
      ["A statement of balance at transfer printed instead of a certificate of clearance", "Something is still unpaid on the unit's posted charge invoices. With The seller clears it, the document states the balance, says the outgoing owner is to settle it and that the unit is not clear; with It passes to the buyer, it says the balance passes to the new owner. A certificate of clearance is issued only when nothing is owed, so record the seller's payment before you save the transfer."]
    ],
    tips: [
      "Example of a block split: a lift charge of 400.00 a month scoped to block Flats, with block shares 1, 1, 2 and 2, costs flats 1A and 1B 66.67 each and flats 2A and 2B 133.33 each, before the reserve uplift. The shops pay none of it.",
      "A unit with no share but a block still pays its part of that block's costs when the block uses block shares."
    ]
  },

  "plot.owners": {
    title: "Owners",
    what: "An <b>owner</b> here is the link between a unit and a contact. Every unit needs one owner marked to receive its charges: that contact gets the unit's invoice each period, its arrears letters and, once invited, the building in the resident portal. Co-owners can be recorded too, with their share of the unit.",
    when: [
      "You link the owners of a building's units, or a unit has several owners.",
      "The owner who receives the charges changes, for example from one family member to another.",
      "Charges are skipped because a unit has no owner on file."
    ],
    how: [
      "Make sure both owners exist as contacts. For this example, flat 2A at Cedar Court is owned 60 : 40 by two relatives, and the one with 60% pays the charges.",
      "Open <b>Plot &rsaquo; Register &rsaquo; Owners</b> and click <span class='man-key'>New</span>.",
      "Pick <b>2A - Cedar Court</b> in <b>Unit</b> and the first relative in <b>Owner (contact)</b>. Type 60 in <b>Share of this unit %</b> and leave <b>Receives the charge?</b> on <i>Yes, bill this owner</i>. Click <span class='man-key'>Save</span>. You should see <i>Saved</i>.",
      "Click <span class='man-key'>New</span> again. Pick the same unit and the second relative, type 40 and choose <i>No, co-owner</i>. Save.",
      "In the list you should see two rows for 2A: the first with <b>Billed</b> in the Primary column, the second with <b>Co-owner</b>.",
      "The next time charges are generated, flat 2A's whole charge goes on one invoice to the billed owner."
    ],
    fields: [
      ["Unit", "Any active unit, shown as unit code and building.", "required"],
      ["Owner (contact)", "The contact who owns the unit. Add them in Contacts first if they are not listed.", "required"],
      ["Share of this unit %", "How much of the unit this person owns, 100 unless you change it. It is shown in the list and the unit's history; the charge and the vote are not divided by it.", "auto"],
      ["Receives the charge?", "<b>Yes, bill this owner</b> makes this contact the one invoiced for the unit. <b>No, co-owner</b> records the ownership without billing.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank owner link."],
      ["Save", "Saves the link."],
      ["Delete", "On an existing link. Moves it to the Archive, from where it can be restored."],
      ["Search, Select, Columns, Export", "Search by owner or unit; select rows to export or delete; choose columns; download a CSV."]
    ],
    after: "The billed owner is who Generate this period's charges, a special assessment and a give-back address their invoices and credit notes to. The Overview's Owners card counts different contacts, so one person with three units counts once. Arrears letters and owner statements are addressed to the contact. Any contact linked to a unit here can see that building in the resident portal once invited, and vote there with the unit's shares.",
    links: [
      { name: "Units", how: "Opening a unit shows its full ownership history and the transfer button.", to: "plot.units" },
      { name: "Contacts", how: "Owners are ordinary contacts; add or edit their details there.", to: "contacts" },
      { name: "Resident portal access", how: "Invite an owner to see their building and charges online.", to: "portal.admin" },
      { name: "Overview", how: "Generate this period's charges bills the owners linked here.", to: "plot.dash" }
    ],
    mistakes: [
      ["Pick a unit and a contact", "Both Unit and Owner (contact) are needed. Pick them, or add the contact in Contacts first."],
      ["(n) unit(s) have no owner on file and will be skipped", "Seen when generating charges: those units have no owner link. Add one here."],
      ["The wrong co-owner receives the invoice", "Only one link on a unit should be set to bill. If several are, only one of them is invoiced; if none is, Orbit still bills one of the unit's owners. Set Yes on the right person and No on the others."],
      ["A former owner still shows as Co-owner", "After Sell / transfer this unit, the old link is kept for the history with an end date and is no longer billed, so it shows as Co-owner here. Open the unit to see the dates."]
    ],
    tips: [
      "To change who owns a unit after a sale, use Sell / transfer this unit on the unit rather than editing the link here, so the history and any unpaid charges are handled."
    ]
  },

  "plot.tenancies": {
    title: "Tenancies",
    what: "A <b>tenancy</b> records who rents a unit from its owner: the tenant contact, the rent and how often it is due, the deposit, the dates, the status, and who pays the building's charges. It is a record for the building: Orbit does not raise rent invoices from it, and generated charges still go to the unit's billed owner.",
    when: [
      "An owner lets a unit and the building needs to know who lives or works there.",
      "A tenant gives notice or moves out.",
      "You want to see, on a unit, everyone who has rented it."
    ],
    how: [
      "Open <b>Plot &rsaquo; Register &rsaquo; Tenancies</b> and click <span class='man-key'>New</span>. For this example: office <i>O-2</i> at Harbour House, the small office block, is let to a design studio.",
      "Pick <b>O-2 - Harbour House</b> in <b>Unit</b> and the studio's contact in <b>Tenant (contact)</b>.",
      "Type 1500.00 in <b>Rent</b> and leave <b>Period</b> on monthly. Type 3000.00 in <b>Deposit</b>.",
      "Leave <b>Status</b> on active. Set <b>Start</b> to 2026-09-01 and <b>End</b> to 2028-08-31.",
      "In <b>Who pays the building charges?</b> choose <i>The tenant</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row with Rent <b>1,500.00 /mo</b> and an <b>active</b> badge.",
      "Open unit O-2 in Units: the tenancy appears under <b>Tenancies</b> below its ownership history.",
      "When the studio brings the office's service charge, record it from the Overview with <span class='man-key'>Record a payment</span> and <b>Paid by</b> set to The tenant, so the receipt names who actually paid."
    ],
    fields: [
      ["Unit", "Any active unit, shown as unit code and building.", "required"],
      ["Tenant (contact)", "The person or business renting the unit.", "required"],
      ["Rent", "The rent amount, shown in the list and the unit's history.", "optional"],
      ["Period", "monthly, quarterly or yearly. Shown after the rent in the list.", "auto"],
      ["Deposit", "The deposit held.", "optional"],
      ["Status", "active, notice (the tenant has given notice) or ended.", "auto"],
      ["Start and End", "The dates of the tenancy. An empty end shows as present in the unit's history.", "optional"],
      ["Who pays the building charges?", "The owner or the tenant, as agreed. It is recorded on the tenancy; Generate this period's charges still addresses the invoice to the unit's billed owner.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank tenancy."],
      ["Save", "Saves the tenancy."],
      ["Delete", "On an existing tenancy. Moves it to the Archive, from where it can be restored."],
      ["Filters", "Active shows tenancies with status active; Ended shows the rest, including tenants on notice."],
      ["Search, Select, Columns, Export", "Search by tenant or unit; select rows to export or delete; choose columns; download a CSV."]
    ],
    after: "The tenancy appears in the unit's history. Nothing is invoiced and nothing is posted to the accounts: rent between owner and tenant stays outside the building's books, and the building's charges keep going to the owner.",
    links: [
      { name: "Units", how: "Opening a unit lists its tenancies with dates, rent and status.", to: "plot.units" },
      { name: "Residents", how: "For who actually lives or works in the unit, with phone, vehicle and emergency contact.", to: "plot.residents" },
      { name: "Overview", how: "Record a payment has a Paid by choice for when the tenant pays.", to: "plot.dash" }
    ],
    mistakes: [
      ["Pick a unit and a contact", "Both Unit and Tenant (contact) are needed. Add the tenant in Contacts first if they are not listed."],
      ["The tenant receives no invoice", "Generated charges always go to the unit's billed owner. If the tenant is to be billed directly, the owner link would have to point at the tenant, which is usually not what the building wants; record the tenant's payments with Paid by The tenant instead."],
      ["A tenant invited to the portal sees nothing about the building", "The resident portal shows a building to contacts linked to a unit in Owners. A tenancy alone does not show it."]
    ]
  },

  "plot.charges": {
    title: "Charges",
    what: "A <b>charge</b> is one of the building's running costs that owners pay for: the concierge's salary, the generator, cleaning, the lift contract, insurance. It is a template, not the expense itself: each time charges are generated, every active charge is turned into a monthly amount and shared across the units by their shares, or across one block's units when the charge is scoped to a block. What the building actually pays its suppliers is recorded as bills.",
    when: [
      "You set up what a building costs to run, or a cost changes, such as a new cleaning contract.",
      "A cost belongs to only part of the building, for example a lift the ground-floor shops do not use.",
      "A cost stops, and should no longer be billed.",
      "An owner asks why their charge is what it is."
    ],
    how: [
      "Open <b>Plot &rsaquo; Money &rsaquo; Charges</b>. For this example, Cedar Court already has <i>Concierge</i> 600.00 monthly and <i>Insurance</i> 200.00 monthly from Set up a building, a 5% reserve, and units in blocks <i>Shops</i> (S1 120, S2 80) and <i>Flats</i> (1A, 1B, 2A, 2B at 200, block shares 1, 1, 2, 2).",
      "Click <span class='man-key'>New</span>. Leave <b>Building</b> on Cedar Court and type <i>Lift maintenance contract</i> in <b>Name</b>. Choose <b>Category</b> Elevator.",
      "In <b>Scope</b>, choose <b>Block Flats</b>. The list only offers blocks that units actually have.",
      "Type 1200.00 in <b>Amount</b> and choose <b>Frequency</b> quarterly. Pick the lift company in <b>Supplier (optional)</b> and leave <b>Active</b> on Active.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row with Scope <b>Block Flats</b>, Frequency quarterly and Amount 1,200.00.",
      "Open the Overview. <b>Monthly charges</b> now reads 1,260.00: 600.00 + 200.00 + 400.00 (the quarterly 1,200.00 divided by 3), plus 5%.",
      "Click <span class='man-key'>Generate this period's charges</span> and check the preview. S1 pays 100.80 and S2 67.20, as before, because the shops are not in block Flats.",
      "Flats 1A and 1B pay 238.00 each: 160.00 of the whole-building costs (800.00 times 200 / 1000) plus 66.67 of the lift (400.00 times 1 / 6), plus 5%. Flats 2A and 2B pay 308.00 each: 160.00 plus 133.33 of the lift, plus 5%. The six fees add up to 1,260.00."
    ],
    fields: [
      ["Building", "The building the cost belongs to. Opens on the building you last worked on.", "required"],
      ["Name", "What the cost is, for example <i>Concierge salary</i>. Shown in the list, the resident portal and the charge schedule; Fill from charges uses it as the budget line's label.", "required"],
      ["Category", "Concierge, Electricity, Generator, Water, Elevator, Cleaning, Maintenance, Security, Salary, Insurance or Other. It groups the list and becomes the category of the budget line made by Fill from charges.", "auto"],
      ["Scope", "<b>Whole building</b> shares the cost across every active unit of the building. <b>Block (name)</b> shares it across that block's units only. The choices come from the blocks on the units; with no blocks yet the box is greyed out.", "optional"],
      ["Amount", "What the cost comes to each period of its frequency, in the company currency. A charge of 0 bills nothing.", "optional"],
      ["Frequency", "monthly, quarterly or yearly. Charges are generated as one month's worth, so a quarterly amount is divided by 3 and a yearly one by 12.", "auto"],
      ["Supplier (optional)", "Who the building pays for this cost. Shown in the list for reference.", "optional"],
      ["Active", "<b>Active</b> charges are billed, counted in Monthly charges and shown on the resident portal. <b>Off</b> keeps the charge without billing it.", "auto"],
      ["Income account for this charge", "The income account this charge's part of each unit's invoice posts to. Left on <i>(use the building's default)</i>, it posts to the building's <b>Charges income account</b>.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank charge."],
      ["Save", "Saves the charge. It takes effect the next time charges are generated."],
      ["Delete", "On an existing charge. Moves it to the Archive, from where it can be restored."],
      ["Group By", "Group the list by Building or Category."],
      ["Select", "Tick charges to Export selected, Archive them (the same as setting Active to Off), or Delete them permanently."],
      ["Search, Columns, Export", "Search by name, category or building; choose columns; download a CSV."]
    ],
    after: "Saving a charge posts nothing. The split happens when charges are generated, in this order: <b>1.</b> every active charge is turned into a monthly figure (quarterly divided by 3, yearly by 12). <b>2.</b> A whole-building charge is shared across all active units in proportion to their shares, out of the total of those shares; if no unit has a share, it is divided equally. <b>3.</b> A block charge is shared only by the units of that block: by their block shares when any unit of the block has block shares, otherwise by their ordinary shares within the block, and equally if neither is set. <b>4.</b> Each unit's amounts are added up and the building's reserve percentage is added on top. <b>5.</b> Each unit's invoice is rounded to the cent and has one line per income account: a charge with its own income account gets a line on that account, and the rest share a line on the building's Charges income account. A unit whose total is nil is not billed. A charge scoped to a block that no unit has is billed to nobody: it is left out of every figure and named on the Overview. Active charges also show residents what the building spends per month in the portal, feed Fill from charges in the Annual budget, and make up the Charge schedule report.",
    links: [
      { name: "Units", how: "Shares, block and block shares on the units decide each unit's part.", to: "plot.units" },
      { name: "Buildings", how: "The reserve percentage and the Charges income account, used by charges that name no income account of their own, are set on the building.", to: "plot.buildings" },
      { name: "Billing runs", how: "Turns the charges into one draft invoice per unit for a period.", to: "plot.runs" },
      { name: "Annual budget", how: "Fill from charges turns each active charge into a yearly budget line.", to: "plot.budget" },
      { name: "Bills", how: "The actual invoices from suppliers, tagged to the building, are the real expense.", to: "inv.in" }
    ],
    mistakes: [
      ["Add a building first", "A charge belongs to a building. Add one in Buildings."],
      ["Enter a name", "The charge has no name. Type what the cost is."],
      ["The Scope box is greyed out with <i>no blocks defined on the units yet</i>", "No active unit of this building has a block. Set Block / entrance on the units first, or leave the charge on the whole building."],
      ["(n) charge(s) are scoped to a block that no unit belongs to", "Shown on the Overview. The block on the charge matches no unit, for example after a block was renamed on the units. Open the charge and pick the block again."],
      ["This building has no charges to bill", "Every charge of the building is Off, archived or deleted. Set at least one to Active."],
      ["Monthly charges is not the total of the amounts", "Quarterly and yearly amounts are divided by 3 and 12, and the reserve percentage is added on top."]
    ],
    tips: [
      "Small office block example: Harbour House has four offices with shares 150, 100, 100 and 50 (their floor areas) and one whole-building charge, cleaning at 800.00 a month, with no reserve. The offices pay 300.00, 200.00, 200.00 and 100.00.",
      "Change the amount rather than adding a second charge when a contract price changes, so the budget line made from it keeps matching."
    ]
  },

  "plot.runs": {
    title: "Billing runs",
    what: "A <b>billing run</b> is one generation of charges for a building and a period. It creates one <b>draft</b> customer invoice for every unit that has an owner and something to pay, using the split described on the Charges page, and keeps a record of the period, the units billed and the total. Special assessments appear here too, named after the levy.",
    when: [
      "At the start of each month, to bill the building's charges.",
      "You want to check whether a period has already been billed.",
      "An owner or the committee asks what was billed for a given month."
    ],
    how: [
      "Open <b>Plot &rsaquo; Money &rsaquo; Billing runs</b> and click <span class='man-key'>Generate charges</span>. It opens for the building you last worked on; for this example, Cedar Court with the charges from the Charges page.",
      "The window is titled <b>Generate charges - Cedar Court</b>. <b>Period</b> shows this month, for example <i>2026-10</i>, and <b>Due date</b> the last day of the month. Change the due date if the owners have longer to pay.",
      "Read the note: <i>Splitting 1,260.00/period across 6 unit(s) by share, incl. 5% reserve.</i>",
      "Check the table: S1 100.80, S2 67.20, 1A and 1B 238.00, 2A and 2B 308.00. A unit marked <b>(no owner)</b> will be skipped.",
      "Click <span class='man-key'>Save</span>. The button reads <b>Generating...</b> while it works. You should see <i>6 draft invoice(s) created - review and post them in Accounting</i>, and the Invoices list opens.",
      "Open one of the new invoices. It is addressed to the unit's billed owner, has the reference <i>Building charges 2026-10</i> and one line such as <i>Cedar Court - charges 2026-10 (1A)</i>, with no tax. If a charge names its own income account, the invoice has one line per account instead, each ending with the names of its charges.",
      "Post the six invoices in Accounting. Only then are they amounts owed: they appear in Arrears once past their due date, and on the owners' portal.",
      "Back in Billing runs you should see a row <b>2026-10</b>, Cedar Court, Issued today, Units 6, Total 1,260.00."
    ],
    fields: [
      ["Period", "A label for what is being billed, this month as year-month unless you change it. It goes into each invoice's reference and line, and is how Orbit notices a period billed twice.", "auto"],
      ["Due date", "The due date of every invoice in the run, the last day of this month unless you change it. Arrears counts an invoice as late the day after it.", "auto"],
      ["Unit, Share, Fee", "Read only: every unit with something to pay, its share and what it will be billed, including the reserve.", "auto"],
      ["Second currency column", "Read only. Shown when the building has Also show amounts in and a rate: each fee converted at that rate. The invoices are still raised in the company currency.", "auto"]
    ],
    buttons: [
      ["Generate charges", "Opens the charge preview for the building you last worked on."],
      ["Save", "Creates the run and one draft invoice per unit with an owner, then opens the Invoices list."],
      ["Cancel", "Closes the preview without creating anything."],
      ["Invoices", "On each run row. Opens the Invoices list in Accounting (all customer invoices, not only this run's); search for the period to find them."]
    ],
    after: "Saving writes the run record (building, period, issue date, due date, the reserve percentage at the time, units billed, total and currency) and, for each unit with an owner, a draft customer invoice: addressed to the billed owner, numbered in the normal invoice sequence, dated today, with the run's due date, no tax, and the unit's fee rounded to the cent, on one line per income account: a charge that names its own income account gets a line on that account, and the rest share a line on the building's Charges income account. The invoice is tagged to the building, the unit and the run. Drafts post nothing. Posting an invoice in Accounting records the owner's debt in receivables against that income account; from then on it counts in the Overview, Arrears, owner statements, building reports and the owner's portal.",
    links: [
      { name: "Charges", how: "The running costs every run splits.", to: "plot.charges" },
      { name: "Invoices", how: "Where the run's drafts are reviewed and posted.", to: "inv.out" },
      { name: "Overview", how: "Generate this period's charges opens the same preview, and Special assessment adds an assessment run.", to: "plot.dash" },
      { name: "Arrears", how: "Posted run invoices past their due date.", to: "plot.arrears" },
      { name: "Owners", how: "A unit is only billed when it has an owner link.", to: "plot.owners" }
    ],
    mistakes: [
      ["Add a building first", "There is no active building to bill. Add one in Buildings."],
      ["This building has no units yet / This building has no charges to bill", "The building needs at least one active unit and one active charge."],
      ["(n) unit(s) have no owner on file and will be skipped", "Link owners to those units in Owners, then generate again. Cancel first if you do not want a separate run for them later."],
      ["No units with an owner to bill", "No unit that has something to pay has an owner link."],
      ["(building) has already been billed for (period) ((n) unit(s)). Generate a SECOND set of invoices for the same period?", "A run exists for that period. Click Cancel unless you really mean to bill the period again, for example after correcting a missing owner."],
      ["Could not start the run: (message)", "The run record could not be saved, for example without write access to the company. Nothing was created."],
      ["The toast counts fewer invoices than the Units column", "An invoice that could not be created is skipped and the others carry on. Check the Invoices list for the units that are missing."],
      ["The line &quot;(name)&quot; has no account, and this company has no default income account.", "Seen when posting a run invoice. Set a Charges income account on the building, or a default income account in Settings, Companies, Accounting accounts."],
      ["No receivable account is set for this company.", "Seen when posting. Choose the receivable account in Settings, Companies, Accounting accounts."]
    ],
    tips: [
      "Every run bills one month of each cost, whatever you type in Period. Run it once a month; a quarterly cost is spread over three monthly runs.",
      "Each invoice is rounded to the cent, so the run total and the sum of the invoices can differ by a cent or two.",
      "The invoices are drafts so you can check them first: nothing is owed until they are posted."
    ]
  },

  "plot.arrears": {
    title: "Arrears",
    what: "<b>Arrears</b> lists what owners genuinely owe late, for one building: posted charge invoices that still have money owing and are past their due date. Debts are grouped per unit, credit notes the owner already has are taken off, and Orbit suggests which letter to send from how many months the oldest debt has been late. Drafts, and invoices not yet due, are never arrears.",
    when: [
      "Each month after the due date, to see who has not paid.",
      "Before a committee meeting, to report late payers.",
      "You want to send a reminder, a warning or a formal notice, pre-filled with the right figures."
    ],
    how: [
      "Open <b>Plot &rsaquo; Money &rsaquo; Arrears</b> and pick <b>Cedar Court</b> in <b>Building</b>. For this example it is 14 September 2026, and the owner of flat 2B has not paid the July and August charges of 308.00 each, due 31 July and 31 August.",
      "You should see a row for 2B: <b>Outstanding</b> 616.00, <b>Invoices</b> 2, <b>Months</b> 2, <b>Suggested</b> Warning. The total at the top right reads <b>616.00 outstanding</b>.",
      "<b>Last sent</b> shows <b>Reminder</b>, because a stage 1 notice was logged for this owner in August. It would show <i>none</i> if no notice had been logged.",
      "Click <span class='man-key'>Notice</span> on the row. The <b>Log a notice</b> window opens with the building, the owner, unit 2B, <b>Stage</b> 2 - Warning, <b>Amount overdue</b> 616.00, <b>Months overdue</b> 2 and today's date filled in.",
      "Choose <b>Channel</b> By hand. Pick the language next to <span class='man-key'>Print letter</span> and click it. A second notice opens to print, with the amount in figures and in words and the schedule of the two unpaid invoices.",
      "Deliver the letter, set <b>Delivered?</b> to Delivered and click <span class='man-key'>Save</span>. You should see <i>Saved</i>.",
      "Back on Arrears, <b>Last sent</b> for 2B now shows <b>Warning (2)</b>: the highest stage logged, and two notices in all."
    ],
    fields: [
      ["Building", "Which building's arrears to show. The choice is remembered for the other Plot screens.", "optional"],
      ["Owner and Unit", "Read only: the invoice's contact and unit. Invoices without a unit are grouped per owner.", "auto"],
      ["Outstanding", "Read only: what is left on the unit's late invoices, less the remaining balance of posted credit notes the owner has on this building. Credits are used on the owner's largest debt first; a unit whose debt is fully covered drops off the list.", "auto"],
      ["Invoices", "Read only: how many late invoices make up the figure.", "auto"],
      ["Months", "Read only: calendar months from the month the oldest late invoice fell due to this month. An invoice due on 31 July counts as 2 months late anywhere in September.", "auto"],
      ["Suggested", "Read only: Reminder under 2 months, Warning at 2 months, Formal at 3 months or more.", "auto"],
      ["Last sent", "Read only: the highest stage of the notices logged for this owner in this building, with the number of notices in brackets when there is more than one.", "auto"]
    ],
    buttons: [
      ["Notice", "Opens Log a notice pre-filled with the building, owner, unit, suggested stage, amount, months and today's date. From there you can print the letter and save the record."]
    ],
    after: "Arrears only reads. The notice you save from it is kept in Notices, and its stage shows here as Last sent. Paying the invoices, in Accounting or with Record a payment on the Overview, removes the unit from the list.",
    links: [
      { name: "Notices", how: "Every letter logged from here, with its stage, channel and delivery.", to: "plot.notices" },
      { name: "Invoices", how: "Only posted charge invoices count; post the drafts there.", to: "inv.out" },
      { name: "Overview", how: "Record a payment when the owner pays.", to: "plot.dash" },
      { name: "Buildings", how: "Letters quote the officer names, legal references and payment instructions set on the building.", to: "plot.buildings" }
    ],
    mistakes: [
      ["Nobody is in arrears", "Not an error: no posted invoice of this building is past its due date with money owing. If you expected someone, check the invoices are posted and have a due date."],
      ["An owner who has not paid is missing", "Their invoice is still a draft, is not yet past its due date, has no due date, or is covered by a credit note. Post the drafts in Accounting."],
      ["No buildings yet", "There is no active building. Add one in Buildings."],
      ["Last sent counts a notice sent for another unit", "Notices are counted per owner in the building, not per unit, so an owner with two units shows the same Last sent on both rows."]
    ],
    tips: [
      "Months ignores the day of the month, so an invoice due on the 31st becomes a month late on the 1st of the next month.",
      "The suggested stage is only a suggestion: change Stage in the notice window before printing."
    ]
  },

  "plot.expenses": {
    title: "Expenses",
    what: "<b>Expenses</b> shows what one building spends: every supplier bill tagged to that building in Accounting. A building has no separate expense book; a bill becomes a building expense when its <b>Building</b> field is set, and its <b>Building cost type</b> decides which budget line it counts against.",
    when: [
      "You want to see what a building has spent, and what it still owes suppliers.",
      "A supplier's invoice for the building arrives and needs entering.",
      "The Annual budget or a report looks empty, and you want to check that bills are tagged."
    ],
    how: [
      "Open <b>Plot &rsaquo; Money &rsaquo; Expenses</b> and pick <b>Cedar Court</b> in <b>Building</b>. For this example, the fuel supplier has invoiced 450.00 of diesel for the generator.",
      "Click <span class='man-key'>New bill</span>. The Bills screen in Accounting opens; start a new bill there.",
      "Pick the fuel supplier in <b>Vendor</b>, type their invoice number in <b>Reference</b> and add a line of 450.00 for diesel.",
      "Set <b>Building</b> to Cedar Court and <b>Building cost type</b> to Generator. Leave <b>Block</b> empty, since the generator serves the whole building.",
      "Click <span class='man-key'>Confirm &amp; post</span>.",
      "Go back to <b>Plot &rsaquo; Money &rsaquo; Expenses</b>. You should see the bill with its reference, the supplier, the date, Amount 450.00 and Status <b>Due</b>, and <b>Spent 450.00 &middot; still due 450.00</b> at the top.",
      "When the bill is paid in Accounting with <span class='man-key'>Register Payment</span>, the row shows <b>Paid</b> and still due drops to 0.00.",
      "Open the Annual budget: the 450.00 counts against the Generator line."
    ],
    fields: [
      ["Building", "Which building's bills to list. The choice is remembered for the other Plot screens.", "optional"],
      ["Ref, Supplier, Date, Block, Amount", "Read only, from each bill: its reference (or its number when there is none), vendor, bill date, the Block typed on the bill, and its total.", "auto"],
      ["Status", "Read only: <b>Paid</b> when nothing is left to pay on the bill, otherwise <b>Due</b>.", "auto"],
      ["Spent and still due", "Read only: the total of every bill tagged to the building, drafts included, and what is left to pay on them.", "auto"],
      ["Building (on the bill)", "Shown on bills once the company has a building. Puts the bill in that building's expenses, budget and reports.", "optional"],
      ["Building cost type (on the bill)", "Concierge, Electricity, Generator and the other charge categories. Decides which Annual budget line the bill counts against, and its category in Expenses by category. A bill without one counts as Other.", "optional"],
      ["Block (on the bill)", "Only when the cost belongs to one block. Leave it blank for a whole-building cost. It is shown in this list.", "optional"]
    ],
    buttons: [
      ["New bill", "Opens Accounting &rsaquo; Bills, where the bill is entered and tagged to the building."]
    ],
    after: "Expenses only reads. The bill itself, once posted in Accounting, records the cost and what is owed to the supplier. Tagged bills feed the Overview's Payables due and Fund balance (what has been paid on them), the give-back check, the Annual budget's actuals, the Committee view and the building reports.",
    links: [
      { name: "Bills", how: "Where building expenses are entered, tagged, posted and paid.", to: "inv.in" },
      { name: "Annual budget", how: "Tagged bills are the actual spend against each budget line.", to: "plot.budget" },
      { name: "Suppliers", how: "The vendors the building buys from.", to: "vend" },
      { name: "Committee view", how: "Shows where the money went by cost type.", to: "plot.committee" }
    ],
    mistakes: [
      ["No expenses for this building", "No bill has this building in its Building field. Open the bills in Accounting and set Building on each."],
      ["No buildings yet", "There is no active building. Add one in Buildings."],
      ["The Building field is missing on the bill", "It only appears once the company has at least one active building."],
      ["Clicking a row does nothing", "The rows here are a summary. Open the bill from Accounting &rsaquo; Bills, searching by its reference."],
      ["Spent includes a bill you have not posted", "This list counts draft bills too. Post or delete the draft in Accounting."]
    ],
    tips: [
      "Always set Building cost type as well as Building. Without it the spend lands in Other and the budget line stays at zero.",
      "Tagging charge invoices is done for you by the billing run; only supplier bills need tagging by hand."
    ]
  },

  "plot.budget": {
    title: "Annual budget",
    what: "The <b>Annual budget</b> sets out what a building plans to spend in a year, line by line, and sets each line against what was actually spent. The actual figures come from supplier bills tagged to the building and dated in that year, matched to lines by their cost type. Approving the budget locks its lines until you reopen it.",
    when: [
      "Before the general assembly, to prepare the year's budget for approval.",
      "After the assembly votes it, to lock it.",
      "During the year, to see which costs are running over.",
      "At the end of the year, to start next year's budget."
    ],
    how: [
      "Open <b>Plot &rsaquo; Money &rsaquo; Annual budget</b> with Cedar Court as the building. With no budget you see <b>No budget yet</b>. Click <span class='man-key'>Start a 2026 budget</span>.",
      "Click <span class='man-key'>Fill from charges</span>. You should see <i>3 line(s) added from charges</i>: Concierge 7,200.00, Insurance 2,400.00 and Lift maintenance contract 4,800.00, each charge's monthly amount times 12.",
      "Click <span class='man-key'>Add line</span>. Type <i>Generator diesel</i> in <b>Label</b>, choose <b>Category</b> Generator and type 5400.00 in <b>Amount for the year</b>. Click <span class='man-key'>Save</span>.",
      "Check the cards: <b>Budgeted 2026</b> 19,800.00.",
      "After the assembly approves it, click <span class='man-key'>Approve budget</span>. You should see <i>Budget approved and locked</i>, an <b>approved</b> badge, and the Edit and remove buttons disappear from the lines.",
      "A generator bill of 450.00 is tagged to Cedar Court with cost type Generator. The Generator diesel line now shows Actual 450.00, Left 4,950.00 and Used <b>8%</b>, and the <b>Actually spent</b> card 450.00.",
      "A plumber's bill of 300.00 tagged with cost type Maintenance appears as an <i>Unbudgeted spend</i> row under Maintenance, with Left -300.00, because no line has that category.",
      "In December, click <span class='man-key'>+ 2027</span> to start next year's budget. The year picker then switches between 2026 and 2027."
    ],
    fields: [
      ["Building", "Which building's budgets to show.", "optional"],
      ["Year", "The picker next to the building: which of the building's budgets you are looking at.", "optional"],
      ["Label (budget line)", "What the line is for, for example <i>Lift maintenance contract</i>. Fill from charges uses it to avoid adding a charge twice.", "required"],
      ["Category (budget line)", "The cost type. Bills tagged to the building with the same Building cost type count against this line.", "auto"],
      ["Amount for the year (budget line)", "The year's planned spend for the line.", "optional"],
      ["Budgeted, Actually spent, Used", "Read only: the total of the lines, the total of bills tagged to the building and dated in the year, and the second as a percentage of the first.", "auto"],
      ["Actual, Left, Used (on a line)", "Read only: spend on bills with the line's category in the year, the budget less that spend, and the percentage used, whose badge changes colour above 85% and again above 100%.", "auto"]
    ],
    buttons: [
      ["Start a (year) budget", "Shown when the building has no budget. Creates a draft budget for this year."],
      ["Fill from charges", "Adds a line for every active charge of the building whose name is not already a line: the charge's category, its name, and its monthly amount times 12. The reserve uplift is not included."],
      ["Add line", "Opens a blank budget line."],
      ["Edit", "On a line of a draft budget. Opens it to change the label, category or amount."],
      ["Remove (the cross on a line)", "On a line of a draft budget. After a confirmation, removes the line permanently."],
      ["+ (next year)", "Creates a draft budget for the year after the latest one."],
      ["Approve budget", "Marks the budget approved and locks its lines."],
      ["Reopen", "On an approved budget. Takes it back to draft so its lines can change."]
    ],
    after: "A budget changes nothing in the accounts: it is a plan to compare against. Its actual figures are read live from supplier bills tagged to the building, so a bill entered or corrected in Accounting shows here straight away.",
    links: [
      { name: "Charges", how: "Fill from charges turns the building's running costs into lines.", to: "plot.charges" },
      { name: "Expenses", how: "The tagged bills that make up the actual spend.", to: "plot.expenses" },
      { name: "Bills", how: "Set Building and Building cost type on a bill so it counts here.", to: "inv.in" },
      { name: "Meetings", how: "The general assembly that votes the budget.", to: "plot.meetings" }
    ],
    mistakes: [
      ["This budget is approved - reopen it first", "Lines cannot be added or filled while the budget is approved. Click Reopen, make the change, and approve it again."],
      ["There is already a (year) budget", "A building has one budget per year. Pick that year in the year picker."],
      ["This building has no charges to copy", "Fill from charges found no active charge. Add charges first, or add the lines by hand."],
      ["Every charge is already a budget line", "Each active charge already has a line with the same label."],
      ["Enter a label", "The budget line has no label."],
      ["Actual stays at 0.00 although bills were entered", "The bills are not tagged to this building, are dated in another year, or have a different Building cost type from the line. Correct the bill in Accounting."],
      ["No buildings yet", "There is no active building. Add one in Buildings."]
    ],
    tips: [
      "Actual counts every tagged bill dated in the year, drafts included, at its total with tax.",
      "Two lines with the same category each show the whole category's spend as their actual, so give each category one line.",
      "A tagged bill with no Building cost type counts under Other."
    ]
  },

  "plot.projects": {
    title: "Capital projects",
    what: "<b>Capital projects</b> are the bigger works a building plans or carries out, outside the running costs: a lift overhaul, a facade repaint, a new water tank. Each project holds its budget estimate, status and progress, the bids received from contractors and which one was awarded. A project marked public shows on the resident portal, so owners can follow it.",
    when: [
      "The committee decides to look into a major repair and wants to collect quotes.",
      "Contractors send their bids and one is to be chosen.",
      "Works start, and owners ask how far along they are."
    ],
    how: [
      "Open <b>Plot &rsaquo; Works &rsaquo; Capital projects</b> and click <span class='man-key'>New</span>. For this example: repainting the facade of Cedar Court.",
      "Type <i>Facade repaint</i> in <b>Title</b>, a short scope in <b>Description</b> and 24000.00 in <b>Budget estimate</b>. Set <b>Status</b> to Collecting bids.",
      "Set <b>Show to residents in the portal</b> to Public and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the project in the list with a <b>Public</b> badge.",
      "Open the project again. Under <b>Contractor bids</b>, pick the first painter in <b>(supplier)</b>, type 22500.00 in <b>Amount</b> and 45 in <b>Days</b>, and click <span class='man-key'>Add bid</span>. Add two more: 26000.00 in 30 days and 19800.00 in 60 days.",
      "The bids are listed from the cheapest up, each with the status <b>received</b>.",
      "The committee chooses the 22,500.00 bid. Click <span class='man-key'>Award</span> on its row. You should see <i>Awarded</i>: that bid shows <b>awarded</b>, the other two <b>rejected</b>, and <b>Status</b>, <b>Awarded to</b> and <b>Awarded amount</b> in the form change to Awarded, the painter and 22500.",
      "Click <span class='man-key'>Save</span>. The project keeps the painter as Awarded to.",
      "When the painters start, set <b>Status</b> to In progress, fill in <b>Start</b> and <b>End</b>, and raise <b>Progress %</b> as the work goes on. Owners see the status, budget and progress bar under <b>Works in the building</b> on their portal."
    ],
    fields: [
      ["Building", "The building the works are for.", "required"],
      ["Status", "Idea, Collecting bids, Awarded, In progress, Done or Cancelled. Used to group the list and shown on the portal.", "auto"],
      ["Title", "The name of the works, shown in the list and on the portal.", "required"],
      ["Description", "What the works involve.", "optional"],
      ["Budget estimate", "What the committee expects the works to cost. Shown in the list and on the portal.", "optional"],
      ["Progress %", "How far along the works are, from 0 to 100. Shown in the list and as a bar on the portal.", "optional"],
      ["Awarded to", "The contractor chosen. Only contacts marked as vendors are listed. Award fills it for you.", "optional"],
      ["Awarded amount", "The price agreed with the contractor. Award fills it with the bid amount.", "optional"],
      ["Start and End", "When the works run.", "optional"],
      ["Show to residents in the portal", "<b>Private</b> keeps the project to the committee. <b>Public</b> shows its title, status, budget estimate and progress to the building's owners on the portal.", "auto"],
      ["Supplier, Amount, Days (a bid)", "Appear once the project is saved. The bidding contractor (vendors only), their price and how many days they need. The amount is needed.", "required"]
    ],
    buttons: [
      ["New", "Opens a blank project."],
      ["Save", "Saves the project."],
      ["Delete", "On an existing project. Moves it to the Archive, from where it can be restored."],
      ["Add bid", "Adds the bid typed in the row below the bids, with the status received."],
      ["Award", "On a bid. Marks every other bid of the project rejected and this one awarded, and saves the project as Awarded with that contractor and amount."],
      ["Remove (the cross on a bid)", "Moves the bid to the Archive straight away, with no question asked."],
      ["Group By", "Group the list by Status or Building."],
      ["Search, Select, Columns, Export", "Search by title or description; select rows to export or delete; choose columns; download a CSV."]
    ],
    after: "A project and its bids are records for the committee and, when public, for residents. Nothing is posted to the accounts: the contractor's invoices are entered as bills tagged to the building, and a large levy to pay for the works is raised with Special assessment on the Overview.",
    links: [
      { name: "Suppliers", how: "Contractors must be vendor contacts to bid or be awarded.", to: "vend" },
      { name: "Overview", how: "Special assessment raises the money for the works from the owners.", to: "plot.dash" },
      { name: "Bills", how: "The contractor's invoices, tagged to the building.", to: "inv.in" },
      { name: "Meetings", how: "Put the choice of contractor to a vote as a motion.", to: "plot.meetings" },
      { name: "Archive", how: "Deleted projects and removed bids can be restored there.", to: "plot.archive" }
    ],
    mistakes: [
      ["Add a building first", "A project belongs to a building. Add one in Buildings."],
      ["Enter a title", "The project has no title."],
      ["Enter the bid amount", "A bid needs an amount above zero."],
      ["The contractor is not in the Awarded to or supplier list", "Only vendor contacts are listed. Mark the contact as a vendor in Suppliers."]
    ]
  },

  "plot.tasks": {
    title: "Tasks",
    what: "<b>Tasks</b> are what the committee has agreed to get done for a building, who is doing it and by when. You can add them by hand, and Orbit also creates them: every line of a meeting's decisions becomes a task when the minutes are posted, and accepting a suggestion can create one. A task can repeat, so routine jobs roll forward each time they are done.",
    when: [
      "A decision needs following up, such as getting quotes or fixing a door.",
      "A routine job comes round every week, month, quarter or year, such as servicing the water pump.",
      "Before a meeting, to see what is still open and who is late."
    ],
    how: [
      "Open <b>Plot &rsaquo; Works &rsaquo; Tasks</b> and click <span class='man-key'>New</span>. For this example: the water pump at Cedar Court is serviced every month.",
      "Type <i>Service the water pump</i> in <b>Task</b> and a note in <b>Details</b>. Leave <b>Status</b> on To do and set <b>Priority</b> to High.",
      "Set <b>Due</b> to 2026-09-15.",
      "Pick the concierge in <b>Who is doing it</b>, and type their name in <b>Name</b> as well, so it shows in the list.",
      "Choose <b>Repeat</b> Monthly and click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and the task in the list with Status <b>todo</b>, Priority high and Due 2026-09-15.",
      "When the pump has been serviced, open the task, set <b>Status</b> to Done and click <span class='man-key'>Save</span>.",
      "You should see <i>Done - rolled forward to 2026-10-15</i>. The task stays in the list as <b>todo</b> with the new due date, ready for next month.",
      "Click <span class='man-key'>Filters</span> and choose Open to see only what is not done."
    ],
    fields: [
      ["Building", "The building the task is for.", "required"],
      ["Status", "To do, Doing or Done. Used by the filters and to group the list.", "auto"],
      ["Task", "What needs doing, in a few words.", "required"],
      ["Details", "Anything the person doing it needs to know.", "optional"],
      ["Priority", "Low, Medium or High. Shown in the list.", "auto"],
      ["Due", "When it should be done. For a repeating task, the date the next one is counted from.", "optional"],
      ["Who is doing it", "Picks from the people in Committee and roles who are linked to a contact.", "optional"],
      ["Name", "The name shown in the list's Owner column. Type it for someone outside the committee, or alongside the pick above.", "optional"],
      ["Repeat", "Does not repeat, Weekly, Monthly, Quarterly or Yearly. A repeating task saved as Done is put back to To do with its due date moved on by that interval, from its due date or from today when it has none.", "optional"],
      ["Remind by email", "An email address kept on the task for reminders.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank task."],
      ["Save", "Saves the task, or rolls a repeating task forward when it is saved as Done."],
      ["Delete", "On an existing task. Moves it to the Archive, from where it can be restored."],
      ["Filters", "Open shows tasks that are not done; Done shows the finished ones."],
      ["Group By", "Group the list by Status."],
      ["Search, Select, Columns, Export", "Search by task or name; select rows to export or delete; choose columns; download a CSV."]
    ],
    after: "Tasks are records for the committee and post nothing. Creating or changing one is written to the Activity log. A task created from a meeting or a suggestion keeps a link to where it came from.",
    links: [
      { name: "Meetings", how: "Posting the minutes turns each line of Decisions / minutes into a task.", to: "plot.meetings" },
      { name: "Suggestions", how: "Accepting a suggestion can create a task from it.", to: "plot.suggestions" },
      { name: "Committee and roles", how: "The people offered in Who is doing it.", to: "plot.members" },
      { name: "Today's round", how: "For the concierge's daily jobs, which are signed off rather than tracked as tasks.", to: "plot.concierge" }
    ],
    mistakes: [
      ["Add a building first", "A task belongs to a building. Add one in Buildings."],
      ["Enter the task", "The Task field is empty."],
      ["The Owner column is blank although someone was picked", "The column shows the Name field. Type the person's name in Name too."],
      ["Who is doing it offers nobody", "Nobody in Committee and roles is linked to a contact. Link them there, or type a name in Name."],
      ["A repeating task disappeared into Done", "It was created with Status Done. Roll-forward only happens when an existing repeating task is saved as Done; set it back to To do with the right due date."]
    ]
  },

  "plot.concierge": {
    title: "Today's round",
    what: "<b>Today's round</b> is the screen for whoever does the rounds of a building, usually the concierge, on a phone or tablet. It lists the building's checklist with a big <span class='man-key'>Mark done</span> button for each job. Signing one off records who did it and when, with a photo where the committee asked for one, and the job shows as Done for the rest of the day.",
    when: [
      "Every day, as the concierge works through the building's jobs.",
      "A committee member wants to see, at a glance, what has been done today."
    ],
    how: [
      "Open <b>Plot &rsaquo; Works &rsaquo; Today's round</b>. For this example, Cedar Court's checklist has <i>Bins out</i>, <i>Lobby cleaned</i> and <i>Generator checked</i>, and the generator check needs a photo.",
      "You should see <i>3 job(s) left today.</i> and a card for each job; the generator card says <b>Photo required</b>.",
      "Tap <span class='man-key'>Mark done</span> on <b>Bins out</b>. The window says <i>Recording Bins out as done today.</i> <b>Who did it</b> shows your sign-in email; type the concierge's name instead if they share the device.",
      "Tap <span class='man-key'>Save</span>. You should see <i>Recorded</i>, the card shows <b>Done</b> and the note reads <i>2 job(s) left today.</i>",
      "Tap <span class='man-key'>Mark done</span> on <b>Generator checked</b>. Type <i>Oil level fine</i> in <b>Note</b>.",
      "Under <b>Photo (required)</b>, tap <span class='man-key'>Add</span> and take a photo of the generator panel. A thumbnail appears.",
      "Tap <span class='man-key'>Save</span>. The button reads <b>Saving...</b>, then you should see <i>Recorded</i>.",
      "When the last job is done, the note reads <i>Everything on today's list is done. Thank you.</i>"
    ],
    fields: [
      ["Building", "Shown only when the company has more than one building. Which building's round to show.", "optional"],
      ["Who did it", "The person signing the job off. Fills with the email you signed in with.", "auto"],
      ["Note", "Anything worth recording, such as a fault noticed.", "optional"],
      ["Photo", "The photo of the job. Needed when the checklist item requires a photo, otherwise optional. Images are compressed automatically.", "optional"]
    ],
    buttons: [
      ["Mark done", "On each job not yet done today. Opens the sign-off window."],
      ["Add", "In the sign-off window. Takes or picks a photo; the cross on a thumbnail removes it before saving."],
      ["Save", "Records the check-in for today, uploads the photo and marks the job Done."],
      ["Cancel", "Closes the sign-off window without recording anything."]
    ],
    after: "Each sign-off adds a dated line to the Check-in log with the job, the building, who did it and the note, stores the photo with it, and is written to the Activity log. The job counts as done for today's date only; tomorrow it appears again.",
    links: [
      { name: "Checklist", how: "Where the committee sets the jobs, their order and which need a photo.", to: "plot.checklist" },
      { name: "Check-in log", how: "The dated record of every sign-off.", to: "plot.checkins" },
      { name: "Tasks", how: "For one-off jobs and repairs rather than the daily round.", to: "plot.tasks" }
    ],
    mistakes: [
      ["This item needs a photo before it can be signed off", "The job requires a photo and none was added. Tap Add, take the photo, then Save."],
      ["Could not record: (message)", "The check-in could not be saved, for example because the connection dropped or the account has read-only access. Try again once connected."],
      ["Upload failed: (message)", "The photo could not be uploaded. Check the connection and add it again."],
      ["Nothing on the list", "The committee has not set up a checklist for this building yet, or every item is switched off. Add items in Checklist."],
      ["No buildings yet", "There is no active building. Add one in Buildings."]
    ],
    tips: [
      "Jobs appear in the order set by Order on the checklist."
    ]
  },

  "plot.checklist": {
    title: "Checklist",
    what: "The <b>Checklist</b> is the list of routine jobs the concierge signs off each day for a building: bins out, lobby cleaned, generator checked. Each item can require a photo as proof. The items set here are what Today's round shows.",
    when: [
      "You set up the concierge's daily jobs for a building.",
      "A job is added, dropped or needs a photo from now on.",
      "You want to change the order the jobs appear in."
    ],
    how: [
      "Open <b>Plot &rsaquo; Works &rsaquo; Checklist</b> and click <span class='man-key'>New</span>. For this example, Cedar Court's concierge starts the day with the bins.",
      "Leave <b>Building</b> on Cedar Court, type <i>Bins out</i> in <b>Item</b>, leave <b>Requires a photo</b> on No and type 1 in <b>Order</b>. Click <span class='man-key'>Save</span>. You should see <i>Saved</i>.",
      "Add <i>Lobby cleaned</i> with Order 2.",
      "Add <i>Generator checked</i> with <b>Requires a photo</b> Yes and Order 3.",
      "You should see the three items in order, with a <b>Photo</b> badge on the generator check and <b>Active</b> on all three.",
      "Open <b>Today's round</b>: the three jobs appear in the same order, with Photo required under the generator check."
    ],
    fields: [
      ["Building", "The building the job belongs to.", "required"],
      ["Item", "The job, as the concierge should read it.", "required"],
      ["Requires a photo", "Yes means the job cannot be signed off without a photo.", "auto"],
      ["Order", "Where the job appears; lower numbers come first.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank checklist item."],
      ["Save", "Saves the item."],
      ["Delete", "On an existing item. Moves it to the Archive, from where it can be restored."],
      ["Mark done", "In the Today column. Opens the same sign-off window as Today's round."],
      ["Select", "Tick items to Export selected, Archive them (they show Off and leave Today's round), or Delete them permanently."],
      ["Search, Columns, Export", "Search by item; choose columns; download a CSV."]
    ],
    after: "Active items appear on Today's round for their building. Each sign-off is added to the Check-in log.",
    links: [
      { name: "Today's round", how: "The concierge's screen built from these items.", to: "plot.concierge" },
      { name: "Check-in log", how: "Every sign-off of these items.", to: "plot.checkins" },
      { name: "Archive", how: "Deleted items can be restored there.", to: "plot.archive" }
    ],
    mistakes: [
      ["Add a building first", "An item belongs to a building. Add one in Buildings."],
      ["Enter the item", "The Item field is empty."],
      ["The Today column offers Mark done for a job already done today", "This list always shows the button. Use Today's round, which shows Done for jobs signed off today, so a job is not recorded twice."],
      ["An item does not appear on Today's round", "It is switched off (Active shows Off), deleted, or belongs to another building."]
    ]
  },

  "plot.checkins": {
    title: "Check-in log",
    what: "The <b>Check-in log</b> is the dated record of the daily round: every checklist job signed off, when, in which building and by whom. It is what you show an owner who asks whether something was actually done. It is a record, so lines are added from Today's round or the Checklist and are not edited here.",
    when: [
      "An owner or the committee asks whether a job was done on a given day.",
      "You want to check the concierge's round over a week or a month."
    ],
    how: [
      "Open <b>Plot &rsaquo; Works &rsaquo; Check-in log</b>. For this example, you check whether the Cedar Court generator was checked last week.",
      "Click <span class='man-key'>Group By</span> and choose Day. The latest days come with their check-ins under them.",
      "Type <i>Generator</i> in the search box. You should see one line per day the job was signed off, with <b>When</b> showing the date and time and <b>By</b> the person who signed it off.",
      "A day with no line is a day the job was not signed off.",
      "Click <span class='man-key'>Export</span> to download the lines as a CSV file for the committee."
    ],
    fields: [
      ["When", "Read only: the date and time of the sign-off.", "auto"],
      ["Item", "Read only: the checklist job signed off.", "auto"],
      ["Building", "Read only: the building of the job.", "auto"],
      ["By", "Read only: the name typed in Who did it.", "auto"],
      ["Photo", "Read only: a small picture of the photo taken when the job was signed off. Click it to open the full photo in a new tab. A dash when no photo was taken.", "auto"]
    ],
    buttons: [
      ["Group By", "Group the lines by Day."],
      ["Search", "Find lines by job or by the person who did them."],
      ["Select", "Tick lines to Export selected, or Delete them permanently."],
      ["Columns and Export", "Choose columns; download the list as a CSV file."]
    ],
    after: "The log only reads. It shows the latest 400 check-ins across your buildings.",
    links: [
      { name: "Today's round", how: "Where the concierge signs jobs off.", to: "plot.concierge" },
      { name: "Checklist", how: "The jobs being signed off.", to: "plot.checklist" },
      { name: "Activity log", how: "Also records each sign-off, with everything else that changed.", to: "plot.activity" }
    ],
    mistakes: [
      ["Check-ins are a record; they are logged from the building, not edited here.", "Shown when you click a line. Lines cannot be changed; sign a job off again from Today's round if needed."],
      ["The Photo column shows a dash although a photo was taken", "The photo did not finish uploading when the job was signed off, for example because the connection dropped. Sign the job off again from Today's round and add the photo."]
    ]
  },

  "plot.meetings": {
    title: "Meetings",
    what: "A <b>meeting</b> holds everything about a committee meeting or a general assembly of owners: when and where, when notice was given, who came, the agenda, and the decisions. Inside it you add agenda items and <b>motions</b>; owners vote on open motions from the resident portal, each vote weighted by their shares, and the meeting shows the live tally with quorum. Posting the minutes locks them, turns each decision line into a task and turns carried motions into resolutions.",
    when: [
      "You call a general assembly and need to record the notice given.",
      "Owners are to vote on a budget, a contractor or a rule.",
      "After a meeting, to write up and lock the minutes and follow up the decisions."
    ],
    how: [
      "Open <b>Plot &rsaquo; Governance &rsaquo; Meetings</b> and click <span class='man-key'>New</span>. Pick Cedar Court, choose <b>Kind</b> General assembly and type <i>Annual general assembly 2026</i> in <b>Title</b>. Set <b>Date</b> to 2026-10-20 and <b>Location</b> to <i>Lobby</i>.",
      "Set <b>Notice given on</b> to 2026-10-05. You should see <i>15 days' notice given.</i> Click <span class='man-key'>Save</span>.",
      "Open the meeting again. Under <b>Agenda &amp; motions</b>, choose <b>Motion (vote)</b>, type <i>Approve the 2027 budget</i>, leave Simple majority and click <span class='man-key'>Add</span>. The note below reads <i>Total voting weight in this building: 1000.</i>",
      "Click <span class='man-key'>Pull open suggestions</span>. You should see <i>1 suggestion(s) added to the agenda</i>: an owner's suggestion becomes a motion.",
      "Owners vote on the portal. When S1 (120), 1A (200) and 2A (200) vote For and 1B (200) votes Against, the budget motion shows <b>For 520.00 &middot; Against 200.00 &middot; Abstain 0.00</b>, <i>(4 owner(s), 72% of shares cast)</i>, <b>Quorum met</b> and <b>Would carry</b>.",
      "After the vote closes at the meeting, click <span class='man-key'>Record as carried</span>. You should see <i>Carried - a resolution was recorded</i>, and the motion shows <b>carried</b>.",
      "Type the attendees in <b>Attendees</b>, and in <b>Decisions / minutes</b> type one decision per line, for example <i>- Repaint the facade in spring</i> and <i>- Get three quotes for the water tank</i>.",
      "Set <b>Status</b> to Posted (locked) and click <span class='man-key'>Save</span>. You should see <i>Minutes posted and locked</i>, and Tasks now has the two decisions as tasks.",
      "Open the meeting: Save is greyed out, and <span class='man-key'>Print minutes</span> opens the minutes to print with Chair and Secretary signature lines."
    ],
    fields: [
      ["Building", "The building the meeting is for. Its units set the voting weight.", "required"],
      ["Kind", "Committee, General assembly or Extraordinary. The notice check applies to general and extraordinary meetings.", "auto"],
      ["Title", "The meeting's name, shown in the list, on the portal next to its motions and at the top of the printed minutes.", "required"],
      ["Date and Location", "When and where. Printed on the minutes.", "optional"],
      ["Notice given on", "The day owners were notified. With a date, Orbit shows how many days' notice that was, and warns when a general or extraordinary meeting had fewer than 10.", "optional"],
      ["Session", "First call or Second call. A second call is noted on the printed minutes.", "auto"],
      ["Attendees", "Who was present, printed under Present.", "optional"],
      ["Agenda", "The agenda as text, printed under Agenda.", "optional"],
      ["Decisions / minutes", "What was decided. When the minutes are posted, each line longer than three characters becomes a task; a leading dash or star is removed. Posting again after Unlock adds a task only for a line that has none yet, so tasks are never doubled, and a task you deleted is not made again.", "optional"],
      ["Status", "Draft, or Posted (locked). Posting locks the meeting.", "auto"],
      ["Attachments / Signed minutes &amp; attachments", "Photos or PDFs of the notice, attendance sheet or signed minutes.", "optional"],
      ["Item type, Title and majority (Agenda &amp; motions)", "Shown once the meeting is saved. Agenda item, Motion (vote) or Action; its title; and for a motion the rule it needs: For information, Simple majority, Two thirds or Unanimous.", "required"]
    ],
    buttons: [
      ["New", "Opens a blank meeting."],
      ["Save", "Saves the meeting. Saved as Posted, it locks the minutes, creates the tasks and records carried motions as resolutions."],
      ["Delete", "On an existing meeting. Moves it to the Archive, from where it can be restored."],
      ["Add", "Adds the item typed in Agenda &amp; motions, as open."],
      ["Pull open suggestions", "Adds every new or reviewing suggestion of the building as a simple-majority motion, and sets those suggestions to reviewing."],
      ["Record as carried", "On an open motion. Marks it carried and records a passed resolution with its title and description."],
      ["Record as rejected", "On an open motion. Marks it rejected."],
      ["Remove (the cross on an item)", "Deletes the item and its votes after you confirm. It cannot be restored."],
      ["Print minutes", "On a posted meeting. Opens the minutes to print."],
      ["Unlock", "On a posted meeting. Takes it back to draft so it can be changed."]
    ],
    after: "An open motion appears on the resident portal of every owner of the building, who can vote For, Against or Abstain and change their vote while it is open. A vote weighs the owner's shares in that building, not counting units excluded from voting. The tally reads: <b>Quorum met</b> when the shares that voted are more than half the building's voting weight; a simple majority <b>would carry</b> when For is more than Against; two thirds when For is at least two thirds of For plus Against; unanimous when every share that voted, abstentions included, voted For. Posting the minutes creates one task per decision line and a resolution for each carried motion that does not have one yet. Creating, changing, posting and unlocking a meeting are written to the Activity log.",
    links: [
      { name: "Resolutions", how: "Carried motions become the building's standing resolutions.", to: "plot.resolutions" },
      { name: "Tasks", how: "Each decision line becomes a task when the minutes are posted.", to: "plot.tasks" },
      { name: "Suggestions", how: "Pull open suggestions puts residents' ideas on the agenda.", to: "plot.suggestions" },
      { name: "Units", how: "Shares and Excluded from voting decide each owner's voting weight.", to: "plot.units" },
      { name: "Resident portal access", how: "Owners need portal access to vote.", to: "portal.admin" },
      { name: "Documents", how: "Keep the signed minutes in the building's library too.", to: "plot.docs" }
    ],
    mistakes: [
      ["Add a building first", "A meeting belongs to a building. Add one in Buildings."],
      ["Enter a title", "The Title field is empty."],
      ["Only (n) day(s) between the notice and the meeting. A general assembly normally needs at least 10 days, or its decisions can be challenged.", "A warning, not a block. Move the meeting date, or record the notice date correctly."],
      ["Save the meeting first, then add its agenda items and motions.", "Shown on a new meeting. Save it, open it again, and the Agenda &amp; motions section appears."],
      ["No open suggestions to bring in / They are already on the agenda", "The building has no new or reviewing suggestions, or they were already pulled into this meeting."],
      ["An owner sees Could not record your vote: closed", "The motion is no longer open because it was recorded as carried or rejected."],
      ["An owner sees Could not record your vote: not an owner here", "Their contact is not linked to a unit of this building in Owners."],
      ["Tasks appear twice", "The minutes were unlocked and posted again, and each posting creates the tasks. Delete the duplicates in Tasks."]
    ],
    tips: [
      "Items of type Action are kept on the agenda only; tasks are made from the lines of Decisions / minutes.",
      "Motions stay open to votes until you record them as carried or rejected, even after the meeting is posted."
    ]
  },

  "plot.resolutions": {
    title: "Resolutions",
    what: "<b>Resolutions</b> are a building's binding decisions and standing rules, usually voted at a general assembly: approving a budget, choosing a contractor, a house rule about the lift. Keeping them in one list means the committee can always show what was decided and when. A motion recorded as carried in a meeting is added here for you.",
    when: [
      "A motion is carried at a meeting and you want to add its wording or rule.",
      "You record decisions taken before the building was in Orbit.",
      "A new decision replaces an old rule, which should be marked superseded.",
      "An owner disputes a rule and you need to show when it was passed."
    ],
    how: [
      "Open <b>Plot &rsaquo; Governance &rsaquo; Resolutions</b>. For this example, the Cedar Court assembly has carried a motion <i>Lift use for moving furniture</i>, which is already listed with Status <b>passed</b> and today's date.",
      "Click it. <b>Building</b> and <b>Title</b> are filled in from the motion.",
      "In <b>Text</b>, type the wording the assembly approved.",
      "In <b>Standing rule (optional)</b>, type the rule itself: <i>Furniture may only be moved in the lift between 09:00 and 18:00, with the lift protected.</i>",
      "Check <b>Decided on</b> is the date of the assembly and click <span class='man-key'>Save</span>. You should see <i>Saved</i>.",
      "An older resolution allowed moves at any time. Open it, set <b>Status</b> to Superseded and save. The list now shows which rule is in force."
    ],
    fields: [
      ["Building", "The building the decision applies to.", "required"],
      ["Title", "A short name for the decision.", "required"],
      ["Text", "The wording that was approved. Filled from the motion's description when a motion is carried.", "optional"],
      ["Standing rule (optional)", "A durable rule this resolution sets, written so anyone can apply it.", "optional"],
      ["Status", "Proposed, Passed, Rejected or Superseded. A new resolution starts as Passed.", "auto"],
      ["Decided on", "The date of the decision. The list is sorted by it, newest first.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank resolution."],
      ["Save", "Saves the resolution."],
      ["Delete", "On an existing resolution. Moves it to the Archive, from where it can be restored."],
      ["Search, Select, Columns, Export", "Search by title or building; select rows to export or delete; choose columns; download a CSV."]
    ],
    after: "A resolution is a record and posts nothing. One created from a meeting stays linked to that meeting.",
    links: [
      { name: "Meetings", how: "Record as carried, or posting the minutes, adds carried motions here.", to: "plot.meetings" },
      { name: "Documents", how: "Keep the signed minutes that prove the decision.", to: "plot.docs" },
      { name: "Archive", how: "Deleted resolutions can be restored there.", to: "plot.archive" }
    ],
    mistakes: [
      ["Add a building first", "A resolution belongs to a building. Add one in Buildings."],
      ["Enter a title", "The Title field is empty."],
      ["The same resolution appears twice", "It was added by hand and also created when the motion was recorded as carried. Delete one of them."]
    ]
  },

  "plot.notices": {
    title: "Notices",
    what: "<b>Notices</b> (the screen heading reads Overdue notices) is the record of the letters sent to owners who are behind with their charges: a reminder, a warning, then a formal notice. Each record keeps the stage, the date, the amount, how it was delivered and whether it arrived, so there is a clear trail if the matter goes legal. From the same window you print the letter itself, in English, Arabic or both, with the schedule of unpaid charges behind the figure.",
    when: [
      "An owner is late and you send a letter. The quickest start is the Notice button on Arrears, which fills everything in.",
      "You deliver a letter and want to record that it arrived.",
      "A lawyer or notary asks what the owner was sent and when."
    ],
    how: [
      "Open <b>Plot &rsaquo; Governance &rsaquo; Notices</b> and click <span class='man-key'>New</span>. For this example, the owner of flat 2B at Cedar Court owes 924.00 over three months and has already had a reminder and a warning.",
      "Leave <b>Building</b> on Cedar Court, pick <b>2B</b> in <b>Unit</b> and the owner in <b>Owner (contact)</b>.",
      "Choose <b>Stage</b> 3 - Formal notice, leave <b>Date</b> on today, type 924.00 in <b>Amount overdue</b> and 3 in <b>Months overdue</b>.",
      "Choose <b>Channel</b> Post and leave <b>Delivered?</b> on Not yet.",
      "In the language box next to <span class='man-key'>Print letter</span>, choose Both languages, then click <span class='man-key'>Print letter</span>.",
      "You should see the <b>Formal notice of arrears</b> open to print: the Arabic letter first and the English on the next page, each with the amount in figures and in words, the months overdue, the schedule of unpaid charges with its total, How to pay, the building's references and the committee head's and treasurer's signature lines.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a row with Stage <b>Formal</b>, Amount 924.00 and Delivered <b>No</b>.",
      "When the post office confirms delivery, open the notice, set <b>Delivered?</b> to Delivered and save."
    ],
    fields: [
      ["Building", "The building the charges are owed to. The letter's schedule only lists that building's invoices, and the language box starts on its Notice language.", "required"],
      ["Unit", "The unit the debt is for, printed under the owner's name. Lists the units of all your buildings.", "optional"],
      ["Owner (contact)", "The owner the letter is addressed to. The schedule lists their posted, unpaid charge invoices.", "required"],
      ["Stage", "1 - Reminder, 2 - Warning or 3 - Formal notice. Decides the letter's title and wording; a formal notice gives fifteen days to pay before legal action.", "auto"],
      ["Date", "The date of the notice. Today unless you change it.", "auto"],
      ["Amount overdue", "The figure the letter claims, printed in digits and in words.", "optional"],
      ["Months overdue", "Printed on the letter when filled in.", "optional"],
      ["Channel", "By hand, Email, Post or Notice board: how the letter was delivered.", "auto"],
      ["Delivered?", "Not yet or Delivered.", "auto"],
      ["Notes", "For example who received it, or a registered-post number.", "optional"],
      ["Language (next to Print letter)", "English, Arabic or Both languages. Starts on the building's Notice language.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank notice."],
      ["Print letter", "Prints the letter from what is on the form, saved or not."],
      ["Save", "Saves the notice record."],
      ["Delete", "On an existing notice. Moves it to the Archive, from where it can be restored."],
      ["Search, Select, Columns, Export", "Search by owner or unit; select rows to export or delete; choose columns; download a CSV."]
    ],
    after: "A notice is a record: it sends nothing and posts nothing. Its stage shows as Last sent on Arrears for that owner. The letter's schedule is read live from the owner's posted invoices that still have money owing, so it always matches the accounts at the moment you print.",
    links: [
      { name: "Arrears", how: "Who is late, with a Notice button that fills in this form.", to: "plot.arrears" },
      { name: "Buildings", how: "Committee head, treasurer, legal references, How owners pay, footer and Notice language used by the letter.", to: "plot.buildings" },
      { name: "Invoices", how: "The posted charge invoices listed on the schedule.", to: "inv.out" },
      { name: "Documents", how: "Keep a scan of the signed letter or delivery receipt.", to: "plot.docs" }
    ],
    mistakes: [
      ["Pick a contact", "The notice has no owner. Pick one in Owner (contact)."],
      ["Could not save: (message)", "The database refused the notice, for example because no building is chosen. Add a building in Buildings, pick it and save again."],
      ["The amount on the letter is not the schedule's total", "The amount printed at the top is what you typed in Amount overdue, while the schedule adds up the owner's unpaid invoices today. Correct Amount overdue before printing; the Notice button on Arrears fills it with the late amount."],
      ["The letter has no schedule of unpaid charges", "The owner has no posted invoice with money owing in this building. Post the charge invoices first."],
      ["The letter has no signatures, references or payment instructions", "Fill in Committee head, Treasurer, Property number, Cadastral zone, Bylaws reference and How owners pay on the building."]
    ],
    tips: [
      "Print and save in the same visit, so the record matches the letter that went out."
    ]
  },

  "plot.suggestions": {
    title: "Suggestions",
    what: "<b>Suggestions</b> collects what owners and residents raise with the committee: ideas, complaints and requests. Owners can send them from the resident portal, and you can log ones that arrive by phone or in person. The committee reviews each, can put it to a meeting vote, and records a decision; accepting one can create a task so it actually gets done.",
    when: [
      "An owner raises something on the portal, or tells the concierge.",
      "Before a meeting, to put open suggestions on the agenda.",
      "The committee decides, and the owner should see the outcome."
    ],
    how: [
      "An owner at Cedar Court sends <i>Bike racks in the car park</i> from the portal. Open <b>Plot &rsaquo; Governance &rsaquo; Suggestions</b>: you should see it with <b>From</b> showing the owner's name and Status <b>new</b>. The Overview's <b>New suggestions</b> card also counts it.",
      "To log one yourself, click <span class='man-key'>New</span>, choose <b>Type</b> Complaint, pick the unit, type the resident's name in <b>From (name)</b>, a <b>Title</b> and <b>Details</b>, and save.",
      "In the meeting for the annual assembly, click <span class='man-key'>Pull open suggestions</span>. The bike racks become a motion and the suggestion moves to <b>reviewing</b>.",
      "After the assembly carries the motion, open the suggestion. Under <b>Committee decision</b>, type <i>Approved at the 2026 assembly</i> in <b>Decision note</b>.",
      "Pick the assembly in <b>Decided at meeting</b> and leave <b>Create a task when accepting</b> ticked.",
      "Click <span class='man-key'>Accept</span>. You should see <i>Accepted - a task was created</i>. The suggestion shows <b>accepted</b>, and Tasks has <i>Bike racks in the car park</i> as a new task.",
      "The owner sees the status <b>accepted</b> under <b>What you have raised</b> on the portal."
    ],
    fields: [
      ["Building", "The building the suggestion concerns.", "required"],
      ["Type", "Suggestion, Complaint or Request.", "auto"],
      ["Unit (optional)", "The unit it came from. Shown in From when no name is given.", "optional"],
      ["From (name)", "Who raised it. Filled with the owner's contact name when sent from the portal.", "optional"],
      ["Title", "The suggestion in a few words.", "required"],
      ["Details", "The full request.", "optional"],
      ["Status", "New, Reviewing, Accepted, Rejected or Done. Owners see it on the portal.", "auto"],
      ["Admin note", "An internal note for the committee.", "optional"],
      ["Decision note", "Shown on an existing suggestion. The committee's reasons. The portal shows the owner the status, not this note.", "optional"],
      ["Decided at meeting", "Shown on an existing suggestion. The building's meeting where it was decided.", "optional"],
      ["Create a task when accepting", "Ticked unless you untick it. Accept then creates a To do task with the suggestion's title and details.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank suggestion."],
      ["Save", "Saves every field of the form."],
      ["Accept", "Saves the decision only: status accepted, the decision note, the meeting and today's date, and creates a task when the box is ticked."],
      ["Reject", "Saves the decision only, with status rejected."],
      ["Delete", "On an existing suggestion. Moves it to the Archive, from where it can be restored."],
      ["Filters", "Open shows new and reviewing; Closed shows accepted, rejected and done."],
      ["Search, Select, Columns, Export", "Search by title or building; select rows to export or delete; choose columns; download a CSV."]
    ],
    after: "A suggestion posts nothing. Creating, changing and deciding one are written to the Activity log. Accept with the box ticked adds a task linked to the suggestion and the meeting. The owner who sent it from the portal sees its status there.",
    links: [
      { name: "Meetings", how: "Pull open suggestions turns them into motions to vote on.", to: "plot.meetings" },
      { name: "Tasks", how: "Accepting can create a task to carry the suggestion out.", to: "plot.tasks" },
      { name: "Resident portal access", how: "Owners need portal access to send suggestions.", to: "portal.admin" },
      { name: "Overview", how: "The New suggestions card counts those still new.", to: "plot.dash" }
    ],
    mistakes: [
      ["Add a building first", "A suggestion belongs to a building. Add one in Buildings."],
      ["Enter a title", "The Title field is empty."],
      ["Changes to the title or details were lost after Accept", "Accept and Reject save only the decision. Save the other changes first, then open the suggestion again and decide."],
      ["An owner sees Could not send: not an owner here", "Their contact is not linked to a unit of that building in Owners."],
      ["Decided at meeting lists no meeting", "The building has no meeting yet. Create it in Meetings."]
    ]
  },

  "plot.announce": {
    title: "Announcements",
    what: "<b>Announcements</b> are notices to everyone in a building, such as a water cut, a lift repair or the date of the assembly. Each is shown to the building's owners on the home of their resident portal, with pinned ones at the top.",
    when: [
      "Something affects the whole building, like works, a service interruption or a meeting date.",
      "A standing message should stay at the top of the portal, such as the concierge's hours."
    ],
    how: [
      "Open <b>Plot &rsaquo; Governance &rsaquo; Announcements</b> and click <span class='man-key'>New</span>. For this example: the water will be cut at Cedar Court for tank cleaning.",
      "Leave <b>Building</b> on Cedar Court and type <i>Water cut on Saturday 9:00 to 13:00</i> in <b>Title</b>.",
      "In <b>Message</b>, explain why and ask residents to store water.",
      "Set <b>Pin to the top</b> to <i>Yes, pin it</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the announcement at the top of the list with a pin.",
      "An owner who opens the portal sees it first under <b>Announcements</b>, with its pin.",
      "After Saturday, open it and set <b>Pin to the top</b> back to No, so newer announcements come first."
    ],
    fields: [
      ["Building", "The building whose owners see it.", "required"],
      ["Title", "The headline residents see.", "required"],
      ["Message", "The full text.", "optional"],
      ["Pin to the top", "No, or Yes, pin it. Pinned announcements come first, here and on the portal; the rest are newest first.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank announcement."],
      ["Save", "Saves it. It shows on the portal straight away."],
      ["Delete", "On an existing announcement. Moves it to the Archive."],
      ["Search, Select, Columns, Export", "Search the title and message; select rows to export or delete; choose columns; download a CSV."]
    ],
    after: "Nothing is emailed: owners see the announcement the next time they open their portal. Only contacts linked to a unit of the building in Owners, with portal access, see it.",
    links: [
      { name: "Resident portal access", how: "Invite owners so they can read announcements.", to: "portal.admin" },
      { name: "Owners", how: "The portal shows a building to the contacts linked to its units.", to: "plot.owners" },
      { name: "Meetings", how: "Announce the date of an assembly here, and record its notice date on the meeting.", to: "plot.meetings" }
    ],
    mistakes: [
      ["Add a building first", "An announcement belongs to a building. Add one in Buildings."],
      ["Enter a title", "The Title field is empty."],
      ["A deleted announcement still shows on the portal", "Delete moves it to the Archive, but the portal still lists it. Remove it for good from the Archive to take it off the portal."],
      ["A tenant does not see the announcement", "The portal shows the building to owners linked in Owners, not to tenants."]
    ]
  },

  "plot.docs": {
    title: "Documents",
    what: "<b>Documents</b> is a building's paperwork library: bylaws, insurance policies, contracts, signed minutes, plans and statements. Each document can be a link, an uploaded file, or both, and can be kept to the committee or shared with the building's owners on the resident portal.",
    when: [
      "A contract, policy or set of signed minutes needs keeping where the committee can find it.",
      "Owners should be able to read the bylaws or the latest statement themselves.",
      "A new committee takes over and needs the building's papers."
    ],
    how: [
      "Open <b>Plot &rsaquo; Governance &rsaquo; Documents</b> and click <span class='man-key'>New</span>. For this example: Cedar Court's bylaws, kept in a shared drive, and its insurance policy as a PDF.",
      "Choose <b>Category</b> Legal and type <i>Building bylaws</i> in <b>Title</b>.",
      "Paste the shared-drive address in <b>Or paste a link</b>, starting with https://.",
      "Set <b>Visible to residents</b> to <i>Residents can see it</i> and click <span class='man-key'>Save</span>. You should see <i>Saved</i>, the row with a <b>Residents</b> badge and an <b>Open</b> link.",
      "Click <span class='man-key'>New</span> again. Choose <b>Category</b> Insurance, type <i>Insurance policy 2026</i> and leave <b>Visible to residents</b> on Committee only.",
      "Under <b>Upload the file</b>, click <span class='man-key'>Add</span> and pick the PDF. A PDF thumbnail appears. Click <span class='man-key'>Save</span>.",
      "Click <span class='man-key'>Group By</span> and choose Category: the bylaws sit under legal and the policy under insurance.",
      "An owner opening the portal sees <i>Building bylaws</i> under <b>Building documents</b>, with an Open link."
    ],
    fields: [
      ["Building", "The building the document belongs to.", "required"],
      ["Category", "General, Minutes, Contract, Insurance, Legal, Plan or Statement. Groups the list and shows on the portal.", "auto"],
      ["Title", "The document's name.", "required"],
      ["Or paste a link", "The web address of the document. It is the Open link in this list and on the portal.", "optional"],
      ["Notes", "For example the renewal date of a policy.", "optional"],
      ["Visible to residents", "Committee only, or Residents can see it on the portal. Residents see the pasted link and can open the uploaded files.", "auto"],
      ["Upload the file", "Photos or PDFs kept with the document. On a new document they upload when you save; on an existing one, as soon as you add them. Files are private: nobody outside your company can reach one by its address. On a document shared with residents, an owner of a unit in that building can ask the portal for it, and gets a link that works for five minutes and only for them.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank document."],
      ["Add", "Picks a photo or PDF to upload. The cross on a thumbnail removes it; on a saved file it asks first and cannot be undone."],
      ["Save", "Saves the document."],
      ["Delete", "On an existing document. Moves it to the Archive, from where it can be restored."],
      ["Open", "In the File column. Opens the pasted link in a new tab, or, when there is no link, the first file uploaded on the document. <i>+1 more</i> after it means more files are on the document; open the document to see them all."],
      ["Group By", "Group the list by Category."],
      ["Search, Select, Columns, Export", "Search by title or category; select rows to export or delete; choose columns; download a CSV."]
    ],
    after: "A document posts nothing. Adding or changing one is written to the Activity log. A document set to Residents can see it is listed on the portal of the building's owners, with its pasted link and a <b>Show the file</b> button for anything uploaded on it, until it is deleted. The portal never hands out a file address: it asks the server, which checks that the person signing in owns a unit in that building and that the document is shared, and only then makes a link that works for five minutes.",
    links: [
      { name: "Meetings", how: "Signed minutes can also be attached to the meeting itself.", to: "plot.meetings" },
      { name: "Resident portal access", how: "Owners need portal access to see shared documents.", to: "portal.admin" },
      { name: "Archive", how: "Deleted documents can be restored there.", to: "plot.archive" }
    ],
    mistakes: [
      ["Add a building first", "A document belongs to a building. Add one in Buildings."],
      ["Enter a title", "The Title field is empty."],
      ["Upload failed: (message)", "The file could not be uploaded. Check the connection and add it again."],
      ["Owners see the document on the portal but cannot open it", "Check that Visible to residents is set to <i>Residents can see it</i> and that the owner's unit is in this building. A file that was deleted from the document has nothing left to open."]
    ]
  },

  "plot.members": {
    title: "Committee and roles",
    what: "<b>Committee and roles</b> (the screen heading reads Committee &amp; roles) records who holds which office in each building: committee head, treasurer, secretary, committee members, the property manager, the concierge and other workers, with the dates of their term. Past office holders are kept, so the committee can show who was responsible at any date.",
    when: [
      "A building's committee is elected or changes.",
      "A concierge or property manager starts or leaves.",
      "You want committee members to appear as people tasks can be given to."
    ],
    how: [
      "Open <b>Plot &rsaquo; Governance &rsaquo; Committee and roles</b> and click <span class='man-key'>New</span>. For this example, the Cedar Court assembly has elected the owner of flat 1A as treasurer for two years.",
      "Leave <b>Building</b> on Cedar Court and choose <b>Role</b> Treasurer.",
      "Pick the owner's contact in <b>Person (contact)</b>. Type their email in <b>Email</b>.",
      "Set <b>Term from</b> to 2026-10-20 and <b>Term to</b> to 2028-10-19. Click <span class='man-key'>Save</span>. You should see <i>Saved</i>.",
      "Add the concierge the same way with <b>Role</b> Concierge. If they are not a contact, leave Person empty and type their name in <b>Name</b>.",
      "Click <span class='man-key'>Group By</span> and choose Role: the treasurer and concierge each sit under their role, marked <b>Active</b>.",
      "Open a new task in Tasks: the treasurer is offered in <b>Who is doing it</b>. The concierge typed by name only is not, because only people linked to a contact are listed.",
      "Also type the treasurer's name in <b>Treasurer</b> on the building, which is where letters and reports take the signature name from."
    ],
    fields: [
      ["Building", "The building the role is in.", "required"],
      ["Role", "Committee head, Treasurer, Secretary, Committee member, Property manager, Concierge, Worker or Resident.", "auto"],
      ["Person (contact)", "The contact holding the role. Needed for them to appear in Tasks. Either this or Name is needed.", "optional"],
      ["Name", "The person's name when they are not a contact.", "optional"],
      ["Email", "How to reach them.", "optional"],
      ["Term from and Term to", "The dates of the term, shown in the Term column.", "optional"],
      ["Notes", "For example the assembly that elected them.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank role."],
      ["Save", "Saves the role."],
      ["Delete", "On an existing role. Moves it to the Archive, from where it can be restored."],
      ["Group By", "Group the list by Building or Role."],
      ["Select", "Tick roles to Export selected, Archive them (the Active column then shows Past), or Delete them permanently."],
      ["Search, Columns, Export", "Search by name or role; choose columns; download a CSV."]
    ],
    after: "A role is a record: it posts nothing and does not change what anyone can see or do in Orbit. Saving it is written to the Activity log. Active roles linked to a contact are the choices in a task's Who is doing it.",
    links: [
      { name: "Tasks", how: "People listed here with a contact can be given tasks.", to: "plot.tasks" },
      { name: "Buildings", how: "The committee head and treasurer names printed on letters are set on the building.", to: "plot.buildings" },
      { name: "Contacts", how: "Add the person as a contact to link them.", to: "contacts" }
    ],
    mistakes: [
      ["Add a building first", "A role belongs to a building. Add one in Buildings."],
      ["Pick a contact or type a name", "The role has no person. Pick a contact or type a name."],
      ["Archived - it is kept as inactive, and can be switched back on from Select in the list", "Shown by Delete while the database is waiting for its latest update: the role is marked Past instead of going to the Archive. Nothing is lost."],
      ["A person is missing from Who is doing it in Tasks", "They have no linked contact, or their role is archived. Pick their contact in Person (contact)."]
    ]
  },

  "plot.residents": {
    title: "Residents",
    what: "<b>Residents</b> is the list of who actually lives or works in each unit: owners living there, tenants, family members and staff, with their phone and WhatsApp, how many people live there, their car and parking space, and an emergency contact. It is what a concierge needs day to day, and what the owner list cannot tell you.",
    when: [
      "Someone moves in or out.",
      "The concierge needs to reach a resident, or identify a car.",
      "There is an emergency and you need the resident's emergency contact."
    ],
    how: [
      "Open <b>Plot &rsaquo; People &rsaquo; Residents</b> and click <span class='man-key'>New</span>. For this example, a family rents flat 1A at Cedar Court.",
      "Leave <b>Building</b> on Cedar Court and pick <b>1A</b> in <b>Unit</b>.",
      "Type the tenant's name in <b>Name</b> and choose <b>They are the</b> Tenant. If the tenant is also a contact, pick them in <b>Linked contact (optional)</b>.",
      "Type the <b>Phone</b> and <b>WhatsApp</b> numbers, and 4 in <b>People living there</b>. Set <b>Moved in</b> to 2026-09-01.",
      "Type the car's registration in <b>Vehicle plate</b> and <i>P-07</i> in <b>Parking spot</b>.",
      "Fill in <b>Emergency contact</b> and <b>Emergency phone</b>, then click <span class='man-key'>Save</span>. You should see <i>Saved</i>.",
      "When the concierge finds a car blocking the ramp, they type part of the plate in the search box: the row shows the resident, unit 1A and their phone.",
      "When the family leaves, open the record and fill in <b>Moved out</b>."
    ],
    fields: [
      ["Building", "The building the resident lives in.", "required"],
      ["Unit", "Their unit. Lists the units of all your buildings.", "optional"],
      ["Name", "The resident's name.", "required"],
      ["They are the", "Owner, Tenant, Family member or Staff.", "auto"],
      ["Linked contact (optional)", "The matching contact, when there is one.", "optional"],
      ["Phone and WhatsApp", "How to reach them. The list shows the phone, or WhatsApp when there is no phone.", "optional"],
      ["Email", "Their email address.", "optional"],
      ["People living there", "How many occupants.", "optional"],
      ["Moved in and Moved out", "The dates they arrived and left.", "optional"],
      ["Vehicle plate and Parking spot", "Their car and where it parks. Searchable by plate.", "optional"],
      ["Emergency contact and Emergency phone", "Who to call if something happens to them.", "optional"],
      ["Notes", "Anything the concierge should know.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank resident."],
      ["Save", "Saves the resident."],
      ["Delete", "On an existing resident. Moves the record to the Archive, from where it can be restored."],
      ["Group By", "Group the list by Building or Type."],
      ["Select", "Tick residents to Export selected, Archive them, or Delete them permanently."],
      ["Search, Columns, Export", "Search by name, phone, plate or unit; choose columns; download a CSV."]
    ],
    after: "A resident record posts nothing and does not give portal access; the portal is reached by owners linked in Owners and invited in Resident portal access. Saving it is written to the Activity log.",
    links: [
      { name: "Units", how: "Each resident lives in a unit.", to: "plot.units" },
      { name: "Tenancies", how: "The rental agreement behind a tenant resident.", to: "plot.tenancies" },
      { name: "Owners", how: "Who owns the unit and is billed for it.", to: "plot.owners" },
      { name: "Resident portal access", how: "Invite an owner to the portal.", to: "portal.admin" }
    ],
    mistakes: [
      ["Add a building first", "A resident belongs to a building. Add one in Buildings."],
      ["Enter a name", "The Name field is empty."],
      ["Archived - it is kept as inactive, and can be switched back on from Select in the list", "Shown by Delete while the database is waiting for its latest update: the resident is archived instead of going to the Archive. Nothing is lost."]
    ],
    tips: [
      "Residents' phone numbers and emergency contacts are personal data: keep only what the concierge needs, and fill in Moved out when someone leaves."
    ]
  },

  "plot.reports": {
    title: "Building reports",
    what: "<b>Building reports</b> holds twelve reports a treasurer is asked for, for one building: owner statements, collections, receivables ageing, income and expenditure, expenses by category, fund movement, budget against actual, the share register, the charge schedule, arrears, supplier spend and a one-page annual summary. Each opens ready to print or downloads as a CSV file. They count posted invoices and bills only.",
    when: [
      "Preparing the accounts for the general assembly.",
      "An owner asks for their statement, or the committee asks who has paid.",
      "An auditor or accountant wants the figures in a spreadsheet."
    ],
    how: [
      "Open <b>Plot &rsaquo; Reports &rsaquo; Building reports</b> and pick <b>Cedar Court</b> in <b>Building</b>. For this example, the treasurer prepares the 2026 figures for the assembly.",
      "<b>From</b> shows 1 January of this year and <b>To</b> today. Set To to 2026-12-31.",
      "On the <b>Annual summary</b> card, click <span class='man-key'>Open</span>. A page opens to print with the building's name, <i>Annual summary &middot; 2026-01-01 to 2026-12-31</i>, and the lines Units, Total shares, Charge per period, Billed in period, Spent in period, Still outstanding and Opening balance.",
      "Print it, or save it as a PDF from the print window.",
      "On the <b>Collections</b> card, click <span class='man-key'>Export CSV</span>. You should see <i>CSV downloaded</i>; the file lists each unit's billed, paid and outstanding amounts and the percentage collected.",
      "On the <b>Units &amp; shares</b> card, click <span class='man-key'>Open</span>. The share register lists every unit with its current owner, floor, block, area, shares and whether it votes, and ends with <i>Total shares 1000 of 1000</i>.",
      "The treasurer's name from the building appears at the foot of each printed report."
    ],
    fields: [
      ["Building", "Which building to report on.", "optional"],
      ["From and To", "The period. Used by Income &amp; expenditure, Expenses by category, Budget vs actual and Supplier spend, by the receipts in Fund movement, and by the billed and spent lines of the Annual summary. The other reports show everything to date.", "auto"],
      ["Owner statement", "Every posted charge invoice of the building, in date order, with the unit, owner, number, amount and what is outstanding.", "auto"],
      ["Collections", "Per unit: billed, paid, outstanding and collected percentage.", "auto"],
      ["Receivables ageing", "Every posted charge invoice with money owing: due date, outstanding, days overdue, and a bucket of Not due, 1-30, 31-60, 61-90 or 90+.", "auto"],
      ["Income &amp; expenditure", "Charges billed to owners and building expenses in the period, and the net.", "auto"],
      ["Expenses by category", "Posted bills of the building in the period, totalled by Building cost type.", "auto"],
      ["Fund movement", "Opening balance, this building's receipts in the period, amounts paid on the building's bills, and the closing balance.", "auto"],
      ["Budget vs actual", "Spend in the period by cost type, to compare with the lines of the Annual budget.", "auto"],
      ["Units &amp; shares", "The share register, with the total against the building's Shares total.", "auto"],
      ["Charge schedule", "What each unit pays per period under the current charges, with the building's total including the reserve.", "auto"],
      ["Arrears &amp; notices", "The same list as Receivables ageing.", "auto"],
      ["Supplier spend", "Posted bills of the building in the period, totalled by supplier.", "auto"],
      ["Annual summary", "One page of key figures for the general assembly.", "auto"]
    ],
    buttons: [
      ["Open", "On each report. Opens it in a new window ready to print."],
      ["Export CSV", "On each report. Downloads the same rows as a CSV file."]
    ],
    after: "Reports only read. They are worked out when you press the button, from posted invoices and bills tagged to the building, its units, owners and charges, and the payments received for the building: those against its charge invoices, and money on account from owners whose units are all in this building.",
    links: [
      { name: "Annual budget", how: "The budgeted lines to set against Budget vs actual.", to: "plot.budget" },
      { name: "Arrears", how: "Late balances with the notice stage reached and a Notice button.", to: "plot.arrears" },
      { name: "Committee view", how: "The building's totals on one screen.", to: "plot.committee" },
      { name: "Invoices", how: "Only posted charge invoices appear in the reports.", to: "inv.out" }
    ],
    mistakes: [
      ["Nothing to show for this period.", "No posted records fall in the report or the period. Check the dates, and that invoices and bills are posted and tagged to the building."],
      ["No buildings yet", "There is no active building. Add one in Buildings."],
      ["An owner's advance is missing from Fund movement", "Money taken on account counts for a building only when all of the owner's units are in that building. Record it against a charge with Record a payment on the Overview instead."],
      ["The print window does not open", "The browser blocked the pop-up. Allow pop-ups for Orbit and click Open again."]
    ],
    tips: [
      "For one owner's statement with payments and a running balance, use Owner statement on the Overview instead."
    ]
  },

  "plot.committee": {
    title: "Committee view",
    what: "The <b>Committee view</b> shows a building's money as totals only: fund balance, what has been collected, what owners still owe in total, what is owed to suppliers, the collection rate and where the money went. No individual owner's balance is shown, so it can be put on a screen or printed for the whole committee without exposing a neighbour.",
    when: [
      "At a committee meeting, to report on the building's finances.",
      "A committee member asks how the building is doing without needing each owner's account."
    ],
    how: [
      "Open <b>Plot &rsaquo; Reports &rsaquo; Committee view</b> and pick <b>Cedar Court</b> in <b>Building</b>.",
      "Read the note: <i>Totals for the whole building. Individual owners' balances are deliberately not shown here - use Arrears for that.</i>",
      "Check the cards. For example, with 6,300.00 billed and 924.00 still unpaid, <b>Still owed by owners</b> shows 924.00 and <b>Collection rate</b> 85%.",
      "<b>Charge per period</b> shows what the building bills each month under the current charges, 1,260.00 here.",
      "Under <b>Where the money went</b>, each cost type is listed with its spend, the largest first, for example Concierge, then Generator.",
      "Click <span class='man-key'>Print</span> to print the screen for the meeting."
    ],
    fields: [
      ["Building", "Which building to show.", "optional"],
      ["Fund balance", "Read only: the building's opening balance plus the payments received for this building, less what has been paid on its posted bills.", "auto"],
      ["Collected", "Read only: the payments received for this building, meaning those against its charge invoices, and money on account from owners whose units are all in this building.", "auto"],
      ["Still owed by owners", "Read only: what is left to pay on the building's posted charge invoices.", "auto"],
      ["Owed to suppliers", "Read only: what is left to pay on the building's posted bills.", "auto"],
      ["Collection rate", "Read only: the share of everything billed on posted charge invoices that has been paid.", "auto"],
      ["Charge per period", "Read only: the monthly charges including the reserve.", "auto"],
      ["Where the money went", "Read only: the building's posted bills, totalled by Building cost type, since the start.", "auto"]
    ],
    buttons: [
      ["Print", "Prints the screen."]
    ],
    after: "The Committee view only reads, from the same records as Building reports.",
    links: [
      { name: "Arrears", how: "Per-unit balances, for the treasurer rather than the whole committee.", to: "plot.arrears" },
      { name: "Building reports", how: "The detailed reports behind these totals.", to: "plot.reports" },
      { name: "Expenses", how: "The bills behind Where the money went.", to: "plot.expenses" }
    ],
    mistakes: [
      ["Collected looks lower than the money received", "A payment taken on account from an owner who also owns units in another building is not counted, because Orbit cannot tell which building it is for. Record such payments against a charge with Record a payment."],
      ["No expenses recorded yet.", "No posted bill is tagged to this building. Tag supplier bills with Building in Accounting."],
      ["No buildings yet", "There is no active building. Add one in Buildings."]
    ]
  },

  "plot.activity": {
    title: "Activity log",
    what: "The <b>Activity log</b> is a running record of who changed what in Plot and when, so the committee can account for its decisions. It shows the latest 500 entries across your buildings and cannot be edited.",
    when: [
      "An owner or the committee asks who changed something, or when.",
      "A record has gone missing and you want to know who deleted it.",
      "A new committee takes over and wants to see what was done."
    ],
    how: [
      "Open <b>Plot &rsaquo; Reports &rsaquo; Activity log</b>. For this example, the lift charge vanished from Cedar Court's charges.",
      "Type <i>Lift</i> in the search box.",
      "You should see a line with <b>Did</b> <i>deleted</i>, <b>What</b> <i>Charge</i> with the charge's name, <b>Who</b> the email of the person who deleted it, and <b>When</b> the date and time.",
      "Open <b>Plot &rsaquo; Reports &rsaquo; Archive</b> and click <span class='man-key'>Restore</span> on the charge. Back in the log, a new line reads <i>restored</i>.",
      "Click <span class='man-key'>Export</span> to keep a copy of the log as a CSV file."
    ],
    fields: [
      ["When", "Read only: the date and time of the change.", "auto"],
      ["Who", "Read only: the email of the signed-in user who made it.", "auto"],
      ["Did", "Read only: created, updated, deleted, restored, purged, posted, unlocked, decided, checked in, billed, received or transferred.", "auto"],
      ["What", "Read only: the kind of record and its name.", "auto"],
      ["Building", "Read only: the building of the change, or the building you had selected when it was made.", "auto"],
      ["Detail", "Read only: extra facts, such as the units and charges created by Set up a building, or who carried the arrears in a transfer.", "auto"]
    ],
    buttons: [
      ["Search", "Find entries by person, action, record name or record type."],
      ["Select and Export", "Tick entries to export them, or download the whole list as a CSV file."],
      ["Columns", "Choose which columns show."]
    ],
    after: "The log is written as you work and only read here. It records: units created, changed and transferred; meetings created, changed, posted and unlocked; suggestions created, changed and decided; tasks, documents, committee roles and residents created and changed; check-ins; buildings made with Set up a building; special assessments; payments recorded on the Overview; and every delete, restore and permanent removal done through Plot's Delete and Archive. Other changes, such as editing a building, an owner link, a charge, a notice or a budget, or generating a regular billing run, are not logged.",
    links: [
      { name: "Archive", how: "Restore what the log shows as deleted.", to: "plot.archive" },
      { name: "Meetings", how: "Posting and unlocking minutes are logged.", to: "plot.meetings" }
    ],
    mistakes: [
      ["The activity log is a record and cannot be edited.", "Shown when you click an entry. Entries cannot be changed or removed."],
      ["A change you made does not appear", "Not every kind of change is logged; see what is recorded above. The log also shows only the latest 500 entries."]
    ]
  },

  "plot.archive": {
    title: "Archive",
    what: "The <b>Archive</b> holds Plot records that were deleted, so a building keeps its history and a mistake can be undone. Delete in a Plot form moves a record here rather than destroying it. From here you put a record back, or remove it for good.",
    when: [
      "Something was deleted by mistake.",
      "You want to see what has been deleted, when and by whom.",
      "A record must be removed for good, for example a duplicate entered by mistake."
    ],
    how: [
      "Open <b>Plot &rsaquo; Reports &rsaquo; Archive</b>. For this example, someone deleted Cedar Court's <i>Lift maintenance contract</i> charge.",
      "You should see a row with <b>What</b> Charge, <b>Record</b> Lift maintenance contract, <b>Deleted</b> the date and time and <b>By</b> the person's email.",
      "Click <span class='man-key'>Restore</span>. You should see <i>Restored</i>, and the row leaves the Archive.",
      "Open Charges: the charge is back, as it was, and counts in the next billing run.",
      "For a duplicate task created by mistake, click <span class='man-key'>Remove for good</span> on its row and confirm. You should see <i>Removed</i>."
    ],
    fields: [
      ["What", "Read only: Unit, Owner link, Tenancy, Charge, Meeting, Resolution, Notice, Suggestion, Announcement, Budget, Project, Bid, Checklist item, Document or Task.", "auto"],
      ["Record", "Read only: the record's name, title or code.", "auto"],
      ["Deleted and By", "Read only: when it was deleted and the email of who deleted it.", "auto"]
    ],
    buttons: [
      ["Restore", "Puts the record back where it was, unchanged."],
      ["Remove for good", "After a confirmation, deletes the record permanently. It cannot be undone."]
    ],
    after: "Restoring makes the record count again everywhere it did before, for example a unit in the next charge split or a charge in the next run. Both restoring and removing are written to the Activity log. The Archive shows up to 100 of the most recently deleted records of each kind.",
    links: [
      { name: "Activity log", how: "Shows who deleted, restored or removed each record.", to: "plot.activity" },
      { name: "Buildings", how: "A building is archived and restored from its own form, not here.", to: "plot.buildings" }
    ],
    mistakes: [
      ["Nothing in the archive", "Nothing has been deleted in Plot, or the records were removed for good."],
      ["Still used by other records - leave it archived.", "Remove for good was refused because other records still point at this one. Leave it in the Archive."],
      ["A deleted building, budget line, agenda item, committee role or resident is not here", "Buildings are archived from the building form. Budget lines and meeting agenda items are removed permanently when you delete them, and committee roles and residents are archived from their own lists with Select."]
    ],
    tips: [
      "Remove for good only when you are sure. A record left in the Archive is hidden from Plot's lists, but the resident portal still shows deleted announcements, shared documents, public projects and active charges until they are removed for good."
    ]
  }

});
