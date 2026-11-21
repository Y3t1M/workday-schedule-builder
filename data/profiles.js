/* Sample students for the phone demo (Demo Day QR code). On phones, each visitor gets one at random,
   remembered on that device; ?student=hudson|ava|diego|priya|marcus forces one. Desktop always shows Hudson.
   Every profile is made up. Course codes follow UA's style; sections, times, people and seats are invented. */
(function(){
  const D=window.SB_DATA;
  const S=r=>r.map(r=>({course:r[0],title:r[1],section:r[2],days:r[3],start:r[4],end:r[5],credits:r[6],seats:r[7],prereq:r[8],fills:r[9],room:r[10],instructor:r[11],id:r[0]+'-'+r[2]}));
  const P={
    ava:{
      id:'010388214', initials:'A', example:'MKTG 33503', minHours:120, totalHours:120, registrationOpens:'11/17/2026, 9:00 AM',
      student:{name:'Ava', year:'Freshman', program:'BSBA', degree:'Bachelor of Science in Business Administration',
        majors:[{name:'Marketing', conc:'Digital Marketing'}], minor:'None declared', minorShort:'None declared',
        catalog:'2026-27', expectedGrad:'May 2030', college:'Sam M. Walton College of Business',
        advisor:{name:'Taylor Brooks', first:'Taylor', title:'Academic Advisor, Walton Undergraduate Advising', office:'WCOB 140', email:'tbrooks@example.edu'},
        work:{label:'UREC Front Desk', job:'UREC Front Desk', source:'Workday Time Tracking · UREC student worker', days:['M','W'], start:'17:30', end:'20:30'}},
      requirements:[
        {group:'Pre-Business Core', hours:41, note:'Must be complete before any 30000/40000-level business course.', items:[
          {course:'ENGL 10103', title:'Composition I', h:3, status:'inprogress', term:'Fall 2026'},
          {course:'ENGL 10203', title:'Composition II', h:3, status:'open', pathway:'Year 1 · Spring', prereq:'ENGL 10103'},
          {course:'MATH 20503', title:'Finite Mathematics', h:3, status:'open', pathway:'Year 1 · Spring'},
          {course:'MATH 20403', title:'Calculus I', h:3, status:'later', after:'MATH 20503'},
          {course:'ECON 20103', title:'Principles of Macroeconomics', h:3, status:'open', pathway:'Year 1 · Spring'},
          {course:'ECON 20203', title:'Principles of Microeconomics', h:3, status:'later', after:'ECON 20103'},
          {course:'STAT 20203', title:'Business Statistics', h:3, status:'later', after:'MATH 20503'},
          {course:'SPCH 10003', title:'Public Speaking', h:3, status:'open', pathway:'Year 1 · Spring'},
          {course:'ISYS 11203', title:'Business Application Knowledge', h:3, status:'inprogress', term:'Fall 2026'},
          {course:'ISYS 10303', title:'Data Analysis and Interpretation', h:3, status:'open'},
          {course:'PLSC 20003', title:'American National Government', h:3, status:'done'},
          {course:'BUSI 11101', title:'Freshman Business Connection', h:1, status:'inprogress', term:'Fall 2026'},
          {course:'ACCT 20103', title:'Accounting Principles I', h:3, status:'later', after:'Sophomore standing'},
          {course:'ACCT 20203', title:'Accounting Principles II', h:3, status:'later', after:'ACCT 20103'},
          {course:'ISYS 20303', title:'Foundations of Business Analytics', h:3, status:'later', after:'ISYS 10303'}]},
        {group:'State Minimum Core', hours:15, items:[
          {course:'HIST 20003', title:'History of the American People to 1877', h:3, status:'done'},
          {course:'PSYC 20003', title:'General Psychology', h:3, status:'open'},
          {course:'BIOL 10103', title:'Principles of Biology', h:3, status:'inprogress', term:'Fall 2026'},
          {course:'Fine Arts', title:'Fine Arts elective', h:3, status:'open', nosections:true},
          {course:'HUMN 10103', title:'Introduction to Humanities', h:3, status:'inprogress', term:'Fall 2026'}]},
        {group:'Marketing Major', hours:24, items:[
          {course:'MKTG 33503', title:'Introduction to Marketing', h:3, status:'later', after:'Pre-Business Core'},
          {course:'MKTG 35503', title:'Digital Marketing', h:3, status:'later', after:'MKTG 33503'},
          {course:'Marketing electives', title:'30000/40000-level MKTG courses', h:18, status:'later', after:'MKTG 33503'}]},
        {group:'General Electives', hours:6, items:[
          {course:'Elective', title:'Any course numbered 10000 or above', h:6, status:'open', nosections:true}]}
      ],
      sections:[
        ['ENGL 10203','Composition II','004','MWF','09:00','09:50',3,14,'ENGL 10103','Pre-Business Core','KIMP 312','L. Ortiz'],
        ['ENGL 10203','Composition II','011','TTh','11:00','12:15',3,6,'ENGL 10103','Pre-Business Core','KIMP 315','D. Shaw'],
        ['MATH 20503','Finite Mathematics','002','MWF','10:00','10:50',3,22,'','Pre-Business Core','SCEN 403','P. Nguyen'],
        ['MATH 20503','Finite Mathematics','006','TTh','09:30','10:45',3,9,'','Pre-Business Core','SCEN 407','P. Nguyen'],
        ['ECON 20103','Principles of Macroeconomics','001','MW','13:00','14:15',3,30,'','Pre-Business Core','WCOB 170','R. Delgado'],
        ['ECON 20103','Principles of Macroeconomics','003','TTh','14:00','15:15',3,12,'','Pre-Business Core','WCOB 170','S. Ito'],
        ['SPCH 10003','Public Speaking','008','MWF','11:00','11:50',3,5,'','Pre-Business Core','KIMP 108','J. Reyes'],
        ['SPCH 10003','Public Speaking','015','TTh','12:30','13:45',3,7,'','Pre-Business Core','KIMP 110','J. Reyes'],
        ['ISYS 10303','Data Analysis and Interpretation','002','MW','14:30','15:45',3,18,'','Pre-Business Core','WCOB 210','C. Morgan'],
        ['ISYS 10303','Data Analysis and Interpretation','005','TTh','15:30','16:45',3,4,'','Pre-Business Core','WCOB 210','K. Fox'],
        ['PSYC 20003','General Psychology','001','MWF','12:00','12:50',3,40,'','State Minimum Core','MEMH 201','A. Banks'],
        ['PSYC 20003','General Psychology','003','TTh','08:00','09:15',3,25,'','State Minimum Core','MEMH 201','A. Banks'],
        ['MATH 20403','Calculus I','001','MWF','08:35','09:25',3,16,'MATH 20503','Pre-Business Core','SCEN 322','H. Roy']
      ], credits:15},
    diego:{
      id:'010451937', initials:'D', example:'MEEG 31003', minHours:128, totalHours:128, registrationOpens:'11/09/2026, 8:00 AM',
      student:{name:'Diego', year:'Junior', program:'BSME', degree:'Bachelor of Science in Mechanical Engineering',
        majors:[{name:'Mechanical Engineering', conc:'Thermal and Fluid Systems'}], minor:'Mathematics', minorShort:'Mathematics',
        catalog:'2024-25', expectedGrad:'May 2028', college:'College of Engineering',
        advisor:{name:'Jordan Hale', first:'Jordan', title:'Academic Advisor, College of Engineering', office:'BELL 3189', email:'jhale@example.edu'},
        work:{label:'Tutor Lab', job:'Engineering Tutoring Center', source:'Workday Time Tracking · Engineering tutor', days:['T','Th'], start:'15:30', end:'18:30'}},
      requirements:[
        {group:'Mechanical Engineering Core', hours:33, note:'Junior-level MEEG courses need Statics and Thermodynamics I.', items:[
          {course:'MEEG 21303', title:'Statics', h:3, status:'done'},
          {course:'MEEG 21403', title:'Dynamics', h:3, status:'inprogress', term:'Fall 2026'},
          {course:'MEEG 22003', title:'Thermodynamics I', h:3, status:'done'},
          {course:'MEEG 23003', title:'Mechanics of Materials', h:3, status:'open', pathway:'Year 3 · Spring', prereq:'MEEG 21303'},
          {course:'MEEG 33003', title:'Thermodynamics II', h:3, status:'open', pathway:'Year 3 · Spring', prereq:'MEEG 22003'},
          {course:'MEEG 35003', title:'Fluid Mechanics', h:3, status:'open', pathway:'Year 3 · Spring', prereq:'MEEG 22003'},
          {course:'MEEG 31003', title:'Machine Design', h:3, status:'later', after:'MEEG 23003'},
          {course:'MEEG 41003', title:'Heat Transfer', h:3, status:'later', after:'MEEG 35003'},
          {course:'MEEG 44103', title:'Senior Design I', h:3, status:'later', after:'Senior standing'},
          {course:'MEEG 44203', title:'Senior Design II', h:3, status:'later', after:'MEEG 44103'},
          {course:'MEEG 31201', title:'Mechanical Engineering Lab I', h:3, status:'later', after:'MEEG 35003'}]},
        {group:'Math and Science', hours:26, items:[
          {course:'MATH 24004', title:'Calculus I', h:4, status:'done'},
          {course:'MATH 25004', title:'Calculus II', h:4, status:'done'},
          {course:'MATH 26004', title:'Calculus III', h:4, status:'done'},
          {course:'MATH 25804', title:'Differential Equations', h:4, status:'open', pathway:'Year 3 · Spring'},
          {course:'PHYS 20304', title:'University Physics I', h:4, status:'done'},
          {course:'PHYS 20404', title:'University Physics II', h:4, status:'inprogress', term:'Fall 2026'},
          {course:'CHEM 14103', title:'University Chemistry I', h:2, status:'done'}]},
        {group:'Engineering Breadth', hours:9, items:[
          {course:'ELEG 30003', title:'Circuits for Engineers', h:3, status:'open', pathway:'Year 3 · Spring'},
          {course:'ENGL 32103', title:'Technical Writing', h:3, status:'open'},
          {course:'INEG 23103', title:'Engineering Economic Analysis', h:3, status:'inprogress', term:'Fall 2026'}]},
        {group:'Mathematics Minor', hours:15, items:[
          {course:'MATH 30103', title:'Linear Algebra', h:3, status:'open'},
          {course:'MATH 30603', title:'Introduction to Proofs', h:3, status:'done'},
          {course:'Math electives', title:'30000/40000-level MATH courses', h:9, status:'later', after:'MATH 30103'}]},
        {group:'University Core', hours:33, items:[
          {course:'ENGL 10103', title:'Composition I', h:3, status:'done'},
          {course:'ENGL 10203', title:'Composition II', h:3, status:'done'},
          {course:'HIST 20003', title:'History of the American People to 1877', h:3, status:'done'},
          {course:'PSYC 20003', title:'General Psychology', h:3, status:'done'},
          {course:'ECON 20103', title:'Principles of Macroeconomics', h:3, status:'done'},
          {course:'HUMN 10103', title:'Introduction to Humanities', h:3, status:'done'},
          {course:'MUSC 10103', title:'Music Appreciation', h:3, status:'done'},
          {course:'GNEG 11103', title:'Introduction to Engineering I', h:3, status:'done'},
          {course:'GNEG 11203', title:'Introduction to Engineering II', h:3, status:'done'},
          {course:'CHEM 14203', title:'University Chemistry II', h:3, status:'done'},
          {course:'COMM 10003', title:'Communication in a Diverse World', h:3, status:'done'}]},
        {group:'Technical Electives', hours:9, items:[
          {course:'Technical electives', title:'Approved 40000-level MEEG courses', h:9, status:'later', after:'Senior standing'}]}
      ],
      sections:[
        ['MEEG 23003','Mechanics of Materials','001','MWF','09:00','09:50',3,11,'MEEG 21303','Mechanical Engineering Core','MECE 202','T. Walsh'],
        ['MEEG 23003','Mechanics of Materials','002','TTh','09:30','10:45',3,6,'MEEG 21303','Mechanical Engineering Core','MECE 202','T. Walsh'],
        ['MEEG 33003','Thermodynamics II','001','MWF','10:00','10:50',3,15,'MEEG 22003','Mechanical Engineering Core','MECE 218','R. Singh'],
        ['MEEG 33003','Thermodynamics II','002','TTh','11:00','12:15',3,4,'MEEG 22003','Mechanical Engineering Core','MECE 218','R. Singh'],
        ['MEEG 35003','Fluid Mechanics','001','MWF','11:00','11:50',3,9,'MEEG 22003','Mechanical Engineering Core','MECE 204','E. Moreno'],
        ['MEEG 35003','Fluid Mechanics','002','TTh','13:00','14:15',3,12,'MEEG 22003','Mechanical Engineering Core','MECE 204','E. Moreno'],
        ['MATH 25804','Differential Equations','003','MTWF','13:00','13:50',4,20,'','Math and Science','SCEN 408','B. Carter'],
        ['MATH 25804','Differential Equations','005','MWF','08:00','09:15',4,8,'','Math and Science','SCEN 409','B. Carter'],
        ['ELEG 30003','Circuits for Engineers','001','MW','14:30','15:45',3,14,'','Engineering Breadth','BELL 2268','N. Iyer'],
        ['ELEG 30003','Circuits for Engineers','002','TTh','08:00','09:15',3,10,'','Engineering Breadth','BELL 2268','N. Iyer'],
        ['ENGL 32103','Technical Writing','002','MW','16:00','17:15',3,9,'','Engineering Breadth','KIMP 408','M. Lowe'],
        ['ENGL 32103','Technical Writing','006','TTh','14:00','15:15',3,5,'','Engineering Breadth','KIMP 410','M. Lowe'],
        ['MATH 30103','Linear Algebra','001','MWF','12:00','12:50',3,16,'','Mathematics Minor','SCEN 322','H. Roy'],
        ['MATH 30103','Linear Algebra','004','TTh','12:30','13:45',3,7,'','Mathematics Minor','SCEN 322','H. Roy'],
        ['MEEG 31003','Machine Design','001','MW','11:00','12:15',3,10,'MEEG 23003','Mechanical Engineering Core','MECE 202','T. Walsh']
      ], credits:15},
    priya:{
      id:'010529473', initials:'P', example:'CSCE 31203', minHours:120, totalHours:120, registrationOpens:'11/12/2026, 10:00 AM',
      student:{name:'Priya', year:'Sophomore', program:'BSCS', degree:'Bachelor of Science in Computer Science',
        majors:[{name:'Computer Science', conc:'Software Engineering'}], minor:'Data Science', minorShort:'Data Science',
        catalog:'2025-26', expectedGrad:'May 2029', college:'College of Engineering',
        advisor:{name:'Morgan Reyes', first:'Morgan', title:'Academic Advisor, Computer Science and Computer Engineering', office:'JBHT 504', email:'mreyes@example.edu'},
        work:{label:'Library Desk', job:'Mullins Library Help Desk', source:'Workday Time Tracking · Library student worker', days:['M','W'], start:'18:00', end:'21:00'}},
      requirements:[
        {group:'Computer Science Core', hours:24, note:'Data Structures opens up the 30000-level courses.', items:[
          {course:'CSCE 13103', title:'Programming Foundations I', h:3, status:'done'},
          {course:'CSCE 13203', title:'Programming Foundations II', h:3, status:'inprogress', term:'Fall 2026'},
          {course:'CSCE 23003', title:'Data Structures', h:3, status:'open', pathway:'Year 2 · Spring', prereq:'CSCE 13203'},
          {course:'CSCE 21003', title:'Discrete Structures', h:3, status:'open', pathway:'Year 2 · Spring'},
          {course:'CSCE 24103', title:'Digital Design', h:3, status:'open', pathway:'Year 2 · Spring'},
          {course:'CSCE 31203', title:'Algorithms', h:3, status:'later', after:'CSCE 23003'},
          {course:'CSCE 33503', title:'Software Engineering', h:3, status:'later', after:'CSCE 23003'},
          {course:'CSCE 36103', title:'Operating Systems', h:3, status:'later', after:'CSCE 23003'}]},
        {group:'University Core', hours:36, items:[
          {course:'ENGL 10103', title:'Composition I', h:3, status:'done'},
          {course:'ENGL 10203', title:'Composition II', h:3, status:'done'},
          {course:'PSYC 20003', title:'General Psychology', h:3, status:'done'},
          {course:'ECON 20103', title:'Principles of Macroeconomics', h:3, status:'done'},
          {course:'HIST 20003', title:'History of the American People to 1877', h:3, status:'inprogress', term:'Fall 2026'},
          {course:'MUSC 10103', title:'Music Appreciation', h:3, status:'done'},
          {course:'COMM 10003', title:'Communication in a Diverse World', h:3, status:'open'},
          {course:'HUMN 10103', title:'Introduction to Humanities', h:3, status:'open'},
          {course:'PHIL 20003', title:'Introduction to Ethics', h:3, status:'open'},
          {course:'BIOL 10103', title:'Principles of Biology', h:3, status:'done'},
          {course:'PLSC 20003', title:'American National Government', h:3, status:'done'},
          {course:'CSCE 10003', title:'Introduction to Computing', h:3, status:'done'}]},
        {group:'Math and Science', hours:20, items:[
          {course:'MATH 24004', title:'Calculus I', h:4, status:'done'},
          {course:'MATH 25004', title:'Calculus II', h:4, status:'inprogress', term:'Fall 2026'},
          {course:'MATH 26004', title:'Calculus III', h:4, status:'open', prereq:'MATH 25004'},
          {course:'PHYS 20304', title:'University Physics I', h:4, status:'open'},
          {course:'STAT 30103', title:'Probability and Statistics', h:4, status:'later', after:'MATH 26004'}]},
        {group:'Data Science Minor', hours:15, items:[
          {course:'DASC 10003', title:'Introduction to Data Science', h:3, status:'done'},
          {course:'Data Science courses', title:'DASC 20000/30000-level courses', h:12, status:'later', after:'CSCE 23003'}]}
      ],
      sections:[
        ['CSCE 23003','Data Structures','001','MWF','09:00','09:50',3,14,'CSCE 13203','Computer Science Core','JBHT 239','A. Wu'],
        ['CSCE 23003','Data Structures','002','TTh','11:00','12:15',3,6,'CSCE 13203','Computer Science Core','JBHT 239','A. Wu'],
        ['CSCE 21003','Discrete Structures','001','MWF','10:00','10:50',3,20,'','Computer Science Core','JBHT 216','S. Patel'],
        ['CSCE 21003','Discrete Structures','003','TTh','09:30','10:45',3,9,'','Computer Science Core','JBHT 216','S. Patel'],
        ['CSCE 24103','Digital Design','001','MW','13:00','14:15',3,12,'','Computer Science Core','JBHT 140','L. Novak'],
        ['CSCE 24103','Digital Design','002','TTh','14:00','15:15',3,5,'','Computer Science Core','JBHT 140','L. Novak'],
        ['MATH 26004','Calculus III','002','MTWF','11:00','11:50',4,18,'MATH 25004','Math and Science','SCEN 402','B. Carter'],
        ['MATH 26004','Calculus III','005','MWF','14:30','15:45',4,7,'MATH 25004','Math and Science','SCEN 406','B. Carter'],
        ['PHYS 20304','University Physics I','001','MWF','12:00','12:50',4,30,'','Math and Science','PHYS 133','K. Lin'],
        ['PHYS 20304','University Physics I','004','TTh','15:30','17:15',4,11,'','Math and Science','PHYS 133','K. Lin'],
        ['COMM 10003','Communication in a Diverse World','006','MW','16:00','17:15',3,16,'','University Core','KIMP 203','J. Reyes'],
        ['COMM 10003','Communication in a Diverse World','011','TTh','12:30','13:45',3,8,'','University Core','KIMP 205','J. Reyes'],
        ['HUMN 10103','Introduction to Humanities','001','MW','10:00','10:50',3,25,'','University Core','KIMP 102','M. Lowe'],
        ['HUMN 10103','Introduction to Humanities','004','TTh','08:00','09:15',3,15,'','University Core','KIMP 102','M. Lowe'],
        ['PHIL 20003','Introduction to Ethics','002','MWF','08:00','08:50',3,24,'','University Core','MAIN 318','E. Ford'],
        ['PHIL 20003','Introduction to Ethics','005','TTh','15:30','16:45',3,11,'','University Core','MAIN 318','E. Ford'],
        ['CSCE 31203','Algorithms','001','TTh','09:30','10:45',3,10,'CSCE 23003','Computer Science Core','JBHT 239','A. Wu']
      ], credits:15},
    marcus:{
      id:'010173659', initials:'M', example:'PSYC 40103', minHours:120, totalHours:120, registrationOpens:'11/02/2026, 8:00 AM',
      student:{name:'Marcus', year:'Senior', program:'BA', degree:'Bachelor of Arts in Psychology',
        majors:[{name:'Psychology', conc:'Clinical and Counseling'}], minor:'Sociology', minorShort:'Sociology',
        catalog:'2023-24', expectedGrad:'May 2027', college:'Fulbright College of Arts and Sciences',
        advisor:{name:'Casey Moran', first:'Casey', title:'Academic Advisor, Fulbright College', office:'OLDM 525', email:'cmoran@example.edu'},
        work:{label:'Lab Shift', job:'Psychology Research Lab', source:'Workday Time Tracking · Research assistant', days:['T','Th'], start:'13:00', end:'16:00'}},
      requirements:[
        {group:'Psychology Major', hours:33, note:'Senior Seminar is the last course in the major.', items:[
          {course:'PSYC 20003', title:'General Psychology', h:3, status:'done'},
          {course:'PSYC 21003', title:'Research Methods', h:3, status:'done'},
          {course:'PSYC 30103', title:'Statistics for Psychology', h:3, status:'done'},
          {course:'PSYC 31103', title:'Social Psychology', h:3, status:'done'},
          {course:'PSYC 32103', title:'Developmental Psychology', h:3, status:'done'},
          {course:'PSYC 30203', title:'Experimental Methods', h:3, status:'inprogress', term:'Fall 2026'},
          {course:'PSYC 31203', title:'Cognitive Psychology', h:3, status:'open', pathway:'Year 4 · Spring'},
          {course:'PSYC 35303', title:'Abnormal Psychology', h:3, status:'open', pathway:'Year 4 · Spring'},
          {course:'PSYC 40103', title:'Senior Seminar', h:3, status:'open', pathway:'Year 4 · Spring', prereq:'PSYC 30103'},
          {course:'PSYC 36103', title:'Biological Psychology', h:3, status:'done'},
          {course:'PSYC 33003', title:'Personality', h:3, status:'done'}]},
        {group:'Sociology Minor', hours:15, items:[
          {course:'SOCI 10103', title:'Introduction to Sociology', h:3, status:'done'},
          {course:'SOCI 20003', title:'Social Problems', h:3, status:'done'},
          {course:'SOCI 32003', title:'Race and Ethnicity', h:3, status:'inprogress', term:'Fall 2026'},
          {course:'SOCI 30203', title:'Social Inequality', h:3, status:'open'},
          {course:'SOCI 31303', title:'Sociology of the Family', h:3, status:'open'}]},
        {group:'Fulbright Core', hours:42, items:[
          {course:'ENGL 10103', title:'Composition I', h:3, status:'done'},
          {course:'ENGL 10203', title:'Composition II', h:3, status:'done'},
          {course:'MATH 12003', title:'College Algebra', h:3, status:'done'},
          {course:'BIOL 10103', title:'Principles of Biology', h:3, status:'done'},
          {course:'CHEM 10103', title:'Chemistry in the Modern World', h:3, status:'done'},
          {course:'HIST 20003', title:'History of the American People to 1877', h:3, status:'done'},
          {course:'PLSC 20003', title:'American National Government', h:3, status:'done'},
          {course:'HUMN 10103', title:'Introduction to Humanities', h:3, status:'done'},
          {course:'MUSC 10103', title:'Music Appreciation', h:3, status:'done'},
          {course:'SPAN 10103', title:'Elementary Spanish I', h:3, status:'done'},
          {course:'SPAN 10203', title:'Elementary Spanish II', h:3, status:'done'},
          {course:'COMM 10003', title:'Communication in a Diverse World', h:3, status:'done'},
          {course:'ANTH 10203', title:'Introduction to Cultural Anthropology', h:3, status:'done'},
          {course:'PHIL 20003', title:'Introduction to Ethics', h:3, status:'open'}]},
        {group:'General Electives', hours:30, items:[
          {course:'Electives completed', title:'Courses toward 120 hours', h:21, status:'done'},
          {course:'Electives in progress', title:'Fall 2026 electives', h:9, status:'inprogress', term:'Fall 2026'}]}
      ],
      sections:[
        ['PSYC 31203','Cognitive Psychology','001','MWF','09:00','09:50',3,15,'','Psychology Major','MEMH 222','R. Hart'],
        ['PSYC 31203','Cognitive Psychology','002','TTh','09:30','10:45',3,6,'','Psychology Major','MEMH 222','R. Hart'],
        ['PSYC 35303','Abnormal Psychology','001','MWF','11:00','11:50',3,10,'','Psychology Major','MEMH 201','D. Ruiz'],
        ['PSYC 35303','Abnormal Psychology','003','TTh','11:00','12:15',3,4,'','Psychology Major','MEMH 201','D. Ruiz'],
        ['PSYC 40103','Senior Seminar','001','MW','13:00','14:15',3,12,'PSYC 30103','Psychology Major','MEMH 310','S. Grey'],
        ['PSYC 40103','Senior Seminar','002','TTh','08:00','09:15',3,8,'PSYC 30103','Psychology Major','MEMH 310','S. Grey'],
        ['SOCI 30203','Social Inequality','001','MWF','10:00','10:50',3,22,'','Sociology Minor','OLDM 302','T. Lane'],
        ['SOCI 30203','Social Inequality','002','TTh','16:30','17:45',3,9,'','Sociology Minor','OLDM 302','T. Lane'],
        ['SOCI 31303','Sociology of the Family','001','MW','14:30','15:45',3,14,'','Sociology Minor','OLDM 306','T. Lane'],
        ['SOCI 31303','Sociology of the Family','002','F','09:00','11:45',3,10,'','Sociology Minor','OLDM 306','N. Shah'],
        ['PHIL 20003','Introduction to Ethics','001','MWF','12:00','12:50',3,30,'','Fulbright Core','MAIN 318','E. Ford'],
        ['PHIL 20003','Introduction to Ethics','003','TTh','12:30','13:45',3,12,'','Fulbright Core','MAIN 318','E. Ford']
      ], credits:15}
  };
  // every course any sample student has, so the look-up can explain courses outside a student's plan
  const CAT={}; const addCat=(course,title,h,prereq)=>{ if(/^[A-Z]{3,4} \d{5}$/.test(course)&&!CAT[course]) CAT[course]={course,title,h,prereq:prereq||null}; };
  [D.requirements,...Object.values(P).map(q=>q.requirements)].forEach(rs=>rs.forEach(g=>g.items.forEach(i=>addCat(i.course,i.title,i.h,i.prereq||(/^[A-Z]{3,4} \d{5}$/.test(i.after||'')?i.after:null)))));
  D.sections.forEach(s=>addCat(s.course,s.title,s.credits,s.prereq)); Object.values(P).forEach(q=>q.sections.forEach(r=>addCat(r[0],r[1],r[6],r[8])));
  window.SB_CATALOG=CAT; D.lookupExample='FINN 30603';
  const KEYS=['hudson','ava','diego','priya','marcus'];
  const phone=window.matchMedia&&matchMedia('(max-width: 700px)').matches;
  let key=new URLSearchParams(location.search).get('student');
  if(!KEYS.includes(key)) key=null;
  if(!key&&phone){ try{ key=localStorage.getItem('sb-student'); }catch(e){} if(!KEYS.includes(key)){ key=KEYS[Math.floor(Math.random()*KEYS.length)]; try{ localStorage.setItem('sb-student',key); }catch(e){} } }
  if(!key) key='hudson';
  // a different student than this tab last built for: start the builder over
  try{ if(sessionStorage.getItem('sb-student')!==key){ sessionStorage.removeItem('sb-state'); sessionStorage.setItem('sb-student',key); } }catch(e){}
  window.SB_PROFILE={key, keys:KEYS, phone,
    next(){ const n=KEYS[(KEYS.indexOf(key)+1)%KEYS.length]; try{ localStorage.setItem('sb-student',n); sessionStorage.removeItem('sb-state'); }catch(e){} const u=new URL(location.href); u.searchParams.delete('student'); u.hash='start'; location.replace(u.toString()); setTimeout(()=>location.reload(),50); }};
  if(key==='hudson') return;
  const p=P[key];
  Object.assign(D,{student:p.student, requirements:p.requirements, sections:S(p.sections), registrationOpens:p.registrationOpens});
  D.defaultPrefs=Object.assign({},D.defaultPrefs,{credits:p.credits, sentence:''});
  SB_DERIVE(D); D.minHours=p.minHours; D.totalHours=p.totalHours; D.lookupExample=p.example;
  if(window.DEMO_STUDENT){ DEMO_STUDENT.name=p.student.name; DEMO_STUDENT.initials=p.initials; DEMO_STUDENT.id=p.id; }
  const fix=()=>document.querySelectorAll('.wd-avatar').forEach(a=>{ if(a.textContent.trim().length<=2) a.textContent=p.initials; });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fix); else fix();
})();
