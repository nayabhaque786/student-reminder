const get=(k,d)=>JSON.parse(localStorage.getItem(k)||JSON.stringify(d));const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function renderNav(){let path=location.pathname.split('/').pop()||'index.html';document.querySelectorAll('nav a').forEach(a=>{if(a.getAttribute('href')===path)a.classList.add('active')})}
renderNav();

/* ---------- Dark mode ---------- */
function applyTheme(){document.documentElement.setAttribute('data-theme',get('sm_theme','light'))}
applyTheme();
function initThemeToggle(){const btn=document.getElementById('themeToggle');if(!btn)return;btn.textContent=get('sm_theme','light')==='dark'?'☀️':'🌙';btn.onclick=()=>{const cur=get('sm_theme','light');const next=cur==='dark'?'light':'dark';set('sm_theme',next);applyTheme();btn.textContent=next==='dark'?'☀️':'🌙'}}

/* ---------- Toast ---------- */
function toast(msg){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}t.textContent=msg;t.className='show';clearTimeout(t._h);t._h=setTimeout(()=>t.className='',2200)}

let reminders=get('sm_reminders',[]), notes=get('sm_notes',[]), classes=get('sm_classes',[]);
function dateText(d){return new Date(d+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}
function status(d,done){if(done)return 'Completed';let t=new Date();t.setHours(0,0,0,0);let x=new Date(d+'T00:00:00');let n=Math.round((x-t)/86400000);return n<0?'Overdue':n===0?'Due today':n===1?'Tomorrow':'Due in '+n+' days'}
function isOverdue(d,done){if(done)return false;let t=new Date();t.setHours(0,0,0,0);return new Date(d+'T00:00:00')<t}

/* ---------- Reminders (add / edit / delete / filter / sort) ---------- */
let editingReminderId=null;
const form=document.getElementById('reminderForm');
if(form){
  document.getElementById('date').min=new Date().toISOString().split('T')[0];
  const submitBtn=form.querySelector('button[type=submit]');
  form.onsubmit=e=>{
    e.preventDefault();
    if(editingReminderId){
      let r=reminders.find(x=>x.id===editingReminderId);
      Object.assign(r,{title:title.value.trim(),subject:subject.value.trim()||'General',date:date.value,priority:priority.value});
      editingReminderId=null;submitBtn.textContent='+ Add Reminder';toast('Reminder updated ✓');
    }else{
      if(reminders.some(r=>r.title.toLowerCase()===title.value.trim().toLowerCase()&&r.date===date.value)){
        if(!confirm('A reminder with this title and date already exists. Add anyway?'))return;
      }
      reminders.push({id:Date.now(),title:title.value.trim(),subject:subject.value.trim()||'General',date:date.value,priority:priority.value,completed:false});
      toast('Reminder added ✓');
    }
    set('sm_reminders',reminders);form.reset();priority.value='medium';drawReminders();
  };
  document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');drawReminders()});
  document.getElementById('filterSubject')?.addEventListener('change',drawReminders);
  document.getElementById('filterPriority')?.addEventListener('change',drawReminders);
  document.getElementById('sortBy')?.addEventListener('change',drawReminders);
  drawReminders();
}
function populateSubjectFilter(){
  const sel=document.getElementById('filterSubject');if(!sel)return;
  const current=sel.value;
  const subjects=[...new Set(reminders.map(r=>r.subject))].sort();
  sel.innerHTML='<option value="all">All Subjects</option>'+subjects.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
  if(subjects.includes(current))sel.value=current;
}
function drawReminders(){
  const box=document.getElementById('reminderList');if(!box)return;
  populateSubjectFilter();
  const statusFilter=document.querySelector('.filter.active')?.dataset.filter||'all';
  const subjFilter=document.getElementById('filterSubject')?.value||'all';
  const prioFilter=document.getElementById('filterPriority')?.value||'all';
  const sortBy=document.getElementById('sortBy')?.value||'date-asc';
  let arr=reminders.filter(r=>
    (statusFilter==='all'||(statusFilter==='pending'&&!r.completed)||(statusFilter==='completed'&&r.completed)) &&
    (subjFilter==='all'||r.subject===subjFilter) &&
    (prioFilter==='all'||r.priority===prioFilter)
  );
  const prioRank={high:0,medium:1,low:2};
  arr.sort((a,b)=>{
    if(sortBy==='date-desc')return b.date.localeCompare(a.date);
    if(sortBy==='priority')return prioRank[a.priority]-prioRank[b.priority]||a.date.localeCompare(b.date);
    if(sortBy==='title')return a.title.localeCompare(b.title);
    return a.date.localeCompare(b.date);
  });
  box.innerHTML=arr.length?arr.map(r=>`<article class="reminder ${r.priority} ${r.completed?'completed':''} ${isOverdue(r.date,r.completed)?'overdue':''}"><input class="check" type="checkbox" ${r.completed?'checked':''} onchange="toggleReminder(${r.id})"><div><div class="rtitle">${esc(r.title)}</div><div class="meta">📘 ${esc(r.subject)} · 📅 ${dateText(r.date)} · ${status(r.date,r.completed)} · ${r.priority} priority</div></div><div class="rowbtns"><button class="edit" onclick="editReminder(${r.id})">✏️</button><button class="delete" onclick="deleteReminder(${r.id})">🗑️</button></div></article>`).join(''):'<div class="card"><p>No reminders match this view.</p></div>';
}
window.toggleReminder=id=>{let r=reminders.find(x=>x.id===id);r.completed=!r.completed;set('sm_reminders',reminders);drawReminders()};
window.deleteReminder=id=>{if(!confirm('Delete this reminder?'))return;reminders=reminders.filter(x=>x.id!==id);set('sm_reminders',reminders);drawReminders();toast('Reminder deleted')};
window.editReminder=id=>{
  let r=reminders.find(x=>x.id===id);if(!r)return;
  editingReminderId=id;
  title.value=r.title;subject.value=r.subject;date.value=r.date;priority.value=r.priority;
  form.querySelector('button[type=submit]').textContent='Save Changes';
  title.scrollIntoView({behavior:'smooth',block:'center'});title.focus();
};

/* ---------- Dashboard ---------- */
if(document.getElementById('pending')){
  document.getElementById('pending').textContent=reminders.filter(x=>!x.completed).length;
  document.getElementById('done').textContent=reminders.filter(x=>x.completed).length;
  document.getElementById('notes').textContent=notes.length;
  document.getElementById('classes').textContent=classes.length;
  let overdueCount=reminders.filter(x=>isOverdue(x.date,x.completed)).length;
  let ob=document.getElementById('overdueBanner');
  if(ob){if(overdueCount>0){ob.style.display='flex';ob.querySelector('span').textContent=`⚠️ You have ${overdueCount} overdue reminder${overdueCount>1?'s':''}.`}else{ob.style.display='none'}}
  let u=document.getElementById('upcoming');
  let a=reminders.filter(x=>!x.completed).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  u.innerHTML=a.length?a.map(r=>`<div class="reminder ${r.priority} ${isOverdue(r.date,false)?'overdue':''}"><div>🔔</div><div><div class="rtitle">${esc(r.title)}</div><div class="meta">${esc(r.subject)} · ${dateText(r.date)} · ${status(r.date,false)}</div></div></div>`).join(''):'<p class="meta">No pending reminders. Great job! 🎉</p>';
  drawWeekChart();
}

/* ---------- Dashboard chart: next 7 days workload ---------- */
function drawWeekChart(){
  const el=document.getElementById('weekChart');if(!el)return;
  const days=[];
  for(let i=0;i<7;i++){
    const d=new Date();d.setDate(d.getDate()+i);
    const key=d.toISOString().split('T')[0];
    const count=reminders.filter(r=>r.date===key&&!r.completed).length;
    days.push({label:d.toLocaleDateString(undefined,{weekday:'short'}),count});
  }
  const max=Math.max(1,...days.map(d=>d.count));
  const w=44,gap=18,chartH=110;
  const svgW=days.length*(w+gap);
  const bars=days.map((d,i)=>{
    const h=Math.round((d.count/max)*(chartH-10))||0;
    const x=i*(w+gap);
    const y=chartH-h;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${Math.max(h,3)}" rx="7" fill="${i===0?'#4f46e5':'#c7d2fe'}"></rect>
    <text x="${x+w/2}" y="${chartH+20}" text-anchor="middle" font-size="12" fill="#6b7280">${d.label}</text>
    <text x="${x+w/2}" y="${y-8}" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">${d.count}</text></g>`;
  }).join('');
  el.innerHTML=`<svg viewBox="0 0 ${svgW} ${chartH+32}" width="100%" height="170" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

/* ---------- Timetable (add / edit / delete / day filter) ---------- */
let editingClassId=null;
const cf=document.getElementById('classForm');
if(cf){
  const submitBtn=cf.querySelector('button[type=submit]');
  cf.onsubmit=e=>{
    e.preventDefault();
    if(editingClassId){
      let c=classes.find(x=>x.id===editingClassId);
      Object.assign(c,{name:className.value.trim(),day:day.value,time:time.value,room:room.value.trim()});
      editingClassId=null;submitBtn.textContent='+ Add Class';toast('Class updated ✓');
    }else{
      if(classes.some(c=>c.day===day.value&&c.time===time.value)){
        if(!confirm('You already have a class at this day and time. Add anyway?'))return;
      }
      classes.push({id:Date.now(),name:className.value.trim(),day:day.value,time:time.value,room:room.value.trim()});
      toast('Class added ✓');
    }
    set('sm_classes',classes);cf.reset();drawClasses();
  };
  document.getElementById('dayFilter')?.addEventListener('change',drawClasses);
  drawClasses();
}
function drawClasses(){
  let box=document.getElementById('timetable');if(!box)return;
  let days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const jsDay=new Date().getDay();
  const today=days[(jsDay+6)%7];
  const dayFilter=document.getElementById('dayFilter')?.value||'all';
  const show=dayFilter==='all'?days:[dayFilter];
  box.innerHTML=show.map(d=>`<div class="day ${d===today?'today':''}"><h4>${d}${d===today?' <span class="todaytag">Today</span>':''}</h4>${classes.filter(c=>c.day===d).sort((a,b)=>a.time.localeCompare(b.time)).map(c=>`<div class="classitem"><div class="citembtns"><button onclick="editClass(${c.id})">✏️</button><button onclick="deleteClass(${c.id})">×</button></div><b>${esc(c.name)}</b>${c.time}${c.room?' · '+esc(c.room):''}</div>`).join('')||'<small class="meta">No classes</small>'}</div>`).join('');
}
window.deleteClass=id=>{if(!confirm('Delete this class?'))return;classes=classes.filter(x=>x.id!==id);set('sm_classes',classes);drawClasses();toast('Class deleted')};
window.editClass=id=>{
  let c=classes.find(x=>x.id===id);if(!c)return;
  editingClassId=id;
  className.value=c.name;day.value=c.day;time.value=c.time;room.value=c.room;
  cf.querySelector('button[type=submit]').textContent='Save Changes';
  className.scrollIntoView({behavior:'smooth',block:'center'});className.focus();
};

/* ---------- Notes (add / edit / delete / search) ---------- */
let editingNoteId=null;
const nf=document.getElementById('noteForm');
if(nf){
  const submitBtn=nf.querySelector('button[type=submit]');
  nf.onsubmit=e=>{
    e.preventDefault();
    if(editingNoteId){
      let n=notes.find(x=>x.id===editingNoteId);
      Object.assign(n,{title:noteTitle.value.trim(),text:noteText.value.trim()});
      editingNoteId=null;submitBtn.textContent='+ Save Note';toast('Note updated ✓');
    }else{
      notes.unshift({id:Date.now(),title:noteTitle.value.trim(),text:noteText.value.trim()});
      toast('Note saved ✓');
    }
    set('sm_notes',notes);nf.reset();drawNotes();
  };
  const search=document.getElementById('noteSearch');
  if(search)search.oninput=()=>drawNotes(search.value);
  drawNotes();
}
function drawNotes(q=''){
  let box=document.getElementById('notesList');if(!box)return;
  let arr=notes.filter(n=>!q||n.title.toLowerCase().includes(q.toLowerCase())||n.text.toLowerCase().includes(q.toLowerCase()));
  box.innerHTML=arr.length?arr.map(n=>`<article class="note"><div class="rowbtns notebtns"><button onclick="editNote(${n.id})">✏️</button><button onclick="deleteNote(${n.id})">🗑️</button></div><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></article>`).join(''):'<div class="card"><p>No notes found.</p></div>';
}
window.deleteNote=id=>{if(!confirm('Delete this note?'))return;notes=notes.filter(x=>x.id!==id);set('sm_notes',notes);drawNotes(document.getElementById('noteSearch')?.value||'');toast('Note deleted')};
window.editNote=id=>{
  let n=notes.find(x=>x.id===id);if(!n)return;
  editingNoteId=id;
  noteTitle.value=n.title;noteText.value=n.text;
  nf.querySelector('button[type=submit]').textContent='Save Changes';
  noteTitle.scrollIntoView({behavior:'smooth',block:'center'});noteTitle.focus();
};

/* ---------- Profile ---------- */
const pf=document.getElementById('profileForm');
if(pf){
  let p=get('sm_profile',{});
  profileName.value=p.name||'';course.value=p.course||'';college.value=p.college||'';
  pf.onsubmit=e=>{e.preventDefault();set('sm_profile',{name:profileName.value,course:course.value,college:college.value});document.getElementById('profileMsg').textContent='Profile saved successfully ✓';toast('Profile saved ✓')};
}

/* ---------- Export / Import ---------- */
function exportData(){
  const data={sm_reminders:reminders,sm_notes:notes,sm_classes:classes,sm_profile:get('sm_profile',{}),exportedAt:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='studymate-backup.json';a.click();
}
function importData(file){
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(data.sm_reminders)set('sm_reminders',data.sm_reminders);
      if(data.sm_notes)set('sm_notes',data.sm_notes);
      if(data.sm_classes)set('sm_classes',data.sm_classes);
      if(data.sm_profile)set('sm_profile',data.sm_profile);
      toast('Data imported ✓ Reloading...');
      setTimeout(()=>location.reload(),900);
    }catch(err){toast('Invalid backup file')}
  };
  reader.readAsText(file);
}
function initBackupControls(){
  const exportBtn=document.getElementById('exportBtn');
  const importInput=document.getElementById('importInput');
  if(exportBtn)exportBtn.onclick=exportData;
  if(importInput)importInput.onchange=e=>{if(e.target.files[0])importData(e.target.files[0])};
}

/* ---------- Browser notifications ---------- */
function updateNotifyBtn(){
  const btn=document.getElementById('notifyBtn');if(!btn)return;
  const on=get('sm_notify_enabled',false)&&('Notification' in window)&&Notification.permission==='granted';
  btn.textContent=on?'🔔 Notifications On (tap to turn off)':'🔔 Enable Notifications';
}
function initNotifications(){
  const btn=document.getElementById('notifyBtn');
  if(!btn)return;
  updateNotifyBtn();
  btn.onclick=()=>{
    if(!('Notification' in window)){toast('Notifications not supported in this browser');return}
    const currentlyOn=get('sm_notify_enabled',false)&&Notification.permission==='granted';
    if(currentlyOn){set('sm_notify_enabled',false);updateNotifyBtn();toast('Notifications turned off');return}
    Notification.requestPermission().then(perm=>{
      set('sm_notify_enabled',perm==='granted');updateNotifyBtn();
      if(perm==='granted'){toast('Notifications enabled ✓');checkDueNotifications(true)}
      else toast('Notifications blocked by your browser');
    });
  };
}
function checkDueNotifications(force){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  if(!get('sm_notify_enabled',false))return;
  const today=new Date().toISOString().split('T')[0];
  if(!force&&get('sm_last_notify_date','')===today)return;
  const due=reminders.filter(r=>!r.completed&&r.date<=today);
  if(due.length>0){
    try{new Notification('StudyMate Reminder',{body:`You have ${due.length} reminder${due.length>1?'s':''} due today or overdue.`,icon:'icon-192.png'})}catch(e){}
  }
  set('sm_last_notify_date',today);
}

/* ---------- PWA: service worker registration ---------- */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('service-worker.js').catch(()=>{})});
}

initThemeToggle();
initBackupControls();
initNotifications();
checkDueNotifications();
