/* Tinnitus Tracker — single-file app logic */
(function(){
  const STORAGE_KEY = 'tinnitus_episodes_v1';
  const HINT_KEY = 'tinnitus_used_keyboard';
  const REMIND_KEY = 'tinnitus_reminder_dismissed';

  let episodes = loadEpisodes();
  const ongoing = { left: null, right: null };
  let ticker = null;

  const els = {
    btnLeft: document.getElementById('btn-left'),
    btnRight: document.getElementById('btn-right'),
    activeBanner: document.getElementById('active-banner'),
    episodes: document.getElementById('episodes'),
    exportBtn: document.getElementById('export-btn'),
    clearBtn: document.getElementById('clear-btn'),
    summary: document.getElementById('summary'),
    keyboardHint: document.getElementById('keyboard-hint'),
    exportReminder: document.getElementById('export-reminder'),
    dismissReminder: document.getElementById('dismiss-reminder')
  };

  function loadEpisodes(){
    try{ const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): [] }catch(e){return []}
  }
  function saveEpisodes(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(episodes)); render(); }

  function formatDuration(ms){
    const s = Math.floor(ms/1000); const mm = Math.floor(s/60); const ss = s%60; const msPart = Math.floor((ms%1000)/10);
    return `${pad(mm)}:${pad(ss)}.${pad(msPart,2)}`;
  }
  function pad(n,len=2){return String(n).padStart(len,'0')}

  function startEar(ear){
    if(ongoing[ear]) return; // already
    ongoing[ear] = { startTime: Date.now() };
    ensureTicker();
    updateKeyboardHintUsed();
    render();
  }
  function stopEar(ear){
    const o = ongoing[ear]; if(!o) return;
    const now = Date.now(); const duration = now - o.startTime;
    const ep = {
      id: now + Math.floor(Math.random()*9999),
      ear, startTime: o.startTime, duration,
      intensity:'', sound:'', triggers:[], notes:''
    };
    episodes.unshift(ep);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(episodes));
    ongoing[ear] = null;
    cleanupTickerIfIdle();
    render();
  }

  function toggleEar(ear){ if(ongoing[ear]) stopEar(ear); else startEar(ear); }

  function ensureTicker(){ if(ticker) return; ticker = setInterval(render,100); }
  function cleanupTickerIfIdle(){ if(!ongoing.left && !ongoing.right && ticker){ clearInterval(ticker); ticker=null } }

  function renderSummary(){
    const today = Date.now() - 24*60*60*1000;
    const dayCount = episodes.filter(e=>e.startTime>=today).length;
    els.summary.textContent = `${episodes.length} total · ${dayCount} in last 24h`;
  }

  function renderActiveBanner(){
    const active = [];
    ['left','right'].forEach(ear=>{
      if(ongoing[ear]){
        const elapsed = Date.now() - ongoing[ear].startTime;
        active.push(`${ear} ${formatDuration(elapsed)}`);
      }
    });
    if(active.length){ els.activeBanner.classList.remove('hidden'); els.activeBanner.textContent = `Recording: ${active.join(' • ')}`; }
    else els.activeBanner.classList.add('hidden');
  }

  function renderButtons(){
    ['left','right'].forEach(ear=>{
      const el = ear==='left'? els.btnLeft: els.btnRight;
      if(ongoing[ear]){
        el.classList.add('active'); const elapsed = Date.now() - ongoing[ear].startTime; el.textContent = (ear==='left'? '← Left ' : 'Right → ') + formatDuration(elapsed);
      } else { el.classList.remove('active'); el.textContent = ear==='left'? '← Left':'Right →'; }
    });
  }

  function renderEpisodes(){
    els.episodes.innerHTML = episodes.map(e=>{
      const time = new Date(e.startTime).toLocaleString();
      return `
      <article class="card" data-id="${e.id}">
        <div>
          <div class="meta"><strong>${e.ear}</strong> • ${time} • <span class="small">${formatDuration(e.duration)}</span></div>
          <div class="controls-row">
            <label class="small">Intensity:
              <select class="intensity" value="${e.intensity}">
                <option value="">-</option>
                ${[...Array(10)].map((_,i)=>`<option value="${i+1}" ${e.intensity===(i+1).toString()?'selected':''}>${i+1}</option>`).join('')}
              </select>
            </label>
            <label class="small">Sound:
              <select class="sound">
                <option value="">-</option>
                ${['ringing','buzzing','hissing','whistling','humming','clicking','roaring','static','pulsing','musical'].map(s=>`<option value="${s}" ${e.sound===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </label>
            <button class="delete small danger">Delete</button>
          </div>
          <div style="margin-top:8px">
            <textarea class="note" placeholder="Notes">${escapeHtml(e.notes||'')}</textarea>
          </div>
        </div>
        <div style="min-width:120px;display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <div class="small">Triggers</div>
          <div class="triggers" data-triggers="${(e.triggers||[]).join(',')}">
            ${['caffeine','alcohol','salt/sodium','stress','lack of sleep','loud noise','flying','exercise','medication','screen time','gluten','dairy'].map(t=>`<button class="pill trigger ${e.triggers.includes(t)?'active':''}" data-trigger="${t}">${t}</button>`).join('')}
          </div>
        </div>
      </article>`;
    }).join('');

    // attach listeners
    document.querySelectorAll('.card').forEach(card=>{
      const id = Number(card.dataset.id);
      const ep = episodes.find(x=>x.id===id);
      card.querySelector('.intensity').addEventListener('change', e=>{ ep.intensity = e.target.value; saveEpisodes(); });
      card.querySelector('.sound').addEventListener('change', e=>{ ep.sound = e.target.value; saveEpisodes(); });
      card.querySelector('.note').addEventListener('input', e=>{ ep.notes = e.target.value; saveEpisodes(); });
      card.querySelector('.delete').addEventListener('click', ()=>{ if(confirm('Delete this episode?')){ episodes = episodes.filter(x=>x.id!==id); saveEpisodes(); }});
      card.querySelectorAll('.trigger').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const t = btn.dataset.trigger; const idx = ep.triggers.indexOf(t);
          if(idx>=0) ep.triggers.splice(idx,1); else ep.triggers.push(t);
          saveEpisodes();
        });
      });
    });
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function render(){ renderSummary(); renderActiveBanner(); renderButtons(); renderEpisodes(); renderExportReminder(); }

  function exportCSV(){
    const rows = [['id','timestamp','ear','duration_ms','intensity','sound','triggers','notes']];
    episodes.slice().reverse().forEach(e=>{
      rows.push([e.id,new Date(e.startTime).toISOString(),e.ear,e.duration,e.intensity||'',''+(e.sound||''),`"${(e.triggers||[]).join(';')}"`,`"${(e.notes||'').replace(/"/g,'""')}"`]);
    });
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0,10);
    a.href = url; a.download = `tinnitus-log-${date}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function renderExportReminder(){
    const dismissed = localStorage.getItem(REMIND_KEY);
    if(episodes.length>=10 && !dismissed){ els.exportReminder.classList.remove('hidden'); }
    else els.exportReminder.classList.add('hidden');
  }

  function updateKeyboardHintUsed(){
    if(!localStorage.getItem(HINT_KEY)){
      localStorage.setItem(HINT_KEY,'1'); els.keyboardHint.classList.add('hidden');
    }
  }

  // initial hint state
  if(localStorage.getItem(HINT_KEY)) els.keyboardHint.classList.add('hidden');

  // event wiring
  els.btnLeft.addEventListener('click', ()=>{ toggleEar('left'); });
  els.btnRight.addEventListener('click', ()=>{ toggleEar('right'); });
  els.exportBtn.addEventListener('click', ()=>exportCSV());
  els.clearBtn.addEventListener('click', ()=>{
    if(confirm('Clear all stored episodes? This cannot be undone.')){ episodes=[]; saveEpisodes(); localStorage.removeItem(REMIND_KEY); }
  });
  els.dismissReminder.addEventListener('click', ()=>{ localStorage.setItem(REMIND_KEY,'1'); renderExportReminder(); });

  document.addEventListener('keydown', e=>{
    if(e.key==='ArrowLeft'){ toggleEar('left'); updateKeyboardHintUsed(); }
    if(e.key==='ArrowRight'){ toggleEar('right'); updateKeyboardHintUsed(); }
  });

  // initial render
  render();

  // expose for dev console
  window._tinnitus = { episodes, startEar, stopEar, toggleEar, exportCSV };

})();
