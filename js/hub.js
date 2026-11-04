/* Academics Hub secondary rail (clone of Workday's hub navigation). */
window.renderRail = function(active){
  const sub=(key,label,href,isNew)=>`<a class="wd-rail-sub ${active===key?'is-active':''} ${isNew?'is-new':''}" href="${href}">${label}${isNew?'<span class="new">NEW</span>':''}</a>`;
  return `
  <aside class="wd-rail" aria-label="Academics">
    <div class="wd-rail-head">${icon('grad-cap')}<span>Academics</span><button class="collapse" aria-label="Collapse">${icon('arrow-left-to-line')}</button></div>
    <a class="wd-rail-item ${active==='overview'?'is-active':''}" href="academics.html">${icon('megaphone')}<span>Overview</span></a>
    <button class="wd-rail-item">${icon('document-list')}<span>Academic History</span><span class="chev">${icon('chevron-up-small')}</span></button>
    ${sub('record','My Academic Record','#')}
    ${sub('progress','My Academic Progress','academics.html#progress')}
    <button class="wd-rail-item ${['saved','find','builder','plan','classes'].includes(active)?'is-active':''}">${icon('calendar')}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Planning and Registration</span><span class="chev">${icon('chevron-up-small')}</span></button>
    ${sub('plan','My Academic Plan','#')}
    ${sub('classes','Current Classes','academics.html#courses')}
    ${sub('builder','Schedule Builder','builder.html',true)}
    ${sub('saved','Saved Schedules','saved-schedules.html')}
    ${sub('find','Find Course Sections','#')}
    ${sub('notes','Note History','#')}
  </aside>
  <nav class="wd-rail-mobile" aria-label="Academics">
    <span class="hd">${icon('grad-cap')}Academics</span>
    ${[['overview','Overview','academics.html'],['progress','Academic Progress','academics.html#progress'],['classes','My Courses','academics.html#courses'],['builder','Schedule Builder','builder.html'],['saved','Saved Schedules','saved-schedules.html'],['find','Find Course Sections','#'],['plan','Academic Plan','#']].map(([k,l,href])=>`<a class="${active===k?'is-active':''}" href="${href}">${l}${k==='builder'?'<span class="new">NEW</span>':''}</a>`).join('')}
  </nav>`;
};
