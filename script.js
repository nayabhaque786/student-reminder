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

/* ---------- Reminders (add / edit / delete / filter) ---------- */
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
    set('sm_reminders',reminders);form.reset();priority.value='medium';drawReminders(document.querySelector('.filter.active')?.dataset.filter||'all');
  };
  document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');drawReminders(b.dataset.filter)});
  drawReminders();
}
function drawReminders(filter='all'){
  const box=document.getElementById('reminderList');if(!box)return;
  let arr=reminders.filter(r=>filter==='all'||filter==='pending'&&!r.completed||filter==='completed'&&r.completed).sort((a,b)=>a.date.localeCompare(b.date));
  box.innerHTML=arr.length?arr.map(r=>`<article class="reminder ${r.priority} ${r.completed?'completed':''} ${isOverdue(r.date,r.completed)?'overdue':''}"><input class="check" type="checkbox" ${r.completed?'checked':''} onchange="toggleReminder(${r.id})"><div><div class="rtitle">${esc(r.title)}</div><div class="meta">📘 ${esc(r.subject)} · 📅 ${dateText(r.date)} · ${status(r.date,r.completed)} · ${r.priority} priority</div></div><div class="rowbtns"><button class="edit" onclick="editReminder(${r.id})">✏️</button><button class="delete" onclick="deleteReminder(${r.id})">🗑️</button></div></article>`).join(''):'<div class="card"><p>No reminders in this view.</p></div>';
}
window.toggleReminder=id=>{let r=reminders.find(x=>x.id===id);r.completed=!r.completed;set('sm_reminders',reminders);drawReminders(document.querySelector('.filter.active')?.dataset.filter||'all')};
window.deleteReminder=id=>{if(!confirm('Delete this reminder?'))return;reminders=reminders.filter(x=>x.id!==id);set('sm_reminders',reminders);drawReminders(document.querySelector('.filter.active')?.dataset.filter||'all');toast('Reminder deleted')};
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
}

/* ---------- Timetable (add / edit / delete) ---------- */
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
      classes.push({id:Date.now(),name:className.value.trim(),day:day.value,time:time.value,room:room.value.trim()});
      toast('Class added ✓');
    }
    set('sm_classes',classes);cf.reset();drawClasses();
  };
  drawClasses();
}
function drawClasses(){
  let box=document.getElementById('timetable');if(!box)return;
  let days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  box.innerHTML=days.map(d=>`<div class="day"><h4>${d}</h4>${classes.filter(c=>c.day===d).sort((a,b)=>a.time.localeCompare(b.time)).map(c=>`<div class="classitem"><div class="citembtns"><button onclick="editClass(${c.id})">✏️</button><button onclick="deleteClass(${c.id})">×</button></div><b>${esc(c.name)}</b>${c.time}${c.room?' · '+esc(c.room):''}</div>`).join('')||'<small class="meta">No classes</small>'}</div>`).join('');
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

initThemeToggle();
initBackupControls();
