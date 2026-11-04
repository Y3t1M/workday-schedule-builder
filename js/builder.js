/* Schedule Builder UI. Screens are hash-routed:
   #start #prefs #needs #options #swap #review #errors (#done after registering) */
(function(){
  const D=SB_DATA, S=SB;
  const STEPS=[['start','Start'],['prefs','Preferences'],['needs','What you need'],['options','Options'],['review','Review']];
  const COLORS={}; D.needs.forEach((n,i)=>COLORS[n.course]='c'+((i%6)+1));

  // ---------- state ----------
  const qs=new URLSearchParams(location.search);
  let state=load();
  function load(){
    try{ const s=JSON.parse(sessionStorage.getItem('sb-state')||'null'); if(s&&s.v===3) return s; }catch(e){}
    let ai=false; try{ ai=localStorage.getItem('sb-ai')==='on'; }catch(e){}
    return {v:3, prefs:JSON.parse(JSON.stringify(D.defaultPrefs)), chosen:null, schedule:null, ai, swapping:null, term:D.terms[0]};
  }
  function save(){ try{ sessionStorage.setItem('sb-state',JSON.stringify(state)); }catch(e){} }
  if(qs.get('demo')){ // mockup mode: preload a chosen schedule so any step renders
    state.ai = qs.get('ai')==='on';
    const g=S.generate(state.prefs,D); if(g.options[0]){ state.chosen=0; state.schedule=g.options[0].sections.map(s=>s.id); }
    if(qs.get('swap')) state.swapping=qs.get('swap');
  }
  const secById=id=>D.sections.find(s=>s.id===id);
  const schedule=()=> (state.schedule||[]).map(secById).filter(Boolean);
  const gen=()=>S.generate(state.prefs,D);
  const resetPicks=()=>{ state.chosen=null; state.schedule=null; };

  // ---------- helpers ----------
  function route(){ return location.hash.replace('#','')||'start'; }
  function go(h){ location.hash=h; }
  function stepsBar(cur){
    const idx=STEPS.findIndex(s=>s[0]===cur);
    const map={swap:3,errors:3,done:4};
    const at= idx>=0?idx:(map[cur]??0);
    const pct=Math.round(((at)/(STEPS.length-1))*100);
    return `<div class="sb-prog" role="group" aria-label="Progress"><div class="sb-prog-meta"><span>Step ${at+1} of ${STEPS.length}</span><b>${STEPS[at][1]}</b></div><div class="sb-prog-track"><div class="sb-prog-fill" style="width:${pct}%"></div></div><ol class="sb-prog-steps">${STEPS.map((s,i)=>`<li class="${i<at?'done':i===at?'now':''}">${i<at?icon('check-small'):''}<span>${s[1]}</span></li>`).join('')}</ol></div>`;
  }
  function foot(back,next,nextLabel,hint,extra){
    return `<div class="sb-foot">${back?`<button class="wd-btn secondary" data-go="${back}">Back</button>`:''}${hint?`<span class="hint">${hint}</span>`:''}<div class="right">${extra||''}${next?`<button class="wd-btn primary" data-go="${next}" id="nextBtn">${nextLabel||'Next'}</button>`:''}</div></div>`;
  }
  function week(secs, opts){
    opts=opts||{};
    const start=8, hours=12, mini=opts.mini;
    const off=state.prefs.daysOff||[];
    const times=Array.from({length:hours},(_,i)=>{const h=start+i;return `<span>${h%12||12}${mini?'':(h<12?' AM':' PM')}</span>`}).join('');
    const cols=S.DAY_ORDER.map(d=>{
      let evs='';
      (state.prefs.blocks||[]).forEach(b=>{ if(b.days.includes(d)) evs+=ev({start:b.start,end:b.end},'block',`<b>${b.label}</b>`); });
      (secs||[]).forEach(s=>{ if(S.splitDays(s.days).includes(d)){ const cls=(COLORS[s.course]||'c1')+(opts.hl===s.id?' hl':''); evs+=ev(s,cls,`<b>${s.course}</b><i>${s.room}</i>`,s.id); } });
      if(opts.editable){ for(let i=0;i<hours;i++){ const h=start+i; const blk=(state.prefs.blocks||[]).some(b=>b.days.includes(d)&&S.mins(b.start)<=h*60&&S.mins(b.end)>h*60); evs+=`<span class="cell ${blk?'blk':''}" data-day="${d}" data-hour="${h}" style="top:${i*100/hours}%;height:${100/hours}%"></span>`; } }
      return `<div class="col ${off.includes(d)?'off':''}">${evs}</div>`;
    }).join('');
    function ev(s,cls,inner,id){ const top=(S.mins(s.start)-start*60)/(hours*60)*100, h=(S.mins(s.end)-S.mins(s.start))/(hours*60)*100; return `<div class="ev ${cls}" ${id?`data-sec="${id}"`:''} style="top:${top}%;height:${h}%">${inner}</div>`; }
    return `<div class="sb-week ${mini?'mini':''}" style="--hours:${hours}"><div></div>${S.DAY_ORDER.map(d=>`<div class="dh ${off.includes(d)?'off':''}">${S.DAY[d]}</div>`).join('')}<div class="times">${times}</div>${cols}</div>`;
  }
  const seatsText=s=> s.seats===0?'Full, waitlist open': s.seats===1?'1 seat left': s.seats+' seats left';
  function classRow(s){
    const pre = s.prereq?` · ${s.prereq} done`:'';
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
  const status=(kind,text)=>`<span class="sb-status ${kind}">${icon(kind==='ok'?'check-circle-fill':kind==='warn'?'exclamation-triangle-fill':kind==='later'?'clock':'exclamation-circle-fill')}<span>${text}</span></span>`;

  // ---------- screens ----------
  const V={};
  V.start=()=>`
    ${stepsBar('start')}
    <div class="sb">
      <div class="sb-card">
        <h2>Registration for ${D.termShort}</h2>
        <p class="sub">Term is set from your registration appointment. Opens ${D.registrationOpens}.</p>
        <p class="sb-lead">The builder reads your degree audit, takes the times you want, and gives you three schedules that fit. You pick one, swap anything, and confirm. Nothing registers until you say so.</p>
        <div class="sb-facts">
          <div class="sb-fact"><b>${D.student.creditsDone}</b><span>credits done</span></div>
          <div class="sb-fact"><b>${D.needs.filter(n=>!n.later).length}</b><span>requirements open</span></div>
          <div class="sb-fact"><b>${D.student.program.split(' ')[0]}</b><span>${D.student.year} · ${D.student.program.replace(/^\S+\s/,'')}</span></div>
        </div>
        <div class="sb-note">${icon('lock')}<span>Uses your own record: degree audit, completed courses and this term's sections. It never touches financial data.</span></div>
      </div>
      ${foot(null,'prefs','Build my schedule','About 2 minutes')}
    </div>`;

  V.prefs=()=>{
    const p=state.prefs;
    const courses=D.needs.filter(n=>!n.later);
    const hours=['08:00','09:00','10:00','11:00','12:00'];
    const lates=['','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
    return `
    ${stepsBar('prefs')}
    <div class="sb">
      <div class="sb-card">
        <h2>What do you want?</h2>
        <p class="sub">We only drop sections that break these. Everything else stays on the table.</p>
        ${state.ai?`<div class="sb-ai-box"><label class="sb-label" for="sentence">${icon('sparkle')}Describe it <small>plain English, optional</small></label><div class="row"><textarea class="sb-textarea" id="sentence" placeholder="e.g. No classes before 10, done by 4, Fridays off, I work Tuesday and Thursday afternoons, 16 hours">${p.sentence||''}</textarea><button class="wd-btn secondary sm" id="applySentence">Apply</button></div><div class="sb-parsed" id="parsed"></div></div>`:''}
        <div class="sb-field"><label class="sb-label" for="creditsNum">Credit hours this term</label>
          <div class="sb-credits"><button class="step" data-cred="-1" aria-label="One fewer credit">${icon('minus')}</button><input id="creditsNum" type="number" min="1" max="21" inputmode="numeric" value="${p.credits}"><button class="step" data-cred="1" aria-label="One more credit">${icon('plus')}</button><span class="quick">${[12,15,18].map(c=>`<button class="${p.credits===c?'on':''}" data-credits="${c}">${c}</button>`).join('')}</span></div>
          <p class="sb-muted" style="font-size:13px;margin:6px 0 0">Full time is 12 or more. Your open requirements include 1- and 2-hour classes, so any number works.</p></div>
        <div class="sb-two">
          <div class="sb-field"><label class="sb-label" for="earliest">Earliest class</label><select class="sb-select" id="earliest">${hours.map(t=>`<option value="${t}" ${p.earliest===t?'selected':''}>${S.fmt(t)}</option>`).join('')}</select></div>
          <div class="sb-field"><label class="sb-label" for="latest">Latest class ends</label><select class="sb-select" id="latest">${lates.map(t=>`<option value="${t}" ${(p.latest||'')===t?'selected':''}>${t?S.fmt(t):'No limit'}</option>`).join('')}</select></div>
        </div>
        <div class="sb-field"><label class="sb-label">Days off <small>tap to toggle</small></label><div class="sb-days">${S.DAY_ORDER.map(d=>`<button class="sb-day ${p.daysOff.includes(d)?'off':''}" data-day="${d}">${S.DAY[d]}</button>`).join('')}</div></div>
        <div class="sb-field"><label class="sb-label">Blocked times <small>tap hours you can't take class</small></label>${week([], {editable:true})}<div class="sb-legend"><span>${(p.blocks||[]).map(b=>b.label).join(', ')||'Blocked'}</span></div></div>
        <div class="sb-field"><label class="sb-label" for="mustInput">Must take this term <small>optional</small></label>
          <div class="sb-prompt"><div class="sb-prompt-box">${p.mustTake.map(c=>`<span class="sb-token">${c}<button data-must="${c}" aria-label="Remove ${c}">${icon('x-small')}</button></span>`).join('')}<input id="mustInput" type="text" placeholder="${p.mustTake.length?'':'Search a course you still need'}" autocomplete="off"><span class="pr">${icon('list')}</span></div>
          <div class="sb-prompt-menu" id="mustMenu" hidden>${courses.filter(n=>!p.mustTake.includes(n.course)).map(n=>`<button data-must="${n.course}" data-title="${n.title}"><b>${n.course}</b> ${n.title} <span>· ${n.req}</span></button>`).join('')||'<div class="sb-muted" style="padding:10px 12px">Everything you need is already in the list.</div>'}</div></div>
          <p class="sb-muted" style="font-size:13px;margin:6px 0 0">Only courses from your degree audit show here. Picked courses are in every option.</p></div>
      </div>
      ${foot('start','needs','Next')}
    </div>`;
  };

  V.needs=()=>{
    const g=gen(); const fits=new Set((g.options[0]?g.options[0].sections:[]).map(s=>s.course));
    const anyFit=c=>D.sections.filter(s=>s.course===c).some(s=>!S.problems(s,state.prefs,D.student,D).length);
    const rows=D.needs.map(n=>{
      const done=n.prereq?D.student.completed.includes(n.prereq):true;
      const secs=D.sections.filter(s=>s.course===n.course);
      const inRec=fits.has(n.course);
      const clash=(!inRec&&!n.later&&anyFit(n.course))?(()=>{const s=secs.filter(x=>!S.problems(x,state.prefs,D.student,D).length)[0];const o=g.options[0].sections.find(r=>S.overlap(r,s)>0);return o?{o,m:S.overlap(o,s)}:null;})():null;
      let st;
      if(n.later) st=status('later','Not yet');
      else if(inRec) st=status('ok','In your recommended schedule');
      else if(clash) st=status('warn',`Overlaps ${clash.o.course} by ${clash.m} min`);
      else if(anyFit(n.course)) st=status('ok','Fits this term');
      else if(secs.every(s=>s.seats===0)) st=status('warn','Full, waitlist');
      else st=status('warn',"Doesn't fit your times");
      const pre = n.prereq ? (done?`${icon('check-circle-fill')}<span>${n.prereq} done</span>`:`${icon('exclamation-circle-fill','miss')}<span>Needs ${n.prereq} first</span>`) : `<span class="sb-muted">No prerequisite</span>`;
      const cr=secs[0]?secs[0].credits:3;
      return `<div class="sb-req ${n.later?'later':''}"><div><b>${n.req}</b><div class="d">${n.course} · ${n.title} · ${cr} cr &nbsp;·&nbsp; ${pre}</div></div>${st}</div>`;
    }).join('');
    const open=D.needs.filter(n=>!n.later).length, fit=fits.size;
    return `
    ${stepsBar('needs')}
    <div class="sb">
      <div class="sb-card">
        <h2>What you still need</h2>
        <p class="sub">From your degree audit, evaluated 10/21/2026. <a href="academics.html#progress">View My Academic Progress</a></p>
        <div class="sb-facts four" style="margin-top:0"><div class="sb-fact"><b>${open}</b><span>requirements open</span></div><div class="sb-fact"><b>${fit}</b><span>fit together this term</span></div><div class="sb-fact"><b>${D.needs.filter(n=>n.later).length}</b><span>need a prerequisite first</span></div><div class="sb-fact"><b>${120-D.student.creditsDone}</b><span>credits left of 120</span></div></div>
        <div style="margin-top:8px">${rows}</div>
        <div class="sb-note">${icon('info')}<span>Everything here comes from your degree audit and this term's course sections. ${state.ai?'Each pick names the requirement it fills and the prerequisite it meets.':''}</span></div>
      </div>
      ${foot('prefs','options','Show my options')}
    </div>`;
  };

  V.options=()=>{
    const g=gen();
    if(!g.options.length){
      const must=state.prefs.mustTake||[];
      return `${stepsBar('options')}<div class="sb"><div class="sb-card"><h2>Nothing fits all of these yet</h2><p class="sub">${must.length>1?`${must.join(' and ')} can't be taken together with your times.`:'Your must-take courses and your times rule each other out.'}</p>${g.hints.map(h=>`<div class="sb-chk">${icon('info')}<span>${h}</span></div>`).join('')}<div class="sb-actions"><a class="wd-btn primary" href="#prefs">Change preferences</a><a class="wd-btn secondary" href="#errors">See what was ruled out</a></div></div></div>`;
    }
    if(state.chosen==null){ state.chosen=0; state.schedule=g.options[0].sections.map(s=>s.id); save(); }
    const banner = g.relaxed ? `<div class="sb-relaxed">${icon('info')}<div><b>No schedule reaches ${g.target} credit hours with these limits.</b> ${g.hints.join(' ')||'Loosen a preference to open more sections.'} <a href="#prefs">Change preferences</a></div></div>` : '';
    const cards=g.options.map((o,i)=>{
      const mine=g.catches.filter(c=>o.sections.some(s=>s.course===c.sec.course));
      const sel=state.chosen===i;
      return `
      <div class="sb-opt ${sel?'chosen':''}" data-opt="${i}">
        <div class="lbl">
          <span class="radio ${sel?'on':''}" aria-hidden="true"></span>
          <div class="ttl"><h3>${o.label}</h3><span class="cr">${o.credits} credit hours · ${o.sections.length} classes</span></div>
          ${mine.length?`<button class="sb-hazard" data-flag="${i}" aria-expanded="false" aria-label="${mine.length} sections ruled out">${icon('exclamation-triangle-fill')}<b>${mine.length}</b></button>`:''}
        </div>
        ${mine.length?`<div class="sb-flag-list" id="flag${i}" hidden><div class="hd">Ruled out for this schedule</div>${mine.map(c=>`<div class="sb-flag-row"><b>${c.sec.course}-${c.sec.section}</b> ${c.problems.map(x=>x.text).join(' ')} <i>${c.problems[0].fix}</i></div>`).join('')}</div>`:''}
        <p class="note">${o.note}</p>
        ${week(o.sections,{mini:true})}
        <div style="margin-top:12px">${o.sections.map(s=>classRow(s)).join('')}</div>
        <button class="wd-btn ${sel?'primary':'secondary'}" data-choose="${i}">${sel?icon('check-small')+' Selected':'Select this schedule'}</button>
      </div>`;}).join('');
    return `
    ${stepsBar('options')}
    <div class="sb-wide">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px">
        <div><h2 class="wd-section-title">${g.relaxed?(g.options.length===1?'The closest fit':g.options.length+' closest fits'):g.options.length+' schedules that fit'}</h2><p class="sb-muted" style="margin:4px 0 0;font-size:14px">Nothing before ${S.fmt(state.prefs.earliest)}${state.prefs.latest?`, nothing after ${S.fmt(state.prefs.latest)}`:''}, ${state.prefs.daysOff.map(d=>S.DAY[d]).join('/')||'no days'} off, nothing during ${(state.prefs.blocks||[]).map(b=>b.label.toLowerCase()).join(', ')||'blocked time'}. Tap a class to see why it's there.</p></div>
        <a class="wd-btn secondary sm" href="#prefs">Change preferences</a>
      </div>
      ${banner}
      <div class="sb-options">${cards}</div>
      <p class="sb-muted" style="font-size:13px;margin:16px 0 0">${g.catches.length} sections were ruled out across your options. <a href="#errors">See every one in plain words</a>.</p>
      ${foot('needs','review','Review and confirm',null,`<button class="wd-btn secondary" data-go="swap" id="swapBtn">Swap a class</button>`)}
    </div>`;
  };

  V.swap=()=>{
    const cur=schedule();
    const target = state.swapping ? secById(state.swapping) : null;
    if(!target){
      return `${stepsBar('swap')}<div class="sb"><div class="sb-card"><h2>Swap a class</h2><p class="sub">Pick the class to change. The other ${cur.length-1} stay put.</p>${cur.map(s=>classRow(s)).join('')}</div>${foot('options',null)}</div>`;
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
    ${stepsBar('swap')}
    <div class="sb">
      <div class="sb-card">
        <h2>Swap ${target.course}-${target.section}</h2>
        <p class="sub">${target.title} · ${S.dayList(target.days)} ${S.fmt(target.start)}–${S.fmt(target.end)}. The other ${others.length} classes stay where they are.</p>
        ${week(cur,{mini:true,hl:target.id})}
        <h3 class="wd-section-h">Other sections of ${target.course}</h3>
        ${sameCourse.length?sameCourse.map(alt).join(''):'<p class="sb-muted">No other sections this term.</p>'}
        ${sameReq.length?`<h3 class="wd-section-h">Other courses that fill ${target.fills}</h3>${sameReq.map(alt).join('')}`:''}
        ${laterReq.length&&/Finance/.test(target.fills)?`<h3 class="wd-section-h">Finance electives you can take after ${target.course}</h3>${laterReq.map(alt).join('')}`:''}
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
      {ok:!issues.some(i=>i.code==='conflict'),t:issues.some(i=>i.code==='conflict')?'Time conflict':'No time conflicts',d:issues.filter(i=>i.code==='conflict').map(i=>i.text).join(' ')||`Nothing before ${S.fmt(state.prefs.earliest)}, nothing on your days off or during blocked time.`},
      {ok:!issues.some(i=>i.code==='prereq'),t:'Prerequisites met',d:cur.filter(s=>s.prereq).map(s=>`${s.prereq} done for ${s.course}`).join(', ')||'None of these classes has a prerequisite.'},
      {ok:!low.length,warn:!!low.length,t:low.length?`Seats: ${low.map(s=>`${s.seats} left in ${s.course}-${s.section}`).join(', ')}`:'Seats open in every section',d:low.length?'Register when your appointment opens to keep them.':cur.map(s=>`${s.seats} in ${s.course}-${s.section}`).join(', ')},
    ];
  }
  V.review=()=>{
    const cur=schedule(); const credits=cur.reduce((a,s)=>a+s.credits,0);
    const issues=S.check(cur,state.prefs,D);
    return `
    ${stepsBar('review')}
    <div class="sb">
      <div class="sb-card">
        <h2>Preview</h2>
        <p class="sub">This is exactly what will change on your ${D.termShort} registration. Nothing happens until you confirm.</p>
        ${week(cur)}
        <h3 class="wd-section-h">What will change</h3>
        <div class="sb-diff">
          ${cur.map(s=>`<div class="r"><span class="pm">+</span><div><b>Add ${s.course}-${s.section} · ${s.title}</b><span>${S.dayList(s.days)} ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.room} · Fills ${s.fills}</span></div><span class="u">${s.credits} cr</span></div>`).join('')}
          <div class="sb-total"><span>${cur.length} sections</span><span>${credits} credit hours</span></div>
        </div>
        <h3 class="wd-section-h">Checks</h3>
        <div class="sb-checks">${checks(cur).map(c=>`<details class="sb-chk ${c.ok?'ok':c.warn?'warn':'bad'}"><summary>${icon(c.ok?'check-circle-fill':c.warn?'exclamation-triangle-fill':'exclamation-circle-fill')}<span>${c.t}</span>${icon('chevron-down-small','chev')}</summary><p>${c.d}</p></details>`).join('')}</div>
        <div class="sb-actions">
          <button class="wd-btn primary" id="registerBtn" ${issues.length?'disabled':''}>Register</button>
          <button class="wd-btn secondary" id="advisorBtn">Send to my advisor</button>
          <button class="wd-btn secondary" id="saveBtn">Save schedule</button>
        </div>
        <p class="sb-muted" style="font-size:13px;margin:16px 0 0">Registration opens ${D.registrationOpens}. Until then, Register saves this as your plan and submits it when your appointment opens, after you confirm.</p>
      </div>
      ${foot('options',null,null,null,`<button class="wd-btn secondary" data-go="swap-list">Swap a class</button>`)}
    </div>`;
  };

  V.errors=()=>{
    const g=gen();
    return `
    ${stepsBar('errors')}
    <div class="sb">
      <div class="sb-card">
        <h2>Problems, in plain words</h2>
        <p class="sub">Workday says "You are not eligible." The builder says what's wrong and what to do.</p>
        ${g.catches.map(c=>catchCard(c,true)).join('')}
      </div>
      ${foot('options',null,null,null,`<button class="wd-btn primary" data-go="options">Back to options</button>`)}
    </div>`;
  };

  // Workday's own pattern after a submitted task: "Success! …", Up Next, Details.
  V.done=()=>{
    const cur=schedule(); const credits=cur.reduce((a,s)=>a+s.credits,0);
    return `
    ${stepsBar('done')}
    <div class="sb">
      <div class="sb-card sb-success">
        <div class="hd">${icon('check-circle-fill')}<div><h2>Success! Registration submitted.</h2><p class="sub">${D.termShort} · ${cur.length} sections · ${credits} credit hours · Confirmation WD-${String(Date.now()).slice(-6)}</p></div></div>
        <div class="sb-kv"><b>Student</b><span>${D.student.name} (${DEMO_STUDENT.id}) · ${D.student.program}</span><b>Academic Period</b><span>${D.term}</span><b>Submitted</b><span>${new Date().toLocaleString('en-US',{month:'2-digit',day:'2-digit',year:'numeric',hour:'numeric',minute:'2-digit'})}</span></div>
        <h3 class="wd-section-h">Registered Sections</h3>
        <div class="sb-done-list">${cur.map(s=>`<div class="r"><span class="sw ${COLORS[s.course]}"></span><b>${s.course}-${s.section}</b><span>${s.title}</span><em>${S.dayList(s.days)} ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.room}</em></div>`).join('')}</div>
        <h3 class="wd-section-h">Up Next</h3>
        <div class="sb-upnext">
          <div class="r"><b>Add these classes to your calendar</b><span>Keep them in Google, Outlook or Apple Calendar, repeating for the whole term.</span><button class="wd-btn secondary sm" id="calBtn">${icon('calendar')} Add to calendar</button></div>
          <div class="r"><b>Tuition statement</b><span>Posts to Financials Hub about 01/05/2027. Due 01/19/2027.</span></div>
          <div class="r"><b>Textbooks and materials</b><span>Listed on each section in View My Courses once instructors post them.</span></div>
        </div>
        <div class="sb-actions"><a class="wd-btn primary" href="saved-schedules.html?saved=1">View in Saved Schedules</a><a class="wd-btn secondary" href="academics.html">Academics Hub</a></div>
        ${week(cur)}
      </div>
    </div>`;
  };

  // ---------- calendar export ----------
  const ICS_DAY={M:'MO',T:'TU',W:'WE',Th:'TH',F:'FR'};
  const DOW={M:1,T:2,W:3,Th:4,F:5};
  function firstMeeting(sec){ // first date on/after term start matching one of the section's days
    const d=new Date(D.termStart+'T00:00:00'); const days=S.splitDays(sec.days).map(x=>DOW[x]);
    for(let i=0;i<7;i++){ const t=new Date(d); t.setDate(d.getDate()+i); if(days.includes(t.getDay())) return t; }
    return d;
  }
  const pad=n=>String(n).padStart(2,'0');
  const stamp=(date,hm)=>`${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}T${hm.replace(':','')}00`;
  function icsFor(secs){
    const end=D.termEnd.replace(/-/g,'')+'T235959';
    const ev=secs.map(s=>{const f=firstMeeting(s);return ['BEGIN:VEVENT',`UID:${s.id.replace(/\s/g,'')}-${D.termStart}@workday-builder`,`DTSTAMP:${stamp(new Date(),'12:00')}`,`DTSTART;TZID=America/Chicago:${stamp(f,s.start)}`,`DTEND;TZID=America/Chicago:${stamp(f,s.end)}`,`RRULE:FREQ=WEEKLY;BYDAY=${S.splitDays(s.days).map(d=>ICS_DAY[d]).join(',')};UNTIL=${end}`,`SUMMARY:${s.course}-${s.section} ${s.title}`,`LOCATION:${s.room}`,`DESCRIPTION:${s.instructor} · ${s.credits} credit hours · Fills ${s.fills}`,'END:VEVENT'].join('\r\n');}).join('\r\n');
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//UA Workday Student//Schedule Builder//EN','CALSCALE:GREGORIAN',ev,'END:VCALENDAR'].join('\r\n');
  }
  function googleUrl(s){ const f=firstMeeting(s); const u=new URL('https://calendar.google.com/calendar/render'); u.searchParams.set('action','TEMPLATE'); u.searchParams.set('text',`${s.course}-${s.section} ${s.title}`); u.searchParams.set('dates',`${stamp(f,s.start)}/${stamp(f,s.end)}`); u.searchParams.set('ctz','America/Chicago'); u.searchParams.set('location',s.room); u.searchParams.set('details',`${s.instructor} · ${s.credits} credit hours`); u.searchParams.set('recur',`RRULE:FREQ=WEEKLY;BYDAY=${S.splitDays(s.days).map(d=>ICS_DAY[d]).join(',')};UNTIL=${D.termEnd.replace(/-/g,'')}`); return u.toString(); }
  function outlookUrl(s){ const f=firstMeeting(s); const iso=(d,hm)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${hm}:00`; const u=new URL('https://outlook.office.com/calendar/0/deeplink/compose'); u.searchParams.set('subject',`${s.course}-${s.section} ${s.title}`); u.searchParams.set('startdt',iso(f,s.start)); u.searchParams.set('enddt',iso(f,s.end)); u.searchParams.set('location',s.room); u.searchParams.set('body',`${s.instructor} · repeats ${S.dayList(s.days)} through ${D.termEnd}`); u.searchParams.set('path','/calendar/action/compose'); return u.toString(); }
  function openCalendar(){
    const cur=schedule(); const sc=document.getElementById('scrim');
    const ics='data:text/calendar;charset=utf-8,'+encodeURIComponent(icsFor(cur));
    sc.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><button class="x" id="closeSheet" aria-label="Close">${icon('x')}</button><h3>Add to calendar</h3><p class="sub">Each class repeats on its days from 01/19/2027 to 05/14/2027, Central time.</p>
      <div class="sb-cal-all"><a class="wd-btn primary" href="${ics}" download="UA-Spring-2027-schedule.ics">${icon('calendar')} Apple Calendar / Outlook (.ics, all ${cur.length})</a><span class="sb-muted">One file with every class. Opens in Apple Calendar or Outlook desktop.</span></div>
      <h4 class="sb-cal-h">Or add one class at a time</h4>
      <div class="sb-cal-list">${cur.map(s=>`<div class="r"><div><b>${s.course}-${s.section}</b><span>${S.dayList(s.days)} ${S.fmt(s.start)}–${S.fmt(s.end)}</span></div><a class="wd-btn secondary sm" target="_blank" rel="noopener" href="${googleUrl(s)}">Google</a><a class="wd-btn secondary sm" target="_blank" rel="noopener" href="${outlookUrl(s)}">Outlook</a></div>`).join('')}</div>
      <div class="wd-btn-row" style="margin-top:16px"><button class="wd-btn secondary" id="closeSheet2">Done</button></div></div>`;
    sc.classList.add('open');
  }

  // ---------- render + events ----------
  const body=document.getElementById('body');
  function render(){
    let r=route();
    if(r==='swap-list'){ state.swapping=null; save(); r='swap'; }
    if(['swap','review','done'].includes(r) && !state.schedule){ const g=gen(); if(!g.options.length){ r='options'; } else { state.chosen=0; state.schedule=g.options[0].sections.map(s=>s.id); save(); } }
    body.innerHTML=(V[r]||V.start)();
    document.getElementById('aiToggle').classList.toggle('on',!!state.ai);
    document.getElementById('aiState').textContent=state.ai?'On':'Off';
    if(r==='prefs'&&state.ai) showParsed();
    window.scrollTo(0,0);
  }
  function showParsed(){
    const p=state.prefs; const box=document.getElementById('parsed'); if(!box) return;
    box.innerHTML=[`Earliest ${S.fmt(p.earliest)}`, p.latest?`Latest ${S.fmt(p.latest)}`:null, p.daysOff.length?`${p.daysOff.map(d=>S.DAY[d]).join('/')} off`:null, ...(p.blocks||[]).map(b=>`${b.label} ${b.days.map(d=>S.DAY[d]).join('/')} ${S.fmt(b.start)}–${S.fmt(b.end)}`), `${p.credits} credit hours`].filter(Boolean).map(x=>`<span>${x}</span>`).join('');
  }
  function openSheet(id){
    const s=secById(id); if(!s) return;
    const inSched=(state.schedule||[]).includes(id);
    const scrim=document.getElementById('scrim');
    scrim.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><button class="x" id="closeSheet" aria-label="Close">${icon('x')}</button><h3>${s.course}-${s.section} · ${s.title}</h3><p class="sub">${S.dayList(s.days)} · ${S.fmt(s.start)}–${S.fmt(s.end)} · ${s.room} · ${s.instructor}</p><div class="whybox"><b>Why it's here</b>${S.why(s,D.student,state.ai?'ai':'rules')}</div><dl><dt>Fills</dt><dd>${s.fills}</dd><dt>Prerequisite</dt><dd>${s.prereq?`${s.prereq} · ${D.student.completed.includes(s.prereq)?'done':'<b style="color:#b3261e">not done</b>'}`:'None'}</dd><dt>Seats</dt><dd>${seatsText(s)}</dd><dt>Credit hours</dt><dd>${s.credits}</dd></dl><div class="wd-btn-row">${inSched?`<button class="wd-btn primary" data-swapfor="${s.id}">Swap this class</button>`:''}<button class="wd-btn secondary" id="closeSheet2">Close</button></div></div>`;
    scrim.classList.add('open');
  }
  function closeSheet(){ const sc=document.getElementById('scrim'); sc.classList.remove('open'); sc.innerHTML=''; }
  function setCredits(n){ n=Math.max(1,Math.min(21,n|0)); if(n===state.prefs.credits) return; state.prefs.credits=n; resetPicks(); save(); render(); }

  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-flag],[data-go],[data-credits],[data-cred],[data-day],[data-must],.cell,[data-choose],[data-detail],[data-sec],[data-swapto],[data-swapfor],[data-drop],[data-waitlist],[data-use],#applySentence,#registerBtn,#advisorBtn,#saveBtn,#calBtn,#closeSheet,#closeSheet2,#aiToggle,#confirmReg,#cancelDlg,#sendAdvisor');
    if(!t) { if(e.target.id==='scrim') closeSheet(); return; }
    const p=state.prefs;
    if(t.dataset.flag!==undefined){ const l=document.getElementById('flag'+t.dataset.flag); l.hidden=!l.hidden; t.setAttribute('aria-expanded',String(!l.hidden)); t.classList.toggle('open',!l.hidden); return; }
    if(t.dataset.go!==undefined){ go(t.dataset.go); return; }
    if(t.id==='aiToggle'){ state.ai=!state.ai; try{localStorage.setItem('sb-ai',state.ai?'on':'off');}catch(e){} save(); render(); return; }
    if(t.dataset.credits){ setCredits(+t.dataset.credits); return; }
    if(t.dataset.cred){ setCredits(p.credits+(+t.dataset.cred)); return; }
    if(t.dataset.day){ const d=t.dataset.day; p.daysOff=p.daysOff.includes(d)?p.daysOff.filter(x=>x!==d):[...p.daysOff,d]; resetPicks(); save(); render(); return; }
    if(t.dataset.must){ const c=t.dataset.must; p.mustTake=p.mustTake.includes(c)?p.mustTake.filter(x=>x!==c):[...p.mustTake,c]; resetPicks(); save(); render(); if(t.dataset.title){ toast(c+' will be in every option.'); } return; }
    if(t.classList.contains('cell')){ toggleBlock(t.dataset.day,+t.dataset.hour); return; }
    if(t.id==='applySentence'){ const txt=document.getElementById('sentence').value; state.prefs=S.parseSentence(txt,p); state.prefs.sentence=txt; resetPicks(); save(); render(); toast('Read your preferences. Check the form below.'); return; }
    if(t.dataset.choose!==undefined){ const g=gen(); state.chosen=+t.dataset.choose; state.schedule=g.options[state.chosen].sections.map(s=>s.id); save(); render(); return; }
    if(t.dataset.detail||t.dataset.sec){ openSheet(t.dataset.detail||t.dataset.sec); return; }
    if(t.dataset.swapfor){ closeSheet(); state.swapping=t.dataset.swapfor; save(); go('swap'); render(); return; }
    if(t.dataset.swapto){ const from=state.swapping; state.schedule=state.schedule.map(id=>id===from?t.dataset.swapto:id); state.chosen=-1; state.swapping=null; save(); go('review'); toast(`Swapped to ${t.dataset.swapto}. The other ${state.schedule.length-1} classes stay put.`); return; }
    if(t.dataset.drop){ state.schedule=state.schedule.filter(id=>id!==t.dataset.drop); state.chosen=-1; state.swapping=null; save(); go('review'); toast(`Dropped ${t.dataset.drop} from the plan.`); return; }
    if(t.dataset.waitlist){ toast(`Added to the waitlist for ${t.dataset.waitlist}. We'll text you when a seat opens.`); return; }
    if(t.dataset.use){ const s=secById(t.dataset.use); if(!state.schedule.includes(s.id)){ const same=state.schedule.find(id=>secById(id).course===s.course); state.schedule= same? state.schedule.map(id=>id===same?s.id:id) : [...state.schedule,s.id]; state.chosen=-1; save(); } go('review'); toast(`${s.course}-${s.section} is in the plan.`); return; }
    if(t.id==='closeSheet'||t.id==='closeSheet2'||t.id==='cancelDlg'){ closeSheet(); return; }
    if(t.id==='calBtn'){ openCalendar(); return; }
    if(t.id==='saveBtn'){ let saved=[]; try{ saved=JSON.parse(localStorage.getItem('sb-saved')||'[]'); }catch(e){} const cur=schedule(); saved.unshift({name:`${D.termShort} · Builder`, sections:cur.map(s=>`${s.course}-${s.section} - ${s.title.toUpperCase()}`), alerts:0, credits:cur.reduce((a,s)=>a+s.credits,0)}); try{localStorage.setItem('sb-saved',JSON.stringify(saved.slice(0,3)));}catch(e){} t.textContent='Saving…'; t.disabled=true; setTimeout(()=>{ location.href='saved-schedules.html?saved=1'; },350); return; }
    if(t.id==='advisorBtn'){ const cur=schedule(); const sc=document.getElementById('scrim'); sc.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><button class="x" id="closeSheet" aria-label="Close">${icon('x')}</button><h3>Send to ${D.student.advisor}</h3><p class="sub">UAF Advisor · Your draft and the reasons go with it. They can comment or approve.</p><label class="sb-label" for="advNote">Note</label><textarea class="sb-textarea" id="advNote">Hi ${D.student.advisor.split(' ')[0]}, here's my ${D.termShort} draft: ${cur.map(s=>s.course+'-'+s.section).join(', ')} (${cur.reduce((a,s)=>a+s.credits,0)} cr). It fills ${[...new Set(cur.map(s=>s.fills))].join(', ')}. Does this look right before I register on ${D.registrationOpens.split(',')[0]}?</textarea><div class="wd-btn-row" style="margin-top:16px"><button class="wd-btn primary" id="sendAdvisor">Send</button><button class="wd-btn secondary" id="cancelDlg">Cancel</button></div></div>`; sc.classList.add('open'); return; }
    if(t.id==='sendAdvisor'){ closeSheet(); toast(`Sent to ${D.student.advisor}. You'll get a notification when they reply.`); return; }
    if(t.id==='registerBtn'){ const cur=schedule(); const sc=document.getElementById('scrim'); sc.innerHTML=`<div class="sb-sheet" role="dialog" aria-modal="true"><h3>Register ${cur.length} sections for ${D.termShort}?</h3><p class="sub">${cur.map(s=>s.course+'-'+s.section).join(', ')} · ${cur.reduce((a,s)=>a+s.credits,0)} credit hours</p><p style="font-size:14px;line-height:20px;margin:0 0 16px">This is the only step that changes your registration. You can drop or swap classes afterwards until the add/drop deadline.</p><div class="wd-btn-row"><button class="wd-btn primary" id="confirmReg">Confirm and register</button><button class="wd-btn secondary" id="cancelDlg">Cancel</button></div></div>`; sc.classList.add('open'); return; }
    if(t.id==='confirmReg'){ closeSheet(); const cur=schedule(); try{ let saved=JSON.parse(localStorage.getItem('sb-saved')||'[]'); saved=saved.filter(x=>!x.registered); saved.unshift({name:`${D.termShort}`, registered:true, sections:cur.map(s=>`${s.course}-${s.section} - ${s.title.toUpperCase()}`), alerts:0, credits:cur.reduce((a,s)=>a+s.credits,0)}); localStorage.setItem('sb-saved',JSON.stringify(saved.slice(0,3))); }catch(e){} go('done'); return; }
  });
  document.addEventListener('focusin',e=>{ if(e.target.id==='mustInput'){ const m=document.getElementById('mustMenu'); if(m) m.hidden=false; } });
  document.addEventListener('input',e=>{ if(e.target.id==='mustInput'){ const q=e.target.value.toLowerCase(); const m=document.getElementById('mustMenu'); if(!m) return; m.hidden=false; m.querySelectorAll('button').forEach(b=>{ b.hidden=!(b.textContent.toLowerCase().includes(q)); }); } });
  document.addEventListener('click',e=>{ const m=document.getElementById('mustMenu'); if(m && !e.target.closest('.sb-prompt')) m.hidden=true; });
  document.addEventListener('change',e=>{
    if(e.target.id==='earliest'){ state.prefs.earliest=e.target.value; resetPicks(); save(); render(); }
    if(e.target.id==='latest'){ state.prefs.latest=e.target.value; resetPicks(); save(); render(); }
    if(e.target.id==='creditsNum'){ setCredits(+e.target.value); }
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeSheet(); if(e.key==='Enter'&&e.target.id==='creditsNum'){ setCredits(+e.target.value); } });
  function toggleBlock(day,hour){
    const p=state.prefs; const h0=String(hour).padStart(2,'0')+':00', h1=String(hour+1).padStart(2,'0')+':00';
    const hit=p.blocks.findIndex(b=>b.days.includes(day)&&S.mins(b.start)<=hour*60&&S.mins(b.end)>hour*60);
    if(hit>=0){
      const b=p.blocks[hit]; const before={label:b.label,days:[day],start:b.start,end:h0}, after={label:b.label,days:[day],start:h1,end:b.end};
      b.days=b.days.filter(d=>d!==day); const out=[]; if(S.mins(before.end)>S.mins(before.start)) out.push(before); if(S.mins(after.end)>S.mins(after.start)) out.push(after);
      p.blocks=[...p.blocks.filter(x=>x.days.length),...out];
    } else {
      const adj=p.blocks.find(b=>b.days.length===1&&b.days[0]===day&&(b.end===h0||b.start===h1));
      if(adj){ if(adj.end===h0) adj.end=h1; else adj.start=h0; } else p.blocks.push({label:'Blocked',days:[day],start:h0,end:h1});
    }
    resetPicks(); save(); render();
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
  window.addEventListener('hashchange',render);
  render();
})();
