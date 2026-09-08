const notificationClient=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
async function loadNotifications(){
  const {data:{user}}=await notificationClient.auth.getUser();
  if(!user)return;
  const r=await notificationClient.from('notifications').select('id,title,message,type,read,created_at').order('created_at',{ascending:false}).limit(10);
  if(r.error)return;
  const content=document.getElementById('content');
  if(!content)return;
  const box=document.createElement('div');box.className='dash-card notifications-card';
  const unread=(r.data||[]).filter(n=>!n.read).length;
  box.innerHTML=`<h2>🔔 Notifications ${unread?`<span class="notification-badge">${unread}</span>`:''}</h2>${(r.data||[]).map(n=>`<div class="notification-item ${n.read?'':'unread'}"><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><small>${new Date(n.created_at).toLocaleString()}</small></div>`).join('')||'<p>Nta notifications nshya.</p>'}<button class="btn btn-outline" id="markNotificationsRead">Mark all as read</button>`;
  content.prepend(box);
  document.getElementById('markNotificationsRead').onclick=async()=>{const ids=(r.data||[]).filter(n=>!n.read).map(n=>n.id);if(ids.length)await notificationClient.from('notifications').update({read:true}).in('id',ids);loadNotifications();};
}
notificationClient.auth.onAuthStateChange(()=>setTimeout(loadNotifications,300));
setTimeout(loadNotifications,700);