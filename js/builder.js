/* Schedule Builder UI. Screens are hash-routed:
   #start #prefs #needs #options #swap #review #errors (#done after registering) */
(function(){
  const D=SB_DATA, S=SB;
  const STEPS=[['start','Start'],['prefs','Availability'],['needs','Degree Requirements'],['options','Schedules'],['review','Review']];
  const COLORS={}; D.needs.forEach((n,i)=>COLORS[n.course]='c'+((i%6)+1));
  const STUDENT_KEY=(window.DEMO_STUDENT&&DEMO_STUDENT.id)||D.student.name;

  // surface anything that breaks instead of failing silently
  window.addEventListener('error',e=>{ try{ toast('Something went wrong: '+(e.message||'unknown error')+'. Reload the page.'); }catch(x){} });
  window.addEventListener('unhandledrejection',e=>{ try{ toast('Something went wrong: '+(e.reason&&e.reason.message||'unknown error')); }catch(x){} });

  // ---------- state ----------
  const qs=new URLSearchParams(location.search);
  if(window.SB_FORCE){ qs.set('demo','1'); if(SB_FORCE.ai) qs.set('ai','on'); if(SB_FORCE.swap) qs.set('swap',SB_FORCE.swap); }
  let state=load();
  function load(){
    try{ const s=JSON.parse(sessionStorage.getItem('sb-state')||'null'); if(s&&s.v===5) return s; }catch(e){}
    let ai=false; try{ ai=localStorage.getItem('sb-ai')==='on'; }catch(e){}
    return {v:5, prefs:JSON.parse(JSON.stringify(D.defaultPrefs)), chosen:null, schedule:null, ai, swapping:null, term:D.terms[0], maxStep:0, otherOpen:false};
  }
  function save(){ try{ sessionStorage.setItem('sb-state',JSON.stringify(state)); }catch(e){} }
  if(qs.get('demo')){
    state.ai = qs.get('ai')==='on'; state.maxStep=4;
    if(qs.get('fri')!=='on') state.prefs.daysOff=['F'];
    const g=S.generate(state.prefs,D,STUDENT_KEY); if(g.options[0]){ state.chosen=0; state.schedule=g.options[0].sections.map(s=>s.id); }
    if(qs.get('swap')) state.swapping=qs.get('swap');
  }
  const secById=id=>D.sections.find(s=>s.id===id);
  const schedule=()=> (state.schedule||[]).map(secById).filter(Boolean);
  const gen=()=>S.generate(state.prefs,D,STUDENT_KEY);
  const resetPicks=()=>{ state.chosen=null; state.schedule=null; };
  const reqOf=course=>D.flatReqs.find(r=>r.course===course);

  // ---------- helpers ----------
  function route(){ return location.hash.replace('#','')||(window.SB_FORCE&&SB_FORCE.step)||'start'; }
  function go(h){ location.hash=h; }
  const stepIndex=r=>{ const i=STEPS.findIndex(s=>s[0]===r); return i>=0?i:({swap:3,errors:3,done:4}[r]??0); };
  function stepsBar(cur){
    const at=cur==='done'?STEPS.length:stepIndex(cur); const max=Math.max(state.maxStep||0,at);
    return `<ol class="sb-steps2" aria-label="Progress, step ${at+1} of ${STEPS.length}"><span class="track"></span><span class="fill" style="width:${Math.min(1,at/(STEPS.length-1))*100}%"></span>${STEPS.map((s,i)=>{
      const k=i<at?'done':i===at?'now':'todo'; const can=cur!=='done'&&i<=max&&i!==at;
      const mark=i<at?icon('check-small'):(i===at?'<span class="sel"></span>':'');
      const inner=`<span class="dot">${mark}</span><span class="lbl">${s[1]}</span>`;
      return `<li class="${k}">${can?`<button data-go="${s[0]}">${inner}</button>`:`<span class="st" ${i===at?'aria-current="step"':''}>${inner}</span>`}</li>`;
    }).join('')}</ol>`;
  }
  // page title above the steps, then the steps, then the content
  function pageHead(title, sub, cur){
    return `${stepsBar(cur)}<div class="sb-pagehead-in" data-title="${title.replace(/"/g,'&quot;')}" data-sub="${(sub||'').replace(/"/g,'&quot;')}"></div>`;
  }
  // after render: move each page title into the top of its first card (sketch: steps first, title inside the card)
  function placeTitles(){ const h=document.querySelector('.sb-pagehead-in'); if(!h) return; const card=document.querySelector('.sb-card, .sb-wide .wd-kvrow'); const html=`<h2 class="sb-cardtitle">${h.dataset.title}</h2>${h.dataset.sub?`<p class="sub">${h.dataset.sub}</p>`:''}`; if(card&&card.classList.contains('sb-card')) card.insertAdjacentHTML('afterbegin',html); else if(card) card.insertAdjacentHTML('beforebegin',`<div class="sb-card" style="padding:16px 20px;margin-bottom:16px">${html}</div>`); h.remove(); }
  function foot(back,next,nextLabel,hint,extra){
    return `<div class="sb-foot">${back?`<button class="wd-btn secondary" data-go="${back}">Back</button>`:''}${hint?`<span class="hint">${hint}</span>`:''}<div class="right">${extra||''}${next?`<button class="wd-btn primary" data-go="${next}" id="nextBtn">${nextLabel||'Next'}</button>`:''}</div></div>`;
  }
  function week(secs, opts){
    opts=opts||{};
    const start=8, hours=12, mini=opts.mini;
    const off=state.prefs.daysOff||[];
    const blocks=S.allBlocks(state.prefs,D);
    const times=Array.from({length:hours},(_,i)=>{const h=start+i;return `<span>${h%12||12}${mini?'':(h<12?' AM':' PM')}</span>`}).join('');
    const cols=S.DAY_ORDER.map(d=>{
      let evs='';
      blocks.forEach(b=>{ if(b.days.includes(d)) evs+=ev({start:b.start,end:b.end},'block'+(b.fromWorkday?' work':''),`<b>${b.label}</b>`); });
      (secs||[]).forEach(s=>{ if(S.splitDays(s.days).includes(d)){ const cls=(opts.grey?'grey':(COLORS[s.course]||'c1'))+(opts.hl===s.id?' hl':''); evs+=ev(s,cls,`<b>${s.course}${(opts.grey||opts.sec)?'-'+s.section:''}</b><i>${s.room}</i>`,s.id); } });
      if(opts.editable){ const slots=hours*2; const eM=state.prefs.earliest?S.mins(state.prefs.earliest):-1, lM=state.prefs.latest?S.mins(state.prefs.latest):1e9; const w=D.student.work; const wTitle=`${w.label} · ${w.days.map(x=>S.DAY[x]).join('/')} ${S.fmt(w.start)}–${S.fmt(w.end)} · from Workday Time Tracking`; for(let i=0;i<slots;i++){ const m=start*60+i*30; const own=(state.prefs.blocks||[]).some(b=>b.days.includes(d)&&S.mins(b.start)<=m&&S.mins(b.end)>m); const work=blocks.some(b=>b.fromWorkday&&b.days.includes(d)&&S.mins(b.start)<=m&&S.mins(b.end)>m); const out=false; const title=work?wTitle:own?'Blocked · select and drag to clear':''; evs+=`<span class="cell ${own?'blk':''} ${work?'wk':''} ${out?'out':''} ${i%2?'half':''}" data-cellday="${d}" data-min="${m}" style="top:${i*100/slots}%;height:${100/slots}%" role="button" ${title?`title="${title}"`:''} aria-label="${S.DAY[d]} ${S.fmt(String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'))}"></span>`; } }
      return `<div class="col ${off.includes(d)?'off':''}">${evs}</div>`;
    }).join('');
    function ev(s,cls,inner,id){ const top=(S.mins(s.start)-start*60)/(hours*60)*100, h=(S.mins(s.end)-S.mins(s.start))/(hours*60)*100; return `<div class="ev ${cls}" ${id?`data-sec="${id}"`:''} style="top:${top}%;height:${h}%">${inner}</div>`; }
    return `<div class="sb-week ${mini?'mini':''} ${opts.grey?'grey':''} ${opts.editable?'edit':''}" style="--hours:${hours};--days:${S.DAY_ORDER.length}"><div></div>${S.DAY_ORDER.map(d=>`<div class="dh ${off.includes(d)?'off':''}">${S.DAY[d]}</div>`).join('')}<div class="times">${times}</div>${cols}</div>`;
  }
  const seatsText=s=> s.seats===0?'Full, waitlist open': s.seats===1?'1 seat left': s.seats+' seats left';
  function classRow(s){
    const pre = s.prereq?` · ${s.prereq} ${(D.student.inProgress||[]).includes(s.prereq)?'in progress':'done'}`:'';
    return `<div class="sb-cls" data-detail="${s.id}"><span class="sw ${COLORS[s.course]}"></span><div class="t"><b>${s.course}-${s.section} · ${s.title}</b><span>${S.dayList(s.days)} · ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.credits} cr</span><span class="meta">Degree Requirement: ${s.fills}${pre} · <em class="${s.seats<=3?'low':''}">${seatsText(s)}</em></span></div><span class="chev">${icon('chevron-right-small')}</span></div>`;
  }
  function catchCard(c, withActions){
    const crit=c.problems.some(p=>p.code==='prereq'||p.code==='full');
    const p=c.problems[0];
    return `<div class="sb-catch ${crit?'crit':''}">${icon(crit?'exclamation-circle-fill':'exclamation-triangle-fill')}<div><b>${c.sec.course}-${c.sec.section} · ${c.sec.title}</b><p>${c.problems.map(x=>x.text).join(' ')}</p><p class="fix">${p.fix}</p>${withActions?actionsFor(c):''}</div></div>`;
  }
  function actionsFor(c){
    const p=c.problems[0];
    if(p.code==='full'){ const other=D.sections.find(s=>s.course===c.sec.course&&s.id!==c.sec.id&&s.seats>0); return `<div class="act"><button class="wd-btn secondary sm" data-waitlist="${c.sec.id}">Join Waitlist</button>${other?`<button class="wd-btn secondary sm" data-use="${other.id}">Use Section ${other.section}</button>`:''}</div>`; }
    if(p.code==='prereq'){ const pre=D.sections.find(s=>s.course===c.sec.prereq&&!S.problems(s,state.prefs,D.student,D).length); return pre?`<div class="act"><button class="wd-btn secondary sm" data-use="${pre.id}">Take ${pre.course} Instead</button></div>`:''; }
    return '';
  }
  const status=(kind,text)=>`<span class="sb-status ${kind}">${icon(kind==='ok'?'check-circle-fill':kind==='warn'?'exclamation-triangle-fill':kind==='later'?'clock':kind==='ip'?'clock':'exclamation-circle-fill')}<span>${text}</span></span>`;
  const sum=(arr,f)=>arr.reduce((a,x)=>a+f(x),0);
  function groupStats(g, scheduled){
    const items=g.items; const sched=new Set(scheduled||[]);
    const done=sum(items.filter(i=>i.status==='done'),i=>i.h), ip=sum(items.filter(i=>i.status==='inprogress'),i=>i.h), planned=sum(items.filter(i=>sched.has(i.course)),i=>i.h);
    return {done, ip, planned, open:items.filter(i=>i.status==='open').length, left:Math.max(0,g.hours-done-ip), leftAfter:Math.max(0,g.hours-done-ip-planned)};
  }
  function worksheet(opts){ // degree worksheet accordion
    opts=opts||{}; const sched=new Set(opts.scheduled||[]);
    return `<div class="sb-ws">${D.requirements.map((g,gi)=>{const st=groupStats(g,opts.scheduled);return `<details class="sb-ws-g" ${opts.open&&opts.open.includes(gi)?'open':''}><summary><span class="n">${g.group}</span><span class="hrs"><b>${st.done+st.ip}</b> of ${g.hours} hrs${st.left?` · <em>${st.left} remaining</em>`:` · ${icon('check-small')} complete`}${opts.eligible&&st.open?` · <i class="el">${st.open} eligible now</i>`:''}</span>${icon('chevron-down-small','chev')}</summary>${g.note?`<p class="note">${g.note}</p>`:''}<ul>${g.items.map(i=>{const k=sched.has(i.course)?'plan':i.status;return `<li class="${k}"><span class="ck" aria-hidden="true">${k==='done'?icon('check-circle-fill'):k==='inprogress'?icon('clock'):k==='plan'?icon('calendar'):''}</span><span class="c">${i.course}</span><span class="t">${i.title}</span><span class="h">${i.h}</span><span class="s">${k==='done'?'Complete':k==='inprogress'?'In progress · '+i.term:k==='plan'?'In this schedule':k==='open'?(i.nosections?'Open · pick in Find Course Sections':'Open'):'After '+(i.after||'prerequisite')}</span></li>`}).join('')}</ul></details>`}).join('')}</div>`;
  }

  // ---------- screens ----------
  const V={};
  V.start=()=>{
    const st=D.student; const done=st.creditsDone, ip=st.creditsInProgress; const left=Math.max(0,(D.minHours||120)-done);
    return `
    ${pageHead(D.termShort+' Registration','Your registration appointment opens <b>'+D.registrationOpens+'</b>.','start')}
    <div class="sb">
      <div class="sb-card">
        <p class="sb-lead">Generate recommended schedules based on your degree requirements and availability. Review your options and make adjustments before confirming your selection.</p>
        <div class="sb-start2">
          <section class="sb-tile2">
            <h3>Academic Progress</h3>
            <div class="stat"><b>${done}</b><div><span class="l">Credit Hours Completed</span></div></div>
            <div class="stat"><b>${ip}</b><div><span class="l">Credit Hours In Progress</span></div></div>
            <div class="stat"><b>${D.minHours||120}</b><div><span class="l">Total Credit Hours Required for Graduation</span></div></div>
          </section>
          <section class="sb-tile2">
            <h3>Degree Information</h3>
            <dl>
              <dt>Degree</dt><dd>${st.degree.replace('Bachelor of Science in Business Administration','B.S.B.A.')}</dd>
              <dt>Major(s)</dt><dd>${st.majors.map(m=>m.name).join(', ')}</dd>
              <dt>Minor(s)</dt><dd>${st.minorShort||st.minor}</dd>
              <dt>Concentration(s)</dt><dd>${st.majors.map(m=>m.conc).join('; ')}</dd>
            </dl>
          </section>
        </div>
      </div>
      ${foot(null,'prefs','Next')}
    </div>`;
  };

  V.prefs=()=>{
    const p=state.prefs; const w=D.student.work;
    const courses=D.needs.filter(n=>!n.later);
    const earlyPresets=['08:00','09:00','10:00','11:00'], latePresets=['14:00','15:00','16:00','17:00','18:00'];
    const parsed=p.parsed||{};
    return `
    ${pageHead('Availability Selection','Set your preferred credit hours and class availability.','prefs')}
    <div class="sb">
      <div class="sb-card">
        ${state.ai?`<div class="sb-ai-box"><label class="sb-label" for="sentence">${icon('sparkle')}Describe It <small>optional · spelling doesn't matter</small></label><div class="row"><textarea class="sb-textarea" id="sentence" placeholder="e.g. nothing before 10, fridays off, I work tues and thurs 1 to 5, 16 hours">${p.sentence||''}</textarea><button class="wd-btn secondary sm" id="applySentence">Apply</button></div><div class="sb-parsed" id="parsed"></div></div>`:''}
        <div class="sb-field"><label class="sb-label">Preferred Credit Hours</label>
          <div class="sb-seg" id="credits">${[12,15,18].map(c=>`<button class="${p.credits===c?'on':''}" data-credits="${c}">${c}</button>`).join('')}<button class="${![12,15,18].includes(p.credits)?'on':''}" data-other="1">${![12,15,18].includes(p.credits)?p.credits:'Other'}</button></div>
          <div class="sb-other ${(state.otherOpen||![12,15,18].includes(p.credits))?'':'is-hidden'}" id="otherRow"><span>Custom Credit Hours</span><button class="step" data-cred="-1" aria-label="One fewer credit hour">${icon('minus')}</button><input id="creditsNum" type="number" min="1" max="21" inputmode="numeric" value="${p.credits}" aria-label="Credit hours"><button class="step" data-cred="1" aria-label="One more credit hour">${icon('plus')}</button><span class="sb-muted">Select 1-21 credit hours. Full-time status requires at least 12.</span></div></div>
        <div class="sb-field"><label class="sb-label">Days Available <small>Select a day to mark it as unavailable</small></label><div class="sb-days">${S.DAY_ORDER.map(d=>`<button class="sb-day ${p.daysOff.includes(d)?'':'on'}" data-day="${d}" aria-pressed="${!p.daysOff.includes(d)}">${S.DAY[d]}</button>`).join('')}</div></div>
        <div class="sb-field">
          <div class="sb-label-row"><label class="sb-label">Blocked Times <small>Select and drag to block unavailable times. Repeat to clear.</small></label><button class="wd-btn secondary sm" data-resetblocks ${(p.blocks||[]).length?'':'disabled'}>Reset</button></div>
          ${week([], {editable:true})}
          <div class="sb-sync"><button class="sw ${p.workSync!==false?'on':''}" role="switch" aria-checked="${p.workSync!==false}" id="workSync" aria-label="Select scheduled ${w.job} hours as unavailable"></button><div><b>Select scheduled ${w.job} hours as unavailable</b></div></div>
        </div>
      </div>
      ${foot('start','needs','Next')}
    </div>`;
  };

  // ---------- course look-up (Degree Requirements) ----------
  function lookupCatalog(){
    const seen=new Set(); const out=[];
    D.flatReqs.forEach(i=>{ if(/^[A-Z]{3,4} \d{5}$/.test(i.course)&&!seen.has(i.course)){ seen.add(i.course); out.push({course:i.course,title:i.title,h:i.h,req:i}); } });
    D.sections.forEach(s=>{ if(!seen.has(s.course)){ seen.add(s.course); out.push({course:s.course,title:s.title,h:s.credits,req:null}); } });
    return out.sort((a,b)=>a.course.localeCompare(b.course));
  }
  function lookup(){
    const q=(state.lookup||'').trim(); const pick=state.lookupPick; const cat=lookupCatalog();
    const ql=q.toLowerCase().replace(/\s+/g,' ');
    const hits=q&&!pick?cat.filter(c=>(c.course+' '+c.title).toLowerCase().includes(ql)).slice(0,8):[];
    return `<div class="sb-lookup">
      <div class="sb-prompt"><div class="sb-prompt-box"><input id="lookupInput" type="text" placeholder="Search by course code or name, e.g. FINN 30603" autocomplete="off" value="${q.replace(/"/g,'&quot;')}">${pick?`<button class="clr" data-lookupclear aria-label="Clear">${icon('x-small')}</button>`:`<span class="pr">${icon('search')}</span>`}</div>
      <div class="sb-prompt-menu" id="lookupMenu" ${hits.length?'':'hidden'}>${hits.map(c=>`<button data-lookup="${c.course}"><b>${c.course}</b> ${c.title}${c.req?` <span>· ${c.req.group}</span>`:''}</button>`).join('')}</div></div>
      ${pick?lookupCard(pick):''}
    </div>`;
  }
  function lookupCard(code){
    const c=lookupCatalog().find(x=>x.course===code); if(!c) return '';
    const i=c.req; const secs=D.sections.filter(s=>s.course===code);
    const g=gen(); const inPlan=new Set((g.options[0]?g.options[0].sections:[]).map(s=>s.course));
    const planned=D.flatReqs.filter(x=>x.status==='open'&&x.pathway).map(x=>x.course);
    const rows=[];
    rows.push(['Degree Requirement', i?`${i.group}${i.pathway?` · Pathway ${i.pathway}`:''}`:'Not a listed requirement on your worksheet']);
    if(i&&i.prereq){ const d=S.done(D.student,i.prereq), ip=(D.student.inProgress||[]).includes(i.prereq), pl=planned.includes(i.prereq)||inPlan.has(i.prereq); rows.push(['Prerequisite', d?status('ok',`${i.prereq} · ${ip?'in progress':'complete'}`):pl?status('later',`${i.prereq} · in your ${D.termShort} plan, so this opens up next term`):status('warn',`${i.prereq} · not yet taken`)]); }
    else if(i&&i.status==='later'&&i.after){ const pl=planned.includes(i.after)||D.requirements.some(gr=>gr.group===i.after); rows.push(['Prerequisite', status(pl?'later':'warn',`${i.after}${pl?` · in progress through your ${D.termShort} plan`:''}`)]); }
    else if(i) rows.push(['Prerequisite', status('ok','None')]);
    if(i&&i.coreq) rows.push(['Corequisite', status('warn',i.coreq)]);
    let st; let cta='';
    if(i&&i.status==='done') st=status('ok','Complete');
    else if(i&&i.status==='inprogress') st=status('ip',`In progress · ${i.term}`);
    else if(i&&i.status==='later'){ const need=i.prereq||i.after; const isGroup=need&&D.requirements.some(gr=>gr.group===need); st=status('later',need?(isGroup?`Not yet eligible · ${need} must be complete first`:`Not yet eligible · needs ${need} first`):'Not yet eligible · prerequisite not met'); }
    else if(inPlan.has(code)) st=status('ok',`In your recommended ${D.termShort} schedule`);
    else if(!secs.length) st=status('later',`No ${D.termShort} sections in this demo`);
    else { const fits=secs.some(s=>!S.problems(s,state.prefs,D.student,D).length); st=fits?status('ok',`Eligible · fits your availability`):status('warn','Eligible · no section fits your availability'); cta=`<button class="wd-btn secondary sm" data-lookupadd="${code}">Build My Schedule Around It</button>`; }
    rows.push(['Status', st]);
    return `<div class="sb-lookup-card"><div class="head"><div><b>${c.course}</b><span>${c.title} · ${c.h} credit hours</span></div>${cta}</div><dl>${rows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl></div>`;
  }

  V.needs=()=>{
    const open=D.flatReqs.filter(i=>i.status==='open');
    const required=open.filter(i=>i.pathway&&!i.nosections);
    const more=open.filter(i=>!required.includes(i));
    const kind=g=>/Elective|Minimum Core/.test(g)?'Elective option':/Minor/.test(g)?'Minor requirement':'Degree requirement';
    const crs=i=>/^[A-Z]{3,4} \d{5}$/.test(i.course)?`<a href="#" data-course="${i.course}"><b>${i.course}</b></a><div class="t"><a href="#" data-course="${i.course}">${i.title}</a></div>`:`<b>${i.course}</b><div class="t">${i.title}</div>`;
    const row=(i,extra)=>`<tr><td>${crs(i)}</td><td class="num">${i.h}</td><td class="req">${i.group}${extra?`<div class="k">${kind(i.group)}</div>`:''}</td></tr>`;
    const table=(rows,extra)=>`<table class="wd-table sb-wstable"><thead><tr><th>Course</th><th class="num">Credit Hours</th><th class="req">Degree Requirement</th></tr></thead><tbody>${rows.map(r=>row(r,extra)).join('')}</tbody></table>`;
    const FINN='https://catalog.uark.edu/plangrids/financebsbawithfinancialmanagementandinvestmentconcentration/', ISYS='https://catalog.uark.edu/plangrids/informationsystemsbsbawithenterpriseresourceplanningconcentration/';
    return `
    ${pageHead('Degree Requirements Overview','From your degree audit, evaluated 10/21/2026 at 2:00 AM. <a href="academics.html#progress">View My Academic Progress</a>','needs')}
    <div class="sb">
      <div class="sb-card">
        <h3 class="wd-section-h">Recommended Next Courses</h3>
        <p class="sb-muted" style="font-size:13px;margin:-4px 0 10px">Courses prioritized based on your academic progress and prerequisite requirements.</p>
        ${table(required)}
        <details class="sb-ws-g sb-more"${state.moreOpen?' open':''}>
          <summary><span class="n">Additional Pathway Recommendations</span><span class="hrs"><b>${more.length}</b> courses</span>${icon('chevron-down-small','chev')}</summary>
          <p class="note">Additional courses suggested by your degree pathway. See the <a href="${FINN}" target="_blank" rel="noopener">Finance Degree Pathway</a> and the <a href="${ISYS}" target="_blank" rel="noopener">Information Systems Degree Pathway</a>.</p>
          ${table(more,true)}
        </details>
        <h3 class="wd-section-h">Course Lookup</h3>
        <p class="sb-muted" style="font-size:13px;margin:-4px 0 10px">Search University of Arkansas courses to view course details, requirements, and enrollment eligibility.</p>
        ${lookup()}
        <h3 class="wd-section-h">Degree Worksheet</h3>
        <p class="sb-muted" style="font-size:13px;margin:-4px 0 10px">View your degree requirements and track degree pathway.</p>
        ${worksheet()}
      </div>
      ${foot('prefs','options','View Schedule Options')}
    </div>`;
  };

  V.options=()=>{
    const g=gen();
    if(!g.options.length){
      const must=state.prefs.mustTake||[];
      return `${pageHead('Schedule Options',null,'options')}<div class="sb"><div class="sb-card"><h2>Nothing fits all of these yet</h2><p class="sub">${must.length>1?`${must.join(' and ')} can't be taken together with your times.`:'Your must-take courses and your times rule each other out.'}</p>${g.hints.map(h=>`<div class="sb-chk">${icon('info')}<span>${h}</span></div>`).join('')}<div class="sb-actions"><a class="wd-btn primary" href="#prefs">Change Preferences</a><a class="wd-btn secondary" href="#errors">View Exclusion Details</a></div></div></div>`;
    }
    if(state.chosen==null||!state.schedule){ state.chosen=0; state.schedule=g.options[0].sections.map(s=>s.id); save(); }
    const banner = g.relaxed ? `<div class="sb-relaxed">${icon('info')}<div><b>No schedule reaches ${g.target} credit hours with these limits.</b> ${g.hints.join(' ')||'Loosen a preference to open more sections.'} <a href="#prefs">Change Preferences</a></div></div>` : '';
    // only small, explainable flags: another section of a course that overlaps a class in this option by 30 minutes or less
    const minor=o=>{ const out=[]; o.sections.forEach(s=>D.sections.filter(x=>x.course===s.course&&x.id!==s.id).forEach(x=>o.sections.filter(y=>y.course!==s.course).forEach(y=>{ const m=S.overlap(x,y); if(m>0&&m<=30) out.push({x,y,s,m}); }))); return out.sort((a,b)=>a.m-b.m).slice(0,1); };
    const rows=g.options.map((o,i)=>{
      const mine=i===2?minor(o):[];
      const sel=state.chosen===i;
      return `<tr class="${sel?'is-sel':''}" data-row="${i}">
        <td class="c"><input type="radio" name="opt" id="opt${i}" ${sel?'checked':''} data-choose="${i}" aria-label="Select ${o.label}"></td>
        <td><label for="opt${i}"><b>${o.label}</b></label><div class="sb-muted">${o.note}</div></td>
        <td class="num">${o.credits}</td>
        <td>${o.sections.map(s=>`<a href="#" data-detail="${s.id}">${s.course}-${s.section} - ${s.title}</a>`).join('')}</td>
        <td class="c">${mine.length?`<button class="sb-hazard" data-flag="${i}" aria-expanded="false" aria-label="${mine.length} section${mine.length===1?'':'s'} ruled out">${icon('exclamation-triangle-fill')}<b>${mine.length}</b></button>`:'<span class="sb-muted">None</span>'}</td>
        <td><button class="wd-select" data-cal="${i}">${icon('calendar')} View Calendar</button></td>
      </tr>
      <tr class="flagrow" id="flag${i}" hidden><td></td><td colspan="5"><div class="sb-flag-list" style="margin:0"><div class="hd">Excluded for this option</div>${mine.map(c=>`<div class="sb-flag-row"><b>${c.x.course}-${c.x.section}</b> Overlaps ${c.y.course}-${c.y.section} by ${c.m} minutes. <i>Section ${c.s.section} is used instead.</i></div>`).join('')}</div></td></tr>`;
    }).join('');
    const cur=schedule(); const curOpt=g.options[state.chosen]||null; const credits=cur.reduce((a,s)=>a+s.credits,0);
    const p=state.prefs; const blocks=S.allBlocks(p,D);
    return `
    ${pageHead(g.relaxed?'Closest Schedule Options':'Schedule Options','Compare recommended schedules and select the option that best fits your academic needs.','options')}
    <div class="sb-wide">
      <div class="wd-kvrow" style="margin:0 0 8px;max-width:760px"><b>Academic Period</b><span>${state.term||D.term}</span><b>Scheduling Preferences</b><span>${prefSummary(p)} &nbsp;<a href="#prefs">Edit</a></span></div>
      ${banner}
      <div class="wd-toolbar"><span class="count">Options <small>${g.options.length} items</small><span class="sb-info" tabindex="0" role="button" aria-label="How Schedules Are Recommended" data-info>${icon('info')}<span class="sb-tip" role="tooltip"><b>How Schedules Are Recommended</b><span>Schedule recommendations consider course availability and individual academic requirements.</span><ul><li><b>Section Availability.</b> Prioritizes course sections with more available seats.</li><li><b>Recommendation Variation.</b> Varies recommendations among students with similar academic requirements.</li><li><b>Current Enrollment Availability.</b> Displays current seat availability for each course section.</li></ul></span></span></span>${icon('export')}${icon('filter')}${icon('expand-table')}<span class="seg"><span class="on">${icon('grid-view')}</span><span>${icon('list-view')}</span></span></div>
      <table class="wd-table sb-opt-table">
        <thead><tr><th style="width:44px"></th><th style="width:26%">Option</th><th class="num" style="width:80px">Credit Hours</th><th>Course Sections</th><th style="width:90px">Ruled Out</th><th style="width:170px">Calendar</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${foot('needs','review','Review Schedule')}
    </div>`;
  };

  function prefSummary(p){
    const avail=S.DAY_ORDER.filter(d=>!p.daysOff.includes(d)); const idx=avail.map(d=>S.DAY_ORDER.indexOf(d));
    const run=idx.length>1&&idx.every((v,k)=>k===0||v===idx[k-1]+1);
    const days=!avail.length?'No days available':run?`${S.DAY[avail[0]]}-${S.DAY[avail.at(-1)]} available`:`${avail.map(d=>S.DAY[d]).join('/')} available`;
    const bits=[p.earliest?`No classes before ${S.fmt(p.earliest)}`:'No start-time restriction', days, p.workSync!==false?'Work hours excluded':'Work hours included'];
    if((p.blocks||[]).length) bits.push(`${p.blocks.length} blocked time${p.blocks.length>1?'s':''}`);
    bits.push(`${p.credits} credit hours`);
    return bits.join(' | ');
  }
  function openCalendar(which, opts){
    opts=opts||{}; const g=gen();
    const tabs=opts.tabs===false?[]:g.options.map((o,i)=>({k:String(i),label:o.label,secs:o.sections,cr:o.credits}));
    let k=String(which);
    if(which==='cur'){ if(tabs.length&&state.chosen>=0&&g.options[state.chosen]) k=String(state.chosen); else { const cur=schedule(); tabs.unshift({k:'cur',label:tabs.length?'Selected':'Registered',secs:cur,cr:cur.reduce((a,s)=>a+s.credits,0)}); k='cur'; } }
    const t=tabs.find(x=>x.k===k)||tabs[0];
    const sc=document.getElementById('scrim');
    sc.innerHTML=`<div class="wd-dialog" role="dialog" aria-modal="true" aria-label="View as Course Calendar"><div class="wd-dialog-head">View as Course Calendar<button class="x" id="calClose" aria-label="Close">${icon('x')}</button></div><div class="wd-dialog-body">${tabs.length>1?`<div class="wd-tabs sb-cal-tabs" role="tablist">${tabs.map(x=>`<button class="wd-tab ${x.k===t.k?'is-active':''}" role="tab" aria-selected="${x.k===t.k}" data-calopt="${x.k}">${x.label}</button>`).join('')}</div>`:''}<a href="#" class="wd-cal-name" data-wd="${D.student.name}'s profile">${D.student.name} (${DEMO_STUDENT.id})</a><div class="wd-cal-sub">${t.label} · ${t.cr} credit hours · ${D.term}</div><div class="sb-cal-legend"><span><i class="sw-class"></i>Classes</span><span><i class="sw-off"></i>Unavailable: work hours, blocked times and days off</span></div><div class="wd-cal-scroll">${week(t.secs,{sec:true})}</div></div></div>`;
    sc.classList.add('open');
  }

  V.swap=()=>{
    const cur=schedule();
    const target = state.swapping ? secById(state.swapping) : null;
    if(!target){
      return `${pageHead('Swap A Course','Pick the course to change. The other '+(cur.length-1)+' stay put.','swap')}<div class="sb"><div class="sb-card">${cur.map(s=>classRow(s)).join('')}</div>${foot('options',null)}</div>`;
    }
    const others=cur.filter(s=>s.id!==target.id);
    const sameCourse=D.sections.filter(s=>s.course===target.course&&s.id!==target.id);
    const sameReq=D.sections.filter(s=>s.course!==target.course&&s.fills===target.fills&&!cur.some(c=>c.course===s.course));
    const laterReq=D.sections.filter(s=>D.needs.find(n=>n.course===s.course&&n.later)&&!cur.some(c=>c.course===s.course));
    const alt=(s)=>{
      const probs=S.problems(s,state.prefs,D.student,D);
      const conf=others.filter(o=>S.overlap(o,s)>0);
      const issues=[...probs.map(p=>p.text+' '+p.fix)];
      conf.forEach(o=>issues.push(`Overlaps ${o.course}-${o.section} by ${S.overlap(o,s)} minutes. Keep ${o.course} or pick another ${s.course} section.`));
      const crit=probs.some(p=>p.code==='prereq'||p.code==='full');
      const canWait=probs.length===1&&probs[0].code==='full'&&!conf.length;
      return `<div class="sb-alt ${issues.length?'bad':''}"><div class="t"><b>${s.course}-${s.section} · ${s.title}</b><span>${S.dayList(s.days)} · ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.credits} cr · ${s.instructor} · ${seatsText(s)} · Degree Requirement: ${s.fills}</span>${issues.length?`<span class="no ${crit?'crit':''}">${issues.join(' ')}</span>`:''}</div>${!issues.length?`<button class="wd-btn primary sm" data-swapto="${s.id}">Use This</button>`:canWait?`<button class="wd-btn secondary sm" data-waitlist="${s.id}">Waitlist</button>`:''}</div>`;
    };
    return `
    ${pageHead('Swap '+target.course+'-'+target.section, target.title+' · '+S.dayList(target.days)+' '+S.fmt(target.start)+'–'+S.fmt(target.end)+'. The other '+others.length+' classes stay put.','swap')}
    <div class="sb">
      <div class="sb-card">
        ${week(cur,{mini:true,hl:target.id})}
        <h3 class="wd-section-h">Other Sections of ${target.course}</h3>
        ${sameCourse.length?sameCourse.map(alt).join(''):'<p class="sb-muted">No other sections this term.</p>'}
        ${sameReq.length?`<h3 class="wd-section-h">Other Courses That Satisfy ${target.fills}</h3>${sameReq.map(alt).join('')}`:''}
        ${laterReq.length&&/FINN/.test(target.course)?`<h3 class="wd-section-h">Finance Courses That Open After ${target.course}</h3>${laterReq.map(alt).join('')}`:''}
        <h3 class="wd-section-h">Or Drop It</h3>
        <div class="sb-alt"><div class="t"><b>Leave ${target.course} for next term</b><span>Schedule becomes ${cur.reduce((a,s)=>a+s.credits,0)-target.credits} credit hours.</span></div><button class="wd-btn secondary sm" data-drop="${target.id}">Drop</button></div>
      </div>
      ${foot('swap-list',null,null,null,`<button class="wd-btn primary" data-go="review">Done</button>`)}
    </div>`;
  };

  function checks(cur){
    const credits=cur.reduce((a,s)=>a+s.credits,0);
    const issues=S.check(cur,state.prefs,D);
    const conf=issues.filter(i=>i.code==='conflict');
    const pre=cur.filter(s=>s.prereq);
    const low=cur.filter(s=>s.seats<=5);
    const out=[
      {ok:true,t:'No Registration Holds',d:'No active registration holds.'},
      {ok:credits>=12,t:`${credits} Credit Hours Selected`,d:credits>=12?'Meets full-time enrollment requirements.':'Below the 12 credit hours required for full-time enrollment.'},
      {ok:!conf.length,t:conf.length?'Schedule Conflict':'No Schedule Conflicts',d:conf.length?conf.map(i=>i.text).join(' '):'No conflicts with selected availability.'},
      {ok:!issues.some(i=>i.code==='prereq'),t:issues.some(i=>i.code==='prereq')?'Prerequisite Missing':'Prerequisites Satisfied',d:pre.length?pre.map(s=>`${s.prereq} satisfies the prerequisite for ${s.course}.`).join(' '):'None of these courses has a prerequisite.'},
    ];
    out.push({ok:true,t:'Seats Available in Every Section',d:cur.map(s=>`${s.seats} in ${s.course}-${s.section}`).join(', ')});
    return out;
  }
  V.review=()=>{
    const cur=schedule(); const credits=cur.reduce((a,s)=>a+s.credits,0);
    const issues=S.check(cur,state.prefs,D);
    const sched=cur.map(s=>s.course);
    const tot=D.totalHours, done=D.student.creditsDone, ip=D.student.creditsInProgress;
    const leftNow=tot-done-ip, leftAfter=leftNow-credits;
    const unlocks=D.flatReqs.filter(i=>i.status==='later'&&sched.includes(i.after)).map(i=>i.course);
    const rows=D.requirements.map(g=>{const s=groupStats(g,sched);return {g,s};}).filter(x=>x.s.left>0||x.s.planned>0);
    return `
    ${pageHead('Review and Confirm', D.termShort+' · '+cur.length+' course sections · '+credits+' credit hours. Review your schedule before confirming registration.','review')}
    <div class="sb">
      <div class="sb-card">
        ${week(cur)}
        <h3 class="wd-section-h">Degree Progress After This Term</h3>
        <div class="sb-left">
                    <table class="wd-table sb-lefttable"><thead><tr><th>Category</th><th class="num">Currently Remaining</th><th class="num">Planned This Term</th><th class="num">Remaining After Term</th></tr></thead><tbody>${rows.map(({g,s})=>`<tr class="${s.leftAfter===0?'ok':''}"><td>${g.group}</td><td class="num">${s.left}</td><td class="num">${s.planned||0}</td><td class="num">${s.leftAfter}</td></tr>`).join('')}</tbody></table>
        </div>
        <h3 class="wd-section-h">Registration Checks</h3>
        <div class="sb-checks">${checks(cur).map(c=>`<details class="sb-chk ${c.ok?'ok':c.warn?'warn':'bad'}"><summary>${icon(c.ok?'check-circle-fill':c.warn?'exclamation-triangle-fill':'exclamation-circle-fill')}<span>${c.t}</span>${icon('chevron-down-small','chev')}</summary><p>${c.d}</p></details>`).join('')}</div>
        <div class="sb-actions end">
          <button class="wd-btn secondary" id="saveBtn">Save Schedule</button>
          <button class="wd-btn secondary" id="advisorBtn">Send to My Advisor</button>
          <button class="wd-btn primary" id="registerBtn" ${issues.length?'disabled':''}>Register</button>
        </div>
        <p class="sb-muted" style="font-size:13px;margin:16px 0 0">Registration opens ${D.registrationOpens}. Register saves this as your plan and submits it when your appointment opens, after you confirm.</p>
      </div>
      ${foot('options',null,null,null,`<button class="wd-btn secondary" data-go="swap-list">Swap A Course</button>`)}
    </div>`;
  };

  V.errors=()=>{
    const g=gen();
    return `
    ${pageHead('Exclusion Details','Workday says "You are not eligible." The builder says what\'s wrong and what to do.','errors')}
    <div class="sb">
      <div class="sb-card">
        ${g.catches.map(c=>catchCard(c,true)).join('')}
      </div>
      ${foot('options',null,null,null,`<button class="wd-btn primary" data-go="options">Back to Schedule Options</button>`)}
    </div>`;
  };

  V.done=()=>{
    const cur=schedule(); const credits=cur.reduce((a,s)=>a+s.credits,0); const conf=state.confirmation||('WD-'+String(Date.now()).slice(-6));
    return `
    ${pageHead('Registration Complete',null,'done')}
    <div class="sb">
      <div class="sb-card sb-success">
        <div class="sb-done-hero">${icon('check-circle-fill')}<div><h2>You're registered for ${D.termShort}.</h2><p>All ${cur.length} course sections went through and your seats are held. Nothing else to do today.</p></div></div>
        <div class="sb-done-stats">
          <div><span>Confirmation</span><b>${conf}</b></div>
          <div><span>Credit Hours</span><b>${credits}</b></div>
          <div><span>Course Sections</span><b>${cur.length}</b></div>
          <div><span>Add/Drop Deadline</span><b>${D.addDropUntil}</b></div>
        </div>
        <div class="sb-actions"><a class="wd-btn primary" href="academics.html#courses">View My Registered Classes</a><a class="wd-btn secondary" href="saved-schedules.html?saved=1">View My Saved Schedules</a><a class="wd-btn secondary" href="builder.html#start" data-newplan="1">Build Another Schedule</a></div>
        <h3 class="wd-section-h">Your ${D.termShort} Week</h3>
        ${week(cur,{sec:true})}
        <div class="wd-btn-row" style="margin:14px 0 0"><button class="wd-btn secondary sm" data-cal="cur">${icon('calendar')} Calendar View</button><button class="wd-btn secondary sm" id="calBtn">${icon('export')} Add to Google, Outlook or Apple Calendar</button></div>
        <h3 class="wd-section-h">Registered Sections</h3>
        <div class="sb-done-list">${cur.map(s=>`<div class="r"><span class="sw ${COLORS[s.course]}"></span><b>${s.course}-${s.section}</b><span>${s.title}</span><em>${S.dayList(s.days)} ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.room}</em></div>`).join('')}</div>
        <h3 class="wd-section-h">Registration Details</h3>
        <div class="sb-kv"><b>Student</b><span>${D.student.name} (${DEMO_STUDENT.id}) · ${D.student.majors.map(m=>m.name).join(' & ')}</span><b>Academic Period</b><span>${D.term}</span><b>Submitted</b><span>${D.registrationSubmitted}</span><b>Confirmation</b><span>${conf} · a copy is in your Workday inbox and your UARK email</span><b>Add/Drop Until</b><span>${D.addDropUntil} · swap or drop anything before then with no record</span></div>
        <h3 class="wd-section-h">Up Next</h3>
        <div class="sb-upnext">
          <div class="r"><b>Tuition statement</b><span>Posts to Financials Hub about 01/05/2027, due 01/19/2027. Financial aid is applied first.</span><a class="wd-btn secondary sm" href="index.html">Financials Hub</a></div>
          <div class="r"><b>Tell your advisor</b><span>Send ${D.student.advisor.name} your registered schedule and the reasons behind each pick.</span><button class="wd-btn secondary sm" id="advisorBtn">Send to My Advisor</button></div>
          <div class="r"><b>Textbooks and materials</b><span>Listed on each section in View My Registered Classes once instructors post them.</span><a class="wd-btn secondary sm" href="academics.html#courses">View My Registered Classes</a></div>
        </div>
      </div>
    </div>`;
  };

  // ---------- calendar export ----------
  const ICS_DAY={M:'MO',T:'TU',W:'WE',Th:'TH',F:'FR',Sa:'SA'};
  const DOW={M:1,T:2,W:3,Th:4,F:5,Sa:6};
  function firstMeeting(sec){ const d=new Date(D.termStart+'T00:00:00'); const days=S.splitDays(sec.days).map(x=>DOW[x]); for(let i=0;i<7;i++){ const t=new Date(d); t.setDate(d.getDate()+i); if(days.includes(t.getDay())) return t; } return d; }
  const pad=n=>String(n).padStart(2,'0');
  const stamp=(date,hm)=>`${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}T${hm.replace(':','')}00`;
  function icsFor(secs){
    const end=D.termEnd.replace(/-/g,'')+'T235959';
    const ev=secs.map(s=>{const f=firstMeeting(s);return ['BEGIN:VEVENT',`UID:${s.id.replace(/\s/g,'')}-${D.termStart}@workday-builder`,`DTSTAMP:${stamp(new Date(),'12:00')}`,`DTSTART;TZID=America/Chicago:${stamp(f,s.start)}`,`DTEND;TZID=America/Chicago:${stamp(f,s.end)}`,`RRULE:FREQ=WEEKLY;BYDAY=${S.splitDays(s.days).map(d=>ICS_DAY[d]).join(',')};UNTIL=${end}`,`SUMMARY:${s.course}-${s.section} ${s.title}`,`LOCATION:${s.room}`,`DESCRIPTION:${s.instructor} · ${s.credits} credit hours · ${s.fills}`,'END:VEVENT'].join('\r\n');}).join('\r\n');
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//UA Workday Student//Schedule Builder//EN','CALSCALE:GREGORIAN',ev,'END:VCALENDAR'].join('\r\n');
  }
  function googleUrl(s){ const f=firstMeeting(s); const u=new URL('https://calendar.google.com/calendar/render'); u.searchParams.set('action','TEMPLATE'); u.searchParams.set('text',`${s.course}-${s.section} ${s.title}`); u.searchParams.set('dates',`${stamp(f,s.start)}/${stamp(f,s.end)}`); u.searchParams.set('ctz','America/Chicago'); u.searchParams.set('location',s.room); u.searchParams.set('details',`${s.instructor} · ${s.credits} credit hours`); u.searchParams.set('recur',`RRULE:FREQ=WEEKLY;BYDAY=${S.splitDays(s.days).map(d=>ICS_DAY[d]).join(',')};UNTIL=${D.termEnd.replace(/-/g,'')}`); return u.toString(); }
  function outlookUrl(s){ const f=firstMeeting(s); const iso=(d,hm)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${hm}:00`; const u=new URL('https://outlook.office.com/calendar/0/deeplink/compose'); u.searchParams.set('subject',`${s.course}-${s.section} ${s.title}`); u.searchParams.set('startdt',iso(f,s.start)); u.searchParams.set('enddt',iso(f,s.end)); u.searchParams.set('location',s.room); u.searchParams.set('body',`${s.instructor} · repeats ${S.dayList(s.days)} through ${D.termEnd}`); u.searchParams.set('path','/calendar/action/compose'); return u.toString(); }
  function openCalendarExport(){
    const cur=schedule(); const sc=document.getElementById('scrim');
    const ics='data:text/calendar;charset=utf-8,'+encodeURIComponent(icsFor(cur));
    sc.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><button class="x" id="closeSheet" aria-label="Close">${icon('x')}</button><h3>Add to calendar</h3><p class="sub">Each class repeats on its days from 01/19/2027 to 05/14/2027, Central time.</p>
      <div class="sb-cal-all"><a class="wd-btn primary" href="${ics}" download="UA-Spring-2027-schedule.ics">${icon('calendar')} Apple Calendar / Outlook (.ics, all ${cur.length})</a><span class="sb-muted">One file with every class.</span></div>
      <h4 class="sb-cal-h">Or one class at a time</h4>
      <div class="sb-cal-list">${cur.map(s=>`<div class="r"><div><b>${s.course}-${s.section}</b><span>${S.dayList(s.days)} ${S.fmt(s.start)}–${S.fmt(s.end)}</span></div><a class="wd-btn secondary sm" target="_blank" rel="noopener" href="${googleUrl(s)}">Google</a><a class="wd-btn secondary sm" target="_blank" rel="noopener" href="${outlookUrl(s)}">Outlook</a></div>`).join('')}</div>
      <div class="wd-btn-row" style="margin-top:16px"><button class="wd-btn secondary" id="closeSheet2">Done</button></div></div>`;
    sc.classList.add('open');
  }

  // ---------- advisor email (format follows the advisor's own recap emails) ----------
  function advisorNote(cur){
    const a=D.student.advisor; const credits=cur.reduce((x,s)=>x+s.credits,0);
    const byGroup={}; cur.forEach(s=>{(byGroup[s.fills]=byGroup[s.fills]||[]).push(s.course)});
    const unlocks=D.flatReqs.filter(i=>i.status==='later'&&cur.some(s=>s.course===i.after)).map(i=>i.course);
    return `Hi ${a.first},\n\nHere is my ${D.termShort} draft from the Schedule Builder (${credits} credit hours):\n${cur.map(s=>`• ${s.course}-${s.section} ${s.title} · ${S.dayList(s.days)} ${S.fmt(s.start)}–${S.fmt(s.end)}`).join('\n')}\n\nWhat it covers:\n${Object.entries(byGroup).map(([g,cs])=>`• ${g}: ${cs.join(', ')}`).join('\n')}${unlocks.length?`\n\nThis unlocks ${unlocks.join(', ')} for Fall 2027.`:''}\n\nDoes this look right before my appointment opens ${D.registrationOpens.replace(',', ' at')}?\n\nThanks,\n${D.student.name}\n${D.student.majors.map(m=>m.name).join(' & ')} · ${D.student.program} · Walton Honors Program`;
  }
  function openAdvisor(){
    const cur=schedule(); const a=D.student.advisor; const sc=document.getElementById('scrim');
    sc.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><button class="x" id="closeSheet" aria-label="Close">${icon('x')}</button><h3>Send to My Advisor</h3><div class="sb-to"><span class="av">${a.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</span><div><b>${a.name}</b><span>${a.title} · ${a.office}</span><span>${a.email}</span></div></div><label class="sb-label" for="advSubject">Subject</label><input class="sb-input" id="advSubject" value="${D.termShort} schedule draft · ${D.student.name}"><label class="sb-label" for="advNote" style="margin-top:12px">Message</label><textarea class="sb-textarea" id="advNote" style="min-height:260px">${advisorNote(cur)}</textarea><p class="sb-muted" style="font-size:12px;margin:8px 0 0">Your draft schedule and the reasons for each pick are attached. ${a.first.split(' ')[0]} can comment or approve from Workday.</p><div class="wd-btn-row" style="margin-top:16px"><button class="wd-btn primary" id="sendAdvisor">Send</button><button class="wd-btn secondary" id="cancelDlg">Cancel</button></div></div>`;
    sc.classList.add('open');
  }

  // ---------- render + events ----------
  const body=document.getElementById('body');
  let lastRoute=null;
  function render(keep){
    let r=route(); const y=window.scrollY;
    if(r==='swap-list'){ state.swapping=null; save(); r='swap'; }
    if(['swap','review','done'].includes(r) && !state.schedule){ const g=gen(); if(!g.options.length){ r='options'; } else { state.chosen=0; state.schedule=g.options[0].sections.map(s=>s.id); save(); } }
    state.maxStep=Math.max(state.maxStep||0, stepIndex(r)); save();
    body.innerHTML=(V[r]||V.start)(); placeTitles();
    document.getElementById('aiToggle').classList.toggle('on',!!state.ai);
    document.getElementById('aiState').textContent=state.ai?'On':'Off';
    if(r==='prefs'&&state.ai) showParsed();
    if(r==='done'&&state.celebrate){ state.celebrate=false; save(); celebrate(); }
    if(keep===true || (keep===undefined && r===lastRoute)) window.scrollTo(0,y); else window.scrollTo(0,0);
    lastRoute=r;
  }
  function showParsed(){
    const p=state.prefs; const box=document.getElementById('parsed'); if(!box) return; const f=p.parsed||{};
    const chips=[]; if(f.earliest) chips.push(`Earliest ${S.fmt(f.earliest)}`); if(f.latest) chips.push(`Latest ${S.fmt(f.latest)}`); if(f.daysOff&&f.daysOff.length) chips.push(`${f.daysOff.map(d=>S.DAY[d]).join('/')} unavailable`); if(f.block) chips.push(`${f.block.label} ${f.block.days.map(d=>S.DAY[d]).join('/')} ${S.fmt(f.block.start)}–${S.fmt(f.block.end)}`); if(f.credits) chips.push(`${f.credits} credit hours`); (f.mustTake||[]).forEach(c=>chips.push(`Must take ${c}`));
    box.innerHTML=chips.length?`<span class="lbl">Understood:</span>`+chips.map(x=>`<span>${x}</span>`).join(''):(p.parsed?`<span class="lbl">Nothing recognised. Try naming a time, a day, or a work shift.</span>`:`<span class="lbl">Press Apply to read this sentence into the form.</span>`);
  }
  function openSheet(id){
    const s=secById(id); if(!s) return;
    const inSched=(state.schedule||[]).includes(id);
    const scrim=document.getElementById('scrim');
    scrim.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><button class="x" id="closeSheet" aria-label="Close">${icon('x')}</button><h3>${s.course}-${s.section} · ${s.title}</h3><p class="sub">${S.dayList(s.days)} · ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.room} · ${s.instructor}</p><div class="whybox"><b>Why it's here</b>${S.why(s,D.student,state.ai?'ai':'rules')}</div><dl><dt>Degree Requirement</dt><dd>${s.fills}</dd><dt>Prerequisite</dt><dd>${s.prereq?`${s.prereq} · ${S.done(D.student,s.prereq)?((D.student.inProgress||[]).includes(s.prereq)?'in progress':'done'):'<b style="color:#b3261e">not done</b>'}`:'None'}</dd><dt>Seats</dt><dd>${seatsText(s)}</dd><dt>Credit Hours</dt><dd>${s.credits}</dd></dl><div class="wd-btn-row">${inSched?`<button class="wd-btn primary" data-swapfor="${s.id}">Swap This Course</button>`:''}<button class="wd-btn secondary" id="closeSheet2">Close</button></div></div>`;
    scrim.classList.add('open');
  }
  function openCourse(code){ const sc=document.getElementById('scrim'); sc.innerHTML=`<div class="sb-sheet sb-course-sheet" role="dialog" aria-modal="true"><button class="x" id="closeSheet" aria-label="Close">${icon('x')}</button><h3>Course Details</h3>${lookupCard(code)}<div class="wd-btn-row" style="margin-top:16px"><button class="wd-btn secondary" id="closeSheet2">Close</button></div></div>`; sc.classList.add('open'); }
  function celebrate(){
    const cur=schedule(); const credits=cur.reduce((a,s)=>a+s.credits,0); const sc=document.getElementById('scrim');
    sc.innerHTML=`<div class="sb-sheet sb-congrats" role="dialog" aria-modal="true" aria-labelledby="congratsTitle"><button class="x" id="closeSheet" aria-label="Close">${icon('x')}</button><div class="burst">${icon('check-circle-fill')}</div><h3 id="congratsTitle">Congratulations, ${D.student.name.split(' ')[0]}!</h3><p class="sub">You're registered for ${D.termShort}.</p><div class="sb-congrats-kv"><div><span>Confirmation</span><b>${state.confirmation}</b></div><div><span>Course Sections</span><b>${cur.length}</b></div><div><span>Credit Hours</span><b>${credits}</b></div><div><span>Add/Drop Until</span><b>${D.addDropUntil}</b></div></div><div class="wd-btn-row"><button class="wd-btn primary" id="closeSheet2">View Registration Details</button><button class="wd-btn secondary" id="calBtn">Add to Calendar</button></div></div>`;
    sc.classList.add('open'); confetti();
  }
  function confetti(){
    try{ if(matchMedia('(prefers-reduced-motion: reduce)').matches) return; }catch(e){}
    const c=document.createElement('canvas'); c.className='sb-confetti'; c.setAttribute('aria-hidden','true'); document.body.appendChild(c);
    const dpr=Math.min(2,window.devicePixelRatio||1), W=c.width=innerWidth*dpr, H=c.height=innerHeight*dpr, ctx=c.getContext('2d');
    const cols=['#9d2235','#c9a227','#0875e1','#2e7d32','#e8a0ad','#5e6a75'];
    const P=Array.from({length:180},(_,i)=>{ const left=i%2===0; return {x:(left?.08:.92)*W, y:.95*H, vx:(left?1:-1)*(4+Math.random()*9)*dpr, vy:-(14+Math.random()*12)*dpr, r:(5+Math.random()*5)*dpr, c:cols[i%cols.length], a:Math.random()*6, va:(Math.random()-.5)*.35, rect:Math.random()<.65}; });
    const t0=performance.now(); let last=t0;
    (function frame(t){ const dt=Math.min(2,(t-last)/16.7); last=t; ctx.clearRect(0,0,W,H); const fade=Math.max(0,1-Math.max(0,t-t0-2200)/1000);
      P.forEach(p=>{ p.vy+=.38*dpr*dt; p.vx*=.992; p.x+=p.vx*dt; p.y+=p.vy*dt; p.a+=p.va*dt; ctx.save(); ctx.globalAlpha=fade; ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.fillStyle=p.c; if(p.rect) ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); else { ctx.beginPath(); ctx.arc(0,0,p.r/3,0,6.3); ctx.fill(); } ctx.restore(); });
      if(t-t0<3300) requestAnimationFrame(frame); else c.remove(); })(t0);
  }
  function closeSheet(){ const sc=document.getElementById('scrim'); sc.classList.remove('open'); sc.innerHTML=''; }
  function setCredits(n){ n=Math.max(1,Math.min(21,n|0)); if(n===state.prefs.credits){ render(true); return; } state.prefs.credits=n; resetPicks(); save(); render(true); }
  function setTime(which,val){ if(val&&!/^\d{2}:\d{2}$/.test(val)) return; state.prefs[which]=val||''; if(which==='latest'&&val&&state.prefs.earliest&&S.mins(val)<=S.mins(state.prefs.earliest)){ toast('Latest has to be after earliest.'); state.prefs[which]=''; } resetPicks(); save(); render(true); }

  document.addEventListener('click',e=>{
    const t=e.target.closest('.cell,[data-calopt],[data-course],[data-lookup],[data-lookupadd],[data-lookupclear],[data-resetblocks],[data-flag],[data-go],[data-credits],[data-other],[data-cred],[data-time],[data-day],[data-must],[data-unblock],#workSync,[data-cal],#calClose,[data-newplan],[data-choose],[data-detail],[data-sec],[data-swapto],[data-swapfor],[data-drop],[data-waitlist],[data-use],#applySentence,#registerBtn,#advisorBtn,#saveBtn,#calBtn,#closeSheet,#closeSheet2,#aiToggle,#confirmReg,#cancelDlg,#sendAdvisor');
    if(!t) { if(e.target.id==='scrim') closeSheet(); return; }
    const p=state.prefs;
    if(t.classList.contains('cell')){ return; } // handled by the drag painter
    if(t.dataset.cal!==undefined){ e.preventDefault(); openCalendar(t.dataset.cal==='cur'?'cur':+t.dataset.cal, route()==='done'?{tabs:false}:{}); return; }
    if(t.dataset.calopt!==undefined){ openCalendar(t.dataset.calopt==='cur'?'cur':+t.dataset.calopt); return; }
    if(t.id==='calClose'){ closeSheet(); return; }
    if(t.dataset.flag!==undefined){ const l=document.getElementById('flag'+t.dataset.flag); l.hidden=!l.hidden; t.setAttribute('aria-expanded',String(!l.hidden)); t.classList.toggle('open',!l.hidden); return; }
    if(t.dataset.newplan){ try{ sessionStorage.removeItem('sb-state'); }catch(e){} return; }
    if(t.dataset.go!==undefined){ go(t.dataset.go); return; }
    if(t.id==='aiToggle'){ state.ai=!state.ai; try{localStorage.setItem('sb-ai',state.ai?'on':'off');}catch(e){} save(); render(true); return; }
    if(t.dataset.credits){ state.otherOpen=false; setCredits(+t.dataset.credits); return; }
    if(t.dataset.other){ state.otherOpen=true; save(); render(true); setTimeout(()=>document.getElementById('creditsNum')?.focus(),50); return; }
    if(t.dataset.cred){ setCredits(p.credits+(+t.dataset.cred)); return; }
    if(t.dataset.time){ setTime(t.dataset.time,t.dataset.val); return; }
    if(t.dataset.day){ const d=t.dataset.day; p.daysOff=p.daysOff.includes(d)?p.daysOff.filter(x=>x!==d):[...p.daysOff,d]; resetPicks(); save(); render(true); return; }
    if(t.dataset.course){ e.preventDefault(); openCourse(t.dataset.course); return; }
    if(t.dataset.lookup){ state.lookupPick=t.dataset.lookup; state.lookup=t.dataset.lookup; save(); render(true); return; }
    if(t.hasAttribute('data-lookupclear')){ state.lookupPick=null; state.lookup=''; save(); render(true); document.getElementById('lookupInput')?.focus(); return; }
    if(t.dataset.lookupadd){ closeSheet(); p.mustTake=[t.dataset.lookupadd]; resetPicks(); save(); location.hash='options'; toast(t.dataset.lookupadd+' will be in every option.'); return; }
    if(t.hasAttribute('data-resetblocks')){ p.blocks=[]; resetPicks(); save(); render(true); toast('Blocked times reset.'); return; }
    if(t.id==='workSync'){ p.workSync=!(p.workSync!==false); resetPicks(); save(); render(true); toast(p.workSync?'Scheduled work hours added to unavailable times.':'Scheduled work hours removed from unavailable times.'); return; }
    if(t.dataset.unblock!==undefined){ p.blocks.splice(+t.dataset.unblock,1); resetPicks(); save(); render(true); return; }
    if(t.dataset.must){ const c=t.dataset.must; p.mustTake=p.mustTake.includes(c)?p.mustTake.filter(x=>x!==c):[...p.mustTake,c]; resetPicks(); save(); render(true); if(t.dataset.title){ toast(c+' will be in every option.'); } return; }
    if(t.id==='applySentence'){ const txt=document.getElementById('sentence').value; state.prefs=S.parseSentence(txt,p); resetPicks(); save(); render(true); const f=state.prefs.parsed||{}; toast(Object.keys(f).length?'Got it. Check the form below.':'Nothing recognised. Try naming a time, a day, or a work shift.'); return; }
    if(t.dataset.choose!==undefined){ const g=gen(); state.chosen=+t.dataset.choose; state.schedule=g.options[state.chosen].sections.map(s=>s.id); save(); render(true); return; }
    if(t.dataset.detail||t.dataset.sec){ e.preventDefault(); openSheet(t.dataset.detail||t.dataset.sec); return; }
    if(t.dataset.swapfor){ closeSheet(); state.swapping=t.dataset.swapfor; save(); go('swap'); render(); return; }
    if(t.dataset.swapto){ const from=state.swapping; state.schedule=(state.schedule||[]).map(id=>id===from?t.dataset.swapto:id); state.chosen=-1; state.swapping=null; save(); go('review'); toast(`Swapped to ${t.dataset.swapto}. The other ${state.schedule.length-1} classes stay put.`); return; }
    if(t.dataset.drop){ state.schedule=(state.schedule||[]).filter(id=>id!==t.dataset.drop); state.chosen=-1; state.swapping=null; save(); go('review'); toast(`Dropped ${t.dataset.drop} from the plan.`); return; }
    if(t.dataset.waitlist){ toast(`Added to the waitlist for ${t.dataset.waitlist}. We'll text you when a seat opens.`); return; }
    if(t.dataset.use){ const s=secById(t.dataset.use); const cur=state.schedule||[]; if(!cur.includes(s.id)){ const same=cur.find(id=>(secById(id)||{}).course===s.course); state.schedule= same? cur.map(id=>id===same?s.id:id) : [...cur,s.id]; state.chosen=-1; save(); } go('review'); toast(`${s.course}-${s.section} is in the plan.`); return; }
    if(t.id==='closeSheet'||t.id==='closeSheet2'||t.id==='cancelDlg'){ closeSheet(); return; }
    if(t.id==='calBtn'){ openCalendarExport(); return; }
    if(t.id==='saveBtn'){ let saved=[]; try{ saved=JSON.parse(localStorage.getItem('sb-saved')||'[]'); }catch(e){} const cur=schedule(); saved.unshift({name:`${D.termShort} · Builder`, sections:cur.map(s=>`${s.course}-${s.section} - ${s.title.toUpperCase()}`), alerts:0, credits:cur.reduce((a,s)=>a+s.credits,0)}); try{localStorage.setItem('sb-saved',JSON.stringify(saved.slice(0,3)));}catch(e){} t.textContent='Saving…'; t.disabled=true; setTimeout(()=>{ location.href='saved-schedules.html?saved=1'; },350); return; }
    if(t.id==='advisorBtn'){ openAdvisor(); return; }
    if(t.id==='sendAdvisor'){ closeSheet(); toast(`Sent to ${D.student.advisor.name}. You'll get a notification when they reply.`); return; }
    if(t.id==='registerBtn'){ const cur=schedule(); const sc=document.getElementById('scrim'); sc.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><h3>Register ${cur.length} sections for ${D.termShort}?</h3><p class="sub">${cur.map(s=>s.course+'-'+s.section).join(', ')} · ${cur.reduce((a,s)=>a+s.credits,0)} credit hours</p><p style="font-size:14px;line-height:20px;margin:0 0 16px">This is the only step that changes your registration. You can drop or swap until ${D.addDropUntil}.</p><div class="wd-btn-row"><button class="wd-btn primary" id="confirmReg">Confirm and Register</button><button class="wd-btn secondary" id="cancelDlg">Cancel</button></div></div>`; sc.classList.add('open'); return; }
    if(t.id==='confirmReg'){ closeSheet(); state.confirmation='WD-'+String(Date.now()).slice(-6); state.celebrate=true; save(); const cur=schedule(); try{ let saved=JSON.parse(localStorage.getItem('sb-saved')||'[]'); saved=saved.filter(x=>!x.registered); saved.unshift({name:`${D.termShort}`, registered:true, sections:cur.map(s=>`${s.course}-${s.section} - ${s.title.toUpperCase()}`), alerts:0, credits:cur.reduce((a,s)=>a+s.credits,0)}); localStorage.setItem('sb-saved',JSON.stringify(saved.slice(0,3))); }catch(e){} go('done'); return; }
  });
  document.addEventListener('focusin',e=>{ if(e.target.id==='mustInput'){ const m=document.getElementById('mustMenu'); if(m) m.hidden=false; } });
  document.addEventListener('input',e=>{ if(e.target.id==='lookupInput'){ state.lookup=e.target.value; state.lookupPick=null; const box=e.target.closest('.sb-lookup'); const menu=box.querySelector('#lookupMenu'); const card=box.querySelector('.sb-lookup-card'); if(card) card.remove(); const q=e.target.value.trim().toLowerCase().replace(/\s+/g,' '); const hits=q?lookupCatalog().filter(c=>(c.course+' '+c.title).toLowerCase().includes(q)).slice(0,8):[]; menu.innerHTML=hits.map(c=>`<button data-lookup="${c.course}"><b>${c.course}</b> ${c.title}${c.req?` <span>· ${c.req.group}</span>`:''}</button>`).join(''); menu.hidden=!hits.length; return; }
    if(e.target.id==='mustInput'){ const q=e.target.value.toLowerCase(); const m=document.getElementById('mustMenu'); if(!m) return; m.hidden=false; m.querySelectorAll('button').forEach(b=>{ b.hidden=!(b.textContent.toLowerCase().includes(q)); }); } });
  document.addEventListener('click',e=>{ const m=document.getElementById('mustMenu'); if(m && !e.target.closest('.sb-prompt')) m.hidden=true; });
  function rangeLive(e){ const a=document.getElementById('rangeStart'), b=document.getElementById('rangeEnd'); if(!a||!b) return null; let x=+a.value, y=+b.value; if(y-x<60){ if(e&&e.target===a) x=y-60; else y=x+60; a.value=x; b.value=y; } const box=a.closest('.sb-range'); box.style.setProperty('--a',((x-480)/720*100)+'%'); box.style.setProperty('--b',((y-480)/720*100)+'%'); const hm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); document.getElementById('rangeStartVal').textContent=S.fmt(hm(x)); document.getElementById('rangeEndVal').textContent=S.fmt(hm(y)); document.querySelectorAll('.sb-week .cell').forEach(c=>c.classList.toggle('out',+c.dataset.min<x||+c.dataset.min>=y)); return {x,y,hm}; }
  document.addEventListener('input',e=>{ if(e.target.id==='rangeStart'||e.target.id==='rangeEnd') rangeLive(e); });
  document.addEventListener('change',e=>{
    if(e.target.id==='rangeStart'||e.target.id==='rangeEnd'){ const r=rangeLive(e); if(!r) return; state.prefs.earliest=r.x<=480?'':r.hm(r.x); state.prefs.latest=r.y>=1200?'':r.hm(r.y); resetPicks(); save(); render(true); return; }
    if(e.target.id==='earliest'||e.target.id==='latest'){ setTime(e.target.id,e.target.value); }
    if(e.target.id==='creditsNum'){ setCredits(+e.target.value); }
  });
  document.addEventListener('click',e=>{ const i=e.target.closest('[data-info]'); document.querySelectorAll('.sb-info.open').forEach(x=>{ if(x!==i) x.classList.remove('open'); }); if(i&&!e.target.closest('.sb-tip')) i.classList.toggle('open'); });
  document.addEventListener('toggle',e=>{ if(e.target.classList&&e.target.classList.contains('sb-more')){ state.moreOpen=e.target.open; save(); } },true);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeSheet(); if(e.key==='Enter'&&e.target.id==='creditsNum'){ setCredits(+e.target.value); } if(e.key==='Enter'&&e.target.id==='sentence'&&!e.shiftKey){ e.preventDefault(); document.getElementById('applySentence')?.click(); } });
  // ---------- blocked-time painter: press and drag over half-hour cells ----------
  const slotKey=(d,m)=>d+':'+m;
  function ownSlots(){ const set=new Set(); (state.prefs.blocks||[]).forEach(b=>{ for(let m=S.mins(b.start); m<S.mins(b.end); m+=30) b.days.forEach(d=>set.add(slotKey(d,m))); }); return set; }
  function slotsToBlocks(set){ const out=[]; S.DAY_ORDER.forEach(d=>{ const ms=[...set].filter(k=>k.startsWith(d+':')).map(k=>+k.split(':')[1]).sort((a,b)=>a-b); let i=0; while(i<ms.length){ let j=i; while(j+1<ms.length&&ms[j+1]===ms[j]+30) j++; const hm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); out.push({label:'Blocked',days:[d],start:hm(ms[i]),end:hm(ms[j]+30)}); i=j+1; } }); return out; }
  let paint=null;
  function cellAt(x,y){ const el=document.elementFromPoint(x,y); return el&&el.classList&&el.classList.contains('cell')?el:null; }
  function paintCell(c){ if(!paint||!c||c.classList.contains('wk')||c.classList.contains('out')) return; const k=slotKey(c.dataset.cellday,+c.dataset.min); if(paint.mode==='add'){ paint.set.add(k); c.classList.add('blk'); } else { paint.set.delete(k); c.classList.remove('blk'); } }
  document.addEventListener('pointerdown',e=>{
    const c=e.target.closest('.sb-week .cell'); if(!c) return;
    if(c.classList.contains('wk')){ toast('That time comes from your Workday work schedule. Use the toggle below the grid to change it.'); return; }
    if(c.classList.contains('out')){ toast('Outside your preferred start and end time. Move the nodes above to open it up.'); return; }
    e.preventDefault();
    paint={mode:c.classList.contains('blk')?'remove':'add', set:ownSlots(), moved:false}; c.closest('.sb-week').classList.add('painting');
    paintCell(c);
  });
  document.addEventListener('pointermove',e=>{ if(!paint) return; paint.moved=true; paintCell(cellAt(e.clientX,e.clientY)); });
  function endPaint(){ if(!paint) return; document.querySelectorAll('.sb-week.painting').forEach(g=>g.classList.remove('painting')); const blocks=slotsToBlocks(paint.set); paint=null; state.prefs.blocks=blocks; resetPicks(); save(); render(true); }
  document.addEventListener('pointerup',endPaint); document.addEventListener('pointercancel',endPaint);

  // ---------- boot ----------
  renderShell({active:'student',footer:false});
  document.getElementById('rail').outerHTML=renderRail('builder');
  function termPill(){ const t=state.term||D.terms[0]; const dates=((t.match(/\(([^)]*)\)/)||[])[1]||'').replace('-',' - '); document.getElementById('termPill').innerHTML=icon('calendar')+'<span>'+t.replace(/\s*\(.*$/,'').replace('UAF ','')+'</span>'+(dates?'<span class="dates">'+dates+'</span>':'')+icon('caret-down-small'); }
  termPill();
  document.getElementById('termPill').addEventListener('click',e=>{
    e.stopPropagation();
    let m=document.getElementById('termMenu');
    if(m){ m.remove(); return; }
    m=document.createElement('div'); m.id='termMenu'; m.className='sb-term-menu'; m.setAttribute('role','menu');
    m.innerHTML=`<p>Set from your registration appointment, ${D.registrationOpens}.</p>`+D.terms.map(t=>`<button role="menuitemradio" aria-checked="${t===state.term}" data-term="${t}">${t===state.term?icon('check-small'):'<i></i>'}<span>${t}</span></button>`).join('');
    document.getElementById('termPill').after(m);
  });
  document.addEventListener('click',e=>{ const m=document.getElementById('termMenu'); if(!m) return; const b=e.target.closest('[data-term]'); if(b){ state.term=b.dataset.term; save(); termPill(); toast('Term set to '+b.dataset.term.replace(/\s*\(.*$/,'')+'. Your preferences carry over.'); } if(!m.contains(e.target)||b) m.remove(); });
  window.addEventListener('hashchange',()=>render());
  render();
})();
