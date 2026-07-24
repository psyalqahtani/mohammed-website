/* ============================================================
   MAIN.JS — أ. محمد القحطاني
   النظام: يقرأ من data/articles/*.json و data/library/*.json
   ============================================================ */

// ── Dark Mode ─────────────────────────────────────────────────
const toggleDark = () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.querySelectorAll('.btn-dark-toggle').forEach(b => b.textContent = next === 'dark' ? '☀️' : '🌙');
};
const initTheme = () => {
  const t = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
    b.addEventListener('click', () => { ov.classList.toggle('open'); if (ov.classList.contains('open')) ov.querySelector('.search-input')?.focus(); });
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
        i++; const p = 1 - Math.pow(1 - i / 30, 2);
        el.textContent = Math.round(target * p) + suffix;
        if (i >= 30) { el.textContent = target + suffix; clearInterval(t); }
      }, 1400 / 30);
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
// DATA LOADING — يقرأ من ملفات JSON الفردية في data/articles/
// ══════════════════════════════════════════════════════════════

/* قراءة قائمة ملفات JSON من مجلد معين عبر GitHub API أو manifest */
const loadJSONFiles = async (folder, base) => {
  // نحاول نقرأ manifest.json أولاً (قائمة الملفات)
  try {
    const manifest = await fetch(`${base}${folder}/manifest.json`).then(r => r.ok ? r.json() : null);
    if (manifest && Array.isArray(manifest)) {
      const results = await Promise.all(
        manifest.map(f => fetch(`${base}${folder}/${f}`).then(r => r.ok ? r.json() : null))
      );
      return results.filter(Boolean);
    }
  } catch(e) {}

  // fallback: قراءة ملف index.json
  try {
    const index = await fetch(`${base}${folder}/index.json`).then(r => r.ok ? r.json() : null);
    if (index) return Array.isArray(index) ? index : [];
  } catch(e) {}

  return [];
};

/* بناء بطاقة مقال */
const articleCard = (a, linkPrefix = '') => `
  <article class="article-card reveal">
    <div class="article-card-img">
      ${a.image
        ? `<img src="${a.image}" alt="${a.title}" loading="lazy">`
        : `<div class="article-card-img-placeholder">📝</div>`}
      <span class="article-card-cat" style="background:${a.categoryColor||'#1B2D4F'}">${a.category||''}</span>
    </div>
    <div class="article-card-body">
      <h3 class="article-card-title">
        <a href="${linkPrefix}article.html?slug=${a.slug||a.id||''}" style="color:inherit">${a.title}</a>
      </h3>
      <p class="article-card-excerpt">${a.excerpt||''}</p>
      <div class="article-card-meta"><span>${a.readTime||''}</span><span>${a.date||''}</span></div>
    </div>
  </article>`;

/* بناء بطاقة ملف */
const fileCard = f => `
  <div class="file-card reveal">
    ${f.image
      ? `<img src="${f.image}" alt="${f.title}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:12px">`
      : `<div class="file-icon" style="background:${f.color||'#3D9B8F'}">${f.type||'PDF'}</div>`}
    <h4 class="file-title">${f.title}</h4>
    <p class="file-desc">${f.description||''}</p>
    <div class="file-meta">${f.size||''} · ${f.date||''}</div>
    ${f.file
      ? `<a href="${f.file}" class="btn-download" download>تحميل ↓</a>`
      : `<button class="btn-download">تحميل ↓</button>`}
  </div>`;

/* بناء بطاقة دورة */
const courseCard = c => `
  <div class="course-card reveal">
    <div class="course-card-img" style="${c.image ? `background:url(${c.image}) center/cover` : ''}">
      <span class="course-card-status" style="background:${c.statusColor||'#B8976A'}">${c.status||''}</span>
    </div>
    <div class="course-card-body">
      <h4 class="course-card-title">${c.title}</h4>
      <p class="course-card-desc">${c.description||''}</p>
      <div class="course-card-meta">${c.date||''} · ${c.duration||''} · ${c.mode||''}</div>
      <button class="btn-primary" style="font-size:14px;padding:10px 24px">
        ${c.status === 'منتهٍ' ? 'عرض التفاصيل' : 'التسجيل الآن'}
      </button>
    </div>
  </div>`;

// ── Render Articles ────────────────────────────────────────────
const renderArticles = async (container, filter = 'الكل', searchQ = '') => {
  if (!container) return;
  const isHome = container.id === 'home-articles-grid';
  const base = isHome ? '' : '../';
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-text-mid)">جارٍ التحميل...</div>`;

  try {
    // حاول قراءة ملفات CMS الجديدة أولاً
    let data = await loadJSONFiles('data/articles', base);

    // إذا ما لقى شيء، اقرأ من data/articles.json القديم
    if (!data.length) {
      const res = await fetch(`${base}data/articles.json`);
      if (res.ok) data = await res.json();
    }

    let filtered = data.filter(a =>
      (filter === 'الكل' || a.category === filter) &&
      (!searchQ || a.title?.includes(searchQ) || a.excerpt?.includes(searchQ))
    );

    if (isHome) filtered = filtered.slice(0, 3);
    const linkPrefix = isHome ? 'blog/' : '';

    container.innerHTML = filtered.length
      ? filtered.map((a, i) => articleCard(a, linkPrefix).replace('class="article-card reveal"', `class="article-card reveal reveal-delay-${i % 3}"`)).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--color-text-mid)">لا توجد مقالات بعد</div>`;
    initReveal();
  } catch(e) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-text-mid)">تعذّر تحميل المقالات</div>`;
  }
};

// ── Render Files ───────────────────────────────────────────────
const renderFiles = async (container, filter = 'الكل', searchQ = '') => {
  if (!container) return;
  const isHome = container.id === 'home-files-grid';
  const base = isHome ? '' : '../';
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-text-mid)">جارٍ التحميل...</div>`;

  try {
    let data = await loadJSONFiles('data/library', base);
    if (!data.length) {
      const res = await fetch(`${base}data/files.json`);
      if (res.ok) data = await res.json();
    }

    let filtered = data.filter(f =>
      (filter === 'الكل' || f.category === filter) &&
      (!searchQ || f.title?.includes(searchQ) || f.description?.includes(searchQ))
    );

    if (isHome) filtered = filtered.slice(0, 4);

    container.innerHTML = filtered.length
      ? filtered.map(f => fileCard(f)).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--color-text-mid)">لا توجد ملفات بعد</div>`;
    initReveal();
  } catch(e) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px">تعذّر تحميل الملفات</div>`;
  }
};

// ── Render Courses ─────────────────────────────────────────────
const renderCourses = async (container, filter = 'الكل') => {
  if (!container) return;
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-text-mid)">جارٍ التحميل...</div>`;

  try {
    let data = await loadJSONFiles('data/courses', '../');
    if (!data.length) {
      const res = await fetch('../data/courses.json');
      if (res.ok) data = await res.json();
    }

    const filtered = filter === 'الكل' ? data : data.filter(c => c.status === filter);

    container.innerHTML = filtered.length
      ? filtered.map(c => courseCard(c)).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--color-text-mid)">لا توجد دورات بعد</div>`;
    initReveal();
  } catch(e) {}
};

// ── Load Settings ──────────────────────────────────────────────
const loadSettings = async () => {
  const isHome = !window.location.pathname.includes('/blog/') &&
                 !window.location.pathname.includes('/about/') &&
                 !window.location.pathname.includes('/library/') &&
                 !window.location.pathname.includes('/courses/') &&
                 !window.location.pathname.includes('/contact/');
  const base = isHome ? '' : '../';
  try {
    const s = await fetch(`${base}data/settings.json`).then(r => r.ok ? r.json() : null);
    if (!s) return;

    // اسم الموقع
    document.querySelectorAll('.nav-logo-name').forEach(el => el.textContent = s.name);

    // الصورة الشخصية في الهيرو
    const heroImg = document.querySelector('.hero-photo img');
    if (heroImg && s.photo) heroImg.src = s.photo;

    // النبذة في الهيرو
    const heroDesc = document.querySelector('.hero-desc');
    if (heroDesc && s.hero_bio) heroDesc.textContent = s.hero_bio;

    // الإحصائيات
    const stats = document.querySelectorAll('.stat-num');
    if (stats[0] && s.stat_years) stats[0].dataset.target = parseInt(s.stat_years) || 4;
    if (stats[1] && s.stat_sessions) stats[1].dataset.target = parseInt(s.stat_sessions) || 500;
    if (stats[2] && s.stat_training) stats[2].dataset.target = parseInt(s.stat_training) || 180;

    // الفوتر - إيميل وعنوان
    document.querySelectorAll('.footer-email').forEach(el => el.textContent = s.email);
    document.querySelectorAll('.footer-address').forEach(el => el.textContent = s.address);
    document.querySelectorAll('.footer-hours').forEach(el => el.textContent = s.hours);
  } catch(e) {}
};

// ── Load Single Article ────────────────────────────────────────
const loadArticle = async () => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) return;

  try {
    // اقرأ الملف المباشر من مجلد articles
    const res = await fetch(`../data/articles/${slug}.json`);
    if (!res.ok) return;
    const a = await res.json();

    document.title = `${a.title} | أ. محمد القحطاني`;
    const t = document.getElementById('article-title'); if (t) t.textContent = a.title;
    const m = document.getElementById('article-meta');
    if (m) m.innerHTML = `<span>${a.author||''}</span><span>·</span><span>${a.date||''}</span><span>·</span><span>${a.readTime||''}</span>`;
    const cat = document.getElementById('article-category');
    if (cat) { cat.textContent = a.category||''; cat.style.background = a.categoryColor||'#1B2D4F'; }

    // الصورة الرئيسية
    const imgWrap = document.querySelector('.article-hero-img');
    if (imgWrap && a.image) imgWrap.innerHTML = `<img src="${a.image}" alt="${a.title}" style="width:100%;height:100%;object-fit:cover">`;

    // المحتوى (Markdown → HTML بسيط)
    const body = document.querySelector('.article-body-content');
    if (body && a.body) {
      body.innerHTML = a.body
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|p])(.+)/gm, '<p>$1</p>');
    }

    // المراجع
    const refs = document.querySelector('.article-references ol');
    if (refs && a.references?.length) {
      refs.innerHTML = a.references.map(r => `<li>${typeof r === 'string' ? r : r.ref}</li>`).join('');
    }
  } catch(e) {}
};

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
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
    renderArticles(blogGrid, cf);
    initChips('.filter-chips', v => { cf = v; renderArticles(blogGrid, v, cs); });
    const bs = document.getElementById('blog-search');
    if (bs) bs.addEventListener('input', e => { cs = e.target.value; renderArticles(blogGrid, cf, cs); });
  }

  // المكتبة
  const libGrid = document.getElementById('library-grid');
  if (libGrid) {
    let cc = 'الكل', cs = '';
    renderFiles(libGrid, cc);
    initCategorySidebar(cat => { cc = cat; renderFiles(libGrid, cat, cs); });
    const ls = document.getElementById('library-search');
    if (ls) ls.addEventListener('input', e => { cs = e.target.value; renderFiles(libGrid, cc, cs); });
  }

  // الدورات
  const coursesGrid = document.getElementById('courses-grid');
  if (coursesGrid) {
    renderCourses(coursesGrid);
    initChips('.filter-chips', v => renderCourses(coursesGrid, v));
  }

  // مقال مفرد
  if (window.location.pathname.includes('article.html')) loadArticle();
});

// Helper: generate slug from title (same as CMS)
const toSlug = (title) => title
  .replace(/[^\u0600-\u06FF\s\w-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .toLowerCase();
