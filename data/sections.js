/* Sample data for the demo. Course codes use UA's Workday format (five digits, the last is
   credit hours). Requirement groups follow the Walton BSBA degree worksheet; the Finance
   electives, rooms and instructors come from a real Spring 2027 saved schedule. Times and
   seats are made up so the demo hits every case: a clean schedule, a time conflict, a full
   section, a missing prerequisite, 1- and 2-hour classes. */
window.SB_DATA = {
  term: 'UAF Spring 2027 (01/19/2027-05/14/2027)',
  termShort: 'Spring 2027',
  termStart: '2027-01-19', termEnd: '2027-05-14',
  registrationOpens: '11/10/2026, 8:00 AM',
  addDropUntil: '01/26/2027',
  terms: ['UAF Spring 2027 (01/19/2027-05/14/2027)','UAF Spring 12 Weeks 2027 (01/19/2027-04/16/2027)','UAF Spring II 2027 (03/10/2027-05/14/2027)','UAF Spring January Intersession 2027 (01/04/2027-01/15/2027)'],
  student: {
    name: 'Hudson Tinch', year: 'Sophomore', program: 'BSBA',
    degree: 'Bachelor of Science in Business Administration',
    majors: [{name:'Finance', conc:'Management & Investments'},{name:'Information Systems', conc:'Enterprise Resource Planning'}],
    minor: 'Strategy, Entrepreneurship & Venture Innovation (SEVI)', minorShort:'SEVI',
    catalog: '2025-26', expectedGrad: 'May 2029', college: 'Sam M. Walton College of Business',
    advisor: {name:'Blaise M. Simecek', first:'Blaise', title:'Assistant Director, Walton Honors Program', office:'WCOB 335', email:'bsimecek@walton.uark.edu'},
    // Work schedule on file in Workday (Time Tracking) for the student job
    work: {label:'Campus job', job:'Walton Dean’s Office', source:'Workday Time Tracking · Walton Dean’s Office student worker', days:['T','Th'], start:'13:00', end:'17:00'}
  },
  // Degree worksheet. status: done | inprogress | open (eligible now) | later (prerequisite or standing not met)
  requirements: [
    {group:'Pre-Business Core', hours:41, note:'Must be complete before any 30000/40000-level business course.', items:[
      {course:'ENGL 10103', title:'Composition I', h:3, status:'done'},
      {course:'ENGL 10203', title:'Composition II', h:3, status:'inprogress', term:'Fall 2026'},
      {course:'MATH 20503', title:'Finite Mathematics', h:3, status:'done'},
      {course:'MATH 20403', title:'Calculus I', h:3, status:'done'},
      {course:'ECON 20103', title:'Principles of Macroeconomics', h:3, status:'inprogress', term:'Fall 2026'},
      {course:'ECON 20203', title:'Principles of Microeconomics', h:3, status:'open', pathway:'Year 2 · Spring'},
      {course:'STAT 20203', title:'Business Statistics', h:3, status:'open', pathway:'Year 2 · Spring'},
      {course:'SPCH 10003', title:'Public Speaking', h:3, status:'done'},
      {course:'ISYS 11203', title:'Business Application Knowledge', h:3, status:'done'},
      {course:'ISYS 10303', title:'Data Analysis and Interpretation', h:3, status:'done'},
      {course:'PLSC 20003', title:'American National Government', h:1, status:'done'},
      {course:'BUSI 11101', title:'Freshman Business Connection', h:1, status:'done'},
      {course:'ISYS 20303', title:'Foundations of Business Analytics', h:3, status:'inprogress', term:'Fall 2026'},
      {course:'ACCT 20103', title:'Accounting Principles I', h:3, status:'done'},
      {course:'ACCT 20203', title:'Accounting Principles II', h:3, status:'inprogress', term:'Fall 2026'}
    ]},
    {group:'Business Core', hours:21, note:'SEVI 30103 requires a C or better in all other business core courses.', items:[
      {course:'BLAW 20003', title:'The Legal Environment of Business', h:3, status:'done'},
      {course:'ISYS 21003', title:'Business Information Systems', h:3, status:'open', pathway:'Year 2 · Spring'},
      {course:'SCMT 21003', title:'Integrated Supply Chain Management', h:3, status:'done'},
      {course:'MGMT 21003', title:'Managing People and Organizations', h:3, status:'done'},
      {course:'FINN 20403', title:'Principles of Finance', h:3, status:'open', prereq:'ACCT 20103', pathway:'Year 2 · Spring'},
      {course:'MKTG 34303', title:'Introduction to Marketing', h:3, status:'later', after:'Pre-Business Core'},
      {course:'SEVI 30103', title:'Strategic Management', h:3, status:'later', after:'Business Core'}
    ]},
    {group:'State Minimum Core', hours:20, items:[
      {course:'CHEM 10503', title:'Chemistry in the Modern World', h:3, status:'done'},
      {course:'CHEM 10501L', title:'Chemistry in the Modern World Lab', h:1, status:'done'},
      {course:'Science lecture + lab', title:'Second science with lab', h:4, status:'open', nosections:true},
      {course:'PSYC 20003', title:'General Psychology (Social Science)', h:3, status:'done'},
      {course:'Fine Arts', title:'Fine Arts elective', h:3, status:'open', nosections:true},
      {course:'HUMN 10103', title:'Introduction to Humanities', h:3, status:'open'},
      {course:'HIST 20003', title:'History of the American People to 1877', h:3, status:'done'}
    ]},
    {group:'General Electives', hours:6, items:[
      {course:'COMM 13103', title:'Communication in a Diverse World', h:3, status:'done'},
      {course:'BUSW 20103', title:'Business Writing', h:3, status:'open', pathway:'Year 2 · Spring'}
    ]},
    {group:'Professional Development', hours:1, items:[
      {course:'WCOB 30101', title:'Business Career Planning', h:1, status:'open'}
    ]},
    {group:'Junior/Senior Business Electives', hours:12, note:'Any 30000/40000-level business course.', items:[
      {course:'SEVI 39303', title:'Entrepreneurship and New Venture Development', h:3, status:'later', after:'Pre-Business Core'},
      {course:'BUSI 300H3', title:'Honors Business Colloquium', h:3, status:'later', after:'Pre-Business Core'},
      {course:'Business elective', title:'30000/40000-level business course', h:3, status:'later', after:'Pre-Business Core'},
      {course:'Business elective', title:'30000/40000-level business course', h:3, status:'later', after:'Pre-Business Core'}
    ]},
    {group:'Finance Major · Management & Investments', hours:24, items:[
      {course:'FINN 30103', title:'Financial Analysis', h:3, status:'later', prereq:'FINN 20403', after:'FINN 20403'},
      {course:'FINN 30603', title:'Investments', h:3, status:'later', prereq:'FINN 20403', after:'FINN 20403'},
      {course:'FINN 30503', title:'Financial Markets & Institutions', h:3, status:'later', prereq:'FINN 20403', after:'FINN 20403'},
      {course:'FINN 37003', title:'International Finance', h:3, status:'later', prereq:'FINN 20403', after:'FINN 20403'},
      {course:'FINN 31003', title:'Financial Modeling', h:3, status:'later', prereq:'FINN 20403', after:'FINN 20403'},
      {course:'FINN 41303', title:'Advanced Investments', h:3, status:'later', prereq:'FINN 30603', after:'FINN 30603'},
      {course:'FINN 3/4 elective', title:'FINN 30000/40000 or interdisciplinary elective', h:3, status:'later', after:'FINN 20403'},
      {course:'FINN 3/4 elective', title:'FINN 30000/40000 or interdisciplinary elective', h:3, status:'later', after:'FINN 20403'}
    ]},
    {group:'Information Systems Major · ERP', hours:27, items:[
      {course:'ISYS 22603', title:'Principles of Information Systems', h:3, status:'later', prereq:'ISYS 21003', after:'ISYS 21003'},
      {course:'ISYS 32103', title:'ERP Fundamentals', h:3, status:'later', after:'ISYS 22603'},
      {course:'ISYS 32903', title:'Systems Analysis and Design', h:3, status:'later', after:'ISYS 22603'},
      {course:'ISYS 33903', title:'Business Application Development Fundamentals', h:3, status:'later', after:'ISYS 22603'},
      {course:'ISYS 42803', title:'Business Database Systems', h:3, status:'later', after:'ISYS 32903'},
      {course:'ISYS 43603', title:'Business Project Development', h:3, status:'later', after:'ISYS 42803'},
      {course:'ISYS 42203', title:'ERP Configuration and Implementation', h:3, status:'later', after:'ISYS 32103'},
      {course:'ISYS 42303', title:'Seminar in ERP Development', h:3, status:'later', after:'ISYS 42203'},
      {course:'ISYS 3/4 elective', title:'30000/40000-level ISYS or business elective', h:3, status:'later', after:'ISYS 22603'}
    ]},
    {group:'SEVI Minor', hours:15, items:[
      {course:'SEVI 20202', title:'New Venture Workshop', h:2, status:'open'},
      {course:'SEVI 39303', title:'Entrepreneurship and New Venture Development', h:3, status:'later', after:'Pre-Business Core', shared:'Junior/Senior Business Electives'},
      {course:'SEVI 41303', title:'Small Enterprise Management', h:3, status:'later', after:'SEVI 39303'},
      {course:'SEVI 43303', title:'New Venture Finance', h:3, status:'later', after:'FINN 20403'},
      {course:'SEVI elective', title:'SEVI 30000/40000-level course', h:4, status:'later', after:'SEVI 39303'}
    ]}
  ],
  // course,title,section,days,start,end,credits,seats,prereq,fills,room,instructor
  sections: [
    ['FINN 20403','Principles of Finance','001','MWF','09:40','10:30',3,12,'ACCT 20103','Business Core','WCOB 203','R. Kim'],
    ['FINN 20403','Principles of Finance','002','TTh','11:00','12:15',3,3,'ACCT 20103','Business Core','WJWH 403','Julie Gall'],
    ['STAT 20203','Business Statistics','001','MW','10:45','12:00',3,5,'','Pre-Business Core','WCOB 250','A. Patel'],
    ['STAT 20203','Business Statistics','003','TTh','09:30','10:45',3,8,'','Pre-Business Core','WCOB 250','A. Patel'],
    ['ISYS 21003','Business Information Systems','001','MW','13:00','14:15',3,20,'','Business Core','RCED 120','Cristy Stamps'],
    ['ISYS 21003','Business Information Systems','002','TTh','11:00','12:15',3,0,'','Business Core','RCED 120','Cristy Stamps'],
    ['ECON 20203','Principles of Microeconomics','001','TTh','14:00','15:15',3,15,'','Pre-Business Core','KIMP 209','Robert Stapp'],
    ['ECON 20203','Principles of Microeconomics','002','MW','14:30','15:45',3,6,'','Pre-Business Core','KIMP 209','Robert Stapp'],
    ['BUSW 20103','Business Writing','001','TTh','12:30','13:45',3,10,'','General Electives','WCOB 202','Nate Nantze'],
    ['BUSW 20103','Business Writing','002','MW','16:00','17:15',3,9,'','General Electives','WCOB 202','Nate Nantze'],
    ['HUMN 10103','Introduction to Humanities','001','MW','10:00','10:50',3,25,'','State Minimum Core','KIMP 102','M. Lowe'],
    ['WCOB 30101','Business Career Planning','001','M','12:10','13:00',1,30,'','Professional Development','WCOB 241','Gina Campbell'],
    ['WCOB 30101','Business Career Planning','002','F','12:10','13:00',1,30,'','Professional Development','WCOB 241','Gina Campbell'],
    ['SEVI 20202','New Venture Workshop','001','T','17:30','19:10',2,18,'','SEVI Minor','JBHT 147','Nur Ahmed'],
    ['FINN 30603','Investments','001','MW','11:00','12:15',3,14,'FINN 20403','Finance Major','WCOB 203','Eric Dubowsky'],
    ['FINN 30103','Financial Analysis','003','TTh','12:30','13:45',3,7,'FINN 20403','Finance Major','ARKU 424','Xi Li']
  ].map(r=>({course:r[0],title:r[1],section:r[2],days:r[3],start:r[4],end:r[5],credits:r[6],seats:r[7],prereq:r[8],fills:r[9],room:r[10],instructor:r[11],id:r[0]+'-'+r[2]})),
  defaultPrefs: {
    credits: 15,
    earliest: '',
    latest: '',
    daysOff: [],
    workSync: true,
    blocks: [],
    mustTake: [],
    sentence: 'No classes before 10, Fridays off, I work Tuesday and Thursday afternoons'
  }
};
// Derived: needs list (open + later with a section this term), completed set, in-progress set
(function(D){
  const flat=[]; D.requirements.forEach(g=>g.items.forEach(it=>flat.push(Object.assign({group:g.group},it))));
  D.flatReqs=flat;
  D.student.completed=flat.filter(i=>i.status==='done').map(i=>i.course);
  D.student.inProgress=flat.filter(i=>i.status==='inprogress').map(i=>i.course);
  D.student.creditsDone=flat.filter(i=>i.status==='done').reduce((a,i)=>a+i.h,0);
  D.student.creditsInProgress=flat.filter(i=>i.status==='inprogress').reduce((a,i)=>a+i.h,0);
  D.totalHours=150; // double major total; 120 is the BSBA minimum
  D.minHours=120;
  const seen=new Set();
  D.needs=flat.filter(i=>(i.status==='open'||i.status==='later')&&!i.nosections&&D.sections.some(s=>s.course===i.course)&&!seen.has(i.course)&&seen.add(i.course))
    .map(i=>({course:i.course,title:i.title,req:i.group,prereq:i.prereq||null,later:i.status==='later',after:i.after||null,pathway:i.pathway||null,elective:!/Core|General|Professional/.test(i.group)}));
})(window.SB_DATA);
