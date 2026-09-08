const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);

async function startDashboard(){
 const result = await client.auth.getUser();
 const user = result.data.user;
 if(!user){ window.location.href='index.html'; return; }
 const profile = await client.from('profiles').select('full_name,role').eq('id',user.id).single();
 document.getElementById('welcome').textContent = `Murakaza neza, ${profile.data?.full_name || 'User'}`;
 document.getElementById('roleText').textContent = `Account: ${profile.data?.role || 'job_seeker'}`;
 const stats=document.getElementById('stats'); const content=document.getElementById('content');
 if(profile.data?.role==='employer') await employerDashboard(user.id,stats,content);
 else if(profile.data?.role==='admin') await adminDashboard(stats,content);
 else await seekerDashboard(user.id,stats,content);
}
async function seekerDashboard(id,stats,content){
 const a=await client.from('applications').select('id,status,jobs(title,companies(name))').eq('applicant_id',id).order('created_at',{ascending:false});
 const s=await client.from('saved_jobs').select('id').eq('user_id',id);
 stats.innerHTML=`<div class="dash-grid"><div class="dash-card"><h3>Candidatures</h3><div class="metric">${a.data?.length||0}</div></div><div class="dash-card"><h3>Saved jobs</h3><div class="metric">${s.data?.length||0}</div></div></div>`;
 content.innerHTML='<div class="dash-card"><h2>Candidatures zawe</h2>'+((a.data||[]).map(x=>`<p>${x.jobs?.title||'Job'} — <strong>${x.status}</strong></p>`).join('')||'<p>Nta candidature uratuma.</p>')+'</div>';
}
async function employerDashboard(id,stats,content){
 const c=await client.from('companies').select('id,name').eq('owner_id',id).maybeSingle();
 if(!c.data){stats.innerHTML='<div class="dash-card"><h2>Kora Company Profile</h2><p>Garuka kuri homepage ushyireho job kugira ngo utangire.</p></div>';return;}
 const j=await client.from('jobs').select('id,title').eq('company_id',c.data.id).order('created_at',{ascending:false});
 const ids=(j.data||[]).map(x=>x.id); const apps=ids.length?await client.from('applications').select('id').in('job_id',ids):{data:[]};
 stats.innerHTML=`<div class="dash-grid"><div class="dash-card"><h3>${c.data.name}</h3><div class="metric">${j.data?.length||0}</div><p>Jobs</p></div><div class="dash-card"><h3>Candidates</h3><div class="metric">${apps.data?.length||0}</div></div></div>`;
 content.innerHTML='<div class="dash-card"><h2>Jobs zawe</h2>'+((j.data||[]).map(x=>`<p>${x.title}</p>`).join('')||'<p>Nta jobs urashyiraho.</p>')+'</div>';
}
async function adminDashboard(stats,content){
 const [j,a,c]=await Promise.all([client.from('jobs').select('id'),client.from('applications').select('id'),client.from('companies').select('id')]);
 stats.innerHTML=`<div class="dash-grid"><div class="dash-card"><h3>Jobs</h3><div class="metric">${j.data?.length||0}</div></div><div class="dash-card"><h3>Applications</h3><div class="metric">${a.data?.length||0}</div></div><div class="dash-card"><h3>Companies</h3><div class="metric">${c.data?.length||0}</div></div></div>`;
 content.innerHTML='<div class="dash-card"><h2>Admin Dashboard</h2><p>Ubu ushobora gukurikirana jobs, companies na applications.</p></div>';
}
document.getElementById('logout').onclick=async()=>{await client.auth.signOut();window.location.href='index.html';};
startDashboard();