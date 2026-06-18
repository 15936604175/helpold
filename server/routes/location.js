const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateUUID, calculateDistance } = require('../utils');

function checkGeofence(userId, lat, lon) {
  const fence = db.prepare('SELECT * FROM geofence WHERE user_id = ? AND enabled = 1').get(userId);
  if (!fence) return false;
  const dist = calculateDistance(lat, lon, fence.latitude, fence.longitude);
  if (dist > fence.radius) {
    db.prepare(`INSERT INTO geofence_alerts (id, user_id, latitude, longitude, alert_type, notified)
      VALUES (?, ?, ?, ?, 'exit', 1)`).run(generateUUID(), userId, lat, lon);
    return true;
  }
  return false;
}

router.post('/user/location', (req, res) => {
  const { latitude, longitude, address, source, help_id, accuracy } = req.body;
  if (latitude == null || longitude == null) {
    return res.status(400).json({ success: false, error: '缺少坐标' });
  }
  const userId = req.user ? req.user.id : (req.body.user_id || 'anonymous-' + Date.now());
  const now = new Date().toISOString();
  try {
    const existing = db.prepare('SELECT user_id FROM user_locations WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare(`UPDATE user_locations SET latitude=?, longitude=?, address=?,
        location_source=?, accuracy=?, updated_at=? WHERE user_id=?`).run(
        latitude, longitude, address || null, source || 'manual', accuracy || null, now, userId);
    } else {
      db.prepare(`INSERT INTO user_locations (user_id, latitude, longitude, address, location_source, accuracy)
        VALUES (?, ?, ?, ?, ?, ?)`).run(userId, latitude, longitude, address || null, source || 'manual', accuracy || null);
    }
    const outside = checkGeofence(userId, latitude, longitude);
    db.prepare(`INSERT INTO location_history (id, user_id, latitude, longitude, address, accuracy,
      tracking_mode, is_outside_geofence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      generateUUID(), userId, latitude, longitude, address || null, accuracy || null,
      source || 'manual', outside ? 1 : 0);
    if (source === 'requested' && help_id) {
      db.prepare(`INSERT INTO help_candidates (id, help_id, helper_id, latitude, longitude, accuracy)
        VALUES (?, ?, ?, ?, ?, ?)`).run(generateUUID(), help_id, userId, latitude, longitude, accuracy || 25);
    }
    res.json({ success: true, outside_fence: outside, location: { latitude, longitude, user_id: userId } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/helper/status', (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  const { status } = req.body;
  try {
    const existing = db.prepare('SELECT user_id FROM helper_status WHERE user_id = ?').get(req.user.id);
    if (existing) {
      db.prepare('UPDATE helper_status SET status=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?').run(status || 'online', req.user.id);
    } else {
      db.prepare('INSERT INTO helper_status (user_id, status) VALUES (?, ?)').run(req.user.id, status || 'online');
    }
    res.json({ success: true, status });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/guardian/bind', (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  const { seeker_phone, relation } = req.body;
  try {
    const seeker = db.prepare('SELECT id, nickname FROM users WHERE phone = ?').get(seeker_phone);
    if (!seeker) return res.status(404).json({ success: false, error: '患者不存在' });
    const existing = db.prepare('SELECT id FROM guardian_relations WHERE seeker_id=? AND guardian_id=?').get(seeker.id, req.user.id);
    if (!existing) {
      db.prepare(`INSERT INTO guardian_relations (id, seeker_id, guardian_id, relation)
        VALUES (?, ?, ?, ?)`).run(generateUUID(), seeker.id, req.user.id, relation || '子女');
    }
    res.json({ success: true, seeker_id: seeker.id, seeker_nickname: seeker.nickname });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/notifications/:userId', (req, res) => {
  try {
    const notifications = db.prepare(
      'SELECT * FROM push_notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(req.params.userId);
    res.json({ success: true, notifications });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/notifications/clear/:userId', (req, res) => {
  db.prepare('DELETE FROM push_notifications WHERE recipient_id = ?').run(req.params.userId);
  res.json({ success: true });
});

module.exports = router;
