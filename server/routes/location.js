const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateUUID, calculateDistance } = require('../utils');
const { recomputeHelperLocation } = require('./helperSchedule');

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

// 位置上报：求助者使用 GPS 上报，帮助者由系统自动计算（无需调用此接口）
router.post('/user/location', (req, res) => {
  const { latitude, longitude, address, source, accuracy } = req.body;
  if (latitude == null || longitude == null) {
    return res.status(400).json({ success: false, error: '缺少坐标' });
  }
  const userId = req.user ? req.user.id : (req.body.user_id || 'anonymous-' + Date.now());
  const now = new Date().toISOString();
  try {
    const existing = db.prepare('SELECT user_id FROM user_locations WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare(`UPDATE user_locations SET latitude=?, longitude=?, address=?,
        location_source=?, updated_at=? WHERE user_id=?`).run(
        latitude, longitude, address || null, source || 'gps', now, userId);
    } else {
      db.prepare(`INSERT INTO user_locations (user_id, latitude, longitude, address, location_source, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`).run(userId, latitude, longitude, address || null, source || 'gps', now);
    }
    const outside = checkGeofence(userId, latitude, longitude);
    db.prepare(`INSERT INTO location_history (id, user_id, latitude, longitude, address, accuracy,
      tracking_mode, is_outside_geofence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      generateUUID(), userId, latitude, longitude, address || null, accuracy || null,
      source || 'gps', outside ? 1 : 0);
    res.json({ success: true, outside_fence: outside, location: { latitude, longitude, user_id: userId } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 帮助者状态切换：切换为 online 时自动按当前时间匹配位置计划并缓存位置
router.put('/helper/status', (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  const { status } = req.body;
  const validStatus = ['online', 'offline', 'busy'];
  if (status && !validStatus.includes(status)) {
    return res.status(400).json({ success: false, error: 'status 必须为 online/offline/busy' });
  }
  try {
    const finalStatus = status || 'online';
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT user_id FROM helper_status WHERE user_id = ?').get(req.user.id);
    if (existing) {
      db.prepare('UPDATE helper_status SET status=?, updated_at=? WHERE user_id=?').run(finalStatus, now, req.user.id);
    } else {
      db.prepare('INSERT INTO helper_status (user_id, status, updated_at) VALUES (?, ?, ?)').run(req.user.id, finalStatus, now);
    }

    // 切换为 online 时自动计算当前位置；其他状态清除缓存位置
    let currentLocation = null;
    if (finalStatus === 'online') {
      currentLocation = recomputeHelperLocation(req.user.id);
    } else {
      db.prepare(`UPDATE helper_status
        SET current_plan_id = NULL, current_latitude = NULL,
            current_longitude = NULL, current_address = NULL
        WHERE user_id = ?`).run(req.user.id);
    }

    res.json({ success: true, status: finalStatus, current_location: currentLocation });
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

