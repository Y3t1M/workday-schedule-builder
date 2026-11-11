/* Shared Workday chrome: header, global nav, flyouts, footer, bottom bar.
   Call renderShell({active:'home'|'student'}) after icons.js. */
(function(){
  const STUDENT = {name:'Hudson', initials:'H', id:'010204567'};
  const ON_BUILDER = /builder\.html$/.test(location.pathname);
  window.DEMO_STUDENT = STUDENT;

  // A quiet notice at the top of every page: says it's a demo, points to the builder,
  // and slides away after 15 seconds (or when closed, for the rest of the visit)
  function banner(){
    const link = ON_BUILDER ? '' : ` <a class="pt-link" href="builder.html">Try the Schedule Builder</a>`;
    return `<div class="pt-banner" role="note" aria-label="Demo notice"><p><span class="pt-long">This is a demo with sample data, not the real Workday.</span><span class="pt-short">This is a demo with sample data.</span>${link}</p><button class="pt-x" type="button" aria-label="Hide this notice">${icon('x').replace(/width="24" height="24"/,'width="16" height="16"')}</button></div>`;
  }
  function bannerTimer(){
    const hide=()=>document.body.classList.add('pt-hidden');
    let closed=false; try{ closed=sessionStorage.getItem('pt-closed')==='1'; }catch(e){}
    if(closed){ hide(); return; }
    setTimeout(hide,15000);
    const x=document.querySelector('.pt-x');
    if(x) x.addEventListener('click',()=>{ hide(); try{ sessionStorage.setItem('pt-closed','1'); }catch(e){} });
  }
  function header(){
    return `
    <header class="wd-header" role="banner">
      <a class="wd-logo" href="index.html" aria-label="University of Arkansas home"><img src="assets/ua-logo.png" alt="University of Arkansas"></a>
      <div class="wd-search" role="search">${icon('search')}<span>Search</span></div>
      <div class="wd-header-right">
        <button class="wd-iconbtn" data-pop="notif" aria-haspopup="true" aria-label="Notifications, 3 unread">${icon('notifications')}<span class="wd-badge">3</span></button>
        <button class="wd-iconbtn" data-pop="tasks" aria-haspopup="true" aria-label="My Tasks">${icon('inbox')}</button>
        <button class="wd-avatar" data-pop="profile" aria-haspopup="true" aria-label="Profile menu">${STUDENT.initials}</button>
      </div>
    </header>
    <div class="wd-pop" id="popNotif" role="menu" hidden>
      <div class="hd"><b>Notifications</b><a href="#" data-wd="all notifications">View All</a></div>
      <a href="builder.html" class="row" role="menuitem"><span class="dot"></span><div><b>Registration appointment set</b><span>UAF Spring 2027 opens 11/10/2026 at 8:00 AM. Build your schedule now.</span><i>2 days ago</i></div></a>
      <a href="#" class="row" role="menuitem" data-wd="Required Learning"><span class="dot"></span><div><b>Required Learning due 11/09/2026</b><span>Complete Student Onboarding Tasks.</span><i>5 days ago</i></div></a>
      <a href="#" class="row" role="menuitem" data-wd="the advisor message"><span class="dot"></span><div><b>Message from Blaise M. Simecek</b><span>Recap of our meeting and your Spring 2027 course options.</span><i>1 week ago</i></div></a>
    </div>
    <div class="wd-pop" id="popTasks" role="menu" hidden>
      <div class="hd"><b>My Tasks</b><a href="#" data-wd="My Tasks">View All</a></div>
      <a href="#" class="row" role="menuitem" data-wd="the Prepare for Registration journey"><div><b>Prepare for Registration</b><span>Journey · 3 of 5 steps done</span><i>Due 11/09/2026</i></div></a>
      <a href="#" class="row" role="menuitem" data-wd="the Student Onboarding journey"><div><b>Complete Student Onboarding Tasks</b><span>Journey · 1 step left</span><i>Due 11/09/2026</i></div></a>
    </div>
    <div class="wd-pop" id="popProfile" role="menu" hidden>
      <div class="me"><span class="wd-avatar">${STUDENT.initials}</span><div><b>${STUDENT.name}</b><span>Student · ${STUDENT.id}</span><a href="#" data-wd="View Profile">View Profile</a></div></div>
      <a href="#" role="menuitem" data-wd="My Account">${icon('user')}My Account</a>
      <a href="#" role="menuitem" data-pop="tasks">${icon('inbox')}My Tasks</a>
      <a href="#" role="menuitem" data-pop="notif">${icon('notifications')}Notifications</a>
      <a href="#" role="menuitem" data-wd="Favorites">${icon('bookmark')}Favorites</a>
      <a href="#" role="menuitem" data-wd="My Reports">${icon('document')}My Reports</a>
      <a href="#" role="menuitem" data-wd="Sign Out" class="out">${icon('arrow-right')}Sign Out</a>
    </div>`;
  }
  function nav(active){
    const item=(key,label,ic,href,isBtn)=>{
      const cls = key===active?'is-active':'';
      const inner=`<span class="ic">${icon(ic)}</span><span>${label}</span>`;
      return isBtn?`<button class="${cls}" data-fly="${key}" aria-haspopup="true" aria-expanded="false">${inner}</button>`:`<a class="${cls}" href="${href}">${inner}</a>`;
    };
    const fly=(key,title,items)=>`<div class="wd-flyout" id="fly-${key}" role="menu" data-flyfor="${key}"><h3>${title}</h3>${items.map(([l,h,wd])=>`<a href="${h||'#'}" role="menuitem" ${wd?`data-wd="${wd}"`:''}>${l}</a>`).join('')}</div>`;
    return `
    <nav class="wd-nav" aria-label="Global">
      ${item('home','Home','home','index.html')}
      ${item('student','Student','book-open',null,true)}
      ${item('personal','Personal','user',null,true)}
      ${item('org','Organization','contact-card-cost-center',null,true)}
      ${item('ext','External Links','link',null,true)}
      <span class="spacer"></span>
      ${item('saved','Saved','media-mylearning',null,true)}
      <button aria-label="Settings" data-fly="settings" aria-haspopup="true" style="min-height:48px"><span class="ic">${icon('gear')}</span></button>
    </nav>
    ${fly('student','Student',[['Academics Hub','academics.html'],['Financials Hub','#','the Financials Hub'],['Student Resources','#','Student Resources'],['Academics','academics.html'],['Finances','#','Finances']])}
    ${fly('personal','Personal',[['Personal Information','#','Personal Information'],['Contact','#','Contact'],['Emergency Contacts','#','Emergency Contacts'],['IDs','#','IDs'],['Pay','#','Pay'],['Time','#','Time']])}
    ${fly('org','Organization',[['Org Chart','#','the Org Chart'],['Directory','#','the Directory'],['Walton College of Business','#','the college page']])}
    ${fly('ext','External Links',[['Blackboard Learn','#','Blackboard'],['UAConnect (archive)','#','UAConnect'],['Catalog of Studies','#','the Catalog of Studies'],['Razorback Card','#','Razorback Card'],['Campus Map','#','the Campus Map']])}
    ${fly('saved','Saved',[['Spring 2027 · Builder (saved schedule)','saved-schedules.html'],['View My Academic Progress','academics.html#progress'],['Manage saved items','#','Saved items']])}
    ${fly('settings','Settings',[['Change Preferences','#','Change Preferences'],['Accessibility Overview','#','Accessibility Overview'],['Reset demo data','#reset']])}
    <nav class="wd-bottombar" aria-label="Global">
      <a href="index.html" class="${active==='home'?'is-active':''}"><span class="ic">${icon('home')}</span>Home</a>
      <a href="academics.html" class="${active==='student'?'is-active':''}"><span class="ic">${icon('book-open')}</span>Student</a>
      <a href="#" data-wd="Personal"><span class="ic">${icon('user')}</span>Personal</a>
      <a href="saved-schedules.html"><span class="ic">${icon('media-mylearning')}</span>Saved</a>
    </nav>`;
  }
  function footer(){
    return `
    <footer class="wd-footer">
      <p><b>Student prototype.</b> Made by the McMillon Innovation Studio Workday team at the University of Arkansas, Fall 2026. This is not the real Workday or University of Arkansas site, and every name, class and number is sample data. Workday is a trademark of Workday, Inc.</p>
      <p><a href="builder.html">Go to the Schedule Builder</a></p>
    </footer>`;
  }
  function closeAll(){ document.querySelectorAll('.wd-flyout.open').forEach(f=>f.classList.remove('open')); document.querySelectorAll('.wd-pop').forEach(p=>p.hidden=true); document.querySelectorAll('[data-fly][aria-expanded]').forEach(b=>b.setAttribute('aria-expanded','false')); }
  window.renderShell = function(opts){
    opts=opts||{};
    document.body.insertAdjacentHTML('afterbegin', banner()+header()+nav(opts.active||''));
    bannerTimer();
    if(opts.footer!==false) document.body.insertAdjacentHTML('beforeend', footer());
    document.body.classList.add('has-bottombar');
    // L2 flyouts: position next to the button that opened them
    document.addEventListener('click',e=>{
      const fb=e.target.closest('[data-fly]');
      if(fb){ e.stopPropagation(); const f=document.getElementById('fly-'+fb.dataset.fly); const was=f&&f.classList.contains('open'); closeAll(); if(f&&!was){ const r=fb.getBoundingClientRect(); const ptH=document.body.classList.contains('pt-hidden')?0:((document.querySelector('.pt-banner')||{}).offsetHeight||0); f.style.top=Math.max(72+ptH,Math.min(r.top, window.innerHeight-f.offsetHeight-16))+'px'; f.classList.add('open'); fb.setAttribute('aria-expanded','true'); } return; }
      const pb=e.target.closest('[data-pop]');
      if(pb){ e.preventDefault(); e.stopPropagation(); const p=document.getElementById('pop'+pb.dataset.pop.charAt(0).toUpperCase()+pb.dataset.pop.slice(1)); const was=p&&!p.hidden; closeAll(); if(p&&was===false) p.hidden=false; return; }
      if(!e.target.closest('.wd-flyout,.wd-pop')) closeAll();
      // anything that is only a placeholder in this prototype says so instead of doing nothing
      const a=e.target.closest('a[href="#"]:not([data-detail]):not([data-course]),a[href="#reset"]');
      if(a){ e.preventDefault(); if(a.getAttribute('href')==='#reset'){ try{ localStorage.removeItem('sb-saved'); localStorage.removeItem('sb-ai'); sessionStorage.clear(); }catch(x){} toast('Demo data reset.'); setTimeout(()=>location.href='index.html',500); return; } const what=a.dataset.wd||a.textContent.trim(); toast(`${what.charAt(0).toUpperCase()+what.slice(1)} is part of the real Workday, not this prototype. The Schedule Builder is the part that works.`, ON_BUILDER?null:{href:'builder.html',label:'Go to the Schedule Builder'}); closeAll(); }
    });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeAll(); });
  };
  window.toast = function(msg, action){
    let t=document.querySelector('.wd-toast');
    if(!t){t=document.createElement('div');t.className='wd-toast';t.setAttribute('role','status');document.body.appendChild(t);}
    t.innerHTML=(action?icon('info'):icon('check-circle-fill'))+'<span>'+msg+'</span>'+(action?`<a class="wd-toast-act" href="${action.href}">${action.label}</a>`:'');
    t.classList.toggle('has-act',!!action);
    requestAnimationFrame(()=>t.classList.add('show'));
    clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),action?6000:3200);
  };
  window.todayLine = function(){
    const d=new Date(2026,10,3);
    return "It's "+d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  };
})();
