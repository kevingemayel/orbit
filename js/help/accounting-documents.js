/* Orbit screen help: Accounting, the dashboards, the customer and vendor
 * documents, their payments and the customer and vendor records.
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

  "dashboard": {
    title: "Dashboard",
    what: "The <b>Dashboard</b> is the front page of Accounting: the money of the company you are working in, at a glance. Four figures add up the balances in your ledger (cash and bank, what customers owe, what you owe suppliers, and income less expenses), three charts are drawn from your posted customer invoices, and a table lists the invoices that are overdue. Nothing is typed in here, and drafts never count.",
    when: [
      "First thing in the morning, to see how much cash there is and who is late paying.",
      "Before paying suppliers, to set what you owe against the cash you hold.",
      "When you want to start a new invoice or bill in one click.",
      "When you are chasing customers: the overdue table puts the oldest debt first."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Dashboard</b>. Accounting opens here by default. For this example you run a homeware shop that also sells to hotels on account.",
      "Read the four figures along the top. Say <b>Cash &amp; Bank</b> shows 18,400.00, <b>Receivable</b> 6,250.00 and <b>Payable</b> 4,100.00: once every supplier is paid you would still hold 14,300.00, before any customer pays you.",
      "Look at the <b>Receivables aging</b> chart. If 1,900.00 sits in <b>31-60 days</b>, some customers are between one and two months late.",
      "Scroll to <b>Overdue invoices</b>. The heading gives the total and the count, for example <i>2,400.00 across 3 invoices</i>, and each row shows the customer, the invoice number, the due date and how many days late it is.",
      "Click the oldest row. The invoice opens, so you can check what was billed and click <span class='man-key'>Email</span> to send it again.",
      "When that customer pays, click <span class='man-key'>Register Payment</span> on the invoice and record the payment.",
      "Open the Dashboard again. You should see Receivable lower and Cash &amp; Bank higher by the amount paid, and the invoice gone from the overdue table once it is paid in full.",
      "Glance at <b>Revenue - last 6 months</b> for the trend and <b>Top customers</b> for who you bill most.",
      "Click <span class='man-key'>New Invoice</span> on the Customer Invoices card to bill someone straight away, or <span class='man-key'>New Bill</span> on the Vendor Bills card to enter a supplier's invoice."
    ],
    fields: [
      ["Cash &amp; Bank", "The total balance of every account whose type is cash or bank in the Chart of Accounts.", "auto"],
      ["Receivable", "The balance of your receivable accounts: what customers owe on posted invoices, less their payments and posted credit notes.", "auto"],
      ["Payable", "The balance of your payable accounts: what you owe suppliers on posted bills, less your payments and posted vendor credit notes.", "auto"],
      ["Net Result (YTD)", "Your income accounts less your expense accounts, as posted in the ledger. Below zero means expenses are ahead of income.", "auto"],
      ["Customer Invoices card", "Repeats the receivable figure as <i>Outstanding receivable</i>.", "auto"],
      ["Vendor Bills card", "Repeats the payable figure as <i>Outstanding payable</i>.", "auto"],
      ["Bank card", "Repeats the cash figure as <i>Cash &amp; bank balance</i>.", "auto"],
      ["Revenue - last 6 months", "The total of posted customer invoices dated in each of the last six months, tax included. Credit notes are not taken off, and invoices in other currencies are added at face value, without conversion.", "auto"],
      ["Receivables aging", "What is still owed on posted customer invoices, split by how far past the due date it is: Not due, 1-30 days, 31-60 days and 60+ days.", "auto"],
      ["Top customers", "The six customers with the highest total of posted invoices, over all dates.", "auto"],
      ["Overdue invoices", "Only shown when something is late. Posted customer invoices past their due date with money still owing, oldest first. The eight oldest are listed; the heading totals them all.", "auto"]
    ],
    buttons: [
      ["New Invoice", "On the Customer Invoices card. Opens a blank customer invoice."],
      ["New Bill", "On the Vendor Bills card. Opens a blank vendor bill."],
      ["View", "On the Bank card. Opens the list of customer payments."],
      ["A row in Overdue invoices", "Opens that invoice."]
    ],
    after: "The Dashboard only reads: it changes nothing. It shows what has been posted up to the moment you open it, so open it again after posting an invoice, a bill or a payment to see the new figures.",
    links: [
      { name: "Invoices", how: "Posted invoices make up Receivable, the revenue and aging charts and the overdue table.", to: "inv.out" },
      { name: "Bills", how: "Posted bills make up Payable.", to: "inv.in" },
      { name: "Customer Payments", how: "Payments registered on invoices lower Receivable and raise Cash &amp; Bank.", to: "pay.in" },
      { name: "Aged Receivable", how: "The full picture behind the aging chart, customer by customer, with credit notes deducted.", to: "rep.aged.recv" },
      { name: "Collections", how: "Customer invoices still unpaid, with the customer's phone and email to chase them.", to: "rep.collections" },
      { name: "Profit and Loss", how: "Income and expenses for a period you choose, account by account.", to: "rep.pl" },
      { name: "Chart of Accounts", how: "Each account's type decides which of the four figures its balance counts in.", to: "accounts" },
      { name: "Cockpit", how: "A similar overview for every company in the group at once.", to: "cockpit" }
    ],
    mistakes: [
      ["Every figure shows 0.00", "Nothing has been posted yet in this company, or you are in a different company from the one you expect. Drafts do not count: post your invoices and bills, and check which company is selected."],
      ["No posted invoices yet.", "Shown in the revenue chart until the company has at least one posted customer invoice."],
      ["An invoice you know is late is not in Overdue invoices", "Only posted invoices with money still owing and a due date before today are listed, and only the eight oldest appear. Open Aged Receivable to see every one."],
      ["Cash &amp; Bank or Receivable looks wrong", "Each figure adds accounts by their type. An account given the wrong type in the Chart of Accounts is counted in the wrong figure: open the account and correct its Type."],
      ["The aging chart and the Receivable figure disagree", "The chart only uses what is left to pay on customer invoices. The Receivable figure is the ledger balance, which also takes off posted credit notes and any other entry on the receivable account."]
    ],
    tips: [
      "The revenue and top customers charts include tax. Use Profit and Loss for income before tax.",
      "The Dashboard shows one company at a time; the Cockpit adds up every company you can open."
    ]
  },

  "cockpit": {
    title: "Cockpit",
    what: "The <b>Cockpit</b> (headed <i>Executive Cockpit</i>) puts the whole group on one page. It adds up every company you can open, in one reference currency: signed work not yet certified, cash, overdue customer money, monthly payroll and the tender pipeline. It names the projects that are over budget or losing margin, and repeats the key figures company by company.",
    when: [
      "At a management or board meeting, to see the group without switching company.",
      "To find which company holds the cash, the backlog or the problem projects.",
      "To check tender success and payroll across every company at once."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Cockpit</b>. For this example a group has a trading company that keeps its books in AED and a fit-out contractor that keeps them in USD, and the group reports in USD.",
      "Read the line under the heading: your organisation's name, <i>group-wide</i>, the currency the figures are presented in, and today's date.",
      "If a warning says <i>No exchange rate for AED</i>, the trading company's figures were added one for one. Add an AED rate in <b>Accounting &rsaquo; Configuration &rsaquo; Exchange Rates</b>, open the Cockpit again, and the warning should be gone.",
      "Read the six cards. Suppose <b>Signed backlog</b> shows USD 1,240,000.00: that is the contract value of active projects not yet certified.",
      "Check <b>Overdue receivables</b>. It turns red when anything is past due; click it to open Collections and start chasing.",
      "Read the banner under the cards. <i>Over budget: Lobby fit-out</i> means that project's actual cost has passed its cost budget. When all is well it reads <i>All active projects within budget.</i>",
      "Scroll to <b>By entity</b>. Each company has a row with its own currency, then its backlog and cash in the group currency, its number of active projects, and how many are over budget or at margin risk.",
      "Click <b>Monthly payroll</b> to open the payslip runs, or click <span class='man-key'>Print</span> to take the page to the meeting."
    ],
    fields: [
      ["Signed backlog", "For each active project, its contract value less what its certificates (other than drafts) have certified, never below zero, added across the group.", "auto"],
      ["Cash position", "The balance of every account whose code starts with 51 or 53, in every company, converted and added. Red when below zero.", "auto"],
      ["Overdue receivables", "What is still owed on posted customer invoices whose due date has passed. Red above zero, green at zero.", "auto"],
      ["Monthly payroll", "The total wage on employee contracts that are running.", "auto"],
      ["Open tenders", "The number of tenders in draft or submitted.", "auto"],
      ["Tender win rate", "Won tenders as a share of those won or lost, with the counts underneath. Open tenders do not count.", "auto"],
      ["Over budget / Margin at risk banner", "Names each active project whose actual cost is above its cost budget, and each whose certified value is below its actual cost. Actual cost is posted bills tagged to the project (before tax), stock issued to it at the product's cost price, and the labour cost of its install jobs.", "auto"],
      ["By entity", "One row per company: Entity, Cur (the company's own currency), Backlog, Cash, Active (projects), Over budget and Margin risk.", "auto"],
      ["Presented in", "The group's reference currency, or this company's currency when the group has none. Each company's figures are multiplied by the most recent rate held for its currency in Exchange Rates.", "auto"]
    ],
    buttons: [
      ["Print", "Prints the page."],
      ["Signed backlog", "Opens Project P&amp;L."],
      ["Overdue receivables", "Opens Collections."],
      ["Monthly payroll", "Opens Payslip Runs."],
      ["Open tenders / Tender win rate", "Open the Tenders list."]
    ],
    after: "The Cockpit only reads and changes nothing. It covers the companies you have access to, so two people with different access can see different totals.",
    links: [
      { name: "Exchange Rates", how: "The rates that turn each company's figures into the group currency.", to: "rates" },
      { name: "Project P&amp;L", how: "The project figures behind backlog, over budget and margin at risk.", to: "proj.pnl" },
      { name: "Collections", how: "The customer invoices behind Overdue receivables.", to: "rep.collections" },
      { name: "Payslip Runs", how: "Payroll, from the same employee contracts.", to: "hr.runs" },
      { name: "Tenders", how: "Tender statuses drive Open tenders and the win rate.", to: "est.list" },
      { name: "Consolidation", how: "The group's full accounts, with balances between your own companies eliminated.", to: "rep.cons" },
      { name: "Dashboard", how: "One company's money in more detail.", to: "dashboard" }
    ],
    mistakes: [
      ["No exchange rate for AED - those entities counted 1:1. Add a rate in Exchange Rates for accurate group figures.", "At least one company keeps its books in a currency with no rate in Exchange Rates, so its figures were added without conversion. Add a rate for that currency."],
      ["Cash position looks too low", "Only accounts whose code starts with 51 or 53 are counted. A bank or cash account numbered outside those ranges in a company's chart is left out."],
      ["A project that is over budget is not named", "The check needs the project to be active and to have a cost budget. A project with no budget is never flagged."],
      ["Signed backlog looks too high", "Certificates still in draft are not subtracted, and a project with no certificates counts its whole contract value."],
      ["A company is missing from By entity", "Only companies you have access to are included. Ask an administrator for access to that company."]
    ],
    tips: [
      "The most recent rate for each currency is used whatever its date, so bring Exchange Rates up to date before a meeting.",
      "Payroll adds the wages on running contracts; it is not what was actually paid in payslips."
    ]
  },

  "inv.out": {
    title: "Invoices",
    what: "An <b>invoice</b> is the bill you send a customer. Posting it records that they owe you: the amount shows in what customers owe, the income lands in your Profit and Loss (and in the project or building it belongs to), and the VAT counts as tax you collected. The screen lists every customer invoice; opening one shows the invoice itself.",
    when: [
      "You have delivered goods or finished a job and need to be paid.",
      "A customer asks for a copy, by email or on paper.",
      "A customer pays and you need to record it against the invoice.",
      "A posted invoice is wrong. In an open period use Edit; if goods came back or the period is closed, raise a credit note."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Customers &rsaquo; Invoices</b> and click <span class='man-key'>New</span>. For this example an office cleaning company is billing a client for four weekly cleans at 150.00 each and one deep clean at 250.00, plus 5% VAT.",
      "Choose the <b>Customer</b>. The first customer in the list is already selected when the form opens, so change it to the right one. If the client is new, choose <i>+ Add a new customer...</i> at the bottom of the list, type the name and click <span class='man-key'>Create &amp; select</span>.",
      "Set the <b>Invoice Date</b> and pick <b>Payment terms</b>, for example <i>Within 30 days</i>. The <b>Due Date</b> fills itself. If the customer has a credit limit and this invoice takes them over it, a warning appears above the form.",
      "On the first line type <i>Weekly office clean</i> in <b>Description</b>, 4 in <b>Qty</b>, 150.00 in <b>Unit Price</b> and choose the 5% tax in <b>Tax</b>. The Subtotal shows 600.00.",
      "Click <span class='man-key'>+ Add a line</span> and enter <i>Deep clean</i>, 1 and 250.00 with the same tax.",
      "If the work belongs to a job, choose the <b>Project</b>.",
      "Check the totals: Untaxed Amount 850.00, Taxes 42.50, Total 892.50.",
      "Click <span class='man-key'>Confirm &amp; post</span>. You should see <i>Posted to the ledger</i>, the stage on <b>Posted</b> and a number such as <i>INV/2026/0042</i>. The <b>Journal Items</b> tab shows 892.50 owed by the customer, 850.00 to income and 42.50 to sales VAT.",
      "Click <span class='man-key'>Email</span>, check the address in <b>To</b>, add a short message if you like and click <span class='man-key'>Send email</span>. You should see <i>Sent to</i> followed by the address.",
      "When the client pays, click <span class='man-key'>Register Payment</span>. A payment of the full 892.50 marks the invoice <b>Paid</b>."
    ],
    fields: [
      ["Customer", "Who you are billing. Only contacts marked as customers appear, and the first one is selected when a new invoice opens. <i>+ Add a new customer...</i> opens a small New customer form (Name, Email, Phone) without leaving the invoice. Choosing a customer sets Payment terms from their payment days when those days match one of the options, and checks their credit limit.", "required"],
      ["Reference", "Your own note, such as the customer's order number. It stays on the invoice form: it is not printed, not in the email, and the list search does not look at it.", "optional"],
      ["Currency", "The currency you bill in. Leave the company currency for a local invoice. In another currency, Orbit converts the amounts into your books at the rate for the invoice date from Exchange Rates, and shows the converted total under the totals.", "optional"],
      ["Book", "Which book the invoice posts into.", "optional"],
      ["Invoice Date", "The date the invoice is issued. It decides the month the income falls in and the exchange rate used. It cannot be on or before the company's lock date.", "required"],
      ["Payment terms", "Only shown on a draft. Due on receipt, Within 15, 30, 45, 60 or 90 days, or End of next month. Changing it, or the Invoice Date, works out the Due Date again.", "optional"],
      ["Due Date", "When payment is expected, worked out from the date and the terms; you can type over it. The Dashboard, Aged Receivable and Collections use it to decide what is overdue.", "auto"],
      ["Project", "The job the income belongs to, so it counts in that project's Project P&amp;L.", "optional"],
      ["Building", "Only shown when your company manages buildings. Tags the invoice to that building so it counts in the building's figures.", "optional"],
      ["Product (on a line)", "Only shown when you have products. Choosing one fills the description, its sale price, its income account and its sales tax.", "optional"],
      ["Description (on a line)", "What you are charging for, as it prints on the invoice. A line left blank is saved as <i>Service</i>.", "optional"],
      ["Revenue Account (on a line)", "Hidden until you click Show accounting detail. The income account the line posts to. It starts on the first income account in your chart (the lowest code), or on the product's income account when you pick a product, so check it when the line is unusual.", "optional"],
      ["Qty and Unit Price (on a line)", "How many, and the price of one before tax. The line's Subtotal is the two multiplied. An invoice cannot be posted with a zero total.", "required"],
      ["Tax (on a line)", "The VAT on the line, from your taxes marked for sales or for both. It is added under Taxes and posted to the sales VAT account.", "optional"],
      ["Narration (Other Info tab)", "A free note kept on the invoice. It can be changed until the invoice is posted.", "optional"],
      ["Source (Other Info tab)", "Where the invoice came from: <i>manual</i> when it was typed here.", "auto"],
      ["To (Email dialog)", "Where the email goes. Filled from the customer's Email; you can type another address.", "required"],
      ["Subject (Email dialog)", "Starts as Invoice, the number and your company name. You can change it.", "optional"],
      ["Message to the customer (Email dialog)", "A short note shown at the top of the email, above the invoice. The preview below updates as you type.", "optional"],
      ["Amount (Register Payment dialog)", "How much is being paid now, in the invoice currency. It starts at the full amount still due. Orbit never records more than the amount due.", "required"],
      ["Date (Register Payment dialog)", "The day the money arrived. It cannot be on or before the lock date.", "required"],
      ["Journal (Register Payment dialog)", "Bank or Cash: which one the money went into.", "optional"],
      ["Reference (Register Payment dialog)", "The transfer or receipt number. It shows against the payment in Customer Payments.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank invoice."],
      ["Filters and Group By (list)", "Filters show Draft, Posted, Not Paid or Paid invoices. Group By puts them under Customer, Status or Invoice Month. Search finds an invoice by its number or the customer's name."],
      ["Save draft", "Keeps the invoice as a draft you can still change. It is given its number now, but it is not in the accounts and the customer owes nothing yet."],
      ["Confirm &amp; post", "Saves the invoice and posts it to the ledger. If an approval rule covers customer invoices of this amount, it goes to the approver instead and stays a draft; once it is approved, click Confirm &amp; post again."],
      ["Discard", "Goes back to the Invoices list. Anything changed since the last save is not kept."],
      ["+ Add a line", "Adds an empty line. The x at the end of a line removes it."],
      ["Show accounting detail", "Shows the Revenue Account column on the lines. Click Hide accounting detail to hide it again."],
      ["Register Payment", "Shown on a posted invoice with money still owing. Records a payment: the amount, the date, Bank or Cash, and a reference. The invoice becomes Partial or Paid."],
      ["Add Credit Note", "Shown on a posted invoice. Creates a draft credit note dated today for the same customer, currency and lines, and opens it. Change it to what is actually being credited, then post it."],
      ["Edit", "Shown on a posted invoice to people who can manage Accounting. After you confirm, the invoice goes back to draft and out of the accounts. It keeps its number, the posted version is kept in its history, and payments already made stay paid. Post it again when you are done."],
      ["Print", "Shown once the invoice is saved. Prints it with your company details and logo, or saves it as a PDF from the print window."],
      ["Email", "Shown once the invoice is saved. Opens the email dialog with a preview of exactly what the customer receives."],
      ["Send email", "In the email dialog. Sends the invoice, written into the body of the email, to the address in To."],
      ["Mirror in the other company", "Shown on a posted invoice when the customer is tagged as one of your own companies. Creates the matching vendor bill as a draft in that company, for the same lines and total, and marks this invoice's entry as intercompany."],
      ["Open the mirror", "Shown once a mirror exists. Switches to the other company and opens the matching document."],
      ["Journal Items", "The counter and tab on a posted invoice. Shows exactly which accounts it posted to and how much."],
      ["Edited after posting (the dates)", "Shown when the invoice has been edited after posting. Each date opens what was posted before that edit."]
    ],
    after: "Posting writes one balanced entry in the sales journal: the total to Accounts Receivable against the customer, each line's amount to its income account, and the VAT to the sales VAT account. The receivable and VAT accounts are chosen in <b>Settings &rsaquo; Companies &rsaquo; Accounting accounts</b>. From then on the invoice counts in the Dashboard, Aged Receivable, Collections, the Profit and Loss, the Balance Sheet, the VAT / Tax Report and the customer's Statement of Account, and in Project P&amp;L when tagged. When the customer is tagged as one of your own companies, the entry is marked intercompany so Consolidation can eliminate it. A registered payment moves the amount from Accounts Receivable to the bank or cash account and marks the invoice Partial or Paid.",
    links: [
      { name: "Customers", how: "Every invoice belongs to a customer, whose payment days set the terms and whose credit limit is checked.", to: "cust" },
      { name: "Customer Payments", how: "Each payment registered on an invoice is listed there, and can be reversed there, which puts the amount back on the invoice.", to: "pay.in" },
      { name: "Credit Notes", how: "Add Credit Note on a posted invoice starts one with the invoice's lines.", to: "inv.outr" },
      { name: "Recurring Invoices", how: "Templates that create invoices here on a schedule.", to: "inv.recurring" },
      { name: "Aged Receivable", how: "Every posted invoice not yet fully paid, by how late it is.", to: "rep.aged.recv" },
      { name: "Statement of Account", how: "Everything posted against one customer, to send them.", to: "rep.stmt" },
      { name: "VAT / Tax Report", how: "The VAT on posted invoices is the tax you collected for the period.", to: "rep.tax" },
      { name: "Project P&amp;L", how: "An invoice tagged to a project is that project's revenue.", to: "proj.pnl" },
      { name: "Approval Rules", how: "A rule for customer invoices from an amount makes posting wait for the approver.", to: "approvals.rules" },
      { name: "Exchange Rates", how: "The rates used for invoices in another currency.", to: "rates" },
      { name: "Period Lock", how: "Invoices cannot be dated on or before the lock date set here.", to: "settings.lock" }
    ],
    mistakes: [
      ["Pick a customer", "No customer is chosen, usually because the company has no customers yet. Add one with <i>+ Add a new customer...</i> in the list."],
      ["Add at least one line", "Every line was removed. Click + Add a line and enter what you are billing."],
      ["Cannot post an invoice with a zero total. Add amounts to the lines first.", "Every line has a zero quantity or price. Enter the amounts, then post."],
      ["Period locked on/before (date) - choose a later date", "The invoice date is on or before the company's lock date. Use a later date, or ask whoever set the lock to change it in Period Lock."],
      ["Saved draft, posting failed: No receivable account is set for this company. Choose one in Settings, Companies, Accounting accounts.", "The invoice was kept as a draft. Choose the receivable account there, then click Confirm &amp; post again."],
      ["Saved draft, posting failed: This document carries VAT but no sales VAT account is set. Choose one in Settings, Companies, Accounting accounts.", "Set the sales VAT account in the same place, then post again."],
      ["Saved draft, posting failed: This company has no sales journal. Add one in Accounting, Journals.", "The company has no journal of the sales type to post invoices into. Add one, then post again."],
      ["Saved draft, posting failed: No FX rate for EUR on or before (date) (type spot)", "The invoice is in another currency with no rate on or before its date. The totals area warns you in red before you post. Add the rate in Exchange Rates, then post again."],
      ["! Over credit limit &middot; (customer) would owe (amount) against a limit of (amount) ((amount) over). You can still post it.", "Not an error. The customer's unpaid posted invoices plus this invoice's lines before tax are above the credit limit on their record. Decide whether to go ahead."],
      ["Sent for approval (amount)", "Not an error: an approval rule covers this amount. The invoice stays a draft until the approver decides; then click Confirm &amp; post again."],
      ["Already awaiting approval", "Confirm &amp; post was clicked again before the approver decided. Wait for the decision."],
      ["No valid recipient email. Add one on the customer, or type one in the box.", "The To box is empty or not an email address. Type the address, or add it to the customer's record for next time."],
      ["Could not edit: The books are closed up to (date), and this invoice is dated (date). Issue a credit note with a later date instead.", "A posted invoice in a closed period cannot go back to draft. Use Add Credit Note instead."],
      ["Someone else changed this invoice while you had it open. Your changes were not saved - reload the page to get the latest version, then re-enter them.", "Two people edited the same draft. Reload, check their changes, and make yours again."]
    ],
    tips: [
      "A draft changes nothing in your accounts. Drafts cannot be deleted from this screen, so check the customer before you save.",
      "Give customers payment days of 0, 15, 30, 45, 60 or 90 and choosing them on an invoice sets the terms for you. Other lengths leave the terms as they are.",
      "Email sends the invoice in the body of the message, not as an attachment. For a PDF, click Print and save it as PDF from the print window."
    ]
  },

  "inv.recurring": {
    title: "Recurring Invoices",
    what: "A <b>recurring invoice</b> is a template for something you bill the same customer on a schedule, such as a maintenance contract, a retainer or a rent. Each time it runs, Orbit creates a real customer invoice from the template's lines and moves the <b>Next run</b> date on by the interval. The screen lists your templates; a Next date shown in red means that template is due now.",
    when: [
      "You bill the same customer the same amount every week, month, quarter or year.",
      "A contract starts and you want its invoices raised without typing them again each time.",
      "Billing should stop for a while, or the price changes from the next cycle.",
      "Some templates are due and you want their invoices now."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Customers &rsaquo; Recurring Invoices</b> and click <span class='man-key'>New</span>. For this example a landscaping company looks after a hotel's gardens for 900.00 a month plus 5% VAT.",
      "Type a name in the title box, for example <i>Garden maintenance - Cedar Coast Hotel</i>.",
      "Choose the <b>Customer</b>. Leave <b>Currency</b> on the company currency.",
      "Set <b>Repeat</b> to <i>Monthly</i> and <b>Every</b> to 1.",
      "Leave <b>Start</b> as it is, set <b>Next run</b> to 2026-10-01 (the date the first invoice should carry) and leave <b>End (optional)</b> blank for a contract with no end date.",
      "Set <b>Payment days</b> to 15, <b>On generate</b> to <i>Create as draft</i> and <b>Status</b> to <i>Active</i>.",
      "On the first line type <i>Monthly garden maintenance</i> in <b>Description</b>, 1 in <b>Qty</b>, 900.00 in <b>Price</b> and choose the 5% tax.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and <b>Next 2026-10-01</b> at the top of the form. In the list the template shows <i>Every month</i>, the next date, <i>draft</i> and <i>yes</i>.",
      "To raise the first invoice now, click <span class='man-key'>Generate invoice now</span>. You should see <i>Invoice generated</i> and a draft invoice open, dated 2026-10-01, due 2026-10-16, with Reference <i>Recurring: Garden maintenance - Cedar Coast Hotel</i> and a total of 945.00.",
      "Check the draft and click <span class='man-key'>Confirm &amp; post</span>. Back on the template, Next run now reads 2026-11-01."
    ],
    fields: [
      ["Name (title box)", "What the template is for, for example <i>Monthly maintenance - Tower A</i>. Each generated invoice's Reference reads <i>Recurring:</i> followed by this name. Left blank, it is saved as <i>Recurring</i>.", "optional"],
      ["Customer", "Who each invoice is billed to. Only contacts marked as customers appear. The template saves without one, but the invoices it creates then have no customer, so always choose one.", "optional"],
      ["Currency", "The currency of the invoices it creates. It starts on the company currency.", "optional"],
      ["Repeat", "Weekly, Monthly, Quarterly or Yearly.", "optional"],
      ["Every", "How many of those periods between invoices: 2 with Monthly means every two months, shown in the list as <i>Every 2 months</i>.", "optional"],
      ["Start", "When the arrangement began, kept for your records. The schedule runs from Next run.", "optional"],
      ["Next run", "The date the next invoice is created and dated. It starts on today and moves on by the interval each time an invoice is generated. A template is due when this date is today or earlier.", "auto"],
      ["End (optional)", "The last date an invoice may be created. Once Next run is later than this date, Generate due now and the automatic run skip the template.", "optional"],
      ["Payment days", "Days from the invoice date to its due date. It starts at 30.", "optional"],
      ["On generate", "<i>Create as draft</i> leaves each invoice for you to check and post. <i>Post automatically</i> posts it into the accounts straight away.", "optional"],
      ["Status", "<i>Active</i> runs on schedule. <i>Paused</i> stops it without losing anything; the list shows it as paused.", "optional"],
      ["Product (on a line)", "<i>(custom line)</i> or one of your products. Choosing a product fills the Description if it is empty, the sale price, and the product's sales tax.", "optional"],
      ["Description (on a line)", "What the invoice line says. A line with neither a description nor a product is dropped when you save.", "optional"],
      ["Qty and Price (on a line)", "The quantity (starting at 1) and the unit price before tax, the same every cycle.", "optional"],
      ["Tax (on a line)", "No tax, or one of the taxes marked for sales.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank template."],
      ["Generate due now", "On the list, for people who can manage Accounting. Creates one invoice for every active template whose Next run is today or earlier and whose end date has not passed, and moves each Next run on. You should see, for example, <i>3 invoice(s) generated</i>, or <i>Nothing due right now</i>."],
      ["Filters and Group By (list)", "Filters show Active, Due now or Paused templates. Group By puts them under their Customer."],
      ["Save", "Saves the template and its lines. The lines are replaced by what is on screen."],
      ["Discard", "Goes back to the list without saving."],
      ["Generate invoice now", "Only on a saved template. Saves it first, then creates one invoice dated the Next run date, opens that invoice, and moves Next run on. It works even when the template is paused or past its end date."],
      ["+ Add line", "Adds an empty line. The x at the end of a line removes it."]
    ],
    after: "A template on its own changes nothing in the books. Each run creates a customer invoice numbered in the normal invoice sequence (for example <i>INV/2026/0087</i>), dated the Next run date, for the template's customer, currency and lines, and due after the payment days. As a draft it waits in Invoices. Posted automatically, it goes into the ledger exactly like an invoice you post yourself, and counts in the Dashboard, Aged Receivable and the VAT / Tax Report. The lines carry no account of their own, so posting uses the company's default income account. Due templates are also generated when someone who can manage Accounting opens Orbit, with a message such as <i>2 recurring invoice(s) generated</i>.",
    links: [
      { name: "Invoices", how: "Every invoice a template creates lands there, as a draft or posted.", to: "inv.out" },
      { name: "Customers", how: "The customer each template bills.", to: "cust" },
      { name: "Products", how: "A product on a line brings its sale price and sales tax.", to: "products" },
      { name: "Taxes", how: "Only taxes marked for sales can be chosen on a template line.", to: "taxes" },
      { name: "Aged Receivable", how: "Posted recurring invoices count in what customers owe.", to: "rep.aged.recv" }
    ],
    mistakes: [
      ["Add at least one line first", "Generate invoice now found no lines on the template. Add a line with a description or a product, save, and try again. If another message appeared just before this one, that message is the real reason."],
      ["Nothing due right now", "No active template has a Next run of today or earlier. To raise one early, open it and click Generate invoice now."],
      ["Save failed", "The changes to the template were refused. Reload the page and try again."],
      ["Lines: (reason)", "The template was saved but its lines were not. Correct the lines and save again."],
      ["A template is several cycles behind", "Each run creates one invoice per template and moves Next run on once. Click Generate due now again until its Next run is in the future."],
      ["Recurring invoice (number) was created but not posted: (reason)", "Post automatically is chosen, but posting was refused, for example because an account, a VAT account or an exchange rate is missing. The same reason also arrives as a notification. Fix the cause, open the draft in Invoices and click Confirm &amp; post."],
      ["Post automatically is chosen, but the invoice waits for approval", "Not an error: an approval rule covers customer invoices of this amount, so the generated invoice goes to the approver like one posted by hand. Once it is approved, open it and click Confirm &amp; post."],
      ["The generated invoice has no customer", "The template was saved without a Customer. Choose one on the template, and on the draft invoice before posting it."]
    ],
    tips: [
      "There is no delete for a template: set Status to Paused to stop it.",
      "Changing the lines or price only affects invoices created from now on; invoices already created keep their own lines.",
      "A tax marked for both sales and purchases does not appear in the Tax list here; only taxes marked for sales do."
    ]
  },

  "inv.outr": {
    title: "Credit Notes",
    what: "A <b>credit note</b> is the reverse of a customer invoice: it cancels all or part of what a customer was billed. Posting one takes the amount off what the customer owes, takes the income back out of your Profit and Loss and reduces the VAT you collected. The screen lists every customer credit note; opening one shows the credit note, which works like an invoice.",
    when: [
      "Goods came back, or a service was not delivered, after the invoice was posted.",
      "A posted invoice overcharged the customer and its period is closed, so Edit is refused.",
      "You agree a discount or refund with a customer after invoicing.",
      "An invoice was posted twice and one copy must be cancelled."
    ],
    how: [
      "Open the posted invoice from <b>Accounting &rsaquo; Customers &rsaquo; Invoices</b>. For this example a building-supplies wholesaler invoiced a contractor for 20 bags of tile adhesive at 12.00 plus 11% VAT, a total of 266.40, and 5 bags came back.",
      "Click <span class='man-key'>Add Credit Note</span>. You should see <i>Credit note created (draft)</i> and a draft credit note with a number such as <i>RINV/2026/0003</i>, dated today, for the same customer, with the invoice's lines and a <b>Reference</b> reading <i>Credit note for INV/2026/0041</i>.",
      "Change the <b>Qty</b> on the adhesive line from 20 to 5. Leave the unit price and the tax as they are.",
      "Set the <b>Invoice Date</b> to the day the goods came back, if that was not today.",
      "If the invoice was tagged to a <b>Project</b> or <b>Building</b>, choose it again: those tags are not copied.",
      "Check the totals: Untaxed Amount 60.00, Taxes 6.60, Total 66.60.",
      "Click <span class='man-key'>Confirm &amp; post</span>. You should see <i>Posted to the ledger</i> and the stage on <b>Posted</b>.",
      "Open the <b>Journal Items</b> tab: 60.00 debited to the income account, 6.60 debited to sales VAT and 66.60 credited to what the customer owes.",
      "Click <span class='man-key'>Email</span> to send it to the customer, or <span class='man-key'>Print</span> for a paper copy.",
      "Open <b>Aged Receivable</b>. If the contractor had paid nothing yet, they now owe 199.80. The original invoice still shows 266.40 due, because the credit note is not matched to it."
    ],
    fields: [
      ["Customer", "Who is being credited. Filled from the invoice when you use Add Credit Note. Only contacts marked as customers appear, and on a new credit note the first one is selected, so check it.", "required"],
      ["Reference", "Filled with <i>Credit note for</i> and the invoice number when created from an invoice. It stays on the form: it is not printed and not searched.", "optional"],
      ["Currency", "Copied from the invoice. A credit note should be in the same currency as the invoice it cancels.", "optional"],
      ["Book", "Which book the credit note posts into.", "optional"],
      ["Invoice Date", "The credit note's date, today when created from an invoice. It decides the month the income is reduced in. It cannot be on or before the lock date.", "required"],
      ["Payment terms", "Only shown on a draft. Changing it, or the date, works out the Due Date again.", "optional"],
      ["Due Date", "Today when created from an invoice. Aged Receivable uses it to decide which column the credit sits in.", "auto"],
      ["Project", "Tag the credit note to the same job as the invoice so the job's revenue is reduced. Not copied from the invoice.", "optional"],
      ["Building", "Only shown when your company manages buildings. Not copied from the invoice.", "optional"],
      ["Product (on a line)", "Only shown when you have products. Copied from the invoice lines.", "optional"],
      ["Description (on a line)", "What is being credited. A line left blank is saved as <i>Service</i>.", "optional"],
      ["Revenue Account (on a line)", "Hidden until you click Show accounting detail. The income account the line reduces, copied from the invoice line.", "optional"],
      ["Qty and Unit Price (on a line)", "What is being credited, before tax. Reduce them to credit only part of the invoice. A credit note cannot be posted with a zero total.", "required"],
      ["Tax (on a line)", "The VAT to give back, normally the same as on the invoice.", "optional"],
      ["Narration (Other Info tab)", "A free note, for example why the credit was given.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank credit note, for a credit that does not follow one invoice."],
      ["Filters and Group By (list)", "Filters show Draft, Posted, Not Paid or Paid; Group By puts credit notes under Customer, Status or Invoice Month. Search finds one by number or customer name."],
      ["Save draft", "Keeps the credit note as a draft you can still change. It changes nothing in the accounts."],
      ["Confirm &amp; post", "Saves and posts the credit note. Approval rules do not apply to credit notes."],
      ["Discard", "Leaves without keeping changes made since the last save. It goes to the customer Invoices list."],
      ["+ Add a line", "Adds an empty line. The x at the end of a line removes it."],
      ["Show accounting detail", "Shows the Revenue Account column on the lines."],
      ["Edit", "Shown on a posted credit note to people who can manage Accounting. Takes it back to draft, keeping its number and a copy of the posted version."],
      ["Print", "Prints the credit note with your company details, or saves it as a PDF from the print window."],
      ["Email", "Opens the email dialog: To, Subject (<i>Credit Note</i>, the number and your company name), a message, and a preview. <span class='man-key'>Send email</span> sends it."],
      ["Mirror in the other company", "Shown on a posted credit note when the customer is tagged as one of your own companies. Creates a draft document in that company with the same lines. Check its type there before posting: see Mistakes."],
      ["Journal Items", "The counter and tab on a posted credit note. Shows which accounts it posted to."]
    ],
    after: "Posting writes one entry in the sales journal, the reverse of an invoice: each line's amount debited to its income account, the VAT debited to the sales VAT account, and the total credited to Accounts Receivable against the customer. The customer's balance falls in the Receivable figure on the Dashboard, in Aged Receivable and in their Statement of Account, and the VAT / Tax Report takes it off the VAT you collected. The credit note is not matched to the original invoice: the invoice keeps its own Amount Due, and the credit note's status stays <i>Not Paid</i>, because Orbit does not register payments against credit notes.",
    links: [
      { name: "Invoices", how: "Add Credit Note on a posted invoice starts the credit note with that invoice's lines.", to: "inv.out" },
      { name: "Customers", how: "The credit note reduces what that customer owes.", to: "cust" },
      { name: "Aged Receivable", how: "Posted credit notes are taken off the customer's total.", to: "rep.aged.recv" },
      { name: "Statement of Account", how: "Shows the credit note against the customer's invoices.", to: "rep.stmt" },
      { name: "VAT / Tax Report", how: "Credit notes are netted off the VAT you collected.", to: "rep.tax" },
      { name: "Period Lock", how: "A credit note cannot be dated on or before the lock date.", to: "settings.lock" }
    ],
    mistakes: [
      ["Could not create: (reason)", "Add Credit Note could not create the draft. Read the reason, correct it (often access to Accounting), and try again."],
      ["Cannot post an invoice with a zero total. Add amounts to the lines first.", "Every line has a zero quantity or price. Enter what is being credited."],
      ["Period locked on/before (date) - choose a later date", "The credit note is dated on or before the lock date. Use a later date."],
      ["Saved draft, posting failed: No receivable account is set for this company. Choose one in Settings, Companies, Accounting accounts.", "The credit note was kept as a draft. Choose the receivable account there, then post again."],
      ["The original invoice still shows its full Amount Due", "Expected: a credit note is not matched to an invoice. What the customer owes overall is correct in Aged Receivable and their Statement of Account."],
      ["Mirror in the other company created a vendor bill, not a vendor credit note", "The mirror button creates a bill even from a credit note. Do not post that draft; enter the credit in the other company through Accounting &rsaquo; Vendors &rsaquo; Refunds instead."],
      ["Discard went to Invoices, not Credit Notes", "Discard on a credit note returns to the customer Invoices list. Open Credit Notes again from the menu."]
    ],
    tips: [
      "Keep the Reference that names the invoice, so anyone can see what the credit note cancels.",
      "To correct a posted invoice in an open period, Edit on the invoice is simpler. Use a credit note when the period is closed or the customer already has the invoice.",
      "Drafts cannot be deleted from this screen; a draft changes nothing in your books."
    ]
  },

  "pay.in": {
    title: "Payments",
    what: "<b>Customer Payments</b> lists the money you have received from customers: every payment registered on an invoice, and payments recorded elsewhere in Orbit, such as money taken on account at the Cash Desk. There is no New button here: you record a payment from the invoice it pays. Opening a row shows the payment, and lets you reverse it if it was wrong.",
    when: [
      "A customer says they have paid and you want to check it was recorded.",
      "A payment was recorded against the wrong invoice, on the wrong date or for the wrong amount, and needs reversing.",
      "You want the money received in a month, or from one customer."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Customers &rsaquo; Invoices</b>, click <span class='man-key'>Filters</span> and choose <i>Not Paid</i>. For this example a catering company invoiced an events agency 3,150.00 and has received 2,000.00 by bank transfer.",
      "Open the invoice and click <span class='man-key'>Register Payment</span>. The <b>Amount</b> shows 3,150.00, the full amount due.",
      "Type 2,000.00 in <b>Amount</b>, set <b>Date</b> to the day the money arrived, leave <b>Journal</b> on <i>Bank</i>, and type the transfer number, for example <i>TRF-88213</i>, in <b>Reference</b>.",
      "Click <span class='man-key'>Register</span>. You should see <i>Payment registered</i>, a <b>Partial</b> ribbon on the invoice, and 1,150.00 in its Amount Due in the list.",
      "Open <b>Accounting &rsaquo; Customers &rsaquo; Payments</b>. The newest payment is at the top: the date, the agency, TRF-88213 and 2,000.00.",
      "Click the row. The payment opens with its Amount, Date, Partner, Type <i>Customer receipt</i>, Reference and Memo, which reads <i>Payment for</i> and the invoice number.",
      "If it was wrong, click <span class='man-key'>Reverse payment</span> and confirm. You should see <i>Payment reversed</i>; the row disappears and the invoice is back to 3,150.00 due.",
      "Register the correct payment from the invoice again.",
      "To see a month's receipts, click <span class='man-key'>Group By</span> and choose <i>Month</i>."
    ],
    fields: [
      ["Date (list)", "The date the payment was recorded as received.", "auto"],
      ["Partner (list)", "The customer who paid.", "auto"],
      ["Reference (list)", "The reference typed when the payment was registered, or the memo when there was none.", "auto"],
      ["Amount (list)", "The amount, in the currency of the invoice it paid.", "auto"],
      ["Type (payment view)", "<i>Customer receipt</i> for money in.", "auto"],
      ["Memo (payment view)", "<i>Payment for</i> and the invoice number, or <i>On account</i> and the number for money taken at the Cash Desk.", "auto"],
      ["Amount (Register Payment dialog)", "How much is being paid now, in the invoice currency. It starts at the full amount still due, and Orbit never records more than that.", "required"],
      ["Date (Register Payment dialog)", "The day the money arrived. It cannot be on or before the lock date.", "required"],
      ["Journal (Register Payment dialog)", "Bank or Cash: where the money went. It decides which account the money is posted into.", "optional"],
      ["Reference (Register Payment dialog)", "The transfer or receipt number, shown in this list.", "optional"]
    ],
    buttons: [
      ["Register Payment", "On a posted invoice with money still owing. Opens the dialog to record a payment."],
      ["Register", "In the dialog. Posts the payment and matches it to the invoice."],
      ["Cancel", "Closes the dialog without recording anything."],
      ["Search and Group By (list)", "Search looks in the reference, the memo and the customer's name. Group By puts payments under Partner or Month."],
      ["Select and Export (list)", "Export downloads the list as a CSV file that opens in Excel. Select lets you tick rows and export just those."],
      ["Close", "Closes the payment view."],
      ["Reverse payment", "Only for people who can manage Accounting. After you confirm, posts a reversing entry dated today, removes the match to the invoice, puts the amount back on the invoice's Amount Due (Partial or Not Paid), and removes the payment from this list."]
    ],
    after: "Registering a payment posts an entry in the Bank or Cash journal: the money into that journal's bank or cash account, and the same amount off Accounts Receivable against the customer, matched to the invoice. The invoice's Amount Due falls and it becomes Partial or Paid, which updates the Dashboard, Aged Receivable, Collections and the customer's Statement of Account. For an invoice in another currency, the money received is converted at the payment date's rate, and any difference from the rate the invoice was booked at is posted as an exchange gain or loss. Reversing posts the opposite entry and puts the amount back on the invoice.",
    links: [
      { name: "Invoices", how: "Payments are registered from a posted invoice's Register Payment button.", to: "inv.out" },
      { name: "Aged Receivable", how: "A payment lowers what the customer still owes.", to: "rep.aged.recv" },
      { name: "Statement of Account", how: "Shows each payment against the customer's invoices.", to: "rep.stmt" },
      { name: "Cash Desk", how: "Money taken on account at the Cash Desk also appears in this list.", to: "cash.desk" },
      { name: "Bank Statements", how: "Where you check the bank's own lines against what was recorded.", to: "bank" },
      { name: "Exchange Rates", how: "The rate on the payment date is used for a payment in another currency.", to: "rates" },
      { name: "Period Lock", how: "A payment cannot be dated on or before the lock date.", to: "settings.lock" }
    ],
    mistakes: [
      ["Enter an amount", "The Amount is empty or zero. Type what was received."],
      ["Period locked on/before (date) - choose a later date", "The payment date is on or before the lock date. Use a later date."],
      ["Could not register: Nothing left to pay", "The invoice is already fully paid, perhaps by someone else a moment ago. Reload the invoice."],
      ["Could not register: Post the invoice first", "The invoice is not posted, for example it was taken back to draft with Edit. Post it, then register the payment."],
      ["Could not register: No FX rate for EUR on or before (date) (type spot)", "The invoice is in another currency and there is no rate for the payment date. Add it in Exchange Rates and try again."],
      ["Could not register: Entry not balanced: (debits) &lt;&gt; (credits)", "A foreign-currency payment produced an exchange difference and the company has no exchange gain or loss account set to post it to. Ask whoever manages the company's accounts to set them, then try again."],
      ["Could not reverse: (reason)", "The reversal was refused. Read the reason; if it mentions permission, someone who can manage Accounting must reverse it."],
      ["Reverse payment is not shown", "Only people who can manage Accounting can reverse a payment."],
      ["The amount recorded is less than what you typed", "Orbit records at most the invoice's Amount Due, so an overpayment is cut down to the amount owed."]
    ],
    tips: [
      "A payment cannot be edited. To correct one, reverse it and register it again from the invoice.",
      "A reversal is dated today, even for an old payment.",
      "Use a clear Reference such as the bank transfer number: it is what you will search for later."
    ]
  },

  "cust": {
    title: "Customers",
    what: "<b>Customers</b> are the businesses and people you sell to. Each record holds their contact details and address, the payment terms and credit limit you give them, their bank accounts, and the people you deal with there. Invoices, credit notes and recurring invoices all pick from this list, which belongs to the company you are working in.",
    when: [
      "You win a new client and are about to invoice them for the first time.",
      "A customer's address, email, tax number or bank details change.",
      "You agree payment terms or a credit limit with a customer.",
      "A customer is one of your own group companies, or the same customer buys from two of your companies.",
      "A customer has stopped buying and you want to mark them as archived."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Customers &rsaquo; Customers</b> and click <span class='man-key'>New</span>. For this example a food trading company is adding a hotel that will buy on account.",
      "Type the name in the title box, for example <i>Cedar Coast Hotel</i>. Leave <b>Contact type</b> on <i>Company (third party)</i> and <b>Company type</b> on <i>Client</i>.",
      "Fill in <b>Contact person</b> with the purchasing manager's name, their <b>Email</b> (invoices are emailed there) and the <b>Phone</b> in its three boxes: dialling code, area code and number.",
      "Enter the <b>Tax / VAT no.</b> and the address: <b>Street</b>, <b>Building</b>, <b>City</b> and <b>Country</b>.",
      "Set <b>Payment terms</b> to <i>30 days</i> and <b>Credit limit</b> to 5,000.00.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and the hotel in the list.",
      "Open the hotel again with the arrow at the start of its row. Under <b>People at Cedar Coast Hotel</b>, type a name, the role <i>Accounts</i>, a phone and an email, and click <span class='man-key'>Add person</span>. You should see <i>Person added</i>.",
      "Start an invoice in <b>Invoices</b> and choose the hotel. You should see Payment terms change to <i>Within 30 days</i>. If the invoice would take their unpaid total above 5,000.00, an Over credit limit warning appears above it.",
      "Later, click <b>Statement</b> at the top of the customer's record to see everything posted against them."
    ],
    fields: [
      ["Name (title box)", "The customer's name as it should appear on invoices.", "required"],
      ["Picture or file (tile beside the name)", "A logo or photo, used as the customer's picture in the Thumbnails and Kanban views, or a document. On a new customer the file is uploaded when you save.", "optional"],
      ["Contact type", "<i>Company (third party)</i>, <i>Freelancer (individual)</i> or <i>Employee of a company</i>. It decides which lists the record is in: a freelancer is saved as a vendor, and an employee is neither a customer nor a vendor, so saving either of those here removes the record from Customers.", "optional"],
      ["Company type", "Only for a company: Bank, Client, Insurance, Other, Subcontractor or Supplier. <i>Client</i> keeps it a customer. <i>Supplier</i> or <i>Subcontractor</i> make it a vendor instead, and it leaves this list. Bank, Insurance and Other stay customers when saved from here. After saving, a company is a customer or a vendor, not both.", "optional"],
      ["Works at", "Only for an employee: the company contact they work for. They then appear under People at that company.", "optional"],
      ["Role / title", "Their job title, for a person, for example Accountant.", "optional"],
      ["Contact person", "The person you actually talk to at the customer.", "optional"],
      ["Email", "Their email address. The Email button on an invoice or credit note sends to it unless you type another.", "optional"],
      ["Phone and Mobile", "Each in three boxes: the dialling code, the area code and the number.", "optional"],
      ["Tax / VAT no.", "Their tax registration number.", "optional"],
      ["Website", "Their website address.", "optional"],
      ["Street, Building and Floor", "The address lines.", "optional"],
      ["City", "The town or city. Towns typed before are offered as you type.", "optional"],
      ["Country", "Picked from the list.", "optional"],
      ["Payment terms", "<i>(none)</i> or one of the terms in Accounting &rsaquo; Configuration &rsaquo; Payment Terms (the standard 0 to 90 days when you have not set any). Choosing the customer on an invoice sets its terms when the days match one of the invoice's options.", "optional"],
      ["Credit limit", "The most they should owe, in the company currency. Blank or 0 means no limit. When a customer invoice would take their unpaid posted invoices above it, the invoice shows an Over credit limit warning. Posting is never blocked.", "optional"],
      ["Industry", "The sector they work in, used to group and search customers. <i>+ Add a new industry...</i> adds one to the list for your whole organisation.", "optional"],
      ["Specialty", "What they are known for. It shows under the name in the list.", "optional"],
      ["Pricelist", "<i>(default prices)</i> or a pricelist applied to this customer's sales-order lines.", "optional"],
      ["Intercompany entity", "<i>External party</i>, or one of your own companies when this customer is part of your group. Their posted invoices are then marked intercompany so Consolidation can eliminate them, and a posted invoice offers Mirror in the other company.", "optional"],
      ["Shared with the group", "Only shown when you have more than one company. Ticked, saving copies the customer into the other companies of your group, or updates the copies already there: the name, contact person, email, phones, tax number, address, industry, specialty, website, and whether they are a customer or vendor. Credit limit, payment terms, pricelist, intercompany entity, notes and bank accounts stay this company's own. Unticking unlinks this record; the copies stay where they are.", "optional"],
      ["Notes", "Anything worth remembering: terms agreed, history, useful context.", "optional"],
      ["People at (the company)", "Only on a saved company. The people you deal with there, with Name, Role, Phone and Email. <span class='man-key'>Add person</span> creates a contact linked to this company; the x unlinks one and keeps their record.", "optional"],
      ["More details", "Only shown when your organisation has added its own fields for contacts. A field marked * must be filled before you can save.", "optional"],
      ["Bank accounts tab", "Bank, Account no., IBAN and Currency for each of their accounts. A row with no bank, account number or IBAN is dropped when you save.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank customer."],
      ["The arrow at the start of a row", "Opens the customer. Clicking a Name, Industry, Email, City or Country cell edits that value in place instead: Enter or Tab saves it (you should see <i>Saved</i>) and Esc cancels."],
      ["Filters, Group By and Search (list)", "The Archived filter shows archived customers. Group By puts customers under Industry, City or Country. Search looks in the name, email, city, country, industry and specialty."],
      ["List, Thumbnails and Kanban (list)", "Switch between a table, picture tiles and cards."],
      ["Select (list)", "Tick rows, then Export selected, Archive or Delete them together, or Clear the selection."],
      ["Export (list)", "Downloads the list as a CSV file that opens in Excel."],
      ["Save", "Saves the customer and returns to the list."],
      ["Discard", "Returns to the list without saving."],
      ["Archive / Restore", "On a saved customer, for people who can manage the app. Archive marks the customer Archived; Restore makes them active again. Nothing is deleted."],
      ["Delete", "On a saved customer. Deletes it after you confirm, but only when it is not used on any document."],
      ["Invoices", "The counter at the top of a saved customer: how many customer invoices they have. Clicking it opens the Invoices list."],
      ["Statement", "Opens the Statement of Account for this customer."],
      ["+ Add bank account", "Adds a row on the Bank accounts tab. The x on a row removes it."]
    ],
    after: "Saving a customer changes no figures in your books. The record feeds the Customer list on invoices, credit notes and recurring invoices, sets an invoice's payment terms, drives the credit limit warning, and supplies the address the Email button sends to. With Shared with the group ticked, the other companies' copies are updated too, and the message says how many, for example <i>Saved, and updated in 1 other company</i>. A customer used on any document cannot be deleted; archive them instead.",
    links: [
      { name: "Invoices", how: "Invoices are raised for a customer from this list.", to: "inv.out" },
      { name: "Credit Notes", how: "Credit notes reduce what a customer owes.", to: "inv.outr" },
      { name: "Recurring Invoices", how: "Templates that bill a customer on a schedule.", to: "inv.recurring" },
      { name: "Statement of Account", how: "Everything posted against a customer.", to: "rep.stmt" },
      { name: "Payment Terms", how: "The options offered in Payment terms.", to: "acc.payterms" },
      { name: "Pricelists", how: "The pricelists that can be given to a customer.", to: "sale.pricelists" },
      { name: "Contacts", how: "The same records together with vendors and other contacts, with filters for intercompany and shared contacts.", to: "contacts" },
      { name: "Consolidation", how: "Uses Intercompany entity to eliminate trade between your own companies.", to: "rep.cons" }
    ],
    mistakes: [
      ["Name is required", "The title box is empty. Type the customer's name."],
      ["(field) is required.", "One of your organisation's own fields under More details is marked as required. Fill it in."],
      ["This customer is used in other records - it can't be deleted. Archive it instead.", "The customer is on an invoice or another document. Use Archive."],
      ["Someone else changed this customer while you had it open. Your changes were not saved - reload the page to get the latest version, then re-enter them.", "Two people edited the record at once. Reload, then make your changes again."],
      ["The customer disappeared from the list after saving", "Contact type or Company type moved it: Supplier, Subcontractor or Freelancer make it a vendor, and Employee of a company takes it off both lists. Find it in Contacts and set Company type back to Client."],
      ["No Over credit limit warning on an invoice", "The warning only appears once the customer's unpaid posted invoices plus the new invoice's lines before tax go above the limit. Credit notes and drafts are not counted."],
      ["Payment terms did not change on the invoice", "The invoice offers 0, 15, 30, 45, 60 and 90 days. Terms of another length, such as 21 days, are not applied: set the Due Date by hand."]
    ],
    tips: [
      "Each company keeps its own customer list. If a customer buys from two of your companies, tick Shared with the group instead of typing them again.",
      "Add the email address when you create the customer, so the first invoice can be emailed straight away."
    ]
  },

  "inv.in": {
    title: "Bills",
    what: "A <b>bill</b> is the invoice a supplier sends you. Recording it here says you owe them money: once it is posted, the amount shows in what you owe, the cost lands in your expenses (and in the project or building it belongs to), and the VAT you paid counts toward your VAT return. The screen lists every bill; opening one shows the bill itself.",
    when: [
      "A supplier's invoice arrives, by email or on paper, for goods or services you bought.",
      "Goods on a purchase order have been delivered and invoiced. Start from the order instead: its <span class='man-key'>Create Bill</span> button copies the lines for you.",
      "A regular cost needs recording, such as rent, electricity, a subscription or an accountant's fee.",
      "You want to see what you owe a supplier, pay a bill, or check which accounts a bill posted to."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Vendors &rsaquo; Bills</b> and click <span class='man-key'>New</span>. For this example, a stationery supplier has invoiced 50 boxes of paper at 5.00 each plus 11% VAT.",
      "Pick the <b>Vendor</b>. The first vendor in the list is already selected when the form opens, so make sure it is the right one. If the supplier is new, choose <i>+ Add a new supplier...</i> at the bottom of the list, type the name and click <span class='man-key'>Create &amp; select</span>.",
      "Type the supplier's own invoice number in <b>Reference</b>, for example <i>INV-4471</i>, so the bill on screen can be matched to the paper later.",
      "Set the <b>Bill Date</b> to the date printed on the supplier's invoice, and choose the <b>Payment terms</b>. The <b>Due Date</b> fills itself.",
      "On the first line, type <i>Printer paper</i> in <b>Description</b>, 50 in <b>Qty</b>, 5.00 in <b>Unit Price</b> and choose the 11% VAT in <b>Tax</b>. If the paper is a product you keep in Orbit, pick it in <b>Product</b> instead and its cost price, expense account and purchase tax fill in.",
      "If the cost belongs to a job, choose the <b>Project</b>, and a <b>Cost Code</b> if you budget by cost code.",
      "Check the totals at the bottom against the paper: Untaxed Amount 250.00, Taxes 27.50, Total 277.50.",
      "Click <span class='man-key'>Confirm &amp; post</span>. You should see <i>Posted to the ledger</i>, the stage on <b>Posted</b>, the number the bill was given when it was saved, such as <i>BILL/2026/0004</i>, and a <b>Journal Items</b> tab showing 250.00 to the expense account, 27.50 to purchase VAT and 277.50 owed to the supplier.",
      "When you pay the supplier, open the bill again and click <span class='man-key'>Register Payment</span>."
    ],
    fields: [
      ["Vendor", "The supplier who sent the bill. Only contacts marked as vendors appear, and the first is selected when a new bill opens. <i>+ Add a new supplier...</i> opens a small New supplier form (Name, Email, Phone) without leaving the bill. Choosing a vendor sets Payment terms from their payment days when those days match one of the options.", "required"],
      ["Reference", "The number printed on the supplier's invoice. It stays on the bill form for matching to the paper: it is not printed, and the list search does not look at it (search finds the bill number and the vendor's name).", "optional"],
      ["Currency", "The currency the supplier billed in. Leave the company currency for a local bill. With another currency, Orbit converts the amounts into your books at that date's rate from Exchange Rates and shows both figures under the totals.", "optional"],
      ["Book", "Which book the bill posts into, normally Statutory.", "optional"],
      ["Bill Date", "The date on the supplier's invoice. It decides which month the cost falls in and which exchange rate is used. It cannot be on or before the company's lock date.", "required"],
      ["Payment terms", "Only shown on a draft. How long you have to pay, from Due on receipt to 90 days or the end of next month. Changing it, or the Bill Date, works out the due date again.", "optional"],
      ["Due Date", "When the bill should be paid. Worked out from the bill date and the terms; you can type over it. Aged Payable uses it to decide how soon or how late the bill is.", "auto"],
      ["Project", "The job this cost belongs to, so it counts in that project's job cost and profit and loss.", "optional"],
      ["Cost Code", "The budget bucket inside the project, such as materials or subcontract, so Job Cost can set the bill against the budget for that bucket.", "optional"],
      ["Building", "Only shown when you manage buildings. Puts the bill in that building's expenses, budget and profit and loss.", "optional"],
      ["Building cost type", "Which line of the building's annual budget the cost counts against.", "optional"],
      ["Block", "Only when the cost belongs to one block of the building. Leave it blank for a whole-building cost.", "optional"],
      ["Product (on a line)", "Only shown when you have products. Choosing one fills the description, its cost price, its expense account and its purchase tax.", "optional"],
      ["Description (on a line)", "What the line is for, as it should read in the ledger. A line left blank is saved as <i>Cost</i>.", "optional"],
      ["Expense Account (on a line)", "Hidden until you click <span class='man-key'>Show accounting detail</span>. The account the line posts to. It starts on the first expense account in your chart (the lowest code), or on the product's expense account when you pick a product, so check it for anything out of the ordinary.", "optional"],
      ["Qty and Unit Price (on a line)", "How many, and the price of one before tax. The line's Subtotal is the two multiplied. A bill cannot be posted with a zero total.", "required"],
      ["Tax (on a line)", "The VAT on the line, from your taxes marked for purchases or for both (Accounting &rsaquo; Configuration &rsaquo; Taxes). It is added under Taxes and posted to the purchase VAT account.", "optional"],
      ["Narration (Other Info tab)", "A free note kept on the bill, for example what the purchase was for. It can be changed until the bill is posted.", "optional"],
      ["Amount, Date, Journal and Reference (Register Payment dialog)", "How much is being paid (starting at the full amount still due, and never more than that), the day it was paid (not on or before the lock date), whether it left the Bank or the Cash, and the transfer or cheque number.", "required"]
    ],
    buttons: [
      ["New", "Starts a blank bill."],
      ["Filters and Group By (list)", "Filters show Draft, Posted, Not Paid or Paid bills. Group By puts them under Vendor, Status or Invoice Month. Search finds a bill by its number or the vendor's name."],
      ["Save draft", "Keeps the bill as a draft you can still change. A draft is not in the accounts and does not count in what you owe."],
      ["Confirm &amp; post", "Posts the bill to the ledger, so it counts in Aged Payable, the VAT report and your profit and loss. If an approval rule covers bills of this amount, it goes to the approver first and stays a draft; once it is approved, click Confirm &amp; post again."],
      ["Discard", "Goes back to the list. Anything changed since the last save is not kept."],
      ["+ Add a line", "Adds an empty line. The x at the end of a line removes it."],
      ["Show accounting detail", "Shows the Expense Account column on the lines. Click Hide accounting detail to hide it again."],
      ["Register Payment", "Shown on a posted bill with money still owing. Records a payment: the amount (the full balance unless you change it), the date, whether it left the Bank or the Cash, and a reference. The bill becomes Partial or Paid."],
      ["Add Refund", "Shown on a posted bill. Creates a draft vendor credit note with the same vendor, currency and lines, dated today, for when the supplier credits you. Change the lines to what was actually credited, then post it."],
      ["Edit", "Shown on a posted bill to people who can manage Accounting. Takes it back to draft so you can correct it. It keeps its number, the version posted before is kept in its history, and anything already paid stays paid. Confirm &amp; post again when you are done."],
      ["Print", "Shown once the bill is saved. Prints the bill, or saves it as a PDF from the print window."],
      ["Mirror in the other company", "Only on a posted bill whose vendor is tagged as one of your own companies. Creates the matching customer invoice in that company as a draft, so group reports can cancel the pair out."],
      ["Open the mirror", "Shown once a mirror exists. Switches to the other company and opens the matching invoice."],
      ["Journal Items", "The counter and tab on a posted bill. Shows exactly which accounts it posted to and how much."],
      ["Edited after posting (the dates)", "Shown when the bill has been edited after posting. Each date opens what was posted before that edit."]
    ],
    after: "Posting writes one balanced entry in the purchase journal: each line's amount to its expense account, the VAT to the purchase VAT account, and the total to Accounts Payable against the vendor. The payable and VAT accounts are chosen in <b>Settings &rsaquo; Companies &rsaquo; Accounting accounts</b>. From then on the bill counts in Aged Payable, the Profit and Loss, the Balance Sheet, the VAT / Tax Report, the vendor's Statement of Account and, when tagged, the project's Job Cost and the building's expenses. A payment then moves the amount from Accounts Payable to the bank or cash account and marks the bill Partial or Paid.",
    links: [
      { name: "Purchase Orders", how: "A confirmed order's <span class='man-key'>Create Bill</span> starts the bill with the order's lines, so nothing is typed twice.", to: "po.list" },
      { name: "3-Way Match", how: "Compares each order with what was received and what was billed, so you only pay for what arrived.", to: "pur.match" },
      { name: "Vendors", how: "Every bill belongs to a vendor, and their payment days choose the terms.", to: "vend" },
      { name: "Refunds", how: "Add Refund on a posted bill starts a vendor credit note with the bill's lines.", to: "inv.inr" },
      { name: "Supplier Payments", how: "Each payment registered on a bill is listed there and can be reversed from there, which puts the amount back on the bill.", to: "pay.out" },
      { name: "Aged Payable", how: "Every posted bill not yet fully paid, grouped by how soon or how late it is due.", to: "rep.aged.pay" },
      { name: "VAT / Tax Report", how: "The VAT on posted bills is the tax you can reclaim for the period.", to: "rep.tax" },
      { name: "Job Cost", how: "A bill tagged to a project and cost code is the actual cost set against that project's budget.", to: "proj.jobcost" },
      { name: "Approval Rules", how: "A rule for vendor bills from an amount makes posting wait for the named approver.", to: "approvals.rules" },
      { name: "Plot", how: "A bill tagged to a building counts in that building's expenses and annual budget.", to: "plot.expenses" }
    ],
    mistakes: [
      ["Pick a vendor", "No vendor is chosen, usually because the company has no vendors yet. Add the supplier with <i>+ Add a new supplier...</i> in the list."],
      ["Cannot post an invoice with a zero total. Add amounts to the lines first.", "Every line has a zero quantity or price. Enter the amounts from the supplier's invoice."],
      ["Period locked on/before (date) - choose a later date", "The bill date is on or before the company's lock date. Use a later date, or ask whoever set the lock to change it in Period Lock."],
      ["Saved draft, posting failed: No payable account is set for this company. Choose one in Settings, Companies, Accounting accounts.", "The bill was kept as a draft. Choose the payable account there, then click Confirm &amp; post again."],
      ["Saved draft, posting failed: This document carries VAT but no purchase VAT account is set. Choose one in Settings, Companies, Accounting accounts.", "Set the purchase VAT account in the same place, then post again."],
      ["Saved draft, posting failed: This company has no purchase journal. Add one in Accounting, Journals.", "The company has no journal of the purchase type to post bills into. Add one, then post again."],
      ["Saved draft, posting failed: The line &quot;(description)&quot; has no account, and this company has no default expense account. Choose an account on the line, or set one in Settings, Companies, Accounting accounts.", "The company has no active expense account to put on the line. Add one in Chart of Accounts, or set a default expense account for the company, then post again."],
      ["Saved draft, posting failed: No FX rate for EUR on or before (date) (type spot)", "The bill is in a foreign currency with no rate on or before the bill date. The totals area warns you in red before you post. Add the rate in Accounting, Configuration, Exchange Rates, then post again."],
      ["Sent for approval (amount)", "Not an error: an approval rule covers this amount. The bill stays a draft until the approver decides; then click Confirm &amp; post again."],
      ["Already awaiting approval", "Confirm &amp; post was clicked again before the approver decided. Wait for the decision."],
      ["Saved draft, posting failed: (amount) is already paid on (bill), more than its new total of (amount). Raise the total, or reverse a payment first.", "You edited a paid bill below what was already paid. Raise the total, or reverse a payment in Supplier Payments first."],
      ["Could not edit: The books are closed up to (date), and this bill is dated (date). Issue a credit note with a later date instead.", "A posted bill in a closed period cannot go back to draft. Use Add Refund with a later date instead."],
      ["The same bill appears twice", "Before entering a bill, Group By Vendor in the list and compare the dates and totals with the paper. A duplicate that is already posted is cancelled with Add Refund."]
    ],
    tips: [
      "Type the supplier's invoice number in Reference: it is the quickest way to match a bill on screen to the paper in your file.",
      "A draft changes nothing in your accounts, so it is safe to save one and finish it later. Drafts cannot be deleted from this screen.",
      "A bill is only a cost in the month of its Bill Date, so use the date on the paper rather than the day you type it in."
    ]
  },

  "inv.inr": {
    title: "Refunds",
    what: "A <b>vendor credit note</b> (the list is headed Vendor Credit Notes) records a supplier cancelling all or part of a bill: goods returned, an overcharge, or a discount given after the bill. Posting one takes the amount off what you owe that supplier, takes the cost back out of your expenses and reduces the VAT you can reclaim. The screen lists every vendor credit note; opening one shows the document, which works like a bill.",
    when: [
      "A supplier sends a credit note for goods you returned or that arrived damaged.",
      "A supplier agrees they overcharged on a bill you have already posted.",
      "A bill was entered and posted twice, and the second copy must be cancelled."
    ],
    how: [
      "Open the posted bill from <b>Accounting &rsaquo; Vendors &rsaquo; Bills</b>. For this example a building contractor was billed for 40 plasterboard sheets at 8.50 plus 11% VAT, and the supplier has credited 10 damaged sheets.",
      "Click <span class='man-key'>Add Refund</span>. You should see <i>Credit note created (draft)</i> and a draft with a number such as <i>RBILL/2026/0002</i>, dated today, for the same vendor, with the bill's lines and a <b>Reference</b> reading <i>Credit note for BILL/2026/0118</i>.",
      "Add the supplier's own credit note number to the Reference, for example <i>Credit note for BILL/2026/0118, CN-2291</i>.",
      "Change the <b>Qty</b> from 40 to 10, and set the <b>Bill Date</b> to the date on the supplier's credit note.",
      "If the bill was tagged to a <b>Project</b>, <b>Cost Code</b> or <b>Building</b>, choose them again: those tags are not copied.",
      "Check the totals: Untaxed Amount 85.00, Taxes 9.35, Total 94.35.",
      "Click <span class='man-key'>Confirm &amp; post</span>. You should see <i>Posted to the ledger</i> and the stage on <b>Posted</b>.",
      "Open the <b>Journal Items</b> tab: 94.35 debited to what you owe the supplier, 85.00 credited to the expense account and 9.35 credited to purchase VAT.",
      "Open <b>Aged Payable</b>. What you owe the supplier is 94.35 lower. The original bill keeps its own Amount Due, because the credit note is not matched to it."
    ],
    fields: [
      ["Vendor", "The supplier giving the credit. Filled from the bill when you use Add Refund. On a new credit note the first vendor is selected, so check it.", "required"],
      ["Reference", "Filled with <i>Credit note for</i> and the bill number when created from a bill. Add the supplier's own credit note number. It stays on the form: it is not printed and not searched.", "optional"],
      ["Currency", "Copied from the bill. Keep it the same as the bill being credited.", "optional"],
      ["Book", "Which set of books the refund posts into, normally Statutory.", "optional"],
      ["Bill Date", "The date on the supplier's credit note, today when created from a bill. It decides the month the cost is reduced in. It cannot be on or before the lock date.", "required"],
      ["Payment terms", "Only shown on a draft. Changing it, or the date, works out the Due Date again.", "optional"],
      ["Due Date", "Today when created from a bill. Aged Payable uses it to place the credit in a column.", "auto"],
      ["Project and Cost Code", "The job and budget bucket the cost belonged to. Not copied from the bill.", "optional"],
      ["Building, Building cost type and Block", "Only shown when you manage buildings. Not copied from the bill.", "optional"],
      ["Product (on a line)", "Only shown when you have products. Copied from the bill lines.", "optional"],
      ["Description (on a line)", "What is being credited. A line left blank is saved as <i>Cost</i>.", "optional"],
      ["Expense Account (on a line)", "Hidden until you click Show accounting detail. The expense account the line reduces, copied from the bill line.", "optional"],
      ["Qty and Unit Price (on a line)", "What the supplier credited, before tax. A credit note cannot be posted with a zero total.", "required"],
      ["Tax (on a line)", "The VAT on the credit, normally the same as on the bill.", "optional"],
      ["Narration (Other Info tab)", "A free note, for example why the supplier gave the credit.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank vendor credit note, for a credit that does not follow one bill."],
      ["Filters and Group By (list)", "Filters show Draft, Posted, Not Paid or Paid; Group By puts credit notes under Vendor, Status or Invoice Month. Search finds one by number or vendor name."],
      ["Save draft", "Keeps it as a draft you can still change. It changes nothing in the accounts."],
      ["Confirm &amp; post", "Saves and posts it. Approval rules do not apply to vendor credit notes."],
      ["Discard", "Leaves without keeping changes made since the last save. It goes to the Bills list."],
      ["+ Add a line", "Adds an empty line. The x at the end of a line removes it."],
      ["Show accounting detail", "Shows the Expense Account column on the lines."],
      ["Edit", "Shown on a posted credit note to people who can manage Accounting. Takes it back to draft, keeping its number and a copy of the posted version."],
      ["Print", "Prints it, headed Vendor Credit Note, or saves it as a PDF from the print window."],
      ["Mirror in the other company", "Shown when posted and the vendor is tagged as one of your own companies. Creates a draft document in that company with the same lines. Check its type there before posting: see Mistakes."],
      ["Journal Items", "The counter and tab on a posted credit note. Shows which accounts it posted to."]
    ],
    after: "Posting writes one entry in the purchase journal, the reverse of a bill: the total debited to Accounts Payable against the vendor, each line credited to its expense account, and the VAT credited to the purchase VAT account. What you owe the supplier falls in the Payable figure on the Dashboard, in Aged Payable and in their Statement of Account; your expenses fall in the Profit and Loss; and the VAT / Tax Report takes it off the VAT you can reclaim. It is not matched to the bill it came from, and no payment can be registered against it, so its status stays <i>Not Paid</i>.",
    links: [
      { name: "Bills", how: "Add Refund on a posted bill starts the credit note with that bill's lines.", to: "inv.in" },
      { name: "Vendors", how: "The credit reduces what you owe that vendor.", to: "vend" },
      { name: "Aged Payable", how: "Posted vendor credit notes are taken off the vendor's total.", to: "rep.aged.pay" },
      { name: "Statement of Account", how: "Shows the credit against the vendor's bills.", to: "rep.stmt" },
      { name: "VAT / Tax Report", how: "Vendor credit notes are netted off the VAT you can reclaim.", to: "rep.tax" },
      { name: "Supplier Payments", how: "Payments are registered on the bills themselves, not on the credit note.", to: "pay.out" }
    ],
    mistakes: [
      ["Could not create: (reason)", "Add Refund could not create the draft. Read the reason and try again."],
      ["Cannot post an invoice with a zero total. Add amounts to the lines first.", "Every line has a zero quantity or price. Enter what the supplier credited."],
      ["Period locked on/before (date) - choose a later date", "The date is on or before the lock date. Use a later date."],
      ["Saved draft, posting failed: No payable account is set for this company. Choose one in Settings, Companies, Accounting accounts.", "The credit note was kept as a draft. Choose the payable account there, then post again."],
      ["Saved draft, posting failed: This document carries VAT but no purchase VAT account is set. Choose one in Settings, Companies, Accounting accounts.", "Set the purchase VAT account in the same place, then post again."],
      ["The original bill still shows its full Amount Due", "Expected: a vendor credit note is not matched to a bill. What you owe the supplier overall is correct in Aged Payable and their Statement of Account."],
      ["Mirror in the other company created a customer invoice, not a credit note", "The mirror button creates an invoice even from a credit note. Do not post that draft; enter the credit in the other company through Accounting &rsaquo; Customers &rsaquo; Credit Notes instead."],
      ["Discard went to Bills, not Refunds", "Discard on a vendor credit note returns to the Bills list. Open Refunds again from the menu."]
    ],
    tips: [
      "Put the supplier's credit note number in Reference so it can be matched to their paperwork.",
      "In an open period, Edit on the bill itself is often simpler than a credit note."
    ]
  },

  "pay.out": {
    title: "Payments",
    what: "<b>Vendor Payments</b> lists the money you have paid to suppliers: every payment registered on a bill, and payments recorded elsewhere in Orbit, such as money paid out on account at the Cash Desk. There is no New button here: you record a payment from the bill it pays. Opening a row shows the payment, and lets you reverse it if it was wrong.",
    when: [
      "A supplier says they have not been paid and you want to check.",
      "A payment was recorded against the wrong bill, on the wrong date or for the wrong amount, and needs reversing.",
      "You want the payments made in a month, or to one supplier."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Vendors &rsaquo; Bills</b>, click <span class='man-key'>Filters</span> and choose <i>Not Paid</i>. For this example a hotel is paying its laundry service's bill of 1,380.00 in full by bank transfer.",
      "Open the bill and click <span class='man-key'>Register Payment</span>. The <b>Amount</b> shows 1,380.00.",
      "Set <b>Date</b> to the day the transfer left, leave <b>Journal</b> on <i>Bank</i> and type the transfer number, for example <i>TRF-5521</i>, in <b>Reference</b>.",
      "Click <span class='man-key'>Register</span>. You should see <i>Payment registered</i>, a <b>Paid</b> ribbon on the bill, and 0.00 in its Amount Due in the list.",
      "Open <b>Accounting &rsaquo; Vendors &rsaquo; Payments</b>. The payment is at the top: the date, the laundry service, TRF-5521 and 1,380.00.",
      "Click the row. The payment opens with its Amount, Date, Partner, Type <i>Vendor payment</i>, Reference and Memo, which reads <i>Payment for</i> and the bill number.",
      "If it was entered twice by mistake, open one of the two and click <span class='man-key'>Reverse payment</span>, then confirm. You should see <i>Payment reversed</i> and the row gone.",
      "To list everything paid to one supplier, click <span class='man-key'>Group By</span> and choose <i>Partner</i>."
    ],
    fields: [
      ["Date (list)", "The date the payment was recorded as made.", "auto"],
      ["Partner (list)", "The supplier paid.", "auto"],
      ["Reference (list)", "The reference typed when the payment was registered, or the memo when there was none.", "auto"],
      ["Amount (list)", "The amount, in the currency of the bill it paid.", "auto"],
      ["Type (payment view)", "<i>Vendor payment</i> for money out.", "auto"],
      ["Memo (payment view)", "<i>Payment for</i> and the bill number, or <i>On account</i> and the number for money paid at the Cash Desk.", "auto"],
      ["Amount (Register Payment dialog)", "How much is being paid now, in the bill's currency. It starts at the full amount still due, and Orbit never records more than that.", "required"],
      ["Date (Register Payment dialog)", "The day the money left. It cannot be on or before the lock date.", "required"],
      ["Journal (Register Payment dialog)", "Bank or Cash: where the money came from. It decides which account the payment is posted out of.", "optional"],
      ["Reference (Register Payment dialog)", "The transfer or cheque number, shown in this list.", "optional"]
    ],
    buttons: [
      ["Register Payment", "On a posted bill with money still owing. Opens the dialog to record a payment."],
      ["Register", "In the dialog. Posts the payment and matches it to the bill."],
      ["Cancel", "Closes the dialog without recording anything."],
      ["Search and Group By (list)", "Search looks in the reference, the memo and the supplier's name. Group By puts payments under Partner or Month."],
      ["Select and Export (list)", "Export downloads the list as a CSV file that opens in Excel. Select lets you tick rows and export just those."],
      ["Close", "Closes the payment view."],
      ["Reverse payment", "Only for people who can manage Accounting. After you confirm, posts a reversing entry dated today, removes the match to the bill, puts the amount back on the bill's Amount Due (Partial or Not Paid), and removes the payment from this list."]
    ],
    after: "Registering a payment posts an entry in the Bank or Cash journal: the amount off Accounts Payable against the supplier, matched to the bill, and the same amount out of that journal's bank or cash account. The bill's Amount Due falls and it becomes Partial or Paid, which updates the Dashboard, Aged Payable and the supplier's Statement of Account. For a bill in another currency, the money paid is converted at the payment date's rate, and any difference from the rate the bill was booked at is posted as an exchange gain or loss. Reversing posts the opposite entry and puts the amount back on the bill.",
    links: [
      { name: "Bills", how: "Payments are registered from a posted bill's Register Payment button.", to: "inv.in" },
      { name: "Aged Payable", how: "A payment lowers what you still owe the supplier.", to: "rep.aged.pay" },
      { name: "Statement of Account", how: "Shows each payment against the supplier's bills.", to: "rep.stmt" },
      { name: "Cash Desk", how: "Money paid out on account at the Cash Desk also appears in this list.", to: "cash.desk" },
      { name: "Bank Statements", how: "Where you check the bank's own lines against what was recorded.", to: "bank" },
      { name: "Period Lock", how: "A payment cannot be dated on or before the lock date.", to: "settings.lock" }
    ],
    mistakes: [
      ["Enter an amount", "The Amount is empty or zero. Type what was paid."],
      ["Period locked on/before (date) - choose a later date", "The payment date is on or before the lock date. Use a later date."],
      ["Could not register: Nothing left to pay", "The bill is already fully paid, perhaps by someone else a moment ago. Reload the bill."],
      ["Could not register: Post the invoice first", "The bill is not posted, for example it was taken back to draft with Edit. Post it, then register the payment."],
      ["Could not register: No FX rate for EUR on or before (date) (type spot)", "The bill is in another currency and there is no rate for the payment date. Add it in Exchange Rates and try again."],
      ["Could not register: Entry not balanced: (debits) &lt;&gt; (credits)", "A foreign-currency payment produced an exchange difference and the company has no exchange gain or loss account set to post it to. Ask whoever manages the company's accounts to set them, then try again."],
      ["Could not reverse: (reason)", "The reversal was refused. Read the reason; if it mentions permission, someone who can manage Accounting must reverse it."],
      ["Reverse payment is not shown", "Only people who can manage Accounting can reverse a payment."]
    ],
    tips: [
      "A payment cannot be edited. To correct one, reverse it and register it again from the bill.",
      "A reversal is dated today, even for an old payment.",
      "To pay part of a bill, change the Amount; the bill shows Partial until the rest is paid."
    ]
  },

  "vend": {
    title: "Vendors",
    what: "<b>Vendors</b> are the suppliers and subcontractors you buy from. Each record holds their contact details and address, the payment terms they give you, their bank accounts, what they can supply and how you rate them, and the people you deal with there. Bills, vendor credit notes and purchasing all pick from this list, which belongs to the company you are working in.",
    when: [
      "You are about to buy from a new supplier or give work to a new subcontractor.",
      "A supplier's bank details change before you pay them.",
      "You want to find every supplier who can provide a certain material or service.",
      "A supplier is one of your own group companies.",
      "A supplier is no longer used and you want to mark them as archived."
    ],
    how: [
      "Open <b>Accounting &rsaquo; Vendors &rsaquo; Vendors</b> and click <span class='man-key'>New</span>. For this example a facade fabricator is adding an aluminium profile supplier that gives 60-day terms.",
      "Type the name in the title box, for example <i>North Ridge Metals</i>. Leave <b>Contact type</b> on <i>Company (third party)</i> and <b>Company type</b> on <i>Supplier</i>.",
      "Fill in <b>Contact person</b>, <b>Email</b> and <b>Phone</b>, then the <b>Tax / VAT no.</b>, <b>Website</b> and address.",
      "Set <b>Payment terms</b> to <i>60 days</i>.",
      "Under <b>What they can supply</b>, tick <i>Aluminium</i>. If <i>Powder coating</i> is not in the list, type it in the box and click <span class='man-key'>Add</span>: it appears ticked.",
      "Set <b>Price rating</b> to <i>Average</i>, <b>Quality rating</b> to <i>High</i> and <b>Delivery / availability</b> to <i>Fast</i>.",
      "On the <b>Bank accounts</b> tab click <span class='man-key'>+ Add bank account</span> and enter the Bank, Account no., IBAN and Currency from the supplier's letter.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and the supplier in the list with <i>Aluminium</i> and <i>Powder coating</i> in the Supplies column.",
      "When their first bill arrives, choose them as the <b>Vendor</b> on a new bill. You should see Payment terms change to <i>Within 60 days</i>."
    ],
    fields: [
      ["Name (title box)", "The supplier's name as it appears on their invoices.", "required"],
      ["Picture or file (tile beside the name)", "A logo or photo, used as the supplier's picture in the Thumbnails and Kanban views, or a document. On a new vendor the file is uploaded when you save.", "optional"],
      ["Contact type", "<i>Company (third party)</i>, <i>Freelancer (individual)</i> or <i>Employee of a company</i>. A freelancer is saved as a vendor. An employee is neither a customer nor a vendor, so saving one here removes the record from Vendors.", "optional"],
      ["Company type", "Only for a company: Bank, Client, Insurance, Other, Subcontractor or Supplier. <i>Supplier</i> and <i>Subcontractor</i> keep it a vendor. <i>Client</i> makes it a customer instead, and it leaves this list. Bank, Insurance and Other stay vendors when saved from here. After saving, a company is a vendor or a customer, not both.", "optional"],
      ["Works at", "Only for an employee: the company contact they work for.", "optional"],
      ["Role / title", "Their job title, for a person.", "optional"],
      ["Contact person", "The person you actually deal with at the supplier.", "optional"],
      ["Email", "Their email address.", "optional"],
      ["Phone and Mobile", "Each in three boxes: the dialling code, the area code and the number.", "optional"],
      ["Tax / VAT no.", "Their tax registration number.", "optional"],
      ["Website", "Their website address.", "optional"],
      ["Street, Building and Floor", "The address lines.", "optional"],
      ["City", "The town or city. Towns typed before are offered as you type.", "optional"],
      ["Country", "Picked from the list.", "optional"],
      ["Payment terms", "<i>(none)</i> or one of the terms in Accounting &rsaquo; Configuration &rsaquo; Payment Terms. Choosing the vendor on a bill sets its terms when the days match one of the bill's options (0, 15, 30, 45, 60 or 90 days).", "optional"],
      ["Credit limit", "Kept on the record for your information. Orbit does not check it on bills.", "optional"],
      ["Industry", "The sector they work in, used to group and search vendors. <i>+ Add a new industry...</i> adds one to the list for your whole organisation.", "optional"],
      ["Specialty", "What they are known for, for example structural glazing. It shows under the name in the list.", "optional"],
      ["Pricelist", "<i>(default prices)</i> or a pricelist. It is applied to sales-order lines, so it matters only if you also sell to this contact.", "optional"],
      ["Intercompany entity", "<i>External party</i>, or one of your own companies when this supplier is part of your group. Their posted bills are then marked intercompany so Consolidation can eliminate them, and a posted bill offers Mirror in the other company.", "optional"],
      ["Shared with the group", "Only shown when you have more than one company. Ticked, saving copies the vendor into the other companies of your group, or updates the copies there: the name, contact person, email, phones, tax number, address, industry, specialty, website, and whether they are a customer or vendor. Payment terms, credit limit, pricelist, intercompany entity, notes, bank accounts, what they supply and ratings stay this company's own. Unticking unlinks this record; the copies stay.", "optional"],
      ["What they can supply", "Tick every product or service type they offer; the first three show in the Supplies column. Type a new one in the box and click Add (or press Enter); it is added to your organisation's list when you save.", "optional"],
      ["Price rating", "Very Cheap, Cheap, Average, Expensive or Very Expensive, compared with other suppliers.", "optional"],
      ["Quality rating", "Low, Medium or High.", "optional"],
      ["Delivery / availability", "In stock, Fast, Average or Slow.", "optional"],
      ["Notes", "Anything worth remembering: terms agreed, history, useful context.", "optional"],
      ["People at (the company)", "Only on a saved company. The people you deal with there, with Name, Role, Phone and Email. <span class='man-key'>Add person</span> creates a contact linked to this company; the x unlinks one and keeps their record.", "optional"],
      ["More details", "Only shown when your organisation has added its own fields for contacts. A field marked * must be filled before you can save.", "optional"],
      ["Bank accounts tab", "Bank, Account no., IBAN and Currency for each account you pay them into. A row with no bank, account number or IBAN is dropped when you save.", "optional"]
    ],
    buttons: [
      ["New", "Starts a blank vendor."],
      ["The arrow at the start of a row", "Opens the vendor. Clicking a Name, Industry, Email, City or Country cell edits that value in place instead: Enter or Tab saves it (you should see <i>Saved</i>) and Esc cancels. Clicking the Supplies cell opens the vendor."],
      ["Filters, Group By and Search (list)", "The Archived filter shows archived vendors. Group By puts vendors under Industry, City or Country. Search looks in the name, email, city, country, industry, specialty and what they supply."],
      ["List, Thumbnails and Kanban (list)", "Switch between a table, picture tiles and cards."],
      ["Select (list)", "Tick rows, then Export selected, Archive or Delete them together, or Clear the selection."],
      ["Export (list)", "Downloads the list as a CSV file that opens in Excel."],
      ["Save", "Saves the vendor and returns to the list."],
      ["Discard", "Returns to the list without saving."],
      ["Archive / Restore", "On a saved vendor, for people who can manage the app. Archive marks the vendor Archived; Restore makes them active again. Nothing is deleted."],
      ["Delete", "On a saved vendor. Deletes it after you confirm, but only when it is not used on any document."],
      ["Bills", "The counter at the top of a saved vendor: how many bills they have. Clicking it opens the Bills list."],
      ["Statement", "Opens the Statement of Account for this vendor."],
      ["+ Add bank account", "Adds a row on the Bank accounts tab. The x on a row removes it."],
      ["Add (What they can supply)", "Adds the type typed in the box, ticked."]
    ],
    after: "Saving a vendor changes no figures in your books. The record feeds the Vendor list on bills and vendor credit notes and the supplier lists used in purchasing, and sets a bill's payment terms. With Shared with the group ticked, the other companies' copies are updated too, and the message says how many. A vendor used on any document cannot be deleted; archive them instead.",
    links: [
      { name: "Bills", how: "Bills are entered for a vendor from this list.", to: "inv.in" },
      { name: "Refunds", how: "Vendor credit notes reduce what you owe a vendor.", to: "inv.inr" },
      { name: "Supplier Payments", how: "Payments made to each vendor.", to: "pay.out" },
      { name: "Purchase Orders", how: "Orders are placed with vendors from the same list.", to: "po.list" },
      { name: "Statement of Account", how: "Everything posted against a vendor.", to: "rep.stmt" },
      { name: "Payment Terms", how: "The options offered in Payment terms.", to: "acc.payterms" },
      { name: "Contacts", how: "The same records together with customers and other contacts, with filters for intercompany and shared contacts.", to: "contacts" },
      { name: "Consolidation", how: "Uses Intercompany entity to eliminate trade between your own companies.", to: "rep.cons" }
    ],
    mistakes: [
      ["Name is required", "The title box is empty. Type the supplier's name."],
      ["(field) is required.", "One of your organisation's own fields under More details is marked as required. Fill it in."],
      ["This vendor is used in other records - it can't be deleted. Archive it instead.", "The vendor is on a bill or another document. Use Archive."],
      ["Someone else changed this vendor while you had it open. Your changes were not saved - reload the page to get the latest version, then re-enter them.", "Two people edited the record at once. Reload, then make your changes again."],
      ["The vendor disappeared from the list after saving", "Company type Client makes it a customer, and Employee of a company takes it off both lists. Find it in Contacts and set Company type back to Supplier."],
      ["A contact that was both a customer and a vendor is now only one of them", "Saving the form keeps one role, decided by Company type. Keep separate records if you both buy from and sell to the same business."],
      ["Payment terms did not change on the bill", "The bill offers 0, 15, 30, 45, 60 and 90 days. Terms of another length are not applied: set the Due Date by hand."]
    ],
    tips: [
      "Fill in What they can supply for every supplier, then search the list by that word, for example <i>aluminium</i>, to see who to ask for a price.",
      "Check the Bank accounts tab against the supplier's letter before each first payment to a new account."
    ]
  }

});
