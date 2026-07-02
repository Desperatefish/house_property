const express = require('express');
const router = express.Router();
const { db, rowToProperty, propertyToParams } = require('../db');

// GET /api/properties - 获取全部房源
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM properties ORDER BY id').all();
  res.json(rows.map(rowToProperty));
});

// POST /api/properties - 新增房源
router.post('/', (req, res) => {
  const p = req.body;
  if (!p.name || !p.price) {
    return res.status(400).json({ error: '小区名称和总价为必填' });
  }

  const params = propertyToParams(p);
  const info = db.prepare(`
    INSERT INTO properties (name, layout, area, price, orientation, floor, metro,
      year_built, property_years, decoration, building_type, property_type, tags, notes, favorite,
      rating_location, rating_quality, rating_value, added_date)
    VALUES (@name, @layout, @area, @price, @orientation, @floor, @metro,
      @year_built, @property_years, @decoration, @building_type, @property_type, @tags, @notes, @favorite,
      @rating_location, @rating_quality, @rating_value, @added_date)
  `).run(params);

  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(rowToProperty(row));
});

// PUT /api/properties/:id - 更新房源
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: '房源不存在' });

  const p = req.body;
  const params = propertyToParams({ ...rowToProperty(existing), ...p });

  db.prepare(`
    UPDATE properties SET
      name = @name, layout = @layout, area = @area, price = @price,
      orientation = @orientation, floor = @floor, metro = @metro,
      year_built = @year_built, property_years = @property_years,
      decoration = @decoration, building_type = @building_type,
      property_type = @property_type,
      tags = @tags, notes = @notes, favorite = @favorite,
      rating_location = @rating_location, rating_quality = @rating_quality,
      rating_value = @rating_value, added_date = @added_date,
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(params, id);

  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  res.json(rowToProperty(row));
});

// DELETE /api/properties/:id - 删除房源
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const info = db.prepare('DELETE FROM properties WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: '房源不存在' });
  res.json({ success: true });
});

module.exports = router;
