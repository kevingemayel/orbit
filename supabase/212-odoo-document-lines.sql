-- 212: the lines. 210 brought the documents over and left their children behind:
-- sale orders with no lines at all, purchase orders the same, and one summary line
-- per invoice instead of what was actually billed. Odoo holds 47 sale order lines,
-- 9 purchase order lines and 68 invoice lines; this loads all of them, read from
-- the live instance on 10 Oct 2026.
--
-- Sections and notes (Odoo's line_section and line_note) come across as zero
-- quantity, zero price lines so a quotation still reads the way it was written.
-- Invoice totals are untouched: the placeholder line is replaced by the real ones,
-- which sum to the same amount, and the guard on a posted invoice only refuses a
-- change to its amounts, contact, date or number.
do $lines$
declare
  v_co uuid := '183e96d4-afd9-4ca4-b311-2e03e0c36ffb';   -- Space Work S.A.R.L
  n_so int := 0; n_po int := 0; n_inv int := 0; bad text := '';
begin
  -- ------------------------------------------------------------ sale orders
  create temporary table t_so(number text, seq int, name text, product text, qty numeric, price numeric, subtotal numeric, kind text) on commit drop;
  insert into t_so(number, seq, name, product, qty, price, subtotal, kind) values
('S00021',10,'Architectural Design Phase (Pre-Execution) Curtain wall 1- Review system concept 2- typical interfaces 3- glass type, silicone/VEC logic 4- drainage, slab edge connection','Architectural Design Phase (Pre-Execution)',1,3000,1800,'item'),
('S00021',20,'Architectural Design Phase (Pre-Execution) External cladding scope 1- Review cladding areas 2- Panel joint logic 3- Substructure principle 4- Fire grade, coating 5- Corners, parapets, soffits, and fixing concept.','Architectural Design Phase (Pre-Execution)',1,2500,1500,'item'),
('S00021',30,'Architectural Design Phase (Pre-Execution) Entrances 1- Review main entrances 2- Ground floor glazing 3- Door systems, thresholds, 4- Waterproofing 5- Accessibility 6- Hardware','Architectural Design Phase (Pre-Execution)',1,2500,1500,'item'),
('S00021',40,'Architectural Design Phase (Pre-Execution) Vertical louvers / mezzanine parking façade 1- Review vertical louver design 2- Spacing, support frame 3- Ventilation/free-area logic 4- fire/smoke concerns 5- Coating and screening 6- Maintenance access','Architectural Design Phase (Pre-Execution)',1,2500,1500,'item'),
('S00021',50,'Architectural Design Phase (Pre-Execution) Residential windows and balcony doors 1- Review window/door systems 2- Glass, sill/head/jamb interfaces 3- Balcony thresholds 4- Drainage, waterproofing 5- Acoustic/thermal design','Architectural Design Phase (Pre-Execution)',1,2500,1500,'item'),
('S00021',60,'Architectural Design Phase (Pre-Execution) Balustrades and balcony edges 1- Review glass/metal railing concept 2- Fixing principle, safety glass, and loads 3- Waterproofing around fixing points 4- Edge details','Architectural Design Phase (Pre-Execution)',1,1800,1080,'item'),
('S00021',70,'Architectural Design Phase (Pre-Execution) Facade technical specification summary for: 1- Glass 2- Aluminum 3- Cladding 4- Louvers 5- sealants 6- coating 7- Fire Proofing, Burglary Resistance, Thermal, Acoustics, Corrosion, Safety, and testing requirements. 8- Waterproofing interfaces','Architectural Design Phase (Pre-Execution)',1,3200,1920,'item'),
('S00021',80,'Down Payments','',0,0,0,'section'),
('S00021',90,'Down Payment','',0,-1500,0,'item'),
('S00020',10,'Facade Execution Supervision Site Supervision & Quality Control (Façade Works) for a Period of one year from down payment date. I case of project delay client be invoiced USD 1200 / Month','Facade Execution Supervision',1,8500,8500,'item'),
('S00019',10,'Production of façade GAs, typical details (head/sill/jamb, slab edge, parapet, corners, movement joints), and coordination notes, including an RFI/assumptions log. Deliverables are tender/coordination grade and intended to guide contractor shop drawings.','Architectural Design Phase (Pre-Execution)',1,7500,7500,'item'),
('S00018',10,'Supply. Manufacturing and Installation of A2 Aluminum Composite Panels','Supply. Manufacturing and Installation of A2 Aluminum Composite Panels',215.25,100,21525,'item'),
('S00016',10,'CN_01','CN_01',1,3000,3000,'item'),
('S00016',20,'Tubular Louvers and Typical Curtainwall for Entrance Block','',0,0,0,'note'),
('S00015',10,'CN_01','CN_01',1,1250,1250,'item'),
('S00015',20,'Aluminum Handrail on Roof','',0,0,0,'note'),
('S00014',10,'CN_01','CN_01',1,1250,1250,'item'),
('S00014',20,'Ladder in shaft','',0,0,0,'note'),
('S00013',10,'CN_01','CN_01',1,1250,1250,'item'),
('S00013',20,'Steel Catwalk','',0,0,0,'note'),
('S00012',10,'CN_01','CN_01',1,1500,1500,'item'),
('S00012',20,'Hinged/Fixed Window WA02''/Gf FYn with subframe Sliding/Fixed Window WA01 - GYn Soleal 55 Sliding WA20 - GYn Soleal 55','',0,0,0,'note'),
('S00011',10,'CN_01 Fixed Louvers','CN_01',1,1250,1250,'item'),
('S00011',20,'CN_01 Sliding Louvers','CN_01',1,1250,1250,'item'),
('S00011',30,'Down Payments','',0,0,0,'section'),
('S00011',40,'Down Payment (ref: INV/2025/00007 on 08/12/2025)','',0,1250,0,'item'),
('S00010',10,'CN_01 AMCA LOUVERS','CN_01',1,1250,1250,'item'),
('S00010',20,'Down Payments','',0,0,0,'section'),
('S00010',30,'Down Payment (ref: INV/2025/00005 on 07/15/2025)','',0,1250,0,'item'),
('S00009',10,'CN_01 Glass Ballustrade','CN_01',1,1250,1250,'item'),
('S00009',20,'Down Payments','',0,0,0,'section'),
('S00009',30,'Down Payment: 06/20/2025 (Draft)','',0,1000,0,'item'),
('S00007',10,'Technical and Engineering Services','Technical and Engineering Services',1,66000,59400,'item'),
('S00007',20,'Discount 15.82%','Discount',1,-9400,-9400,'item'),
('S00006',10,'CN_01','CN_01',1,2500,1250,'item'),
('S00006',20,'Down Payments','',0,0,0,'section'),
('S00006',30,'Down Payment (ref: INV/2025/00002 on 03/03/2025)','',0,1000,0,'item'),
('S00004',10,'[BOD_001] Tower Curtain Wall Tower Curtain Wall System Specifications and Architectural Basis of Design','Tower Curtain Wall',1,10000,10000,'item'),
('S00004',20,'1- Parking Areas 2-Typical Floors 3-Sail / Top of Roof','',0,0,0,'note'),
('S00004',30,'Down Payments','',0,0,0,'section'),
('S00004',40,'Down Payment (ref: INV/2025/00001 on 02/28/2025)','',0,2500,0,'item'),
('S00004',50,'Down Payment (ref: INV/2025/00008 on 09/30/2025)','',0,2500,0,'item'),
('S00004',60,'Down Payment (ref: INV/2026/00001 on 02/03/2026)','',0,2000,0,'item'),
('S00002',10,'[BOD_001] Tower Curtain Wall Tower Curtain Wall System Specifications and Architectural Basis of Design','Tower Curtain Wall',1,2500,2500,'item'),
('S00002',20,'[BOD_002] Structural Glazing Structural Glazing Architectural Specification and Basis of Design','Structural Glazing',1,2500,2500,'item'),
('S00002',30,'[BOD_003] Double Skin Element Double Skin Element Attached to Facade Architectural Specifications and Basis of Design','Double Skin Element',1,2500,2500,'item'),
('S00002',40,'[BOD_004] Entrance Facades Entrances Facade Architectural Specifications and Basis of Design','Entrance Facades',1,2500,2500,'item')
;

  delete from public.sale_order_lines l using public.sale_orders o
   where l.order_id = o.id and o.company_id = v_co and o.number in (select number from t_so);
  insert into public.sale_order_lines(company_id, order_id, product_id, name, sequence, quantity, unit_price, price_subtotal, price_total, line_type)
  select v_co, o.id,
         (select p.id from public.products p where p.company_id = v_co and lower(p.name) = lower(t.product) limit 1),
         t.name, t.seq, t.qty, t.price, t.subtotal, t.subtotal, t.kind
  from t_so t join public.sale_orders o on o.company_id = v_co and o.number = t.number;
  get diagnostics n_so = row_count;

  -- -------------------------------------------------------- purchase orders
  create temporary table t_po(number text, seq int, name text, product text, qty numeric, price numeric, subtotal numeric) on commit drop;
  insert into t_po(number, seq, name, product, qty, price, subtotal) values
('P00006',10,'Cutter','Cutter',50,1,50),
('P00005',10,'Glass (6mm clear tempered, 12mm air space, 6mm clear tempered)','Glass (6mm clear tempered, 12mm air space, 6mm clear tempered)',2,30,60),
('P00005',20,'Supply. Manufacturing and Installation of A2 Aluminum Composite Panels','Supply. Manufacturing and Installation of A2 Aluminum Composite Panels',1,5,5),
('P00005',30,'Service on Timesheets','Service on Timesheets',1,2,2),
('P00005',40,'Screw (Pan Heab, M4, Stainless Steel 316)','Screw (Pan Heab, M4, Stainless Steel 316)',1,3,3),
('P00005',50,'Screw (Pan Heab, M5, Stainless Steel 316)','Screw (Pan Heab, M5, Stainless Steel 316)',2,4,8),
('P00005',60,'Screw (Pan Heab, M6, Stainless Steel 316)','Screw (Pan Heab, M6, Stainless Steel 316)',3,6,18),
('P00005',70,'please deliver to site let joseph sign delivery note','',0,0,0),
('P00001',10,'Glass','Glass (Outer Panel)',20,0,0)
;

  delete from public.purchase_order_lines l using public.purchase_orders o
   where l.order_id = o.id and o.company_id = v_co and o.number in (select number from t_po);
  insert into public.purchase_order_lines(company_id, order_id, product_id, name, sequence, quantity, unit_price, price_subtotal)
  select v_co, o.id,
         (select p.id from public.products p where p.company_id = v_co and lower(p.name) = lower(t.product) limit 1),
         t.name, t.seq, t.qty, t.price, t.subtotal
  from t_po t join public.purchase_orders o on o.company_id = v_co and o.number = t.number;
  get diagnostics n_po = row_count;

  -- --------------------------------------------------------------- invoices
  create temporary table t_inv(number text, seq int, name text, product text, qty numeric, price numeric, subtotal numeric, kind text) on commit drop;
  insert into t_inv(number, seq, name, product, qty, price, subtotal, kind) values
('INV/2026/00003',10,'Architectural Design Phase (Pre-Execution) Curtain wall 1- Review system concept 2- typical interfaces 3- glass type, silicone/VEC logic 4- drainage, slab edge connection','Architectural Design Phase (Pre-Execution)',1,3000,1800,'item'),
('INV/2026/00003',20,'Architectural Design Phase (Pre-Execution) External cladding scope 1- Review cladding areas 2- Panel joint logic 3- Substructure principle 4- Fire grade, coating 5- Corners, parapets, soffits, and fixing concept.','Architectural Design Phase (Pre-Execution)',1,2500,1500,'item'),
('INV/2026/00003',30,'Architectural Design Phase (Pre-Execution) Entrances 1- Review main entrances 2- Ground floor glazing 3- Door systems, thresholds, 4- Waterproofing 5- Accessibility 6- Hardware','Architectural Design Phase (Pre-Execution)',1,2500,1500,'item'),
('INV/2026/00003',40,'Architectural Design Phase (Pre-Execution) Vertical louvers / mezzanine parking façade 1- Review vertical louver design 2- Spacing, support frame 3- Ventilation/free-area logic 4- fire/smoke concerns 5- Coating and screening 6- Maintenance access','Architectural Design Phase (Pre-Execution)',1,2500,1500,'item'),
('INV/2026/00003',50,'Architectural Design Phase (Pre-Execution) Residential windows and balcony doors 1- Review window/door systems 2- Glass, sill/head/jamb interfaces 3- Balcony thresholds 4- Drainage, waterproofing 5- Acoustic/thermal design','Architectural Design Phase (Pre-Execution)',1,2500,1500,'item'),
('INV/2026/00003',60,'Architectural Design Phase (Pre-Execution) Balustrades and balcony edges 1- Review glass/metal railing concept 2- Fixing principle, safety glass, and loads 3- Waterproofing around fixing points 4- Edge details','Architectural Design Phase (Pre-Execution)',1,1800,1080,'item'),
('INV/2026/00003',70,'Architectural Design Phase (Pre-Execution) Facade technical specification summary for: 1- Glass 2- Aluminum 3- Cladding 4- Louvers 5- sealants 6- coating 7- Fire Proofing, Burglary Resistance, Thermal, Acoustics, Corrosion, Safety, and testing requirements. 8- Waterproofing interfaces','Architectural Design Phase (Pre-Execution)',1,3200,1920,'item'),
('INV/2026/00003',80,'Discount','Discount',1,-800,-800,'item'),
('INV/2026/00002',10,'Down Payment','',1,1500,1500,'item'),
('INV/2026/00001',10,'Down payment of 20.00%','',1,2000,2000,'item'),
('INV/2026/00001',20,'upon submission of Facade General Drawings','',0,0,0,'note'),
('INV/2025/00009',10,'CN_01','CN_01',1,1500,1500,'item'),
('INV/2025/00009',20,'Hinged/Fixed Window WA02''/Gf FYn with subframe Sliding/Fixed Window WA01 - GYn Soleal 55 Sliding WA20 - GYn Soleal 55','',0,0,0,'note'),
('INV/2025/00008',10,'Materials and systems payment of 25%','',1,2500,2500,'item'),
('INV/2025/00007',10,'CN Fixed Louvers','',1,1250,1250,'item'),
('INV/2025/00007',20,'CN Sliding Louvers','CN Sliding Louvers',1,1250,1250,'item'),
('INV/2025/00006',10,'CN_01','CN_01',1,2500,2500,'item'),
('INV/2025/00005',10,'Down Payment','',1,1250,1250,'item'),
('INV/2025/00004',10,'CN_01 Glass Ballustrade','CN_01',1,1250,1250,'item'),
('INV/2025/00003',10,'Down Payment','',1,1000,1000,'item'),
('BILL/2025/03/0001',10,'.ai domain registration','.ai domain registration',1,194.98,194.98,'item'),
('BILL/2025/03/0001',20,'microsoft 365 email essentials','microsoft 365 email essentials',1,78.96,78.96,'item'),
('RINV/2025/00001',10,'Down payment of 25.0%','',1,2250,2250,'item'),
('INV/2025/00002',10,'Down payment of 80.0%','',1,1000,1000,'item'),
('INV/2025/00002',20,'CN Approval','CN Approval',1,250,250,'item'),
('INV/2025/00001',10,'Down payment of 25.0%','',1,2500,2500,'item')
;

  -- only the invoices 210 loaded, and only where the lines still add up to the
  -- amount on the document: anything else is left exactly as it is and reported
  for bad in
    select t.number from (
      select number, round(sum(subtotal), 2) as lines_total from t_inv group by number
    ) t join public.invoices i on i.company_id = v_co and i.number = t.number
    where abs(t.lines_total - i.amount_untaxed) > 0.01
  loop
    raise notice 'invoice % left alone: its Odoo lines do not add up to the amount on the document', bad;
  end loop;

  delete from public.invoice_lines l using public.invoices i
   where l.invoice_id = i.id and i.company_id = v_co
     and i.number in (
       select t.number from (select number, round(sum(subtotal), 2) as lines_total from t_inv group by number) t
        join public.invoices i2 on i2.company_id = v_co and i2.number = t.number
       where abs(t.lines_total - i2.amount_untaxed) <= 0.01);

  insert into public.invoice_lines(company_id, invoice_id, product_id, name, sequence, quantity, unit_price, price_subtotal, price_total, line_type, account_id)
  select v_co, i.id,
         (select p.id from public.products p where p.company_id = v_co and lower(p.name) = lower(t.product) limit 1),
         t.name, t.seq, t.qty, t.price, t.subtotal, t.subtotal, t.kind,
         (select a.id from public.accounts a where a.company_id = v_co
           and a.code = case when i.move_type = 'in_invoice' then '6500' else '7000' end)
  from t_inv t
  join public.invoices i on i.company_id = v_co and i.number = t.number
  join (select number, round(sum(subtotal), 2) as lines_total from t_inv group by number) s on s.number = t.number
  where abs(s.lines_total - i.amount_untaxed) <= 0.01;
  get diagnostics n_inv = row_count;

  raise notice 'lines loaded: % sale order, % purchase order, % invoice', n_so, n_po, n_inv;
end $lines$;

select 'lines' as step,
  (select count(*) from public.sale_order_lines l join public.sale_orders o on o.id = l.order_id where o.company_id = '183e96d4-afd9-4ca4-b311-2e03e0c36ffb') as sale_order_lines,
  (select count(*) from public.purchase_order_lines l join public.purchase_orders o on o.id = l.order_id where o.company_id = '183e96d4-afd9-4ca4-b311-2e03e0c36ffb') as purchase_order_lines,
  (select count(*) from public.invoice_lines l join public.invoices i on i.id = l.invoice_id where i.company_id = '183e96d4-afd9-4ca4-b311-2e03e0c36ffb') as invoice_lines;
