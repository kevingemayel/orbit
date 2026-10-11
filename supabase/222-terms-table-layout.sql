-- 222: the payment milestones are a table, and they now read like one.
--
-- 219 converted Odoo's HTML terms to the plain text a textarea holds, and it
-- handled paragraphs, breaks and lists. It did not handle TABLES, and the
-- payment milestones on every one of these quotations are a four column table.
-- Each cell came out on its own line, so the printed quotation showed
--
--     Milestone / Description / Percentage / Amount USD / 1 / Advance /
--     payment upon appointment / contract signature / 25% / 2,700
--
-- as ten unrelated fragments down the page, which is worse than useless on a
-- document a customer is meant to sign. The same source HTML is converted
-- again here, with a converter that keeps a row on one line and separates the
-- cells with " | ". Nothing else about the text changes.

-- @chunk

-- template: Facade Architectural Services
update public.quote_templates set note = 'SPACEWORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design;
1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Façade architectural basis of design, including:
	a. Façade concept drawings.
	b. Project specifications.
1.2. Consulting and engineering services related to façade design.
2. Deliverables
2.1. General façade concept drawings reflecting the agreed-upon design approach.
2.2. Comprehensive project specifications outlining material requirements, performance criteria, testing, and other relevant details.
3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACEWORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 25% upon signing this Agreement.
	b. 25% upon submission of Materials and systems
	c. 20% upon submission of specifications
	d. 20% upon submission of Facade General Drawings
	e. 10% Remaining balance upon delivery of final drawings and specifications.
5.3. Payments must be made within 15 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:

	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.
7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.
9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.
12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
13. Amendments
This Agreement may only be amended in writing and signed by both parties.
IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and name = 'Facade Architectural Services';

-- @chunk

-- template: Structural Calculation Services
update public.quote_templates set note = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 Aluminum Frame
	1.1.2 Glass
	1.1.3 Fastner Connections
	1.1.4 Chemical Connections

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon signing this Agreement.
	b. 10% upon first submission of works
	c. 10% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL

Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and name = 'Structural Calculation Services';

-- @chunk

-- template: Architectural Design Phase (Pre-Execution)
update public.quote_templates set note = 'SPACE WORK SARL – Proposal / Agreement (FACADE Implementation Drawings Assistance)
SPACE WORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located in Beirut, specializing in façade consulting, engineering, and design.
1. Scope of Work
SPACEWORK agrees to provide the following services to the Client for the project (the “Project”):
	1.1. Review & Alignment (Concept Confirmation)
		a. Review the existing façade conceptual design package issued by others (architect/client).
		b. Confirm façade intent, system direction, and key constraints (interfaces, performance targets, typical details).
		c. Issue a brief list of clarifications / RFIs required to proceed.
	1.2. Façade Implementation / Tender-Level Drawings (Not Shop Drawings)
		SPACEWORK will develop façade implementation drawings intended for coordination and tendering, including (as applicable):
		a. General Arrangement façade elevations and typical zones.
		b. Typical sections/details at key junctions (slab edge, parapet, head/sill/jamb, corner, movement joints, interfaces with waterproofing, etc.).
		c. Typical anchoring intent and load-path concept (indicative only).
		d. Interface coordination notes with structure, architecture, and MEP penetrations (as required).
		e. Material/system intent notes suitable for tender coordination.
	1.3. Technical Assistance & Coordination
		a. Periodic design coordination meetings (remote) and written responses to Client queries.
		b. One round of tender clarification support based on submitted implementation package.
	1.4. Explicit Exclusions
		Unless agreed by written amendment, the following are excluded:
		a. Shop drawings, fabrication drawings, assembly drawings, and installation method statements.
		b. Full structural calculations, stamping, or third-party authority submissions.
		c. Detailed cutting lists, CNC files, or optimization schedules.
		d. Full procurement support, supplier nomination, or tender evaluation (unless added).
		e. Site supervision / inspections / as-built drawings.
	2. Deliverables
		2.1. Façade Implementation Drawing Set (tender/coordination level, not shop drawings), including typical elevations/sections/details and key interfaces.
		2.2. Implementation Notes (if needed) summarizing system intent, interfaces, and assumptions.
		2.3. RFI / Clarification Log (if needed) documenting missing inputs and decisions required.
	3. Responsibilities of the Client
		3.1. Provide SPACEWORK with all relevant project information, including architectural/structural drawings, conceptual façade package, project schedule, and design 		requirements.
		3.2. Provide timely decisions, approvals, and consolidated feedback.
		3.3. Appoint a single point of contact authorized to confirm decisions.
		3.4. Ensure all third-party design inputs (architect/structural/MEP) are coordinated and issued in current revision.
	4. Timeline
		4.1. SPACEWORK will issue deliverables within a mutually agreed timeframe starting from receipt of complete project information and formal appointment.
		4.2. Delays caused by missing information, late approvals, or late feedback will result in corresponding extensions to the timeline and may result in additional fees if 		the delay exceeds thirty (30) calendar days.
	5. Fees and Payment Terms
		5.1. The total fee for the services under this Agreement is a lump sum price mentioned in the B.O.Q, payable in USD cash or USD fresh bank transfer, exclusive of applicable taxes and bank transfer charges.
		5.2. Payment milestones are as follows:
			a. 40% upon signing this Agreement
			b. 40% upon submission of the first implementation drawing package (GA + typical details)
			c. 20% upon submission of the final implementation drawing package incorporating agreed comments
		5.3. Payments must be made within 15 days of receiving an invoice. Any delay in payment will cause a direct delay to project delivery.
	5.4. Submittal and Review Procedure
		a. SPACEWORK shall submit deliverables to the Client based on the milestones above (or every 28 days if the program requires phased submissions).
		b. The Client is entitled to two (2) review cycles per submission, each review period not exceeding seven (7) days.
		c. In case of rejection, SPACEWORK shall revise and resubmit within fourteen (14) days, subject to timely receipt of consolidated comments.
		d. If the Client fails to provide feedback within seven (7) days of submission, the submission shall be deemed approved for invoicing purposes, and SPACEWORK shall be entitled to invoice for the completed milestone.
		e. Requests that constitute scope expansion (e.g., moving to shop drawing/fabrication level, extensive redesign, additional façade areas/zones not included in the concept) may be repriced by SPACEWORK based on the original pricing structure and level of effort.
	6. Intellectual Property
		6.1. All designs, drawings, and documents provided by SPACEWORK remain its intellectual property until full payment is received.
		6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the Project.
		6.3. SPACEWORK retains the right to use non-confidential visuals for portfolio and promotional purposes.
	7. Confidentiality
		7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
	8. Liability and Warranty
		8.1. SPACEWORK will perform its services with professional care and diligence.
		8.2. SPACEWORK is not liable for delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
		8.3. The Client acknowledges that the deliverables are implementation/tender-level and may require further detailing and development by a façade contractor/specialist during execution and shop drawing stages.
	9. Termination
		9.1. Either party may terminate this Agreement only by mutual written agreement.
		9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
	10. Dispute Resolution
		10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
		10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) arbitrators appointed in accordance with said rules.
	11. Governing Law
		This Agreement is governed by the laws of Lebanon.
	12. Entire Agreement
		This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
	13. Amendments
		This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and name = 'Architectural Design Phase (Pre-Execution)';

-- @chunk

-- template: Facade Execution Supervision (Construction Phase)
update public.quote_templates set note = '1. Scope of Work
SPACEWORK agrees to provide the following services to the Client for the project (the “Project”):
1.1. Review & Alignment (Pre-Execution Confirmation)
	a. Review the approved façade design intent package (architect/client/consultant) and contractor’s method statements / ITPs (if available).
	b. Confirm façade intent, system direction, key interfaces, performance targets, and critical risk points prior to execution.
	c. Issue a brief list of clarifications / RFIs required to proceed with execution.
1.2. Site Supervision & Quality Control (Façade Works)
SPACEWORK will provide supervision and technical support during façade execution, including (as applicable):
	a. Periodic site visits to monitor façade installation progress and workmanship quality.
	b. Verification of critical installation stages (anchors/brackets, waterproofing interfaces, glazing setting, movement joints, sealant works, etc.).
	c. Review of contractor submissions relevant to execution (method statements, material submittals, mockup/test plans) at a supervision level.
	d. Snagging / punch-list issuance for façade works and follow-up on closures.
	e. Technical advice to resolve site issues and conflicts, without redesigning the approved concept unless instructed.
1.3. Meetings & Reporting
	a. Attendance of periodic coordination meetings (remote or on-site as agreed on a monthly basis).
	b. Issuance of site visit reports after each visit, highlighting observations, non-conformities, action items, and recommendations.
1.4. Explicit Exclusions
Unless agreed by written amendment, the following are excluded:
	a. Full-time resident supervision (24/7 presence) unless specifically stated.
	b. Shop drawings, fabrication drawings, cutting lists, CNC files, optimization schedules.
	c. Structural calculations, design stamping, authority submissions.
	d. Procurement, supplier nomination, commercial tender evaluation, contract administration under FIDIC (unless added).
	e. Laboratory testing services (unless added), and third-party inspection certifications.
	f. As-built drawings (unless added).
	g. Responsibility for contractor means/methods, safety, scaffolding, lifting plans, and site HSE compliance.
2. Deliverables
2.1. Site Visit Reports (after each visit) with photos (if permitted), observations, NCR notes (if needed), and action items.
2.2. Façade Snag / Punch List (periodic and/or at substantial completion) and closure tracking.
2.3. RFI / Clarification Log (if needed) documenting technical queries and agreed resolutions.
2.4. Close-Out Note confirming façade completion status from a supervision standpoint (optional, if required).
3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details and updated drawings, site schedule, contractor program, and façade contractor contact details.
3.2. Ensure SPACEWORK receives timely access to site, scaffolding/working platforms, and safe access arrangements by the contractor.
3.3. Ensure timely communication, decisions, and consolidated feedback to facilitate smooth execution.
3.4. Appoint a single point of contact authorized to confirm decisions and coordinate visits.
3.5. Ensure the contractor implements corrective actions and provides responses to observations within agreed timeframes.
4. Timeline
4.1. SPACEWORK services shall commence upon formal appointment and receipt of required project information, and shall continue for the agreed supervision duration.
4.2. Delays due to site access limitations, lack of information, or suspension of works may result in schedule adjustments. If works are suspended for more than thirty (30) calendar days, SPACEWORK reserves the right to reprice or remobilize based on remaining scope.
5. Fees and Payment Terms
5.1. The total fee for the services under this Agreement is a lump sum price mentioned in the B.O.Q, payable in USD cash or USD fresh bank transfer, exclusive of applicable taxes and bank transfer charges.
	a. 30% upon signing this Agreement (mobilization).
	b. 30% upon completion of the first 30–40% of façade installation (or first major elevation/zone).
	c. 30% upon substantial completion of façade installation.
	d. 10% upon final snag closure and close-out report.
5.3. Payments & Delays
Payments must be made within 15 days of receiving an invoice. Any delay in payment may result in suspension of supervision services and corresponding delay to the Project.
5.4. Site Visit Regime
SPACEWORK supervision includes maximum of 2 site visits per month.
Additional visits beyond the agreed number shall be charged at USD 500 / visit.
5.5. Reporting and Response Procedure
	a. SPACEWORK shall issue a report within 48–72 hours after each site visit.
	b. The Client/Contractor shall respond to observations within seven (7) days, confirming corrective actions and timelines.
	c. Repeated non-compliance or scope escalation may require repricing based on effort and frequency of visits.
6. Intellectual Property
6.1. All documents and reports provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the Project.
6.3. SPACEWORK retains the right to use non-confidential visuals for portfolio and promotional purposes.
7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
8. Liability and Warranty (Adjusted for Supervision)
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not responsible for the contractor’s workmanship, means and methods, site safety, sequencing, or compliance with HSE requirements.
8.3. SPACEWORK supervision is advisory/observational and does not relieve the contractor of its obligations to execute works in accordance with contract documents and applicable standards.
8.4. SPACEWORK is not liable for delays or costs arising from factors beyond its control, including Client-provided information, contractor performance, or third-party dependencies.'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and name = 'Facade Execution Supervision (Construction Phase)';

-- @chunk

-- quotation S00021
update public.sale_orders set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located in Beirut, specializing in façade consulting, engineering, and design.
	1. Scope of Work
All mentioned works in the above BOQ for Sonam - Dakar project except the following exclusions:
1. Full façade shop drawings.
2. Fabrication drawings.
3. Installation drawings.
4. Stamped structural calculations.
5. Glass structural calculations.
6. Laboratory testing fees.
7. Site supervision.
8. Authority submission and approval responsibility.
9. Travel and accommodation.
10. Redesign due to architectural, structural, client, authority, or contractor changes.
	2. Payment Terms and Milestones

Milestone | Description | Percentage | Amount USD
1 | Advance payment upon appointment / contract signature | 25% | 2,700
2 | Completion of concept drawing / material submittal review round | 25% | 2,700
3 | Completion of material submittal | 25% | 2,700
4 | Submission of façade technical specification and recommendations | 25% | 2,700
	3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project information, including architectural/structural drawings, conceptual façade package, project schedule, and design requirements.
3.2. Provide timely decisions, approvals, and consolidated feedback.
3.3. Appoint a single point of contact authorized to confirm decisions.
3.4. Ensure all third-party design inputs (architect/structural/MEP) are coordinated and issued in current revision.
	4. Timeline
4.1. SPACEWORK will issue deliverables within a mutually agreed time frame starting from receipt of complete project information and formal appointment.
4.2. Delays caused by missing information, late approvals, or late feedback will result in corresponding extensions to the timeline and may result in additional fees if the delay exceeds thirty (30) calendar days.
	5. Fees and Payment Terms
5.1. All invoices shall be paid within 7 calendar days from invoice date.
5.2. Work on each milestone may be paused if the corresponding payment is delayed.
5.3. Any bank charges, transfer fees, or withholding taxes shall be borne by the Client.
5.4. Payments shall be made in fresh USD by bank transfer or cash payment, as agreed between parties.
	6. Submittal and Review Procedure
6.1. SPACEWORK shall submit deliverables to the Client based on the milestones above (or every 28 days if the program requires phased submissions).
6.2. The Client is entitled to two (2) review cycles per submission, each review period not exceeding seven (7) days.
6.3. In case of rejection, SPACEWORK shall revise and resubmit within fourteen (14) days, subject to timely receipt of consolidated comments.
6.4. If the Client fails to provide feedback within seven (7) days of submission, the submission shall be deemed approved for invoicing purposes, and SPACEWORK shall be entitled to invoice for the completed milestone.
6.5. Requests that constitute scope expansion (e.g., moving to shop drawing/fabrication level, extensive redesign, additional façade areas/zones not included in the concept) may be repriced by SPACEWORK based on the original pricing structure and level of effort.
	7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
	8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are implementation/tender-level and may require further detailing and development by a façade contractor/specialist during execution and shop drawing stages.
	9. Termination
9.1. Either party may terminate this Agreement only by mutual written agreement.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
10. Intellectual Property
10.1. All designs, drawings, and documents provided by SPACEWORK remain its intellectual property until full payment is received.
10.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the Project.
10.3. SPACEWORK retains the right to use non-confidential visuals for portfolio and promotional purposes.
	11. Governing Law
This Agreement is governed by the laws of Lebanon.
	12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
	13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00021';

-- @chunk

-- quotation S00020
update public.sale_orders set narration = '1. Scope of Work
SPACEWORK agrees to provide the following services to the Client for the project (the “Project”):
1.1. Review & Alignment (Pre-Execution Confirmation)
	a. Review the approved façade design intent package (architect/client/consultant) and contractor’s method statements / ITPs (if available).
	b. Confirm façade intent, system direction, key interfaces, performance targets, and critical risk points prior to execution.
	c. Issue a brief list of clarifications / RFIs required to proceed with execution.
1.2. Site Supervision & Quality Control (Façade Works)
SPACEWORK will provide supervision and technical support during façade execution, including (as applicable):
	a. Periodic site visits to monitor façade installation progress and workmanship quality.
	b. Verification of critical installation stages (anchors/brackets, waterproofing interfaces, glazing setting, movement joints, sealant works, etc.).
	c. Review of contractor submissions relevant to execution (method statements, material submittals, mockup/test plans) at a supervision level.
	d. Snagging / punch-list issuance for façade works and follow-up on closures.
	e. Technical advice to resolve site issues and conflicts, without redesigning the approved concept unless instructed.
1.3. Meetings & Reporting
	a. Attendance of periodic coordination meetings (remote or on-site as agreed on a monthly basis).
	b. Issuance of site visit reports after each visit, highlighting observations, non-conformities, action items, and recommendations.
1.4. Explicit Exclusions
Unless agreed by written amendment, the following are excluded:
	a. Full-time resident supervision (24/7 presence) unless specifically stated.
	b. Shop drawings, fabrication drawings, cutting lists, CNC files, optimization schedules.
	c. Structural calculations, design stamping, authority submissions.
	d. Procurement, supplier nomination, commercial tender evaluation, contract administration under FIDIC (unless added).
	e. Laboratory testing services (unless added), and third-party inspection certifications.
	f. As-built drawings (unless added).
	g. Responsibility for contractor means/methods, safety, scaffolding, lifting plans, and site HSE compliance.
2. Deliverables
2.1. Site Visit Reports (after each visit) with photos (if permitted), observations, NCR notes (if needed), and action items.
2.2. Façade Snag / Punch List (periodic and/or at substantial completion) and closure tracking.
2.3. RFI / Clarification Log (if needed) documenting technical queries and agreed resolutions.
2.4. Close-Out Note confirming façade completion status from a supervision standpoint (optional, if required).
3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details and updated drawings, site schedule, contractor program, and façade contractor contact details.
3.2. Ensure SPACEWORK receives timely access to site, scaffolding/working platforms, and safe access arrangements by the contractor.
3.3. Ensure timely communication, decisions, and consolidated feedback to facilitate smooth execution.
3.4. Appoint a single point of contact authorized to confirm decisions and coordinate visits.
3.5. Ensure the contractor implements corrective actions and provides responses to observations within agreed timeframes.
4. Timeline
4.1. SPACEWORK services shall commence upon formal appointment and receipt of required project information, and shall continue for the agreed supervision duration.
4.2. Delays due to site access limitations, lack of information, or suspension of works may result in schedule adjustments. If works are suspended for more than thirty (30) calendar days, SPACEWORK reserves the right to reprice or remobilize based on remaining scope.
5. Fees and Payment Terms
5.1. The total fee for the services under this Agreement is a lump sum price mentioned in the B.O.Q, payable in USD cash or USD fresh bank transfer, exclusive of applicable taxes and bank transfer charges.
	a. 30% upon signing this Agreement (mobilization).
	b. 30% upon completion of the first 30–40% of façade installation (or first major elevation/zone).
	c. 30% upon substantial completion of façade installation.
	d. 10% upon final snag closure and close-out report.
5.3. Payments & Delays
Payments must be made within 15 days of receiving an invoice. Any delay in payment may result in suspension of supervision services and corresponding delay to the Project.
5.4. Site Visit Regime
SPACEWORK supervision includes maximum of 2 site visits per month.
Additional visits beyond the agreed number shall be charged at USD 500 / visit.
5.5. Reporting and Response Procedure
	a. SPACEWORK shall issue a report within 48–72 hours after each site visit.
	b. The Client/Contractor shall respond to observations within seven (7) days, confirming corrective actions and timelines.
	c. Repeated non-compliance or scope escalation may require repricing based on effort and frequency of visits.
6. Intellectual Property
6.1. All documents and reports provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the Project.
6.3. SPACEWORK retains the right to use non-confidential visuals for portfolio and promotional purposes.
7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
8. Liability and Warranty (Adjusted for Supervision)
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not responsible for the contractor’s workmanship, means and methods, site safety, sequencing, or compliance with HSE requirements.
8.3. SPACEWORK supervision is advisory/observational and does not relieve the contractor of its obligations to execute works in accordance with contract documents and applicable standards.
8.4. SPACEWORK is not liable for delays or costs arising from factors beyond its control, including Client-provided information, contractor performance, or third-party dependencies.
9. Termination
9.1. Either party may terminate this Agreement only by mutual written agreement.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) arbitrators appointed in accordance with said rules.
11. Governing Law
This Agreement is governed by the laws of Lebanon.
12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
13. Amendments
This Agreement may only be amended in writing and signed by both parties.
IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00020';

-- @chunk

-- quotation S00019
update public.sale_orders set narration = '1. Scope of Work
SPACEWORK agrees to provide the following services to the Client for the project (the “Project”):
1.1. Review & Alignment (Concept Confirmation)
	a. Review the existing façade conceptual design package issued by others (architect/client).
	b. Confirm façade intent, system direction, and key constraints (interfaces, performance targets, typical details).
	c. Issue a brief list of clarifications / RFIs required to proceed.
1.2. Façade Implementation / Tender-Level Drawings (Not Shop Drawings)
SPACEWORK will develop façade implementation drawings intended for coordination and tendering, including (as applicable):
	a. General Arrangement façade elevations and typical zones.
	b. Typical sections/details at key junctions (slab edge, parapet, head/sill/jamb, corner, movement joints, interfaces with waterproofing, etc.).
	c. Typical anchoring intent and load-path concept (indicative only).
	d. Interface coordination notes with structure, architecture, and MEP penetrations (as required).
	e. Material/system intent notes suitable for tender coordination.
1.3. Technical Assistance & Coordination
	a. Periodic design coordination meetings (remote) and written responses to Client queries.
	b. One round of tender clarification support based on submitted implementation package.
1.4. Explicit Exclusions
Unless agreed by written amendment, the following are excluded:
	a. Shop drawings, fabrication drawings, assembly drawings, and installation method statements.
	b. Full structural calculations, stamping, or third-party authority submissions.
	c. Detailed cutting lists, CNC files, or optimization schedules.
	d. Full procurement support, supplier nomination, or tender evaluation (unless added).
	e. Site supervision / inspections / as-built drawings.
2. Deliverables
2.1. Façade Implementation Drawing Set (tender/coordination level, not shop drawings), including typical elevations/sections/details and key interfaces.
2.2. Implementation Notes (if needed) summarizing system intent, interfaces, and assumptions.
2.3. RFI / Clarification Log (if needed) documenting missing inputs and decisions required.
3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project information, including architectural/structural drawings, conceptual façade package, project schedule, and design requirements.
3.2. Provide timely decisions, approvals, and consolidated feedback.
3.3. Appoint a single point of contact authorized to confirm decisions.
3.4. Ensure all third-party design inputs (architect/structural/MEP) are coordinated and issued in current revision.
4. Timeline
4.1. SPACEWORK will issue deliverables within a mutually agreed timeframe starting from receipt of complete project information and formal appointment.
4.2. Delays caused by missing information, late approvals, or late feedback will result in corresponding extensions to the timeline and may result in additional fees if the delay exceeds thirty (30) calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services under this Agreement is a lump sum price mentioned in the B.O.Q, payable in USD cash or USD fresh bank transfer, exclusive of applicable taxes and bank transfer charges.
5.2. Payment milestones are as follows:
	a. 40% upon signing this Agreement
	b. 40% upon submission of the first implementation drawing package (GA + typical details)
	c. 20% upon submission of the final implementation drawing package incorporating agreed comments
5.3. Payments must be made within 15 days of receiving an invoice. Any delay in payment will cause a direct delay to project delivery.
5.4. Submittal and Review Procedure
	a. SPACEWORK shall submit deliverables to the Client based on the milestones above (or every 28 days if the program requires phased submissions).
	b. The Client is entitled to two (2) review cycles per submission, each review period not exceeding seven (7) days.
	c. In case of rejection, SPACEWORK shall revise and resubmit within fourteen (14) days, subject to timely receipt of consolidated comments.
	d. If the Client fails to provide feedback within seven (7) days of submission, the submission shall be deemed approved for invoicing purposes, and SPACEWORK shall be entitled to invoice for the completed milestone.
	e. Requests that constitute scope expansion (e.g., moving to shop drawing/fabrication level, extensive redesign, additional façade areas/zones not included in the concept) may be repriced by SPACEWORK based on the original pricing structure and level of effort.
6. Intellectual Property
6.1. All designs, drawings, and documents provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the Project.
6.3. SPACEWORK retains the right to use non-confidential visuals for portfolio and promotional purposes.
7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are implementation/tender-level and may require further detailing and development by a façade contractor/specialist during execution and shop drawing stages.
9. Termination
9.1. Either party may terminate this Agreement only by mutual written agreement.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) arbitrators appointed in accordance with said rules.
11. Governing Law
This Agreement is governed by the laws of Lebanon.
12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00019';

-- @chunk

-- quotation S00018
update public.sale_orders set narration = '1. PARTIES
1.1 Main Contractor
ALGECO LTD
1.2 Subcontractor
SPACE WORK  SARL
(hereinafter referred to as “SPACE WORK” or the “Subcontractor”)
ALGECO and SPACE WORK may each be referred to as a “Party” and collectively as the “Parties.”
This Agreement governs the subcontracted works related to the installation of Aluminum Composite Panels (ACP) on the building façade for the above-mentioned project.
3. SCOPE OF WORK
SPACE WORK shall provide all labor, supervision, tools, small equipment, consumables, and site execution resources necessary to complete the ACP installation works in accordance with the project requirements, including but not limited to:

4. CONTRACT DOCUMENTS (ORDER OF PRECEDENCE)
This Agreement shall be read together with the following documents (collectively, the “Contract Documents”):
- This Subcontract Agreement

- Scope of Work / BOQ / Commercial Offer (Annex A)

- Approved drawings and details (Annex B)

In case of conflict, the order of precedence above shall apply unless otherwise agreed in writing.
5. CONTRACT PRICE

- If VAT is applicable, it shall be added to the certified amount at the prevailing legal rate and against valid tax invoice.

6. PAYMENT TERMS
6.1 Payment Schedule (Recommended)
Payments shall be made by ALGECO to SPACE WORK as follows:
Option A – Progress Payment Basis (Most common):
- [80]% Advance payment upon signing (against advance guarantee, if required)

- [10]% Monthly progress payments based on approved installed quantities and certification

- [10]% Retention

Option B – No Advance:
- Monthly progress payments based on approved installed quantities and certification

- Retention applied as stated below

6.2 Monthly Progress Claims
SPACE WORK shall submit monthly progress invoices/claims with supporting documents, including:
- Measured installed quantities

- Site progress sheets signed by ALGECO representative

- Photos / progress report (if requested)

- Any required QA/QC records

ALGECO shall review and certify the payable amount within [7–14] calendar days from receipt of complete documentation.
6.3 Payment Due Date
Certified amounts shall be paid within [30] calendar days from:
- receipt of valid invoice by ALGECO, and

- certification of the work done, and

- receipt of payment by ALGECO from the Client (if “pay-when-paid” applies and is enforceable under applicable law).

Note (optional clause): Payment by ALGECO to SPACE WORK is subject to ALGECO receiving corresponding payment from the Client for the relevant executed works (“pay-when-paid”), to the extent permitted by applicable law.
6.4 Deductions
ALGECO may deduct from amounts due to SPACE WORK any documented and justified costs arising from:
- Rework due to defective installation by SPACE WORK

- Damage caused by SPACE WORK personnel

- Back charges for safety violations (if contractually established and documented)

- Approved penalties/liquidated damages attributable solely to SPACE WORK (if expressly agreed)

7. TIME FOR COMPLETION AND PROGRAM
7.1 Commencement
SPACE WORK shall commence the works within [30] days from receipt of:
- written notice to proceed from ALGECO,

- access to work fronts,

- approved drawings relevant to the area, and

- required materials delivered to the work area (if supply is by ALGECO).

7.2 Completion Period
SPACE WORK shall complete its subcontract works within [30] calendar days / weeks in accordance with the project schedule and sequencing plan issued by ALGECO.
7.3 Work Sequence
SPACE WORK shall perform the works in accordance with ALGECO’s site instructions and project sequencing, including phased handovers and priority areas.
7.4 Delays / EOT
SPACE WORK shall be entitled to reasonable extension of time (without cost unless expressly agreed) for delays caused by:
- Late release of drawings

- Lack of access / obstruction by others

- Delay in material supply by ALGECO or others

- Variations instructed by ALGECO

- Force majeure events

- Suspension by ALGECO not caused by SPACE WORK default

Any delay event must be notified in writing within [2–5] days of occurrence.
8. RESPONSIBILITIES OF ALGECO (CONTRACTOR)
ALGECO shall:
a. Provide access to work fronts as per agreed schedule.
b. Provide approved drawings/details and instructions for execution.
c. Coordinate site interfaces with other trades.

9. RESPONSIBILITIES OF SPACE WORK (SUBCONTRACTOR)
SPACE WORK shall:
a. Execute the works in a professional and workmanlike manner in accordance with approved drawings, specifications, and good industry practice.
b. Provide qualified supervisors, foremen, and installers experienced in ACP façade installation.
10. Handover on Termination
Upon termination, SPACE WORK shall vacate the site in an orderly manner, hand over completed works, and submit final measurement and claim for executed works.'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00018';

-- @chunk

-- quotation S00016
update public.sale_orders set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 Tubular Louvers and Typical Curtainwall for Entrance Block

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon signing this Agreement.
	b. 10% upon first submission of works
	c. 10% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL

Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00016';

-- @chunk

-- quotation S00015
update public.sale_orders set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 Aluminum Handrail on Roof

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon signing this Agreement.
	b. 10% upon first submission of works
	c. 10% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL

Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00015';

-- @chunk

-- quotation S00014
update public.sale_orders set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 Ladder in shaft

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon signing this Agreement.
	b. 10% upon first submission of works
	c. 10% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL

Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00014';

-- @chunk

-- quotation S00013
update public.sale_orders set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 Steel Catwalks

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon signing this Agreement.
	b. 10% upon first submission of works
	c. 10% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL

Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00013';

-- @chunk

-- quotation S00012
update public.sale_orders set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 Aluminum Frame
	1.1.2 Glass
	1.1.3 Fastner Connections
	1.1.4 Chemical Connections

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon signing this Agreement.
	b. 10% upon first submission of works
	c. 10% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL

Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00012';

-- @chunk

-- quotation S00011
update public.sale_orders set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 One Type of Fixed Louver
	1.1.2 One type of Sliding Louver

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon quotation approval
	b. 20% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL

Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00011';

-- @chunk

-- quotation S00007
update public.sale_orders set narration = 'SPACEWORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design;
1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Façade Technical and Engineering design, submittals up to 6 revision, limited to the BOQ items attached, including and limited to :
	a. Façade concept drawings, Consulting and engineering services related to façade design.
	b. Shop Drawings
	c. Method Statments
	d. Calculation Notes and Reports
	e. Coordination meeting with Client and Consultant to ensure all approvals
2. Deliverables
2.1. Complete set of approed Shop Drawings
2.2. Complete set of calculation Notes
2.3 Complete set of Material and Method statments
2.4 Engineering submittal log
3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements, and all complete works.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
4. Exclusions
If any of the below scopes are needed they will discussed at a later stage in a different contract.
4.1. Fabrication Drawings, Fabrication quality control, Fabrication Quantity Control, Cutting Lists, Assembly Drawings
4.2. Project Management responsibilites related to budget, schedules, quality and quantity control, procurement, logistics, resource managment.
4.3. Site Engineeting responsibilites related to Site measurments, surveying, site managments, construciton control, inventory management.
5. Timeline
5.1. SPACEWORK will provide the agreed deliverables within 3 months if the client replies to submittals within 1 calendar week, any holidays or delyed replies will directly affect the scope completion date, the start will be considered upon receiving all necessary project information from the Client, and down payment is received.
5.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
6. Fees and Payment Terms
6.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
6.2. Payment milestones are as follows:
	a. 25% upon signing this Agreement. (must be paid if full)
	b. 25% upon submission of Typical Details and Basis of design. (can be gradually invoiced, based on progress reports)
	c. 20% upon submission of Shop Drawings (can be gradually invoiced, based on progress reports)
	d. 20% upon submission of Calculation notes and Method Statements. (can be gradually invoiced, based on progress reports)
	e. 10% Remaining balance upon receiving approvals.
6.3. Payments must be made within 15 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
6.4 Submittals Procedures:

	SPACE WORK shall prepare and submit deliverables to the Client for approval every 14 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to six times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the related works.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.
7. Intellectual Property
7.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
7.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
7.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.
8. Confidentiality
8.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
9. Liability and Warranty
9.1. SPACEWORK will perform its services with professional care and diligence.
9.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
9.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.
10. Termination
10.1. Either party may not terminate this Agreement, unless agreed by both parties.
10.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
11. Dispute Resolution
11.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
11.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

12. Governing Law
This Agreement is governed by the laws of Lebanon.
13. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
14. Amendments
This Agreement may only be amended in writing and signed by both parties.
IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00007';

-- @chunk

-- quotation S00006
update public.sale_orders set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 Aluminum Frame
	1.1.2 Glass
	1.1.3 Fastner Connections
	1.1.4 Chemical Connections

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.

4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.

5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon signing this Agreement.
	b. 10% upon first submission of works
	c. 10% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00006';

-- @chunk

-- quotation S00004
update public.sale_orders set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design;
1. Scope of Work
SPACE WORK SARL agrees to provide the following services to the Client:
1.1. Façade architectural basis of design, including:
	a. Façade concept drawings.
	b. Project specifications.
1.2. Consulting and engineering services related to façade design.
2. Deliverables
2.1. General façade concept drawings reflecting the agreed-upon design approach.
2.2. Comprehensive project specifications outlining material requirements, performance criteria, testing, and other relevant details.

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.

4. Timeline
4.1. SPACE WORK SARL  will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 25% upon signing this Agreement.
	b. 25% upon submission of Materials and systems
	c. 20% upon submission of specifications
	d. 20% upon submission of Facade General Drawings
	e. 10% Remaining balance upon delivery of final drawings and specifications.

5.3. Payments must be made within 15 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submital Procedures:
SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.
12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
13. Amendments
This Agreement may only be amended in writing and signed by both parties.
IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00004';

-- @chunk

-- quotation S00002
update public.sale_orders set narration = 'Terms and Conditions

SPACEWORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design;
1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Façade architectural basis of design, including:
	a. Façade concept drawings.
	b. Project specifications.
1.2. Consulting and engineering services related to façade design.
2. Deliverables
2.1. General façade concept drawings reflecting the agreed-upon design approach.
2.2. Comprehensive project specifications outlining material requirements, performance criteria, testing, and other relevant details.
3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACEWORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 25% upon signing this Agreement.
	b. 25% upon submission of Materials and systems
	c. 20% upon submission of specifications
	d. 20% upon submission of Facade General Drawings
	e. 10% Remaining balance upon delivery of final drawings and specifications.
5.3. Payments must be made within 15 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
6. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.
7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.
9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the rules of chosen arbitration body in location.
11. Governing Law
This Agreement is governed by the laws of Lebanon.
12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
13. Amendments
This Agreement may only be amended in writing and signed by both parties.
IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'S00002';

-- @chunk

-- invoice INV/2026/00003
update public.invoices set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located in Beirut, specializing in façade consulting, engineering, and design.
	1. Scope of Work
All mentioned works in the above BOQ for Sonam - Dakar project except the following exclusions:
1. Full façade shop drawings, Fabrication drawings, Installation drawings, Stamped structural calculations, Glass structural calculations, Laboratory testing fees, Site supervision, Authority submission and approval responsibility, Travel and accommodation,Redesign due to architectural, structural, client, authority, or contractor changes.
	2. Payment Terms and Milestones

Milestone | Description | Percentage | Amount USD
1 | Advance payment upon appointment / contract signature | 25% | 2,500
2 | Completion of concept drawing / material submittal review round | 25% | 2,500
3 | Completion of material submittal | 25% | 2,500
4 | Submission of façade technical specification and recommendations | 25% | 2,500
	3. Responsibilities of the Client
Provide SPACEWORK with all relevant project information, including architectural/structural drawings, conceptual façade package, project schedule, and design requirements. Provide timely decisions, approvals, and consolidated feedback. Appoint a single point of contact authorized to confirm decisions. Ensure all third-party design inputs (architect/structural/MEP) are coordinated and issued in current revision.
	4. Timeline
SPACEWORK will issue deliverables within a mutually agreed time frame starting from receipt of complete project information and formal appointment.  Delays caused by missing information, late approvals, or late feedback will result in corresponding extensions to the timeline and may result in additional fees if the delay exceeds thirty (30) calendar days.
	5. Fees and Payment Terms
5.1. All invoices shall be paid within 7 calendar days from invoice date.
5.2. Work on each milestone may be paused if the corresponding payment is delayed.
5.3. Any bank charges, transfer fees, or withholding taxes shall be borne by the Client.
5.4. Payments shall be made in fresh USD by bank transfer or cash payment, as agreed between parties.
	6. Submittal and Review Procedure
6.1. SPACEWORK shall submit deliverables to the Client based on the milestones above (or every 28 days if the program requires phased submissions).
6.2. The Client is entitled to two (2) review cycles per submission, each review period not exceeding seven (7) days.
6.3. In case of rejection, SPACEWORK shall revise and resubmit within fourteen (14) days, subject to timely receipt of consolidated comments.
6.4. If the Client fails to provide feedback within seven (7) days of submission, the submission shall be deemed approved for invoicing purposes, and SPACEWORK shall be entitled to invoice for the completed milestone.
6.5. Requests that constitute scope expansion (e.g., moving to shop drawing/fabrication level, extensive redesign, additional façade areas/zones not included in the concept) may be repriced by SPACEWORK based on the original pricing structure and level of effort.
	7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
	8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are implementation/tender-level and may require further detailing and development by a façade contractor/specialist during execution and shop drawing stages.
	9. Termination
9.1. Either party may terminate this Agreement only by mutual written agreement.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
10. Intellectual Property
10.1. All designs, drawings, and documents provided by SPACEWORK remain its intellectual property until full payment is received.
10.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the Project.
10.3. SPACEWORK retains the right to use non-confidential visuals for portfolio and promotional purposes.
	11. Governing Law
This Agreement is governed by the laws of Lebanon.
	12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
	13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'INV/2026/00003';

-- @chunk

-- invoice INV/2026/00002
update public.invoices set narration = 'Terms & Conditions: https://www.spacework.ai/terms'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'INV/2026/00002';

-- @chunk

-- invoice INV/2026/00001
update public.invoices set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design;
1. Scope of Work
SPACE WORK SARL agrees to provide the following services to the Client:
1.1. Façade architectural basis of design, including:
	a. Façade concept drawings.
	b. Project specifications.
1.2. Consulting and engineering services related to façade design.
2. Deliverables
2.1. General façade concept drawings reflecting the agreed-upon design approach.
2.2. Comprehensive project specifications outlining material requirements, performance criteria, testing, and other relevant details.

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.

4. Timeline
4.1. SPACE WORK SARL  will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 25% upon signing this Agreement.
	b. 25% upon submission of Materials and systems
	c. 20% upon submission of specifications
	d. 20% upon submission of Facade General Drawings
	e. 10% Remaining balance upon delivery of final drawings and specifications.

5.3. Payments must be made within 15 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submital Procedures:
SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.
12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
13. Amendments
This Agreement may only be amended in writing and signed by both parties.
IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'INV/2026/00001';

-- @chunk

-- invoice INV/2025/00009
update public.invoices set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 Aluminum Frame
	1.1.2 Glass
	1.1.3 Fastner Connections
	1.1.4 Chemical Connections

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon signing this Agreement.
	b. 10% upon first submission of works
	c. 10% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL

Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'INV/2025/00009';

-- @chunk

-- invoice INV/2025/00008
update public.invoices set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design;
1. Scope of Work
SPACE WORK SARL agrees to provide the following services to the Client:
1.1. Façade architectural basis of design, including:
	a. Façade concept drawings.
	b. Project specifications.
1.2. Consulting and engineering services related to façade design.
2. Deliverables
2.1. General façade concept drawings reflecting the agreed-upon design approach.
2.2. Comprehensive project specifications outlining material requirements, performance criteria, testing, and other relevant details.

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.

4. Timeline
4.1. SPACE WORK SARL  will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 25% upon signing this Agreement.
	b. 25% upon submission of Materials and systems
	c. 20% upon submission of specifications
	d. 20% upon submission of Facade General Drawings
	e. 10% Remaining balance upon delivery of final drawings and specifications.

5.3. Payments must be made within 15 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submital Procedures:
SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.
8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.
10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.
12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.
13. Amendments
This Agreement may only be amended in writing and signed by both parties.
IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'INV/2025/00008';

-- @chunk

-- invoice INV/2025/00007
update public.invoices set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 One Type of Fixed Louver
	1.1.2 One type of Sliding Louver

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.
4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.
5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon quotation approval
	b. 20% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL

Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'INV/2025/00007';

-- @chunk

-- invoice RINV/2025/00001
update public.invoices set narration = 'SPACEWORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design;
1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Façade architectural basis of design, including:
	a. Façade concept drawings.
	b. Project specifications.
1.2. Consulting and engineering services related to façade design.
5. Fees and Payment
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones being Covered
	a. 25% upon signing this Agreement.

5.3. Payments must be made within 15 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.

For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'RINV/2025/00001';

-- @chunk

-- invoice INV/2025/00002
update public.invoices set narration = 'SPACE WORK SARL (hereinafter referred to as “SPACE WORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design.

1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Structural Calculation Note for:
	1.1.1 Aluminum Frame
	1.1.2 Glass
	1.1.3 Fastner Connections
	1.1.4 Chemical Connections

3. Responsibilities of the Client
3.1. Provide SPACEWORK with all relevant project details, including architectural plans, project scope, timelines, and specific requirements.
3.2. Ensure timely communication and feedback to facilitate smooth project execution.
3.3. Obtain necessary approvals and permits for project execution, if required.

4. Timeline
4.1. SPACE WORK will provide the agreed deliverables within specified time frame from the date of receiving all necessary project information from the Client.
4.2. Delays caused by the Client’s failure to provide required information or feedback will result in corresponding adjustments to the timeline, and may result in additional charges if the delay exceeds thirty calendar days.

5. Fees and Payment Terms
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones are as follows:
	a. 80% upon signing this Agreement.
	b. 10% upon first submission of works
	c. 10% upon receiving approval
5.3. Payments must be made within 7 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.
5.4 Submittals Procedures:
	SPACE WORK shall prepare and submit deliverables to the Client for approval every 28 days, aligning with the specified milestones.
	The Client is entitled to review each submission up to two times, with each review period not exceeding seven (7) days. In case of rejection, SPACE WORK shall revise and resubmit within fourteen (14) days.
	If the Client fails to provide feedback within seven (7) days; failure to respond within (7) days submission shall be deemed approved, and SPACE WORK shall be entitled to invoice for the completed work.
	SPACE WORK reserves the right to reprice the work, within reasonable limits, based on the original contract pricing structure, should substantial revisions be required beyond the agreed-upon scope.

5. Intellectual Property
6.1. All designs, drawings, and specifications provided by SPACEWORK remain its intellectual property until full payment is received.
6.2. Upon full payment, the Client receives a non-exclusive license to use the deliverables solely for the specified project.
6.3. SPACEWORK retains the right to use the designs for promotional and portfolio purposes.

7. Confidentiality
7.1. Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent, except as required by law.

8. Liability and Warranty
8.1. SPACEWORK will perform its services with professional care and diligence.
8.2. SPACEWORK is not liable for any project delays or costs arising from factors beyond its control, including Client-provided information or third-party dependencies.
8.3. The Client acknowledges that the deliverables are conceptual and may require further detailing and adjustment by third parties during execution.

9. Termination
9.1. Either party may not terminate this Agreement, unless agreed by both parties.
9.2. Upon termination, the Client will compensate SPACEWORK for all work completed up to the termination date.

10. Dispute Resolution
10.1. Any disputes arising from this Agreement will be resolved amicably through negotiations.
10.2. If negotiations fail, disputes will be subject to arbitration under the Rules of Conciliation and Arbitration at the Beirut Chamber of Commerce and Industry by three (3) Arbitrators appointed in accordance with the said rules. The said arbitrators shall have full power to open up, review and revise any decision, opinion, instruction, determination, certificate or valuation of the Engineer related to the dispute.

11. Governing Law
This Agreement is governed by the laws of Lebanon.

12. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, understandings, or representations.

13. Amendments
This Agreement may only be amended in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'INV/2025/00002';

-- @chunk

-- invoice INV/2025/00001
update public.invoices set narration = 'SPACEWORK SARL (hereinafter referred to as “SPACEWORK”), a company duly registered under the laws of Lebanon, with its principal place of business located at Beirut, specializing in façade consulting, engineering, and design;
1. Scope of Work
SPACEWORK agrees to provide the following services to the Client:
1.1. Façade architectural basis of design, including:
	a. Façade concept drawings.
	b. Project specifications.
1.2. Consulting and engineering services related to façade design.
5. Fees and Payment
5.1. The total fee for the services provided under this Agreement is mentioned above and should be settled in U.S.D Cash or USD Fresh Bank Transfer, exclusive of applicable taxes and transfer fees.
5.2. Payment milestones being Covered
	a. 25% upon signing this Agreement.

5.3. Payments must be made within 15 days of receiving an invoice, and payment delay will cause a direct delay to the project delivery.

For SPACEWORK SARL
Kevin J. Gemayel
Managing Director'
 where company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
   and number = 'INV/2025/00001';

-- @chunk

-- a milestone row should now be one line with three separators in it
select o.number,
       (length(o.narration) - length(replace(o.narration, ' | ', ''))) / 3 as cells_joined,
       length(o.narration) as chars
from public.sale_orders o
where o.company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
  and coalesce(o.narration, '') <> ''
order by o.number;
