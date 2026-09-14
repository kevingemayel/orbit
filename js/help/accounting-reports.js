/* Orbit screen help: Accounting, the reports under Accounting > Reporting.
 *
 * One page per screen, keyed by the screen's menu action. js/app.js loads this
 * file the first time help is opened (loadScreenHelp) and renders a page with
 * screenHelpHTML. Plain English, written for someone reading the report for the
 * first time. Never an em dash.
 *
 * The shape of a page is the one documented in accounting-documents.js:
 *   title     the screen name as the menu shows it
 *   what      what the screen is for, in two to four sentences (HTML)
 *   when      [the situations in which you open it]
 *   how       [the numbered steps of one worked example, with what you should see]
 *   fields    [[filter, picker or toggle as on screen, what it does, "required" | "optional" | "auto"]]
 *   buttons   [[label as on screen, what pressing it does]]
 *   after     what the screen changes, when it changes anything (HTML)
 *   links     [{ name, how, to: "menu.action" }]   to makes the name a link
 *   mistakes  [[the message or symptom exactly as shown, why it happens and the fix]]
 *   tips      [short extras worth knowing]
 * For a report, the fields are its filters and the steps show how to run it and
 * how to read it. HTML inside the strings uses single-quoted attributes.
 */
orbitScreenHelp({

  "rep.pl": {
    title: "Profit and Loss",
    what: "The <b>Profit and Loss</b> answers one question: did the business make money over a period? It lists every <b>income</b> account and every <b>expense</b> account that had posted entries in the period, totals each side and shows the difference as <b>Net Profit</b> (a minus figure is a loss). The numbers come only from <b>posted</b> entries dated inside the period, in the book you are looking at, in the company currency. Drafts never count.",
    when: [
      "At the end of a month, quarter or year, to see whether you made a profit.",
      "Before a meeting with your accountant, a bank or a partner who wants to know how trading went.",
      "When a cost feels out of control and you want to see how big it really is next to your income.",
      "To compare one period with another by changing the period and reading the totals again."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Profit and Loss</b>. For this example, a small bakery wants to see how April to June 2026 went. The report opens on <b>This year</b>: you should see the heading <i>Profit and Loss</i>, the company name, the currency and <i>FY 2026 (2026-01-01 to 2026-12-31)</i>.",
      "In the period list choose <b>Custom range&hellip;</b>. Two date boxes appear. Set the first (From) to 1 April 2026 and the second (To) to 30 June 2026. The report redraws on its own and the heading now ends <i>2026-04-01 to 2026-06-30</i>.",
      "If your company keeps more than one book, check the book picker beside the period shows the book you mean, normally Statutory.",
      "Read the <b>Income</b> section. Each row is an account with its code, its name and what it earned in the period: here <i>Sales</i> 48,200.00 and <i>Catering income</i> 6,300.00. You should see <b>Total Income</b> 54,500.00.",
      "Read the <b>Expenses</b> section the same way: <i>Ingredients</i> 21,400.00, <i>Rent</i> 7,500.00 and <i>Salaries</i> 15,600.00. You should see <b>Total Expenses</b> 44,500.00.",
      "Read the last line. <b>Net Profit</b> is Total Income minus Total Expenses, so 10,000.00. A positive figure is a profit; a minus figure means you spent more than you earned.",
      "If a figure looks wrong, open <b>General Ledger</b> with the same period. It shows every line behind each account, so you can find the invoice or bill that caused it.",
      "Click <span class='man-key'>Export</span> to download the report as a CSV file that opens in a spreadsheet. You should see the message <i>Report exported to CSV</i>.",
      "Click <span class='man-key'>Print</span> to print it, or choose Save as PDF in the print window to keep a copy."
    ],
    fields: [
      ["Period", "Which dates the report covers: This year and Last year run from 1 January to 31 December, This quarter and This month are the ones you are in today, All time has no dates, and Custom range lets you type your own. The period you choose stays chosen when you open another report.", "auto"],
      ["From and To (Custom range only)", "The first and last day to include. Leave From empty to start at the very first entry; leave To empty and it means today.", "optional"],
      ["Book", "Which set of entries the report adds up. Changing it switches the book for the whole app, and a coloured chip in the top bar names any book that is not the primary one.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads what is on screen as a CSV file named after the report and today's date."],
      ["Print", "Opens your browser's print window, where you can print or save as PDF."]
    ],
    links: [
      { name: "Invoices", how: "A posted customer invoice adds its lines to your income accounts on its invoice date.", to: "inv.out" },
      { name: "Bills", how: "A posted supplier bill adds its lines to your expense accounts on its bill date.", to: "inv.in" },
      { name: "Journal Entries", how: "A manual entry posted to an income or expense account also shows here.", to: "moves" },
      { name: "General Ledger", how: "Shows every posted line behind each figure, for the same period.", to: "rep.gl" },
      { name: "Balance Sheet", how: "Its <b>Current Year Earnings</b> line is income minus expenses, carried into equity.", to: "rep.bs" },
      { name: "Chart of Accounts", how: "An account's type decides where it appears: only income and expense types are on this report.", to: "accounts" },
      { name: "Budgets", how: "Set a planned figure per account and compare it with what was actually posted.", to: "budget.list" },
      { name: "Accounting books", how: "Where books are added and named, if you keep more than one.", to: "settings.books" }
    ],
    mistakes: [
      ["No entries.", "Shown under Income or Expenses when nothing was posted to those accounts in the period. Check the period, and check that your invoices and bills are posted rather than saved as drafts."],
      ["The profit looks too high or too low", "Usually a document is still a draft, or it is dated outside the period (the invoice date or bill date decides, not the day you typed it), or it was posted into another book. Check the dates and the book picker, then open General Ledger for the same period."],
      ["An account you expected is not listed", "Only accounts with posted entries in the period appear. If it did have entries, open Chart of Accounts and check its type: an asset, liability or equity account belongs on the Balance Sheet instead."],
      ["The figures change when you open another report", "The period is shared by the reports, so the one you picked here stays picked there. Set it again on each report if you need different dates."]
    ],
    tips: [
      "This year means the calendar year, 1 January to 31 December. Use Custom range for a financial year that starts in another month.",
      "Running the report changes nothing in your books, so it is safe to try any period you like.",
      "Keep one printed or PDF copy for each month you close, so you can see later what the figures were at the time."
    ]
  },

  "rep.bs": {
    title: "Balance Sheet",
    what: "The <b>Balance Sheet</b> is a snapshot on one date: what the business <b>owns</b> (assets such as bank, cash and money customers owe you), what it <b>owes</b> (liabilities such as suppliers and VAT due) and the owners' stake (<b>equity</b>). It adds up every <b>posted</b> entry from the very first one up to the last day of the period you choose, in the book you are looking at. The two sides should always agree: Total Assets equals Total Liabilities plus Total Equity.",
    when: [
      "At a month end or year end, to see where the business stands.",
      "When a bank, investor or accountant asks for a balance sheet at a date.",
      "To check that the bank and cash figures agree with your real bank statements and cash box.",
      "After importing opening balances, to confirm everything landed in the right place."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Balance Sheet</b>. For this example, a cleaning company wants its position at 30 June 2026.",
      "In the period list choose <b>Custom range&hellip;</b> and set the second date box (To) to 30 June 2026. Only the end date matters on this report, because it always starts from the first entry. You should see <i>as of 2026-06-30</i> under the heading.",
      "Read <b>Assets</b>. Each row is an account and its balance at that date: <i>Bank</i> 18,400.00, <i>Cash on hand</i> 600.00 and <i>Customers (accounts receivable)</i> 9,200.00. You should see <b>Total Assets</b> 28,200.00.",
      "Read <b>Liabilities</b>: <i>Suppliers (accounts payable)</i> 4,300.00 and your sales VAT account 1,100.00. You should see <b>Total Liabilities</b> 5,400.00.",
      "Read <b>Equity</b>: the capital account 15,000.00 and the line <b>Current Year Earnings</b> 7,800.00, which is all income minus all expenses posted up to the date. You should see <b>Total Equity</b> 22,800.00.",
      "Check the sides agree: Total Liabilities 5,400.00 plus Total Equity 22,800.00 is 28,200.00, the same as Total Assets. There is no line that adds the two for you, so do the sum yourself.",
      "Compare <i>Bank</i> with your bank statement at 30 June. A difference means a receipt or payment is missing, posted twice, or dated on the wrong side of the month end.",
      "Compare <i>Customers (accounts receivable)</i> with what you expect to collect. Aged Receivable lists who makes up that figure today.",
      "Click <span class='man-key'>Export</span> for a CSV file, or <span class='man-key'>Print</span> to print or save a PDF."
    ],
    fields: [
      ["Period", "Only its last day is used: the report shows balances as of that day. This year ends on 31 December, This month on the last day of this month, All time means today.", "auto"],
      ["From and To (Custom range only)", "To is the date of the snapshot. From is ignored on this report. Leave To empty for today.", "optional"],
      ["Book", "Which set of entries is added up. Changing it switches the book for the whole app.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads what is on screen as a CSV file."],
      ["Print", "Opens your browser's print window, where you can print or save as PDF."]
    ],
    links: [
      { name: "Profit and Loss", how: "Its Net Profit is what feeds the Current Year Earnings line here.", to: "rep.pl" },
      { name: "Trial Balance", how: "The same accounts, shown as total debits and credits.", to: "rep.tb" },
      { name: "Aged Receivable", how: "Lists the open customer invoices that make up what customers owe you today.", to: "rep.aged.recv" },
      { name: "Aged Payable", how: "Lists the open bills that make up what you owe suppliers today.", to: "rep.aged.pay" },
      { name: "Data Health Check", how: "Its <b>Balance Sheet balances</b> row checks the two sides agree, and flags negative bank or cash.", to: "rep.health" },
      { name: "FX Revaluation", how: "Restates balances held in a foreign currency at the closing rate, so this report shows their current value.", to: "acc.revalue" },
      { name: "Chart of Accounts", how: "An account's type decides which section it sits in.", to: "accounts" }
    ],
    mistakes: [
      ["No entries.", "Shown under a section with no posted balances up to the date, for example no liabilities yet in a new company."],
      ["Total Assets does not equal Total Liabilities plus Total Equity", "Run Data Health Check. Its Balance Sheet balances row shows the assets, liabilities, equity and result it found, which tells you which side is off."],
      ["Customers (accounts receivable) differs from the total of Aged Receivable", "This report reads the ledger at the date you chose. Aged Receivable reads open invoices today and converts foreign-currency invoices at the latest exchange rate. Set the period to today and look for manual journal entries on the receivable account."],
      ["The bank balance is below zero", "More payments than receipts were posted to that account up to the date. Look for a customer payment not yet recorded, or a supplier payment recorded twice."]
    ],
    tips: [
      "Current Year Earnings adds up every income and expense entry up to the date, not only this year's.",
      "Choose All time or leave To empty to see the position today."
    ]
  },

  "rep.gl": {
    title: "General Ledger",
    what: "The <b>General Ledger</b> is the full diary of your books: every <b>posted</b> line in the period, grouped by account in code order and, inside each account, in date order with a running balance. Use it to find exactly which entries make up a figure on another report. It reads the book you are looking at, and each line's date is the date of its journal entry.",
    when: [
      "A figure on the Profit and Loss or Balance Sheet looks odd and you want to see the lines behind it.",
      "Your accountant asks for the ledger for a month or a year.",
      "You want to see every movement on one account, such as bank, rent or VAT, over a period.",
      "You are checking that a document posted to the account you expected."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; General Ledger</b>. For this example, a dental clinic checks June 2026 on its bank account.",
      "Choose <b>Custom range&hellip;</b> and set From to 1 June 2026 and To to 30 June 2026. You should see the heading <i>General Ledger - 2026-06-01 to 2026-06-30</i>.",
      "Scroll to the grey heading for the account, for example <i>5100 Bank</i>. Accounts are in code order, and only accounts with posted lines in the period appear.",
      "Read the columns: <b>Date</b> of the entry, <b>Entry</b> (its number, such as <i>BNK/2026/0031</i>, or its reference when it has no number), <b>Partner</b>, <b>Label</b>, <b>Debit</b>, <b>Credit</b> and <b>Balance</b>.",
      "The first line on 2 June is a customer payment: Label <i>Bank receipt</i>, Debit 1,250.00, Balance 1,250.00. The next on 5 June is a supplier payment: Label <i>Bank payment</i>, Credit 480.00, Balance 770.00.",
      "At the end of the account you should see <b>Total 5100</b> with Debit 14,900.00, Credit 9,350.00 and 5,550.00 in the last column: what went in minus what went out during June.",
      "The partner on a payment shows on the other half of the entry. Scroll to the receivable account and you should see the same entry number with the customer in <b>Partner</b> and the Label <i>Receivable settled</i>.",
      "At the very bottom, <b>Grand Total</b> shows the debits and credits of every account. Its last column should read 0.00, because every entry has equal debits and credits.",
      "Click <span class='man-key'>Export</span> to take the whole ledger into a spreadsheet, or <span class='man-key'>Print</span> for paper or PDF."
    ],
    fields: [
      ["Period", "Which entry dates to include: This year, This quarter, This month, Last year, All time or Custom range. Shared with the other reports.", "auto"],
      ["From and To (Custom range only)", "The first and last entry date to include. Leave To empty for today.", "optional"],
      ["Book", "Which set of entries is listed. Changing it switches the book for the whole app.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads every row on screen, account headings and totals included, as a CSV file."],
      ["Print", "Opens your browser's print window."]
    ],
    links: [
      { name: "Journal Entries", how: "Each Entry number here is a journal entry you can open there.", to: "moves" },
      { name: "Statement of Account", how: "For one account over a period with the balance brought forward from before the period.", to: "rep.stmt" },
      { name: "Trial Balance", how: "The totals of the same lines, one row per account.", to: "rep.tb" },
      { name: "Profit and Loss", how: "Use the ledger to explain any line of it for the same period.", to: "rep.pl" },
      { name: "Chart of Accounts", how: "The codes and names the ledger is grouped by.", to: "accounts" }
    ],
    mistakes: [
      ["No posted journal entries in this period.", "Nothing was posted with a date inside the period, in this book. Widen the period, check the book picker, and post any drafts you meant to include."],
      ["The balance does not match my bank statement", "The Balance column starts at zero at the start of the period, so it shows the movement in the period only. Choose All time, or use Statement of Account for the account, which adds the balance brought forward."],
      ["Balances on sales or supplier accounts show a minus sign", "Normal. The balance is debits minus credits, and those accounts build up credits."],
      ["The Partner column is empty on bank lines", "A payment names the customer or supplier on its receivable or payable line, not on the bank line."]
    ],
    tips: [
      "Use your browser's find (Ctrl+F) to jump to an account code or an entry number in a long ledger.",
      "The ledger reads entries by their own date, so a document typed today with last month's date shows in last month."
    ]
  },

  "rep.tb": {
    title: "Trial Balance",
    what: "The <b>Trial Balance</b> lists every account with posted entries up to a date, with the <b>total of its debits</b> and the <b>total of its credits</b>. Because every entry Orbit posts has equal debits and credits, the two column totals at the bottom must be the same: that is the check. It adds up every posted entry from the first one up to the last day of the period, in the book you are looking at.",
    when: [
      "Before closing a month or handing the books to your accountant.",
      "After importing opening balances or a large batch of entries.",
      "To see every account at a glance with how much went through it."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Trial Balance</b>. For this example, an IT services firm prepares the books up to 31 August 2026.",
      "Choose <b>Custom range&hellip;</b> and set To to 31 August 2026. From is not used here. You should see <i>as of 2026-08-31</i> under the heading.",
      "Read the four columns: <b>Code</b>, <b>Account</b>, <b>Debit</b> (everything ever debited to it up to the date) and <b>Credit</b> (everything ever credited).",
      "Look at <i>Bank</i>: Debit 96,300.00 and Credit 71,850.00. The difference, 24,450.00, is what is in the bank. An account can show figures in both columns; that is normal.",
      "Look at <i>Customers (accounts receivable)</i>: Debit 88,000.00 invoiced and Credit 61,500.00 collected, so 26,500.00 is still owed to you.",
      "Go to the <b>Total</b> row. You should see the same figure in both columns, for example 412,650.00 and 412,650.00.",
      "If the totals agree, compare the bank and cash figures with your statements, then open the Balance Sheet for the same date.",
      "Click <span class='man-key'>Export</span> to send the figures to your accountant as a spreadsheet, or <span class='man-key'>Print</span>."
    ],
    fields: [
      ["Period", "Only its last day is used. This year ends on 31 December, so posted entries dated later this year are included. Use Custom range to stop at a month end.", "auto"],
      ["From and To (Custom range only)", "To is the date the report runs up to. From is ignored.", "optional"],
      ["Book", "Which set of entries is added up.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads the table as a CSV file."],
      ["Print", "Opens your browser's print window."]
    ],
    links: [
      { name: "General Ledger", how: "Shows the individual lines behind each account's debit and credit totals.", to: "rep.gl" },
      { name: "Balance Sheet", how: "The asset, liability and equity accounts of this report, shown as balances.", to: "rep.bs" },
      { name: "Data Health Check", how: "Its first row checks the same two totals, next to other consistency checks.", to: "rep.health" },
      { name: "Journal Entries", how: "Where a correcting entry is made if an account balance is wrong.", to: "moves" }
    ],
    mistakes: [
      ["The Debit and Credit totals are different", "Orbit refuses to post an entry whose debits and credits differ, so this should not happen. Run Data Health Check, whose first row compares the same totals, and pass the result to whoever looks after your books."],
      ["An account is missing", "Only accounts with posted entries up to the date are listed. A new account with nothing posted will not show."],
      ["The report includes entries after the date I meant", "This year and This quarter run to their last day, not to today. Choose Custom range and set To."]
    ],
    tips: [
      "Equal totals prove the books are arithmetically in balance, not that every entry went to the right account. Read the account list as well."
    ]
  },

  "rep.partner": {
    title: "Partner Ledger",
    what: "The <b>Partner Ledger</b> lists, for every customer and supplier, each <b>posted</b> line on a receivable or payable account that carries their name, with a running balance. For a customer that is each posted invoice or credit note and each payment registered against them; for a supplier, each bill, refund and payment. It covers every date, has no period filter, and reads the book you are currently in.",
    when: [
      "You want to see every customer's and supplier's history on one page.",
      "A customer disputes their balance and you want the full list of what was invoiced and paid.",
      "You are checking that payments were registered against the right contact."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Partner Ledger</b>. For this example, a wholesale florist checks its customer <i>Garden Events</i>. Partners are listed in alphabetical order, each under a grey heading.",
      "Find the heading <i>Garden Events</i>. The columns are <b>Date</b>, <b>Entry</b> (the entry number), <b>Label</b>, <b>Debit</b>, <b>Credit</b> and <b>Balance</b>.",
      "The first line on 3 August is an invoice: Label <i>Receivable</i>, Debit 2,400.00, Balance 2,400.00.",
      "On 20 August a payment was registered: Label <i>Receivable settled</i>, Credit 1,000.00, Balance 1,400.00.",
      "On 28 August another invoice: Debit 850.00, Balance 2,250.00. You should see <b>Total Garden Events</b> with Debit 3,250.00, Credit 1,000.00 and 2,250.00: a positive balance means the customer owes you that amount.",
      "Now find a supplier. A bill shows Label <i>Payable</i> in the Credit column, so their balance goes below zero: a balance of -1,800.00 means you owe them 1,800.00.",
      "At the bottom, <b>Grand Total</b> adds every partner together.",
      "To send one customer a statement for a set period, use <b>Statement of Account</b> instead: it has a period and a balance brought forward.",
      "Click <span class='man-key'>Export</span> for a CSV file, or <span class='man-key'>Print</span>."
    ],
    fields: [
      ["Book", "The report reads the book you are currently in. Changing the picker on this screen does not redraw it: see the problems below.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads the table as a CSV file."],
      ["Print", "Opens your browser's print window."]
    ],
    links: [
      { name: "Statement of Account", how: "One contact over a chosen period, with the balance brought forward and a plain sentence saying who owes whom.", to: "rep.stmt" },
      { name: "Aged Receivable", how: "What each customer still owes, spread by how late it is.", to: "rep.aged.recv" },
      { name: "Aged Payable", how: "What you owe each supplier, spread by when it is due.", to: "rep.aged.pay" },
      { name: "Invoices", how: "Each posted invoice adds a Receivable line for its customer.", to: "inv.out" },
      { name: "Bills", how: "Each posted bill adds a Payable line for its vendor.", to: "inv.in" },
      { name: "Customer Payments", how: "Each payment registered on an invoice adds a Receivable settled line.", to: "pay.in" },
      { name: "Customers", how: "Each customer's form has a Statement button that opens their statement.", to: "cust" }
    ],
    mistakes: [
      ["No receivable or payable entries with a partner yet.", "Nothing posted to a receivable or payable account carries a contact. Post an invoice or bill first; drafts do not count."],
      ["A customer's balance does not match Aged Receivable", "This report adds the ledger at the value each entry was booked at. Aged Receivable reads the open amount on each invoice and converts a foreign-currency one at the latest rate. Manual journal entries with the contact also count here but not there."],
      ["A payment is missing from a customer's lines", "Only payments registered against one of their invoices, or entries that name them on a receivable or payable line, appear. Register the payment on the invoice."],
      ["Changing the book picker does nothing", "On this screen the picker is not connected. Switch the book on a report that has a period, such as General Ledger, then open Partner Ledger again."]
    ],
    tips: [
      "The report has no dates, so it shows every posted line, including any dated in the future."
    ]
  },

  "rep.aged.recv": {
    title: "Aged Receivable",
    what: "<b>Aged Receivable</b> shows who owes you money today and how late it is. It takes every <b>posted</b> customer invoice and credit note with an amount still open, adds them up per customer, and places each amount in a column by how many days past its due date it is, counted from today. Credit notes reduce the total. Amounts in another currency are converted into the company currency at the latest exchange rate on file.",
    when: [
      "Every week, to decide which customers to chase.",
      "Before offering a customer more credit or a new order on account.",
      "At a month end, to see how much of what you are owed is already late."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Aged Receivable</b>. For this example, a printing company runs it on 14 September 2026. There is no period to choose: it is always as of today.",
      "Read the columns: <b>Partner</b>, <b>Not due</b> (due date today or later), <b>1-30</b>, <b>31-60</b>, <b>61-90</b> and <b>90+</b> days past due, and <b>Total</b>. Customers are sorted with the biggest total first.",
      "The first row is <i>Northside School</i>: 3,000.00 under Not due (an invoice due on 30 September) and 1,200.00 under 31-60 (an invoice due on 31 July, 45 days ago). You should see a Total of 4,200.00.",
      "The next row is <i>Bayview Hotel</i>: 2,750.00 under 90+ (due on 31 May, 106 days ago). Total 2,750.00.",
      "At the bottom the <b>Total</b> row adds each column: Not due 3,000.00, 31-60 1,200.00, 90+ 2,750.00 and 6,950.00 in all.",
      "Read it like this: Not due is healthy; 1-30 needs a reminder; 61-90 and 90+ are the worrying ones, the money you are most at risk of never receiving.",
      "Open <b>Collections</b> to work through the late invoices and record each call or promise to pay.",
      "When a customer pays, register the payment on the invoice. Run this report again and the amount leaves the customer's row.",
      "Click <span class='man-key'>Export</span> for a CSV file, or <span class='man-key'>Print</span>."
    ],
    fields: [
      ["Book", "This report reads open invoices, not the ledger, so it counts documents from every book whichever is chosen.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads the table as a CSV file."],
      ["Print", "Opens your browser's print window."]
    ],
    links: [
      { name: "Invoices", how: "Every posted invoice with an open amount is counted here by its due date.", to: "inv.out" },
      { name: "Credit Notes", how: "A posted credit note that is still open reduces the customer's total.", to: "inv.outr" },
      { name: "Customer Payments", how: "A payment registered on an invoice lowers its open amount, so it leaves this report.", to: "pay.in" },
      { name: "Collections", how: "The same late invoices as a chase list, with follow-ups and promises to pay.", to: "rep.collections" },
      { name: "Statement of Account", how: "Send a customer the detail behind their row.", to: "rep.stmt" },
      { name: "Exchange Rates", how: "The latest rate for each currency is used to convert foreign-currency invoices.", to: "rates" },
      { name: "Customers", how: "A customer's payment days set the due date on new invoices.", to: "cust" }
    ],
    mistakes: [
      ["Nothing outstanding.", "No posted customer invoice or credit note has an amount still open. Drafts do not count."],
      ["An invoice the customer has paid still shows", "The payment was not registered against that invoice. Open the invoice and use Register Payment."],
      ["A customer shows a minus total", "Their open credit notes are bigger than their open invoices. Use the credit against a future invoice, or refund them."],
      ["A foreign-currency amount looks far too big or too small", "There is no exchange rate for that currency, so the amount is added unconverted. Add a rate in Exchange Rates."],
      ["The total differs from the customers figure on the Balance Sheet", "This report reads open invoices today at the latest rate; the Balance Sheet reads the ledger at a chosen date at the rates booked. Manual journal entries on the receivable account also show only on the Balance Sheet."]
    ],
    tips: [
      "An invoice without a due date is aged from its invoice date.",
      "Setting payment days on each customer gives every invoice a due date, which is what makes this report meaningful."
    ]
  },

  "rep.aged.pay": {
    title: "Aged Payable",
    what: "<b>Aged Payable</b> shows who you owe money to today and how soon it is due. It takes every <b>posted</b> supplier bill and refund with an amount still open, adds them up per supplier, and places each amount in a column by how many days past its due date it is, counted from today. Refunds reduce the total. Amounts in another currency are converted into the company currency at the latest exchange rate on file.",
    when: [
      "Each week, to plan which suppliers to pay.",
      "Before a supplier call, to know exactly what is outstanding with them.",
      "At a month end, to see whether any bills are overdue."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Aged Payable</b>. For this example, a restaurant plans its supplier payments on 14 September 2026. There is no period: it is always as of today.",
      "Read the columns: <b>Partner</b>, <b>Not due</b>, <b>1-30</b>, <b>31-60</b>, <b>61-90</b>, <b>90+</b> and <b>Total</b>. Suppliers with the biggest total come first.",
      "The first row is <i>Fresh Produce Market</i>: 1,850.00 under Not due and 640.00 under 1-30. You should see a Total of 2,490.00.",
      "The next row is <i>City Linen Service</i>: 900.00 under 61-90. Total 900.00.",
      "The <b>Total</b> row at the bottom shows 3,390.00 owed in all.",
      "Read it like this: Not due can wait until its due date; anything in 1-30 or later is already late and may cost you goodwill or supply.",
      "Pay the late ones first. Open the bill and click Register Payment; the amount then leaves this report.",
      "Open <b>Cash Flow Forecast</b> to check the payments fit the cash you expect to have.",
      "Click <span class='man-key'>Export</span> for a CSV file, or <span class='man-key'>Print</span>."
    ],
    fields: [
      ["Book", "This report reads open bills, not the ledger, so it counts documents from every book whichever is chosen.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads the table as a CSV file."],
      ["Print", "Opens your browser's print window."]
    ],
    links: [
      { name: "Bills", how: "Every posted bill with an open amount is counted here by its due date.", to: "inv.in" },
      { name: "Refunds", how: "A posted supplier refund that is still open reduces what you owe that supplier.", to: "inv.inr" },
      { name: "Supplier Payments", how: "A payment registered on a bill lowers its open amount.", to: "pay.out" },
      { name: "Cash Flow Forecast", how: "Shows the same open bills as money going out on their due dates, next to money coming in.", to: "rep.cashfwd" },
      { name: "Vendors", how: "A vendor's payment days set the due date on new bills.", to: "vend" },
      { name: "Exchange Rates", how: "The latest rate for each currency converts foreign-currency bills.", to: "rates" }
    ],
    mistakes: [
      ["Nothing outstanding.", "No posted bill or refund has an amount still open. Drafts do not count."],
      ["A bill you have paid still shows", "The payment was not registered on that bill. Open the bill and use Register Payment."],
      ["A supplier shows a minus total", "Their open refunds are bigger than their open bills."],
      ["A foreign-currency amount looks wrong", "There is no exchange rate for that currency, so the amount is added unconverted. Add one in Exchange Rates."]
    ],
    tips: [
      "A bill without a due date is aged from its bill date."
    ]
  },

  "budget.list": {
    title: "Budgets",
    what: "A <b>budget</b> is a plan: for a period, how much you expect to spend or earn on each account. This screen lists your budgets. Opening one lets you set its planned figures, and its <span class='man-key'>Budget vs actual</span> button compares each line with what was really <b>posted</b> to that account between the budget's From and To dates, in the book you are looking at.",
    when: [
      "At the start of a year, to set spending limits for rent, wages, marketing and so on.",
      "During the year, to see which costs are close to or over plan.",
      "When someone asks whether a department or a type of cost is within budget."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Budgets</b> and click <span class='man-key'>New</span>. For this example, a marketing agency budgets three costs for 2026.",
      "Type the name, for example <i>2026 Operating</i>. From and To are already 1 January and 31 December of this year; leave them.",
      "On the first line choose the rent account in <b>Account</b>, type <i>Office rent</i> in <b>Note</b> and 36,000.00 in <b>Planned</b>.",
      "Click <span class='man-key'>+ Add line</span> and do the same for software subscriptions (6,000.00) and travel (4,000.00). A new line starts on the first account in the list, so always pick its account.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and the <span class='man-key'>Budget vs actual</span> button appears.",
      "Click <span class='man-key'>Budget vs actual</span>. It saves again and opens the comparison, headed <i>2026 Operating &middot; budget vs actual</i>.",
      "Read the columns: <b>Planned</b>, <b>Actual</b> (posted between From and To), <b>Variance</b> (planned minus actual, red when negative), <b>Used</b> (actual as a percentage of planned) and <b>Status</b>.",
      "In mid-September you should see rent 27,000.00 at 75% marked <i>ok</i>, software 5,700.00 at 95% marked <i>near</i> (90% or more), and travel 4,650.00 at 116% marked <i>over</i> on a red row with a Variance of -650.00.",
      "The <b>Total</b> row shows 46,000.00 planned, 37,350.00 actual, 8,650.00 left and 81% used. Act on the red and amber lines first.",
      "Click <span class='man-key'>Export</span> for a CSV file or <span class='man-key'>Print</span> to share it."
    ],
    fields: [
      ["Search (list)", "Finds a budget by name.", "optional"],
      ["Budget name", "What the budget is called in the list. Left empty it is saved as Budget.", "optional"],
      ["From", "The first day of the budget. Actuals are counted from this date. A new budget starts on 1 January of this year.", "auto"],
      ["To", "The last day of the budget. Actuals are counted up to this date. A new budget ends on 31 December of this year.", "auto"],
      ["Account (on a line)", "The account the plan is for. Its posted lines in the period become the Actual.", "required"],
      ["Note (on a line)", "A short description shown beside the account on the comparison.", "optional"],
      ["Planned (on a line)", "The amount you expect for the whole period.", "required"],
      ["Book (comparison)", "The comparison reads the book you are currently in; the picker on that screen does not switch it.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank budget. Only shown if you can manage the Accounting app."],
      ["Save", "Saves the name, dates and every line."],
      ["Discard", "Goes back to the list without saving changes."],
      ["+ Add line", "Adds another planned line."],
      ["&times; (on a line)", "Removes the line. It is gone once you save."],
      ["Budget vs actual", "Saves the budget, then opens the comparison with posted figures."],
      ["Delete", "Shown on a saved budget if you can manage the Accounting app. Removes the budget."],
      ["Export", "On the list, downloads the list as CSV. On the comparison, downloads the comparison table."],
      ["Print", "On the comparison, opens your browser's print window."]
    ],
    after: "A budget changes nothing in your books. It is a set of planned figures kept beside the ledger; the comparison reads posted journal lines and never writes to them.",
    links: [
      { name: "Profit and Loss", how: "The same posted income and expense figures, for any period.", to: "rep.pl" },
      { name: "General Ledger", how: "Shows the lines that make up an Actual figure.", to: "rep.gl" },
      { name: "Chart of Accounts", how: "The accounts a budget line can be set on.", to: "accounts" },
      { name: "Bills", how: "Posted bills are what raise the Actual on expense lines.", to: "inv.in" }
    ],
    mistakes: [
      ["No budget lines.", "The budget was saved without any lines. Open it, add lines with an account and a planned figure, and save."],
      ["Every Actual is 0.00", "Nothing was posted to those accounts between From and To in this book. Check both dates are filled in and that your documents are posted, not drafts."],
      ["An income line is red and marked over", "The comparison marks any line where actual passes planned. On an income account that means you earned more than planned, which is good news."],
      ["A line appeared on an account you did not choose", "A line added with + Add line starts on the first account in the list. Pick the right account, or remove the line with &times;, then save."],
      ["The same account's Actual is counted twice", "Two lines on the same account each show the account's full actual. Keep one line per account."],
      ["Save failed", "The budget could not be saved. Try again; if it keeps failing, check you still have access to this company."],
      ["There is no New or Delete button", "You can view budgets but not manage them. Ask whoever manages the Accounting app for access."]
    ],
    tips: [
      "Keep income and expense plans in separate budgets, so the Total row adds like with like.",
      "For a monthly check, make a budget whose From and To cover that month."
    ]
  },

  "rep.cashfwd": {
    title: "Cash Flow Forecast",
    what: "The <b>Cash Flow Forecast</b> projects how much cash you will have over the coming weeks or months. It starts from your bank and cash balances today, adds money expected in (open customer invoices by due date, expected event revenue, retention due back on projects) and takes away money expected out (open bills by due date, purchase orders not yet billed, scheduled event payments, and your monthly payroll). It warns you if cash is heading below zero.",
    when: [
      "Every week or two, to spot a cash gap before it arrives.",
      "Before committing to a large purchase order or hiring.",
      "When deciding which customers to chase and which payments can wait."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Cash Flow Forecast</b>. For this example, a joinery workshop checks the next quarter. It opens on <b>13 weeks</b> in the chart view.",
      "Read the three boxes at the top: <b>Opening cash</b> 42,000.00 (bank plus cash today), <b>Lowest projected</b> and <b>Projected end of 13 weeks</b>.",
      "Here Lowest projected is -3,500.00 in red, so you should also see the warning <i>Cash is projected to go negative within 13 weeks</i> followed by the low point and <i>Chase receivables or defer commitments.</i>",
      "Look at the chart. The line is your running cash; green bars are weeks with more coming in than going out, red bars the opposite. The dashed line is zero.",
      "Click <span class='man-key'>Table</span> to see the numbers. Each row is a week, from <i>Wk 1</i>, starting on Monday of this week, with <b>Inflows</b>, <b>Outflows</b>, <b>Net</b> and <b>Running cash</b>, red when below zero.",
      "Find the week where Running cash first goes negative. Here Wk 4 has Outflows of 31,200.00 because two large timber bills fall due and a confirmed purchase order is planned for that week.",
      "Decide what to move: chase the customers in Collections so money arrives sooner, or ask the timber supplier for later terms.",
      "Change <b>Horizon</b> to <i>6 months</i> to see the longer picture month by month.",
      "Click <span class='man-key'>Export</span> for a CSV file with Period, Inflows, Outflows, Net and Running cash, or <span class='man-key'>Print</span>."
    ],
    fields: [
      ["Horizon", "How far ahead to look: 6, 13 or 26 weeks shown week by week, or 6, 12 or 18 months shown month by month. 13 weeks is the default.", "auto"],
      ["Chart / Table", "Switches between the picture and the numbers. Both show the same forecast.", "auto"],
      ["Book", "The opening cash comes from the book you are currently in; the picker on this screen does not switch it.", "optional"]
    ],
    buttons: [
      ["Chart", "Shows running cash as a line with net inflow and outflow bars."],
      ["Table", "Shows one row per week or month."],
      ["Export", "Downloads the forecast as a CSV file, in either view."],
      ["Print", "Opens your browser's print window."]
    ],
    after: "The forecast changes nothing. It reads your documents each time you open it, so it is only as good as your due dates, planned dates and contracts.",
    links: [
      { name: "Aged Receivable", how: "The open customer invoices that make up the Inflows.", to: "rep.aged.recv" },
      { name: "Aged Payable", how: "The open bills that make up most of the Outflows.", to: "rep.aged.pay" },
      { name: "Collections", how: "Chase late customers so their money moves into an earlier period.", to: "rep.collections" },
      { name: "Purchase Orders", how: "The part of each open order not yet billed is counted as going out on its planned date.", to: "po.list" },
      { name: "Contracts", how: "The wage on every running contract is added up and counted once at each month end.", to: "hr.contracts" },
      { name: "Projects", how: "A project with a retention due date brings its unreleased retention in on that date.", to: "proj.list" }
    ],
    mistakes: [
      ["Opening cash is 0.00 although there is money in the bank", "Opening cash adds the accounts whose code starts with 51 or 53, which is where the standard chart keeps Bank (5100) and Cash on hand (5300). Bank or cash accounts numbered differently are not counted."],
      ["The first week has a huge outflow or inflow", "Anything overdue, or dated before this week, or with no date, is placed in the first period. Pay or collect the overdue items, or correct their due dates."],
      ["A payment I know is coming is missing", "It is further out than the horizon, or it is still a draft invoice or bill. Choose a longer horizon, or post the document."],
      ["Payroll looks wrong", "The forecast adds the wage of every running contract once per month end. Update or close contracts that have changed."],
      ["A foreign-currency invoice looks too large", "Open amounts are added as they are on the document, without converting the currency."]
    ],
    tips: [
      "Keep purchase orders' planned dates realistic: they decide which week the money leaves.",
      "Months start on the 1st of this month; weeks start on Monday of this week."
    ]
  },

  "rep.collections": {
    title: "Collections",
    what: "<b>Collections</b> is your chase list: every <b>posted</b> customer invoice whose due date has passed and that still has money owing. Customers with the most overdue come first, and inside each one the invoice that is most days late comes first. Next to each invoice it suggests a step from your <b>Follow-up Levels</b> and shows the last contact you logged, so you can work down the list and record every call, email or promise to pay.",
    when: [
      "Once or twice a week, to decide who to call today.",
      "After a customer promises to pay, to record the date so you know when to chase again.",
      "Before a month end, to push the oldest debts."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Collections</b>. For this example, an office supplies distributor runs it on 14 September 2026.",
      "Read the boxes at the top: <b>Total overdue</b> 18,450.00, <b>1-30 days</b> 6,200.00, <b>31-60</b> 4,000.00, <b>61-90</b> 0.00 and <b>90+ days</b> 8,250.00.",
      "The first grey heading is the customer with the most overdue: <i>Lakeside Dental Practice &middot; 8,250.00 overdue</i>, followed by their phone number if you saved one.",
      "Under it, invoice <i>INV/2026/0088</i>: <b>Due</b> 2026-05-20, <b>Days late</b> 117 in red (more than 60), <b>Amount due</b> 8,250.00, and under <b>Suggested</b> a coloured label such as <i>Final notice</i>. Hover over the label to read its suggested wording.",
      "Call the customer, then click <span class='man-key'>Log follow-up</span> on that invoice.",
      "Keep <b>Date</b> as today, choose <b>Channel</b> Call, type <i>Accounts promised payment next week</i> in <b>Note</b>, set <b>Promised date</b> 21 September, <b>Promised amount</b> 8,250.00, <b>Next action date</b> 22 September and <b>Status</b> Promised to pay.",
      "Click <span class='man-key'>Save</span>. You should see <i>Follow-up logged</i>. The <b>Last follow-up</b> column now reads <i>promised &middot; promised 2026-09-21</i> and the customer heading ends <i>next action 2026-09-22</i>.",
      "When the money arrives, open the invoice and click Register Payment. Next time you open Collections the invoice has gone.",
      "Click <span class='man-key'>Export</span> or <span class='man-key'>Print</span> to take the list to a meeting."
    ],
    fields: [
      ["Date (Log follow-up)", "When you contacted the customer. Starts as today.", "auto"],
      ["Channel (Log follow-up)", "Call, Email, Meeting or Letter.", "auto"],
      ["Note (Log follow-up)", "What was said.", "optional"],
      ["Promised date (Log follow-up)", "The date they promised to pay by, if they did. Shown in Last follow-up.", "optional"],
      ["Promised amount (Log follow-up)", "How much they promised.", "optional"],
      ["Next action date (Log follow-up)", "When to chase again. Shown on the customer's heading.", "optional"],
      ["Status (Log follow-up)", "Open, Promised to pay, Escalated or Paid. It describes the conversation only; it does not change the invoice.", "auto"],
      ["Book", "This list reads open invoices, so it shows documents from every book.", "optional"]
    ],
    buttons: [
      ["Log follow-up", "Opens a small form to record a contact about that invoice."],
      ["Save (Log follow-up)", "Saves the follow-up and redraws the list."],
      ["Cancel (Log follow-up)", "Closes the form without saving."],
      ["Export", "Downloads the list as a CSV file."],
      ["Print", "Opens your browser's print window."]
    ],
    after: "Saving a follow-up only keeps a note of the contact against the invoice and customer. It does not send anything, does not record a payment and does not change your books. The invoice leaves this list only when its open amount is paid.",
    links: [
      { name: "Follow-up Levels", how: "Sets the steps that fill the Suggested column: a name, how many days overdue it starts, an action and suggested wording.", to: "fu.levels" },
      { name: "Invoices", how: "Open an invoice and use Register Payment when the customer pays.", to: "inv.out" },
      { name: "Aged Receivable", how: "Everything customers owe, including what is not yet due.", to: "rep.aged.recv" },
      { name: "Statement of Account", how: "Send the customer their full statement with the balance they owe.", to: "rep.stmt" },
      { name: "Customers", how: "Add the phone number shown on the heading, and payment days so every invoice has a due date.", to: "cust" }
    ],
    mistakes: [
      ["No overdue receivables. Nicely done.", "No posted customer invoice with money owing is past its due date."],
      ["Suggested shows -", "You have no follow-up levels, or the invoice is fewer days late than your first level. Add levels in Follow-up Levels."],
      ["An overdue invoice is not on the list", "It has no due date, so it is never counted as overdue here. Give the invoice a due date."],
      ["The customer is still listed after I logged Paid", "A follow-up does not record money. Register the payment on the invoice."],
      ["The totals mix currencies", "Amounts are added as they are on each invoice, without converting a foreign currency."]
    ],
    tips: [
      "Always set a Next action date: it is the reminder of when to call again.",
      "Order your levels by days, for example a reminder at 7 days, a firm email at 30 and a letter at 60, so the suggestion grows with the delay."
    ]
  },

  "rep.tax": {
    title: "VAT / Tax Report",
    what: "The <b>VAT / Tax Report</b> works out the VAT for a period. <b>Output VAT</b> is the tax you charged on sales; <b>input VAT</b> is the tax you paid on purchases. It adds up the lines of every <b>posted</b> invoice, bill, credit note and refund whose document date is in the period, groups them by tax, and shows the difference as <b>VAT payable</b> (you owe the tax office) or <b>VAT credit (refundable)</b> (they owe you). Credit notes and refunds are taken off.",
    when: [
      "At the end of each VAT period, before filing your return.",
      "To check how much VAT to set aside.",
      "When your accountant asks for the sales and purchases by tax rate."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; VAT / Tax Report</b>. For this example, a hair salon files VAT for April to June 2026 at 11%.",
      "Choose <b>Custom range&hellip;</b> and set From to 1 April 2026 and To to 30 June 2026. You should see the heading <i>VAT / Tax Report - 2026-04-01 to 2026-06-30</i>.",
      "Read <b>Sales (output VAT)</b>. Each row is a tax: <i>VAT 11%</i> with <b>Net base</b> 40,000.00 (sales before tax) and <b>Tax amount</b> 4,400.00. Sales with no tax sit on a row called <i>No tax / exempt</i>, here 1,500.00 and 0.00.",
      "You should see <b>Total Sales (output VAT)</b> with 41,500.00 and 4,400.00.",
      "Read <b>Purchases (input VAT)</b>: <i>VAT 11%</i> with 12,000.00 and 1,320.00. You should see <b>Total Purchases (input VAT)</b> 12,000.00 and 1,320.00.",
      "Read the last line: <b>VAT payable</b> 3,080.00, which is 4,400.00 minus 1,320.00. If purchases had more VAT than sales, it would read <b>VAT credit (refundable)</b> instead.",
      "Check it against the VAT accounts: open General Ledger for the same period and look at the sales and purchase VAT accounts. They should show the same tax, unless a rate has changed or a document is in a foreign currency (see the problems below).",
      "Click <span class='man-key'>Print</span> or <span class='man-key'>Export</span> and keep the copy with your return.",
      "Once the return is filed, lock the period in Period Lock so nobody can post into it by mistake."
    ],
    fields: [
      ["Period", "Which document dates to include: This year, This quarter, This month, Last year, All time or Custom range. Shared with the other reports.", "auto"],
      ["From and To (Custom range only)", "The first and last invoice or bill date of your VAT period. Leave To empty for today.", "optional"],
      ["Book", "This report reads document lines, so it counts documents from every book whichever is chosen.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads the table as a CSV file."],
      ["Print", "Opens your browser's print window."]
    ],
    links: [
      { name: "Taxes", how: "The tax names and rates this report groups by and calculates with.", to: "taxes" },
      { name: "Invoices", how: "Posted customer invoices make up the Sales section, by invoice date.", to: "inv.out" },
      { name: "Bills", how: "Posted supplier bills make up the Purchases section, by bill date.", to: "inv.in" },
      { name: "Credit Notes", how: "Posted credit notes are taken off Sales.", to: "inv.outr" },
      { name: "Refunds", how: "Posted supplier refunds are taken off Purchases.", to: "inv.inr" },
      { name: "General Ledger", how: "Shows the VAT posted to the VAT accounts, to check against this report.", to: "rep.gl" },
      { name: "Period Lock", how: "Stops anyone posting on or before a date, once the period is filed.", to: "settings.lock" }
    ],
    mistakes: [
      ["None.", "Shown under Sales or Purchases when no posted document of that kind is dated in the period. Check the dates and post any drafts."],
      ["The tax differs from the VAT accounts in the General Ledger", "This report works the tax out again from each line's net amount and the tax's rate as it is set today, and it does not convert foreign currencies. A rate changed since posting, a document in another currency, or a manual journal on a VAT account will each make the two differ."],
      ["Last quarter's VAT changed after I edited a tax rate", "Because the rate is read as it is today, editing a tax changes past periods on this report. Create a new tax for a new rate instead of editing the old one."],
      ["A sale is missing", "The invoice is still a draft, or its invoice date is outside the period."]
    ],
    tips: [
      "Give every sale and purchase line a tax, even a zero-rated one, so the report shows it on the right row.",
      "The note under the table sums it up: payable is output minus input, credit notes are netted out, posted documents only."
    ]
  },

  "rep.stmt": {
    title: "Statement of Account",
    what: "A <b>Statement of Account</b> shows one contact, or one account, over a period: the <b>balance brought forward</b> from before the period, every <b>posted</b> movement with a running balance, the totals for the period and the <b>balance carried forward</b>, ending with a plain sentence such as who owes whom. Figures are in the company currency, with the original foreign amount beside them. It is the page you print or save as PDF to send a customer or supplier.",
    when: [
      "A customer asks what they owe, or you want to send them a reminder with the detail.",
      "A supplier sends their own statement and you want to compare it with yours.",
      "You need the movements on one account over a period, such as a bank, a loan or an employee advance, starting from the right opening balance."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Statement of Account</b>. You should see <i>Choose a contact and a period above.</i> For this example, a law firm sends a client its statement for April to June 2026.",
      "Leave the first list on <b>For a contact</b>. In the next list choose the client, <i>Meridian Shipping Ltd</i>.",
      "Choose <b>Custom range&hellip;</b> and set From to 1 April 2026 and To to 30 June 2026. The statement appears, with the period and <i>Posted entries only</i> written under the heading.",
      "The first row reads <b>Balance brought forward at 2026-04-01</b> 3,000.00: what the client owed before April.",
      "Read the movements. The columns are <b>Date</b>, <b>Voucher</b> (entry number), <b>Reference</b> (for an invoice, its number), <b>Account</b>, <b>Description</b>, <b>In currency</b> (the foreign amount, if any), <b>Debit</b>, <b>Credit</b> and <b>Balance</b>.",
      "On 12 April an invoice: Description <i>Receivable</i>, Debit 4,500.00, Balance 7,500.00. On 30 May a payment: Description <i>Receivable settled</i>, Credit 3,000.00, Balance 4,500.00.",
      "You should see <b>Movements in the period</b> with Debit 4,500.00, Credit 3,000.00 and 1,500.00, then <b>Balance carried forward at 2026-06-30</b> 4,500.00.",
      "Under the table the sentence reads <i>Meridian Shipping Ltd owes you</i> followed by 4,500.00.",
      "Click <span class='man-key'>Print</span> and choose Save as PDF, then email it to the client.",
      "To read an account instead, switch the first list to <b>For an account</b> and type its code or name. If it has sub-accounts, tick <b>With its auxiliaries</b> to include them; a <b>Trial balance by auxiliary</b> table then shows each one's brought forward, debit, credit and carried forward."
    ],
    fields: [
      ["For a contact / For an account", "Whether the statement is about a customer or supplier, or about an account in your chart.", "auto"],
      ["Contact", "The customer or supplier. Lists every contact of the company. The statement shows the posted lines that carry this contact: the customer or supplier line of each invoice, bill and credit note, and each registered payment.", "required"],
      ["Account", "Shown with For an account. Type the account's code or name and pick it from the suggestions.", "required"],
      ["With its auxiliaries", "Shown only when the chosen account has sub-accounts. Ticked, the statement includes them and adds a table per sub-account. Ticked by default.", "optional"],
      ["Period", "The dates of the statement. Anything before the start becomes the balance brought forward. All time has no brought forward line.", "auto"],
      ["From and To (Custom range only)", "The first and last day of the statement. Leave To empty for today.", "optional"],
      ["Book", "Which set of entries is read.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads the statement table as a CSV file."],
      ["Print", "Opens your browser's print window, where you can save the statement as PDF to send."]
    ],
    links: [
      { name: "Customers", how: "Each customer's form has a <span class='man-key'>Statement</span> button that opens this screen for them.", to: "cust" },
      { name: "Vendors", how: "Each vendor's form has the same Statement button.", to: "vend" },
      { name: "Partner Ledger", how: "Every contact's lines at once, with no period.", to: "rep.partner" },
      { name: "Aged Receivable", how: "What each customer owes, spread by how late it is.", to: "rep.aged.recv" },
      { name: "Collections", how: "Chase the overdue invoices behind a statement's balance.", to: "rep.collections" },
      { name: "Chart of Accounts", how: "Where an account and its sub-accounts (auxiliaries) are set up.", to: "accounts" },
      { name: "General Ledger", how: "Every account's lines for a period, without a brought forward.", to: "rep.gl" }
    ],
    mistakes: [
      ["Choose a contact and a period above.", "No contact is chosen yet. Pick one in the contact list. With For an account the message asks you to choose an account."],
      ["No account has the code or name (what you typed).", "The text does not match an account. Type the code, such as 5100, or pick from the suggestions."],
      ["No posted movements in this period.", "Nothing was posted for this contact or account in the period. The brought forward and carried forward lines still show the balance."],
      ["There is no Balance brought forward line", "The period has no start date, for example All time. Choose a period with a start."],
      ["A contact's invoice is missing", "It is still a draft, or it is dated after the end of the period."],
      ["With its auxiliaries does not appear", "The account has no sub-accounts under it."]
    ],
    tips: [
      "For a customer, a positive balance means they owe you; for a supplier, a minus balance means you owe them. The sentence under the table says it in words.",
      "Print or save a statement at each month end for your largest customers: it settles most disputes before they start."
    ]
  },

  "rep.cons": {
    title: "Consolidation",
    what: "<b>Consolidation</b> adds several of your companies together into one <b>Group Profit &amp; Loss</b> and one <b>Group Balance Sheet</b>, as if they were a single business. Which companies it adds, and how, is set by a <b>consolidation group</b>. Companies in other currencies are translated into the group currency, trade between companies inside the group is cancelled out so it is not counted twice, and shares held by outside owners are shown separately. It reads each company's posted entries as of today, in the book you are currently in.",
    when: [
      "You run more than one company and want the figures for the whole group.",
      "A bank, investor or auditor asks for group accounts.",
      "You want to see how much each company contributes to the group's assets and result."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Consolidation</b> and click <span class='man-key'>Groups</span>. For this example, a hospitality group has a hotel company and a laundry company in USD, both fully owned, and owns 30% of a cafe company in EUR.",
      "In the dialog choose <b>+ New group</b> in <b>Group</b>. Type the <b>Name</b> <i>Hospitality group</i> and set <b>Presented in</b> to USD.",
      "Tick the hotel and laundry companies and leave them on <b>Full</b> at 100%. Tick the cafe, choose <b>Equity</b> and type 30. Tick <b>Use this group by default</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Group saved</i>, and the group picker in the toolbar shows <i>Hospitality group (3)</i>.",
      "Read the <b>Entities</b> table: each company with its currency, method (the cafe reads <i>Equity 30%</i>), the closing and average rates used to translate it into USD, and its assets and result.",
      "The laundry invoices the hotel 12,000.00 a year, and each company's contact for the other is tagged with <b>Intercompany entity</b>. You should see <b>Intercompany eliminations</b> with <i>Intercompany revenue / cost eliminated</i> 12,000.00 / 12,000.00.",
      "Read <b>Group Profit &amp; Loss</b>: the income and expense accounts of the fully counted companies added together by account code, then <i>less: intercompany revenue</i> and <i>less: intercompany costs</i>, then <i>Share of result of equity-accounted entities</i> for the cafe, then <b>Group Net Profit (after eliminations)</b>.",
      "Read <b>Group Balance Sheet</b>: assets, less intercompany receivables, liabilities, less intercompany payables, <i>Investments in equity-accounted entities</i>, equity, <i>Current Year Earnings</i> and <i>Currency translation adjustment</i>.",
      "The last line, <b>Total Liabilities + Equity</b>, always equals Total Assets less intercompany receivables plus Investments in equity-accounted entities, because the currency translation adjustment is the amount that makes the two sides agree.",
      "Click <span class='man-key'>Print</span> and save as PDF to share it."
    ],
    fields: [
      ["Group (toolbar)", "Which consolidation group to show, with its number of companies in brackets. Opens on the group marked as default, or the first one. With no groups at all it reads every company you can see.", "auto"],
      ["Group (Groups dialog)", "Pick an existing group to change it, or + New group. Switching reopens the dialog for that group, so anything not yet saved is lost.", "auto"],
      ["Presented in (Groups dialog)", "The currency the group figures are shown in. Exchange rates are entered as the value of one unit in your organisation's reference currency, so pick that currency unless you know your rates are quoted against another.", "optional"],
      ["Name (Groups dialog)", "What the group is called in the picker.", "required"],
      ["Companies (Groups dialog)", "Tick every company that belongs to the group. At least one is needed.", "required"],
      ["Method (per company)", "<b>Full</b>: every line in full, with the outside owners' share shown as non-controlling interests. <b>Proportional</b>: every line at the ownership percentage. <b>Equity</b>: no lines, only one line for the group's share of net assets and one for its share of the result.", "auto"],
      ["Ownership % (per company)", "How much of the company the group owns, 100 unless you change it. An empty box or 0 is saved as 100.", "auto"],
      ["Use this group by default", "Makes this the group the report opens on. Only one group can be the default.", "optional"]
    ],
    buttons: [
      ["Groups", "Opens the Consolidation groups dialog to create or change a group."],
      ["Save (Groups dialog)", "Saves the group and its companies and redraws the report on that group."],
      ["Cancel (Groups dialog)", "Closes the dialog without saving."],
      ["Add a rate", "In the warning about a missing exchange rate. Opens Exchange Rates."],
      ["Print", "Opens your browser's print window. This report has no Export button."]
    ],
    after: "Saving a group only records which companies it holds and how each is counted. The report itself posts nothing: every elimination and translation is worked out on screen each time you open it.",
    links: [
      { name: "Exchange Rates", how: "Closing rates translate assets, liabilities and equity; average rates translate income and expenses. Without an average rate the closing rate is used.", to: "rates" },
      { name: "Customers", how: "On a contact form, <b>Intercompany entity</b> marks the contact as one of your own companies, which is what the eliminations look for.", to: "cust" },
      { name: "Vendors", how: "Tag supplier contacts that are group companies the same way.", to: "vend" },
      { name: "Bills", how: "A bill from one of your own companies has <b>Mirror in the other company</b>, which creates the matching invoice there.", to: "inv.in" },
      { name: "Companies", how: "The companies you can put in a group, each with its own currency.", to: "companies" },
      { name: "FX Revaluation", how: "Restates foreign-currency balances inside one company; this report handles translation between companies.", to: "acc.revalue" },
      { name: "Accounting books", how: "The report uses the book you are in for every company, matched by the book's code.", to: "settings.books" }
    ],
    mistakes: [
      ["No consolidation group is defined, so this adds up every company you can open.", "Without a group the report totals everything you have access to, which may include companies you manage for others. Click Groups and create one."],
      ["This group has no companies in it yet, or none you can open. Click Groups to add them.", "The group is empty, or you do not have access to any of its companies. Add companies in Groups, or ask for access."],
      ["No exchange rate set for (currency) - those entities are shown 1:1 until you add a rate.", "A company's currency has no rate, so its figures are added as if one unit were one unit of the group currency. Click Add a rate and enter a closing rate, and an average rate if you have one."],
      ["(number) member(s) you cannot open are left out", "The group holds companies you do not have access to, so their figures are missing. Ask for access or read the report with someone who has it."],
      ["Give the group a name", "The Name box in the dialog is empty. Type a name and save again."],
      ["Put at least one company in the group", "No company is ticked. Tick the companies before saving. Saving an existing group with none ticked leaves it empty, so tick its companies again and save."],
      ["There are no intercompany eliminations", "Eliminations need posted invoices or bills whose contact has Intercompany entity set to another company in the same group. A company counted with the Equity method is not eliminated line by line."],
      ["The same account appears twice", "Accounts are added together by account code. Two companies using different codes for the same thing show as separate lines."],
      ["The Average rate is the same as the Closing rate", "No average rate is entered for that currency, so the closing rate is used for both."]
    ],
    tips: [
      "Use the same chart of account codes in every company in the group so the lines add up neatly.",
      "Group figures are as of today. Print a copy on the day you need them."
    ]
  },

  "rep.health": {
    title: "Data Health Check",
    what: "The <b>Data Health Check</b> runs thirteen automatic checks on this company's books and marks each one <b>PASS</b>, <b>REVIEW</b> or <b>FAIL</b>, so a problem is found here instead of in a report later. It checks that the ledger balances, that what customers and suppliers owe agrees with open invoices and bills, that every posted document and payment has its journal entry, that stock and cash are not below zero, and that nothing has been forgotten in draft. It reads posted entries up to today in the book you are in, and every invoice, bill, payment and stock move of the company.",
    when: [
      "At every month end, before you read the reports.",
      "After importing data, such as opening balances or a list of old invoices.",
      "When a report looks wrong and you want to know where to start looking."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Data Health Check</b>. For this example, a builders' merchant runs it after importing its opening balances. You should see <i>Running checks...</i> for a moment.",
      "Read the coloured banner. Green says <i>All checks passed - the books are internally consistent.</i>, or <i>No integrity problems</i> with a number of items to review. Red says how many checks need attention and to <i>see the red rows below</i>.",
      "Read the table: <b>Check</b>, <b>Result</b> and <b>Detail</b>. Here most rows are PASS, one is FAIL and one is REVIEW.",
      "The FAIL row is <i>Receivables (4100) tie to open invoices</i> with the detail <i>Ledger 12,400.00 vs open invoices 11,900.00</i>. The ledger has 500.00 more than the open invoices explain.",
      "Find the difference: open Statement of Account, choose For an account, type 4100 and look for a line that is not an invoice or payment, such as an imported opening balance or a manual journal entry of 500.00.",
      "The REVIEW row is <i>No forgotten draft invoices / bills</i> with <i>3 still in draft (not in the ledger or on statements)</i>. Open Invoices and Bills, then post the ones that are real and delete the rest.",
      "Fix what you found, then open Data Health Check again from the menu to run the checks afresh. There is no refresh button.",
      "When the banner is green, your reports are built on consistent data.",
      "Click <span class='man-key'>Export</span> to keep the results as a CSV file, or <span class='man-key'>Print</span>."
    ],
    fields: [
      ["Book", "The ledger checks read the book you are in; the picker on this screen does not switch it. The invoice, payment and stock checks read the whole company.", "optional"]
    ],
    buttons: [
      ["Export", "Downloads the checks table as a CSV file."],
      ["Print", "Opens your browser's print window."]
    ],
    links: [
      { name: "Trial Balance", how: "The totals behind <b>Trial balance balances</b>.", to: "rep.tb" },
      { name: "Balance Sheet", how: "The report that <b>Balance Sheet balances</b> checks.", to: "rep.bs" },
      { name: "Statement of Account", how: "Read account 4100, 4000 or 4700 line by line to find a difference.", to: "rep.stmt" },
      { name: "Invoices", how: "Where forgotten drafts and duplicate numbers are fixed.", to: "inv.out" },
      { name: "Bills", how: "The same for supplier bills.", to: "inv.in" },
      { name: "Journal Entries", how: "Where draft entries are posted and correcting entries are made.", to: "moves" },
      { name: "Stock Moves", how: "Where the moves behind negative stock can be found.", to: "inv.moves" }
    ],
    mistakes: [
      ["Trial balance balances: FAIL", "Total debits and total credits in the ledger differ. Orbit does not post unbalanced entries, so pass the Detail line to whoever looks after your books."],
      ["Balance Sheet balances: FAIL", "Assets do not equal liabilities plus equity plus the result, by more than 0.50. The Detail line shows the four figures."],
      ["Receivables (4100) tie to open invoices: FAIL", "The receivable account and the open posted customer invoices differ by more than 0.50. Common causes: a manual journal or imported balance on 4100, an open credit note (not counted in the invoice side), or a foreign-currency invoice (its open amount is in its own currency). Read account 4100 in Statement of Account."],
      ["Payables (4000) tie to open bills: FAIL", "The same check for suppliers and open posted bills. Look for manual journals on 4000, open refunds or foreign-currency bills."],
      ["Every posted document has a journal entry: FAIL", "The Detail lists up to five document numbers that are marked posted but have no entry, so they are missing from the ledger. Pass the numbers to whoever looks after your books."],
      ["No negative stock on hand: FAIL", "More has left your stock locations than arrived for the number of products shown. Usually a receipt was never recorded. Check the product's Stock Moves."],
      ["Suspense (4700) is cleared: FAIL", "Value is parked in Suspense / to allocate, for example from stock received directly. Allocate the receipt or payment, or clear it with a journal entry."],
      ["No negative cash / bank balances: FAIL", "The Detail names the cash or bank account and its minus balance. Look for a missing receipt or a payment posted twice."],
      ["Every payment has a journal entry: FAIL", "A payment exists with no entry behind it, so it is not in the ledger."],
      ["No duplicate document numbers: FAIL", "Two documents of the same kind share a number; the Detail lists up to six. Correct the duplicates."],
      ["No stranded draft journal entries: REVIEW", "Journal entries saved but never posted, so not in the ledger. Post or delete them in Journal Entries."],
      ["No forgotten draft invoices / bills: REVIEW", "Invoices or bills still in draft. Post the real ones and delete the rest."]
    ],
    tips: [
      "REVIEW rows are amber: they are not errors, only drafts worth a look.",
      "The account checks use the standard codes 4100 (customers), 4000 (suppliers) and 4700 (suspense)."
    ]
  },

  "rep.trace": {
    title: "Traceability",
    what: "<b>Traceability</b> follows purchases from the <b>Material Take-off</b> where they began, through the RFQ, the purchase order, the goods receipt and the supplier bill, to the entry in the ledger, and flags every break in the chain. <span class='man-key'>Seal</span> stores a fingerprint of the chain as it is now; <span class='man-key'>Verify</span> later checks whether it still matches, so you can show that the documents were not changed after the fact.",
    when: [
      "A client or auditor asks you to prove what was ordered, received and billed for a job.",
      "You want to see where a job's purchasing has stalled: never ordered, not received, not billed or not posted.",
      "At a milestone or handover, to seal the purchasing record of a project."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Reporting &rsaquo; Traceability</b>. For this example, a facade contractor checks its <i>Riverside Offices</i> project. It opens on <b>All projects</b>.",
      "Choose <i>Riverside Offices</i> in the project list. You should see <i>Building lineage...</i>, then a line saying <i>Not sealed yet</i>, then one card per take-off.",
      "Read a card. The heading is the take-off number and title. Under it, <b>RFQ:</b> shows the RFQ numbers linked to it.",
      "Below come the purchase orders: <b>PO</b> with its number, a status label and its total. Under each PO, <b>Receipt:</b> shows each goods receipt with its date, and <b>Bill</b> shows each bill with its total and, after the arrow, <i>GL posted</i> with the entry's reference.",
      "Look for amber labels, which are breaks: <i>no RFQ (bought direct?)</i>, <i>not ordered - no PO traced to this take-off</i>, <i>not received</i>, <i>not billed</i> or <i>not posted to GL</i>.",
      "Fix each break in its own screen, for example receive the goods on the order or post the draft bill. Then open Traceability again from the menu and choose the project, which rebuilds the chain.",
      "When the chain is complete, click <span class='man-key'>Seal</span>. You should see a message such as <i>Sealed #1 - 14 documents</i> followed by the start of the fingerprint, and the line above the cards reads <i>Last sealed: #1</i> with the date, the document count and the fingerprint.",
      "Weeks later, choose the same project and click <span class='man-key'>Verify</span>. A box reading <i>Verified intact.</i> means nothing covered by the seal has changed.",
      "If it reads <i>TAMPER DETECTED.</i>, a document in the chain was edited, added or removed since the seal. Find it, then seal again once the change is explained."
    ],
    fields: [
      ["Project", "Which project's take-offs to show, or All projects. Each choice is sealed and verified separately.", "auto"]
    ],
    buttons: [
      ["Seal", "Stores a fingerprint of the chain shown, numbered #1, #2 and so on for that project, with who sealed it and when. Each seal also keeps the fingerprint of the one before."],
      ["Verify", "Rebuilds the chain, works out its fingerprint again and compares it with the latest seal for the same project."]
    ],
    after: "Seal adds a record of the fingerprint to the company; it changes none of the documents. Verify only reads. The fingerprint covers each document's identity and number, each purchase order's status and total, each receipt's origin, and each bill's total, status and ledger entry. Normal progress, such as confirming an order, receiving goods or posting a bill, also changes it.",
    links: [
      { name: "Material Take-off", how: "Every chain starts here; a take-off with nothing after it shows as not ordered.", to: "pur.req" },
      { name: "RFQ / Compare Quotes", how: "An RFQ made from a take-off, or mentioning its number in its note, joins the chain.", to: "rfq.list" },
      { name: "Purchase Orders", how: "An order made from the take-off or its RFQ, or mentioning either number in its note, joins the chain.", to: "po.list" },
      { name: "Bills", how: "A bill created from the purchase order joins the chain under that order.", to: "inv.in" },
      { name: "Journal Entries", how: "The ledger entry of each bill is the last link.", to: "moves" },
      { name: "Projects", how: "The project list the picker is filled from.", to: "proj.list" }
    ],
    mistakes: [
      ["No take-offs yet. The chain starts at a Material Take-off.", "No take-off exists for the company, or for the chosen project. Traceability only follows purchases that began as a take-off."],
      ["not ordered - no PO traced to this take-off", "No purchase order was made from the take-off or its RFQ, and none mentions their numbers in its note. Create the order from the take-off or RFQ so the link is kept."],
      ["not received", "The purchase order has no goods receipt. Receive the goods against the order."],
      ["not billed", "No bill was created from the purchase order. Use Create Bill on the order."],
      ["not posted to GL", "The bill is still a draft. Open it and click Confirm &amp; post."],
      ["No seal yet for this scope - Seal it first.", "You clicked Verify for a project that has never been sealed. Seals are per project, and All projects is separate."],
      ["TAMPER DETECTED.", "The chain no longer matches the latest seal. This includes normal steps taken since sealing, such as a new receipt or a posted bill. Check what changed and seal again."],
      ["Run migration 95 (traceability) first to enable sealing.", "The part of the database that stores seals is not installed. Ask whoever administers Orbit to install it."]
    ],
    tips: [
      "Seal when a chain is complete, for example after the last bill is posted, so later progress does not show as a change.",
      "Edits that do not touch the fields listed above, such as a line description, do not change the fingerprint."
    ]
  }

});
