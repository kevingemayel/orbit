/* Orbit screen help: Accounting, the ledger and its configuration.
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

  "moves": {
    title: "Journal Entries",
    what: "A <b>journal voucher</b> records a movement between accounts that no other screen records for you: an opening balance, an accrual, a correction, a transfer from one account to another. Every voucher has at least two lines, and its debits must equal its credits in the company currency. The list shows every entry in the company, including the ones Orbit posts itself for bills, payments, bank lines, depreciation and revaluation. Opening one shows the voucher.",
    when: [
      "You start using Orbit and need to enter opening balances.",
      "A month-end adjustment is due: an accrual, a prepayment released, or the disposal entry the Assets screen asks you to record.",
      "An amount was posted to the wrong account and has to be moved.",
      "A cost or receipt has no bill or invoice behind it, and you want the scanned receipt kept with the entry.",
      "You want to see which accounts an automatic posting used, or cancel one with a reversal."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Accounting &rsaquo; Journal Entries</b> and click <span class='man-key'>New</span>. For this example, a guesthouse accrues 1,800.00 of August electricity that the utility has not billed yet. You should see <b>Journal voucher</b> <i>numbered when saved</i> and two empty lines.",
      "Set the <b>Date</b> to 31 August 2026 and leave <b>Journal</b> on Journal Voucher.",
      "Type <i>August electricity accrual</i> in <b>Description</b> and the meter reading reference, for example <i>Meter 0831</i>, in <b>Reference</b>.",
      "In the framed <b>Accounting entries</b> block, type the code or the name of your electricity expense account in <b>Account No.</b> on the first line and choose it from the list. If that account has auxiliaries, pick one in <b>Auxiliary</b>: a sub-account, or a contact for an account such as 4011 Suppliers or 4515 Other partners, whose auxiliaries are your contacts. Leave <b>Line description</b> empty: the voucher's Description is copied onto the line when you save.",
      "Type 1,800.00 in <b>Debit</b>. The totals at the top of the Accounting entries block should read Debit 1,800.00, Credit 0.00 and <b>Off by 1,800.00</b>.",
      "On the second line, choose your accrued expenses account. <b>Credit</b> fills with 1,800.00 by itself, because an empty line offers the amount that balances the voucher. The total now reads <b>Balanced</b>.",
      "Under <b>Related documents</b>, add the photo of the meter reading.",
      "Click <span class='man-key'>Save draft</span>. You should see <i>Draft saved</i> and a number such as <i>JV/2026/0012</i>.",
      "Click <span class='man-key'>Post</span>. You should see <i>Posted</i>, the stage move to <b>Posted</b>, the lines lock, and the <span class='man-key'>Duplicate</span>, <span class='man-key'>Edit</span> and <span class='man-key'>Reverse</span> buttons appear.",
      "In September, once the real electricity bill is entered, open this voucher and click <span class='man-key'>Reverse</span>. A mirror voucher dated that day cancels the accrual."
    ],
    fields: [
      ["Date", "The date the movement belongs to. It decides the month the amounts fall in and, for a line in another currency, which rate is looked up. Starts as today. Posting is refused on or before the date set in Period Lock.", "auto"],
      ["Journal", "Which journal the voucher is filed under. Starts on <b>Journal Voucher</b>, the journal for a general voucher that belongs in no other journal (Vendor Bills, Bank, Cash, Customer Invoices or Miscellaneous); a company without it starts on Miscellaneous. It is what the list's Journal column and Group By Journal show. A voucher typed here is numbered JV whatever journal you pick.", "auto"],
      ["Book", "Which book the voucher belongs to; starts on the book you are viewing. Reports on another book leave it out.", "optional"],
      ["Reference", "The number of the paper behind the voucher, such as the supplier's invoice or a receipt number.", "optional"],
      ["Description", "What the voucher is for. It is copied to every line whose Line description you leave empty, and shows in the list's Reference column.", "optional"],
      ["Account No. (on a line)", "The account the line posts to. Type its code or its name and pick it from the list. Typing the full code of an auxiliary also picks its main account. Archived auxiliaries are not offered.", "required"],
      ["Auxiliary (on a line)", "Only open when the chosen account has auxiliaries, and it offers them as soon as the account is chosen. For an account whose auxiliaries are sub-accounts (such as 6011.02) it lists them; picking one posts the line to it, and if the auxiliary has its own currency the line's currency follows it. For an account whose auxiliaries are contacts (such as 4011 Suppliers, 4111 Clients or 4515 Other partners) it lists your contacts: type a name and pick it, and the line keeps that contact, so the voucher shows on the contact's statement. Which kind an account uses is set in Chart of Accounts.", "optional"],
      ["Line description (on a line)", "The wording of the line in the ledger. Left empty, the voucher's Description is used. A new line starts with the line description of the line above it.", "optional"],
      ["Currency (on a line)", "The currency the amounts on this line are typed in. Starts on the account's own currency if it has one, otherwise the company currency.", "auto"],
      ["Rate (on a line)", "Only for a line in another currency. Filled from Exchange Rates with the spot rate on or before the voucher date, shown as 1 of one currency = so many of the other. Type over it with the rate from your bank. A foreign line cannot be saved without a rate.", "auto"],
      ["Debit and Credit (on a line)", "The amount, in the line's currency. A line is a debit or a credit, never both: typing in one clears the other.", "required"],
      ["In (company currency) (on a line)", "The column headed with your company currency, for example <i>In USD</i>. For a foreign line it shows the amount multiplied by the rate, which is what the ledger records. The totals and the balance check use these figures.", "auto"],
      ["Related documents", "The scanned invoice, receipt or contract behind the voucher, as an image or a PDF. Files added to a new voucher are uploaded when it is first saved.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank voucher. Only shown to people who can manage Accounting."],
      ["+ Add line", "Adds a line under the last one, with the description above it and the amount that balances the voucher already filled in. Pressing Enter on the last line does the same; Enter on another line jumps to the next line's account."],
      ["&times; (on a line)", "Removes the line."],
      ["The two-arrow button beside a rate", "Type the rate the other way round, for example 1 USD = 0.92 EUR instead of 1 EUR = 1.087 USD. The ledger figure does not change."],
      ["Save draft", "Checks the lines and saves the voucher as a draft. The first save gives it its number. A draft is not in the accounts."],
      ["Post", "Checks the period lock, saves, sends the voucher for approval if an approval rule covers journal entries of this amount, and otherwise posts it to the ledger."],
      ["Discard / Back", "Goes back to the list. Changes since the last save are not kept. On a posted voucher the button reads Back."],
      ["Duplicate", "Starts a new voucher with the same lines, journal, book and description, dated today, with an empty reference. Attachments are not copied."],
      ["Edit", "On every posted entry, for people who can manage Accounting. A voucher typed here, or an entry Orbit posted for stock, payroll, depreciation, retention or a revaluation, goes back to draft so you can change it: it keeps its number, and the version posted before is kept under <i>Edited after posting</i>. It is out of the accounts until you post it again. An entry that belongs to a bill or invoice takes that document back to draft instead, one that records a payment opens the payment's Edit, and one the Counter posted opens its movement, so a document and its entry always agree."],
      ["Open (document number)", "Shown on an entry Orbit posted for an invoice or a bill. Opens that document."],
      ["&#8249; and &#8250;", "Beside the voucher number when you opened it from the list. Step to the previous or next entry in the list's order, with its search, filters and sorting, without going back to the list. <i>3 of 40</i> shows where you are. Alt and the left or right arrow key do the same."],
      ["Reverse", "On a posted entry that does not belong to an invoice or bill. Posts a mirror voucher in the Miscellaneous journal, dated today, with every debit and credit swapped and the reference REV/ plus the original number. The original stays posted."],
      ["Filters and Group By (list)", "Filter the list to Posted or Draft entries; group it by Journal or by Month."]
    ],
    after: "Posting writes the lines to the ledger as one balanced entry. From then on they count in the General Ledger, the Profit and Loss, the Balance Sheet, the Statement of Account, budget against actual and, when the book is not the primary one, only in reports on that book. A line in another currency keeps its currency amount and its rate, so FX Revaluation can restate it later when it sits on a reconcilable, bank and cash or liability account. A draft changes nothing. Edit takes the voucher out of the accounts until it is posted again. Reverse leaves both the original and the mirror in the ledger, so the net effect is nil and the trail stays visible.",
    links: [
      { name: "Chart of Accounts", how: "Every line posts to an account from the chart. Add or archive accounts there.", to: "accounts" },
      { name: "Exchange Rates", how: "A foreign line takes its rate from there, the spot rate on or before the voucher date.", to: "rates" },
      { name: "Period Lock", how: "Posting and Edit are refused on or before the lock date.", to: "settings.lock" },
      { name: "Approval Rules", how: "A rule for journal entries above an amount makes Post wait for the approver.", to: "approvals.rules" },
      { name: "Accounting books", how: "Where the books offered in the Book field are defined.", to: "settings.books" },
      { name: "General Ledger", how: "Every posted line, account by account.", to: "rep.gl" },
      { name: "Assets", how: "Depreciation entries appear in this list, and a disposal is recorded here as a voucher.", to: "assets.list" },
      { name: "FX Revaluation", how: "Its entries appear in this list and can be reversed from here.", to: "acc.revalue" },
      { name: "Data Health Check", how: "Lists journal entries left in draft, which are not in the accounts.", to: "rep.health" }
    ],
    mistakes: [
      ["Line 2: choose an account.", "The line has an amount but no account. Pick one, or remove the line with &times;."],
      ["No account has the code or name 6999.", "What was typed in Account No. matches no account in this company. Check the code in Chart of Accounts, then type it again."],
      ["Line 2: enter a debit or a credit.", "The line has an account but no amount. Enter the amount, or remove the line."],
      ["There is no EUR rate for 2026-08-31 in Accounting, Exchange Rates. Type the rate on the line.", "No rate exists for that currency on or before the voucher date. Type the rate from your bank on the line, or add one in Exchange Rates."],
      ["Line 1: enter the EUR rate.", "A foreign line has no rate. Type it in the Rate column."],
      ["A voucher needs at least two lines.", "Only one line has an account and an amount. Add the other side of the movement."],
      ["Debits and credits must balance in USD. They are off by 25.00.", "The company-currency figures do not add up. With foreign lines this is often the rate: compare the In column of each line, and adjust an amount or add a line for the difference."],
      ["Period locked on/before 2026-06-30 - choose a later date", "The voucher date is inside a closed period. Use a later date, or ask whoever closed it to reopen it in Period Lock."],
      ["Sent for approval (USD 12,000.00)", "Not an error: an approval rule covers journal entries of this amount. The voucher stays a draft until the approver decides; then click Post again. Clicking again before a decision shows <i>Already awaiting approval</i>."],
      ["Could not edit: The books are closed up to 30 Jun 2026, and this entry is dated 15 Jun 2026. Reverse it with a later date instead.", "A posted voucher inside a locked period cannot go back to draft. Reverse it, which posts the correction today, then enter the right voucher."],
      ["Could not edit: Lines of this entry are matched to payments or invoices. Undo that match first, or reverse the entry.", "Part of the voucher settles a payment or an invoice. Undo that match, or reverse the voucher instead."],
      ["Could not edit: Editing a posted entry needs Work in Accounting on your role.", "Your role cannot reopen posted entries. Ask someone whose role has Work in Accounting, or ask an owner or admin to change your role."],
      ["There is no Edit button on a posted entry", "Editing a posted entry needs permission to manage Accounting. Ask an administrator to change your role."],
      ["Orbit created this entry for a stock movement. Changing it here changes the accounting only; that record keeps its own figures.", "Not an error: a reminder on an entry Orbit posted for another record, now back in draft. The stock movement, payslip or asset keeps its own quantities and amounts, so change the accounts or wording here, and correct the record itself on its own screen."],
      ["No contact is called Acme. Pick one from the list.", "The name typed in Auxiliary matches no contact in this company. Pick it from the list as you type, or add the contact in Contacts first."],
      ["There is no New button", "Creating vouchers needs permission to manage Accounting. Ask an administrator to change your role."]
    ],
    tips: [
      "Write the Description once and leave every Line description empty: each line then reads the same in the ledger.",
      "Reverse always posts today. If the original month is still open, Edit corrects the entry in its own month instead.",
      "Keyboard route: type an account code, press Tab to the amount, press Enter for the next line, which arrives already balanced."
    ]
  },

  "bank": {
    title: "Bank Statements",
    what: "A <b>bank statement</b> here is a copy of the statement your bank sends: a name, the bank or cash journal it belongs to, its date, its start balance (filled from where the previous statement of that journal closed), its closing balance and one line per movement, money in as a plus and money out as a minus. <b>Reconciling</b> a line posts it to the ledger against the account you choose, with the bank on the other side, and marks the line Reconciled. This screen posts each line to an account; it does not match lines to open invoices or bills.",
    when: [
      "Month end, with the bank's statement in hand, to record the fees, interest, standing orders and transfers that nothing else has entered.",
      "Recording movements from a petty cash sheet, by choosing the Cash journal.",
      "Checking how many lines of a statement are still waiting to be reconciled."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Accounting &rsaquo; Bank Statements</b> and click <span class='man-key'>New</span>. For this example, a retail shop enters three lines from its August statement.",
      "Type <i>Bank - August 2026</i> in <b>Name</b>, leave <b>Journal</b> on Bank, set <b>Statement Date</b> to 31 August 2026 and check that <b>Start Balance</b> shows where July's statement closed, 13,089.00. Type the closing balance printed on the statement, 14,320.50, in <b>End Balance</b>.",
      "On the first line set the date to 5 August, type <i>Card terminal settlement</i> in <b>Label</b> and 3,250.00 in <b>Amount (+in / -out)</b>.",
      "Click <span class='man-key'>+ Add a line</span> and enter 12 August, <i>Bank charges</i>, -18.50.",
      "Click <span class='man-key'>+ Add a line</span> again and enter 28 August, <i>Shop rent August</i>, -2,000.00.",
      "Click <span class='man-key'>Save</span>. You should see <i>Statement saved</i>, the header turn read-only and <i>0 of 3 lines reconciled</i> above the lines, followed by <i>start 13,089.00 plus lines 1,231.50 = 14,320.50 (matches the end balance)</i>.",
      "On the bank charges line, choose your bank charges expense account in <b>Counterpart account...</b> and click <span class='man-key'>Reconcile</span>. You should see <i>Reconciled to the ledger</i> and a green Reconciled badge with the account code.",
      "Reconcile the rent line to your rent expense account, and the card settlement to the account where your card takings are held.",
      "You should now see <i>3 of 3 lines reconciled</i>. Each line has become a posted entry in the Bank journal, dated the line's date, which you can see in Journal Entries.",
      "Found a line you missed? Under <b>Add a line</b> at the bottom, enter its date, label and amount, click <span class='man-key'>Add line</span>, then reconcile it."
    ],
    fields: [
      ["Name", "What the statement is called in the list, for example the bank and the month.", "required"],
      ["Journal", "The bank or cash journal the statement belongs to. The list offers journals coded BNK or CSH, or with bank or cash in their name. The journal's own account is the bank side of every entry; a journal without one uses account 5100.", "auto"],
      ["Statement Date", "The date printed on the statement. Starts as today. It sorts the list; each line posts on its own date.", "auto"],
      ["Start Balance", "The balance the statement opens with. A new statement fills it with the closing balance of the latest statement of the same journal dated on or before it, and follows the Journal and Statement Date you pick until you type over it. An older statement saved without one is filled the first time it is opened.", "auto"],
      ["End Balance", "The closing balance printed on the statement. Above the lines, Orbit adds the start balance and the lines and says whether they come to this figure.", "optional"],
      ["Date (on a line)", "The day the money moved. The entry posts on this date, so it must be after any Period Lock date.", "auto"],
      ["Label (on a line)", "The wording from the statement. It becomes the description of the entry.", "optional"],
      ["Amount (+in / -out) (on a line)", "Positive for money received, negative for money paid out. A line with no amount and no label is not saved.", "required"],
      ["Counterpart account (on a saved line)", "The account the other side of the movement posts to: an expense for a fee, income for interest, another bank account for a transfer.", "required"],
      ["Add a line: Date, Label, Amount", "On a saved statement, adds one more line to it.", "optional"]
    ],
    buttons: [
      ["New", "Starts a new statement."],
      ["+ Add a line", "On a new statement, adds an empty line dated today."],
      ["&times; (on a line)", "On a new statement, removes the line before it is saved."],
      ["Save", "Saves the statement and its lines. After this the name, journal, date and balances cannot be changed."],
      ["Edit (on a saved line)", "Shown on a line not yet reconciled. Change its date, label or amount and click Save, or click Delete line to remove it. A reconciled line cannot be edited, because it is in the ledger."],
      ["Discard", "Leaves a new statement without saving it."],
      ["Back", "Returns to the list from a saved statement."],
      ["Reconcile", "Posts the line against the counterpart account you chose and marks it Reconciled. It cannot be undone from this screen."],
      ["Add line", "Adds the line typed under <i>Add a line</i> to a saved statement."],
      ["Group By (list)", "Groups statements by journal."]
    ],
    after: "Each <span class='man-key'>Reconcile</span> posts one entry in the statement's journal, dated the line's date: money in is debited to the journal's bank account and credited to the account you chose, money out the other way round. It is numbered with the journal's code, for example <i>BNK/2026/0007</i>, and from then on counts in the General Ledger, the Balance Sheet and the Profit and Loss. The entry cannot be edited, because Orbit posted it for the bank line. It can be reversed from Journal Entries, but the statement line stays marked Reconciled.",
    links: [
      { name: "Journal Entries", how: "Every reconciled line appears there as a posted entry.", to: "moves" },
      { name: "Chart of Accounts", how: "The counterpart accounts come from the chart.", to: "accounts" },
      { name: "General Ledger", how: "Compare the bank account's balance at the statement date with the End Balance you typed.", to: "rep.gl" },
      { name: "Invoices", how: "A customer's payment of an invoice is recorded with Register Payment on the invoice, which already posts to the bank. Reconciling the same receipt here would count it twice.", to: "inv.out" },
      { name: "Period Lock", how: "A line dated inside a locked period cannot be reconciled.", to: "settings.lock" }
    ],
    mistakes: [
      ["Name the statement", "The Name is empty. Type one, then Save."],
      ["Pick a counterpart account", "Reconcile was clicked with no account chosen on that line."],
      ["Enter a line", "Add line was clicked with no label and no amount."],
      ["Could not reconcile: Period locked on 2026-06-30", "The line's date is on or before the lock date. Reopen the period in Period Lock, or ask whoever closed it."],
      ["(amount) away from the end balance: a line is missing or wrong", "The start balance plus the lines does not come to the End Balance. Look for a line not entered, or typed with the wrong sign or amount, and correct it with Edit or Add line."],
      ["A reconciled line has the wrong amount", "A reconciled line is in the ledger, so it cannot be edited. Reverse its entry in Journal Entries, then add the correct line and reconcile that."],
      ["This line has been reconciled, so it can no longer be changed. Reverse its entry in Journal Entries first.", "Someone reconciled the line while you were editing it. Reverse its entry in Journal Entries if it is wrong, then add the correct line."],
      ["Money received shows twice in the bank account", "The receipt was registered as a payment on the invoice and also reconciled here. Reverse the entry made by the bank line in Journal Entries."]
    ],
    tips: [
      "Type the End Balance exactly as printed, so anyone can later compare it with the bank account in the General Ledger.",
      "Only reconcile lines that nothing else has posted: fees, interest, transfers, standing orders."
    ]
  },

  "assets.list": {
    title: "Assets",
    what: "A <b>fixed asset</b> is something you buy to use for years, such as a vehicle, a machine or a shop fit-out. Rather than charging its whole cost in the month you buy it, you spread that cost over its useful life: that is <b>depreciation</b>. Each asset here holds its cost, what it will still be worth at the end, its life in months and the accounts depreciation posts to, and Orbit works out an equal amount for every month.",
    when: [
      "You have bought equipment, a vehicle or a fit-out that will be used for more than a year.",
      "A month has ended and depreciation is due to be posted.",
      "An asset has been sold, scrapped or written off.",
      "You want to see an asset's cost, what has been depreciated and its book value today."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Accounting &rsaquo; Assets</b> and click <span class='man-key'>New</span>. For this example, a building contractor bought a site van for 36,000.00 and expects to sell it for 6,000.00 after five years.",
      "Type <i>Site van</i> as the asset name and <i>Vehicles</i> in <b>Category</b>.",
      "Enter 36,000.00 in <b>Acquisition value</b>, 6,000.00 in <b>Salvage value</b> and 60 in <b>Useful life (months)</b>.",
      "Set <b>Acquisition date</b> to 20 August 2026 and <b>Depreciation start</b> to 1 September 2026.",
      "Check that the codes in <b>Expense account</b> (6800 by default) and <b>Accum. depreciation</b> (2800 by default) exist in your Chart of Accounts. If your chart uses other codes, type yours.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, an FA number, and under <b>Depreciation schedule</b> 60 monthly rows of 500.00, with the book value ending at 6,000.00.",
      "Click <span class='man-key'>Confirm &amp; schedule</span>. You should see <i>Scheduled over 60 months</i>, the stage move to <b>Running</b> and the fields lock.",
      "On or after 1 September, open the asset and click <span class='man-key'>Post depreciation (1 due)</span>. You should see <i>Posted 1 depreciation entry</i>, the first row marked Posted, <b>Depreciated</b> 500.00 and <b>Book value</b> 35,500.00.",
      "Repeat each month. The button shows how many months are due, so a missed month is posted with the next one.",
      "This screen does not record the purchase itself. Post the van's bill, or a journal voucher, to your fixed assets account as usual."
    ],
    fields: [
      ["Asset name", "What the asset is. Left empty it is saved as <i>Asset</i>.", "optional"],
      ["Category", "A grouping of your choice, such as Plant, Vehicles or IT. The Asset dashboard totals book value by it.", "optional"],
      ["Acquisition value", "What the asset cost. The Cost tile shows it.", "optional"],
      ["Salvage value", "What it will still be worth at the end of its life. This part is never depreciated.", "optional"],
      ["Useful life (months)", "How many months to spread the cost over. Starts at 60; left empty it is saved as 60.", "auto"],
      ["Acquisition date", "When it was bought. Starts as today.", "auto"],
      ["Depreciation start", "The date of the first month of depreciation. Each following month falls on the same day of the month, or the 28th for later days.", "auto"],
      ["Expense account", "The code of the profit and loss account that depreciation is charged to. Starts as 6800. It must match a code in the Chart of Accounts exactly.", "auto"],
      ["Accum. depreciation", "The code of the balance sheet account that collects depreciation against the asset. Starts as 2800. It must match a code in the Chart of Accounts exactly.", "auto"],
      ["Number", "Given on the first save, starting with FA.", "auto"],
      ["Type (Dispose window)", "Sale, Scrap or Write-off.", "optional"],
      ["Date (Dispose window)", "When the asset left the business. Starts as today.", "auto"],
      ["Proceeds received (Dispose window)", "What you got for it. The window shows the gain or loss against today's book value as you type.", "optional"]
    ],
    buttons: [
      ["New", "Starts a new asset in Draft."],
      ["Save", "Saves the asset. On a new asset it also gives the number and shows the schedule."],
      ["Discard", "Goes back to the list without saving changes."],
      ["Delete", "Shown on a saved asset that is not closed. Deletes it after a confirmation."],
      ["Confirm &amp; schedule", "On a draft. Saves, writes the monthly schedule and moves the asset to Running. The fields lock."],
      ["Post depreciation", "On a running asset. Posts one entry for each scheduled month whose date has arrived and is not yet posted. The number in brackets is how many are due."],
      ["Dispose", "On a running asset. Opens the Dispose window."],
      ["Dispose &amp; close", "In the Dispose window. Records the type, date, proceeds and gain or loss, and closes the asset."],
      ["Close", "On a running asset. Closes it straight away, with no confirmation and no disposal details."],
      ["Filters and Group By (list)", "Filter to Running, Draft or Closed assets; group by Category or Status."]
    ],
    after: "Confirm writes the schedule: the depreciable amount (value less salvage) divided equally over the months, with the last month taking any rounding. Each <span class='man-key'>Post depreciation</span> posts, for every due month, an entry in the Miscellaneous journal dated the day you click, debiting the expense account and crediting accumulated depreciation, labelled <i>Depreciation</i> with the asset's number and name. Those entries count in the Profit and Loss and the Balance Sheet and appear in Journal Entries. Dispose closes the asset and records the disposal on the Asset dashboard, but posts nothing: record the disposal as a journal voucher (take out the cost and the accumulated depreciation, and book the proceeds and the gain or loss).",
    links: [
      { name: "Asset dashboard", how: "Totals cost, depreciation and book value across every asset, and lists disposals.", to: "assets.dash" },
      { name: "Journal Entries", how: "Depreciation entries appear there, and a disposal is recorded there.", to: "moves" },
      { name: "Chart of Accounts", how: "The expense and accumulated depreciation codes must exist there.", to: "accounts" },
      { name: "Bills", how: "The purchase of the asset is recorded as a bill, not on this screen.", to: "inv.in" },
      { name: "Period Lock", how: "Depreciation cannot post into a locked period.", to: "settings.lock" }
    ],
    mistakes: [
      ["Nothing due to post", "No scheduled month has reached today's date, or every due month is already posted."],
      ["The schedule shows only zeros", "The schedule is drawn from the saved figures. Click Save after typing the value, salvage and life."],
      ["Depreciation for (date) could not be posted. Check that accounts (codes) exist in the Chart of Accounts, that a MISC journal exists, and that the period is not closed.", "Posting stopped at that month and left it, and every later month, unposted. The expense or accumulated depreciation code does not exist in the Chart of Accounts, the company has no Miscellaneous (MISC) journal, or the month falls inside a locked period. Correct the cause and click Post depreciation again; months already posted are not posted twice."],
      ["The fields cannot be changed", "The asset is Running or Closed, and its schedule is fixed. Check the value, salvage, life and start date before clicking Confirm &amp; schedule."],
      ["Save failed", "The change could not be written, for example because your role cannot manage Accounting."]
    ],
    tips: [
      "Each entry is dated at its schedule month, so catching up several months at once still puts each month's depreciation in the right period, as long as that period is not closed.",
      "Use the same Category words every time, so the Asset dashboard groups them properly."
    ]
  },

  "assets.dash": {
    title: "Asset dashboard",
    what: "The <b>Asset dashboard</b> totals your fixed asset register on one page: what the assets cost, how much of that has been depreciated, what they are worth on the books now, the book value by category, and every disposal with its gain or loss. It only reads; nothing on it changes your books.",
    when: [
      "Month or year end, to compare the register with the fixed asset accounts on the Balance Sheet.",
      "Deciding what to replace, by looking at book value by category.",
      "Checking the gains and losses on assets sold or scrapped."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Accounting &rsaquo; Asset dashboard</b>. For this example, a restaurant group has kitchen equipment and two delivery vans.",
      "Read <b>Gross cost (live)</b>: 112,000.00, the kitchen equipment at 48,000.00 plus the vans at 64,000.00.",
      "Read <b>Accumulated depreciation</b>: 18,400.00, the depreciation posted so far on those assets.",
      "Read <b>Net book value</b>: 93,600.00, the cost less that depreciation. <b>Live assets</b> shows 3.",
      "In <b>Net book value by category</b>, you should see Kitchen equipment at 48,000.00 cost, 9,600.00 depreciated and 38,400.00 book value, and Vehicles at 64,000.00, 8,800.00 and 55,200.00.",
      "Once an asset has been disposed, the <b>Disposals</b> table lists it with its type, date, proceeds and gain or loss, and the <b>Disposal gain/loss</b> tile shows the total in green for a gain or red for a loss.",
      "Open the Balance Sheet for the same date and compare its fixed asset and accumulated depreciation accounts with these totals."
    ],
    fields: [
      ["Gross cost (live)", "The acquisition value of every asset not disposed, including drafts and assets closed without a disposal.", "auto"],
      ["Accumulated depreciation", "The total of the schedule months marked Posted on those assets.", "auto"],
      ["Net book value", "Gross cost less accumulated depreciation.", "auto"],
      ["Live assets", "How many assets have not been disposed.", "auto"],
      ["Disposal gain/loss", "The total gain less losses recorded when assets were disposed.", "auto"],
      ["Net book value by category", "Cost, Depreciated and Book value per Category. An asset with no category is counted under Uncategorized.", "auto"],
      ["Disposals", "Each disposed asset with its Type, Date, Proceeds and Gain/Loss.", "auto"]
    ],
    after: "Nothing: the dashboard reads the assets and their schedules and changes no record.",
    links: [
      { name: "Assets", how: "Where assets are added, depreciated and disposed.", to: "assets.list" },
      { name: "Balance Sheet", how: "Compare the fixed asset accounts there with these totals.", to: "rep.bs" },
      { name: "Journal Entries", how: "Disposal entries are recorded there.", to: "moves" }
    ],
    mistakes: [
      ["The totals differ from the Balance Sheet", "The dashboard adds up asset records, not ledger balances. A purchase not posted to the fixed assets account, or a disposal not recorded as a voucher, makes the two differ."],
      ["A closed asset is still counted", "Close without Dispose keeps an asset live here. Only a disposal takes it out of the totals."],
      ["A draft asset is counted", "Drafts count in Gross cost. Confirm it, or delete it if it was a mistake."]
    ],
    tips: [
      "Give every asset a category: anything without one lands in Uncategorized."
    ]
  },

  "accounts": {
    title: "Chart of Accounts",
    what: "The <b>chart of accounts</b> is the list of every account your company posts to: bank, receivables, sales, rent, VAT and so on. Each account has a code, a name and a type, and the type decides whether it appears on the Balance Sheet or the Profit and Loss. A new company starts with a ready-made chart, so most of the time you only add, rename or archive accounts here.",
    when: [
      "You need an account the chart does not have yet, for example a new kind of expense.",
      "An account's name should read differently on your reports.",
      "An account is no longer used and should stop being offered on documents.",
      "You want to see how many journal lines an account has."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Accounting &rsaquo; Chart of Accounts</b>. For this example, an IT services firm wants its software subscriptions separate from general expenses. Click <span class='man-key'>Group By</span> and choose Type to see where similar accounts sit.",
      "Click <span class='man-key'>New</span>.",
      "Type <i>Software subscriptions</i> as the account name.",
      "Type <i>6135</i> in <b>Code</b>, a free code next to your other expense accounts.",
      "Choose <b>Expenses</b> in <b>Type</b>.",
      "Leave <b>Status</b> on Active and <b>Reconcilable</b> on No.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the new account in the list.",
      "The account is now offered in <b>Account No.</b> on a journal voucher, in a product's <b>Expense Account</b> and on bill lines.",
      "To rename an account quickly, click its Name cell in the list, type, and press Enter.",
      "When an account is no longer needed, open it, set <b>Status</b> to Archived and click Save. It disappears from the pickers; its history stays."
    ],
    fields: [
      ["Account name", "The name shown in pickers and on every report.", "required"],
      ["Code", "The account's number. It must be unique in the company. The list is sorted by it, and it is what you type on a journal voucher.", "required"],
      ["Type", "What kind of account it is: Receivable, Bank and Cash, Current Assets, Fixed Assets, Payable, Tax Payable, Equity, Income, Other Income, Expenses, Cost of Revenue, Depreciation and so on. Balance sheet types appear on the Balance Sheet, income and expense types on the Profit and Loss. A product's Income Account only offers income types, and its Expense Account only expense types.", "required"],
      ["Status", "Active, or Archived to hide it from the account pickers on vouchers, invoices, bills, products and the Companies panels. Posted history is untouched.", "optional"],
      ["Reconcilable", "Turn on for receivable, payable and bank accounts. FX Revaluation restates foreign balances on reconcilable accounts, as well as on bank and cash and liability accounts.", "optional"],
      ["Auxiliaries", "What a journal voucher offers in its Auxiliary column for this account: <i>None</i>, <i>Sub-accounts</i> (the dotted accounts under it, such as 6011.02) or <i>Contacts</i> (your customers, suppliers and other partners, for accounts such as 4011 Suppliers, 4111 Clients and 4515 Other partners). With Contacts, the contact picked on a voucher line is kept on it, so the voucher shows on that contact's statement.", "optional"],
      ["Code and Name (in the list)", "Both can be changed by clicking the cell in the list.", "optional"]
    ],
    buttons: [
      ["New", "Starts a new account."],
      ["Save", "Saves the account and returns to the list."],
      ["Discard", "Returns to the list without saving."],
      ["Journal Items", "The counter on a saved account shows how many journal lines use it. Clicking it opens the General Ledger report, where you choose the account."],
      ["Select, then Archive or Delete (list)", "Tick accounts to archive them together, or to delete ones never used."],
      ["Filters and Group By (list)", "Filter to Active or Archived; group by Type or by Class (Assets, Liabilities, Equity, Income, Expenses, Off-Balance)."],
      ["Export (list)", "Downloads the list as a CSV file."]
    ],
    after: "Saving changes the account itself. Every document, payment and voucher posts to accounts from this chart, and the reports group them by type. Automatic postings find their accounts through the pointers in <b>Companies &rsaquo; Accounting accounts</b> and <b>Stock accounting</b>; where a pointer is empty they look for a standard code (4100 receivable, 4000 payable, 4457 VAT on sales, 4456 VAT on purchases, 7000 income, 6000 expense, 3100 stock). Asset depreciation looks accounts up by the codes typed on the asset.",
    links: [
      { name: "Companies", how: "Points the automatic postings at your own accounts, so they do not depend on standard codes.", to: "companies" },
      { name: "Journal Entries", how: "Vouchers post to the accounts in this chart.", to: "moves" },
      { name: "General Ledger", how: "Every posted line on an account.", to: "rep.gl" },
      { name: "Balance Sheet", how: "Shows the balance sheet types.", to: "rep.bs" },
      { name: "Profit and Loss", how: "Shows the income and expense types.", to: "rep.pl" },
      { name: "FX Revaluation", how: "Uses the Reconcilable switch and the type to decide which balances to restate.", to: "acc.revalue" }
    ],
    mistakes: [
      ["Code and name are required", "Either the Code or the account name is empty."],
      ["Could not save: A record with Code 6135 already exists. Use a different one.", "Another account in this company already has that code, possibly an archived one. Filter the list to Archived to find it, or choose another code."],
      ["Some of these are used in other records - use Archive instead.", "At least one selected account has been used, so it cannot be deleted. Archive it."],
      ["A new account is missing from a product's Income Account list", "Its Type is not an income type. Change the Type to Income or Other Income."],
      ["Posting suddenly fails after recoding an account", "An automatic posting was relying on the standard code. Set the matching pointer in Companies, Accounting accounts or Stock accounting, then post again."],
      ["The Auxiliary column on a voucher stays empty for an account that should have auxiliaries", "Open the account here and set <b>Auxiliaries</b>: Contacts for an account kept per customer, supplier or partner, Sub-accounts for one with dotted accounts under it. Sub-accounts also have to exist, with codes such as 4515.01."]
    ],
    tips: [
      "Before changing the code of 4100, 4000, 4457, 4456, 7000, 6000 or 3100, set the matching pointer in Companies.",
      "This form does not set an account's own currency. Where your chart has one, the journal voucher uses it."
    ]
  },

  "acc.revalue": {
    title: "FX Revaluation",
    what: "When your company holds money, receivables or debts in another currency, their value in your own currency moves with the exchange rate. <b>Revaluation</b> restates those open balances at the <b>closing rate</b> on a date and posts the difference as an unrealised exchange gain or loss. The screen shows each foreign currency's open balance, what it is on the books at, what it is worth at the closing rate and the adjustment, then posts it in one entry.",
    when: [
      "Month, quarter or year end, before running the Balance Sheet, when you have open foreign-currency customer, supplier, bank or loan balances.",
      "After entering or updating closing rates, to see how much the books would move."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Configuration &rsaquo; Exchange Rates</b> and check there is a <b>Closing</b> rate for your currency dated on or before month end. For this example, a trading company that keeps its books in USD has a EUR closing rate of 1.11. <span class='man-key'>Update from market</span> adds today's closing rates if you need them.",
      "Open <b>Accounting &rsaquo; Accounting &rsaquo; FX Revaluation</b>.",
      "In <b>Open foreign-currency exposure</b> you should see EUR with an <b>Open balance</b> of 20,000.00, <b>On books (USD)</b> 21,600.00 (it was booked at 1.08), <b>At closing rate</b> 22,200.00 and an <b>Unrealized adj.</b> of 600.00 in green.",
      "The last row reads <b>Net unrealized gain</b> 600.00.",
      "Check <b>Revalue as of</b> reads 30 September 2026, the last day of the month.",
      "Click <span class='man-key'>Run revaluation</span>. The button reads <i>Posting...</i> while it works.",
      "You should see <i>Revaluation posted: net 600.00 USD over 1 account(s)</i>, and the table redraws.",
      "Open Journal Entries: the new entry, <i>Unrealized FX revaluation 2026-09-30</i>, debits 600.00 to the receivable account and credits 600.00 to the unrealised exchange gain account.",
      "Click <span class='man-key'>Run revaluation</span> again. You should see <i>Already at the closing rate - nothing to post</i>.",
      "When the customer pays in October, the October month-end run posts the reversal of this 600.00 by itself, because the open balance is gone."
    ],
    fields: [
      ["Revalue as of", "The date the balances and closing rates are taken at. Starts at the end of the current month. Changing it redraws the table with the balances and rates on or before that date, and the date is kept after a run.", "auto"],
      ["Currency", "Each foreign currency with an open balance on a monetary account.", "auto"],
      ["Open balance", "What is still open in that currency, added up from posted lines.", "auto"],
      ["On books", "What those lines are recorded at in the company currency, including earlier revaluations.", "auto"],
      ["At closing rate", "The open balance converted at the closing rate. Reads <i>no rate on or before this date</i> when the currency has no rate dated on or before the chosen date.", "auto"],
      ["Unrealized adj.", "At closing rate less On books: green for a gain, red for a loss. The total row shows the net gain or loss.", "auto"]
    ],
    buttons: [
      ["Run revaluation", "Posts the adjustment for the date in Revalue as of. It only ever posts the change since the last run, so running it twice on the same rates posts nothing."],
      ["Exchange Rates (link in the warning)", "Opens Exchange Rates when a currency in the table has no rate."]
    ],
    after: "The run posts one balanced entry in the Miscellaneous journal, dated the chosen date, with the reference <i>FX-REVAL</i> and the date. Every account holding a foreign balance is moved by its own difference, with its currency amount left unchanged, and the net goes to the company's unrealised exchange gain or loss account. Only posted lines dated on or before the date count, and only on accounts that are Reconcilable, of type Bank and Cash, or a liability. The entry counts in the Balance Sheet and the Profit and Loss and appears in Journal Entries, where it can be reversed but not edited. When the foreign item is later settled, the next run posts the opposite amount, so the revaluation clears itself.",
    links: [
      { name: "Exchange Rates", how: "Supplies the closing rate. Without a closing rate the latest rate of any type on or before the date is used.", to: "rates" },
      { name: "Journal Entries", how: "Each run appears there as a posted entry.", to: "moves" },
      { name: "Chart of Accounts", how: "The Reconcilable switch and the account type decide which balances are restated.", to: "accounts" },
      { name: "Balance Sheet", how: "Run the revaluation first, so foreign balances show at the closing rate.", to: "rep.bs" },
      { name: "Period Lock", how: "A date inside a locked period cannot be revalued.", to: "settings.lock" }
    ],
    mistakes: [
      ["Revaluation failed: Set the FX gain/loss accounts in company settings first", "The company has no unrealised exchange gain or loss account recorded. They are set when the company is created, from the chart's codes 7660 and 6660; a chart without those codes leaves them empty, and the Companies screen has no field for them. Ask your administrator to set them."],
      ["Revaluation failed: No FX rate for EUR on or before 2026-09-30 (type closing)", "No rate of any type exists for that currency on or before the date. Add one in Exchange Rates."],
      ["Revaluation failed: Period locked on 2026-09-30", "The date is on or before the lock date. Choose a later date, or reopen the period."],
      ["Some currencies have no closing rate for this date - add one under Exchange Rates so they can be revalued.", "A currency in the table has no rate at all. Add one, then open the screen again."],
      ["No open foreign-currency monetary balances as of this date. Nothing to revalue.", "No posted foreign-currency line sits on a reconcilable, bank and cash or liability account on or before the date. A foreign balance on another kind of account is never revalued."]
    ],
    tips: [
      "Enter closing rates on the last day of the month before you run it, so the entry uses the month-end rate.",
      "It is safe to run as often as you like: a second run on the same rates posts nothing."
    ]
  },

  "taxes": {
    title: "Taxes",
    what: "The <b>tax</b> list holds the VAT or sales tax rates your documents can carry, such as <i>VAT 11%</i> or <i>Exempt 0%</i>. Each rate has a name, a percentage and a scope that says whether it is offered on sales, on purchases or on both. A new company starts with its country's VAT for sales and purchases and a 0% exempt rate.",
    when: [
      "Setting up a company, to check the rates it started with.",
      "A rate changes, or you start selling or buying something taxed at a different rate.",
      "A product or a document needs a rate that is not in the list yet."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Configuration &rsaquo; Taxes</b>. For this example, a children's clothing shop adds a reduced 5% rate beside its standard rate. Click <span class='man-key'>Group By</span> and choose Scope to see sales and purchase rates apart.",
      "Click <span class='man-key'>New</span>. The <b>New tax</b> window opens.",
      "Type <i>VAT 5% reduced</i> in <b>Name</b>.",
      "Type 5 in <b>Rate %</b>.",
      "Choose <b>Sale</b> in <b>Scope</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the rate in the list at 5% with scope sale.",
      "If you also buy at that rate, add <i>VAT 5% reduced (purchase)</i> with Scope <b>Purchase</b>, or use <b>Both</b> for a single rate.",
      "Open the product, for example a children's raincoat, choose <i>VAT 5% reduced (5%)</i> in <b>Sales Tax</b> and save it.",
      "On a new invoice, pick the raincoat. The line's tax is the 5% rate: a 40.00 line shows Taxes 2.00 and Total 42.00."
    ],
    fields: [
      ["Name", "How the rate reads in pickers and on documents, for example <i>VAT 5%</i>.", "required"],
      ["Rate %", "The percentage, up to four decimal places. The tax on a line is its subtotal times this rate.", "required"],
      ["Scope", "Sale, Purchase or Both. Customer invoices and a product's Sales Tax offer Sale and Both rates; bills and a product's Purchase Tax offer Purchase and Both. A new tax starts on Sale.", "auto"],
      ["Name and Rate (in the list)", "Both can be changed by clicking the cell in the list.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New tax window."],
      ["Save", "Saves the rate and closes the window."],
      ["Cancel", "Closes the window without saving."],
      ["Delete", "In the window of a saved tax. Deletes it after a confirmation, unless it is used on a product or a document."],
      ["Select, then Archive or Delete (list)", "Tick rates to archive or delete them together."],
      ["Group By (list)", "Groups the rates by Scope."]
    ],
    after: "A saved rate is offered on invoice, bill, quotation and purchase order lines and on products, according to its scope. When a document is posted, Orbit works out each line's tax from the rate at that moment and posts the total to the company's <b>VAT on sales</b> or <b>VAT on purchases</b> account, chosen in <b>Companies &rsaquo; Accounting accounts</b>; the tax record itself holds no account. The VAT / Tax Report adds those amounts up. Changing a rate does not change documents already posted, but a posted document taken back to draft with Edit uses the new rate when it is posted again. An archived rate is no longer offered on invoices, bills, orders, certificates, recurring invoices or products; one that already uses it keeps it.",
    links: [
      { name: "Products", how: "A product's Sales Tax and Purchase Tax fill the tax on document lines.", to: "products" },
      { name: "Invoices", how: "Each line can carry a Sale or Both rate.", to: "inv.out" },
      { name: "Bills", how: "Each line can carry a Purchase or Both rate.", to: "inv.in" },
      { name: "Companies", how: "Chooses the VAT on sales and VAT on purchases accounts the tax posts to.", to: "companies" },
      { name: "VAT / Tax Report", how: "Adds up the tax collected and the tax you can reclaim.", to: "rep.tax" }
    ],
    mistakes: [
      ["Name the tax", "The Name is empty."],
      ["Enter a rate %", "Rate % is empty or not a number. Type 0 for an exempt rate."],
      ["This tax is in use - it can't be deleted.", "The rate is on a product or a document. Rename it instead, for example by adding OLD in front."],
      ["This document carries VAT but no sales VAT account is set. Choose one in Settings, Companies, Accounting accounts.", "An invoice with tax cannot post because the company has no VAT on sales account. Set it in Companies, then post again."],
      ["A rate I archived still shows on an old invoice or product", "Archiving stops a rate being offered on new lines. A document or product that already uses it keeps it, so its figures do not change. Pick the new rate on it if it should change."],
      ["No tax is offered on a line, or every tax is", "When no rate matches the document's scope, every rate is offered. Check each rate's Scope."]
    ],
    tips: [
      "Name rates by what they are and their percentage, for example <i>VAT 11%</i> and <i>VAT 11% (purchase)</i>, so the right one is obvious in a picker.",
      "Set each product's Sales Tax and Purchase Tax once, and lines fill themselves."
    ]
  },

  "acc.einvoice": {
    title: "E-invoicing",
    what: "An <b>e-invoice</b> is a customer invoice in a structured file that a tax authority's network can read, rather than a PDF. This screen stores your e-invoicing details (seller name, tax registration number, Peppol scheme and ID, and your service provider) and turns a posted customer invoice into a UBL XML file for the Peppol network. As the screen explains, a certified provider, the <b>ASP</b>, transmits the file; Orbit generates it and gives it to you to send.",
    when: [
      "Your company has to issue e-invoices and you are setting up the details.",
      "A posted customer invoice needs its e-invoice file.",
      "You need to download again the file generated for an invoice."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Configuration &rsaquo; E-invoicing</b>. For this example, a trading company in the UAE prepares its first e-invoice.",
      "Set <b>Enabled</b> to On.",
      "Check <b>Seller legal name</b>, type your registration number, for example <i>100123456700003</i>, in <b>Tax reg. no. (TRN)</b>, and check <b>Country</b> reads <i>AE</i>.",
      "Leave <b>Peppol scheme</b> on 0235 and type the ID your provider gave you, for example <i>0235:1001234567</i>, in <b>Peppol / endpoint ID</b>.",
      "Type your provider's name in <b>ASP provider</b> and their address in <b>ASP endpoint</b>, for reference.",
      "Click <span class='man-key'>Save setup</span>. You should see <i>Saved</i>.",
      "In <b>Posted customer invoices</b>, find the invoice, for example INV/2026/0041 for 10,500.00, and click <span class='man-key'>Generate e-invoice</span>.",
      "You should see <i>E-invoice generated</i>, an XML file named after the invoice download, and the row show a <i>generated</i> badge and an <span class='man-key'>XML</span> button.",
      "Send the file to your provider through their service. Orbit does not transmit it.",
      "From now on the invoice cannot be taken back to draft with Edit; correct it with a credit note."
    ],
    fields: [
      ["Enabled", "On or Off. Saved with your setup; generating a file does not check it.", "optional"],
      ["Seller legal name", "Your company's legal name in the file. Starts as the company's legal name or name.", "auto"],
      ["Tax reg. no. (TRN)", "Your tax registration number, written into the file as the seller's tax ID. Starts as the company's tax ID.", "auto"],
      ["Country", "Your two-letter country code, for example AE. Starts as the company's country.", "auto"],
      ["Peppol scheme", "The identifier scheme of your Peppol ID. Starts as 0235.", "auto"],
      ["Peppol / endpoint ID", "Your address on the Peppol network, from your provider. Left empty, the file uses the tax registration number.", "optional"],
      ["ASP provider", "The name of the provider that transmits your e-invoices. Kept for reference only.", "optional"],
      ["ASP endpoint", "Your provider's web address. Kept for reference only; Orbit does not send anything to it.", "optional"]
    ],
    buttons: [
      ["Save setup", "Saves the details on the company."],
      ["Generate e-invoice", "On a posted customer invoice with no file yet. Builds the XML file, keeps a copy marked generated and downloads it."],
      ["XML", "On an invoice already generated. Downloads the saved file again."]
    ],
    after: "The setup is stored on the company. A generated file holds the invoice number, date and currency, your details, the customer's name, tax number and address from their contact record, each line's quantity, amount, name and the VAT rate of its own tax, and the VAT total broken down by rate. A copy is kept against the invoice, and from then on <span class='man-key'>Edit</span> on that invoice is refused, so what was issued cannot change. Nothing is posted to the ledger.",
    links: [
      { name: "Invoices", how: "Only posted customer invoices appear here; the 50 most recent are listed.", to: "inv.out" },
      { name: "Company Profile", how: "Holds the legal name, tax ID, country and address the setup starts from.", to: "settings.profile" },
      { name: "Customers", how: "The customer's name, tax number and address in the file come from their contact record.", to: "cust" }
    ],
    mistakes: [
      ["Could not edit: This invoice has been sent as an e-invoice, so it cannot change. Issue a credit note instead.", "Its e-invoice file was generated, so the invoice is locked. Add a credit note from the invoice and issue a new one."],
      ["No posted customer invoices yet.", "Drafts, credit notes and bills are not listed. Post the invoice first."],
      ["The invoice is not in the list", "Only the 50 most recent posted customer invoices are shown."],
      ["Download failed", "The browser refused the download. Allow downloads for Orbit, then click XML."]
    ],
    tips: [
      "Fill in each customer's tax number and address before generating: the file takes them from the contact."
    ]
  },

  "acc.payterms": {
    title: "Payment Terms",
    what: "<b>Payment terms</b> say how long a customer or supplier has to pay. This screen is the list of terms offered in the <b>Payment terms</b> field of a customer, vendor or contact: each term is a number of days and a label. The days chosen on a contact are what set the payment terms and due date on their invoices and bills.",
    when: [
      "Setting up a company, to offer the terms you actually trade on.",
      "A contract gives a customer or supplier special terms that are not in the list."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Configuration &rsaquo; Payment Terms</b>. For this example, a property management company adds terms for its maintenance contracts. If nothing has been saved yet you should see six standard terms, from Due on receipt to 90 days.",
      "Click <span class='man-key'>+ Add a term</span>. A new row appears with 30 days and an empty label.",
      "Type 60 in <b>Days</b> and <i>60 days (maintenance contracts)</i> in <b>Label</b>.",
      "Remove a term you never use, for example 45 days, with <span class='man-key'>&times;</span>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Payment terms saved</i>.",
      "Open a customer in <b>Accounting &rsaquo; Customers &rsaquo; Customers</b>. <b>Payment terms</b> now offers the new label. Choose it and save the customer.",
      "Start a new invoice and pick that customer. <b>Payment terms</b> on the invoice changes to Within 60 days and the <b>Due Date</b> becomes the invoice date plus 60 days."
    ],
    fields: [
      ["Days", "How many days after the document date payment is due. Left empty it is saved as 0.", "optional"],
      ["Label", "How the term reads on the contact form. Left empty it is saved as the number of days, for example <i>20 days</i>.", "optional"]
    ],
    buttons: [
      ["+ Add a term", "Adds a row with 30 days and an empty label."],
      ["&times;", "Removes the row when you next save."],
      ["Save", "Replaces this company's list with the rows on screen."]
    ],
    after: "The list is saved for this company and offered in <b>Payment terms</b> on the customer, vendor and contact form, which stores the chosen number of days on the contact. When that contact is picked on an invoice or bill, Orbit selects the matching option in the document's own <b>Payment terms</b> and works out the <b>Due Date</b>, which Aged Receivable, Aged Payable and Collections use. The document's own list only has Due on receipt, 15, 30, 45, 60 and 90 days and End of next month.",
    links: [
      { name: "Customers", how: "Each customer's Payment terms field offers this list.", to: "cust" },
      { name: "Vendors", how: "Each vendor's Payment terms field offers this list.", to: "vend" },
      { name: "Invoices", how: "Picking a customer sets the invoice's terms and due date from their days.", to: "inv.out" },
      { name: "Collections", how: "Overdue is counted from the due date.", to: "rep.collections" }
    ],
    mistakes: [
      ["A customer's terms do not fill the due date on an invoice", "Their days are not one of the invoice's own options (0, 15, 30, 45, 60 or 90). Choose the terms on the invoice by hand, or type the Due Date."],
      ["The standard six terms came back", "Every row was removed and saved. With no terms saved, the six standard ones are offered. Add at least one term of your own and save."],
      ["A term I removed still shows on a customer", "The customer keeps the days they were given, shown as that number of days. Choose another term on the customer and save."],
      ["Save failed: (message)", "The list could not be written, for example because your role cannot manage Accounting."]
    ],
    tips: [
      "Keep to 0, 15, 30, 45, 60 and 90 days where you can: those are the terms that fill due dates by themselves."
    ]
  },

  "rates": {
    title: "Exchange Rates",
    what: "The <b>exchange rates</b> list holds what one unit of each currency is worth in your organisation's reference currency (US dollars unless set otherwise), by date and type. Documents and vouchers in another currency are converted into your company's books with these rates. Rates are shared by every company in the organisation.",
    when: [
      "You invoice, buy or hold money in another currency and want today's rates.",
      "Your bank used a particular rate and you want the books to match it.",
      "Month end, to enter closing rates before FX Revaluation.",
      "A document or voucher says there is no rate for a currency on its date."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Configuration &rsaquo; Exchange Rates</b>. For this example, a trading company keeps its books in USD. You should see the newest rates first, with the last column headed <b>Rate (1 = ? USD)</b>.",
      "Click <span class='man-key'>Update from market</span>. You should see <i>Updated (number) currencies from the market</i> and a Spot and a Closing row for today for each currency.",
      "To enter your bank's month-end rate instead, click <span class='man-key'>New</span>.",
      "Choose <i>EUR - Euro</i> in <b>Currency</b> and set <b>Date</b> to 30 September 2026.",
      "Choose <b>Closing</b> in <b>Type</b> and type 1.1085 in <b>Rate</b>, because one euro is worth 1.1085 dollars.",
      "Click <span class='man-key'>Save</span>. You should see <i>Rate saved</i>.",
      "Click <span class='man-key'>Group By</span> and choose Currency to see the EUR rates together.",
      "A EUR invoice dated 2 October uses the latest Spot rate on or before that date, and FX Revaluation for 30 September uses this Closing rate."
    ],
    fields: [
      ["Currency", "The currency the rate is for, picked from the list. Starts on EUR.", "required"],
      ["Date", "The date the rate applies from. The latest rate on or before a document's date is used. Starts as today.", "auto"],
      ["Type", "Spot for everyday documents and vouchers, Closing for month-end revaluation and the balance sheet in Consolidation, Average for the profit and loss in Consolidation. Starts on Spot. When the type asked for is missing, the latest rate of any type is used.", "auto"],
      ["Rate", "How many units of the reference currency one unit of this currency is worth, for example 1.09 for 1 EUR = 1.09 USD. Must be more than zero.", "required"]
    ],
    buttons: [
      ["New", "Opens the New exchange rate window."],
      ["Update from market", "Fetches the day's market rates and saves a Spot and a Closing rate dated today for every currency Orbit lists and every currency your organisation uses. Running it again the same day updates the same rows."],
      ["Save", "Saves the rate and closes the window."],
      ["Cancel", "Closes the window without saving."],
      ["Delete", "In the window of a saved rate. Deletes it after a confirmation."],
      ["Group By (list)", "Groups rates by Currency or Type."]
    ],
    after: "Rates are used the moment a document needs them: an invoice or bill posts at the Spot rate on or before its date, a journal voucher line fills its rate from Spot when you choose its currency, FX Revaluation uses Closing, and Consolidation uses Closing and Average. Conversions go through the reference currency, so a company keeping its books in AED converting a EUR bill needs a rate for both EUR and AED. Changing a rate does not change documents already posted. Orbit also fetches the day's rates in the background once a day, when someone who manages Accounting is signed in.",
    links: [
      { name: "Invoices", how: "A foreign-currency invoice is converted at the Spot rate on its date.", to: "inv.out" },
      { name: "Journal Entries", how: "A foreign line's rate starts from the Spot rate on the voucher date.", to: "moves" },
      { name: "FX Revaluation", how: "Restates open foreign balances at the Closing rate.", to: "acc.revalue" },
      { name: "Consolidation", how: "Translates companies in other currencies with Closing and Average rates.", to: "rep.cons" }
    ],
    mistakes: [
      ["Enter a currency and a positive rate", "Rate is empty, zero or negative."],
      ["Rate service unavailable - please try again shortly", "The market rate service did not answer. Try again later, or type the rate with New."],
      ["Could not save: A record with Code EUR ... already exists. Use a different one.", "There is already a rate for that currency, date and type. Open that row and change it instead."],
      ["No FX rate for EUR on or before 2026-09-14 (type spot)", "Shown when posting a document: no rate of any type exists for that currency on or before its date. Add one, or click Update from market."],
      ["Amounts in the books are hugely wrong", "The rate was typed the wrong way round. It is always the value of one unit of the currency in the reference currency: for a currency worth much less than a dollar it is a small number such as 0.0000112."]
    ],
    tips: [
      "Enter Closing rates on the last day of each month you revalue.",
      "Because rates are shared across the organisation, a rate saved in one company is used by all of them."
    ]
  },

  "settings.lock": {
    title: "Period Lock",
    what: "A <b>period lock</b> closes the books up to a date, so nothing dated on or before it can be posted or reopened. Once a month or a year has been checked and reported, locking it keeps those figures from changing. The screen is a small window with one date, and it applies to the company you are in.",
    when: [
      "A month, quarter or year has been checked and its reports sent.",
      "Before handing figures to an accountant or an auditor.",
      "A correction has to go into a closed period, so the lock must be moved back for a moment."
    ],
    how: [
      "Finish the period first. For this example, a construction company closes June 2026: every June bill, invoice and voucher is posted, and <b>Data Health Check</b> shows no drafts left.",
      "Open <b>Accounting &rsaquo; Configuration &rsaquo; Period Lock</b>. A window titled <b>Period lock</b> and the company name opens.",
      "Set <b>Lock entries dated on or before</b> to 30 June 2026.",
      "Click <span class='man-key'>Save</span>. You should see <i>Locked on/before 2026-06-30</i>.",
      "Try to post a voucher dated 28 June. You should see <i>Period locked on/before 2026-06-30 - choose a later date</i>.",
      "A bill dated in June can still be saved as a draft, but <span class='man-key'>Confirm &amp; post</span> refuses it the same way.",
      "Click <span class='man-key'>Edit</span> on a posted June voucher. It is refused with <i>The books are closed up to 30 Jun 2026</i>.",
      "To reopen, open Period Lock again, clear the date and click <span class='man-key'>Save</span>. You should see <i>Unlocked</i>."
    ],
    fields: [
      ["Lock entries dated on or before", "The last day of the closed period. Leave it empty to unlock.", "optional"]
    ],
    buttons: [
      ["Save", "Saves the lock date for this company, or removes it when the date is empty."],
      ["Cancel", "Closes the window without changing the lock."]
    ],
    after: "From the moment you save, posting anything dated on or before the lock date is refused: journal vouchers, invoices and bills, bank statement lines, FX Revaluation and depreciation all post through the same check, and the Register Payment window checks the date too. Edit on a posted voucher, invoice or bill dated inside the period is refused as well. Drafts can still be saved, and entries already posted are not touched. The lock belongs to the company you are in; each company is locked separately.",
    links: [
      { name: "Journal Entries", how: "Posting and Edit are refused inside the locked period; Reverse posts today.", to: "moves" },
      { name: "Bills", how: "A bill dated inside the period cannot be posted or edited; a credit note with a later date corrects it.", to: "inv.in" },
      { name: "Invoices", how: "The same for customer invoices.", to: "inv.out" },
      { name: "Bank Statements", how: "A line dated inside the period cannot be reconciled.", to: "bank" },
      { name: "FX Revaluation", how: "Cannot run for a date inside the period.", to: "acc.revalue" },
      { name: "Data Health Check", how: "Shows drafts still waiting, worth clearing before you lock.", to: "rep.health" }
    ],
    mistakes: [
      ["Period locked on/before 2026-06-30 - choose a later date", "The document's date is inside the locked period. Use a later date, or move the lock back."],
      ["Could not post: Period locked on 2026-06-30", "The database refused a posting dated on or before the lock. Use a later date."],
      ["Could not edit: The books are closed up to 30 Jun 2026, and this entry is dated 15 Jun 2026. Reverse it with a later date instead.", "A posted voucher inside the period cannot go back to draft. Reverse it and post the correct voucher."],
      ["Could not edit: The books are closed up to 30 Jun 2026, and this bill is dated 12 Jun 2026. Issue a credit note with a later date instead.", "A posted bill or invoice inside the period cannot be edited. Use a credit note."],
      ["An asset shows a month as Posted but no depreciation reached the ledger", "Depreciation was posted while its date was locked. Record that month as a journal voucher dated after the lock."]
    ],
    tips: [
      "Lock only once the period's reports have been agreed: reopening is easy, but everyone relying on the figures should know.",
      "If you run several companies, switch to each one and lock it."
    ]
  },

  "fu.levels": {
    title: "Follow-up Levels",
    what: "<b>Follow-up levels</b> are the steps you take as an unpaid invoice gets later: a reminder, then a call, then a formal letter, then escalation. Each level has a name, how many days overdue it starts at, the action and suggested wording. The Collections report uses them to suggest the next step for every overdue invoice.",
    when: [
      "Setting up how your company chases late payers.",
      "Changing when a reminder becomes a call or a letter.",
      "Rewording the message staff use at a level."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Configuration &rsaquo; Follow-up Levels</b> and click <span class='man-key'>New</span>. For this example, a wholesale distributor sets up four steps.",
      "Type <i>Friendly reminder</i> in <b>Level name</b>, 7 in <b>Days overdue</b>, choose <b>Email reminder</b> in <b>Action</b> and type the reminder wording in <b>Message</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the level in the list.",
      "Add <i>Second notice</i> at 30 days with <b>Phone call</b>.",
      "Add <i>Final notice</i> at 60 days with <b>Formal letter</b>.",
      "Add <i>Legal</i> at 90 days with <b>Escalate / legal</b>. The list is sorted by days overdue.",
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Collections</b>. An invoice 45 days late shows <i>Second notice</i> under <b>Suggested</b>; hovering over the badge shows its message.",
      "After phoning the customer, click <span class='man-key'>Log follow-up</span> on that invoice to record the call."
    ],
    fields: [
      ["Level name", "What the step is called, for example Reminder, Warning or Final notice. It is the badge shown in Collections. Left empty it is saved as <i>Level</i>.", "optional"],
      ["Days overdue", "The number of days past the due date at which this level starts. Starts at 15 on a new level; left empty it is saved as 0.", "auto"],
      ["Action", "Email reminder, Phone call, Formal letter or Escalate / legal. In Collections, a legal level's badge is red and a letter's amber. Starts on Email reminder.", "auto"],
      ["Message", "Suggested wording for the reminder, shown when you hover over the badge in Collections.", "optional"]
    ],
    buttons: [
      ["New", "Opens a new follow-up level."],
      ["Save", "Saves the level and closes the window."],
      ["Cancel", "Closes the window without saving."],
      ["Delete", "In the window of a saved level. Deletes it after you confirm."]
    ],
    after: "Nothing is sent or posted. Collections looks at every posted customer invoice past its due date with money still owed, and suggests the level with the highest Days overdue that the invoice has reached. An invoice not yet late enough for your first level shows no suggestion.",
    links: [
      { name: "Collections", how: "Shows the suggested level for each overdue invoice and lets you log what you did.", to: "rep.collections" },
      { name: "Aged Receivable", how: "The same overdue invoices, grouped by how late they are.", to: "rep.aged.recv" },
      { name: "Payment Terms", how: "The terms set the due date that days overdue are counted from.", to: "acc.payterms" }
    ],
    mistakes: [
      ["No Suggested badge in Collections", "The invoice has not reached your lowest level's days overdue, or it is not posted, not past due, or already paid."],
      ["The wrong level is suggested", "Check the Days overdue of each level: the highest one the invoice has reached wins."]
    ],
    tips: [
      "Keep the message short and specific, so anyone chasing can read it off the badge."
    ]
  },

  "products": {
    title: "Products",
    what: "A <b>product</b> is anything you sell, buy, stock or serve: a material, a finished item, a dish, a service. Its record holds the name and codes, the unit, the sales price and cost, the accounts and taxes it posts with, how it is classified and measured, and, once saved, its supplier prices, extra barcodes, kit components and variants. The same list is used by Accounting, Sales, Purchase, Inventory and Kitchen, so a product is entered once.",
    when: [
      "You start selling, buying or stocking a new item or service.",
      "A price, cost, tax or unit changes.",
      "You want to compare what different suppliers charge for the same item.",
      "An item comes in variations, such as sizes and colours, or is sold as a kit of other items.",
      "An item is no longer used and should stop being offered."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Configuration &rsaquo; Products</b> (it is also <b>Inventory &rsaquo; Products &rsaquo; Products</b> and <b>Kitchen &rsaquo; Menu &rsaquo; Items</b>) and click <span class='man-key'>New</span>. For this example, a hardware shop adds a tube of clear silicone sealant.",
      "Type <i>Silicone sealant clear 300 ml</i> as the product name, and add a photo in the square beside it.",
      "Choose <b>Storable Product</b> in <b>Type</b> and <i>tube</i> in <b>Unit of Measure</b>.",
      "Choose <i>Sealants</i> in <b>Category</b> and type the supplier's own code, <i>SIL-300-CL</i>, in <b>Supplier code</b>.",
      "Type 6.50 in <b>Sales Price</b> and 3.20 in <b>Cost</b>. Choose your sales VAT in <b>Sales Tax</b> and your purchase VAT in <b>Purchase Tax</b>. Leave both accounts on Default.",
      "Under <b>Classification</b>, choose its Type and Subtype. If your classification tree has codes, <b>Item code</b> builds itself from them.",
      "Choose <b>Liquid (paint, sealant)</b> in <b>Material form</b>, then 300 in <b>Container size</b>, ml in <b>Unit</b> and 24 in <b>Batch size</b>. You should see <i>Counted in containers &middot; 1 container = 0.300 L in stock</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the product in the list; an item code built from the tree gets a running number such as -001.",
      "Open it again. Under <b>Suppliers &amp; prices</b>, choose the supplier, type 3.05 as the price, choose <i>each</i>, 24 as MOQ, 5 as lead days, and click <span class='man-key'>Add</span>. You should see <i>Supplier price added</i>; with two or more suppliers the cheapest is marked <i>best</i>.",
      "Click <span class='man-key'>Use</span> on a price to copy it into <b>Cost</b>, then click Save.",
      "The <b>On Hand</b> counter at the top reads 0 until stock is received.",
      "On a new invoice, pick the sealant: the line fills with 6.50 and your sales VAT."
    ],
    fields: [
      ["Product name", "What the item is called on every document and list.", "required"],
      ["Photo (beside the name)", "A picture or file for the item. It is the thumbnail in lists.", "optional"],
      ["Item code", "Your own code for the item. On a new product it is built from the codes of the classification you choose, with a running number added on save, until you type in it yourself. Shown as Reference in the list.", "auto"],
      ["Supplier code", "The supplier's own reference for the item. Products can be searched by it.", "optional"],
      ["Category", "The product category, from Product Categories.", "optional"],
      ["Type", "Service, Consumable or Storable Product. A new product starts as Service. A storable product shows the On Hand counter.", "auto"],
      ["Unit of Measure", "How the item is counted and stocked, such as m2, kg, tube or box, from Units of Measure. Needed for a Storable Product or a Consumable.", "required"],
      ["Sales Price", "The price of one unit before tax. It fills the price on sales lines.", "optional"],
      ["Cost", "What one unit costs you. The note under it says where the figure came from. Stock is valued with it when it moves, and it fills the price on bill lines. Typing a new cost records who typed it and when. On a saved product with no cost, the cheapest supplier price fills it.", "optional"],
      ["Status", "Active, or Archived to stop it being offered on documents while keeping its history.", "optional"],
      ["Income Account", "The income account a sales line for this product posts to. Default means the company's Default income account. Only income-type accounts are offered.", "optional"],
      ["Expense Account", "The expense account a bill line for this product posts to. Default means the company's Default expense account. Only expense-type accounts are offered.", "optional"],
      ["Sales Tax", "The tax filled on sales lines. Offers Sale and Both rates.", "optional"],
      ["Purchase Tax", "The tax filled on bill lines. Offers Purchase and Both rates.", "optional"],
      ["Shelf / bin location", "Where the item sits in the warehouse, for example Rack A-2.", "optional"],
      ["Weight per metre (kg)", "For bars and profiles: the maker's weight per metre. With Stock length it lets Recost from weight keep the cost up to date.", "optional"],
      ["Stock length (mm)", "The length one bar is bought in. Cost per bar is weight per metre times this length times the metal rate.", "optional"],
      ["Consignment stock", "Owned stock, or Consignment (supplier-owned until sold).", "optional"],
      ["Kit / bundle", "Simple item, or Kit - sold as one, made of components. A kit shows the Kit components panel.", "optional"],
      ["Family (brand), Series, Model", "Who makes it, from the Family tree in Classification. Each choice narrows the next list.", "optional"],
      ["Type, Subtype, Sub-subtype", "What the item is, from the Type tree in Classification.", "optional"],
      ["Material", "The substance it is made of. It sets the density used to work out weight.", "optional"],
      ["Colour", "For example RAL 9016. Earlier entries are suggested.", "optional"],
      ["Supplier (Material and attributes)", "A supplier name kept with the item's description. Earlier entries are suggested.", "optional"],
      ["Country of origin", "Where the item is made, for customs and tenders that ask for origin.", "optional"],
      ["Material form", "General item, Bar / profile, Sheet / plate, Liquid (paint, sealant) or Roll / coil. The choice shows the measurements for that shape and the note on how stock is counted.", "optional"],
      ["Measurements for the form", "Bar: Length per bar (m) and Weight (kg/m). Sheet: Width, Height, Thickness (mm) and Density. Glass: Configuration, Unit width and height, up to three panes and two cavities, and Ug. Liquid: Container size, Unit and Batch size. Roll: Roll length (m) and Roll weight (kg).", "optional"],
      ["Suppliers &amp; prices: supplier, price, basis, unit, MOQ, lead days, date", "On a saved product. One row per supplier's price; supplier and price are needed to add a row.", "optional"],
      ["Extra barcodes: barcode, label", "On a saved product. Other barcodes that also scan to this item; the barcode is needed.", "optional"],
      ["Kit components: component, Qty", "On a saved kit. The products it is made of and how many of each; a component is needed.", "optional"],
      ["Variants: axis and values", "On a saved product. An axis such as Colour with values such as Black, White.", "optional"],
      ["Custom fields", "Any fields your company added for products in Custom Fields. A required one must be filled before saving.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank product."],
      ["Save", "Saves the product and returns to the list."],
      ["Discard", "Returns to the list without saving."],
      ["QR label", "On a saved product. Opens a QR label for its barcode or item code, to print and stick on the shelf."],
      ["Delete", "On a saved product. Deletes it after a confirmation, unless it is used on an order, invoice or stock move."],
      ["On Hand", "On a storable product. Shows the quantity in stock and opens the Inventory overview."],
      ["Add (Suppliers &amp; prices)", "Saves the supplier price straight away, whether or not you click Save."],
      ["Use", "Copies that supplier's price into Cost. Click Save to keep it."],
      ["Add (Extra barcodes)", "Saves the barcode straight away."],
      ["Add (Kit components)", "Adds the component and quantity straight away."],
      ["&times; (in a panel)", "Removes that supplier price, barcode, component or axis after you confirm."],
      ["Add axis", "Saves a variant axis and its values."],
      ["Generate variants", "Creates one product for each combination of the axes, named with the combination, copying the type, unit, category, prices, taxes, accounts and classification. Combinations that already exist are skipped."],
      ["Link as variant", "Makes an existing product a variant of this one."],
      ["Open and Unlink (variants)", "Open a variant, or make it a standalone product again."],
      ["Filters and Group By (list)", "Filter to Active, Archived, No cost yet or Cost is an estimate; group by Family (brand), Series, Type, Subtype, Origin, Form or Goods / service."],
      ["Select, then Archive or Delete (list)", "Tick products to archive or delete them together. Reference, Name, Sales Price and Cost can also be changed by clicking the cell."]
    ],
    after: "An active product is offered wherever items are picked: invoice and bill lines, quotations and purchase orders, stock operations, the point of sale and Kitchen. Picking it fills the line's description, price or cost, and tax. When a document posts, a line with a product account posts there; otherwise the company's default income or expense account is used. Stock moves of a storable product are valued at its Cost, unless the move carries its own unit cost. Variants appear under their parent in the list. Archiving takes the product out of the pickers without touching documents that already use it.",
    links: [
      { name: "Invoices", how: "Picking a product fills a sales line's price and tax.", to: "inv.out" },
      { name: "Bills", how: "Picking a product fills a bill line's cost, account and tax.", to: "inv.in" },
      { name: "Quotations", how: "Order lines pick from the same products.", to: "so.list" },
      { name: "Purchase Orders", how: "Purchase lines pick from the same products.", to: "po.list" },
      { name: "Inventory Overview", how: "Where the On Hand quantity of storable products is shown.", to: "inv.onhand" },
      { name: "Units of Measure", how: "Supplies the Unit of Measure list.", to: "inv.uoms" },
      { name: "Product Categories", how: "Supplies the Category list.", to: "inv.cats" },
      { name: "Classification", how: "Builds the Family and Type trees, and their codes build the Item code.", to: "settings.classification" },
      { name: "Recost from weight", how: "Recalculates the cost of items with a weight per metre from a metal rate.", to: "inv.recost" },
      { name: "Taxes", how: "Supplies the Sales Tax and Purchase Tax lists.", to: "taxes" },
      { name: "Custom Fields", how: "Adds your own fields to the product form.", to: "settings.customfields" },
      { name: "Kitchen menus", how: "Kitchen lists products as Items.", to: "menu.list" }
    ],
    mistakes: [
      ["Name is required", "The product name is empty."],
      ["A stock item needs a unit of measure (UOM) so quantities are unambiguous.", "The Type is Storable Product or Consumable and no Unit of Measure is chosen. Pick one, or add it in Units of Measure first."],
      ["This product is used in transactions - set its Status to Archived instead.", "The product is on an order, invoice or stock move, so it cannot be deleted. Set Status to Archived and save."],
      ["Someone else changed this product while you had it open. Your changes were not saved - reload the page to get the latest version, then re-enter them.", "Another person saved the same product while you were editing. Reload, then make your change again."],
      ["Pick a supplier / Enter a price", "A supplier price was added without a supplier or a price."],
      ["Enter an axis name and at least one value", "Add axis was clicked with the axis name or its values empty. Values are separated by commas."],
      ["Suppliers &amp; prices, barcodes, kit components and variants are missing", "They appear only on a saved product. Save it, then open it again."],
      ["No classification tree yet.", "Nothing has been set up in Classification. Build the tree under Inventory, Configuration, Classification, then choose from it."]
    ],
    tips: [
      "Set Sales Tax, Purchase Tax and a Unit of Measure on every product: lines then fill themselves and quantities stay unambiguous.",
      "The No cost yet filter finds products whose margin and stock value would read as zero."
    ]
  },

  "companies": {
    title: "Companies",
    what: "A <b>company</b> is one set of books: its own chart of accounts, journals, taxes, contacts and documents. This list shows every company in your organisation, with subsidiaries tucked under their parent. Opening one lets you change its name, currency, country and parent, and choose the <b>Accounting accounts</b> and <b>Stock accounting</b> accounts that Orbit's automatic postings use.",
    when: [
      "You run another business, branch or subsidiary that needs its own books.",
      "Setting up a group, so a subsidiary sits under its parent.",
      "Your chart of accounts uses its own codes, and bills, invoices or stock must post to your accounts.",
      "A posting fails saying no payable, receivable, VAT or stock account is set.",
      "A company was created by mistake, or a restored backup copy is no longer needed."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Configuration &rsaquo; Companies</b> (also <b>Settings &rsaquo; Companies</b>) and click <span class='man-key'>New</span>. For this example, a property group adds its lettings subsidiary.",
      "Type <i>Harbour View Lettings</i> in <b>Company name</b> and <i>Harbour View Lettings Ltd</i> in <b>Legal name</b>.",
      "Choose <i>United Kingdom</i> in <b>Country</b>. If you have not picked a currency yourself, <b>Currency</b> changes to GBP.",
      "Choose the group's holding company in <b>Parent company</b>.",
      "Click <span class='man-key'>Create company</span>. You should see <i>Company created. Its accounting has been set up.</i> and the new company listed under its parent as a Subsidiary.",
      "Click the new company to open it. The window now shows <b>Accounting accounts</b>, <b>Stock accounting</b> and <b>Company logo &amp; documents</b>.",
      "Under <b>Accounting accounts</b>, check each pointer. On the chart Orbit set up they can stay as they are; if the company uses its own chart, choose its receivable account in <b>Customers owe us</b>, its payable account in <b>We owe suppliers</b>, and so on.",
      "Open <b>Stock accounting</b> and choose <b>Stock on hand</b>, <b>Cost of sales</b>, <b>Received not invoiced</b>, <b>Work in progress</b> and <b>Stock adjustment</b> if the company keeps stock.",
      "Add the company's logo under <b>Company logo &amp; documents</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>."
    ],
    fields: [
      ["Company name", "The trading name, shown in the company picker and on the list.", "required"],
      ["Legal name", "The registered name, shown in the list.", "optional"],
      ["Currency", "The currency the company keeps its books in. A new company starts with the current company's currency; choosing a country changes it to that country's currency, unless you picked one yourself.", "auto"],
      ["Country", "Where the company is registered. When a company is created, its country chooses the chart of accounts and the starting VAT rate.", "optional"],
      ["Parent company", "Another company in your organisation this one belongs to. It keeps its own books; the list shows it under the parent as a Subsidiary.", "optional"],
      ["Customers owe us", "Accounting accounts. The receivable account a customer invoice debits and a receipt credits. Empty means the account coded 4100.", "optional"],
      ["We owe suppliers", "Accounting accounts. The payable account a bill credits and a payment debits. Empty means the account coded 4000.", "optional"],
      ["VAT on sales", "Accounting accounts. Where the VAT on customer invoices posts. Empty means the account coded 4457.", "optional"],
      ["VAT on purchases", "Accounting accounts. Where the VAT on bills posts. Empty means the account coded 4456.", "optional"],
      ["Default income", "Accounting accounts. Used by an invoice line with no account of its own. Empty means the account coded 7000.", "optional"],
      ["Default expense", "Accounting accounts. Used by a bill line with no account of its own. Empty means the account coded 6000.", "optional"],
      ["Salaries payable", "Accounting accounts. Net pay owed to staff: a posted payslip credits it, and a Salary payment in Counter starts on it, so paying the salary clears what the payslip owes. There is no code to fall back on: while it is empty, payslips refuse to post and Counter asks you to choose the account.", "optional"],
      ["Stock on hand", "Stock accounting. What the warehouse is worth: a receipt debits it, a delivery credits it. Empty means the account coded 3100.", "optional"],
      ["Cost of sales", "Stock accounting. What goods cost you, charged when they leave. Empty means the account coded 6000.", "optional"],
      ["Received not invoiced", "Stock accounting. Holds the value of goods received until the supplier's bill arrives. Empty means the account coded 4700.", "optional"],
      ["Work in progress", "Stock accounting. Materials consumed by a production run until the finished item exists. Empty means the account coded 3500, which Orbit adds if it is missing.", "optional"],
      ["Stock adjustment", "Stock accounting. Where a count difference or a write-off is charged. Empty means the account coded 6500.", "optional"],
      ["Company logo &amp; documents", "The company's logo and any documents. Available once the company exists.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New company window."],
      ["Create company", "Creates the company and sets up its accounting."],
      ["Save", "Saves changes to an existing company."],
      ["Cancel", "Closes the window without saving."],
      ["Delete", "Deletes a company that holds no real data, after a confirmation. You cannot delete the company you are in."],
      ["Discard this restored copy", "Shown instead of Delete on a company created by restoring a backup. Removes that copy; the backup and the original company are untouched."]
    ],
    after: "Creating a company sets up its accounting: a chart of accounts (a template for its country where one exists), the Customer Invoices, Vendor Bills, Bank, Cash and Miscellaneous journals, its exchange gain and loss accounts, starting VAT rates and common currencies. The pointers are read every time Orbit posts: bills and invoices use Accounting accounts, and stock moves use Stock accounting. A change applies to postings from then on, and nothing already posted moves. Changing the currency changes only the setting; posted amounts are not converted.",
    links: [
      { name: "Company Profile", how: "The address, tax number, tagline and print settings of the company you are in.", to: "settings.profile" },
      { name: "Chart of Accounts", how: "The accounts the pointers choose from.", to: "accounts" },
      { name: "Taxes", how: "The VAT rates the company started with.", to: "taxes" },
      { name: "Bills", how: "Posting uses We owe suppliers, VAT on purchases and Default expense.", to: "inv.in" },
      { name: "Invoices", how: "Posting uses Customers owe us, VAT on sales and Default income.", to: "inv.out" },
      { name: "Inventory Overview", how: "Stock moves are valued into the Stock accounting accounts.", to: "inv.onhand" },
      { name: "Consolidation", how: "Adds group companies together into one set of reports.", to: "rep.cons" }
    ],
    mistakes: [
      ["Enter a company name", "Company name is empty."],
      ["Switch to another company first, then delete this one.", "You cannot delete the company you are working in. Pick another in the company picker, then delete it."],
      ["This company has 14 accounting entries - it can't be deleted (keep it, or export first).", "Only an empty company can be deleted. The same refusal names contacts, products, employees or cash movements. Keep the company."],
      ["No payable account is set for this company. Choose one in Settings, Companies, Accounting accounts.", "Neither the We owe suppliers pointer nor an account coded 4000 exists. Open the company and choose the account. The receivable message is fixed the same way with Customers owe us."],
      ["This document carries VAT but no sales VAT account is set. Choose one in Settings, Companies, Accounting accounts.", "Choose the account in VAT on sales. For bills, set VAT on purchases."],
      ["Stock saved, but no stock account is set for this company - Settings, Companies, Stock accounting", "The stock move was saved but not valued in the ledger: there is no Stock on hand pointer and no account coded 3100. Choose the account."],
      ["The Accounting accounts panel is missing", "The panels appear only when opening a company that already exists and has accounts."]
    ],
    tips: [
      "If your chart does not use Orbit's standard codes, set every pointer on day one, before the first bill or stock receipt.",
      "Choose the currency carefully when creating a company: changing it later does not convert anything already posted."
    ]
  }

});
