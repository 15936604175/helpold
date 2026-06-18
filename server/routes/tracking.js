const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateUUID, calculateDistance } = require('../utils');

// 发起位置追踪请求
router.post('/track/request/:seekerId', (req, res) => {
  const seekerId = req.params.seekerId;
  const { guardian_id } = req.body;
  try {
    const seeker = db.prepare('SELECT * FROM users WHERE id = ?').get(seekerId);
    if (!seeker) return res.status(404).json({ success: false, error: '患者不存在' });

    // 如果设置了自动同意，直接获取当前位置
    if (seeker.auto_consent) {
      const location = db.prepare('SELECT * FROM user_locations WHERE user_id = ?').get(seekerId);
      const trackingId = generateUUID();
      db.prepare(`INSERT INTO location_tracking (id, seeker_id, guardian_id, latitude, longitude, status, responded_at, completed_at)
        VALUES (?, ?, ?, ?, ?, 'confirmed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).run(
        trackingId, seekerId, guardian_id || null,
        location ? location.latitude : null, location ? location.longitude : null);
      return res.json({
        success: true,
        tracking: {
          id: trackingId, status: 'confirmed',
          latitude: location ? location.latitude : null,
          longitude: location ? location.longitude : null
        },
        auto: true
      });
    }

    // 否则创建待确认请求
    const trackingId = generateUUID();
    db.prepare(`INSERT INTO location_tracking (id, seeker_id, guardian_id, status)
      VALUES (?, ?, ?, 'pending')`).run(trackingId, seekerId, guardian_id || null);

    db.prepare(`INSERT INTO push_notifications (id, recipient_id, type, title, body, data)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      generateUUID(), seekerId, 'track_request',
      '家属请求查看您的位置', '请确认是否允许',
      JSON.stringify({ tracking_id: trackingId, guardian_id: guardian_id }));

    res.json({ success: true, tracking: { id: trackingId, status: 'pending' } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/track/confirm/:trackingId', (req, res) => {
  const { latitude, longitude, address } = req.body;
  db.prepare(`UPDATE location_tracking SET latitude=?, longitude=?, address=?,
    status='confirmed', responded_at=CURRENT_TIMESTAMP, completed_at=CURRENT_TIMESTAMP
    WHERE id=?`).run(latitude, longitude, address || null, req.params.trackingId);
  res.json({ success: true });
});

router.post('/track/deny/:trackingId', (req, res) => {
  db.prepare(`UPDATE location_tracking SET status='denied', responded_at=CURRENT_TIMESTAMP WHERE id=?`).run(req.params.trackingId);
  res.json({ success: true });
});

router.get('/track/realtime/:seekerId', (req, res) => {
  try {
    const loc = db.prepare('SELECT * FROM user_locations WHERE user_id = ?').get(req.params.seekerId);
    const seeker = db.prepare('SELECT id, nickname, phone, disability_type FROM users WHERE id = ?').get(req.params.seekerId);
    if (!loc) return res.status(404).json({ success: false, error: '无位置数据' });
    res.json({ success: true, location: loc, seeker });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/track/config', (req, res) => {
  const { user_id, continuous_tracking, tracking_interval, geofence_radius, night_mode_enabled } = req.body;
  try {
    db.prepare(`UPDATE users SET continuous_tracking=?, tracking_interval=?,
      geofence_radius=?, night_mode_enabled=? WHERE id=?`).run(
      continuous_tracking ? 1 : 0, tracking_interval || 600, geofence_radius || 500,
      night_mode_enabled ? 1 : 1, user_id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/track/start', (req, res) => {
  const { user_id, tracking_interval, continuous_tracking } = req.body;
  try {
    db.prepare(`UPDATE users SET continuous_tracking=1, tracking_interval=? WHERE id=?`).run(
      tracking_interval || 600, user_id);
    res.json({ success: true, message: '持续追踪已开启' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/track/stop', (req, res) => {
  const { user_id } = req.body;
  try {
    db.prepare('UPDATE users SET continuous_tracking=0 WHERE id=?').run(user_id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/track/my-pending', (req, res) => {
  const userId = req.query.userId || (req.user && req.user.id);
  try {
    const pending = db.prepare(`SELECT lt.*, u.nickname as guardian_nickname
      FROM location_tracking lt LEFT JOIN users u ON lt.guardian_id = u.id
      WHERE lt.seeker_id=? AND lt.status='pending' ORDER BY lt.requested_at DESC`).all(userId);
    res.json({ success: true, pending });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 电子围栏
router.get('/geofence/:userId', (req, res) => {
  try {
    const fence = db.prepare('SELECT * FROM geofence WHERE user_id = ?').get(req.params.userId);
    res.json({ success: true, geofence: fence });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/geofence/:userId', (req, res) => {
  const { latitude, longitude, radius } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM geofence WHERE user_id = ?').get(req.params.userId);
    if (existing) {
      db.prepare(`UPDATE geofence SET latitude=?, longitude=?, radius=?, updated_at=CURRENT_TIMESTAMP
        WHERE user_id=?`).run(latitude, longitude, radius || 500, req.params.userId);
    } else {
      db.prepare(`INSERT INTO geofence (id, user_id, latitude, longitude, radius) VALUES (?, ?, ?, ?, ?)`).run(
        generateUUID(), req.params.userId, latitude, longitude, radius || 500);
    }
    // 同时更新用户设置
    db.prepare('UPDATE users SET geofence_radius=? WHERE id=?').run(radius || 500, req.params.userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/geofence/:userId/enable', (req, res) => {
  db.prepare('UPDATE geofence SET enabled=1 WHERE user_id=?').run(req.params.userId);
  res.json({ success: true });
});

router.post('/geofence/:userId/disable', (req, res) => {
  db.prepare('UPDATE geofence SET enabled=0 WHERE user_id=?').run(req.params.userId);
  res.json({ success: true });
});

// 历史记录
router.get('/history/track/:userId', (req, res) => {
  try {
    const history = db.prepare(`SELECT * FROM location_history WHERE user_id=?
      ORDER BY created_at DESC LIMIT 100`).all(req.params.userId);
    res.json({ success: true, history });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/history/alerts/:userId', (req, res) => {
  try {
    const alerts = db.prepare(`SELECT * FROM geofence_alerts WHERE user_id=?
      ORDER BY created_at DESC LIMIT 50`).all(req.params.userId);
    res.json({ success: true, alerts });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/track/history', (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: '未登录' });
  try {
    // 查找该家属关联的患者的追踪记录
    const relations = db.prepare('SELECT seeker_id FROM guardian_relations WHERE guardian_id=?').all(req.user.id);
    const seekerIds = relations.map(r => r.seeker_id);
    if (seekerIds.length === 0) return res.json({ success: true, history: [] });
    const placeholders = seekerIds.map(() => '?').join(',');
    const history = db.prepare(`SELECT lt.*, u.nickname as seeker_nickname FROM location_tracking lt
      LEFT JOIN users u ON lt.seeker_id = u.id WHERE lt.guardian_id=? OR lt.seeker_id IN (${placeholders})
      ORDER BY lt.requested_at DESC LIMIT 50`).all(req.user.id, ...seekerIds);
    res.json({ success: true, history });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
