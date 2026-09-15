/* Orbit screen help: Operations, the Inventory and Manufacturing screens and
 * Document search.
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
 * <span class='man-key'>Confirm receipt</span> for a button name.
 */
orbitScreenHelp({

  "inv.onhand": {
    title: "Overview",
    what: "The <b>On Hand</b> screen is the front page of Inventory. It lists every stocked product with how many you have, its unit, its cost and what that stock is worth, with three tiles on top: <b>Total stock value</b>, <b>Low-stock items</b> and <b>Expiring / expired lots</b>. It is also where you move stock by hand: receive goods, issue material to a project, deliver, transfer between locations and correct a count.",
    when: [
      "You want to know how much of an item you hold, what it is worth, or how much sits at one location.",
      "Goods have arrived without a purchase order and need booking into stock (<span class='man-key'>Receive</span>).",
      "Material is used up on one of your own jobs (<span class='man-key'>Issue to Project</span>).",
      "Goods leave with no paperwork (<span class='man-key'>Deliver</span>), move between two of your locations (<span class='man-key'>Transfer</span>), or a shelf count does not match the screen (<span class='man-key'>Adjust</span>)."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Overview</b>. For this example a food wholesaler takes in 40 cartons of olive oil whose product cost price is 18.00. You should see the On Hand table with the three tiles above it.",
      "Click <span class='man-key'>Receive</span>. The Goods Receipt form opens.",
      "Pick the supplier in <b>Receive from</b>, leave <b>Operation type</b> on <i>Receipt (goods in)</i>, choose who checked the goods in under <b>Received by</b>, and type the supplier's delivery note number in <b>Source document</b>.",
      "On the first line pick the product <i>Olive oil 5 L carton</i>, type 40 in <b>Qty received</b> and leave <b>Destination</b> on <i>Warehouse</i>.",
      "Click <span class='man-key'>Confirm receipt</span>. You should see <i>Receipt saved - 1 item(s) added to inventory</i>, and back on On Hand the product shows 40 with a <b>Value</b> of 720.00.",
      "A customer collects 6 cartons. Click <span class='man-key'>Deliver</span>, pick the product, type 6 in <b>Quantity</b>, choose the <b>Location</b> the stock leaves and click <span class='man-key'>Confirm</span>. On Hand now reads 34.",
      "The shelf count finds 33. Click <span class='man-key'>Adjust</span>, pick the product, choose the location, type 33 in <b>Counted quantity on hand</b> and click <span class='man-key'>Apply</span>. On Hand reads 33 and the missing carton, 18.00, is written off to stock adjustment.",
      "Pick one location in the drop-down at the top right. The quantities and the total row now show only that location; the tiles still cover the whole company."
    ],
    fields: [
      ["Location filter (top right)", "Shows on-hand at one location instead of <i>All locations</i>. It appears once the company has more than one internal location.", "optional"],
      ["Receive from (Receive)", "The supplier the goods came from. Only contacts marked as vendors are listed.", "optional"],
      ["Operation type (Receive)", "<i>Receipt (goods in)</i> or <i>Internal receipt</i> add the lines to stock. <i>Return to vendor</i> takes them out of stock again, back to the Vendors location.", "optional"],
      ["Received by (Receive)", "The person who checked the goods in. It is stored on each stock move.", "optional"],
      ["Scheduled date (Receive)", "The date of the receipt, today unless you change it. The stock moves and their postings are dated the day you confirm.", "auto"],
      ["Source document (Receive)", "The paperwork this receipt is against, such as a supplier delivery note number.", "optional"],
      ["Product (Receive line)", "The item received. A line with no product is refused unless its destination is Site. Use <span class='man-key'>Scan barcode</span> to add a line by its code.", "required"],
      ["Description (Receive line)", "Fills from the product name. Change it if the paperwork says something different.", "auto"],
      ["Unit (Receive line)", "The unit you are counting in. If Units of Measure holds a conversion to the product's stock unit, Orbit stores the converted quantity.", "optional"],
      ["Qty received (Receive line)", "How many arrived. Lines left at zero are ignored.", "required"],
      ["Destination (Receive line)", "<i>Warehouse</i> puts the goods into stock, <i>Factory</i> into the Factory (WIP) location, <i>Site</i> sends them straight to a job: a Site line is not added to stock and posts nothing from this form.", "optional"],
      ["Product (Issue, Deliver, Transfer, Adjust)", "The stocked item. The camera button next to it scans a barcode or QR code and selects the matching product.", "required"],
      ["Project / site (Issue to Project)", "The job the material is used on. Only active projects are listed.", "required"],
      ["Location / From location / To location", "Which stock location is affected. Transfer asks for both and they must differ. Shown when the company has more than one internal location; otherwise the main stock location is used.", "optional"],
      ["Quantity / Counted quantity on hand", "How many you are moving. For Adjust it is what you actually counted, and Orbit posts the difference.", "required"],
      ["Unit (dialogs)", "The unit you typed the quantity in. The line under it shows the converted quantity in the stock unit, or warns that there is no conversion.", "optional"],
      ["Lot / Serial (Deliver)", "The batch or serial number shipped, for traceability. It links the delivery to that lot in Lots / Serials.", "optional"]
    ],
    buttons: [
      ["Receive", "Opens the Goods Receipt form to book goods into stock."],
      ["Issue to Project", "Opens <i>Issue material to a project</i>: stock leaves the location and its cost is charged to the project."],
      ["Deliver", "Opens <i>Deliver stock</i>: a plain stock-out to the Customers location with cost of sales posted."],
      ["Transfer", "Opens <i>Internal transfer</i> between two of your locations. No accounting entry is made."],
      ["Adjust", "Opens <i>Inventory adjustment</i>: type the counted quantity and Orbit moves the difference in or out."],
      ["+ Add a product / Scan barcode", "On the Goods Receipt form: add a blank line, or scan a code to add a line for the matching product."],
      ["Confirm receipt", "Saves the receipt, adds each line to stock and posts its value."],
      ["Discard", "Leaves the Goods Receipt form without saving."],
      ["Confirm / Transfer / Apply", "Saves the dialog's movement."],
      ["+ Add a unit...", "At the bottom of every Unit list. Creates a new unit without leaving the form."]
    ],
    after: "Every movement becomes a line in <b>Stock Moves</b> and changes on-hand at once. Its value is the quantity times the product's cost price, and it posts one entry in the MISC journal dated today: a receipt debits <b>Stock on hand</b> and credits <b>Received not invoiced</b>; a delivery or an issue debits <b>Cost of sales</b> and credits Stock on hand; an adjustment up debits Stock on hand and credits <b>Stock adjustment</b>, and down does the reverse. A transfer posts nothing. The accounts are the ones in <b>Settings &rsaquo; Companies &rsaquo; Stock accounting</b>; if one is blank Orbit uses the codes 3100, 4700, 6000 and 6500. A product with no cost price moves quantity only. An issue is tagged to the project, so it appears in Material Issues, Job Cost and Project P&amp;L.",
    links: [
      { name: "Stock Moves", how: "Every movement made from this screen, listed and filterable.", to: "inv.moves" },
      { name: "Material Issues", how: "The issues to projects, grouped by project.", to: "inv.issues" },
      { name: "Products", how: "Only products of type Storable or Consumable are counted here; the cost price sets the value.", to: "products" },
      { name: "Purchase Orders", how: "Receiving against an order uses the same Goods Receipt form, values lines at the order price and updates each line's received quantity.", to: "po.list" },
      { name: "Replenishment", how: "The Min you set there drives the Low-stock items tile.", to: "inv.reorder" },
      { name: "Lots / Serials", how: "The lots behind the Expiring / expired lots tile.", to: "lots" },
      { name: "Locations", how: "Add a second location to use the location filter and Transfer.", to: "loc" },
      { name: "Job Cost", how: "Material issued to a project counts as its material cost.", to: "proj.jobcost" },
      { name: "Journal Entries", how: "The postings each movement made, in the MISC journal.", to: "moves" }
    ],
    mistakes: [
      ["Add a product first (Products screen)", "There are no active products yet. Create one in Products, set its type to Storable, then come back."],
      ["Enter a quantity / Quantity must be positive", "The quantity box is empty, zero or negative. Only Adjust accepts zero, as a count."],
      ["Create a project first (Projects app) / Pick a project", "Issue to Project needs an active project. Create or reopen one in Projects."],
      ["Pick two different locations", "A transfer's From and To are the same. Choose another destination."],
      ["Add a second location first (Configuration > Locations)", "A transfer needs at least two internal locations. Add one in Locations."],
      ["Only 4 on hand here; you're moving 6. Not enough stock.", "The location holds less than you are taking out. Check the location you picked, receive the missing stock first, or ask an Inventory manager: a manager is asked <i>Post anyway and allow negative stock?</i> instead."],
      ["No change", "The counted quantity in Adjust equals what Orbit already shows at that location, so there is nothing to post."],
      ["Add at least one product with a quantity", "Every receipt line is empty or at zero. Fill in a product and a quantity."],
      ["Line &quot;(name)&quot; has no product - add one, or set destination to Site (cost only), to receive it.", "A receipt line has only a description. Pick the product; that line was skipped and the others were saved."],
      ["Stock saved, but no stock account is set for this company - Settings, Companies, Stock accounting", "The quantity moved but nothing reached the ledger. Choose the Stock on hand account in Settings, Companies, Stock accounting."],
      ["Stock saved, but this company has no MISC journal to post through", "The company's journal with code MISC is missing. Add it in Accounting, then post future movements as normal."],
      ["Stock saved; GL post failed: Period locked on (date)", "The movement is saved but its entry stays a draft because today is inside a locked period. Ask whoever locked the period to move the lock date."],
      ["no conversion to (unit) - stored as entered", "The unit you chose has no conversion to the product's stock unit, so the number is stored as typed. Add the conversion in Units of Measure or enter the quantity in the stock unit."]
    ],
    tips: [
      "The first time inventory is used Orbit creates <i>Main Warehouse</i> with its Stock location, plus Vendors, Customers, Inventory Adjustment and Factory (WIP) locations, so you can start receiving straight away.",
      "Value is always quantity times today's cost price, so changing a product's cost changes the value of stock already on the shelf.",
      "A counted item such as a sheet or a bar shows its count and the measure it holds under the unit, for example <i>3 sheets = 11.25 m2</i>."
    ]
  },

  "inv.receipts": {
    title: "Receipts",
    what: "<b>Receipts</b> lists every goods receipt and every return to a supplier as a numbered document: REC/00012 for goods in, RET/00003 for goods sent back. Open one to see what came in, which location it went to, what it was worth and the journal entries that valued it, and correct it with <span class='man-key'>Edit</span>.",
    when: [
      "A delivery was keyed in with the wrong quantity, and the stock and the purchase order need putting right.",
      "You want to see everything received against a purchase order, or from one supplier.",
      "You need the journal entry that put a delivery's value into stock."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Operations &rsaquo; Receipts</b>. For this example 10 aluminium sheets were received against PO/2026/0014, but only 8 arrived.",
      "Type <i>PO/2026/0014</i> in the search box. Only the receipts made against that order remain.",
      "Click the receipt. It shows the supplier, the purchase order, the date and one line per product with its location, quantity, value and journal entry numbers.",
      "Press <span class='man-key'>Edit</span>. A <b>New quantity</b> box appears on each line. Enter <i>8</i> on the sheet line.",
      "Press <span class='man-key'>Save changes</span>. You should see the quantity at 8 and a second journal entry number on the line. The purchase order now shows 8 received, with 2 still to come.",
      "Use the <span class='man-key'>&#8249;</span> and <span class='man-key'>&#8250;</span> arrows beside the title to step to the previous or next receipt in the list without going back to it."
    ],
    fields: [
      ["Received from", "The supplier the goods came from (<i>Returned to</i> on a return). Can be changed with Edit.", "optional"],
      ["Purchase order", "The order the receipt was made from. Click it to open the order.", "auto"],
      ["Received by", "The person who checked the goods in.", "auto"],
      ["Date", "The date the goods were received. Can be changed with Edit; the stock value keeps the date it was posted.", "required"],
      ["Source document", "The paperwork the receipt is against, such as the supplier's delivery note number.", "optional"],
      ["Quantity", "What the receipt put into stock (or sent back, on a return), in the product's stock unit, after any corrections.", "auto"],
      ["New quantity", "Shown while editing. Enter the quantity that really came in; 0 takes the whole line back out.", "required"],
      ["Value", "The stock value of the line, at the cost the goods came in at.", "auto"],
      ["Journal entries", "The entries that put the value into stock: one for the receipt and one for each correction. Click one to open it.", "auto"]
    ],
    buttons: [
      ["Receive goods", "Opens a blank goods receipt for goods that came without a purchase order."],
      ["Edit", "Makes the supplier, date, source document and each line's quantity editable. Needs permission to manage Inventory."],
      ["Save changes", "Saves the details, adds a correcting movement for each changed quantity, posts its value and updates the purchase order's received quantity."],
      ["Cancel", "Leaves edit mode without changing anything."],
      ["Open (order number)", "Opens the purchase order the receipt came from."]
    ],
    after: "Nothing changes until you save an edit. A saved edit never rewrites the first movement: it adds a correcting movement to the same receipt, so the stock history still shows what was keyed first and what corrected it. The version before the edit is kept, and <i>Edited after confirming</i> above the details lists each one; click one to see it.",
    links: [
      { name: "Purchase Orders", how: "Receive goods on a confirmed order creates a receipt here, and the order's Receipts button lists them.", to: "po.list" },
      { name: "Stock Moves", how: "Each receipt line and each correction is a movement there.", to: "inv.moves" },
      { name: "Overview", how: "On hand goes up with a receipt and down with a return or a lowered quantity.", to: "inv.onhand" },
      { name: "Journal Entries", how: "The value of each receipt and correction, posted in the MISC journal.", to: "moves" },
      { name: "Vendor Bills", how: "Billing checks the quantity received, so correct a receipt before billing the difference.", to: "inv.in" }
    ],
    mistakes: [
      ["The purchase order is for 10 and 10 is received, so at most 0 more can come in", "A receipt cannot bring in more than was ordered. Edit the purchase order's quantity first, then the receipt."],
      ["3 is left in Main Warehouse, so 5 cannot go out", "Part of the stock has already been issued or delivered. Lower the quantity by no more than what is still in that location."],
      ["A line I received is not on the receipt", "A line sent straight to a site is a cost of that job, not stock, and a line without a stocked product is not kept in stock, so neither is listed."]
    ],
    tips: [
      "A return is its own receipt with a RET number. Edit it the same way to change how much went back.",
      "Alt and the left or right arrow key step between receipts too."
    ]
  },

  "inv.moves": {
    title: "Stock Moves",
    what: "<b>Stock Moves</b> is the history of every movement of stock: receipts, deliveries, issues to projects, adjustments, transfers, scrap and the consumption and output of work orders and production runs. Each row shows the date, the product, where it came from, where it went and the quantity. It is read-only: you correct stock with a new movement, never by editing an old one.",
    when: [
      "You want to see exactly when and where an item came in or went out.",
      "A number on On Hand looks wrong and you need to trace it.",
      "You want to prove what a completed work order or a production run did to stock."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Operations &rsaquo; Stock Moves</b>. For this example a bakery wants to know where 25 kg of flour went this month.",
      "Type <i>flour</i> in the search box. The search matches product names and location names. You should see only the flour movements, newest first.",
      "Click <span class='man-key'>Filters</span> and choose <i>Deliveries</i>. Only movements leaving an internal location for somewhere else remain.",
      "Click <span class='man-key'>Group By</span> and choose <i>Month</i>. You should see a heading per month with its count of rows.",
      "Read the <b>From</b> and <b>To</b> columns. A move to <i>Customers</i> is a delivery, an issue or a consumption; a move to <i>Inventory Adjustment</i> is an adjustment down or scrap.",
      "Click <span class='man-key'>Export</span> to download what you see as a CSV file for a spreadsheet."
    ],
    buttons: [
      ["Search", "Filters the list by product or location name as you type."],
      ["Filters", "<i>Receipts</i> (into an internal location from outside), <i>Deliveries</i> (out of an internal location to outside) and <i>Internal</i> (between two internal locations)."],
      ["Group By", "Groups the rows by <i>Type</i> (Receipt, Delivery, Internal transfer, Other), <i>Product</i> or <i>Month</i>."],
      ["Columns", "Choose which columns show; drag a column edge to resize."],
      ["Rows per page", "How many rows to show per page, up to Show all."],
      ["Select", "Tick rows to export only those with <span class='man-key'>Export selected</span>."],
      ["Export", "Downloads the current list, with your search and filters applied, as a CSV file."]
    ],
    after: "Nothing. This screen only reads the movements; it creates no stock and posts nothing.",
    links: [
      { name: "Overview", how: "Receive, Issue to Project, Deliver, Transfer and Adjust each add a row here.", to: "inv.onhand" },
      { name: "Scrap", how: "A write-off shows as a move to Inventory Adjustment.", to: "inv.scrap" },
      { name: "Cycle Count", how: "Posting a count adds one adjustment row per variance.", to: "inv.cyclecount" },
      { name: "Work Orders", how: "Completing one adds a move per component consumed and one for the finished goods.", to: "mfg.wo" },
      { name: "Production Runs", how: "A run set to Done adds the same kind of rows.", to: "mfg.runs" },
      { name: "Journal Entries", how: "The value side of each move, posted in the MISC journal.", to: "moves" }
    ],
    mistakes: [
      ["A movement I expected is not listed", "Search only matches product and location names, not quantities or references. Clear the search and filters, then group by Product."],
      ["An adjustment up appears under Receipts", "The filter looks only at the locations: anything arriving in an internal location from outside counts as a receipt, including an adjustment up and the finished goods of a work order."],
      ["A move needs correcting", "Moves cannot be edited or deleted here. Post the correction from Overview with Adjust or Transfer."]
    ],
    tips: [
      "Only moves between internal locations and the outside change your on-hand total; a transfer changes where the stock is, not how much you have."
    ]
  },

  "inv.issues": {
    title: "Material Issues",
    what: "A <b>material issue</b> is stock consumed on one of your own projects: timber used on a fit-out, cable pulled on an installation. This screen lists every stock movement tagged to a project, with the material, the project, the quantity and its cost value. Issuing takes the stock off the shelf and charges its cost to the job.",
    when: [
      "Material leaves the store to be used on a job you are running.",
      "You want to see what has been issued to one project, or everything issued in a month.",
      "A project's material cost looks high and you want the lines behind it."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Operations &rsaquo; Material Issues</b>. For this example a furniture workshop issues 12 sheets of oak-veneered plywood, cost price 42.00 a sheet, to a hotel fit-out project.",
      "Click <span class='man-key'>New</span>. Orbit opens the Overview and the <i>Issue material to a project</i> dialog on top of it.",
      "Pick the <b>Product</b>, or press the camera button and scan its label.",
      "Choose the project in <b>Project / site</b> and the location the sheets leave in <b>From location</b>.",
      "Type 12 in <b>Quantity</b>. Leave <b>Unit</b> on the product's stock unit.",
      "Click <span class='man-key'>Confirm</span>. You should see <i>Material issued to project &amp; posted</i>, and On Hand drops by 12.",
      "Go back to Material Issues. You should see a row with the plywood, the hotel project, 12 and a <b>Cost value</b> of 504.00.",
      "Click <span class='man-key'>Group By</span> and choose <i>Project</i> to see each job's issues together."
    ],
    fields: [
      ["Product", "The stocked item issued. Only Storable and Consumable products are offered when you have any.", "required"],
      ["Project / site", "The project the material is consumed on. Its cost is charged there.", "required"],
      ["From location", "The stock location the material leaves. Shown when you have more than one internal location.", "optional"],
      ["Quantity", "How many units are issued. It must be above zero.", "required"],
      ["Unit", "The unit you typed the quantity in; converted to the stock unit when a conversion exists.", "optional"]
    ],
    buttons: [
      ["New", "Opens the Overview with the Issue to Project dialog ready to fill in."],
      ["Confirm", "In the dialog: saves the issue, reduces stock and posts its cost."],
      ["Cancel", "Closes the dialog without issuing anything."],
      ["Group By", "Groups the list by <i>Project</i> or <i>Month</i>."],
      ["Search / Columns / Select / Export", "Search by material or project name, choose columns, and export all or selected rows as CSV."]
    ],
    after: "The issue is a stock move from your location to the Customers location, tagged with the project. It posts an entry in the MISC journal: <b>Cost of sales</b> debited and <b>Stock on hand</b> credited, for the quantity times the cost price, narrated <i>Material issued: (product)</i>. Job Cost and Project P&amp;L read these tagged moves as the project's material cost.",
    links: [
      { name: "Overview", how: "Where the Issue to Project dialog lives, and where on-hand drops.", to: "inv.onhand" },
      { name: "Job Cost", how: "Issued material counts as actual cost on the project.", to: "proj.jobcost" },
      { name: "Project P&amp;L", how: "Issued material is part of the project's costs.", to: "proj.pnl" },
      { name: "Projects", how: "Only active projects can receive an issue.", to: "proj.list" },
      { name: "Delivery Notes", how: "If a customer needs a signed slip for the goods, raise a note as well; the note itself does not move stock.", to: "dn.list" }
    ],
    mistakes: [
      ["Create a project first (Projects app)", "There is no active project. Create one, or reopen a closed one, in Projects."],
      ["Only 5 on hand here; you're moving 12. Not enough stock.", "The chosen location holds less than the quantity. Pick the right location or receive the stock first; an Inventory manager can choose to post anyway."],
      ["Stock saved; GL post failed: Period locked on (date)", "The issue is recorded but its entry stays a draft because today is in a locked period."],
      ["An issue went to the wrong project", "Issues cannot be edited. Bring the stock back with an Adjust on Overview, then issue it again to the right project."]
    ],
    tips: [
      "The <b>Cost value</b> column uses the product's cost price today, so it moves if the cost price changes after the issue.",
      "Work orders and production runs on a company without a work-in-progress account also tag their consumption to the project, so those lines appear here too."
    ]
  },

  "dn.list": {
    title: "Delivery Notes",
    what: "A <b>delivery note</b> is the paperwork that travels with goods: who they went to, which job, the address, and what was on the load. One note can mix stock products, the output of a production run and made-to-size project materials. It is a record only: saving or marking it Delivered does not change stock or post anything.",
    when: [
      "Goods are leaving for a customer or a site and the driver needs a list to hand over.",
      "You want a numbered record of what was sent where, grouped by customer or status.",
      "You need to see which deliveries are still Issued and not yet confirmed Delivered."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Operations &rsaquo; Delivery Notes</b> (also in the Manufacturing menu). For this example a fabricator sends 8 steel balustrade panels and 2 boxes of fixings to a school project.",
      "Click <span class='man-key'>New</span>. Leave the number box at the top empty so Orbit numbers the note.",
      "Choose the customer in <b>Deliver to (customer)</b>, the job in <b>Project</b>, and type the site address in <b>Ship to address</b>.",
      "Leave <b>Date</b> on today and <b>Status</b> on <i>Draft</i> while you build the list.",
      "On the first line pick the balustrade panel under <i>Stock products</i> in <b>Item</b>. The description fills in. Type 8 in <b>Qty</b> and choose the unit.",
      "Click <span class='man-key'>+ Add item</span>, pick the fixings, type 2 and choose <i>box</i> as the unit.",
      "Set <b>Status</b> to <i>Issued</i> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the list shows the note with a number such as DN-0004.",
      "When the customer signs for the goods, open the note, set Status to <i>Delivered</i> and Save.",
      "Move the stock separately, for example with Issue to Project or Deliver on the Overview."
    ],
    fields: [
      ["Number (title)", "Leave blank on a new note and Orbit fills in DN- plus the next free number, one above the highest already used, so a number is never given twice. You can type your own instead, as long as no other note in the company uses it.", "auto"],
      ["Deliver to (customer)", "The customer receiving the goods. Only contacts marked as customers are listed.", "optional"],
      ["Project", "The job the delivery is for. The list shows it and can be searched by it.", "optional"],
      ["Ship to address", "Where the goods go. When no customer is chosen the list's To column shows this address.", "optional"],
      ["Date", "The delivery date, today by default.", "optional"],
      ["Status", "Draft, Issued, Delivered or Cancelled. It only labels the note.", "optional"],
      ["Item (on a line)", "Pick from <i>Stock products</i>, <i>Manufactured</i> (production runs) or <i>Project materials</i>, or leave <i>(free text)</i> and just type a description.", "optional"],
      ["Description (on a line)", "What the line is. Filled from the item when empty.", "optional"],
      ["Qty (on a line)", "How many were sent.", "optional"],
      ["Unit (on a line)", "The unit of the quantity. Picking a stock product fills its unit; <i>+ Add a unit...</i> creates a new one.", "optional"],
      ["Notes", "Anything the driver or the customer should know.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank delivery note."],
      ["+ Add item", "Adds another line."],
      ["&times; (on a line)", "Removes that line."],
      ["Save", "Saves the note and all its lines, then returns to the list. Saving again rewrites the lines with what is on screen."],
      ["Discard", "Returns to the list without saving."],
      ["Select, then Delete", "In the list, tick notes and delete them for good."],
      ["Group By / Kanban view", "Group by Status or Customer, or see the notes as a board by status."]
    ],
    after: "Nothing outside the note itself. A delivery note does not reduce on-hand, does not post to the ledger and does not invoice the customer. Stock leaves through the Overview (Deliver or Issue to Project); the customer is billed from Sales or Accounting.",
    links: [
      { name: "Overview", how: "Use Deliver or Issue to Project there to actually take the goods out of stock.", to: "inv.onhand" },
      { name: "Material Issues", how: "For goods used on your own project rather than handed to a customer.", to: "inv.issues" },
      { name: "Production Runs", how: "A run can be picked as a line under Manufactured.", to: "mfg.runs" },
      { name: "Materials &amp; Remnants", how: "Made-to-size project items are listed under Project materials on a line.", to: "proj.materials" },
      { name: "Quotations",how: "Where the customer's order and invoice live.", to: "so.list" }
    ],
    mistakes: [
      ["Could not save: (reason)", "The note itself was not saved. Read the reason, correct it and save again."],
      ["Saved, but lines failed: (reason)", "The note was saved without its lines. Open it again, re-enter the lines and save."],
      ["Stock did not go down after marking Delivered", "That is by design: the note is paperwork. Post the stock movement on the Overview."],
      ["Delivery note number (number) is already used by another note. Type a different number, or leave the number empty on a new note to get the next free one.", "The number typed at the top belongs to another note in this company. Change it, or clear it on a new note and Orbit gives the next free number."]
    ],
    tips: [
      "A line with no item, no description and no quantity is dropped when you save.",
      "This form has no Print button of its own yet; the list's Export gives you the notes as a spreadsheet."
    ]
  },

  "inv.scrap": {
    title: "Scrap",
    what: "<b>Scrap</b> writes off stock that is damaged, spoiled or lost. Choosing it opens the <i>Scrap / write-off</i> dialog: pick the product, where it was, and how many. The quantity leaves stock and its cost is charged to your stock adjustment account, so both the count and the stock value stay truthful.",
    when: [
      "Goods are broken, spoiled, past their date or stolen and will never be sold or used.",
      "A delivery was damaged in your store after you had received it.",
      "You find a shortfall with a known cause and want it recorded as a write-off rather than a count correction."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Operations &rsaquo; Scrap</b>. For this example a shop found 3 cracked ceramic vases whose cost price is 14.50 each.",
      "The <i>Scrap / write-off</i> dialog opens over the screen you were on.",
      "Pick the vase in <b>Product</b>, or press the camera button and scan its barcode. You should see <i>Selected (product)</i> when a scan matches.",
      "Choose the <b>Location</b> the vases were in.",
      "Type 3 in <b>Quantity</b> and leave <b>Unit</b> on the product's stock unit.",
      "Click <span class='man-key'>Confirm</span>. You should see <i>Scrapped &amp; written off to expense</i>, and Orbit opens the Overview.",
      "On the Overview the vase shows 3 fewer, and its value is 43.50 lower.",
      "Open Stock Moves: a new row moves 3 vases from your location to <i>Inventory Adjustment</i>."
    ],
    fields: [
      ["Product", "The item being written off. Only Storable and Consumable products are listed when you have any.", "required"],
      ["Location", "Where the scrapped stock was. Shown when you have more than one internal location.", "optional"],
      ["Quantity", "How many are written off. It must be above zero.", "required"],
      ["Unit", "The unit you typed the quantity in; converted to the stock unit when a conversion exists.", "optional"]
    ],
    buttons: [
      ["Camera button", "Scans a barcode or QR code and selects the matching product."],
      ["Confirm", "Writes the stock off, posts its cost and opens the Overview."],
      ["Cancel", "Closes the dialog; nothing is written off."]
    ],
    after: "A stock move from the location to <b>Inventory Adjustment</b>, and an entry in the MISC journal for quantity times cost price: <b>Stock adjustment</b> debited, <b>Stock on hand</b> credited. The accounts come from <b>Settings &rsaquo; Companies &rsaquo; Stock accounting</b>, falling back to codes 6500 and 3100. A product with no cost price loses quantity only.",
    links: [
      { name: "Overview", how: "Where the lower quantity and value show.", to: "inv.onhand" },
      { name: "Stock Moves", how: "The write-off is listed as a move to Inventory Adjustment.", to: "inv.moves" },
      { name: "Cycle Count", how: "For differences found by counting rather than a known loss; it posts to the same adjustment account.", to: "inv.cyclecount" },
      { name: "Lots / Serials", how: "Scrap does not ask for a lot, so a lot's own on-hand is not reduced by it.", to: "lots" },
      { name: "Journal Entries", how: "The write-off entry in the MISC journal.", to: "moves" }
    ],
    mistakes: [
      ["Add a product first (Products screen)", "There are no active products. Create one first."],
      ["Quantity must be positive", "The quantity is empty, zero or negative."],
      ["Only 2 on hand here; you're moving 3. Not enough stock.", "The location holds fewer than you are scrapping. Check the location; an Inventory manager is offered <i>Post anyway and allow negative stock?</i>"],
      ["No product matches: (code)", "The scanned code is not the item code, the product id or the exact name of an active stocked product. Pick the product from the list instead."],
      ["Stock saved, but no stock account is set for this company - Settings, Companies, Stock accounting", "The quantity left stock but nothing was posted. Set the accounts, then check the value on the Overview."],
      ["Stock saved; GL post failed: Period locked on (date)", "The write-off is recorded, but its entry stays a draft because today is inside a locked period."]
    ],
    tips: [
      "A write-off cannot be undone from here. If you scrapped too many, bring them back with Adjust on the Overview.",
      "Write off the day you find the damage, so the loss lands in the right month."
    ]
  },

  "inv.reorder": {
    title: "Replenishment",
    what: "<b>Replenishment</b> is where you set a <b>Min</b> and a <b>Max</b> for each stocked product. When on-hand falls below Min, the row is flagged <i>Below min</i> and <b>To Order</b> shows how many bring it back up to Max. From here you can receive one item straight away or turn every shortfall into one draft purchase order.",
    when: [
      "You want Orbit to warn you before an item runs out.",
      "It is the weekly ordering day and you want one list of everything that is low.",
      "An urgent item has arrived and you want to receive it from the low-stock list."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Operations &rsaquo; Replenishment</b>. For this example a hardware shop holds 14 boxes of 50 mm screws and wants never to drop below 20.",
      "Find the screws row. Type 20 in <b>Min</b> and click away. You should see <i>Rule saved</i>.",
      "Type 60 in <b>Max</b> and click away. The row now reads <i>Below min</i> with <b>To Order</b> 46 (60 less the 14 on hand).",
      "Set Min and Max on the other items you reorder.",
      "At the top of the card click <span class='man-key'>Run scheduler (5)</span>, where 5 is the number of items below Min. You should see <i>Draft PO (number) created with 5 items</i> and the purchase order opens.",
      "On the order, choose the vendor, check the prices (they start at each product's cost price) and confirm it as usual.",
      "Alternatively, when goods are already at the door, click <span class='man-key'>Receive 46</span> on the row. The <i>Receive stock</i> dialog opens with the product and 46 filled in.",
      "Add a <b>Lot / Serial</b> and <b>Expiry</b> if the item is batch-tracked, choose the <b>Location</b> and click <span class='man-key'>Confirm</span>. You should see <i>Stock updated &amp; posted to the ledger</i>."
    ],
    fields: [
      ["Min (on a row)", "The lowest on-hand you accept. Below it the row is flagged and counted in Low-stock items. 0 means no rule.", "optional"],
      ["Max (on a row)", "The level a reorder tops up to. If it is below Min, Min is used.", "optional"],
      ["Product (Receive stock)", "Filled from the row you clicked.", "auto"],
      ["Location (Receive stock)", "Where the goods go. Shown when you have more than one internal location.", "optional"],
      ["Quantity (Receive stock)", "Filled with the To Order figure; change it to what arrived.", "required"],
      ["Unit (Receive stock)", "The unit of the quantity, converted to the stock unit when a conversion exists.", "optional"],
      ["Lot / Serial (optional)", "A batch or serial number. An existing lot of that name for the product is reused; otherwise a new lot is created.", "optional"],
      ["Expiry (optional)", "The best-before date of a new lot. It feeds the Expiring / expired lots tile.", "optional"]
    ],
    buttons: [
      ["Run scheduler (N)", "Shown when items are below Min. Creates one draft purchase order with a line per item for its To Order quantity at its cost price, then opens it."],
      ["Receive N", "On a row below Min. Opens the Receive stock dialog filled in for that item."],
      ["Confirm", "In Receive stock: adds the stock and posts its value."]
    ],
    after: "Min and Max are saved as a reordering rule the moment you leave the box; they change nothing in the books. <b>Run scheduler</b> creates a draft purchase order with no vendor, noted <i>Auto-generated from replenishment</i>. <b>Receive</b> adds stock and posts <b>Stock on hand</b> against <b>Received not invoiced</b> for quantity times cost price, in the MISC journal.",
    links: [
      { name: "Purchase Orders", how: "Run scheduler's draft order waits there for a vendor and confirmation.", to: "po.list" },
      { name: "Overview", how: "Low-stock items there counts the products below their Min.", to: "inv.onhand" },
      { name: "Planning", how: "Uses each Min as a floor on top of real demand from orders, take-offs and work orders.", to: "inv.planning" },
      { name: "Automations", how: "The Low stock alert rule warns you when an item falls to or below its Min.", to: "settings.automations" },
      { name: "Lots / Serials", how: "Lots created in Receive stock are listed there with their expiry.", to: "lots" }
    ],
    mistakes: [
      ["No storable products yet. Set a product's type to Storable to plan replenishment.", "No active product is Storable or Consumable. Change the type on the product form."],
      ["The draft order has no vendor", "Run scheduler does not choose one. Pick the vendor on the order before confirming."],
      ["An item with stock in two locations is flagged wrongly", "Min and On Hand are compared across all locations together, not per location."],
      ["Stock saved, but no stock account is set for this company - Settings, Companies, Stock accounting", "The receipt moved quantity but posted nothing. Set the stock accounts."]
    ],
    tips: [
      "Run scheduler prices each line at the product's cost price; update them to the supplier's quote on the order.",
      "Receiving here is the one receipt that asks for a lot and an expiry date; the Goods Receipt form on the Overview does not."
    ]
  },

  "inv.planning": {
    title: "Planning",
    what: "<b>Planning</b> nets what you need against what you have and what is already on order, then suggests exactly what to buy. <b>Demand</b> is what confirmed sales orders still have to deliver (the part of each line not yet invoiced), material take-offs not yet ordered, the components of open work orders (through the bill of materials chosen on each order) and your reorder minimums. <b>Supply</b> is on-hand plus the undelivered quantity on open purchase orders. One click turns the shortfall into a draft purchase order.",
    when: [
      "Before placing the week's purchase orders, so you buy for real demand and not by guesswork.",
      "After confirming a large sales order or raising work orders, to see what the components will cost you in purchases.",
      "When stock keeps running out even though Replenishment looks fine."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Operations &rsaquo; Planning</b>. For this example a joinery has confirmed an order for 30 kitchen doors and raised a work order for them; each door's bill of materials uses 0.5 sheets of MDF, and 4 sheets are on hand with 5 more on an open purchase order.",
      "Wait for the netting to finish. You should see three tiles, <b>Items planned</b>, <b>Short items</b> and <b>Suggested lines</b>, and a table sorted with the biggest shortfall first.",
      "Find the MDF row. <b>On hand</b> 4, <b>Incoming</b> 5, <b>Demand</b> 15 with the tag <i>Work orders</i>.",
      "Read <b>Net</b>: 4 + 5 - 15 = -6, shown in red. <b>Suggested</b> is 6 and the status is <i>Buy</i>.",
      "A row reading <i>Covered</i> has enough stock and incoming orders already.",
      "Click <span class='man-key'>Create draft PO (N)</span>. You should see <i>Draft PO (number) created with N items - pick the vendor and confirm</i>, and the order opens.",
      "Choose the vendor, check the prices and confirm the order. Open Planning again: the MDF now counts as Incoming and reads Covered."
    ],
    buttons: [
      ["Create draft PO (N)", "Shown when anything is short. Creates one draft purchase order with a line per short item for its Suggested quantity, in the product's unit, at its cost price, then opens it."]
    ],
    after: "Reading the plan changes nothing. <b>Create draft PO</b> adds a draft purchase order with no vendor, noted <i>Auto-generated from Planning (demand netting)</i>. Once that order is sent or confirmed, its lines count as Incoming the next time you open Planning.",
    links: [
      { name: "Quotations",how: "Confirmed orders add the part of each product line not yet invoiced to Demand.", to: "so.list" },
      { name: "Material Take-off", how: "Take-offs not yet ordered add their lines to Demand.", to: "pur.req" },
      { name: "Work Orders", how: "Open orders add the components of the bill of materials chosen on the order (the product's first one when the order names none) for the quantity still to make.", to: "mfg.wo" },
      { name: "Replenishment", how: "Each product's Min is added on top of Demand.", to: "inv.reorder" },
      { name: "Purchase Orders", how: "Sent and confirmed orders count as Incoming; the draft order is created there.", to: "po.list" },
      { name: "Overview", how: "On hand here is the same total, across all locations.", to: "inv.onhand" }
    ],
    mistakes: [
      ["Nothing to plan yet. Confirm a sales order, add a take-off, open a work order, or set a reorder minimum, and this nets the demand against your stock and open POs.", "There is no demand and no Min set. Add one of those and open Planning again."],
      ["Demand looks too high for an order already partly delivered", "A sales order line counts only what is not yet invoiced, because an order is invoiced as it is delivered. Create the invoice for the delivered part from the order and it leaves Demand."],
      ["A work order's components are missing", "Only open work orders with a bill of materials, chosen on the order or found through its product, are exploded, and a line with no product is ignored. Check the BOM's lines point at products."],
      ["The draft order has no vendor", "Planning does not choose a supplier. Pick one on the order before confirming."]
    ],
    tips: [
      "All quantities are in each product's stock unit.",
      "Suggested covers Demand plus Min, so an item with a Min shows a small buy even when today's orders are covered."
    ]
  },

  "inv.cyclecount": {
    title: "Cycle Count",
    what: "<b>Cycle Count</b> lets you count many items at one location in one sitting. Each row shows what Orbit <b>Expected</b>; you type what you <b>Counted</b>, the <b>Variance</b> appears, and <span class='man-key'>Post adjustments</span> writes one inventory adjustment per difference and posts it to the ledger.",
    when: [
      "A regular count of one aisle, one room or one group of products.",
      "The year-end stock take, location by location.",
      "Several items look wrong and you want to correct them together rather than one Adjust at a time."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Operations &rsaquo; Cycle Count</b>. For this example a pharmacy counts its cold room.",
      "Choose <i>Cold Room</i> in <b>Location</b>. The Expected column shows what Orbit holds there.",
      "Narrow the list with <b>Category</b> or by typing in <b>Filter products...</b>.",
      "Count the shelf and type each figure in <b>Counted</b>. Leave an item blank if you did not count it.",
      "Watch the <b>Variance</b>: +2 means you found 2 more than expected, -1 means one is missing. The line above the table reads, for example, <i>3 variances ready to post - 1 up, 2 down</i>.",
      "Click <span class='man-key'>Post adjustments</span> and confirm <i>Post 3 inventory adjustments? This updates stock and the ledger.</i>",
      "You should see <i>Posted 3 adjustments from the count</i>, and the list reloads with Expected now equal to what you counted."
    ],
    fields: [
      ["Location", "The internal location being counted. Expected is what Orbit holds at this location only.", "required"],
      ["Category", "Limits the list to the products in one Product Category, including its sub-categories, as set in Category on the product form.", "optional"],
      ["Filter products...", "Limits the list by product name or reference as you type.", "optional"],
      ["Counted (on a row)", "What is physically there. Blank means not counted and nothing is posted for that item.", "optional"],
      ["Variance (on a row)", "Counted minus Expected, worked out as you type.", "auto"]
    ],
    buttons: [
      ["Post adjustments", "Asks for confirmation, then posts one adjustment for every row whose count differs from Expected."]
    ],
    after: "Each variance becomes a stock move: a surplus from <b>Inventory Adjustment</b> into the location, a shortage from the location to Inventory Adjustment. Each posts an entry in the MISC journal for the difference times the cost price: <b>Stock on hand</b> against <b>Stock adjustment</b>, one way or the other. Products with no cost price change quantity only.",
    links: [
      { name: "Overview", how: "On-hand and value there change as soon as the count is posted.", to: "inv.onhand" },
      { name: "Stock Moves", how: "One adjustment row per variance.", to: "inv.moves" },
      { name: "Locations", how: "Add a location per aisle or room to count them separately.", to: "loc" },
      { name: "Product Categories", how: "The Category filter lists these categories.", to: "inv.cats" },
      { name: "Journal Entries", how: "The adjustment entries, one per variance.", to: "moves" }
    ],
    mistakes: [
      ["Nothing to post - no variances entered", "No Counted box differs from Expected. Type the counts first."],
      ["No storable products yet. Set a product's type to Storable to count it.", "No active product is Storable or Consumable."],
      ["Line failed: (reason)", "That one adjustment was not saved; the others were. Count that item again and post."],
      ["Counts disappeared when I changed Location", "The typed counts stay, but Expected and Variance are recalculated for the new location. Post each location before moving on."]
    ],
    tips: [
      "Count while nothing is moving in or out of the location; a delivery during the count makes Expected change under you.",
      "For a single item, Adjust on the Overview does the same thing."
    ]
  },

  "inv.cats": {
    title: "Product Categories",
    what: "<b>Product categories</b> group your products, for example Kitchenware with Glassware and Cutlery under it. The screen shows them as a tree with the number of products in each, and a second count including everything in its sub-categories. A product picks its category on the product form.",
    when: [
      "You are setting up your catalogue and want products grouped the way you think about them.",
      "You want to see how many products sit in each group.",
      "You want a Putaway Rule to cover a whole group of products."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Products &rsaquo; Product Categories</b>. For this example a homeware shop builds Kitchenware &rsaquo; Glassware.",
      "Click <span class='man-key'>New category</span>. Type <i>Kitchenware</i> in <b>Name</b>, leave <b>Parent category</b> on <i>None</i> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and Kitchenware at the top level.",
      "On the Kitchenware row click <span class='man-key'>+ sub</span>. The dialog opens with Kitchenware already chosen as the parent.",
      "Type <i>Glassware</i> and click <span class='man-key'>Save</span>. Glassware appears indented under Kitchenware.",
      "Open a product in Products, set its <b>Category</b> to Glassware and save.",
      "Back here, Glassware reads <i>1 product</i> and Kitchenware reads <i>0 (1 incl. sub) products</i>."
    ],
    fields: [
      ["Name", "The name of the group, as it shows in the Category list on a product.", "required"],
      ["Parent category", "The broader group this one sits under. <i>None</i> makes it a top-level category.", "optional"]
    ],
    buttons: [
      ["New category", "Opens a blank category dialog."],
      ["+ sub", "Adds a category under this one."],
      ["Edit", "Renames the category or moves it under another parent."],
      ["&times;", "Deletes the category after you confirm. Refused while it has sub-categories."],
      ["Save / Cancel", "In the dialog: save the category, or close without saving."]
    ],
    after: "Nothing in the books. A category is a label on products. Deleting one removes that label from its products; the products themselves stay.",
    links: [
      { name: "Products", how: "Each product's Category field picks from this tree.", to: "products" },
      { name: "Putaway Rules", how: "A rule can name a product category instead of a single product.", to: "inv.putaway" },
      { name: "Classification", how: "A separate pair of trees (Family and Type) that builds item codes. Categories are simpler groups.", to: "settings.classification" }
    ],
    mistakes: [
      ["Name required", "The Name box is empty."],
      ["This category has sub-categories - delete or move them first.", "Delete or re-parent the categories under it, then delete it."],
      ["Could not delete: (reason) / Could not save: (reason)", "The database refused the change. Read the reason and try again."],
      ["A category disappeared from the tree after changing its parent", "It was put under one of its own sub-categories, so neither is connected to the top of the tree any more. Avoid choosing a category's own child as its parent."]
    ],
    tips: [
      "Keep the tree shallow: two or three levels are enough for most businesses.",
      "Deleting asks <i>Any products in it just lose the category link.</i> Nothing else is removed."
    ]
  },

  "inv.recost": {
    title: "Recost from weight",
    what: "Bars and profiles are costed by weight: <b>weight per metre &times; stock length &times; the metal rate per kilogram</b>. This screen lists every active product that has a weight per metre, lets you type today's rate, previews what each cost becomes, and applies it to all of them, or to one family, in one go. Items whose cost came from a real purchase or was typed in are never touched.",
    when: [
      "The aluminium or steel rate has moved and your profile costs are out of date.",
      "You have just added the weight per metre and stock length to new profiles and want their cost worked out.",
      "Before pricing a big job, so estimates and work orders use today's metal cost."
    ],
    how: [
      "On the product form, fill in <b>Weight per metre (kg)</b> and <b>Stock length (mm)</b> for each profile. For this example a fabricator's glazing bead weighs 1.162 kg/m and is bought in 6100 mm bars.",
      "Open <b>Inventory &rsaquo; Products &rsaquo; Recost from weight</b>. You should see how many items are costed from weight, and the rate box already holding the rate most of them use.",
      "Type 12.00 in <b>Rate per kilogram</b>.",
      "Leave <b>Apply to</b> on <i>Every item costed by weight</i>, or pick one family to limit the change.",
      "Click <span class='man-key'>Show me what changes</span>. A table lists each item with its weight, length, <b>Cost now</b>, what it <b>Becomes</b> and the <b>Change</b>. The glazing bead becomes 85.06 (1.162 &times; 6.10 &times; 12.00).",
      "Check the summary line, for example <i>48 item(s): 31 would cost more, 12 less, 5 unchanged.</i>",
      "Click <span class='man-key'>Apply the new rate</span> and confirm <i>Recost 48 item(s) at (currency) 12 a kilogram? Purchase and typed-in costs are left alone.</i>",
      "You should see <i>48 item(s) recosted</i> and the screen reloads with the new costs."
    ],
    fields: [
      ["Rate per kilogram", "The metal price per kg in the company currency. Pre-filled with the rate most weight-costed items currently carry.", "required"],
      ["Apply to", "Every weight-costed item, only the items in one family, or <i>(no family)</i> for the items that have none. Each choice shows how many items it covers.", "optional"]
    ],
    buttons: [
      ["Show me what changes", "Previews the new cost of each item (the first 200 are listed) without saving anything."],
      ["Apply the new rate", "After you confirm, rewrites the cost price of every eligible item in the choice."]
    ],
    after: "Each recosted product gets a new <b>cost price</b> (kg/m &times; length in metres &times; rate, to 4 decimals), the rate is stored on it, its cost source becomes the weight model, and it carries a one-line note of the working and the date. No journal entry is made and stock already posted keeps its booked value; from now on the new cost values stock on the Overview, the next stock movements and work order material estimates.",
    links: [
      { name: "Products", how: "Weight per metre (kg) and Stock length (mm) on the product form are what bring an item onto this screen.", to: "products" },
      { name: "Overview", how: "The Value column uses the new cost price at once.", to: "inv.onhand" },
      { name: "Work Orders", how: "Estimated material cost uses component cost prices.", to: "mfg.wo" },
      { name: "Dies", how: "A die has its own weight per metre field, which this screen does not use.", to: "mfg.dies" }
    ],
    mistakes: [
      ["Put in a rate per kilogram first", "The rate box is empty or zero. Type a rate above zero."],
      ["No item here is priced by weight yet.", "No active product has a weight per metre above zero. Fill in Weight per metre and Stock length on the product form."],
      ["A profile I expected was not recosted", "Its cost came from a supplier price or was typed in, so it is protected. The note at the top counts how many items are left alone for that reason."],
      ["(number) item(s) recosted. (number) could not be saved. Apply the rate again to retry them.", "Shown with Apply to set to (no family) when some items did not save, for example because the connection dropped. Click Apply the new rate again: items already recosted simply get the same cost."]
    ],
    tips: [
      "Always preview first: a rate typed per tonne instead of per kilogram shows up immediately as costs a thousand times too high.",
      "If a product's stock length is blank, one metre is used."
    ]
  },

  "lots": {
    title: "Lots / Serials",
    what: "A <b>lot</b> is a batch, and a <b>serial</b> is one individual item's number. This screen lists every lot with its product, the quantity still in your internal locations, its expiry date and a status: <i>Expired</i>, <i>Expiring soon</i> (within 30 days) or <i>OK</i>. It is read-only; lots are created as stock moves in and out with a lot number.",
    when: [
      "You sell food, medicine, chemicals or anything with a use-by date and need to see what is about to expire.",
      "A supplier recalls a batch and you need to know how much of it you still hold.",
      "You want to check a serial number's item is still in stock."
    ],
    how: [
      "For this example a food wholesaler receives 100 jars of honey from batch HN-2026-031, best before 31 March 2027.",
      "Open <b>Inventory &rsaquo; Operations &rsaquo; Replenishment</b>. On the honey row, which is below its Min, click <span class='man-key'>Receive</span>.",
      "In <i>Receive stock</i>, set <b>Quantity</b> to 100, type <i>HN-2026-031</i> in <b>Lot / Serial (optional)</b>, pick 2027-03-31 in <b>Expiry (optional)</b> and click <span class='man-key'>Confirm</span>.",
      "Open <b>Inventory &rsaquo; Products &rsaquo; Lots / Serials</b>. You should see HN-2026-031, the honey, On Hand 100, the expiry date and the status <i>OK</i>.",
      "A customer takes 30 jars. On the Overview click <span class='man-key'>Deliver</span>, pick the honey, type 30 and type the same lot, <i>HN-2026-031</i>, in <b>Lot / Serial</b>. Confirm.",
      "Back on Lots / Serials the lot reads 70.",
      "From 1 March 2027 the status turns <i>Expiring soon</i>, and the lot counts in the <b>Expiring / expired lots</b> tile on the Overview while it still has stock."
    ],
    after: "Nothing. The screen only reads lots and their movements.",
    links: [
      { name: "Replenishment", how: "Its Receive stock dialog is where a lot and its expiry are entered on the way in.", to: "inv.reorder" },
      { name: "Overview", how: "The Deliver dialog records the lot going out, and the Expiring / expired lots tile counts lots expiring within 30 days that still have stock.", to: "inv.onhand" },
      { name: "Stock Moves", how: "The movements behind each lot's quantity.", to: "inv.moves" }
    ],
    mistakes: [
      ["No lots or serial numbers yet.", "No stock has been received or delivered with a lot number. Enter one in the Receive stock dialog."],
      ["A lot shows a negative quantity", "A delivery was given a lot name spelt differently, so Orbit created a new lot and took the stock out of it. Type lot numbers exactly as on the label."],
      ["The lot I received from the Overview is not here", "The Goods Receipt form behind Receive on the Overview, and receiving a purchase order, do not ask for a lot. Use the Receive stock dialog from Replenishment for batch-tracked goods."],
      ["A lot has no expiry date", "It was first created from a Deliver dialog, which has no expiry field."]
    ],
    tips: [
      "Only receipts and deliveries made with a lot number change a lot's quantity. Transfers, adjustments, scrap and issues do not ask for a lot, so a lot's figure can differ from the product's total on hand.",
      "The same lot name can be used by different products; each product keeps its own lot."
    ]
  },

  "wh": {
    title: "Warehouses",
    what: "A <b>warehouse</b> is a physical place you keep stock: a depot, a shop, a yard. Each warehouse holds one or more locations, and it is the locations that stock actually sits in. Orbit creates <i>Main Warehouse</i> for you the first time inventory is used, so you only add warehouses when you really have more than one site.",
    when: [
      "You open a second store, depot or yard.",
      "You want to rename the automatic Main Warehouse or give it a code.",
      "You are tidying up sites you no longer use."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Configuration &rsaquo; Warehouses</b>. For this example a wholesaler opens a second depot.",
      "Click <span class='man-key'>New</span>. The <i>New warehouse</i> dialog opens.",
      "Type <i>North Depot</i> in <b>Name</b> and <i>NTH</i> in <b>Code</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Warehouse added</i> and the new row in the list.",
      "Open the Overview. Orbit adds a stock location called <i>North Depot / Stock</i> for the new warehouse, and the location drop-down now lists it.",
      "To rename a warehouse, click its Name or Code in the list, type, and press Enter."
    ],
    fields: [
      ["Name", "What the warehouse is called. Its automatic stock location is named after it.", "required"],
      ["Code", "A short code such as WH or NTH.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New warehouse dialog."],
      ["Save / Cancel", "In the dialog: add the warehouse, or close without saving."],
      ["Name or Code cell", "Click to edit it in place. Enter or Tab saves, Escape cancels."],
      ["Select", "Tick warehouses to <span class='man-key'>Export selected</span>, <span class='man-key'>Archive</span> or <span class='man-key'>Delete</span> them. Delete is refused for a warehouse whose locations hold stock or have stock moves, and Orbit offers to archive it instead."],
      ["Search / Columns / Export", "Search by name or code, choose columns, and download the list as CSV."]
    ],
    after: "No accounting. The first time an inventory screen loads after you add a warehouse, Orbit gives it an internal location named <i>(warehouse) / Stock</i>. Receipts marked Warehouse on the Goods Receipt form go to Orbit's main stock location, not to a warehouse you choose, so move stock into the new site with Transfer on the Overview.",
    links: [
      { name: "Locations", how: "The shelves, rooms and areas inside each warehouse.", to: "loc" },
      { name: "Overview", how: "Filter on-hand by location and transfer stock between sites.", to: "inv.onhand" },
      { name: "Cycle Count", how: "Count one location of a warehouse at a time.", to: "inv.cyclecount" }
    ],
    mistakes: [
      ["Name required", "The Name box is empty."],
      ["Could not save: (reason)", "The warehouse was not added. Read the reason and try again."],
      ["The warehouse (name) has locations that hold stock or have stock moves, so it can't be deleted. Deleting it would delete those locations too, and the stock in them would stop counting.", "The warehouse has stock history, and deleting it would take its locations and that history with it. Click OK to archive it instead. Only a warehouse that has never held stock can be deleted."],
      ["An archived warehouse still appears", "Archive marks it archived, but this list and the stock screens still show and use it."]
    ],
    tips: [
      "One warehouse with one location is enough to start. Add sites only when you physically have them."
    ]
  },

  "loc": {
    title: "Locations",
    what: "A <b>location</b> is a place inside a warehouse where stock sits: an aisle, a back store, a cold room, a van. Only locations with the usage <b>internal</b> count as stock you hold. Orbit also keeps some locations of its own that stock comes from and goes to: <i>Vendors</i>, <i>Customers</i>, <i>Inventory Adjustment</i> and <i>Factory (WIP)</i>.",
    when: [
      "You want to know not just how many you have, but where they are.",
      "You want to count one area at a time in Cycle Count.",
      "You need a second location before you can use Transfer."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Configuration &rsaquo; Locations</b>. For this example a shop splits its stock between the shop floor and a back store.",
      "Click <span class='man-key'>New</span>. The <i>New stock location</i> dialog opens.",
      "Type <i>Back Store</i> in <b>Name</b> and pick the warehouse in <b>Warehouse</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Location added</i> and the row with Usage <i>internal</i>.",
      "Repeat for <i>Shop Floor</i>.",
      "On the Overview click <span class='man-key'>Transfer</span>, move 20 units of an item from the main stock location to Shop Floor and click Transfer. You should see <i>Transferred between locations</i>.",
      "Pick <i>Shop Floor</i> in the Overview's location drop-down: the item shows 20 there.",
      "Click <span class='man-key'>Group By</span> &rsaquo; <i>Usage</i> in Locations to see your internal locations apart from Orbit's own."
    ],
    fields: [
      ["Name", "What the location is called in every location picker.", "required"],
      ["Warehouse", "The warehouse it belongs to.", "required"],
      ["Usage (in the list)", "Click to change. <i>internal</i> is stock you hold and is the only usage that counts on hand and appears in the location pickers. New locations are always internal.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New stock location dialog."],
      ["Save / Cancel", "In the dialog: add the location, or close without saving."],
      ["Name or Usage cell", "Click to edit it in place."],
      ["Group By", "Groups by <i>Usage</i> or <i>Warehouse</i>."],
      ["Select", "Tick locations to export, archive or delete them. Delete is refused for a location that holds stock or has stock moves, and Orbit offers to archive it instead."],
      ["Search / Columns / Export", "Search by name or usage, choose columns, and download the list as CSV."]
    ],
    after: "No accounting. An internal location starts appearing in the Overview's location filter, the Location boxes of the stock dialogs, Cycle Count and Transfer.",
    links: [
      { name: "Warehouses", how: "Every location belongs to one.", to: "wh" },
      { name: "Overview", how: "Filter on-hand by location and move stock with Transfer.", to: "inv.onhand" },
      { name: "Cycle Count", how: "Counts one location at a time.", to: "inv.cyclecount" },
      { name: "Putaway Rules", how: "A rule names the location a product or category belongs in.", to: "inv.putaway" }
    ],
    mistakes: [
      ["Name required", "The Name box is empty."],
      ["Create a warehouse first (Configuration > Warehouses)", "There is no warehouse to put the location in. Opening the Overview creates Main Warehouse, or add one in Warehouses."],
      ["Stock vanished after changing a location's Usage", "Only internal locations count. Set the usage back to internal and the stock reappears."],
      ["The location (name) holds stock or has stock moves, so it can't be deleted. Deleting it would cut those moves loose, and the stock would stop counting.", "The location has stock history. Click OK to archive it instead. Orbit's own locations always have moves, so they are never deleted."]
    ],
    tips: [
      "Do not change the usage of Vendors, Customers, Inventory Adjustment, Factory (WIP) or a warehouse's Stock location: receipts, deliveries, adjustments and fabrication rely on them. Inventory Adjustment's own usage is not one of the choices in the list.",
      "Goods received with the destination Factory land in Factory (WIP)."
    ]
  },

  "inv.uoms": {
    title: "Units of Measure",
    what: "<b>Units of measure</b> are the units your company counts and measures in: each, box, kg, m, m2, litre. Each unit has a type, and it can be linked to a <b>base unit</b> with a factor, such as 1 box = 1.44 m2. With that link Orbit converts a quantity typed in one unit into the product's stock unit.",
    when: [
      "You buy in one unit and stock in another, such as boxes of tiles stocked in square metres.",
      "A product needs a unit that is not in the list yet.",
      "You want to retire a unit nobody should pick any more."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Configuration &rsaquo; Units of Measure</b>. For this example a tile shop stocks floor tiles in <i>m2</i> but receives them in boxes of 1.44 m2.",
      "Make sure a unit called <i>m2</i> exists with Type <i>Area</i>. If not, click <span class='man-key'>New</span>, type <i>m2</i>, choose <i>Area</i> and Save.",
      "Click <span class='man-key'>New</span> again. Type <i>box</i> in <b>Name</b> and choose <i>Area</i> in <b>Type</b>.",
      "Type <i>m2</i> in <b>Converts to (base unit)</b> and 1.44 in <b>1 box = ? base</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and the row reads <i>1 = 1.44 m2</i> in the Converts column.",
      "On the Overview click <span class='man-key'>Receive</span> or <span class='man-key'>Adjust</span> for a tile product whose unit is m2, and choose <i>box</i> in <b>Unit</b> with a quantity of 10.",
      "In the stock dialogs the line under Unit reads <i>= 14.4 m2 (stock unit)</i>. Confirm, and 14.4 m2 is added to stock."
    ],
    fields: [
      ["Name", "The short symbol, such as m2, kg, tube, box or sheet. It must match the product's unit exactly for a conversion to work.", "required"],
      ["Type", "What the unit measures: Unit, Length, Area, Volume or Weight. It groups the list.", "optional"],
      ["Converts to (base unit)", "The name of the unit this one converts into, such as m for km.", "optional"],
      ["1 (name) = ? base", "How many base units are in one of this unit, such as 1000 for km to m.", "optional"],
      ["Status", "<i>Active</i> units are offered in every unit list. <i>Archived</i> units stay on old records but are no longer offered.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank unit."],
      ["Click a row", "Opens the unit to edit it."],
      ["Save / Cancel", "Save the unit, or close without saving."],
      ["Delete", "On an existing unit, after you confirm. Records that already use it keep the text; it just disappears from the pickers."],
      ["+ Add a unit...", "At the bottom of Unit lists on stock dialogs, receipts and delivery notes. Creates a unit (Name / symbol, Type and an optional conversion) and selects it."],
      ["Group By / Search / Export", "Group by Type, search by name or type, and download the list as CSV."]
    ],
    after: "No accounting. Units are text on products and lines. When a quantity is typed in a unit that converts to the product's stock unit, the stock dialogs and the Goods Receipt form store the converted quantity; receiving against a purchase order also converts to the order line's unit before checking what is left to receive.",
    links: [
      { name: "Products", how: "The product's Unit of Measure is its stock unit, picked from the active units.", to: "products" },
      { name: "Overview", how: "The Unit box in each stock dialog shows the conversion as you type.", to: "inv.onhand" },
      { name: "Purchase Orders", how: "Receiving an order converts the received quantity into the order line's unit.", to: "po.list" },
      { name: "Delivery Notes", how: "Each line picks a unit from this list; delivery notes store the unit but do not convert.", to: "dn.list" }
    ],
    mistakes: [
      ["Name required", "The Name box is empty."],
      ["no conversion to (unit) - stored as entered", "The unit you chose has no direct link to the product's stock unit. Link one to the other here. Orbit only converts one step: a unit whose base is itself linked to another base is not followed further."],
      ["A unit is missing from a Unit list", "It is archived. Open it and set Status back to Active."],
      ["Could not save: (reason) / Could not delete: (reason)", "The database refused the change. Read the reason and try again."]
    ],
    tips: [
      "Define the conversion on the bigger unit (1 box = 1.44 m2) and keep the product's stock unit as the base.",
      "Spelling matters: <i>M2</i> and <i>m2</i> are different units to Orbit."
    ]
  },

  "settings.classification": {
    title: "Classification",
    what: "<b>Classification</b> holds two trees that describe every product, each answering a different question. The <b>Family</b> tree is <b>who makes it</b>: brand &rsaquo; series &rsaquo; model. The <b>Type</b> tree is <b>what it is</b>: material &rsaquo; group &rsaquo; part. Each node carries a short <b>code</b>, and a product picks from both trees on its form, so everyone describes items the same way and the item code can be built from the codes.",
    when: [
      "You are setting up the catalogue and want item names and codes to follow one system.",
      "A new brand, series or kind of item needs a place in the tree before products can use it.",
      "People type the same item in different ways and your reports no longer add up."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Configuration &rsaquo; Classification</b>. For this example a lighting wholesaler classifies a glass pendant lamp.",
      "In the Family tree card click <span class='man-key'>+ Add brand</span>. Type <i>Brightline</i> in <b>Name</b> and <i>BRL</i> in <b>Short code</b>, then Save. You should see <i>Saved</i> and the brand with its code.",
      "On the Brightline row click <span class='man-key'>+ sub</span>, add the series <i>Studio</i> with code <i>STU</i>. On Studio click <span class='man-key'>+ sub</span> again and add the model <i>S2</i> with code <i>S2</i>.",
      "In the Type tree card click <span class='man-key'>+ Add type</span> and add <i>Lighting</i> (<i>LGT</i>), then under it <i>Pendants</i> (<i>PND</i>), then under that <i>Glass pendant</i> (<i>GLS</i>).",
      "Open a new product in Products. In its Classification section choose Brightline, Studio, S2 and Lighting, Pendants, Glass pendant.",
      "You should see the <b>Item code</b> fill itself from the codes. When you save, Orbit adds a running number, such as <i>-001</i>, while the code has not been edited by hand."
    ],
    fields: [
      ["Name", "The brand, series, model, material, group or part, as people should see it.", "required"],
      ["Short code", "A few letters used to build item codes, such as AL for Aluminium. Saved in capitals.", "optional"]
    ],
    buttons: [
      ["+ Add brand", "Adds a top-level node to the Family tree."],
      ["+ Add type", "Adds a top-level node to the Type tree."],
      ["+ sub", "Adds a node under this one. Offered on the first two levels, so each tree is three levels deep."],
      ["Edit", "Changes the node's name or code."],
      ["Delete", "After you confirm <i>Delete this node?</i>: removes it and everything under it. Products pointing at it lose that classification but are not deleted."],
      ["Save / Cancel", "In the node dialog: save, or close without saving."]
    ],
    after: "No accounting. The trees belong to the whole organisation, so every company in it shares them. When a product is saved, the top Family name is copied onto the product as its <b>family</b>, which is what the Category filter in Cycle Count and the Apply to list in Recost from weight use. Renaming a node here does not rewrite item codes or family names already saved on products.",
    links: [
      { name: "Products", how: "The Classification section of the product form picks from both trees and builds the item code.", to: "products" },
      { name: "Cycle Count", how: "Its Category filter lists the families on products.", to: "inv.cyclecount" },
      { name: "Recost from weight", how: "Apply to can limit a recost to one family.", to: "inv.recost" },
      { name: "Product Categories", how: "A simpler, separate grouping of products.", to: "inv.cats" }
    ],
    mistakes: [
      ["Name is required", "The Name box in the node dialog is empty."],
      ["There are no Add, Edit or Delete buttons", "Changing the trees needs full access or permission to manage Settings or Inventory. Ask an administrator."],
      ["No classification tree yet.", "Shown on a product form while both trees are empty. Build the trees here first."],
      ["Products lost their classification", "A node they pointed at was deleted, which also deletes every node under it. Rebuild the node and pick it again on those products."]
    ],
    tips: [
      "Decide the codes before you add hundreds of products: codes already built into item codes do not change when you edit a node.",
      "Keep codes short and unique within a level, so item codes stay readable."
    ]
  },

  "inv.storage": {
    title: "Storage Categories",
    what: "A <b>storage category</b> describes a kind of storage space, such as frozen pallet racking or a small-parts shelf, with its maximum weight, its capacity and notes. At the moment it is a reference list: receipts, transfers and locations do not check it, and no other screen reads it.",
    when: [
      "You want one written list of the kinds of storage you have and their limits.",
      "You are planning how locations will be organised."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Configuration &rsaquo; Storage Categories</b>. For this example a frozen food distributor records its racking.",
      "Click <span class='man-key'>New</span>. The <i>New storage category</i> dialog opens.",
      "Type <i>Frozen pallet racking</i> in <b>Name</b>.",
      "Type 1000 in <b>Max weight</b> and 24 in <b>Capacity</b>, then <i>-22 C, pallets only</i> in <b>Notes</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row with Max weight 1,000.00 and Capacity 24.00.",
      "To change it, click the row, edit and Save."
    ],
    fields: [
      ["Name", "What the storage is called. Left blank it is saved as <i>Category</i>.", "optional"],
      ["Max weight", "The heaviest load it takes, in whatever unit you work in. For reference only.", "optional"],
      ["Capacity", "How much it holds, such as a number of pallet spaces. For reference only.", "optional"],
      ["Notes", "Conditions or restrictions, such as temperature.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank storage category."],
      ["Click a row", "Opens it to edit."],
      ["Save / Cancel", "Save, or close without saving."],
      ["Delete", "On an existing category. Deletes it after you confirm."],
      ["Search / Export", "Search by name and download the list as CSV."]
    ],
    after: "Nothing else changes. No accounting, and no stock rule is applied.",
    links: [
      { name: "Locations", how: "The places stock actually sits; they are not linked to a storage category on screen.", to: "loc" },
      { name: "Putaway Rules", how: "The written rules for where products belong.", to: "inv.putaway" }
    ],
    mistakes: [
      ["A category was deleted by mistake", "Delete does not ask first. Create it again with New."],
      ["Stock was put somewhere over its limit", "Orbit does not check storage categories when stock moves. Keep the limits in mind when you transfer."]
    ]
  },

  "inv.putaway": {
    title: "Putaway Rules",
    what: "A <b>putaway rule</b> says where a product, or every product in a category, should be stored: <i>when</i> it is this item, <i>store at</i> this location. The list is your team's reference for where goods belong. Orbit does not apply it on its own: the Goods Receipt form sends Warehouse lines to the main stock location, and you move them with Transfer.",
    when: [
      "New staff need to know where each kind of goods is put away.",
      "You want one agreed place per product or category written down.",
      "You are reorganising the store and want the new layout recorded."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Configuration &rsaquo; Putaway Rules</b>. For this example a builders' merchant keeps all cement in the dry store.",
      "Click <span class='man-key'>New</span>. The <i>New putaway rule</i> dialog opens.",
      "Leave <b>Product</b> on <i>(any)</i> and choose <i>Cement &amp; aggregates</i> in <b>Or product category</b>.",
      "Choose <i>Dry Store</i> in <b>Store at location</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a row reading <i>Category: Cement &amp; aggregates</i> under When and <i>Dry Store</i> under Store at.",
      "When cement arrives, receive it on the Overview, then use <span class='man-key'>Transfer</span> to move it to Dry Store as the rule says."
    ],
    fields: [
      ["Product", "The single product the rule is for. Leave <i>(any)</i> and pick a category instead to cover a group.", "optional"],
      ["Or product category", "The category the rule covers. If a product is also chosen, the list shows the product.", "optional"],
      ["Store at location", "Where the goods belong.", "required"]
    ],
    buttons: [
      ["New", "Opens a blank rule."],
      ["Click a row", "Opens the rule to edit."],
      ["Save / Cancel", "Save the rule, or close without saving."],
      ["Delete", "On an existing rule. Deletes it after you confirm."],
      ["Search / Export", "Search by product or category name and download the list as CSV."]
    ],
    after: "Nothing else changes. No stock moves and nothing is posted; receipts do not read the rules.",
    links: [
      { name: "Locations", how: "The Store at list offers every location.", to: "loc" },
      { name: "Product Categories", how: "A rule can cover a whole category.", to: "inv.cats" },
      { name: "Overview", how: "Receive goods, then Transfer them to the location the rule names.", to: "inv.onhand" }
    ],
    mistakes: [
      ["Pick a location", "Store at location is empty. Choose where the goods belong."],
      ["Received goods did not go to the rule's location", "Rules are not applied automatically. Transfer the goods on the Overview."],
      ["A rule was deleted by mistake", "Delete does not ask first. Create the rule again."]
    ],
    tips: [
      "Choose an internal location, not Vendors or Customers: only internal locations hold stock."
    ]
  },

  "inv.delivery": {
    title: "Delivery Methods",
    what: "A <b>delivery method</b> is one way you send goods out: your own van, a courier, a pallet carrier, customer collection. Each has a name, the carrier, a price and notes, and can be switched off when you stop using it. It is a reference list: delivery notes and orders do not pick from it yet.",
    when: [
      "You want the ways you ship, and what each costs, written down in one place.",
      "You change courier and want the old one switched off rather than lost."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Configuration &rsaquo; Delivery Methods</b>. For this example a garden centre records its local van delivery.",
      "Click <span class='man-key'>New</span>. The <i>New delivery method</i> dialog opens.",
      "Type <i>Local van delivery</i> in <b>Name</b>, <i>Own van</i> in <b>Carrier</b> and 25.00 in <b>Price</b>.",
      "Type <i>Within 15 km, Tuesday and Friday</i> in <b>Notes</b> and leave <b>Status</b> on <i>Active</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row showing the carrier, 25.00 and <i>Active</i>.",
      "When the service stops, open it, set Status to <i>Off</i> and Save. The row now reads <i>Off</i>."
    ],
    fields: [
      ["Name", "What the method is called. Left blank it is saved as <i>Delivery</i>.", "optional"],
      ["Carrier", "Who carries the goods.", "optional"],
      ["Price", "What the method costs or what you charge for it, for reference.", "optional"],
      ["Notes", "Areas, days or conditions.", "optional"],
      ["Status", "<i>Active</i> or <i>Off</i>.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank delivery method."],
      ["Click a row", "Opens it to edit."],
      ["Save / Cancel", "Save, or close without saving."],
      ["Delete", "On an existing method. Deletes it after you confirm."],
      ["Select", "Tick rows to export, archive or delete several at once. Archive sets them to Off."],
      ["Search / Export", "Search by name or carrier and download the list as CSV."]
    ],
    after: "Nothing else changes. No accounting, and no delivery charge is added to any document.",
    links: [
      { name: "Delivery Notes", how: "The paperwork for goods going out; the method is not chosen on the note.", to: "dn.list" },
      { name: "Package Types", how: "The other shipping reference list.", to: "inv.packages" }
    ],
    mistakes: [
      ["A method was deleted by mistake", "Delete on the dialog does not ask first. Create it again."],
      ["(reason) when saving", "The database refused the change. Read the message and try again."]
    ],
    tips: [
      "Prefer Off to Delete for a method you used before, so its details stay on record."
    ]
  },

  "inv.packages": {
    title: "Package Types",
    what: "A <b>package type</b> is a standard box, crate or pallet you ship in, with its length, width, height and maximum weight. It is a reference list for whoever packs the goods: no other screen reads it yet, so nothing is calculated from it.",
    when: [
      "Packers need the standard sizes and weight limits in one place.",
      "You are agreeing pallet or carton sizes with a carrier."
    ],
    how: [
      "Open <b>Inventory &rsaquo; Configuration &rsaquo; Package Types</b>. For this example a drinks wholesaler records its standard pallet.",
      "Click <span class='man-key'>New</span>. The <i>New package type</i> dialog opens.",
      "Type <i>Euro pallet</i> in <b>Name</b>.",
      "Type 120 in <b>Length</b>, 80 in <b>Width</b>, 150 in <b>Height</b> and 1000 in <b>Max weight</b>, using the same units for every package you add.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row <i>120 x 80 x 150</i> with Max weight 1,000.00.",
      "Add your cartons the same way so the list covers everything you pack."
    ],
    fields: [
      ["Name", "What the package is called. Left blank it is saved as <i>Package</i>.", "optional"],
      ["Length / Width / Height", "The outside dimensions. Orbit stores the numbers only, so keep one unit throughout.", "optional"],
      ["Max weight", "The heaviest load the package takes.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank package type."],
      ["Click a row", "Opens it to edit."],
      ["Save / Cancel", "Save, or close without saving."],
      ["Delete", "On an existing package type. Deletes it after you confirm."],
      ["Search / Export", "Search by name and download the list as CSV."]
    ],
    after: "Nothing else changes. No stock, weights or charges are worked out from package types.",
    links: [
      { name: "Delivery Methods", how: "The ways the packed goods are sent.", to: "inv.delivery" },
      { name: "Delivery Notes", how: "The paperwork that travels with the goods.", to: "dn.list" }
    ],
    mistakes: [
      ["A package type was deleted by mistake", "Delete does not ask first. Create it again."],
      ["(reason) when saving", "The database refused the change. Read the message and try again."]
    ],
    tips: [
      "Put the unit in the name if your team mixes units, for example <i>Carton 40x30x30 cm</i>."
    ]
  },

  "mfg.dies": {
    title: "Dies",
    what: "A <b>die</b> is the steel tool an extrusion press pushes metal through to make a profile. <b>Dies</b> is the register of them: the die number, the profile it makes, how many cavities it has, the weight per metre, where it is kept, who supplied it, its status and its lifetime <b>shot count</b>, so you know how hard each die has worked before it needs repair.",
    when: [
      "A new die arrives and needs registering against the profile it produces.",
      "A press session has finished and you want to add its shots to the die's total.",
      "A die goes for repair or is retired, and planning must not count on it."
    ],
    how: [
      "Open <b>Manufacturing &rsaquo; Dies</b>. For this example an aluminium extruder registers die D-1024 for a 45 mm window profile.",
      "Click <span class='man-key'>New</span>. Type <i>D-1024</i> in <b>Die no.</b> and <i>45 mm sash, 2 cavity</i> in <b>Name</b>.",
      "Choose the profile product in <b>Profile produced</b>, type 2 in <b>Cavities</b> and 0.845 in <b>Weight per metre (kg)</b>.",
      "Leave <b>Status</b> on <i>Active</i> and <b>Total shots</b> at 0. Type the rack in <b>Location</b> and the toolmaker in <b>Supplier</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the die in the list.",
      "After a press session, click the die. Under <b>Log a production run</b> type 120 in <b>Shots to add</b> and click <span class='man-key'>Add shots &amp; mark used today</span>.",
      "You should see <i>Logged 120 shots</i> and <b>Total shots</b> becomes 120 at once, without pressing Save.",
      "When the die goes for polishing, set <b>Status</b> to <i>In repair</i> and Save. Click <span class='man-key'>Filters</span> &rsaquo; <i>In repair</i> to see every die off the press."
    ],
    fields: [
      ["Die no.", "The number stamped on the die or its rack label, such as D-1024. The list is sorted by it.", "optional"],
      ["Name", "A description. Left blank it is saved as <i>Die</i>.", "optional"],
      ["Profile produced", "The product the die extrudes.", "optional"],
      ["Cavities", "How many profiles come out per shot. 1 unless you change it.", "optional"],
      ["Weight per metre (kg)", "The kg/m of the profile, for reference. It is separate from the weight per metre on the product.", "optional"],
      ["Status", "<i>Active</i>, <i>In repair</i> or <i>Retired</i>.", "optional"],
      ["Total shots", "The lifetime count. Normally grown with Add shots, but you can type a starting figure for a die that has already been used.", "optional"],
      ["Location", "Where the die is kept.", "optional"],
      ["Supplier", "Who made or repairs the die.", "optional"],
      ["Notes", "Repairs, wear, anything worth knowing.", "optional"],
      ["Shots to add", "Only on a saved die. The shots from one press session.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank die."],
      ["Click a row", "Opens the die to edit or log shots."],
      ["Add shots &amp; mark used today", "Adds the shots to the total and records today as the last-used date, saved immediately."],
      ["Save / Cancel", "Save the die, or close without saving the other fields."],
      ["Delete", "On an existing die. Deletes it after you confirm."],
      ["Filters", "<i>Active</i> or <i>In repair</i>."],
      ["Search / Columns / Export", "Search by die number, name, profile or supplier, and download the list as CSV."]
    ],
    after: "Nothing outside the register. Dies do not move stock, post to the ledger or change product costs.",
    links: [
      { name: "Products", how: "Profile produced picks the product the die makes.", to: "products" },
      { name: "Recost from weight", how: "Costs profiles from the product's own weight per metre, not the die's.", to: "inv.recost" },
      { name: "Work Orders", how: "Where the extruded profiles are actually made into stock.", to: "mfg.wo" }
    ],
    mistakes: [
      ["Enter shots to add", "Shots to add is empty or zero. Type the number of shots from the session."],
      ["Total shots went back down", "Shots were added, then Save was pressed with an older figure typed in Total shots. Save writes whatever is in that box; type the right total and Save again."],
      ["A die was deleted by mistake", "Delete does not ask first. Register it again with its shot count."],
      ["(reason) when saving", "The database refused the change. Read the message and try again."]
    ],
    tips: [
      "The last-used date is stored when you add shots, but it is not shown on this screen.",
      "Add shots straight after each session: the total is only as good as the logging."
    ]
  },

  "doc.search": {
    title: "Search & OCR",
    what: "<b>Search &amp; OCR</b> does two things. The search box finds document records in this company as you type: drawings by number, title or discipline, RFIs by number or subject, submittals by number or title, transmittals by number or recipient, and attached files by their caption. The OCR card reads the text out of a photo or scanned image in your browser, so you can copy it or search with it.",
    when: [
      "You know part of a drawing number or an RFI subject and want to find it fast.",
      "You have a photo of a drawing title block, a delivery note or a label and want its text without retyping it.",
      "You are not sure which register a document was logged in."
    ],
    how: [
      "Open <b>Documents &rsaquo; Search &amp; OCR</b>. For this example a contractor has a phone photo of a drawing title block and wants to find that drawing in the register.",
      "In the OCR card click the file box and pick the photo.",
      "Click <span class='man-key'>Extract text</span>. You should see <i>Loading OCR engine...</i>, then <i>Reading... 45%</i> climbing, then <i>Done</i>, with the text in the box below.",
      "Find the drawing number in the text, such as <i>A-201</i>.",
      "Type <i>A-201</i> in the search box at the top. After a moment you should see <i>1 match</i> and a row with a <b>Drawing</b> badge, the number and title, and its discipline and status.",
      "Click the row to open the Drawing Register.",
      "To reuse the text elsewhere, click <span class='man-key'>Copy text</span> and paste it where you need it."
    ],
    fields: [
      ["Search box", "At least two characters. Matches anywhere inside the fields listed above, ignoring capitals.", "required"],
      ["Image file", "A photo or scan. Only image files can be picked, not PDFs.", "required"],
      ["Extracted text", "Filled by Extract text. You can correct it before copying or searching.", "auto"]
    ],
    buttons: [
      ["Extract text", "Reads the English text out of the chosen image. The image is read in your browser; the text is not saved anywhere."],
      ["Copy text", "Copies the extracted text to the clipboard."],
      ["Search this text", "Puts the first six words of the extracted text into the search box and searches for them."],
      ["A result row", "Drawings, RFIs, submittals and transmittals open their register list. File results are shown but do not open."]
    ],
    after: "Nothing. Searching and extracting text change no records.",
    links: [
      { name: "Drawing Register", how: "Drawing results open here.", to: "doc.drawings" },
      { name: "RFIs", how: "RFI results open here.", to: "doc.rfis" },
      { name: "Submittals", how: "Submittal results open here.", to: "doc.subs" },
      { name: "Transmittals", how: "Transmittal results open here.", to: "doc.trans" }
    ],
    mistakes: [
      ["Type at least two characters to search across every document in this company.", "The search box has fewer than two characters."],
      ["No documents match (text).", "Nothing in the searched fields contains that exact text. Search for a shorter part, such as the number alone. Words inside uploaded files are not searched, only their caption."],
      ["Pick an image first", "Extract text was clicked before an image was chosen."],
      ["Could not load the OCR engine (check your connection)", "The reader is downloaded the first time it is used. Check the internet connection and try again."],
      ["Could not read that image", "The file could not be read. Try a clearer, straight-on photo in a common format such as JPG or PNG."],
      ["Search this text finds nothing", "It searches for the first six words as one phrase, which rarely matches. Delete all but the number or key word and search again."]
    ],
    tips: [
      "Crop the photo to the part you need, such as the title block: less background means faster, cleaner text.",
      "Results cover only the company you are working in."
    ]
  },

  "mfg.wo": {
    title: "Work Orders",
    what: "A <b>work order</b> is an instruction to make a quantity of one product from its <b>bill of materials</b>. It multiplies the recipe out, estimates the material cost, carries the <b>routing</b> steps the shop works through, and when you click <span class='man-key'>Complete &amp; consume</span> it takes the components out of stock and puts the finished goods in, carrying the cost of what went into them.",
    when: [
      "A customer order or a stock level needs a batch of something you make.",
      "The shop floor needs a list of steps to follow and to mark off as they go.",
      "A batch is finished and the stock and its value must be updated."
    ],
    how: [
      "Open <b>Manufacturing &rsaquo; Work Orders</b>. For this example a furniture workshop makes 20 oak chairs. Its BOM for one chair uses 1 seat panel (cost 22.00), 4 oak legs (6.50 each) and 16 wood screws (0.05 each).",
      "Click <span class='man-key'>New</span>. Pick the chair in <b>Product to fabricate</b>, its BOM in <b>Bill of materials</b> and the job in <b>Project / site</b>.",
      "Type 20 in <b>Quantity</b>, set the <b>Planned date</b> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a number such as WO/2026/0007.",
      "Read <b>Components for this quantity</b>: 20 seat panels, 80 legs and 320 screws, with <b>Estimated material cost</b> 976.00.",
      "Under <b>Routing / operations</b> type <i>Cut</i> with work centre <i>Saw bench</i> and 60 planned minutes, then <span class='man-key'>+ Add operation</span> for <i>Assemble</i> and <i>Finish</i>. Save.",
      "Click <span class='man-key'>Start</span>. You should see <i>Started</i> and the stage bar at <i>In progress</i>.",
      "As each step is finished set its <b>State</b> to <i>Done</i> and Save.",
      "Click <span class='man-key'>Complete &amp; consume</span>. You should see <i>Work order complete - 3 component(s) consumed, 20 produced (capitalised at (currency) 48.80/unit)</i>.",
      "The order is now <i>Done</i> and read-only. On the Overview the components are lower, 20 chairs are in stock, and the chair's cost price is 48.80."
    ],
    fields: [
      ["Product to fabricate", "The finished item. Only active products; <i>+ Add a new product...</i> creates one on the spot.", "optional"],
      ["Bill of materials", "The recipe to consume. Completion is refused without one. The list shows every BOM, so pick the one for this product.", "required"],
      ["Project / site", "The job the batch is for, used to find and group orders. Only active projects are listed.", "optional"],
      ["Quantity", "How many to make. Each component is multiplied by Quantity divided by the BOM's Output qty.", "optional"],
      ["Planned date", "When the batch is due, today unless you change it.", "optional"],
      ["Number", "Given on the first save, for example WO/2026/0007, in the format of the Work order row in Settings, Document Numbering, counting up from the highest number already used.", "auto"],
      ["Estimated material cost", "The saved BOM and quantity times today's component cost prices. A forecast; nothing is posted.", "auto"],
      ["Operation (routing)", "The step, such as Cut, Weld, Glaze or QC. A row with no operation name is dropped when you save.", "optional"],
      ["Work centre (routing)", "The machine, bay or team, typed freely.", "optional"],
      ["Planned min (routing)", "How many minutes the step should take.", "optional"],
      ["State (routing)", "Pending, In progress or Done. Completion is refused while any row is not Done.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank work order."],
      ["Save", "Saves the order and rewrites its routing rows from the screen. Refresh the Components table by saving after changing the BOM or quantity."],
      ["Discard", "Returns to the list without saving."],
      ["Start", "On a draft order: saves it and moves it to In progress."],
      ["Complete &amp; consume", "Saves, checks there is a BOM and every operation is Done, then consumes the components, books the finished goods in and marks the order Done."],
      ["+ Add operation / &times;", "Add a routing row, or remove one."],
      ["Delete", "After you confirm, deletes the order. Stock already moved by a completed order stays moved."],
      ["Filters / Group By", "Filter <i>Open</i> or <i>Done</i>; group by Status or Project."]
    ],
    after: "Saving and starting change nothing in stock or the books. <b>Complete &amp; consume</b> takes each component (BOM quantity times the factor) out of the main stock location and, for each, posts <b>Work in progress</b> debit and <b>Stock on hand</b> credit at its cost price, narrated <i>WIP consume</i>. It then brings the finished quantity into the main stock location and posts Stock on hand debit and Work in progress credit for the total absorbed (<i>WIP output</i>), and rewrites the finished product's cost price to that total divided by the quantity. The project is not charged at this point; it is charged when the finished goods are issued to it. If the company has no work-in-progress account, each component is posted to Cost of sales against the project instead and the finished goods move quantity only.",
    links: [
      { name: "Bills of Materials", how: "The recipe the order multiplies out and consumes.", to: "mfg.boms" },
      { name: "Overview", how: "Components go down and finished goods go up on completion.", to: "inv.onhand" },
      { name: "Stock Moves", how: "One move per component consumed and one for the finished goods.", to: "inv.moves" },
      { name: "Planning", how: "Open orders add their components to demand.", to: "inv.planning" },
      { name: "Panel Tracking", how: "A panel can name the work order that fabricates it.", to: "mfg.panels" },
      { name: "Material Issues", how: "Issue the finished goods to the project to charge their cost to it.", to: "inv.issues" },
      { name: "Journal Entries", how: "The WIP consume and WIP output entries.", to: "moves" }
    ],
    mistakes: [
      ["Set a BOM first so components can be consumed", "The order has no bill of materials. Pick one and try again, or record the batch as a Production Run."],
      ["Finish all routing operations first - 2 still open (Assemble, Finish)", "Those routing rows are not Done. Set them to Done and Save, or remove steps you do not use."],
      ["Already completed", "The order is Done. Raise a new one for more."],
      ["Save failed", "The changes to an existing order were not saved. Try again; if it repeats, reload the page."],
      ["Operations: (reason)", "The order saved but its routing rows did not. Re-enter them and Save."],
      ["Completed, but the finished goods are worth nothing", "The components had no cost price, so nothing was absorbed. Set cost prices on the components before completing the next order."],
      ["Completed, but a component was not consumed", "Only BOM lines that point at a product and have a quantity are consumed. Check the BOM's lines."],
      ["Stock went negative after completing", "Completion does not check availability. Receive or adjust the missing components on the Overview."]
    ],
    tips: [
      "There is no un-complete. Check the quantity before you click Complete &amp; consume.",
      "Each routing row keeps the time it was first set to In progress and the time it was set to Done. Saving the order again keeps those times; only changing a row's State stamps a new one."
    ]
  },

  "mfg.panels": {
    title: "Panel Tracking",
    what: "<b>Panel Tracking</b> gives every fabricated unit, such as a facade panel, a frame or a module, its own record with a scannable <b>code</b>, a mark, a zone and its size. Each panel moves through four states, <b>In fabrication</b>, <b>Ready to ship</b>, <b>Delivered</b> and <b>Installed</b>, and each step is date-stamped. A printed QR label opens the panel's record when scanned.",
    when: [
      "A job has many similar units and you must know where each one is.",
      "Site asks whether a particular panel has been delivered or fitted.",
      "You want labels on units so anyone with a phone can check and update them."
    ],
    how: [
      "Open <b>Manufacturing &rsaquo; Panel Tracking</b>. For this example a fabricator makes 24 panels for the north elevation of an office block.",
      "Click <span class='man-key'>Generate panels</span>. Choose the <b>Project</b> and <b>Product / type</b>, type <i>N-</i> in <b>Mark prefix</b>, 1 in <b>Start number</b>, 24 in <b>How many</b> and <i>North elevation</i> in <b>Zone</b>.",
      "Click <span class='man-key'>Generate</span>. You should see <i>24 panels generated</i> and panels N-01 to N-24, each <i>In fabrication</i>.",
      "Open N-01. Fill in <b>Width</b> and <b>Height</b>, choose the <b>Work order</b> making it, and Save.",
      "Click <span class='man-key'>QR label</span>, then <span class='man-key'>Print label</span>, and stick the label on the panel.",
      "When the panel is finished click <span class='man-key'>Mark ready</span>. You should see <i>Marked ready to ship</i> and the stage bar moves on.",
      "On site, scan the label with a phone signed in to Orbit. The panel opens; click <span class='man-key'>Mark delivered</span>, and later <span class='man-key'>Mark installed</span>.",
      "Back in the list, click <span class='man-key'>Filters</span> &rsaquo; <i>Installed</i>, or <span class='man-key'>Group By</span> &rsaquo; <i>Zone</i>, to see progress across the job."
    ],
    fields: [
      ["Panel mark / label (title)", "The mark on the drawings, such as P-101.", "optional"],
      ["Code (QR)", "The unique scannable code. Left blank it takes the mark. Two panels in a company cannot share a code.", "auto"],
      ["Project", "The job the panel belongs to. Only active projects are listed.", "optional"],
      ["Work order", "The work order that fabricates it.", "optional"],
      ["Product / type", "The kind of unit. Only active products are listed.", "optional"],
      ["Zone", "Elevation, grid or floor.", "optional"],
      ["Width / Height", "The panel's size, in the units your drawings use.", "optional"],
      ["Notes", "Anything particular to this unit.", "optional"],
      ["Project, Product / type, Zone (Generate)", "Applied to every panel in the batch.", "optional"],
      ["Mark prefix (Generate)", "The start of each mark, <i>P-</i> unless you change it.", "optional"],
      ["Start number (Generate)", "The first number in the batch. Numbers are padded to at least two digits, so they sort properly.", "optional"],
      ["How many (Generate)", "Up to 500 panels at a time.", "required"]
    ],
    buttons: [
      ["Generate panels", "Opens the dialog to create a numbered batch in one go."],
      ["New", "Starts a single blank panel, In fabrication."],
      ["Save / Discard", "Save the panel, or return to the list without saving."],
      ["QR label", "On a saved panel. Shows its QR code; <span class='man-key'>Print label</span> opens a print window."],
      ["Mark ready / Mark delivered / Mark installed", "Only the next step is offered. Saves the form, moves the panel on and stamps the date."],
      ["Delete", "After you confirm, deletes the panel."],
      ["Filters / Group By", "Filter by state; group by Project, State or Zone."]
    ],
    after: "Nothing in stock or the books. A panel is a tracking record: generating or advancing panels does not fabricate, move or value anything. The dates each state was reached show at the foot of the panel.",
    links: [
      { name: "Work Orders", how: "The work order that actually consumes materials and makes the stock.", to: "mfg.wo" },
      { name: "Projects", how: "Panels are grouped and filtered by project.", to: "proj.list" },
      { name: "Install Jobs", how: "The installation work on site that fits the panels.", to: "inst.jobs" },
      { name: "Delivery Notes", how: "The paperwork that goes with a load of panels.", to: "dn.list" }
    ],
    mistakes: [
      ["Enter how many", "How many is empty or below 1."],
      ["Max 500 at a time", "Generate in batches of 500 or fewer, starting the next batch where the last ended."],
      ["Generate failed: A record with (the code) already exists. Use a different one.", "One of the new codes is already used by a panel in this company. Change the prefix or the start number."],
      ["Save failed", "The panel was not saved, often because its Code (QR) is already used by another panel. Change the code and save again."],
      ["Scanned code not found: (code)", "No panel, tool or product in the company you are signed in to has that code. Check the company and the panel's Code (QR)."],
      ["Allow pop-ups to print the label", "The browser blocked the print window. Allow pop-ups for Orbit and click Print label again."],
      ["A panel was advanced by mistake", "There is no button to step back. Note it on the panel; the state and its date stay as recorded."]
    ],
    tips: [
      "Scanning opens Orbit, not a public page, so only people signed in to the company can see or update a panel."
    ]
  },

  "mfg.runs": {
    title: "Production Runs",
    what: "A <b>production run</b> records a batch made without a bill of materials: you name it, say what came out and list what was consumed. Saving it with the status <b>Done</b>, or dropping its card on Done in the board view, moves the stock: the materials leave, the output arrives carrying their cost, and the output product's cost price is updated. Use it for one-off batches, or to record something already made.",
    when: [
      "A batch has no fixed recipe worth writing as a bill of materials.",
      "You are recording production after the event.",
      "The output needs to appear as a Manufactured line on a delivery note."
    ],
    how: [
      "Open <b>Manufacturing &rsaquo; Production Runs</b>. For this example a bakery makes a one-off batch of 200 festival loaves from 90 kg of flour (cost 0.80 a kg) and 2 kg of salt (cost 0.50 a kg).",
      "Click <span class='man-key'>New</span>. Type <i>Festival loaves, 200</i> in the name at the top and your batch number in <b>Reference</b>.",
      "Choose <i>Festival loaf</i> in <b>Output product</b> and type 200 in <b>Output quantity</b>. Set the <b>Date</b>.",
      "Under <b>Materials consumed</b> pick the flour under <i>Stock products</i> in <b>Item</b>, type 90 in <b>Qty</b> and <i>kg</i> in <b>Unit</b>.",
      "Click <span class='man-key'>+ Add material</span> and add the salt, 2 kg.",
      "Leave <b>Status</b> on <i>Draft</i> and click <span class='man-key'>Save</span>. You should see <i>Saved</i>; nothing has moved yet.",
      "When the loaves are out of the oven, open the run, set <b>Status</b> to <i>Done</i> and click <span class='man-key'>Save</span>.",
      "You should see <i>Done - materials consumed and output added to stock</i>. On the Overview flour is 90 kg lower, salt 2 kg lower, 200 loaves are in stock, and the loaf's cost price is 0.365 (73.00 divided by 200)."
    ],
    fields: [
      ["Name (title)", "What was produced, such as <i>Batch of 20 window frames</i>.", "required"],
      ["Reference", "Your own reference or work-order number.", "optional"],
      ["Project", "The job the production is for.", "optional"],
      ["Output product", "The finished catalogue item. Without it the materials are consumed but nothing is added to stock.", "optional"],
      ["Output quantity", "How many finished units the run produced. 1 unless you change it.", "optional"],
      ["Date", "The day of the run. The stock moves carry this date.", "optional"],
      ["Status", "Draft, In progress, Done or Cancelled. Saving with Done moves the stock, once.", "optional"],
      ["Item (on a line)", "A stock product or a project material, or <i>(free text)</i>. Only stock product lines move stock.", "optional"],
      ["Description (on a line)", "What was used. Filled from the item when empty.", "optional"],
      ["Qty (on a line)", "How much was used, in the product's stock unit.", "optional"],
      ["Unit (on a line)", "A label for the quantity, <i>pcs</i> unless you change it. It is not converted.", "optional"],
      ["Notes", "Anything worth recording about the run.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank run."],
      ["+ Add material / &times;", "Add a line, or remove one."],
      ["Save", "Saves the run and rewrites its lines; with status Done, also moves the stock the first time."],
      ["Discard", "Returns to the list without saving."],
      ["Select, then Delete", "In the list, tick runs and delete them. Stock already moved stays moved."],
      ["Group By / Kanban view", "Group by Status or Project, or see the runs as a board by status. Dropping a card on Done moves the stock exactly as saving the run as Done does, once."]
    ],
    after: "Nothing moves until the run is saved as Done. Then each stock product line with a quantity moves from the main stock location to Customers and posts <b>Work in progress</b> against <b>Stock on hand</b> at its cost price. The output moves into the main stock location and posts Stock on hand against Work in progress for the total absorbed, and the output product's cost price becomes that total divided by the output quantity. The journal entries are dated the day you save. The run is then flagged, so saving it again never moves the stock a second time. If the company has no work-in-progress account, the consumption is tagged to the project with no posting and the output moves quantity only.",
    links: [
      { name: "Work Orders", how: "Use one instead when the item has a bill of materials and routing.", to: "mfg.wo" },
      { name: "Overview", how: "Where the consumed materials and the output show.", to: "inv.onhand" },
      { name: "Delivery Notes", how: "A run can be a Manufactured line on a note.", to: "dn.list" },
      { name: "Materials &amp; Remnants", how: "Project materials can be listed as consumed, for the record; they do not move stock.", to: "proj.materials" },
      { name: "Journal Entries", how: "The WIP consume and WIP output entries.", to: "moves" }
    ],
    mistakes: [
      ["Name is required", "The name at the top is empty."],
      ["Could not save: (reason)", "The run was not saved. Read the reason and try again."],
      ["Saved, but lines failed: (reason)", "The run saved without its lines. Open it, re-enter the materials and save."],
      ["The run is now Done, but its materials could not be read, so no stock moved. Open the run and click Save to move the stock.", "The card was dropped on Done but its material lines could not be loaded. Open the run and click Save: the stock moves then, and only once."],
      ["I changed the materials after it was Done, but stock did not change", "A run moves stock once. Correct the difference with Adjust on the Overview."],
      ["Stock saved, but no stock account is set for this company - Settings, Companies, Stock accounting", "The quantities moved but nothing was posted. Set the stock accounts in Settings, Companies."]
    ],
    tips: [
      "Complete the lines before setting Done: the materials are taken exactly as listed at that save.",
      "If you record the same run a third time, write its bill of materials and use a work order instead."
    ]
  },

  "mfg.boms": {
    title: "Bills of Materials",
    what: "A <b>bill of materials</b> (BOM) is the recipe for something you make: the finished product, how many one recipe yields (<b>Output qty</b>), and each component with its quantity. In Manufacturing a work order uses it to consume components and produce stock. The same screen is <b>Recipes</b> in the Kitchen app, where a recipe is what the price list, menu engineering and cost variance use to work out what a dish or drink costs and what it should consume.",
    when: [
      "You make a product from other products and want its recipe written once.",
      "A work order needs a BOM before it can be completed.",
      "A menu item needs a recipe so its plate cost and theoretical usage are real."
    ],
    how: [
      "Open <b>Manufacturing &rsaquo; Bills of Materials</b>, or <b>Kitchen &rsaquo; Menu &rsaquo; Recipes</b>. For this example a cafe bakes banana bread in loaves of 10 slices and sells it by the slice.",
      "Click <span class='man-key'>New</span>. Type <i>Banana bread, 10 slices</i> in the name.",
      "Choose <i>Banana bread slice</i> in <b>Finished product</b>. If it does not exist yet, pick <i>+ Add a new product...</i> and create it.",
      "Type 10 in <b>Output qty</b>, because one bake makes 10 slices.",
      "On the first component line pick <i>Plain flour</i>. The description and unit fill in. Type 0.25 in <b>Qty</b>.",
      "Click <span class='man-key'>+ Add a component</span> for bananas 0.6, sugar 0.15 and butter 0.1, all in kg.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the list shows the BOM, <b>Produces</b> Banana bread slice, <b>Output qty</b> 10.",
      "With flour at 1.20, bananas 1.50, sugar 1.00 and butter 8.00 a kg, the batch costs 2.15, so the Kitchen's plate cost for one slice works out at 0.215.",
      "A work order for 30 slices with this BOM consumes three times each line: 0.75 kg flour, 1.8 kg bananas, 0.45 kg sugar and 0.3 kg butter."
    ],
    fields: [
      ["BOM name (title)", "A name you will recognise in a list. Left blank it is saved as <i>BOM</i>.", "optional"],
      ["Finished product", "The item this recipe produces. Planning, plate cost and cost variance find the recipe through this product, so set it.", "optional"],
      ["Output qty", "How many finished units one run of the recipe makes. Work orders divide their quantity by it. Blank or 0 is saved as 1.", "optional"],
      ["Component (on a line)", "The product consumed. Only lines with a product are consumed or costed. <i>+ Add a new product...</i> creates one.", "optional"],
      ["Description (on a line)", "Filled from the component. A line with neither a component nor a description is dropped.", "optional"],
      ["Qty (on a line)", "How much of the component one run uses, in the component's stock unit.", "optional"],
      ["Unit (on a line)", "Filled from the component's unit. A label only; quantities are not converted.", "optional"],
      ["Waste % (on a line)", "The extra quantity lost in trimming, spillage or offcuts, as a percentage of Qty. The Kitchen's plate cost and cost variance add it on top of Qty; work orders and Planning use Qty as typed. 0 unless you change it, and kept every time you save.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank BOM."],
      ["+ Add a component / &times;", "Add a component line, or remove one."],
      ["Save", "Checks the recipe does not use itself or loop through another BOM, then saves it and rewrites all its lines from the screen."],
      ["Discard", "Returns to the list without saving."],
      ["Delete", "After you confirm, deletes the BOM and its lines. Work orders that used it lose their BOM."],
      ["Select / Search / Export", "In the list: delete several, search by name or product, and download as CSV."]
    ],
    after: "Saving moves no stock and posts nothing. The recipe is then used in four places: a <b>work order</b> consumes its components on completion; <b>Planning</b> explodes open work orders into component demand; the Kitchen <b>Price list</b> and <b>Menu engineering</b> read its <b>plate cost</b>; and <b>Cost variance</b> multiplies recipes by till sales to find what should have been used. Plate cost and cost variance take the first recipe found for a product, follow recipes inside recipes, and also apply each line's Waste % and a batch yield percentage when one is stored on the recipe; the yield is not shown on this screen.",
    links: [
      { name: "Work Orders", how: "Pick the BOM on an order; completing it consumes the components.", to: "mfg.wo" },
      { name: "Planning", how: "Open work orders are exploded through the product's BOM.", to: "inv.planning" },
      { name: "Price list", how: "Kitchen: shows each item's plate cost from its recipe.", to: "menu.prices" },
      { name: "Menu engineering", how: "Kitchen: margins use the plate cost from the recipe.", to: "menu.engineering" },
      { name: "Cost variance", how: "Kitchen: recipes times sales give the theoretical usage.", to: "sc.variance" },
      { name: "Products", how: "Components and finished products, and the cost prices a recipe is costed from. Called Items in the Kitchen.", to: "products" }
    ],
    mistakes: [
      ["A product can't be a component of itself. Remove the finished product from the component lines.", "One of the lines is the finished product. Remove that line."],
      ["This BOM would create a loop: &quot;(component)&quot; already consumes this finished product through its own bill of materials. Remove it.", "That component's own recipe uses this product, somewhere down the chain. Remove the line or fix the other BOM."],
      ["Save failed", "Changes to an existing BOM were not saved. Try again."],
      ["Components failed: (reason)", "The BOM saved but its lines did not, and the old lines are already gone. Re-enter the components and Save."],
      ["Set a BOM first so components can be consumed", "Shown on a work order, including one whose BOM was deleted. Pick a BOM on the order."],
      ["The plate cost is zero", "The components have no cost price, or the lines have no product. Set cost prices on the ingredients."]
    ],
    tips: [
      "Keep one recipe per finished product: plate cost, cost variance and Planning use whichever they find first.",
      "Saving rewrites every line from the screen, Waste % included, so check the figures before you save.",
      "Write the recipe per natural batch (a tray, a mix, a sheet) and set Output qty to what it yields."
    ]
  }

});
