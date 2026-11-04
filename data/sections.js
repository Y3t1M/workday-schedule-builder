/* Sample data for the demo. Course codes use UA's Workday format (five digits, the last is
   credit hours) and the Finance electives, rooms and instructors come from the real tenant's
   Spring 2027 saved schedules. Times are arranged so the demo hits every case: one clean
   schedule, a time conflict, a full section, a missing prerequisite, 1- and 2-credit classes. */
window.SB_DATA = {
  term: 'UAF Spring 2027 (01/19/2027-05/14/2027)',
  termShort: 'Spring 2027',
  termStart: '2027-01-19', termEnd: '2027-05-14',
  registrationOpens: '11/10/2026, 8:00 AM',
  terms: ['UAF Spring 2027 (01/19/2027-05/14/2027)','UAF Spring 12 Weeks 2027 (01/19/2027-04/16/2027)','UAF Spring II 2027 (03/10/2027-05/14/2027)','UAF Spring January Intersession 2027 (01/04/2027-01/15/2027)'],
  student: {
    name: 'Hudson Tinch', year: 'Sophomore', program: 'Finance (BSBA)', creditsDone: 45,
    completed: ['ACCT 20103','ACCT 20203','ECON 20103','ENGL 10103','ENGL 10203','MATH 20403','MATH 20503','COMM 13103','HIST 20003','WCOB 11101','PSYC 20003','CHEM 10503','ISYS 11203','PLSC 20003','ISYS 20303'],
    advisor: 'Taylor Brooks'
  },
  // What the degree audit says is still open, in the order it appears there.
  needs: [
    {course:'FINN 20403', title:'Principles of Finance',          req:'Finance core',            prereq:'ACCT 20103'},
    {course:'STAT 20203', title:'Business Statistics',            req:'Business core',           prereq:null},
    {course:'ISYS 21003', title:'Business Information Systems',   req:'Business core',           prereq:null},
    {course:'ECON 20203', title:'Principles of Microeconomics',   req:'Business core',           prereq:null},
    {course:'BUSW 20103', title:'Business Writing',               req:'Business core',           prereq:null},
    {course:'HUMN 10103', title:'Introduction to Humanities',     req:'Humanities elective',     prereq:null, elective:true},
    {course:'WCOB 30101', title:'Business Career Planning',       req:'Professional development',prereq:null, elective:true},
    {course:'SEVI 20202', title:'New Venture Workshop',           req:'Business elective',       prereq:null, elective:true},
    {course:'FINN 30603', title:'Investments',                    req:'Finance elective',        prereq:'FINN 20403', later:true},
    {course:'FINN 30103', title:'Financial Analysis',             req:'Finance elective',        prereq:'FINN 20403', later:true}
  ],
  // course,title,section,days,start,end,credits,seats,prereq,fills,room,instructor
  sections: [
    ['FINN 20403','Principles of Finance','001','MWF','09:40','10:30',3,12,'ACCT 20103','Finance core','WCOB 203','R. Kim'],
    ['FINN 20403','Principles of Finance','002','TTh','11:00','12:15',3,3,'ACCT 20103','Finance core','WJWH 403','Julie Gall'],
    ['STAT 20203','Business Statistics','001','MW','10:45','12:00',3,5,'','Business core','WCOB 250','A. Patel'],
    ['STAT 20203','Business Statistics','003','TTh','09:30','10:45',3,8,'','Business core','WCOB 250','A. Patel'],
    ['ISYS 21003','Business Information Systems','001','MW','13:00','14:15',3,20,'','Business core','RCED 120','Cristy Stamps'],
    ['ISYS 21003','Business Information Systems','002','TTh','11:00','12:15',3,0,'','Business core','RCED 120','Cristy Stamps'],
    ['ECON 20203','Principles of Microeconomics','001','TTh','14:00','15:15',3,15,'','Business core','KIMP 209','Robert Stapp'],
    ['ECON 20203','Principles of Microeconomics','002','MW','14:30','15:45',3,6,'','Business core','KIMP 209','Robert Stapp'],
    ['BUSW 20103','Business Writing','001','TTh','12:30','13:45',3,10,'','Business core','WCOB 202','Nate Nantze'],
    ['BUSW 20103','Business Writing','002','MW','16:00','17:15',3,9,'','Business core','WCOB 202','Nate Nantze'],
    ['HUMN 10103','Introduction to Humanities','001','MW','10:00','10:50',3,25,'','Humanities elective','KIMP 102','M. Lowe'],
    ['WCOB 30101','Business Career Planning','001','M','12:10','13:00',1,30,'','Professional development','WCOB 241','Gina Campbell'],
    ['WCOB 30101','Business Career Planning','002','F','12:10','13:00',1,30,'','Professional development','WCOB 241','Gina Campbell'],
    ['SEVI 20202','New Venture Workshop','001','T','17:30','19:10',2,18,'','Business elective','JBHT 147','Nur Ahmed'],
    ['FINN 30603','Investments','001','MW','11:00','12:15',3,14,'FINN 20403','Finance elective','WCOB 203','Eric Dubowsky'],
    ['FINN 30103','Financial Analysis','003','TTh','12:30','13:45',3,7,'FINN 20403','Finance elective','ARKU 424','Xi Li']
  ].map(r=>({course:r[0],title:r[1],section:r[2],days:r[3],start:r[4],end:r[5],credits:r[6],seats:r[7],prereq:r[8],fills:r[9],room:r[10],instructor:r[11],id:r[0]+'-'+r[2]})),
  defaultPrefs: {
    credits: 15,
    earliest: '10:00',
    latest: '',
    daysOff: ['F'],
    blocks: [{label:'Campus job', days:['T','Th'], start:'13:00', end:'17:00'}],
    mustTake: [],
    sentence: 'No classes before 10, Fridays off, I work Tuesday and Thursday afternoons'
  }
};
