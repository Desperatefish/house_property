const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'house.db');
const db = new Database(DB_PATH);

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ===== Schema =====
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      layout TEXT,
      area REAL,
      price REAL,
      orientation TEXT,
      floor TEXT,
      metro TEXT,
      year_built INTEGER,
      property_years INTEGER DEFAULT 70,
      decoration TEXT,
      building_type TEXT,
      property_type TEXT DEFAULT '二手房',
      tags TEXT,
      notes TEXT,
      favorite INTEGER DEFAULT 0,
      rating_location INTEGER DEFAULT 0,
      rating_quality INTEGER DEFAULT 0,
      rating_value INTEGER DEFAULT 0,
      added_date TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  try {
    db.exec("ALTER TABLE properties ADD COLUMN property_type TEXT DEFAULT '二手房'");
  } catch (e) {
    // Column might already exist
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL REFERENCES checklist_sections(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT,
      content TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);
}

// ===== Helpers =====
function rowToProperty(row) {
  return {
    id: row.id,
    name: row.name,
    layout: row.layout,
    area: row.area,
    price: row.price,
    orientation: row.orientation,
    floor: row.floor,
    metro: row.metro,
    yearBuilt: row.year_built,
    propertyYears: row.property_years,
    decoration: row.decoration,
    buildingType: row.building_type,
    propertyType: row.property_type || '二手房',
    tags: row.tags ? JSON.parse(row.tags) : [],
    notes: row.notes,
    favorite: !!row.favorite,
    addedDate: row.added_date
  };
}

function propertyToParams(p) {
  return {
    name: p.name,
    layout: p.layout || '',
    area: p.area || 0,
    price: p.price,
    orientation: p.orientation || '',
    floor: p.floor || '',
    metro: p.metro || '',
    year_built: p.yearBuilt || null,
    property_years: p.propertyYears || 70,
    decoration: p.decoration || '',
    building_type: p.buildingType || '',
    property_type: p.propertyType || '二手房',
    tags: JSON.stringify(p.tags || []),
    notes: p.notes || '',
    favorite: p.favorite ? 1 : 0,
    rating_location: 0,
    rating_quality: 0,
    rating_value: 0,
    added_date: p.addedDate || new Date().toISOString().slice(0, 10)
  };
}

// Init
initSchema();

module.exports = { db, rowToProperty, propertyToParams };
