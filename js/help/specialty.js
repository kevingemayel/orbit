/* Orbit screen help: the specialty apps. Counter (the company cash desk),
 * Appoint (appointments), Events and Service (field service).
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

  "cash.desk": {
    title: "Cash Desk",
    what: "The <b>Cash Desk</b> is the front page of Counter, your company's cash desk. It shows every active cash account you hold (a till, a driver's pouch, a safe, a bank) with its balance, the total held in your company currency, and the last 15 movements. From here you record any money that comes in or goes out, to or from anyone, and move cash from one account to another. Every receipt and payment is numbered and posts to the ledger.",
    when: [
      "A customer pays you in cash, by card or by transfer, whether or not they have an invoice.",
      "You pay a supplier, a service provider, an employee or a one-off expense out of a till, a safe or the bank.",
      "The owner puts money into the business or takes some out.",
      "You want to see, at a glance, how much money is sitting in each till, safe and bank account."
    ],
    how: [
      "Open <b>Counter &rsaquo; Cash Desk</b>. For this example, a hardware shop's customer comes to the counter to pay 300.00 in cash towards two open invoices: INV/2026/0012 with 180.00 due and INV/2026/0015 with 200.00 due. If you see <i>No cash accounts yet</i>, click <span class='man-key'>+ Add your first cash account</span>, name it <i>Main till</i>, choose Kind Cash and click Save.",
      "Click <span class='man-key'>+ Money in</span>. You should see a green dialog headed <b>Money in (receipt)</b>.",
      "Leave <b>Type</b> on <i>Client receipt</i> and choose <i>Main till</i> in <b>Cash account</b>. Under it you should see <i>Money goes into:</i> and the ledger account the till posts to, for example 5300 Cash on hand. <b>Currency</b> shows the till's currency.",
      "Pick the customer in <b>On behalf of (customer)</b>. You should see a box headed <b>Apply to invoices</b> listing both open invoices with what is due on each.",
      "In <b>From (who is handing the money over)</b>, type the name of the person physically paying, for example the customer's driver.",
      "Type 300 in <b>Amount</b>. The customer hands over 320.00, so type 320 in <b>Cash tendered (optional)</b>. You should see 20 in <b>Change to give back</b>.",
      "Click <span class='man-key'>Auto</span> beside Apply to invoices. The oldest invoice takes 180.00 and the next takes 120.00, and the summary reads <i>Allocated 300.00 &middot; On account 0.00</i>.",
      "Leave <b>Method</b> on Cash, and type <i>Invoices 12 and 15</i> in <b>Memo</b>.",
      "Look at <b>Counter account (Account No.)</b>. For a Client receipt it starts on the company receivable account, and the line under it reads <i>Default from Settings, Companies: receivable account</i>. The note below says the amounts applied to invoices settle through that receivable account, and the Counter account applies only to any amount left over. Nothing is left over here, so leave it as it is.",
      "Click <span class='man-key'>Post receipt</span>. You should see <i>Posted Client receipt</i>, the Main till card up by 300.00, and a new line in Recent movements with a number such as <i>RCP/2026/0001</i> and +300.00 in green. Click that line to see the accounts it used, its JV numbers and every line of the accounting entry.",
      "Open Accounting and check the invoices: INV/2026/0012 is now Paid, and INV/2026/0015 is Partial with 80.00 still due.",
      "Later the same day you buy cleaning supplies for 25.00. Click <span class='man-key'>- Money out</span>, choose Type <i>Petty expense</i>, type <i>Corner hardware shop</i> in <b>On behalf of / party</b> and 25 in Amount. <b>Counter account</b> starts on the company expense account, and the line under it reads <i>Default from Settings, Companies: expense account</i>. To post it somewhere more precise, type that account's number and pick it from the list, then choose a line in <b>Auxiliary</b> if the account has any. Click <span class='man-key'>Post payment</span>. The till drops by 25.00 and the movement gets a number such as <i>PAY/2026/0001</i>."
    ],
    fields: [
      ["Type", "What kind of money this is. Money in offers Client receipt, Supplier refund, Owner capital in and Other income. Money out offers Supplier payment, Service provider, Maintenance, Salary, Salary advance, Owner drawing, Petty expense and Other payment. The type decides who you pick below and which account the other side of the entry goes to (see What it changes).", "required"],
      ["Cash account", "The till, pouch, safe or bank the money goes into or comes out of. Only active cash accounts are listed. Under it, <i>Money goes into</i> (or <i>Money comes out of</i>) shows the ledger account it posts to, as set in Posts to (GL account) in Counter, Configuration, Cash Accounts. A cash account with no ledger account says so in red and cannot post. A bank account posts in the Bank journal, a cash account in the Cash journal. The Currency follows the cash account.", "required"],
      ["On behalf of (customer) or (supplier)", "Shown for Client receipt and Supplier refund (a customer or a supplier from Contacts) and for Supplier payment (a supplier). Picking one for a Client receipt or Supplier payment lists their open invoices or bills so you can apply the money. Left empty, the movement is still posted but tagged to nobody.", "optional"],
      ["Employee", "Shown for Salary and Salary advance. The employee being paid, from Employees. For Salary, picking one lists their confirmed payslips under Settle a document.", "optional"],
      ["Owner or On behalf of / party", "Shown for Owner capital in, Owner drawing and the other types. A free-text name that is kept on the movement and printed on the receipt.", "optional"],
      ["From (who is handing the money over) or To (who is receiving it)", "The person or company physically handing over or taking the cash, which can differ from the party it is for. Start typing to pick an existing contact, or type any name.", "optional"],
      ["Amount", "How much changed hands, in the Currency beside it. It must be more than zero.", "required"],
      ["Currency", "The currency of the money. It starts at the Cash account's currency and follows it when you change the account. A foreign-currency movement is converted into the company currency at that date's rate from Exchange Rates.", "optional"],
      ["Cash tendered (optional)", "Money in only. What the customer actually handed over, when it is more than the amount. Kept on the movement and printed on the receipt.", "optional"],
      ["Change to give back", "Money in only. Cash tendered minus the Amount, worked out as you type.", "auto"],
      ["Date", "The day the money moved. It decides the date of the ledger entry and the exchange rate, and cannot be on or before a locked period. Starts at today.", "required"],
      ["Method", "How it was paid, from your list in Payment Methods (or Cash, Bank transfer, Cheque and Card if that list is empty). Kept on the movement and printed on the receipt.", "optional"],
      ["Apply to invoices or Apply to bills", "Shown for a Client receipt or Supplier payment once a customer or supplier is picked. Type how much goes to each open document, or click Auto to fill the oldest first. You cannot apply more to a document than is due on it. Whatever is not applied is recorded on account. If they have nothing open you see that the amount will be recorded on account.", "optional"],
      ["Split across payment methods (part cash, part card...)", "Up to three method and amount pairs, for a customer paying part cash and part card. Two or more filled pairs must add up to the Amount. Every line posts to the cash account's ledger account. A split is always recorded on account: it cannot be combined with amounts applied to invoices.", "optional"],
      ["Settle a document", "Shown for Salary when the employee has confirmed payslips. Choosing one fills the Amount with its net pay and marks the payslip paid when you post.", "optional"],
      ["Counter account (Account No.)", "The account in your chart of accounts that the other side of the entry posts to: where the money came from or what it paid for. Type the account number or name and pick it from the list of active main accounts. It starts on a default, and the line under it says where that came from: Client receipt uses the receivable account, Supplier payment and Supplier refund the payable account, Other income the income account, Service provider, Maintenance and Petty expense the expense account, and Salary the salaries payable account that payslips post net pay to, all from Settings, Companies. Owner capital in, Owner drawing, Salary advance and Other payment start on the standard chart's account (1000, 1010, 4080 and 4700) only when your chart has it; otherwise the field is empty and you must choose. You can always change it. When money is applied to invoices or bills, those amounts settle through the company receivable or payable account on the document, and the Counter account applies only to the amount left over.", "required"],
      ["Auxiliary", "Offered as soon as the Counter account is chosen, when that account has auxiliaries. For an account with sub-accounts, for example 6011.02 under 6011, it lists them: leave it on None to post to the main account, or choose one and the entry posts to the auxiliary instead. For an account whose auxiliaries are contacts, such as 4011 Suppliers, 4111 Clients or 4515 Other partners, it lists your contacts and starts on the customer or supplier picked above: the entry posts to the account and keeps that contact on its line, so the movement shows on the contact's statement. Which kind an account uses is set in Accounting, Chart of Accounts.", "optional"],
      ["Reference", "A cheque or transfer number. Printed on the receipt.", "optional"],
      ["Memo", "What the money is for. It becomes the description of the ledger entry and prints on the receipt.", "optional"],
      ["From, To, Amount, Date and Purpose (Handover dialog)", "The same dialog as Counter, Handovers, New. See the Handovers page.", "optional"]
    ],
    buttons: [
      ["+ Add your first cash account", "Shown only while the company has no cash accounts. Opens the New cash account dialog."],
      ["+ Money in", "Opens the receipt dialog with the money-in types."],
      ["- Money out", "Opens the payment dialog with the money-out types."],
      ["Handover", "Opens a new handover, to move cash from one of your accounts to another. It needs at least two active cash accounts."],
      ["Auto", "Applies the Amount to the open invoices or bills, oldest first, until it runs out."],
      ["Post receipt or Post payment", "Checks the figures, numbers the movement, posts it to the ledger and closes the dialog."],
      ["Cancel", "Closes the dialog without recording anything."]
    ],
    after: "Posting numbers the movement (RCP for money in, PAY for money out, in the format set in Document Numbering), adds it to the cash account's balance and writes the ledger with only the two accounts the dialog showed: the cash side is the cash account's <b>Posts to (GL account)</b>, shown under Cash account, and the other side is the <b>Counter account</b>, or its auxiliary when one is chosen. Orbit never picks an account on its own, and refuses to post while either one is missing.<br><b>Client receipt</b> and <b>Supplier payment</b>: each part applied to an invoice or bill is paid exactly as Register Payment on the document would pay it, with the cash side in the cash account's ledger account and the other side in the company receivable or payable account, so each document becomes Partial or Paid. Each settlement is its own journal entry. The rest is one balanced entry against the Counter account, tagged to the customer or supplier, with a payment record on account that shows on their statement.<br><b>Supplier refund</b>: a balanced entry against the Counter account, tagged to the supplier, with a payment record on account. It does not match any bill.<br><b>Every other type</b>: one balanced entry between the cash account and the Counter account. <b>Salary</b> also marks a chosen payslip paid.<br>The entries go into the Cash journal for a cash account and the Bank journal for a bank account. A split payment is one entry: a line for each method in the cash account's ledger account, against the Counter account for the whole amount. Open the movement in Movements to see every JV number and every line of the entry.",
    links: [
      { name: "Movements", how: "Every receipt and payment, where you reprint a receipt or void a mistake.", to: "cash.moves" },
      { name: "Handovers", how: "Cash moved between your own accounts, waiting to be confirmed.", to: "cash.handovers" },
      { name: "Daily Close", how: "Count a till against the balance shown here and post any difference.", to: "cash.close" },
      { name: "Cash Accounts", how: "The tills, safes and banks the desk shows, and the ledger account each one posts to.", to: "cash.accounts" },
      { name: "Payment Methods", how: "The list offered in Method.", to: "cash.methods" },
      { name: "Customer Invoices", how: "A Client receipt applied to an invoice pays it, making it Partial or Paid.", to: "inv.out" },
      { name: "Bills", how: "A Supplier payment applied to a bill pays it.", to: "inv.in" },
      { name: "Customer Payments", how: "Each settlement and each amount on account creates a payment record listed there.", to: "pay.in" },
      { name: "Vendor Payments", how: "The same for money paid to suppliers.", to: "pay.out" },
      { name: "Statement of Account", how: "Receipts and payments on a customer or supplier appear on their statement.", to: "rep.stmt" },
      { name: "Payslips", how: "A Salary movement can settle a confirmed payslip.", to: "hr.slips" },
      { name: "Exchange Rates", how: "Needed for any movement or balance in another currency.", to: "rates" },
      { name: "Period Lock", how: "No movement can be dated on or before the lock date.", to: "settings.lock" }
    ],
    mistakes: [
      ["Add a cash account first", "The company has no active cash account. The New cash account dialog opens: create one, then click Money in or Money out again."],
      ["Enter an amount", "The Amount is empty or zero. Type what changed hands."],
      ["You allocated more than the amount", "The figures typed against invoices or bills add up to more than the Amount. Lower them, or raise the Amount."],
      ["The split payment must add up to the amount", "Two or more split lines are filled and their total differs from the Amount. Correct a line or the Amount."],
      ["Could not post: No exchange rate for (currency) &rarr; (company currency) on (date). Add it in Accounting first, then post.", "The movement is in another currency and there is no rate for that date. Add the rate in Exchange Rates and post again."],
      ["The cash account (name) has no ledger account. Set Posts to (GL account) on it in Counter, Configuration, Cash Accounts, then post again.", "Orbit does not know which ledger account holds this till's money, and the dialog also says so in red under Cash account. Open Counter, Configuration, Cash Accounts, open the account, choose it in Posts to (GL account), Save, and post again."],
      ["Choose the Counter account: the account the other side of this entry posts to.", "The Counter account is empty, usually because the type has no default: Settings, Companies has no account of that kind set, or your chart has no account with the standard code. Type the account number or name and pick it from the list."],
      ["No account has the code or name (text). Pick the Counter account from the list.", "What was typed in Counter account matches no account in your chart. Pick a line from the list that appears as you type."],
      ["The Counter account cannot be the cash account's own ledger account. Choose the account the money comes from or goes to.", "Both sides of the entry would be the same account, so nothing would be recorded. Choose the income, expense or partner account instead."],
      ["(document) has (amount) due. Apply no more than that to it, and leave the rest on account.", "More was typed against one invoice or bill than it still owes. Lower that figure; whatever is not applied is recorded on account."],
      ["A split payment is recorded on account and cannot settle invoices. Clear the amounts applied, or use a single method.", "Amounts are applied to invoices or bills and the split lines are filled too. Clear one or the other."],
      ["Could not post: Period locked on (date)", "The Date falls in a closed period. Use a later date, or ask whoever closed the period to reopen it in Period Lock."],
      ["Some balances can't be converted to (currency) yet", "A cash account in another currency has no rate for today, so its balance is left out of Total held, which then shows (partial). Add today's rate in Exchange Rates."],
      ["The Money in, Money out and Handover buttons are missing", "Your role can view Counter but not record in it. Ask an administrator for manage rights on Counter."]
    ],
    tips: [
      "The Currency starts on the cash account's currency. Change it only when the money handed over is in another currency; Orbit converts it at that day's rate.",
      "Every part of a receipt or payment, including the parts applied to invoices or bills, posts its cash side to the ledger account shown under Cash account.",
      "To check where a movement went in the books, open it from Recent movements or Movements: it shows the cash account, the Counter account, each JV number and every line of the entry.",
      "A cash account's balance here is its opening balance plus posted movements, confirmed handovers and the variance of every Daily Close, in the account's own currency. A pending handover does not count yet."
    ]
  },

  "cash.moves": {
    title: "Movements",
    what: "<b>Movements</b> is the full register of every receipt and payment recorded at the Cash Desk, newest first. Each line shows the date, number, type, party and the amount in or out, and a voided one is marked (void). Opening one shows the receipt together with where it went in the books: the cash account and Counter account it used, its JV numbers and every line of the accounting entry. From there you can edit it, print it, or void a movement that should never have been recorded.",
    when: [
      "A customer asks for a copy of their receipt, or a supplier wants a payment voucher.",
      "You need to see which accounts a receipt or payment was posted to, and its JV number.",
      "A movement was recorded with the wrong amount, date, customer or account and needs correcting.",
      "A movement should never have been recorded at all and needs undoing.",
      "You want to see everything that came in or went out, by type or by month, or export it to a spreadsheet."
    ],
    how: [
      "Open <b>Counter &rsaquo; Movements</b>. For this example, a shop recorded a Client receipt of 300.00 against the wrong customer and needs to correct it.",
      "Type the number, for example <i>RCP/2026/0004</i>, or the customer's name in <b>Search</b>. Use <span class='man-key'>Filters</span> and choose Money in to see only receipts.",
      "Click the line. You should see a dialog headed <b>Receipt RCP/2026/0004</b> with +300.00 in green and the date, type, who it was on behalf of, who handed it over, the method and the memo.",
      "Under <b>Accounts</b> you should see <b>Received into</b> (the till and its ledger account), <b>Counter account</b>, and <b>JV number</b>. Under <b>Accounting entry</b> you should see every line of the entry with its account, description, debit and credit. Click a JV number to open that entry in Accounting.",
      "Back in Movements, open the line again and click <span class='man-key'>Edit</span>. You should see the dialog <b>Edit receipt RCP/2026/0004</b> filled in as the movement was.",
      "Choose the right customer in <b>On behalf of (customer)</b>, click <span class='man-key'>Auto</span> to apply the 300.00 to their open invoices, check <b>Counter account</b>, and click <span class='man-key'>Save changes</span>.",
      "You should see <i>Saved RCP/2026/0004</i>. Open the line again: the number is the same, the JV numbers are new, <b>Reversals</b> lists the entries that undid the old version, and <b>History</b> reads <i>Edited on</i> (date and time) <i>by</i> (your email) with the amount and JV numbers it had before.",
      "The first customer's invoices show the money as owing again, and the right customer's are Partial or Paid.",
      "If a movement should never have been recorded, open it, click <span class='man-key'>Void</span> and confirm instead. The dialog then says <i>This movement was voided</i>, the Edit and Void buttons are gone, and the till balance drops by the amount.",
      "To give the customer a copy, open the line and click <span class='man-key'>Print receipt</span>. You should see a page headed RECEIPT with your company name, the number, the amount received, the cash tendered and change given, and signature lines for Received by and Cashier."
    ],
    fields: [
      ["No.", "The movement number, RCP for money in and PAY for money out. An edit keeps the number.", "auto"],
      ["Date", "The date the money moved, as entered when it was posted.", "auto"],
      ["Type", "The kind chosen when it was posted, such as Client receipt or Petty expense.", "auto"],
      ["On behalf of", "The customer, supplier, employee or name the money was for.", "auto"],
      ["From or To", "The person who physically handed over or received the money.", "auto"],
      ["Method, Reference and Memo", "How it was paid, the cheque or transfer number, and what it was for.", "auto"],
      ["Tendered / change", "Money in only, when cash tendered was recorded.", "auto"],
      ["Received into or Paid out of", "The cash account and the ledger account it posts to, as set in Cash Accounts.", "auto"],
      ["Counter account", "The account the other side of the entry was posted to, with its auxiliary underneath when one was chosen. A movement recorded before this field existed says it was not recorded; its entry below still shows every account used.", "auto"],
      ["JV number or JV numbers", "The journal entries the movement made: one for a plain movement, one for each invoice or bill it settled, and one for any amount on account. Click a number to open that entry in Accounting.", "auto"],
      ["Reversals", "Entries that reversed an earlier version when the movement was edited, or the whole movement when it was voided. Click one to open it.", "auto"],
      ["Accounting entry", "Every line of the movement's entries: JV, account code and name, description, debit and credit, with the totals in the company currency.", "auto"],
      ["Applied to invoices or Applied to bills", "The documents the movement settled and how much went to each, and any amount recorded on account.", "auto"],
      ["History", "One line for each edit: when it was made, by whom, and the amount and JV numbers the movement had before.", "auto"]
    ],
    buttons: [
      ["Filters", "Money in or Money out."],
      ["Group By", "Groups the list by Type or by Month."],
      ["Columns", "Choose which columns show, add a field, or reset the layout."],
      ["Select", "Tick lines to export only those."],
      ["Export", "Downloads the list as a CSV file that opens in Excel."],
      ["A JV number", "Closes the dialog and opens that journal entry in Accounting."],
      ["Edit", "Shown on a posted movement that is not void, to users who can manage Counter or Accounting. Opens it in the Money in or Money out dialog, filled in, so you can correct any field. See What it changes."],
      ["Save changes", "In the Edit dialog. Reverses the old version and posts the new one on the same movement."],
      ["Void", "Shown on a movement that is not voided, to users who can manage Counter or Accounting. Reverses it: see What it changes."],
      ["Print receipt", "Prints a RECEIPT (money in) or PAYMENT VOUCHER (money out), or saves it as a PDF from the print window."],
      ["&#8249; and &#8250;", "Beside the movement number when you opened it from this list. Step to the previous or next movement in the list's order, with its search and filters, without closing the dialog. Alt and the left or right arrow key do the same."],
      ["Close", "Closes the receipt dialog."]
    ],
    after: "Voiding posts a reversing entry for each ledger entry the movement made, dated today, with the reference VOID/ followed by the number. It removes the payment records the movement created and restores the amount still due on every invoice or bill it settled, which go back to Not paid or Partial. The movement is marked void, so it no longer counts in the cash account's balance, but it stays in this list.<br>Saving an edit first reverses everything the old version posted, exactly as Void does, with the reference EDIT/ followed by the number. It then posts the new values on the same movement, which keeps its number, and adds the old version to History. If the new version cannot post once the old one has been reversed, for example because its date is in a locked period, Orbit voids the movement and tells you, so the books and the movement never disagree: record it again from the Cash Desk.",
    links: [
      { name: "Cash Desk", how: "Where movements are recorded. This list has no New button.", to: "cash.desk" },
      { name: "Journal Entries", how: "Each JV number opens its entry there.", to: "moves" },
      { name: "Customer Invoices", how: "A voided or edited Client receipt makes the invoices it paid owing again.", to: "inv.out" },
      { name: "Customer Payments", how: "The payment records a movement created are removed when it is voided or edited.", to: "pay.in" },
      { name: "Statement of Account", how: "The reversal also shows on the customer's or supplier's statement.", to: "rep.stmt" }
    ],
    mistakes: [
      ["Could not void: Period locked on (date)", "The reversal is dated today and today is inside a locked period. Ask whoever set the lock to move it in Period Lock."],
      ["Already voided", "The movement was voided already, for example in another tab. Close the dialog and refresh the list."],
      ["The old version was reversed but the new one could not be posted: (reason). The movement is now void; record it again.", "The edit reversed the old entries, then the new version failed, for example on a locked date or a missing exchange rate. The movement is void and the books hold neither version. Fix the cause and record it again with Money in or Money out."],
      ["Could not save: Orbit could not reverse the old version: (reason) Nothing new was posted. Try again: anything already reversed is skipped.", "Undoing the old version stopped part way, often because today is in a locked period. Fix the cause and click Save changes again, or void the movement."],
      ["Could not save: Only a posted movement that is not void can be edited. Close the dialog and refresh the list.", "Someone voided the movement while you were editing it. Refresh the list to see it as it is now."],
      ["Your role cannot open Accounting, so the journal entry cannot be shown here.", "Clicking a JV number opens Accounting, which your role cannot view. The Accounting entry table in the dialog shows the same lines."],
      ["The Edit and Void buttons are missing", "The movement is void, or your role cannot manage Counter or Accounting. Ask an administrator for manage rights."],
      ["There is no New button", "Movements are only recorded from the Cash Desk, with Money in or Money out."]
    ],
    tips: [
      "Voiding a Salary movement sets the payslip it paid back to confirmed, so it can be paid again. Editing one does the same, and the new version marks it paid again when it still settles it.",
      "Edit rather than void and re-record when only a detail is wrong: the movement keeps its number, and History shows what changed.",
      "A voided movement is never deleted, so the numbering has no gaps and the history shows what happened."
    ]
  },

  "cash.handovers": {
    title: "Handovers",
    what: "A <b>handover</b> moves cash from one of your own cash accounts to another: a driver's pouch emptied into the safe, a till float topped up, takings taken to the bank. It is recorded in two steps. The person handing over creates it, and it stays Pending until the receiving side confirms the money arrived. Only a confirmed handover moves the balances and posts to the ledger.",
    when: [
      "A driver or collector brings back the day's cash and gives it to whoever keeps the safe.",
      "Takings leave a till for the safe or the bank.",
      "A till needs a float from the safe at the start of a shift."
    ],
    how: [
      "Open <b>Counter &rsaquo; Handovers</b> and click <span class='man-key'>New</span> (the <span class='man-key'>Handover</span> button on the Cash Desk opens the same dialog). For this example, a delivery business's driver brings back 1,500.00 of collections to be locked in the safe.",
      "Choose <i>Driver pouch</i> in <b>From</b> and <i>Safe</i> in <b>To</b>.",
      "Type 1500 in <b>Amount</b>, leave <b>Date</b> on today and type <i>End of round deposit</i> in <b>Purpose</b>.",
      "Click <span class='man-key'>Create</span>. You should see <i>Handover created - the receiver confirms it</i> and a line with a number such as <i>HO/2026/0001</i> and the status Pending. The balances on the Cash Desk have not changed yet.",
      "When the safe keeper has counted the money, they open the line. You should see the dialog <b>Handover HO/2026/0001</b> with the details greyed out and <i>Status: pending</i>.",
      "They click <span class='man-key'>Confirm received</span>. You should see <i>Handover confirmed</i>, the status Confirmed, and on the Cash Desk the pouch 1,500.00 lower and the safe 1,500.00 higher.",
      "If the money never arrived, open the pending line and click <span class='man-key'>Cancel it</span> instead. The status becomes Cancelled and nothing is posted."
    ],
    fields: [
      ["From", "The cash account the money leaves. Only active cash accounts are listed. It must differ from To.", "required"],
      ["To", "The cash account that receives the money.", "required"],
      ["Amount", "How much is handed over, in the currency the two accounts hold. It must be more than zero, and both accounts must hold the same currency.", "required"],
      ["Date", "The day of the handover, and the date of the ledger entry when it is confirmed. Starts at today.", "optional"],
      ["Purpose", "Why the money moved, for example supplier run, return or deposit. It is added to the ledger entry's description.", "optional"],
      ["No. and Status", "The number (HO) given when the handover is created, and Pending, Confirmed or Cancelled.", "auto"]
    ],
    buttons: [
      ["New", "Starts a new handover."],
      ["Create", "Saves the handover as Pending. Nothing moves yet."],
      ["Confirm received", "Shown on a pending handover. Posts it and moves the balances."],
      ["Cancel it", "Shown on a pending handover. Marks it Cancelled without posting anything."],
      ["Close", "Closes the dialog."],
      ["Search, Columns, Select and Export", "Find a handover, choose the columns, and download the list as a CSV file."]
    ],
    after: "Confirming posts one balanced entry in the Miscellaneous journal, dated the handover date, with the handover number as its reference: the To account's ledger account is debited and the From account's is credited (each cash account's Posts to account, which the dialog names under From and To before you confirm). From then on the Cash Desk counts the handover in both balances. Creating and cancelling change nothing in the books.",
    links: [
      { name: "Cash Desk", how: "Shows the balances a confirmed handover moves, and has its own Handover button.", to: "cash.desk" },
      { name: "Cash Accounts", how: "The accounts you hand money between, and the ledger account each posts to.", to: "cash.accounts" },
      { name: "Daily Close", how: "Count the receiving account after the handover to prove it arrived in full.", to: "cash.close" }
    ],
    mistakes: [
      ["You need at least two cash accounts for a handover", "There is only one active cash account. Add the other one in Cash Accounts, or switch it back to Active."],
      ["From and To must differ", "The same account is chosen on both sides. Change one of them."],
      ["Enter an amount", "The Amount is empty or zero."],
      ["&quot;(account)&quot; holds (currency) and &quot;(account)&quot; holds (currency), so a handover cannot move money between them.", "The two accounts hold different currencies, so nothing was created. Record a Money out from one and a Money in to the other on the Cash Desk, which records the exchange."],
      ["Could not confirm: Cross-currency handovers aren't supported. Use Money out from &quot;(account)&quot; then Money in to &quot;(account)&quot; so the exchange is recorded.", "An older pending handover is between accounts of different currencies, or one account's currency was changed since. Cancel it and record a Money out from one and a Money in to the other on the Cash Desk."],
      ["Could not confirm: No exchange rate for (currency) to (company currency) on (date). Add the rate in Accounting, Exchange Rates, then confirm again.", "The two accounts hold a currency other than the company currency and there is no rate for the handover date. Add the rate and confirm again."],
      ["Could not confirm: The cash account \"Driver pouch\" has no ledger account. Set Posts to (GL account) on it in Counter, Configuration, Cash Accounts, then confirm again.", "Orbit does not guess a ledger account for a till or pouch, and the dialog says so in red before you confirm. Open Cash Accounts, set Posts to (GL account) on that account, Save, and confirm the handover again."],
      ["Could not confirm: Period locked on (date)", "The handover date is inside a locked period. Cancel it and create it again with a later date, or ask for the period to be reopened in Period Lock."]
    ],
    tips: [
      "A handover cannot be edited once created. To change it, cancel it and create a new one.",
      "Orbit does not check who clicks Confirm received, so agree as a team that only the person receiving the cash confirms it.",
      "A handover is recorded in the currency the two accounts hold. When that is not the company currency, the ledger entry is converted at the handover date's rate, and the Cash Desk moves both balances by the amount typed."
    ]
  },

  "cash.close": {
    title: "Daily Close",
    what: "<b>Daily Close</b> is where you count the money physically in a till, pouch or safe and compare it with what Orbit expects to be there. Saving signs the count, keeps the notes and coins you counted, and posts any difference to the over/short account shown in the dialog (6900 Cash over/short by default) so the ledger matches what is really in the drawer. The list keeps every count with its expected, counted and variance figures.",
    when: [
      "At the end of a shift or a trading day, before the till is emptied.",
      "When a cashier hands over to the next one and both want to agree the figure.",
      "When you suspect cash is missing and want a signed count on record."
    ],
    how: [
      "Open <b>Counter &rsaquo; Daily Close</b> and click <span class='man-key'>New</span>. For this example, a cafe closes its main till at the end of the day. You should see the dialog <b>Count &amp; close</b>.",
      "Choose <i>Main till</i> in <b>Cash account</b>. <b>Expected (system)</b> fills itself with the till's balance, say 1245.50.",
      "Open <b>Count by denomination (optional)</b>. On the first row type 20 in Value and 50 in Qty; its Total shows 1,000.00. Then 10 and 20, 4 and 10, and 5 and 1. <b>Counted (physical)</b> fills itself with 1245.00.",
      "You should see <i>Variance: -0.50 (short)</i> under the figures.",
      "Leave <b>Date</b> on today and type <i>Coin short, counted twice</i> in <b>Note</b>.",
      "Click <span class='man-key'>Close &amp; sign</span>. You should see <i>Closed - variance of</i> (currency) <i>-0.50 posted to 6900 Cash over/short</i> and a new line showing Expected 1,245.50, Counted 1,245.00 and Variance -0.50 in red. The Main till card on the Cash Desk now shows 1,245.00, so the next count expects what you counted.",
      "On a day the count matches, the message is <i>Counted and closed</i> and the variance shows 0.00 in green."
    ],
    fields: [
      ["Cash account", "The till, pouch, safe or bank you are counting. Only active cash accounts are listed.", "required"],
      ["Expected (system)", "The account's balance as the Cash Desk shows it now, in the account's own currency: opening balance plus posted movements, confirmed handovers and the variances of earlier counts. You cannot type in it.", "auto"],
      ["Counted (physical)", "What you actually counted. Filled from the denomination rows when you use them, and you can type over it.", "required"],
      ["Value and Qty (Count by denomination)", "One row per note or coin: its value and how many you have. Each row's Total is worked out, and the rows add up into Counted. Four rows are ready; click + Add row for more.", "optional"],
      ["Over/short account", "The account a difference posts to. It starts on 6900 Cash over/short where your chart has that account, and says so under the field; otherwise it is empty and must be chosen when the count differs. The line under it also names the cash account's ledger account, the other side of the entry.", "optional"],
      ["Date", "The date of the count, and of the over/short entry. Starts at today.", "optional"],
      ["Note", "Anything that explains a difference.", "optional"],
      ["Variance", "Counted minus Expected. Shown as over, short or matches while you type, and stored with the count.", "auto"]
    ],
    buttons: [
      ["New", "Opens the Count &amp; close dialog."],
      ["+ Add row", "Adds another denomination row."],
      ["Close &amp; sign", "Saves the count as closed and signed now, and posts any variance."],
      ["Cancel", "Closes the dialog without saving."],
      ["Search, Columns, Select and Export", "Find a count by account or date, choose the columns, and download the list as a CSV file."]
    ],
    after: "When there is a difference, Orbit first posts one balanced entry in the Cash journal (the Bank journal for a bank account), dated the count date, with the reference CASHCOUNT/ and the date: money over debits the cash account's ledger account and credits the over/short account; money short debits the over/short account and credits the cash account. For an account in another currency the difference is converted into the company currency at the count date's rate. The count is then saved as closed with the time it was signed and the denominations, and its variance is added to the cash account's balance on the Cash Desk, so the next Expected equals what you counted. The over/short account shows in your profit and loss.",
    links: [
      { name: "Cash Desk", how: "Expected is the balance the Cash Desk shows for that account.", to: "cash.desk" },
      { name: "Movements", how: "When a count is short, look through the day's movements for one recorded wrongly.", to: "cash.moves" },
      { name: "Cash Accounts", how: "The ledger account the over/short posts against.", to: "cash.accounts" },
      { name: "Chart of Accounts", how: "Holds 6900 Cash over/short, the default over/short account, and any account you choose instead.", to: "accounts" }
    ],
    mistakes: [
      ["Add a cash account first", "The company has no active cash account to count. Add one in Cash Accounts."],
      ["Enter the counted amount", "Counted (physical) is empty. Type the total or fill the denomination rows."],
      ["The count was not saved because the over/short could not post: (reason). Fix that, then close again.", "The difference could not reach the ledger, for example because the date is in a locked period, so nothing was saved and the dialog stays open. Change the date or have the period reopened, then click Close &amp; sign again."],
      ["No exchange rate for (currency) to (company currency) on (date), so the difference cannot post.", "The cash account holds another currency and there is no rate for the count date. Add it in Exchange Rates, then click Close &amp; sign again."],
      ["The cash account \"Main till\" has no ledger account, so the difference cannot post.", "Nothing was saved. Set Posts to (GL account) on the cash account in Cash Accounts, then count and close again."],
      ["Choose the over/short account the difference posts to.", "The count differs and Over/short account is empty, because your chart has no 6900 account. Pick the account from the list, then Close &amp; sign again."]
    ],
    tips: [
      "Expected is the balance right now, whatever Date you choose, so count before any of the next day's money is recorded.",
      "A count cannot be opened or changed after saving. Count carefully before clicking Close &amp; sign.",
      "The over/short entry corrects both the ledger and the Cash Desk balance, so the next Expected figure starts from what you counted.",
      "Every figure in the dialog and the list is in the cash account's own currency; only the ledger entry is converted into the company currency."
    ]
  },

  "cash.accounts": {
    title: "Cash Accounts",
    what: "A <b>cash account</b> is any place your company holds money: a till, a driver's pouch, a safe or a bank account. Each has a kind (cash or bank), a currency, the ledger account it posts to and an opening balance. The Cash Desk shows one card per active cash account, and every receipt, payment, handover and count belongs to one.",
    when: [
      "You start using Counter and need your tills, safes and bank accounts set up.",
      "A new till, driver or bank account starts holding money.",
      "A till is retired, or the ledger account a cash account posts to must change."
    ],
    how: [
      "Open <b>Counter &rsaquo; Configuration &rsaquo; Cash Accounts</b> and click <span class='man-key'>New</span>. For this example, a delivery business gives a new driver a pouch holding a 200.00 float. You should see the dialog <b>New cash account</b>.",
      "Type <i>Driver pouch</i> in <b>Name</b>.",
      "Leave <b>Kind</b> on Cash and <b>Currency</b> on the company currency.",
      "In <b>Posts to (GL account)</b>, choose the account in your chart that this pouch posts to, for example 5300 Cash on hand. Orbit does not pick one for you, and Money in and Money out refuse a cash account with none set.",
      "Type 200 in <b>Opening balance</b> and leave <b>Active</b> on Active.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the line in the list with Kind Cash and Opening 200.00.",
      "Open the Cash Desk. You should see a Driver pouch card showing 200.00.",
      "When the driver leaves, open the line, set Active to Off and click Save. The pouch disappears from the Cash Desk and from every dialog, but stays in this list with its history."
    ],
    fields: [
      ["Name", "How the account appears on the Cash Desk and in every list, for example Main till, Safe or the bank's name.", "required"],
      ["Kind", "Cash or Bank. Movements into a bank account post in the Bank journal, into a cash account in the Cash journal.", "optional"],
      ["Currency", "The one currency this account holds. Balances are kept in it, and converted into the company currency for Total held.", "optional"],
      ["Posts to (GL account)", "The ledger account that moves when money goes in or out, shown in Money in and Money out as Money goes into or Money comes out of. Only accounts of the cash and bank type are offered. Orbit does not choose one for you: until it is set, the account can be saved but Money in and Money out refuse to post through it.", "required"],
      ["Opening balance", "The money already in the account when you start using Counter. It starts the balance on the Cash Desk.", "optional"],
      ["Active", "Active, or Off to hide the account from the Cash Desk and the dialogs without losing its history.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New cash account dialog."],
      ["Save", "Saves the account."],
      ["Delete", "Shown when editing. Deletes the account only if it has never been used by a movement or handover."],
      ["Cancel", "Closes the dialog without saving."],
      ["Search, Columns, Select and Export", "Find an account, choose the columns, and download the list as a CSV file."]
    ],
    after: "Saving a cash account posts nothing to the ledger, and neither does its opening balance: that figure only starts the balance the Cash Desk shows. From then on Kind and Posts to decide where the account's receipts, payments, handovers and count differences post.",
    links: [
      { name: "Cash Desk", how: "One card per active cash account, with its balance.", to: "cash.desk" },
      { name: "Chart of Accounts", how: "Where the cash and bank accounts offered in Posts to are kept.", to: "accounts" },
      { name: "Exchange Rates", how: "An account in another currency needs rates for its balance to count in Total held.", to: "rates" },
      { name: "Handovers", how: "Moving money between two cash accounts needs at least two active ones.", to: "cash.handovers" }
    ],
    mistakes: [
      ["Enter a name", "The Name is empty."],
      ["This account has (number) movement(s)/handover(s) and can't be deleted. Switch it to Off instead.", "The account has history, which must be kept. Set Active to Off and Save."],
      ["Posts to (GL account) offers only (not set)", "Your chart has no account of the cash and bank type. Add one in the Chart of Accounts first."],
      ["Money in or Money out says the cash account has no ledger account", "Posts to (GL account) is not set on this cash account. Open it here, choose the account and Save, then post again."]
    ],
    tips: [
      "If a float is not in your books yet and the owner put it in, record it on the Cash Desk with Money in, type Owner capital in, rather than as an opening balance, so the ledger and the desk agree.",
      "Give each person who carries cash their own account. A count or a handover then shows exactly whose money is short."
    ]
  },

  "cash.methods": {
    title: "Payment Methods",
    what: "<b>Payment Methods</b> is the list of ways money changes hands that Counter offers in <b>Method</b> and in the split-payment lines: cash, a card terminal, a transfer, a mobile wallet, a cheque. Each method has a name and a kind. The name is printed on receipts; the kind records how the money was paid.",
    when: [
      "You start using Counter and want the methods your customers really use.",
      "You add a card terminal or a mobile payment service.",
      "A method is no longer accepted and should stop appearing."
    ],
    how: [
      "Open <b>Counter &rsaquo; Configuration &rsaquo; Payment Methods</b> and click <span class='man-key'>New</span>. For this example, a shop adds its card terminal and a mobile wallet. You should see the dialog <b>New payment method</b>.",
      "Type <i>Card terminal</i> in <b>Name</b>, choose <i>card</i> in <b>Kind</b>, leave <b>Active</b> on Active and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the line in the list.",
      "Click New again, type <i>Mobile wallet</i>, choose <i>online</i> and Save.",
      "Add <i>Cash</i> with the kind <i>cash</i> the same way, so cash is still offered.",
      "Open the Cash Desk and click Money in. You should see only your active methods in <b>Method</b>.",
      "To stop offering a method, click <span class='man-key'>Select</span> in the list, tick it and click <span class='man-key'>Archive</span>, or open it and set Active to Off."
    ],
    fields: [
      ["Name", "What the method is called in Method, on the movement and on the printed receipt.", "required"],
      ["Kind", "cash, bank, cheque, card, online or other. It describes how the money was paid. On a split payment every line, whatever its kind, posts to the ledger account of the cash account chosen in the dialog.", "optional"],
      ["Active", "Active, or Off to stop offering it without deleting it.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New payment method dialog."],
      ["Save", "Saves the method."],
      ["Cancel", "Closes the dialog without saving."],
      ["Select", "Tick methods to export, archive or delete them together."],
      ["Archive", "After Select. Switches the ticked methods Off."],
      ["Delete", "After Select. Removes the ticked methods for good."],
      ["Search, Columns and Export", "Find a method, choose the columns, and download the list as a CSV file."]
    ],
    after: "Saving a method changes nothing in the books. A movement stores the method's name as text, so renaming, archiving or deleting a method leaves past movements and receipts as they were.",
    links: [
      { name: "Cash Desk", how: "Method and the split-payment lines in Money in and Money out use this list.", to: "cash.desk" },
      { name: "Movements", how: "Each movement shows the method it was paid by.", to: "cash.moves" }
    ],
    mistakes: [
      ["Enter a name", "The Name is empty."],
      ["Method still offers Cash, Bank transfer, Cheque and Card after I archived everything", "When no method is active, Counter offers those four so a movement can still be recorded. Add or reactivate at least one method."]
    ],
    tips: [
      "On a split payment every method posts to the same cash account's ledger account. To keep card or transfer takings apart from the till, record them with Money in into a bank cash account instead."
    ]
  },

  "appt.cal": {
    title: "Calendar",
    what: "The <b>Calendar</b> is the front page of Appoint, the app for businesses that book time with people: clinics, physiotherapists, lawyers, coaches, salons. It shows your bookings as an agenda from today onwards, as a week or as a single day, with the time, the client, the service, the staff member and the status. From here you add a booking, open one to change it, and bill it once the work is done. The words on the screen follow Appoint Settings, so a clinic sees Patients where a salon sees Clients.",
    when: [
      "At the start of the day, to see who is coming and when.",
      "A client phones or walks in to book, move or cancel an appointment.",
      "An appointment has happened and you want to mark it completed and bill it."
    ],
    how: [
      "Open <b>Appoint &rsaquo; Calendar</b>. For this example, a physiotherapy clinic books a new patient for an initial assessment at 10:00 next Tuesday, priced at 60.00.",
      "Click <span class='man-key'>Week</span>, then the right arrow to reach next week. You should see seven columns, Monday to Sunday, with any bookings as small cards.",
      "Click <span class='man-key'>+ New appointment</span>. You should see the dialog <b>New appointment</b>.",
      "In <b>Patient</b> (the word follows your settings), choose <i>+ New patient</i> and type the full name in <b>New patient name</b>. For an existing patient, just pick the name.",
      "Choose <i>Initial assessment</i> in <b>Service</b>. <b>Duration (min)</b> changes to the service's 45, and <b>Price</b> takes the service's price if it is still 0.",
      "Choose the physiotherapist in <b>Staff</b>, and set <b>Starts</b> to next Tuesday at 10:00.",
      "Leave <b>Status</b> on Booked, type 60 in Price if needed, and add <i>Left knee pain after running</i> in <b>Notes</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the booking on Tuesday at 10:00. If that physiotherapist already has a booking overlapping that time, Orbit first asks <i>Heads up: this time already has 1 appointment for this staff member. Book anyway?</i>",
      "On Tuesday, after the session, click the card, change Status to <i>Completed</i> and Save.",
      "Open it again and click <span class='man-key'>Bill</span>. You should see <i>Invoiced INV/2026/0031 - collect it in Counter or Accounting</i>, and the button now reads Billed."
    ],
    fields: [
      ["Client (named as in Settings, for example Patient)", "Who the booking is for, from your customers. Choose + New to add a customer by name without leaving the dialog.", "required"],
      ["New client name", "Shown after choosing + New. The full name; a customer contact is created with it when you save.", "required"],
      ["Service", "What is being booked, from the active services in Services. It fills the duration, and the price when the price is still 0.", "required"],
      ["Staff", "Who will see the client, from Employees. Leave on (any / me) if it does not matter. When a staff member is chosen, the overlap check only looks at their bookings.", "optional"],
      ["Starts", "The date and time the appointment begins.", "required"],
      ["Duration (min)", "How long it lasts. Filled from the service and used to work out the end time; 60 if left empty.", "auto"],
      ["Status", "Booked, Confirmed, Completed, Cancelled or No-show. Cancelled bookings are ignored by the overlap check and the client file counts completed visits and no-shows.", "optional"],
      ["Price", "What the appointment costs. Bill uses the saved price.", "optional"],
      ["Notes", "Anything for this appointment. It shows under the booking in the client's history.", "optional"]
    ],
    buttons: [
      ["Agenda, Week and Day", "Switch the view. Agenda lists everything from today on; Week and Day show one week or one day."],
      ["Previous, Today and Next arrows", "In Week and Day, move back, return to the current week or day, or move forward."],
      ["+ New appointment", "Opens the booking dialog. Hidden if your role can only view Appoint."],
      ["Save", "Checks for overlapping bookings, then saves. A new booking gets a number such as APT/2026/0001."],
      ["Delete", "On an existing booking. Asks to confirm, then deletes it."],
      ["Bill", "On a saved booking not yet billed. Creates and posts a customer invoice for its price. It then shows as Billed."],
      ["Cancel", "Closes the dialog without saving."]
    ],
    after: "Saving a booking changes nothing in the books. <span class='man-key'>Bill</span> creates a customer invoice for the client, dated today and due today, with one untaxed line named after the service and the appointment date at the saved price, and posts it, so it shows in what customers owe and on the client's statement. The booking is linked to the invoice so it cannot be billed twice. Collect the money on the Counter Cash Desk with a Client receipt, or with Register Payment on the invoice.",
    links: [
      { name: "Appointments", how: "The same bookings as a searchable list with filters.", to: "appt.list" },
      { name: "Clients", how: "Every client's file, history and notes. Book from a file with Book appointment.", to: "appt.clients" },
      { name: "Services", how: "The list offered in Service, with duration, price, capacity and buffer.", to: "appt.services" },
      { name: "Settings", how: "The words used on this screen, reminders and the public booking link.", to: "appt.settings" },
      { name: "Customer Invoices", how: "Bill creates a posted invoice there.", to: "inv.out" },
      { name: "Cash Desk", how: "Take the payment for a billed appointment with Money in, type Client receipt.", to: "cash.desk" },
      { name: "Employees", how: "The staff offered in Staff.", to: "hr.emp" }
    ],
    mistakes: [
      ["Pick a client (or add a new one)", "No client is chosen. The word matches your settings, for example Pick a patient. Choose one, or + New."],
      ["Choose a service", "Service is empty. Every booking needs a service; add one in Services if the list is empty."],
      ["Enter the new client name", "You chose + New but left the name empty."],
      ["Pick a start time", "Starts is empty."],
      ["Heads up: this time already has (number) appointment(s) ... Book anyway?", "Not an error: other bookings overlap this time (including the service's buffer) and there are as many as the service's capacity allows. Click OK to book anyway or Cancel to pick another time."],
      ["Set a price on it first", "Bill needs a saved price above zero. Type the price, Save, then Bill."],
      ["This appointment has no client", "Bill needs a client on the saved booking. Choose one, Save, then Bill."],
      ["Could not bill: No receivable account is set for this company. Choose one in Settings, Companies, Accounting accounts.", "Orbit does not know which account holds what customers owe. Set it, then check Customer Invoices for the draft invoice this attempt left, delete it, and Bill again."]
    ],
    tips: [
      "Availability hours are used by the public booking page. Bookings you make here are not checked against them.",
      "Bill uses the saved price and client, so Save your changes before clicking it.",
      "Marking a booking Cancelled rather than deleting it keeps it in the client's history and frees the time for others."
    ]
  },

  "appt.list": {
    title: "Appointments",
    what: "<b>Appointments</b> lists every booking the business has ever made, newest first, with when it is, the client, the service, the status and the price. It is the place to search for a booking, filter the upcoming, completed or cancelled ones, and export them. Opening one shows the same dialog as the Calendar, where you change, delete or bill it.",
    when: [
      "A client asks when their next appointment is, or when they last came.",
      "At the end of the week, to find completed appointments that still need billing.",
      "You want a spreadsheet of bookings for a period."
    ],
    how: [
      "Open <b>Appoint &rsaquo; Appointments</b>. For this example, a law firm checks that every completed initial consultation this month has been billed.",
      "Click <span class='man-key'>Filters</span> and choose <i>Completed</i>. You should see only completed bookings.",
      "Type <i>Initial consultation</i> in <b>Search</b> to narrow it to that service.",
      "Click the first line. You should see the dialog <b>Edit meeting</b> (the word follows your settings) with the client, service, time, status and price.",
      "If it shows <span class='man-key'>Bill</span> rather than Billed, check the Price, say 150.00, and click Bill. You should see <i>Invoiced INV/2026/0044 - collect it in Counter or Accounting</i>.",
      "Repeat for the other lines. Those already invoiced show a greyed-out Billed button.",
      "Click <span class='man-key'>Export</span> to download the filtered list as a CSV file."
    ],
    fields: [
      ["Client (named as in Settings)", "Who the booking is for; + New adds a customer by name.", "required"],
      ["New client name", "Shown after choosing + New.", "required"],
      ["Service", "What is booked, from the active services. Fills the duration and, when the price is 0, the price.", "required"],
      ["Staff", "Who sees the client, or (any / me).", "optional"],
      ["Starts", "The date and time it begins.", "required"],
      ["Duration (min)", "How long it lasts; filled from the service.", "auto"],
      ["Status", "Booked, Confirmed, Completed, Cancelled or No-show.", "optional"],
      ["Price", "What it costs; Bill uses the saved price.", "optional"],
      ["Notes", "Anything for this appointment.", "optional"]
    ],
    buttons: [
      ["New", "Opens a new booking. Hidden if your role can only view Appoint."],
      ["Filters", "Upcoming (from now on, not cancelled), Completed or Cancelled."],
      ["Columns, Select and Export", "Choose columns, tick lines and download them as a CSV file."],
      ["Save", "Checks for overlaps and saves the booking."],
      ["Delete", "Deletes the booking after you confirm."],
      ["Bill", "Creates and posts a customer invoice for the saved price. Shown as Billed afterwards."],
      ["Cancel", "Closes the dialog without saving."]
    ],
    after: "Changing a booking changes nothing in the books. Bill posts a customer invoice for the client at the saved price, dated and due today, which then counts in what customers owe and on their statement, and links it to the booking.",
    links: [
      { name: "Calendar", how: "The same bookings by day and week.", to: "appt.cal" },
      { name: "Clients", how: "The client's file shows all their bookings as a history.", to: "appt.clients" },
      { name: "Customer Invoices", how: "Where billed appointments are invoiced.", to: "inv.out" },
      { name: "Cash Desk", how: "Collect the payment with a Client receipt.", to: "cash.desk" }
    ],
    mistakes: [
      ["Pick a client (or add a new one)", "No client chosen. Pick one or + New."],
      ["Choose a service", "Service is empty."],
      ["Pick a start time", "Starts is empty."],
      ["Set a price on it first", "Bill needs a saved price above zero."],
      ["Could not bill: (reason)", "The invoice could not be posted, for example because no receivable account or sales journal is set, or the date is in a locked period. Fix the cause, delete the draft invoice the attempt left in Customer Invoices, then Bill again."]
    ],
    tips: [
      "Upcoming hides cancelled bookings, so it is the quickest check of the days ahead."
    ]
  },

  "appt.clients": {
    title: "Clients",
    what: "<b>Clients</b> lists your customers with their email and phone. Opening one opens their <b>file</b>: the record your practice keeps on the person (called Patient file, Matter, Client card and so on in Settings), their alerts, every appointment and note as one history, and a form for writing a visit note in the shape your profile uses. The screen's name follows your settings, so a clinic sees Patients.",
    when: [
      "Before seeing someone, to read their alerts, summary and last notes.",
      "After a visit, to write the consultation, session or attendance note.",
      "To update what is known about a client, record consent, or book their next appointment."
    ],
    how: [
      "Open <b>Appoint &rsaquo; Clients</b> (Patients for a clinic). For this example, a physiotherapist opens a patient's file after their first session.",
      "Click the patient's name. You should see the file: a <i>Confidential</i> banner (for health, legal and therapy profiles), the name with the file number such as <i>PT-0001</i>, and counts of upcoming appointments, visits, no-shows, billed and last seen.",
      "The banner says <i>No consent recorded yet</i>. In the Record block, set <b>Consent given on</b> to today.",
      "Fill the file's fields from your profile, for example <b>Site of problem</b> <i>Left knee</i>, <b>Pain score out of 10</b> 6, and <b>Patient goals</b> <i>Run 10 km again</i>.",
      "In <b>Precautions</b> type <i>No deep heat, recent surgery</i>. Separate several with commas.",
      "Choose the physiotherapist in <b>Seen by</b>, leave <b>File status</b> on Active, and write a one-line <b>Summary</b>.",
      "Click <span class='man-key'>Save the file</span>. You should see <i>Patient file saved</i>, a red Precautions chip at the top, and Consent recorded with today's date in the banner.",
      "On the right, choose today's appointment in <b>About which appointment</b>, then fill the treatment note: Subjective, Objective, Assessment, Plan and home exercise.",
      "Click <span class='man-key'>Save the treatment note</span>. You should see the note at the top of <b>History</b>, under today's date.",
      "Click <span class='man-key'>Book appointment</span> to book the next session: the booking dialog opens with the patient already chosen."
    ],
    fields: [
      ["File fields (sections from your profile)", "The fields your profile set up, grouped in sections, such as Identity, Injury and Cover for physiotherapy or Matter and Compliance for a law firm. Add, change or remove them in Settings, Custom fields, under Appoint: the client file. A field marked required there must be filled before the file saves.", "optional"],
      ["Alerts (named by your profile, for example Allergies and alerts or Precautions)", "What anyone opening the file must see first, separated by commas. Each one shows as a red chip at the top of the file.", "optional"],
      ["Seen by", "The staff member who normally sees this client, or (anyone).", "optional"],
      ["File status", "Active, Discharged or Closed.", "optional"],
      ["Consent given on", "Only for sensitive profiles (medical, dental, legal, therapy, physiotherapy, nutrition). The date the client consented to you holding and processing the record. The banner shows it.", "optional"],
      ["Summary", "The paragraph anyone opening the file should read first.", "optional"],
      ["About which appointment", "Ties the note to one of the client's last 20 appointments, or Not tied to one.", "optional"],
      ["Note parts (from your profile)", "The parts of a visit note, such as Subjective, Objective, Assessment and Plan for a clinic, or Who was present, What was discussed and Advice given for a law firm. At least one part must be written.", "required"],
      ["File number", "Given the first time the file is opened: your file number prefix, a dash and the next number, for example PT-0001.", "auto"]
    ],
    buttons: [
      ["New", "On the list. Opens the booking dialog, where + New adds a client while booking them."],
      ["Save the file", "Saves the fields, alerts, Seen by, status, consent and summary."],
      ["Save the (note name)", "Saves the visit note to the history."],
      ["Book appointment", "Opens the booking dialog with this client chosen."],
      ["Statement", "Opens the client's Statement of Account in Accounting."],
      ["Print", "Prints the file as it is on screen."],
      ["A booking in History", "Click it to open that booking's dialog."]
    ],
    after: "The file and notes are records only; they change nothing in the books. The client is an ordinary customer contact, so their invoices, payments and statement live in Accounting, and anyone added here also appears in Contacts. The billed figure on the file is the total price of their completed appointments.",
    links: [
      { name: "Calendar", how: "Book appointment adds to it.", to: "appt.cal" },
      { name: "Settings", how: "The profile decides the file's sections, the alerts label and the note parts, and the file number prefix.", to: "appt.settings" },
      { name: "Custom fields", how: "Add, rename or remove the file's fields under Appoint: the client file.", to: "settings.customfields" },
      { name: "Statement of Account", how: "The Statement button opens it for this client.", to: "rep.stmt" },
      { name: "Contacts", how: "Clients are customer contacts, so their details are edited there too.", to: "contacts" }
    ],
    mistakes: [
      ["This file has no fields yet", "No profile has been applied. Pick a profile in Appoint, Configuration, Settings with Set up this profile ticked, then add your own fields in Settings, Custom fields."],
      ["Write something first", "Every part of the note is empty. Write at least one part."],
      ["Could not save: (reason)", "The file or note could not be saved, for example because a required custom field is empty. Fill it and save again."],
      ["A customer who never booked is in the list", "The list shows every customer of the company, not only those who booked."]
    ],
    tips: [
      "Record consent before storing anything sensitive: the banner stays red until you do.",
      "The history puts appointments and notes together, newest first, which is how a file is usually read."
    ]
  },

  "appt.services": {
    title: "Services",
    what: "<b>Services</b> is the list of what clients can book: a consultation, a cut and colour, a private session, a court attendance. Each service has a duration, a price, where it happens, how many bookings may overlap and a buffer after it. Choosing a service on a booking fills its duration and price, and the public booking page offers your services to clients.",
    when: [
      "You start using Appoint and want the treatments, sessions or meetings you actually sell.",
      "A price or a duration changes.",
      "You stop offering something."
    ],
    how: [
      "Open <b>Appoint &rsaquo; Configuration &rsaquo; Services</b> and click <span class='man-key'>New</span>. For this example, a hair salon adds a colour and cut that takes two hours and costs 85.00. You should see the dialog <b>New service</b>.",
      "Type <i>Colour and cut</i> in <b>Name</b>.",
      "Type 120 in <b>Duration (min)</b> and 85 in <b>Price</b>.",
      "Leave <b>Where</b> on In person and <b>Default staff</b> on (any).",
      "Leave <b>Capacity</b> at 1, because one stylist can colour one client at a time, and type 15 in <b>Buffer after (min)</b> to leave time to clean the chair.",
      "Leave <b>Active</b> on Active and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the line with Duration 120 min, Where In person and Price 85.00.",
      "Open the Calendar and click + New appointment. Choose Colour and cut in Service: Duration (min) changes to 120 and Price to 85.",
      "If a profile added services with a price of 0.00, open each one, type its price and Save."
    ],
    fields: [
      ["Name", "What the client books, as it shows in the booking dialog, on the invoice line and on the public booking page.", "required"],
      ["Duration (min)", "How long it takes. It fills Duration on a booking and sets the length of the times offered on the public booking page. 60 if left empty.", "optional"],
      ["Price", "What it costs. A booking takes it when the booking's own price is still 0, and Bill invoices the booking's price.", "optional"],
      ["Where", "In person, Online or Phone. Copied onto each booking made for the service.", "optional"],
      ["Default staff", "Who usually delivers it, from Employees, or (any). It is kept on the service; choosing the service on a booking does not fill Staff.", "optional"],
      ["Capacity", "How many bookings may overlap before Orbit warns you, for example 8 for a group class. On the public booking page, a time is refused once that many bookings of this service overlap it. 1 if left empty.", "optional"],
      ["Buffer after (min)", "Extra minutes after each booking that count as busy when Orbit checks a new booking for overlaps.", "optional"],
      ["Active", "Active, or Off to remove it from the booking dialog.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New service dialog."],
      ["Save", "Saves the service."],
      ["Cancel", "Closes the dialog without saving."],
      ["Search, Columns, Select and Export", "Find a service, choose the columns, and download the list as a CSV file."]
    ],
    after: "Saving a service changes nothing in the books. Its price only reaches the ledger when a booking for it is billed from the Calendar or Appointments.",
    links: [
      { name: "Calendar", how: "The booking dialog offers active services and fills duration and price from them.", to: "appt.cal" },
      { name: "Availability", how: "The public booking page cuts your opening hours into slots the length of the service.", to: "appt.avail" },
      { name: "Settings", how: "Applying a profile adds its usual services here.", to: "appt.settings" },
      { name: "Employees", how: "The list offered in Default staff.", to: "hr.emp" }
    ],
    mistakes: [
      ["Enter a name", "The Name is empty."],
      ["Choose a service, when booking, but the list is empty", "No service is active. Add one here, or switch one back to Active."]
    ],
    tips: [
      "There is no Delete here: set a service you no longer offer to Off.",
      "Switching a service Off takes it out of the booking dialog and off the public booking page, and a client who still has the page open cannot book it."
    ]
  },

  "appt.avail": {
    title: "Availability",
    what: "<b>Availability</b> holds the business's weekly opening hours: which days you can be booked, and from what time to what time. The public booking page uses them to offer times to clients. There is one set of hours for the whole business, with one start and one end per day.",
    when: [
      "You switch on the public booking link and clients need to see real times.",
      "Your opening hours change, for example summer hours or a new late evening."
    ],
    how: [
      "Open <b>Appoint &rsaquo; Configuration &rsaquo; Availability</b>. For this example, a personal trainer works 07:00 to 19:00 on weekdays and 08:00 to 12:00 on Saturday. You should see seven rows, Monday to Saturday and then Sunday.",
      "Tick Monday and set the times to 07:00 and 19:00. Do the same for Tuesday to Friday.",
      "Tick Saturday and set 08:00 and 12:00.",
      "Leave Sunday unticked.",
      "Click <span class='man-key'>Save hours</span>. You should see <i>Hours saved</i>, and the ticks stay as you set them when the page reloads.",
      "Open your public booking link, choose the 60-minute Private session and pick a Saturday. You should see 8:00 AM, 9:00 AM, 10:00 AM and 11:00 AM. A Sunday shows <i>No times available on that day. Try another date.</i>"
    ],
    fields: [
      ["Day (Monday to Sunday)", "Tick the days you can be booked. An unticked day offers no times.", "optional"],
      ["Start time", "When bookings may begin on that day. A day that was never set shows 09:00.", "optional"],
      ["End time", "When the last booking must have finished. A day that was never set shows 17:00.", "optional"]
    ],
    buttons: [
      ["Save hours", "Replaces the business's hours with the ticked days and their times."]
    ],
    after: "Saving hours changes nothing in the books. The public booking page offers, for the chosen date, times starting at the day's start time and repeating every service duration (at least every 15 minutes), as long as the booking finishes by the end time and has not already passed.",
    links: [
      { name: "Settings", how: "Where the public booking link is switched on and copied.", to: "appt.settings" },
      { name: "Services", how: "A service's duration decides how the day is cut into times.", to: "appt.services" },
      { name: "Calendar", how: "Bookings made here in Orbit are not held to these hours.", to: "appt.cal" }
    ],
    mistakes: [
      ["Could not save: (reason)", "The hours could not be saved. Check your connection, then click Save hours again, because the old hours were cleared first."],
      ["No times available on that day. Try another date.", "Shown on the public booking page. The day is not ticked, every time that day has passed, or the service is longer than the day's hours."],
      ["Sorry, that time is no longer available. Please choose another slot.", "Shown on the public booking page. The time is still offered, but as many bookings of that service as its capacity already overlap it. The client must choose another time."]
    ],
    tips: [
      "The times offered do not hide slots that are already booked. The booking is refused when the client confirms, so keep Capacity accurate on each service.",
      "Only whole-business hours are kept: there are no separate hours per staff member."
    ]
  },

  "appt.settings": {
    title: "Settings",
    what: "Appoint <b>Settings</b> fits the app to your kind of practice. Choosing a <b>profession</b> sets the words used everywhere (Patient or Client, Appointment, Session or Meeting), the name and number prefix of the file you keep on each person, and can add the usual services and file fields. Here you also switch on the <b>public booking link</b> that lets clients book themselves, and email reminders before each appointment.",
    when: [
      "The first time you use Appoint.",
      "You want clients to book online without phoning.",
      "You want clients reminded by email the day before."
    ],
    how: [
      "Open <b>Appoint &rsaquo; Configuration &rsaquo; Settings</b>. For this example, a physiotherapy clinic sets up Appoint and opens online booking.",
      "Choose <i>Physiotherapy / rehab</i> in <b>Profession</b>. You should see the summary <i>4 services, a patient file with 14 fields in 4 sections, and a treatment note with 4 parts. Treated as confidential, so the file asks for consent.</i> The four boxes below change to Patient, Appointment, Patient file and PT.",
      "Change any word you prefer, for example <b>Call bookings</b> to <i>Session</i>.",
      "Leave <b>Set up this profile: add its services and the fields on the file</b> ticked.",
      "In <b>Public booking link</b>, type <i>harbour-physio</i>. You should see the full link appear below it with a <span class='man-key'>Copy</span> button.",
      "Tick <b>Reminders</b> and leave 24 in the hours box.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved. Added 4 service(s) and 14 field(s) to the patient file.</i> and the Calendar opens, now titled in your words.",
      "Go to Services and set a price on each new service, then set your hours in Availability.",
      "Come back to Settings, click <span class='man-key'>Copy</span> and send the link to a colleague to try: they choose a service, a date, a time, type their name, email and phone, and click Confirm booking. The booking appears on the Calendar as Booked."
    ],
    fields: [
      ["Profession", "Medical clinic, Dental practice, Law firm, Salon / barber, Therapy / counselling, Physiotherapy / rehab, Veterinary, Coach / personal trainer, Nutrition / wellness or General (anything else). Choosing one fills the four boxes below and shows what the profile sets up. Medical, dental, legal, therapy, physiotherapy and nutrition profiles are treated as confidential, so the client file shows a consent banner.", "optional"],
      ["Call clients", "The word for the people you see, such as Patient or Client. Used in menus, lists and dialogs. Left empty, the profile's word is saved.", "optional"],
      ["Call bookings", "The word for a booking, such as Appointment, Session or Meeting. Left empty, the profile's word is saved.", "optional"],
      ["Call the record", "The name of the file kept on each person, such as Patient file, Matter or Client card.", "optional"],
      ["File number prefix", "The letters before each new file number, for example PT gives PT-0001. Saved in capitals.", "optional"],
      ["Set up this profile: add its services and the fields on the file", "When ticked, Save adds the profile's services and file fields. Nothing is removed, and a service or field with the same name or key is left as it is, so it is safe to run again.", "optional"],
      ["Public booking link", "The name at the end of your booking link. Letters, numbers and dashes; anything else becomes a dash and it is saved in lower case. Leave it blank to switch the link off.", "optional"],
      ["Reminders", "Tick to email each client a reminder before their appointment.", "optional"],
      ["Hours before", "How many hours before the appointment the reminder goes. 24 if left empty.", "optional"]
    ],
    buttons: [
      ["Copy", "Copies the full booking link."],
      ["Save", "Saves the settings, applies the profile if ticked, and opens the Calendar."],
      ["The link itself", "Opens your public booking page in a new tab."]
    ],
    after: "Settings change nothing in the books. Applying a profile adds services (with a price of 0.00) and fields on the client file. With a booking link, anyone who has it can book without logging in: they choose a service, a date and a time, and give a name, an email and a phone. Orbit books them under the customer contact with the same email, or creates a new customer, and adds a Booked appointment noted <i>Booked online</i>. With reminders on, once an hour Orbit emails every client with an email address whose appointment starts within the chosen number of hours and is not cancelled, completed or a no-show. Each appointment is reminded once.",
    links: [
      { name: "Services", how: "Set prices on the services a profile adds.", to: "appt.services" },
      { name: "Availability", how: "The hours the booking link offers.", to: "appt.avail" },
      { name: "Clients", how: "The file's sections, alerts and note shape come from the profile.", to: "appt.clients" },
      { name: "Custom fields", how: "Change or add the file's fields under Appoint: the client file.", to: "settings.customfields" },
      { name: "Contacts", how: "People who book online are added as customer contacts.", to: "contacts" }
    ],
    mistakes: [
      ["Could not save: A record with (the link name) already exists. Use a different one.", "Another business already uses that booking link name. Choose a different one, for example with your town added."],
      ["This booking link is not active. Please contact the business for a valid link.", "Shown on the booking page. The link name is blank, was changed, or was mistyped. Copy the link again from Settings."],
      ["Please enter your name.", "Shown on the booking page when the name is shorter than two letters."],
      ["Please pick a time in the future.", "Shown on the booking page when the chosen time has already passed."],
      ["Sorry, that time is no longer available. Please choose another slot.", "Shown on the booking page when enough bookings of that service already overlap the time."],
      ["A client did not get a reminder", "Reminders are only emailed to clients with an email address on their contact, for appointments that are not cancelled, completed or a no-show."]
    ],
    tips: [
      "Changing Profession overwrites the four words and the prefix in the boxes, so choose the profession first and then adjust the words.",
      "Changing the link name stops the old link working at once. Send clients the new one."
    ]
  },

  "events.list": {
    title: "Events",
    what: "<b>Events</b> lists every event you plan: weddings, company launches, private parties, conferences. Opening an event opens its <b>workspace</b>, with a header showing the days to go, confirmed guests against the target, total heads, and budget against actual, and thirteen tabs: <b>Overview</b>, <b>Concept &amp; Brief</b>, <b>Guests</b>, <b>Stages &amp; Priorities</b>, <b>Seating</b>, <b>Suppliers</b>, <b>Budget</b>, <b>Payments</b>, <b>Procurement</b>, <b>Revenues</b>, <b>Tasks</b>, <b>Contracts</b> and <b>Team</b>. Everything about the event lives in one place, and money rows can be turned into real invoices and bills in Accounting.",
    when: [
      "A client books you to plan an event, or your company plans its own.",
      "You are building the guest list, sending RSVP links or seating people.",
      "You are choosing suppliers, tracking the budget, deposits and balances, and what is still to do.",
      "Another company, such as the venue or a co-planner, needs to work on the same event."
    ],
    how: [
      "Open <b>Events</b> and click <span class='man-key'>New</span>. For this example, you plan a garden wedding for 180 guests for the bride's family.",
      "Type the event's name, choose Type <i>Wedding</i>, set the <b>Event date</b>, type 180 in <b>Guest target / capacity</b>, fill <b>Venue</b> and <b>Location / city</b>, check <b>Currency</b>, choose the bride's family in <b>Client / customer</b> and click <span class='man-key'>Save</span>. You should see <i>Event created</i> and the workspace on Overview, with the days to go in the header.",
      "Open <b>Stages &amp; Priorities</b>. Rename <i>Maybe</i> to <i>Waiting list</i>, and click <span class='man-key'>Save</span>. You should see <i>Saved</i>; the Guests tab now uses the new word.",
      "Open <b>Concept &amp; Brief</b>, click <span class='man-key'>+ Add to the board</span> and choose <b>Picture</b>. Type <i>Colour palette</i> in Caption, choose the photo and click Save. Add a <b>Link</b> to the florist's page and an <b>Instruction</b> <i>Confirm the vegetarian menu count</i>. You should see three cards on the board.",
      "Open <b>Guests</b> and click <span class='man-key'>Import</span>. Paste one line per guest: side, priority, category, first name, family name and stage, separated by tabs or commas. Click Import. You should see, for example, <i>40 guests imported</i> and the capacity bar.",
      "To add one more guest, type on the last line of the table and press <b>Enter</b>. You should see <i>Added</i>.",
      "Click a guest's <b>Stage</b> cell and choose <i>Invited</i>. The capacity bar reads, for example, <i>41 invited / confirmed of 180 target</i>.",
      "Click the open button at the left of a guest's row, then <span class='man-key'>Copy link</span> beside Personal RSVP link, and send it to the guest. When the guest answers yes, their RSVP becomes Yes and their stage Confirmed.",
      "Click <span class='man-key'>Registration link</span>, tick <b>Registration is open</b> and click Copy, if people may add themselves. They arrive on the Longlist, and the <i>Registered themselves</i> filter finds them.",
      "Open <b>Seating</b>. Click <span class='man-key'>+ Add table</span>, leave the name <i>Table 1</i>, Capacity 10, Shape Round, and Save. Click <span class='man-key'>Upload floor plan</span> to lay tables over a photo of the venue.",
      "Drag guests from <b>Unassigned</b> onto the table, or tap a guest and pick the table. The table header shows heads against seats, for example <i>8/10</i>.",
      "Open <b>Suppliers</b>, click <span class='man-key'>+ Add supplier</span>, type the florist's name, Category <i>Flowers</i>, Price band and Status <i>Quoted</i>. Click <span class='man-key'>+ New contact</span> to add them to Contacts and link them, then Save.",
      "Open <b>Budget</b>, click <span class='man-key'>+ Add line</span>: Category <i>Catering</i>, Cost basis <i>Per guest</i>, Rate / guest 45. Save. You should see 8,100.00 estimated (45 times the 180 target).",
      "Open <b>Payments</b>, click <span class='man-key'>+ Add payment</span>: Label <i>Venue deposit</i>, Kind Deposit, Amount 3,000, a Due date and the venue in Supplier. Save. You should see reminder chips 2wk, 1wk and due.",
      "Click <span class='man-key'>Bill</span> on that payment. You should see <i>Draft bill BILL/2026/0009 created - review &amp; post in Accounting</i> and the bill open. Post it there when the venue invoices you.",
      "Open <b>Procurement</b>, click <span class='man-key'>+ Add item</span>: <i>Table linen</i>, Qty 18, Unit price 12. Amount shows 216.00 when saved.",
      "Open <b>Revenues</b>, click <span class='man-key'>+ Add revenue</span>: Type <i>Client fee</i>, Amount 20,000. Save, then click <span class='man-key'>Invoice</span> to create a draft customer invoice for the bride's family.",
      "Open <b>Tasks</b>, click <span class='man-key'>+ Add task</span>: <i>Book the photographer</i>, Phase <i>6 months before</i>, an Assignee, Start and Due dates. Switch to <span class='man-key'>Gantt</span> to see it on the timeline.",
      "Open <b>Contracts</b> and add the signed venue contract as a PDF.",
      "Open <b>Team</b>, type the venue coordinator's email, choose Editor and click <span class='man-key'>Invite</span>. You should see <i>Invite created - link copied to clipboard</i>. Send them the link; once they accept it, they can open this event."
    ],
    fields: [
      ["Name (event form)", "The event's name, shown in the list and the workspace header.", "required"],
      ["Picture (event form)", "The box beside the name. The first picture added becomes the event's cover in the workspace and its thumbnail in the list.", "optional"],
      ["Type", "Wedding, Corporate / company, Private party, Conference or Other.", "optional"],
      ["Event date", "The main day. Drives the days to go in the header.", "optional"],
      ["End date", "For a multi-day event; blank for a single day.", "optional"],
      ["Guest target / capacity", "The maximum headcount. The capacity bar warns when invited guests pass it, and per-guest budget lines multiply by it.", "optional"],
      ["Venue and Location / city", "Where it is held. Both suggest values you have used before.", "optional"],
      ["Currency", "Three letters, the currency the event's figures are shown in. Starts at the company currency.", "optional"],
      ["Status", "Planning, Confirmed, In progress, Done or Cancelled.", "optional"],
      ["Client / customer", "The customer the event is for. Needed before a revenue can be invoiced.", "optional"],
      ["Project", "Links the event to a project; invoices and bills raised from the event carry it.", "optional"],
      ["Notes", "Shown on the Overview tab.", "optional"],
      ["Concept &amp; Brief: Text", "For a Title, Subtitle or Text block: the words shown.", "required"],
      ["Concept &amp; Brief: Title or Caption, and Notes", "For Paragraph, Note, Link, Picture and Document blocks. An Instruction's notes are labelled What must be done and get a tick box.", "optional"],
      ["Concept &amp; Brief: Web address", "For a Link block. https:// is added if you leave it out.", "required"],
      ["Concept &amp; Brief: Picture or File", "For a Picture or Document block, the file to upload. Editing keeps the current one unless you choose another.", "required"],
      ["Guests: First name and Family name", "At least one of the two is needed for every guest.", "required"],
      ["Guests: Side and Category", "Free text, such as Bride or Groom, and Family or Colleagues. Both suggest values used before.", "optional"],
      ["Guests: Priority", "One of the event's priorities (A to D unless changed), shown as a coloured badge.", "optional"],
      ["Guests: Invite stage (Stage in the table)", "Where the guest is in inviting: Longlist, Shortlisted, Invited, Confirmed, Maybe, Declined, or the event's own stages. What each stage counts as drives the capacity bar and the confirmed count.", "optional"],
      ["Guests: RSVP", "Pending, Yes, No or Maybe. Set by the guest through their RSVP link, or by you.", "optional"],
      ["Guests: Plus ones (+1)", "How many people the guest brings. Counted in total heads and at the table.", "optional"],
      ["Guests: Email, Phone, Dietary / notes and VIP", "Contact details, dietary needs and a VIP badge. Dietary, VIP, Notes and Seat are hidden table columns you can show with Columns.", "optional"],
      ["Guests: Table", "In the table view, the seating table. Usually set by dragging on the Seating tab.", "optional"],
      ["Guests: import lines", "One guest per line: Side, Priority, Category, First name, Family name, Stage, separated by tabs or commas. A stage that does not match one of the event's stages becomes the first stage.", "optional"],
      ["Guests: Registration is open", "In Registration link. While ticked, anyone with the link can add themselves to the Longlist.", "optional"],
      ["Stages &amp; Priorities: stage Name and Counts as", "Each stage's name, and whether it counts as Not yet invited, Invited, Confirmed or Declined for the capacity bar and badges.", "optional"],
      ["Stages &amp; Priorities: priority Name and Colour", "Each priority's name and badge colour.", "optional"],
      ["Seating: table Name, Capacity, Shape and Zone", "Name (Table 1, Table 2 and so on by default), seats (10 by default), Round or Rectangle, and an optional zone.", "optional"],
      ["Seating: zone colour and name", "In Zones. Colours the tables of that zone and shows a legend.", "optional"],
      ["Suppliers: Supplier / option", "The supplier or option's name; Supplier if left blank.", "optional"],
      ["Suppliers: Category, Why (quality vs price), Price band, Status", "The budget category, why you are considering them, their price range, and To contact, Contacted, Quoted, Shortlisted, Booked or Rejected.", "optional"],
      ["Suppliers: Contact person, Phone / email, Where to find / source, Best-value pick, Notes", "Their details. A value containing @ is saved as the email, anything else as the phone. Best-value pick marks them with a star.", "optional"],
      ["Suppliers: Linked contact", "A vendor from Contacts. Needed before a payment to this supplier can become a bill.", "optional"],
      ["Budget: Category, Subcategory, Item / detail, Notes", "How the line is grouped and described.", "optional"],
      ["Budget: Cost basis and Rate / guest", "Fixed, or Per guest. A per-guest line's estimate is the rate times the guest target.", "optional"],
      ["Budget: Estimated and Actual", "The planned cost of a fixed line, and what it really cost. Actual is typed by you.", "optional"],
      ["Payments: Label, Kind, Amount, Due date", "What the payment is, Deposit, Balance or Installment, how much and when it is due.", "optional"],
      ["Payments: Booking confirmation, Paid and Paid date", "Marks a booking milestone, and whether and when it was paid. Ticking Paid with no date uses today.", "optional"],
      ["Payments: Supplier and Reference / notes", "The event supplier being paid, so a bill can be raised, and a note.", "optional"],
      ["Procurement: Description, Supplier, Category, Qty, Unit price, Needed by, Status, Notes", "What is being ordered, from which event supplier, how many at what price, by when, and Planned, Ordered, Confirmed or Delivered.", "optional"],
      ["Procurement: Amount", "Qty times Unit price, unless you type an amount to override it.", "auto"],
      ["Revenues: Type, Amount, Details / from whom, Expected date, Received", "The kind of money in (Ticket sales, Client fee, Donation, Sponsorship, Gift, Wedding registry / gift list, Contribution, Grant, Other, or your own), how much, from whom, when, and whether it has arrived.", "optional"],
      ["Tasks: Task", "What must be done.", "required"],
      ["Tasks: Phase, Category, Assignee, Status, Start date, Due date, Payment task, Booking confirmation, Notes", "When it falls, what it is about, who does it (existing names and suppliers are suggested), Not started, In progress, Done or Blocked, its dates for the Gantt, and flags shown as icons.", "optional"],
      ["Contracts: files", "Images and PDFs of signed contracts, quotes and other documents.", "optional"],
      ["Team: email and role", "The email of the person to invite, and Editor or Viewer.", "required"]
    ],
    buttons: [
      ["New (list)", "Opens a blank event form."],
      ["List, Thumbnails and Kanban board (list)", "Switch how events show. The board groups them by Status or Type."],
      ["Filters, Group By, Columns, Select and Export (list)", "Group by Status or Type, choose columns, tick events to export or delete, and download a CSV file."],
      ["Save and Discard (event form)", "Save creates or updates the event and opens its workspace. Discard leaves without saving."],
      ["Edit event", "In the workspace header. Opens the event form."],
      ["Tabs", "Switch between the thirteen sections of the event."],
      ["Export and Print (most tabs)", "Download that tab as a CSV file, or print it or save it as a PDF."],
      ["+ Add to the board", "Concept &amp; Brief. Choose Title, Subtitle, Paragraph, Text, Note, Instruction, Link, Picture or Document."],
      ["Block tools", "Concept &amp; Brief. Move earlier, move later, wider or narrower, edit, remove. Each change saves at once."],
      ["Table, Board and Pivot", "Guests. Board shows guests as cards in columns by Invite stage, Priority, Side or RSVP, which you drag between. Pivot counts guests by any two of Side, Category, Priority, Invite stage and RSVP."],
      ["Import", "Guests. Paste rows of guests to add them together."],
      ["Registration link", "Guests. Open or close self-registration and copy the link."],
      ["Add line and the last table line", "Guests table. Type a new guest and press Enter, or click Add line. Tab moves along, Esc clears."],
      ["Columns: Show columns, Add a field from the record, Reset", "Guests table. Show hidden columns such as Dietary or VIP, add another field of the guest record as a column, or reset columns, widths and added fields."],
      ["Column menu", "Guests table, the dots on a heading. Sort, group by, hide, move, or filter by values."],
      ["Copy link", "Guest dialog. Copies the guest's personal RSVP link."],
      ["Delete (dialogs)", "Guest, table, supplier, budget line, payment, procurement item, revenue and task dialogs. Asks to confirm, then deletes."],
      ["+ Add a stage, + Add a priority, arrows and remove", "Stages &amp; Priorities. Add, reorder or remove entries, then Save."],
      ["Back to the standard lists", "Stages &amp; Priorities. Returns to the standard stages and priorities. Guests keep their values."],
      ["+ Add table, Zones, Upload floor plan, Remove plan, Plan and List", "Seating. Add a table, manage zones, set or remove the venue photo, and switch between the floor plan and a list."],
      ["Move handle, resize corner and double-click", "Seating plan. Drag a table, resize it, or double-click it to edit. Positions save when you let go."],
      ["+ New contact", "Supplier dialog. Creates a vendor contact from the name and details and links it."],
      ["Bill or View bill", "Payments. Creates a draft vendor bill for the payment and opens it, or opens the one already made."],
      ["Invoice or View invoice", "Revenues. Creates a draft customer invoice for the revenue and opens it, or opens the one already made."],
      ["Tick box and Gantt", "Tasks. Tick marks a task Done; Gantt shows dated tasks on a timeline by phase."],
      ["Invite, Copy link and Remove", "Team. Create an invite and copy its link, copy a pending link again, or remove a collaborator."]
    ],
    after: "The event and its tabs are planning records: nothing in them reaches the books on its own. Ticking Paid on a payment or Received on a revenue, and typing Actual on a budget line, change only the event's figures. <span class='man-key'>Bill</span> creates a draft vendor bill for the linked supplier, and <span class='man-key'>Invoice</span> a draft customer invoice for the event's client, each dated today with one line for the amount, the event's project, and the payment's due date or revenue's expected date; they count in the accounts only once you post them in Accounting. A payment with a due date that is not paid gets three reminders, two weeks before, one week before and on the due date, emailed on the day to the people involved: whoever created the event, the client's email, accepted collaborators, and any task assignee typed as an email address. A guest's RSVP answer updates the guest: Yes makes them Confirmed and No makes them Declined. Accepting a Team invite gives the other company this event only.",
    links: [
      { name: "Contacts", how: "The event's client, and suppliers linked with Linked contact or + New contact.", to: "contacts" },
      { name: "Customer Invoices", how: "Invoice on a revenue creates a draft there.", to: "inv.out" },
      { name: "Bills", how: "Bill on a payment creates a draft there.", to: "inv.in" },
      { name: "Projects", how: "The project chosen on the event is carried onto its invoices and bills.", to: "proj.list" },
      { name: "Vendors", how: "Only vendor contacts can be linked to an event supplier.", to: "vend" }
    ],
    mistakes: [
      ["Name is required", "The event form has no name. Type one and Save."],
      ["Enter a name", "The guest dialog has neither a first nor a family name."],
      ["Every guest needs a name", "The new line in the guests table has no first or family name."],
      ["Type something on the line first", "Enter or Add line was pressed on an empty new line."],
      ["(number) guest(s) still use this. Move them first.", "A stage or priority still has guests. Change those guests first, then remove it."],
      ["Keep at least one", "You tried to remove the last stage or priority."],
      ["Type the text", "A Title, Subtitle or Text block is empty."],
      ["Choose a picture or Choose a file", "A Picture or Document block has no file. Choose one before saving."],
      ["Upload failed: (reason)", "The picture, file or floor plan did not upload. Check the file and your connection, then try again."],
      ["Allow pop-ups to print", "The browser blocked the print window. Allow pop-ups for Orbit and click Print again."],
      ["Set a Client on the event first (Edit event), then raise the invoice.", "Invoice needs the event's Client / customer. Click Edit event, choose the client, Save, then click Invoice."],
      ["Link this payment's supplier to a Contact first (Suppliers tab -&gt; Linked contact), then create the bill.", "The payment has no supplier, or its supplier has no linked contact. Choose the supplier on the payment and set Linked contact on the supplier, then click Bill."],
      ["Enter a supplier name first", "+ New contact was clicked before typing the supplier's name."],
      ["Enter a task", "The task dialog has no task."],
      ["Enter an email", "Invite was clicked with no email."],
      ["Could not accept invite: This invitation was sent to a different email address. Sign in as (email) to accept it.", "The person opening the invite link is signed in with another email. Sign in with the invited address and open the link again."],
      ["Could not accept invite: Invite not found or already handled", "The link is wrong, the invite was removed, or it was declined."],
      ["A guest is missing from Unassigned on Seating", "Seating lists guests whose stage counts as Invited or Confirmed, including stages you added under Stages &amp; Priorities, plus Maybe, and anyone already on a table. A guest on a stage that counts as nothing yet or as Declined does not appear: change the guest's stage, or change what that stage counts as."]
    ],
    tips: [
      "Per-guest budget lines use the guest target, not the confirmed heads, so update the target as the list settles.",
      "Invoices and bills raised from the event are made in the event's currency, with the same figure as the event row, so an event run in another currency than the company's gives drafts in that currency. Check the draft before posting.",
      "Deleting a table makes the guests seated at it unassigned.",
      "A collaborator can see and edit this event only; their other records and yours stay private."
    ]
  },

  "svc.tickets": {
    title: "Tickets",
    what: "A <b>ticket</b> is one service job: a breakdown call, a repair, a service visit, a warranty claim. It records the customer and the item, who is going and when, what was reported and what was done, and the labour and parts used, with the part covered by warranty kept apart from what is billable. The list shows every ticket, newest first, with its priority, status and scheduled time.",
    when: [
      "A customer calls with a fault or asks for a visit.",
      "A technician comes back with the diagnosis, the hours and the parts used.",
      "You need to know whether an item is still under warranty before sending someone.",
      "You want to see what is open, urgent or not yet assigned."
    ],
    how: [
      "Open <b>Service &rsaquo; Tickets</b> and click <span class='man-key'>New</span>. For this example, an air-conditioning maintenance firm takes a call: an office unit is not cooling. You should see the ticket form with the stages New to Done across the top.",
      "Type <i>AC not cooling, office 3</i> in the title box.",
      "Choose the customer in <b>Customer</b> and type <i>Office manager, extension 204</i> in <b>Contact</b>.",
      "Choose the unit's model in <b>Item / product</b> and type its serial number in <b>Serial no.</b>. If a valid warranty is registered for that product and serial, you should see a green badge such as <i>Under Manufacturer warranty until 2027-03-31 &middot; covers Labour &amp; parts</i>.",
      "Set <b>Priority</b> to High, choose the technician in <b>Technician</b>, set <b>Scheduled</b> to tomorrow at 09:30, <b>Location</b> to On site and <b>Status</b> to Assigned.",
      "Type what the customer said in <b>Problem reported</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the ticket in the list with a number such as <i>T-482913</i>.",
      "After the visit, open the ticket and type the findings in <b>Diagnosis / work done</b>.",
      "Click <span class='man-key'>+ Add line</span>, choose Type <i>Labour</i>, type <i>Diagnosis and repair</i>, 1.5 in Qty/Hrs and 40 in Unit price. Add a second line: Type <i>Part</i>, <i>Run capacitor</i>, 1 and 25, and tick <b>Covered</b> because the warranty pays for parts.",
      "Check the totals under the lines: <i>Billable 60.00</i> and <i>Covered 25.00</i>.",
      "Set Status to Done, choose 5 / 5 in <b>Customer rating</b>, add their comment in <b>Feedback</b> and click Save."
    ],
    fields: [
      ["Title", "A short description of the job, for example AC not cooling. Saved as Service ticket if left blank.", "optional"],
      ["Customer", "Who the job is for. Every contact is listed.", "optional"],
      ["Contact", "Who to call about the job.", "optional"],
      ["Item / product", "The product being serviced. With Serial no., it decides which warranty the badge shows.", "optional"],
      ["Serial no.", "The item's serial number or IMEI, checked against registered warranties as you type.", "optional"],
      ["Equipment", "If it is one of your tracked plant or equipment units.", "optional"],
      ["Priority", "Low, Normal, High or Urgent. Urgent and High tickets are found by the Urgent filter and marked on the Schedule.", "optional"],
      ["Status", "New, Assigned, In progress, On hold, Done, Closed or Cancelled. The first time it is Done or Closed, the closing time is recorded.", "optional"],
      ["Technician", "Who does the job, from the Orbit users in your organisation. It decides the Schedule row.", "optional"],
      ["Scheduled", "The date and time of the visit. A ticket appears on the Schedule only when this is set.", "optional"],
      ["Location", "On site, Workshop or In store.", "optional"],
      ["Bill to", "Who pays: Customer, Manufacturer (back-to-back), for a warranty claim passed to the maker, or Dealer.", "optional"],
      ["RMA no.", "The return authorisation number for a repair returned to the manufacturer under warranty.", "optional"],
      ["Customer rating", "The customer's satisfaction score for the completed job, 1 to 5, or Not rated.", "optional"],
      ["Feedback", "An optional comment from the customer.", "optional"],
      ["Problem reported", "The fault in the customer's words.", "optional"],
      ["Diagnosis / work done", "What was found and done.", "optional"],
      ["Type (on a line)", "Part, Labour or Expense. Labour is counted in hours, the others in quantity.", "optional"],
      ["Description (on a line)", "What the line is.", "optional"],
      ["Qty/Hrs (on a line)", "How many parts, or how many hours for labour. A line with no quantity or hours and no description is not saved.", "optional"],
      ["Unit price (on a line)", "The price of one part or one hour.", "optional"],
      ["Covered (on a line)", "Tick when the warranty pays for the line. It moves the line's value from Billable to Covered.", "optional"],
      ["Ticket number", "T- followed by six digits, given when the ticket is first saved.", "auto"],
      ["Billable and Covered", "The lines' quantity or hours times unit price, split by the Covered tick.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank ticket."],
      ["Save", "Saves the ticket and its lines and returns to the list."],
      ["Discard", "Returns to the list without saving."],
      ["+ Add line", "Adds a labour, part or expense line."],
      ["&times; (on a line)", "Removes the line. It is gone when you Save."],
      ["Filters", "Open (New, Assigned, In progress or On hold), Urgent (Urgent or High) and Unassigned."],
      ["Group By", "Groups the list by Status or Priority."],
      ["Priority cell", "Click a Priority in the list to change it without opening the ticket."],
      ["Select, Columns and Export", "Tick tickets to export or delete them, choose the columns, and download a CSV file."]
    ],
    after: "Saving stores the ticket and its lines. It posts nothing to the books, moves no stock and creates no invoice: Billable is a figure for your information, and anything chargeable is invoiced separately in Customer Invoices. A ticket with a technician and a scheduled time appears on the Schedule, and tickets raised from a maintenance plan are linked to that plan.",
    links: [
      { name: "Schedule", how: "Tickets with a Scheduled time, by technician and day. Drag to reassign.", to: "svc.schedule" },
      { name: "Warranties", how: "The registered warranties the badge checks.", to: "svc.warranties" },
      { name: "Maintenance", how: "Plans that generate tickets when they fall due.", to: "svc.ppm" },
      { name: "Customer Invoices", how: "Invoice the billable part of a job there.", to: "inv.out" },
      { name: "Products", how: "The list offered in Item / product.", to: "products" },
      { name: "Plant", how: "The equipment units offered in Equipment.", to: "site.plant" },
      { name: "Users", how: "Technicians are the users of your organisation.", to: "settings.users" }
    ],
    mistakes: [
      ["You don&rsquo;t have permission to do that.", "Your role cannot change Service records. Ask an administrator for manage rights on Service."],
      ["The warranty badge does not appear", "A warranty only matches the item it names: its Product must be the ticket's Item / product, its Serial no. must match when it has one, and its Customer must match when both have one. A warranty with no product and no serial matches nothing. Check those fields on the warranty, and that Valid until has not passed."],
      ["A line disappeared after saving", "Lines with no quantity or hours and no description are not saved. Add the figures and save again."],
      ["The ticket is not on the Schedule", "Scheduled is empty, or falls in another week. Set it, or move the Schedule to that week."],
      ["Technician offers nobody", "Only Orbit users of your organisation are listed. Invite the technician in Settings, Users."]
    ],
    tips: [
      "The warranty badge does not tick Covered for you. Tick it on each line the warranty pays for.",
      "Ticket numbers are made from the clock, so they are unique but not in sequence."
    ]
  },

  "svc.schedule": {
    title: "Schedule",
    what: "The <b>Schedule</b> is a week planner for service jobs: one row per technician plus an Unassigned row, one column per day from Monday to Sunday. Every ticket with a scheduled time in that week shows as a card with its time, title and customer, and a coloured edge for its priority. Dragging a card to another row or day reassigns and reschedules the job.",
    when: [
      "Planning the week's visits across your technicians.",
      "A technician is off sick and their jobs must go to someone else.",
      "A customer moves their visit to another day."
    ],
    how: [
      "Open <b>Service &rsaquo; Schedule</b>. For this example, an air-conditioning maintenance firm plans Monday morning. You should see <b>Technician schedule</b> and this week's dates.",
      "Look at the <b>Unassigned</b> row: two jobs are booked for today with no technician.",
      "Drag the first card onto a technician's Tuesday cell. The cell highlights while you hover, and when you let go the card appears there. The ticket now has that technician and Tuesday's date at the same time of day, and a New ticket becomes Assigned.",
      "Drag a card back onto the Unassigned row to take the technician off it. An Assigned ticket goes back to New; a ticket In progress, On hold or Done keeps its status.",
      "Click the right arrow to see next week, and <span class='man-key'>This week</span> to come back.",
      "Click a card to open its ticket, check the Scheduled time, and Save."
    ],
    fields: [
      ["Technician rows", "Every Orbit user in your organisation, then Unassigned.", "auto"],
      ["Day columns", "Monday to Sunday of the week shown.", "auto"],
      ["Card", "A ticket scheduled in that week: its time, title and customer. The left edge is red for Urgent, amber for High and the app colour otherwise.", "auto"]
    ],
    buttons: [
      ["Left arrow, This week and right arrow", "Show the previous week, the current week, or the next week."],
      ["Drag a card", "Drop it on another technician or day to reassign and reschedule the ticket."],
      ["Click a card", "Opens the ticket."]
    ],
    after: "Dropping a card saves the ticket at once: Technician becomes the row's user (or none for Unassigned) and the date becomes the column's day at the card's own time of day. Status changes only between New and Assigned: a New ticket dropped on a technician becomes Assigned, and an Assigned ticket dropped on Unassigned becomes New. Any other status is kept. Nothing reaches the books.",
    links: [
      { name: "Tickets", how: "Where the Scheduled time, technician and status are set.", to: "svc.tickets" },
      { name: "Maintenance", how: "Generated tickets are scheduled on the plan's due date.", to: "svc.ppm" },
      { name: "Users", how: "Each user of the organisation gets a row.", to: "settings.users" }
    ],
    mistakes: [
      ["A job I moved still says New", "It was dropped on the Unassigned row, which has no technician. Drop it on a technician's row and it becomes Assigned."],
      ["A ticket is missing from the week", "It has no Scheduled time, or it is scheduled in another week. Set the time on the ticket."],
      ["A technician has no row", "They are not a user of your organisation. Invite them in Settings, Users."]
    ],
    tips: [
      "Dragging moves the day and the technician but keeps the visit's time of day, as shown on the card.",
      "To change only the time of a visit, open the ticket rather than dragging."
    ]
  },

  "svc.ppm": {
    title: "Maintenance",
    what: "<b>Maintenance</b> holds your planned preventive maintenance: recurring plans such as a quarterly air-conditioning service or a yearly boiler check. Each plan says what the job is, for which customer or equipment, which technician, how many days apart and when it is next due. When plans fall due, one click generates their tickets.",
    when: [
      "You sell a maintenance contract with regular visits.",
      "Equipment needs servicing every so many days.",
      "At the start of each week, to raise the tickets for the plans that have fallen due."
    ],
    how: [
      "Open <b>Service &rsaquo; Maintenance</b>. For this example, an air-conditioning maintenance firm adds a quarterly service of a customer's rooftop units. You should see <b>Preventive maintenance</b> and <i>None due right now.</i>",
      "Under <b>Add a plan</b>, type <i>Rooftop AC quarterly service</i> in Title.",
      "Choose the customer in Customer, and the unit in Equipment if you track it.",
      "Choose the technician in Technician.",
      "Leave <b>every</b> at 90 days and set <b>from</b> to the date of the first visit, here today.",
      "Click <span class='man-key'>Add plan</span>. You should see the plan in the table with Every 90d, Next due today marked due, and Active Yes. The header now says <i>1 due now.</i>",
      "Click <span class='man-key'>Generate 1 due ticket(s)</span>. You should see <i>1 ticket(s) generated</i> and Next due moved 90 days later.",
      "Open Tickets. You should see a ticket with the plan's title, the customer and technician, status Assigned, scheduled on the due date at 09:00."
    ],
    fields: [
      ["Title", "What the visit is. It becomes the title of every ticket the plan generates.", "required"],
      ["Customer", "Who the visits are for.", "optional"],
      ["Equipment", "The tracked equipment unit being maintained.", "optional"],
      ["Technician", "Who does the visits. Generated tickets are assigned to them.", "optional"],
      ["every (days)", "How many days apart the visits are. 90 if left empty.", "optional"],
      ["from", "The first due date. Starts at today.", "optional"],
      ["For, Every, Next due and Active (table)", "The plan's customer (or equipment), its interval, the next due date (marked due once reached) and whether it is active.", "auto"]
    ],
    buttons: [
      ["Add plan", "Saves the new plan as active."],
      ["Generate (number) due ticket(s)", "Shown when active plans are due today or earlier. Creates one ticket per due plan and moves each plan's next due date on by its interval."],
      ["&times; (on a plan)", "Deletes the plan after you confirm."]
    ],
    after: "Adding a plan changes nothing else. Generate creates a ticket for each active plan whose next due date is today or earlier, with the plan's title, customer, equipment and technician, priority Normal, status Assigned (New without a technician), scheduled on the due date at 09:00 and linked to the plan, then adds the plan's interval to its next due date once. Nothing posts to the books.",
    links: [
      { name: "Tickets", how: "Where generated tickets appear.", to: "svc.tickets" },
      { name: "Schedule", how: "Generated tickets show on their due date in the technician's row.", to: "svc.schedule" },
      { name: "Plant", how: "The equipment units offered in Equipment.", to: "site.plant" }
    ],
    mistakes: [
      ["Give the plan a title", "Title is empty."],
      ["A plan is still due after Generate", "Each click moves the next due date on by one interval only. A plan that fell several intervals behind needs more clicks, or delete it and add it again from the right date."],
      ["No tickets were raised although a plan was due", "Tickets are only generated when someone clicks Generate on this screen. Nothing raises them on its own."]
    ],
    tips: [
      "Open this screen at the same time every week so no due visit is missed.",
      "A plan cannot be edited or paused here. To change one, delete it with &times; and add it again."
    ]
  },

  "svc.warranties": {
    title: "Warranties",
    what: "<b>Warranties</b> is the register of what is still covered: manufacturer and company warranties, service contracts and extended cover on the items you sell or maintain. Each warranty names the customer, the product and serial number, the type, what it covers and until when. A ticket for a matching item shows a badge saying it is under warranty, so you know before anyone travels.",
    when: [
      "You sell or install an item that carries a warranty.",
      "A customer buys an extended warranty or a maintenance contract.",
      "A warranty is extended, or you want to see what is about to expire."
    ],
    how: [
      "Open <b>Service &rsaquo; Warranties</b> and click <span class='man-key'>New</span>. For this example, an air-conditioning maintenance firm registers the two-year manufacturer warranty on a unit it installed.",
      "Choose the customer in <b>Customer</b> and the unit's model in <b>Product</b>.",
      "Type the unit's serial number in <b>Serial no.</b> and the installation invoice number in <b>Reference</b>.",
      "Choose <i>Manufacturer</i> in <b>Type</b> and <i>Labour &amp; parts</i> in <b>Covers</b>.",
      "Set <b>Start</b> to the installation date and <b>Valid until</b> to two years later.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the warranty in the list with its Type, Covers and Valid to date.",
      "Open Tickets, click New and choose the same product and serial. You should see <i>Under Manufacturer warranty until</i> the end date, <i>covers Labour &amp; parts</i>.",
      "To extend the warranty later, click its <b>Valid to</b> date in the list and change it."
    ],
    fields: [
      ["Customer", "Who owns the covered item. Every contact is listed.", "optional"],
      ["Product", "The covered product. A ticket matches only the same product, unless this is left empty.", "optional"],
      ["Serial no.", "The covered unit's serial number. A ticket matches only the same serial, unless either is left empty.", "optional"],
      ["Reference", "The contract or invoice number.", "optional"],
      ["Type", "Company, Manufacturer, Maintenance (SLA) or Extended.", "optional"],
      ["Covers", "Labour &amp; parts, Labour only or Parts only. Shown on the ticket's badge.", "optional"],
      ["Start", "When cover begins. Starts at today.", "optional"],
      ["Valid until", "When cover ends. After this date the list marks it expired and tickets no longer match it. Left empty, it never expires.", "optional"],
      ["Notes", "Conditions, exclusions, or anything else.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank warranty."],
      ["Save", "Saves the warranty and returns to the list."],
      ["Discard", "Returns to the list without saving."],
      ["Valid to cell", "Click the date in the list to change it without opening the warranty."],
      ["Select, Columns and Export", "Tick warranties to export or delete them, choose the columns, and download a CSV file."]
    ],
    after: "Saving a warranty changes nothing in the books. Tickets check the register as you choose the item and type the serial, and show the first warranty that has not expired and matches both. The Document / warranty expiry rule in Automations can notify you of warranties ending soon.",
    links: [
      { name: "Tickets", how: "A ticket for a covered item shows the warranty badge.", to: "svc.tickets" },
      { name: "Automations", how: "The Document / warranty expiry rule warns you before a warranty ends (30 days ahead unless changed).", to: "settings.automations" },
      { name: "Products", how: "The list offered in Product.", to: "products" }
    ],
    mistakes: [
      ["Choose the Product or type the Serial no., so Orbit knows which item this warranty covers.", "Both Product and Serial no. are empty. A warranty that names no item would cover nothing, so choose the product, type the serial, or both, and Save again."],
      ["The badge does not show on a ticket for a covered item", "The ticket's product or serial differs from the warranty's, the warranty names another customer, or Valid until has passed. A warranty saved earlier with no product and no serial matches nothing: open it and add them. Check both records."],
      ["(expired) next to a date", "Valid until is before today. Extend it by clicking the date, if the cover really continues."]
    ],
    tips: [
      "Always record the serial number: a warranty that names only the product matches every unit of that model.",
      "The badge is information only. Tick Covered on the ticket's lines that the warranty pays for."
    ]
  }

});
