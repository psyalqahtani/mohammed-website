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

console.log('\n🔨 بدء البناء...\n');
merge('data/articles', 'data/articles.json');
merge('data/library',  'data/library.json');
merge('data/courses',  'data/courses.json');
console.log('\n✅ اكتمل البناء\n');
