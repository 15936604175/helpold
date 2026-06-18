const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'mutual-sos.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      disability_type TEXT,
      disability_detail TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      share_phone INTEGER DEFAULT 0,
      location_auth INTEGER DEFAULT 1,
      auto_consent INTEGER DEFAULT 0,
      continuous_tracking INTEGER DEFAULT 0,
      tracking_interval INTEGER DEFAULT 600,
      geofence_radius INTEGER DEFAULT 500,
      night_mode_enabled INTEGER DEFAULT 1,
      night_start_time TEXT DEFAULT '22:00:00',
      night_end_time TEXT DEFAULT '06:00:00',
      battery_threshold INTEGER DEFAULT 20,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_locations (
      user_id TEXT PRIMARY KEY,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT,
      location_source TEXT,
      accuracy REAL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS helper_status (
      user_id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'offline',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS help_requests (
      id TEXT PRIMARY KEY,
      seeker_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT,
      disability_type TEXT,
      disability_detail TEXT,
      reason TEXT,
      share_phone INTEGER DEFAULT 0,
      seeker_phone TEXT,
      status TEXT DEFAULT 'pending',
      accepted_by TEXT,
      stage TEXT DEFAULT 'filtering',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS help_candidates (
      id TEXT PRIMARY KEY,
      help_id TEXT NOT NULL,
      helper_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS guardian_relations (
      id TEXT PRIMARY KEY,
      seeker_id TEXT NOT NULL,
      guardian_id TEXT NOT NULL,
      relation TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(seeker_id, guardian_id)
    );

    CREATE TABLE IF NOT EXISTS location_tracking (
      id TEXT PRIMARY KEY,
      seeker_id TEXT NOT NULL,
      guardian_id TEXT,
      latitude REAL,
      longitude REAL,
      address TEXT,
      status TEXT DEFAULT 'pending',
      requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
      responded_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS location_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT,
      accuracy REAL,
      battery_level INTEGER,
      network_type TEXT,
      tracking_mode TEXT,
      is_outside_geofence INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS geofence (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius INTEGER DEFAULT 500,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS geofence_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      alert_type TEXT DEFAULT 'exit',
      notified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS push_notifications (
      id TEXT PRIMARY KEY,
      recipient_id TEXT,
      type TEXT NOT NULL,
      title TEXT,
      body TEXT,
      data TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('数据库初始化完成');
}

initDb();

module.exports = db;
