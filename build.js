#!/usr/bin/env node
/**
 * BUILD SCRIPT — يعمل أثناء Netlify Build فقط
 * يدمج ملفات JSON المستقلة في ملف واحد لكل قسم
 */

const fs   = require('fs');
const path = require('path');

const merge = (inputFolder, outputFile) => {
  // تحقق من وجود المجلد
  if (!fs.existsSync(inputFolder)) {
    console.log(`⚠️  المجلد غير موجود: ${inputFolder}`);
    return;
  }

  // اقرأ كل ملفات JSON في المجلد
  const files = fs.readdirSync(inputFolder)
    .filter(f => f.endsWith('.json'))
    .sort(); // ترتيب أبجدي ثابت

  if (files.length === 0) {
    console.log(`⚠️  لا توجد ملفات في: ${inputFolder}`);
    fs.writeFileSync(outputFile, '[]', 'utf8');
    return;
  }

  // ادمج كل الملفات في مصفوفة واحدة
  const merged = [];
  files.forEach((file, index) => {
    try {
      const content = fs.readFileSync(path.join(inputFolder, file), 'utf8');
      const data    = JSON.parse(content);
      // أضف id تلقائي إذا ما كان موجود
      if (!data.id) data.id = index + 1;
      merged.push(data);
    } catch (e) {
      console.error(`❌ خطأ في الملف ${file}:`, e.message);
    }
  });

  // رتّب تنازلياً حسب id
  merged.sort((a, b) => (b.id || 0) - (a.id || 0));

  // اكتب الملف المدموج
  fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`✓ ${outputFile} ← ${files.length} ملف`);
};

const generateSitemap = () => {
  const BASE = 'https://mohammed-alqahtani.netlify.app';
  const today = new Date().toISOString().split('T')[0];

  // الصفحات الثابتة
  const staticPages = [
    { url: '/',               priority: '1.0', changefreq: 'weekly'  },
    { url: '/about/',         priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/',          priority: '0.9', changefreq: 'weekly'  },
    { url: '/library/',       priority: '0.8', changefreq: 'weekly'  },
    { url: '/courses/',       priority: '0.7', changefreq: 'monthly' },
    { url: '/contact/',       priority: '0.6', changefreq: 'yearly'  },
  ];

  // المقالات
  const articles = fs.existsSync('data/articles.json')
    ? JSON.parse(fs.readFileSync('data/articles.json', 'utf8'))
    : [];

  // ملفات المكتبة
  const library = fs.existsSync('data/library.json')
    ? JSON.parse(fs.readFileSync('data/library.json', 'utf8'))
    : [];

  // الدورات
  const courses = fs.existsSync('data/courses.json')
    ? JSON.parse(fs.readFileSync('data/courses.json', 'utf8'))
    : [];

  const urlTag = ({ url, priority, changefreq, lastmod }) => `
  <url>
    <loc>${BASE}${url}</loc>
    <lastmod>${lastmod || today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(urlTag).join('')}
${articles.map(a => urlTag({
    url: `/blog/article.html?slug=${a.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: today,
  })).join('')}
${library.map(f => urlTag({
    url: `/library/`,
    priority: '0.6',
    changefreq: 'weekly',
    lastmod: today,
  })).join('')}
${courses.map(c => urlTag({
    url: `/courses/`,
    priority: '0.6',
    changefreq: 'monthly',
    lastmod: today,
  })).join('')}
</urlset>`;

  fs.writeFileSync('sitemap.xml', xml.trim(), 'utf8');
  console.log(`✓ sitemap.xml ← ${staticPages.length} صفحة + ${articles.length} مقال + ${library.length} ملف + ${courses.length} دورة`);
};

console.log('\n🔨 بدء البناء...\n');
merge('data/articles', 'data/articles.json');
merge('data/library',  'data/library.json');
merge('data/courses',  'data/courses.json');
generateSitemap();
console.log('\n✅ اكتمل البناء\n');
