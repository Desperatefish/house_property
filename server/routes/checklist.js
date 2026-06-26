const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/checklist - 获取清单
router.get('/', (req, res) => {
  const sections = db.prepare('SELECT * FROM checklist_sections ORDER BY sort_order, id').all();
  const items = db.prepare('SELECT * FROM checklist_items ORDER BY sort_order, id').all();

  const result = sections.map(s => ({
    id: s.id,
    title: s.title,
    items: items
      .filter(i => i.section_id === s.id)
      .map(i => ({ id: i.id, text: i.text, done: !!i.done }))
  }));

  res.json(result);
});

// PUT /api/checklist/items/:itemId - 勾选/取消
router.put('/items/:itemId', (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const { done } = req.body;

  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(itemId);
  if (!item) return res.status(404).json({ error: '清单项不存在' });

  db.prepare('UPDATE checklist_items SET done = ? WHERE id = ?').run(done ? 1 : 0, itemId);

  res.json({ id: itemId, text: item.text, done: !!done });
});

module.exports = router;
