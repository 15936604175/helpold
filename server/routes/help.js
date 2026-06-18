const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateUUID, calculateDistance } = require('../utils');

router.post('/help/request', (req, res) => {
  const { seeker_id, latitude, longitude, address, reason, disability_type, disability_detail, share_phone, seeker_phone } = req.body;
  if (!seeker_id || latitude == null || longitude == null) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  try {
    const helpId = generateUUID();
    db.prepare(`INSERT INTO help_requests (id, seeker_id, latitude, longitude, address,
      disability_type, disability_detail, reason, share_phone, seeker_phone, status, stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'filtering')`).run(
      helpId, seeker_id, latitude, longitude, address || null,
      disability_type || null, disability_detail || null, reason || null,
      share_phone ? 1 : 0, seeker_phone || null);

    // 阶段1：查询附近5km范围内的在线帮助者（根据历史位置）
    const helpers = db.prepare(`
      SELECT u.id, u.nickname, ul.latitude as ulat, ul.longitude as ulon
      FROM users u
      JOIN helper_status hs ON u.id = hs.user_id
      LEFT JOIN user_locations ul ON u.id = ul.user_id
      WHERE hs.status = 'online' AND u.role = 'helper'
    `).all();

    const candidates = [];
    for (const h of helpers) {
      if (h.ulat != null) {
        const dist = calculateDistance(latitude, longitude, h.ulat, h.ulon);
        if (dist < 5000) candidates.push({ id: h.id, nickname: h.nickname, distance: dist });
      }
    }

    // 为每个候选帮助者发送推送请求（记录到 push_notifications）
    for (const candidate of candidates) {
      db.prepare(`INSERT INTO push_notifications (id, recipient_id, type, title, body, data)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
        generateUUID(), candidate.id, 'location_request',
        '附近有人需要帮助', '请上报您的位置以确认是否响应',
        JSON.stringify({ help_id: helpId, seeker_lat: latitude, seeker_lon: longitude }));
    }

    res.json({
      success: true,
      help_id: helpId,
      candidates_count: candidates.length,
      stage: 'filtering',
      message: '阶段1完成：已通知附近' + candidates.length + '位帮助者上报位置'
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/help/filter-complete/:helpId', (req, res) => {
  const helpId = req.params.helpId;
  try {
    const help = db.prepare('SELECT * FROM help_requests WHERE id = ?').get(helpId);
    if (!help) return res.status(404).json({ success: false, error: '求助不存在' });

    // 阶段2：根据 help_candidates 中的上报位置，筛选2km内的帮助者
    const candidates = db.prepare(`
      SELECT hc.helper_id, hc.latitude, hc.longitude, u.nickname
      FROM help_candidates hc
      JOIN users u ON hc.helper_id = u.id
      WHERE hc.help_id = ? AND hc.created_at > datetime('now','-5 minutes')
    `).all(helpId);

    const filtered = [];
    for (const c of candidates) {
      const dist = calculateDistance(help.latitude, help.longitude, c.latitude, c.longitude);
      if (dist < 2000) {
        filtered.push({ helper_id: c.helper_id, nickname: c.nickname, distance: dist });
        db.prepare(`INSERT INTO push_notifications (id, recipient_id, type, title, body, data)
          VALUES (?, ?, ?, ?, ?, ?)`).run(
          generateUUID(), c.helper_id, 'help_request',
          '🆘 附近有人需要帮助！', (help.reason || '紧急求助') + '（距离' + Math.round(dist) + '米）',
          JSON.stringify({ help_id: helpId, distance: dist, seeker_nickname: help.seeker_id }));
      }
    }

    db.prepare("UPDATE help_requests SET stage='ready' WHERE id = ?").run(helpId);
    res.json({
      success: true,
      help_id: helpId,
      filtered_count: filtered.length,
      filtered
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/help/request/:id', (req, res) => {
  try {
    const help = db.prepare(`SELECT hr.*, u.nickname as seeker_nickname
      FROM help_requests hr LEFT JOIN users u ON hr.seeker_id = u.id WHERE hr.id = ?`).get(req.params.id);
    res.json({ success: true, request: help });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/help/request/:id/cancel', (req, res) => {
  db.prepare("UPDATE help_requests SET status='cancelled', resolved_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

router.post('/help/request/:id/accept', (req, res) => {
  const { helper_id, latitude, longitude } = req.body;
  try {
    const help = db.prepare('SELECT * FROM help_requests WHERE id = ?').get(req.params.id);
    if (!help) return res.status(404).json({ success: false, error: '求助不存在' });
    if (help.status !== 'pending') {
      return res.status(400).json({ success: false, error: '此求助已被响应或取消' });
    }
    // 验证距离
    if (latitude != null && longitude != null) {
      const dist = calculateDistance(help.latitude, help.longitude, latitude, longitude);
      if (dist > 5000) {
        return res.status(400).json({ success: false, error: '距离过远（超过5km）' });
      }
    }
    db.prepare(`UPDATE help_requests SET status='accepted', accepted_by=?,
      resolved_at=CURRENT_TIMESTAMP WHERE id=?`).run(helper_id, req.params.id);

    // 通知求助者
    db.prepare(`INSERT INTO push_notifications (id, recipient_id, type, title, body, data)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      generateUUID(), help.seeker_id, 'accepted', '有人来帮你了！',
      '帮助者已接单，正在赶来', JSON.stringify({ helper_id }));

    res.json({ success: true, message: '接单成功' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/help/nearby', (req, res) => {
  const { lat, lon, radius = 5000 } = req.query;
  try {
    const requests = db.prepare(`SELECT hr.*, u.nickname as seeker_nickname
      FROM help_requests hr LEFT JOIN users u ON hr.seeker_id = u.id
      WHERE hr.status='pending' ORDER BY hr.created_at DESC LIMIT 20`).all();
    const result = requests.map(r => {
      let distance = null;
      if (lat != null && lon != null) {
        distance = calculateDistance(parseFloat(lat), parseFloat(lon), r.latitude, r.longitude);
      }
      return { ...r, distance };
    });
    res.json({ success: true, requests: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
