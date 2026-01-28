const STORAGE_EVENTS = 'ttracker.events.v1';
const STORAGE_ONGOING = 'ttracker.ongoing.v1';

function $(id){return document.getElementById(id)}

let events = JSON.parse(localStorage.getItem(STORAGE_EVENTS) || '[]');
let ongoing = JSON.parse(localStorage.getItem(STORAGE_ONGOING) || '{}');

const leftBtn = $('leftBtn');
const rightBtn = $('rightBtn');
const exportBtn = $('exportCsv');
const clearBtn = $('clearAll');
const eventsTbody = document.querySelector('#eventsTable tbody');
const emptyHint = $('emptyHint');

function save(){
  localStorage.setItem(STORAGE_EVENTS, JSON.stringify(events));
  localStorage.setItem(STORAGE_ONGOING, JSON.stringify(ongoing));
}

function iso(ts){return new Date(ts).toLocaleString()}

function formatDuration(s){
  if (s == null) return '';
  // s is seconds (may be fractional). display with milliseconds precision.
  const totalMs = Math.round(s * 1000);
  let ms = totalMs % 1000;
  let totalSec = Math.floor(totalMs / 1000);
  const sec = totalSec % 60;
  let totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hrs = Math.floor(totalMin / 60);

  const pad = (n, w=2)=>String(n).padStart(w,'0');
  const msPad = String(ms).padStart(3,'0');

  if(hrs) return `${hrs}h ${pad(min)}m ${pad(sec)}.${msPad}s`;
  if(min) return `${pad(min)}:${pad(sec)}.${msPad}`;
  return `${sec}.${msPad}s`;
}

function render(){
  // buttons state
  const leftStart = ongoing.left;
  const rightStart = ongoing.right;
  leftBtn.classList.toggle('active', !!leftStart);
  rightBtn.classList.toggle('active', !!rightStart);
  leftBtn.querySelector('.state').textContent = leftStart ? 'Active' : 'Inactive';
  rightBtn.querySelector('.state').textContent = rightStart ? 'Active' : 'Inactive';

  leftBtn.querySelector('.timer').textContent = leftStart ? `• ${formatDuration((Date.now() - new Date(leftStart))/1000)}` : '';
  rightBtn.querySelector('.timer').textContent = rightStart ? `• ${formatDuration((Date.now() - new Date(rightStart))/1000)}` : '';

  // events
  eventsTbody.innerHTML = '';
  if(events.length===0) emptyHint.style.display='block'; else emptyHint.style.display='none';

  const TRIGGERS = ['Gluten','Loud noises','Alcohol','Caffeine','Stress','Other'];
  for(const ev of events){
    // ensure backwards compatibility
    if(!Array.isArray(ev.triggers)) ev.triggers = ev.triggers ? ev.triggers.split(';') : [];
    if(typeof ev.intensity === 'undefined') ev.intensity = null;
    if(typeof ev.otherTrigger === 'undefined') ev.otherTrigger = '';

    // primary row (summary)
    const tr1 = document.createElement('tr');
    const sideTd = document.createElement('td'); sideTd.textContent = ev.side;
    const startTd = document.createElement('td'); startTd.textContent = iso(ev.start);
    const endTd = document.createElement('td'); endTd.textContent = ev.end ? iso(ev.end) : '-';
    const durTd = document.createElement('td'); durTd.textContent = ev.duration!=null ? formatDuration(ev.duration) : '-';
    const placeholderTd = document.createElement('td'); // empty placeholder (inputs in second row)
    const actionsTd = document.createElement('td');
    const del = document.createElement('button'); del.className='btn-small'; del.textContent='Delete';
    del.addEventListener('click', ()=>{ if(confirm('Delete event?')){ events = events.filter(e=>e.id!==ev.id); save(); render(); } });
    actionsTd.appendChild(del);

    tr1.appendChild(sideTd);tr1.appendChild(startTd);tr1.appendChild(endTd);tr1.appendChild(durTd);tr1.appendChild(placeholderTd);tr1.appendChild(actionsTd);
    eventsTbody.appendChild(tr1);

    // secondary row (controls)
    const tr2 = document.createElement('tr');
    const td2 = document.createElement('td'); td2.colSpan = 6;
    const container = document.createElement('div'); container.className = 'event-extra';

    // intensity radios
    const intensityWrap = document.createElement('div'); intensityWrap.className = 'intensity';
    const intensityLabel = document.createElement('label'); intensityLabel.textContent = 'Intensity:'; intensityWrap.appendChild(intensityLabel);
    const radios = document.createElement('div'); radios.className = 'radios';
    for(let i=1;i<=10;i++){
      const id = `int-${ev.id}-${i}`;
      const span = document.createElement('span');
      const r = document.createElement('input'); r.type='radio'; r.name = `intensity-${ev.id}`; r.id = id; r.value = String(i);
      if(ev.intensity==i) r.checked = true;
      r.addEventListener('change', ()=>{ ev.intensity = parseInt(r.value,10); save(); });
      const lbl = document.createElement('label'); lbl.htmlFor = id; lbl.textContent = String(i);
      span.appendChild(r); span.appendChild(lbl); radios.appendChild(span);
    }
    intensityWrap.appendChild(radios);
    container.appendChild(intensityWrap);

    // triggers
    const trigWrap = document.createElement('div'); trigWrap.className='triggers';
    const trigLabel = document.createElement('label'); trigLabel.textContent='Triggers:'; trigWrap.appendChild(trigLabel);
    for(const t of TRIGGERS){
      const cid = `tr-${ev.id}-${t}`;
      const item = document.createElement('label'); item.className='trigger-item';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.id = cid; cb.value = t;
      if(ev.triggers && ev.triggers.includes(t)) cb.checked = true;
      cb.addEventListener('change', ()=>{
        ev.triggers = ev.triggers || [];
        if(cb.checked){ ev.triggers.push(t); }
        else { ev.triggers = ev.triggers.filter(x=>x!==t); }
        save();
        render();
      });
      const span = document.createElement('span'); span.textContent = t;
      item.appendChild(cb); item.appendChild(span);
      trigWrap.appendChild(item);
      if(t === 'Other'){
        const other = document.createElement('input'); other.className='other-input'; other.placeholder='Other (describe)'; other.value = ev.otherTrigger || '';
        other.addEventListener('change', ()=>{ ev.otherTrigger = other.value || ''; save(); });
        trigWrap.appendChild(other);
      }
    }
    container.appendChild(trigWrap);

    // note input
    const noteWrap = document.createElement('div'); noteWrap.style.flex='1 1 220px';
    const noteInput = document.createElement('input'); noteInput.className='note-input'; noteInput.value = ev.note || '';
    noteInput.addEventListener('change', ()=>{ ev.note = noteInput.value; save(); });
    noteWrap.appendChild(noteInput);
    container.appendChild(noteWrap);

    td2.appendChild(container);
    tr2.appendChild(td2);
    eventsTbody.appendChild(tr2);
  }

  renderVisuals();
  renderTriggerStats();
}

function renderTriggerStats(){
  const container = $('triggerStats');
  if(!container) return;

  // Aggregate triggers
  const counts = new Map();
  let totalTagged = 0;
  const customOthers = new Map();

  for(const ev of events){
    // ev.triggers is array of strings
    if(Array.isArray(ev.triggers) && ev.triggers.length){
      for(const t of ev.triggers){
        counts.set(t, (counts.get(t) || 0) + 1);
        totalTagged++;
      }
    }
    if(ev.otherTrigger && String(ev.otherTrigger).trim()){
      counts.set('Other', (counts.get('Other') || 0) + 1);
      const key = String(ev.otherTrigger).trim();
      customOthers.set(key, (customOthers.get(key) || 0) + 1);
      totalTagged++;
    }
  }

  // Sort triggers by count desc
  const entries = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]);

  container.innerHTML = '';
  if(entries.length === 0){
    container.textContent = 'No triggers logged yet.';
    return;
  }

  const maxCount = entries[0] ? entries[0][1] : 1;

  for(const [name, cnt] of entries){
    const row = document.createElement('div'); row.className = 'trigger-row';
    const nameEl = document.createElement('div'); nameEl.className='trigger-name'; nameEl.textContent = name;
    const barWrap = document.createElement('div'); barWrap.className='trigger-bar';
    const bar = document.createElement('span');
    const pctOfMax = maxCount? (cnt / maxCount) : 0;
    bar.style.width = `${Math.round(pctOfMax*100)}%`;
    barWrap.appendChild(bar);
    // show count and percentage of total tags
    const pct = totalTagged ? Math.round((cnt / totalTagged) * 1000) / 10 : 0; // one decimal
    const countEl = document.createElement('div'); countEl.className='trigger-count'; countEl.textContent = `${cnt} (${pct}%)`;
    row.appendChild(nameEl); row.appendChild(barWrap); row.appendChild(countEl);
    container.appendChild(row);
  }

  if(customOthers.size){
    const extra = document.createElement('div'); extra.className='trigger-extra';
    const list = Array.from(customOthers.entries()).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} (${v})`).join(', ');
    extra.textContent = `Other details: ${list}`;
    container.appendChild(extra);
  }
}


function countSince(days){
  const now = Date.now();
  const cutoff = now - days*24*60*60*1000;
  let left = 0, right = 0;
  for(const ev of events){
    const t = new Date(ev.start).getTime();
    if(t >= cutoff){ if(ev.side === 'Left' || ev.side === 'left') left++; else right++; }
  }
  return {left,right};
}

// Discrete thresholds and colors (green / yellow / red)
const COLOR_GREEN = '#16a34a'; // green-600
const COLOR_YELLOW = '#f59e0b'; // amber-500
const COLOR_RED = '#ef4444'; // red-500

// thresholds: counts <= greenMax => green; <= yellowMax => yellow; else red
const THRESHOLDS = {
  day: { greenMax: 0, yellowMax: 2 },    // 0 green, 1-2 yellow, >=3 red
  week: { greenMax: 1, yellowMax: 6 },   // 0-1 green, 2-6 yellow, >=7 red
  month: { greenMax: 3, yellowMax: 15 }  // 0-3 green, 4-15 yellow, >=16 red
};

function pickColorForWindow(count, window){
  const th = THRESHOLDS[window] || THRESHOLDS.month;
  if(count <= th.greenMax) return COLOR_GREEN;
  if(count <= th.yellowMax) return COLOR_YELLOW;
  return COLOR_RED;
}

function renderVisuals(){
  // counts for day(1), week(7), month(30)
  const d1 = countSince(1);
  const d7 = countSince(7);
  const d30 = countSince(30);

  // day
  $('count-day').textContent = `${d1.left + d1.right}`;
  $('left-day-ear').setAttribute('fill', pickColorForWindow(d1.left, 'day'));
  $('right-day-ear').setAttribute('fill', pickColorForWindow(d1.right, 'day'));

  // week
  $('count-week').textContent = `${d7.left + d7.right}`;
  $('left-week-ear').setAttribute('fill', pickColorForWindow(d7.left, 'week'));
  $('right-week-ear').setAttribute('fill', pickColorForWindow(d7.right, 'week'));

  // month
  $('count-month').textContent = `${d30.left + d30.right}`;
  $('left-month-ear').setAttribute('fill', pickColorForWindow(d30.left, 'month'));
  $('right-month-ear').setAttribute('fill', pickColorForWindow(d30.right, 'month'));

  // update legend text to show thresholds
  const legend = document.querySelector('.vis-legend');
  if(legend){
    legend.textContent = `Legend: Day — 0 green, 1–2 yellow, ≥3 red. Week — 0–1 green, 2–6 yellow, ≥7 red. Month — 0–3 green, 4–15 yellow, ≥16 red.`;
  }
}

function toggle(side){
  if(ongoing[side]){
    // stop
    const start = new Date(ongoing[side]);
    const end = new Date();
    const duration = (end - start)/1000;
    const ev = { id: `${Date.now()}-${Math.floor(Math.random()*1e6)}`, side, start: start.toISOString(), end: end.toISOString(), duration, note: '', intensity: null, triggers: [], otherTrigger: '' };
    events.unshift(ev);
    delete ongoing[side];
  } else {
    // start
    ongoing[side] = new Date().toISOString();
  }
  save(); render();
}

leftBtn.addEventListener('click', ()=>toggle('left'));
rightBtn.addEventListener('click', ()=>toggle('right'));

document.addEventListener('keydown', (e)=>{
  if(e.key==='ArrowLeft'){ e.preventDefault(); toggle('left'); }
  if(e.key==='ArrowRight'){ e.preventDefault(); toggle('right'); }
});

  exportBtn.addEventListener('click', ()=>{
  // ensure each event has a stable unique id before export
  let changed = false;
  for(const ev of events){
    if(!ev.id){ ev.id = `${Date.now()}-${Math.floor(Math.random()*1e6)}`; changed = true; }
  }
  if(changed) save();

  const rows = [['id','side','start','end','duration_seconds','intensity','triggers','note']];
  for(const ev of events){
    const triggers = (Array.isArray(ev.triggers) ? ev.triggers : (ev.triggers?String(ev.triggers).split(';'):[])).slice();
    if(ev.otherTrigger) triggers.push(`Other:${ev.otherTrigger}`);
    rows.push([ev.id, ev.side, ev.start, ev.end||'', ev.duration!=null?Math.round(ev.duration):'', ev.intensity!=null?ev.intensity:'', triggers.join(';'), (ev.note||'').replace(/\n/g,' ')]);
  }
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='ttracker-events.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

clearBtn.addEventListener('click', ()=>{
  if(confirm('Clear all saved events and ongoing sessions?')){
    events = []; ongoing = {}; save(); render();
  }
});

// update timers every second when active
// update timers frequently so milliseconds appear smooth
setInterval(()=>{
  if(ongoing.left || ongoing.right) render();
}, 50);

// initial render
render();

// fold toggle for 'What is tinnitus?'
(() => {
  const btn = document.querySelector('.fold-toggle');
  const content = document.querySelector('.fold-content');
  if(!btn || !content) return;
  btn.addEventListener('click', ()=>{
    const opened = !content.hidden;
    content.hidden = opened;
    btn.setAttribute('aria-expanded', String(!opened));
    btn.classList.toggle('open', !opened);
    // change glyph
    btn.textContent = (opened ? '▶ What is tinnitus?' : '▼ What is tinnitus?');
  });
})();
