/* ============================================================
   MAIN.JS — أ. محمد القحطاني
   النظام: كل مقال/ملف/دورة في JSON مستقل داخل مجلده
   القراءة: GitHub Contents API → لا manifest مطلوب
   ============================================================ */

// ── Dark Mode ─────────────────────────────────────────────────
const toggleDark = () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.querySelectorAll('.btn-dark-toggle').forEach(b => b.textContent = next === 'dark' ? '☀️' : '🌙');
};
const initTheme = () => {
  const t = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.btn-dark-toggle').forEach(b => b.textContent = t === 'dark' ? '☀️' : '🌙');
};

// ── Loader ────────────────────────────────────────────────────
const initLoader = () => {
  const l = document.getElementById('page-loader');
  if (l) setTimeout(() => l.classList.add('hidden'), 700);
};

// ── Nav ───────────────────────────────────────────────────────
const initNav = () => {
  const nav = document.querySelector('.nav');
  if (nav) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 80), { passive: true });
};

// ── Mobile Drawer ─────────────────────────────────────────────
const initMobileDrawer = () => {
  const h = document.querySelector('.nav-hamburger');
  const d = document.querySelector('.mobile-drawer');
  const o = document.querySelector('.mobile-drawer-overlay');
  if (!h || !d) return;
  h.addEventListener('click', () => d.classList.toggle('open'));
  o?.addEventListener('click', () => d.classList.remove('open'));
  d.querySelectorAll('a').forEach(a => a.addEventListener('click', () => d.classList.remove('open')));
};

// ── Search Overlay ────────────────────────────────────────────
const initSearch = () => {
  const ov = document.querySelector('.search-overlay');
  if (!ov) return;
  document.querySelectorAll('.btn-nav-search').forEach(b => {
    b.addEventListener('click', () => {
      ov.classList.toggle('open');
      if (ov.classList.contains('open')) ov.querySelector('.search-input')?.focus();
    });
  });
  ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') ov.classList.remove('open'); });
};

// ── Scroll Reveal ─────────────────────────────────────────────
const initReveal = () => {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
};

// ── Stats Counter ─────────────────────────────────────────────
const initStats = () => {
  const wrap = document.querySelector('.hero-stats');
  if (!wrap) return;
  let done = false;
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || done) return; done = true;
    wrap.querySelectorAll('.stat-num[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target), suffix = el.dataset.suffix || '';
      let i = 0;
      const t = setInterval(() => {
        i++; el.textContent = Math.round(target * (1 - Math.pow(1 - i/30, 2))) + suffix;
        if (i >= 30) { el.textContent = target + suffix; clearInterval(t); }
      }, 1400/30);
    });
  }, { threshold: 0.4 }).observe(wrap);
};

// ── Reading Bar ───────────────────────────────────────────────
const initReadingBar = () => {
  const bar = document.querySelector('.reading-bar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const d = document.documentElement;
    bar.style.transform = `scaleX(${scrollY / (d.scrollHeight - d.clientHeight)})`;
  }, { passive: true });
};

// ── Contact Form ──────────────────────────────────────────────
const initContactForm = () => {
  const form = document.querySelector('.contact-form form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.textContent = '✓ تم الإرسال بنجاح'; btn.style.background = '#22c55e';
    setTimeout(() => { btn.textContent = 'إرسال الرسالة'; btn.style.background = ''; form.reset(); }, 3000);
  });
};

// ── Filter Chips ──────────────────────────────────────────────
const initChips = (sel, cb) => {
  const c = document.querySelector(sel);
  if (!c) return;
  c.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      c.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      chip.classList.add('active'); cb(chip.dataset.value || chip.textContent.trim());
    });
  });
};

// ── Category Sidebar ──────────────────────────────────────────
const initCategorySidebar = cb => {
  document.querySelectorAll('.cat-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active'); cb(item.dataset.cat || 'الكل');
    });
  });
};

// ══════════════════════════════════════════════════════════════
// DATA LAYER — القلب الأساسي
// يقرأ من data/articles/*.json عبر GitHub Contents API
// ══════════════════════════════════════════════════════════════

const REPO   = 'psyalqahtani/mohammed-website';
const BRANCH = 'main';
const GH_API = 'https://api.github.com/repos/' + REPO + '/contents/';

// cache لتفادي طلبات متكررة
const _cache = {};

/**
 * يجيب قائمة كل ملفات JSON في مجلد معين من GitHub
 * ثم يحمّل كل ملف ويُعيد مصفوفة من الكائنات
 */
const fetchFolder = async (folder) => {
  if (_cache[folder]) return _cache[folder];
  try {
    // ١. قائمة الملفات
    const listRes = await fetch(`${GH_API}${folder}?ref=${BRANCH}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!listRes.ok) return [];
    const files = await listRes.json();

    // ٢. حمّل كل ملف JSON
    const jsonFiles = files.filter(f => f.name.endsWith('.json') && f.name !== 'manifest.json');
    const items = await Promise.all(
      jsonFiles.map(f =>
        fetch(f.download_url).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    );
    const result = items.filter(Boolean);
    _cache[folder] = result;
    return result;
  } catch(e) {
    return [];
  }
};

// الحصول على base path حسب الصفحة الحالية
const getBase = () => {
  const p = window.location.pathname;
  return (p.includes('/blog/') || p.includes('/library/') ||
          p.includes('/courses/') || p.includes('/contact/') ||
          p.includes('/about/')) ? '../' : '';
};

// ══════════════════════════════════════════════════════════════
// CARDS — بناء بطاقات HTML
// ══════════════════════════════════════════════════════════════

const articleCard = (a, linkPrefix = '') => `
  <article class="article-card reveal">
    <div class="article-card-img">
      ${a.image
        ? `<img src="${a.image}" alt="${a.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover">`
        : `<div class="article-card-img-placeholder">📝</div>`}
      <span class="article-card-cat" style="background:${a.categoryColor||'#1B2D4F'}">${a.category||''}</span>
    </div>
    <div class="article-card-body">
      <h3 class="article-card-title">
        <a href="${linkPrefix}article.html?slug=${a.slug||''}" style="color:inherit">${a.title||''}</a>
      </h3>
      <p class="article-card-excerpt">${a.excerpt||''}</p>
      <div class="article-card-meta">
        <span>${a.readTime||''}</span><span>${a.date||''}</span>
      </div>
    </div>
  </article>`;

const fileCard = f => `
  <div class="file-card reveal">
    ${f.image
      ? `<img src="${f.image}" alt="${f.title}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:12px">`
      : `<div class="file-icon" style="background:${f.color||'#3D9B8F'}">${f.type||'PDF'}</div>`}
    <h4 class="file-title">${f.title||''}</h4>
    <p class="file-desc">${f.description||''}</p>
    <div class="file-meta">${f.size||''} · ${f.date||''}</div>
    ${f.file
      ? `<a href="${f.file}" class="btn-download" download>تحميل ↓</a>`
      : `<button class="btn-download">تحميل ↓</button>`}
  </div>`;

const courseCard = c => `
  <div class="course-card reveal">
    <div class="course-card-img" style="${c.image ? `background:url(${c.image}) center/cover` : ''}">
      <span class="course-card-status" style="background:${c.statusColor||'#B8976A'}">${c.status||''}</span>
    </div>
    <div class="course-card-body">
      <h4 class="course-card-title">${c.title||''}</h4>
      <p class="course-card-desc">${c.description||''}</p>
      <div class="course-card-meta">${c.date||''} · ${c.duration||''} · ${c.mode||''}</div>
      <button class="btn-primary" style="font-size:14px;padding:10px 24px">
        ${c.status === 'منتهٍ' ? 'عرض التفاصيل' : 'التسجيل الآن'}
      </button>
    </div>
  </div>`;

// ══════════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ══════════════════════════════════════════════════════════════

const renderArticles = async (container, filter = 'الكل', searchQ = '') => {
  if (!container) return;
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-text-mid)">جارٍ التحميل...</div>`;
  try {
    let data = await fetchFolder('data/articles');
    // ترتيب تنازلي حسب id
    data.sort((a, b) => (b.id||0) - (a.id||0));
    let filtered = data.filter(a =>
      (filter === 'الكل' || a.category === filter) &&
      (!searchQ || a.title?.includes(searchQ) || a.excerpt?.includes(searchQ))
    );
    const isHome = container.id === 'home-articles-grid';
    if (isHome) filtered = filtered.slice(0, 3);
    const linkPrefix = isHome ? 'blog/' : '';
    container.innerHTML = filtered.length
      ? filtered.map(a => articleCard(a, linkPrefix)).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--color-text-mid)">لا توجد مقالات</div>`;
    initReveal();
  } catch(e) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-text-mid)">تعذّر التحميل</div>`;
  }
};

const renderFiles = async (container, filter = 'الكل', searchQ = '') => {
  if (!container) return;
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-text-mid)">جارٍ التحميل...</div>`;
  try {
    let data = await fetchFolder('data/library');
    data.sort((a, b) => (b.id||0) - (a.id||0));
    let filtered = data.filter(f =>
      (filter === 'الكل' || f.category === filter) &&
      (!searchQ || f.title?.includes(searchQ) || f.description?.includes(searchQ))
    );
    if (container.id === 'home-files-grid') filtered = filtered.slice(0, 4);
    container.innerHTML = filtered.length
      ? filtered.map(f => fileCard(f)).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--color-text-mid)">لا توجد ملفات</div>`;
    initReveal();
  } catch(e) {}
};

const renderCourses = async (container, filter = 'الكل') => {
  if (!container) return;
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-text-mid)">جارٍ التحميل...</div>`;
  try {
    let data = await fetchFolder('data/courses');
    const filtered = filter === 'الكل' ? data : data.filter(c => c.status === filter);
    container.innerHTML = filtered.length
      ? filtered.map(c => courseCard(c)).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--color-text-mid)">لا توجد دورات</div>`;
    initReveal();
  } catch(e) {}
};

// ── تحميل مقال مفرد ──────────────────────────────────────────
const loadSingleArticle = async () => {
  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) return;
  try {
    // قراءة مباشرة من GitHub بدون cache
    const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/data/articles/${slug}.json`;
    const res = await fetch(url);
    if (!res.ok) {
      document.getElementById('article-title').textContent = 'المقال غير موجود';
      return;
    }
    const a = await res.json();

    document.title = `${a.title} | أ. محمد القحطاني`;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('article-title', a.title || '');
    set('article-category-bc', a.category || '');

    const cat = document.getElementById('article-category');
    if (cat) { cat.textContent = a.category||''; cat.style.background = a.categoryColor||'#1B2D4F'; }

    const meta = document.getElementById('article-meta');
    if (meta) meta.innerHTML = `
      <span>✍️ ${a.author||'أ. محمد القحطاني'}</span>
      <span>·</span>
      <span>📅 ${a.date||''}</span>
      <span>·</span>
      <span>⏱️ ${a.readTime||''}</span>`;

    const imgWrap = document.getElementById('article-hero-img');
    if (imgWrap && a.image) {
      imgWrap.innerHTML = `<img src="${a.image}" alt="${a.title}" style="width:100%;height:100%;object-fit:cover;border-radius:16px">`;
    }

    const bodyEl = document.getElementById('article-body-content');
    if (bodyEl && a.body) bodyEl.innerHTML = parseMarkdown(a.body);

    if (a.references?.length) {
      const sec  = document.getElementById('article-references');
      const list = document.getElementById('article-refs-list');
      if (sec && list) {
        sec.style.display = 'block';
        list.innerHTML = a.references
          .map(r => `<li>${typeof r === 'string' ? r : (r.ref||'')}</li>`)
          .join('');
      }
    }
  } catch(e) {
    const t = document.getElementById('article-title');
    if (t) t.textContent = 'تعذّر تحميل المقال';
  }
};

// ── Markdown → HTML ───────────────────────────────────────────
const parseMarkdown = (md) => {
  const lines = md.split('\n');
  let html = '', inList = false;
  for (let line of lines) {
    const fmt = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,   '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');

    if      (line.startsWith('### ')) { if(inList){html+='</ul>';inList=false;} html+=`<h3 style="font-family:var(--font-heading);font-weight:700;font-size:20px;color:var(--color-primary);margin:28px 0 10px">${line.slice(4)}</h3>`; }
    else if (line.startsWith('## '))  { if(inList){html+='</ul>';inList=false;} html+=`<h2 style="font-family:var(--font-heading);font-weight:700;font-size:24px;color:var(--color-primary);margin:36px 0 14px">${line.slice(3)}</h2>`; }
    else if (line.startsWith('> '))   { if(inList){html+='</ul>';inList=false;} html+=`<div class="pull-quote">${line.slice(2)}</div>`; }
    else if (line.startsWith('- '))   { if(!inList){html+='<ul style="padding-right:24px;margin:16px 0">'; inList=true;} html+=`<li style="margin-bottom:8px">${fmt.slice(2)}</li>`; }
    else if (line.trim() === '')      { if(inList){html+='</ul>';inList=false;} }
    else { if(inList){html+='</ul>';inList=false;} html+=`<p style="margin-bottom:18px;line-height:1.85;font-size:17px">${fmt}</p>`; }
  }
  if (inList) html += '</ul>';
  return html;
};

// ── تحميل الإعدادات ───────────────────────────────────────────
const loadSettings = async () => {
  try {
    const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/data/settings.json`;
    const s = await fetch(url).then(r => r.ok ? r.json() : null);
    if (!s) return;
    document.querySelectorAll('.nav-logo-name').forEach(el => el.textContent = s.name||'');
    const heroImg = document.querySelector('.hero-photo img');
    if (heroImg && s.photo) heroImg.src = s.photo;
    const heroDesc = document.querySelector('.hero-desc');
    if (heroDesc && s.hero_bio) heroDesc.textContent = s.hero_bio;
  } catch(e) {}
};

// ── مشاركة ────────────────────────────────────────────────────
window.shareArticle = (platform) => {
  const url   = encodeURIComponent(location.href);
  const title = encodeURIComponent(document.title);
  const links = {
    twitter:  `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
    whatsapp: `https://wa.me/?text=${title} ${url}`
  };
  window.open(links[platform], '_blank');
};
window.copyLink = () => {
  navigator.clipboard.writeText(location.href).then(() => {
    const btn = document.querySelector('.share-btn:last-child');
    if (btn) { btn.textContent = '✓ تم النسخ'; setTimeout(() => btn.textContent = 'نسخ الرابط', 2000); }
  });
};

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLoader();
  initNav();
  initMobileDrawer();
  initSearch();
  initReveal();
  initStats();
  initReadingBar();
  initContactForm();
  loadSettings();
  document.querySelectorAll('.btn-dark-toggle').forEach(b => b.addEventListener('click', toggleDark));

  // الرئيسية
  const homeArticles = document.getElementById('home-articles-grid');
  if (homeArticles) renderArticles(homeArticles);
  const homeFiles = document.getElementById('home-files-grid');
  if (homeFiles) renderFiles(homeFiles);

  // المدونة
  const blogGrid = document.getElementById('blog-grid');
  if (blogGrid) {
    let cf = 'الكل', cs = '';
    renderArticles(blogGrid);
    initChips('.filter-chips', v => { cf=v; renderArticles(blogGrid, v, cs); });
    const bs = document.getElementById('blog-search');
    if (bs) bs.addEventListener('input', e => { cs=e.target.value; renderArticles(blogGrid, cf, cs); });
  }

  // المكتبة
  const libGrid = document.getElementById('library-grid');
  if (libGrid) {
    let cc = 'الكل', cs = '';
    renderFiles(libGrid);
    initCategorySidebar(cat => { cc=cat; renderFiles(libGrid, cat, cs); });
    const ls = document.getElementById('library-search');
    if (ls) ls.addEventListener('input', e => { cs=e.target.value; renderFiles(libGrid, cc, cs); });
  }

  // الدورات
  const coursesGrid = document.getElementById('courses-grid');
  if (coursesGrid) {
    renderCourses(coursesGrid);
    initChips('.filter-chips', v => renderCourses(coursesGrid, v));
  }

  // مقال مفرد
  if (window.location.pathname.includes('article.html')) loadSingleArticle();
});
