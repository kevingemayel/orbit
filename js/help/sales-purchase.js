/* Orbit screen help: Sales, Purchase, CRM and Estimation.
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
 * <span class='man-key'>Save draft</span> for a button name.
 */
orbitScreenHelp({

  "so.list": {
    title: "Quotations",
    what: "A <b>quotation</b> is a price offer you give a customer before they say yes. Once they accept, you <b>Confirm</b> it and it becomes a <b>sales order</b>, and from the order you create the invoice. The list shows every quotation and sales order for the company; opening one shows the document itself. A quotation changes nothing in your accounts.",
    when: [
      "A customer asks what something would cost, and you want to send a priced offer.",
      "A customer has accepted a price and you want to record the deal as a sales order.",
      "A confirmed order is ready to bill, and you want the invoice built from the same lines.",
      "You want to find an old offer, or see which quotations never turned into orders."
    ],
    how: [
      "Open <b>Sales &rsaquo; Orders &rsaquo; Quotations</b> and click <span class='man-key'>New</span>. For this example, an office supplies wholesaler is quoting a hotel 40 desk chairs at 85.00 each plus 11% VAT.",
      "Pick the <b>Customer</b>. If the hotel is not in the list, choose <i>+ Add a new customer...</i> at the bottom of the list, type the name and click <span class='man-key'>Create &amp; select</span>.",
      "Check the <b>Order Date</b>, and type the customer's reference in <b>Reference / Note</b> if they gave one, for example <i>Enquiry 118</i>.",
      "On the first line, search for the chair in <b>Product</b>. You should see the description, the unit, the price and the sales tax fill in from the product.",
      "Type 40 in <b>Qty</b> and check the <b>Price</b> is 85.00 and <b>Tax</b> is the 11% VAT. The line's Subtotal shows 3,400.00.",
      "Check the totals under the lines: Untaxed Amount 3,400.00, Taxes 374.00, Total 3,774.00.",
      "Click <span class='man-key'>Save</span>. You should see a number such as <i>SO/2026/0007</i> and the stage still on <b>Quotation</b>. Click <span class='man-key'>Print</span> to send the customer a copy.",
      "When the hotel accepts, open the quotation and click <span class='man-key'>Confirm</span>. The stage moves to <b>Sales Order</b> and the lines become read-only.",
      "When you are ready to bill, click <span class='man-key'>Create Invoice</span>. Orbit opens a draft invoice with the same lines; check it and post it from there."
    ],
    fields: [
      ["Customer", "Who the offer is for. Only contacts marked as a customer appear. <i>+ Add a new customer...</i> creates one without leaving the form. The list has no empty choice, so check it shows the right name before saving. If the customer has a pricelist on their contact card, it prices the lines you add.", "required"],
      ["Project", "The job this sale belongs to, if any, listed as its code and name. It is copied onto the invoice you create from the order. <span class='man-key'>+ New</span> opens a small <b>New project</b> box with the project's name and its code, so you can start one on the spot.", "optional"],
      ["Currency", "Always the company currency on this screen. It cannot be changed here.", "auto"],
      ["Order Date", "The date of the offer or the order. It starts as today.", "auto"],
      ["Reference / Note", "Any note you want on the document, for example the customer's enquiry number. It prints under Reference.", "optional"],
      ["Product (on a line)", "Type part of a name or code to search your products. Picking one fills the description, the unit, the Sales price and the sales tax. When the customer has a pricelist, the price is then replaced by the pricelist price.", "optional"],
      ["Description (on a line)", "What the line is for, as the customer will read it. A line with no description and no amount is ignored when you save.", "optional"],
      ["Qty (on a line)", "How many. It starts at 1.", "required"],
      ["Unit (on a line)", "The unit of measure, filled from the product. <i>+ Add a unit...</i> creates a new one.", "optional"],
      ["Price (on a line)", "The price of one, before tax. The line Subtotal is Qty times Price.", "required"],
      ["Tax (on a line)", "The tax added to the line, from your list of taxes. Choose No tax for none.", "optional"],
      ["Pos (on a line)", "The line's position number, 1, 2, 3 and so on. It renumbers itself when you add or remove lines.", "auto"],
      ["Untaxed Amount, Taxes, Total", "Worked out from the lines as you type.", "auto"]
    ],
    buttons: [
      ["New", "Starts a blank quotation."],
      ["Save", "Saves the quotation. It gets its number the first time and stays a quotation you can change."],
      ["Confirm", "Saves the quotation and turns it into a sales order. If an approval rule covers sales orders of this amount, it goes to the approver first and stays a quotation; once approved, click Confirm again."],
      ["Discard", "Goes back to the list without saving what you changed."],
      ["+ Add a line", "Adds an empty line. The &times; at the end of a line removes it."],
      ["Create Invoice", "Shown on a confirmed sales order. Creates a draft customer invoice dated today, due in 30 days, with the order's lines, tax and project, and opens it."],
      ["Edit", "Shown on a confirmed sales order to people who can manage Sales. Opens its lines and details for changes: prices, quantities, new lines. A line already invoiced cannot go below the invoiced quantity, change product or be removed, and invoices already made are not changed. A higher total goes through the approval rules first. <b>Save changes</b> keeps the order confirmed, and the version before is kept under <i>Edited after confirming</i>; <b>Cancel</b> leaves it as it was."],
      ["&#8249; and &#8250;", "Beside the title when you opened the document from the list. Step to the previous or next one in the list's order without going back to it. Alt and the left or right arrow key do the same."],
      ["Print", "Prints the document, or saves it as a PDF from the print window."],
      ["Invoices", "The counter at the top of an order that has been invoiced. Opens the first invoice made from it."],
      ["Select, Export, Filters, Group By, Columns", "On the list: Filters show only Quotations or only Sales Orders, Group By gathers them by customer or status, Columns picks what shows, Export downloads the list as a CSV file."]
    ],
    after: "A quotation and a sales order change nothing in your accounts or your stock. The money only moves when you post the invoice made from the order: the customer then owes you and the sale counts in your reports. The invoice carries the order's project, so it counts in that project's figures once posted.",
    links: [
      { name: "Invoices", how: "Create Invoice on a sales order opens a draft invoice here with the same lines.", to: "inv.out" },
      { name: "Customers", how: "Every quotation belongs to a customer; their pricelist is set on their contact card.", to: "cust" },
      { name: "Products", how: "Picking a product fills the description, unit, price and sales tax.", to: "products" },
      { name: "Pricelists", how: "A customer's pricelist replaces the product price on the lines you add.", to: "sale.pricelists" },
      { name: "Quotation Templates", how: "Create quotation on a template starts a quotation with its lines already filled in.", to: "sale.qtempl" },
      { name: "Leads", how: "Create Quotation on a lead starts a draft quotation for that lead's customer.", to: "crm.leads" },
      { name: "Approval Rules", how: "A rule for sales orders above an amount makes Confirm wait for the approver.", to: "approvals.rules" },
      { name: "Tenders", how: "For a priced bid with a cost breakdown and margin, use a tender instead.", to: "est.list" }
    ],
    mistakes: [
      ["Pick a customer", "There is no customer to choose. Add one with <i>+ Add a new customer...</i> or in Customers."],
      ["Add at least one line", "Every line is empty. Give at least one line a description or an amount."],
      ["Sent for approval (amount)", "Not an error: an approval rule covers sales orders of this amount. It stays a quotation until the approver decides; then click Confirm again."],
      ["Already awaiting approval", "You clicked Confirm again before the approver decided. Wait for the decision in Approvals."],
      ["Someone else changed this quotation while you had it open. Your changes were not saved - reload the page to get the latest version, then re-enter them.", "Another person saved the same quotation after you opened it. Reload, then make your change again."],
      ["The price is not the one on the customer's pricelist", "The pricelist price is only applied when you pick the product on a line. Pick the customer first, then add the lines; changing the customer afterwards does not reprice lines already there."],
      ["Two invoices for the same order", "Create Invoice stays on a sales order after you use it, and each click makes another draft invoice. Check the Invoices counter at the top before clicking, and delete a duplicate draft from Invoices."]
    ],
    tips: [
      "Save a quotation before you print it so the printout carries its number.",
      "The Quotations filter on the list is the quickest way to see offers that were never confirmed.",
      "A quotation made from a template or a lead starts with the first customer in the list selected when none was set. Check the Customer before you save."
    ]
  },

  "sale.pricelists": {
    title: "Pricelists",
    what: "A <b>pricelist</b> is a set of special prices for the customers you give it to: a fixed price for an item, or a percentage off its normal Sales price. You create the pricelist here, then choose it on a customer's contact card. From then on, when you add a product to a quotation for that customer, Orbit uses the pricelist price.",
    when: [
      "A trade customer or a reseller gets a discount on some or all of your products.",
      "You have agreed a fixed price for an item with one or more customers.",
      "A pricelist is out of date and needs new rates, or should be archived."
    ],
    how: [
      "Open <b>Sales &rsaquo; Configuration &rsaquo; Pricelists</b> and click <span class='man-key'>New</span>. For this example, a coffee roaster gives cafe customers 10% off everything and a fixed 18.00 on its 1 kg house blend.",
      "Type the name at the top, for example <i>Cafe trade prices</i>. Leave <b>Currency</b> as your company currency and <b>Active</b> on Active.",
      "On the first rule, leave <b>Product</b> on <i>(any product)</i>, leave <b>Fixed price</b> empty and type 10 in <b>% off</b>.",
      "Click <span class='man-key'>+ Add rule</span>. Pick the house blend in <b>Product</b> and type 18.00 in <b>Fixed price</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the two rules still there.",
      "Open the cafe's contact card in Customers, choose <i>Cafe trade prices</i> as its pricelist and save.",
      "Start a quotation for that cafe and add the house blend. You should see the price change to 18.00. Add any other product and you should see its Sales price less 10%."
    ],
    fields: [
      ["Pricelist name", "What you call the pricelist, so you can pick it on a contact card. Left blank, it saves as <i>Pricelist</i>.", "optional"],
      ["Currency", "A label for the currency the prices are in. It starts as your company currency. Orbit does not convert prices with it.", "optional"],
      ["Active", "Active pricelists can be chosen on a contact card. Archived ones are hidden from that choice.", "optional"],
      ["Product (on a rule)", "The item the rule is for, or <i>(any product)</i> for a rule that applies to every item that has no rule of its own.", "optional"],
      ["Min qty (on a rule)", "A minimum quantity for the rule, stored with it. It starts at 1. The quotation does not compare it with the quantity ordered: when a product has several rules, the one with the highest Min qty is used.", "optional"],
      ["Fixed price (on a rule)", "The exact price to charge. When it is filled in, it wins over % off.", "optional"],
      ["% off (on a rule)", "A discount taken off the product's Sales price, for example 10 for ten percent. Used when Fixed price is empty.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank pricelist."],
      ["Save", "Saves the name, currency, status and all the rules. A rule with no product, no fixed price and no discount is dropped."],
      ["Discard", "Goes back to the list without saving."],
      ["+ Add rule", "Adds an empty rule. The &times; at the end of a rule removes it."],
      ["Delete", "On a saved pricelist. Removes it for good after you confirm. A pricelist still chosen on a contact cannot be deleted; archive it instead."],
      ["Select", "On the list: tick pricelists, then Archive or Delete them together."]
    ],
    after: "A pricelist changes nothing in your accounts. It only changes the starting price on quotation lines for customers who have it on their contact card, and only at the moment you pick a product on a line. Quotations and invoices already made keep their prices.",
    links: [
      { name: "Customers", how: "Choose the pricelist on the customer's contact card; without that it is never used.", to: "cust" },
      { name: "Quotations", how: "Picking a product on a quotation line for that customer applies the pricelist price.", to: "so.list" },
      { name: "Products", how: "A % off rule is taken from the product's Sales price.", to: "products" }
    ],
    mistakes: [
      ["Save failed", "Saving changes to an existing pricelist did not work, often because your role cannot manage Sales. Reload and try again, or ask an owner to check your role."],
      ["This pricelist is used in other records - it can't be deleted. Archive it instead.", "A contact still has this pricelist. Set Active to Archived instead, or take it off the contact first."],
      ["The pricelist price does not appear on a quotation", "The customer does not have this pricelist on their contact card, or the product was added before the customer was picked. Set the pricelist on the contact, then pick the product again on the line."],
      ["Every product gets the same fixed price", "An <i>(any product)</i> rule has a Fixed price. Use % off on the any-product rule, and fixed prices only on rules for a named product."]
    ],
    tips: [
      "Keep one any-product rule for the general discount and add named-product rules only for the exceptions.",
      "Changing a pricelist does not reprice quotations already saved. Pick the product again on a line to pick up the new price."
    ]
  },

  "sale.qtempl": {
    title: "Quotation Templates",
    what: "A <b>quotation template</b> is a ready-made set of lines you quote again and again, such as a standard package or a set menu. You build it once here, and <span class='man-key'>Create quotation</span> turns it into a new draft quotation with the lines filled in, so you only pick the customer and adjust.",
    when: [
      "You send the same kind of offer many times, with the same items and prices.",
      "You want new staff to start quotes from an agreed list rather than a blank page.",
      "A standard package has changed and its lines or prices need updating."
    ],
    how: [
      "Open <b>Sales &rsaquo; Configuration &rsaquo; Quotation Templates</b> and click <span class='man-key'>New</span>. For this example, an events caterer sets up its standard buffet for 50 guests.",
      "Type the name at the top, for example <i>Buffet for 50</i>, and a short <b>Note</b> such as <i>Includes staff and crockery</i>.",
      "On the first line, pick <i>Buffet menu per guest</i> in <b>Product</b>. You should see the description and the unit price fill in from the product if they were empty. Set <b>Qty</b> to 50.",
      "Add a line for a service with no product: leave Product on <i>(free text)</i>, type <i>Waiting staff, 4 hours</i> in <b>Description</b>, 1 in Qty and 240.00 in <b>Unit price</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>.",
      "When a customer asks for the buffet, open the template and click <span class='man-key'>Create quotation</span>. You should see <i>Quotation created</i> and a new draft quotation open with both lines.",
      "On the quotation, pick the <b>Customer</b>, set the tax on each line and change the quantities if needed, then click <span class='man-key'>Save</span>."
    ],
    fields: [
      ["Template name", "What you call the template. Left blank, it saves as <i>Template</i>.", "optional"],
      ["Note", "A free note kept on the template. It is not copied onto the quotation: the quotation's note reads <i>From template:</i> and the template name.", "optional"],
      ["Product (on a line)", "An item from your products, or <i>(free text)</i> for a line with only a description. On lines that were there when the template opened, picking a product fills an empty description and a zero unit price from the product.", "optional"],
      ["Description (on a line)", "What the line is for. A line with no description and no product is dropped when you save.", "optional"],
      ["Qty (on a line)", "How many. It starts at 1.", "optional"],
      ["Unit price (on a line)", "The price of one, before tax.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank template."],
      ["Save", "Saves the template and its lines."],
      ["Discard", "Goes back to the list without saving."],
      ["+ Add line", "Adds an empty line. The &times; at the end of a line removes it."],
      ["Create quotation", "On a saved template. Saves it, then creates a draft quotation dated today, with the template's lines and prices and no tax, and opens it."],
      ["Delete", "On a saved template. Removes it for good after you confirm. Quotations already made from it are not touched."]
    ],
    after: "A template changes nothing in your accounts. Create quotation makes a new draft quotation in Sales; that too changes nothing until an invoice made from the confirmed order is posted.",
    links: [
      { name: "Quotations", how: "Create quotation opens the new draft quotation there.", to: "so.list" },
      { name: "Products", how: "A product picked on a template line fills the description and price.", to: "products" }
    ],
    mistakes: [
      ["Save failed", "Saving changes to an existing template did not work, often because your role cannot manage Sales. Reload and try again."],
      ["Picking a product on a new line fills nothing in", "Lines added with + Add line do not fill themselves from the product. Type the description and price, or save and reopen the template and pick the product again."],
      ["The quotation has no tax", "Template lines carry no tax. Set the Tax on each line of the quotation before you save it."],
      ["The quotation shows the wrong customer", "The quotation starts without a customer, and the list then shows the first name. Pick the right customer before you save."]
    ],
    tips: [
      "Keep prices on templates up to date: the quotation copies the template price, not the product's current price.",
      "Use free text lines for labour or services you do not keep as products."
    ]
  },

  "po.list": {
    title: "Purchase Orders",
    what: "A <b>purchase order</b> (PO) is the order you place with a supplier: what you are buying, how many and at what price. While it is a draft it is a request for a quotation; <span class='man-key'>Confirm</span> makes it a purchase order. From a confirmed order you <b>receive the goods</b>, which puts stock items into inventory, and <b>create the bill</b>, so nothing is typed twice. The order itself posts nothing to your accounts.",
    when: [
      "You are ordering goods or a service from a supplier.",
      "Goods on an order have arrived and need receiving into stock.",
      "The supplier's invoice has come in and you want the bill built from the order.",
      "You want to see what has been ordered, received and billed on each line."
    ],
    how: [
      "Open <b>Purchase &rsaquo; Orders &rsaquo; Purchase Orders</b> and click <span class='man-key'>New</span>. For this example, an electronics retailer orders 30 phone chargers at 6.50 each plus 11% VAT.",
      "Pick the <b>Vendor</b>. If the supplier is new, choose <i>+ Add a new supplier...</i>, type the name and click <span class='man-key'>Create &amp; select</span>.",
      "On the first line, search for the charger in <b>Product</b>. You should see the description, unit, cost price and purchase tax fill in.",
      "Type 30 in <b>Qty</b>, check <b>Price</b> 6.50, <b>Basis</b> each and <b>Destination</b> Warehouse. The totals show Untaxed Amount 195.00, Taxes 21.45, Total 216.45.",
      "Click <span class='man-key'>Confirm</span>. You should see <i>Purchase order confirmed</i>, a number such as <i>PO/2026/0012</i>, and the stage on <b>Purchase Order</b>. The lines now show Ordered, Received and Billed columns.",
      "When the delivery arrives, click <span class='man-key'>Receive goods</span>. The <b>Goods Receipt</b> page opens with the 30 chargers still to receive.",
      "Pick who checked it in under <b>Received by</b>, change <b>Qty received</b> if only part came, and click <span class='man-key'>Confirm receipt</span>. You should see <i>Receipt saved - 1 item(s) added to inventory</i> and 30 in the Received column.",
      "When the supplier's invoice arrives, click <span class='man-key'>Create Bill</span>. You should see <i>Bill created (draft)</i> and the draft bill open with the same line and total.",
      "Check the bill against the supplier's paper, then <span class='man-key'>Confirm &amp; post</span> it. Back on the order, you should see <i>Received &amp; billed &middot; closed</i>."
    ],
    fields: [
      ["Vendor", "The supplier you are ordering from. Only contacts marked as a vendor appear. The list has no empty choice, so an order started from a take-off or a blanket shows the first supplier until you change it.", "required"],
      ["Project", "The job the purchase is for, so the order counts as committed cost for that project. It is listed as its code and name, for example <i>BTW · Beirut Tower</i>, but the printed order shows only the code, so the supplier can follow up by code without seeing the project's real name. <span class='man-key'>+ New</span> opens a <b>New project</b> box for its name and code, suggested from the name. The project is copied onto the bill.", "optional"],
      ["Cost Code", "The budget bucket for job costing, such as materials or subcontract. It is set once for the whole order, not per line.", "optional"],
      ["Currency", "Always the company currency on this screen.", "auto"],
      ["Order Date", "The date the order is placed. It starts as today.", "auto"],
      ["Reference / Note", "Any note on the order, for example the supplier's quote number. Orders made by other screens put their source here, such as <i>Awarded from RFQ/2026/0003</i> or <i>Release of BPO/2026/0001</i>.", "optional"],
      ["Product (on a line)", "Search your products by name or code. Picking one fills the description, unit, cost price and purchase tax, and shows the size boxes that fit the material.", "optional"],
      ["Description (on a line)", "What the line is for. A line with no product is a cost line: it can be billed but only received with Destination set to Site.", "optional"],
      ["Size W, Size H, L / Thk (on a line)", "Only for products set up as a sheet or a bar. For a sheet, the width and height in millimetres and the thickness; for a bar, the length in metres. Area shows the sheet area. A dash means the product needs no size.", "optional"],
      ["Qty (on a line)", "How many items, sheets or bars.", "required"],
      ["Unit (on a line)", "The unit of measure, filled from the product. <i>+ Add a unit...</i> creates a new one.", "optional"],
      ["Price (on a line)", "The price in the unit chosen in Basis, before tax.", "required"],
      ["Basis (on a line)", "What the Price is per: each, or for materials per sheet, per m2, per kg, per bar, per metre, per container, per litre, per roll or per linear m. Orbit turns it into a price per item using the size, and the Subtotal uses that.", "optional"],
      ["Destination (on a line)", "Where the goods go when received. <b>Warehouse</b> puts them into stock, <b>Factory</b> into the factory location, <b>Site</b> straight to the job as a cost without entering stock.", "optional"],
      ["Tax (on a line)", "The purchase tax on the line.", "optional"],
      ["Untaxed Amount, Taxes, Total", "Worked out from the lines.", "auto"]
    ],
    buttons: [
      ["New", "Starts a blank order."],
      ["Save", "Saves the order as a draft you can still change. It gets its number the first time."],
      ["Confirm", "Saves and confirms the order. If an approval rule covers purchase orders of this amount, it goes to the approver first and stays a draft; once approved, click Confirm again."],
      ["Discard", "Goes back to the list without saving."],
      ["+ Add a line", "Adds an empty line. The &times; removes a line."],
      ["+size", "Adds another line for the same item right below, so you can order a second size of it."],
      ["Receive goods", "On a confirmed order not yet fully received. Opens the Goods Receipt page with every line that still has something to receive."],
      ["Create Bill", "On a confirmed order not yet fully billed. Creates a draft vendor bill dated today, due in 30 days, with every line at its full ordered quantity and price, marks every line as billed, and opens the bill."],
      ["Edit", "Shown on a confirmed order to people who can manage Purchase. Opens its lines and details for changes. A line already received or billed cannot go below that quantity, change product or be removed, and receipts and bills already made are not changed. A higher total goes through the approval rules first. <b>Save changes</b> keeps the order confirmed with its received and billed quantities, and the version before is kept under <i>Edited after confirming</i>; <b>Cancel</b> leaves it as it was."],
      ["Receipts", "The counter at the top of an order that has been received. Opens its receipt, or lets you pick one when there are several. A receipt with the wrong quantity is corrected there, with Edit."],
      ["&#8249; and &#8250;", "Beside the title when you opened the order from the list. Step to the previous or next order in the list's order without going back to it. Alt and the left or right arrow key do the same."],
      ["Print", "Prints the order for the supplier, or saves it as a PDF. Each row names its item (the product, with the line's description, such as a position mark, under it), with sizes and areas. When the order has a project, only the project's code is printed, never its name."],
      ["Bills", "The counter at the top of an order that has a bill. Opens the first bill made from it."],
      ["Confirm receipt (Goods Receipt page)", "Records what arrived, moves stock items into inventory and adds to each line's Received quantity."],
      ["+ Add a product and Scan barcode (Goods Receipt page)", "Add an extra line, typed or read from a barcode or QR label with the device camera."]
    ],
    after: "Confirming posts nothing, but a confirmed order counts as committed cost for its project. Receiving a stock item (a product kept in stock or consumed) with Destination Warehouse or Factory creates a stock move and posts its value at the order price: debit your stock account, credit the goods received account. Receiving a Site line, or a service, only updates the Received quantity. The bill made with Create Bill sends stock lines to the goods received account, clearing it, and other lines to the product's expense account; it counts in what you owe once posted. The 3-Way Match screen compares all three.",
    links: [
      { name: "Bills", how: "Create Bill opens a draft bill with the order's lines; post it from there.", to: "inv.in" },
      { name: "3-Way Match", how: "Compares each line's ordered, received and billed quantity and price.", to: "pur.match" },
      { name: "Vendors", how: "Every order belongs to a vendor.", to: "vend" },
      { name: "RFQ / Compare Quotes", how: "Award on an RFQ creates a draft order for the winning supplier.", to: "rfq.list" },
      { name: "Material Take-off", how: "Create Purchase Order on a take-off creates a draft order from its lines.", to: "pur.req" },
      { name: "Blanket Orders", how: "A blanket agreement and each release are purchase orders that show in this list too.", to: "pur.blanket" },
      { name: "On Hand", how: "Stock received into the warehouse shows there.", to: "inv.onhand" },
      { name: "Receipts", how: "Every receipt made with Receive goods is listed there with its number, and corrected there with Edit.", to: "inv.receipts" },
      { name: "Job Cost", how: "An order tagged to a project and cost code counts as committed cost.", to: "proj.jobcost" },
      { name: "Approval Rules", how: "A rule for purchase orders above an amount makes Confirm wait for the approver.", to: "approvals.rules" }
    ],
    mistakes: [
      ["Pick a vendor", "There is no supplier to choose. Add one with <i>+ Add a new supplier...</i> or in Vendors."],
      ["Add at least one line", "Every line is empty. Give a line a product, a description or an amount."],
      ["Sent for approval (amount)", "Not an error: an approval rule covers this amount. The order stays a draft until the approver decides; then click Confirm again."],
      ["Cannot receive more than ordered on (line): only (quantity) left on the PO.", "The quantity received is more than is still outstanding on that line. Receive only what is left, or add a new order for the extra."],
      ["Line (name) has no product - add one, or set destination to Site (cost only), to receive it.", "A line without a product cannot go into stock. Give the line a product on the order, or set its Destination to Site."],
      ["Add at least one product with a quantity", "Every line on the Goods Receipt has a zero quantity. Enter what arrived."],
      ["Stock saved, but no stock account is set for this company - Settings, Companies, Stock accounting", "The goods were received but their value was not posted. Set the stock accounts for the company; later receipts will post."],
      ["Someone else changed this purchase order while you had it open. Your changes were not saved - reload the page to get the latest version, then re-enter them.", "Another person saved the same order after you opened it. Reload, then make your change again."],
      ["3-Way Match shows Billed &gt; received", "Create Bill bills every line in full, even if only part was received. Receive the rest first, or change the quantity on the draft bill to what arrived."]
    ],
    tips: [
      "Receive before you bill. The bill is then easy to check against what actually arrived.",
      "Set the Destination before you confirm: Site material never enters stock, so it will not show in On Hand.",
      "To send goods back, open Receive goods from the order and choose Return to vendor. The quantity comes off the line's Received figure (you cannot return more than was received), the goods leave stock, and their value goes back against the goods-received account."
    ]
  },

  "pur.blanket": {
    title: "Blanket Orders",
    what: "A <b>blanket order</b> is a standing agreement with a supplier: the items and prices you have agreed for a period. Each time you need stock, you raise a <b>release</b>, a normal purchase order that copies the agreed lines, and you set the quantity you want now. This screen lists each agreement with how much has been released against it and how much is left.",
    when: [
      "You have agreed yearly prices with a supplier and buy from them in smaller call-offs.",
      "You need another delivery under an existing agreement.",
      "You want to see how much of an agreement has been used."
    ],
    how: [
      "Open <b>Purchase &rsaquo; Orders &rsaquo; Blanket Orders</b> and click <span class='man-key'>+ New blanket agreement</span>. For this example, a restaurant group agrees a year of cooking oil with its supplier: 1,200 cans at 21.00.",
      "You should see <i>Blanket agreement BPO/2026/0001 created</i> and the agreement open as a draft purchase order. Pick the <b>Vendor</b>.",
      "Add the line: the cooking oil product, <b>Qty</b> 1,200, <b>Price</b> 21.00, and its tax. Click <span class='man-key'>Save</span>, not Confirm.",
      "Go back to Blanket Orders. You should see the agreement with Agreed at its total, Released 0.00 and Status <b>Active</b>.",
      "When the first delivery is needed, click <span class='man-key'>Release</span> on its row. You should see <i>Release PO/2026/0031 drafted from BPO/2026/0001</i> and the new order open with the same line.",
      "Change <b>Qty</b> to 100 and click <span class='man-key'>Confirm</span>. Receive and bill it like any purchase order.",
      "Back on Blanket Orders you should see Released rise by the release total, with the count of releases in brackets, Remaining fall and the Drawn bar fill."
    ],
    fields: [
      ["Number", "The agreement number, BPO/ then the year and a sequence. It is what marks a purchase order as a blanket.", "auto"],
      ["Vendor", "The supplier on the agreement.", "auto"],
      ["Valid until", "Read from the order's promised date. The purchase order form has no field for that date, so it normally shows a dash and the agreement never shows as Expired.", "auto"],
      ["Agreed", "The agreement's total, from its lines.", "auto"],
      ["Released", "The total of every other purchase order, of any status except cancelled, whose Reference / Note contains this BPO number. The number of such orders is in brackets.", "auto"],
      ["Remaining", "Agreed less Released. It turns red when more has been released than agreed.", "auto"],
      ["Drawn", "A bar showing Released as a share of Agreed.", "auto"],
      ["Status", "<b>Active</b>, <b>Fully drawn</b> when nothing remains, or <b>Expired</b> when the valid-until date has passed.", "auto"]
    ],
    buttons: [
      ["+ New blanket agreement", "Creates a draft purchase order numbered BPO/..., with the note <i>Blanket agreement</i>, and opens it so you can add the vendor and the agreed lines."],
      ["Release", "Creates a draft purchase order for the same vendor with every agreed line at the agreed quantity and price, and the note <i>Release of</i> the BPO number, and opens it."],
      ["Open", "Opens the agreement itself in the purchase order form."]
    ],
    after: "An agreement is only a draft purchase order, so it posts nothing and commits nothing. Each release is a normal purchase order: confirming, receiving and billing it works exactly as on Purchase Orders.",
    links: [
      { name: "Purchase Orders", how: "Agreements and releases are purchase orders and appear in that list too.", to: "po.list" },
      { name: "Vendors", how: "The supplier on the agreement.", to: "vend" },
      { name: "3-Way Match", how: "Confirmed releases are checked there like any order.", to: "pur.match" }
    ],
    mistakes: [
      ["Could not create: (reason)", "The agreement could not be saved, often because your role cannot manage Purchase. Ask an owner to check your role."],
      ["A release does not count in Released", "Its Reference / Note no longer contains the BPO number. Put <i>Release of BPO/...</i> back in the note."],
      ["Released is more than it should be", "A release that was drafted but never used still counts. Delete the unused draft order, or remove the BPO number from its note."],
      ["The agreement shows Receive goods and Create Bill", "The agreement itself was confirmed, so it became a live purchase order. Keep the agreement as a draft and confirm only the releases."]
    ],
    tips: [
      "Save the agreement, never Confirm it.",
      "Set the release quantities before you confirm: a release starts with the whole agreed quantity."
    ]
  },

  "pur.match": {
    title: "3-Way Match",
    what: "The <b>3-way match</b> checks every confirmed purchase order against two other records: what was <b>received</b> and what the supplier <b>billed</b>. It lines them up on quantity, price and value and flags the gaps, such as a bill for more than arrived or a unit price higher than the order. Use it before paying suppliers.",
    when: [
      "Before paying a supplier, to make sure you are paying only for what you ordered and received.",
      "A bill looks higher than expected and you want to see which line differs.",
      "At month end, to find orders received but not yet billed, or billed but not received."
    ],
    how: [
      "Open <b>Purchase &rsaquo; Orders &rsaquo; 3-Way Match</b>. For this example, a hardware wholesaler ordered 200 boxes of screws at 4.00, received 180, and the supplier billed 200 at 4.20.",
      "Read the line under the title. You should see how many lines are over-billed and how many have a price variance, or <i>no exceptions</i>.",
      "Find the order: each order is a heading with its number and supplier, and its lines follow.",
      "On the screws line you should see Ordered 200, Received 180, Billed 200, and Price 4.00 with an arrow to 4.20.",
      "Read Status. It shows <b>Billed &gt; received</b>, because 200 were billed but 180 arrived.",
      "Ask the supplier for a credit for the 20 boxes and the price difference, or correct the draft bill before posting it.",
      "When the bill and the receipt agree, open this screen again. The line should read <b>Matched</b>."
    ],
    fields: [
      ["Item", "The order line's description. For sheets and bars a grey line under it shows the ordered and received quantity converted to m2 or metres.", "auto"],
      ["Ordered", "The quantity on the order line.", "auto"],
      ["Received", "The quantity received so far.", "auto"],
      ["Billed", "The quantity on vendor bills linked to the order, drafts included, for the same product.", "auto"],
      ["Price (PO&rarr;bill)", "The order price. When the average billed price differs, the billed price follows in red.", "auto"],
      ["Ordered value and Billed value", "Quantity times price on the order, and the total of the bill lines.", "auto"],
      ["Status", "<b>Matched</b>: received and billed both cover the order at the order price. <b>Billed &gt; received</b>: more billed than arrived. <b>Price +x%</b>: the bill price differs by more than half a percent. <b>In progress</b>: something received or billed but not all. <b>Not received</b>: nothing yet. <b>Description only</b>: a line with no product.", "auto"]
    ],
    buttons: [
      ["Print", "Prints the report with your browser's print window."]
    ],
    after: "This screen only reads. It changes nothing in your orders, bills or accounts.",
    links: [
      { name: "Purchase Orders", how: "Only confirmed orders appear here; receive goods and create the bill from the order.", to: "po.list" },
      { name: "Bills", how: "Correct a draft bill there, or add a refund for a posted one.", to: "inv.in" },
      { name: "Supplier Payments", how: "Pay a bill once its lines match.", to: "pay.out" }
    ],
    mistakes: [
      ["No confirmed purchase orders yet. Confirm a PO, receive goods, then bill it to see the match here.", "There are no confirmed orders. Draft orders are not checked."],
      ["A line shows Billed &gt; received straight after Create Bill", "Create Bill bills every line in full. Receive the rest of the goods, or reduce the quantity on the draft bill."],
      ["A bill I typed by hand does not show as billed", "Only bills created from the order are linked to it. Use Create Bill on the order instead of starting a bill from scratch."]
    ],
    tips: [
      "A draft bill already counts as billed here, so you can check it before posting it.",
      "A price variance within half a percent is ignored, so rounding does not raise a flag."
    ]
  },

  "rfq.list": {
    title: "RFQ / Compare Quotes",
    what: "An <b>RFQ</b> (request for quotation) asks several suppliers to price the same items. You list the items, add the suppliers, type in each one's prices as they reply, and Orbit lines them up and highlights the cheapest. <span class='man-key'>Award</span> then creates a draft purchase order for the supplier you choose.",
    when: [
      "Before a larger purchase, to get competing prices.",
      "A take-off or a cut list has produced an RFQ and suppliers' replies are coming in.",
      "You need to show why a supplier was chosen, with a printed comparison."
    ],
    how: [
      "Open <b>Purchase &rsaquo; Procurement &rsaquo; RFQ / Compare Quotes</b> and click <span class='man-key'>New</span>. For this example, a furniture maker needs 60 sheets of 18 mm oak veneer board.",
      "Change the <b>Title</b> to <i>Oak veneer board, spring range</i> and set a <b>Deadline</b> for replies.",
      "Under Items to quote, search for the board in <b>Product</b>, set the size in <b>Measure</b> and type 60 in <b>Qty</b>.",
      "Under Suppliers invited, pick three suppliers one at a time from <i>+ Add a supplier...</i>. You should see a chip for each.",
      "Click <span class='man-key'>Save</span>. You should see a number such as <i>RFQ/2026/0004</i> and the status <b>Sent</b>.",
      "Click <span class='man-key'>Print RFQ</span> and send the printout to each supplier.",
      "As replies come in, type each supplier's price in its column in Compare quotes, in the unit shown in <b>Basis</b>. You should see each Total and the lowest one highlighted.",
      "Click <span class='man-key'>Save</span>, then <span class='man-key'>Award</span> under the supplier you choose. You should see <i>Awarded to</i> the supplier, the draft order number, and the status <b>Awarded</b>.",
      "Open Purchase Orders, check the new draft order and confirm it."
    ],
    fields: [
      ["Title", "What the RFQ is for. It prints as the subject.", "optional"],
      ["Project", "The job the purchase is for, listed as its code and name. It is copied onto the purchase order you award. The printed RFQ shows only the project's code, never its name.", "optional"],
      ["Cost Code", "The budget bucket for job costing. It is copied onto the awarded order and its lines.", "optional"],
      ["Deadline", "The date you need replies by. It prints as <i>Reply by</i>.", "optional"],
      ["Note", "A note added to the printed request after the standard wording.", "optional"],
      ["Status", "<b>Draft</b> for one made by Cut List until it is saved here, <b>Sent</b> once saved, <b>Awarded</b> after Award.", "auto"],
      ["Product (item)", "Search your products. Picking one fills the description and unit and shows the right measure boxes.", "optional"],
      ["Description (item)", "What you want priced. An item needs a product or a description to be kept.", "required"],
      ["Measure (item)", "Width and height in millimetres for sheets and glass, length in metres for bars. Area shows the result.", "optional"],
      ["Unit and Qty (item)", "The unit of measure and how many you need.", "optional"],
      ["Destination (item)", "Warehouse, Factory or Site, copied onto the awarded order to decide where the goods are received.", "optional"],
      ["Suppliers invited", "The vendors asked to quote. Each gets a column in Compare quotes.", "optional"],
      ["Basis (compare)", "What the prices on that item are per, such as per sheet, per m2 or per kg. Change it before typing prices.", "optional"],
      ["Last price (compare)", "What you last paid for the product on a confirmed order, shown in the same basis.", "auto"],
      ["Supplier price and Total (compare)", "Type each supplier's price per the basis. Total is the price turned into a price per item times the quantity; the lowest on the line is highlighted.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank RFQ."],
      ["Save", "Saves the items, suppliers and prices. A new RFQ gets its number and the status Sent."],
      ["+ Add item", "Adds an item to price. The &times; removes one; +size adds another size of the same item below it."],
      ["Award", "Saves, then creates a draft purchase order for that supplier with each item at their price turned into a price per item, the product's purchase tax, the project and cost code, and marks the RFQ Awarded. The cheapest supplier's button is emphasised."],
      ["Reopen", "On an awarded RFQ. Sets it back to Sent and clears the winner. The purchase order already created is not removed."],
      ["Print RFQ", "Prints the request to send suppliers, with a blank column for their price. Each row names its item (the product, with the line's description under it), and the header shows the project's code, never its name."],
      ["Print comparison", "Prints the comparison of every supplier's totals, with the lowest total named."]
    ],
    after: "An RFQ posts nothing. Award creates a draft purchase order, which also posts nothing until it is confirmed, received and billed. Prices you typed are kept, and Vendor Scorecards count how often each supplier's price was the lowest.",
    links: [
      { name: "Purchase Orders", how: "Award creates the draft order there; confirm it to place the order.", to: "po.list" },
      { name: "Material Take-off", how: "Create RFQ on a take-off starts an RFQ with its lines.", to: "pur.req" },
      { name: "Cut List", how: "The shortfall from a cut list becomes a draft RFQ.", to: "pur.cutlist" },
      { name: "Vendor Scorecards", how: "Uses your RFQ prices to score how often each supplier was cheapest.", to: "pur.scorecards" },
      { name: "Procurement Status", how: "Items on RFQs not yet awarded count as Quoted for the project.", to: "pur.procstatus" }
    ],
    mistakes: [
      ["Add vendor contacts first (Contacts).", "No contact is marked as a vendor. Add the suppliers in Vendors, then come back."],
      ["Compare quotes does not appear", "It needs at least one item and one invited supplier. Add both."],
      ["The awarded order has a zero price on a line", "That supplier had no price on the line when you clicked Award. Type the price on the draft order, or Reopen, add the price and award again."],
      ["Two purchase orders for one RFQ", "Reopen does not remove the order from the first award. Delete the unwanted draft order in Purchase Orders."]
    ],
    tips: [
      "Set the Basis before typing prices. Prices are compared per item, so a price per m2 and a price per sheet line up correctly.",
      "Save after typing prices: Award saves too, but saving first protects replies you have typed."
    ]
  },

  "pur.req": {
    title: "Material Take-off",
    what: "A <b>material take-off</b> is the list of what a construction job needs: bars, sheets, paint, sealant, screws, each with its size, quantity and where it should be delivered. It is its own document, tagged to the project, and it feeds the buying: <span class='man-key'>Create RFQ</span> sends it out for prices, or <span class='man-key'>Create Purchase Order</span> turns it straight into a draft order.",
    when: [
      "A job has been measured and you need to list the material it needs.",
      "You want suppliers to price the whole list, or to order it at last-paid prices.",
      "You want to nest the cuts on the list, or track the job's procurement."
    ],
    how: [
      "Open <b>Purchase &rsaquo; Procurement &rsaquo; Material Take-off</b> and click <span class='man-key'>New</span>. For this example, a shopfitter lists the aluminium and glass for a shop front.",
      "Pick the <b>Project / site</b>, who raised it in <b>Requested by</b>, and the <b>Date</b> the material is needed. Leave <b>Number</b> blank.",
      "On the first line, search for the aluminium profile in <b>Product</b>. You should see the description, a <b>Category</b> of Bars, the unit and the <b>Last ~</b> price fill in.",
      "In <b>Measure</b> type the cut length, 2.4 (metres), and 14 in <b>Qty</b>. Leave <b>Destination</b> on Factory.",
      "Add a line for 6 mm clear glass: in Measure type 1200 by 2100 (millimetres). You should see the area appear. Type 8 in Qty and set Destination to Site.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, a number such as <i>MR/2026/0009</i>, and the summary strip counting the items by destination and category.",
      "Click <span class='man-key'>Create RFQ</span> to get prices. You should see the RFQ open with both lines, ready for suppliers.",
      "Or, to order at last-paid prices, click <span class='man-key'>Create Purchase Order</span>. You should see <i>Draft purchase order created - pick the vendor and confirm</i>, and the take-off becomes <b>Ordered</b>."
    ],
    fields: [
      ["Number", "Your take-off reference. Left blank, Orbit numbers it MR/ then the year and a sequence.", "auto"],
      ["Project / site", "The job the material is for. It is copied onto the RFQ or order made from the take-off, and lets Procurement Status and Cut Nesting find it.", "optional"],
      ["Requested by", "Who raised the take-off, from your team.", "optional"],
      ["Date", "When the material is needed. It starts as today.", "auto"],
      ["Note", "Any instructions for whoever buys the material.", "optional"],
      ["Product (on a line)", "Search your products. Picking one fills the description, category, unit and last price, and shows the measure boxes.", "optional"],
      ["Description (on a line)", "What the item is. A line needs a product or a description to be kept.", "required"],
      ["Category (on a line)", "Bars, Sheets, Paint, Sealant, Screws or Misc. Guessed from the product, and used for the summary and the category table in Procurement Status.", "auto"],
      ["Measure (on a line)", "Width and height in millimetres for sheets and glass; length in metres for bars. Cut Nesting uses these sizes.", "optional"],
      ["Qty (on a line)", "How many pieces of that size.", "optional"],
      ["Unit (on a line)", "The unit of measure. <i>+ Add a unit...</i> creates one.", "optional"],
      ["Destination (on a line)", "Warehouse, Factory or Site. Copied onto the RFQ or order, where it decides how the goods are received.", "optional"],
      ["Last ~ (on a line)", "The price last paid for the product on a confirmed purchase order.", "auto"]
    ],
    buttons: [
      ["New", "Starts a blank take-off."],
      ["Save", "Saves the take-off and its lines."],
      ["+ Add a line and +size", "Add an empty line, or another size of the same item right below. The &times; removes a line."],
      ["Create RFQ", "Saves, then creates an RFQ with status Sent, titled <i>From take-off</i> and the number, with the project and every line, and opens it."],
      ["Create Purchase Order", "Saves, checks any approval rule for purchase requisitions against the estimated value, then creates a draft purchase order with no vendor, every line priced at the last price paid or the product cost, marks the take-off Ordered and opens the order."],
      ["Discard", "Goes back to the list without saving."],
      ["Delete", "On a saved take-off that is not ordered. Removes it for good after you confirm."],
      ["Back", "On an ordered take-off, which is read-only. Goes back to the list."]
    ],
    after: "A take-off posts nothing. It shows as Needed in Procurement Status for its project, valued at last-paid prices. The RFQ or purchase order made from it is a separate document; the take-off keeps its own lines.",
    links: [
      { name: "RFQ / Compare Quotes", how: "Create RFQ opens a new RFQ with the take-off's lines.", to: "rfq.list" },
      { name: "Purchase Orders", how: "Create Purchase Order opens a draft order; pick the vendor and confirm.", to: "po.list" },
      { name: "Cut Nesting / Optimiser", how: "Works out how many stock bars and sheets the take-off's cuts need.", to: "pur.nesting" },
      { name: "Procurement Status", how: "Compares what the take-off needs with what is quoted, ordered and received.", to: "pur.procstatus" },
      { name: "Approval Rules", how: "A rule for purchase requisitions makes Create Purchase Order wait for the approver.", to: "approvals.rules" }
    ],
    mistakes: [
      ["Add at least one item first", "The take-off has no lines with a product or description."],
      ["Sent for approval (amount)", "Not an error: an approval rule covers purchase requisitions of this value. No order is created yet; once approved, click Create Purchase Order again."],
      ["Save failed", "Saving an existing take-off did not work, often because your role cannot manage Purchase. Reload and try again."],
      ["The draft order shows the wrong vendor", "The order is created without a vendor and the list then shows the first supplier. Pick the right one before confirming."],
      ["The Status never shows Approved", "No button sets a take-off to Approved. Use an approval rule for purchase requisitions if you need sign-off before ordering."]
    ],
    tips: [
      "Give every line a product where you can: Last price, Category and nesting all need one.",
      "Create RFQ does not lock the take-off, so you can send it for prices and still order later."
    ]
  },

  "pur.cutlist": {
    title: "Cut List (reserve & buy)",
    what: "When your cutting or nesting software produces a list of the material a job needs, paste it here. Orbit matches each line to a product, <b>reserves</b> what you already have in stock for the job, and puts only the <b>shortfall</b> onto a draft RFQ to send suppliers. Orbit does not optimise the cut; for that use Cut Nesting or your own software.",
    when: [
      "Your cutting software has produced a material list for a job.",
      "You want to use stock already on the shelf before buying more.",
      "You want an RFQ for only the material you are missing."
    ],
    how: [
      "Open <b>Purchase &rsaquo; Procurement &rsaquo; Cut List (reserve &amp; buy)</b>. For this example, a window fabricator has a list for a housing block.",
      "Pick the <b>Project</b> and type a <b>Reference</b> such as <i>Cut list 12</i>.",
      "Paste the list into the box, one material per line: a code or name, the quantity and the unit, for example <i>PROF-6063, 120, pcs</i>.",
      "Click <span class='man-key'>Match &amp; preview</span>. You should see a table with each line's matched Product, Needed, Available, Reserve and Short (buy).",
      "Check every Product. Where a line was not matched, pick the product from its list, or leave <i>(no match &ndash; buy as text)</i> to buy it by description.",
      "Read the summary: <i>Will reserve</i> a quantity from stock and put the rest on a draft RFQ.",
      "Click <span class='man-key'>Reserve stock &amp; create RFQ</span>. You should see how many items were reserved and, when something is short, the draft RFQ open with the shortfall lines.",
      "Add the suppliers on the RFQ, type their prices as they reply, and award it."
    ],
    fields: [
      ["Project", "The job the material is for. The reservations and the RFQ are tagged to it.", "optional"],
      ["Reference", "A free reference kept on the reservations and in the RFQ title and note.", "optional"],
      ["Paste rows", "One material per line: code or name, quantity, unit, separated by a tab, comma, semicolon or bar. A line with only spaces is read as the name, then the last number as the quantity and anything after it as the unit.", "required"],
      ["From your list", "The material text as pasted.", "auto"],
      ["Product", "The matched product: an exact code, supplier code or barcode first, then an exact name, then a name that contains the text. Change it if the match is wrong.", "auto"],
      ["Needed and Unit", "The quantity and unit read from the line. The unit falls back to the product's unit.", "auto"],
      ["Available", "Stock on hand less stock already reserved, for the matched product.", "auto"],
      ["Reserve", "The smaller of Needed and Available, reserved for the job.", "auto"],
      ["Short (buy)", "Needed less Reserve. This goes on the RFQ.", "auto"]
    ],
    buttons: [
      ["Match &amp; preview", "Reads the pasted lines, matches them to products and shows the preview. Nothing is saved yet."],
      ["Reserve stock &amp; create RFQ", "Saves a reservation for each line with something to reserve, then creates a draft RFQ titled <i>Cut list shortfall</i> with every short line, and opens it. With no shortfall, it stays on this screen."]
    ],
    after: "A reservation holds the quantity against the job, so it no longer counts as available the next time a cut list is matched. Nothing is posted to your accounts and no stock moves. The draft RFQ posts nothing either; the awarded purchase order is where buying starts.",
    links: [
      { name: "RFQ / Compare Quotes", how: "The shortfall becomes a draft RFQ; add suppliers and award it.", to: "rfq.list" },
      { name: "On Hand", how: "Available is worked out from the stock on hand.", to: "inv.onhand" },
      { name: "Cut Nesting / Optimiser", how: "Works out how many stock bars and sheets a take-off needs, if you do not have cutting software.", to: "pur.nesting" },
      { name: "Material Take-off", how: "An alternative way to list a job's material, with sizes and destinations.", to: "pur.req" }
    ],
    mistakes: [
      ["Paste at least one line", "The box is empty. Paste the material list first."],
      ["Reserve failed: (reason)", "The reservations could not be saved, often because your role cannot manage Purchase. Nothing was reserved; ask an owner to check your role."],
      ["RFQ failed: (reason)", "The reservations were saved but the RFQ was not. Create an RFQ by hand for the shortfall, and do not run the same list again or the stock is reserved twice."],
      ["Available shows 0 for stock you have", "The line matched a different product, or the stock is already reserved by an earlier cut list. Check the Product on the line."],
      ["A quantity looks wrong", "The unit is taken as written, not converted. Paste quantities in the product's own unit."]
    ],
    tips: [
      "Run each list once. Running it again reserves the same stock a second time.",
      "Lines left as buy as text go onto the RFQ by description, with no product."
    ]
  },

  "pur.nesting": {
    title: "Cut Nesting / Optimiser",
    what: "Cut nesting works out how to cut the pieces on a <b>material take-off</b> from your stock bars and sheets with the least waste. For each material it shows how many stock bars or sheets you need, the waste percentage and, for bars, the offcuts left over, which you can keep as remnants on the project.",
    when: [
      "A take-off lists the cut pieces for a job and you want to know how many full bars or sheets to buy.",
      "You want to compare waste with and without rotating pieces, or with a different saw blade.",
      "You want to keep usable bar offcuts on record for another job."
    ],
    how: [
      "Make sure the take-off has sized lines, and that each product has its stock bar length or stock sheet size set. For this example, a joinery firm cuts 20 pieces of 1.4 m timber batten from 6 m lengths.",
      "Open <b>Purchase &rsaquo; Procurement &rsaquo; Cut Nesting / Optimiser</b>.",
      "Set <b>Saw kerf (mm)</b> to the width your blade removes, for example 4, and leave <b>allow rotation</b> ticked for sheets.",
      "Pick the take-off in <b>Take-off to nest</b> and click <span class='man-key'>Optimise cutting</span>.",
      "Read the batten's card. You should see how many pieces are cut on which bar length, <b>Bars needed</b>, <b>Cut waste</b> and <b>Offcuts (m)</b>.",
      "For a sheet material, you should see <b>Sheets needed</b>, <b>Used area</b>, <b>Waste</b> and <b>Sheet area</b>.",
      "Click <span class='man-key'>Record offcuts as remnants</span>. You should see how many offcuts were recorded in the project's Materials &amp; Remnants."
    ],
    fields: [
      ["Saw kerf (mm)", "The width of material each cut removes. It starts at 4. It is added to every piece.", "optional"],
      ["allow rotation", "Lets sheet pieces be turned 90 degrees to fit better. Ticked by default. Bars are not affected.", "optional"],
      ["Take-off to nest", "The take-off whose lines are cut. Its lines need a product set up as a bar, a sheet or glass, and a size.", "required"],
      ["Bars needed and Cut waste", "For bar materials: how many stock bars the pieces fit on, and the leftover length as a share of all bars used. A product with no stock length is taken as 6 m bars.", "auto"],
      ["Offcuts (m)", "The length left on each bar, when more than 5 cm.", "auto"],
      ["Sheets needed, Used area, Waste, Sheet area", "For sheet and glass materials: how many stock sheets, the area of the pieces, the waste share and the area of the sheets used.", "auto"]
    ],
    buttons: [
      ["Optimise cutting", "Packs the take-off's pieces onto stock bars and sheets and shows the result for each material. Nothing is saved."],
      ["Record offcuts as remnants", "Shown when there are bar offcuts. Saves each offcut as a remnant in stock on the take-off's project, in Materials &amp; Remnants."]
    ],
    after: "Optimising saves nothing and posts nothing. Recording offcuts adds remnant items to the project's Materials &amp; Remnants; it does not move stock or post any value.",
    links: [
      { name: "Material Take-off", how: "The take-off supplies the pieces and their sizes.", to: "pur.req" },
      { name: "Materials &amp; Remnants", how: "Recorded offcuts are listed there against the project.", to: "proj.materials" },
      { name: "Products", how: "Set each product's stock bar length or stock sheet size there.", to: "products" }
    ],
    mistakes: [
      ["No take-offs yet. Create a Material Take-off with sized lines, then optimise its cutting here.", "There is no take-off to nest. Create one first."],
      ["No nestable lines. Nesting needs sized bar or sheet/glass products (with a stock length or sheet size on the product) and cut dimensions on the take-off lines.", "None of the take-off's lines has a bar, sheet or glass product with a size. Add the sizes on the take-off, and the stock size on the product."],
      ["set the product's stock sheet size (W x H) to nest", "The sheet product has no stock sheet size. Set it on the product, then optimise again."],
      ["This take-off has no project - open it and set a project to record remnants.", "Remnants belong to a project. Set the Project / site on the take-off and save it."],
      ["No bar offcuts to record", "Only bar offcuts are recorded; sheet results have none to save."]
    ],
    tips: [
      "Bar packing is close to the best possible. Sheet packing is a quick practical layout, good for estimating, not a replacement for dedicated nesting software on complex jobs.",
      "Each take-off line's quantity is the number of pieces of that size."
    ]
  },

  "pur.procstatus": {
    title: "Procurement Status",
    what: "Procurement Status shows, for one project, how its material is progressing: what the take-offs say it <b>needs</b>, what is out for <b>quote</b>, what is <b>ordered</b> on purchase orders and what has been <b>received</b>, against the project's cost budget. It is a single page per project with totals, a funnel, a split by destination and a table by category.",
    when: [
      "You want to know whether a job's material has been ordered and delivered.",
      "You suspect a job is ordering more material than its budget allows.",
      "A progress meeting needs a quick picture of procurement on one project."
    ],
    how: [
      "Open <b>Purchase &rsaquo; Procurement &rsaquo; Procurement Status</b>. For this example, a contractor checks a school extension.",
      "Pick the project in the box at the top right. It remembers the last project you looked at.",
      "Read the cards: Needed, Quoted, Ordered, Received and, when the project has a budget, Cost budget.",
      "Read the <b>Procurement funnel</b>. You should see Ordered as a percentage of Needed, and Received as a percentage of Ordered.",
      "If a red banner says ordered material is over the project cost budget, open Job Cost to see which cost code is over.",
      "Read <b>By category</b> to see which kind of material, such as Sheets or Bars, is behind."
    ],
    fields: [
      ["Project", "The project to show.", "required"],
      ["Needed", "Every take-off line for the project, valued at the price last paid for the product or, failing that, its cost.", "auto"],
      ["Quoted", "Lines on the project's RFQs that are not yet awarded, valued the same way.", "auto"],
      ["Ordered", "Lines on the project's purchase orders that are sent or confirmed, at their order price. Drafts are not counted.", "auto"],
      ["Received", "The received quantity on those lines, at the order price.", "auto"],
      ["Cost budget", "The total of the project's cost budget lines.", "auto"],
      ["Needed, by destination", "The Needed value split into warehouse, factory and site.", "auto"],
      ["By category", "Needed, Ordered and Received per category: Bars, Sheets, Paint, Sealant, Screws or Misc.", "auto"]
    ],
    buttons: [],
    after: "This screen only reads. It changes nothing.",
    links: [
      { name: "Material Take-off", how: "Take-off lines tagged to the project are what it needs.", to: "pur.req" },
      { name: "RFQ / Compare Quotes", how: "Unawarded RFQ lines for the project count as Quoted.", to: "rfq.list" },
      { name: "Purchase Orders", how: "Confirmed orders for the project count as Ordered and Received.", to: "po.list" },
      { name: "Job Cost", how: "Shows the budget against committed and actual cost by cost code.", to: "proj.jobcost" },
      { name: "Projects", how: "The cost budget is set on the project.", to: "proj.list" }
    ],
    mistakes: [
      ["Nothing procured for this project yet. Build a Material Take-off, then raise an RFQ or PO.", "No take-off, RFQ or order is tagged to this project. Check the Project on those documents."],
      ["Ordered material (amount) is over the project cost budget (amount).", "Orders for the project add up to more than its whole cost budget. Review the orders or the budget."],
      ["Ordered stays at zero after raising an order", "The order is still a draft. Confirm it, and check it has the project set."],
      ["The screen says there are no projects", "The company has no projects yet. Create a project first."]
    ],
    tips: [
      "Needed and Quoted are estimates at last-paid prices; Ordered and Received use the real order prices."
    ]
  },

  "pur.scorecards": {
    title: "Vendor Scorecards",
    what: "Vendor Scorecards grade every supplier from A to D on the records you already have: how much of what you ordered they delivered, whether they delivered on time, how often their RFQ price was the cheapest, and how many returns you made to them. There is nothing to type; it reads your purchase orders, receipts and RFQ prices.",
    when: [
      "You are choosing between suppliers for a new order.",
      "A supplier review is due and you want figures rather than impressions.",
      "You want to see how much you spend with each supplier in a period."
    ],
    how: [
      "Open <b>Purchase &rsaquo; Procurement &rsaquo; Vendor Scorecards</b>. For this example, a grocery wholesaler reviews its produce suppliers.",
      "Pick the period at the top right: Last 12 months, Last 24 months or All time.",
      "Read the tiles: Vendors scored, Spend (period), Avg on-time and Open late orders.",
      "Read the table, best grade first. You should see each supplier's Grade, Orders, Spend, Fill, On-time, Price win, Late and Returns.",
      "A dash means there is not enough history for that measure, such as a supplier never invited to an RFQ.",
      "Click a supplier's row to open their vendor record."
    ],
    fields: [
      ["Period", "Which orders count, by order date. The choice is kept while you use Orbit.", "optional"],
      ["Grade", "A for a score of 85 or more, B for 70, C for 50, D below. The score weighs on-time 40%, fill 30%, price win 20%, plus 10 points, less 4 points per return up to five. A measure with no history counts as 70 for on-time and fill and 60 for price.", "auto"],
      ["Orders and Spend", "Sent and confirmed purchase orders in the period, and their total converted to your company currency.", "auto"],
      ["Fill", "Quantity received as a share of quantity ordered.", "auto"],
      ["On-time", "Fully received orders delivered on or before the order's promised date. The purchase order form has no promised-date field, so unless your orders carry one from an import, this shows a dash.", "auto"],
      ["Price win", "Of the RFQ lines where at least two suppliers gave a price, how often this supplier's was the lowest.", "auto"],
      ["Late", "Orders past their promised date and not fully received. It needs the same promised date, so it usually shows 0.", "auto"],
      ["Returns", "Receipts recorded as a return to this supplier.", "auto"],
      ["Last order", "The date of the supplier's latest order in the period.", "auto"]
    ],
    buttons: [
      ["A supplier's row", "Opens that vendor's record."]
    ],
    after: "This screen only reads. It changes nothing.",
    links: [
      { name: "Vendors", how: "Click a row to open the supplier's record.", to: "vend" },
      { name: "Purchase Orders", how: "Sent and confirmed orders and their received quantities drive Fill and Spend.", to: "po.list" },
      { name: "RFQ / Compare Quotes", how: "Prices typed on RFQs drive Price win.", to: "rfq.list" }
    ],
    mistakes: [
      ["No confirmed purchase orders in this period yet. Confirm a PO and receive goods against it, and vendors will start to score here.", "No sent or confirmed orders fall in the period. Pick a longer period, or confirm your orders."],
      ["Every supplier has a similar grade", "With little history most measures fall back to the neutral values. Grades become meaningful as orders are received and RFQs are priced."]
    ],
    tips: [
      "Invite suppliers to RFQs and type every price, even the losing ones: that is what builds Price win."
    ]
  },

  "pur.sccert": {
    title: "Subcontract Certificates",
    what: "A <b>subcontract certificate</b> values the work a subcontractor has done on a construction job so far. You enter the cumulative percentage complete; Orbit works out the gross value, holds back the retention, takes off what earlier certificates already certified, and shows what is payable now. Once certified, <span class='man-key'>Create vendor bill</span> turns it into a draft bill you owe the subcontractor.",
    when: [
      "A subcontractor submits a monthly progress claim.",
      "You need to certify work done and hold back retention.",
      "A certified amount needs to become a bill for payment."
    ],
    how: [
      "Make sure the subcontract exists in <b>Subcontracts</b> with its vendor, amount and retention percentage. For this example, a builder has a 120,000.00 electrical subcontract with 5% retention, and certified 30% last month.",
      "Open <b>Purchase &rsaquo; Procurement &rsaquo; Subcontract Certificates</b> and click <span class='man-key'>New</span>.",
      "Pick the <b>Subcontract</b>. You should see the Subcontractor and the Subcontract value fill in.",
      "Type <i>SC-IPC-02</i> in <b>Certificate No.</b>, set the valuation <b>Date</b>, and type 45 in <b>Percent complete</b>.",
      "Read the Valuation. You should see Gross work to date 54,000.00, Less retention 2,700.00, Net to date 51,300.00, Less previously certified 34,200.00 and Payable this certificate 17,100.00.",
      "Click <span class='man-key'>Save</span>, then <span class='man-key'>Certify</span>. The stage moves to <b>Certified</b> and the values are locked.",
      "Click <span class='man-key'>Create vendor bill</span>. You should see <i>Draft vendor bill created - retention booked to 4010</i> and the draft bill for 17,100.00 open.",
      "Check the bill and post it from Bills."
    ],
    fields: [
      ["Subcontract", "The subcontract being valued. Chosen only on a new certificate.", "required"],
      ["Subcontractor", "The subcontract's party, shown for reference.", "auto"],
      ["Certificate No.", "This certificate's number, such as SC-IPC-02. It goes on the bill.", "optional"],
      ["Subcontract value", "The agreed amount of the subcontract.", "auto"],
      ["Date", "The valuation date or period end. It also dates the bill.", "auto"],
      ["Percent complete", "The cumulative share of the whole subcontract done to date, not this month's share.", "required"],
      ["Gross work to date", "Subcontract value times percent complete.", "auto"],
      ["Less retention", "Gross work to date times the subcontract's retention percentage.", "auto"],
      ["Net to date", "Gross work to date less retention.", "auto"],
      ["Less previously certified", "Net to date on the latest certified or billed certificate for the same subcontract.", "auto"],
      ["Payable this certificate", "Net to date less previously certified. This is the bill amount.", "auto"]
    ],
    buttons: [
      ["New", "Starts a certificate."],
      ["Save", "Saves the certificate and its valuation as a draft."],
      ["Discard", "Goes back to the list."],
      ["Certify", "On a saved draft. Saves and marks it Certified, which locks the number, date and percentage."],
      ["Create vendor bill", "On a certified certificate. Creates a draft vendor bill for the payable amount, tagged to the subcontract's project, books the retention added since the last certificate, marks the certificate Billed and opens the bill."]
    ],
    after: "Certifying posts nothing. Create vendor bill creates a draft bill to the subcontract's vendor with one line on account 6100 (or 6000), which counts in what you owe once posted. It also posts a journal entry for the new retention: debit 6100, credit 4010 retention payable. That entry is only made when both accounts and a MISC journal exist.",
    links: [
      { name: "Subcontracts", how: "Set up the subcontract, its vendor, amount and retention there first.", to: "sc.list" },
      { name: "Bills", how: "The draft bill opens there; post it and pay it.", to: "inv.in" },
      { name: "Retention", how: "Shows the retention you hold from subcontractors.", to: "proj.retention" },
      { name: "Job Cost", how: "The posted bill is actual cost on the project.", to: "proj.jobcost" }
    ],
    mistakes: [
      ["No subcontracts yet. Create one first (Projects &rsaquo; Subcontracts), then certify progress here.", "There is no subcontract to certify. Create it in Subcontracts."],
      ["Set a Vendor on the subcontract first.", "The subcontract has no vendor to bill. Open it in Subcontracts, set the vendor and save, then try again."],
      ["Save failed", "Saving an existing certificate did not work, often because your role cannot manage Purchase. Reload and try again."],
      ["The retention entry is missing", "Account 6100 or 4010, or the MISC journal, does not exist in the company, so the entry was skipped. The bill was still created."]
    ],
    tips: [
      "Always type the cumulative percentage. Orbit takes off what was certified before.",
      "Certify certificates in date order: previously certified comes from the latest earlier one."
    ]
  },

  "shp.list": {
    title: "Shipments",
    what: "A <b>shipment</b> tracks goods on their way to you, usually an import, from booking to arrival, customs clearance and receipt. It also builds the <b>landed cost</b>: freight, insurance, duty and clearing are spread over the goods by value, so each item goes into stock at what it really cost you to get it onto the shelf.",
    when: [
      "You have booked goods from an overseas supplier and want to track the container.",
      "You want freight, duty and clearing costs included in the value of the stock.",
      "A shipment has arrived or cleared customs and needs receiving into stock."
    ],
    how: [
      "Open <b>Purchase &rsaquo; Logistics &rsaquo; Shipments</b> and click <span class='man-key'>New</span>. For this example, a homeware importer ships ceramic mugs worth 8,000.00.",
      "Type the container number as the shipment ref at the top, or leave it blank for an automatic SHP number. Pick the <b>Supplier</b>, <b>Mode</b> Sea and <b>Incoterm</b> FOB.",
      "Fill in <b>Container no.</b>, <b>BL / AWB no.</b>, the ports and the <b>ETD</b> and <b>ETA</b> dates.",
      "Under Goods on this shipment, choose the purchase order in <i>+ Import lines from a PO...</i>. You should see its lines added with their Goods value.",
      "Under Landed cost buildup, type Freight 1,200.00, Insurance 80.00, Customs duty 640.00 and Clearing / handling 80.00.",
      "Read the totals. You should see Goods value 8,000.00, the extra costs 2,000.00 and Total landed cost 10,000.00 (x1.25). Each line's Landed value is its Goods value times 1.25.",
      "Click <span class='man-key'>Save</span>. You should see <i>Shipment saved</i>. Change <b>Status</b> as it moves, and save each time.",
      "When the status is saved as Arrived or Customs cleared, click <span class='man-key'>Create goods receipt</span>. The Goods Receipt page opens with the products at their landed unit cost.",
      "Check the quantities and click <span class='man-key'>Confirm receipt</span>."
    ],
    fields: [
      ["Shipment ref", "The name for the shipment, such as a container number. Left blank, Orbit numbers it SHP- and a sequence.", "auto"],
      ["Supplier", "Who the goods come from. It is copied onto the goods receipt.", "optional"],
      ["Project", "The job, if the whole shipment is for one.", "optional"],
      ["Mode", "Sea, Air or Land.", "optional"],
      ["Incoterm", "Who is responsible for the goods at each stage: EXW, FCA, FOB, CFR, CIF, CPT, CIP, DAP, DPU or DDP.", "optional"],
      ["Status", "Booked, In transit, Arrived, Customs cleared, Received or Cancelled. It starts as Booked.", "optional"],
      ["Container no., BL / AWB no., Vessel / flight, Carrier / forwarder", "The shipping references. BL is the bill of lading for sea, AWB the air waybill.", "optional"],
      ["Customs status", "Free text, such as <i>under clearance</i>.", "optional"],
      ["Port of loading and Port of discharge", "Where the goods leave and arrive. Port of discharge has a default on a new shipment; change it to your port.", "optional"],
      ["ETD (departure), ETA (arrival), Actual arrival", "The planned departure and arrival dates, and the real arrival. The list is sorted by ETA.", "optional"],
      ["Freight, Insurance, Customs duty, Clearing / handling", "The costs of getting the goods to you, in your company currency. Together they are spread over the goods by value.", "optional"],
      ["Product and Description (goods)", "What is on the shipment. Only lines with a product go onto the goods receipt.", "optional"],
      ["Qty and Unit (goods)", "How many, and the unit.", "optional"],
      ["Goods value (goods)", "The purchase value of the line. Imported PO lines use quantity times the order price.", "optional"],
      ["Landed value (goods)", "Goods value times the landed cost factor.", "auto"],
      ["Notes", "Anything else worth keeping.", "optional"]
    ],
    buttons: [
      ["New", "Starts a shipment."],
      ["Save", "Saves the shipment and its goods."],
      ["Discard", "Goes back to the list."],
      ["+ Import lines from a PO...", "Adds the lines of a draft, sent or confirmed purchase order as goods."],
      ["+ Add item", "Adds an empty goods line. The &times; removes one."],
      ["Create goods receipt", "Shown when the saved status is Arrived or Customs cleared. Saves, marks the shipment Received, and opens a Goods Receipt with each product line at its landed unit cost, going to the warehouse."],
      ["Delete", "On a saved shipment. Removes it for good after you confirm."],
      ["Filters and Group By (list)", "Show In transit, At port / customs, Cleared or Received shipments, or gather them by status or supplier."]
    ],
    after: "Saving a shipment posts nothing. Confirming the goods receipt puts the products into stock and posts their value at the landed unit cost: debit stock, credit the goods received account. The freight, duty and clearing costs are not posted by the shipment itself.",
    links: [
      { name: "Shipments board", how: "The same shipments as columns by status.", to: "shp.board" },
      { name: "Purchase Orders", how: "Import an order's lines onto the shipment.", to: "po.list" },
      { name: "On Hand", how: "Received goods show there at their landed cost.", to: "inv.onhand" },
      { name: "Vendors", how: "The supplier of the shipment.", to: "vend" }
    ],
    mistakes: [
      ["Save failed", "Saving an existing shipment did not work, often because your role cannot manage Purchase. Reload and try again."],
      ["Items failed: (reason)", "The shipment was saved but its goods lines were not. Check the lines and save again."],
      ["Create goods receipt is not shown", "The status saved on the shipment is not Arrived or Customs cleared. Set the Status, click Save, and the button appears."],
      ["The purchase order still shows nothing received", "A receipt made from a shipment is not linked to the order lines, so the order's Received quantity does not change. Do not also use Receive goods on the order for the same goods, or the stock is counted twice."],
      ["The shipment says Received but nothing is in stock", "Create goods receipt marks the shipment Received as soon as it opens the receipt. If you discarded the receipt, click Create goods receipt again, or set the status back and save."]
    ],
    tips: [
      "Enter all the extra costs before receiving: the landed cost is fixed on the receipt at that moment.",
      "Lines without a product are left off the receipt, so pick a product for every item you stock."
    ]
  },

  "shp.board": {
    title: "Shipments board",
    what: "The Shipments board shows every shipment as a card in a column for its status: Booked, In transit, Arrived, Customs cleared and Received. Each column shows how many shipments it holds and their total landed value, so you can see at a glance what is on the water and what is waiting at the port. Cancelled shipments are left off.",
    when: [
      "You have several shipments moving at once and want the overall picture.",
      "You want to see how much stock value is still in transit.",
      "You want to jump into a shipment to update it."
    ],
    how: [
      "Open <b>Purchase &rsaquo; Logistics &rsaquo; Shipments board</b>. For this example, a clothing importer has five containers on the way.",
      "Read the column headers. You should see the count and the total landed value in each status.",
      "Read a card: the shipment ref, supplier, mode and container number, ETA and landed value.",
      "Click the card for the container that has arrived. The shipment opens.",
      "Change its <b>Status</b> to Arrived and click <span class='man-key'>Save</span>.",
      "Open the board again. You should see the card in the Arrived column."
    ],
    fields: [
      ["Columns", "One per status, in order. The number is how many shipments, the amount their total landed value.", "auto"],
      ["Card", "Shipment ref, supplier, mode and container number, ETA and landed value. Cards are sorted by ETA.", "auto"]
    ],
    buttons: [
      ["New shipment", "Opens a blank shipment."],
      ["List view", "Opens the Shipments list."],
      ["A card", "Opens that shipment. Cards cannot be dragged; change the status on the shipment itself."]
    ],
    after: "The board only reads. Status changes are made and saved on the shipment.",
    links: [
      { name: "Shipments", how: "The same shipments as a list, where each one is edited.", to: "shp.list" }
    ],
    mistakes: [
      ["A shipment is missing from the board", "Its status is Cancelled, which has no column. Open it from the Shipments list."],
      ["A card sits in the wrong column", "The status was changed but not saved. Open the shipment, set the Status and click Save."]
    ],
    tips: [
      "The landed values include freight, insurance, duty and clearing already entered on each shipment."
    ]
  },

  "crm.pipe": {
    title: "Pipeline",
    what: "The Pipeline shows every open sales opportunity (a <b>lead</b>) as a card in a column for its stage, such as New, Qualified, Proposition and Won. Each column shows how many leads it holds and their expected revenue, and the top of the page shows the total open pipeline and a <b>weighted forecast</b>, where each deal counts at its probability. Click a card to work the lead.",
    when: [
      "You want to see all the deals you are chasing, stage by stage.",
      "You need a realistic forecast of the sales likely to come in.",
      "You want to open a lead to log a call, move its stage or turn it into a quotation."
    ],
    how: [
      "Open <b>CRM &rsaquo; Pipeline</b>. For this example, a cleaning services company is chasing office contracts.",
      "Read the two figures at the top: Open pipeline and Weighted forecast. A 20,000.00 contract at 25% counts 5,000.00 in the forecast.",
      "Click <span class='man-key'>New</span> to add a lead. Type <i>Harbour offices, weekly clean</i> as the opportunity name and the contact's name and phone.",
      "Type 18,000.00 in <b>Expected revenue</b> and 30 in <b>Probability</b>, then click <span class='man-key'>Save</span>. You should see the Pipeline again with the card in the first column.",
      "Click the card. The lead opens.",
      "After the site visit, click <b>Qualified</b> in the stage bar at the top of the lead. You should see <i>Stage updated</i>.",
      "Go back to the Pipeline. You should see the card under Qualified and the column totals updated."
    ],
    fields: [
      ["Open pipeline", "The expected revenue of every active lead, with the count in brackets.", "auto"],
      ["Weighted forecast", "Each active lead's expected revenue times its probability, added up.", "auto"],
      ["Stage columns", "One per stage in the order set in Stages, each with the count and total expected revenue.", "auto"],
      ["Card", "The opportunity name, the customer or contact name, and the expected revenue with its probability.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank lead."],
      ["A card", "Opens the lead. Cards cannot be dragged; change the stage by clicking it in the stage bar on the lead."]
    ],
    after: "The Pipeline only reads. Everything is changed on the lead itself, and nothing here touches your accounts.",
    links: [
      { name: "Leads", how: "The same leads as a table you can filter, group and edit in place.", to: "crm.leads" },
      { name: "Stages", how: "The columns of the pipeline and their order.", to: "crm.stages" },
      { name: "Quotations", how: "Create Quotation on a lead starts a quotation for its customer.", to: "so.list" },
      { name: "Tenders", how: "Create Tender on a lead starts a priced bid.", to: "est.list" }
    ],
    mistakes: [
      ["An archived lead is not on the board", "The Pipeline shows only active leads. Find archived ones in Leads with the Lost filter."],
      ["Won deals still count in Open pipeline", "Every active lead counts, whatever its stage. Archive a lead once it is won or lost to take it out of the figures."]
    ],
    tips: [
      "The first time the Pipeline opens with no stages, Orbit creates New, Qualified, Proposition and Won for you.",
      "Keep probabilities honest: the weighted forecast is only as good as they are."
    ]
  },

  "crm.leads": {
    title: "Leads",
    what: "A <b>lead</b> (opportunity) is a chance to win work: who it is, where, how they stand, what you have quoted and what happens next. This list shows every lead as a table you can filter, group and edit in place; opening one shows the full record with its people, photos and activity. From a lead you create the customer, a quotation, a tender or an event in one click.",
    when: [
      "A new enquiry comes in and needs recording.",
      "You are planning a round of visits and want the leads by area.",
      "You want every lead with a next action due, or those never contacted.",
      "A lead is ready to become a customer, a quotation, a tender or an event."
    ],
    how: [
      "Open <b>CRM &rsaquo; Leads</b> and click <span class='man-key'>New</span>. For this example, a landscaping firm records a hotel garden redesign.",
      "Type <i>Seaview Hotel gardens</i> in the opportunity name, then the <b>Contact name</b>, <b>Email</b> and <b>Phone</b>.",
      "Type 45,000.00 in <b>Expected revenue</b>, 20 in <b>Probability</b> and <i>Referral</i> in <b>Source</b>.",
      "Fill in <b>Area</b>, <b>How they stand</b> such as <i>Interested</i>, and <b>Next action</b> <i>Site visit</i> with its <b>Owner of it</b> and <b>By when</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the Pipeline with the new card.",
      "Open the lead again from Leads. Under People on this lead, click <span class='man-key'>+ Add a person</span>, add the hotel's manager and click <span class='man-key'>Save the people</span>.",
      "After the visit, click <span class='man-key'>+ Log activity</span>, choose Meeting, type a subject and a follow-up date, and click <span class='man-key'>Log</span>. You should see <i>Activity logged</i>.",
      "When they ask for a price, click <span class='man-key'>Create Customer</span>, then <span class='man-key'>Create Quotation</span>. You should see <i>Quotation created (draft)</i> and the quotation open for the new customer."
    ],
    fields: [
      ["Opportunity name", "What the lead is called, at the top of the form.", "required"],
      ["Customer", "An existing customer, or <i>(none yet)</i>. <i>+ Add a new customer...</i> creates one. A lead needs a customer or a contact name, email or phone.", "optional"],
      ["Contact name, Email, Phone", "The person to follow up with, if they are not yet a customer. Phone has a dialling code, an area code and the number.", "optional"],
      ["Expected revenue", "What the deal is worth if won. Used in the pipeline totals.", "optional"],
      ["Probability", "Your chance of winning, 0 to 100. A new lead starts at 10. Used in the weighted forecast.", "optional"],
      ["Source", "Where the lead came from, such as a referral or the website.", "optional"],
      ["Area", "The sales area or round it belongs to. Suggests areas already used.", "optional"],
      ["Map pin", "A maps link to the exact spot. <i>Open the map</i> appears once saved.", "optional"],
      ["How they stand", "Where the prospect is with you, such as Interested or Has another supplier. Suggests values already used.", "optional"],
      ["Their project stage", "How far along the prospect's own project is, which decides when to call.", "optional"],
      ["Next action, Owner of it, By when", "The single next step, who does it and by when.", "optional"],
      ["What we have from them", "What they have given you to quote from, such as drawings or a brief.", "optional"],
      ["Quoted", "The amount you quoted and the day you sent it.", "optional"],
      ["Against what specification", "What the quoted price was built on.", "optional"],
      ["Notes", "The running record of anything else.", "optional"],
      ["Stage bar", "The stages across the top. A new lead starts in the first stage; clicking a stage on a saved lead changes it at once.", "auto"],
      ["People on this lead", "On a saved lead: each person's Name, Role, Phone and Email. The first is the primary contact.", "optional"],
      ["Photos &amp; files", "On a saved lead: site photos and documents. Images are compressed automatically.", "optional"],
      ["Log activity: Type, Follow-up date, Subject, Note, Already done", "Type is Call, Email, Meeting, Note or Task. Tick Already done to log it as completed.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank lead."],
      ["Save", "Saves the lead and returns to the Pipeline."],
      ["Discard", "Returns to the Pipeline without saving."],
      ["Delete", "On a saved lead. Removes it for good after you confirm. Archiving from the list is usually better."],
      ["Create Customer", "Shown when the lead has no customer. Creates a customer from the contact name, or the lead name, with the email and phone, and links it."],
      ["Create Quotation", "Creates a draft quotation for the lead's customer, noted <i>From opportunity</i>, and opens it."],
      ["Create Tender", "Creates a draft tender for the lead's customer, with the lead name, the expected revenue as its value and a 15% margin, linked back to the lead, and opens it."],
      ["Create Event and Open Event", "Creates an event in the Events app from the lead, or opens the one already made."],
      ["+ Add a person, Save the people, Remove", "Add rows for the people on the lead, save them together, or remove one after you confirm."],
      ["+ Log activity and Mark done", "Record a call, email, meeting, note or task, and tick off a follow-up when it is done."],
      ["Select, Archive, Delete (list)", "Tick leads in the list, then Archive them (hidden but kept) or Delete them for good."],
      ["A cell (list)", "Click a cell in Opportunity, Area, Contact, Phone, How they stand, Their stage, Stage, Next action, Owner, By when or Quoted, type, and press Enter to save."]
    ],
    after: "Leads change nothing in your accounts. Create Customer adds a contact. Create Quotation, Create Tender and Create Event make a draft document in Sales, Estimation or Events linked to the lead; those follow their own rules from there.",
    links: [
      { name: "Pipeline", how: "The same active leads as columns by stage, with the forecast.", to: "crm.pipe" },
      { name: "Stages", how: "The stages a lead moves through.", to: "crm.stages" },
      { name: "Customers", how: "Create Customer adds the lead's contact as a customer.", to: "cust" },
      { name: "Quotations", how: "Create Quotation opens a draft quotation there.", to: "so.list" },
      { name: "Tenders", how: "Create Tender opens a draft tender there.", to: "est.list" },
      { name: "Events", how: "Create Event starts an event from the lead.", to: "events.list" }
    ],
    mistakes: [
      ["Name required", "The opportunity name at the top is empty. Type a name."],
      ["Add a customer or a contact name / email / phone so this opportunity can be followed up.", "The lead has no way to reach anyone. Pick a customer or fill in a contact name, email or phone."],
      ["Link or create a customer first (use Create Customer).", "Create Tender needs a customer saved on the lead. Click Create Customer, or pick a customer and Save, then try again."],
      ["Link or create a customer first", "Create Quotation needs a customer saved on the lead. Pick one and Save, or use Create Customer."],
      ["Could not save: (reason)", "The lead or its people could not be saved, often because your role cannot manage the CRM."]
    ],
    tips: [
      "Save after picking a customer: the Create buttons use the customer saved on the lead, not the one just chosen.",
      "Group the list by Area to plan a round of visits, and filter to Has a next action for the week's calls.",
      "The Lost filter shows archived leads and those with a lost reason."
    ]
  },

  "crm.stages": {
    title: "Stages",
    what: "Stages are the steps a lead moves through, and the columns of the Pipeline. This screen lists them with their order and whether one is marked as the won stage. You add new stages here; the order number decides where each column sits.",
    when: [
      "Your sales process has a step the default stages do not cover, such as Site visit or Negotiation.",
      "You want to check the order the pipeline columns appear in."
    ],
    how: [
      "Open <b>CRM &rsaquo; Configuration &rsaquo; Stages</b>. For this example, a kitchen fitter adds a Design visit step between Qualified and Proposition.",
      "Read the list. If it is empty, open the Pipeline once: it creates New (10), Qualified (20), Proposition (30) and Won (40).",
      "Click <span class='man-key'>New</span>. The <b>New pipeline stage</b> box opens.",
      "Type <i>Design visit</i> in <b>Name</b> and 25 in <b>Order</b>, and leave <b>Won stage</b> on No.",
      "Click <span class='man-key'>Save</span>. You should see <i>Stage added</i> and the stage in the list.",
      "Open the Pipeline. You should see a Design visit column between Qualified and Proposition."
    ],
    fields: [
      ["Name", "What the stage is called, as the pipeline column and the stage bar show it.", "required"],
      ["Order", "Where the stage sits: lower numbers come first. It starts at 50.", "optional"],
      ["Won stage", "Marks the stage as the won stage in this list. Orbit does not act on it: moving a lead there creates nothing. Use the buttons on the lead to create the customer, quotation or tender.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New pipeline stage box."],
      ["Save and Cancel", "Add the stage, or close the box without adding it."]
    ],
    after: "A new stage adds a column to the Pipeline and a step to every lead's stage bar. Nothing in your accounts changes.",
    links: [
      { name: "Pipeline", how: "Each stage is a column there.", to: "crm.pipe" },
      { name: "Leads", how: "The Stage column and the stage bar use these stages.", to: "crm.leads" }
    ],
    mistakes: [
      ["Name required", "The stage has no name. Type one."],
      ["Could not save: (reason)", "The stage could not be added, often because your role cannot manage the CRM."],
      ["A stage cannot be renamed or removed", "This screen only adds stages; existing ones do not open for editing. Plan the names and order before adding them."]
    ],
    tips: [
      "Leave gaps in the order numbers, such as 10, 20, 30, so a new stage can slot in between."
    ]
  },

  "est.list": {
    title: "Tenders",
    what: "A <b>tender</b> is a priced bid for a construction job. You build the cost of every item in a spreadsheet grid, add your margin, and Orbit shows total cost, total value and margin together. Track it from draft to submitted, and when you win, <span class='man-key'>Mark Won</span> creates the project with its contract value, cost budget and schedule of values already filled in.",
    when: [
      "A client has invited you to price a job.",
      "You need a cost build-up with a margin, not a simple quotation.",
      "A bid has been submitted, won or lost and its status needs recording.",
      "A won bid needs to become a project."
    ],
    how: [
      "Open <b>Estimation &rsaquo; Tenders</b> and click <span class='man-key'>New</span>. For this example, a contractor prices a warehouse roof replacement.",
      "Type <i>Warehouse roof, Unit 4</i> as the tender name, pick the <b>Client</b>, set <b>Default margin %</b> to 12 and set <b>Valid until</b>.",
      "In the grid's first row type <i>R1</i> in Code, <i>Strip existing roof</i> in Description, m2 in Unit, 1,500 in Qty and 6.00 in Unit cost. You should see Cost 9,000.00 and Sell 10,080.00.",
      "Click <span class='man-key'>+ Row</span> and add <i>Insulated panels, supply and fix</i>: 1,500 m2 at 38.00. Cost shows 57,000.00.",
      "To break a row down, add a row under it and click the indent arrow in its row number cell. The parent row then totals its children.",
      "Read the totals under the grid: Total cost 66,000.00, Total value (sell) 73,920.00, Margin 7,920.00 (10.7%).",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a number such as <i>TND/2026/0003</i>. Click <span class='man-key'>Print</span> for the estimate to send.",
      "Once sent, click <span class='man-key'>Mark Submitted</span>. The stage moves to <b>Submitted</b>.",
      "When the client accepts, click <span class='man-key'>Mark Won</span>. You should see <i>Tender won - project created with cost budget &amp; schedule of values</i> and the new project open."
    ],
    fields: [
      ["Tender name", "What the bid is for. It becomes the project name when won. Left blank, it saves as <i>Tender</i>.", "optional"],
      ["Number", "Your tender reference. Left blank, Orbit numbers it TND/ then the year and a sequence. It becomes the project code.", "auto"],
      ["Client", "The customer inviting the tender. Only customers appear. Needed before Mark Won.", "optional"],
      ["Default margin %", "The margin put on new grid rows. It starts at 15. Save after changing it: new rows use the value the tender had when it was opened.", "optional"],
      ["Tender date", "When you price or submit the bid. It starts as today.", "auto"],
      ["Valid until", "How long the bid price holds. It prints on the estimate.", "optional"],
      ["Code, Description, Unit (grid)", "The item's code, what it is and its unit.", "optional"],
      ["Qty and Unit cost (grid)", "How many and what one costs you.", "optional"],
      ["Cost (grid)", "Qty times Unit cost, as a formula you can change.", "auto"],
      ["Margin % (grid)", "The row's margin, starting from the default.", "optional"],
      ["Sell (grid)", "Cost plus the margin, as a formula you can change.", "auto"],
      ["Formulas (grid)", "Type = to start one. <b>@D</b> means this row's column D, <b>A1</b> any cell; SUM, AVG, MIN, MAX, COUNT, ROUND and ABS work with ranges such as D1:D9.", "optional"],
      ["Total cost, Total value (sell), Margin", "The money columns added up over the top-level rows.", "auto"]
    ],
    buttons: [
      ["New", "Starts a blank tender."],
      ["Save", "Saves the tender and its grid. Not shown on a won tender, which is locked."],
      ["Discard", "Goes back to the list."],
      ["Print", "Prints the estimate: code, description, quantity, unit, rate and amount, with the total."],
      ["Delete", "On a saved tender. Removes it for good after you confirm."],
      ["Mark Submitted", "On a draft. Saves and marks it Submitted with today's date."],
      ["Mark Won", "On a draft or submitted tender. Saves, then creates the project and marks the tender Won."],
      ["Mark Lost", "On a draft or submitted tender. Saves and marks it Lost."],
      ["Open project", "On a won tender. Opens the project it created."],
      ["+ Row and + Sub-item", "Add a row at the same level as the last row, or one level in under it."],
      ["Row arrows and &times;", "In a row number cell: move the row out a level, in a level, or delete it."],
      ["Column buttons", "In a column header: rename it, switch it between text (T), number (#) and money ($), delete it, or add a column with +."]
    ],
    after: "A tender posts nothing. Mark Won creates a project named after the tender, with the tender number as its code, the client, and the total sell as its contract value. It adds a cost budget line <i>Estimate cost</i> for the total cost, and a schedule of values with one line per grid row that has no children, at its sell amount. The tender is then locked.",
    links: [
      { name: "Projects", how: "Mark Won creates the project there, with its budget and schedule of values.", to: "proj.list" },
      { name: "Customers", how: "The client on the tender becomes the project's customer.", to: "cust" },
      { name: "Leads", how: "Create Tender on a lead starts a tender linked back to it.", to: "crm.leads" },
      { name: "Job Cost", how: "The project's cost budget from the tender is compared with actual cost there.", to: "proj.jobcost" },
      { name: "Quotations", how: "For a simple priced offer of products or services, use a quotation.", to: "so.list" }
    ],
    mistakes: [
      ["Set a customer on the tender before marking it Won - the project needs a client to bill against.", "The tender has no Client. Pick one, then click Mark Won again."],
      ["Could not create project: (reason)", "The project could not be created, often because your role cannot create projects. The tender stays open."],
      ["Save failed", "Saving an existing tender did not work, often because your role cannot manage Estimation. Reload and try again."],
      ["Totals show zero", "The Cost or Sell column was deleted or changed from money. Totals only add up money columns set up as cost and sell."],
      ["A formula shows 0", "It refers to a cell with text, or uses something other than numbers, cell references, + - * / and the listed functions."]
    ],
    tips: [
      "Use sub-items for detail: a parent row totals its children, and only the rows with no children go to the schedule of values.",
      "The Margin column on the list is margin on sell, so 12% on cost shows as 10.7%."
    ]
  }

});
