-- ============================================================
-- VICTORY SCHOOL MEMBERSHIP SYSTEM V2
-- COMPLETE UPDATED SAMPLE DATA
-- ============================================================

USE victory_school_membership_system;

-- ============================================================
-- 1. USERS
-- ============================================================

INSERT INTO users (full_name, email, password, role) VALUES
('System Administrator', 'admin@victoryschool.com', 'admin123', 'Admin'),

('Mr. Kiptoo', 'kiptoo@victoryschool.com', 'kiptoo', 'Patron'),
('Mrs. Cherono', 'cherono@victoryschool.com', 'cherono', 'Patron'),
('Mr. Kibet', 'kibet@victoryschool.com', 'kibet', 'Patron'),
('Ms. Akinyi', 'akinyi@victoryschool.com', 'akinyi', 'Patron'),
('Coach Kiprono', 'kiprono@victoryschool.com', 'kiprono', 'Patron'),
('Mrs. Mwangi', 'mwangi@victoryschool.com', 'mwangi', 'Patron'),
('Mr. Omondi', 'omondi@victoryschool.com', 'omondi', 'Patron'),
('Ms. Chepkemoi', 'chepkemoi@victoryschool.com', 'chepkemoi', 'Patron'),
('Mr. Kamau', 'kamau@victoryschool.com', 'kamau', 'Patron'),
('Mrs. Wanjiku', 'wanjiku@victoryschool.com', 'wanjiku', 'Patron'),
('Mr. Onyango', 'onyango@victoryschool.com', 'onyango', 'Patron'),
('Ms. Fatuma', 'fatuma@victoryschool.com', 'fatuma', 'Patron'),
('Mr. Mutua', 'mutua@victoryschool.com', 'mutua', 'Patron'),
('Coach Nekesa', 'nekesa@victoryschool.com', 'nekesa', 'Patron'),
('Mr. Tanui', 'tanui@victoryschool.com', 'tanui', 'Patron'),
('Mrs. Amondi', 'amondi@victoryschool.com', 'amondi', 'Patron'),
('Mr. Duale', 'duale@victoryschool.com', 'duale', 'Patron'),
('Ms. Sang', 'sang@victoryschool.com', 'sang', 'Patron'),
('Mr. Ndwiga', 'ndwiga@victoryschool.com', 'ndwiga', 'Patron'),
('Mrs. Lesuda', 'lesuda@victoryschool.com', 'lesuda', 'Patron');


-- ============================================================
-- 2. PATRONS
-- ============================================================

INSERT INTO patrons
(user_id, full_name, phone, email, department)
VALUES
(2, 'Mr. Kiptoo', '0711000001', 'kiptoo@victoryschool.com', 'Science'),
(3, 'Mrs. Cherono', '0711000002', 'cherono@victoryschool.com', 'Languages'),
(4, 'Mr. Kibet', '0711000003', 'kibet@victoryschool.com', 'Arts'),
(5, 'Ms. Akinyi', '0711000004', 'akinyi@victoryschool.com', 'ICT'),
(6, 'Coach Kiprono', '0711000005', 'kiprono@victoryschool.com', 'Sports'),
(7, 'Mrs. Mwangi', '0711000006', 'mwangi@victoryschool.com', 'Humanities'),
(8, 'Mr. Omondi', '0711000007', 'omondi@victoryschool.com', 'Mathematics'),
(9, 'Ms. Chepkemoi', '0711000008', 'chepkemoi@victoryschool.com', 'Science'),
(10, 'Mr. Kamau', '0711000009', 'kamau@victoryschool.com', 'Business Studies'),
(11, 'Mrs. Wanjiku', '0711000010', 'wanjiku@victoryschool.com', 'Languages'),
(12, 'Mr. Onyango', '0711000011', 'onyango@victoryschool.com', 'ICT'),
(13, 'Ms. Fatuma', '0711000012', 'fatuma@victoryschool.com', 'Humanities'),
(14, 'Mr. Mutua', '0711000013', 'mutua@victoryschool.com', 'Arts'),
(15, 'Coach Nekesa', '0711000014', 'nekesa@victoryschool.com', 'Sports'),
(16, 'Mr. Tanui', '0711000015', 'tanui@victoryschool.com', 'Agriculture'),
(17, 'Mrs. Amondi', '0711000016', 'amondi@victoryschool.com', 'Home Science'),
(18, 'Mr. Duale', '0711000017', 'duale@victoryschool.com', 'Languages'),
(19, 'Ms. Sang', '0711000018', 'sang@victoryschool.com', 'Music'),
(20, 'Mr. Ndwiga', '0711000019', 'ndwiga@victoryschool.com', 'Science'),
(21, 'Mrs. Lesuda', '0711000020', 'lesuda@victoryschool.com', 'Humanities');


-- ============================================================
-- 3. CLUBS
-- ============================================================

INSERT INTO clubs
(club_name, description, patron_id, meeting_day, venue, membership_fee)
VALUES
('Science Club', 'Innovation and experiments', 1, 'Wednesday', 'Lab 1', 200.00),
('Debate Club', 'Public speaking and eloquence', 2, 'Friday', 'Main Hall', 150.00),
('Drama Club', 'Theatre, acting, and poetry', 3, 'Thursday', 'Main Hall', 250.00),
('ICT Club', 'Programming and Robotics', 4, 'Tuesday', 'Computer Lab 1', 300.00),
('Sports Club', 'Football and Athletics', 5, 'Monday', 'Main Field', 250.00),
('Scouts & Guides', 'Leadership and survival skills', 6, 'Tuesday', 'Pavilion', 100.00),
('Mathematics Club', 'Puzzles, logic, and contests', 7, 'Monday', 'Room 10B', 120.00),
('Environment Club', 'Conservation and tree planting', 8, 'Wednesday', 'School Garden', 100.00),
('Junior Achievement', 'Business skills and entrepreneurship', 9, 'Thursday', 'Room 12A', 200.00),
('Journalism Club', 'School magazine and broadcasting', 10, 'Friday', 'Library', 180.00),
('Cyber Security Club', 'Digital safety and cybersecurity awareness', 11, 'Thursday', 'Computer Lab 2', 350.00),
('Red Cross', 'First aid and community service', 12, 'Wednesday', 'Sanitarium Block', 100.00),
('Art & Design Club', 'Painting, sculpting, and crafts', 13, 'Tuesday', 'Art Studio', 220.00),
('Basketball Club', 'Court tactics and basketball training', 14, 'Friday', 'Basketball Court', 200.00),
('Young Farmers Club', 'Modern agriculture and livestock', 15, 'Monday', 'School Farm', 150.00),
('Cookery Club', 'Baking and culinary arts', 16, 'Thursday', 'Home Science Lab', 400.00),
('French Club', 'Language and culture appreciation', 17, 'Wednesday', 'Language Room', 150.00),
('Music & Choir', 'Vocal training and instruments', 18, 'Tuesday', 'Music Room', 200.00),
('Astronomy Club', 'Stargazing and space science', 19, 'Friday', 'Physics Lab', 180.00),
('History & Wildlife', 'Exploring heritage and game parks', 20, 'Monday', 'Geography Room', 160.00);


-- ============================================================
-- 4. STUDENTS
-- ============================================================

INSERT INTO students
(admission_no, first_name, last_name, gender, class, stream, phone, email)
VALUES
('VSC001','James','Maina','Male','Form 1','East','0700000001','student1@gmail.com'),
('VSC002','Mary','Wambui','Female','Form 1','West','0700000002','student2@gmail.com'),
('VSC003','John','Mwangi','Male','Form 1','East','0700000003','student3@gmail.com'),
('VSC004','Alice','Njeri','Female','Form 1','West','0700000004','student4@gmail.com'),
('VSC005','David','Kimani','Male','Form 1','East','0700000005','student5@gmail.com'),
('VSC006','Grace','Wanjiru','Female','Form 1','West','0700000006','student6@gmail.com'),
('VSC007','Peter','Kamau','Male','Form 1','East','0700000007','student7@gmail.com'),
('VSC008','Catherine','Nyambura','Female','Form 1','West','0700000008','student8@gmail.com'),
('VSC009','Joseph','Njoroge','Male','Form 1','East','0700000009','student9@gmail.com'),
('VSC010','Margaret','Atieno','Female','Form 1','West','0700000010','student10@gmail.com'),

('VSC011','Francis','Ochieng','Male','Form 2','East','0700000011','student11@gmail.com'),
('VSC012','Emily','Akinyi','Female','Form 2','West','0700000012','student12@gmail.com'),
('VSC013','Charles','Onyango','Male','Form 2','East','0700000013','student13@gmail.com'),
('VSC014','Dorothy','Anyango','Female','Form 2','West','0700000014','student14@gmail.com'),
('VSC015','Daniel','Otieno','Male','Form 2','East','0700000015','student15@gmail.com'),
('VSC016','Susan','Awour','Female','Form 2','West','0700000016','student16@gmail.com'),
('VSC017','Matthew','Okoth','Male','Form 2','East','0700000017','student17@gmail.com'),
('VSC018','Ruth','Adhiambo','Female','Form 2','West','0700000018','student18@gmail.com'),
('VSC019','Andrew','Odhiambo','Male','Form 2','East','0700000019','student19@gmail.com'),
('VSC020','Helen','Omondi','Female','Form 2','West','0700000020','student20@gmail.com'),

('VSC021','Patrick','Kiptoo','Male','Form 3','East','0700000021','student21@gmail.com'),
('VSC022','Janet','Chepkemoi','Female','Form 3','West','0700000022','student22@gmail.com'),
('VSC023','Dennis','Kibet','Male','Form 3','East','0700000023','student23@gmail.com'),
('VSC024','Elizabeth','Cherotich','Female','Form 3','West','0700000024','student24@gmail.com'),
('VSC025','Thomas','Kiprono','Male','Form 3','East','0700000025','student25@gmail.com'),
('VSC026','Rose','Chepkorir','Female','Form 3','West','0700000026','student26@gmail.com'),
('VSC027','George','Rotich','Male','Form 3','East','0700000027','student27@gmail.com'),
('VSC028','Nancy','Chebet','Female','Form 3','West','0700000028','student28@gmail.com'),
('VSC029','Edward','Tanui','Male','Form 3','East','0700000029','student29@gmail.com'),
('VSC030','Martha','Jepchirchir','Female','Form 3','West','0700000030','student30@gmail.com'),

('VSC031','Paul','Mutua','Male','Form 4','East','0700000031','student31@gmail.com'),
('VSC032','Ann','Nduku','Female','Form 4','West','0700000032','student32@gmail.com'),
('VSC033','Arthur','Musyoka','Male','Form 4','East','0700000033','student33@gmail.com'),
('VSC034','Beatrice','Syombua','Female','Form 4','West','0700000034','student34@gmail.com'),
('VSC035','Philip','Kioko','Male','Form 4','East','0700000035','student35@gmail.com'),
('VSC036','Caroline','Mumbua','Female','Form 4','West','0700000036','student36@gmail.com'),
('VSC037','Simon','Mwende','Male','Form 4','East','0700000037','student37@gmail.com'),
('VSC038','Lydia','Kavutha','Female','Form 4','West','0700000038','student38@gmail.com'),
('VSC039','Lawrence','Wambua','Male','Form 4','East','0700000039','student39@gmail.com'),
('VSC040','Jane','Mutheu','Female','Form 4','West','0700000040','student40@gmail.com'),

('VSC041','Timothy','Wafula','Male','Form 1','East','0700000041','student41@gmail.com'),
('VSC042','Joyce','Nekesa','Female','Form 1','West','0700000042','student42@gmail.com'),
('VSC043','Martin','Simiyu','Male','Form 1','East','0700000043','student43@gmail.com'),
('VSC044','Irene','Nafula','Female','Form 1','West','0700000044','student44@gmail.com'),
('VSC045','Bernard','Wanjala','Male','Form 1','East','0700000045','student45@gmail.com'),
('VSC046','Sarah','Nasimiyu','Female','Form 1','West','0700000046','student46@gmail.com'),
('VSC047','Anthony','Juma','Male','Form 1','East','0700000047','student47@gmail.com'),
('VSC048','Lilian','Barasa','Female','Form 1','West','0700000048','student48@gmail.com'),
('VSC049','Gregory','Kundu','Male','Form 1','East','0700000049','student49@gmail.com'),
('VSC050','Teresa','Wekesa','Female','Form 1','West','0700000050','student50@gmail.com'),

('VSC051','Brian','Musa','Male','Form 2','East','0700000051','student51@gmail.com'),
('VSC052','Fatuma','Ali','Female','Form 2','West','0700000052','student52@gmail.com'),
('VSC053','Hassan','Mohamed','Male','Form 2','East','0700000053','student53@gmail.com'),
('VSC054','Amina','Omar','Female','Form 2','West','0700000054','student54@gmail.com'),
('VSC055','Hussein','Ibrahim','Male','Form 2','East','0700000055','student55@gmail.com'),
('VSC056','Khadija','Abdi','Female','Form 2','West','0700000056','student56@gmail.com'),
('VSC057','Abdullahi','Ahmed','Male','Form 2','East','0700000057','student57@gmail.com'),
('VSC058','Zainab','Yusuf','Female','Form 2','West','0700000058','student58@gmail.com'),
('VSC059','Mustafa','Ismail','Male','Form 2','East','0700000059','student59@gmail.com'),
('VSC060','Halima','Adam','Female','Form 2','West','0700000060','student60@gmail.com'),

('VSC061','Kevin','Karanja','Male','Form 3','East','0700000061','student61@gmail.com'),
('VSC062','Lucy','Wairimu','Female','Form 3','West','0700000062','student62@gmail.com'),
('VSC063','Richard','Githua','Male','Form 3','East','0700000063','student63@gmail.com'),
('VSC064','Esther','Nyagah','Female','Form 3','West','0700000064','student64@gmail.com'),
('VSC065','Victor','Njuguna','Male','Form 3','East','0700000065','student65@gmail.com'),
('VSC066','Naomi','Muthoni','Female','Form 3','West','0700000066','student66@gmail.com'),
('VSC067','Robert','Murithi','Male','Form 3','East','0700000067','student67@gmail.com'),
('VSC068','Sylvia','Gakii','Female','Form 3','West','0700000068','student68@gmail.com'),
('VSC069','Alex','Gitonga','Male','Form 3','East','0700000069','student69@gmail.com'),
('VSC070','Diana','Kendi','Female','Form 3','West','0700000070','student70@gmail.com'),

('VSC071','Samuel','Lagat','Male','Form 4','East','0700000071','student71@gmail.com'),
('VSC072','Gladys','Chebet','Female','Form 4','West','0700000072','student72@gmail.com'),
('VSC073','Benjamin','Kipruto','Male','Form 4','East','0700000073','student73@gmail.com'),
('VSC074','Cynthia','Jepkosgei','Female','Form 4','West','0700000074','student74@gmail.com'),
('VSC075','Emmanuel','Cheruiyot','Male','Form 4','East','0700000075','student75@gmail.com'),
('VSC076','Caroline','Jepchirchir','Female','Form 4','West','0700000076','student76@gmail.com'),
('VSC077','Collins','Kipkoech','Male','Form 4','East','0700000077','student77@gmail.com'),
('VSC078','Faith','Chepkoech','Female','Form 4','West','0700000078','student78@gmail.com'),
('VSC079','Geoffrey','Kipyegon','Male','Form 4','East','0700000079','student79@gmail.com'),
('VSC080','Mercy','Chepngetich','Female','Form 4','West','0700000080','student80@gmail.com');


-- ============================================================
-- 5. MEMBERSHIPS
-- 80 students distributed across 20 clubs
-- Each club receives 4 members
-- ============================================================

INSERT INTO memberships
(student_id, club_id, join_date, status)
VALUES
(1,1,'2026-01-15','Active'),
(2,2,'2026-01-15','Active'),
(3,3,'2026-01-15','Active'),
(4,4,'2026-01-15','Active'),
(5,5,'2026-01-15','Active'),
(6,6,'2026-01-15','Active'),
(7,7,'2026-01-15','Active'),
(8,8,'2026-01-15','Active'),
(9,9,'2026-01-15','Active'),
(10,10,'2026-01-15','Active'),
(11,11,'2026-01-15','Active'),
(12,12,'2026-01-15','Active'),
(13,13,'2026-01-15','Active'),
(14,14,'2026-01-15','Active'),
(15,15,'2026-01-15','Active'),
(16,16,'2026-01-15','Active'),
(17,17,'2026-01-15','Active'),
(18,18,'2026-01-15','Active'),
(19,19,'2026-01-15','Active'),
(20,20,'2026-01-15','Active'),

(21,1,'2026-01-16','Active'),
(22,2,'2026-01-16','Active'),
(23,3,'2026-01-16','Active'),
(24,4,'2026-01-16','Active'),
(25,5,'2026-01-16','Active'),
(26,6,'2026-01-16','Active'),
(27,7,'2026-01-16','Active'),
(28,8,'2026-01-16','Active'),
(29,9,'2026-01-16','Active'),
(30,10,'2026-01-16','Active'),
(31,11,'2026-01-16','Active'),
(32,12,'2026-01-16','Active'),
(33,13,'2026-01-16','Active'),
(34,14,'2026-01-16','Active'),
(35,15,'2026-01-16','Active'),
(36,16,'2026-01-16','Active'),
(37,17,'2026-01-16','Active'),
(38,18,'2026-01-16','Active'),
(39,19,'2026-01-16','Active'),
(40,20,'2026-01-16','Active'),

(41,1,'2026-01-17','Active'),
(42,2,'2026-01-17','Active'),
(43,3,'2026-01-17','Active'),
(44,4,'2026-01-17','Active'),
(45,5,'2026-01-17','Active'),
(46,6,'2026-01-17','Active'),
(47,7,'2026-01-17','Active'),
(48,8,'2026-01-17','Active'),
(49,9,'2026-01-17','Active'),
(50,10,'2026-01-17','Active'),
(51,11,'2026-01-17','Active'),
(52,12,'2026-01-17','Active'),
(53,13,'2026-01-17','Active'),
(54,14,'2026-01-17','Active'),
(55,15,'2026-01-17','Active'),
(56,16,'2026-01-17','Active'),
(57,17,'2026-01-17','Active'),
(58,18,'2026-01-17','Active'),
(59,19,'2026-01-17','Active'),
(60,20,'2026-01-17','Active'),

(61,1,'2026-01-18','Pending'),
(62,2,'2026-01-18','Pending'),
(63,3,'2026-01-18','Active'),
(64,4,'2026-01-18','Active'),
(65,5,'2026-01-18','Active'),
(66,6,'2026-01-18','Active'),
(67,7,'2026-01-18','Active'),
(68,8,'2026-01-18','Active'),
(69,9,'2026-01-18','Active'),
(70,10,'2026-01-18','Active'),
(71,11,'2026-01-18','Active'),
(72,12,'2026-01-18','Active'),
(73,13,'2026-01-18','Active'),
(74,14,'2026-01-18','Active'),
(75,15,'2026-01-18','Active'),
(76,16,'2026-01-18','Active'),
(77,17,'2026-01-18','Active'),
(78,18,'2026-01-18','Active'),
(79,19,'2026-01-18','Active'),
(80,20,'2026-01-18','Active');


-- ============================================================
-- 6. ACTIVITIES / EVENTS
-- ============================================================

INSERT INTO activities
(club_id, activity_name, description, activity_date, venue)
VALUES
(1,'Science Fair Preparation','Preparing experiments and displays','2026-08-11','Lab 1'),
(2,'Inter-Class Debate','Debate on the impact of AI in education','2026-08-12','Main Hall'),
(3,'Drama Rehearsal','Rehearsal for annual school drama','2026-08-13','Main Hall'),
(4,'Hackathon Kickoff','Six-hour coding and innovation sprint','2026-08-14','Computer Lab 1'),
(5,'Football Training','Inter-house football training session','2026-08-15','Main Field'),
(6,'Leadership Training','Scouts leadership and teamwork session','2026-08-18','Pavilion'),
(7,'Mathematics Contest','Inter-class mathematics challenge','2026-08-19','Room 10B'),
(8,'Tree Planting Day','Environmental conservation activity','2026-08-20','School Garden'),
(9,'Business Pitch Day','Student entrepreneurship presentations','2026-08-21','Room 12A'),
(10,'School Magazine Meeting','Planning the next school magazine','2026-08-22','Library'),
(11,'Cyber Safety Workshop','Digital safety awareness workshop','2026-08-23','Computer Lab 2'),
(12,'Community Service','First aid and community service activity','2026-08-24','Sanitarium Block'),
(13,'Art Exhibition Preparation','Preparing student artwork for exhibition','2026-08-25','Art Studio'),
(14,'Basketball Training','Basketball skills and tactics session','2026-08-26','Basketball Court'),
(15,'Farm Project','Modern farming demonstration','2026-08-27','School Farm'),
(16,'Annual Bake Sale','Pastry and desserts fundraising event','2026-08-28','Dining Hall'),
(17,'French Cultural Day','French language and culture activities','2026-08-29','Language Room'),
(18,'Choir Practice','Preparation for school music festival','2026-08-30','Music Room'),
(19,'Astronomy Night','Introduction to astronomy and stargazing','2026-09-05','Physics Lab'),
(20,'Wildlife Awareness Day','Heritage and wildlife conservation talk','2026-09-06','Geography Room');


-- ============================================================
-- 7. EVENT REGISTRATIONS
-- ============================================================

INSERT INTO event_registrations
(activity_id, student_id, registration_date)
VALUES
(1,1,'2026-08-05'),
(1,21,'2026-08-06'),
(1,41,'2026-08-07'),

(2,2,'2026-08-06'),
(2,22,'2026-08-07'),
(2,42,'2026-08-08'),

(3,3,'2026-08-07'),
(3,23,'2026-08-08'),

(4,4,'2026-08-08'),
(4,24,'2026-08-09'),
(4,44,'2026-08-10'),

(5,5,'2026-08-09'),
(5,25,'2026-08-10'),

(6,6,'2026-08-10'),
(6,26,'2026-08-11'),

(7,7,'2026-08-11'),
(7,27,'2026-08-12'),

(8,8,'2026-08-12'),
(8,28,'2026-08-13'),

(16,16,'2026-08-15'),
(16,36,'2026-08-16'),
(16,56,'2026-08-17');


-- ============================================================
-- 8. ATTENDANCE
-- ============================================================

INSERT INTO attendance
(activity_id, student_id, attendance_date, status)
VALUES
(1,1,'2026-08-11','Present'),
(1,21,'2026-08-11','Present'),
(1,41,'2026-08-11','Absent'),

(2,2,'2026-08-12','Present'),
(2,22,'2026-08-12','Present'),
(2,42,'2026-08-12','Absent'),

(3,3,'2026-08-13','Present'),
(3,23,'2026-08-13','Present'),

(4,4,'2026-08-14','Present'),
(4,24,'2026-08-14','Absent'),
(4,44,'2026-08-14','Present'),

(5,5,'2026-08-15','Present'),
(5,25,'2026-08-15','Present'),

(6,6,'2026-08-18','Present'),
(6,26,'2026-08-18','Absent'),

(7,7,'2026-08-19','Present'),
(7,27,'2026-08-19','Present'),

(8,8,'2026-08-20','Present'),
(8,28,'2026-08-20','Present'),

(16,16,'2026-08-28','Present'),
(16,36,'2026-08-28','Present'),
(16,56,'2026-08-28','Absent');


-- ============================================================
-- 9. PAYMENTS
-- ============================================================

INSERT INTO payments
(student_id, club_id, amount, payment_date, payment_method)
VALUES
(1,1,200,'2026-01-15','M-Pesa'),
(2,2,150,'2026-01-15','M-Pesa'),
(3,3,250,'2026-01-15','Cash'),
(4,4,300,'2026-01-16','M-Pesa'),
(5,5,250,'2026-01-16','Bank'),
(6,6,100,'2026-01-16','M-Pesa'),
(7,7,120,'2026-01-17','Cash'),
(8,8,100,'2026-01-17','M-Pesa'),
(9,9,200,'2026-01-17','M-Pesa'),
(10,10,180,'2026-01-18','Cash'),
(11,11,350,'2026-01-18','M-Pesa'),
(12,12,100,'2026-01-18','M-Pesa'),
(13,13,220,'2026-01-19','Cash'),
(14,14,200,'2026-01-19','M-Pesa'),
(15,15,150,'2026-01-20','M-Pesa'),
(16,16,400,'2026-01-20','Bank'),
(17,17,150,'2026-01-20','M-Pesa'),
(18,18,200,'2026-01-21','Cash'),
(19,19,180,'2026-01-21','M-Pesa'),
(20,20,160,'2026-01-21','M-Pesa'),

(21,1,200,'2026-02-01','M-Pesa'),
(22,2,150,'2026-02-01','M-Pesa'),
(23,3,250,'2026-02-02','Cash'),
(24,4,300,'2026-02-02','M-Pesa'),
(25,5,250,'2026-02-03','M-Pesa');


-- ============================================================
-- 10. EXPENSES
-- ============================================================

INSERT INTO expenses
(club_id, expense_name, amount, expense_date, description)
VALUES
(1,'Science Materials',4500,'2026-08-01','Laboratory experiment materials'),
(2,'Debate Stationery',1800,'2026-08-02','Printing and debate materials'),
(3,'Drama Costumes',6500,'2026-08-03','Costumes and stage materials'),
(4,'ICT Equipment',12000,'2026-08-04','Computer accessories'),
(5,'Sports Equipment',8500,'2026-08-05','Training equipment'),
(6,'Scouts Supplies',3000,'2026-08-06','Outdoor training supplies'),
(7,'Math Competition',2500,'2026-08-07','Competition materials'),
(8,'Tree Seedlings',3500,'2026-08-08','Environmental project'),
(9,'Business Workshop',4000,'2026-08-09','Workshop materials'),
(10,'Magazine Printing',5500,'2026-08-10','Magazine printing'),
(11,'Cyber Workshop',6000,'2026-08-11','Workshop materials'),
(12,'First Aid Supplies',4500,'2026-08-12','First aid materials'),
(13,'Art Materials',5000,'2026-08-13','Paint and art supplies'),
(14,'Basketballs',7000,'2026-08-14','Training equipment'),
(15,'Farm Supplies',5500,'2026-08-15','Agricultural supplies'),
(16,'Baking Ingredients',6500,'2026-08-16','Bake sale ingredients'),
(17,'French Materials',2500,'2026-08-17','Language learning materials'),
(18,'Music Equipment',9000,'2026-08-18','Music accessories'),
(19,'Astronomy Materials',7500,'2026-08-19','Astronomy equipment'),
(20,'Wildlife Materials',3000,'2026-08-20','Educational materials');


-- ============================================================
-- 11. FINANCE
-- Legacy/simple finance records
-- ============================================================

INSERT INTO finance
(club_id, amount, date, description)
VALUES
(1,200,'2026-01-15','Science Club membership fee'),
(2,150,'2026-01-15','Debate Club membership fee'),
(3,250,'2026-01-15','Drama Club membership fee'),
(4,300,'2026-01-15','ICT Club membership fee'),
(5,250,'2026-01-15','Sports Club membership fee'),
(6,100,'2026-01-15','Scouts & Guides membership fee'),
(7,120,'2026-01-15','Mathematics Club membership fee'),
(8,100,'2026-01-15','Environment Club membership fee'),
(9,200,'2026-01-15','Junior Achievement membership fee'),
(10,180,'2026-01-15','Journalism Club membership fee'),
(11,350,'2026-01-15','Cyber Security Club membership fee'),
(12,100,'2026-01-15','Red Cross membership fee'),
(13,220,'2026-01-15','Art & Design Club membership fee'),
(14,200,'2026-01-15','Basketball Club membership fee'),
(15,150,'2026-01-15','Young Farmers Club membership fee'),
(16,400,'2026-01-15','Cookery Club membership fee'),
(17,150,'2026-01-15','French Club membership fee'),
(18,200,'2026-01-15','Music & Choir membership fee'),
(19,180,'2026-01-15','Astronomy Club membership fee'),
(20,160,'2026-01-15','History & Wildlife membership fee');


-- ============================================================
-- 12. ANNOUNCEMENTS
-- ============================================================

INSERT INTO announcements
(title, message, posted_by)
VALUES
(
 'Welcome to the 2026 Club Year',
 'Welcome all students to the Victory School Club Membership System for the 2026 academic year.',
 1
),
(
 'Club Membership Registration',
 'Students are reminded to complete their club membership registration and await approval where required.',
 1
),
(
 'Upcoming ICT Hackathon',
 'The ICT Club will host a coding hackathon. Registered students should check the event details.',
 1
),
(
 'Annual Bake Sale',
 'The Cookery Club will host the annual bake sale to support club activities.',
 1
);


-- ============================================================
-- 13. NOTIFICATIONS
-- ============================================================

INSERT INTO notifications
(user_id, message, status)
VALUES
(1,'Welcome Administrator. Your admin dashboard is ready.','Unread'),
(2,'You have been assigned as patron of the Science Club.','Read'),
(3,'You have been assigned as patron of the Debate Club.','Read'),
(4,'You have been assigned as patron of the Drama Club.','Read'),
(5,'You have been assigned as patron of the ICT Club.','Read'),
(1,'New student membership applications are waiting for review.','Unread'),
(1,'The ICT Club Hackathon is scheduled for August 14, 2026.','Unread');


-- ============================================================
-- 14. GALLERY
-- ============================================================

INSERT INTO gallery
(club_id, title, image_path)
VALUES
(1,'Science Fair','/uploads/gallery/science-fair.jpg'),
(2,'Debate Competition','/uploads/gallery/debate.jpg'),
(3,'Drama Rehearsal','/uploads/gallery/drama.jpg'),
(4,'ICT Hackathon','/uploads/gallery/hackathon.jpg'),
(5,'Sports Training','/uploads/gallery/sports.jpg'),
(8,'Tree Planting','/uploads/gallery/environment.jpg'),
(13,'Art Exhibition','/uploads/gallery/art.jpg'),
(18,'Choir Practice','/uploads/gallery/choir.jpg');


-- ============================================================
-- 15. CERTIFICATES
-- ============================================================

INSERT INTO certificates
(student_id, activity_id, certificate_no, issued_date)
VALUES
(1,1,'CERT-2026-001','2026-08-11'),
(21,1,'CERT-2026-002','2026-08-11'),
(2,2,'CERT-2026-003','2026-08-12'),
(22,2,'CERT-2026-004','2026-08-12'),
(4,4,'CERT-2026-005','2026-08-14'),
(44,4,'CERT-2026-006','2026-08-14');


-- ============================================================
-- 16. ELECTIONS
-- ============================================================

INSERT INTO elections
(club_id, title, election_date, status)
VALUES
(1,'Science Club Leadership 2026','2026-09-10','Upcoming'),
(2,'Debate Club Leadership 2026','2026-09-11','Open'),
(4,'ICT Club Leadership 2026','2026-09-12','Open'),
(18,'Music & Choir Leadership 2026','2026-09-13','Closed');


-- ============================================================
-- 17. CANDIDATES
-- ============================================================

INSERT INTO candidates
(election_id, student_id, position)
VALUES
-- Science Club
(1,1,'Chairperson'),
(1,21,'Chairperson'),
(1,41,'Secretary'),

-- Debate Club
(2,2,'Chairperson'),
(2,22,'Chairperson'),
(2,42,'Secretary'),

-- ICT Club
(3,4,'Chairperson'),
(3,24,'Chairperson'),
(3,44,'Secretary'),

-- Music & Choir
(4,18,'Chairperson'),
(4,38,'Chairperson'),
(4,58,'Secretary');


-- ============================================================
-- 18. VOTES
-- Only elections that are Open/Closed receive votes
-- ============================================================

INSERT INTO votes
(election_id, candidate_id, student_id)
VALUES
-- Debate Club election
(2,4,22),
(2,5,42),

-- ICT Club election
(3,7,24),
(3,8,44),

-- Music & Choir closed election
(4,10,38),
(4,11,58);


-- ============================================================
-- 19. STUDENT INTERESTS
-- ============================================================

INSERT INTO student_interests
(student_id, interest)
VALUES
(1,'Science'),
(2,'Debate'),
(3,'Drama'),
(4,'Programming'),
(5,'Football'),
(6,'Leadership'),
(7,'Mathematics'),
(8,'Environment'),
(9,'Business'),
(10,'Journalism'),
(11,'Cybersecurity'),
(12,'First Aid'),
(13,'Art'),
(14,'Basketball'),
(15,'Agriculture'),
(16,'Cooking'),
(17,'French'),
(18,'Music'),
(19,'Astronomy'),
(20,'History'),

(21,'Science'),
(22,'Public Speaking'),
(23,'Drama'),
(24,'Robotics'),
(25,'Athletics'),
(26,'Leadership'),
(27,'Mathematics'),
(28,'Conservation'),
(29,'Entrepreneurship'),
(30,'Writing');


-- ============================================================
-- 20. ACHIEVEMENTS
-- ============================================================

INSERT INTO achievements
(club_id, title, description, achievement_date)
VALUES
(1,'Best Science Project','Won first position in the school science exhibition.','2026-07-20'),
(2,'Debate Champions','Won the inter-class debate competition.','2026-07-25'),
(4,'Coding Excellence','Students completed a successful coding challenge.','2026-07-28'),
(5,'Sports Achievement','Club members performed well in inter-house athletics.','2026-07-30'),
(8,'Environmental Award','Club planted over 100 trees around the school.','2026-08-01'),
(18,'Music Festival Recognition','Choir received recognition during school music activities.','2026-08-05');


-- ============================================================
-- 21. RESOURCES
-- ============================================================

INSERT INTO resources
(club_id, resource_name, quantity, condition_status)
VALUES
(1,'Microscope',5,'Good'),
(1,'Science Beaker Set',10,'Good'),
(4,'Desktop Computers',20,'Good'),
(4,'Arduino Kits',10,'Good'),
(5,'Football',8,'Good'),
(5,'Training Cones',30,'Good'),
(7,'Mathematics Textbooks',25,'Good'),
(8,'Tree Seedlings',100,'New'),
(13,'Paint Sets',20,'Good'),
(14,'Basketballs',8,'Good'),
(16,'Baking Trays',12,'Good'),
(18,'Microphones',6,'Good'),
(19,'Telescope',2,'Good'),
(20,'Wildlife Books',30,'Good');


-- ============================================================
-- 22. AUDIT LOGS
-- ============================================================

INSERT INTO audit_logs
(user_id, action)
VALUES
(1,'Administrator logged into the system'),
(1,'Created and configured club management records'),
(1,'Reviewed student membership applications'),
(1,'Viewed financial reports'),
(1,'Viewed analytics dashboard'),
(1,'Created upcoming club elections');


-- ============================================================
-- 23. SETTINGS
-- ============================================================

INSERT INTO settings
(school_name, school_logo, academic_year, theme)
VALUES
('Victory School', '/images/logo.png', '2026', 'Professional');


-- ============================================================
-- END OF SAMPLE DATA
-- ============================================================