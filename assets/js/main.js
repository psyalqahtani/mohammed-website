/* ============================================================
   MAIN.JS — أ. محمد القحطاني — الموقع الشخصي
   ============================================================ */

// ── Dark Mode ───────────────────────────────────────────────
const DARK_KEY = 'theme';
const toggleDark = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(DARK_KEY, next);
  document.querySelectorAll('.btn-dark-toggle').forEach(btn => {
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
  });
};
const initTheme = () => {
  const saved = localStorage.getItem(DARK_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.btn-dark-toggle').forEach(btn => {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
};

// ── Page Loader ──────────────────────────────────────────────
const initLoader = () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => loader.classList.add('hidden'), 700);
};

// ── Sticky Nav ───────────────────────────────────────────────
const initNav = () => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 80), { passive: true });
};

// ── Mobile Drawer ────────────────────────────────────────────
const initMobileDrawer = () => {
  const hamburger = document.querySelector('.nav-hamburger');
  const drawer    = document.querySelector('.mobile-drawer');
  const overlay   = document.querySelector('.mobile-drawer-overlay');
  if (!hamburger || !drawer) return;
  hamburger.addEventListener('click', () => drawer.classList.toggle('open'));
  overlay?.addEventListener('click', () => drawer.classList.remove('open'));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));
};

// ── Search Overlay ───────────────────────────────────────────
const initSearch = () => {
  const overlay = document.querySelector('.search-overlay');
  if (!overlay) return;
  document.querySelectorAll('.btn-nav-search').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.classList.toggle('open');
      if (overlay.classList.contains('open')) overlay.querySelector('.search-input')?.focus();
    });
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') overlay.classList.remove('open'); });
};

// ── Scroll Reveal ────────────────────────────────────────────
const initReveal = () => {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
};

// ── Stat Counter ─────────────────────────────────────────────
const initStats = () => {
  const wrap = document.querySelector('.hero-stats');
  if (!wrap) return;
  const nums = wrap.querySelectorAll('.stat-num[data-target]');
  if (!nums.length) return;
  let started = false;
  const io = new IntersectionObserver(e => {
    if (!e[0].isIntersecting || started) return;
    started = true;
    nums.forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      let i = 0; const steps = 30, step = 1400 / steps;
      const t = setInterval(() => {
        i++;
        const p = 1 - Math.pow(1 - i / steps, 2);
        el.textContent = Math.round(target * p) + suffix;
        if (i >= steps) { el.textContent = target + suffix; clearInterval(t); }
      }, step);
    });
  }, { threshold: 0.4 });
  io.observe(wrap);
};

// ── Reading Progress Bar ─────────────────────────────────────
const initReadingBar = () => {
  const bar = document.querySelector('.reading-bar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const doc = document.documentElement;
    bar.style.transform = `scaleX(${window.scrollY / (doc.scrollHeight - doc.clientHeight)})`;
  }, { passive: true });
};

// ── Active Nav ───────────────────────────────────────────────
const initActiveNav = () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.includes(page) || (page === 'index.html' && href === 'index.html')) a.classList.add('active');
  });
};

// ── Filter Chips ─────────────────────────────────────────────
const initChips = (sel, cb) => {
  const c = document.querySelector(sel);
  if (!c) return;
  c.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      c.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      chip.classList.add('active');
      cb(chip.dataset.value || chip.textContent.trim());
    });
  });
};

// ── Category Sidebar ─────────────────────────────────────────
const initCategorySidebar = (cb) => {
  document.querySelectorAll('.cat-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      cb(item.dataset.cat || 'الكل');
    });
  });
};

// ── Contact Form ─────────────────────────────────────────────
const initContactForm = () => {
  const form = document.querySelector('.contact-form form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.textContent = '✓ تم الإرسال بنجاح';
    btn.style.background = '#22c55e';
    setTimeout(() => { btn.textContent = 'إرسال الرسالة'; btn.style.background = ''; form.reset(); }, 3000);
  });
};

// ── Render Articles ───────────────────────────────────────────
const renderArticles = async (container, filter = 'الكل', searchQ = '') => {
  if (!container) return;
  const prefix = container.id === 'home-articles-grid' ? 'data/' : '../data/';
  try {
    const data = await fetch(prefix + 'articles.json').then(r => r.json());
    const filtered = data.filter(a =>
      (filter === 'الكل' || a.category === filter) &&
      (!searchQ || a.title.includes(searchQ) || a.excerpt.includes(searchQ))
    );
    const linkPrefix = prefix === 'data/' ? 'blog/' : '';
    container.innerHTML = filtered.map((a, i) => `
      <article class="article-card reveal reveal-delay-${i % 3}">
        <div class="article-card-img">
          <div class="article-card-img-placeholder">صورة المقال</div>
          <span class="article-card-cat" style="background:${a.categoryColor}">${a.category}</span>
        </div>
        <div class="article-card-body">
          <h3 class="article-card-title"><a href="${linkPrefix}article.html?id=${a.id}" style="color:inherit">${a.title}</a></h3>
          <p class="article-card-excerpt">${a.excerpt}</p>
          <div class="article-card-meta"><span>${a.readTime}</span><span>${a.date}</span></div>
        </div>
      </article>`).join('');
    initReveal();
  } catch(e) { container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--color-text-mid)">تعذّر تحميل المقالات</p>'; }
};

// ── Render Files ──────────────────────────────────────────────
const renderFiles = async (container, filter = 'الكل', searchQ = '') => {
  if (!container) return;
  const prefix = container.id === 'home-files-grid' ? 'data/' : '../data/';
  try {
    const data = await fetch(prefix + 'files.json').then(r => r.json());
    const filtered = data.filter(f =>
      (filter === 'الكل' || f.category === filter) &&
      (!searchQ || f.title.includes(searchQ) || f.description.includes(searchQ))
    );
    container.innerHTML = filtered.map(f => `
      <div class="file-card reveal">
        <div class="file-icon" style="background:${f.color}">${f.type}</div>
        <h4 class="file-title">${f.title}</h4>
        <p class="file-desc">${f.description}</p>
        <div class="file-meta">${f.size} · ${f.date}</div>
        <button class="btn-download">تحميل ↓</button>
      </div>`).join('');
    initReveal();
  } catch(e) { container.innerHTML = '<p style="text-align:center;padding:40px">تعذّر تحميل الملفات</p>'; }
};

// ── Render Courses ────────────────────────────────────────────
const renderCourses = async (container, filter = 'الكل') => {
  if (!container) return;
  try {
    const data = await fetch('../data/courses.json').then(r => r.json());
    const filtered = filter === 'الكل' ? data : data.filter(c => c.status === filter);
    container.innerHTML = filtered.map(c => `
      <div class="course-card reveal">
        <div class="course-card-img">
          <span class="course-card-status" style="background:${c.statusColor}">${c.status}</span>
        </div>
        <div class="course-card-body">
          <h4 class="course-card-title">${c.title}</h4>
          <p class="course-card-desc">${c.description}</p>
          <div class="course-card-meta">${c.date} · ${c.duration} · ${c.mode}</div>
          <button class="btn-primary" style="font-size:14px;padding:10px 24px">
            ${c.status === 'منتهٍ' ? 'عرض التفاصيل' : 'التسجيل الآن'}
          </button>
        </div>
      </div>`).join('');
    initReveal();
  } catch(e) {}
};

// ── Load Single Article ───────────────────────────────────────
const loadArticle = async () => {
  const id = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
  if (!id) return;
  try {
    const data = await fetch('../data/articles.json').then(r => r.json());
    const a = data.find(x => x.id === id);
    if (!a) return;
    document.title = `${a.title} | أ. محمد القحطاني`;
    const t = document.getElementById('article-title'); if (t) t.textContent = a.title;
    const m = document.getElementById('article-meta');
    if (m) m.innerHTML = `<span>${a.author}</span><span>·</span><span>${a.date}</span><span>·</span><span>${a.readTime}</span>`;
    const cat = document.getElementById('article-category');
    if (cat) { cat.textContent = a.category; cat.style.background = a.categoryColor; }
  } catch(e) {}
};

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLoader();
  initNav();
  initMobileDrawer();
  initSearch();
  initReveal();
  initStats();
  initReadingBar();
  initActiveNav();
  initContactForm();
  loadArticle();

  document.querySelectorAll('.btn-dark-toggle').forEach(btn => btn.addEventListener('click', toggleDark));

  // Homepage
  const homeArticles = document.getElementById('home-articles-grid');
  if (homeArticles) renderArticles(homeArticles, 'الكل');
  const homeFiles = document.getElementById('home-files-grid');
  if (homeFiles) renderFiles(homeFiles);

  // Blog page
  const blogGrid = document.getElementById('blog-grid');
  if (blogGrid) {
    let cf = 'الكل', cs = '';
    renderArticles(blogGrid, cf);
    initChips('.filter-chips', v => { cf = v; renderArticles(blogGrid, v, cs); });
    const bs = document.getElementById('blog-search');
    if (bs) bs.addEventListener('input', e => { cs = e.target.value; renderArticles(blogGrid, cf, cs); });
  }

  // Library page
  const libGrid = document.getElementById('library-grid');
  if (libGrid) {
    let cc = 'الكل', cs = '';
    renderFiles(libGrid, cc);
    initCategorySidebar(cat => { cc = cat; renderFiles(libGrid, cat, cs); });
    const ls = document.getElementById('library-search');
    if (ls) ls.addEventListener('input', e => { cs = e.target.value; renderFiles(libGrid, cc, cs); });
  }

  // Courses page
  const coursesGrid = document.getElementById('courses-grid');
  if (coursesGrid) {
    renderCourses(coursesGrid);
    initChips('.filter-chips', v => renderCourses(coursesGrid, v));
  }
});
