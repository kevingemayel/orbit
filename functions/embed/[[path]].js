// Cloudflare Pages Function - the connect-mode embed loader, served at
//   https://orbit.spacework.ai/embed/erp.js
// Drop it on ANY website (or it auto-runs inside our own rendered sites) to hydrate
// ERP-backed widgets from published, read-only data:
//   <div class="sw-erp" data-widget="careers" data-company="<id>"></div>        (our sites)
//   <script src="https://orbit.spacework.ai/embed/erp.js" data-orbit-widget="careers" data-company="<id>"></script>  (external)
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";

const ERP_JS = `(function(){
  var SUPA=${JSON.stringify(SUPA)},ANON=${JSON.stringify(ANON)};
  var CSS='.swx{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:inherit}'
   +'.swx-job{border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:16px 18px;margin:0 0 12px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}'
   +'.swx-job h4{margin:0;font-size:17px;font-weight:600}.swx-meta{color:#667;font-size:13px;display:flex;gap:14px;flex-wrap:wrap}'
   +'.swx-desc{flex-basis:100%;color:#556;font-size:14px;margin:2px 0 0;white-space:pre-line}'
   +'.swx-btn{margin-left:auto;background:var(--swx-pri,#2f6bff);color:#fff;border:0;border-radius:8px;padding:8px 16px;cursor:pointer;text-decoration:none;font-size:14px;display:inline-block}'
   +'.swx-empty{color:#778;padding:12px 0}'
   +'.swx-form{flex-basis:100%;margin-top:8px;display:none;gap:8px;flex-wrap:wrap}.swx-form.on{display:flex}'
   +'.swx-form input,.swx-form textarea{flex:1 1 46%;padding:9px 11px;border:1px solid rgba(0,0,0,.2);border-radius:8px;font:inherit;box-sizing:border-box}'
   +'.swx-form textarea{flex-basis:100%}.swx-form .swx-btn{margin-left:0}.swx-portal{display:flex;gap:10px;flex-wrap:wrap}';
  function inject(){ if(document.getElementById('swx-css'))return; var s=document.createElement('style');s.id='swx-css';s.textContent=CSS;document.head.appendChild(s); }
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function rpc(n,b){return fetch(SUPA+'/rest/v1/rpc/'+n,{method:'POST',headers:{'Content-Type':'application/json',apikey:ANON,Authorization:'Bearer '+ANON},body:JSON.stringify(b)}).then(function(r){return r.json();});}
  function pri(el){var c=el.getAttribute('data-color');if(!c){try{c=getComputedStyle(document.documentElement).getPropertyValue('--sw-pri').trim();}catch(e){}}if(c)el.style.setProperty('--swx-pri',c);}
  function targets(){
    var out=[];
    document.querySelectorAll('.sw-erp[data-widget]:not([data-swx])').forEach(function(el){el.setAttribute('data-swx','1');out.push({el:el,widget:el.getAttribute('data-widget'),company:el.getAttribute('data-company'),limit:el.getAttribute('data-limit'),origin:el.getAttribute('data-origin')});});
    document.querySelectorAll('script[data-orbit-widget]:not([data-swx])').forEach(function(sc){sc.setAttribute('data-swx','1');var d=document.createElement('div');d.className='swx';if(sc.getAttribute('data-color'))d.setAttribute('data-color',sc.getAttribute('data-color'));sc.parentNode.insertBefore(d,sc.nextSibling);out.push({el:d,widget:sc.getAttribute('data-orbit-widget'),company:sc.getAttribute('data-company')||sc.getAttribute('data-orbit'),limit:sc.getAttribute('data-limit'),origin:sc.getAttribute('data-origin')});});
    return out;
  }
  function careers(t){
    var el=t.el; el.classList.add('swx'); pri(el);
    if(!t.company){el.innerHTML='<div class=swx-empty>Careers widget: set data-company.</div>';return;}
    el.innerHTML='<div class=swx-empty>Loading positions…</div>';
    rpc('public_jobs',{p_company:t.company}).then(function(jobs){
      if(!Array.isArray(jobs)||!jobs.length){el.innerHTML='<div class=swx-empty>No open positions right now.</div>';return;}
      if(t.limit)jobs=jobs.slice(0,+t.limit);
      el.innerHTML=jobs.map(function(j){
        var meta=[j.location,j.employment_type,j.department].filter(Boolean).map(esc).join(' \\u2022 ');
        var apply=j.apply_url?'<a class=swx-btn href="'+esc(j.apply_url)+'" target=_blank rel=noopener>Apply</a>':'<button class=swx-btn type=button data-apply="'+esc(j.id)+'">Apply</button>';
        var form='<form class=swx-form data-jobform="'+esc(j.id)+'"><input name=name placeholder="Your name" required><input name=email type=email placeholder="Email" required><input name=cv_url placeholder="Link to CV (optional)"><textarea name=message placeholder="Message (optional)" rows=2></textarea><button class=swx-btn type=submit>Send application</button></form>';
        return '<div class=swx-job><h4>'+esc(j.title)+'</h4>'+(meta?'<div class=swx-meta>'+meta+'</div>':'')+apply+(j.description?'<div class=swx-desc>'+esc(j.description)+'</div>':'')+form+'</div>';
      }).join('');
      el.querySelectorAll('[data-apply]').forEach(function(b){b.onclick=function(){var f=el.querySelector('[data-jobform="'+b.getAttribute('data-apply')+'"]');if(f)f.classList.toggle('on');};});
      el.querySelectorAll('[data-jobform]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var d={};new FormData(f).forEach(function(v,k){d[k]=v;});var jid=f.getAttribute('data-jobform');var btn=f.querySelector('button[type=submit]');btn.disabled=true;rpc('job_apply',{p_company:t.company,p_job:jid,p_data:d}).then(function(r){f.innerHTML='<div class=swx-empty>Thanks \\u2014 your application was sent.</div>';}).catch(function(){btn.disabled=false;alert('Could not send. Please try again.');});});});
    }).catch(function(){el.innerHTML='<div class=swx-empty>Could not load positions.</div>';});
  }
  function portal(t){
    var el=t.el; el.classList.add('swx','swx-portal'); pri(el);
    var origin=t.origin||'https://orbit.spacework.ai';
    el.innerHTML='<a class=swx-btn href="'+origin+'" target=_blank rel=noopener>Team login</a>'
      +'<a class=swx-btn href="'+origin+'" target=_blank rel=noopener style="background:#3a4250">Customer portal</a>';
  }
  function run(){ inject(); targets().forEach(function(t){ if(t.widget==='careers')careers(t); else if(t.widget==='portal')portal(t); }); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run); else run();
})();`;

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
  const seg = params && params.path ? (Array.isArray(params.path) ? params.path : [params.path]) : [];
  const name = seg.join("/");
  if (name === "" || name === "erp.js") {
    return new Response(ERP_JS, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" } });
  }
  return new Response("not found", { status: 404 });
}
