/* Orbit screen help: Kitchen service, the menu, stock control and Point of Sale.
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
 *
 * The service screens (Counter, The book, Floor, Kitchen display, Collection
 * screen) save through the offline outbox (svcWrite in app.js). The Point of
 * Sale screens write straight to the database and do not.
 */
orbitScreenHelp({

  "kitchen.counter": {
    title: "Counter",
    what: "The till for a shop with no tables: a cafe, a bakery counter, a takeaway hatch. You tap what the customer is having, take the money, and one press sends the whole order to the kitchen, prints the receipt and shows the customer a <b>call number</b> to listen for. Everything you do here is saved on the device first if the connection drops, and sent when it comes back.",
    when: [
      "A customer orders and pays at the counter before the food or drink is made.",
      "You want orders called by number, with the numbers shown on a Collection screen.",
      "You take several currencies in one payment and need the change worked out."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Service &rsaquo; Counter</b>. If the company has more than one store, pick the store in the top bar. You should see the category strip, the menu as tiles with prices, and an empty <b>This order</b> panel.",
      "For this example a cafe charges 11% VAT and the customer wants a flat white (3.50) and a croissant (2.80) to take away. Leave <b>Takeaway</b> selected.",
      "Tap <i>Flat white</i>, then <i>Croissant</i>. You should see two lines, Subtotal 6.30, VAT 11% 0.69 and Total 6.99.",
      "If the item asks a question (milk, size), answer it in the box that opens and press <span class='man-key'>Save</span>. Any extra price is added to the line.",
      "If the customer mentions an allergy, press <span class='man-key'>Name / note</span>, type <i>nut allergy</i> in <b>Allergy or note</b> and press <span class='man-key'>Save</span>.",
      "Press <span class='man-key'>Take payment</span>. The box is titled <i>Take 6.99</i> and the first tender line is already filled in: Cash, your own currency, 6.99.",
      "The customer hands over 10.00. Change the amount to 10.00. You should see <b>Change 3.01</b> at the bottom of the tender lines.",
      "For a card payment instead, choose <i>Card</i> in the method list and type the last four digits in <b>Reference</b>.",
      "Press <span class='man-key'>Save</span>. The receipt goes to the printer and a large <b>Order number</b>, for example 42, fills the screen.",
      "Tap anywhere, or wait six seconds, and the counter is clear for the next customer. The order is now on the Kitchen display as <b>#42</b> and under <b>Being made</b> on the Collection screen."
    ],
    fields: [
      ["Store (top bar)", "Only shown when the company has more than one active store. Decides which items are marked 86, which store the order and payments are stamped with, and whose daily number sequence is used. The first store is picked for you.", "auto"],
      ["Search the menu", "Type part of an item's name to narrow the tiles.", "optional"],
      ["Category strip", "Shows one category at a time, or <b>All</b>. Only categories that have items on sale appear.", "optional"],
      ["Takeaway / Eat in", "The order type. It is stamped on the order and shows on the Kitchen display and in Service times. Changing it after items are on the order updates the order.", "optional"],
      ["Modifier choices", "Only for an item with modifier groups attached. A group marked <b>Must choose</b> has to be answered before the item goes on; a group that allows more than one choice shows tick boxes, otherwise one choice. The choice names are kept on the line and printed for the kitchen.", "optional"],
      ["Name to call (Name / note)", "A name for shops that call names. It shows under the number on the Collection screen and on the kitchen ticket.", "optional"],
      ["Allergy or note (Name / note)", "Write the allergy, not the dish. It shows as a red ALLERGY line on the kitchen ticket and on a printed docket.", "optional"],
      ["Method (tender line)", "Cash, Card, Wallet / gift card, Voucher, Loyalty points, On account or Transfer. It is recorded on the payment as a label. Only Cash counts towards what should be in a cash drawer.", "required"],
      ["Currency (tender line)", "Your own currency, or any currency that has an exchange rate. Orbit converts the amount at today's rate and shows what it is worth beside it.", "auto"],
      ["Amount (tender line)", "What the customer physically handed over in that currency. It starts at the full total. The payment cannot be saved until the tender lines cover the total.", "required"],
      ["Change given in", "Appears when change is due. Pick the currency you are handing the change back in and Orbit shows the amount to give.", "optional"],
      ["Reference", "A card authorisation or the last four digits of the card.", "optional"]
    ],
    buttons: [
      ["Collection screen", "Opens the customer-facing board of numbers being made and ready."],
      ["An item tile", "Adds one of that item to the order at its Sales Price, plus any modifier extras. Each tap adds a new line. The first tap also creates the order."],
      ["&times; on a line", "Removes that line from the order."],
      ["Name / note", "Adds a name to call and an allergy or note to the order."],
      ["Clear", "Asks <i>Clear this order without taking payment?</i> and, if you agree, removes the lines and marks the order cancelled."],
      ["Take payment", "Opens the tender box. It stays greyed until there is at least one line."],
      ["Add another currency", "Adds a second tender line, filled in with whatever is still owed, converted into the next currency that has a rate."],
      ["&times; on a tender line", "Removes that tender line when there is more than one."],
      ["Save (in the payment box)", "Records every tender (change is recorded as a negative tender), gets the next call number, sends every line to the kitchen, marks the order paid, prints the receipt and shows the number."],
      ["Cancel (in the payment box)", "Closes the box without taking money. The order stays on the screen, unpaid."]
    ],
    after: "The order is created as soon as the first item is tapped, with a number starting with <b>C</b>, and each line is saved as you go. Taking payment writes the tenders against the order, marks it <b>paid</b>, sends all its lines to the <b>Kitchen display</b> at once (a counter has no courses) and gives it a call number. Call numbers are counted per store per day, start at 1 each day and go back to 1 after 999. The order then counts in <b>Point of Sale &rsaquo; Sales</b>, <b>Menu engineering</b>, <b>Cost variance</b> and, once the kitchen bumps it, <b>Service times</b>. Counter sales are not tied to a register session, so they are not in the Register's drawer count or in Sessions. The sale itself does not post a journal entry and does not move stock.",
    links: [
      { name: "Kitchen display", how: "Every paid counter order appears there as a ticket headed with its number.", to: "kitchen.kds" },
      { name: "Collection screen", how: "Shows the number under Being made, then Ready to collect once the kitchen has marked every item ready.", to: "kitchen.collect" },
      { name: "Items", how: "The tiles are the active items on sale; the price is the item's Sales Price and the picture is the item's photo.", to: "products" },
      { name: "Availability (86)", how: "An item marked unavailable at this store does not appear on the counter.", to: "sc.availability" },
      { name: "Modifiers", how: "The questions asked when an item with modifier groups is tapped.", to: "menu.modgroups" },
      { name: "Stores", how: "The store picker lists your active stores, and the receipt prints that store's address and phone.", to: "estate.stores" },
      { name: "Taxes", how: "The VAT rate is the highest active percentage sales tax.", to: "taxes" },
      { name: "Exchange Rates", how: "A currency can only be taken when it has a rate.", to: "rates" },
      { name: "Sales", how: "Every counter order is listed there.", to: "pos.orders" }
    ],
    mistakes: [
      ["Nothing matches. An item may be off the menu right now, or marked 86 at this store.", "The search text or the category strip hides it, the item is marked unavailable for this store in Availability (86), or the item is archived. Clear the search, tap All, or put the item back on."],
      ["Add something first", "You pressed Name / note before any item was on the order. Tap an item first."],
      ["Choose (group name)", "The item's modifier group must be answered. Pick a choice, then Save."],
      ["Choose (group name) allows at most (number)", "More choices were ticked than the group allows. Untick some."],
      ["That does not cover the bill yet", "The tender lines add up to less than the total. Raise an amount or add another tender line."],
      ["No exchange rate for (currency) today - add one in Settings, Currencies", "A tender line uses a currency with no rate. Add the rate in Accounting &rsaquo; Configuration &rsaquo; Exchange Rates, or take that part in another currency."],
      ["No connection, so this till gave the number itself.", "Shown under the order number when the connection was down as you pressed Save. The till carries on from the last number it gave today for this store, so the customer still gets a number, and the order reaches the kitchen and the Collection screen once the connection is back. Another till that was offline at the same time can give the same number, so call the name as well when two match."],
      ["Offline with a count of changes waiting", "The connection has dropped. Orders and payments are being kept on this device and send themselves, in order, when the connection returns. Keep the screen open; it cannot load the menu again with no connection."],
      ["A queued change was refused: (reason)", "A change saved while offline was rejected by the database when it was sent. Read the reason, then correct the order by hand."]
    ],
    tips: [
      "Photograph your best-selling items first: a tile with a picture is quicker to find than a name.",
      "Choosing Voucher or Loyalty points as the method only labels the payment. The counter does not look up a voucher code or take points off a customer; that happens on the Point of Sale Register.",
      "The counter does not use Menus or day-parting: it offers every active item on sale that is not marked 86 at the store."
    ]
  },

  "kitchen.book": {
    title: "The book",
    what: "The host's screen: one day's bookings for one store, in time order, with the covers committed, who is due and who is late. <span class='man-key'>Seat</span> puts a party on a table and opens the order pad with the guest's name, covers and note already filled in. The book reads itself again every 30 seconds, and what you save is kept on the device if the connection drops.",
    when: [
      "A guest phones, emails or walks in to book a table.",
      "Before and during service, to see how many covers are coming and who is late.",
      "A party arrives and needs to be seated.",
      "A party does not turn up, or cancels."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Service &rsaquo; The book</b>. Pick the store in the top bar if you have more than one. You should see today's date between the arrows.",
      "For this example a restaurant takes a booking for four people at 20:00 tonight, for a birthday. Press <span class='man-key'>New booking</span>.",
      "<b>Date</b> is already the day on screen. Change <b>Time</b> from 19:30 to 20:00.",
      "Type the name the caller gives in <b>Guest</b> and their number in <b>Phone</b>.",
      "Set <b>Party size</b> to 4. Leave <b>Holds the table for</b> on 90 minutes, <b>Came from</b> on Phone and <b>Status</b> on Booked.",
      "Type <i>Birthday</i> in <b>Occasion</b> and <i>nut allergy, one high chair</i> in <b>Note</b>, then press <span class='man-key'>Save</span>. You should see <i>Booked</i>, the booking at 20:00, and the strip reading 4 covers booked and 1 bookings.",
      "At 19:55 the row is flagged <b>now</b>. If it is still not seated at 20:11 it is flagged <b>late</b>.",
      "When the party arrives, press <span class='man-key'>Seat</span> on their row. The Table list offers free tables with at least 4 seats first; tables already in use say <i>(occupied)</i>.",
      "Pick table T6 and press <span class='man-key'>Save</span>. You should see <i>(guest) seated at T6</i>, and the order pad for T6 opens.",
      "Tap the first item. The order is created with the guest's name, 4 covers and the note as its allergy note, so the kitchen ticket shows the allergy from the first send."
    ],
    fields: [
      ["Date", "The day of the booking. It starts on the day shown in the book; left empty it is today.", "auto"],
      ["Time", "The time the party is due. It starts at 19:30. Late and due flags work from this time.", "auto"],
      ["Guest", "The name on the booking. It is shown on the row and carried onto the order when the party is seated.", "required"],
      ["Phone", "A number to call if they are late.", "optional"],
      ["Party size", "How many covers. It adds to the covers booked and decides which tables are offered first when seating. It starts at 2.", "optional"],
      ["Holds the table for", "60, 90, 120, 150 or 180 minutes. Saved with the booking.", "optional"],
      ["Came from", "Phone, Walk-in, Online or Aggregator. Put walk-ins in the book too, so the covers count is complete.", "optional"],
      ["Status", "Booked, Seated, No show, Cancelled, Waitlist or Finished. Waitlist bookings are listed in their own section. No show and Cancelled are left out of the covers and bookings counts.", "optional"],
      ["Occasion", "Birthday, anniversary, first visit. Shown on the row and in the Seat box.", "optional"],
      ["Note", "Allergies, a quiet table, a high chair. Carried onto the order as its allergy note when the party is seated from the book.", "optional"],
      ["Store", "Not in the form: a new booking belongs to the store picked in the top bar.", "auto"],
      ["Table (Seat box)", "The table to put the party on. Only tables of the booking's store are listed.", "required"]
    ],
    buttons: [
      ["&lsaquo; and &rsaquo;", "Move the book back or forward one day."],
      ["Date box (top bar)", "Jump straight to a day."],
      ["Store picker", "Only with more than one store. Shows that store's bookings, and new bookings go to that store."],
      ["New booking", "Opens a blank booking for the day on screen."],
      ["Seat", "Shown on Booked and Waitlist rows. Marks the booking seated on the table you pick, marks the table seated and opens its order pad."],
      ["No show", "Shown on Booked and Waitlist rows. Marks the booking as a no show straight away."],
      ["Edit", "Opens the booking to change it."],
      ["Save", "Saves the booking, or seats the party in the Seat box."],
      ["Cancel booking", "Only on an existing booking. Marks it cancelled; the record is kept."],
      ["Cancel", "Closes the box without saving."]
    ],
    after: "A booking is a record in the company's reservations, shown on this screen and in <b>Kitchen &rsaquo; Delivery &rsaquo; All bookings</b>. Seating marks the booking <b>Seated</b> with the table and the time, and marks the table <b>Seated</b> on the Floor. When the first item goes on the pad, the booking is linked to that order and the order takes the guest name, covers and note. Nothing is posted to the accounts.",
    links: [
      { name: "Floor", how: "A seated table shows as Seated on the floor plan, and seating opens its order pad.", to: "kitchen.floor" },
      { name: "Tables", how: "Seat can only offer the tables set up for the store, with their seats and zones.", to: "estate.tables" },
      { name: "All bookings", how: "The same bookings as a searchable list across every day.", to: "dlv.reservations" },
      { name: "Stores", how: "The store picker and each booking's store come from your active stores.", to: "estate.stores" }
    ],
    mistakes: [
      ["Who is the booking for?", "Guest is empty. Type the name on the booking."],
      ["No tables set up for this store yet - add them under Kitchen &gt; Estate &gt; Tables", "The booking's store has no active tables. Add them in Tables, giving each a name, seats and a zone."],
      ["No free table seats (number). Pick one anyway, or join two together on the floor.", "Every free table is smaller than the party. Pick the closest and merge a second table on the Floor if you need to."],
      ["Nothing in the book for (date)", "There are no bookings that day for the store picked. Check the date and the store picker."],
      ["A booking you made is not in the list", "It was saved against the store picked in the top bar at the time. Switch the store picker to see it."],
      ["No late or now flag appears", "Flags only show on today's date and only for bookings still marked Booked."],
      ["A queued change was refused: (reason)", "A change saved while offline was rejected when it was sent. Read the reason and make the change again."]
    ],
    tips: [
      "Seating from the book is what carries the allergy onto the order. If you seat a party by tapping the table on the Floor instead, add the note on the pad yourself.",
      "Use No show rather than Cancel booking when the guest simply did not come, so the two can be told apart later."
    ]
  },

  "kitchen.floor": {
    title: "Floor",
    what: "The table-service screen a waiter or floor manager holds. It opens on the floor plan, grouped by zone and coloured by state; tap a table to open its order pad, add items by seat and by course, send one course at a time to the kitchen, and take the bill with any split. Everything you save here is kept on the device if the connection drops and sent when it comes back.",
    when: [
      "A party sits down and orders at the table.",
      "The next course is ready to go to the kitchen.",
      "The table asks for the bill, together or separately.",
      "A party moves table, or two tables become one bill.",
      "You need a printed guest bill or a kitchen docket."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Service &rsaquo; Floor</b> and pick the store if you have more than one. For this example a restaurant charges 11% VAT and a couple sits at T4. Tap <b>T4</b>, which shows Free.",
      "The pad opens and says <i>new order</i>. Above the lines, tap seat <b>1</b> and course <b>Starters</b>, then tap <i>Soup</i> (6.00). You should see it under <b>Starters</b> marked <i>held</i>, and T4 becomes Seated on the floor plan.",
      "Tap course <b>Mains</b> and tap <i>Steak</i> (24.00). Tap seat <b>2</b>, course <b>Starters</b>, <i>Salad</i> (5.00); then course <b>Mains</b>, <i>Pasta</i> (14.00). You should see Subtotal 49.00, VAT 11% 5.39, Total 54.39.",
      "Press <span class='man-key'>Note / allergy</span>, set <b>Covers</b> to 2, type <i>shellfish allergy</i> and press <span class='man-key'>Save</span>.",
      "Press <span class='man-key'>Send starters (2)</span>. You should see <i>2 starters sent to the kitchen</i>, the starters marked <i>sent</i>, and the button now reads <b>Send mains (2)</b>. The ticket appears on the Kitchen display.",
      "When the starters are cleared, press <span class='man-key'>Send mains (2)</span>.",
      "The guests ask to pay separately. Press <span class='man-key'>Bill</span>, then <b>By seat</b>, and choose <b>Seat 1</b>: the note says this tender will settle 33.30 (30.00 plus VAT).",
      "Seat 1 pays cash: type 40.00 in the tender line. You should see <b>Change 6.70</b>. Press <span class='man-key'>Save</span>. You should see <i>33.30 taken, 21.09 still owed</i> and the pad again.",
      "Press <span class='man-key'>Bill</span>, <b>By seat</b>, <b>Seat 2</b>. Choose <i>Card</i>, leave 21.09, type the last four digits in <b>Reference</b> and 2.00 in <b>Tip</b>, then <span class='man-key'>Save</span>.",
      "The receipt prints with both tenders, the tip and PAID. You should see <i>Bill settled (tips 2.00) - table free to clear</i>, and T4 shows <b>Needs clearing</b> on the floor plan."
    ],
    fields: [
      ["Store (top bar)", "Only shown with more than one active store. Decides which tables are drawn (that store's tables, plus any table with no store set), which items are marked 86, and the store stamped on orders and payments.", "auto"],
      ["Search the menu and category strip", "Narrow the tiles on the pad by name or by category.", "optional"],
      ["Seat", "Who the next item is for: <b>Table</b> for something shared, or a seat number. Set it before tapping the item. The number of seat chips follows the covers, or the table's seats. By seat billing depends on it.", "optional"],
      ["Course", "Starters, Mains or Dessert: when the next item should reach the table. Set it before tapping the item. The kitchen only gets the course you send.", "optional"],
      ["Modifier choices", "Only for an item with modifier groups attached. A required group must be answered before the line goes on.", "optional"],
      ["Guest name (Note / allergy)", "Shown on the kitchen ticket.", "optional"],
      ["Covers (Note / allergy)", "How many people are at the table. Shown on the bill and the docket, and sets how many seat chips appear.", "optional"],
      ["Allergy or note (Note / allergy)", "Write the allergy, not the dish. It shows in red on the kitchen ticket and in a box on the docket.", "optional"],
      ["Move this party to (Table box)", "A table with no open order. The whole order moves there.", "optional"],
      ["Merge another table into this one (Table box)", "A table that has an open order. Its items move onto this bill and its order is closed.", "optional"],
      ["Split (Bill box)", "Whole bill, By seat, Evenly, By item or By amount. Every share includes VAT, so the shares add up to the bill.", "optional"],
      ["Split how many ways / This tender covers", "For Evenly: the number of ways (at least 2) and how many of those shares this tender pays. It divides what is still owed.", "optional"],
      ["Seat or items to pay for", "For By seat, one seat (or Shared for lines with no seat). For By item, tick the lines. Lines already paid this way are not offered again.", "optional"],
      ["Amount to take now", "For By amount. An amount above what is still owed is reduced to the balance.", "optional"],
      ["What they hand over", "One tender line per method and currency: method, currency and amount, exactly as on the Counter. Change due appears with <b>Change given in</b>.", "required"],
      ["Tip", "Recorded with this payment and added to the order's tips. It is not part of the bill.", "optional"],
      ["Reference", "Card authorisation, last four digits or a voucher code.", "optional"]
    ],
    buttons: [
      ["Dockets: on / off", "Prints a paper docket at the pass every time a course is sent. The setting belongs to this device only."],
      ["A table", "Opens that table's pad, carrying on with its open order if it has one."],
      ["An item tile", "Adds one of the item at its Sales Price plus any modifier extras, on the seat and course selected. The first item creates the order."],
      ["&times; on a line", "Only on a line not yet sent. Removes it. A sent line shows <i>sent</i> and cannot be removed here."],
      ["Send (course) (number)", "Sends the lowest course still held to the kitchen. Reads <i>Nothing held</i> when every line has gone."],
      ["Note / allergy", "Guest name, covers and allergy for the order."],
      ["Bill", "Opens the bill with the balance still to pay and the split options."],
      ["Print the bill for the guest", "Inside the Bill box: prints the bill before payment."],
      ["Table", "Opens the box to move the party, merge another table, or print."],
      ["Guest bill / Kitchen docket", "Inside the Table box: print the bill, or a docket of the lines already sent."],
      ["Add another currency", "Adds a tender line pre-filled with the rest of the share in another currency."],
      ["Save", "Saves the note, carries out the move or merge, or takes the payment."],
      ["Cancel", "Closes the box without saving."]
    ],
    after: "The first item creates a dine-in order numbered from <b>T</b> and marks the table Seated. Sending marks those lines as fired, which puts them on the <b>Kitchen display</b>, stamps the order's first send time and marks the table Ordered. Each payment is recorded with its split, store and who took it; when the balance reaches zero the order is marked paid and closed, the receipt prints and the table becomes Needs clearing. If the kitchen has not bumped the ticket by then, paying stamps the serving time used by <b>Service times</b>. Moving changes the order's table; merging moves the lines and marks the other order merged. Table orders are not tied to a register session and do not post to the accounts or move stock. In <b>Point of Sale &rsaquo; Sales</b> an order that is still open, or was merged, shows the status Void.",
    links: [
      { name: "Tables", how: "The floor plan is drawn from the active tables of the store, grouped by zone.", to: "estate.tables" },
      { name: "The book", how: "Seating a booking opens this pad with the guest, covers and note filled in.", to: "kitchen.book" },
      { name: "Kitchen display", how: "Each course you send appears there as a ticket.", to: "kitchen.kds" },
      { name: "Menus", how: "When a menu is live right now, the pad offers only the items on live menus.", to: "menu.list" },
      { name: "Availability (86)", how: "Items marked unavailable at this store are left off the pad.", to: "sc.availability" },
      { name: "Modifiers", how: "The questions asked when an item with modifier groups is tapped.", to: "menu.modgroups" },
      { name: "Taxes", how: "The VAT on the bill is the highest active percentage sales tax, the same rule as the Register.", to: "taxes" },
      { name: "Service times", how: "Measures each table order from first send to serving.", to: "kitchen.times" }
    ],
    mistakes: [
      ["No tables set up for this store yet. Add them under Kitchen &rsaquo; Estate &rsaquo; Tables, giving each a name and a zone. This screen then becomes your floor plan.", "The store has no active tables, or the connection is down so the tables could not be read. Add tables, or reopen the screen once you are back online."],
      ["Nothing matches. If an item is missing it may be off the current menu or marked 86.", "A menu is live and the item is not on it, the item is marked 86 at this store, or the search or category hides it."],
      ["Nothing held", "Every line has already been sent. Add items before sending again."],
      ["Choose (group name)", "A required modifier group was not answered."],
      ["Add something to the table first", "Note / allergy needs an order. Add an item first."],
      ["Nothing on this table yet", "Bill was pressed on a table with no order."],
      ["Nothing to settle", "The split chosen comes to zero, for example By seat before a seat is picked."],
      ["That does not cover this share yet", "The tender lines are less than the share being settled."],
      ["No exchange rate for (currency) today - add one in Settings, Currencies", "Add the rate in Accounting &rsaquo; Configuration &rsaquo; Exchange Rates, or take that part in another currency."],
      ["Do one at a time", "Both a move and a merge were chosen in the Table box. Choose one, save, then do the other."],
      ["That table has no open bill", "The table chosen to merge has no open order any more."],
      ["A queued change was refused: (reason)", "A change saved while offline was rejected when it was sent. Read the reason and correct the order."]
    ],
    tips: [
      "Evenly divides what is still owed, so after one person pays, the next Evenly split is of the remaining balance.",
      "A table stays Needs clearing until the next party's first item is added, or until its Status is changed in Tables.",
      "With no menu live at this moment the pad offers every item, so if you use day-parting give the whole day menus.",
      "With no connection Orbit keeps what you save, but it cannot open a different table's pad or redraw the floor plan until the connection returns."
    ]
  },

  "kitchen.kds": {
    title: "Kitchen display",
    what: "The screen on the kitchen wall or at the coffee machine. Every line sent from the Floor or paid at the Counter appears here, grouped into one ticket per order, oldest first, each with a running clock that changes colour as it nears and passes its target. Tap an item when it is ready and <span class='man-key'>Bump ticket</span> when the whole order goes out. The board reads itself again every 15 seconds and the clocks tick every second.",
    when: [
      "During service, on a screen the kitchen, the bar or the barista can see.",
      "To see how many of each item are still to make across every ticket.",
      "To print a paper copy of a ticket for a station with no screen."
    ],
    how: [
      "On the kitchen screen open <b>Kitchen &rsaquo; Service &rsaquo; Kitchen display</b> and press <span class='man-key'>Full screen</span>. For this example a restaurant's pass shows every station, so leave <b>All stations</b> selected.",
      "When the waiter sends the starters for T4, a card appears within 15 seconds headed <b>T4</b> with a clock starting at 0:00, a red <b>ALLERGY: shellfish allergy</b> line, and <i>Soup</i> (seat 1) and <i>Salad</i> (seat 2).",
      "The <b>All day</b> strip along the top now counts 1 Soup and 1 Salad, added up across every open ticket.",
      "When the soup is plated, tap <i>Soup</i>. It shows as done. If you tapped the wrong one, tap it again to undo.",
      "Watch the clock. With no prep time on the items, a line on the kitchen station has a target of 8 minutes, so the card turns amber from about 6 minutes and red at 8.",
      "When both starters go out, press <span class='man-key'>Bump ticket</span>. You should see <i>Ticket bumped</i> and the card leaves the board. The serving time is stamped on the order.",
      "At the counter a customer pays for order 42. A card headed <b>#42</b> appears. Tap each item as it is ready: once every item is ready, 42 moves to <b>Ready to collect</b> on the Collection screen.",
      "Press <span class='man-key'>Bump ticket</span> on #42 when it has been handed over."
    ],
    fields: [
      ["Station", "All stations, Kitchen, Barista, Bar or Pastry. Shows only the lines whose station matches. A line's station is copied from the item when it is ordered; lines with no station appear only under All stations.", "optional"]
    ],
    buttons: [
      ["Full screen", "Hides everything but the board. Press again to leave full screen."],
      ["An item on a ticket", "Marks the line ready, or back to not ready if it was already marked."],
      ["Docket", "Prints the ticket as a kitchen docket: no prices, the table or order type in large letters, courses in order and the allergy in a box."],
      ["Bump ticket", "Marks every line on the ticket as done, stamps the order's ready and serving time, and removes the card."]
    ],
    after: "Marking an item ready stamps the line's ready time; a Counter order whose items are all ready or bumped moves to <b>Ready to collect</b> on the Collection screen. Bumping stamps the order's serving time, which is what <b>Service times</b> measures from the first send. These changes are saved through the same offline outbox as the Floor. Nothing is posted to the accounts and no stock moves.",
    links: [
      { name: "Floor", how: "Each course a waiter sends arrives as a ticket headed with the table name.", to: "kitchen.floor" },
      { name: "Counter", how: "Each paid counter order arrives at once, headed with its call number.", to: "kitchen.counter" },
      { name: "Collection screen", how: "An order moves to Ready to collect when all its items are ready here.", to: "kitchen.collect" },
      { name: "Service times", how: "Reports how long tickets took from send to bump.", to: "kitchen.times" },
      { name: "Items", how: "An item's station and prep time, where they are held, set its station filter and its target time.", to: "products" }
    ],
    mistakes: [
      ["Nothing waiting. Tickets appear here the moment the floor sends them.", "Nothing has been sent yet (items still held on the Floor pad), the Station filter hides the lines, or the order belongs to another store. Check the filter."],
      ["Offline: showing the tickets as they were at (time). The board updates by itself when the connection is back.", "The display lost its connection. It keeps the tickets it last loaded, with their clocks still running, and tries again every 15 seconds. Tickets sent after that time are not on it yet. Marking items ready and bumping still work, and are sent when the connection returns."],
      ["A ticket turns red at the same time as every other", "None of its items has a prep time, so the station default is used: 3 minutes for Barista and Bar, 5 for Pastry, 8 for Kitchen, and 6 for a line with no station. The card uses the longest target of its lines."],
      ["A waiter says an order was sent but it is not on the board", "The waiter's device may be offline, holding the send in its queue. It appears once that device reconnects and sends it."],
      ["A counter number never moves to Ready to collect", "One of its items has not been tapped ready. Tap the remaining item, or bump the ticket."]
    ],
    tips: [
      "The display shows the store last picked on the Counter, Floor or The book in this browser, plus any order with no store. Until one is picked it shows every store.",
      "A ticket shows course headings only when it holds more than one course."
    ]
  },

  "kitchen.collect": {
    title: "Collection screen",
    what: "The customer-facing board for counter service. <b>Being made</b> lists the call numbers that have been paid and are still with the kitchen; <b>Ready to collect</b> lists the ones whose items have all been marked ready. Put it on a monitor people can see while they wait. It reads itself again every 8 seconds.",
    when: [
      "You run counter service with call numbers, in a cafe, bakery or takeaway.",
      "Customers wait for their order away from the counter and need to see when it is ready."
    ],
    how: [
      "On a screen the customers can see, open <b>Kitchen &rsaquo; Service &rsaquo; Collection screen</b> and press <span class='man-key'>Full screen</span>.",
      "For this example a bakery sells two coffees and a pastry at the Counter and the customer is given number 17. Within 8 seconds you should see <b>17</b> under <b>Being made</b>, with the name under it if one was taken.",
      "On the Kitchen display, the barista taps both coffees and the pastry ready. Within 8 seconds 17 moves to <b>Ready to collect</b>.",
      "Call the number. When the customer takes the order, tap <b>17</b> under Ready to collect. It leaves the board."
    ],
    buttons: [
      ["Full screen", "Hides everything but the board. Press again to leave full screen."],
      ["A number under Ready to collect", "Marks that order collected and removes it from the board."],
      ["A number under Being made", "Does nothing: the order is not ready yet."]
    ],
    after: "Tapping a ready number stamps the order as collected, through the offline outbox. The board only shows orders that have a call number, have not been collected, and were created in the last 6 hours.",
    links: [
      { name: "Counter", how: "Taking payment there gives the order its call number and puts it on this board.", to: "kitchen.counter" },
      { name: "Kitchen display", how: "Marking every item ready, or bumping the ticket, moves the number to Ready to collect.", to: "kitchen.kds" }
    ],
    mistakes: [
      ["Nothing waiting", "No paid counter order is waiting. Orders rung on the Point of Sale Register or taken on the Floor have no call number and never appear here."],
      ["A paid number is missing", "The order was paid on a till that is still offline and has not sent it yet (it appears once that till reconnects), it is more than 6 hours old, or it belongs to another store than the one this browser last picked."],
      ["A number stays under Being made", "At least one of its items is not marked ready on the Kitchen display."],
      ["The wrong number was tapped", "There is no undo on this screen: the order is marked collected and leaves the board."]
    ],
    tips: [
      "The board follows the store last picked on the Counter, Floor or The book in this browser. Until one is picked it shows every store, so open the Counter on this screen first if you have more than one shop."
    ]
  },

  "kitchen.times": {
    title: "Service times",
    what: "A report of how long orders took from the moment the first course was sent to the kitchen to the moment they were served. It shows the median, the average, the 90th percentile and the number of tickets, the average by order type, and the fifteen slowest tickets. The 90th percentile is the wait the slowest one guest in ten had.",
    when: [
      "After a busy service, to see whether the kitchen kept up.",
      "Each week or month, to track whether service is getting faster or slower.",
      "To find the slow tickets behind a complaint."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Service &rsaquo; Service times</b>. For this example a restaurant reviews this month.",
      "Choose <b>This month</b> in the period list. You should see the chips, for example <i>Median 11 min</i>, <i>Average 12.4 min</i>, <i>90th percentile 19.5 min</i> and <i>210 tickets</i>.",
      "Read the order type table: Dine in and Takeaway each with their ticket count and average minutes.",
      "Under <b>Slowest tickets</b>, look at the number, type, time sent and minutes. Green is 10 minutes or less, amber over 10, red over 15.",
      "Choose <b>Custom range</b> and set From and To to a single Saturday to look at one service.",
      "Press <span class='man-key'>Export</span> for a spreadsheet, or <span class='man-key'>Print</span>."
    ],
    fields: [
      ["Period", "This year, This quarter, This month, Last year, All time or Custom range. Tickets are counted by the time they were first sent.", "optional"],
      ["From and To", "Only with Custom range: the first and last day to include.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads the report as a CSV file."],
      ["Print", "Prints the report."]
    ],
    after: "Nothing. The report only reads orders; it looks at up to 2000 tickets in the period.",
    links: [
      { name: "Floor", how: "Sending a course stamps the time a table order was sent.", to: "kitchen.floor" },
      { name: "Counter", how: "Taking payment stamps the time a counter order was sent.", to: "kitchen.counter" },
      { name: "Kitchen display", how: "Bump ticket stamps the serving time.", to: "kitchen.kds" }
    ],
    mistakes: [
      ["No completed tickets in this period yet.", "No order in the period has both a send time and a serving time. The kitchen needs to bump tickets, or the period is wrong."],
      ["A table's time looks far too long", "If the kitchen never bumped the ticket, the serving time is stamped when the bill is paid, so the time runs to payment."],
      ["A counter order is missing", "A counter order only gets a serving time when its ticket is bumped on the Kitchen display."]
    ],
    tips: [
      "Bumping tickets as they leave the pass is what makes this report true."
    ]
  },

  "menu.list": {
    title: "Menus",
    what: "A menu is a set of items with the days and hours it is served, an optional channel and optional first and last dates. The list shows each menu, its channel, when it runs and whether it is <b>Live now</b>. On the Floor, when at least one menu is live, the order pad offers only the items on the live menus, so a breakfast item disappears when breakfast ends.",
    when: [
      "You serve different items at different times of day, such as breakfast and lunch.",
      "A seasonal or limited menu should start and stop on set dates.",
      "You want to check which menus are being served right now."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Menu &rsaquo; Menus</b> and press <span class='man-key'>New</span>. For this example a cafe serves breakfast from 07:00 to 11:30, Monday to Saturday.",
      "Type <i>Breakfast</i> in the name at the top.",
      "Leave <b>Channel</b> on All channels.",
      "Under <b>Days</b>, tick Mon, Tue, Wed, Thu, Fri and Sat.",
      "Set <b>From</b> to 07:00 and <b>To</b> to 11:30. Leave <b>Live from</b> and <b>Live to</b> empty so it runs until you change it.",
      "Under <b>Items on this menu</b>, type <i>egg</i> in <b>Filter items</b> and tick the egg dishes, then clear the filter and tick the pastries and porridge.",
      "Press <span class='man-key'>Save</span>. You should see <i>Saved</i> and the list row: Breakfast, All channels, <i>Mon Tue Wed Thu Fri Sat 07:00 to 11:30</i>, and Live now <b>On</b> during those hours.",
      "Make a second menu, <i>All day</i>, with the lunch items, every day from 11:30 to 22:00. Without it, after 11:30 no menu is live and the Floor pad offers every item again, breakfast included.",
      "At 08:00, open a table on the Floor. You should see only the breakfast items on the pad."
    ],
    fields: [
      ["Name (top of the form)", "What the menu is called, for example Breakfast.", "required"],
      ["Channel", "All channels, or one active channel. Shown in the list; the Floor pad uses every live menu whatever its channel.", "optional"],
      ["Days", "The days the menu is served. Ticking none saves it as every day.", "optional"],
      ["From and To", "The hours it is served, checked against the device's clock. Leave both empty for all day.", "optional"],
      ["Live from and Live to", "The first and last date the menu can be live. Leave empty for no limit.", "optional"],
      ["Filter items", "Type to narrow the list of items below. It does not change the menu.", "optional"],
      ["Items on this menu", "Tick every item the menu offers. Only active items that are for sale are listed.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank menu."],
      ["Save", "Saves the menu and replaces its item list with the items ticked now. Saving always sets the menu active."],
      ["Discard", "Goes back to the list without saving."],
      ["Delete", "Only on a saved menu, for users who manage the app. Asks to confirm, then removes the menu."],
      ["Serving now / Not serving now", "The stage shown on a saved menu: whether it is live at this moment."],
      ["Export", "On the list: downloads the menus as a CSV file."]
    ],
    after: "The menu and its items are saved. The <b>Floor</b> order pad reads them every time a table is opened: if any menu is live at that moment and has items, only those items are offered. The Counter and the Point of Sale Register do not use menus. Nothing is posted to the accounts.",
    links: [
      { name: "Floor", how: "The order pad is filtered to the items on the menus live right now.", to: "kitchen.floor" },
      { name: "Items", how: "Only active items for sale can be put on a menu.", to: "products" },
      { name: "Channels", how: "The Channel list shows your active channels.", to: "menu.channels" },
      { name: "Availability (86)", how: "An item on a live menu is still hidden from the pad when it is marked 86 at the store.", to: "sc.availability" }
    ],
    mistakes: [
      ["Name the menu", "The name at the top is empty. Type one."],
      ["Save failed", "The changes to an existing menu could not be saved, often because the connection dropped. Try again."],
      ["Items failed: (reason)", "The menu was saved but its items were not. Open it again, tick the items and save."],
      ["No sellable items yet. Add products first.", "There are no active items for sale. Add them in Items."],
      ["Breakfast items still show on the Floor after 11:30", "No other menu is live at that time, so the pad offers every item. Give the rest of the day its own menu."],
      ["An item is missing from the Floor pad", "A menu is live and the item is not ticked on it. Add it to that menu."]
    ],
    tips: [
      "Live now uses the same rule as the Floor pad, so the list tells you exactly what a waiter is being offered at this moment."
    ]
  },

  "menu.modgroups": {
    title: "Modifiers",
    what: "A modifier group is a question the customer answers about an item: milk, size, extra shot. Each choice can add to or take off the price. When an item with groups attached is tapped on the Floor pad or the Counter, a box asks the questions, and the chosen names are kept on the line so the kitchen sees them.",
    when: [
      "An item comes in variations the customer chooses, such as milk or size.",
      "A choice costs more, such as oat milk or an extra shot.",
      "The kitchen must be told a choice, such as how a steak is cooked."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Menu &rsaquo; Modifiers</b> and press <span class='man-key'>New</span>. For this example a cafe asks every coffee customer which milk they want.",
      "Type <i>Milk</i> in the name at the top. Leave <b>Code</b> empty and it is made from the name.",
      "Set <b>Required</b> to <i>Must choose</i>, <b>Pick at least</b> to 1 and <b>Pick at most</b> to 1.",
      "On the first choice row type <i>Whole milk</i>, leave <b>Price +/-</b> at 0 and tick <b>Default</b>.",
      "Press <span class='man-key'>+ Add a choice</span>: <i>Oat milk</i>, Price +/- 0.50. Add another: <i>Skimmed milk</i>, 0.",
      "Press <span class='man-key'>Save</span>. You should see <i>Saved</i> and the list row: Milk, choices Whole milk, Oat milk, Skimmed milk, Rule <i>Required, pick 1</i>, Options 3.",
      "On the Counter, tap a coffee that has the Milk group attached. A box titled with the item asks the question with Whole milk already chosen. Pick Oat milk and press Save: a coffee at 3.50 goes on as 4.00, with <i>Oat milk</i> under its name."
    ],
    fields: [
      ["Name (top of the form)", "The question, for example Milk or Size. Shown as the heading in the box on the till.", "required"],
      ["Code", "A short unique code. Left empty, it is made from the name in lower case. Two groups cannot share a code.", "auto"],
      ["Required", "Optional or Must choose. A group that must be chosen blocks the item until at least one choice is picked.", "optional"],
      ["Pick at least", "The fewest choices for a required group. Empty counts as 0.", "optional"],
      ["Pick at most", "The most choices allowed. 1 shows single-choice buttons on the till; more shows tick boxes. Empty or 0 counts as 1. It cannot be less than Pick at least.", "optional"],
      ["Order", "Sorts the groups in the list and in the box on the till; lower comes first.", "optional"],
      ["Name (choice)", "What the choice is called on the till and on the kitchen ticket. A row left without a name is not saved.", "optional"],
      ["Price +/- (choice)", "Added to the item's price when chosen. Use a minus figure for a cheaper choice.", "optional"],
      ["Consumes and Qty (choice)", "The item this choice uses from stock, and how much. Saved with the choice; plate cost, Cost variance and the tills do not read it at present.", "optional"],
      ["Instead of (choice)", "The item this choice replaces. Saved with the choice; not used by plate cost or Cost variance at present.", "optional"],
      ["Default (choice)", "Ticked in advance when the box opens on the till.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank group with one empty choice row."],
      ["+ Add a choice", "Adds another choice row."],
      ["&times; on a choice row", "Removes that row."],
      ["Save", "Saves the group. On a saved group, its choices are replaced by the rows on screen."],
      ["Discard", "Goes back to the list without saving."],
      ["Delete", "Only on a saved group, for users who manage the app. Asks to confirm, then removes the group and its choices."]
    ],
    after: "The group and its choices are saved for the company. The Floor pad and the Counter read them whenever the screen opens; a chosen modifier adds its price to the line and its name to the line's note, which prints on the kitchen ticket, the docket and the receipt. This screen does not attach a group to an item, and no other screen does at present, so the till only asks for items already linked to the group. Nothing is posted to the accounts.",
    links: [
      { name: "Counter", how: "Asks the group's question when a linked item is tapped.", to: "kitchen.counter" },
      { name: "Floor", how: "Asks the group's question on the order pad.", to: "kitchen.floor" },
      { name: "Kitchen display", how: "Shows the chosen modifiers under each item.", to: "kitchen.kds" },
      { name: "Items", how: "The Consumes and Instead of lists show your active items.", to: "products" }
    ],
    mistakes: [
      ["Name the group", "The name at the top is empty."],
      ["Pick at most cannot be less than pick at least", "Raise Pick at most or lower Pick at least."],
      ["A record with Code (code) already exists. Use a different one.", "Another group already uses that code, often because the name is the same. Type a different Code."],
      ["Save failed", "The changes to an existing group could not be saved. Try again."],
      ["Choices failed: (reason)", "The group was saved but its choices were not. Open it, re-enter the choices and save."],
      ["Tapping the item on the till asks nothing", "The item is not linked to this group. Only linked items show the question."]
    ],
    tips: [
      "Editing a group deletes its old choice rows and saves the ones on screen as new rows, so check every row before saving."
    ]
  },

  "menu.channels": {
    title: "Channels",
    what: "A channel is a way you sell: dine-in, takeaway, delivery, an aggregator app, catering, wholesale or retail. Each active channel becomes a column on the Price list, where you can set a dated price for every item on that channel, and its commission shows in the price simulator.",
    when: [
      "You start selling through a new route, such as a delivery app.",
      "A platform changes the commission it takes.",
      "You stop using a route and want it off the Price list."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Menu &rsaquo; Channels</b> and press <span class='man-key'>New</span>. For this example a restaurant joins a delivery app that takes 20%.",
      "Type <i>Delivery app</i> in <b>Name</b>. Leave <b>Code</b> empty and it is made from the name.",
      "Choose <i>Aggregator</i> in <b>Type</b>.",
      "Type 15 in <b>Menu markup %</b> (what you plan to add to your prices there) and 20 in <b>Commission %</b>.",
      "Set <b>Order</b> to 40 and leave <b>Active</b> on Yes.",
      "Press <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row Delivery app, Aggregator, 15%, 20%, Yes.",
      "Open <b>Price list</b>. You should see a <b>Delivery app</b> column, and the Change price box on that column tells you what you keep after 20% commission."
    ],
    fields: [
      ["Name", "What the channel is called on the Price list and in the Menus channel list.", "required"],
      ["Code", "A short unique code in lower case. Left empty, it is made from the name. Two channels cannot share a code.", "auto"],
      ["Type", "Dine-in, Takeaway, Drive-thru, Delivery, Aggregator, Catering, Wholesale or Retail.", "optional"],
      ["Menu markup %", "What you intend to add to base prices on this channel. It is recorded and shown in the list; Orbit does not apply it to prices for you.", "optional"],
      ["Commission %", "What the channel takes. The Price list simulator uses it to show what you keep.", "optional"],
      ["Order", "Sorts the channels, and the columns on the Price list; lower comes first. It starts at 50.", "optional"],
      ["Active", "Yes or No. Only active channels appear on the Price list and in Menus.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank channel."],
      ["A row", "Opens the channel to change it."],
      ["Save", "Saves the channel."],
      ["Cancel", "Closes the box without saving."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "The channel is saved for the company. Active channels are the columns of the <b>Price list</b> and the choices in a menu's <b>Channel</b>. The Floor, Counter and Register charge the item's Sales Price, not a channel price. Nothing is posted to the accounts.",
    links: [
      { name: "Price list", how: "Every active channel is a column with its own dated prices and commission.", to: "menu.prices" },
      { name: "Menus", how: "A menu can be marked for one channel.", to: "menu.list" }
    ],
    mistakes: [
      ["Name the channel", "Name is empty."],
      ["A record with Code (code) already exists. Use a different one.", "Another channel already uses that code. Type a different Code."],
      ["A channel you no longer use still shows", "There is no Delete on this screen. Set Active to No and it leaves the Price list and Menus."]
    ]
  },

  "menu.prices": {
    title: "Price list",
    what: "Every active item for sale against every active channel, with its plate cost and margin. Prices are dated rather than overwritten: changing one writes a new price that starts on a date you choose and closes the previous one the day before, so past prices stay on record. Click any price to change it, with a simulator that shows the margin before you save.",
    when: [
      "A supplier puts a price up and you need to see what it does to your margin.",
      "You want a different price on a delivery channel.",
      "A price change should start on a set date, such as the first of next month."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Menu &rsaquo; Price list</b>. For this example a cafe's latte has a plate cost of 1.52 and sells for 4.00 on the Delivery app channel.",
      "Find the <i>Latte</i> row. Read <b>Plate cost</b> 1.52, the price in each channel column and the <b>Margin</b> at the end.",
      "Click <b>4.00</b> in the Delivery app column. The <b>Change price</b> box opens, reading <i>Latte on Delivery app, plate cost 1.52</i>, with the price history below.",
      "Type 4.50 in <b>New price</b>. You should see: <i>you make 2.98 a unit, a margin of 66.2%. After 20% channel commission you keep 2.08.</i>",
      "Set <b>Starts on</b> to the first of next month and type <i>supplier increase</i> in <b>Note</b>.",
      "Press <span class='man-key'>Save</span>. You should see <i>Price set from</i> and the date, and the box closes. The price is written from that date and the current price is closed the day before.",
      "Reopen <b>Price list</b>. The column still shows 4.00 until the start date; from then on it shows 4.50, and the history lists both.",
      "Press <span class='man-key'>Export</span> to take the whole grid into a spreadsheet."
    ],
    fields: [
      ["New price", "The price on this channel from the start date, in the company currency.", "required"],
      ["Starts on", "The first day the new price applies. It starts as today; left empty it is today.", "auto"],
      ["Note", "Why the price changed. Shown in the price history.", "optional"]
    ],
    buttons: [
      ["A price", "Opens Change price for that item on that channel."],
      ["Save", "Closes the open price the day before the new start date and saves the new price."],
      ["Cancel", "Closes the box without saving."],
      ["Export", "Downloads the grid as a CSV file."]
    ],
    after: "A new dated price is saved for the item and channel. The grid shows, for each channel, the newest price already in force today for that channel, otherwise the item's Sales Price. <b>Plate cost</b> is worked out from the item's recipe (including recipes inside it), or is the item's Cost when it has no recipe. <b>Margin</b> compares that cost with the item's own base price, not a channel price, and is red when negative. The Floor, Counter and Register charge the item's Sales Price and do not read these channel prices at present.",
    links: [
      { name: "Channels", how: "Each active channel is a column, and its commission feeds the simulator.", to: "menu.channels" },
      { name: "Recipes", how: "Plate cost is built from the item's recipe.", to: "mfg.boms" },
      { name: "Items", how: "Items for sale are the rows; their Sales Price is the fallback price and their Cost is the plate cost when there is no recipe.", to: "products" },
      { name: "Menu engineering", how: "Uses the same plate cost to rank items by profit.", to: "menu.engineering" }
    ],
    mistakes: [
      ["Enter a price", "New price is empty or not a number."],
      ["Could not close the current price: (reason) Nothing was changed; try again.", "The current price could not be given its end date, so the new price was not written either and the box stays open. Check the connection and press Save again."],
      ["The new price does not show in the grid", "The grid only shows prices already in force today. A price starting on a later date appears from that date."],
      ["No sellable items yet.", "There are no active items for sale. Add them in Items."],
      ["A plate cost of 0.00", "The item has no recipe and no Cost. Add a recipe, or a Cost on the item."]
    ],
    tips: [
      "The grid lists up to 400 items and takes a moment to open, because it works out the plate cost of each one."
    ]
  },

  "menu.engineering": {
    title: "Menu engineering",
    what: "Ranks every item sold in the period by how often it sells and how much profit each one makes, and places it in one of four boxes: <b>Star</b> (popular and profitable), <b>Plowhorse</b> (popular, thin profit), <b>Puzzle</b> (profitable, rarely ordered) and <b>Dog</b> (neither). Sales come from the till order lines, and cost from each item's plate cost.",
    when: [
      "Before reprinting or redesigning the menu.",
      "When deciding which items to promote, reprice or drop.",
      "At the end of a month or season, to see what earned its place."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Menu &rsaquo; Menu engineering</b>. For this example a cafe reviews last quarter.",
      "Choose <b>This quarter</b> in the period list. You should see a row for every item sold, sorted by profit.",
      "Read a row: <i>Latte</i>, Sold 120, Revenue 480.00, Cost 182.40, Profit 297.60, Per unit 2.48, Verdict <b>Star</b> with the advice beside it.",
      "Find the <b>Plowhorse</b> rows: they sell well but make less per unit than average. Open Price list to test a small price rise, or reduce the recipe cost.",
      "Find the <b>Puzzle</b> rows: profitable but rarely ordered. Move them up the menu or brief the team to suggest them.",
      "Find the <b>Dog</b> rows and decide whether to rework or drop them.",
      "Press <span class='man-key'>Export</span> or <span class='man-key'>Print</span> to take the result to a menu meeting."
    ],
    fields: [
      ["Period", "This year, This quarter, This month, Last year, All time or Custom range. Orders are counted by the day they were created.", "optional"],
      ["From and To", "Only with Custom range: the first and last day to include.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads the report as a CSV file."],
      ["Print", "Prints the report."]
    ],
    after: "Nothing. The report reads the order lines of every till order in the period that is not cancelled: Register sales, Counter and Floor orders (including tables still open) and refunds, which count as negative quantities. <b>Revenue</b> is the line totals before VAT, after any line discount. <b>Cost</b> is today's plate cost times the quantity sold. An item is popular when it sold at least the average quantity of the items listed, and profitable when its profit per unit is at least the average.",
    links: [
      { name: "Price list", how: "Test a new price and its margin before changing it.", to: "menu.prices" },
      { name: "Recipes", how: "Plate cost, and so profit, comes from the item's recipe.", to: "mfg.boms" },
      { name: "Register", how: "Register sales are counted.", to: "pos.terminal" },
      { name: "Floor", how: "Table orders are counted.", to: "kitchen.floor" },
      { name: "Counter", how: "Counter orders are counted.", to: "kitchen.counter" }
    ],
    mistakes: [
      ["No till sales in this period yet.", "No order line in the period has an item on it. Check the period."],
      ["An item shows as ?", "The item on those sales can no longer be found. It may have been deleted."],
      ["Cost and profit look wrong for an item", "Its plate cost is 0 or out of date: the recipe is missing or the ingredient Cost figures are old. Cost uses today's plate cost, not the cost when the item was sold."]
    ]
  },

  "sc.variance": {
    title: "Cost variance",
    what: "What the till sales in a period <b>should</b> have used, ingredient by ingredient, worked backwards through every recipe and priced at each ingredient's Cost, with the waste recorded in the Waste log for the same items beside it. It is the starting point for finding food cost that cannot be explained.",
    when: [
      "At the end of a week or month, to see what your sales should have cost in ingredients.",
      "When food cost is higher than expected and you want to know which ingredients to look at.",
      "To see how much of an ingredient's cost was logged as waste."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Stock control &rsaquo; Cost variance</b>. For this example a cafe reviews this month, in which it sold 500 lattes; the latte recipe uses 0.25 litres of milk and 0.018 kg of beans.",
      "Choose <b>This month</b> in the period list. You should see the chips: <i>Theoretical cost of sales</i>, <i>Recorded waste</i> and the number of ingredients.",
      "Find the <i>Milk</i> row: <b>Should have used</b> 125, <b>Unit cost</b> 1.20, <b>Theoretical cost</b> 150.00.",
      "The Waste log has 6 litres of milk logged this month at 7.20, so the row shows <b>Recorded waste</b> 7.20 and <b>Waste as %</b> 4.8% in amber. Above 5% the badge turns red.",
      "Find the <i>Coffee beans</i> row: should have used 9 kg at 20.00, theoretical cost 180.00.",
      "Compare these figures with what you actually bought and what is left on the shelf. A large gap after waste points at portions, giveaways or losses.",
      "Press <span class='man-key'>Export</span> or <span class='man-key'>Print</span> to keep the result."
    ],
    fields: [
      ["Period", "This year, This quarter, This month, Last year, All time or Custom range. All time, or a custom range with no From date, covers the last 30 days.", "optional"],
      ["From and To", "Only with Custom range: the first and last day to include.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads the report as a CSV file."],
      ["Print", "Prints the report."]
    ],
    after: "Nothing. The report takes the order lines of every till order in the dates that is not cancelled, across all stores, and explodes each item sold through its recipe: each recipe line's quantity, allowing for the recipe's output quantity and any line waste and batch yield stored on it, following recipes inside recipes. An item with no recipe counts as its own ingredient. Theoretical cost uses each ingredient's current Cost. <b>Recorded waste</b> on a row is the total cost of Waste log entries for that ingredient in the same dates; the chip at the top adds up every waste entry in the dates.",
    links: [
      { name: "Recipes", how: "Every item sold is exploded through its recipe to find its ingredients.", to: "mfg.boms" },
      { name: "Waste log", how: "Supplies the Recorded waste figures.", to: "sc.waste" },
      { name: "Items", how: "Each ingredient's Cost prices the theoretical usage.", to: "products" },
      { name: "Register", how: "Register sales are counted as sales.", to: "pos.terminal" },
      { name: "Counter", how: "Counter orders are counted as sales.", to: "kitchen.counter" },
      { name: "Floor", how: "Table orders are counted as sales.", to: "kitchen.floor" }
    ],
    mistakes: [
      ["Nothing to compare yet. This report needs till sales in the period and a recipe on the items sold.", "No till order line in the dates has an item on it. Check the period."],
      ["Could not work out theoretical usage: (reason)", "The calculation failed on the server. Read the reason; reload and try again."],
      ["A finished dish appears as an ingredient", "It has no recipe, so it counts as its own ingredient. Add its recipe in Recipes."],
      ["Unit cost is 0.00", "The ingredient has no Cost. Set one on the item."],
      ["Recorded waste is blank for an ingredient you know was wasted", "The waste entries have no Total cost or Unit cost, fall outside the dates, or were logged against a different item."]
    ],
    tips: [
      "Sales tables that are still open count too, so run the report after the day's service has closed."
    ]
  },

  "sc.waste": {
    title: "Waste log",
    what: "A record of everything thrown away, with a reason, a quantity and a cost: spoiled milk, dropped plates, unsold pastries, staff meals. Waste that is logged here shows beside the theoretical usage on Cost variance, so it can be told apart from losses nobody can explain.",
    when: [
      "Something goes in the bin, whether spoiled, broken, over-produced or sent back.",
      "Staff meals or training drinks are made from stock.",
      "At the end of the day, for items left unsold that cannot be kept."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Stock control &rsaquo; Waste log</b> and press <span class='man-key'>New</span>. For this example a bakery throws away 12 unsold croissants at closing.",
      "<b>Date</b> is today. Pick the <b>Store</b>.",
      "Pick <i>Croissant</i> in <b>Item</b> and <i>Over-production</i> in <b>Reason</b>. Both lists start on their first entry, so check them.",
      "Type 12 in <b>Quantity</b> and <i>pcs</i> in <b>Unit</b>.",
      "Type 0.85 in <b>Unit cost</b> and leave <b>Total cost</b> empty.",
      "Type <i>Close</i> in <b>Shift</b> and press <span class='man-key'>Save</span>. You should see <i>Saved</i> and a row dated today: Croissant, Over-production, 12, Cost 10.20, and the store.",
      "Press <span class='man-key'>Group By</span> and choose <b>Reason</b> to see the month's waste by reason."
    ],
    fields: [
      ["Date", "The day the waste happened. Cost variance counts it in the period containing this date.", "required"],
      ["Store", "Where it was thrown away.", "optional"],
      ["Item", "What was wasted, from your active items. The list starts on its first item.", "required"],
      ["Reason", "Why, from the active Waste reasons. A controllable reason shows red in the list, the others grey. The list starts on its first reason.", "required"],
      ["Quantity", "How much was thrown away.", "required"],
      ["Unit", "The unit the quantity is in, typed as text.", "optional"],
      ["Unit cost", "The cost of one unit. It is not filled in for you.", "optional"],
      ["Total cost", "Leave blank to use quantity times unit cost. This is the figure Cost variance adds up.", "auto"],
      ["Shift", "Which shift, typed as text.", "optional"],
      ["Note", "Anything worth knowing, such as the fridge that failed.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank waste entry. Only for users who manage the app."],
      ["A row", "Opens the entry to change it."],
      ["Save", "Saves the entry."],
      ["Delete", "Only on a saved entry, for users who manage the app. Asks <i>Delete this record?</i> and removes it."],
      ["Cancel", "Closes the box without saving."],
      ["Group By", "Groups the list by Reason, Item or Month."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "The entry is saved in the company's waste records. It feeds <b>Recorded waste</b> on <b>Cost variance</b> for the same item and dates. Saving does not move stock and does not post to the accounts.",
    links: [
      { name: "Waste reasons", how: "The Reason list is your active waste reasons.", to: "sc.wastereasons" },
      { name: "Cost variance", how: "Shows logged waste beside what sales should have used.", to: "sc.variance" },
      { name: "Items", how: "The Item list is your active items.", to: "products" },
      { name: "Stores", how: "The Store list is your active stores.", to: "estate.stores" }
    ],
    mistakes: [
      ["Item is required", "There are no active items to choose from. Add items first."],
      ["Reason is required", "There are no active waste reasons. Add them in Waste reasons."],
      ["Quantity is required", "Quantity is empty."],
      ["Date is required", "The date was cleared. Pick one."],
      ["Cost is blank in the list", "Neither Total cost nor Unit cost was entered, so the waste has no value and adds nothing on Cost variance. Open the entry and add a cost."]
    ],
    tips: [
      "Log waste when it happens, not at the end of the week, or the quantities become guesses."
    ]
  },

  "sc.counts": {
    title: "Stock counts",
    what: "A register of stock counts: when a count was done, where, what kind (full, cycle or spot), whether it was blind, who counted and its status. It is a record of the count itself; this screen has no lines for counted quantities and does not change stock.",
    when: [
      "You plan or carry out a stock count and want it on record.",
      "You need to see which counts are still open and which are finished.",
      "An auditor or manager asks when a store was last counted."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Stock control &rsaquo; Stock counts</b> and press <span class='man-key'>New</span>. For this example a restaurant does its month-end count on the 31st.",
      "Type <i>COUNT-2026-08</i> in <b>Reference</b>. <b>Date</b> is today; change it if needed.",
      "Pick the <b>Store</b> and choose <i>Full</i> in <b>Type</b>.",
      "Leave <b>Blind count</b> on Yes.",
      "Choose <i>Counting</i> in <b>Status</b>. Left on (none), a new count starts as Draft.",
      "Type who is counting in <b>Counted by</b>, then press <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row: date, COUNT-2026-08, Full, the store, Blind Yes, Counting.",
      "When the count is finished and checked, open the row, change <b>Status</b> to <i>Approved</i> and save. The <b>Open</b> filter no longer shows it once it is Posted or Cancelled."
    ],
    fields: [
      ["Reference", "Your name or number for the count.", "optional"],
      ["Date", "The day of the count.", "required"],
      ["Store", "Where the count was done.", "optional"],
      ["Type", "Full, Cycle or Spot. The list starts on Full.", "required"],
      ["Blind count", "Yes when the counter is not shown what the system expects. Starts on Yes.", "optional"],
      ["Status", "Draft, Counting, Review, Approved, Posted or Cancelled. A label only: Posted does not move stock. A new count left on (none) starts as Draft.", "optional"],
      ["Counted by", "Who counted, typed as text.", "optional"],
      ["Note", "Anything worth recording about the count.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank count. Only for users who manage the app."],
      ["A row", "Opens the count to change it."],
      ["Save", "Saves the count."],
      ["Delete", "Only on a saved count, for users who manage the app. Asks <i>Delete this record?</i> and removes it."],
      ["Cancel", "Closes the box without saving."],
      ["Filters", "Open shows counts not yet Posted or Cancelled; Posted shows the posted ones."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Only the count record is saved. No stock quantity, stock value or journal entry changes, whatever the status.",
    links: [
      { name: "Stores", how: "The Store list is your active stores.", to: "estate.stores" },
      { name: "Cost variance", how: "Compare your counted figures by hand with what sales should have used.", to: "sc.variance" }
    ],
    mistakes: [
      ["Fill in Status. It is required.", "Only when editing a saved count: Status was changed to (none). Choose a status and save again."],
      ["Date is required", "The date was cleared. Pick one."]
    ]
  },

  "sc.transfers": {
    title: "Transfers",
    what: "A register of stock moving between two of your own stores, such as a central kitchen sending prepared food to an outlet. Each transfer records where from, where to, when it was requested and its status. This screen has no lines for items or quantities and does not move stock.",
    when: [
      "One store asks another for stock.",
      "A delivery between your stores is sent or arrives and its status should be updated.",
      "You want to see which transfers are still on the way."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Stock control &rsaquo; Transfers</b> and press <span class='man-key'>New</span>. For this example a bakery's central kitchen sends bread to its high street shop.",
      "Type <i>TR-0012</i> in <b>Number</b>.",
      "Choose <i>Central kitchen</i> in <b>From store</b> and <i>High street</i> in <b>To store</b>. Both lists start on the first store, so change at least one.",
      "Leave <b>Status</b> on (none): a new transfer starts as Requested.",
      "Type <i>40 loaves, 60 rolls</i> in <b>Note</b> and press <span class='man-key'>Save</span>. You should see <i>Saved</i> and a row with the number, both stores, the time requested and Requested.",
      "When the van leaves, open the row, set <b>Status</b> to <i>Dispatched</i> and save. The <b>In flight</b> filter shows it.",
      "When the shop signs for it, set <b>Status</b> to <i>Received</i>. It moves to the <b>Received</b> filter."
    ],
    fields: [
      ["Number", "Your transfer number.", "optional"],
      ["From store", "The store sending the stock.", "required"],
      ["To store", "The store receiving it. It cannot be the same as From store.", "required"],
      ["Status", "Requested, Approved, Dispatched, Received or Cancelled. A label only: it does not stamp dispatch or receipt times or move stock. A new transfer left on (none) starts as Requested.", "optional"],
      ["Note", "What is being sent, and anything that went wrong.", "optional"],
      ["Requested", "In the list only: the time the transfer was first saved.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank transfer. Only for users who manage the app."],
      ["A row", "Opens the transfer to change it."],
      ["Save", "Saves the transfer."],
      ["Delete", "Only on a saved transfer, for users who manage the app. Asks <i>Delete this record?</i> and removes it."],
      ["Cancel", "Closes the box without saving."],
      ["Filters", "In flight shows Requested, Approved and Dispatched; Received shows the received ones."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Only the transfer record is saved. Stock at either store, stock value and the accounts do not change.",
    links: [
      { name: "Stores", how: "From store and To store list your active stores.", to: "estate.stores" }
    ],
    mistakes: [
      ["A store cannot transfer to itself", "From store and To store are the same. Change one of them."],
      ["Fill in Status. It is required.", "Only when editing a saved transfer: Status was changed to (none). Choose a status and save again."]
    ]
  },

  "sc.availability": {
    title: "Availability (86)",
    what: "Takes an item off sale at one store, the kitchen's &quot;86&quot;. While an item is marked not available at a store, the Floor order pad and the Counter at that store do not offer it. The list shows every flag, with its reason and the date you expect it back.",
    when: [
      "An item sells out during service.",
      "A machine breaks and the items that need it cannot be made.",
      "An item is back and should be offered again."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Stock control &rsaquo; Availability (86)</b> and press <span class='man-key'>New</span>. For this example a cafe's high street shop has sold out of croissants at 10:30.",
      "Choose <i>High street</i> in <b>Store</b> and <i>Croissant</i> in <b>Item</b>. Both lists start on their first entry, so check them.",
      "Set <b>Available</b> to <i>No</i>.",
      "Type <i>sold out</i> in <b>Reason</b> and pick tomorrow in <b>Back on</b>.",
      "Press <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row: Croissant, High street, <b>86</b>, sold out, tomorrow's date.",
      "Open the Counter at that store again. You should no longer see the croissant tile. On the Floor it is gone from the next pad opened.",
      "Next morning, open the row, set <b>Available</b> to <i>Yes</i> and save. The row shows <b>On</b> and the item is offered again."
    ],
    fields: [
      ["Store", "The store where the item is off. Other stores are not affected.", "required"],
      ["Item", "The item to take off or put back.", "required"],
      ["Available", "No takes the item off sale at the store; Yes puts it back. Starts on Yes.", "optional"],
      ["Reason", "Why, for example out of stock or machine down.", "optional"],
      ["Back on", "When you expect it back. For information only: the item is not put back automatically on that date.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank flag. Only for users who manage the app."],
      ["A row", "Opens the flag to change it."],
      ["Save", "Saves the flag."],
      ["Delete", "Only on a saved flag, for users who manage the app. Asks <i>Delete this record?</i> and removes it, which puts the item back on sale."],
      ["Cancel", "Closes the box without saving."],
      ["Filters", "Currently 86 shows only the items that are off."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "The flag is saved for that store and item. The <b>Floor</b> pad and the <b>Counter</b> leave the item out whenever they load the menu for that store. The Point of Sale Register does not read these flags and still offers the item.",
    links: [
      { name: "Floor", how: "Items marked not available at the store are left off the order pad.", to: "kitchen.floor" },
      { name: "Counter", how: "Items marked not available at the store are left off the counter.", to: "kitchen.counter" },
      { name: "Stores", how: "The Store list is your active stores.", to: "estate.stores" },
      { name: "Items", how: "The Item list is your active items.", to: "products" }
    ],
    mistakes: [
      ["That already exists.", "The item already has a flag at that store. Open the existing row and change Available instead."],
      ["The item still shows on the Counter", "The Counter loaded its menu before the flag was saved. Open the Counter again."],
      ["The item still shows on the Register", "The Point of Sale Register does not use availability flags."]
    ],
    tips: [
      "Set the item back to Yes, or delete the flag, as soon as it is available again: Back on does not do it for you."
    ]
  },

  "sc.wastereasons": {
    title: "Waste reasons",
    what: "The list of reasons offered when waste is logged. Each reason is either a <b>controllable loss</b>, such as spoilage or breakage, or a cost of doing business, such as staff meals or training. Controllable reasons show in red in the Waste log, so the losses worth chasing stand out.",
    when: [
      "Setting up the Waste log for the first time.",
      "Your team keeps writing the same reason in the note and it deserves its own entry.",
      "A reason is no longer used."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Stock control &rsaquo; Waste reasons</b>. For this example a restaurant wants a reason for dishes sent back by guests, and one for staff meals.",
      "Press <span class='man-key'>New</span>. Type <i>Sent back by guest</i> in <b>Name</b> and <i>sent_back</i> in <b>Code</b>.",
      "Leave <b>Controllable loss</b> on Yes, type 50 in <b>Order</b>, leave <b>Active</b> on Yes and press <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row with Controllable Yes.",
      "Press <span class='man-key'>New</span> again: <i>Staff meal</i>, code <i>staff_meal_2</i> if staff_meal is already taken, <b>Controllable loss</b> No, Order 60, Save.",
      "Open <b>Waste log</b> and press New. Both reasons appear in the Reason list, in order."
    ],
    fields: [
      ["Name", "The reason as staff will see it in the Waste log.", "required"],
      ["Code", "A short unique code. Two reasons cannot share a code.", "required"],
      ["Controllable loss", "Yes for losses you can act on, such as spoilage and breakage. No for staff meals and training. Decides the badge colour in the Waste log.", "optional"],
      ["Order", "The position in the Reason list; lower comes first. A new reason left empty starts at 10.", "optional"],
      ["Active", "Only active reasons are offered in the Waste log.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank reason. Only for users who manage the app."],
      ["A row", "Opens the reason to change it."],
      ["Save", "Saves the reason."],
      ["Delete", "Only on a saved reason, for users who manage the app. Asks <i>Delete this record?</i> and removes it. Waste entries that used it keep their other details but lose the reason."],
      ["Cancel", "Closes the box without saving."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "The reason is saved for the company and offered in the <b>Waste log</b> while it is active. Nothing is posted to the accounts.",
    links: [
      { name: "Waste log", how: "Each entry takes one of these reasons.", to: "sc.waste" }
    ],
    mistakes: [
      ["Name is required", "Name is empty."],
      ["Code is required", "Code is empty."],
      ["Fill in Sort. It is required.", "Only when editing a saved reason: Order was emptied. Type a number, for example 10, and save again."],
      ["A record with Code (code) already exists. Use a different one.", "Another reason already uses that code. Type a different one."]
    ],
    tips: [
      "To stop using a reason, set Active to No rather than deleting it, so past waste entries keep their reason."
    ]
  },

  "pos.terminal": {
    title: "Register",
    what: "The Point of Sale till: open a shift with the cash in the drawer, tap products into a cart, and take payment in one go. Promotions apply themselves, a customer's price list and loyalty points are used when you pick the customer, vouchers are redeemed by code, and at the end of the shift you count the drawer and Orbit records the difference. The Register writes straight to the database, so it needs a connection to save a sale.",
    when: [
      "A shop or bakery counter sells over the counter and wants a cash drawer counted each shift.",
      "A customer pays with a voucher, redeems loyalty points or has their own price list.",
      "At the start and end of a shift, to open and close the register."
    ],
    how: [
      "Open <b>Point of Sale &rsaquo; Register</b>. If no shift is open you see <b>Open the register</b>. For this example a bakery charges 11% VAT and starts the day with 150.00 in the drawer: type 150.00 in <b>Opening cash</b> and press <span class='man-key'>Open register</span>. You should see <i>Register open &middot; opened 08:02</i> in the top bar.",
      "A regular customer comes in. Pick them in the customer list (it starts on <b>Walk-in customer</b>). Their points show at the top of the cart, for example <i>40 pts</i>, and their own price list is picked if they have one.",
      "Tap <i>Sourdough loaf</i> (5.00) twice and <i>Coffee</i> (3.00) once. A promotion of 10% off the Bread category is active, so the loaf line shows <i>-1.00 Bread 10%</i>.",
      "Check the cart: Subtotal 13.00, Discount -1.00, VAT 11% 1.32, Total 13.32. The button reads <b>Charge 13.32</b>. Press it.",
      "In <b>Take payment</b>, leave <b>Voucher code</b> empty and <b>Redeem points</b> at 0. The summary reads <i>Subtotal 13.00 &middot; discount -1.00 &middot; VAT 1.32 &middot; Total 13.32 &middot; earns 1 pts</i> (with loyalty set to 10 points per 100 spent).",
      "The customer hands over 20.00 in cash. Change the tender amount to 20.00. You should see <b>Change 6.68</b>.",
      "Press <span class='man-key'>Complete sale</span>. You should see <i>Sale complete &middot; 13.32 &middot; +1 pts</i> and an empty cart. The customer now has 41 points.",
      "At the end of the shift press <span class='man-key'>Close register</span>. The box says how many sales the shift had and shows each currency with what Orbit expects beside it: here 163.32 (150.00 opening, plus 20.00 in, less 6.68 change).",
      "Count the drawer and type what is really there in <b>Counted</b>, for example 163.00, and press <span class='man-key'>Close shift</span>. You should see <i>Shift closed</i>, and Sessions shows a variance of -0.32."
    ],
    fields: [
      ["Opening cash", "The cash in the drawer when the shift starts, in your own currency. Left empty it is 0. What Orbit expects at close starts from it.", "optional"],
      ["Customer", "Walk-in customer, or a contact marked as a customer. Needed for the sale to go on their record and to earn or redeem points. A customer with an active price list gets it picked for them.", "optional"],
      ["Price list", "Standard price, or a price list that is active and in date. Its item prices, including quantity breaks, replace the standard price of the items it covers.", "optional"],
      ["Search products or scan barcode...", "Narrows the tiles. It matches the product name.", "optional"],
      ["Voucher code", "The code the customer brings. Press Apply to check it. A fixed voucher takes up to its value off the basket after promotions; a percentage voucher takes that percentage off.", "optional"],
      ["Redeem points", "Only shown when a customer with points is picked and a value per point is set. How many points to spend; each is worth the value per point, up to what is left to pay before VAT.", "optional"],
      ["What they hand over", "One tender line per method and currency: Cash, Card, Wallet / gift card, Voucher, Loyalty points, On account or Transfer, the currency, and the amount handed over. It starts at the total. The sale cannot complete until the lines cover it.", "required"],
      ["Change given in", "Appears when change is due: the currency the change is handed back in.", "optional"],
      ["Counted (currency)", "In Close register, one line per currency: what is really in the drawer. It starts filled with what Orbit expects, so type over it with your count.", "auto"]
    ],
    buttons: [
      ["Open register", "Starts a shift with the opening cash."],
      ["A product tile", "Adds one to the cart, or one more if it is already there."],
      ["&minus; / + / &times; on a cart line", "Take one off (removing the line at zero), add one, or remove the line."],
      ["Charge", "Opens Take payment. Greyed while the cart is empty."],
      ["Apply", "Checks the voucher code and applies it, or clears the voucher when the box is empty."],
      ["Add another currency", "Adds a tender line pre-filled with what is still owed in another currency."],
      ["Complete sale", "Saves the sale, its lines and its tenders, marks the voucher used, updates the customer's points and clears the cart."],
      ["Cancel", "Closes Take payment, dropping the voucher and points typed; the cart stays."],
      ["Close register", "Opens the drawer count for the shift."],
      ["Close shift", "Closes the session with the counts and the variance, and returns to Open the register."]
    ],
    after: "Each sale is saved as a paid order numbered from <b>POS-</b>, linked to the open session and the customer, with its lines (unit price, VAT rate, discount) and one payment row per tender, change being a negative tender. A redeemed voucher is marked used; the customer's points go up by the points earned (points per 100 of the sale after discounts, before VAT) and down by any redeemed. Closing records the counted cash, the expected cash (opening cash plus cash taken less change, in your own currency), the variance and the count per currency. The sale appears in <b>Sales</b>, <b>Sessions</b>, <b>Menu engineering</b> and <b>Cost variance</b>. It does not post to the accounts and does not move stock.",
    links: [
      { name: "Sessions", how: "Every shift opened and closed here, with its sales and variance.", to: "pos.sessions" },
      { name: "Sales", how: "Every sale rung up here.", to: "pos.orders" },
      { name: "Returns", how: "Refunds a paid sale.", to: "pos.returns" },
      { name: "Promotions", how: "Active promotions apply themselves to the cart.", to: "pos.promos" },
      { name: "Vouchers", how: "The codes accepted in Voucher code.", to: "pos.vouchers" },
      { name: "Pricelists", how: "The price lists offered, and a customer's own price list.", to: "sale.pricelists" },
      { name: "Company Profile", how: "Loyalty points per 100 spent and Loyalty value per point are set there.", to: "settings.profile" },
      { name: "Items", how: "The tiles are your active products at their Sales Price.", to: "products" },
      { name: "Taxes", how: "The VAT rate is the highest active percentage sales tax.", to: "taxes" },
      { name: "Exchange Rates", how: "A currency can only be taken when it has a rate.", to: "rates" }
    ],
    mistakes: [
      ["No active voucher with that code.", "The code is not typed exactly as issued (capital letters matter), or the voucher was deleted."],
      ["That voucher was already used.", "Each voucher can be spent once."],
      ["That voucher has expired.", "Its expiry date is before today."],
      ["That does not cover the sale yet", "The tender lines add up to less than the total. Raise an amount or add a tender line."],
      ["No exchange rate for (currency) today - add one in Settings, Currencies", "Add the rate in Accounting &rsaquo; Configuration &rsaquo; Exchange Rates, or take that part in another currency."],
      ["No products.", "There are no active products, or the search matches no name."],
      ["Items ring up at 0.00", "The product has no Sales Price. Set one on the item."],
      ["Redeem points does not appear", "No customer is picked, the customer has no points, or Loyalty value per point is 0 in Company Profile."],
      ["The sale fails with an error when the connection is down", "The Register does not keep sales offline: nothing is saved if the order cannot be written. Take the sale again once the connection is back, or use Kitchen &rsaquo; Counter, which keeps working offline."],
      ["Could not save the sale lines: (reason) Nothing was recorded, so take the payment again.", "Part of the sale (its lines, its payment or its paid status) could not be written, so Orbit removed the unfinished sale. The payment box and the cart are still open: press Complete sale again. The same message names the payment or the sale when that was the part that failed."],
      ["The expected cash at close looks too low or too high", "Only cash and change on sales linked to this session count. Counter and Floor sales are not included, and the cash part of a refund made while the session is open counts as cash paid out."]
    ],
    tips: [
      "There is one open session for the whole company: every device using the Register sells into it, and it stays open until someone closes it.",
      "A promotion or price list added while the Register is open is picked up the next time the Register is opened.",
      "The Register offers every active product: it does not use Menus or Availability (86)."
    ]
  },

  "pos.orders": {
    title: "Sales",
    what: "Every till order for the company, newest first: Register sales and refunds, Counter orders and Floor table orders. Each row shows the receipt number, when it was created, the customer, the total and the status. It is a list to find and check sales; nothing is changed here.",
    when: [
      "A customer asks about a past sale.",
      "You want to check the day's sales or export them to a spreadsheet.",
      "You need the receipt number of a sale before refunding it."
    ],
    how: [
      "Open <b>Point of Sale &rsaquo; Sales</b>. For this example a shop looks for a sale made to a regular customer this morning.",
      "Type the customer's name, or a receipt number such as <i>POS-4821337</i>, in <b>Search</b>.",
      "Read the row: Receipt, When, Customer (Walk-in when none was picked), Total and Status.",
      "A refunded sale shows <b>Refunded</b>, and the refund has its own row numbered from <b>REF-</b> with a minus total.",
      "Tell the source by the number: <b>POS-</b> from the Register, <b>REF-</b> a refund, <b>C</b> from the Counter, <b>T</b> from a Floor table.",
      "Press <span class='man-key'>Export</span> to download the list as a CSV file, or <span class='man-key'>Select</span> to choose rows first."
    ],
    buttons: [
      ["Search", "Finds orders by receipt number or customer name."],
      ["Columns", "Chooses which columns show."],
      ["Select", "Switches on row selection, for exporting chosen rows."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing. The list only reads orders.",
    links: [
      { name: "Register", how: "Sales rung there are numbered from POS-.", to: "pos.terminal" },
      { name: "Returns", how: "Refunds appear here numbered from REF-, and the original shows Refunded.", to: "pos.returns" },
      { name: "Counter", how: "Counter orders are numbered from C.", to: "kitchen.counter" },
      { name: "Floor", how: "Table orders are numbered from T.", to: "kitchen.floor" },
      { name: "Sessions", how: "Register sales and refunds add up to each session's Sales figure.", to: "pos.sessions" }
    ],
    mistakes: [
      ["Sales rung up on the register appear here.", "There are no till orders yet for this company."],
      ["An order shows Open, Merged or Cancelled", "Open is a table or counter order not yet paid. Merged is a table whose items were moved onto another table's bill, so its own total is not a sale. Cancelled is a counter order cleared without payment. Only Paid and Refunded orders are finished sales."],
      ["A total is negative", "It is a refund, numbered from REF-."]
    ]
  },

  "pos.returns": {
    title: "Returns",
    what: "Refunds a paid sale in full. The screen lists the latest paid sales from the Register, the Counter and the Floor; pressing <span class='man-key'>Refund</span> records a refund order and payment for the whole sale and takes back any loyalty points the sale earned.",
    when: [
      "A customer brings back everything they bought and wants their money back.",
      "A sale was rung up by mistake after it was paid."
    ],
    how: [
      "Open <b>Point of Sale &rsaquo; Returns</b>. For this example a customer returns this morning's purchase of 13.32, which earned 1 loyalty point.",
      "Find the sale by its number, time, customer and total. The newest are at the top.",
      "Press <span class='man-key'>Refund</span> on that row. The browser asks <i>Refund sale POS-4821337 for 13.32?</i>. Press OK.",
      "You should see <i>Refunded 13.32</i>, and the sale leaves the list.",
      "Hand the customer 13.32 from the drawer.",
      "Open <b>Sales</b>. You should see the original marked <b>Refunded</b> and a new row numbered from <b>REF-</b> for -13.32. The customer's points are 1 lower."
    ],
    buttons: [
      ["Refund", "After you confirm, records the refund of the whole sale."]
    ],
    after: "A refund order numbered from <b>REF-</b> is saved with status refunded and a link to the original, with a negative copy of every line, minus the sale's VAT, and one negative payment for each way the sale was paid, in the same method and currency (a sale with no payment records is refunded as cash). It is linked to the Register session open at that moment, if there is one, so that session's expected cash drops only by the part refunded in cash. The original sale is marked refunded, and the points it earned are taken off the customer. If any part of the refund cannot be saved, the refund is removed and the sale stays as it was. The refund does not give back points the customer redeemed, does not make a used voucher usable again, does not return stock and does not post to the accounts.",
    links: [
      { name: "Sales", how: "Shows the original as Refunded and the refund as its own row.", to: "pos.orders" },
      { name: "Sessions", how: "A refund made while a session is open lowers that session's Sales figure, and its expected cash by the part refunded in cash.", to: "pos.sessions" },
      { name: "Register", how: "Sales rung there can be refunded here.", to: "pos.terminal" }
    ],
    mistakes: [
      ["No sales to refund.", "There are no paid sales. A sale already refunded is no longer listed."],
      ["Only part of the sale is coming back", "This screen refunds the whole sale only."],
      ["The customer paid by card", "The refund is recorded as a card refund, like the sale, so the drawer's expected cash does not change. Refund the card on your card terminal as well."],
      ["Could not record the refund payment: (reason) Nothing was refunded; try again.", "Part of the refund could not be saved, so Orbit removed it and the sale is still listed. Check the connection and press Refund again."],
      ["The sale is not in the list", "Only the latest 200 paid sales are listed, and refunded ones are left out."]
    ],
    tips: [
      "A refund cannot be undone from this screen, so check the number and total in the question before pressing OK."
    ]
  },

  "pos.sessions": {
    title: "Sessions",
    what: "Every Register shift, newest first (the latest 60): when it was opened, the register, whether it is open or closed, the sales it took, the opening cash, the counted cash and the variance. It is where a manager checks the drawer counts; opening and closing happen on the Register.",
    when: [
      "The morning after, to check the previous shift balanced.",
      "A drawer comes up short and you want to see when it started.",
      "To check no session was left open."
    ],
    how: [
      "Open <b>Point of Sale &rsaquo; Sessions</b>. For this example a shop manager checks yesterday's shift.",
      "Find yesterday's row: Opened 08:02, Register Main, Status Closed.",
      "Read <b>Sales</b> 1245.60, <b>Opening</b> 150.00 and <b>Counted</b> 890.40.",
      "Read <b>Variance</b>: green 0.00 means the count matched what Orbit expected; any other figure is red, and a minus figure means less cash than expected.",
      "If a row from yesterday still says <b>Open</b>, go to the Register and press Close register: until it is closed, today's sales are added to that old session.",
      "Compare the Sales figure with the day's rows in Sales if something does not add up."
    ],
    after: "Nothing. The screen only reads sessions and their orders. <b>Sales</b> adds up the totals of every order linked to the session, so refunds made during it count as minus. <b>Variance</b> is the counted cash less the expected cash, in your own currency.",
    links: [
      { name: "Register", how: "Opens and closes the sessions listed here.", to: "pos.terminal" },
      { name: "Sales", how: "The individual sales behind each session.", to: "pos.orders" },
      { name: "Returns", how: "A refund made during a session lowers its Sales and its expected cash.", to: "pos.returns" }
    ],
    mistakes: [
      ["No sessions yet.", "The Register has never been opened for this company."],
      ["Sales is 0.00 on a busy day", "Counter and Floor orders are not linked to a register session, so they are not counted here."],
      ["Counted and Variance show -", "The session is still open."],
      ["The variance is large on a day you took two currencies", "Counted and Variance here are in your own currency only. Check the count per currency when closing, on the Register."]
    ]
  },

  "pos.promos": {
    title: "Promotions",
    what: "Discounts the Register applies by itself: a <b>percent off</b>, a <b>quantity tier</b> (buy so many or more, get a percentage off) or <b>buy X get Y free</b>, for all products or one category. Nobody has to remember them at the till.",
    when: [
      "You run an offer such as 3 for 2 on croissants or 10% off bread.",
      "A promotion has ended and must stop applying."
    ],
    how: [
      "Open <b>Point of Sale &rsaquo; Setup &rsaquo; Promotions</b>. For this example a bakery offers three croissants for the price of two.",
      "Type <i>3 for 2 croissants</i> in <b>Name</b>.",
      "Choose <i>Buy X get Y</i> in the type list. The <b>buy</b> and <b>get free</b> boxes appear.",
      "Choose <i>Category</i> in the second list and pick <i>Pastries</i> in the category list.",
      "Type 2 in <b>buy</b> and 1 in <b>get free</b>, then press <span class='man-key'>Add</span>. You should see the row: 3 for 2 croissants, bxgy, Category, <i>buy 2 get 1 free</i>, Active Yes.",
      "Open the Register again and tap <i>Croissant</i> (2.80) three times. You should see <i>-2.80 3 for 2 croissants</i> on the line and Discount -2.80 in the totals."
    ],
    fields: [
      ["Name", "Shown next to the discount on the cart line.", "required"],
      ["Type", "Percent off, Quantity tier or Buy X get Y.", "optional"],
      ["All products / Category", "What the promotion covers.", "optional"],
      ["Category", "Only for Category: which product category. It must be chosen, or the promotion is not added.", "optional"],
      ["% off", "For Percent off and Quantity tier: the percentage taken off the line. Empty counts as 0.", "optional"],
      ["min qty", "For Quantity tier: the quantity of the item on the line from which the percentage applies.", "optional"],
      ["buy and get free", "For Buy X get Y: for every buy plus get free units on a line, get free units cost nothing.", "optional"]
    ],
    buttons: [
      ["Add", "Saves the promotion as active."],
      ["&times; on a row", "Deletes the promotion after you confirm."]
    ],
    after: "The promotion is saved as active with no start or end date. The <b>Register</b> loads active promotions when it opens and works out each cart line's discount: when several promotions fit a line, only the largest discount is used. VAT is worked out after the discount. The Counter and the Floor do not apply promotions. Nothing is posted to the accounts.",
    links: [
      { name: "Register", how: "Applies active promotions to the cart automatically.", to: "pos.terminal" },
      { name: "Items", how: "A Category promotion covers the items in that category.", to: "products" }
    ],
    mistakes: [
      ["Name the promotion", "Name is empty."],
      ["The promotion does not apply at the till", "The Register was already open when it was added (open it again), the item is not in the category, the line quantity is below min qty, or a Buy X get Y line does not yet hold buy plus get free units."],
      ["Choose the category the promotion covers.", "Category is chosen in the second list but the category list is still on Category... Pick the category, then press Add."],
      ["Applies to reads No category chosen, so it applies to nothing", "The promotion was saved without a category before Orbit refused that, so it discounts nothing. Delete it and add it again with a category."],
      ["A promotion needs changing", "Promotions cannot be edited here. Delete it and add it again."]
    ]
  },

  "pos.vouchers": {
    title: "Vouchers",
    what: "Gift and cashback vouchers: codes a customer brings, redeemed on the Register's Take payment for a fixed amount or a percentage off. Each voucher can be used once, and the list shows whether it is still active or used.",
    when: [
      "You sell or give away a gift voucher.",
      "You issue a cashback or apology code to a customer.",
      "You need to check whether a code has already been used."
    ],
    how: [
      "Open <b>Point of Sale &rsaquo; Setup &rsaquo; Vouchers</b>. For this example a cafe sells a 25.00 gift voucher.",
      "Type <i>GIFT25-0917</i> in <b>CODE</b>.",
      "Leave <i>Fixed amount</i> selected and type 25 in <b>value</b>.",
      "Pick 31 December in the date box for the expiry, and press <span class='man-key'>Add</span>. You should see the row: GIFT25-0917, the value in your currency, the expiry date and Active.",
      "Later the customer buys 32.00 of goods on the Register. In Take payment, type <i>GIFT25-0917</i> in <b>Voucher code</b> and press <span class='man-key'>Apply</span>. You should see <i>Voucher applied: 25.00</i>; with 11% VAT the total drops to 7.77.",
      "Take the 7.77 and press <span class='man-key'>Complete sale</span>. Back on Vouchers, the code now shows <b>Used</b>."
    ],
    fields: [
      ["CODE", "The code the customer will give. It must be typed exactly the same at the till, including capital letters. Use a different code for every voucher.", "required"],
      ["Fixed amount / Percent", "Whether the value is an amount of money or a percentage off.", "optional"],
      ["value", "The amount or the percentage. Empty counts as 0.", "optional"],
      ["Expiry date", "The last day it can be used. Leave empty for no expiry.", "optional"]
    ],
    buttons: [
      ["Add", "Saves the voucher as active."],
      ["&times; on a row", "Deletes the voucher after you confirm."]
    ],
    after: "The voucher is saved as active. On the <b>Register</b>, Apply checks it, and completing the sale marks it used against that sale. A fixed voucher takes off at most the basket after promotions, before VAT; any value left over is not kept. A percentage voucher takes its percentage off the basket after promotions. Choosing Voucher as a payment method on the Counter or the Floor does not redeem a voucher. Nothing is posted to the accounts when a voucher is created or used.",
    links: [
      { name: "Register", how: "Vouchers are redeemed in Take payment.", to: "pos.terminal" },
      { name: "Sales", how: "The sale a voucher was used on is listed there.", to: "pos.orders" }
    ],
    mistakes: [
      ["Enter a code", "CODE is empty."],
      ["No active voucher with that code.", "Shown at the Register: the code is typed differently, or the voucher was deleted."],
      ["A voucher with the code (code) already exists. Use a different code.", "Every voucher needs its own code, whatever its capital letters, so the Register can tell them apart. Type a different code and press Add."],
      ["That voucher was already used.", "Shown at the Register. A voucher cannot be used twice, and this screen cannot reset it."],
      ["That voucher has expired.", "Shown at the Register when the expiry date is before today. The voucher still works on its expiry date."]
    ],
    tips: [
      "For a fixed voucher worth more than the purchase, the unused part is lost, so tell the customer before applying it."
    ]
  }

});
