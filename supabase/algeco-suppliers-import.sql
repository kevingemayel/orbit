-- ============================================================================
--  Orbit ERP  -  Add Website + Notes to contacts, and import ALGECO suppliers
--  Paste into the Supabase SQL editor and Run once. Idempotent (re-runnable):
--  columns use IF NOT EXISTS; suppliers skip any name already in ALGECO.
-- ============================================================================
alter table public.partners add column if not exists website text;
alter table public.partners add column if not exists notes   text;

with co as (select id as company_id, org_id from public.companies where id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1')
insert into public.partners (company_id, org_id, name, is_company, is_vendor, is_customer, contact_kind, company_type, specialty, capabilities, country, city, street, email, phone, contact_person, website, notes)
select co.company_id, co.org_id, v.name, true, true, false, 'company', 'supplier',
       nullif(v.specialty,''), v.capabilities, nullif(v.country,''), nullif(v.city,''), nullif(v.street,''),
       nullif(v.email,''), nullif(v.phone,''), nullif(v.contact_person,''), nullif(v.website,''), nullif(v.notes,'')
from co, (values
  ('Abou Zeid pour l industrie et a commerce', 'Wire Mesh', null, 'Lebanon', '', 'Jiyeh', '', '03-705423', 'Ousama AbouZeid', '', 'Business type: Retailer
Sales: Ousama AbouZeid 03-705423
Owner: Ousama AbouZeid 03-705423'),
  ('Alucoat Sarl', 'Powder Coating', array['Aluminum Profiles','Powder Coating','Rolling Shutters','Flyscreens']::text[], 'Lebanon', 'Metn', 'Bachour bldg, Industrial Area Fanar, Metn, Lebanon', 'Laurentgemayel@gmail.com', '03-083073', 'Laurent Gemayel', '', 'Business type: Service Provider
Ratings - Price: Very Cheap, Quality: Medium, Time: 
Sales: Elizabeth Nehmeh 03-805605
Technical: Laurent Gemayel 03-805605
Owner: Laurent Gemayel 03-083073'),
  ('Aluplast', 'Gasket extrusion', array['Aluminum Accessories','Gaskets']::text[], 'Lebanon', '', 'Zouk Mosbeh', '', '03 809 137', 'Chahid Fares', '', 'Business type: Manufacturer
Sales: Chahid Fares 03 809 137
Owner: Chahid Fares 03 809 137
3 gasket extrusion'),
  ('Sidem', 'Technal - Extrusion', array['Aluminum Profiles','Aluminum Accessories','Gaskets','Powder Coating','Flyscreens']::text[], 'Lebanon', '', 'Zouk (prof) Mansourieh (acc)', 'sidem.ng@gmail.com', '09220165', 'Chawki Ziade (prof) - Fares Soueid (acc)', '', 'Business type: Wholesaler
Sales: Chawki Ziade (prof) - Fares Soueid (acc) 03704447
1 - Just for extrusion order    - Mansourieh for original accessories'),
  ('Profalu', 'Sidem + Technal - Stock', array['Aluminum Profiles','Aluminum Accessories','Gaskets','Rolling Shutters','Flyscreens']::text[], 'Lebanon', '', 'Zouk Mosbeh', '', '09222852', 'Khalil', '', 'Business type: Retailer
Ratings - Price: Very Expensive, Quality: High, Time: Availible
Sales: Khalil 03757662
2-profiles on stock -sidem original accessories (for urgent or unavailability cases)'),
  ('Aludima', 'Profile', array['Aluminum Profiles','Flyscreens']::text[], 'Lebanon', '', 'Dekweneh,behind freeway center', 'aludimasarl@gmail.com', '01495053', 'Joe', '', 'Business type: Retailer
Ratings - Price: Average, Quality: Medium, Time: Availible
Sales: Joe
3.0'),
  ('Robert Kashouh Trad. & Manuf. Co. S.A.R.L', 'Profile & Glass', array['Aluminum Profiles','Glass','Powder Coating','Rolling Shutters','Flyscreens']::text[], 'Lebanon', '', 'Mkalles', 'robertkashouh@live.com', '01486196', 'Robert Kashouh', '', 'Business type: Retailer
Sales: Jean Zehlewe (alu) Darine (Glass) 76171106
Owner: Robert Kashouh 7.0484049E7
2.0'),
  ('Protek', 'Profile', array['Aluminum Profiles','Flyscreens']::text[], 'Lebanon', '', 'Mkalles', '', '01687391', '', '', 'Business type: Retailer
Sales:  03350822
3.0'),
  ('Alumarket', 'Profile', array['Aluminum Profiles','Flyscreens']::text[], 'Lebanon', '', 'Hadath', '', '05463872', '', '', 'Business type: Retailer
3.0'),
  ('Folda', 'Rolling shutter only', array['Aluminum Profiles','Rolling Shutters','Flyscreens']::text[], 'Lebanon', '', 'Zouk Mosbeh', 'georges.saade@folda.com.lb', '09217858', 'George Saade / Zahi', '', 'Business type: wholesaler
Sales: George Saade / Zahi 70997959'),
  ('Alakso', 'Profiled and powder coating', array['Aluminum Profiles','Powder Coating','Rolling Shutters','Flyscreens']::text[], 'Lebanon', '', 'Jbeil', 's.hakmeh@alakso.com', '09478991', 'Pierre Hajj Moussa', '', 'Business type: wholesaler
Ratings - Price: Average, Quality: High, Time: 
Sales: Pierre Hajj Moussa 70964984
1.0'),
  ('Alusystem', 'Accessories', array['Aluminum Accessories','Gaskets']::text[], 'Lebanon', '', 'Jdeideh', 'alusystem@sodetel.net.lb', '01875508', 'Georgette', '', 'Business type: wholesaler
Sales: Georgette 81639218
Technical: Hani 03795915
1-for accessories & gaskets that are not required to be technal'),
  ('Amazona Paints sal', 'Paint', array['Paint']::text[], 'Lebanon', '', 'Zouk Mosbeh Old NDU campus', '', '09222450', '', '', 'Business type: Retailer'),
  ('Antoine Hajjar', 'Glass', array['Glass']::text[], 'Lebanon', '', 'Mkalles', '', '01683071', '', '', 'Business type: wholesaler
for raw material'),
  ('Antranik Baljian & Sons', 'Steel fabrication & ACP', array['Metal Sheets','Composite Sheets','Cut Bend V groov...']::text[], 'Lebanon', '', 'Burj Hammoud', 'jackak@absmetals.com', '01-240516', 'Sako', '', 'Business type: Manufacturer
Sales: Sako
Technical: Salim
Main supplier For abrication order (laser,cut & bend,stainless,galvanized...) ACP'),
  ('Aoun & Haddad', 'hardware', array['Aluminum Accessories','Gaskets','Hardware Store','Doors  accessories','Power Tools']::text[], 'Lebanon', '', 'Dekwaneh facing galerie georges matta', '', '01-502626', '', '', 'Business type: Retailer
tools and hardware NOT for quantities and full orders'),
  ('Aoun Electrico', 'Electric supplies', array['Electric']::text[], 'Lebanon', '', 'Jdeideh', '', '01-872513', '', '', 'Business type: Retailer
circuit breaker,parts,plugs...'),
  ('Asmar Wood', 'Wood', null, 'Lebanon', '', '', '', '', '', '', 'Business type: Manufacturer'),
  ('Azzi electricity & electronics', 'Electric supplies', array['Electric']::text[], 'Lebanon', '', 'st Joseph Street, Dora', '', '01258241', '', '', 'Business type: Retailer
circuit breaker,parts,plugs...'),
  ('Azzi equipment', 'hardware', array['Hardware Store','Doors  accessories','Power Tools']::text[], 'Lebanon', '', 'Bauchrieh, Next Credit Libanais', '', '01494077', 'Joseph Azzi', '', 'Business type: retailer
Sales: Emily
Owner: Joseph Azzi
2-Brushes,power tools,paper tape,thinner   - Power tools'),
  ('Bardawil & CO. CEM sarl', 'Sealants & insulation', array['Sealants','Building Materials & Insulation']::text[], 'Lebanon', '', 'Dora', 'fnawar@bardawil.com.lb', '01-894533', 'Fares Nawar', '', 'Business type: wholesaler
Sales: Fares Nawar
Dowcorning   Spec Grout Carlisle,firestone,Wosil (EPDM)'),
  ('Beta Lubes', 'Oil', array['Spare parts & Machine Supplies']::text[], 'Lebanon', '', 'Hazmieh', 'ksahyoun@betalubes.com', '05-953842', 'Kamal Sahyoun', '', 'Business type: wholesaler
Sales:  70-333280
Owner: Kamal Sahyoun 03675697
Delivery'),
  ('BMT', 'Laser', array['Cut Bend V groov...']::text[], 'Lebanon', '', 'Burj Hammoud', 'design@bmtlb.com', '01-240516', 'Oliver,Jima', '', 'Business type: Manufacturer
Sales: Oliver,Jima'),
  ('Boujikian Bros', 'Chargers & rechargeable batteries', array['Electric']::text[], 'Lebanon', '', 'Dora', 'gary@boujikian.com', '01-240244', '', '', 'Business type: Retailer
Chargers,rechargeable batteries'),
  ('CCTechnique Lebanon S.A.L', 'EPDM membrane', array['Building Materials & Insulation']::text[], 'Lebanon', '', 'Jbeil', '', '01-353171', '', '', 'Business type: Retailer'),
  ('Cedar Group', 'powder Coating ans sells Tubes and Corners', array['Aluminum Profiles','Powder Coating']::text[], 'Lebanon', '', 'Mkalles', '', '01-683054', 'Georges Maalouf', '', 'Business type: Service Provider
Ratings - Price: Expensive, Quality: High, Time: 
Sales: Dina 03 327 672
Owner: Georges Maalouf 03955888
If you dont want to transport from supplier to coating its a good option'),
  ('Chikhany electric', 'Electric supplies', array['Electric']::text[], 'Lebanon', '', 'Bikfaya', 'samichikhani1515@gmail.com', '04-980457', 'Sami', '', 'Business type: Retailer
Sales: Sami 71864064
Lamps,get quotations for orders'),
  ('CMC', 'Grout & insulation', array['Building Materials & Insulation']::text[], 'Lebanon', '', '', '', '', '', '', 'Business type: Wholesaler'),
  ('Daher electric', 'Electric supplies', array['Electric']::text[], 'Lebanon', '', 'Jdeideh Next to L''abeille d''or', '', '03298391', 'Tony Daher', '', 'Business type: Retailer
Sales: Tony Daher 03298391
Owner: Tony Daher 03298391
Small inquiry'),
  ('Demco Steel', 'steel', array['Steel Profiles','Metal Sheets']::text[], 'Lebanon', '', 'BurjHAmmoud', 'demcosteel@demcosteel.com;roger@demcosteel.com', '01-246000', 'ghaled 220 Georges 119 Roger 138', '', 'Business type: Wholesaler
Sales: ghaled 220 Georges 119 Roger 138 240 for tubes
Sheets,majdoul,tubes,UPN/IPE/HEA/HEB...'),
  ('Doortec', 'Door accessories', array['Stainless steel accessories','Doors  accessories']::text[], 'Lebanon', '', 'Dora', 'doortec@simaclebanon.com', '01252111', 'Sassine (owner of manager ????)', '', 'Business type: Retailer
Sales: Rony 03 127 697
Technical: Jean-pierre (sliding doors) 03 572 065
Owner: Sassine (owner of manager ????) 03-373768
Dorma,Durable,Geze'),
  ('Electrica', 'Electric supplies', array['Electric']::text[], 'Lebanon', '', 'Bauchrieh', '', '01881977', '', '', 'Business type: Retailer'),
  ('Ets.Alujeb', 'Accessories', array['Aluminum Accessories','Gaskets','Hardware Store','Doors  accessories','Rolling Shutters','Sealants']::text[], 'Lebanon', '', 'Dora', '', '01511571', '', '', 'Business type: Retailer
Sales:  76601918
2.0'),
  ('Ets.Jadir', 'hardware', array['Hardware Store']::text[], 'Lebanon', '', 'Hankach', 'etsjadir@gmail.com', '01-876567', 'Serge', '', 'Business type: Retailer
Sales: Serge 03 537 513
2-drill bits,patex'),
  ('Fakhry hardware & tools', 'hardware', array['Hardware Store','Doors  accessories','Sealants']::text[], 'Lebanon', '', 'Bauchrieh', '', '01-885898', 'Chady Fakhry', '', 'Business type: Retailer
Sales: Charbel Makhlouf 71 268 225
Owner: Chady Fakhry 71424147
1-screws,nuts,bolts,anchors,measuring meters,disks,rollers'),
  ('Fakhry Trading co', 'hardware', array['Hardware Store','Sealants','Power Tools']::text[], 'Lebanon', '', 'Bauchrieh', 'info@fakhrytrading.com', '01-487589', 'Karam Fakhry', '', 'Business type: Retailer
Sales: Hamid
Owner: Karam Fakhry
1-screws,disks,abrasive papers,paper adhesive tape,drill bit,cutter,measuring meters,threaded rod,level  -power tools'),
  ('Matco', 'Folding flyscreen', array['Flyscreens']::text[], 'Lebanon', '', 'Bauchrieh', '', '01-685612', '', '', 'Business type: Manufacturer
Sales:  76956573
Folding flyscreen assembeled'),
  ('Georges Aoun Trading', 'hardware', array['Aluminum Accessories','Hardware Store','Sealants']::text[], 'Lebanon', '', 'Bauchrieh', '', '01-897806', '', '', 'Business type: Retailer
3-polyrethane,silicone (exceptional cases)'),
  ('Glass Premium', 'Glass', array['Glass']::text[], 'Lebanon', '', 'Aley', '', '05556735', 'Elie', '', 'Business type: Manufacturer
Sales: Elie 76320877'),
  ('Glassline', 'Glass', array['Glass']::text[], 'Lebanon', '', 'Choueifat', 'info@glasslineindustries.com', '05-432045', 'Susana', '', 'Business type: Wholesaler
Sales: Susana'),
  ('GMK sarl', 'Dorma,Dorint', array['Stainless steel accessories','Doors  accessories']::text[], 'Lebanon', '', 'Jisr El Bacha', '', '01-512523', 'Fawzi Motran', '', 'Business type: Manufacturer
Sales: Fawzi Motran 03-804927'),
  ('GMNC', 'Glass', array['Glass']::text[], 'Lebanon', '', 'Dekweneh', 'info@gmnc-lb.com', '01688101', 'Chafic Khoury', '', 'Sales: Viviane 70764242
Owner: Chafic Khoury 7.0014438E7
2-For specified glass compositions (mr Jean instructions)'),
  ('Groupna sarl (Sodamco)', 'Grout', array['Building Materials & Insulation']::text[], 'Lebanon', '', 'Dora', 'chaficnawfal@groupnasarl.com', '01255957', 'Chafic', '', 'Business type: retailer
Sales: Chafic
Group Weber'),
  ('Horizontal Tempering Glass SARL', 'Glass', array['Glass']::text[], 'Lebanon', '', 'Mkalles', 'sales@htempglass.com ;production4@htempglass.com;production@htempglass.com', '01696902', 'Youssef / Roy', '', 'Business type: Manufacturer
Sales: Youssef / Roy 70851238
Technical: Youssef
1-Main Glass supplier'),
  ('Howayek', 'Door accessories', array['Hardware Store','Doors  accessories']::text[], 'Lebanon', '', 'Queens Plaza Center, Sed El Bauchrieh', '', '01880271', 'Roal Howayek', '', 'Business type: Retailer
Technical:  01-871555
Owner: Roal Howayek 03277179
Hinges'),
  ('Impact construction systems sarl', 'Sealants & insulation', array['Sealants','Building Materials & Insulation']::text[], 'Lebanon', '', 'Bauchrieh', 'info@icslb.com;chekre@icslb.com', '01-902412', 'Mario', '', 'Business type: wholesaler
Sales: Mario
Technical: Chekre Nassif (GM) 03-121279
Main selant source- Soudal'),
  ('Jean Gebran Bou Sleiman', 'hardware', array['Hardware Store']::text[], 'Lebanon', '', 'Jdeideh', '', '01-897166', 'Jean Bou Sleiman', '', 'Business type: Retailer
Sales: Jean Bou Sleiman 03-135663
Owner: Jean Bou Sleiman 03-135663
tools and hardware NOT for quantities and full orders'),
  ('Kalco Steel', 'Steel', array['Steel Profiles','Metal Sheets','Cut Bend V groov...']::text[], 'Lebanon', '', 'Roumieh', 'sales@kalcosteel.com', '01-877718', 'Rafi', '', 'Business type: retailer
Sales: Levon
Owner: Rafi 03207896
For quick small orders (flat bars,tubes,round bar,sheets...)'),
  ('Khatchig & sons', 'hardware', array['Hardware Store']::text[], 'Lebanon', '', 'Bauchrieh', '', '01-252652', 'Vatche', '', 'Business type: retailer
Sales: Vatche 03 374 379
2-cutter,disks,abrasive papers,abrasive disks'),
  ('Khoury Hardware center KHC', 'Hardware', array['Hardware Store']::text[], 'Lebanon', '', 'Dora', 'info@khc-lb.com', '01-251469', 'Joe', '', 'Business type: wholesaler
Ratings - Price: Cheap, Quality: , Time: 
Sales: Joe 03 086 740
1-Top supplier for screws,bolts,nuts,anchors'),
  ('Masri Electric', 'Cables', array['Electric']::text[], 'Lebanon', '', 'Aisha Bakar', '', '01-736588', '', '', 'Business type: Retailer
Cables'),
  ('Master Metal', 'steel', array['Metal Sheets','Composite Sheets','Cut Bend V groov...']::text[], 'Lebanon', '', '', '', '', '', '', 'Business type: REtailer
Ratings - Price: Expensive, Quality: , Time: Availible
For abrication order (laser,cut & bend,stainless,...) ACP/ does not have galv'),
  ('MEBG Middle East Business Group', 'Door accessories', array['Stainless steel accessories','Doors  accessories']::text[], 'Lebanon', '', 'Jisr l Bacha', 'mebg@gmebusiness.com', '01511028', '', '', 'Business type: Retailer
Sales:  70 487 865
GTM,Ozma'),
  ('Mecano Group SAL', 'Welding supplies', array['Hardware Store']::text[], 'Lebanon', '', 'Grey Center,Saloumi', 'elie@mecanogroup-lb.com', '01-484990', 'Elie AbdelAhad', '', 'Business type: retailer
Owner: Elie AbdelAhad 03-301563
Welding supplies (electrode,wlding machine parts,argon needle...)'),
  ('Miroiterie Soufan', 'Decorative glass & Mirrors', array['Glass']::text[], 'Lebanon', '', 'Mansourieh', '', '03-605601', 'Elie Soufan', '', 'Business type: Manufacturer
Sales: Elie Soufan 03-605601
Owner: Elie Soufan 03-605601'),
  ('MTCC Mediterrenean Trading & Contracting Company', 'Paint', array['Paint']::text[], 'Lebanon', '', 'Dora', 'mtcc@dm.net.lb;jmsarrouf@mtcc.net', '01-243136', 'Jean-Michel', '', 'Business type: wholesaler
Sales: Jean-Michel 03-336552
Technical: Jean-Michel 03-336552
Ameron
Delivery'),
  ('Naggiar Trading', 'ACP', array['Metal Sheets','Composite Sheets','Cut Bend V groov...']::text[], 'Lebanon', '', 'ALNaher', 'tony.sakr@naggiar.net;tony.moukarzel@naggiar.net', '01-562652', 'Tony Sakr', '', 'Business type: Retailer
Sales: Tony Sakr 03-870717
For abrication order (laser,cut & bend,stainless,galvanized...) ACP'),
  ('Omran tools', 'Drill bits', array['Hardware Store']::text[], 'Lebanon', '', 'Korniche alMazraa', '', '03-204229', 'Bilal Omran', '', 'Business type: Retailer
Sales: Bilal Omran
Drills'),
  ('Ozone', '', null, 'Lebanon', '', 'Zouk Mosbeh', '', '03-965171', '', '', 'Business type: Retailer'),
  ('Plexi Art', 'Plexi & polycarbonate sheets', null, 'Lebanon', '', '', 'sales@plexiart.com', '04-711875', '', '', 'Business type: Retailer
Sister company for Master Metal'),
  ('Polychrome sarl', 'Paint Mix', array['Paint']::text[], 'Lebanon', '', 'Almaza street, Jdeideh', '', '01-881919', '', '', 'Business type: Retailer
Paint mix upon request'),
  ('Qiwin import and export co., ltd', 'Glass hardware', array['Aluminum Accessories','Stainless steel accessories']::text[], 'China', 'Guanzghou City', '12K ,JINAN BUILDING, NO.300-1 DONGFENG MIDDLE  ROAD, GUANGZHOU,CHINA', 'qiwin@qiwin.com', '139 2274 3033', 'Jason Chow', 'www.qiwin.com', 'Business type: Wholesaler
Sales: Moki Fu +8615877113415
Technical: Mandy Chow +86 20 83646503
Owner: Jason Chow 139 2274 3033
Catalogue: https://drive.google.com/open?id=1CgXmtT9z8BIb_lIhDg2xoUWwFBQK9j51'),
  ('R.G.K. Steel SAL', 'Cut pcs steel', array['Steel Profiles','Metal Sheets']::text[], 'Lebanon', '', 'Bauchrieh', 'info@rgksteel.com', '01-497359', '', '', 'Business type: Retailer
Kalco sister company for random cut pcs
Sister company for Kalco'),
  ('Raymond Maarawi CO. For Wood', 'Wood', null, 'Lebanon', '', 'Jdeideh - Bikfaya', 'ramon@raymond-maarawi.com', '01-872737', 'Sylvana', '', 'Business type: Manufacturer
Sales: Sylvana 03 399 139'),
  ('Sakr lighting systems', 'Electric supplies', array['Electric']::text[], 'Lebanon', '', 'Dora', 'etienne.sarkis@sakr.com', '01-264523', 'Adib', '', 'Business type: Retailer
Sales: Etienne 71476343
Owner: Adib 03-694528
Cable,MBH,plugs'),
  ('Salah Al Ghoul & sons co.', 'Glass', array['Glass']::text[], 'Lebanon', '', 'Airport Road', 'sales@salahelghoul.com', '01-450980', '', '', 'Business type: Manufacturer'),
  ('Salim Hamod', 'Glass', array['Glass']::text[], 'Lebanon', '', 'Mkalles', '', '01-683108', '', '', 'Business type: wholesaler
for raw material'),
  ('Samico', 'Accessories', array['Aluminum Accessories','Gaskets','Hardware Store','Doors  accessories','Rolling Shutters','Sealants']::text[], 'Lebanon', '', '', '', '01-264523', '', '', 'Business type: Retailer
2.0'),
  ('Serhal & Serhal Co', 'Den Barven', array['Sealants']::text[], 'Lebanon', '', 'Daraya', 'info@serhalandserhal.com', '07-241159', 'Michel Ghoraieb', '', 'Business type: wholesaler
Sales: Michel Ghoraieb 03-598845
Den barven
Delivery to Jdeideh Office'),
  ('Sika Near East', 'Building Materials', array['Paint','Building Materials & Insulation']::text[], 'Lebanon', '', 'Jiser elBacha', 'abdelahad.maya@lb.sika.com', '01-510270', 'Georges Eid', '', 'Business type: Wholesaler
Sales: Georges Eid 03-832255
Sika'),
  ('Simon electric center', 'Electric supplies', array['Electric']::text[], 'Lebanon', '', 'Mar Mkhayel - Armenia Street', 'sales@simonelectriccenter.com', '01-560222', 'Sonig', '', 'Business type: Retailer
Sales: Sonig
Huyndai,office lightings'),
  ('Societe Jean Yared et fils s.a.l', 'Steel', array['Steel Profiles','Metal Sheets']::text[], 'Lebanon', '', 'Zalka', 'yaredn@inco.com.lb', '01-890316', 'Maroun', '', 'Business type: Wholesaler
Sales: Maroun
tubes,flat bars,round bars,pipes'),
  ('Sogiva Liban', 'Epoxy', array['Sealants','Building Materials & Insulation']::text[], 'Lebanon', '', 'Fanar', '', '01-873120', 'Elie Rahi', '', 'Business type: retailer
Sales: Elie Rahi 03-759101
Epoxy
Delivery'),
  ('Somfy', 'Motors', array['Rolling Shutters']::text[], 'Lebanon', '', 'Dora', '', '01900455', '', '', 'Business type: wholesaler
Somfy'),
  ('Ste J&P steel work', 'Steel Fabrication', array['Steel Profiles','Metal Sheets','Cut Bend V groov...']::text[], 'Lebanon', '', 'Tal el Zaatar', 'info@jandpsteelwork.com', '01-681112', 'Joanna', '', 'Business type: manufacturer
Sales: Joanna
Owner:  70959481
For fabrication order (laser,cut & bend,stainless,galvanized...) ACP'),
  ('STR sons of Tony Reaidy', 'Glass paint', array['Paint']::text[], 'Lebanon', '', 'Bauchrieh', 'sar@reaidy.com', '01-255454', 'Charles', '', 'Business type: wholesaler
Sales: Charles 70-040006
Glass backpaint
Delivery'),
  ('Takla trading sal', 'Power tools & generators', array['Power Tools']::text[], 'Lebanon', '', 'Jdeideh Highway', 'info@taklatrading.com', '01-892420', 'Jamal', '', 'Business type: wholesaler
Sales: Jamal 70-238558
Compressors,drillers,generators'),
  ('Taleb &  Co', 'Sandblasting', array['Steel Profiles']::text[], 'Lebanon', '', 'Bechmezzine,main road', 'marcel@talebandco.com', '06-950651', 'Khaldoun Taleb', '', 'Business type: Service Provider
Sales: Ahmad 70-222808
Owner: Khaldoun Taleb 03-620050
Sandblasting'),
  ('TBM Techno Building Materials', 'Paint', array['Paint']::text[], 'Lebanon', '', 'Zouk Mosbeh,Naher ElKalb', 'jean@technobuilding.com', '09-211498/9', 'Jean Ghanimeh', '', 'Business type: wholesaler
Sales: Jean Ghanimeh 76 500 335
Jotun'),
  ('Tchaghlassian Steel', 'Steel', array['Steel Profiles','Metal Sheets','Cut Bend V groov...']::text[], 'Lebanon', '', 'Bauchrieh', 'viken@tchaghlassiansteel.com', '01-497347', 'Shahe tchaghlassian', '', 'Business type: retailer
Sales: Vicken
Owner: Shahe tchaghlassian 03-664359
For quick small orders (flat bars,tubes,round bar,sheets...)'),
  ('Team-Pro', 'Hardware', array['Hardware Store','Sealants','Power Tools']::text[], 'Lebanon', '', 'Sin l Fil', 'sales.coordinator@team-pro.com', '01-493754', 'Jihad', '', 'Business type: wholesaler
Sales: Jihad 70 481 148
for Epoxy
Coring & cutting services'),
  ('Techno Building Materials', 'Paint supplier and construction materials', array['Paint']::text[], 'Lebanon', 'Keserwan', 'Zouk Mosbeh highway, Borgi building', 'jean@technobuilding.com', '+9613250496', 'Ziad Barakat', 'www.technobuilding.com', 'Business type: Wholesaler
Sales: Jean Ghanimeh +96176500335
Technical: Jean Ghanimeh +96176500335
Owner: Ziad Barakat +9613250496'),
  ('Tehini Hana & Cie sarl', 'Bosch', array['Power Tools']::text[], 'Lebanon', '', 'Dora near BLF', 'bosch-pt@tehini-hana.com;c.kai@tehini-hana.com', '01-255211', 'Roland', '', 'Business type: Wholesaler
Sales: Roland
Technical: Elie
Bosch distributor & maintenance
Maintenance Bsoch'),
  ('Tempo', 'Glass', array['Glass']::text[], 'Lebanon', '', 'Choufiat', 'sales@tempoglass.com', '05814207', 'Amani', '', 'Business type: Manufacturer
Sales: Amani 03060865
2-lower price & quality'),
  ('Tinol Paints', 'Paint', array['Paint']::text[], 'Lebanon', '', 'Bauchrieh,HO Verdun', 'paints@tinol.com;tonihaddad@tinol.com', '01-245222  HO 01-812345', 'Tony Haddad', '', 'Business type: wholesaler
Sales: Tony Haddad 03 142 228
Technical: Tony Haddad
Tinol'),
  ('Tony Chamoun for trading', 'Tivoli & Noula', array['Paint']::text[], 'Lebanon', '', 'Sinel fil,Chaaya Building', '', '01-494018', 'Tony', '', 'Business type: Retailer
Sales: Tony 70-110841
Tivoli,Noula'),
  ('Tram Steel SAL', 'Steel', array['Steel Profiles']::text[], 'Lebanon', '', 'Dekweneh', '', '01-688372', 'Elie Azzi', '', 'Business type: Manufacturer
Sales: Elie Azzi
Main tubes supplier (galvanized tubes extrusion)
Extrusion'),
  ('Usine Chimique Gebara s.a.l', 'Thinner', array['Paint']::text[], 'Lebanon', '', 'Naher lmot', '', '01-894519 HO 04-925331', '', '', 'Business type: Retailer
Thinner Source'),
  ('Vaco', 'hardware', array['Hardware Store']::text[], 'Lebanon', '', 'Bauchrieh', '', '01242752', 'Georges', '', 'Business type: retailer
Sales: Georges
3-cross heads,pied a coulisse,measuring meter,srews,bolts,threaded rods'),
  ('Zeenni Steel', 'Steel', array['Steel Profiles','Metal Sheets','Cut Bend V groov...']::text[], 'Lebanon', '', 'Bchamoun', 'info@zeennisteel.com;oussama.k@zeennisteel.com', '25-804222', 'Ousama', '', 'Business type: Wholesaler
Sales: Ousama 71-151171
Main Sheets,UPN/IPE/HEA/HEB,flat bar supplier'),
  ('SNIC societe Nahas', 'Parts plasma', array['Spare parts & Machine Supplies']::text[], 'Lebanon', '', 'Fanar', 'snic@dm.net.lb', '01-878800', 'Chantal', '', 'Business type: REtailer
Sales: Chantal 03/846803
Parts for plasma'),
  ('Electromic', 'Wholesaler Cable Liban', array['Electric']::text[], 'Lebanon', '', 'Zalka', 'Distribution Warehouse Number -->', '01887187', 'Sales Person', '', 'Business type: Wholesaler
Sales: Sales Person 03094956
Cable'),
  ('K-Glass', 'Ceramic Frit - Glass printing - No tempering', array['Glass']::text[], 'Lebanon', '', '', '', '03927508', 'Roland Khoury', '', 'Business type: Manufacturer
Owner: Roland Khoury 03927508'),
  ('Sodamco', 'Grout', array['Stone','Building Materials & Insulation']::text[], 'Lebanon', '', 'Daoura', '', '01 255 957', '', '', 'Business type: Wholesaler
Building materials'),
  ('faysal wood', 'Wood', null, 'Lebanon', '', 'roumieh', '', '03-248333', 'george', '', 'Business type: Manufacturer
Sales: george 76659333
wood,mdf...'),
  ('united machines est', 'Hardware', array['Hardware Store','Power Tools']::text[], 'Lebanon', '', 'Bauchrieh', '', '01 490197', '', '', 'Business type: Retailer
RICHE FREZA'),
  ('Ghazawi bros s.a.r.l', 'Hardware', array['Hardware Store','Power Tools']::text[], '', '', '', '', '', '', '', 'Business type: Retailer
Ratings - Price: Cheap, Quality: Medium, Time: 
Electronic tools'),
  ('Alumarket', 'Profile', array['Aluminum Profiles','Flyscreens']::text[], 'Lebanon', '', '', '', '03909290', 'Khodor', '', 'Business type: Retailer
Ratings - Price: Average, Quality: Medium, Time: Availible
Sales: Khodor 03909290
3.0'),
  ('Osama abu zed', '', null, '', '', '', '', '3705423.0', '', '', 'Business type: Retailer'),
  ('melhem armid', 'armid', null, '', '', '', '', '03099484', '', '', 'Business type: Retailer'),
  ('george kabalen', '', null, '', '', '', '', '', '', '', 'Business type: Retailer
hydraulic repair')
) as v(name, specialty, capabilities, country, city, street, email, phone, contact_person, website, notes)
where not exists (select 1 from public.partners x where x.company_id = co.company_id and lower(x.name) = lower(v.name));

select count(*) || ' suppliers now in ALGECO' as done from public.partners p join public.companies c on c.id=p.company_id where c.id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and p.is_vendor;

