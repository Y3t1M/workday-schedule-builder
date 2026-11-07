/* Schedule Builder UI. Screens are hash-routed:
   #start #prefs #needs #options #swap #review #errors (#done after registering) */
(function(){
  const D=SB_DATA, S=SB;
  const STEPS=[['start','Start'],['prefs','Preferences'],['needs','Deg. Requirements'],['options','Schedules'],['review','Review']];
  const COLORS={}; D.needs.forEach((n,i)=>COLORS[n.course]='c'+((i%6)+1));
  const STUDENT_KEY=(window.DEMO_STUDENT&&DEMO_STUDENT.id)||D.student.name;

  // surface anything that breaks instead of failing silently
  window.addEventListener('error',e=>{ try{ toast('Something went wrong: '+(e.message||'unknown error')+'. Reload the page.'); }catch(x){} });
  window.addEventListener('unhandledrejection',e=>{ try{ toast('Something went wrong: '+(e.reason&&e.reason.message||'unknown error')); }catch(x){} });

  // ---------- state ----------
  const qs=new URLSearchParams(location.search);
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
  function route(){ return location.hash.replace('#','')||'start'; }
  function go(h){ location.hash=h; }
  const stepIndex=r=>{ const i=STEPS.findIndex(s=>s[0]===r); return i>=0?i:({swap:3,errors:3,done:4}[r]??0); };
  function stepsBar(cur){
    const at=stepIndex(cur); const max=Math.max(state.maxStep||0,at);
    return `<div class="sb-prog-meta sb-meta2"><b>Let's Build Your Schedule</b><span>step ${at+1} of ${STEPS.length}</span></div><ol class="sb-steps2" aria-label="Progress">${STEPS.map((s,i)=>{
      const k=i<at?'done':i===at?'now':'todo'; const can=i<=max&&i!==at;
      const mark=i<at?icon('check-small'):`<span>${i+1}</span>`;
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
      blocks.forEach(b=>{ if(b.days.includes(d)) evs+=ev({start:b.start,end:b.end},'block',`<b>${b.label}</b>`); });
      (secs||[]).forEach(s=>{ if(S.splitDays(s.days).includes(d)){ const cls=(opts.grey?'grey':(COLORS[s.course]||'c1'))+(opts.hl===s.id?' hl':''); evs+=ev(s,cls,`<b>${s.course}${opts.grey?'-'+s.section:''}</b><i>${s.room}</i>`,s.id); } });
      if(opts.editable){ for(let i=0;i<hours;i++){ const h=start+i; const blk=blocks.some(b=>b.days.includes(d)&&S.mins(b.start)<=h*60&&S.mins(b.end)>h*60); evs+=`<span class="cell ${blk?'blk':''}" data-cellday="${d}" data-hour="${h}" style="top:${i*100/hours}%;height:${100/hours}%" role="button" aria-label="${S.DAY[d]} ${h%12||12} ${h<12?'AM':'PM'}"></span>`; } }
      return `<div class="col ${off.includes(d)?'off':''}">${evs}</div>`;
    }).join('');
    function ev(s,cls,inner,id){ const top=(S.mins(s.start)-start*60)/(hours*60)*100, h=(S.mins(s.end)-S.mins(s.start))/(hours*60)*100; return `<div class="ev ${cls}" ${id?`data-sec="${id}"`:''} style="top:${top}%;height:${h}%">${inner}</div>`; }
    return `<div class="sb-week ${mini?'mini':''} ${opts.grey?'grey':''}" style="--hours:${hours};--days:${S.DAY_ORDER.length}"><div></div>${S.DAY_ORDER.map(d=>`<div class="dh ${off.includes(d)?'off':''}">${S.DAY[d]}</div>`).join('')}<div class="times">${times}</div>${cols}</div>`;
  }
  const seatsText=s=> s.seats===0?'Full, waitlist open': s.seats===1?'1 seat left': s.seats+' seats left';
  function classRow(s){
    const pre = s.prereq?` · ${s.prereq} ${(D.student.inProgress||[]).includes(s.prereq)?'in progress':'done'}`:'';
    return `<div class="sb-cls" data-detail="${s.id}"><span class="sw ${COLORS[s.course]}"></span><div class="t"><b>${s.course}-${s.section} · ${s.title}</b><span>${S.dayList(s.days)} · ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.credits} cr</span><span class="meta">Fills ${s.fills}${pre} · <em class="${s.seats<=3?'low':''}">${seatsText(s)}</em></span></div><span class="chev">${icon('chevron-right-small')}</span></div>`;
  }
  function catchCard(c, withActions){
    const crit=c.problems.some(p=>p.code==='prereq'||p.code==='full');
    const p=c.problems[0];
    return `<div class="sb-catch ${crit?'crit':''}">${icon(crit?'exclamation-circle-fill':'exclamation-triangle-fill')}<div><b>${c.sec.course}-${c.sec.section} · ${c.sec.title}</b><p>${c.problems.map(x=>x.text).join(' ')}</p><p class="fix">${p.fix}</p>${withActions?actionsFor(c):''}</div></div>`;
  }
  function actionsFor(c){
    const p=c.problems[0];
    if(p.code==='full'){ const other=D.sections.find(s=>s.course===c.sec.course&&s.id!==c.sec.id&&s.seats>0); return `<div class="act"><button class="wd-btn secondary sm" data-waitlist="${c.sec.id}">Join waitlist</button>${other?`<button class="wd-btn secondary sm" data-use="${other.id}">Use section ${other.section}</button>`:''}</div>`; }
    if(p.code==='prereq'){ const pre=D.sections.find(s=>s.course===c.sec.prereq&&!S.problems(s,state.prefs,D.student,D).length); return pre?`<div class="act"><button class="wd-btn secondary sm" data-use="${pre.id}">Take ${pre.course} instead</button></div>`:''; }
    return '';
  }
  const status=(kind,text)=>`<span class="sb-status ${kind}">${icon(kind==='ok'?'check-circle-fill':kind==='warn'?'exclamation-triangle-fill':kind==='later'?'clock':kind==='ip'?'clock':'exclamation-circle-fill')}<span>${text}</span></span>`;
  const sum=(arr,f)=>arr.reduce((a,x)=>a+f(x),0);
  function groupStats(g, scheduled){
    const items=g.items; const sched=new Set(scheduled||[]);
    const done=sum(items.filter(i=>i.status==='done'),i=>i.h), ip=sum(items.filter(i=>i.status==='inprogress'),i=>i.h), planned=sum(items.filter(i=>sched.has(i.course)),i=>i.h);
    return {done, ip, planned, left:Math.max(0,g.hours-done-ip), leftAfter:Math.max(0,g.hours-done-ip-planned)};
  }
  function worksheet(opts){ // degree worksheet accordion
    opts=opts||{}; const sched=new Set(opts.scheduled||[]);
    return `<div class="sb-ws">${D.requirements.map((g,gi)=>{const st=groupStats(g,opts.scheduled);return `<details class="sb-ws-g" ${opts.open&&opts.open.includes(gi)?'open':''}><summary><span class="n">${g.group}</span><span class="hrs"><b>${st.done+st.ip}</b> of ${g.hours} hrs${st.left?` · <em>${st.left} left</em>`:` · ${icon('check-small')} complete`}</span>${icon('chevron-down-small','chev')}</summary>${g.note?`<p class="note">${g.note}</p>`:''}<ul>${g.items.map(i=>{const k=sched.has(i.course)?'plan':i.status;return `<li class="${k}"><span class="ck">${k==='done'?icon('check-small'):k==='inprogress'?icon('clock'):k==='plan'?icon('calendar'):''}</span><span class="c">${i.course}</span><span class="t">${i.title}</span><span class="h">${i.h}</span><span class="s">${k==='done'?'Complete':k==='inprogress'?'In progress · '+i.term:k==='plan'?'In this schedule':k==='open'?(i.nosections?'Open · pick in Find Course Sections':'Open'):'After '+(i.after||'prerequisite')}</span></li>`}).join('')}</ul></details>`}).join('')}</div>`;
  }

  // ---------- screens ----------
  const V={};
  V.start=()=>{
    const st=D.student; const done=st.creditsDone, ip=st.creditsInProgress; const left=Math.max(0,(D.minHours||120)-done);
    return `
    ${pageHead('Registration for '+D.termShort,'Your registration appointment opens '+D.registrationOpens+'.','start')}
    <div class="sb">
      <div class="sb-card">
        <span class="sb-dates">${D.term.replace(/^.*\((.*)\)$/,'$1').replace('-',' – ')}</span>
        <p class="sb-lead">Get three personalized schedules based on your degree requirements and availability. Compare your options, swap classes, and confirm your selection.</p>
        <div class="sb-grid2">
          <div class="sb-fact"><span class="k">Academic Progress</span><b>${done}</b><span>credit hours completed${ip?` · ${ip} in progress`:''}</span></div>
          <div class="sb-fact"><span class="k">Minimum Credit Hours Left</span><b>${left}</b><span>required to graduate · ${D.minHours||120} minimum</span></div>
          <div class="sb-fact"><span class="k">Degree of Study</span><b class="t">${st.degree.replace('Bachelor of Science in Business Administration','B.S.B.A.')} ${st.majors.map(m=>m.name).join(', ')}</b><span>Minor: ${st.minorShort||st.minor}</span></div>
          <div class="sb-fact"><span class="k">Concentration</span><b class="t">${st.majors[1]?st.majors[1].conc:st.majors[0].conc}</b><span>${st.majors[1]?st.majors[0].conc+' (Finance)':''}</span></div>
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
    ${pageHead('Preferences','Only sections that break these get dropped.','prefs')}
    <div class="sb">
      <div class="sb-card">
        ${state.ai?`<div class="sb-ai-box"><label class="sb-label" for="sentence">${icon('sparkle')}Describe it <small>optional · spelling doesn't matter</small></label><div class="row"><textarea class="sb-textarea" id="sentence" placeholder="e.g. nothing before 10, fridays off, I work tues and thurs 1 to 5, 16 hours">${p.sentence||''}</textarea><button class="wd-btn secondary sm" id="applySentence">Apply</button></div><div class="sb-parsed" id="parsed"></div></div>`:''}
        <div class="sb-field"><label class="sb-label">Credit hours</label>
          <div class="sb-seg" id="credits">${[12,15,18].map(c=>`<button class="${p.credits===c?'on':''}" data-credits="${c}">${c}</button>`).join('')}<button class="${![12,15,18].includes(p.credits)?'on':''}" data-other="1">${![12,15,18].includes(p.credits)?p.credits:'Other'}</button></div>
          <div class="sb-other ${(state.otherOpen||![12,15,18].includes(p.credits))?'':'is-hidden'}" id="otherRow"><span>Other amount</span><button class="step" data-cred="-1" aria-label="One fewer credit hour">${icon('minus')}</button><input id="creditsNum" type="number" min="1" max="21" inputmode="numeric" value="${p.credits}" aria-label="Credit hours"><button class="step" data-cred="1" aria-label="One more credit hour">${icon('plus')}</button><span class="sb-muted">1 to 21. Full time is 12.</span></div></div>
        <div class="sb-two">
          <div class="sb-field"><label class="sb-label" for="earliest">Earliest class</label><div class="sb-time"><input type="time" id="earliest" value="${p.earliest||''}" step="300"><div class="presets">${earlyPresets.map(t=>`<button class="${p.earliest===t?'on':''}" data-time="earliest" data-val="${t}">${S.fmt(t).replace(':00','')}</button>`).join('')}</div></div></div>
          <div class="sb-field"><label class="sb-label" for="latest">Latest class ends</label><div class="sb-time"><input type="time" id="latest" value="${p.latest||''}" step="300" placeholder="No limit"><div class="presets"><button class="${!p.latest?'on':''}" data-time="latest" data-val="">None</button>${latePresets.map(t=>`<button class="${p.latest===t?'on':''}" data-time="latest" data-val="${t}">${S.fmt(t).replace(':00','')}</button>`).join('')}</div></div></div>
        </div>
        <div class="sb-field"><label class="sb-label">Days available <small>tap a day to remove it</small></label><div class="sb-days">${S.DAY_ORDER.map(d=>`<button class="sb-day ${p.daysOff.includes(d)?'':'on'}" data-day="${d}" aria-pressed="${!p.daysOff.includes(d)}">${S.DAY[d]}</button>`).join('')}</div></div>
        <div class="sb-field">
          <label class="sb-label">Blocked times <small>tap an hour you can't take class</small></label>
          ${week([], {editable:true})}
          <div class="sb-sync"><button class="sw ${p.workSync!==false?'on':''}" role="switch" aria-checked="${p.workSync!==false}" id="workSync" aria-label="Block my work hours from Workday"></button><div><b>Block my work hours from Workday</b><span>${w.label} · ${w.days.map(d=>S.DAY[d]).join('/')} ${S.fmt(w.start)}–${S.fmt(w.end)} · ${w.source}</span></div></div>
          ${(p.blocks||[]).length?`<div class="sb-blocks">${p.blocks.map((b,i)=>`<span class="sb-token">${b.label} · ${b.days.map(d=>S.DAY[d]).join('/')} ${S.fmt(b.start)}–${S.fmt(b.end)}<button data-unblock="${i}" aria-label="Remove">${icon('x-small')}</button></span>`).join('')}</div>`:''}
        </div>
        <div class="sb-field"><label class="sb-label" for="mustInput">Must take this term <small>optional</small></label>
          <div class="sb-prompt"><div class="sb-prompt-box">${p.mustTake.map(c=>`<span class="sb-token">${c}<button data-must="${c}" aria-label="Remove ${c}">${icon('x-small')}</button></span>`).join('')}<input id="mustInput" type="text" placeholder="${p.mustTake.length?'':'Search a course you still need'}" autocomplete="off"><span class="pr">${icon('list')}</span></div>
          <div class="sb-prompt-menu" id="mustMenu" hidden>${courses.filter(n=>!p.mustTake.includes(n.course)).map(n=>`<button data-must="${n.course}" data-title="${n.title}"><b>${n.course}</b> ${n.title} <span>· ${n.req}</span></button>`).join('')||'<div class="sb-muted" style="padding:8px 12px">Everything you need is already in the list.</div>'}</div></div></div>
      </div>
      ${foot('start','needs','Next')}
    </div>`;
  };

  V.needs=()=>{
    const g=gen(); const rec=new Set((g.options[0]?g.options[0].sections:[]).map(s=>s.course));
    const anyFit=c=>D.sections.filter(s=>s.course===c).some(s=>!S.problems(s,state.prefs,D.student,D).length);
    const open=D.flatReqs.filter(i=>i.status==='open');
    const required=open.filter(i=>i.pathway&&!i.nosections);
    const fill=open.filter(i=>!required.includes(i));
    const later=D.flatReqs.filter(i=>i.status==='later'&&i.after&&(reqOf(i.after)||D.requirements.some(gr=>gr.group===i.after)));
    const unlockSoon=later.filter(i=>open.some(o=>o.course===i.after)||i.after==='Pre-Business Core');
    const st=(i)=>{
      if(i.nosections) return status('later','No sections loaded in this demo');
      const secs=D.sections.filter(s=>s.course===i.course);
      if(rec.has(i.course)) return status('ok','In your recommended schedule');
      if(anyFit(i.course)){ const s0=secs.find(x=>!S.problems(x,state.prefs,D.student,D).length); const o=g.options[0]&&g.options[0].sections.find(r=>S.overlap(r,s0)>0); return o?status('warn',`Overlaps ${o.course} by ${S.overlap(o,s0)} min`):status('ok','Fits your times'); }
      if(secs.length&&secs.every(s=>s.seats===0)) return status('warn','Full · waitlist');
      return status('warn',"Doesn't fit your times");
    };
    const row=(i)=>`<div class="sb-req"><div><b>${i.course} · ${i.title}</b><div class="d">${i.group} · ${i.h} cr${i.pathway?` · <span class="sb-tag">Pathway ${i.pathway}</span>`:''}${i.prereq?` · ${S.done(D.student,i.prereq)?icon('check-circle-fill')+'<span>'+i.prereq+' '+((D.student.inProgress||[]).includes(i.prereq)?'in progress':'done')+'</span>':icon('exclamation-circle-fill','miss')+'<span>Needs '+i.prereq+'</span>'}`:''}</div></div>${st(i)}</div>`;
    const reqHrs=sum(required,i=>i.h);
    return `
    ${pageHead('Your '+D.termShort+' Plan','From your degree audit (evaluated 10/21/2026) and the Walton eight-semester pathway. <a href="academics.html#progress">View My Academic Progress</a>','needs')}
    <div class="sb">
      <div class="sb-card">
        <div class="sb-facts four" style="margin-top:0"><div class="sb-fact"><b>${required.length}</b><span>required next · ${reqHrs} credit hours</span></div><div class="sb-fact"><b>${fill.length}</b><span>electives you could add</span></div><div class="sb-fact"><b>${unlockSoon.length}</b><span>unlock after this term</span></div><div class="sb-fact"><b>${D.totalHours-D.student.creditsDone-D.student.creditsInProgress}</b><span>credit hours left of ${D.totalHours}</span></div></div>
        <h3 class="wd-section-h">Required next</h3>
        <p class="sb-muted" style="font-size:13px;margin:-4px 0 8px">What the Walton pathway puts in Year 2 Spring. All prerequisites met.</p>
        ${required.map(row).join('')}
        <h3 class="wd-section-h">Fill in with</h3>
        <p class="sb-muted" style="font-size:13px;margin:-4px 0 8px">Electives you can take now. Pick any to reach your credit hours.</p>
        ${fill.map(row).join('')}
        <h3 class="wd-section-h">After this term</h3>
        <p class="sb-muted" style="font-size:13px;margin:-4px 0 8px">Blocked until a prerequisite is done. Finishing the list above unlocks them for Fall 2027.</p>
        ${unlockSoon.slice(0,8).map(i=>`<div class="sb-req later"><div><b>${i.course} · ${i.title}</b><div class="d">${i.group} · ${i.h} cr</div></div>${status('later','After '+i.after)}</div>`).join('')}
        <h3 class="wd-section-h">Degree worksheet</h3>
        <p class="sb-muted" style="font-size:13px;margin:-4px 0 10px">Every requirement by category. Anything unchecked still stands between you and graduation.</p>
        ${worksheet()}
      </div>
      ${foot('prefs','options','Show my options')}
    </div>`;
  };

  V.options=()=>{
    const g=gen();
    if(!g.options.length){
      const must=state.prefs.mustTake||[];
      return `${pageHead('Schedule Options',null,'options')}<div class="sb"><div class="sb-card"><h2>Nothing fits all of these yet</h2><p class="sub">${must.length>1?`${must.join(' and ')} can't be taken together with your times.`:'Your must-take courses and your times rule each other out.'}</p>${g.hints.map(h=>`<div class="sb-chk">${icon('info')}<span>${h}</span></div>`).join('')}<div class="sb-actions"><a class="wd-btn primary" href="#prefs">Change preferences</a><a class="wd-btn secondary" href="#errors">See what was ruled out</a></div></div></div>`;
    }
    if(state.chosen==null||!state.schedule){ state.chosen=0; state.schedule=g.options[0].sections.map(s=>s.id); save(); }
    const banner = g.relaxed ? `<div class="sb-relaxed">${icon('info')}<div><b>No schedule reaches ${g.target} credit hours with these limits.</b> ${g.hints.join(' ')||'Loosen a preference to open more sections.'} <a href="#prefs">Change preferences</a></div></div>` : '';
    const rows=g.options.map((o,i)=>{
      const mine=g.catches.filter(c=>o.sections.some(s=>s.course===c.sec.course));
      const sel=state.chosen===i;
      return `<tr class="${sel?'is-sel':''}" data-row="${i}">
        <td class="c"><input type="radio" name="opt" id="opt${i}" ${sel?'checked':''} data-choose="${i}" aria-label="Select ${o.label}"></td>
        <td><label for="opt${i}"><b>${o.label}</b></label><div class="sb-muted">${o.note}</div></td>
        <td class="num">${o.credits}</td>
        <td>${o.sections.map(s=>`<a href="#" data-detail="${s.id}">${s.course}-${s.section} - ${s.title}</a>`).join('')}</td>
        <td class="c">${mine.length?`<button class="sb-hazard" data-flag="${i}" aria-expanded="false" aria-label="${mine.length} sections ruled out">${icon('exclamation-triangle-fill')}<b>${mine.length}</b></button>`:'<span class="sb-muted">0</span>'}</td>
        <td><button class="wd-select" data-cal="${i}">${icon('calendar')} View Calendar</button></td>
      </tr>
      <tr class="flagrow" id="flag${i}" hidden><td></td><td colspan="5"><div class="sb-flag-list" style="margin:0"><div class="hd">Ruled out for this option</div>${mine.map(c=>`<div class="sb-flag-row"><b>${c.sec.course}-${c.sec.section}</b> ${c.problems.map(x=>x.text).join(' ')} <i>${c.problems[0].fix}</i></div>`).join('')}</div></td></tr>`;
    }).join('');
    const cur=schedule(); const curOpt=g.options[state.chosen]||null; const credits=cur.reduce((a,s)=>a+s.credits,0);
    const p=state.prefs; const blocks=S.allBlocks(p,D);
    return `
    ${pageHead(g.relaxed?'Closest Schedule Options':'Schedule Options',null,'options')}
    <div class="sb-wide">
      <div class="wd-kvrow" style="margin:0 0 8px;max-width:760px"><b>Academic Period</b><span>${state.term||D.term}</span><b>Preferences</b><span>${p.earliest?`Nothing before ${S.fmt(p.earliest)}`:'Any start'}${p.latest?`, nothing after ${S.fmt(p.latest)}`:''} · ${p.daysOff.length?p.daysOff.map(d=>S.DAY[d]).join('/')+' unavailable':'All days'} · ${blocks.map(b=>b.label).join(', ')||'No blocked time'} · ${p.credits} credit hours &nbsp;<a href="#prefs">Edit</a></span></div>
      ${banner}
      <div class="wd-toolbar"><span class="count">Options <small>${g.options.length} items</small></span>${icon('export')}${icon('filter')}${icon('expand-table')}<span class="seg"><span class="on">${icon('grid-view')}</span><span>${icon('list-view')}</span></span></div>
      <table class="wd-table sb-opt-table">
        <thead><tr><th style="width:44px"></th><th style="width:26%">Option</th><th class="num" style="width:80px">Credit Hours</th><th>Course Sections</th><th style="width:90px">Ruled Out</th><th style="width:170px">Calendar</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <section class="sb-spread" aria-label="How picks are spread">
        <div class="hd">${icon('users')}<div><b>Not everyone gets the same schedule</b><span>Students with the same requirements would all be pushed into one section and fill it in minutes. The builder prevents that three ways.</span></div></div>
        <ol>
          <li><b>Seats left decide the section.</b> When two sections of a course both fit, the one with more open seats ranks higher.</li>
          <li><b>Ties break per student.</b> Equal options are ordered by a per-student draw, so two Finance sophomores with identical records see different first picks.</li>
          <li><b>Seat counts are live on every row.</b> You see them before you choose, and tight sections are flagged.</li>
        </ol>
        <div class="seats">${(curOpt?curOpt.sections:[]).map(s=>{const alts=D.sections.filter(x=>x.course===s.course&&x.id!==s.id);return `<span class="${s.seats<=3?'low':''}"><b>${s.course}-${s.section}</b> ${s.seats===0?'full':s.seats+' seats'}${alts.length?` <i>· ${alts.map(a=>'§'+a.section+' '+(a.seats===0?'full':a.seats)).join(', ')}</i>`:''}</span>`}).join('')}</div>
      </section>
      <p class="sb-muted" style="font-size:13px;margin:10px 0 0">${g.catches.length} sections were ruled out in total; <a href="#errors">see every one in plain words</a>.</p>

      <h3 class="wd-section-h" style="margin-top:32px">Selected: ${curOpt?curOpt.label:'Custom'} · ${credits} credit hours</h3>
      <div class="wd-btn-row" style="margin:0 0 16px"><button class="wd-btn secondary sm" data-cal="cur">${icon('calendar')} Calendar View</button><button class="wd-btn secondary sm" data-go="swap-list">Swap a class</button></div>
      <div class="wd-toolbar"><span class="count">Courses <small>${cur.length} items</small></span>${icon('export')}${icon('filter')}${icon('expand-table')}</div>
      <div style="overflow-x:auto"><table class="wd-table sb-courses">
        <thead><tr><th>Course</th><th class="num" style="width:60px">Units</th><th>Section</th><th style="width:90px">Section Status</th><th>Instructor</th><th>Meeting Patterns</th><th>Fills</th></tr></thead>
        <tbody>${cur.map(s=>`<tr><td><a href="#" data-detail="${s.id}">${s.course} - ${s.title}</a></td><td class="num">${s.credits}</td><td><a href="#" data-detail="${s.id}">${s.course}-${s.section} - ${s.title}</a></td><td>${s.seats===0?'Closed':'Open'}${s.seats>0&&s.seats<=3?`<div class="sb-muted">${s.seats} seats</div>`:''}</td><td><a href="#">${s.instructor}</a></td><td>${S.dayList(s.days)} | ${S.fmt(s.start)} - ${S.fmt(s.end)} | ${s.room}</td><td>${s.fills}</td></tr>`).join('')}</tbody>
      </table></div>
      ${foot('needs','review','Review and confirm')}
    </div>`;
  };

  function openCalendar(secs, title){
    const sc=document.getElementById('scrim');
    sc.innerHTML=`<div class="wd-dialog" role="dialog" aria-modal="true" aria-label="View as Course Calendar"><div class="wd-dialog-head">View as Course Calendar<button class="x" id="calClose" aria-label="Close">${icon('x')}</button></div><div class="wd-dialog-body"><a href="#" class="wd-cal-name">${D.student.name} (${DEMO_STUDENT.id})</a><div class="wd-cal-sub">${title||''} · ${D.term}</div><div class="wd-cal-today"><span class="wd-chip">Today</span></div><div class="wd-cal-scroll">${week(secs,{grey:true})}</div></div></div>`;
    sc.classList.add('open');
  }

  V.swap=()=>{
    const cur=schedule();
    const target = state.swapping ? secById(state.swapping) : null;
    if(!target){
      return `${pageHead('Swap a Class','Pick the class to change. The other '+(cur.length-1)+' stay put.','swap')}<div class="sb"><div class="sb-card">${cur.map(s=>classRow(s)).join('')}</div>${foot('options',null)}</div>`;
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
      return `<div class="sb-alt ${issues.length?'bad':''}"><div class="t"><b>${s.course}-${s.section} · ${s.title}</b><span>${S.dayList(s.days)} · ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.credits} cr · ${s.instructor} · ${seatsText(s)} · Fills ${s.fills}</span>${issues.length?`<span class="no ${crit?'crit':''}">${issues.join(' ')}</span>`:''}</div>${!issues.length?`<button class="wd-btn primary sm" data-swapto="${s.id}">Use this</button>`:canWait?`<button class="wd-btn secondary sm" data-waitlist="${s.id}">Waitlist</button>`:''}</div>`;
    };
    return `
    ${pageHead('Swap '+target.course+'-'+target.section, target.title+' · '+S.dayList(target.days)+' '+S.fmt(target.start)+'–'+S.fmt(target.end)+'. The other '+others.length+' classes stay put.','swap')}
    <div class="sb">
      <div class="sb-card">
        ${week(cur,{mini:true,hl:target.id})}
        <h3 class="wd-section-h">Other sections of ${target.course}</h3>
        ${sameCourse.length?sameCourse.map(alt).join(''):'<p class="sb-muted">No other sections this term.</p>'}
        ${sameReq.length?`<h3 class="wd-section-h">Other courses that fill ${target.fills}</h3>${sameReq.map(alt).join('')}`:''}
        ${laterReq.length&&/FINN/.test(target.course)?`<h3 class="wd-section-h">Finance courses that open after ${target.course}</h3>${laterReq.map(alt).join('')}`:''}
        <h3 class="wd-section-h">Or drop it</h3>
        <div class="sb-alt"><div class="t"><b>Leave ${target.course} for next term</b><span>Schedule becomes ${cur.reduce((a,s)=>a+s.credits,0)-target.credits} credit hours.</span></div><button class="wd-btn secondary sm" data-drop="${target.id}">Drop</button></div>
      </div>
      ${foot('swap-list',null,null,null,`<button class="wd-btn primary" data-go="review">Done</button>`)}
    </div>`;
  };

  function checks(cur){
    const credits=cur.reduce((a,s)=>a+s.credits,0);
    const issues=S.check(cur,state.prefs,D);
    const low=cur.filter(s=>s.seats<=5);
    return [
      {ok:true,t:'No holds',d:'Nothing on your account blocks registration.'},
      {ok:credits>=12,t:`${credits} credit hours`,d:credits>=12?'Full-time status kept.':'Below the 12 needed for full-time. Financial aid may be affected.'},
      {ok:!issues.some(i=>i.code==='conflict'),t:issues.some(i=>i.code==='conflict')?'Time conflict':'No time conflicts',d:issues.filter(i=>i.code==='conflict').map(i=>i.text).join(' ')||`Nothing before ${S.fmt(state.prefs.earliest)}, nothing on unavailable days or during blocked time.`},
      {ok:!issues.some(i=>i.code==='prereq'),t:'Prerequisites met',d:cur.filter(s=>s.prereq).map(s=>`${s.prereq} ${(D.student.inProgress||[]).includes(s.prereq)?'in progress':'done'} for ${s.course}`).join(', ')||'None of these classes has a prerequisite.'},
      {ok:!low.length,warn:!!low.length,t:low.length?`Seats: ${low.map(s=>`${s.seats} left in ${s.course}-${s.section}`).join(', ')}`:'Seats open in every section',d:low.length?'Register when your appointment opens to keep them.':cur.map(s=>`${s.seats} in ${s.course}-${s.section}`).join(', ')},
    ];
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
    ${pageHead('Review and Confirm', cur.length+' sections · '+credits+' credit hours · '+D.termShort+'. Nothing happens until you confirm.','review')}
    <div class="sb">
      <div class="sb-card">
        ${week(cur)}
        <h3 class="wd-section-h">What's left after this term</h3>
        <div class="sb-left">
          <div class="tot"><div><b>${leftAfter}</b><span>hours left of ${tot}</span></div><div><b>${credits}</b><span>hours this term</span></div><div><b>${unlocks.length}</b><span>requirements unlocked</span></div></div>
          <table class="wd-table sb-lefttable"><thead><tr><th>Category</th><th class="num">Left now</th><th class="num">This term</th><th class="num">Left after</th></tr></thead><tbody>${rows.map(({g,s})=>`<tr class="${s.leftAfter===0?'ok':''}"><td>${g.group}</td><td class="num">${s.left}</td><td class="num">${s.planned?'−'+s.planned:'–'}</td><td class="num">${s.leftAfter===0?icon('check-small'):s.leftAfter}</td></tr>`).join('')}</tbody></table>
          ${unlocks.length?`<p class="sb-muted" style="font-size:13px;margin:10px 0 0">This schedule unlocks <b>${unlocks.join(', ')}</b> for Fall 2027.</p>`:''}
        </div>
        <h3 class="wd-section-h">Checks</h3>
        <div class="sb-checks">${checks(cur).map(c=>`<details class="sb-chk ${c.ok?'ok':c.warn?'warn':'bad'}"><summary>${icon(c.ok?'check-circle-fill':c.warn?'exclamation-triangle-fill':'exclamation-circle-fill')}<span>${c.t}</span>${icon('chevron-down-small','chev')}</summary><p>${c.d}</p></details>`).join('')}</div>
        <div class="sb-actions">
          <button class="wd-btn primary" id="registerBtn" ${issues.length?'disabled':''}>Register</button>
          <button class="wd-btn secondary" id="advisorBtn">Send to my advisor</button>
          <button class="wd-btn secondary" id="saveBtn">Save schedule</button>
        </div>
        <p class="sb-muted" style="font-size:13px;margin:16px 0 0">Registration opens ${D.registrationOpens}. Register saves this as your plan and submits it when your appointment opens, after you confirm.</p>
      </div>
      ${foot('options',null,null,null,`<button class="wd-btn secondary" data-go="swap-list">Swap a class</button>`)}
    </div>`;
  };

  V.errors=()=>{
    const g=gen();
    return `
    ${pageHead('Ruled Out, in Plain Words','Workday says "You are not eligible." The builder says what\'s wrong and what to do.','errors')}
    <div class="sb">
      <div class="sb-card">
        ${g.catches.map(c=>catchCard(c,true)).join('')}
      </div>
      ${foot('options',null,null,null,`<button class="wd-btn primary" data-go="options">Back to options</button>`)}
    </div>`;
  };

  V.done=()=>{
    const cur=schedule(); const credits=cur.reduce((a,s)=>a+s.credits,0);
    return `
    ${pageHead('Registration Submitted',null,'done')}
    <div class="sb">
      <div class="sb-card sb-success">
        <div class="hd">${icon('check-circle-fill')}<div><h2>Success! You're registered for ${D.termShort}.</h2><p class="sub">All ${cur.length} sections went through. ${credits} credit hours. Seats are held in your name. Nothing else to do today.</p></div></div>
        <div class="sb-kv"><b>Confirmation</b><span>WD-${String(Date.now()).slice(-6)} · copy in your Workday inbox and ${D.student.name.split(' ')[0].toLowerCase()}@uark.edu</span><b>Student</b><span>${D.student.name} (${DEMO_STUDENT.id}) · ${D.student.majors.map(m=>m.name).join(' & ')}</span><b>Academic Period</b><span>${D.term}</span><b>Submitted</b><span>${new Date().toLocaleString('en-US',{month:'2-digit',day:'2-digit',year:'numeric',hour:'numeric',minute:'2-digit'})}</span><b>Add/Drop until</b><span>${D.addDropUntil} · swap or drop anything before then with no record</span></div>
        <div class="sb-actions" style="margin-top:20px"><a class="wd-btn primary" href="academics.html#courses">View My Registered Classes</a><a class="wd-btn secondary" href="saved-schedules.html?saved=1">View My Saved Schedules</a><a class="wd-btn secondary" href="builder.html#start" data-newplan="1">Build Another Schedule</a></div>
        <h3 class="wd-section-h">Registered Sections</h3>
        <div class="sb-done-list">${cur.map(s=>`<div class="r"><span class="sw ${COLORS[s.course]}"></span><b>${s.course}-${s.section}</b><span>${s.title}</span><em>${S.dayList(s.days)} ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.room}</em></div>`).join('')}</div>
        <div class="wd-btn-row" style="margin:0 0 8px"><button class="wd-btn secondary sm" data-cal="cur">${icon('calendar')} Calendar View</button><button class="wd-btn secondary sm" id="calBtn">${icon('export')} Add to Google, Outlook or Apple Calendar</button></div>
        <h3 class="wd-section-h">Up Next</h3>
        <div class="sb-upnext">
          <div class="r"><b>Tuition statement</b><span>Posts to Financials Hub about 01/05/2027, due 01/19/2027. Financial aid is applied first.</span><a class="wd-btn secondary sm" href="index.html">Financials Hub</a></div>
          <div class="r"><b>Tell your advisor</b><span>Send ${D.student.advisor.name} your registered schedule and the reasons behind each pick.</span><button class="wd-btn secondary sm" id="advisorBtn">Send to my advisor</button></div>
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
    const ev=secs.map(s=>{const f=firstMeeting(s);return ['BEGIN:VEVENT',`UID:${s.id.replace(/\s/g,'')}-${D.termStart}@workday-builder`,`DTSTAMP:${stamp(new Date(),'12:00')}`,`DTSTART;TZID=America/Chicago:${stamp(f,s.start)}`,`DTEND;TZID=America/Chicago:${stamp(f,s.end)}`,`RRULE:FREQ=WEEKLY;BYDAY=${S.splitDays(s.days).map(d=>ICS_DAY[d]).join(',')};UNTIL=${end}`,`SUMMARY:${s.course}-${s.section} ${s.title}`,`LOCATION:${s.room}`,`DESCRIPTION:${s.instructor} · ${s.credits} credit hours · Fills ${s.fills}`,'END:VEVENT'].join('\r\n');}).join('\r\n');
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
    sc.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><button class="x" id="closeSheet" aria-label="Close">${icon('x')}</button><h3>Send to my advisor</h3><div class="sb-to"><span class="av">${a.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</span><div><b>${a.name}</b><span>${a.title} · ${a.office}</span><span>${a.email}</span></div></div><label class="sb-label" for="advSubject">Subject</label><input class="sb-input" id="advSubject" value="${D.termShort} schedule draft · ${D.student.name}"><label class="sb-label" for="advNote" style="margin-top:12px">Message</label><textarea class="sb-textarea" id="advNote" style="min-height:260px">${advisorNote(cur)}</textarea><p class="sb-muted" style="font-size:12px;margin:8px 0 0">Your draft schedule and the reasons for each pick are attached. ${a.first.split(' ')[0]} can comment or approve from Workday.</p><div class="wd-btn-row" style="margin-top:16px"><button class="wd-btn primary" id="sendAdvisor">Send</button><button class="wd-btn secondary" id="cancelDlg">Cancel</button></div></div>`;
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
    scrim.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><button class="x" id="closeSheet" aria-label="Close">${icon('x')}</button><h3>${s.course}-${s.section} · ${s.title}</h3><p class="sub">${S.dayList(s.days)} · ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.room} · ${s.instructor}</p><div class="whybox"><b>Why it's here</b>${S.why(s,D.student,state.ai?'ai':'rules')}</div><dl><dt>Fills</dt><dd>${s.fills}</dd><dt>Prerequisite</dt><dd>${s.prereq?`${s.prereq} · ${S.done(D.student,s.prereq)?((D.student.inProgress||[]).includes(s.prereq)?'in progress':'done'):'<b style="color:#b3261e">not done</b>'}`:'None'}</dd><dt>Seats</dt><dd>${seatsText(s)}</dd><dt>Credit hours</dt><dd>${s.credits}</dd></dl><div class="wd-btn-row">${inSched?`<button class="wd-btn primary" data-swapfor="${s.id}">Swap this class</button>`:''}<button class="wd-btn secondary" id="closeSheet2">Close</button></div></div>`;
    scrim.classList.add('open');
  }
  function closeSheet(){ const sc=document.getElementById('scrim'); sc.classList.remove('open'); sc.innerHTML=''; }
  function setCredits(n){ n=Math.max(1,Math.min(21,n|0)); if(n===state.prefs.credits){ render(true); return; } state.prefs.credits=n; resetPicks(); save(); render(true); }
  function setTime(which,val){ if(val&&!/^\d{2}:\d{2}$/.test(val)) return; state.prefs[which]=val||''; if(which==='latest'&&val&&state.prefs.earliest&&S.mins(val)<=S.mins(state.prefs.earliest)){ toast('Latest has to be after earliest.'); state.prefs[which]=''; } resetPicks(); save(); render(true); }

  document.addEventListener('click',e=>{
    const t=e.target.closest('.cell,[data-flag],[data-go],[data-credits],[data-other],[data-cred],[data-time],[data-day],[data-must],[data-unblock],#workSync,[data-cal],#calClose,[data-newplan],[data-choose],[data-detail],[data-sec],[data-swapto],[data-swapfor],[data-drop],[data-waitlist],[data-use],#applySentence,#registerBtn,#advisorBtn,#saveBtn,#calBtn,#closeSheet,#closeSheet2,#aiToggle,#confirmReg,#cancelDlg,#sendAdvisor');
    if(!t) { if(e.target.id==='scrim') closeSheet(); return; }
    const p=state.prefs;
    if(t.classList.contains('cell')){ toggleBlock(t.dataset.cellday,+t.dataset.hour); return; }
    if(t.dataset.cal!==undefined){ e.preventDefault(); const g=gen(); if(t.dataset.cal==='cur'){ openCalendar(schedule(),'Selected schedule'); } else { const o=g.options[+t.dataset.cal]; openCalendar(o.sections,o.label); } return; }
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
    if(t.id==='workSync'){ p.workSync=!(p.workSync!==false); resetPicks(); save(); render(true); toast(p.workSync?'Work hours blocked from Workday.':'Work hours no longer blocked. Options rebuilt.'); return; }
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
    if(t.id==='registerBtn'){ const cur=schedule(); const sc=document.getElementById('scrim'); sc.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><h3>Register ${cur.length} sections for ${D.termShort}?</h3><p class="sub">${cur.map(s=>s.course+'-'+s.section).join(', ')} · ${cur.reduce((a,s)=>a+s.credits,0)} credit hours</p><p style="font-size:14px;line-height:20px;margin:0 0 16px">This is the only step that changes your registration. You can drop or swap until ${D.addDropUntil}.</p><div class="wd-btn-row"><button class="wd-btn primary" id="confirmReg">Confirm and register</button><button class="wd-btn secondary" id="cancelDlg">Cancel</button></div></div>`; sc.classList.add('open'); return; }
    if(t.id==='confirmReg'){ closeSheet(); const cur=schedule(); try{ let saved=JSON.parse(localStorage.getItem('sb-saved')||'[]'); saved=saved.filter(x=>!x.registered); saved.unshift({name:`${D.termShort}`, registered:true, sections:cur.map(s=>`${s.course}-${s.section} - ${s.title.toUpperCase()}`), alerts:0, credits:cur.reduce((a,s)=>a+s.credits,0)}); localStorage.setItem('sb-saved',JSON.stringify(saved.slice(0,3))); }catch(e){} go('done'); return; }
  });
  document.addEventListener('focusin',e=>{ if(e.target.id==='mustInput'){ const m=document.getElementById('mustMenu'); if(m) m.hidden=false; } });
  document.addEventListener('input',e=>{ if(e.target.id==='mustInput'){ const q=e.target.value.toLowerCase(); const m=document.getElementById('mustMenu'); if(!m) return; m.hidden=false; m.querySelectorAll('button').forEach(b=>{ b.hidden=!(b.textContent.toLowerCase().includes(q)); }); } });
  document.addEventListener('click',e=>{ const m=document.getElementById('mustMenu'); if(m && !e.target.closest('.sb-prompt')) m.hidden=true; });
  document.addEventListener('change',e=>{
    if(e.target.id==='earliest'||e.target.id==='latest'){ setTime(e.target.id,e.target.value); }
    if(e.target.id==='creditsNum'){ setCredits(+e.target.value); }
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeSheet(); if(e.key==='Enter'&&e.target.id==='creditsNum'){ setCredits(+e.target.value); } if(e.key==='Enter'&&e.target.id==='sentence'&&!e.shiftKey){ e.preventDefault(); document.getElementById('applySentence')?.click(); } });
  function toggleBlock(day,hour){
    const p=state.prefs; const h0=String(hour).padStart(2,'0')+':00', h1=String(hour+1).padStart(2,'0')+':00';
    // the Workday work block is managed by its toggle, not by taps
    const w=D.student.work; if(p.workSync!==false && w.days.includes(day) && S.mins(w.start)<=hour*60 && S.mins(w.end)>hour*60){ toast('That hour comes from your Workday work schedule. Use the toggle below the grid to change it.'); return; }
    const hit=p.blocks.findIndex(b=>b.days.includes(day)&&S.mins(b.start)<=hour*60&&S.mins(b.end)>hour*60);
    if(hit>=0){
      const b=p.blocks[hit]; const before={label:b.label,days:[day],start:b.start,end:h0}, after={label:b.label,days:[day],start:h1,end:b.end};
      b.days=b.days.filter(d=>d!==day); const out=[]; if(S.mins(before.end)>S.mins(before.start)) out.push(before); if(S.mins(after.end)>S.mins(after.start)) out.push(after);
      p.blocks=[...p.blocks.filter(x=>x.days.length),...out];
    } else {
      const adj=p.blocks.find(b=>b.days.length===1&&b.days[0]===day&&(b.end===h0||b.start===h1));
      if(adj){ if(adj.end===h0) adj.end=h1; else adj.start=h0; } else p.blocks.push({label:'Blocked',days:[day],start:h0,end:h1});
    }
    resetPicks(); save(); render(true);
  }

  // ---------- boot ----------
  renderShell({active:'student',footer:false});
  document.getElementById('rail').outerHTML=renderRail('builder');
  function termPill(){ document.getElementById('termPill').innerHTML=icon('calendar')+'<span>'+(state.term||D.terms[0]).replace(/\s*\(.*$/,'').replace('UAF ','')+'</span>'+icon('caret-down-small'); }
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
