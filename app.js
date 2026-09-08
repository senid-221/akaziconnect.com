const jobs=[
 {title:'Frontend Developer',company:'Tech Rwanda',category:'technology',location:'Kigali',type:'Full-time',salary:'450K–700K RWF',logo:'T'},
 {title:'Sales & Marketing Officer',company:'Tumiza Hub',category:'sales',location:'Kigali',type:'Full-time',salary:'300K–500K RWF',logo:'T'},
 {title:'Accountant',company:'Bee Limited',category:'finance',location:'Kigali',type:'Full-time',salary:'400K–650K RWF',logo:'B'},
 {title:'Computer Trainer',company:'AkaziConnect',category:'education',location:'Nyanza',type:'Part-time',salary:'250K–450K RWF',logo:'A'},
 {title:'Backend Developer',company:'Digital Solutions',category:'technology',location:'Remote',type:'Full-time',salary:'600K–1M RWF',logo:'D'},
 {title:'Customer Support Officer',company:'Rwanda Services',category:'sales',location:'Kigali',type:'Full-time',salary:'280K–420K RWF',logo:'R'}
];
let lang='rw';
const grid=document.getElementById('jobsGrid');
const empty=document.getElementById('emptyState');
const modal=document.getElementById('modal');
const modalContent=document.getElementById('modalContent');

function renderJobs(list=jobs){
 grid.innerHTML=''; empty.hidden=list.length>0;
 list.forEach((job,i)=>{
  const card=document.createElement('article'); card.className='job-card';
  card.innerHTML=`<div class="job-top"><div class="company-logo">${job.logo}</div><button class="save" aria-label="Save job">♡</button></div><h3>${job.title}</h3><div class="company">${job.company}</div><div class="job-meta"><span>⌖ ${job.location}</span><span>${job.type}</span></div><div class="job-footer"><span class="salary">${job.salary}</span><button class="apply" data-index="${i}">${lang==='rw'?'Apply':'Apply'}</button></div>`;
  grid.appendChild(card);
 });
 document.querySelectorAll('.apply').forEach(btn=>btn.addEventListener('click',()=>openApply(list[Number(btn.dataset.index)])));
 document.querySelectorAll('.save').forEach(btn=>btn.addEventListener('click',()=>{btn.textContent=btn.textContent==='♡'?'♥':'♡';}));
}
function searchJobs(){
 const q=document.getElementById('keyword').value.trim().toLowerCase();
 const loc=document.getElementById('location').value.trim().toLowerCase();
 renderJobs(jobs.filter(j=>(!q||`${j.title} ${j.company} ${j.category}`.toLowerCase().includes(q))&&(!loc||j.location.toLowerCase().includes(loc))));
 document.getElementById('jobs').scrollIntoView({behavior:'smooth'});
}
function openModal(html){modalContent.innerHTML=html;modal.classList.add('show');modal.setAttribute('aria-hidden','false');}
function closeModal(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');}
function openApply(job){openModal(`<h2>${job.title}</h2><p>${job.company} · ${job.location}</p><div class="notice">Candidature yawe izajya kuri ${job.company}. Iyi MVP irategura flow; backend izongerwamo kuri step ikurikira.</div><form id="applyForm"><input required placeholder="Amazina yawe"/><input required type="tel" placeholder="Phone number"/><input type="email" placeholder="Email"/><button class="btn btn-primary" type="submit">Ohereza candidature</button></form>`);document.getElementById('applyForm').addEventListener('submit',e=>{e.preventDefault();openModal(`<h2>Byakunze! 🎉</h2><p>Candidature yawe kuri <strong>${job.title}</strong> yatangiye gutegurwa.</p><button class="btn btn-primary" id="doneBtn">Komeza</button>`);document.getElementById('doneBtn').onclick=closeModal;});}
function openSignup(){openModal(`<h2>${lang==='rw'?'Fungura account':'Create an account'}</h2><p>${lang==='rw'?'Hitamo uko ushaka gukoresha AkaziConnect.':'Choose how you want to use AkaziConnect.'}</p><form id="signupForm"><input required placeholder="Amazina yuzuye"/><input required type="email" placeholder="Email"/><select><option>${lang==='rw'?'Nshaka akazi':'I am looking for a job'}</option><option>${lang==='rw'?'Ndi umukoresha':'I am an employer'}</option></select><input required type="password" placeholder="Password"/><button class="btn btn-primary" type="submit">${lang==='rw'?'Iyandikishe':'Sign up'}</button></form>`);document.getElementById('signupForm').addEventListener('submit',e=>{e.preventDefault();openModal(`<h2>Murakoze!</h2><p>Account creation flow is ready for backend integration.</p><button class="btn btn-primary" id="doneBtn">OK</button>`);document.getElementById('doneBtn').onclick=closeModal;});}
function openLogin(){openModal(`<h2>${lang==='rw'?'Injira':'Login'}</h2><p>${lang==='rw'?'Injira muri account yawe.':'Access your account.'}</p><form id="loginForm"><input required type="email" placeholder="Email"/><input required type="password" placeholder="Password"/><button class="btn btn-primary" type="submit">${lang==='rw'?'Injira':'Login'}</button></form>`);document.getElementById('loginForm').addEventListener('submit',e=>{e.preventDefault();openModal(`<h2>Welcome 👋</h2><p>Authentication flow is ready for backend integration.</p><button class="btn btn-primary" id="doneBtn">OK</button>`);document.getElementById('doneBtn').onclick=closeModal;});}
function openPostJob(){openModal(`<h2>${lang==='rw'?'Shyiraho job':'Post a job'}</h2><p>${lang==='rw'?'Tanga amakuru y’umwanya w’akazi.':'Add your job details.'}</p><form id="jobForm"><input required placeholder="Job title"/><input required placeholder="Company"/><input required placeholder="Location"/><input placeholder="Salary"/><textarea placeholder="Job description" style="min-height:100px;padding:12px;border:1px solid var(--line);border-radius:9px"></textarea><button class="btn btn-primary" type="submit">${lang==='rw'?'Ohereza Job':'Publish Job'}</button></form>`);document.getElementById('jobForm').addEventListener('submit',e=>{e.preventDefault();openModal(`<h2>Job saved ✅</h2><p>Employer dashboard and database publishing will be connected in the next build step.</p><button class="btn btn-primary" id="doneBtn">OK</button>`);document.getElementById('doneBtn').onclick=closeModal;});}

document.getElementById('searchBtn').onclick=searchJobs;
document.getElementById('keyword').addEventListener('keydown',e=>{if(e.key==='Enter')searchJobs()});
document.getElementById('location').addEventListener('keydown',e=>{if(e.key==='Enter')searchJobs()});
document.getElementById('closeModal').onclick=closeModal;
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
document.getElementById('signupBtn').onclick=openSignup;
document.getElementById('loginBtn').onclick=openLogin;
document.getElementById('postJobBtn').onclick=openPostJob;
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');renderJobs(btn.dataset.filter==='all'?jobs:jobs.filter(j=>j.category===btn.dataset.filter));}));
document.getElementById('langBtn').onclick=()=>{lang=lang==='rw'?'en':'rw';document.getElementById('langBtn').textContent=lang==='rw'?'EN':'RW';document.querySelectorAll('[data-rw]').forEach(el=>el.textContent=el.dataset[lang]);document.querySelectorAll('input').forEach(i=>{if(i.id==='keyword')i.placeholder=lang==='rw'?'Umwanya, ubumenyi cyangwa company':'Role, skill or company';if(i.id==='location')i.placeholder=lang==='rw'?'Aho ushaka gukorera':'Where do you want to work?';});};
renderJobs();
