const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateUUID, calculateDistance } = require('../utils');
const { recomputeHelperLocation } = require('./helperSchedule');

// 创建求助：单阶段筛选，基于帮助者固定位置计划匹配的当前位置
router.post('/help/request', (req, res) => {
  const { seeker_id, latitude, longitude, address, reason, disability_type, disability_detail, share_phone, seeker_phone } = req.body;
  if (!seeker_id || latitude == null || longitude == null) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  try {
    const helpId = generateUUID();
    db.prepare(`INSERT INTO help_requests (id, seeker_id, latitude, longitude, address,
      disability_type, disability_detail, reason, share_phone, seeker_phone, status, stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'ready')`).run(
      helpId, seeker_id, latitude, longitude, address || null,
      disability_type || null, disability_detail || null, reason || null,
      share_phone ? 1 : 0, seeker_phone || null);

    // 单阶段查询：基于帮助者当前位置（来自位置计划匹配）筛选5km内
    // 先对每个在线帮助者重新匹配当前位置，再计算距离
    const onlineHelpers = db.prepare(`
      SELECT u.id, u.nickname,
             hs.current_latitude AS lat,
             hs.current_longitude AS lon,
             hs.current_address AS addr
      FROM users u
      JOIN helper_status hs ON u.id = hs.user_id
      WHERE hs.status = 'online' AND u.role = 'helper'
    `).all();

    const candidates = [];
    for (const h of onlineHelpers) {
      // 实时重新计算位置（确保位置计划最新）
      const currentLoc = recomputeHelperLocation(h.id);
      if (!currentLoc) continue;

      const dist = calculateDistance(latitude, longitude, currentLoc.latitude, currentLoc.longitude);
      if (dist < 5000) {
        candidates.push({
          id: h.id,
          nickname: h.nickname,
          distance: Math.round(dist),
          address: currentLoc.address
        });
      }
    }

    // 按距离排序
    candidates.sort((a, b) => a.distance - b.distance);

    // 直接向范围内的帮助者发送求助推送（单阶段）
    for (const candidate of candidates) {
      db.prepare(`INSERT INTO push_notifications (id, recipient_id, type, title, body, data)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
        generateUUID(), candidate.id, 'help_request',
        '🆘 附近有人需要帮助！',
        (reason || '紧急求助') + '（距离约' + candidate.distance + '米）',
        JSON.stringify({
          help_id: helpId,
          distance: candidate.distance,
          seeker_lat: latitude,
          seeker_lon: longitude
        }));
    }

    res.json({
      success: true,
      help_id: helpId,
      candidates_count: candidates.length,
      candidates,
      stage: 'ready',
      message: '已通知附近' + candidates.length + '位帮助者'
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
    // 距离验证（可选，使用帮助者当前缓存位置或传入的实时位置）
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

