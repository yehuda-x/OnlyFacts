/* OnlyFacts - Fact Checking Platform
   Core Features:
   - User-generated posts with localStorage persistence
   - Research library with public studies and sources
   - Rich modal display with formatted content
   - Real-time search and filtering
*/

const STORAGE_KEY = 'onlyfacts_posts_v1'

/* Utilities */
function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch(e) { return [] }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function escapeHtml(s) {
  return (s || '').toString().replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c])
}

function formatDate(date) {
  if (typeof date === 'string') return date
  return new Date(date).toLocaleString('he-IL')
}

/* Posts Management */
function renderPosts(filter = '') {
  const container = document.getElementById('posts')
  const posts = loadPosts().filter(p =>
    (p.title + p.summary + p.content).toLowerCase().includes(filter.toLowerCase())
  )

  if (!posts.length) {
    container.innerHTML = '<p>אין פוסטים להצגה. היו הראשון לפרסם!</p>'
    return
  }

  container.innerHTML = ''
  posts.forEach(p => {
    const el = document.createElement('article')
    el.className = 'post'
    el.dataset.id = p.id

    const src = p.source
      ? `<a class="link" href="${escapeHtml(p.source)}" target="_blank" rel="noopener">🔗 קישור</a>`
      : ''

    const preview = p.content.length > 150
      ? escapeHtml(p.content.slice(0, 150)) + '...'
      : escapeHtml(p.content)

    el.innerHTML = `
      <h3>${escapeHtml(p.title)}</h3>
      <div class="meta">📅 ${escapeHtml(formatDate(p.date))}</div>
      ${p.summary ? `<div class="meta" style="color: var(--text); margin: 6px 0;">📝 ${escapeHtml(p.summary)}</div>` : ''}
      <p>${preview}</p>
      <div class="actions">
        ${src}
        <button data-action="delete" title="מחק פוסט זה">🗑️ מחק</button>
      </div>
    `
    container.appendChild(el)
  })
}

/* Research Library */
let studies = []

async function loadStudies() {
  try {
    const res = await fetch('data/studies.json')
    studies = await res.json()
  } catch(e) {
    console.error('Failed to load studies:', e)
    studies = []
  }
}

function renderYearFilter() {
  const sel = document.getElementById('yearFilter')
  if (!studies.length) return

  const years = Array.from(new Set(studies.map(s => s.year))).sort((a, b) => b - a)
  years.forEach(y => {
    const opt = document.createElement('option')
    opt.value = y
    opt.textContent = y
    sel.appendChild(opt)
  })
}

function renderStudies(filter = '') {
  const container = document.getElementById('researchList')
  const year = document.getElementById('yearFilter').value

  let list = studies.slice()
  if (year) list = list.filter(s => String(s.year) === String(year))
  if (filter) list = list.filter(s =>
    (s.title + s.authors + s.summary).toLowerCase().includes(filter.toLowerCase())
  )

  if (!list.length) {
    container.innerHTML = '<p>לא נמצאו מחקרים התואמים לחיפוש.</p>'
    return
  }

  container.innerHTML = ''
  list.forEach(s => {
    const el = document.createElement('div')
    el.className = 'research-item'

    const preview = s.summary.length > 200
      ? escapeHtml(s.summary.slice(0, 200)) + '...'
      : escapeHtml(s.summary)

    el.innerHTML = `
      <h4>${escapeHtml(s.title)}</h4>
      <div class="meta">👤 ${escapeHtml(s.authors)} | 📅 ${escapeHtml(s.year)}</div>
      <p>${preview}</p>
      <div class="research-actions">
        <button data-id="${s.id}" class="view">👁️ פתח</button>
        ${s.source ? `<a class="link" href="${escapeHtml(s.source)}" target="_blank" rel="noopener">🔗 מקור</a>` : ''}
      </div>
    `
    container.appendChild(el)
  })
}

/* Modal Management */
function openModal(html) {
  const modal = document.getElementById('modal')
  const body = document.getElementById('modalBody')
  body.innerHTML = html
  modal.setAttribute('aria-hidden', 'false')
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  document.getElementById('modal').setAttribute('aria-hidden', 'true')
  document.body.style.overflow = 'auto'
}

/* Rich Modal Content */
function renderStudyModal(study) {
  const html = `
    <h3>📊 ${escapeHtml(study.title)}</h3>
    <div class="meta">👤 ${escapeHtml(study.authors)} | 📅 ${escapeHtml(study.year)}</div>

    <h4>📋 תקציר</h4>
    <p>${escapeHtml(study.summary)}</p>

    ${study.details ? `
      <h4>🔍 פרטים נוספים</h4>
      ${typeof study.details === 'string' ? `<p>${escapeHtml(study.details)}</p>` : ''}
    ` : ''}

    ${study.source ? `
      <h4>🔗 מקורות</h4>
      <p><a class="link" href="${escapeHtml(study.source)}" target="_blank" rel="noopener">📎 קישור למקור</a></p>
    ` : ''}

    <h4>📌 מילות מפתח</h4>
    <ul>
      <li>שנה: ${escapeHtml(study.year)}</li>
      <li>מחבר: ${escapeHtml(study.authors)}</li>
      <li>סוג: מחקר/דוקומנטציה אמינה</li>
    </ul>
  `
  openModal(html)
}

/* Event Listeners & Initialization */
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('postForm')
  const search = document.getElementById('search')
  const contentTA = document.getElementById('content')
  const contentCount = document.getElementById('contentCount')

  /* Character Counter */
  if (contentTA && contentCount) {
    contentTA.addEventListener('input', e => {
      contentCount.textContent = e.target.value.length
    })
  }

  /* Posts Initialization */
  if (!loadPosts().length) {
    const sample = [{
      id: uid(),
      title: '🎯 הדגמה: מיומנות בדיקת עובדות',
      summary: 'איך לבדוק טענה במהירות',
      content: 'דוגמה קצרה להראות מקוריות: בדיקה מול מקורות אמינים, חיפוש peer-reviewed, ושימוש בתיעוד רשמי עם אימות מול בסיסי נתונים מוגדרים ומהימנים בעולם.',
      source: 'https://example.com',
      date: new Date().toLocaleString()
    }]
    savePosts(sample)
  }
  renderPosts()

  /* Post Form Handler */
  form.addEventListener('submit', e => {
    e.preventDefault()
    const posts = loadPosts()
    const p = {
      id: uid(),
      title: document.getElementById('title').value.trim(),
      summary: document.getElementById('summary').value.trim(),
      content: document.getElementById('content').value.trim(),
      source: document.getElementById('source').value.trim(),
      date: formatDate(new Date())
    }

    if (!p.title || !p.content) {
      alert('נא למלא לפחות כותרת ותוכן')
      return
    }

    posts.unshift(p)
    savePosts(posts)
    form.reset()
    contentCount.textContent = '0'
    renderPosts(search.value)
    alert('✅ הפוסט פורסם בהצלחה!')
  })

  /* Post List Events */
  document.getElementById('posts').addEventListener('click', e => {
    const btn = e.target.closest('button')
    if (!btn) return

    const art = e.target.closest('.post')
    if (btn.dataset.action === 'delete' && art) {
      if (confirm('הסר פוסט זה?')) {
        const id = art.dataset.id
        const posts = loadPosts().filter(p => p.id !== id)
        savePosts(posts)
        renderPosts(search.value)
        alert('✅ הפוסט הוסר')
      }
    }
  })

  /* Clear All Handler */
  document.getElementById('clearAll').addEventListener('click', () => {
    if (confirm('להסיר את כל הפוסטים? פעולה זו בלתי הפיכה')) {
      localStorage.removeItem(STORAGE_KEY)
      renderPosts()
      alert('✅ כל הפוסטים הוסרו')
    }
  })

  /* Search Handler */
  search.addEventListener('input', e => renderPosts(e.target.value))

  /* Research Library Initialization */
  await loadStudies()
  renderYearFilter()
  renderStudies()

  /* Research Item Click Handler */
  document.getElementById('researchList').addEventListener('click', e => {
    const btn = e.target.closest('button.view')
    if (!btn) return

    const id = btn.dataset.id
    const s = studies.find(x => x.id === id)
    if (!s) return

    renderStudyModal(s)
  })

  /* Modal Events */
  document.getElementById('modalClose').addEventListener('click', closeModal)
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal()
  })

  /* Research Search */
  document.getElementById('researchSearch').addEventListener('input', e =>
    renderStudies(e.target.value)
  )

  document.getElementById('yearFilter').addEventListener('change', () =>
    renderStudies(document.getElementById('researchSearch').value)
  )

  /* Keyboard Events */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal()
  })
})


