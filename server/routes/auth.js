const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateUUID, hashPassword, comparePassword, generateToken } = require('../utils');

router.post('/register', (req, res) => {
  const { phone, password, nickname, role, disability_type, disability_detail,
          emergency_contact_name, emergency_contact_phone, location_auth, auto_consent } = req.body;
  if (!phone || !password || !nickname || !role) {
    return res.status(400).json({ success: false, error: '缺少必填字段' });
  }
  if (!['seeker', 'helper', 'guardian'].includes(role)) {
    return res.status(400).json({ success: false, error: '角色无效' });
  }
  try {
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) return res.status(400).json({ success: false, error: '手机号已注册' });
    const id = generateUUID();
    const hashed = hashPassword(password);
    db.prepare(`INSERT INTO users (id, phone, nickname, password, role, disability_type,
      disability_detail, emergency_contact_name, emergency_contact_phone, location_auth, auto_consent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, phone, nickname, hashed, role, disability_type || null,
        disability_detail || null, emergency_contact_name || null,
        emergency_contact_phone || null, location_auth ? 1 : 1, auto_consent ? 1 : 0);
    if (role === 'seeker') {
      db.prepare(`INSERT INTO geofence (id, user_id, latitude, longitude, radius) VALUES (?, ?, ?, ?, ?)`).run(
        generateUUID(), id, 39.9042, 116.4074, 1000);
      db.prepare(`INSERT INTO user_locations (user_id, latitude, longitude) VALUES (?, ?, ?)`).run(
        id, 39.9042, 116.4074);
    }
    if (role === 'helper') {
      db.prepare(`INSERT INTO helper_status (user_id, status) VALUES (?, ?)`).run(id, 'online');
      db.prepare(`INSERT INTO user_locations (user_id, latitude, longitude) VALUES (?, ?, ?)`).run(
        id, 39.9100, 116.4100);
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    delete user.password;
    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ success: false, error: '缺少字段' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) return res.status(401).json({ success: false, error: '用户不存在' });
    if (!comparePassword(password, user.password)) {
      return res.status(401).json({ success: false, error: '密码错误' });
    }
    delete user.password;
    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/profile', (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (user) delete user.password;
  res.json({ success: true, user });
});

router.put('/profile', (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  const { nickname, disability_type, disability_detail, continuous_tracking,
          tracking_interval, geofence_radius, night_mode_enabled, auto_consent } = req.body;
  db.prepare(`UPDATE users SET nickname=?, disability_type=?, disability_detail=?,
    continuous_tracking=?, tracking_interval=?, geofence_radius=?, night_mode_enabled=?, auto_consent=?
    WHERE id=?`).run(nickname || req.user.nickname, disability_type || null, disability_detail || null,
    continuous_tracking ? 1 : 0, tracking_interval || 600, geofence_radius || 500,
    night_mode_enabled ? 1 : 1, auto_consent ? 1 : 0, req.user.id);
  res.json({ success: true });
});

module.exports = router;
