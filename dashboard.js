const client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
let currentUser=null,currentProfile=null;

async function startDashboard(){
  const {data:{user}}=await client.auth.getUser();
  if(!user){location.href='index.html';return}
  currentUser=user;
  const p=await client.from('profiles').select('full_name,role,phone,bio,location,skills,cv_url,cv_path,avatar_url,experience_years,education,languages').eq('id',user.id).single();
  if(p.error){document.getElementById('content').innerHTML=`<div class="dash-card"><h2>Ntibyagenze neza</h2><p>${esc(p.error.message)}</p></div>`;return}
  currentProfile=p.data;
  document.getElementById('welcome').textContent=`Murakaza neza, ${p.data?.full_name||'User'}`;
  document.getElementById('roleText').textContent=`Account: ${p.data?.role||'job_seeker'}`;
  const s=document.getElementById('stats'),c=document.getElementById('content');
  if(p.data?.role==='employer')await employerDashboard(user.id,s,c);else if(p.data?.role==='admin')await adminDashboard(s,c);else await seekerDashboard(user.id,s,c);
}

function profileForm(p){return `<div class="dash-card"><h2>Profile yawe</h2><p>Uzuza amakuru yawe kugira ngo AI Job Matching ibone jobs zikubereye.</p><form id="profileForm" class="profile-form"><label>Amazina yuzuye<input id="fullName" value="${esc(p.full_name)}" required></label><label>Telefone<input id="phone" value="${esc(p.phone)}" placeholder="078..."></label><label>Aho utuye<input id="location" value="${esc(p.location)}" placeholder="Kigali, Rwanda"></label><label>Skills / Ubushobozi<textarea id="skills" rows="3" placeholder="JavaScript, Excel, Accounting...">${esc(p.skills)}</textarea></label><label>Experience (years)<input id="experienceYears" type="number" min="0" step="0.5" value="${esc(p.experience_years??0)}"></label><label>Education<input id="education" value="${esc(p.education)}" placeholder="Bachelor's in Computer Science"></label><label>Languages<input id="languages" value="${esc(p.languages)}" placeholder="Kinyarwanda, English, French"></label><label>Bio / Ibyerekeye wowe<textarea id="bio" rows="4" placeholder="Andika incamake y'umwuga wawe...">${esc(p.bio)}</textarea></label><label>CV yawe (PDF, max 10MB)<input id="cvFile" type="file" accept="application/pdf,.pdf"></label><p id="cvStatus">${p.cv_path?'📄 CV iri muri system.':'Nta CV urashyiraho.'}</p><label>CV link ya kera (optional)<input id="cvUrl" type="url" value="${esc(p.cv_url)}" placeholder="https://..."></label><button class="btn btn-primary" type="submit">Bika Profile</button><span id="profileMsg"></span></form></div>`}

async function uploadCV(){
  const file=document.getElementById('cvFile')?.files?.[0];
  if(!file)return null;
  if(file.type!=='application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))throw new Error('CV igomba kuba PDF.');
  if(file.size>10*1024*1024)throw new Error('CV ntigomba kurenza 10MB.');
  const path=`${currentUser.id}/cv-${Date.now()}.pdf`;
  const up=await client.storage.from('cv-files').upload(path,file,{contentType:'application/pdf',upsert:false});
  if(up.error)throw up.error;
  return path;
}

async function saveProfile(e){
  e.preventDefault();const msg=document.getElementById('profileMsg');msg.textContent='Birabikwa...';
  try{
    let cvPath=currentProfile.cv_path||null;
    const newPath=await uploadCV();
    if(newPath){
      if(cvPath)await client.storage.from('cv-files').remove([cvPath]);
      cvPath=newPath;
    }
    const payload={full_name:document.getElementById('fullName').value.trim(),phone:document.getElementById('phone').value.trim(),location:document.getElementById('location').value.trim(),skills:document.getElementById('skills').value.trim(),experience_years:Number(document.getElementById('experienceYears').value||0),education:document.getElementById('education').value.trim(),languages:document.getElementById('languages').value.trim(),bio:document.getElementById('bio').value.trim(),cv_url:document.getElementById('cvUrl').value.trim(),cv_path:cvPath};
    const r=await client.from('profiles').update(payload).eq('id',currentUser.id);if(r.error)throw r.error;
    currentProfile={...currentProfile,...payload};document.getElementById('welcome').textContent=`Murakaza neza, ${payload.full_name||'User'}`;msg.textContent='✓ Profile yabitswe';
    if(cvPath)document.getElementById('cvStatus').textContent='📄 CV yabitswe neza.';
    if(currentProfile.role==='job_seeker')await renderRecommendations(document.getElementById('content'));
  }catch(err){msg.textContent=err.message||'Ntibyagenze neza.'}
}

async function refreshMyMatches(){await client.rpc('refresh_my_job_matches');}

async function renderRecommendations(content){
  const old=content.querySelector('.recommendations-card');if(old)old.remove();
  const box=document.createElement('div');box.className='dash-card recommendations-card';box.innerHTML='<h2>🤖 Jobs Recommended For You</h2><p>AI iri gusesengura profile yawe...</p>';content.appendChild(box);
  await refreshMyMatches();
  const r=await client.from('job_matches').select('score,reasons,missing_skills,jobs(id,title,description,location,employment_type,companies(name))').eq('candidate_id',currentUser.id).order('score',{ascending:false}).limit(8);
  if(r.error){box.innerHTML=`<h2>🤖 Jobs Recommended For You</h2><p>${esc(r.error.message)}</p>`;return}
  box.innerHTML=`<h2>🤖 Jobs Recommended For You</h2><p>Recommendations zishingiye kuri skills, experience, education, languages na location.</p>${(r.data||[]).map(x=>{const j=x.jobs||{};const miss=(x.missing_skills||[]).slice(0,3).join(', ');return `<div class="candidate-item"><p><strong>${esc(j.title||'Job')}</strong> · ${esc(j.companies?.name||'Company')} · ${esc(j.location||'')}</p><p><strong>Match: ${Number(x.score).toFixed(0)}%</strong> ${miss?`· Missing: ${esc(miss)}`:''}</p><p>${esc((j.description||'').slice(0,180))}${j.description?.length>180?'…':''}</p><a class="btn btn-outline" href="index.html#jobs">Reba Jobs</a></div>`}).join('')||'<p>Nta recommendation irabonetse. Uzuza skills, experience, education na languages muri profile.</p>'}`;
}

async function seekerDashboard(id,stats,content){
  const [a,s]=await Promise.all([client.from('applications').select('id,status,created_at,jobs(title,companies(name))').eq('applicant_id',id).order('created_at',{ascending:false}),client.from('saved_jobs').select('job_id,created_at,jobs(title,location,companies(name))').eq('user_id',id).order('created_at',{ascending:false})]);
  stats.innerHTML=`<div class="dash-grid"><div class="dash-card"><h3>Candidatures</h3><div class="metric">${a.data?.length||0}</div></div><div class="dash-card"><h3>Saved jobs</h3><div class="metric">${s.data?.length||0}</div></div><div class="dash-card"><h3>AI Matching</h3><div class="metric">✓</div></div></div>`;
  content.innerHTML=profileForm(currentProfile)+`<div class="dash-card"><h2>Candidatures zawe</h2>${(a.data||[]).map(x=>`<p><strong>${esc(x.jobs?.title||'Job')}</strong> · ${esc(x.jobs?.companies?.name||'Company')} — <strong>${esc(x.status)}</strong></p>`).join('')||'<p>Nta candidature uratuma.</p>'}</div><div class="dash-card"><h2>Jobs wabikiye</h2>${(s.data||[]).map(x=>`<p><strong>${esc(x.jobs?.title||'Job')}</strong> · ${esc(x.jobs?.location||'')} · ${esc(x.jobs?.companies?.name||'Company')}</p>`).join('')||'<p>Nta job wabika.</p>'}`;
  document.getElementById('profileForm').addEventListener('submit',saveProfile);
  await renderRecommendations(content);
}

async function employerDashboard(id,stats,content){
  const c=await client.from('companies').select('id,name,location,verified').eq('owner_id',id).maybeSingle();
  if(!c.data){stats.innerHTML='<div class="dash-card"><h2>Kora Company Profile</h2><p>Garuka kuri homepage ushyireho job kugira ngo utangire.</p></div>';return}
  const j=await client.from('jobs').select('id,title,status,location,created_at').eq('company_id',c.data.id).order('created_at',{ascending:false});
  const ids=(j.data||[]).map(x=>x.id);
  for(const jobId of ids)await client.rpc('refresh_job_matches',{p_job_id:jobId});
  const apps=ids.length?await client.from('applications').select('id,status,job_id,applicant_id,cover_letter,cv_url,profiles(full_name,phone,location,skills,bio,cv_url,cv_path,experience_years,education,languages)').in('job_id',ids).order('created_at',{ascending:false}):{data:[]};
  const matches=ids.length?await client.from('job_matches').select('job_id,candidate_id,score,missing_skills').in('job_id',ids):{data:[]};
  const matchMap=new Map((matches.data||[]).map(x=>[`${x.job_id}:${x.candidate_id}`,x]));
  stats.innerHTML=`<div class="dash-grid"><div class="dash-card"><h3>${esc(c.data.name)}</h3><div class="metric">${j.data?.length||0}</div><p>Jobs</p></div><div class="dash-card"><h3>Candidates</h3><div class="metric">${apps.data?.length||0}</div></div><div class="dash-card"><h3>Verified</h3><div class="metric">${c.data.verified?'✓':'—'}</div></div></div>`;
  const scoredApps=(apps.data||[]).map(x=>({...x,match:matchMap.get(`${x.job_id}:${x.applicant_id}`)})).sort((a,b)=>Number(b.match?.score||0)-Number(a.match?.score||0));
  content.innerHTML=profileForm(currentProfile)+`<div class="dash-card"><h2>Jobs zawe</h2>${(j.data||[]).map(x=>`<p><strong>${esc(x.title)}</strong> · ${esc(x.location)} · ${esc(x.status)}</p>`).join('')||'<p>Nta jobs urashyiraho.</p>'}</div><div class="dash-card"><h2>🤖 Best Candidates</h2><p>AI Match % ifasha gutondeka candidates; ntabwo isimbura decision y'umukoresha.</p>${scoredApps.map(x=>`<div class="candidate-item"><p><strong>${esc(x.profiles?.full_name||'Candidate')}</strong> · ${esc(x.profiles?.location||'')}</p><p><strong>Match: ${x.match?Number(x.match.score).toFixed(0):'0'}%</strong> · ${esc(x.profiles?.skills||'Skills ntabwo zatanzwe.')}</p><p>Experience: ${esc(x.profiles?.experience_years??0)} years · Education: ${esc(x.profiles?.education||'—')} · Languages: ${esc(x.profiles?.languages||'—')}</p><p>${esc(x.profiles?.bio||'')}</p><p>Status: <select class="status-select" data-id="${x.id}"><option ${x.status==='pending'?'selected':''} value="pending">Pending</option><option ${x.status==='reviewing'?'selected':''} value="reviewing">Reviewing</option><option ${x.status==='shortlisted'?'selected':''} value="shortlisted">Shortlisted</option><option ${x.status==='rejected'?'selected':''} value="rejected">Rejected</option><option ${x.status==='hired'?'selected':''} value="hired">Hired</option></select></p>${x.profiles?.cv_path||x.cv_url||x.profiles?.cv_url?`<p><button class="btn btn-outline cv-view-btn" data-application="${x.id}">📄 Reba CV</button></p>`:''}${x.cover_letter?`<p><strong>Cover letter:</strong> ${esc(x.cover_letter)}</p>`:''}</div>`).join('')||'<p>Nta candidature iraza.</p>'}</div>`;
  document.getElementById('profileForm').addEventListener('submit',saveProfile);
  document.querySelectorAll('.status-select').forEach(el=>el.addEventListener('change',async()=>{const r=await client.from('applications').update({status:el.value}).eq('id',el.dataset.id);if(r.error)alert(r.error.message)}));
  document.querySelectorAll('.cv-view-btn').forEach(el=>el.addEventListener('click',async()=>{el.disabled=true;el.textContent='Birafunguka...';const r=await client.functions.invoke('get-cv-url',{body:{application_id:el.dataset.application}});if(r.error||r.data?.error){alert(r.error?.message||r.data.error||'CV ntibonetse');el.disabled=false;el.textContent='📄 Reba CV';return}window.open(r.data.url,'_blank','noopener');el.disabled=false;el.textContent='📄 Reba CV'}));
}

async function adminDashboard(stats,content){const [j,a,c]=await Promise.all([client.from('jobs').select('id'),client.from('applications').select('id'),client.from('companies').select('id')]);stats.innerHTML=`<div class="dash-grid"><div class="dash-card"><h3>Jobs</h3><div class="metric">${j.data?.length||0}</div></div><div class="dash-card"><h3>Applications</h3><div class="metric">${a.data?.length||0}</div></div><div class="dash-card"><h3>Companies</h3><div class="metric">${c.data?.length||0}</div></div></div>`;content.innerHTML='<div class="dash-card"><h2>Admin Dashboard</h2><p>Metrics zose ziri muri Supabase.</p></div>'}

document.getElementById('logout').onclick=async()=>{await client.auth.signOut();location.href='index.html'};
startDashboard();
