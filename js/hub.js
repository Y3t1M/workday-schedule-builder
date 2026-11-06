/* Academics Hub secondary rail (clone of Workday's hub navigation). */
window.renderRail = function(active){
  let collapsed=false, hist=true, plan=true;
  try{ collapsed=localStorage.getItem('wd-rail')==='collapsed'; hist=localStorage.getItem('wd-rail-hist')!=='closed'; plan=localStorage.getItem('wd-rail-plan')!=='closed'; }catch(e){}
  const sub=(key,label,href,isNew)=>`<a class="wd-rail-sub ${active===key?'is-active':''} ${isNew?'is-new':''}" href="${href}">${label}${isNew?'<span class="new">NEW</span>':''}</a>`;
  return `
  <aside class="wd-rail ${collapsed?'is-collapsed':''}" aria-label="Academics">
    <div class="wd-rail-head">${icon('grad-cap')}<span>Academics</span><button class="collapse" data-railtoggle aria-label="${collapsed?'Expand':'Collapse'} navigation">${icon(collapsed?'arrow-right-to-line':'arrow-left-to-line')}</button></div>
    <a class="wd-rail-item ${active==='overview'?'is-active':''}" href="academics.html" title="Overview">${icon('megaphone')}<span>Overview</span></a>
    <button class="wd-rail-item" data-group="hist" aria-expanded="${hist}" title="Academic History">${icon('document-list')}<span>Academic History</span><span class="chev">${icon(hist?'chevron-up-small':'chevron-down-small')}</span></button>
    <div class="wd-rail-group" data-groupbody="hist" ${hist?'':'hidden'}>
    ${sub('record','My Academic Record','academics.html#courses')}
    ${sub('progress','My Academic Progress','academics.html#progress')}
    </div>
    <button class="wd-rail-item ${['saved','find','builder','plan','classes'].includes(active)?'is-active':''}" data-group="plan" aria-expanded="${plan}" title="Planning and Registration">${icon('calendar')}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Planning and Registration</span><span class="chev">${icon(plan?'chevron-up-small':'chevron-down-small')}</span></button>
    <div class="wd-rail-group" data-groupbody="plan" ${plan?'':'hidden'}>
    ${sub('plan','My Academic Plan','builder.html#needs')}
    ${sub('classes','Current Classes','academics.html#courses')}
    ${sub('builder','Schedule Builder','builder.html',true)}
    ${sub('saved','Saved Schedules','saved-schedules.html')}
    ${sub('find','Find Course Sections','find-course-sections.html')}
    ${sub('notes','Note History','academics.html#notes')}
    </div>
  </aside>
  <nav class="wd-rail-mobile" aria-label="Academics">
    <span class="hd">${icon('grad-cap')}Academics</span>
    ${[['overview','Overview','academics.html'],['progress','Academic Progress','academics.html#progress'],['classes','My Courses','academics.html#courses'],['builder','Schedule Builder','builder.html'],['saved','Saved Schedules','saved-schedules.html'],['find','Find Course Sections','find-course-sections.html'],['plan','Academic Plan','builder.html#needs']].map(([k,l,href])=>`<a class="${active===k?'is-active':''}" href="${href}">${l}${k==='builder'?'<span class="new">NEW</span>':''}</a>`).join('')}
  </nav>`;
};
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-railtoggle]'); if(t){ const r=t.closest('.wd-rail'); r.classList.toggle('is-collapsed'); const c=r.classList.contains('is-collapsed'); try{ localStorage.setItem('wd-rail',c?'collapsed':'open'); }catch(x){} t.innerHTML=icon(c?'arrow-right-to-line':'arrow-left-to-line'); t.setAttribute('aria-label',(c?'Expand':'Collapse')+' navigation'); return; }
  const g=e.target.closest('[data-group]'); if(g){ const body=document.querySelector(`[data-groupbody="${g.dataset.group}"]`); const open=body.hidden; body.hidden=!open; g.setAttribute('aria-expanded',String(open)); g.querySelector('.chev').innerHTML=icon(open?'chevron-up-small':'chevron-down-small'); try{ localStorage.setItem('wd-rail-'+g.dataset.group,open?'open':'closed'); }catch(x){} }
});
