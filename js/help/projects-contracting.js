/* Orbit screen help: the Projects app and the Contracting app.
 *
 * One page per screen, keyed by the screen's menu action. js/app.js loads this
 * file the first time help is opened (loadScreenHelp) and renders a page with
 * screenHelpHTML. Plain English, written for someone doing the job for the
 * first time. Never an em dash.
 *
 * Projects app: proj.list, task.list, proj.board, proj.mywork, proj.schedule,
 * ts.list, proj.labels.
 * Contracting app: site.field, inst.jobs, site.snags, site.insp, site.inspt,
 * site.diary, site.incidents, site.plant, site.plantutil, tools.list,
 * doc.drawings, doc.subs, doc.rfis, doc.trans, pc.list, var.list, proj.wip,
 * proj.retention, sc.list, proj.jobcost, proj.pnl, cost.codes, proj.materials.
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

  "proj.list": {
    title: "Projects",
    what: "A <b>project</b> is one piece of work you deliver for a customer: a website build for an agency, a product launch for an events team, a network upgrade, a clinic fit-out or a facade package. It is the record the rest of Orbit points at: tasks, hours, purchase orders, bills, certificates and site records all carry the project, and the cost reports read them back by project. The list shows every project in the company with its customer, deadline, billing type, hours logged and stage; opening one shows the project form.",
    when: [
      "You win a job, or start an internal piece of work, and need somewhere to hang its tasks, time and costs.",
      "You want to set a contract value, retention or advance before raising progress certificates.",
      "You need to build the Schedule of Values or the cost budget that Job Cost, Project P&amp;L and the WIP Schedule compare against.",
      "Approved hours are waiting to be billed and you want to turn them into a customer invoice."
    ],
    how: [
      "Open <b>Projects &rsaquo; Projects</b> and click <span class='man-key'>New</span>. For this example, a design agency is rebuilding a retailer's website and bills its time.",
      "Type <i>Retailer website rebuild</i> in <b>Project name</b> at the top of the form.",
      "Pick the <b>Customer</b>. If the retailer is not in the list, choose <i>+ Add a new customer...</i> at the bottom, type the name and click <span class='man-key'>Create &amp; select</span>.",
      "Set <b>Billing</b> to <i>Time &amp; material</i>, <b>Start date</b> to 1 September and <b>Deadline</b> to 30 November. Leave <b>Status</b> on Active and <b>Stage</b> on Active.",
      "Type <i>PRJ-014</i> in <b>Project Code</b> and 18,000.00 in <b>Contract Value</b>. Leave <b>Retention %</b> and <b>Advance Payment</b> at 0; they are for contracts where the client holds money back.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the project in the list with 0.00 hours.",
      "Open the project again. You should see four buttons across the top of the sheet: <b>Contract</b>, <b>Certified</b>, <b>Cost budget</b> and <b>Hours</b>, and a <b>Tasks</b> tab at the bottom.",
      "Click <b>Cost budget</b>, type <i>Labour</i> in <b>Category</b> and 11,000.00 in <b>Budgeted cost</b>. The totals under the table should read Estimated margin 7,000.00 (38.9%). Click <span class='man-key'>Save</span>; you should see <i>Budget saved</i> and the project form again.",
      "Click <span class='man-key'>Log time</span>, enter 6 in <b>Hours</b> with the description <i>Home page wireframes</i>, and click <span class='man-key'>Log</span>. The Hours button now reads 6.0, with 6.0 unapproved.",
      "Once a manager has approved those hours in Timesheets, reopen the project. A <span class='man-key'>Bill 6.0h</span> button appears. Click it, enter 75.00 in <b>Rate / hour</b>, check that the invoice total reads 450.00, and click <span class='man-key'>Create draft invoice</span>. The draft invoice opens."
    ],
    fields: [
      ["Project name", "The name at the top of the form, as it appears in every project picker across Orbit.", "required"],
      ["Photo (beside the name)", "An optional picture of the project. It becomes the thumbnail in the list and on kanban cards.", "optional"],
      ["Customer", "The client the project is delivered for. Only contacts marked as customers are listed; <i>+ Add a new customer...</i> creates one without leaving the form. It is needed before you can bill hours or invoice a progress certificate.", "optional"],
      ["Billing", "How the project is billed: Non-billable, Fixed price, Time &amp; material or Milestones. It shows in the list and you can group by it.", "optional"],
      ["Start date", "When work on the project begins.", "optional"],
      ["Deadline", "The target finish date. It shows in the list, can be changed straight in the list, and the bell reminds you as it approaches.", "optional"],
      ["Status", "Active or Closed. Only active projects are offered when you log time, add tasks, raise snags, inspections, diaries and document records, and only active projects appear in Project P&amp;L and the WIP Schedule. Archiving a project from the list sets it to Closed.", "optional"],
      ["Stage", "Planning, Active, On hold, Completed or Cancelled. It is the column the project sits in on the list's kanban board; dragging a card to another column changes it.", "optional"],
      ["Project Code", "Your own reference for the job, for example PRJ-014.", "optional"],
      ["Contract Value", "The agreed price. Job Cost, Project P&amp;L and the WIP Schedule use it. When the project has a Schedule of Values the box is read-only and equals the schedule's total.", "optional"],
      ["Retention %", "The percentage the client holds back on each progress certificate, for example 5. Every certificate for this project uses it.", "optional"],
      ["Advance Payment", "The advance or mobilisation payment received up front. The part recovered each period is typed on each progress certificate.", "optional"],
      ["Custom fields", "Any extra fields your company added for projects appear under the contract fields. One marked with a star must be filled before Save.", "optional"],
      ["Schedule of Values lines (Contract button)", "Code, Description, Unit, Qty and Rate on each line; Amount is Qty times Rate. Saving replaces every line and sets the Contract Value to the total. A line with no description is saved as <i>Item</i>.", "optional"],
      ["Cost budget lines (Cost budget button)", "Cost code, Category (for example Labour), Description and Budgeted cost. Under the table you see the total budget, the contract value and the estimated margin. A line with no category is saved as <i>Cost</i>.", "optional"],
      ["Unbilled hours (Bill dialog)", "The approved hours on the project not yet invoiced.", "auto"],
      ["Rate / hour (Bill dialog)", "Your charge per hour. Unbilled hours times this rate is the invoice amount.", "required"],
      ["Invoice line description (Bill dialog)", "The text the customer sees on the invoice line. It starts as Professional services followed by the project name.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank project form. Shown to people who can manage the app."],
      ["Save", "Saves the project and returns to the list."],
      ["Discard", "Goes back to the list without saving."],
      ["Execution board", "Shown on a saved project. Opens Projects &rsaquo; Execution on this project, in the Board view."],
      ["Log time", "Shown on a saved project. Opens the Log time dialog with this project chosen."],
      ["Bill (hours)h", "Shown when the project has approved hours not yet invoiced. Opens the Bill time dialog."],
      ["Create draft invoice", "In the Bill time dialog. Creates a draft customer invoice for the hours at your rate, marks those hours invoiced and opens the invoice."],
      ["Delete", "Deletes the project after a confirmation. Its tasks, programme activities, sprints, Schedule of Values, cost budget, variations and progress certificates are deleted with it."],
      ["Contract", "Opens the Schedule of Values for the project, where <span class='man-key'>+ Add line</span> adds a row, the cross removes one and <span class='man-key'>Save</span> stores the lines."],
      ["Certified", "Shows the total of the project's certified and invoiced progress certificates; clicking it opens Progress Certificates."],
      ["Cost budget", "Opens the cost budget editor, with <span class='man-key'>+ Add line</span> and <span class='man-key'>Save</span>."],
      ["Hours", "Shows the hours logged, and how many still await approval; clicking it opens Timesheets."],
      ["Filters and Group By", "Filter to Active or Closed projects; group by Stage, Customer or Billing."],
      ["List, Thumbnails, Kanban board", "Switch how the list is shown. On the kanban board, drag a card between the stage columns to change its Stage."],
      ["Select", "Tick rows, then <span class='man-key'>Export selected</span>, <span class='man-key'>Archive</span> (they become Closed) or <span class='man-key'>Delete</span>."],
      ["Export", "Downloads the list as a CSV file that opens in Excel."]
    ],
    after: "Saving a project posts nothing to the accounts. From then on it appears in the pickers of tasks, timesheets, purchase orders, bills, certificates, variations, subcontracts, snags, diaries and document records. <b>Job Cost</b> reads its cost budget, purchase orders, posted bills, stock issued to it and install labour; <b>Project P&amp;L</b> and the <b>WIP Schedule</b> also read its certified progress certificates. The <b>Bill</b> button creates a draft customer invoice dated today, due in 30 days, with one line and no tax, tagged to the project, and flags the hours as invoiced. Nothing reaches the ledger until that invoice is posted.",
    links: [
      { name: "Tasks", how: "Tasks belong to a project. The project form's Tasks tab lists them with planned and logged hours.", to: "task.list" },
      { name: "Timesheets", how: "Hours logged against the project. Only approved hours can be billed from the project.", to: "ts.list" },
      { name: "Execution", how: "The team board for the project's tasks, opened by the Execution board button.", to: "proj.board" },
      { name: "Progress Certificates", how: "Certificates use the project's Retention % and start their claim from its Schedule of Values.", to: "pc.list" },
      { name: "Variations", how: "Approving a variation adds its amount to the project's Contract Value.", to: "var.list" },
      { name: "Job Cost", how: "Budget against committed and actual cost for the project, by cost code.", to: "proj.jobcost" },
      { name: "Project P&amp;L", how: "Certified revenue against actual cost for every active project.", to: "proj.pnl" },
      { name: "Customer invoices", how: "The Bill button and a certificate's Create client invoice both make draft invoices tagged to the project.", to: "inv.out" }
    ],
    mistakes: [
      ["Name required", "The project name at the top is empty. Type a name, then Save."],
      ["Set a Customer on the project first, then Save.", "You clicked Bill on a project with no customer. Choose the Customer, Save, reopen the project and click Bill again."],
      ["Enter a rate per hour", "The Rate / hour in the Bill time dialog is zero. Enter your hourly rate."],
      ["This project is used in other records - it can't be deleted. Archive it instead.", "Something outside the project still points at it. Set Status to Closed, or use Select and Archive on the list, instead of deleting."],
      ["The Contract Value box cannot be typed in", "The project has a Schedule of Values, so the value is the schedule's total. Change the lines behind the Contract button."],
      ["An approved variation's amount has gone from the Contract Value", "Saving a project that has a Schedule of Values resets the Contract Value to the schedule total, and so does saving the schedule. Add the variation as a line on the Schedule of Values so the total includes it."],
      ["There is no Bill button although hours were logged", "Only approved hours that are not yet invoiced can be billed. Approve them in Timesheets; the Hours button shows how many are still waiting."]
    ],
    tips: [
      "Close a finished project rather than deleting it: it leaves the pickers and the P&amp;L but keeps its history, while Delete removes its tasks, certificates and variations too.",
      "Build the Schedule of Values before the first progress certificate. The first certificate starts its claim breakdown from those lines.",
      "Put a cost code on each cost budget line if you use cost codes, so Job Cost can set budget against spend code by code."
    ]
  },

  "task.list": {
    title: "Tasks",
    what: "A <b>task</b> is one piece of work inside a project, with the hours you expect it to take and a deadline. This screen lists the tasks of every project in the company, with planned hours set against the hours actually logged, so you can see which pieces of work are running over. The same tasks appear on the project's Execution board.",
    when: [
      "You are planning a project and want to list the work with an estimate for each piece.",
      "You want to see, across all projects, which tasks are past their deadline or have no deadline.",
      "You want people to log time against a specific piece of work rather than just the project."
    ],
    how: [
      "Open <b>Projects &rsaquo; Tasks</b> and click <span class='man-key'>New</span>. For this example, an events team is planning a spring product launch.",
      "Type <i>Book venue and catering</i> in <b>Task name</b>.",
      "Pick the <b>Project</b>, <i>Spring product launch</i>. Only active projects are listed.",
      "Enter 12 in <b>Planned hours</b> and set the <b>Deadline</b> to 15 March.",
      "In the <b>Description</b> tab, write what finished looks like: <i>Venue for 200 guests confirmed in writing, menu signed off</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the task in the list with Planned h 12 and Logged h 0.00.",
      "When someone logs 4.5 hours against this task in Timesheets, the list shows Logged h 4.50.",
      "To change the estimate, click the <b>Planned h</b> cell in the list and change it in place.",
      "After 15 March, <span class='man-key'>Filters</span> &rsaquo; <b>Overdue</b> lists the task. The filter looks at the deadline only."
    ],
    fields: [
      ["Task name", "What the work is, as it shows in the list, on the Execution board and in the Log time dialog.", "required"],
      ["Project", "The project the task belongs to. Only active projects are listed, and the first one is preselected.", "required"],
      ["Planned hours", "Your estimate of the hours needed. The list sets it against Logged h.", "optional"],
      ["Deadline", "When the task is due. The Overdue filter uses it.", "optional"],
      ["Description", "What needs to be done, in as much detail as helps.", "optional"],
      ["Logged h (list column)", "The total of every timesheet line recorded against the task.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank task form."],
      ["Save", "Saves the task and returns to the list."],
      ["Discard", "Goes back to the list without saving."],
      ["Filters", "Overdue (deadline before today) or No deadline."],
      ["Group By", "Groups the list by project."],
      ["Kanban board", "Shows the tasks as cards in the Execution stages Backlog, To do, In progress, Review and Done. Dragging a card to another column changes its stage."],
      ["Select", "Tick rows, then <span class='man-key'>Export selected</span> or <span class='man-key'>Delete</span>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "A task posts nothing to the accounts. It becomes selectable in the Log time dialog for its project, appears in the project form's Tasks tab, and shows on the project's Execution board in the Backlog column until someone moves it. Hours logged against it add to Logged h; they are not counted in Job Cost.",
    links: [
      { name: "Projects", how: "Every task belongs to a project.", to: "proj.list" },
      { name: "Execution", how: "The same tasks as a team board, with assignees, priorities, sprints and comments.", to: "proj.board" },
      { name: "Timesheets", how: "Hours logged against a task add up in its Logged h.", to: "ts.list" },
      { name: "My Work", how: "Lists a person's tasks once they are assigned on the Execution board. This form has no assignee.", to: "proj.mywork" }
    ],
    mistakes: [
      ["Name required", "The Task name is empty. Type it, then Save."],
      ["Pick a project", "No project is selected, usually because the company has no active project. Create a project, or set a closed one back to Active."],
      ["The task is not on anyone's My Work", "My Work lists tasks with an assignee saved on the Execution board. Open the task from Execution, choose the Assignee and Save."],
      ["Finished tasks still show here", "The Tasks list shows every task, finished or not. Completion is recorded on the Execution board or in Field."]
    ],
    tips: [
      "Deleting a task keeps the hours logged against it: they stay on the project with no task.",
      "The gap between Planned h and Logged h is the quickest overrun check you have, so keep the estimates honest."
    ]
  },

  "proj.board": {
    title: "Execution",
    what: "<b>Execution</b> is the team's working board for one project: who is doing what, which stage it is at, and what is waiting on something else. It works on the project's tasks and adds assignees, priority, effort points, sprints, checklists, subtasks, comments with @mentions, watchers and an activity history. It is kept separate from the Programme, which is the dated timeline you show a client.",
    when: [
      "You run a team's day-to-day work on a project and want to assign tasks and move them through stages.",
      "You plan in short timeboxes (sprints) and want to see progress in effort points.",
      "You need to know which tasks are waiting on others, and where the bottlenecks are.",
      "Someone mentioned you in a comment or assigned you a task, and the notification brought you here."
    ],
    how: [
      "Open <b>Projects &rsaquo; Execution</b> and pick the project in the <b>Pick a project</b> box. For this example, an IT services firm is running <i>Office network upgrade</i>.",
      "Click <span class='man-key'>List</span>, type <i>Survey existing cabling</i> in <b>+ Add a task and press Enter</b>, and press Enter. The task appears with a circle you can tick.",
      "Click the <b>+</b> at the end of that row, type <i>Photograph each floor riser</i> and click <span class='man-key'>Add</span>. It appears indented under the survey, and the survey row shows 0/1.",
      "Click the survey's name to open the task panel. Set <b>Assignee</b> to the engineer, <b>Priority</b> to High, <b>Points</b> to 3 and <b>Due</b> to Friday, then click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and the engineer is notified that they were assigned a task.",
      "Click <span class='man-key'>Board</span>. The survey card sits in the <b>To do</b> column showing High, 3 points and its due date.",
      "Focus the card and press the right arrow key, or drag it to <b>In progress</b>. With the arrow key you should see <i>Moved to In progress</i>, and the column counts change.",
      "Click <span class='man-key'>Sprints</span>, then <span class='man-key'>+ New sprint</span>. Name it <i>Sprint 1</i>, give it a start and end date, and click <span class='man-key'>Save</span>. Open the survey task, set <b>Sprint</b> to Sprint 1 and Save.",
      "Back on Sprints, click <span class='man-key'>Start sprint</span>. The sprint card now shows Active, 1 tasks, 0 / 3 pts and the days left.",
      "Add a task <i>Install new switches</i>, open it and set <b>Blocked by</b> to <i>Survey existing cabling</i>, then Save. In <span class='man-key'>Dependencies</span> you should see the survey under <i>Do first</i> and the switches under <i>Step 2</i>, marked as waiting on the survey.",
      "When the survey is finished, tick its circle in List or on its card. It moves to Done and the switches are no longer shown as blocked."
    ],
    fields: [
      ["Task name", "The name at the top of the panel.", "required"],
      ["Description", "What needs doing, acceptance criteria and links.", "optional"],
      ["Attachments", "Photos or PDFs for the task. On a new task they upload when you first save it.", "optional"],
      ["Status", "Backlog, To do, In progress, Review or Done: the board column. Setting Done records when the task was completed.", "optional"],
      ["Assignee", "Who is doing it, from the company's employees. <i>+ Add a person...</i> adds a name to the employee list on the spot. The person chosen is notified.", "optional"],
      ["Priority", "Low, Medium, High or Urgent. New tasks start at Medium.", "optional"],
      ["Points", "An effort estimate. Column headers and sprints add the points up.", "optional"],
      ["Sprint", "The sprint the task belongs to, or Backlog (no sprint).", "optional"],
      ["Start and Due", "The dates the task runs between. A past due date is flagged as overdue until the task is Done.", "optional"],
      ["Blocked by", "Another task on this project's board that must finish first. The Dependencies view is built from it.", "optional"],
      ["Labels", "Tags from Task Labels. Click a label to switch it on or off, or <i>+ Add</i> to create a new one.", "optional"],
      ["Checklist and Subtasks", "Shown once the task is saved. Type an item or a subtask name and press Enter; tick checklist items as they are done.", "optional"],
      ["Watchers", "People who follow the task. Pick them from <i>+ Add watcher</i>; the cross removes one.", "optional"],
      ["Comments", "Write a comment, click an @name chip to mention someone (they are notified), add files with Attach, then click Comment.", "optional"],
      ["Sprint Name, Goal, Start, End, Status (sprint dialog)", "Name the timebox (left blank it saves as Sprint), say what it should deliver, give its dates, and set Planned, Active or Done.", "optional"],
      ["Name (Add sub-activity dialog)", "The name of a subtask added under a row with the + button. Left empty, the dialog closes without adding anything.", "required"]
    ],
    buttons: [
      ["Pick a project", "Chooses whose board you are on. Nothing shows until a project is picked."],
      ["List", "An outline of every task and subtask. Tick a circle to complete a task, + to add a subtask, the arrow to fold a branch."],
      ["Board", "A column per stage. Drag cards, or focus a card and use the left and right arrow keys or its small arrow buttons to move it one column."],
      ["Sprints", "One card per sprint with progress by points. <span class='man-key'>Open board</span> filters the board to that sprint, <span class='man-key'>Start sprint</span> and <span class='man-key'>Complete</span> change its status, <span class='man-key'>Edit</span> opens it."],
      ["Dependencies", "Lays out the tasks that block or are blocked, left to right in the order the work must happen, counts what is blocked now, and marks a task blocking two or more others as a bottleneck."],
      ["All members", "Board view only. Filters the cards to one person, or to Unassigned."],
      ["+ Task", "Opens a blank task panel for the chosen project."],
      ["+ Add task (under a column)", "Type a name and press Enter to create a task straight into that column, in the sprint and for the person you are filtered to."],
      ["Sprint chips", "Board view, once sprints exist: All, Backlog (tasks in no sprint) or one sprint."],
      ["Save (panel)", "Saves the task. A new task stays open afterwards so you can add its checklist and comments."],
      ["Delete (panel)", "Deletes the task after a confirmation. Its checklist and comments go with it; its subtasks are kept as tasks of their own."],
      ["Close (the cross)", "Closes the panel without saving. Esc or a click outside the panel does the same."]
    ],
    after: "Nothing on this screen posts to the accounts. Every change is saved on the project's tasks, so Tasks, the project's Tasks tab and each person's My Work show the same work. Creating a task, moving it, assigning it, changing its priority, adding a subtask and completing it are written to the task's Activity feed. Assigning someone or mentioning them in a comment sends them a notification.",
    links: [
      { name: "My Work", how: "Each person's open tasks from every board, grouped by stage.", to: "proj.mywork" },
      { name: "Tasks", how: "The same tasks as a plain list with planned and logged hours.", to: "task.list" },
      { name: "Task Labels", how: "The labels offered in the task panel.", to: "proj.labels" },
      { name: "Programme", how: "The client-facing dated timeline of the project, kept separately from this board.", to: "proj.schedule" },
      { name: "Projects", how: "The project form's Execution board button opens this screen on that project.", to: "proj.list" }
    ],
    mistakes: [
      ["Pick a project first", "You clicked + Task before choosing a project. Pick one in the box at the top."],
      ["Task name required", "The panel's name box is empty. Type a name and Save."],
      ["Save this task first to add a checklist, subtasks, comments and watchers.", "Not an error: a new task needs saving once before those sections open."],
      ["Move failed: (reason)", "The stage change was not saved, and the board reloads to show where the task really is. Check your connection and your access to Projects, then try again."],
      ["The member filter is missing", "It only shows in the Board view."],
      ["A task is missing from the Blocked by list", "Blocked by lists tasks created or saved on this board. A task added in the Tasks screen appears once you open it here and Save."]
    ],
    tips: [
      "Keep the board for doing the work and the Programme for the dates you promise the client. They are separate on purpose.",
      "Filter the board to Unassigned before a team meeting to find work nobody owns.",
      "The Delete confirmation mentions subtasks, but subtasks are kept: move or delete them yourself."
    ]
  },

  "proj.mywork": {
    title: "My Work",
    what: "My Work lists every open task assigned to one person across all projects, grouped by stage, with its project, priority and due date. It opens on your own tasks when your employee record is linked to your login or work email, so it is your personal to-do list; a manager can pick anyone else to see their load.",
    when: [
      "At the start of the day, to see what is on your plate across every project.",
      "As a manager, to check whether one person is overloaded before assigning more.",
      "After being assigned a task, to find it quickly and update it."
    ],
    how: [
      "Open <b>Projects &rsaquo; My Work</b>. You should see your name already chosen in the picker at the top.",
      "Read the summary line, for example <i>7 open &middot; 12 done</i>.",
      "Work down the groups: To do, In progress, Review, then Backlog. Each row shows the task, its project, the priority and the due date; an overdue date is flagged.",
      "Click <i>Replace floor 2 switch</i> to open its task panel without leaving My Work.",
      "Set <b>Status</b> to In progress and click <span class='man-key'>Save</span>. The panel closes and the task moves into the In progress group.",
      "When it is finished, open it again, set Status to Done and Save. It leaves the list and the done count goes up by one.",
      "To check a colleague's load, pick their name in the picker."
    ],
    fields: [
      ["Team member", "Whose tasks to show. It starts on your own employee record; if none matches you, on the person last filtered on the Execution board, or the first employee.", "auto"],
      ["Task panel", "Clicking a row opens the same panel as Execution: Status, Assignee, Priority, Points, Sprint, Start, Due, Blocked by, Labels, checklist, subtasks, watchers and comments.", "optional"]
    ],
    buttons: [
      ["Pick a team member", "Shows that person's open tasks."],
      ["A task row", "Opens the task panel. Closing the panel refreshes My Work."],
      ["Save (panel)", "Saves the changes to the task."],
      ["Delete (panel)", "Deletes the task after a confirmation."]
    ],
    after: "My Work only reads. Anything you change in the panel is the same change as on the Execution board, and shows there and in Tasks straight away.",
    links: [
      { name: "Execution", how: "Where tasks are assigned and moved; My Work shows the result for one person.", to: "proj.board" },
      { name: "Tasks", how: "Every task in every project, assigned or not.", to: "task.list" },
      { name: "Timesheets", how: "Log the hours you spent on these tasks.", to: "ts.list" },
      { name: "Employees", how: "The picker lists the company's employees; linking one to a login makes My Work open on that person.", to: "hr.emp" }
    ],
    mistakes: [
      ["Nothing assigned", "This person has no tasks saved with them as Assignee on an Execution board. Assign work from a board's task panel."],
      ["Pick a team member", "The company has no employees yet. Add people in Employees, or use + Add a person in a task's Assignee list."],
      ["It opens on someone else", "Your login is not linked to an employee record and your work email does not match one. Pick your name, and ask HR to link your record."],
      ["All assigned work is done.", "Not an error: every task assigned to this person is Done."]
    ],
    tips: [
      "Tasks created in the Tasks screen have no assignee, so they only reach My Work after someone assigns them on the board."
    ]
  },

  "proj.schedule": {
    title: "Programme",
    what: "The <b>Programme</b> is the dated timeline of a project, drawn as a Gantt chart: each activity is a bar from its start to its end date, with month markers and a line for today. Link activities with <b>Depends on</b> and Orbit works out the critical path, the chain with no spare days, and draws it in red. It is the schedule you take to a client or a site meeting; the Execution board is where the team does the work.",
    when: [
      "At the start of a job, to lay out the activities and the order they must happen in.",
      "Each week, to update progress on each activity.",
      "Before a client or site meeting, to print the current programme.",
      "When something slips, to see whether it moves the finish date."
    ],
    how: [
      "Open <b>Projects &rsaquo; Programme</b> and pick the project, for example <i>Clinic fit-out</i>.",
      "Click <span class='man-key'>+ Activity</span>. Type <i>Strip out</i> in <b>Activity</b> and <i>1.1</i> in <b>WBS / code</b>, set <b>Start</b> to 2 March and <b>End</b> to 6 March, and click <span class='man-key'>Save</span>. You should see a bar across that week.",
      "Add <i>First fix electrics</i>, WBS 1.2, from 9 to 20 March, with <b>Depends on</b> set to Strip out.",
      "Add <i>Partitions</i>, WBS 1.3, from 9 to 13 March, also depending on Strip out.",
      "Add <i>Handover</i> with Start and End both 23 March, <b>Milestone?</b> set to Yes and Depends on First fix electrics. A milestone is drawn as a single marker instead of a bar.",
      "Read the note under the chart: <i>3 activities on the critical path</i>. Strip out, First fix electrics and Handover are red; Partitions is not, because it has spare days.",
      "Hover over the Partitions bar. The tooltip reads <i>Partitions (0%, float 7d)</i>: it can slip seven days without moving handover.",
      "Each Friday, click an activity and update <b>Progress (%)</b>. The bar fills to that percentage.",
      "Click <span class='man-key'>Print</span> for a copy to take to the site meeting."
    ],
    fields: [
      ["Pick a project", "The project whose programme you are working on.", "required"],
      ["Activity", "The name of the activity. Left blank it is saved as Activity.", "optional"],
      ["WBS / code", "Your breakdown reference, for example 2.1. It shows before the name.", "optional"],
      ["Progress (%)", "How far through the activity is, 0 to 100. It fills the bar.", "optional"],
      ["Start and End", "The activity's dates. It needs both to draw a bar and to count in the critical path.", "optional"],
      ["Depends on", "The one activity that must finish before this one can start. Chains of these produce the critical path.", "optional"],
      ["Milestone?", "Yes draws a marker for a key date, such as handover, instead of a bar.", "optional"],
      ["Critical path and float", "Worked out from the dates and dependencies. Red activities have no float; the tooltip shows each activity's float in days.", "auto"]
    ],
    buttons: [
      ["+ Activity", "Opens a blank activity. You must pick a project first."],
      ["+ Add activity", "Shown on a project with no activities yet; does the same as + Activity."],
      ["Print", "Prints the chart."],
      ["An activity row", "Opens that activity to edit."],
      ["Save", "Saves the activity and redraws the chart."],
      ["Delete", "Removes the activity straight away, without asking to confirm."],
      ["Cancel", "Closes the dialog without saving."]
    ],
    after: "The programme is stored with the project and changes nothing else in Orbit. It is not linked to the Execution board's tasks, to timesheets or to any cost report. Deleting the project deletes its programme.",
    links: [
      { name: "Execution", how: "The team's working board for the same project, kept separately from the programme.", to: "proj.board" },
      { name: "Projects", how: "The project's own Start date and Deadline are set on the project form.", to: "proj.list" },
      { name: "Site Diary", how: "Record the delays that explain why an activity slipped.", to: "site.diary" }
    ],
    mistakes: [
      ["Pick a project first", "You clicked + Activity before choosing a project. Pick one in the box at the top."],
      ["An activity has no bar", "It is missing a Start or an End date. Open it and fill both."],
      ["No critical path note under the chart", "The note needs at least one activity with a start date. Add the dates."],
      ["Every activity is red", "When each activity depends on the one before it, none has spare days. That is correct: any slip moves the finish date."]
    ],
    tips: [
      "An activity can depend on only one other. For an activity waiting on two, depend on the one that finishes later.",
      "Delete in the activity dialog does not ask first, so check the name before you click it."
    ]
  },

  "ts.list": {
    title: "Timesheets",
    what: "A <b>timesheet line</b> records the hours someone worked, on which day, for which project and, if you like, which task. The list shows every line with its status. New lines start <b>Awaiting approval</b>, and only approved hours can be billed to the customer from the project, so this is also where a manager signs hours off.",
    when: [
      "You worked on a project and want to record the hours.",
      "You manage a team and approve their hours each week.",
      "You want to see which approved hours are ready to invoice, or which have been invoiced.",
      "At month end, to total hours by project or by month."
    ],
    how: [
      "Open <b>Projects &rsaquo; Timesheets</b> and click <span class='man-key'>New</span>. The Log time dialog opens with today's date and 1 hour.",
      "Set <b>Hours</b> to 3.5, pick the <b>Project</b> <i>Retailer website rebuild</i> and the <b>Task (optional)</b> <i>Checkout page build</i>.",
      "Type <i>Payment form and validation</i> in <b>Description</b> and click <span class='man-key'>Log</span>. You should see <i>Time logged</i> and a new line marked Awaiting approval.",
      "As the manager, click <span class='man-key'>Filters</span> &rsaquo; <b>Awaiting approval</b> to see everything outstanding.",
      "Click the line. Check the date, project, task and 3.50 hours, then click <span class='man-key'>Approve these hours</span>. You should see <i>Hours approved</i> and the status change to Approved.",
      "Switch the filter to <b>To invoice</b>. Approved lines that have not been billed are listed there.",
      "Open the project in Projects and click <span class='man-key'>Bill 3.5h</span> to create the draft invoice. The line now appears under the <b>Invoiced</b> filter.",
      "At month end, use <span class='man-key'>Group By</span> &rsaquo; <b>Month</b> to see the hours per month."
    ],
    fields: [
      ["Date", "The day the work was done. It starts on today.", "required"],
      ["Hours", "How many hours were worked, in quarters if you like (0.25 steps).", "required"],
      ["Project", "The project the time is charged to. Only active projects are listed.", "required"],
      ["Task (optional)", "A task in that project. The list changes when you change the project.", "optional"],
      ["Description", "A short note on what was done. It shows in the list and on the approval dialog.", "optional"],
      ["Who logged it", "Orbit records your login and, when your login is linked to an employee record, that employee.", "auto"],
      ["Status", "Awaiting approval, then Approved. A line put on an invoice also counts as Invoiced.", "auto"]
    ],
    buttons: [
      ["New", "Opens the Log time dialog."],
      ["Log", "Saves the hours as a new line awaiting approval."],
      ["Cancel", "Closes the dialog without saving."],
      ["A line in the list", "Opens it in a dialog showing the date, project, task, hours and note."],
      ["Approve these hours", "Marks the line approved, with your email and the time. If an approval rule for timesheets applies, it sends the request to the approver instead."],
      ["Withdraw approval", "Shown on an approved line not yet invoiced. Takes it back to Awaiting approval."],
      ["Close", "The only button on an invoiced line, which can no longer be changed."],
      ["Filters", "Awaiting approval, To invoice (approved but not billed) or Invoiced."],
      ["Group By", "Project, Month or Status."],
      ["Select and Export", "Tick rows to export them, or export the whole list, as a CSV file."]
    ],
    after: "Logging and approving hours post nothing to the accounts, and hours are not counted in Job Cost, Project P&amp;L or the WIP Schedule. Hours add to the task's Logged h and to the Hours button on the project. Approved hours that are not invoiced make the project's <b>Bill</b> button appear; billing creates a draft customer invoice and marks those lines invoiced, after which they cannot be changed here.",
    links: [
      { name: "Projects", how: "The Bill button on a project turns its approved, uninvoiced hours into a draft invoice.", to: "proj.list" },
      { name: "Tasks", how: "Hours logged against a task add to its Logged h.", to: "task.list" },
      { name: "Approval Rules", how: "A rule for timesheets makes approval wait for the named approver. The rule's threshold is compared with the hours on the line.", to: "approvals.rules" },
      { name: "Approvals", how: "Where the approver sees and decides a timesheet request.", to: "approvals.inbox" },
      { name: "Field (phone)", how: "Hours logged with the clock or Log hours on a phone arrive here awaiting approval.", to: "site.field" }
    ],
    mistakes: [
      ["Enter the hours worked", "Hours is zero or empty. Enter the hours, then Log."],
      ["Create a project first", "There is no active project to log time against. Create a project, or set a closed one back to Active."],
      ["Sent for approval (amount)", "An approval rule for timesheets covers this many hours. The line stays Awaiting approval until the approver decides in Approvals; once approved, open the line and click Approve these hours again."],
      ["Already awaiting approval", "A request for this line is already with the approver. Wait for the decision."],
      ["Already invoiced, so it can no longer be changed.", "Not an error: these hours are on an invoice."],
      ["A line shows no person", "Hours logged from Field (phone) are saved with the project, date and note but not who logged them."]
    ],
    tips: [
      "A line cannot be edited or deleted from this screen, so check the date and hours before clicking Log.",
      "Approve weekly: unapproved hours cannot be billed, and the project's Hours button shows how many are waiting."
    ]
  },

  "proj.labels": {
    title: "Task Labels",
    what: "Task Labels is the company's list of coloured tags people can put on a task in the Execution board, such as <i>Client waiting</i>, <i>Urgent fix</i> or <i>Fabrication</i>. Defining them here means everyone picks from the same set instead of inventing their own spelling.",
    when: [
      "Before a team starts using the Execution board, to set up the tags you want.",
      "When a new kind of work needs its own tag, or an old tag is no longer used."
    ],
    how: [
      "Open <b>Projects &rsaquo; Configuration &rsaquo; Task Labels</b>.",
      "Type <i>Client waiting</i> in the first <b>Label</b> box.",
      "Click the <b>Colour</b> swatch beside it and choose an orange.",
      "Click <span class='man-key'>+ Add a label</span> and type <i>Urgent fix</i>. It gets the next colour in the set; change it if you like.",
      "Add a third label, <i>Needs design</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Labels saved</i>.",
      "Open a task on the Execution board. Under <b>Labels</b> you should see the three labels; click <i>Client waiting</i> to switch it on, then Save the task. The card now shows the label."
    ],
    fields: [
      ["Label", "The tag's name as people will see it. A row left blank is ignored when you save.", "required"],
      ["Colour", "The colour of the tag when it is switched on in the task panel.", "optional"]
    ],
    buttons: [
      ["+ Add a label", "Adds a row with the next colour in the set."],
      ["The cross on a row", "Removes that row from the list on screen. It is gone once you Save."],
      ["Save", "Replaces the company's saved labels with the rows on screen, in that order."]
    ],
    after: "The labels appear in the Labels section of every task panel on the Execution board and in My Work. A task keeps the names of the labels put on it, so removing or renaming a label here does not change tasks that already carry it. Labels created with <i>+ Add</i> in a task panel are added to this list too.",
    links: [
      { name: "Execution", how: "Where labels are put on tasks, in the task panel.", to: "proj.board" }
    ],
    mistakes: [
      ["Save failed: (reason)", "The labels could not be written. Check your connection and that you can manage Projects, then Save again."],
      ["A removed label still shows on some tasks", "Tasks keep the label names they were given. Open each task, click the label to switch it off, and Save."],
      ["Changes are lost on leaving the page", "Nothing is stored until you click Save."]
    ],
    tips: [
      "Keep the list short. Five or six labels that everyone understands work better than twenty."
    ]
  },

  "site.field": {
    title: "Field (phone)",
    what: "Field is a phone-sized screen for people on site. It keeps a work clock, lists the unfinished tasks on the chosen project, and has three large buttons: report a problem with a photo, write the site diary, and log hours. What you enter is kept on the phone when there is no signal and sent by itself when the connection comes back.",
    when: [
      "You arrive on site and want to start the clock on a task.",
      "You find a defect and want to report it with a photo there and then.",
      "At the end of the day, to write the site diary.",
      "You forgot to clock in and want to log the hours afterwards."
    ],
    how: [
      "On your phone, open <b>Contracting &rsaquo; Field (phone)</b>. If more than one project is active, pick today's in the box at the top. For this example, a kitchen installer is fitting units in a block of flats.",
      "Under <b>Today's work</b>, find <i>Fit kitchen units, flat 4</i> and tap <span class='man-key'>work on this</span>. You should see <i>On the clock</i> with a running timer and the task's name.",
      "At lunch, tap <span class='man-key'>Stop and log</span>. You should see, for example, <i>3.5 hours logged</i>.",
      "You spot a cracked worktop. Tap <span class='man-key'>Report a problem</span>, take a <b>Photo</b>, type <i>Worktop cracked at sink cut-out</i> in <b>What is wrong</b>, leave <b>How bad</b> on Needs fixing, type <i>Flat 4 kitchen</i> in <b>Where</b>, and tap <span class='man-key'>Save</span>. You should see <i>Problem reported</i> and the problem under <b>Open problems</b>.",
      "When the units are in, tap the tick beside the task. You should see <i>Marked done</i> and the task leaves the list.",
      "Before leaving, tap <span class='man-key'>Site diary</span>. Fill in the <b>Weather</b>, 3 in <b>Men on site</b>, what was fitted in <b>Work done</b> and the worktop in <b>Delays or problems</b>, then tap <span class='man-key'>Save</span>. You should see <i>Diary saved</i>.",
      "If you forgot to clock in one morning, tap <span class='man-key'>Log hours</span>, enter 2 in <b>Hours</b> and <i>Measuring and set-out</i> in <b>What was done</b>, and tap Save. You should see <i>2 hours logged</i>."
    ],
    fields: [
      ["Project (box at the top)", "Shown when more than one project is active; otherwise the only project's name shows. Everything you log from Field goes to this project.", "auto"],
      ["Photo (Report a problem)", "Opens the phone's camera. With a connection the photo uploads with the problem; with no signal the problem is saved without it.", "optional"],
      ["What is wrong", "The defect in plain words.", "required"],
      ["How bad", "Minor, Needs fixing, Serious or Stop work. These become the snag's Low, Medium, High or Critical severity.", "optional"],
      ["Where", "Grid, level or elevation, so someone else can find it.", "optional"],
      ["Date, Weather, Men on site, Subcontractors, Work done, Delays or problems (Site diary)", "The day's record. The date starts on today.", "optional"],
      ["Date (Log hours)", "The day the hours were worked. It starts on today.", "optional"],
      ["Hours (Log hours)", "How many hours were worked.", "required"],
      ["What was done (Log hours)", "The note on the timesheet line. Left blank it reads Site work.", "optional"]
    ],
    buttons: [
      ["Start work", "Starts the clock without a task."],
      ["work on this", "Starts the clock on that task."],
      ["Stop and log", "Stops the clock and logs the elapsed hours as a timesheet line for the project and task."],
      ["Report a problem", "Opens the problem dialog."],
      ["Site diary", "Opens the short diary dialog."],
      ["Log hours", "Opens a dialog to log hours without the clock."],
      ["The tick beside a task", "Records the task as completed, so it leaves Today's work."],
      ["Save and Cancel", "Save stores what is in the dialog; Cancel closes it without saving."]
    ],
    after: "Stop and log and Log hours add a line to <b>Timesheets</b> for the project (and the task, when you clocked in on one), awaiting approval, with the task's name or your note as its description. Report a problem adds an open snag to <b>Snags</b> on the project, numbered SNG- and six digits. Site diary adds an entry to <b>Site Diary</b>. The tick records the task's completion; its column on the Execution board does not change. Nothing here posts to the accounts.",
    links: [
      { name: "Timesheets", how: "Hours from the clock and Log hours land here awaiting approval.", to: "ts.list" },
      { name: "Snags", how: "Problems reported from Field become snags you can assign and track.", to: "site.snags" },
      { name: "Site Diary", how: "Diary entries from Field appear in the full diary, where you can add the rest of the detail.", to: "site.diary" },
      { name: "Tasks", how: "Today's work lists the project's tasks that are not completed.", to: "task.list" }
    ],
    mistakes: [
      ["Say what is wrong", "What is wrong is empty. Type a few words, then Save."],
      ["How many hours?", "Hours is empty or zero in Log hours."],
      ["Less than a minute, nothing logged", "You stopped the clock about a minute after starting it, so nothing was saved."],
      ["Problem saved. Add the photo again once you have signal.", "You were offline, so the problem was saved without its photo."],
      ["Problem saved; the photo will need re-adding", "The problem was saved but the photo upload failed."],
      ["Nothing assigned on this job. Use the buttons above to log hours or report a problem.", "The project has no unfinished tasks. Logging hours, reporting problems and the diary still work."]
    ],
    tips: [
      "The clock is kept on the phone itself, so closing the app or losing signal does not lose the time, but another device will not see it.",
      "Open problems lists the latest open snags across the company, not only this project.",
      "A Serious or Stop work problem arrives in Snags without the assignee and due date that screen asks for, so open it there and complete it.",
      "Hours logged from Field do not record who logged them, so the approver sees only the project, date and note."
    ]
  },

  "inst.jobs": {
    title: "Install Jobs",
    what: "An <b>install job</b> is a package of installation work on site: a run of kitchen units, a floor of windows, a roof of solar panels. It holds how many units are to be installed and the crew's labour rate, and each day's log adds the quantity fitted and the labour hours, so you see progress against plan and what the labour has cost. Labour logged on a job tied to a project is costed to that project.",
    when: [
      "You are planning a crew's installation work on a project.",
      "At the end of each day, to record what was installed and the hours worked.",
      "You want to see how far an installation has got, or what its labour has cost."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Site &rsaquo; Install Jobs</b> and click <span class='man-key'>New</span>. For this example, a solar installer is fitting 40 panels on a warehouse roof.",
      "Type <i>Roof array, block A</i> as the job name at the top, pick the <b>Project / site</b>, and type <i>South roof</i> in <b>Area / elevation</b>.",
      "Enter the <b>Foreman</b>, 3 in <b>Crew size</b>, 40 in <b>Planned qty</b>, <i>panel</i> in <b>Unit</b>, 25.00 in <b>Labour rate / hr</b>, and a <b>Due date</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, a number such as <i>INS/2026/0001</i>, and the stage bar on Draft.",
      "On the first day, click <span class='man-key'>Start</span>. You should see <i>Started</i> and the stage move to In progress.",
      "At the end of the day, click <span class='man-key'>Log installation</span>. Enter 14 in <b>Installed qty</b> and 24 in <b>Labour hours</b> (three people for eight hours), leave <b>Rate/hr</b> at 25.00, and click <span class='man-key'>Log &amp; cost</span>.",
      "You should see <i>Logged - (currency) 600.00 labour costed to the project</i>, the buttons at the top reading 14 / 40, 35% and 600.00, and a row in the <b>Daily logs</b> tab.",
      "Log each day the same way. When the last panel is fitted, click <span class='man-key'>Mark done</span>. The form becomes read-only."
    ],
    fields: [
      ["Job name", "The name at the top, for example Roof array, block A. Left blank it is saved as Installation.", "optional"],
      ["Project / site", "The project the work is for. Labour logged on the job is costed to it. Only active projects are listed.", "optional"],
      ["Area / elevation", "Which part of the site, for example North elevation L3-L8.", "optional"],
      ["Foreman", "The crew leader.", "optional"],
      ["Crew size", "The number of installers.", "optional"],
      ["Planned qty", "How many units the job should install. Progress is installed against this.", "optional"],
      ["Unit", "What is counted, for example panel or m2.", "optional"],
      ["Labour rate / hr", "The cost of one labour hour. Each log uses it unless you change the rate there.", "optional"],
      ["Due date", "When the installation should be finished.", "optional"],
      ["Number", "Given on the first save, for example INS/2026/0001.", "auto"],
      ["Installed / planned, Progress, Labour cost", "The running totals from the daily logs.", "auto"],
      ["Date (Log installation)", "The day the work was done. It starts on today.", "optional"],
      ["Installed qty (Log installation)", "Units installed that day. Either this or Labour hours must be above zero.", "optional"],
      ["Labour hours (Log installation)", "Total crew hours that day, costed at the rate.", "optional"],
      ["Rate/hr (Log installation)", "Starts at the job's rate; change it for this day if needed.", "optional"],
      ["Note (Log installation)", "Anything worth recording about the day.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank install job."],
      ["Save", "Saves the job. A new job gets its number."],
      ["Discard", "Goes back to the list without saving."],
      ["Start", "Shown on a Draft job. Saves it and moves it to In progress."],
      ["Log installation", "Saves the job, then opens the daily log dialog."],
      ["Log &amp; cost", "Records the day, adds its quantity, hours and cost to the job and, if the job was Draft, moves it to In progress."],
      ["Mark done", "Saves the job and moves it to Done. A done job is read-only and has no Save, Start or Log buttons."],
      ["Delete", "Deletes the job after a confirmation."],
      ["Filters and Group By", "Filter to Open or Done jobs; group by Project or Foreman."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "Each log adds its installed quantity, hours and cost (hours times rate) to the job. When the job has a project and the cost is above zero, Orbit also posts a journal entry in the Miscellaneous (MISC) journal, debiting account 6400 and crediting account 4200, provided those accounts exist in your chart. The job's labour cost counts as actual cost in <b>Job Cost</b> (under Uncoded) and as Labour in <b>Project P&amp;L</b>, where the cost detail lists each job.",
    links: [
      { name: "Job Cost", how: "Install labour on the project's jobs is part of actual cost, under Uncoded.", to: "proj.jobcost" },
      { name: "Project P&amp;L", how: "Install labour is counted as Labour, and the project's cost detail lists each job with its hours and cost.", to: "proj.pnl" },
      { name: "Snags", how: "Defects found while installing are tracked as snags.", to: "site.snags" },
      { name: "Site Diary", how: "The day's overall record of the site, alongside each job's logs.", to: "site.diary" },
      { name: "Projects", how: "A job's labour is costed to the project chosen on it.", to: "proj.list" }
    ],
    mistakes: [
      ["Enter installed qty or hours", "Both are zero in the log dialog. Enter the units installed, the hours, or both."],
      ["Save failed", "Changes to an existing job were not saved. Check your connection and your access, then try again."],
      ["No journal entry for the labour", "The entry is only posted when the job has a project, the cost is above zero, accounts 6400 and 4200 exist, and the company has a MISC journal. The success message shows either way. The labour still counts in Job Cost and Project P&amp;L."],
      ["A finished job needs another log", "There is no way to take a Done job back to In progress from this screen, so only click Mark done when the work is complete."]
    ],
    tips: [
      "Enter crew hours in Labour hours, not hours per person: three people for eight hours is 24.",
      "Set a project on the job before the first log. Logs made without a project are never posted to it."
    ]
  },

  "site.snags": {
    title: "Snags",
    what: "A <b>snag</b> is a defect or unfinished item found on site: a scratched glass panel, a door that will not close, a missing sealant bead. Each one records where it is, how serious it is, the trade, who must fix it and by when, and moves through Open, In progress, Fixed, Verified and Closed. The time a snag is marked Fixed, Verified and Closed is stamped as it happens, and the list flags any snag past its due date.",
    when: [
      "On a walk-round before handover, to record every defect.",
      "A failed inspection item needs fixing.",
      "A client or consultant reports a problem.",
      "At a site meeting, to review what is still open and overdue."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Site &rsaquo; Snags</b> and click <span class='man-key'>New</span>.",
      "Type <i>Glass panel scratched, bay 3</i> in <b>Description</b>.",
      "Pick the <b>Project / site</b> and type <i>North elevation L5</i> in <b>Location</b>. Locations used before are suggested as you type.",
      "Set <b>Severity</b> to High and type <i>Glazing</i> in <b>Trade</b>.",
      "Because the snag is High, choose <b>Assigned to</b> and set a <b>Due date</b> of next Friday; without them Save is refused.",
      "Leave <b>Status</b> on Open, paste a link to a photo in <b>Photo URL</b> if you have one, and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the snag in the list with a number such as <i>SNAG/2026/0012</i>.",
      "When the glazier has replaced the panel, open the snag, set Status to Fixed and Save. The time it was fixed is recorded.",
      "After checking the work, set Verified and Save, then Closed. Verified and Closed snags leave the <b>Open</b> filter and are never flagged overdue.",
      "In the site meeting, switch to the <b>Kanban board</b> view to see the snags in status columns."
    ],
    fields: [
      ["Description", "What the defect is.", "required"],
      ["Project / site", "The project the snag belongs to. Only active projects are listed.", "optional"],
      ["Location", "Where it is, such as North elevation L5. Required when Severity is High or Critical.", "optional"],
      ["Severity", "Low, Medium, High or Critical. A new snag starts at Medium. High and Critical snags need a location, an assignee and a due date.", "optional"],
      ["Trade", "The trade responsible, for example Glazing or Sealant. Earlier entries are suggested.", "optional"],
      ["Assigned to", "The employee who must fix it. Required when Severity is High or Critical.", "optional"],
      ["Due date", "When it must be fixed. After this date an unfinished snag is flagged overdue. Required when Severity is High or Critical.", "optional"],
      ["Status", "Open, In progress, Fixed, Verified or Closed.", "optional"],
      ["Photo URL", "A link to a photo of the defect.", "optional"],
      ["Number", "Given when the snag is first saved, for example SNAG/2026/0012.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank snag."],
      ["Save", "Saves the snag and stamps the time if it has just become Fixed, Verified or Closed."],
      ["Delete", "Shown on an existing snag. Deletes it straight away, without asking to confirm."],
      ["Cancel", "Closes the dialog without saving."],
      ["Filters", "Open (not Verified or Closed), Critical / high, or Overdue."],
      ["Group By", "Project, Severity, Status or Trade."],
      ["Kanban board", "Cards in status columns. Dragging a card to another column changes its status."],
      ["Select", "Tick rows, then <span class='man-key'>Export selected</span> or <span class='man-key'>Delete</span>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "A snag posts nothing to the accounts. While it is Open or In progress it can appear under Open problems in Field (phone). Snags raised from a failed inspection item carry a link to that inspection.",
    links: [
      { name: "Inspections", how: "Saving an inspection with failed items offers to raise a snag for each one.", to: "site.insp" },
      { name: "Field (phone)", how: "Report a problem on a phone creates an open snag, with a photo.", to: "site.field" },
      { name: "Employees", how: "Assigned to lists the company's employees.", to: "hr.emp" },
      { name: "Projects", how: "Group by Project to send each job its list.", to: "proj.list" }
    ],
    mistakes: [
      ["Describe the snag", "Description is empty."],
      ["A high snag needs a location, an assignee and a due date.", "Severity is High (or Critical, which gives the same message with critical) and one of those three is missing. Fill them, or lower the severity."],
      ["The person to assign is not listed", "Assigned to lists employees. Add the person in Employees first."],
      ["The fixed or closed time is missing", "Times are stamped only when the status is changed in this dialog and saved. Moving a card on the kanban board changes the status alone."]
    ],
    tips: [
      "Group by Trade and export to send each subcontractor their own snag list.",
      "Delete does not ask first. Closing a snag keeps the record, which is usually what you want."
    ]
  },

  "site.insp": {
    title: "Inspections",
    what: "An <b>inspection</b> is a planned check on site, such as a quality check, a safety walk, a pre-pour check or a handover, run as a checklist in which each item passes, fails or does not apply. Orbit works out the result and a score from the items and, if anything failed, offers to raise a snag for each failure, so a failed check becomes a defect someone has to fix.",
    when: [
      "Before concrete is poured, a ceiling is closed up or an area is handed over.",
      "On a scheduled safety or quality walk.",
      "When a client or consultant asks for a signed record of a check."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Site &rsaquo; Inspections</b> and click <span class='man-key'>New</span>.",
      "Leave <b>Type</b> on Quality and <b>Date</b> on today, pick the <b>Project</b>, and type <i>Level 2 east</i> in <b>Area</b>.",
      "Choose yourself in <b>Inspector</b>.",
      "Under Checklist, choose <i>Facade panel install</i> in <b>Load a checklist template...</b> and click <span class='man-key'>Load</span>. You should see <i>8 item(s) loaded</i> and eight rows set to N/A.",
      "Set seven items to Pass. Set <i>Sealant continuous</i> to Fail and type <i>gap at joint 14</i> in its note.",
      "Leave <b>Result</b> on (pending) so Orbit works it out, type your name in <b>Signed off by</b> and leave Status on Open.",
      "Click <span class='man-key'>Save</span>. You should be asked <i>Raise 1 snag(s) for the failed item(s)?</i>. Click OK; you should see <i>1 snag(s) raised</i> and <i>Saved</i>, and the inspection numbered, for example <i>INSP/2026/0003</i>.",
      "Reopen it: Result now shows Fail. In Snags there is a new open snag reading <i>Sealant continuous - gap at joint 14</i>, located at Level 2 east.",
      "When the joint has been resealed and rechecked, set that item to Pass and Status to Closed, and Save. Answer Cancel if you are asked about snags, so no duplicate is raised."
    ],
    fields: [
      ["Type", "Quality, Safety (QHSE), Pre-pour, Handover or Snag.", "optional"],
      ["Date", "When the inspection took place. It starts on today.", "optional"],
      ["Project", "The project inspected. Only active projects are listed. Snags raised from the inspection go to this project.", "optional"],
      ["Area", "Where the check was done. Snags raised from the inspection use it as their location.", "optional"],
      ["Inspector", "The person who carried out the check, chosen from your team.", "optional"],
      ["Result", "Pass or Fail. Leave it on (pending) and Orbit sets it on save: Fail if any item failed, Pass if items were checked and none failed.", "auto"],
      ["Checklist items", "Each row has the Item, its Result (N/A, Pass or Fail) and a Note. Rows with no item text are dropped when you save.", "optional"],
      ["Score", "The share of checked items (not N/A) that passed, as a percentage, kept with the inspection.", "auto"],
      ["Notes", "Anything else about the inspection.", "optional"],
      ["Status", "Open or Closed.", "optional"],
      ["Signed off by", "Who signed the inspection off. The first time it is filled, the sign-off date is recorded and shown in the box when it is empty.", "optional"],
      ["Number", "Given when the inspection is first saved, for example INSP/2026/0003.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank inspection."],
      ["Load", "Adds the items of the checklist chosen beside it. Shown only when the company has an active checklist."],
      ["+ Add item", "Adds a blank checklist row."],
      ["The cross on an item", "Removes the row."],
      ["Save", "Saves the inspection and its items, then offers to raise snags for any failed items."],
      ["Delete", "Shown on an existing inspection. Deletes it straight away, without asking to confirm."],
      ["Cancel", "Closes the dialog without saving."],
      ["Filters and Group By", "Filter to Open or Safety inspections; group by Project or Type."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "Saving replaces the inspection's checklist items with the rows on screen. If you accept the snag question, Orbit creates one open, medium-severity snag per failed item on the inspection's project, with the item and its note as the description, the Area as the location, and a link back to the inspection. Nothing posts to the accounts.",
    links: [
      { name: "Inspection Checklists", how: "The reusable lists you load into an inspection.", to: "site.inspt" },
      { name: "Snags", how: "Failed items become snags when you accept the question on save.", to: "site.snags" },
      { name: "Incidents", how: "Record an actual safety event there rather than as an inspection.", to: "site.incidents" }
    ],
    mistakes: [
      ["Save failed", "Changes to an existing inspection were not saved. Check your connection and try again."],
      ["Checklist: (reason)", "The inspection was saved but its checklist items were not. Open it, check the rows and save again."],
      ["The same snag was raised twice", "Every save with a failed item asks again, and OK raises new snags each time. Answer Cancel unless the failure is new, and delete the duplicate in Snags."],
      ["There is no template box or Load button", "They appear only when the company has at least one active checklist in Inspection Checklists."]
    ],
    tips: [
      "Keep Result on (pending) unless you need to overrule the checklist; Orbit then sets it from the items every time you save."
    ]
  },

  "site.inspt": {
    title: "Inspection Checklists",
    what: "An <b>inspection checklist</b> is a reusable list of the points to check for one kind of inspection, for example every step of a facade panel install or a pre-pour check. Build it once here and load it into any inspection, so everyone checks the same things.",
    when: [
      "Before your first inspection of a kind, to write down what must be checked.",
      "When a check keeps being missed and needs adding to the standard list."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Site &rsaquo; Inspection Checklists</b> and click <span class='man-key'>New</span>.",
      "Type <i>Pre-pour check</i> in <b>Name</b> and set <b>For type</b> to Pre-pour.",
      "In the first row type <i>Formwork clean and oiled</i>.",
      "Click <span class='man-key'>+ Add item</span> and add <i>Rebar spacing and cover as drawing</i>, then <i>Cast-in items fixed</i> and <i>Engineer's sign-off obtained</i>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the checklist in the list.",
      "Open a new inspection in Inspections, choose <i>Pre-pour check</i> and click Load. You should see <i>4 item(s) loaded</i>."
    ],
    fields: [
      ["Name", "What the checklist is for. Left blank it is saved as Checklist.", "optional"],
      ["For type", "Quality, Safety (QHSE), Pre-pour or Handover. It labels the checklist; every active checklist can be loaded into any inspection.", "optional"],
      ["Check item", "One point to check per row. Rows left blank are dropped when you save.", "optional"],
      ["Active (list column)", "Whether the checklist is offered when loading into an inspection.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank checklist."],
      ["+ Add item", "Adds a row."],
      ["The cross on a row", "Removes the row."],
      ["Save", "Saves the checklist and replaces its items with the rows on screen."],
      ["Delete", "Shown on an existing checklist. Deletes it straight away, without asking to confirm."],
      ["Cancel", "Closes the dialog without saving."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "Loading a checklist into an inspection copies its items at that moment. Changing or deleting the checklist later does not change inspections that already used it.",
    links: [
      { name: "Inspections", how: "Load a checklist into an inspection with the Load button.", to: "site.insp" }
    ],
    mistakes: [
      ["Save failed", "Changes to an existing checklist were not saved. Check your connection and try again."],
      ["The checklist is not offered in an inspection", "Only checklists shown as Active in this list are offered. This screen has no control to change Active."]
    ],
    tips: [
      "Write each item as something that can clearly pass or fail, such as Rebar cover 40 mm, rather than Check rebar."
    ]
  },

  "site.diary": {
    title: "Site Diary",
    what: "The <b>site diary</b> is the daily record of a site: the weather, how many people were there, visitors, the work done, delays, and materials received. Written on the day, it is the record you rely on when a delay, a claim or a dispute comes up months later.",
    when: [
      "At the end of every working day on site.",
      "When something happens that may lead to a claim, such as weather stopping work or a late delivery.",
      "When you need to look back at what happened on a given day."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Site &rsaquo; Site Diary</b> and click <span class='man-key'>New</span>. The date starts on today.",
      "Pick the <b>Project / site</b>, type <i>Clear, windy PM</i> in <b>Weather</b> and <i>31C</i> in <b>Temperature</b>.",
      "Enter 12 in <b>Own manpower</b>, 6 in <b>Subcontractor staff</b>, and <i>Structural consultant</i> in <b>Visitors</b>.",
      "In <b>Work done today</b> write <i>Level 5 slab formwork completed; rebar fixing started on level 5 east.</i>",
      "In <b>Delays / issues</b> write <i>Concrete pump arrived two hours late; pour moved to 11:00.</i>",
      "Type <i>18 t rebar</i> in <b>Materials received</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>; the form stays open with the date as its title.",
      "Back in the list, the entry shows the date, project, weather, a manpower of 12 and the start of the work done."
    ],
    fields: [
      ["Project / site", "The site the entry is for. Only active projects are listed.", "optional"],
      ["Date", "The day the entry describes. It starts on today.", "optional"],
      ["Weather", "For example Clear, Rain PM.", "optional"],
      ["Temperature", "For example 28C.", "optional"],
      ["Own manpower", "The number of your own staff on site. It is the Manpower column in the list.", "optional"],
      ["Subcontractor staff", "The number of subcontractors' people on site.", "optional"],
      ["Visitors", "Who visited, for example the consultant or a client representative.", "optional"],
      ["Work done today", "What was done.", "optional"],
      ["Delays / issues", "Anything that held up work: weather, access, materials, instructions.", "optional"],
      ["Materials received", "Deliveries that arrived.", "optional"],
      ["Notes", "Anything else.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank diary entry."],
      ["Save", "Saves the entry and keeps it open."],
      ["Discard", "Goes back to the list without saving."],
      ["Delete", "Shown on a saved entry to people who can manage the app. Deletes it after a confirmation."],
      ["Group By", "Groups the list by project."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "A diary entry posts nothing to the accounts and does not change any other record. Entries written with Site diary in Field (phone) appear in this list too.",
    links: [
      { name: "Field (phone)", how: "The Site diary button there writes a short entry from a phone.", to: "site.field" },
      { name: "Incidents", how: "A safety event belongs in Incidents as well as in the day's diary.", to: "site.incidents" },
      { name: "Programme", how: "Delays recorded here explain slips on the programme.", to: "proj.schedule" }
    ],
    mistakes: [
      ["Save failed", "Changes to an existing entry were not saved. Check your connection and try again."],
      ["The project is not in the list", "Only active projects are listed. Set the project back to Active if work has restarted."]
    ],
    tips: [
      "Write the diary on the day. A record made at the time carries far more weight than one written later from memory.",
      "Name the cause of a delay and how long it lasted; that is the detail a claim needs."
    ]
  },

  "site.incidents": {
    title: "Incidents",
    what: "An <b>incident</b> is a safety event on site: an injury, first aid, property or environmental damage, a dangerous occurrence, or a near miss where nobody was hurt but could have been. Recording each one, with what happened and the action taken, gives you the record you may be legally required to keep and shows patterns before someone is hurt.",
    when: [
      "Straight after any accident, injury or first-aid treatment on site.",
      "When something nearly caused harm, even if nobody was hurt.",
      "When an incident is being investigated or closed."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Site &rsaquo; Incidents</b> and click <span class='man-key'>New</span>.",
      "Leave <b>Date</b> on today and pick the <b>Project</b>.",
      "Set <b>Type</b> to Near miss and <b>Severity</b> to High: a scaffold board fell from the third lift onto an empty walkway.",
      "Type <i>Level 3 west facade</i> in <b>Location</b>.",
      "In <b>What happened</b> write <i>Loose scaffold board fell about 6 m onto the walkway below. Nobody in the area.</i>",
      "In <b>Action taken</b> write <i>Walkway closed and barricaded; toe boards fitted along the full lift; scaffold inspected before reopening.</i> A High or Critical incident cannot be saved without it.",
      "Choose who reported it in <b>Reported by</b> and set <b>Status</b> to Investigating.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, and the incident under <span class='man-key'>Filters</span> &rsaquo; <b>High / Critical</b>.",
      "When the investigation is complete, open it, set Status to Closed and Save."
    ],
    fields: [
      ["Date", "When it happened. It starts on today.", "optional"],
      ["Project", "The site it happened on. Only active projects are listed.", "required"],
      ["Type", "Near miss, First aid, Injury, Property damage, Environmental or Dangerous occurrence.", "optional"],
      ["Severity", "Low, Medium, High or Critical. High and Critical need the action taken.", "optional"],
      ["Location", "Where it happened, for example Level 3 west facade.", "required"],
      ["What happened", "A factual description.", "required"],
      ["Action taken", "The immediate action taken. Required when Severity is High or Critical.", "optional"],
      ["Reported by", "Who reported it, chosen from your team.", "required"],
      ["Status", "Open, Investigating or Closed.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank incident."],
      ["Save", "Saves the incident."],
      ["Delete", "Shown on an existing incident. Deletes it straight away, without asking to confirm."],
      ["Cancel", "Closes the dialog without saving."],
      ["Filters", "Open (not Closed) or High / Critical."],
      ["Group By", "Type, Severity or Status."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "An incident posts nothing to the accounts and changes no other record. It stays in the list under its type, severity and status for reporting.",
    links: [
      { name: "Site Diary", how: "Mention the incident in the day's diary too, so the daily record is complete.", to: "site.diary" },
      { name: "Inspections", how: "Follow a serious incident with a safety inspection.", to: "site.insp" }
    ],
    mistakes: [
      ["An incident needs a project, location, what happened, and who reported it.", "One of those four is empty. Fill it and Save again."],
      ["A serious incident needs the immediate action taken.", "Severity is High or Critical and Action taken is empty. Record what was done straight away."],
      ["The reporter is not in the list", "Reported by lists the people on your team in Orbit."]
    ],
    tips: [
      "Record near misses as well as injuries. They are the early warning.",
      "Delete does not ask first. For a mistaken entry, correcting it is usually better than deleting the record."
    ]
  },

  "site.plant": {
    title: "Plant &amp; Equipment",
    what: "<b>Plant and equipment</b> are the machines on your sites or in your hire fleet: cranes, hoists, generators, access platforms, vehicles. This register records whether each unit is owned or hired, its day rate, where it is and on which project, its service, registration and insurance dates, and its meter reading. The list flags registrations and insurance about to expire and services that are overdue.",
    when: [
      "A machine arrives on site, whether bought or hired in.",
      "A unit moves to another site, has its meter read, or is rented out and returned.",
      "You want to know which registrations, insurance or services are due.",
      "A unit needs a service and you want to raise a ticket for it."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Plant &amp; Tools &rsaquo; Plant &amp; Equipment</b> and click <span class='man-key'>New</span>.",
      "Type <i>CR-01</i> in <b>Code</b>, <i>Tower crane 8 t</i> in <b>Name</b> and <i>Crane</i> in <b>Category</b>.",
      "Set <b>Ownership</b> to Hired, type the hire company in <b>Supplier (if hired)</b>, and 450.00 in <b>Day rate</b>.",
      "Set <b>Status</b> to On site, pick the <b>On project</b>, type <i>Grid C4</i> in <b>Location</b>, and set <b>On hire from</b> to today.",
      "Under Legal &amp; meter, fill in the <b>Registration no.</b> and <b>Registration expiry</b>, the <b>Insurance no.</b> and <b>Insurance expiry</b>, 1240 in <b>Current meter</b> and Hours in <b>Meter unit</b>. Set <b>Next service</b> to the first of next month.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the crane in the list with On site; an insurance expiry within 30 days shows as, for example, <i>Ins 12d</i>.",
      "A week later, open the crane. Under <b>Movements &amp; readings</b>, choose Meter reading, enter 1262 and click <span class='man-key'>Log</span>. You should see <i>Logged</i> and a Meter row; Current meter becomes 1262.",
      "When the service falls due, click <span class='man-key'>Raise service ticket</span>. A service ticket titled <i>Service: Tower crane 8 t</i> is created and opens."
    ],
    fields: [
      ["Code", "Your fleet number, for example CR-01.", "optional"],
      ["Name", "What the unit is. Left blank it is saved as Equipment.", "optional"],
      ["Category", "For example Crane, Hoist or Access. The list can be grouped by it.", "optional"],
      ["Ownership", "Owned or Hired.", "optional"],
      ["Supplier (if hired)", "The hire company.", "optional"],
      ["Day rate", "The daily rate of the unit.", "optional"],
      ["Status", "Available, On site, Maintenance or Off-hired.", "optional"],
      ["On project", "The active project the unit is working on.", "optional"],
      ["Location", "Where the unit is. A Transfer movement updates it.", "optional"],
      ["Next service", "When the next service is due. Once the date has passed the list shows Service due.", "optional"],
      ["On hire from and Off hire", "The hire period.", "optional"],
      ["Registration no. and Registration expiry", "The unit's registration. The list warns in the 30 days before expiry and shows Reg expired after it.", "optional"],
      ["Insurance no. and Insurance expiry", "The unit's insurance, with the same warnings as registration.", "optional"],
      ["Current meter and Meter unit", "The hours or kilometres reading. A Meter reading movement updates it.", "optional"],
      ["Movement type and details (Movements &amp; readings)", "On a saved unit: Transfer (to location), Meter reading (meter), Rent out (customer, rate/day, days) or Return (customer), with a date that starts on today.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank unit."],
      ["Save", "Saves the unit."],
      ["Log", "Records the movement or reading. A transfer updates Location, a meter reading updates Current meter, Rent out sets the status to On site and records rate times days as rental revenue, Return sets the status to Available."],
      ["Raise service ticket", "Shown on a saved unit. Creates a new service ticket for it and opens the ticket."],
      ["Delete", "Shown on a saved unit. Deletes it straight away, without asking to confirm."],
      ["Cancel", "Closes the dialog without saving."],
      ["Filters", "On site, Hired or Maintenance."],
      ["Group By", "Category, Status or Ownership."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "The register posts nothing to the accounts, and a rental logged here does not create an invoice. Rent out movements add to rental days and revenue in <b>Equipment utilization</b>. Registration and insurance expiries also appear as reminders in the bell. Raise service ticket creates a ticket in the Service app.",
    links: [
      { name: "Equipment utilization", how: "Rental days, rental revenue and the latest meter reading for each unit.", to: "site.plantutil" },
      { name: "Service tickets", how: "Raise service ticket opens a new ticket for the unit there.", to: "svc.tickets" },
      { name: "Tools &amp; Equipment", how: "Hand tools and small kit, tracked by who holds them.", to: "tools.list" }
    ],
    mistakes: [
      ["Run supabase/108-equipment-depth.sql once to enable equipment movements.", "The movements feature has not been set up for your company's database. Ask whoever looks after your Orbit set-up; the rest of the register works meanwhile."],
      ["The project is not in On project", "Only active projects are listed."],
      ["The status did not change after logging a transfer", "Only Rent out and Return change the status. Set it yourself for other moves."]
    ],
    tips: [
      "Log meter readings regularly; the latest one is what Equipment utilization shows.",
      "Delete does not ask first. For a unit that has left the fleet, Off-hired keeps its history."
    ]
  },

  "site.plantutil": {
    title: "Equipment utilization",
    what: "Equipment utilization shows how hard each unit in the Plant &amp; Equipment register is working: how many units there are, how many are deployed now, and for each unit its status, rental days, rental revenue, latest meter reading and last activity. It is read-only and adds up the movements logged on each unit.",
    when: [
      "You rent equipment out and want to see which units earn and which sit idle.",
      "You are deciding whether to buy, sell or off-hire a machine.",
      "You want the latest meter readings across the fleet in one place."
    ],
    how: [
      "In <b>Plant &amp; Equipment</b>, open a generator you rent out, choose Rent out under Movements &amp; readings, pick the customer, enter 120.00 in rate/day and 5 in days, and click <span class='man-key'>Log</span>.",
      "Open <b>Contracting &rsaquo; Plant &amp; Tools &rsaquo; Equipment utilization</b>.",
      "Read the three cards at the top: <b>Units</b>, <b>Currently deployed</b> (units whose status is On site) and <b>Rental revenue logged</b>.",
      "Find the generator in the table. You should see Rental days 5 and Rental revenue 600.00, with its status on_site.",
      "Check <b>Latest meter</b>: the reading logged on the unit, or its Current meter if no reading has been logged.",
      "Use <b>Last activity</b> to spot units with nothing logged for months."
    ],
    fields: [
      ["Units", "The number of units in the register.", "auto"],
      ["Currently deployed", "Units whose status is On site.", "auto"],
      ["Rental revenue logged", "The total of rate times days on every Rent out movement.", "auto"],
      ["Rental days and Rental revenue (per unit)", "The days and amounts of that unit's Rent out movements.", "auto"],
      ["Latest meter", "The meter reading logged on the unit, or its Current meter.", "auto"],
      ["Last activity", "The date of the unit's most recent movement.", "auto"]
    ],
    buttons: [],
    after: "This report only reads the register and its movements. It changes nothing and posts nothing; the revenue shown is what was logged, not what was invoiced.",
    links: [
      { name: "Plant &amp; Equipment", how: "Where units are registered and their rentals, transfers and meter readings are logged.", to: "site.plant" }
    ],
    mistakes: [
      ["No equipment yet.", "The register is empty. Add units in Plant &amp; Equipment."],
      ["A unit shows 0 rental days although it was out", "Only Rent out movements count. Setting the status to On site by hand does not add days."]
    ],
    tips: [
      "Revenue here is not your income in the books. Invoice the customer separately for each rental."
    ]
  },

  "tools.list": {
    title: "Tools &amp; Equipment",
    what: "Tools &amp; Equipment is the register of hand tools, power tools, ladders and small machines: what each one is, its asset code, condition, who holds it and where it lives. Issuing a tool to someone, returning it, moving it or sending it for repair is recorded as history, and a printed QR label lets anyone scan the tool to open its record.",
    when: [
      "You buy or hire a tool and want it on the register.",
      "A tool goes out to a site or a person, comes back, or goes for repair.",
      "You need to find out who has a tool, or which tools need repair or replacement."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Plant &amp; Tools &rsaquo; Tools &amp; Equipment</b> and click <span class='man-key'>New</span>.",
      "Type <i>Hammer drill 30 mm</i> as the name, and add a photo in the slot beside it if you like.",
      "Type <i>TL-0007</i> in <b>Asset code</b>, <i>Power tool</i> in <b>Category</b>, the brand and the serial number.",
      "Leave <b>Condition</b> on Good and <b>Status</b> on Available. Type <i>Main store</i> in <b>Warehouse location</b> and <i>Rack B-3</i> in <b>Shelf / bin</b>.",
      "Enter the <b>Purchase date</b> and 420.00 in <b>Purchase cost</b>, and click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the drill in the list, held by Warehouse.",
      "Open it and click <span class='man-key'>QR label</span>, then <span class='man-key'>Print label</span>, and stick the label on the drill.",
      "When the site foreman takes it, click <span class='man-key'>Issue / Return</span>, leave Action on <i>Issue out</i>, type the foreman's name in <b>Given to</b> and <i>Marina site</i> in <b>Location</b>, and click <span class='man-key'>Record</span>. You should see <i>Recorded</i>, the status Issued out, and a row in History.",
      "When it comes back, choose <i>Return to warehouse</i> and Record. The status returns to Available and Held by clears."
    ],
    fields: [
      ["Name", "What the tool is, for example Hammer drill 30 mm.", "required"],
      ["Photo (beside the name)", "A picture of the tool, shown as its thumbnail.", "optional"],
      ["Asset code", "Your tag number. It is written into the QR label, and no two tools in the company can share one.", "optional"],
      ["Category", "For example Power tool, Hand tool, Ladder, Machine, Safety gear. Earlier entries are suggested.", "optional"],
      ["Brand", "The maker.", "optional"],
      ["Serial number", "The maker's serial, useful for insurance and warranty claims.", "optional"],
      ["Condition", "New, Good, Fair, Poor or Broken. Poor and Broken tools appear under the Needs attention filter.", "optional"],
      ["Status", "Available, Issued out, In repair or Retired.", "optional"],
      ["Held by", "Who has the tool now. Leave it blank when it is in the warehouse.", "optional"],
      ["On project", "The job the tool is being used on.", "optional"],
      ["Supplier", "The vendor it was bought or hired from.", "optional"],
      ["Warehouse location and Shelf / bin", "Where it lives when not in use, down to the rack.", "optional"],
      ["Purchase date and Purchase cost", "When it was bought and what it cost.", "optional"],
      ["Notes", "Anything else.", "optional"],
      ["Action, Given to, Location, Condition now, Note (Issue / Return dialog)", "Issue out (hand to someone; Given to shows only for this), Return to warehouse, Move / relocate, or Send to repair, with where it is going, its condition and a note.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank tool."],
      ["Save", "Saves the tool and returns to the list."],
      ["Discard", "Goes back to the list without saving."],
      ["Issue / Return", "Shown on a saved tool. Opens the issue or return dialog."],
      ["Record", "Updates the tool (status, holder, location, condition, as the action requires) and adds the movement to its History."],
      ["QR label", "Shows the tool's QR code; <span class='man-key'>Print label</span> opens it for printing."],
      ["Filters", "Available, Issued out, In repair, or Needs attention (Poor or Broken)."],
      ["Group By", "Status, Category, Condition or Held by."],
      ["Kanban board", "Cards by Status or by Condition. Dragging a card to another column changes that value."],
      ["Select", "Tick rows, then <span class='man-key'>Export selected</span>, <span class='man-key'>Archive</span> or <span class='man-key'>Delete</span>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "The register posts nothing to the accounts; the purchase cost is for reference. Each Record adds a line to the tool's History with the action, person or location, condition and note. Scanning the QR label with a phone opens Orbit on this tool's record.",
    links: [
      { name: "Plant &amp; Equipment", how: "Larger machines, with day rates, hire periods, registration and meter readings.", to: "site.plant" },
      { name: "Projects", how: "On project shows which job a tool is working on.", to: "proj.list" }
    ],
    mistakes: [
      ["Name is required", "The tool's name is empty."],
      ["Could not save: That already exists - a record with the same code or number is already saved.", "Another tool already has this Asset code. Use a different code."],
      ["Could not record: (reason)", "The issue or return was not saved. Check your connection and try again."],
      ["Allow pop-ups to print the label", "Your browser blocked the print window. Allow pop-ups for Orbit and click Print label again."],
      ["Could not load the QR generator (offline?).", "The QR code needs a connection to draw. Try again when online."],
      ["Scanned code not found: (code)", "No tool, panel or product has that code. Check the label matches the Asset code on the record."]
    ],
    tips: [
      "Always fill Asset code before printing a label; without one the label carries the record's internal id instead.",
      "Set Condition honestly when a tool comes back. The Needs attention filter is your repair list."
    ]
  },

  "doc.drawings": {
    title: "Drawing Register",
    what: "The <b>drawing register</b> lists every drawing on your projects with its current revision and status. Each drawing keeps its history of revisions (Rev A, B, C and so on), and each revision has its own files, status, issue purpose, and the submittal or transmittal it went out under. Site always knows which revision is current, and you can show what was issued and when.",
    when: [
      "A new drawing is produced or received for a project.",
      "A drawing is revised and the new revision needs recording and issuing.",
      "Someone asks which revision is current, or when a revision was issued and under which transmittal.",
      "You open Documents &rsaquo; Document registers, which brings you here."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Documentation &rsaquo; Drawing Register</b> and click <span class='man-key'>New</span>.",
      "Type <i>Curtain wall elevation, north</i> as the title at the top.",
      "Type your sheet number <i>FA-201</i> in <b>Drawing / sheet no.</b> (leave it blank and Orbit numbers it, for example DWG/2026/0001).",
      "Pick the <b>Project</b>, type <i>Facade</i> in <b>Discipline</b>, and leave <b>Status</b> on In progress.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a <b>Revisions &amp; version history</b> section.",
      "Click <span class='man-key'>+ New revision</span>. Revision A is created and its dialog opens.",
      "Set <b>Status</b> to Issued, type <i>For approval</i> in <b>Issue purpose</b>, set the <b>Issued date</b>, choose the <b>Submittal</b> it went out under, and add the PDF under <b>Drawing files (PDF / native)</b>. Click <span class='man-key'>Save revision</span>. You should see <i>Revision saved</i>, Current rev A at the top, and the drawing's status Issued.",
      "When the consultant's comments are addressed, click + New revision again. Revision B opens: set it to Issued, <i>For construction</i>, with its file, and Save revision. Current rev now shows B.",
      "Open Rev A with <b>Open / files</b>, set its Status to Superseded and Save revision, so nobody builds from it."
    ],
    fields: [
      ["Drawing title", "What the drawing shows. Left blank it is saved as Drawing.", "optional"],
      ["Drawing / sheet no.", "Your sheet number. Left blank on a new drawing, Orbit gives the next number, for example DWG/2026/0001.", "auto"],
      ["Project", "The project the drawing belongs to. Only active projects are listed.", "optional"],
      ["Discipline", "The trade or discipline, for example Facade, Structural or MEP.", "optional"],
      ["Status", "In progress, Issued, Superseded or Void: the state of the drawing as a whole.", "optional"],
      ["Current rev", "The latest revision not marked Superseded, updated each time a revision is saved.", "auto"],
      ["Revision", "The revision's letter or number. A new revision takes the next one after the last (B after A, 3 after 2).", "auto"],
      ["Status (revision)", "Draft, Issued, Approved, Rejected or Superseded. A new revision starts as Draft.", "optional"],
      ["Issue purpose", "Why it was issued, for example For approval, For construction or As-built.", "optional"],
      ["Issued date", "When the revision was issued.", "optional"],
      ["Submittal", "The submittal the revision was sent for approval under.", "optional"],
      ["Issued under transmittal", "The transmittal that carried the revision out.", "optional"],
      ["Notes (revision)", "Anything else about the revision.", "optional"],
      ["Drawing files (PDF / native)", "The revision's files. They are kept private to your company.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank drawing."],
      ["Save", "Saves the drawing."],
      ["Discard", "Goes back to the list without saving."],
      ["Delete", "Shown on a saved drawing to people who can manage the app. Deletes the drawing after a confirmation."],
      ["+ New revision", "Creates the next revision straight away, as a Draft, and opens it."],
      ["Open / files", "Opens that revision's dialog with its files."],
      ["The cross on a revision", "Deletes that revision after a confirmation."],
      ["Save revision", "Saves the revision, updates the drawing's Current rev, and sets the drawing to Issued if the revision is Issued."],
      ["Close", "Closes the revision dialog without saving its fields."],
      ["Filters", "In progress, Issued, or Superseded (which also shows Void)."],
      ["Group By", "Project, Discipline or Status."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "The register posts nothing to the accounts. Saving a revision recalculates the drawing's Current rev, and saving one as Issued marks the drawing Issued. A revision linked to a submittal or transmittal records that link on the revision; the submittal and transmittal themselves are not changed.",
    links: [
      { name: "Submittals", how: "A revision sent for approval is linked to its submittal.", to: "doc.subs" },
      { name: "Transmittals", how: "A revision issued to someone is linked to the transmittal that carried it.", to: "doc.trans" },
      { name: "RFIs", how: "Raise an RFI when a drawing is unclear; the answer may lead to the next revision.", to: "doc.rfis" }
    ],
    mistakes: [
      ["Save failed", "Changes to an existing drawing or revision were not saved. Check your connection and try again."],
      ["Save the drawing first, then add revisions (Rev A, B, C ...) with their files here.", "Not an error: a new drawing needs saving once before revisions can be added."],
      ["An unwanted Draft revision appeared", "+ New revision creates the revision as soon as you click it, even if you then close the dialog. Delete it with the cross on its row."],
      ["Current rev still shows the old letter", "Current rev is the latest revision not marked Superseded, recalculated when a revision is saved. Open the new revision and click Save revision."]
    ],
    tips: [
      "Mark a replaced revision Superseded as soon as the new one is issued, so the register never shows two live revisions.",
      "Add the file to every revision, not only the first. Each revision keeps its own files."
    ]
  },

  "doc.subs": {
    title: "Submittals",
    what: "A <b>submittal</b> is a document or sample you send to the consultant or client for approval before you build or buy: a shop drawing, a material approval, a sample, a method statement. Each one moves from Draft to Submitted, then to Approved, Approved w/ comments or Rejected; a new revision replaces an old one, which becomes Superseded. A submittal still waiting past its due date is flagged overdue.",
    when: [
      "You need the consultant's approval for a drawing, material, sample or method before going ahead.",
      "A submittal comes back with a decision to record.",
      "A rejected or commented submittal needs resubmitting as a new revision.",
      "You want to chase every submittal that is overdue."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Documentation &rsaquo; Submittals</b> and click <span class='man-key'>New</span>.",
      "Type <i>Aluminium profile system, thermal break</i> as the title, pick the <b>Project</b>, and set <b>Type</b> to Material approval.",
      "Leave <b>Revision</b> as A and type your document number <i>MA-012</i> in <b>Reference</b>.",
      "Type the reviewing consultant in <b>Consultant</b>, set <b>Due date</b> to two weeks from today, and add any <b>Notes</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, a number such as <i>SUB/2026/0007</i>, and the stage bar on Draft.",
      "When you send it, click <span class='man-key'>Submit to consultant</span>. You should see <i>Submitted</i> and today's date under <b>Submitted</b>.",
      "The consultant replies with minor comments. Click <span class='man-key'>Approve w/ comments</span>. You should see <i>Approved with comments</i> and today's date under <b>Response</b>.",
      "Had it been rejected, you would click <span class='man-key'>Reject</span>, then <span class='man-key'>New revision</span>: you would see <i>New revision B created</i> and a new Draft with its own number, while the original becomes Superseded.",
      "Each week, use <span class='man-key'>Filters</span> &rsaquo; <b>Overdue</b> to chase submittals past their due date."
    ],
    fields: [
      ["Submittal title", "What is being submitted.", "required"],
      ["Project", "The project it belongs to. Only active projects are listed.", "optional"],
      ["Type", "Shop drawing, Material approval, Sample, Method statement or Other. A new submittal starts as Shop drawing.", "optional"],
      ["Revision", "The revision letter or number. It starts at A; New revision moves it on.", "optional"],
      ["Reference", "Your own drawing or document reference.", "optional"],
      ["Consultant", "Who reviews and approves it.", "optional"],
      ["Due date", "When you need the response by. After it, a submittal not yet approved is flagged overdue.", "optional"],
      ["Submitted", "The date you clicked Submit to consultant.", "auto"],
      ["Response", "The date the approval, approval with comments or rejection was recorded.", "auto"],
      ["Notes", "Anything else about the submittal.", "optional"],
      ["Number", "Given when the submittal is first saved, for example SUB/2026/0007.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank submittal."],
      ["Save", "Saves the submittal. Not shown on a Superseded one, which is read-only."],
      ["Discard", "Goes back to the list without saving."],
      ["Delete", "Shown on a saved submittal to people who can manage the app. Deletes it after a confirmation."],
      ["Submit to consultant", "Shown on a Draft. Saves it as Submitted with today's date. It does not send anything to the consultant."],
      ["Approve", "Shown when Submitted. Saves it as Approved with today's response date. If an approval rule for submittals applies, it goes to the approver first."],
      ["Approve w/ comments", "Shown when Submitted. Saves it as Approved w/ comments with today's response date."],
      ["Reject", "Shown when Submitted. Saves it as Rejected with today's response date."],
      ["New revision", "Shown once a decision is recorded. Marks this submittal Superseded and opens a new Draft with the next revision, the same project, title, type, reference and consultant, and a new number."],
      ["Filters", "Open, Approved (with or without comments), Rejected, or Overdue."],
      ["Group By", "Project, Type or Status."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "Submittals post nothing to the accounts and send no email. Each status button saves the form as it is on screen as well as the new status. A drawing revision can be linked to a submittal from the Drawing Register.",
    links: [
      { name: "Drawing Register", how: "A revision sent for approval is linked to its submittal in the revision dialog.", to: "doc.drawings" },
      { name: "Transmittals", how: "Record the documents you physically sent with the submittal.", to: "doc.trans" },
      { name: "Approval Rules", how: "A rule for submittals makes Approve wait for the named approver.", to: "approvals.rules" }
    ],
    mistakes: [
      ["Give the submittal a title", "The title at the top is empty. Every button that saves needs it."],
      ["Save failed", "Changes to an existing submittal were not saved. Check your connection and try again."],
      ["Sent for approval (amount)", "An approval rule covers submittals, so Approve went to the approver. Once they approve it in Approvals, open the submittal and click Approve again."],
      ["Already awaiting approval", "The approval request is already with the approver."],
      ["The fields cannot be changed", "The submittal is Superseded, which is read-only. Work on its newer revision instead."]
    ],
    tips: [
      "Due date and Notes are not copied to a new revision, so set them again on the new Draft.",
      "Approve w/ comments and Reject do not go through the approval rule that Approve uses."
    ]
  },

  "doc.rfis": {
    title: "RFIs",
    what: "An <b>RFI</b> (request for information) is a formal question to the designer, consultant or client when a drawing or specification is unclear, missing or contradicts something else. Each RFI records the question, when you need the answer by and the answer itself, and moves from Open to Answered to Closed. An open RFI past its Needed by date is flagged overdue, which is the evidence you need if a late answer delays the work.",
    when: [
      "A drawing or specification is unclear or conflicts with another, and work cannot continue without an answer.",
      "An answer arrives and needs recording.",
      "You want to chase every question still waiting for an answer."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Documentation &rsaquo; RFIs</b> and click <span class='man-key'>New</span>.",
      "Type <i>Bracket fixing into post-tensioned slab edge</i> as the subject.",
      "Pick the <b>Project</b>, type <i>Structural</i> in <b>Discipline</b>, leave <b>Raised date</b> on today and set <b>Needed by</b> to a week from today.",
      "In <b>Question</b> write <i>Drawing S-310 shows M12 anchors 150 mm from the slab edge. Please confirm the tendon positions and whether anchors may be drilled there.</i>",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>, a number such as <i>RFI/2026/0009</i>, and the stage bar on Open.",
      "When the engineer replies, paste the reply into <b>Answer</b> and click <span class='man-key'>Mark answered</span>. You should see <i>Marked answered</i> and <i>Answered</i> with today's date under the answer.",
      "Once the answer has been acted on, click <span class='man-key'>Close</span>. You should see <i>Closed</i>.",
      "If the answer does not settle the question, click <span class='man-key'>Reopen</span> instead of Close. You should see <i>Reopened</i>.",
      "Each week, use <span class='man-key'>Filters</span> &rsaquo; <b>Overdue</b> to chase open RFIs past their Needed by date."
    ],
    fields: [
      ["RFI subject", "A short title for the question.", "required"],
      ["Project", "The project the question is about. Only active projects are listed.", "optional"],
      ["Discipline", "The trade or discipline, for example Structural or Facade.", "optional"],
      ["Raised date", "When the question was raised. It starts on today.", "optional"],
      ["Needed by", "The date you need the answer to avoid delay. After it, an open RFI is flagged overdue.", "optional"],
      ["Question", "What needs clarifying, with drawing references.", "required"],
      ["Answer", "The response you received. Needed before Mark answered.", "optional"],
      ["Number", "Given when the RFI is first saved, for example RFI/2026/0009.", "auto"],
      ["Answered date", "Set when you click Mark answered.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank RFI."],
      ["Save", "Saves the RFI."],
      ["Discard", "Goes back to the list without saving."],
      ["Delete", "Shown on a saved RFI to people who can manage the app. Deletes it after a confirmation."],
      ["Mark answered", "Shown on an Open RFI. Saves it as Answered with today's date."],
      ["Close", "Shown on an Answered RFI. Saves it as Closed."],
      ["Reopen", "Shown on an Answered RFI. Saves it back to Open."],
      ["Filters", "Open, Answered, Closed or Overdue."],
      ["Group By", "Project, Status or Discipline."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "RFIs post nothing to the accounts and send no email; send the question to the consultant your usual way and record it here. Each status button saves the form as it is on screen as well as the new status.",
    links: [
      { name: "Drawing Register", how: "An answer that changes a drawing leads to a new revision there.", to: "doc.drawings" },
      { name: "Site Diary", how: "Note work held up waiting for an answer in the day's delays.", to: "site.diary" }
    ],
    mistakes: [
      ["Give the RFI a subject", "The subject at the top is empty."],
      ["Enter the question you're raising", "Question is empty. Every button that saves needs it."],
      ["Enter the answer first", "You clicked Mark answered with the Answer box empty."],
      ["Save failed", "Changes to an existing RFI were not saved. Check your connection and try again."],
      ["There is no Reopen button on a closed RFI", "Reopen is only offered on an Answered RFI. Raise a new RFI that refers to the closed one."]
    ],
    tips: [
      "Always set Needed by. Without it an RFI can never show as overdue, and a late answer is harder to prove."
    ]
  },

  "doc.trans": {
    title: "Transmittals",
    what: "A <b>transmittal</b> is the covering record of documents you send to someone: which documents, their references and revisions, how many copies, to whom, when and why. It is your proof of what was issued, and it prints as a covering sheet to go with the documents.",
    when: [
      "You issue drawings or documents to a client, consultant, contractor or subcontractor.",
      "Someone says they never received a revision and you need to show what was sent and when."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Documentation &rsaquo; Transmittals</b> and click <span class='man-key'>New</span>.",
      "Type the recipient at the top: <i>Main contractor, document control</i>.",
      "Pick the <b>Project</b>, type <i>For construction</i> in <b>Purpose</b>, leave <b>Date</b> on today, and type <i>Supersedes all earlier issues of these sheets</i> in <b>Notes</b>.",
      "In the first row of <b>Documents transmitted</b>, type <i>Curtain wall elevation, north</i> in Document, <i>FA-201</i> in Ref, <i>B</i> in Rev and 2 in Copies.",
      "Click <span class='man-key'>+ Add document</span> and add <i>Bracket setting-out plan</i>, FA-215, Rev A, 1 copy.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and a number such as <i>TR/2026/0005</i>.",
      "Click <span class='man-key'>Print</span>. A transmittal sheet opens for printing with the recipient, project, date, purpose, both documents and the notes.",
      "In the Drawing Register, open Rev B of FA-201, choose TR/2026/0005 in <b>Issued under transmittal</b>, and Save revision."
    ],
    fields: [
      ["Recipient", "Who the documents are going to, typed at the top.", "required"],
      ["Project", "The project the documents relate to. Only active projects are listed.", "optional"],
      ["Purpose", "Why you are sending them, for example For approval or For construction.", "optional"],
      ["Date", "The date of issue. It starts on today.", "optional"],
      ["Notes", "A covering note, printed under the list.", "optional"],
      ["Document, Ref, Rev, Copies (each row)", "The document's name, its reference, its revision and how many copies. Copies starts at 1. A row with no Document is dropped when you save.", "optional"],
      ["Number", "Given when the transmittal is first saved, for example TR/2026/0005.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank transmittal."],
      ["Save", "Saves the transmittal and replaces its document rows with those on screen."],
      ["Discard", "Goes back to the list without saving."],
      ["Print", "Shown on a saved transmittal. Prints the transmittal sheet."],
      ["Delete", "Shown on a saved transmittal to people who can manage the app. Deletes it after a confirmation."],
      ["+ Add document", "Adds a row."],
      ["The cross on a row", "Removes the row."],
      ["Group By", "Groups the list by project."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "A transmittal posts nothing to the accounts and sends nothing by itself. It can be chosen on a drawing revision in the Drawing Register as the transmittal that issued it.",
    links: [
      { name: "Drawing Register", how: "Link each issued revision to the transmittal that carried it.", to: "doc.drawings" },
      { name: "Submittals", how: "When documents go for approval, track the approval as a submittal as well.", to: "doc.subs" }
    ],
    mistakes: [
      ["Enter who the transmittal is being sent to", "The recipient at the top is empty."],
      ["Save failed", "Changes to an existing transmittal were not saved. Check your connection and try again."],
      ["The printed sheet shows the old recipient or date", "Print uses the recipient, date, purpose and notes as last saved, and the document rows on screen. Save first, then Print."]
    ],
    tips: [
      "Put the revision on every row. A transmittal without revisions cannot prove which version was sent."
    ]
  },

  "pc.list": {
    title: "Progress Certificates",
    what: "A <b>progress certificate</b>, also called an interim payment certificate or IPC, is your claim for the work done on a contract up to a date. You value each item of the contract as a percentage complete; Orbit adds materials on site, takes off the retention the client holds and any advance being recovered, subtracts what earlier certificates already claimed, and gives the amount due this time. Once certified, it turns into a draft customer invoice with one click.",
    when: [
      "At each valuation date on a contract, usually monthly, to claim the work done so far.",
      "The client's consultant has agreed the valuation and you need to invoice it.",
      "You need to print a certificate to submit with your application for payment."
    ],
    how: [
      "Make sure the project has a Customer, a Retention % (5 in this example) and a Schedule of Values. Here the contract is 1,200,000.00: Curtain wall supply 600,000.00, Installation 400,000.00, Brackets and anchors 200,000.00.",
      "Open <b>Contracting &rsaquo; Commercial &rsaquo; Progress Certificates</b>, click <span class='man-key'>New</span> and pick the <b>Project</b>. The claim breakdown fills with the three lines, each at Prev % 0.",
      "Type <i>IPC-01</i> in <b>Certificate No.</b> and set <b>Date</b> to the valuation date, 31 March.",
      "In the claim breakdown, type 25 in <b>This %</b> for Curtain wall supply, 10 for Installation and 50 for Brackets and anchors. <b>Value to date</b> fills in as 150,000.00, 40,000.00 and 100,000.00.",
      "Enter 20,000.00 in <b>Materials on site</b> and 15,000.00 in <b>Advance recovery</b>, and choose the 11% VAT.",
      "Check the summary: Work done to date 290,000.00, Gross value to date 310,000.00, Less retention (5%) 15,500.00, Less advance recovery 15,000.00, Net to date 279,500.00, Less previously certified 0.00, Amount due this certificate 279,500.00.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i>. When the valuation is agreed, click <span class='man-key'>Certify</span>. You should see <i>Certified</i>, the stage move to Certified, and the fields locked.",
      "Click <span class='man-key'>Create client invoice</span>. You should see <i>Draft invoice created</i> and the invoice opens with one line of 279,500.00 and 30,745.00 VAT, 310,245.00 in total. Post it from there.",
      "Next month, click New and pick the same project. The breakdown starts from IPC-01: each line's Complete % has moved into Prev %, This % is back to 0, and Less previously certified shows 279,500.00."
    ],
    fields: [
      ["Project", "The contract being certified. Chosen on a new certificate only; changing it rebuilds the form for that project.", "required"],
      ["Certificate No.", "The certificate's number, for example IPC-03. No two certificates in the company can share one.", "optional"],
      ["Date", "The valuation date. It decides which certificate counts as the previous one, and it becomes the invoice date.", "optional"],
      ["Materials on site", "The value of materials delivered to site but not yet built in. It is added to the gross value.", "optional"],
      ["Advance recovery", "The part of the advance payment recovered on this certificate. It is taken off the net.", "optional"],
      ["VAT", "The sales tax applied when the certificate is invoiced, or No VAT. It starts on your highest positive tax rate.", "optional"],
      ["Ref, Description, Contract value (claim breakdown)", "One row per item of the contract. A new project's first certificate takes them from the Schedule of Values; you can type, add, nest and delete rows.", "optional"],
      ["Prev % (claim breakdown)", "The percentage complete on the previous certificate, carried forward.", "auto"],
      ["This % (claim breakdown)", "The percentage of the item completed in this period. This is the figure you enter each time.", "optional"],
      ["Complete %, Value to date, This period (claim breakdown)", "Prev % plus This %; Contract value times Complete %; Contract value times This %. They are formulas, so they update as you type.", "auto"],
      ["Retention %", "Taken from the project and shown in the summary line Less retention.", "auto"],
      ["Summary", "Work done to date (total of Value to date), Certified this period, Materials on site, Gross value to date, Less retention, Less advance recovery, Net to date, Less previously certified (the Net to date of the latest earlier Certified or Invoiced certificate), and Amount due this certificate.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank certificate."],
      ["Save", "Saves the certificate with its claim breakdown and summary."],
      ["Discard", "Goes back to the list without saving."],
      ["Compute", "Shown on a saved draft. Recalculates the summary. It also updates by itself as you type."],
      ["Certify", "Shown on a saved draft. Saves it and marks it Certified, which locks it. There is no button to take it back to Draft."],
      ["Create client invoice", "Shown on a Certified certificate. Creates a draft customer invoice for the amount due, posts the retention and advance recovery entries, and marks the certificate Invoiced."],
      ["Print", "Shown on a saved certificate. Prints the certificate with its breakdown and summary."],
      ["+ Row and + Sub-item", "Add a row to the claim breakdown, at the top level or nested under the row above."],
      ["Row arrows and cross", "Indent or outdent a row (a parent row totals its children), or delete it."],
      ["Column headers", "Rename a column, change its type, delete it, or add one with +. Type = in a cell for a formula."],
      ["Filters and Group By", "Filter to Draft, Certified or Invoiced; group by project."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "Saving and certifying post nothing. <b>Create client invoice</b> creates a draft customer invoice for the certificate's amount due, dated at the certificate date, due in 30 days, referenced <i>Progress cert</i> and the number, on account 7000 when it exists, with the certificate's VAT. At the same moment Orbit posts two entries in the Miscellaneous (MISC) journal, dated today: the retention held since the previous certificate (debit 4110, credit 7000) and the advance recovered (debit 4190, credit 7000), when those accounts exist. The certificate then shows Invoiced. The <b>This certificate</b> amount of every Certified or Invoiced certificate counts as Certified on the project, in Project P&amp;L and as Billed in the WIP Schedule, and the latest one's retention appears in the Retention report.",
    links: [
      { name: "Projects", how: "The project's Customer, Retention % and Schedule of Values feed the certificate.", to: "proj.list" },
      { name: "Variations", how: "Approved variations raise the project's contract value; add them as rows in the claim to claim them.", to: "var.list" },
      { name: "Retention", how: "Shows the retention the client holds from the latest certificate, and records its release.", to: "proj.retention" },
      { name: "WIP Schedule", how: "Compares what certificates have billed with what the cost says you have earned.", to: "proj.wip" },
      { name: "Customer invoices", how: "Create client invoice makes the draft invoice you then post and send.", to: "inv.out" },
      { name: "Journal Entries", how: "The retention and advance recovery entries are posted there.", to: "moves" }
    ],
    mistakes: [
      ["Set a Customer on the project first.", "The project has no customer, so there is no one to invoice. Set the Customer on the project, then click Create client invoice again."],
      ["This certificate has nothing to invoice - the current amount is zero.", "The amount due this certificate is zero or less. Check the This % figures and the previous certificate."],
      ["Invoice failed: (reason)", "The draft invoice could not be created, so nothing else was done. Fix the reason shown and try again."],
      ["A record with Number IPC-03 already exists. Use a different one.", "Another certificate already has this number. Give this one a different number."],
      ["Save failed", "Changes to a saved certificate were not stored. A number already used by another certificate is one cause; check it, then Save again."],
      ["Less previously certified shows 0.00 on a second certificate", "Only Certified or Invoiced certificates dated before count as the previous one. Certify the earlier certificate first."],
      ["No retention entry in the ledger", "The entries are skipped when account 4110, 4190 or 7000, or the MISC journal, does not exist in the company."]
    ],
    tips: [
      "Certify only once the valuation is agreed. A certified certificate cannot be changed or taken back to Draft.",
      "The retention and advance entries post as soon as the draft invoice is created. If you delete that draft invoice, check Journal Entries, because the entries stay.",
      "Date each certificate at its valuation date: it orders your certificates and becomes the invoice date."
    ]
  },

  "var.list": {
    title: "Variations",
    what: "A <b>variation</b>, or change order, is a change to the agreed scope after the contract is signed: extra work, an omission or a substitution, with its price. Recording it keeps a trail of every change and, when you approve it, adds its amount to the project's contract value.",
    when: [
      "The client asks for extra work or removes something from the scope.",
      "A variation has been priced and needs recording while it is agreed.",
      "The client has agreed a variation and the contract value must go up or down."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Commercial &rsaquo; Variations</b> and click <span class='man-key'>New</span>. For this example, the client of an office fit-out asks for 12 extra floor sockets.",
      "Pick the <b>Project</b> and type <i>VO-04</i> in <b>Number</b>. Leave <b>Date</b> on today.",
      "Type <i>Add 12 floor sockets in the meeting rooms</i> in <b>Description</b> and 3,600.00 in <b>Amount</b>.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the variation in the list as Draft.",
      "When the client agrees the price, open the variation and click <span class='man-key'>Approve</span>.",
      "You should see <i>Approved - contract value updated</i>, and the variation shows Approved. A project at 120,000.00 now has a Contract Value of 123,600.00.",
      "For an omission, enter the amount as a negative, for example -2,000.00; approving it lowers the contract value.",
      "Use <span class='man-key'>Group By</span> &rsaquo; <b>Project</b> to see every variation on each job."
    ],
    fields: [
      ["Project", "The project the change belongs to. The first project in the list is preselected.", "required"],
      ["Number", "Your variation or change order number, for example VO-04.", "optional"],
      ["Date", "When the variation was raised. It starts on today.", "optional"],
      ["Description", "What changed in the scope.", "required"],
      ["Amount", "The change in contract value: positive for added work, negative for an omission.", "optional"],
      ["Status", "Draft when saved, Approved once approved.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank variation."],
      ["Save", "Saves the variation. A new one is saved as Draft."],
      ["Approve", "Shown on a saved variation that is not approved. Saves it, marks it Approved and adds the Amount to the project's Contract Value. If an approval rule for variations applies, it goes to the approver first."],
      ["Cancel", "Closes the dialog without saving."],
      ["Filters", "Approved or Draft."],
      ["Group By", "Groups the list by project."],
      ["Select and Export", "Export the ticked rows, or the whole list, as a CSV file."]
    ],
    after: "Approving adds the Amount to the project's Contract Value; that value is what Job Cost, Project P&amp;L and the WIP Schedule use. No invoice or journal entry is created: claim the variation's work on a progress certificate. If the project has a Schedule of Values, saving the project or its schedule resets the Contract Value to the schedule total, so add approved variations to the schedule as lines.",
    links: [
      { name: "Projects", how: "Approving changes the project's Contract Value.", to: "proj.list" },
      { name: "Progress Certificates", how: "Add the variation as a row in the claim breakdown to claim it.", to: "pc.list" },
      { name: "Approval Rules", how: "A rule for variations above an amount makes Approve wait for the named approver.", to: "approvals.rules" }
    ],
    mistakes: [
      ["Description required", "Description is empty."],
      ["Sent for approval (amount)", "An approval rule covers variations of this amount. It stays Draft until the approver decides in Approvals; then open it and click Approve again."],
      ["Already awaiting approval", "The request is already with the approver."],
      ["The contract value dropped back after approving", "The project has a Schedule of Values, and saving the project or the schedule set the Contract Value back to its total. Add the variation as a schedule line."],
      ["Changing an approved variation's amount did not change the contract value", "Only Approve adjusts the contract value. Correct the project's Contract Value, or its Schedule of Values, by the difference."]
    ],
    tips: [
      "Save a variation as soon as it is raised, even before it is priced, so every change has a number and a date.",
      "This screen has no way to reject or delete a variation, so keep unagreed ones as Draft with a clear description."
    ]
  },

  "proj.wip": {
    title: "WIP Schedule",
    what: "The <b>WIP Schedule</b> (work in progress) shows, for every active project, how far through the job you are by cost, what that means you have earned, and whether you have billed more or less than that. Percentage complete is actual cost divided by budgeted cost, the cost-to-cost method. Billing more than you have earned is over-billing; billing less is under-billing.",
    when: [
      "At month end, before reviewing the accounts of a contracting business.",
      "You suspect a job has been claimed ahead of the work, or has fallen behind on claims.",
      "A lender, auditor or partner asks for a WIP schedule."
    ],
    how: [
      "Give each active project a cost budget (Projects, then the Cost budget button), and certify progress as usual.",
      "Open <b>Contracting &rsaquo; Commercial &rsaquo; WIP Schedule</b>.",
      "Find the project. In this example: Contract 500,000.00, Budget 400,000.00, Actual cost 120,000.00.",
      "Read <b>% complete</b>: 30.0%, because 120,000 of the 400,000 budget has been spent.",
      "Read <b>Earned revenue</b>: 150,000.00, which is 30% of the 500,000 contract.",
      "Read <b>Billed</b>: 180,000.00 from certified progress certificates. <b>Over/(under) billed</b> shows 30,000.00 in amber: you have billed 30,000 more than you have earned.",
      "Check the Total row for the position across all jobs, and click <span class='man-key'>Print</span> for a copy."
    ],
    fields: [
      ["Contract", "The project's Contract Value.", "auto"],
      ["Budget", "The total of the project's cost budget lines.", "auto"],
      ["Actual cost", "Every line of posted supplier bills tagged to the project, plus stock issued to the project at its current cost price.", "auto"],
      ["% complete", "Actual cost divided by Budget, capped at 100%. Zero when the project has no budget.", "auto"],
      ["Earned revenue", "Contract times % complete.", "auto"],
      ["Billed", "The total This certificate amount of the project's Certified and Invoiced progress certificates.", "auto"],
      ["Over/(under) billed", "Billed minus Earned revenue. Amber when over-billed (billed more than earned), green when under-billed.", "auto"]
    ],
    buttons: [
      ["Print", "Prints the schedule."]
    ],
    after: "The WIP Schedule only reads. It posts nothing and makes no over- or under-billing adjustment in the ledger.",
    links: [
      { name: "Projects", how: "The Contract Value and the cost budget come from the project.", to: "proj.list" },
      { name: "Progress Certificates", how: "Billed is the total of certified certificates.", to: "pc.list" },
      { name: "Job Cost", how: "The same project's budget, committed and actual cost by cost code.", to: "proj.jobcost" },
      { name: "Project P&amp;L", how: "Certified revenue against actual cost, with category warnings.", to: "proj.pnl" }
    ],
    mistakes: [
      ["% complete shows 0.0% on a busy job", "The project has no cost budget. Add one from the project's Cost budget button."],
      ["No active projects.", "Every project is Closed, or there are none. Only active projects are listed."],
      ["Actual cost here differs from Job Cost and Project P&amp;L", "This schedule counts every posted bill line, including lines for stocked items, and does not count install labour. Job Cost and Project P&amp;L leave stocked lines out and include install labour."],
      ["Billed is zero although invoices were raised", "Billed counts progress certificates only. Invoices raised from hours or directly are not included."]
    ],
    tips: [
      "Keep budgets up to date. An out-of-date budget makes % complete, and so earned revenue, wrong."
    ]
  },

  "proj.retention": {
    title: "Retention",
    what: "<b>Retention</b> is money held back as a guarantee until a job is finished or its defects period ends. This report shows both sides: what your clients hold from you, taken from your progress certificates, and what you hold from your subcontractors, taken from their subcontract certificates, with what has been released and what is still outstanding. From here you record a release when the money is paid.",
    when: [
      "At practical completion or the end of a defects period, when retention falls due.",
      "A client pays retention to you, or you pay retention to a subcontractor.",
      "At close-out, to make sure no retention is forgotten on either side."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Commercial &rsaquo; Retention</b>.",
      "In <b>Retention held by clients</b>, find the project: Gross certified 900,000.00, Held 45,000.00, Released 0.00, Outstanding 45,000.00.",
      "The client pays half the retention at practical completion. Click <span class='man-key'>Release</span> on that row.",
      "Enter 22,500.00 in <b>Amount</b>, set the <b>Date</b> the money arrived, and leave <b>Through</b> on Bank.",
      "Click <span class='man-key'>Record receipt</span>. You should see <i>Retention released</i>, Released 22,500.00 and Outstanding 22,500.00.",
      "In <b>Retention we hold from subcontractors</b>, find the installation subcontract with Outstanding 8,000.00. When its defects period ends, click Release, keep the full amount, choose Bank and click <span class='man-key'>Record payment</span>.",
      "Read the totals at the bottom: retention receivable outstanding, retention payable outstanding, and the net retention position.",
      "Click <span class='man-key'>Print</span> for a copy."
    ],
    fields: [
      ["Project, Gross certified, Held (clients)", "For each project, the gross value to date and the retention amount on its latest Certified or Invoiced progress certificate.", "auto"],
      ["Subcontract, Subcontractor, Gross certified, Held (subcontractors)", "For each subcontract, the same figures from its latest non-draft subcontract certificate.", "auto"],
      ["Released and Outstanding", "The total of releases recorded here, and Held minus Released.", "auto"],
      ["Net retention position", "Outstanding receivable minus outstanding payable.", "auto"],
      ["Amount (Release dialog)", "How much is being released now. It starts at the full outstanding amount and cannot be more.", "required"],
      ["Date (Release dialog)", "When the money was received or paid. It is the date of the journal entry.", "optional"],
      ["Through (Release dialog)", "Bank or Cash: where the money arrived or left from.", "optional"]
    ],
    buttons: [
      ["Release", "Shown on a row with retention outstanding. Opens the Release dialog."],
      ["Record receipt", "On a client row. Posts the release and records it."],
      ["Record payment", "On a subcontractor row. Posts the release and records it."],
      ["Cancel", "Closes the dialog without recording anything."],
      ["Print", "Prints the report."]
    ],
    after: "Recording a release posts a journal entry in the Miscellaneous (MISC) journal on the date you gave. For a client release it debits the Bank account (code 5100) or Cash (code 5300) and credits Retention receivable (code 4110). For a subcontractor release it debits code 4010 and credits Bank or Cash. The release is then added to Released, which lowers Outstanding.",
    links: [
      { name: "Progress Certificates", how: "The retention clients hold comes from your latest certified certificate on each project.", to: "pc.list" },
      { name: "Subcontract Certificates", how: "The retention you hold comes from each subcontract's latest non-draft certificate.", to: "pur.sccert" },
      { name: "Subcontracts", how: "Each subcontract's retention % is set there.", to: "sc.list" },
      { name: "Journal Entries", how: "Each release is posted there as a journal entry.", to: "moves" }
    ],
    mistakes: [
      ["Enter an amount", "Amount is zero or empty."],
      ["More than the outstanding retention", "You cannot release more than is outstanding. Lower the amount."],
      ["Missing account 5100 / 4110", "The company's chart has no account with one of those codes (the codes shown depend on the side and on Bank or Cash). Add the account or ask your accountant, then try again."],
      ["No misc journal", "The company has no journal coded MISC. Add one in Accounting, then try again."],
      ["Period locked on (date)", "The release date falls in a closed period. Use a later date, or ask whoever closed the period to reopen it."],
      ["No certified progress certificates yet.", "No project has a Certified or Invoiced certificate, so there is no client retention to show."]
    ],
    tips: [
      "Record each release on the day the money moves, so the report and the bank agree."
    ]
  },

  "sc.list": {
    title: "Subcontracts",
    what: "A <b>subcontract</b> is a package of work you hand to another firm, such as aluminium fabrication, electrical installation or scaffolding. It records the subcontractor, the project, the agreed amount and the retention you will hold back. Setting a subcontract Active is a commitment to spend, so it can go through an approval rule first.",
    when: [
      "You agree a package of work with a subcontractor.",
      "A subcontract is signed and becomes active, or the work is finished and it is closed.",
      "You want to see what is subcontracted on each project or with each firm."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Commercial &rsaquo; Subcontracts</b> and click <span class='man-key'>New</span>.",
      "Type <i>Aluminium fabrication</i> in <b>Subcontract name</b> and <i>SC-007</i> in <b>Number</b>.",
      "Pick the subcontractor in <b>Vendor</b> and the <b>Project</b>.",
      "Enter 85,000.00 in <b>Amount</b> and 5 in <b>Retention %</b>. Leave <b>Status</b> on Draft.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the subcontract in the list as Draft, with a Retention of 5%.",
      "When the subcontract is signed, open it, set Status to Active and click Save. You should see <i>Saved</i> and Active in the list.",
      "If an approval rule for subcontracts covers 85,000.00, you see <i>Sent for approval</i> instead and the subcontract stays Draft. Once the approver agrees, set it Active and Save again.",
      "As the subcontractor completes work, value it with subcontract certificates; the retention held on them appears in the Retention report."
    ],
    fields: [
      ["Subcontract name", "What is subcontracted, for example Aluminium fabrication.", "required"],
      ["Number", "Your subcontract reference.", "optional"],
      ["Vendor", "The subcontractor. Only contacts marked as vendors are listed.", "optional"],
      ["Project", "The project the work is for.", "optional"],
      ["Amount", "The subcontract value. An approval rule for subcontracts is checked against it.", "optional"],
      ["Retention %", "The percentage you hold back from the subcontractor.", "optional"],
      ["Status", "Draft, Active or Closed. Saving as Active checks the approval rules.", "optional"],
      ["Currency", "Saved in the company's currency.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank subcontract."],
      ["Save", "Saves the subcontract. Saving it as Active sends it for approval first when a rule applies, and keeps it Draft until approved."],
      ["Cancel", "Closes the dialog without saving."],
      ["Filters", "Active."],
      ["Group By", "Project or Vendor."],
      ["Select", "Tick rows, then <span class='man-key'>Export selected</span> or <span class='man-key'>Delete</span>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "A subcontract posts nothing to the accounts and is not counted as committed cost in Job Cost, which counts purchase orders. Its value is certified through subcontract certificates, and the retention held on the latest of those shows in the Retention report under the subcontractor.",
    links: [
      { name: "Subcontract Certificates", how: "Value the subcontractor's progress against the subcontract.", to: "pur.sccert" },
      { name: "Retention", how: "Shows the retention you hold from each subcontractor, and records its release.", to: "proj.retention" },
      { name: "Approval Rules", how: "A rule for subcontracts above an amount makes Active wait for the named approver.", to: "approvals.rules" },
      { name: "Approvals", how: "Where the approver sees and decides the request.", to: "approvals.inbox" }
    ],
    mistakes: [
      ["Name required", "Subcontract name is empty."],
      ["Sent for approval (amount)", "An approval rule covers subcontracts of this amount, so it was saved as Draft. Once approved, set Status to Active and Save again."],
      ["Already awaiting approval", "The request is already with the approver; the subcontract stays Draft for now."],
      ["Some of these are used in other records and can't be deleted.", "A selected subcontract has certificates or other records attached. Set it Closed instead."],
      ["The subcontractor is not in Vendor", "Only vendors are listed. Mark the contact as a vendor first."]
    ],
    tips: [
      "An approval covers the amount approved. Raising the amount later and saving as Active asks for approval again."
    ]
  },

  "proj.jobcost": {
    title: "Job Cost",
    what: "Job Cost answers whether a job is spending more than planned. For one project it sets, cost code by cost code, the <b>budget</b> against what is <b>committed</b> on purchase orders and what has <b>actually</b> been spent, and forecasts the final cost (EAC, estimate at completion). Across the top it shows the contract value, the forecast cost and the forecast margin, so an overrun shows while you can still act on it.",
    when: [
      "Weekly or monthly on every running job, to catch overspend early.",
      "Before placing a large order, to see how much of the budget is left.",
      "At a commercial review, to give the forecast margin on a job.",
      "From the Projects app, the Commercial &amp; cost menu item opens this screen."
    ],
    how: [
      "Set up cost codes, give the project a cost budget with a code on each line, and put the project and the cost code on its purchase orders and bills. In this example the project has budget lines 100 Site labour 60,000.00 and 200 Materials 90,000.00, and a contract of 250,000.00.",
      "Open <b>Contracting &rsaquo; Costs &rsaquo; Job Cost</b> and pick the project in the box at the top right.",
      "A purchase order for 70,000.00 before tax, tagged to code 200, has been sent. On row <i>200 - Materials</i> you should see Committed 70,000.00.",
      "A posted bill of 20,000.00 for a service, tagged to code 200, shows as Actual 20,000.00 on the same row, with % used 22%.",
      "Read Forecast (EAC) on that row: 90,000.00, the larger of the budget or actual plus the part of the order not yet billed. Fcast var is 0.00.",
      "Install labour of 5,000.00 logged on the project's install jobs shows on the <b>Uncoded</b> row as Actual 5,000.00 and Fcast var -5,000.00, in red.",
      "Read the top: Contract value 250,000.00, Forecast cost (EAC) 155,000.00, Forecast margin 95,000.00 (38%).",
      "If a new order would take a code's forecast above its budget, the Fcast var on that row turns red and the forecast margin falls."
    ],
    fields: [
      ["Project", "The project to report on. Orbit remembers your last choice while you are signed in.", "required"],
      ["Contract value", "The project's Contract Value.", "auto"],
      ["Budget", "The project's cost budget lines, by their cost code.", "auto"],
      ["Committed", "Purchase orders tagged to the project that are sent, confirmed or done, before tax, by the Cost Code on the order.", "auto"],
      ["Actual", "Posted supplier bills tagged to the project, before tax, by the Cost Code on the bill, leaving out lines for stocked or consumable products; plus, on the Uncoded row, stock issued to the project at cost price and install labour.", "auto"],
      ["Forecast (EAC)", "The larger of the budget, or actual plus whatever is committed beyond actual.", "auto"],
      ["Fcast var", "Budget minus forecast. Red when negative, meaning a forecast overrun.", "auto"],
      ["% used", "Actual as a percentage of budget.", "auto"],
      ["Forecast margin", "Contract value minus the total forecast cost, with its percentage of the contract.", "auto"]
    ],
    buttons: [
      ["Project box", "Switches the report to another project."]
    ],
    after: "Job Cost only reads. It changes nothing and posts nothing. Its Actual total is built the same way as the Actual cost in Project P&amp;L.",
    links: [
      { name: "Cost Codes", how: "The buckets the report is grouped by.", to: "cost.codes" },
      { name: "Projects", how: "The project's cost budget (Cost budget button) is the Budget column.", to: "proj.list" },
      { name: "Purchase Orders", how: "Orders tagged to the project and a cost code are the Committed column.", to: "po.list" },
      { name: "Bills", how: "Posted bills tagged to the project and a cost code are the Actual column.", to: "inv.in" },
      { name: "Material Issues", how: "Stock issued to the project is actual cost on the Uncoded row.", to: "inv.issues" },
      { name: "Install Jobs", how: "Install labour on the project is actual cost on the Uncoded row.", to: "inst.jobs" },
      { name: "Project P&amp;L", how: "The same actual cost, with certified revenue and category warnings, for every project.", to: "proj.pnl" }
    ],
    mistakes: [
      ["No budget or costs yet. Add a cost budget, then raise POs / bills against this project.", "The project has no budget lines, orders or posted bills yet."],
      ["Everything sits on the Uncoded row", "The budget lines, orders or bills have no cost code. Choose the cost code on the order or bill itself, not only on its lines."],
      ["A bill does not show in Actual", "It is not posted, is not tagged to the project, or every line is for a stocked product (that cost counts when the stock is issued to the project)."],
      ["The screen says there are no projects yet", "Create a project first."]
    ],
    tips: [
      "Committed includes orders already billed; the forecast only adds the part of an order that has not yet reached Actual, so nothing is counted twice.",
      "Give every budget line a cost code. A budget with no codes can only be compared on the Uncoded row."
    ]
  },

  "proj.pnl": {
    title: "Project P&amp;L",
    what: "Project P&amp;L shows, for every active project, whether the job is making money: contract value, what you have certified, the cost budget, the actual cost, what is still committed on purchase orders, the cost variance and the margin. It warns, by cost category, when actual cost has passed the budget and when committed cost will take a category over. Click a project for its full cost detail.",
    when: [
      "At a monthly review of all running jobs.",
      "When a job feels as though it is losing money and you want to see where.",
      "Before quoting similar work, to see how a past job's costs came out."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Costs &rsaquo; Project P&amp;L</b>.",
      "Find the project. In this example: Contract 250,000.00, Certified 80,000.00, Budget cost 150,000.00, Actual cost 25,000.00, Committed 50,000.00, Cost variance 125,000.00 and Margin 55,000.00 (certified less actual).",
      "Look for a flag beside the name. <b>! over</b> means a category has already spent past its budget; <b>forecast</b> means committed cost will take a category over.",
      "Read the banners above the table: each over-budget or forecast-over project is named with the category and by how much.",
      "Click the project's row to open its cost detail.",
      "Read <b>Cost control by category</b>: Material, Labour, Subcontract and Overhead, each with Budget, Actual, Committed, Forecast, Used and a status such as ok, near limit, forecast over by or ! over by.",
      "Scroll down through the cost budget, the posted vendor bills, the materials issued to site, the site labour and the open purchase orders behind the figures.",
      "Click <span class='man-key'>Print</span> for a copy of the detail."
    ],
    fields: [
      ["Contract", "The project's Contract Value.", "auto"],
      ["Certified", "The total This certificate amount of its Certified and Invoiced progress certificates.", "auto"],
      ["Budget cost", "The total of the project's cost budget lines.", "auto"],
      ["Actual cost", "Posted supplier bill lines tagged to the project, leaving out lines for stocked or consumable products, plus stock issued to the project at cost price, plus install labour.", "auto"],
      ["Committed", "The part not yet billed of lines on draft, sent or confirmed purchase orders tagged to the project.", "auto"],
      ["Cost variance", "Budget cost minus Actual cost. Red when negative.", "auto"],
      ["Margin", "Certified minus Actual cost.", "auto"],
      ["Category (cost detail)", "Budget lines are placed by their Category text (Labour, Subcontract, Material; anything else is Overhead). Bill lines are placed by account: 6000 or 3xxx Material, 6100 Subcontract, 6400 or 4200 Labour, other accounts Overhead. Issued stock is Material and install labour is Labour.", "auto"],
      ["Status (cost detail)", "! no budget (spent with no budget), ! over by, forecast over by, near limit (90% or more of budget spent) or ok.", "auto"]
    ],
    buttons: [
      ["A project row", "Opens that project's cost detail."],
      ["Print", "Prints the report or the cost detail."]
    ],
    after: "Project P&amp;L only reads. It changes nothing and posts nothing.",
    links: [
      { name: "Job Cost", how: "The same actual cost for one project, by cost code, with a forecast.", to: "proj.jobcost" },
      { name: "Progress Certificates", how: "Certified revenue comes from certified certificates.", to: "pc.list" },
      { name: "Projects", how: "Budget categories come from the project's cost budget lines.", to: "proj.list" },
      { name: "Install Jobs", how: "Install labour is counted as Labour.", to: "inst.jobs" },
      { name: "WIP Schedule", how: "Earned against billed for the same projects.", to: "proj.wip" }
    ],
    mistakes: [
      ["No active projects.", "Every project is Closed, or there are none."],
      ["A category shows ! no budget", "Money was spent in a category with no budget line. Add a budget line whose Category contains the word, for example Labour."],
      ["Budget shows under Overhead", "The budget line's Category does not contain labour, subcon, material, supply or procure. Rename the category."],
      ["The cost detail's bill total is higher than the P&amp;L row", "The detail lists every posted bill line, including stocked items that the summary row leaves out."]
    ],
    tips: [
      "Margin here is certified revenue less actual cost, so it looks low early in a job and on jobs billed without certificates."
    ]
  },

  "cost.codes": {
    title: "Cost Codes",
    what: "<b>Cost codes</b> are your standard cost buckets, such as Site labour, Materials, Subcontract, Plant or Preliminaries. Put a code on a project's cost budget lines and on its purchase orders and bills, and Job Cost lines them up code by code as budget, committed and actual. Set the list up once for the company.",
    when: [
      "Before you budget your first project, to set up the codes everyone will use.",
      "A new kind of cost needs its own bucket, or an old one is no longer used."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Costs &rsaquo; Cost Codes</b> and click <span class='man-key'>New</span>.",
      "Type <i>100</i> in <b>Code</b>, choose Labour in <b>Category</b>, type <i>Site labour</i> in <b>Name</b>, leave <b>Sort</b> at 10 and <b>Active</b> on Active.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the code in the list.",
      "Add <i>200</i> Materials <i>Aluminium and glass</i> (Sort 20), <i>300</i> Subcontract <i>Installation subcontract</i> (Sort 30) and <i>400</i> Plant &amp; Equipment <i>Crane and access</i> (Sort 40).",
      "Use <span class='man-key'>Group By</span> &rsaquo; <b>Category</b> to check the set.",
      "On a project, open <b>Cost budget</b> and choose <i>200 - Aluminium and glass</i> on the materials line.",
      "Choose the same code on the project's purchase orders and bills. In Job Cost you should see a row <i>200 - Aluminium and glass</i> with its budget, committed and actual."
    ],
    fields: [
      ["Code", "The short code, for example 100. No two codes in the company can be the same, whatever the capitals.", "required"],
      ["Category", "Labour, Materials, Subcontract, Plant &amp; Equipment, Preliminaries, Overheads or Other. The list can be grouped by it.", "optional"],
      ["Name", "What the code covers, for example Site labour. Job Cost shows it after the code.", "optional"],
      ["Sort", "The order of the codes in the list, in pickers and in Job Cost. It starts at 10.", "optional"],
      ["Active", "Active or Inactive. Only active codes are offered on cost budget lines.", "optional"],
      ["Status (list column)", "Active or Inactive.", "auto"]
    ],
    buttons: [
      ["New", "Opens a blank cost code."],
      ["Save", "Saves the code."],
      ["Delete", "Shown on an existing code. Deletes it straight away, without asking to confirm."],
      ["Cancel", "Closes the dialog without saving."],
      ["Code, Name and Category cells", "Click a cell in the list to change it in place."],
      ["Group By", "Groups the list by category."],
      ["Select", "Tick rows, then <span class='man-key'>Export selected</span>, <span class='man-key'>Archive</span> (they become Inactive) or <span class='man-key'>Delete</span>."],
      ["Export", "Downloads the list as a CSV file."]
    ],
    after: "Cost codes post nothing. Active codes are offered on project cost budget lines, and codes chosen on purchase orders and bills decide the row they appear on in Job Cost. Deleting a code that is in use removes it from those budget lines, orders and bills, which then appear on the Uncoded row. An inactive code stays on the records that already use it.",
    links: [
      { name: "Job Cost", how: "Budget, committed and actual cost for a project, row by cost code.", to: "proj.jobcost" },
      { name: "Projects", how: "Choose a cost code on each line of a project's cost budget.", to: "proj.list" },
      { name: "Purchase Orders", how: "A cost code on an order puts its value in Committed on that row.", to: "po.list" },
      { name: "Bills", how: "A cost code on a posted bill puts its cost in Actual on that row.", to: "inv.in" },
      { name: "Data import", how: "Cost codes can be loaded from a CSV file with Code, Name and Category.", to: "settings.import" }
    ],
    mistakes: [
      ["Enter a code", "Code is empty."],
      ["That already exists - a record with the same code or number is already saved.", "Another cost code already uses this code, perhaps in different capitals. Use a different code."],
      ["Costs moved to Uncoded after a clean-up", "A code in use was deleted, which removed it from the lines that carried it. Make codes Inactive instead of deleting them."]
    ],
    tips: [
      "Leave gaps in the codes (100, 200, 300) so related codes can be added later in the right order.",
      "Keep the set short. A dozen codes used consistently tell you more than a hundred used at random."
    ]
  },

  "proj.materials": {
    title: "Materials &amp; Remnants",
    what: "Materials &amp; Remnants (the list is titled Project Materials) records made-to-size or job-specific materials that should not clutter the product catalogue: glass panels cut to size, bars in one length, a batch of paint for one job. Each item records its project, size and specification, quantity, how much has been used and where it is in its life. Offcuts worth keeping are recorded as <b>remnants</b>, linked to the item they came from, so good material is not thrown away.",
    when: [
      "A job needs materials made to its own sizes, and you want them tracked without creating catalogue products.",
      "Material arrives, is used, or is scrapped on a job.",
      "An offcut is left over that could be used on another job.",
      "You are looking for a usable remnant before ordering new material."
    ],
    how: [
      "Open <b>Contracting &rsaquo; Costs &rsaquo; Materials &amp; Remnants</b> and click <span class='man-key'>New</span>.",
      "Type <i>Glass panel - clear tempered 10 mm</i> as the name and pick the <b>Project</b>.",
      "Enter 24 in <b>Quantity</b>, leave <b>Unit</b> as pcs, and set <b>Status</b> to Ordered.",
      "Under Classification, pick the Type from your tree if you have one. Under Material &amp; attributes, choose the <b>Material</b> and the <b>Supplier</b>.",
      "Set <b>Material form</b> to Sheet / plate, then enter 1500 in Width, 2400 in Height and 10 in Thickness (mm). Choose Price per m2 in Priced by and enter the price.",
      "Click <span class='man-key'>Save</span>. You should see <i>Saved</i> and the item in the list with Size <i>1500x2400x10 mm</i> and Qty 24 pcs.",
      "When the panels are delivered, open the item and set Status to In stock. As they are fitted, update <b>Used so far</b>, for example to 22, and Save.",
      "One panel was cut down and the offcut is worth keeping. Open the item and click <span class='man-key'>+ Add offcut</span>. A new form opens named <i>Glass panel - clear tempered 10 mm - offcut</i>, on the same project, In stock, with the remnant box ticked.",
      "Enter the offcut's size and 1 in Quantity, and Save. In the list it shows with a Remnant badge, and <span class='man-key'>Filters</span> &rsaquo; <b>Remnants / offcuts</b> finds it."
    ],
    fields: [
      ["Name", "What the item is, for example Glass panel - clear tempered 10 mm.", "required"],
      ["Photo (beside the name)", "A picture of the item, shown as its thumbnail.", "optional"],
      ["Project", "The job the material belongs to.", "optional"],
      ["Quantity", "How many pieces or units there are for the job.", "optional"],
      ["Unit", "For example pcs, m or m2. Left blank it is saved as pcs.", "optional"],
      ["Status", "Planned, Ordered, In stock, Used or Scrapped.", "optional"],
      ["Used so far", "How much has been consumed on site.", "optional"],
      ["This is a leftover offcut (remnant)", "Tick for an offcut. Remnants show a badge and have their own filter.", "optional"],
      ["Family (brand), Series, Model", "Who makes it, picked from your classification tree.", "optional"],
      ["Type, Subtype, Sub-subtype", "What it is, picked from your classification tree.", "optional"],
      ["Material", "The substance it is made of. It sets the density used to work out weight.", "optional"],
      ["Colour and Supplier", "The finish, for example RAL 9016, and who supplies it. Earlier entries are suggested.", "optional"],
      ["Material form", "General item, Bar / profile, Sheet / plate, Glass unit (IGU / laminated), Liquid (paint, sealant) or Roll / coil. It decides which size and price boxes appear.", "optional"],
      ["Size and price boxes", "Depend on the form: length and weight per metre for a bar; width, height, thickness and density for a sheet; unit size, panes, cavities and Ug for a glass unit; container size and batch for a liquid; roll length and weight for a roll; with Priced by and the price value.", "optional"],
      ["Notes", "Anything else about the item.", "optional"]
    ],
    buttons: [
      ["New", "Opens a blank item."],
      ["Save", "Saves the item and returns to the list."],
      ["Discard", "Goes back to the list without saving."],
      ["+ Add offcut", "Shown on a saved item that is not itself a remnant. Opens a new remnant form linked to this item, with its project, unit, form, material and colour filled in."],
      ["Filters", "Remnants / offcuts, Main items, In stock or Used up."],
      ["Group By", "Project, Form or Status."],
      ["Kanban board", "Cards in status columns. Dragging a card to another column changes its status."],
      ["Select", "Tick rows, then <span class='man-key'>Export selected</span> or <span class='man-key'>Delete</span>."],
      ["Export", "Downloads the list as a CSV file, useful as a stock-usage sheet."]
    ],
    after: "A project material is a record of the item, not stock: saving it does not change On Hand, post to the accounts, or add cost to Job Cost or Project P&amp;L. To cost material to a job, issue stock to the project. Project materials can be chosen as lines on delivery notes, and a remnant keeps a link to the item it was cut from.",
    links: [
      { name: "Material Issues", how: "Issuing stock to a project is what adds material cost to Job Cost and Project P&amp;L.", to: "inv.issues" },
      { name: "Classification", how: "Build the Family and Type trees offered on the form.", to: "settings.classification" },
      { name: "Projects", how: "Group by Project to see each job's materials and offcuts.", to: "proj.list" }
    ],
    mistakes: [
      ["Name is required", "The item's name is empty."],
      ["Could not save: (reason)", "The item was not saved. Fix the reason shown and try again."],
      ["No classification tree yet. Build it in Settings &rsaquo; Classification, then choose from it here.", "Not an error: your company has no classification tree, so the Family and Type boxes are empty. The rest of the form works."],
      ["+ Add offcut is missing", "It only shows on a saved item that is not already a remnant."]
    ],
    tips: [
      "Before ordering new material for a job, filter on Remnants / offcuts and In stock to see what you already have."
    ]
  }

});
