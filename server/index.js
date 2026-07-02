const express = require('express');
const cors = require('cors');
const path = require('path');
const { db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' }));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/properties', require('./routes/properties'));
app.use('/api/checklist', require('./routes/checklist'));
app.use('/api/timeline', require('./routes/timeline'));

// Export all data
app.get('/api/export', (req, res) => {
  const properties = db.prepare('SELECT * FROM properties ORDER BY id').all();
  const sections = db.prepare('SELECT * FROM checklist_sections ORDER BY sort_order, id').all();
  const items = db.prepare('SELECT * FROM checklist_items ORDER BY sort_order, id').all();
  const timeline = db.prepare('SELECT * FROM timeline ORDER BY date DESC, id DESC').all();

  res.json({
    properties,
    checklist: sections.map(s => ({
      title: s.title,
      items: items.filter(i => i.section_id === s.id).map(i => ({ text: i.text, done: !!i.done }))
    })),
    timeline: timeline.map(t => ({ date: t.date, title: t.title, content: t.content })),
    exportedAt: new Date().toISOString()
  });
});

// Import data (replace all)
app.post('/api/import', (req, res) => {
  const data = req.body;
  if (!data.properties) return res.status(400).json({ error: '数据格式错误' });

  try {
    const insertProp = db.prepare(`
      INSERT INTO properties (name, layout, area, price, orientation, floor, metro,
        year_built, property_years, decoration, building_type, property_type, tags, notes, favorite,
        rating_location, rating_quality, rating_value, added_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertSection = db.prepare('INSERT INTO checklist_sections (title, sort_order) VALUES (?, ?)');
    const insertItem = db.prepare('INSERT INTO checklist_items (section_id, text, done, sort_order) VALUES (?, ?, ?, ?)');
    const insertTimeline = db.prepare('INSERT INTO timeline (date, title, content) VALUES (?, ?, ?)');

    // 清空 + 写入放在同一个事务里，失败则自动回滚
    const runImport = db.transaction(() => {
      db.exec('DELETE FROM checklist_items');
      db.exec('DELETE FROM checklist_sections');
      db.exec('DELETE FROM timeline');
      db.exec('DELETE FROM properties');

      for (const p of data.properties) {
        insertProp.run(
          p.name, p.layout || '', p.area || 0, p.price,
          p.orientation || '', p.floor || '', p.metro || '',
          p.yearBuilt || p.year_built || null,
          p.propertyYears || p.property_years || 70,
          p.decoration || '', p.buildingType || p.building_type || '',
          p.propertyType || p.property_type || '二手房',
          typeof p.tags === 'string' ? p.tags : JSON.stringify(p.tags || []),
          p.notes || '', p.favorite ? 1 : 0,
          p.ratings?.location || p.rating_location || 0,
          p.ratings?.quality || p.rating_quality || 0,
          p.ratings?.value || p.rating_value || 0,
          p.addedDate || p.added_date || new Date().toISOString().slice(0, 10)
        );
      }

      if (data.checklist) {
        data.checklist.forEach((section, si) => {
          const info = insertSection.run(section.title, si);
          (section.items || []).forEach((item, ii) => {
            const text = typeof item === 'string' ? item : item.text;
            const done = typeof item === 'string' ? 0 : (item.done ? 1 : 0);
            insertItem.run(info.lastInsertRowid, text, done, ii);
          });
        });
      }

      if (data.timeline) {
        data.timeline.forEach(t => {
          insertTimeline.run(t.date, t.title || '记录', t.content);
        });
      }
    });

    runImport();
    res.json({ success: true, count: data.properties.length });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: '导入失败: ' + err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏠 买房决策看板运行在 http://0.0.0.0:${PORT}`);
});
