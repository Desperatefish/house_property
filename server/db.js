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

// ===== Seed Default Data =====
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM properties').get().c;
  if (count > 0) return;

  console.log('📦 首次运行，填充默认数据...');

  const insertProp = db.prepare(`
    INSERT INTO properties (name, layout, area, price, orientation, floor, metro,
      year_built, property_years, decoration, building_type, property_type, tags, notes, favorite,
      rating_location, rating_quality, rating_value, added_date)
    VALUES (@name, @layout, @area, @price, @orientation, @floor, @metro,
      @year_built, @property_years, @decoration, @building_type, @property_type, @tags, @notes, @favorite,
      @rating_location, @rating_quality, @rating_value, @added_date)
  `);

  const defaultProperties = [
    {
      name: '中冶天城', layout: '3室1厅', area: 100.47, price: 199.9,
      orientation: '南', floor: '', metro: '3/5号线 诚信大道站 1-1.5km',
      year_built: 2010, property_years: 70, decoration: '精装', building_type: '板楼',
      tags: JSON.stringify(['满五年', '近地铁', '拎包入住']),
      notes: '店长推荐。可直接拎包入住，视野好。开发区旁。',
      favorite: 0, rating_location: 0, rating_quality: 0, rating_value: 0,
      added_date: '2026-06-20'
    },
    {
      name: '保利中央公园 (97㎡)', layout: '3室2厅', area: 97.49, price: 210,
      orientation: '南', floor: '', metro: '3号线 东大九龙湖校区站 1-2km',
      year_built: 2016, property_years: 70, decoration: '精装', building_type: '板楼',
      tags: JSON.stringify(['满两年', '近地铁', '有地暖', '精装']),
      notes: '九龙湖公园旁，有地暖是亮点，3号线地铁口。',
      favorite: 0, rating_location: 0, rating_quality: 0, rating_value: 0,
      added_date: '2026-06-20'
    },
    {
      name: '万科翡翠公园·东区 (87㎡)', layout: '3室2厅', area: 87.38, price: 195,
      orientation: '南北', floor: '', metro: '3号线 九龙湖站 ~780m',
      year_built: 2017, property_years: 70, decoration: '精装', building_type: '板楼',
      tags: JSON.stringify(['满两年', '近地铁', '精装', '安静', '中上层']),
      notes: '万科物业金字招牌。东区精装三房，安静，中上层。',
      favorite: 0, rating_location: 0, rating_quality: 0, rating_value: 0,
      added_date: '2026-06-20'
    },
    {
      name: '万科翡翠公园 (91㎡)', layout: '3室2厅', area: 91.11, price: 220,
      orientation: '南', floor: '', metro: '3号线 九龙湖站 ~780m',
      year_built: 2017, property_years: 70, decoration: '精装', building_type: '板楼',
      tags: JSON.stringify(['满两年', '近地铁', '7日新上', '采光好', '视野开阔', '保养新']),
      notes: '翡翠东区，业主自住，采光好视野开阔。单价最高 24,147。',
      favorite: 0, rating_location: 0, rating_quality: 0, rating_value: 0,
      added_date: '2026-06-20'
    },
    {
      name: '保利中央公园 (88㎡)', layout: '3室2厅', area: 88.61, price: 190,
      orientation: '南北', floor: '', metro: '3号线 东大九龙湖校区站 1-2km',
      year_built: 2015, property_years: 70, decoration: '精装', building_type: '板楼',
      tags: JSON.stringify(['满五年', '近地铁', '精装']),
      notes: '精装小三房，业主诚心出售。满五年免增值税。',
      favorite: 0, rating_location: 0, rating_quality: 0, rating_value: 0,
      added_date: '2026-06-20'
    },
    {
      name: '新城玖珑湖', layout: '3室1厅', area: 94.04, price: 189,
      orientation: '南北', floor: '', metro: '3/5号线 诚信大道站 230-500m',
      year_built: 2020, property_years: 70, decoration: '精装', building_type: '板楼',
      tags: JSON.stringify(['满五年', '近地铁', '看湖景', '好楼层']),
      notes: '🌟 地铁最近(步行3-5分钟)！满五唯一，看湖景，2020年交付较新。店长推荐。',
      favorite: 1, rating_location: 0, rating_quality: 0, rating_value: 0,
      added_date: '2026-06-20'
    }
  ];

  const insertSection = db.prepare('INSERT INTO checklist_sections (title, sort_order) VALUES (?, ?)');
  const insertItem = db.prepare('INSERT INTO checklist_items (section_id, text, done, sort_order) VALUES (?, ?, 0, ?)');

  const defaultChecklist = [
    {
      title: '📋 看房前准备',
      items: [
        '确认各套房的银行评估价（决定实际贷款额度）',
        '确认房源是否满五唯一（影响增值税和个税）',
        '了解对口小学/初中学区',
        '查询房产是否有抵押或查封',
        '准备好身份证、结婚证、征信报告'
      ]
    },
    {
      title: '🏗️ 实地看房关注点',
      items: [
        '从小区门口走到地铁口实际计时',
        '检查房屋实际装修状况 vs 照片是否一致',
        '关注楼层、梯户比、公摊面积',
        '检查采光（最好下午去看）',
        '了解小区停车位情况（月租/购买价格）',
        '问清物业费标准和服务质量',
        '关注小区周边噪音（靠近马路/高架?）',
        '查看小区环境、绿化、设施维护情况'
      ]
    },
    {
      title: '💰 费用确认',
      items: [
        '中介费比例和支付节点',
        '契税：首套≤90㎡为1%，>90㎡为1.5%',
        '评估费、贷款手续费',
        '维修基金',
        '装修预算（如需装修）',
        '搬家费用'
      ]
    },
    {
      title: '📑 贷款办理',
      items: [
        '双方公积金缴存证明',
        '确认公积金贷款额度（夫妻上限100万）',
        '选定商贷银行，比较各行利率',
        '确认组合贷是否被卖家接受（周期较长）',
        '了解"以旧换新"贴息政策是否适用'
      ]
    }
  ];

  const insertTimeline = db.prepare("INSERT INTO timeline (date, title, content) VALUES ('2026-06-20', '开始看房', '加了贝壳中介刘雨路，收到6套江宁核心区推荐房源。')");

  const seed = db.transaction(() => {
    for (const p of defaultProperties) insertProp.run(p);
    defaultChecklist.forEach((section, si) => {
      const info = insertSection.run(section.title, si);
      section.items.forEach((text, ii) => {
        insertItem.run(info.lastInsertRowid, text, ii);
      });
    });
    insertTimeline.run();
  });

  seed();
  console.log('✅ 默认数据已填充');
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
    ratings: {
      location: row.rating_location,
      quality: row.rating_quality,
      value: row.rating_value
    },
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
    rating_location: p.ratings?.location || 0,
    rating_quality: p.ratings?.quality || 0,
    rating_value: p.ratings?.value || 0,
    added_date: p.addedDate || new Date().toISOString().slice(0, 10)
  };
}

// Init
initSchema();
seedIfEmpty();

module.exports = { db, rowToProperty, propertyToParams };
