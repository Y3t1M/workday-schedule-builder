/* Schedule Builder rules engine. No AI needed: it tries every section
   combination and drops anything that breaks a rule, like UAConnect did.
   Every pick traces to a data row; it can only show sections in the data. */
(function(){
  const DAY = {M:'Mon',T:'Tue',W:'Wed',Th:'Thu',F:'Fri'};
  const DAY_ORDER = ['M','T','W','Th','F'];
  const mins = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
  const fmt = t => { let [h,m]=t.split(':').map(Number); const ap=h>=12?'PM':'AM'; h=h%12||12; return h+':'+String(m).padStart(2,'0')+' '+ap; };
  const splitDays = d => d==='TTh'?['T','Th']:d.replace('Th','H').split('').map(c=>c==='H'?'Th':c);
  const dayList = d => splitDays(d).map(x=>DAY[x]).join('/');

  function overlap(a,b){
    const da=splitDays(a.days), db=splitDays(b.days);
    if(!da.some(d=>db.includes(d))) return 0;
    return Math.max(0, Math.min(mins(a.end),mins(b.end)) - Math.max(mins(a.start),mins(b.start)));
  }

  // Problems with one section against the student's record and preferences.
  // Each problem is plain words plus the fix.
  function problems(sec, prefs, student, data){
    const out=[];
    const days=splitDays(sec.days);
    if(sec.prereq && !student.completed.includes(sec.prereq)){
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
      out.push({code:'dayoff', text:`Meets ${offHit.map(d=>DAY[d]).join(' and ')}, which you marked off.`, fix:'Pick a section on other days.'});
    }
    (prefs.blocks||[]).forEach(b=>{
      const hit=days.some(d=>b.days.includes(d)) && Math.min(mins(sec.end),mins(b.end))>Math.max(mins(sec.start),mins(b.start));
      if(hit) out.push({code:'block', text:`Overlaps ${b.label.toLowerCase()} (${b.days.map(d=>DAY[d]).join('/')} ${fmt(b.start)}–${fmt(b.end)}).`, fix:'Pick a section outside that time.'});
    });
    return out;
  }

  // Short "why it's here" line for a section in a schedule.
  function why(sec, student, mode){
    const pre = sec.prereq ? (student.completed.includes(sec.prereq) ? `${sec.prereq} done.` : `needs ${sec.prereq}.`) : 'No prerequisite.';
    if(mode==='ai'){
      const seat = sec.seats<=3 ? ` Only ${sec.seats} seat${sec.seats===1?'':'s'} left, so register early.` : '';
      return `This fills your ${sec.fills} requirement and you've already completed ${sec.prereq||'everything it needs'}.${seat}`.replace("completed everything it needs","met every prerequisite");
    }
    return `Fills ${sec.fills}. ${pre}`;
  }

  // All conflict-free schedules that fit, ranked. Returns {options, catches}.
  function generate(prefs, data){
    const student=data.student;
    const target = prefs.credits||15;
    const needs = data.needs.filter(n=>!n.later);
    const must = new Set(prefs.mustTake||[]);
    const catches=[]; // sections we dropped, with the reason (shown to the student)
    const perCourse = {};
    needs.forEach(n=>{
      const secs=data.sections.filter(s=>s.course===n.course);
      perCourse[n.course]=[];
      secs.forEach(s=>{
        const p=problems(s,prefs,student,data);
        if(p.length) catches.push({sec:s, problems:p}); else perCourse[n.course].push(s);
      });
    });
    // later courses (prereq missing) are catches too
    data.needs.filter(n=>n.later).forEach(n=>data.sections.filter(s=>s.course===n.course).forEach(s=>{
      const p=problems(s,prefs,student,data); if(p.length) catches.push({sec:s, problems:p});
    }));

    const courses = needs.map(n=>n.course).filter(c=>perCourse[c].length);
    const creditOf = c => perCourse[c][0].credits;
    const results=[];
    // every subset of courses whose credits land on the target (or within 2 below it),
    // then every section combination inside that subset
    const n=courses.length;
    for(let mask=1; mask<(1<<n); mask++){
      const subset=[]; let cr=0;
      for(let i=0;i<n;i++) if(mask&(1<<i)){ subset.push(courses[i]); cr+=creditOf(courses[i]); }
      if(cr>target || cr<target-2) continue;
      if([...must].some(m=>!subset.includes(m))) continue;
      const lists=subset.map(c=>perCourse[c]);
      const pick=[];
      (function rec(i){
        if(i===lists.length){ results.push(pick.slice()); return; }
        for(const s of lists[i]){
          if(pick.some(q=>overlap(q,s)>0)) continue;
          pick.push(s); rec(i+1); pick.pop();
        }
      })(0);
      if(results.length>400) break;
    }

    // Nothing lands on the target: fall back to the fullest schedules that do fit,
    // and say what would open the gap.
    let relaxed=false;
    if(!results.length){
      relaxed=true;
      for(let mask=1; mask<(1<<n); mask++){
        const subset=[]; let cr=0;
        for(let i=0;i<n;i++) if(mask&(1<<i)){ subset.push(courses[i]); cr+=creditOf(courses[i]); }
        if(cr>target) continue;
        if([...must].some(m=>!subset.includes(m))) continue;
        const lists=subset.map(c=>perCourse[c]); const pick=[];
        (function rec(i){ if(i===lists.length){ results.push(pick.slice()); return; } for(const s of lists[i]){ if(pick.some(q=>overlap(q,s)>0)) continue; pick.push(s); rec(i+1); pick.pop(); } })(0);
        if(results.length>600) break;
      }
    }
    const hints=(()=>{
      const by={};
      catches.forEach(c=>{ if(c.problems.length!==1) return; const code=c.problems[0].code; if(!['late','early','dayoff','block'].includes(code)) return; (by[code]=by[code]||[]).push(c.sec.course+'-'+c.sec.section); });
      const out=[];
      if(by.late) out.push(`Allowing classes after ${fmt(prefs.latest)} would open ${[...new Set(by.late)].join(', ')}.`);
      if(by.early) out.push(`Starting before ${fmt(prefs.earliest)} would open ${[...new Set(by.early)].join(', ')}.`);
      if(by.dayoff) out.push(`Taking ${(prefs.daysOff||[]).map(d=>DAY[d]).join('/')} would open ${[...new Set(by.dayoff)].join(', ')}.`);
      if(by.block) out.push(`Freeing blocked time would open ${[...new Set(by.block)].join(', ')}.`);
      return out;
    })();
    const core = s => /core/i.test(s.fills);
    const scored = results.map(secs=>{
      const credits=secs.reduce((a,s)=>a+s.credits,0);
      let score=0;
      score += secs.filter(core).length*10;          // core first
      score += secs.filter(s=>!core(s)).length*2;    // electives fill gaps
      score -= secs.length;                           // fewer classes for the same credits
      score += secs.reduce((a,s)=>a+Math.min(s.seats,10),0)/10; // safer seats
      score += credits===target?12:(credits===target-1?4:0);
      if(relaxed) score += credits*10;
      // a course that unlocks another open requirement is worth taking now
      secs.forEach(s=>{ if(data.needs.some(n=>n.prereq===s.course)) score+=3; });
      // fewer days on campus and shorter gaps read as "better"
      const days=new Set(secs.flatMap(s=>splitDays(s.days)));
      score -= days.size*0.5;
      return {secs:secs.sort((a,b)=>a.course.localeCompare(b.course)), credits, score};
    }).sort((a,b)=>b.score-a.score);

    // dedupe by course set + section ids
    const seen=new Set(); const uniq=[];
    for(const r of scored){ const key=r.secs.map(s=>s.id).join('|'); if(seen.has(key)) continue; seen.add(key); uniq.push(r); }
    const options = uniq.slice(0,3).map((r,i)=>{
      const names = r.secs.map(s=>s.course);
      const missing = needs.filter(n=>!names.includes(n.course)).map(n=>n.course);
      let label = i===0 ? (relaxed?'Closest fit':'Recommended') : (r.credits<target&&!relaxed ? 'Lighter load' : (i===1?'Alternative':'Alternative '+i));
      let note = '';
      if(relaxed) note = `${r.credits} of ${target} credit hours. ${i===0&&hints.length?hints[0]:''}`.trim();
      else if(i===0) note = `${r.credits} credit hours, all requirements that fit this term.`;
      else if(r.credits<target) note = `${r.credits} credits. Leaves ${missing.join(', ')} for next term.`;
      else note = missing.length ? `Swaps in ${names.filter(c=>!uniq[0].secs.some(s=>s.course===c)).join(', ')}; pushes ${missing.join(', ')} to next term.` : `${r.credits} credits.`;
      return {id:'opt'+(i+1), label, note, credits:r.credits, sections:r.secs, missing};
    });
    return {options, catches, relaxed, hints, target};
  }

  // Check a whole schedule: conflicts between picks + per-section problems.
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

  // Parse the plain-English preference sentence (the optional AI layer; here a
  // small rule parser so the demo stands without a model).
  function parseSentence(text, base){
    const p=JSON.parse(JSON.stringify(base));
    const t=text.toLowerCase();
    const m=t.match(/before\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if(m){ let h=+m[1]; if(m[3]==='pm'&&h<12)h+=12; p.earliest=String(h).padStart(2,'0')+':'+(m[2]||'00'); }
    const offs=[]; [['monday','M'],['tuesday','T'],['wednesday','W'],['thursday','Th'],['friday','F']].forEach(([n,k])=>{ if(new RegExp(n+'s?\\s+off').test(t)) offs.push(k); });
    if(offs.length) p.daysOff=offs;
    const w=t.match(/work[^.]*?(monday|tuesday|wednesday|thursday|friday)(?:\s*(?:and|,|&)\s*(monday|tuesday|wednesday|thursday|friday))?[^.]*?(morning|afternoon|evening|\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:to|-|–)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/);
    if(w){
      const map={monday:'M',tuesday:'T',wednesday:'W',thursday:'Th',friday:'F'};
      const days=[w[1],w[2]].filter(Boolean).map(x=>map[x]);
      let start='13:00',end='17:00';
      if(w[3]==='morning'){start='08:00';end='12:00';} else if(w[3]==='evening'){start='17:00';end='21:00';}
      else if(/\d/.test(w[3])){ const r=w[3].match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|–)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/); if(r){ let h1=+r[1],h2=+r[4]; const ap2=r[6]||r[3]; if(ap2==='pm'){ if(h2<12)h2+=12; if(h1<12&&h1<=h2-12+12&&h1<8)h1+=12; } if(h1<8)h1+=12; start=String(h1).padStart(2,'0')+':'+(r[2]||'00'); end=String(h2).padStart(2,'0')+':'+(r[5]||'00'); } }
      p.blocks=[{label:'Work', days, start, end}];
    }
    const c=t.match(/(\d{1,2})\s*(?:credit|credits|hours|hrs)/); if(c) p.credits=+c[1];
    const a=t.match(/(?:after|done by|nothing past)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/); if(a){ let h=+a[1]; if((a[3]==='pm'||!a[3])&&h<12&&h<=8)h+=12; else if(a[3]==='pm'&&h<12)h+=12; p.latest=String(h).padStart(2,'0')+':'+(a[2]||'00'); }
    return p;
  }

  window.SB = {mins, fmt, splitDays, dayList, overlap, problems, why, generate, check, parseSentence, DAY, DAY_ORDER};
})();
