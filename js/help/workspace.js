/* Orbit screen help: the workspace screens. Settings (setup, company profile,
 * team, roles, approvals, portal, numbering, import, custom fields,
 * terminology, automations, backups, privacy, developers, appearance and the
 * platform operator's screens), Insights, Contacts, My Desk, Calendar,
 * Signatures, Knowledge and Website.
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
 *   after     what saving changes in other apps (HTML)
 *   links     [{ name, how, to: "menu.action" }]   to makes the name a link
 *   mistakes  [[the message or symptom exactly as shown, why it happens and the fix]]
 *   tips      [short extras worth knowing]
 * HTML inside the strings uses single-quoted attributes, for example
 * <span class='man-key'>Save</span> for a button name.
 */
orbitScreenHelp({

  "settings.users": {
    title: "Users &amp; Roles",
    what: "Users &amp; Roles is where you decide who from your business can sign in to your organisation in Orbit. You invite people by email, give each person a <b>role</b> that decides what they can see and do, limit them to some of your companies if you run more than one, and suspend or remove them when they leave. The <b>Team</b> table lists everyone on the team; <b>Pending invitations</b> below it lists people who have not joined yet.",
    when: [
      "A new colleague starts and needs to sign in to Orbit.",
      "Someone changes job and needs a different role, or should only work in one of your companies.",
      "A person leaves, or is away for a long time, and their access should stop.",
      "An invitation went to spam or to the wrong address and needs sending again or cancelling."
    ],
    how: [
      "Open <b>Settings &rsaquo; Users &amp; Roles</b>. For this example, a bakery group runs two companies, the shop and a wholesale arm, and its new bookkeeper should work only in the wholesale company. You should see the <b>Team</b> table with you at the top, marked <i>you</i>.",
      "Click <span class='man-key'>+ Invite teammate</span>. The <b>Invite a teammate</b> window opens.",
      "Type <i>finance@example.com</i> in <b>Email address</b>. Use the address the person will sign in with, because the invitation is matched to it.",
      "Choose <i>Administrative Manager</i> in <b>Role</b>. Only roles ranked below your own are offered.",
      "Under <b>Company access</b>, untick <b>All companies</b>, then tick only the wholesale company. This part only appears when you have more than one company.",
      "Click <span class='man-key'>Send invitation</span>. You should see <i>Invitation emailed to finance@example.com</i> and a <b>Pending invitations</b> card showing the email, the role and the company.",
      "The bookkeeper signs in, or signs up, with finance@example.com and presses <span class='man-key'>Join</span> on the invitation. Open Users &amp; Roles again: they have moved from Pending invitations into the Team table.",
      "A month later they take on the shop's books too. On their row, click <span class='man-key'>Companies</span>, tick <b>All companies</b> and click <span class='man-key'>Save</span>. You should see <i>Company access updated</i>, and the Companies column reads <i>All companies</i>.",
      "To change what they can do, pick another role in the <b>Role</b> list on their row. You should see <i>Role updated</i>.",
      "If they go on long leave, click <span class='man-key'>Suspend</span>. You should see <i>Access suspended</i>, and their row turns pale with a <b>Suspended</b> badge. <span class='man-key'>Reactivate</span> gives the access back."
    ],
    fields: [
      ["Email address (Invite a teammate)", "The address the person signs in with. The invitation only appears for someone signed in with this exact address (capitals do not matter). Inviting an address that already has a pending invitation replaces that invitation's role and companies.", "required"],
      ["Role (Invite a teammate)", "What they will be able to see and do, from the roles in Roles &amp; Permissions. Only roles ranked below yours are listed, and the list starts on Junior Engineer.", "required"],
      ["Company access (Invite a teammate)", "Only shown when your organisation has more than one company. <b>All companies</b> means every company, including ones added later. Untick it and tick the companies they may work in. Ticking none also means all companies.", "optional"],
      ["Role (on a person's row)", "Changes that person's role at once, with no Save button. It is a list only for people ranked below you, and roles at or above your rank are greyed out unless your role has full access. For anyone else the role shows as plain text.", "optional"],
      ["Company access (Companies button)", "The same tick list, for someone already on the team. A member limited to some companies only sees and works in those companies.", "optional"]
    ],
    buttons: [
      ["Manage roles &amp; permissions", "Opens Roles &amp; Permissions. Shown only when your role has full access or can manage roles."],
      ["+ Invite teammate", "Opens the Invite a teammate window. Shown only when you can manage the team: your role has full access or can manage roles, and you are not limited to some companies."],
      ["Send invitation", "Saves the pending invitation and emails it to the address. If the email fails, the message says so and the invitation still stands."],
      ["Cancel", "Closes the window without inviting anyone."],
      ["Companies", "On the row of someone ranked below you, when you have more than one company. Opens the Company access window for that person."],
      ["Save (Company access)", "Saves which companies the person can see and work in."],
      ["Suspend", "Switches the person's access off without removing them. While suspended they see none of the organisation's companies and cannot change anything. Their role and companies are kept."],
      ["Reactivate", "Shown on a suspended person. Gives their access back with the same role and companies."],
      ["Remove", "Asks you to confirm, then takes the person off the team straight away. Their work stays in Orbit, and you can invite them again later."],
      ["Resend email", "On a pending invitation. Sends the invitation email again."],
      ["Revoke", "On a pending invitation. Cancels it at once, with no confirmation, so the person no longer sees it."]
    ],
    after: "An invitation does nothing until the person accepts it. Someone new to Orbit sees a <b>You&rsquo;re invited</b> page after signing in with the invited address; someone who already uses Orbit sees a banner on their home page. Either way they press <span class='man-key'>Join</span>, and they join the team with the role and companies on the invitation. From then on the database only shows them the companies they were given, and none at all while they are suspended. Managing the team is also checked by the database: only members whose role has full access or can manage roles, and who are not limited to some companies, can invite, change roles, set company access, suspend or remove, and only for people ranked below them. The role's app and screen settings are applied by Orbit when it next loads for that person.",
    links: [
      { name: "Roles &amp; Permissions", how: "Defines each role in the Role list: what it can see and do, and its rank.", to: "settings.roles" },
      { name: "Companies", how: "The companies in the Company access list are the companies of your organisation.", to: "companies" },
      { name: "Employees", how: "Approval rules name an employee, not a team member, as the approver, and the approval email goes to that employee's work email.", to: "hr.emp" },
      { name: "Portal Access", how: "Customers, suppliers and residents get their own portal sign-in there instead. They are never team members.", to: "portal.admin" }
    ],
    mistakes: [
      ["Enter a valid email address", "The Email address box is empty or has no @ in the right place. Type the full address."],
      ["You do not have permission to invite people to this team.", "Your role has neither full access nor Can manage roles, or you are limited to some companies. Ask an Owner to send the invitation."],
      ["You can only invite people to a role below your own.", "The role you picked is ranked at or above yours. Pick a lower role, or ask someone ranked higher to invite them."],
      ["That person is already on this team.", "The address already belongs to a team member. Find them in the Team table and change their role or companies there."],
      ["That role does not exist.", "The role was deleted after the window opened. Close the window, open it again and pick a role from the fresh list."],
      ["You can only change the role of people below your own rank.", "The person is ranked at or above you. With full access the list still opens for them, but the database refuses the change. Ask someone ranked higher."],
      ["You can only assign a role below your own.", "The new role is ranked at or above yours. Pick a lower one."],
      ["You cannot change the role of the last owner. Make someone else an owner first.", "The organisation must keep an active Owner. Give another person the Owner role first, then change this one."],
      ["You do not have permission to change this member.", "Shown by Companies, Suspend or Reactivate when the person is ranked at or above you, or you cannot manage the team."],
      ["You cannot suspend the last owner.", "The only active Owner cannot be suspended. Make someone else an Owner first."],
      ["You do not have permission to remove this member.", "The person is ranked at or above you, or you cannot manage the team."],
      ["You cannot remove the last owner.", "The only active Owner cannot be removed. Make someone else an Owner first."],
      ["Invited (email) - email not sent (reason)", "The invitation was saved but the email failed. Press Resend email on it later, or tell the person to sign in with that address: the invitation waits for them either way."],
      ["The Team table shows only you", "The full team and the pending invitations are only listed for active members whose role key is owner, admin or accountant and who are not limited to some companies."],
      ["The person says they have no invitation", "They signed in with a different address. Revoke the invitation and invite the address they actually use."]
    ],
    tips: [
      "Suspend rather than remove when someone may come back: their role and company access are kept.",
      "Unticking every company does not lock anyone out. No companies ticked means all companies; use Suspend to stop access.",
      "You cannot change your own role or access here. Your row says <i>This is you</i>; ask someone ranked above you.",
      "Invite each person with their own address rather than sharing one sign-in, so approval requests and decisions show who acted."
    ]
  },

  "settings.roles": {
    title: "Roles &amp; Permissions",
    what: "A <b>role</b> is a named set of permissions you give to people on the team. For every app it says whether the person can open it (<b>View</b>), create and change things in it (<b>Manage</b>), and which parts of it are switched off. A role also has a <b>rank</b>, which decides who may manage whom, and it can hide amounts. Orbit comes with ready-made <b>Template</b> roles; you customise a copy for your organisation or build your own.",
    when: [
      "A job in your business needs its own role, for example a front desk role at a clinic that works with contacts and the calendar but never sees the accounts.",
      "A ready-made role gives too much or too little and you want to adjust it for your organisation.",
      "Someone should see the work but not the prices.",
      "You are checking why a person cannot open an app or does not see a New button."
    ],
    how: [
      "Signed in as an Owner, open <b>Settings &rsaquo; Roles &amp; Permissions</b>. For this example, a law practice wants a Paralegal role that works with contacts, documents and the calendar, can look at projects, and never sees amounts. You should see a card for each role, highest rank first, each marked <b>Template</b> or <b>Custom</b>.",
      "Click <span class='man-key'>+ New role</span>. The <b>New role</b> window opens with every app unticked.",
      "Type <i>Paralegal</i> in <b>Role name</b> and <i>Prepares files and keeps the diary</i> in <b>Description</b>.",
      "Set <b>Rank</b> to 25, between Junior Engineer (20) and Junior Administrator (30). Only people ranked above 25 can give this role to someone.",
      "Set <b>Can see money</b> to <i>No - hide all amounts</i>, and leave <b>Can manage roles</b> on <i>No</i>.",
      "In the table, tick <b>Manage</b> for Contacts, Documents and Calendar. <b>View</b> ticks itself.",
      "Tick only <b>View</b> for Projects, and under <b>Parts of it</b> untick <i>Costs &amp; P&amp;L</i> so project costs stay out of sight.",
      "Click <span class='man-key'>Save role</span>. You should see <i>Role saved</i> and a new <b>Paralegal</b> card marked Custom and No money, with Rank 25.",
      "Open <b>Users &amp; Roles</b> and give the role to a person, when you invite them or from the Role list on their row.",
      "When Orbit next loads for that person, the apps you left unticked are hidden from them and amounts show as dots."
    ],
    fields: [
      ["Role name", "What the role is called in every role list. A new role also gets a key made from this name, so two roles in your organisation cannot share a name.", "required"],
      ["Rank (higher = more senior)", "Decides who can manage whom. People can only invite others to, or give them, a role ranked below their own, and can only edit roles ranked below theirs unless their role has full access. The templates run from Junior Engineer at 20 to Owner at 100. A new role starts at 10.", "optional"],
      ["Description", "A short note on what the role is for, shown on its card.", "optional"],
      ["Can see money", "<i>No - hide all amounts</i> makes Orbit show amounts as dots instead of figures for everyone on this role. It changes what is displayed on screen.", "optional"],
      ["Can manage roles", "<i>Yes</i> lets people on this role open this screen, and manage the team in Users &amp; Roles (invite, change roles, set company access, suspend and remove people ranked below them), as long as they are not limited to some companies.", "optional"],
      ["View (per app)", "Lets people open the app. With View off, the app is hidden from their home page and menus, and Orbit refuses to open its screens.", "optional"],
      ["Manage (per app)", "Lets people create and change things in the app: for example the <span class='man-key'>New</span> button on its lists and the bulk Archive and Delete actions only appear with Manage on. Ticking Manage also ticks View.", "optional"],
      ["Parts of it (per app)", "Switches off pieces of an app while keeping the rest. Accounting: <i>Financial reports</i> (financial statements, ledgers, aged balances, the tax report, statements, consolidation, cash forecast, collections, budgets and dashboards). Projects: <i>Delivery view</i> (projects list, certificates, variations, WIP, schedule and timesheets), <i>Execution board</i> (board, My Work and tasks) and <i>Costs &amp; P&amp;L</i> (subcontracts, project P&amp;L, retention, job cost and cost codes). Employees (HR): <i>Payroll</i>. Other apps show <i>whole module</i>.", "optional"]
    ],
    buttons: [
      ["+ New role", "Opens a blank role with every app switched off."],
      ["Customize", "On a Template card. Opens the template's settings; saving creates your organisation's own copy under the same key, so everyone already on that role gets your version. The shared template does not change."],
      ["Edit", "On a Custom card. Opens your organisation's role to change it."],
      ["Delete", "On a Custom card you may edit. Asks you to confirm, then deletes the role. People on a customised template fall back to that template."],
      ["Locked", "Not a button. The role is protected (Owner, Developer and Super Admin) or, unless your role has full access, ranked at or above yours."],
      ["Save role", "Saves the role. A role saved here never has full access, whatever it was customised from."],
      ["Cancel", "Closes the window without saving."]
    ],
    after: "Roles are checked in two places. <b>In Orbit's screens</b>, View, Manage, Parts of it and Can see money decide which apps, menus, screens and buttons a person gets, from the next time Orbit loads for them. <b>In the database</b>, those ticks are not checked. What the database does check is: the companies a member was given and whether they are suspended; the rank, when someone is invited or given a role; full access or Can manage roles, for managing the team; the role key, for changing company records such as approval rules and portal access, which is accepted only from members whose role key is owner, admin or accountant; and saving roles themselves, which is accepted only from members whose role key is owner, developer or super_admin. A customised template keeps the template's key; a role made with <span class='man-key'>+ New role</span> gets a key of its own.",
    links: [
      { name: "Users &amp; Roles", how: "Where you give a role to a person, when inviting them or from their row.", to: "settings.users" },
      { name: "Approvals", how: "The Approvals inbox belongs to the Settings app, so a role without View on Settings cannot open it.", to: "approvals.inbox" },
      { name: "Portal Access", how: "Outside contacts sign in to the portal instead and never need a role.", to: "portal.admin" }
    ],
    mistakes: [
      ["Only owners and super admins can manage roles", "Your role has neither full access nor Can manage roles, so the screen will not open. Ask an Owner."],
      ["Name the role", "Role name is empty. Type a name, then click Save role again."],
      ["A role with that name already exists. Pick another name.", "Another role in your organisation already uses the key this name makes. Choose a different name, or edit the existing role."],
      ["new row violates row-level security policy for table &quot;roles&quot;", "The database only accepts new roles from members whose role key is owner, developer or super_admin. A role with Can manage roles opens the editor but cannot save. Ask an Owner to make the change."],
      ["Role saved appears, but the change is gone when you open the role again", "The same database rule, on an existing custom role: the change is not kept. Ask an Owner, Developer or Super Admin to make it."],
      ["Locked on a role you need to change", "Owner, Developer and Super Admin are protected, and roles at or above your rank are locked unless your role has full access. Ask someone ranked higher."],
      ["After customising a role, its people lose an app that is not in the table, such as Plot", "Templates such as Administrator switch every app on with one catch-all setting. Saving from this window records each app in the table separately and drops the catch-all, so apps missing from the table are off for that role."],
      ["You do not have access to that", "Someone tried to open a screen of an app their role cannot View, for example the Approvals inbox without View on Settings. Tick View for that app on their role."]
    ],
    tips: [
      "The templates are Owner (100), Developer (95), Super Admin (90), Administrator (70), Administrative Manager (60), Manager (50), Junior Administrator (30) and Junior Engineer (20, never sees money).",
      "Customise a template when one is close: people already on it pick up your copy without being moved.",
      "Before deleting a role you made with + New role, move everyone on it to another role in Users &amp; Roles.",
      "A screen a person can open is not proof they can save there: the database's own checks above still apply."
    ]
  },

  "approvals.inbox": {
    title: "Approvals",
    what: "The Approvals inbox is where sign-off requests land. When someone tries to confirm, post or approve a document that an active approval rule covers, Orbit stops, records a request here and alerts the approver. The screen shows what is <b>Awaiting you</b>, what is <b>Waiting on someone else</b>, and a <b>History</b> of past decisions.",
    when: [
      "Orbit tells you an approval is waiting on you, or an <b>Approval needed</b> alert appears in the notification bell.",
      "You raised a document and saw <i>Sent for approval</i>, and want to see who it is waiting on or chase them.",
      "A document you raised was rejected and you want the reason.",
      "You are checking who approved something and when."
    ],
    how: [
      "For this example, a logistics firm has a rule: purchase orders of 10,000 or more need sign-off, and <b>Anyone can approve</b>. The operations clerk raises a purchase order for 12,500.00 of diesel and clicks <span class='man-key'>Confirm</span>. They should see <i>Sent for approval</i> followed by the amount, and the order stays unconfirmed.",
      "The finance lead sees <i>1 approval is waiting on you</i> with a <span class='man-key'>Review</span> button, and an <b>Approval needed</b> alert in the bell. They open <b>Settings &rsaquo; Approvals</b>.",
      "Under <b>Awaiting you</b> they should see a card with the order number, <i>Purchase order</i>, the amount, and who requested it and when.",
      "They click <span class='man-key'>View doc</span>, which opens the Purchase Orders list, check the order, then come back to Approvals.",
      "They click <span class='man-key'>Approve</span>. You should see <i>Approved - the requester can now post it</i>, and the card moves to <b>History</b> marked Approved, with the approver's email.",
      "An <b>Approved</b> notification appears in the bell. The clerk opens the order and clicks <span class='man-key'>Confirm</span> again. This time it goes through.",
      "Had the finance lead clicked <span class='man-key'>Reject</span>, Orbit would have asked for a reason, which is optional. The card moves to History marked Rejected with the reason in brackets, and the clerk is shown <i>1 of your documents was rejected</i> with that reason.",
      "When a request sits under <b>Waiting on someone else</b>, click <span class='man-key'>Email approver</span> to send the named approver a one-click Approve / Reject email. You should see <i>Approval email sent to</i> followed by their address."
    ],
    fields: [
      ["Reason for rejection (optional)", "Asked when you click Reject. It is saved with the decision, shown in brackets in History and to the requester, and added to the Rejected notification.", "optional"]
    ],
    buttons: [
      ["Approval rules", "Top right. Opens Approval Rules, where you set what needs sign-off."],
      ["View doc", "Opens the screen the document belongs to, such as the Purchase Orders or Expenses list. Not shown for invoices, bills, journal entries or payslip runs."],
      ["Approve", "Only on requests that are yours to decide. Records your approval. It does not confirm or post the document: the requester repeats their action and it then goes through."],
      ["Reject", "Only on requests that are yours to decide. Asks for an optional reason and records the rejection. The document stays as it was; trying again sends a new request."],
      ["Email approver", "Emails a link to a page where the approver confirms Approve or Reject and can add a note, without signing in. It goes to the work email of the employee the rule names, or, when the rule names nobody or that employee has no work email, to an owner of the company. The link works once and expires after 14 days. Once sent, the button reads <span class='man-key'>Email again</span>, and sending again replaces the earlier link."],
      ["Set up approval rules", "Shown when there are no approvals yet. Opens Approval Rules."],
      ["Not yours to decide", "Not a button. The rule names another approver, so the card shows who it is waiting on and offers no Approve or Reject."]
    ],
    after: "Deciding only records the decision: nothing is confirmed, posted or paid by it. After approval the requester repeats what they were doing (Confirm on an order, Confirm &amp; post on an invoice or bill, Post on a journal entry, Post all on a payslip run, Approve on leave, expenses, variations and submittals, approving hours on a timesheet, saving a subcontract as Active, or Create Purchase Order on a material take-off) and Orbit lets it through, as long as the amount has not grown beyond the amount approved. A larger amount goes back for approval. Every decision stays in History with who requested it, who decided and when, and the Approved or Rejected notification appears in the bell.",
    links: [
      { name: "Approval Rules", how: "Decide which documents need sign-off, above what amount, and who approves.", to: "approvals.rules" },
      { name: "Purchase Orders", how: "Confirm on an order covered by a rule sends it here first.", to: "po.list" },
      { name: "Bills", how: "Confirm &amp; post on a bill covered by a rule waits here; the bill stays a draft until approved.", to: "inv.in" },
      { name: "Invoices", how: "Customer invoices covered by a rule wait here before they post.", to: "inv.out" },
      { name: "Journal Entries", how: "Post on a journal entry covered by a rule waits here, measured on its total debits.", to: "moves" },
      { name: "Employees", how: "The approver named on a rule is an employee; the approval email goes to their work email.", to: "hr.emp" },
      { name: "Roles &amp; Permissions", how: "Opening this inbox needs View on the Settings app.", to: "settings.roles" }
    ],
    mistakes: [
      ["Sent for approval (currency and amount)", "Not an error. A rule covers the document, so it waits here. Once it is approved, repeat the same action."],
      ["Already awaiting approval", "You tried again while the request is still pending. Wait for the decision, or press Email approver to chase it."],
      ["Only the approver named on the rule can sign this off", "The rule names someone else. If you are that person and still see <i>Not yours to decide</i>, Orbit has not matched your sign-in to that employee record: decide from the approval email instead, which Email approver sends."],
      ["This was already approved", "Someone decided it first, perhaps from the email link. The inbox refreshes to show the decision. The same applies to <i>This was already rejected</i>."],
      ["This approval has no approver email. Set an approver on the rule in Settings, or add a work email to that employee.", "Orbit found no address to email. Add a work email on the named employee, or name an approver who has one."],
      ["You do not have access to that", "Your role cannot View the Settings app, which the Approvals inbox belongs to. Ask an Owner to tick View for Settings on your role, or decide from the approval email."],
      ["A document went through without asking for approval", "Rules only apply to the action listed for each document type, when the rule is Active and the amount is at or above its threshold. Credit notes are not covered, and on a submittal <span class='man-key'>Approve w/ comments</span> is not checked. Review the rule in Approval Rules."]
    ],
    tips: [
      "Approving is not posting. The requester still has to press their button again.",
      "On a rule that names nobody, any member who can open this inbox can decide, including the person who raised the document. Name an approver when a second pair of eyes matters.",
      "The inbox shows the company's 120 most recent requests."
    ]
  },

  "approvals.rules": {
    title: "Approval Rules",
    what: "An <b>approval rule</b> says: when this kind of document reaches this amount, someone must sign it off first. While a rule applies, the action that would commit the document (confirming an order, posting a bill, approving leave) stops and sends a request to the Approvals inbox instead. Each rule covers one document type, has a threshold and can name one approver.",
    when: [
      "Large purchases should get a second pair of eyes, for example any purchase order of 5,000 or more.",
      "Journal entries or payroll should need a finance lead's sign-off before they post.",
      "Long leave, large expense claims or long timesheets should go to a manager.",
      "Every submittal needs a technical sign-off before it is approved."
    ],
    how: [
      "Open <b>Settings &rsaquo; Approval Rules</b> and click <span class='man-key'>New</span>. For this example, a dental clinic wants every supplier bill of 2,000.00 or more approved by its practice manager, who is already in Employees with a work email.",
      "Type <i>Supplier bills 2,000 and over</i> in <b>Rule name</b>.",
      "Choose <i>Vendor bill</i> in <b>Applies to</b>. The threshold label should read <b>Needs approval at or above</b> with your company currency.",
      "Type 2000 in the threshold box.",
      "Choose the practice manager in <b>Approver</b>, and leave <b>Status</b> on <i>Active</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and the rule in the list with Document <i>Vendor bill</i>, 2,000.00 under Needs sign-off at or above, the approver's name and <b>Active</b>.",
      "Add a higher tier: click <span class='man-key'>New</span>, name it <i>Supplier bills 10,000 and over</i>, choose Vendor bill, type 10000, choose the clinical director as Approver and Save. A bill that matches both rules goes to the rule with the higher threshold.",
      "Test it: enter a supplier bill for 2,400.00 and click <span class='man-key'>Confirm &amp; post</span>. You should see <i>Sent for approval</i> with the amount, the bill stays a draft, and the request appears in Approvals waiting on the practice manager, who is emailed an Approve / Reject link."
    ],
    fields: [
      ["Rule name", "A name you will recognise in the list and in the approval email. Left blank, it saves as <i>Rule</i>.", "optional"],
      ["Applies to", "The document the rule covers: Purchase order, Sales order, Vendor bill, Customer invoice, Subcontract, Variation, Expense, Journal entry, Payroll run, Leave request, Submittal, Timesheet or Purchase requisition. The next section lists the action each one stops.", "required"],
      ["Needs approval at or above", "The threshold. For most documents it is an amount in your company currency; for a Leave request it is days and for a Timesheet hours. A document at or above it needs approval, so 0 means every one. A new rule starts at 1000. For a Submittal the box is switched off and the rule applies to every one.", "optional"],
      ["Approver", "The employee who must sign off, from your employees, or <i>Anyone can approve</i>. The approval email goes to that employee's work email. With Anyone can approve, any member who can open Approvals may decide, and the email goes to an owner of the company.", "optional"],
      ["Status", "<i>Active</i> rules are checked. <i>Off</i> keeps the rule without applying it.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank rule. Shown only when your role has Manage on the Settings app."],
      ["Save", "Saves the rule. It applies from the next time someone confirms, posts or approves a matching document."],
      ["Delete", "On an existing rule. Deletes it at once, with no confirmation. Requests already raised under it stay in Approvals."],
      ["Cancel", "Closes the window without saving."]
    ],
    after: "Orbit checks the active rules at the moment a document would commit, and only there:<br><b>Purchase order</b> and <b>Sales order</b>: <span class='man-key'>Confirm</span>, on the order total.<br><b>Vendor bill</b> and <b>Customer invoice</b>: <span class='man-key'>Confirm &amp; post</span>, on the total including tax. Credit notes are not checked.<br><b>Journal entry</b>: <span class='man-key'>Post</span>, on the total debits.<br><b>Payroll run</b>: <span class='man-key'>Post all</span> on a payslip run, on the net pay of its draft payslips.<br><b>Expense</b>, <b>Variation</b> and <b>Leave request</b>: <span class='man-key'>Approve</span>, on the amount, or the days for leave.<br><b>Timesheet</b>: approving the hours, on the hours.<br><b>Subcontract</b>: saving it with Status Active, on its amount. If approval is needed it is put back to Draft.<br><b>Submittal</b>: <span class='man-key'>Approve</span>, every time.<br><b>Purchase requisition</b>: <span class='man-key'>Create Purchase Order</span> on a material take-off, on its estimated value from the last purchase price or the product cost.<br>When several rules match, the one with the highest threshold is used. Orbit adds a request to Approvals, an <b>Approval needed</b> alert to the bell, and emails the approver. After approval the same action goes through, unless the amount has grown beyond what was approved.",
    links: [
      { name: "Approvals", how: "Where the requests these rules raise are approved or rejected.", to: "approvals.inbox" },
      { name: "Employees", how: "Approvers are employees, and the approval email goes to their work email.", to: "hr.emp" },
      { name: "Purchase Orders", how: "Covered by Purchase order rules, at Confirm.", to: "po.list" },
      { name: "Bills", how: "Covered by Vendor bill rules, at Confirm &amp; post.", to: "inv.in" },
      { name: "Payslip Runs", how: "Covered by Payroll run rules, at Post all.", to: "hr.runs" },
      { name: "Requests", how: "Leave requests, covered by Leave request rules in days, at Approve.", to: "hr.leaves" },
      { name: "Expenses", how: "Covered by Expense rules, at Approve.", to: "hr.exp" },
      { name: "Timesheets", how: "Covered by Timesheet rules in hours, when the hours are approved.", to: "ts.list" },
      { name: "Subcontracts", how: "Covered by Subcontract rules, when saved as Active.", to: "sc.list" },
      { name: "Variations", how: "Covered by Variation rules, at Approve.", to: "var.list" },
      { name: "Submittals", how: "Covered by Submittal rules, at Approve.", to: "doc.subs" },
      { name: "Material Take-off", how: "Covered by Purchase requisition rules, at Create Purchase Order.", to: "pur.req" }
    ],
    mistakes: [
      ["You don&rsquo;t have permission to do that.", "The database accepts approval rules only from members whose role key is owner, admin or accountant, in companies they were given. Ask one of them to save the rule."],
      ["There is no New button", "Your role does not have Manage on the Settings app. Ask an Owner to add the rule or to change your role."],
      ["The rule is Active but a document went through without approval", "The amount was below the threshold, the rule is for another document type, or the action was not the one this rule stops (a credit note, for example, or Approve w/ comments on a submittal). Check Applies to and the threshold."],
      ["The named approver sees <i>Not yours to decide</i>", "Orbit has not matched their sign-in to the employee record, or they cannot open Approvals at all. They can always decide from the approval email: press Email approver on the request to send it again."],
      ["This approval has no approver email. Set an approver on the rule in Settings, or add a work email to that employee.", "Add a work email to the named employee in Employees, then press Email approver on the request."]
    ],
    tips: [
      "Build tiers with several rules on the same document and rising thresholds. The highest matching threshold decides the approver.",
      "Name an approver when separation matters: with Anyone can approve, the person who raised a document can approve it themselves.",
      "Switch a rule Off rather than deleting it while you are unsure. Once a rule is deleted, the requests it already raised can be decided by any member.",
      "Set thresholds so everyday items flow and only the genuinely large ones wait. Click a rule in the list to change it."
    ]
  },

  "portal.admin": {
    title: "Portal Access",
    what: "Portal Access lets people outside your business, such as a customer, a supplier, a subcontractor or the owner of a unit in a building, sign in to a separate portal that shows only their own dealings with you. Each row links one contact to the email address they sign in with. They sign in with an emailed link, so there is no password to manage. In Plot the same screen opens as <b>Resident portal access</b>.",
    when: [
      "A customer keeps asking for copies of invoices or how much they still owe.",
      "A client wants to follow their project's contract value and how much has been certified.",
      "A supplier or subcontractor wants to see the orders and bills you hold for them.",
      "Owners in a building should see their charges and announcements, and vote on open motions."
    ],
    how: [
      "Check the contact first: the portal shows what is recorded against that exact contact. For this example, a catering company wants a corporate client to see its invoices, and the client is already a contact with posted invoices.",
      "Open <b>Settings &rsaquo; Portal Access</b> and click <span class='man-key'>New</span>. The <b>Invite to portal</b> window opens.",
      "Pick the client in <b>Contact</b>. If the contact has an email saved, it fills <b>Sign-in email</b> for you.",
      "Change <b>Sign-in email</b> to the person who will actually sign in, for example <i>accounts@example.com</i>.",
      "Leave <b>They can see</b> on <i>Client</i> and <b>Status</b> on <i>Active</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Portal access saved</i> and a row with the contact, the sign-in email, <i>Client</i> and <b>Active</b>.",
      "Send the client the portal address shown in the window: your Orbit address followed by <i>/portal.html</i>. Saving does not email them.",
      "They type accounts@example.com, click <span class='man-key'>Email me a sign-in link</span> and open the link from their inbox. They should see a welcome with the contact's name and their invoices, each with its total, what is outstanding, and Paid, Open or Overdue.",
      "When the contract ends, open the row, set <b>Status</b> to <i>Off</i> and Save. Signing in then shows <i>No portal access</i>."
    ],
    fields: [
      ["Contact", "The customer, supplier or owner the access belongs to, from your contacts. Everything the portal shows is limited to this contact in this company.", "required"],
      ["Sign-in email", "The address the person signs in with. It fills from the contact's email when left empty, and you can change it. If the same address has more than one active row, the portal uses the most recently added one.", "required"],
      ["They can see", "Client, Subcontractor, Supplier, Property owner or Property tenant. It sets the label under the person's name in the portal (Owner or Tenant only shows when the contact owns a unit). It does not change what they see, which depends on the contact's own records.", "optional"],
      ["Status", "<i>Active</i> lets them in. <i>Off</i> keeps the row, but the portal no longer recognises their email.", "optional"]
    ],
    buttons: [
      ["New", "Opens the Invite to portal window. Shown only when your role has Manage on the app you opened the screen from."],
      ["Save", "Saves the access. It sends no email, so give the person the portal address yourself."],
      ["Remove", "On an existing row. Deletes the access at once, with no confirmation. To pause access instead, set Status to Off."],
      ["Cancel", "Closes the window without saving."]
    ],
    after: "Nothing in your books changes. The person can sign in straight away at your Orbit address followed by <i>/portal.html</i>: they type the sign-in email, receive a one-time link, and see only this contact's records in this company. <b>Your projects</b> lists projects where the contact is the customer, with contract value, the amount certified on certificates that are not draft, and the target completion date. <b>Invoices &amp; certificates</b> lists the contact's invoices and bills that are not draft, with total, outstanding and Paid, Open or Overdue. <b>Purchase orders</b> lists orders to the contact that are not draft. When the contact owns a unit in a Plot building, the portal adds that building: their units, charges and balance, announcements, open motions they can vote on, and the suggestions they have raised. Draft documents never appear.",
    links: [
      { name: "Contacts", how: "Every portal row belongs to a contact, and the portal shows that contact's records.", to: "contacts" },
      { name: "Invoices", how: "Invoices to the contact that are not draft appear in the portal with what is outstanding.", to: "inv.out" },
      { name: "Purchase Orders", how: "Orders to a supplier that are not draft appear in their portal.", to: "po.list" },
      { name: "Progress Certificates", how: "Certificates that are not draft count toward the certified figure on the client's projects.", to: "pc.list" },
      { name: "Owners", how: "A contact recorded as owning a unit gets the building section in the portal.", to: "plot.owners" }
    ],
    mistakes: [
      ["Pick a contact", "No contact is chosen. Pick one, or add the person as a contact first."],
      ["Enter a valid email", "Sign-in email is empty or has no @. Type the full address."],
      ["You don&rsquo;t have permission to do that.", "The database accepts portal access only from members whose role key is owner, admin or accountant. Ask one of them to save it."],
      ["No portal access", "Shown in the portal when the signed-in address has no active row. Check that Sign-in email matches the address they used (capitals do not matter) and that Status is Active."],
      ["Nothing has been shared with you yet.", "They signed in, but the contact has no projects, documents that are not draft, or units. Check that you picked the right contact."],
      ["A tenant sees no building", "The building section only appears for a contact recorded as owning a unit. Choosing Property tenant does not add it."],
      ["Someone with access to two of your companies only sees one", "The portal uses the most recently added active row for their address. Give each company's access a different sign-in email."]
    ],
    tips: [
      "Set Status to Off rather than Remove when access may return.",
      "Only use an address the contact controls: anyone who can open that inbox can sign in.",
      "Portal users are not team members and never appear in Users &amp; Roles."
    ]
  },

  "settings.setup": {
    title: "Getting started",
    what: "<b>Getting started</b> is a short checklist that gets a new company ready to use. It has six steps, each with a button that takes you to the screen where the work is done, and a progress bar showing how many are finished. Orbit ticks a step off by itself as soon as it finds the data, so there is nothing to mark by hand.",
    when: [
      "You have just created a company and want to know what to set up first.",
      "The <b>Finish setting up</b> card on the Home screen shows steps still to do and you click <span class='man-key'>Continue setup</span>.",
      "You want to check that a company is ready before your team starts entering real work."
    ],
    how: [
      "Open <b>Settings &rsaquo; Getting started</b>. For this example, you are setting up a dental clinic. You should see a count such as <b>0 / 6</b> and six numbered steps, each marked <b>To do</b> or <b>Done</b>.",
      "On <b>Company profile</b>, click <span class='man-key'>Open company profile</span>. Type the clinic's registered name in <b>Legal / registered name</b>, choose the <b>Country</b> and <b>Currency</b>, enter the <b>City</b> and click <span class='man-key'>Save</span>.",
      "Go back to Getting started. You should see the step marked <b>Done</b> with a tick, and its button now reads <span class='man-key'>Review</span>.",
      "On <b>Document numbering</b>, click <span class='man-key'>Set numbering</span>. Check the prefixes, for example keep INV for customer invoices, and click <span class='man-key'>Save</span>. Saving once completes the step, even if you change nothing.",
      "On <b>Tax rates</b>, click <span class='man-key'>Add tax rates</span> and add the VAT rate the clinic charges. If your country has a pack in Company Profile, applying it adds the standard rates for you.",
      "On <b>Your team</b>, click <span class='man-key'>Add people</span> and add at least one employee, for example the practice manager.",
      "On <b>First customer</b>, click <span class='man-key'>Add a customer</span> and add a patient or client you will bill.",
      "On <b>First project</b>, click <span class='man-key'>Create a project</span> and create one piece of work, for example <i>Surgery room refurbishment</i>.",
      "Return to Getting started. You should see <b>6 / 6</b>, a full bar and the message <b>You are all set up.</b> The Finish setting up card no longer appears on the Home screen."
    ],
    fields: [
      ["Company profile", "Done once the company has a <b>Legal / registered name</b>, a <b>Country</b> and a <b>Currency</b> saved in Company Profile.", "auto"],
      ["Document numbering", "Done once Document Numbering has been saved at least once for this company.", "auto"],
      ["Tax rates", "Done once the company has at least one tax rate.", "auto"],
      ["Your team", "Done once the company has at least one employee.", "auto"],
      ["First customer", "Done once the company has at least one contact marked as a customer.", "auto"],
      ["First project", "Done once the company has at least one project.", "auto"],
      ["Progress (for example 2 / 6)", "How many steps are done, with a bar. Worked out again each time the checklist opens.", "auto"]
    ],
    buttons: [
      ["Open company profile", "Shown while the Company profile step is to do. Opens Company Profile."],
      ["Set numbering", "Shown while the Document numbering step is to do. Opens Document Numbering."],
      ["Add tax rates", "Shown while the Tax rates step is to do. Opens the list of taxes."],
      ["Add people", "Shown while the Your team step is to do. Opens Employees."],
      ["Add a customer", "Shown while the First customer step is to do. Opens Customers."],
      ["Create a project", "Shown while the First project step is to do. Opens Projects."],
      ["Review", "Shown instead on a step that is done. Opens the same screen so you can check or change what you entered."],
      ["Continue setup (Home screen)", "On the Finish setting up card above the apps, shown to people who can manage Settings until every step is done. Opens this checklist."],
      ["Hide (Home screen)", "Removes the Finish setting up card for this company in this browser. The checklist itself stays in Settings."]
    ],
    after: "Nothing is saved on this screen. Each step's status is read from the company's own data every time the checklist opens: the three profile fields, whether numbering has been saved, and whether at least one tax rate, employee, customer and project exist. The checklist belongs to the company you are in, so a second company has its own count. The Home screen card uses the same count and stops appearing once all six steps are done.",
    links: [
      { name: "Company Profile", how: "Step 1. The legal / registered name, country and currency complete it.", to: "settings.profile" },
      { name: "Document Numbering", how: "Step 2. Saving it once completes it.", to: "settings.numbering" },
      { name: "Taxes", how: "Step 3. One tax rate completes it.", to: "taxes" },
      { name: "Employees", how: "Step 4. One employee completes it.", to: "hr.emp" },
      { name: "Customers", how: "Step 5. One customer completes it.", to: "cust" },
      { name: "Projects", how: "Step 6. One project completes it.", to: "proj.list" }
    ],
    mistakes: [
      ["A step still says To do after you filled it in", "Each step looks for specific data in the company you are in now. Company profile needs the legal / registered name and the country as well as the currency, so a profile with only a short name stays To do. Also check that the company picker in the top bar shows the company you set up."],
      ["Document numbering stays To do although the defaults suit you", "The step only counts once numbering has been saved for this company. Open Document Numbering and click Save without changing anything."],
      ["The Finish setting up card has gone from the Home screen", "Either every step is done, someone clicked Hide in this browser, or your role cannot manage Settings. The checklist is still in Settings &rsaquo; Getting started."]
    ],
    tips: [
      "The checklist counts records, it does not judge them: one test customer ticks First customer. If you delete your test records before going live, the step shows To do again.",
      "Each company in your organisation has its own checklist, so switch company before starting on the next one."
    ]
  },

  "settings.profile": {
    title: "Company Profile",
    what: "<b>Company Profile</b> holds the details of the company you are working in: its names, tax number, country and currency, contact details, logo and the look of printouts. What you enter here is printed on invoices, bills, orders, certificates, payslips and reports, so it is worth filling in carefully once. It also keeps a few company-wide settings, such as the default sales markup, loyalty points for the till and the WPS payroll codes.",
    when: [
      "You are setting up a new company and want its documents to carry the right name, address and tax number.",
      "Your address, phone number, logo or VAT number has changed.",
      "You want to change how printouts look: the header layout, accent colour or footer note.",
      "You want to add your country's standard tax rates, reprice every product from its cost, or set loyalty points for the till."
    ],
    how: [
      "Open <b>Settings &rsaquo; Company Profile</b>. For this example, you run a bakery in Manchester that is registered for VAT.",
      "Under <b>Identity</b>, type <i>Northside Bakery</i> in <b>Company name</b>, <i>Northside Bakery Ltd</i> in <b>Legal / registered name</b>, a short <b>Tagline</b> such as <i>Baked fresh every morning</i>, and your VAT number in <b>VAT / Tax number</b>.",
      "Choose <i>United Kingdom</i> in <b>Country</b>. You should see <b>Currency</b> change to GBP if it was still on USD, and the <b>Localization</b> card show the United Kingdom pack: currency GBP, fiscal ID VAT Reg. No., dates DD/MM/YYYY and the taxes VAT 20% and VAT 5% (reduced).",
      "Click <span class='man-key'>Apply United Kingdom pack</span>. You should see <b>Applied United Kingdom pack &middot; 4 tax rate(s) added &middot; Save to keep the format</b>. The tax rates are added straight away; the fiscal ID label and formats are kept when you save.",
      "Under <b>Tax &amp; accounting</b>, set <b>VAT / sales-tax registered</b> to <i>Yes - we charge tax</i> and choose the month in <b>Fiscal year starts</b>.",
      "Under <b>Contact</b>, type the street and number in <b>Address line 1</b>, <i>Manchester</i> in <b>City</b>, the shop's number in <b>Phone</b> and <i>orders@example.com</i> in <b>Email</b>.",
      "Under <b>Print template</b>, click <span class='man-key'>Upload logo</span> and choose your logo file. Pick the <b>Accent band</b> layout, set an <b>Accent colour</b> and type <i>Thank you for your custom</i> in <b>Footer note</b>. You should see the <b>Live preview</b> change as you go.",
      "Click <span class='man-key'>Save</span> at the top of the page. You should see <b>Company profile saved</b>.",
      "Open a customer invoice and print it. You should see the logo, <i>Northside Bakery Ltd</i>, the tagline, the address and <b>VAT Reg. No.</b> with your number at the top, and the footer note at the bottom."
    ],
    fields: [
      ["Company name", "The short name used across Orbit, for example in the company picker. Left blank, the name already saved is kept. Printouts use the legal name instead when one is set.", "optional"],
      ["Legal / registered name", "The name on your registration. Printed on documents and reports in place of the company name. Getting started needs it to tick off the profile step.", "optional"],
      ["Tagline", "A few words, up to 90 characters, printed under the company name on documents and reports.", "optional"],
      ["VAT / Tax number", "Your VAT or tax registration number. It prints on documents after your country's fiscal ID label, for example VAT Reg. No. in the United Kingdom or TRN in the United Arab Emirates, or VAT when the country has no pack.", "optional"],
      ["Country", "Where the company is registered, from the list. A country with a built-in pack shows that pack under Localization, fills in its currency while Currency is still USD, and sets the fiscal ID label printed before your tax number. Getting started needs it.", "optional"],
      ["Currency", "The ledger currency of this company. New invoices and bills default to it, and a document in another currency is converted into it.", "optional"],
      ["Localization", "A summary of the chosen country's pack: currency, fiscal ID label, date format and standard tax rates, with <b>applied</b> once you have applied it. A country without a pack says so, and you set the currency and taxes yourself.", "auto"],
      ["VAT / sales-tax registered", "Yes or No: whether this company is registered to charge VAT or sales tax. Recorded on the profile.", "optional"],
      ["Industry", "Your line of business, chosen from the list. Recorded on the profile.", "optional"],
      ["Fiscal year starts", "The month your financial year begins, January unless you change it. Recorded on the profile.", "optional"],
      ["Default sales markup %", "The markup used by <span class='man-key'>Apply to product prices</span>: sale price = cost x (1 + markup / 100). Shows 30 until you save another figure. Saving the figure does not reprice anything by itself.", "optional"],
      ["Loyalty points per 100 spent", "Points a chosen customer earns at the Point of Sale till for every 100 of the sale after discounts and before VAT, rounded down. 0 turns earning off.", "optional"],
      ["Loyalty value per point", "What one point is worth when a customer redeems points at the till. While it is 0, the till does not offer to redeem points.", "optional"],
      ["WPS employer ID", "Your Ministry of Labour or establishment number, for the WPS salary file exported from a payslip run (GCC countries).", "optional"],
      ["WPS employer bank code", "The routing code of the bank that pays your salaries, written into the WPS file header.", "optional"],
      ["Address line 1", "Street and building. Printed on documents and reports.", "optional"],
      ["Address line 2", "Unit or floor. Saved on the profile and shown in the live preview.", "optional"],
      ["City", "The town or city. Printed after the address, with the country. The profile cannot be saved without it.", "required"],
      ["State / Region", "Saved on the profile.", "optional"],
      ["Postal code", "Saved on the profile.", "optional"],
      ["Website", "Printed with your phone number and email on documents and reports.", "optional"],
      ["Phone", "Dialling code, area code and number, in three boxes. Printed as Tel followed by the number.", "optional"],
      ["Phone 2", "A second number, printed after the first.", "optional"],
      ["Email", "The company's email address, printed on documents and reports.", "optional"],
      ["LinkedIn, Instagram, Facebook, X (Twitter), YouTube", "Links to your company's pages. Saved on the profile.", "optional"],
      ["Logo", "An image file such as PNG or JPG. Orbit shrinks it to at most 400 pixels wide and prints it on documents and reports while Show logo is Yes.", "optional"],
      ["Accent colour", "The colour of the lines, bands and highlights on printouts.", "optional"],
      ["Show logo", "Yes prints the logo; No leaves it off every printout.", "optional"],
      ["Footer note", "A short line printed at the bottom of documents and reports next to your company details, for example payment instructions or a thank you.", "optional"],
      ["Layout (Classic, Centered, Accent band, Minimal, Side rule)", "How the header of a page or report printed with Print or Ctrl+P is arranged. Invoices, bills, orders, certificates and payslips keep their own document layout but use the same logo, details, accent colour and footer note.", "optional"]
    ],
    buttons: [
      ["Save", "Saves everything on the page for this company. The city must be filled in."],
      ["Apply (country) pack", "Shown when the chosen country has a pack. Adds its standard tax rates straight away, one for sales and one for purchases each (for example VAT 20% and VAT 20% (purchase)), skipping any with the same name that already exist. It also sets Currency to the pack's currency and records the fiscal ID label and formats, which are kept when you click Save."],
      ["Apply to product prices", "Asks you to confirm, then sets the sale price of every product that has a cost to cost plus the Default sales markup %, rounded to 2 decimals. Prices change at once, without waiting for Save."],
      ["Upload logo / Change", "Opens a file picker to choose the logo image."],
      ["Remove", "Takes the logo off. Click Save to keep the change."]
    ],
    after: "Saving updates the company straight away, and everything printed afterwards uses the new details: the header and footer of pages and reports printed with Print or Ctrl+P, and the head and foot of invoices, bills, orders, certificates and payslips. The legal name replaces the company name on printouts, and the tax number is labelled with your country's fiscal ID label. Applying a country pack adds tax rates to the company's tax list at once, ready for invoices and bills. Apply to product prices rewrites sale prices in Products at once. Nothing on this screen posts to the ledger.",
    links: [
      { name: "Getting started", how: "The Company profile step is ticked once the legal / registered name, country and currency are saved.", to: "settings.setup" },
      { name: "Taxes", how: "Applying a country pack adds its standard sale and purchase rates here.", to: "taxes" },
      { name: "Products", how: "Apply to product prices rewrites the sale price of every product that has a cost.", to: "products" },
      { name: "Invoices", how: "Printed invoices carry the logo, legal name, tagline, address, tax number and footer note.", to: "inv.out" },
      { name: "Point of Sale", how: "The till earns and redeems loyalty points using the two loyalty settings.", to: "pos.terminal" },
      { name: "Payslip Runs", how: "The WPS SIF export uses the WPS employer ID and bank code.", to: "hr.runs" },
      { name: "Companies", how: "The company's posting accounts are chosen there, under Accounting accounts.", to: "companies" }
    ],
    mistakes: [
      ["Enter the city", "The City box is empty. Type the town or city, then Save again."],
      ["Could not read that image", "The browser could not open the file chosen as the logo. Save the logo as a PNG or JPG and upload it again."],
      ["Could not seed taxes", "Orbit could not add the pack's tax rates, so the pack was not applied. Try again; if it keeps failing, add the rates yourself in Taxes."],
      ["Could not apply: Not authorized for this company", "Repricing products needs write access to this company: an active owner, admin or accountant who has this company in scope. Ask one of them to click Apply to product prices."],
      ["Enter a markup %", "The markup is below 0. Type a figure of 0 or more, such as 30."],
      ["No built-in pack for (country) yet - set the currency and taxes manually.", "Orbit has no pack for that country. Choose the Currency yourself and add your tax rates in Taxes."],
      ["Company profile saved, but the changes are gone after reloading", "Only an active owner, admin or accountant who has this company in scope can change the profile. For anyone else the database quietly ignores the change. Ask one of them to make it."],
      ["Address line 2, State / Region or Postal code missing from a printout", "Printed headers take Address line 1, City and Country only. Put anything that must print, such as the postcode, into Address line 1."]
    ],
    tips: [
      "Fill in the Legal / registered name even if it matches the company name: printouts use it and Getting started looks for it.",
      "Check the Live preview before saving. It uses the same header and footer as printed pages and reports.",
      "Apply to product prices changes every product that has a cost, not just new ones. Check a few prices in Products afterwards."
    ]
  },

  "settings.books": {
    title: "Accounting books",
    what: "A <b>book</b> is one view of the same company's accounts. Every company starts with two: <b>Statutory</b>, the set that gets filed, and <b>Management</b>, which shows Statutory plus anything posted only to Management. A transaction is entered once, lands in one book, and appears in every book whose view includes it. This screen lists the books and lets you add one, rename one, change which book new entries land in, or switch a book off.",
    when: [
      "You need some entries kept out of the filed accounts while still seeing them in your own figures, for example internal cost allocations or management adjustments.",
      "You want an extra view, such as an IFRS or tax book that layers its own adjustments over Statutory.",
      "You want to rename a book, reorder the list, or change where new entries land."
    ],
    how: [
      "Open <b>Settings &rsaquo; Accounting books</b>. You should see <b>Statutory</b> with a <b>Primary</b> badge and <b>Management</b>, and the <b>Shows</b> column reading <i>statutory</i> and <i>statutory + management</i>.",
      "For this example, an architecture practice wants an IFRS view: the filed figures plus a few IFRS adjustments. Click <span class='man-key'>New</span>.",
      "Type <i>IFRS</i> in <b>Name</b>. Leave <b>Code</b> blank: Orbit makes it <i>ifrs</i> from the name.",
      "Under <b>This view shows</b>, tick <b>Statutory</b> so the IFRS view starts from the filed figures. Leave Management unticked.",
      "Leave <b>Order</b> at 30 so it lists after the other two, keep <b>Active</b> on Yes, and leave <b>New entries land in this book by default</b> unticked so everyday work keeps going to Statutory.",
      "Click <span class='man-key'>Save</span>. You should see <b>Saved</b> and a new row whose <b>Shows</b> column reads <i>statutory + ifrs</i>.",
      "Record an adjustment: start a new manual journal entry in Journal Entries, choose <i>IFRS</i> in its <b>Book</b> field, then post it.",
      "Open the Profit and Loss and pick <i>IFRS</i> in the book picker beside the period. You should see the filed figures plus your adjustment, and a chip named <b>IFRS</b> in the top bar. Click the chip to go back to the primary book."
    ],
    fields: [
      ["Name", "What the book is called in pickers, in the top bar chip and on reports, for example Management or IFRS.", "required"],
      ["Code", "A short internal code in lower case; spaces and other characters become underscores. Left blank, it is made from the name. Other books refer to this code in their This view shows list. The Statutory book's code cannot be changed.", "auto"],
      ["This view shows", "Tick the other books whose entries roll up into this one. The book's own entries are always included. A management view normally ticks Statutory.", "optional"],
      ["Order", "Sorts the books in this list and in the book pickers, lowest first. Left blank, it is 30.", "optional"],
      ["Active", "No takes the book out of the book pickers on documents, journal entries and reports. Its entries stay stored.", "optional"],
      ["New entries land in this book by default", "Makes this the book that any posting goes into when nothing chooses a book, such as payments or stock. Ticking it removes the tick from every other book.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank New book form."],
      ["A row", "Opens the Edit book form for that book."],
      ["Save", "Saves the book and refreshes the book pickers and the top bar straight away."],
      ["Cancel", "Closes the form without saving."],
      ["Select, then Delete", "Tick rows, then Delete removes them for good after you confirm. A book that already holds journal entries cannot be deleted; set Active to No instead."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "A book changes which entries a report adds up, not what is recorded. When anything posts, the journal entry takes the book chosen on its invoice, bill or journal entry; with no choice it takes the book ticked as the default, and with no default, Statutory. Reports that show a book picker beside the period, such as the Profit and Loss, Balance Sheet, Trial Balance and Statement of Account, and the Journal Entries list then add up the entries of the chosen book and of every book it shows. Book pickers only appear while the company has at least two active books. Whenever you view a book other than the primary one, a chip naming it appears in the top bar.",
    links: [
      { name: "Journal Entries", how: "A manual entry's Book field decides which book it posts into, and the list shows only the entries in the book you are viewing.", to: "moves" },
      { name: "Invoices", how: "An invoice's Book field decides where it posts.", to: "inv.out" },
      { name: "Bills", how: "A bill's Book field decides where it posts.", to: "inv.in" },
      { name: "Profit and Loss", how: "Pick a book beside the period to see that view.", to: "rep.pl" },
      { name: "Balance Sheet", how: "The same book picker sits beside the period.", to: "rep.bs" },
      { name: "Audit Log", how: "Changes to invoices, payments and other records are logged whichever book they post to.", to: "settings.audit" }
    ],
    mistakes: [
      ["Give the book a name", "The Name box is empty. Type a name, then Save."],
      ["A record with Code (code) already exists. Use a different one.", "Another book in this company already uses that code, often because the code was made from a name that is already taken. Type a different Code."],
      ["Some of these are used in other records and can't be deleted.", "The book already holds journal entries, so it cannot be removed. Set Active to No instead."],
      ["You don&rsquo;t have permission to do that.", "Adding or changing a book needs write access to this company: an active owner, admin or accountant who has this company in scope."],
      ["A new invoice or journal entry went into the wrong book", "On a new invoice, bill or journal entry the Book field starts on the book you are currently viewing, not on the default book. Check for the chip in the top bar before you start, or choose the book on the document."],
      ["The Book field and book picker have disappeared", "They only appear while the company has at least two active books. Set a second book back to Active Yes."]
    ],
    tips: [
      "Keep Statutory as the default book. Put in another book only the entries that must stay out of the filed set, and choose that book on the entry itself.",
      "The book you pick in a report is remembered for each company in this browser, so glance at the top bar when you come back.",
      "A book changes what a report adds up, not what is stored: every entry keeps its full history whichever book it is in."
    ]
  },

  "settings.numbering": {
    title: "Document Numbering",
    what: "<b>Document Numbering</b> sets how Orbit numbers each type of document in the company you are in. Every number follows the pattern <b>PREFIX / year / running number</b>, for example <i>INV/2026/0001</i>. For each document type you choose the prefix, how many digits the running number has, and whether the year is included. Changes apply to documents numbered after you save; numbers already given never change.",
    when: [
      "You are setting up a company and want its invoices, orders and other documents to follow your own style.",
      "Your accountant asks for different prefixes, for example one per company in a group.",
      "You want numbers without the year, or with more digits for a busy year."
    ],
    how: [
      "Open <b>Settings &rsaquo; Document Numbering</b>. For this example, a logistics firm wants its customer invoices to read <i>FRT/2026/00001</i>.",
      "Find the <b>Customer invoice</b> row. Its <b>Next looks like</b> column shows the current pattern with running number 1, for example <i>INV/2026/0001</i>.",
      "Type <i>FRT</i> in <b>Prefix</b> and 5 in <b>Digits</b>. You should see Next looks like change to <i>FRT/2026/00001</i> as you type.",
      "Leave <b>Year</b> ticked, so the running number starts again at 1 each year.",
      "On the <b>Customer credit note</b> row, type <i>FRTCN</i> in Prefix so credit notes are easy to tell apart.",
      "Leave the <b>Journal voucher</b> row on <i>JV</i>. It numbers the journal entries you type by hand.",
      "Click <span class='man-key'>Save</span>. You should see <b>Numbering saved</b>.",
      "Create the next customer invoice. It is numbered <i>FRT/2026/00001</i>, because a prefix that has not been used before starts counting at 1."
    ],
    fields: [
      ["Prefix", "The letters at the start of the number, for example INV or PO. Left blank, Orbit saves the document's standard code, the one shown in the row before you changed it.", "optional"],
      ["Digits", "How many digits the running number is padded to, from 1 to 8: 4 gives 0001. A blank or 0 is saved as 4, and other figures are brought within 1 to 8.", "optional"],
      ["Year", "Ticked, the number includes the year, as in INV/2026/0001, and counting starts again at 1 each year. Unticked, the number reads INV/0001 and counting carries on across years.", "optional"],
      ["Next looks like", "A preview of the pattern for this year with running number 1. It changes as you type. The real running number continues from the highest one already used.", "auto"]
    ],
    buttons: [
      ["Save", "Saves every row at once for this company. The first save also completes the Document numbering step in Getting started."]
    ],
    after: "When a document is numbered, Orbit takes the prefix, the current year if Year is ticked, and the highest running number already used with that same prefix and year, plus one, padded to your digits. So a new prefix, or a new year, starts at 1, and existing documents keep their numbers. Settings are kept per company. The rows apply as follows: Customer invoice, Customer credit note, Vendor bill and Vendor refund number those documents; Sales order / quotation and Purchase order number orders; Tender / estimate numbers tenders; Submittal, RFI, Snag / punch item, Inspection and Signature request number those records. Journal voucher numbers the journal entries you type by hand, using the year of the entry's date. Entries Orbit posts for you are numbered with their journal's code, and when a row has the same code, such as INV or BILL, its prefix, digits and year apply to those entries too.",
    links: [
      { name: "Invoices", how: "Customer invoices and credit notes take their numbers from the Customer invoice and Customer credit note rows.", to: "inv.out" },
      { name: "Bills", how: "Vendor bills and refunds use the Vendor bill and Vendor refund rows.", to: "inv.in" },
      { name: "Sales Orders", how: "Numbered by the Sales order / quotation row.", to: "so.list" },
      { name: "Purchase Orders", how: "Numbered by the Purchase order row.", to: "po.list" },
      { name: "Journal Entries", how: "Hand-typed vouchers use the Journal voucher row; posted entries use the row that matches their journal's code.", to: "moves" },
      { name: "Submittals", how: "Numbered by the Submittal row.", to: "doc.subs" },
      { name: "RFIs", how: "Numbered by the RFI row.", to: "doc.rfis" },
      { name: "Getting started", how: "The Document numbering step is ticked after the first save.", to: "settings.setup" }
    ],
    mistakes: [
      ["Save failed: You don&rsquo;t have permission to do that.", "Changing numbering needs write access to this company: an active owner, admin or accountant who has this company in scope."],
      ["An existing document kept its old number after you changed the prefix", "Numbering only applies to documents numbered after you save. Numbers already given never change."],
      ["The new prefix started again at 0001", "This is expected. Counting follows the prefix and the year, so a prefix with no documents yet starts at 1."],
      ["Changing the Work order, Install job or Transmittal row has no effect", "Those three are currently numbered with fixed patterns, WO/year/0001, INS/year/0001 and TR/year/0001, whatever this screen says."]
    ],
    tips: [
      "Decide your numbering before issuing real documents. Changing a prefix part way through the year starts a second sequence alongside the first.",
      "Choose enough digits for a year of documents: 4 digits runs to 9999.",
      "If your group invoices from several companies, give each company its own prefix so a number alone shows which company issued it."
    ]
  },

  "settings.audit": {
    title: "Audit Log",
    what: "The <b>Audit Log</b> is a read-only record of who created, updated or deleted records in this company, and when. The database writes each line itself at the moment a change is saved, and nobody can edit or remove a line from inside Orbit. The screen shows the latest 500 changes, newest first.",
    when: [
      "A figure on an invoice or payment looks wrong and you want to know who last changed it, and when.",
      "A record has disappeared and you want to confirm it was deleted, and by whom.",
      "You are reviewing activity for an internal check or for your accountant."
    ],
    how: [
      "Open <b>Settings &rsaquo; Audit Log</b>. For this example, the practice manager of a veterinary practice wants to know who deleted a payment yesterday. You should see the latest changes with <b>When</b>, <b>Who</b>, <b>Action</b> and <b>Record</b> columns.",
      "Click <span class='man-key'>Filters</span> and choose <b>Deleted</b>. You should see only lines whose Action is <b>Deleted</b>.",
      "Type <i>payments</i> in the search box. Search looks at the person's email, the kind of record and the action, so only deleted payments are left.",
      "Read <b>When</b> for the date and time and <b>Who</b> for the email of the person who deleted it. Your own changes show as <b>You</b>.",
      "Look at the short code after <b>Payment</b> in the Record column. It is the start of the record's internal id, which tells two deletions apart.",
      "To see everything one person did, remove the filter and clear the search, then choose <span class='man-key'>Group By</span> &rsaquo; <b>Who</b>.",
      "To keep a copy, click <span class='man-key'>Export</span>. You should see a CSV file download with the lines that match your search and filters."
    ],
    fields: [
      ["When", "The date and time of the change, to the minute, as the database stores it (UTC).", "auto"],
      ["Who", "The email of the person who made the change, or You for your own changes. A dash means no email was recorded with the change.", "auto"],
      ["Action", "Created, Updated or Deleted.", "auto"],
      ["Record", "The kind of record, Invoice, Payment, Project or Purchase order, followed by the first 8 characters of its internal id. Other kinds show their table name, such as partners for a contact.", "auto"],
      ["Search", "Matches the person's email, the table name and the action.", "optional"]
    ],
    buttons: [
      ["Filters", "Shows only Created, Updated or Deleted lines. With more than one ticked, a line matching any of them shows."],
      ["Group By", "Groups the lines by Record type or by Who."],
      ["Columns", "Chooses which columns show."],
      ["25 / page to Show all", "How many lines show on each page."],
      ["Select", "Adds tick boxes so <span class='man-key'>Export selected</span> downloads only the ticked lines."],
      ["Export", "Downloads the lines that match your search and filters as a CSV file."]
    ],
    after: "Nothing on this screen changes any data, and the lines do not open. A line is added by the database whenever an audited record is created, updated or deleted, including posting or editing a document, which counts as an update. Audited records include contacts, tenders, sales orders, invoices and bills, payments, purchase orders, projects, progress certificates, products, stock moves, work orders, install jobs, inspections and employees. Settings such as the company profile, document numbering and accounting books are not logged. Each line belongs to the company where the change happened, and members who can see that company can read it. The log records that a change happened, not the old and new values.",
    links: [
      { name: "All activity", how: "The same trail across every app, with plain names for each kind of record and up to the latest 1,000 changes, grouped or filtered by app. Open it from the Activity app, or the Activity entry in an app's menu." },
      { name: "Users & Roles", how: "The Who column shows the email each person signs in with.", to: "settings.users" },
      { name: "Invoices", how: "Every create, update and delete on an invoice or bill is logged here.", to: "inv.out" }
    ],
    mistakes: [
      ["No audit log yet", "Nothing has been logged for this company yet. Lines appear once someone creates, changes or deletes an audited record, such as an invoice."],
      ["A change you made is not in the list", "The screen only loads the latest 500 lines, and only audited records are logged: settings such as the company profile, numbering or books are not. Also check that the company picker in the top bar shows the company where you made the change."],
      ["Who shows a dash", "No email was recorded with that change."],
      ["Record shows a name such as partners or hr_employees", "This screen only names invoices, payments, projects and purchase orders in words. All activity, in the Activity app, shows plain names for every kind of record."]
    ],
    tips: [
      "Times are in UTC, so a change made at 09:15 in London during summer time shows as 08:15.",
      "Filter and search first, then Export, to hand your accountant just the lines they asked about."
    ]
  },

  "appearance": {
    title: "Appearance",
    what: "<b>Appearance</b> changes how Orbit looks for you: a light, dark or colourful theme, the font and the text size. Each choice applies across the whole app at once and is saved in this browser on this device. It does not change what anyone else sees.",
    when: [
      "The screen feels too bright in a dim room and you want the Dark theme.",
      "You want Orbit in your company's brand colour.",
      "The text is too small or too large to read comfortably."
    ],
    how: [
      "Open <b>Settings &rsaquo; Appearance</b>. You should see three theme cards, <b>Light</b>, <b>Dark</b> and <b>Colourful</b>, with a tick on the one in use.",
      "For this example, a charity wants Orbit in its brand colour. Click <b>Colourful</b>. You should see a <b>Your colour</b> section appear; if no colour was chosen before, Orbit starts with Classic Blue.",
      "Click one of the twelve colours, or type the brand's hex code, for example <i>#009874</i>, in <b>Or your own hex code</b> and click <span class='man-key'>Use</span>. You should see buttons and backgrounds take the colour at once.",
      "Under <b>Font</b>, click <b>Onest</b>. You should see the text change straight away.",
      "Under <b>Text size</b>, click <b>Large</b>. You should see the working area grow.",
      "There is nothing to save: each click is kept in this browser. On another device, choose again."
    ],
    fields: [
      ["Theme", "Light, Dark or Colourful. Only Colourful takes a colour of your choosing.", "optional"],
      ["Your colour", "Only with Colourful. Twelve ready-made colours, from Classic Blue to Turquoise. The colour tints buttons, the background, panels and lines.", "optional"],
      ["Or your own hex code", "Only with Colourful. A colour code such as #0F4C81, with or without the #, in 6 or 3 characters. A colour too pale for white text is darkened just enough to stay readable.", "optional"],
      ["Font", "System (your device's own interface font), Onest, Rounded, Serif or Mono. Each button is written in its own font.", "optional"],
      ["Text size", "Small, Normal or Large. Scales the working area and the Home screen.", "optional"]
    ],
    buttons: [
      ["Use", "Applies the hex code typed in Or your own hex code."],
      ["Appearance button in the top bar", "Opens a quick Appearance menu from the Home screen or inside any app, with the same three themes and colours. Font and text size are only on this screen."]
    ],
    after: "Each choice is stored in this browser on this device and applied at once. It belongs to the browser, not to your user account or the company: another device, another browser, a private window or cleared browsing data starts with the Light theme, the System font and Normal text until you choose again. Nothing is saved to the company.",
    links: [
      { name: "Company Profile", how: "The accent colour of printed documents is set there, not here.", to: "settings.profile" }
    ],
    mistakes: [
      ["That is not a colour code. It looks like #0F4C81.", "The code is not 3 or 6 characters made of the digits 0 to 9 and the letters A to F. Copy it again from your brand guidelines."],
      ["Your colour looks darker than the brand colour", "A pale colour is darkened until white text on it is readable. Pick a deeper shade if you need an exact match."],
      ["The colours are missing", "They only show with the Colourful theme. Click Colourful first."],
      ["Orbit forgot your theme", "The choice is saved in the browser. A different device, a different browser, a private window or cleared browsing data starts from the Light theme. Choose it again there."]
    ],
    tips: [
      "Set Appearance on each device you use: a laptop and a phone keep separate choices."
    ]
  },

  "settings.import": {
    title: "Import Data",
    what: "Import brings a list you already keep in a spreadsheet into Orbit in one go: <b>customers</b>, <b>vendors</b>, <b>products</b>, <b>cost codes</b> or <b>projects</b>. You fill in Orbit's template, save it as a CSV file, upload it, check the preview and import. It only ever <b>adds new records</b>: nothing already in Orbit is changed, and the rows are not compared with what you have, so importing the same file twice creates everything twice.",
    when: [
      "You are setting up a new company and want to bring your customer and supplier lists across instead of typing them in.",
      "You have a price list of items with their codes, sale prices and cost prices.",
      "You want to create a set of cost codes, or a batch of projects, at once rather than one by one."
    ],
    how: [
      "Open <b>Settings &rsaquo; Import Data</b>. For this example, a veterinary clinic is bringing in its 40 suppliers from an old spreadsheet.",
      "In <b>What are you importing?</b> choose <i>Vendors / Suppliers</i>. You should see the columns listed underneath: <b>Name</b> *, Email, Phone, City, Country, Tax / VAT no.",
      "Click <span class='man-key'>Download template</span>. A file called <i>vendors_template.csv</i> downloads, with the header row and one example row.",
      "Open it in your spreadsheet program, delete the example row, and paste your suppliers under the headers, for example <i>Northside Pet Supplies</i>, <i>orders@petsupplies.example.com</i>, <i>+44 20 7946 0000</i>, <i>Leeds</i>, <i>United Kingdom</i>, <i>GB123456789</i>. Leave a cell empty when you do not have that detail.",
      "Save the file as <b>CSV (comma separated)</b>, keeping the header row as it is.",
      "Back in Orbit, click <span class='man-key'>Choose CSV file</span> and pick the file. You should see <i>40 rows found &middot; 40 ready</i> and a table showing the first 25 rows.",
      "Look for cells shown in red with the word <i>missing</i>. Those rows have no Name and will be skipped. Fix them in the file and choose it again if you want them included.",
      "Click <span class='man-key'>Import 40 rows</span>. You should see the green banner <i>Imported 40 rows successfully.</i>",
      "Open <b>Contacts</b> or the <b>Vendors</b> list to check the suppliers are there, each marked as a vendor."
    ],
    fields: [
      ["What are you importing?", "Customers, Vendors / Suppliers, Products / Items, Cost Codes or Projects. It decides which template you download, which columns are read and where the rows are saved. Changing it clears the preview.", "required"],
      ["CSV file (Choose CSV file)", "The filled-in template saved as a .csv file, with the header row first. Cells must be separated by commas; a file separated by semicolons or tabs is not read correctly. A cell holding a comma is fine when it is in quotes, which spreadsheet programs do for you when saving as CSV.", "required"],
      ["Name (Customers, Vendors / Suppliers, Products / Items, Projects)", "The name of each record. A row without it is skipped.", "required"],
      ["Email, Phone, City, Country (Customers, Vendors / Suppliers)", "Copied onto the contact exactly as typed.", "optional"],
      ["Tax / VAT no. (Customers, Vendors / Suppliers)", "The contact's tax or VAT registration number.", "optional"],
      ["Code (Products / Items)", "Your item code for the product.", "optional"],
      ["Sale price and Cost price (Products / Items)", "Plain numbers such as 1200.50. A value that is not a plain number, such as 1,200.50 or one with a currency sign, is saved as 0.", "optional"],
      ["Code (Cost Codes)", "The cost code itself, for example <i>03-200</i>. A row without it is skipped. Each code can exist only once in a company, whatever its capitals.", "required"],
      ["Name and Category (Cost Codes)", "A description of the code, and a grouping such as Labour or Materials.", "optional"],
      ["Contract value (Projects)", "The project's contract value as a plain number. Anything that is not a plain number is saved as 0.", "optional"],
      ["Company", "Every row goes into the company you are working in when you click Import. Imported customers and vendors are saved as companies rather than individuals.", "auto"],
      ["Active", "Imported products, cost codes and projects are saved as active.", "auto"]
    ],
    buttons: [
      ["Download template", "Downloads a CSV template named after your choice, such as <i>customers_template.csv</i>: the header row, with required columns marked *, and one example row. Delete the example row before importing, or it is imported too."],
      ["Choose CSV file", "Opens the file picker. Orbit reads the file straight away and shows how many rows it found, how many are ready, and a preview of the first 25. Nothing is saved yet."],
      ["Import (number) rows", "Saves every ready row at once and skips the rows missing a required value. It is greyed out when no row is ready. If the database refuses any row, nothing from the file is saved and the reason is shown."]
    ],
    after: "Each ready row becomes a new record in the company you are in: customers and vendors in <b>Contacts</b> (and the Customers or Vendors list), products in <b>Products</b>, cost codes in <b>Cost Codes</b>, projects in <b>Projects</b>. Existing records are never updated or merged. Only the template's columns are filled, so custom fields, accounts, taxes and anything else are set on each record afterwards. Import creates no invoices, stock or ledger entries.",
    links: [
      { name: "Contacts", how: "Imported customers and vendors are contacts of this company.", to: "contacts" },
      { name: "Customers", how: "Rows imported as Customers are marked as customers and appear here.", to: "cust" },
      { name: "Vendors", how: "Rows imported as Vendors / Suppliers are marked as vendors, so you can pick them on bills and purchase orders.", to: "vend" },
      { name: "Products", how: "Imported items land here with their code, sale price and cost price.", to: "products" },
      { name: "Cost Codes", how: "Imported cost codes can then be used on budgets, purchase orders and bills.", to: "cost.codes" },
      { name: "Projects", how: "Imported projects land here with their contract value.", to: "proj.list" },
      { name: "Custom Fields", how: "Import does not fill custom fields. Fill them on each record after importing.", to: "settings.customfields" },
      { name: "Backups", how: "Take a data-only backup before a large import, so you have a copy from before it.", to: "settings.backups" }
    ],
    mistakes: [
      ["That file has no data rows. Use the template and add at least one row under the header.", "The file is empty or holds only the header row. Add your records under the header, save, and choose the file again."],
      ["(number) missing a required field (skipped)", "Those rows have an empty required cell, shown in red as <i>missing</i>. Fill them in and choose the file again, or import the ready rows now and add the others by hand."],
      ["Every row shows missing under Name", "Orbit could not find the Name column. Either the header was renamed (headers are matched by their name, such as Name or Tax / VAT no., ignoring capitals and the *), or the file was saved with semicolons or tabs between cells. Save it again as CSV (comma separated) with the template's header row."],
      ["Import failed: That already exists - a record with the same code or number is already saved.", "A cost code in the file already exists in this company, or appears twice in the file. Nothing was imported. Change or remove the duplicate and import again."],
      ["Import failed: You don&rsquo;t have permission to do that.", "Your role in this company cannot add records. Ask an owner, admin or accountant to run the import."],
      ["Prices or contract values came in as 0", "The cells held something other than a plain number, such as 1,200.00 or a currency sign. Remove separators and symbols in the file before importing; correct records already imported on the record itself."],
      ["Choosing the same file again does nothing", "After you change What are you importing?, the file picker may ignore the same file picked a second time. Reload the page, or save the file under a new name, and choose it again."],
      ["Everything appears twice", "The same file was imported twice. Import never checks for records you already have, so check the list before importing a file again."]
    ],
    tips: [
      "Column order does not matter and columns Orbit does not use are ignored, so you can keep your own notes in an extra column.",
      "An empty cell is simply left out, so the record keeps its usual default.",
      "Check which company is selected in the top bar before you click Import."
    ]
  },

  "settings.customfields": {
    title: "Custom Fields",
    what: "Custom fields add your own boxes to a record, on top of the ones Orbit already has. You define a field once here, with a label, a type and whether it must be filled in. It then appears on every <b>Contact</b>, <b>Project</b> or <b>Product</b> form, or in the <b>Appoint</b> client file, and the value is saved with each record. Fields belong to the company you are working in.",
    when: [
      "You need to record something Orbit has no box for, such as a licence number on a contact, a site access code on a project or a shelf location on a product.",
      "A practice using Appoint wants extra details in each client's file.",
      "A field is no longer needed and should stop showing on the form."
    ],
    how: [
      "Open <b>Settings &rsaquo; Custom Fields</b>. The <b>Contacts</b> tab is selected. For this example, a print shop wants to record each customer's preferred paper stock and whether they must approve a proof.",
      "In <b>Add a field</b>, type <i>Preferred paper stock</i> in <b>Label</b>.",
      "Choose <i>Dropdown</i> in <b>Type</b> and type <i>Silk 150gsm, Matt 170gsm, Uncoated 120gsm</i> in <b>Choices</b>.",
      "Leave <b>Section</b> empty and <b>Make this field required</b> unticked, then click <span class='man-key'>Add field</span>. You should see <i>Field added</i> and a new row: Preferred paper stock, with <i>preferred_paper_stock</i> in grey under it, the type Dropdown and the three choices.",
      "Add a second field: Label <i>Proof approval needed</i>, Type <i>Yes / No</i>, then <span class='man-key'>Add field</span>.",
      "Open <b>Contacts</b> and open a customer. You should see a <b>More details</b> block with the two new boxes.",
      "Choose <i>Matt 170gsm</i>, tick <i>Yes</i>, and save the contact. Open it again: both values are kept."
    ],
    fields: [
      ["Contacts, Projects, Products, Appoint: the client file", "The tabs choose which record the field belongs to. The list and the Add a field form work on the selected tab; Contacts is selected when the screen opens.", "auto"],
      ["Label", "The name of the box on the form, for example <i>Licence no.</i> Orbit makes the field's key from it (lower case, with spaces and punctuation turned into underscores) and shows the key in grey under the label. It must contain letters or numbers and must not match another field's key on the same tab.", "required"],
      ["Type", "<i>Text</i> for a short line, <i>Number</i>, <i>Date</i> for a date picker, <i>Dropdown</i> for a fixed list of choices, <i>Yes / No</i> for a tick box, or <i>Long text</i> for a larger box of several lines.", "required"],
      ["Choices", "Only for a Dropdown: the options separated by commas, such as <i>Low, Medium, High</i>. A Dropdown cannot be added without at least one. Ignored for the other types.", "optional"],
      ["Section", "A heading to group the field under. The Appoint client file shows one block per section; the Contact, Project and Product forms show all their custom fields together under <b>More details</b>. Pick a section you already have from the suggestions, or type a new one.", "optional"],
      ["Make this field required", "When ticked, the record cannot be saved while this box is empty. On a Yes / No field it means the box must be ticked.", "optional"]
    ],
    buttons: [
      ["Contacts / Projects / Products / Appoint: the client file", "Switch the list and the Add a field form to that record."],
      ["Add field", "Adds the field at the end of this tab's list. It shows on the forms straight away."],
      ["Remove", "Asks you to confirm, then deletes the field. Values already saved on records are kept in the database but are no longer shown."]
    ],
    after: "The field appears on the form of that record for everyone in this company, in the order of the list; colleagues who already have Orbit open see it after they reload. On a contact, project or product the value is saved on the record itself. On the Appoint client file it is saved in the client's file, not on the shared contact, so it does not appear in contact lists. Fields added by an Appoint practice profile show <i>from the (profile) profile</i> under their key. Custom field values are not filled by Import Data and are not part of the public API.",
    links: [
      { name: "Contacts", how: "Fields on the Contacts tab appear under More details on every contact.", to: "contacts" },
      { name: "Projects", how: "Fields on the Projects tab appear under More details on every project.", to: "proj.list" },
      { name: "Products", how: "Fields on the Products tab appear under More details on every product.", to: "products" },
      { name: "Appoint clients", how: "Fields on the Appoint: the client file tab appear in each client's file, grouped by section.", to: "appt.clients" },
      { name: "Import Data", how: "An import fills only the template's columns, never custom fields.", to: "settings.import" },
      { name: "Terminology", how: "Renames words in the menus and titles, where Custom Fields adds boxes to forms.", to: "settings.terminology" }
    ],
    mistakes: [
      ["Enter a label", "Add field was clicked with Label empty. Type the name of the box."],
      ["Give the field a label that has letters or numbers", "The label is only symbols or spaces, so no key can be made from it. Use a label with at least one letter or number."],
      ["A dropdown needs at least one choice", "Type is Dropdown and Choices is empty. Type the options separated by commas."],
      ["A field with that name already exists here.", "Another field on this tab has the same key. Labels that differ only in capitals, spaces or punctuation make the same key: <i>Licence No</i> and <i>licence-no</i> both become <i>licence_no</i>. Use a different label, or remove the old field first."],
      ["(Label) is required.", "Shown when you save a contact, project, product or client file with a required custom field empty, or a required Yes / No unticked. Fill it in, then save."],
      ["No Add a field form and no Remove links", "Your role cannot manage Settings, so the list is read-only. Ask someone whose role can."]
    ],
    tips: [
      "A field cannot be edited. To change its type, choices or required setting, remove it and add it again with exactly the same label: the values saved before show again, because they are stored under the field's key.",
      "Custom fields belong to one company. Another company in your organisation needs its own.",
      "Keep sensitive personal details, such as health information, in the Appoint client file rather than on a contact, which the whole company can see."
    ]
  },

  "settings.terminology": {
    title: "Terminology",
    what: "Terminology replaces some of the words Orbit shows with the words your business uses, for example <i>Vendors</i> to <i>Suppliers</i>, <i>Customers</i> to <i>Clients</i> or <i>Projects</i> to <i>Jobs</i>. The new word shows in app names, menus and screen titles. It applies only to the company you are working in, and it only changes the label: nothing about how Orbit works changes.",
    when: [
      "Your team uses different words from Orbit's and the menus feel unfamiliar.",
      "You run a different kind of business in each company, and each needs its own words.",
      "You want to put a renamed word back to Orbit's default."
    ],
    how: [
      "Open <b>Settings &rsaquo; Terminology</b>. You should see two columns, <b>Default</b> and <b>Show instead</b>, and a note naming the company the words apply to.",
      "For this example, a language school calls its customers <i>families</i> and its products <i>courses</i>.",
      "Next to <b>Customers</b>, type <i>Families</i>.",
      "Next to <b>Products</b>, type <i>Courses</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Terminology saved</i>, and the menus redraw straight away.",
      "Open an app whose menu listed Customers. The menu item now reads <i>Families</i>, and so does the screen title at the top once you open it.",
      "Open a customer. The boxes and buttons on the form keep their usual words: Terminology renames menus and titles, not the words inside a screen.",
      "To undo, clear the <i>Families</i> box and click Save again."
    ],
    fields: [
      ["Default", "The word as Orbit ships it. Only a short list of common words can be renamed, and only those that appear in Orbit's menus are listed.", "auto"],
      ["Show instead", "The word to show in its place, for example <i>Suppliers</i> next to Vendors. Leave it empty, or type the default word, to use the default.", "optional"]
    ],
    buttons: [
      ["Save", "Saves every row at once, redraws the menus with the new words and reopens this screen. A box left empty goes back to the default."]
    ],
    after: "A renamed word replaces the default wherever the label is exactly that word: app names on the home screen, the app name in the top bar, menu items and menu groups, the screen title and its path at the top of a screen, and screen names in the help list. Words inside screens, such as column headings, field labels and buttons, printed documents and help articles keep Orbit's standard words. The change is for this company only; colleagues see it the next time they open Orbit or switch to this company.",
    links: [
      { name: "Custom Fields", how: "Adds your own boxes to forms, where Terminology renames words in the menus.", to: "settings.customfields" },
      { name: "Roles &amp; Permissions", how: "Whether someone can change the words depends on whether their role manages Settings.", to: "settings.roles" }
    ],
    mistakes: [
      ["Save failed: You don&rsquo;t have permission to do that.", "Your role in this company cannot change company data. Ask an owner, admin or accountant to save the words."],
      ["The boxes are greyed out and there is no Save button", "Your role cannot manage Settings. Ask someone whose role can."],
      ["A word did not change somewhere", "Only labels that are exactly the default word change, and only in app names, menus, screen titles and the help list. A longer label that contains the word, and the words inside a screen, stay as they are."],
      ["The word I want to rename is not in the list", "Only a fixed list of common words can be renamed. Other labels keep their standard wording."]
    ],
    tips: [
      "Help articles keep Orbit's standard words, so a guide may say Vendors where your menu says Suppliers.",
      "Each company keeps its own words. Switching company shows that company's words, or the defaults."
    ]
  },

  "settings.automations": {
    title: "Automations",
    what: "Automations are ready-made rules that look through your data and put an alert in the <b>bell</b> when something needs attention, such as an overdue invoice, a bill due soon or an item running low. You switch each rule on, set its number of days (or quantity, or percentage) and save. Rules only raise alerts: they never change a record and never send anything outside Orbit.",
    when: [
      "You want Orbit to remind you about late customers, bills falling due and approaching deadlines, instead of checking lists every morning.",
      "You want a warning when stock falls to its reorder minimum, a customer passes their credit limit, or equipment insurance or a warranty is about to expire.",
      "You changed a rule and want to check straight away what it finds."
    ],
    how: [
      "Open <b>Settings &rsaquo; Automations</b>. You should see seven rules, each with an <b>On</b> box and a number.",
      "For this example, a freight forwarder wants to chase customers a week after an invoice falls due, and hear about supplier bills three days before they are due.",
      "Tick <b>On</b> for <b>Overdue invoice alert</b> and leave <b>Days overdue</b> at 7.",
      "Tick <b>On</b> for <b>Bill due soon</b> and change <b>Days ahead</b> to 3.",
      "Click <span class='man-key'>Save</span>. You should see <i>Automations saved</i>.",
      "Click <span class='man-key'>Run now</span>. You should see, for example, <i>2 alerts added to your bell</i>, or <i>Nothing needs attention right now</i> if nothing matches.",
      "Open the bell. Each alert comes from <i>Automation</i> and reads like <i>Invoice INV/2026/0031 is overdue</i>, with the customer and the date it was due.",
      "From tomorrow the rules check again by themselves when Orbit is opened, so there is nothing more to do."
    ],
    fields: [
      ["On", "One for each rule. Tick to switch the rule on. A rule that has never been saved is off.", "optional"],
      ["Days overdue (Overdue invoice alert)", "Alerts on each posted customer invoice with money still owing whose due date was at least this many days ago. Starts at 7.", "optional"],
      ["Days ahead (Bill due soon)", "Alerts on each posted vendor bill with money still owing that falls due between today and this many days ahead. Starts at 5.", "optional"],
      ["Days ahead (Project deadline approaching)", "Alerts on each active project whose deadline falls between today and this many days ahead. Starts at 7.", "optional"],
      ["Days old (Quotation follow-up)", "Alerts on each draft quotation dated at least this many days ago. Starts at 10.", "optional"],
      ["Extra buffer qty (Low stock alert)", "Alerts on each item whose on-hand quantity is at or below its reorder minimum plus this number. Only items with a reorder minimum above 0 are checked. The screen starts at 0, but the lowest value saved is 1.", "optional"],
      ["Alert at % of limit (Customer over credit limit)", "Alerts on each contact with a credit limit whose unpaid posted invoices reach this percentage of it. Starts at 100.", "optional"],
      ["Days ahead (Document / warranty expiry)", "Alerts when an equipment registration or insurance expiry date, or a service warranty's end date, falls between today and this many days ahead. Starts at 30.", "optional"]
    ],
    buttons: [
      ["Save", "Stores the On boxes and numbers for all seven rules. Each number is kept between 1 and 365; an empty box takes the rule's starting value."],
      ["Run now", "Checks the rules straight away instead of waiting for tomorrow, and tells you how many new alerts it added. It uses the settings last saved, so click Save first."]
    ],
    after: "There is no background job. The check runs in the browser when someone opens Orbit, at most once a day for each company in that browser, and only for people whose role can view Accounting. Each alert is added to the bell of everyone in the company, and the same record raises at most one alert a day for each rule, so several people opening Orbit do not create repeats. Each rule looks at up to 50 matching records per check. Alerts carry the record's name or number and a date, never an amount of money. If nobody opens Orbit, nothing is checked.",
    links: [
      { name: "Customer invoices", how: "Overdue invoice alert watches posted invoices with money still owing.", to: "inv.out" },
      { name: "Bills", how: "Bill due soon watches posted vendor bills with money still owing.", to: "inv.in" },
      { name: "Projects", how: "Project deadline approaching reads each active project's deadline.", to: "proj.list" },
      { name: "Quotations", how: "Quotation follow-up watches quotations still in draft.", to: "so.list" },
      { name: "Reordering", how: "Low stock alert only checks items that have a reorder minimum set.", to: "inv.reorder" },
      { name: "Contacts", how: "Customer over credit limit reads the credit limit set on each contact.", to: "contacts" },
      { name: "Plant and equipment", how: "Document / warranty expiry reads each unit's registration and insurance expiry dates.", to: "site.plant" },
      { name: "Warranties", how: "Document / warranty expiry reads each service warranty's end date.", to: "svc.warranties" }
    ],
    mistakes: [
      ["Nothing needs attention right now", "Not always an error. It also shows when today's alerts were already raised, when you changed a rule without saving it, or when your role cannot view Accounting, because the check only runs for people who can."],
      ["You don&rsquo;t have permission to do that.", "Shown on Save when your role in this company cannot change company data. Ask an owner, admin or accountant to save the rules."],
      ["No Save or Run now button, and the boxes are greyed out", "Your role cannot manage Settings. Ask someone whose role can."],
      ["No alert, although an invoice is clearly overdue", "Check the rule is ticked On and saved, and that the invoice is posted, has money owing and was due at least the set number of days ago. Alerts are only added when the person whose Orbit runs the check has a role that can change company data. Click Run now to check again."],
      ["Low stock alert never fires", "The rule only checks items with a reorder minimum above 0. Set the minimum for the item first."]
    ],
    tips: [
      "Set the numbers to suit how you work: a longer Days overdue means fewer, later reminders.",
      "An alert that was already raised today is not raised again, so Run now a second time usually says nothing needs attention.",
      "Customer over credit limit only looks at contacts that have a credit limit; a contact without one is never flagged."
    ]
  },

  "settings.api": {
    title: "Developers (API)",
    what: "This screen connects Orbit to other software. An <b>API key</b> lets another program, such as your website or a reporting tool, read this company's data through Orbit's public API, and create or update contacts, products and projects if you allow it. A <b>webhook</b> works the other way: Orbit sends a signed message to a web address of yours when an invoice, bill, purchase order or payment is created. Keys and webhooks belong to the company you are working in.",
    when: [
      "A website form should add new enquiries to Orbit as contacts.",
      "A reporting or delivery system needs to read your invoices, purchase orders or payments.",
      "Another system should be told the moment an invoice, bill, purchase order or payment is created.",
      "An integration is no longer used and its key should stop working."
    ],
    how: [
      "Open <b>Settings &rsaquo; Developers (API)</b>. You should see two cards: <b>Public API</b>, with a table of API keys, and <b>Webhooks</b>.",
      "For this example, a print shop wants its website to add new enquiries as contacts, and its delivery system to hear about every new customer invoice.",
      "Click <span class='man-key'>+ New key</span>. Type <i>Website enquiry form</i> in <b>Name</b>, tick <b>Allow writes</b> and click <span class='man-key'>Create key</span>.",
      "You should see <b>Your new API key</b> with a long key starting <i>orbit_live_</i>. Click <span class='man-key'>Copy</span>, paste the key into the website's settings or a password manager, then click <span class='man-key'>Done</span>. The key is never shown again.",
      "The table now lists <i>Website enquiry form</i>, the first characters of the key, the scopes <i>read</i> and <i>write</i>, and Last used <i>never</i>.",
      "The website sends each new contact to <i>https://orbit.spacework.ai/api/v1/contacts</i> with the header <i>Authorization: Bearer</i> followed by the key. After its first call, Last used shows the date.",
      "In <b>Webhooks</b> click <span class='man-key'>+ New endpoint</span>. Type <i>https://hooks.example.com/orbit</i> in <b>URL</b>, untick every event except <i>invoice.created</i>, and click <span class='man-key'>Create endpoint</span>.",
      "You should see <b>Endpoint signing secret</b> with a value starting <i>whsec_</i>. Copy it into the delivery system, which uses it to check each message's signature, then click Done.",
      "Create a customer invoice. The delivery system receives a message with the event <i>invoice.created</i> and the invoice's id, number, type, customer, total and state.",
      "If the website is ever retired, click <span class='man-key'>Revoke</span> next to its key. Calls using that key are refused from then on."
    ],
    fields: [
      ["Name (New API key)", "A label so you know which integration uses the key, such as <i>Website</i> or <i>Reporting tool</i>. Left empty, it is called <i>API key</i>.", "optional"],
      ["Allow writes (create/update contacts, products, projects)", "Unticked, the key can only read. Ticked, it can also create and update contacts, products and projects. Invoices, purchase orders and payments are read-only through the API either way. A key's scopes cannot be changed later.", "optional"],
      ["Key", "In the keys table: the first characters of the key followed by ..., so you can tell keys apart. Orbit keeps only a fingerprint of the full key, which is why it cannot show it again.", "auto"],
      ["Scopes", "In the keys table: <i>read</i>, or <i>read</i> and <i>write</i>.", "auto"],
      ["Last used", "In the keys table: the date the API last accepted the key, or <i>never</i>.", "auto"],
      ["URL (New webhook endpoint)", "The web address Orbit sends events to, for example <i>https://hooks.example.com/orbit</i>. It must start with https:// (http:// is also accepted, but https keeps the data encrypted on the way).", "required"],
      ["Events", "Which events are sent to this address: <i>invoice.created</i>, <i>bill.created</i>, <i>purchase_order.created</i>, <i>purchase_order.confirmed</i> and <i>payment.recorded</i>. All five start ticked; keep at least one.", "required"],
      ["Signing secret", "Shown once when the endpoint is created, starting <i>whsec_</i>. Your server works out HMAC-SHA256 of the raw message body with this secret and compares it with the <i>X-Orbit-Signature</i> header, after <i>sha256=</i>.", "auto"],
      ["Status and Last (webhooks table)", "Status shows <i>active</i>; there is no switch to pause an endpoint, so delete it to stop deliveries. Last shows a dash, because delivery results are not recorded on the endpoint: check your own server's logs to confirm messages arrive.", "auto"]
    ],
    buttons: [
      ["+ New key", "Opens the New API key window."],
      ["Create key", "Creates the key and shows it once, with a reminder of the Authorization header to use."],
      ["Revoke", "Asks you to confirm, then stops the key working at once. The key stays in the list, faded and marked revoked. A revoked key cannot be switched back on."],
      ["+ New endpoint", "Opens the New webhook endpoint window."],
      ["Create endpoint", "Creates the endpoint and shows its signing secret once."],
      ["Delete", "Asks you to confirm, then removes the endpoint. Nothing more is sent to that address."],
      ["Copy", "Copies the key or secret in the window, so you can paste it where it is needed."],
      ["Done", "Closes the window. After this the key or secret cannot be shown again."],
      ["Cancel", "Closes the window without creating anything."]
    ],
    after: "A key only ever reaches this company's records and a fixed set of their columns; it cannot choose another company. Lists come back 50 records at a time by default, up to 200 with <i>?limit=</i>, and further pages with <i>?offset=</i>. Contacts, products and projects created or updated through the API appear in Orbit straight away. Webhook messages are sent by the database the moment the record is created, whoever creates it: <i>invoice.created</i> for customer invoices and customer credit notes, <i>bill.created</i> for vendor bills and vendor credit notes, <i>purchase_order.created</i> when an order is created, <i>purchase_order.confirmed</i> when an order is marked sent or confirmed, and <i>payment.recorded</i> for every payment. Each message is sent once, with no retry. The full guide is at orbit.spacework.ai/developers.",
    links: [
      { name: "Developer guide", how: "The page at orbit.spacework.ai/developers shows the requests, the writable fields, a signature check example and the error codes." },
      { name: "Contacts", how: "Readable, and writable with a write key: name, email, phone, VAT number, company, customer and vendor flags, industry.", to: "contacts" },
      { name: "Products", how: "Readable, and writable with a write key.", to: "products" },
      { name: "Projects", how: "Readable, and writable with a write key.", to: "proj.list" },
      { name: "Customer invoices", how: "Read-only through the API. Creating one sends invoice.created.", to: "inv.out" },
      { name: "Bills", how: "Read-only through the API. Creating one sends bill.created.", to: "inv.in" },
      { name: "Purchase Orders", how: "Read-only through the API. Creating and confirming send purchase_order.created and purchase_order.confirmed.", to: "po.list" },
      { name: "Customer payments", how: "Read-only through the API. Each payment sends payment.recorded.", to: "pay.in" },
      { name: "Supplier payments", how: "Read-only through the API. Each payment sends payment.recorded.", to: "pay.out" },
      { name: "Users &amp; Roles", how: "A member's role decides whether they can create and revoke keys and endpoints.", to: "settings.users" }
    ],
    mistakes: [
      ["Enter a valid https URL", "The URL does not start with https:// (or http://). Paste the full address, including https://."],
      ["Pick at least one event", "Every event is unticked. Tick the events this address should receive."],
      ["You don&rsquo;t have permission to do that.", "Creating, revoking and deleting need a role that can change company data: owner, admin or accountant. For other roles both tables also show as empty."],
      ["The API back-end is not installed yet.", "The database part of the API has not been set up on this installation. Whoever administers Orbit runs supabase/api-and-webhooks.sql once; then reload the page."],
      ["I closed the window before copying the key", "A key or secret is shown only once and cannot be recovered. Revoke the key, or delete the endpoint, and create a new one."],
      ["Invalid or revoked API key.", "The API replied 401: the key was revoked or copied incompletely. Check it, or create a new key and update the integration."],
      ["Missing or malformed API key. Send 'Authorization: Bearer orbit_live_...'.", "The request had no Authorization header, or the value did not start with the key. Send Authorization: Bearer followed by the full key."],
      ["This API key is read-only.", "The key was created without Allow writes. Create a new key with Allow writes ticked and swap it in."],
      ["Writes are not enabled for 'invoices'. Writable: contacts, products, projects. (Financial documents are read-only pending a security review.)", "Only contacts, products and projects accept creating (POST) and updating (PATCH). Invoices, purchase orders and payments can only be read."],
      ["PATCH needs an id: /api/v1/contacts/{id}", "An update must name the record: add its id to the end of the address."]
    ],
    tips: [
      "Give each integration its own key, so you can revoke one without breaking the others.",
      "Treat a key like a password. It can read your contacts' names, email addresses and phone numbers, and your invoices and payments, so keep it in a password manager, never in an email or shared document, and only give it to services you trust with that data.",
      "invoice.created is sent when an invoice is first created, which is usually as a draft. Read <i>state</i> in the message before acting on it.",
      "Because a missed message is not sent again, have the receiving system read recent records through the API now and then to catch up.",
      "Always check the signature of a webhook message before trusting it."
    ]
  },

  "settings.backups": {
    title: "Backups",
    what: "A <b>backup</b> here is one zip file that Orbit builds in your browser and saves to your computer. It holds every record of the company you are in, the attachments themselves (photographs, drawings, PDFs), the shape of the database written out as SQL and a copy of Orbit, so the company can be put back even if this website is gone. Orbit keeps no copy in the cloud: it only logs that a backup was taken. The same screen restores a backup file into a <b>new company</b> beside the one you have, and sets a reminder so you do not forget.",
    when: [
      "Before something you are nervous about, such as a large import, a clean-up of old records or the end of a year.",
      "On a regular date, when the bell reminds you that it is time to take one.",
      "Records were deleted by mistake, or an import went wrong, and you want to see or copy back what was there.",
      "Every few months, to test that your backups can actually be put back."
    ],
    how: [
      "Open <b>Settings &rsaquo; Backups</b>. For this example, a physiotherapy clinic wants a full copy before importing its patient contacts from a spreadsheet. If no backup has been logged yet, you should see a red card saying <b>You have never taken a backup</b>.",
      "Read the <b>Take a backup</b> card. It says how many attachments the company has, for example <i>214 attachments</i>, which gives you an idea of how large the file will be.",
      "Click <span class='man-key'>Back up now, with the files</span>. Both backup buttons are disabled while it runs, and the note on the card shows the progress: <i>Gathering every record...</i>, then <i>Adding attachment 1 of 214...</i>, then <i>Packing...</i>.",
      "When it finishes, your browser saves a file named like <i>orbit-backup-riverside-physio-2026-09-14.zip</i>. You should see the note change to <b>Saved</b> with the file name, its size and how long it took, and a <b>Backup saved</b> message.",
      "Move the zip off this computer, for example to an external drive or a separate cloud folder. A few seconds later the screen refreshes and <b>What you have taken</b> shows a new line with the time, who took it, the tables, rows, files, size and file name.",
      "Under <b>Remind me</b>, choose <i>Every month</i> in <b>Nudge me to take one</b>, leave <b>Remind me at all</b> ticked and click <span class='man-key'>Save</span>. You should see <b>Saved</b>.",
      "Now test the backup. Click <span class='man-key'>Restore from a backup file</span> and choose the zip you just saved. A dialog opens with <b>Name for the restored copy</b> filled in as <i>Riverside Physio (restored)</i>.",
      "Keep that name or type another, then click <span class='man-key'>Save</span>. The button reads <b>Restoring...</b> while the records go back in and each attachment is uploaded again.",
      "A message box reports the result, for example <i>Every row came back.</i>, followed by how many rows were restored into the copy and how many attachments were put back. If some rows failed, it lists them by table.",
      "Reload the page, pick the restored copy in the company picker at the top and look at a few records and attachments.",
      "When you are done, pick your real company again, open <b>Settings &rsaquo; Companies</b>, open the restored copy and click <span class='man-key'>Discard this restored copy</span>."
    ],
    fields: [
      ["Nudge me to take one", "How long after the last logged backup Orbit starts reminding you: Every day, Every 3 days, Every week, Every 2 weeks or Every month. The red warning card at the top of the screen uses the same interval. If the company has no reminder setting yet, opening this screen creates one set to Every month.", "optional"],
      ["Remind me at all", "Ticked, a reminder lands in the bell once the interval has passed since the last backup, and again each day until one is taken. It goes to the owners and admins of the organisation who have access to this company. Untick it to stop the reminders.", "optional"],
      ["Backup file (Restore from a backup file)", "The backup to put back: a <i>.zip</i> made by this screen, or the <i>data.json</i> file taken out of one. A zip brings back the records and uploads the attachments again; a .json file brings back the records only.", "required"],
      ["Name for the restored copy", "The name of the new company the backup is restored into. It is filled in as the current company's name followed by <i>(restored)</i> and needs at least two characters. The copy takes its legal name, currency and country from the file.", "required"]
    ],
    buttons: [
      ["Back up now, with the files", "Builds the full zip: every record of this company in <i>data.json</i>, every attachment in <i>files/</i>, the database shape in <i>rebuild/schema.sql</i>, a copy of Orbit in <i>rebuild/app/</i> and a <i>README.txt</i> that explains how to put it all back. Your browser saves the file, and a line is added to What you have taken."],
      ["Data only, no files", "The same zip without the attachments, so it is smaller and quicker. The Files column of the log shows a dash for it. It is a copy of the records, not a complete backup of the company."],
      ["Restore from a backup file", "Opens a file picker. Choosing a file opens the restore dialog. A backup is always restored into a new company, never over an existing one."],
      ["Save (Remind me)", "Saves the reminder interval and whether reminders are on."],
      ["Save (restore dialog)", "Starts the restore. The records go into a new company with new identifiers, then each attachment in the zip is uploaded again and linked to its restored record. A message box reports how many rows and attachments came back."],
      ["Cancel (restore dialog)", "Closes the dialog without restoring anything."]
    ],
    after: "Taking a backup changes none of your data. Once the file has been saved, Orbit logs it (when, who, tables, rows, files, size, file name and a checksum), records the time of the last backup, which removes the red warning card and restarts the reminder interval, and keeps the latest 60 log lines. The zip itself exists only where your browser saved it. The backup covers every table that belongs to the company; the audit log is not included, and neither is anything kept for the organisation as a whole, such as the team of people who can sign in. A restore creates a new company in the organisation the backup came from or, if that organisation no longer exists in this database, in one where you are an owner, admin or accountant with access to every company. Every row gets a new identifier, so nothing in the original company is touched. The copy takes only its name, legal name, currency and country from the file: other settings kept on the company itself, such as the Company Profile details, are not carried across. It shows in the company picker after you reload the page, and can be thrown away with <span class='man-key'>Discard this restored copy</span> in Settings, Companies.",
    links: [
      { name: "Companies", how: "A restored copy is listed there. Open it and use <span class='man-key'>Discard this restored copy</span> to remove it; only a company created by a restore can be discarded that way.", to: "companies" },
      { name: "Import Data", how: "Take a backup first, so that if an import goes wrong you still have the records as they were, ready to restore as a copy.", to: "settings.import" },
      { name: "Company Profile", how: "Its details are not carried into a restored copy. Fill them in on the copy if you plan to work in it.", to: "settings.profile" },
      { name: "Users &amp; Roles", how: "The team belongs to the organisation, not the company, so it is not in a backup. After rebuilding from nothing, invite people again.", to: "settings.users" },
      { name: "Audit Log", how: "The history of who changed what is not part of a backup and does not come back with a restore.", to: "settings.audit" },
      { name: "Privacy &amp; data requests", how: "A person erased there is still inside any backup taken before the erasure.", to: "settings.privacy" }
    ],
    mistakes: [
      ["That did not finish: (reason)", "The backup stopped part way, for example because the connection dropped. Nothing was logged. Check your connection and click the button again."],
      ["Nothing came back from the database.", "The database returned no records to build the backup from. Reload the page, check you are in the right company and try again."],
      ["That is not a zip file.", "The file ends in .zip but cannot be read as one, often because it was only partly downloaded or copied. Use another copy of the backup."],
      ["There is no data.json inside that zip.", "The zip was not made by this screen, or it was repacked without data.json. Choose the original backup zip."],
      ["That file is not an Orbit backup", "The .json file does not contain the company section every backup has. Choose the data.json from a backup zip, or the zip itself."],
      ["Give it a name", "The Name for the restored copy is empty or shorter than two characters. Type a name and click Save again."],
      ["You cannot write to that organisation", "A restore goes into the organisation the backup came from, and only an owner, admin or accountant of that organisation who is not limited to some companies can restore into it. Ask such a person to run the restore."],
      ["You do not belong to an organisation this can be restored into", "The organisation named in the file no longer exists in this database, and you are not an owner, admin or accountant with access to every company in any organisation. Sign in as the owner of the new organisation and restore again."],
      ["Restored with failures. Check failures.", "Some rows could not be put back. The message lists how many per table and why. Everything else is in the copy; check the listed tables before relying on it."],
      ["(number) attachment(s) put back, (number) could not be", "Some files in the zip could not be matched to a restored record or could not be uploaded. The records are there; those attachments are missing from the copy."],
      ["Switch to another company first, then discard this copy.", "You are working inside the restored copy. Pick your real company in the company picker, then discard the copy from Settings, Companies."],
      ["The restored copy is not in the company picker", "The picker is loaded when the page opens. Reload the page and the copy appears."],
      ["What you have taken says Nothing yet, although backups were taken", "The log is shown only to an owner, admin or accountant of the company, and only their backups are logged. Ask one of them to check."]
    ],
    tips: [
      "Keep at least one backup somewhere other than the computer that made it. A copy that sits beside the thing it protects is lost with it.",
      "Restore a backup every few months when nothing is wrong. If the rows and attachments come back, you know your backups work; then discard the copy.",
      "The zip can be read without Orbit: data.json is plain JSON with one list per table, and the files in files/ are ordinary files.",
      "A backup holds personal data about your customers, staff and suppliers. Store the zip as carefully as you would the system itself."
    ]
  },

  "settings.privacy": {
    title: "Privacy & data requests",
    what: "When someone asks what personal data you hold about them, or asks you to delete it, this screen handles the request in the company you are in. You find the person, then either <b>export</b> what Orbit holds about them as one file, or <b>erase</b> them: their identifying details are removed, while invoices, payments and ledger entries are kept. Data protection laws such as the UK GDPR, the EU GDPR and US state laws like the CCPA give people rights of this kind; the screen gives you the tools, and whether a request must be met is still your decision. Every export and erasure is logged on the same screen.",
    when: [
      "A customer, supplier or other contact asks for a copy of everything you hold about them.",
      "A former employee asks for their data, or asks you to delete it.",
      "A sales lead asks you to stop holding their details.",
      "You need to show when a request was answered and what was done."
    ],
    how: [
      "Open <b>Settings &rsaquo; Privacy &amp; data requests</b>. For this example, a recruitment agency has an email from the office manager of a prospective client, <i>ops@example.com</i>, asking for a copy of their data and then for it to be deleted.",
      "In <b>Who is this</b>, choose <i>A sales lead</i>.",
      "In <b>Search by name or email</b>, type <i>ops@ex</i>. After a moment you should see the matching leads, each with <span class='man-key'>Export their data</span> and <span class='man-key'>Erase them</span>.",
      "Click <span class='man-key'>Export their data</span> on the right line. The button reads <b>Gathering...</b>, then your browser saves a file such as <i>office_manager_northfield_logistics_data_2026-09-14.json</i> and you should see <b>Exported. Send them the file.</b>",
      "The screen refreshes. Under <b>What has been asked, and answered</b> you should see a new <b>Export</b> line with the date, the person and the number of rows found by email.",
      "Open the file and read it before sending it. It names the person and, under <i>records</i>, lists every row found for them. Send it to them in the way you have agreed.",
      "Search for them again and click <span class='man-key'>Erase them</span>. The first confirmation says that invoices, ledger entries and payments are kept and that erasing cannot be undone. Click OK.",
      "A second confirmation asks for a last check and reminds you to export first. Click OK. You should see <b>Erased. The record of it is kept as your proof.</b>",
      "Check <b>What has been asked, and answered</b>: there is now an <b>Erasure</b> line with the note that identifying fields were removed and financial records kept.",
      "Open the lead in CRM. Its contact name now reads <i>Erased 2026-09-14</i>, and its email, phone and notes are empty."
    ],
    fields: [
      ["Who is this", "What kind of record the person is. <i>A customer, supplier or contact</i> searches Contacts, <i>An employee</i> searches Employees and <i>A sales lead</i> searches CRM leads. It also decides what the export and the erasure cover. Changing it repeats the search.", "required"],
      ["Search by name or email", "At least two letters of the person's name or email address. Contacts match on name or email, employees on name or work email, and leads on the opportunity name, the contact name or the email. Up to 20 matches are shown.", "required"]
    ],
    buttons: [
      ["Export their data", "Gathers what Orbit holds about the person and downloads it as one JSON file named after them. The file holds who they are and, under records, every row carrying their email address in Orbit's personal-data tables (contacts, leads and lead contacts, employees, applicants and job applications, event guests and event suppliers, building residents and members, portal access and invitations). For a contact it adds their invoices and payments; for an employee, their payslips and timesheets. Nothing is changed, and the export is logged."],
      ["Erase them", "After two confirmations, anonymises the person. On their own record the name (for a lead, the contact name) becomes <i>Erased</i> and the date, and the details are cleared: for a contact the email, phone, mobile, street, city, website and notes; for an employee the first and last name, work and personal email, address and notes; for a lead the email, phone, notes, map link and location. Wherever else that email address appears in the personal-data tables, the email is cleared. Invoices, payments and ledger entries are not deleted. It cannot be undone, and the erasure is logged."]
    ],
    after: "An export changes nothing except adding an <b>Export</b> line to the log. An erasure changes the person's record in Contacts, Employees or CRM straight away; documents linked to them, such as invoices, payments and payslips, stay in the books and stay linked to the anonymised record. Both actions add a line to <b>What has been asked, and answered</b> with the date, the kind of request, the person's name and email as they were at the time, and the result. Those lines cannot be edited or deleted from the app, and the 50 most recent are shown. Backups downloaded before an erasure still contain the person, because they are files kept outside Orbit.",
    links: [
      { name: "Contacts", how: "A customer or supplier erased here stays in the list as Erased and the date, with their contact details cleared.", to: "contacts" },
      { name: "Employees", how: "An erased employee keeps their record, renamed and without email or address, so their payslips and timesheets still belong to a record.", to: "hr.emp" },
      { name: "CRM leads", how: "An erased lead keeps the opportunity, but its contact name becomes Erased and the date and its email and phone are cleared.", to: "crm.leads" },
      { name: "Backups", how: "A backup is a copy of the whole company, people included. Backups taken before an erasure still hold the person.", to: "settings.backups" }
    ],
    mistakes: [
      ["Type at least two letters.", "The search waits for two or more characters. Keep typing."],
      ["Nobody matches that.", "No record of the kind chosen in Who is this matches. Check the kind (a supplier is a contact, not a lead), try part of the email instead of the name, and leave out commas and brackets. An employee is found by name or work email only."],
      ["Only a company administrator can export a person's data", "Exporting needs an active owner, admin or accountant of this company. Ask one of them to do it."],
      ["Only a company administrator can erase a person's data", "Erasing needs an active owner, admin or accountant of this company. Ask one of them to do it."],
      ["No such person in this company", "The record no longer exists in this company, for example it was deleted after you searched. Search again and use the buttons on the new results."],
      ["The export holds only invoices and payments, not the contact itself", "The export finds rows by email address. When the person has no email on file, only the documents linked to their record are included (invoices and payments for a contact, payslips and timesheets for an employee). Add what else you hold about them yourself."],
      ["Another contact lost its email address too", "Erasure clears that email address wherever it appears, so a second record using the same address, such as a shared office inbox, loses it as well. Check before erasing someone whose address is shared."]
    ],
    tips: [
      "If the person asked for a copy and for deletion, export first. Once they are erased, the export can no longer find them by email.",
      "Read the export before sending it, and send it only once you are sure you are dealing with the person it is about.",
      "The log keeps the name and email the person had at the time, because it is your record that the request was answered.",
      "Erasure works in the company you are in. If the same person appears in another of your companies, switch to it and repeat.",
      "The screen does not record when a request arrived or when it is due, so note that date yourself."
    ]
  },

  "platform.pending": {
    title: "Pending signups",
    what: "This screen is for the <b>platform operator</b> only: the team that runs Orbit, not the businesses using it. When a new business applies for access, Orbit creates its organisation and first company with the status <b>pending</b>, and its people see a holding screen instead of the app. Each card here shows what the applicant entered, and you <b>approve</b> or <b>reject</b> it. The menu entry and the screen appear only for accounts the database lists as platform operators.",
    when: [
      "A new business has applied and is waiting to be let in.",
      "You want to check the details a business gave (type, scope of work, size, phone, registration number) before approving it.",
      "An application is clearly not genuine and should be refused."
    ],
    how: [
      "Sign in with a platform operator account and open <b>Settings &rsaquo; Pending signups</b>.",
      "You should see a line such as <b>2 applications awaiting review</b>, then one card per application, the most recent first.",
      "Read the card for <i>Harbour Wholesale Foods</i>. Under the name you see the business type and the place, for example <i>Supplier / trading &middot; Limassol, Cyprus</i>.",
      "Check the details listed below it: Scope of work, Employees, Phone, Reg / Tax no., Applied (the date and time of the application) and Terms accepted (the version of the Terms and Conditions agreed to). A detail the applicant left empty is not shown.",
      "If the business looks genuine, click <span class='man-key'>Approve</span>. You should see <b>Approved Harbour Wholesale Foods</b>, and the card leaves the list.",
      "For an application that is not genuine, click <span class='man-key'>Reject</span>. There is no confirmation: you should see <b>Rejected</b> straight away, and the card leaves the list.",
      "Tell the applicant the outcome yourself. Orbit does not email them when you approve or reject.",
      "Open <b>Settings &rsaquo; Tenants</b> to see the organisation with its new status."
    ],
    fields: [
      ["Organisation name", "The company name the applicant typed, shown as the card's heading.", "auto"],
      ["Business type and place", "The business type chosen at signup, with the city and country.", "auto"],
      ["Scope of work", "What the business says it does.", "auto"],
      ["Employees", "The size band chosen at signup, such as 6-20.", "auto"],
      ["Phone", "The contact phone number given.", "auto"],
      ["Reg / Tax no.", "The registration or tax number, if the applicant gave one.", "auto"],
      ["Applied", "When the application was submitted.", "auto"],
      ["Terms accepted", "Which version of the Terms and Conditions the applicant ticked to accept.", "auto"]
    ],
    buttons: [
      ["Approve", "Sets the organisation's status to active. Its members get into Orbit the next time they sign in or reload the page, and the card leaves the list."],
      ["Reject", "Sets the organisation's status to rejected, without asking for confirmation. Its members see <i>Application not approved</i> when they sign in. The card leaves the list, and no screen can change the status back."]
    ],
    after: "Approve and Reject change only the status of the applicant's organisation. The company, the applicant's owner membership and the details entered at signup stay as they are. While the status is pending or rejected, anyone whose current company belongs to that organisation sees a holding screen when they sign in (<i>Application received</i> or <i>Application not approved</i>) instead of the app, unless they are a platform operator. Once it is active, they reach the app normally. The new status shows in Tenants. Who can act is checked twice: in the app, the menu entry and the screen are shown only to platform operators (anyone else sees <i>Platform admins only.</i>); in the database, the list comes back empty and the status change is refused for anyone who is not a platform operator. Operators are added in the database by the platform team, not from the app.",
    links: [
      { name: "Tenants", how: "Every organisation on the platform with its status, including the ones approved or rejected here.", to: "platform.tenants" },
      { name: "Users &amp; Roles", how: "The person who applied becomes the owner of the new organisation and, once approved, invites the rest of their team there.", to: "settings.users" }
    ],
    mistakes: [
      ["Platform admins only.", "Your account is not a platform operator, so the screen shows nothing. Operators are added in the database by the platform team."],
      ["You don&rsquo;t have permission to do that.", "The database refused the change because the account is not a platform operator, for example it was removed from the operators since the page loaded. Reload the page."],
      ["No pending applications", "Not an error: nobody is waiting. New applications appear here as soon as they are submitted."],
      ["An approved applicant still sees Application received", "Their holding screen was loaded before you approved. Ask them to reload the page, or sign out and back in."],
      ["A business was rejected by mistake", "A rejected organisation leaves this list and Tenants has no button to change a status, so it cannot be undone on screen. The status has to be set back in the database."]
    ],
    tips: [
      "Reject has no confirmation step, so make sure you are on the right card before clicking it.",
      "The applicant's signup screen tells them they will hear back within 6 hours, so check this list at least that often.",
      "Any platform operator can approve and reject, including one whose support access is view-only: the check is on being an operator, not on write access."
    ]
  },

  "platform.tenants": {
    title: "Tenants",
    what: "A read-only list of every organisation on the platform, for the <b>platform operator</b> only. Each row shows the organisation's status, business type, country, how many companies and members it has, and when it applied. To support a tenant, you switch into one of its companies from the company picker; Orbit then shows a support banner and logs that you opened it. The menu entry and the screen appear only for accounts the database lists as platform operators.",
    when: [
      "You want an overview of the businesses on Orbit and their status.",
      "A tenant asks for help and you need to see their data as they see it.",
      "You want to check whether an organisation is active, pending or rejected."
    ],
    how: [
      "Sign in with a platform operator account and open <b>Settings &rsaquo; Tenants</b>. You should see a line such as <b>38 tenants on the platform</b> above the table.",
      "For this example, a physiotherapy clinic has asked for help. Find <i>Northside Physiotherapy</i> in the table, which lists the newest organisations first.",
      "Check <b>Status</b>: <i>Active</i> means its people can use Orbit, <i>Pending</i> means it is waiting in Pending signups, and <i>Rejected</i> means it was refused.",
      "Note how many <b>Companies</b> and <b>Members</b> it has, so you know what to expect when you look inside.",
      "Open the company picker at the top. As a platform operator it lists every company on the platform, not only your own. Pick the clinic's company.",
      "You should see a support banner saying you are viewing that company, which is not your organisation, and that your access is logged.",
      "Look at the screens the tenant is asking about. Anything you save there is a real change to their data.",
      "When you are done, pick one of your own companies in the company picker. The support banner disappears."
    ],
    fields: [
      ["Organisation", "The organisation's name.", "auto"],
      ["Status", "Active, Pending or Rejected. New organisations from the signup form start as Pending until approved in Pending signups.", "auto"],
      ["Business", "The business type chosen at signup.", "auto"],
      ["Country", "The country given at signup.", "auto"],
      ["Companies", "How many companies the organisation has.", "auto"],
      ["Members", "How many people belong to the organisation's team.", "auto"],
      ["Applied", "The date the organisation applied. Empty for an organisation that did not come through the signup application.", "auto"]
    ],
    buttons: [
      ["Company picker (top bar)", "Not on this screen, but how you support a tenant: pick one of its companies to work inside it. Switching into a company outside your own organisations shows the support banner and is logged."]
    ],
    after: "The screen changes nothing: it has no buttons, so a tenant cannot be suspended or have its status changed from here. Whenever the app opens in, or you switch into, a company outside your own organisations, Orbit writes a line to the platform access log saying which operator opened which company and organisation, and when. Only platform operators can read that log, and it has no screen in the app. While you are in a tenant's company, what you can change depends on your operator access: an operator with write access can change the tenant's data, and one with view-only access is refused. The list itself comes from the database only for platform operators; for anyone else it is empty, and the app shows <i>Platform admins only.</i>",
    links: [
      { name: "Pending signups", how: "Where an organisation with the status Pending is approved or rejected.", to: "platform.pending" },
      { name: "Audit Log", how: "Changes you make on audited records while supporting a tenant are recorded in that company's Audit Log with your email, like anyone else's.", to: "settings.audit" }
    ],
    mistakes: [
      ["Platform admins only.", "Your account is not a platform operator, so the screen shows nothing. Operators are added in the database by the platform team."],
      ["No tenants.", "The list could not be loaded or came back empty. Reload the page; if it stays empty, check that your account is still a platform operator."],
      ["A tenant's company is missing from the company picker", "The picker is loaded when the page opens, so a company created since then is not in it. Reload the page."],
      ["Your changes in a tenant's company are refused", "Your operator access is view-only. The change has to be made by an operator with write access, or by the tenant."]
    ],
    tips: [
      "Stay in a tenant's company only as long as the support needs, then switch back to your own: every switch into a tenant is logged.",
      "The support banner is your reminder that you are not in your own organisation, so do not create records there by accident.",
      "Your own organisation is in the list too, as a tenant like any other."
    ]
  },

  "dash.home": {
    title: "Dashboard",
    what: "The <b>Dashboard</b> in Insights is a page of report tiles you build yourself. Each tile counts or adds up one kind of record (customer invoices, purchase orders, projects or execution tasks), can split it by status, month, customer, vendor, stage or priority, and shows it as a single number, a bar chart, a line or a table. The figures are worked out from your live data every time the page opens, and clicking a figure shows the records behind it.",
    when: [
      "You want a number you check often, such as how much customers still owe you, without running a full report.",
      "You want to see invoiced amounts month by month, or purchase orders by vendor, at a glance.",
      "You are preparing a tile to email automatically. Scheduled reports can only send a tile that already exists here.",
      "A figure looks wrong and you want to see exactly which records make it up."
    ],
    how: [
      "Open <b>Insights &rsaquo; Dashboard</b> and click <span class='man-key'>+ New report</span>. For this example, an IT support firm wants to see what its customers still owe, split by customer.",
      "Type <i>Owed by customer</i> in <b>Title</b>.",
      "Leave <b>Data source</b> on <i>Customer invoices</i>. Choose the source first: changing it resets Measure and Group by.",
      "Set <b>Measure</b> to <i>Amount outstanding</i>.",
      "Set <b>Group by</b> to <i>Customer</i> and <b>Chart</b> to <i>Bar chart</i>, then click <span class='man-key'>Save</span>. You should see a new tile titled Owed by customer, with one bar per customer, largest first, and the amount beside each bar in your company currency.",
      "Click the bar for one customer. You should see a window titled with the customer's name and the number of records, listing each invoice with its number, customer, date and total.",
      "Click an invoice in that window. It opens in full.",
      "Go back to the Dashboard, click <span class='man-key'>Edit</span> on the tile, change <b>Chart</b> to <i>Table</i> and save. The same figures now show as rows, and each row can be clicked in the same way.",
      "For a headline figure, create another tile with <b>Measure</b> <i>Total invoiced</i>, <b>Group by</b> <i>(single total)</i> and <b>Chart</b> <i>Single number</i>. You should see one large amount with <i>Total invoiced</i> under it."
    ],
    fields: [
      ["Title", "The name at the top of the tile, and the name the tile has in Scheduled reports. Left blank, it is saved as <i>Report</i>.", "optional"],
      ["Data source", "What is counted: <i>Customer invoices</i> (every customer invoice, drafts included), <i>Purchase orders</i> (every order), <i>Projects</i> (active and closed) or <i>Execution tasks</i> (tasks on the execution board). It starts on Customer invoices. Changing it resets Measure to the count and Group by to (single total).", "optional"],
      ["Measure", "What is worked out. Customer invoices: <i>Number of invoices</i>, <i>Total invoiced</i> or <i>Amount outstanding</i> (what is still unpaid). Purchase orders: <i>Number of orders</i> or <i>Total committed</i>. Projects: <i>Number of projects</i> or <i>Contract value</i>. Execution tasks: <i>Number of tasks</i> or <i>Effort points</i>. Money in another currency is converted into your company currency before it is added up; a document whose currency has no rate is added as it is.", "optional"],
      ["Group by", "How the figure is split. <i>(single total)</i> gives one number. Customer invoices: Status, Month (of the invoice date) or Customer. Purchase orders: Status, Vendor or Month (of the order date). Projects: Status (Active or Closed), Billing type or Customer. Execution tasks: Stage or Priority. Months are shown in date order; every other grouping is sorted largest first.", "optional"],
      ["Chart", "<i>Single number</i> shows the total as one large figure, even when a Group by is set. <i>Bar chart</i> shows the eight largest groups. <i>Line (over time)</i> draws one line across all the groups, and suits Month. <i>Table</i> lists every group with its value.", "optional"]
    ],
    buttons: [
      ["+ New report", "Opens the New report window. While the Dashboard is empty, the same button also shows in the middle of the page."],
      ["Edit", "On each tile. Opens the tile's settings so you can change them."],
      ["Save", "Saves the tile and redraws the Dashboard with it."],
      ["Cancel", "Closes the window without saving."],
      ["Delete", "In the Edit report window. Removes the tile straight away, without asking first. Any schedule that emails this tile is removed with it."],
      ["A number, a bar or a table row", "Opens a window listing the records behind that figure (the first 300). Click one to open it: the invoice, the purchase order, the project or the task. Line charts cannot be clicked."],
      ["Close", "Closes the list of records."]
    ],
    after: "A tile only reads your records; it never changes them. Tiles belong to the company, so everyone who can open Insights in this company sees the same Dashboard. Each tile is recalculated from the live data every time the page opens, so an invoice posted a minute ago shows the next time you open it. A tile is also what <b>Scheduled reports</b> emails, and deleting the tile deletes its schedules.",
    links: [
      { name: "Scheduled reports", how: "Emails any tile to a list of people daily, weekly or monthly.", to: "dash.schedules" },
      { name: "Forecast", how: "A ready-made view of posted sales and purchases with a three-month projection, with nothing to build.", to: "dash.forecast" },
      { name: "Customer Invoices", how: "The source of the Customer invoices tiles. Clicking an invoice in a drill-down opens it there.", to: "inv.out" },
      { name: "Purchase Orders", how: "The source of the Purchase orders tiles.", to: "po.list" },
      { name: "Projects", how: "The source of the Projects tiles: contract value, billing type, customer and whether the project is active.", to: "proj.list" }
    ],
    mistakes: [
      ["Could not load", "Shown on a tile whose figures could not be worked out, for example after a connection problem. Refresh the page to try again."],
      ["No data yet", "The tile is grouped, but there are no records of that kind in this company yet. It fills in once there are."],
      ["Open the dashboard again to drill into this", "The figure was clicked before the tile had finished loading. Open the Dashboard again and click once the numbers show."],
      ["You don&rsquo;t have permission to do that.", "Saving a tile was refused for your role. Only an owner, admin or accountant of the company can add or change tiles."],
      ["A total is bigger than you expected", "Customer invoice and purchase order tiles count every record, drafts included. Set Group by to Status to see drafts separately, or click the figure to see what is inside it."],
      ["Nothing happens when you click a line chart", "Line tiles cannot be clicked. Switch the tile to Bar chart or Table to drill into the records."]
    ],
    tips: [
      "Build the tile first, then schedule it: Scheduled reports only offers tiles that already exist on the Dashboard.",
      "Use Month with a Line chart to see a trend, and Customer or Vendor with a Bar chart to see who matters most.",
      "Tiles appear in the order they were created and cannot be dragged, so create the most important ones first."
    ]
  },

  "dash.forecast": {
    title: "Forecast",
    what: "<b>Forecast</b> shows what you invoiced and were billed each month over the last 12 months, and projects the next three months from that trend. Sales are your posted customer invoices; purchases are your posted vendor bills. It is a planning view: there is nothing to fill in, and nothing on the page changes your records.",
    when: [
      "You are planning cash or stock for the next quarter and want to know whether sales and purchases are rising or falling.",
      "You want a quick sense of whether the coming months are likely to bring in more than they cost.",
      "You want a month by month table of invoiced sales against bills without building a report."
    ],
    how: [
      "Open <b>Insights &rsaquo; Forecast</b>. For this example, a cafe has posted its customer invoices and supplier bills in Orbit for the past year.",
      "Look at the four cards along the top. <b>Forecast sales, next 3 months</b> is the total of the three projected months of sales, for example <i>USD 41,200.00</i>.",
      "<b>Forecast purchases</b> is the same for bills, and <b>Projected net</b> is sales minus purchases, shown in green when it is positive and in red when it is negative.",
      "The fourth card is an up or down arrow. It points up when the first projected month of sales is at least as high as this month's sales. The line under it gives your average monthly sales over the 12 months.",
      "In the <b>Sales</b> chart, the solid bars are real posted invoices, one per month, and the three striped bars at the end are the forecast. Hover over a bar to see the month and the amount.",
      "The <b>Purchases</b> chart works the same way for posted vendor bills.",
      "Scroll to <b>Month by month</b>. Each past month shows Sales, Purchases and Net marked <i>actual</i>; the three months ahead are marked <i>forecast</i>.",
      "If a month looks wrong, check that its invoices and bills are posted and carry the right date: a draft is not counted, and a document counts in the month of its invoice or bill date."
    ],
    after: "Forecast only reads. Each month's <b>Sales</b> is the total, tax included, of customer invoices with the status Posted and an invoice date in that month; <b>Purchases</b> is the same for vendor bills. A paid invoice still counts, because payment does not change its posted status. Drafts, anything not posted and credit notes are left out. Amounts in another currency are converted into your company currency; one whose currency has no rate is added as it is. The projection is a straight trend line (least squares) through the 12 monthly totals, carried on for three months and never below zero.",
    links: [
      { name: "Customer Invoices", how: "Posted customer invoices are the Sales figures.", to: "inv.out" },
      { name: "Bills", how: "Posted vendor bills are the Purchases figures.", to: "inv.in" },
      { name: "Dashboard", how: "Build your own tiles, such as Total invoiced grouped by Month, when you need other figures.", to: "dash.home" }
    ],
    mistakes: [
      ["Every figure is 0.00", "No customer invoices or vendor bills have been posted in this company in the last 12 months. Drafts are not counted: post them, or check that you are in the right company."],
      ["A month shows less than you invoiced", "Only posted documents count, in the month of their invoice or bill date. A draft, or a document dated in another month, is not in that bar."],
      ["The forecast swings sharply", "With few months of history, or one very large invoice, the trend line moves a lot. Read it as a guide, not a promise."],
      ["Foreign-currency amounts look far too large", "An invoice in another currency is converted only when Orbit has a rate for that currency. Without one it is added as if it were already in your currency. Add the missing exchange rate."]
    ],
    tips: [
      "The current month counts as the last actual month even though it is not over, so early in a month it pulls the trend down and makes the arrow more likely to point down.",
      "The figures include VAT, because they use document totals.",
      "Credit notes are not subtracted, so a month with large refunds reads higher than the money you actually kept."
    ]
  },

  "dash.schedules": {
    title: "Scheduled reports",
    what: "<b>Scheduled reports</b> emails a Dashboard tile to a list of people on a timetable: every day, one day a week or one day a month, at the hour you choose. Nobody has to remember to run it, and the people on the list do not need to sign in to Orbit to read it. You build the tile on the Dashboard first; this screen only decides when it goes and to whom.",
    when: [
      "A manager wants the outstanding invoices in their inbox every Monday morning.",
      "Your accountant asks for a monthly figure, such as purchase orders committed, on the first of each month.",
      "You want to pause a regular email for a while, or stop it for good."
    ],
    how: [
      "Make sure the tile exists on the <b>Dashboard</b>. For this example, an events agency has a tile called <i>Owed by customer</i> (Customer invoices, Amount outstanding, grouped by Customer).",
      "Open <b>Insights &rsaquo; Scheduled reports</b>. Under <b>Add a schedule</b>, type <i>Monday receivables</i> in the name box.",
      "Pick <i>Owed by customer</i> in the <b>Report...</b> list.",
      "Leave the frequency on <i>Weekly</i> and the day on <i>Monday</i>.",
      "Set the hour to <i>6</i>. Times are UTC: if your office is two hours ahead of UTC, 6 arrives at 8:00 your time.",
      "Type the addresses, separated by commas: <i>finance@example.com, director@example.com</i>.",
      "Click <span class='man-key'>Add</span>. You should see <i>Scheduled</i>, and a new row reading Monday receivables, Owed by customer, <i>Every Monday at 06:00</i>, the two addresses and an empty Last sent.",
      "After the first Monday at 06:00 UTC, <b>Last sent</b> shows the date and time, and both addresses have an email titled <i>Owed by customer - weekly summary</i>, with a table of the figures and an <b>Open the dashboard</b> button.",
      "To stop it for a while, click <span class='man-key'>Pause</span>. The row shows <b>Off</b> and nothing is sent until you click <span class='man-key'>Resume</span>."
    ],
    fields: [
      ["Name (e.g. Monday sales)", "What the schedule is called in this list and at the top of the email. Left blank, it is saved as <i>Scheduled report</i>.", "optional"],
      ["Report...", "The Dashboard tile to send. Only tiles that already exist are listed; when there are none, the screen asks you to create one first.", "required"],
      ["Weekly / Daily / Monthly", "How often it goes. Weekly shows a day of the week, Monthly shows a day of the month, Daily needs neither. Starts on Weekly.", "optional"],
      ["Day of the week", "Weekly only. The day it is sent, Sunday to Saturday. Starts on Monday.", "optional"],
      ["Day of month", "Monthly only. A day from 1 to 28, so it exists in every month. Starts on 1.", "optional"],
      ["at ... :00 UTC", "The hour it is sent, from 0 to 23, in UTC rather than your local time. Starts at 7. A number outside 0 to 23 is brought back into that range.", "optional"],
      ["emails, comma separated", "The addresses to send to, separated by commas. Everyone on the list gets the same email.", "required"]
    ],
    buttons: [
      ["Add", "Checks that a report is picked and an address is typed, saves the schedule switched on, and shows <i>Scheduled</i>."],
      ["Pause", "On a schedule that is on. Switches it off: the row shows <b>Off</b> and nothing is sent."],
      ["Resume", "On a paused schedule. Switches it back on for the next matching day and hour."],
      ["&times;", "Asks <i>Delete this schedule? The report itself stays on the dashboard.</i> and then removes the schedule. The tile is not touched."]
    ],
    after: "Nothing in your records changes. Each hour, Orbit's server looks for schedules that are switched on and whose day and hour (UTC) match, works out the tile's figures in the database, and emails them to every address on the row. A single-number tile arrives with the figure in the subject, for example <i>Owed by customer: USD 12,400</i>; a grouped tile arrives as a table of up to 12 groups, largest first. Once an email has been accepted for sending, <b>Last sent</b> is stamped so it does not go twice in the same hour. The email ends with a note that it can be changed or stopped in Insights, Scheduled reports.",
    links: [
      { name: "Dashboard", how: "Where the tiles are built. Changing a tile changes what its schedule sends, and deleting the tile deletes its schedules.", to: "dash.home" }
    ],
    mistakes: [
      ["Pick a report to send", "No tile is chosen in the Report list. Pick one; if the list is empty, build a tile on the Dashboard first."],
      ["Enter at least one email address", "The address box is empty or has no @ in it. Type at least one full address."],
      ["Create a report tile on the Dashboard first, then you can schedule it.", "The company has no Dashboard tiles yet. Build one in Insights, Dashboard, then come back."],
      ["Run supabase/114-report-scheduler.sql once to enable scheduled reports.", "Scheduled reports have not been set up in this database yet. Whoever looks after your Orbit set-up needs to run that step once."],
      ["You don&rsquo;t have permission to do that.", "Adding a schedule was refused for your role. Only an owner, admin or accountant of the company can add one."],
      ["The email arrives at the wrong time", "The hour is UTC, not your local time. Work out how far your office is from UTC and set the hour to match."],
      ["The emailed figures differ from the tile", "The email works its figures out in the database: it does not convert other currencies into your company currency, lists at most 12 groups, and shows statuses by their stored names. The Dashboard converts currencies first, so for a tile that mixes currencies, trust the Dashboard."]
    ],
    tips: [
      "There is no edit button. To change the time, the report or the recipients, delete the schedule and add it again.",
      "The people on the list see the figures and the customer or vendor names in the tile without signing in, so only add people who should see them.",
      "To test a schedule, add one for the next UTC hour sent only to yourself, check that it arrives, then delete it."
    ]
  },

  "desk": {
    title: "My Desk",
    what: "<b>My Desk</b> is your own start page for the day. Instead of company figures, it shows what is waiting on you: approvals you can decide, your overdue tasks and tasks due today, documents of yours that were rejected, weekdays with no hours logged, and today's diary. Below that are your open tasks, your hours this week, the calendar for the next two weeks, unread alerts and shortcuts. The only thing you can save from it is time, through <span class='man-key'>Log time</span>.",
    when: [
      "At the start of the working day, to see what needs doing first.",
      "After time away, to catch up on approvals and alerts.",
      "At the end of the day or week, to log hours you have not recorded yet.",
      "When a document you submitted has gone quiet and you want to know whether it was rejected."
    ],
    how: [
      "Open <b>My Desk</b> from the home screen. For this example, you are a project coordinator at a joinery workshop. You should see a greeting with your first name, today's date and the company name.",
      "Read <b>Waiting on you</b>. Each row has a count, a sentence such as <i>2 approvals are waiting on you</i> with the document numbers, and a button.",
      "Click <span class='man-key'>Review</span> on the approvals row. The Approvals inbox opens, where you approve or reject them.",
      "Come back to My Desk. On the row <i>1 task is past its date</i>, click <span class='man-key'>Open the oldest</span>. The task opens so you can update it.",
      "If a row says <i>No hours logged on 2 days this week</i>, followed by the day names, click <span class='man-key'>Log time</span>.",
      "In the Log time window, set <b>Date</b> to the missing day, <b>Hours</b> to 7.5, pick the <b>Project</b> (for example <i>Kitchen fit-out, Elm Road</i>) and a <b>Task</b> if there is one, type <i>Cabinet assembly</i> in <b>Description</b> and click <span class='man-key'>Log</span>. You should see <i>Time logged</i>, and that day's bar under <b>My week</b> grows.",
      "Look at <b>My open work</b>: your unfinished tasks, soonest date first, each with its project and date. Click one to open it.",
      "Check <b>Coming up</b> for calendar events in the next two weeks, and <b>Alerts</b> for unread notifications. Clicking an alert opens the screen it is about.",
      "When everything is dealt with, click <span class='man-key'>Refresh</span>. You should see <i>Nothing is waiting on you</i> and the line <i>No approvals, no overdue work, nothing due today.</i>"
    ],
    fields: [
      ["Date (Log time)", "The day the work was done. Starts on today.", "required"],
      ["Hours (Log time)", "How long you worked, in quarter hours if you like (0.25). Starts at 1 and must be more than 0.", "required"],
      ["Project (Log time)", "The project the time is charged to. Only active projects are listed, starting with the first one.", "required"],
      ["Task (optional) (Log time)", "A task within that project, if the time belongs to one. The list changes with the project.", "optional"],
      ["Description (Log time)", "A short note of what you worked on, for example <i>Site survey</i>.", "optional"],
      ["Who the hours belong to", "Not shown. Orbit records the hours against your login and, when your login is linked to one, your employee record.", "auto"]
    ],
    buttons: [
      ["Refresh", "Loads the page again with the latest information. The page does not update by itself."],
      ["Review", "On the approvals row. Opens the Approvals inbox."],
      ["Open the oldest", "On the overdue tasks row. Opens the overdue task with the earliest date."],
      ["See why", "On the rejected documents row. Opens the screen of the most recent rejected document, or the Approvals inbox when it has no link."],
      ["Open", "On the tasks due today row. Opens the first task due today."],
      ["Log time", "On the hours row and under My week. Opens the Log time window."],
      ["Open the calendar", "On the today's diary row. Opens the Calendar."],
      ["A task under My open work", "Opens that task."],
      ["See all (number)", "Shown under My open work when you have more than eight open tasks. It opens the Timesheets list."],
      ["An event under Coming up", "Opens the Calendar."],
      ["An alert", "Opens the screen the alert is about, when it has one."],
      ["Start something", "Up to six shortcuts from New quotation, New invoice, Enter a bill, Log time, The book, Floor, Open register, Service ticket, Calendar and Contacts, limited to apps that are switched on and that you can open. Each opens the matching screen (New invoice opens Customer Invoices, Log time opens Timesheets); it does not start a blank record by itself."],
      ["Log", "In the Log time window. Saves the hours and shows <i>Time logged</i>."],
      ["Cancel", "In the Log time window. Closes it without saving."]
    ],
    after: "Apart from Log time, My Desk only reads. Logging time adds a timesheet line for that date, project and task, recorded against your login and your employee record, and it appears in Timesheets. The blocks come from: <b>approvals</b> that are pending and whose rule names your employee record as approver, or names no one; <b>tasks</b> assigned to your employee record that are not done (up to 30); <b>rejected documents</b>, the last five approvals you requested that were rejected; the <b>hours row</b>, Monday to Friday days so far this week with nothing logged under your login, shown only if you can open Projects; <b>today's diary</b> and <b>Coming up</b>, the company's calendar events from today to 14 days ahead; and <b>Alerts</b>, your ten latest unread notifications, including ones sent to the whole company.",
    links: [
      { name: "Approvals inbox", how: "Where the approvals counted on My Desk are decided.", to: "approvals.inbox" },
      { name: "Approval Rules", how: "A rule that names an approver puts its documents on that person's My Desk only; a rule with no named approver shows them to everyone.", to: "approvals.rules" },
      { name: "Timesheets", how: "Every line logged from My Desk appears there.", to: "ts.list" },
      { name: "Calendar", how: "Events added there show under Coming up, and on the day under today's diary.", to: "cal.month" },
      { name: "Employees", how: "Your login must be set on your employee record for tasks to be matched to you.", to: "hr.emp" }
    ],
    mistakes: [
      ["Your login is not linked to an employee record yet, so tasks cannot be matched to you. Someone with access to People can set that on your employee record.", "Tasks are assigned to employees, and Orbit cannot find an employee record for your login in this company. Ask whoever manages employees to set your user on your record, then click Refresh."],
      ["Create a project first", "Log time needs at least one active project to charge the hours to. Create a project, or ask whoever manages Projects."],
      ["Enter the hours worked", "Hours is empty, zero or negative. Type the time worked, for example 7.5."],
      ["Could not save: (reason)", "The timesheet line was refused, for the reason shown. Correct it and click Log again."],
      ["An approval you expected is not listed", "Only approvals whose rule names your employee record, or names no one, appear. Check the approval rule and that your login is set on your employee record."],
      ["A day shows no hours although time was logged for you", "Only hours recorded under your own login count here, so a line someone else logged on your behalf is not included."]
    ],
    tips: [
      "An empty Waiting on you is the aim: it means nothing needs you right now.",
      "Two people in the same company see different My Desks: tasks, approvals, hours and rejected documents are matched to whoever is signed in. Coming up and company-wide alerts are the same for everyone.",
      "Coming up shows events added in the Calendar only. Dates Orbit collects from other apps, such as invoices falling due, are on the Calendar itself."
    ]
  },

  "cal.month": {
    title: "Calendar",
    what: "The <b>Calendar</b> shows one month at a time, Monday to Sunday, with everything that has a date: the events you add here, plus dates Orbit collects by itself from other apps, such as customer invoices falling due, submittals and RFIs due, certifications expiring, planned shifts, installation jobs due and dates from the Events app. Each kind has its own colour. <span class='man-key'>Sync</span> connects it with Google Calendar, Outlook or an iPhone.",
    when: [
      "You want to book a meeting, a site visit, a milestone, a reminder or a deadline for the team.",
      "You want to see what falls due this month across apps without opening each one.",
      "You want Orbit's diary in the calendar on your phone, or your own calendar's busy times shown in Orbit."
    ],
    how: [
      "Open <b>Calendar &rsaquo; Calendar</b>. You should see the month and year, a grid of weeks starting on Monday, and today highlighted.",
      "For this example, an IT support firm books a server upgrade visit. Click an empty part of the day, for example the 22nd. The <b>New event</b> window opens with that date filled in.",
      "Type <i>Server upgrade, Harbour Dental</i> in <b>Title</b> and choose <i>Site visit</i> in <b>Type</b>.",
      "Type <i>09:00</i> in <b>Start time</b> and <i>12:30</i> in <b>End time</b>, always with two digits for the hour.",
      "If the work belongs to a project, pick it in <b>Project</b>. Type the address in <b>Location</b> and <i>Bring spare drives</i> in <b>Notes</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a coloured chip with the title on the 22nd.",
      "Click the chip to open the event again, change it and save, or <span class='man-key'>Delete</span> it.",
      "Click a chip such as <i>Invoice due: INV/2026/0031</i>. It opens Collections, where unpaid customer invoices are chased.",
      "Use <span class='man-key'>&#8249;</span> and <span class='man-key'>&#8250;</span> to go back or forward a month, and <span class='man-key'>Today</span> to return to this month.",
      "Click <span class='man-key'>Sync</span>, then <span class='man-key'>Copy</span>, and add the address to your phone's calendar as a subscribed calendar. You should see your Orbit diary there, and it keeps itself up to date."
    ],
    fields: [
      ["Title", "What the event is, as it shows on the chip.", "required"],
      ["Date", "The day it falls on. Filled with the day you clicked; if cleared, today is used.", "optional"],
      ["Type", "Meeting, Site visit, Milestone, Reminder, Deadline or Other. It sets the chip's colour and the kind shown in Agenda. Starts on Meeting.", "optional"],
      ["Start time", "Free text, for example 09:00. It is not checked as a clock time, so type two-digit hours and minutes.", "optional"],
      ["End time", "Free text, for example 10:00. When both times are filled in, the end cannot be before the start.", "optional"],
      ["Project", "An active project the event belongs to, or (none).", "optional"],
      ["Location", "Where it takes place.", "optional"],
      ["Notes", "Anything else people should know.", "optional"],
      ["Put Orbit in your calendar app (Sync)", "Read only. Your own private address for this company's calendar, created the first time you open Sync. Anyone who has it can read the entries, so treat it like a password.", "auto"],
      ["Bring your calendar into Orbit (Sync)", "Your own secret iCalendar address from Google Calendar or Outlook. It must start with https:// (a webcal:// address is changed to https:// for you). Orbit names it Google Calendar, Outlook or Calendar from the address.", "required"]
    ],
    buttons: [
      ["&#8249; and &#8250;", "Move to the previous or the next month."],
      ["Today", "Returns to the current month."],
      ["Agenda", "Shows the same dates as a list for the next three months."],
      ["Sync", "Opens the Calendar sync window."],
      ["An empty part of a day", "Opens New event with that date."],
      ["A chip", "An event added here opens for editing. A date from the Events app opens that event. Other collected dates open their screen: Submittals, RFIs, Certifications, Collections, Planning or Install jobs. A busy time from your own calendar does nothing."],
      ["Save", "Saves the event, shows <i>Saved</i> and redraws the month."],
      ["Delete", "Only on an existing event. Deletes it at once, without asking, and shows <i>Deleted</i>."],
      ["Cancel", "Closes the window without saving."],
      ["Copy (Sync)", "Copies your address and shows <i>Address copied</i>."],
      ["Create a new address (Sync)", "After you confirm, replaces your address. Any calendar app using the old one stops updating until you give it the new address."],
      ["Add (Sync)", "Saves your pasted calendar address and shows <i>Added. It is read within the hour, and every hour after that.</i>"],
      ["Remove (Sync)", "Stops reading that calendar and removes its busy times from Orbit."]
    ],
    after: "An event is saved for the whole company: everyone who opens the Calendar or Agenda sees it, it appears under Coming up on everyone's My Desk, and it is included in each person's Sync address. Nothing is posted to the accounts. The other chips are read live from their apps each time the month opens, so they change when those records change: a submittal drops off once it is approved, approved with comments or superseded, an RFI once it is no longer open, a customer invoice once nothing is owed on it, an install job once it is done, and an Events task or payment once it is done or paid. Busy times brought in from your own calendar are visible only to you.",
    links: [
      { name: "Agenda", how: "The same items as a list, from today to three months ahead.", to: "cal.agenda" },
      { name: "My Desk", how: "Events for today and the next two weeks show there.", to: "desk" },
      { name: "Collections", how: "Posted customer invoices with money still owed show on their due date; the chip opens Collections.", to: "rep.collections" },
      { name: "Submittals", how: "A submittal with a due date shows until it is approved or superseded.", to: "doc.subs" },
      { name: "RFIs", how: "An open RFI shows on its needed-by date.", to: "doc.rfis" },
      { name: "Certifications", how: "Each certification shows on its expiry date, with the employee's name.", to: "hr.certs" },
      { name: "Planning", how: "Every planned shift shows on its date.", to: "hr.planning" },
      { name: "Install jobs", how: "An install job that is not done shows on its due date.", to: "inst.jobs" },
      { name: "Events", how: "Event dates, open event tasks and unpaid event payments show on their dates and open the event.", to: "events.list" },
      { name: "Appointments", how: "Appointments that are not cancelled are included in the Sync address, although they are not drawn on this grid.", to: "appt.cal" }
    ],
    mistakes: [
      ["Give the event a title", "The Title box is empty. Type what the event is."],
      ["End time can't be before the start time", "The end time comes before the start. Times are compared as text, so 9:00 counts as later than 10:00: type hours with two digits, such as 09:00."],
      ["You don&rsquo;t have permission to do that.", "Adding an event was refused for your role. Only an owner, admin or accountant of the company can add, change or delete events."],
      ["It says Saved but the change is not there", "When someone whose role cannot write edits an existing event, the change is not stored even though the window closes. Ask an owner, admin or accountant to make it."],
      ["Paste the full address, starting with https://", "In Sync, the address does not start with https:// or webcal://. Copy the whole secret address from your calendar's settings."],
      ["The calendar address returned (a number)", "Shown beside a synced calendar that Orbit could not read at its last attempt; <i>That address did not return a calendar</i> means the same. Copy the secret iCalendar address again, Remove the old one and Add the new one."],
      ["Not every item on a day shows", "A day shows four chips and then +N more. Open Agenda to see every item."]
    ],
    tips: [
      "Events you add are seen by the whole company, so keep private appointments in your own calendar and let Sync bring in the busy times.",
      "From your own calendar Orbit keeps each entry's start, end and title, but not attendees, descriptions or locations.",
      "The Sync address carries the company's calendar events and appointments from 60 days ago onwards; collected dates such as invoices falling due are not in it."
    ]
  },

  "cal.agenda": {
    title: "Agenda",
    what: "<b>Agenda</b> lists everything on the Calendar from today to the same date three months ahead, grouped by day, instead of a month grid. It holds the same items as the Calendar: events added there, busy times from your own synced calendar, and the dates Orbit collects from other apps. Each item shows what kind it is.",
    when: [
      "You want to read what is coming up over the next few weeks in date order.",
      "A day on the month grid shows +N more and you want to see every item.",
      "You want to know where each dated item comes from without opening it."
    ],
    how: [
      "Open <b>Calendar &rsaquo; Agenda</b>. You should see <b>Next 3 months</b> and, under it, a heading for each day that has something on it, such as <i>Monday, September 14 &middot; today</i>.",
      "For this example, a cafe uses Orbit for staff shifts and supplier reminders. Under each day, every item shows a coloured dot, its title and its kind, for example <i>Shift: Open (Barista)</i> with <i>planning</i>.",
      "Click an event added in the Calendar, for example <i>Coffee bean delivery</i> with <i>reminder</i>. The Edit event window opens.",
      "Change <b>Start time</b> to <i>07:30</i> and click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and Orbit shows the month view.",
      "Click <span class='man-key'>Agenda</span> at the top of the month to return to the list.",
      "Click an item such as <i>Cert expires: Food hygiene level 2</i> followed by the employee's name. Certifications opens.",
      "Come back to Agenda and click <span class='man-key'>Month view</span> to go to the grid, where you can add a new event by clicking a day."
    ],
    fields: [
      ["Title (Edit event)", "What the event is. It cannot be saved empty.", "required"],
      ["Date, Type, Start time, End time, Project, Location, Notes (Edit event)", "The same as on the Calendar: the day, the kind of event, free-text times with two-digit hours, an active project, the place and any notes.", "optional"]
    ],
    buttons: [
      ["Month view", "Opens the month grid."],
      ["An item", "An event added in the Calendar opens for editing. A date from the Events app opens that event. Other collected dates open their screen: Submittals, RFIs, Certifications, Collections, Planning or Install jobs. A busy time does nothing."],
      ["Save", "In the Edit event window. Stores the change, shows <i>Saved</i> and opens the month view."],
      ["Delete", "In the Edit event window. Deletes the event at once, without asking, shows <i>Deleted</i> and opens the month view."],
      ["Cancel", "Closes the Edit event window without saving."]
    ],
    after: "Agenda only reads, apart from editing an event, which works exactly as on the Calendar. It is worked out afresh each time it opens, from today to the same day three months ahead, so dates in the past are not listed. New events are added on the month view.",
    links: [
      { name: "Calendar", how: "The month grid, where events are added by clicking a day and where Sync is.", to: "cal.month" },
      { name: "My Desk", how: "Shows the calendar events for today and the next two weeks.", to: "desk" },
      { name: "Events", how: "Event dates, open event tasks and unpaid event payments appear with the kind <i>event</i>.", to: "events.list" }
    ],
    mistakes: [
      ["Nothing scheduled. Add events in the Calendar.", "Nothing with a date falls between today and three months from now. Add an event on the month view, or check the dates on the records you expected to see."],
      ["An item from last week is missing", "Agenda starts at today. Use the Calendar and its back arrow for past dates."],
      ["Give the event a title", "The Title box in the Edit event window is empty. Type what the event is."],
      ["End time can't be before the start time", "The end time comes before the start. Times are compared as text, so type hours with two digits, such as 09:00."]
    ],
    tips: [
      "The kind on the right tells you where an item came from: meeting, site visit, milestone, reminder, deadline and other are events added in the Calendar; submittal, rfi, cert, invoice, planning, install and event come from other apps; busy is your own synced calendar.",
      "On the same day, events added in the Calendar are listed first, then busy times, then dates from other apps."
    ]
  },

  "sign.list": {
    title: "Signature Requests",
    what: "The <b>Sign</b> app keeps a register of documents that need signing off, such as a payment certificate, a subcontract, a purchase order or a contract, and of who has to sign each one. Once a request is sent for signature, each signer signs inside Orbit by typing their name and drawing a signature, and Orbit records the date and time. Orbit does not email anyone or hold the document itself: the request records the sign-off, and its Reference ties it to the document.",
    when: [
      "A contract, subcontract or payment certificate needs a recorded sign-off from named people before you act on it.",
      "You want one list showing which documents are still awaiting signatures and which are signed.",
      "A signer is with you, at your screen or on a tablet, and can sign there and then."
    ],
    how: [
      "Open <b>Sign &rsaquo; Signature Requests</b> and click <span class='man-key'>New</span>. For this example, an events agency needs its venue contract for a product launch signed by its operations director and the client's representative.",
      "Type <i>Venue contract, spring product launch</i> in the title box at the top.",
      "Set <b>Type</b> to <i>Contract</i> and type the contract's own number in <b>Reference</b>, for example <i>VC-2026-014</i>.",
      "Pick the <b>Project</b> if the launch is one, and add anything useful in <b>Notes</b>.",
      "On the <b>Signers</b> tab, type the first signer's name in <b>Name</b> and <i>Operations director</i> in <b>Role</b>. Click <span class='man-key'>+ Add signer</span> and add the client's representative the same way, with <i>Client</i> as the role.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, a number such as <i>SIGN/2026/0003</i>, and the stage on <b>Draft</b>.",
      "Click <span class='man-key'>Send for signature</span>. You should see <i>Sent for signature</i> and the stage on <b>Awaiting signatures</b>. Type, Reference, Project and the signers are now locked, and each signer row has a <span class='man-key'>Sign</span> button. No email is sent.",
      "With the first signer at the screen, click <span class='man-key'>Sign</span> on their row. They type their full name in <b>Your name</b>, draw their signature in the box and click <span class='man-key'>Confirm signature</span>. You should see <i>Signed</i>, and the row shows Signed with the date and a small image of the signature.",
      "Repeat for the second signer. Once every signer has signed, a <span class='man-key'>Mark fully signed</span> button appears.",
      "Click <span class='man-key'>Mark fully signed</span>. You should see <i>Marked fully signed</i> and the stage on <b>Signed</b>. The request can no longer be changed."
    ],
    fields: [
      ["What is being signed (title)", "What the request is for, as it shows in the list. Left blank, it is saved as <i>Signature request</i>. Locked once signed.", "optional"],
      ["Type", "Payment certificate (IPC), Subcontract, Purchase order, Contract, Document or Other. Used to filter and group the list. Starts on Document. Locked after sending.", "optional"],
      ["Reference", "The number of the document being signed, for example an IPC or PO number, so the request can be searched by it. Locked after sending.", "optional"],
      ["Project", "An active project the document belongs to; it shows in the list. Locked after sending.", "optional"],
      ["Notes", "Anything the signers or your team should know. It can still be changed while the request is awaiting signatures.", "optional"],
      ["Number", "Given on the first save, such as <i>SIGN/2026/0001</i>. The prefix, digits and year are set in Settings, Document Numbering.", "auto"],
      ["Name (Signers)", "The person who has to sign. A row with no name is dropped when you save. Can only be changed in Draft.", "optional"],
      ["Role (Signers)", "Their role, for example <i>Client</i> or <i>Site manager</i>.", "optional"],
      ["Your name (Sign window)", "The signer types their full name. It replaces the name on that signer's row.", "required"],
      ["Draw your signature (Sign window)", "The signer draws with a mouse, finger or pen. If nothing is drawn, the typed name is kept as the signature and shown in italics.", "optional"],
      ["Signed (date)", "Filled in with the date and time when the signer confirms.", "auto"]
    ],
    buttons: [
      ["New", "Starts a blank request. Only shown to people who can manage the Sign app."],
      ["Filters", "Shows only requests that are Awaiting, Signed or in Draft."],
      ["Group By", "Groups the list by Type or by Status."],
      ["Export", "Downloads the list as a CSV file."],
      ["Save", "Saves the request. In Draft it also saves the signer rows, replacing the previous list. Hidden once the request is signed."],
      ["Discard", "Goes back to the list without saving."],
      ["Delete", "Only on a saved request, for people who can manage the Sign app. Asks first, then deletes the request with its signers and signatures."],
      ["Send for signature", "Only on a saved request in Draft. Saves first, then moves it to Awaiting signatures and locks Type, Reference, Project and the signers. It sends no email or link."],
      ["+ Add signer", "Adds a signer row. Draft only."],
      ["&times; (on a signer row)", "Removes that row; it is gone once you save. Draft only."],
      ["Sign", "On each unsigned row while the request is awaiting signatures. Opens the Sign window."],
      ["Clear", "In the Sign window. Wipes the drawing so the signer can start again."],
      ["Confirm signature", "In the Sign window. Records the typed name, the signature and the time on that row, and shows <i>Signed</i>."],
      ["Cancel", "In the Sign window. Closes it without signing."],
      ["Mark fully signed", "Appears once every signer has signed. Moves the request to Signed and locks it."]
    ],
    after: "A signature request is a record of sign-off inside Orbit. Saving, sending and signing change only the request and its signer rows: nothing is posted to the accounts, and the payment certificate, purchase order or contract named in Reference is not changed or approved by it. Each signature keeps the name typed, the drawing (or the typed name) and the date and time it was confirmed, and the list shows each request's status.",
    links: [
      { name: "Document Numbering", how: "Sets the prefix, digits and year of the SIGN numbers.", to: "settings.numbering" },
      { name: "Projects", how: "A request tagged to a project shows that project in the list.", to: "proj.list" },
      { name: "Purchase Orders", how: "Choose Purchase order as the Type and type the order number in Reference to log its sign-off; the order itself is not changed.", to: "po.list" },
      { name: "Approval Rules", how: "When a document should wait for someone's decision before it can go ahead, an approval rule does that; a signature request only records a sign-off.", to: "approvals.rules" }
    ],
    mistakes: [
      ["Add at least one signer", "Send for signature was clicked with no signer rows. Click + Add signer, type a name and send again."],
      ["Type your name", "In the Sign window, Your name is empty. The signer types their full name before confirming."],
      ["Save failed", "Changes to a saved request could not be stored. Check your connection and try again."],
      ["You don&rsquo;t have permission to do that.", "Creating a request was refused for your role. Only an owner, admin or accountant of the company can create, change or sign requests."],
      ["It says Signed but the row still shows the Sign button", "The person signed in to Orbit cannot write in this company, so the signature was not stored. Sign again while an owner, admin or accountant is signed in."],
      ["There is no Mark fully signed button", "It only appears when every signer row has been signed. Look for the row that still shows Sign."],
      ["A request is Awaiting but has no signers", "It was sent with only an empty signer row, which is not saved. Signers cannot be added after sending, so delete the request and create it again with named signers."]
    ],
    tips: [
      "Orbit records the name the signer types, not who is signed in, so make sure the person signing is the one at the screen.",
      "Type the document's own number in Reference, so the request and the document can be matched later.",
      "Nothing is emailed: tell signers yourself that a request is waiting for them."
    ]
  },

  "contacts": {
    title: "Contacts",
    what: "<b>Contacts</b> is the address book of the company you are working in: the customers you sell to, the suppliers and subcontractors you buy from, freelancers, and the people who work at those companies. A contact is entered once here and then picked everywhere else, so a quotation, a purchase order, an invoice, a project or a till sale all point at the same record. Each company keeps its own list. Contacts hold personal data (names, emails, phone numbers, addresses, bank details and notes), so record only what the relationship needs.",
    when: [
      "A new customer, supplier or subcontractor has to be set up before you quote, order or invoice.",
      "A company you deal with has several people you talk to (accounts, sales, technical) and you want them recorded under it.",
      "A phone number, address, tax number, payment terms or bank account has changed.",
      "You want to find everyone in an industry or country, export the list, or archive contacts you no longer use."
    ],
    how: [
      "Open <b>Contacts &rsaquo; Contacts</b> and click <span class='man-key'>New</span>. For this example, a garden centre is setting up a new supplier of compost and plant pots, <i>Northgate Supplies Ltd</i>.",
      "Type <i>Northgate Supplies Ltd</i> in the name box at the top. If you have their logo, click <b>Add photo</b> beside it.",
      "Leave <b>Contact type</b> on <i>Company (third party)</i> and change <b>Company type</b> from <i>Other</i> to <i>Supplier</i>. This is what makes them appear as a vendor on purchase orders and bills.",
      "Fill in <b>Contact person</b> (for example <i>Accounts team</i>) and <b>Email</b> (<i>accounts@northgate.example.com</i>), and enter the <b>Phone</b> as dialling code, area code and number in its three boxes.",
      "Enter the <b>Tax / VAT no.</b>, then the address in <b>Street</b>, <b>City</b> and <b>Country</b>.",
      "Choose <b>Payment terms</b> <i>30 days</i>. When you pick this supplier on a bill, the terms and due date follow.",
      "Choose <b>Industry</b> <i>Agriculture</i>. Under <b>What they can supply</b>, <i>Compost</i> is not listed yet, so type it in the box and click <span class='man-key'>Add</span>. You should see it appear already ticked.",
      "Set <b>Price rating</b> to <i>Average</i> and <b>Delivery / availability</b> to <i>Fast</i>. If you pay them by transfer, click <span class='man-key'>+ Add bank account</span> on the Bank accounts tab and fill in the bank, account number and IBAN.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the list again, where the new row shows <i>Vendor</i> under Type and <i>Compost</i> under Supplies.",
      "Open the contact again to record the people you deal with. Under <b>People at Northgate Supplies Ltd</b>, type a name, a role such as <i>Sales</i>, a phone and an email, and click <span class='man-key'>Add person</span>. In the list, that person now sits under the company."
    ],
    fields: [
      ["Name (top of the form)", "The company's or person's name as it should appear on documents. It is the one thing every contact must have.", "required"],
      ["Photo (beside the name)", "Click Add photo to upload a logo or picture. On a new contact it is uploaded when you save.", "optional"],
      ["Contact type", "<i>Company (third party)</i> for a business, <i>Freelancer (individual)</i> for a self-employed person, or <i>Employee of a company</i> for someone who works at one of your contacts. A freelancer is saved as a vendor. An employee is neither a customer nor a vendor.", "optional"],
      ["Company type", "Only for a company: Client, Supplier, Bank, Insurance, Subcontractor or Other. It decides where the contact can be picked. Client makes it a customer. Supplier or Subcontractor makes it a vendor. Bank, Insurance and Other make it neither. A new contact starts as Other.", "optional"],
      ["Works at", "Only for an employee. The company contact this person works for. They then appear under that company in the list and in its People section.", "optional"],
      ["Role / title", "The person's job title, such as Accountant or Driver. For an employee it shows in the Type column.", "optional"],
      ["Contact person", "The person you actually deal with at a company, as free text.", "optional"],
      ["Email", "The main email address. The list search and Find Duplicates both use it.", "optional"],
      ["Phone", "Dialling code, area code and number in three boxes, so every number is stored the same way. Find Duplicates compares its digits.", "optional"],
      ["Mobile", "The mobile number, in the same three boxes.", "optional"],
      ["Tax / VAT no.", "The contact's tax or VAT registration number.", "optional"],
      ["Website", "Their website address.", "optional"],
      ["Street", "The street or area.", "optional"],
      ["Building", "The building or block.", "optional"],
      ["Floor", "The floor or unit.", "optional"],
      ["City", "The town or city. Orbit suggests cities you have typed before.", "optional"],
      ["Country", "Chosen from the list. You can group the contact list by it.", "optional"],
      ["Payment terms", "How long this contact has to pay, from the options in Accounting &rsaquo; Configuration &rsaquo; Payment Terms (Due on receipt to 90 days until you set your own). Picking the contact on an invoice or bill sets these terms and works out the due date.", "optional"],
      ["Credit limit", "The most this customer should owe you. Leave it blank for no limit. On a customer invoice, Orbit shows a warning when their unpaid posted invoices plus this one would go over it, but you can still post. The Customer over credit limit automation can also flag it.", "optional"],
      ["Industry", "The sector they work in, used to group and filter the list. Pick one, or choose <i>+ Add a new industry...</i> to type a new one, which is kept for next time.", "optional"],
      ["Specialty", "A short note on what they are known for, such as <i>Commercial refrigeration</i>. It shows under the name in the list.", "optional"],
      ["Pricelist", "The price list used on this customer's sales order lines and at the point of sale. Leave <i>(default prices)</i> to use the normal prices.", "optional"],
      ["Intercompany entity", "Only when this contact is one of your own companies: choose which, so the balances between the two can be cancelled out in group reports. Leave <i>External party</i> for everyone else.", "optional"],
      ["Shared with the group", "Only shown when you have more than one company. Tick it to keep this contact the same in every company of the group. Saving then copies the name, contact person, email, phones, tax number, address, industry, specialty, website and customer or vendor flags to a linked copy in each other company, creating the copy where there is none. Credit limit, payment terms, pricelist and intercompany tag stay local to each company.", "optional"],
      ["What they can supply", "The services and products this supplier offers, ticked from the shared list in Services &amp; Products. Type a new one and click Add to tick it. It joins the shared list when you save. Ticks show in the Supplies column and are searchable.", "optional"],
      ["Price rating", "How this supplier compares on price, from Very Cheap to Very Expensive.", "optional"],
      ["Quality rating", "Your view of their quality: Low, Medium or High.", "optional"],
      ["Delivery / availability", "In stock, Fast, Average or Slow.", "optional"],
      ["Notes", "Anything worth remembering about the relationship. Notes about a person are personal data, so keep them factual and relevant.", "optional"],
      ["People at (company)", "Shown on a saved company contact. The people who work there: add one with Name, Role, Phone and Email, click a row to open that person, or click &times; to unlink them from the company (their record is kept).", "optional"],
      ["More details", "Only shown when custom fields for Contacts have been added in Settings &rsaquo; Custom Fields. A field marked with a star must be filled in before you can save.", "optional"],
      ["Bank accounts (tab)", "The contact's bank details, one row per account: Bank, Account no., IBAN and Currency. A row with no bank, account number or IBAN is not saved.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank contact form. Only shown if your role can manage Contacts."],
      ["Add line", "The last line of the list adds a contact without opening the form: type a name (and any of Industry, Email, Phone, City and Country) and press Enter. It is saved as a company that is neither customer nor vendor, so open it afterwards to set the Company type."],
      ["Click a cell", "Name, Industry, Email, Phone, City and Country can be changed straight in the list: click the cell, type, then press Enter to save or Esc to cancel."],
      ["Filters", "Customers, Vendors, Intercompany, Shared with the group and Archived. With several ticked, the list shows contacts matching any of them."],
      ["Group By", "Groups the list by Industry or Country."],
      ["Columns", "Chooses which columns show. Any other field of a contact can be added as a column."],
      ["Select", "Tick rows, then use Export selected, Archive or Delete on all of them at once."],
      ["Export", "Downloads the list, as currently searched and filtered, as a CSV file that opens in any spreadsheet program."],
      ["Save", "Saves the contact and returns to the list. With Shared with the group ticked, it also updates the linked copies and tells you how many other companies were updated."],
      ["Discard", "Returns to the list without saving."],
      ["Archive / Restore", "Shown on a saved contact. Archive marks it as archived: it keeps all its history, shows an Archived badge in the list and is found with the Archived filter. Restore makes it active again."],
      ["Delete", "Removes the contact for good after you confirm. Orbit refuses if the contact is on any quotation, sales order, purchase order, invoice or bill; archive it instead. Its bank accounts and portal access are removed with it."],
      ["Bills (smart button)", "On a saved contact opened from here: the number of bills recorded against this contact. Clicking it opens the Bills list."],
      ["Statement", "Opens the Statement of Account for this contact."]
    ],
    after: "A saved contact can be picked straight away in every app of this company. Customers (Company type Client) are offered on quotations and sales orders, invoices, recurring invoices, projects, delivery notes, CRM leads, events, tenders, appointments and the point of sale. Vendors (Supplier, Subcontractor or a Freelancer) are offered on purchase orders, bills, supplier prices and tools. Any contact can be chosen for a Statement of Account, a Portal Access invitation and the Counter cash desk. Payment terms set the due date on invoices and bills, the pricelist sets the prices on sales orders and at the till, and the credit limit drives the over-limit warning on customer invoices. Other companies in your organisation do not see this contact in their own list unless you tick Shared with the group.",
    links: [
      { name: "Customers", how: "The same records, showing only customers, inside Accounting.", to: "cust" },
      { name: "Vendors", how: "The same records, showing only vendors, inside Accounting.", to: "vend" },
      { name: "Find Duplicates", how: "Finds contacts entered twice (same name, email or phone) and merges them into one.", to: "contact.dedupe" },
      { name: "Services &amp; Products", how: "The shared list behind the What they can supply ticks.", to: "contact.caps" },
      { name: "Invoices", how: "A customer's payment terms and credit limit apply when you pick them on an invoice.", to: "inv.out" },
      { name: "Bills", how: "A vendor's payment terms set the terms and due date of their bills.", to: "inv.in" },
      { name: "Statement of Account", how: "Every movement for one contact over a period, opened from the Statement button.", to: "rep.stmt" },
      { name: "Payment Terms", how: "The options offered in the Payment terms field.", to: "acc.payterms" },
      { name: "Pricelists", how: "The price lists a customer can be given.", to: "sale.pricelists" },
      { name: "Custom Fields", how: "Adds your own boxes to the contact form, under More details.", to: "settings.customfields" },
      { name: "Portal Access", how: "Invites a contact to see their own documents in a read-only portal.", to: "portal.admin" },
      { name: "Leads", how: "The Create Customer button on a lead adds the lead's contact here as a customer.", to: "crm.leads" }
    ],
    mistakes: [
      ["Name is required", "The name box at the top of the form is empty. Type the company's or person's name, then Save."],
      ["Give the contact a name", "You pressed Enter on the Add line without a name. Type the name in its first box."],
      ["Type something on the line first", "The Add line is empty. Type at least a name before pressing Enter."],
      ["(field) is required.", "A custom field marked with a star under More details is empty. Fill it in, then Save."],
      ["This contact is used in other records - it can't be deleted. Archive it instead.", "The contact is on a quotation, sales order, purchase order, invoice or bill, and those must keep their party. Click Archive instead."],
      ["Some of these are used in other records - use Archive instead.", "At least one of the contacts ticked with Select has documents. Archive those instead of deleting them."],
      ["A customer no longer appears on invoices after you saved it here", "Company type sets the customer and vendor flags. A customer added from a dropdown or with Create Customer on a lead has no Company type, so it opens here as Other, and saving it as Other clears the customer flag. Set Company type to Client and save again."],
      ["Enter a name", "You clicked Add person with the Name box empty. Type the person's name first."]
    ],
    tips: [
      "Company type holds one value, so this form saves a company either as a customer or as a vendor, not both.",
      "The list search looks in the name, email, city, country, industry, specialty, role and supplies.",
      "In the list, people are tucked under the company they work at. Click the arrow beside a company to show or hide them.",
      "Saving contacts is limited to members whose role is owner, admin or accountant with access to this company.",
      "Before creating a contact, search the list for it. If one has been entered twice, merge the pair in Find Duplicates rather than deleting one."
    ]
  },

  "contact.dedupe": {
    title: "Find Duplicates",
    what: "<b>Find Duplicates</b> scans this company's contacts for records that look like the same party entered twice, and lets you merge each group into the one you keep. Merging moves the other record's documents that can move onto the one you keep, then marks the other record as merged. Nothing is deleted.",
    when: [
      "The same customer or supplier shows up twice when you pick a party on an order or an invoice.",
      "After contacts have been imported, or after several people have been adding them.",
      "A customer's statement looks incomplete because some of their documents sit under a second record."
    ],
    how: [
      "Open <b>Contacts &rsaquo; Find Duplicates</b>. Orbit scans as soon as the screen opens. For this example, a pharmacy has entered its wholesaler twice, as <i>Riverside Medical Supplies Ltd</i> and <i>riverside medical supplies ltd.</i>",
      "You should see a card headed <b>2 contacts</b> with the badge <i>same name</i>, listing both records with their email, phone and tax number.",
      "Decide which record to keep. Prefer the one your posted bills are on, then the one with the fuller details. Select its round button (the first row is selected to start with).",
      "Click <span class='man-key'>Merge into selected</span>.",
      "The confirmation names the contact you are keeping. Click OK.",
      "You should see a message such as <i>Merged 1 contact - 3 document links moved</i>. The page scans again and the card is gone.",
      "Open <b>Contacts &rsaquo; Contacts</b>. The other record is still there, now named <i>riverside medical supplies ltd. [merged]</i>. Open it and click <span class='man-key'>Archive</span> to mark it as out of use.",
      "Open the kept contact and click <span class='man-key'>Statement</span> to check its documents are all there."
    ],
    fields: [
      ["Round button on each row", "The contact to keep. Every other contact in the same card is merged into it. Orbit selects the first row; change it before merging.", "auto"]
    ],
    buttons: [
      ["Merge into selected", "After you confirm, takes each other contact in the card, moves its links on to the kept contact (see below), adds [merged] to its name and records which contact it was merged into and on what date. The page then scans again."]
    ],
    after: "Merging moves the other contact's links on quotations and sales orders, purchase orders, invoices and bills, payments, projects and tasks, stock transfers, delivery notes, RFQs (including invited vendors, bids and the award), tenders, CRM leads and activities, recurring invoices, payment follow-ups, bank statement lines, journal lines, portal access, event suppliers and event payment reminders, bank accounts, and tools the contact holds. Each kind of record moves in one go, so if even one of them is locked, that whole kind stays behind. A <b>posted</b> invoice or bill cannot change its party, and the lines of a posted journal entry cannot be changed. So if the other contact had one posted invoice, all of its invoices stay with it, and likewise its journal lines. Records not in that list, such as Plot ownerships and tenancies, point of sale orders and loyalty accounts, are not moved. The merged contact is neither deleted nor archived: it stays in Contacts with [merged] after its name, and it is left out of future scans. There is no undo.",
    links: [
      { name: "Contacts", how: "Both the kept contact and the merged one live there. Archive the merged one from its form.", to: "contacts" },
      { name: "Statement of Account", how: "Check the kept contact after a merge. Posted documents that could not move still show under the merged contact.", to: "rep.stmt" },
      { name: "Invoices", how: "A posted invoice's party is locked, which is why it stays with the contact it was posted to.", to: "inv.out" }
    ],
    mistakes: [
      ["No likely duplicate contacts found - nothing matches on name, email or phone. Good, your contact list is clean.", "Nothing matched exactly. Names only match when they are identical once capitals, spaces and punctuation are ignored, so <i>Northgate Supplies</i> and <i>Northgate Supplies Ltd</i> are not flagged. To merge near misses, make the two names identical in Contacts first, then open this screen again."],
      ["Merged 1 contact - 0 document links moved", "Nothing could be moved. Either the contact had no documents, or its documents are posted and locked, or your role cannot change them. The documents stay with the merged contact, so keep it archived rather than deleted."],
      ["Contacts with nothing in common are grouped as same name", "Name matching keeps only the letters a to z and the digits 0 to 9. Names written entirely in another script, such as Arabic, reduce to nothing and are all grouped together. Do not merge these: they are not duplicates."],
      ["The merged contact is still in the Contacts list", "Merging renames it with [merged] but leaves it active. Open it in Contacts and click Archive."]
    ],
    tips: [
      "Matches are exact: the same name ignoring capitals, spaces and punctuation; the same email ignoring capitals; or the same phone digits, at least six of them. Mobile numbers and tax numbers are shown but not compared.",
      "Keep the contact your posted invoices and bills are on, because posted documents cannot move to another contact.",
      "One contact can appear in two cards, for example once for its name and once for its email. The page scans again after every merge, so work from the top.",
      "Only the contacts of the company you are working in are scanned."
    ]
  },

  "contact.caps": {
    title: "Services & Products",
    what: "<b>Services &amp; Products</b> is the master list of what a supplier can offer, such as <i>Laundry</i>, <i>Fresh produce</i> or <i>Building maintenance</i>. These are the ticks under <b>What they can supply</b> on each contact. The list is shared by every company in your organisation, and renaming or deleting an entry also updates the contacts of the company you are working in.",
    when: [
      "Before your team starts adding suppliers, so everyone ticks the same spelling of each service.",
      "Two entries mean the same thing and you want only one.",
      "You want to see how many suppliers offer a service."
    ],
    how: [
      "Open <b>Contacts &rsaquo; Configuration &rsaquo; Services &amp; Products</b>. For this example, a hotel is sorting its suppliers by what they supply.",
      "Type <i>Laundry</i> in <b>Add a service or product...</b> and click <span class='man-key'>Add</span>. You should see <i>Added</i> and a new row with <b>Used by</b> 0.",
      "Add <i>Fresh produce</i> and <i>Maintenance</i> the same way.",
      "Open <b>Contacts &rsaquo; Contacts</b>, open the hotel's laundry supplier, tick <b>Laundry</b> under What they can supply and click <span class='man-key'>Save</span>.",
      "Come back to Services &amp; Products. <b>Used by</b> for Laundry now shows 1.",
      "To tidy an entry, edit the text in its box, for example from <i>Maintenance</i> to <i>Building maintenance</i>, and click <span class='man-key'>Rename</span>. You should see <i>Renamed on 0 supplier(s)</i>, or the number of suppliers that had it ticked.",
      "To remove an entry, click <span class='man-key'>&times;</span> on its row and confirm. You should see <i>Deleted</i>."
    ],
    fields: [
      ["Add a service or product...", "The name of a new entry. It cannot repeat a name already in the list, ignoring capitals.", "required"],
      ["Name (on each row)", "The entry's name. Edit it in the box, then click Rename to save the change.", "required"],
      ["Used by", "How many contacts in this company have the entry ticked.", "auto"]
    ],
    buttons: [
      ["Add", "Adds the typed name to the list."],
      ["Rename", "Saves the new name and changes it on every contact in this company that had the old name ticked."],
      ["&times;", "After you confirm, deletes the entry and removes its tick from every contact in this company that had it."]
    ],
    after: "An entry added here is offered on the contact form in every company of your organisation. The ticks themselves are stored on each contact, and they fill the Supplies column and the search in Contacts and Vendors. Renaming or deleting only updates the contacts of the company you are working in. Contacts in your other companies keep the old name, which still shows as a tick on those contacts. While the list is empty, the contact form offers a set of starter suggestions instead.",
    links: [
      { name: "Contacts", how: "Each contact's What they can supply ticks come from this list.", to: "contacts" },
      { name: "Vendors", how: "Supplier records opened from Accounting show the same ticks and the Supplies column.", to: "vend" }
    ],
    mistakes: [
      ["Already in the list", "An entry with the same name, ignoring capitals, already exists. Use that one."],
      ["No change", "You clicked Rename without changing the name, or the box is empty. Type the new name first."],
      ["A rename is refused because the record already exists", "The list cannot hold the same name twice, ignoring capitals. Delete one of the two entries, then tick the other on the contacts that need it."]
    ],
    tips: [
      "Agree the names before suppliers are added, so one service is not spelt three ways.",
      "You can also add an entry from a contact: type it under What they can supply and click Add, and it joins this list when the contact is saved.",
      "Deleting cannot be undone: the tick is removed from this company's contacts."
    ]
  },

  "kb.articles": {
    title: "Articles",
    what: "<b>Articles</b> are your company's own written guides: how-tos, method statements, policies and checklists. You write in a simple markup (a # for a heading, a - for a list) with a live preview beside it, add pictures and screenshots taken inside Orbit, and the article reads as a page with a contents list that you can print.",
    when: [
      "A task is done the same way every time and you want it written down once, such as opening up in the morning or handling a return.",
      "A new team member needs a guide to follow.",
      "You want to capture an Orbit screen and explain it step by step.",
      "Someone needs to find a procedure. Search the list, or use the search at the top of Orbit, which also looks inside article text."
    ],
    how: [
      "Open <b>Knowledge &rsaquo; Articles</b> and click <span class='man-key'>New</span>. For this example, a pharmacy is writing down how staff check in a wholesaler delivery.",
      "Type the title <i>Checking in a delivery</i>, and <i>Stock</i> in <b>Category</b>.",
      "Set <b>Status</b> to <i>Draft</i> while you write.",
      "In the writing box on the left, click <span class='man-key'>Heading</span> and type <i>Before you start</i>. On a new line click <span class='man-key'>Steps</span> and type <i>Count the totes against the delivery note</i>. You should see the formatted page build up on the right as you type.",
      "Click <span class='man-key'>Warning</span> and type <i>Fridge items go into the fridge first.</i> It shows as a highlighted warning box.",
      "Click <span class='man-key'>Insert picture</span> and choose a photo of a delivery note. On a new article Orbit saves it first, then uploads the picture and adds a line starting with ![ where your cursor was.",
      "To point readers to another guide, click <span class='man-key'>Link to article</span> and replace <i>Article title</i> with the exact title of a published article, for example <i>[[Controlled drugs register]]</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the article as a reader sees it, with a Draft badge and a Contents list built from your headings.",
      "When it is ready, click <span class='man-key'>Edit</span>, change <b>Status</b> to <i>Published</i> and click <span class='man-key'>Save</span>."
    ],
    fields: [
      ["Article title", "The article's name, shown in the list and at the top of the page. Other articles link to it by this exact title.", "required"],
      ["Category", "A group such as Stock, Safety or HR. The list can be grouped by it, and published articles in the same category are listed at the foot of each other's pages.", "optional"],
      ["Status", "Published or Draft. A new article starts as Published. A published article must have some text; a draft can be saved empty. A draft shows a Draft badge and is left out of the same-category list and of article links.", "optional"],
      ["Writing box", "The article text in simple markup: # heading, ## sub-heading, ### smaller heading, - a list item, 1. a step, &gt; a callout, &gt;! a warning, **bold**, a table with | between cells, --- for a dividing line, [text](https://...) for a web link and [[title]] for another article. The preview on the right shows the result.", "optional"],
      ["Insert a screenshot...", "Only shown when this browser holds screenshots taken with the Me menu. Choosing one places it in the text. The last twenty are offered.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank article. Only shown if your role can manage Knowledge."],
      ["Filters", "Shows only Published or only Draft articles."],
      ["Group By", "Groups the list by Category."],
      ["Select / Export", "Downloads the list, or just the ticked articles, as a CSV file."],
      ["Heading, Sub-heading, List, Steps, Callout, Warning, Bold, Table, Link to article", "Each inserts that piece of markup at the cursor. Bold wraps the selected text."],
      ["Insert picture", "Uploads an image from your device and inserts it at the cursor. An article that has never been saved is saved first."],
      ["Save", "Saves the article and opens the reading view."],
      ["Read", "On a saved article: saves any changes, then opens the reading view."],
      ["Discard", "Returns to the list without saving."],
      ["Delete", "Deletes the article for good after you confirm. Only shown if your role can manage Knowledge."],
      ["Edit (reading view)", "Opens the article in the editor. Only shown if your role can manage Knowledge."],
      ["Print (reading view)", "Prints the article on its own, without the menus, the Contents list or the related articles."],
      ["Take a screenshot for Knowledge (Me menu)", "Shown in the other apps if your role can manage Knowledge. It captures the screen you are on, asks for a caption and keeps the picture for Insert a screenshot. It also gives you a line you can copy and paste into any article."]
    ],
    after: "An article belongs to the company you are in, and everyone in that company who can open Knowledge can read it. Saving updates the date shown in the Updated column. Published articles appear in the same-category list at the foot of other articles and can be linked to with [[title]]. The search at the top of Orbit finds articles by words in the title or the text.",
    links: [
      { name: "Me menu, Take a screenshot for Knowledge", how: "Captures any Orbit screen as a picture ready to insert into an article." },
      { name: "Search at the top of Orbit", how: "Finds an article by a word in its title or its text, from any app." }
    ],
    mistakes: [
      ["Give the article a title", "The title box is empty. Type a title, then Save."],
      ["Add some content before publishing, or keep it as a draft.", "Status is Published but the writing box is empty. This also happens when you insert a picture into a brand-new, empty article left on Published. Write something, or set Status to Draft first."],
      ["Saved as a draft so the picture has a home", "Not an error: a new article has to be saved before a picture can be attached. It is saved with the Status currently chosen, even if that is Published, so check Status before you finish."],
      ["Upload failed: (reason)", "The picture could not be stored, often because the connection dropped. Try again."],
      ["A [[link]] shows as missing", "The text inside the brackets must match the title of a published article (capitals do not matter). Correct the spelling, or publish the article it points to."],
      ["The Contents list does not appear", "Contents is built only from main headings, the lines that start with a single #. Use Heading rather than Sub-heading for the main sections."]
    ],
    tips: [
      "Drafts are not hidden: anyone who can open Articles sees them in the list with a Draft badge, and the search at the top of Orbit finds them.",
      "The screenshots offered under Insert a screenshot are remembered by this browser only. On another computer, paste the line copied when the screenshot was taken.",
      "Keep one task per article and link related articles with [[title]], so each page stays short enough to follow."
    ]
  },

  "web.sites": {
    title: "Sites",
    what: "A <b>site</b> is a public website that Orbit hosts for your company. Each site gets a free address of its own (<i>yourname.sites.spacework.ai</i>), can also answer on your own domain, and is made of pages you build from ready-made sections. This screen lists your sites; opening one shows its name, address, design, pages and custom domains, and opening a page takes you into the visual builder.",
    when: [
      "You want a website for the business without a separate website tool.",
      "You need a new page, such as a price list, an about page or a contact page, or want to change the words on one.",
      "You want the site to show on your own domain, for example www.example.com.",
      "You want to take a page, or the whole site, offline for a while."
    ],
    how: [
      "Open <b>Website &rsaquo; Sites</b> and click <span class='man-key'>New</span>. For this example, a yoga studio wants a simple one-page site.",
      "Type <i>Harbour Yoga</i> as the site name and <i>harbour-yoga</i> in <b>Subdomain</b>. Leave <b>Published</b> on <i>Draft (only you)</i> for now, and pick a <b>Brand colour</b> and a <b>Font</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, a Draft stage at the top, and two new areas under the form: <b>Pages</b> and <b>Custom domain</b>.",
      "Click <span class='man-key'>+ Add a page</span>. The builder opens full screen on an empty page called <i>Home</i> at the path <i>/</i>.",
      "Click <span class='man-key'>+ Add your first section</span> and choose <b>Hero</b>. Its settings open on the right. Click the big headline on the page itself and type <i>Yoga by the harbour, every morning</i>.",
      "Hover over the hero and click the round <span class='man-key'>+</span> under it to add <b>Pricing</b>, then again for <b>Contact</b>. Click each section to fill in its settings: the class passes and prices, then the studio's email and phone.",
      "Click <span class='man-key'>Done</span> in the right-hand panel to see <b>Page &amp; design</b>, and type one line in <b>SEO description</b>, for example <i>Morning and evening yoga classes by the harbour.</i>",
      "Click the phone icon at the top to check the page at phone width, then the screen icon to go back.",
      "Click <span class='man-key'>Publish</span>. You should see <i>Published - your page is live</i> and the button changes to <b>Published &#10003;</b>. Publishing a page also sets the whole site to Published.",
      "Click <span class='man-key'>Preview</span>. A new tab shows the live page, with the site name and a menu at the top and a footer at the bottom.",
      "Click <span class='man-key'>&larr; Site</span>. The page is listed under <b>Pages</b> as Published.",
      "To use your own domain, type <i>www.example.com</i> under <b>Custom domain</b> and click <span class='man-key'>Add domain</span>. Add the CNAME record the message names at your domain provider, then click <span class='man-key'>Verify</span> until the status reads <b>Live</b>."
    ],
    fields: [
      ["Site name", "The name at the top of the site form. It shows in the site's menu bar and footer, and in the browser tab of any page without its own title. Left blank, it saves as <i>My site</i>.", "optional"],
      ["Subdomain", "Your free address: what you type here followed by <i>.sites.spacework.ai</i>. Orbit lowercases it, turns spaces and other characters into dashes and keeps the first 40 characters. No two Orbit sites can share one. Left blank, the list shows <i>no subdomain</i>, the site can only be reached on a custom domain, and Preview and Open live have nothing to open.", "optional"],
      ["Published", "<i>Draft (only you)</i> or <i>Published (public)</i>. Nothing on a draft site is served, and that includes Preview and Open live, which show a 404 page. A published site still shows only the pages that are published themselves.", "optional"],
      ["Brand colour", "The colour of buttons, links, icons and highlights on every page of the site.", "optional"],
      ["Background", "The page background colour for the whole site.", "optional"],
      ["Font", "The typeface for the whole site: Inter, Onest, Poppins, Roboto, Montserrat, Playfair Display, Lora or Space Grotesk.", "optional"],
      ["Pages", "Shown after the first save. Every page of the site with its Title, Path and Status (Published or Draft). Click a row to open that page in the builder.", "auto"],
      ["Custom domain", "Shown after the first save. Type your domain, for example <i>www.example.com</i>; Orbit lowercases it and drops any http:// or https:// and anything after the first slash. Each domain added is listed with its status: <b>Pending DNS</b> until it is confirmed, then <b>Live</b>.", "optional"],
      ["Page title (builder)", "The name of the page, also editable in the box at the top of the builder. It is the browser tab and search result title, and the page's name in the site menu and footer.", "optional"],
      ["Path (builder)", "The page's address on the site: <i>/</i> for the home page, <i>/about</i> for an about page. Two pages of one site cannot share a path. The site's plain address shows the page at <i>/</i>. Left blank, it saves as <i>/</i>.", "optional"],
      ["SEO description (builder)", "One sentence about the page, used as the description search engines and link previews show under the title.", "optional"],
      ["Page published (builder)", "Draft or Published. Only published pages are served, and only published pages appear in the site's menu and footer. <span class='man-key'>Publish</span> sets it for you.", "optional"],
      ["Brand colour, Background, Font (builder, Design)", "The same whole-site design settings as on the site form. The page redraws as you change them, and they are saved to the site when you save the page.", "optional"],
      ["Navbar (builder, Design)", "Light or Dark, for the menu bar at the top of every page of the site. This setting is only in the builder.", "optional"],
      ["Hero (section)", "Eyebrow (a small label above the headline), Headline, Subtitle, Align, Button 1 text and link, Button 2 text and link, Background image URL (the picture fills the section, darkened, with white text) and Side image URL (split), shown beside the text when there is no background image.", "optional"],
      ["Heading and Text (sections)", "Heading: Title, Subtitle, Align and Background (default, light or dark). Text: Paragraph, where each line becomes a paragraph of its own.", "optional"],
      ["Image + text (section)", "Eyebrow, Title, Text, Image URL, Image on right, Button text, Button link and Background.", "optional"],
      ["Feature cards, Steps and Stats (sections)", "Feature cards: Section title, Subtitle, Columns (2, 3 or 4), Background and a list of Cards, each with an Icon (an icon name starting bi-, such as bi-heart, or an emoji), Title and Text. Steps: Section title and a list of Steps with Title and Text, numbered for you. Stats: a list of Number and Label pairs, and Background.", "optional"],
      ["Pricing, Team and Testimonials (sections)", "Pricing: Section title and Plans, each with Name, Price, Period, Features (one per line), Highlight, Badge (shown on a highlighted plan, <i>Popular</i> if left blank), Button and Button link. Team: Section title, Columns and Members with Name, Role and Photo URL. Testimonials: Section title and Quotes with Quote, Name and Company.", "optional"],
      ["Gallery, Image and Logo strip (sections)", "Gallery: Section title, Columns and Images, each an Image URL and Alt text. Image: Image URL, Alt text and Caption. Logo strip: Label and Logos, each a Logo URL and Alt, shown in grey. Pictures are web addresses: there is no upload, so the image must already be online.", "optional"],
      ["FAQ, Call to action and Button (sections)", "FAQ: Section title and Questions, each a Question and an Answer that opens when the question is clicked. Call to action: Headline, Text, and Button 1 and Button 2 with their links. Button: Text, Link and Align.", "optional"],
      ["Contact and Form (sections)", "Both put a form on the page asking for Name and Email (both required) and a Message. Contact has Title, Text, Email, Phone, Address (shown beside the form) and Button text. Form has Title, Button text and Form name (inbox tag), the label its answers carry in Form Submissions. Contact answers, and Form answers with no name, are tagged <i>contact</i>.", "optional"],
      ["Careers (from HR) (section)", "Title, Subtitle and Max jobs (blank = all). Lists the roles published in <b>Website &rsaquo; Careers</b>, each with an Apply form.", "optional"],
      ["Embed / HTML and Spacer (sections)", "Embed / HTML: code you paste is placed on the page exactly as written, for example a map from another service. Spacer: Height (px), from 0 to 240.", "optional"]
    ],
    buttons: [
      ["New", "Starts a new site. Shown to people who can manage the Website app."],
      ["Clicking a row", "Click the Address or Status of a row to open the site. Clicking the site's name renames it in place instead; press Enter to save."],
      ["Select", "Ticks sites for <span class='man-key'>Export selected</span> or <span class='man-key'>Delete</span>."],
      ["Export", "Downloads the list as a CSV file."],
      ["Save", "Saves the name, subdomain, published setting and design, and stays on the site. The first save of a new site opens the Pages and Custom domain areas."],
      ["Discard", "Back to the list. Changes since the last save are not kept."],
      ["Open live", "Opens the site's home page in a new tab. It shows a 404 page until the site and a page at / are both published."],
      ["Delete", "Deletes the site after you confirm, together with its pages and its custom domain entries. Form submissions from it are kept, with the Site column empty."],
      ["+ Add a page", "Opens the builder on a new empty page called Home at the path /. Change the path in Page &amp; design for any page other than the home page."],
      ["&times; on a page row", "Deletes that page after you confirm <i>Delete this page?</i>"],
      ["Add domain", "Saves the domain typed in the box, registers it for a security certificate, and tells you the DNS record to add."],
      ["Verify", "Checks the domain again. It turns <b>Live</b> once the record is found and the certificate is issued, or the message says what is still missing."],
      ["&times; on a domain row", "Removes the domain straight away, with no confirmation."],
      ["&larr; Site (builder)", "Back to the site form. With unsaved changes it asks first."],
      ["Desktop and Mobile icons (builder)", "Show the page at full width or at phone width while you edit."],
      ["Preview (builder)", "Saves the page, then opens it in a new tab. A page or site that is not published shows a 404 page there."],
      ["Save (builder)", "Saves the page and the site's design. It reads <b>Save *</b> while there are unsaved changes."],
      ["Publish (builder)", "Marks the page and the whole site Published, and saves both."],
      ["+ between sections (builder)", "Opens <b>Add a section</b>, grouped as Headers, Text, Content, Media, Forms, ERP and Basic. The section you pick is added with starter text to replace."],
      ["Section toolbar (builder)", "Hover over a section for Move up, Move down, Duplicate, Settings and Delete. Click a section to open its settings on the right; click its headline to type straight on the page."],
      ["Done, Up, Down, Duplicate, Delete (settings panel)", "Close the section's settings, or move, copy or remove the section. Inside a list such as cards, plans or questions, the small arrows and cross move or remove one item and <span class='man-key'>+ Add</span> adds another."]
    ],
    after: "Nothing is public until both the site and the page are published. From then on every published page is served on the site's free address and on each custom domain marked Live, with the site name and a menu of all published pages at the top and a footer at the bottom. Contact and Form sections send what visitors type to <b>Form Submissions</b>, and a Careers section lists the roles published in <b>Careers</b> and sends applications to <b>Applications</b>. Only company members with the owner, admin or accountant role can save sites, pages and domains.",
    links: [
      { name: "Form Submissions", how: "What visitors send through a Contact or Form section lands there, tagged with the form's name.", to: "web.subs" },
      { name: "Careers", how: "The roles a Careers section lists. Only published roles show.", to: "web.jobs" },
      { name: "Applications", how: "Where the Apply form in a Careers section sends people.", to: "web.applications" },
      { name: "Connect a site", how: "If your website lives elsewhere, paste the careers list into it instead of building a site here.", to: "web.connect" }
    ],
    mistakes: [
      ["A record with Slug (subdomain) already exists. Use a different one.", "Another Orbit site already uses that subdomain; no two sites can share one. Choose a different subdomain and Save."],
      ["A record with Path (path) already exists. Use a different one.", "Another page of this site already has that path, often a second page left on /. Change the Path in the builder's Page &amp; design panel, then Save."],
      ["A page reading 404, No published page here for (address)", "There is nothing public at that address: the site is still a draft, the page is not published, no published page has that path (the plain address needs a published page at /), the site has no subdomain, or the custom domain is not Live yet. Publish the site and page, or check the path."],
      ["Domain added. At your registrar add a CNAME:  (domain)  &rarr;  sites.spacework.ai , then click Verify.", "Not an error: the next step. At your domain provider, add a CNAME record for that domain pointing at sites.spacework.ai, then click Verify."],
      ["Add this DNS TXT to verify:  (name) = (value)", "The domain's ownership has to be proved before it can go live. Add a TXT record with that name and value at your domain provider, then click Verify again."],
      ["Still pending - point the CNAME at sites.spacework.ai and Verify again.", "The domain is not confirmed yet. Check the CNAME record at your domain provider, give the change time to take effect, and click Verify again later."],
      ["Domain saved. Custom-domain SSL is not switched on yet - set the Cloudflare token to activate it (see setup).", "The domain was saved, but custom domains are not switched on for this Orbit service, so it stays Pending DNS. The site still works on its free subdomain. Verify says <i>Custom-domain SSL is not configured yet.</i> for the same reason."],
      ["Domain saved, but registration failed: (reason)", "The domain was saved but could not be registered for a certificate; the reason follows the colon. Fix what it names, remove the domain with &times; and add it again."],
      ["That already exists - a record with the same code or number is already saved.", "Shown on Add domain: that domain is already attached to a site, in this company or another. A domain can serve only one site."],
      ["You don&rsquo;t have permission to do that.", "Only members with the owner, admin or accountant role in this company can save sites, pages and domains. Ask one of them to make the change."],
      ["Leave the builder? Unsaved changes will be lost.", "You clicked &larr; Site with changes not yet saved. Cancel and click Save first, unless you mean to throw them away."],
      ["The menu bar went back to Light", "Navbar is set only in the builder, and saving the site form rewrites the design without it. Set Navbar again in the builder's Page &amp; design panel and save the page."],
      ["Could not load the site engine.", "The builder could not load the part that draws the page. Reload Orbit and open the page again."]
    ],
    tips: [
      "A page goes public only when both the page and its site are published, so set a page back to Draft to take it offline without deleting it.",
      "Every published page is added to the site's menu and footer automatically. Keep a page as Draft until it is ready.",
      "Pictures are added as web addresses (Image URL). There is no upload, so use an image that is already online.",
      "Inside the builder a Careers section shows only a loading spinner; the roles appear on the live page.",
      "Links on the page do not open while you are in the builder, so you can click near them safely."
    ]
  },

  "web.jobs": {
    title: "Careers",
    what: "<b>Careers</b> is the list of roles you advertise. A role set to Published appears on your public careers list, both in the Careers section of an Orbit site and in the careers snippet from Connect a site, with an Apply button. Applications people send arrive in <b>Applications</b>.",
    when: [
      "You are hiring and want the role on your website.",
      "A role is filled or on hold and should come off the website.",
      "You want applicants to apply on another web page instead of the built-in form."
    ],
    how: [
      "Open <b>Website &rsaquo; Careers</b> and click <span class='man-key'>New</span>. For this example, a solar installer is hiring.",
      "Type <i>Solar Panel Installer</i> as the job title at the top.",
      "Fill in <b>Location</b> <i>Bristol</i>, <b>Employment type</b> <i>Full-time</i> and <b>Department</b> <i>Installations</i>.",
      "In <b>Description</b>, write the advert in plain text, one point per line: what the job involves, the hours, and what you need from the person.",
      "Leave <b>External apply link</b> empty so people apply through Orbit's own form.",
      "Set <b>Published</b> to <i>Published</i> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the list, with the role marked Published.",
      "Open a site page that has a <b>Careers</b> section, or the page where you pasted the careers snippet. The role shows with its location, type and department, its description and an <span class='man-key'>Apply</span> button.",
      "Click <span class='man-key'>Apply</span>. You should see a form open under the role asking for a name, an email, a link to a CV and a message.",
      "When the role is filled, open it, set <b>Published</b> back to <i>Draft</i> and click <span class='man-key'>Save</span>. It no longer appears on the website the next time the page loads."
    ],
    fields: [
      ["Job title", "The role's name, shown as the heading of the listing. Left blank, it saves as <i>Untitled role</i>.", "optional"],
      ["Location", "Where the job is, such as a town or <i>Remote</i>. Shown under the title.", "optional"],
      ["Employment type", "Free text such as Full-time, Part-time or Contract. Shown under the title.", "optional"],
      ["Department", "The team the role sits in. Shown under the title.", "optional"],
      ["Published", "Draft or Published. Only published roles appear on the website; a draft stays here only.", "optional"],
      ["External apply link", "A web address where people should apply instead. When it is set, the Apply button opens that address in a new tab and no application is recorded in Orbit.", "optional"],
      ["Description", "The full advert. It shows as plain text under the listing with your line breaks kept; any HTML tags show as typed.", "optional"]
    ],
    buttons: [
      ["New", "Starts a new role. Shown to people who can manage the Website app."],
      ["Save", "Saves the role and goes back to the list."],
      ["Discard", "Back to the list without saving."],
      ["Filters &rsaquo; Published", "Shows only the roles that are live on the website."],
      ["Clicking a cell", "Position, Location and Type can be changed straight in the list: click the cell, type and press Enter. Click the Status cell to open the role."],
      ["Select", "Ticks roles for <span class='man-key'>Export selected</span>, <span class='man-key'>Archive</span> or <span class='man-key'>Delete</span>. Archive does not take a published role off the website. Deleting a role keeps its applications, with the For column left empty."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "A published role is on every careers list for this company from the next page load: the Careers section of your Orbit sites and any website using the careers snippet. The list shows each role's title, location, type, department and description, newest first. An application sent through the Apply form is stored in <b>Applications</b> against the role. Nothing is created in Recruitment or HR.",
    links: [
      { name: "Applications", how: "Every application sent through a role's Apply form, with the role it was for.", to: "web.applications" },
      { name: "Sites", how: "Add a <b>Careers (from HR)</b> section to a page to list your published roles there.", to: "web.sites" },
      { name: "Connect a site", how: "The careers snippet shows the same published roles on a website you keep elsewhere.", to: "web.connect" },
      { name: "Applicants", how: "Recruitment's own list. It is separate from these roles, so a person you want to take forward is added there by hand.", to: "rec.applicants" },
      { name: "Job Positions", how: "The positions kept in HR are a separate list from the roles you advertise here.", to: "hr.jobs" }
    ],
    mistakes: [
      ["You don&rsquo;t have permission to do that.", "Only members with the owner, admin or accountant role in this company can save roles. Ask one of them."],
      ["The role still shows on the website after archiving it", "Archive does not unpublish. Open the role, set Published to Draft and Save."],
      ["No open positions right now.", "What the careers list shows when the company has no published roles, or when the snippet was copied in a different company. Publish a role, or copy the snippet again from the right company."],
      ["Untitled role on the website", "The role was saved without a job title. Open it, type the title and Save."],
      ["Applications for a role never arrive", "The role has an External apply link, so Apply sends people there. Clear the link to use Orbit's form."]
    ],
    tips: [
      "Set a filled role to Draft rather than deleting it, and publish it again the next time you hire.",
      "Write the description in plain text with short lines: line breaks are kept on the website.",
      "The newest role is listed first on the website."
    ]
  },

  "web.applications": {
    title: "Applications",
    what: "<b>Applications</b> collects every application sent through the Apply form on your careers list, whether from a Careers section on an Orbit site or from the careers snippet on another website. Each row shows when it arrived, the person's name, the role, their email, a link to their CV if they gave one, and the start of their message. It is a read-only inbox: applications are not added, edited or deleted here.",
    when: [
      "You want to see who has applied for a role.",
      "You are shortlisting and need each applicant's email and CV link.",
      "You want to download the applications for a role to share with whoever is interviewing."
    ],
    how: [
      "An accountancy practice has published a <i>Trainee Accountant</i> role in <b>Careers</b>. A candidate opens the practice's careers page and clicks <span class='man-key'>Apply</span>.",
      "They type their name and email (both required), paste a link to their CV and write a short message, then click <span class='man-key'>Send application</span>. On their screen the form is replaced by a thank-you line.",
      "Open <b>Website &rsaquo; Applications</b>. You should see a new row at the top: the date and time, their name, <i>Trainee Accountant</i> under <b>For</b>, and their email.",
      "Click <b>Link</b> in the <b>CV</b> column. Their CV opens in a new tab from wherever they stored it.",
      "Read the <b>Message</b> column. It shows the first 90 characters of what they wrote.",
      "Type part of a name or an email in <span class='man-key'>Search</span> to find one applicant. Search also looks inside everything else they typed.",
      "To take the candidate forward, add them in <b>Applicants</b>. Applications do not move there on their own.",
      "Click <span class='man-key'>Select</span>, tick the applications for this role and click <span class='man-key'>Export selected</span>. You should see a CSV file download with the same columns."
    ],
    fields: [
      ["When", "The date and time the application arrived.", "auto"],
      ["Name", "The name the person typed. The Apply form requires it.", "auto"],
      ["For", "The role they applied for. Empty if the role has since been deleted.", "auto"],
      ["Email", "The email address they typed. The Apply form requires it.", "auto"],
      ["CV", "A <b>Link</b> when they pasted a web address for their CV. The form has no file upload, so Orbit stores the address only, not the file.", "auto"],
      ["Message", "The first 90 characters of their message, if they wrote one. The export carries the same shortened text.", "auto"]
    ],
    buttons: [
      ["Search", "Finds applications by name, email or anything else the person typed."],
      ["Columns", "Chooses which columns show."],
      ["Select", "Ticks applications for <span class='man-key'>Export selected</span>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "An application is only stored. It does not create an applicant in Recruitment, a contact or an employee, and Orbit does not email you when one arrives, so check this screen while a role is open. What is kept is the role, the time and what the person typed: name, email, CV link and message. No IP address is recorded.",
    links: [
      { name: "Careers", how: "The roles people apply for. A role with an External apply link sends applicants elsewhere, so they never appear here.", to: "web.jobs" },
      { name: "Applicants", how: "Recruitment's pipeline. Add a candidate there by hand to move them through interviews; nothing is copied across for you.", to: "rec.applicants" },
      { name: "Privacy &amp; data requests", how: "It finds contacts, employees and leads, not applications. Exporting one of those people includes applications with the same email; erasing them clears the Email on those applications, while the name, CV link and message stay.", to: "settings.privacy" }
    ],
    mistakes: [
      ["A candidate says they applied but there is no row", "Check the role in Careers. If it has an External apply link, they applied there. If the role was set to Draft or deleted after they opened the page, Orbit refused the application but the form still thanked them. Ask them to apply again, or add them in Applicants yourself."],
      ["The For column is empty", "The role was deleted after the application arrived. The application itself is kept."],
      ["Nothing happens when you click a row", "Applications have no detail page. Everything shown is in the columns."],
      ["There is no way to delete an application", "This screen has no delete. See Privacy &amp; data requests under Links for what can be cleared when a person asks."]
    ],
    tips: [
      "Orbit keeps the CV link, not the CV, so save a copy of any CV you need to keep.",
      "Only the first 90 characters of a message show, so a long cover note may be cut off. Ask the candidate for anything you could not read."
    ]
  },

  "web.subs": {
    title: "Form Submissions",
    what: "<b>Form Submissions</b> is the inbox for the forms on your Orbit sites. Whenever a visitor sends a <b>Contact</b> or <b>Form</b> section on a published page, their answers land here with the time, the site and the form's name. It is read-only: submissions are not added, changed or deleted on this screen.",
    when: [
      "You want to read the enquiries sent from your website.",
      "You run more than one form, such as a booking request and a general enquiry, and want to find one kind.",
      "You want to download enquiries into a spreadsheet."
    ],
    how: [
      "A restaurant group wants a private dining enquiry form. In <b>Website &rsaquo; Sites</b>, open the site, open the page, and add a <b>Form</b> section with <span class='man-key'>+</span>.",
      "In the section's settings, set <b>Title</b> to <i>Book a private room</i>, <b>Button text</b> to <i>Send request</i> and <b>Form name (inbox tag)</b> to <i>private-dining</i>.",
      "Click <span class='man-key'>Publish</span>. You should see <i>Published - your page is live</i>.",
      "Click <span class='man-key'>Preview</span> and send a test from the live page: a name, an email and a message, then <span class='man-key'>Send request</span>. You should see <i>Thanks - your message was sent.</i> under the button.",
      "Open <b>Website &rsaquo; Form Submissions</b>. You should see the test at the top: the time, the site's name, a <i>private-dining</i> badge under <b>Form</b>, and <b>Details</b> reading <i>name: ... &middot; email: ... &middot; message: ...</i>",
      "Type <i>private-dining</i> in <span class='man-key'>Search</span> to see only that form's submissions.",
      "Reply to the guest from your own email. If the enquiry is worth following up, add it in <b>Leads</b>: submissions do not become leads on their own.",
      "Click <span class='man-key'>Export</span> to keep a copy. You should see a CSV file download."
    ],
    fields: [
      ["When", "The date and time the form was sent.", "auto"],
      ["Site", "Which of your sites it came from. Empty if that site has since been deleted.", "auto"],
      ["Form", "The <b>Form name (inbox tag)</b> of the section it came from. A Contact section, or a Form section with no name, shows <i>contact</i>.", "auto"],
      ["Details", "Each answer as the field name and what was typed: <i>name</i>, <i>email</i> and <i>message</i>, the three fields these forms ask for. Each value is cut to its first 80 characters here and in the export.", "auto"]
    ],
    buttons: [
      ["Search", "Finds submissions by anything the visitor typed, or by form name."],
      ["Columns", "Chooses which columns show."],
      ["Select", "Ticks rows for <span class='man-key'>Export selected</span>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "A submission is only stored. It does not create a contact or a lead, and Orbit does not email you when one arrives, so check this screen regularly. What is kept is the site, the form name, the time and exactly what the visitor typed. No IP address is recorded.",
    links: [
      { name: "Sites", how: "Add a Contact or Form section to a page, and give the Form section the name that tags its answers here.", to: "web.sites" },
      { name: "Leads", how: "Submissions do not become leads automatically. Add the enquiries you want to follow up there.", to: "crm.leads" },
      { name: "Privacy &amp; data requests", how: "Its export and erase do not look in form submissions.", to: "settings.privacy" }
    ],
    mistakes: [
      ["Sorry, that did not send. Please try again.", "What the visitor sees when their browser could not reach Orbit, for example with no connection. Nothing was stored; they need to send it again."],
      ["Every row says contact", "Contact sections always tag their answers <i>contact</i>, and so does a Form section with no Form name. Give each Form section its own name in the builder."],
      ["A page reading 404 instead of the form", "The site or the page is not published. Publish it from the builder: forms only work on published pages."],
      ["Junk messages in the list", "These forms have no captcha or spam filter, so automated messages can get through. Submissions cannot be deleted here; use Search to find the real ones."]
    ],
    tips: [
      "Give every Form section its own name, such as <i>quote-request</i> or <i>callback</i>, so each kind of enquiry is easy to find.",
      "After publishing a new form, send yourself a test and check it arrives here.",
      "The forms ask only for name, email and message. A form pasted from another service with an Embed / HTML section sends its answers to that service, not here."
    ]
  },

  "web.connect": {
    title: "Connect a site",
    what: "<b>Connect a site</b> is for a website you already have elsewhere. It gives you short snippets of code to paste into that site: one shows your published roles from <b>Careers</b> with an Apply form, the other adds sign-in buttons for Orbit. The careers list loads live from Orbit each time the page opens, so there is nothing to rebuild when a role changes. Custom domains for sites built in Orbit are not set here but on the site itself, in <b>Sites</b>.",
    when: [
      "Your company website is built somewhere else and you want your open roles on it.",
      "You want staff or customers to find the way into Orbit from your website.",
      "You are deciding between adding pieces to your existing site and building a whole site in Orbit."
    ],
    how: [
      "A dental practice already has a website and wants a careers page. Open <b>Website &rsaquo; Careers</b> and check at least one role is set to <i>Published</i>.",
      "Open <b>Website &rsaquo; Connect a site</b>, in the company whose roles should show: the snippet belongs to the company you are in.",
      "Under <b>Careers page</b>, click <span class='man-key'>Copy snippet</span>. You should see <i>Copied</i>.",
      "In your website's own editor, open the page where the roles should appear, add a block that accepts custom HTML code, and paste the snippet into it.",
      "Publish that page and open it. You should see a short loading line, then each published role with its location, type, department and description, and an <span class='man-key'>Apply</span> button.",
      "Click <span class='man-key'>Apply</span>. A form opens under the role asking for a name, an email, a link to a CV and a message.",
      "Send a test application, then open <b>Website &rsaquo; Applications</b>. You should see it at the top, against the role.",
      "For sign-in buttons, copy the <b>Employee / customer portal buttons</b> snippet the same way and paste it where the buttons should go, such as the footer. You should see <b>Team login</b> and <b>Customer portal</b>."
    ],
    fields: [
      ["Careers page snippet", "A one-line script that shows this company's published roles, newest first, each with an Apply button and form. It carries the company's ID and nothing secret: there is no key and no list of allowed websites, so it works on any site, and it only ever shows published roles.", "auto"],
      ["Employee / customer portal buttons snippet", "A one-line script that adds two buttons, <b>Team login</b> and <b>Customer portal</b>. Both open Orbit's web address in a new tab.", "auto"]
    ],
    buttons: [
      ["Copy snippet", "Copies the snippet above it to your clipboard and shows <i>Copied</i>."],
      ["Sites", "The link under <b>Need a whole website?</b> opens Sites, to build a complete site in Orbit instead."]
    ],
    after: "Copying a snippet changes nothing in Orbit. Once it is pasted, the careers list reads your published roles every time the page loads, so publishing, editing or setting a role to Draft in Careers shows on your website at the next visit. Applications sent through it are stored in <b>Applications</b>.",
    links: [
      { name: "Careers", how: "The roles the careers snippet shows. Only Published roles appear.", to: "web.jobs" },
      { name: "Applications", how: "Where the snippet's Apply form sends applications.", to: "web.applications" },
      { name: "Sites", how: "Build a complete site in Orbit instead, with its own address or your domain, and add a Careers section to it.", to: "web.sites" }
    ],
    mistakes: [
      ["No open positions right now.", "The company in the snippet has no published roles. Publish a role in Careers, or copy the snippet again from inside the right company."],
      ["Could not load positions.", "The visitor's browser could not fetch the roles from Orbit, for example with no connection. Reload the page."],
      ["Careers widget: set data-company.", "The snippet lost its company ID when it was pasted. Copy it again from this screen and paste the whole line."],
      ["Copy failed - select and copy manually", "The browser did not allow copying to the clipboard. Select the code in the grey box above the button and copy it with your keyboard."],
      ["Nothing appears where the snippet was pasted", "The script is not running on that page. Paste it into a block meant for custom HTML or code rather than a normal text block, and check the whole line was copied."]
    ],
    tips: [
      "Add data-limit=&quot;3&quot; inside the careers script tag to show only the first three roles.",
      "Add data-color=&quot;#0ea66f&quot;, with your own colour code, inside either script tag to set the colour of its buttons.",
      "The snippet belongs to the company you are in when you copy it. Switch company first to get another company's roles.",
      "A role with an External apply link sends its Apply button to that address instead of opening the form."
    ]
  }

});
