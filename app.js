/* Posts + Research app
   Responsibilities:
   - Manage posts (localStorage)
   - Load research library from /data/studies.json (public sources)
   - Render UI: posts grid, research grid, modal details
*/

const STORAGE_KEY = 'onlyfacts_posts_v1'

function loadPosts(){ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw?JSON.parse(raw):[] }catch(e){return[]}}
function savePosts(posts){ localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)) }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8) }

function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]) }

/* Posts rendering */
function renderPosts(filter=''){
  const container = document.getElementById('posts')
  const posts = loadPosts().filter(p=> (p.title+p.summary+p.content).toLowerCase().includes(filter.toLowerCase()))
  if(!posts.length){ container.innerHTML = '<p>אין פוסטים להצגה</p>'; return }
  container.innerHTML = ''
  posts.forEach(p=>{
    const el = document.createElement('article'); el.className='post'; el.dataset.id=p.id
    const src = p.source? `<a class="link" href="${escapeHtml(p.source)}" target="_blank" rel="noopener">מקור</a>` : ''
    el.innerHTML = `
      <h3>${escapeHtml(p.title)}</h3>
      <div class="meta">${escapeHtml(p.date)} • ${escapeHtml(p.summary||'')}</div>
      <p>${escapeHtml(p.content)}</p>
      <div class="actions">${src} <button data-action="delete">מחק</button></div>
    `
    container.appendChild(el)
  })
}

/* Research library */
let studies = []
async function loadStudies(){
  try{
    const res = await fetch('data/studies.json')
    studies = await res.json()
  }catch(e){ studies = [] }
}

function renderYearFilter(){
  const sel = document.getElementById('yearFilter')
  const years = Array.from(new Set(studies.map(s=>s.year))).sort((a,b)=>b-a)
  years.forEach(y=>{ const opt = document.createElement('option'); opt.value=y; opt.textContent=y; sel.appendChild(opt) })
}

function renderStudies(filter=''){
  const container = document.getElementById('researchList')
  const year = document.getElementById('yearFilter').value
  let list = studies.slice()
  if(year) list = list.filter(s=>String(s.year)===String(year))
  if(filter) list = list.filter(s=>(s.title+s.authors+s.summary).toLowerCase().includes(filter.toLowerCase()))
  if(!list.length){ container.innerHTML='<p>לא נמצאו מחקרים.</p>'; return }
  container.innerHTML = ''
  list.forEach(s=>{
    const el = document.createElement('div'); el.className='research-item'
    el.innerHTML = `
      <h4>${escapeHtml(s.title)}</h4>
      <div class="meta">${escapeHtml(s.authors)} • ${escapeHtml(s.year)}</div>
      <p>${escapeHtml(s.summary.slice(0,240))}${s.summary.length>240? '…':''}</p>
      <div class="research-actions">
        <button data-id="${s.id}" class="view">הצג</button>
        ${s.source?`<a class="link" href="${escapeHtml(s.source)}" target="_blank" rel="noopener">קישור למקור</a>`:''}
      </div>
    `
    container.appendChild(el)
  })
}

function openModal(html){
  const modal = document.getElementById('modal')
  const body = document.getElementById('modalBody')
  body.innerHTML = html
  modal.setAttribute('aria-hidden','false')
}
function closeModal(){ document.getElementById('modal').setAttribute('aria-hidden','true') }

document.addEventListener('DOMContentLoaded',async()=>{
  // Posts init
  const form = document.getElementById('postForm')
  const search = document.getElementById('search')
  if(!loadPosts().length){
    const sample = [{id:uid(),title:'הדגמה: מיומנות בדיקת עובדות',summary:'איך לבדוק טענה במהירות',content:'דוגמה קצרה: בדיקה מול מקורות אמינים, חיפוש peer-reviewed, ושימוש בתיעוד רשמי.',source:'https://example.com',date:new Date().toLocaleString()}]
    savePosts(sample)
  }
  renderPosts()

  form.addEventListener('submit',e=>{
    e.preventDefault()
    const posts = loadPosts()
    const p = { id: uid(), title: document.getElementById('title').value.trim(), summary: document.getElementById('summary').value.trim(), content: document.getElementById('content').value.trim(), source: document.getElementById('source').value.trim(), date: new Date().toLocaleString() }
    posts.unshift(p); savePosts(posts); form.reset(); renderPosts(search.value)
  })

  document.getElementById('posts').addEventListener('click',e=>{
    const btn = e.target.closest('button'); if(!btn) return
    const art = e.target.closest('.post')
    if(btn.dataset.action === 'delete' && art){ const id = art.dataset.id; const posts = loadPosts().filter(p=>p.id!==id); savePosts(posts); renderPosts(search.value) }
  })

  document.getElementById('clearAll').addEventListener('click',()=>{ if(confirm('להסיר את כל הפוסטים? פעולה זו בלתי הפיכה')){ localStorage.removeItem(STORAGE_KEY); renderPosts() } })
  search.addEventListener('input',e=> renderPosts(e.target.value))

  // Research init
  await loadStudies()
  renderYearFilter()
  renderStudies()

  document.getElementById('researchList').addEventListener('click',e=>{
    const btn = e.target.closest('button.view'); if(!btn) return
    const id = btn.dataset.id; const s = studies.find(x=>x.id===id)
    if(!s) return
    const html = `
      <h3>${escapeHtml(s.title)}</h3>
      <div class="meta">${escapeHtml(s.authors)} • ${escapeHtml(s.year)}</div>
      <p>${escapeHtml(s.summary)}</p>
      ${s.source?`<p><a class="link" href="${escapeHtml(s.source)}" target="_blank" rel="noopener">עיין במקור</a></p>`:''}
    `
    openModal(html)
  })

  document.getElementById('modalClose').addEventListener('click',closeModal)
  document.getElementById('modal').addEventListener('click',e=>{ if(e.target.id==='modal') closeModal() })

  document.getElementById('researchSearch').addEventListener('input',e=>renderStudies(e.target.value))
  document.getElementById('yearFilter').addEventListener('change',()=>renderStudies(document.getElementById('researchSearch').value))
})

