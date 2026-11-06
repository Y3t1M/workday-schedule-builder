/* Schedule Builder rules engine. No AI needed: it tries every section combination and drops
   anything that breaks a rule, like UAConnect did. Every pick traces to a data row. */
(function(){
  const DAY = {M:'Mon',T:'Tue',W:'Wed',Th:'Thu',F:'Fri',Sa:'Sat'};
  const DAY_ORDER = ['M','T','W','Th','F','Sa'];
  const mins = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
  const fmt = t => { let [h,m]=t.split(':').map(Number); const ap=h>=12?'PM':'AM'; h=h%12||12; return h+':'+String(m).padStart(2,'0')+' '+ap; };
  const splitDays = d => d==='TTh'?['T','Th']:d==='Sa'?['Sa']:d.replace('Th','H').replace('Sa','S').split('').map(c=>c==='H'?'Th':c==='S'?'Sa':c);
  const dayList = d => splitDays(d).map(x=>DAY[x]).join('/');

  function overlap(a,b){
    const da=splitDays(a.days), db=splitDays(b.days);
    if(!da.some(d=>db.includes(d))) return 0;
    return Math.max(0, Math.min(mins(a.end),mins(b.end)) - Math.max(mins(a.start),mins(b.start)));
  }
  // Blocks in force = the student's own blocks + the Workday work schedule when sync is on
  function allBlocks(prefs, data){
    const b=[...(prefs.blocks||[])];
    if(prefs.workSync!==false && data.student.work) b.unshift(Object.assign({fromWorkday:true}, data.student.work));
    return b;
  }
  const done = (student, course) => student.completed.includes(course) || (student.inProgress||[]).includes(course);

  // Problems with one section against the record and preferences: plain words plus the fix.
  function problems(sec, prefs, student, data){
    const out=[];
    const days=splitDays(sec.days);
    if(sec.prereq && !done(student,sec.prereq)){
      const alt=data.sections.find(s=>s.course===sec.prereq);
      out.push({code:'prereq', text:`Needs ${sec.prereq} first.`, fix: alt?`Take ${sec.prereq} this ${data.termShort.split(' ')[0].toLowerCase()} instead.`:`Take ${sec.prereq} first.`});
    }
    if(sec.seats===0){
      const other=data.sections.find(s=>s.course===sec.course && s.id!==sec.id && s.seats>0);
      out.push({code:'full', text:`Section ${sec.section} is full.`, fix: other?`Join the waitlist, or take section ${other.section} (${dayList(other.days)} ${fmt(other.start)}).`:'Join the waitlist.'});
    }
    if(prefs.earliest && mins(sec.start) < mins(prefs.earliest)){
      out.push({code:'early', text:`Starts at ${fmt(sec.start)}, before your ${fmt(prefs.earliest)} earliest.`, fix:'Pick a later section or move your earliest time.'});
    }
    if(prefs.latest && mins(sec.end) > mins(prefs.latest)){
      out.push({code:'late', text:`Ends at ${fmt(sec.end)}, after your ${fmt(prefs.latest)} latest.`, fix:'Pick an earlier section or move your latest time.'});
    }
    const offHit = days.filter(d=>(prefs.daysOff||[]).includes(d));
    if(offHit.length){
      out.push({code:'dayoff', text:`Meets ${offHit.map(d=>DAY[d]).join(' and ')}, which you marked unavailable.`, fix:'Pick a section on other days.'});
    }
    allBlocks(prefs,data).forEach(b=>{
      const hit=days.some(d=>b.days.includes(d)) && Math.min(mins(sec.end),mins(b.end))>Math.max(mins(sec.start),mins(b.start));
      if(hit) out.push({code:'block', text:`Overlaps ${b.label.toLowerCase()} (${b.days.map(d=>DAY[d]).join('/')} ${fmt(b.start)}–${fmt(b.end)}).`, fix: b.fromWorkday?'Pick a section outside your work hours, or turn off the work-hours block.':'Pick a section outside that time.'});
    });
    return out;
  }

  function why(sec, student, mode){
    const pre = sec.prereq ? (done(student,sec.prereq) ? `${sec.prereq} ${(student.inProgress||[]).includes(sec.prereq)?'in progress':'done'}.` : `needs ${sec.prereq}.`) : 'No prerequisite.';
    if(mode==='ai'){
      const seat = sec.seats<=3 ? ` Only ${sec.seats} seat${sec.seats===1?'':'s'} left, so register early.` : '';
      return sec.prereq ? `Fills your ${sec.fills} requirement, and you've already got ${sec.prereq} ${(student.inProgress||[]).includes(sec.prereq)?'in progress':'done'}.${seat}` : `Fills your ${sec.fills} requirement and has no prerequisite.${seat}`;
    }
    return `Fills ${sec.fills}. ${pre}`;
  }

  // Small deterministic hash so two students with the same record get different tie-breaks.
  function hash(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0)/4294967295; }

  // All conflict-free schedules that fit, ranked. Returns {options, catches, relaxed, hints, target}.
  function generate(prefs, data, studentKey){
    const student=data.student;
    const target = prefs.credits||15;
    const needs = data.needs.filter(n=>!n.later);
    const must = new Set(prefs.mustTake||[]);
    const key = studentKey || (data.student.id||data.student.name);
    const catches=[];
    const perCourse = {};
    needs.forEach(n=>{
      perCourse[n.course]=[];
      data.sections.filter(s=>s.course===n.course).forEach(s=>{
        const p=problems(s,prefs,student,data);
        if(p.length) catches.push({sec:s, problems:p}); else perCourse[n.course].push(s);
      });
    });
    data.needs.filter(n=>n.later).forEach(n=>data.sections.filter(s=>s.course===n.course).forEach(s=>{
      const p=problems(s,prefs,student,data); if(p.length) catches.push({sec:s, problems:p});
    }));

    const courses = needs.map(n=>n.course).filter(c=>perCourse[c].length);
    const creditOf = c => perCourse[c][0].credits;
    const n=courses.length;
    const results=[];
    function enumerate(minCr,maxCr,cap){
      for(let mask=1; mask<(1<<n); mask++){
        const subset=[]; let cr=0;
        for(let i=0;i<n;i++) if(mask&(1<<i)){ subset.push(courses[i]); cr+=creditOf(courses[i]); }
        if(cr>maxCr || cr<minCr) continue;
        if([...must].some(m=>!subset.includes(m))) continue;
        const lists=subset.map(c=>perCourse[c]); const pick=[];
        (function rec(i){ if(i===lists.length){ results.push(pick.slice()); return; } for(const s of lists[i]){ if(pick.some(q=>overlap(q,s)>0)) continue; pick.push(s); rec(i+1); pick.pop(); } })(0);
        if(results.length>cap) break;
      }
    }
    enumerate(target-2, target, 400);
    let relaxed=false;
    if(!results.length){ relaxed=true; enumerate(0, target, 600); }

    const hints=(()=>{
      const by={};
      catches.forEach(c=>{ if(c.problems.length!==1) return; const code=c.problems[0].code; if(!['late','early','dayoff','block'].includes(code)) return; (by[code]=by[code]||[]).push(c.sec.course+'-'+c.sec.section); });
      const out=[];
      if(by.late) out.push(`Allowing classes after ${fmt(prefs.latest)} would open ${[...new Set(by.late)].join(', ')}.`);
      if(by.early) out.push(`Starting before ${fmt(prefs.earliest)} would open ${[...new Set(by.early)].join(', ')}.`);
      if(by.dayoff) out.push(`Making ${(prefs.daysOff||[]).map(d=>DAY[d]).join('/')} available would open ${[...new Set(by.dayoff)].join(', ')}.`);
      if(by.block) out.push(`Freeing blocked time would open ${[...new Set(by.block)].join(', ')}.`);
      return out;
    })();

    const core = s => /Core|General|Professional/.test(s.fills);
    const onPath = c => !!(data.needs.find(x=>x.course===c)||{}).pathway;
    const scored = results.map(secs=>{
      const credits=secs.reduce((a,s)=>a+s.credits,0);
      let score=0;
      score += secs.filter(core).length*10;                 // core first
      score += secs.filter(s=>onPath(s.course)).length*3;    // courses the UA pathway puts in this semester
      score += secs.filter(s=>!core(s)).length*2;            // electives fill gaps
      score -= secs.length*2;                                // fewer classes for the same credits
      score += credits===target?12:(credits===target-1?4:0);
      if(relaxed) score += credits*10;
      secs.forEach(s=>{ if(data.needs.some(x=>x.prereq===s.course)) score+=3; }); // unlocks something
      // Spread across open sections: fuller sections score lower, and the tie-break is per student,
      // so two students with the same record don't both get pushed into the same 3-seat section.
      score += secs.reduce((a,s)=>a+Math.min(s.seats,12)/12,0)/secs.length*2;
      score += secs.reduce((a,s)=>a+hash(key+'|'+s.id),0)/secs.length*1.2;
      const days=new Set(secs.flatMap(s=>splitDays(s.days)));
      score -= days.size*0.5;
      return {secs:secs.sort((a,b)=>a.course.localeCompare(b.course)), credits, score};
    }).sort((a,b)=>b.score-a.score);

    // First pass: distinct course SETS. Second pass: same courses, different sections.
    const byCourses=new Set(), bySections=new Set(), uniq=[];
    for(const r of scored){ const k=r.secs.map(s=>s.course).join('|'); const k2=r.secs.map(s=>s.id).join('|'); if(byCourses.has(k)||bySections.has(k2)) continue; byCourses.add(k); bySections.add(k2); uniq.push(r); if(uniq.length===3) break; }
    if(uniq.length<3) for(const r of scored){ const k2=r.secs.map(s=>s.id).join('|'); if(bySections.has(k2)) continue; bySections.add(k2); uniq.push(r); if(uniq.length===3) break; }

    const options = uniq.map((r,i)=>{
      const names = r.secs.map(s=>s.course);
      const base = uniq[0];
      let label = i===0 ? (relaxed?'Closest fit':'Recommended') : (r.credits<target&&!relaxed ? 'Lighter load' : (i===1?'Alternative':'Alternative '+i));
      let note='';
      if(relaxed) note = `${r.credits} of ${target} credit hours. ${i===0&&hints.length?hints[0]:''}`.trim();
      else if(i===0) note = `${r.credits} credit hours. Every core class the pathway puts in this semester that fits your times.`;
      else {
        const added = r.secs.filter(s=>!base.secs.some(b=>b.course===s.course)).map(s=>s.course);
        const removed = base.secs.filter(b=>!r.secs.some(s=>s.course===b.course)).map(b=>b.course);
        const moved = r.secs.filter(s=>base.secs.some(b=>b.course===s.course&&b.id!==s.id)).map(s=>`${s.course} to section ${s.section} (${dayList(s.days)} ${fmt(s.start)})`);
        const parts=[];
        if(added.length) parts.push(`adds ${added.join(', ')}`);
        if(removed.length) parts.push(`leaves ${removed.join(', ')} for next term`);
        if(moved.length) parts.push(`moves ${moved.join('; ')}`);
        note = parts.length ? `Same as Recommended but ${parts.join('; ')}.` : `${r.credits} credit hours.`;
      }
      return {id:'opt'+(i+1), label, note, credits:r.credits, sections:r.secs};
    });
    return {options, catches, relaxed, hints, target};
  }

  function check(secs, prefs, data){
    const issues=[];
    for(let i=0;i<secs.length;i++){
      for(let j=i+1;j<secs.length;j++){
        const o=overlap(secs[i],secs[j]);
        if(o) issues.push({code:'conflict', a:secs[i], b:secs[j], text:`${secs[i].course} and ${secs[j].course} overlap by ${o} minute${o===1?'':'s'} on ${splitDays(secs[i].days).filter(d=>splitDays(secs[j].days).includes(d)).map(d=>DAY[d]).join('/')}.`});
      }
      problems(secs[i],prefs,data.student,data).forEach(p=>issues.push(Object.assign({sec:secs[i]},p)));
    }
    return issues;
  }

  // ---------- plain-English preferences (forgiving of spelling) ----------
  const WORDNUM={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,noon:12,midday:12};
  const DAYWORDS=[['M',['monday','mon','mondays']],['T',['tuesday','tue','tues','tuesdays']],['W',['wednesday','wed','weds','wednesdays']],['Th',['thursday','thu','thur','thurs','thursdays']],['F',['friday','fri','fridays']],['Sa',['saturday','sat','saturdays']]];
  function lev(a,b){ const m=a.length,n=b.length; if(!m||!n) return m||n; let prev=[...Array(n+1).keys()]; for(let i=1;i<=m;i++){ const cur=[i]; for(let j=1;j<=n;j++){ cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1)); } prev=cur; } return prev[n]; }
  function dayOf(tok){ tok=tok.toLowerCase().replace(/[^a-z]/g,''); if(!tok) return null; for(const [k,ws] of DAYWORDS){ for(const w of ws){ if(tok===w) return k; } } if(tok.length>=4) for(const [k,ws] of DAYWORDS){ for(const w of ws){ if(w.length>=5 && lev(tok,w)<=2) return k; } } return null; }
  function hourOf(tok,ap,bias){ // bias: 'am'|'pm'|null for unmarked numbers
    let h=null,m=0; const t=tok.toLowerCase();
    if(WORDNUM[t]!=null) h=WORDNUM[t]; else { const mm=t.match(/^(\d{1,2})(?::(\d{2}))?$/); if(!mm) return null; h=+mm[1]; m=+(mm[2]||0); }
    if(h>23) return null;
    if(ap==='pm' && h<12) h+=12; else if(ap==='am' && h===12) h=0;
    else if(!ap){ if(bias==='pm' && h<12 && h<=8) h+=12; else if(!bias && h<=7) h+=12; } // "done by 4" means 4 PM
    return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
  }
  const TIMEPAT = '((\\d{1,2}(?::\\d{2})?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|noon)\\s*(am|pm|a\\.m\\.|p\\.m\\.)?(?![a-z]))';
  function parseSentence(text, base){
    const p=JSON.parse(JSON.stringify(base));
    const found={};
    let t=' '+text.toLowerCase().replace(/[’']/g,'').replace(/\s+/g,' ')+' ';
    t=t.replace(/\b(o)clock\b/g,'').replace(/\bthru\b/g,'to').replace(/\b(til|till|until)\b/g,'to');
    const ap=x=>!x?null:/^p/.test(x)?'pm':'am';
    // earliest: "before 10", "nothing before ten am", "no 8ams", "start after 9", "not earlier than 10", "no morning classes", "no early classes"
    let m=t.match(new RegExp('\\b(?:before|befor|bfore|b4|earlier than|start(?:ing)? after|starting at|no earlier than|not before|nothing before|nothing befor)\\s*'+TIMEPAT));
    if(m){ const h=hourOf(m[2],ap(m[3]),'am'); if(h){ p.earliest=h; found.earliest=h; } }
    m=t.match(/\bno\s*(\d{1,2})\s*am'?s?\b/); if(m){ const h=String(+m[1]+1).padStart(2,'0')+':00'; p.earliest=h; found.earliest=h; }
    if(/\b(no|without|skip)\s+(early|morning|8\s*am)\b/.test(t) && !found.earliest){ p.earliest='10:00'; found.earliest='10:00'; }
    // latest: "done by 4", "nothing after 5pm", "out by 3", "no classes after four", "no night classes", "no evening"
    m=t.match(new RegExp('\\b(?:done by|out by|finish(?:ed)? by|home by|nothing after|no(?:thing)? (?:classes? )?(?:after|past|later than)|end(?:ing)? by)\\s*'+TIMEPAT+'(?=[^\\d]|$)'));
    if(m){ const h=hourOf(m[2],ap(m[3]),'pm'); if(h&&(!found.earliest||mins(h)>mins(found.earliest))){ p.latest=h; found.latest=h; } }
    if(/\b(no|without)\s+(night|evening|late)\s*(classes?)?\b/.test(t) && !found.latest){ p.latest='17:00'; found.latest='17:00'; }
    // days off: "fridays off", "no class on friday", "no fridays", "off on mon and wed", "free fridays", "weekends off", "only mwf", "mwf only", "tth only"
    const off=new Set();
    const addDays=(seg)=>{ seg.split(/[\s,&+\/]+|and/).forEach(w=>{ const d=dayOf(w); if(d) off.add(d); }); };
    let r=/\b(?:no (?:classes?|school) (?:on )?|off (?:on )?|free (?:on )?|skip |not (?:on )?|avoid |without )((?:(?:mon|tue|wed|thu|fri|sat)[a-z]*s?(?:day)?s?(?:\s*(?:,|and|&|or|\/)?\s*)?)+)/g; let x;
    while((x=r.exec(t))) addDays(x[1]);
    r=/\b((?:(?:mon|tue|wed|thu|fri|sat)[a-z]*s?(?:\s*(?:,|and|&|or|\/)?\s*)?)+)\s*(?:off|free)\b/g;
    while((x=r.exec(t))) addDays(x[1]);
    if(/\bweekends? (?:off|free)\b|\bno weekends?\b/.test(t)) off.add('Sa');
    if(/\b(?:no|skip|without) fridays?\b|\bfridays? (?:off|free)\b|\bthree[- ]day weekend/.test(t)) off.add('F');
    const only=t.match(/\b(?:only|just)\s+((?:m|t|w|th|f|mw|mwf|tth|tr|mtwthf)+)\b|\b((?:mwf|tth|mw|tr))\s+only\b/);
    if(only){ const code=(only[1]||only[2]).toUpperCase(); const avail=new Set(); if(/MWF|MW/.test(code)){avail.add('M');avail.add('W');} if(/MWF/.test(code))avail.add('F'); if(/TTH|TR/.test(code)){avail.add('T');avail.add('Th');} if(avail.size) DAY_ORDER.forEach(d=>{ if(!avail.has(d)) off.add(d); }); }
    // forgiving pass: a day word within three tokens after no/not/off/free/skip/avoid/without/except, or right before off/free
    const toks=t.trim().split(/[\s,]+/); const NEG=/^(no|not|off|free|skip|avoid|without|except|never|cant|cannot|dont)$/;
    toks.forEach((tok,i)=>{ const d=dayOf(tok); if(!d) return; const prev=toks.slice(Math.max(0,i-3),i), next=toks[i+1]||''; if(prev.some(w=>NEG.test(w))||/^(off|free)$/.test(next)) off.add(d); });
    // but never mark a day off when it was named as a WORK day in the same sentence
    if(off.size){ p.daysOff=[...off]; found.daysOff=[...off]; }
    // work: "I work tuesday and thursday afternoons", "work mon wed 2-5", "job tth 1 to 5 pm", "working tuesdays 9-1"
    const w=t.match(/\b(?:work(?:ing)?|job|shift|practice|intern(?:ship)?)\b[^.;]*/);
    if(w){
      const seg=w[0]; const days=[]; seg.split(/[\s,&+\/]+/).forEach(tok=>{ const d=dayOf(tok); if(d&&!days.includes(d)) days.push(d); });
      let start='13:00',end='17:00',label=/job|work/.test(seg)?'Work':/practice/.test(seg)?'Practice':'Internship';
      const range=seg.match(new RegExp(TIMEPAT+'\\s*(?:to|-|–|until)\\s*'+TIMEPAT));
      if(range){ const e=hourOf(range[5],ap(range[6]),'pm'); const s=hourOf(range[2],ap(range[3])||(e&&mins(e)<=12*60?'am':null), e&&mins(e)>12*60?'pm':'am'); if(s&&e&&mins(e)>mins(s)){start=s;end=e;} }
      else if(/morning/.test(seg)){start='08:00';end='12:00';} else if(/evening|night/.test(seg)){start='17:00';end='21:00';} else if(/all day/.test(seg)){start='08:00';end='18:00';}
      if(days.length){ p.blocks=(p.blocks||[]).filter(b=>!b.parsed); p.blocks.push({label, days, start, end, parsed:true}); found.block={label,days,start,end}; p.daysOff=(p.daysOff||[]).filter(d=>!days.includes(d)); if(found.daysOff) found.daysOff=found.daysOff.filter(d=>!days.includes(d)); }
    }
    // credits: "15 hours", "fifteen credits", "16 credit hours", "full time", "part time", "light load"
    m=t.match(/\b(\d{1,2}|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen)\s*(?:credit|credits|hours|hrs|cr)\b/);
    if(m){ const c=WORDNUM[m[1]]??+m[1]; if(c>=1&&c<=21){ p.credits=c; found.credits=c; } }
    else if(/\bfull[- ]time\b/.test(t)){ p.credits=Math.max(p.credits,12); } else if(/\b(light|easy) (load|semester)\b|\bpart[- ]time\b/.test(t)){ p.credits=12; found.credits=12; }
    // must take: "need finn 20403", "has to include stat", "must take isys 21003"
    r=/\b(?:must take|need to take|have to take|has to include|include|needs?|want)\s+([a-z]{4}\s*\d{5}|[a-z]{4}\s*\d{4})/g;
    while((x=r.exec(t))){ const code=x[1].toUpperCase().replace(/\s+/,' '); const digits=code.replace(/\D/g,''); const c5=digits.length===5?code:code.replace(/(\d{3})(\d)$/,'$10$2'); if(!(p.mustTake||[]).includes(c5)){ p.mustTake=[...(p.mustTake||[]),c5]; (found.mustTake=found.mustTake||[]).push(c5); } }
    p.sentence=text; p.parsed=found;
    return p;
  }

  window.SB = {mins, fmt, splitDays, dayList, overlap, problems, why, generate, check, parseSentence, allBlocks, done, DAY, DAY_ORDER};
})();
