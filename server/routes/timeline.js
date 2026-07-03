const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/timeline - 获取时间线
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM timeline ORDER BY date DESC, id DESC').all();
  res.json(rows.map(r => ({
    id: r.id,
    date: r.date,
    title: r.title,
    content: r.content
  })));
});

// POST /api/timeline - 新增记录
router.post('/', (req, res) => {
  const { date, title, content } = req.body;
  if (!content) return res.status(400).json({ error: '内容不能为空' });

  const d = date || new Date().toISOString().slice(0, 10);
  const t = title || '记录';

  const info = db.prepare('INSERT INTO timeline (date, title, content) VALUES (?, ?, ?)').run(d, t, content);
  const row = db.prepare('SELECT * FROM timeline WHERE id = ?').get(info.lastInsertRowid);

  res.status(201).json({ id: row.id, date: row.date, title: row.title, content: row.content });
});

// DELETE /api/timeline/:id - 删除记录
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const info = db.prepare('DELETE FROM timeline WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: '记录不存在' });
  res.json({ success: true });
});

// PUT /api/timeline/:id - 更新记录
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { date, title, content } = req.body;
  if (!content) return res.status(400).json({ error: '内容不能为空' });

  const d = date || new Date().toISOString().slice(0, 10);
  const t = title || '记录';

  const info = db.prepare('UPDATE timeline SET date = ?, title = ?, content = ? WHERE id = ?').run(d, t, content, id);
  if (info.changes === 0) return res.status(404).json({ error: '记录不存在' });

  const row = db.prepare('SELECT * FROM timeline WHERE id = ?').get(id);
  res.json({ id: row.id, date: row.date, title: row.title, content: row.content });
});

module.exports = router;
