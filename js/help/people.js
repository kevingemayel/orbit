/* Orbit screen help: People, the Employees app (records, talent, planning,
 * attendance, time off, payroll, expenses) and Recruitment's Applicants.
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
 */
orbitScreenHelp({

  "hr.emp": {
    title: "Employees",
    what: "An <b>employee</b> record holds one person who works for you: their private details, emergency contact, department, job, manager and bank details. Almost everything else in the Employees app hangs off it: contracts and payroll, time off, attendance, skills, certifications and expenses. Adding an employee does not give them a login to Orbit; that is done separately in Settings. The list shows everyone, with a <b>No contract</b> badge on active people payroll would skip.",
    when: [
      "Someone new joins, even before their contract terms are settled.",
      "A person's phone, address, bank account or manager changes.",
      "You are setting up Orbit and want to bring in the whole team at once with <span class='man-key'>Import</span>.",
      "Someone leaves and should disappear from pickers without losing their history.",
      "You want to see who is missing a running contract before a payroll run."
    ],
    how: [
      "Open <b>Employees &rsaquo; Employees &rsaquo; Employees</b> and click <span class='man-key'>New</span>. For this example, a clinic has hired a new receptionist.",
      "Type the first name and last name in the two boxes at the top. One of the two is enough to save.",
      "Under <b>Private information</b>, fill in the date of birth, nationality and <b>National ID</b>, then the personal email and phone.",
      "Under <b>Emergency contact</b>, enter the contact's name, relationship (for example <i>Parent</i>) and phone.",
      "Under <b>Employment</b>, choose the <b>Department</b> (for example <i>Front desk</i>), the <b>Job Position</b> (<i>Receptionist</i>) and the <b>Manager</b> they report to. Leave <b>Employee type</b> on <i>employee</i>.",
      "Set the <b>Hire date</b>, and type the <b>Bank account</b> so it appears in the payroll bank file. If you pay through WPS, also fill in <b>IBAN</b>, <b>WPS person ID</b> and <b>WPS routing code</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the list again, with the new person marked <b>Active</b> and a red <b>No contract</b> badge.",
      "Open the person again. The <b>Employee code</b> now shows a code such as <i>EMP-0012</i>, and the top of the form has two counters: <b>Time Off</b> and <b>Contract</b>.",
      "Click the <b>Contract</b> counter (it shows 0). A new contract opens with this employee already chosen, ready for their pay terms."
    ],
    fields: [
      ["First name and Last name", "The two boxes at the top of the form. Orbit joins them into the name shown everywhere else. At least one is needed.", "required"],
      ["Photo and files", "The attachment area beside the name. A picture added here shows on the employee's card in the kanban and thumbnail views.", "optional"],
      ["Date of birth", "The employee's date of birth.", "optional"],
      ["Gender", "Male, Female or Other.", "optional"],
      ["Marital status", "Single, Married, Divorced or Widowed.", "optional"],
      ["Nationality", "Free text. It is searchable from the list.", "optional"],
      ["National ID", "The ID card or passport number. Searchable from the list.", "optional"],
      ["Personal email", "The employee's own address. A privacy export or erasure uses it when the employee has no work email.", "optional"],
      ["Personal phone", "Their mobile number. It is the number shown in the list's Phone column.", "optional"],
      ["Work email", "Their company address. It is exported in the payroll bank file, and My Work uses it to recognise the signed-in person.", "optional"],
      ["Work phone", "A desk or company phone.", "optional"],
      ["Home address", "Where they live.", "optional"],
      ["Contact name, Relationship, Contact phone", "Who to call in an emergency.", "optional"],
      ["Employee code", "Given automatically after the first save, as EMP- and a four-digit number. You cannot type in it.", "auto"],
      ["Department", "Where the person sits in your organisation. It drives the Department grouping and the headcount on Departments.", "optional"],
      ["Job Position", "Their role, from Job Positions. It drives the headcount on Job Positions.", "optional"],
      ["Manager", "Another employee they report to. It builds the org chart view of this list.", "optional"],
      ["Employee type", "employee, worker, contractor or intern. A label for your own use; payroll treats them all the same.", "optional"],
      ["Hire date", "The day they started. End of Service does not read it: it uses the contract's Start Date.", "optional"],
      ["Work location", "Free text, for example the branch or site.", "optional"],
      ["Bank account", "Printed in the Bank file a payslip run exports, and used in the WPS file when there is no IBAN.", "optional"],
      ["IBAN", "The bank IBAN written into the WPS salary file.", "optional"],
      ["WPS person ID", "The labour card or Ministry of Labour personal number, written into the WPS file.", "optional"],
      ["WPS routing code", "The routing or agent code of the employee's bank, for the WPS file.", "optional"],
      ["Status", "Active or Archived. Archived people are hidden from the pickers on Time Off, Allocations, Attendances, Expenses, the Roster, End of Service and new payslips.", "optional"],
      ["Notes", "Anything else worth keeping.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank employee form. Only shown to people allowed to manage the Employees app."],
      ["Import", "Opens a box where you paste one employee per line: First, Last, Work email, Phone, Department, Job title, separated by commas or tabs. Department and job are matched by name to ones that already exist; a name that does not match is left blank. The box counts the rows ready before you click <span class='man-key'>Import</span>."],
      ["Save", "Saves the record and returns to the list. A new employee gets an employee code."],
      ["Discard", "Returns to the list without saving your changes."],
      ["Time Off (counter)", "Shown on a saved employee: how many time off requests they have. Clicking it opens the Time Off Requests list."],
      ["Contract (counter)", "How many contracts they have. With none, clicking it starts a new contract for this employee; otherwise it opens the Contracts list."],
      ["Select", "Tick rows to Export selected, Archive or Delete them. Archive is the safe choice for a leaver. Delete removes the person for good, and with them their contracts, payslips, time off, attendance, roster days, skills, certifications, onboarding items and appraisals."],
      ["List, Thumbnails, Kanban, Org chart", "The view buttons. Org chart draws the team from each person's Manager."],
      ["Filters", "Active, Archived, or Missing contract (active people with no running contract, who payroll would skip)."],
      ["Group By", "Group the list by Department or Job Position."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "An employee on their own changes nothing in the accounts. They become payable when they have a <b>running contract</b> on the Contracts screen. Their name then appears in the pickers of Time Off, Allocations, Attendances, the Roster, Planning, Skills, Certifications, Onboarding, Appraisals and Expenses, and approval rules can name them as the approver. Every create, change and delete of an employee is written to the Activity log. <b>Who can see this:</b> the Employees screens need the Employees (HR) module in the person's role (Settings, Roles &amp; Permissions), and New, Import and Delete need manage rights. At database level any member of the company can read employee records, so only give Orbit logins to people you trust with this personal data.",
    links: [
      { name: "Contracts", how: "Pay terms live on the contract, not on the employee. No running contract, no payslip.", to: "hr.contracts" },
      { name: "Departments", how: "Create departments first so you can choose them here.", to: "hr.dept" },
      { name: "Job Positions", how: "Create job positions first so you can choose them here.", to: "hr.jobs" },
      { name: "Time Off Requests", how: "Leave is recorded against the employee.", to: "hr.leaves" },
      { name: "Payslip Runs", how: "The Bank file and WPS SIF exports read the bank details from this record.", to: "hr.runs" },
      { name: "Privacy &amp; data requests", how: "Export or erase what you hold about one employee, found there by name or work email.", to: "settings.privacy" },
      { name: "Roles &amp; Permissions", how: "Controls who can open, and who can change, employee records.", to: "settings.roles" }
    ],
    mistakes: [
      ["Enter a first or last name", "Both name boxes are empty. Type at least one."],
      ["Nothing to import - paste some rows first.", "The Import box is empty. Paste the rows, one employee per line."],
      ["Import failed: (reason)", "The database refused the rows. Check each line has the columns in the right order, and no stray commas inside a value."],
      ["Department or job is blank after an import", "The name in the pasted row did not match an existing department or job position exactly. Create it, then set it on the employee."],
      ["An employee is still paid after you archived them", "Archiving hides a person from pickers but payroll reads running contracts, not employee status. Set their contract to Expired too."],
      ["Could not save: (reason)", "The database refused the change, for example because you lack rights to edit employees. The reason says which."]
    ],
    tips: [
      "Archive rather than delete a leaver: their payslips, leave and expenses keep pointing at a real record.",
      "The Missing contract filter is the quickest check before running payroll.",
      "Codes are worked out from how many employees exist, so a code can repeat after an employee has been deleted."
    ]
  },

  "hr.dept": {
    title: "Departments",
    what: "Departments describe how your business is organised, for example <i>Kitchen</i> and <i>Front of house</i>, or <i>Sales</i> under <i>Commercial</i>. A department can sit under another one and can have a manager. The list shows how many employees are in each, and can be drawn as a tree or an org chart.",
    when: [
      "Setting up the Employees app, before you add people.",
      "You open a new branch or team and want it in the structure.",
      "You want to see headcount by department at a glance."
    ],
    how: [
      "Open <b>Employees &rsaquo; Employees &rsaquo; Departments</b> and click <span class='man-key'>New</span>. For this example, a retailer is setting up its shop floor team.",
      "Type <i>Operations</i> in <b>Name</b> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the department in the list with a <b>Headcount</b> of 0.",
      "Click <span class='man-key'>New</span> again, type <i>Shop floor</i>, and choose <i>Operations</i> as the <b>Parent department</b>.",
      "Choose the store manager in <b>Manager</b> and click <span class='man-key'>Save</span>.",
      "Click the tree view button. You should see <i>Shop floor</i> nested under <i>Operations</i>, with the manager's name beside it.",
      "Open an employee in Employees, set their <b>Department</b> to <i>Shop floor</i> and save. Back on Departments, the <b>Headcount</b> for Shop floor is now 1."
    ],
    fields: [
      ["Name", "The department name, for example Engineering or Site Operations.", "required"],
      ["Parent department", "The department this one sits under. Leave it on None for a top-level department.", "optional"],
      ["Manager", "The employee who runs the department. It shows in the list, the tree and the org chart.", "optional"],
      ["Headcount", "In the list only: how many employees have this department.", "auto"]
    ],
    buttons: [
      ["New", "Opens the New department box."],
      ["Save", "Saves the department and closes the box."],
      ["Cancel", "Closes the box without saving."],
      ["Delete", "Shown when editing. Refused while employees or sub-departments still use it; otherwise asks you to confirm, then deletes."],
      ["Tree, Org chart", "View buttons that draw departments under their parents."],
      ["Select, Export", "Export selected rows, or the whole list, as a CSV file."]
    ],
    after: "Departments change nothing in the accounts. They are chosen on employees and on job positions, and drive the Department grouping on those lists.",
    links: [
      { name: "Employees", how: "Each employee can belong to one department.", to: "hr.emp" },
      { name: "Job Positions", how: "A job position can belong to a department.", to: "hr.jobs" }
    ],
    mistakes: [
      ["Name required", "The Name box is empty. Type the department name."],
      ["(number) employee(s) are in this department. Reassign them first.", "You tried to delete a department people still belong to. Open those employees, change their department, then delete."],
      ["This department has sub-departments. Remove them first.", "Other departments name this one as their parent. Delete them, or give them a different parent, first."]
    ],
    tips: [
      "Keep the tree shallow: two levels is usually enough for a small business."
    ]
  },

  "hr.jobs": {
    title: "Job Positions",
    what: "A <b>job position</b> is a role you employ people in, such as <i>Chef de partie</i>, <i>Dental nurse</i> or <i>Site foreman</i>. Employees are given a position, and applicants in Recruitment are matched to one. The list counts how many employees hold each role. The same screen is in both the Employees and the Recruitment menus.",
    when: [
      "Setting up the Employees app, so you can choose roles on employee records.",
      "You start hiring for a new role and want applicants filed against it.",
      "You want a headcount by role."
    ],
    how: [
      "Open <b>Employees &rsaquo; Employees &rsaquo; Job Positions</b> (or <b>Recruitment &rsaquo; Job Positions</b>) and click <span class='man-key'>New</span>. For this example, an office is hiring an accounts assistant.",
      "Type <i>Accounts assistant</i> in <b>Job title</b>.",
      "Choose <i>Finance</i> in <b>Department</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the position in the list with a <b>Headcount</b> of 0.",
      "In Recruitment, open an applicant and choose <i>Accounts assistant</i> as their <b>Job position</b>.",
      "When you hire someone, set <b>Job Position</b> on their employee record. The <b>Headcount</b> here goes up to 1."
    ],
    fields: [
      ["Job title", "The name of the role, for example Facade Engineer or Project Manager.", "required"],
      ["Department", "The department the role belongs to. It drives the Department grouping of this list.", "optional"],
      ["Headcount", "In the list only: how many employees hold the position.", "auto"]
    ],
    buttons: [
      ["New", "Opens the New job position box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Delete", "Shown when editing. Refused while any employee holds the position; otherwise asks you to confirm."],
      ["Group By", "Group positions by Department."],
      ["Select", "Tick rows to export or delete several at once."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Job positions change nothing in the accounts. They appear in the Job Position picker on employees and the Job position picker on applicants.",
    links: [
      { name: "Employees", how: "Each employee can hold one job position.", to: "hr.emp" },
      { name: "Applicants", how: "Applicants are filed against the position they applied for.", to: "rec.applicants" },
      { name: "Departments", how: "Create departments first to group roles by them.", to: "hr.dept" }
    ],
    mistakes: [
      ["Name required", "The Job title box is empty. Type the role name."],
      ["(number) employee(s) hold this position. Reassign them first.", "People still have this role. Change their Job Position on the employee record, then delete."]
    ],
    tips: [
      "Moving an applicant to Hired does not create an employee or fill the headcount: add the person in Employees."
    ]
  },
  "hr.contracts": {
    title: "Contracts",
    what: "A <b>contract</b> holds how one employee is paid: their monthly wage, the salary structure that builds their payslip, their standard days and hours, and the overtime multiplier. Payroll only pays people whose contract is <b>Running</b>, and each employee can have only one running contract at a time. End of Service reads the contract's start date and wage.",
    when: [
      "A new employee's pay terms are agreed.",
      "Someone gets a pay rise: expire the old contract and start a new running one, so the history is kept.",
      "You are setting up Orbit and many employees have no contract yet: use <span class='man-key'>Create for all</span>.",
      "Someone leaves: set their contract to Expired so payroll stops paying them."
    ],
    how: [
      "Open <b>Employees &rsaquo; Employees &rsaquo; Contracts</b> and click <span class='man-key'>New</span>. For this example, a restaurant is putting a line cook on a monthly wage of 2,600.",
      "Choose the cook in <b>Employee</b>.",
      "Choose <i>Standard Staff</i> (or your own structure) in <b>Salary Structure</b>.",
      "Type 2600 in <b>Monthly Wage</b>. Leave <b>Working Days / month</b> on 26 and <b>Daily Hours</b> on 8: that makes a day rate of 100 and an hourly rate of 12.50.",
      "Leave <b>Overtime Multiplier</b> on 1.25, so an overtime hour pays 15.63.",
      "Set <b>Start Date</b> to the first day of work and leave <b>End Date</b> blank for an open-ended contract.",
      "Change <b>Status</b> to <i>Running</i> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the contract in the list with a green <b>Running</b> badge.",
      "Open Employees: the cook no longer has the <b>No contract</b> badge, and the next payslip run will include them."
    ],
    fields: [
      ["Employee", "Who the contract is for. Opening a contract from an employee's Contract counter fills this in.", "required"],
      ["Salary Structure", "The set of salary heads used to work out the payslip. A running contract cannot be saved without one.", "optional"],
      ["Monthly Wage", "The basic monthly salary, in the company currency. The day rate is this divided by working days, and the hourly rate is the day rate divided by daily hours. A running contract needs more than 0.", "optional"],
      ["Status", "Draft, Running or Expired. Only Running contracts are picked up by payroll runs. Nothing changes the status on its own: an End Date passing does not expire a contract.", "optional"],
      ["Working Days / month", "Standard paid days in a month, used for the day rate and to prorate basic pay. Also the days paid when the employee has no attendance in a pay period. Blank or 0 is saved as 26.", "optional"],
      ["Daily Hours", "Standard hours in a day, used for the hourly rate and the expected hours behind overtime and undertime. Blank or 0 is saved as 8.", "optional"],
      ["Overtime Multiplier", "Overtime pay is overtime hours x hourly rate x this number, for example 1.25, 1.5 or 2, unless the overtime salary head sets its own multiplier. Blank or 0 is saved as 1.25.", "optional"],
      ["Start Date", "When the contract begins. End of Service counts years of service from this date and cannot work without it.", "optional"],
      ["End Date", "When the contract ends. Leave it blank if open-ended. A payslip run skips a running contract whose end date is before the start of the pay period.", "optional"],
      ["Payslips (counter)", "On a saved contract: how many payslips were made from it. Clicking it opens the Payslips list.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank contract, set to Draft with 26 days, 8 hours and a 1.25 multiplier."],
      ["Create for all", "Makes a starting contract for every active employee who has no running contract. Choose a <b>Salary structure</b>, a <b>Default monthly wage</b> and whether to <b>Set to</b> Draft (set wages later) or Running (pay now), then click <span class='man-key'>Create</span>. Each contract starts today with 26 days, 8 hours and a 1.25 multiplier."],
      ["Save", "Saves the contract and returns to the list, after the running-contract checks."],
      ["Discard", "Returns to the list without saving."],
      ["Delete", "Shown on a saved contract to people who can manage the app. Asks you to confirm, then deletes it for good. Payslips already made from it stay."],
      ["Filters", "Running, or Draft."],
      ["Group By", "Group contracts by Structure."],
      ["Select", "Tick rows to export or delete several contracts."]
    ],
    after: "A contract posts nothing to the ledger. Once it is <b>Running</b>, <b>Generate payslips</b> on a payslip run creates a payslip from it, and the wage of every running contract is counted as monthly payroll in the Cash Flow Forecast and the Cockpit. End of Service reads the start date and wage.",
    links: [
      { name: "Employees", how: "The Missing contract filter lists active people with no running contract.", to: "hr.emp" },
      { name: "Salary Structures", how: "The structure chosen here decides which salary heads build the payslip.", to: "hr.struct" },
      { name: "Payslip Runs", how: "Generating a run makes one payslip per running contract.", to: "hr.runs" },
      { name: "End of Service", how: "Gratuity is worked out from this contract's start date and wage.", to: "hr.eos" },
      { name: "Cash Flow Forecast", how: "Running wages are counted as a payroll outflow at each month end.", to: "rep.cashfwd" }
    ],
    mistakes: [
      ["Pick an employee", "The Employee field is on None. Choose who the contract is for."],
      ["A running contract needs a salary structure - payroll would pay nothing without it.", "Status is Running but Salary Structure is None. Choose a structure, or save as Draft."],
      ["A running contract needs a wage above 0.", "Status is Running but Monthly Wage is 0. Enter the wage, or save as Draft."],
      ["This employee already has a running contract. Set the old one to Expired first.", "One running contract per employee, or payroll would pay them twice. Open the old contract, set it to Expired, save, then save this one."],
      ["Running contracts need a structure and a wage above 0. Use Draft, or set both.", "In Create for all you chose Running without a structure or a wage. Fill both in, or choose Draft."],
      ["A leaver is still being paid", "Their contract is still Running. Setting an End Date alone does not stop payroll unless the date is before the pay period. Set Status to Expired."]
    ],
    tips: [
      "For a pay rise, expire the old contract and create a new one rather than editing the wage, so earlier payslips still match the contract they came from.",
      "Create for all also adds a contract for someone whose only contract is a draft, so check the Draft filter afterwards."
    ]
  },

  "hr.skills": {
    title: "Skills",
    what: "The list of skills your business tracks, such as <i>Food hygiene</i>, <i>Forklift</i>, <i>Arabic</i> or <i>Excel</i>, each with an optional category. This screen only defines the skills; who has each one, and at what level, is recorded on Employee Skills.",
    when: [
      "Before recording what your people can do on Employee Skills.",
      "You start needing a new capability, for example a language for a new market."
    ],
    how: [
      "Open <b>Employees &rsaquo; Talent &rsaquo; Skills</b> and click <span class='man-key'>New</span>. For this example, a retailer tracks what its shop staff can do.",
      "Type <i>Visual merchandising</i> in <b>Skill name</b> and <i>Retail</i> in <b>Category</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the skill in the list.",
      "Add <i>Cash handling</i> and <i>Stock counting</i> the same way, also in <i>Retail</i>.",
      "Click <span class='man-key'>Group By</span> and choose <b>Category</b>. You should see all three under <i>Retail</i>."
    ],
    fields: [
      ["Skill name", "What the skill is called. Left empty, it is saved as <i>Skill</i>.", "optional"],
      ["Category", "A grouping of your choice, for example Technical, Trade or Safety.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New skill box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Delete", "Shown when editing. Deletes the skill straight away, without asking, and removes it from every employee who had it."],
      ["Group By", "Group skills by Category."]
    ],
    after: "Nothing changes in the accounts. Saved skills appear in the Skill picker on Employee Skills.",
    links: [
      { name: "Employee Skills", how: "Records who has each skill and at what level.", to: "hr.empskills" }
    ],
    mistakes: [
      ["A skill called Skill appears in the list", "It was saved with an empty Skill name. Open it and type the real name."],
      ["An employee's skill vanished", "Deleting a skill removes it from every employee, with no confirmation. Recreate the skill and add it to them again."]
    ],
    tips: [
      "Keep names short and consistent, so search on Employee Skills finds everyone with the skill."
    ]
  },

  "hr.empskills": {
    title: "Employee Skills",
    what: "Who has which skill, and at what level: Beginner, Intermediate, Advanced or Expert. Each row links one employee to one skill from the Skills list. Group the list by skill to find, for example, everyone who can run the coffee machine, or by employee to see one person's profile.",
    when: [
      "A new starter has been assessed, or someone finishes training.",
      "You need to find who can cover a task that needs a particular skill."
    ],
    how: [
      "Make sure the skill exists on <b>Employees &rsaquo; Talent &rsaquo; Skills</b>. For this example, a cafe wants to record that a new barista is good with latte art.",
      "Open <b>Employees &rsaquo; Talent &rsaquo; Employee Skills</b> and click <span class='man-key'>New</span>.",
      "Choose the barista in <b>Employee</b> and <i>Latte art</i> in <b>Skill</b>.",
      "Choose <i>Advanced</i> in <b>Level</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a row with the employee, the skill and an <b>advanced</b> badge.",
      "Click <span class='man-key'>Group By</span> and choose <b>Skill</b>. Everyone with Latte art is listed together."
    ],
    fields: [
      ["Employee", "The person who has the skill. The picker lists all employees, archived ones included.", "required"],
      ["Skill", "One skill from the Skills list.", "required"],
      ["Level", "Beginner, Intermediate, Advanced or Expert. A new row starts on Intermediate.", "optional"]
    ],
    buttons: [
      ["New", "Opens the Add employee skill box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Delete", "Shown when editing. Deletes the row straight away, without asking."],
      ["Group By", "Group by Employee or by Skill."]
    ],
    after: "Nothing changes in the accounts or in other apps. It is a record for finding and developing people.",
    links: [
      { name: "Skills", how: "Define the skills before recording them here.", to: "hr.skills" },
      { name: "Certifications", how: "For qualifications with an expiry date, record a certification instead.", to: "hr.certs" }
    ],
    mistakes: [
      ["Add skills first (Talent > Skills)", "There are no skills to choose from. Create them on the Skills screen, then come back."],
      ["One of the choices is empty or invalid. Pick it again from the list.", "There are no employees yet, so the Employee picker is empty. Add employees first."]
    ],
    tips: [
      "Recording the same skill twice for a person is allowed, so edit the existing row when someone improves rather than adding another."
    ]
  },

  "hr.certs": {
    title: "Certifications",
    what: "Qualifications, licences and tickets that have an issue and an expiry date, such as a first aid certificate, a driving licence or a work permit. The list is sorted by expiry and flags any certificate that has <b>expired</b>, or that expires within 60 days as <b>soon</b>. Expiry dates also appear on the Calendar.",
    when: [
      "Someone passes a course or renews a licence.",
      "Before rostering or sending someone on a job that needs a valid ticket.",
      "Once a month, to check the Expiring/expired filter and book renewals."
    ],
    how: [
      "Open <b>Employees &rsaquo; Talent &rsaquo; Certifications</b> and click <span class='man-key'>New</span>. For this example, a contractor records a scaffolder's safety card.",
      "Choose the scaffolder in <b>Employee</b>.",
      "Type <i>Scaffold inspection card</i> in <b>Certificate</b> and the body that issued it in <b>Authority</b>.",
      "Set <b>Issued</b> to the date on the card and <b>Expiry</b> to its end date.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row in the list, sorted by expiry.",
      "If the expiry is within 60 days, you should see an orange <b>soon</b> flag beside the date; if it has passed, a red <b>expired</b> flag.",
      "Open <b>Calendar</b>. On the expiry date you should see <i>Cert expires: Scaffold inspection card</i> with the employee's name."
    ],
    fields: [
      ["Employee", "Who holds the certificate. The picker lists all employees.", "required"],
      ["Certificate", "What the certificate is. Left empty, it is saved as <i>Certificate</i>.", "optional"],
      ["Authority", "Who issued it.", "optional"],
      ["Issued", "The issue date.", "optional"],
      ["Expiry", "The expiry date. It drives the soon and expired flags, the Expiring/expired filter and the Calendar entry. Leave it blank for a certificate that never expires.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New certification box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Delete", "Shown when editing. Deletes straight away, without asking."],
      ["Filters", "Expiring/expired: certificates past their expiry or within 60 days of it."],
      ["Group By", "Group by Employee."]
    ],
    after: "Nothing changes in the accounts. Each expiry date appears on the Calendar and Agenda screens as <i>Cert expires</i>. Orbit does not send an email or notification when a certificate is about to expire, so the filter and the Calendar are your reminder.",
    links: [
      { name: "Calendar", how: "Shows each certificate's expiry on its date.", to: "cal.month" },
      { name: "Employee Skills", how: "For abilities without an expiry date.", to: "hr.empskills" }
    ],
    mistakes: [
      ["A certificate shows no flag although it has lapsed", "The Expiry date is blank. Open it and enter the date."],
      ["One of the choices is empty or invalid. Pick it again from the list.", "There are no employees yet. Add employees first."]
    ],
    tips: [
      "When a certificate is renewed, edit the dates on the same row, or add a new row and delete the old one, so the list does not show a stale expired flag."
    ]
  },

  "hr.onboard": {
    title: "Onboarding",
    what: "A checklist of tasks for people joining or leaving: issuing a uniform, signing the contract, setting up email, returning a laptop. Each item belongs to one employee, is marked <b>Onboarding</b> or <b>Offboarding</b>, can have a due date, and is Open or Done. Open items past their due date are flagged <b>overdue</b>.",
    when: [
      "Someone new is starting and you want nothing missed in their first week.",
      "Someone is leaving and equipment, access and paperwork must be dealt with.",
      "You want to see every open joining or leaving task across the team."
    ],
    how: [
      "Open <b>Employees &rsaquo; Talent &rsaquo; Onboarding</b> and click <span class='man-key'>New</span>. For this example, an office welcomes a new sales assistant.",
      "Choose the sales assistant in <b>Employee</b> and leave <b>Kind</b> on <i>Onboarding</i>.",
      "Type <i>Set up email and laptop</i> in <b>Task</b> and set the <b>Due date</b> to their first day.",
      "Leave <b>Status</b> on <i>Open</i> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the item with <b>open</b> in the Done column.",
      "Add <i>Sign contract</i> and <i>Health and safety induction</i> the same way.",
      "When a task is finished, open it, set <b>Status</b> to <i>Done</i> and save. You should see a green <b>Done</b> badge.",
      "Click <span class='man-key'>Filters</span> and choose <b>Open</b> to see only what is left."
    ],
    fields: [
      ["Employee", "Whose checklist the task is on. The picker lists all employees.", "required"],
      ["Kind", "Onboarding (joining) or Offboarding (leaving).", "optional"],
      ["Due date", "When it should be done. An open task past this date shows an overdue flag.", "optional"],
      ["Task", "What needs doing, for example Issue PPE or Return laptop. Left empty, it is saved as <i>Task</i>.", "optional"],
      ["Status", "Open or Done.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New checklist item box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Delete", "Shown when editing. Deletes straight away, without asking."],
      ["Filters", "Open, Onboarding or Offboarding."],
      ["Group By", "Group by Employee or by Kind."]
    ],
    after: "Nothing changes in the accounts or in other apps. Orbit does not create the tasks for you when an employee is added; add each one here.",
    links: [
      { name: "Employees", how: "Each checklist item belongs to an employee.", to: "hr.emp" },
      { name: "Contracts", how: "Offboarding usually ends with setting the contract to Expired.", to: "hr.contracts" }
    ],
    mistakes: [
      ["One of the choices is empty or invalid. Pick it again from the list.", "There are no employees yet. Add the employee first."],
      ["A task shows overdue although it was done", "Its Status is still Open. Open it, set Status to Done and save."]
    ],
    tips: [
      "Group by Employee to see one person's whole checklist on one screen."
    ]
  },

  "hr.appraisals": {
    title: "Appraisals",
    what: "Performance reviews: for one employee and one period, a rating from 1 to 5 and written notes on strengths and areas to improve. A review is a <b>Draft</b> while it is being written and <b>Done</b> once it is finished; a done review is locked until someone reopens it.",
    when: [
      "Twice a year, or at the end of probation, when a manager reviews someone.",
      "You want a written record of feedback given, rather than relying on memory."
    ],
    how: [
      "Open <b>Employees &rsaquo; Talent &rsaquo; Appraisals</b> and click <span class='man-key'>New</span>. For this example, a clinic's practice manager reviews a dental nurse for the first half of the year.",
      "Choose the nurse in <b>Employee</b>. <b>Date</b> already shows today.",
      "Type <i>2026 H1</i> in <b>Period</b> and the reviewer's role, <i>Practice manager</i>, in <b>Manager</b>.",
      "Set <b>Rating (1-5)</b> to 4.",
      "Write in <b>Strengths</b> and <b>Areas to improve</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and the form stays open with a <span class='man-key'>Mark done</span> button now showing.",
      "After discussing it with the nurse, click <span class='man-key'>Mark done</span>. You should see <i>Marked done</i>, the stage move to <b>Done</b>, and every field locked.",
      "Back on the list, the row shows four stars and a green <b>Done</b> badge."
    ],
    fields: [
      ["Employee", "Who is being reviewed. Locked once the review is done.", "required"],
      ["Date", "The date of the review. Starts as today; the list is sorted by it, newest first.", "optional"],
      ["Period", "The period covered, for example 2026 H1.", "optional"],
      ["Rating (1-5)", "The overall score, shown as stars in the list. A new review starts on 3.", "optional"],
      ["Manager", "Free text: who carried out the review.", "optional"],
      ["Strengths", "What the person does well.", "optional"],
      ["Areas to improve", "What they should work on.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank review."],
      ["Save", "Saves the review and keeps it open."],
      ["Discard", "Returns to the list without saving."],
      ["Mark done", "Shown on a saved draft. Saves your changes and marks the review Done, which locks it."],
      ["Reopen", "Shown on a done review. Puts it back to Draft so it can be changed."],
      ["Delete", "Shown on a saved review to people who can manage the app. Asks you to confirm, then deletes it."],
      ["Filters", "Draft or Done."],
      ["Group By", "Group by Employee, to see one person's reviews over time."]
    ],
    after: "Nothing changes in the accounts or in other apps. Appraisals are personal data: anyone who can open the Employees app can read them.",
    links: [
      { name: "Employees", how: "Each review belongs to one employee.", to: "hr.emp" },
      { name: "Employee Skills", how: "Record a skill level change agreed in the review.", to: "hr.empskills" }
    ],
    mistakes: [
      ["Save failed", "The change to an existing review was refused, for example because you lack rights to edit it."],
      ["The fields cannot be changed", "The review is Done. Click Reopen first."]
    ],
    tips: [
      "Use the same Period wording every cycle (2026 H1, 2026 H2) so reviews sort and search cleanly."
    ]
  },
  "hr.planning": {
    title: "Planning",
    what: "Planning is a list of individual shifts: a date, start and end times, hours, a role, optionally a project, and the person doing it. A shift with nobody assigned is an <b>open shift</b>, a slot you still need to fill. Each shift is a Draft or Published. Shifts also appear on the Calendar.",
    when: [
      "Planning next week's cover for a shop, a clinic or a site team.",
      "You know a slot needs filling but not yet by whom: save it as an open shift.",
      "You want to see all planned work for one person, one role or one project."
    ],
    how: [
      "If you reuse the same shift patterns, create them first on <b>Employees &rsaquo; Planning &rsaquo; Shift Templates</b>. For this example, a contractor plans an installer for a fit-out project.",
      "Open <b>Employees &rsaquo; Planning &rsaquo; Planning</b> and click <span class='man-key'>New</span>.",
      "In <b>From template</b>, choose <i>Day shift</i>. You should see Role, Start, End and Hours fill in from the template.",
      "Choose the installer in <b>Assignee</b>, or leave it on <i>Open shift</i> if nobody is picked yet.",
      "Choose the project in <b>Project</b> and set the <b>Date</b>.",
      "Set <b>Status</b> to <i>Published</i> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the shift in the list with a green <b>Published</b> badge.",
      "Click <span class='man-key'>Filters</span> and choose <b>Open shifts</b> to see slots nobody has taken yet; they show an orange <b>OPEN</b> flag.",
      "Open <b>Calendar</b>. On that date you should see <i>Shift:</i> with the person and role."
    ],
    fields: [
      ["From template", "Only shown once you have shift templates. Choosing one copies its role, start, end and hours into the form.", "optional"],
      ["Assignee", "Who works the shift. Leave it on Open shift for an unassigned slot. The picker lists all employees.", "optional"],
      ["Role", "What the person does on this shift, for example Installer or Barista.", "optional"],
      ["Project", "An active project the shift belongs to. Used for the Project grouping only.", "optional"],
      ["Date", "The day of the shift. Starts as today.", "optional"],
      ["Start and End", "Plain text times, for example 08:00 and 17:00. They are not checked or used to work out hours.", "optional"],
      ["Hours", "The hours of the shift. Type them yourself; they are not calculated from Start and End.", "optional"],
      ["Status", "Draft or Published. Published is a label on the list: Orbit does not notify the employee.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New shift box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Delete", "Shown when editing. Deletes the shift straight away, without asking."],
      ["Filters", "Open shifts, Published or Draft."],
      ["Group By", "Group by Assignee, Role or Project."]
    ],
    after: "Nothing changes in the accounts, in payroll or in project costs. Planned shifts appear on the Calendar and Agenda. Payroll pays from attendance and contracts, not from planned shifts, and Planning is separate from the Roster screen.",
    links: [
      { name: "Shift Templates", how: "Reusable role and times you load into a shift.", to: "hr.shifttmpl" },
      { name: "Calendar", how: "Each planned shift shows on its date.", to: "cal.month" },
      { name: "Projects", how: "A shift can be tagged with an active project.", to: "proj.list" },
      { name: "Roster", how: "A separate weekly grid of named shifts per person, per day.", to: "hr.roster" }
    ],
    mistakes: [
      ["Hours do not match the times", "Hours are typed, not worked out. Correct the Hours box."],
      ["A project is missing from the picker", "Only active projects are listed."]
    ],
    tips: [
      "Save shifts as Draft while you juggle the week, then switch them to Published so the list shows what is final."
    ]
  },

  "hr.shifttmpl": {
    title: "Shift Templates",
    what: "Reusable shift patterns for the Planning screen: a name, a role, start and end times and hours. Choosing a template in a new planned shift fills in those details, so a week of shifts is quick to enter.",
    when: [
      "You plan the same kinds of shift again and again, such as Opening, Closing or Night.",
      "Before you start using the Planning screen."
    ],
    how: [
      "Open <b>Employees &rsaquo; Planning &rsaquo; Shift Templates</b> and click <span class='man-key'>New</span>. For this example, a bakery sets up its early shift.",
      "Type <i>Early bake</i> in <b>Name</b> and <i>Baker</i> in <b>Role</b>.",
      "Type <i>04:00</i> in <b>Start</b> and <i>12:00</i> in <b>End</b>.",
      "Type 7.5 in <b>Hours</b>, allowing for a half-hour break.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the template in the list with <i>04:00 - 12:00</i> and 7.5 hours.",
      "On Planning, click <span class='man-key'>New</span> and choose <i>Early bake</i> in <b>From template</b>. You should see the role, times and hours fill in."
    ],
    fields: [
      ["Name", "What the pattern is called. Left empty, it is saved as <i>Shift</i>.", "optional"],
      ["Role", "The role copied into a planned shift, for example Installer or Foreman.", "optional"],
      ["Start", "Start time as text. A new template starts at 08:00.", "optional"],
      ["End", "End time as text. A new template starts at 17:00.", "optional"],
      ["Hours", "Hours copied into a planned shift. Not worked out from the times. Blank or 0 is saved as 8.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New shift template box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Delete", "Shown when editing. Deletes straight away, without asking. Shifts already planned from it are not changed."]
    ],
    after: "Nothing changes anywhere until you use the template on Planning. A template is copied, not linked: editing it later does not change shifts already planned.",
    links: [
      { name: "Planning", how: "Where templates are used, through the From template picker.", to: "hr.planning" },
      { name: "Shifts", how: "A different list, used by the Roster grid.", to: "hr.shifts" }
    ],
    mistakes: [
      ["A template does not appear on the Roster", "Shift templates feed Planning only. The Roster uses the Shifts screen."]
    ],
    tips: [
      "Put the break into Hours, since Planning has no break field."
    ]
  },

  "hr.labour": {
    title: "Labour standards",
    what: "Targets for how hard your labour should work, per <b>daypart</b> (breakfast, lunch, afternoon, evening, late) and optionally per store: the sales one labour hour should bring in, and the minimum crew you never go below. It is a reference table for managers planning a shift-based business such as a restaurant or shop. The same screen is in the Kitchen menu and the Employees menu.",
    when: [
      "Setting up a food or retail business, to write down your staffing rules for each part of the day.",
      "You change your targets, for example after a menu change or a new store opening."
    ],
    how: [
      "If you run more than one site, make sure your stores exist in <b>Kitchen &rsaquo; Estate &rsaquo; Stores</b>. For this example, a burger restaurant sets its lunch target.",
      "Open <b>Kitchen &rsaquo; Planning &rsaquo; Labour standards</b> and click <span class='man-key'>New</span>.",
      "Choose <i>Lunch</i> in <b>Daypart</b> and the high street store in <b>Store</b>.",
      "Set <b>From</b> to 11:30 and <b>To</b> to 15:00.",
      "Type 90 in <b>Target sales per labour hour</b>: each paid hour worked should bring in 90 of sales.",
      "Type 3 in <b>Minimum staff</b> and <i>Crew</i> in <b>Role</b>. Leave <b>Active</b> on Yes.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a row showing Lunch, the store, 11:30 to 15:00, 90.00 and 3.",
      "Compare it with that day's lunch forecast on <b>Sales forecast</b>: 1,800 forecast at 90 an hour is 20 labour hours, and never fewer than 3 people on."
    ],
    fields: [
      ["Daypart", "Breakfast, Lunch, Afternoon, Evening or Late.", "required"],
      ["Store", "The store the standard is for. Leave it on (none) for one standard across all stores. Only active stores are listed.", "optional"],
      ["From and To", "The times the daypart covers.", "optional"],
      ["Target sales per labour hour", "How much revenue one labour hour should produce.", "optional"],
      ["Minimum staff", "The smallest crew for the daypart, whatever the sales. Starts at 1. It cannot be left empty.", "required"],
      ["Role", "Which role the minimum refers to, for example Crew or Cook.", "optional"],
      ["Active", "Yes or No, to keep an old standard without it showing as current.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New standard box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Delete", "Shown when editing, to people who can manage the app. Asks you to confirm, then deletes."],
      ["Select", "Tick rows to export or delete several at once."]
    ],
    after: "Nothing changes in the accounts, in payroll or on the Roster. Orbit does not yet use these standards to build or check a roster: they are the rules you plan against by hand, next to the Sales forecast.",
    links: [
      { name: "Sales forecast", how: "The expected sales you apply these targets to.", to: "hr.forecast" },
      { name: "Stores", how: "Where the stores in the Store picker come from.", to: "estate.stores" },
      { name: "Roster", how: "Where you put people onto shifts once you know how many you need.", to: "hr.roster" }
    ],
    mistakes: [
      ["Daypart is required", "No daypart was chosen. Pick one."],
      ["A message asking you to fill in Min staff", "The Minimum staff box was emptied. Type a number, at least 1."],
      ["The store you want is not in the list", "Only active stores appear. Add or reactivate it in Kitchen, Estate, Stores."]
    ],
    tips: [
      "Start with one standard per daypart and no store; add store-specific ones only where a site is genuinely different."
    ]
  },

  "hr.forecast": {
    title: "Sales forecast",
    what: "What you expect to take on a given day, per store and daypart, with the number of transactions if you plan by covers or receipts. Once the day is over, type the actual sales and the list shows the <b>variance</b> as a percentage: green when within 10%, amber when further out. The same screen is in the Kitchen menu and the Employees menu.",
    when: [
      "Planning next week's staffing and prep for each store.",
      "After service, to record what was actually taken and see how good the forecast was."
    ],
    how: [
      "Open <b>Kitchen &rsaquo; Planning &rsaquo; Sales forecast</b> and click <span class='man-key'>New</span>. For this example, a cafe forecasts next Saturday's lunch.",
      "Set <b>Date</b> to next Saturday and choose the store in <b>Store</b>.",
      "Choose <i>Lunch</i> in <b>Daypart</b>.",
      "Type 1800 in <b>Forecast sales</b> and 150 in <b>Forecast transactions</b>. Leave <b>Actual sales</b> empty for now.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the row with 1,800.00 under Forecast and nothing under Variance yet.",
      "On the Sunday, open the row, type 1950 in <b>Actual sales</b> and save.",
      "You should see a green <b>8.3%</b> badge under Variance: the actual was 8.3% above the forecast."
    ],
    fields: [
      ["Date", "The day the forecast is for. Starts as today.", "required"],
      ["Store", "Which store. Only active stores are listed.", "required"],
      ["Daypart", "Breakfast, Lunch, Afternoon, Evening or All day. Leave it on (none) for the whole day.", "optional"],
      ["Forecast sales", "The sales you expect.", "optional"],
      ["Forecast transactions", "The number of sales or covers you expect.", "optional"],
      ["Actual sales", "What was taken, typed in after the day. With it, the Variance column shows (actual minus forecast) divided by forecast.", "optional"],
      ["Note", "Anything that explains the figure, such as a local event or bad weather.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New forecast box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Delete", "Shown when editing, to people who can manage the app. Asks you to confirm, then deletes."],
      ["Select", "Tick rows to export or delete several at once."]
    ],
    after: "Nothing changes in the accounts. Actual sales are typed by hand here; they are not read from your tills. Orbit does not yet build the roster or a prep list from these figures, even though the note at the top of the empty list says so.",
    links: [
      { name: "Labour standards", how: "Divide the forecast by the sales-per-hour target to get the labour hours to plan.", to: "hr.labour" },
      { name: "Stores", how: "Where the stores in the Store picker come from.", to: "estate.stores" }
    ],
    mistakes: [
      ["Store is required", "No store was chosen, or you have no active stores yet. Add a store in Kitchen, Estate, Stores."],
      ["Date is required", "The Date box was cleared. Pick the day."],
      ["A record with Forecast date (date) and Daypart (daypart) already exists. Use a different one.", "There is already a forecast for that store, date and daypart. Open the existing row and change it instead."]
    ],
    tips: [
      "Keep filling in Actual sales: a few weeks of variances show whether your forecasts run high or low."
    ]
  },

  "hr.att": {
    title: "Attendances",
    what: "Attendance records when each employee actually started and finished work. Each row has a check in, a check out and the worked hours between them. Payroll reads these rows: the days someone checked in and the hours they worked decide their paid days, overtime and undertime on the payslip.",
    when: [
      "You keep time sheets or a signing-in book and want the hours in Orbit before payroll.",
      "A day was missed and needs adding by hand.",
      "You want to check someone's hours for a period."
    ],
    how: [
      "Open <b>Employees &rsaquo; Attendances &rsaquo; Attendances</b> and click <span class='man-key'>New</span>. For this example, a warehouse logs a picker's Monday.",
      "Choose the picker in <b>Employee</b>.",
      "Set <b>Check in</b> to Monday 07:00.",
      "Set <b>Check out</b> to Monday 17:30. Both boxes start at the current date and time, so change both.",
      "Click <span class='man-key'>Save</span>. You should see <i>Attendance logged</i> and a row with <b>Worked Hours</b> 10.50.",
      "Log the rest of the month the same way. When you generate that month's payslip run, the picker's payslip shows the days they checked in, and any hours above those days x their contract's daily hours as overtime."
    ],
    fields: [
      ["Employee", "Who worked. Only active employees are listed.", "required"],
      ["Check in", "When they started. Starts as now.", "required"],
      ["Check out", "When they finished. Starts as now, so change it.", "optional"],
      ["Worked Hours", "Worked out on save as the time from check in to check out. Never below zero.", "auto"]
    ],
    buttons: [
      ["New", "Opens the Log attendance box."],
      ["Save", "Logs the attendance and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Select", "Tick rows to export or delete them. There is no way to open and edit a logged row: delete it and log it again."],
      ["Group By", "Group by Employee."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing posts to the accounts. When a payslip run is generated, Orbit takes each employee's attendance with a check in inside the pay period: <b>worked days</b> is the number of different days they checked in, <b>worked hours</b> is the total, <b>overtime</b> is the hours above worked days x the contract's daily hours, and <b>undertime</b> is the hours below it. If an employee has no attendance at all in the period, the payslip assumes the contract's full working days and no overtime.",
    links: [
      { name: "Payslip Runs", how: "Generate payslips reads attendance for the period.", to: "hr.runs" },
      { name: "Contracts", how: "Daily Hours on the contract sets the expected hours behind overtime and undertime.", to: "hr.contracts" },
      { name: "Roster", how: "The planned shifts. Attendance is what really happened; Orbit does not compare the two.", to: "hr.roster" }
    ],
    mistakes: [
      ["Check in required", "The Check in box is empty. Enter the start time."],
      ["Add an employee first", "There are no active employees. Add one in Employees."],
      ["Worked Hours shows 0.00", "Check out was left at the same time as check in, or is earlier. Delete the row and log it again with the right times."],
      ["Someone with only a few logged days is paid for only those days", "Once an employee has any attendance in the period, payroll pays the days logged. Log every day they worked, or none for a fixed monthly salary."]
    ],
    tips: [
      "For staff on a fixed monthly salary who never clock in, do not log attendance at all: their payslip then uses the contract's full working days.",
      "Log a night shift that crosses midnight with its check in date; the day counted is the check-in day."
    ]
  },

  "hr.roster": {
    title: "Roster",
    what: "A weekly rota grid: one row per active employee, one column per day from Monday to Sunday. In each cell you pick a shift from the Shifts list, or Off. A change is saved the moment you make it.",
    when: [
      "Each week, to publish who works which shift.",
      "Someone swaps a day and the rota needs updating."
    ],
    how: [
      "Make sure your shifts exist on <b>Employees &rsaquo; Attendances &rsaquo; Shifts</b>. For this example, a hotel reception rotas Morning and Evening shifts.",
      "Open <b>Employees &rsaquo; Attendances &rsaquo; Roster</b>. You should see <i>Week of</i> and this week's Monday date, and a grid of your active employees.",
      "Click <span class='man-key'>Next</span> to move to next week.",
      "In the first receptionist's row, choose <i>Morning</i> under Mon, Tue and Wed. After each choice you should see <i>Roster updated</i>.",
      "Choose <i>Evening</i> under Thu and Fri, and leave Sat and Sun on <i>Off</i>.",
      "Fill in the other receptionists the same way.",
      "Click <span class='man-key'>This week</span> to come back to the current week."
    ],
    fields: [
      ["Day cell", "The shift the employee works that day, from your active shifts, or Off. Choosing a shift saves it; choosing Off removes that day from the rota.", "optional"]
    ],
    buttons: [
      ["Prev", "Shows the week before."],
      ["This week", "Jumps back to the current week."],
      ["Next", "Shows the week after."]
    ],
    after: "Nothing posts to the accounts, and the roster is not read by payroll: payslips use attendance and the contract. Planning and Labour standards are separate screens. An employee can have one shift per day.",
    links: [
      { name: "Shifts", how: "The shift names offered in each cell.", to: "hr.shifts" },
      { name: "Attendances", how: "What people actually worked, which is what payroll pays.", to: "hr.att" },
      { name: "Planning", how: "A separate list of dated shifts with roles, projects and open slots.", to: "hr.planning" }
    ],
    mistakes: [
      ["Add employees first.", "There are no active employees. Add them in Employees."],
      ["Create a shift first (Attendances > Shifts).", "There are no active shifts to choose. Create one on the Shifts screen."],
      ["Could not save: (reason)", "The change was refused, for example because your role cannot edit the Employees app. The cell may look changed: reload the week to see what is really saved."],
      ["A shift is missing from the cells", "It was archived on the Shifts screen. Only active shifts are offered."]
    ],
    tips: [
      "The grid shows only active employees, so archive leavers to keep it short.",
      "The grid has no print button; use Print from your browser if you need a paper copy."
    ]
  },

  "hr.shifts": {
    title: "Shifts",
    what: "The named working patterns you put people on in the Roster grid, such as <i>Morning</i>, <i>Evening</i> or <i>Night</i>, each with a start, an end, an unpaid break and its paid hours.",
    when: [
      "Before using the Roster for the first time.",
      "Your opening hours change and a pattern needs new times.",
      "A pattern is no longer used: archive it so it stops appearing on the Roster."
    ],
    how: [
      "Open <b>Employees &rsaquo; Attendances &rsaquo; Shifts</b> and click <span class='man-key'>New</span>. For this example, a pharmacy sets up its late shift.",
      "Type <i>Late</i> in <b>Name</b>.",
      "Set <b>Start time</b> to 13:00 and <b>End time</b> to 21:00.",
      "Type 30 in <b>Break (minutes)</b> and 7.5 in <b>Paid hours</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a row showing Late, 13:00, 21:00, 30 and 7.5.",
      "Open the Roster. <i>Late</i> is now one of the choices in every day cell."
    ],
    fields: [
      ["Name", "The shift name shown in the Roster cells, for example Day shift or Night shift.", "required"],
      ["Start time", "When the shift starts. A new shift starts at 08:00.", "optional"],
      ["End time", "When it ends. A new shift starts at 17:00.", "optional"],
      ["Break (minutes)", "The unpaid break within the shift. A new shift starts at 60.", "optional"],
      ["Paid hours", "The paid working hours in the shift. Type it yourself: it is not worked out from the times and the break.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New shift box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Select", "Tick rows to Archive them (hidden from the Roster, history kept) or Delete them."]
    ],
    after: "Nothing posts to the accounts. Active shifts are the choices in the Roster grid. Deleting a shift leaves roster days that used it without a shift. Although the Paid hours hint mentions overtime, payroll does not read shifts: overtime comes from attendance and the contract's daily hours.",
    links: [
      { name: "Roster", how: "Where shifts are put onto people and days.", to: "hr.roster" },
      { name: "Contracts", how: "Daily Hours on the contract is what payroll uses for expected hours.", to: "hr.contracts" }
    ],
    mistakes: [
      ["Name required", "The Name box is empty. Type a name."],
      ["A shift cannot be removed from the box", "The shift box has no Delete button. Use Select on the list, tick it, then Archive or Delete."]
    ],
    tips: [
      "Archive a pattern you have stopped using instead of deleting it, so old roster weeks still show what people worked."
    ]
  },

  "hr.leaves": {
    title: "Time Off Requests",
    what: "A <b>time off request</b> records days an employee is away: <b>Paid time off</b>, <b>Sick leave</b> or <b>Unpaid</b>. A saved request waits as <b>To approve</b> until someone clicks <span class='man-key'>Approve</span>. For paid and sick leave, the box shows the employee's balance for the year: days allocated on Allocations, minus approved days already taken. Approval is refused when it would take the balance below zero.",
    when: [
      "An employee asks for holiday, or phones in sick.",
      "You approve a request waiting in the list.",
      "You want to check how many days someone has left this year."
    ],
    how: [
      "Make sure the employee has an allocation for the year on <b>Employees &rsaquo; Time Off &rsaquo; Allocations</b>. For this example, a clinic's dental nurse has 21 paid days for 2026 and asks for a week off.",
      "Open <b>Employees &rsaquo; Time Off &rsaquo; Requests</b> and click <span class='man-key'>New</span>.",
      "Choose the nurse in <b>Employee</b> and leave <b>Type</b> on <i>Paid time off</i>.",
      "Set <b>From</b> to Monday 10 August and <b>To</b> to Friday 14 August.",
      "Type 5 in <b>Days</b>. Orbit does not count the days from the dates, so type the working days yourself.",
      "Read the line under Days. You should see <i>Balance 2026: allocated 21, taken 0, remaining 21 day(s).</i>",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the request in the list with a <b>To approve</b> badge.",
      "When the manager agrees, open the request and click <span class='man-key'>Approve</span>. You should see <i>Approved</i> and a green <b>Approved</b> badge.",
      "Open a new request for the same nurse. The balance line now says <i>taken 5, remaining 16</i>."
    ],
    fields: [
      ["Employee", "Who is taking time off. Only active employees are listed.", "required"],
      ["Type", "Paid time off, Sick leave or Unpaid. Paid and sick leave are checked against that type's allocation; unpaid leave has no limit.", "optional"],
      ["From", "The first day off. It also decides which year's balance is used, and which pay period counts the leave. Starts as today.", "optional"],
      ["To", "The last day off. Starts as today.", "optional"],
      ["Days", "How many days are requested, in half days if needed. Not worked out from the dates. It is what the balance and any approval rule count. Starts at 1.", "optional"],
      ["Balance line", "Allocated, taken and remaining days for the employee, type and year. It turns red when remaining is below zero, and says when no allocation is set.", "auto"]
    ],
    buttons: [
      ["New", "Opens the New time off box."],
      ["Save", "Saves the request. A new request is saved as To approve."],
      ["Cancel", "Closes without saving."],
      ["Approve", "Shown on a saved request not yet approved. Checks the balance for paid and sick leave, then checks approval rules for leave requests. If none applies, the request becomes Approved."],
      ["Filters", "To approve, or Approved."],
      ["Group By", "Group by Employee or by Type."]
    ],
    after: "An approved request counts as taken in the employee's balance for the year of its From date. When a payslip run is generated, approved days whose From date falls inside the pay period appear as <b>Leave Days</b> on the payslip. Leave days do not change pay on their own, and unpaid leave is not deducted automatically: only a salary head whose formula uses <i>leave_days</i> changes the amount. If an approval rule for leave requests covers this many days, Approve sends the request to the named approver instead; it appears in Settings, Approvals and on My Desk. Creating and changing requests is written to the Activity log.",
    links: [
      { name: "Allocations", how: "Grant the yearly days that approval checks against.", to: "hr.alloc" },
      { name: "Approval Rules", how: "A rule for leave requests counts days, not money: set it at 5 to send a week or more to a named approver.", to: "approvals.rules" },
      { name: "Approvals", how: "Where the approver signs off a request sent to them.", to: "approvals.inbox" },
      { name: "Payslips", how: "Approved days in the period show as Leave Days.", to: "hr.slips" },
      { name: "Employees", how: "The Time Off counter on an employee opens this list.", to: "hr.emp" }
    ],
    mistakes: [
      ["Add an employee first", "There are no active employees. Add one in Employees."],
      ["Exceeds balance: only (number) day(s) remaining. Add an allocation first.", "Approving would take the balance below zero. Check the Days typed, give the employee more days on Allocations, or record the extra days as Unpaid."],
      ["(No allocation set - add one under Time Off > Allocations.)", "Shown in the balance line when the employee has no allocation of this type for that year. Approval of paid or sick leave will be refused until you add one."],
      ["Sent for approval ((currency) (days))", "Not an error: an approval rule covers this many days. The amount is shown with the currency sign, but it is the number of days. Once the approver approves it, open the request and click Approve again."],
      ["Already awaiting approval", "The request was already sent to the approver and they have not decided yet."],
      ["Could not approve: (reason)", "The database refused the change, for example because your role cannot edit the Employees app."]
    ],
    tips: [
      "There is no Refuse or Delete button on a request. A turned-down request simply stays unapproved: unapproved requests never count against the balance or on payslips.",
      "An approved request can still be edited and saved without the balance being checked again, so re-check the balance line if you change Days after approving."
    ]
  },

  "hr.alloc": {
    title: "Allocations",
    what: "An <b>allocation</b> grants an employee a number of days of one leave type for one calendar year, for example 21 days of paid time off for 2026. Time Off Requests checks paid and sick leave against these days before approving. Several allocations for the same employee, type and year add up.",
    when: [
      "At the start of each year, to give everyone their entitlement.",
      "A new starter joins part way through the year.",
      "Someone is granted extra days, for example for long service or carried-over leave."
    ],
    how: [
      "Open <b>Employees &rsaquo; Time Off &rsaquo; Allocations</b> and click <span class='man-key'>New</span>. For this example, a shop gives its store supervisor 21 days of holiday for 2026.",
      "Choose the supervisor in <b>Employee</b>.",
      "Leave <b>Type</b> on <i>Paid time off</i> and <b>Year</b> on 2026.",
      "Type 21 in <b>Days allocated</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a row with the supervisor, Paid time off, 2026 and 21.",
      "Add a second allocation of 6 days of <i>Sick leave</i> for 2026 the same way.",
      "On <b>Time Off Requests</b>, start a paid request for the supervisor. The balance line should show <i>allocated 21</i>."
    ],
    fields: [
      ["Employee", "Who is granted the days. Only active employees are listed.", "required"],
      ["Type", "Paid time off, Sick leave or Unpaid. Unpaid leave is never checked against a balance, so an unpaid allocation has no effect.", "optional"],
      ["Year", "The calendar year the days are for. A request counts against the year of its From date. Starts as this year.", "optional"],
      ["Days allocated", "How many days are granted, in half days if needed.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New allocation box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Group By", "Group by Employee."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing posts to the accounts. The days add to the employee's balance for that type and year, which Time Off Requests shows and checks when a request is approved. Unused days are not carried into the next year automatically: add them to next year's allocation yourself.",
    links: [
      { name: "Time Off Requests", how: "Requests are approved against these balances.", to: "hr.leaves" },
      { name: "Employees", how: "Allocations are per employee.", to: "hr.emp" }
    ],
    mistakes: [
      ["Add an employee first", "There are no active employees. Add one in Employees."],
      ["A balance is higher than expected", "The employee has more than one allocation for that type and year, and they add up. Open the extra one and set its days to 0."],
      ["Could not save: (reason)", "The database refused the change, for example because your role cannot edit the Employees app."]
    ],
    tips: [
      "An allocation cannot be deleted from this screen. To cancel one, open it and set Days allocated to 0.",
      "Check the Year before saving: an allocation for the wrong year leaves this year's balance at zero."
    ]
  },

  "hr.struct": {
    title: "Salary Structures",
    what: "A <b>salary structure</b> is a named set of salary heads, the recipe that turns a contract into a payslip. The structure only holds a name; its heads (basic pay, allowances, overtime, deductions, totals) are added on Salary Heads and linked to it. Each contract chooses one structure. A company may already have a <i>Standard Staff</i> structure with example heads.",
    when: [
      "Setting up payroll, before contracts are made running.",
      "One group of staff is paid differently, for example hourly kitchen crew and salaried managers.",
      "A structure is no longer used: archive it."
    ],
    how: [
      "Open <b>Employees &rsaquo; Payroll &rsaquo; Salary Structures</b> and click <span class='man-key'>New</span>. For this example, a contractor sets up pay for its site crew.",
      "Type <i>Site crew</i> in <b>Name</b> and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the structure with a green <b>Active</b> badge.",
      "Open <b>Salary Heads</b> and add the heads for it, choosing <i>Site crew</i> in each head's <b>Structure</b>: for example BASIC, OT, SSF and NET.",
      "Open each site worker's contract, choose <i>Site crew</i> in <b>Salary Structure</b>, and save.",
      "Open a draft payslip for one of them and click <span class='man-key'>Compute</span>. You should see one line for each active head of <i>Site crew</i>."
    ],
    fields: [
      ["Name", "What the structure is called, for example Site Labour, Staff or Management.", "required"],
      ["Status", "In the list only: Active, or Archived after using Select, Archive.", "auto"]
    ],
    buttons: [
      ["New", "Opens the New salary structure box."],
      ["Save", "Saves the name and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Select", "Tick rows to Archive or Delete them."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Nothing posts to the accounts. Payslips are computed from the active heads linked to the contract's structure. <b>Deleting a structure also deletes all its salary heads</b>, and every contract that used it is left with no structure, so a payslip run then skips those contracts. Archiving only marks the structure; the contract pickers still list it.",
    links: [
      { name: "Salary Heads", how: "Where the lines of the structure are defined.", to: "hr.heads" },
      { name: "Contracts", how: "Each contract picks the structure that builds its payslip.", to: "hr.contracts" },
      { name: "Payslip Runs", how: "Generate payslips skips any running contract without a structure.", to: "hr.runs" }
    ],
    mistakes: [
      ["Name required", "The Name box is empty. Type a name."],
      ["The contract's salary structure has no heads.", "Shown on a payslip when the structure has no heads. Add heads on Salary Heads with this structure chosen."],
      ["Nothing to pay: (number) running contract(s) have no wage/structure or have ended.", "Shown on a payslip run when running contracts have no structure, for example after their structure was deleted. Choose a structure on each contract."]
    ],
    tips: [
      "Most businesses need one or two structures. Build the new one fully and test it on a single payslip before moving contracts onto it."
    ]
  },

  "hr.heads": {
    title: "Salary Heads",
    what: "A <b>salary head</b> is one line of a payslip: basic pay, a housing allowance, overtime, social security, tax, or the gross and net totals. Each head belongs to one salary structure, has a category (earning, deduction, benefit, employer cost or total), and a computation type that says how its amount is worked out. When a payslip is computed, Orbit works through the structure's active heads in <b>Sequence</b> order, lowest first.",
    when: [
      "Setting up payroll, to define what a payslip contains.",
      "An allowance, a deduction or a tax rate changes.",
      "You need to check why a payslip came out at a particular figure."
    ],
    how: [
      "Open <b>Employees &rsaquo; Payroll &rsaquo; Salary Heads</b> and click <span class='man-key'>New</span>. For this example, a restaurant pays a line cook a 2,600 monthly wage (26 working days, 8 hours a day, so a day rate of 100 and an hourly rate of 12.50).",
      "Add BASIC: <b>Code</b> BASIC, <b>Name</b> Basic salary, your <b>Structure</b>, <b>Category</b> Earning, <b>Computation type</b> Per worked day, <b>Sequence</b> 10. Save. For a basic head this pays day rate x worked days.",
      "Add HRA named Housing allowance: Earning, <i>% of a base head</i>, <b>Amount</b> 25, <b>Base head</b> BASIC, Sequence 20.",
      "Add TRANSPORT named Transport allowance: Earning, <i>Fixed amount</i>, Amount 150, Sequence 30.",
      "Add OT named Overtime: Earning, <i>Overtime (hours x rate)</i>, Amount 0 so the contract's 1.25 multiplier is used, Sequence 40.",
      "Add GROSS named Gross salary: Category <i>Total</i>, Sequence 60. Add SSF named Social security: Deduction, <i>% of a base head</i>, 3, base BASIC, Sequence 70. Add TAX named Income tax: Deduction, <i>Formula</i>, <b>Formula</b> <i>GROSS * 0.05</i>, Sequence 80. Add NET named Net pay: Category <i>Total</i>, Sequence 90.",
      "Say the cook checked in on 24 days for 200 hours. Expected hours are 24 x 8 = 192, so overtime is 8 hours.",
      "Open a draft payslip for the cook and click <span class='man-key'>Compute</span>. You should see Basic salary 2,400.00, Housing allowance 600.00, Transport allowance 150.00, Overtime 125.00 (8 x 12.50 x 1.25), Gross 3,275.00, Social security 72.00, Income tax 163.75, Total deductions 235.75 and Net pay 3,039.25."
    ],
    fields: [
      ["Code", "A short unique code, for example BASIC, HRA or OT. Saved in capitals. Once computed, a head's amount can be used by its code in later percentage and formula heads.", "required"],
      ["Name", "The label shown on the payslip.", "required"],
      ["Structure", "Which salary structure the head belongs to.", "required"],
      ["Category", "Earning and Benefit add to gross pay. Deduction is taken off to reach net pay. Employer cost (EOS / employer SSF) is not in gross or net: it shows separately as cost to the company and is posted as a provision. Total shows a running total: net pay if the code contains NET, otherwise gross.", "optional"],
      ["Computation type", "<b>Fixed amount</b>: the Amount. <b>% of a base head</b>: Amount per cent of the base head. <b>Per worked day</b>: for the code BASIC, day rate x worked days; for any other code, Amount x worked days. <b>Per worked hour</b>: Amount x worked hours. <b>Overtime</b>: overtime hours x hourly rate x Amount, or x the contract's multiplier when Amount is 0. <b>Undertime</b>: undertime hours x hourly rate (Amount is ignored). <b>Formula</b>: the Formula. A Total head ignores this setting.", "optional"],
      ["Amount / rate / multiplier", "The fixed amount, the percentage (25 means 25%), the per-day or per-hour rate, or the overtime multiplier, depending on the type.", "optional"],
      ["Base head (for %)", "The code a percentage applies to, such as BASIC or GROSS. Starts as BASIC. BASIC means the prorated basic head once it has been computed, or the full monthly wage before that.", "optional"],
      ["Formula (for Formula type)", "An expression using head codes already computed and these values: BASIC, GROSS, NET, wage, working_days, daily_hours, day_rate, hour_rate, worked_days, worked_hours, ot_hours, ut_hours, leave_days. Maths functions such as min, max and round work. For example <i>GROSS * 0.05</i>. A formula with a mistake in it gives 0 without warning.", "optional"],
      ["Sequence", "The order of computation, lowest first. Put earnings before totals and deductions, and any head before the heads that use its code. Starts at 10.", "optional"],
      ["Active", "Yes or No. Inactive heads are skipped when a payslip is computed.", "optional"]
    ],
    buttons: [
      ["New", "Opens the New salary head box."],
      ["Save", "Saves and closes the box."],
      ["Cancel", "Closes without saving."],
      ["Filters", "Earnings (earning and benefit heads) or Deductions."],
      ["Group By", "Group by Structure or by Category."],
      ["Select", "Tick rows to Archive (make inactive) or Delete them."]
    ],
    after: "Nothing posts when you save a head. Heads are used when a payslip is computed, on a payslip or through Generate payslips on a run, and every amount is rounded to two decimals. Payslips already computed keep their lines: changing a head only affects payslips computed afterwards, so regenerate draft payslips after a change. When a payslip is posted, gross pay is debited to a salary expense account, net pay is credited to a salaries payable account and deductions to a payable account; employer costs are debited to the same expense account and credited to that payable account as a provision.",
    links: [
      { name: "Salary Structures", how: "Each head belongs to one structure.", to: "hr.struct" },
      { name: "Contracts", how: "Wage, working days, daily hours and the overtime multiplier come from the contract.", to: "hr.contracts" },
      { name: "Attendances", how: "Worked days, worked hours, overtime and undertime come from attendance.", to: "hr.att" },
      { name: "Payslips", how: "Compute on a payslip shows exactly what each head produced.", to: "hr.slips" }
    ],
    mistakes: [
      ["Code and name required", "Code or Name is empty. Fill in both."],
      ["Pick a structure", "No structure is chosen, usually because none exists yet. Create one on Salary Structures first."],
      ["A formula or percentage head comes out as 0", "The formula has a typing mistake, or it uses a code whose head has a higher Sequence and so has not been computed yet. Fix the formula, or lower the other head's Sequence."],
      ["Gross or net looks wrong", "A Total head only adds what came before it. Give GROSS and NET a higher Sequence than every earning and deduction they should include."],
      ["Overtime is 0", "The employee had no attendance in the period, so no overtime was measured, or their hours did not exceed worked days x daily hours."]
    ],
    tips: [
      "Test a change on one draft payslip with Compute, which shows the result without saving, before generating a whole run.",
      "Codes are matched exactly as typed in formulas, so keep them in capitals with no spaces."
    ]
  },

  "hr.runs": {
    title: "Payslip Runs",
    what: "A <b>payslip run</b> pays everyone for one period in one go. You save the run with its period, click <span class='man-key'>Generate payslips</span> to make a draft payslip for every usable running contract, review them, then click <span class='man-key'>Post all</span> to post them to the ledger. The run can then export a bank payment file, or a WPS salary file for banks in the Gulf.",
    when: [
      "At the end of each pay period, usually monthly.",
      "Attendance or a contract was corrected before posting, and the drafts need rebuilding.",
      "You need the file to send to the bank so staff are paid."
    ],
    how: [
      "Before you start, check <b>Employees &rsaquo; Employees</b> with the <b>Missing contract</b> filter, and make sure the month's attendance and approved time off are in. For this example, an office pays its staff for August 2026.",
      "Open <b>Employees &rsaquo; Payroll &rsaquo; Payslip Runs</b> and click <span class='man-key'>New</span>. The name shows the current month and the period covers it.",
      "Type <i>August 2026</i> as the name, and set <b>Period From</b> to 1 August 2026 and <b>Period To</b> to 31 August 2026.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, the buttons <span class='man-key'>Generate payslips</span>, <span class='man-key'>Post all</span>, <span class='man-key'>Bank file</span> and <span class='man-key'>WPS SIF</span>, and a <b>Payslips (0)</b> tab.",
      "Click <span class='man-key'>Generate payslips</span>. You should see, for example, <i>12 payslip(s) generated</i>, and one row per employee with Days, OT h, Gross, Deductions and Net.",
      "Click any row to open that payslip and check its lines. If something is wrong, fix the contract, the heads or the attendance, come back and click <span class='man-key'>Generate payslips</span> again. Do this only before posting.",
      "Click <span class='man-key'>Post all</span>. You should see <i>12 payslip(s) posted to the ledger</i>, and in the list the run now has a green <b>Done</b> badge.",
      "Open <b>Accounting &rsaquo; Accounting &rsaquo; Journal Entries</b>. You should see one entry per payslip, dated 31 August 2026, with the reference <i>Payslip</i> and the narration <i>Payroll 2026-08-01</i>.",
      "Back on the run, click <span class='man-key'>Bank file</span>. A CSV file downloads and you should see <i>12 payment line(s) exported</i>."
    ],
    fields: [
      ["Name", "The title box at the top, for example August 2026. Left empty, it is saved as <i>Run</i>. Used in the exported file names.", "optional"],
      ["Period From", "The first day of the pay period. Attendance and approved time off are counted from this date. Starts as the first of this month.", "optional"],
      ["Period To", "The last day of the pay period. It is also the date of the journal entries. Starts as the last day of this month.", "optional"],
      ["Payslips tab", "Shown once the run is saved: each payslip in the run with worked days, overtime hours, gross, deductions and net.", "auto"],
      ["Status", "In the list only: Draft, or Done after Post all.", "auto"]
    ],
    buttons: [
      ["New", "Opens a new run for the current month."],
      ["Save", "Saves the name and dates and keeps the run open."],
      ["Discard", "Returns to the list without saving."],
      ["Generate payslips", "Replaces the draft payslips in this run with a new draft payslip for each running contract, using the dates as last saved. It is refused once any payslip in the run is posted, because that pay is already in the ledger. A contract is skipped if it has no salary structure, a wage of 0, an end date before Period From or a start date after Period To; an employee with two running contracts is paid once."],
      ["Post all", "Checks approval rules for payroll runs against the total net pay of the draft payslips, then posts each draft payslip to the ledger. The run is marked Done only when every payslip posted; otherwise it tells you how many are still drafts."],
      ["Bank file", "Downloads a CSV file with one line per payslip in the run: Employee, Bank Account, Email, Currency and Net Amount."],
      ["WPS SIF", "Downloads a .sif salary file for the Wage Protection System: a header with your employer WPS ID, bank code, the date and time, the salary month, the number of records, the total net pay and the currency, then one line per payslip with the WPS person ID, routing code, IBAN (or bank account), net pay and gross pay."],
      ["A payslip row", "Opens that payslip."]
    ],
    after: "Post all writes one journal entry per payslip in the journal with the code MISC, dated Period To: the gross pay is debited to a salary expense account, net pay credited to a salaries payable account, and deductions credited to a payable account. Employer costs, when a structure has them, are debited to the same expense account and credited to that payable account. Orbit chooses the accounts by name, not from Settings, Companies: an active expense account whose name contains salary, payroll, personnel, wage or staff (otherwise code 6000, otherwise the first expense account), and a liability account whose name contains salary, payroll or personnel for net pay (otherwise code 4000, otherwise the first liability). Each payslip becomes <b>Confirmed</b>. It becomes <b>Paid</b> when the salary is paid from Counter against it. Posted payslips count in Payroll Consolidation. Payroll data is personal: the payroll screens can be switched off for a role in Settings, Roles &amp; Permissions.",
    links: [
      { name: "Contracts", how: "Only running contracts with a structure and a wage are paid.", to: "hr.contracts" },
      { name: "Salary Heads", how: "The lines each payslip is built from.", to: "hr.heads" },
      { name: "Attendances", how: "Worked days, hours, overtime and undertime for the period.", to: "hr.att" },
      { name: "Payslips", how: "Every payslip the run made, with its lines.", to: "hr.slips" },
      { name: "Approval Rules", how: "A rule for payroll runs makes Post all wait for the named approver.", to: "approvals.rules" },
      { name: "Company Profile", how: "Holds the WPS employer ID and WPS employer bank code for the WPS file.", to: "settings.profile" },
      { name: "Journal Entries", how: "Shows the entry each posted payslip created.", to: "moves" },
      { name: "Cash Desk", how: "Pay a salary as a Salary payment and settle the payslip, which marks it Paid.", to: "cash.desk" },
      { name: "Payroll Consolidation", how: "Posted payslips across all your companies.", to: "hr.payconsol" }
    ],
    mistakes: [
      ["No running contracts. Set a contract to Running first.", "No contract in this company is Running. Open Contracts and set them to Running, or use Create for all."],
      ["Nothing to pay: (number) running contract(s) have no wage/structure or have ended.", "Every running contract has no structure, a wage of 0, or ended before the period. Fix the contracts, then generate again."],
      ["(number) payslip(s) generated - (number) skipped (no wage/structure or ended)", "Some contracts were left out for those reasons. Check the Missing contract filter and the contracts before posting."],
      ["No draft payslips to post", "Everything in the run is already posted, or nothing was generated yet."],
      ["Sent for approval ((currency) (amount))", "Not an error: an approval rule covers a payroll of this size. Once the approver approves it in Settings, Approvals, open the run and click Post all again."],
      ["Already awaiting approval", "The run was already sent and the approver has not decided yet."],
      ["No MISC journal to post to", "The company has no journal with the code MISC. Add one in Accounting before posting."],
      ["Need a salary/expense account and a payable account in the chart", "The chart of accounts has no active expense account or no active liability account. Add them in the Chart of Accounts."],
      ["Post failed: Period locked on (date)", "Period To falls on or before the locked date. Ask whoever locked the period to reopen it, or use a later period."],
      ["WPS SIF exported - set the employer WPS ID + bank code in Company Profile", "The file downloaded, but its header is incomplete. Fill in both fields in Settings, Company Profile and export again."],
      ["WPS SIF exported - (number) employee(s) missing WPS ID/IBAN", "Some employees have no WPS person ID or IBAN. Fill them in on each employee record and export again before sending it to the bank."],
      ["No payslips to export", "Generate payslips first."],
      ["This run already has (number) posted payslip(s), so it cannot be generated again. Their pay is in the ledger. Start a new run for any correction.", "Generate payslips protects pay that is already posted. For a correction, create a new run for the same period with only the people and amounts that need adjusting."],
      ["(number) of (number) payslip(s) posted. The rest are still drafts: open one to see why, fix it, then click Post all again.", "Some payslips could not post, for example because an account is missing or the period is locked. The run stays open until they post."]
    ],
    tips: [
      "Save the run before generating: Generate payslips uses the dates as last saved, not what is typed on screen.",
      "A running contract that starts after Period To is skipped, so a new hire can be set up in advance without being paid early.",
      "Review the draft payslips before Post all: once one is posted, the run can no longer be regenerated."
    ]
  },

  "hr.slips": {
    title: "Payslips",
    what: "A <b>payslip</b> is one employee's pay for one period: the salary heads as lines, gross pay, total deductions and net pay, plus employer costs and cost to company when the structure has them. It goes from <b>Draft</b> to <b>Confirmed</b> (posted to the ledger) to <b>Paid</b> (settled from Counter). Most payslips are made by a payslip run; you can also make one on its own, for example the final pay of someone leaving part way through a month.",
    when: [
      "Reviewing a payslip a run generated, before posting.",
      "Paying one person outside the normal run, such as a leaver or a late starter.",
      "Printing a payslip to give to an employee.",
      "Checking which payslips are still unpaid."
    ],
    how: [
      "Open <b>Employees &rsaquo; Payroll &rsaquo; Payslips</b> and click <span class='man-key'>New</span>. For this example, a retailer pays a sales assistant who leaves on 10 September, on a 2,600 wage over 26 working days.",
      "Choose the sales assistant in <b>Employee</b>.",
      "Set <b>Period From</b> to 1 September and <b>Period To</b> to 10 September.",
      "Type 10 in <b>Worked Days</b>. On a new payslip it starts at 0, and a basic head paid per worked day pays nothing until you fill it in. Leave the overtime, undertime and leave boxes at 0.",
      "Click <span class='man-key'>Compute</span>. The <b>Salary computation</b> tab shows the lines, for example Basic salary 1,000.00 (100 a day x 10). Nothing is saved yet.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the stage on <b>Draft</b>.",
      "Click <span class='man-key'>Confirm &amp; Post</span>. You should see <i>Confirmed &amp; posted to the ledger</i>, the stage move to <b>Confirmed</b>, and the fields lock.",
      "Click <span class='man-key'>Print</span> for a copy to hand over.",
      "Pay the salary from <b>Counter &rsaquo; Cash Desk</b> as a <i>Salary</i> payment to the employee, choosing <i>Payslip - net</i> under <b>Settle a document</b>. The payslip then shows <b>Paid</b>."
    ],
    fields: [
      ["Employee", "Who is being paid. Only active employees are listed. Their running contract sets the wage and structure; with no running contract, another of their contracts is used.", "required"],
      ["Period From and Period To", "The pay period. Period To is the date of the journal entry. They start as this month.", "optional"],
      ["Worked Days", "Paid days worked, which prorate a per-day basic. A run fills it from attendance; on a new payslip you type it.", "optional"],
      ["Overtime Hours", "Hours beyond the expected hours. A run fills it from attendance.", "optional"],
      ["Undertime Hours", "Hours short of the expected hours, deducted by an undertime head.", "optional"],
      ["Leave Days", "Approved leave days in the period. Only a formula head using leave_days changes pay with it.", "optional"],
      ["Salary computation", "The lines, grouped as Earnings, Gross, Deductions, Total deductions and Net pay, then Employer costs, Total employer cost and Cost to company when there are any.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank payslip for the current month."],
      ["Save", "Computes the payslip from the contract and heads and saves it with its lines."],
      ["Discard", "Returns to the list without saving."],
      ["Compute", "Shown on a draft. Shows the lines for the figures on screen without saving anything."],
      ["Confirm &amp; Post", "Shown on a draft. Computes, saves and posts the payslip to the ledger, making it Confirmed and locked. It does not check approval rules for payroll runs."],
      ["Print", "Shown on a saved payslip. Prints a branded payslip with earnings, deductions, employer costs, gross, deductions, net pay and cost to company, as last saved."],
      ["Filters", "Draft, Confirmed or Paid."],
      ["Group By", "Group by Status."]
    ],
    after: "Confirm &amp; Post writes the same journal entry as a payslip run: gross pay debited to a salary expense account, net pay credited to a salaries payable account, deductions and any employer costs credited to a payable account, in the journal with the code MISC. There is no Edit or reverse on a posted payslip. A Salary payment in Counter that settles the payslip marks it Paid. Confirmed and Paid payslips count in Payroll Consolidation, and a privacy export of the employee includes all their payslips. Any member of the company can read payslips at database level; in the app, the payroll screens follow the Employees (HR) module and its Payroll part in each role.",
    links: [
      { name: "Payslip Runs", how: "Makes and posts payslips for everyone at once.", to: "hr.runs" },
      { name: "Contracts", how: "The wage, structure, days and hours behind every payslip.", to: "hr.contracts" },
      { name: "Salary Heads", how: "Each line on the payslip is one head.", to: "hr.heads" },
      { name: "Cash Desk", how: "Record the salary payment and settle the payslip to mark it Paid.", to: "cash.desk" },
      { name: "Journal Entries", how: "See what a posted payslip wrote to the ledger.", to: "moves" },
      { name: "Roles &amp; Permissions", how: "Switch the Payroll part off for roles that should not see pay.", to: "settings.roles" }
    ],
    mistakes: [
      ["Pick an employee", "No employee is chosen. Pick one."],
      ["This employee has no contract. Create one under Contracts.", "The employee has no contract at all. Create one, with a structure and wage, first."],
      ["The contract's salary structure has no heads.", "The contract's structure is empty, or the contract has no structure. Add heads on Salary Heads, or choose a structure on the contract."],
      ["Basic salary shows 0.00", "Worked Days is 0. Type the days worked and compute again."],
      ["Need a salary/expense account and a payable account in the chart", "The chart has no active expense or liability account. Add them in the Chart of Accounts."],
      ["No MISC journal to post to", "The company has no journal with the code MISC. Add one before posting."],
      ["Post failed: Period locked on (date)", "Period To is on or before the locked date. Reopen the period, or use a later date."],
      ["Save failed", "The change to an existing payslip was refused, for example because your role cannot edit the Employees app."],
      ["A payslip you edited has disappeared", "Its run was generated again, which deletes and remakes every payslip in the run. Make changes after the last generate, or on the contract and heads."]
    ],
    tips: [
      "Check the payslip in Journal Items before paying: Counter's Salary payment debits account code 4200 by default, while the payslip credits net pay to a payable account chosen by name. Make sure they are the same account so the amount owed clears.",
      "A posted payslip cannot be changed. If it was wrong, correct the books with a journal entry and pay the difference on the next payslip."
    ]
  },

  "hr.eos": {
    title: "End of Service",
    what: "End of Service works out the <b>gratuity</b> (end-of-service benefit) owed to an employee on their last working day, from their contract's start date and monthly wage and your company's gratuity rule. The result is a printable settlement sheet. It covers gratuity only: it does not add unpaid salary or unused leave, post anything to the accounts, or pay anyone.",
    when: [
      "Someone resigns or is let go and you need their gratuity figure.",
      "You want to estimate what you would owe someone today.",
      "Setting up the company's rule to match your country's labour law."
    ],
    how: [
      "Check the employee's contract has a <b>Start Date</b> and the right <b>Monthly Wage</b>. For this example, a contractor in the UAE settles a site engineer who started on 1 March 2019 on a 3,000 basic.",
      "Open <b>Employees &rsaquo; Payroll &rsaquo; End of Service</b>. The rule bar shows the defaults: day rate = basic divided by 30, 21 days a year for the first 5 years, then 30 days a year.",
      "If your law is different, change the four numbers and click <span class='man-key'>Save as company default</span>. You should see <i>Gratuity rules saved as this company's default</i>.",
      "Set the date box to the last working day, 31 August 2026.",
      "Choose the engineer in the employee picker. The sheet calculates as soon as you pick; click <span class='man-key'>Calculate</span> after changing the date or the rule.",
      "You should see Years of service 7.50, Last basic salary 3,000.00 and Daily rate 100.00.",
      "Under the gratuity heading you should see the first 5 years: 105.0 days, 10,500.00, and beyond 5 years: 75.1 days, 7,505.13, with a Total end-of-service gratuity of 18,005.13.",
      "Click <span class='man-key'>Print</span> to keep a copy with the leaver's file.",
      "Record the payment in the accounts yourself, then set the contract to Expired and archive the employee."
    ],
    fields: [
      ["Employee", "The person leaving. Only active employees are listed, so calculate before archiving them.", "required"],
      ["Last working day", "The date box. Service is counted from the contract start date to this day, in years of 365.25 days including part years. Starts as today.", "optional"],
      ["Day rate = basic divided by", "The divisor for the daily rate. Starts at 30; blank is treated as 30.", "optional"],
      ["Days per year for the first years", "Gratuity days earned for each year up to the cap. Starts at 21.", "optional"],
      ["Years (the cap)", "How many years the first rate applies to. Starts at 5.", "optional"],
      ["Days per year after", "Gratuity days for each year beyond the cap. Starts at 30.", "optional"],
      ["Settlement sheet", "Contract start, last working day, years of service, last basic salary, daily rate, the two parts and the total. The basic is the contract's whole Monthly Wage.", "auto"]
    ],
    buttons: [
      ["Calculate", "Works out the settlement for the chosen employee and date."],
      ["Print", "Opens your browser's print window for the screen."],
      ["Save as company default", "Saves the four rule numbers for this company, so they are filled in next time for everyone."]
    ],
    after: "Nothing is posted, paid or changed on the employee or contract. Saving the rule stores it in the company's profile. The sheet uses the running contract, or another contract of the employee if none is running. If your structure has an employer cost head for a monthly end-of-service provision, the total here is not reduced by what has already been provided; deduct it yourself when you settle.",
    links: [
      { name: "Contracts", how: "The start date and monthly wage come from the contract.", to: "hr.contracts" },
      { name: "Salary Heads", how: "An employer cost head can build a monthly end-of-service provision.", to: "hr.heads" },
      { name: "Employees", how: "Archive the leaver once settled.", to: "hr.emp" }
    ],
    mistakes: [
      ["Pick an employee", "No employee is selected. Choose one."],
      ["This employee has no contract with a start date. Set a contract start date under Contracts.", "Their contract has no Start Date, or they have no contract. Fill it in and calculate again."],
      ["Could not save: (reason)", "The rule could not be saved, usually because your role cannot change company settings."],
      ["The leaver is not in the picker", "They have already been archived. Set them back to Active, calculate, then archive again."]
    ],
    tips: [
      "If part of the monthly wage is allowances that your law leaves out of gratuity, the sheet still uses the whole wage: work out the adjustment yourself."
    ]
  },

  "hr.payconsol": {
    title: "Payroll Consolidation",
    what: "A group view of payroll cost across every company you belong to. For each company it adds up the gross pay, employer cost, total cost and net pay of all <b>posted</b> payslips (Confirmed or Paid), converts them into the group's reference currency at the latest exchange rate, and totals the group. It covers every posted payslip ever, not one period.",
    when: [
      "You run several companies and want the total payroll bill in one currency.",
      "Comparing staff cost between companies in the group."
    ],
    how: [
      "Post the payslips in each company first. For this example, a group owns a restaurant company in Lebanon and a catering company in Dubai.",
      "Make sure <b>Accounting &rsaquo; Configuration &rsaquo; Exchange Rates</b> has a rate for each company currency that differs from the group currency.",
      "Open <b>Employees &rsaquo; Payroll &rsaquo; Payroll Consolidation</b>. You should see <i>Consolidating payroll across 2 entities...</i> and then the report.",
      "Read one row per company: Entity, Cur, the rate used, Gross (a foreign company also shows its own-currency gross above), Employer cost, Total cost and Net.",
      "Check the <b>Total</b> row for the group in the reference currency.",
      "If a yellow banner names a currency, add that rate and open the screen again.",
      "Click <span class='man-key'>Print</span> for a copy."
    ],
    fields: [
      ["Rate", "The latest rate for that company's currency from Exchange Rates, or 1.0000 for a company already in the reference currency.", "auto"],
      ["Gross, Employer cost, Total cost, Net", "Sums of the company's Confirmed and Paid payslips, converted. Total cost is gross plus employer cost.", "auto"]
    ],
    buttons: [
      ["Print", "Opens your browser's print window for the report."]
    ],
    after: "Nothing changes: the report only reads. Draft payslips are left out. The same latest rate is applied to every payslip, whatever its date.",
    links: [
      { name: "Payslip Runs", how: "Payslips only count once they are posted.", to: "hr.runs" },
      { name: "Exchange Rates", how: "The rates used to convert each company.", to: "rates" },
      { name: "Payslips", how: "The payslips behind each company's figures.", to: "hr.slips" }
    ],
    mistakes: [
      ["No exchange rate for (currency) - those entities are shown 1:1. Add a rate under Accounting > Exchange Rates.", "A company's currency has no rate, so its figures were added unconverted. Add the rate and reopen the report."],
      ["No posted payslips yet.", "No company has a Confirmed or Paid payslip. Post a payslip run first."],
      ["The figures are far bigger than one month", "The report adds every posted payslip ever. For one month, look at that month's payslip runs."],
      ["A company is missing", "Only companies you are a member of are included."]
    ],
    tips: [
      "Employer cost is only filled in when your salary structures have employer cost heads."
    ]
  },

  "hr.exp": {
    title: "Expenses",
    what: "Expenses are costs an employee paid out of their own pocket for the business, such as a taxi, a small purchase or a hotel, that the company owes back. A claim is saved as a draft, then approved, then posted to the accounts as an amount owed. Paying the employee back is done separately.",
    when: [
      "An employee hands in a receipt.",
      "A manager approves claims.",
      "Approved claims need to go into the books."
    ],
    how: [
      "Open <b>Employees &rsaquo; Expenses</b> and click <span class='man-key'>New</span>. For this example, a clinic's receptionist bought printer ink for 45.00.",
      "Type <i>Printer ink for reception</i> in <b>Description</b> and choose the receptionist in <b>Employee</b>.",
      "Type 45 in <b>Amount</b> and set <b>Date</b> to the date on the receipt.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the claim in the list with a <b>Draft</b> badge.",
      "Open the claim and click <span class='man-key'>Approve</span>. You should see <i>Approved</i> and a green <b>Approved</b> badge.",
      "Open it again and click <span class='man-key'>Post to accounts</span>. You should see <i>Posted to accounts - now a payable to reimburse</i>; opening it now shows a <b>Posted</b> badge.",
      "Open <b>Accounting &rsaquo; Accounting &rsaquo; Journal Entries</b>. You should see an entry <i>Staff expense: Printer ink for reception</i> with 45.00 debited to an expense account and 45.00 credited to a payable account.",
      "Pay the receptionist back and record that payment in the accounts."
    ],
    fields: [
      ["Description", "What the expense was for, for example Site travel or Materials. It becomes the narration of the journal entry.", "required"],
      ["Employee", "Who paid and is owed. Only active employees are listed.", "required"],
      ["Amount", "The total spent, in the company currency. A claim of 0 cannot be posted.", "optional"],
      ["Date", "When the expense was incurred. It is the date of the journal entry. Starts as today.", "optional"],
      ["Status", "In the list only: Draft or Approved.", "auto"]
    ],
    buttons: [
      ["New", "Opens the New expense box."],
      ["Save", "Saves the claim. A new claim is saved as a draft. Save does not stop you changing an approved or posted claim."],
      ["Cancel", "Closes without saving."],
      ["Approve", "Shown on a saved claim that is not yet approved. Checks approval rules for expenses against the amount as last saved, then marks the claim Approved."],
      ["Post to accounts", "Shown on an approved claim not yet posted. Posts it to the ledger and marks it Posted."],
      ["Filters", "To submit (drafts), or Approved."],
      ["Group By", "Group by Employee or by Month."],
      ["Select", "Tick rows to export or delete several claims."]
    ],
    after: "Posting writes one journal entry in the journal with the code MISC, dated the expense date: the amount is debited to an active expense account whose name contains travel, expense, sundry, misc, admin or staff (otherwise code 6500, otherwise the first expense account), and credited to account code 4000 (otherwise the first liability account). The credit line does not name the employee. Orbit does not pay the claim back for you. Creating, approving and posting claims is written to the Activity log.",
    links: [
      { name: "Approval Rules", how: "A rule for expenses above an amount makes Approve wait for the named approver.", to: "approvals.rules" },
      { name: "Approvals", how: "Where the approver signs off a claim sent to them.", to: "approvals.inbox" },
      { name: "Journal Entries", how: "Shows the entry a posted claim created.", to: "moves" },
      { name: "Chart of Accounts", how: "Where the expense and payable accounts used for posting live.", to: "accounts" }
    ],
    mistakes: [
      ["Description required", "The Description box is empty. Say what the expense was for."],
      ["Add an employee first", "There are no active employees. Add one in Employees."],
      ["Sent for approval ((currency) (amount))", "Not an error: an approval rule covers this amount. Once it is approved in Settings, Approvals, open the claim and click Approve again."],
      ["Already awaiting approval", "The claim was already sent and the approver has not decided."],
      ["The expense amount is zero.", "The claim was saved with an amount of 0. Enter the amount, save, and post again."],
      ["Need an expense account and a payable (4000) in the chart of accounts.", "The chart has no active expense account or no liability account. Add them in the Chart of Accounts."],
      ["No MISC journal to post to.", "The company has no journal with the code MISC. Add one before posting."],
      ["Post failed: Period locked on (date)", "The expense date is on or before the locked date. Use a later date, or ask for the period to be reopened."],
      ["A posted claim shows Draft in the list", "The list has no Posted badge, so posted claims show as Draft. Open the claim: the box shows Posted and there is no Approve button."]
    ],
    tips: [
      "Save before clicking Approve if you changed the amount: the approval check uses the amount last saved.",
      "Deleting a posted claim leaves its journal entry in the books, so do not delete claims once posted."
    ]
  },

  "rec.applicants": {
    title: "Applicants",
    what: "Applicants are people who have applied to work for you, tracked through the hiring stages <b>New</b>, <b>Screening</b>, <b>Interview</b>, <b>Offer</b>, <b>Hired</b> and <b>Rejected</b>. Each applicant has contact details, the job position applied for, where they came from, a rating, the date applied, a link to their CV and notes. The kanban view shows the pipeline stage by stage.",
    when: [
      "A CV or application arrives.",
      "After a screening call or interview, to move the person on and note what you thought.",
      "Reviewing everyone in the pipeline for a position."
    ],
    how: [
      "Make sure the role exists on <b>Recruitment &rsaquo; Job Positions</b>. For this example, a restaurant is hiring a sous chef.",
      "Open <b>Recruitment &rsaquo; Applicants</b> and click <span class='man-key'>New</span>.",
      "Type the person's name in the <b>Applicant name</b> box at the top, then their <b>Email</b> and <b>Phone</b>.",
      "Choose <i>Sous chef</i> in <b>Job position</b> and type <i>Referral</i> in <b>Source</b>.",
      "Paste the address of their CV in <b>CV link</b>. <b>Applied date</b> already shows today.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the stage bar at the top on <b>New</b>.",
      "After the interview, change <b>Stage</b> to <i>Interview</i>, set <b>Rating (1-5)</b> to 4, write your notes, and click <span class='man-key'>Save</span>. The stage bar now shows Interview, with the stages before it marked as passed.",
      "On the list, switch to the kanban view to see everyone by stage.",
      "When you hire them, set Stage to <i>Hired</i> and save, then add them as an employee in Employees. Hiring does not create the employee for you."
    ],
    fields: [
      ["Applicant name", "The box at the top of the form.", "required"],
      ["Email", "Their email address. Searchable from the list.", "optional"],
      ["Phone", "Their phone number.", "optional"],
      ["Job position", "The role they applied for, from Job Positions.", "optional"],
      ["Stage", "New, Screening, Interview, Offer, Hired or Rejected. A new applicant starts on New. Change stages here: there are no stage buttons.", "optional"],
      ["Source", "Where they came from, for example LinkedIn or a referral. Used by the Source grouping.", "optional"],
      ["Rating (1-5)", "Your overall score, shown as stars. 0 means not rated; anything above 5 is saved as 5.", "optional"],
      ["Applied date", "When they applied. Starts as today.", "optional"],
      ["CV link", "A web address where their CV is stored.", "optional"],
      ["Notes", "Interview notes and anything else worth keeping.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank applicant."],
      ["Save", "Saves and keeps the applicant open."],
      ["Discard", "Returns to the list without saving."],
      ["Delete", "Shown on a saved applicant to people who can manage the Recruitment app. Asks you to confirm, then deletes the record."],
      ["Filters", "One filter per stage."],
      ["Group By", "Group by Stage or by Source."],
      ["Kanban", "Shows applicants as cards on a board, each with name, email, source and rating."]
    ],
    after: "Nothing changes in the accounts or in other apps. A hired applicant is not turned into an employee, and does not change the headcount on Job Positions. Applicants are personal data: the privacy tools in Settings look people up as contacts, employees or leads, and erasing a person there also clears the same email address on applicants. Nothing deletes old applicants automatically, so delete them when you no longer need them.",
    links: [
      { name: "Job Positions", how: "The roles applicants are filed against.", to: "hr.jobs" },
      { name: "Employees", how: "Add a hired applicant here by hand.", to: "hr.emp" },
      { name: "Privacy &amp; data requests", how: "Answer a request to see or delete what you hold about someone.", to: "settings.privacy" }
    ],
    mistakes: [
      ["Enter the applicant's name", "The name box is empty. Type their name."],
      ["Save failed", "The change to an existing applicant was refused, for example because your role cannot edit the Recruitment app."],
      ["A rejected applicant shows every stage as passed", "The stage bar has no Rejected step. The Stage column in the list shows Rejected."]
    ],
    tips: [
      "Always fill in the email: it is how the privacy tools find the person if they ask what you hold."
    ]
  }

});
